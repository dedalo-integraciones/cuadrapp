-- Cuadra - Costo de envío como texto libre ("A convenir", "sin cargo", "500", etc.)
-- Ejecutar con: npm run db:migrate:core
--
-- Va en una tabla aparte para que la migración sea idempotente: un ALTER TABLE
-- para agregar la columna fallaría al repetirse y migrarCore corre todos los
-- archivos en cada ejecución.
--
-- La columna numérica `tenant_legal.envio_costo_cents` queda como legado y deja
-- de usarse; el valor vigente es `tenant_legal_envio.envio_costo`.

CREATE TABLE IF NOT EXISTS tenant_legal_envio (
  tenant_id TEXT PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  envio_costo TEXT NOT NULL DEFAULT '',
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);
