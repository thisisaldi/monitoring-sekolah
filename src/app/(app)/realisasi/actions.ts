"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import type { FormState } from "@/lib/forms";
import { flash } from "@/server/common";
import { createMonthly, createSemester, updateMonthly, updateSemester } from "@/server/realizations";

async function done(res: FormState, message: string, to: string): Promise<FormState> {
  if (!res.ok) return res;
  await flash(message);
  redirect(to);
}

export async function createMonthlyAction(_: FormState, formData: FormData) {
  return done(await createMonthly(await requireUser(), formData), "Data berhasil disimpan.", "/realisasi/bulanan");
}

export async function updateMonthlyAction(id: number, _: FormState, formData: FormData) {
  return done(await updateMonthly(await requireUser(), id, formData), "Perubahan berhasil disimpan.", "/realisasi/bulanan");
}

export async function createSemesterAction(_: FormState, formData: FormData) {
  return done(await createSemester(await requireUser(), formData), "Data berhasil disimpan.", "/realisasi/semester");
}

export async function updateSemesterAction(id: number, _: FormState, formData: FormData) {
  return done(await updateSemester(await requireUser(), id, formData), "Perubahan berhasil disimpan.", "/realisasi/semester");
}
