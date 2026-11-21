import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { getCoreClient } from "../db/core.js";

/**
 * Lógica de recuperación de clave. Copia el modelo de Icaria:
 * - token aleatorio de 32 bytes, una sola vez, válido 1 hora;
 * - respuesta pública siempre igual, exista o no el email;
 * - límites propios por email y por token;
 * - auditoría del pedido y del cambio.
 *
 * Este módulo es solo de servidor: nunca se importa desde el navegador.
 */

export const TOKEN_BYTES = 32;
export const EXPIRA_MS = 60 * 60 * 1000;
export const MAX_PEDIDOS_POR_EMAIL = 3;
export const MAX_PEDIDOS_POR_IP = 10;
export const MAX_INTENTOS_POR_TOKEN = 5;
export const VENTANA_RESET_MS = 60 * 60 * 1000;
export const MIN_CLAVE = 8;
export const MAX_CLAVE = 72;

export const MENSAJE_GENERICO =
  "Si el email está registrado, recibirá instrucciones. El link expira en 1 hora.";
export const MENSAJE_TOKEN_INVALIDO =
  "El link de recuperación es inválido, ya se usó o venció.";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HOST_RE = /^[a-z0-9.-]+(?::\d{2,5})?$/i;

export type UsuarioReset = {
  id: number;
  email: string;
  name: string;
};

export type ResultadoClave =
  | { ok: true; valor: string }
  | { ok: false; mensaje: string };

/** Email: trim + minúsculas + formato + máximo 254. */
export function normalizarEmail(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const limpio = valor.trim().toLowerCase();
  if (!limpio || limpio.length > 254 || !EMAIL_RE.test(limpio)) return null;
  return limpio;
}

/** Clave: mínimo 8 y máximo 72, sin recortar espacios laterales. */
export function validarClave(valor: unknown): ResultadoClave {
  if (typeof valor !== "string") {
    return { ok: false, mensaje: "La clave es obligatoria." };
  }
  if (valor.length < MIN_CLAVE) {
    return { ok: false, mensaje: `La clave debe tener al menos ${MIN_CLAVE} caracteres.` };
  }
  if (valor.length > MAX_CLAVE) {
    return { ok: false, mensaje: `La clave no puede superar ${MAX_CLAVE} caracteres.` };
  }
  return { ok: true, valor };
}

export function clavePedido(email: string): string {
  return `reset:pedido:${email}`.slice(0, 254);
}

export function clavePedidoIp(ip: string): string {
  return `reset:ip:${ip}`.slice(0, 80);
}

export function claveToken(token: string): string {
  // La clave de límite tampoco guarda el token en claro: se usa su huella.
  return `reset:token:${huellaToken(token)}`;
}

/**
 * En la base se guarda solo la huella SHA-256 del token. El link lleva el token
 * original; si alguien obtiene una copia de la tabla, no puede usarlo.
 */
function huellaToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function buscarUsuarioPorEmail(
  email: string
): Promise<UsuarioReset | null> {
  const rs = await getCoreClient().execute({
    sql: "SELECT id, email, name FROM users WHERE email = ? LIMIT 1",
    args: [email],
  });
  if (rs.rows.length === 0) return null;
  const fila = rs.rows[0];
  return {
    id: Number(fila["id"]),
    email: String(fila["email"] || ""),
    name: String(fila["name"] || ""),
  };
}

export async function tenantDeUsuario(userId: number): Promise<string | null> {
  try {
    const rs = await getCoreClient().execute({
      sql: "SELECT tenant_id FROM memberships WHERE user_id = ? ORDER BY id LIMIT 1",
      args: [userId],
    });
    const tenant = String(rs.rows[0]?.["tenant_id"] || "").trim();
    return tenant || null;
  } catch {
    return null;
  }
}

export async function nombreComercioDeUsuario(
  userId: number
): Promise<string> {
  try {
    const rs = await getCoreClient().execute({
      sql: `SELECT t.name AS nombre
            FROM memberships m
            JOIN tenants t ON t.id = m.tenant_id
            WHERE m.user_id = ?
            ORDER BY m.id LIMIT 1`,
      args: [userId],
    });
    const nombre = String(rs.rows[0]?.["nombre"] || "").trim();
    return nombre || "Cuadra";
  } catch {
    return "Cuadra";
  }
}

/**
 * Invalida los tokens anteriores sin usar, poda los usados/vencidos del mismo
 * usuario y crea uno nuevo. Así un pedido nuevo anula el link anterior.
 */
