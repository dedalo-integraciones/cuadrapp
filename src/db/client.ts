import fs from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";

/**
 * Crea el cliente libSQL. Para `file:` garantiza que exista la carpeta.
 * Solo se usa en servidor (api/, scripts, server.ts).
 */
export function crearClienteLibsql(url: string, token?: string | null): Client {
  const limpia = (url || "").trim();
  if (!limpia) {
    throw new Error("Falta la URL de la base de datos libSQL");
  }

  if (limpia.startsWith("file:")) {
    const ruta = limpia.slice("file:".length);
    const absoluta = path.isAbsolute(ruta) ? ruta : path.resolve(process.cwd(), ruta);
    fs.mkdirSync(path.dirname(absoluta), { recursive: true });
  }

  return createClient({ url: limpia, authToken: token || undefined });
}
