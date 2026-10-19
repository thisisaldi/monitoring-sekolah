import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./test/empty.ts", import.meta.url)),
    },
  },
  test: {
    setupFiles: ["./test/setup.ts"],
    pool: "forks",
    // One PGlite (WASM Postgres) per worker is memory-heavy; run files sequentially.
    fileParallelism: false,
  },
});
