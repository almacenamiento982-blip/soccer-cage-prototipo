// Casos límite sobre el núcleo (Store) sin navegador: validaciones, duplicados,
// cantidades inválidas, referencias inexistentes, repetición de operaciones.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const DOCS = require('path').join(__dirname, '..', 'docs');

function boot(mem) {
  mem = mem || {};
  const ctx = vm.createContext({
    console: Object.assign({}, console, { warn: () => {} }),
    localStorage: {
      getItem: k => (k in mem ? mem[k] : null),
      setItem: (k, v) => { if (mem.__quota && String(v).length > mem.__quota) throw new Error('QuotaExceededError'); mem[k] = String(v); },
      removeItem: k => { delete mem[k]; }
    },
    document: { addEventListener() {}, getElementById() { return null; }, documentElement: {} },
    window: { addEventListener() {} },
    setTimeout, Date, Math, JSON
  });
  for (const f of ['js/i18n.js', 'js/catalog.js', 'js/data.js', 'js/store.js', 'js/ui.js']) {
    vm.runInContext(fs.readFileSync(path.join(DOCS, f), 'utf8'), ctx, { filename: f });
  }
  vm.runInContext('I18N.lang = "es"; Store.load();', ctx);
  return { S: vm.runInContext('Store', ctx), mem, ctx };
}

let fails = 0, n = 0;
const ok = (cond, label, extra) => {
  n++;
  if (!cond) fails++;
  console.log((cond ? '  ok   ' : '  FAIL ') + label + (extra !== undefined ? '  → ' + JSON.stringify(extra) : ''));
};

const { S, mem } = boot();
const v = (p, s) => S.variantOf(p, s);

console.log('== Movimientos: cantidades y referencias inválidas ==');
let r = S.applyMovement({ variantId: 'no-existe', type: 'entrada', qty: 1 });
ok(!r.ok, 'variante inexistente rechazada', r.error);
r = S.applyMovement({ variantId: v('camp-socks', 'M').id, type: 'salida', qty: -5 });
ok(!r.ok, 'cantidad negativa rechazada', r.error);
r = S.applyMovement({ variantId: v('camp-socks', 'M').id, type: 'entrada', qty: 0 });
ok(!r.ok, 'cantidad cero rechazada');
r = S.applyMovement({ variantId: v('camp-socks', 'M').id, type: 'entrada', qty: 2.7 });
ok(r.ok && r.movement.qty === 2, 'decimal se trunca a entero', r.movement && r.movement.qty);
r = S.applyMovement({ variantId: v('camp-socks', 'M').id, type: 'entrada', qty: '12abc' });
ok(!r.ok, 'texto no numérico rechazado');
r = S.applyMovement({ variantId: v('camp-socks', 'M').id, type: 'salida', qty: 99999 });
ok(!r.ok, 'salida mayor que el stock rechazada (nunca negativo)');
r = S.applyMovement({ variantId: v('camp-socks', 'M').id, type: 'otro', qty: 1 });
ok(!r.ok, 'tipo de movimiento desconocido rechazado', r.error);

console.log('\n== Productos: duplicados y valores inválidos (en el núcleo, sin interfaz) ==');
r = S.saveProduct({ name: 'Dup', sku: 'CAMP-JER', kind: 'jersey', categories: ['player'], stores: ['camps'], price: 10, cost: 5, minStock: 1, active: true, sizes: [{ size: 'M', stock: 1 }] });
ok(!r.ok && S.products.filter(p => p.sku === 'CAMP-JER').length === 1, 'SKU duplicado rechazado por el núcleo', r.error);
r = S.saveProduct({ name: 'Neg', sku: 'NEG-1', kind: 'jersey', categories: ['player'], stores: ['camps'], price: -10, cost: -3, minStock: -2, active: true, sizes: [{ size: 'M', stock: -4 }] });
ok(!r.ok && !S.products.find(p => p.sku === 'NEG-1'), 'precio y costo negativos rechazados por el núcleo', r.error);
r = S.saveProduct({ name: '', sku: '', kind: 'jersey', categories: [], stores: [], price: 0, sizes: [] });
ok(!r.ok, 'producto sin nombre ni SKU rechazado por el núcleo', r.error);
r = S.saveProduct({ name: 'Sin tallas', sku: 'SIN-TALLAS', kind: 'jersey', categories: ['player'], stores: ['camps'], price: 5, sizes: [] });
ok(!r.ok, 'pieza sin tallas rechazada', r.error);
r = S.saveProduct({ name: 'Talla rara', sku: 'TALLA-RARA', kind: 'jersey', categories: ['player'], stores: ['camps'], price: 5, sizes: [{ size: 'XXXL', stock: 1 }] });
ok(!r.ok, 'talla desconocida rechazada', r.error);
r = S.saveProduct({ id: 'no-existe', name: 'X' });
ok(!r.ok, 'editar producto inexistente rechazado');
r = S.saveProduct({ name: 'Kit roto', sku: 'KIT-ROTO', kind: 'kit', categories: ['player'], stores: ['camps'], price: 10, components: [{ productId: 'no-existe', qty: 1 }] });
ok(!r.ok, 'kit con componente inexistente rechazado', r.error);
r = S.saveProduct({ name: 'Kit de kits', sku: 'KIT-KITS', kind: 'kit', categories: ['player'], stores: ['camps'], price: 10, components: [{ productId: 'camp-kit', qty: 1 }] });
ok(!r.ok, 'un kit no puede contener otro kit', r.error);
r = S.saveProduct({ name: 'Stock negativo', sku: 'STK-NEG', kind: 'socks', categories: ['player'], stores: ['camps'], price: 5, cost: 2, minStock: 1, sizes: [{ size: 'M', stock: -4 }] });
ok(r.ok && r.product.variants[0].stock === 0, 'stock negativo se guarda como 0');

