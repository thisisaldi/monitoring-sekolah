# Entity Relationship Diagram

## 1. Purpose

This document defines the core data entities and relationships for the School Financial Monitoring System.

The database design is based on:

- `docs/requirements/BRD.md`
- `docs/requirements/open-business-decisions.md`

The Excel template in `docs/reference/` is treated as reference material for the legacy workflow and is not the final database model.

---

# 2. Core Data Model

The core organizational relationship is:

    Branch
       |
       | 1:N
       v
    School
       |
       +---- RKAS
       |       |
       |       +---- RKAS Revision
       |
       +---- Monthly Realization
       |
       +---- Semester Realization
       |
       +---- BOS Record
       |
       +---- Receivable
       |
       +---- Reconciliation
       |
       +---- Finding

Users belong to a branch when their role is `BRANCH`.

Central users do not belong to a specific branch.

---

# 3. Entity Relationship Diagram

    USER
      |
      | N:1
      v
    BRANCH
      |
      | 1:N
      v
    SCHOOL
      |
      +-------------------+--------------------+--------------------+
      |                   |                    |                    |
      v                   v                    v                    v
    RKAS          MONTHLY_REALIZATION   SEMESTER_REALIZATION    BOS_RECORD
      |
      | 1:N
      v
    RKAS_REVISION

    SCHOOL
      |
      +--------------------+--------------------+--------------------+
      |                    |                    |
      v                    v                    v
    RECEIVABLE       RECONCILIATION          FINDING

    BUDGET_YEAR
      |
      +---- RKAS
      +---- MONTHLY_REALIZATION
      +---- SEMESTER_REALIZATION
      +---- BOS_RECORD
      +---- RECEIVABLE
      +---- RECONCILIATION


---

# 4. Entity List

The MVP database contains the following core entities:

1. `users`
2. `branches`
3. `schools`
4. `budget_years`
5. `rkas`
6. `rkas_revisions`
7. `monthly_realizations`
8. `semester_realizations`
9. `bos_records`
10. `receivables`
11. `reconciliations`
12. `findings`

---

# 5. Entity: users

Purpose:

Stores authenticated application users.

Fields:

- `id`
- `branch_id`
- `name`
- `username`
- `password_hash`
- `role`
- `is_active`
- `created_at`
- `updated_at`

Role values:

- `BRANCH`
- `CENTRAL`

Relationship:

- One branch can have many branch users.
- A central user has no branch restriction.
- A branch user must belong to exactly one branch.

Rules:

- `branch_id` is required when `role = BRANCH`.
- `branch_id` must be NULL when `role = CENTRAL`.
- Password must never be stored in plaintext.
- User authentication must use a secure password hashing mechanism.

---

# 6. Entity: branches

Purpose:

Stores the master data for regional branches/perwakilan.

Fields:

- `id`
- `code`
- `name`
- `is_active`
- `created_at`
- `updated_at`

Example:

    id: 1
    code: BDG
    name: Bandung
    is_active: true

Constraints:

- `code` must be unique.
- `name` should be unique unless business requirements allow duplicate names.
- Inactive branches must not be available for new operational assignments.

Relationship:

    Branch 1:N User
    Branch 1:1 School

---

# 7. Entity: schools

Purpose:

Stores master data for schools.

Fields:

- `id`
- `branch_id`
- `code`
- `name`
- `education_level`
- `principal_name`
- `treasurer_name`
- `student_count`
- `note`
- `is_active`
- `created_at`
- `updated_at`

Relationship:

    Branch 1:1 School

A school belongs to exactly one branch, and a branch operates exactly one school.

All operational financial records must reference `school_id`.

Constraints:

- `code` must be unique.
- `branch_id` is required and unique (enforced at the database level: one branch may have at most one school).
- `school_id` is the primary identifier for operational relationships.
- School name must not be used as a foreign key.

Branch users cannot create or delete schools through the normal operational workflow.

---

# 8. Entity: budget_years

Purpose:

Represents the financial/budget year.

Example:

    TA 2026/2027

Fields:

- `id`
- `name`
- `start_date`
- `end_date`
- `is_active`
- `created_at`
- `updated_at`

Example:

    id: 1
    name: TA 2026/2027
    start_date: 2026-07-01
    end_date: 2027-06-30

