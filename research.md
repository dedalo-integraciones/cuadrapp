# RESEARCH — Hallazgos verificados (con evidencia)

## R-TSC — tsconfig sin strict
`tsconfig` no tiene `strict`. Sin `strictNullChecks`, TypeScript no angosta
uniones con `!x.ok`; usar `x.ok === false` o casts. Repro real: el dispatcher
`api/admin/index.ts` no compilaba con `if (!auth.ok)` y se corrigió a
`if (auth.ok === false)`. `vite build` (esbuild) no chequea tipos; por eso
`tsc --noEmit` es gate obligatorio.

## R-EXPRESS — params vs query en local y Vercel
En Vercel, los parámetros dinámicos de ruta llegan mezclados en `req.query`
(por eso los handlers leen `req.query.slug`). En Express local, `req.params`
contiene el valor y `req.query` no. Evidencia: `/api/catalog/cuadra` respondía
`TENANT_NO_ENCONTRADO` en local, mientras `/api/catalog/x?slug=cuadra` sí
devolvía el catálogo. Corrección aplicada en `api/catalog/[slug].ts` y
`api/tenant/[slug].ts`: `req?.params?.slug || req?.query?.slug`. Se usa `||`
(no `??`) porque en Vercel `req.params` puede existir vacío y no debe tapar el
valor de `req.query`. En Vercel el fallback conserva el comportamiento anterior.

## R-LIBSQL — Archivos locales y creación de `data/`
`@libsql/client` con `file:./data/cuadra-core.db` crea el directorio y el
archivo si no existen. El entorno local quedó con `data/cuadra-core.db` y
`data/cuadra-app.db`. Los clientes se crean por request (`getCoreClient` y
`getTenantClient`), sin singleton; no se observaron bloqueos en las pruebas.

## R-XLSX — Lectura del archivo real
`xlsx.readFile` falló en este entorno. El seed usa
`XLSX.read(fs.readFileSync(ruta), { type: "buffer" })` y funciona. El paquete
`xlsx` instalado es la distribución oficial 0.20.2 servida por SheetJS
(`https://cdn.sheetjs.com/xlsx-0.20.2/xlsx-0.20.2.tgz`), no la versión antigua
de npm.

## R-DATOS — Estado real del seed
`Cuadra.xlsx` tiene las solapas `productos` y `rubros`. En el archivo, la
columna `rubro` contiene en realidad nombres de categoría (COMBOS, LOMOS,
HAMBURGUESAS, PIZZAS, EMPANADAS, MENÚ DEL DÍA, BEBIDAS). El seed las agrupó bajo
dos rubros: COMIDAS y BEBIDAS. Resultado verificado: 2 rubros, 7 categorías y 19
productos; 19 productos activos.

## R-API — Evidencia local del 01-nov-2026
Con el servidor local en `http://localhost:3000`:

- `GET /api/health` → 200, `checks.core = ok`, `checks.tenant = ok`.
- `GET /api/catalog/cuadra` → 200, 2 rubros, 7 categorías, 19 productos.
- `GET /api/tenant/cuadra` → 200, nombre `Cuadra Demo`, WhatsApp de pedidos
  `5492617202706`.
- `POST /api/admin` con `verificar` y credenciales válidas → 200; con clave
  incorrecta → 401 `TOKEN_INVALIDO`.
- CRUD de prueba por API: rubro, categoría y producto creados; producto editado
  (precio 999900 centavos, destacado, color), desactivado y luego borrado junto
  con su categoría y rubro. Borrar el rubro con categorías respondió 409
  `REFERENCIA`.
- `POST /api/admin/upload` sin credenciales → 503
  `ALMACENAMIENTO_NO_CONFIGURADO`.
- `POST /api/admin` con email sin membership → 401 `TOKEN_INVALIDO`.
- `GET /admin` → 200 y sirve el HTML de la SPA.

## R-UI — Evidencia de navegador
En el navegador integrado, con la sesión de prueba:

