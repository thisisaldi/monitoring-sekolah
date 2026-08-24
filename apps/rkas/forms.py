from django import forms

from .models import RKAS, RKASRevision


class RKASCreateForm(forms.ModelForm):
    """
    `school` is deliberately not a form field: Branch<->School is 1:1, so
    the school is server-derived from the authenticated user's branch
    (see apps.accounts.authorization.get_user_school) rather than
    accepted as client-submitted input.
    """

    class Meta:
        model = RKAS
        fields = ["budget_year", "initial_amount", "initial_approval_date", "major_change_description"]
        widgets = {
            "initial_approval_date": forms.DateInput(attrs={"type": "date"}),
        }


class RKASEditForm(forms.ModelForm):
    """School and budget_year define the record's identity and are not editable."""

    class Meta:
        model = RKAS
        fields = ["initial_amount", "initial_approval_date", "major_change_description"]
        widgets = {
            "initial_approval_date": forms.DateInput(attrs={"type": "date"}),
        }


class RKASRevisionForm(forms.ModelForm):
    """revision_number is assigned by the view, not the user."""

    class Meta:
        model = RKASRevision
        fields = ["amount", "revision_date", "change_description"]
        widgets = {
            "revision_date": forms.DateInput(attrs={"type": "date"}),
        }
