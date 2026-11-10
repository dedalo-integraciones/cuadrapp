-- Cuadra · Base de plataforma (core)
-- Ejecutar con: npm run db:migrate:core

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'pedidos',
  flags TEXT NOT NULL DEFAULT '{}',
  brand TEXT NOT NULL DEFAULT '{}',
  turso_db TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'activo',
  documento_fiscal TEXT,
  telefono TEXT,
  whatsapp TEXT,
  whatsapp_pedidos TEXT,
  email_contacto TEXT,
  email_pedidos TEXT,
  horario_atencion TEXT,
  direccion_linea1 TEXT,
  direccion_linea2 TEXT,
  localidad TEXT,
  provincia_estado TEXT,
  codigo_postal TEXT,
  pais TEXT,
  moneda_simbolo TEXT DEFAULT '$',
  max_registros INTEGER DEFAULT 150,
  fecha_vencimiento TEXT,
  max_admins INTEGER DEFAULT 3,
  mostrar_precios INTEGER NOT NULL DEFAULT 1,
  pasarela_pagos INTEGER NOT NULL DEFAULT 0,
  gestion_entrega INTEGER NOT NULL DEFAULT 0,
  texto_atencion TEXT,
  texto_hero TEXT,
  texto_hero_bajada TEXT,
  texto_footer TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  is_superadmin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS memberships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_user_tenant
  ON memberships(user_id, tenant_id);

CREATE TABLE IF NOT EXISTS rate_limits (
  clave TEXT PRIMARY KEY,
  intentos INTEGER NOT NULL DEFAULT 0,
  ventana_inicio INTEGER NOT NULL,
  bloqueado_hasta INTEGER
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT,
  user_id INTEGER,
  accion TEXT NOT NULL,
  detalle TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant_fecha
  ON audit_log(tenant_id, created_at);
