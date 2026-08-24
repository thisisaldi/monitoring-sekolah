from django import forms

from .models import Receivable


class ReceivableCreateForm(forms.ModelForm):
    """`school` is not a form field -- see realizations.forms.MonthlyRealizationCreateForm docstring."""

    class Meta:
        model = Receivable
        fields = [
            "budget_year",
            "opening_balance",
            "addition_amount",
            "settlement_amount",
            "dominant_age",
            "follow_up",
        ]


class ReceivableEditForm(forms.ModelForm):
    class Meta:
        model = Receivable
        fields = ["opening_balance", "addition_amount", "settlement_amount", "dominant_age", "follow_up"]
