# 🍗 Cuadra.app - Sitio de Pedidos Mobile-First

Sitio web de pedidos mobile-first para **Cuadra.app** (Mendoza, Argentina). Recreación pixel-perfect del flyer publicitario oficial, con sincronización de productos vía Google Sheets en tiempo real y armado automático de pedidos enviados por WhatsApp desde el carrito de compras.

---

## 🚀 Tecnologías

- **React 19** + **TypeScript**
- **Vite 6**
- **TailwindCSS 4**
- **Google Fonts**: *Pacifico*, *Caveat* y *Poppins*
- **Lucide Icons**

---

## 📦 Instalación y Desarrollo Local

1. **Clonar el repositorio o descargar el código:**
   ```bash
   git clone <URL_DE_TU_REPOSITORIO>
   cd milanesas-ld
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Ejecutar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador y activa el modo emulador móvil de DevTools (390px - iPhone 12/14/15).

4. **Compilar para producción:**
   ```bash
   npm run build
   ```

---

## 🌐 Despliegue en Vercel

1. **Subir cambios a GitHub:**
   ```bash
   git init
   git add .
   git commit -m "feat: Cuadra.app pedidos web mobile"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/cuadra-app.git
   git push -u origin main
   ```

2. **Desplegar con Vercel CLI:**
   ```bash
   # Si no tienes Vercel CLI instalado:
   npm i -g vercel

   # Despliegue a producción:
   vercel --prod
   ```

3. **O vincular desde el dashboard de Vercel:**
   - Ingresa a [vercel.com](https://vercel.com)
   - Haz clic en **"Add New Project"**
   - Importa tu repositorio de GitHub
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Haz clic en **"Deploy"**

---

## 📊 Configuración del Google Sheet Público

El sistema lee automáticamente los productos y categorías desde la hoja de cálculo de Google Sheets configurada:

- **ID de la Hoja:** `127HQwv4KoZkVMTYJ5Q5iYk2mp-twYu309dapZ5lr6Cg`
- **URL de Exportación CSV utilizada por la app:**
  ```
  https://docs.google.com/spreadsheets/d/127HQwv4KoZkVMTYJ5Q5iYk2mp-twYu309dapZ5lr6Cg/gviz/tq?tqx=out:csv
  ```

### Estructura obligatoria de las columnas en la fila 1:
| id | rubro | nombre | detalle_1 | detalle_2 | precio | color | activo | imagen |
|---|---|---|---|---|---|---|---|---|
| 1 | LOMOS | Lomo completo | Pan Frances/Arabe | lechuga, tomate, condimentos | 18000 | #e84393 | SI | https://... |
| 2 | LOMOS | Lomo especial | Pan Frances/Arabe | lechuga, tomate, condimentos, huevo, jamon | 22000 | #C91810 | SI | |
| 3 | HAMBURGUESAS | Cheddar | 1 medallon, tomate, lechuga | lechuga, tomate, condimentos | 10000 | #00b6b6 | SI | |
| 4 | HAMBURGUESAS | Doble carne Cheddar | 2 medallones, tomate, lechuga | lechuga, tomate, condimentos | 15000 | #C91810 | SI | |
| 5 | PIZZAS | Muzzarela 6 porciones | | | 10000 | #7c5cbf | SI | |
| 7 | EMPANADAS | Carne | Por docena | | 12000 | #5fbf8b | SI | |
| 9 | COMBOS | Combo 1 | 2 lomos | Papas chicas | 36000 | #ff8c28 | SI | /images/1.webp |
| 16 | MENÚ DEL DÍA | Lasagna | Salsa | | 8000 | #C91810 | SI | |

---

### ⚠️ Reglas y Advertencias Clave para no Romper la Lógica:

1. **Fila 1 Inalterable:** Los nombres de las columnas en la primera fila deben ser exactamente:  
   `id`, `rubro`, `nombre`, `detalle_1`, `detalle_2`, `precio`, `color`, `activo`, `imagen` (en minúsculas, sin tildes ni espacios extras). **No renombrar, no mover de lugar ni intercalar columnas.**
2. **IDs Únicos y Numéricos:** La columna `id` debe tener números enteros correlativos y únicos (1, 2, 3...). Nunca repetir un `id` ni dejarlo vacío.
3. **Formato del Precio:** Ingrese únicamente números enteros o decimales con punto (ej. `18000`, `15500.50`). **No escribir el signo `$` ni puntos separadores de miles** (ej. evitar `$18.000` o `18.000,00`).
4. **Columna `activo`:** Usar estrictamente `SI` para mostrar en la carta y `NO` para ocultarlo temporalmente sin borrar el registro.
5. **Columna `color`:** Usar códigos hexadecimales válidos (ej. `#e84393`, `#00b6b6`, `#7c5cbf`, `#5fbf8b`, `#ff8c28`, `#C91810`). Si se deja vacío, el sistema asignará el color por defecto del rubro.
6. **Agrupamiento por Rubro:** Para crear un nuevo rubro o categoría basta con escribir su nombre en mayúsculas (ej. `BEBIDAS`, `POSTRES`). Se creará automáticamente en la carta y en el menú hamburguesa.
7. **Filas vacías:** No dejar filas intermedias en blanco entre productos para evitar cortes en la lectura.

