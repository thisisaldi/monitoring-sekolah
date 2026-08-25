from django.db import models


class Branch(models.Model):
    """
    Branch/perwakilan, per docs/design/DATABASE-SCHEMA.md section 9.

    Branch is an internal organizational/security entity, not user-facing
    Master Data. Management (create/edit/activate/deactivate) is is_staff-only
    system administration -- see apps/branches/views.py and
    apps/accounts/authorization.py::is_system_admin.
    """

    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "branches"

    def __str__(self):
        return self.name
