import type {
  CategoriaAdmin,
  ParametrosAdmin,
  ProductoAdmin,
  ResumenAdmin,
  RespuestaAdminBase,
  RubroAdmin,
  TenantPublico,
} from '../types';
import { borrarSesion, leerSesion, renovarToken } from '../utils/sesionAdmin';

export class ErrorAdmin extends Error {
  codigo: string;
  status: number;

  constructor(codigo: string, mensaje: string, status = 0) {
    super(mensaje);
    this.name = 'ErrorAdmin';
    this.codigo = codigo;
    this.status = status;
  }
}

type PayloadAdmin = {
  email?: string;
  tenant?: string;
  password?: string;
  id?: number;
  datos?: Record<string, unknown>;
};

export interface LoginRespuesta extends RespuestaAdminBase {
  email?: string;
  nombre?: string;
  sesion?: string;
  tenant?: { id: string; nombre: string; mode: string };
}

export interface ParametrosRespuesta extends RespuestaAdminBase {
  parametros: ParametrosAdmin;
}

export interface ResumenRespuesta extends RespuestaAdminBase {
  resumen: ResumenAdmin;
}

export interface RubrosRespuesta extends RespuestaAdminBase {
  rubros: RubroAdmin[];
}

export interface CategoriasRespuesta extends RespuestaAdminBase {
  categorias: CategoriaAdmin[];
}

export interface ProductosRespuesta extends RespuestaAdminBase {
  productos: ProductoAdmin[];
}

export interface IdRespuesta extends RespuestaAdminBase {
  id?: number;
}

export interface PublicoRespuesta extends RespuestaAdminBase {
  tenant: TenantPublico;
}

/**
 * El token de sesión se lee de sessionStorage en cada llamada. Así la
 * renovación deslizante que devuelve el servidor se aplica sola, sin que cada
 * pantalla tenga que actualizar su estado.
 */
async function llamar<T extends RespuestaAdminBase>(
  accion: string,
  payload: PayloadAdmin = {}
): Promise<T> {
  const tenant = String(payload.tenant || '');
  const sesion = tenant ? leerSesion(tenant)?.token || '' : '';

  let respuesta: Response;
  try {
    respuesta = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ accion, sesion, ...payload }),
    });
  } catch {
    throw new ErrorAdmin('RED', 'No se pudo conectar con el servidor. Revise la conexión.');
  }

  let datos: Record<string, any> = {};
  try {
    datos = await respuesta.json();
  } catch {
    datos = {};
  }

  if (!respuesta.ok || datos.ok === false) {
    if (respuesta.status === 401 && tenant) borrarSesion(tenant);
    throw new ErrorAdmin(
      String(datos.error || 'ERROR'),
      String(datos.mensaje || 'No se pudo completar la operación.'),
      respuesta.status
    );
  }

  if (tenant && typeof datos.sesion === 'string' && datos.sesion) {
    renovarToken(tenant, datos.sesion);
  }

  return datos as T;
}

export function listarPublico(tenant: string) {
  return llamar<PublicoRespuesta>('listar_publico', { tenant });
}

export function verificarLogin(email: string, password: string, tenant: string) {
  return llamar<LoginRespuesta>('verificar', { email, password, tenant });
}

/** Renueva el vencimiento mientras el owner sigue activo en el panel. */
export function latido(tenant: string) {
  return llamar<RespuestaAdminBase>('latido', { tenant });
}

export function obtenerParametros(tenant: string) {
  return llamar<ParametrosRespuesta>('get_parametros', { tenant });
}

export function guardarParametros(tenant: string, datos: Record<string, unknown>) {
  return llamar<ParametrosRespuesta>('set_parametros', { tenant, datos });
}

export function obtenerResumen(tenant: string) {
  return llamar<ResumenRespuesta>('resumen', { tenant });
}

export function listarRubros(tenant: string) {
  return llamar<RubrosRespuesta>('listar_rubros', { tenant });
}

export function crearRubro(tenant: string, datos: Record<string, unknown>) {
  return llamar<IdRespuesta>('crear_rubro', { tenant, datos });
}

export function actualizarRubro(tenant: string, id: number, datos: Record<string, unknown>) {
  return llamar<IdRespuesta>('actualizar_rubro', { tenant, id, datos });
}

export function borrarRubro(tenant: string, id: number) {
  return llamar<IdRespuesta>('borrar_rubro', { tenant, id });
}

export function listarCategorias(tenant: string) {
  return llamar<CategoriasRespuesta>('listar_categorias', { tenant });
}

export function crearCategoria(tenant: string, datos: Record<string, unknown>) {
  return llamar<IdRespuesta>('crear_categoria', { tenant, datos });
}

export function actualizarCategoria(tenant: string, id: number, datos: Record<string, unknown>) {
  return llamar<IdRespuesta>('actualizar_categoria', { tenant, id, datos });
}

export function borrarCategoria(tenant: string, id: number) {
  return llamar<IdRespuesta>('borrar_categoria', { tenant, id });
}

export function listarProductos(tenant: string) {
  return llamar<ProductosRespuesta>('listar_productos', { tenant });
}

export function crearProducto(tenant: string, datos: Record<string, unknown>) {
  return llamar<IdRespuesta>('crear_producto', { tenant, datos });
}

export function actualizarProducto(tenant: string, id: number, datos: Record<string, unknown>) {
  return llamar<IdRespuesta>('actualizar_producto', { tenant, id, datos });
}

export function desactivarProducto(tenant: string, id: number) {
  return llamar<IdRespuesta>('desactivar_producto', { tenant, id });
}

export function borrarProducto(tenant: string, id: number) {
  return llamar<IdRespuesta>('borrar_producto', { tenant, id });
}

export interface SubidaRespuesta extends RespuestaAdminBase {
  url?: string;
  public_id?: string | null;
}

/** POST /api/admin/upload · sube una imagen comprimida como data URL. */
export async function subirImagen(
  tenant: string,
  data: string,
  nombre: string
): Promise<SubidaRespuesta> {
  const sesion = leerSesion(tenant)?.token || '';

  let respuesta: Response;
  try {
    respuesta = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ sesion, tenant, data, nombre }),
    });
  } catch {
    throw new ErrorAdmin('RED', 'No se pudo conectar con el servidor. Revise la conexión.');
  }

  let datos: Record<string, any> = {};
  try {
    datos = await respuesta.json();
  } catch {
    datos = {};
  }

  if (!respuesta.ok || datos.ok === false) {
    if (respuesta.status === 401 && tenant) borrarSesion(tenant);
    throw new ErrorAdmin(
      String(datos.error || 'ERROR'),
      String(datos.mensaje || 'No se pudo subir la imagen.'),
      respuesta.status
    );
  }

  if (typeof datos.sesion === 'string' && datos.sesion) {
    renovarToken(tenant, datos.sesion);
  }

  return datos as SubidaRespuesta;
}
