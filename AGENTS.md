# AGENTS.md — Cuadra

Tienda de pedidos por WhatsApp + panel de administración. Stack: Vite + React 19 +
TypeScript, Tailwind 4, `@libsql/client`, Drizzle (esquema y migraciones),
funciones serverless `api/*.ts` con contrato `@vercel/node`, Turso/libSQL
(base core + una base por negocio) y deploy en Vercel.

La tienda pública es siempre mobile-first (ancho máximo 390 px). Solo el panel
de administración es responsivo.

## Comandos

- `npm run dev` — servidor local Express + Vite en `http://localhost:3000`.
- `npm run build` — build de producción (`vite build`).
- `npm run lint` — `tsc --noEmit`. Debe dar 0 errores antes de cerrar una OT.
- `npm run db:migrate` — migra core y tenant local.
- `npm run db:seed` — carga el catálogo desde `Cuadra.xlsx`.
- `npm run db:admin` — crea o actualiza el administrador inicial.
- `npm run db:tenant -- <slug> ["Nombre"] ["libsql://..."]` — alta de negocio.

`tsconfig` NO tiene `strict`: el narrowing `!x.ok` NO angosta uniones. Usar
`x.ok === false` o casts explícitos. `vite build` no chequea tipos; `tsc` es el
gate obligatorio.

## Estructura

- `api/` — 5 funciones (límite Hobby: 12):
  `admin/index.ts` (dispatcher con acciones), `admin/upload.ts` (Cloudinary
  firmado), `catalog/[slug].ts`, `tenant/[slug].ts`, `health.ts`.
- `src/db/` — `client.ts` (crea clientes libSQL), `core.ts`, `tenant.ts`,
  `schema-platform.ts`, `schema-tenant.ts`.
- `src/server/` — `http.ts` (respuestas y saneamiento), `admin-auth.ts`
  (membership + sesión), `rate-limit.ts`, `audit.ts`.
- `src/pages/AdminPanel.tsx` — login, pestañas y CRUD del panel.
- `src/components/admin/` — formularios y UI propia del panel.
- `src/services/` — `catalogoService.ts` (tienda) y `adminService.ts` (panel).
- `src/utils/` — precios (centavos/pesos), imágenes (compresión), catálogo de
  respaldo.
- `migrations/platform/` y `migrations/tenant/` — SQL versionado.
- `scripts/` — migración, seed, alta de tenant, alta de admin y estado.

## Reglas de trabajo

- Todo encargo es una OT numerada; sin OT no se implementa. Un paso por vez.
- Cierre de OT = informe + `tsc`/`build` verdes + spec actualizada. Sin spec
  actualizada, la OT no cierra.
- Verificación empírica siempre: endpoints vivos, respuestas reales, PRAGMA o
  consultas reales. No asumir contenido de archivos: releerlos frescos.
- Español neutro en TODO el proyecto (UI, API, manuales, docs). Sin voseo ni
  regionalismos. En UI, forma usted; en manuales, infinitivos.
- Ventanas de sistema prohibidas: ningún `window.confirm`, `alert` ni `prompt`.
  Todo aviso o confirmación usa modal propio (`ConfirmDialog` con doble
  confirmación para borrados permanentes).
- Precios: en DB y API viajan en centavos (`precio_cents`, INTEGER). En UI se
  muestran en pesos con `formatPrecio`. No crear columnas `precio` en DB.
- Imágenes: URL http(s) o ruta interna. La subida comprime a JPEG 1200 px en el
  navegador y firma Cloudinary en el servidor. Sin credenciales, el panel acepta
  URL manual y la subida responde 503 `ALMACENAMIENTO_NO_CONFIGURADO`.
- Pedidos: NO se persisten. El carrito arma el mensaje y abre `wa.me`. No crear
  tablas de órdenes, clientes ni pagos para la v1.
- Multi-tenant: base core para plataforma/usuarios y base física por negocio.
  `turso_db` nunca se expone en respuestas públicas.
- Secretos: `.env` no se commitea. No incluir claves en código, docs ni informes.
- Exportaciones: solo `.xlsx` con SheetJS e import dinámico. Nunca CSV, PDF ni
  DOCX. Hoy Cuadra no tiene exportaciones; si se agregan, actualizar manual y
  spec.
- Guías UI: dar solo pasos verificados en la interfaz real. Si no se conoce la
  UI exacta, declararlo y pedir captura o texto; prohibido inventar botones.

## PROMPT DE LA VERDAD

- Verdad siempre: no inventar, especular ni adivinar. Afirmaciones con fuente
  verificable. "No puedo confirmar esto" cuando no se pueda verificar.
- Precisión sobre velocidad. Explicar el razonamiento cuando la exactitud pueda
  cuestionarse. Indicar cómo se obtuvo cada cifra.
- Evitar fabricar hechos, citas o datos; evitar rumores como hechos y seguridad
  sin pruebas.
- Procedimientos de varios pasos: de a 1 paso por vez, esperando confirmación.
- Formato de entrega: informes en texto plano, líneas de largo normal. Bloques
  de código solo si el owner lo pide explícito.

## Fuentes

- `spec/contrato-datos.md` — esquema real de core y tenant.
- `spec/panel-admin.md` — acceso, pestañas, CRUD y patrones UI.
- `spec/pedidos-whatsapp.md` — flujo de carrito y mensaje, sin persistencia.
- `plan.md` — fases hechas y próximos pasos.
- `research.md` — hallazgos verificados con evidencia.
- `tasks.md` — ledger de OTs y pendientes reales.
- `manual-usuario.md` — manual del panel y de la tienda.

## Inventario de .md

- `AGENTS.md` — este archivo.
- `plan.md`, `research.md`, `tasks.md` — gestión del proyecto.
- `manual-usuario.md` — manual oficial vigente.
- `spec/contrato-datos.md`, `spec/panel-admin.md`, `spec/pedidos-whatsapp.md`.
- `README.md` — puesta en marcha técnica.
- `manual.md` — legado de la etapa Google Sheets; no está vigente.
