import "server-only";
import { redirect } from "next/navigation";

import { assertAdmin, assertBranch, assertCentral, type SessionUser } from "./authz";
import { getCurrentUser } from "./session";

/** Anonymous visitors are redirected to the login page. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireCentral() {
  const user = await requireUser();
  assertCentral(user);
  return user;
}

export async function requireBranch() {
  const user = await requireUser();
  assertBranch(user);
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  assertAdmin(user);
  return user;
}
