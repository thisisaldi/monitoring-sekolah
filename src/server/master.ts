/** Master data: schools (CENTRAL), budget years (CENTRAL), branches (admin). */
import "server-only";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { BRANCH_TYPES, branches, budgetYears, schools } from "@/db/schema";
import { assertAdmin, assertCentral, scopeBranchId, type SessionUser } from "@/lib/auth/authz";
import { f, formValues, parseForm, uniqueViolation, type FormState } from "@/lib/forms";

import { recordAudit } from "./audit";
import { orNotFound, paginate } from "./common";

// ---------------------------------------------------------------------------
// Audited writes shared by schools, budget years and branches
// ---------------------------------------------------------------------------

type MasterTable = typeof schools | typeof budgetYears | typeof branches;
type MasterRow = { id: number; name: string; isActive: boolean } & Record<string, unknown>;

/** Insert (no id) or update (id), plus the matching audit entry, in one transaction. */
function saveAudited(user: SessionUser, t: MasterTable, entity: string, values: Record<string, unknown>, id?: number) {
  return db.transaction(async (tx) => {
    if (id) {
      const [before] = (await tx.select().from(t).where(eq(t.id, id))) as MasterRow[];
      const [after] = (await tx.update(t).set(values as never).where(eq(t.id, id)).returning()) as MasterRow[];
      await recordAudit(tx, user, { action: "UPDATE", entity, entityId: id, label: after.name, before, after });
    } else {
      const [row] = (await tx.insert(t).values(values as never).returning()) as MasterRow[];
      await recordAudit(tx, user, { action: "CREATE", entity, entityId: row.id, label: row.name, after: row });
    }
  });
}

function setActiveAudited(user: SessionUser, t: MasterTable, entity: string, id: number, isActive: boolean) {
  return db.transaction(async (tx) => {
    const [row] = (await tx.update(t).set({ isActive } as never).where(eq(t.id, id)).returning()) as MasterRow[];
    await recordAudit(tx, user, { action: isActive ? "ACTIVATE" : "DEACTIVATE", entity, entityId: id, label: row.name });
  });
}

// ---------------------------------------------------------------------------
// Schools
// ---------------------------------------------------------------------------

const schoolSchema = z.object({
  branchId: f.id("Pilih cabang."),
  code: f.requiredText(50),
  name: f.requiredText(200),
  educationLevel: f.optionalText(50),
  principalName: f.optionalText(150),
  treasurerName: f.optionalText(150),
  studentCount: f.optionalInt(),
  note: f.optionalText(),
});

export async function listSchools(user: SessionUser, page: number, search = "") {
  const branchId = scopeBranchId(user);
  // and() skips undefined conditions.
  const cond = and(
    branchId === null ? undefined : eq(schools.branchId, branchId),
    search ? or(ilike(schools.name, `%${search}%`), ilike(schools.code, `%${search}%`)) : undefined,
  );
  return paginate(
    page,
    db.select({ value: count() }).from(schools).where(cond),
    (limit, offset) =>
      db
        .select({ school: schools, branchName: branches.name })
        .from(schools)
        .innerJoin(branches, eq(branches.id, schools.branchId))
        .where(cond)
        .orderBy(asc(schools.name))
        .limit(limit)
        .offset(offset),
  );
}

/** Branches offered when assigning a school: active ones, plus the current one when editing. */
export async function branchOptions(currentBranchId?: number) {
  const rows = await db
    .select({ id: branches.id, name: branches.name, isActive: branches.isActive })
    .from(branches)
    .orderBy(asc(branches.name));
  return rows.filter((b) => b.isActive || b.id === currentBranchId);
}

async function validateSchool(formData: FormData, currentBranchId?: number) {
  const parsed = parseForm(schoolSchema, formData);
  if ("state" in parsed) return parsed;
  if (!(await branchOptions(currentBranchId)).some((b) => b.id === parsed.data.branchId)) {
    return { state: { errors: { branchId: ["Pilih cabang yang valid."] }, values: formValues(formData) } as FormState };
  }
  return parsed;
}

function schoolConflict(e: unknown, formData: FormData): FormState {
  if (uniqueViolation(e)) return { errors: { code: ["Kode sekolah sudah dipakai."] }, values: formValues(formData) };
  throw e;
}

export async function createSchool(user: SessionUser, formData: FormData): Promise<FormState> {
  assertCentral(user);
  const parsed = await validateSchool(formData);
  if ("state" in parsed) return parsed.state;
  try {
    await saveAudited(user, schools, "school", parsed.data);
    return { ok: true };
  } catch (e) {
    return schoolConflict(e, formData);
  }
}

