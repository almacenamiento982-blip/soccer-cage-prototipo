// Prueba del núcleo (Store) sin navegador.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const DOCS = require('path').join(__dirname, '..', 'docs');

const mem = {};
const ctx = vm.createContext({
  console: Object.assign({}, console, { warn: (...a) => { if (!String(a[0]).startsWith('Falta')) console.warn(...a); } }),
  localStorage: {
    getItem: k => (k in mem ? mem[k] : null),
    setItem: (k, v) => { mem[k] = String(v); },
    removeItem: k => { delete mem[k]; }
  },
  document: { addEventListener() {}, getElementById() { return null; }, documentElement: {} },
  setTimeout, Date, Math, JSON
});
for (const f of ['js/i18n.js', 'js/catalog.js', 'js/data.js', 'js/store.js', 'js/ui.js']) {
  vm.runInContext(fs.readFileSync(path.join(DOCS, f), 'utf8'), ctx, { filename: f });
}
const run = code => vm.runInContext(code, ctx);

let fails = 0;
const ok = (cond, label, extra) => {
  if (!cond) fails++;
  console.log((cond ? '  ok   ' : '  FAIL ') + label + (extra !== undefined ? '  → ' + JSON.stringify(extra) : ''));
};

run('I18N.lang = "es"; Store.load();');
const S = run('Store');

console.log('\n== Carga ==');
ok(S.products.length === 45, 'productos = 45 (40 importados + 5 camp/clínica)', S.products.length);
ok(S.products.filter(p => p.kind === 'kit').length === 7, '7 kits', S.products.filter(p => p.kind === 'kit').length);
ok(S.stores.length === 3, '3 tiendas');
console.log('  pedidos:', S.orders.map(o => `${o.number} ${o.status} ${o.fulfillment} $${o.total}`).join(' | '));
console.log('  clientes:', S.customers.map(c => `${c.name}(${c.orders}/$${c.spent})`).join(', '));
console.log('  movimientos:', S.movements.length, '· entregados:', S.roster.filter(e => e.status === 'entregado').map(e => e.id).join(','));

console.log('\n== Consistencia del libro ==');
let bad = 0;
S.products.forEach(p => p.variants.forEach(v => {
  const last = S.movements.find(m => m.variantId === v.id);   // el más reciente va primero
  if (last && last.after !== v.stock) bad++;
  if (!last && v.stock !== 0) bad++;
  if (v.stock < 0) bad++;
}));
ok(bad === 0, 'stock de cada variante = último asiento del libro', bad);
const sumMov = S.movements.reduce((s, m) => s + (m.type === 'entrada' ? m.qty : -m.qty), 0);
const sumStock = S.products.reduce((s, p) => s + p.variants.reduce((x, v) => x + v.stock, 0), 0);
ok(sumMov === sumStock, 'entradas − salidas = unidades en inventario', { sumMov, sumStock });

console.log('\n== Totales e impuesto ==');
const o1 = S.orders.find(o => o.items.length === 1 && o.items[0].kind === 'kit' && o.fulfillment === 'pickup' && o.status !== 'cancelado');
ok(o1.subtotal === 50 && o1.tax === 3.5 && o1.shipping === 0 && o1.total === 53.5, 'kit $50 + 7% = $53.50, entrega en sitio sin envío', o1);
const o2 = S.orders.find(o => o.fulfillment === 'shipping' && o.items.length === 3);
ok(o2.subtotal === 124 && o2.tax === 8.68 && o2.shipping === 9 && o2.total === 141.68, '2 kits + 2 medias con envío: 124 + 8.68 + 9 = 141.68', [o2.subtotal, o2.tax, o2.shipping, o2.total]);
ok(o2.savings === 14, 'ahorro por kit: 2 × (57 − 50) = 14', o2.savings);

