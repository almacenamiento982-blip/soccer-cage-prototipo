# Auditoría integral y preparación para producción
## Plataforma de inventarios y tiendas Soccer Cage

Fecha de la auditoría: 2 de octubre de 2026. Versión auditada: commit `422a094` del repositorio
`soccer-cage-prototipo` más las correcciones descritas en la sección 15. Moneda: USD.

---

## 1. Veredicto en una página

**La plataforma no está lista para producción.** Funciona bien como prototipo (toda la lógica
de negocio acordada existe y las pruebas la confirman), pero los datos viven en el navegador de
cada persona, no hay inicio de sesión ni permisos reales, y no existe copia de seguridad. Nada
de eso se arregla "ajustando" el prototipo: hace falta una base de datos central con reglas en
el servidor.

Lo que sí se conserva tal cual: la interfaz (tienda, panel, móvil, dos idiomas), las reglas de
negocio ya probadas (kits que descuentan piezas, kit obligatorio, impuesto, entregas) y el
catálogo importado. Más del 80 % del código actual sigue siendo útil: cambia *dónde* se guardan
y validan los datos, no *qué* hace la aplicación.

| Bloqueante (P0) | Evidencia |
|---|---|
| Los datos viven en `localStorage` del navegador: otro dispositivo arranca de cero, y si se borra el historial del navegador se pierde todo | Prueba `casos-limite` §Persistencia: dos navegadores ven inventarios distintos |
| No hay autenticación ni permisos: cualquiera con el enlace puede entrar al panel, cambiar stock, cancelar pedidos o "ser" otra familia escribiendo su correo | Prueba `navegador-casos-limite` §permisos: el rol "Staff Camps" desactiva productos; `Store.variantOf(...).stock = 9999` desde la consola queda guardado sin movimiento |
| El pago es una simulación y no hay copia de seguridad de nada | Código `shop.js processPayment()`; no existe ningún proceso de respaldo |

**Ruta recomendada (sección 8):** Supabase (PostgreSQL + autenticación + archivos) en plan
gratuito, Cloudflare Pages para la web, Stripe Checkout para cobrar, y respaldos propios diarios.
Costo de infraestructura al arrancar: **≈ $1–2 al mes** (solo el dominio) más la comisión de
Stripe por venta. Operación profesional recomendada: **≈ $26–27 al mes** (Supabase Pro con
copias diarias), ampliable a ≈ $55 con monitoreo y protección de pago.

---

## 2. Qué se auditó y cómo

| Área | Método | Herramienta |
|---|---|---|
| Funcional, por módulo | Recorrido de las 3 tiendas y las 11 secciones del panel, ejecutando cada acción y comprobando el resultado en los datos (no solo el mensaje de éxito) | Playwright sobre Chrome real, 1366 px y 390 px |
| Casos límite | Campos vacíos, negativos, duplicados, inexistentes, doble clic, recarga a mitad de pago, dos pestañas, inyección de HTML, almacenamiento lleno, cuenta sin kit | Playwright + pruebas del núcleo en Node |
| Integridad del inventario | Cada variante = último asiento del libro; suma de entradas − salidas = unidades en inventario, tras cada escenario | Prueba `nucleo` |
| Almacenamiento | Lectura del código de persistencia y pruebas de recarga, segundo navegador, estado corrupto y cuota | Node con `localStorage` simulado |
| Seguridad | Revisión de código (escape de HTML, validaciones, secretos, dependencias) y pruebas de manipulación | Manual + Playwright |
| Proveedores y precios | Páginas oficiales de precios y documentación, consultadas el 2026-10-02 | Ver sección 7 y sus notas |

Todas las pruebas están en [tests/](tests/) y se ejecutan con `npm test` dentro de esa carpeta
(requiere Node 22 y Chrome instalado). No se tocó información real: el prototipo solo contiene
datos de ejemplo y el catálogo público de las tiendas actuales.

---

## 3. Informe funcional

### 3.1 Navegación e interfaz

| Comprobación | Resultado |
|---|---|
| Botones, pestañas y 11 enlaces del menú lateral | Todos abren su sección; 0 enlaces vacíos |
| Formularios: campos obligatorios, precio negativo, SKU duplicado, cantidad cero o negativa, salida mayor que el stock | Rechazados con mensaje visible; el botón se deshabilita cuando no se puede continuar |
| Búsquedas y filtros (inventario, productos, movimientos, pedidos, clientes, entregas) | Devuelven lo esperado; la búsqueda conserva los espacios ("camp jersey" → 7 tallas) |
| Tablas y ventanas modales | Funcionan en escritorio y en 390 px sin desborde horizontal |
| Mensajes de éxito, error y carga | Presentes (toasts, estados de botón, pantalla "procesando") |
| Confirmación en acciones destructivas | Desactivar producto, cancelar pedido, reiniciar demo y deshacer entrega la piden |
| Cambio de idioma ES/EN | Repinta toda la aplicación; 960 textos, ninguno sin traducir |
| Controles que aparentan funciones inexistentes | **Dos encontrados y corregidos**: el mensaje "Enviamos la confirmación a…" (no se envía ningún correo) ahora dice "Pedido registrado a nombre de…". El pago ya se anuncia como simulación. Pendiente de criterio: "Imprimir QR", "Copiar enlace" y "Exportar CSV" sí funcionan. |

### 3.2 Inventario y productos

| Función | Existe | Resultado de la prueba |
|---|---|---|
| Crear, consultar, editar y desactivar productos | Sí | Correcto. Desactivar no borra: conserva historial |
| SKU y referencias | Sí | SKU único por producto; SKU por talla generado (`CAMP-JER-YM`) |
| Tallas (variantes) | Sí | El stock vive en la talla; 234 referencias en la demo |
| Colores | **Parcial** | El color es un dato del producto (foto/catálogo), no una dimensión del stock. Las tiendas actuales tampoco lo usan como variante. Si se necesitara "talla × color", es un cambio de modelo (sección 6) |
| Kits | Sí | Un kit no tiene stock propio; al venderse descuenta cada pieza en su talla; no se puede añadir si una pieza está agotada |
| Entradas, salidas y ajustes | Sí | Todo pasa por `applyMovement()`; el stock nunca queda negativo; cada asiento guarda antes/después, motivo, referencia y usuario |
| Historial de movimientos | Sí | 285 asientos en la demo, filtrables y exportables a CSV |
| Existencias bajas y agotadas | Sí | Alertas por talla con propuesta de orden de compra |
| Filtros por tienda, tipo y estado | Sí | Correctos, incluido "compartidos entre tiendas" y "uso interno" |
| Reportes | Sí | Valor a costo, por tipo, ventas por tienda y día, impuesto recaudado |
| Duplicaciones o pérdidas | No se encontraron | El libro cuadra con el inventario en todos los escenarios (sumas iguales) |

