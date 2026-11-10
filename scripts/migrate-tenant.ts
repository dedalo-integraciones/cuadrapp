import "dotenv/config";
import { migrarCore, migrarTenant, obtenerTenant, slugDeArgumentos, urlTenantPorDefecto } from "./db-utils";

async function main() {
  await migrarCore();
  const slug = slugDeArgumentos();
  const tenant = await obtenerTenant(slug);
  const url = tenant?.turso_db || urlTenantPorDefecto();
  await migrarTenant(url);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[db] error al migrar tenant:", error);
    process.exit(1);
  });