console.log('\n== Regla del kit obligatorio ==');
S.setStore('camps');
S.clearCart();
const jerseyYM = S.variantOf('camp-jersey', 'YM');
ok(S.addItem('camp-jersey', jerseyYM.id, 1).ok, 'se puede añadir una pieza suelta al carrito');
ok(S.kitGate().ok === false, 'visitante sin cuenta y sin kit: bloqueado');
let r = S.placeOrder({ name: 'Nuevo Papá', email: 'nuevo@example.com', fulfillment: 'pickup' });
ok(!r.ok && r.code === 'kit', 'checkout bloqueado para correo nuevo sin kit', r.error);
ok(S.kitGate('laura.gomez@example.com').ok === true, 'Laura ya compró el kit: permitido');
ok(S.kitGate('james.carter@example.com').ok === false, 'James canceló su pedido del kit: vuelve a estar bloqueado');
ok(S.kitGate('daniel.kim@example.com').ok === false, 'Daniel tiene cuenta pero no kit: bloqueado');
const before = jerseyYM.stock;
r = S.placeOrder({ email: 'laura.gomez@example.com', fulfillment: 'pickup' });
ok(r.ok && jerseyYM.stock === before - 1, 'Laura compra solo la camiseta; stock ' + before + ' → ' + jerseyYM.stock);

S.clearCart();
S.addItem('camp-socks', S.variantOf('camp-socks', 'M').id, 1);
const kitSel = [
  { productId: 'camp-jersey', variantId: S.variantOf('camp-jersey', 'YS').id },
  { productId: 'camp-short', variantId: S.variantOf('camp-short', 'YS').id },
  { productId: 'camp-socks', variantId: S.variantOf('camp-socks', 'S').id }
];
ok(S.addKit('camp-kit', kitSel, 1, 'Hijo Nuevo').ok, 'kit añadido al carrito');
ok(S.kitGate('nuevo@example.com').via === 'cart', 'con el kit en el carrito, el correo nuevo ya puede comprar');
const stk = ['camp-jersey:YS', 'camp-short:YS', 'camp-socks:S', 'camp-socks:M'].map(k => S.variantOf(...k.split(':')).stock);
r = S.placeOrder({ name: 'Nuevo Papá', email: 'nuevo@example.com', fulfillment: 'pickup' });
const stk2 = ['camp-jersey:YS', 'camp-short:YS', 'camp-socks:S', 'camp-socks:M'].map(k => S.variantOf(...k.split(':')).stock);
ok(r.ok && stk.every((n, i) => stk2[i] === n - 1), 'el kit descuenta cada pieza en su talla', { antes: stk, despues: stk2 });
ok(r.trace.length === 4, '4 asientos en el libro (3 del kit + 1 suelta)', r.trace.map(m => m.sku + ' ' + m.reason));

console.log('\n== Kit con talla agotada ==');
S.clearCart();
r = S.addKit('camp-kit', [
  { productId: 'camp-jersey', variantId: S.variantOf('camp-jersey', 'YXS').id },
  { productId: 'camp-short', variantId: S.variantOf('camp-short', 'YXS').id },
  { productId: 'camp-socks', variantId: S.variantOf('camp-socks', 'S').id }
], 1);
ok(!r.ok, 'no deja añadir un kit si una pieza está agotada en esa talla', r.error);
r = S.addKit('camp-kit', [{ productId: 'camp-jersey', variantId: S.variantOf('camp-jersey', 'YM').id }], 1);
ok(!r.ok, 'exige talla para todas las piezas', r.error);

