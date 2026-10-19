/**
 * Bootstrap the first ADMIN account. Later admins can be created from
 * Administrasi > Pengguna.
 *
 *   DATABASE_URL=... node scripts/create-admin.ts <username> "<full name>" <password>
 */
import nextEnv from "@next/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { hashPassword, passwordProblems } from "../src/lib/auth/password.ts";
import { users } from "../src/db/schema.ts";

nextEnv.loadEnvConfig(process.cwd()); // reads .env.local / .env like Next.js

const [username, name, password] = process.argv.slice(2);
if (!username || !name || !password || !process.env.DATABASE_URL) {
  console.error('Usage: DATABASE_URL=... node scripts/create-admin.ts <username> "<full name>" <password>');
  process.exit(1);
}
const problems = passwordProblems(password, { username, name });
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

const client = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
await drizzle(client)
  .insert(users)
  .values({ username, name, password: await hashPassword(password), role: "ADMIN" });
console.log(`Administrator ${username} created.`);
await client.end();
