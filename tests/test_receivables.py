"""
Phase 4: Receivable -- annual uniqueness, ending balance, and the OBD-005
pending overdue-percentage rule (must remain undefined, never fabricated).
"""
import datetime
from decimal import Decimal

from django.db import IntegrityError, transaction
from django.test import Client, TestCase
from django.urls import reverse

from apps.accounts.models import User
from apps.branches.models import Branch
from apps.budget_years.models import BudgetYear
from apps.receivables.models import Receivable
from apps.schools.models import School


class ReceivableTestBase(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="RECVBR", name="Receivable Branch")
        self.other_branch = Branch.objects.create(code="RECVBR2", name="Receivable Other Branch")
        self.school = School.objects.create(branch=self.branch, code="RECVSCH", name="Receivable School")
        self.other_school = School.objects.create(
            branch=self.other_branch, code="RECVSCH2", name="Receivable Other School"
        )
        self.budget_year = BudgetYear.objects.create(
            name="TA RECV", start_date=datetime.date(2026, 7, 1), end_date=datetime.date(2027, 6, 30)
        )
        self.central_user = User.objects.create_user(
            username="recv.central", name="Recv Central", password="a-strong-password",
            role=User.Role.CENTRAL,
        )
        self.branch_user = User.objects.create_user(
            username="recv.branch", name="Recv Branch", password="a-strong-password",
            role=User.Role.BRANCH, branch=self.branch,
        )
        self.other_branch_user = User.objects.create_user(
            username="recv.other.branch", name="Recv Other Branch", password="a-strong-password",
            role=User.Role.BRANCH, branch=self.other_branch,
        )

    def login(self, username):
        client = Client()
        client.login(username=username, password="a-strong-password")
        return client


class ReceivableModelTests(ReceivableTestBase):
    def test_annual_uniqueness(self):
        Receivable.objects.create(
            school=self.school, budget_year=self.budget_year,
            opening_balance=Decimal("100"), addition_amount=Decimal("50"), settlement_amount=Decimal("30"),
            created_by=self.branch_user, updated_by=self.branch_user,
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Receivable.objects.create(
                    school=self.school, budget_year=self.budget_year,
                    opening_balance=Decimal("1"), addition_amount=Decimal("1"), settlement_amount=Decimal("1"),
                    created_by=self.branch_user, updated_by=self.branch_user,
                )

    def test_opening_balance(self):
        record = Receivable(opening_balance=Decimal("100"), addition_amount=Decimal("50"), settlement_amount=Decimal("30"))
        self.assertEqual(record.opening_balance, Decimal("100"))

    def test_additions_and_settlements(self):
        record = Receivable(opening_balance=Decimal("100"), addition_amount=Decimal("50"), settlement_amount=Decimal("30"))
        self.assertEqual(record.addition_amount, Decimal("50"))
        self.assertEqual(record.settlement_amount, Decimal("30"))

    def test_ending_balance_calculation(self):
        record = Receivable(opening_balance=Decimal("100"), addition_amount=Decimal("50"), settlement_amount=Decimal("30"))
        self.assertEqual(record.ending_balance, Decimal("120"))

    def test_overdue_percentage_remains_undefined_per_obd_005(self):
        record = Receivable(opening_balance=Decimal("100"), addition_amount=Decimal("50"), settlement_amount=Decimal("30"))
        self.assertIsNone(record.overdue_percentage)

    def test_negative_settlement_rejected(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Receivable.objects.create(
                    school=self.school, budget_year=self.budget_year,
                    opening_balance=Decimal("0"), addition_amount=Decimal("0"), settlement_amount=Decimal("-1"),
                    created_by=self.branch_user, updated_by=self.branch_user,
                )


class ReceivableSecurityTests(ReceivableTestBase):
    def setUp(self):
        super().setUp()
        self.record = Receivable.objects.create(
            school=self.school, budget_year=self.budget_year,
            opening_balance=Decimal("100"), addition_amount=Decimal("50"), settlement_amount=Decimal("30"),
            created_by=self.branch_user, updated_by=self.branch_user,
        )

    def test_anonymous_redirected(self):
        response = Client().get(reverse("receivables:list"))
        self.assertEqual(response.status_code, 302)

    def test_branch_isolation(self):
        Receivable.objects.create(
            school=self.other_school, budget_year=self.budget_year,
            opening_balance=Decimal("1"), addition_amount=Decimal("1"), settlement_amount=Decimal("1"),
            created_by=self.other_branch_user, updated_by=self.other_branch_user,
        )
        client = self.login("recv.branch")
        response = client.get(reverse("receivables:list"))
        self.assertContains(response, self.school.name)
        self.assertNotContains(response, self.other_school.name)

    def test_overdue_percentage_shown_as_not_defined_in_ui(self):
        client = self.login("recv.branch")
        response = client.get(reverse("receivables:list"))
        self.assertContains(response, "Not defined")

    def test_central_cannot_create(self):
        client = self.login("recv.central")
        response = client.post(
            reverse("receivables:create"),
            {
                "school": self.school.id, "budget_year": self.budget_year.id,
                "opening_balance": "1", "addition_amount": "1", "settlement_amount": "1",
            },
        )
        self.assertEqual(response.status_code, 403)

    def test_central_cannot_edit(self):
        client = self.login("recv.central")
        response = client.post(
            reverse("receivables:edit", args=[self.record.pk]),
            {"opening_balance": "999", "addition_amount": "0", "settlement_amount": "0"},
        )
        self.assertEqual(response.status_code, 403)

    def test_branch_cannot_edit_another_branchs_record(self):
        client = self.login("recv.other.branch")
        response = client.post(
            reverse("receivables:edit", args=[self.record.pk]),
            {"opening_balance": "999", "addition_amount": "0", "settlement_amount": "0"},
        )
        self.assertEqual(response.status_code, 403)
