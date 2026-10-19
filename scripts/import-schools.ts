/**
 * Import branches (Cabang/Perwakilan/PP) and their schools from a CSV.
 * Idempotent: branches and schools are matched by code and updated in place.
 *
 *   node scripts/import-schools.ts docs/reference/branches_schools.csv
 */
import { readFileSync } from "node:fs";

import nextEnv from "@next/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { branches, schools, type BranchType } from "../src/db/schema.ts";

nextEnv.loadEnvConfig(process.cwd()); // reads .env.local / .env like Next.js

/** Minimal RFC 4180 parser (quoted fields, embedded commas/quotes). */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const endRow = () => {
    row.push(field);
    rows.push(row);
    row = [];
    field = "";
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      endRow();
    } else field += ch;
  }
  if (field || row.length) endRow();
  const [header, ...data] = rows.filter((r) => r.some((v) => v !== ""));
  return data.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

const path = process.argv[2];
if (!path || !process.env.DATABASE_URL) {
  console.error("Usage: DATABASE_URL=... node scripts/import-schools.ts <file.csv>");
  process.exit(1);
}

const client = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
const db = drizzle(client);
const rows = parseCsv(readFileSync(path, "utf8"));

const branchIds = new Map<string, number>();
await db.transaction(async (tx) => {
  for (const r of rows) {
    if (!branchIds.has(r.branch_code)) {
      const [b] = await tx
        .insert(branches)
        .values({ code: r.branch_code, name: r.branch_name, type: r.branch_type as BranchType })
        .onConflictDoUpdate({ target: branches.code, set: { name: r.branch_name, type: r.branch_type as BranchType } })
        .returning({ id: branches.id });
      branchIds.set(r.branch_code, b.id);
    }
    const values = {
      branchId: branchIds.get(r.branch_code)!,
      name: r.school_name,
      educationLevel: r.education_level || null,
      studentCount: r.student_count ? Number(r.student_count) : null,
    };
    await tx.insert(schools).values({ code: r.school_code, ...values }).onConflictDoUpdate({ target: schools.code, set: values });
  }
});
console.log(`${branchIds.size} branches, ${rows.length} schools imported.`);
await client.end();
