from django.contrib import admin

from .models import BOSRecord


@admin.register(BOSRecord)
class BOSRecordAdmin(admin.ModelAdmin):
    list_display = ["school", "budget_year", "opening_balance", "receipt_amount", "usage_amount", "report_status"]
    list_filter = ["budget_year", "report_status"]
    search_fields = ["school__code", "school__name"]
