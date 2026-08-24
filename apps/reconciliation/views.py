from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.core.paginator import Paginator
from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404, redirect, render

from apps.accounts.authorization import (
    can_modify_branch_data,
    get_user_school,
    is_branch,
    is_central,
    require_branch,
)

from .forms import ReconciliationCreateForm, ReconciliationEditForm
from .models import Reconciliation


@login_required
def reconciliation_list(request):
    if is_central(request.user):
        queryset = Reconciliation.objects.select_related("school", "budget_year").all()
    else:
        queryset = Reconciliation.objects.select_related("school", "budget_year").filter(
            school__branch_id=request.user.branch_id
        )
    queryset = queryset.order_by("-budget_year__start_date", "school__name")
    paginator = Paginator(queryset, 25)
    page_obj = paginator.get_page(request.GET.get("page"))
    return render(
        request,
        "reconciliation/list.html",
        {"page_obj": page_obj, "is_branch": is_branch(request.user)},
    )


@require_branch
def reconciliation_create(request):
    school = get_user_school(request.user)
    if school is None:
        messages.error(request, "Branch Anda belum memiliki Sekolah yang terdaftar.")
        return redirect("reconciliation:list")
    if request.method == "POST":
        form = ReconciliationCreateForm(request.POST, instance=Reconciliation(school=school))
        if form.is_valid():
            record = form.save(commit=False)
            record.created_by = request.user
            record.updated_by = request.user
            try:
                with transaction.atomic():
                    record.save()
            except IntegrityError:
                form.add_error(None, "Data rekonsiliasi untuk sekolah dan tahun anggaran ini sudah ada.")
            else:
                messages.success(request, "Data berhasil disimpan.")
                return redirect("reconciliation:list")
    else:
        form = ReconciliationCreateForm()
    return render(
        request,
        "reconciliation/form.html",
        {"form": form, "title": "Create Reconciliation", "school": school},
    )


@require_branch
def reconciliation_edit(request, pk):
    record = get_object_or_404(Reconciliation.objects.select_related("school"), pk=pk)
    if not can_modify_branch_data(request.user, record.school.branch):
        raise PermissionDenied("Cannot edit another branch's record.")
    if request.method == "POST":
        form = ReconciliationEditForm(request.POST, instance=record)
        if form.is_valid():
            updated = form.save(commit=False)
            updated.updated_by = request.user
            updated.save()
            messages.success(request, "Perubahan berhasil disimpan.")
            return redirect("reconciliation:list")
    else:
        form = ReconciliationEditForm(instance=record)
    return render(
        request, "reconciliation/form.html", {"form": form, "title": "Edit Reconciliation"}
    )
