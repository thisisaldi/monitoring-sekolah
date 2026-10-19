"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import type { FormState } from "@/lib/forms";
import { flash } from "@/server/common";
import { createFinding, updateFinding } from "@/server/findings";

export async function create(_: FormState, formData: FormData): Promise<FormState> {
  const res = await createFinding(await requireUser(), formData);
  if (!res.ok) return res;
  await flash("Data berhasil disimpan.");
  redirect("/temuan");
}

export async function update(id: number, _: FormState, formData: FormData): Promise<FormState> {
  const res = await updateFinding(await requireUser(), id, formData);
  if (!res.ok) return res;
  await flash("Perubahan berhasil disimpan.");
  redirect("/temuan");
}
