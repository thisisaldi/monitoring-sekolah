"""
Custom User model tests: creation, uniqueness, password hashing, role
constraints, and the BRANCH<->Branch cross-field validation rule (Phase 2C).

No authentication view / RBAC HTTP-level tests here -- see
tests/test_authentication.py and tests/test_authorization.py.
"""
from django.contrib.auth import authenticate, get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase

from apps.accounts.models import User
from apps.branches.models import Branch


class CustomUserModelTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="TESTBR", name="Test Branch")

    def test_django_recognizes_custom_user_model(self):
        self.assertIs(get_user_model(), User)

    def test_user_can_be_created(self):
        user = User.objects.create_user(
            username="branch.bandung",
            name="Branch Bandung",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )
        self.assertIsNotNone(user.pk)
        self.assertEqual(user.username, "branch.bandung")
        self.assertEqual(user.name, "Branch Bandung")

    def test_user_can_exist_without_branch(self):
        """A CENTRAL user has no branch -- this is the valid, expected combination."""
        user = User.objects.create_user(
            username="no.branch",
            name="No Branch",
            password="a-strong-password",
            role=User.Role.CENTRAL,
        )
        self.assertIsNone(user.branch)

    def test_username_must_be_unique(self):
        User.objects.create_user(
            username="duplicate",
            name="First",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                User.objects.create_user(
                    username="duplicate",
                    name="Second",
                    password="another-password",
                    role=User.Role.BRANCH,
                    branch=self.branch,
                )

    def test_password_is_hashed_not_plaintext(self):
        user = User.objects.create_user(
            username="hashed.user",
            name="Hashed User",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )
        self.assertNotEqual(user.password, "a-strong-password")
        self.assertTrue(user.password.startswith("pbkdf2_") or "$" in user.password)

    def test_check_password_verifies_correct_password(self):
        user = User.objects.create_user(
            username="check.user",
            name="Check User",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )
        self.assertTrue(user.check_password("a-strong-password"))
        self.assertFalse(user.check_password("wrong-password"))

    def test_authenticate_succeeds_with_correct_credentials(self):
        User.objects.create_user(
            username="auth.user",
            name="Auth User",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )
        authenticated = authenticate(username="auth.user", password="a-strong-password")
        self.assertIsNotNone(authenticated)
        self.assertEqual(authenticated.username, "auth.user")

    def test_authenticate_fails_with_wrong_password(self):
        User.objects.create_user(
            username="auth.fail",
            name="Auth Fail",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )
        authenticated = authenticate(username="auth.fail", password="wrong-password")
        self.assertIsNone(authenticated)

    def test_role_is_required_and_creation_is_rejected_without_it(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(
                username="no.role",
                name="No Role",
                password="a-strong-password",
            )

    def test_role_is_required_and_none_is_rejected(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(
                username="none.role",
                name="None Role",
                password="a-strong-password",
                role=None,
            )

    def test_role_rejects_invalid_value(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(
                username="invalid.role",
                name="Invalid Role",
                password="a-strong-password",
                role="NOT_A_REAL_ROLE",
            )

    def test_role_accepts_explicit_central(self):
        user = User.objects.create_user(
            username="central.user",
            name="Central User",
            password="a-strong-password",
            role=User.Role.CENTRAL,
        )
        self.assertEqual(user.role, User.Role.CENTRAL)

    def test_role_accepts_explicit_branch(self):
        user = User.objects.create_user(
            username="branch.user",
            name="Branch User",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )
        self.assertEqual(user.role, User.Role.BRANCH)

    def test_role_field_has_no_model_level_default(self):
        field = User._meta.get_field("role")
        self.assertTrue(field.has_default() is False or field.get_default() in (None, ""))

    def test_role_choices_are_constrained(self):
        field = User._meta.get_field("role")
        values = {choice[0] for choice in field.choices}
        self.assertEqual(values, {"CENTRAL", "BRANCH"})

    def test_database_rejects_invalid_role_bypassing_manager(self):
        """
        The UserManager already rejects an invalid role in Python. This test
        bypasses the manager entirely (direct model instantiation + save) to
        prove the PostgreSQL CHECK constraint enforces it at the DB level too.
        The garbage role value below doesn't match BRANCH/CENTRAL, so the
        clean() cross-field check (added in Phase 2C) doesn't intervene --
        this still exercises the DB CHECK constraint from Phase 2A.
        """
        user = User(
            username="db.constraint.user",
            name="DB Constraint User",
            role="NOT_A_REAL_ROLE",
        )
        user.set_password("a-strong-password")
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                user.save()

    def test_database_rejects_empty_string_role_bypassing_manager(self):
        user = User(
            username="db.constraint.empty",
            name="DB Constraint Empty",
            role="",
        )
        user.set_password("a-strong-password")
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                user.save()

    def test_is_active_defaults_true(self):
        user = User.objects.create_user(
            username="active.default",
            name="Active Default",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )
        self.assertTrue(user.is_active)

    def test_inactive_user_cannot_authenticate(self):
        User.objects.create_user(
            username="inactive.user",
            name="Inactive User",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
            is_active=False,
        )
        authenticated = authenticate(username="inactive.user", password="a-strong-password")
        self.assertIsNone(authenticated)

    def test_created_at_is_set(self):
        user = User.objects.create_user(
            username="created.user",
            name="Created User",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )
        self.assertIsNotNone(user.created_at)

    def test_updated_at_is_set(self):
        user = User.objects.create_user(
            username="updated.user",
            name="Updated User",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )
        self.assertIsNotNone(user.updated_at)

    def test_updated_at_changes_on_save(self):
        user = User.objects.create_user(
            username="updated.change",
            name="Updated Change",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )
        first_updated_at = user.updated_at
        user.name = "Changed Name"
        user.save()
        user.refresh_from_db()
        self.assertGreater(user.updated_at, first_updated_at)

    def test_superuser_creation_requires_explicit_role(self):
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                username="admin.no.role",
                name="Admin No Role",
                password="a-strong-password",
            )

    def test_superuser_creation_sets_expected_flags(self):
        superuser = User.objects.create_superuser(
            username="admin.user",
            name="Admin User",
            password="a-strong-password",
            role=User.Role.CENTRAL,
        )
        self.assertTrue(superuser.is_staff)
        self.assertTrue(superuser.is_superuser)
        self.assertEqual(superuser.role, User.Role.CENTRAL)


class UserBranchCrossFieldValidationTests(TestCase):
    """Phase 2C: role=BRANCH requires a branch; role=CENTRAL must not have one."""

    def setUp(self):
        self.branch = Branch.objects.create(code="XFIELD", name="Cross Field Branch")

    def test_branch_role_without_branch_is_rejected(self):
        with self.assertRaises(ValidationError):
            User.objects.create_user(
                username="branch.no.branch",
                name="Branch No Branch",
                password="a-strong-password",
                role=User.Role.BRANCH,
            )

    def test_central_role_with_branch_is_rejected(self):
        with self.assertRaises(ValidationError):
            User.objects.create_user(
                username="central.with.branch",
                name="Central With Branch",
                password="a-strong-password",
                role=User.Role.CENTRAL,
                branch=self.branch,
            )

    def test_valid_central_user_with_null_branch_succeeds(self):
        user = User.objects.create_user(
            username="valid.central",
            name="Valid Central",
            password="a-strong-password",
            role=User.Role.CENTRAL,
        )
        self.assertIsNone(user.branch)

    def test_valid_branch_user_with_assigned_branch_succeeds(self):
        user = User.objects.create_user(
            username="valid.branch",
            name="Valid Branch",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=self.branch,
        )
        self.assertEqual(user.branch, self.branch)

    def test_rejected_branch_role_leaves_no_row_in_database(self):
        with self.assertRaises(ValidationError):
            User.objects.create_user(
                username="never.saved",
                name="Never Saved",
                password="a-strong-password",
                role=User.Role.BRANCH,
            )
        self.assertFalse(User.objects.filter(username="never.saved").exists())
