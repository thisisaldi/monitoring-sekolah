from django import forms

from apps.core.templatetags.monitoring_extras import MONTH_NAMES_ID, SCHOOL_YEAR_MONTH_ORDER

from .models import MonthlyRealization, SemesterRealization

# Presentation-only: the `month` field itself stores a calendar-month
# integer (1-12), unchanged. This only controls what the create form's
# dropdown shows and in what order -- the school-year reporting sequence
# (July -> June), per BRD.md section 11.3.
MONTH_CHOICES = [(month, MONTH_NAMES_ID[month]) for month in SCHOOL_YEAR_MONTH_ORDER]


class MonthlyRealizationCreateForm(forms.ModelForm):
    """
    `school` is not a form field: Branch<->School is 1:1, so the school is
    server-derived from the authenticated user's branch (see
    apps.accounts.authorization.get_user_school).
    """

    month = forms.TypedChoiceField(choices=MONTH_CHOICES, coerce=int, label="Bulan")

    class Meta:
        model = MonthlyRealization
        fields = [
            "budget_year",
            "month",
            "budget_amount",
            "realization_amount",
            "variance_explanation",
            "report_status",
        ]


class MonthlyRealizationEditForm(forms.ModelForm):
    """school/budget_year/month define the record's identity and are not editable."""

    class Meta:
        model = MonthlyRealization
        fields = ["budget_amount", "realization_amount", "variance_explanation", "report_status"]


class SemesterRealizationCreateForm(forms.ModelForm):
    """`school` is not a form field -- see MonthlyRealizationCreateForm docstring."""

    class Meta:
        model = SemesterRealization
        fields = ["budget_year", "semester", "realization_amount", "evaluation_note"]


class SemesterRealizationEditForm(forms.ModelForm):
    class Meta:
        model = SemesterRealization
        fields = ["realization_amount", "evaluation_note"]
