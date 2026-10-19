# Monitoring Keuangan Sekolah

Financial monitoring for schools under Yayasan Hang Tuah. Branch units
(Cabang, Perwakilan, Pengurus Pusat) enter RKAS, realizations, BOS,
receivables, reconciliations and findings for their schools; the central
office monitors everything read-only.

- Requirements: [docs/requirements/BRD.md](docs/requirements/BRD.md)
- Design: [docs/design/SDD.md](docs/design/SDD.md)
- Deployment: [docs/deployment/DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md)
- Rules for AI-assisted work: [AI.md](AI.md)

## Stack

Next.js (App Router, Server Actions), TypeScript, PostgreSQL via Drizzle
ORM, Tailwind CSS v4 + shadcn/ui, Vitest + PGlite.

## Getting started

Requires Node.js 20.9+.

```bash
npm install
npx pglite-server --db=./.pglite --port=5433 --max-connections=10   # local Postgres, separate terminal
cp .env.example .env.local                                          # then check the values
npm run db:migrate
node scripts/import-schools.ts docs/reference/branches_schools.csv
node scripts/create-admin.ts admin "Administrator Pusat" '<password>'
node scripts/seed-dev.ts      # optional demo data: TA 2026/2027 + login jakarta / Cabang#2026
npm run dev
```

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm test` | Service and calculation tests (PGlite, no database setup needed) |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run db:generate -- --name <change>` | New migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |

## Roles

| Role | Can |
|---|---|
| BRANCH (Cabang) | Enter and edit operational data for its own schools only |
| CENTRAL (Pusat) | Read everything; manage schools and budget years; see the activity history; never edits operational data |
| ADMIN | Everything CENTRAL can, plus manage users (including other admins) and branches. The first admin comes from `scripts/create-admin.ts` |

Every change and every login is written to the activity history (`audit_logs`,
page *Riwayat Aktivitas*) with the old and new value of each changed field.
Password values are never recorded.
