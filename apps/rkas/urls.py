from django.urls import path

from . import views

app_name = "rkas"

urlpatterns = [
    path("", views.rkas_list, name="list"),
    path("create/", views.rkas_create, name="create"),
    path("<int:pk>/", views.rkas_detail, name="detail"),
    path("<int:pk>/edit/", views.rkas_edit, name="edit"),
    path("<int:pk>/revisions/add/", views.rkas_revision_create, name="revision_create"),
]
