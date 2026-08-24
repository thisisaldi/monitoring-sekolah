from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.core.paginator import Paginator
from django.db import IntegrityError, transaction
from django.db.models import Case, When
from django.shortcuts import get_object_or_404, redirect, render

from apps.accounts.authorization import (
    can_access_branch,
    can_modify_branch_data,
    get_user_school,
    is_branch,
    is_central,
    require_branch,
)
from apps.core.templatetags.monitoring_extras import SCHOOL_YEAR_MONTH_ORDER
from apps.schools.models import School

from .forms import (
    MonthlyRealizationCreateForm,
    MonthlyRealizationEditForm,
    SemesterRealizationCreateForm,
    SemesterRealizationEditForm,
)
from .models import MonthlyRealization, SemesterRealization
from .services import get_semester_summary


# ---------------------------------------------------------------------------
# Monthly Realization
# ---------------------------------------------------------------------------

@login_required
def monthly_list(request):
    if is_central(request.user):
        queryset = MonthlyRealization.objects.select_related("school", "budget_year").all()
    else:
        queryset = MonthlyRealization.objects.select_related("school", "budget_year").filter(
            school__branch_id=request.user.branch_id
        )
    # Display order follows the school-year reporting sequence (July -> June,
    # per BRD.md section 11.3), not the raw calendar month number. The
    # stored `month` value itself is never changed.
    school_year_position = Case(
        *[When(month=m, then=i) for i, m in enumerate(SCHOOL_YEAR_MONTH_ORDER)]
    )
    queryset = queryset.annotate(school_year_position=school_year_position).order_by(
        "-budget_year__start_date", "school__name", "school_year_position"
    )
    paginator = Paginator(queryset, 25)
    page_obj = paginator.get_page(request.GET.get("page"))
    return render(
        request,
        "realizations/monthly_list.html",
        {"page_obj": page_obj, "is_branch": is_branch(request.user)},
    )


@require_branch
def monthly_create(request):
    school = get_user_school(request.user)
    if school is None:
        messages.error(request, "Branch Anda belum memiliki Sekolah yang terdaftar.")
        return redirect("realizations:monthly_list")
    if request.method == "POST":
        form = MonthlyRealizationCreateForm(
            request.POST, instance=MonthlyRealization(school=school)
        )
        if form.is_valid():
            record = form.save(commit=False)
            record.created_by = request.user
            record.updated_by = request.user
            try:
                with transaction.atomic():
                    record.save()
            except IntegrityError:
                form.add_error(None, "Data bulan ini untuk sekolah dan tahun anggaran ini sudah ada.")
            else:
                messages.success(request, "Data berhasil disimpan.")
                return redirect("realizations:monthly_list")
    else:
        form = MonthlyRealizationCreateForm()
    return render(
        request,
        "realizations/monthly_form.html",
        {"form": form, "title": "Create Monthly Realization", "school": school},
    )


@require_branch
def monthly_edit(request, pk):
    record = get_object_or_404(MonthlyRealization.objects.select_related("school"), pk=pk)
    if not can_modify_branch_data(request.user, record.school.branch):
        raise PermissionDenied("Cannot edit another branch's record.")
    if request.method == "POST":
        form = MonthlyRealizationEditForm(request.POST, instance=record)
        if form.is_valid():
            updated = form.save(commit=False)
            updated.updated_by = request.user
            updated.save()
            messages.success(request, "Perubahan berhasil disimpan.")
            return redirect("realizations:monthly_list")
    else:
        form = MonthlyRealizationEditForm(instance=record)
    return render(
        request,
        "realizations/monthly_form.html",
        {"form": form, "title": "Edit Monthly Realization"},
    )


# ---------------------------------------------------------------------------
# Semester Realization
# ---------------------------------------------------------------------------

@login_required
def semester_list(request):
    if is_central(request.user):
        queryset = SemesterRealization.objects.select_related("school", "budget_year").all()
    else:
        queryset = SemesterRealization.objects.select_related("school", "budget_year").filter(
            school__branch_id=request.user.branch_id
        )
    queryset = queryset.order_by("-budget_year__start_date", "school__name", "semester")
    paginator = Paginator(queryset, 25)
    page_obj = paginator.get_page(request.GET.get("page"))
    return render(
        request,
        "realizations/semester_list.html",
        {"page_obj": page_obj, "is_branch": is_branch(request.user)},
    )


@require_branch
def semester_create(request):
    school = get_user_school(request.user)
    if school is None:
        messages.error(request, "Branch Anda belum memiliki Sekolah yang terdaftar.")
        return redirect("realizations:semester_list")
    if request.method == "POST":
        form = SemesterRealizationCreateForm(
            request.POST, instance=SemesterRealization(school=school)
        )
        if form.is_valid():
            record = form.save(commit=False)
            record.created_by = request.user
            record.updated_by = request.user
            try:
                with transaction.atomic():
                    record.save()
            except IntegrityError:
                form.add_error(None, "Data semester ini untuk sekolah dan tahun anggaran ini sudah ada.")
            else:
                messages.success(request, "Data berhasil disimpan.")
                return redirect("realizations:semester_list")
    else:
        form = SemesterRealizationCreateForm()
    return render(
        request,
        "realizations/semester_form.html",
        {"form": form, "title": "Create Semester Realization", "school": school},
    )


@require_branch
def semester_edit(request, pk):
    record = get_object_or_404(SemesterRealization.objects.select_related("school"), pk=pk)
    if not can_modify_branch_data(request.user, record.school.branch):
        raise PermissionDenied("Cannot edit another branch's record.")
    if request.method == "POST":
        form = SemesterRealizationEditForm(request.POST, instance=record)
        if form.is_valid():
            updated = form.save(commit=False)
            updated.updated_by = request.user
            updated.save()
            messages.success(request, "Perubahan berhasil disimpan.")
            return redirect("realizations:semester_list")
    else:
        form = SemesterRealizationEditForm(instance=record)
    return render(
        request,
        "realizations/semester_form.html",
        {"form": form, "title": "Edit Semester Realization"},
    )


@login_required
def semester_summary(request, school_id, budget_year_id):
    school = get_object_or_404(School, pk=school_id)
    if not can_access_branch(request.user, school.branch):
        raise PermissionDenied("Cannot access this school's summary.")
    summary = get_semester_summary(school_id, budget_year_id)
    return render(
        request,
        "realizations/semester_summary.html",
        {"school": school, "summary": summary},
    )
