/* ============================================================
   Cliente mínimo de EasyPost para etiquetas de USPS.

   Por qué EasyPost: compra la etiqueta de USPS y la cobra de un
   saldo prepagado (Wallet) que se recarga solo por transferencia
   bancaria. No hace falta la cuenta EPS de USPS ni la aprobación
   manual de su API de etiquetas. Las primeras 3.000 etiquetas al
   mes no tienen comisión (solo se paga el franqueo).

   Este archivo no guarda estado y recibe `fetch` por parámetro:
   así se prueba sin red (labels_test.ts) y corre igual en Deno
   (Supabase Edge Functions) o en Node.

   La clave vive solo en los secretos de la función
   (EASYPOST_API_KEY). Nunca en el navegador ni en el repositorio.
   ============================================================ */

export type Address = {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  phone?: string;
  email?: string;
};

export type Parcel = { weightOz: number; length: number; width: number; height: number };

export type Rate = { id: string; carrier: string; service: string; rate: number; deliveryDays: number | null };

export type BoughtLabel = {
  shipmentId: string;
  trackingCode: string;
  labelUrl: string;
  carrier: string;
  service: string;
  cost: number;
  trackerId: string | null;
};

/** Error con un código estable para decidir si se reintenta o se avisa a una persona. */
export class ShippingError extends Error {
  constructor(
    public code:
      | 'address_invalid'   // USPS no reconoce la dirección: revisar con el cliente
      | 'payment_required'  // sin saldo en el Wallet: recargar, no reintentar en bucle
      | 'no_rate'           // USPS no ofrece el servicio pedido para ese paquete
      | 'bad_request'       // datos mal formados (error nuestro)
      | 'auth'              // clave inválida o de otro entorno
      | 'temporary',        // red caída o error 5xx: se puede reintentar
    message: string,
    public status = 0,
    public details: unknown = null,
  ) {
    super(message);
  }
  get retryable() { return this.code === 'temporary'; }
}

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export type EasyPostOptions = {
  apiKey: string;
  fetch?: FetchLike;
  baseUrl?: string;
  /** Reintentos solo para errores temporales (red o 5xx). */
  retries?: number;
  /** Espera entre reintentos; en pruebas se pone a 0. */
  backoffMs?: number;
};

export function isTestKey(key: string) { return /^EZTK/.test(key); }

export class EasyPost {
  private fetch: FetchLike;
  private base: string;
  private auth: string;
  private retries: number;
  private backoffMs: number;

  constructor(opts: EasyPostOptions) {
    if (!opts.apiKey) throw new ShippingError('auth', 'Falta EASYPOST_API_KEY');
    this.fetch = opts.fetch ?? ((u, i) => fetch(u, i));
    this.base = (opts.baseUrl ?? 'https://api.easypost.com/v2').replace(/\/$/, '');
    this.auth = 'Basic ' + btoa(opts.apiKey + ':');
    this.retries = opts.retries ?? 3;
    this.backoffMs = opts.backoffMs ?? 500;
  }

