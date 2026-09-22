# Soccer Cage — Prototipo funcional
### Plataforma de inventario y ventas para confección de uniformes

Prototipo navegable en HTML + CSS + JavaScript. **Sin instalación, sin servidor y sin
conexión a internet.**

---

## Cómo abrirlo

Doble clic en **`index.html`**. Eso es todo.

> Se recomienda Chrome, Edge o Firefox actualizados.
> Los datos se guardan en `localStorage`: los cambios persisten al recargar, pero no
> salen de este equipo. Para volver al estado inicial:
> **Panel admin → Configuración → Reiniciar datos de la demo**.

**Atajos:** `Alt + 1` tienda · `Alt + 2` panel administrativo · `Alt + 3` análisis comparativo.

---

## Las tres vistas

| Pestaña | Para qué sirve |
|---|---|
| **Tienda** | Lo que ve el cliente: catálogo, tallas con stock real, carrito y pago |
| **Panel admin** | Lo que usa la empresa: inventario, movimientos, pedidos, alertas |
| **Análisis** | **Shopify vs. plataforma propia, con calculadora interactiva** |

La pestaña **Análisis** es la que se presenta al gerente para la decisión de compra.
Los importes no están escritos a mano: se calculan con las tarifas reales de Shopify y
Stripe, así que al mover los controles todo el análisis se recalcula.

Qué se puede ajustar en vivo durante la reunión:

- **Ventas mensuales** ($2.000 – $600.000) y **ticket medio**
- **Horizonte** de 1 a 7 años
- **Plan de Shopify** (Basic / Grow / Advanced) y facturación anual o mensual
- **Coste del desarrollo propio** (optimista $30k / medio $45k / conservador $60k)
- **App de manufactura** (Katana, $299/mes) — el renglón que más cambia el resultado

El sistema calcula solo el **punto de equilibrio**: en qué año la plataforma propia
empezaría a salir más barata. Con los supuestos actuales no llega; a $600.000/mes de
ventas y desarrollo optimista, aparece en el año 3. Eso permite responder en vivo la
pregunta «¿y si crecemos mucho?» sin que la respuesta parezca improvisada.

---

## Guion de demostración para la reunión (5 minutos)

Este recorrido demuestra el problema resuelto. Los números son reales del prototipo.

### 1. El problema, planteado (30 s)

Panel admin → **Dashboard**.

- **Valor del inventario: $16.152** a costo, sobre 1.006 unidades.
- **38 referencias requieren atención:** 33 bajo mínimo, 5 agotadas.
- Aviso rojo: *"5 referencias agotadas — la tienda ya bloquea su compra."*

> Hoy esta información no existe en la empresa. Ese es el problema.

### 2. El inventario real, por talla (45 s)

**Inventario**. Señalar que cada fila es **una talla de un color concreto**, no un producto.

> "Camiseta Halcones" no es una unidad de inventario. "Camiseta Halcones / M / Azul Rey"
> sí lo es. Esa distinción es la raíz del descontrol actual.

Filtrar por **Agotado**: aparece la Camiseta Leones del Sur, sin stock en ninguna talla.

### 3. La venta (90 s)

Cambiar a **Tienda** (`Alt + 1`).

1. Abrir **Camiseta Halcones FC — Local 2026**.
2. Mostrar el selector de tallas: **cada talla muestra sus unidades reales**.
   La talla M tiene **15**.
3. Señalar que **XXL (2 unidades) aparece con borde dorado** —bajo mínimo— y que una
   talla agotada aparecería tachada y no se puede pulsar.
4. Seleccionar **M**, cantidad **2**. Añadir al carrito.
5. Finalizar compra. **Intentar pagar con el formulario vacío**: el sistema lo bloquea.
6. Rellenar los datos y pagar.

Se muestra la secuencia real de un cobro: autorización → confirmación del proveedor
(webhook) → registro del pedido → descuento de inventario.

### 4. La prueba (60 s) ← **el momento importante**

En la confirmación aparece un recuadro dorado:

