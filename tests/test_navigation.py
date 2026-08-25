"""
Post-deployment correction: Master Data navigation no longer exposes
Branch as a normal user-facing entity (Branch<->School is 1:1, so users
work with School directly). Branch management was subsequently moved to
an is_staff-only ADMINISTRASI workflow (apps/branches/views.py), not a
CENTRAL-accessible Master Data route. See docs/design/UI-DESIGN-SPEC.md
and the corrections' own reports for the full rationale.
"""
import datetime

from django.test import Client, TestCase
from django.urls import reverse

from apps.accounts.models import User
from apps.branches.models import Branch
from apps.budget_years.models import BudgetYear
from apps.schools.models import School


class SidebarMasterDataNavigationTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="NAVBR", name="Nav Branch")
        School.objects.create(branch=self.branch, code="NAVSCH", name="Nav School")
        self.branch_user = User.objects.create_user(
            username="nav.branch",
            name="Nav Branch User",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )
        self.central_user = User.objects.create_user(
            username="nav.central",
            name="Nav Central User",
            password="a-strong-password",
            role=User.Role.CENTRAL,
        )

    def login(self, username):
        client = Client()
        client.login(username=username, password="a-strong-password")
        return client

    def test_branch_user_sidebar_has_no_branch_master_data_link(self):
        client = self.login("nav.branch")
        response = client.get(reverse("schools:list"))
        self.assertNotContains(response, 'href="/branches/"')
        self.assertContains(response, 'href="/schools/"')
        self.assertContains(response, 'href="/budget-years/"')

    def test_central_user_sidebar_also_has_no_branch_master_data_link(self):
        """
        Branch is removed from normal navigation for every role -- it was
        never meant to become a Central-only master-data workflow, it's
        simply no longer a user-facing entity now that Branch<->School is
        1:1 (the underlying /branches/ route and Branch model are
        untouched, just not linked from the sidebar).
        """
        client = self.login("nav.central")
        response = client.get(reverse("schools:list"))
        self.assertNotContains(response, 'href="/branches/"')

    def test_branches_route_requires_system_admin_even_when_accessed_directly(self):
        """
        The Branch model/CRUD page is preserved but is now is_staff-only
        (system administration), not a normal-CENTRAL master-data route --
        see the ADMIN-ONLY BRANCH MANAGEMENT correction.
        """
        client = self.login("nav.central")
        response = client.get(reverse("branches:list"))
        self.assertEqual(response.status_code, 403)


class DashboardSelectorVisibilityTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="DASHNAVBR", name="Dash Nav Branch")
        self.school = School.objects.create(
            branch=self.branch, code="DASHNAVSCH", name="Dash Nav School"
        )
        self.other_branch = Branch.objects.create(code="DASHNAVBR2", name="Dash Nav Branch Two")
        School.objects.create(branch=self.other_branch, code="DASHNAVSCH2", name="Dash Nav School Two")
        BudgetYear.objects.create(
            name="TA NAV", start_date=datetime.date(2026, 7, 1), end_date=datetime.date(2027, 6, 30),
            is_active=True,
        )
        self.branch_user = User.objects.create_user(
            username="dashnav.branch",
            name="Dash Nav Branch User",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )
        self.central_user = User.objects.create_user(
            username="dashnav.central",
            name="Dash Nav Central User",
            password="a-strong-password",
            role=User.Role.CENTRAL,
        )

    def login(self, username):
        client = Client()
        client.login(username=username, password="a-strong-password")
        return client

    def test_branch_user_dashboard_has_no_branch_or_school_selector(self):
        client = self.login("dashnav.branch")
        response = client.get(reverse("dashboard:index"))
        self.assertNotContains(response, 'id="filter-branch-trigger"')
        self.assertNotContains(response, 'id="filter-school-trigger"')
        # Their one school's monitoring row still renders -- just not as a
        # user-selectable filter.
        self.assertContains(response, "Dash Nav School")

    def test_central_user_dashboard_retains_branch_and_school_selectors(self):
        client = self.login("dashnav.central")
        response = client.get(reverse("dashboard:index"))
        self.assertContains(response, 'id="filter-branch-trigger"')
        self.assertContains(response, 'id="filter-school-trigger"')
