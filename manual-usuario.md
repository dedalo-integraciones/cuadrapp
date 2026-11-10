# Manual de usuario — Cuadra

Este manual describe el uso del panel de administración y de la tienda de
Cuadra. La tienda está pensada para el teléfono; el panel se puede usar desde el
teléfono, la tablet o la computadora.

## 1. Qué es Cuadra

Cuadra es una carta digital con carrito y pedidos por WhatsApp. El cliente elige
productos, completa sus datos y toca **Enviar Pedido por WhatsApp**. El pedido
llega al WhatsApp del negocio como un mensaje ordenado.

Cuadra no guarda pedidos, clientes ni pagos. Tampoco cobra en línea. El negocio
confirma el pedido y el total directamente por WhatsApp.

## 2. Ingresar al panel

1. Abrir en el navegador la dirección del sitio seguida de `/admin`. Ejemplo:
   `https://su-negocio.com/admin`.
2. Escribir el email de administrador.
3. Escribir la clave.
4. Tocar **Ingresar al panel**.

Si el email o la clave no son correctos, aparece un aviso en rojo. Después de
varios intentos fallidos, el sistema pide esperar unos minutos antes de volver a
probar.

Para salir, tocar **Salir** en la esquina superior derecha. La sesión se cierra
y se debe ingresar de nuevo.

Para ver la tienda, tocar **Ver tienda**. Se abre en otra pestaña.

## 3. Productos

La pestaña **Productos** muestra todos los productos del negocio.

### Buscar y filtrar

- Escribir en el buscador para encontrar por nombre, categoría, rubro o detalle.
- Elegir un rubro en **Todos los rubros** para ver solo ese rubro.
- Elegir **Solo activos** o **Solo inactivos** en **Todos los estados**.
- Tocar **Actualizar** para volver a leer los datos del servidor.

### Crear un producto

1. Tocar **Nuevo producto**.
2. Elegir la **Categoría**. Las categorías aparecen agrupadas por rubro.
3. Escribir el **Nombre**. Es obligatorio.
4. Completar **Detalle 1** y **Detalle 2** si se desea. Cada uno admite hasta
   200 caracteres.
5. Escribir el **Precio** en pesos. Se acepta coma o punto decimal. Si se deja
   vacío, el precio es 0.
6. Ajustar el **Orden**. Un número menor aparece primero dentro de la categoría.
7. Elegir el **Color de la tarjeta**.
8. Agregar una **Imagen**: pegar una URL o tocar **Subir** y elegir un archivo.
9. Marcar **Activo** para que se vea en la tienda. **Destacado** y **Popular**
   agregan insignias.
10. Tocar **Guardar producto**.

### Editar un producto

1. Tocar el lápiz en la fila del producto.
2. Cambiar los datos.
3. Tocar **Guardar producto**.

### Activar o desactivar sin borrar

Tocar el botón de encendido en la fila. El producto deja de mostrarse en la
tienda, pero conserva todos sus datos. Volver a tocarlo para activarlo.

### Eliminar un producto

1. Tocar el tacho de basura en la fila.
2. Leer la advertencia.
3. Tocar **Continuar**.
4. Confirmar una vez más con **Eliminar producto**.

El borrado es permanente. Si solo se quiere ocultar el producto, usar el botón
de encendido en lugar de eliminar.

### Imágenes

- La imagen se puede pegar como URL (`https://…`) o como ruta interna
  (`/gallery/…`).
- Al tocar **Subir**, el navegador reduce la imagen a un JPEG de 1200 px y la
  envía al servidor.
- Si el servicio de imágenes no está configurado, aparece un aviso. En ese caso,
  usar una URL manual.
- Se recomienda una imagen cuadrada, con fondo claro y menos de 100 KB.

## 4. Categorías

Las categorías agrupan productos dentro de un rubro. Por ejemplo, dentro del
rubro COMIDAS pueden existir COMBOS, LOMOS y PIZZAS.

### Crear una categoría

1. Tocar la pestaña **Categorías**.
2. Tocar **Nueva categoría**.
3. Elegir el **Rubro**.
4. Escribir el **Nombre**. Es obligatorio.
5. Completar la **Descripción** si se desea.
6. Ajustar el **Orden** y el **Color**.
7. Dejar marcada la casilla **Activa** para que se vea en la tienda.
8. Tocar **Guardar categoría**.

### Editar o eliminar

- Tocar el lápiz para editar.
- Tocar el tacho de basura para eliminar. Si la categoría tiene productos, el
  sistema no permite borrarla: primero hay que mover o eliminar esos productos.

## 5. Rubros

Los rubros son el primer nivel de la carta. Agrupan categorías. Por ejemplo,
COMIDAS y BEBIDAS.

### Crear un rubro

