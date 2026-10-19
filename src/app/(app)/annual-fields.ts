import type { Section } from "@/components/app/entity-form";
import { reportStatusField, rkasComplianceField } from "@/components/app/fields";
import type { AnnualModule } from "@/server/annual";

export const ANNUAL: Record<AnnualModule, { title: string; path: string; money: string[]; sections: Section[] }> = {
  bos: {
    title: "BOS",
    path: "/bos",
    money: ["openingBalance", "receiptAmount", "usageAmount"],
    sections: [
      {
        title: "Saldo",
        fields: [
          { name: "openingBalance", label: "Saldo Awal", type: "money", required: true },
          { name: "receiptAmount", label: "Penerimaan", type: "money", required: true },
          { name: "usageAmount", label: "Penggunaan", type: "money", required: true, help: "Saldo akhir dihitung otomatis." },
        ],
      },
      { title: "Kepatuhan", fields: [rkasComplianceField, reportStatusField, { name: "notes", label: "Catatan", type: "textarea" }] },
    ],
  },
  receivables: {
    title: "Piutang",
    path: "/piutang",
    money: ["openingBalance", "additionAmount", "settlementAmount"],
    sections: [
      {
        title: "Saldo Piutang",
        fields: [
          { name: "openingBalance", label: "Piutang Awal", type: "money", required: true },
          { name: "additionAmount", label: "Penambahan", type: "money", required: true },
          { name: "settlementAmount", label: "Pelunasan", type: "money", required: true, help: "Piutang akhir dihitung otomatis." },
          { name: "dominantAge", label: "Umur Dominan", placeholder: "Contoh: 3-6 bulan" },
        ],
      },
      { fields: [{ name: "followUp", label: "Tindak Lanjut", type: "textarea" }] },
    ],
  },
  reconciliation: {
    title: "Rekonsiliasi",
    path: "/rekonsiliasi",
    money: ["financialStatementBalance", "bankBalance"],
    sections: [
      {
        title: "Saldo",
        fields: [
          { name: "financialStatementBalance", label: "Saldo Laporan Keuangan", type: "money", required: true },
          { name: "bankBalance", label: "Saldo Bank", type: "money", required: true, help: "Selisih dan status dihitung otomatis." },
        ],
      },
      {
        fields: [
          rkasComplianceField,
          { name: "notes", label: "Catatan", type: "textarea" },
          { name: "followUp", label: "Tindak Lanjut", type: "textarea" },
        ],
      },
    ],
  },
};
