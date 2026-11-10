import { createHash } from "node:crypto";
import { autenticarAdmin } from "../../src/server/admin-auth";
import { auditar } from "../../src/server/audit";
import { imagenSegura, leerBody, metodo, responder, texto } from "../../src/server/http";
import { resolverTenantSlug } from "../../src/db/tenant";

/**
 * POST /api/admin/upload
 * Sube una imagen a Cloudinary con firma del servidor.
 * Sin CLOUDINARY_* configurado responde 503 y el panel permite usar una URL.
 */
const TIPOS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_BYTES = 3_500_000;

function fallo(res: any, status: number, error: string, mensaje: string) {
  return responder(res, status, { ok: false, error, mensaje });
}

function leerDataUrl(valor: unknown): { mime: string; base64: string } | null {
  const data = String(valor ?? "");
  const match = data.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) return null;
  return { mime: match[1], base64: match[2].replace(/\s/g, "") };
}

function nombreSeguro(valor: unknown, extension: string): string {
  const base = texto(valor, 80)
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "producto"}-${Date.now()}.${extension}`;
}

export default async function handler(req: any, res: any) {
  if (metodo(req) !== "POST") {
    return fallo(res, 405, "METODO_NO_PERMITIDO", "Use POST.");
  }

  const cloud = String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  const apiKey = String(process.env.CLOUDINARY_API_KEY || "").trim();
  const apiSecret = String(process.env.CLOUDINARY_API_SECRET || "").trim();

  if (!cloud || !apiKey || !apiSecret) {
    return fallo(
      res,
      503,
      "ALMACENAMIENTO_NO_CONFIGURADO",
      "La subida de imágenes no está configurada. Use una URL de imagen o configure Cloudinary."
    );
  }

  const body = await leerBody(req);
  const slug = resolverTenantSlug({ ...req, body });
  const auth = await autenticarAdmin(slug, body.email);
  if (auth.ok === false) {
    return fallo(res, auth.status, auth.error, auth.mensaje);
  }

  const datos = leerDataUrl(body.data);
  if (!datos) {
    return fallo(res, 400, "VALIDACION", "La imagen debe ser JPG, PNG, WEBP o GIF.");
  }
  const bytes = Buffer.from(datos.base64, "base64");
  if (bytes.length === 0 || bytes.length > MAX_BYTES) {
    return fallo(res, 400, "VALIDACION", "La imagen supera el tamaño permitido (3,5 MB).");
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = texto(process.env.CLOUDINARY_FOLDER, 60) || "cuadra";
    const firma = createHash("sha1")
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest("hex");

    const formulario = new FormData();
    formulario.append("file", new Blob([new Uint8Array(bytes)], { type: datos.mime }), nombreSeguro(body.nombre, TIPOS[datos.mime]));
    formulario.append("api_key", apiKey);
    formulario.append("timestamp", String(timestamp));
    formulario.append("folder", folder);
    formulario.append("signature", firma);

    const respuesta = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
      method: "POST",
      body: formulario,
    });
    const resultado = (await respuesta.json()) as Record<string, any>;

    if (!respuesta.ok || !resultado.secure_url) {
      console.error("[api/admin/upload] cloudinary", resultado?.error?.message || respuesta.status);
      return fallo(res, 502, "SUBIDA_FALLIDA", "No se pudo subir la imagen. Intente de nuevo.");
    }

    const url = imagenSegura(resultado.secure_url);
    if (!url) {
      return fallo(res, 502, "SUBIDA_FALLIDA", "Cloudinary devolvió una dirección no válida.");
    }

    await auditar(auth.tenant.id, auth.usuario.id, "IMAGEN_SUBIDA", {
      public_id: resultado.public_id || null,
    });

    return responder(res, 200, {
      ok: true,
      url,
      public_id: resultado.public_id || null,
    });
  } catch (error) {
    console.error("[api/admin/upload] error", error);
    return fallo(res, 500, "ERROR_INTERNO", "Ocurrió un error interno al subir la imagen.");
  }
}
