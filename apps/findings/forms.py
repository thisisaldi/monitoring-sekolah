from django import forms

from .models import Finding


class FindingCreateForm(forms.ModelForm):
    """`school` is not a form field -- see realizations.forms.MonthlyRealizationCreateForm docstring."""

    class Meta:
        model = Finding
        fields = [
            "finding_date",
            "source",
            "finding",
            "amount",
            "risk",
            "recommendation",
            "pic",
            "deadline",
            "status",
            "completed_date",
        ]
        widgets = {
            "finding_date": forms.DateInput(attrs={"type": "date"}),
            "deadline": forms.DateInput(attrs={"type": "date"}),
            "completed_date": forms.DateInput(attrs={"type": "date"}),
        }


class FindingEditForm(forms.ModelForm):
    """school is fixed at creation; everything else may be corrected/updated."""

    class Meta:
        model = Finding
        fields = [
            "finding_date",
            "source",
            "finding",
            "amount",
            "risk",
            "recommendation",
            "pic",
            "deadline",
            "status",
            "completed_date",
        ]
        widgets = {
            "finding_date": forms.DateInput(attrs={"type": "date"}),
            "deadline": forms.DateInput(attrs={"type": "date"}),
            "completed_date": forms.DateInput(attrs={"type": "date"}),
        }
