import type { Section } from "@/components/app/entity-form";

export const budgetYearSections: Section[] = [
  {
    fields: [
      { name: "name", label: "Nama", required: true, wide: true, placeholder: "Contoh: TA 2026/2027" },
      { name: "startDate", label: "Tanggal Mulai", type: "date", required: true },
      { name: "endDate", label: "Tanggal Selesai", type: "date", required: true },
    ],
  },
];
