import "dotenv/config";
import bcrypt from "bcryptjs";
import { getCoreClient } from "../src/db/core";
import { asegurarTenant, migrarTenant } from "./db-utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Crea o actualiza la cuenta administradora de un negocio.
 * Uso: npm run db:admin
 * Toma ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME y TENANT_OVERRIDE del .env.
 * El slug del negocio es obligatorio: no hay negocio por defecto.
 */
async function main() {
  const email = String(process.env.ADMIN_EMAIL || process.argv[2] || "")
    .trim()
    .toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || process.argv[3] || "");
  const nombre = String(process.env.ADMIN_NAME || process.argv[4] || "Administrador").trim();
  const slug = String(process.env.TENANT_OVERRIDE || process.argv[5] || "")
    .trim()
    .toLowerCase();

  if (!email) {
    throw new Error("Falta ADMIN_EMAIL: indique el correo del administrador");
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    throw new Error("ADMIN_EMAIL no tiene un formato válido");
  }
  if (password.length < 8 || password.length > 72) {
    throw new Error("ADMIN_PASSWORD debe tener entre 8 y 72 caracteres");
  }
  if (!/^[a-z0-9][a-z0-9-]{1,48}$/.test(slug)) {
    throw new Error("Falta el negocio: defina TENANT_OVERRIDE con el slug del negocio");
  }

  const tenant = await asegurarTenant(slug);
  await migrarTenant(tenant.turso_db);

  const hash = await bcrypt.hash(password, 12);
  const core = getCoreClient();
  await core.execute({
    sql: `INSERT INTO users (email, password_hash, name, is_superadmin)
          VALUES (?, ?, ?, 0)
          ON CONFLICT(email) DO UPDATE SET
            password_hash = excluded.password_hash,
            name = excluded.name`,
    args: [email, hash, nombre],
  });

  const usuario = await core.execute({
    sql: "SELECT id FROM users WHERE email = ? LIMIT 1",
    args: [email],
  });
  const userId = Number(usuario.rows[0]?.["id"]);
  if (!userId) throw new Error("No se pudo leer el usuario recién creado");

  await core.execute({
    sql: `INSERT INTO memberships (user_id, tenant_id, role)
          VALUES (?, ?, 'admin')
          ON CONFLICT(user_id, tenant_id) DO NOTHING`,
    args: [userId, tenant.id],
  });

  console.log("[db] administrador listo:", email, "· tenant:", tenant.id);
  console.log("[db] ingrese al panel en /admin con ese email y la clave configurada.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[db] error al crear administrador:", error);
    process.exit(1);
  });
