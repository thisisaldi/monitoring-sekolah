"use server";

import { redirect } from "next/navigation";

import { createSession, destroySession } from "@/lib/auth/session";
import type { FormState } from "@/lib/forms";
import { authenticate, recordLogin } from "@/server/users";

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const userId = username && password ? await authenticate(username, password) : null;
  if (!userId) {
    return { formError: "Username atau password salah, atau akun tidak aktif.", values: { username } };
  }
  await createSession(userId);
  await recordLogin(userId);
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