console.log('\n== Inventario compartido entre tiendas ==');
const sock = S.variantOf('soc-white', 'M');
const s0 = sock.stock;
S.setStore('lasvegas'); S.clearCart();
const lvKit = S.product('lv-kit-competitive');
const lvSel = S.kitParts(lvKit).map(x => ({ productId: x.product.id, variantId: (x.product.variants.find(v => v.size === (x.product.kind === 'socks' ? 'M' : 'YM'))).id }));
ok(S.addKit('lv-kit-competitive', lvSel, 1, 'LV Kid').ok, 'kit de Las Vegas al carrito');
r = S.placeOrder({ name: 'LV Parent', email: 'lv@example.com', fulfillment: 'shipping', address: { line: '1 Main St', city: 'Las Vegas', state: 'NV', zip: '89101' } });
ok(r.ok && r.order.total === round2(289 * 1.07 + 9), 'pedido LV: 289 + 7% + envío', r.order && r.order.total);
function round2(n) { return Math.round(n * 100) / 100; }
ok(!S.storeCfg('lasvegas').pickup && !S.storeCfg('athletum').pickup && S.storeCfg('camps').pickup, 'academias solo USPS; el campamento conserva la entrega en mano');
S.setStore('lasvegas'); S.clearCart();
ok(S.addKit('lv-kit-competitive', lvSel, 1, 'LV Kid 2').ok, 'otro kit de Las Vegas al carrito');
r = S.placeOrder({ name: 'LV Parent', email: 'lv@example.com', fulfillment: 'pickup' });
ok(!r.ok, 'Las Vegas rechaza "recoger en la academia"', r.error);
r = S.placeOrder({ name: 'LV Parent', email: 'lv@example.com', fulfillment: 'shipping' });
ok(!r.ok, 'envío sin dirección rechazado', r.error);
S.clearCart();
S.setStore('athletum');
ok(S.variantOf('soc-white', 'M').stock === s0 - 1, 'la media blanca vendida en Las Vegas baja también para Athletum', [s0, sock.stock]);
ok(S.hasKit(S.customerByEmail('lv@example.com'), 'lasvegas') && !S.hasKit(S.customerByEmail('lv@example.com'), 'athletum'), 'el kit comprado vale por tienda');

console.log('\n== Entregas (academia / clínica) ==');
ok(S.hasKit(S.customerByEmail('laura.gomez@example.com'), 'athletum'), 'uniforme entregado por academia cuenta como kit en Athletum');
let plan = S.deliveryPlan('r3');
ok(!plan.ok, 'r3 (YL) no se puede entregar: falta una pieza', plan.lines.filter(l => !l.ok).map(l => l.product.name + ' ' + l.size + ' disp ' + l.available));
r = S.deliver('r3');
ok(!r.ok, 'entrega bloqueada con mensaje', r.error);
plan = S.deliveryPlan('r11');
ok(!plan.ok && plan.lines[0].size === '', 'inscripción de clínica sin talla: no entregable');
r = S.deliver('r11', { 'clinic-jersey': 'YL' });
ok(r.ok, 'se entrega al indicar la talla', r.ref);
const cj = S.variantOf('clinic-jersey', 'YL').stock;
ok(S.undoDelivery('r11').ok && S.variantOf('clinic-jersey', 'YL').stock === cj + 1, 'deshacer entrega devuelve la camiseta');
const imp = S.importRoster('player,guardian_email,team,role,jersey_size,sock_size\nTest Kid,test@example.com,U10 Blue,Goalkeeper,Youth Medium,Small\nMateo Gómez,laura.gomez@example.com,U10 Blue,player,YM,S', 'academy');
ok(imp.added === 1 && imp.skipped === 1, 'importar CSV: 1 nuevo, 1 duplicado omitido', imp);
const t = S.roster[S.roster.length - 1];
ok(t.role === 'goalkeeper' && t.size === 'YM' && t.sockSize === 'S', 'normaliza posición y tallas', [t.role, t.size, t.sockSize]);

console.log('\n== Cancelación y productos ==');
const ord = S.orders[0];
const m0 = S.movements.length;
S.state.currentStore = ord.storeId;
r = S.setOrderStatus(ord.id, 'cancelado');
ok(r.restocked && S.movements.length === m0 + 7, 'cancelar el pedido LV devuelve las 7 piezas del kit', S.movements.length - m0);
r = S.saveProduct({ name: 'Parent Cap', sku: 'ACC-CAP', kind: 'accessory', categories: ['accessories'], stores: ['camps'], line: 'camp', price: 18, cost: 7, minStock: 2, active: true, colorHex: '#16181d', image: null, sizes: [{ size: 'U', stock: 10 }] });
ok(r.ok && r.created && r.product.variants[0].stock === 10, 'crear producto con stock inicial asentado', r.product.variants[0]);
r = S.saveProduct(Object.assign({}, r.product, { sizes: [{ size: 'U', stock: 7 }] }));
ok(r.product.variants[0].stock === 7 && S.movements[0].reason === 'count', 'editar stock deja asiento de conteo', S.movements[0].before + '→' + S.movements[0].after);

