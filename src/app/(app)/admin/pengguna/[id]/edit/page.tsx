import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EntityForm } from "@/components/app/entity-form";
import { initialOf } from "@/components/app/fields";
import { PageHeader, Panel } from "@/components/app/ui";
import { requireUser } from "@/lib/auth/guards";
import { idParam } from "@/lib/forms";
import { branchOptions } from "@/server/master";
import { getUser } from "@/server/users";

import { update } from "../../actions";
import { userSections } from "../../fields";

export const metadata: Metadata = { title: "Ubah Pengguna" };

export default async function Page({ params }: PageProps<"/admin/pengguna/[id]/edit">) {
  const id = idParam((await params).id) ?? notFound();
  const target = await getUser(await requireUser(), id);
  return (
    <>
      <PageHeader title="Ubah Pengguna" description={`${target.name} (${target.username})`} />
      <Panel className="max-w-3xl p-6">
        <EntityForm
          action={update.bind(null, id)}
          cancelHref="/admin/pengguna"
          initial={initialOf(target)}
          sections={userSections(await branchOptions(target.branchId ?? undefined), false)}
        />
      </Panel>
    </>
  );
}
