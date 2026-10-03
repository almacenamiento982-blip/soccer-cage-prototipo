// Pruebas en navegador real (Chrome instalado) con playwright-core.
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:8790/';
const SHOTS = path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

let fails = 0;
const ok = (cond, label, extra) => {
  if (!cond) fails++;
  console.log((cond ? '  ok   ' : '  FAIL ') + label + (extra !== undefined ? '  → ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)) : ''));
};

async function newPage(browser, opts) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const issues = [];
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) issues.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => issues.push('pageerror: ' + e.message));
  page.on('requestfailed', r => issues.push('requestfailed: ' + r.url()));
  page.on('response', r => { if (r.status() >= 400) issues.push('http ' + r.status() + ': ' + r.url()); });
  page.issues = issues;
  page.shot = async (name, full) => {
    if (full) {
      // Las fotos usan carga diferida: se recorre la página para que aparezcan en la captura.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 70)); }
        window.scrollTo(0, 0);
      });
      await page.waitForLoadState('networkidle');
    }
    await page.waitForTimeout(450);   // deja terminar las transiciones
    return page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: !!full });
  };
  return page;
}

const scenarios = {
  /* Recorrido visual: tres tiendas, kit, pieza suelta */
  async smoke(browser) {
    const page = await newPage(browser, { viewport: { width: 1366, height: 900 } });
    await page.goto(BASE);
    await page.waitForSelector('.kit-card');
    await page.waitForLoadState('networkidle');
    ok(await page.locator('.store-tab').count() === 3, 'tres pestañas de tienda');
    ok(await page.locator('.kit-card').count() === 1, 'Camps muestra 1 kit');
    ok(await page.locator('.p-card').count() === 3, 'Camps muestra 3 piezas sueltas (la camiseta de clínica no se vende)', await page.locator('.p-card').count());
    await page.shot('01-camps', true);

    await page.click('.store-tab[data-store="athletum"]');
    await page.waitForLoadState('networkidle');
    ok(await page.locator('.kit-card').count() === 4, 'Athletum muestra 4 kits');
    ok(await page.locator('.p-card').count() === 27, 'Athletum muestra 27 piezas', await page.locator('.p-card').count());
    const broken = await page.evaluate(() => [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.src));
    ok(broken.length === 0, 'todas las fotos cargan', broken);
    await page.shot('02-athletum', true);

    await page.click('.store-tab[data-store="lasvegas"]');
    await page.waitForLoadState('networkidle');
    ok(await page.locator('.kit-card').count() === 2 && await page.locator('.p-card').count() === 13, 'Las Vegas: 2 kits y 13 piezas');
    await page.shot('03-lasvegas', true);

    await page.click('.kit-card[data-kit="lv-kit-competitive"]');
    await page.waitForSelector('#addKit');
    await page.click('[data-quick="YM"]');
    await page.shot('04-kit-lasvegas');
    ok(await page.locator('#addKit').isEnabled(), 'con talla YM para todo, el kit queda listo', await page.locator('#addKit').innerText());
    await page.keyboard.press('Escape');

    await page.click('.store-tab[data-store="camps"]');
    await page.click('.p-card[data-id="camp-jersey"]');
    await page.waitForSelector('#addCart');
    await page.shot('05-pieza-suelta');
    ok(await page.locator('.modal .alert-warn').count() === 1, 'la pieza suelta avisa que requiere el kit');
    await page.keyboard.press('Escape');

    ok(page.issues.length === 0, 'sin errores ni advertencias en consola', page.issues);
    await page.context().close();
  },

  /* Flujo completo de compra y regla del kit */
  async buy(browser) {
    const page = await newPage(browser, { viewport: { width: 1366, height: 900 } });
    await page.goto(BASE);
    await page.waitForSelector('.kit-card');
    const stock = (pid, size) => page.evaluate(([p, s]) => Store.variantOf(p, s).stock, [pid, size]);

    // 1) Visitante intenta comprar solo una camiseta
    await page.click('.p-card[data-id="camp-jersey"]');
    await page.click('.size-btn[data-size="YM"]');
    await page.click('#addCart');
    await page.waitForSelector('#cartDrawer.open');
    ok(await page.locator('.gate-banner').count() === 1, 'carrito avisa que falta el kit');
    await page.shot('10-carrito-sin-kit');
    await page.click('#goCheckout');
    await page.waitForSelector('#acEmail');
    ok(true, 'al pagar sin kit pide identificarse');

    // 2) Cuenta sin kit: sigue bloqueado
    await page.fill('#acEmail', 'daniel.kim@example.com');
    await page.click('#acGo');
    await page.waitForSelector('#cartDrawer.open');
    ok(await page.locator('#payNow').count() === 0 && await page.locator('.gate-banner').count() === 1, 'cuenta sin kit: no llega al pago');

    // 3) Agrega el kit desde el aviso
    await page.click('#gateKit');
    await page.waitForSelector('#addKit');
    ok(!(await page.locator('#addKit').isEnabled()), 'kit sin tallas: botón deshabilitado', await page.locator('#addKit').innerText());
    await page.fill('#kitPlayer', 'Ethan Kim');
    await page.click('[data-quick="YXS"]');
    ok(!(await page.locator('#addKit').isEnabled()), 'talla YXS: short agotado, no deja añadir', await page.locator('.modal .err-msg.show').innerText());
    await page.shot('11-kit-talla-agotada');
    await page.click('[data-quick="YL"]');
    ok(await page.locator('#addKit').isEnabled(), 'talla YL: disponible');
    ok(await page.locator('#kitPlayer').inputValue() === 'Ethan Kim', 'el nombre del jugador se conserva al cambiar tallas');
    await page.shot('12-kit-listo');
    await page.click('#addKit');
    await page.waitForSelector('#cartDrawer.open');
    ok(await page.locator('.gate-banner').count() === 0, 'con el kit en el carrito desaparece el aviso');
    await page.shot('13-carrito-con-kit');

    // 4) Checkout con entrega en el campamento
    const before = [await stock('camp-jersey', 'YL'), await stock('camp-short', 'YL'), await stock('camp-socks', 'M'), await stock('camp-jersey', 'YM')];
    await page.click('#goCheckout');
    await page.waitForSelector('#payNow');
    ok(await page.locator('#ckEmail').inputValue() === 'daniel.kim@example.com', 'checkout precarga la cuenta');
    const payText = await page.locator('#payNow').innerText();
    ok(/80\.25/.test(payText), 'total con entrega en sitio: (50 + 25) × 1.07 = $80.25', payText);
    await page.shot('14-checkout-pickup');
    await page.check('input[name="ckFulfill"][value="shipping"]');
    const payShip = await page.locator('#payNow').innerText();
    ok(/89\.25/.test(payShip), 'con envío USPS suma $9: $89.25', payShip);
    await page.click('#payNow');
    ok(await page.locator('#errAddr.show').count() === 1, 'envío exige dirección');
    await page.check('input[name="ckFulfill"][value="pickup"]');
    await page.click('#payNow');
    await page.waitForSelector('.success-mark', { timeout: 15000 });
    await page.shot('15-confirmacion');
    const after = [await stock('camp-jersey', 'YL'), await stock('camp-short', 'YL'), await stock('camp-socks', 'M'), await stock('camp-jersey', 'YM')];
    ok(before.every((n, i) => after[i] === n - 1), 'inventario descontado pieza por pieza', { before, after });

    // 5) Segunda compra: ya tiene kit, compra solo medias
    await page.click('.modal-foot .btn:not(.btn-primary)');
    ok(/Kit comprado/.test(await page.locator('#shopAccount').innerText()), 'la cuenta ahora muestra "Kit comprado"');
    await page.click('.p-card[data-id="camp-socks"]');
    ok(await page.locator('.modal .alert-warn').count() === 0, 'la pieza suelta ya no pide kit');
    await page.click('.size-btn[data-size="M"]');
    await page.click('#addCart');
    await page.waitForSelector('#cartDrawer.open');
    await page.click('#goCheckout');
    await page.waitForSelector('#payNow');
    ok(/12\.84/.test(await page.locator('#payNow').innerText()), 'segunda compra sin kit: $12 + 7% = $12.84');
    await page.click('#payNow');
    await page.waitForSelector('.success-mark', { timeout: 15000 });

    // 6) El pedido aparece en el panel
    await page.click('#seeOrder');
    await page.waitForSelector('#page-orders.active table');
    await page.shot('16-admin-pedidos', true);
    ok(/Daniel Kim/.test(await page.locator('#page-orders tbody tr').first().innerText()), 'el pedido nuevo encabeza la lista del panel');
    await page.locator('#page-orders [data-order]').nth(1).click();
    await page.waitForSelector('.modal .trace');
    await page.shot('17-admin-detalle-pedido');
    ok(await page.locator('.modal tr.sub-row').count() === 3, 'el detalle desglosa las 3 piezas del kit');

    ok(page.issues.length === 0, 'sin errores ni advertencias en consola', page.issues);
    await page.context().close();
  },

  /* Panel de administración: todas las páginas y los formularios */
  async admin(browser) {
    const page = await newPage(browser, { viewport: { width: 1366, height: 900 } });
    await page.goto(BASE);
    await page.click('#btnAdmin');
    const pages = ['dashboard', 'inventory', 'products', 'movements', 'deliveries', 'orders', 'customers', 'stores', 'alerts', 'reports', 'settings'];
    for (const p of pages) {
      await page.click(`.side-link[data-page="${p}"]`);
      await page.waitForSelector(`#page-${p}.active`);
      const len = (await page.locator(`#page-${p}`).innerText()).length;
      ok(len > 120, `página ${p} con contenido`, len);
      await page.shot('20-admin-' + p, true);
    }

    // Buscar con espacios (antes se perdían)
    await page.click('.side-link[data-page="inventory"]');
    await page.fill('#invQ', '');
    await page.type('#invQ', 'camp jersey');
    ok(await page.locator('#invQ').inputValue() === 'camp jersey', 'la búsqueda conserva los espacios');
    ok(await page.locator('#page-inventory tbody tr').count() === 7, 'filtra las 7 tallas de Camp Jersey', await page.locator('#page-inventory tbody tr').count());

    // Entregas: inscripción sin talla → se completa y se entrega
    await page.click('.side-link[data-page="deliveries"]');
    const noSize = await page.locator('[data-set-size]').count();
    ok(noSize === 12, '12 inscripciones de clínica sin talla', noSize);
    await page.locator('[data-set-size="r11"]').selectOption('YL');
    await page.click('[data-deliver="r11"]');
    await page.waitForSelector('#delGo');
    await page.shot('21-entrega-form');
    await page.click('#delGo');
    await page.waitForSelector('[data-undo="r11"]');
    ok(true, 'entrega de clínica registrada');
    await page.click('[data-deliver="r3"]');
    await page.waitForSelector('#delGo');
    ok(!(await page.locator('#delGo').isEnabled()), 'entrega de academia bloqueada por falta de stock de una pieza');
    await page.shot('22-entrega-bloqueada');
    await page.keyboard.press('Escape');

    // Producto nuevo y kit nuevo
    await page.click('.side-link[data-page="products"]');
    await page.click('#prodNew');
    await page.waitForSelector('#pfSave');
    await page.fill('#pfName', 'Parent Cap');
    await page.fill('#pfSku', 'camp-cap');
    await page.selectOption('#pfKind', 'accessory');
    await page.fill('#pfPrice', '18');
    await page.fill('#pfCost', '7');
    await page.click('[data-preset="one"]');
    await page.fill('[data-sz-stock="U"]', '15');
    await page.locator('[data-sz-stock="U"]').dispatchEvent('change');
    await page.shot('23-producto-form');
    await page.click('#pfSave');
    await page.waitForSelector('#pfSave', { state: 'detached' });
    const cap = await page.evaluate(() => { const p = Store.products.find(x => x.sku === 'CAMP-CAP'); return p && { v: p.variants.map(v => v.size + ':' + v.stock), stores: p.stores, last: Store.movements[0].reason }; });
    ok(cap && cap.v.join() === 'U:15' && cap.last === 'initial', 'producto creado con stock inicial asentado', cap);

    await page.click('#prodNewKit');
    await page.waitForSelector('#pfAddComp');
    await page.fill('#pfName', 'Camp Kit Plus');
    await page.fill('#pfSku', 'CAMP-KIT-PLUS');
    for (const id of ['camp-jersey', 'camp-short', 'camp-socks']) {
      await page.click('#pfAddComp');
      await page.locator('[data-comp-p]').last().selectOption(id);
    }
    await page.fill('#pfDisc', '10');
    await page.locator('#pfDisc').dispatchEvent('input');
    ok(await page.locator('#pfPrice').inputValue() === '51.30', 'descuento 10% sobre $57 de piezas = $51.30', await page.locator('#pfPrice').inputValue());
    await page.shot('24-kit-form');
    await page.click('#pfSave');
    await page.waitForSelector('#pfSave', { state: 'detached' });
    await page.click('#btnShop');
    ok(await page.locator('.kit-card').count() === 2, 'el kit nuevo aparece en la tienda de Camps');

    // Tiendas: QR y publicación
    await page.click('#btnAdmin');
    await page.click('.side-link[data-page="stores"]');
    ok(await page.locator('.store-card svg.qr').count() === 3, 'cada tienda tiene su QR');
    await page.click('[data-toggle-store="athletum"]');
    ok(await page.evaluate(() => Store.storeCfg('athletum').active), 'Athletum publicada desde el panel');

    // Idioma
    await page.click('#langBtn');
    await page.shot('25-admin-stores-en', true);
    ok(/Stores/.test(await page.locator('#page-stores h1').innerText()), 'panel en inglés');
    await page.click('#btnShop');
    await page.shot('26-shop-en', true);
    await page.click('#langBtn');

    ok(page.issues.length === 0, 'sin errores ni advertencias en consola', page.issues);
    await page.context().close();
  },

  /* Tienda pública en teléfono (enlace del QR) */
  async mobile(browser) {
    const page = await newPage(browser, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto(BASE + '?store=camps');
    await page.waitForSelector('.kit-card');
    ok(await page.locator('.mode-switch').isHidden(), 'la tienda pública no muestra el panel');
    ok(await page.locator('.store-tabs').count() === 0, 'ni el selector de tiendas');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(overflow <= 0, 'sin desborde horizontal en 390 px', overflow);
    await page.shot('30-movil-tienda', true);

    await page.click('.kit-card');
    await page.waitForSelector('#addKit');
    await page.click('[data-quick="YM"]');
    await page.shot('31-movil-kit');
    await page.fill('#kitPlayer', 'Test Kid');
    await page.click('#addKit');
    await page.waitForSelector('#cartDrawer.open');
    await page.shot('32-movil-carrito');
    await page.click('#goCheckout');
    await page.waitForSelector('#payNow');
    await page.fill('#ckEmail', 'movil@example.com');
    await page.fill('#ckName', 'Mobile Parent');
    await page.shot('33-movil-checkout', true);
    await page.click('#payNow');
    await page.waitForSelector('.success-mark', { timeout: 15000 });
    ok(await page.locator('.trace').count() === 0 && await page.locator('#seeOrder').count() === 0, 'la confirmación pública no muestra datos internos');
    await page.shot('34-movil-confirmacion');
    const ov2 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(ov2 <= 0, 'sin desborde horizontal tras la compra', ov2);

    // Tienda aún no publicada
    await page.goto(BASE + '?store=lasvegas');
    await page.waitForSelector('.hero');
    ok(await page.locator('.kit-card').count() === 0, 'una tienda no publicada muestra "Muy pronto"', await page.locator('.hero h1').innerText());

    // Panel en teléfono
    await page.goto(BASE);
    await page.click('#btnAdmin');
    await page.waitForSelector('#page-dashboard.active');
    const ov3 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(ov3 <= 0, 'el panel tampoco desborda en móvil', ov3);
    await page.shot('35-movil-admin', true);

    ok(page.issues.length === 0, 'sin errores ni advertencias en consola', page.issues);
    await page.context().close();
  }
};

(async () => {
  const which = process.argv.slice(2);
  const list = which.length ? which : Object.keys(scenarios);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const name of list) {
    console.log('\n== ' + name + ' ==');
    try { await scenarios[name](browser); }
    catch (e) { fails++; console.log('  FAIL excepción: ' + e.message.split('\n')[0]); }
  }
  await browser.close();
  console.log(fails ? `\n${fails} FALLOS` : '\nTODO OK');
  process.exit(fails ? 1 : 0);
})();
