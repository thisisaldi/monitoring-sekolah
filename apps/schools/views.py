from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from apps.accounts.authorization import is_central, require_central

from .forms import SchoolCreateForm, SchoolEditForm
from .models import School


@login_required
def school_list(request):
    if is_central(request.user):
        schools = School.objects.select_related("branch").all().order_by("name")
    else:
        # BRANCH users are scoped to schools belonging to their own branch.
        schools = School.objects.select_related("branch").filter(
            branch_id=request.user.branch_id
        ).order_by("name")
    paginator = Paginator(schools, 25)
    page_obj = paginator.get_page(request.GET.get("page"))
    return render(
        request,
        "schools/list.html",
        {"page_obj": page_obj, "is_central": is_central(request.user)},
    )


@require_central
def school_create(request):
    if request.method == "POST":
        form = SchoolCreateForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Data berhasil disimpan.")
            return redirect("schools:list")
    else:
        form = SchoolCreateForm()
    return render(request, "schools/form.html", {"form": form, "title": "Create School"})


@require_central
def school_edit(request, pk):
    school = get_object_or_404(School, pk=pk)
    if request.method == "POST":
        form = SchoolEditForm(request.POST, instance=school)
        if form.is_valid():
            form.save()
            messages.success(request, "Perubahan berhasil disimpan.")
            return redirect("schools:list")
    else:
        form = SchoolEditForm(instance=school)
    return render(request, "schools/form.html", {"form": form, "title": "Edit School"})


@require_central
@require_POST
def school_deactivate(request, pk):
    school = get_object_or_404(School, pk=pk)
    school.is_active = False
    school.save()
    messages.success(request, "Data berhasil dinonaktifkan.")
    return redirect("schools:list")
