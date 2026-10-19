import "server-only";
import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { budgetYears, monthlyRealizations, rkas, rkasRevisions, schools, semesterRealizations } from "@/db/schema";
import { assertBranch, assertCanAccess, assertCanModify, type SessionUser } from "@/lib/auth/authz";
import { rkasCurrentAmount, semesterSummary } from "@/lib/calc";
import { MONTH_NAMES, SCHOOL_YEAR_MONTH_ORDER } from "@/lib/format";
import { f, formValues, parseForm, uniqueViolation, type FormState } from "@/lib/forms";

import { recordAudit, schoolLabel } from "./audit";
import { branchScope, checkChoices, orNotFound, paginate } from "./common";

// ---------------------------------------------------------------------------
// Monthly
// ---------------------------------------------------------------------------

const monthlyEdit = {
  budgetAmount: f.money(),
  realizationAmount: f.money(),
  varianceExplanation: f.optionalText(),
  reportStatus: f.choice(["COMPLETE", "INCOMPLETE"] as const),
};
const monthlyCreate = z.object({
  schoolId: f.id("Pilih sekolah."),
  budgetYearId: f.id("Pilih tahun anggaran."),
  month: z.coerce.number({ message: "Pilih bulan." }).int().min(1, "Pilih bulan.").max(12, "Pilih bulan."),
  ...monthlyEdit,
});

// Display follows the school-year sequence (July to June); stored month is unchanged.
const schoolYearPosition = sql`array_position(array[${sql.raw(SCHOOL_YEAR_MONTH_ORDER.join(","))}], ${monthlyRealizations.month}::int)`;

export async function listMonthly(user: SessionUser, page: number) {
  const where = branchScope(user);
  const t = monthlyRealizations;
  return paginate(
    page,
    db.select({ value: count() }).from(t).innerJoin(schools, eq(schools.id, t.schoolId)).where(where),
    (limit, offset) =>
      db
        .select({ record: t, schoolName: schools.name, budgetYearName: budgetYears.name })
        .from(t)
        .innerJoin(schools, eq(schools.id, t.schoolId))
        .innerJoin(budgetYears, eq(budgetYears.id, t.budgetYearId))
        .where(where)
        .orderBy(desc(budgetYears.startDate), asc(schools.name), schoolYearPosition)
        .limit(limit)
        .offset(offset),
  );
}

export async function getMonthlyForEdit(user: SessionUser, id: number) {
  const t = monthlyRealizations;
  const [row] = await db
    .select({ record: t, branchId: schools.branchId, schoolName: schools.name, budgetYearName: budgetYears.name })
    .from(t)
    .innerJoin(schools, eq(schools.id, t.schoolId))
    .innerJoin(budgetYears, eq(budgetYears.id, t.budgetYearId))
    .where(eq(t.id, id));
  const found = orNotFound(row);
  assertCanModify(user, found.branchId);
  return found;
}

export async function createMonthly(user: SessionUser, formData: FormData): Promise<FormState> {
  assertBranch(user);
  const parsed = parseForm(monthlyCreate, formData);
  if ("state" in parsed) return parsed.state;
  const errors = await checkChoices(user, parsed.data.schoolId, parsed.data.budgetYearId);
  if (errors) return { errors, values: formValues(formData) };
  try {
    await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(monthlyRealizations)
        .values({ ...parsed.data, createdBy: user.id, updatedBy: user.id })
        .returning();
      await recordAudit(tx, user, {
        action: "CREATE", entity: "monthly_realization", entityId: row.id, schoolId: row.schoolId,
        label: `${await schoolLabel(tx, row.schoolId, row.budgetYearId)}, ${MONTH_NAMES[row.month]}`, after: row,
      });
    });
    return { ok: true };
  } catch (e) {
    if (uniqueViolation(e)) {
      return { formError: "Data bulan ini untuk sekolah dan tahun anggaran ini sudah ada.", values: formValues(formData) };
    }
    throw e;
  }
}

