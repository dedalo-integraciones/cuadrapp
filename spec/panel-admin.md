# SPEC — Panel de administración (`/admin`)

## Acceso

- Ruta única `/admin` (sin subrutas). `src/main.tsx` detecta
  `/^\/admin(?:\/.*)?$/` y renderiza `AdminPanel`; el resto de rutas renderiza
  la tienda.
- Login con email + clave contra `POST /api/admin` con
  `accion: "verificar"`. El backend valida formato de email (máximo 254),
  clave entre 8 y 72 caracteres, bcrypt y membership.
- Sin JWT. La sesión se guarda en `sessionStorage` bajo
  `cuadra_admin_sesion_<tenant>` con `{ email, nombre }`. Cada request del panel
  envía `email` y `tenant`, y el backend revalida membership.
- Al montar, el panel relee la sesión y llama `get_parametros` para validarla.
  Si la respuesta es 401, borra la sesión. Si es un error de red, conserva la
  sesión y muestra el aviso de carga.
- Logout borra la clave de `sessionStorage` y limpia el estado del panel.
- Rate-limit de login: 5 intentos por IP cada 15 minutos. El mensaje indica los
  minutos restantes.
- Honeypot: campo oculto `sitio_web`; si viene completo, el backend responde
  error genérico sin gastar rate-limit.

## Estructura de la pantalla

- **Login**: logo, identificación del negocio, email, clave con botón de
  mostrar/ocultar, error en línea, botón "Ingresar al panel" y enlace "Volver a
  la tienda".
- **Encabezado del panel**: logo, nombre comercial, sesión, enlace "Ver tienda"
  (abre `/?tenant=<slug>` en otra solapa) y botón "Salir".
- **Navegación**: 4 pestañas — Productos, Categorías, Rubros, Configuración.
  En mobile son botones desplazables; en escritorio se ven todos.
- **Resumen**: 4 tarjetas — Productos, Activos, Categorías, Rubros.
- El panel es responsivo (mobile, tablet y escritorio). La tienda no: su ancho
  máximo es 390 px.

## Pestaña Productos

- Buscador por nombre, categoría, rubro, detalle 1 o detalle 2.
- Filtro por rubro y filtro por estado (todos, activos, inactivos).
- Lista con imagen, nombre, insignias Destacado/Popular/Inactivo, rubro,
  categoría, detalles, precio en pesos, orden y acciones.
- Acciones por fila:
  - **Activar/Desactivar**: actualiza el producto completo con `activo`
    invertido. No borra datos.
  - **Editar**: abre `ProductoForm`.
  - **Eliminar**: abre confirmación con doble paso. El borrado es físico y
    permanente.
- **Nuevo producto**: abre `ProductoForm` vacío. El botón se deshabilita si no
  hay categorías (el formulario exige categoría).

### Campos de ProductoForm

- `id_categoria` (obligatorio; selector agrupado por rubro).
- `nombre` (obligatorio, máximo 120).
- `detalle_1`, `detalle_2` (máximo 200 cada uno).
- `precio` en pesos; se convierte a `precio_cents` con
  `inputACentavos`. Acepta coma o punto decimal; vacío equivale a 0.
- `orden` (0 a 9999; menor aparece primero).
- `color` hexadecimal con selector de color.
- `imagen`: URL manual o subida de archivo.
- `activo`, `destacado`, `popular`.

## Pestaña Categorías

- Lista con color, nombre, rubro, descripción, cantidad de productos, orden y
  estado.
- Acciones: editar y eliminar. No hay desactivación rápida desde la lista; el
  formulario incluye `activo`.
- **Nueva categoría** se deshabilita si no hay rubros.
- Campos: `id_rubro` (obligatorio), `categoria` (obligatorio, máximo 80),
  `descripcion` (máximo 200), `orden`, `color`, `activo`.
- Borrar una categoría con productos devuelve 409 `REFERENCIA` y se muestra el
  mensaje del servidor. No se fuerza el borrado en cascada.

## Pestaña Rubros

- Tarjetas con color, nombre, descripción, estado, cantidad de categorías y
  orden.
