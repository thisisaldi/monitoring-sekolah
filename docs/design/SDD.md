# SOFTWARE DESIGN DOCUMENT (SDD)

# School Financial Monitoring System

Version: 0.1
Status: Draft for Development
Document Type: Software Design Document

---

# 1. Document Purpose

This document defines the technical design for the School Financial Monitoring System.

The system is a centralized web application used to collect financial and monitoring data from schools through branch representatives and allow the central office to monitor the collected data.

This document translates the business requirements defined in:

- `docs/requirements/BRD.md`
- `docs/requirements/open-business-decisions.md`
- `docs/design/ERD.md`

into a technical implementation design.

The Excel workbook in:

`docs/reference/`

is considered legacy/reference material and is not the authoritative system design.

The authoritative design hierarchy is:

    BRD
      ↓
    SDD
      ↓
    Implementation

---

# 2. System Objective

The system replaces spreadsheet-based data collection and monitoring.

The core workflow is:

    Branch
       ↓
    Login
       ↓
    Select School
       ↓
    Enter / Update Data
       ↓
    System Validates
       ↓
    System Calculates
       ↓
    Database
       ↓
    Central Monitoring Dashboard

The core principle is:

    Branch enters data.
    System stores and calculates data.
    Central monitors data.

---

# 3. Scope

## 3.1 Included

The MVP includes:

- Authentication
- User management foundation
- Branch management foundation
- School master data
- Budget year
- RKAS
- RKAS revisions
- Monthly realization
- Semester realization
- BOS
- Receivables
- Reconciliation
- Findings and follow-up
- Branch dashboard
- Central dashboard
- Role-based access control
- Audit metadata
- Input validation
- Automatic calculations
- Data completeness monitoring

---

## 3.2 Excluded

The MVP does not include:

- Approval workflow
- Submission workflow
- Central editing of branch data
- Operational data deletion
- Automatic risk classification
- Automatic notifications
- External system integration
- Native mobile application
- AI financial analysis
- Advanced audit history
- Document upload workflow
- Automated reminders

These may be implemented in future versions.

---

# 4. Architecture Decision

The application will use a modular monolithic architecture.

The MVP will NOT use separately deployed frontend and backend applications.

Architecture:

    Browser
       |
       | HTTPS
       v
    Nginx
       |
       v
    Django Application
       |
       +----------------------+
       |                      |
       v                      v
    PostgreSQL             Static Files
       |
       v
    Persistent Storage

Frontend rendering is handled by Django Templates.

HTMX is used for partial page updates and interactive UI behavior.

Tailwind CSS is used for styling.

---

# 5. Architecture Rationale

The system is primarily a CRUD and monitoring application.

The major workflows are:

- forms;
- tables;
- filters;
- dashboards;
- CRUD operations;
- role-based access;
- calculations;
- relational data.

The system does not currently require a highly stateful single-page application.

Therefore a Django monolith provides:

- simpler deployment;
- simpler authentication;
- simpler authorization;
- simpler server-side validation;
- simpler database access;
- fewer infrastructure components;
- lower operational complexity;
- easier maintenance.

HTMX provides interactive behavior without requiring a separate frontend application.

If future requirements require a highly interactive frontend, an API layer can be introduced incrementally.

---

# 6. Technology Stack

## 6.1 Backend

Django

Purpose:

- application framework;
- routing;
- authentication;
- ORM;
- forms;
- validation;
- templating;
- security;
- management commands.

---

## 6.2 Frontend

Django Templates

Purpose:

- server-rendered HTML;
- page structure;
- forms;
- tables;
- dashboard.

---

## 6.3 Interactive UI

HTMX

Purpose:

- partial page updates;
- modal forms;
- filtering;
- inline UI updates;
- asynchronous form submission where useful.

HTMX must not become a substitute for backend validation.

All important business rules remain on the backend.

---

## 6.4 CSS

Tailwind CSS

Purpose:

- application layout;
- responsive UI;
- forms;
- tables;
- dashboard cards;
- status indicators.

---

## 6.5 Database

PostgreSQL

Purpose:

- relational data storage;
- constraints;
- transactions;
- indexing;
- aggregation;
- referential integrity.

---

## 6.6 Web Server

Nginx

Responsibilities:

- TLS termination;
- static files;
- reverse proxy;
- request forwarding to Django;
- basic security headers.

---

## 6.7 Application Server

Gunicorn

Responsibilities:

- running Django application processes;
- handling production HTTP requests behind Nginx.

---

## 6.8 Containerization

Docker

Docker Compose will orchestrate:

- Django application;
- PostgreSQL;
- Nginx.

---

# 7. High-Level Architecture

    +-----------------------------+
    |           Browser           |
    |                             |
    | Django HTML + HTMX          |
    +--------------+--------------+
                   |
                 HTTPS
                   |
                   v
    +-----------------------------+
    |           Nginx             |
    |                             |
    | TLS / Static / Proxy        |
    +--------------+--------------+
                   |
                   v
    +-----------------------------+
    |          Django             |
    |                             |
    | Authentication              |
    | Authorization               |
    | Views                       |
    | Forms                       |
    | Business Services           |
    | Dashboard Queries           |
    | ORM                         |
    +--------------+--------------+
                   |
                   v
    +-----------------------------+
    |         PostgreSQL          |
    +-----------------------------+

---

