"""
Dashboard aggregation queries, per docs/design/SDD.md sections 38-43.

No dashboard database table exists -- every value here is derived from the
operational tables via database aggregation (COUNT/annotate) or a small,
bounded number of scoped queries assembled in Python, never by looping a
query per record. See docs/design/DATABASE-SCHEMA.md section 28
("Dashboard Data: No dashboard table is required.").

Risk status (Hijau/Kuning/Oranye/Merah) is intentionally NOT computed here.
No risk field or scoring formula exists anywhere in BRD/OBD/SDD/
DATABASE-SCHEMA/DATA-MAPPING (OBD-DM-005 is explicitly Open) -- the
dashboard template shows a "not defined" note instead of fabricating one.
"""
from django.db.models import Count, F

# "Laporan Bulanan Belum Lengkap" (incomplete monthly reports) is a
# confirmed dashboard indicator per BRD.md/SDD.md, but its precise
# completeness DEFINITION is explicitly unresolved: DATA-MAPPING.md
# OBD-DM-006 lists several candidate bases (record existence, required
# fields populated, validation, or a combination) without confirming any
# of them, and states the system must not invent one. This metric is
# therefore intentionally always None until OBD-DM-006 is decided. Do not
# resurrect a specific rule (e.g. "12 records", "report_status=COMPLETE")
# here without an authoritative DECIDED requirement to point to.


def get_dashboard_metrics(branch, budget_year):
    """
    branch: a Branch instance to scope to, or None for organization-wide
    (CENTRAL) metrics.
    budget_year: a BudgetYear instance, or None if none exists yet -- in
    that case, budget-year-dependent metrics are returned as None rather
    than computed against an arbitrary year.
    """
    from apps.branches.models import Branch
    from apps.findings.models import Finding, FindingStatus
    from apps.reconciliation.models import Reconciliation
    from apps.schools.models import School

    school_qs = School.objects.all()
    if branch is not None:
        school_qs = school_qs.filter(branch=branch)

    total_schools = school_qs.count()
    total_branches = Branch.objects.count() if branch is None else 1

    # OBD-DM-006: TBD -- never computed, see module docstring above.
    monthly_incomplete_count = None

    reconciliation_problem_count = None
    if budget_year is not None:
        reconciliation_problem_count = (
            Reconciliation.objects.filter(school__in=school_qs, budget_year=budget_year)
            .exclude(bank_balance=F("financial_statement_balance"))
            .count()
        )

    open_findings_count = (
        Finding.objects.filter(school__in=school_qs)
        .exclude(status=FindingStatus.COMPLETED)
        .count()
    )

    return {
        "total_schools": total_schools,
        "total_branches": total_branches,
        "monthly_incomplete_count": monthly_incomplete_count,
        "reconciliation_problem_count": reconciliation_problem_count,
        "open_findings_count": open_findings_count,
    }


def get_school_monitoring_rows(schools, budget_year):
    """
    Assembles prepared, already-calculated per-school monitoring data for
    a small page of schools (the caller is expected to paginate first --
    this function does not itself limit the row count).

    Reuses RKAS.current_amount and Reconciliation.status/.difference --
    the single authoritative implementations of those formulas -- and
    never reimplements them here or in a template.

    Bounded query count regardless of how many schools are passed in (at
    most 4 queries total: RKAS, RKAS revisions prefetch, Reconciliation,
    Finding counts), so this stays N+1-safe as long as the caller paginates
    `schools` to a reasonable page size.
    """
    from apps.findings.models import Finding, FindingStatus
    from apps.reconciliation.models import Reconciliation
    from apps.rkas.models import RKAS

    schools = list(schools)
    school_ids = [school.id for school in schools]

    rkas_by_school = {}
    reconciliation_by_school = {}
    if budget_year is not None and school_ids:
        for rkas in RKAS.objects.filter(
            school_id__in=school_ids, budget_year=budget_year
        ).prefetch_related("revisions"):
            rkas_by_school[rkas.school_id] = rkas

        for reconciliation in Reconciliation.objects.filter(
            school_id__in=school_ids, budget_year=budget_year
        ):
            reconciliation_by_school[reconciliation.school_id] = reconciliation

    open_findings_by_school = {}
    if school_ids:
        counts = (
            Finding.objects.filter(school_id__in=school_ids)
            .exclude(status=FindingStatus.COMPLETED)
            .values("school_id")
            .annotate(count=Count("id"))
        )
        open_findings_by_school = {row["school_id"]: row["count"] for row in counts}

    rows = []
    for school in schools:
        rows.append(
            {
                "school": school,
                "rkas": rkas_by_school.get(school.id),
                "reconciliation": reconciliation_by_school.get(school.id),
                "open_findings_count": open_findings_by_school.get(school.id, 0),
            }
        )
    return rows
