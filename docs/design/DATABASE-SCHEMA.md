# Database Schema

> **Stack change (2026-10):** the schema is now defined in src/db/schema.ts (Drizzle) with SQL migrations in drizzle/. Table and column names are unchanged. Mentions of Django models, related_name or querysets describe the original implementation.


# School Financial Monitoring System

Version: 0.1
Status: Draft for Development

---

# 1. Purpose

This document defines the concrete relational database schema for the School Financial Monitoring System.

This document translates:

- `docs/requirements/BRD.md`
- `docs/requirements/open-business-decisions.md`
- `docs/design/ERD.md`
- `docs/design/SDD.md`

into database-level definitions.

The database engine for the MVP is:

    PostgreSQL

The application ORM is:

    Django ORM

The database is the authoritative operational data store.

The Excel workbook is not the database schema.

---

# 2. Database Design Principles

The database must prioritize:

- referential integrity;
- data consistency;
- duplicate prevention;
- authorization support;
- audit metadata;
- financial calculation accuracy;
- maintainability;
- future extensibility.

The database must not simply reproduce the Excel workbook as tables.

---

# 3. Naming Convention

Database table names use plural snake_case.

Examples:

    users
    branches
    schools
    budget_years
    rkas
    rkas_revisions
    monthly_realizations
    semester_realizations
    bos_records
    receivables
    reconciliations
    findings

Column names use snake_case.

Examples:

    branch_id
    budget_year_id
    created_at
    updated_at

---

# 4. Primary Key Convention

All main entities use a numeric primary key.

Recommended Django configuration:

    DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

Therefore primary keys are implemented as:

    BIGINT

Example:

    id BIGINT PRIMARY KEY

IDs are internal identifiers.

Business codes such as school codes must not replace primary keys.

---

# 5. Foreign Key Convention

Foreign keys use:

    <entity>_id

Examples:

    branch_id
    school_id
    budget_year_id
    rkas_id
    created_by
    updated_by

Foreign keys must use database-level referential integrity.

---

# 6. Financial Data Types

Financial values must use fixed-precision decimal values.

Do NOT use:

    FLOAT
    REAL
    DOUBLE PRECISION

for financial amounts.

Use PostgreSQL:

    NUMERIC

Django:

    DecimalField

Recommended default:

    NUMERIC(18,2)

This supports:

    999,999,999,999,999.99

without floating-point precision problems.

The exact maximum value can be adjusted if the actual business data requires a larger range.

---

# 7. Timestamp Convention

All timestamps use timezone-aware values.

PostgreSQL:

    TIMESTAMPTZ

Django:

    DateTimeField

The application must enable:

    USE_TZ = True

All timestamps should be stored consistently in UTC at the database/application layer and converted to the user's display timezone when rendered.

---

# 8. Table: users

## Purpose

Stores application users.

The application uses Django's custom user model.

## Columns

| Column | Type | Null | Default | Constraint | Description |
|---|---|---:|---|---|---|
| id | BIGINT | NO | auto | PK | User identifier |
| branch_id | BIGINT | YES | NULL | FK | Branch associated with user |
| name | VARCHAR(150) | NO | - | | Display name |
| username | VARCHAR(150) | NO | - | UNIQUE | Login identifier |
| password | VARCHAR(128) | NO | - | | Django password hash |
| role | VARCHAR(20) | NO | - | CHECK | User role |
| is_active | BOOLEAN | NO | TRUE | | Account status |
| created_at | TIMESTAMPTZ | NO | now() | | Creation timestamp |
| updated_at | TIMESTAMPTZ | NO | now() | | Last update timestamp |

## Role values

    BRANCH
    CENTRAL

## Constraints

    username UNIQUE

Branch user:

    role = BRANCH
    branch_id IS NOT NULL

Central user:

    role = CENTRAL
    branch_id IS NULL

## Indexes

    branch_id
    role
    is_active

---

## Implementation Note

The final production schema requires:

    branch_id → branches.id