const m = S.metrics();
console.log('\n== Compras a proveedor: pedido → llegado → vendido → saldo ==');
{
  const demo = S.purchases.map(po => po.number + ':' + po.status);
  ok(demo.join(',') === 'OC-0003:pedido,OC-0002:parcial,OC-0001:recibido', 'la demo trae un pedido recibido, uno a medias y uno en camino', demo);

  const p = S.product('camp-short');
  const vYM = S.variantOf('camp-short', 'YM'), vL = S.variantOf('camp-short', 'L');
  const stock0 = vYM.stock, coming0 = S.onOrder(vYM.id);
  ok(coming0 === 15, 'OC-0003 deja 15 shorts YM "en camino" sin tocar el stock', coming0);

  let r = S.createPurchase({ supplier: '', lines: [{ variantId: vYM.id, qty: 5 }] });
  ok(!r.ok, 'pedido sin proveedor rechazado', r.error);
  r = S.createPurchase({ supplier: 'Prueba', lines: [{ variantId: vYM.id, qty: 0 }] });
  ok(!r.ok, 'pedido sin cantidades rechazado', r.error);
  r = S.createPurchase({ supplier: 'Prueba', lines: [{ variantId: 'camp-kit-U', qty: 3 }] });
  ok(!r.ok, 'no se piden kits: se piden sus piezas', r.error);
  r = S.createPurchase({ supplier: 'Prueba', lines: [{ variantId: vYM.id, qty: 100 }, { variantId: vL.id, qty: 40 }] });
  ok(r.ok && r.purchase.number === 'OC-0004' && vYM.stock === stock0, 'pedido de 140 creado sin sumar al stock', r.purchase && r.purchase.number);
  const po = r.purchase;
  ok(S.onOrder(vYM.id) === coming0 + 100, 'el pedido suma a "en camino"', S.onOrder(vYM.id));

  r = S.receivePurchase(po.id, { [vYM.id]: 101 });
  ok(!r.ok, 'no se puede recibir más de lo que falta', r.error);
  r = S.receivePurchase(po.id, { [vYM.id]: 100, [vL.id]: 10 });
  ok(r.ok && po.status === 'parcial' && vYM.stock === stock0 + 100 && S.movements[0].ref === 'OC-0004' && S.movements[0].reason === 'purchase', 'llegada parcial: entra al stock con movimiento OC-0004', po.status);
  ok(S.onOrder(vL.id) === 30, 'faltan 30 L en camino', S.onOrder(vL.id));
  r = S.cancelPurchase(po.id);
  ok(r.ok && po.status === 'recibido' && S.onOrder(vL.id) === 0 && vL.stock >= 10, 'cerrar sin lo que falta: lo recibido se queda, lo pendiente deja de contar');
  ok(!S.receivePurchase(po.id, { [vL.id]: 1 }).ok, 'un pedido cerrado no recibe más');

  const st = S.uniformStages().find(x => x.p.id === 'camp-short');
  ok(st.total.ordered === 50 + 110 && st.total.onOrder === 50, 'tabla: pedido incluye lo recibido y no lo cancelado', st.total);

  const all = S.uniformStages();
  const bad = all.flatMap(x => x.sizes.filter(s => s.initial + s.arrived - s.sold + s.other !== s.stock).map(s => s.v.sku));
  ok(bad.length === 0, 'en todas las tallas: saldo = inicial + llegado − vendido ± otros', bad.slice(0, 5));

  // Reposición por total del uniforme y aviso por correo al cruzar el punto.
  const socks = S.product('camp-socks');
  socks.reorderPoint = S.productStock(socks) - 2;   // a 2 unidades del punto
  const mails0 = (S.state.outbox || []).filter(m => m.kind === 'reorder').length;
  const vS = S.variantOf('camp-socks', 'S');
  const pendingSocks = S.productOnOrder(socks);
  S.purchases.filter(x => x.status === 'parcial' || x.status === 'pedido').forEach(x => { if (x.lines.some(l => l.productId === 'camp-socks')) S.cancelPurchase(x.id); });
  socks.reorderPoint = S.productStock(socks) - 2;
  S.applyMovement({ variantId: vS.id, type: 'salida', qty: 1, reason: 'damage', ref: 'T1' });
  ok(!S.reorderState(socks).need, 'aún por encima del punto: no avisa');
  S.applyMovement({ variantId: vS.id, type: 'salida', qty: 1, reason: 'damage', ref: 'T2' });
  const mails1 = S.state.outbox.filter(m => m.kind === 'reorder');
  ok(S.reorderState(socks).need && mails1.length === mails0 + 1 && mails1[0].productId === 'camp-socks', 'al llegar al punto: aparece en "por pedir" y sale un correo', mails1[0] && mails1[0].subject);
  S.applyMovement({ variantId: vS.id, type: 'salida', qty: 1, reason: 'damage', ref: 'T3' });
  ok(S.state.outbox.filter(m => m.kind === 'reorder').length === mails0 + 1, 'no repite el correo en cada venta');
  const sug = S.reorderSuggestion(socks);
  ok(sug.every(x => x.qty >= 0) && sug.some(x => x.qty > 0), 'sugiere cantidades por talla', sug);
  r = S.createPurchase({ supplier: 'Prueba', lines: sug });
  ok(r.ok && !S.reorderState(socks).need && S.reorderState(socks).covered, 'con el pedido en camino deja de pedir reposición', S.reorderState(socks));
  ok(pendingSocks >= 0, 'pedido de medias previo contabilizado', pendingSocks);
}