Constraints:

- `name` must be unique.
- `start_date` must be earlier than `end_date`.

All period-based financial data must reference `budget_year_id`.

---

# 9. Entity: rkas

Purpose:

Stores the main RKAS record for a school and budget year.

Fields:

- `id`
- `school_id`
- `budget_year_id`
- `initial_amount`
- `initial_approval_date`
- `major_change_description`
- `created_at`
- `created_by`
- `updated_at`
- `updated_by`

Relationship:

    School 1:N RKAS
    BudgetYear 1:N RKAS
    RKAS 1:N RKAS Revision

Uniqueness:

    school_id + budget_year_id

A school can have only one primary RKAS record for a budget year.

The RKAS record contains the initial budget.

Subsequent changes are stored in `rkas_revisions`.

---

# 10. Entity: rkas_revisions

Purpose:

Stores changes/revisions to an RKAS.

Fields:

- `id`
- `rkas_id`
- `revision_number`
- `amount`
- `revision_date`
- `change_description`
- `created_at`
- `created_by`

Relationship:

    RKAS 1:N RKAS Revision

Uniqueness:

    rkas_id + revision_number

The system must not assume that there can only be two revisions.

Example:

    RKAS
      |
      +-- Initial
      +-- Revision 1
      +-- Revision 2
      +-- Revision 3
      +-- Revision N

The latest revision determines the current RKAS amount.

---

# 11. Entity: monthly_realizations

Purpose:

Stores monthly financial realization for each school.

Fields:

- `id`
- `school_id`
- `budget_year_id`
- `month`
- `budget_amount`
- `realization_amount`
- `variance_explanation`
- `report_status`
- `created_at`
- `created_by`
- `updated_at`
- `updated_by`

Calculated values:

- `variance`
- `realization_percentage`

Relationship:

    School 1:N Monthly Realization
    BudgetYear 1:N Monthly Realization

Uniqueness:

    school_id + budget_year_id + month

Therefore a school can only have one monthly realization record for a particular month within a budget year.

Example:

    School A
    TA 2026/2027
    July

can exist only once.

If the value is wrong, the branch updates the existing record.

The branch does not delete and recreate it.

Month values:

    1  = January
    2  = February
    3  = March
    4  = April
    5  = May
    6  = June
    7  = July
    8  = August
    9  = September
    10 = October
    11 = November
    12 = December

For the school budget year, the expected reporting sequence is:

    July
    August
    September
    October
    November
    December
    January
    February
    March
    April
    May
    June

---

# 12. Entity: semester_realizations

Purpose:

Stores financial realization by semester.

Fields:

- `id`
- `school_id`
- `budget_year_id`
- `semester`
- `realization_amount`
- `evaluation_note`
- `created_at`
- `created_by`
- `updated_at`
- `updated_by`

Semester values:

- `1`
- `2`

Relationship:

    School 1:N Semester Realization
    BudgetYear 1:N Semester Realization

Uniqueness:

    school_id + budget_year_id + semester

Each school can have at most:

    Semester 1
    Semester 2

for each budget year.

---

# 13. Entity: bos_records

Purpose:

Stores BOS financial monitoring data.

Fields:

- `id`
- `school_id`
- `budget_year_id`
- `opening_balance`
- `receipt_amount`
- `usage_amount`
- `rkas_compliance`
- `report_status`
- `notes`
- `created_at`
- `created_by`
- `updated_at`
- `updated_by`

Calculated value:

- `ending_balance`

Relationship:

    School 1:N BOS Record
    BudgetYear 1:N BOS Record

MVP uniqueness:

    school_id + budget_year_id

Important:

This is a temporary MVP assumption because the current Excel template does not explicitly define a BOS reporting period.

If the business confirms that BOS is monthly or semester-based, this entity must be redesigned before implementation.

---

# 14. Entity: receivables

Purpose:

Stores school receivable monitoring data.

Fields:

- `id`
- `school_id`
- `budget_year_id`
- `opening_balance`
- `addition_amount`
- `settlement_amount`
- `dominant_age`
- `follow_up`
- `created_at`
- `created_by`
- `updated_at`
- `updated_by`

Calculated values:

