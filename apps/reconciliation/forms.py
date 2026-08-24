from django import forms

from .models import Reconciliation


class ReconciliationCreateForm(forms.ModelForm):
    """`school` is not a form field -- see realizations.forms.MonthlyRealizationCreateForm docstring."""

    class Meta:
        model = Reconciliation
        fields = [
            "budget_year",
            "financial_statement_balance",
            "bank_balance",
            "rkas_compliance",
            "notes",
            "follow_up",
        ]


class ReconciliationEditForm(forms.ModelForm):
    class Meta:
        model = Reconciliation
        fields = ["financial_statement_balance", "bank_balance", "rkas_compliance", "notes", "follow_up"]
