# Shopify vs. plataforma propia
## Análisis para resolver el control de inventario de Soccer Cage (Miami, FL)

**Fecha del análisis:** 19 de septiembre de 2026
**Destinatario:** Gerencia
**Alcance:** decisión de plataforma para inventario + tienda online + pagos

---

## Resumen ejecutivo (léase primero)

**Recomendación: contratar Shopify.** Con la información disponible, es la opción correcta
para Soccer Cage hoy, y lo será durante bastante tiempo.

El razonamiento no es de precio, sino de riesgo. El problema real de la empresa no es que
le falte una tienda online: es que **no sabe cuántas unidades tiene de cada talla**. Ese
problema se resuelve con disciplina de datos y un sistema que descuente inventario
automáticamente. Shopify hace eso desde el primer día, por unos **$3.000–5.000 el primer
año**. Una plataforma propia hace lo mismo por **$28.000–58.000 el primer año**, y solo
después de tres a seis meses en los que la empresa seguiría sin control de inventario.

Hay un matiz importante, y conviene decirlo con claridad porque afecta la decisión a medio
plazo: **Shopify es excelente para vender y mediocre para fabricar.** Soccer Cage no es
solo una tienda; confecciona. Shopify no maneja de forma nativa materias primas, listas de
materiales ni órdenes de producción. Eso se cubre con una app del ecosistema, y ese es el
renglón donde el costo puede dispararse.

**La decisión práctica no es "Shopify o desarrollo propio". Es esta:**

1. **Ahora:** Shopify para vender y controlar producto terminado.
2. **En 12–18 meses:** evaluar si la gestión de producción (telas, corte, confección)
   justifica una herramienta específica.
3. **Solo si** el negocio crece hasta que las comisiones superen claramente el costo de
   mantener un equipo técnico, reconsiderar el desarrollo propio.

> **Nota sobre los precios de este informe.** Las tarifas de Shopify y de las pasarelas
> provienen de fuentes públicas consultadas en septiembre de 2026 (enlaces al final).
> Los precios de Shopify **varían según el país de facturación y las promociones
> vigentes**; las fuentes consultadas no coinciden entre sí. Antes de firmar, confirme
> las cifras en el panel de Shopify con la cuenta real de la empresa.
> Los costos de desarrollo propio son **estimaciones de mercado**, no cotizaciones.

---

# PARTE 1 — Investigación

## 1.1 Opción A — Shopify

### Planes y costos base

La página oficial de Shopify (consultada el 19/09/2026, facturación en USD) muestra:

| Plan | Mensual | Anual (por mes) | Cuentas de personal |
|---|---:|---:|---:|
| Basic | $25 | $19 | Sin cuentas adicionales |
| Grow | $65 | $49 | Hasta 5 |
| Advanced | $399 | $299 | Hasta 15 |
| Plus | Desde $2.300 | Variable | Ilimitadas |

**Advertencia sobre estas cifras.** Varias publicaciones especializadas citan para 2026
precios distintos (Basic $39, Grow $105 al mes). La diferencia se explica por país de
facturación, moneda y promociones. **Verifique el precio real para una empresa de Florida
antes de decidir.** Para este análisis uso los precios oficiales en USD, que son los más
favorables a Shopify; si el precio real fuese el más alto, la ventaja de Shopify se reduce
pero **no se revierte**.

Dato relevante para el presupuesto: el plan **Basic no incluye cuentas de personal
adicionales**. Si necesitan que el encargado de inventario y el de ventas tengan su propio
acceso —y lo necesitan, porque la trazabilidad exige saber quién movió qué— el plan
mínimo realista es **Grow**.

### Comisiones por transacción

Dos conceptos distintos que suelen confundirse:

**a) Procesamiento de tarjeta (Shopify Payments).** Para EE. UU., la tarifa habitualmente
citada es **2,9 % + $0,30** por venta online en Basic, con reducciones en planes
superiores (aproximadamente 2,7 % en Grow y 2,5 % en Advanced). Shopify no publica esta
tabla en su página de precios ni en su centro de ayuda: remite al panel del comerciante.
**Confírmela en el panel.**

**b) Recargo por pasarela externa.** Si usan otro procesador en lugar de Shopify Payments,
Shopify cobra un recargo adicional —dato sí publicado oficialmente—:

| Plan | Recargo por usar pasarela externa |
|---|---:|
| Basic | 2,0 % |
| Grow | 1,0 % |
| Advanced | 0,6 % |
| Plus | 0,2 % |

**Conclusión operativa:** con Shopify, use Shopify Payments. Usar Stripe por fuera implica
pagar la comisión de Stripe *más* el recargo de Shopify. Esto es una forma de dependencia
del proveedor y conviene tenerla presente.

### Capacidad de inventario: qué resuelve y qué no

**Lo que resuelve bien —y es justo lo que duele hoy:**

- Variantes por talla y color, con **stock independiente por combinación**. Es el modelo
  correcto: la unidad de inventario es "Camiseta / M / Azul", no "Camiseta".
