import { leerSecreto } from "./secreto.js";

/**
 * Envío de correo con la API de Resend. No se usa SDK: una sola llamada
 * HTTP alcanza y evita sumar una dependencia al proyecto.
 *
 * Regla: la respuesta pública del flujo de recuperación nunca depende de si
 * el correo se pudo enviar. Los fallos quedan en el log del servidor.
 */

export type ResultadoEnvio =
  | { ok: true; id: string }
  | { ok: false; motivo: string };

const REMITENTE_POR_DEFECTO = "noreply@resend.dev";

function escaparHtml(valor: string): string {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function enviarEmailReset(opciones: {
  to: string;
  nombre: string;
  link: string;
  nombreComercio?: string;
}): Promise<ResultadoEnvio> {
  const apiKey = await leerSecreto("RESEND_API_KEY");
  if (!apiKey) {
    console.error("[email] falta RESEND_API_KEY: no se envía el correo");
    return { ok: false, motivo: "SIN_CONFIGURAR" };
  }

  const from =
    (await leerSecreto("RESEND_FROM_EMAIL")) || REMITENTE_POR_DEFECTO;
  const comercio = opciones.nombreComercio?.trim() || "el negocio";
  const saludo = opciones.nombre?.trim() || "administrador";
  const asunto = `Recupera tu clave de ${comercio}`;
  const linkSeguro = escaparHtml(opciones.link);

  const html = `<div style="font-family:Poppins,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
  <h2 style="color:#C8180F;margin:0 0 16px">Recuperación de clave</h2>
  <p style="color:#333;font-size:15px;line-height:1.5">Hola ${escaparHtml(saludo)}, recibimos una solicitud para restablecer la clave de tu cuenta en ${escaparHtml(comercio)}.</p>
  <p style="margin:24px 0">
    <a href="${linkSeguro}" style="background:#C8180F;color:#FFFFFF;padding:13px 22px;border-radius:12px;text-decoration:none;font-weight:600;display:inline-block">Restablecer mi clave</a>
  </p>
  <p style="color:#666;font-size:13px;line-height:1.5">Este enlace expira en 1 hora y sirve una sola vez. Si no lo usaste, podés ignorar este mensaje: tu clave actual sigue vigente.</p>
  <p style="color:#999;font-size:12px;word-break:break-all;margin-top:24px">Si el botón no funciona, copiá esta dirección:<br>${linkSeguro}</p>
</div>`;

  const text = `Recuperación de clave\n\nHola ${saludo}, recibimos una solicitud para restablecer la clave de tu cuenta en ${comercio}.\n\nUsá este enlace para crear una clave nueva (expira en 1 hora y sirve una sola vez):\n${opciones.link}\n\nSi no lo usaste, podés ignorar este mensaje: tu clave actual sigue vigente.`;

  try {
    const respuesta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: opciones.to, subject: asunto, html, text }),
    });

    const cuerpo = await respuesta.text();
    if (!respuesta.ok) {
      console.error(
        `[email] Resend respondió ${respuesta.status}: ${cuerpo.slice(0, 300)}`
      );
      return { ok: false, motivo: `HTTP_${respuesta.status}` };
    }

    let id = "";
    try {
      id = String((JSON.parse(cuerpo) as { id?: unknown }).id || "");
    } catch {
      // El envío fue 2xx; el id es solo para trazabilidad.
    }
    return { ok: true, id };
  } catch (error) {
    console.error("[email] error de red al llamar a Resend");
    return { ok: false, motivo: "RED" };
  }
}
