"""
Presentation-only helpers for the Financial Monitoring UI.

This module formats values for display; it never computes business values.
All calculations remain in the model/service layer (see each app's
models.py / services.py) -- these filters only render already-computed
Decimal/int values as strings.
"""
from decimal import ROUND_HALF_UP, Decimal

from django import template

register = template.Library()

# Calendar month (as stored in the database, per ERD.md section 11:
# 1=January ... 12=December) -> Indonesian display name. The database
# value is never changed; only how it is shown to the user.
MONTH_NAMES_ID = {
    1: "Januari", 2: "Februari", 3: "Maret", 4: "April",
    5: "Mei", 6: "Juni", 7: "Juli", 8: "Agustus",
    9: "September", 10: "Oktober", 11: "November", 12: "Desember",
}

# School-year reporting sequence, per BRD.md section 11.3 / SDD.md
# section 47: July -> June. Used only to order rows for display -- the
# stored month integer (calendar month) is unchanged.
SCHOOL_YEAR_MONTH_ORDER = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6]


@register.filter
def month_name_id(value):
    """1 -> 'Januari', etc. Falls back to the raw value if unrecognized."""
    try:
        return MONTH_NAMES_ID.get(int(value), value)
    except (TypeError, ValueError):
        return value


@register.filter
def rupiah(value):
    """
    Format a Decimal/int monetary value as Indonesian Rupiah for display,
    e.g. Decimal('850000000.00') -> "Rp850.000.000".

    Display-only: rounds to the nearest whole rupiah using Decimal
    (ROUND_HALF_UP, never float) for readability. The underlying
    DecimalField value and precision are untouched -- this filter never
    writes back to the database or feeds into a calculation.
    """
    if value is None or value == "":
        return "-"
    try:
        amount = Decimal(value)
    except Exception:
        return value

    negative = amount < 0
    amount = abs(amount).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    grouped = f"{int(amount):,}".replace(",", ".")
    return f"{'-' if negative else ''}Rp{grouped}"


@register.filter
def as_select_options(queryset, attrs="pk,name"):
    """
    Presentation-only shaping for the Select component: turns a queryset
    (or any iterable of objects) into a uniform [{"value": ..., "label": ...}]
    list. `attrs` is "value_attr,label_attr", default "pk,name".
    """
    value_attr, label_attr = attrs.split(",")
    return [
        {"value": getattr(obj, value_attr), "label": getattr(obj, label_attr)}
        for obj in queryset
    ]


@register.filter
def select_label(options, value):
    """Looks up the label for `value` within an as_select_options list."""
    if value in (None, ""):
        return ""
    value_str = str(value)
    for opt in options:
        if str(opt["value"]) == value_str:
            return opt["label"]
    return ""


@register.inclusion_tag("components/_status_badge.html")
def status_badge(label, tone="neutral"):
    """
    Renders a small, restrained status tag. `tone` is a purely visual hint
    (success/warning/danger/neutral) -- it never introduces or implies a
    new business status value; the `label` text is the only thing that
    should carry meaning, and it is always passed in by the caller from an
    existing model field/choice.
    """
    return {"label": label, "tone": tone}