- SKU por variante.
- **Descuento automático de inventario al confirmarse el pago.** Este es el punto central
  del encargo y Shopify lo cubre de forma nativa y fiable.
- Bloqueo de venta sin stock (configurable).
- Inventario multi-ubicación (tienda física, bodega, taller).
- Historial de ajustes de inventario.
- Reportes de ventas y de existencias.
- Roles y permisos según el plan.

**Límite importante y reciente:** Shopify **descontinuó Stocky**, su app gratuita de
órdenes de compra y previsión, que dejó de estar disponible en la App Store en febrero de
2026 y **deja de funcionar por completo el 31 de agosto de 2026**; sus APIs dejan de
responder y los datos no exportados se pierden. Shopify trasladó parte de esas funciones
(proveedores, órdenes de compra, recepciones, transferencias) al panel nativo, pero
análisis del sector coinciden en que **las capacidades de previsión y analítica de
planificación no se reemplazaron al mismo nivel**.

Esto es directamente relevante: significa que la funcionalidad de planificación de
reposición en Shopify hoy es **más débil que hace un año**, y que parte de lo que antes era
gratuito ahora se cubre con apps de pago.

**Lo que Shopify NO hace —y aquí está el punto débil para Soccer Cage:**

Shopify es una plataforma de **comercio**, no de **manufactura**. De fábrica no maneja:

- Materias primas (rollos de tela, hilo, transfers, números).
- Listas de materiales: cuánta tela consume una camiseta talla XL frente a una S.
- Órdenes de producción y estado del taller.
- Costeo real de producción por lote.
- Reserva de materiales para un pedido de club aún no confeccionado.

Para una empresa que **confecciona**, esto no es un detalle. Un pedido de 30 uniformes
personalizados para un club no es "descontar 30 unidades": es verificar tela, programar
corte y confección, y comprometer una fecha. Shopify por sí solo no lo modela.

**Solución:** apps del ecosistema. Katana Cloud Inventory, por ejemplo, cubre listas de
materiales, órdenes de producción y compras basadas en punto de reorden. Su plan gratuito
se limita a 30 SKU —insuficiente: el catálogo de la demo ya tiene más de 100— y el plan
**Core cuesta $299/mes**, con cobro adicional por volumen. **Este solo renglón multiplica
por varias veces el costo del plan de Shopify.**

Existen alternativas más económicas (sustitutos de Stocky desde ~$20/mes) que cubren
compras y reposición, pero no manufactura completa.

### Personalización y escalabilidad

- **Personalización del escaparate:** alta. Temas, Liquid, y control casi total del diseño.
- **Personalización del checkout:** limitada salvo en Plus. Para venta de uniformes esto
  importa: capturar dorsal, número y talla por jugador dentro del checkout tiene
  restricciones fuera de Plus, y suele resolverse con apps de campos personalizados.
- **Integraciones:** es la mayor fortaleza. Miles de apps, API bien documentada, webhooks
  fiables y conectores contables (QuickBooks, Xero).
- **Escalabilidad técnica:** no es su preocupación. Shopify absorbe los picos.
- **Escalabilidad económica:** aquí está el verdadero límite. El costo **crece con las
  ventas** por la comisión. Es una ventaja al principio y una desventaja con volumen alto.

### Ventajas y desventajas

**Ventajas**
- Operativo en días, no en meses.
- Cumplimiento PCI y seguridad gestionados por el proveedor.
- Sin responsabilidad de servidores, backups ni parches.
- Resuelve hoy el problema declarado: inventario por talla conectado a ventas.
- Costo inicial bajo y predecible.

**Desventajas**
- Comisión permanente sobre cada venta.
- Dependencia del proveedor: el precio y las reglas los fija Shopify (el caso Stocky lo
  demuestra: una herramienta gratuita desaparece y hay que sustituirla pagando).
- Débil en manufactura sin apps de pago.
- El costo de apps puede superar al de la plataforma.
- Los datos viven en un sistema ajeno.

---

## 1.2 Opción B — Plataforma propia

### Qué implica realmente

No es "una página web". Es construir y mantener:

| Componente | Detalle |
|---|---|
| Frontend tienda | Catálogo, carrito, checkout, responsive |
| Panel administrativo | Inventario, pedidos, clientes, reportes |
| Backend / API | Lógica de negocio, control de concurrencia |
| Base de datos | Modelo de productos, variantes, movimientos |
| Autenticación | Usuarios, roles, sesiones, recuperación |
| Integración de pagos | Stripe/PayPal, webhooks, reintentos |
| Correo transaccional | Confirmaciones, alertas |
| Infraestructura | Hosting, dominio, certificados, CDN |
| Seguridad | Cifrado, validación, protección de API, auditoría |
| Backups | Copias verificadas y probadas de restauración |
| Mantenimiento | Parches, dependencias, incidencias |

El punto que se subestima siempre: **el descuento de inventario debe ser correcto bajo
concurrencia.** Si dos clientes compran la última camiseta talla M en el mismo segundo, un
sistema mal construido vende ambas. Esto se resuelve con transacciones y bloqueos a nivel
de base de datos. Es un problema resuelto, pero hay que saber resolverlo —y probarlo.