# 8. Application Structure

The source code should be organized by business domain.

Recommended structure:

    school-financial-monitoring/
    |
    +-- config/
    |   +-- settings/
    |   +-- urls.py
    |   +-- wsgi.py
    |   +-- asgi.py
    |
    +-- apps/
    |   +-- accounts/
    |   +-- branches/
    |   +-- schools/
    |   +-- budget_years/
    |   +-- rkas/
    |   +-- realizations/
    |   +-- bos/
    |   +-- receivables/
    |   +-- reconciliation/
    |   +-- findings/
    |   +-- dashboard/
    |
    +-- templates/
    |   +-- base/
    |   +-- components/
    |   +-- accounts/
    |   +-- schools/
    |   +-- rkas/
    |   +-- realizations/
    |   +-- bos/
    |   +-- receivables/
    |   +-- reconciliation/
    |   +-- findings/
    |   +-- dashboard/
    |
    +-- static/
    |   +-- css/
    |   +-- js/
    |   +-- images/
    |
    +-- tests/
    |
    +-- docs/
    |
    +-- manage.py
    +-- Dockerfile
    +-- docker-compose.yml
    +-- .env.example

---

# 9. Django Application Responsibilities

## 9.1 accounts

Responsibilities:

- authentication;
- login;
- logout;
- user role;
- branch association;
- authorization helpers.

---

## 9.2 branches

Responsibilities:

- branch entity;
- branch master data;
- branch activation/deactivation.

---

## 9.3 schools

Responsibilities:

- school entity;
- school master data;
- branch-school relationship;
- school activation/deactivation.

---

## 9.4 budget_years

Responsibilities:

- budget year;
- start date;
- end date;
- active budget year.

---

## 9.5 rkas

Responsibilities:

- RKAS;
- RKAS revisions;
- current RKAS calculation;
- revision history.

---

## 9.6 realizations

Responsibilities:

- monthly realization;
- semester realization;
- variance calculation;
- realization percentage;
- completeness status.

---

## 9.7 bos

Responsibilities:

- BOS records;
- BOS balance calculation;
- BOS monitoring.

---

## 9.8 receivables

Responsibilities:

- receivable records;
- receivable balance calculation;
- receivable monitoring.

---

## 9.9 reconciliation

Responsibilities:

- reconciliation records;
- difference calculation;
- reconciliation monitoring.

---

## 9.10 findings

Responsibilities:

- findings;
- recommendations;
- PIC;
- deadline;
- follow-up status.

---

## 9.11 dashboard

Responsibilities:

- central dashboard;
- branch dashboard;
- aggregation queries;
- completeness monitoring;
- monitoring summaries.

The dashboard app must not own operational financial data.

It reads from other domain applications.

---

# 10. Database Design

The database design follows:

`docs/design/ERD.md`

The database must model business entities rather than replicate Excel sheets.

Core entities:

- User
- Branch
- School
- BudgetYear
- RKAS
- RKASRevision
- MonthlyRealization
- SemesterRealization
- BOSRecord
- Receivable
- Reconciliation
- Finding

---

# 11. Database Conventions

## 11.1 Primary Keys

All entities use an auto-generated numeric primary key unless there is a strong reason to use another strategy.

Recommended:

    BIGINT

Django's default BigAutoField is acceptable.

---

## 11.2 Foreign Keys

Foreign keys must use Django relational fields.

Example:

    school = models.ForeignKey(
        School,
        on_delete=models.PROTECT
    )

Business relationships must never be represented using names.

Do not use:

    school_name

as a foreign key.

---

## 11.3 Timestamps

Operational models should contain:

    created_at
    updated_at

Use timezone-aware datetime values.

Django timezone support must be enabled.

---

## 11.4 Audit User

Where applicable:

    created_by
    updated_by

must reference the authenticated user.

---

# 12. Database Schema

The following schema represents the intended MVP model.

---

## 12.1 User

Table:

    users

Fields:

    id
    branch_id
    name
    username
    password_hash
    role
    is_active
    created_at
    updated_at

Role:

    BRANCH
    CENTRAL

Constraints:

    BRANCH user:
        branch_id IS NOT NULL

    CENTRAL user:
        branch_id IS NULL

## Custom User Model

The application must use a custom Django user model.

The custom user model must be implemented at the beginning of Phase 2, before implementing application-level authentication, RBAC, or business-domain models that depend on user ownership.

The project must not implement the production authentication system using Django's default User model and migrate to a custom user model after application data and migrations have already been established.

The User model initially does not contain a Branch foreign key because the Branch model is implemented in a later phase.

The Branch relationship will be added through a subsequent migration when the Branch model is introduced.

The User model supports the following roles:

- CENTRAL
- BRANCH

The role must be explicitly assigned when creating a user. The system must not assume a default business role.
---

# 13. Branch

Table:

    branches

Fields:

    id
    code
    name
    is_active
    created_at
    updated_at

Constraints:

    code UNIQUE

---

# 14. School

Table:

    schools

Fields:

    id
    branch_id
    code
    name
    education_level
    principal_name
    treasurer_name
    student_count
    note
    is_active
    created_at
    updated_at

Constraints:

    code UNIQUE
    branch_id UNIQUE

Relationship:

    Branch 1:1 School

---

# 15. Budget Year

Table:

    budget_years

