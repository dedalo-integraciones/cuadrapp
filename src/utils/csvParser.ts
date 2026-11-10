import type {
  CatalogoRespuesta,
  Categoria,
  Producto,
  Rubro,
  TenantPublico,
} from '../types';

export { WHATSAPP_PHONE_DISPLAY, WHATSAPP_PHONE_NUMBER } from '../config';

/**
 * Catálogo de respaldo: se muestra solo si la API no responde.
 * Los precios viven en centavos, igual que en la base.
 */

export const RUBRO_COLORS: Record<string, string> = {
  COMIDAS: '#C91810',
  BEBIDAS: '#0055A4',
  COMBOS: '#C91810',
  LOMOS: '#e84393',
  HAMBURGUESAS: '#00b6b6',
  PIZZAS: '#7c5cbf',
  EMPANADAS: '#5fbf8b',
  'MENÚ DEL DÍA': '#C91810',
  'MENU DEL DIA': '#C91810',
};

export const FALLBACK_RUBROS: Rubro[] = [
  { id: 1, rubro: 'COMIDAS', descripcion: 'Combos, platos y menú del día', orden: 1, color: '#C91810' },
  { id: 2, rubro: 'BEBIDAS', descripcion: 'Bebidas y refrescos', orden: 2, color: '#0055A4' },
];

export const FALLBACK_CATEGORIAS: Categoria[] = [
  { id: 1, id_rubro: 1, categoria: 'COMBOS', descripcion: 'Combos completos', orden: 1, color: '#C91810' },
  { id: 2, id_rubro: 1, categoria: 'LOMOS', descripcion: 'Lomos y sándwiches', orden: 2, color: '#e84393' },
  { id: 3, id_rubro: 1, categoria: 'HAMBURGUESAS', descripcion: 'Hamburguesas', orden: 3, color: '#00b6b6' },
  { id: 4, id_rubro: 1, categoria: 'PIZZAS', descripcion: 'Pizzas', orden: 4, color: '#7c5cbf' },
  { id: 5, id_rubro: 1, categoria: 'EMPANADAS', descripcion: 'Empanadas por docena', orden: 5, color: '#5fbf8b' },
  { id: 6, id_rubro: 1, categoria: 'MENÚ DEL DÍA', descripcion: 'Platos del día', orden: 6, color: '#C91810' },
  { id: 7, id_rubro: 2, categoria: 'BEBIDAS', descripcion: 'Bebidas y refrescos', orden: 7, color: '#0055A4' },
];

function categoria(id: number): Categoria {
  return FALLBACK_CATEGORIAS.find((c) => c.id === id) || FALLBACK_CATEGORIAS[0];
}

function producto(
  id: number,
  idCategoria: number,
  nombre: string,
  detalle_1: string,
  detalle_2: string,
  precio: number,
  imagen: string
): Producto {
  const cat = categoria(idCategoria);
  const rubro = FALLBACK_RUBROS.find((r) => r.id === cat.id_rubro) || FALLBACK_RUBROS[0];
  return {
    id,
    id_categoria: cat.id,
    id_rubro: rubro.id,
    nombre,
    detalle_1,
    detalle_2,
    precio_cents: Math.round(precio * 100),
    precio,
    color: cat.color,
    destacado: false,
    popular: false,
    orden: id,
    imagen,
    categoria: cat.categoria,
    rubro: rubro.rubro,
  };
}

