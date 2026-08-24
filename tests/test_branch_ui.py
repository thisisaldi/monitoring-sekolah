"""
Phase 3: Branch Master Data UI -- CENTRAL full management, BRANCH read-only
and scoped to their own branch.
"""
from django.test import Client, TestCase
from django.urls import reverse

from apps.accounts.models import User
from apps.branches.models import Branch


class BranchUITests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="BUI1", name="Branch UI One")
        self.other_branch = Branch.objects.create(code="BUI2", name="Branch UI Two")

        self.central_user = User.objects.create_user(
            username="bui.central",
            name="BUI Central",
            password="a-strong-password",
            role=User.Role.CENTRAL,
        )
        self.branch_user = User.objects.create_user(
            username="bui.branch",
            name="BUI Branch",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )

    def login(self, username):
        client = Client()
        client.login(username=username, password="a-strong-password")
        return client

    # 10. Central can list branches.
    def test_central_can_list_branches(self):
        client = self.login("bui.central")
        response = client.get(reverse("branches:list"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Branch UI One")
        self.assertContains(response, "Branch UI Two")

    # 11. Central can create branch.
    def test_central_can_create_branch(self):
        client = self.login("bui.central")
        response = client.post(
            reverse("branches:create"), {"code": "BUI3", "name": "Branch UI Three"}
        )
        self.assertRedirects(response, reverse("branches:list"))
        self.assertTrue(Branch.objects.filter(code="BUI3").exists())

    # 12. Central can edit branch.
    def test_central_can_edit_branch(self):
        client = self.login("bui.central")
        response = client.post(
            reverse("branches:edit", args=[self.branch.pk]),
            {"code": "BUI1", "name": "Branch UI One Edited"},
        )
        self.assertRedirects(response, reverse("branches:list"))
        self.branch.refresh_from_db()
        self.assertEqual(self.branch.name, "Branch UI One Edited")

    # 13. Central can deactivate branch.
    def test_central_can_deactivate_branch(self):
        client = self.login("bui.central")
        response = client.post(reverse("branches:deactivate", args=[self.branch.pk]))
        self.assertRedirects(response, reverse("branches:list"))
        self.branch.refresh_from_db()
        self.assertFalse(self.branch.is_active)

    # 14. Branch user cannot create.
    def test_branch_user_cannot_create_branch(self):
        client = self.login("bui.branch")
        response = client.post(
            reverse("branches:create"), {"code": "ILLEGAL", "name": "Illegal Branch"}
        )
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Branch.objects.filter(code="ILLEGAL").exists())

    # 15. Branch user cannot edit.
    def test_branch_user_cannot_edit_branch(self):
        client = self.login("bui.branch")
        response = client.post(
            reverse("branches:edit", args=[self.branch.pk]),
            {"code": "BUI1", "name": "Hijacked Name"},
        )
        self.assertEqual(response.status_code, 403)
        self.branch.refresh_from_db()
        self.assertNotEqual(self.branch.name, "Hijacked Name")

    # 16. Branch user cannot deactivate.
    def test_branch_user_cannot_deactivate_branch(self):
        client = self.login("bui.branch")
        response = client.post(reverse("branches:deactivate", args=[self.branch.pk]))
        self.assertEqual(response.status_code, 403)
        self.branch.refresh_from_db()
        self.assertTrue(self.branch.is_active)

    # 17. Branch user sees only own branch.
    def test_branch_user_sees_only_own_branch(self):
        client = self.login("bui.branch")
        response = client.get(reverse("branches:list"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Branch UI One")
        self.assertNotContains(response, "Branch UI Two")

    def test_branch_user_edit_url_for_own_branch_is_still_blocked(self):
        """Read-only is a role rule, not a per-branch rule -- even own branch is blocked."""
        client = self.login("bui.branch")
        response = client.get(reverse("branches:edit", args=[self.branch.pk]))
        self.assertEqual(response.status_code, 403)

    # 35/36. Anonymous redirected, wrong-role gets 403.
    def test_anonymous_user_redirected_to_login(self):
        response = Client().get(reverse("branches:list"))
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("accounts:login"), response.url)

    def test_anonymous_cannot_create_branch(self):
        response = Client().post(
            reverse("branches:create"), {"code": "ANON", "name": "Anon Branch"}
        )
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("accounts:login"), response.url)
