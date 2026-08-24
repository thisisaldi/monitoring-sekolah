from django.conf import settings
from django.db import models

from apps.budget_years.models import BudgetYear
from apps.schools.models import School


class ReportStatus(models.TextChoices):
    """Same data-completeness convention as MonthlyRealization.report_status."""

    COMPLETE = "COMPLETE", "Complete"
    INCOMPLETE = "INCOMPLETE", "Incomplete"


class BOSRecord(models.Model):
    """
    Annual BOS monitoring record, per DATABASE-SCHEMA.md section 16 and
    OBD-002 (BOS is annual per budget year -- DECIDED).
    """

    school = models.ForeignKey(School, on_delete=models.PROTECT, related_name="bos_records")
    budget_year = models.ForeignKey(
        BudgetYear, on_delete=models.PROTECT, related_name="bos_records"
    )
    opening_balance = models.DecimalField(max_digits=18, decimal_places=2)
    receipt_amount = models.DecimalField(max_digits=18, decimal_places=2)
    usage_amount = models.DecimalField(max_digits=18, decimal_places=2)
    rkas_compliance = models.BooleanField(null=True, blank=True)
    report_status = models.CharField(max_length=20, choices=ReportStatus.choices)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="+"
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="+"
    )

    class Meta:
        db_table = "bos_records"
        constraints = [
            models.UniqueConstraint(
                fields=["school", "budget_year"], name="bos_record_unique_school_budget_year"
            ),
            models.CheckConstraint(
                condition=models.Q(opening_balance__gte=0), name="bos_opening_balance_non_negative"
            ),
            models.CheckConstraint(
                condition=models.Q(receipt_amount__gte=0), name="bos_receipt_amount_non_negative"
            ),
            models.CheckConstraint(
                condition=models.Q(usage_amount__gte=0), name="bos_usage_amount_non_negative"
            ),
        ]

    @property
    def ending_balance(self):
        """ending_balance = opening_balance + receipt_amount - usage_amount"""
        return self.opening_balance + self.receipt_amount - self.usage_amount

    def __str__(self):
        return f"BOS {self.school} {self.budget_year}"
