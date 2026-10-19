"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import type { FormState } from "@/lib/forms";
import { flash } from "@/server/common";
import { createUser, resetPassword, setUserActive, updateUser } from "@/server/users";

export async function create(_: FormState, formData: FormData): Promise<FormState> {
  const res = await createUser(await requireUser(), formData);
  if (!res.ok) return res;
  await flash("Pengguna berhasil dibuat.");
  redirect("/admin/pengguna");
}

export async function update(id: number, _: FormState, formData: FormData): Promise<FormState> {
  const res = await updateUser(await requireUser(), id, formData);
  if (!res.ok) return res;
  await flash("Perubahan berhasil disimpan.");
  redirect("/admin/pengguna");
}

export async function changePassword(id: number, _: FormState, formData: FormData): Promise<FormState> {
  const res = await resetPassword(await requireUser(), id, formData);
  if (!res.ok) return res;
  await flash("Password pengguna berhasil diubah.");
  redirect("/admin/pengguna");
}

export async function setActive(id: number, isActive: boolean) {
  const error = await setUserActive(await requireUser(), id, isActive);
  await flash(error ?? (isActive ? "Pengguna berhasil diaktifkan." : "Pengguna berhasil dinonaktifkan."));
  revalidatePath("/admin/pengguna");
}
