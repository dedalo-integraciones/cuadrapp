import { ProductItem, RubroItem, MasterCatalog, ComboItem, PriceKiloItem } from '../types';
import { WHATSAPP_PHONE_DISPLAY, WHATSAPP_PHONE_NUMBER } from '../config';
import { resolveGalleryImage } from '../gallery';

export { WHATSAPP_PHONE_DISPLAY, WHATSAPP_PHONE_NUMBER };

// Endpoint seguro de catálogo provisto por el servidor (oculta el ID de Google Sheet al cliente)
export const SECURE_CATALOG_API = '/api/catalog';

// Paleta de colores oficial predeterminada de fallback
export const DEFAULT_RUBRO_COLORS: Record<string, string> = {
  'COMBOS': '#C91810',        // Rojo institucional
  'LOMOS': '#e84393',         // Rosa fucsia
  'HAMBURGUESAS': '#00b6b6',  // Turquesa / Teal
  'PIZZAS': '#7c5cbf',        // Violeta / Púrpura
  'EMPANADAS': '#5fbf8b',     // Verde esmeralda / menta
  'MENÚ DEL DÍA': '#C91810',  // Rojo institucional
  'MENU DEL DIA': '#C91810',
  'BEBIDAS': '#0055A4',       // Azul clásico
};

// Aliases para compatibilidad hacia atrás
export const RUBRO_COLORS = DEFAULT_RUBRO_COLORS;

// Orden inicial de prioridad: COMBOS primero siempre
export const RUBROS_PRIORITY_ORDER = [
  'COMBOS',
  'LOMOS',
  'HAMBURGUESAS',
  'PIZZAS',
  'EMPANADAS',
  'MENÚ DEL DÍA',
  'BEBIDAS',
];

export const FALLBACK_RUBROS: RubroItem[] = [
  { id_rubro: 1, rubro: 'COMBOS', color: '#C91810', descrip: '(Rojo institucional)' },
  { id_rubro: 2, rubro: 'LOMOS', color: '#e84393', descrip: '(Rosa fucsia)' },
  { id_rubro: 3, rubro: 'HAMBURGUESAS', color: '#00b6b6', descrip: '(Turquesa / Teal)' },
  { id_rubro: 4, rubro: 'PIZZAS', color: '#7c5cbf', descrip: '(Violeta / Púrpura)' },
  { id_rubro: 5, rubro: 'EMPANADAS', color: '#5fbf8b', descrip: '(Verde esmeralda / menta)' },
  { id_rubro: 6, rubro: 'MENÚ DEL DÍA', color: '#C91810', descrip: '(Rojo institucional)' },
  { id_rubro: 7, rubro: 'BEBIDAS', color: '#0055A4', descrip: '(Azul clásico)' },
];

/**
 * Catálogo Demo / Modo Placebo:
 * Representa los productos de la Google Sheet mapeados estratégicamente con las imágenes locales
 * de la galería src/gallery/ (con prefijo 'm' y formato .webp).
 * Sirve como catálogo optimizado para que las imágenes carguen holgadamente en la plataforma demo.
 */
