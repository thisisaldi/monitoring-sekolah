/**
 * Local development only: an active budget year and one BRANCH login
 * (jakarta / Cabang#2026) for Cabang Jakarta. Run after import-schools.
 */
import { eq } from "drizzle-orm";
import nextEnv from "@next/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { hashPassword } from "../src/lib/auth/password.ts";
import { branches, budgetYears, users } from "../src/db/schema.ts";

nextEnv.loadEnvConfig(process.cwd()); // reads .env.local / .env like Next.js

const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
const db = drizzle(client);

await db
  .insert(budgetYears)
  .values({ name: "TA 2026/2027", startDate: "2026-07-01", endDate: "2027-06-30" })
  .onConflictDoNothing();
const [jakarta] = await db.select({ id: branches.id }).from(branches).where(eq(branches.code, "CAB-JAKARTA"));
await db
  .insert(users)
  .values({ username: "jakarta", name: "Operator Cabang Jakarta", password: await hashPassword("Cabang#2026"), role: "BRANCH", branchId: jakarta.id })
  .onConflictDoNothing();
console.log("Dev seed done: login jakarta / Cabang#2026");
await client.end();
