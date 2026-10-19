import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { initialOf } from "@/components/app/fields";
import { EditRecordPage } from "@/components/app/record-pages";
import { requireUser } from "@/lib/auth/guards";
import { idParam } from "@/lib/forms";
import { getSemesterForEdit } from "@/server/realizations";

import { updateSemesterAction } from "../../../actions";
import { semesterFields } from "../../../fields";

export const metadata: Metadata = { title: "Ubah Realisasi Semester" };

export default async function Page({ params }: PageProps<"/realisasi/semester/[id]/edit">) {
  const id = idParam((await params).id) ?? notFound();
  const { record, schoolName, budgetYearName } = await getSemesterForEdit(await requireUser(), id);
  return (
    <EditRecordPage
      title="Ubah Realisasi Semester"
      description={`${schoolName}, Semester ${record.semester}, ${budgetYearName}.`}
      action={updateSemesterAction.bind(null, id)}
      cancelHref="/realisasi/semester"
      initial={initialOf(record, ["realizationAmount"])}
      sections={[{ fields: semesterFields }]}
    />
  );
}
