import { createClient, type Client } from "@libsql/client/web";

/**
 * Crea el cliente libSQL remoto usando el transporte Web (HTTP/WS puro).
 *
 * Notas para Vercel:
 * - Vercel compila las funciones a `.js` y las ejecuta como ESM (package.json
 *   tiene "type": "module"). Por eso TODOS los imports relativos del servidor
 *   deben llevar la extensión `.js` (ej: `./core.js`). Sin extensión, la
 *   función muere al importar con ERR_MODULE_NOT_FOUND y Vercel devuelve
 *   500 FUNCTION_INVOCATION_FAILED.
 * - Este cliente no necesita el binario nativo de `libsql`, así que el
 *   empaquetado de la función queda más liviano.
 *
 * Atiende `libsql://`, `https://`, `http://` y `wss://`.
 * Las URL `file:` locales no están soportadas.
 */
export function crearClienteLibsql(url: string, token?: string | null): Client {
  const limpia = (url || "").trim();
  if (!limpia) {
    throw new Error("Falta la URL de la base de datos libSQL");
  }
  if (limpia.startsWith("file:")) {
    throw new Error(
      "El cliente remoto no admite URL 'file:'. Use una URL libsql:// de Turso."
    );
  }

  return createClient({ url: limpia, authToken: token || undefined });
}
