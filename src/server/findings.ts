import "server-only";
import { count, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { findings, schools } from "@/db/schema";
import { assertBranch, assertCanModify, type SessionUser } from "@/lib/auth/authz";
import { f, formValues, parseForm, type FormState } from "@/lib/forms";

import { recordAudit, schoolLabel } from "./audit";
import { branchScope, checkChoices, orNotFound, paginate } from "./common";

const fields = z
  .object({
    findingDate: f.date(),
    source: f.requiredText(150),
    finding: f.requiredText(10_000),
    amount: f.optionalMoney(),
    risk: f.optionalText(50),
    recommendation: f.requiredText(10_000),
    pic: f.requiredText(150),
    deadline: f.date(),
    status: f.choice(["OPEN", "ON_PROGRESS", "COMPLETED"] as const),
    completedDate: f.optionalDate(),
  })
  // OBD-007: COMPLETED requires a completed date; otherwise it stays empty.
  .superRefine((v, ctx) => {
    if (v.status === "COMPLETED" && !v.completedDate) {
      ctx.addIssue({ code: "custom", path: ["completedDate"], message: "Wajib diisi jika status Selesai." });
    }
    if (v.status !== "COMPLETED" && v.completedDate) {
      ctx.addIssue({ code: "custom", path: ["completedDate"], message: "Kosongkan kecuali status Selesai." });
    }
  });

export async function listFindings(user: SessionUser, page: number) {
  const where = branchScope(user);
  return paginate(
    page,
    db.select({ value: count() }).from(findings).innerJoin(schools, eq(schools.id, findings.schoolId)).where(where),
    (limit, offset) =>
      db
        .select({ record: findings, schoolName: schools.name })
        .from(findings)
        .innerJoin(schools, eq(schools.id, findings.schoolId))
        .where(where)
        .orderBy(desc(findings.findingDate), desc(findings.id))
        .limit(limit)
        .offset(offset),
  );
}

export async function getFindingForEdit(user: SessionUser, id: number) {
  const [row] = await db
    .select({ record: findings, branchId: schools.branchId, schoolName: schools.name })
    .from(findings)
    .innerJoin(schools, eq(schools.id, findings.schoolId))
    .where(eq(findings.id, id));
  const found = orNotFound(row);
  assertCanModify(user, found.branchId);
  return found;
}

export async function createFinding(user: SessionUser, formData: FormData): Promise<FormState> {
  assertBranch(user);
  const parsed = parseForm(fields.and(z.object({ schoolId: f.id("Pilih sekolah.") })), formData);
  if ("state" in parsed) return parsed.state;
  const errors = await checkChoices(user, parsed.data.schoolId);
  if (errors) return { errors, values: formValues(formData) };
  await db.transaction(async (tx) => {
    const [row] = await tx.insert(findings).values({ ...parsed.data, createdBy: user.id, updatedBy: user.id }).returning();
    await recordAudit(tx, user, {
      action: "CREATE", entity: "finding", entityId: row.id, schoolId: row.schoolId,
      label: `${await schoolLabel(tx, row.schoolId)}, temuan ${row.findingDate}`, after: row,
    });
  });
  return { ok: true };
}

export async function updateFinding(user: SessionUser, id: number, formData: FormData): Promise<FormState> {
  const current = await getFindingForEdit(user, id);
  const parsed = parseForm(fields, formData);
  if ("state" in parsed) return parsed.state;
  await db.transaction(async (tx) => {
    const [after] = await tx.update(findings).set({ ...parsed.data, updatedBy: user.id }).where(eq(findings.id, id)).returning();
    await recordAudit(tx, user, {
      action: "UPDATE", entity: "finding", entityId: id, schoolId: current.record.schoolId,
      label: `${current.schoolName}, temuan ${current.record.findingDate}`, before: current.record, after,
    });
  });
  return { ok: true };
}
