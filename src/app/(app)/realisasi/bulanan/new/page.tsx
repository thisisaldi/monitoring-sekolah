import type { Metadata } from "next";

import { NewRecordPage } from "@/components/app/record-pages";

import { createMonthlyAction } from "../../actions";
import { monthField, monthlyFields } from "../../fields";

export const metadata: Metadata = { title: "Tambah Realisasi Bulanan" };

export default function Page() {
  return (
    <NewRecordPage
      title="Tambah Realisasi Bulanan"
      action={createMonthlyAction}
      cancelHref="/realisasi/bulanan"
      periodFields={[monthField]}
      sections={[{ title: "Realisasi", fields: monthlyFields }]}
    />
  );
}
