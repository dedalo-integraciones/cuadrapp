/**
 * Sesión del panel guardada en sessionStorage.
 * Ese almacenamiento se borra al cerrar la pestaña o el navegador, que es
 * exactamente la regla pedida. El vencimiento real lo controla el servidor.
 */

export interface SesionAdmin {
  email: string;
  nombre: string;
  token: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function claveSesion(tenant: string): string {
  return `cuadra_admin_sesion_${tenant}`;
}

export function leerSesion(tenant: string): SesionAdmin | null {
  try {
    const crudo = sessionStorage.getItem(claveSesion(tenant));
    if (!crudo) return null;
    const datos = JSON.parse(crudo) as Partial<SesionAdmin>;
    if (!datos || typeof datos.email !== 'string' || !EMAIL_RE.test(datos.email)) return null;
    if (typeof datos.token !== 'string' || !datos.token) return null;
    return {
      email: datos.email,
      nombre: typeof datos.nombre === 'string' ? datos.nombre : '',
      token: datos.token,
    };
  } catch {
    return null;
  }
}

export function guardarSesion(tenant: string, sesion: SesionAdmin): void {
  try {
    sessionStorage.setItem(claveSesion(tenant), JSON.stringify(sesion));
  } catch {
    // Sin almacenamiento de sesión: el panel sigue abierto hasta recargar.
  }
}

export function borrarSesion(tenant: string): void {
  try {
    sessionStorage.removeItem(claveSesion(tenant));
  } catch {
    // Nada que limpiar.
  }
}

/** Reemplaza solo el token, conservando email y nombre. */
export function renovarToken(tenant: string, token: string): void {
  try {
    const crudo = sessionStorage.getItem(claveSesion(tenant));
    if (!crudo) return;
    const datos = JSON.parse(crudo) as Partial<SesionAdmin>;
    if (!datos || typeof datos.email !== 'string') return;
    sessionStorage.setItem(
      claveSesion(tenant),
      JSON.stringify({ email: datos.email, nombre: datos.nombre || '', token })
    );
  } catch {
    // Nada que renovar.
  }
}