However, the Branch model is introduced in a later implementation phase.

Therefore, the initial User migration intentionally does not contain `branch_id`.

The field will be added through a subsequent migration when the Branch model is implemented.

This is an implementation sequencing decision and does not change the final ERD.

The final User model supports:

    CENTRAL
    BRANCH

The role must be explicitly assigned.

No default business role should be defined for the User model.

# 9. Table: branches

## Purpose

Stores branch/perwakilan master data.

## Columns

| Column | Type | Null | Default | Constraint | Description |
|---|---|---:|---|---|---|
| id | BIGINT | NO | auto | PK | Branch identifier |
| code | VARCHAR(50) | NO | - | UNIQUE | Branch code |
| name | VARCHAR(150) | NO | - | | Branch name |
| type | VARCHAR(20) | NO | 'CABANG' | | CABANG, PERWAKILAN, or PP (Pengurus Pusat); peers, no hierarchy |
| is_active | BOOLEAN | NO | TRUE | | Active status |
| created_at | TIMESTAMPTZ | NO | now() | | Creation timestamp |
| updated_at | TIMESTAMPTZ | NO | now() | | Last update timestamp |

## Constraints

    code UNIQUE

## Indexes

    code
    is_active

---

# 10. Table: schools

## Purpose

Stores school master data.

## Columns

| Column | Type | Null | Default | Constraint | Description |
|---|---|---:|---|---|---|
| id | BIGINT | NO | auto | PK | School identifier |
| branch_id | BIGINT | NO | - | FK | Owning branch (a branch manages many schools) |
| code | VARCHAR(50) | NO | - | UNIQUE | School code |
| name | VARCHAR(200) | NO | - | | School name |
| education_level | VARCHAR(50) | YES | NULL | | Education level |
| principal_name | VARCHAR(150) | YES | NULL | | Principal |
| treasurer_name | VARCHAR(150) | YES | NULL | | Treasurer |
| student_count | INTEGER | YES | NULL | CHECK | Number of students |
| note | TEXT | YES | NULL | | Additional notes |
| is_active | BOOLEAN | NO | TRUE | | Active status |
| created_at | TIMESTAMPTZ | NO | now() | | Creation timestamp |
| updated_at | TIMESTAMPTZ | NO | now() | | Last update timestamp |

## Constraints

    code UNIQUE

    student_count >= 0

Branch<->School is 1:N.

## Foreign Key

    branch_id → branches.id

Recommended delete behavior:

    PROTECT

A branch should not be deleted if a school still references it.

## Indexes

    branch_id (unique)
    code
    is_active

---

# 11. Table: budget_years

## Purpose

Stores financial/budget year definitions.

## Columns

| Column | Type | Null | Default | Constraint | Description |
|---|---|---:|---|---|---|
| id | BIGINT | NO | auto | PK | Budget year identifier |
| name | VARCHAR(50) | NO | - | UNIQUE | Budget year label |
| start_date | DATE | NO | - | | Start date |
| end_date | DATE | NO | - | | End date |
| is_active | BOOLEAN | NO | TRUE | | Active status |
| created_at | TIMESTAMPTZ | NO | now() | | Creation timestamp |
| updated_at | TIMESTAMPTZ | NO | now() | | Last update timestamp |

## Constraints

    name UNIQUE

    start_date < end_date

## Example

    name:
        TA 2026/2027

    start_date:
        2026-07-01

    end_date:
        2027-06-30

## Indexes

    is_active

---

# 12. Table: rkas

## Purpose

Stores the initial RKAS for a school and budget year.

## Columns

| Column | Type | Null | Default | Constraint | Description |
|---|---|---:|---|---|---|
| id | BIGINT | NO | auto | PK | RKAS identifier |
| school_id | BIGINT | NO | - | FK | School |
| budget_year_id | BIGINT | NO | - | FK | Budget year |
| initial_amount | NUMERIC(18,2) | NO | - | CHECK | Initial RKAS amount |
| initial_approval_date | DATE | YES | NULL | | Initial approval date |
| major_change_description | TEXT | YES | NULL | | Description of major changes |
| created_at | TIMESTAMPTZ | NO | now() | | Creation timestamp |
| created_by | BIGINT | NO | - | FK | Creating user |
| updated_at | TIMESTAMPTZ | NO | now() | | Last update timestamp |
| updated_by | BIGINT | NO | - | FK | Last updating user |

