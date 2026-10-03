// Casos límite en navegador: formularios, doble clic, recarga a mitad de pago,
// dos pestañas, inyección de HTML, cuota de almacenamiento, enlaces y botones.
// Cada sección es independiente: un fallo no detiene las demás.
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8790/';

let fails = 0, n = 0;
const ok = (cond, label, extra) => {
  n++;
  if (!cond) fails++;
  console.log((cond ? '  ok   ' : '  FAIL ') + label + (extra !== undefined ? '  → ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)) : ''));
};
const watch = page => {
  const issues = [];
  page.on('pageerror', e => issues.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') issues.push('console: ' + m.text()); });
  page.on('dialog', d => { issues.push('DIALOG: ' + d.message()); d.dismiss(); });
  return issues;
};
const diag = async page => ({
  toasts: await page.locator('.toast').allInnerTexts().catch(() => []),
  errores: await page.locator('.err-msg.show').allInnerTexts().catch(() => []),
  inputs: await page.locator('.input.error').evaluateAll(l => l.map(i => i.id + '=' + i.value)).catch(() => [])
});

const sections = {
  async formularios(page) {
    await page.click('#btnAdmin');
    await page.click('.side-link[data-page="products"]');
    await page.click('#prodNew');
    await page.waitForSelector('#pfSave');
    await page.click('#pfSave');
    ok(await page.locator('#pfErrName.show').count() === 1 && await page.locator('#pfErrSku.show').count() === 1, 'producto: nombre y SKU obligatorios');
    await page.fill('#pfName', 'Prueba');
    await page.fill('#pfSku', 'camp-jer');
    await page.fill('#pfPrice', '10');
    await page.click('#pfSave');
    ok(await page.locator('#pfSave').count() === 1, 'producto: SKU duplicado (en minúsculas) rechazado por el formulario');
    await page.fill('#pfSku', 'PRUEBA-1');
    await page.fill('#pfPrice', '-5');
    await page.click('#pfSave');
    ok(await page.locator('#pfSave').count() === 1, 'producto: precio negativo rechazado');
    await page.fill('#pfPrice', '10');
    await page.click('[data-preset="one"]');
    await page.fill('[data-sz-stock="U"]', '-7');
    await page.locator('[data-sz-stock="U"]').dispatchEvent('change');
    await page.click('#pfSave');
    await page.waitForSelector('#pfSave', { state: 'detached' });
    const st = await page.evaluate(() => Store.products.find(p => p.sku === 'PRUEBA-1').variants[0].stock);
    ok(st === 0, 'producto: stock negativo se guarda como 0', st);

    await page.click('.side-link[data-page="inventory"]');
    await page.click('#invMove');
    await page.waitForSelector('#mvSave');
    await page.fill('#mvQty', '-3');
    await page.locator('#mvQty').dispatchEvent('input');
    ok(!(await page.locator('#mvSave').isEnabled()), 'movimiento: cantidad negativa deshabilita el botón');
    await page.fill('#mvQty', '0');
    await page.locator('#mvQty').dispatchEvent('input');
    ok(!(await page.locator('#mvSave').isEnabled()), 'movimiento: cantidad cero deshabilita el botón');
    await page.selectOption('#mvType', 'salida');
    await page.fill('#mvQty', '99999');
    await page.locator('#mvQty').dispatchEvent('input');
    ok(!(await page.locator('#mvSave').isEnabled()) && await page.locator('#mvPreview.alert-danger').count() === 1, 'movimiento: salida mayor que el stock bloqueada con aviso');
    await page.keyboard.press('Escape');

    await page.click('.side-link[data-page="deliveries"]');
    await page.click('#delImport');
    await page.waitForSelector('#imGo');
    await page.click('#imGo');
    ok(await page.locator('#imGo').count() === 1 && (await page.locator('.toast').allInnerTexts()).join().includes('Nada que importar'), 'importar lista: vacío avisa y no cierra');
    await page.keyboard.press('Escape');
  },

  async confirmaciones(page) {
    await page.click('#btnAdmin');
    await page.click('.side-link[data-page="products"]');
    await page.locator('[data-toggle]').first().click();
    ok(await page.locator('#confirmYes').count() === 1, 'desactivar producto pide confirmación');
    await page.keyboard.press('Escape');
    await page.click('.side-link[data-page="orders"]');
    await page.locator('[data-order]').first().click();
    await page.waitForSelector('#odCancel');
    await page.click('#odCancel');
    ok(await page.locator('#confirmYes').count() === 1, 'cancelar pedido pide confirmación');
    await page.keyboard.press('Escape');
    await page.click('.side-link[data-page="dashboard"]');
    await page.click('#dashReset');
    ok(await page.locator('#confirmYes').count() === 1, 'reiniciar demo pide confirmación');
    await page.keyboard.press('Escape');
    await page.click('.side-link[data-page="deliveries"]');
    await page.locator('[data-undo]').first().click();
    ok(await page.locator('#confirmYes').count() === 1, 'deshacer entrega pide confirmación');
    await page.keyboard.press('Escape');
  },

  async inyeccion(page, issues) {
    await page.click('#btnAdmin');
    await page.click('.side-link[data-page="products"]');
    await page.click('#prodNew');
    await page.waitForSelector('#pfSave');
    await page.waitForTimeout(150);   // el formulario enfoca el nombre 60 ms después de abrirse
    const trace = async t => { if (process.env.TRACE) console.log('  TRACE', t, 'sku=' + JSON.stringify(await page.inputValue('#pfSku')), 'modales=' + await page.locator('#modalBox > *').count()); };
    await page.fill('#pfName', '<img src=x onerror="window.__xss=1">Malo');
    await page.fill('#pfSku', 'XSS-1'); await trace('sku');
    await page.fill('#pfPrice', '10'); await trace('precio');
    await page.click('[data-preset="one"]'); await trace('preset');
    await page.fill('[data-sz-stock="U"]', '5');
    await page.locator('[data-sz-stock="U"]').dispatchEvent('change'); await trace('stock');
    await page.click('#pfSave');
    await page.waitForTimeout(600);
    if (await page.locator('#pfSave').count()) console.log('  DIAG formulario abierto:', JSON.stringify(await diag(page)));
    await page.waitForSelector('#pfSave', { state: 'detached', timeout: 5000 });
    await page.click('#btnShop');
    await page.locator('.p-card').filter({ hasText: 'Malo' }).first().click();
    await page.waitForSelector('#addCart');
    await page.click('#addCart');
    await page.waitForSelector('#cartDrawer.open');
    await page.click('#goCheckout');
    await page.waitForSelector('#acEmail');
    await page.fill('#acEmail', 'xss@example.com');
    await page.fill('#acName', '<script>window.__xss2=1</script>Pepe');
    await page.click('#acGo');
    await page.waitForTimeout(400);
    const xss = await page.evaluate(() => [window.__xss, window.__xss2]);
    ok(!xss[0] && !xss[1], 'HTML en nombre de producto y de cliente no se ejecuta (se escapa)', xss);
    ok(issues.filter(i => i.startsWith('DIALOG')).length === 0, 'sin diálogos inesperados');
    await page.keyboard.press('Escape');
    await page.evaluate(() => Store.clearCart());
  },

  async dobleClic(page) {
    await page.click('#btnShop');
    await page.evaluate(() => Store.clearCart());
    await page.click('.kit-card');
    await page.waitForSelector('#addKit');
    await page.click('[data-quick="YM"]');
    await page.click('#addKit');
    await page.waitForSelector('#cartDrawer.open');
    await page.click('#goCheckout');
    await page.waitForSelector('#payNow');
    const ordersBefore = await page.evaluate(() => Store.orders.length);
    await page.fill('#ckEmail', 'doble@example.com');
    await page.fill('#ckName', 'Doble Clic');
    await page.click('#payNow');
    await page.click('#payNow', { force: true, timeout: 500 }).catch(() => {});
    await page.waitForSelector('.success-mark', { timeout: 8000 });
    const ordersAfter = await page.evaluate(() => Store.orders.length);
    ok(ordersAfter === ordersBefore + 1, 'dos clics seguidos en Pagar crean un solo pedido', { ordersBefore, ordersAfter });
    await page.keyboard.press('Escape');
  },

  async recarga(page) {
    await page.click('#btnShop');
    await page.evaluate(() => Store.clearCart());
    await page.click('.p-card[data-id="camp-socks"]');
    await page.click('.size-btn[data-size="M"]');
    await page.click('#addCart');
    await page.waitForSelector('#cartDrawer.open');
    await page.click('#goCheckout');
    await page.waitForSelector('#payNow');
    const sockBefore = await page.evaluate(() => Store.variantOf('camp-socks', 'M').stock);
    const ob = await page.evaluate(() => Store.orders.length);
    await page.click('#payNow');
    await page.waitForTimeout(800);   // en plena animación de "procesando"
    await page.reload();
    await page.waitForSelector('.kit-card');
    const after = await page.evaluate(() => ({ stock: Store.variantOf('camp-socks', 'M').stock, orders: Store.orders.length, cart: Store.cart.length }));
    ok(after.orders === ob && after.stock === sockBefore && after.cart === 1, 'recargar durante el pago: ni pedido ni descuento; el carrito se conserva para reintentar', after);
    await page.evaluate(() => Store.clearCart());
  },

  async dosPestanas(page, issues, ctx) {
    const page2 = await ctx.newPage();
    const issues2 = watch(page2);
    await page2.goto(BASE);
    await page2.waitForSelector('.kit-card');
    const s0 = await page.evaluate(() => Store.variantOf('camp-jersey', 'L').stock);
    await page.evaluate(() => Store.applyMovement({ variantId: 'camp-jersey-L', type: 'entrada', qty: 10, reason: 'purchase', ref: 'TAB-1' }));
    await page.waitForTimeout(250);   // la otra pestaña recibe el evento de almacenamiento
    await page2.evaluate(() => Store.applyMovement({ variantId: 'camp-jersey-L', type: 'entrada', qty: 5, reason: 'purchase', ref: 'TAB-2' }));
    await page.waitForTimeout(400);
    const [t1, t2, disk] = await Promise.all([
      page.evaluate(() => Store.variantOf('camp-jersey', 'L').stock),
      page2.evaluate(() => Store.variantOf('camp-jersey', 'L').stock),
      page2.evaluate(() => JSON.parse(localStorage.getItem('soccercage_db_v2')).products.find(p => p.id === 'camp-jersey').variants.find(v => v.size === 'L').stock)
    ]);
    ok(disk === s0 + 15, 'dos pestañas que registran entradas: el inventario guardado suma las dos (' + s0 + ' + 10 + 5)', { pestaña1: t1, pestaña2: t2, guardado: disk });
    issues.push(...issues2);
    await page2.close();
  },

  async cuota(page) {
    const quota = await page.evaluate(() => {
      const big = 'x'.repeat(6 * 1024 * 1024);
      const p = Store.product('camp-jersey');
      const old = p.image;
      p.image = 'data:image/jpeg;base64,' + big;
      const saved = Store.save();
      p.image = old; Store.save();
      return saved;
    });
    ok(quota === false, 'foto de 6 MB: el guardado falla y la función lo reporta', quota);
  },

  async navegacion(page) {
    const dead = await page.evaluate(() => [...document.querySelectorAll('a[href]')].filter(a => a.getAttribute('href') === '#' || a.getAttribute('href') === '').length);
    ok(dead === 0, 'sin enlaces vacíos o "#"', dead);
    await page.click('#btnAdmin');
    let bad = [];
    for (const p of ['dashboard', 'inventory', 'products', 'movements', 'deliveries', 'orders', 'customers', 'stores', 'alerts', 'reports', 'settings']) {
      await page.click(`.side-link[data-page="${p}"]`);
      if (await page.locator(`#page-${p}.active`).count() !== 1) bad.push(p);
    }
    ok(bad.length === 0, 'los 11 enlaces del menú abren su sección', bad);
    await page.click('.side-link[data-page="settings"]');
    await page.click('#stSave');
    ok(await page.locator('.toast.ok').count() >= 1, 'configuración: guardar muestra confirmación');
    await page.click('#langBtn');
    const en = await page.locator('#page-settings h1').innerText();
    await page.click('#langBtn');
    ok(en === 'Settings', 'cambio de idioma repinta el panel', en);
  },

  async permisos(page) {
    const roles = await page.evaluate(() => Store.state.users.map(u => u.role));
    ok(true, 'HALLAZGO: no hay inicio de sesión ni permisos en el panel; el rol es un selector (' + roles.join(', ') + ')');
    const canEdit = await page.evaluate(() => { Store.state.currentUser = 'u3'; const r = Store.toggleProduct('camp-socks'); Store.toggleProduct('camp-socks'); Store.state.currentUser = 'u1'; Store.save(); return r.ok; });
    ok(canEdit, 'HALLAZGO: el usuario "Staff Camps" (entregas) puede desactivar productos: el rol no restringe nada');
    const tamper = await page.evaluate(() => { const v = Store.variantOf('camp-socks', 'M'); const b = v.stock; v.stock = 9999; Store.save(); const r = v.stock; v.stock = b; Store.save(); return r; });
    ok(tamper === 9999, 'HALLAZGO: desde la consola del navegador se puede cambiar el stock sin dejar movimiento (los datos viven en el cliente)');
  }
};

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  const issues = watch(page);
  await page.goto(BASE);
  await page.waitForSelector('.kit-card');

  const only = (process.env.ONLY || '').split(',').filter(Boolean);
  for (const [name, fn] of Object.entries(sections)) {
    if (only.length && !only.includes(name)) continue;
    console.log('\n== ' + name + ' ==');
    try { await fn(page, issues, ctx); }
    catch (e) {
      ok(false, 'excepción: ' + e.message.split('\n')[0], await diag(page));
      await page.keyboard.press('Escape').catch(() => {});
      await page.evaluate(() => { UI.closeModal(); Shop.closeCart(); }).catch(() => {});
    }
  }

  console.log('');
  ok(issues.length === 0, 'sin errores de ejecución en consola', issues);
  await browser.close();
  console.log(`\n${n} comprobaciones · ${fails} fallos`);
  process.exit(fails ? 1 : 0);
})();
