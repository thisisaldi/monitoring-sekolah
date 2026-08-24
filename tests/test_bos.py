"""Phase 4: BOS -- annual uniqueness, ending balance, authorization."""
import datetime
from decimal import Decimal

from django.db import IntegrityError, transaction
from django.test import Client, TestCase
from django.urls import reverse

from apps.accounts.models import User
from apps.bos.models import BOSRecord, ReportStatus
from apps.branches.models import Branch
from apps.budget_years.models import BudgetYear
from apps.schools.models import School


class BOSTestBase(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="BOSBR", name="BOS Branch")
        self.other_branch = Branch.objects.create(code="BOSBR2", name="BOS Other Branch")
        self.school = School.objects.create(branch=self.branch, code="BOSSCH", name="BOS School")
        self.other_school = School.objects.create(
            branch=self.other_branch, code="BOSSCH2", name="BOS Other School"
        )
        self.budget_year = BudgetYear.objects.create(
            name="TA BOS", start_date=datetime.date(2026, 7, 1), end_date=datetime.date(2027, 6, 30)
        )
        self.central_user = User.objects.create_user(
            username="bos.central", name="BOS Central", password="a-strong-password",
            role=User.Role.CENTRAL,
        )
        self.branch_user = User.objects.create_user(
            username="bos.branch", name="BOS Branch User", password="a-strong-password",
            role=User.Role.BRANCH, branch=self.branch,
        )
        self.other_branch_user = User.objects.create_user(
            username="bos.other.branch", name="BOS Other Branch User", password="a-strong-password",
            role=User.Role.BRANCH, branch=self.other_branch,
        )

    def login(self, username):
        client = Client()
        client.login(username=username, password="a-strong-password")
        return client


class BOSModelTests(BOSTestBase):
    def test_annual_uniqueness(self):
        BOSRecord.objects.create(
            school=self.school, budget_year=self.budget_year,
            opening_balance=Decimal("100"), receipt_amount=Decimal("50"), usage_amount=Decimal("30"),
            report_status=ReportStatus.COMPLETE,
            created_by=self.branch_user, updated_by=self.branch_user,
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                BOSRecord.objects.create(
                    school=self.school, budget_year=self.budget_year,
                    opening_balance=Decimal("1"), receipt_amount=Decimal("1"), usage_amount=Decimal("1"),
                    report_status=ReportStatus.COMPLETE,
                    created_by=self.branch_user, updated_by=self.branch_user,
                )

    def test_opening_balance(self):
        record = BOSRecord(opening_balance=Decimal("100"), receipt_amount=Decimal("50"), usage_amount=Decimal("30"))
        self.assertEqual(record.opening_balance, Decimal("100"))

    def test_receipt_and_usage(self):
        record = BOSRecord(opening_balance=Decimal("100"), receipt_amount=Decimal("50"), usage_amount=Decimal("30"))
        self.assertEqual(record.receipt_amount, Decimal("50"))
        self.assertEqual(record.usage_amount, Decimal("30"))

    def test_ending_balance_calculation(self):
        record = BOSRecord(opening_balance=Decimal("100"), receipt_amount=Decimal("50"), usage_amount=Decimal("30"))
        self.assertEqual(record.ending_balance, Decimal("120"))

    def test_negative_opening_balance_rejected(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                BOSRecord.objects.create(
                    school=self.school, budget_year=self.budget_year,
                    opening_balance=Decimal("-1"), receipt_amount=Decimal("0"), usage_amount=Decimal("0"),
                    report_status=ReportStatus.COMPLETE,
                    created_by=self.branch_user, updated_by=self.branch_user,
                )


class BOSSecurityTests(BOSTestBase):
    def setUp(self):
        super().setUp()
        self.record = BOSRecord.objects.create(
            school=self.school, budget_year=self.budget_year,
            opening_balance=Decimal("100"), receipt_amount=Decimal("50"), usage_amount=Decimal("30"),
            report_status=ReportStatus.COMPLETE,
            created_by=self.branch_user, updated_by=self.branch_user,
        )

    def test_anonymous_redirected(self):
        response = Client().get(reverse("bos:list"))
        self.assertEqual(response.status_code, 302)

    def test_branch_isolation(self):
        BOSRecord.objects.create(
            school=self.other_school, budget_year=self.budget_year,
            opening_balance=Decimal("1"), receipt_amount=Decimal("1"), usage_amount=Decimal("1"),
            report_status=ReportStatus.COMPLETE,
            created_by=self.other_branch_user, updated_by=self.other_branch_user,
        )
        client = self.login("bos.branch")
        response = client.get(reverse("bos:list"))
        self.assertContains(response, self.school.name)
        self.assertNotContains(response, self.other_school.name)

    def test_central_read_only(self):
        client = self.login("bos.central")
        response = client.get(reverse("bos:list"))
        self.assertEqual(response.status_code, 200)
        response = client.post(
            reverse("bos:create"),
            {
                "school": self.school.id, "budget_year": self.budget_year.id,
                "opening_balance": "1", "receipt_amount": "1", "usage_amount": "1",
                "report_status": "COMPLETE",
            },
        )
        self.assertEqual(response.status_code, 403)

    def test_central_cannot_edit(self):
        client = self.login("bos.central")
        response = client.post(
            reverse("bos:edit", args=[self.record.pk]),
            {"opening_balance": "999", "receipt_amount": "0", "usage_amount": "0", "report_status": "COMPLETE"},
        )
        self.assertEqual(response.status_code, 403)

    def test_branch_cannot_edit_another_branchs_record(self):
        client = self.login("bos.other.branch")
        response = client.post(
            reverse("bos:edit", args=[self.record.pk]),
            {"opening_balance": "999", "receipt_amount": "0", "usage_amount": "0", "report_status": "COMPLETE"},
        )
        self.assertEqual(response.status_code, 403)

    def test_branch_cannot_create_for_another_branch(self):
        client = self.login("bos.branch")
        response = client.post(
            reverse("bos:create"),
            {
                "school": self.other_school.id, "budget_year": self.budget_year.id,
                "opening_balance": "1", "receipt_amount": "1", "usage_amount": "1",
                "report_status": "COMPLETE",
            },
        )
        self.assertFalse(BOSRecord.objects.filter(school=self.other_school).exists())
