import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

import adminHandler from './api/admin/index';
import uploadHandler from './api/admin/upload';
import catalogHandler from './api/catalog/[slug]';
import healthHandler from './api/health';
import tenantHandler from './api/tenant/[slug]';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Las imágenes viajan como data URL; el límite cubre el POST de subida.
app.use(express.json({ limit: '10mb' }));

// ── API local: mismos handlers que Vercel ────────────────────────────────────
app.get('/api/health', (req: Request, res: Response) => healthHandler(req, res));
app.get('/api/catalog/:slug', (req: Request, res: Response) => catalogHandler(req, res));
app.get('/api/tenant/:slug', (req: Request, res: Response) => tenantHandler(req, res));
app.all('/api/admin', (req: Request, res: Response) => adminHandler(req, res));
app.post('/api/admin/upload', (req: Request, res: Response) => uploadHandler(req, res));

app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ ok: false, error: 'NO_ENCONTRADO' });
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

  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[server] error no controlado', error);
    if (res.headersSent) return;
    res.status(500).json({ ok: false, error: 'ERROR_INTERNO' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cuadra local en http://localhost:${PORT} · panel en /admin`);
  });
}

startServer();
