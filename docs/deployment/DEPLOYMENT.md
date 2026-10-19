# Deployment: Vercel + Supabase

The application is a single Next.js app (see docs/design/SDD.md section 4)
deployed to Vercel, with a Supabase PostgreSQL database.

---

## 1. Read before deploying

**Vercel's Hobby plan is restricted to non-commercial personal use.**
"Commercial" includes being paid to build or host the project. If this is
deployed for Yayasan Hang Tuah as paid or institutional work, use a Vercel
Pro team. No code changes are needed to switch plans.

---

## 2. Architecture

```
Browser
   |
Vercel (TLS, CDN for static assets, Next.js server functions)
   |
Supabase PostgreSQL (Supavisor pooler, transaction mode)
```

---

## 3. Database (Supabase)

1. Create a Supabase project. Region: **Southeast Asia (Singapore)**.
2. From Project Settings > Database, copy two connection strings:
   - **Transaction pooler** (port 6543): used by the running app.
   - **Direct connection** (port 5432): used for migrations and imports.
3. The app connects with `prepare: false` (src/db/index.ts), which the
   transaction pooler requires.

Only the database is used. Supabase Auth, Storage and its REST API are not
used; the app handles login itself.

---

## 4. First-time setup (from a developer machine)

Run against the **direct** connection string:

```bash
export DATABASE_URL="postgresql://postgres.<ref>:<password>@<host>:5432/postgres"

npm run db:migrate                                              # apply drizzle/ migrations
node scripts/import-schools.ts docs/reference/branches_schools.csv  # branches + schools
node scripts/create-admin.ts admin "Administrator Pusat" '<strong password>'
```

Then sign in as the administrator, create budget years under
Master Data > Tahun Anggaran, and create one BRANCH user per Cabang /
Perwakilan / PP under Administrasi > Pengguna.

`import-schools` is idempotent: re-running it updates names and student
counts by code instead of creating duplicates.

---

## 5. Vercel project

1. Import the Git repository in Vercel. Framework preset: Next.js. Root
   directory: repository root. No `vercel.json` is needed.
2. Environment variables (Production and Preview):

| Name | Value |
|---|---|
| `DATABASE_URL` | Supabase **transaction pooler** string (port 6543) |

3. Deploy. `GET /health` returns `{"status":"ok"}`.

---

## 6. Schema changes

1. Edit `src/db/schema.ts`.
2. `npm run db:generate -- --name <change>` to create a migration in `drizzle/`.
3. Commit the migration with the code.
4. Before (or right after) deploying, run `npm run db:migrate` with the
   direct connection string.

---

## 7. Local development

No Docker needed. PGlite serves a local PostgreSQL over the normal protocol:

```bash
npx pglite-server --db=./.pglite --port=5433 --max-connections=10   # terminal 1
```

`.env.local`:

```
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5433/postgres
DB_POOL_MAX=1
```

```bash
npm run db:migrate
node scripts/import-schools.ts docs/reference/branches_schools.csv
node scripts/create-admin.ts admin "Administrator Pusat" '<password>'
node scripts/seed-dev.ts          # optional: TA 2026/2027 + login jakarta / Cabang#2026
npm run dev
```

`DB_POOL_MAX=1` is only for the local PGlite server, which cannot
interleave concurrent connections. Leave it unset in production.

---

## 8. Backups

Supabase takes daily backups on paid plans. On the free plan, schedule a
`pg_dump` of the direct connection string (for example weekly) and keep
copies outside Supabase. Test a restore at least once.
