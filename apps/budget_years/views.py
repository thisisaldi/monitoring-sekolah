from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from apps.accounts.authorization import is_central, require_central

from .forms import BudgetYearForm
from .models import BudgetYear


@login_required
def budget_year_list(request):
    # Global master data -- both CENTRAL and BRANCH see the full list.
    budget_years = BudgetYear.objects.all().order_by("-start_date")
    paginator = Paginator(budget_years, 25)
    page_obj = paginator.get_page(request.GET.get("page"))
    return render(
        request,
        "budget_years/list.html",
        {"page_obj": page_obj, "is_central": is_central(request.user)},
    )


@require_central
def budget_year_create(request):
    if request.method == "POST":
        form = BudgetYearForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Data berhasil disimpan.")
            return redirect("budget_years:list")
    else:
        form = BudgetYearForm()
    return render(
        request, "budget_years/form.html", {"form": form, "title": "Create Budget Year"}
    )


@require_central
def budget_year_edit(request, pk):
    budget_year = get_object_or_404(BudgetYear, pk=pk)
    if request.method == "POST":
        form = BudgetYearForm(request.POST, instance=budget_year)
        if form.is_valid():
            form.save()
            messages.success(request, "Perubahan berhasil disimpan.")
            return redirect("budget_years:list")
    else:
        form = BudgetYearForm(instance=budget_year)
    return render(
        request, "budget_years/form.html", {"form": form, "title": "Edit Budget Year"}
    )


@require_central
@require_POST
def budget_year_deactivate(request, pk):
    budget_year = get_object_or_404(BudgetYear, pk=pk)
    budget_year.is_active = False
    budget_year.save()
    messages.success(request, "Data berhasil dinonaktifkan.")
    return redirect("budget_years:list")
