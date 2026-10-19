import { db } from "./setup";
import * as s from "@/db/schema";
import type { SessionUser } from "@/lib/auth/authz";

let seq = 0;
const next = () => ++seq;

export async function branch(overrides: Partial<typeof s.branches.$inferInsert> = {}) {
  const n = next();
  const [row] = await db.insert(s.branches).values({ code: `BR${n}`, name: `Cabang ${n}`, ...overrides }).returning();
  return row;
}

export async function school(branchId: number, overrides: Partial<typeof s.schools.$inferInsert> = {}) {
  const n = next();
  const [row] = await db
    .insert(s.schools)
    .values({ branchId, code: `SCH${n}`, name: `Sekolah ${n}`, ...overrides })
    .returning();
  return row;
}

export async function budgetYear(overrides: Partial<typeof s.budgetYears.$inferInsert> = {}) {
  const n = next();
  const [row] = await db
    .insert(s.budgetYears)
    .values({ name: `TA ${2020 + n}`, startDate: `${2020 + n}-07-01`, endDate: `${2021 + n}-06-30`, ...overrides })
    .returning();
  return row;
}

export async function user(
  role: "ADMIN" | "CENTRAL" | "BRANCH",
  overrides: Partial<typeof s.users.$inferInsert> = {},
): Promise<SessionUser> {
  const n = next();
  const [row] = await db
    .insert(s.users)
    .values({ name: `User ${n}`, username: `user${n}`, password: "!", role, ...overrides })
    .returning();
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    role: row.role,
    branchId: row.branchId,
    branchName: null,
  };
}

/** FormData from a plain object. */
export function form(values: Record<string, string | number>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, String(v));
  return fd;
}
