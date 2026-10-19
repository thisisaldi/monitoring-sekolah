/**
 * Tests run against PGlite (real Postgres compiled to WASM, in-process), with
 * the same migrations as production. Each test file gets a fresh database.
 */
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeEach, vi } from "vitest";

import * as schema from "@/db/schema";

const client = new PGlite();
const db = drizzle(client, { schema });
await migrate(db, { migrationsFolder: "./drizzle" });

const TABLES = [
  "findings", "reconciliations", "receivables", "bos_records", "semester_realizations",
  "monthly_realizations", "rkas_revisions", "rkas", "app_sessions", "users", "schools",
  "budget_years", "branches",
];
beforeEach(async () => {
  await client.exec(`TRUNCATE ${TABLES.join(", ")} RESTART IDENTITY CASCADE`);
});

vi.mock("@/db", () => ({ db }));

// next/navigation interrupts throw; make them recognizable in assertions.
vi.mock("next/navigation", () => ({
  forbidden: () => {
    throw new Error("FORBIDDEN");
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined),
    set: (name: string, value: string) => void cookieJar.set(name, value),
    delete: (name: string) => void cookieJar.delete(name),
  }),
}));

export { db, cookieJar };
