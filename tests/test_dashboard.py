"""
Phase 5: Dashboard -- derived aggregation + school-level monitoring, no
stored metrics, no N+1, no fabricated business rules for items that
remain TBD/Open per DATA-MAPPING.md.
"""
import datetime
from decimal import Decimal

from django.db import connection
from django.test import Client, TestCase
from django.test.utils import CaptureQueriesContext
from django.urls import reverse

from apps.accounts.models import User
from apps.bos.models import ReportStatus as BOSReportStatus  # noqa: F401
from apps.branches.models import Branch
from apps.budget_years.models import BudgetYear
from apps.dashboard.services import get_dashboard_metrics, get_school_monitoring_rows
from apps.findings.models import Finding, FindingStatus
from apps.realizations.models import MonthlyRealization, ReportStatus
from apps.reconciliation.models import Reconciliation
from apps.rkas.models import RKAS
from apps.schools.models import School


class DashboardServiceTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="DASHBR", name="Dashboard Branch")
        self.other_branch = Branch.objects.create(code="DASHBR2", name="Dashboard Other Branch")
        self.school = School.objects.create(branch=self.branch, code="DASHSCH", name="Dashboard School")
        self.other_school = School.objects.create(
            branch=self.other_branch, code="DASHSCH2", name="Dashboard Other School"
        )
        self.budget_year = BudgetYear.objects.create(
            name="TA DASH", start_date=datetime.date(2026, 7, 1), end_date=datetime.date(2027, 6, 30),
            is_active=True,
        )
        self.user = User.objects.create_user(
            username="dash.user", name="Dash User", password="a-strong-password",
            role=User.Role.BRANCH, branch=self.branch,
        )

    def test_central_aggregation_counts_all_branches(self):
        metrics = get_dashboard_metrics(branch=None, budget_year=self.budget_year)
        self.assertEqual(metrics["total_schools"], 2)
        self.assertEqual(metrics["total_branches"], 2)

    def test_branch_scoped_aggregation_counts_only_own_branch(self):
        metrics = get_dashboard_metrics(branch=self.branch, budget_year=self.budget_year)
        self.assertEqual(metrics["total_schools"], 1)
        self.assertEqual(metrics["total_branches"], 1)

    def test_monthly_incomplete_count_is_never_computed(self):
        """
        OBD-DM-006: the completeness definition is unresolved. This must
        stay None regardless of how much monthly data exists -- proving no
        rule (e.g. "12 records", "report_status=COMPLETE") was silently
        reintroduced.
        """
        for month in range(1, 13):
            MonthlyRealization.objects.create(
                school=self.school, budget_year=self.budget_year, month=month,
                budget_amount=Decimal("1"), realization_amount=Decimal("1"),
                report_status=ReportStatus.COMPLETE,
                created_by=self.user, updated_by=self.user,
            )
        metrics = get_dashboard_metrics(branch=self.branch, budget_year=self.budget_year)
        self.assertIsNone(metrics["monthly_incomplete_count"])

    def test_reconciliation_problem_count(self):
        Reconciliation.objects.create(
            school=self.school, budget_year=self.budget_year,
            financial_statement_balance=Decimal("100"), bank_balance=Decimal("90"),
            created_by=self.user, updated_by=self.user,
        )
        metrics = get_dashboard_metrics(branch=self.branch, budget_year=self.budget_year)
        self.assertEqual(metrics["reconciliation_problem_count"], 1)

    def test_reconciliation_problem_count_zero_when_balanced(self):
        Reconciliation.objects.create(
            school=self.school, budget_year=self.budget_year,
            financial_statement_balance=Decimal("100"), bank_balance=Decimal("100"),
            created_by=self.user, updated_by=self.user,
        )
        metrics = get_dashboard_metrics(branch=self.branch, budget_year=self.budget_year)
        self.assertEqual(metrics["reconciliation_problem_count"], 0)

    def test_open_findings_count_excludes_completed(self):
        Finding.objects.create(
            school=self.school, finding_date=datetime.date(2026, 8, 1), source="Audit",
            finding="x", recommendation="y", pic="PIC", deadline=datetime.date(2026, 9, 1),
            status=FindingStatus.OPEN, created_by=self.user, updated_by=self.user,
        )
        Finding.objects.create(
            school=self.school, finding_date=datetime.date(2026, 8, 1), source="Audit",
            finding="x", recommendation="y", pic="PIC", deadline=datetime.date(2026, 9, 1),
            status=FindingStatus.COMPLETED, completed_date=datetime.date(2026, 8, 15),
            created_by=self.user, updated_by=self.user,
        )
        metrics = get_dashboard_metrics(branch=self.branch, budget_year=self.budget_year)
        self.assertEqual(metrics["open_findings_count"], 1)

    def test_no_budget_year_returns_none_for_period_metrics(self):
        metrics = get_dashboard_metrics(branch=self.branch, budget_year=None)
        self.assertIsNone(metrics["monthly_incomplete_count"])
        self.assertIsNone(metrics["reconciliation_problem_count"])

    def test_no_n_plus_1_as_schools_grow(self):
        with CaptureQueriesContext(connection) as before:
            get_dashboard_metrics(branch=None, budget_year=self.budget_year)
        baseline = len(before.captured_queries)

        for i in range(10):
            branch = Branch.objects.create(code=f"DASHN{i}", name=f"Dash N Branch {i}")
            School.objects.create(branch=branch, code=f"DASHNS{i}", name=f"Dash N School {i}")

        with CaptureQueriesContext(connection) as after:
            get_dashboard_metrics(branch=None, budget_year=self.budget_year)

        self.assertEqual(len(after.captured_queries), baseline)