## Constraints

    UNIQUE(
        school_id,
        budget_year_id
    )

    initial_amount >= 0

## Foreign Keys

    school_id → schools.id

    budget_year_id → budget_years.id

    created_by → users.id

    updated_by → users.id

## Delete Behavior

For financial records:

    PROTECT

Do not cascade-delete operational financial records.

## Indexes

    school_id
    budget_year_id

---

# 13. Table: rkas_revisions

## Purpose

Stores revisions to an RKAS.

## Columns

| Column | Type | Null | Default | Constraint | Description |
|---|---|---:|---|---|---|
| id | BIGINT | NO | auto | PK | Revision identifier |
| rkas_id | BIGINT | NO | - | FK | Parent RKAS |
| revision_number | INTEGER | NO | - | CHECK | Revision sequence |
| amount | NUMERIC(18,2) | NO | - | CHECK | Revised RKAS amount |
| revision_date | DATE | NO | - | | Revision date |
| change_description | TEXT | YES | NULL | | Description of change |
| created_at | TIMESTAMPTZ | NO | now() | | Creation timestamp |
| created_by | BIGINT | NO | - | FK | Creating user |

## Constraints

    revision_number >= 1

    amount >= 0

    UNIQUE(
        rkas_id,
        revision_number
    )

## Foreign Keys

    rkas_id → rkas.id

    created_by → users.id

## Delete Behavior

    PROTECT

## Indexes

    rkas_id

    (rkas_id, revision_number)

---

# 14. Table: monthly_realizations

## Purpose

Stores monthly financial realization.

## Columns

| Column | Type | Null | Default | Constraint | Description |
|---|---|---:|---|---|---|
| id | BIGINT | NO | auto | PK | Record identifier |
| school_id | BIGINT | NO | - | FK | School |
| budget_year_id | BIGINT | NO | - | FK | Budget year |
| month | SMALLINT | NO | - | CHECK | Calendar month |
| budget_amount | NUMERIC(18,2) | NO | - | CHECK | Budget amount |
| realization_amount | NUMERIC(18,2) | NO | - | CHECK | Realization |
| variance_explanation | TEXT | YES | NULL | | Explanation |
| report_status | VARCHAR(20) | NO | - | CHECK | Report status |
| created_at | TIMESTAMPTZ | NO | now() | | Creation timestamp |
| created_by | BIGINT | NO | - | FK | Creating user |
| updated_at | TIMESTAMPTZ | NO | now() | | Last update |
| updated_by | BIGINT | NO | - | FK | Updating user |

## Constraints

    month >= 1
    month <= 12

    budget_amount >= 0

    realization_amount >= 0

    UNIQUE(
        school_id,
        budget_year_id,
        month
    )

## Report Status

Recommended:

    COMPLETE
    INCOMPLETE

This represents data completeness, not approval.

## Calculated Values

Not stored as user-editable columns:

    variance

    realization_percentage

## Formula

    variance =
        budget_amount - realization_amount

    realization_percentage =
        realization_amount / budget_amount * 100

If budget_amount = 0:

    realization_percentage = NULL

## Foreign Keys

    school_id → schools.id

    budget_year_id → budget_years.id

    created_by → users.id

    updated_by → users.id

## Indexes

    school_id

    budget_year_id

    (school_id, budget_year_id, month)

---

# 15. Table: semester_realizations

## Purpose

Stores semester-level financial realization.

## Columns