### Costos estimados de desarrollo inicial

**Antes de las cifras, una distinción que cambia todo el análisis:** los montos de esta
tabla son el precio de **contratar a un tercero**. Si el desarrollo lo asume alguien de la
empresa —por ejemplo, construyéndolo con ayuda de una IA— ese renglón **no sale de la
caja**. Ver el apartado 1.2.bis para ese escenario, que es sustancialmente distinto.

Estimaciones de mercado para EE. UU. Varían mucho según se contrate freelance, agencia
local o equipo remoto.

| Escenario | Alcance | Costo inicial estimado |
|---|---|---:|
| **Pequeño** | Inventario + tienda simple + Stripe. Un desarrollador. | $12.000 – $25.000 |
| **Mediano** | Lo anterior + roles, reportes, alertas, panel completo, pruebas. | $30.000 – $60.000 |
| **Escalable** | Lo anterior + módulo de producción, multi-bodega, integración contable. | $70.000 – $150.000+ |

Para lo que Soccer Cage describe —inventario serio con trazabilidad, tienda, pagos y
panel— el escenario realista es el **mediano: $30.000–60.000**, con **3 a 6 meses** hasta
producción.

### Costos recurrentes anuales

| Concepto | Costo anual estimado | Nota |
|---|---:|---|
| Hosting aplicación | $150 – $900 | Render/Railway/Fly: ~$12–75/mes según plataforma y tráfico |
| Base de datos gestionada | $85 – $500 | Render desde ~$7/mes; Fly Managed Postgres desde $38/mes |
| Dominio | $15 – $40 | |
| Certificado SSL | $0 | Incluido en plataformas modernas |
| Almacenamiento de imágenes | $60 – $300 | S3/Cloudinary según volumen |
| Correo transaccional | $0 – $240 | Gratis en volúmenes bajos |
| Monitoreo y errores | $0 – $300 | |
| Backups | $50 – $300 | El costo real es *probar* la restauración |
| **Mantenimiento técnico** | **$3.600 – $18.000** | **El renglón decisivo: ver abajo** |
| **Total recurrente** | **$4.000 – $20.500** | |

**Sobre el mantenimiento.** Es el costo que más se subestima y el que hunde estos
proyectos. Un sistema que cobra dinero no puede quedar sin mantenimiento: dependencias con
vulnerabilidades, cambios de API en Stripe, un webhook que falla de madrugada. Esto
significa entre **5 y 15 horas mensuales** de un desarrollador ($60–100/hora), o un
retainer. Si la empresa no presupuesta esto, el sistema se degrada y termina siendo menos
fiable que el Excel que reemplazó.

**Riesgo de continuidad, que no aparece en ninguna tabla:** si quien construye el sistema
deja de estar disponible, la empresa queda con un sistema que nadie más conoce. Con
Shopify, cualquier profesional del mercado puede continuar el trabajo.

### Ventajas y desventajas

**Ventajas**
- Sin comisión de plataforma (solo la pasarela).
- Ajuste exacto al flujo de confección.
- Propiedad total de datos y código.
- Sin límites de personalización.
- El costo no crece automáticamente con las ventas.

**Desventajas**
- Inversión inicial 10–20 veces mayor.
- 3–6 meses sin resolver el problema actual.
- Responsabilidad total de seguridad y disponibilidad.
- Dependencia de personas concretas.
- Riesgo real de terminar en un sistema peor que el producto comercial.

---

## 1.2.bis — Opción C: construirla internamente con ayuda de IA

Este escenario no estaba en el análisis original y **cambia las cifras de forma
sustancial**, así que merece su propio apartado.

### Qué desaparece y qué queda

El renglón de $30.000–60.000 es mano de obra de terceros. Si el desarrollo lo asume alguien
de la empresa, ese dinero no se gasta: **se convierte en tiempo propio**. Lo que sigue
saliendo de la caja son las herramientas.

| Concepto | Proveedor concreto | Gratis | De pago | Qué cambia al pagar |
|---|---|---:|---:|---|
| Dominio | Namecheap, Porkbun | — | $12–15/año | Nada: es obligatorio |
| Hosting | Cloudflare Pages, Netlify | $0 | $240/año | Más ancho de banda y builds |
| Base de datos | Supabase (PostgreSQL) | $0 | $300/año | 500 MB → 8 GB y **copias de seguridad** |
| Certificado SSL | Incluido | $0 | — | — |
| Correo transaccional | Resend, Brevo | $0 | desde $240/año | Más de ~3.000 correos/mes |
| Pasarela de pago | Stripe | $0 | — | Sin alta ni mensualidad |
| Asistente de IA | Claude Pro, ChatGPT Plus, Cursor | — | $240/año | **Es la herramienta con la que se construye** |
| **Total** | | **$15/año** | **~$1.035/año** | Sin contar comisiones |

