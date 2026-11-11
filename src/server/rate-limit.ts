import { getCoreClient } from "../db/core.js";

export const MAX_INTENTOS = 5;
export const VENTANA_MS = 15 * 60 * 1000;

export type EstadoRateLimit = {
  permitido: boolean;
  intentos: number;
  restantes: number;
  minutosRestantes: number;
};

function clave(ip: string): string {
  return `login:${ip}`;
}

export async function estadoRateLimit(ip: string): Promise<EstadoRateLimit> {
  const ahora = Date.now();
  const rs = await getCoreClient().execute({
    sql: "SELECT intentos, ventana_inicio, bloqueado_hasta FROM rate_limits WHERE clave = ? LIMIT 1",
    args: [clave(ip)],
  });
  if (rs.rows.length === 0) {
    return { permitido: true, intentos: 0, restantes: MAX_INTENTOS, minutosRestantes: 0 };
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
  if (ahora - ventana > VENTANA_MS) {
    return { permitido: true, intentos: 0, restantes: MAX_INTENTOS, minutosRestantes: 0 };
  }
  const intentos = Number(fila["intentos"] || 0);
  return {
    permitido: intentos < MAX_INTENTOS,
    intentos,
    restantes: Math.max(0, MAX_INTENTOS - intentos),
    minutosRestantes: 0,
  };
}

export async function registrarFallo(ip: string): Promise<void> {
  const ahora = Date.now();
  const rs = await getCoreClient().execute({
    sql: "SELECT intentos, ventana_inicio FROM rate_limits WHERE clave = ? LIMIT 1",
    args: [clave(ip)],
  });
  const fila = rs.rows[0];
  const ventanaVencida = !fila || ahora - Number(fila["ventana_inicio"] || 0) > VENTANA_MS;
  const intentos = ventanaVencida ? 1 : Number(fila["intentos"] || 0) + 1;
  const ventanaInicio = ventanaVencida ? ahora : Number(fila["ventana_inicio"]);
  const bloqueadoHasta = intentos >= MAX_INTENTOS ? ahora + VENTANA_MS : null;

  await getCoreClient().execute({
    sql: `INSERT INTO rate_limits (clave, intentos, ventana_inicio, bloqueado_hasta)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(clave) DO UPDATE SET
            intentos = excluded.intentos,
            ventana_inicio = excluded.ventana_inicio,
            bloqueado_hasta = excluded.bloqueado_hasta`,
    args: [clave(ip), intentos, ventanaInicio, bloqueadoHasta],
  });
}

export async function limpiarRateLimit(ip: string): Promise<void> {
  await getCoreClient().execute({
    sql: "DELETE FROM rate_limits WHERE clave = ?",
    args: [clave(ip)],
  });
}
