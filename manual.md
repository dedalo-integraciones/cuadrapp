# 📖 Manual de Uso y Administración — Sabor Casero

¡Bienvenido al manual oficial de **Sabor Casero**! Esta guía práctica está diseñada para que puedas administrar los productos, precios, fotos y pedidos de tu carta digital de forma rápida, sencilla y sin necesidad de conocimientos técnicos.

---

## 📑 Índice
1. [¿Cómo funciona tu Carta Digital?](#1-cómo-funciona-tu-carta-digital)
2. [Gestión de Productos desde Google Sheets](#2-gestión-de-productos-desde-google-sheets)
3. [Guía para Subir y Vincular Fotos](#3-guía-para-subir-y-vincular-fotos)
4. [Reglas de Oro para no Romper la Planilla](#4-reglas-de-oro-para-no-romper-la-planilla)
5. [Cómo Gestionar los Pedidos que Llegan por WhatsApp](#5-cómo-gestionar-los-pedidos-que-llegan-por-whatsapp)
6. [Preguntas Frecuentes y Solución de Problemas](#6-preguntas-frecuentes-y-solución-de-problemas)

---

## 1. ¿Cómo funciona tu Carta Digital?

Tu aplicación se actualiza en tiempo real leyendo directamente una hoja de cálculo en Google Sheets. 

- **Cambio de precios:** Se refleja en la carta en pocos minutos.
- **Pausar productos:** Puedes activar o pausar cualquier ítem cuando te quedes sin stock.
- **Nuevas categorías (Rubros):** Se crean automáticamente en la carta y en el menú hamburguesa con solo escribir el nombre.

---

## 2. Estructura de la Planilla: Solapas "productos" y "rubros"

Tu archivo de Google Sheets está organizado en **2 solapas (pestañas)** en la parte inferior:

```text
┌─────────────────────────┬─────────────────────────┐
│     📄 productos        │        🏷️ rubros        │
└─────────────────────────┴─────────────────────────┘
```

---

### 📄 Solapa 1: `productos` (Tu catálogo diario)

Aquí cargas cada plato o combo individual. Contiene 9 columnas en la Fila 1:

| Columna | ¿Para qué sirve? | Ejemplo | ¿Es obligatoria? |
|---|---|---|:---:|
| **id** | Número identificador único de cada producto. | `1`, `2`, `3` | **SÍ** |
| **rubro** | Nombre de la categoría (debe coincidir con la solapa `rubros`). | `COMBOS`, `LOMOS`, `PIZZAS` | **SÍ** |
| **nombre** | Nombre visible del producto en la tarjeta. | `Lomo Especial`, `Combo 1` | **SÍ** |
| **detalle_1** | Primera línea de descripción o ingredientes. | `Pan Francés / Árabe` | Opcional |
| **detalle_2** | Segunda línea de descripción adicional. | `Lechuga, tomate, huevo, jamón` | Opcional |
| **precio** | Precio en pesos argentinos (solo números, sin `$`). | `18000`, `22500` | **SÍ** |
| **color** | Color de acento de la tarjeta en código HEX (si se deja vacío, toma el del rubro). | `#e84393`, `#00b6b6`, `#C91810` | Opcional |
| **activo** | Escribe `SI` para mostrar en la carta o `NO` para pausar sin stock. | `SI` o `NO` | **SÍ** |
| **imagen** | Enlace web directo de la foto del producto. | `https://i.ibb.co/.../lomo.webp` | Opcional |

---

### 🏷️ Solapa 2: `rubros` (Categorías, orden y colores)

Esta solapa define **las categorías del menú**, el **orden de aparición** en la carta digital y en el menú desplegable, y el **color temático** de cada sección:

| Columna | ¿Para qué sirve? | Ejemplo | ¿Es obligatoria? |
|---|---|---|:---:|
| **id_rubro** | Identificador o número de orden del rubro. | `1`, `2`, `3` | **SÍ** |
| **rubro** | Nombre de la categoría en mayúsculas. | `COMBOS`, `LOMOS`, `BEBIDAS` | **SÍ** |
| **color** | Color HEX característico para los botones, insignias y títulos de esa categoría. | `#C91810`, `#e84393`, `#00b6b6` | **SÍ** |
| **descrip** | Breve texto aclaratorio o nota sobre la categoría. | `(Rojo institucional)`, `(Rosa fucsia)` | Opcional |

#### ✨ ¿Para qué sirve tener la solapa `rubros` separada?
1. **Control del orden:** El orden en que anotes los rubros en esta solapa (de arriba hacia abajo) es el orden exacto en el que se mostrarán en la carta del cliente y en el menú de navegación lateral.
2. **Color de marca uniforme:** Al asignarle un color a un rubro (por ejemplo `#C91810` rojo a `COMBOS`), todos los productos de ese rubro heredarán ese color automáticamente sin que tengas que ponerlo producto por producto.
3. **Agregar un nuevo rubro (ej. BEBIDAS o POSTRES):**
   - Agrega la fila en la solapa `rubros` con su nombre y color HEX deseado.
   - Luego ve a la solapa `productos` y usa ese mismo nombre en la columna `rubro`. ¡La nueva sección aparecerá automáticamente con su color propio!

---

### 💡 Ejemplos de uso frecuente:
* **¿Cómo cambiar un precio?** En la solapa `productos`, busca la fila del producto, cambia el número en la columna `precio` y ¡listo!
* **¿Cómo pausar un producto sin stock?** Cambia el valor de la columna `activo` de `SI` a `NO`. No borres la fila para no perder los datos.
* **¿Cómo reordenar las secciones del menú?** En la solapa `rubros`, cambia el orden de las filas (por ejemplo, subir `PIZZAS` antes de `HAMBURGUESAS`) y la carta se reordenará sola.

---

## 3. Guía para Subir y Vincular Fotos

Para que las imágenes carguen al instante en los celulares de tus clientes, te recomendamos usar el servicio gratuito **ImgBB**.

### Paso a paso:
1. Entra a **[https://imgbb.com](https://imgbb.com)** desde tu computadora o celular.
2. Toca en **"Comenzar a subir"** y selecciona la foto de tu producto.
3. Haz clic en **Subir**.
4. En el menú desplegable que dice *"Códigos de inserción"*, elige la opción **"Enlaces directos"** (o *Direct Link*).
5. Copia el enlace resultante (debe comenzar con `https://i.ibb.co/...`).
6. Pégalo en la columna `imagen` de la fila correspondiente en tu Google Sheet.

### 📐 Especificaciones y Tamaño Ideal para Móviles:
Como la aplicación está diseñada para verse principalmente en teléfonos celulares (donde la miniatura mide 80 × 80 px en pantalla), no es necesario usar imágenes pesadas. Las medidas ideales son:

| Tipo de Tarjeta | Proporción | Tamaño Recomendado | Peso Máximo Sugerido |
|---|:---:|:---:|:---:|
| **Productos generales** (Lomos, Pizzas, Hamburguesas, etc.) | **1:1** (Cuadrada) | **200 × 200 píxeles** *(mínimo 160 × 160 px)* | **10 a 20 KB** |
| **Combos destacados** (Tarjetas anchas) | **4:3** o **1:1** | **280 × 220 píxeles** *(o 300 × 300 px)* | **20 a 35 KB** |

- **Formato recomendado:** `.webp` (el más liviano y moderno) o `.jpg` optimizado.
- **Encuadre:** Producto centrado ocupando el **75% a 85% del cuadro** para que no se corten los bordes en el recorte circular/redondeado de la app.
- **Fondo:** Iluminación nítida, fondo liso/desenfocado o transparente (recorte del plato).
- **Ventaja de optimizar:** Usar imágenes livianas de ~200 px hace que la carta abra al instante incluso en conexiones móviles lentas (3G/4G).

---

## 4. Reglas de Oro para no Romper la Planilla

⚠️ Para asegurar que la app funcione siempre sin errores, sigue estas 6 pautas:

1. **No modifiques la Fila 1 de ninguna solapa:** Los títulos de las columnas deben mantenerse exactamente como están:  
   - En solapa `productos`: `id`, `rubro`, `nombre`, `detalle_1`, `detalle_2`, `precio`, `color`, `activo`, `imagen`.  
   - En solapa `rubros`: `id_rubro`, `rubro`, `color`, `descrip`.
2. **No pongas el signo `$` en los precios:** Escribe `18000`, **nunca** `$18000` ni `$18.000`.
3. **Usa IDs únicos:** No repitas números en la columna `id` (1, 2, 3, 4...).
4. **No dejes filas intermedias vacías:** Mantén la lista continua de arriba hacia abajo.
5. **En `activo`, usa solo `SI` o `NO`:** En mayúsculas y sin espacios.
6. **Volumen sugerido:** La plataforma está optimizada para manejar hasta **100 a 150 productos activos**. Si tienes productos viejos, márcalos con `NO` en la columna `activo`.

---

## 5. Cómo Gestionar los Pedidos que Llegan por WhatsApp

Cuando un cliente arma un pedido desde la app y presiona **"Enviar Pedido por WhatsApp"**, te llegará un mensaje preformateado con este formato:

```text
🛒 *NUEVO PEDIDO - SABOR CASERO*
━━━━━━━━━━━━━━━━━━━━━
👤 *Cliente:* Juan Pérez
📞 *Teléfono:* 2611234567
📍 *Entrega:* Envío a domicilio
🏠 *Dirección:* San Martín 1234, Godoy Cruz
📝 *Notas:* Tocar timbre 2B

📋 *DETALLE DEL PEDIDO:*
• 2x Lomo Especial ($44.000)
• 1x Combo 1 ($36.000)

━━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL: $80.000*
```

### 📲 ¿Qué debes hacer al recibirlo?
1. Confirmar la recepción del pedido y el tiempo estimado de demora.
2. Indicar las opciones de pago disponibles (Efectivo, Transferencia, Mercado Pago).
3. Iniciar la preparación en cocina.

---

## 6. Preguntas Frecuentes y Solución de Problemas

**¿Modifiqué un precio en el Sheet pero no cambió en la app?**  
La aplicación tiene una memoria caché rápida para ahorrar datos móviles que se actualiza cada 5 minutos. También puedes recargar la página (o tocar el logo) para forzar la actualización.

**¿Qué pasa si no le pongo foto a un producto?**  
No pasa nada. El producto se mostrará automáticamente con un diseño compacto elegante y un ícono representativo según su rubro.

**¿Qué pasa si falla la conexión con Google Sheets?**  
La app cuenta con un sistema de respaldo inteligente (Fallback) que muestra los productos predeterminados para que tu negocio nunca deje de recibir pedidos.

---

*Desarrollado para **Sabor Casero** — Todos los derechos reservados.*