### 3.3 Tiendas y ubicaciones

| Función | Existe | Nota |
|---|---|---|
| Tres tiendas sobre un inventario | Sí | Vender en Las Vegas descuenta el mismo stock que ve Athletum (probado) |
| Editar tienda (impuesto, envío, kit obligatorio, entrega) | Sí | Guardado y aplicado en la tienda |
| Publicar / pausar tienda | Sí | Una tienda pausada muestra "Muy pronto" en su enlace público |
| Existencias por ubicación física | **No** | Hay un solo almacén. Las "tiendas" son canales de venta, como se acordó |
| Transferencias entre ubicaciones | **No** | No aplica mientras exista un solo almacén. Si Las Vegas tuviera inventario físico propio, haría falta (sección 6, "evolución") |

### 3.4 Ventas

| Función | Resultado |
|---|---|
| Carrito, cuenta por correo, kit obligatorio en la primera compra | Correcto en todos los caminos probados: visitante, cuenta sin kit, cuenta con kit, kit en el mismo pedido, kit recibido por la academia |
| Impuesto 7 % y envío | Totales exactos ($50 + 7 % = $53.50; con envío $9 más) |
| Pedido, descuento de inventario y asientos | Correcto, pieza por pieza, en una sola secuencia |
| Cancelación | Devuelve cada pieza al inventario y marca reembolso; cancelar dos veces no duplica |
| Estados de pedido | Ahora solo se permite el siguiente paso o cancelar (corregido, sección 15) |
| Descontar unidades inexistentes | Imposible: se revalida el stock justo antes de "cobrar" |
| Pago real | **No existe.** Es una simulación con tarjeta `···4242` |
| Correo de confirmación | **No existe** |
| Envío real (USPS) | **No existe.** Tarifa fija configurable |

### 3.5 Casos límite probados

| Caso | Resultado |
|---|---|
| Doble clic en "Pagar" | Un solo pedido |
| Recargar la página durante el pago | Ni pedido ni descuento; el carrito se conserva |
| Dos pestañas abiertas escribiendo a la vez | **Antes:** la segunda pisaba a la primera (+10 perdido). **Ahora:** las pestañas se sincronizan y una escritura con datos viejos se descarta con aviso (corregido, sección 15) |
| HTML en nombres de producto y cliente (`<img onerror>`, `<script>`) | No se ejecuta: todo texto se escapa |
| Almacenamiento lleno (foto de 6 MB) | El guardado falla y ahora se avisa al usuario (antes fallaba en silencio) |
| Estado guardado corrupto | La aplicación arranca con la demo limpia (se pierden los datos: inherente a `localStorage`) |
| Usuario sin permisos | **No hay permisos:** cualquier rol puede hacer todo (P0) |
| Fallo de conexión | No aplica: no hay servidor. En producción hará falta manejarlo |

---

## 4. Matriz de pruebas

| Suite | Archivo | Comprobaciones | Resultado | Qué cubre |
|---|---|---|---|---|
| Núcleo | `tests/nucleo.test.js` | 40 | 40 ok | Carga, integridad del libro, totales e impuesto, regla del kit, kits, inventario compartido, entregas, importación CSV, cancelación, productos, métricas |
| Casos límite | `tests/casos-limite.test.js` | 50 | 50 ok | Validaciones del núcleo, duplicados, cantidades inválidas, estados, CSV con comillas, persistencia, reimportación del catálogo, conflicto entre pestañas |
| Navegador | `tests/navegador.test.js` | 65 | 65 ok | Tres tiendas, compra completa, segunda compra sin kit, panel (11 secciones), formularios de producto y kit, entregas, QR, idioma, móvil 390 px, tienda pública |
| Navegador, casos límite | `tests/navegador-casos-limite.test.js` | 26 | 26 ok | Formularios, confirmaciones, inyección, doble clic, recarga, dos pestañas, cuota, navegación, permisos |
| Diccionario | `tests/i18n-check.js` | 960 claves | 0 faltantes, 0 sin uso | Cada texto usado existe en ES y EN |

Las dos suites de navegador se ejecutaron también contra la versión publicada en GitHub Pages
con el mismo resultado. Reproducir: `cd tests && npm install && npm test` (y `npm run serve`
en otra terminal para las de navegador).

**Lo que no se pudo probar y por qué:** pagos reales (no hay cuenta de Stripe conectada),
envíos (no hay API de USPS), correo (no hay servicio), concurrencia real entre usuarios
distintos (no hay servidor), recuperación ante fallos de red (no hay red).

---

## 5. Diagnóstico de la arquitectura actual

**Stack:** HTML + CSS + JavaScript sin frameworks ni compilación (10.500 líneas, de las cuales
1.744 son el catálogo generado y 1.111 el diccionario de textos). Una sola dependencia externa,
`qrcode-generator` (MIT), copiada al repositorio. Publicado en GitHub Pages como sitio estático.

**Dónde viven los datos hoy:**

| Dato | Lugar | Consecuencia |
|---|---|---|
| Catálogo (nombres, precios, fotos, kits) | `docs/js/catalog.js`, generado por `tools/importar-catalogo.js` | Estático: cambia solo al reimportar y volver a publicar |
| Stock, pedidos, clientes, movimientos, lista de jugadores, configuración de tiendas | `localStorage` del navegador (clave `soccercage_db_v2`, ≈150 KB) | Por dispositivo y por navegador; no se comparte; se pierde al limpiar el historial; límite práctico de 5 MB (una foto subida desde el panel ocupa 100–300 KB) |
| Fotos subidas desde el panel | Dentro del mismo `localStorage`, en base64 | Agotan la cuota rápido |
| Sesión del comprador | Un correo guardado en `localStorage` | Sin contraseña ni verificación |

