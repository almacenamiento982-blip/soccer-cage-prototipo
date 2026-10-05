// Comprueba que cada clave de traducción usada en el código exista en el diccionario (ES y EN).
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const DOCS = require('path').join(__dirname, '..', 'docs');

const ctx = vm.createContext({ console, localStorage: { getItem() { return null; }, setItem() {} }, document: { documentElement: {} } });
vm.runInContext(fs.readFileSync(path.join(DOCS, 'js/i18n.js'), 'utf8') + '\nglobalThis.__D = I18N.DICT;', ctx);
const DICT = ctx.__D;

const NS = ['nav', 'shop', 'cart', 'checkout', 'pay', 'confirm', 'side', 'adm', 'cmp', 'err', 'sys', 'acct', 'gate', 'kit',
  'fulfill', 'store', 'cat', 'kind', 'size', 'reason', 'stock', 'order', 'role', 'program', 'time', 'ui', 'imp', 'mail'];
const keyRe = /['"`]((?:[a-z][A-Za-z0-9]*)(?:\.[A-Za-z0-9_]+)+)['"`]/g;

const used = new Map();
const add = (k, where) => { if (!used.has(k)) used.set(k, where); };

for (const f of ['js/app.js', 'js/store.js', 'js/ui.js', 'js/shop.js', 'js/admin.js', 'js/compare.js', 'js/data.js']) {
  const src = fs.readFileSync(path.join(DOCS, f), 'utf8');
  let m;
  while ((m = keyRe.exec(src))) {
    const k = m[1];
    if (NS.includes(k.split('.')[0]) && !/\.(js|css|jpg|png|com|json)$/.test(k)) add(k, f);
  }
}
const html = fs.readFileSync(path.join(DOCS, 'index.html'), 'utf8');
for (const m of html.matchAll(/data-i18n(?:-aria)?="([^"]+)"/g)) add(m[1], 'index.html');

// Claves que se arman en tiempo de ejecución (prefijo + valor).
const dyn = {
  'cat.': ['player', 'goalkeeper', 'accessories'],
  'kind.': ['kit', 'jersey', 'short', 'socks', 'apparel', 'accessory'],
  'reason.': ['sale', 'sale_kit', 'initial', 'purchase', 'return', 'count', 'fix', 'damage', 'courtesy', 'loss', 'delivery_academy', 'delivery_clinic', 'delivery_undo'],
  'stock.': ['ok', 'bajo', 'agotado', 'inactivo'],
  'order.statusPickup.': ['enviado', 'completado'],
  'adm.orders.status.': ['pendiente', 'procesando', 'enviado', 'completado', 'cancelado'],
  'pay.status.': ['pagado', 'pendiente', 'fallido', 'reembolsado'],
  'fulfill.pickup.': ['camps', 'athletum', 'lasvegas', 'generic'],
  'store.': ['camps.title', 'camps.body', 'athletum.title', 'athletum.body', 'lasvegas.title', 'lasvegas.body', 'generic.title', 'generic.body'],
  'acct.kitOwnedSub.': ['order', 'delivery', 'grant'],
  'adm.customers.kitVia.': ['order', 'delivery', 'grant'],
  'program.': ['academy', 'clinic'],
  'role.': ['admin', 'marketing', 'delivery', 'admin.desc', 'marketing.desc', 'delivery.desc']
};
Object.entries(dyn).forEach(([p, list]) => list.forEach(x => add(p + x, 'dinámica')));

// Prefijos sueltos ('cat.' + c) que el regex captura como clave incompleta: se descartan.
const missing = [...used.keys()].filter(k => !(k in DICT) && !Object.keys(dyn).some(p => p.slice(0, -1) === k)).sort();
const incomplete = Object.keys(DICT).filter(k => !DICT[k].es || !DICT[k].en);
const unused = Object.keys(DICT).filter(k => !used.has(k) && !k.startsWith('cmp.'));

if (process.argv.includes('--unused-json')) { console.log(JSON.stringify(unused)); process.exit(0); }

console.log('claves en diccionario:', Object.keys(DICT).length, '· usadas en código:', used.size);
console.log('\nFALTAN (' + missing.length + '):');
missing.forEach(k => console.log('  ' + k + '   [' + used.get(k) + ']'));
if (incomplete.length) console.log('\nSIN ES o EN:', incomplete.join(', '));
if (process.argv.includes('--unused')) console.log('\nSIN USO (' + unused.length + '):\n  ' + unused.join('\n  '));
else console.log('\nsin uso en el código:', unused.length);
process.exit(missing.length || incomplete.length ? 1 : 0);