**Tres aclaraciones sobre esta tabla:**

1. **Por qué aparece el asistente de IA.** No es infraestructura del sistema: es la
   herramienta con la que se escribe el código, el equivalente a la mano de obra. Se
   incluye para no ocultar un gasto real del escenario. Dos matices: solo hace falta
   mientras se construye y para el mantenimiento posterior, y **si ya se paga para otros
   usos, el coste marginal del proyecto es $0**.

2. **La base de datos gratuita tiene una limitación seria.** El plan gratuito de Supabase
   **no incluye copias de seguridad** y pausa el proyecto tras 7 días de inactividad. Para
   una tienda que registra pedidos reales, esos $25/mes del plan Pro no son opcionales:
   son el precio de no perder el historial de ventas.

3. **El hosting gratuito tiene una restricción legal.** El plan Hobby de Vercel está
   limitado a *"non-commercial personal use only"* y define como comercial *"cualquier
   método de solicitar o procesar pagos"*. Cloudflare Pages y Netlify **sí** permiten uso
   comercial en su tramo gratuito.

**Advertencia relevante sobre el hosting.** La documentación de Vercel restringe su plan
gratuito a *"non-commercial personal use only"* y define como uso comercial *"cualquier
método de solicitar o procesar pagos"*. Una tienda online no cabe ahí: habría que pasar a
Vercel Pro ($20/mes) o usar Cloudflare Pages / Netlify, que sí permiten comercio en su
tramo gratuito.

### El resultado, con las comisiones incluidas

Supuestos: $12.000/mes de ventas, ticket medio $90.

| Concepto | Construirla tú | Shopify Grow |
|---|---:|---:|
| Desarrollo | **$0** (120–260 h propias) | $0 |
| Puesta en marcha | $15 (dominio) | **$0** con tema gratuito Dawn |
| Suscripción / herramientas anuales | $255 – $1.035 | $588 |
| Comisiones de pago | $4.656 | $4.368 |
| **Efectivo año 1** | **$4.911 – $5.451** | **$4.956** |
| **Efectivo año 2+** | **$4.671 – $5.451** | **$4.956** |
| **Acumulado a 3 años** | **~$14.253** | **~$14.868** |

> **Corrección respecto a una versión anterior de este informe.** Antes figuraban $1.500 de
> "puesta en marcha" de Shopify. Esa cifra **no tenía fuente**: la puse como estimación de
> tema más configuración. Lo verificable es que Shopify incluye temas gratuitos (Dawn, el
> oficial) y que los temas de pago del Theme Store cuestan **entre $180 y $500 en un único
> pago**. Con tema gratuito, la puesta en marcha es **$0**. Aquella estimación inflaba el
> coste de Shopify y distorsionaba la comparación; con el dato real, **las dos opciones
> quedan prácticamente empatadas**.

**La conclusión es aún menos espectacular de lo que parecía: unos $615 de diferencia
en tres años.** Y el motivo importa: **las comisiones de pago dominan el coste**. A
$144.000 de ventas anuales, Stripe se lleva $4.656 y Shopify Payments $4.368 — la
suscripción de Shopify ($588/año) es casi ruido al lado de eso.

Conviene además notar que **a mayor volumen Shopify vuelve a ganar**, porque su comisión
por plan es más baja que la tarifa estándar de Stripe:

| Ventas al mes | Construirla tú (3 años) | Shopify (3 años) | Gana |
|---|---:|---:|---|
| $12.000 | $14.253 | $16.368 | Hacerlo tú, por ~$2.100 |
| $30.000 | $35.205 | $36.024 | Empate técnico |
| $60.000 | $70.125 | $68.784 | **Shopify** |

### Lo que no aparece en ninguna factura

Aquí es donde se decide de verdad, y conviene mirarlo sin optimismo:

1. **Coste de oportunidad.** 120–260 horas son de 3 a 6 semanas a jornada completa. Si esas
   horas podrían dedicarse a vender o producir uniformes, el ahorro real es menor.

2. **El mantenimiento no termina.** Un sistema que cobra dinero necesita atención continua:
   dependencias con vulnerabilidades, cambios en la API de Stripe, un webhook caído de
   madrugada. Ese trabajo no se delega: sigue siendo propio, indefinidamente.

3. **Cumplimiento y seguridad se trasladan a la empresa.** Con Shopify, el cumplimiento PCI
   y la seguridad del checkout son responsabilidad de Shopify. Con plataforma propia son de
   la empresa, aun usando Stripe para no tocar datos de tarjeta.

4. **Factor autobús.** Si la persona que lo construyó no está disponible, nadie más conoce
   el sistema. Con Shopify, cualquier profesional del mercado puede continuar mañana.

### Cuándo sí tiene sentido esta vía

- Cuando el tiempo propio está **realmente disponible** y no desplaza trabajo que genera ingresos.
- Cuando se asume el mantenimiento como responsabilidad permanente, no como proyecto que termina.
- Cuando lo que se necesita **no existe en Shopify** — y aquí está el caso fuerte: el
  **módulo de producción** (telas, listas de materiales, órdenes de taller). Ese componente
  no compite con Shopify; cubre justo lo que Shopify no hace.

