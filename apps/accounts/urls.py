from django.urls import path

from . import views

app_name = "accounts"

urlpatterns = [
    path("login/", views.AccountLoginView.as_view(), name="login"),
    path("logout/", views.AccountLogoutView.as_view(), name="logout"),
    path("landing/", views.landing, name="landing"),
    path("users/", views.user_list, name="user_list"),
    path("users/create/", views.user_create, name="user_create"),
    path("users/<int:pk>/edit/", views.user_edit, name="user_edit"),
    path("users/<int:pk>/activate/", views.user_activate, name="user_activate"),
    path("users/<int:pk>/deactivate/", views.user_deactivate, name="user_deactivate"),
    path("users/<int:pk>/password/", views.user_password_reset, name="user_password_reset"),
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
