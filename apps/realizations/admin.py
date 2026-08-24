from django.contrib import admin

from .models import MonthlyRealization, SemesterRealization


@admin.register(MonthlyRealization)
class MonthlyRealizationAdmin(admin.ModelAdmin):
    list_display = ["school", "budget_year", "month", "budget_amount", "realization_amount", "report_status"]
    list_filter = ["budget_year", "month", "report_status"]
    search_fields = ["school__code", "school__name"]


@admin.register(SemesterRealization)
class SemesterRealizationAdmin(admin.ModelAdmin):
    list_display = ["school", "budget_year", "semester", "realization_amount"]
    list_filter = ["budget_year", "semester"]
    search_fields = ["school__code", "school__name"]
