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
    def test_home_page_returns_200(self):
        response = Client().get(reverse("core:home"))
        self.assertEqual(response.status_code, 200)

    def test_home_page_uses_base_template(self):
        response = Client().get(reverse("core:home"))
        self.assertTemplateUsed(response, "base/base.html")


class HealthCheckTests(TestCase):
    def test_health_check_returns_200(self):
        response = Client().get(reverse("core:health_check"))
        self.assertEqual(response.status_code, 200)

    def test_health_check_returns_ok_status(self):
        response = Client().get(reverse("core:health_check"))
        self.assertEqual(response.json(), {"status": "ok"})


class HtmxDemoTests(TestCase):
    def test_htmx_endpoint_returns_partial(self):
        response = Client().get(reverse("core:htmx_demo"))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "core/partials/htmx_demo_result.html")
        self.assertNotContains(response, "<html")

    def test_home_page_loads_htmx_script(self):
        response = Client().get(reverse("core:home"))
        self.assertContains(response, "htmx")
        self.assertContains(response, "hx-get")


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
