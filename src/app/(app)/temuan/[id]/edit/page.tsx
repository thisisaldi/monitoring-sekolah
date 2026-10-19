import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { initialOf } from "@/components/app/fields";
import { EditRecordPage } from "@/components/app/record-pages";
import { requireUser } from "@/lib/auth/guards";
import { idParam } from "@/lib/forms";
import { getFindingForEdit } from "@/server/findings";

import { update } from "../../actions";
import { findingSections } from "../../shared";

export const metadata: Metadata = { title: "Ubah Temuan" };

export default async function Page({ params }: PageProps<"/temuan/[id]/edit">) {
  const id = idParam((await params).id) ?? notFound();
  const { record, schoolName } = await getFindingForEdit(await requireUser(), id);
  return (
    <EditRecordPage
      title="Ubah Temuan"
      description={`${schoolName}. Sekolah tidak dapat diubah.`}
      action={update.bind(null, id)}
      cancelHref="/temuan"
      initial={initialOf(record, ["amount"])}
      sections={findingSections}
    />
  );
}
