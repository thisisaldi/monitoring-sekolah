"""
Phase 2C: RBAC helpers and branch-scoped authorization, proven over real
HTTP requests against the minimal authz-check proof views
(apps/accounts/views.py). These proof views are infrastructure for this
phase only, not business functionality.
"""
from django.test import Client, TestCase
from django.urls import reverse

from apps.accounts.authorization import (
    can_access_branch,
    can_modify_branch_data,
    get_user_school,
    is_branch,
    is_central,
)
from apps.accounts.models import User
from apps.branches.models import Branch
from apps.schools.models import School


class RoleHelperTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="HELPER", name="Helper Branch")
        self.central_user = User.objects.create_user(
            username="helper.central",
            name="Helper Central",
            password="a-strong-password",
            role=User.Role.CENTRAL,
        )
        self.branch_user = User.objects.create_user(
            username="helper.branch",
            name="Helper Branch User",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )

    def test_is_central_true_for_central_user(self):
        self.assertTrue(is_central(self.central_user))
        self.assertFalse(is_central(self.branch_user))

    def test_is_branch_true_for_branch_user(self):
        self.assertTrue(is_branch(self.branch_user))
        self.assertFalse(is_branch(self.central_user))

    def test_can_access_branch_central_can_access_any_branch(self):
        other_branch = Branch.objects.create(code="OTHERH", name="Other Helper Branch")
        self.assertTrue(can_access_branch(self.central_user, self.branch))
        self.assertTrue(can_access_branch(self.central_user, other_branch))

    def test_can_access_branch_branch_user_only_own_branch(self):
        other_branch = Branch.objects.create(code="OTHERH2", name="Other Helper Branch 2")
        self.assertTrue(can_access_branch(self.branch_user, self.branch))
        self.assertFalse(can_access_branch(self.branch_user, other_branch))

    def test_can_modify_branch_data_central_is_read_only(self):
        self.assertFalse(can_modify_branch_data(self.central_user, self.branch))

    def test_can_modify_branch_data_branch_user_own_branch_only(self):
        other_branch = Branch.objects.create(code="OTHERH3", name="Other Helper Branch 3")
        self.assertTrue(can_modify_branch_data(self.branch_user, self.branch))
        self.assertFalse(can_modify_branch_data(self.branch_user, other_branch))


class GetUserSchoolTests(TestCase):
    """Branch<->School is 1:1: get_user_school is the server-derived source of truth."""

    def setUp(self):
        self.branch = Branch.objects.create(code="GUS1", name="GUS Branch")
        self.school = School.objects.create(branch=self.branch, code="GUS-S1", name="GUS School")
        self.branch_without_school = Branch.objects.create(code="GUS2", name="GUS Branch No School")
        self.central_user = User.objects.create_user(
            username="gus.central",
            name="GUS Central",
            password="a-strong-password",
            role=User.Role.CENTRAL,
        )
        self.branch_user = User.objects.create_user(
            username="gus.branch",
            name="GUS Branch User",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )
        self.schoolless_branch_user = User.objects.create_user(
            username="gus.branch2",
            name="GUS Schoolless Branch User",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch_without_school,
        )

    def test_branch_user_resolves_to_their_single_school(self):
        self.assertEqual(get_user_school(self.branch_user), self.school)

    def test_central_user_resolves_to_no_school(self):
        self.assertIsNone(get_user_school(self.central_user))

    def test_branch_user_without_a_school_resolves_to_none(self):
        self.assertIsNone(get_user_school(self.schoolless_branch_user))