| Column | Type | Null | Default | Constraint | Description |
|---|---|---:|---|---|---|
| id | BIGINT | NO | auto | PK | Record identifier |
| school_id | BIGINT | NO | - | FK | School |
| budget_year_id | BIGINT | NO | - | FK | Budget year |
| semester | SMALLINT | NO | - | CHECK | Semester |
| realization_amount | NUMERIC(18,2) | NO | - | CHECK | Realization |
| evaluation_note | TEXT | YES | NULL | | Evaluation |
| created_at | TIMESTAMPTZ | NO | now() | | Creation |
| created_by | BIGINT | NO | - | FK | Creating user |
| updated_at | TIMESTAMPTZ | NO | now() | | Update |
| updated_by | BIGINT | NO | - | FK | Updating user |

## Constraints

    semester IN (1, 2)

    realization_amount >= 0

    UNIQUE(
        school_id,
        budget_year_id,
        semester
    )

## Foreign Keys

    school_id → schools.id

    budget_year_id → budget_years.id

    created_by → users.id

    updated_by → users.id

## Indexes

    school_id

    budget_year_id

    (school_id, budget_year_id, semester)

---

# 16. Table: bos_records

## Purpose

Stores annual BOS monitoring data.

The reporting period is the budget year.

## Columns

| Column | Type | Null | Default | Constraint | Description |
|---|---|---:|---|---|---|
| id | BIGINT | NO | auto | PK | BOS identifier |
| school_id | BIGINT | NO | - | FK | School |
| budget_year_id | BIGINT | NO | - | FK | Budget year |
| opening_balance | NUMERIC(18,2) | NO | - | CHECK | Opening balance |
| receipt_amount | NUMERIC(18,2) | NO | - | CHECK | Total receipts |
| usage_amount | NUMERIC(18,2) | NO | - | CHECK | Total usage |
| rkas_compliance | BOOLEAN | YES | NULL | | RKAS compliance |
| report_status | VARCHAR(20) | NO | - | CHECK | Completeness |
| notes | TEXT | YES | NULL | | Notes |
| created_at | TIMESTAMPTZ | NO | now() | | Creation |
| created_by | BIGINT | NO | - | FK | Creating user |
| updated_at | TIMESTAMPTZ | NO | now() | | Update |
| updated_by | BIGINT | NO | - | FK | Updating user |

## Constraints

    opening_balance >= 0

    receipt_amount >= 0

    usage_amount >= 0

    UNIQUE(
        school_id,
        budget_year_id
    )

## Calculated Value

    ending_balance =
        opening_balance
        + receipt_amount
        - usage_amount

The ending balance must not be directly editable.

## Foreign Keys

    school_id → schools.id

    budget_year_id → budget_years.id

    created_by → users.id

    updated_by → users.id

## Indexes

    school_id

    budget_year_id

    (school_id, budget_year_id)

---

# 17. Table: receivables

## Purpose

Stores annual receivable monitoring data.

## Columns

| Column | Type | Null | Default | Constraint | Description |
|---|---|---:|---|---|---|
| id | BIGINT | NO | auto | PK | Receivable identifier |
| school_id | BIGINT | NO | - | FK | School |
| budget_year_id | BIGINT | NO | - | FK | Budget year |
| opening_balance | NUMERIC(18,2) | NO | - | CHECK | Opening receivable |
| addition_amount | NUMERIC(18,2) | NO | - | CHECK | Additional receivable |
| settlement_amount | NUMERIC(18,2) | NO | - | CHECK | Settlement |
| dominant_age | VARCHAR(100) | YES | NULL | | Dominant age |
| follow_up | TEXT | YES | NULL | | Follow-up |
| created_at | TIMESTAMPTZ | NO | now() | | Creation |
| created_by | BIGINT | NO | - | FK | Creating user |
| updated_at | TIMESTAMPTZ | NO | now() | | Update |
| updated_by | BIGINT | NO | - | FK | Updating user |

## Constraints

    opening_balance >= 0

    addition_amount >= 0

    settlement_amount >= 0

    UNIQUE(
        school_id,
        budget_year_id
    )

