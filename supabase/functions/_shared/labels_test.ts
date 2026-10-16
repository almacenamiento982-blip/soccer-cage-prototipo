/* Pruebas de la compra de etiquetas contra un EasyPost simulado.
   Ejecutar:  deno test supabase/functions/_shared/labels_test.ts  */

import { assert, assertEquals } from 'jsr:@std/assert@1';
import { EasyPost, pickRate, verifyWebhook, isTestKey, ShippingError } from './easypost.ts';
import { buyLabel, buyLabels, MemoryShipmentStore } from './labels.ts';

/* ---------- EasyPost falso ----------
   Imita lo justo de la API v2: verificar dirección, crear envío con
   tarifas, consultar, comprar (cobra del saldo) y reembolsar. Se le
   pueden inyectar fallos para reproducir los casos difíciles. */
function fakeEasyPost(opts: { balance?: number; failNext?: (path: string) => 'network' | 500 | 'timeout-after-buy' | null } = {}) {
  let balance = opts.balance ?? 100;
  let n = 0;
  const shipments = new Map<string, any>();
  const calls: string[] = [];
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

  const fetch = async (url: string, init: RequestInit) => {
    const path = new URL(url).pathname.replace('/v2', '');
    const method = init.method ?? 'GET';
    calls.push(method + ' ' + path);
    const body = init.body ? JSON.parse(String(init.body)) : null;
    const f = opts.failNext?.(path);
    if (f === 'network') throw new TypeError('connection reset');
    if (f === 500) return json(500, { error: { code: 'INTERNAL', message: 'boom' } });

    if (path === '/addresses/create_and_verify') {
      const a = body.address;
      if (/^0+$/.test(a.zip) || /nowhere/i.test(a.street1)) {
        return json(422, { error: { code: 'ADDRESS.VERIFY.FAILURE', message: 'Address not found' } });
      }
      return json(200, { address: { id: 'adr_' + (++n), ...a, street1: String(a.street1).toUpperCase(), city: String(a.city).toUpperCase(), zip: a.zip + '-1234', verifications: { delivery: { success: true, errors: [] } } } });
    }
    if (path === '/shipments' && method === 'POST') {
      const id = 'shp_' + (++n);
      const oz = body.shipment.parcel.weight;
      const s = { id, reference: body.shipment.reference, rates: [
        { id: 'rate_ga_' + id, carrier: 'USPS', service: 'GroundAdvantage', rate: (4 + oz * 0.1).toFixed(2), delivery_days: 4 },
        { id: 'rate_pr_' + id, carrier: 'USPS', service: 'Priority', rate: (9 + oz * 0.1).toFixed(2), delivery_days: 2 },
      ] };
      shipments.set(id, s);
      return json(200, s);
    }
    const m = path.match(/^\/shipments\/([^/]+)(\/buy|\/refund)?$/);
    if (m) {
      const s = shipments.get(m[1]);
      if (!s) return json(404, { error: { code: 'NOT_FOUND', message: 'not found' } });
      if (!m[2]) return json(200, s);
      if (m[2] === '/buy') {
        if (s.postage_label) return json(422, { error: { code: 'SHIPMENT.POSTAGE.EXISTS', message: 'already bought' } });
        const r = s.rates.find((x: any) => x.id === body.rate.id);
        if (balance < Number(r.rate)) return json(402, { error: { code: 'PAYMENT_REQUIRED', message: 'Insufficient funds' } });
        balance -= Number(r.rate);
        Object.assign(s, { tracking_code: '9400' + String(n).padStart(18, '0'), selected_rate: r, postage_label: { label_pdf_url: 'https://easypost.test/' + s.id + '.pdf' }, tracker: { id: 'trk_' + s.id } });
        if (f === 'timeout-after-buy') throw new TypeError('timeout');   // pagó, pero la respuesta no llegó
        return json(200, s);
      }
      s.refund_status = 'submitted';
      return json(200, s);
    }
    return json(404, { error: { code: 'NOT_FOUND', message: path } });
  };
  return { fetch, calls, shipments, get balance() { return balance; } };
}

const from = { name: 'Soccer Cage', street1: '100 Test St', city: 'Miami', state: 'FL', zip: '33131' };
const to = { name: 'Parent Test', street1: '200 Brickell Ave', city: 'Miami', state: 'FL', zip: '33131' };
const parcel = { weightOz: 16, length: 12, width: 10, height: 2 };
const req = (orderId: string, over = {}) => ({ orderId, reference: 'SC-' + orderId, to, from, parcel, ...over });

Deno.test('compra una etiqueta Ground Advantage y la guarda', async () => {
  const fake = fakeEasyPost();
  const ep = new EasyPost({ apiKey: 'EZTK_test', fetch: fake.fetch, backoffMs: 0 });
  const store = new MemoryShipmentStore();
  const r = await buyLabel(ep, store, req('1'));
  assert(r.ok);
  if (!r.ok) return;
  assertEquals(r.label.service, 'GroundAdvantage');
  assert(r.label.labelUrl.endsWith('.pdf'));
  assertEquals((await store.get('1'))?.status, 'comprado');
  assertEquals(fake.calls.filter(c => c.endsWith('/buy')).length, 1);
});

