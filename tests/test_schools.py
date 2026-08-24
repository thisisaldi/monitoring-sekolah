"""
Phase 3A: the School model and its relationship to Branch.

No BudgetYear, financial modules, or master-data UI exist yet.
"""
from django.db import IntegrityError, connection, transaction
from django.db.models import ProtectedError
from django.test import TestCase

from apps.branches.models import Branch
from apps.schools.models import School


class SchoolCreationTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="SCH-BR", name="School Test Branch")

    def test_school_can_be_created(self):
        school = School.objects.create(
            branch=self.branch, code="SCH001", name="School One"
        )
        self.assertIsNotNone(school.pk)
        self.assertEqual(school.name, "School One")

    def test_school_requires_a_branch(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                School.objects.create(branch=None, code="NOBR", name="No Branch School")

    def test_school_code_is_required(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                School.objects.create(branch=self.branch, code=None, name="No Code School")

    def test_school_name_is_required(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                School.objects.create(branch=self.branch, code="NONAME", name=None)


class SchoolUniquenessTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="UNIQ-BR", name="Uniqueness Branch")

    def test_school_code_must_be_unique(self):
        School.objects.create(branch=self.branch, code="DUP", name="First School")
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                School.objects.create(branch=self.branch, code="DUP", name="Second School")


class SchoolOptionalFieldsTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="OPT-BR", name="Optional Fields Branch")

    def test_education_level_may_be_null(self):
        school = School.objects.create(
            branch=self.branch, code="OPT1", name="Opt School 1", education_level=None
        )
        self.assertIsNone(school.education_level)

    def test_principal_name_may_be_null(self):
        school = School.objects.create(
            branch=self.branch, code="OPT2", name="Opt School 2", principal_name=None
        )
        self.assertIsNone(school.principal_name)

    def test_treasurer_name_may_be_null(self):
        school = School.objects.create(
            branch=self.branch, code="OPT3", name="Opt School 3", treasurer_name=None
        )
        self.assertIsNone(school.treasurer_name)

    def test_student_count_may_be_null(self):
        school = School.objects.create(
            branch=self.branch, code="OPT4", name="Opt School 4", student_count=None
        )
        self.assertIsNone(school.student_count)

    def test_note_may_be_null(self):
        school = School.objects.create(
            branch=self.branch, code="OPT5", name="Opt School 5", note=None
        )
        self.assertIsNone(school.note)


class SchoolStudentCountTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="SC-BR", name="Student Count Branch")

    def test_zero_student_count_is_valid(self):
        school = School.objects.create(
            branch=self.branch, code="SC0", name="Zero Count School", student_count=0
        )
        self.assertEqual(school.student_count, 0)

    def test_positive_student_count_is_valid(self):
        school = School.objects.create(
            branch=self.branch, code="SCP", name="Positive Count School", student_count=250
        )
        self.assertEqual(school.student_count, 250)

    def test_negative_student_count_is_rejected_by_database(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                School.objects.create(
                    branch=self.branch,
                    code="SCN",
                    name="Negative Count School",
                    student_count=-1,
                )


class SchoolBranchRelationshipTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="REL-BR", name="Relationship Branch")
        self.other_branch = Branch.objects.create(code="REL-BR2", name="Other Relationship Branch")

    def test_school_belongs_to_exactly_one_branch(self):
        school = School.objects.create(branch=self.branch, code="RELS1", name="Rel School 1")
        self.assertEqual(school.branch, self.branch)

    def test_branch_school_reverse_accessor_returns_the_single_school(self):
        school = School.objects.create(branch=self.branch, code="RELS2", name="Rel School 2")
        School.objects.create(branch=self.other_branch, code="RELS4", name="Rel School 4 Other")

        self.assertEqual(self.branch.school, school)

    def test_branch_may_have_at_most_one_school(self):
        """Branch<->School is 1:1: schools.branch_id UNIQUE rejects a second school."""
        School.objects.create(branch=self.branch, code="RELS5", name="Rel School 5")
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                School.objects.create(branch=self.branch, code="RELS6", name="Rel School 6")

    def test_branch_deletion_is_protected_when_schools_exist(self):
        branch = Branch.objects.create(code="PROTBR", name="Protect Branch")
        School.objects.create(branch=branch, code="PROTS", name="Protect School")
        with self.assertRaises(ProtectedError):
            branch.delete()
        self.assertTrue(School.objects.filter(code="PROTS").exists())


class SchoolActiveStatusTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="ACT-BR", name="Active Status Branch")

    def test_is_active_defaults_true(self):
        school = School.objects.create(branch=self.branch, code="ACT1", name="Active School")
        self.assertTrue(school.is_active)

    def test_school_can_be_deactivated(self):
        school = School.objects.create(branch=self.branch, code="ACT2", name="Deactivate School")
        school.is_active = False
        school.save()
        school.refresh_from_db()
        self.assertFalse(school.is_active)


class SchoolTimestampTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="TS-BR", name="Timestamp Branch")

    def test_created_at_exists(self):
        school = School.objects.create(branch=self.branch, code="TS1", name="Timestamp School 1")
        self.assertIsNotNone(school.created_at)

    def test_updated_at_exists(self):
        school = School.objects.create(branch=self.branch, code="TS2", name="Timestamp School 2")
        self.assertIsNotNone(school.updated_at)


class SchoolDatabaseTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="DB-BR", name="Database Branch")

    def test_database_is_postgresql(self):
        self.assertEqual(connection.vendor, "postgresql")

    def test_branch_id_has_a_unique_constraint_in_postgresql(self):
        """
        Verifies the Branch<->School 1:1 correction is enforced by an actual
        PostgreSQL unique index/constraint on schools.branch_id -- not just
        Django model metadata.
        """
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT indexdef FROM pg_indexes
                WHERE tablename = 'schools' AND indexdef ILIKE '%UNIQUE%'
                  AND indexdef ILIKE '%branch_id%'
                """
            )
            rows = cursor.fetchall()
        self.assertTrue(rows, "Expected a UNIQUE index on schools.branch_id")

    def test_student_count_check_constraint_is_enforced(self):
        """Bypasses application-level assumptions -- proves the DB itself rejects it."""
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                School.objects.create(
                    branch=self.branch,
                    code="DBCHK",
                    name="DB Check School",
                    student_count=-100,
                )
