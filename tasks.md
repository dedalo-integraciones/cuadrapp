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
- [x] **OT#17 — Remediación de la auditoría de seguridad del 16-nov-2026**.
      Se aplicaron los tres paquetes aprobados sobre los hallazgos B-01 a B-09,
      B-11 e I-01. B-10 no requirió código: `/api/diag` ya estaba eliminado y
      responde 404; no se vuelve a publicar.
      Paquete 1: eliminación de `listar_publico` y de `listarPublico` (B-01);
      cabeceras de seguridad y CSP en `vercel.json` (B-02); `Cache-Control:
      no-store` en `/api/admin*` (B-04).
      Paquete 2: login con doble contador, 5 intentos por IP y 10 por email cada
      15 minutos, incremento atómico y limpieza de ambos al entrar (B-05);
      comparación bcrypt contra un hash ficticio cuando el email no existe
      (B-06); `npm audit fix` sin `--force` y express 4.22.3 (B-08).
      Paquete 3: validación de URLs de redes y endurecimiento de `imagenSegura`
      (B-07); caché de 30 segundos y cabeceras en `/api/health` (B-09);
      revocación de sesión aceptada y documentada, sin lista (B-03);
      `ADMIN_PASSWORD` vacío en `.env.example` (B-11); rewrite limitado a
      `/admin*` y página `404.html` real (I-01).
      Evidencia local (16-nov-2026): `listar_publico` sin token → 401; JSON de
      `vercel.json` válido; sitio y `/admin` con la CSP nueva → 0 errores de
      consola; 10/10 pruebas de rate-limit contra libSQL temporal (incluye 20
      fallos en paralelo sin perder incrementos); `/api/health` con 3 llamadas →
      1 sola consulta real; `/.env` y `/.git/config` → 404 real; `/` y `/admin`
      → 200; `tsc` 0; build verde; `npm audit --omit=dev` → 0 vulnerabilidades,
      con 13 avisos restantes solo en devDependencies y sin arreglo sin
      `--force`.
      Evidencia de producción (16-nov-2026, tras push): las seis cabeceras y la
      CSP responden en `/`, `/admin` y las páginas 404; `/api/health` 200 con
      core y tenant en `ok`, `Cache-Control: public, max-age=10` y cache HIT de
      borde; `/.env`, `/.git/config` y una ruta inexistente → 404 real con la
      página nueva; `/api/admin` responde `no-store`, `listar_publico` y
      `estado_login` → 401; tienda y `/admin` sin errores de consola; catálogo
      con 2 rubros, 7 categorías y 19 productos; el bundle publicado no contiene
      `listar_publico` y sí la guardia de URL de Facebook.
      El owner confirmó el login correcto en producción el 16-nov-2026; el
      asistente no usó credenciales reales.
      Verificado el 16-nov-2026: la clave real, guardada en el `.env` local, es
      distinta de la que estaba publicada en la plantilla vieja. `.env` no está
      trackeado, está ignorado por git y no existe en `/Github`; por B-11 no hace
      falta rotarla. La comparación se hizo en memoria, sin imprimir valores.

- [x] **OT#18 - Recuperación de clave del panel por email**.
      Mismo modelo que Icaria: tabla `password_reset_tokens`, dos endpoints
      (`POST /api/auth/forgot-password` y `POST /api/auth/reset-password`), dos
      pantallas (`/recuperar-clave` y `/restablecer-clave`) y enlace "¿Olvidaste
      tu clave?" en el login. Token de 32 bytes (64 hex), un solo uso, 1 hora de
      vigencia, respuesta genérica siempre, honeypot `website_url` y auditoría
      `PASSWORD_RESET_REQUEST` / `PASSWORD_RESET_SUCCESS`. Envío por Resend con
      remitente `noreply@resend.dev`; la clave de API vive en la tabla privada
      `app_secrets` del core (no en `.env` de producción, al que no hay acceso).
      Límites: 3 pedidos/hora por email y 5 intentos/hora por token.
      Evidencia local (17-nov-2026): email desconocido, inválido, vacío y
      honeypot devuelven el mismo 200 con `no-store`; token de 64 hex; clave
      corta → 400 `VALIDACION`; clave válida → 200; reuso y token vencido →
      `TOKEN_INVALIDO`; login con clave vieja → 401 y con la nueva → 200; 4.º
      pedido y 6.º intento → `RATE_LIMIT`; las tres pantallas renderizan con 0
      errores de consola; `tsc` 0; build verde.
      Producción: migración `0001_password_reset.sql` aplicada; secreto de
      Resend guardado en `app_secrets` (verificado con
      `GET https://api.resend.com/domains` → 200); email del administrador
      cambiado a `dedalo.integraciones@gmail.com`
      sin tocar la clave; datos de prueba eliminados (usuario
      `reset-test@example.com`, tokens, límites `reset:*` y auditoría).
      Falta el deploy y el reset real confirmado por el owner.

