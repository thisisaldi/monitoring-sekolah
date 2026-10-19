import { describe, expect, it } from "vitest";

import { getDashboard } from "@/server/dashboard";
import { listBranches } from "@/server/master";
import { createUser, listUsers, updateUser } from "@/server/users";

import { branch, form, user } from "./factories";

const noFilters = { search: "", role: "", status: "", branchId: null };
const strongPw = { password: "Rahasia#2026x", passwordConfirm: "Rahasia#2026x" };

describe("roles", () => {
  it("only ADMIN manages users and branches", async () => {
    const central = await user("CENTRAL");
    const admin = await user("ADMIN");
    await expect(listUsers(central, 1, noFilters)).rejects.toThrow("FORBIDDEN");
    await expect(listBranches(central, 1)).rejects.toThrow("FORBIDDEN");
    expect((await listUsers(admin, 1, noFilters)).total).toBe(2);
  });

  it("ADMIN reads organization-wide like CENTRAL", async () => {
    const admin = await user("ADMIN");
    await branch();
    const d = await getDashboard(admin, { budgetYearId: null, branchId: null, schoolId: null }, 1);
    expect(d.isCentral).toBe(true);
    expect(d.metrics.totalBranches).toBe(1);
  });

  it("ADMIN can create another admin; branch rules follow the role", async () => {
    const admin = await user("ADMIN");
    const b = await branch();
    expect((await createUser(admin, form({ name: "Admin Dua", username: "admin2", role: "ADMIN", ...strongPw }))).ok).toBe(true);
    const bad = await createUser(admin, form({ name: "Admin Tiga", username: "admin3", role: "ADMIN", branchId: b.id, ...strongPw }));
    expect(bad.errors?.branchId).toBeDefined();
    const noBranch = await createUser(admin, form({ name: "Cabang", username: "cab1", role: "BRANCH", ...strongPw }));
    expect(noBranch.errors?.branchId).toBeDefined();
  });

  it("an admin cannot demote or deactivate themselves", async () => {
    const admin = await user("ADMIN");
    const res = await updateUser(admin, admin.id, form({ name: admin.name, username: admin.username, role: "CENTRAL", isActive: "on" }));
    expect(res.errors?.role).toBeDefined();
    const off = await updateUser(admin, admin.id, form({ name: admin.name, username: admin.username, role: "ADMIN" }));
    expect(off.errors?.isActive).toBeDefined();
  });
});
