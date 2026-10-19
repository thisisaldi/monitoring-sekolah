/** Shared form parsing: Indonesian input conventions -> validated values. */
import { z } from "zod";

import { normalizeMoney } from "./money";

export { normalizeMoney };

export type FormState = {
  errors?: Record<string, string[] | undefined>;
  formError?: string;
  values?: Record<string, string>;
  ok?: boolean;
};

const REQUIRED = "Wajib diisi.";


const text = (max: number) => z.string().trim().max(max, `Maksimal ${max} karakter.`);
/** Absent form fields arrive as undefined; treat them like an empty input. */
const blank = <S extends z.ZodTypeAny>(schema: S) => z.preprocess((v) => v ?? "", schema);

export const f = {
  requiredText: (max = 200) => blank(text(max).min(1, REQUIRED)),
  optionalText: (max = 10_000) => blank(text(max).transform((v) => v || null)),
  money: (opts: { allowNegative?: boolean } = {}) =>
    blank(z
      .string()
      .trim()
      .min(1, REQUIRED)
      .transform((v, ctx) => {
        const n = normalizeMoney(v);
        if (n === null) {
          ctx.addIssue({ code: "custom", message: "Format angka tidak valid. Contoh: 50.000.000" });
          return z.NEVER;
        }
        if (!opts.allowNegative && n.startsWith("-")) {
          ctx.addIssue({ code: "custom", message: "Tidak boleh negatif." });
          return z.NEVER;
        }
        return n;
      })),
  optionalMoney: () =>
    blank(z
      .string()
      .trim()
      .transform((v, ctx) => {
        if (!v) return null;
        const n = normalizeMoney(v);
        if (n === null || n.startsWith("-")) {
          ctx.addIssue({ code: "custom", message: "Format angka tidak valid." });
          return z.NEVER;
        }
        return n;
      })),
  date: () => blank(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, REQUIRED)),
  optionalDate: () =>
    blank(
      z
        .string()
        .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Tanggal tidak valid.")
        .transform((v) => v || null),
    ),
  id: (message = "Pilih salah satu.") => z.coerce.number({ message }).int().positive(message),
  optionalInt: () =>
    blank(
      z
        .string()
        .trim()
        .refine((v) => v === "" || /^\d+$/.test(v), "Harus bilangan bulat tidak negatif.")
        .transform((v) => (v === "" ? null : Number(v))),
    ),
  checkbox: () => z.string().optional().transform((v) => v === "on" || v === "true"),
  /** Tri-state select: "" = belum diisi, "true" / "false". */
  optionalBool: () =>
    blank(z.enum(["", "true", "false"]).transform((v) => (v === "" ? null : v === "true"))),
  choice: <T extends readonly [string, ...string[]]>(values: T) =>
    blank(z.enum(values, { message: "Pilih salah satu." })),
};

/** FormData -> plain object (every field as a string, missing = ""). */
export function formValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string") out[k] = v;
  return out;
}

export function parseForm<S extends z.ZodTypeAny>(
  schema: S,
  formData: FormData,
): { data: z.infer<S> } | { state: FormState } {
  const values = formValues(formData);
  const result = schema.safeParse(values);
  if (result.success) return { data: result.data };
  return { state: { errors: z.flattenError(result.error).fieldErrors as FormState["errors"], values } };
}

/** Postgres unique_violation, possibly wrapped by Drizzle. */
export function uniqueViolation(e: unknown): string | null {
  for (let err = e as { code?: string; constraint_name?: string; cause?: unknown } | undefined; err; err = err.cause as typeof err) {
    if (err.code === "23505") return err.constraint_name ?? "unique";
  }
  return null;
}

export function pageNumber(raw: string | string[] | undefined): number {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

/** Positive integer id from a query param, or null (never throws on "abc"). */
export function idParam(raw: string | string[] | undefined): number | null {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export const PAGE_SIZE = 25;