---

### 📈 Capacidad y Rendimiento Sugerido:
- **Límite recomendado:** **Hasta 100 - 150 registros activos.**  
- **Motivo:** Esta cantidad permite cargar la carta en menos de 0.3 segundos incluso en conexiones móviles lentas (3G/4G) y mantiene el menú de rubros ágil y limpio en pantalla sin saturar al cliente.
- **Tip para cartas muy extensas:** Si superas los 100 ítems, utiliza la columna `activo = NO` para archivar temporalmente productos fuera de temporada o sin stock.

---

### 🖼️ Tamaño, Formato y Alojamiento sugerido para las Imágenes:
- **Dimensiones sugeridas:** `400 x 400 px` o `500 x 500 px` (Relación de aspecto **1:1 cuadrada**).
- **Formato recomendado:** **WebP** o **JPG/PNG optimizado** (peso sugerido **< 100 KB** por imagen para asegurar carga instantánea en redes móviles 3G/4G).
- **Alineación:** Producto centrado con fondo transparente o fondo claro para mejor contraste.

#### 🌐 Repositorio recomendado para alojar las imágenes (Gratuito y Sencillo):
- **[ImgBB](https://imgbb.com)** (Opción más fácil y recomendada):
  1. Ingresas a [imgbb.com](https://imgbb.com) y subes la foto del producto.
  2. En el menú desplegable tras subir, seleccionas **"Enlaces directos"** (Direct Link).
  3. Copias la URL (ejemplo: `https://i.ibb.co/.../combo1.webp`) y la pegas directamente en la columna `imagen` de tu Google Sheet.
- **[Cloudinary](https://cloudinary.com)**: Alternativa avanzada para optimización y redimensionado automático de imágenes en la nube.

### Pasos para publicar y compartir el Google Sheet:
1. Abre tu archivo en Google Sheets.
2. Haz clic en el botón superior derecho **Compartir**.
3. En **Acceso general**, selecciona: **"Cualquier persona con el enlace"** con rol de **Lector**.
4. *(Opcional)* Ve a **Archivo** > **Compartir** > **Publicar en la web**, elige formato **Valores separados por comas (.csv)** y haz clic en **Publicar**.
5. Si no hay conexión o la hoja falla, la aplicación cuenta con un **mecanismo de respaldo (fallback)** que muestra automáticamente los datos originales del flyer publicitario sin interrumpir el funcionamiento de la tienda.

---

## 📱 Flujo de Pedidos por WhatsApp

1. El usuario toca cualquier Combo Card o fila de precios por kilo para agregarlo al carrito.
2. La app notifica con un toast visual e incrementa el contador del carrito flotante.
3. Al pulsar en **"Ver Carrito"**, se abre el panel del pedido con:
   - Resumen y control de cantidades (+ / - / eliminar).
   - Formulario para indicar nombre, envío a domicilio o retiro, dirección y notas.
   - Cálculo del total acumulado.
4. El envío a WhatsApp se realiza **únicamente desde el carrito de pedidos**, abriendo `wa.me/5492612144662` con el mensaje detallado listo para enviar.
