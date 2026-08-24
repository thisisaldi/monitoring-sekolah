from django.contrib import admin

from .models import Reconciliation


@admin.register(Reconciliation)
class ReconciliationAdmin(admin.ModelAdmin):
    list_display = ["school", "budget_year", "financial_statement_balance", "bank_balance"]
    list_filter = ["budget_year"]
    search_fields = ["school__code", "school__name"]