- `/admin` muestra login; al ingresar carga `Cuadra Demo` y las 4 pestañas.
- Productos lista 19 de 19 con precio en pesos, rubro y categoría.
- Categorías muestra 7 con su rubro y cantidad de productos.
- Rubros muestra 2 con cantidad de categorías.
- Configuración muestra los bloques de datos, dirección, redes, textos y estado.
- El modal "Nuevo producto" abre con categorías agrupadas por rubro y cierra con
  Escape.
- La tienda `/?tenant=cuadra` muestra el menú mobile, agrega un producto y el
  carrito muestra el CTA "Enviar Pedido por WhatsApp".
- Consola sin errores en las pantallas recorridas.

## R-VERCEL — Límite de funciones
Plan Hobby: máximo 12 serverless functions (una por archivo en `api/`). Cuadra
tiene 5: `admin/index.ts`, `admin/upload.ts`, `catalog/[slug].ts`,
`tenant/[slug].ts` y `health.ts`. Cualquier módulo nuevo debe evaluar si entra
como acción de un dispatcher existente antes de crear otro archivo.

## R-PRECIOS — Centavos como valor autoritativo
La base guarda `precio_cents` (INTEGER). La API devuelve `precio_cents` y
`precio` (pesos) para comodidad de la UI. Editar un producto con precio
`12345,00` guardó 1234500 centavos y la UI lo mostró como `$ 12.345`. No existe
columna `precio` en la base.

## R-SESION — Token firmado con vencimiento por inactividad
La sesión ya no se identifica con el email. El login devuelve un token
`base64url.firma` firmado con HMAC-SHA256 usando `SESSION_SECRET` (mínimo 32
caracteres). El token incluye `uid`, `email`, `tenant` y `exp`; el navegador lo
guarda en `sessionStorage` bajo `cuadra_admin_sesion_<tenant>` y lo envía como
`sesion` en cada request. El servidor valida firma, negocio y vencimiento, y
devuelve un token renovado en cada acción exitosa (30 minutos desde la última
actividad). Mientras el panel detecta actividad, envía `latido` cada 10 minutos
para mantener vigente el token del servidor. `sessionStorage` se vacía al cerrar
la pestaña o el navegador.

Evidencia local (13-nov-2026), 13/13 pruebas: login 200 con token; token
reutilizado 200; renovación devuelve un token distinto y sirve; `latido` 200 con
token renovado; solo email 401 `SESION_INVALIDA`; token alterado 401
`SESION_INVALIDA`; token vencido 401 `SESION_INACTIVA`; token de otro negocio 401
`SESION_INVALIDA`; `salir` 200; upload sin token 401 y con token válido 400
`VALIDACION` por imagen inválida.
Sin `SESSION_SECRET`, `src/server/session.ts` lanza un error explícito al firmar
o validar.

## R-PROD — Evidencia de producción del 13-nov-2026
Sitio verificado: `https://cuadrapp-orcin.vercel.app` (canonical declarado en
`index.html`). Comprobaciones hechas con peticiones HTTP reales:

- `GET /api/health` → 200; `checks.core = ok`, `checks.tenant = ok`;
  timestamp `2026-11-13T23:27:26.847Z`.
- `GET /api/catalog/cuadra` → 200; 2 rubros, 7 categorías y 19 productos
  (conteo de los arreglos del JSON).
- `GET /admin` → 200; HTML de la SPA de 58.255 bytes.
- `POST /api/admin` con `accion: get_parametros` y sin `sesion` → 401
  `SESION_INVALIDA`. Confirma que el email ya no identifica la sesión.
- `POST /api/admin` con `accion: verificar`, email existente y clave incorrecta
  → 401 `TOKEN_INVALIDO`.
- Bundle `/assets/index-D47w-Mnj.js` (94.769 bytes): contiene `SESION_INACTIVA`,
  `latido` y el aviso de inactividad; no contiene `SESSION_SECRET`. El secreto no
  viaja al navegador.

