from django import forms
from django.db.models import Q

from apps.branches.models import Branch

from .models import School

FIELDS = [
    "branch",
    "code",
    "name",
    "education_level",
    "principal_name",
    "treasurer_name",
    "student_count",
    "note",
]


class SchoolCreateForm(forms.ModelForm):
    """
    Branch<->School is 1:1. Only branches without an existing School are
    offered here -- picking an already-assigned branch would otherwise
    fail with a raw database IntegrityError instead of a clean form error.
    """

    class Meta:
        model = School
        fields = FIELDS

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["branch"].queryset = Branch.objects.filter(school__isnull=True)


class SchoolEditForm(forms.ModelForm):
    """
    Same 1:1 restriction as SchoolCreateForm, but also allows keeping the
    School's currently-assigned branch (which would otherwise appear
    "already taken" by itself).
    """

    class Meta:
        model = School
        fields = FIELDS

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        current_branch_id = self.instance.branch_id
        self.fields["branch"].queryset = Branch.objects.filter(
            Q(school__isnull=True) | Q(pk=current_branch_id)
        )
