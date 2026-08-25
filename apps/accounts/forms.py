from django import forms
from django.contrib.auth import password_validation
from django.core.exceptions import ValidationError

from .models import User

# Indonesian labels for the Select component in user_form.html -- the
# stored/submitted value stays "CENTRAL"/"BRANCH" (matches User.Role),
# only the visible label is localized (role.choices itself is English,
# used by Django admin, and isn't changed here).
ROLE_OPTIONS = [
    {"value": "CENTRAL", "label": "Pusat"},
    {"value": "BRANCH", "label": "Cabang"},
]

# System-administration user management only. Never exposes is_staff or
# is_superuser -- those remain a system/deployment/bootstrap concern (see
# apps/accounts/authorization.py's is_system_admin docstring).
FIELDS = ["name", "username", "role", "branch", "is_active"]


class UserCreateForm(forms.ModelForm):
    """
    Admin-only user creation. `password`/`password_confirm` are plain form
    fields (not model fields) so the raw value is never assigned directly
    to `User.password` -- it's hashed via `set_password()` in `save()`.
    Role<->branch cross-field validation is enforced by `User.clean()`
    (called through the normal ModelForm full_clean path), not duplicated
    here.
    """

    password = forms.CharField(label="Password", widget=forms.PasswordInput, required=True)
    password_confirm = forms.CharField(
        label="Konfirmasi Password", widget=forms.PasswordInput, required=True
    )

    class Meta:
        model = User
        fields = FIELDS

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        password_confirm = cleaned_data.get("password_confirm")
        if password and password_confirm and password != password_confirm:
            self.add_error("password_confirm", "Password dan konfirmasi password tidak sama.")
        if password:
            try:
                password_validation.validate_password(password)
            except ValidationError as exc:
                self.add_error("password", exc)
        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password"])
        # New users are never administrators -- is_staff/is_superuser stay
        # at the model default (False) and are never settable here.
        if commit:
            user.save()
        return user


class UserEditForm(forms.ModelForm):
    """
    name/username/role/branch/is_active only -- no password field (see
    UserPasswordResetForm), no is_staff/is_superuser. Role<->branch
    cross-field validation still runs via User.clean()/full_clean().
    """

    class Meta:
        model = User
        fields = FIELDS


class UserPasswordResetForm(forms.Form):
    """A dedicated, minimal form for the admin-triggered password reset action."""

    new_password = forms.CharField(label="Password Baru", widget=forms.PasswordInput)
    new_password_confirm = forms.CharField(
        label="Konfirmasi Password Baru", widget=forms.PasswordInput
    )

    def __init__(self, *args, user=None, **kwargs):
        self.target_user = user
        super().__init__(*args, **kwargs)

    def clean(self):
        cleaned_data = super().clean()
        new_password = cleaned_data.get("new_password")
        new_password_confirm = cleaned_data.get("new_password_confirm")
        if new_password and new_password_confirm and new_password != new_password_confirm:
            self.add_error("new_password_confirm", "Password baru dan konfirmasi tidak sama.")
        if new_password:
            try:
                password_validation.validate_password(new_password, user=self.target_user)
            except ValidationError as exc:
                self.add_error("new_password", exc)
        return cleaned_data

    def save(self):
        self.target_user.set_password(self.cleaned_data["new_password"])
        self.target_user.save()
        return self.target_user
