# Implementation Plan

# School Financial Monitoring System

Version: 0.1
Status: Development Roadmap

---

# 1. Purpose

This document defines the implementation sequence for the School Financial Monitoring System.

It translates the approved design documents into an incremental development plan.

The implementation must proceed phase by phase.

The AI coding agent must not implement the entire application in one step.

Each phase must be:

1. implemented;
2. tested;
3. reviewed;
4. documented;
5. considered stable;

before moving to the next dependent phase.

---

# 2. Source of Truth

The implementation must follow the following document hierarchy:

    docs/requirements/BRD.md
            ↓
    docs/requirements/open-business-decisions.md
            ↓
    docs/design/ERD.md
            ↓
    docs/design/SDD.md
            ↓
    docs/design/DATABASE-SCHEMA.md
            ↓
    docs/implementation/IMPLEMENTATION-PLAN.md
            ↓
    Source Code

If source code conflicts with the approved design documents, the implementation must be reviewed.

The AI must not silently change the architecture.

---

# 3. Implementation Principles

The project follows these principles:

1. Build incrementally.
2. Keep each phase independently testable.
3. Do not implement unresolved business rules.
4. Do not create unnecessary infrastructure.
5. Do not create features outside the MVP.
6. Keep authorization on the backend.
7. Keep business calculations centralized.
8. Use database constraints for data integrity.
9. Preserve historical operational data.
10. Prefer simple solutions.
11. Keep the code understandable for future developers.
12. Update documentation when implementation decisions change.

---

# 4. Development Phases

The implementation consists of the following phases:

    Phase 0
    Project Preparation

    Phase 1
    Project Foundation

    Phase 2
    Authentication and RBAC

    Phase 3
    Master Data

    Phase 4
    RKAS

    Phase 5
    Monthly Realization

    Phase 6
    Semester Realization

    Phase 7
    BOS

    Phase 8
    Receivables

    Phase 9
    Reconciliation

    Phase 10
    Findings

    Phase 11
    Dashboard and Monitoring

    Phase 12
    UI/UX Refinement

    Phase 13
    Security and Hardening

    Phase 14
    Testing and QA

    Phase 15
    Production Deployment

---

# 5. Phase 0 — Project Preparation

## Objective

Prepare the development environment and repository before application implementation.

## Tasks

- Verify repository structure.
- Verify documentation files.
- Verify Python version.
- Verify Docker installation.
- Verify Docker Compose.
- Verify Git.
- Verify PostgreSQL compatibility.
- Create `.env.example`.
- Create `.gitignore`.
- Confirm project name.
- Confirm application architecture.

## Required Documentation

Must exist:

    docs/requirements/BRD.md

    docs/requirements/open-business-decisions.md

    docs/design/ERD.md

    docs/design/SDD.md

    docs/design/DATABASE-SCHEMA.md

    docs/implementation/IMPLEMENTATION-PLAN.md

    AI.md

    README.md

## Exit Criteria

Phase 0 is complete when:

- repository is clean;
- documentation exists;
- environment requirements are documented;
- no production credentials are committed;
- project structure is ready for implementation.

---

# 6. Phase 1 — Project Foundation

## Objective

Create the Django application foundation and infrastructure.

## Technology

    Django
    PostgreSQL
    Docker
    Docker Compose
    Gunicorn
    Nginx
    HTMX
    Tailwind CSS

## Tasks

### 1. Django Project

Create:

    config/

    manage.py

Configure:

- settings;
- URLs;
- WSGI;
- ASGI.

---

### 2. Settings Structure

Use environment-based settings.

Recommended:

    config/settings/
        base.py
        development.py
        production.py

The exact structure may be simplified if unnecessary, but environment separation must remain possible.

---

### 3. Environment Configuration

Create:

    .env.example

Variables should include at minimum:

    DEBUG
    SECRET_KEY
    DATABASE_URL
    POSTGRES_DB
    POSTGRES_USER
    POSTGRES_PASSWORD
    ALLOWED_HOSTS

