import type { Client } from "@libsql/client";
import { crearClienteLibsql } from "./client.js";
import { getCoreClient } from "./core.js";

const TENANT_RE = /^[a-z0-9][a-z0-9-]{1,48}$/;

const SLUG_ENTORNO = String(process.env.TENANT_OVERRIDE || "").trim().toLowerCase();

/**
 * Negocio por defecto del proceso. Cada instalación declara el suyo con
 * TENANT_OVERRIDE; "cuadra" queda solo como último recurso.
 */
export const TENANT_DEFAULT = TENANT_RE.test(SLUG_ENTORNO) ? SLUG_ENTORNO : "cuadra";

if (!TENANT_RE.test(SLUG_ENTORNO) && process.env.NODE_ENV === "production") {
  console.warn(
    "[tenant] TENANT_OVERRIDE no está definido; se usa 'cuadra' como negocio por defecto."
  );
}

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

export type TenantLegalRow = {
  tenant_id: string;
  razon_social: string;
  jurisdiccion: string;
  entrega_retiro: number | boolean;
  entrega_envio: number | boolean;
  entrega_zonas: string;
  entrega_demora: string;
  /** Costo de envío tal como se publica: "A convenir", "sin cargo", "500"… */
  envio_costo: string;
  /** Legado numérico; ya no se usa. */
  envio_costo_cents: number | null;
  cambios_plazo_dias: number | null;
  cambios_condiciones: string;
  medios_pago: string;
  condiciones_extra: string;
  vende_alcohol: number | boolean;
  actualizado_en: string;
};

/** Datos legales del negocio. Sin fila, se devuelve null (incompletos). */
export async function leerLegalTenant(tenantId: string): Promise<TenantLegalRow | null> {
  const rs = await getCoreClient().execute({
    sql: `SELECT l.*, COALESCE(e.envio_costo, '') AS envio_costo
          FROM tenant_legal l
          LEFT JOIN tenant_legal_envio e ON e.tenant_id = l.tenant_id
          WHERE l.tenant_id = ? LIMIT 1`,
    args: [tenantId],
  });
  if (rs.rows.length === 0) return null;
  return rs.rows[0] as unknown as TenantLegalRow;
}

function textoLegal(valor: unknown): string {
  return String(valor ?? "").trim();
}

/**
 * Datos legales que puede ver un visitante. `completo` indica si están todos
 * los obligatorios: con `false`, las páginas legales muestran un aviso y no
 * publican contenido inventado.
 */
export function legalPublica(tenant: TenantRow, legal: TenantLegalRow | null) {
  const datos = {
    razon_social: textoLegal(legal?.razon_social),
    documento_fiscal: textoLegal(tenant.documento_fiscal),
    entrega_retiro: Number(legal?.entrega_retiro ?? 0) === 1,
    entrega_envio: Number(legal?.entrega_envio ?? 0) === 1,
    entrega_zonas: textoLegal(legal?.entrega_zonas),
    entrega_demora: textoLegal(legal?.entrega_demora),
    envio_costo: textoLegal(legal?.envio_costo),
    medios_pago: textoLegal(legal?.medios_pago),
    condiciones_extra: textoLegal(legal?.condiciones_extra),
    vende_alcohol: Number(legal?.vende_alcohol ?? 0) === 1,
    actualizado_en: textoLegal(legal?.actualizado_en),
  };

  return { ...datos, completo: faltantesLegal(tenant, legal).length === 0 };
}

/** Campos obligatorios que faltan para publicar los documentos legales. */
export function faltantesLegal(tenant: TenantRow, legal: TenantLegalRow | null): string[] {
  const faltan: string[] = [];
  const agregar = (valor: unknown, etiqueta: string) => {
    if (!textoLegal(valor)) faltan.push(etiqueta);
  };

  agregar(legal?.razon_social, "razón social");
  agregar(tenant.documento_fiscal, "documento fiscal");
  agregar(tenant.direccion_linea1, "dirección");
  agregar(tenant.localidad, "localidad");
  agregar(tenant.provincia_estado, "provincia");
  agregar(tenant.pais, "país");
  agregar(tenant.email_contacto, "email de contacto");
  agregar(tenant.telefono, "teléfono");
  agregar(tenant.horario_atencion, "horario de atención");
  agregar(legal?.medios_pago, "medios de pago");

  const retiro = Number(legal?.entrega_retiro ?? 0) === 1;
  const envio = Number(legal?.entrega_envio ?? 0) === 1;
  if (!retiro && !envio) faltan.push("forma de entrega (retiro o envío)");
  if (envio) {
    agregar(legal?.entrega_zonas, "zonas de envío");
    agregar(legal?.entrega_demora, "demora estimada de envío");
    agregar(legal?.envio_costo, "costo de envío");
  }

  return faltan;
}

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
export function datosPublicosTenant(tenant: TenantRow, legal: TenantLegalRow | null = null) {
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
    legal: legalPublica(tenant, legal),
  };
}

/** Datos completos para el panel (sin secretos de infraestructura). */
export function parametrosTenant(tenant: TenantRow, legal: TenantLegalRow | null = null) {
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
    legal: {
      razon_social: legal?.razon_social || "",
      entrega_retiro: Number(legal?.entrega_retiro ?? 0) === 1,
      entrega_envio: Number(legal?.entrega_envio ?? 0) === 1,
      entrega_zonas: legal?.entrega_zonas || "",
      entrega_demora: legal?.entrega_demora || "",
      envio_costo: legal?.envio_costo || "",
      medios_pago: legal?.medios_pago || "",
      condiciones_extra: legal?.condiciones_extra || "",
      vende_alcohol: Number(legal?.vende_alcohol ?? 0) === 1,
    },
    legal_faltantes: faltantesLegal(tenant, legal),
  };
}
