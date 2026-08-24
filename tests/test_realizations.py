"""
Phase 4: Monthly and Semester Realization -- models, calculations,
authorization, and branch isolation.
"""
import datetime
from decimal import Decimal

from django.db import IntegrityError, transaction
from django.test import Client, TestCase
from django.urls import reverse

from apps.accounts.models import User
from apps.branches.models import Branch
from apps.budget_years.models import BudgetYear
from apps.realizations.models import MonthlyRealization, ReportStatus, SemesterRealization
from apps.realizations.services import get_semester_summary
from apps.rkas.models import RKAS
from apps.schools.models import School


class RealizationsTestBase(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="REALBR", name="Realization Branch")
        self.other_branch = Branch.objects.create(code="REALBR2", name="Realization Other Branch")
        self.school = School.objects.create(branch=self.branch, code="REALSCH", name="Realization School")
        self.other_school = School.objects.create(
            branch=self.other_branch, code="REALSCH2", name="Realization Other School"
        )
        self.budget_year = BudgetYear.objects.create(
            name="TA REAL", start_date=datetime.date(2026, 7, 1), end_date=datetime.date(2027, 6, 30)
        )
        self.central_user = User.objects.create_user(
            username="real.central", name="Real Central", password="a-strong-password",
            role=User.Role.CENTRAL,
        )
        self.branch_user = User.objects.create_user(
            username="real.branch", name="Real Branch", password="a-strong-password",
            role=User.Role.BRANCH, branch=self.branch,
        )
        self.other_branch_user = User.objects.create_user(
            username="real.other.branch", name="Real Other Branch", password="a-strong-password",
            role=User.Role.BRANCH, branch=self.other_branch,
        )

    def login(self, username):
        client = Client()
        client.login(username=username, password="a-strong-password")
        return client


