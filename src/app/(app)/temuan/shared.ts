import type { Section } from "@/components/app/entity-form";

export const findingSections: Section[] = [
  {
    title: "Temuan",
    fields: [
      { name: "findingDate", label: "Tanggal Temuan", type: "date", required: true },
      { name: "source", label: "Sumber", required: true, placeholder: "Contoh: Audit internal" },
      { name: "finding", label: "Uraian Temuan", type: "textarea", required: true },
      { name: "amount", label: "Nilai Temuan", type: "money", help: "Kosongkan jika tidak bernilai uang." },
      { name: "risk", label: "Risiko" },
    ],
  },
  {
    title: "Tindak Lanjut",
    fields: [
      { name: "recommendation", label: "Rekomendasi", type: "textarea", required: true },
      { name: "pic", label: "Penanggung Jawab (PIC)", required: true },
      { name: "deadline", label: "Batas Waktu", type: "date", required: true },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "OPEN", label: "Terbuka" },
          { value: "ON_PROGRESS", label: "Proses" },
          { value: "COMPLETED", label: "Selesai" },
        ],
      },
      { name: "completedDate", label: "Tanggal Selesai", type: "date", help: "Wajib jika status Selesai, kosongkan jika belum." },
    ],
  },
];
