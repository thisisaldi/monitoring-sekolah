import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EntityForm } from "@/components/app/entity-form";
import { initialOf } from "@/components/app/fields";
import { PageHeader, Panel } from "@/components/app/ui";
import { requireUser } from "@/lib/auth/guards";
import { idParam } from "@/lib/forms";
import { getRkasForEdit } from "@/server/rkas";

import { update } from "../../actions";
import { rkasFields } from "../../fields";

export const metadata: Metadata = { title: "Ubah RKAS" };

export default async function EditRkasPage({ params }: PageProps<"/rkas/[id]/edit">) {
  const id = idParam((await params).id) ?? notFound();
  const r = await getRkasForEdit(await requireUser(), id);
  return (
    <>
      <PageHeader
        title="Ubah RKAS"
        description={`${r.schoolName}, ${r.budgetYearName}. Sekolah dan tahun anggaran tidak dapat diubah.`}
      />
      <Panel className="max-w-3xl p-6">
        <EntityForm
          action={update.bind(null, id)}
          cancelHref={`/rkas/${id}`}
          initial={initialOf(r, ["initialAmount"])}
          sections={[{ fields: rkasFields }]}
        />
      </Panel>
    </>
  );
}