Fields:

    id
    name
    start_date
    end_date
    is_active
    created_at
    updated_at

Constraints:

    name UNIQUE
    start_date < end_date

---

# 16. RKAS

Table:

    rkas

Fields:

    id
    school_id
    budget_year_id
    initial_amount
    initial_approval_date
    major_change_description
    created_at
    created_by
    updated_at
    updated_by

Constraint:

    UNIQUE(school_id, budget_year_id)

---

# 17. RKAS Revision

Table:

    rkas_revisions

Fields:

    id
    rkas_id
    revision_number
    amount
    revision_date
    change_description
    created_at
    created_by

Constraint:

    UNIQUE(rkas_id, revision_number)

---

# 18. Monthly Realization

Table:

    monthly_realizations

Fields:

    id
    school_id
    budget_year_id
    month
    budget_amount
    realization_amount
    variance_explanation
    report_status
    created_at
    created_by
    updated_at
    updated_by

Constraint:

    UNIQUE(
        school_id,
        budget_year_id,
        month
    )

Calculated:

    variance

    realization_percentage

---

# 19. Semester Realization

Table:

    semester_realizations

Fields:

    id
    school_id
    budget_year_id
    semester
    realization_amount
    evaluation_note
    created_at
    created_by
    updated_at
    updated_by

Constraint:

    UNIQUE(
        school_id,
        budget_year_id,
        semester
    )

---

# 20. BOS

Table:

    bos_records

Fields:

    id
    school_id
    budget_year_id
    opening_balance
    receipt_amount
    usage_amount
    rkas_compliance
    report_status
    notes
    created_at
    created_by
    updated_at
    updated_by

MVP constraint:

    UNIQUE(
        school_id,
        budget_year_id
    )

This must be revisited if BOS reporting is later confirmed as monthly or semester-based.

---

# 21. Receivable

Table:

    receivables

Fields:

    id
    school_id
    budget_year_id
    opening_balance
    addition_amount
    settlement_amount
    dominant_age
    follow_up
    created_at
    created_by
    updated_at
    updated_by

MVP constraint:

    UNIQUE(
        school_id,
        budget_year_id
    )

The overdue percentage formula remains an open business decision.

---

# 22. Reconciliation

Table:

    reconciliations

Fields:

    id
    school_id
    budget_year_id
    financial_statement_balance
    bank_balance
    rkas_compliance
    notes
    follow_up
    created_at
    created_by
    updated_at
    updated_by

MVP constraint:

    UNIQUE(
        school_id,
        budget_year_id
    )

---

# 23. Finding

Table:

    findings

Fields:

    id
    school_id
    finding_date
    source
    finding
    amount
    risk
    recommendation
    pic
    deadline
    status
    completed_date
    created_at
    created_by
    updated_at
    updated_by

A school can have many findings.

---

# 24. Calculated Values

Calculated values must not be ordinary user-editable fields.

---

## 24.1 Current RKAS

Formula:

    if no revision exists:

        current_rkas = initial_amount

    otherwise:

        current_rkas =
            amount of latest revision

This calculation should be implemented in the domain/service layer or as a query/property.

---

## 24.2 Monthly Variance

    variance =
        budget_amount - realization_amount

---

## 24.3 Monthly Realization Percentage

    realization_percentage =
        realization_amount / budget_amount * 100

If budget amount is zero:

    realization_percentage = NULL

---

## 24.4 Semester Total

    total_realization =
        semester_1_realization
        + semester_2_realization

---

## 24.5 Semester Final Percentage

    final_percentage =
        total_realization / current_rkas * 100

If current RKAS is zero:

    final_percentage = NULL

---

## 24.6 Remaining Budget

    remaining_budget =
        current_rkas - total_realization

---

## 24.7 BOS Ending Balance

    ending_balance =
        opening_balance
        + receipt_amount
        - usage_amount

---

## 24.8 Receivable Ending Balance

    ending_balance =
        opening_balance
        + addition_amount
        - settlement_amount

---

## 24.9 Reconciliation Difference

    difference =
        bank_balance
        - financial_statement_balance

---

# 25. Calculation Architecture

Critical calculations must be centralized.

Recommended structure:

    apps/
        rkas/
            services.py

        realizations/
            services.py

        bos/
            services.py

        receivables/
            services.py

        reconciliation/
            services.py

The frontend must never be the only place where calculations are implemented.

Example:

    User submits:
        budget_amount
        realization_amount

    Backend:
        validates input
        calculates variance
        calculates percentage
        saves source values

    Frontend:
        displays the calculated result

---

# 26. Transaction Handling

Operations involving multiple related records must use database transactions.

Example:

    Create RKAS
       +
    Create Revision
       +
    Related audit information

should use:

    transaction.atomic()

A failed operation must not leave partial data.

---

# 27. Authentication

Django authentication will be used.

Required functionality:

- Login
- Logout
- Session management
- Password hashing
- Password validation
- Authentication-required pages

For the MVP, traditional Django session authentication is preferred.

JWT is not required because the MVP is a server-rendered Django application.

---

# 28. Authorization

Authorization is role and ownership based.

Two primary roles:

    CENTRAL
    BRANCH

---

# 29. Branch Authorization

A branch user may access only schools where:

    school.branch_id == request.user.branch_id

The same rule must apply to:

- RKAS
- Monthly Realization
- Semester Realization
- BOS
- Receivables
- Reconciliation
- Findings