## Calculated Value

    ending_balance =
        opening_balance
        + addition_amount
        - settlement_amount

## Pending Business Rule

The overdue percentage formula is not finalized.

Therefore the MVP must not invent or enforce a formula.

The following values remain available:

    opening_balance
    addition_amount
    settlement_amount
    ending_balance
    dominant_age
    follow_up

## Foreign Keys

    school_id → schools.id

    budget_year_id → budget_years.id

    created_by → users.id

    updated_by → users.id

## Indexes

    school_id

    budget_year_id

    (school_id, budget_year_id)

---

# 18. Table: reconciliations

## Purpose

Stores annual reconciliation between financial statement balance and bank balance.

## Columns

| Column | Type | Null | Default | Constraint | Description |
|---|---|---:|---|---|---|
| id | BIGINT | NO | auto | PK | Reconciliation identifier |
| school_id | BIGINT | NO | - | FK | School |
| budget_year_id | BIGINT | NO | - | FK | Budget year |
| financial_statement_balance | NUMERIC(18,2) | NO | - | | Financial statement balance |
| bank_balance | NUMERIC(18,2) | NO | - | | Bank balance |
| rkas_compliance | BOOLEAN | YES | NULL | | RKAS compliance |
| notes | TEXT | YES | NULL | | Notes |
| follow_up | TEXT | YES | NULL | | Follow-up |
| created_at | TIMESTAMPTZ | NO | now() | | Creation |
| created_by | BIGINT | NO | - | FK | Creating user |
| updated_at | TIMESTAMPTZ | NO | now() | | Update |
| updated_by | BIGINT | NO | - | FK | Updating user |

## Constraints

    UNIQUE(
        school_id,
        budget_year_id
    )

## Calculated Value

    difference =
        bank_balance
        - financial_statement_balance

## Reconciliation Status

MVP rule:

    difference = 0
        → SESUAI

    difference != 0
        → TIDAK SESUAI

No tolerance threshold is implemented.

## Foreign Keys

    school_id → schools.id

    budget_year_id → budget_years.id

    created_by → users.id

    updated_by → users.id

## Indexes

    school_id

    budget_year_id

    (school_id, budget_year_id)

---

# 19. Table: findings

## Purpose

Stores monitoring findings and follow-up actions.

## Columns

| Column | Type | Null | Default | Constraint | Description |
|---|---|---:|---|---|---|
| id | BIGINT | NO | auto | PK | Finding identifier |
| school_id | BIGINT | NO | - | FK | School |
| finding_date | DATE | NO | - | | Finding date |
| source | VARCHAR(150) | NO | - | | Finding source |
| finding | TEXT | NO | - | | Finding description |
| amount | NUMERIC(18,2) | YES | NULL | CHECK | Related amount |
| risk | VARCHAR(50) | YES | NULL | | Risk |
| recommendation | TEXT | NO | - | | Recommendation |
| pic | VARCHAR(150) | NO | - | | Person responsible |
| deadline | DATE | NO | - | | Follow-up deadline |
| status | VARCHAR(20) | NO | - | CHECK | Finding status |
| completed_date | DATE | YES | NULL | | Completion date |
| created_at | TIMESTAMPTZ | NO | now() | | Creation |
| created_by | BIGINT | NO | - | FK | Creating user |
| updated_at | TIMESTAMPTZ | NO | now() | | Update |
| updated_by | BIGINT | NO | - | FK | Updating user |

## Status Values

    OPEN

    ON_PROGRESS

    COMPLETED

## Constraints

If:

    status = COMPLETED

then:

    completed_date IS NOT NULL

If:

    status != COMPLETED

then:

    completed_date SHOULD be NULL

The final enforcement mechanism may be implemented at application validation level and/or database level.

## Foreign Keys

    school_id → schools.id

    created_by → users.id

    updated_by → users.id

## Indexes

    school_id

    status

    deadline

    (school_id, status)

---