**Recomendación matizada:** construir con IA tiene mucho sentido para el **módulo de
producción**, donde no hay alternativa comercial asequible (Katana cuesta $299/mes). Tiene
bastante menos sentido para reconstruir el comercio electrónico completo, donde el ahorro
es de ~$700/año y el trabajo de mantenimiento es permanente.

---

## 1.3 Comparación de costos

Supuestos: catálogo de ~100 SKU, **$12.000/mes de ventas online** (≈$144.000/año),
ticket medio $90 (≈133 pedidos/mes), 2 usuarios administrativos. Shopify en plan **Grow**
con Shopify Payments.

### Tabla comparativa solicitada

| Concepto | Shopify (Grow) | Plataforma propia |
|---|---:|---:|
| Implementación inicial | $0 – $3.000 (tema + configuración) | $30.000 – $60.000 |
| Mensualidad | $49/mes anual · $65/mes mensual | $0 (no hay licencia) |
| Hosting | Incluido | $150 – $900/año |
| Base de datos | Incluida | $85 – $500/año |
| Pasarela de pago | Incluida (Shopify Payments) | $0 de alta (Stripe) |
| Comisiones por transacción | ~2,7 % + $0,30 ≈ **$4.368/año** | 2,9 % + $0,30 ≈ **$4.656/año** |
| Apps / servicios adicionales | $240 – $3.600/año (según manufactura) | $60 – $840/año |
| Mantenimiento | Incluido | $3.600 – $18.000/año |
| Seguridad | Incluida (PCI gestionado) | Responsabilidad propia |
| Escalabilidad | Automática | Requiere trabajo e inversión |
| Personalización | Alta en tienda, limitada en checkout | Total |
| **Costo estimado año 1** | **$5.200 – $11.600** | **$38.000 – $85.000** |
| **Costo estimado a 3 años** | **$15.500 – $34.800** | **$46.000 – $124.000** |

> El costo de Shopify incluye la comisión, que **crece con las ventas**. El de plataforma
> propia incluye la comisión de Stripe, que también crece, más un mantenimiento **fijo**
> que se paga vendan mucho o poco.

### Tres escenarios de volumen

| Ventas anuales online | Shopify (año, todo incluido) | Propia (año 2+, ya construida) | ¿Cuál conviene? |
|---|---:|---:|---|
| $60.000 | ~$3.400 | ~$6.500 – $20.000 | **Shopify, con claridad** |
| $144.000 | ~$6.500 | ~$9.000 – $23.000 | **Shopify** |
| $500.000 | ~$17.500 | ~$19.000 – $33.000 | **Shopify sigue ganando o empata** |
| $1.500.000 | ~$47.000 | ~$30.000 – $50.000 | **Se empareja; evaluar propia** |

**Lectura honesta de esta tabla:** el punto de equilibrio no aparece a $144.000 de ventas
ni cerca. Aparece **por encima del millón de dólares anuales en ventas online**, y aun así
la plataforma propia solo gana si la empresa ya tiene capacidad técnica interna. Es decir:
la plataforma propia se justifica por **necesidad funcional** (manufactura), no por ahorro.

---

## 1.4 Pasarelas de pago para una empresa en Miami

### Opciones y comisiones (tarifas públicas, septiembre 2026)

| Pasarela | Comisión online EE. UU. | Notas |
|---|---|---|
| **Stripe** | 2,9 % + $0,30 | +1,5 % tarjetas internacionales; +1 % conversión. ACH 0,8 % (tope $5). Disputa: $15 |
| **PayPal (Checkout)** | 3,49 % + $0,49 | Tarifa oficial vigente desde el 01/09/2026 |
| **PayPal (tarjeta avanzada)** | 2,89 % + $0,29 | Contracargo: $20 |
| **Shopify Payments** | ~2,9 % + $0,30 (Basic) | Verificar en panel; evita el recargo de Shopify |

**Recomendación:** **Stripe como procesador principal**, por tarifa, calidad de API y
documentación. **PayPal como método adicional** —algunos clubes y padres de familia lo
prefieren, y su ausencia cuesta ventas— aceptando que es más caro por transacción.
**Si se contrata Shopify, use Shopify Payments** para no pagar el recargo por pasarela
externa. Para pedidos grandes de clubes ($1.000+), ofrecer **ACH**: 0,8 % con tope de $5
frente a ~$29 de tarjeta en un pedido de $1.000.

### Aspectos técnicos que importan

- **Webhooks:** el pago se confirma por webhook del proveedor, **nunca** por la respuesta
  del navegador. El cliente puede cerrar la pestaña. El prototipo simula este orden.
- **Idempotencia (pagos duplicados):** cada operación lleva una clave única y los webhooks
  se registran por `event_id`. Los proveedores **reenvían** webhooks; sin esta protección
  se descuenta inventario dos veces por una sola venta.