console.log('\n== Carrito: cantidades inválidas ==');
S.setStore('camps'); S.clearCart();
r = S.addItem('camp-socks', v('camp-socks', 'M').id, 0);
ok(!r.ok && S.cart.length === 0, 'cantidad 0 rechazada por el núcleo', r.error);
r = S.addItem('camp-socks', v('camp-socks', 'M').id, -3);
ok(!r.ok && S.cart.length === 0, 'cantidad negativa rechazada por el núcleo', r.error);
S.clearCart();
r = S.addItem('clinic-jersey', v('clinic-jersey', 'YM').id, 1);
ok(!r.ok, 'producto de uso interno no se puede añadir al carrito');
r = S.addItem('ath-jer-home', v('ath-jer-home', 'M').id, 1);
ok(!r.ok, 'producto de otra tienda no se puede añadir desde Camps');
r = S.updateLineQty('L-no', 2);
ok(!r.ok, 'línea inexistente rechazada');

console.log('\n== Cuentas y regla del kit ==');
r = S.signIn({ email: 'no-es-correo' });
ok(!r.ok, 'correo inválido rechazado');
r = S.signIn({ email: 'Laura.Gomez@Example.com' });
ok(r.ok && r.customer.email === 'laura.gomez@example.com', 'correo con mayúsculas encuentra la misma cuenta', r.customer && r.customer.email);
r = S.signIn({ email: 'nuevo2@example.com' });
ok(!r.ok && r.needName, 'cuenta nueva sin nombre: pide el nombre');
r = S.signIn({ email: 'nuevo2@example.com', name: '<b>x</b>' });
ok(r.ok, 'nombre con HTML se guarda tal cual (debe escaparse al mostrar)');
ok(S.hasKit(S.customerByEmail('laura.gomez@example.com'), 'camps'), 'HALLAZGO (seguridad): cualquiera que escriba el correo de otra familia obtiene su condición de "kit comprado": no hay contraseña');

console.log('\n== Pedidos: repetición y estados ==');
S.clearCart();
S.addKit('camp-kit', [
  { productId: 'camp-jersey', variantId: v('camp-jersey', 'YM').id },
  { productId: 'camp-short', variantId: v('camp-short', 'YM').id },
  { productId: 'camp-socks', variantId: v('camp-socks', 'S').id }
], 1, 'Kid');
const before = v('camp-jersey', 'YM').stock;
const o1 = S.placeOrder({ email: 'rep@example.com', name: 'Rep', fulfillment: 'pickup' });
const o2 = S.placeOrder({ email: 'rep@example.com', name: 'Rep', fulfillment: 'pickup' });
ok(o1.ok && !o2.ok && v('camp-jersey', 'YM').stock === before - 1, 'un segundo placeOrder con el carrito ya vacío no duplica el pedido', o2.error);
r = S.setOrderStatus(o1.order.id, 'cancelado');
const r2 = S.setOrderStatus(o1.order.id, 'cancelado');
ok(r.restocked && !r2.restocked && v('camp-jersey', 'YM').stock === before, 'cancelar dos veces no devuelve el stock dos veces');
r = S.setOrderStatus(o1.order.id, 'completado');
ok(!r.ok && o1.order.status === 'cancelado', 'un pedido cancelado no puede pasar a completado', r.error);
r = S.setOrderStatus(o1.order.id, 'estado-inventado');
ok(!r.ok, 'estado de pedido desconocido rechazado');
const o3 = S.orders.find(o => o.status === 'pendiente');
r = S.setOrderStatus(o3.id, 'completado');
ok(!r.ok && o3.status === 'pendiente', 'no se puede saltar de pendiente a completado');
r = S.setOrderStatus('no-existe', 'enviado');
ok(!r.ok, 'pedido inexistente rechazado');

console.log('\n== Entregas e importación ==');
r = S.deliver('no-existe');
ok(!r.ok, 'entrega de registro inexistente rechazada');
r = S.importRoster('', 'academy');
ok(r.ok && r.added === 0, 'CSV vacío: nada importado');
r = S.importRoster('player,email\n"Doe, John",p@example.com,U10,player,YM,S', 'academy');
const last = S.roster[S.roster.length - 1];
ok(last.player === 'Doe, John' && last.email === 'p@example.com' && last.size === 'YM', 'CSV con comas entre comillas ("Doe, John") se interpreta bien', { player: last.player, email: last.email, size: last.size });
r = S.importRoster('Kid B;kb@example.com;U10;player;YL;M', 'academy');
ok(S.roster[S.roster.length - 1].size === 'YL', 'CSV separado por punto y coma también funciona');
r = S.importRoster('x,y\nKid,k@example.com,T,player,XXL,S', 'academy');
ok(S.roster[S.roster.length - 1].size === '', 'talla desconocida (XXL) queda vacía para corregir a mano');
r = S.importRoster('Kid,k@example.com', 'programa-inexistente');
ok(!r.ok, 'programa inexistente rechazado');

