# Soccer Cage — Tiendas e inventario

Prototipo de la plataforma propia acordada en la reunión del 2 de octubre de 2026:
**tres tiendas de uniformes que comparten un solo inventario**.

- **Publicado:** https://almacenamiento982-blip.github.io/soccer-cage-prototipo/
- **Tienda pública de campamentos (enlace del QR):** la misma dirección con `?store=camps`

| Archivo | Qué contiene |
|---|---|
| [docs/](docs/) | El prototipo (HTML, CSS y JS sin dependencias). Es lo que publica GitHub Pages. |
| [docs/README.md](docs/README.md) | Guion de la demostración y qué es real y qué es de ejemplo. |
| [tools/importar-catalogo.js](tools/importar-catalogo.js) | Rescata nombres, precios, tallas y fotos de las tiendas actuales. |
| [ANALISIS-Shopify-vs-Plataforma-Propia.md](ANALISIS-Shopify-vs-Plataforma-Propia.md) | Análisis de costos anterior (referencia). |

## Requisitos de la reunión y dónde están

| Requisito | En el prototipo |
|---|---|
| Tres tiendas (Camps, Athletum, Las Vegas) sobre un mismo inventario | Selector de tienda en la Tienda; sección **Tiendas** del panel |
| Arranque por fases: primero campamentos | Camps activa; Athletum y Las Vegas en preparación (se publican desde el panel) |
| Kit obligatorio solo en la primera compra, ligado al correo | Cuenta por correo; el pago se bloquea sin kit propio o en el pedido |
| Descuento del kit frente a las piezas sueltas | Precio del kit y ahorro visibles; el kit descuenta cada pieza |
| Categorías jugador y goalkeeper | Filtros de la tienda y del panel |
| Sales tax del 7 % | Configurable por tienda; aparece en carrito, pago, pedidos y reportes |
| Envío por USPS | Opción de envío con tarifa estimada (la API real va después) |
| Móvil, QR y sin efectivo | Tienda pública por enlace, QR imprimible, solo pago con tarjeta |
| Uniformes de academia vía PlayMetrics y camiseta de la clínica | Sección **Entregas**: importa CSV y descuenta inventario sin venta |
| Eduardo crea productos con foto, tallas y nombre | **Productos → Nuevo producto / Nuevo kit** |
| Rescatar precios y fotos de las tiendas actuales | `tools/importar-catalogo.js` (40 productos importados) |

Fuera de este prototipo, como se acordó: el cobro real con Stripe y la generación de
guías con USPS. Ver [docs/README.md](docs/README.md).

## Actualizar el catálogo importado

```
node tools/importar-catalogo.js
```

Vuelve a leer las tiendas actuales y regenera `docs/js/catalog.js` y `docs/img/catalogo/`.