export const FALLBACK_PRODUCTS: ProductItem[] = [
  {
    id: 9,
    rubro: 'COMBOS',
    nombre: 'Combo 1',
    detalle_1: '2 lomos',
    detalle_2: 'Papas chicas',
    precio: 36000,
    color: '#C91810',
    activo: 'SI',
    // Sheet original: https://i.ibb.co/Q7PtVYGq/imgi-20-default.jpg
    imagen: resolveGalleryImage('imgi-20-default.jpg'),
  },
  {
    id: 10,
    rubro: 'COMBOS',
    nombre: 'Combo 2',
    detalle_1: 'Lomo especial',
    detalle_2: 'Papas chicas',
    precio: 22000,
    color: '#C91810',
    activo: 'SI',
    // Sheet original: https://i.ibb.co/jP4ph41t/imgi-21-default.jpg
    imagen: resolveGalleryImage('imgi-21-default.jpg'),
  },
  {
    id: 11,
    rubro: 'COMBOS',
    nombre: 'Combo 3',
    detalle_1: 'Burguer Cheddar',
    detalle_2: 'Papas chicas',
    precio: 10000,
    color: '#C91810',
    activo: 'SI',
    // Sheet original: https://i.ibb.co/rfb12svG/imgi-22-default.jpg
    imagen: resolveGalleryImage('imgi-22-default.jpg'),
  },
  {
    id: 12,
    rubro: 'COMBOS',
    nombre: 'Combo 4',
    detalle_1: '1 muzza',
    detalle_2: '1 doc empanadas',
    precio: 25000,
    color: '#C91810',
    activo: 'SI',
    // Sheet original: https://i.ibb.co/mVcG15RL/imgi-23-default.jpg
    imagen: resolveGalleryImage('imgi-23-default.jpg'),
  },
  {
    id: 13,
    rubro: 'COMBOS',
    nombre: 'Combo 5',
    detalle_1: '2 muzzas',
    detalle_2: '',
    precio: 20000,
    color: '#C91810',
    activo: 'SI',
    // Sheet original: https://i.ibb.co/3YMfcHR8/imgi-24-default.jpg
    imagen: resolveGalleryImage('imgi-24-default.jpg'),
  },
  {
    id: 14,
    rubro: 'COMBOS',
    nombre: 'Combo 6',
    detalle_1: '1 muzza + 1/2 empanadas',
    detalle_2: 'Papas chicas',
    precio: 15000,
    color: '#C91810',
    activo: 'SI',
    // Sheet original: https://i.ibb.co/nGPXN9T/imgi-25-default.jpg
    imagen: resolveGalleryImage('imgi-25-default.jpg'),
  },
  {
    id: 15,
    rubro: 'COMBOS',
    nombre: 'Combo 7',
    detalle_1: '2 docenas empanadas carne',
    detalle_2: '',
    precio: 20000,
    color: '#C91810',
    activo: 'SI',
    // Sheet original: https://i.ibb.co/DgHG8kMd/imgi-32-default.jpg
    imagen: resolveGalleryImage('imgi-32-default.jpg'),
  },
  {
    id: 1,
    rubro: 'LOMOS',
    nombre: 'Lomo completo XX',
    detalle_1: 'Pan Frances/Arabe',
    detalle_2: 'lechuga, tomate, condimentos',
    precio: 18000,
    color: '#e84393',
    activo: 'SI',
    // Sheet original: https://i.ibb.co/S40wgnm5/imgi-26-default.jpg
    imagen: resolveGalleryImage('imgi-26-default.jpg'),
  },
  {
    id: 2,
    rubro: 'LOMOS',
    nombre: 'Lomo especial',
    detalle_1: 'Pan Frances/Arabe',
    detalle_2: 'lechuga, tomate, condimentos, huevo, jamon',
    precio: 22000,
    color: '#e84393',
    activo: 'SI',
    // Sheet original: https://i.ibb.co/6JRk4rYk/imgi-27-default.jpg
    imagen: resolveGalleryImage('imgi-27-default.jpg'),
  },
  {
    id: 3,
    rubro: 'HAMBURGUESAS',
    nombre: 'Cheddar',
    detalle_1: '1 medallon, tomate, lechuga',
    detalle_2: 'condimentos',
    precio: 10000,
    color: '#00b6b6',
    activo: 'SI',
    // Sheet original: https://i.ibb.co/qLDM7zzn/imgi-28-default.jpg
    imagen: resolveGalleryImage('imgi-28-default.jpg'),
  },
  {
    id: 4,
    rubro: 'HAMBURGUESAS',
    nombre: 'Doble carne Cheddar',
    detalle_1: '2 medallones, tomate, lechuga',
    detalle_2: 'condimentos',
    precio: 15000,
    color: '#00b6b6',
    activo: 'SI',
    // Sheet original: https://i.ibb.co/QvXL8RhV/imgi-29-default.jpg
    imagen: resolveGalleryImage('imgi-29-default.jpg'),
  },
  {
    id: 5,
    rubro: 'PIZZAS',
    nombre: 'Muzzarela 8 porciones',
    detalle_1: 'Masa casera a la piedra',
    detalle_2: 'Salsa de tomate y abundante muzzarella',
    precio: 10000,
    color: '#7c5cbf',
    activo: 'SI',
    // Sheet original: https://i.ibb.co/67KGPy9b/imgi-30-default.jpg
    imagen: resolveGalleryImage('imgi-30-default.jpg'),
  },
  {
    id: 6,
    rubro: 'PIZZAS',
    nombre: 'Especial 8 porciones',
    detalle_1: 'Masa casera a la piedra',
    detalle_2: 'Jamón cocido, morrones y muzzarella',
    precio: 15000,
    color: '#7c5cbf',
    activo: 'SI',
    // Sheet original: https://i.ibb.co/gMkRrTXZ/imgi-31-default.jpg
    imagen: resolveGalleryImage('imgi-31-default.jpg'),
  },
  {
    id: 7,
    rubro: 'EMPANADAS',
    nombre: 'Carne',
    detalle_1: 'Por docena (12 unidades)',
    detalle_2: 'Carne cortada a cuchillo, receta tradicional',
    precio: 12000,
    color: '#5fbf8b',
    activo: 'SI',
    // Sheet original: https://i.ibb.co/DgHG8kMd/imgi-32-default.jpg
    imagen: resolveGalleryImage('imgi-32-default.jpg'),
  },
  {
    id: 8,
    rubro: 'EMPANADAS',
    nombre: 'Jamon y queso',
    detalle_1: 'Por docena (12 unidades)',
    detalle_2: 'Relleno de jamón cocido y queso cremoso',
    precio: 12000,
    color: '#5fbf8b',
    activo: 'SI',
    // Sheet original: https://i.ibb.co/3y7pfn4Q/imgi-33-default.jpg
    imagen: resolveGalleryImage('imgi-33-default.jpg'),
  },
  {
    id: 16,
    rubro: 'MENÚ DEL DÍA',
    nombre: 'Lasagna',
    detalle_1: 'Salsa bolognesa',
    detalle_2: 'Porción casera abundante gratinada',
    precio: 8000,
    color: '#C91810',
    activo: 'SI',
    // Sheet original: https://i.ibb.co/qYBFxkSY/imgi-34-default.jpg
    imagen: resolveGalleryImage('imgi-34-default.jpg'),
  },
  {
    id: 17,
    rubro: 'MENÚ DEL DÍA',
    nombre: 'Canelones',
    detalle_1: 'Salsa mixta',
    detalle_2: 'Rellenos de verdura y carne con salsa',
    precio: 8000,
    color: '#C91810',
    activo: 'SI',
    // Sheet original: https://i.ibb.co/QjCGV6Lb/imgi-35-default.jpg
    imagen: resolveGalleryImage('imgi-35-default.jpg'),
  },
  {
    id: 18,
    rubro: 'MENÚ DEL DÍA',
    nombre: 'Mila de pollo',
    detalle_1: 'Papas fritas',
    detalle_2: 'Pechuga rebozada casera crujiente',
    precio: 8000,
    color: '#C91810',
    activo: 'SI',
    // Sheet original: https://i.ibb.co/7fqXFnW/imgi-36-default.jpg
    imagen: resolveGalleryImage('imgi-36-default.jpg'),
  },
  {
    id: 19,
    rubro: 'MENÚ DEL DÍA',
    nombre: 'Merluza a la romana',
    detalle_1: 'Papas fritas',
    detalle_2: 'Filet de merluza fresca a la romana con limón',
    precio: 8000,
    color: '#C91810',
    activo: 'SI',
    // Sheet original: https://i.ibb.co/hxqfWps6/imgi-37-default.jpg
    imagen: resolveGalleryImage('imgi-37-default.jpg'),
  },
];

