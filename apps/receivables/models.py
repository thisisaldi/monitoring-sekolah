from django.conf import settings
from django.db import models

from apps.budget_years.models import BudgetYear
from apps.schools.models import School


class Receivable(models.Model):
    """
    Annual receivable monitoring record, per DATABASE-SCHEMA.md section 17
    and OBD-003 (Receivable is annual per budget year -- DECIDED).

    OBD-005 (overdue percentage formula) is PENDING. No formula is
    implemented here -- see the `overdue_percentage` property, which always
    returns None. Do not derive this value elsewhere; this is the single
    place to update once OBD-005 is decided.
    """

    school = models.ForeignKey(School, on_delete=models.PROTECT, related_name="receivables")
    budget_year = models.ForeignKey(
        BudgetYear, on_delete=models.PROTECT, related_name="receivables"
    )
    opening_balance = models.DecimalField(max_digits=18, decimal_places=2)
    addition_amount = models.DecimalField(max_digits=18, decimal_places=2)
    settlement_amount = models.DecimalField(max_digits=18, decimal_places=2)
    dominant_age = models.CharField(max_length=100, null=True, blank=True)
    follow_up = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="+"
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="+"
    )

    class Meta:
        db_table = "receivables"
        constraints = [
            models.UniqueConstraint(
                fields=["school", "budget_year"], name="receivable_unique_school_budget_year"
            ),
            models.CheckConstraint(
                condition=models.Q(opening_balance__gte=0),
                name="receivable_opening_balance_non_negative",
            ),
            models.CheckConstraint(
                condition=models.Q(addition_amount__gte=0),
                name="receivable_addition_amount_non_negative",
            ),
            models.CheckConstraint(
                condition=models.Q(settlement_amount__gte=0),
                name="receivable_settlement_amount_non_negative",
            ),
        ]

    @property
    def ending_balance(self):
        """ending_balance = opening_balance + addition_amount - settlement_amount"""
        return self.opening_balance + self.addition_amount - self.settlement_amount

    @property
    def overdue_percentage(self):
        """
        OBD-005 is PENDING. No formula exists -- this must not fabricate
        one. Always None until the business formula is confirmed.
        """
        return None

    def __str__(self):
        return f"Receivable {self.school} {self.budget_year}"
