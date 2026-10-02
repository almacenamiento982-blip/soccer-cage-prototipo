# Prototipo — guion de demostración

Para la reunión de seguimiento con Eduardo (lunes 5 de octubre de 2026, 11 am).
Todo corre en el navegador; los datos se guardan en ese navegador y se reinician desde
**Panel admin → Dashboard → Reiniciar demo**.

## Qué es real y qué es de ejemplo

| Real | De ejemplo |
|---|---|
| Nombres, precios, tallas y fotos de Athletum y Las Vegas (importados de sus tiendas) | Cantidades en stock y costos |
| Composición de los kits de Athletum y Las Vegas | Clientes, pedidos y lista de jugadores |
| Kit de campamento: 1 camisa + 1 short + 1 medias a $50 (precio del año pasado) | Precios de las piezas sueltas de campamento (provisionales) |
| Sales tax del 7 % | Tarifa de envío USPS ($9 fija) |

Los kits Elite de Athletum aparecen en $714 y $715 porque la tienda actual no publica su
precio: el importador usa la suma de sus piezas. Eduardo debe confirmar el precio real.

## Recorrido de 5 minutos

1. **Tienda → Juventus Camps.** Arriba está el kit obligatorio ($50, ahorra $7 frente a
   las piezas sueltas); abajo, las piezas sueltas.
2. **Regla del kit.** Abre *Camp Jersey*, elige talla y añádela. El carrito avisa que falta
   el kit. Al pagar pide el correo: con *Sin kit* sigue bloqueado.
3. **Comprar el kit.** *Agregar el kit* → nombre del jugador → *Misma talla para todo*. Si
   una talla está agotada (YXS en el short), no deja continuar.
4. **Pago.** Entrega en el campamento (gratis) o envío USPS; el total incluye el 7 %.
   Tras pagar, la confirmación muestra cada pieza descontada del inventario.
5. **Segunda compra.** Con la misma cuenta ya aparece *Kit comprado* y se pueden comprar
   piezas sueltas solas. Para probarlo rápido: *Ingresar* → *Con kit comprado*.
6. **Inventario compartido.** Pestaña *Las Vegas*: las medias y los shorts de goalkeeper son
   los mismos que en Athletum. Vender en una tienda baja el stock en la otra.
7. **Panel admin.**
   - **Entregas:** lista de academia (PlayMetrics) y clínica. Las 12 primeras inscripciones
     de la clínica no tienen talla: se elige y se entrega. Una entrega sin stock se bloquea.
   - **Productos → Nuevo producto / Nuevo kit:** foto, nombre, tallas con stock, tiendas
     donde se vende y descuento del kit.
   - **Tiendas:** QR imprimible de cada tienda, sales tax, envío, regla del kit y botón
     para publicar Athletum o Las Vegas.
8. **En el teléfono:** abre el enlace del QR (`?store=camps`). Es la tienda sola, sin panel.

## Pendiente para la siguiente fase

- **Stripe:** cobro real con tarjeta (hoy es una simulación).
- **USPS:** tarifa real y guías. Recomendación: un intermediario (EasyPost o Shippo) con
  tarjeta, para no depender de la cuenta ACH con USPS EPS.
- **Base de datos en servidor:** hoy los datos viven en el navegador; en producción, todas
  las tiendas y el panel leen el mismo inventario.
- **Cuentas con contraseña o enlace por correo** (hoy basta con el correo).
- **PlayMetrics:** el prototipo importa un CSV exportado; falta confirmar si su API permite
  sincronizarlo automáticamente.

## Preguntas para Eduardo

1. ¿El kit obligatorio es **por correo** o **por jugador**? Un papá con dos hijos usa un solo
   correo y necesita dos kits. Hoy basta un kit por correo y tienda.
2. ¿Cada pieza del kit lleva su propia talla, o una sola talla para todo? El prototipo
   permite ambas.
3. Precios de las piezas sueltas de campamento y del kit Elite.
4. ¿Dónde se entregan los pedidos con recogida en sitio (campamento, academia)?
