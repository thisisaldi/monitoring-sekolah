"""
System administration: Branch management.

Branch is an internal organizational/security entity, not Master Data.
Management is is_staff-only -- role=CENTRAL/BRANCH never implies access.
This supersedes the earlier CENTRAL-manages/BRANCH-read-only model.
"""
from django.test import Client, TestCase
from django.urls import reverse

from apps.accounts.models import User
from apps.branches.models import Branch
from apps.schools.models import School


class BranchManagementAuthorizationTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="BADM1", name="Branch Admin One")
        self.branch_user = User.objects.create_user(
            username="badm.branch",
            name="Branch Admin Test Branch User",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )
        self.central_user = User.objects.create_user(
            username="badm.central",
            name="Branch Admin Test Central User",
            password="a-strong-password",
            role=User.Role.CENTRAL,
        )
        self.admin_user = User.objects.create_user(
            username="badm.admin",
            name="Branch Admin Test Admin",
            password="a-strong-password",
            role=User.Role.CENTRAL,
            is_staff=True,
        )

    def login(self, username):
        client = Client()
        client.login(username=username, password="a-strong-password")
        return client

    def test_anonymous_redirected_to_login(self):
        response = Client().get(reverse("branches:list"))
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("accounts:login"), response.url)

    def test_branch_user_forbidden_from_list(self):
        client = self.login("badm.branch")
        response = client.get(reverse("branches:list"))
        self.assertEqual(response.status_code, 403)

    def test_normal_central_user_forbidden_from_list(self):
        """role=CENTRAL alone must NOT grant Branch-management access."""
        client = self.login("badm.central")
        response = client.get(reverse("branches:list"))
        self.assertEqual(response.status_code, 403)

    def test_staff_admin_allowed(self):
        client = self.login("badm.admin")
        response = client.get(reverse("branches:list"))
        self.assertEqual(response.status_code, 200)

    def test_branch_user_cannot_create_via_direct_post(self):
        client = self.login("badm.branch")
        response = client.post(reverse("branches:create"), {"code": "ILLEGAL", "name": "Illegal"})
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Branch.objects.filter(code="ILLEGAL").exists())

    def test_normal_central_cannot_create_via_direct_post(self):
        client = self.login("badm.central")
        response = client.post(reverse("branches:create"), {"code": "ILLEGAL2", "name": "Illegal"})
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Branch.objects.filter(code="ILLEGAL2").exists())

    def test_non_admin_cannot_deactivate_via_direct_post(self):
        client = self.login("badm.central")
        response = client.post(reverse("branches:deactivate", args=[self.branch.pk]))
        self.assertEqual(response.status_code, 403)
        self.branch.refresh_from_db()
        self.assertTrue(self.branch.is_active)


class BranchManagementCrudTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="BCRUD1", name="Branch Crud One")
        self.admin_user = User.objects.create_user(
            username="bcrud.admin",
            name="Branch Crud Admin",
            password="a-strong-password",
            role=User.Role.CENTRAL,
            is_staff=True,
        )
        self.client = Client()
        self.client.login(username="bcrud.admin", password="a-strong-password")

    def test_admin_can_list_branches(self):
        response = self.client.get(reverse("branches:list"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Branch Crud One")

    def test_admin_can_create_branch(self):
        response = self.client.post(
            reverse("branches:create"), {"code": "BCRUD2", "name": "Branch Crud Two", "is_active": "on"}
        )
        self.assertRedirects(response, reverse("branches:list"))
        self.assertTrue(Branch.objects.filter(code="BCRUD2").exists())

    def test_admin_can_edit_branch(self):
        response = self.client.post(
            reverse("branches:edit", args=[self.branch.pk]),
            {"code": "BCRUD1", "name": "Branch Crud One Edited", "is_active": "on"},
        )
        self.assertRedirects(response, reverse("branches:list"))
        self.branch.refresh_from_db()
        self.assertEqual(self.branch.name, "Branch Crud One Edited")

    def test_admin_can_deactivate_branch(self):
        response = self.client.post(reverse("branches:deactivate", args=[self.branch.pk]))
        self.assertRedirects(response, reverse("branches:list"))
        self.branch.refresh_from_db()
        self.assertFalse(self.branch.is_active)

    def test_admin_can_reactivate_branch(self):
        self.branch.is_active = False
        self.branch.save()
        response = self.client.post(reverse("branches:activate", args=[self.branch.pk]))
        self.assertRedirects(response, reverse("branches:list"))
        self.branch.refresh_from_db()
        self.assertTrue(self.branch.is_active)

    def test_branch_code_uniqueness_enforced_via_form(self):
        response = self.client.post(
            reverse("branches:create"), {"code": "BCRUD1", "name": "Duplicate Code Branch", "is_active": "on"}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Branch.objects.filter(code="BCRUD1").count(), 1)

    def test_branch_with_school_cannot_be_deleted_through_normal_ui(self):
        """No delete view/URL exists for Branch at all -- deactivate is the only lifecycle action."""
        from django.db.models import ProtectedError
        from django.urls import NoReverseMatch

        School.objects.create(branch=self.branch, code="BCRUDS", name="Branch Crud School")

        with self.assertRaises(NoReverseMatch):
            reverse("branches:delete", args=[self.branch.pk])

        with self.assertRaises(ProtectedError):
            self.branch.delete()


class BranchSchoolEligibilityIntegrationTests(TestCase):
    """Admin-managed branches feed directly into the School creation workflow."""

    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="bsei.admin",
            name="Branch School Eligibility Admin",
            password="a-strong-password",
            role=User.Role.CENTRAL,
            is_staff=True,
        )
        self.central_user = User.objects.create_user(
            username="bsei.central",
            name="Branch School Eligibility Central",
            password="a-strong-password",
            role=User.Role.CENTRAL,
        )

    def test_admin_created_branch_can_be_selected_when_creating_a_school(self):
        admin_client = Client()
        admin_client.login(username="bsei.admin", password="a-strong-password")
        admin_client.post(reverse("branches:create"), {"code": "BSEI1", "name": "Fresh Branch", "is_active": "on"})
        branch = Branch.objects.get(code="BSEI1")

        central_client = Client()
        central_client.login(username="bsei.central", password="a-strong-password")
        response = central_client.post(
            reverse("schools:create"),
            {"branch": branch.id, "code": "BSEISCH1", "name": "Fresh Branch School"},
        )
        self.assertRedirects(response, reverse("schools:list"))
        self.assertTrue(School.objects.filter(code="BSEISCH1", branch=branch).exists())

    def test_branch_with_existing_school_cannot_be_selected_for_a_new_school(self):
        branch = Branch.objects.create(code="BSEI2", name="Already Has School")
        School.objects.create(branch=branch, code="BSEISCH2", name="Existing School")

        central_client = Client()
        central_client.login(username="bsei.central", password="a-strong-password")
        response = central_client.post(
            reverse("schools:create"),
            {"branch": branch.id, "code": "BSEISCH3", "name": "Second School Attempt"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(School.objects.filter(code="BSEISCH3").exists())
