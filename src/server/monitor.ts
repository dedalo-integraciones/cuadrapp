import { getCoreClient } from "../db/core.js";
import { buscarTenant, getTenantClient } from "../db/tenant.js";
import { enviarEmailAlerta } from "./email.js";
import { leerSecreto } from "./secreto.js";

/**
 * Monitor interno de la plataforma.
 *
 * Reglas:
 * - Nunca lanza: un fallo del monitor no puede romper la app.
 * - Avisa al administrador por email como máximo una vez cada 6 horas por tipo
 *   de problema, para no inundar el buzón.
 * - Si Resend está caído, la alerta no puede salir; el registro igual queda en
 *   `monitor_alertas` y en el log de Vercel.
 */

const COOLDOWN_MS = 6 * 60 * 60 * 1000;
const RETENCION_ALERTAS_MS = 30 * 24 * 60 * 60 * 1000;
const RETENCION_LIMITES_MS = 24 * 60 * 60 * 1000;

async function emailAdministrador(): Promise<string> {
  try {
    const rs = await getCoreClient().execute({
      sql: `SELECT u.email AS email
            FROM users u
            JOIN memberships m ON m.user_id = u.id
            ORDER BY m.id
            LIMIT 1`,
    });
    const email = String(rs.rows[0]?.["email"] || "").trim();
    if (email) return email;
  } catch {
    // Sin base: se intenta la variable de entorno.
  }
  return String(process.env.ADMIN_EMAIL || "").trim();
}

/**
 * Envía la alerta si pasó el tiempo de espera y recién entonces la registra.
 * Si el correo no salió, no se registra: el próximo intento vuelve a probar en
 * vez de quedar en silencio durante 6 horas.
 */
export async function alertar(
  clave: string,
  asunto: string,
  detalle: string
): Promise<void> {
  try {
    const core = getCoreClient();
    const ahora = Date.now();
    const previo = await core.execute({
      sql: "SELECT creado_en FROM monitor_alertas WHERE clave = ? LIMIT 1",
      args: [clave],
    });
    const ultimo = Number(previo.rows[0]?.["creado_en"] || 0);
    if (ultimo && ahora - ultimo < COOLDOWN_MS) return;

    const to = await emailAdministrador();
    if (to) {
      const resultado = await enviarEmailAlerta({ to, asunto, detalle });
      const motivoFallo = resultado.ok === false ? resultado.motivo : "";
      if (motivoFallo) {
        console.error(`[monitor] la alerta no salió: ${motivoFallo}`);
        return;
      }
    } else {
      // Sin destinatario no hay correo, pero el registro evita repetir el log.
      console.error("[monitor] no hay email de administrador para la alerta");
    }

    await core.execute({
      sql: `INSERT INTO monitor_alertas (clave, creado_en) VALUES (?, ?)
            ON CONFLICT(clave) DO UPDATE SET creado_en = excluded.creado_en`,
      args: [clave, ahora],
    });
  } catch (error) {
    console.error("[monitor] no se pudo registrar la alerta", error);
  }
}

/** Poda de tablas de apoyo. Se llama desde el cron del monitor. */
export async function limpiarMantenimiento(): Promise<void> {
  try {
    const core = getCoreClient();
    const ahora = Date.now();
    await core.execute({
      sql: `DELETE FROM rate_limits
            WHERE ventana_inicio < ?
              AND (bloqueado_hasta IS NULL OR bloqueado_hasta < ?)`,
      args: [ahora - RETENCION_LIMITES_MS, ahora - RETENCION_LIMITES_MS],
    });
    await core.execute({
      sql: "DELETE FROM monitor_alertas WHERE creado_en < ?",
      args: [ahora - RETENCION_ALERTAS_MS],
    });
  } catch (error) {
    console.error("[monitor] no se pudo limpiar el mantenimiento", error);
  }
}

export type Salud = {
  core: boolean;
  tenants: number;
  tenantsFallidos: string[];
  resend: boolean;
};

/** Revisa core, cada base de negocio y el acceso a Resend. */
export async function revisarSalud(): Promise<Salud> {
  const salud: Salud = { core: false, tenants: 0, tenantsFallidos: [], resend: false };

  try {
    await getCoreClient().execute("SELECT 1");
    salud.core = true;
  } catch {
    await alertar(
      "core",
      "La base core no responde",
      "El monitor no pudo ejecutar una consulta mínima en la base de plataforma."
    );
    return salud;
  }

  try {
    const rs = await getCoreClient().execute("SELECT id FROM tenants ORDER BY id");
    const ids = rs.rows.map((fila) => String(fila["id"] || "")).filter(Boolean);
    salud.tenants = ids.length;
    for (const id of ids) {
      try {
        const tenant = await buscarTenant(id);
        if (!tenant) throw new Error("no encontrado");
        await getTenantClient(tenant).execute("SELECT 1");
      } catch {
        salud.tenantsFallidos.push(id);
        await alertar(
          `tenant:${id}`,
          `El catálogo del negocio "${id}" no responde`,
          `El monitor no pudo leer la base del negocio "${id}".`
        );
      }
    }
  } catch {
    await alertar(
      "tenants",
      "No se pudo listar los negocios",
      "El monitor no pudo consultar la tabla de negocios en la base core."
    );
  }

  try {
    const apiKey = await leerSecreto("RESEND_API_KEY");
    if (!apiKey) {
      await alertar(
        "resend-config",
        "Falta la clave de Resend",
        "No hay RESEND_API_KEY en app_secrets ni en el entorno: los correos de recuperación no se envían."
      );
      return salud;
    }

    const control = new AbortController();
    const corte = setTimeout(() => control.abort(), 8000);
    try {
      const respuesta = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: control.signal,
      });
      salud.resend = respuesta.ok;
      if (!respuesta.ok) {
        await alertar(
          "resend",
          "Resend rechaza la clave o está caído",
          `La API de Resend respondió ${respuesta.status} al consultar los dominios.`
        );
      }
    } finally {
      clearTimeout(corte);
    }
  } catch {
    await alertar(
      "resend",
      "No se pudo contactar a Resend",
      "La consulta a api.resend.com falló por red o por tiempo de espera."
    );
  }

  return salud;
}
