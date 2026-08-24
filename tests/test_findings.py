"""Phase 4: Finding -- OBD-007 status values, completed_date rule, and
branch-scoped authorization."""
import datetime
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import Client, TestCase
from django.urls import reverse

from apps.accounts.models import User
from apps.branches.models import Branch
from apps.findings.models import Finding, FindingStatus
from apps.schools.models import School


class FindingTestBase(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="FINDBR", name="Finding Branch")
        self.other_branch = Branch.objects.create(code="FINDBR2", name="Finding Other Branch")
        self.school = School.objects.create(branch=self.branch, code="FINDSCH", name="Finding School")
        self.other_school = School.objects.create(
            branch=self.other_branch, code="FINDSCH2", name="Finding Other School"
        )
        self.central_user = User.objects.create_user(
            username="find.central", name="Find Central", password="a-strong-password",
            role=User.Role.CENTRAL,
        )
        self.branch_user = User.objects.create_user(
            username="find.branch", name="Find Branch", password="a-strong-password",
            role=User.Role.BRANCH, branch=self.branch,
        )
        self.other_branch_user = User.objects.create_user(
            username="find.other.branch", name="Find Other Branch", password="a-strong-password",
            role=User.Role.BRANCH, branch=self.other_branch,
        )

    def login(self, username):
        client = Client()
        client.login(username=username, password="a-strong-password")
        return client

    def make_finding(self, **kwargs):
        defaults = dict(
            school=self.school,
            finding_date=datetime.date(2026, 8, 1),
            source="Internal Audit",
            finding="Missing receipt",
            recommendation="Provide receipt",
            pic="John Doe",
            deadline=datetime.date(2026, 9, 1),
            status=FindingStatus.OPEN,
            created_by=self.branch_user,
            updated_by=self.branch_user,
        )
        defaults.update(kwargs)
        return Finding.objects.create(**defaults)


class FindingModelTests(FindingTestBase):
    def test_creation(self):
        finding = self.make_finding()
        self.assertIsNotNone(finding.pk)

    def test_school_relationship_required(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                self.make_finding(school=None)

    def test_status_values_match_obd_007(self):
        self.assertEqual(
            {c[0] for c in FindingStatus.choices}, {"OPEN", "ON_PROGRESS", "COMPLETED"}
        )

    def test_dates_are_stored(self):
        finding = self.make_finding()
        self.assertEqual(finding.finding_date, datetime.date(2026, 8, 1))
        self.assertEqual(finding.deadline, datetime.date(2026, 9, 1))

    def test_risk_field_is_optional(self):
        finding = self.make_finding(risk=None)
        self.assertIsNone(finding.risk)

    def test_completed_status_requires_completed_date_db_level(self):
        finding = Finding(
            school=self.school, finding_date=datetime.date(2026, 8, 1), source="Audit",
            finding="x", recommendation="y", pic="PIC", deadline=datetime.date(2026, 9, 1),
            status=FindingStatus.COMPLETED, completed_date=None,
            created_by=self.branch_user, updated_by=self.branch_user,
        )
        # clean() runs first (application layer) -- but here completed_date
        # is None while status IS completed, so clean() does not object;
        # the DB CHECK constraint must catch this.
        with self.assertRaises((IntegrityError, ValidationError)):
            with transaction.atomic():
                finding.save()

    def test_completed_status_with_completed_date_succeeds(self):
        finding = self.make_finding(
            status=FindingStatus.COMPLETED, completed_date=datetime.date(2026, 9, 15)
        )
        self.assertEqual(finding.completed_date, datetime.date(2026, 9, 15))

    def test_open_status_with_completed_date_is_rejected(self):
        with self.assertRaises(ValidationError):
            self.make_finding(status=FindingStatus.OPEN, completed_date=datetime.date(2026, 9, 15))

    def test_on_progress_status_with_completed_date_is_rejected(self):
        with self.assertRaises(ValidationError):
            self.make_finding(
                status=FindingStatus.ON_PROGRESS, completed_date=datetime.date(2026, 9, 15)
            )

    def test_amount_non_negative(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                self.make_finding(amount=Decimal("-1"))


class FindingSecurityTests(FindingTestBase):
    def setUp(self):
        super().setUp()
        self.finding = self.make_finding()

    def test_anonymous_redirected(self):
        response = Client().get(reverse("findings:list"))
        self.assertEqual(response.status_code, 302)

    def test_branch_isolation(self):
        self.make_finding(school=self.other_school, created_by=self.other_branch_user, updated_by=self.other_branch_user)
        client = self.login("find.branch")
        response = client.get(reverse("findings:list"))
        self.assertContains(response, self.school.name)
        self.assertNotContains(response, self.other_school.name)

    def test_central_read_only(self):
        client = self.login("find.central")
        self.assertEqual(client.get(reverse("findings:list")).status_code, 200)
        response = client.post(
            reverse("findings:create"),
            {
                "school": self.school.id, "finding_date": "2026-08-01", "source": "Audit",
                "finding": "x", "recommendation": "y", "pic": "PIC", "deadline": "2026-09-01",
                "status": "OPEN",
            },
        )
        self.assertEqual(response.status_code, 403)

    def test_central_cannot_edit(self):
        client = self.login("find.central")
        response = client.post(
            reverse("findings:edit", args=[self.finding.pk]),
            {
                "finding_date": "2026-08-01", "source": "Audit", "finding": "hijacked",
                "recommendation": "y", "pic": "PIC", "deadline": "2026-09-01", "status": "OPEN",
            },
        )
        self.assertEqual(response.status_code, 403)

    def test_branch_cannot_edit_another_branchs_finding(self):
        client = self.login("find.other.branch")
        response = client.post(
            reverse("findings:edit", args=[self.finding.pk]),
            {
                "finding_date": "2026-08-01", "source": "Audit", "finding": "hijacked",
                "recommendation": "y", "pic": "PIC", "deadline": "2026-09-01", "status": "OPEN",
            },
        )
        self.assertEqual(response.status_code, 403)

    def test_branch_cannot_create_for_another_branch(self):
        client = self.login("find.branch")
        response = client.post(
            reverse("findings:create"),
            {
                "school": self.other_school.id, "finding_date": "2026-08-01", "source": "Audit",
                "finding": "x", "recommendation": "y", "pic": "PIC", "deadline": "2026-09-01",
                "status": "OPEN",
            },
        )
        self.assertFalse(Finding.objects.filter(school=self.other_school).exists())
