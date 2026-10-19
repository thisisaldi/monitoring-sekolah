/**
 * Activity history (audit log). Every mutation writes one entry inside the
 * same transaction as the change, so a change can never land without its log.
 */
import "server-only";
import { and, count, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { AUDIT_ACTIONS, auditLogs, budgetYears, schools, users, type AuditAction } from "@/db/schema";
import { assertCentral, type SessionUser } from "@/lib/auth/authz";

import { paginate } from "./common";

/** A transaction handle or the db itself. */
export type Tx = Pick<typeof db, "insert" | "select" | "update">;

/** Bookkeeping fields that are never interesting in a diff. Passwords never appear. */
const IGNORED = new Set(["id", "createdAt", "createdBy", "updatedAt", "updatedBy", "password", "lastLogin"]);

type Row = Record<string, unknown>;

/** { field: [old, new] } for fields whose value changed; null when nothing did. */
export function diff(before: Row | null, after: Row): Record<string, [unknown, unknown]> | null {
  const out: Record<string, [unknown, unknown]> = {};
  for (const [key, value] of Object.entries(after)) {
    if (IGNORED.has(key)) continue;
    const old = before ? (before[key] ?? null) : null;
    if (String(old ?? "") !== String(value ?? "")) out[key] = [old, value ?? null];
  }
  return Object.keys(out).length ? out : null;
}

export async function recordAudit(
  tx: Tx,
  user: SessionUser,
  entry: {
    action: AuditAction;
    entity: string;
    entityId: number | null;
    label: string;
    schoolId?: number | null;
    before?: Row | null;
    after?: Row;
  },
) {
  const changes = entry.after ? diff(entry.before ?? null, entry.after) : null;
  // An edit that changed nothing is not worth a history entry.
  if (entry.action === "UPDATE" && !changes) return;
  await tx.insert(auditLogs).values({
    userId: user.id,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId,
    label: entry.label,
    schoolId: entry.schoolId ?? null,
    changes,
  });
}

/** "SD Hang Tuah 1 Jakarta, TA 2026/2027" for school-level records. */
export async function schoolLabel(tx: Tx, schoolId: number, budgetYearId?: number) {
  const [s] = await tx.select({ name: schools.name }).from(schools).where(eq(schools.id, schoolId));
  if (budgetYearId === undefined) return s?.name ?? `Sekolah #${schoolId}`;
  const [y] = await tx.select({ name: budgetYears.name }).from(budgetYears).where(eq(budgetYears.id, budgetYearId));
  return `${s?.name ?? `Sekolah #${schoolId}`}, ${y?.name ?? ""}`;
}

export type AuditFilters = { entity: string; action: string };

/** Readable by ADMIN and CENTRAL only. */
export async function listAudit(user: SessionUser, page: number, filters: AuditFilters) {
  assertCentral(user);
  const cond = and(
    filters.entity ? eq(auditLogs.entity, filters.entity) : undefined,
    (AUDIT_ACTIONS as readonly string[]).includes(filters.action) ? eq(auditLogs.action, filters.action as AuditAction) : undefined,
  );
  return paginate(page, db.select({ value: count() }).from(auditLogs).where(cond), (limit, offset) =>
    db
      .select({ log: auditLogs, userName: users.name, username: users.username })
      .from(auditLogs)
      .innerJoin(users, eq(users.id, auditLogs.userId))
      .where(cond)
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .limit(limit)
      .offset(offset),
  );
}
