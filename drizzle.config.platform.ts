import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "turso",
  schema: "./src/db/schema-platform.ts",
  out: "./migrations/platform",
  dbCredentials: {
    url: process.env.TURSO_CORE_URL || "file:./data/cuadra-core.db",
    authToken: process.env.TURSO_CORE_TOKEN || undefined,
  },
});