**Lo que está bien diseñado y se conserva:** toda mutación de stock pasa por una sola función
(`applyMovement`) que asienta antes/después, motivo y usuario; el checkout sigue el orden
correcto (regla del kit → revalidar stock → crear pedido → descontar → asentar); los kits son
listas de piezas, no stock propio; las validaciones ahora están en el núcleo y no solo en los
formularios. Ese diseño se traslada casi literalmente a funciones de base de datos.

**Lo que no sirve para producción:** la persistencia (sección 3.5), la ausencia de servidor
(no hay dónde ejecutar reglas que el usuario no pueda saltarse), y el alojamiento: las
condiciones de GitHub Pages dicen literalmente que *"GitHub Pages is not intended for or allowed
to be used as a free web-hosting service to run your online business, e-commerce site"*
(docs.github.com, límites de GitHub Pages, consultado 2026-10-02). La tienda pública debe
alojarse en otro sitio antes de vender.

---

## 6. Modelo de datos recomendado (PostgreSQL)

Relacional, porque productos, tallas, kits, pedidos y movimientos están fuertemente relacionados
y la integridad del inventario depende de transacciones. Este modelo reproduce el del prototipo
y añade lo que faltaba (usuarios, permisos, auditoría, idempotencia).

```
stores            (id, name, phase, active, tax_rate, shipping_flat, pickup, shipping, kit_required)
profiles          (id → auth.users, name, role: admin|marketing|delivery, store_ids text[])
products          (id, sku UNIQUE, name, kind, categories text[], line, price ≥ 0, cost ≥ 0,
                   min_stock ≥ 0, active, image_path, description, created_by, updated_at)
product_stores    (product_id, store_id)                      -- en qué tiendas se vende
variants          (id, product_id, size, sku UNIQUE, stock ≥ 0 CHECK, reserved ≥ 0)
kit_components    (kit_id, product_id, qty ≥ 1, UNIQUE(kit_id, product_id))
movements         (id, variant_id, type IN (in,out), qty > 0, reason, ref, before, after,
                   user_id, created_at, idempotency_key UNIQUE)   -- solo inserción, nunca update
customers         (id, email UNIQUE lower, name, phone, auth_user_id NULL)
kit_grants        (customer_id, store_id, source: order|delivery|manual, ref)
orders            (id, number UNIQUE, store_id, customer_id, status, payment_status,
                   fulfillment, address jsonb, subtotal, tax_rate, tax, shipping, total,
                   stripe_session_id UNIQUE, stripe_payment_intent UNIQUE, created_at)
order_items       (id, order_id, kind: item|kit, product_id, variant_id NULL, qty, price, player)
order_item_parts  (order_item_id, variant_id, qty)             -- piezas de cada kit vendido
roster            (id, program, player, guardian_email, team, role, size, sock_size,
                   status, delivery_ref, delivered_at, delivered_by)
audit_log         (id, user_id, action, table, row_id, before jsonb, after jsonb, created_at)
```

Reglas que deben vivir en la base de datos, no en el navegador:

1. **`apply_movement(variant, type, qty, reason, ref, key)`**: función con `SELECT … FOR UPDATE`
   sobre la variante, `CHECK stock ≥ 0`, inserción del asiento y actualización del stock en la
   misma transacción. Es la única vía de escritura sobre `variants.stock` (sin permiso de
   `UPDATE` directo para ningún rol de aplicación).
2. **`place_order(...)`**: una transacción que crea pedido, líneas, piezas y llama a
   `apply_movement` por cada unidad. Si una pieza no alcanza, todo se revierte. La llama el
   webhook de Stripe con el `event.id` como clave de idempotencia: reintentos no duplican.
3. **`cancel_order`**, **`deliver(roster_id)`** y **`undo_delivery`**: mismas garantías.
4. **Regla del kit**: función `customer_has_kit(customer, store)` evaluada en el servidor al
   crear la sesión de pago; el cliente solo la ve reflejada.
5. **RLS (seguridad por fila)**: público lee productos activos y stock disponible; cada
   comprador lee solo sus pedidos; `delivery` escribe solo entregas; `admin` todo; `marketing`
   lectura. Nadie escribe `stock` ni `movements` directamente.

Cambios respecto al prototipo: separar `order_item_parts` (hoy va embebido en JSON), `kit_grants`
como tabla (hoy un array), fotos en almacenamiento de archivos (hoy base64), y claves de
idempotencia (hoy no existen porque no hay reintentos de red). Evolución futura: tabla
`locations` y `stock_by_location` + `transfers` si Las Vegas pasa a tener inventario físico
propio; `talla × color` si algún producto lo requiere.

---

## 7. Comparativa de herramientas (precios oficiales, consultados el 2026-10-02)

Advertencia honesta: `supabase.com/pricing` y `render.com/pricing` no respondieron desde esta
red ese día. Para Supabase, las cifras salen de su documentación oficial (`supabase.com/docs`)
indexada; para Render, de `render.com/docs/free` (sí respondió) y de su documentación. Confirme
ambas en la página de precios antes de contratar. El resto se leyó directamente de la página
oficial indicada.

### 7.1 Base de datos y backend

