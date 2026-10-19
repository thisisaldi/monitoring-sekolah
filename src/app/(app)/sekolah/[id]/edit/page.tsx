import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EntityForm } from "@/components/app/entity-form";
import { initialOf } from "@/components/app/fields";
import { PageHeader, Panel } from "@/components/app/ui";
import { requireUser } from "@/lib/auth/guards";
import { idParam } from "@/lib/forms";
import { branchOptions, getSchool } from "@/server/master";

import { update } from "../../actions";
import { schoolSections } from "../../form";

export const metadata: Metadata = { title: "Ubah Sekolah" };

export default async function Page({ params }: PageProps<"/sekolah/[id]/edit">) {
  const id = idParam((await params).id) ?? notFound();
  const school = await getSchool(await requireUser(), id);
  return (
    <>
      <PageHeader title="Ubah Sekolah" description={school.name} />
      <Panel className="max-w-3xl p-6">
        <EntityForm
          action={update.bind(null, id)}
          cancelHref="/sekolah"
          initial={initialOf(school)}
          sections={schoolSections(await branchOptions(school.branchId))}
        />
      </Panel>
    </>
  );
}
