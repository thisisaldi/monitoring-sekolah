from django.urls import path

from . import views

app_name = "budget_years"

urlpatterns = [
    path("", views.budget_year_list, name="list"),
    path("create/", views.budget_year_create, name="create"),
    path("<int:pk>/edit/", views.budget_year_edit, name="edit"),
    path("<int:pk>/deactivate/", views.budget_year_deactivate, name="deactivate"),
]
