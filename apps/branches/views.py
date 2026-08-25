from django.contrib import messages
from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from apps.accounts.authorization import require_system_admin

from .forms import BranchForm
from .models import Branch

# Branch is an internal organizational/security entity, not Master Data --
# management is is_staff-only (system administration), never business-role
# (CENTRAL/BRANCH) based. See apps/accounts/authorization.py::is_system_admin.


@require_system_admin
def branch_list(request):
    branches = Branch.objects.all().order_by("name")
    paginator = Paginator(branches, 25)
    page_obj = paginator.get_page(request.GET.get("page"))
    return render(request, "branches/list.html", {"page_obj": page_obj})


@require_system_admin
def branch_create(request):
    if request.method == "POST":
        form = BranchForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Data berhasil disimpan.")
            return redirect("branches:list")
    else:
        form = BranchForm()
    return render(request, "branches/form.html", {"form": form, "title": "Tambah Branch"})


@require_system_admin
def branch_edit(request, pk):
    branch = get_object_or_404(Branch, pk=pk)
    if request.method == "POST":
        form = BranchForm(request.POST, instance=branch)
        if form.is_valid():
            form.save()
            messages.success(request, "Perubahan berhasil disimpan.")
            return redirect("branches:list")
    else:
        form = BranchForm(instance=branch)
    return render(request, "branches/form.html", {"form": form, "title": "Ubah Branch"})


@require_system_admin
@require_POST
def branch_activate(request, pk):
    branch = get_object_or_404(Branch, pk=pk)
    branch.is_active = True
    branch.save()
    messages.success(request, "Branch berhasil diaktifkan.")
    return redirect("branches:list")


@require_system_admin
@require_POST
def branch_deactivate(request, pk):
    branch = get_object_or_404(Branch, pk=pk)
    branch.is_active = False
    branch.save()
    messages.success(request, "Data berhasil dinonaktifkan.")
    return redirect("branches:list")
