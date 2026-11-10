# SPEC — Pedidos por WhatsApp

## Principio

La v1 **no persiste pedidos**. No hay tablas de órdenes, clientes, carrito ni
pagos. El carrito vive en memoria del navegador; al confirmar, se arma un texto
y se abre WhatsApp con el mensaje listo para enviar. El negocio recibe el pedido
en su WhatsApp y lo gestiona fuera de Cuadra.

Consecuencias:

- Recargar la página vacía el carrito.
- No hay historial, estados, cancelaciones ni reembolsos dentro de Cuadra.
- No se guardan datos personales del comprador.
- El total es estimado: el negocio lo confirma al responder.

## Número de destino

1. `whatsapp_pedidos` del tenant.
2. `whatsapp` del tenant.
3. `WHATSAPP_PHONE_NUMBER` de `src/config.ts` (respaldo de la demo).

Se normaliza quitando todo lo que no sea dígito. El enlace es
`https://wa.me/<numero>?text=<mensaje codificado>` y se abre con
`window.open(url, '_blank', 'noopener,noreferrer')`.

## Flujo en la tienda

1. La tienda carga `GET /api/catalog/:tenant`. Si falla, usa el catálogo de
   respaldo y muestra un aviso con opción de reintentar.
2. El usuario toca **Pedir** en una tarjeta o abre el detalle del producto.
3. El producto se agrega al carrito en memoria. Si ya existe, se suma la
   cantidad. Se muestra un toast con enlace al carrito.
4. El carrito flotante y el botón del encabezado muestran la cantidad total.
5. **Ver carrito** abre `CartModal` con:
   - Lista de productos, cantidad, subtotal y controles + / − / eliminar.
   - Datos opcionales del comprador: nombre, entrega (domicilio o retiro),
     dirección si es domicilio, aclaraciones y método de pago.
   - Total estimado si `mostrar_precios` es verdadero; si no, "A confirmar".
6. **Enviar Pedido por WhatsApp** arma el mensaje y abre WhatsApp en otra
   solapa. No se envía nada al servidor.
7. El carrito no se vacía automáticamente al abrir WhatsApp; el usuario puede
   vaciarlo con **Vaciar** o seguir editando.

## Estructura del mensaje

```text
¡Hola <nombre del negocio>! Quiero hacer el siguiente pedido:

*1. <producto>* (x<cantidad>)
   _<detalle 1> · <detalle 2>_
   Subtotal: $ <importe>

...

━━━━━━━━━━━━━━━━━━━━━
*TOTAL A PAGAR: $ <total>*
━━━━━━━━━━━━━━━━━━━━━

👤 *Cliente:* <nombre>
🛵 *Entrega:* Envío a domicilio | Retiro en el local
📍 *Dirección:* <dirección>
📝 *Aclaraciones:* <texto>

_Muchas gracias!_
```

Reglas del mensaje:

- La primera línea usa el nombre comercial del tenant.
- Cada ítem se numera y muestra la cantidad entre paréntesis.
- La descripción une `detalle_1` y `detalle_2` con ` · ` y solo se incluye si
  hay texto.
- Si `mostrar_precios` es falso, se omiten los subtotales y el total; en su
  lugar se informa "Precios a confirmar por el negocio."
- El nombre del cliente, la dirección y las aclaraciones solo aparecen si el
  usuario los completó.
- La entrega siempre se informa (domicilio o retiro).
- El método de pago se elige en la UI, pero el mensaje actual no lo incluye.
  Si se agrega, actualizar este spec y el manual.

## Precios

- El carrito usa `producto.precio` (pesos) que llega de la API; el valor
  autoritativo en DB es `precio_cents`.
- El total se calcula en el navegador: suma de `precio × cantidad`.
- No hay cupones, impuestos, envío ni recargos calculados por Cuadra.
- Si el negocio no muestra precios (`mostrar_precios = 0`), la tienda y el
  carrito muestran "A confirmar" o "Consultar" y el mensaje omite importes.

## Seguridad y privacidad

- No se envía el pedido a ningún endpoint; no hay logs de pedidos en el
  servidor.
- El mensaje se codifica con `encodeURIComponent` antes de entrar en la URL.
- No se usa `dangerouslySetInnerHTML`.
- El número de destino sale de la configuración del tenant; no se acepta un
  número arbitrario desde la URL.
- El carrito no se sincroniza entre dispositivos ni se guarda en
  `localStorage`.
- El catálogo se cachea en `localStorage` durante 5 minutos
  (`cuadra_catalog_v2_<tenant>`), pero no contiene datos personales.

## Errores y estados

- Catálogo caído: aviso "No se pudo cargar el catálogo" con catálogo de
  respaldo y botón Reintentar.
- Carrito vacío: no se muestra el CTA o no hace nada.
- WhatsApp bloqueado por el navegador: el usuario debe permitir ventanas
  emergentes; Cuadra no puede detectarlo.
- Número inválido o vacío: se usa el respaldo de la demo; en producción el
  administrador debe cargar `whatsapp_pedidos`.

## Fuera de alcance (requiere OT nueva)

- Persistir órdenes o clientes.
- Estados de pedido, impresión de tickets o pantalla de cocina.
- Pagos en línea, señas o comprobantes.
- Notificaciones automáticas al comprador.
- Cálculo de envío por zona o código postal.
