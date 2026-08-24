from django.contrib import admin

from .models import RKAS, RKASRevision


class RKASRevisionInline(admin.TabularInline):
    model = RKASRevision
    extra = 0
    readonly_fields = ["created_at", "created_by"]


@admin.register(RKAS)
class RKASAdmin(admin.ModelAdmin):
    list_display = ["school", "budget_year", "initial_amount"]
    list_filter = ["budget_year"]
    search_fields = ["school__code", "school__name"]
    inlines = [RKASRevisionInline]
