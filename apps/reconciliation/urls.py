from django.urls import path

from . import views

app_name = "reconciliation"

urlpatterns = [
    path("", views.reconciliation_list, name="list"),
    path("create/", views.reconciliation_create, name="create"),
    path("<int:pk>/edit/", views.reconciliation_edit, name="edit"),
]
