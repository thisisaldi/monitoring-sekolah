import type { Metadata } from "next";

import { NewAnnualPage } from "@/components/app/annual-pages";

export const metadata: Metadata = { title: "Tambah Data BOS" };

export default function Page() {
  return <NewAnnualPage module="bos" />;
}
