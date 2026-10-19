"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import type { FormState } from "@/lib/forms";
import { createAnnual, updateAnnual, type AnnualModule } from "@/server/annual";
import { flash } from "@/server/common";

const PATHS: Record<AnnualModule, string> = { bos: "/bos", receivables: "/piutang", reconciliation: "/rekonsiliasi" };

export async function createAnnualAction(module: AnnualModule, _: FormState, formData: FormData): Promise<FormState> {
  const res = await createAnnual(module, await requireUser(), formData);
  if (!res.ok) return res;
  await flash("Data berhasil disimpan.");
  redirect(PATHS[module]);
}

export async function updateAnnualAction(module: AnnualModule, id: number, _: FormState, formData: FormData): Promise<FormState> {
  const res = await updateAnnual(module, await requireUser(), id, formData);
  if (!res.ok) return res;
  await flash("Perubahan berhasil disimpan.");
  redirect(PATHS[module]);
}
