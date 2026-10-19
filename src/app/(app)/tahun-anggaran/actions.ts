"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import type { FormState } from "@/lib/forms";
import { flash } from "@/server/common";
import { createBudgetYear, setBudgetYearActive, updateBudgetYear } from "@/server/master";

export async function create(_: FormState, formData: FormData): Promise<FormState> {
  const res = await createBudgetYear(await requireUser(), formData);
  if (!res.ok) return res;
  await flash("Data berhasil disimpan.");
  redirect("/tahun-anggaran");
}

export async function update(id: number, _: FormState, formData: FormData): Promise<FormState> {
  const res = await updateBudgetYear(await requireUser(), id, formData);
  if (!res.ok) return res;
  await flash("Perubahan berhasil disimpan.");
  redirect("/tahun-anggaran");
}

export async function setActive(id: number, isActive: boolean) {
  await setBudgetYearActive(await requireUser(), id, isActive);
  await flash(isActive ? "Tahun anggaran berhasil diaktifkan." : "Tahun anggaran berhasil dinonaktifkan.");
  revalidatePath("/tahun-anggaran");
}
