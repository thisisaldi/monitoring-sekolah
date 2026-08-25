from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView, LogoutView
from django.core.exceptions import PermissionDenied
from django.core.paginator import Paginator
from django.db import models
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from apps.branches.models import Branch

from .authorization import (
    can_access_branch,
    can_modify_branch_data,
    require_central,
    require_system_admin,
)
from .forms import ROLE_OPTIONS, UserCreateForm, UserEditForm, UserPasswordResetForm
from .models import User


class AccountLoginView(LoginView):
    template_name = "accounts/login.html"
    redirect_authenticated_user = True


class AccountLogoutView(LogoutView):
    next_page = "accounts:login"


@login_required
def landing(request):
    return render(request, "accounts/landing.html")


# ---------------------------------------------------------------------------
# System administration: User Management.
#
# Authorization is is_staff-based (require_system_admin), NOT role-based --
# role=CENTRAL never implies admin access. This is an internal
# administrative workflow: no public registration exists anywhere.
# ---------------------------------------------------------------------------

@require_system_admin
def user_list(request):
    users = User.objects.select_related("branch").order_by("username")

    search = request.GET.get("q", "").strip()
    if search:
        users = users.filter(models.Q(name__icontains=search) | models.Q(username__icontains=search))

    role = request.GET.get("role")
    if role in (User.Role.CENTRAL, User.Role.BRANCH):
        users = users.filter(role=role)

    status = request.GET.get("status")
    if status == "active":
        users = users.filter(is_active=True)
    elif status == "inactive":
        users = users.filter(is_active=False)

    branch_id = request.GET.get("branch")
    if branch_id:
        users = users.filter(branch_id=branch_id)

    paginator = Paginator(users, 25)
    page_obj = paginator.get_page(request.GET.get("page"))
    return render(
        request,
        "accounts/user_list.html",
        {
            "page_obj": page_obj,
            "branches": Branch.objects.filter(is_active=True).order_by("name"),
            "role_filter_options": ROLE_OPTIONS,
            "status_filter_options": [
                {"value": "active", "label": "Aktif"},
                {"value": "inactive", "label": "Tidak Aktif"},
            ],
            "search": search,
            "selected_role": role,
            "selected_status": status,
            "selected_branch_id": branch_id,
        },
    )


@require_system_admin
def user_create(request):
    if request.method == "POST":
        form = UserCreateForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Pengguna berhasil dibuat.")
            return redirect("accounts:user_list")
    else:
        form = UserCreateForm()
    return render(
        request,
        "accounts/user_form.html",
        {
            "form": form,
            "title": "Tambah Pengguna",
            "role_options": ROLE_OPTIONS,
            "branches": Branch.objects.all().order_by("name"),
            "show_password_fields": True,
        },
    )


@require_system_admin
def user_edit(request, pk):
    user_obj = get_object_or_404(User, pk=pk)
    if request.method == "POST":
        form = UserEditForm(request.POST, instance=user_obj)
        if form.is_valid():
            if user_obj.pk == request.user.pk and not form.cleaned_data["is_active"]:
                form.add_error("is_active", "Anda tidak dapat menonaktifkan akun Anda sendiri.")
            else:
                form.save()
                messages.success(request, "Perubahan berhasil disimpan.")
                return redirect("accounts:user_list")
    else:
        form = UserEditForm(instance=user_obj)
    return render(
        request,
        "accounts/user_form.html",
        {
            "form": form,
            "title": "Ubah Pengguna",
            "role_options": ROLE_OPTIONS,
            "branches": Branch.objects.all().order_by("name"),
            "show_password_fields": False,
            "is_self": user_obj.pk == request.user.pk,
        },
    )


@require_system_admin
@require_POST
def user_activate(request, pk):
    user_obj = get_object_or_404(User, pk=pk)
    user_obj.is_active = True
    user_obj.save()
    messages.success(request, "Pengguna berhasil diaktifkan.")
    return redirect("accounts:user_list")


@require_system_admin
@require_POST
def user_deactivate(request, pk):
    user_obj = get_object_or_404(User, pk=pk)
    if user_obj.pk == request.user.pk:
        raise PermissionDenied("Anda tidak dapat menonaktifkan akun Anda sendiri.")
    user_obj.is_active = False
    user_obj.save()
    messages.success(request, "Pengguna berhasil dinonaktifkan.")
    return redirect("accounts:user_list")


@require_system_admin
def user_password_reset(request, pk):
    user_obj = get_object_or_404(User, pk=pk)
    if request.method == "POST":
        form = UserPasswordResetForm(request.POST, user=user_obj)
        if form.is_valid():
            form.save()
            messages.success(request, "Password pengguna berhasil diubah.")
            return redirect("accounts:user_list")
    else:
        form = UserPasswordResetForm(user=user_obj)
    return render(
        request,
        "accounts/user_password_form.html",
        {"form": form, "target_user": user_obj},
    )


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
