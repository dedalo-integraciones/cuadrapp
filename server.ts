import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

/*
// =========================================================================
// CONFIGURACIÓN DE REFERENCIA A GOOGLE SHEETS (Preservado para modo placebo):
// Sanitiza y extrae el ID de Google Sheets tanto si el usuario coloca el ID solo o la URL completa
function extractSheetId(raw?: string): string {
  if (!raw) return '1U8uctMTYdOuKDH4jEwRqLgyaXZMG-6YjGO4Ov7AT_TA';
  const trimmed = raw.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) return match[1];
  return trimmed.split('/')[0].split('?')[0];
}

const GOOGLE_SHEET_ID = extractSheetId(
  process.env.GOOGLE_SHEET_ID || '1U8uctMTYdOuKDH4jEwRqLgyaXZMG-6YjGO4Ov7AT_TA'
);

// Cache en memoria para respuestas ultra rápidas y evitar saturar Google Sheets
let catalogCache: {
  timestamp: number;
  data: {
    rubrosCsv: string;
    productosCsv: string;
  };
} | null = null;

const CACHE_TTL_MS = 60 * 1000; // 1 minuto de cache en servidor
// =========================================================================
*/

/**
 * Endpoint de catálogo seguro:
 * MODO PLACEBO DEMO (Activo en esta instancia para carga holgada e inmediata):
 * El código que realiza la consulta a Google Sheets se mantiene completamente
 * preservado pero comentado, sirviendo de plantilla para futuros clientes.
 */
app.get('/api/catalog', async (_req: Request, res: Response) => {
  /*
  // =========================================================================
  // CÓDIGO DE REFERENCIA A GOOGLE SHEETS (Preservado y comentado para modo placebo):
  try {
    const now = Date.now();
    if (catalogCache && now - catalogCache.timestamp < CACHE_TTL_MS) {
      res.setHeader('Cache-Control', 'public, max-age=60');
      return res.json({
        success: true,
        cached: true,
        ...catalogCache.data,
      });
    }

    const sheetId = GOOGLE_SHEET_ID;
    const rubrosUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=rubros`;
    const productosUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=productos`;

    const [resRubros, resProductos] = await Promise.allSettled([
      fetch(rubrosUrl),
      fetch(productosUrl),
    ]);

    let rubrosCsv = '';
    let productosCsv = '';

    if (resRubros.status === 'fulfilled' && resRubros.value.ok) {
      rubrosCsv = await resRubros.value.text();
    }

    if (resProductos.status === 'fulfilled' && resProductos.value.ok) {
      productosCsv = await resProductos.value.text();
    } else {
      const fallbackUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
      const fallbackRes = await fetch(fallbackUrl);
      if (fallbackRes.ok) {
        productosCsv = await fallbackRes.text();
      }
    }

    if (!productosCsv) {
      return res.status(502).json({
        success: false,
        error: 'No se pudo obtener el catálogo desde la fuente de datos',
      });
    }

    catalogCache = {
      timestamp: now,
      data: {
        rubrosCsv,
        productosCsv,
      },
    };

    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.json({
      success: true,
      cached: false,
      rubrosCsv,
      productosCsv,
    });
  } catch (error) {
    console.error('Error al consultar el catálogo en el servidor:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor al procesar el catálogo',
    });
  }
  // =========================================================================
  */

  // Respuesta placebo instantánea
  res.setHeader('Cache-Control', 'public, max-age=60');
  return res.json({
    success: true,
    placebo: true,
    rubrosCsv: `"id_rubro","rubro","color","descrip"
"1","COMBOS","#C91810","(Rojo institucional)"
"1","LOMOS","#e84393","(Rosa fucsia)"
"2","HAMBURGUESAS","#00b6b6","(Turquesa / Teal)"
"3","PIZZAS","#7c5cbf","(Violeta / Púrpura)"
"4","EMPANADAS","#5fbf8b","(Verde esmeralda / menta)"
"5","MENÚ DEL DÍA","#C91810","(Rojo institucional)"
"6","BEBIDAS","#0055A4","(Azul clásico)"`,
    productosCsv: `"id","rubro","nombre","detalle_1","detalle_2","precio","color","activo","imagen"
"1","LOMOS","Lomo completo XX","Pan Frances/Arabe","lechuga, tomate, condimentos","18000","","SI","imgi-26-default.jpg"
"2","LOMOS","Lomo especial","Pan Frances/Arabe","lechuga, tomate, condimentos, huevo, jamon","22000","","SI","imgi-27-default.jpg"
"3","HAMBURGUESAS","Cheddar","1 medallon, tomate, lechuga","condimentos","10000","","SI","imgi-28-default.jpg"
"4","HAMBURGUESAS","Doble carne Cheddar","2 medallones, tomate, lechuga","condimentos","15000","","SI","imgi-29-default.jpg"
"5","PIZZAS","Muzzarela 8 porciones","","","10000","","SI","imgi-30-default.jpg"
"6","PIZZAS","Especial 8 porciones","","","15000","","SI","imgi-31-default.jpg"
"7","EMPANADAS","Carne","Por docena","","12000","","SI","imgi-32-default.jpg"
"8","EMPANADAS","Jamon y queso","Por docena","","12000","","SI","imgi-33-default.jpg"
"9","COMBOS","Combo 1","2 lomos","Papas chicas","36000","","SI","imgi-20-default.jpg"
"10","COMBOS","Combo 2","Lomo especial","Papas chicas","22000","","SI","imgi-21-default.jpg"
"11","COMBOS","Combo 3","Burguer Cheddar","Papas chicas","10000","","SI","imgi-22-default.jpg"
"12","COMBOS","Combo 4","1 muzza","1 doc empanadas","25000","","SI","imgi-23-default.jpg"
"13","COMBOS","Combo 5","2 muzzas","","20000","","SI","imgi-24-default.jpg"
"14","COMBOS","Combo 6","1 muzza + 1/2 empanadas","Papas chicas","15000","","SI","imgi-25-default.jpg"
"15","COMBOS","Combo 7","2 docenas empanadas carne","","20000","","SI","imgi-32-default.jpg"
"16","MENÚ DEL DÍA","Lasagna","Salsa","","8000","","SI","imgi-34-default.jpg"
"17","MENÚ DEL DÍA","Canelones","Salsa","","8000","","SI","imgi-35-default.jpg"
"18","MENÚ DEL DÍA","Mila de pollo ","Papas fritas","","8000","","SI","imgi-36-default.jpg"
"19","MENÚ DEL DÍA","Merluza a la romana ","Papas fritas","","8000","","SI","imgi-37-default.jpg"`
  });
});

// Endpoint de salud
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Dédalo Integraciones corriendo en el puerto ${PORT}`);
  });
}

startServer();
