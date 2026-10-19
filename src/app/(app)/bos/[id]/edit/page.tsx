import type { Metadata } from "next";

import { EditAnnualPage } from "@/components/app/annual-pages";

export const metadata: Metadata = { title: "Ubah Data BOS" };

export default function Page({ params }: PageProps<"/bos/[id]/edit">) {
  return <EditAnnualPage module="bos" params={params} />;
}
