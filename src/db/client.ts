import { createClient, type Client } from "@libsql/client/web";

/**
 * Crea el cliente libSQL remoto usando el transporte Web (HTTP/WS puro).
 *
 * Importante: NO usar "@libsql/client" (entrada de Node) en código que
 * empaqueta Vercel. Esa entrada importa `libsql`, que resuelve un binario
 * nativo por plataforma con un `require` dinámico; el trazador de Vercel
 * (@vercel/nft) no lo incluye en la función y el handler falla al importar
 * (500 FUNCTION_INVOCATION_FAILED).
 *
 * Este cliente atiende `libsql://`, `https://`, `http://` y `wss://`.
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