export const PLACEBO_PRODUCTS = FALLBACK_PRODUCTS;

// Fallback legacy datasets
export const FALLBACK_COMBOS: ComboItem[] = [
  {
    id: 1,
    nombre: 'COMBO 1',
    detalle_1: '2kilos De Milas',
    detalle_2: '2 ½ De Rollitos De Pollo, Jamón y Queso',
    precio: 31250,
    color: '#C91810',
    activo: 'SI',
    imagen: '/images/1.webp',
  },
];

export const FALLBACK_MILA_PRICES: PriceKiloItem[] = [
  {
    id: 6,
    nombre: 'Mila de Pollo',
    detalle_1: 'POR KG',
    detalle_2: '1 KG',
    precio: 6950,
    color: '#e84393',
    activo: 'SI',
  },
];

export const FALLBACK_ROLLITO_PRICES: PriceKiloItem[] = [
  {
    id: 9,
    nombre: 'Rollitos de pollo',
    detalle_1: 'POR KG',
    detalle_2: '1 KG',
    precio: 9000,
    color: '#5fbf8b',
    activo: 'SI',
  },
];

export type ParsedSheet = MasterCatalog;

/**
 * Normaliza nombres de rubros para matching flexible (ej. "MENU DEL DIA" === "MENÚ DEL DÍA")
 */
