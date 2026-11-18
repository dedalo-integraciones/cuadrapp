import { getCoreClient } from "../db/core.js";

/**
 * Lectura de secretos de servidor. Primero mira la variable de entorno; si no
 * existe, usa la tabla privada `app_secrets`. Así el mismo código funciona en
 * local (entorno) y en producción (base), sin publicar la clave en el repo.
 */
const CACHE_MS = 5 * 60 * 1000;

const cache = new Map<string, { valor: string; momento: number }>();

export async function leerSecreto(nombre: string): Promise<string> {
  const delEntorno = String(process.env[nombre] || "").trim();
  if (delEntorno) return delEntorno;

  const ahora = Date.now();
  const guardado = cache.get(nombre);
  if (guardado && ahora - guardado.momento < CACHE_MS) return guardado.valor;

  try {
    const rs = await getCoreClient().execute({
      sql: "SELECT valor FROM app_secrets WHERE clave = ? LIMIT 1",
      args: [nombre],
    });
    const valor = String(rs.rows[0]?.["valor"] || "").trim();
    cache.set(nombre, { valor, momento: ahora });
    return valor;
  } catch (error) {
    console.error(`[secreto] no se pudo leer ${nombre}`);
    return "";
  }
}

/** Borra el cache en memoria; se usa después de guardar un secreto. */
export function olvidarSecreto(nombre: string): void {
  cache.delete(nombre);
}
