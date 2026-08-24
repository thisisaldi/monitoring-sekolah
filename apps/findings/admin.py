from django.contrib import admin

from .models import Finding


@admin.register(Finding)
class FindingAdmin(admin.ModelAdmin):
    list_display = ["school", "finding_date", "status", "deadline", "pic"]
    list_filter = ["status"]
    search_fields = ["school__code", "school__name", "finding"]
