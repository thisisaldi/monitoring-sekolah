import type { Metadata } from "next";

import { EntityForm } from "@/components/app/entity-form";
import { PageHeader, Panel } from "@/components/app/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { branchOptions } from "@/server/master";

import { create } from "../actions";
import { userSections } from "../fields";

export const metadata: Metadata = { title: "Tambah Pengguna" };

export default async function Page() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Tambah Pengguna" description="Admin mengelola pengguna dan cabang; Pusat memantau semua data; Cabang menginput data sekolahnya." />
      <Panel className="max-w-3xl p-6">
        <EntityForm
          action={create}
          cancelHref="/admin/pengguna"
          initial={{ isActive: "true", role: "BRANCH" }}
          sections={userSections(await branchOptions(), true)}
        />
      </Panel>
    </>
  );
}
