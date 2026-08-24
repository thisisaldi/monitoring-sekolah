from django.conf import settings
from django.db import models

from apps.budget_years.models import BudgetYear
from apps.schools.models import School


class RKAS(models.Model):
    """
    RKAS (Rencana Kegiatan dan Anggaran Sekolah), per
    docs/design/DATABASE-SCHEMA.md section 12.

    Stores the initial budget for a school and budget year. Changes over
    time are tracked as an append-only sequence of RKASRevision rows
    (section 13) rather than a fixed "Revisi 1" / "Revisi 2" pair, so the
    number of revisions is not artificially limited.
    """

    school = models.ForeignKey(School, on_delete=models.PROTECT, related_name="rkas_set")
    budget_year = models.ForeignKey(
        BudgetYear, on_delete=models.PROTECT, related_name="rkas_set"
    )
    initial_amount = models.DecimalField(max_digits=18, decimal_places=2)
    initial_approval_date = models.DateField(null=True, blank=True)
    major_change_description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="+"
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="+",
    )

    class Meta:
        db_table = "rkas"
        constraints = [
            models.UniqueConstraint(
                fields=["school", "budget_year"], name="rkas_unique_school_budget_year"
            ),
            models.CheckConstraint(
                condition=models.Q(initial_amount__gte=0), name="rkas_initial_amount_non_negative"
            ),
        ]

    @property
    def current_amount(self):
        """
        Current/latest RKAS amount, per DATABASE-SCHEMA.md section 24.1:
        the latest revision's amount, or initial_amount if no revision
        exists. Always derived -- never stored as an editable field.
        """
        latest_revision = self.revisions.order_by("-revision_number").first()
        if latest_revision is None:
            return self.initial_amount
        return latest_revision.amount

    def __str__(self):
        return f"RKAS {self.school} {self.budget_year}"


class RKASRevision(models.Model):
    """
    A single revision to an RKAS, per DATABASE-SCHEMA.md section 13.

    Immutable once created (no updated_at/updated_by in the schema) --
    revisions form an append-only historical log, corrected by adding a
    new revision rather than editing an existing one.
    """

    rkas = models.ForeignKey(RKAS, on_delete=models.PROTECT, related_name="revisions")
    revision_number = models.PositiveIntegerField()
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    revision_date = models.DateField()
    change_description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="+"
    )

    class Meta:
        db_table = "rkas_revisions"
        constraints = [
            models.UniqueConstraint(
                fields=["rkas", "revision_number"], name="rkas_revision_unique_number"
            ),
            models.CheckConstraint(
                condition=models.Q(revision_number__gte=1), name="rkas_revision_number_min_1"
            ),
            models.CheckConstraint(
                condition=models.Q(amount__gte=0), name="rkas_revision_amount_non_negative"
            ),
        ]
        ordering = ["revision_number"]

    def __str__(self):
        return f"{self.rkas} rev.{self.revision_number}"
