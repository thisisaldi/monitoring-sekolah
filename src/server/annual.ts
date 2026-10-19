/**
 * Annual per-school records keyed by (school, budget year): BOS, Piutang and
 * Rekonsiliasi share one create/edit/list flow and differ only in fields.
 */
import "server-only";
import { asc, count, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { bosRecords, budgetYears, receivables, reconciliations, schools } from "@/db/schema";
import { assertBranch, assertCanModify, type SessionUser } from "@/lib/auth/authz";
import { f, formValues, parseForm, uniqueViolation, type FormState } from "@/lib/forms";

import { recordAudit, schoolLabel } from "./audit";
import { branchScope, checkChoices, orNotFound, paginate } from "./common";

const MODULES = {
  bos: {
    table: bosRecords,
    duplicate: "Data BOS untuk sekolah dan tahun anggaran ini sudah ada.",
    fields: {
      openingBalance: f.money(),
      receiptAmount: f.money(),
      usageAmount: f.money(),
      rkasCompliance: f.optionalBool(),
      reportStatus: f.choice(["COMPLETE", "INCOMPLETE"] as const),
      notes: f.optionalText(),
    },
  },
  receivables: {
    table: receivables,
    duplicate: "Data piutang untuk sekolah dan tahun anggaran ini sudah ada.",
    fields: {
      openingBalance: f.money(),
      additionAmount: f.money(),
      settlementAmount: f.money(),
      dominantAge: f.optionalText(100),
      followUp: f.optionalText(),
    },
  },
  reconciliation: {
    table: reconciliations,
    duplicate: "Data rekonsiliasi untuk sekolah dan tahun anggaran ini sudah ada.",
    fields: {
      financialStatementBalance: f.money({ allowNegative: true }),
      bankBalance: f.money({ allowNegative: true }),
      rkasCompliance: f.optionalBool(),
      notes: f.optionalText(),
      followUp: f.optionalText(),
    },
  },
} as const;
export type AnnualModule = keyof typeof MODULES;

type AnyTable = typeof bosRecords | typeof receivables | typeof reconciliations;
const tableOf = (m: AnnualModule) => MODULES[m].table as AnyTable;

export async function listAnnual(module: AnnualModule, user: SessionUser, page: number) {
  const t = tableOf(module);
  const where = branchScope(user);
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
        .orderBy(desc(budgetYears.startDate), asc(schools.name), asc(t.id))
        .limit(limit)
        .offset(offset),
  );
}

export async function getAnnualForEdit(module: AnnualModule, user: SessionUser, id: number) {
  const t = tableOf(module);
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

export async function createAnnual(module: AnnualModule, user: SessionUser, formData: FormData): Promise<FormState> {
  assertBranch(user);
  const schema = z.object({ schoolId: f.id("Pilih sekolah."), budgetYearId: f.id("Pilih tahun anggaran."), ...MODULES[module].fields });
  const parsed = parseForm(schema, formData);
  if ("state" in parsed) return parsed.state;
  const errors = await checkChoices(user, parsed.data.schoolId, parsed.data.budgetYearId);
  if (errors) return { errors, values: formValues(formData) };
  try {
    await db.transaction(async (tx) => {
      const [row] = (await tx
        .insert(tableOf(module))
        .values({ ...parsed.data, createdBy: user.id, updatedBy: user.id } as never)
        .returning()) as { id: number; schoolId: number; budgetYearId: number }[];
      await recordAudit(tx, user, {
        action: "CREATE", entity: module, entityId: row.id, schoolId: row.schoolId,
        label: await schoolLabel(tx, row.schoolId, row.budgetYearId), after: row,
      });
    });
    return { ok: true };
  } catch (e) {
    if (uniqueViolation(e)) return { formError: MODULES[module].duplicate, values: formValues(formData) };
    throw e;
  }
}

export async function updateAnnual(module: AnnualModule, user: SessionUser, id: number, formData: FormData): Promise<FormState> {
  const current = await getAnnualForEdit(module, user, id);
  const parsed = parseForm(z.object(MODULES[module].fields), formData);
  if ("state" in parsed) return parsed.state;
  const t = tableOf(module);
  await db.transaction(async (tx) => {
    const [after] = await tx.update(t).set({ ...parsed.data, updatedBy: user.id } as never).where(eq(t.id, id)).returning();
    await recordAudit(tx, user, {
      action: "UPDATE", entity: module, entityId: id, schoolId: current.record.schoolId,
      label: `${current.schoolName}, ${current.budgetYearName}`, before: current.record, after,
    });
  });
  return { ok: true };
}
