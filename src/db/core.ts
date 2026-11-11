import type { Client } from "@libsql/client";
import { crearClienteLibsql } from "./client.js";

/**
 * Cliente de la base core (plataforma). SOLO servidor.
 * Prohibido importar desde componentes del navegador.
 */
export function getCoreClient(): Client {
  const url = process.env.TURSO_CORE_URL;
  const authToken = process.env.TURSO_CORE_TOKEN;
  if (!url) {
    throw new Error("Falta TURSO_CORE_URL en el entorno");
  }
  return crearClienteLibsql(url, authToken);
}
