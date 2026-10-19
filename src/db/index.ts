import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

// prepare: false keeps this compatible with transaction-mode poolers
// (Supabase Supavisor / PgBouncer), which serverless deployments need.
// DB_POOL_MAX=1 for the local pglite-server, which can't interleave connections.
const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: Number(process.env.DB_POOL_MAX ?? 5) });

export const db = drizzle(client, { schema, casing: "snake_case" });
export type Db = typeof db;
