-- Cuadra · Base por negocio (tenant)
-- Ejecutar con: npm run db:migrate:tenant

CREATE TABLE IF NOT EXISTS rubros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rubro TEXT NOT NULL,
  descripcion TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  color TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_rubro INTEGER NOT NULL REFERENCES rubros(id) ON DELETE RESTRICT,
  categoria TEXT NOT NULL,
  descripcion TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  color TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_categorias_rubro
  ON categorias(id_rubro, orden);

CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_categoria INTEGER NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
  nombre TEXT NOT NULL,
  detalle_1 TEXT,
  detalle_2 TEXT,
  precio_cents INTEGER NOT NULL DEFAULT 0,
  color TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  destacado INTEGER NOT NULL DEFAULT 0,
  popular INTEGER NOT NULL DEFAULT 0,
  orden INTEGER NOT NULL DEFAULT 0,
  imagen TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_productos_categoria
  ON productos(id_categoria, orden);

CREATE INDEX IF NOT EXISTS idx_productos_activo
  ON productos(activo, orden);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
