import type { Metadata } from "next";

import { EntityForm } from "@/components/app/entity-form";
import { PageHeader, Panel } from "@/components/app/ui";
import { requireCentral } from "@/lib/auth/guards";

import { create } from "../actions";
import { budgetYearSections } from "../fields";

export const metadata: Metadata = { title: "Tambah Tahun Anggaran" };

export default async function Page() {
  await requireCentral();
  return (
    <>
      <PageHeader title="Tambah Tahun Anggaran" />
      <Panel className="max-w-3xl p-6">
        <EntityForm action={create} cancelHref="/tahun-anggaran" sections={budgetYearSections} />
      </Panel>
    </>
  );
}
