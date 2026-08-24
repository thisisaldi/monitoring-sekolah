# School Financial Monitoring System

Web application for collecting and monitoring financial data from schools through branch representatives.

## Purpose

The system replaces spreadsheet-based data collection and monitoring with a centralized web application.

## Users

### Branch

Branches enter and update data for schools under their responsibility.

### Central

Central users monitor all branch and school data.

## Main Modules

- Master Sekolah
- RKAS
- Realisasi Bulanan
- Realisasi Semester
- BOS
- Piutang
- Rekonsiliasi
- Temuan & Tindak Lanjut
- Dashboard

Only the project foundation (Phase 0/1 of `docs/implementation/IMPLEMENTATION-PLAN.md`) is implemented so far. None of the modules above exist yet.

## Technology Stack

- **Backend:** Django 5.2
- **Database:** PostgreSQL 16
- **Frontend:** Django Templates
- **Interactive UI:** HTMX
- **CSS:** Tailwind CSS 4 (standalone CLI, no Node.js required)
- **Application server:** Gunicorn (production)
- **Reverse proxy:** Nginx (production, not part of the MVP dev stack)
- **Containerization:** Docker / Docker Compose

## Development Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose plugin)

No local Python or Node installation is required — everything runs in containers.

## Environment Setup

Copy the example environment file and adjust values if needed:

```bash
cp .env.example .env
```

`.env` is git-ignored and must never contain real production secrets.

## Running the Application

```bash
docker compose up --build
```

This starts two services:

- `db` — PostgreSQL 16, with a persistent volume
- `web` — Django dev server on port 8000 (migrations run automatically on start)

Then visit:

- http://localhost:8000/ — home page
- http://localhost:8000/health/ — health check (`{"status": "ok"}`)

## Running Tests

```bash
docker compose exec web python manage.py test tests
```

## Static Files

```bash
docker compose exec web python manage.py collectstatic --noinput
```

## Tailwind CSS

Tailwind is compiled with the standalone CLI (no Node.js/npm dependency). The
source file is `tailwind/input.css`; the Docker build compiles it to
`static/css/output.css` automatically.

To rebuild CSS manually during local development (e.g. after adding new
utility classes to templates), download the CLI for your platform from the
[Tailwind releases page](https://github.com/tailwindlabs/tailwindcss/releases)
and run:

```bash
tailwindcss -i ./tailwind/input.css -o ./static/css/output.css --minify
```

Then rebuild the `web` image (`docker compose up --build`) so the container
picks up the new file, or copy the output into the running container.

## Deployment

Production deployment target is Vercel (free tier) with a Neon PostgreSQL
database. See [`docs/deployment/DEPLOYMENT.md`](docs/deployment/DEPLOYMENT.md)
for the full setup, environment variables, migration procedure, and
free-tier limitations. Local Docker development (above) is unaffected.

## Documentation

### Requirements

- `docs/requirements/BRD.md`
- `docs/requirements/open-business-decisions.md`

### Design

- `docs/design/ERD.md`
- `docs/design/SDD.md`
- `docs/design/DATABASE-SCHEMA.md`

### Implementation

- `docs/implementation/IMPLEMENTATION-PLAN.md`

### Reference

- `docs/reference/`

### AI Development Rules

- `AI.md`

## Development Status

Phase 0 (Project Preparation) and Phase 1 (Project Foundation) complete.
Authentication, RBAC, and business modules are not yet implemented.
