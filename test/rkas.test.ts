import { describe, expect, it } from "vitest";

import { addRkasRevision, createRkas, getRkasDetail, listRkas, updateRkas } from "@/server/rkas";

import { branch, budgetYear, form, school, user } from "./factories";

async function setup() {
  const own = await branch();
  const other = await branch();
  const ownSchool = await school(own.id);
  const secondSchool = await school(own.id);
  const otherSchool = await school(other.id);
  const year = await budgetYear();
  const branchUser = await user("BRANCH", { branchId: own.id });
  const otherUser = await user("BRANCH", { branchId: other.id });
  const central = await user("CENTRAL");
  return { own, ownSchool, secondSchool, otherSchool, year, branchUser, otherUser, central };
}

describe("RKAS", () => {
  it("branch user creates RKAS for any of their own schools", async () => {
    const t = await setup();
    const res = await createRkas(t.branchUser, form({ schoolId: t.secondSchool.id, budgetYearId: t.year.id, initialAmount: "50.000.000" }));
    expect(res.ok).toBe(true);
    const detail = await getRkasDetail(t.branchUser, res.id!);
    expect(detail.initialAmount).toBe("50000000.00");
    expect(detail.currentAmount).toBe(5_000_000_000n);
  });

  it("rejects another branch's school id submitted by POST manipulation", async () => {
    const t = await setup();
    const res = await createRkas(t.branchUser, form({ schoolId: t.otherSchool.id, budgetYearId: t.year.id, initialAmount: "1" }));
    expect(res.errors?.schoolId).toBeDefined();
    expect((await listRkas(t.central, 1)).total).toBe(0);
  });

  it("central cannot create, edit or add revisions", async () => {
    const t = await setup();
    await expect(createRkas(t.central, form({ schoolId: t.ownSchool.id, budgetYearId: t.year.id, initialAmount: "1" }))).rejects.toThrow("FORBIDDEN");
    const { id } = await createRkas(t.branchUser, form({ schoolId: t.ownSchool.id, budgetYearId: t.year.id, initialAmount: "1" }));
    await expect(updateRkas(t.central, id!, form({ initialAmount: "2" }))).rejects.toThrow("FORBIDDEN");
    await expect(addRkasRevision(t.central, id!, form({ amount: "2", revisionDate: "2026-08-01" }))).rejects.toThrow("FORBIDDEN");
  });

  it("is unique per school and budget year", async () => {
    const t = await setup();
    const values = { schoolId: t.ownSchool.id, budgetYearId: t.year.id, initialAmount: "1" };
    await createRkas(t.branchUser, form(values));
    const dup = await createRkas(t.branchUser, form(values));
    expect(dup.formError).toMatch(/sudah ada/);
  });

  it("current amount follows the latest revision, numbers assigned in sequence", async () => {
    const t = await setup();
    const { id } = await createRkas(t.branchUser, form({ schoolId: t.ownSchool.id, budgetYearId: t.year.id, initialAmount: "100" }));
    expect((await addRkasRevision(t.branchUser, id!, form({ amount: "150", revisionDate: "2026-08-01" }))).revisionNumber).toBe(1);
    expect((await addRkasRevision(t.branchUser, id!, form({ amount: "120", revisionDate: "2026-09-01" }))).revisionNumber).toBe(2);
    const detail = await getRkasDetail(t.central, id!);
    expect(detail.currentAmount).toBe(12_000n);
    expect(detail.canModify).toBe(false);
    const list = await listRkas(t.central, 1);
    expect(list.rows[0].currentAmount).toBe(12_000n);
  });

  it("other branch cannot view, edit or revise", async () => {
    const t = await setup();
    const { id } = await createRkas(t.branchUser, form({ schoolId: t.ownSchool.id, budgetYearId: t.year.id, initialAmount: "1" }));
    await expect(getRkasDetail(t.otherUser, id!)).rejects.toThrow("FORBIDDEN");
    await expect(updateRkas(t.otherUser, id!, form({ initialAmount: "9" }))).rejects.toThrow("FORBIDDEN");
    await expect(addRkasRevision(t.otherUser, id!, form({ amount: "9", revisionDate: "2026-08-01" }))).rejects.toThrow("FORBIDDEN");
    expect((await listRkas(t.otherUser, 1)).total).toBe(0);
    expect((await listRkas(t.branchUser, 1)).total).toBe(1);
  });

  it("rejects negative amounts and inactive budget years", async () => {
    const t = await setup();
    const inactive = await budgetYear({ isActive: false });
    const neg = await createRkas(t.branchUser, form({ schoolId: t.ownSchool.id, budgetYearId: t.year.id, initialAmount: "-5" }));
    expect(neg.errors?.initialAmount).toBeDefined();
    const old = await createRkas(t.branchUser, form({ schoolId: t.ownSchool.id, budgetYearId: inactive.id, initialAmount: "5" }));
    expect(old.errors?.budgetYearId).toBeDefined();
  });
});
