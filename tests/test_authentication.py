"""
Phase 2C: login / logout / landing page, at the HTTP level.
"""
from django.test import Client, TestCase
from django.urls import reverse

from apps.accounts.models import User
from apps.branches.models import Branch


class LoginViewTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="LOGIN", name="Login Test Branch")
        self.user = User.objects.create_user(
            username="login.user",
            name="Login User",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )

    def test_login_page_is_publicly_accessible(self):
        response = Client().get(reverse("accounts:login"))
        self.assertEqual(response.status_code, 200)

    def test_successful_login_creates_authenticated_session_and_redirects(self):
        client = Client()
        response = client.post(
            reverse("accounts:login"),
            {"username": "login.user", "password": "a-strong-password"},
        )
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse("accounts:landing"))

        landing = client.get(reverse("accounts:landing"))
        self.assertEqual(landing.status_code, 200)

    def test_failed_login_remains_on_login_page_with_generic_error(self):
        client = Client()
        response = client.post(
            reverse("accounts:login"),
            {"username": "login.user", "password": "wrong-password"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "accounts/login.html")
        self.assertFalse(response.wsgi_request.user.is_authenticated)

    def test_failed_login_does_not_reveal_whether_username_exists(self):
        client = Client()
        nonexistent = client.post(
            reverse("accounts:login"),
            {"username": "does.not.exist", "password": "whatever"},
        )
        wrong_password = client.post(
            reverse("accounts:login"),
            {"username": "login.user", "password": "wrong-password"},
        )
        self.assertEqual(
            nonexistent.context["form"].errors["__all__"],
            wrong_password.context["form"].errors["__all__"],
        )

    def test_inactive_user_cannot_log_in(self):
        User.objects.create_user(
            username="inactive.login",
            name="Inactive Login",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
            is_active=False,
        )
        client = Client()
        response = client.post(
            reverse("accounts:login"),
            {"username": "inactive.login", "password": "a-strong-password"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.wsgi_request.user.is_authenticated)


class LogoutViewTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="LOGOUT", name="Logout Test Branch")
        self.user = User.objects.create_user(
            username="logout.user",
            name="Logout User",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )

    def test_logout_ends_session_and_protected_page_requires_login_again(self):
        client = Client()
        client.login(username="logout.user", password="a-strong-password")
        self.assertEqual(client.get(reverse("accounts:landing")).status_code, 200)

        client.post(reverse("accounts:logout"))

        response = client.get(reverse("accounts:landing"))
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("accounts:login"), response.url)


class LandingPageTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="LAND", name="Landing Test Branch")

    def test_anonymous_user_is_redirected_to_login(self):
        response = Client().get(reverse("accounts:landing"))
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("accounts:login"), response.url)

    def test_authenticated_branch_user_sees_own_branch(self):
        User.objects.create_user(
            username="landing.branch",
            name="Landing Branch User",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )
        client = Client()
        client.login(username="landing.branch", password="a-strong-password")
        response = client.get(reverse("accounts:landing"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Landing Branch User")
        self.assertContains(response, "Landing Test Branch")

    def test_authenticated_central_user_sees_central(self):
        """
        CENTRAL role is displayed to users as "Pusat" (Indonesian UI, Phase
        12 UI/UX refinement) -- this proves the role is correctly resolved
        and rendered, not that the literal English word "Central" appears.
        """
        User.objects.create_user(
            username="landing.central",
            name="Landing Central User",
            password="a-strong-password",
            role=User.Role.CENTRAL,
        )
        client = Client()
        client.login(username="landing.central", password="a-strong-password")
        response = client.get(reverse("accounts:landing"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Pusat")