- [x] **OT#19 - Términos y condiciones, privacidad y cookies**.
      Los documentos identifican al negocio (tenant) como vendedor y responsable;
      Dédalo Integraciones solo desarrolla y comercializa la plataforma y queda
      ajena al contenido del negocio. Datos en `tenant_legal` (tabla aparte para
      que la migración sea idempotente): razón social, jurisdicción, entrega por
      retiro o envío (zonas, demora y costo), plazo y condiciones de cambios,
      medios de pago, condiciones extra y `vende_alcohol` (interruptor por
      negocio). Camino estructurado para lo comercial y texto libre para el resto.
      El panel y el servidor exigen los obligatorios antes de guardar:
      razón social, documento fiscal, dirección completa, email de contacto,
      teléfono, horario, jurisdicción, medios de pago, condiciones de cambios y
      forma de entrega. `fecha_vencimiento` no es editable: ya existía y al vencer
      bloquea tienda y panel; el panel solo la muestra con la nota "Lo administra
      la plataforma". Páginas `/terminos` y `/privacidad` (cookies dentro de
      privacidad, no modales), `LegalShell` con aviso cuando faltan datos y
      "powered by Dédalo" con enlace a
      https://dedalointegraciones.vercel.app/. Se quitaron todos los datos y
      enlaces de Dédalo usados como respaldo en la tienda (dirección, WhatsApp
      del pie, botón flotante y carrito, Facebook, Google Maps y mensaje del
      botón flotante); cada acceso se oculta si el negocio no cargó el dato.
      Carga inicial por CLI: `scripts/cargar-legal-tenant.ts` con plantilla
      `scripts/legal-ejemplo.json`.
      Evidencia local (17-nov-2026): migración `0002_tenant_legal.sql` aplicada
      al core de producción; `/api/tenant/cuadra` y `/api/catalog/cuadra`
      devuelven `legal.completo: false`; `/terminos` y `/privacidad` muestran el
      aviso con 0 errores de consola; pie con los tres enlaces; negocio temporal
      de prueba: `set_parametros` con faltantes → 400 con la lista, con datos
      completos → 200, endpoints públicos → `legal.completo: true`, y un segundo
      guardado incompleto → 400 sin tocar lo ya guardado; validación equivalente
      en el panel; con un negocio temporal con datos completos, `/terminos` y
      `/privacidad` renderizaron todas las secciones con el vendedor, el
      domicilio deduplicado y el aviso de alcohol, sin errores de consola;
      fixture, usuario y auditoría eliminados; `tsc` 0; build verde.
      Falta el deploy y la carga de los datos reales del demo (OT#19b).

## Pendientes

- [ ] **OT#19b - Datos legales reales del demo**.
      El tenant `cuadra` es de prueba y no tiene datos legales. Hasta cargarlos,
      `/terminos` y `/privacidad` muestran "Documentos en preparación". El owner
      enviará razón social, CUIT, domicilio, contacto y condiciones comerciales;
      se cargan con `npm run db:tenant:legal -- cuadra <archivo.json>` o desde el
      panel. Criterio: ambas páginas publican el contenido real.

- [ ] **OT#11 - Procedimiento de alta de negocios**.
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
