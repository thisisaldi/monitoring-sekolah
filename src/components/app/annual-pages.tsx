import { notFound } from "next/navigation";

import { ANNUAL } from "@/app/(app)/annual-fields";
import { createAnnualAction, updateAnnualAction } from "@/app/(app)/annual";
import { requireUser } from "@/lib/auth/guards";
import { idParam } from "@/lib/forms";
import { getAnnualForEdit, type AnnualModule } from "@/server/annual";

import { initialOf } from "./fields";
import { EditRecordPage, NewRecordPage } from "./record-pages";

export function NewAnnualPage({ module }: { module: AnnualModule }) {
  const m = ANNUAL[module];
  return (
    <NewRecordPage
      title={`Tambah Data ${m.title}`}
      action={createAnnualAction.bind(null, module)}
      cancelHref={m.path}
      sections={m.sections}
    />
  );
}

export async function EditAnnualPage({ module, params }: { module: AnnualModule; params: Promise<{ id: string }> }) {
  const id = idParam((await params).id) ?? notFound();
  const m = ANNUAL[module];
  const { record, schoolName, budgetYearName } = await getAnnualForEdit(module, await requireUser(), id);
  return (
    <EditRecordPage
      title={`Ubah Data ${m.title}`}
      description={`${schoolName}, ${budgetYearName}. Sekolah dan tahun anggaran tidak dapat diubah.`}
      action={updateAnnualAction.bind(null, module, id)}
      cancelHref={m.path}
      initial={initialOf(record, m.money)}
      sections={m.sections}
    />
  );
}
