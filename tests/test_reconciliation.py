"""Phase 4: Reconciliation -- annual uniqueness, difference, and the
exact OBD-006 status rule (no invented tolerance threshold)."""
import datetime
from decimal import Decimal

from django.db import IntegrityError, transaction
from django.test import Client, TestCase
from django.urls import reverse

from apps.accounts.models import User
from apps.branches.models import Branch
from apps.budget_years.models import BudgetYear
from apps.reconciliation.models import Reconciliation, ReconciliationStatus
from apps.schools.models import School


class ReconciliationTestBase(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="RECBR", name="Reconciliation Branch")
        self.other_branch = Branch.objects.create(code="RECBR2", name="Reconciliation Other Branch")
        self.school = School.objects.create(branch=self.branch, code="RECSCH", name="Reconciliation School")
        self.other_school = School.objects.create(
            branch=self.other_branch, code="RECSCH2", name="Reconciliation Other School"
        )
        self.budget_year = BudgetYear.objects.create(
            name="TA REC", start_date=datetime.date(2026, 7, 1), end_date=datetime.date(2027, 6, 30)
        )
        self.central_user = User.objects.create_user(
            username="rec.central", name="Rec Central", password="a-strong-password",
            role=User.Role.CENTRAL,
        )
        self.branch_user = User.objects.create_user(
            username="rec.branch", name="Rec Branch", password="a-strong-password",
            role=User.Role.BRANCH, branch=self.branch,
        )
        self.other_branch_user = User.objects.create_user(
            username="rec.other.branch", name="Rec Other Branch", password="a-strong-password",
            role=User.Role.BRANCH, branch=self.other_branch,
        )

    def login(self, username):
        client = Client()
        client.login(username=username, password="a-strong-password")
        return client


class ReconciliationModelTests(ReconciliationTestBase):
    def test_annual_uniqueness(self):
        Reconciliation.objects.create(
            school=self.school, budget_year=self.budget_year,
            financial_statement_balance=Decimal("100"), bank_balance=Decimal("100"),
            created_by=self.branch_user, updated_by=self.branch_user,
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Reconciliation.objects.create(
                    school=self.school, budget_year=self.budget_year,
                    financial_statement_balance=Decimal("1"), bank_balance=Decimal("1"),
                    created_by=self.branch_user, updated_by=self.branch_user,
                )

    def test_financial_statement_and_bank_balance(self):
        record = Reconciliation(financial_statement_balance=Decimal("100"), bank_balance=Decimal("90"))
        self.assertEqual(record.financial_statement_balance, Decimal("100"))
        self.assertEqual(record.bank_balance, Decimal("90"))

    def test_difference_calculation(self):
        record = Reconciliation(financial_statement_balance=Decimal("100"), bank_balance=Decimal("90"))
        self.assertEqual(record.difference, Decimal("-10"))

    def test_status_sesuai_when_difference_zero(self):
        record = Reconciliation(financial_statement_balance=Decimal("100"), bank_balance=Decimal("100"))
        self.assertEqual(record.status, ReconciliationStatus.SESUAI)

    def test_status_tidak_sesuai_when_difference_nonzero(self):
        record = Reconciliation(financial_statement_balance=Decimal("100"), bank_balance=Decimal("99.99"))
        self.assertEqual(record.status, ReconciliationStatus.TIDAK_SESUAI)

    def test_no_tolerance_threshold_even_for_tiny_difference(self):
        """OBD-006 explicitly forbids a tolerance threshold in the MVP."""
        record = Reconciliation(financial_statement_balance=Decimal("1000000.00"), bank_balance=Decimal("1000000.01"))
        self.assertEqual(record.status, ReconciliationStatus.TIDAK_SESUAI)


class ReconciliationSecurityTests(ReconciliationTestBase):
    def setUp(self):
        super().setUp()
        self.record = Reconciliation.objects.create(
            school=self.school, budget_year=self.budget_year,
            financial_statement_balance=Decimal("100"), bank_balance=Decimal("90"),
            created_by=self.branch_user, updated_by=self.branch_user,
        )

    def test_anonymous_redirected(self):
        response = Client().get(reverse("reconciliation:list"))
        self.assertEqual(response.status_code, 302)

    def test_branch_isolation(self):
        Reconciliation.objects.create(
            school=self.other_school, budget_year=self.budget_year,
            financial_statement_balance=Decimal("1"), bank_balance=Decimal("1"),
            created_by=self.other_branch_user, updated_by=self.other_branch_user,
        )
        client = self.login("rec.branch")
        response = client.get(reverse("reconciliation:list"))
        self.assertContains(response, self.school.name)
        self.assertNotContains(response, self.other_school.name)

    def test_central_read_only(self):
        client = self.login("rec.central")
        self.assertEqual(client.get(reverse("reconciliation:list")).status_code, 200)
        response = client.post(
            reverse("reconciliation:create"),
            {
                "school": self.school.id, "budget_year": self.budget_year.id,
                "financial_statement_balance": "1", "bank_balance": "1",
            },
        )
        self.assertEqual(response.status_code, 403)

    def test_central_cannot_edit(self):
        client = self.login("rec.central")
        response = client.post(
            reverse("reconciliation:edit", args=[self.record.pk]),
            {"financial_statement_balance": "999", "bank_balance": "999"},
        )
        self.assertEqual(response.status_code, 403)

    def test_branch_cannot_edit_another_branchs_record(self):
        client = self.login("rec.other.branch")
        response = client.post(
            reverse("reconciliation:edit", args=[self.record.pk]),
            {"financial_statement_balance": "999", "bank_balance": "999"},
        )
        self.assertEqual(response.status_code, 403)