| Proveedor | Plan gratuito | Plan de pago | Observaciones para este proyecto |
|---|---|---|---|
| **Supabase** (PostgreSQL + Auth + Storage + funciones) | $0: 500 MB de base de datos, 1 GB de archivos, 5 GB de salida, 50.000 usuarios activos, **sin copias de seguridad**, el proyecto **se pausa tras ~1 semana sin uso** | Pro **$25/mes** por organización (incluye $10 de cómputo = 1 instancia Micro): 8 GB de disco (+$0,125/GB), 100 GB de archivos (+$0,0213/GB), 250 GB de salida (+$0,09/GB), 100.000 MAU, **copias diarias guardadas 7 días**, soporte por correo. Recuperación a un punto en el tiempo (PITR): complemento de pago, precio no verificado | Encaja mejor: relacional, autenticación y archivos incluidos, RLS. El pausado del plan gratuito es un riesgo real para una tienda que vende por temporadas |
| **Neon** (solo PostgreSQL) | $0: 1 GB por proyecto (20 GB por cuenta), 100 horas de cómputo/proyecto, restauración a 6 h, se apaga tras 5 min sin uso | Launch: pago por uso, $0,106/hora de cómputo, $0,35/GB-mes, historial 7 días | Buena base de datos, pero sin autenticación ni archivos: habría que sumar servicios |
| **Firebase** (Spark) | $0: Firestore 1 GiB, 50.000 lecturas/día, 20.000 escrituras/día; Auth 50.000 MAU; Storage 5 GB y 1 GB/día de descarga; Hosting 10 GB y 360 MB/día; Functions con cuota gratuita | Blaze: pago por uso (sin cifras por operación en la página de precios; remite a Google Cloud). Storage $0,026/GB y $0,12/GB descargado | NoSQL: la integridad del inventario (transacciones entre variantes, kits, pedidos) es más difícil de garantizar. No recomendado para este caso |
| **Render** (servidor propio + Postgres) | Web gratuita: se apaga tras **15 min sin tráfico**, 750 h/mes. Postgres gratuita: 1 GB y **expira a los 30 días, sin copias** | Web Starter $7/mes; Postgres de pago con recuperación a un punto en el tiempo (3 días en Hobby, 7 en Pro). Instancia Basic ≈ $6/mes según fuentes secundarias (no verificado en la página oficial) | Más trabajo (hay que escribir y mantener un servidor) y el plan gratuito no sirve para producción |
| **Cloudflare D1** (SQLite) | $0: 5 GB, 5 M filas leídas/día, 100.000 escritas/día | Dentro de Workers Paid ($5/mes): 25.000 M lecturas y 50 M escrituras/mes incluidas | Sin autenticación ni RLS; requiere escribir toda la lógica en Workers |

**Recomendación:** Supabase. Un solo proveedor cubre base de datos, autenticación, archivos y
funciones de servidor, con PostgreSQL (transacciones y RLS) y copias diarias en el plan Pro.

### 7.2 Hosting y despliegue

| Proveedor | Gratuito | De pago | Veredicto |
|---|---|---|---|
| **GitHub Pages** | 1 GB, 100 GB/mes, 10 compilaciones/hora | — | **Prohibido para comercio electrónico** por sus condiciones. Vale para la demo, no para vender |
| **Cloudflare Pages** | Ilimitado en tráfico; 500 compilaciones/mes, 1 a la vez, 100 dominios | Funciones se cobran como Workers ($5/mes por 10 M peticiones) | **Recomendado** para la web (tienda y panel) |
| **Vercel** | Hobby $0, pero *"for personal, non-commercial use"* | Pro $20/mes por desarrollador | Descartado en gratuito por sus condiciones |
| **Cloudflare Workers** | 100.000 peticiones/día, 10 ms CPU | $5/mes: 10 M peticiones | Alternativa a las funciones de Supabase para webhooks; no necesaria al inicio |

### 7.3 Archivos (fotos de producto)

| Servicio | Gratuito | De pago |
|---|---|---|
| **Supabase Storage** | 1 GB (Free) / 100 GB (Pro) | +$0,0213/GB |
| **Cloudflare R2** | 10 GB/mes, 1 M operaciones de escritura y 10 M de lectura, **salida gratis** | $0,015/GB-mes |
| Firebase Storage | 5 GB, 1 GB/día descarga | $0,026/GB, $0,12/GB descargado |

Hoy las 49 fotos del catálogo ocupan 1,3 MB. Supabase Storage basta; R2 queda como destino de
copias de seguridad (salida gratis).

### 7.4 Seguridad

| Necesidad | Gratuito | De pago |
|---|---|---|
| DNS, HTTPS, mitigación DDoS | **Cloudflare Free**: DNS, certificado universal, DDoS sin límite, "Free Managed Ruleset" del WAF, 1 regla de limitación de tasa | Cloudflare Pro **$20/mes** (anual) o $25 (mensual): Managed Ruleset completo + OWASP, 20 reglas WAF propias, 2 de limitación |
| Dependencias vulnerables | **GitHub Dependabot** (alertas y actualizaciones): gratis en todos los repositorios | — |
| Secretos en el código | Secret scanning y push protection: gratis **solo en repositorios públicos**; en privados requiere GitHub Secret Protection (de pago) | Alternativa gratuita: `gitleaks` en GitHub Actions |
| Análisis de código | Code scanning gratis en públicos; privados requieren GitHub Code Security | Alternativa: ESLint + revisión |
| Gestión de secretos | Variables de entorno de Supabase/Cloudflare y GitHub Actions secrets (gratis) | — |
| Bots en el checkout | Cloudflare Turnstile (gratis) | — |

### 7.5 Monitoreo

| Servicio | Gratuito | De pago |
|---|---|---|
| **Sentry** (errores) | Developer: 5.000 errores/mes, 1 usuario, 30 días | Team **$26/mes**: 50.000 errores, usuarios ilimitados |
| **Better Stack** (disponibilidad) | 10 monitores, chequeo cada 30 s, 1 página de estado, alertas por llamada, SMS, correo y Slack | $25/mes: 50 monitores |
| **UptimeRobot** | 50 monitores cada 5 min, 1 página de estado | Solo $10/mes: cada 60 s |
| Better Stack Logs | 3 GB/mes, 3 días | — |

### 7.6 Pagos y correo

| Servicio | Condiciones |
|---|---|
| **Stripe** | 2,9 % + $0,30 por transacción con tarjeta nacional; +1,5 % internacionales; ACH 0,8 % con tope $5; disputa $15; sin mensualidad |
| **Resend** (correo transaccional) | Gratis: 3.000 correos/mes, 100/día, 3 dominios. Pro $20/mes: 50.000 |

