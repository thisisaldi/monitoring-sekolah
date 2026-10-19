/**
 * Single source of truth for role and branch-scope checks (AI.md section 4).
 * Every page, action and service uses these instead of inlining role checks.
 *
 * - ADMIN: everything CENTRAL can, plus user and branch management.
 * - CENTRAL reads everything, manages schools and budget years, modifies no operational data.
 * - BRANCH reads and modifies only its own branch's schools' data.
 */
import { forbidden } from "next/navigation";

import type { Role } from "@/db/schema";

export type SessionUser = {
  id: number;
  name: string;
  username: string;
  role: Role;
  branchId: number | null;
  branchName: string | null;
};

/** Organization-wide (read-everything) scope: CENTRAL and ADMIN. */
export const isCentral = (u: SessionUser) => u.role === "CENTRAL" || u.role === "ADMIN";
export const isBranch = (u: SessionUser) => u.role === "BRANCH";
export const isAdmin = (u: SessionUser) => u.role === "ADMIN";

export const canAccessBranch = (u: SessionUser, branchId: number) =>
  isCentral(u) || (isBranch(u) && u.branchId === branchId);

export const canModifyBranchData = (u: SessionUser, branchId: number) =>
  isBranch(u) && u.branchId === branchId;

export function assertCentral(u: SessionUser) {
  if (!isCentral(u)) forbidden();
}

export function assertBranch(u: SessionUser): asserts u is SessionUser & { branchId: number } {
  if (!isBranch(u) || u.branchId === null) forbidden();
}

export function assertAdmin(u: SessionUser) {
  if (!isAdmin(u)) forbidden();
}

export function assertCanAccess(u: SessionUser, branchId: number) {
  if (!canAccessBranch(u, branchId)) forbidden();
}

export function assertCanModify(u: SessionUser, branchId: number) {
  if (!canModifyBranchData(u, branchId)) forbidden();
}

/** Branch filter for list queries: null means "all branches" (CENTRAL). */
export const scopeBranchId = (u: SessionUser): number | null => (isCentral(u) ? null : u.branchId ?? -1);
