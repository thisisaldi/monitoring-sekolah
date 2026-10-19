"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import type { FormState } from "@/lib/forms";
import { flash } from "@/server/common";
import { addRkasRevision, createRkas, updateRkas } from "@/server/rkas";

export async function create(_: FormState, formData: FormData): Promise<FormState> {
  const res = await createRkas(await requireUser(), formData);
  if (!res.ok) return res;
  await flash("Data berhasil disimpan.");
  redirect(`/rkas/${res.id}`);
}

export async function update(id: number, _: FormState, formData: FormData): Promise<FormState> {
  const res = await updateRkas(await requireUser(), id, formData);
  if (!res.ok) return res;
  await flash("Perubahan berhasil disimpan.");
  redirect(`/rkas/${id}`);
}

export async function addRevision(id: number, _: FormState, formData: FormData): Promise<FormState> {
  const res = await addRkasRevision(await requireUser(), id, formData);
  if (!res.ok) return res;
  await flash(`Revisi ${res.revisionNumber} berhasil ditambahkan.`);
  redirect(`/rkas/${id}`);
}
