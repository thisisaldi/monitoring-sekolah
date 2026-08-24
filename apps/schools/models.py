from django.db import models

from apps.branches.models import Branch


class School(models.Model):
    """
    School master data, per docs/design/DATABASE-SCHEMA.md section 10.

    Master data management (who may create/edit/deactivate schools, assign
    schools to branches) is OBD-001 -- decided as Central/Admin-managed, but
    the actual management UI/workflow is out of scope for this phase. This
    model only establishes the entity and its relationship to Branch.

    Branch <-> School is 1:1 (one branch operates exactly one school) --
    a corrected business requirement, superseding the earlier 1:N model.
    A OneToOneField gives us this at the database level (UNIQUE on
    branch_id) rather than relying on application-level enforcement.
    `branch.school` (singular) is the correct reverse accessor -- do not
    reintroduce `branch.schools.all()`-style code assuming multiple
    schools per branch.
    """

    branch = models.OneToOneField(
        Branch,
        on_delete=models.PROTECT,
        related_name="school",
    )
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    education_level = models.CharField(max_length=50, null=True, blank=True)
    principal_name = models.CharField(max_length=150, null=True, blank=True)
    treasurer_name = models.CharField(max_length=150, null=True, blank=True)
    student_count = models.IntegerField(null=True, blank=True)
    note = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "schools"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(student_count__gte=0) | models.Q(student_count__isnull=True),
                name="school_student_count_non_negative",
            ),
        ]

    def __str__(self):
        return self.name
