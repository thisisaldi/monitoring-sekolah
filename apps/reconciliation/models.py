from django.conf import settings
from django.db import models

from apps.budget_years.models import BudgetYear
from apps.schools.models import School


class ReconciliationStatus(models.TextChoices):
    """OBD-006 (DECIDED): difference = 0 -> SESUAI, difference != 0 -> TIDAK_SESUAI."""

    SESUAI = "SESUAI", "Sesuai"
    TIDAK_SESUAI = "TIDAK_SESUAI", "Tidak Sesuai"


class Reconciliation(models.Model):
    """
    Annual reconciliation record, per DATABASE-SCHEMA.md section 18 and
    OBD-004 (Reconciliation is annual per budget year -- DECIDED).

    `financial_statement_balance` and `bank_balance` have no documented
    non-negativity constraint (unlike opening/receipt/usage balances in
    other modules) -- DATABASE-SCHEMA.md section 24 does not list one for
    this table, so none is invented here.
    """

    school = models.ForeignKey(School, on_delete=models.PROTECT, related_name="reconciliations")
    budget_year = models.ForeignKey(
        BudgetYear, on_delete=models.PROTECT, related_name="reconciliations"
    )
    financial_statement_balance = models.DecimalField(max_digits=18, decimal_places=2)
    bank_balance = models.DecimalField(max_digits=18, decimal_places=2)
    rkas_compliance = models.BooleanField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
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
        db_table = "reconciliations"
        constraints = [
            models.UniqueConstraint(
                fields=["school", "budget_year"],
                name="reconciliation_unique_school_budget_year",
            ),
        ]

    @property
    def difference(self):
        """difference = bank_balance - financial_statement_balance"""
        return self.bank_balance - self.financial_statement_balance

    @property
    def status(self):
        """OBD-006: derived, never manually editable."""
        if self.difference == 0:
            return ReconciliationStatus.SESUAI
        return ReconciliationStatus.TIDAK_SESUAI

    def __str__(self):
        return f"Reconciliation {self.school} {self.budget_year}"
