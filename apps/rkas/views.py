from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.core.paginator import Paginator
from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from apps.accounts.authorization import (
    can_access_branch,
    can_modify_branch_data,
    get_user_school,
    is_branch,
    is_central,
    require_branch,
)

from .forms import RKASCreateForm, RKASEditForm, RKASRevisionForm
from .models import RKAS


def _get_rkas_for_user_or_403(user, pk):
    rkas = get_object_or_404(RKAS.objects.select_related("school", "budget_year"), pk=pk)
    if not can_access_branch(user, rkas.school.branch):
        raise PermissionDenied("Cannot access this school's RKAS.")
    return rkas


@login_required
def rkas_list(request):
    if is_central(request.user):
        queryset = RKAS.objects.select_related("school", "budget_year").all()
    else:
        queryset = RKAS.objects.select_related("school", "budget_year").filter(
            school__branch_id=request.user.branch_id
        )
    queryset = queryset.order_by("-budget_year__start_date", "school__name")
    paginator = Paginator(queryset, 25)
    page_obj = paginator.get_page(request.GET.get("page"))
    return render(
        request,
        "rkas/list.html",
        {"page_obj": page_obj, "is_branch": is_branch(request.user)},
    )


@login_required
def rkas_detail(request, pk):
    rkas = _get_rkas_for_user_or_403(request.user, pk)
    revisions = rkas.revisions.all()
    return render(
        request,
        "rkas/detail.html",
        {
            "rkas": rkas,
            "revisions": revisions,
            "can_modify": can_modify_branch_data(request.user, rkas.school.branch),
        },
    )


@require_branch
def rkas_create(request):
    school = get_user_school(request.user)
    if school is None:
        messages.error(request, "Branch Anda belum memiliki Sekolah yang terdaftar.")
        return redirect("rkas:list")
    if request.method == "POST":
        form = RKASCreateForm(request.POST, instance=RKAS(school=school))
        if form.is_valid():
            rkas = form.save(commit=False)
            rkas.created_by = request.user
            rkas.updated_by = request.user
            try:
                with transaction.atomic():
                    rkas.save()
            except IntegrityError:
                form.add_error(None, "RKAS untuk sekolah dan tahun anggaran ini sudah ada.")
            else:
                messages.success(request, "Data berhasil disimpan.")
                return redirect("rkas:detail", pk=rkas.pk)
    else:
        form = RKASCreateForm()
    return render(
        request, "rkas/form.html", {"form": form, "title": "Create RKAS", "school": school}
    )


@require_branch
def rkas_edit(request, pk):
    rkas = get_object_or_404(RKAS.objects.select_related("school"), pk=pk)
    if not can_modify_branch_data(request.user, rkas.school.branch):
        raise PermissionDenied("Cannot edit another branch's RKAS.")
    if request.method == "POST":
        form = RKASEditForm(request.POST, instance=rkas)
        if form.is_valid():
            updated = form.save(commit=False)
            updated.updated_by = request.user
            updated.save()
            messages.success(request, "Perubahan berhasil disimpan.")
            return redirect("rkas:detail", pk=rkas.pk)
    else:
        form = RKASEditForm(instance=rkas)
    return render(request, "rkas/form.html", {"form": form, "title": "Edit RKAS"})


@require_branch
def rkas_revision_create(request, pk):
    rkas = get_object_or_404(RKAS.objects.select_related("school"), pk=pk)
    if not can_modify_branch_data(request.user, rkas.school.branch):
        raise PermissionDenied("Cannot add a revision to another branch's RKAS.")
    if request.method == "POST":
        form = RKASRevisionForm(request.POST)
        if form.is_valid():
            revision = form.save(commit=False)
            revision.rkas = rkas
            revision.created_by = request.user
            next_number = (
                rkas.revisions.order_by("-revision_number").values_list(
                    "revision_number", flat=True
                ).first()
                or 0
            ) + 1
            revision.revision_number = next_number
            revision.save()
            messages.success(request, f"Revisi {next_number} berhasil ditambahkan.")
            return redirect("rkas:detail", pk=rkas.pk)
    else:
        form = RKASRevisionForm()
    return render(
        request,
        "rkas/revision_form.html",
        {"form": form, "rkas": rkas, "title": "Add RKAS Revision"},
    )
