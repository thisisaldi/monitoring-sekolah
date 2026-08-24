from django.db import models


class BudgetYear(models.Model):
    """
    Budget year master data, per docs/design/DATABASE-SCHEMA.md section 11.

    Global master data (not owned by any branch): every school reports
    against the same set of budget years.
    """

    name = models.CharField(max_length=50, unique=True)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "budget_years"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(start_date__lt=models.F("end_date")),
                name="budget_year_start_before_end",
            ),
        ]

    def __str__(self):
        return self.name
