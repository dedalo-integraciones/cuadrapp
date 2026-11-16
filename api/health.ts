import { getCoreClient } from "../src/db/core.js";
import { buscarTenant, getTenantClient, TENANT_DEFAULT } from "../src/db/tenant.js";
import { encabezado, metodo, responder } from "../src/server/http.js";

/**
 * GET /api/health
 * Comprueba que la cadena completa responda: base core + base del negocio
 * por defecto. Nunca expone URLs, tokens ni rutas internas.
 *
 * Cada consulta cuesta lecturas en Turso y el endpoint es público, así que el
 * resultado se guarda 30 segundos por instancia. Además, un 200 se puede
 * cachear 10 segundos en el borde; un 503 nunca se cachea.
 */
const CACHE_MS = 30_000;

type Resultado = {
  momento: number;
  status: number;
  cuerpo: Record<string, unknown>;
};

let ultimo: Resultado | null = null;

export default async function handler(req: any, res: any) {
  if (metodo(req) !== "GET") {
    return responder(res, 405, { ok: false, error: "METODO_NO_PERMITIDO" });
  }

  const ahora = Date.now();
  if (ultimo && ahora - ultimo.momento < CACHE_MS) {
    encabezado(res, "Cache-Control", "no-store");
    return responder(res, ultimo.status, ultimo.cuerpo);
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
  const status = sano ? 200 : 503;
  const cuerpo = {
    ok: sano,
    servicio: "cuadra",
    version: "1.0.0",
    checks,
    timestamp: new Date(ahora).toISOString(),
  };

  ultimo = { momento: ahora, status, cuerpo };

  encabezado(
    res,
    "Cache-Control",
    sano ? "public, max-age=10, s-maxage=10, stale-while-revalidate=20" : "no-store"
  );
  if (!sano) encabezado(res, "Retry-After", "30");

  return responder(res, status, cuerpo);
}
