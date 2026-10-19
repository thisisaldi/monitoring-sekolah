/** Presentation-only formatting. Never computes business values. */
import { toCents, type Cents } from "./money";

export const MONTH_NAMES: Record<number, string> = {
  1: "Januari", 2: "Februari", 3: "Maret", 4: "April", 5: "Mei", 6: "Juni",
  7: "Juli", 8: "Agustus", 9: "September", 10: "Oktober", 11: "November", 12: "Desember",
};

/** School-year reporting order, per BRD 11.3: July to June. */
export const SCHOOL_YEAR_MONTH_ORDER = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

/** "850000000.00" -> "Rp850.000.000" (rounded half-up to whole rupiah). */
export function rupiah(value: string | Cents | null | undefined): string {
  if (value === null || value === undefined) return "-";
  const cents = typeof value === "bigint" ? value : toCents(value);
  if (cents === null) return "-";
  const neg = cents < 0n;
  const abs = neg ? -cents : cents;
  const whole = (abs + 50n) / 100n;
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${neg ? "-" : ""}Rp${grouped}`;
}

export function percent(value: number | null): string {
  if (value === null) return "-";
  return `${value.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

/** "2026-07-01" -> "1 Jul 2026". */
export function shortDate(value: string | null | undefined): string {
  if (!value) return "-";
  const [y, m, d] = value.split("-").map(Number);
  return `${d} ${MONTH_NAMES[m].slice(0, 3)} ${y}`;
}

export const BRANCH_TYPE_LABEL = { CABANG: "Cabang", PERWAKILAN: "Perwakilan", PP: "Pengurus Pusat" } as const;
export const REPORT_STATUS_LABEL = { COMPLETE: "Lengkap", INCOMPLETE: "Belum Lengkap" } as const;
export const FINDING_STATUS_LABEL = { OPEN: "Terbuka", ON_PROGRESS: "Proses", COMPLETED: "Selesai" } as const;
export const ROLE_LABEL = { ADMIN: "Admin", CENTRAL: "Pusat", BRANCH: "Cabang" } as const;

/** Stored "50000000.50" -> editable "50.000.000,50" (the notation money inputs accept). */
export function moneyField(value: string | null | undefined): string {
  if (!value) return "";
  const [int, dec = "00"] = value.split(".");
  const neg = int.startsWith("-");
  const grouped = int.replace("-", "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${neg ? "-" : ""}${grouped}${dec === "00" ? "" : `,${dec}`}`;
}
