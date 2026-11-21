import { encabezado, metodo, responder } from "../../src/server/http.js";
import { limpiarMantenimiento, revisarSalud } from "../../src/server/monitor.js";

/**
 * GET /api/cron/monitor
 *
 * Lo llama el cron de Vercel (ver `vercel.json`). Es idempotente y público:
 * no expone datos del negocio y solo envía correo cuando algo falla, con un
 * máximo de una alerta cada 6 horas por tipo de problema. Devuelve 503 si
 * alguna comprobación falla, para que quede visible en el panel de Vercel.
 */
export default async function handler(req: any, res: any) {
  encabezado(res, "Cache-Control", "no-store");

  if (metodo(req) !== "GET" && metodo(req) !== "POST") {
    return responder(res, 405, { ok: false, error: "METODO_NO_PERMITIDO" });
  }

  try {
    const salud = await revisarSalud();
    await limpiarMantenimiento();
    const ok = salud.core && salud.resend && salud.tenantsFallidos.length === 0;
    return responder(res, ok ? 200 : 503, {
      ok,
      checks: {
        core: salud.core ? "ok" : "error",
        negocios: salud.tenants,
        negocios_con_error: salud.tenantsFallidos.length,
        correo: salud.resend ? "ok" : "error",
      },
    });
  } catch (error) {
    // El monitor no puede tumbar el endpoint: se informa sin detalles internos.
    console.error("[api/cron/monitor] error", error);
    return responder(res, 503, { ok: false, error: "MONITOR_ERROR" });
  }
}
