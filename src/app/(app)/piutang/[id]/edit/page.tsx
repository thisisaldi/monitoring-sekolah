import type { Metadata } from "next";

import { EditAnnualPage } from "@/components/app/annual-pages";

export const metadata: Metadata = { title: "Ubah Data Piutang" };

export default function Page({ params }: PageProps<"/piutang/[id]/edit">) {
  return <EditAnnualPage module="receivables" params={params} />;
}
