# Cuadra

Carta digital con carrito y pedidos por WhatsApp. Tienda pública mobile-first y
panel de administración responsivo en `/admin`.

Stack: Vite 6, React 19, TypeScript, Tailwind 4, `@libsql/client`, Drizzle,
funciones serverless con contrato `@vercel/node`, Turso/libSQL y Cloudinary
opcional para imágenes.

## Puesta en marcha local

Requisitos: Node.js 20 o superior.

```bash
npm install
copy .env.example .env
npm run db:migrate
npm run db:seed
npm run db:admin
npm run dev
```

- Tienda: `http://localhost:3000/?tenant=cuadra`
- Panel: `http://localhost:3000/admin`

El servidor local usa `tsx server.ts` y levanta Vite en modo middleware. El
puerto es 3000.

## Variables de entorno

| Variable | Uso |
|---|---|
| `TURSO_CORE_URL` | Base de plataforma. Local: `file:./data/cuadra-core.db`. |
| `TURSO_CORE_TOKEN` | Token de Turso para la base core. Vacío en local. |
| `TURSO_APP_URL` | Base por defecto para migrar/sembrar un tenant. |
| `TURSO_APP_TOKEN` | Token de Turso para las bases de negocio. Vacío en local. |
| `TENANT_OVERRIDE` | Slug del negocio por defecto (`cuadra`). |
| `ADMIN_EMAIL` | Email del administrador inicial. |
| `ADMIN_PASSWORD` | Clave del administrador inicial. |
| `ADMIN_NAME` | Nombre visible del administrador inicial. |
| `CLOUDINARY_CLOUD_NAME` | Opcional: subida de imágenes. |
| `CLOUDINARY_API_KEY` | Opcional: subida de imágenes. |
| `CLOUDINARY_API_SECRET` | Opcional: subida de imágenes. |
| `CLOUDINARY_FOLDER` | Opcional: carpeta destino en Cloudinary. |

No commitear `.env`.

## Scripts

| Comando | Función |
|---|---|
| `npm run dev` | Servidor local con API y Vite. |
| `npm run build` | Build de producción en `dist/`. |
| `npm run start` | Servidor local en modo producción. |
| `npm run lint` | `tsc --noEmit`. |
| `npm run db:migrate` | Migra core y tenant. |
| `npm run db:seed` | Carga `Cuadra.xlsx` en la base del tenant. |
| `npm run db:admin` | Crea o actualiza el administrador inicial. |
| `npm run db:tenant -- <slug> ["Nombre"] ["libsql://..."]` | Alta de negocio. |

## Arquitectura

- **Base core** (`data/cuadra-core.db` en local): `tenants`, `users`,
  `memberships`, `rate_limits`, `audit_log`.
- **Base por negocio** (`data/cuadra-app.db` en local): `rubros`, `categorias`,
  `productos`, `settings`.
- Jerarquía: rubro → categoría → producto.
- Precios en centavos (`precio_cents`) en DB y API; pesos en la UI.
- Pedidos: no se persisten. El carrito arma un mensaje y abre `wa.me`.
- Multi-tenant: el slug se resuelve por `?tenant=`, `body.tenant`, header
  `x-tenant`, `TENANT_OVERRIDE` o `cuadra`.

Documentación de datos: [`spec/contrato-datos.md`](spec/contrato-datos.md).

## API

| Endpoint | Método | Función |
|---|---|---|
| `/api/health` | GET | Salud de core y tenant. |
| `/api/catalog/:slug` | GET | Catálogo público del negocio. |
| `/api/tenant/:slug` | GET | Datos públicos del negocio. |
| `/api/admin` | POST | Dispatcher del panel (login, resumen, CRUD). |
| `/api/admin/upload` | POST | Subida firmada a Cloudinary. |

El panel usa `accion` en el cuerpo. Acciones: `verificar`, `get_parametros`,
`set_parametros`, `resumen`, `listar_*`, `crear_*`, `actualizar_*`, `borrar_*`.
Ver [`spec/panel-admin.md`](spec/panel-admin.md).

## Panel

Ruta `/admin`. Login con email y clave. La sesión se guarda en
`sessionStorage` y se revalida contra la membership en cada request.

Pestañas: Productos, Categorías, Rubros, Configuración. Incluye buscador,
filtros, activación lógica, borrado con doble confirmación, imágenes y textos de
la tienda.

## Turso en producción

1. Crear una base core y una base por negocio en Turso.
2. Cargar las cuatro variables `TURSO_*` en Vercel.
3. Ejecutar las migraciones y el seed contra esas bases.
4. Verificar `GET /api/health` y `GET /api/catalog/cuadra`.

Mientras no existan las bases de Turso, el proyecto funciona con libSQL local.

## Deploy

`vercel.json` usa framework Vite, build `npm run build`, salida `dist/` y rewrite
de SPA que excluye `/api`. Límite del plan Hobby: 12 funciones; hoy hay 5.

## Documentación

- [`AGENTS.md`](AGENTS.md) — reglas de trabajo y estructura.
- [`plan.md`](plan.md) — fases y próximos pasos.
- [`research.md`](research.md) — hallazgos verificados.
- [`tasks.md`](tasks.md) — ledger de OTs.
- [`manual-usuario.md`](manual-usuario.md) — manual del panel y la tienda.
- [`spec/panel-admin.md`](spec/panel-admin.md) — panel.
- [`spec/pedidos-whatsapp.md`](spec/pedidos-whatsapp.md) — pedidos.
- `manual.md` es el manual legado de Google Sheets; no está vigente.
