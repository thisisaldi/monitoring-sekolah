import type { Section } from "@/components/app/entity-form";

export const schoolSections = (branches: { id: number; name: string }[]): Section[] => [
  {
    fields: [
      {
        name: "branchId",
        label: "Cabang / Perwakilan",
        type: "select",
        required: true,
        wide: true,
        placeholder: "Pilih cabang",
        options: branches.map((b) => ({ value: String(b.id), label: b.name })),
      },
      { name: "code", label: "Kode Sekolah", required: true },
      { name: "name", label: "Nama Sekolah", required: true },
      { name: "educationLevel", label: "Jenjang", placeholder: "PAUD, KB, TK, SD, SMP, SMA, SMK" },
      { name: "studentCount", label: "Jumlah Siswa", type: "number" },
    ],
  },
  {
    title: "Pengelola",
    fields: [
      { name: "principalName", label: "Kepala Sekolah" },
      { name: "treasurerName", label: "Bendahara" },
      { name: "note", label: "Catatan", type: "textarea" },
    ],
  },
];
