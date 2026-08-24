# Deployment — Vercel Free Tier

This document covers deploying the School Financial Monitoring System to
Vercel's Hobby (free) plan with a Neon PostgreSQL database. It does not
change application architecture: Django remains the full application layer
(rendering, auth, authorization, forms, HTMX, business logic, database
access). Vercel wraps the existing Django ASGI application as a single
Vercel Function; nothing is split into a separate frontend/backend.

---

## 1. Important: read before deploying

**Vercel's Hobby plan is restricted to non-commercial personal use by
Vercel's Fair Use Guidelines.** "Commercial" includes being paid (as an
employee or contractor) to build or host the project, not just charging
end users. If this application is being deployed for a real school
district/institution (i.e. someone is paid for this work, or it will be
used in an institutional/paid capacity), the Hobby plan's terms likely do
not cover that use case and a Pro team (billed) would be the compliant
choice. This is a terms-of-service/cost decision, not a technical one —
flagging it here rather than silently deploying on Hobby. The rest of this
document still describes the Hobby-tier setup, since that is what was
requested; upgrading to Pro requires no application changes, only a plan
change in the Vercel dashboard.

---

## 2. Architecture

```
Browser
   |
Vercel Edge (TLS termination, static asset CDN)
   |
Vercel Function (Django ASGI app, config/asgi.py)
   |
Neon PostgreSQL (external, managed, free tier)
```

- Vercel auto-detects the Django project from `manage.py` and reads the
  entrypoint from `WSGI_APPLICATION`/`ASGI_APPLICATION` in
  `config/settings/*.py`. This project sets both; per Vercel's own
  documentation, when both are set **Vercel uses the ASGI entrypoint**
  (`config/asgi.py`) — this is why `vercel.json` keys its function config
  on `config/asgi.py`, not `config/wsgi.py`.
- Gunicorn is **not** used in the Vercel runtime — Vercel wraps the ASGI
  callable directly as a serverless function. Gunicorn stays in
  `requirements.txt` and the `Dockerfile` purely for the existing local
  Docker deployment; it is inert on Vercel.
- Static files: because `STATIC_ROOT` is set (`config/settings/base.py`)
  and the project already uses WhiteNoise's
  `CompressedManifestStaticFilesStorage` (an explicitly supported
  backend per Vercel's Django docs), Vercel runs `collectstatic`
  automatically during the build and serves the result from its CDN — no
  build script needed. WhiteNoise's own middleware only becomes active
  again if you run `vercel dev` locally; in actual Vercel
  production/preview deployments, `/static/...` requests are served by
  the CDN before they ever reach the Django function.

---

## 3. Database: Neon PostgreSQL (free tier)

Vercel discontinued its own "Vercel Postgres" product; the first-party
Postgres integration in the Vercel dashboard today provisions a **Neon**
database. Neon's free plan (verified against Neon's current pricing page):

- 0.5 GB storage per project
- 100 compute-hours/month, autoscaling up to 2 CU (8 GB RAM)
- Compute suspends (scales to zero) after 5 minutes idle
- 5 GB included network egress
- Up to 10 branches per project
- No credit card required; the free plan is permanent, not a trial

This is realistically free for this application's expected data volume
(master data + operational financial records for a modest number of
schools). If usage ever exceeds the free tier, Neon suspends compute
until the next billing month rather than silently charging — it does not
fail over into unexpected cost.

**Setup**: In the Vercel dashboard, add the Neon integration to the
project (Storage → Create Database → Postgres, powered by Neon). Vercel
automatically injects a `DATABASE_URL` environment variable into the
project — no manual connection-string copying needed. This project's
`DATABASES` config (`config/settings/base.py`, `env.db("DATABASE_URL")`
via `django-environ`) already consumes that variable directly; Neon's
connection strings include `?sslmode=require`, which `django-environ`
forwards into the DB `OPTIONS` automatically, so no code change was
required for TLS.