- `ending_balance`
- `overdue_percentage`

Relationship:

    School 1:N Receivable
    BudgetYear 1:N Receivable

MVP uniqueness:

    school_id + budget_year_id

Important:

The reporting period and exact formula for overdue percentage are still open business decisions.

---

# 15. Entity: reconciliations

Purpose:

Stores reconciliation between financial statement balance and bank balance.

Fields:

- `id`
- `school_id`
- `budget_year_id`
- `financial_statement_balance`
- `bank_balance`
- `rkas_compliance`
- `notes`
- `follow_up`
- `created_at`
- `created_by`
- `updated_at`
- `updated_by`

Calculated value:

- `difference`

Relationship:

    School 1:N Reconciliation
    BudgetYear 1:N Reconciliation

MVP uniqueness:

    school_id + budget_year_id

Important:

The exact reporting period and reconciliation status rule are still open business decisions.

---

# 16. Entity: findings

Purpose:

Stores monitoring findings and follow-up information.

Fields:

- `id`
- `school_id`
- `finding_date`
- `source`
- `finding`
- `amount`
- `risk`
- `recommendation`
- `pic`
- `deadline`
- `status`
- `completed_date`
- `created_at`
- `created_by`
- `updated_at`
- `updated_by`

Relationship:

    School 1:N Finding

A school can have multiple findings.

Example:

    School A
       |
       +-- Finding 1
       +-- Finding 2
       +-- Finding 3

Suggested status values:

- `OPEN`
- `ON_PROGRESS`
- `COMPLETED`

These values remain subject to business confirmation.

---

# 17. Entity Relationship Summary

    BRANCH
       |
       +-----------------------+
       |                       |
       v                       v
     USER                    SCHOOL
                               |
              +----------------+----------------+
              |                |                |
              v                v                v
            RKAS           MONTHLY           SEMESTER
              |            REALIZATION        REALIZATION
              |
              v
        RKAS_REVISION

    SCHOOL
       |
       +----------------+
       |                |
       v                v
      BOS          RECEIVABLE

    SCHOOL
       |
       +----------------+
       |                |
       v                v
 RECONCILIATION       FINDING

    BUDGET_YEAR
       |
       +---- RKAS
       +---- MONTHLY_REALIZATION
       +---- SEMESTER_REALIZATION
       +---- BOS_RECORD
       +---- RECEIVABLE
       +---- RECONCILIATION

---

# 18. Calculated Fields

Calculated fields must not be treated as normal user input.

## RKAS Current Amount

The current RKAS amount is determined from the latest revision.

Conceptually:

    if no revision exists:
        current_rkas = initial_amount

    if revisions exist:
        current_rkas = amount of latest revision

The user must not manually enter the current RKAS amount.

---

## Monthly Realization Variance

    variance =
        budget_amount - realization_amount

---

## Monthly Realization Percentage

    realization_percentage =
        realization_amount / budget_amount * 100

If `budget_amount` is zero or null:

    realization_percentage = NULL

The system must never perform division by zero.

---

## Semester Total Realization

    total_realization =
        semester_1_realization
        + semester_2_realization

---

## Semester Final Percentage

    final_percentage =
        total_realization / current_rkas * 100

If `current_rkas` is zero or unavailable:

    final_percentage = NULL

---

## Remaining Budget

    remaining_budget =
        current_rkas - total_realization

---

## BOS Ending Balance

    ending_balance =
        opening_balance
        + receipt_amount
        - usage_amount

---

## Receivable Ending Balance

    ending_balance =
        opening_balance
        + addition_amount
        - settlement_amount

---

## Reconciliation Difference

    difference =
        bank_balance
        - financial_statement_balance

---

# 19. Calculated Field Storage Policy

For MVP, calculated fields should preferably be calculated dynamically rather than duplicated as independent user-editable values.

The following must not be directly editable:

- current RKAS amount
- variance
- realization percentage
- total realization
- final percentage
- remaining budget
- BOS ending balance
- receivable ending balance
- reconciliation difference

If performance later requires persisted calculated values, the implementation must ensure that they cannot become inconsistent with their source values.

---

# 20. Audit Metadata

All operational entities should include:

- `created_at`
- `created_by`
- `updated_at`
- `updated_by`

