/** Helpers HTTP compatibles con Vercel Functions y con el servidor Express local. */

export function metodo(req: any): string {
  return String(req?.method || "GET").toUpperCase();
}

export function responder(res: any, status: number, body: unknown): void {
  if (typeof res?.status === "function" && typeof res?.json === "function") {
    res.status(status).json(body);
    return;
  }
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export function encabezado(res: any, nombre: string, valor: string): void {
  if (typeof res?.setHeader === "function") res.setHeader(nombre, valor);
}

export async function leerBody(req: any): Promise<Record<string, any>> {
  if (req?.body && typeof req.body === "object") return req.body as Record<string, any>;
  if (typeof req?.body === "string" && req.body.trim()) {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  try {
    const partes: Buffer[] = [];
    for await (const parte of req) {
      partes.push(Buffer.isBuffer(parte) ? parte : Buffer.from(parte));
    }
    const texto = Buffer.concat(partes).toString("utf8").trim();
    return texto ? JSON.parse(texto) : {};
  } catch {
    return {};
  }
}

export function ipCliente(req: any): string {
  const reenviada = req?.headers?.["x-forwarded-for"];
  const primera = Array.isArray(reenviada) ? reenviada[0] : String(reenviada || "");
  const ip = primera.split(",")[0].trim() || req?.socket?.remoteAddress || req?.connection?.remoteAddress || "local";
  return String(ip).slice(0, 80);
}

export function texto(valor: unknown, max = 200): string {
  return String(valor ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, max);
}

export function entero(valor: unknown, porDefecto = 0): number {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.trunc(n) : porDefecto;
}

export function booleanoInt(valor: unknown, porDefecto = 0): number {
  if (valor === true || valor === 1 || valor === "1" || valor === "SI" || valor === "si") return 1;
  if (valor === false || valor === 0 || valor === "0" || valor === "NO" || valor === "no") return 0;
  return porDefecto;
}

export function colorHex(valor: unknown): string | null {
  const limpio = texto(valor, 20).replace(/['"]/g, "");
  return /^#[0-9A-Fa-f]{6}$/.test(limpio) ? limpio.toUpperCase() : null;
}

export function imagenSegura(valor: unknown): string | null {
  const limpio = texto(valor, 600);
  if (!limpio) return null;
  if (limpio.startsWith("/")) return limpio;
  if (/^https?:\/\/[^\s]+$/i.test(limpio)) return limpio;
  return null;
}
