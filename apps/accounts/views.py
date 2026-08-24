from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView, LogoutView
from django.core.exceptions import PermissionDenied
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render

from apps.branches.models import Branch

from .authorization import can_access_branch, can_modify_branch_data, require_central


class AccountLoginView(LoginView):
    template_name = "accounts/login.html"
    redirect_authenticated_user = True


class AccountLogoutView(LogoutView):
    next_page = "accounts:login"


@login_required
def landing(request):
    return render(request, "accounts/landing.html")


# ---------------------------------------------------------------------------
# Phase 2C authorization-foundation proof views.
#
# These exist only to prove the RBAC / branch-authorization helpers behave
# correctly over real HTTP requests (redirect-to-login vs. 403 vs. success).
# They are not business functionality and are expected to be replaced once
# a real branch-scoped module (Phase 3+) exercises the same helpers.
# ---------------------------------------------------------------------------

@login_required
def authz_check_protected(request):
    return JsonResponse({"ok": True})


@require_central
def authz_check_central_only(request):
    return JsonResponse({"ok": True})


@login_required
def authz_check_branch(request, branch_id):
    branch = get_object_or_404(Branch, pk=branch_id)
    if not can_access_branch(request.user, branch):
        raise PermissionDenied("Cannot access this branch.")
    return JsonResponse({"ok": True})


@login_required
def authz_check_branch_post(request):
    branch = get_object_or_404(Branch, pk=request.POST.get("branch_id"))
    if not can_access_branch(request.user, branch):
        raise PermissionDenied("Cannot access this branch.")
    return JsonResponse({"ok": True})


@login_required
def authz_check_branch_modify(request, branch_id):
    branch = get_object_or_404(Branch, pk=branch_id)
    if not can_modify_branch_data(request.user, branch):
        raise PermissionDenied("Cannot modify this branch's data.")
    return JsonResponse({"ok": True})
