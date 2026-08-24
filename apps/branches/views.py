from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from apps.accounts.authorization import is_central, require_central

from .forms import BranchForm
from .models import Branch


@login_required
def branch_list(request):
    if is_central(request.user):
        branches = Branch.objects.all().order_by("name")
    else:
        # BRANCH users are scoped to their own branch only.
        branches = Branch.objects.filter(id=request.user.branch_id).order_by("name")
    paginator = Paginator(branches, 25)
    page_obj = paginator.get_page(request.GET.get("page"))
    return render(
        request,
        "branches/list.html",
        {"page_obj": page_obj, "is_central": is_central(request.user)},
    )


@require_central
def branch_create(request):
    if request.method == "POST":
        form = BranchForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Data berhasil disimpan.")
            return redirect("branches:list")
    else:
        form = BranchForm()
    return render(request, "branches/form.html", {"form": form, "title": "Create Branch"})


@require_central
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
    return render(request, "branches/form.html", {"form": form, "title": "Edit Branch"})


@require_central
@require_POST
def branch_deactivate(request, pk):
    branch = get_object_or_404(Branch, pk=pk)
    branch.is_active = False
    branch.save()
    messages.success(request, "Data berhasil dinonaktifkan.")
    return redirect("branches:list")
