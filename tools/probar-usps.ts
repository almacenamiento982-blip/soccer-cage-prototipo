/* ============================================================
   Lista de verificación de USPS (vía EasyPost) contra la API real.

   Uso, con la clave de PRUEBA de EasyPost (empieza por EZTK, no
   cobra franqueo):

     $env:EASYPOST_API_KEY = "EZTK..."        # PowerShell
     deno run --allow-net --allow-env tools/probar-usps.ts

   Comprueba, en orden, todo lo que tiene que salir bien antes de
   vender con envío:
     1. dirección correcta verificada por USPS
     2. dirección mal escrita corregida (mayúsculas, ZIP+4)
     3. dirección inexistente rechazada antes de pagar
     4. tarifa USPS Ground Advantage para un kit (1 lb)
     5. compra de la etiqueta 4×6 en PDF con número de seguimiento
     6. la etiqueta se descarga y es un PDF
     7. repetir la compra del mismo pedido no cobra dos veces
     8. anular la etiqueta (reembolso)

   Con una clave de producción (EZAK) se niega a correr, salvo que
   se pase --live a propósito: compraría una etiqueta real.
   ============================================================ */

import { EasyPost, isTestKey, pickRate, ShippingError, type Address } from '../supabase/functions/_shared/easypost.ts';
import { buyLabel, MemoryShipmentStore } from '../supabase/functions/_shared/labels.ts';

const key = Deno.env.get('EASYPOST_API_KEY') ?? '';
const live = Deno.args.includes('--live');
if (!key) { console.error('Falta la variable EASYPOST_API_KEY (clave de prueba EZTK...).'); Deno.exit(2); }
if (!isTestKey(key) && !live) {
  console.error('Esa no es una clave de prueba (EZTK...). Para no comprar etiquetas reales sin querer, el script se detiene.\nSi de verdad quieres probar en producción, añade --live.');
  Deno.exit(2);
}

// Direcciones de ejemplo de la documentación de EasyPost. Se pueden cambiar por variables de entorno.
const env = (k: string, d: string) => Deno.env.get(k) ?? d;
const from: Address = {
  name: env('SHIP_FROM_NAME', 'Soccer Cage'), street1: env('SHIP_FROM_STREET', '417 Montgomery Street'),
  street2: env('SHIP_FROM_STREET2', 'Floor 5'), city: env('SHIP_FROM_CITY', 'San Francisco'),
  state: env('SHIP_FROM_STATE', 'CA'), zip: env('SHIP_FROM_ZIP', '94104'), phone: '4155559999',
};
const good: Address = { name: 'Parent Test', street1: '179 N Harbor Dr', city: 'Redondo Beach', state: 'CA', zip: '90277', phone: '3105559999' };
const sloppy: Address = { ...good, street1: '179 n harbor drive', city: 'redondo beach' };
const bad: Address = { ...good, street1: '99999 Nowhere Imaginary Blvd', zip: '90277' };
const parcel = { weightOz: 16, length: 12, width: 10, height: 2 };   // un kit en su bolsa

const ep = new EasyPost({ apiKey: key });
const results: { step: string; ok: boolean; info: string }[] = [];
const step = async (name: string, fn: () => Promise<string>) => {
  try { const info = await fn(); results.push({ step: name, ok: true, info }); console.log('  ok   ' + name + (info ? '  → ' + info : '')); }
  catch (e) {
    const info = e instanceof ShippingError ? `${e.code}: ${e.message}` : (e as Error).message;
    results.push({ step: name, ok: false, info }); console.log('  FAIL ' + name + '  → ' + info);
  }
};

console.log(`\nVerificación de USPS vía EasyPost (${isTestKey(key) ? 'modo PRUEBA, sin cobro' : 'PRODUCCIÓN'})\n`);

await step('1. dirección correcta verificada', async () => {
  const r = await ep.verifyAddress(good);
  return `${r.address.street1}, ${r.address.city} ${r.address.state} ${r.address.zip}`;
});

await step('2. dirección mal escrita corregida', async () => {
  const r = await ep.verifyAddress(sloppy);
  return `${r.corrected ? 'corregida' : 'sin cambios'}: ${r.address.street1}, ${r.address.city} ${r.address.zip}`;
});

await step('3. dirección inexistente rechazada antes de pagar', async () => {
  try { await ep.verifyAddress(bad); }
  catch (e) { if (e instanceof ShippingError && e.code === 'address_invalid') return 'rechazada: ' + e.message; throw e; }
  throw new Error('USPS aceptó una dirección inexistente');
});

let shipmentId = '';
await step('4. tarifa USPS Ground Advantage para un kit de 1 lb', async () => {
  const sh = await ep.createShipment({ to: good, from, parcel, reference: 'PRUEBA-1' });
  shipmentId = sh.id;
  const r = pickRate(sh.rates);
  return `${r.service} $${r.rate.toFixed(2)} · ${r.deliveryDays ?? '?'} días · ${sh.rates.length} tarifas`;
});

let labelUrl = '';
await step('5. compra de la etiqueta 4×6 en PDF', async () => {
  const sh = await ep.getShipment(shipmentId);
  const l = await ep.buy(shipmentId, pickRate(sh.rates).id);
  labelUrl = l.labelUrl;
  return `seguimiento ${l.trackingCode} · $${l.cost.toFixed(2)}`;
});

await step('6. la etiqueta se descarga y es un PDF', async () => {
  const res = await fetch(labelUrl);
  const head = new TextDecoder().decode(new Uint8Array(await res.arrayBuffer()).slice(0, 5));
  if (head !== '%PDF-') throw new Error('no es PDF (' + res.headers.get('content-type') + ')');
  return labelUrl;
});

await step('7. repetir la compra del mismo pedido no cobra dos veces', async () => {
  const store = new MemoryShipmentStore();
  const req = { orderId: 'PRUEBA-2', reference: 'PRUEBA-2', to: good, from, parcel };
  const a = await buyLabel(ep, store, req);
  const b = await buyLabel(ep, store, req);
  if (!a.ok) throw new Error(a.message);
  if (!b.ok || !b.reused || b.label.trackingCode !== a.label.trackingCode) throw new Error('se compró otra etiqueta');
  await ep.refund(a.label.shipmentId);
  return 'misma etiqueta ' + a.label.trackingCode;
});

await step('8. anular la etiqueta (reembolso)', async () => {
  const r = await ep.refund(shipmentId);
  return 'estado del reembolso: ' + r.refundStatus;
});

const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length} de ${results.length} pasos correctos.`);
if (failed.length) {
  console.log('Revisar: ' + failed.map(f => f.step).join(' · '));
  Deno.exit(1);
}
