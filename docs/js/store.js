/* ============================================================
   SOCCER CAGE — Núcleo de estado e inventario
   Toda mutación de stock pasa por aquí. Ningún módulo de UI
   modifica `stock` directamente: siempre vía applyMovement().
   Esa es la regla que garantiza la trazabilidad.
   ============================================================ */

const DB_KEY = 'soccercage_db_v1';

const Store = {
  state: null,

  /* ---------- Persistencia ---------- */
  load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) {
        this.state = JSON.parse(raw);
        if (this.state && this.state.products && this.state.products.length) return;
      }
    } catch (e) {
      console.warn('No se pudo leer localStorage, se reinicia la demo.', e);
    }
    this.reset(true);
  },

  save() {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('No se pudo guardar en localStorage.', e);
    }
  },

  reset(silent) {
    this.state = {
      products:  JSON.parse(JSON.stringify(SEED.products)),
      orders:    JSON.parse(JSON.stringify(SEED.orders)),
      customers: JSON.parse(JSON.stringify(SEED.customers)),
      movements: JSON.parse(JSON.stringify(SEED.movements)),
      users:     JSON.parse(JSON.stringify(SEED.users)),
      cart: [],
      counters: { order: 10242, movement: 100, product: 100, customer: 100 },
      settings: {
        company: 'Soccer Cage LLC',
        city: 'Miami, FL',
        currency: 'USD',
        lowStockGlobal: 8,
        taxRate: 0,            // ver nota fiscal en el informe
        shippingFlat: 9.00,
        freeShippingOver: 250
      },
      currentUser: 'u1'
    };
    this.save();
    if (!silent && typeof UI !== 'undefined') UI.toast('ok', 'Demo reiniciada', 'Se restauraron los datos originales.');
  },

  /* ---------- Accesores ---------- */
  get products()  { return this.state.products; },
  get orders()    { return this.state.orders; },
  get customers() { return this.state.customers; },
  get movements() { return this.state.movements; },
  get cart()      { return this.state.cart; },
  get settings()  { return this.state.settings; },

  user() { return this.state.users.find(u => u.id === this.state.currentUser) || this.state.users[0]; },

  product(id) { return this.state.products.find(p => p.id === id); },

  /** Localiza una variante y su producto padre en una sola pasada. */
  findVariant(variantId) {
    for (const p of this.state.products) {
      const v = p.variants.find(x => x.id === variantId);
      if (v) return { product: p, variant: v };
    }
    return null;
  },

  variantBySku(sku) {
    for (const p of this.state.products) {
      const v = p.variants.find(x => x.sku === sku);
      if (v) return { product: p, variant: v };
    }
    return null;
  },

  nextId(kind) {
    this.state.counters[kind] = (this.state.counters[kind] || 0) + 1;
    return this.state.counters[kind];
  },

  /* ---------- Cálculos de stock ---------- */
  productStock(p) { return p.variants.reduce((s, v) => s + v.stock, 0); },

  /** Stock realmente vendible = físico − reservado. */
  available(v) { return Math.max(0, v.stock - (v.reserved || 0)); },

  variantStatus(p, v) {
    const a = this.available(v);
    if (p.madeToOrder) return 'bajo-pedido';
    if (a <= 0) return 'agotado';
    if (a <= (p.minStock || 0)) return 'bajo';
    return 'ok';
  },

  productStatus(p) {
    if (!p.active) return 'inactivo';
    if (p.madeToOrder) return 'bajo-pedido';
    const total = this.productStock(p);
    if (total <= 0) return 'agotado';
    const anyLow = p.variants.some(v => this.available(v) > 0 && this.available(v) <= (p.minStock || 0));
    if (anyLow) return 'bajo';
    return 'ok';
  },

  /* ---------- Métricas del dashboard ---------- */
  metrics() {
    const active = this.state.products.filter(p => p.active);

    let invValue = 0, invRetail = 0, units = 0;
    active.forEach(p => {
      if (p.madeToOrder) return;        // no es stock real en bodega
      p.variants.forEach(v => {
        invValue  += v.stock * p.cost;
        invRetail += v.stock * (p.price + (v.priceDelta || 0));
        units     += v.stock;
      });
    });

    const lowItems = [];
    const outItems = [];
    active.forEach(p => {
      if (p.madeToOrder) return;
      p.variants.forEach(v => {
        const a = this.available(v);
        if (a <= 0) outItems.push({ p, v });
        else if (a <= (p.minStock || 0)) lowItems.push({ p, v });
      });
    });

    const today = '2026-09-19';
    const paid = this.state.orders.filter(o => o.paymentStatus === 'pagado');
    const salesToday = paid.filter(o => o.date.startsWith(today)).reduce((s, o) => s + o.total, 0);
    const salesMonth = paid.filter(o => o.date.startsWith('2026-09')).reduce((s, o) => s + o.total, 0);

    const pending   = this.state.orders.filter(o => ['pendiente', 'procesando'].includes(o.status)).length;
    const completed = this.state.orders.filter(o => o.status === 'completado').length;

    // Ranking por unidades vendidas (solo pedidos pagados)
    const tally = {};
    paid.forEach(o => o.items.forEach(it => {
      if (!tally[it.name]) tally[it.name] = { name: it.name, qty: 0, revenue: 0 };
      tally[it.name].qty += it.qty;
      tally[it.name].revenue += it.qty * it.price;
    }));
    const topProducts = Object.values(tally).sort((a, b) => b.qty - a.qty).slice(0, 5);

    const ticket = paid.length ? salesMonth / paid.filter(o => o.date.startsWith('2026-09')).length : 0;

    return {
      invValue, invRetail, units,
      margin: invRetail - invValue,
      activeCount: active.length,
      skuCount: active.reduce((s, p) => s + p.variants.length, 0),
      lowItems, outItems,
      lowCount: lowItems.length, outCount: outItems.length,
      salesToday, salesMonth, pending, completed,
      topProducts, ticket,
      alertCount: lowItems.length + outItems.length
    };
  },

  /* ============================================================
     MOVIMIENTOS — única puerta de entrada a la mutación de stock
     ============================================================ */
  applyMovement({ variantId, type, qty, reason, ref, user }) {
    const found = this.findVariant(variantId);
    if (!found) return { ok: false, error: 'Variante no encontrada.' };

    const { product, variant } = found;
    const before = variant.stock;
    const delta = type === 'entrada' ? qty : -qty;
    const after = before + delta;

    // Regla dura: el inventario nunca queda negativo.
    if (after < 0 && !product.madeToOrder) {
      return {
        ok: false,
        error: `Stock insuficiente en ${variant.sku}. Disponible: ${before}, solicitado: ${qty}.`
      };
    }

    variant.stock = Math.max(0, after);

    const mov = {
      id: 'm' + this.nextId('movement'),
      date: new Date().toISOString(),
      sku: variant.sku,
      product: product.name,
      variant: `${variant.size} / ${variant.color}`,
      type, qty,
      reason: reason || (type === 'entrada' ? 'Ajuste manual' : 'Ajuste manual'),
      ref: ref || '—',
      before,
      after: variant.stock,
      user: user || this.user().name
    };

    this.state.movements.unshift(mov);
    this.save();
    return { ok: true, movement: mov };
  },

  /* ---------- Carrito ---------- */
  addToCart(productId, variantId, qty) {
    const p = this.product(productId);
    const v = p.variants.find(x => x.id === variantId);
    if (!p || !v) return { ok: false, error: 'Producto no disponible.' };

    const existing = this.state.cart.find(l => l.variantId === variantId);
    const inCart = existing ? existing.qty : 0;
    const avail = this.available(v);

    // Validación frente al stock real, contando lo ya reservado en el carrito.
    if (!p.madeToOrder && inCart + qty > avail) {
      return {
        ok: false,
        error: avail === 0
          ? 'Esta variante está agotada.'
          : `Solo quedan ${avail} unidades y ya tienes ${inCart} en el carrito.`
      };
    }

    if (existing) existing.qty += qty;
    else this.state.cart.push({
      productId, variantId, qty,
      name: p.name,
      sku: v.sku,
      variant: `${v.size} / ${v.color}`,
      size: v.size, color: v.color, colorHex: v.colorHex,
      price: p.price + (v.priceDelta || 0)
    });

    this.save();
    return { ok: true };
  },

  updateCartQty(variantId, qty) {
    const line = this.state.cart.find(l => l.variantId === variantId);
    if (!line) return { ok: false };
    if (qty <= 0) return this.removeFromCart(variantId);

    const f = this.findVariant(variantId);
    if (f && !f.product.madeToOrder && qty > this.available(f.variant)) {
      return { ok: false, error: `Solo hay ${this.available(f.variant)} unidades disponibles.` };
    }
    line.qty = qty;
    this.save();
    return { ok: true };
  },

  removeFromCart(variantId) {
    this.state.cart = this.state.cart.filter(l => l.variantId !== variantId);
    this.save();
    return { ok: true };
  },

  clearCart() { this.state.cart = []; this.save(); },

  cartTotals() {
    const subtotal = this.state.cart.reduce((s, l) => s + l.price * l.qty, 0);
    const s = this.settings;
    const shipping = subtotal === 0 ? 0 : (subtotal >= s.freeShippingOver ? 0 : s.shippingFlat);
    const tax = subtotal * (s.taxRate || 0);
    return { subtotal, shipping, tax, total: subtotal + shipping + tax };
  },

  cartCount() { return this.state.cart.reduce((s, l) => s + l.qty, 0); },

  /* ============================================================
     CHECKOUT — simula el webhook de pago confirmado.
     Replica el orden real de un backend de producción:
     validar stock → crear pedido → descontar → registrar movimientos.
     ============================================================ */
  placeOrder(customerData) {
    if (!this.state.cart.length) return { ok: false, error: 'El carrito está vacío.' };

    // 1) Revalidación atómica ANTES de cobrar. Evita vender lo que ya no existe
    //    (otro cliente pudo comprarlo mientras este navegaba).
    for (const line of this.state.cart) {
      const f = this.findVariant(line.variantId);
      if (!f) return { ok: false, error: `El producto ${line.name} ya no existe.` };
      if (!f.product.madeToOrder && line.qty > f.variant.stock) {
        return {
          ok: false,
          error: `Stock insuficiente de ${line.name} (${line.variant}). Disponible: ${f.variant.stock}.`
        };
      }
    }

    // 2) Cliente: reutiliza si el email ya existe, si no lo crea.
    let customer = this.state.customers.find(
      c => c.email.toLowerCase() === (customerData.email || '').toLowerCase()
    );
    if (!customer) {
      customer = {
        id: 'c' + this.nextId('customer'),
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone || '—',
        city: customerData.city || 'Miami, FL',
        type: 'Particular',
        orders: 0, spent: 0,
        since: new Date().toISOString().slice(0, 10)
      };
      this.state.customers.unshift(customer);
    }

    // 3) Pedido
    const totals = this.cartTotals();
    const orderNumber = 'SC-' + this.nextId('order');
    const order = {
      id: 'o' + Date.now(),
      number: orderNumber,
      customerId: customer.id,
      date: new Date().toISOString(),
      status: 'pendiente',
      paymentStatus: 'pagado',
      paymentMethod: customerData.paymentMethod || 'Stripe · Visa ···4242',
      items: this.state.cart.map(l => ({
        productId: l.productId, variantId: l.variantId, sku: l.sku,
        name: l.name, variant: l.variant, qty: l.qty, price: l.price
      })),
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      tax: totals.tax,
      total: totals.total
    };

    // 4) Descuento de inventario + asiento en el libro de movimientos
    const trace = [];
    this.state.cart.forEach(line => {
      const r = this.applyMovement({
        variantId: line.variantId,
        type: 'salida',
        qty: line.qty,
        reason: 'Venta',
        ref: orderNumber,
        user: 'Sistema'
      });
      if (r.ok) trace.push(r.movement);
    });

    this.state.orders.unshift(order);
    customer.orders += 1;
    customer.spent += order.total;

    this.clearCart();
    this.save();

    return { ok: true, order, customer, trace };
  },

  /* ---------- Gestión de pedidos ---------- */
  setOrderStatus(orderId, status) {
    const o = this.state.orders.find(x => x.id === orderId);
    if (!o) return { ok: false };
    const prev = o.status;
    o.status = status;

    // Cancelar un pedido pagado devuelve la mercancía al inventario.
    if (status === 'cancelado' && prev !== 'cancelado' && o.paymentStatus === 'pagado') {
      o.paymentStatus = 'reembolsado';
      o.items.forEach(it => {
        const f = it.variantId ? this.findVariant(it.variantId) : this.variantBySku(it.sku);
        if (f) {
          this.applyMovement({
            variantId: f.variant.id,
            type: 'entrada',
            qty: it.qty,
            reason: 'Devolución de cliente',
            ref: o.number,
            user: this.user().name
          });
        }
      });
      const c = this.state.customers.find(x => x.id === o.customerId);
      if (c) { c.spent = Math.max(0, c.spent - o.total); c.orders = Math.max(0, c.orders - 1); }
    }

    this.save();
    return { ok: true, order: o, restocked: status === 'cancelado' && prev !== 'cancelado' };
  },

  /* ---------- CRUD de productos ---------- */
  saveProduct(data) {
    if (data.id) {
      const p = this.product(data.id);
      if (!p) return { ok: false, error: 'Producto no encontrado.' };
      Object.assign(p, data);
      this.save();
      return { ok: true, product: p, created: false };
    }

    const p = {
      id: 'p' + this.nextId('product'),
      ...data,
      variants: data.variants || []
    };
    this.state.products.push(p);

    // El stock inicial también deja rastro: entrada por alta de producto.
    p.variants.forEach(v => {
      if (v.stock > 0) {
        const opening = v.stock;
        v.stock = 0;
        this.applyMovement({
          variantId: v.id, type: 'entrada', qty: opening,
          reason: 'Producción terminada', ref: 'ALTA-' + p.sku
        });
      }
    });

    this.save();
    return { ok: true, product: p, created: true };
  },

  deleteProduct(id) {
    const p = this.product(id);
    if (!p) return { ok: false };
    // Desactivar, no borrar: el histórico de ventas debe seguir siendo legible.
    p.active = false;
    this.save();
    return { ok: true };
  },

  toggleProduct(id) {
    const p = this.product(id);
    if (!p) return { ok: false };
    p.active = !p.active;
    this.save();
    return { ok: true, active: p.active };
  }
};
