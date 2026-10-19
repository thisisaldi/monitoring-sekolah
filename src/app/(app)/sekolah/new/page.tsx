import type { Metadata } from "next";

import { EntityForm } from "@/components/app/entity-form";
import { PageHeader, Panel } from "@/components/app/ui";
import { requireCentral } from "@/lib/auth/guards";
import { branchOptions } from "@/server/master";

import { create } from "../actions";
import { schoolSections } from "../form";

export const metadata: Metadata = { title: "Tambah Sekolah" };

export default async function Page() {
  await requireCentral();
  return (
    <>
      <PageHeader title="Tambah Sekolah" />
      <Panel className="max-w-3xl p-6">
        <EntityForm action={create} cancelHref="/sekolah" sections={schoolSections(await branchOptions())} />
      </Panel>
    </>
  );
}