class MonthlyRealizationModelTests(RealizationsTestBase):
    def test_creation(self):
        record = MonthlyRealization.objects.create(
            school=self.school, budget_year=self.budget_year, month=7,
            budget_amount=Decimal("1000000"), realization_amount=Decimal("750000"),
            report_status=ReportStatus.COMPLETE,
            created_by=self.branch_user, updated_by=self.branch_user,
        )
        self.assertIsNotNone(record.pk)

    def test_unique_per_school_budget_year_month(self):
        MonthlyRealization.objects.create(
            school=self.school, budget_year=self.budget_year, month=7,
            budget_amount=Decimal("1000000"), realization_amount=Decimal("750000"),
            report_status=ReportStatus.COMPLETE,
            created_by=self.branch_user, updated_by=self.branch_user,
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                MonthlyRealization.objects.create(
                    school=self.school, budget_year=self.budget_year, month=7,
                    budget_amount=Decimal("2000000"), realization_amount=Decimal("100000"),
                    report_status=ReportStatus.INCOMPLETE,
                    created_by=self.branch_user, updated_by=self.branch_user,
                )

    def test_variance_calculation(self):
        record = MonthlyRealization(
            budget_amount=Decimal("1000000"), realization_amount=Decimal("750000")
        )
        self.assertEqual(record.variance, Decimal("250000"))

    def test_percentage_calculation(self):
        record = MonthlyRealization(
            budget_amount=Decimal("1000000"), realization_amount=Decimal("750000")
        )
        self.assertEqual(record.realization_percentage, Decimal("75.00"))

    def test_zero_budget_percentage_is_none_not_error(self):
        record = MonthlyRealization(budget_amount=Decimal("0"), realization_amount=Decimal("0"))
        self.assertIsNone(record.realization_percentage)

    def test_month_out_of_range_rejected(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                MonthlyRealization.objects.create(
                    school=self.school, budget_year=self.budget_year, month=13,
                    budget_amount=Decimal("1"), realization_amount=Decimal("1"),
                    report_status=ReportStatus.COMPLETE,
                    created_by=self.branch_user, updated_by=self.branch_user,
                )

    def test_report_status_values_match_database_schema(self):
        self.assertEqual({c[0] for c in ReportStatus.choices}, {"COMPLETE", "INCOMPLETE"})


class MonthlyRealizationSecurityTests(RealizationsTestBase):
    def setUp(self):
        super().setUp()
        self.record = MonthlyRealization.objects.create(
            school=self.school, budget_year=self.budget_year, month=7,
            budget_amount=Decimal("1000000"), realization_amount=Decimal("750000"),
            report_status=ReportStatus.COMPLETE,
            created_by=self.branch_user, updated_by=self.branch_user,
        )

    def test_anonymous_redirected(self):
        response = Client().get(reverse("realizations:monthly_list"))
        self.assertEqual(response.status_code, 302)

    def test_branch_sees_only_own_school_records(self):
        MonthlyRealization.objects.create(
            school=self.other_school, budget_year=self.budget_year, month=7,
            budget_amount=Decimal("1"), realization_amount=Decimal("1"),
            report_status=ReportStatus.COMPLETE,
            created_by=self.other_branch_user, updated_by=self.other_branch_user,
        )
        client = self.login("real.branch")
        response = client.get(reverse("realizations:monthly_list"))
        self.assertContains(response, self.school.name)
        self.assertNotContains(response, self.other_school.name)

    def test_central_read_only_cannot_create(self):
        client = self.login("real.central")
        response = client.post(
            reverse("realizations:monthly_create"),
            {
                "school": self.school.id, "budget_year": self.budget_year.id, "month": 8,
                "budget_amount": "1", "realization_amount": "1", "report_status": "COMPLETE",
            },
        )
        self.assertEqual(response.status_code, 403)

    def test_central_read_only_cannot_edit(self):
        client = self.login("real.central")
        response = client.post(
            reverse("realizations:monthly_edit", args=[self.record.pk]),
            {"budget_amount": "1", "realization_amount": "1", "report_status": "COMPLETE"},
        )
        self.assertEqual(response.status_code, 403)

    def test_branch_cannot_edit_another_branchs_record(self):
        client = self.login("real.other.branch")
        response = client.post(
            reverse("realizations:monthly_edit", args=[self.record.pk]),
            {"budget_amount": "999", "realization_amount": "999", "report_status": "COMPLETE"},
        )
        self.assertEqual(response.status_code, 403)
        self.record.refresh_from_db()
        self.assertEqual(self.record.budget_amount, Decimal("1000000"))

    def test_branch_cannot_create_for_another_branchs_school(self):
        client = self.login("real.branch")
        response = client.post(
            reverse("realizations:monthly_create"),
            {
                "school": self.other_school.id, "budget_year": self.budget_year.id, "month": 8,
                "budget_amount": "1", "realization_amount": "1", "report_status": "COMPLETE",
            },
        )
        self.assertFalse(
            MonthlyRealization.objects.filter(school=self.other_school, month=8).exists()
        )


class SemesterRealizationTests(RealizationsTestBase):
    def test_semester_1_creation(self):
        record = SemesterRealization.objects.create(
            school=self.school, budget_year=self.budget_year, semester=1,
            realization_amount=Decimal("500000"),
            created_by=self.branch_user, updated_by=self.branch_user,
        )
        self.assertEqual(record.semester, 1)

    def test_semester_2_creation(self):
        record = SemesterRealization.objects.create(
            school=self.school, budget_year=self.budget_year, semester=2,
            realization_amount=Decimal("300000"),
            created_by=self.branch_user, updated_by=self.branch_user,
        )
        self.assertEqual(record.semester, 2)

    def test_unique_per_school_budget_year_semester(self):
        SemesterRealization.objects.create(
            school=self.school, budget_year=self.budget_year, semester=1,
            realization_amount=Decimal("500000"),
            created_by=self.branch_user, updated_by=self.branch_user,
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                SemesterRealization.objects.create(
                    school=self.school, budget_year=self.budget_year, semester=1,
                    realization_amount=Decimal("600000"),
                    created_by=self.branch_user, updated_by=self.branch_user,
                )

    def test_semester_must_be_1_or_2(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                SemesterRealization.objects.create(
                    school=self.school, budget_year=self.budget_year, semester=3,
                    realization_amount=Decimal("1"),
                    created_by=self.branch_user, updated_by=self.branch_user,
                )

    def test_summary_total_is_sum_of_both_semesters(self):
        SemesterRealization.objects.create(
            school=self.school, budget_year=self.budget_year, semester=1,
            realization_amount=Decimal("500000"),
            created_by=self.branch_user, updated_by=self.branch_user,
        )
        SemesterRealization.objects.create(
            school=self.school, budget_year=self.budget_year, semester=2,
            realization_amount=Decimal("300000"),
            created_by=self.branch_user, updated_by=self.branch_user,
        )
        summary = get_semester_summary(self.school, self.budget_year)
        self.assertEqual(summary["total_realization"], Decimal("800000"))

    def test_summary_percentages_and_remaining_budget(self):
        RKAS.objects.create(
            school=self.school, budget_year=self.budget_year, initial_amount=Decimal("1000000"),
            created_by=self.branch_user, updated_by=self.branch_user,
        )
        SemesterRealization.objects.create(
            school=self.school, budget_year=self.budget_year, semester=1,
            realization_amount=Decimal("500000"),
            created_by=self.branch_user, updated_by=self.branch_user,
        )
        SemesterRealization.objects.create(
            school=self.school, budget_year=self.budget_year, semester=2,
            realization_amount=Decimal("300000"),
            created_by=self.branch_user, updated_by=self.branch_user,
        )
        summary = get_semester_summary(self.school, self.budget_year)
        self.assertEqual(summary["percentage_semester_1"], Decimal("50.00"))
        self.assertEqual(summary["percentage_final"], Decimal("80.00"))
        self.assertEqual(summary["remaining_budget"], Decimal("200000"))

    def test_summary_handles_missing_rkas_safely(self):
        SemesterRealization.objects.create(
            school=self.school, budget_year=self.budget_year, semester=1,
            realization_amount=Decimal("500000"),
            created_by=self.branch_user, updated_by=self.branch_user,
        )
        summary = get_semester_summary(self.school, self.budget_year)
        self.assertIsNone(summary["percentage_semester_1"])
        self.assertIsNone(summary["remaining_budget"])

    def test_summary_handles_no_data_at_all(self):
        summary = get_semester_summary(self.school, self.budget_year)
        self.assertIsNone(summary["total_realization"])
        self.assertIsNone(summary["percentage_final"])


class SemesterRealizationSecurityTests(RealizationsTestBase):
    def setUp(self):
        super().setUp()
        self.record = SemesterRealization.objects.create(
            school=self.school, budget_year=self.budget_year, semester=1,
            realization_amount=Decimal("500000"),
            created_by=self.branch_user, updated_by=self.branch_user,
        )

    def test_anonymous_redirected(self):
        response = Client().get(reverse("realizations:semester_list"))
        self.assertEqual(response.status_code, 302)

    def test_branch_isolation_in_list(self):
        SemesterRealization.objects.create(
            school=self.other_school, budget_year=self.budget_year, semester=1,
            realization_amount=Decimal("1"),
            created_by=self.other_branch_user, updated_by=self.other_branch_user,
        )
        client = self.login("real.branch")
        response = client.get(reverse("realizations:semester_list"))
        self.assertContains(response, self.school.name)
        self.assertNotContains(response, self.other_school.name)

    def test_central_cannot_create(self):
        client = self.login("real.central")
        response = client.post(
            reverse("realizations:semester_create"),
            {
                "school": self.school.id, "budget_year": self.budget_year.id,
                "semester": 2, "realization_amount": "1",
            },
        )
        self.assertEqual(response.status_code, 403)

    def test_central_cannot_edit(self):
        client = self.login("real.central")
        response = client.post(
            reverse("realizations:semester_edit", args=[self.record.pk]),
            {"realization_amount": "999"},
        )
        self.assertEqual(response.status_code, 403)

    def test_branch_cannot_view_another_branchs_summary(self):
        client = self.login("real.other.branch")
        response = client.get(
            reverse("realizations:semester_summary", args=[self.school.id, self.budget_year.id])
        )
        self.assertEqual(response.status_code, 403)

    def test_central_can_view_any_summary(self):
        client = self.login("real.central")
        response = client.get(
            reverse("realizations:semester_summary", args=[self.school.id, self.budget_year.id])
        )
        self.assertEqual(response.status_code, 200)
