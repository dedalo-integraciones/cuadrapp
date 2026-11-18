import "dotenv/config";
import { getCoreClient } from "../src/db/core";

/**
 * Guarda un secreto de servidor en la tabla privada app_secrets.
 * Uso: npm run db:secreto -- RESEND_API_KEY
 * El valor se toma de la variable de entorno del mismo nombre; nunca se
 * imprime ni se pasa por argumentos de línea de comandos.
 */
async function main() {
  const nombre = String(process.argv[2] || "").trim();
  if (!/^[A-Z][A-Z0-9_]{2,60}$/.test(nombre)) {
    throw new Error(
      "Indique el nombre del secreto en mayúsculas: npm run db:secreto -- RESEND_API_KEY"
    );
  }

  const valor = String(process.env[nombre] || "").trim();
  if (!valor) {
    throw new Error(`Falta la variable ${nombre} en el entorno`);
  }

  await getCoreClient().execute({
    sql: `INSERT INTO app_secrets (clave, valor, actualizado_en)
          VALUES (?, ?, datetime('now'))
          ON CONFLICT(clave) DO UPDATE SET
            valor = excluded.valor,
            actualizado_en = excluded.actualizado_en`,
    args: [nombre, valor],
  });

  console.log(
    `[db] secreto guardado: ${nombre} (${valor.length} caracteres, valor no mostrado)`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[db] error al guardar el secreto:", error.message);
    process.exit(1);
  });
