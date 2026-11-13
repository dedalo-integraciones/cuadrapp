# SPEC — Contrato de datos

Dos bases libSQL/Turso. Esquema en español. No existen tablas `products`,
`parametros`, `orders` ni `clients` en esta versión. Cualquier referencia a esos
nombres es un error.

- **Core (plataforma)**: una por instalación. Local:
  `file:./data/cuadra-core.db`. Variable: `TURSO_CORE_URL`.
- **Tenant (negocio)**: una base física por negocio. La URL se guarda en
  `tenants.turso_db`. Local: `file:./data/cuadra-app.db`. Variable de token:
  `TURSO_APP_TOKEN`.

`turso_db` nunca se expone en respuestas públicas ni en el panel.

## Base core

### `tenants`

- `id` TEXT PK — slug del negocio (ej. `cuadra`). No existe columna `slug`.
- `name` TEXT NOT NULL — nombre comercial.
- `mode` TEXT NOT NULL DEFAULT `pedidos` — versión comercial. En esta v1 el
  valor operativo es `pedidos`.
- `flags` TEXT NOT NULL DEFAULT `{}` — reservado.
- `brand` TEXT NOT NULL DEFAULT `{}` — JSON de redes: `facebook`, `instagram`,
  `tiktok`.
- `turso_db` TEXT NOT NULL — URL de la base del negocio. Secreto de
  infraestructura.
- `status` TEXT NOT NULL DEFAULT `activo` — `activo` o `suspendido`.
- `documento_fiscal`, `telefono`, `whatsapp`, `whatsapp_pedidos`,
  `email_contacto`, `email_pedidos`, `horario_atencion` TEXT.
- `direccion_linea1`, `direccion_linea2`, `localidad`, `provincia_estado`,
  `codigo_postal`, `pais` TEXT.
- `moneda_simbolo` TEXT DEFAULT `$`.
- `max_registros` INTEGER DEFAULT 150 — tope de productos del negocio.
- `fecha_vencimiento` TEXT — fecha ISO `AAAA-MM-DD` o NULL.
- `max_admins` INTEGER DEFAULT 3.
- `mostrar_precios` INTEGER NOT NULL DEFAULT 1.
- `pasarela_pagos` INTEGER NOT NULL DEFAULT 0 — reservado; la v1 no cobra.
- `gestion_entrega` INTEGER NOT NULL DEFAULT 0 — reservado.
- `texto_atencion`, `texto_hero`, `texto_hero_bajada`, `texto_footer` TEXT —
  vacío significa texto original de la tienda.
- `created_at` TEXT NOT NULL DEFAULT `datetime('now')`.

### `users`

- `id` INTEGER PK AUTOINCREMENT.
- `email` TEXT NOT NULL UNIQUE — se normaliza a minúsculas.
- `password_hash` TEXT NOT NULL — bcryptjs.
- `name` TEXT NOT NULL.
- `is_superadmin` INTEGER NOT NULL DEFAULT 0 — reservado; no hay UI de
  superadmin en v1.
- `created_at` TEXT NOT NULL DEFAULT `datetime('now')`.

### `memberships`

- `id` INTEGER PK AUTOINCREMENT.
- `user_id` INTEGER NOT NULL → `users.id` ON DELETE CASCADE.
- `tenant_id` TEXT NOT NULL → `tenants.id` ON DELETE CASCADE.
- `role` TEXT NOT NULL DEFAULT `admin`.
- `created_at` TEXT NOT NULL DEFAULT `datetime('now')`.
- Índice único `(user_id, tenant_id)`.

Un usuario solo opera un negocio si tiene membership. El login sin membership
responde 403 `SIN_PERMISO`; una sesión sin token válido responde 401
`SESION_INVALIDA` o `SESION_INACTIVA`.

### `rate_limits`

- `clave` TEXT PK — en la práctica, IP del cliente.
- `intentos` INTEGER NOT NULL DEFAULT 0.
- `ventana_inicio` INTEGER NOT NULL — epoch en milisegundos.
- `bloqueado_hasta` INTEGER — epoch en milisegundos o NULL.

Ventana: 5 intentos por IP cada 15 minutos.

### `audit_log`

- `id` INTEGER PK AUTOINCREMENT.
- `tenant_id` TEXT.
- `user_id` INTEGER.
- `accion` TEXT NOT NULL — por ejemplo `LOGIN_OK`, `LOGIN_FALLIDO`,
  `PRODUCTO_CREADO`, `PARAMETROS_ACTUALIZADOS`.
- `detalle` TEXT NOT NULL DEFAULT `{}` — JSON con contexto.
- `created_at` TEXT NOT NULL DEFAULT `datetime('now')`.
- Índice `(tenant_id, created_at)`.

## Base por negocio

### `rubros`

- `id` INTEGER PK AUTOINCREMENT.
- `rubro` TEXT NOT NULL.
- `descripcion` TEXT.
- `orden` INTEGER NOT NULL DEFAULT 0.
- `color` TEXT — hexadecimal `#RRGGBB`.
- `activo` INTEGER NOT NULL DEFAULT 1 — 1 visible, 0 oculto.
- `created_at`, `updated_at` TEXT NOT NULL.

