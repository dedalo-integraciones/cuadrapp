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

## Pendientes

- [ ] **OT#9 — Turso de producción**.
      Crear base core y base del tenant; cargar las cuatro variables de Turso
      en Vercel; migrar, sembrar y verificar.
      Criterio: `/api/health` en producción con core y tenant en `ok`;
      `/api/catalog/cuadra` con los 19 productos reales.
- [ ] **OT#10 — Cloudinary de producción**.
      Cargar las cuatro variables de Cloudinary y verificar una subida real
      desde el formulario de producto.
      Criterio: la imagen sube, queda accesible por URL y se guarda en el
      producto.
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
- [ ] **OT#14 — Superadmin web (fase futura)**.
      Alta de tenants, usuarios, vencimientos y topes sin scripts.
      Criterio: operación completa desde UI con auditoría.

## Deuda conocida

- `manual.md` es el manual legado de Google Sheets; no está vigente. El manual
  oficial es `manual-usuario.md`.
- `README.md` fue reescrito para la etapa Turso; verificar que no queden
  referencias al Sheet en otros documentos.
- No hay repo git inicializado en `dev`; el control de versiones y el deploy
  quedan a cargo del owner.
- `server.ts` usa `process.env.PORT` con respaldo 3000; Vercel no usa ese
  servidor.
