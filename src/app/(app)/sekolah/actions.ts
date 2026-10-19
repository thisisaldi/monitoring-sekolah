"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import type { FormState } from "@/lib/forms";
import { flash } from "@/server/common";
import { createSchool, setSchoolActive, updateSchool } from "@/server/master";

export async function create(_: FormState, formData: FormData): Promise<FormState> {
  const res = await createSchool(await requireUser(), formData);
  if (!res.ok) return res;
  await flash("Data berhasil disimpan.");
  redirect("/sekolah");
}

export async function update(id: number, _: FormState, formData: FormData): Promise<FormState> {
  const res = await updateSchool(await requireUser(), id, formData);
  if (!res.ok) return res;
  await flash("Perubahan berhasil disimpan.");
  redirect("/sekolah");
}

export async function setActive(id: number, isActive: boolean) {
  await setSchoolActive(await requireUser(), id, isActive);
  await flash(isActive ? "Sekolah berhasil diaktifkan." : "Sekolah berhasil dinonaktifkan.");
  revalidatePath("/sekolah");
}
