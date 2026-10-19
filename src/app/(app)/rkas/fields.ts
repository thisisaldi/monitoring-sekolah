import type { FieldDef } from "@/components/app/entity-form";

export const rkasFields: FieldDef[] = [
  { name: "initialAmount", label: "RKAS Awal", type: "money", required: true },
  { name: "initialApprovalDate", label: "Tanggal Pengesahan", type: "date" },
  { name: "majorChangeDescription", label: "Perubahan Utama", type: "textarea" },
];

export const revisionFields: FieldDef[] = [
  { name: "amount", label: "Jumlah RKAS Setelah Revisi", type: "money", required: true },
  { name: "revisionDate", label: "Tanggal Revisi", type: "date", required: true },
  { name: "changeDescription", label: "Keterangan Perubahan", type: "textarea" },
];
