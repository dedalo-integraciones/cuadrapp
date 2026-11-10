import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "turso",
  schema: "./src/db/schema-tenant.ts",
  out: "./migrations/tenant",
  dbCredentials: {
    url: process.env.TURSO_APP_URL || "file:./data/cuadra-app.db",
    authToken: process.env.TURSO_APP_TOKEN || undefined,
  },
});