- **Pagos fallidos:** no se crea pedido ni se descuenta inventario.
- **Reembolsos:** un reembolso debe decidir explícitamente si devuelve stock. El prototipo
  lo hace al cancelar: repone unidades y deja el movimiento registrado.
- **Seguridad:** los datos de tarjeta nunca tocan el servidor propio. Se usa el formulario
  del proveedor (Stripe Checkout o Elements) y el servidor solo ve un token.

### Cumplimiento legal y fiscal

Verificado con cuidado, porque aquí es fácil afirmar de más:

**Sí aplica con seguridad:**

- **PCI DSS.** Aplica a cualquiera que acepte tarjetas. Usando Stripe Checkout o Elements,
  la empresa califica para el cuestionario más simple (**SAQ A**), el de menor carga.
  Matiz importante: incluso con SAQ A, **el comerciante sigue siendo responsable** de los
  requisitos 6.4.3 y 11.6.1 (inventario de scripts y detección de manipulación en la
  página de pago). Además, **si se cargan scripts propios —Google Tag Manager, píxeles de
  publicidad, analítica— en la página de pago, puede perderse la elegibilidad para SAQ A**.
  Es un error frecuente. Con Shopify, esta carga recae mayormente en Shopify.

- **Impuesto sobre las ventas de Florida.** Tasa estatal del **6 %** más recargo
  discrecional del condado. Hay **nexo económico a partir de $100.000** en ventas
  gravables remotas hacia Florida, medido contra el año calendario anterior, sin umbral de
  número de transacciones. Como la empresa **está físicamente en Miami**, tiene nexo
  físico y **debe registrarse y cobrar desde la primera venta en Florida**,
  independientemente del umbral.

  **Punto que exige verificación profesional:** las fuentes consultadas **se contradicen**
  sobre la tributación de ropa en Florida. Algunas indican que la ropa tributa a tasa
  normal; otras mencionan legislación reciente que eliminaría el impuesto sobre ropa y
  calzado de **$75 o menos**. Dado que **esto afecta directamente el precio de venta de
  camisetas y medias**, la empresa **debe confirmarlo con un contador de Florida antes de
  configurar los impuestos**. No configure la tienda basándose en este informe para este
  punto concreto.

- **Ventas a otros estados.** Cada estado tiene su propio umbral de nexo económico. Al
  crecer la venta fuera de Florida, hará falta un servicio de cálculo automático (Shopify
  Tax, Avalara o TaxJar).

**Depende del modelo de negocio —no asumir que aplica:**

- **CCPA/CPRA (California).** Solo si se superan ciertos umbrales de ingresos o volumen de
  datos de residentes de California. Una PYME local probablemente **no** califica al
  principio.
- **GDPR (Europa).** Solo si se vende o se dirige comercialmente a la UE. Vendiendo solo
  en EE. UU., **no aplica**.
- **Accesibilidad (ADA).** Existe litigio activo sobre sitios comerciales en EE. UU.
  Conviene seguir buenas prácticas WCAG por prudencia legal y porque mejora la usabilidad.

**Siempre recomendable:** política de privacidad, términos de venta, y política de
devoluciones **explícita sobre productos personalizados** —un uniforme con el nombre de un
jugador no es revendible, y eso debe estar escrito antes del primer conflicto.

---

## 1.5 ¿En qué escenario conviene cada opción?

### Shopify tiene sentido cuando…

- El problema urgente es **control de inventario y ventas**, no manufactura. ✔ *Es el caso*
- No hay equipo técnico interno permanente. ✔ *Es el caso*
- Se quiere operar en semanas. ✔ *Es el caso*
- Las ventas online están por debajo de ~$500.000/año. ✔ *Presumiblemente el caso*
- Se prefiere costo variable predecible a inversión inicial fuerte. ✔ *Probablemente*

### La plataforma propia tiene sentido cuando…

- La **manufactura** es el centro del negocio y el costo de apps especializadas se vuelve
  prohibitivo. ⚠ *Posible en el futuro*
- Las ventas superan el millón anual y la comisión pesa más que un equipo técnico. ✘ *No hoy*
- Existe un proceso propio que ningún producto comercial modela. ⚠ *Parcialmente*
- Hay capacidad técnica interna o presupuesto estable de mantenimiento. ✘ *No consta*
- Los datos de inventario son un activo estratégico que no puede vivir en terceros. ✘ *No hoy*

**Conclusión:** de diez criterios, Shopify cumple claramente los de la situación actual.
La plataforma propia responde a escenarios que **aún no se han materializado**.

### Una tercera vía, que probablemente sea la mejor

No es obligatorio elegir un extremo:

**Shopify como tienda y sistema de registro + un módulo propio de producción que consuma
su API.** Shopify gestiona catálogo, ventas, pagos e inventario de producto terminado. Un
sistema propio pequeño —mucho más barato que una plataforma completa, del orden de
**$8.000–20.000**— gestiona telas, listas de materiales y órdenes de producción,
sincronizando contra Shopify por API.

