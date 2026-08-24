from django.urls import path

from . import views

app_name = "realizations"

urlpatterns = [
    path("monthly/", views.monthly_list, name="monthly_list"),
    path("monthly/create/", views.monthly_create, name="monthly_create"),
    path("monthly/<int:pk>/edit/", views.monthly_edit, name="monthly_edit"),
    path("semester/", views.semester_list, name="semester_list"),
    path("semester/create/", views.semester_create, name="semester_create"),
    path("semester/<int:pk>/edit/", views.semester_edit, name="semester_edit"),
    path(
        "semester/summary/<int:school_id>/<int:budget_year_id>/",
        views.semester_summary,
        name="semester_summary",
    ),
]
