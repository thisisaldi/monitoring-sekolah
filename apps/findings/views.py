from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404, redirect, render

from apps.accounts.authorization import (
    can_modify_branch_data,
    get_user_school,
    is_branch,
    is_central,
    require_branch,
)

from .forms import FindingCreateForm, FindingEditForm
from .models import Finding


@login_required
def finding_list(request):
    if is_central(request.user):
        queryset = Finding.objects.select_related("school").all()
    else:
        queryset = Finding.objects.select_related("school").filter(
            school__branch_id=request.user.branch_id
        )
    queryset = queryset.order_by("-finding_date")
    paginator = Paginator(queryset, 25)
    page_obj = paginator.get_page(request.GET.get("page"))
    return render(
        request,
        "findings/list.html",
        {"page_obj": page_obj, "is_branch": is_branch(request.user)},
    )


@require_branch
def finding_create(request):
    school = get_user_school(request.user)
    if school is None:
        messages.error(request, "Branch Anda belum memiliki Sekolah yang terdaftar.")
        return redirect("findings:list")
    if request.method == "POST":
        form = FindingCreateForm(request.POST, instance=Finding(school=school))
        if form.is_valid():
            finding = form.save(commit=False)
            finding.created_by = request.user
            finding.updated_by = request.user
            finding.save()
            messages.success(request, "Data berhasil disimpan.")
            return redirect("findings:list")
    else:
        form = FindingCreateForm()
    return render(
        request, "findings/form.html", {"form": form, "title": "Create Finding", "school": school}
    )


@require_branch
def finding_edit(request, pk):
    finding = get_object_or_404(Finding.objects.select_related("school"), pk=pk)
    if not can_modify_branch_data(request.user, finding.school.branch):
        raise PermissionDenied("Cannot edit another branch's finding.")
    if request.method == "POST":
        form = FindingEditForm(request.POST, instance=finding)
        if form.is_valid():
            updated = form.save(commit=False)
            updated.updated_by = request.user
            updated.save()
            messages.success(request, "Perubahan berhasil disimpan.")
            return redirect("findings:list")
    else:
        form = FindingEditForm(instance=finding)
    return render(request, "findings/form.html", {"form": form, "title": "Edit Finding"})
