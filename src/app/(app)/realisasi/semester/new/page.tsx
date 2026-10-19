import type { Metadata } from "next";

import { NewRecordPage } from "@/components/app/record-pages";

import { createSemesterAction } from "../../actions";
import { semesterField, semesterFields } from "../../fields";

export const metadata: Metadata = { title: "Tambah Realisasi Semester" };

export default function Page() {
  return (
    <NewRecordPage
      title="Tambah Realisasi Semester"
      action={createSemesterAction}
      cancelHref="/realisasi/semester"
      periodFields={[semesterField]}
      sections={[{ title: "Realisasi", fields: semesterFields }]}
    />
  );
}