Never commit real credentials.

---

### 4. PostgreSQL

Create Docker PostgreSQL service.

Verify:

- connection;
- migrations;
- persistent volume.

---

### 5. Docker

Create:

    Dockerfile

    docker-compose.yml

The development environment should be reproducible.

---

### 6. Base Templates

Create:

    templates/base/

    templates/components/

At minimum:

    base.html

    navbar.html

    sidebar.html

    alerts.html

---

### 7. Tailwind

Set up Tailwind CSS.

The exact build mechanism may be selected based on the project environment.

Do not introduce unnecessary frontend build infrastructure.

---

### 8. HTMX

Add HTMX to the application.

Verify that a simple HTMX request can return a partial template.

---

### 9. Static Files

Configure:

    static/

Verify:

    collectstatic

works.

---

### 10. Health Check

Create:

    /health/

Expected:

    HTTP 200

---

## Tests

Verify:

- Django starts;
- PostgreSQL connects;
- migrations work;
- static files work;
- health endpoint works;
- base page renders;
- HTMX request works.

## Exit Criteria

Phase 1 is complete when:

    docker compose up

starts the system successfully and:

    /health/

returns HTTP 200.

---

# 7. Phase 2 — Authentication and RBAC

## Objective

Implement authentication and the two primary roles.

Roles:

    CENTRAL
    BRANCH

---

## Tasks

### 1. Custom User

Create the custom user model before creating production migrations.

Fields:

    id
    branch
    name
    username
    password
    role
    is_active
    created_at
    updated_at

---

### 2. Login

Create:

    /login/

Requirements:

- username;
- password;
- validation;
- error messages;
- redirect after login.

---

### 3. Logout

Create:

    /logout/

Use Django session authentication.

---

### 4. Role Handling

Implement:

    CENTRAL

    BRANCH

---

### 5. Branch Association

Branch users must have:

    branch_id

Central users must not require a branch.

---

### 6. Authorization Helpers

Create reusable authorization logic.

Examples:

    is_central(user)

    is_branch(user)

    user_can_access_school(user, school)

Do not duplicate authorization logic across every view.

---

### 7. Queryset Scoping

Branch users:

    own branch only

Central:

    all branches

---

### 8. Unauthorized Access

A branch user attempting to access another branch's school must receive:

    HTTP 403

or an appropriate safe response.

---

## Tests

Test:

- login success;
- invalid login;
- logout;
- inactive user;
- central role;
- branch role;
- branch without branch association;
- branch accessing own school;
- branch accessing another branch;
- central accessing all branches.

## Exit Criteria

Authentication and authorization are working before any financial module is implemented.

---

# 8. Phase 3 — Master Data

## Objective

Implement the foundational entities:

- Branch
- School
- Budget Year

---

# 9. Branch Implementation

## Features

Central/Admin:

- list branches;
- create branch;
- edit branch;
- activate/deactivate branch.

Branch users:

- view own branch information where needed.

---

## Validation

- code required;
- code unique;
- name required.

---

# 10. School Implementation

## Features

Central/Admin:

- list schools;
- create school;
- edit school;
- assign school to branch;
- deactivate school.

Branch:

- view assigned schools;
- cannot create school;
- cannot delete school.

---

## School Fields

Implement according to:

    DATABASE-SCHEMA.md

---

## Authorization

Every school access must verify branch ownership.

---

# 11. Budget Year Implementation

Features:

- list budget years;
- create budget year;
- edit budget year;
- activate/deactivate budget year.

Validation:

    start_date < end_date

Name must be unique.

---

## Tests

Test:

- branch CRUD;
- school CRUD;
- branch-school relationship;
- budget year;
- duplicate codes;
- inactive school;
- branch isolation.

## Exit Criteria

The system can correctly represent:

    Central
       ↓
    Branch
       ↓
    School
       ↓
    Budget Year

---

# 12. Phase 4 — RKAS

## Objective

Implement RKAS and its revisions.

---

## Features

Branch:

- view RKAS;
- create RKAS;
- edit RKAS;
- add revision;
- view revision history.

Central:

- view RKAS;
- read-only.

---

## RKAS Rules

One RKAS per:

    School + Budget Year

Unique constraint:

    school_id + budget_year_id

---

## Revision Rules

Multiple revisions are allowed.

Each revision requires:

- revision number;
- amount;
- date;
- description.

Revision number must be unique within an RKAS.

---

## Current RKAS

Current RKAS is:

    latest revision amount

or:

    initial amount

if no revision exists.

It must not be directly editable.

---

## Tests

Test:

- create RKAS;
- duplicate RKAS prevention;
- edit RKAS;
- create revision;
- duplicate revision prevention;
- current RKAS calculation;
- branch isolation;
- central read-only.

---

## Exit Criteria

RKAS data can be entered, edited, revised, calculated, and monitored correctly.

---

# 13. Phase 5 — Monthly Realization

## Objective

Implement monthly financial realization.

---

## Features

Branch:

- create monthly record;
- edit monthly record;
- view monthly records.

Central:

- view records;
- monitor completeness.

---

## Period

12 months:

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

## Uniqueness

One record per:

    School
    +
    Budget Year
    +
    Month

---

## Calculations

Variance:

    budget_amount - realization_amount

Percentage:

    realization_amount / budget_amount * 100

If budget amount is zero:

    percentage = NULL

---

## Completeness

For each school and budget year:

    expected = 12

    actual = existing records

Example:

    10 / 12

Missing months must be identifiable.

---

## Tests

Test:

- create;
- update;
- duplicate month;
- invalid month;
- zero budget;
- variance;
- percentage;
- missing months;
- branch isolation;
- central read-only.

---

## Exit Criteria

Monthly reporting works and completeness can be monitored.

---

# 14. Phase 6 — Semester Realization

## Objective

Implement semester realization.

---

## Features

Branch:

- create;
- edit;
- view.

Central:

- read-only monitoring.

---

## Period

    Semester 1
    Semester 2

---

## Uniqueness

    School
    +
    Budget Year
    +
    Semester

---

## Calculations

Total:

    semester_1 + semester_2

Final percentage:

    total_realization / current_rkas * 100

Remaining:

    current_rkas - total_realization

If current RKAS is zero:

    percentage = NULL

---

## Tests

Test:

- semester 1;
- semester 2;
- duplicate semester;
- calculations;
- missing semester;
- branch authorization.

---

# 15. Phase 7 — BOS

## Objective

Implement annual BOS monitoring.

---

## Period

    School + Budget Year

One record per school per budget year.

---

## Input

- opening balance;
- receipt amount;
- usage amount;
- RKAS compliance;
- report status;
- notes.

---

## Calculation

    ending_balance =
        opening_balance
        + receipt_amount
        - usage_amount

Ending balance is read-only.

---

## Tests

Test:

- create;
- update;
- duplicate BOS;
- calculation;
- invalid negative values;
- branch authorization;
- central read-only.

---

# 16. Phase 8 — Receivables

## Objective

Implement annual receivable monitoring.

---

## Period

    School + Budget Year

---

## Input

- opening balance;
- addition amount;
- settlement amount;
- dominant age;
- follow-up.

---

## Calculation

    ending_balance =
        opening_balance
        + addition_amount
        - settlement_amount

---

## Pending Rule

Do NOT implement an invented overdue percentage formula.

The following remains pending:

    OBD-005

The UI should not present a misleading calculated percentage.

---

## Tests

Test:

- create;
- update;
- duplicate;
- ending balance;
- invalid values;
- authorization.

---

# 17. Phase 9 — Reconciliation

## Objective

Implement annual reconciliation monitoring.

---

## Period

    School + Budget Year

---

## Input

- financial statement balance;
- bank balance;
- RKAS compliance;
- notes;
- follow-up.

---

## Calculation

    difference =
        bank_balance
        - financial_statement_balance

---

