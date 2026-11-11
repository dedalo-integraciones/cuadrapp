import { crearClienteLibsql } from "../src/db/client.js";
import { getCoreClient } from "../src/db/core.js";
import { buscarTenant, getTenantClient, TENANT_DEFAULT } from "../src/db/tenant.js";

/**
 * Endpoint TEMPORAL de diagnóstico para la conexión a la base del negocio.
 * No expone tokens: solo longitudes, banderas y códigos de error de Turso.
 * Se elimina en cuanto se identifique la causa.
 */

function limpiar(texto: string): string {
  const token = String(process.env.TURSO_APP_TOKEN || "");
  let salida = String(texto || "");
  if (token.length > 8) salida = salida.split(token).join("[token]");
  return salida.slice(0, 400);
}

function describir(error: unknown): Record<string, unknown> {
  const e = error as any;
  return {
    nombre: String(e?.name || ""),
    codigo: String(e?.code || ""),
    codigoExtendido: String(e?.extendedCode || ""),
    mensaje: limpiar(String(e?.message || e)),
  };
}

export default async function handler(_req: any, res: any) {
  const out: Record<string, unknown> = { ok: true, node: process.version };
  const token = String(process.env.TURSO_APP_TOKEN || "");
  const tokenCore = String(process.env.TURSO_CORE_TOKEN || "");
  const urlEnv = String(process.env.TURSO_APP_URL || "");

  out.token = {
    presente: Boolean(token),
    largo: token.length,
    tieneEspacios: /\s/.test(token),
    tieneComillas: /^["']/.test(token),
    igualAlDeCore: token === tokenCore && token.length > 0,
  };
  out.urlEnv = {
    presente: Boolean(urlEnv),
    empiezaLibsql: urlEnv.startsWith("libsql://"),
    largo: urlEnv.length,
  };

  try {
    const core = getCoreClient();
    const fila = await core.execute({
      sql: "SELECT id, turso_db, status FROM tenants WHERE id = ?",
      args: [TENANT_DEFAULT],
    });
    const r = fila.rows[0] as any;
    out.tenantFila = r
      ? {
          id: String(r.id),
          status: String(r.status),
          tursoDbLargo: String(r.turso_db || "").length,
          tursoDbEmpiezaLibsql: String(r.turso_db || "").startsWith("libsql://"),
          tursoDbIgualAEnv: String(r.turso_db || "") === urlEnv,
        }
      : null;
  } catch (error) {
    out.errorCore = describir(error);
  }

  try {
    const tenant = await buscarTenant(TENANT_DEFAULT);
    if (!tenant) {
      out.tenant = "sin_fila";
    } else {
      await getTenantClient(tenant).execute("SELECT 1");
      out.tenant = "conexion_ok";
    }
  } catch (error) {
    out.errorTenant = describir(error);
  }

  if (urlEnv) {
    try {
      await crearClienteLibsql(urlEnv, token).execute("SELECT 1");
      out.directoConTokenApp = "ok";
    } catch (error) {
      out.errorDirectoTokenApp = describir(error);
    }
    try {
      await crearClienteLibsql(urlEnv, tokenCore).execute("SELECT 1");
      out.directoConTokenCore = "ok";
    } catch (error) {
      out.errorDirectoTokenCore = describir(error);
    }
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(out));
}
