import { sql } from "drizzle-orm";

import { db } from "@/db";

// Hit by Vercel Cron so the Supabase free-tier project never goes 7 days idle (auto-pause).
export const dynamic = "force-dynamic";

export async function GET() {
  await db.execute(sql`select 1`);
  return Response.json({ status: "ok" });
}
