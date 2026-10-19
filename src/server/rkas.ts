import "server-only";
import { asc, count, desc, eq, inArray, max } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { budgetYears, rkas, rkasRevisions, schools } from "@/db/schema";
import { assertBranch, assertCanAccess, assertCanModify, canModifyBranchData, type SessionUser } from "@/lib/auth/authz";
import { rkasCurrentAmount } from "@/lib/calc";
import type { Cents } from "@/lib/money";
import { f, formValues, parseForm, uniqueViolation, type FormState } from "@/lib/forms";

import { recordAudit, schoolLabel } from "./audit";
import { branchScope, checkChoices, orNotFound, paginate } from "./common";

/** Current (latest) RKAS amount for many RKAS rows in one query. */
export async function currentAmounts(rows: { id: number; initialAmount: string }[]): Promise<Map<number, Cents>> {
  const ids = rows.map((r) => r.id);
  const revisions = ids.length
    ? await db
        .select({ rkasId: rkasRevisions.rkasId, revisionNumber: rkasRevisions.revisionNumber, amount: rkasRevisions.amount })
        .from(rkasRevisions)
        .where(inArray(rkasRevisions.rkasId, ids))
    : [];
  return new Map(
    rows.map((r) => [r.id, rkasCurrentAmount(r.initialAmount, revisions.filter((v) => v.rkasId === r.id))]),
  );
}

export async function listRkas(user: SessionUser, page: number) {
  const where = branchScope(user);
  const result = await paginate(
    page,
    db.select({ value: count() }).from(rkas).innerJoin(schools, eq(schools.id, rkas.schoolId)).where(where),
    (limit, offset) =>
      db
        .select({
          id: rkas.id,
          initialAmount: rkas.initialAmount,
          schoolName: schools.name,
          budgetYearName: budgetYears.name,
        })
        .from(rkas)
        .innerJoin(schools, eq(schools.id, rkas.schoolId))
        .innerJoin(budgetYears, eq(budgetYears.id, rkas.budgetYearId))
        .where(where)
        .orderBy(desc(budgetYears.startDate), asc(schools.name), asc(rkas.id))
        .limit(limit)
        .offset(offset),
  );
  const amounts = await currentAmounts(result.rows);
  return { ...result, rows: result.rows.map((r) => ({ ...r, currentAmount: amounts.get(r.id)! })) };
}

async function loadRkas(id: number) {
  const [row] = await db
    .select({
      id: rkas.id,
      schoolId: rkas.schoolId,
      branchId: schools.branchId,
      schoolName: schools.name,
      budgetYearName: budgetYears.name,
      initialAmount: rkas.initialAmount,
      initialApprovalDate: rkas.initialApprovalDate,
      majorChangeDescription: rkas.majorChangeDescription,
    })
    .from(rkas)
    .innerJoin(schools, eq(schools.id, rkas.schoolId))
    .innerJoin(budgetYears, eq(budgetYears.id, rkas.budgetYearId))
    .where(eq(rkas.id, id));
  return orNotFound(row);
}

export async function getRkasDetail(user: SessionUser, id: number) {
  const row = await loadRkas(id);
  assertCanAccess(user, row.branchId);
  const revisions = await db
    .select()
    .from(rkasRevisions)
    .where(eq(rkasRevisions.rkasId, id))
    .orderBy(asc(rkasRevisions.revisionNumber));
  return {
    ...row,
    revisions,
    currentAmount: rkasCurrentAmount(row.initialAmount, revisions),
    canModify: canModifyBranchData(user, row.branchId),
  };
}

export async function getRkasForEdit(user: SessionUser, id: number) {
  const row = await loadRkas(id);
  assertCanModify(user, row.branchId);
  return row;
}

const editFields = {
  initialAmount: f.money(),
  initialApprovalDate: f.optionalDate(),
  majorChangeDescription: f.optionalText(),
};
const createSchema = z.object({ schoolId: f.id("Pilih sekolah."), budgetYearId: f.id("Pilih tahun anggaran."), ...editFields });
const editSchema = z.object(editFields);
const revisionSchema = z.object({
  amount: f.money(),
  revisionDate: f.date(),
  changeDescription: f.optionalText(),
});

export async function createRkas(user: SessionUser, formData: FormData): Promise<FormState & { id?: number }> {
  assertBranch(user);
  const parsed = parseForm(createSchema, formData);
  if ("state" in parsed) return parsed.state;
  const { data } = parsed;
  const errors = await checkChoices(user, data.schoolId, data.budgetYearId);
  if (errors) return { errors, values: formValues(formData) };
  try {
    const id = await db.transaction(async (tx) => {
      const [row] = await tx.insert(rkas).values({ ...data, createdBy: user.id, updatedBy: user.id }).returning();
      await recordAudit(tx, user, {
        action: "CREATE", entity: "rkas", entityId: row.id, schoolId: row.schoolId,
        label: await schoolLabel(tx, row.schoolId, row.budgetYearId), after: row,
      });
      return row.id;
    });
    return { ok: true, id };
  } catch (e) {
    if (uniqueViolation(e)) {
      return {
        formError: "RKAS untuk sekolah dan tahun anggaran ini sudah ada.",
        values: formValues(formData),
      };
    }
    throw e;
  }
}

export async function updateRkas(user: SessionUser, id: number, formData: FormData): Promise<FormState> {
  const current = await getRkasForEdit(user, id);
  const parsed = parseForm(editSchema, formData);
  if ("state" in parsed) return parsed.state;
  await db.transaction(async (tx) => {
    const [before] = await tx.select().from(rkas).where(eq(rkas.id, id));
    const [after] = await tx.update(rkas).set({ ...parsed.data, updatedBy: user.id }).where(eq(rkas.id, id)).returning();
    await recordAudit(tx, user, {
      action: "UPDATE", entity: "rkas", entityId: id, schoolId: current.schoolId,
      label: `${current.schoolName}, ${current.budgetYearName}`, before, after,
    });
  });
  return { ok: true };
}

/** Appends the next revision number. Retries once if a concurrent save took the number. */
export async function addRkasRevision(
  user: SessionUser,
  id: number,
  formData: FormData,
): Promise<FormState & { revisionNumber?: number }> {
  const current = await getRkasForEdit(user, id);
  const parsed = parseForm(revisionSchema, formData);
  if ("state" in parsed) return parsed.state;
  for (let attempt = 0; ; attempt++) {
    try {
      const revisionNumber = await db.transaction(async (tx) => {
        const [{ value }] = await tx
          .select({ value: max(rkasRevisions.revisionNumber) })
          .from(rkasRevisions)
          .where(eq(rkasRevisions.rkasId, id));
        const next = (value ?? 0) + 1;
        const [row] = await tx
          .insert(rkasRevisions)
          .values({ ...parsed.data, rkasId: id, revisionNumber: next, createdBy: user.id })
          .returning();
        await recordAudit(tx, user, {
          action: "CREATE", entity: "rkas_revision", entityId: row.id, schoolId: current.schoolId,
          label: `${current.schoolName}, ${current.budgetYearName}, revisi ${next}`, after: row,
        });
        return next;
      });
      return { ok: true, revisionNumber };
    } catch (e) {
      if (!uniqueViolation(e) || attempt > 0) throw e;
    }
  }
}