Fuentes: supabase.com/docs (billing, backups, compute), neon.com/pricing, firebase.google.com/pricing,
render.com/docs/free, vercel.com/pricing, developers.cloudflare.com (workers/platform/pricing,
r2/pricing, pages/platform/limits, waf/managed-rules, waf/rate-limiting-rules), cloudflare.com/plans,
docs.github.com (github-pages-limits, github-security-features), sentry.io/pricing,
betterstack.com/pricing, uptimerobot.com/pricing, stripe.com/pricing, resend.com/pricing.

---

## 8. Arquitectura recomendada para la primera versión productiva

```
Comprador / Eduardo (navegador, móvil)
        │ HTTPS
        ▼
Cloudflare (DNS + certificado + DDoS + WAF básico)         ← dominio propio
        │
        ├── Cloudflare Pages  →  la web actual (tienda + panel), sin cambios de aspecto
        │
        └── Supabase
              ├── PostgreSQL + RLS + funciones (apply_movement, place_order, deliver…)
              ├── Auth (correo + contraseña o enlace mágico; MFA para admin)
              ├── Storage (fotos de producto)
              └── Edge Functions
                    ├── crear sesión de Stripe Checkout (valida kit y stock, reserva)
                    └── webhook de Stripe → place_order (idempotente)
Stripe Checkout (página de pago alojada por Stripe: la tarjeta nunca toca nuestro servidor)
Resend (confirmaciones), Sentry (errores), UptimeRobot/Better Stack (disponibilidad)
GitHub Actions (pruebas, despliegue y copia diaria pg_dump → Cloudflare R2)
```

Por qué así y no de otra forma:

- **Sin servidor propio que mantener.** Las reglas viven en funciones de base de datos y en dos
  funciones de borde (checkout y webhook). No hay microservicios ni contenedores.
- **El código actual se reutiliza.** `Store` deja de leer `localStorage` y pasa a llamar a
  Supabase (consultas y RPC); `Shop` y `Admin` casi no cambian. El importador de catálogo pasa a
  escribir en la base de datos.
- **PCI**: con Stripe Checkout alojado, la aplicación no ve números de tarjeta.
- **Evoluciona sin reconstruir**: pasar de Free a Pro en Supabase es un clic; añadir Cloudflare
  Pro o Sentry Team no toca el código; si un día hace falta un servidor propio, las funciones de
  base de datos siguen siendo las mismas.

Modo de trabajo del tiempo (orientativo): migración de datos y funciones SQL 2–3 días; conexión
del frontend 2–3 días; Stripe Checkout + webhook 1–2 días; autenticación y permisos 1–2 días;
respaldos, monitoreo y pruebas 1–2 días. Total **8–12 días de trabajo** antes de vender con dinero
real, sin contar USPS.

---

## 9. Seguridad y control de acceso

| Área | Estado actual | Qué hace falta |
|---|---|---|
| HTTPS | Sí (GitHub Pages) | Se mantiene con Cloudflare Pages + dominio propio |
| Autenticación | **No existe.** Comprador = un correo sin verificar; panel = selector de usuario | Supabase Auth: enlace mágico o contraseña para compradores; contraseña + MFA para `admin`; sesiones con caducidad; recuperación de contraseña por correo |
| Autorización | **No existe.** Todo rol puede todo | RLS por rol y por tienda (`store_ids` en el perfil); `delivery` solo entregas de su programa; `marketing` solo lectura |
| Validación de entradas | En formulario **y ahora en el núcleo** (corregido) | Repetir las mismas reglas como `CHECK` y en las funciones SQL |
| XSS | Protegido: todo texto se escapa (probado con `<img onerror>` y `<script>`) | Mantener; añadir `Content-Security-Policy` en las cabeceras de Pages |
| Inyección SQL | No aplica hoy | Usar el cliente de Supabase (consultas parametrizadas) y RPC; nunca concatenar SQL |
| CSRF | No aplica (sin sesión de servidor) | Tokens JWT en cabecera (Supabase) + verificación de firma en el webhook de Stripe |
| Secretos | Ninguno en el repositorio (verificado) | Claves de Stripe y `service_role` solo en Edge Functions / GitHub Secrets; en el navegador solo la clave `anon` protegida por RLS |
| CORS | No aplica | Restringir el origen de las Edge Functions al dominio propio |
| Abuso / fuerza bruta | Ninguna protección | Limitación de tasa de Supabase Auth + 1 regla de Cloudflare Free en `/checkout` + Turnstile |
| Dependencias | 1 librería copiada (qrcode-generator, MIT) | Dependabot activado; `npm audit` en CI |
| Datos personales | Nombres, correos, teléfonos y direcciones en el navegador de cada operador | En base de datos con RLS; política de retención; exportación bajo petición |
| Trazabilidad | Libro de movimientos con usuario, motivo y antes/después (bueno) | Añadir `audit_log` para cambios de precio, producto, tienda y permisos; registros técnicos (Supabase logs, Sentry) separados del libro operativo |

---

## 10. Copias de seguridad y recuperación

| | Escenario A (gratuito) | Escenario B (profesional) |
|---|---|---|
| Base de datos | **GitHub Actions** diario a las 03:00: `pg_dump` cifrado → **Cloudflare R2** (gratis hasta 10 GB). Retención: 30 diarias + 12 mensuales | Supabase Pro: copias diarias 7 días **más** el mismo `pg_dump` a R2 para retención larga. PITR opcional cuando el volumen lo justifique |
| Fotos | Sincronización semanal de Supabase Storage → R2 (misma acción) | Igual |
| Configuración y código | Repositorio Git (ya existe); migraciones SQL versionadas en `supabase/migrations` | Igual |
| RPO (pérdida máxima) | 24 h | 24 h (minutos con PITR) |
| RTO (tiempo de recuperación) | ≈ 2 h (restaurar `pg_dump` en un proyecto nuevo y cambiar la URL) | ≈ 1 h (restauración desde el panel de Supabase) |
| Responsable | David (ejecución); Eduardo (verificación mensual) | Igual |
| Prueba de recuperación | **Mensual**: restaurar la última copia en un proyecto de pruebas y ejecutar la suite de pruebas contra él. Queda registrado en el repositorio | Igual |

Nada de esto existe hoy: el prototipo no tiene copia alguna. El punto clave del Escenario A es
que **la copia la hacemos nosotros**, porque el plan gratuito de Supabase no incluye ninguna.

