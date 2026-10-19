/**
 * Login and user management (ADMIN only). No public registration exists.
 */
import "server-only";
import { and, asc, count, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { ROLES, branches, users, type Role } from "@/db/schema";
import { assertAdmin, type SessionUser } from "@/lib/auth/authz";
import { hashPassword, passwordProblems, verifyPassword } from "@/lib/auth/password";
import { f, formValues, parseForm, uniqueViolation, type FormState } from "@/lib/forms";

import { recordAudit } from "./audit";
import { orNotFound, paginate } from "./common";

/** Returns the user id when the credentials match an active account. */
export async function authenticate(username: string, password: string): Promise<number | null> {
  const [row] = await db
    .select({ id: users.id, password: users.password, isActive: users.isActive })
    .from(users)
    .where(eq(users.username, username));
  if (!row) {
    // Spend comparable time so response timing doesn't reveal valid usernames.
    await verifyPassword(password, "pbkdf2_sha256$1000000$timingsalt$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");
    return null;
  }
  const valid = await verifyPassword(password, row.password);
  return valid && row.isActive ? row.id : null;
}

const userLabel = (u: { name: string; username: string }) => `${u.name} (${u.username})`;

/** Successful sign-ins appear in the activity history too. */
export async function recordLogin(userId: number) {
  const [u] = await db.select({ name: users.name, username: users.username }).from(users).where(eq(users.id, userId));
  await recordAudit(db, { id: userId } as SessionUser, { action: "LOGIN", entity: "user", entityId: userId, label: userLabel(u) });
}

export type UserFilters = { search: string; role: string; status: string; branchId: number | null };

export async function listUsers(admin: SessionUser, page: number, filters: UserFilters) {
  assertAdmin(admin);
  const cond = and(
    filters.search ? or(ilike(users.name, `%${filters.search}%`), ilike(users.username, `%${filters.search}%`)) : undefined,
    (ROLES as readonly string[]).includes(filters.role) ? eq(users.role, filters.role as Role) : undefined,
    filters.status === "active" ? eq(users.isActive, true) : filters.status === "inactive" ? eq(users.isActive, false) : undefined,
    filters.branchId ? eq(users.branchId, filters.branchId) : undefined,
  );
  return paginate(page, db.select({ value: count() }).from(users).where(cond), (limit, offset) =>
    db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        role: users.role,
        isActive: users.isActive,
        branchName: branches.name,
      })
      .from(users)
      .leftJoin(branches, eq(branches.id, users.branchId))
      .where(cond)
      .orderBy(asc(users.username))
      .limit(limit)
      .offset(offset),
  );
}

export async function getUser(admin: SessionUser, id: number) {
  assertAdmin(admin);
  const [row] = await db
    .select({ id: users.id, name: users.name, username: users.username, role: users.role, branchId: users.branchId, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, id));
  return orNotFound(row);
}

const profileSchema = z
  .object({
    name: f.requiredText(150),
    username: f.requiredText(150),
    role: f.choice(ROLES),
    branchId: z.preprocess((v) => (v === "" || v === undefined ? null : Number(v)), z.number().int().positive().nullable()),
    isActive: f.checkbox(),
  })
  // BRANCH users need a branch; ADMIN and CENTRAL users must not have one.
  .superRefine((v, ctx) => {
    if (v.role === "BRANCH" && v.branchId === null) {
      ctx.addIssue({ code: "custom", path: ["branchId"], message: "Pengguna Cabang wajib memiliki cabang." });
    }
    if (v.role !== "BRANCH" && v.branchId !== null) {
      ctx.addIssue({ code: "custom", path: ["branchId"], message: "Hanya pengguna Cabang yang memiliki cabang." });
    }
  });

const passwordPair = (formData: FormData, user: { username?: string; name?: string }) => {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("passwordConfirm") ?? "");
  const errors: Record<string, string[]> = {};
  if (!password) errors.password = ["Wajib diisi."];
  else if (password !== confirm) errors.passwordConfirm = ["Password dan konfirmasi password tidak sama."];
  else {
    const problems = passwordProblems(password, user);
    if (problems.length) errors.password = problems;
  }
  return { password, errors };
};

