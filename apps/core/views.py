from django.conf import settings
from django.http import Http404, JsonResponse
from django.shortcuts import redirect, render
from django.utils.safestring import mark_safe

# Developer-authored inline icons for the component preview page only --
# never user data, never rendered anywhere else in the app (see section 10
# of UI-DESIGN-SPEC.md: this application otherwise uses no icon library).
_ICON_MENU = mark_safe(
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">'
    '<path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
)
_ICON_CLOSE = mark_safe(
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">'
    '<path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
)
_ICON_DOTS = mark_safe(
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">'
    '<circle cx="8" cy="3" r="1.3" fill="currentColor"/><circle cx="8" cy="8" r="1.3" fill="currentColor"/>'
    '<circle cx="8" cy="13" r="1.3" fill="currentColor"/></svg>'
)


def home(request):
    """
    Application root. Not a landing/marketing page -- routes straight to
    the authenticated entry point (dashboard) or to login, per the
    post-deployment root-routing correction.
    """
    if request.user.is_authenticated:
        return redirect("dashboard:index")
    return redirect("accounts:login")


def ui_preview(request):
    """
    Development-only component showcase (DEBUG only -- 404s otherwise).
    Renders static/example values only; never touches real business data,
    the database, or authorization. Not linked from any real navigation.
    """
    if not settings.DEBUG:
        raise Http404
    context = {
        "icon_menu": _ICON_MENU,
        "icon_close": _ICON_CLOSE,
        "icon_dots": _ICON_DOTS,
        "preview_budget_years": [
            {"value": "1", "label": "TA 2025/2026"},
            {"value": "2", "label": "TA 2026/2027"},
            {"value": "3", "label": "TA 2027/2028"},
        ],
        "preview_branches": [
            {"value": "1", "label": "Cabang Bandung"},
            {"value": "2", "label": "Cabang Surabaya"},
        ],
    }
    return render(request, "core/ui_preview.html", context)


def health_check(request):
    return JsonResponse({"status": "ok"})


def htmx_demo(request):
    """Infrastructure test endpoint: returns a partial template for HTMX."""
    return render(request, "core/partials/htmx_demo_result.html")