  private async call(method: 'GET' | 'POST', path: string, body?: unknown): Promise<any> {
    let attempt = 0;
    while (true) {
      let res: Response;
      try {
        res = await this.fetch(this.base + path, {
          method,
          headers: { Authorization: this.auth, 'Content-Type': 'application/json', Accept: 'application/json' },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
      } catch (e) {
        if (attempt++ < this.retries) { await this.sleep(attempt); continue; }
        throw new ShippingError('temporary', 'No se pudo contactar a EasyPost: ' + (e as Error).message);
      }
      const text = await res.text();
      let data: any = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
      if (res.ok) return data;

      const err = data?.error ?? {};
      const msg = err.message || ('HTTP ' + res.status);
      if (res.status >= 500 || res.status === 429) {
        if (attempt++ < this.retries) { await this.sleep(attempt); continue; }
        throw new ShippingError('temporary', msg, res.status, err);
      }
      if (res.status === 402) throw new ShippingError('payment_required', msg, 402, err);
      if (res.status === 401 || res.status === 403) throw new ShippingError('auth', msg, res.status, err);
      if (String(err.code || '').startsWith('ADDRESS.')) throw new ShippingError('address_invalid', msg, res.status, err);
      throw new ShippingError('bad_request', msg, res.status, err);
    }
  }

  private sleep(attempt: number) {
    const ms = this.backoffMs * 2 ** (attempt - 1);
    return ms ? new Promise(r => setTimeout(r, ms)) : Promise.resolve();
  }

  private static toEp(a: Address) {
    return {
      name: a.name, company: a.company, street1: a.street1, street2: a.street2,
      city: a.city, state: a.state, zip: a.zip, country: a.country ?? 'US',
      phone: a.phone, email: a.email,
    };
  }

  /**
   * Verifica la dirección con USPS antes de cobrar el envío o comprar la etiqueta.
   * Devuelve la dirección corregida (mayúsculas, ZIP+4) o lanza address_invalid.
   */
  async verifyAddress(a: Address): Promise<{ address: Address; id: string; corrected: boolean }> {
    const data = await this.call('POST', '/addresses/create_and_verify', { address: EasyPost.toEp(a) });
    const r = data?.address ?? data;
    const ok = r?.verifications?.delivery?.success;
    if (ok === false) {
      const why = (r.verifications.delivery.errors || []).map((e: any) => e.message).join('; ');
      throw new ShippingError('address_invalid', why || 'Dirección no entregable', 422, r.verifications.delivery);
    }
    const out: Address = {
      name: r.name ?? a.name, company: r.company ?? undefined, street1: r.street1, street2: r.street2 || undefined,
      city: r.city, state: r.state, zip: r.zip, country: r.country, phone: r.phone ?? a.phone, email: r.email ?? a.email,
    };
    const norm = (s?: string) => String(s || '').toUpperCase().replace(/\s+/g, ' ').trim();
    const corrected = norm(out.street1) !== norm(a.street1) || norm(out.city) !== norm(a.city) || String(out.zip).slice(0, 5) !== String(a.zip).slice(0, 5);
    return { address: out, id: r.id, corrected };
  }

  /** Crea el envío (aún sin pagar) y devuelve sus tarifas. `reference` = número de pedido. */
  async createShipment(p: { to: Address; from: Address; parcel: Parcel; reference: string }) {
    const data = await this.call('POST', '/shipments', {
      shipment: {
        reference: p.reference,
        to_address: EasyPost.toEp(p.to),
        from_address: EasyPost.toEp(p.from),
        parcel: { weight: p.parcel.weightOz, length: p.parcel.length, width: p.parcel.width, height: p.parcel.height },
        options: { label_format: 'PDF', label_size: '4x6', invoice_number: p.reference },
      },
    });
    return { id: data.id as string, rates: EasyPost.rates(data), messages: data.messages ?? [] };
  }

  async getShipment(id: string) {
    const data = await this.call('GET', '/shipments/' + encodeURIComponent(id));
    return { id: data.id as string, rates: EasyPost.rates(data), label: EasyPost.label(data) };
  }

  /** Paga la tarifa elegida y devuelve la etiqueta. Cobra del Wallet: llamar una sola vez por envío. */
  async buy(shipmentId: string, rateId: string): Promise<BoughtLabel> {
    const data = await this.call('POST', '/shipments/' + encodeURIComponent(shipmentId) + '/buy', { rate: { id: rateId } });
    const l = EasyPost.label(data);
    if (!l) throw new ShippingError('temporary', 'EasyPost no devolvió la etiqueta', 0, data);
    return l;
  }

  /** Anula una etiqueta sin usar. El reembolso vuelve al Wallet (tarda semanas). */
  async refund(shipmentId: string) {
    const data = await this.call('POST', '/shipments/' + encodeURIComponent(shipmentId) + '/refund');
    return { refundStatus: data.refund_status as string };
  }

  static rates(data: any): Rate[] {
    return (data?.rates ?? []).map((r: any) => ({
      id: r.id, carrier: r.carrier, service: r.service, rate: Number(r.rate), deliveryDays: r.delivery_days ?? null,
    }));
  }

  static label(data: any): BoughtLabel | null {
    const pl = data?.postage_label;
    if (!pl || !data.tracking_code) return null;
    return {
      shipmentId: data.id,
      trackingCode: data.tracking_code,
      labelUrl: pl.label_pdf_url || pl.label_url,
      carrier: data.selected_rate?.carrier ?? 'USPS',
      service: data.selected_rate?.service ?? '',
      cost: Number(data.selected_rate?.rate ?? 0),
      trackerId: data.tracker?.id ?? null,
    };
  }
}

/** USPS Ground Advantage por defecto; si no se ofrece, la tarifa USPS más barata. */
export function pickRate(rates: Rate[], service = 'GroundAdvantage'): Rate {
  const usps = rates.filter(r => r.carrier === 'USPS');
  const exact = usps.find(r => r.service === service);
  if (exact) return exact;
  const cheapest = usps.sort((a, b) => a.rate - b.rate)[0];
  if (!cheapest) throw new ShippingError('no_rate', 'USPS no ofreció tarifa para este paquete');
  return cheapest;
}

/**
 * Valida la firma de un webhook de EasyPost (cabecera X-Hmac-Signature:
 * "hmac-sha256-hex=<firma>"). Sin esto, cualquiera podría marcar
 * pedidos como entregados.
 */
export async function verifyWebhook(rawBody: string, header: string | null, secret: string): Promise<boolean> {
  if (!header || !secret) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret.normalize('NFKD')),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody)));
  const hex = Array.from(sig, b => b.toString(16).padStart(2, '0')).join('');
  const expected = 'hmac-sha256-hex=' + hex;
  if (expected.length !== header.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ header.charCodeAt(i);
  return diff === 0;
}