1. Tocar la pestaña **Rubros**.
2. Tocar **Nuevo rubro**.
3. Escribir el **Nombre**. Es obligatorio.
4. Completar la **Descripción** si se desea.
5. Ajustar el **Orden** y el **Color**.
6. Dejar marcada la casilla **Activo**.
7. Tocar **Guardar rubro**.

### Editar o eliminar

- Tocar el lápiz para editar.
- Tocar el tacho de basura para eliminar. Si el rubro tiene categorías, el
  sistema no permite borrarlo: primero hay que mover o eliminar esas categorías.

## 6. Configuración

La pestaña **Configuración** reúne los datos del negocio y los textos de la
tienda.

### Datos del negocio

- **Nombre comercial**: obligatorio. Es el nombre que saluda en el mensaje de
  WhatsApp.
- **Documento fiscal**, **Teléfono**, **WhatsApp general**: opcionales.
- **WhatsApp de pedidos**: obligatorio. Es el número que recibe los pedidos.
- **Horario de atención**: texto libre.
- **Email de contacto** y **Email de pedidos**: si se completan, deben tener
  formato de email.

### Dirección

Completar línea 1, línea 2, localidad, provincia o estado, código postal y país.
La dirección se muestra en el pie de la tienda y se usa para el enlace de mapas.

### Redes sociales y moneda

- Completar Facebook, Instagram y TikTok con la URL completa.
- Elegir el **Símbolo de moneda**. Por defecto es `$`.

### Textos de la tienda

- **Título principal**, **Bajada del título**, **Texto junto al WhatsApp** y
  **Pie de página**.
- Cada campo tiene un contador y un máximo.
- Si se deja vacío, la tienda usa el texto original.

### Guardar

Tocar **Guardar configuración**. Aparece un aviso de confirmación. Los cambios
se ven en la tienda al actualizarla.

## 7. La tienda

La tienda está diseñada para el teléfono. Muestra:

- Encabezado con el menú de rubros, el cambio de modo claro/oscuro y el carrito.
- Secciones por categoría. Sobre cada sección se indica el rubro al que
  pertenece.
- Botón **Pedir** en cada producto.
- Botón **Rubros** para filtrar por rubro o por categoría.
- Carrito flotante con la cantidad de productos.

### Armar un pedido

1. Tocar **Pedir** en uno o más productos.
2. Tocar el carrito.
3. Revisar los productos y ajustar cantidades con **+** y **−**.
4. Completar, si se desea, nombre, entrega, dirección y aclaraciones.
5. Tocar **Enviar Pedido por WhatsApp**.
6. Enviar el mensaje desde WhatsApp.

El pedido no queda guardado en Cuadra. Si se cierra el navegador antes de
enviarlo, se pierde el carrito.

### Si no se ven los precios

El negocio puede configurar la tienda para no mostrar precios. En ese caso, la
tienda y el mensaje indican que el precio se confirma por WhatsApp.

## 8. Preguntas frecuentes

**No puedo ingresar al panel.**
Verificar el email y la clave. Si el problema continúa, pedir al responsable de
la plataforma que revise la cuenta y el acceso al negocio.

**El panel dice que la sesión venció.**
Volver a ingresar. La sesión se cierra cuando el servidor rechaza las
credenciales.

**Un producto no aparece en la tienda.**
Revisar que el producto esté activo, que su categoría esté activa y que su rubro
esté activo.

**No puedo borrar un rubro o una categoría.**
Tiene elementos asociados. Primero mover o eliminar las categorías o los
productos que dependen de él.

**La imagen no sube.**
El servicio de imágenes puede no estar configurado. Usar una URL manual o pedir
al responsable de la plataforma que configure las credenciales.

**El pedido no llega a WhatsApp.**
Revisar el número en **WhatsApp de pedidos**. También verificar que el navegador
permita ventanas emergentes.

**Cambié un precio y la tienda sigue mostrando el anterior.**
Tocar **Actualizar** en el pie de la tienda o esperar unos minutos. La tienda
guarda el catálogo en el navegador durante 5 minutos.

**Se puede usar Cuadra sin internet.**
No. La tienda necesita conexión para cargar el catálogo y abrir WhatsApp. Si la
carga falla, muestra un catálogo de respaldo.

## 9. Buenas prácticas

- Mantener el WhatsApp de pedidos actualizado.
- Desactivar los productos sin stock en lugar de borrarlos.
- Usar nombres cortos y claros.
- Mantener una foto por producto.
- Revisar la tienda después de cambiar precios, categorías o textos.
- No compartir la clave del panel.
- Cerrar sesión al usar una computadora compartida.

## 10. Límites de esta versión

- No hay historial de pedidos ni estados de pedido.
- No hay clientes, cupones, pagos en línea ni cálculo de envío.
- No hay exportaciones de datos.
- No hay superadministrador web: el alta de negocios se hace por scripts.
- La tienda es mobile; el panel es responsivo.
