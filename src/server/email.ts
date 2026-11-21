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

/** Llamada común a Resend. No alerta por sí misma: la alerta la decide quien llama. */
async function enviarConResend(
  apiKey: string,
  cuerpo: Record<string, unknown>
): Promise<ResultadoEnvio> {
  try {
    const respuesta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cuerpo),
    });

    const texto = await respuesta.text();
    if (!respuesta.ok) {
      console.error(
        `[email] Resend respondió ${respuesta.status}: ${texto.slice(0, 300)}`
      );
      return { ok: false, motivo: `HTTP_${respuesta.status}` };
    }

    let id = "";
    try {
      id = String((JSON.parse(texto) as { id?: unknown }).id || "");
    } catch {
      // El envío fue 2xx; el id es solo para trazabilidad.
    }
    return { ok: true, id };
  } catch {
    console.error("[email] error de red al llamar a Resend");
    return { ok: false, motivo: "RED" };
  }
}

async function remitente(): Promise<string> {
  return (await leerSecreto("RESEND_FROM_EMAIL")) || REMITENTE_POR_DEFECTO;
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

  const from = await remitente();
  const comercio = opciones.nombreComercio?.trim() || "el negocio";
  const saludo = opciones.nombre?.trim() || "administrador";
  const asunto = `Recupere su clave de ${comercio}`;
  const linkSeguro = escaparHtml(opciones.link);

  const html = `<div style="font-family:Poppins,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
  <h2 style="color:#C8180F;margin:0 0 16px">Recuperación de clave</h2>
  <p style="color:#333;font-size:15px;line-height:1.5">Hola ${escaparHtml(saludo)}, recibimos una solicitud para restablecer la clave de su cuenta en ${escaparHtml(comercio)}.</p>
  <p style="margin:24px 0">
    <a href="${linkSeguro}" style="background:#C8180F;color:#FFFFFF;padding:13px 22px;border-radius:12px;text-decoration:none;font-weight:600;display:inline-block">Restablecer mi clave</a>
  </p>
  <p style="color:#666;font-size:13px;line-height:1.5">Este enlace expira en 1 hora y sirve una sola vez. Si no lo usó, puede ignorar este mensaje: su clave actual sigue vigente.</p>
  <p style="color:#999;font-size:12px;word-break:break-all;margin-top:24px">Si el botón no funciona, copie esta dirección:<br>${linkSeguro}</p>
</div>`;

  const text = `Recuperación de clave\n\nHola ${saludo}, recibimos una solicitud para restablecer la clave de su cuenta en ${comercio}.\n\nUse este enlace para crear una clave nueva (expira en 1 hora y sirve una sola vez):\n${opciones.link}\n\nSi no lo usó, puede ignorar este mensaje: su clave actual sigue vigente.`;

  return enviarConResend(apiKey, {
    from,
    to: opciones.to,
    subject: asunto,
    html,
    text,
  });
}

/**
 * Alerta operativa para el administrador. Se usa desde el monitor y desde el
 * flujo de recuperación cuando el correo no se pudo enviar.
 */
export async function enviarEmailAlerta(opciones: {
  to: string;
  asunto: string;
  detalle: string;
}): Promise<ResultadoEnvio> {
  const apiKey = await leerSecreto("RESEND_API_KEY");
  if (!apiKey) {
    console.error("[email] falta RESEND_API_KEY: no se envía la alerta");
    return { ok: false, motivo: "SIN_CONFIGURAR" };
  }

  const from = await remitente();
  const asunto = opciones.asunto.slice(0, 160);
  const detalle = opciones.detalle.slice(0, 4000);
  const fecha = new Date().toISOString();

  const html = `<div style="font-family:Poppins,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
  <h2 style="color:#C8180F;margin:0 0 12px">Cuadra · alerta</h2>
  <p style="color:#333;font-size:15px;font-weight:600;margin:0 0 12px">${escaparHtml(asunto)}</p>
  <pre style="background:#f5f5f4;border-radius:8px;padding:12px;font-size:12px;white-space:pre-wrap;word-break:break-word;color:#333">${escaparHtml(detalle)}</pre>
  <p style="color:#999;font-size:12px;margin-top:16px">${escaparHtml(fecha)}</p>
</div>`;

  return enviarConResend(apiKey, {
    from,
    to: opciones.to,
    subject: `[Cuadra] ${asunto}`,
    html,
    text: `Cuadra · alerta\n\n${asunto}\n\n${detalle}\n\n${fecha}`,
  });
}
