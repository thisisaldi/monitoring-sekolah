"""
Phase 3: School Master Data UI -- CENTRAL full management (all branches),
BRANCH read-only and scoped to their own branch's schools.
"""
from django.db import connection
from django.test import Client, TestCase
from django.test.utils import CaptureQueriesContext
from django.urls import reverse

from apps.accounts.models import User
from apps.branches.models import Branch
from apps.schools.models import School


class SchoolUITests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="SUI1", name="School UI Branch One")
        self.other_branch = Branch.objects.create(code="SUI2", name="School UI Branch Two")

        self.central_user = User.objects.create_user(
            username="sui.central",
            name="SUI Central",
            password="a-strong-password",
            role=User.Role.CENTRAL,
        )
        self.branch_user = User.objects.create_user(
            username="sui.branch",
            name="SUI Branch",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )

        self.own_school = School.objects.create(
            branch=self.branch, code="SUIS1", name="Own School"
        )
        self.other_school = School.objects.create(
            branch=self.other_branch, code="SUIS2", name="Other School"
        )

    def login(self, username):
        client = Client()
        client.login(username=username, password="a-strong-password")
        return client

    # 18. Central can list all schools.
    def test_central_can_list_all_schools(self):
        client = self.login("sui.central")
        response = client.get(reverse("schools:list"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Own School")
        self.assertContains(response, "Other School")

    # 19. Central can create school.
    def test_central_can_create_school(self):
        branch_without_school = Branch.objects.create(code="SUI3", name="School UI Branch Three")
        client = self.login("sui.central")
        response = client.post(
            reverse("schools:create"),
            {"branch": branch_without_school.id, "code": "SUIS3", "name": "New School"},
        )
        self.assertRedirects(response, reverse("schools:list"))
        self.assertTrue(School.objects.filter(code="SUIS3").exists())

    # Branch<->School is 1:1: a branch that already has a school must not
    # be offered (or accepted) for a second one.
    def test_central_cannot_create_a_second_school_for_the_same_branch(self):
        client = self.login("sui.central")
        response = client.post(
            reverse("schools:create"),
            {"branch": self.branch.id, "code": "SUIS-DUP", "name": "Duplicate School"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(School.objects.filter(code="SUIS-DUP").exists())

    # 20. Central can edit school.
    def test_central_can_edit_school(self):
        client = self.login("sui.central")
        response = client.post(
            reverse("schools:edit", args=[self.own_school.pk]),
            {"branch": self.branch.id, "code": "SUIS1", "name": "Own School Edited"},
        )
        self.assertRedirects(response, reverse("schools:list"))
        self.own_school.refresh_from_db()
        self.assertEqual(self.own_school.name, "Own School Edited")

    # 21. Central can deactivate school.
    def test_central_can_deactivate_school(self):
        client = self.login("sui.central")
        response = client.post(reverse("schools:deactivate", args=[self.own_school.pk]))
        self.assertRedirects(response, reverse("schools:list"))
        self.own_school.refresh_from_db()
        self.assertFalse(self.own_school.is_active)

    # 22. Branch sees only own schools.
    def test_branch_sees_only_own_schools(self):
        client = self.login("sui.branch")
        response = client.get(reverse("schools:list"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Own School")
        self.assertNotContains(response, "Other School")

    # 23. Branch cannot create school.
    def test_branch_cannot_create_school(self):
        client = self.login("sui.branch")
        response = client.post(
            reverse("schools:create"),
            {"branch": self.branch.id, "code": "ILLEGAL", "name": "Illegal School"},
        )
        self.assertEqual(response.status_code, 403)
        self.assertFalse(School.objects.filter(code="ILLEGAL").exists())

    # 24. Branch cannot edit school.
    def test_branch_cannot_edit_own_school(self):
        client = self.login("sui.branch")
        response = client.post(
            reverse("schools:edit", args=[self.own_school.pk]),
            {"branch": self.branch.id, "code": "SUIS1", "name": "Hijacked"},
        )
        self.assertEqual(response.status_code, 403)
        self.own_school.refresh_from_db()
        self.assertNotEqual(self.own_school.name, "Hijacked")

    # 25. Branch cannot deactivate school.
    def test_branch_cannot_deactivate_own_school(self):
        client = self.login("sui.branch")
        response = client.post(reverse("schools:deactivate", args=[self.own_school.pk]))
        self.assertEqual(response.status_code, 403)
        self.own_school.refresh_from_db()
        self.assertTrue(self.own_school.is_active)

    # 26. Branch cannot access another branch's school.
    def test_branch_cannot_view_another_branchs_school_in_list(self):
        client = self.login("sui.branch")
        response = client.get(reverse("schools:list"))
        self.assertNotContains(response, "Other School")

    # 27. URL ID manipulation is blocked.
    def test_branch_cannot_edit_another_branchs_school_via_url(self):
        client = self.login("sui.branch")
        response = client.get(reverse("schools:edit", args=[self.other_school.pk]))
        self.assertEqual(response.status_code, 403)

    def test_branch_cannot_deactivate_another_branchs_school_via_url(self):
        client = self.login("sui.branch")
        response = client.post(reverse("schools:deactivate", args=[self.other_school.pk]))
        self.assertEqual(response.status_code, 403)
        self.other_school.refresh_from_db()
        self.assertTrue(self.other_school.is_active)

    # 28. POST manipulation is blocked.
    def test_branch_cannot_reassign_own_school_to_another_branch_via_post(self):
        """
        Even attempting to POST a different branch_id must not let a BRANCH
        user succeed -- mutation is central-only regardless of the payload.
        """
        client = self.login("sui.branch")
        response = client.post(
            reverse("schools:edit", args=[self.own_school.pk]),
            {"branch": self.other_branch.id, "code": "SUIS1", "name": "Hijacked Branch"},
        )
        self.assertEqual(response.status_code, 403)
        self.own_school.refresh_from_db()
        self.assertEqual(self.own_school.branch_id, self.branch.id)

    def test_list_uses_select_related_for_branch_no_n_plus_1(self):
        """
        No N+1: query count for the school list must not grow as more
        schools (each with a different branch) are added -- proves
        select_related("branch") is actually working, not just present.
        """
        client = self.login("sui.central")

        with CaptureQueriesContext(connection) as before:
            client.get(reverse("schools:list"))
        baseline_count = len(before.captured_queries)

        for i in range(5):
            branch = Branch.objects.create(code=f"NPLUS{i}", name=f"N+1 Branch {i}")
            School.objects.create(branch=branch, code=f"NPLUSS{i}", name=f"N+1 School {i}")

        with CaptureQueriesContext(connection) as after:
            client.get(reverse("schools:list"))

        self.assertEqual(len(after.captured_queries), baseline_count)

    def test_anonymous_user_redirected_to_login(self):
        response = Client().get(reverse("schools:list"))
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("accounts:login"), response.url)