Authorization must be checked on the backend.

---

# 30. Central Authorization

Central users may view all operational records.

Central users must not:

- create operational data;
- update operational data;
- delete operational data.

---

# 31. Authorization Implementation

Do not rely on URL filtering alone.

Bad:

    /schools/123/

with only frontend hiding.

Correct:

    backend retrieves School 123
    backend checks user scope
    backend denies access if unauthorized

Recommended patterns:

- mixins;
- decorators;
- service-layer ownership checks;
- queryset scoping.

---

# 32. Queryset Scoping

For branch users, querysets should automatically be restricted.

Conceptually:

    if user.role == BRANCH:

        queryset =
            queryset.filter(
                school__branch=user.branch
            )

For central:

    queryset =
        queryset.all()

This logic must be reusable rather than duplicated inconsistently across views.

---

# 33. Data Deletion

There is no delete action in normal operational UI.

Do not expose:

    DELETE

actions for:

- RKAS
- RKAS revisions
- Monthly Realizations
- Semester Realizations
- BOS
- Receivables
- Reconciliations
- Findings

Corrections use update.

---

# 34. Master Data

Master data includes:

- Branch
- School
- User
- Budget Year

The exact authority for creating and modifying master data remains an open business decision.

Until that decision is made, do not expose arbitrary master-data creation to branch users.

---

# 35. Navigation Structure

Main navigation:

    Dashboard

    Schools

    RKAS

    Realisasi Bulanan

    Realisasi Semester

    BOS

    Piutang

    Rekonsiliasi

    Temuan & Tindak Lanjut

Navigation visibility should depend on role.

---

# 36. School-Centered UX

Although the application has multiple modules, the UX should be school-centered.

Recommended flow:

    Schools
       |
       +-- School A
       |
       +-- Overview
       +-- RKAS
       +-- Realisasi Bulanan
       +-- Realisasi Semester
       +-- BOS
       +-- Piutang
       +-- Rekonsiliasi
       +-- Temuan

This prevents the application from becoming a direct copy of the Excel workbook.

---

# 37. School Overview

The school overview should provide:

    School Name
    Branch
    Education Level
    Principal
    Treasurer
    Student Count

Monitoring status:

    RKAS
    Monthly Realization
    Semester Realization
    BOS
    Receivable
    Reconciliation
    Findings

Example:

    SCHOOL A
    Branch: Bandung

    RKAS                 Complete
    Monthly Realization  10/12 months
    Semester             Complete
    BOS                  Complete
    Receivable           Complete
    Reconciliation       Incomplete
    Findings             2

---

# 38. Dashboard

Dashboard is an aggregation layer.

It is not a database entity.

Architecture:

    Operational Data
         ↓
    Query / Aggregation
         ↓
    Dashboard Service
         ↓
    Template
         ↓
    User

---

# 39. Central Dashboard

Central dashboard must provide:

- total branches;
- total schools;
- data completeness;
- monthly report completeness;
- reconciliation issues;
- open findings;
- recent updates.

Filters:

- budget year;
- branch;
- school.

---

# 40. Branch Dashboard

Branch dashboard only includes:

    branch.user.branch

The dashboard must not expose other branches.

Minimum information:

- total schools;
- school data completeness;
- incomplete reports;
- recently updated data;
- findings.

---

# 41. Dashboard Query Strategy

Dashboard queries should use database aggregation.

Do not retrieve every record into Python and calculate all dashboard values manually if the database can aggregate efficiently.

Examples:

- COUNT
- SUM
- AVG
- conditional aggregation
- EXISTS
- annotations

The dashboard should return only the data required by the UI.

---

# 42. Monthly Completeness

Monthly reporting completeness should be derived from expected reporting periods.

For each school and budget year:

Expected:

    12 months

Actual:

    number of existing monthly realization records

Example:

    12 expected
    10 submitted

Result:

    10/12

The system should identify missing months.

Example:

    Missing:
        March
        May

---

# 43. Status Representation

The system should distinguish:

    COMPLETE
    INCOMPLETE

from approval status.

`COMPLETE` means required data exists.

It does NOT mean:

- approved;
- audited;
- verified;
- correct.

---

# 44. Forms

Forms should use Django Forms or ModelForms where appropriate.

Forms must:

- validate required fields;
- validate numeric values;
- validate dates;
- validate relationships;
- validate ownership;
- display useful error messages.

---

# 45. Numeric Validation

Financial fields must:

- accept decimal values;
- reject invalid strings;
- reject unexpected characters;
- prevent invalid negative values where business rules prohibit them.

Do not use floating-point types for financial amounts.

Use decimal numeric fields.

Recommended:

    DecimalField

with appropriate precision.

Final precision must be determined during schema implementation.

---

# 46. Date Validation

Dates must use Django date fields.

The application should reject:

- malformed dates;
- impossible dates;
- dates outside valid business periods where applicable.

---

# 47. Monthly Validation

Month must be an integer from:

    1 to 12

The budget-year reporting sequence is:

    July → June

The UI should display:

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

The database may store numeric month values.

---

# 48. Semester Validation

Semester must be:

    1
    2

No other values are allowed.

---

# 49. RKAS Validation

Required:

- school;
- budget year;
- initial amount.

Revision validation:

- revision number must be positive;
- revision number must be unique within an RKAS;
- revision amount must be valid;
- revision date must be valid.

The system must not allow revision numbers to be duplicated.

---

# 50. Monthly Realization Validation

Required:

- school;
- budget year;
- month;
- budget amount;
- realization amount.

Uniqueness:

    school
    +
    budget year
    +
    month

must be unique.

---

# 51. Semester Validation

Required:

- school;
- budget year;
- semester;
- realization amount.

Uniqueness:

    school
    +
    budget year
    +
    semester

---

# 52. BOS Validation

Required:

- school;
- budget year;
- opening balance;
- receipt amount;
- usage amount.

Ending balance is calculated.

Do not allow the user to manually modify ending balance.

---

# 53. Receivable Validation

Required:

- school;
- budget year;
- opening balance;
- addition amount;
- settlement amount.

Ending balance is calculated.

The overdue percentage formula remains pending.

---

# 54. Reconciliation Validation

Required:

- school;
- budget year;
- financial statement balance;
- bank balance.

Difference is calculated.

Reconciliation status is subject to the pending business rule.

---

# 55. Finding Validation

Required:

- school;
- finding date;
- source;
- finding;
- recommendation;
- PIC;
- deadline;
- status.

Completed date should be required when status is `COMPLETED`.

The exact final status values remain subject to business confirmation.

---

# 56. Error Handling

User-facing errors must be understandable.

Examples:

    "Data bulan Juli untuk sekolah ini sudah tersedia."

    "Anda tidak memiliki akses ke sekolah ini."

    "Nilai realisasi tidak valid."

    "Data berhasil diperbarui."

Do not expose raw stack traces to users.

---

# 57. HTTP Error Handling

Expected behavior:

    400
        Invalid request

    403
        Unauthorized access

    404
        Resource not found

    405
        Method not allowed

    409
        Conflict / duplicate where appropriate

    500
        Internal server error

Production errors must be logged without exposing sensitive information.

---

# 58. HTMX Architecture

HTMX should be used selectively.

Good use cases:

- filtering tables;
- modal forms;
- inline editing;
- partial table refresh;
- dashboard filter updates;
- form validation feedback.

Do not make every interaction an HTMX request.

Simple navigation can remain standard HTTP navigation.

---

# 59. HTMX Security

HTMX requests are still backend requests.

They must pass the same:

- authentication;
- authorization;
- CSRF;
- validation;

as normal requests.

Do not assume HTMX requests are trusted.

---

# 60. CSRF

Django CSRF protection must remain enabled.

All state-changing requests must include valid CSRF protection.

Do not disable CSRF globally.

---

# 61. Session Security

Production configuration should include:

    SESSION_COOKIE_SECURE = True

    CSRF_COOKIE_SECURE = True

    SESSION_COOKIE_HTTPONLY = True

    CSRF_COOKIE_HTTPONLY = False

Secure cookie settings depend on HTTPS being enabled.

---

# 62. Password Security

Passwords must be hashed using Django's password hashing system.

Never:

- store plaintext passwords;
- log passwords;
- return passwords in templates;
- expose password hashes through application responses.

---

# 63. HTTPS

Production must use HTTPS.

Nginx should terminate TLS.

HTTP should redirect to HTTPS.

---

# 64. Security Headers

Production should configure appropriate security headers.

Examples:

- HSTS
- X-Content-Type-Options
- Referrer-Policy
- Content-Security-Policy where practical

Final CSP policy should be tested against HTMX and static assets before enabling a strict policy.

---

# 65. Environment Configuration

Secrets must not be committed to Git.

Use:

    .env

for local/private configuration.

Provide:

    .env.example

containing placeholders.

Example variables:

    DEBUG=False

    SECRET_KEY=

    DATABASE_URL=

    POSTGRES_DB=

    POSTGRES_USER=

    POSTGRES_PASSWORD=

    ALLOWED_HOSTS=

Do not commit production credentials.

---

# 66. Static Files

Production static files should be collected using:

    python manage.py collectstatic

Nginx should serve static files directly where appropriate.

---

# 67. Media Files

The MVP does not require user-uploaded documents.

If media uploads are introduced later, storage architecture must be defined separately.

---

# 68. Logging

Application logs should capture:

- application errors;
- authentication failures;
- unexpected exceptions;
- important operational failures.

Do not log:

- passwords;
- session secrets;
- sensitive credentials.

---

# 69. Audit Metadata

Operational records store:

    created_at
    created_by
    updated_at
    updated_by

This is sufficient for MVP.

Full field-level audit history is a future enhancement.

---

# 70. Database Transactions

Use transactions for operations that modify multiple related records.

Example:

    RKAS update
       +
    revision creation

must be atomic when implemented as a combined operation.

---

# 71. Testing Strategy

Testing must cover:

1. Model tests
2. Validation tests
3. Business logic tests
4. Authorization tests
5. View tests
6. Dashboard tests
7. Integration tests

---

# 72. Model Tests

Test:

- relationships;
- constraints;
- unique fields;
- calculated values;
- invalid values;
- inactive entities.

---

# 73. Business Logic Tests

Example:

    opening = 100
    receipt = 50
    usage = 30

Expected:

    ending = 120

Test cases must include:

- normal values;
- zero values;
- boundary values;
- invalid values.

---

# 74. Authorization Tests