This allows the system to show:

    Created:
    12 August 2026 09:32
    by Branch Bandung

    Last Updated:
    15 August 2026 14:21
    by Branch Bandung

Full field-level audit history is not required for MVP.

---

# 21. Data Ownership

The organizational ownership chain is:

    Central
       |
       +-- Branch A
       |      |
       |      +-- School A1
       |      +-- School A2
       |
       +-- Branch B
              |
              +-- School B1
              +-- School B2

A branch user may access only:

    User.branch_id
          |
          v
    School.branch_id
          |
          v
    Operational Record.school_id

A central user may view all branches and schools.

---

# 22. Branch Data Isolation

Branch-level authorization must be enforced by the backend.

Example:

    User:
        Branch A

    Requested:
        School B

    Result:

        403 Forbidden

The frontend must never be considered the primary security boundary.

A malicious user must not be able to access another branch's data by modifying:

- URL parameters
- query parameters
- request body
- school IDs
- branch IDs

The backend must verify ownership for every protected operation.

---

# 23. Central Access

Central users are read-only for operational data.

Allowed:

    READ

Not allowed:

    CREATE
    UPDATE
    DELETE

Central users may:

- view all branches;
- view all schools;
- view all financial modules;
- view all findings;
- view dashboard aggregations;
- filter monitoring data.

---

# 24. Branch Access

Branch users may:

    READ
    CREATE
    UPDATE

Branch users may not:

    DELETE

Branch users may only access schools assigned to their branch.

---

# 25. Deletion Rules

Operational data cannot be deleted through the normal application workflow.

The following cannot be deleted by normal users:

- RKAS
- RKAS Revision
- Monthly Realization
- Semester Realization
- BOS Record
- Receivable
- Reconciliation
- Finding

Correction workflow:

    Existing Record
          |
          v
        EDIT
          |
          v
        SAVE
          |
          v
    Updated Record

Not:

    DELETE
       |
       v
    CREATE NEW RECORD

Controlled database-level deletion may exist for technical maintenance, but it is outside the normal application workflow.

---

# 26. Master Data Deactivation

Master entities should support an active/inactive state.

Entities:

- Branch
- School
- User
- Budget Year

Example:

    is_active = true

or:

    is_active = false

Deactivation should preserve historical operational records.

A school that becomes inactive must not cause its historical financial data to disappear.

---

# 27. Referential Integrity

Foreign keys must enforce relationships.

Examples:

    users.branch_id
        -> branches.id

    schools.branch_id
        -> branches.id

    rkas.school_id
        -> schools.id

    rkas.budget_year_id
        -> budget_years.id

    rkas_revisions.rkas_id
        -> rkas.id

    monthly_realizations.school_id
        -> schools.id

    monthly_realizations.budget_year_id
        -> budget_years.id

    semester_realizations.school_id
        -> schools.id

    semester_realizations.budget_year_id
        -> budget_years.id

    bos_records.school_id
        -> schools.id

    bos_records.budget_year_id
        -> budget_years.id

    receivables.school_id
        -> schools.id

    receivables.budget_year_id
        -> budget_years.id

    reconciliations.school_id
        -> schools.id

    reconciliations.budget_year_id
        -> budget_years.id

    findings.school_id
        -> schools.id

Invalid references must be rejected by the database.

---

# 28. Unique Constraints

The minimum required unique constraints are:

    branches.code

    schools.code

    budget_years.name

    rkas:
        school_id + budget_year_id

    rkas_revisions:
        rkas_id + revision_number

    monthly_realizations:
        school_id + budget_year_id + month

    semester_realizations:
        school_id + budget_year_id + semester

    bos_records:
        school_id + budget_year_id

    receivables:
        school_id + budget_year_id

    reconciliations:
        school_id + budget_year_id

---

# 29. Indexing Requirements

Recommended indexes:

    branches:
        code

    users:
        branch_id
        role

    schools:
        branch_id
        code

    rkas:
        school_id
        budget_year_id

    rkas_revisions:
        rkas_id

    monthly_realizations:
        school_id
        budget_year_id
        month

    semester_realizations:
        school_id
        budget_year_id
        semester

    bos_records:
        school_id
        budget_year_id

    receivables:
        school_id
        budget_year_id

    reconciliations:
        school_id
        budget_year_id

    findings:
        school_id
        status
        deadline