Esto da lo mejor de ambos: nada de reinventar el comercio electrónico, y control real
sobre lo que sí es específico de Soccer Cage. **Es la ruta que recomiendo evaluar en la
segunda fase.**

---

# PARTE 2 — Arquitectura recomendada

Esta sección describe cómo se construiría la solución propia, tanto por si se elige esa
vía como porque **el módulo de producción de la tercera vía usaría esta misma
arquitectura**.

## 2.1 Stack propuesto

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | React o Next.js + TypeScript | Tipado que evita errores en lógica de inventario |
| Backend | Node.js + NestJS, o Python + Django | Ecosistema maduro, buen soporte de Stripe |
| Base de datos | **PostgreSQL** | **Transacciones ACID: innegociable para stock** |
| Caché | Redis | Sesiones y limitación de peticiones |
| Almacenamiento | S3 o Cloudflare R2 | Imágenes de producto |
| Pagos | Stripe (+ PayPal) | API y webhooks fiables |
| Correo | Resend o SendGrid | Confirmaciones y alertas |
| Hosting | Render, Railway o Fly.io | Gestionado, sin administrar servidores |

**Sobre PostgreSQL:** no es una preferencia estética. El control de inventario correcto
exige transacciones reales y bloqueo de filas (`SELECT ... FOR UPDATE`). Una base sin
garantías transaccionales fuertes **venderá stock que no existe** bajo concurrencia.

## 2.2 Modelo de datos

La decisión estructural más importante: **el stock vive en la variante, nunca en el
producto.**

```
products          (id, name, sku_base, category_id, description,
                   price, cost, min_stock, active, made_to_order)

variants          (id, product_id, sku UNIQUE, size, color, color_hex,
                   stock, reserved, price_delta)
                   ── el stock real vive aquí ──

inventory_moves   (id, variant_id, type, qty, reason, reference,
                   stock_before, stock_after, user_id, created_at)
                   ── libro inmutable: nunca se edita ni se borra ──

orders            (id, number UNIQUE, customer_id, status, payment_status,
                   subtotal, shipping, tax, total, created_at)

order_items       (id, order_id, variant_id, sku_snapshot, name_snapshot,
                   qty, unit_price)
                   ── copia el nombre y precio del momento de la venta ──

customers         (id, name, email UNIQUE, phone, city, type)
payments          (id, order_id, provider, provider_payment_id UNIQUE,
                   amount, status, raw_payload)
users             (id, name, email UNIQUE, password_hash, role)
webhook_events    (id, provider, event_id UNIQUE, processed_at)
                   ── la clave contra pagos duplicados ──
```

Tres decisiones que conviene señalar:

1. **`inventory_moves` es un libro contable, no un registro editable.** Solo se añade.
   Si hubo un error, se corrige con un movimiento compensatorio, igual que en
   contabilidad. Así la trazabilidad resiste una auditoría.

2. **`order_items` guarda copia del nombre y el precio.** Si mañana sube el precio de la
   camiseta, la factura del año pasado debe seguir mostrando lo que se cobró entonces.

3. **`webhook_events.event_id` es único.** Es lo que impide descontar inventario dos veces
   cuando Stripe reenvía un webhook.

## 2.3 El flujo crítico: de pago confirmado a inventario descontado

Este es el corazón del sistema. Debe ejecutarse **dentro de una sola transacción**:

```
1. Llega webhook de Stripe: payment_intent.succeeded
2. Verificar la FIRMA del webhook          → si falla, rechazar
3. ¿Ya existe este event_id?                → si sí, responder 200 y NO repetir nada
4. INICIAR TRANSACCIÓN
     a. Bloquear las filas de variantes     (SELECT ... FOR UPDATE)
     b. Revalidar stock de cada línea       → si falta, revertir y alertar
     c. Crear el pedido y sus líneas
     d. Descontar stock de cada variante
     e. Insertar un movimiento por línea    (con stock anterior y posterior)
     f. Registrar el pago
     g. Guardar el event_id como procesado
   CONFIRMAR TRANSACCIÓN
5. Fuera de la transacción: enviar correo, emitir alertas de stock bajo
```

El paso 4a es el que evita vender dos veces la última camiseta. El paso 3 es el que evita
descontar dos veces por un reenvío. **Sin estos dos pasos, el sistema falla justo el día
de más ventas**, que es cuando hay concurrencia real.

## 2.4 Seguridad

| Área | Medida |
|---|---|
| Transporte | HTTPS obligatorio, HSTS |
| Contraseñas | Hash con bcrypt o Argon2. **Nunca texto plano ni MD5/SHA1** |
| Sesión | JWT de vida corta + refresh token, o cookies `HttpOnly` + `Secure` |
| Roles | Administrador / Inventario / Ventas / Solo lectura, verificados **en el servidor** |
| API | Rate limiting, CORS restrictivo, paginación obligatoria |
| Validación | Validación de esquema en el servidor. **Nunca confiar en el navegador** |
| Inyección SQL | ORM o consultas parametrizadas, sin excepción |
| XSS | Escapar toda salida; CSP estricta |
| Webhooks | Verificación de firma + idempotencia por `event_id` |
| Tarjetas | **Nunca almacenarlas.** Tokenización en el proveedor |
| Backups | Diarios automáticos + **prueba de restauración trimestral** |
| Auditoría | Registro de accesos y de cambios sensibles |
| Secretos | En variables de entorno o gestor de secretos, **jamás en el repositorio** |

