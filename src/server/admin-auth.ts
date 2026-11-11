import { getCoreClient } from "../db/core.js";
import {
  buscarTenant,
  getTenantClient,
  tenantVigente,
  type TenantRow,
} from "../db/tenant.js";
import { texto } from "./http.js";
import type { Client } from "@libsql/client";

export type UsuarioAdmin = {
  id: number;
  email: string;
  name: string;
  is_superadmin: number;
};

export type ResultadoAuth =
  | { ok: true; usuario: UsuarioAdmin; tenant: TenantRow; db: Client }
  | { ok: false; status: number; error: string; mensaje: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Revalida por request: email existente + membership + tenant vigente.
 * No hay JWT: el email actúa como identificador de sesión, igual que en Icaria.
 */
export async function autenticarAdmin(slug: string, emailEntrada: unknown): Promise<ResultadoAuth> {
  const email = texto(emailEntrada, 254).toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { ok: false, status: 401, error: "TOKEN_INVALIDO", mensaje: "Sesión no válida." };
  }

  const tenant = await buscarTenant(slug);
  if (!tenant) {
    return { ok: false, status: 404, error: "TENANT_NO_ENCONTRADO", mensaje: "El negocio no existe." };
  }
  if (!tenantVigente(tenant)) {
    return {
      ok: false,
      status: 403,
      error: "TENANT_BLOQUEADO",
      mensaje: "El negocio está suspendido o vencido. Contacte al administrador de la plataforma.",
    };
  }

  const core = getCoreClient();
  const usuarioRs = await core.execute({
    sql: "SELECT id, email, name, is_superadmin FROM users WHERE email = ? LIMIT 1",
    args: [email],
  });
  if (usuarioRs.rows.length === 0) {
    return { ok: false, status: 401, error: "TOKEN_INVALIDO", mensaje: "Sesión no válida." };
  }
  const usuario = usuarioRs.rows[0] as unknown as UsuarioAdmin;

  const membership = await core.execute({
    sql: "SELECT role FROM memberships WHERE user_id = ? AND tenant_id = ? LIMIT 1",
    args: [usuario.id, tenant.id],
  });
  if (membership.rows.length === 0) {
    return { ok: false, status: 403, error: "SIN_PERMISO", mensaje: "La cuenta no tiene acceso a este negocio." };
  }

  return { ok: true, usuario, tenant, db: getTenantClient(tenant) };
}
