import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Base de plataforma (core). Una sola por instalación de Cuadra.
 * Regla: `turso_db` NUNCA se expone en respuestas públicas.
 */
export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  mode: text("mode").notNull().default("pedidos"),
  flags: text("flags").notNull().default("{}"),
  brand: text("brand").notNull().default("{}"),
  turso_db: text("turso_db").notNull(),
  status: text("status").notNull().default("activo"),
  documento_fiscal: text("documento_fiscal"),
  telefono: text("telefono"),
  whatsapp: text("whatsapp"),
  whatsapp_pedidos: text("whatsapp_pedidos"),
  email_contacto: text("email_contacto"),
  email_pedidos: text("email_pedidos"),
  horario_atencion: text("horario_atencion"),
  direccion_linea1: text("direccion_linea1"),
  direccion_linea2: text("direccion_linea2"),
  localidad: text("localidad"),
  provincia_estado: text("provincia_estado"),
  codigo_postal: text("codigo_postal"),
  pais: text("pais"),
  moneda_simbolo: text("moneda_simbolo").default("$"),
  max_registros: integer("max_registros", { mode: "number" }).default(150),
  fecha_vencimiento: text("fecha_vencimiento"),
  max_admins: integer("max_admins", { mode: "number" }).default(3),
  mostrar_precios: integer("mostrar_precios", { mode: "boolean" }).notNull().default(true),
  pasarela_pagos: integer("pasarela_pagos", { mode: "boolean" }).notNull().default(false),
  gestion_entrega: integer("gestion_entrega", { mode: "boolean" }).notNull().default(false),
  texto_atencion: text("texto_atencion"),
  texto_hero: text("texto_hero"),
  texto_hero_bajada: text("texto_hero_bajada"),
  texto_footer: text("texto_footer"),
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  name: text("name").notNull(),
  is_superadmin: integer("is_superadmin", { mode: "number" }).notNull().default(0),
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const memberships = sqliteTable("memberships", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  user_id: integer("user_id", { mode: "number" }).notNull().references(() => users.id),
  tenant_id: text("tenant_id").notNull().references(() => tenants.id),
  role: text("role").notNull().default("admin"),
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const rateLimits = sqliteTable("rate_limits", {
  clave: text("clave").primaryKey(),
  intentos: integer("intentos", { mode: "number" }).notNull().default(0),
  ventana_inicio: integer("ventana_inicio", { mode: "number" }).notNull(),
  bloqueado_hasta: integer("bloqueado_hasta", { mode: "number" }),
});

export const auditLog = sqliteTable("audit_log", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  tenant_id: text("tenant_id"),
  user_id: integer("user_id", { mode: "number" }),
  accion: text("accion").notNull(),
  detalle: text("detalle").notNull().default("{}"),
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
});
