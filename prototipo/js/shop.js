/* ============================================================
   SOCCER CAGE — Tienda (experiencia de cliente)
   Catálogo → detalle → carrito → checkout → pago → confirmación
   Todo el texto visible pasa por I18N.t(); los valores de negocio
   (nombres de producto, SKU, cifras) NO se traducen: son datos.
   ============================================================ */

const Shop = {
  filters: { cat: 'todos', q: '', sort: 'rel', hideOut: false },
  sel: { productId: null, size: null, color: null, qty: 1 },

  init() {
    this.renderCats();
    this.render();

    const search = document.getElementById('shopSearch');
    search.addEventListener('input', e => {
      this.filters.q = e.target.value.trim().toLowerCase();
      this.render();
    });

    document.getElementById('shopSort').addEventListener('change', e => {
      this.filters.sort = e.target.value;
      this.render();
    });

    document.getElementById('shopHideOut').addEventListener('change', e => {
      this.filters.hideOut = e.target.checked;
      this.render();
    });

    document.getElementById('heroShop').onclick = () =>
      document.getElementById('shopGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });

    document.getElementById('heroCustom').onclick = () => {
      this.filters.cat = 'personalizado';
      this.renderCats();
      this.render();
      document.getElementById('shopGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    document.getElementById('cartBtn').onclick   = () => this.openCart();
    document.getElementById('cartClose').onclick = () => this.closeCart();
    document.getElementById('cartOverlay').onclick = () => this.closeCart();

    this.renderCart();
    this.updateHero();
  },

  updateHero() {
    const m = Store.metrics();
    document.getElementById('heroSkus').textContent  = m.skuCount;
    document.getElementById('heroUnits').textContent = UI.num(m.units);
  },

  /** El id de categoría ('todos', 'camisetas'…) es una clave interna que
      no cambia con el idioma; solo su etiqueta visible se traduce. */
  renderCats() {
    const used = new Set(Store.products.filter(p => p.active).map(p => p.category));
    const cats = [{ id: 'todos', name: I18N.t('shop.catAll') }].concat(
      SEED.categories.filter(c => used.has(c.id)).map(c => ({ id: c.id, name: UI.catName(c.id) }))
    );
    document.getElementById('shopCats').innerHTML = cats.map(c =>
      `<button class="chip ${this.filters.cat === c.id ? 'active' : ''}" data-cat="${c.id}">${UI.esc(c.name)}</button>`
    ).join('');

    document.querySelectorAll('#shopCats .chip').forEach(btn => {
      btn.onclick = () => {
        this.filters.cat = btn.dataset.cat;
        this.renderCats();
        this.render();
      };
    });
  },

  visibleProducts() {
    let list = Store.products.filter(p => p.active);

    if (this.filters.cat !== 'todos') list = list.filter(p => p.category === this.filters.cat);

    if (this.filters.q) {
      const q = this.filters.q;
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.variants.some(v => v.sku.toLowerCase().includes(q) || v.color.toLowerCase().includes(q))
      );
    }

    if (this.filters.hideOut) list = list.filter(p => Store.productStatus(p) !== 'agotado');

    const s = this.filters.sort;
    if (s === 'price-asc')  list.sort((a, b) => a.price - b.price);
    if (s === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (s === 'name')       list.sort((a, b) => a.name.localeCompare(b.name, I18N.lang));
    if (s === 'stock')      list.sort((a, b) => Store.productStock(b) - Store.productStock(a));
    if (s === 'rel')        list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

    return list;
  },

  render() {
    const list = this.visibleProducts();
    const grid = document.getElementById('shopGrid');
    const count = document.getElementById('shopResultCount');

    count.textContent = list.length
      ? I18N.t(list.length === 1 ? 'shop.results' : 'shop.resultsPlural', { n: list.length })
      : '';

    if (!list.length) {
      grid.innerHTML = `<div style="grid-column:1/-1">${UI.empty(
        I18N.t('shop.noResults'),
        I18N.t('shop.noResultsBody'),
        '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>'
      )}</div>`;
      return;
    }

    grid.innerHTML = list.map(p => {
      const status = Store.productStatus(p);
      const total  = Store.productStock(p);
      const colors = [...new Set(p.variants.map(v => v.colorHex))].slice(0, 4);

      // El aviso solo es útil si el producto está realmente por agotarse.
      // Que una talla suelta esté baja es lo normal y no merece alarma:
      // si se avisa siempre, el cliente deja de leer el aviso.
      const sellable = p.variants.filter(v => Store.available(v) > 0).length;
      const scarce = !p.madeToOrder && total > 0 &&
                     (total <= p.minStock * 2 || sellable <= 2);

      const flags = [];
      if (status === 'agotado') flags.push(`<span class="badge badge-danger">${I18N.t('shop.badgeOut')}</span>`);
      else if (scarce) flags.push(`<span class="badge badge-warn">${I18N.t('shop.badgeScarce')}</span>`);
      if (p.tags && p.tags.length) flags.push(`<span class="badge badge-gold">${UI.esc(p.tags[0])}</span>`);

      const stockTxt = p.madeToOrder
        ? `<span class="muted">${I18N.t('shop.madeToOrder')}</span>`
        : (total > 0
            ? `<span class="muted">${I18N.t('shop.availableCount', { n: total })}</span>`
            : `<span style="color:var(--danger-600);font-weight:600">${I18N.t('shop.noStock')}</span>`);

      return `
        <article class="p-card" data-id="${p.id}" tabindex="0" role="button" aria-label="${I18N.t('shop.viewProduct', { name: UI.esc(p.name) })}">
          <div class="p-media" style="background:${UI.mediaBg()}">
            ${UI.productArt(p)}
            <div class="p-flags">${flags.join('')}</div>
          </div>
          <div class="p-info">
            <div class="p-cat">${UI.esc(UI.catName(p.category))}</div>
            <div class="p-name">${UI.esc(p.name)}</div>
            <div style="display:flex;gap:5px;margin-top:10px">
              ${colors.map(c => `<span style="width:13px;height:13px;border-radius:50%;background:${c};box-shadow:0 0 0 1px var(--border-strong)"></span>`).join('')}
            </div>
            <div class="p-meta">
              <div>
                <div class="p-price">${UI.money(p.price)}</div>
                <div class="p-stock">${stockTxt}</div>
              </div>
            </div>
          </div>
        </article>`;
    }).join('');

    grid.querySelectorAll('.p-card').forEach(card => {
      const open = () => this.openProduct(card.dataset.id);
      card.onclick = open;
      card.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };
    });
  },

  /* ---------- Detalle de producto ---------- */
  openProduct(id) {
    const p = Store.product(id);
    if (!p) return;

    const colors = [...new Set(p.variants.map(v => v.color))];
    const firstColor = colors.find(c =>
      p.variants.some(v => v.color === c && Store.available(v) > 0)
    ) || colors[0];

    this.sel = { productId: id, color: firstColor, size: null, qty: 1 };
    UI.modal(this.productHTML(p), 'wide');
    this.bindProduct();
  },

  productHTML(p) {
    const colors = [...new Set(p.variants.map(v => v.color))];
    const color  = this.sel.color;
    const hex    = (p.variants.find(v => v.color === color) || {}).colorHex;
    const sizes  = p.variants.filter(v => v.color === color);
    const selVar = sizes.find(v => v.size === this.sel.size);
    const avail  = selVar ? Store.available(selVar) : 0;

    const price = p.price + (selVar ? (selVar.priceDelta || 0) : 0);
    const maxQty = p.madeToOrder ? 99 : avail;

    let availText = `<span class="muted tiny">${I18N.t('shop.pickSize')}</span>`;
    if (selVar) {
      if (p.madeToOrder) {
        availText = `<span class="badge badge-gold">${I18N.t('shop.customBadge')}</span>`;
      } else if (avail <= 0) {
        availText = `<span class="badge badge-danger">${I18N.t('shop.outSize')}</span>`;
      } else if (avail <= p.minStock) {
        availText = `<span class="badge badge-warn">${I18N.t('shop.lowSize', { n: avail })}</span>`;
      } else {
        availText = `<span class="badge badge-ok">${I18N.t('shop.okSize', { n: avail })}</span>`;
      }
    }

    return `
      <div class="modal-head">
        <div>
          <div class="p-cat">${UI.esc(UI.catName(p.category))}</div>
          <h2 style="margin-top:3px">${UI.esc(p.name)}</h2>
        </div>
        <button class="icon-btn" onclick="UI.closeModal()" aria-label="${I18N.t('shop.close')}">
          <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="pd-grid">
          <div>
            <div class="pd-media" style="background:${UI.mediaBg()}">${UI.garment(p.category, hex)}</div>
            <div class="mono tiny muted" style="margin-top:10px">
              ${I18N.t('shop.skuBase', { sku: UI.esc(p.sku) })}${selVar ? I18N.t('shop.skuVariant', { sku: UI.esc(selVar.sku) }) : ''}
            </div>
          </div>

          <div>
            <div style="font-size:30px;font-weight:700;letter-spacing:-.03em">${UI.money(price)}</div>
            <p style="color:var(--ink-500);margin-top:12px;line-height:1.65;font-size:13.5px">${UI.esc(p.description)}</p>

            <div style="height:1px;background:var(--border);margin:20px 0"></div>

            <div class="opt-group">
              <div class="opt-label"><span>${I18N.t('shop.color')}</span><span style="text-transform:none;letter-spacing:0;font-weight:500;color:var(--ink-400)">${UI.esc(color)}</span></div>
              <div class="color-row">
                ${colors.map(c => {
                  const v = p.variants.find(x => x.color === c);
                  const has = p.variants.some(x => x.color === c && Store.available(x) > 0);
                  return `<button class="color-btn ${c === color ? 'sel' : ''}" data-color="${UI.esc(c)}"
                            style="background:${v.colorHex};${has ? '' : 'opacity:.4'}"
                            title="${UI.esc(c)}${has ? '' : I18N.t('shop.notAvailable')}" aria-label="${UI.esc(c)}"></button>`;
                }).join('')}
              </div>
            </div>

            <div class="opt-group">
              <div class="opt-label">
                <span>${I18N.t('shop.size')}</span>
                <span style="text-transform:none;letter-spacing:0;font-weight:500;color:var(--ink-400)">${I18N.t('shop.liveStock')}</span>
              </div>
              <div class="size-row">
                ${sizes.map(v => {
                  const a = Store.available(v);
                  const out = !p.madeToOrder && a <= 0;
                  const low = !p.madeToOrder && a > 0 && a <= p.minStock;
                  return `<button class="size-btn ${this.sel.size === v.size ? 'sel' : ''} ${out ? 'out' : ''} ${low ? 'low' : ''}"
                            data-size="${UI.esc(v.size)}" ${out ? 'disabled' : ''}
                            title="${out ? I18N.t('shop.soldOutTitle') : I18N.t('shop.availableCount', { n: a })}">
                            <span>${UI.esc(v.size)}</span>
                            <span class="s-qty">${p.madeToOrder ? '—' : a}</span>
                          </button>`;
                }).join('')}
              </div>
              <div style="margin-top:12px">${availText}</div>
            </div>

            <div class="opt-group">
              <div class="opt-label">${I18N.t('shop.quantity')}</div>
              <div class="qty-stepper">
                <button id="qMinus" aria-label="Decrease">−</button>
                <input id="qInput" type="text" inputmode="numeric" value="${this.sel.qty}" aria-label="${I18N.t('shop.quantity')}">
                <button id="qPlus" aria-label="Increase">+</button>
              </div>
              ${selVar && !p.madeToOrder ? `<div class="hint">${I18N.t('shop.maxQty', { n: maxQty })}</div>` : ''}
            </div>
          </div>
        </div>
      </div>

      <div class="modal-foot">
        <button class="btn" onclick="UI.closeModal()">${I18N.t('shop.keepShopping')}</button>
        <button class="btn btn-gold" id="addCart" ${(!selVar || (!p.madeToOrder && avail <= 0)) ? 'disabled' : ''}>
          ${!selVar ? I18N.t('shop.pickSizeBtn') : ((!p.madeToOrder && avail <= 0) ? I18N.t('shop.soldOutBtn') : I18N.t('shop.addToCart', { price: UI.money(price * this.sel.qty) }))}
        </button>
      </div>`;
  },

  refreshProduct() {
    const p = Store.product(this.sel.productId);
    document.getElementById('modalBox').innerHTML = this.productHTML(p);
    this.bindProduct();
  },

  bindProduct() {
    const p = Store.product(this.sel.productId);
    const box = document.getElementById('modalBox');

    box.querySelectorAll('.color-btn').forEach(b => {
      b.onclick = () => {
        this.sel.color = b.dataset.color;
        this.sel.size = null;
        this.sel.qty = 1;
        this.refreshProduct();
      };
    });

    box.querySelectorAll('.size-btn:not(.out)').forEach(b => {
      b.onclick = () => {
        this.sel.size = b.dataset.size;
        this.sel.qty = 1;
        this.refreshProduct();
      };
    });

    const maxFor = () => {
      const v = p.variants.find(x => x.color === this.sel.color && x.size === this.sel.size);
      if (!v) return 1;
      return p.madeToOrder ? 99 : Store.available(v);
    };

    const minus = document.getElementById('qMinus');
    const plus  = document.getElementById('qPlus');
    const input = document.getElementById('qInput');

    if (minus) minus.onclick = () => {
      if (this.sel.qty > 1) { this.sel.qty--; this.refreshProduct(); }
    };
    if (plus) plus.onclick = () => {
      if (this.sel.qty < maxFor()) { this.sel.qty++; this.refreshProduct(); }
      else UI.toast('warn', I18N.t('shop.limitReached'), I18N.t('shop.limitReachedBody'));
    };
    if (input) input.onchange = () => {
      const n = Math.max(1, Math.min(maxFor(), parseInt(input.value) || 1));
      this.sel.qty = n;
      this.refreshProduct();
    };

    const add = document.getElementById('addCart');
    if (add) add.onclick = () => {
      const v = p.variants.find(x => x.color === this.sel.color && x.size === this.sel.size);
      if (!v) return;
      const r = Store.addToCart(p.id, v.id, this.sel.qty);
      if (!r.ok) { UI.toast('danger', I18N.t('shop.notFoundTitle'), r.error); return; }
      UI.closeModal();
      this.renderCart();
      this.bumpCart();
      UI.toast('ok', I18N.t('shop.addedTitle'), I18N.t('shop.addedBody', { qty: this.sel.qty, name: p.name, variant: `${v.size} / ${v.color}` }));
      this.openCart();
    };
  },

  /* ---------- Carrito ---------- */
  bumpCart() {
    const el = document.getElementById('cartCount');
    el.classList.remove('pulse');
    void el.offsetWidth;
    el.classList.add('pulse');
  },

  openCart() {
    this.renderCart();
    document.getElementById('cartDrawer').classList.add('open');
    document.getElementById('cartOverlay').classList.add('open');
    document.body.classList.add('no-scroll');
  },

  closeCart() {
    document.getElementById('cartDrawer').classList.remove('open');
    document.getElementById('cartOverlay').classList.remove('open');
    document.body.classList.remove('no-scroll');
  },

  renderCart() {
    document.getElementById('cartCount').textContent = Store.cartCount();

    const body = document.getElementById('cartBody');
    const foot = document.getElementById('cartFoot');
    const cart = Store.cart;

    if (!cart.length) {
      body.innerHTML = UI.empty(
        I18N.t('cart.empty'),
        I18N.t('cart.emptyBody'),
        '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>'
      );
      foot.innerHTML = `<button class="btn btn-block" onclick="Shop.closeCart()">${I18N.t('cart.keepShopping')}</button>`;
      return;
    }

    body.innerHTML = cart.map(l => `
      <div class="cart-line">
        <div class="cart-thumb" style="background:${UI.mediaBg()}">
          ${UI.garment(Store.product(l.productId).category, l.colorHex)}
        </div>
        <div class="cart-info">
          <div class="cart-name">${UI.esc(l.name)}</div>
          <div class="cart-variant">${UI.esc(l.variant)} · <span class="mono">${UI.esc(l.sku)}</span></div>
          <div class="cart-line-foot">
            <div class="qty-stepper" style="transform:scale(.85);transform-origin:left">
              <button data-dec="${l.variantId}" aria-label="${I18N.t('cart.decrease')}">−</button>
              <input value="${l.qty}" readonly aria-label="${I18N.t('shop.quantity')}">
              <button data-inc="${l.variantId}" aria-label="${I18N.t('cart.increase')}">+</button>
            </div>
            <div style="display:flex;align-items:center;gap:10px">
              <strong>${UI.money(l.price * l.qty)}</strong>
              <button class="icon-btn" data-del="${l.variantId}" aria-label="${I18N.t('cart.remove')}" style="width:26px;height:26px">
                <svg style="width:14px;height:14px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>`).join('');

    const t = Store.cartTotals();
    foot.innerHTML = `
      <div class="sum-row"><span class="muted">${I18N.t('cart.subtotal')}</span><span>${UI.money(t.subtotal)}</span></div>
      <div class="sum-row"><span class="muted">${I18N.t('cart.shipping')}</span><span>${t.shipping === 0 ? `<span style="color:var(--ok-600);font-weight:600">${I18N.t('cart.free')}</span>` : UI.money(t.shipping)}</span></div>
      ${t.subtotal < Store.settings.freeShippingOver ? `<div class="tiny muted" style="padding:2px 0">${I18N.t('cart.freeThreshold', { amount: UI.money0(Store.settings.freeShippingOver) })}</div>` : ''}
      <div class="sum-row total"><span>${I18N.t('cart.total')}</span><span>${UI.money(t.total)}</span></div>
      <button class="btn btn-gold btn-block btn-lg" style="margin-top:14px" id="goCheckout">${I18N.t('cart.checkout')}</button>
      <button class="btn btn-ghost btn-block btn-sm" style="margin-top:6px" onclick="Shop.closeCart()">${I18N.t('cart.keepShopping')}</button>`;

    body.querySelectorAll('[data-inc]').forEach(b => b.onclick = () => {
      const line = Store.cart.find(l => l.variantId === b.dataset.inc);
      const r = Store.updateCartQty(b.dataset.inc, line.qty + 1);
      if (!r.ok && r.error) UI.toast('warn', I18N.t('shop.limitReached'), r.error);
      this.renderCart();
    });

    body.querySelectorAll('[data-dec]').forEach(b => b.onclick = () => {
      const line = Store.cart.find(l => l.variantId === b.dataset.dec);
      Store.updateCartQty(b.dataset.dec, line.qty - 1);
      this.renderCart();
    });

    body.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      Store.removeFromCart(b.dataset.del);
      this.renderCart();
      UI.toast('info', I18N.t('cart.removedTitle'), I18N.t('cart.removedBody'));
    });

    document.getElementById('goCheckout').onclick = () => {
      this.closeCart();
      this.checkout();
    };
  },

  /* ============================================================
     CHECKOUT — 3 pasos: datos → pago → confirmación
     ============================================================ */
  checkout() {
    if (!Store.cart.length) { UI.toast('warn', I18N.t('cart.emptyWarnTitle'), I18N.t('cart.emptyWarnBody')); return; }
    UI.modal(this.checkoutHTML(), '');
    this.bindCheckout();
  },

  checkoutHTML() {
    const t = Store.cartTotals();
    return `
      <div class="modal-head">
        <h2>${I18N.t('checkout.title')}</h2>
        <button class="icon-btn" onclick="UI.closeModal()" aria-label="${I18N.t('shop.close')}">
          <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="steps">
          <div class="step active"><span class="n">1</span> ${I18N.t('checkout.step1')}</div>
          <div class="step-line"></div>
          <div class="step"><span class="n">2</span> ${I18N.t('checkout.step2')}</div>
          <div class="step-line"></div>
          <div class="step"><span class="n">3</span> ${I18N.t('checkout.step3')}</div>
        </div>

        <div class="demo-banner">
          <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          ${I18N.t('checkout.demoNote')}
        </div>

        <form id="checkoutForm" novalidate>
          <div class="form-grid">
            <div class="field span-2">
              <label for="ckName">${I18N.t('checkout.fullName')} <span class="req">*</span></label>
              <input class="input" id="ckName" data-autofocus placeholder="${I18N.t('checkout.fullNamePh')}" autocomplete="name">
              <div class="err-msg" id="errName">${I18N.t('checkout.fullNameErr')}</div>
            </div>
            <div class="field">
              <label for="ckEmail">${I18N.t('checkout.email')} <span class="req">*</span></label>
              <input class="input" id="ckEmail" type="email" placeholder="compras@club.com" autocomplete="email">
              <div class="err-msg" id="errEmail">${I18N.t('checkout.emailErr')}</div>
            </div>
            <div class="field">
              <label for="ckPhone">${I18N.t('checkout.phone')}</label>
              <input class="input" id="ckPhone" placeholder="(305) 555-0100" autocomplete="tel">
            </div>
            <div class="field span-2">
              <label for="ckAddr">${I18N.t('checkout.address')} <span class="req">*</span></label>
              <input class="input" id="ckAddr" placeholder="${I18N.t('checkout.addressPh')}" autocomplete="street-address">
              <div class="err-msg" id="errAddr">${I18N.t('checkout.addressErr')}</div>
            </div>
            <div class="field">
              <label for="ckCity">${I18N.t('checkout.city')}</label>
              <input class="input" id="ckCity" value="Miami" autocomplete="address-level2">
            </div>
            <div class="field">
              <label for="ckZip">${I18N.t('checkout.zip')}</label>
              <input class="input" id="ckZip" placeholder="33131" autocomplete="postal-code">
            </div>
          </div>

          <h3 style="margin:18px 0 12px">${I18N.t('checkout.paymentMethod')}</h3>
          <div class="field">
            <select class="select" id="ckPay">
              <option value="Stripe · Visa ···4242">${I18N.t('checkout.cardOption')}</option>
              <option value="PayPal">PayPal</option>
              <option value="Transferencia ACH">${I18N.t('checkout.achOption')}</option>
            </select>
            <div class="hint">${I18N.t('checkout.tokenizeNote')}</div>
          </div>

          <div class="pay-card">
            <div style="font-weight:640;margin-bottom:10px">${I18N.t('checkout.orderSummary')}</div>
            ${Store.cart.map(l => `
              <div class="row"><span>${UI.esc(l.name)} · ${UI.esc(l.variant)} × ${l.qty}</span><b>${UI.money(l.price * l.qty)}</b></div>
            `).join('')}
            <div style="height:1px;background:#3a3f4a;margin:10px 0"></div>
            <div class="row"><span>${I18N.t('cart.subtotal')}</span><b>${UI.money(t.subtotal)}</b></div>
            <div class="row"><span>${I18N.t('cart.shipping')}</span><b>${t.shipping === 0 ? I18N.t('cart.free') : UI.money(t.shipping)}</b></div>
            <div class="row" style="font-size:16px;margin-top:8px"><span style="color:#fff">${I18N.t('cart.total')}</span><b style="color:var(--gold-400)">${UI.money(t.total)}</b></div>
          </div>
        </form>
      </div>

      <div class="modal-foot">
        <button class="btn" onclick="Shop.openCart();UI.closeModal()">${I18N.t('checkout.backToCart')}</button>
        <button class="btn btn-gold" id="payNow">${I18N.t('checkout.pay', { amount: UI.money(t.total) })}</button>
      </div>`;
  },

  bindCheckout() {
    document.getElementById('payNow').onclick = () => {
      const name  = document.getElementById('ckName').value.trim();
      const email = document.getElementById('ckEmail').value.trim();
      const addr  = document.getElementById('ckAddr').value.trim();
      const city  = document.getElementById('ckCity').value.trim();
      const pay   = document.getElementById('ckPay').value;

      let bad = false;
      const mark = (inputId, errId, cond) => {
        const i = document.getElementById(inputId), e = document.getElementById(errId);
        if (cond) { i.classList.add('error'); e.classList.add('show'); bad = true; }
        else { i.classList.remove('error'); e.classList.remove('show'); }
      };
      mark('ckName',  'errName',  !name);
      mark('ckEmail', 'errEmail', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
      mark('ckAddr',  'errAddr',  !addr);

      if (bad) { UI.toast('danger', I18N.t('checkout.formErrTitle'), I18N.t('checkout.formErrBody')); return; }

      this.processPayment({ name, email, phone: document.getElementById('ckPhone').value.trim(), city: city + ', FL', paymentMethod: pay });
    };
  },

  /** Simula la secuencia real: autorización → webhook → pedido → inventario. */
  processPayment(customer) {
    UI.modal(`
      <div class="modal-body">
        <div class="processing">
          <div class="spinner"></div>
          <h2>${I18N.t('pay.processing')}</h2>
          <p class="muted" style="margin-top:6px;font-size:13.5px">${I18N.t('pay.dontClose')}</p>
          <div class="pay-steps" style="margin-top:26px">
            <div class="pay-step" id="ps1"><span class="tick"></span> ${I18N.t('pay.step1')}</div>
            <div class="pay-step" id="ps2"><span class="tick"></span> ${I18N.t('pay.step2')}</div>
            <div class="pay-step" id="ps3"><span class="tick"></span> ${I18N.t('pay.step3')}</div>
            <div class="pay-step" id="ps4"><span class="tick"></span> ${I18N.t('pay.step4')}</div>
          </div>
        </div>
      </div>`, 'narrow');

    const tick = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
    const on = id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.add('on');
      el.querySelector('.tick').innerHTML = tick;
    };

    setTimeout(() => on('ps1'), 550);
    setTimeout(() => on('ps2'), 1150);
    setTimeout(() => on('ps3'), 1700);
    setTimeout(() => on('ps4'), 2200);

    setTimeout(() => {
      const r = Store.placeOrder(customer);
      if (!r.ok) {
        UI.modal(`
          <div class="modal-head"><h2>${I18N.t('pay.failedTitle')}</h2></div>
          <div class="modal-body">
            <div class="alert alert-danger">
              <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              <div><div class="alert-title">${I18N.t('pay.failedHead')}</div><div class="alert-body">${UI.esc(r.error)}</div></div>
            </div>
            <p class="muted" style="font-size:13px;line-height:1.6">
              ${I18N.t('pay.failedNote')}
            </p>
          </div>
          <div class="modal-foot">
            <button class="btn btn-primary" onclick="UI.closeModal();Shop.openCart()">${I18N.t('pay.reviewCart')}</button>
          </div>`, 'narrow');
        UI.toast('danger', I18N.t('pay.blockedToast'), r.error);
        return;
      }

      this.successHTML(r);
      Shop.renderCart();
      Shop.render();
      Shop.updateHero();
      if (typeof Admin !== 'undefined') Admin.refresh();
      UI.toast('ok', I18N.t('pay.confirmedTitle'), I18N.t('pay.confirmedToast', { number: r.order.number }));
    }, 2750);
  },

  successHTML(r) {
    const o = r.order;
    UI.modal(`
      <div class="modal-body" style="text-align:center">
        <div class="success-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <h2>${I18N.t('confirm.title')}</h2>
        <p class="muted" style="margin-top:8px;font-size:13.5px">
          ${I18N.t('confirm.sentTo', { email: `<strong>${UI.esc(r.customer.email)}</strong>` })}
        </p>

        <div class="receipt">
          <div class="r-row"><span class="muted">${I18N.t('confirm.orderNumber')}</span><b class="mono">${o.number}</b></div>
          <div class="r-row"><span class="muted">${I18N.t('confirm.date')}</span><b>${UI.date(o.date, true)}</b></div>
          <div class="r-row"><span class="muted">${I18N.t('confirm.paymentMethod')}</span><b>${UI.esc(o.paymentMethod)}</b></div>
          <div class="r-row"><span class="muted">${I18N.t('confirm.paymentStatus')}</span><b style="color:var(--ok-600)">${I18N.t('confirm.paid')}</b></div>
          <div class="r-row"><span class="muted">${I18N.t('confirm.orderStatus')}</span><b>${I18N.t('confirm.pendingPrep')}</b></div>
          <div style="height:1px;background:var(--border-strong);margin:8px 0"></div>
          ${o.items.map(i => `<div class="r-row"><span>${UI.esc(i.name)} · ${UI.esc(i.variant)} × ${i.qty}</span><b>${UI.money(i.price * i.qty)}</b></div>`).join('')}
          <div class="r-row" style="font-size:15px;margin-top:6px"><span><b>${I18N.t('confirm.total')}</b></span><b>${UI.money(o.total)}</b></div>
        </div>

        <div class="trace">
          <div class="trace-title">
            <svg style="width:13px;height:13px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
            ${I18N.t('confirm.traceTitle')}
          </div>
          ${r.trace.map(m => `
            <div class="trace-line">
              <span>${UI.esc(m.product)}<br><span class="muted tiny">${UI.esc(m.variant)} · ${UI.esc(m.sku)}</span></span>
              <span class="nowrap"><span class="mono muted">${m.before}</span> → <b class="mono">${m.after}</b> <span class="trace-delta">(−${m.qty})</span></span>
            </div>`).join('')}
        </div>

        <p class="tiny muted" style="margin-top:16px;line-height:1.6">
          ${I18N.t('confirm.traceFooter')}
        </p>
      </div>

      <div class="modal-foot">
        <button class="btn" onclick="UI.closeModal()">${I18N.t('cart.keepShopping')}</button>
        <button class="btn btn-primary" id="seeOrder">${I18N.t('confirm.seeAdmin')}</button>
      </div>`, '');

    document.getElementById('seeOrder').onclick = () => {
      UI.closeModal();
      App.setMode('admin');
      Admin.go('movements');
    };
  }
};
