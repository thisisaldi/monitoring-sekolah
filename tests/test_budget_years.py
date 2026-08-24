"""
Phase 3: the BudgetYear model and its Master Data UI.

BudgetYear is global master data -- both CENTRAL and BRANCH can view it,
only CENTRAL can create/edit/deactivate.
"""
import datetime

from django.db import IntegrityError, connection, transaction
from django.test import Client, TestCase
from django.urls import reverse

from apps.accounts.models import User
from apps.branches.models import Branch
from apps.budget_years.models import BudgetYear


class BudgetYearModelTests(TestCase):
    def test_budget_year_can_be_created(self):
        budget_year = BudgetYear.objects.create(
            name="TA 2026/2027",
            start_date=datetime.date(2026, 7, 1),
            end_date=datetime.date(2027, 6, 30),
        )
        self.assertIsNotNone(budget_year.pk)
        self.assertEqual(budget_year.name, "TA 2026/2027")

    def test_name_must_be_unique(self):
        BudgetYear.objects.create(
            name="TA DUP",
            start_date=datetime.date(2026, 7, 1),
            end_date=datetime.date(2027, 6, 30),
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                BudgetYear.objects.create(
                    name="TA DUP",
                    start_date=datetime.date(2027, 7, 1),
                    end_date=datetime.date(2028, 6, 30),
                )

    def test_start_date_is_required(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                BudgetYear.objects.create(
                    name="TA NOSTART", start_date=None, end_date=datetime.date(2027, 6, 30)
                )

    def test_end_date_is_required(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                BudgetYear.objects.create(
                    name="TA NOEND", start_date=datetime.date(2026, 7, 1), end_date=None
                )

    def test_start_date_must_be_before_end_date(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                BudgetYear.objects.create(
                    name="TA BACKWARDS",
                    start_date=datetime.date(2027, 6, 30),
                    end_date=datetime.date(2026, 7, 1),
                )

    def test_database_check_constraint_rejects_equal_dates(self):
        same_date = datetime.date(2026, 7, 1)
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                BudgetYear.objects.create(
                    name="TA EQUAL", start_date=same_date, end_date=same_date
                )

    def test_is_active_defaults_true(self):
        budget_year = BudgetYear.objects.create(
            name="TA ACTIVE",
            start_date=datetime.date(2026, 7, 1),
            end_date=datetime.date(2027, 6, 30),
        )
        self.assertTrue(budget_year.is_active)

    def test_budget_year_can_be_deactivated(self):
        budget_year = BudgetYear.objects.create(
            name="TA DEACT",
            start_date=datetime.date(2026, 7, 1),
            end_date=datetime.date(2027, 6, 30),
        )
        budget_year.is_active = False
        budget_year.save()
        budget_year.refresh_from_db()
        self.assertFalse(budget_year.is_active)

    def test_timestamps_exist(self):
        budget_year = BudgetYear.objects.create(
            name="TA TS",
            start_date=datetime.date(2026, 7, 1),
            end_date=datetime.date(2027, 6, 30),
        )
        self.assertIsNotNone(budget_year.created_at)
        self.assertIsNotNone(budget_year.updated_at)

    def test_database_is_postgresql(self):
        self.assertEqual(connection.vendor, "postgresql")


class BudgetYearUITests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="BYUI", name="Budget Year UI Branch")
        self.central_user = User.objects.create_user(
            username="by.central",
            name="BY Central",
            password="a-strong-password",
            role=User.Role.CENTRAL,
        )
        self.branch_user = User.objects.create_user(
            username="by.branch",
            name="BY Branch",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )
        self.budget_year = BudgetYear.objects.create(
            name="TA UI",
            start_date=datetime.date(2026, 7, 1),
            end_date=datetime.date(2027, 6, 30),
        )

    def login(self, username):
        client = Client()
        client.login(username=username, password="a-strong-password")
        return client

    def test_central_can_list_budget_years(self):
        client = self.login("by.central")
        response = client.get(reverse("budget_years:list"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "TA UI")

    def test_central_can_create_budget_year(self):
        client = self.login("by.central")
        response = client.post(
            reverse("budget_years:create"),
            {
                "name": "TA NEW",
                "start_date": "2027-07-01",
                "end_date": "2028-06-30",
            },
        )
        self.assertRedirects(response, reverse("budget_years:list"))
        self.assertTrue(BudgetYear.objects.filter(name="TA NEW").exists())

    def test_central_can_edit_budget_year(self):
        client = self.login("by.central")
        response = client.post(
            reverse("budget_years:edit", args=[self.budget_year.pk]),
            {
                "name": "TA UI EDITED",
                "start_date": "2026-07-01",
                "end_date": "2027-06-30",
            },
        )
        self.assertRedirects(response, reverse("budget_years:list"))
        self.budget_year.refresh_from_db()
        self.assertEqual(self.budget_year.name, "TA UI EDITED")

    def test_central_can_deactivate_budget_year(self):
        client = self.login("by.central")
        response = client.post(reverse("budget_years:deactivate", args=[self.budget_year.pk]))
        self.assertRedirects(response, reverse("budget_years:list"))
        self.budget_year.refresh_from_db()
        self.assertFalse(self.budget_year.is_active)

    def test_branch_can_view_budget_years(self):
        client = self.login("by.branch")
        response = client.get(reverse("budget_years:list"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "TA UI")

    def test_branch_cannot_create_budget_year(self):
        client = self.login("by.branch")
        response = client.post(
            reverse("budget_years:create"),
            {"name": "TA ILLEGAL", "start_date": "2027-07-01", "end_date": "2028-06-30"},
        )
        self.assertEqual(response.status_code, 403)
        self.assertFalse(BudgetYear.objects.filter(name="TA ILLEGAL").exists())

    def test_branch_cannot_edit_budget_year(self):
        client = self.login("by.branch")
        response = client.post(
            reverse("budget_years:edit", args=[self.budget_year.pk]),
            {"name": "TA HIJACKED", "start_date": "2026-07-01", "end_date": "2027-06-30"},
        )
        self.assertEqual(response.status_code, 403)
        self.budget_year.refresh_from_db()
        self.assertNotEqual(self.budget_year.name, "TA HIJACKED")

    def test_branch_cannot_deactivate_budget_year(self):
        client = self.login("by.branch")
        response = client.post(
            reverse("budget_years:deactivate", args=[self.budget_year.pk])
        )
        self.assertEqual(response.status_code, 403)
        self.budget_year.refresh_from_db()
        self.assertTrue(self.budget_year.is_active)

    def test_anonymous_user_is_redirected_to_login(self):
        response = Client().get(reverse("budget_years:list"))
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("accounts:login"), response.url)

    def test_form_shows_validation_error_for_backwards_dates(self):
        client = self.login("by.central")
        response = client.post(
            reverse("budget_years:create"),
            {
                "name": "TA BAD FORM",
                "start_date": "2028-01-01",
                "end_date": "2027-01-01",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(BudgetYear.objects.filter(name="TA BAD FORM").exists())
        self.assertContains(response, "Start date must be before end date")