---

## 11. Rendimiento y escalabilidad

Volumen actual y previsible: 45 productos, 234 tallas, 3 tiendas, decenas de pedidos por semana
en temporada. Para PostgreSQL esto es minúsculo: el plan gratuito (500 MB) aguanta años de
movimientos (cada asiento ≈ 300 bytes). Lo que hay que vigilar no es el tamaño sino los límites
de los planes gratuitos.

| Indicador | Umbral para revisar | Acción |
|---|---|---|
| Proyecto pausado por inactividad (Supabase Free) | Cualquier pausa | Pasar a Pro ($25) o mantener un chequeo que lo despierte |
| Base de datos | > 350 MB (70 % de 500 MB) | Pro (8 GB) |
| Salida de datos | > 4 GB/mes | Servir fotos desde R2 o Pro |
| Errores en Sentry | > 4.000/mes o cualquier error de pago | Investigar; Team si se supera |
| Latencia del checkout | > 2 s en crear la sesión de Stripe | Índices, revisar funciones |
| Pedidos simultáneos | Más de ~5 por minuto sostenidos | Reservas de stock con caducidad en vez de solo revalidar |

Medidas desde el inicio: índices en `variants(product_id)`, `movements(variant_id, created_at)`,
`orders(customer_id)`, `orders(store_id, created_at)`; paginación en movimientos y pedidos
(hoy el panel muestra los últimos 120); fotos reducidas a 600 px (ya se hace) y servidas con
caché; bloqueo por fila (`FOR UPDATE`) en vez de bloqueos globales.

Etapas: (1) gratuito con monitoreo; (2) datos reales durante una temporada; (3) Supabase Pro
en cuanto haya ventas reales (por las copias diarias, más que por capacidad); (4) Cloudflare
Pro / Sentry Team solo si los indicadores lo piden.

---

## 12. Pruebas automatizadas

Existen y pasan (sección 4). Para producción se añade:

- **Base de datos**: pruebas de las funciones SQL (`apply_movement` con concurrencia real,
  `place_order` idempotente, RLS por rol) con `pgTAP` o un script Node contra un proyecto de
  pruebas de Supabase.
- **Integración**: webhook de Stripe en modo prueba (tarjetas de prueba), correo con Resend en
  modo sandbox.
- **Interfaz**: las suites actuales de Playwright, apuntando al entorno de pruebas, en GitHub
  Actions en cada cambio.
- **Recuperación**: la prueba mensual de restauración (sección 10).

---

## 13. Plan de despliegue

