from django import forms
from django.core.exceptions import ValidationError

from .models import BudgetYear


class BudgetYearForm(forms.ModelForm):
    class Meta:
        model = BudgetYear
        fields = ["name", "start_date", "end_date"]
        widgets = {
            "start_date": forms.DateInput(attrs={"type": "date"}),
            "end_date": forms.DateInput(attrs={"type": "date"}),
        }

    def clean(self):
        cleaned_data = super().clean()
        start_date = cleaned_data.get("start_date")
        end_date = cleaned_data.get("end_date")
        if start_date and end_date and start_date >= end_date:
            raise ValidationError("Start date must be before end date.")
        return cleaned_data