```
INVENTARIO DESCONTADO AUTOMÁTICAMENTE
Camiseta Halcones FC — Local 2026
M / Azul Rey · CAM-HALC-L-AZU-M          15 → 13  (−2)
```

Pulsar **"Ver en el panel admin"** → va directo a **Movimientos**, primera fila:

| Producto | Motivo | Cambio | Stock | Usuario |
|---|---|---:|---|---|
| Camiseta Halcones FC — Local 2026 | Venta · SC-10243 | −2 | 15 → 13 | Sistema |

> Quién, qué, cuánto, por qué, cuándo, y el stock antes y después. Eso es trazabilidad.

### 5. Que no se pueda vender lo que no existe (45 s)

Volver a la tienda, abrir **Camiseta Leones del Sur — Edición Aniversario**.

Todas las tallas aparecen **tachadas y deshabilitadas**. El botón dice **"Agotado"**.

> El sistema no permite vender lo que no existe. Hoy eso sí ocurre, y termina en una
> llamada incómoda al cliente.

### 6. Reposición y cierre (60 s)

**Alertas** → **"Generar orden de producción"**: calcula unidades sugeridas y costo
estimado. Al confirmar, registra las entradas y **las alertas desaparecen del dashboard**.

Opcional: en **Pedidos**, abrir uno y cancelarlo — el stock vuelve al inventario y queda
un movimiento de "Devolución de cliente" firmado por el usuario.

---

## Prueba del flujo — resultado verificado

Ejecutado sobre el prototipo el 19/09/2026 mediante automatización del navegador.
**Escenario exacto del encargo: compra de 2 camisetas talla M.**

| Momento | Stock `CAM-HALC-L-AZU-M` | Pedidos | Movimientos |
|---|---:|---:|---:|
| Estado inicial | **15** | 7 | 15 |
| Producto en el carrito (sin pagar) | **15** ← *no cambia* | 7 | 15 |
| Formulario vacío → pago rechazado | **15** ← *no cambia* | 7 | 15 |
| **Pago confirmado** | **13** ✔ | **8** | **16** |

**Movimiento generado automáticamente:**

```json
{
  "sku":    "CAM-HALC-L-AZU-M",
  "type":   "salida",
  "qty":    2,
  "before": 15,
  "after":  13,
  "reason": "Venta",
  "ref":    "SC-10243",
  "user":   "Sistema"
}
```

También quedó registrado: pedido `SC-10243` por $93.00 (2 × $42.00 + $9.00 de envío),
estado `pendiente` / pago `pagado`, cliente nuevo creado automáticamente y carrito vaciado.

### Reglas de protección verificadas

| Caso comprobado | Resultado |
|---|---|
| Añadir al carrito un producto agotado | ❌ Bloqueado — *"Esta variante está agotada."* |
| Pedir más unidades de las que existen | ❌ Bloqueado — *"Solo quedan 13 unidades…"* |
| Registrar una salida manual mayor que el stock | ❌ Bloqueado — *"Stock insuficiente… Disponible: 13, solicitado: 63."* |
| Stock tras los tres intentos fallidos | ✔ **13, intacto** |
| Pagar con formulario incompleto | ❌ Bloqueado, 3 campos marcados, sin pedido creado |
| Cancelar un pedido pagado | ✔ Stock repuesto 13 → 15, pago marcado como reembolsado |
| Crear producto con stock inicial | ✔ Registrado como entrada 0 → 7, no aparece de la nada |

**El stock solo se mueve cuando el pago se confirma, y nunca queda en negativo.**

---

## Qué incluye el prototipo

### Tienda (cliente)
Página principal · catálogo con **12 productos activos y 103 referencias** · buscador ·
filtros por categoría · ordenación · ocultar agotados · ficha de producto ·
**selección de talla con stock real a la vista** · selección de color · cantidad limitada
por disponibilidad · carrito lateral · checkout con validación · simulación de pago ·
confirmación con traza de inventario.

