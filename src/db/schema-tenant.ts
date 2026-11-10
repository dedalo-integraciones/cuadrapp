import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Base por negocio (tenant). En v1 NO se persisten órdenes: el pedido se
 * arma en el navegador y se envía por WhatsApp. Ver spec/pedidos-whatsapp.md.
 */
export const rubros = sqliteTable("rubros", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  rubro: text("rubro").notNull(),
  descripcion: text("descripcion"),
  orden: integer("orden", { mode: "number" }).notNull().default(0),
  color: text("color"),
  activo: integer("activo", { mode: "number" }).notNull().default(1),
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
  updated_at: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const categorias = sqliteTable("categorias", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  id_rubro: integer("id_rubro", { mode: "number" }).notNull().references(() => rubros.id),
  categoria: text("categoria").notNull(),
  descripcion: text("descripcion"),
  orden: integer("orden", { mode: "number" }).notNull().default(0),
  color: text("color"),
  activo: integer("activo", { mode: "number" }).notNull().default(1),
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
  updated_at: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const productos = sqliteTable("productos", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  id_categoria: integer("id_categoria", { mode: "number" }).notNull().references(() => categorias.id),
  nombre: text("nombre").notNull(),
  detalle_1: text("detalle_1"),
  detalle_2: text("detalle_2"),
  /** Precio SIEMPRE en centavos (INTEGER). En UI se muestra en pesos. */
  precio_cents: integer("precio_cents", { mode: "number" }).notNull().default(0),
  color: text("color"),
  activo: integer("activo", { mode: "number" }).notNull().default(1),
  destacado: integer("destacado", { mode: "number" }).notNull().default(0),
  popular: integer("popular", { mode: "number" }).notNull().default(0),
  orden: integer("orden", { mode: "number" }).notNull().default(0),
  imagen: text("imagen"),
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
  updated_at: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
