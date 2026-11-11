import type { Client } from "@libsql/client";
import { crearClienteLibsql } from "./client.js";
import { getCoreClient } from "./core.js";

export const TENANT_DEFAULT = "cuadra";
const TENANT_RE = /^[a-z0-9][a-z0-9-]{1,48}$/;

export type TenantRow = {
  id: string;
  name: string;
  mode: string;
  flags: string;
  brand: string;
  turso_db: string;
  status: string;
  documento_fiscal: string | null;
  telefono: string | null;
  whatsapp: string | null;
  whatsapp_pedidos: string | null;
  email_contacto: string | null;
  email_pedidos: string | null;
  horario_atencion: string | null;
  direccion_linea1: string | null;
  direccion_linea2: string | null;
  localidad: string | null;
  provincia_estado: string | null;
  codigo_postal: string | null;
  pais: string | null;
  moneda_simbolo: string | null;
  max_registros: number | null;
  fecha_vencimiento: string | null;
  max_admins: number | null;
  mostrar_precios: number | boolean;
  pasarela_pagos: number | boolean;
  gestion_entrega: number | boolean;
  texto_atencion: string | null;
  texto_hero: string | null;
  texto_hero_bajada: string | null;
  texto_footer: string | null;
  created_at: string;
};

/** Lee un tenant de la base core. Devuelve null si no existe. */
export async function buscarTenant(slug: string): Promise<TenantRow | null> {
  const id = String(slug || "").trim().toLowerCase();
  if (!TENANT_RE.test(id)) return null;
  const rs = await getCoreClient().execute({
    sql: "SELECT * FROM tenants WHERE id = ? LIMIT 1",
    args: [id],
  });
  if (rs.rows.length === 0) return null;
  return rs.rows[0] as unknown as TenantRow;
}

/** Cliente de la base del negocio. `turso_db` jamás sale al cliente. */
export function getTenantClient(tenant: TenantRow): Client {
  const url = tenant.turso_db;
  if (!url) {
    throw new Error("El tenant no tiene base de datos configurada");
  }
  return crearClienteLibsql(url, process.env.TURSO_APP_TOKEN);
}

/** Slug efectivo: query/body/header, luego entorno, luego `cuadra`. */
export function resolverTenantSlug(req: any): string {
  const candidatos = [
    req?.query?.tenant,
    req?.body?.tenant,
    req?.headers?.["x-tenant"],
    process.env.TENANT_OVERRIDE,
    TENANT_DEFAULT,
  ];
  for (const valor of candidatos) {
    const texto = Array.isArray(valor) ? valor[0] : valor;
    const limpio = String(texto || "").trim().toLowerCase();
    if (TENANT_RE.test(limpio)) return limpio;
  }
  return TENANT_DEFAULT;
}

export function hoyIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Un tenant vencido o suspendido no opera tienda ni panel. */
export function tenantVigente(tenant: TenantRow): boolean {
  if (tenant.status !== "activo") return false;
  if (tenant.fecha_vencimiento && tenant.fecha_vencimiento < hoyIso()) return false;
  return true;
}

export function parseJsonSeguro(valor: unknown, porDefecto: Record<string, unknown> = {}): Record<string, unknown> {
  try {
    if (typeof valor === "string" && valor.trim()) {
      const parsed = JSON.parse(valor);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    }
  } catch {
    // JSON inválido: se usa el valor por defecto.
  }
  return { ...porDefecto };
}

/** Datos que puede ver cualquier visitante. Nunca incluye `turso_db`. */
export function datosPublicosTenant(tenant: TenantRow) {
  return {
    id: tenant.id,
    name: tenant.name,
    mode: tenant.mode,
    brand: parseJsonSeguro(tenant.brand),
    whatsapp: tenant.whatsapp,
    whatsapp_pedidos: tenant.whatsapp_pedidos,
    telefono: tenant.telefono,
    email_contacto: tenant.email_contacto,
    email_pedidos: tenant.email_pedidos,
    horario_atencion: tenant.horario_atencion,
    direccion: {
      linea1: tenant.direccion_linea1,
      linea2: tenant.direccion_linea2,
      localidad: tenant.localidad,
      provincia: tenant.provincia_estado,
      codigo_postal: tenant.codigo_postal,
      pais: tenant.pais,
    },
    moneda_simbolo: tenant.moneda_simbolo || "$",
    mostrar_precios: Boolean(tenant.mostrar_precios),
    textos: {
      atencion: tenant.texto_atencion,
      hero: tenant.texto_hero,
      hero_bajada: tenant.texto_hero_bajada,
      footer: tenant.texto_footer,
    },
  };
}

/** Datos completos para el panel (sin secretos de infraestructura). */
export function parametrosTenant(tenant: TenantRow) {
  return {
    tenant_id: tenant.id,
    nombre_comercial: tenant.name,
    mode: tenant.mode,
    documento_fiscal: tenant.documento_fiscal || "",
    telefono: tenant.telefono || "",
    whatsapp: tenant.whatsapp || "",
    whatsapp_pedidos: tenant.whatsapp_pedidos || "",
    email_contacto: tenant.email_contacto || "",
    email_pedidos: tenant.email_pedidos || "",
    redes: parseJsonSeguro(tenant.brand),
    horario_atencion: tenant.horario_atencion || "",
    direccion_linea1: tenant.direccion_linea1 || "",
    direccion_linea2: tenant.direccion_linea2 || "",
    localidad: tenant.localidad || "",
    provincia_estado: tenant.provincia_estado || "",
    codigo_postal: tenant.codigo_postal || "",
    pais: tenant.pais || "",
    moneda_simbolo: tenant.moneda_simbolo || "$",
    max_registros: Number(tenant.max_registros) || 150,
    fecha_vencimiento: tenant.fecha_vencimiento,
    mostrar_precios: Boolean(tenant.mostrar_precios),
    pasarela_pagos: Boolean(tenant.pasarela_pagos),
    gestion_entrega: Boolean(tenant.gestion_entrega),
    texto_atencion: tenant.texto_atencion || "",
    texto_hero: tenant.texto_hero || "",
    texto_hero_bajada: tenant.texto_hero_bajada || "",
    texto_footer: tenant.texto_footer || "",
  };
}
