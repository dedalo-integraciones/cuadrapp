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
