# Open Business Decisions

This document records business decisions that are required to finalize the system design.

Items marked as `DECIDED` are approved assumptions for the MVP.

Items marked as `PENDING` must not be implemented by the AI coding agent without explicit business confirmation.

---

## OBD-001 — Master Data Management

**Status:** DECIDED

Master data will be managed centrally.

The Central/Admin role is responsible for:

- Creating branches
- Creating schools
- Editing school master data
- Assigning schools to branches
- Deactivating schools

Branch users cannot create or delete schools.

Branch users may view schools assigned to their branch and enter/update operational financial data.

---

## OBD-002 — BOS Reporting Period

**Status:** DECIDED

BOS data is reported annually based on the budget year.

Relationship:

    School
        +
    Budget Year
        ↓
    BOS Record

A school can have one BOS record per budget year.

The MVP does not implement monthly or semester-based BOS records.

---

## OBD-003 — Receivable Reporting Period

**Status:** DECIDED

Receivable data is reported annually based on the budget year.

Relationship:

    School
        +
    Budget Year
        ↓
    Receivable Record

A school can have one receivable record per budget year.

The MVP does not implement monthly or semester-based receivable records.

---

## OBD-004 — Reconciliation Reporting Period

**Status:** DECIDED

Reconciliation data is reported annually based on the budget year.

Relationship:

    School
        +
    Budget Year
        ↓
    Reconciliation Record

A school can have one reconciliation record per budget year.

The MVP does not implement monthly or semester-based reconciliation records.

---

## OBD-005 — Formula Persentase Tunggakan

**Status:** PENDING

The formula for calculating the percentage of overdue receivables has not been confirmed by the business.

The system must not invent a formula.

The following data will still be stored:

- Opening Receivable
- Additional Receivable
- Settlement
- Ending Receivable
- Dominant Receivable Age
- Follow-up

The percentage of overdue receivables will remain unavailable until the business formula is confirmed.

The database design must allow the formula to be implemented later without requiring a major restructuring of the data model.

---

## OBD-006 — Reconciliation Status

**Status:** DECIDED

For the MVP, reconciliation status is determined by the difference between the bank balance and financial statement balance.

Rule:

    difference = 0
        → SESUAI

    difference != 0
        → TIDAK SESUAI

No tolerance threshold is implemented in the MVP.

A tolerance threshold may be introduced in a future version if required by the business.

---

## OBD-007 — Finding Status

**Status:** DECIDED

Finding status values are:

- `OPEN`
- `ON_PROGRESS`
- `COMPLETED`

Expected workflow:

    OPEN
      ↓
    ON_PROGRESS
      ↓
    COMPLETED

When status is `COMPLETED`:

- `completed_date` is required.

When status is `OPEN` or `ON_PROGRESS`:

- `completed_date` should remain empty.

---

# Decision Summary

| ID | Decision | Status |
|---|---|---|
| OBD-001 | Master data managed by Central/Admin | DECIDED |
| OBD-002 | BOS is annual per budget year | DECIDED |
| OBD-003 | Receivable is annual per budget year | DECIDED |
| OBD-004 | Reconciliation is annual per budget year | DECIDED |
| OBD-005 | Overdue percentage formula | PENDING |
| OBD-006 | Reconciliation status rule | DECIDED |
| OBD-007 | Finding status values | DECIDED |

---

# AI Implementation Rule

The AI coding agent must follow the decisions marked `DECIDED`.

For decisions marked `PENDING`, the AI must not invent or assume a business rule.

If implementation depends directly on a pending decision, the AI must:

1. Identify the dependency.
2. Explain what is blocked.
3. Continue with unrelated implementation where possible.
4. Request clarification before implementing the unresolved business rule.