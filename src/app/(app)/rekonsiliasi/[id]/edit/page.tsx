import type { Metadata } from "next";

import { EditAnnualPage } from "@/components/app/annual-pages";

export const metadata: Metadata = { title: "Ubah Data Rekonsiliasi" };

export default function Page({ params }: PageProps<"/rekonsiliasi/[id]/edit">) {
  return <EditAnnualPage module="reconciliation" params={params} />;
}
