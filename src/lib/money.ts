/**
 * Exact money arithmetic for numeric(18,2) values.
 *
 * Postgres returns numeric as a string ("850000000.00"). Amounts are handled
 * as bigint cents so sums and differences never pick up float error.
 */
export type Cents = bigint;

export function toCents(value: string | null | undefined): Cents | null {
  if (value === null || value === undefined || value === "") return null;
  const m = /^(-)?(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!m) throw new Error(`Invalid money value: ${value}`);
  const cents = BigInt(m[2]) * 100n + BigInt((m[3] ?? "").padEnd(2, "0"));
  return m[1] ? -cents : cents;
}

export function fromCents(cents: Cents): string {
  const neg = cents < 0n;
  const abs = neg ? -cents : cents;
  return `${neg ? "-" : ""}${abs / 100n}.${(abs % 100n).toString().padStart(2, "0")}`;
}

/** a / b * 100 as a display number, or null when b is zero (never divides by zero). */
export function percentage(a: Cents, b: Cents): number | null {
  if (b === 0n) return null;
  // Scale before dividing to keep 4 decimal places of precision.
  return Number((a * 1_000_000n) / b) / 10_000;
}

/** "Rp 50.000.000,50" -> "50000000.50". Dots group thousands, comma is the decimal mark. */
export function normalizeMoney(raw: string): string | null {
  const s = raw.replace(/rp/i, "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  return /^-?\d+(\.\d{1,2})?$/.test(s) ? s : null;
}
