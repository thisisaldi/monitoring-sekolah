"""
System administration: User Management.

Administrative authorization is `is_staff`-based, never business-role
based -- `role=CENTRAL` must never imply admin access on its own. See
apps/accounts/authorization.py::is_system_admin.
"""
from django.test import Client, TestCase
from django.urls import reverse

from apps.accounts.models import User
from apps.branches.models import Branch


class UserManagementAuthorizationTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="UMAUTH", name="User Mgmt Auth Branch")
        self.branch_user = User.objects.create_user(
            username="umauth.branch",
            name="UM Auth Branch",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )
        self.central_user = User.objects.create_user(
            username="umauth.central",
            name="UM Auth Central",
            password="a-strong-password",
            role=User.Role.CENTRAL,
        )
        self.admin_user = User.objects.create_user(
            username="umauth.admin",
            name="UM Auth Admin",
            password="a-strong-password",
            role=User.Role.CENTRAL,
            is_staff=True,
        )

    def login(self, username):
        client = Client()
        client.login(username=username, password="a-strong-password")
        return client

    def test_anonymous_redirected_to_login(self):
        response = Client().get(reverse("accounts:user_list"))
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("accounts:login"), response.url)

    def test_branch_user_forbidden(self):
        client = self.login("umauth.branch")
        response = client.get(reverse("accounts:user_list"))
        self.assertEqual(response.status_code, 403)

    def test_normal_central_user_forbidden(self):
        """role=CENTRAL alone must NOT grant admin access -- the core design decision."""
        client = self.login("umauth.central")
        response = client.get(reverse("accounts:user_list"))
        self.assertEqual(response.status_code, 403)

    def test_staff_admin_allowed(self):
        client = self.login("umauth.admin")
        response = client.get(reverse("accounts:user_list"))
        self.assertEqual(response.status_code, 200)

    def test_branch_user_cannot_reach_create_via_direct_url(self):
        client = self.login("umauth.branch")
        response = client.get(reverse("accounts:user_create"))
        self.assertEqual(response.status_code, 403)

    def test_normal_central_cannot_reach_create_via_direct_url(self):
        client = self.login("umauth.central")
        response = client.get(reverse("accounts:user_create"))
        self.assertEqual(response.status_code, 403)

    def test_branch_user_cannot_post_deactivate_directly(self):
        """Manipulating the URL/POST directly cannot bypass authorization."""
        client = self.login("umauth.branch")
        response = client.post(reverse("accounts:user_deactivate", args=[self.central_user.pk]))
        self.assertEqual(response.status_code, 403)
        self.central_user.refresh_from_db()
        self.assertTrue(self.central_user.is_active)


class UserCreateTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="UMCREATE", name="User Mgmt Create Branch")
        self.admin_user = User.objects.create_user(
            username="umcreate.admin",
            name="UM Create Admin",
            password="a-strong-password",
            role=User.Role.CENTRAL,
            is_staff=True,
        )
        self.client = Client()
        self.client.login(username="umcreate.admin", password="a-strong-password")

    def base_payload(self, **overrides):
        payload = {
            "name": "New User",
            "username": "new.user",
            "role": "CENTRAL",
            "branch": "",
            "password": "a-very-strong-password-99",
            "password_confirm": "a-very-strong-password-99",
            "is_active": "on",
        }
        payload.update(overrides)
        return payload

    def test_create_central_user(self):
        response = self.client.post(reverse("accounts:user_create"), self.base_payload())
        self.assertRedirects(response, reverse("accounts:user_list"))
        user = User.objects.get(username="new.user")
        self.assertEqual(user.role, User.Role.CENTRAL)
        self.assertIsNone(user.branch)

    def test_create_branch_user_with_branch(self):
        response = self.client.post(
            reverse("accounts:user_create"),
            self.base_payload(username="new.branch.user", role="BRANCH", branch=str(self.branch.pk)),
        )
        self.assertRedirects(response, reverse("accounts:user_list"))
        user = User.objects.get(username="new.branch.user")
        self.assertEqual(user.role, User.Role.BRANCH)
        self.assertEqual(user.branch_id, self.branch.pk)

    def test_reject_branch_role_without_branch(self):
        response = self.client.post(
            reverse("accounts:user_create"),
            self.base_payload(username="rejected.branch", role="BRANCH", branch=""),
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(username="rejected.branch").exists())

    def test_reject_central_role_with_branch(self):
        response = self.client.post(
            reverse("accounts:user_create"),
            self.base_payload(username="rejected.central", role="CENTRAL", branch=str(self.branch.pk)),
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(username="rejected.central").exists())

    def test_created_user_password_is_hashed_and_works(self):
        self.client.post(reverse("accounts:user_create"), self.base_payload(username="hash.check"))
        user = User.objects.get(username="hash.check")
        self.assertNotEqual(user.password, "a-very-strong-password-99")
        self.assertTrue(user.check_password("a-very-strong-password-99"))
        self.assertFalse(user.check_password("wrong-password"))

    def test_password_confirmation_mismatch_rejected(self):
        response = self.client.post(
            reverse("accounts:user_create"),
            self.base_payload(username="mismatch.user", password_confirm="different-password-99"),
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(username="mismatch.user").exists())

    def test_created_user_is_never_staff_or_superuser(self):
        """
        The create form has no is_staff/is_superuser field at all -- POSTing
        them anyway must have no effect (they aren't bound to the form).
        """
        response = self.client.post(
            reverse("accounts:user_create"),
            self.base_payload(username="escalation.attempt", is_staff="on", is_superuser="on"),
        )
        self.assertRedirects(response, reverse("accounts:user_list"))
        user = User.objects.get(username="escalation.attempt")
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_weak_password_rejected_by_validators(self):
        response = self.client.post(
            reverse("accounts:user_create"),
            self.base_payload(username="weak.pw", password="123", password_confirm="123"),
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(username="weak.pw").exists())


class UserEditTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="UMEDIT", name="User Mgmt Edit Branch")
        self.other_branch = Branch.objects.create(code="UMEDIT2", name="User Mgmt Edit Branch Two")
        self.admin_user = User.objects.create_user(
            username="umedit.admin",
            name="UM Edit Admin",
            password="a-strong-password",
            role=User.Role.CENTRAL,
            is_staff=True,
        )
        self.central_target = User.objects.create_user(
            username="umedit.central",
            name="UM Edit Central Target",
            password="a-strong-password",
            role=User.Role.CENTRAL,
        )
        self.branch_target = User.objects.create_user(
            username="umedit.branch",
            name="UM Edit Branch Target",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )
        self.client = Client()
        self.client.login(username="umedit.admin", password="a-strong-password")

    def test_edit_name(self):
        response = self.client.post(
            reverse("accounts:user_edit", args=[self.central_target.pk]),
            {
                "name": "Renamed User",
                "username": self.central_target.username,
                "role": "CENTRAL",
                "branch": "",
                "is_active": "on",
            },
        )
        self.assertRedirects(response, reverse("accounts:user_list"))
        self.central_target.refresh_from_db()
        self.assertEqual(self.central_target.name, "Renamed User")

    def test_edit_username(self):
        response = self.client.post(
            reverse("accounts:user_edit", args=[self.central_target.pk]),
            {
                "name": self.central_target.name,
                "username": "renamed.username",
                "role": "CENTRAL",
                "branch": "",
                "is_active": "on",
            },
        )
        self.assertRedirects(response, reverse("accounts:user_list"))
        self.central_target.refresh_from_db()
        self.assertEqual(self.central_target.username, "renamed.username")

    def test_central_to_branch_requires_branch(self):
        response = self.client.post(
            reverse("accounts:user_edit", args=[self.central_target.pk]),
            {
                "name": self.central_target.name,
                "username": self.central_target.username,
                "role": "BRANCH",
                "branch": "",
                "is_active": "on",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.central_target.refresh_from_db()
        self.assertEqual(self.central_target.role, User.Role.CENTRAL)

        response = self.client.post(
            reverse("accounts:user_edit", args=[self.central_target.pk]),
            {
                "name": self.central_target.name,
                "username": self.central_target.username,
                "role": "BRANCH",
                "branch": str(self.branch.pk),
                "is_active": "on",
            },
        )
        self.assertRedirects(response, reverse("accounts:user_list"))
        self.central_target.refresh_from_db()
        self.assertEqual(self.central_target.role, User.Role.BRANCH)
        self.assertEqual(self.central_target.branch_id, self.branch.pk)

    def test_branch_to_central_clears_branch(self):
        response = self.client.post(
            reverse("accounts:user_edit", args=[self.branch_target.pk]),
            {
                "name": self.branch_target.name,
                "username": self.branch_target.username,
                "role": "CENTRAL",
                "branch": "",
                "is_active": "on",
            },
        )
        self.assertRedirects(response, reverse("accounts:user_list"))
        self.branch_target.refresh_from_db()
        self.assertEqual(self.branch_target.role, User.Role.CENTRAL)
        self.assertIsNone(self.branch_target.branch_id)

    def test_invalid_central_with_branch_rejected_on_edit(self):
        response = self.client.post(
            reverse("accounts:user_edit", args=[self.central_target.pk]),
            {
                "name": self.central_target.name,
                "username": self.central_target.username,
                "role": "CENTRAL",
                "branch": str(self.branch.pk),
                "is_active": "on",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.central_target.refresh_from_db()
        self.assertIsNone(self.central_target.branch_id)

    def test_edit_does_not_expose_or_change_password(self):
        original_password_hash = self.central_target.password
        response = self.client.get(reverse("accounts:user_edit", args=[self.central_target.pk]))
        self.assertNotContains(response, "password")
        self.central_target.refresh_from_db()
        self.assertEqual(self.central_target.password, original_password_hash)


class UserActivationTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="UMACT", name="User Mgmt Activation Branch")
        self.admin_user = User.objects.create_user(
            username="umact.admin",
            name="UM Act Admin",
            password="a-strong-password",
            role=User.Role.CENTRAL,
            is_staff=True,
        )
        self.other_admin = User.objects.create_user(
            username="umact.admin2",
            name="UM Act Admin Two",
            password="a-strong-password",
            role=User.Role.CENTRAL,
            is_staff=True,
        )
        self.target = User.objects.create_user(
            username="umact.target",
            name="UM Act Target",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )
        self.client = Client()
        self.client.login(username="umact.admin", password="a-strong-password")

    def test_admin_can_deactivate_another_user(self):
        response = self.client.post(reverse("accounts:user_deactivate", args=[self.target.pk]))
        self.assertRedirects(response, reverse("accounts:user_list"))
        self.target.refresh_from_db()
        self.assertFalse(self.target.is_active)

    def test_admin_can_reactivate_user(self):
        self.target.is_active = False
        self.target.save()
        response = self.client.post(reverse("accounts:user_activate", args=[self.target.pk]))
        self.assertRedirects(response, reverse("accounts:user_list"))
        self.target.refresh_from_db()
        self.assertTrue(self.target.is_active)

    def test_admin_cannot_deactivate_self_via_dedicated_endpoint(self):
        response = self.client.post(reverse("accounts:user_deactivate", args=[self.admin_user.pk]))
        self.assertEqual(response.status_code, 403)
        self.admin_user.refresh_from_db()
        self.assertTrue(self.admin_user.is_active)

    def test_admin_cannot_deactivate_self_via_edit_form(self):
        response = self.client.post(
            reverse("accounts:user_edit", args=[self.admin_user.pk]),
            {
                "name": self.admin_user.name,
                "username": self.admin_user.username,
                "role": "CENTRAL",
                "branch": "",
                # is_active intentionally omitted -> unchecked checkbox -> False
            },
        )
        self.assertEqual(response.status_code, 200)
        self.admin_user.refresh_from_db()
        self.assertTrue(self.admin_user.is_active)

    def test_admins_can_manage_each_other(self):
        response = self.client.post(reverse("accounts:user_deactivate", args=[self.other_admin.pk]))
        self.assertRedirects(response, reverse("accounts:user_list"))
        self.other_admin.refresh_from_db()
        self.assertFalse(self.other_admin.is_active)


class UserPasswordResetTests(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="umpw.admin",
            name="UM PW Admin",
            password="a-strong-password",
            role=User.Role.CENTRAL,
            is_staff=True,
        )
        self.target = User.objects.create_user(
            username="umpw.target",
            name="UM PW Target",
            password="original-password-99",
            role=User.Role.CENTRAL,
        )
        self.client = Client()
        self.client.login(username="umpw.admin", password="a-strong-password")

    def test_admin_can_reset_another_users_password(self):
        response = self.client.post(
            reverse("accounts:user_password_reset", args=[self.target.pk]),
            {"new_password": "a-brand-new-password-99", "new_password_confirm": "a-brand-new-password-99"},
        )
        self.assertRedirects(response, reverse("accounts:user_list"))
        self.target.refresh_from_db()
        self.assertTrue(self.target.check_password("a-brand-new-password-99"))
        self.assertFalse(self.target.check_password("original-password-99"))

    def test_mismatched_confirmation_rejected(self):
        response = self.client.post(
            reverse("accounts:user_password_reset", args=[self.target.pk]),
            {"new_password": "a-brand-new-password-99", "new_password_confirm": "different-password-99"},
        )
        self.assertEqual(response.status_code, 200)
        self.target.refresh_from_db()
        self.assertTrue(self.target.check_password("original-password-99"))

    def test_non_admin_cannot_reset_password(self):
        branch = Branch.objects.create(code="UMPWNA", name="UM PW Non Admin Branch")
        User.objects.create_user(
            username="umpw.branchuser",
            name="UM PW Branch User",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=branch,
        )
        client = Client()
        client.login(username="umpw.branchuser", password="a-strong-password")
        response = client.post(
            reverse("accounts:user_password_reset", args=[self.target.pk]),
            {"new_password": "hijacked-password-99", "new_password_confirm": "hijacked-password-99"},
        )
        self.assertEqual(response.status_code, 403)
        self.target.refresh_from_db()
        self.assertTrue(self.target.check_password("original-password-99"))


class UserListSecurityAndDisplayTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="UMLIST", name="User Mgmt List Branch")
        self.admin_user = User.objects.create_user(
            username="umlist.admin",
            name="UM List Admin",
            password="a-strong-password",
            role=User.Role.CENTRAL,
            is_staff=True,
        )
        self.central_user = User.objects.create_user(
            username="umlist.central",
            name="UM List Central",
            password="a-secret-password-99",
            role=User.Role.CENTRAL,
        )
        self.branch_user = User.objects.create_user(
            username="umlist.branch",
            name="UM List Branch",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )
        self.client = Client()
        self.client.login(username="umlist.admin", password="a-strong-password")

    def test_password_and_hash_never_appear_in_list_html(self):
        response = self.client.get(reverse("accounts:user_list"))
        self.assertNotContains(response, "a-secret-password-99")
        self.assertNotContains(response, self.central_user.password)

    def test_list_shows_expected_columns(self):
        response = self.client.get(reverse("accounts:user_list"))
        self.assertContains(response, "UM List Central")
        self.assertContains(response, "umlist.central")
        self.assertContains(response, "UM List Branch")
        self.assertContains(response, self.branch.name)

    def test_search_by_name(self):
        response = self.client.get(reverse("accounts:user_list"), {"q": "List Central"})
        self.assertContains(response, "UM List Central")
        self.assertNotContains(response, "umlist.branch")

    def test_filter_by_role(self):
        response = self.client.get(reverse("accounts:user_list"), {"role": "BRANCH"})
        self.assertContains(response, "UM List Branch")
        self.assertNotContains(response, "umlist.central")

    def test_filter_by_status(self):
        self.central_user.is_active = False
        self.central_user.save()
        response = self.client.get(reverse("accounts:user_list"), {"status": "inactive"})
        self.assertContains(response, "UM List Central")
        self.assertNotContains(response, "umlist.branch")
