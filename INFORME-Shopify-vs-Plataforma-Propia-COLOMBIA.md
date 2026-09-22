# Shopify vs. plataforma propia — Análisis para Colombia
### Comparación de costo **mensual** de operación

**Fecha de consulta de todas las cifras:** 19–20 de septiembre de 2026
**Mercado analizado:** Colombia
**TRM de referencia:** $3.192,92 COP/USD (Banco de la República, vigente 19–21 sep 2026)

> **Cómo leer este informe.** Cada cifra económica lleva una etiqueta:
> 🟢 **OFICIAL** — tomada del sitio del proveedor · 🟡 **SECUNDARIA** — fuente reconocida,
> sin dato oficial accesible · 🔵 **ESTIMACIÓN** — cálculo con supuestos declarados.
> La comparación principal es **mensual**. La inversión inicial de desarrollo va en una
> sección separada y **no** se diluye en el costo mensual.

---

# 1. Resumen ejecutivo

### El hallazgo que cambia la comparación

🟢 **Shopify Payments NO está disponible en Colombia.** Colombia no figura en la lista
oficial de países soportados. Esto tiene tres consecuencias directas:

1. **Es obligatorio usar una pasarela externa** (Wompi, Bold, Mercado Pago, PayU…).
2. Por tanto, **siempre se paga el recargo de Shopify por proveedor externo**: 2% en Basic,
   1% en Grow, 0,6% en Advanced. Ese recargo **se suma** a la comisión de la pasarela.
3. Funciones que Shopify condiciona a Shopify Payments quedan fuera. Su propia página lo
   advierte junto a "Acepta métodos de pago locales": *"Requiere Shopify Payments"*.

En Colombia, entonces, **vender con Shopify cuesta dos comisiones por cada venta**; con
plataforma propia, una sola.

### Respuesta a la pregunta principal

Escenario base: **300 pedidos/mes, ticket promedio $150.000 COP → $45.000.000 COP/mes**.

| | Shopify (Grow) | Plataforma propia |
|---|---:|---:|
| **Costo fijo mensual** | ~$251.000 COP | ~$84.000 – $1.584.000 COP |
| **Comisiones variables** | ~$2.119.000 COP | ~$1.669.000 COP |
| **Total mensual** | **~$2.370.000 COP** | **~$1.753.000 – $3.253.000 COP** |

La diferencia mensual es modesta y **depende casi por completo del costo de mantenimiento**
que se asigne a la plataforma propia, no de la suscripción de Shopify.

**La inversión inicial de desarrollo — 🔵 $25.000.000 a $90.000.000 COP — es un concepto
aparte** y se detalla en la sección 7.

### Lo que decide realmente

El costo de suscripción de Shopify (~$203.000 COP/mes en Grow) es **el 10% del costo
mensual total**. El 90% son comisiones de pago, que ambas alternativas pagan. Por eso:

- Si la decisión se toma por **ahorro mensual**, la diferencia es pequeña y llega tras una
  inversión inicial grande.
- El argumento fuerte a favor de la plataforma propia **no es el precio de Shopify**, sino
  el recargo del 1–2% por pasarela externa, que en Colombia es inevitable y crece con las
  ventas.

---

# 2. Shopify

## 2.1 Planes y precios

