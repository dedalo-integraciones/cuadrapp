import { buscarTenant, datosPublicosTenant, tenantVigente } from "../../src/db/tenant.js";
import { encabezado, metodo, responder } from "../../src/server/http.js";

/** GET /api/tenant/:slug · datos públicos del negocio (sin infraestructura). */
export default async function handler(req: any, res: any) {
  if (metodo(req) !== "GET") {
    return responder(res, 405, { ok: false, error: "METODO_NO_PERMITIDO" });
  }

  try {
    const slugRaw = req?.params?.slug || req?.query?.slug;
    const slug = String(Array.isArray(slugRaw) ? slugRaw[0] : slugRaw || "").trim().toLowerCase();
    if (!slug) return responder(res, 404, { ok: false, error: "TENANT_NO_ENCONTRADO" });

    const tenant = await buscarTenant(slug);
    if (!tenant) return responder(res, 404, { ok: false, error: "TENANT_NO_ENCONTRADO" });
    if (!tenantVigente(tenant)) {
      return responder(res, 403, { ok: false, error: "TENANT_BLOQUEADO" });
    }

    encabezado(res, "Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return responder(res, 200, { ok: true, tenant: datosPublicosTenant(tenant) });
  } catch (error) {
    console.error("[api/tenant] error", error);
    return responder(res, 500, { ok: false, error: "ERROR_INTERNO" });
  }
}