Sobre backups: un backup que nunca se ha restaurado no es un backup, es una suposición.
La prueba trimestral es lo que convierte el archivo en una garantía.

---

# PARTE 3 — Prototipo

Ver [`prototipo/index.html`](prototipo/index.html). Documentación completa en
[`prototipo/README.md`](prototipo/README.md).

Se abre directamente con doble clic, sin instalar nada y sin conexión a internet.

---

# PARTE 4 — Prueba del flujo

Ver el apartado "Prueba del flujo" en el README del prototipo, con el resultado verificado
de la compra que modifica el inventario.

---

# PARTE 5 — Próxima fase

Qué faltaría para convertir el prototipo en plataforma real, si se toma esa vía:

| # | Componente | Descripción | Esfuerzo |
|---|---|---|---|
| 1 | Backend + API | Servicios REST, lógica de negocio, validación | 4–6 semanas |
| 2 | Base de datos | PostgreSQL con el esquema de 2.2, migraciones, índices | 1–2 semanas |
| 3 | Autenticación y roles | Login, sesiones, recuperación, permisos por rol | 1–2 semanas |
| 4 | Pasarela real | Stripe Checkout, webhooks firmados, idempotencia | 2–3 semanas |
| 5 | Panel conectado | Sustituir `localStorage` por llamadas a la API | 2–3 semanas |
| 6 | Correos | Confirmación, cambio de estado, alertas de stock | 1 semana |
| 7 | Imágenes | Carga y optimización en S3/R2 | 1 semana |
| 8 | Hosting y dominio | Despliegue, SSL, entorno de pruebas separado | 1 semana |
| 9 | Seguridad | Rate limiting, CSP, auditoría, revisión externa | 2 semanas |
| 10 | Backups | Copias automáticas y **restauración probada** | 3 días |
| 11 | Analítica | GA4 o Plausible, embudo de conversión | 3 días |
| 12 | Integraciones | Contabilidad, envíos, etiquetas | 2–3 semanas |
| 13 | Pruebas | Unitarias, integración y **pruebas de concurrencia** | Transversal |

**Total estimado: 4–6 meses** de un desarrollador con experiencia, o 2–3 meses de un
equipo pequeño.

La partida 13 merece énfasis: las pruebas de concurrencia —simular compras simultáneas de
la última unidad— son las que separan un sistema que funciona en la demostración de uno
que funciona en Black Friday.

---

## Fuentes consultadas (septiembre de 2026)

**Shopify**
- [Página oficial de precios](https://www.shopify.com/pricing) — planes, recargos por pasarela externa, cuentas de personal
- [Tarifas de Shopify Payments por tipo de tarjeta](https://help.shopify.com/en/manual/payments/shopify-payments/transactions/credit-card-rates)
- [Migración de Stocky a la gestión nativa](https://help.shopify.com/en/manual/products/inventory/transitioning-from-stocky)
- [Aviso de cierre de Stocky en la comunidad Shopify](https://community.shopify.com/t/stocky-app-going-away-after-august-31-2026/587292)
- [Katana Cloud Inventory en la App Store](https://apps.shopify.com/katana-mrp-manufacturing-and-inventory-management) — planes y capacidades de manufactura
- [Análisis del cierre de Stocky y alternativas](https://www.inflowinventory.com/blog/stocky-shopify-app-sunsetting/)

**Pasarelas de pago**
- [Tarifas comerciales de PayPal EE. UU.](https://www.paypal.com/us/business/paypal-business-fees) — vigentes desde el 01/09/2026
- [Tarifas de Stripe 2026](https://checkoutpage.com/blog/stripe-processing-fees)

**Cumplimiento**
- [Alcance PCI con Stripe: requisitos 6.4.3 y 11.6.1](https://cside.com/blog/does-stripe-make-you-pci-compliant-6-4-3-11-6-1)
- [Nexo económico en Florida](https://www.nexusrules.com/florida-sales-tax-nexus)
- [Impuesto sobre ropa en Florida (Stripe)](https://stripe.com/resources/more/florida-sales-tax-on-clothing) — **fuentes contradictorias: verificar con contador**

**Infraestructura**
- [Comparativa de precios Railway / Render / Fly.io](https://bex.co/blog/2026/09/06/railway-vs-render-vs-flyio-reaudit)

---

*Los precios de Shopify y de las pasarelas provienen de fuentes públicas consultadas el
19/09/2026 y pueden variar por país, moneda y promoción. Los costos de desarrollo son
estimaciones de mercado, no cotizaciones. La tributación de ropa en Florida debe
confirmarse con un contador certificado del estado antes de configurar impuestos.*
