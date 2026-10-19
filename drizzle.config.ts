import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// Same env files as Next.js (.env.local, .env); drizzle-kit does not read them itself.
loadEnvConfig(process.cwd());

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
