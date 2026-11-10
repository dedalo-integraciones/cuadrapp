import "dotenv/config";
import { getCoreClient } from "../src/db/core";
import { buscarTenant, getTenantClient, TENANT_DEFAULT } from "../src/db/tenant";

/** Diagnóstico rápido de la base core y del tenant. Uso: npm run db:estado */
async function main() {
  const slug = process.env.TENANT_OVERRIDE || TENANT_DEFAULT;
  const core = getCoreClient();
  const tablasCore = await core.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
  );
  console.log("[core]", tablasCore.rows.map((r) => r["name"]).join(", "));

  const tenants = await core.execute("SELECT id, name, mode, status FROM tenants ORDER BY id");
  console.log("[tenants]", tenants.rows);

  const users = await core.execute("SELECT id, email, name, is_superadmin FROM users ORDER BY id");
  console.log("[usuarios]", users.rows);

  const tenant = await buscarTenant(slug);
  if (!tenant) {
    console.log(`[tenant] ${slug} no existe`);
    return;
  }

  const db = getTenantClient(tenant);
  const rubros = await db.execute("SELECT id, rubro, orden, color, activo FROM rubros ORDER BY orden");
  const categorias = await db.execute(
    "SELECT id, id_rubro, categoria, orden, color, activo FROM categorias ORDER BY id_rubro, orden"
  );
  const productos = await db.execute(
    `SELECT p.id, p.nombre, p.precio_cents, p.activo, p.imagen, c.categoria, r.rubro
     FROM productos p
     JOIN categorias c ON c.id = p.id_categoria
     JOIN rubros r ON r.id = c.id_rubro
     ORDER BY r.orden, c.orden, p.orden`
  );
  console.log("[rubros]", rubros.rows);
  console.log("[categorias]", categorias.rows);
  console.log("[productos]", productos.rows.length, productos.rows.slice(0, 5));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[estado] error:", error);
    process.exit(1);
  });
