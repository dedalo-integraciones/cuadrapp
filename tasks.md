# TASKS — Ledger de OTs y pendientes reales

## Leyenda

- `[x]` cerrada con código + `tsc` + build + evidencia empírica.
- `[ ]` pendiente real con criterio de cierre. Nada aspiracional.
- Sin spec actualizada no se cierra una OT.

## Hechas

- [x] **OT#1 — Migración de Google Sheets a Turso/libSQL (local)**.
      Esquemas Drizzle y SQL para core y tenant; capa de acceso; resolución
      multi-tenant; eliminación del endpoint legado de Sheets; seed desde
      `Cuadra.xlsx`; health y estado de bases.
      Evidencia: 2 rubros, 7 categorías, 19 productos; `tsc` 0; build verde.
- [x] **OT#2 — API de catálogo y negocio**.
      `GET /api/catalog/:slug`, `GET /api/tenant/:slug` y `GET /api/health`.
      Respuestas públicas sin `turso_db` ni tokens.
      Evidencia: 200 con datos reales; slug inexistente 404.
- [x] **OT#3 — Autenticación y seguridad del panel**.
      bcryptjs, membership por request, rate-limit 5/15 min, auditoría,
      honeypot, saneamiento de entradas y límites de longitud.
      Evidencia: login válido 200; clave incorrecta 401; email sin membership
      401; subida sin Cloudinary 503 controlado.
- [x] **OT#4 — Dispatcher admin y CRUD**.
      Acciones de resumen y CRUD de rubros, categorías, productos y
      configuración; límites de 50 rubros y `max_registros` productos; rechazo
      de borrado con hijos (409 `REFERENCIA`).
      Evidencia: CRUD de prueba completo por API y limpieza posterior.
- [x] **OT#5 — Panel `/admin`**.
      Login, sesión en `sessionStorage`, 4 pestañas, buscador y filtros,
      formularios, modales propios, doble confirmación, toasts responsive.
      Evidencia: navegador integrado sin errores de consola; 19 productos,
      7 categorías y 2 rubros visibles; modal de producto abre y cierra.
- [x] **OT#6 — Tienda mobile con catálogo Turso**.
      Caché de 5 minutos, respaldo local, secciones por categoría con rubro
      padre, filtro por rubro/categoría, carrito y CTA de WhatsApp.
      Evidencia: tienda carga 19 productos; agregar al carrito abre el modal y
      muestra "Enviar Pedido por WhatsApp".
- [x] **OT#7 — Imágenes de producto**.
      Compresión JPEG 1200 px en navegador, endpoint firmado de Cloudinary,
      validación de URL y vista previa; fallback de URL manual.
      Evidencia: sin credenciales, la API responde 503
      `ALMACENAMIENTO_NO_CONFIGURADO`.
- [x] **OT#8 — SDD adaptado de Icaria**.
      `AGENTS.md`, `plan.md`, `research.md`, `tasks.md`, `spec/` y
      `manual-usuario.md` con el estado real de Cuadra.
- [x] **OT#9 — Turso de producción**.
      Base core y base del tenant en Turso; variables de Turso cargadas en
      Vercel; migración y seed ejecutados.
      Evidencia verificada el 13-nov-2026: `/api/health` 200 con core y tenant
      en `ok`; `/api/catalog/cuadra` 200 con 2 rubros, 7 categorías y 19
      productos; `/api/tenant/cuadra` 200; `/admin` 200.
- [x] **OT#10 — Cloudinary de producción**.
      Las cuatro variables de Cloudinary cargadas en Vercel.
      Cierre por confirmación del owner el 13-nov-2026. No se repitió una subida
      real desde el formulario en esta sesión.
- [x] **OT#15 — Sesión con cierre por inactividad**.
      Token firmado HMAC-SHA256 en `sessionStorage` con `uid`, `email`, `tenant`
      y `exp`; vencimiento de 30 minutos en el servidor; renovación deslizante en
      cada acción exitosa; cierre al cerrar la pestaña o el navegador; aviso
      claro de inactividad en el login.
      Evidencia local (13-nov-2026): 12/12 pruebas aprobadas — login, token
      reutilizado, renovación, `latido`, solo email 401, token alterado 401,
      token vencido 401 `SESION_INACTIVA`, otro negocio 401, salir 200, upload
      sin token 401 y upload con token válido; `tsc` 0; build verde.
      Evidencia de producción (13-nov-2026, tras push): `GET /api/health` 200
      con core y tenant en `ok`; `GET /api/catalog/cuadra` 200 con 2 rubros, 7
      categorías y 19 productos; `GET /admin` 200; `POST /api/admin` sin token
      401 `SESION_INVALIDA`; con email válido y clave incorrecta 401
      `TOKEN_INVALIDO`; el bundle `/assets/index-D47w-Mnj.js` contiene
      `SESION_INACTIVA`, `latido` y el aviso de inactividad, y no contiene
      `SESSION_SECRET`.
- [x] **OT#16 — Fusibles de configuración**.
      `VITE_TENANT` obligatorio en build de producción; `CLOUDINARY_FOLDER`
      obligatorio para subir; `TENANT_DEFAULT` desde `TENANT_OVERRIDE` con aviso
      en producción; `asegurarTenant` con datos neutros; `create-admin` con slug
      obligatorio; seed con `<archivo.xlsx>` obligatorio; staging excluye
      `.env*` salvo `.env.example`.
      Evidencia: build sin `VITE_TENANT` aborta con mensaje explícito; seed sin
      archivo y admin sin slug abortan antes de tocar la base; `tsc` 0; build
      verde.

## Pendientes

- [ ] **OT#11 — Procedimiento de alta de negocios**.
      Documentar y probar el alta completa de un tenant nuevo (base, migración,
      admin, catálogo). Criterio: un negocio nuevo opera tienda y panel sin
      tocar código.
- [ ] **OT#12 — Respaldos**.
      Definir frecuencia, responsable y restauración probada de core y de cada
      base de negocio. Criterio: restauración verificada en un entorno de
      prueba.
- [ ] **OT#13 — Exportaciones `.xlsx` (si se aprueba)**.
      Solo SheetJS con import dinámico, respetando filtros visibles; actualizar
      manual y specs. Criterio: archivo descargado con los datos en pantalla.

## Descartado

- **OT#14 — Superadmin web**. No se implementa: la escala es un repositorio y un
  deployment por cliente. El código multi-tenant se conserva sin panel de
  superadmin.

## Deuda conocida

- `manual.md` es el manual legado de Google Sheets; no está vigente. El manual
  oficial es `manual-usuario.md`.
- `README.md` fue reescrito para la etapa Turso; verificar que no queden
  referencias al Sheet en otros documentos.
- El repositorio git vive en `dev`. El staging a `/Github` se hace con
  `scripts/stage-to-github.bat`, que excluye `.env*` (salvo `.env.example`) y
  `.gitignore`; el push queda a cargo del owner.
- Antes del próximo deploy, Vercel necesita `SESSION_SECRET` (mínimo 32
  caracteres) y `VITE_TENANT=cuadra`. Sin la primera, el login responde error;
  sin la segunda, el build de producción se detiene.
- `server.ts` usa `process.env.PORT` con respaldo 3000; Vercel no usa ese
  servidor.
