from django.urls import path

from . import views

app_name = "accounts"

urlpatterns = [
    path("login/", views.AccountLoginView.as_view(), name="login"),
    path("logout/", views.AccountLogoutView.as_view(), name="logout"),
    path("landing/", views.landing, name="landing"),
    path("authz-check/protected/", views.authz_check_protected, name="authz_check_protected"),
    path("authz-check/central-only/", views.authz_check_central_only, name="authz_check_central_only"),
    path("authz-check/branch/<int:branch_id>/", views.authz_check_branch, name="authz_check_branch"),
    path("authz-check/branch-post/", views.authz_check_branch_post, name="authz_check_branch_post"),
    path(
        "authz-check/branch-modify/<int:branch_id>/",
        views.authz_check_branch_modify,
        name="authz_check_branch_modify",
    ),
]