## Status

    difference = 0
        → SESUAI

    difference != 0
        → TIDAK SESUAI

No tolerance threshold.

---

## Tests

Test:

- create;
- update;
- duplicate;
- zero difference;
- non-zero difference;
- authorization;
- central read-only.

---

# 18. Phase 10 — Findings

## Objective

Implement findings and follow-up monitoring.

---

## Features

Branch:

- create finding;
- edit finding;
- update status;
- complete finding.

Central:

- read-only monitoring.

---

## Status

    OPEN
    ON_PROGRESS
    COMPLETED

---

## Completion Rule

If:

    status = COMPLETED

then:

    completed_date required

If:

    status != COMPLETED

then:

    completed_date should be empty

---

## Tests

Test:

- create finding;
- update finding;
- status transitions;
- completed date validation;
- deadline;
- authorization;
- central read-only.

---

# 19. Phase 11 — Dashboard and Monitoring

## Objective

Build monitoring views after operational modules are stable.

Do not build the dashboard before the underlying data modules are functional.

---

# 20. Central Dashboard

Display:

- total branches;
- total schools;
- completeness;
- monthly reporting status;
- reconciliation issues;
- open findings;
- recent updates.

---

## Filters

Support:

    Budget Year
    Branch
    School

---

# 21. Branch Dashboard

Branch dashboard is scoped to:

    request.user.branch

Display:

- total schools;
- incomplete reports;
- completed reports;
- recent updates;
- findings.

---

# 22. School Monitoring

Create school-level monitoring view.

Example:

    School A

    RKAS
        Complete

    Monthly Realization
        10 / 12

    Semester
        2 / 2

    BOS
        Complete

    Receivable
        Complete

    Reconciliation
        Complete

    Findings
        2 Open

---

# 23. Dashboard Query Requirements

Avoid N+1 queries.

Use:

- select_related;
- prefetch_related;
- annotations;
- aggregation;
- conditional aggregation.

Dashboard queries must respect role scope.

---

## Tests

Test:

- central sees all;
- branch sees own branch;
- filters;
- school completeness;
- monthly completeness;
- open findings;
- reconciliation issues.

---

# 24. Phase 12 — UI/UX Refinement

## Objective

Improve usability after all functional modules exist.

---

## Tasks

- consistent navigation;
- consistent forms;
- consistent tables;
- status badges;
- alerts;
- empty states;
- loading states;
- validation messages;
- pagination;
- responsive layout;
- accessibility improvements.

---

## Important

UI refinement must not change business behavior.

---

# 25. Form UX

Forms should clearly distinguish:

    Editable Fields

from:

    Calculated / Read-only Fields

Example:

    Budget
        [ Rp 100.000.000 ]

    Realization
        [ Rp 75.000.000 ]

    Variance
        [ Rp 25.000.000 ]
        READ ONLY

---

# 26. Empty States

Every list page must handle empty data.

Example:

    Belum ada data realisasi untuk sekolah ini.

Do not display blank tables without explanation.

---

# 27. Error States

Handle:

- validation errors;
- unauthorized access;
- missing records;
- server errors;
- database errors.

Do not expose stack traces.

---

# 28. Phase 13 — Security and Hardening

## Objective

Review the complete system for security issues.

---

## Tasks

### Authentication

Verify:

- password hashing;
- session security;
- inactive user handling;
- logout.

### Authorization

Verify:

- branch isolation;
- central read-only;
- backend checks;
- object-level access.

### CSRF

Verify all state-changing requests.

### HTTPS

Enable production HTTPS.

### Cookies

Configure:

    Secure
    HttpOnly
    SameSite

appropriately.

### Headers

Configure:

- HSTS;
- X-Content-Type-Options;
- Referrer-Policy;
- CSP where practical.

### Secrets

Verify:

- no secrets in Git;
- no credentials in logs;
- `.env` excluded.

---

# 29. Security Tests

Test:

