import "dotenv/config";
import fs from "node:fs";
import {
  buscarTenant,
  faltantesLegal,
  leerLegalTenant,
  type TenantLegalRow,
} from "../src/db/tenant";
import { getCoreClient } from "../src/db/core";

/**
 * Carga inicial de los datos legales y comerciales de un negocio.
 * Uso: npm run db:tenant:legal -- <slug> <archivo.json>
 *
 * La usa Dédalo al vender la suscripción. El JSON toma los datos de
 * `scripts/legal-ejemplo.json`. No imprime datos sensibles.
 */
function texto(valor: unknown, max: number): string {
  return String(valor ?? "").trim().slice(0, max);
}

function bool(valor: unknown): number {
  return valor === true || valor === 1 || valor === "1" || valor === "true" ? 1 : 0;
}

async function main() {
  const slug = String(process.argv[2] || "").trim().toLowerCase();
  const ruta = String(process.argv[3] || "").trim();
  if (!slug || !ruta) {
    throw new Error("Uso: npm run db:tenant:legal -- <slug> <archivo.json>");
  }

  const tenant = await buscarTenant(slug);
  if (!tenant) throw new Error(`No existe el negocio ${slug}`);

  const datos = JSON.parse(fs.readFileSync(ruta, "utf8")) as Record<string, unknown>;
  const legalActual = await leerLegalTenant(slug);

  const tenantNuevo = {
    ...tenant,
    name: texto(datos.nombre_comercial ?? tenant.name, 120),
    documento_fiscal: texto(datos.documento_fiscal ?? tenant.documento_fiscal, 40),
    telefono: texto(datos.telefono ?? tenant.telefono, 40),
    whatsapp: texto(datos.whatsapp ?? tenant.whatsapp, 40),
    whatsapp_pedidos: texto(datos.whatsapp_pedidos ?? tenant.whatsapp_pedidos, 40),
    email_contacto: texto(datos.email_contacto ?? tenant.email_contacto, 254).toLowerCase(),
    email_pedidos: texto(datos.email_pedidos ?? tenant.email_pedidos, 254).toLowerCase(),
    horario_atencion: texto(datos.horario_atencion ?? tenant.horario_atencion, 120),
    direccion_linea1: texto(datos.direccion_linea1 ?? tenant.direccion_linea1, 160),
    direccion_linea2: texto(datos.direccion_linea2 ?? tenant.direccion_linea2, 160),
    localidad: texto(datos.localidad ?? tenant.localidad, 80),
    provincia_estado: texto(datos.provincia_estado ?? tenant.provincia_estado, 80),
    codigo_postal: texto(datos.codigo_postal ?? tenant.codigo_postal, 20),
    pais: texto(datos.pais ?? tenant.pais, 60),
  };

  const legal: TenantLegalRow = {
    tenant_id: slug,
    razon_social: texto(datos.razon_social ?? legalActual?.razon_social, 120),
    // Columnas heredadas: se conservan si ya existen.
    jurisdiccion: texto(legalActual?.jurisdiccion, 120),
    entrega_retiro: bool(datos.entrega_retiro ?? legalActual?.entrega_retiro),
    entrega_envio: bool(datos.entrega_envio ?? legalActual?.entrega_envio),
    entrega_zonas: texto(datos.entrega_zonas ?? legalActual?.entrega_zonas, 200),
    entrega_demora: texto(datos.entrega_demora ?? legalActual?.entrega_demora, 120),
    envio_costo: texto(datos.envio_costo ?? legalActual?.envio_costo, 120),
    envio_costo_cents: legalActual?.envio_costo_cents ?? null,
    cambios_plazo_dias: legalActual?.cambios_plazo_dias ?? null,
    cambios_condiciones: texto(legalActual?.cambios_condiciones, 600),
    medios_pago: texto(datos.medios_pago ?? legalActual?.medios_pago, 200),
    condiciones_extra: texto(datos.condiciones_extra ?? legalActual?.condiciones_extra, 800),
    vende_alcohol: bool(datos.vende_alcohol ?? legalActual?.vende_alcohol),
    actualizado_en: legalActual?.actualizado_en || "",
  };

  const faltan = faltantesLegal(tenantNuevo, legal);
  if (faltan.length > 0) {
    throw new Error(`Faltan datos obligatorios: ${faltan.join(", ")}`);
  }

  const core = getCoreClient();
  await core.execute({
    sql: `UPDATE tenants SET
      name = ?, documento_fiscal = ?, telefono = ?, whatsapp = ?, whatsapp_pedidos = ?,
      email_contacto = ?, email_pedidos = ?, horario_atencion = ?, direccion_linea1 = ?,
      direccion_linea2 = ?, localidad = ?, provincia_estado = ?, codigo_postal = ?, pais = ?
      WHERE id = ?`,
    args: [
      tenantNuevo.name,
      tenantNuevo.documento_fiscal,
      tenantNuevo.telefono,
      tenantNuevo.whatsapp,
      tenantNuevo.whatsapp_pedidos,
      tenantNuevo.email_contacto,
      tenantNuevo.email_pedidos,
      tenantNuevo.horario_atencion,
      tenantNuevo.direccion_linea1,
      tenantNuevo.direccion_linea2,
      tenantNuevo.localidad,
      tenantNuevo.provincia_estado,
      tenantNuevo.codigo_postal,
      tenantNuevo.pais,
      slug,
    ],
  });

  await core.execute({
    sql: `INSERT INTO tenant_legal (
        tenant_id, razon_social, jurisdiccion, entrega_retiro, entrega_envio,
        entrega_zonas, entrega_demora, envio_costo_cents, cambios_plazo_dias,
        cambios_condiciones, medios_pago, condiciones_extra, vende_alcohol, actualizado_en
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(tenant_id) DO UPDATE SET
        razon_social = excluded.razon_social,
        jurisdiccion = excluded.jurisdiccion,
        entrega_retiro = excluded.entrega_retiro,
        entrega_envio = excluded.entrega_envio,
        entrega_zonas = excluded.entrega_zonas,
        entrega_demora = excluded.entrega_demora,
        envio_costo_cents = excluded.envio_costo_cents,
        cambios_plazo_dias = excluded.cambios_plazo_dias,
        cambios_condiciones = excluded.cambios_condiciones,
        medios_pago = excluded.medios_pago,
        condiciones_extra = excluded.condiciones_extra,
        vende_alcohol = excluded.vende_alcohol,
        actualizado_en = datetime('now')`,
    args: [
      legal.tenant_id,
      legal.razon_social,
      legal.jurisdiccion,
      legal.entrega_retiro,
      legal.entrega_envio,
      legal.entrega_zonas,
      legal.entrega_demora,
      legal.envio_costo_cents,
      legal.cambios_plazo_dias,
      legal.cambios_condiciones,
      legal.medios_pago,
      legal.condiciones_extra,
      legal.vende_alcohol,
    ],
  });

  await core.execute({
    sql: `INSERT INTO tenant_legal_envio (tenant_id, envio_costo, actualizado_en)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(tenant_id) DO UPDATE SET
        envio_costo = excluded.envio_costo,
        actualizado_en = datetime('now')`,
    args: [legal.tenant_id, legal.envio_costo],
  });

  console.log(`[db] datos legales cargados para ${slug}.`);
  console.log("[db] términos y privacidad quedan publicados en el sitio.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[db] error:", error.message);
    process.exit(1);
  });
