from django.urls import path

from . import views

app_name = "receivables"

urlpatterns = [
    path("", views.receivable_list, name="list"),
    path("create/", views.receivable_create, name="create"),
    path("<int:pk>/edit/", views.receivable_edit, name="edit"),
]