### Panel administrativo
**Dashboard** (valor de inventario, ventas del día y del mes, pedidos, alertas, más
vendidos, últimos movimientos) · **Inventario** por variante con exportación CSV ·
**Productos** (alta, edición, variantes, activar/desactivar) · **Movimientos** (libro
completo con filtros y exportación) · **Pedidos** (detalle, cambio de estado,
cancelación con reposición) · **Clientes** · **Alertas** con generación de orden de
producción · **Reportes** con gráficas e imprimible a PDF · **Configuración**.

### Datos de demostración
13 productos (12 activos + 1 descatalogado) · 103 referencias activas · 6 clientes ·
7 pedidos en distintos estados · 15 movimientos de inventario previos.

Incluye deliberadamente: **un producto agotado** (Leones del Sur), **referencias bajo
mínimo**, **un producto bajo pedido** (fabricación a medida) y **un producto desactivado**
que conserva su historial.

---

## Decisiones de diseño que conviene explicar

**El stock vive en la variante, no en el producto.** Es la decisión estructural central.
Preguntar "cuántas camisetas hay" no tiene respuesta útil; la pregunta correcta es
"cuántas camisetas talla M azules hay".

**Ninguna parte del sistema modifica el stock directamente.** Todo cambio pasa por una
única función que exige motivo y usuario, y que escribe en el libro de movimientos. Por eso
la trazabilidad es completa: no hay forma de mover inventario sin dejar rastro.

**El carrito no reserva stock; el pago sí lo descuenta.** Es el comportamiento correcto:
un carrito abandonado no debe inmovilizar mercancía. Por eso el sistema **revalida el stock
justo antes de cobrar** y cancela la venta si otro cliente se adelantó.

**Los productos no se borran, se desactivan.** Borrar un producto rompería el historial de
ventas y de movimientos. La demo incluye un producto descatalogado que conserva su rastro.

**El artículo bajo pedido no cuenta como capital inmovilizado.** Su stock es un marcador de
fabricación, no mercancía en bodega, y por eso se excluye del valor del inventario.

---

## Limitaciones (importante para la reunión)

Esto es un **prototipo de demostración**, no un sistema de producción:

- **No hay backend.** Los datos viven en el navegador (`localStorage`), solo en este equipo.
- **No hay pago real.** El cobro está simulado; no se conecta a Stripe ni a PayPal.
- **No hay autenticación real.** Los roles son ilustrativos: no hay contraseñas ni sesiones.
- **No hay correos.** La confirmación se muestra en pantalla, no se envía.
- **Las imágenes son ilustraciones vectoriales**, generadas en el propio código para que
  todo funcione sin conexión.
- **Sin concurrencia real.** Al ser un solo navegador no puede haber dos compras
  simultáneas; en producción eso exige transacciones en base de datos.

Lo que el prototipo **sí demuestra de forma fiable** es la lógica de negocio: el modelo de
variantes, el descuento automático, la trazabilidad y las reglas que impiden vender de más.

---

## Estructura de archivos

```
prototipo/
├── index.html      Estructura y navegación
├── styles.css      Sistema de diseño (tokens, componentes, responsive)
└── js/
    ├── data.js     Datos de demostración
    ├── store.js    Núcleo: estado, inventario y movimientos
    ├── ui.js       Utilidades de interfaz
    ├── shop.js     Tienda: catálogo, carrito, checkout
    ├── admin.js    Panel administrativo (9 secciones)
    ├── compare.js  Análisis interactivo Shopify vs. plataforma propia
    └── app.js      Arranque y conmutación de vistas
```

El archivo a revisar primero es **`js/store.js`**: contiene toda la lógica de inventario,
en particular `applyMovement()` (única puerta de entrada al stock) y `placeOrder()`
(el flujo completo de venta).

---

## Compatibilidad

Chrome, Edge, Firefox y Safari actuales. Diseño responsive verificado en escritorio
(1440 px), tablet y móvil (375 px), sin desbordamiento horizontal. Respeta la preferencia
del sistema de reducir animaciones.
