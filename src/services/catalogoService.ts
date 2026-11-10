import type { CatalogoRespuesta } from '../types';

export class ErrorCatalogo extends Error {
  codigo: string;
  status: number;

  constructor(codigo: string, mensaje: string, status = 0) {
    super(mensaje);
    this.name = 'ErrorCatalogo';
    this.codigo = codigo;
    this.status = status;
  }
}

/** GET /api/catalog/:slug · catálogo público del negocio. */
export async function fetchCatalogo(tenant: string, signal?: AbortSignal): Promise<CatalogoRespuesta> {
  const respuesta = await fetch(`/api/catalog/${encodeURIComponent(tenant)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  });

  let datos: Record<string, any> = {};
  try {
    datos = await respuesta.json();
  } catch {
    datos = {};
  }

  if (!respuesta.ok || datos.ok === false) {
    const codigo = String(datos.error || 'CATALOGO_NO_DISPONIBLE');
    const mensaje =
      codigo === 'TENANT_NO_ENCONTRADO'
        ? 'El negocio solicitado no existe.'
        : codigo === 'TENANT_BLOQUEADO'
          ? 'El negocio está suspendido o vencido.'
          : 'No se pudo cargar el catálogo.';
    throw new ErrorCatalogo(codigo, mensaje, respuesta.status);
  }

  if (!Array.isArray(datos.rubros) || !Array.isArray(datos.categorias) || !Array.isArray(datos.productos)) {
    throw new ErrorCatalogo('RESPUESTA_INVALIDA', 'El catálogo recibido no tiene el formato esperado.');
  }

  return datos as CatalogoRespuesta;
}
