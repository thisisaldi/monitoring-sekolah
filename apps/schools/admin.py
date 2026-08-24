from django.contrib import admin

from .models import School


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "branch", "is_active"]
    list_filter = ["is_active", "branch"]
    search_fields = ["code", "name"]
