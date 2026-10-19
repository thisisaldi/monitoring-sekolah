import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EntityForm } from "@/components/app/entity-form";
import { initialOf } from "@/components/app/fields";
import { PageHeader, Panel } from "@/components/app/ui";
import { requireUser } from "@/lib/auth/guards";
import { idParam } from "@/lib/forms";
import { getBudgetYear } from "@/server/master";

import { update } from "../../actions";
import { budgetYearSections } from "../../fields";

export const metadata: Metadata = { title: "Ubah Tahun Anggaran" };

export default async function Page({ params }: PageProps<"/tahun-anggaran/[id]/edit">) {
  const id = idParam((await params).id) ?? notFound();
  const year = await getBudgetYear(await requireUser(), id);
  return (
    <>
      <PageHeader title="Ubah Tahun Anggaran" description={year.name} />
      <Panel className="max-w-3xl p-6">
        <EntityForm action={update.bind(null, id)} cancelHref="/tahun-anggaran" initial={initialOf(year)} sections={budgetYearSections} />
      </Panel>
    </>
  );
}