**Serverless connection behavior**: Django's `CONN_MAX_AGE` defaults to
`0` (close the connection at the end of every request) and this project
does not override it. That default is intentionally kept as-is for this
deployment: a serverless function has no long-lived process to hold a
persistent connection pool across invocations the way a Docker container
does, and Neon's own free-tier compute already scales to zero — holding
long-lived connections open would fight that, not help it. If connection
volume ever becomes a real problem under load, Neon's **pooled
connection string** (using PgBouncer, offered alongside the direct
connection string in the Neon dashboard) is the documented fix — swap
`DATABASE_URL` to the pooled variant, no application code change. No
separate pooling service (e.g. Redis-based) was added; none is needed.

---

## 4. Environment variables (set in the Vercel dashboard)

| Variable | Value | Notes |
|---|---|---|
| `DJANGO_SETTINGS_MODULE` | `config.settings.production` | Required — without it, `manage.py`'s default (`config.settings.development`, `DEBUG=True`) would run in production. |
| `DATABASE_URL` | (auto-injected by the Neon integration) | Do not set manually if using the Vercel/Neon integration. |
| `SECRET_KEY` | a long random value, generated once | Never reuse the local `.env` dev value. Generate with `python -c "import secrets; print(secrets.token_urlsafe(50))"`. |
| `ALLOWED_HOSTS` | `your-project.vercel.app` (comma-separated if multiple) | Matches `env.list("ALLOWED_HOSTS", ...)` in `config/settings/base.py`. |
| `CSRF_TRUSTED_ORIGINS` | `https://your-project.vercel.app` | **New this phase** (see §7) — must include the scheme. Add every domain that will submit forms (production domain + any preview domains you rely on). |
| `SECURE_SSL_REDIRECT` | `True` (default if unset) | Already the `production.py` default; only override if Vercel's own redirect already handles this. |

None of these are committed to the repository. `.env` (local dev) and
`.env.example` (placeholders only) are unaffected by production
configuration — Vercel environment variables are managed entirely in the
Vercel dashboard or via `vercel env`.

---

## 5. Build configuration

No custom build script is required or added. Per Vercel's current Django
documentation: *"There is no need to call `collectstatic` in a build
script. Vercel runs it automatically."* Vercel detects the Django
framework from `requirements.txt` (the `Django` dependency) and needs no
`pyproject.toml`/`vercel.json` build overrides beyond the `functions`
entry already in `vercel.json` for the function's `maxDuration`.