- branch ID manipulation;
- school ID manipulation;
- unauthorized URLs;
- unauthorized POST;
- unauthorized HTMX requests;
- inactive accounts;
- CSRF;
- session handling.

---

# 30. Phase 14 — Testing and QA

## Objective

Perform final application validation.

Testing levels:

    Unit
    Integration
    Authorization
    UI
    Regression
    Deployment

---

# 31. Unit Testing

Minimum coverage:

- models;
- services;
- calculations;
- validators;
- authorization helpers.

---

# 32. Integration Testing

Test complete workflows.

Example:

    Login
      ↓
    Dashboard
      ↓
    School
      ↓
    RKAS
      ↓
    Create
      ↓
    Save
      ↓
    Edit
      ↓
    Verify calculation

Repeat for all modules.

---

# 33. Regression Testing

After each major change, verify:

- authentication;
- branch isolation;
- central read-only;
- existing financial records;
- dashboard;
- calculations.

---

# 34. QA Checklist

## Authentication

    [ ] Login works
    [ ] Logout works
    [ ] Invalid login handled
    [ ] Inactive user blocked

## Authorization

    [ ] Branch isolation works
    [ ] Central can read all
    [ ] Central cannot edit
    [ ] Branch cannot access another branch

## Master Data

    [ ] Branches work
    [ ] Schools work
    [ ] Budget years work

## RKAS

    [ ] Create
    [ ] Edit
    [ ] Revision
    [ ] Calculation

## Monthly

    [ ] Create
    [ ] Edit
    [ ] Duplicate prevention
    [ ] Completeness

## Semester

    [ ] Create
    [ ] Edit
    [ ] Duplicate prevention
    [ ] Calculation

## BOS

    [ ] Create
    [ ] Edit
    [ ] Calculation

## Receivable

    [ ] Create
    [ ] Edit
    [ ] Calculation

## Reconciliation

    [ ] Create
    [ ] Edit
    [ ] Difference
    [ ] Status

## Findings

    [ ] Create
    [ ] Edit
    [ ] Status
    [ ] Completion date

## Dashboard

    [ ] Central dashboard
    [ ] Branch dashboard
    [ ] Filters
    [ ] Completeness

---

# 35. Phase 15 — Production Deployment

## Objective

Deploy the application to a production VPS.

---

# 36. Production Infrastructure

    VPS
      |
      +-- Nginx
      |
      +-- Django / Gunicorn
      |
      +-- PostgreSQL
      |
      +-- Docker

All components may run on one VPS.

---

# 37. Production Environment

Configure:

    DEBUG=False

    SECRET_KEY=<secure-secret>

    ALLOWED_HOSTS=<domain>

    DATABASE_URL=<production-db>

Use production credentials.

Never use development credentials in production.

---

# 38. Database Migration

Before application launch:

    python manage.py migrate

Verify all migrations completed successfully.

---

# 39. Static Files

Run:

    python manage.py collectstatic --noinput

Verify static assets load correctly.

---

# 40. Gunicorn

Run Django through Gunicorn.

Nginx acts as reverse proxy.

Architecture:

    Internet
       ↓
    Nginx
       ↓
    Gunicorn
       ↓
    Django
       ↓
    PostgreSQL

---

# 41. HTTPS

Configure domain and TLS.

Verify:

    HTTP → HTTPS redirect

    HTTPS → application

---

# 42. Production Backup

Configure:

- PostgreSQL scheduled backup;
- off-server backup;
- retention;
- restore test.

---

# 43. Production Verification

After deployment:

    [ ] Domain works
    [ ] HTTPS works
    [ ] Login works
    [ ] Central user works
    [ ] Branch user works
    [ ] Branch isolation works
    [ ] Database works
    [ ] Static files work
    [ ] Dashboard works
    [ ] Forms work
    [ ] Calculations work
    [ ] Backup works
    [ ] Health check works

---

# 44. Recommended Implementation Sequence

