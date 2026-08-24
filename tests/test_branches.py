"""
Phase 2B: the Branch model and the User -> Branch relationship.

No authentication workflow, RBAC, or business validation of the
BRANCH-requires-branch / CENTRAL-must-not-have-branch rule exists yet.
That belongs to Phase 2C.
"""
from django.db import IntegrityError, connection, transaction
from django.db.models import ProtectedError
from django.test import TestCase

from apps.accounts.models import User
from apps.branches.models import Branch


class BranchModelTests(TestCase):
    def test_branch_can_be_created(self):
        branch = Branch.objects.create(code="BDG", name="Bandung")
        self.assertIsNotNone(branch.pk)
        self.assertEqual(branch.code, "BDG")
        self.assertEqual(branch.name, "Bandung")

    def test_branch_code_is_required(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Branch.objects.create(code=None, name="No Code")

    def test_branch_code_is_unique(self):
        Branch.objects.create(code="DUP", name="First")
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Branch.objects.create(code="DUP", name="Second")

    def test_branch_name_is_required(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Branch.objects.create(code="NONAME", name=None)

    def test_branch_is_active_by_default(self):
        branch = Branch.objects.create(code="ACTIVE", name="Active Branch")
        self.assertTrue(branch.is_active)

    def test_branch_can_be_deactivated(self):
        branch = Branch.objects.create(code="DEACT", name="Deactivate Me")
        branch.is_active = False
        branch.save()
        branch.refresh_from_db()
        self.assertFalse(branch.is_active)

    def test_branch_timestamps_exist(self):
        branch = Branch.objects.create(code="TS", name="Timestamps")
        self.assertIsNotNone(branch.created_at)
        self.assertIsNotNone(branch.updated_at)


class UserBranchRelationshipTests(TestCase):
    def test_branch_user_can_reference_a_branch(self):
        branch = Branch.objects.create(code="BDG2", name="Bandung 2")
        user = User.objects.create_user(
            username="branch.user.rel",
            name="Branch User",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=branch,
        )
        self.assertEqual(user.branch, branch)

    def test_central_user_can_have_no_branch(self):
        user = User.objects.create_user(
            username="central.user.rel",
            name="Central User",
            password="a-strong-password",
            role=User.Role.CENTRAL,
        )
        self.assertIsNone(user.branch)

    def test_branch_users_related_manager_returns_expected_users(self):
        branch = Branch.objects.create(code="REL", name="Related Manager Branch")
        other_branch = Branch.objects.create(code="OTHER", name="Other Branch")

        user_one = User.objects.create_user(
            username="rel.user.one",
            name="Rel User One",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=branch,
        )
        user_two = User.objects.create_user(
            username="rel.user.two",
            name="Rel User Two",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=branch,
        )
        User.objects.create_user(
            username="rel.user.other",
            name="Rel User Other Branch",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=other_branch,
        )

        usernames = set(branch.users.values_list("username", flat=True))
        self.assertEqual(usernames, {user_one.username, user_two.username})

    def test_branch_deletion_does_not_cascade_delete_users(self):
        branch = Branch.objects.create(code="PROTECT", name="Protected Branch")
        User.objects.create_user(
            username="protected.user",
            name="Protected User",
            password="a-strong-password",
            role=User.Role.BRANCH,
            branch=branch,
        )
        with self.assertRaises(ProtectedError):
            branch.delete()
        # The user must still exist -- deletion was blocked, not cascaded.
        self.assertTrue(User.objects.filter(username="protected.user").exists())


class PostgreSQLBackendTests(TestCase):
    def test_database_is_postgresql(self):
        self.assertEqual(connection.vendor, "postgresql")
