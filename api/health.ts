import { getCoreClient } from "../src/db/core.js";
import { buscarTenant, getTenantClient, TENANT_DEFAULT } from "../src/db/tenant.js";
import { metodo, responder } from "../src/server/http.js";

/**
 * GET /api/health
 * Comprueba que la cadena completa responda: base core + base del negocio
 * por defecto. Nunca expone URLs, tokens ni rutas internas.
 */
export default async function handler(req: any, res: any) {
  if (metodo(req) !== "GET") {
    return responder(res, 405, { ok: false, error: "METODO_NO_PERMITIDO" });
  }

  const checks: Record<string, string> = {
    core: "error",
    tenant: "error",
  };

  try {
    await getCoreClient().execute("SELECT 1");
    checks.core = "ok";

    const tenant = await buscarTenant(TENANT_DEFAULT);
    if (!tenant) {
      checks.tenant = "sin_tenant";
    } else {
      await getTenantClient(tenant).execute("SELECT 1");
      checks.tenant = "ok";
    }
  } catch (error) {
    console.error("[api/health] error", error);
  }

  const sano = checks.core === "ok" && checks.tenant === "ok";
  return responder(res, sano ? 200 : 503, {
    ok: sano,
    servicio: "cuadra",
    version: "1.0.0",
    checks,
    timestamp: new Date().toISOString(),
  });
}
