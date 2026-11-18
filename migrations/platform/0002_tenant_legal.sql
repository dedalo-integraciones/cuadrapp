-- Cuadra - Datos legales y comerciales del negocio
-- Ejecutar con: npm run db:migrate:core
--
-- Van en una tabla aparte para que la migración sea idempotente: los
-- `ALTER TABLE` de SQLite fallan al repetirse y migrarCore corre todos los
-- archivos en cada ejecución.
--
-- Sin fila, el negocio se considera con datos legales incompletos: puede operar,
-- pero las páginas de términos y privacidad no publican contenido.

CREATE TABLE IF NOT EXISTS tenant_legal (
  tenant_id TEXT PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  razon_social TEXT NOT NULL DEFAULT '',
  jurisdiccion TEXT NOT NULL DEFAULT '',
  entrega_retiro INTEGER NOT NULL DEFAULT 0,
  entrega_envio INTEGER NOT NULL DEFAULT 0,
  entrega_zonas TEXT NOT NULL DEFAULT '',
  entrega_demora TEXT NOT NULL DEFAULT '',
  envio_costo_cents INTEGER,
  cambios_plazo_dias INTEGER,
  cambios_condiciones TEXT NOT NULL DEFAULT '',
  medios_pago TEXT NOT NULL DEFAULT '',
  condiciones_extra TEXT NOT NULL DEFAULT '',
  vende_alcohol INTEGER NOT NULL DEFAULT 0,
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);
