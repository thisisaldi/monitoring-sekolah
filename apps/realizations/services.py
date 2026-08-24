"""
Calculation layer for realizations, per docs/design/SDD.md section 25/101.

The single authoritative implementation of the semester formulas from
BRD.md section 11.4:

    % Semester 1 = semester_1_realization / RKAS Terakhir * 100
    Total Realisasi = semester_1_realization + semester_2_realization
    % Akhir = Total Realisasi / RKAS Terakhir * 100
    Sisa Anggaran = RKAS Terakhir - Total Realisasi

SemesterRealization is stored as one row per semester (see models.py
docstring), so these values are computed here by combining both rows with
the latest RKAS amount -- never stored as editable fields.
"""
from decimal import Decimal

from .models import SemesterRealization


def get_semester_summary(school, budget_year):
    """
    Returns a dict with semester_1, semester_2, total_realization,
    percentage_semester_1, percentage_final, remaining_budget, and
    latest_rkas for the given school/budget_year.

    Any value that cannot be computed (missing data, zero/missing RKAS)
    is None rather than raising or fabricating a number.
    """
    from apps.rkas.models import RKAS

    records = {
        r.semester: r.realization_amount
        for r in SemesterRealization.objects.filter(school=school, budget_year=budget_year)
    }
    semester_1 = records.get(1)
    semester_2 = records.get(2)

    total_realization = None
    if semester_1 is not None or semester_2 is not None:
        total_realization = (semester_1 or Decimal("0")) + (semester_2 or Decimal("0"))

    rkas = RKAS.objects.filter(school=school, budget_year=budget_year).first()
    latest_rkas = rkas.current_amount if rkas is not None else None

    percentage_semester_1 = None
    if semester_1 is not None and latest_rkas not in (None, 0):
        percentage_semester_1 = (semester_1 / latest_rkas) * Decimal("100")

    percentage_final = None
    if total_realization is not None and latest_rkas not in (None, 0):
        percentage_final = (total_realization / latest_rkas) * Decimal("100")

    remaining_budget = None
    if latest_rkas is not None and total_realization is not None:
        remaining_budget = latest_rkas - total_realization

    return {
        "semester_1": semester_1,
        "semester_2": semester_2,
        "total_realization": total_realization,
        "latest_rkas": latest_rkas,
        "percentage_semester_1": percentage_semester_1,
        "percentage_final": percentage_final,
        "remaining_budget": remaining_budget,
    }
