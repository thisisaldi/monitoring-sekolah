from decimal import Decimal

from django.conf import settings
from django.db import models

from apps.budget_years.models import BudgetYear
from apps.schools.models import School


class ReportStatus(models.TextChoices):
    """
    Data-completeness status, per DATABASE-SCHEMA.md section 14: "This
    represents data completeness, not approval."
    """

    COMPLETE = "COMPLETE", "Complete"
    INCOMPLETE = "INCOMPLETE", "Incomplete"


class MonthlyRealization(models.Model):
    """
    Monthly financial realization, per DATABASE-SCHEMA.md section 14.

    One row per (school, budget_year, month) -- not twelve columns.
    """

    school = models.ForeignKey(
        School, on_delete=models.PROTECT, related_name="monthly_realizations"
    )
    budget_year = models.ForeignKey(
        BudgetYear, on_delete=models.PROTECT, related_name="monthly_realizations"
    )
    month = models.PositiveSmallIntegerField()
    budget_amount = models.DecimalField(max_digits=18, decimal_places=2)
    realization_amount = models.DecimalField(max_digits=18, decimal_places=2)
    variance_explanation = models.TextField(null=True, blank=True)
    report_status = models.CharField(max_length=20, choices=ReportStatus.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="+"
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="+"
    )

    class Meta:
        db_table = "monthly_realizations"
        constraints = [
            models.UniqueConstraint(
                fields=["school", "budget_year", "month"],
                name="monthly_realization_unique_period",
            ),
            models.CheckConstraint(
                condition=models.Q(month__gte=1) & models.Q(month__lte=12),
                name="monthly_realization_month_range",
            ),
            models.CheckConstraint(
                condition=models.Q(budget_amount__gte=0),
                name="monthly_realization_budget_non_negative",
            ),
            models.CheckConstraint(
                condition=models.Q(realization_amount__gte=0),
                name="monthly_realization_amount_non_negative",
            ),
        ]

    @property
    def variance(self):
        """variance = budget_amount - realization_amount"""
        return self.budget_amount - self.realization_amount

    @property
    def realization_percentage(self):
        """
        realization_percentage = realization_amount / budget_amount * 100.
        NULL (None) if budget_amount is zero -- never a division error.
        """
        if self.budget_amount == 0:
            return None
        return (self.realization_amount / self.budget_amount) * Decimal("100")

    def __str__(self):
        return f"{self.school} {self.budget_year} month {self.month}"


class SemesterRealization(models.Model):
    """
    Semester-level financial realization, per DATABASE-SCHEMA.md section 15.

    One row per (school, budget_year, semester) -- semester 1 and semester
    2 are separate rows, not combined columns on a single row. See
    apps/realizations/services.py for the total/percentage/remaining-budget
    calculations that combine both rows with the latest RKAS amount.
    """

    class Semester(models.IntegerChoices):
        FIRST = 1, "Semester 1"
        SECOND = 2, "Semester 2"

    school = models.ForeignKey(
        School, on_delete=models.PROTECT, related_name="semester_realizations"
    )
    budget_year = models.ForeignKey(
        BudgetYear, on_delete=models.PROTECT, related_name="semester_realizations"
    )
    semester = models.PositiveSmallIntegerField(choices=Semester.choices)
    realization_amount = models.DecimalField(max_digits=18, decimal_places=2)
    evaluation_note = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="+"
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="+"
    )

    class Meta:
        db_table = "semester_realizations"
        constraints = [
            models.UniqueConstraint(
                fields=["school", "budget_year", "semester"],
                name="semester_realization_unique_period",
            ),
            models.CheckConstraint(
                condition=models.Q(semester__in=[1, 2]),
                name="semester_realization_semester_in_1_2",
            ),
            models.CheckConstraint(
                condition=models.Q(realization_amount__gte=0),
                name="semester_realization_amount_non_negative",
            ),
        ]

    def __str__(self):
        return f"{self.school} {self.budget_year} semester {self.semester}"
