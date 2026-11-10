/** Tipos compartidos por la tienda, el carrito y el panel de administración. */

export interface Rubro {
  id: number;
  rubro: string;
  descripcion?: string;
  orden: number;
  color: string;
}

export interface Categoria {
  id: number;
  id_rubro: number;
  categoria: string;
  descripcion?: string;
  orden: number;
  color: string;
}

export interface Producto {
  id: number;
  id_categoria: number;
  id_rubro: number;
  nombre: string;
  detalle_1: string;
  detalle_2: string;
  /** Precio en centavos: es el valor autoritativo que viaja desde la base. */
  precio_cents: number;
  /** Mismo precio expresado en pesos, listo para mostrar. */
  precio: number;
  color: string;
  destacado: boolean;
  popular: boolean;
  orden: number;
  imagen: string;
  categoria: string;
  rubro: string;
}

export interface DireccionTenant {
  linea1: string | null;
  linea2: string | null;
  localidad: string | null;
  provincia: string | null;
  codigo_postal: string | null;
  pais: string | null;
}

export interface TenantPublico {
  id: string;
  name: string;
  mode: string;
  brand: Record<string, unknown>;
  whatsapp: string | null;
  whatsapp_pedidos: string | null;
  telefono: string | null;
  email_contacto: string | null;
  email_pedidos: string | null;
  horario_atencion: string | null;
  direccion: DireccionTenant;
  moneda_simbolo: string;
  mostrar_precios: boolean;
  textos: {
    atencion: string | null;
    hero: string | null;
    hero_bajada: string | null;
    footer: string | null;
  };
}

export interface CatalogoRespuesta {
  ok: boolean;
  tenant: TenantPublico;
  rubros: Rubro[];
  categorias: Categoria[];
  productos: Producto[];
  generado_en: string;
}

export type FiltroCatalogo =
  | { tipo: 'rubro'; id: number; etiqueta: string }
  | { tipo: 'categoria'; id: number; etiqueta: string }
  | null;

export interface CartItem {
  id: string;
  itemId: number;
  rubro?: string;
  categoria?: string;
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  color: string;
  imagen?: string;
  tipo?: string;
}

export interface OrderCustomerInfo {
  nombre: string;
  metodoEntrega: 'domicilio' | 'retiro';
  direccion: string;
  aclaraciones: string;
  metodoPago: 'efectivo' | 'transferencia';
}

// ── Panel de administración ──────────────────────────────────────────────────

export interface RubroAdmin extends Rubro {
  activo: boolean;
}

export interface CategoriaAdmin extends Categoria {
  activo: boolean;
  rubro: string;
}

export interface ProductoAdmin extends Producto {
  activo: boolean;
}

export interface ResumenAdmin {
  rubros: number;
  categorias: number;
  productos: number;
  productos_activos: number;
  max_registros: number;
}

export interface RedesAdmin {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  [clave: string]: unknown;
}

export interface ParametrosAdmin {
  tenant_id: string;
  nombre_comercial: string;
  mode: string;
  documento_fiscal: string;
  telefono: string;
  whatsapp: string;
  whatsapp_pedidos: string;
  email_contacto: string;
  email_pedidos: string;
  redes: RedesAdmin;
  horario_atencion: string;
  direccion_linea1: string;
  direccion_linea2: string;
  localidad: string;
  provincia_estado: string;
  codigo_postal: string;
  pais: string;
  moneda_simbolo: string;
  max_registros: number;
  fecha_vencimiento: string | null;
  mostrar_precios: boolean;
  pasarela_pagos: boolean;
  gestion_entrega: boolean;
  texto_atencion: string;
  texto_hero: string;
  texto_hero_bajada: string;
  texto_footer: string;
}

export interface RespuestaAdminBase {
  ok: boolean;
  error?: string;
  mensaje?: string;
}

// ── Tipos heredados que usan componentes históricos no montados ──────────────

export interface ComboItem {
  id: string | number;
  nombre: string;
  detalle_1: string;
  detalle_2: string;
  precio: number;
  color: string;
  activo: string;
  imagen?: string;
}

export interface PriceKiloItem {
  id: string | number;
  nombre: string;
  detalle_1: string;
  detalle_2: string;
  precio: number;
  color: string;
  activo: string;
  imagen?: string;
}