export async function getSchool(user: SessionUser, id: number) {
  assertCentral(user);
  const [row] = await db.select().from(schools).where(eq(schools.id, id));
  return orNotFound(row);
}

export async function updateSchool(user: SessionUser, id: number, formData: FormData): Promise<FormState> {
  const current = await getSchool(user, id);
  const parsed = await validateSchool(formData, current.branchId);
  if ("state" in parsed) return parsed.state;
  try {
    await saveAudited(user, schools, "school", parsed.data, id);
    return { ok: true };
  } catch (e) {
    return schoolConflict(e, formData);
  }
}

export async function setSchoolActive(user: SessionUser, id: number, isActive: boolean) {
  await getSchool(user, id);
  await setActiveAudited(user, schools, "school", id, isActive);
}

// ---------------------------------------------------------------------------
// Budget years (global master data: everyone reads, CENTRAL manages)
// ---------------------------------------------------------------------------

const budgetYearSchema = z
  .object({ name: f.requiredText(50), startDate: f.date(), endDate: f.date() })
  .refine((v) => v.startDate < v.endDate, { path: ["endDate"], message: "Tanggal selesai harus setelah tanggal mulai." });

export function listBudgetYears(page: number) {
  return paginate(page, db.select({ value: count() }).from(budgetYears), (limit, offset) =>
    db.select().from(budgetYears).orderBy(desc(budgetYears.startDate)).limit(limit).offset(offset),
  );
}

export async function getBudgetYear(user: SessionUser, id: number) {
  assertCentral(user);
  const [row] = await db.select().from(budgetYears).where(eq(budgetYears.id, id));
  return orNotFound(row);
}

async function saveBudgetYear(user: SessionUser, formData: FormData, id?: number): Promise<FormState> {
  const parsed = parseForm(budgetYearSchema, formData);
  if ("state" in parsed) return parsed.state;
  try {
    await saveAudited(user, budgetYears, "budget_year", parsed.data, id);
    return { ok: true };
  } catch (e) {
    if (uniqueViolation(e)) return { errors: { name: ["Nama tahun anggaran sudah dipakai."] }, values: formValues(formData) };
    throw e;
  }
}

export async function createBudgetYear(user: SessionUser, formData: FormData) {
  assertCentral(user);
  return saveBudgetYear(user, formData);
}

export async function updateBudgetYear(user: SessionUser, id: number, formData: FormData) {
  await getBudgetYear(user, id);
  return saveBudgetYear(user, formData, id);
}

export async function setBudgetYearActive(user: SessionUser, id: number, isActive: boolean) {
  await getBudgetYear(user, id);
  await setActiveAudited(user, budgetYears, "budget_year", id, isActive);
}

// ---------------------------------------------------------------------------
// Branches (system administration, ADMIN only)
// ---------------------------------------------------------------------------

const branchSchema = z.object({
  code: f.requiredText(50),
  name: f.requiredText(150),
  type: f.choice(BRANCH_TYPES),
  isActive: f.checkbox(),
});

export async function listBranches(user: SessionUser, page: number) {
  assertAdmin(user);
  const schoolCounts = db
    .select({ branchId: schools.branchId, n: count().as("n") })
    .from(schools)
    .groupBy(schools.branchId)
    .as("sc");
  return paginate(page, db.select({ value: count() }).from(branches), (limit, offset) =>
    db
      .select({ branch: branches, schoolCount: schoolCounts.n })
      .from(branches)
      .leftJoin(schoolCounts, eq(schoolCounts.branchId, branches.id))
      .orderBy(asc(branches.name))
      .limit(limit)
      .offset(offset),
  );
}

export async function getBranch(user: SessionUser, id: number) {
  assertAdmin(user);
  const [row] = await db.select().from(branches).where(eq(branches.id, id));
  return orNotFound(row);
}

async function saveBranch(user: SessionUser, formData: FormData, id?: number): Promise<FormState> {
  const parsed = parseForm(branchSchema, formData);
  if ("state" in parsed) return parsed.state;
  try {
    await saveAudited(user, branches, "branch", parsed.data, id);
    return { ok: true };
  } catch (e) {
    if (uniqueViolation(e)) return { errors: { code: ["Kode cabang sudah dipakai."] }, values: formValues(formData) };
    throw e;
  }
}

export async function createBranch(user: SessionUser, formData: FormData) {
  assertAdmin(user);
  return saveBranch(user, formData);
}

export async function updateBranch(user: SessionUser, id: number, formData: FormData) {
  await getBranch(user, id);
  return saveBranch(user, formData, id);
}

export async function setBranchActive(user: SessionUser, id: number, isActive: boolean) {
  await getBranch(user, id);
  await setActiveAudited(user, branches, "branch", id, isActive);
}
