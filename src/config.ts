// Configuración centralizada de la marca, contacto y enlaces externos

/** Negocio que atiende la tienda si la URL no indica otro. */
export const DEFAULT_TENANT = String(import.meta.env.VITE_TENANT || 'cuadra').trim().toLowerCase();

const TENANT_RE = /^[a-z0-9][a-z0-9-]{1,48}$/;

/**
 * Resuelve el negocio activo: primero `?tenant=`, luego la variable de
 * compilación y por último `cuadra`. El panel usa la misma regla.
 */
export function tenantActual(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const candidato = String(params.get('tenant') || '').trim().toLowerCase();
    if (TENANT_RE.test(candidato)) return candidato;
  } catch {
    // Sin window (SSR o pruebas): se usa el valor por defecto.
  }
  return TENANT_RE.test(DEFAULT_TENANT) ? DEFAULT_TENANT : 'cuadra';
}

export const COMPANY_NAME = 'Dédalo Integraciones';
export const ADDRESS = 'Km 0, Ciudad de Mendoza, Mendoza, Argentina';

// Datos de WhatsApp (contacto, consultas y pedidos)
export const WHATSAPP_PHONE_DISPLAY = '+54 9 261 720-2706';
export const WHATSAPP_PHONE_NUMBER = '5492617202706';

// Mensajes preformateados de WhatsApp
export const WHATSAPP_MESSAGE_CONSULTATION =
  '¡Hola Dédalo Integraciones! Quiero consultar sobre el como usar Cuadra para mejorar la llegada de pedidos via Whatsapp';
export const WHATSAPP_MESSAGE_ORDER =
  '¡Hola Dédalo Integraciones! Quiero hacer un pedido de una demo de Cuadra para mejorar la llegada de pedidos via Whatsapp';

// Redes sociales y enlaces
export const FACEBOOK_HANDLE = 'Facebook';
export const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61593937007412';
export const MAPS_URL = 'https://maps.google.com/?q=Km+0,+Ciudad+de+Mendoza,+Mendoza,+Argentina';
export const DEDALO_URL = 'https://dedalointegraciones.vercel.app/';
