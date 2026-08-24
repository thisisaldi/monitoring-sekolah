from django.urls import path

from . import views

app_name = "bos"

urlpatterns = [
    path("", views.bos_list, name="list"),
    path("create/", views.bos_create, name="create"),
    path("<int:pk>/edit/", views.bos_edit, name="edit"),
]