Composite indexes should be added where they directly support common filtering or uniqueness requirements.

---

# 30. Dashboard Data Model

There is no separate `dashboard` entity in the database.

The dashboard is a presentation of aggregated operational data.

Architecture:

    Operational Tables
            |
            v
    Aggregation Queries
            |
            v
       Dashboard API
            |
            v
       Dashboard UI

Examples of dashboard values:

    Total Schools
    Total Branches
    Monthly Reports Completed
    Monthly Reports Incomplete
    Reconciliation Issues
    Open Findings
    Recently Updated Schools

These values must be derived from operational data.

Do not manually maintain dashboard counters.

---

# 31. Legacy Excel Mapping

The existing workbook contains these conceptual areas:

    Dashboard
    Master Sekolah
    RKAS
    Realisasi Bulanan
    Realisasi Semester
    BOS
    Piutang
    Rekonsiliasi
    Temuan & Tindak Lanjut

The application maps them conceptually as:

    Master Sekolah
        -> branches
        -> schools

    RKAS
        -> rkas
        -> rkas_revisions

    Realisasi Bulanan
        -> monthly_realizations

    Realisasi Semester
        -> semester_realizations

    BOS
        -> bos_records

    Piutang
        -> receivables

    Rekonsiliasi
        -> reconciliations

    Temuan & Tindak Lanjut
        -> findings

    Dashboard
        -> dashboard aggregation queries

The application must NOT reproduce the Excel workbook as separate database sheets.

---

# 32. Important MVP Assumptions

The following are temporary assumptions:

1. BOS is one record per school per budget year.
2. Receivable is one record per school per budget year.
3. Reconciliation is one record per school per budget year.
4. Findings are stored as independent records directly associated with a school.
5. RKAS revisions are unlimited.
6. Monthly realization uses July-June as the budget-year reporting sequence.
7. Central is read-only.
8. Branch can create and update operational data.
9. Operational data cannot be deleted.
10. Full field-level audit history is not required for MVP.

These assumptions must be reviewed if the business requirements change.

---

# 33. Open Business Decisions

The following items remain unresolved.

## OBD-001 — Master Data Management

Determine who can:

- create branches;
- create schools;
- update school master data;
- deactivate schools;
- assign schools to branches.

---

## OBD-002 — BOS Period

Determine whether BOS data is:

- annual;
- semester;
- monthly;
- or another period.

---

## OBD-003 — Receivable Period

Determine whether Receivable data is:

- annual;
- semester;
- monthly;
- or another period.

---

## OBD-004 — Reconciliation Period

Determine whether Reconciliation data is:

- annual;
- semester;
- monthly;
- or another period.

---

## OBD-005 — Overdue Percentage

Determine the exact business formula for overdue percentage.

---

## OBD-006 — Reconciliation Status

Determine whether:

    difference = 0
        -> SESUAI

    difference != 0
        -> TIDAK_SESUAI

or whether a tolerance threshold is required.

---

## OBD-007 — Finding Status

Proposed:

    OPEN
    ON_PROGRESS
    COMPLETED

Final values require business confirmation.

---

# 34. Design Principles

The database must model business entities and relationships rather than reproduce the spreadsheet structure.

The Excel workbook is a representation of the legacy process.

The application database is the authoritative operational data store.

The implementation must prioritize:

- data integrity;
- relational consistency;
- authorization;
- maintainability;
- extensibility;
- calculation correctness;
- audit metadata;
- duplicate prevention.

The design hierarchy is:

    Business Requirement
            |
            v
       Domain Model
            |
            v
       Database Model
            |
            v
           API
            |
            v
        Frontend

The database must not be designed simply by converting every Excel sheet into a table.

---

# 35. Next Design Step

After this ERD is approved, the next design document must define the concrete database schema.

The database schema must specify:

- database engine;
- table names;
- column names;
- data types;
- nullable/non-nullable rules;
- primary keys;
- foreign keys;
- unique constraints;
- indexes;
- enum values;
- default values;
- check constraints;
- calculated-field strategy;
- migration strategy.

The database schema must remain consistent with this ERD and the BRD.