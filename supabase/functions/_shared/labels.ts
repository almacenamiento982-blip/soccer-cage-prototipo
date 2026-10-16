/* ============================================================
   Compra de etiquetas sin duplicados ni cobros dobles.

   Cada pedido tiene a lo sumo un envío. El estado se guarda ANTES
   de pagar, para que un corte de red a mitad de la compra no
   termine en dos etiquetas pagadas:

     pendiente → creado (id del envío guardado) → comprado
                                    ↘ fallido (con motivo)

   Si se repite la orden sobre un pedido "creado", primero se
   consulta el envío en EasyPost: si ya tiene etiqueta, se usa esa
   en lugar de comprar otra.

   `ShipmentStore` es el lugar donde se guarda el estado: en
   producción, la tabla `shipments` de Supabase (con order_id
   único); en las pruebas, memoria.
   ============================================================ */

import { Address, BoughtLabel, EasyPost, Parcel, pickRate, ShippingError } from './easypost.ts';

export type ShipmentRow = {
  orderId: string;
  status: 'creado' | 'comprado' | 'fallido';
  shipmentId?: string;
  label?: BoughtLabel;
  error?: { code: string; message: string };
  attempts: number;
  updatedAt: string;
};

export interface ShipmentStore {
  get(orderId: string): Promise<ShipmentRow | null>;
  /** Reserva el pedido para esta compra. Devuelve false si otra compra lo tiene tomado. */
  lock(orderId: string): Promise<boolean>;
  unlock(orderId: string): Promise<void>;
  save(row: ShipmentRow): Promise<void>;
}

export class MemoryShipmentStore implements ShipmentStore {
  rows = new Map<string, ShipmentRow>();
  locks = new Set<string>();
  async get(id: string) { return this.rows.get(id) ?? null; }
  async lock(id: string) { if (this.locks.has(id)) return false; this.locks.add(id); return true; }
  async unlock(id: string) { this.locks.delete(id); }
  async save(r: ShipmentRow) { this.rows.set(r.orderId, structuredClone(r)); }
}

export type LabelRequest = {
  orderId: string;
  reference: string;   // número de pedido, sale impreso en la etiqueta
  to: Address;
  from: Address;
  parcel: Parcel;
  service?: string;
};

export type LabelResult =
  | { ok: true; orderId: string; label: BoughtLabel; reused: boolean }
  | { ok: false; orderId: string; code: string; message: string; retryable: boolean };

export async function buyLabel(ep: EasyPost, store: ShipmentStore, req: LabelRequest): Promise<LabelResult> {
  if (!(await store.lock(req.orderId))) {
    return { ok: false, orderId: req.orderId, code: 'busy', message: 'Este pedido ya se está procesando', retryable: true };
  }
  const now = () => new Date().toISOString();
  let row = (await store.get(req.orderId)) ?? { orderId: req.orderId, status: 'creado' as const, attempts: 0, updatedAt: now() };
  try {
    if (row.status === 'comprado' && row.label) return { ok: true, orderId: req.orderId, label: row.label, reused: true };
    row.attempts++;

    // 1) ¿Un intento anterior llegó a pagar? Se consulta antes de volver a pagar.
    let rates;
    if (row.shipmentId) {
      const prev = await ep.getShipment(row.shipmentId);
      if (prev.label) {
        row = { ...row, status: 'comprado', label: prev.label, error: undefined, updatedAt: now() };
        await store.save(row);
        return { ok: true, orderId: req.orderId, label: prev.label, reused: true };
      }
      rates = prev.rates;
    } else {
      // 2) Dirección verificada con USPS antes de gastar dinero.
      const to = (await ep.verifyAddress(req.to)).address;
      // 3) Crear el envío y guardar su id ANTES de pagar.
      const sh = await ep.createShipment({ to, from: req.from, parcel: req.parcel, reference: req.reference });
      row = { ...row, shipmentId: sh.id, updatedAt: now() };
      await store.save(row);
      rates = sh.rates;
    }
    const rate = pickRate(rates, req.service);

    // 4) Pagar una sola vez.
    const label = await ep.buy(row.shipmentId!, rate.id);
    row = { ...row, status: 'comprado', label, error: undefined, updatedAt: now() };
    await store.save(row);
    return { ok: true, orderId: req.orderId, label, reused: false };
  } catch (e) {
    const err = e instanceof ShippingError ? e : new ShippingError('temporary', (e as Error).message);
    row = { ...row, status: 'fallido', error: { code: err.code, message: err.message }, updatedAt: now() };
    await store.save(row);
    return { ok: false, orderId: req.orderId, code: err.code, message: err.message, retryable: err.retryable };
  } finally {
    await store.unlock(req.orderId);
  }
}

/**
 * Compra en lote (la página "Envíos"). Se detiene en seco si se acaba el
 * saldo: seguir intentando solo generaría más fallos iguales.
 */
export async function buyLabels(ep: EasyPost, store: ShipmentStore, reqs: LabelRequest[]) {
  const results: LabelResult[] = [];
  for (const r of reqs) {
    const res = await buyLabel(ep, store, r);
    results.push(res);
    if (!res.ok && res.code === 'payment_required') break;
  }
  const done = results.filter(r => r.ok) as Extract<LabelResult, { ok: true }>[];
  return {
    results,
    summary: {
      requested: reqs.length,
      bought: done.filter(r => !r.reused).length,
      reused: done.filter(r => r.reused).length,
      failed: results.filter(r => !r.ok).length,
      notTried: reqs.length - results.length,
      postage: Math.round(done.reduce((s, r) => s + r.label.cost, 0) * 100) / 100,
    },
  };
}
