"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import type { FormState } from "@/lib/forms";
import { flash } from "@/server/common";
import { createBranch, setBranchActive, updateBranch } from "@/server/master";

export async function create(_: FormState, formData: FormData): Promise<FormState> {
  const res = await createBranch(await requireUser(), formData);
  if (!res.ok) return res;
  await flash("Data berhasil disimpan.");
  redirect("/admin/cabang");
}

export async function update(id: number, _: FormState, formData: FormData): Promise<FormState> {
  const res = await updateBranch(await requireUser(), id, formData);
  if (!res.ok) return res;
  await flash("Perubahan berhasil disimpan.");
  redirect("/admin/cabang");
}

export async function setActive(id: number, isActive: boolean) {
  await setBranchActive(await requireUser(), id, isActive);
  await flash(isActive ? "Cabang berhasil diaktifkan." : "Cabang berhasil dinonaktifkan.");
  revalidatePath("/admin/cabang");
}