The exact sequence is:

    Phase 0
        ↓
    Phase 1
        ↓
    Phase 2
        ↓
    Phase 3
        ↓
    Phase 4
        ↓
    Phase 5
        ↓
    Phase 6
        ↓
    Phase 7
        ↓
    Phase 8
        ↓
    Phase 9
        ↓
    Phase 10
        ↓
    Phase 11
        ↓
    Phase 12
        ↓
    Phase 13
        ↓
    Phase 14
        ↓
    Phase 15

Do not skip directly from Phase 1 to Phase 11.

---

# 45. AI Coding Agent Execution Rules

The AI coding agent must work on one phase at a time.

For each phase:

    1. Read relevant documentation.
    2. Inspect existing implementation.
    3. Identify required files.
    4. Implement only the current phase.
    5. Run tests.
    6. Fix failures.
    7. Summarize changes.
    8. Report remaining issues.
    9. Stop.

The AI must not automatically continue to the next phase.

---

# 46. AI Phase Prompt Template

Use this pattern when instructing the coding agent:

    Implement Phase X only.

    Read:
    - AI.md
    - BRD.md
    - open-business-decisions.md
    - SDD.md
    - DATABASE-SCHEMA.md
    - IMPLEMENTATION-PLAN.md

    Requirements:
    - Implement only the current phase.
    - Do not implement future phases.
    - Do not invent business rules.
    - Follow existing architecture.
    - Add tests.
    - Run relevant tests.
    - Report changed files.
    - Report test results.
    - Stop after the current phase is complete.

---

# 47. Phase Completion Record

After each phase, update this section.

## Phase 0

Status:

    NOT STARTED

Notes:

    -

---

## Phase 1

Status:

    NOT STARTED

Notes:

    -

---

## Phase 2

Status:

    NOT STARTED

Notes:

    -

---

## Phase 3

Status:

    NOT STARTED

Notes:

    -

---

## Phase 4

Status:

    NOT STARTED

Notes:

    -

---

## Phase 5

Status:

    NOT STARTED

Notes:

    -

---

## Phase 6

Status:

    NOT STARTED

Notes:

    -

---

## Phase 7

Status:

    NOT STARTED

Notes:

    -

---

## Phase 8

Status:

    NOT STARTED

Notes:

    -

---

## Phase 9

Status:

    NOT STARTED

Notes:

    -

---

## Phase 10

Status:

    NOT STARTED

Notes:

    -

---

## Phase 11

Status:

    NOT STARTED

Notes:

    -

---

## Phase 12

Status:

    NOT STARTED

Notes:

    -

---

## Phase 13

Status:

    NOT STARTED

Notes:

    -

---

## Phase 14

Status:

    NOT STARTED

Notes:

    -

---

## Phase 15

Status:

    NOT STARTED

Notes:

    -

---

# 48. MVP Completion Criteria

The MVP is considered complete when:

    Branch User
        ↓
    Login
        ↓
    Own Branch
        ↓
    Own Schools
        ↓
    Enter Data
        ↓
    Edit Data
        ↓
    Data Validated
        ↓
    Calculations Performed
        ↓
    Data Stored
        ↓
    Central User
        ↓
    View All Branches
        ↓
    Monitor Schools
        ↓
    Monitor Completeness
        ↓
    View Findings
        ↓
    View Reconciliation Issues

All required MVP modules must be functional.

---

# 49. Post-MVP Candidates

The following are intentionally excluded from MVP:

- approval workflow;
- submission workflow;
- notifications;
- email notifications;
- WhatsApp notifications;
- document uploads;
- advanced audit history;
- AI anomaly detection;
- predictive analytics;
- mobile application;
- public API;
- external integrations;
- advanced reporting exports.

These should only be implemented after the MVP is stable.

---

# 50. Final Implementation Principle

The goal is not to build the largest system.

The goal is to build the smallest system that correctly solves:

    Branch
        ↓
    Input Data
        ↓
    Central
        ↓
    Monitor Data

The implementation should therefore prioritize:

- correctness;
- security;
- data integrity;
- simplicity;
- maintainability.

Additional complexity must have a clear business or technical justification.