No verificado por el asistente: login con credenciales válidas en producción (no
se dispone de la clave y no debe exponerse) y cierre por pestaña o navegador en
un navegador real. El owner confirmó el login correcto en `/admin`.

## R-FUSIBLES — Configuración explícita por negocio
- `vite build` de producción aborta si `VITE_TENANT` no es un slug válido.
  Verificado: con `VITE_TENANT` vacío, el build falla con el mensaje "VITE_TENANT
  es obligatorio para compilar producción"; con el valor local, build verde
  (1697 módulos).
- `CLOUDINARY_FOLDER` ya no cae a "cuadra": si falta, la subida responde 503
  `ALMACENAMIENTO_NO_CONFIGURADO`.
- `TENANT_DEFAULT` toma `TENANT_OVERRIDE` cuando es un slug válido y avisa en
  producción si falta.
- `asegurarTenant` crea negocios nuevos sin teléfonos, textos ni marca de
  Cuadra; el nombre por defecto es el slug.
- `create-admin` exige un slug válido y `db:seed` exige `<slug> <archivo.xlsx>`.
  Verificado: ambos abortan antes de tocar la base cuando falta el dato.
- `stage-to-github.bat` excluye cualquier archivo cuyo nombre empiece con
  `.env` (salvo la plantilla `.env.example`), además de `.gitignore` y los
  `.bat` del owner.

## R-AUDIT — Remediación de la auditoría del 16-nov-2026
Se corrigieron los tres paquetes aprobados. El informe completo quedó en
`G:\_ Dev\Cuadra.app\Auditoria 16-11-26.txt`.

- **B-01**: se eliminó la acción `listar_publico` de `api/admin/index.ts` y la
  función `listarPublico` con su interfaz de `src/services/adminService.ts`.
  Verificado: la acción sin token ahora cae en 401 `SESION_INVALIDA`; no quedan
  referencias en el código.