export function normalizeRubroKey(name: string): string {
  return (name || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // remueve acentos
}

/**
 * Limpia y valida códigos de color HEX
 */
export function sanitizeHexColor(colorStr: string): string | null {
  if (!colorStr) return null;
  const cleaned = colorStr.trim().replace(/^['"]|['"]$/g, '');
  if (/^#[0-9A-Fa-f]{6}$/.test(cleaned) || /^#[0-9A-Fa-f]{3}$/.test(cleaned)) {
    return cleaned;
  }
  return null;
}

/**
 * Divide línea CSV respetando comillas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parsea la solapa "rubros" de Google Sheets
 */
export function parseRubrosCSV(csvText: string): {
  rubrosList: RubroItem[];
  rubrosMap: Record<string, RubroItem>;
  rubrosOrder: string[];
} {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rubrosList: RubroItem[] = [];
  const rubrosMap: Record<string, RubroItem> = {};
  const rubrosOrder: string[] = [];

  if (lines.length <= 1) {
    FALLBACK_RUBROS.forEach((r) => {
      rubrosList.push(r);
      rubrosMap[r.rubro.trim().toUpperCase()] = r;
      rubrosMap[normalizeRubroKey(r.rubro)] = r;
      rubrosOrder.push(r.rubro.trim().toUpperCase());
    });
    return { rubrosList, rubrosMap, rubrosOrder };
  }

  const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
  const idIdx = header.indexOf('id_rubro') !== -1 ? header.indexOf('id_rubro') : header.indexOf('id');
  const rubroIdx = header.indexOf('rubro');
  const colorIdx = header.indexOf('color');
  const descripIdx = header.indexOf('descrip');

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length === 0 || row.every((c) => c.length === 0)) continue;

    const rubroName = rubroIdx >= 0 && row[rubroIdx] ? row[rubroIdx].trim().toUpperCase() : '';
    if (!rubroName) continue;

    const rawColor = colorIdx >= 0 && row[colorIdx] ? row[colorIdx].trim() : '';
    const validColor = sanitizeHexColor(rawColor) || DEFAULT_RUBRO_COLORS[rubroName] || '#C91810';

    const item: RubroItem = {
      id_rubro: idIdx >= 0 && row[idIdx] ? row[idIdx].trim() : String(i),
      rubro: rubroName,
      color: validColor,
      descrip: descripIdx >= 0 && row[descripIdx] ? row[descripIdx].trim() : '',
    };

    rubrosList.push(item);
    rubrosMap[rubroName] = item;
    rubrosMap[normalizeRubroKey(rubroName)] = item;
    if (!rubrosOrder.includes(rubroName)) {
      rubrosOrder.push(rubroName);
    }
  }

  // Asegurar que COMBOS figure como prioritario
  const sortedOrder = rubrosOrder.sort((a, b) => {
    if (a === 'COMBOS') return -1;
    if (b === 'COMBOS') return 1;
    const idxA = RUBROS_PRIORITY_ORDER.indexOf(a);
    const idxB = RUBROS_PRIORITY_ORDER.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return 0;
  });

  return { rubrosList, rubrosMap, rubrosOrder: sortedOrder };
}

/**
 * Parsea la solapa "productos" de Google Sheets y asocia el color del rubro si el campo color está vacío
 */
export function parseProductosCSV(
  csvText: string,
  rubrosMap: Record<string, RubroItem> = {}
): {
  productos: ProductItem[];
  rubros: string[];
  productosPorRubro: Record<string, ProductItem[]>;
  rubrosMap: Record<string, RubroItem>;
} {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) {
    return groupByRubro(FALLBACK_PRODUCTS, rubrosMap);
  }

  const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
  const idIdx = header.indexOf('id');
  const rubroIdx = header.indexOf('rubro');
  const nombreIdx = header.indexOf('nombre');
  const d1Idx = header.indexOf('detalle_1');
  const d2Idx = header.indexOf('detalle_2');
  const precioIdx = header.indexOf('precio');
  const colorIdx = header.indexOf('color');
  const activoIdx = header.indexOf('activo');
  const imagenIdx = header.indexOf('imagen');

  const defaultImages: Record<string, string> = {
    '1': '/images/1.webp',
    '2': '/images/2.webp',
    '3': '/images/3.webp',
    '4': '/images/4.webp',
    '5': '/images/5.webp',
  };

  const parsedProducts: ProductItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length === 0 || row.every((c) => c.length === 0)) continue;

    const id = idIdx >= 0 && row[idIdx] ? row[idIdx].trim() : String(i);
    const nombre = nombreIdx >= 0 && row[nombreIdx] ? row[nombreIdx].trim() : '';
    if (!nombre) continue;

    let rubro = rubroIdx >= 0 && row[rubroIdx] ? row[rubroIdx].trim().toUpperCase() : '';
    if (!rubro) {
      const lower = nombre.toLowerCase();
      if (lower.startsWith('combo')) rubro = 'COMBOS';
      else if (lower.includes('lomo')) rubro = 'LOMOS';
      else if (lower.includes('hamburg')) rubro = 'HAMBURGUESAS';
      else if (lower.includes('pizza')) rubro = 'PIZZAS';
      else if (lower.includes('empanada')) rubro = 'EMPANADAS';
      else rubro = 'VARIOS';
    }

    const detalle_1 = d1Idx >= 0 && row[d1Idx] ? row[d1Idx].trim() : '';
    const detalle_2 = d2Idx >= 0 && row[d2Idx] ? row[d2Idx].trim() : '';

    const rawPrecio = precioIdx >= 0 && row[precioIdx] ? row[precioIdx].trim() : '0';
    const precio = parseFloat(rawPrecio.replace(/[^0-9.]/g, '')) || 0;

    const activo = activoIdx >= 0 && row[activoIdx] ? row[activoIdx].trim().toUpperCase() : 'SI';

    // Regla solicitada: si el campo color está vacío (o no es un hex válido), toma el color del rubro correspondiente
    const rawColor = colorIdx >= 0 && row[colorIdx] ? row[colorIdx].trim() : '';
    const customColor = sanitizeHexColor(rawColor);

    const rubroInfo = rubrosMap[rubro] || rubrosMap[normalizeRubroKey(rubro)];
    const rubroColor = rubroInfo?.color || DEFAULT_RUBRO_COLORS[rubro] || DEFAULT_RUBRO_COLORS[normalizeRubroKey(rubro)] || '#C91810';

    const color = customColor || rubroColor;

    let imagen = imagenIdx >= 0 && row[imagenIdx] ? row[imagenIdx].trim() : '';
    // Estrategia inteligente: si la Sheet asigna una imagen (imgi_XX_default.jpg), se vincula con la galería local (mimgi_XX_default.webp)
    const galleryImage = resolveGalleryImage(imagen);
    if (galleryImage) {
      imagen = galleryImage;
    } else if (!imagen && rubro === 'COMBOS') {
      imagen = defaultImages[String(id)] || '';
    }

    parsedProducts.push({
      id,
      rubro,
      nombre,
      detalle_1,
      detalle_2,
      precio,
      color,
      activo,
      imagen: imagen || undefined,
    });
  }

  const finalProducts = parsedProducts.length > 0 ? parsedProducts : FALLBACK_PRODUCTS;
  return groupByRubro(finalProducts, rubrosMap);
}

