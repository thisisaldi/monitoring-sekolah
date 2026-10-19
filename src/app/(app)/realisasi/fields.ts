import type { FieldDef } from "@/components/app/entity-form";
import { reportStatusField } from "@/components/app/fields";
import { MONTH_NAMES, SCHOOL_YEAR_MONTH_ORDER } from "@/lib/format";

export const monthField: FieldDef = {
  name: "month",
  label: "Bulan",
  type: "select",
  required: true,
  placeholder: "Pilih bulan",
  // School-year order (July to June); the stored value is the calendar month.
  options: SCHOOL_YEAR_MONTH_ORDER.map((m) => ({ value: String(m), label: MONTH_NAMES[m] })),
};

export const monthlyFields: FieldDef[] = [
  { name: "budgetAmount", label: "Anggaran", type: "money", required: true },
  { name: "realizationAmount", label: "Realisasi", type: "money", required: true },
  reportStatusField,
  { name: "varianceExplanation", label: "Penjelasan Selisih", type: "textarea" },
];

export const semesterField: FieldDef = {
  name: "semester",
  label: "Semester",
  type: "select",
  required: true,
  options: [
    { value: "1", label: "Semester 1" },
    { value: "2", label: "Semester 2" },
  ],
};

export const semesterFields: FieldDef[] = [
  { name: "realizationAmount", label: "Realisasi", type: "money", required: true, wide: true },
  { name: "evaluationNote", label: "Catatan Evaluasi", type: "textarea" },
];
