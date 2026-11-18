import "dotenv/config";
import { getCoreClient } from "../src/db/core";

/**
 * Cambia el email de un administrador sin tocar su clave ni su membership.
 * Uso: npm run db:admin:email -- <email-anterior> <email-nuevo>
 *
 * Sirve para pasar de un correo de ejemplo a un buzón real, que es el que
 * recibe el link de recuperación de clave.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function main() {
  const anterior = String(process.argv[2] || "").trim().toLowerCase();
  const nuevo = String(process.argv[3] || "").trim().toLowerCase();

  if (!EMAIL_RE.test(anterior) || !EMAIL_RE.test(nuevo)) {
    throw new Error(
      "Uso: npm run db:admin:email -- <email-anterior> <email-nuevo>"
    );
  }
  if (anterior === nuevo) {
    throw new Error("El email anterior y el nuevo son iguales");
  }

  const core = getCoreClient();

  const ocupado = await core.execute({
    sql: "SELECT id FROM users WHERE email = ? LIMIT 1",
    args: [nuevo],
  });
  if (ocupado.rows.length > 0) {
    throw new Error("El email nuevo ya está en uso por otro usuario");
  }

  const cambios = await core.execute({
    sql: "UPDATE users SET email = ? WHERE email = ?",
    args: [nuevo, anterior],
  });
  if (Number(cambios.rowsAffected ?? 0) === 0) {
    throw new Error("No existe un usuario con el email anterior");
  }

  console.log("[db] email del administrador actualizado.");
  console.log("[db] desde ahora el login usa el email nuevo; la clave no cambió.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[db] error al cambiar el email:", error.message);
    process.exit(1);
  });
