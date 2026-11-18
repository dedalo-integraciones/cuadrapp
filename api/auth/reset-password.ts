import {
  encabezado,
  ipCliente,
  leerBody,
  metodo,
  responder,
} from "../../src/server/http.js";
import { auditar } from "../../src/server/audit.js";
import {
  MAX_INTENTOS_POR_TOKEN,
  MENSAJE_TOKEN_INVALIDO,
  VENTANA_RESET_MS,
  claveToken,
  consumirTokenReset,
  tenantDeUsuario,
  validarClave,
} from "../../src/server/password-reset.js";
import {
  estadoLimite,
  registrarIntento,
} from "../../src/server/rate-limit.js";

function tokenInvalido(res: any) {
  return responder(res, 200, {
    ok: false,
    error: "TOKEN_INVALIDO",
    mensaje: MENSAJE_TOKEN_INVALIDO,
  });
}

/**
 * POST /api/auth/reset-password
 * body: { token, nueva_password, website_url? }
 *
 * Mismo modelo que Icaria: límite por token, token de un solo uso, una hora
 * de vigencia y bcrypt. No confirma si el token existió o no.
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

    // Honeypot: se responde como token inválido y no se procesa nada.
    if (String(body.website_url || "").trim() !== "") {
      return tokenInvalido(res);
    }

    const token =
      typeof body.token === "string" ? body.token.trim().slice(0, 128) : "";
    if (!token) return tokenInvalido(res);

    const limite = await estadoLimite(
      claveToken(token),
      MAX_INTENTOS_POR_TOKEN,
      VENTANA_RESET_MS
    );
    if (!limite.permitido) {
      return responder(res, 200, {
        ok: false,
        error: "RATE_LIMIT",
        mensaje: `Demasiados intentos. Espere ${Math.max(
          1,
          limite.minutosRestantes
        )} minutos.`,
      });
    }
    await registrarIntento(
      claveToken(token),
      MAX_INTENTOS_POR_TOKEN,
      VENTANA_RESET_MS
    );

    const clave = validarClave(body.nueva_password);
    if (clave.ok === false) {
      return responder(res, 400, {
        ok: false,
        error: "VALIDACION",
        mensaje: clave.mensaje,
      });
    }

    const resultado = await consumirTokenReset(token, clave.valor);
    if (!resultado.ok) return tokenInvalido(res);

    void auditar(
      await tenantDeUsuario(resultado.userId),
      resultado.userId,
      "PASSWORD_RESET_SUCCESS",
      { email: resultado.email, ip: ipCliente(req) }
    );

    return responder(res, 200, {
      ok: true,
      mensaje: "Clave actualizada. Ya puede ingresar al panel.",
    });
  } catch (error) {
    console.error("[api/auth/reset-password] error", error);
    return tokenInvalido(res);
  }
}
