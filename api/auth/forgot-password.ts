import {
  encabezado,
  ipCliente,
  leerBody,
  metodo,
  responder,
} from "../../src/server/http.js";
import { auditar } from "../../src/server/audit.js";
import { enviarEmailReset } from "../../src/server/email.js";
import {
  MAX_PEDIDOS_POR_EMAIL,
  MENSAJE_GENERICO,
  VENTANA_RESET_MS,
  baseUrlDeRequest,
  buscarUsuarioPorEmail,
  clavePedido,
  crearTokenReset,
  normalizarEmail,
  nombreComercioParaEmail,
  tenantDeUsuario,
} from "../../src/server/password-reset.js";
import {
  estadoLimite,
  registrarIntento,
} from "../../src/server/rate-limit.js";

/**
 * POST /api/auth/forgot-password
 * body: { email, website_url? }
 *
 * Copia la regla de Icaria: la respuesta es siempre la misma, exista o no el
 * email. No se revela el estado de la cuenta ni si el correo salió.
 */
export default async function handler(req: any, res: any) {
  encabezado(res, "Cache-Control", "no-store");

  if (metodo(req) !== "POST") {
    return responder(res, 405, {
      ok: false,
      error: "METODO_NO_PERMITIDO",
      mensaje: "Use POST.",
    });
  }

  try {
    const body = await leerBody(req);

    // Honeypot: invisible para personas, tentador para bots.
    if (String(body.website_url || "").trim() !== "") {
      return responder(res, 200, { ok: true, mensaje: MENSAJE_GENERICO });
    }

    const emailCrudo =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase().slice(0, 254)
        : "";

    if (!emailCrudo) {
      return responder(res, 200, { ok: true, mensaje: MENSAJE_GENERICO });
    }

    const limite = await estadoLimite(
      clavePedido(emailCrudo),
      MAX_PEDIDOS_POR_EMAIL,
      VENTANA_RESET_MS
    );
    if (!limite.permitido) {
      return responder(res, 200, {
        ok: false,
        error: "RATE_LIMIT",
        mensaje: `Demasiados pedidos. Espere ${Math.max(
          1,
          limite.minutosRestantes
        )} minutos.`,
      });
    }
    await registrarIntento(
      clavePedido(emailCrudo),
      MAX_PEDIDOS_POR_EMAIL,
      VENTANA_RESET_MS
    );

    const email = normalizarEmail(emailCrudo);
    if (!email) {
      return responder(res, 200, { ok: true, mensaje: MENSAJE_GENERICO });
    }

    const usuario = await buscarUsuarioPorEmail(email);
    if (usuario) {
      const token = await crearTokenReset(usuario.id);
      const base = baseUrlDeRequest(req);
      const link = `${base}/restablecer-clave?token=${encodeURIComponent(token)}`;
      const nombreComercio = await nombreComercioParaEmail(usuario.id);

      void auditar(
        await tenantDeUsuario(usuario.id),
        usuario.id,
        "PASSWORD_RESET_REQUEST",
        { email, ip: ipCliente(req) }
      );

      await enviarEmailReset({
        to: usuario.email,
        nombre: usuario.name,
        link,
        nombreComercio,
      });
    }

    return responder(res, 200, { ok: true, mensaje: MENSAJE_GENERICO });
  } catch (error) {
    // Cualquier fallo mantiene la misma respuesta pública.
    console.error("[api/auth/forgot-password] error", error);
    return responder(res, 200, { ok: true, mensaje: MENSAJE_GENERICO });
  }
}
