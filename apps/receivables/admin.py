from django.contrib import admin

from .models import Receivable


@admin.register(Receivable)
class ReceivableAdmin(admin.ModelAdmin):
    list_display = ["school", "budget_year", "opening_balance", "addition_amount", "settlement_amount"]
    list_filter = ["budget_year"]
    search_fields = ["school__code", "school__name"]