- Acciones: editar y eliminar.
- **Nuevo rubro** siempre disponible.
- Campos: `rubro` (obligatorio, máximo 60), `descripcion` (máximo 200), `orden`,
  `color`, `activo`.
- Borrar un rubro con categorías devuelve 409 `REFERENCIA`.

## Pestaña Configuración

Formulario único con secciones:

- **Datos del negocio**: nombre comercial (obligatorio), documento fiscal,
  teléfono, WhatsApp general, WhatsApp de pedidos (obligatorio), horario,
  email de contacto y email de pedidos (formato validado).
- **Dirección**: línea 1, línea 2, localidad, provincia o estado, código postal,
  país.
- **Redes sociales y moneda**: Facebook, Instagram, TikTok, símbolo de moneda
  (máximo 3 caracteres).
- **Textos de la tienda**: título principal (80), bajada (160), texto junto al
  WhatsApp (200), pie de página (300). Contador en vivo. Vacío restaura el texto
  original.
- **Estado del servicio** (solo lectura): versión (`mode`), límite de productos
  (`max_registros`) y vencimiento.
- Guardar llama `set_parametros`; al volver, el panel actualiza la configuración
  y muestra un aviso de éxito.

## Imágenes

- `ProductoForm` acepta una URL o un archivo.
- El archivo se comprime en el navegador a JPEG de 1200 px de lado máximo
  (`comprimirImagen`, tope de 8 MB).
- Se envía como data URL a `POST /api/admin/upload`.
- El servidor firma la subida a Cloudinary con `CLOUDINARY_*`. Si faltan
  credenciales, responde 503 `ALMACENAMIENTO_NO_CONFIGURADO` y el formulario
  muestra el aviso; la URL manual sigue disponible.
- La imagen se valida como URL http(s) o ruta interna; no se aceptan esquemas
  peligrosos.

## Patrones UI (replicar)

- Componentes propios en `src/components/admin/ui.tsx`: `Modal`, `ConfirmDialog`,
  `AdminToast`, `Cargando`, `Campo`, botones e inputs.
- `ConfirmDialog` tiene dos pasos cuando `doble` es verdadero. El segundo paso
  advierte que la acción es permanente.
- Prohibido `window.confirm`, `alert` y `prompt`. También en el resto de `src/`.
- Avisos de éxito y error con `AdminToast`, autocierre a los 4,2 segundos.
- Mensajes de error del servidor se muestran tal cual llegan
  (`ErrorAdmin.message`).
- Si una request devuelve 401, el panel cierra la sesión y avisa que venció.
- Estados vacíos con mensaje ("No hay productos para mostrar", "Todavía no hay
  rubros"), nunca una lista muda.
- Español neutro; forma usted en la UI.
- Iconos de acción con `title` y `aria-label`.

## Contrato con la API

Todas las acciones usan `POST /api/admin` con `Content-Type: application/json`.
El cuerpo siempre lleva `accion` y `tenant`; las acciones autenticadas llevan
`email`.

Acciones usadas por el panel:

- `verificar` — login.
- `get_parametros`, `set_parametros`.
- `resumen`.
- `listar_rubros`, `crear_rubro`, `actualizar_rubro`, `borrar_rubro`.
- `listar_categorias`, `crear_categoria`, `actualizar_categoria`,
  `borrar_categoria`.
- `listar_productos`, `crear_producto`, `actualizar_producto`,
  `desactivar_producto`, `borrar_producto`.
- `POST /api/admin/upload` — subida de imagen.

Códigos de error relevantes: `VALIDACION` (400), `TOKEN_INVALIDO` (401),
`SIN_PERMISO` (403), `TENANT_NO_ENCONTRADO` (404), `REFERENCIA` (409),
`LIMITE` (409), `RATE_LIMIT` (429), `ALMACENAMIENTO_NO_CONFIGURADO` (503).

## Lo que NO existe en v1

- Pestañas de Órdenes, Clientes, Pagos, Superadmin o Exportaciones.
- Recuperación de clave por email.
- Edición de la marca visual (logo, colores de tienda, favicon).
- Historial visible de auditoría dentro del panel.
- Borrado en cascada de rubros con categorías o categorías con productos.
