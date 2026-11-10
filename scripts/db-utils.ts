import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import type { Client } from "@libsql/client";
import { crearClienteLibsql } from "../src/db/client";
import { getCoreClient } from "../src/db/core";
import { buscarTenant, TENANT_DEFAULT, type TenantRow } from "../src/db/tenant";

export function ejecutarSql(client: Client, sqlTexto: string): Promise<void> {
  const sinComentarios = sqlTexto
    .split(/\r?\n/)
    .filter((linea) => !linea.trim().startsWith("--"))
    .join("\n");
  const sentencias = sinComentarios
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return (async () => {
    for (const sentencia of sentencias) {
      await client.execute(sentencia);
    }
  })();
}

export async function migrarCore(): Promise<void> {
  const ruta = path.resolve(process.cwd(), "migrations/platform/0000_init.sql");
  const sqlTexto = fs.readFileSync(ruta, "utf8");
  await ejecutarSql(getCoreClient(), sqlTexto);
  console.log("[db] core migrado:", process.env.TURSO_CORE_URL);
}

export async function migrarTenant(url: string, token?: string | null): Promise<void> {
  const ruta = path.resolve(process.cwd(), "migrations/tenant/0000_init.sql");
  const sqlTexto = fs.readFileSync(ruta, "utf8");
  const client = crearClienteLibsql(url, token ?? process.env.TURSO_APP_TOKEN);
  await ejecutarSql(client, sqlTexto);
  console.log("[db] tenant migrado:", url);
}

export function slugDeArgumentos(): string {
  return (process.argv[2] || process.env.TENANT_OVERRIDE || TENANT_DEFAULT).trim().toLowerCase();
}

export function urlTenantPorDefecto(): string {
  return process.env.TURSO_APP_URL || "file:./data/cuadra-app.db";
}

export async function obtenerTenant(slug: string): Promise<TenantRow | null> {
  return buscarTenant(slug);
}

export async function asegurarTenant(slug: string, nombre?: string, url?: string): Promise<TenantRow> {
  await migrarCore();
  const existente = await buscarTenant(slug);
  if (existente) {
    if (url && existente.turso_db !== url) {
      await getCoreClient().execute({
        sql: "UPDATE tenants SET turso_db = ? WHERE id = ?",
        args: [url, slug],
      });
      return { ...existente, turso_db: url };
    }
    return existente;
  }

  const urlFinal = url || urlTenantPorDefecto();
  const brand = JSON.stringify({
    logo: "/images/logo.webp",
    hero: "/images/hero.webp",
    colores: { primario: "#C91810", fondo: "#040706", acento: "#0055A4" },
  });
  await getCoreClient().execute({
    sql: `INSERT INTO tenants
      (id, name, mode, flags, brand, turso_db, status, whatsapp, whatsapp_pedidos,
       moneda_simbolo, max_registros, max_admins, mostrar_precios, pasarela_pagos,
       gestion_entrega, texto_atencion, texto_hero, texto_hero_bajada, texto_footer)
      VALUES (?, ?, 'pedidos', '{}', ?, ?, 'activo', ?, ?, '$', 150, 3, 1, 0, 0, ?, ?, ?, ?)`,
    args: [
      slug,
      nombre || `Cuadra ${slug}`,
      brand,
      urlFinal,
      "5492617202706",
      "5492617202706",
      "Pedidos y consultas por WhatsApp",
      "Nuestro Menú",
      "Pedidos por WhatsApp para negocios de cercanía",
      "Cuadra: plataforma de pedidos por WhatsApp para negocios de cercanía",
    ],
  });
  const creado = await buscarTenant(slug);
  if (!creado) throw new Error("No se pudo crear el tenant");
  return creado;
}