export const FALLBACK_PRODUCTOS: Producto[] = [
  producto(9, 1, 'Combo 1', '2 lomos', 'Papas chicas', 36000, '/gallery/mimgi_20_default.webp'),
  producto(10, 1, 'Combo 2', 'Lomo especial', 'Papas chicas', 22000, '/gallery/mimgi_21_default.webp'),
  producto(11, 1, 'Combo 3', 'Burguer Cheddar', 'Papas chicas', 10000, '/gallery/mimgi_22_default.webp'),
  producto(12, 1, 'Combo 4', '1 muzza', '1 doc empanadas', 25000, '/gallery/mimgi_23_default.webp'),
  producto(13, 1, 'Combo 5', '2 muzzas', '', 20000, '/gallery/mimgi_24_default.webp'),
  producto(14, 1, 'Combo 6', '1 muzza + 1/2 empanadas', 'Papas chicas', 15000, '/gallery/mimgi_25_default.webp'),
  producto(15, 1, 'Combo 7', '2 docenas empanadas carne', '', 20000, '/gallery/mimgi_32_default.webp'),
  producto(1, 2, 'Lomo completo XX', 'Pan Frances/Arabe', 'lechuga, tomate, condimentos', 18000, '/gallery/mimgi_26_default.webp'),
  producto(2, 2, 'Lomo especial', 'Pan Frances/Arabe', 'lechuga, tomate, condimentos, huevo, jamon', 22000, '/gallery/mimgi_27_default.webp'),
  producto(3, 3, 'Cheddar', '1 medallon, tomate, lechuga', 'condimentos', 10000, '/gallery/mimgi_28_default.webp'),
  producto(4, 3, 'Doble carne Cheddar', '2 medallones, tomate, lechuga', 'condimentos', 15000, '/gallery/mimgi_29_default.webp'),
  producto(5, 4, 'Muzzarela 8 porciones', 'Masa casera a la piedra', 'Salsa de tomate y abundante muzzarella', 10000, '/gallery/mimgi_30_default.webp'),
  producto(6, 4, 'Especial 8 porciones', 'Masa casera a la piedra', 'Jamón cocido, morrones y muzzarella', 15000, '/gallery/mimgi_31_default.webp'),
  producto(7, 5, 'Carne', 'Por docena (12 unidades)', 'Carne cortada a cuchillo, receta tradicional', 12000, '/gallery/mimgi_32_default.webp'),
  producto(8, 5, 'Jamon y queso', 'Por docena (12 unidades)', 'Relleno de jamón cocido y queso cremoso', 12000, '/gallery/mimgi_33_default.webp'),
  producto(16, 6, 'Lasagna', 'Salsa bolognesa', 'Porción casera abundante gratinada', 8000, '/gallery/mimgi_34_default.webp'),
  producto(17, 6, 'Canelones', 'Salsa mixta', 'Rellenos de verdura y carne con salsa', 8000, '/gallery/mimgi_35_default.webp'),
  producto(18, 6, 'Mila de pollo', 'Papas fritas', 'Pechuga rebozada casera crujiente', 8000, '/gallery/mimgi_36_default.webp'),
  producto(19, 6, 'Merluza a la romana', 'Papas fritas', 'Filet de merluza fresca a la romana con limón', 8000, '/gallery/mimgi_37_default.webp'),
];

export const FALLBACK_TENANT: TenantPublico = {
  id: 'cuadra',
  name: 'Cuadra Demo',
  mode: 'pedidos',
  brand: {
    facebook: 'https://www.facebook.com/profile.php?id=61593937007412',
    instagram: '',
    tiktok: '',
  },
  whatsapp: '5492617202706',
  whatsapp_pedidos: '5492617202706',
  telefono: '5492617202706',
  email_contacto: '',
  email_pedidos: '',
  horario_atencion: '',
  direccion: {
    linea1: 'Km 0, Ciudad de Mendoza',
    linea2: '',
    localidad: 'Mendoza',
    provincia: 'Mendoza',
    codigo_postal: '',
    pais: 'Argentina',
  },
  moneda_simbolo: '$',
  mostrar_precios: true,
  textos: {
    atencion: 'Pedidos y consultas por WhatsApp',
    hero: 'Nuestro Menú',
    hero_bajada: 'Pedidos por WhatsApp para negocios de cercanía',
    footer: 'Cuadra: plataforma de pedidos por WhatsApp para negocios de cercanía',
  },
};

/** Devuelve un catálogo completo para que la tienda nunca quede vacía. */
export function catalogoDeRespaldo(): CatalogoRespuesta {
  return {
    ok: true,
    tenant: FALLBACK_TENANT,
    rubros: FALLBACK_RUBROS,
    categorias: FALLBACK_CATEGORIAS,
    productos: FALLBACK_PRODUCTOS,
    generado_en: new Date().toISOString(),
  };
}

/** Formato de precio con el símbolo del negocio. */
export function formatPrecio(precio: number, simbolo = '$'): string {
  const valor = Number.isFinite(precio) ? precio : 0;
  const decimales = Number.isInteger(valor) ? 0 : 2;
  const numero = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor);
  return `${simbolo || '$'} ${numero}`;
}

/** Compatibilidad con componentes históricos: pesos argentinos. */
export function formatPriceARS(precio: number): string {
  return formatPrecio(precio, '$');
}

export function colorSeguro(color: string | undefined, respaldo = '#C91810'): string {
  return color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : respaldo;
}