class ProtectedViewAuthorizationTests(TestCase):
    """HTTP-level proof, using apps/accounts' authz-check views."""

    def setUp(self):
        self.branch = Branch.objects.create(code="PROOF1", name="Proof Branch One")
        self.other_branch = Branch.objects.create(code="PROOF2", name="Proof Branch Two")

        self.central_user = User.objects.create_user(
            username="proof.central",
            name="Proof Central",
            password="a-strong-password",
            role=User.Role.CENTRAL,
        )
        self.branch_user = User.objects.create_user(
            username="proof.branch",
            name="Proof Branch",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )

    def login(self, username):
        client = Client()
        client.login(username=username, password="a-strong-password")
        return client

    # 1. Anonymous user cannot access protected view.
    def test_anonymous_user_cannot_access_protected_view(self):
        response = Client().get(reverse("accounts:authz_check_protected"))
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("accounts:login"), response.url)

    # 2. Authenticated user can access protected view.
    def test_authenticated_user_can_access_protected_view(self):
        client = self.login("proof.branch")
        response = client.get(reverse("accounts:authz_check_protected"))
        self.assertEqual(response.status_code, 200)

    # 3. Central user can access central-only test view.
    def test_central_user_can_access_central_only_view(self):
        client = self.login("proof.central")
        response = client.get(reverse("accounts:authz_check_central_only"))
        self.assertEqual(response.status_code, 200)

    # 4. Branch user cannot access central-only test view.
    def test_branch_user_cannot_access_central_only_view(self):
        client = self.login("proof.branch")
        response = client.get(reverse("accounts:authz_check_central_only"))
        self.assertEqual(response.status_code, 403)

    # 5. Branch user can access own branch-scoped test view.
    def test_branch_user_can_access_own_branch_scoped_view(self):
        client = self.login("proof.branch")
        response = client.get(
            reverse("accounts:authz_check_branch", args=[self.branch.id])
        )
        self.assertEqual(response.status_code, 200)

    # 6. Branch user cannot access another branch's test view.
    def test_branch_user_cannot_access_other_branch_scoped_view(self):
        client = self.login("proof.branch")
        response = client.get(
            reverse("accounts:authz_check_branch", args=[self.other_branch.id])
        )
        self.assertEqual(response.status_code, 403)

    # 7. Central user can access another branch's test view.
    def test_central_user_can_access_any_branch_scoped_view(self):
        client = self.login("proof.central")
        response = client.get(
            reverse("accounts:authz_check_branch", args=[self.other_branch.id])
        )
        self.assertEqual(response.status_code, 200)

    # 8. Branch user cannot bypass authorization by changing URL parameters.
    def test_branch_user_cannot_bypass_via_url_parameter(self):
        client = self.login("proof.branch")
        own = client.get(reverse("accounts:authz_check_branch", args=[self.branch.id]))
        other = client.get(
            reverse("accounts:authz_check_branch", args=[self.other_branch.id])
        )
        self.assertEqual(own.status_code, 200)
        self.assertEqual(other.status_code, 403)

    # 9. Branch user cannot bypass authorization through POST data.
    def test_branch_user_cannot_bypass_via_post_body(self):
        client = self.login("proof.branch")
        response = client.post(
            reverse("accounts:authz_check_branch_post"),
            {"branch_id": self.other_branch.id},
        )
        self.assertEqual(response.status_code, 403)

        allowed = client.post(
            reverse("accounts:authz_check_branch_post"),
            {"branch_id": self.branch.id},
        )
        self.assertEqual(allowed.status_code, 200)

    # 10. Central user is treated as read-only for operational-data permission checks.
    def test_central_user_is_read_only_for_modify_permission(self):
        client = self.login("proof.central")
        response = client.get(
            reverse("accounts:authz_check_branch_modify", args=[self.branch.id])
        )
        self.assertEqual(response.status_code, 403)

    # 11. Branch user is treated as modifiable for own branch data.
    def test_branch_user_can_modify_own_branch_data(self):
        client = self.login("proof.branch")
        response = client.get(
            reverse("accounts:authz_check_branch_modify", args=[self.branch.id])
        )
        self.assertEqual(response.status_code, 200)

        other_response = client.get(
            reverse("accounts:authz_check_branch_modify", args=[self.other_branch.id])
        )
        self.assertEqual(other_response.status_code, 403)
