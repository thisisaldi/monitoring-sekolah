from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from apps.schools.models import School


class FindingStatus(models.TextChoices):
    """OBD-007 (DECIDED): exactly these three values."""

    OPEN = "OPEN", "Open"
    ON_PROGRESS = "ON_PROGRESS", "On Progress"
    COMPLETED = "COMPLETED", "Completed"


class Finding(models.Model):
    """
    Monitoring finding and follow-up, per DATABASE-SCHEMA.md section 19.

    Related to School only -- no budget_year relationship, matching the
    existing schema (not invented here). Authority follows the core
    Branch-inputs/Central-monitors rule per the current task's fallback
    instruction, since BRD/OBD do not explicitly assign finding entry to
    Central/Admin.
    """

    school = models.ForeignKey(School, on_delete=models.PROTECT, related_name="findings")
    finding_date = models.DateField()
    source = models.CharField(max_length=150)
    finding = models.TextField()
    amount = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    risk = models.CharField(max_length=50, null=True, blank=True)
    recommendation = models.TextField()
    pic = models.CharField(max_length=150)
    deadline = models.DateField()
    status = models.CharField(max_length=20, choices=FindingStatus.choices)
    completed_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="+"
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="+"
    )

    class Meta:
        db_table = "findings"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(amount__isnull=True) | models.Q(amount__gte=0),
                name="finding_amount_non_negative",
            ),
            # OBD-007 hard rule: COMPLETED requires completed_date. Enforced
            # at the database level since it is unambiguously stated as
            # "required".
            models.CheckConstraint(
                condition=~models.Q(status="COMPLETED") | models.Q(completed_date__isnull=False),
                name="finding_completed_requires_completed_date",
            ),
        ]

    def clean(self):
        super().clean()
        # OBD-007 soft rule ("should remain empty"): enforced at the
        # application layer, not as a hard DB constraint.
        if self.status != FindingStatus.COMPLETED and self.completed_date is not None:
            raise ValidationError(
                {"completed_date": "Completed date should remain empty unless status is COMPLETED."}
            )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Finding: {self.school} ({self.finding_date})"