# 20. Foreign Key Summary

    users.branch_id
        → branches.id

    schools.branch_id (UNIQUE)
        → branches.id

    rkas.school_id
        → schools.id

    rkas.budget_year_id
        → budget_years.id

    rkas.created_by
        → users.id

    rkas.updated_by
        → users.id

    rkas_revisions.rkas_id
        → rkas.id

    rkas_revisions.created_by
        → users.id

    monthly_realizations.school_id
        → schools.id

    monthly_realizations.budget_year_id
        → budget_years.id

    monthly_realizations.created_by
        → users.id

    monthly_realizations.updated_by
        → users.id

    semester_realizations.school_id
        → schools.id

    semester_realizations.budget_year_id
        → budget_years.id

    semester_realizations.created_by
        → users.id

    semester_realizations.updated_by
        → users.id

    bos_records.school_id
        → schools.id

    bos_records.budget_year_id
        → budget_years.id

    bos_records.created_by
        → users.id

    bos_records.updated_by
        → users.id

    receivables.school_id
        → schools.id

    receivables.budget_year_id
        → budget_years.id

    receivables.created_by
        → users.id

    receivables.updated_by
        → users.id

    reconciliations.school_id
        → schools.id

    reconciliations.budget_year_id
        → budget_years.id

    reconciliations.created_by
        → users.id

    reconciliations.updated_by
        → users.id

    findings.school_id
        → schools.id

    findings.created_by
        → users.id

    findings.updated_by
        → users.id

---

# 21. Delete Behavior

Operational records must not be deleted through the application.

Database foreign keys should therefore prefer:

    PROTECT

rather than:

    CASCADE

for operational financial data.

This prevents accidental deletion of historical records.

Examples:

    Branch
      ↓
    School
      ↓
    RKAS

Deleting a Branch must not automatically delete:

    School
    RKAS
    Realization
    BOS
    Receivable
    Reconciliation
    Findings

The application should instead use deactivation for master entities.

---

# 22. Active / Inactive Records

The following entities use:

    is_active

- Branch
- School
- User
- Budget Year

Deactivation preserves historical data.

Example:

    School A
        is_active = FALSE

Historical records remain available.

---

# 23. Unique Constraint Summary

Required unique constraints:

    branches:
        code

    users:
        username

    schools:
        code
        branch_id

    budget_years:
        name

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

# 24. Check Constraint Summary

Recommended database constraints:

## Schools

    student_count >= 0

## Budget Years

    start_date < end_date

## RKAS

    initial_amount >= 0

## RKAS Revisions

    revision_number >= 1

    amount >= 0

## Monthly Realization

    month BETWEEN 1 AND 12

    budget_amount >= 0

    realization_amount >= 0

## Semester Realization

    semester IN (1, 2)

    realization_amount >= 0

## BOS

    opening_balance >= 0

    receipt_amount >= 0

    usage_amount >= 0

## Receivable

    opening_balance >= 0

    addition_amount >= 0

    settlement_amount >= 0

## Findings

    amount >= 0

---

# 25. Index Strategy

Indexes should support:

1. authorization filtering;
2. school filtering;
3. budget-year filtering;
4. dashboard queries;
5. uniqueness;
6. status monitoring.

Important indexes:

    users(branch_id)

    users(role)

    schools(branch_id) -- UNIQUE

    schools(code)

    rkas(school_id, budget_year_id)

    rkas_revisions(rkas_id, revision_number)

    monthly_realizations(
        school_id,
        budget_year_id,
        month
    )

    semester_realizations(
        school_id,
        budget_year_id,
        semester
    )

    bos_records(
        school_id,
        budget_year_id
    )

    receivables(
        school_id,
        budget_year_id
    )

    reconciliations(
        school_id,
        budget_year_id
    )

    findings(
        school_id,
        status
    )

    findings(
        deadline
    )

Avoid adding indexes without a query/use-case justification.

---

# 26. Data Integrity Rules

The following rules must always hold.

## Rule 1

Every school belongs to exactly one branch; a branch may manage many
schools.

## Rule 2

Every operational financial record belongs to exactly one school.

