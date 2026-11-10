import "dotenv/config";
import { createClient } from "@libsql/client";

async function main() {
  const core = createClient({ url: process.env.TURSO_CORE_URL!, authToken: process.env.TURSO_CORE_TOKEN! });
  const app = createClient({ url: process.env.TURSO_APP_URL!, authToken: process.env.TURSO_APP_TOKEN! });

  const coreTablas = await core.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log("CORE tablas:", coreTablas.rows.map((r: any) => r.name));

  const appTablas = await app.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log("APP tablas:", appTablas.rows.map((r: any) => r.name));

  for (const t of ["tenants", "users", "memberships", "rate_limits", "audit_log"]) {
    const info = await core.execute(`PRAGMA table_info(${t})`);
    console.log(`CORE ${t}:`, info.rows.map((r: any) => `${r.name}:${r.type}`));
    const fk = await core.execute(`PRAGMA foreign_key_list(${t})`);
    console.log(`CORE ${t} FK:`, fk.rows.length > 0 ? fk.rows.map((f: any) => `${f.from}->${f.table}.${f.to}`) : "(sin FK)");
  }

  for (const t of ["rubros", "categorias", "productos", "settings"]) {
    const info = await app.execute(`PRAGMA table_info(${t})`);
    console.log(`APP ${t}:`, info.rows.map((r: any) => `${r.name}:${r.type}`));
    const fk = await app.execute(`PRAGMA foreign_key_list(${t})`);
    console.log(`APP ${t} FK:`, fk.rows.length > 0 ? fk.rows.map((f: any) => `${f.from}->${f.table}.${f.to}`) : "(sin FK)");
    const idx = await app.execute(`PRAGMA index_list(${t})`);
    console.log(`APP ${t} índices:`, idx.rows.map((i: any) => i.name));
  }

  const tenant = await core.execute("SELECT id, name, turso_db, status FROM tenants");
  console.log("CORE tenant row:", tenant.rows);

  for (const t of ["rubros", "categorias", "productos", "settings"]) {
    const c = await app.execute(`SELECT COUNT(*) AS total FROM ${t}`);
    console.log(`APP ${t} filas:`, c.rows[0]?.total);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});