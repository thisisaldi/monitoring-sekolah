/** Field definitions shared by several entity forms. */
import { moneyField } from "@/lib/format";

import type { FieldDef, Option } from "./entity-form";

const opts = (rows: { id: number; name: string }[]): Option[] => rows.map((r) => ({ value: String(r.id), label: r.name }));

export const schoolField = (schools: { id: number; name: string }[]): FieldDef => ({
  name: "schoolId",
  label: "Sekolah",
  type: "select",
  required: true,
  options: opts(schools),
  placeholder: "Pilih sekolah",
});

export const budgetYearField = (years: { id: number; name: string }[]): FieldDef => ({
  name: "budgetYearId",
  label: "Tahun Anggaran",
  type: "select",
  required: true,
  options: opts(years),
  placeholder: "Pilih tahun anggaran",
  help: "Hanya tahun anggaran aktif.",
});

export const reportStatusField: FieldDef = {
  name: "reportStatus",
  label: "Status Laporan",
  type: "select",
  required: true,
  options: [
    { value: "COMPLETE", label: "Lengkap" },
    { value: "INCOMPLETE", label: "Belum Lengkap" },
  ],
};

export const rkasComplianceField: FieldDef = {
  name: "rkasCompliance",
  label: "Sesuai RKAS",
  type: "select",
  options: [
    { value: "true", label: "Ya" },
    { value: "false", label: "Tidak" },
  ],
};

/** Single-school branches get a pre-selected school. */
export const preselect = (schools: { id: number }[]): Record<string, string> =>
  schools.length === 1 ? { schoolId: String(schools[0].id) } : {};

/** Edit-form initial values: nulls become empty inputs. */
export const initialOf = (record: Record<string, unknown>, money: string[] = []): Record<string, string> =>
  Object.fromEntries(
    Object.entries(record).map(([k, v]) => {
      if (v === null || v === undefined) return [k, ""];
      if (money.includes(k)) return [k, moneyField(String(v))];
      return [k, String(v)];
    }),
  );
