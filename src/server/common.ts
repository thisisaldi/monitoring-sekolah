import "server-only";
import { and, asc, desc, eq, type SQL } from "drizzle-orm";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { budgetYears, schools } from "@/db/schema";
import { scopeBranchId, type SessionUser } from "@/lib/auth/authz";
import { PAGE_SIZE } from "@/lib/forms";

/** Active schools a BRANCH user may enter data for. Empty for CENTRAL. */
export async function userSchools(user: SessionUser) {
  if (user.role !== "BRANCH" || user.branchId === null) return [];
  return db
    .select({ id: schools.id, name: schools.name })
    .from(schools)
    .where(and(eq(schools.branchId, user.branchId), eq(schools.isActive, true)))
    .orderBy(asc(schools.name));
}

/** Active budget years, newest first: the only valid choices for new records. */
export function activeBudgetYears() {
  return db
    .select({ id: budgetYears.id, name: budgetYears.name })
    .from(budgetYears)
    .where(eq(budgetYears.isActive, true))
    .orderBy(desc(budgetYears.startDate));
}

export function allBudgetYears() {
  return db
    .select({ id: budgetYears.id, name: budgetYears.name, isActive: budgetYears.isActive })
    .from(budgetYears)
    .orderBy(desc(budgetYears.startDate));
}

/** Validates a submitted school/budget year against the user's allowed choices. */
export async function checkChoices(user: SessionUser, schoolId: number, budgetYearId?: number) {
  const errors: Record<string, string[]> = {};
  if (!(await userSchools(user)).some((s) => s.id === schoolId)) {
    errors.schoolId = ["Pilih sekolah yang valid."];
  }
  if (budgetYearId !== undefined && !(await activeBudgetYears()).some((b) => b.id === budgetYearId)) {
    errors.budgetYearId = ["Pilih tahun anggaran yang valid."];
  }
  return Object.keys(errors).length ? errors : null;
}

/** where-clause limiting rows to the user's branch (no-op for CENTRAL). */
export function branchScope(user: SessionUser): SQL | undefined {
  const branchId = scopeBranchId(user);
  return branchId === null ? undefined : eq(schools.branchId, branchId);
}

export async function paginate<T>(
  page: number,
  countQuery: Promise<{ value: number }[]>,
  rows: (limit: number, offset: number) => Promise<T[]>,
) {
  const [{ value: total }] = await countQuery;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, pages);
  return { rows: await rows(PAGE_SIZE, (current - 1) * PAGE_SIZE), total, page: current, pages };
}
export type Paged<T> = Awaited<ReturnType<typeof paginate<T>>>;

export function orNotFound<T>(row: T | undefined): T {
  if (row === undefined) notFound();
  return row;
}

/** One-shot message shown as a toast on the next page (Django's messages framework). */
export async function flash(message: string) {
  (await cookies()).set("flash", encodeURIComponent(message), { path: "/", maxAge: 30, sameSite: "lax" });
}
