/**
 * Dashboard aggregation (SDD 38-43). No dashboard table: everything derives
 * from operational tables with a bounded number of queries per page.
 *
 * Not computed on purpose (no DECIDED business rule yet):
 * - "Laporan Bulanan Belum Lengkap" (OBD-DM-006): always null.
 * - Risk status Hijau/Kuning/Oranye/Merah (OBD-DM-005): not shown.
 */
import "server-only";
import { and, asc, count, desc, eq, inArray, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { branches, budgetYears, findings, reconciliations, rkas, schools } from "@/db/schema";
import { isCentral, type SessionUser } from "@/lib/auth/authz";
import { reconciliationResult } from "@/lib/calc";

import { paginate } from "./common";
import { currentAmounts } from "./rkas";

export type DashboardFilters = { budgetYearId: number | null; branchId: number | null; schoolId: number | null };

export async function getDashboard(user: SessionUser, filters: DashboardFilters, page: number) {
  const central = isCentral(user);
  const years = await db.select({ id: budgetYears.id, name: budgetYears.name, isActive: budgetYears.isActive, startDate: budgetYears.startDate }).from(budgetYears).orderBy(desc(budgetYears.startDate));
  const year =
    years.find((y) => y.id === filters.budgetYearId) ?? years.find((y) => y.isActive) ?? null;

  // BRANCH users are always locked to their own branch; ?branch= is ignored for them.
  const branchList = central ? await db.select({ id: branches.id, name: branches.name }).from(branches).orderBy(asc(branches.name)) : [];
  const branchId = central ? (branchList.find((b) => b.id === filters.branchId)?.id ?? null) : user.branchId;

  const inScope = branchId === null ? undefined : eq(schools.branchId, branchId);
  const scopedSchoolIds = db.select({ id: schools.id }).from(schools).where(inScope);

  const schoolOptions = await db.select({ id: schools.id, name: schools.name }).from(schools).where(inScope).orderBy(asc(schools.name));
  // An out-of-scope ?school= id simply matches nothing.
  const schoolId = schoolOptions.find((s) => s.id === filters.schoolId)?.id ?? null;

  const [[{ value: totalSchools }], [{ value: openFindings }], reconProblems] = await Promise.all([
    db.select({ value: count() }).from(schools).where(inScope),
    db.select({ value: count() }).from(findings).where(and(inArray(findings.schoolId, scopedSchoolIds), ne(findings.status, "COMPLETED"))),
    year
      ? db
          .select({ value: count() })
          .from(reconciliations)
          .where(
            and(
              inArray(reconciliations.schoolId, scopedSchoolIds),
              eq(reconciliations.budgetYearId, year.id),
              sql`${reconciliations.bankBalance} <> ${reconciliations.financialStatementBalance}`,
            ),
          )
      : Promise.resolve(null),
  ]);

  const metrics = {
    totalSchools,
    totalBranches: branchId === null ? branchList.length : 1,
    monthlyIncompleteCount: null,
    reconciliationProblemCount: reconProblems ? reconProblems[0].value : null,
    openFindingsCount: openFindings,
  };

  const rowCond = and(inScope, schoolId ? eq(schools.id, schoolId) : undefined);
  const paged = await paginate(page, db.select({ value: count() }).from(schools).where(rowCond), (limit, offset) =>
    db
      .select({ id: schools.id, name: schools.name, branchName: branches.name })
      .from(schools)
      .innerJoin(branches, eq(branches.id, schools.branchId))
      .where(rowCond)
      .orderBy(asc(branches.name), asc(schools.name))
      .limit(limit)
      .offset(offset),
  );

  const ids = paged.rows.map((r) => r.id);
  const [plans, recons, findingCounts] = await Promise.all([
    year && ids.length
      ? db.select({ id: rkas.id, schoolId: rkas.schoolId, initialAmount: rkas.initialAmount }).from(rkas).where(and(inArray(rkas.schoolId, ids), eq(rkas.budgetYearId, year.id)))
      : Promise.resolve([]),
    year && ids.length
      ? db
          .select({ schoolId: reconciliations.schoolId, statement: reconciliations.financialStatementBalance, bank: reconciliations.bankBalance })
          .from(reconciliations)
          .where(and(inArray(reconciliations.schoolId, ids), eq(reconciliations.budgetYearId, year.id)))
      : Promise.resolve([]),
    ids.length
      ? db
          .select({ schoolId: findings.schoolId, value: count() })
          .from(findings)
          .where(and(inArray(findings.schoolId, ids), ne(findings.status, "COMPLETED")))
          .groupBy(findings.schoolId)
      : Promise.resolve([]),
  ]);
  const amounts = await currentAmounts(plans);

  const rows = paged.rows.map((s) => {
    const plan = plans.find((p) => p.schoolId === s.id);
    const recon = recons.find((r) => r.schoolId === s.id);
    return {
      ...s,
      rkasId: plan?.id ?? null,
      rkasCurrentAmount: plan ? amounts.get(plan.id)! : null,
      reconciliation: recon ? reconciliationResult(recon.statement, recon.bank) : null,
      openFindingsCount: findingCounts.find((c) => c.schoolId === s.id)?.value ?? 0,
    };
  });

  return {
    metrics,
    year,
    years,
    isCentral: central,
    branchList,
    branchId,
    schoolOptions,
    schoolId,
    paged: { ...paged, rows },
  };
}
