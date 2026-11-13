import { getCoreClient } from "../db/core.js";
import {
  buscarTenant,
  getTenantClient,
  tenantVigente,
  type TenantRow,
} from "../db/tenant.js";
import { leerSesion, type Sesion } from "./session.js";
import type { Client } from "@libsql/client";

export type UsuarioAdmin = {
  id: number;
  email: string;
  name: string;
  is_superadmin: number;
};

export type ResultadoAuth =
  | { ok: true; usuario: UsuarioAdmin; tenant: TenantRow; db: Client; sesion: Sesion }
  | { ok: false; status: number; error: string; mensaje: string };

/**
 * Revalida por request: token firmado y vigente + usuario existente +
 * membership + tenant vigente. El email ya no identifica una sesión.
 */
export async function autenticarAdmin(
  slug: string,
  tokenSesion: unknown
): Promise<ResultadoAuth> {
  const chequeo = leerSesion(tokenSesion, slug);
  if (chequeo.ok === false) {
    return chequeo.motivo === "VENCIDA"
      ? {
          ok: false,
          status: 401,
          error: "SESION_INACTIVA",
          mensaje: "La sesión se cerró por inactividad. Ingrese de nuevo.",
        }
      : {
          ok: false,
          status: 401,
          error: "SESION_INVALIDA",
          mensaje: "Sesión no válida.",
        };
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
    sql: "SELECT id, email, name, is_superadmin FROM users WHERE id = ? LIMIT 1",
    args: [chequeo.sesion.uid],
  });
  if (usuarioRs.rows.length === 0) {
    return { ok: false, status: 401, error: "SESION_INVALIDA", mensaje: "Sesión no válida." };
  }
  const usuario = usuarioRs.rows[0] as unknown as UsuarioAdmin;

  const membership = await core.execute({
    sql: "SELECT role FROM memberships WHERE user_id = ? AND tenant_id = ? LIMIT 1",
    args: [usuario.id, tenant.id],
  });
  if (membership.rows.length === 0) {
    return { ok: false, status: 403, error: "SIN_PERMISO", mensaje: "La cuenta no tiene acceso a este negocio." };
  }

  return {
    ok: true,
    usuario,
    tenant,
    db: getTenantClient(tenant),
    sesion: chequeo.sesion,
  };
}
