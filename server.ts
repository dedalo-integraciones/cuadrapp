import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

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

/**
 * Endpoint de catálogo seguro:
 * El cliente solicita /api/catalog y el servidor descarga las solapas
 * de Google Sheets sin que el ID ni la URL de Google aparezcan en el navegador.
 */
app.get('/api/catalog', async (_req: Request, res: Response) => {
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
      // Intento con endpoint por defecto sin parámetro de solapa
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
    console.log(`Servidor Sabor Casero corriendo en el puerto ${PORT}`);
  });
}

startServer();
