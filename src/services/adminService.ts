import type {
  CategoriaAdmin,
  ParametrosAdmin,
  ProductoAdmin,
  ResumenAdmin,
  RespuestaAdminBase,
  RubroAdmin,
  TenantPublico,
} from '../types';

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

async function llamar<T extends RespuestaAdminBase>(accion: string, payload: PayloadAdmin = {}): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ accion, ...payload }),
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
    throw new ErrorAdmin(
      String(datos.error || 'ERROR'),
      String(datos.mensaje || 'No se pudo completar la operación.'),
      respuesta.status
    );
  }
  return datos as T;
}

export function listarPublico(tenant: string) {
  return llamar<PublicoRespuesta>('listar_publico', { tenant });
}

export function verificarLogin(email: string, password: string, tenant: string) {
  return llamar<LoginRespuesta>('verificar', { email, password, tenant });
}

export function obtenerParametros(email: string, tenant: string) {
  return llamar<ParametrosRespuesta>('get_parametros', { email, tenant });
}

export function guardarParametros(email: string, tenant: string, datos: Record<string, unknown>) {
  return llamar<ParametrosRespuesta>('set_parametros', { email, tenant, datos });
}

export function obtenerResumen(email: string, tenant: string) {
  return llamar<ResumenRespuesta>('resumen', { email, tenant });
}

export function listarRubros(email: string, tenant: string) {
  return llamar<RubrosRespuesta>('listar_rubros', { email, tenant });
}

export function crearRubro(email: string, tenant: string, datos: Record<string, unknown>) {
  return llamar<IdRespuesta>('crear_rubro', { email, tenant, datos });
}

export function actualizarRubro(email: string, tenant: string, id: number, datos: Record<string, unknown>) {
  return llamar<IdRespuesta>('actualizar_rubro', { email, tenant, id, datos });
}

export function borrarRubro(email: string, tenant: string, id: number) {
  return llamar<IdRespuesta>('borrar_rubro', { email, tenant, id });
}

export function listarCategorias(email: string, tenant: string) {
  return llamar<CategoriasRespuesta>('listar_categorias', { email, tenant });
}

export function crearCategoria(email: string, tenant: string, datos: Record<string, unknown>) {
  return llamar<IdRespuesta>('crear_categoria', { email, tenant, datos });
}

export function actualizarCategoria(email: string, tenant: string, id: number, datos: Record<string, unknown>) {
  return llamar<IdRespuesta>('actualizar_categoria', { email, tenant, id, datos });
}

export function borrarCategoria(email: string, tenant: string, id: number) {
  return llamar<IdRespuesta>('borrar_categoria', { email, tenant, id });
}

export function listarProductos(email: string, tenant: string) {
  return llamar<ProductosRespuesta>('listar_productos', { email, tenant });
}

export function crearProducto(email: string, tenant: string, datos: Record<string, unknown>) {
  return llamar<IdRespuesta>('crear_producto', { email, tenant, datos });
}

export function actualizarProducto(email: string, tenant: string, id: number, datos: Record<string, unknown>) {
  return llamar<IdRespuesta>('actualizar_producto', { email, tenant, id, datos });
}

export function desactivarProducto(email: string, tenant: string, id: number) {
  return llamar<IdRespuesta>('desactivar_producto', { email, tenant, id });
}

export function borrarProducto(email: string, tenant: string, id: number) {
  return llamar<IdRespuesta>('borrar_producto', { email, tenant, id });
}

export interface SubidaRespuesta extends RespuestaAdminBase {
  url?: string;
  public_id?: string | null;
}

/** POST /api/admin/upload · sube una imagen comprimida como data URL. */
export async function subirImagen(
  email: string,
  tenant: string,
  data: string,
  nombre: string
): Promise<SubidaRespuesta> {
  let respuesta: Response;
  try {
    respuesta = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, tenant, data, nombre }),
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
    throw new ErrorAdmin(
      String(datos.error || 'ERROR'),
      String(datos.mensaje || 'No se pudo subir la imagen.'),
      respuesta.status
    );
  }
  return datos as SubidaRespuesta;
}