export async function crearTokenReset(userId: number): Promise<string> {
  const core = getCoreClient();
  const token = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const expira = new Date(Date.now() + EXPIRA_MS).toISOString();
  const ahora = new Date().toISOString();

  await core.batch(
    [
      {
        // Poda de este usuario: los usados no sirven y los vencidos tampoco.
        sql: `DELETE FROM password_reset_tokens
              WHERE user_id = ? AND (used = 1 OR expires_at < ?)`,
        args: [userId, ahora],
      },
      {
        sql: "UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0",
        args: [userId],
      },
      {
        sql: "INSERT INTO password_reset_tokens (user_id, token, expires_at, used) VALUES (?, ?, ?, 0)",
        args: [userId, huellaToken(token), expira],
      },
    ],
    "write"
  );

  return token;
}

/** Consulta la vigencia del token sin consumirlo ni marcar intentos. */
export async function tokenResetVigente(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const rs = await getCoreClient().execute({
      sql: "SELECT used, expires_at FROM password_reset_tokens WHERE token = ? LIMIT 1",
      args: [huellaToken(token)],
    });
    if (rs.rows.length === 0) return false;
    const fila = rs.rows[0];
    const expira = Date.parse(String(fila["expires_at"] || ""));
    return Number(fila["used"] || 0) === 0 && Number.isFinite(expira) && expira > Date.now();
  } catch {
    return false;
  }
}

export type ResultadoConsumo =
  | { ok: true; userId: number; email: string; nombre: string }
  | { ok: false };

/**
 * Valida el token, cambia la clave con bcrypt y marca todos los tokens del
 * usuario como usados. El cambio de clave y el marcado van en un batch.
 */
export async function consumirTokenReset(
  token: string,
  nuevaClave: string
): Promise<ResultadoConsumo> {
  const core = getCoreClient();
  const rs = await core.execute({
    sql: `SELECT t.id, t.user_id, t.expires_at, t.used, u.email, u.name
          FROM password_reset_tokens t
          JOIN users u ON u.id = t.user_id
          WHERE t.token = ? LIMIT 1`,
    args: [huellaToken(token)],
  });
  if (rs.rows.length === 0) return { ok: false };

  const fila = rs.rows[0];
  const usado = Number(fila["used"] || 0);
  const expira = Date.parse(String(fila["expires_at"] || ""));
  if (usado === 1 || !Number.isFinite(expira) || expira <= Date.now()) {
    return { ok: false };
  }

  const userId = Number(fila["user_id"]);
  const idToken = Number(fila["id"]);
  if (!userId || !idToken) return { ok: false };

  // Marca condicional: si otro pedido simultáneo ya lo consumió, este se
  // descarta antes de tocar la clave. Cierra la carrera de doble uso.
  const marcado = await core.execute({
    sql: "UPDATE password_reset_tokens SET used = 1 WHERE id = ? AND used = 0",
    args: [idToken],
  });
  if (Number(marcado.rowsAffected || 0) !== 1) return { ok: false };

  const hash = await bcrypt.hash(nuevaClave, 12);
  await core.batch(
    [
      {
        sql: "UPDATE users SET password_hash = ? WHERE id = ?",
        args: [hash, userId],
      },
      {
        sql: "UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0",
        args: [userId],
      },
    ],
    "write"
  );

  return {
    ok: true,
    userId,
    email: String(fila["email"] || ""),
    nombre: String(fila["name"] || ""),
  };
}

/**
 * Base pública para armar el link. Prioriza APP_DOMAIN; si no está, usa el
 * host de la request (Vercel y local). Nunca acepta un host con barras ni
 * caracteres raros, para que un header manipulado no cambie el destino.
 */
export function baseUrlDeRequest(req: any): string {
  const configurado = String(process.env.APP_DOMAIN || "").trim();
  if (configurado) {
    const conProtocolo = /^https?:\/\//i.test(configurado)
      ? configurado
      : `https://${configurado}`;
    try {
      const url = new URL(conProtocolo);
      if (url.hostname) return `${url.protocol}//${url.host}`;
    } catch {
      // Sigue con el host de la request.
    }
  }

  const headers = (req?.headers ?? {}) as Record<string, unknown>;
  const hostCrudo = String(
    headers["x-forwarded-host"] ?? headers.host ?? ""
  )
    .split(",")[0]
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");

  if (hostCrudo && HOST_RE.test(hostCrudo)) {
    const protoCrudo = String(headers["x-forwarded-proto"] ?? "")
      .split(",")[0]
      .trim()
      .toLowerCase();
    const protocolo =
      protoCrudo === "http" || protoCrudo === "https"
        ? protoCrudo
        : /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(hostCrudo)
          ? "http"
          : "https";
    return `${protocolo}://${hostCrudo}`;
  }

  return "https://cuadrapp-orcin.vercel.app";
}

/** Nombre del negocio para el asunto del correo; nunca rompe el pedido. */
export async function nombreComercioParaEmail(userId: number): Promise<string> {
  return nombreComercioDeUsuario(userId);
}