export async function updateMonthly(user: SessionUser, id: number, formData: FormData): Promise<FormState> {
  const current = await getMonthlyForEdit(user, id);
  const parsed = parseForm(z.object(monthlyEdit), formData);
  if ("state" in parsed) return parsed.state;
  await db.transaction(async (tx) => {
    const [after] = await tx
      .update(monthlyRealizations)
      .set({ ...parsed.data, updatedBy: user.id })
      .where(eq(monthlyRealizations.id, id))
      .returning();
    await recordAudit(tx, user, {
      action: "UPDATE", entity: "monthly_realization", entityId: id, schoolId: current.record.schoolId,
      label: `${current.schoolName}, ${current.budgetYearName}, ${MONTH_NAMES[current.record.month]}`,
      before: current.record, after,
    });
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Semester
// ---------------------------------------------------------------------------

const semesterEdit = { realizationAmount: f.money(), evaluationNote: f.optionalText() };
const semesterCreate = z.object({
  schoolId: f.id("Pilih sekolah."),
  budgetYearId: f.id("Pilih tahun anggaran."),
  semester: z.coerce.number({ message: "Pilih semester." }).int().min(1, "Pilih semester.").max(2, "Pilih semester."),
  ...semesterEdit,
});

export async function listSemester(user: SessionUser, page: number) {
  const where = branchScope(user);
  const t = semesterRealizations;
  return paginate(
    page,
    db.select({ value: count() }).from(t).innerJoin(schools, eq(schools.id, t.schoolId)).where(where),
    (limit, offset) =>
      db
        .select({ record: t, schoolName: schools.name, budgetYearName: budgetYears.name })
        .from(t)
        .innerJoin(schools, eq(schools.id, t.schoolId))
        .innerJoin(budgetYears, eq(budgetYears.id, t.budgetYearId))
        .where(where)
        .orderBy(desc(budgetYears.startDate), asc(schools.name), asc(t.semester))
        .limit(limit)
        .offset(offset),
  );
}

export async function getSemesterForEdit(user: SessionUser, id: number) {
  const t = semesterRealizations;
  const [row] = await db
    .select({ record: t, branchId: schools.branchId, schoolName: schools.name, budgetYearName: budgetYears.name })
    .from(t)
    .innerJoin(schools, eq(schools.id, t.schoolId))
    .innerJoin(budgetYears, eq(budgetYears.id, t.budgetYearId))
    .where(eq(t.id, id));
  const found = orNotFound(row);
  assertCanModify(user, found.branchId);
  return found;
}

export async function createSemester(user: SessionUser, formData: FormData): Promise<FormState> {
  assertBranch(user);
  const parsed = parseForm(semesterCreate, formData);
  if ("state" in parsed) return parsed.state;
  const errors = await checkChoices(user, parsed.data.schoolId, parsed.data.budgetYearId);
  if (errors) return { errors, values: formValues(formData) };
  try {
    await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(semesterRealizations)
        .values({ ...parsed.data, createdBy: user.id, updatedBy: user.id })
        .returning();
      await recordAudit(tx, user, {
        action: "CREATE", entity: "semester_realization", entityId: row.id, schoolId: row.schoolId,
        label: `${await schoolLabel(tx, row.schoolId, row.budgetYearId)}, Semester ${row.semester}`, after: row,
      });
    });
    return { ok: true };
  } catch (e) {
    if (uniqueViolation(e)) {
      return { formError: "Data semester ini untuk sekolah dan tahun anggaran ini sudah ada.", values: formValues(formData) };
    }
    throw e;
  }
}

export async function updateSemester(user: SessionUser, id: number, formData: FormData): Promise<FormState> {
  const current = await getSemesterForEdit(user, id);
  const parsed = parseForm(z.object(semesterEdit), formData);
  if ("state" in parsed) return parsed.state;
  await db.transaction(async (tx) => {
    const [after] = await tx
      .update(semesterRealizations)
      .set({ ...parsed.data, updatedBy: user.id })
      .where(eq(semesterRealizations.id, id))
      .returning();
    await recordAudit(tx, user, {
      action: "UPDATE", entity: "semester_realization", entityId: id, schoolId: current.record.schoolId,
      label: `${current.schoolName}, ${current.budgetYearName}, Semester ${current.record.semester}`,
      before: current.record, after,
    });
  });
  return { ok: true };
}

/** Ringkasan semester: both semester rows combined with the latest RKAS amount. */
export async function getSemesterSummary(user: SessionUser, schoolId: number, budgetYearId: number) {
  const [school] = await db
    .select({ id: schools.id, name: schools.name, branchId: schools.branchId })
    .from(schools)
    .where(eq(schools.id, schoolId));
  assertCanAccess(user, orNotFound(school).branchId);
  const [year] = await db.select({ name: budgetYears.name }).from(budgetYears).where(eq(budgetYears.id, budgetYearId));
  orNotFound(year);

  const rows = await db
    .select({ semester: semesterRealizations.semester, amount: semesterRealizations.realizationAmount })
    .from(semesterRealizations)
    .where(and(eq(semesterRealizations.schoolId, schoolId), eq(semesterRealizations.budgetYearId, budgetYearId)));
  const [plan] = await db
    .select({ id: rkas.id, initialAmount: rkas.initialAmount })
    .from(rkas)
    .where(and(eq(rkas.schoolId, schoolId), eq(rkas.budgetYearId, budgetYearId)));
  const latestRkas = plan
    ? rkasCurrentAmount(
        plan.initialAmount,
        await db
          .select({ revisionNumber: rkasRevisions.revisionNumber, amount: rkasRevisions.amount })
          .from(rkasRevisions)
          .where(eq(rkasRevisions.rkasId, plan.id)),
      )
    : null;

  const amountFor = (n: number) => rows.find((r) => r.semester === n)?.amount ?? null;
  return { school, budgetYearName: year.name, ...semesterSummary(amountFor(1), amountFor(2), latestRkas) };
}
