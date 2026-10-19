/**
 * Business calculations (BRD section 11), the single authoritative place for
 * every derived value. Derived values are never stored or user-editable.
 */
import { percentage, toCents, type Cents } from "./money";

type Money = string;
const c = (v: Money) => toCents(v)!;

/** RKAS Terakhir: latest revision amount, or the initial amount if none. */
export function rkasCurrentAmount(initialAmount: Money, revisions: { revisionNumber: number; amount: Money }[]): Cents {
  if (revisions.length === 0) return c(initialAmount);
  const latest = revisions.reduce((a, b) => (b.revisionNumber > a.revisionNumber ? b : a));
  return c(latest.amount);
}

/** Monthly: Selisih = anggaran - realisasi; % = realisasi / anggaran * 100 (null when anggaran = 0). */
export function monthlyVariance(budget: Money, realization: Money) {
  return { variance: c(budget) - c(realization), percentage: percentage(c(realization), c(budget)) };
}

/** Semester summary per BRD 11.4. Anything not computable is null, never fabricated. */
export function semesterSummary(semester1: Money | null, semester2: Money | null, latestRkas: Cents | null) {
  const s1 = semester1 === null ? null : c(semester1);
  const s2 = semester2 === null ? null : c(semester2);
  const total = s1 === null && s2 === null ? null : (s1 ?? 0n) + (s2 ?? 0n);
  const hasRkas = latestRkas !== null && latestRkas !== 0n;
  return {
    semester1: s1,
    semester2: s2,
    total,
    latestRkas,
    percentageSemester1: s1 !== null && hasRkas ? percentage(s1, latestRkas) : null,
    percentageFinal: total !== null && hasRkas ? percentage(total, latestRkas) : null,
    remainingBudget: latestRkas !== null && total !== null ? latestRkas - total : null,
  };
}

/** Saldo Akhir BOS = saldo awal + penerimaan - penggunaan. */
export const bosEndingBalance = (opening: Money, receipt: Money, usage: Money) => c(opening) + c(receipt) - c(usage);

/** Piutang Akhir = piutang awal + penambahan - pelunasan. */
export const receivableEndingBalance = (opening: Money, addition: Money, settlement: Money) =>
  c(opening) + c(addition) - c(settlement);

/** OBD-005 is PENDING: no overdue-percentage formula exists, so this is always null. */
export const receivableOverduePercentage = (): null => null;

/** Selisih rekonsiliasi = saldo bank - saldo laporan; OBD-006 status: 0 = SESUAI. */
export function reconciliationResult(statementBalance: Money, bankBalance: Money) {
  const difference = c(bankBalance) - c(statementBalance);
  return { difference, status: difference === 0n ? ("SESUAI" as const) : ("TIDAK_SESUAI" as const) };
}