- **B-02**: `vercel.json` agrega `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `X-Frame-Options`, `Cross-Origin-Opener-Policy` y CSP
  para todo el sitio. Se mantiene `style-src 'unsafe-inline'` por el CSS crítico
  que inyecta el build y `script-src 'self'` porque el único script inline es
  JSON-LD. Verificado con un servidor local que aplica la misma cabecera: tienda
  y `/admin` renderizan con 0 errores de consola y sin violaciones de CSP.
- **B-04**: `Cache-Control: no-store` al inicio de los handlers de
  `api/admin/index.ts` y `api/admin/upload.ts`, más reglas para `/api/admin` y
  `/api/admin/(.*)`. No se aplicó `no-store` a todo `/api/*` porque catálogo y
  tenant son públicos y cacheables.
- **B-05**: `rate_limits` usa dos contadores por login, `login:ip:<ip>` y
  `login:email:<email>`, con umbrales 5 y 10 en una ventana de 15 minutos. El
  incremento es un `INSERT ... ON CONFLICT DO UPDATE` atómico con reinicio de
  ventana y bloqueo en la misma sentencia. El login revisa ambos, suma en ambos
  ante un fallo y limpia ambos al entrar. `estado_login` se eliminó: no tenía
  referencias en el cliente. Las filas viejas `login:<ip>` quedan huérfanas y se
  ignoran. Evidencia: 10/10 pruebas contra una base libSQL temporal, incluidos
  ventana vencida, bloqueo vencido, separación IP/email y 20 fallos en paralelo
  con contador exacto.
- **B-06**: si el email no existe, el login compara igual contra `HASH_FICTICIO`
  (bcrypt costo 12 de un valor aleatorio, no una credencial). El tiempo de
  respuesta deja de distinguir emails registrados.
- **B-07**: `urlSegura` acepta solo URLs absolutas http(s), sin credenciales
  embebidas; `validarRed` la aplica a Facebook, Instagram y TikTok al guardar.
  `imagenSegura` rechaza `//host` y `/\host`. La tienda, además, solo pinta el
  enlace de Facebook si empieza con http(s). Verificado con casos
  `javascript:`, `data:`, `//evil.com`, `/\evil.com` y URL con usuario/clave.
- **B-08**: `npm audit fix` sin `--force` y actualización explícita de express a
  4.22.3. Resultado: 0 vulnerabilidades de producción (antes 5: 1 crítica, 1
  alta, 3 moderadas). Quedan 13 avisos, todos en devDependencies
  (`@vercel/node`, `drizzle-kit` y sus cadenas); resolverlos exige un cambio
  mayor y no son alcanzables en las funciones de Vercel.
- **B-09**: `/api/health` guarda el resultado 30 segundos por instancia; un 200
  se cachea 10 segundos en el borde y un 503 responde `no-store` con
  `Retry-After: 30`. Verificado con una base inaccesible: 3 llamadas seguidas
  produjeron 1 sola consulta real.
- **B-03**: decisión del owner: aceptar y documentar, sin lista de revocación.
  El token sigue venciendo a los 30 minutos y `autenticarAdmin` revalida usuario,
  membership y negocio en cada request. Riesgo residual aceptado: un token
  robado sirve hasta su vencimiento y cambiar la clave no corta sesiones
  abiertas. Queda anotado en `src/server/session.ts`.
- **B-11**: `ADMIN_PASSWORD` quedó vacío en `.env.example`, con comentarios que
  explican el mínimo y que no debe haber una clave usable en el repo. No se
  puede confirmar si la clave de producción era la de ejemplo; si el owner no
  puede asegurar que es distinta, conviene rotarla con `npm run db:admin`.
- **B-10**: sin cambios de código. `/api/diag` fue eliminado antes de esta
  auditoría y hoy responde 404; la regla que queda es no volver a publicar
  diagnósticos públicos.
- **I-01**: el rewrite de `vercel.json` ya no captura cualquier ruta; solo
  `/admin` y `/admin/(.*)`. Se agregó `public/404.html` sin JavaScript ni
  recursos externos. Verificado con las cabeceras nuevas: `/` y `/admin` → 200;
  `/ruta-inexistente`, `/.env` y `/.git/config` → 404 real; 0 errores de consola
  en tienda y panel (el 404 del documento es el esperado).

Verificación de cierre: `tsc --noEmit` en 0, build verde y `npm audit
--omit=dev` en 0. Pendiente de producción: comprobar cabeceras, 404 y health
después del deploy.

## R-AUDIT-PROD — Verificación en producción del 16-nov-2026
Sitio: `https://cuadrapp-orcin.vercel.app`. Comprobaciones con HTTP real y el
navegador integrado, sin usar credenciales.

- Cabeceras presentes en `/`, `/admin` y las respuestas 404:
  `Content-Security-Policy`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: camera=(), microphone=(), geolocation=()`,
  `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy: same-origin` y HSTS con
  preload.
- `GET /api/health` → 200; `core = ok`, `tenant = ok`;
  `Cache-Control: public, max-age=10`; segunda llamada inmediata con
  `x-vercel-cache: HIT` y `age: 8`, mismo `timestamp`. El caché de borde y el de
  30 segundos por instancia funcionan.
- `GET /.env`, `GET /.git/config` y `GET /ruta-inexistente` → 404 real, con la
  página nueva y las cabeceras de seguridad. Ya no devuelven el HTML del SPA con
  200.
- `POST /api/admin` vacío → 400 `VALIDACION` con `Cache-Control: no-store`;
  `listar_publico` → 401 `SESION_INVALIDA`; `estado_login` → 401
  `SESION_INVALIDA`; `GET /api/admin` y `GET /api/admin/upload` → 405 con
  `no-store`.
- Login con email inexistente y clave falsa → 401 `TOKEN_INVALIDO` con
  `no-store`. Primer intento 8,6 s (arranque en frío), segundo 0,9 s. No se
  probaron credenciales reales ni se agotó el límite de intentos.
- Navegador: tienda y `/admin` renderizan con 0 errores de consola y 0 avisos de
  CSP. La página 404 renderiza y el único error de consola es el 404 esperado del
  documento.
- Bundle publicado `/assets/index-CRrgEvEc.js` (94.797 bytes): contiene
  `SESION_INACTIVA` y `latido`, no contiene `listar_publico` y sí la guardia
  `/^https?:\/\//i` para el enlace de Facebook.
- `GET /api/catalog/cuadra` → 200 con 2 rubros, 7 categorías y 19 productos;
  `GET /api/tenant/cuadra` → 200 con `id: cuadra`.

El owner confirmó el login correcto en producción el 16-nov-2026. El asistente
no usó credenciales reales: solo probó un email inexistente con clave falsa.

Sobre B-11: el owner indicó que la clave de login es la misma que está en el
`.env` local. La comparación se hizo en memoria y sin imprimir valores: esa clave
es distinta de la que estaba publicada en la plantilla vieja. `.env` no está
trackeado, está ignorado por git y no existe en `/Github`. Por lo tanto, la
ventana de la clave pública quedó cerrada y no hace falta rotarla por B-11. El
`.env` sigue siendo un archivo local en texto plano: conviene mantener la máquina
protegida y no copiarlo nunca al repositorio.

## R-RESET - Recuperación de clave por email (17-nov-2026)

Se copió el modelo de Icaria, sin tocarlo: tabla de tokens, dos endpoints, dos
pantallas y envío por Resend.

- Tablas (`migrations/platform/0001_password_reset.sql`):
  `password_reset_tokens` (token único de 64 hex, `expires_at`, `used`) y
  `app_secrets` (secreto de servidor). Ambas creadas en el core de producción.
- `POST /api/auth/forgot-password`: normaliza el email, aplica honeypot
  `website_url`, limita a 3 pedidos por email por hora y responde siempre el
  mismo 200 (`{ ok, mensaje }`) aunque el email no exista, sea inválido o falte.
- `POST /api/auth/reset-password`: valida la clave (8 a 72), consume el token en
  una transacción (`used = 1`), responde `TOKEN_INVALIDO` para token falso,
  vencido o reusado, y limita a 5 intentos por token por hora.
- Respuestas con `Cache-Control: no-store` en ambos endpoints, también por
  `vercel.json` para `/api/auth` y `/api/auth/(.*)`.
- El enlace se arma con `APP_DOMAIN` si existe; si no, con
  `x-forwarded-host`/`host`, validado con una expresión de host. En producción
  usa el dominio del deployment.
- Correo: Resend, remitente `noreply@resend.dev` (la cuenta no tiene dominio
  verificado y solo entrega al buzón dueño de la cuenta, que es
  `dedalo.integraciones@gmail.com`). La API key se lee de `app_secrets`; no se
  pudo usar una variable de Vercel porque no hay acceso al panel.
- Email del administrador: `admin@cuadra.app` → `dedalo.integraciones@gmail.com`
  con `npm run db:admin:email`, sin tocar la clave ni el membership. La tabla
  `users` quedó con un solo usuario.

Evidencia local (17-nov-2026, `npx tsx server.ts` en el puerto 3100):

- Email desconocido, inválido, vacío y honeypot → 200 con el mensaje genérico y
  `no-store`.
- Token de 64 hex; clave corta → 400 `VALIDACION`; clave válida → 200; reuso →
  `TOKEN_INVALIDO`; token vencido a mano → `TOKEN_INVALIDO`.
- Login con la clave vieja → 401; con la nueva → 200 con sesión.
- Rate-limit: 4.º pedido por email y 6.º intento por token → `RATE_LIMIT`.
- `/recuperar-clave`, `/restablecer-clave` y `/admin` renderizan con 0 errores de
  consola; `tsc --noEmit` 0; build verde.

Evidencia de producción: migración aplicada en Turso; `app_secrets` con
`RESEND_API_KEY` (36 caracteres, formato `re_...`, valor no mostrado) y
`GET https://api.resend.com/domains` → 200; `users` con
`dedalo.integraciones@gmail.com` como único administrador. Se eliminó el usuario
temporal `reset-test@example.com`, sus 3 tokens, los 6 límites `reset:*` y las 6
filas de auditoría de prueba.

Incidente del `.env` local: al actualizar el archivo se sobrescribió por error y
se reconstruyó con los cuatro valores de `inicio\Cuadra tokens.txt` (Turso), la
cuenta de Cloudinary de Icaria y un `SESSION_SECRET` nuevo. `ADMIN_PASSWORD` no
se pudo recuperar y se dejó fuera: solo lo usan los scripts de alta, que fallan
con un mensaje claro si falta. La conexión core respondió correcta después de la
reconstrucción (1 usuario, 1 tenant, 1 secreto), lo que valida los tokens Turso;
Cloudinary respondió 200 a una consulta de recursos con las credenciales
reconstruidas (sin subir ninguna imagen). Durante la reconstrucción, algunos
valores quedaron visibles en la sesión local de OpenCode: si esa sesión se
comparte o se exporta, conviene rotar el token de Turso y la clave de Resend
(esta última es compartida con Icaria).

## R-LEGAL - Términos, privacidad y datos del tenant (17-nov-2026)

Los documentos legales se generan con los datos del negocio, no con datos de
Dédalo. Dédalo Integraciones figura solo como desarrollador y comercializador de
la plataforma, ajeno a la relación comercial.

- **Tabla aparte** (`migrations/platform/0002_tenant_legal.sql`): 13 columnas más
  `actualizado_en`, con `tenant_id` como PK y FK a `tenants`. No se agregaron
  columnas a `tenants` porque `ALTER TABLE` no es idempotente y `migrarCore` corre
  todos los `.sql` en cada ejecución. Sin fila, el negocio se considera con datos
  incompletos.
- **Obligatorios** (`faltantesLegal`, compartido por API y panel): razón social,
  documento fiscal, dirección completa (línea 1, localidad, provincia, país),
  email de contacto, teléfono, horario, jurisdicción, medios de pago, condiciones
  de cambios y al menos una forma de entrega. Si hay envío, exige zonas, demora y
  costo. Si no hay fila o faltan campos, `legal.completo` es `false`.
- **Valores comerciales estructurados** (`entrega_retiro`, `entrega_envio`,
  `entrega_zonas`, `entrega_demora`, `envio_costo_cents`, `cambios_plazo_dias`,
  `medios_pago`, `vende_alcohol`) y **texto libre** para condiciones de cambios,
  condiciones extra y razón social. Los precios se guardan en centavos.
- **`vende_alcohol`** es un interruptor por negocio: agrega el bloque de edad
  mínima y venta responsable en los términos.
- **`fecha_vencimiento`** no se expone como editable. Ya existía y
  `tenantVigente` bloquea tienda y panel al vencer; el panel la muestra con la
  nota "Lo administra la plataforma".
- **API pública**: `GET /api/tenant/:slug` y `GET /api/catalog/:slug` incluyen
  `tenant.legal` con `completo`; nunca exponen `turso_db` ni tokens.
- **Páginas**: `/terminos` y `/privacidad` (cookies dentro de privacidad) con
  `LegalShell`, que muestra "Documentos en preparación" cuando `completo` es
  `false` en vez de publicar contenido inventado. El pie de la tienda enlaza
  ambas páginas y "powered by Dédalo".
- **Sin respaldos de Dédalo**: se quitaron todos los datos y enlaces de Dédalo
  usados como respaldo en la tienda: dirección y enlace de Google Maps, WhatsApp
  del pie, del botón flotante y del carrito, enlace de Facebook y mensaje del
  botón flotante. Cada acceso se oculta si el negocio no cargó el dato.
- **Carga inicial**: `npm run db:tenant:legal -- <slug> <archivo.json>` con la
  plantilla `scripts/legal-ejemplo.json`; la usa Dédalo al vender la suscripción.
  El archivo no se versiona con datos reales.

Evidencia local (17-nov-2026, puerto 3100):

- `GET /api/tenant/cuadra` y `/api/catalog/cuadra` → 200 con
  `legal.completo: false` y las 15 claves esperadas.
- `/terminos` y `/privacidad` → aviso controlado, enlaces del pie correctos y 0
  errores de consola.
- Negocio y usuario temporales creados por script: `set_parametros` sin datos
  legales → 400 `VALIDACION` con la lista de faltantes; con datos completos →
  200 y `legal_faltantes` vacío; endpoints públicos → `legal.completo: true` con
  los valores guardados; segundo guardado incompleto → 400 sin modificar lo
  anterior. El panel bloquea antes de enviar con el mismo criterio.
- Fixture eliminado: tenant, usuario, membership, fila legal y 5 registros de
  auditoría. El core quedó con 1 tenant (`cuadra`), 1 usuario
  (`dedalo.integraciones@gmail.com`) y sin filas en `tenant_legal`.
- Negocio temporal con datos completos: `/terminos` y `/privacidad` renderizaron
  todas las secciones (incluido el bloque de alcohol), con razón social, CUIT,
  domicilio sin repetir ciudad y provincia, y 0 errores de consola. Fixture
  eliminado.
- `tsc --noEmit` 0; `vite build` verde.

Pendiente: el tenant `cuadra` es de prueba y no tiene datos legales reales; el
owner los enviará. Falta el deploy.

## R-LEGAL-2 - Ajustes tras la prueba en vivo (19-nov-2026)

La prueba del panel en producción mostró campos que no aplican al nicho de
comidas y un guardado demasiado estricto. Se ajustó así:

- **Costo de envío en texto**: `migrations/platform/0003_tenant_legal_envio.sql`
  crea `tenant_legal_envio.envio_costo` (TEXT). Se elige tabla aparte por la misma
  razón de idempotencia; `tenant_legal.envio_costo_cents` queda como legado y no
  se escribe. El costo se publica tal cual en los términos, por lo que admite
  "A Convenir", "sin cargo" o un importe.
- **Campos retirados**: jurisdicción, plazo de cambios y condiciones de cambios
  salen del panel, de `faltantesLegal`, de la API pública y de `/terminos`. Las
  columnas siguen en `tenant_legal` sin uso para no requerir un `ALTER`.
- **Cláusula fija para alimentos**: los términos ya no piden un texto de cambios.
  Indican que no se aceptan cambios ni devoluciones una vez entregado el pedido,
  salvo error del negocio (reposición o reintegro). Queda sujeta a revisión legal
  del owner.
- **Validación parcial**: `set_parametros` ya no responde 400 por legales
  incompletos. Escribe todos los campos válidos, conserva el valor anterior ante
  un email o enlace inválido (y lo informa) y devuelve `legal_faltantes`. El
  panel muestra un recuadro con pendientes y, al guardar, una modal de éxito con
  esa lista; el error de red queda debajo del botón.
- **UI**: se oculta la versión en Estado del servicio. Documento fiscal, teléfono
  y WhatsApp general/pedidos muestran el tooltip "Solo números, sin signos ni
  espacios" (`Campo.tooltip` en `ui.tsx`).
- **Alcance Latam**: los precios se publican "en la moneda de curso legal del
  domicilio del negocio" y la ley aplicable remite a la legislación de ese
  domicilio. Los documentos usan español neutro (usted), sin voseo ni referencias
  a leyes o autoridades de un país específico.

Evidencia local (19-nov-2026, puerto 3100): migración aplicada al core de
producción; negocio temporal con primer guardado incompleto → 200, lista de
pendientes y escritura efectiva de razón social, nombre y costo "A convenir";
segundo guardado completo → sin pendientes; email inválido → 200 con aviso y
email anterior conservado; `get_parametros` devuelve `envio_costo` y ya no
expone los campos retirados. Fixture y auditoría eliminados; core con 1 tenant y
1 usuario; `tsc --noEmit` 0.

Pendiente: deploy del owner desde `/Github` y datos legales reales del demo.
