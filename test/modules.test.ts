import { describe, expect, it } from "vitest";

import { createAnnual, listAnnual, updateAnnual } from "@/server/annual";
import { getDashboard } from "@/server/dashboard";
import { createFinding, listFindings, updateFinding } from "@/server/findings";
import { createMonthly, createSemester, getSemesterSummary, listMonthly } from "@/server/realizations";
import { addRkasRevision, createRkas } from "@/server/rkas";

import { branch, budgetYear, form, school, user } from "./factories";

async function setup() {
  const own = await branch();
  const other = await branch();
  const s1 = await school(own.id, { name: "A Sekolah" });
  const s2 = await school(own.id, { name: "B Sekolah" });
  const otherSchool = await school(other.id);
  const year = await budgetYear();
  return {
    own, other, s1, s2, otherSchool, year,
    branchUser: await user("BRANCH", { branchId: own.id }),
    otherUser: await user("BRANCH", { branchId: other.id }),
    central: await user("CENTRAL"),
  };
}

describe("monthly realization", () => {
  it("unique per school/year/month and listed in school-year order", async () => {
    const t = await setup();
    for (const month of [1, 7, 12]) {
      const res = await createMonthly(t.branchUser, form({ schoolId: t.s1.id, budgetYearId: t.year.id, month, budgetAmount: "100", realizationAmount: "50", reportStatus: "COMPLETE" }));
      expect(res.ok).toBe(true);
    }
    const dup = await createMonthly(t.branchUser, form({ schoolId: t.s1.id, budgetYearId: t.year.id, month: 7, budgetAmount: "1", realizationAmount: "1", reportStatus: "COMPLETE" }));
    expect(dup.formError).toMatch(/sudah ada/);
    const list = await listMonthly(t.central, 1);
    expect(list.rows.map((r) => r.record.month)).toEqual([7, 12, 1]);
    expect((await listMonthly(t.otherUser, 1)).total).toBe(0);
  });

  it("rejects month out of range and central writes", async () => {
    const t = await setup();
    const bad = await createMonthly(t.branchUser, form({ schoolId: t.s1.id, budgetYearId: t.year.id, month: 13, budgetAmount: "1", realizationAmount: "1", reportStatus: "COMPLETE" }));
    expect(bad.errors?.month).toBeDefined();
    await expect(createMonthly(t.central, form({}))).rejects.toThrow("FORBIDDEN");
  });
});

describe("semester summary", () => {
  it("combines semesters with the latest RKAS", async () => {
    const t = await setup();
    const { id } = await createRkas(t.branchUser, form({ schoolId: t.s1.id, budgetYearId: t.year.id, initialAmount: "1000" }));
    await addRkasRevision(t.branchUser, id!, form({ amount: "800", revisionDate: "2026-08-01" }));
    await createSemester(t.branchUser, form({ schoolId: t.s1.id, budgetYearId: t.year.id, semester: 1, realizationAmount: "300" }));
    await createSemester(t.branchUser, form({ schoolId: t.s1.id, budgetYearId: t.year.id, semester: 2, realizationAmount: "100" }));
    const s = await getSemesterSummary(t.central, t.s1.id, t.year.id);
    expect(s.total).toBe(40_000n);
    expect(s.latestRkas).toBe(80_000n);
    expect(s.percentageSemester1).toBe(37.5);
    expect(s.percentageFinal).toBe(50);
    expect(s.remainingBudget).toBe(40_000n);
    await expect(getSemesterSummary(t.otherUser, t.s1.id, t.year.id)).rejects.toThrow("FORBIDDEN");
  });

  it("returns nulls instead of fabricating values when data is missing", async () => {
    const t = await setup();
    const s = await getSemesterSummary(t.branchUser, t.s1.id, t.year.id);
    expect([s.total, s.latestRkas, s.percentageFinal, s.remainingBudget]).toEqual([null, null, null, null]);
  });
});

