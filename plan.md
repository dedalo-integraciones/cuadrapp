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
- **Fase 4 — Autenticación**: email + clave con bcryptjs, token de sesión firmado
  (HMAC-SHA256) en `sessionStorage`, vencimiento de 30 minutos sin actividad y
  renovación en cada acción, revalidación de membership en cada request,
  rate-limit de login (5 intentos por IP y 10 por email cada 15 minutos, con
  incremento atómico) y auditoría en `audit_log`.
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
- **Fase 8 — Sesión con inactividad y fusibles**: token firmado con vencimiento
  de 30 minutos, cierre al cerrar pestaña o navegador y aviso de inactividad.
  `VITE_TENANT` y `CLOUDINARY_FOLDER` son obligatorios; los defaults de negocio
  son neutros; el seed exige archivo `.xlsx` y el staging excluye `.env*` salvo
  `.env.example`.
- **Fase 9 — Remediación de la auditoría de seguridad (16-nov-2026)**: se
  quitaron la acción pública `listar_publico` y su función cliente; cabeceras de
  seguridad y CSP; `no-store` en `/api/admin*`; doble límite de login por IP y
  email con incremento atómico; comparación bcrypt contra hash ficticio;
  dependencias de producción sin avisos; URLs de redes e imágenes validadas;
  caché de 30 segundos en `/api/health`; `ADMIN_PASSWORD` vacío en
  `.env.example`; rewrite limitado a `/admin*` con 404 real. Revocación de
  sesión: aceptada y documentada, sin lista (ventana máxima de 30 minutos).
- **Verificación local**: `tsc --noEmit` en 0, `vite build` en verde, CRUD de
  prueba creado/editado/desactivado/borrado por API, login válido e inválido,
  rechazo de borrado con hijos, `/admin` servido por la SPA y flujo de tienda
  → carrito → CTA de WhatsApp sin errores de consola.
- **Fase 10 — Recuperación de clave por email (17-nov-2026)**: mismo modelo que
  Icaria (tabla de tokens, dos endpoints, dos pantallas). Token de un solo uso de
  1 hora, respuesta genérica, honeypot, límites de 3 pedidos y 5 intentos por
  hora y auditoría. Envío por Resend con la clave en `app_secrets`; el email del
  administrador pasa a `dedalo.integraciones@gmail.com`. Falta el deploy y el
  reset real confirmado por el owner.
- **Fase 11 — Términos, privacidad y cookies desde el tenant (17-nov-2026)**:
  tabla `tenant_legal` con los datos comerciales del negocio (razón social,
  entrega, medios de pago, alcohol) y validación de obligatorios en panel y
  servidor. Páginas `/terminos` y `/privacidad` que identifican al tenant como
  vendedor y a Dédalo Integraciones como proveedor de la plataforma; si faltan
  datos, aviso "Documentos en preparación" sin contenido inventado. Pie con los
  enlaces y "powered by Dédalo". `fecha_vencimiento` no es editable por el
  negocio: al vencer bloquea tienda y panel. Carga inicial por CLI
  (`npm run db:tenant:legal`). Ajustes del 19-nov-2026: costo de envío como texto
  (`tenant_legal_envio`), sin jurisdicción ni campos de cambios, cláusula fija
  para alimentos, guardado parcial con pendientes, modal de éxito y tooltips de
  formato. Evidencia local: guardado parcial y completo, costo de texto, email
  inválido conservado, endpoints públicos con `legal.completo`, `tsc` 0 y build
  verde. Disponible en producción desde el 19-nov-2026; el demo `cuadra` usa
  datos de ejemplo y no requiere datos reales (OT#19b cerrado).

## Pendiente real (cada uno con su OT)

1. **OT#20 — Dominio propio y correo**: no hay dominio todavía. Resend no tiene
   dominios verificados y solo entrega al buzón dueño de la cuenta; al comprar el
   dominio hay que verificarlo, guardar `RESEND_FROM_EMAIL` y actualizar
   `APP_DOMAIN`, canonical y Open Graph.
2. **OT#11 — Alta de negocios**: definir el procedimiento operativo para crear un
   tenant, su base, su administrador y su catálogo inicial. Hoy existe por
   scripts, sin UI de superadmin.
3. **OT#12 — Respaldos**: definir copia de seguridad de la base core y de cada
   base de negocio antes de operar con clientes reales.
4. **OT#13 — Exportaciones** (si se aprueban): implementar solo `.xlsx` con
   SheetJS e import dinámico, respetando filtros visibles, y actualizar manual y
   specs.

## Fase futura (evaluar con uso real)

- White-label visual por negocio (logo, colores, favicon, imagen de portada).
- Analítica de productos vistos y pedidos iniciados, sin persistir datos
  personales.
- Versionado de catálogo por temporada (carta de verano/invierno).
- Multi-tenant operativo (varios negocios en un deployment, metadata por negocio
  y alta desde el panel): diferido hasta que el proyecto escale. Hoy se opera un
  negocio por deployment (decisión 19-nov-2026).

## Decisión vigente

- La v1 no persiste pedidos ni clientes. El pedido vive en el navegador y se
  envía por WhatsApp. Cualquier módulo de órdenes, pagos o logística requiere
  una OT nueva y un cambio explícito del contrato de datos.
- No hay panel de superadmin: la escala es un repositorio y un deployment por
  cliente. El multi-tenant queda diferido hasta que el proyecto escale.