class SchoolMonitoringRowsTests(TestCase):
    """Tests for apps.dashboard.services.get_school_monitoring_rows."""

    def setUp(self):
        self.branch = Branch.objects.create(code="MONBR", name="Monitoring Branch")
        self.school = School.objects.create(branch=self.branch, code="MONSCH", name="Monitoring School")
        self.other_branch = Branch.objects.create(code="MONBR2", name="Monitoring Branch No Data")
        self.school_no_data = School.objects.create(
            branch=self.other_branch, code="MONSCH2", name="Monitoring School No Data"
        )
        self.budget_year = BudgetYear.objects.create(
            name="TA MON", start_date=datetime.date(2026, 7, 1), end_date=datetime.date(2027, 6, 30),
        )
        self.user = User.objects.create_user(
            username="mon.user", name="Mon User", password="a-strong-password",
            role=User.Role.BRANCH, branch=self.branch,
        )

    def test_rkas_uses_existing_current_amount_property(self):
        rkas = RKAS.objects.create(
            school=self.school, budget_year=self.budget_year, initial_amount=Decimal("1000000"),
            created_by=self.user, updated_by=self.user,
        )
        rows = get_school_monitoring_rows([self.school], self.budget_year)
        self.assertEqual(rows[0]["rkas"].current_amount, rkas.current_amount)
        self.assertEqual(rows[0]["rkas"].current_amount, Decimal("1000000"))

    def test_school_without_rkas_has_none(self):
        rows = get_school_monitoring_rows([self.school_no_data], self.budget_year)
        self.assertIsNone(rows[0]["rkas"])

    def test_reconciliation_uses_existing_status_property(self):
        Reconciliation.objects.create(
            school=self.school, budget_year=self.budget_year,
            financial_statement_balance=Decimal("100"), bank_balance=Decimal("100"),
            created_by=self.user, updated_by=self.user,
        )
        rows = get_school_monitoring_rows([self.school], self.budget_year)
        self.assertEqual(rows[0]["reconciliation"].status, "SESUAI")

    def test_school_without_reconciliation_has_none(self):
        rows = get_school_monitoring_rows([self.school_no_data], self.budget_year)
        self.assertIsNone(rows[0]["reconciliation"])

    def test_open_findings_count_per_school(self):
        Finding.objects.create(
            school=self.school, finding_date=datetime.date(2026, 8, 1), source="Audit",
            finding="x", recommendation="y", pic="PIC", deadline=datetime.date(2026, 9, 1),
            status=FindingStatus.OPEN, created_by=self.user, updated_by=self.user,
        )
        rows = get_school_monitoring_rows([self.school, self.school_no_data], self.budget_year)
        rows_by_school = {row["school"].id: row for row in rows}
        self.assertEqual(rows_by_school[self.school.id]["open_findings_count"], 1)
        self.assertEqual(rows_by_school[self.school_no_data.id]["open_findings_count"], 0)

    def test_none_budget_year_yields_no_rkas_or_reconciliation(self):
        RKAS.objects.create(
            school=self.school, budget_year=self.budget_year, initial_amount=Decimal("1"),
            created_by=self.user, updated_by=self.user,
        )
        rows = get_school_monitoring_rows([self.school], None)
        self.assertIsNone(rows[0]["rkas"])
        self.assertIsNone(rows[0]["reconciliation"])

    def test_no_n_plus_1_as_row_count_grows(self):
        schools = [self.school, self.school_no_data]
        for i in range(10):
            branch = Branch.objects.create(code=f"MONNBR{i}", name=f"Mon N Branch {i}")
            schools.append(
                School.objects.create(branch=branch, code=f"MONN{i}", name=f"Mon N School {i}")
            )

        with CaptureQueriesContext(connection) as ctx:
            get_school_monitoring_rows(schools, self.budget_year)
        # Bounded: RKAS + RKAS-revisions-prefetch + Reconciliation + Finding
        # aggregate = at most 4 queries, regardless of school count.
        self.assertLessEqual(len(ctx.captured_queries), 4)


class DashboardViewTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="DASHVBR", name="Dashboard View Branch")
        self.other_branch = Branch.objects.create(code="DASHVBR2", name="Dashboard View Other Branch")
        self.school = School.objects.create(
            branch=self.branch, code="DASHVSCH", name="Dashboard View School"
        )
        self.other_school = School.objects.create(
            branch=self.other_branch, code="DASHVSCH2", name="Dashboard View Other School"
        )
        self.budget_year = BudgetYear.objects.create(
            name="TA DASHV", start_date=datetime.date(2026, 7, 1), end_date=datetime.date(2027, 6, 30),
            is_active=True,
        )
        self.central_user = User.objects.create_user(
            username="dashv.central", name="DashV Central", password="a-strong-password",
            role=User.Role.CENTRAL,
        )
        self.branch_user = User.objects.create_user(
            username="dashv.branch", name="DashV Branch", password="a-strong-password",
            role=User.Role.BRANCH, branch=self.branch,
        )

    def login(self, username):
        client = Client()
        client.login(username=username, password="a-strong-password")
        return client

    # --- Access ---

    def test_anonymous_redirected(self):
        response = Client().get(reverse("dashboard:index"))
        self.assertEqual(response.status_code, 302)

    def test_central_can_view_dashboard(self):
        client = self.login("dashv.central")
        response = client.get(reverse("dashboard:index"))
        self.assertEqual(response.status_code, 200)

    def test_branch_can_view_scoped_dashboard(self):
        client = self.login("dashv.branch")
        response = client.get(reverse("dashboard:index"))
        self.assertEqual(response.status_code, 200)

    def test_dashboard_has_no_post_mutation_endpoint(self):
        """The dashboard is read-only by construction -- there is no POST handler at all."""
        client = self.login("dashv.central")
        response = client.post(reverse("dashboard:index"), {})
        self.assertEqual(response.status_code, 200)

    def test_risk_status_not_fabricated(self):
        client = self.login("dashv.central")
        response = client.get(reverse("dashboard:index"))
        self.assertContains(response, "belum ditentukan")
        self.assertNotContains(response, "Hijau</")

    # --- School-level monitoring ---

    def test_central_sees_all_schools_in_monitoring_table(self):
        client = self.login("dashv.central")
        response = client.get(reverse("dashboard:index"))
        self.assertContains(response, "Dashboard View School")
        self.assertContains(response, "Dashboard View Other School")

    def test_branch_sees_only_own_school_in_monitoring_table(self):
        client = self.login("dashv.branch")
        response = client.get(reverse("dashboard:index"))
        self.assertContains(response, "Dashboard View School")
        self.assertNotContains(response, "Dashboard View Other School")

    def test_rkas_monitoring_uses_existing_calculation(self):
        RKAS.objects.create(
            school=self.school, budget_year=self.budget_year, initial_amount=Decimal("850000000"),
            created_by=self.branch_user, updated_by=self.branch_user,
        )
        client = self.login("dashv.branch")
        response = client.get(
            reverse("dashboard:index"), {"budget_year": self.budget_year.pk}
        )
        self.assertContains(response, "Rp850.000.000")

    def test_reconciliation_monitoring_shows_tidak_sesuai(self):
        Reconciliation.objects.create(
            school=self.school, budget_year=self.budget_year,
            financial_statement_balance=Decimal("100"), bank_balance=Decimal("50"),
            created_by=self.branch_user, updated_by=self.branch_user,
        )
        client = self.login("dashv.branch")
        response = client.get(
            reverse("dashboard:index"), {"budget_year": self.budget_year.pk}
        )
        self.assertContains(response, "Tidak Sesuai")

    def test_finding_monitoring_shows_open_count(self):
        Finding.objects.create(
            school=self.school, finding_date=datetime.date(2026, 8, 1), source="Audit",
            finding="x", recommendation="y", pic="PIC", deadline=datetime.date(2026, 9, 1),
            status=FindingStatus.ON_PROGRESS, created_by=self.branch_user, updated_by=self.branch_user,
        )
        client = self.login("dashv.branch")
        response = client.get(reverse("dashboard:index"))
        # The monitoring row's open-findings cell links to the findings
        # list only when the count is non-zero (see the template's
        # {% if row.open_findings_count %} guard) -- a completed-only
        # school renders a plain "0" with no link, so this proves the
        # count actually reached the template, not just that the sidebar
        # nav (which always links to findings:list) is present.
        self.assertContains(
            response, f'<a href="{reverse("findings:list")}" class="link">1</a>'
        )

    def test_school_with_no_open_findings_shows_zero_not_a_link(self):
        client = self.login("dashv.branch")
        response = client.get(reverse("dashboard:index"))
        # The sidebar nav always links to findings:list -- so assert on
        # the monitoring row's specific markup, not the bare URL.
        self.assertNotContains(
            response, f'<a href="{reverse("findings:list")}" class="link">'
        )

    # --- Filters: server-side, safe ---

    def test_central_can_filter_by_branch(self):
        client = self.login("dashv.central")
        response = client.get(reverse("dashboard:index"), {"branch": self.branch.pk})
        self.assertContains(response, "Dashboard View School")
        self.assertNotContains(response, "Dashboard View Other School")

    def test_central_can_filter_by_school(self):
        client = self.login("dashv.central")
        response = client.get(reverse("dashboard:index"), {"school": self.school.pk})
        # The school filter dropdown legitimately lists every accessible
        # school as an <option> (including the unselected one) so the user
        # can switch -- assert on the monitoring table's row markup
        # specifically, not the whole page.
        self.assertContains(response, "<td class=\"px-4 py-2 font-medium text-ink\">Dashboard View School</td>")
        self.assertNotContains(response, "<td class=\"px-4 py-2 font-medium text-ink\">Dashboard View Other School</td>")

    def test_branch_user_manipulated_branch_param_is_ignored(self):
        """A BRANCH user passing ?branch=<other> must still only see their own branch."""
        client = self.login("dashv.branch")
        response = client.get(reverse("dashboard:index"), {"branch": self.other_branch.pk})
        self.assertContains(response, "Dashboard View School")
        self.assertNotContains(response, "Dashboard View Other School")

    def test_branch_user_manipulated_school_param_returns_no_leak(self):
        """A BRANCH user requesting another branch's school id gets an empty, safe result."""
        client = self.login("dashv.branch")
        response = client.get(reverse("dashboard:index"), {"school": self.other_school.pk})
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "Dashboard View Other School")
        self.assertContains(response, "Tidak ada sekolah")

    def test_central_school_filter_does_not_leak_via_error(self):
        """An invalid/nonexistent school id must not raise -- just an empty result."""
        client = self.login("dashv.central")
        response = client.get(reverse("dashboard:index"), {"school": 999999})
        self.assertEqual(response.status_code, 200)

    # --- TBD behavior: must not be fabricated ---

    def test_no_overdue_percentage_anywhere_on_dashboard(self):
        client = self.login("dashv.central")
        response = client.get(reverse("dashboard:index"))
        self.assertNotContains(response, "Tunggakan")

    def test_monthly_completeness_shown_as_undetermined(self):
        client = self.login("dashv.central")
        response = client.get(
            reverse("dashboard:index"), {"budget_year": self.budget_year.pk}
        )
        self.assertContains(response, "Belum ditentukan")
