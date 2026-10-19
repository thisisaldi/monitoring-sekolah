import type { Metadata } from "next";

import { EntityForm } from "@/components/app/entity-form";
import { PageHeader, Panel } from "@/components/app/ui";
import { requireAdmin } from "@/lib/auth/guards";

import { create } from "../actions";
import { branchSections } from "../fields";

export const metadata: Metadata = { title: "Tambah Cabang" };

export default async function Page() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Tambah Cabang" />
      <Panel className="max-w-3xl p-6">
        <EntityForm
          action={create}
          cancelHref="/admin/cabang"
          initial={{ type: "CABANG", isActive: "true" }}
          sections={branchSections}
        />
      </Panel>
    </>
  );
}
