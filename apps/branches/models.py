from django.db import models


class Branch(models.Model):
    """
    Branch/perwakilan master data, per docs/design/DATABASE-SCHEMA.md section 9.

    Master data management (who may create/edit/deactivate branches) is an
    open business decision (OBD-001) and is not addressed here. This model
    only establishes the entity and its relationship to User.
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
