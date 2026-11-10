import "dotenv/config";
import { asegurarTenant, migrarTenant, slugDeArgumentos } from "./db-utils";

/**
 * Alta o actualización de un negocio.
 * Uso: npm run db:tenant -- <slug> ["Nombre comercial"] ["libsql://..."]
 */
async function main() {
  const slug = slugDeArgumentos();
  const nombre = process.argv[3];
  const url = process.argv[4];
  const tenant = await asegurarTenant(slug, nombre, url);
  await migrarTenant(tenant.turso_db);
  console.log("[db] tenant listo:", tenant.id, "·", tenant.name);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[db] error al registrar tenant:", error);
    process.exit(1);
  });
