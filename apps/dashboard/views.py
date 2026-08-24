from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404, render

from apps.accounts.authorization import is_central
from apps.branches.models import Branch
from apps.budget_years.models import BudgetYear
from apps.schools.models import School

from .services import get_dashboard_metrics, get_school_monitoring_rows


@login_required
def dashboard(request):
    budget_year_id = request.GET.get("budget_year")
    if budget_year_id:
        budget_year = get_object_or_404(BudgetYear, pk=budget_year_id)
    else:
        budget_year = (
            BudgetYear.objects.filter(is_active=True).order_by("-start_date").first()
        )
    budget_years = BudgetYear.objects.all().order_by("-start_date")

    user_is_central = is_central(request.user)
    # BRANCH users are always locked to their own branch. A `?branch=`
    # query parameter is only ever read for CENTRAL users -- it is never
    # allowed to override a BRANCH user's scope.
    scope_branch = None if user_is_central else request.user.branch

    metrics = get_dashboard_metrics(branch=scope_branch, budget_year=budget_year)

    # --- School-level monitoring: filters + paginated rows -----------------
    school_qs = School.objects.select_related("branch").order_by("branch__name", "name")

    branches = None
    selected_branch = scope_branch
    if user_is_central:
        branches = Branch.objects.all().order_by("name")
        branch_id = request.GET.get("branch")
        if branch_id:
            selected_branch = get_object_or_404(Branch, pk=branch_id)
    if selected_branch is not None:
        school_qs = school_qs.filter(branch=selected_branch)

    # The school filter dropdown only ever offers schools already within
    # the user's authorized scope (own branch, or the selected branch for
    # CENTRAL). A manipulated `?school=` id for an out-of-scope school
    # simply matches nothing in `school_qs` below -- no leak, no need for
    # a separate denial branch.
    filter_schools = school_qs

    school_id = request.GET.get("school")
    selected_school = None
    if school_id:
        school_qs = school_qs.filter(pk=school_id)
        selected_school = school_qs.first()

    paginator = Paginator(school_qs, 25)
    page_obj = paginator.get_page(request.GET.get("page"))
    monitoring_rows = get_school_monitoring_rows(page_obj.object_list, budget_year)

    return render(
        request,
        "dashboard/index.html",
        {
            "metrics": metrics,
            "budget_year": budget_year,
            "budget_years": budget_years,
            "is_central": user_is_central,
            "branches": branches,
            "selected_branch": selected_branch,
            "filter_schools": filter_schools,
            "selected_school": selected_school,
            "page_obj": page_obj,
            "monitoring_rows": monitoring_rows,
        },
    )
