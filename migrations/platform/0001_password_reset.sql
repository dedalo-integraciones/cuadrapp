-- Cuadra - Recuperación de clave y secretos de servidor
-- Ejecutar con: npm run db:migrate:core

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reset_user
  ON password_reset_tokens(user_id, used);

CREATE INDEX IF NOT EXISTS idx_reset_expira
  ON password_reset_tokens(expires_at);

CREATE TABLE IF NOT EXISTS app_secrets (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);
