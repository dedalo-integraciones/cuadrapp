import { getCoreClient } from "../db/core.js";

/** Ámbitos del límite de intentos del login: por IP y por cuenta. */
export type AmbitoRateLimit = "ip" | "email";

/**
 * Intentos permitidos por ventana del login. El email tiene un margen mayor
 * para no facilitar el bloqueo de una cuenta desde varias IPs.
 */
export const MAX_INTENTOS: Record<AmbitoRateLimit, number> = {
  ip: 5,
  email: 10,
};

export const VENTANA_MS = 15 * 60 * 1000;

export type EstadoRateLimit = {
  permitido: boolean;
  intentos: number;
  restantes: number;
  minutosRestantes: number;
};

function clave(ambito: AmbitoRateLimit, valor: string): string {
  return `login:${ambito}:${valor}`;
}

/**
 * Estado de un contador genérico. La clave incluye el prefijo del flujo
 * (`login:`, `reset:`) para que los contadores no se mezclen.
 */
export async function estadoLimite(
  claveContador: string,
  max: number,
  ventanaMs: number
): Promise<EstadoRateLimit> {
  const ahora = Date.now();
  const rs = await getCoreClient().execute({
    sql: "SELECT intentos, ventana_inicio, bloqueado_hasta FROM rate_limits WHERE clave = ? LIMIT 1",
    args: [claveContador],
  });
  if (rs.rows.length === 0) {
    return { permitido: true, intentos: 0, restantes: max, minutosRestantes: 0 };
  }
  const fila = rs.rows[0];
  const bloqueadoHasta = Number(fila["bloqueado_hasta"] || 0);
  if (bloqueadoHasta > ahora) {
    return {
      permitido: false,
      intentos: Number(fila["intentos"] || 0),
      restantes: 0,
      minutosRestantes: Math.ceil((bloqueadoHasta - ahora) / 60000),
    };
  }
  const ventana = Number(fila["ventana_inicio"] || 0);
  if (ahora - ventana > ventanaMs) {
    return { permitido: true, intentos: 0, restantes: max, minutosRestantes: 0 };
  }
  const intentos = Number(fila["intentos"] || 0);
  return {
    permitido: intentos < max,
    intentos,
    restantes: Math.max(0, max - intentos),
    minutosRestantes: 0,
  };
}

/**
 * Registra un intento. Un solo UPSERT: si la ventana venció reinicia el
 * contador; si no, incrementa de forma atómica. Evita perder intentos por
 * concurrencia.
 */
export async function registrarIntento(
  claveContador: string,
  max: number,
  ventanaMs: number
): Promise<void> {
  const ahora = Date.now();
  const inicioVentana = ahora - ventanaMs;

  await getCoreClient().execute({
    sql: `INSERT INTO rate_limits (clave, intentos, ventana_inicio, bloqueado_hasta)
          VALUES (?, 1, ?, NULL)
          ON CONFLICT(clave) DO UPDATE SET
            intentos = CASE
              WHEN rate_limits.ventana_inicio <= ? THEN 1
              ELSE rate_limits.intentos + 1
            END,
            ventana_inicio = CASE
              WHEN rate_limits.ventana_inicio <= ? THEN ?
              ELSE rate_limits.ventana_inicio
            END,
            bloqueado_hasta = CASE
              WHEN rate_limits.ventana_inicio <= ? THEN NULL
              WHEN rate_limits.intentos + 1 >= ? THEN ?
              ELSE rate_limits.bloqueado_hasta
            END`,
    args: [
      claveContador,
      ahora,
      inicioVentana,
      inicioVentana,
      ahora,
      inicioVentana,
      max,
      ahora + ventanaMs,
    ],
  });
}

export async function limpiarLimite(claveContador: string): Promise<void> {
  await getCoreClient().execute({
    sql: "DELETE FROM rate_limits WHERE clave = ?",
    args: [claveContador],
  });
}

export async function estadoRateLimit(
  ambito: AmbitoRateLimit,
  valor: string
): Promise<EstadoRateLimit> {
  return estadoLimite(clave(ambito, valor), MAX_INTENTOS[ambito], VENTANA_MS);
}

export async function registrarFallo(
  ambito: AmbitoRateLimit,
  valor: string
): Promise<void> {
  return registrarIntento(clave(ambito, valor), MAX_INTENTOS[ambito], VENTANA_MS);
}

export async function limpiarRateLimit(
  ambito: AmbitoRateLimit,
  valor: string
): Promise<void> {
  return limpiarLimite(clave(ambito, valor));
}
