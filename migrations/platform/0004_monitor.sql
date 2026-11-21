-- Cuadra - Alertas del monitor (idempotente)
-- Ejecutar con: npm run db:migrate:core

CREATE TABLE IF NOT EXISTS monitor_alertas (
  clave TEXT PRIMARY KEY,
  creado_en INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_monitor_creado
  ON monitor_alertas(creado_en);
