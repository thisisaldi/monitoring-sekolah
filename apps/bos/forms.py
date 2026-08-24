from django import forms

from .models import BOSRecord


class BOSRecordCreateForm(forms.ModelForm):
    """`school` is not a form field -- see realizations.forms.MonthlyRealizationCreateForm docstring."""

    class Meta:
        model = BOSRecord
        fields = [
            "budget_year",
            "opening_balance",
            "receipt_amount",
            "usage_amount",
            "rkas_compliance",
            "report_status",
            "notes",
        ]


class BOSRecordEditForm(forms.ModelForm):
    class Meta:
        model = BOSRecord
        fields = [
            "opening_balance",
            "receipt_amount",
            "usage_amount",
            "rkas_compliance",
            "report_status",
            "notes",
        ]