describe("annual modules (BOS, piutang, rekonsiliasi)", () => {
  it("creates per school/year once, scoped by branch", async () => {
    const t = await setup();
    const values = { schoolId: t.s2.id, budgetYearId: t.year.id, openingBalance: "10", receiptAmount: "5", usageAmount: "3", reportStatus: "COMPLETE" };
    expect((await createAnnual("bos", t.branchUser, form(values))).ok).toBe(true);
    expect((await createAnnual("bos", t.branchUser, form(values))).formError).toMatch(/sudah ada/);
    expect((await createAnnual("bos", t.branchUser, form({ ...values, schoolId: t.otherSchool.id }))).errors?.schoolId).toBeDefined();
    const rows = (await listAnnual("bos", t.central, 1)).rows;
    expect(rows).toHaveLength(1);
    await expect(updateAnnual("bos", t.otherUser, rows[0].record.id, form(values))).rejects.toThrow("FORBIDDEN");
  });

  it("reconciliation balances may be negative, BOS amounts may not", async () => {
    const t = await setup();
    const recon = await createAnnual("reconciliation", t.branchUser, form({ schoolId: t.s1.id, budgetYearId: t.year.id, financialStatementBalance: "-5", bankBalance: "-5" }));
    expect(recon.ok).toBe(true);
    const bos = await createAnnual("bos", t.branchUser, form({ schoolId: t.s1.id, budgetYearId: t.year.id, openingBalance: "-1", receiptAmount: "0", usageAmount: "0", reportStatus: "COMPLETE" }));
    expect(bos.errors?.openingBalance).toBeDefined();
  });
});

describe("findings", () => {
  const base = { findingDate: "2026-08-01", source: "Audit", finding: "Kas kecil", recommendation: "Perbaiki", pic: "Bendahara", deadline: "2026-09-01" };

  it("COMPLETED requires a completed date; other statuses must leave it empty", async () => {
    const t = await setup();
    expect((await createFinding(t.branchUser, form({ ...base, schoolId: t.s1.id, status: "COMPLETED" }))).errors?.completedDate).toBeDefined();
    expect((await createFinding(t.branchUser, form({ ...base, schoolId: t.s1.id, status: "OPEN", completedDate: "2026-08-02" }))).errors?.completedDate).toBeDefined();
    expect((await createFinding(t.branchUser, form({ ...base, schoolId: t.s1.id, status: "OPEN" }))).ok).toBe(true);
    const [row] = (await listFindings(t.branchUser, 1)).rows;
    expect((await updateFinding(t.branchUser, row.record.id, form({ ...base, status: "COMPLETED", completedDate: "2026-08-20" }))).ok).toBe(true);
  });
});

describe("dashboard", () => {
  it("counts per scope; branch filter is ignored for BRANCH users", async () => {
    const t = await setup();
    await createAnnual("reconciliation", t.branchUser, form({ schoolId: t.s1.id, budgetYearId: t.year.id, financialStatementBalance: "10", bankBalance: "9" }));
    await createAnnual("reconciliation", t.otherUser, form({ schoolId: t.otherSchool.id, budgetYearId: t.year.id, financialStatementBalance: "10", bankBalance: "10" }));
    await createFinding(t.branchUser, form({ schoolId: t.s1.id, findingDate: "2026-08-01", source: "x", finding: "x", recommendation: "x", pic: "x", deadline: "2026-09-01", status: "OPEN" }));

    const all = await getDashboard(t.central, { budgetYearId: null, branchId: null, schoolId: null }, 1);
    expect(all.metrics).toMatchObject({ totalSchools: 3, totalBranches: 2, reconciliationProblemCount: 1, openFindingsCount: 1, monthlyIncompleteCount: null });

    const filtered = await getDashboard(t.central, { budgetYearId: null, branchId: t.other.id, schoolId: null }, 1);
    expect(filtered.metrics).toMatchObject({ totalSchools: 1, reconciliationProblemCount: 0, openFindingsCount: 0 });

    const mine = await getDashboard(t.branchUser, { budgetYearId: null, branchId: t.other.id, schoolId: t.otherSchool.id }, 1);
    expect(mine.metrics.totalSchools).toBe(2);
    expect(mine.schoolId).toBeNull();
    expect(mine.paged.rows.map((r) => r.name)).toEqual(["A Sekolah", "B Sekolah"]);
    expect(mine.paged.rows[0].reconciliation?.status).toBe("TIDAK_SESUAI");
    expect(mine.paged.rows[0].openFindingsCount).toBe(1);
  });
});
