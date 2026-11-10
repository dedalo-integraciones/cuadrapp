# PLAN — Cuadra: fases hechas y próximos pasos

## Hecho (verificado localmente)

- **Fase 0 — Migración de Google Sheets a Turso/libSQL**: el catálogo deja de
  leerse del Sheet público. Se eliminó el endpoint legado y el catálogo ahora
  sale de dos bases libSQL: core (plataforma) y una base por negocio.
- **Fase 1 — Modelo jerárquico**: rubros → categorías → productos, con orden,
  color, activo, destacado, popular, imagen y precio en centavos.
- **Fase 2 — Seed real**: `Cuadra.xlsx` se importa con SheetJS. La carga local
  dejó 2 rubros (COMIDAS, BEBIDAS), 7 categorías y 19 productos.
- **Fase 3 — API multi-tenant**: `GET /api/catalog/:slug`,
  `GET /api/tenant/:slug`, `GET /api/health` y dispatcher
  `POST /api/admin` con login, resumen y CRUD de rubros, categorías y productos.
- **Fase 4 — Autenticación**: email + clave con bcryptjs, sesión por email en
  `sessionStorage`, revalidación de membership en cada request, rate-limit de
  login (5 intentos por IP cada 15 minutos) y auditoría en `audit_log`.
- **Fase 5 — Panel de administración** (`/admin`): login, 4 pestañas
  (Productos, Categorías, Rubros, Configuración), buscador y filtros de
  productos, CRUD completo, alta lógica/baja lógica, borrado con doble
  confirmación, formularios con validación y avisos propios.
- **Fase 6 — Tienda**: catálogo desde la API con caché local de 5 minutos y
  catálogo de respaldo; secciones por categoría con el rubro padre visible;
  drawer de filtros por rubro o categoría; carrito y pedido por WhatsApp.
- **Fase 7 — Imágenes**: compresión en el navegador y endpoint de subida
  firmada a Cloudinary. Sin credenciales responde 503 controlado y el panel
  permite pegar una URL manual.
- **Verificación local**: `tsc --noEmit` en 0, `vite build` en verde, CRUD de
  prueba creado/editado/desactivado/borrado por API, login válido e inválido,
  rechazo de borrado con hijos, `/admin` servido por la SPA y flujo de tienda
  → carrito → CTA de WhatsApp sin errores de consola.

## Pendiente real (cada uno con su OT)

1. **OT — Turso de producción**: crear la base core y la base del negocio en
   Turso, cargar `TURSO_CORE_URL`, `TURSO_CORE_TOKEN`, `TURSO_APP_URL` y
   `TURSO_APP_TOKEN` en Vercel, ejecutar migraciones y seed, y verificar
   `/api/health` en producción.
2. **OT — Cloudinary**: cargar `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
   `CLOUDINARY_API_SECRET` y `CLOUDINARY_FOLDER`; verificar subida real desde el
   formulario de producto.
3. **OT — Alta de negocios**: definir el procedimiento operativo para crear un
   tenant, su base, su administrador y su catálogo inicial. Hoy existe por
   scripts, sin UI de superadmin.
4. **OT — Respaldos**: definir copia de seguridad de la base core y de cada base
   de negocio antes de operar con clientes reales.
5. **OT — Exportaciones** (si se aprueban): implementar solo `.xlsx` con SheetJS
   e import dinámico, respetando filtros visibles, y actualizar manual y specs.

## Fase futura (evaluar con uso real)

- Superadmin web para alta de tenants, usuarios, vencimientos y topes.
- White-label visual por negocio (logo, colores, favicon, imagen de portada).
- Analítica de productos vistos y pedidos iniciados, sin persistir datos
  personales.
- Versionado de catálogo por temporada (carta de verano/invierno).

## Decisión vigente

- La v1 no persiste pedidos ni clientes. El pedido vive en el navegador y se
  envía por WhatsApp. Cualquier módulo de órdenes, pagos o logística requiere
  una OT nueva y un cambio explícito del contrato de datos.
