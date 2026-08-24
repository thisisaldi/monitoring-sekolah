from django.contrib import admin

from .models import BudgetYear


@admin.register(BudgetYear)
class BudgetYearAdmin(admin.ModelAdmin):
    list_display = ["name", "start_date", "end_date", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["name"]
