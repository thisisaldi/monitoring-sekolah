import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";

import { db } from "@/db";
import { branches, sessions, users } from "@/db/schema";
import type { SessionUser } from "./authz";

const COOKIE = "session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // Django's default session age

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + MAX_AGE_SECONDS * 1000);
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt });
  await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, userId));
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  store.delete(COOKIE);
}

/** The signed-in, active user for this request, or null. Deduplicated per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      role: users.role,
      branchId: users.branchId,
      branchName: branches.name,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .leftJoin(branches, eq(branches.id, users.branchId))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date()), eq(users.isActive, true)));
  return row ?? null;
});
