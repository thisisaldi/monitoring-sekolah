import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EntityForm } from "@/components/app/entity-form";
import { initialOf } from "@/components/app/fields";
import { PageHeader, Panel } from "@/components/app/ui";
import { requireUser } from "@/lib/auth/guards";
import { idParam } from "@/lib/forms";
import { getBranch } from "@/server/master";

import { update } from "../../actions";
import { branchSections } from "../../fields";

export const metadata: Metadata = { title: "Ubah Cabang" };

export default async function Page({ params }: PageProps<"/admin/cabang/[id]/edit">) {
  const id = idParam((await params).id) ?? notFound();
  const branch = await getBranch(await requireUser(), id);
  return (
    <>
      <PageHeader title="Ubah Cabang" description={branch.name} />
      <Panel className="max-w-3xl p-6">
        <EntityForm action={update.bind(null, id)} cancelHref="/admin/cabang" initial={initialOf(branch)} sections={branchSections} />
      </Panel>
    </>
  );
}
