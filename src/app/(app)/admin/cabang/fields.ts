import type { Section } from "@/components/app/entity-form";

export const branchSections: Section[] = [
  {
    fields: [
      { name: "code", label: "Kode", required: true, placeholder: "Contoh: CAB-JAKARTA" },
      {
        name: "type",
        label: "Jenis",
        type: "select",
        required: true,
        options: [
          { value: "CABANG", label: "Cabang" },
          { value: "PERWAKILAN", label: "Perwakilan" },
          { value: "PP", label: "Pengurus Pusat" },
        ],
      },
      { name: "name", label: "Nama", required: true, wide: true },
      { name: "isActive", label: "Status", type: "checkbox", help: "Aktif" },
    ],
  },
];
