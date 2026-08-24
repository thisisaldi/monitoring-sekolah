from django.urls import path

from . import views

app_name = "findings"

urlpatterns = [
    path("", views.finding_list, name="list"),
    path("create/", views.finding_create, name="create"),
    path("<int:pk>/edit/", views.finding_edit, name="edit"),
]
