import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { initialOf } from "@/components/app/fields";
import { EditRecordPage } from "@/components/app/record-pages";
import { requireUser } from "@/lib/auth/guards";
import { MONTH_NAMES } from "@/lib/format";
import { idParam } from "@/lib/forms";
import { getMonthlyForEdit } from "@/server/realizations";

import { updateMonthlyAction } from "../../../actions";
import { monthlyFields } from "../../../fields";

export const metadata: Metadata = { title: "Ubah Realisasi Bulanan" };

export default async function Page({ params }: PageProps<"/realisasi/bulanan/[id]/edit">) {
  const id = idParam((await params).id) ?? notFound();
  const { record, schoolName, budgetYearName } = await getMonthlyForEdit(await requireUser(), id);
  return (
    <EditRecordPage
      title="Ubah Realisasi Bulanan"
      description={`${schoolName}, ${MONTH_NAMES[record.month]}, ${budgetYearName}. Sekolah, tahun anggaran dan bulan tidak dapat diubah.`}
      action={updateMonthlyAction.bind(null, id)}
      cancelHref="/realisasi/bulanan"
      initial={initialOf(record, ["budgetAmount", "realizationAmount"])}
      sections={[{ fields: monthlyFields }]}
    />
  );
}
