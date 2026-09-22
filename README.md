# Soccer Cage — Inventario y ventas online
### Análisis de plataforma y prototipo funcional

Proyecto para resolver el problema de **control de inventario** de una empresa de Miami
que confecciona y comercializa uniformes de fútbol.

---

## Qué hay aquí

| Archivo | Qué contiene | Para quién |
|---|---|---|
| **[INFORME-Shopify-vs-Plataforma-Propia-COLOMBIA.md](INFORME-Shopify-vs-Plataforma-Propia-COLOMBIA.md)** | **Análisis para Colombia con costo MENSUAL, fuentes oficiales verificadas y cifras clasificadas** | Gerencia · decisión de inversión |
| **[ANALISIS-Shopify-vs-Plataforma-Propia.md](ANALISIS-Shopify-vs-Plataforma-Propia.md)** | Versión anterior, basada en **Miami/EE. UU.** — sus cifras de pasarelas no aplican a Colombia | Referencia |
| **[prototipo/index.html](prototipo/index.html)** | Prototipo navegable con **3 vistas: Tienda · Panel admin · Análisis interactivo**. Doble clic para abrirlo | Demostración en reunión |
| **[prototipo/README.md](prototipo/README.md)** | Guion de demostración de 5 minutos y prueba verificada del flujo | Quien presente la demo |

---

## La respuesta corta

**Sí, contratar Shopify.** Pero no por la razón que suele darse.

- **Shopify:** ~$5.200–11.600 el primer año. Operativo en semanas.
- **Plataforma propia:** ~$38.000–85.000 el primer año. Operativa en 3–6 meses.

El punto de equilibrio **no aparece hasta superar el millón de dólares en ventas online
anuales**. Con el volumen actual, desarrollar una plataforma propia cuesta entre 7 y 8
veces más y deja a la empresa medio año sin resolver el problema que tiene hoy.

**El matiz que importa:** Shopify es excelente vendiendo y mediocre fabricando. No maneja
telas, listas de materiales ni órdenes de producción. Para una empresa que confecciona,
eso se cubre con apps de pago que pueden costar más que la propia plataforma
(Katana: $299/mes).

### ¿Y si la construyo yo con ayuda de IA?

Escenario aparte, porque los $30.000–60.000 son el precio de **contratar a un tercero**.
Si el desarrollo es tiempo propio, ese dinero no sale de la caja:

| | Construirla tú | Shopify Grow |
|---|---:|---:|
| Efectivo año 1 | $4.911 – $5.451 | $4.956 |
| Acumulado 3 años | ~$14.253 | ~$14.868 |
| Tu tiempo | 120–260 h | — |

**La diferencia real es de ~$615 en tres años, no de decenas de miles.** El motivo: las
comisiones de pago ($4.656/año a $144k de ventas) dominan el coste, y la suscripción de
Shopify ($588/año) es casi ruido al lado. Por encima de ~$30.000/mes de ventas, Shopify
vuelve a ganar, porque su comisión por plan es menor que la tarifa estándar de Stripe.

Qué se paga exactamente al construirla tú: **dominio** $15/año (Namecheap), **hosting** $0
en Cloudflare o Netlify —Vercel prohíbe el uso comercial en su plan gratuito—, **base de
datos** Supabase $0 (500 MB, sin copias de seguridad) o $300/año (8 GB con copias), **SSL**
$0, **correo** $0 hasta ~3.000 envíos/mes y **Stripe** sin alta ni mensualidad. El
**asistente de IA** ($240/año) aparece porque es la herramienta con la que se construye; si
ya lo pagas para otras cosas, para el proyecto es $0.

**Dónde sí conviene construir:** el **módulo de producción** (telas, listas de materiales,
órdenes de taller), donde no existe alternativa asequible. Reconstruir el comercio
electrónico completo ahorra poco y añade mantenimiento permanente.

**Por eso la recomendación real es escalonada:**

1. **Ahora** — Shopify para vender y controlar producto terminado.
2. **En 12–18 meses** — evaluar un módulo propio de producción conectado por API
   (~$8.000–20.000), mucho más barato que una plataforma completa.
3. **Solo con volumen muy alto** — reconsiderar el desarrollo completo.

Dos avisos que conviene leer antes de firmar o configurar nada:

- **Los precios de Shopify varían** según país, moneda y promoción; las fuentes públicas
  se contradicen. Confírmelos en el panel con la cuenta real de la empresa.
- **La tributación de la ropa en Florida debe verificarse con un contador del estado.**
  Las fuentes consultadas discrepan sobre si aplica una exención a prendas de $75 o menos,
  y eso afecta directamente al precio de venta de camisetas y medias.

El análisis completo, con las tablas de costos y las fuentes, está en
[ANALISIS-Shopify-vs-Plataforma-Propia.md](ANALISIS-Shopify-vs-Plataforma-Propia.md).

---

## Para ver el prototipo ahora

Abra **`prototipo/index.html`** con doble clic. No requiere instalación ni internet.

Recorrido mínimo para comprobar que el inventario se descuenta de verdad:

1. Tienda → **Camiseta Halcones FC — Local 2026**
2. Talla **M** (muestra 15 unidades) → cantidad **2** → añadir al carrito
3. Finalizar compra → rellenar datos → pagar
4. La confirmación muestra: **15 → 13 (−2)**
5. **Ver en el panel admin** → el movimiento queda registrado con motivo, referencia,
   usuario y stock anterior/posterior

El guion completo de demostración está en
[prototipo/README.md](prototipo/README.md).

---

## Para presentar la decisión al gerente

Abre el prototipo y entra en la pestaña **Análisis** (`Alt + 3`).

Es la comparativa Shopify vs. plataforma propia, pero **interactiva**: mueve el deslizador
de ventas mensuales, cambia el plan de Shopify o activa la app de manufactura, y todas las
cifras se recalculan al instante con las tarifas reales publicadas.

Sirve para responder en vivo las tres preguntas que siempre salen en estas reuniones:

1. **«¿Cuánto cuesta realmente?»** → el desglose renglón por renglón, no un total opaco.
2. **«¿Y si crecemos?»** → sube las ventas y observa cómo se acercan las curvas.
3. **«¿Cuándo saldría a cuenta desarrollar?»** → el punto de equilibrio se calcula solo.

Con los supuestos actuales ($12.000/mes) la plataforma propia no se amortiza nunca. A
$600.000/mes con desarrollo optimista, el cruce aparece en el año 3. Que el modelo admita
ese escenario es justamente lo que hace creíble la recomendación.