### `categorias`

- `id` INTEGER PK AUTOINCREMENT.
- `id_rubro` INTEGER NOT NULL → `rubros.id` ON DELETE RESTRICT.
- `categoria` TEXT NOT NULL.
- `descripcion` TEXT.
- `orden` INTEGER NOT NULL DEFAULT 0.
- `color` TEXT.
- `activo` INTEGER NOT NULL DEFAULT 1.
- `created_at`, `updated_at` TEXT NOT NULL.
- Índice `(id_rubro, orden)`.

### `productos`

- `id` INTEGER PK AUTOINCREMENT.
- `id_categoria` INTEGER NOT NULL → `categorias.id` ON DELETE RESTRICT.
- `nombre` TEXT NOT NULL.
- `detalle_1`, `detalle_2` TEXT.
- `precio_cents` INTEGER NOT NULL DEFAULT 0 — **valor autoritativo**. No
  existe columna `precio`.
- `color` TEXT.
- `activo` INTEGER NOT NULL DEFAULT 1.
- `destacado` INTEGER NOT NULL DEFAULT 0.
- `popular` INTEGER NOT NULL DEFAULT 0.
- `orden` INTEGER NOT NULL DEFAULT 0.
- `imagen` TEXT — URL http(s) o ruta interna; NULL si no tiene.
- `created_at`, `updated_at` TEXT NOT NULL.
- Índices `(id_categoria, orden)` y `(activo, orden)`.

### `settings`

- `key` TEXT PK.
- `value` TEXT NOT NULL.

Reservada. La configuración del negocio vive en `tenants`, no acá.

## Lo que NO existe (v1)

- `orders`, `order_items`, `clients`, `shipping_zones`, `shipping_rates`.
- Persistencia de carrito, pedidos, clientes, pagos o estados de pago.
- Columnas `precio`, `precio_pesos`, `slug` en `tenants`.
- Tabla `parametros`.

El pedido se arma en el navegador y se envía por WhatsApp. Ver
`spec/pedidos-whatsapp.md`.

## Jerarquía y reglas

- `rubro` → `categoria` → `producto`. Un producto pertenece a una categoría; la
  categoría define su rubro.
- El orden visible es `rubros.orden`, luego `categorias.orden`, luego
  `productos.orden`; los empates se resuelven por `id`.
- Borrar un rubro con categorías devuelve 409 `REFERENCIA`. Borrar una categoría
  con productos devuelve 409 `REFERENCIA`. Borrar un producto es físico y
  permanente.
- `activo` es INTEGER 1/0 en DB y booleano en la API. La tienda solo muestra
  rubros, categorías y productos activos.
- Un rubro o categoría inactivo oculta a sus descendientes en la tienda.

## Respuestas de la API

### `GET /api/catalog/:slug`

```json
{
  "ok": true,
  "tenant": {
    "id": "cuadra",
    "name": "Cuadra Demo",
    "mode": "pedidos",
    "brand": {},
    "whatsapp": "5492617202706",
    "whatsapp_pedidos": "5492617202706",
    "telefono": "5492617202706",
    "email_contacto": "",
    "email_pedidos": "",
    "horario_atencion": "",
    "direccion": {
      "linea1": null,
      "linea2": null,
      "localidad": null,
      "provincia": null,
      "codigo_postal": null,
      "pais": null
    },
    "moneda_simbolo": "$",
    "mostrar_precios": true,
    "textos": {
      "atencion": null,
      "hero": null,
      "hero_bajada": null,
      "footer": null
    }
  },
  "rubros": [],
  "categorias": [],
  "productos": [],
  "generado_en": "2026-11-01T00:00:00.000Z"
}
```

Cada producto incluye `precio_cents`, `precio` (pesos), `id_rubro`, `categoria`,
`rubro`, `color`, `destacado`, `popular`, `orden` e `imagen`.

### `GET /api/tenant/:slug`

Devuelve `{ ok, tenant }` con la misma forma pública, sin catálogo.

### `GET /api/health`

```json
{
  "ok": true,
  "servicio": "cuadra",
  "version": "1.0.0",
  "checks": { "core": "ok", "tenant": "ok" },
  "timestamp": "2026-11-01T00:00:00.000Z"
}
```

Si el core falla, `checks.core = error`. Si no hay tenant por defecto,
`checks.tenant = sin_tenant`. Responde 503 cuando la cadena no está sana.

## Resolución del tenant

Orden: `?tenant=` / `body.tenant` / header `x-tenant`, luego
`TENANT_OVERRIDE`, luego `cuadra`. En el cliente: `?tenant=`, luego
`VITE_TENANT`, luego `cuadra`. El slug debe cumplir
`^[a-z0-9][a-z0-9-]{1,48}$`.

## Convenciones

- Precios siempre en centavos en DB y API; pesos con dos decimales solo en UI.
- Fechas de texto en UTC (`datetime('now')` de SQLite).
- Booleanos en DB como INTEGER 1/0; en JSON como `true`/`false`.
- Migraciones idempotentes con `CREATE TABLE IF NOT EXISTS`.
