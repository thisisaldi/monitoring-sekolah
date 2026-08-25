"""
Phase 1 foundation tests.

Verifies the technical foundation only (routing, templates, static
configuration, database connectivity). No business modules exist yet.
"""
from django.conf import settings
from django.db import connection
from django.test import Client, TestCase
from django.urls import reverse


class HomePageTests(TestCase):
    """
    Root routing correction (post-deployment): `/` is not a public/home
    page -- it routes straight to the authenticated entry point. See
    tests/test_authentication.py::RootRoutingTests for the authenticated
    case (requires a logged-in user, set up there).
    """

    def test_anonymous_root_redirects_to_login(self):
        response = Client().get(reverse("core:home"))
        self.assertRedirects(response, reverse("accounts:login"))


class HealthCheckTests(TestCase):
    def test_health_check_returns_200(self):
        response = Client().get(reverse("core:health_check"))
        self.assertEqual(response.status_code, 200)

    def test_health_check_returns_ok_status(self):
        response = Client().get(reverse("core:health_check"))
        self.assertEqual(response.json(), {"status": "ok"})


class HtmxDemoTests(TestCase):
    """
    The `core:home` URL (`/`) no longer renders the HTMX demo page inline
    (see HomePageTests) -- it's a pure auth-state redirect now. The
    partial-returning endpoint itself is untouched and still verified here.
    """

    def test_htmx_endpoint_returns_partial(self):
        response = Client().get(reverse("core:htmx_demo"))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "core/partials/htmx_demo_result.html")
        self.assertNotContains(response, "<html")


class DatabaseConnectionTests(TestCase):
    def test_database_is_postgresql(self):
        self.assertEqual(connection.vendor, "postgresql")

    def test_database_connection_works(self):
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            self.assertEqual(cursor.fetchone(), (1,))


class SettingsTests(TestCase):
    def test_timezone_support_enabled(self):
        self.assertTrue(settings.USE_TZ)

    def test_static_files_configured(self):
        self.assertTrue(settings.STATIC_URL)
        self.assertIn(settings.BASE_DIR / "static", settings.STATICFILES_DIRS)