console.log('\n== Arranque limpio: "sin cargar" no es "agotado" ==');
{
  const snap = JSON.stringify(S.state);
  S.resetClean();
  const m = S.metrics();
  ok(m.alertCount === 0 && m.outCount === 0 && m.unloadedCount > 200, 'tras empezar limpio no hay alertas: todo está "sin cargar"', { alertas: m.alertCount, sinCargar: m.unloadedCount });
  ok(S.reorderList().length === 0, 'ni avisos de "hay que pedir más"');
  const jer = S.product('camp-jersey'), vM = S.variantOf('camp-jersey', 'M');
  ok(S.variantStatus(jer, vM) === 'sincargar' && S.productStatus(jer) === 'sincargar' && S.productStatus(S.product('camp-kit')) === 'sincargar', 'talla, producto y kit: "sin cargar"');
  S.applyMovement({ variantId: vM.id, type: 'entrada', qty: 3, reason: 'count', ref: 'CONTEO' });
  ok(S.variantStatus(jer, vM) === 'bajo' && S.metrics().lowCount === 1, 'al cargar 3 (mínimo 4) pasa a "stock bajo" y ahí sí avisa');
  S.applyMovement({ variantId: vM.id, type: 'salida', qty: 3, reason: 'damage', ref: 'MERMA' });
  ok(S.variantStatus(jer, vM) === 'agotado' && S.metrics().outCount === 1, 'si una talla cargada llega a 0 es "agotado" de verdad');
  ok(S.variantStatus(jer, S.variantOf('camp-jersey', 'L')) === 'sincargar', 'las otras tallas siguen "sin cargar"');
  // Volver al estado anterior para las pruebas siguientes
  S.state = JSON.parse(snap);
  S.save();
}

console.log('\n== Métricas ==');
console.log('  ', { invValue: Math.round(m.invValue), units: m.units, skus: m.skuCount, low: m.lowCount, out: m.outCount, salesMonth: m.salesMonth, salesToday: m.salesToday, pending: m.pending });
console.log('  por tienda:', m.byStore.map(b => b.store.short + ' ' + b.orders + '/$' + b.revenue).join(' · '));
console.log('  estado guardado:', (mem.soccercage_db_v2.length / 1024).toFixed(0) + ' KB');

console.log(fails ? `\n${fails} FALLOS` : '\nTODO OK');
process.exit(fails ? 1 : 0);