function usernameTaken(e: unknown, formData: FormData): FormState {
  if (uniqueViolation(e)) return { errors: { username: ["Username sudah dipakai."] }, values: formValues(formData) };
  throw e;
}

async function branchExists(branchId: number | null) {
  if (branchId === null) return true;
  return (await db.select({ id: branches.id }).from(branches).where(eq(branches.id, branchId))).length > 0;
}

export async function createUser(admin: SessionUser, formData: FormData): Promise<FormState> {
  assertAdmin(admin);
  const parsed = parseForm(profileSchema, formData);
  const values = formValues(formData);
  delete values.password;
  delete values.passwordConfirm;
  const pw = passwordPair(formData, { username: values.username, name: values.name });
  if ("state" in parsed) return { ...parsed.state, errors: { ...parsed.state.errors, ...pw.errors }, values };
  if (Object.keys(pw.errors).length) return { errors: pw.errors, values };
  if (!(await branchExists(parsed.data.branchId))) return { errors: { branchId: ["Pilih cabang yang valid."] }, values };
  try {
    const password = await hashPassword(pw.password);
    await db.transaction(async (tx) => {
      const [row] = await tx.insert(users).values({ ...parsed.data, password }).returning();
      await recordAudit(tx, admin, { action: "CREATE", entity: "user", entityId: row.id, label: userLabel(row), after: row });
    });
    return { ok: true };
  } catch (e) {
    return usernameTaken(e, formData);
  }
}

export async function updateUser(admin: SessionUser, id: number, formData: FormData): Promise<FormState> {
  await getUser(admin, id);
  const parsed = parseForm(profileSchema, formData);
  if ("state" in parsed) return parsed.state;
  if (id === admin.id && !parsed.data.isActive) {
    return { errors: { isActive: ["Anda tidak dapat menonaktifkan akun Anda sendiri."] }, values: formValues(formData) };
  }
  // Prevents locking yourself out of administration.
  if (id === admin.id && parsed.data.role !== "ADMIN") {
    return { errors: { role: ["Anda tidak dapat mengubah peran akun Anda sendiri."] }, values: formValues(formData) };
  }
  if (!(await branchExists(parsed.data.branchId))) {
    return { errors: { branchId: ["Pilih cabang yang valid."] }, values: formValues(formData) };
  }
  try {
    await db.transaction(async (tx) => {
      const [before] = await tx.select().from(users).where(eq(users.id, id));
      const [after] = await tx.update(users).set(parsed.data).where(eq(users.id, id)).returning();
      await recordAudit(tx, admin, { action: "UPDATE", entity: "user", entityId: id, label: userLabel(after), before, after });
    });
    return { ok: true };
  } catch (e) {
    return usernameTaken(e, formData);
  }
}

export async function setUserActive(admin: SessionUser, id: number, isActive: boolean): Promise<string | null> {
  await getUser(admin, id);
  if (id === admin.id && !isActive) return "Anda tidak dapat menonaktifkan akun Anda sendiri.";
  await db.transaction(async (tx) => {
    const [row] = await tx.update(users).set({ isActive }).where(eq(users.id, id)).returning();
    await recordAudit(tx, admin, { action: isActive ? "ACTIVATE" : "DEACTIVATE", entity: "user", entityId: id, label: userLabel(row) });
  });
  return null;
}

export async function resetPassword(admin: SessionUser, id: number, formData: FormData): Promise<FormState> {
  const target = await getUser(admin, id);
  const pw = passwordPair(formData, target);
  if (Object.keys(pw.errors).length) return { errors: pw.errors };
  const password = await hashPassword(pw.password);
  await db.transaction(async (tx) => {
    await tx.update(users).set({ password }).where(eq(users.id, id));
    // Records that the password changed, never the value.
    await recordAudit(tx, admin, { action: "PASSWORD", entity: "user", entityId: id, label: userLabel(target) });
  });
  return { ok: true };
}
