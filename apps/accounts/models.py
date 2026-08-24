from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.core.exceptions import ValidationError
from django.db import models

from apps.branches.models import Branch


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, username, name, password, **extra_fields):
        if not username:
            raise ValueError("Username is required")
        if not name:
            raise ValueError("Name is required")
        role = extra_fields.get("role")
        if role not in self.model.Role.values:
            raise ValueError(
                "Role is required and must be explicitly 'CENTRAL' or 'BRANCH'"
            )
        user = self.model(username=username, name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, username, name, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(username, name, password, **extra_fields)

    def create_superuser(self, username, name, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True")

        return self._create_user(username, name, password, **extra_fields)


class Role(models.TextChoices):
    CENTRAL = "CENTRAL", "Central"
    BRANCH = "BRANCH", "Branch"


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom application user, per docs/design/DATABASE-SCHEMA.md section 8.

    Cross-field rule (BRANCH requires a branch, CENTRAL must not have one)
    is enforced in `clean()`, called from `save()`. This is deliberately an
    application/model-layer check, not a database CHECK constraint or
    trigger -- see Phase 2C task scope.
    """

    # Kept as User.Role for backward-compatible access (User.Role.BRANCH,
    # etc). Defined at module scope, not nested, so `Meta.constraints`
    # below can reference `Role` directly: a nested class does not share
    # its enclosing class's namespace in Python, only the module's globals.
    Role = Role

    name = models.CharField(max_length=150)
    username = models.CharField(max_length=150, unique=True)
    role = models.CharField(max_length=20, choices=Role.choices)
    branch = models.ForeignKey(
        Branch,
        on_delete=models.PROTECT,
        related_name="users",
        null=True,
        blank=True,
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["name", "role"]

    class Meta:
        db_table = "users"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(role__in=Role.values),
                name="user_role_valid",
            ),
        ]

    def clean(self):
        super().clean()
        if self.role == Role.BRANCH and self.branch_id is None:
            raise ValidationError(
                {"branch": "A BRANCH user must have a branch assigned."}
            )
        if self.role == Role.CENTRAL and self.branch_id is not None:
            raise ValidationError(
                {"branch": "A CENTRAL user must not have a branch assigned."}
            )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username