| Paso | Detalle |
|---|---|
| Entornos | **dev**: local con Supabase CLI (base de datos en Docker). **pruebas**: proyecto Supabase "soccercage-staging" + Pages preview, con Stripe en modo prueba. **producción**: proyecto "soccercage-prod" + dominio propio |
| Variables | `SUPABASE_URL`, `SUPABASE_ANON_KEY` (públicas), `SUPABASE_SERVICE_ROLE`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY` (solo en funciones y en GitHub Secrets; nunca en el repositorio) |
| Dominio y HTTPS | Dominio en Cloudflare Registrar o Namecheap; DNS en Cloudflare; certificado automático |
| Migraciones | `supabase/migrations/*.sql` versionadas; se aplican con `supabase db push` en pruebas y luego en producción |
| Usuarios y permisos | Crear a Eduardo (`admin` con MFA), David (`marketing`), personal de campamentos (`delivery`, tienda Camps) |
| Inventario inicial | Eduardo valida el archivo de precios; se carga con el importador al proyecto de pruebas; conteo físico; se carga a producción con `reason = initial`, dejando asientos |
| Copias y monitoreo | Activados **antes** de la primera venta real |
| Reversión | La web: redeploy del commit anterior en Pages (1 clic). La base de datos: migraciones con `down` o restauración de la copia previa |
| Mantenimiento | Dependabot semanal; revisión mensual de indicadores (sección 11) y prueba de restauración |

Datos de prueba y reales nunca comparten proyecto. No se migrará ni publicará nada en producción
sin autorización expresa.

---

## 14. Presupuesto mensual

### Escenario A — arranque con versiones gratuitas

| Proveedor y servicio | Función | Límites del plan | Incluye | No incluye | Riesgo / tarea manual | Costo/mes |
|---|---|---|---|---|---|---|
| Supabase Free | Base de datos, autenticación, archivos, funciones | 500 MB BD, 1 GB archivos, 5 GB salida, 50k MAU | PostgreSQL, RLS, Auth, Storage, Edge Functions | **Copias de seguridad**; soporte | **Se pausa tras ~1 semana sin uso**: hace falta un chequeo que lo mantenga despierto o pasar a Pro | $0 |
| Cloudflare Pages + Free | Web, DNS, HTTPS, DDoS, WAF básico | 500 compilaciones/mes | Tráfico sin límite, 1 regla de limitación | WAF completo | — | $0 |
| Cloudflare R2 | Destino de copias | 10 GB | Salida gratis | — | Rotación de copias por script | $0 |
| GitHub Free (repo privado) | Código, CI, copias programadas | 2.000 min/mes de Actions en privado | Dependabot | Secret scanning en privado | Usar `gitleaks` en CI | $0 |
| Stripe | Cobros | — | Checkout alojado, webhooks | — | — | $0 fijo + **2,9 % + $0,30 por venta** |
| Resend Free | Confirmaciones | 3.000/mes, 100/día | — | — | 100/día limita campañas masivas (no es su uso) | $0 |
| Sentry Developer | Errores | 5.000/mes, 1 usuario | — | Más usuarios | — | $0 |
| UptimeRobot Free | Disponibilidad (y "despertar" Supabase) | 50 monitores, 5 min | Alertas por correo | — | — | $0 |
| Dominio | Marca propia | — | — | — | Renovación anual | ≈ $1–1,5 (≈ $10–18/año, según registrador; verificar) |
| **Total** | | | | | | **≈ $1–2/mes + comisiones de Stripe** |

Con 100 kits de $50 al mes: comisiones ≈ $175. Es el único costo relevante del escenario y es
proporcional a las ventas.

### Escenario B — operación profesional recomendada

| Cambio | Ventaja concreta | Costo/mes |
|---|---|---|
| Supabase **Pro** | Copias diarias (7 días) sin depender de nuestro script; sin pausas; 8 GB; soporte por correo; registros 7 días | $25 (incluye $10 de cómputo: cubre la instancia Micro) |
| Dominio | Igual | ≈ $1–1,5 |
| **Base recomendada** | | **≈ $26–27/mes** |
| Sentry Team (cuando haya varias personas o > 5k errores) | Usuarios ilimitados, 50k errores | +$26 |
| Cloudflare Pro (si la tienda pública recibe ataques o bots) | WAF completo + OWASP, 20 reglas | +$20 (anual) |
| Better Stack (si se quiere alerta por llamada y página de estado pública) | 30 s, llamadas, página de estado | $0 (gratis hasta 10 monitores) |
| PITR en Supabase (si una hora de pérdida fuera inaceptable) | Recuperación al minuto | Precio no verificado |
| **Total completo** | | **≈ $55–75/mes + comisiones de Stripe** |

Límites que siguen existiendo en B: 8 GB de base (sobra), 250 GB de salida, 100k MAU; el
soporte es por correo, no 24/7; la pérdida máxima sigue siendo de hasta 24 h sin PITR.

---

## 15. Correcciones aplicadas durante la auditoría

Todas conservan el alcance acordado y pasan las 181 comprobaciones. Están en el repositorio
local, **sin publicar**, a la espera de autorización.

| Corrección | Archivo | Qué resuelve |
|---|---|---|
| Sincronización entre pestañas y detección de conflictos (número de revisión por escritura; la pestaña con datos viejos descarta su operación y avisa) | `store.js`, `app.js` | Pérdida de actualizaciones con dos pestañas (hallazgo probado) |
| Aviso al usuario cuando el navegador no puede guardar (almacenamiento lleno o bloqueado) | `store.js`, `app.js` | Antes fallaba en silencio |
| Validaciones dentro del núcleo: nombre, SKU único, tipo, precio/costo/mínimo ≥ 0, tallas válidas, kit con piezas existentes y no repetidas, cantidades enteras ≥ 1 | `store.js` | El formulario ya validaba; ahora ninguna vía las esquiva |
| Tipo de movimiento restringido a entrada/salida | `store.js` | Un tipo desconocido contaba como salida |
| Estados de pedido con transiciones válidas (siguiente paso o cancelar; cancelado es final) | `store.js` | Se podía pasar de cancelado a completado |
| CSV con comas entre comillas y separador `;` o tabulador | `store.js` | "Doe, John" se partía en dos columnas |
| Reimportar el catálogo fusiona en vez de borrar el estado | `store.js` | Antes, un cambio de fecha del catálogo reiniciaba stock y pedidos |
| Texto honesto en la confirmación ("Pedido registrado a nombre de…") | `i18n.js` | No se envía ningún correo |
| 17 textos nuevos ES/EN para los avisos anteriores | `i18n.js` | — |
| Suite de pruebas incorporada al repositorio (`tests/`) | nuevo | Reproducibilidad |

---

## 16. Matriz de hallazgos y prioridades

**P0 — Bloqueante**

| # | Problema y evidencia | Módulo | Impacto | Solución | Dependencias | Esfuerzo | Costo | Resuelto cuando |
|---|---|---|---|---|---|---|---|---|
| 1 | Datos en `localStorage`: no centralizados, se pierden al limpiar el navegador, límite 5 MB (prueba `casos-limite` §Persistencia) | Todos | Pérdida de inventario y pedidos; dos personas ven datos distintos | Supabase PostgreSQL con el modelo de la sección 6 | Decisión de proveedor | 4–6 días | $0 (Free) / $25 (Pro) | Dos dispositivos ven el mismo stock; la suite pasa contra la base de datos |
| 2 | Sin autenticación ni permisos; cualquiera modifica stock o suplanta una familia escribiendo su correo (prueba §permisos) | Panel, tienda | Fraude, errores, kit obligatorio evitable | Supabase Auth + RLS + funciones SQL | #1 | 2–3 días | $0 | Un usuario `delivery` no puede tocar productos; sin sesión no se escribe nada |
| 3 | El stock se puede editar sin movimiento desde el navegador (`v.stock = 9999` queda guardado) | Inventario | Inventario no auditable | Solo `apply_movement` puede escribir stock (sin `UPDATE` directo) | #1 | incluido en #1 | — | Un `UPDATE variants` directo es rechazado por la base |
| 4 | Sin copia de seguridad de ningún tipo | Todos | Pérdida total ante un error | Acción diaria `pg_dump` → R2 + prueba mensual de restauración | #1 | 1 día | $0 | Una restauración de prueba documentada con fecha |

**P1 — Obligatorio antes de producción**

| # | Problema | Módulo | Solución | Esfuerzo | Costo |
|---|---|---|---|---|---|
| 5 | Pago simulado; no hay cobro real | Checkout | Stripe Checkout + webhook idempotente en Edge Function | 1–2 días | 2,9 % + $0,30/venta |
| 6 | GitHub Pages prohíbe comercio electrónico en sus condiciones | Hosting | Cloudflare Pages + dominio propio | 0,5 día | ≈ $1–1,5/mes |
| 7 | No se envía confirmación de pedido (el texto ya no lo afirma) | Checkout | Resend desde el webhook | 0,5 día | $0 |
| 8 | Envío: tarifa fija inventada, sin guía | Checkout, pedidos | Intermediario (EasyPost/Shippo/Pirate Ship) con tarjeta, para no depender del alta ACH con USPS EPS | 1–2 días | según volumen |
| 9 | Impuesto: 7 % fijo en las tres tiendas; Las Vegas está en Nevada (tasa distinta) y los envíos fuera de Florida tienen otro tratamiento | Tiendas | Confirmar con el contador; configurar por tienda (ya es posible) o calcular por destino | 0,5 día + decisión | — |
| 10 | Fotos subidas en base64 dentro del estado | Productos | Supabase Storage | incluido en #1 | $0 |
| 11 | Sin monitoreo de errores ni disponibilidad | Operación | Sentry Developer + UptimeRobot (también mantiene despierto Supabase Free) | 0,5 día | $0 |
| 12 | Sin registro de auditoría de cambios de precio, producto, tienda y permisos (solo del stock) | Panel | Tabla `audit_log` con trigger | 0,5 día | $0 |
| 13 | Regla "kit por correo": un papá con dos hijos y un solo correo necesita dos kits | Negocio | Decisión de Eduardo: por correo, por jugador o por cuenta con varios jugadores | — | — |
| 14 | Precios provisionales (piezas de campamento, kits Elite $714/$715 calculados por suma) | Catálogo | Archivo de precios de Eduardo | — | — |

**P2 — Mejora importante**

| # | Problema | Solución | Esfuerzo |
|---|---|---|---|
| 15 | Reserva de stock: se revalida al pagar, pero dos compradores pueden llegar al pago con la última unidad | Reserva con caducidad (10 min) al crear la sesión de Stripe | 1 día |
| 16 | Sin paginación real en movimientos y pedidos (se cortan a 120) | Paginación en consultas | 0,5 día |
| 17 | PlayMetrics: importación manual de CSV | Verificar si su API permite sincronizar; si no, mantener CSV con recordatorio | por confirmar |
| 18 | Búsqueda de productos sin acentos/normalización | `unaccent` en PostgreSQL | 0,25 día |
| 19 | Sin cabeceras de seguridad (CSP, X-Frame-Options) | `_headers` en Cloudflare Pages | 0,25 día |
| 20 | Pruebas de interfaz no corren en CI | GitHub Actions con Playwright | 0,5 día |

**P3 — Evolución futura**

| # | Capacidad |
|---|---|
| 21 | Inventario físico por ubicación y transferencias (si Las Vegas o Athletum tienen almacén propio) |
| 22 | Variante talla × color |
| 23 | Sincronización automática con PlayMetrics |
| 24 | Página de estado pública y alertas por llamada (Better Stack) |
| 25 | PITR y plan Pro de Cloudflare cuando el volumen o los ataques lo justifiquen |
| 26 | Reportes contables (exportación para el contador: ventas, impuesto por estado) |

---

## 17. Información y decisiones que necesito

Decisiones que puedo tomar con la evidencia actual: proveedor (Supabase), hosting (Cloudflare
Pages), pasarela (Stripe Checkout), correo (Resend), estructura de respaldos y modelo de datos.

Decisiones que requieren su confirmación:

1. **Autorizar publicar** las correcciones de la sección 15 en GitHub Pages (hoy están solo en
   local).
2. **Plan de arranque**: Supabase Free con nuestro respaldo diario, o Pro desde el primer día
   ($25/mes). Mi recomendación: Free durante la construcción y pruebas; **Pro desde la primera
   venta real**, por las copias diarias y para que el proyecto no se pause.
3. **Dominio**: ¿cuál? (p. ej. `tienda.soccercage.com` o uno por marca). Hay que comprarlo o
   delegar el existente a Cloudflare.
4. **Cuentas por crear (por usted, no por mí)**: Supabase, Cloudflare, Stripe (requiere datos
   fiscales de la empresa y cuenta bancaria), Resend, Sentry, UptimeRobot. Yo necesito acceso
   como colaborador, no las contraseñas. Las claves de API se cargan directamente en el panel de
   cada servicio y en *GitHub Secrets*, nunca por chat.
5. **Repositorio**: ¿pasa a privado? (Recomendado antes de conectar servicios. En privado, el
   escaneo de secretos de GitHub es de pago; usaríamos `gitleaks`.)
6. **Reglas de negocio pendientes con Eduardo**: kit por correo o por jugador; una talla por pieza
   o común; precios definitivos; impuesto de Las Vegas y de envíos fuera de Florida (con el
   contador); dónde se recogen los pedidos en sitio.
7. **Volúmenes**: número de familias por temporada, pedidos esperados por semana y cuántas
   personas usarán el panel (para dimensionar MAU y usuarios de Sentry).
8. **Respaldo**: ¿es aceptable perder hasta 24 h de datos en el peor caso (RPO 24 h) durante la
   primera temporada? Si no, PITR desde el inicio.
9. **Presupuesto mensual máximo** aceptable para infraestructura.
10. **Envíos**: confirmar que se usará un intermediario con tarjeta en vez de la cuenta ACH de
    USPS (ver caso de Athletum).

---

## 18. Criterios para declarar la plataforma lista para producción

Se considera lista cuando **todos** se cumplen y quedan documentados con fecha:

1. Los datos viven en PostgreSQL; dos dispositivos distintos ven el mismo inventario en tiempo real.
2. Ningún rol puede escribir `stock` ni `movements` salvo a través de `apply_movement`; un
   `UPDATE` directo es rechazado (prueba automática).
3. Inicio de sesión obligatorio para el panel, con MFA activo en las cuentas `admin`; un usuario
   `delivery` no puede modificar productos ni pedidos (prueba automática por rol).
4. Un pago real de prueba en Stripe (modo test) crea el pedido, descuenta el inventario, envía el
   correo y no se duplica al reenviar el webhook (prueba automática).
5. La regla del kit se evalúa en el servidor y no se puede saltar manipulando el navegador.
6. Copia de seguridad diaria verificada: una restauración real ejecutada y la suite de pruebas
   pasando contra la copia restaurada.
7. Monitoreo activo: alerta de caída en menos de 5 minutos y errores enviados a Sentry.
8. La web se sirve desde un dominio propio con HTTPS y cabeceras de seguridad, fuera de GitHub
   Pages.
9. Las suites de pruebas (núcleo, casos límite, navegador, base de datos) pasan en CI en cada cambio.
10. Inventario inicial cargado desde un conteo físico firmado por Eduardo, con asientos `initial`.
11. Impuestos confirmados por el contador y configurados por tienda.
12. Procedimiento de reversión probado (redeploy del commit anterior + restauración de copia).

Mientras falte cualquiera de ellos, el sistema puede usarse para demostraciones y para preparar
datos, pero no para vender ni para llevar el inventario real.