Deno.test('repetir la orden no compra otra etiqueta', async () => {
  const fake = fakeEasyPost();
  const ep = new EasyPost({ apiKey: 'EZTK_test', fetch: fake.fetch, backoffMs: 0 });
  const store = new MemoryShipmentStore();
  await buyLabel(ep, store, req('1'));
  const again = await buyLabel(ep, store, req('1'));
  assert(again.ok && again.reused);
  assertEquals(fake.calls.filter(c => c.endsWith('/buy')).length, 1);
});

Deno.test('si se corta la red justo después de pagar, el reintento recupera la etiqueta pagada', async () => {
  let cut = true;
  const fake = fakeEasyPost({ failNext: p => (p.endsWith('/buy') && cut ? (cut = false, 'timeout-after-buy') : null) });
  const ep = new EasyPost({ apiKey: 'EZTK_test', fetch: fake.fetch, backoffMs: 0, retries: 0 });
  const store = new MemoryShipmentStore();
  const first = await buyLabel(ep, store, req('1'));
  assert(!first.ok && first.retryable, 'el primer intento queda como fallo temporal');
  const before = fake.balance;
  const second = await buyLabel(ep, store, req('1'));
  assert(second.ok && second.reused, 'el segundo intento reutiliza la etiqueta ya pagada');
  assertEquals(fake.balance, before, 'no se cobró dos veces');
  assertEquals(fake.calls.filter(c => c.endsWith('/buy')).length, 1);
});

Deno.test('dirección inexistente: no se gasta dinero y queda para revisar', async () => {
  const fake = fakeEasyPost();
  const ep = new EasyPost({ apiKey: 'EZTK_test', fetch: fake.fetch, backoffMs: 0 });
  const store = new MemoryShipmentStore();
  const r = await buyLabel(ep, store, req('1', { to: { ...to, street1: '1 Nowhere Rd' } }));
  assert(!r.ok && r.code === 'address_invalid' && !r.retryable);
  assertEquals(fake.calls.filter(c => c.startsWith('POST /shipments')).length, 0);
  assertEquals(fake.balance, 100);
});

Deno.test('sin saldo: el lote se detiene y dice cuántos quedaron sin intentar', async () => {
  const fake = fakeEasyPost({ balance: 12 });   // alcanza para 2 etiquetas de ~$5.60
  const ep = new EasyPost({ apiKey: 'EZTK_test', fetch: fake.fetch, backoffMs: 0 });
  const store = new MemoryShipmentStore();
  const out = await buyLabels(ep, store, ['1', '2', '3', '4', '5'].map(id => req(id)));
  assertEquals(out.summary.bought, 2);
  assertEquals(out.summary.failed, 1);
  assertEquals(out.summary.notTried, 2);
  const failed = out.results.find(r => !r.ok);
  assert(failed && !failed.ok && failed.code === 'payment_required' && !failed.retryable);
});

Deno.test('errores 5xx y de red se reintentan; luego funciona', async () => {
  let fails = 2;
  const fake = fakeEasyPost({ failNext: p => (p === '/shipments' && fails-- > 0 ? (fails ? 500 : 'network') : null) });
  const ep = new EasyPost({ apiKey: 'EZTK_test', fetch: fake.fetch, backoffMs: 0, retries: 3 });
  const r = await buyLabel(ep, new MemoryShipmentStore(), req('1'));
  assert(r.ok);
});

Deno.test('dos compras simultáneas del mismo pedido: solo una pasa', async () => {
  const fake = fakeEasyPost();
  const ep = new EasyPost({ apiKey: 'EZTK_test', fetch: fake.fetch, backoffMs: 0 });
  const store = new MemoryShipmentStore();
  const [a, b] = await Promise.all([buyLabel(ep, store, req('1')), buyLabel(ep, store, req('1'))]);
  assert([a, b].filter(r => r.ok).length === 1 && [a, b].some(r => !r.ok && r.code === 'busy'));
  assertEquals(fake.calls.filter(c => c.endsWith('/buy')).length, 1);
});

Deno.test('elige Ground Advantage y si no existe la USPS más barata', () => {
  const rates = [
    { id: 'a', carrier: 'USPS', service: 'Priority', rate: 9, deliveryDays: 2 },
    { id: 'b', carrier: 'USPS', service: 'Express', rate: 30, deliveryDays: 1 },
  ];
  assertEquals(pickRate(rates).id, 'a');
  let threw = false;
  try { pickRate([]); } catch (e) { threw = e instanceof ShippingError && e.code === 'no_rate'; }
  assert(threw);
});

Deno.test('firma de webhook: acepta la buena y rechaza la alterada', async () => {
  const secret = 'whsec_demo', body = JSON.stringify({ description: 'tracker.updated', result: { status: 'delivered' } });
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)));
  const header = 'hmac-sha256-hex=' + Array.from(sig, b => b.toString(16).padStart(2, '0')).join('');
  assert(await verifyWebhook(body, header, secret));
  assert(!(await verifyWebhook(body.replace('delivered', 'returned'), header, secret)));
  assert(!(await verifyWebhook(body, null, secret)));
});

Deno.test('distingue clave de prueba y de producción', () => {
  assert(isTestKey('EZTK123'));
  assert(!isTestKey('EZAK123'));
});
