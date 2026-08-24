from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("apps.accounts.urls")),
    path("branches/", include("apps.branches.urls")),
    path("schools/", include("apps.schools.urls")),
    path("budget-years/", include("apps.budget_years.urls")),
    path("rkas/", include("apps.rkas.urls")),
    path("realizations/", include("apps.realizations.urls")),
    path("bos/", include("apps.bos.urls")),
    path("receivables/", include("apps.receivables.urls")),
    path("reconciliation/", include("apps.reconciliation.urls")),
    path("findings/", include("apps.findings.urls")),
    path("dashboard/", include("apps.dashboard.urls")),
    path("", include("apps.core.urls")),
]
