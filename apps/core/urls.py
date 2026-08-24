from django.urls import path

from . import views

app_name = "core"

urlpatterns = [
    path("", views.home, name="home"),
    path("health/", views.health_check, name="health_check"),
    path("htmx-demo/", views.htmx_demo, name="htmx_demo"),
    path("ui-preview/", views.ui_preview, name="ui_preview"),
]