Critical tests:

    Branch A user
        -> School A
        -> ALLOWED

    Branch A user
        -> School B
        -> DENIED

    Central user
        -> School A
        -> READ ALLOWED

    Central user
        -> update School A data
        -> DENIED

---

# 75. Duplicate Tests

Test that:

    School
    +
    Budget Year
    +
    Month

cannot be duplicated for monthly realization.

Also test:

- duplicate RKAS;
- duplicate RKAS revision;
- duplicate semester;
- duplicate BOS;
- duplicate receivable;
- duplicate reconciliation.

---

# 76. Dashboard Tests

Dashboard must correctly calculate:

- school count;
- incomplete reports;
- completed reports;
- findings;
- reconciliation issues.

Test both:

    Central

and:

    Branch

scopes.

---

# 77. UI Testing

Important workflows:

    Login
       ↓
    Dashboard
       ↓
    Select School
       ↓
    Open RKAS
       ↓
    Input
       ↓
    Save
       ↓
    Verify

Repeat for each module.

---

# 78. Database Migration Strategy

All schema changes must be managed using Django migrations.

Never manually modify production schema without a corresponding migration.

Development flow:

    Change Model
       ↓
    makemigrations
       ↓
    Review Migration
       ↓
    migrate
       ↓
    Test

---

# 79. Seed Data

Development seed data may include:

- sample central user;
- sample branch users;
- sample branches;
- sample schools;
- sample budget year.

Seed data must never contain real production credentials.

---

# 80. Development Environment

Recommended development stack:

    Docker Compose

Services:

    web
        Django

    db
        PostgreSQL

Nginx may be included during production-like local testing.

---

# 81. Docker Architecture

Development:

    docker-compose.yml

    services:
        web
        db

Production:

    Nginx
       ↓
    Gunicorn
       ↓
    Django
       ↓
    PostgreSQL

---

# 82. Production Architecture

Recommended MVP deployment:

    Internet
       |
       v
    Domain
       |
       v
    Nginx
       |
       v
    Django / Gunicorn
       |
       v
    PostgreSQL

All components can run on one VPS.

The frontend is not deployed separately.

Django serves the application HTML.

---

# 83. Production VPS

The MVP can operate on a single Linux VPS.

Minimum infrastructure should be selected based on:

- number of schools;
- expected concurrent users;
- database size;
- dashboard query load.

Initial deployment should prioritize simplicity.

Horizontal scaling is not required for MVP.

---

# 84. Backup Strategy

PostgreSQL must be backed up regularly.

At minimum:

- scheduled database backup;
- backup retention;
- backup verification;
- off-server backup storage.

A backup that has never been restored/tested must not be considered reliable.

---

# 85. Deployment Process

Recommended deployment:

    Developer
        ↓
    Git Repository
        ↓
    VPS
        ↓
    Docker Compose
        ↓
    Django Migration
        ↓
    Collect Static
        ↓
    Restart Application
        ↓
    Health Check

---

# 86. Deployment Commands

The exact production commands will be defined during implementation.

Conceptually:

    git pull

    docker compose build

    docker compose up -d

    docker compose exec web python manage.py migrate

    docker compose exec web python manage.py collectstatic --noinput

Then verify:

    application health
    database connectivity
    authentication
    dashboard
    static files

---

# 87. Health Check

The application should expose an internal health endpoint.

Example:

    /health/

Expected:

    HTTP 200

The health check should verify basic application availability.

A database health check may be added.

---

# 88. URL Structure

Recommended URL structure:

    /login/
    /logout/

    /dashboard/

    /schools/
    /schools/<id>/

    /rkas/
    /rkas/<id>/

    /realizations/monthly/
    /realizations/monthly/<id>/

    /realizations/semester/
    /realizations/semester/<id>/

    /bos/
    /bos/<id>/

    /receivables/
    /receivables/<id>/

    /reconciliation/
    /reconciliation/<id>/

    /findings/
    /findings/<id>/

URL naming may be refined during implementation.

---

# 89. Page Structure

## Authentication

    Login

---

## Dashboard

    Central Dashboard
    Branch Dashboard

---

## Schools

    School List
    School Detail

---

## RKAS

    RKAS List
    RKAS Detail
    RKAS Create/Edit
    Revision List
    Revision Create/Edit

---

## Monthly Realization

    Monthly List
    Monthly Create/Edit

---

## Semester Realization

    Semester List
    Semester Create/Edit

---

## BOS

    BOS List
    BOS Create/Edit

---

## Receivable

    Receivable List
    Receivable Create/Edit

---

## Reconciliation

    Reconciliation List
    Reconciliation Create/Edit

---

## Findings

    Finding List
    Finding Detail
    Finding Create/Edit

---

# 90. List Page Pattern

All list pages should support:

- search where useful;
- filters;
- pagination;
- sorting where useful;
- status indicators;
- last updated information.

Avoid loading unlimited records into one page.

---

# 91. Form Page Pattern

Forms should contain:

    Page Title

    Context:
        Branch
        School
        Budget Year

    Input Fields

    Calculated Fields
        Read Only

    Validation Messages

    Save Button

    Cancel Button

Calculated fields should visually differ from editable fields.

---

# 92. Financial Input UX

Currency fields should display human-readable formatting.

Example:

    Rp 1.000.000

Internally the backend stores a decimal value.

Do not store formatted currency strings in numeric database columns.

