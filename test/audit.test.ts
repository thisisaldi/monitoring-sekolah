import { describe, expect, it } from "vitest";

import { listAudit } from "@/server/audit";
import { createSchool, setSchoolActive } from "@/server/master";
import { createRkas, updateRkas } from "@/server/rkas";
import { resetPassword } from "@/server/users";

import { branch, budgetYear, form, school, user } from "./factories";

const all = { entity: "", action: "" };

describe("audit log", () => {
  it("records create and the exact field changes of an update", async () => {
    const b = await branch();
    const s = await school(b.id, { name: "SD Contoh" });
    const y = await budgetYear({ name: "TA Uji" });
    const op = await user("BRANCH", { branchId: b.id });
    const central = await user("CENTRAL");

    const { id } = await createRkas(op, form({ schoolId: s.id, budgetYearId: y.id, initialAmount: "100" }));
    await updateRkas(op, id!, form({ initialAmount: "250", majorChangeDescription: "" }));
    // Saving without changes adds no entry.
    await updateRkas(op, id!, form({ initialAmount: "250", majorChangeDescription: "" }));

    const { rows } = await listAudit(central, 1, all);
    expect(rows.map((r) => r.log.action)).toEqual(["UPDATE", "CREATE"]);
    expect(rows[0].log.label).toBe("SD Contoh, TA Uji");
    expect(rows[0].log.changes).toEqual({ initialAmount: ["100.00", "250.00"] });
    expect(rows[0].log.schoolId).toBe(s.id);
  });

  it("never stores passwords and logs master-data status changes", async () => {
    const admin = await user("ADMIN");
    const target = await user("CENTRAL");
    await resetPassword(admin, target.id, form({ password: "Rahasia#2026x", passwordConfirm: "Rahasia#2026x" }));
    const b = await branch();
    await createSchool(admin, form({ branchId: b.id, code: "S-1", name: "SMP Contoh" }));
    const [{ log: created }] = (await listAudit(admin, 1, { entity: "school", action: "CREATE" })).rows;
    await setSchoolActive(admin, created.entityId!, false);

    const { rows } = await listAudit(admin, 1, all);
    expect(rows.map((r) => r.log.action)).toEqual(["DEACTIVATE", "CREATE", "PASSWORD"]);
    expect(JSON.stringify(rows)).not.toContain("pbkdf2");
    expect(rows[2].log.changes).toBeNull();
  });

  it("is visible to ADMIN and CENTRAL only", async () => {
    const b = await branch();
    await expect(listAudit(await user("BRANCH", { branchId: b.id }), 1, all)).rejects.toThrow("FORBIDDEN");
    await expect(listAudit(await user("ADMIN"), 1, all)).resolves.toBeDefined();
  });
});