🟢 **OFICIAL** — [shopify.com/co/precios](https://www.shopify.com/co/precios), consultado el 20/09/2026.

**Dato relevante: Shopify factura a Colombia en USD, no en pesos.** Esto traslada el riesgo
cambiario a la empresa.

| Plan | Mensual (USD) | Anual (USD/mes) | Equiv. COP* | **Con IVA 19%** | Recargo pasarela externa | Cuentas de personal |
|---|---:|---:|---:|---:|---:|---|
| Basic | 25 | 19 | $79.823 | **$94.989** | **2 %** | Ninguna adicional |
| Grow | 65 | 49 | $207.540 | **$246.972** | **1 %** | Hasta 5 |
| Advanced | 399 | 299 | $1.273.975 | **$1.516.030** | **0,6 %** | Hasta 15 |
| Plus | desde 2.300 | — | $7.343.716 | **$8.739.022** | 0,2 % | Ilimitadas |

\* 🔵 Conversión a TRM $3.192,92. La columna con IVA aplica el 19% de servicios digitales
del exterior 🟡. **No incluye la comisión de conversión de moneda del banco emisor (1–3%).**

### Discrepancia detectada y resuelta

Varias fuentes secundarias colombianas citan **Basic USD $39 y Shopify/Grow USD $105**.
La página oficial para Colombia muestra **$25 y $65** (facturación mensual).

**Qué uso y por qué:** los valores oficiales ($25 / $65 / $399), por prioridad de fuente.
🟡 Advertencia: las fuentes secundarias podrían reflejar precios anteriores o promociones
distintas. **Verifique el precio final en el panel con la cuenta real antes de contratar.**

## 2.2 Costos adicionales que no aparecen en la suscripción

| Concepto | Costo | Clasificación | Nota |
|---|---:|---|---|
| Tema | $0 (Dawn) o $180–500 pago único | 🟢 | Hay temas gratuitos oficiales |
| Dominio | ~$15 USD/año ≈ $4.000 COP/mes | 🔵 | Puede comprarse fuera de Shopify |
| **IVA servicios digitales** | **19 % sobre la suscripción** | 🟡 | Colombia grava servicios digitales del exterior desde 2018 |
| Conversión de moneda | 1 %–3 % del cargo | 🟡 | Depende del banco emisor; no es un cobro de Shopify |
| App de inventario avanzado | variable | 🟢 | Ver 2.4 |

**El IVA del 19% es un costo real que suele olvidarse.** Grow pasa de ~$207.500 a
**~$247.000 COP/mes** con IVA. 🔵

## 2.3 Funcionalidades de inventario incluidas

🟢 **OFICIAL** — página de precios de Shopify Colombia:

- **10 sucursales de inventario** en Basic, Grow y Advanced; 200 en Plus.
- Productos y **variantes** (talla, color) con **stock independiente por variante**.
- **Descuento automático de inventario al confirmarse el pago** (nativo).
- Catálogos ilimitados.
- **Más de 200 informes en tiempo real** (Advanced y superiores).
- APIs y webhooks documentados.
- Asistente de IA integrado.
- Atención 24/7 por chat, con ayuda local.

## 2.4 Límite importante: manufactura

Shopify es una plataforma de **comercio**, no de **producción**. De fábrica no gestiona:
materias primas, listas de materiales (BOM), órdenes de producción ni costeo por lote.

🟢 Además, **Shopify retiró Stocky**, su app gratuita de órdenes de compra y previsión: fue
removida de la App Store y su funcionalidad se trasladó parcialmente al panel nativo.
Hoy el reemplazo con capacidades de manufactura es de pago (por ejemplo, Katana, con plan
Core en torno a **USD $299/mes ≈ $955.000 COP/mes** 🟢).

**Para una empresa que fabrica, este renglón puede superar el costo del plan de Shopify.**

---

# 3. Colombia: condiciones específicas

| Aspecto | Situación | Clasificación |
|---|---|---|
| ¿Shopify disponible? | **Sí**, opera y tiene sitio localizado | 🟢 |
| ¿Shopify Payments? | **NO disponible** — Colombia no está en la lista oficial | 🟢 |
| Moneda de facturación | **USD**, no COP | 🟢 |
| Pasarela de pago | **Obligatoriamente externa** | 🟢 |
| Recargo por pasarela externa | 2% / 1% / 0,6% / 0,2% según plan | 🟢 |
| Métodos de pago locales | Vía pasarela (PSE, Nequi, botón Bancolombia) | 🟢 |
| IVA | 19% sobre servicios digitales del exterior | 🟡 |
| Riesgo cambiario | **Asumido por la empresa** (cobro en USD) | 🔵 |

> **Fuente clave:** [Países soportados por Shopify Payments](https://help.shopify.com/en/manual/payments/shopify-payments/supported-countries)
> — Colombia no aparece. Consultado el 20/09/2026.

---

# 4. Pasarelas de pago en Colombia

## 4.1 Wompi (Bancolombia)

🟢 **OFICIAL** — [wompi.com/es/co/planes-tarifas](https://wompi.com/es/co/planes-tarifas/), consultado el 20/09/2026.

| Concepto | Valor |
|---|---|
| Plan Avanzado (agregador) | **2,65% + $700 COP + IVA** por transacción exitosa |
| Cobertura de la tarifa | **Todos los medios**: tarjeta, PSE, Nequi, botón Bancolombia |
| Código QR | 1% |
| Desembolso | **Día hábil siguiente** a la venta |
| Plan Gateway | Sin comisión de Wompi; se paga la tarifa negociada con el banco. Requiere >2.000 transacciones |

**Ventaja estructural:** tarifa única para todos los métodos. Simplifica el cálculo.

## 4.2 Bold

🟢 **OFICIAL** — [bold.co/tarifas](https://bold.co/tarifas), consultado el 20/09/2026.

**La tarifa depende de cuándo se recibe el dinero.** Pagos en línea:

| Método | Día siguiente | Inmediato |
|---|---:|---:|
| Visa / Mastercard | **2,99% + $900** | 3,59% + $900 |
| Otras tarjetas | 3,29% + $900 | 3,59% + $900 |
| **PSE, Bancolombia, billeteras** | **2,89% + $900** | 3,59% + $900 |
| QR Online | 2,89% | 2,89% |
| Tarjetas internacionales | +1% adicional | +1% adicional |

Notas oficiales: PSE **sin retenciones**; ventas con QR sin retenciones ni impuestos;
tarifa especial negociable sobre $20 millones COP/mes.

## 4.3 Otras alternativas

🟡 **SECUNDARIA** — no obtuve la tarifa desde el sitio oficial; cifras de comparativas
sectoriales 2026. **Verificar antes de contratar.**

| Pasarela | Tarjeta de crédito | PSE |
|---|---|---|
| Mercado Pago | 3,29% + $800 (inmediato) / 2,79% + $800 (14 días) | 2,99% + $900 |
| PayU | 2,99% + IVA + $700 | 1,89% + $1.200 |

## 4.4 Comparación aplicada

Supuesto: **300 pedidos/mes de $150.000 COP** = $45.000.000 COP/mes. 🔵

| Pasarela | Cálculo | Comisión mensual |
|---|---|---:|
| Wompi Avanzado | (2,65% × 45M) + (300 × $700) + IVA 19% | **~$1.669.000** |
| Bold (día siguiente, tarjeta) | (2,99% × 45M) + (300 × $900) | ~$1.616.000 |
| Bold (día siguiente, PSE) | (2,89% × 45M) + (300 × $900) | ~$1.571.000 |

🔵 El IVA sobre la comisión de Wompi está incluido; en Bold la tarifa publicada no
desglosa IVA. **Consultar con el contador el tratamiento y la recuperación del IVA**, ya
que puede ser descontable y cambiar el costo efectivo.

## 4.5 Compatibilidad

| | Shopify | Plataforma propia |
|---|---|---|
| Wompi | Sí, vía app/integración | Sí, API documentada |
| Bold | Sí | Sí, API documentada |
| Mercado Pago / PayU | Sí | Sí |
| **Recargo adicional de Shopify** | **Sí: 1–2%** | **No aplica** |

**Este es el punto económico central del informe.**

---

# 5. Costo mensual comparado

## 5.1 Costos fijos mensuales

| Concepto | Shopify (Grow) | Plataforma propia | Clasif. |
|---|---:|---:|---|
| Suscripción | $207.500 (USD 65) | — | 🟢 |
| IVA 19% sobre suscripción | $39.400 | — | 🟡 |
| Hosting | Incluido | $0 – $80.000 | 🟢 |
| Base de datos | Incluida | $0 – $80.000 | 🟢 |
| Seguridad / SSL / PCI | Incluida | Incluido (SSL) + responsabilidad propia | 🟢 |
| Backups | Incluidos | $0 – $80.000 (incluido en plan pago de BD) | 🟢 |
| Correo transaccional | Incluido | $0 – $64.000 | 🟢 |
| Dominio (equivalente mensual) | $4.000 | $4.000 | 🔵 |
| Monitoreo | Incluido | $0 – $50.000 | 🔵 |
| **Mantenimiento técnico** | **Incluido** | **$0 – $1.500.000** | 🔵 |
| **Costo fijo mensual** | **~$251.000** | **~$4.000 – $1.858.000** | |

> **El renglón decisivo es el mantenimiento.** Con equipo propio ya contratado puede
> aproximarse a $0 en efectivo, pero **consume horas reales** (ver 7.2). Si se contrata
> soporte externo, 5–15 h/mes a $60.000–100.000 COP/h son **$300.000–1.500.000 COP/mes**. 🔵

**Infraestructura mínima viable (plataforma propia):** 🟢
- Hosting: Cloudflare Pages o Netlify — **$0** (ambos permiten uso comercial en plan gratuito;
  **Vercel Hobby lo prohíbe** expresamente).
- Base de datos: Supabase gratuito — **$0**, pero **sin copias de seguridad** y se pausa tras
  7 días de inactividad. Para una tienda real, el plan Pro (USD $25 ≈ $80.000 COP/mes) **no
  es opcional**.
- Dominio: ~$50.000 COP/año ≈ $4.000/mes.

## 5.2 Costos variables — escenario base

300 pedidos/mes · $150.000 COP · $45.000.000 COP mensuales · Wompi. 🔵

| Concepto | Shopify (Grow) | Plataforma propia |
|---|---:|---:|
| Comisión de pasarela | $1.669.000 | $1.669.000 |
| **Recargo Shopify por pasarela externa (1%)** | **$450.000** | **$0** |
| **Total variable** | **$2.119.000** | **$1.669.000** |

## 5.3 Total mensual

| | Shopify (Grow) | Plataforma propia (mínima) | Plataforma propia (con soporte) |
|---|---:|---:|---:|
| Fijo | $250.972 | $83.823 | $1.583.823 |
| Variable | $2.118.975 | $1.668.975 | $1.668.975 |
| **TOTAL MENSUAL** | **~$2.369.947** | **~$1.752.798** | **~$3.252.798** |

**Diferencia:** la plataforma propia ahorra **~$617.000 COP/mes** si el mantenimiento no
genera costo en efectivo; **cuesta ~$883.000 COP/mes más** si se paga soporte externo
($1.500.000 COP/mes).

> "Mínima" asume hosting gratuito (Cloudflare/Netlify), Supabase Pro ($80.000 COP/mes por
> las copias de seguridad, que no son opcionales en una tienda real) y dominio. El
> mantenimiento lo absorbe el equipo interno, sin salida de caja pero **consumiendo horas**.

---

# 6. Tabla comparativa principal

| Concepto | Shopify | Plataforma propia |
|---|---:|---:|
| Suscripción / infraestructura | $207.500/mes | $0 – $210.000/mes |
| IVA sobre suscripción | $39.400/mes | N/A |
| Aplicaciones / servicios | $0 – $955.000/mes (manufactura) | $0 – $64.000/mes |
| Hosting | Incluido | $0 – $80.000/mes |
| Base de datos | Incluida | $0 – $80.000/mes |
| Seguridad | Incluida (PCI gestionado) | Responsabilidad propia |
| Backups | Incluidos | $0 – incluido en plan pago |
| Mantenimiento | Incluido | $0 – $1.500.000/mes |
| Dominio | $4.000/mes equiv. | $4.000/mes equiv. |
| **Costo fijo mensual** | **~$251.000** | **~$4.000 – $1.858.000** |
| Comisión de pasarela | Variable (igual en ambas) | Variable (igual en ambas) |
| **Recargo por pasarela externa** | **1 % (Grow) — inevitable en Colombia** | **$0** |

---

# 7. Inversión inicial (concepto separado)

> **No se diluye en el costo mensual.** Se muestra aparte, como pediste.

## 7.1 Escenarios de desarrollo — 🔵 ESTIMACIÓN

Supuestos: tarifas del mercado colombiano 🟡 ($3–6 millones COP/mes para desarrollador;
freelance por proyecto complejo desde $6 millones). Equipo pequeño o desarrollador senior.

| Escenario | Alcance | Horas estim. | Costo estimado COP |
|---|---|---:|---:|
| **Básico** | Catálogo, carrito, checkout, 1 pasarela, panel simple | 300 – 500 | **$25.000.000 – $40.000.000** |
| **Intermedio** | + inventario con trazabilidad, roles, reportes, alertas, pruebas | 600 – 900 | **$45.000.000 – $70.000.000** |
| **Avanzado** | + módulo de producción, multi-bodega, integración contable | 1.000 – 1.500 | **$75.000.000 – $120.000.000** |

Para lo que describe el proyecto (inventario con trazabilidad + e-commerce + pagos +
panel), el escenario realista es el **intermedio**.

**Estas cifras son ESTIMACIONES, no cotizaciones.** Dependen de si se contrata agencia,
freelance o equipo interno, y de la experiencia del equipo.

## 7.2 Si lo desarrolla el equipo interno

Aunque el equipo ya esté contratado, **el costo existe**: son horas que no se dedican a
otra cosa (costo de oportunidad). Deben contabilizarse:

| Partida | Estimación |
|---|---|
| Horas de desarrollo | 400 – 800 h |
| Horas de diseño UX/UI | 60 – 120 h |
| Horas de pruebas (incluye concurrencia) | 80 – 150 h |
| Horas de implementación y despliegue | 40 – 80 h |
| Infraestructura durante el desarrollo | $0 – $160.000 COP/mes |

🔵 **Total: 580 – 1.150 horas.** A $50.000 COP/hora internos ≈ **$29.000.000 – $57.500.000 COP**
de valor de tiempo, aunque no salga de caja como factura.

## 7.3 Análisis complementario (opcional, NO reemplaza el costo mensual)

Solo como referencia financiera: amortizar $55.000.000 COP en 60 meses son ~$917.000
COP/mes. **Esto no es un costo de operación** y no debe sumarse a la tabla mensual; se
incluye únicamente para dimensionar la inversión.

---

# 8. Costos variables según volumen

Ticket promedio $150.000 COP · pasarela Wompi (2,65% + $700 + IVA) · Shopify Grow (recargo 1%). 🔵

| Pedidos/mes | Ventas COP | Comisión pasarela | Recargo Shopify | Shopify total variable | Propia total variable | Diferencia mensual |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | $15.000.000 | $556.000 | $150.000 | $706.000 | $556.000 | **$150.000** |
| 300 | $45.000.000 | $1.669.000 | $450.000 | $2.119.000 | $1.669.000 | **$450.000** |
| 500 | $75.000.000 | $2.781.000 | $750.000 | $3.531.000 | $2.781.000 | **$750.000** |
| 1.000 | $150.000.000 | $5.562.000 | $1.500.000 | $7.062.000 | $5.562.000 | **$1.500.000** |

**Lectura:** el recargo por pasarela externa **crece linealmente con las ventas**. A 1.000
pedidos mensuales son $1,5 millones COP/mes solo por ese concepto — más que la suscripción
de Advanced. En ese punto conviene evaluar subir a Advanced (recargo 0,6%) o desarrollar.

**Punto de indiferencia aproximado:** 🔵 a partir de ~500 pedidos/mes, el ahorro del recargo
($750.000/mes) supera un mantenimiento externo moderado, y la plataforma propia empieza a
tener sentido económico además de funcional.

---

# 9. Comparación funcional

| Capacidad | Shopify | Plataforma propia |
|---|---|---|
| Inventario por variante | ✅ Nativo | ✅ A medida |
| Descuento automático al pagar | ✅ Nativo | ✅ Requiere implementación correcta |
| Multi-bodega | ✅ 10 sucursales incluidas | ⚒ Hay que construirlo |
| Historial de movimientos | ◐ Ajustes, con menor detalle | ✅ Trazabilidad completa a medida |
| Alertas de bajo stock | ✅ | ✅ |
| Listas de materiales / producción | ❌ No nativo (app de pago) | ✅ A medida |
| Gestión de productos y variantes | ✅ Muy maduro | ✅ |
| Pedidos y clientes | ✅ Muy maduro | ✅ |
| Reportes | ✅ +200 en tiempo real | ⚒ Los que se construyan |
| Automatizaciones | ✅ Flow y apps | ⚒ A medida |
| Integraciones | ✅ Miles de apps | ⚒ Una por una |
| Personalización del checkout | ◐ Limitada salvo en Plus | ✅ Total |
| Escalabilidad técnica | ✅ Gestionada | ⚒ Responsabilidad propia |
| Seguridad y PCI | ✅ Gestionado | ⚒ Responsabilidad propia |
| Control de datos / propiedad | ❌ En Shopify | ✅ De la empresa |
| Propiedad del código | ❌ No | ✅ Sí |
| Dependencia de terceros | ⚠️ Alta | ⚠️ Media (pasarela, hosting) |
| Facilidad de administración | ✅ Alta | Depende del diseño |
| Tiempo de implementación | ✅ Semanas | ⚠️ 3 – 6 meses |
| Actualizaciones | ✅ Automáticas | ⚒ Manuales |

✅ Nativo/completo · ◐ Parcial · ⚒ Requiere construirlo · ❌ No disponible

### Riesgo técnico que merece mención

**Concurrencia en el inventario.** Si dos clientes compran la última unidad en el mismo
instante, un sistema mal construido vende ambas. Se resuelve con transacciones ACID y
bloqueo de filas (`SELECT ... FOR UPDATE` en PostgreSQL) y con **idempotencia en los
webhooks** de la pasarela: los proveedores reenvían notificaciones, y sin control por
`event_id` el inventario se descuenta dos veces por una sola venta. Shopify ya resuelve
esto; en desarrollo propio es responsabilidad del equipo y **debe probarse explícitamente**.

---

# 10. Ventajas y desventajas

## Shopify

**Ventajas**
- Operativo en semanas.
- Cumplimiento PCI y seguridad gestionados por el proveedor.
- Inventario por variante y descuento automático, nativos y probados.
- 10 sucursales de inventario incluidas.
- +200 informes en tiempo real.
- Sin responsabilidad de servidores, backups ni actualizaciones.
- Ecosistema de apps e integraciones muy amplio.
- Costo fijo bajo y predecible en pesos… salvo por el tipo de cambio.

**Desventajas**
- **Doble comisión en Colombia** (pasarela + recargo 1–2%).
- Facturación en USD → **riesgo cambiario no cubierto**.
- IVA del 19% sobre la suscripción.
- Débil en manufactura; la app que lo cubre puede costar más que el plan.
- Dependencia del proveedor: precios y reglas los fija Shopify (el retiro de Stocky lo ilustra).
- Los datos viven en un sistema de terceros.
- Personalización del checkout limitada fuera de Plus.

## Plataforma propia

**Ventajas**
- **Sin recargo por pasarela externa** — el ahorro estructural en Colombia.
- Ajuste exacto al proceso de la empresa, incluida la producción.
- Propiedad del código y de los datos.
- Sin riesgo cambiario si toda la infraestructura se paga en pesos o es gratuita.
- El costo fijo no crece automáticamente con las ventas.

**Desventajas**
- Inversión inicial alta (🔵 $25–90 millones COP).
- 3 – 6 meses sin resolver el problema actual.
- Seguridad, PCI, backups y disponibilidad pasan a ser responsabilidad propia.
- Dependencia de personas concretas (factor autobús).
- Mantenimiento permanente, no un proyecto que termina.
- Riesgo real de construir algo menos fiable que el producto comercial.

---

# 11. Riesgos

### Shopify

| Riesgo | Severidad | Comentario |
|---|---|---|
| **Riesgo cambiario** | **Alta** | Cobro en USD sin techo. Una subida del dólar sube el costo sin aviso |
| Incremento de precios | Media | Fijado unilateralmente por Shopify |
| **Doble comisión permanente** | **Alta** | Estructural en Colombia; crece con las ventas |
| Retiro de funciones | Media | Precedente real: Stocky fue descontinuado |
| Dependencia de apps | Media | Una app crítica puede subir de precio o cerrar |
| Portabilidad de datos | Media | Migrar implica reconstruir integraciones |

### Plataforma propia

| Riesgo | Severidad | Comentario |
|---|---|---|
| **Errores en concurrencia de inventario** | **Alta** | Vender stock inexistente el día de más ventas |
| **Mantenimiento no presupuestado** | **Alta** | Es el motivo más común de degradación |
| Seguridad | Alta | Vulnerabilidades, webhooks sin verificar, datos expuestos |
| Dependencia del equipo | Alta | Si la persona clave se va, nadie conoce el sistema |
| Sobrecosto de desarrollo | Media | Plazos y alcance suelen ampliarse |
| Backups no probados | Media | Un backup jamás restaurado no es un backup |
| Continuidad operativa | Media | Sin SLA ni soporte 24/7 |

---

# 12. Conclusiones

### En qué condiciones conviene Shopify

- Cuando **resolver el inventario es urgente** y no se pueden esperar 3–6 meses.
- Cuando **no hay equipo técnico permanente** ni presupuesto estable de mantenimiento.
- Con volúmenes **por debajo de ~300–500 pedidos/mes**, donde el recargo del 1% aún es
  modesto ($150.000–450.000 COP/mes).
- Cuando se valora no asumir seguridad, PCI, backups ni disponibilidad.
- Cuando se prefiere costo variable predecible a inversión inicial fuerte.

### En qué condiciones conviene la plataforma propia

- Cuando el volumen supera **~500 pedidos/mes**: el recargo por pasarela externa pasa de
  $750.000 COP/mes y el ahorro empieza a justificar el mantenimiento.
- Cuando la **manufactura es central** y las apps de Shopify que la cubren resultan
  prohibitivas (~$955.000 COP/mes).
- Cuando existe **capacidad técnica interna real**, no solo disponibilidad puntual.
- Cuando el **riesgo cambiario** de facturar en USD es un problema para la operación.
- Cuando la propiedad de los datos y del código es un requisito estratégico.

### Una tercera vía, probablemente la más razonable

No es obligatorio elegir un extremo: **Shopify como sistema de venta + un módulo propio de
producción conectado por API**. Shopify gestiona catálogo, ventas, pagos e inventario de
producto terminado; un sistema propio más pequeño (🔵 $15–35 millones COP, frente a
$45–70 millones de una plataforma completa) gestiona telas, listas de materiales y órdenes
de producción.

Esto evita reconstruir el comercio electrónico —donde Shopify es sólido— y ataca solo el
hueco real. Conviene evaluarla antes de decidir cualquiera de los extremos.

### Lo que no puedo afirmar con los datos disponibles

- **El costo exacto de mantenimiento mensual** de la plataforma propia: depende de
  decisiones internas de la empresa, no de tarifas públicas.
- **El precio final de Shopify tras impuestos y conversión**: hay discrepancia entre la
  página oficial ($25/$65) y fuentes secundarias colombianas ($39/$105). Debe confirmarse
  en el panel con la cuenta real.
- **Las tarifas de Mercado Pago y PayU**: no pude obtenerlas de la fuente oficial; las
  marcadas 🟡 deben verificarse antes de contratar.
- **El tratamiento del IVA** sobre comisiones y suscripción, y su recuperabilidad: es una
  consulta para el contador de la empresa y puede cambiar el costo efectivo.

---

## Fuentes consultadas

**Shopify**
- 🟢 [Precios Shopify Colombia](https://www.shopify.com/co/precios) — planes, recargos, cuentas de personal · 20/09/2026
- 🟢 [Países soportados por Shopify Payments](https://help.shopify.com/en/manual/payments/shopify-payments/supported-countries) — Colombia no incluida · 20/09/2026
- 🟢 [Stocky en la App Store](https://apps.shopify.com/stocky) — estado del producto · 20/09/2026

**Pasarelas de pago**
- 🟢 [Wompi — Planes y tarifas](https://wompi.com/es/co/planes-tarifas/) — 2,65% + $700 + IVA · 20/09/2026
- 🟢 [Bold — Tarifas](https://bold.co/tarifas) — tarifas por método y tiempo de desembolso · 20/09/2026
- 🟡 Comparativas sectoriales para Mercado Pago y PayU · 20/09/2026

**Macroeconomía y tributación**
- 🟢 [Banco de la República — TRM](https://suameca.banrep.gov.co/estadisticas-economicas/informacionSerie/1/tasa_cambio_peso_colombiano_trm_dolar_usd) — $3.192,92 COP/USD · 19–21/09/2026
- 🟡 IVA 19% sobre servicios digitales del exterior — fuentes tributarias colombianas · 20/09/2026

**Costos de desarrollo**
- 🟡 Rangos salariales y de tarifas freelance en Colombia · 20/09/2026

---

*Las cifras 🟢 provienen de sitios oficiales consultados el 19–20 de septiembre de 2026 y
pueden cambiar. Las 🔵 son estimaciones con supuestos declarados, no cotizaciones. La
tributación y la recuperabilidad del IVA deben confirmarse con un contador colombiano
antes de tomar la decisión.*
