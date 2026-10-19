# AI Development Instructions

## Project

School Financial Monitoring System

This project is a web application for collecting and monitoring financial data from schools through branch representatives.

---

# 1. Source of Truth

The project has three important sources:

1. `docs/requirements/BRD.md`
2. `docs/design/SDD.md`
3. `docs/reference/`

Priority:

BRD/SDD > Reference Files > AI Assumptions

The Excel file is reference material only.

Do not treat the Excel structure as the final database architecture.

---

# 2. Core Business Principle

The core business workflow is:

Branch enters data.

System stores and calculates data.

Central office monitors data.

---

# 3. User Roles

The system has three roles: Admin, Central (Pusat) and Branch (Cabang).

## Admin

Admin can do everything Central can, plus manage users (including other
admins) and branches. Admin cannot create or edit operational data either.

## Branch

Branch users can:

- login;
- view schools belonging to their branch;
- create operational data;
- edit their operational data;
- view their data.

Branch users cannot:

- delete operational data;
- access another branch's schools;
- create schools through the normal workflow;
- modify central configuration.

## Central

Central users can:

- login;
- view all branches;
- view all schools;
- view all operational modules;
- monitor dashboards.

Central users cannot:

- create operational data;
- edit branch data;
- delete operational data.

---

# 4. Authorization

Authorization MUST be enforced on the backend.

Do not rely on frontend restrictions.

A branch user must never be able to access another branch's data by manipulating:

- URL parameters;
- request body;
- query parameters;
- school IDs;
- branch IDs.

Every protected resource must validate ownership/scope on the backend.

---

# 5. Data Deletion

Operational data must not be deletable through the normal application UI.

If data is incorrect:

Branch users should edit the existing record.

Do not solve correction by:

1. deleting the old record;
2. creating a replacement record.

---

# 6. Calculated Fields

Calculated values must not be manually editable.

Examples:

- RKAS Terakhir;
- Selisih;
- Persentase Realisasi;
- Total Realisasi;
- Persentase Akhir;
- Sisa Anggaran;
- Saldo Akhir BOS;
- Piutang Akhir;
- Selisih Rekonsiliasi.

Calculation logic should be implemented in an appropriate backend/service/domain layer.

Do not rely only on frontend calculations.

---

# 7. Database Relationships

Use database IDs for relationships.

Do not use:

- school name;
- branch name;
- user name;

as foreign keys.

Example:

Use:

`school_id`

Not:

`school_name`

---

# 8. Duplicate Data

Prevent duplicate records where the business requirement defines a unique combination.

Example:

A school should not have two monthly realization records for the same:

- school;
- budget year;
- month.

The user should edit the existing record instead.

---

# 9. Audit Metadata

Operational records should contain:

- created_at;
- created_by;
- updated_at;
- updated_by.

Field-level audit history is implemented: every create/update/activate/
deactivate, password change and login writes an `audit_logs` entry in the
same transaction (old and new value per changed field, never passwords).
Admin and Central can read it on the *Riwayat Aktivitas* page.

---

# 10. Business Logic

Do not invent business rules.

If a calculation, status, validation, or workflow is not defined in the BRD or SDD:

1. check `open-business-decisions.md`;
2. identify the ambiguity;
3. do not silently invent a business rule;
4. request clarification when necessary.

---

# 11. Scope Control

Do not implement features outside the approved scope.

MVP does NOT include:

- approval workflow;
- central editing;
- operational data deletion;
- automatic risk color classification;
- notifications;
- external integrations;
- AI financial analysis;

unless explicitly added to the requirements.

---

# 12. Architecture

Keep responsibilities separated:

Frontend
→ API
→ Backend / Business Logic
→ Database

Do not place critical business logic only in the frontend.

---

# 13. Code Quality

Code should be:

- modular;
- readable;
- maintainable;
- testable;
- documented where necessary.

Avoid unnecessary abstraction.

Avoid premature optimization.

Avoid introducing dependencies without a clear reason.

---

# 14. Changes to Requirements

If implementation reveals that a requirement must change:

Do not silently modify the business requirement.

Instead:

1. identify the change;
2. explain why;
3. update the relevant requirement document;
4. then implement the change.

---

# 15. Development Process

Implement the system incrementally.

Recommended order:

1. Project setup
2. Database foundation
3. Authentication
4. RBAC
5. Branch and school structure
6. Master school
7. RKAS
8. Realisasi Bulanan
9. Realisasi Semester
10. BOS
11. Piutang
12. Rekonsiliasi
13. Temuan & Tindak Lanjut
14. Branch dashboard
15. Central dashboard
16. Testing
17. Security review
18. Deployment

Do not implement the entire application in one step.

---

# 16. Before Coding

Before implementing a feature:

1. Read the relevant BRD section.
2. Read the relevant SDD section.
3. Check open business decisions.
4. Understand existing architecture.
5. Inspect existing code.
6. Implement the smallest coherent change.
7. Test the change.
8. Report what was changed.

---

# 17. Never Assume

If there are multiple technically valid approaches, choose the simplest approach consistent with the SDD.

If the choice affects business behavior, stop and ask for clarification.

---

# 18. Documentation

When architecture or business behavior changes, update the appropriate documentation.

Documentation must remain synchronized with the implementation.