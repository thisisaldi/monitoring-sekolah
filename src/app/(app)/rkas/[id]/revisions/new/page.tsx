import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EntityForm } from "@/components/app/entity-form";
import { PageHeader, Panel } from "@/components/app/ui";
import { requireUser } from "@/lib/auth/guards";
import { idParam } from "@/lib/forms";
import { getRkasForEdit } from "@/server/rkas";

import { addRevision } from "../../../actions";
import { revisionFields } from "../../../fields";

export const metadata: Metadata = { title: "Tambah Revisi RKAS" };

export default async function NewRevisionPage({ params }: PageProps<"/rkas/[id]/revisions/new">) {
  const id = idParam((await params).id) ?? notFound();
  const r = await getRkasForEdit(await requireUser(), id);
  return (
    <>
      <PageHeader
        title="Tambah Revisi RKAS"
        description={`${r.schoolName}, ${r.budgetYearName}. Nomor revisi diberikan otomatis, dan revisi tidak dapat diubah setelah disimpan.`}
      />
      <Panel className="max-w-3xl p-6">
        <EntityForm action={addRevision.bind(null, id)} cancelHref={`/rkas/${id}`} sections={[{ fields: revisionFields }]} />
      </Panel>
    </>
  );
}