---

# 93. Read-Only Calculated Fields

Example:

    Anggaran RKAS
        [ Rp 100.000.000 ]

    Realisasi
        [ Rp 75.000.000 ]

    Selisih
        [ Rp 25.000.000 ]
        READ ONLY

    % Realisasi
        [ 75% ]
        READ ONLY

---

# 94. Editing Workflow

Branch:

    Open existing record
       ↓
    Edit
       ↓
    Validate
       ↓
    Save
       ↓
    updated_at updated
       ↓
    updated_by updated

No new duplicate record should be created.

---

# 95. Last Updated

The UI should display:

    Last updated:
    <datetime>

where useful.

Example:

    Last updated 15 Aug 2026, 14:21
    by Branch Bandung

---

# 96. Dashboard School Status

A monitoring table may show:

    School
    RKAS
    Monthly
    Semester
    BOS
    Receivable
    Reconciliation
    Findings

Example:

    School A
    ✓
    10/12
    ✓
    ✓
    ✓
    ✓
    2 findings

This is a monitoring indicator, not an approval status.

---

# 97. Design System

The UI should use consistent:

- spacing;
- typography;
- buttons;
- forms;
- tables;
- cards;
- badges;
- alerts;
- modal dialogs.

Tailwind utility classes should be centralized through reusable template components where practical.

---

# 98. Reusable Template Components

Recommended:

    base/layout.html

    components/navbar.html

    components/sidebar.html

    components/page_header.html

    components/table.html

    components/form_field.html

    components/status_badge.html

    components/alert.html

    components/modal.html

    components/pagination.html

---

# 99. Responsive Design

The application should work on:

- desktop;
- laptop;
- tablet.

Mobile support should be usable but does not need to be optimized as a native mobile application.

The primary target is desktop/laptop because the system is primarily an administrative monitoring system.

---

# 100. API Strategy

The MVP does not require a public REST API.

Django views and HTMX endpoints are sufficient.

However, application logic must be separated from presentation logic so that an API can be introduced later.

Recommended:

    View
      ↓
    Service
      ↓
    Model / Query

Avoid placing complex business logic directly inside templates.

---

# 101. Service Layer

Use service functions/classes for important business operations.

Examples:

    calculate_current_rkas()

    calculate_monthly_variance()

    calculate_realization_percentage()

    calculate_bos_balance()

    calculate_receivable_balance()

    calculate_reconciliation_difference()

    get_school_monitoring_status()

    get_dashboard_summary()

This makes business logic easier to test.

---

# 102. Query Layer

Complex monitoring queries should be isolated.

Examples:

    get_incomplete_monthly_reports()

    get_school_monitoring_summary()

    get_reconciliation_issues()

    get_open_findings()

    get_recently_updated_schools()

This prevents large dashboard logic from being embedded directly in views.

---

# 103. Business Logic Location

Business rules belong in:

    Models
    Forms
    Services
    Query layer

depending on their responsibility.

Templates should only present data.

JavaScript should not be the authoritative source of business rules.

---

# 104. Open Business Decisions

The following must remain unresolved until confirmed.

## OBD-001

Who manages:

- branches;
- schools;
- school assignments;
- school master data.

---

## OBD-002

BOS reporting period.

---

## OBD-003

Receivable reporting period.

---

## OBD-004

Reconciliation reporting period.

---

## OBD-005

Receivable overdue percentage formula.

---

## OBD-006

Reconciliation status tolerance.

---

## OBD-007

Final finding statuses.

---

# 105. Technical Decisions Already Made

The following decisions are considered approved for MVP:

    Architecture:
        Modular Monolith

    Backend:
        Django

    Frontend:
        Django Templates

    Interactive UI:
        HTMX

    CSS:
        Tailwind CSS

    Database:
        PostgreSQL

    Application Server:
        Gunicorn

    Reverse Proxy:
        Nginx

    Container:
        Docker

    Orchestration:
        Docker Compose

    Authentication:
        Django Session Authentication

    Deployment:
        Single VPS

---

# 106. Development Principles

The development team and AI coding agent must follow these principles:

1. Do not invent business rules.
2. Do not silently change requirements.
3. Do not replicate Excel sheet structure directly.
4. Do not put critical business logic only in the frontend.
5. Do not trust frontend authorization.
6. Do not allow branch users to access other branches.
7. Do not allow central users to edit operational data.
8. Do not allow operational data deletion.
9. Do not make calculated fields manually editable.
10. Use database constraints to prevent duplicates.
11. Use transactions for multi-record operations.
12. Keep business logic testable.
13. Keep documentation synchronized with implementation.
14. Prefer simple solutions over unnecessary abstractions.
15. Do not introduce additional infrastructure without a clear requirement.

---

# 107. AI Coding Rules

Before implementing any feature, the AI coding agent must:

1. Read `AI.md`.
2. Read the relevant BRD section.
3. Read the relevant SDD section.
4. Read `ERD.md` when database-related.
5. Check `open-business-decisions.md`.
6. Inspect existing code before modifying it.
7. Implement the smallest coherent change.
8. Run relevant tests.
9. Report changed files.
10. Report tests performed.

---

# 108. AI Must Not

The AI coding agent must not:

- create unrequested features;
- invent business rules;
- bypass authorization;
- add delete functionality;
- allow central users to edit branch data;
- duplicate calculation logic across frontend and backend;
- create a second database model for the same business entity;
- use school names as foreign keys;
- silently resolve ambiguous requirements.

---

# 109. Requirement Conflict Handling

If the AI finds a conflict:

    BRD
      vs
    SDD
      vs
    Excel

Priority:

    BRD / approved business decision
        >
    SDD
        >
    Excel reference
        >
    AI assumption

If the conflict changes business behavior, implementation must stop and request clarification.

---

# 110. Feature Development Workflow

Each feature should follow:

    Requirement
       ↓
    Design
       ↓
    Implementation
       ↓
    Unit Test
       ↓
    Integration Test
       ↓
    Manual Verification
       ↓
    Documentation Update

---

# 111. Implementation Order

Recommended implementation order:

## Phase 1 — Project Foundation

- Django project
- PostgreSQL
- Docker
- Environment configuration
- Custom User
- Base templates
- Tailwind
- HTMX

---

## Phase 2 — Authentication and Authorization

- Login
- Logout
- User roles
- Branch association
- Permission helpers
- Branch data isolation

---

## Phase 3 — Master Data

- Branch
- School
- Budget Year

---

## Phase 4 — RKAS

- RKAS
- RKAS revisions
- Current RKAS calculation
- Validation
- Tests

---

## Phase 5 — Monthly Realization

- Monthly input
- Editing
- Variance
- Percentage
- Completeness
- Tests

---

## Phase 6 — Semester Realization

- Semester input
- RKAS reference
- Calculations
- Tests

---

## Phase 7 — BOS

- BOS input
- Balance calculation
- Tests

---

## Phase 8 — Receivable

- Receivable input
- Balance calculation
- Tests

---

## Phase 9 — Reconciliation

- Reconciliation input
- Difference calculation
- Status logic after business decision
- Tests

---

## Phase 10 — Findings

- Findings
- Follow-up
- Status
- Deadline
- Tests

---

## Phase 11 — Dashboard

- Branch dashboard
- Central dashboard
- School monitoring
- Completeness
- Filters
- Aggregation

---

## Phase 12 — Security and Hardening

- Authorization review
- CSRF
- HTTPS
- Secure cookies
- Security headers
- Error handling
- Logging

---

## Phase 13 — Deployment

- Docker production configuration
- Nginx
- Gunicorn
- PostgreSQL
- Domain
- HTTPS
- Backup
- Monitoring

---

# 112. Definition of Done

A feature is considered complete when:

- business requirement is understood;
- implementation matches SDD;
- database migration exists if required;
- validation exists;
- authorization exists;
- tests exist;
- UI works;
- error states work;
- no unauthorized access is possible;
- documentation is updated.

---

# 113. MVP Definition of Done

The MVP is complete when:

    User
       ↓
    Login
       ↓
    Role recognized
       ↓
    Branch sees own schools
       ↓
    Branch enters data
       ↓
    Data is validated
       ↓
    Data is stored
       ↓
    Calculations are automatic
       ↓
    Branch can edit
       ↓
    Branch cannot delete
       ↓
    Central sees all branches
       ↓
    Central is read-only
       ↓
    Dashboard aggregates data
       ↓
    Last updated information is available

All primary modules are available:

    Master School
    RKAS
    Monthly Realization
    Semester Realization
    BOS
    Receivable
    Reconciliation
    Findings
    Dashboard

---

# 114. Deployment Architecture Summary

Production:

    +------------------------------------------------+
    |                    VPS                         |
    |                                                |
    |  +------------------------------------------+  |
    |  | Nginx                                    |  |
    |  | HTTPS / Reverse Proxy / Static Files    |  |
    |  +----------------------+-------------------+  |
    |                         |                      |
    |                         v                      |
    |  +------------------------------------------+  |
    |  | Django + Gunicorn                       |  |
    |  |                                          |  |
    |  | Templates + HTMX + Business Logic       |  |
    |  +----------------------+-------------------+  |
    |                         |                      |
    |                         v                      |
    |  +------------------------------------------+  |
    |  | PostgreSQL                              |  |
    |  +------------------------------------------+  |
    |                                                |
    +------------------------------------------------+

The frontend and backend are not separately deployed.

---

# 115. Future Architecture Evolution

If future requirements require:

- native mobile application;
- third-party integration;
- public API;
- highly interactive SPA;
- external reporting;
- advanced analytics;

the backend can expose a REST API without replacing the core domain model.

Potential future architecture:

    React / Mobile / External Clients
                |
                v
            REST API
                |
                v
             Django
                |
                v
           PostgreSQL

This is not required for MVP.

---

# 116. Final Architecture Principle

The MVP should remain intentionally simple.

The target architecture is:

    One Repository
          |
          v
    One Django Application
          |
          +---- Templates
          +---- HTMX
          +---- Tailwind
          |
          v
    One PostgreSQL Database
          |
          v
    One VPS Deployment

The system should only introduce additional services when an actual requirement justifies them.

---

# 117. Document Status

Status:

    DRAFT

This SDD becomes implementation-ready after:

1. Open Business Decisions are resolved where required for implementation.
2. Database schema is reviewed against the ERD.
3. UI requirements are confirmed against the business workflow.
4. Deployment environment is selected.

Until then, developers and AI coding agents must treat unresolved business decisions as unresolved rather than inventing behavior.