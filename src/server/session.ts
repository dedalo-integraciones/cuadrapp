import { createHmac, timingSafeEqual } from "node:crypto";

/** La sesión vive 30 minutos desde la última actividad. */
export const DURACION_SESION_MS = 30 * 60 * 1000;

export type Sesion = {
  uid: number;
  email: string;
  tenant: string;
  exp: number;
};

export type ResultadoSesion =
  | { ok: true; sesion: Sesion }
  | { ok: false; motivo: "INVALIDA" | "VENCIDA" };

/**
 * Secreto de firma. Debe existir en el entorno con al menos 32 caracteres.
 * Se lee en cada uso para que un despliegue sin la variable falle de forma
 * explícita y no genere sesiones sin firmar.
 */
function secreto(): string {
  const valor = String(process.env.SESSION_SECRET || "");
  if (valor.length < 32) {
    throw new Error("Falta SESSION_SECRET (mínimo 32 caracteres) en el entorno.");
  }
  return valor;
}

function firmar(datos: string): string {
  return createHmac("sha256", secreto()).update(datos).digest("base64url");
}

function empaquetar(sesion: Sesion): string {
  const datos = Buffer.from(JSON.stringify(sesion), "utf8").toString("base64url");
  return `${datos}.${firmar(datos)}`;
}

/** Crea una sesión nueva y devuelve el token firmado. */
export function crearSesion(uid: number, email: string, tenant: string): string {
  return empaquetar({
    uid,
    email,
    tenant,
    exp: Date.now() + DURACION_SESION_MS,
  });
}

/** Renueva el vencimiento conservando usuario y negocio. */
export function renovarSesion(sesion: Sesion): string {
  return empaquetar({
    uid: sesion.uid,
    email: sesion.email,
    tenant: sesion.tenant,
    exp: Date.now() + DURACION_SESION_MS,
  });
}

/**
 * Valida firma, formato, negocio y vencimiento. El navegador no puede
 * extender el plazo: el vencimiento viaja firmado.
 */
export function leerSesion(valor: unknown, tenant: string): ResultadoSesion {
  const texto = String(valor || "").trim();
  const corte = texto.lastIndexOf(".");
  if (corte <= 0) return { ok: false, motivo: "INVALIDA" };

  const datos = texto.slice(0, corte);
  const firma = texto.slice(corte + 1);
  const esperada = firmar(datos);

  const recibida = Buffer.from(firma, "utf8");
  const calculada = Buffer.from(esperada, "utf8");
  if (recibida.length !== calculada.length || !timingSafeEqual(recibida, calculada)) {
    return { ok: false, motivo: "INVALIDA" };
  }

  let sesion: Sesion | null = null;
  try {
    sesion = JSON.parse(
      Buffer.from(datos, "base64url").toString("utf8")
    ) as Sesion;
  } catch {
    return { ok: false, motivo: "INVALIDA" };
  }

  if (
    !sesion ||
    typeof sesion.uid !== "number" ||
    !Number.isFinite(sesion.uid) ||
    sesion.uid <= 0 ||
    typeof sesion.email !== "string" ||
    typeof sesion.tenant !== "string" ||
    typeof sesion.exp !== "number" ||
    !Number.isFinite(sesion.exp)
  ) {
    return { ok: false, motivo: "INVALIDA" };
  }

  if (sesion.tenant !== tenant) return { ok: false, motivo: "INVALIDA" };
  if (Date.now() > sesion.exp) return { ok: false, motivo: "VENCIDA" };

  return { ok: true, sesion };
}