**Important — `static/css/output.css` is a committed build artifact, not
generated by Vercel.** The local Docker build compiles
`tailwind/input.css` to `static/css/output.css` via the standalone
Tailwind CLI (see `Dockerfile`'s `tailwind-build` stage). Vercel's build
does **not** run that step — Vercel only runs Django's `collectstatic`,
which *copies* already-existing files from `STATICFILES_DIRS` into
`STATIC_ROOT`; it does not compile CSS. This means `static/css/output.css`
must exist in the repository at deploy time, current with whatever
templates/`tailwind/input.css` last changed. It is deliberately **not**
covered by `.gitignore` (only Django's own `staticfiles/` — the
`collectstatic` output directory — is ignored). Before pushing any commit
that changes `tailwind/input.css` or adds new Tailwind classes to a
template, rebuild it locally first:

```bash
docker build --target tailwind-build -t tailwind-build . && \
  CID=$(docker create tailwind-build) && \
  docker cp "$CID":/app/static/css/output.css static/css/output.css && \
  docker rm "$CID"
```

then commit the updated `static/css/output.css` alongside the template
changes in the same commit.

**Python version**: pinned via `.python-version` (`3.12`) to match the
local Docker image (`python:3.12-slim`) exactly — this happens to already
be Vercel's current default Python version too, but the file makes that
explicit rather than relying on Vercel's default staying 3.12 indefinitely.

---

## 6. Migrations

Vercel does not run `manage.py migrate` automatically as part of a
deploy, and this document deliberately does **not** wire migrations into
the request path or the build step — running migrations on every cold
start (or worse, on every request) is unsafe (races between concurrent
function instances, and a slow/blocking migration would eat into the
function's request budget instead of running once, deliberately).

**Recommended procedure**, run once per deploy that includes new
migrations, from a machine with the production `DATABASE_URL` available
(either via `vercel env pull` or by copying the value from the Neon
dashboard into a local shell session — never commit it):

```bash
vercel env pull .env.local   # never commit this file (already covered by .gitignore's `.env.*`)
DJANGO_SETTINGS_MODULE=config.settings.production \
  python manage.py migrate --settings=config.settings.production
```

Then confirm:

```bash
python manage.py showmigrations
```

and verify every app's migrations show `[X]`. Do not use `migrate --fake`
as part of routine deploys; it would only be justified in a genuine
recovery scenario, and any such use must be explicitly reported at the
time, not folded silently into a normal deploy procedure.

---

## 7. Security review for this deployment

- `DEBUG=False` — enforced by `config/settings/production.py` (was already true before this phase).
- `SECRET_KEY`, `DATABASE_URL`, `ALLOWED_HOSTS` — environment-variable driven, never hard-coded (already true before this phase).
- **`SECURE_PROXY_SSL_HEADER`** (`config/settings/production.py`) — **added this phase**. Vercel terminates TLS at its edge and forwards plain HTTP internally with `X-Forwarded-Proto: https`. Without this setting, Django cannot tell the original request was HTTPS: `SECURE_SSL_REDIRECT=True` (already the default) would redirect-loop forever, and CSRF's origin check would see a scheme mismatch. This was a real gap, not present before this phase, because the project had no reverse-proxy deployment target until now.
- **`CSRF_TRUSTED_ORIGINS`** (`config/settings/production.py`) — **added this phase**, environment-variable driven (empty by default, so it changes nothing for the existing Docker/local deployment). Must be set to the deployed `https://...vercel.app` origin(s) in the Vercel dashboard (§4).
- Session/CSRF cookies: `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, HSTS — all already enabled in `production.py`, unchanged.
- `/ui-preview/` (`apps/core/views.py`) is gated on `settings.DEBUG` and returns `404` otherwise — with `DJANGO_SETTINGS_MODULE=config.settings.production` set (`DEBUG=False`), it 404s in the deployed environment automatically. No route removal needed; verified by `tests/test_ui_components.py::UIPreviewPageTests::test_returns_404_when_debug_false`, which already covered this before this phase.
- `/admin/` remains registered (`config/urls.py`) but is standard Django admin, gated by Django's own authentication — no separate action taken here; it was already present and out of scope for this deployment-only phase to remove or reconfigure.
- No authorization logic was touched. Branch/Central scoping, `get_user_school`, `can_access_branch`, `can_modify_branch_data` are all unchanged — this phase is infrastructure only.

---

## 8. Local Docker regression

Local development is unaffected: `docker compose up` still uses
`config.settings.development` (`DEBUG=True`, no `SECURE_PROXY_SSL_HEADER`/
`CSRF_TRUSTED_ORIGINS` — those only exist in `production.py`, which the
Docker Compose environment never loads). Verified after this phase's
changes:

- `python manage.py check` — 0 issues
- `python manage.py test tests` — all tests passing
- `python manage.py makemigrations --check --dry-run` — no changes detected

See the final report for exact test counts from this phase's run.

---

## 9. Deploying

### First-time setup (manual — requires your own Vercel/GitHub accounts)

1. Push this repository to a GitHub remote (private, unless you want it public).
2. In the Vercel dashboard: **Add New Project** → import the GitHub repository.
3. Add the Neon Postgres integration (§3) — this injects `DATABASE_URL` automatically.
4. Set the remaining environment variables from §4 (`DJANGO_SETTINGS_MODULE`, `SECRET_KEY`, `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`) in Project Settings → Environment Variables.
5. Deploy. Vercel builds a **Preview** deployment automatically for the first push/PR.
6. Run the migration procedure from §6 against the new database before testing the Preview URL (an empty database will 500 on any page that queries a model).
7. Verify the Preview deployment (§10) before promoting anything to Production.
8. Only once Preview verification passes, merge/promote to Production (Vercel promotes the same immutable build — it does not rebuild).

### Every subsequent deploy

Push to the connected Git branch; Vercel builds and deploys automatically.
Run the migration procedure (§6) first for any push containing new
migrations — Vercel will not do this for you.

---

## 10. Preview deployment verification checklist

Perform all of these against the actual Preview URL before considering
Production:

- [ ] Build succeeds in the Vercel dashboard build log
- [ ] `GET /health/` → `200 {"status": "ok"}`
- [ ] `GET /login/` renders (styling loads — confirms static/CDN wiring)
- [ ] Login with a real (not demo/dev) Branch account succeeds
- [ ] Login with a real Central account succeeds
- [ ] Invalid credentials show a generic error, not a stack trace
- [ ] `/dashboard/`, `/schools/`, `/branches/`, `/budget-years/`, `/rkas/`, `/realizations/monthly/`, `/realizations/semester/`, `/bos/`, `/receivables/`, `/reconciliation/`, `/findings/` all render for both roles
- [ ] A Branch user cannot view another branch's data via a manipulated `?school=`/`?branch=` query parameter or URL id (403, not data leakage)
- [ ] A Central user cannot create/edit operational data (still read-only)
- [ ] `/ui-preview/` returns `404` (confirms `DEBUG=False` actually took effect in the deployed environment — do not skip this check)
- [ ] Logout works and redirects to `/login/`

This checklist must be run **by the person who has access to the actual
Vercel Preview URL** — Claude does not have Vercel account credentials
and cannot self-initiate a login/deploy in this environment (see the
final report's "remaining concerns").

---

## 11. Known free-tier limitations (verified against current Vercel docs, not assumed)

| Limit | Hobby value | Relevance here |
|---|---|---|
| Function max duration | 300s default **and** maximum (no way to raise it on Hobby) | `vercel.json` sets `maxDuration: 30` deliberately lower — this app has no long-running requests; a request stuck past 30s indicates a bug, not legitimate work, and failing faster is preferable to waiting out Hobby's full 300s ceiling. |
| Function memory | 2 GB / 1 vCPU (fixed on Hobby, not configurable) | Comfortably above what a Django request needs. |
| Function bundle size | 500 MB uncompressed for Python | This project's dependency set (Django, psycopg[binary], django-environ, gunicorn, whitenoise) is far below this. |
| Request/response body size | 4.5 MB | No current feature uploads/returns payloads near this size. |
| Cold starts | Not eliminated on Hobby (Fluid compute reduces but does not remove them) | The first request after idle time will be slower; subsequent requests reuse a warm instance. Not something to "fix" — inherent to serverless on the free tier. |
| Concurrency | Auto-scales up to 30,000 (Hobby) | Not a practical constraint for this application's expected usage. |
| Neon compute | Scales to zero after 5 minutes idle | The *database's* first query after idle time will also be slower (cold Postgres connection) — compounds with function cold starts on a truly idle deployment. |
| Vercel Hobby usage policy | Non-commercial personal use only (§1) | Not a technical limit — a terms-of-service constraint worth resolving before real institutional use. |

---

## 12. Rollback

Vercel deployments are immutable — every deploy gets its own URL, and
"Promote to Production" simply repoints the production alias at a
previously built deployment. To roll back: in the Vercel dashboard,
Deployments → select a prior successful deployment → **Promote to
Production**. No rebuild, no code change required. If the rollback
target predates a migration that has already been applied to the shared
Neon database, review whether that migration is backward-compatible
before rolling back the application code — Vercel rolling back the app
does not roll back the database.

---

## 13. What this phase did not do

Per its own scope: no models, migrations, business rules, OBD decisions,
financial formulas, authorization, RBAC, dashboard calculations, or UI
design were changed. No Redis, Celery, background workers, or additional
services were introduced. No paid infrastructure was configured. Actual
`vercel deploy`/GitHub-remote-creation execution was not performed by
this session — see the final report.