## Rule 3

Every annual financial record references exactly one budget year.

## Rule 4

A branch user may only operate on schools belonging to their branch.

## Rule 5

A central user may read all branches.

## Rule 6

Central users cannot modify operational financial data.

## Rule 7

Operational records cannot be deleted through normal application operations.

## Rule 8

Calculated values must not be user-editable.

## Rule 9

Duplicate period records must be prevented at the database level.

## Rule 10

Historical data must remain available when master entities are deactivated.

---

# 27. Reporting Period Model

The system uses three reporting-period patterns.

## Annual

Used by:

    BOS
    Receivable
    Reconciliation

Key:

    school_id
    budget_year_id

---

## Monthly

Used by:

    Monthly Realization

Key:

    school_id
    budget_year_id
    month

---

## Semester

Used by:

    Semester Realization

Key:

    school_id
    budget_year_id
    semester

---

# 28. Dashboard Data

No dashboard table is required.

Dashboard values are derived from operational tables.

Examples:

    Total Schools

    Complete Monthly Reports

    Incomplete Monthly Reports

    Reconciliation Issues

    Open Findings

    Recently Updated Records

Dashboard queries should respect user scope.

Central:

    all branches

Branch:

    own branch only

---

# 29. Completeness Calculation

The application must distinguish:

    Existing record

from:

    Complete business data

For monthly realization:

    Expected:
        12 records per school per budget year

    Actual:
        number of monthly records

Example:

    10 / 12

Missing months:

    March
    May

The exact definition of completeness for other modules should follow their required fields.

---

# 30. Audit Metadata

Operational records contain:

    created_at
    created_by
    updated_at
    updated_by

These fields are required for:

- monitoring;
- accountability;
- last updated information.

Full audit history is outside MVP.

---

# 31. No Soft Delete for Operational Records

The MVP does not implement:

    deleted_at

for operational financial records.

Instead:

    edit existing record

is the correction mechanism.

Master entities use:

    is_active

for deactivation.

---

# 32. Migration Strategy

Database schema changes must be managed using Django migrations.

Workflow:

    Modify Django Model
          ↓
    python manage.py makemigrations
          ↓
    Review Migration
          ↓
    python manage.py migrate
          ↓
    Run Tests

Never manually alter production tables without a corresponding migration.

---

# 33. Django Model Mapping

The expected Django model mapping is:

    User
        → users

    Branch
        → branches

    School
        → schools

    BudgetYear
        → budget_years

    RKAS
        → rkas

    RKASRevision
        → rkas_revisions

    MonthlyRealization
        → monthly_realizations

    SemesterRealization
        → semester_realizations

    BOSRecord
        → bos_records

    Receivable
        → receivables

    Reconciliation
        → reconciliations

    Finding
        → findings

Django model names use PascalCase.

Database tables use snake_case.

---

# 34. Django ORM Relationship Strategy

Example conceptual relationship:

    Branch
        |
        └── school (OneToOneField)

    School
        |
        ├── rkas
        ├── monthly_realizations
        ├── semester_realizations
        ├── bos_records
        ├── receivables
        ├── reconciliations
        └── findings

Use Django `related_name` consistently.

Example:

    branch.schools.all()

    school.rkas.all()

    school.monthly_realizations.all()

The exact related names should follow project conventions consistently.

---

# 35. Financial Precision

All financial values must use:

    Decimal

in Python.

Do not use:

    float

for financial calculations.

Example:

    Decimal("1000000.00")

is correct.

    1000000.0

should not be used as the authoritative financial representation.

---

# 36. Calculation Consistency

The same business calculation must have one authoritative implementation.

Bad:

    calculation in JavaScript
    +
    different calculation in Django
    +
    different calculation in SQL

Correct:

    Django Service
         ↓
    authoritative calculation

The frontend displays the result.

SQL may perform aggregation for reporting, but must not silently implement a conflicting business formula.

---

# 37. Pending Business Rule

The following business rule remains pending:

    Receivable overdue percentage