console.log('\n== Persistencia ==');
const { S: S2 } = boot(mem);
ok(S2.orders.length === S.orders.length && S2.products.length === S.products.length, 'el estado sobrevive a una recarga (misma memoria del navegador)');
const { S: S3 } = boot({});
ok(S3.orders.length !== S.orders.length, 'HALLAZGO: otro navegador/dispositivo arranca con la demo desde cero: no hay datos centralizados', { aqui: S.orders.length, otro: S3.orders.length });
mem.soccercage_db_v2 = '{corrupto';
const { S: S4 } = boot(mem);
ok(S4.products.length > 0, 'estado corrupto: se reinicia la demo sin romper la aplicación (se pierden los datos)');
const big = boot({ __quota: 1000 });
let avisado = false;
big.S.onSaveError = () => { avisado = true; };
const saved = big.S.save();
ok(saved === false && avisado, 'si el almacenamiento está lleno, save() devuelve false y avisa a la interfaz', saved);

console.log('\n== Reimportar el catálogo no borra los datos ==');
const mem2 = {};
const b1 = boot(mem2);
b1.S.applyMovement({ variantId: 'camp-socks-M', type: 'entrada', qty: 7, reason: 'purchase', ref: 'ANTES' });
const ordersAntes = b1.S.orders.length, stockAntes = b1.S.variantOf('camp-socks', 'M').stock;
const st = JSON.parse(mem2.soccercage_db_v2); st.version = '5:2020-01-01'; mem2.soccercage_db_v2 = JSON.stringify(st);
const b2 = boot(mem2);
ok(b2.S.orders.length === ordersAntes && b2.S.variantOf('camp-socks', 'M').stock === stockAntes, 'con fecha de catálogo distinta se conservan pedidos y stock', { pedidos: b2.S.orders.length, stock: b2.S.variantOf('camp-socks', 'M').stock });
ok(b2.S.state.version === b2.S.versionTag(), 'la versión queda actualizada tras la fusión');
st.version = '4:x'; mem2.soccercage_db_v2 = JSON.stringify(st);
const b3 = boot(mem2);
ok(b3.S.orders.length !== ordersAntes || b3.S.movements.every(m => m.ref !== 'ANTES'), 'un cambio de esquema sí reinicia la demo (documentado)');

console.log('\n== Dos pestañas: la escritura con datos viejos se descarta ==');
const mem3 = {};
const tabA = boot(mem3), tabB = boot(mem3);
tabA.S.applyMovement({ variantId: 'camp-socks-M', type: 'entrada', qty: 10, reason: 'purchase', ref: 'A' });
let conflicto = false;
tabB.S.onConflict = () => { conflicto = true; };
const rb = tabB.S.applyMovement({ variantId: 'camp-socks-M', type: 'entrada', qty: 5, reason: 'purchase', ref: 'B' });
const diskStock = JSON.parse(mem3.soccercage_db_v2).products.find(p => p.id === 'camp-socks').variants.find(x => x.size === 'M').stock;
ok(conflicto && diskStock === tabA.S.variantOf('camp-socks', 'M').stock, 'la pestaña B detecta que A guardó antes: no pisa sus datos y avisa', { conflicto, guardado: diskStock, A: tabA.S.variantOf('camp-socks', 'M').stock, B: tabB.S.variantOf('camp-socks', 'M').stock });
ok(tabB.S.syncFromStorage() === false && tabB.S.state.rev === tabA.S.state.rev, 'tras el conflicto B ya tiene la revisión de A');
const rb2 = tabB.S.applyMovement({ variantId: 'camp-socks-M', type: 'entrada', qty: 5, reason: 'purchase', ref: 'B2' });
ok(rb2.ok && JSON.parse(mem3.soccercage_db_v2).movements[0].ref === 'B2', 'al repetir la operación en B, ahora sí se guarda sobre los datos actuales');

console.log('\n== Integridad tras todo lo anterior ==');
let bad = 0;
S.products.forEach(p => p.variants.forEach(x => { if (x.stock < 0) bad++; }));
ok(bad === 0, 'ninguna variante quedó en negativo');
const sumMov = S.movements.reduce((s, m) => s + (m.type === 'entrada' ? m.qty : -m.qty), 0);
const sumStock = S.products.reduce((s, p) => s + p.variants.reduce((x, y) => x + y.stock, 0), 0);
ok(sumMov === sumStock, 'libro de movimientos cuadra con el inventario', { sumMov, sumStock });

console.log(`\n${n} comprobaciones · ${fails} con hallazgo`);
