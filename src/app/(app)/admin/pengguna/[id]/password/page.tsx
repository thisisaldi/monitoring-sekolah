import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EntityForm } from "@/components/app/entity-form";
import { PageHeader, Panel } from "@/components/app/ui";
import { requireUser } from "@/lib/auth/guards";
import { idParam } from "@/lib/forms";
import { getUser } from "@/server/users";

import { changePassword } from "../../actions";
import { passwordFields } from "../../fields";

export const metadata: Metadata = { title: "Ubah Password" };

export default async function Page({ params }: PageProps<"/admin/pengguna/[id]/password">) {
  const id = idParam((await params).id) ?? notFound();
  const target = await getUser(await requireUser(), id);
  return (
    <>
      <PageHeader title="Ubah Password" description={`${target.name} (${target.username})`} />
      <Panel className="max-w-3xl p-6">
        <EntityForm
          action={changePassword.bind(null, id)}
          cancelHref="/admin/pengguna"
          submitLabel="Simpan Password"
          sections={[{ fields: passwordFields }]}
        />
      </Panel>
    </>
  );
}