The database must therefore not contain a mandatory calculated column for this value.

If the business later defines the formula, the application can add:

    overdue_percentage

as either:

- calculated query value;
- service-layer property;
- database-generated value;
- persisted value if justified.

The decision must be documented before implementation.

---

# 38. Schema Evolution

Future changes should prefer additive migrations.

Examples:

    Add column
    Add table
    Add index
    Add constraint

Avoid destructive migrations when historical data would be affected.

If a breaking schema change is necessary:

1. backup database;
2. create migration;
3. migrate safely;
4. verify data;
5. deploy application changes;
6. verify functionality.

---

# 39. Performance Principles

MVP performance priorities:

1. correct queries;
2. appropriate indexes;
3. pagination;
4. scoped querysets;
5. avoiding N+1 queries.

Use:

    select_related()

for appropriate foreign-key relationships.

Use:

    prefetch_related()

for appropriate one-to-many relationships.

Do not prematurely introduce caching.

---

# 40. N+1 Prevention

Example problematic pattern:

    for school in schools:
        school.branch.name

This can cause repeated database queries.

Use appropriate:

    select_related("branch")

Similarly, use:

    prefetch_related()

for collections when needed.

Dashboard queries should be explicitly reviewed for N+1 behavior.

---

# 41. Database Connection Management

Django should use PostgreSQL with appropriate connection settings.

Production configuration should consider:

- connection reuse;
- database connection limits;
- timeout settings.

The exact values depend on VPS resources and expected concurrency.

---

# 42. Backup Requirements

PostgreSQL must have regular backups.

Minimum requirements:

- scheduled backups;
- retention policy;
- off-server backup;
- restore testing.

The production database must never be considered safe solely because it is running on a VPS.

---

# 43. Seed Data

Development seed data may include:

    Central User

    Branch A
    Branch B

    School A1
    School A2
    School B1

    TA 2026/2027

Seed data must be clearly separated from production data.

Production credentials must never be stored in seed files.

---

# 44. Initial Database Creation Order

Recommended creation order:

    1. users
    2. branches
    3. schools
    4. budget_years
    5. rkas
    6. rkas_revisions
    7. monthly_realizations
    8. semester_realizations
    9. bos_records
    10. receivables
    11. reconciliations
    12. findings

Django migrations will handle dependency ordering automatically.

---

# 45. Schema Validation Checklist

Before implementation, verify:

    [ ] All BRD entities are represented
    [ ] All ERD relationships are represented
    [ ] OBD decisions are reflected
    [ ] Pending business rules are not invented
    [ ] Foreign keys are defined
    [ ] Unique constraints are defined
    [ ] Financial fields use Decimal
    [ ] Calculated values are identified
    [ ] Audit fields are present
    [ ] Delete behavior is defined
    [ ] Indexes are justified
    [ ] Authorization filtering is possible
    [ ] Budget-year relationships are correct

---

# 46. Final Schema Summary

Core tables:

    users
    branches
    schools
    budget_years
    rkas
    rkas_revisions
    monthly_realizations
    semester_realizations
    bos_records
    receivables
    reconciliations
    findings

Core hierarchy:

    User
      ↓
    Branch
      ↓
    School
      ↓
    Operational Data

Financial period structure:

    Annual:
        BOS
        Receivable
        Reconciliation

    Monthly:
        Monthly Realization

    Semester:
        Semester Realization

RKAS structure:

    RKAS
      ↓
    RKAS Revision 1
      ↓
    RKAS Revision 2
      ↓
    RKAS Revision N

---

# 47. Final Design Principle

The database must remain a reliable representation of the business domain.

The application must never:

- use Excel as the live database;
- rely on frontend filtering for security;
- duplicate financial calculations unnecessarily;
- allow unauthorized branch access;
- delete operational history;
- invent unresolved business rules.

The database schema must remain consistent with:

    BRD
    Open Business Decisions
    ERD
    SDD

Any intentional deviation must be documented and approved before implementation.