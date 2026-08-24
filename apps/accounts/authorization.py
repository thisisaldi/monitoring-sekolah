"""
Reusable RBAC / branch-authorization helpers.

This is the single source of truth for role and branch-scope checks.
Views -- and later, business-domain modules -- must use these instead of
inlining `user.role == ...` checks throughout the codebase.
"""
from functools import wraps

from django.contrib.auth.decorators import login_required as require_login  # noqa: F401
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied

from .models import Role


def is_central(user):
    return user.is_authenticated and user.role == Role.CENTRAL


def is_branch(user):
    return user.is_authenticated and user.role == Role.BRANCH


def can_access_branch(user, branch):
    """
    CENTRAL may read any branch's scoped resources.
    BRANCH may access only their own branch.
    """
    if not user.is_authenticated:
        return False
    if is_central(user):
        return True
    return is_branch(user) and user.branch_id == branch.id


def can_modify_branch_data(user, branch):
    """
    CENTRAL is read-only for operational data -- never allowed to modify.
    BRANCH may modify only data belonging to their own branch.
    """
    if not user.is_authenticated:
        return False
    return is_branch(user) and user.branch_id == branch.id


def get_user_school(user):
    """
    Returns the single School operated by a BRANCH user's Branch (per the
    Branch<->School 1:1 cardinality), or None if the user is not a BRANCH
    user or their Branch has no School assigned yet.

    This is the server-derived source of truth for "the user's school" --
    financial-module create views must use this instead of accepting a
    client-submitted school_id, per the Branch:School 1:1 correction.
    """
    if not is_branch(user):
        return None
    try:
        return user.branch.school
    except ObjectDoesNotExist:
        return None


def require_central(view_func):
    @require_login
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not is_central(request.user):
            raise PermissionDenied("This view requires the CENTRAL role.")
        return view_func(request, *args, **kwargs)

    return wrapper


def require_branch(view_func):
    @require_login
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not is_branch(request.user):
            raise PermissionDenied("This view requires the BRANCH role.")
        return view_func(request, *args, **kwargs)

    return wrapper