/**
 * Agrupa productos por rubro respetando el orden con COMBOS primero
 */
export function groupByRubro(
  products: ProductItem[],
  rubrosMap: Record<string, RubroItem> = {}
): MasterCatalog {
  const rubrosSet = new Set<string>();
  const productosPorRubro: Record<string, ProductItem[]> = {};

  products.forEach((p) => {
    if (p.activo.trim().toUpperCase() === 'NO') return;
    const rubro = (p.rubro || 'VARIOS').trim().toUpperCase();
    rubrosSet.add(rubro);
    if (!productosPorRubro[rubro]) {
      productosPorRubro[rubro] = [];
    }
    productosPorRubro[rubro].push(p);
  });

  const allFoundRubros = Array.from(rubrosSet);
  const sortedRubros = allFoundRubros.sort((a, b) => {
    if (a === 'COMBOS') return -1;
    if (b === 'COMBOS') return 1;

    const idxA = RUBROS_PRIORITY_ORDER.indexOf(a);
    const idxB = RUBROS_PRIORITY_ORDER.indexOf(b);

    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  return {
    productos: products,
    rubros: sortedRubros,
    productosPorRubro,
    rubrosMap,
  };
}

/**
 * Estrategia principal de carga:
 * MODO PLACEBO DEMO (Activo en esta instancia para carga holgada e instantánea):
 * Se vinculan las imágenes locales de la galería (m...webp) basadas en la Sheet.
 * NOTA DE ARQUITECTURA: El código de consulta a Google Sheets se mantiene intacto
 * pero comentado por solicitud del usuario, para servir como plantilla a futuros clientes.
 */
export async function fetchMasterCatalog(): Promise<MasterCatalog> {
  /*
  // =========================================================================
  // CÓDIGO DE REFERENCIA A GOOGLE SHEET (Comentado para modo placebo):
  // Descomentar este bloque para sincronización dinámica en vivo con Google Sheets:
  try {
    const response = await fetch(SECURE_CATALOG_API);
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.productosCsv) {
        const parsedRubros = parseRubrosCSV(data.rubrosCsv || '');
        const masterCatalog = parseProductosCSV(data.productosCsv, parsedRubros.rubrosMap);
        if (masterCatalog.productos.length > 0) {
          return masterCatalog;
        }
      }
    }
  } catch (error) {
    console.warn('Endpoint seguro /api/catalog no disponible, usando fallback local.', error);
  }
  // =========================================================================
  */

  // Modo placebo: Carga inmediata desde el catálogo con mapeo de imágenes de la galería (m...webp)
  const parsedRubros = parseRubrosCSV('');
  return groupByRubro(FALLBACK_PRODUCTS, parsedRubros.rubrosMap);
}

/**
 * Alias para compatibilidad previa
 */
export function parseSheetCSV(csvText: string): ParsedSheet {
  const parsedRubros = parseRubrosCSV('');
  return parseProductosCSV(csvText, parsedRubros.rubrosMap);
}

export function formatPriceARS(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(price);
}
