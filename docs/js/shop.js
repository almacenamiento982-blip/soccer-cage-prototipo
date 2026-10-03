/* ============================================================
   SOCCER CAGE — Tienda (experiencia del cliente)

   Tres tiendas, un inventario. Flujo:
   kit obligatorio → piezas sueltas → carrito → cuenta → entrega → pago.
   Todo el texto visible pasa por I18N.t(); nombres de producto, SKU
   y cifras son datos y no se traducen.
   ============================================================ */

const Shop = {
  filters: { cat: 'todos', q: '', sort: 'rel', hideOut: false },
  sel: { productId: null, size: null, qty: 1 },
  kit: { productId: null, sizes: {}, player: '', img: null },
  fulfill: 'pickup',
  form: {},

  init() {
    document.getElementById('cartBtn').onclick = () => this.openCart();
    document.getElementById('cartClose').onclick = () => this.closeCart();
    document.getElementById('cartOverlay').onclick = () => this.closeCart();
    this.render();
    this.renderCart();
  },

  get store() { return Store.currentStore; },
  products() { return Store.productsInStore(this.store.id); },
  kits() { return this.products().filter(p => Store.isKit(p)); },
  singles() { return this.products().filter(p => !Store.isKit(p)); },

  /** Unidades que este cliente aún puede añadir: stock real menos lo que ya lleva en el carrito. */
  free(v) { return Math.max(0, Store.available(v) - (Store.demand()[v.id] || 0)); },

  setStore(id) {
    Store.setStore(id);
    this.filters = { cat: 'todos', q: '', sort: 'rel', hideOut: false };
    this.render();
    this.renderCart();
    window.scrollTo({ top: 0 });
  },

  /* ============================================================
     PÁGINA DE LA TIENDA
     ============================================================ */
  render() {
    const root = document.getElementById('shopRoot');
    const st = this.store;

    if (App.storefront && !st.active) {
      root.innerHTML = `
        <section class="hero">
          <div class="hero-eyebrow">${UI.esc(st.name)}</div>
          <h1>${I18N.t('shop.soonTitle')}</h1>
          <p>${I18N.t('shop.soonBody')}</p>
        </section>`;
      return;
    }

    const kits = this.kits();
    const heroKey = I18N.has('store.' + st.id + '.title') ? 'store.' + st.id : 'store.generic';

    root.innerHTML = `
      ${App.storefront ? '' : `
      <div class="store-tabs" role="tablist" aria-label="${I18N.t('shop.storesAria')}">
        ${Store.stores.map(s => `
          <button class="store-tab ${s.id === st.id ? 'active' : ''}" data-store="${s.id}" role="tab" aria-selected="${s.id === st.id}">
            <span class="store-tab-name">${UI.esc(s.name)}</span>
            <span class="store-tab-meta">${I18N.t('shop.phase', { n: s.phase })} · ${I18N.t(s.active ? 'store.statusActive' : 'store.statusPrep')}</span>
          </button>`).join('')}
      </div>`}

      ${!st.active ? `
      <div class="alert alert-info">
        ${UI.infoIcon()}
        <div>
          <div class="alert-title">${I18N.t('shop.previewTitle', { n: st.phase })}</div>
          <div class="alert-body">${I18N.t(st.source ? 'shop.previewBodySource' : 'shop.previewBody', { source: UI.esc((st.source || '').replace(/^https?:\/\//, '').replace(/\/$/, '')) })}</div>
        </div>
      </div>` : ''}

      <section class="hero">
        <div class="hero-eyebrow">
          <svg style="width:13px;height:13px" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
          ${UI.esc(st.name)} · ${I18N.t('shop.official')}
        </div>
        <h1>${I18N.t(heroKey + '.title')}</h1>
        <p>${I18N.t(heroKey + '.body')}</p>
        <div class="hero-actions">
          ${kits.length ? `<button class="btn btn-gold btn-lg" id="heroKit">${I18N.t(st.kitRequired ? 'shop.heroKitBtn' : 'shop.heroKitsBtn')}</button>` : ''}
          <button class="btn btn-lg btn-on-dark" id="heroSingles">${I18N.t('shop.heroSinglesBtn')}</button>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><div class="v">${st.pickup ? I18N.t('shop.factPickupV') : 'USPS'}</div><div class="l">${I18N.t(st.pickup ? 'fulfill.pickup.' + (I18N.has('fulfill.pickup.' + st.id) ? st.id : 'generic') : 'shop.factShipL')}</div></div>
          <div class="hero-stat"><div class="v">USPS</div><div class="l">${I18N.t('shop.factShipL')}</div></div>
          <div class="hero-stat"><div class="v">${UI.pct(st.taxRate)}</div><div class="l">${I18N.t('shop.factTaxL')}</div></div>
        </div>
      </section>

      <div id="shopAccount"></div>

      ${kits.length ? `
      <section id="shopKits" class="shop-section">
        <div class="section-head">
          <div>
            <h2>${I18N.t(st.kitRequired ? 'shop.kitRequiredTitle' : 'shop.kitsTitle')}</h2>
            <p class="muted tiny" style="margin-top:3px">${I18N.t(st.kitRequired ? 'shop.kitRequiredSub' : 'shop.kitsSub')}</p>
          </div>
        </div>
        <div class="kit-grid" id="shopKitGrid"></div>
      </section>` : ''}

      <section id="shopSingles" class="shop-section">
        <div class="section-head">
          <div>
            <h2>${I18N.t('shop.singlesTitle')}</h2>
            <p class="muted tiny" style="margin-top:3px">${I18N.t(st.kitRequired && kits.length ? 'shop.singlesSubGate' : 'shop.availSub')}</p>
          </div>
          <span class="muted tiny" id="shopResultCount"></span>
        </div>

        <div class="shop-toolbar">
          <div class="search-box">
            <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input class="input" id="shopSearch" type="search" placeholder="${I18N.t('shop.searchPh')}" aria-label="${I18N.t('shop.search')}" value="${UI.esc(this.filters.q)}">
          </div>
          <select class="select" id="shopSort" style="width:auto;min-width:175px" aria-label="${I18N.t('shop.sort')}">
            ${[['rel', 'shop.sortFeatured'], ['price-asc', 'shop.sortPriceAsc'], ['price-desc', 'shop.sortPriceDesc'], ['name', 'shop.sortName'], ['stock', 'shop.sortStock']]
              .map(([v, k]) => `<option value="${v}"${this.filters.sort === v ? ' selected' : ''}>${I18N.t(k)}</option>`).join('')}
          </select>
          <label class="chip chip-check">
            <input type="checkbox" id="shopHideOut" ${this.filters.hideOut ? 'checked' : ''}> ${I18N.t('shop.hideOut')}
          </label>
        </div>

        <div class="chips" id="shopCats" style="margin-bottom:var(--s5)"></div>
        <div class="product-grid" id="shopGrid"></div>
      </section>

      <p class="shop-foot muted tiny">${I18N.t('shop.footNote', { tax: UI.pct(st.taxRate) })}</p>`;

    root.querySelectorAll('[data-store]').forEach(b => b.onclick = () => this.setStore(b.dataset.store));

    const go = id => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    const hk = document.getElementById('heroKit');
    if (hk) hk.onclick = () => go('shopKits');
    document.getElementById('heroSingles').onclick = () => go('shopSingles');

    document.getElementById('shopSearch').oninput = e => { this.filters.q = e.target.value.trim().toLowerCase(); this.renderGrid(); };
    document.getElementById('shopSort').onchange = e => { this.filters.sort = e.target.value; this.renderGrid(); };
    document.getElementById('shopHideOut').onchange = e => { this.filters.hideOut = e.target.checked; this.renderGrid(); };

    this.renderAccount();
    this.renderKits();
    this.renderCats();
    this.renderGrid();
  },

  /* ---------- Cuenta del comprador ---------- */
  renderAccount() {
    const box = document.getElementById('shopAccount');
    if (!box) return;
    const st = this.store;
    const c = Store.session;
    const needsKit = st.kitRequired && this.kits().length > 0;

    if (!c) {
      box.innerHTML = `
        <div class="acct-bar">
          <div class="acct-ico"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
          <div class="acct-text">
            <div class="acct-title">${I18N.t('acct.guestTitle')}</div>
            <div class="acct-sub">${I18N.t(needsKit ? 'acct.guestSubKit' : 'acct.guestSub')}</div>
          </div>
          <button class="btn btn-sm" id="acctIn">${I18N.t('acct.signIn')}</button>
        </div>`;
      document.getElementById('acctIn').onclick = () => this.accountForm();
      return;
    }

    const src = needsKit ? Store.kitSource(c, st.id) : null;
    const kitBadge = !needsKit ? ''
      : src
        ? `<span class="badge badge-ok"><span class="dot"></span>${I18N.t('acct.kitOwned')}</span>`
        : `<span class="badge badge-warn"><span class="dot"></span>${I18N.t('acct.kitPending')}</span>`;
    const kitNote = !needsKit ? I18N.t('acct.signedSub')
      : src ? I18N.t('acct.kitOwnedSub.' + src.type, { ref: UI.esc(src.ref || '') })
            : I18N.t('acct.kitPendingSub');

    box.innerHTML = `
      <div class="acct-bar">
        <div class="acct-ico on">${UI.esc(c.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase())}</div>
        <div class="acct-text">
          <div class="acct-title">${I18N.t('acct.hello', { name: UI.esc(c.name.split(' ')[0]) })} ${kitBadge}</div>
          <div class="acct-sub">${UI.esc(c.email)} · ${kitNote}</div>
        </div>
        <button class="btn btn-sm btn-ghost" id="acctOut">${I18N.t('acct.signOut')}</button>
      </div>`;
    document.getElementById('acctOut').onclick = () => {
      Store.signOut();
      this.form = null;
      this.renderAccount();
      this.renderCart();
      UI.toast('info', I18N.t('acct.signedOutTitle'), I18N.t('acct.signedOutBody'));
    };
  },

  accountForm(next) {
    const demo = !App.storefront;
    UI.modal(`
      <div class="modal-head">
        <h2>${I18N.t('acct.formTitle')}</h2>
        ${UI.closeBtn()}
      </div>
      <div class="modal-body">
        <p class="muted" style="font-size:13.5px;line-height:1.6;margin-bottom:16px">${I18N.t(this.store.kitRequired ? 'acct.formIntroKit' : 'acct.formIntro')}</p>
        <div class="field">
          <label for="acEmail">${I18N.t('checkout.email')} <span class="req">*</span></label>
          <input class="input" id="acEmail" type="email" data-autofocus autocomplete="email" placeholder="name@email.com">
        </div>
        <div class="field">
          <label for="acName">${I18N.t('acct.fullName')}</label>
          <input class="input" id="acName" autocomplete="name">
          <div class="hint">${I18N.t('acct.nameHint')}</div>
        </div>
        <div class="field">
          <label for="acPhone">${I18N.t('checkout.phone')}</label>
          <input class="input" id="acPhone" autocomplete="tel" placeholder="(305) 555-0100">
        </div>
        <div class="err-msg" id="acErr"></div>
        ${demo ? `
        <div class="demo-banner" style="margin:14px 0 0;flex-wrap:wrap">
          ${UI.infoIcon()}
          <span>${I18N.t('acct.demoAccounts')}</span>
          <button class="chip chip-sm" data-fill="laura.gomez@example.com">${I18N.t('acct.demoWithKit')}</button>
          <button class="chip chip-sm" data-fill="daniel.kim@example.com">${I18N.t('acct.demoNoKit')}</button>
        </div>` : ''}
        <p class="tiny muted" style="margin-top:12px;line-height:1.6">${I18N.t('acct.protoNote')}</p>
      </div>
      <div class="modal-foot">
        <button class="btn" onclick="UI.closeModal()">${I18N.t('ui.cancel')}</button>
        <button class="btn btn-primary" id="acGo">${I18N.t('acct.continue')}</button>
      </div>`, 'narrow');

    const email = document.getElementById('acEmail');
    document.querySelectorAll('[data-fill]').forEach(b => b.onclick = () => { email.value = b.dataset.fill; submit(); });

    const submit = () => {
      const r = Store.signIn({
        email: email.value,
        name: document.getElementById('acName').value,
        phone: document.getElementById('acPhone').value
      });
      if (!r.ok) {
        const err = document.getElementById('acErr');
        err.textContent = r.error;
        err.classList.add('show');
        (r.needName ? document.getElementById('acName') : email).focus();
        return;
      }
      UI.closeModal();
      this.form = null;   // otra cuenta: el borrador del pago anterior ya no aplica
      this.renderAccount();
      this.renderCart();
      const src = Store.kitSource(r.customer, this.store.id);
      UI.toast('ok',
        I18N.t(r.created ? 'acct.createdTitle' : 'acct.welcomeTitle', { name: r.customer.name.split(' ')[0] }),
        this.store.kitRequired && this.kits().length ? I18N.t(src ? 'acct.toastHasKit' : 'acct.toastNoKit') : '');
      if (next === 'checkout') this.checkout();
    };

    document.getElementById('acGo').onclick = submit;
    // Enter se enlaza a los campos de ESTE formulario, no a la ventana modal:
    // la ventana se reutiliza y el manejador seguiría vivo en los siguientes.
    ['acEmail', 'acName', 'acPhone'].forEach(id => {
      document.getElementById(id).onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } };
    });
  },

  /* ---------- Kits ---------- */
  renderKits() {
    const grid = document.getElementById('shopKitGrid');
    if (!grid) return;

    grid.innerHTML = this.kits().map(p => {
      const parts = Store.kitParts(p);
      const save = Store.kitSavings(p);
      const out = Store.productStatus(p) === 'agotado';
      return `
        <article class="kit-card" data-kit="${p.id}" tabindex="0" role="button" aria-label="${I18N.t('shop.viewProduct', { name: UI.esc(p.name) })}">
          <div class="kit-media" style="background:${UI.mediaBg()}">
            ${UI.media(p)}
            ${out ? `<div class="p-flags"><span class="badge badge-danger">${I18N.t('shop.badgeOut')}</span></div>` : ''}
          </div>
          <div class="kit-info">
            <div class="p-cat">${UI.esc(UI.catNames(p))}${UI.lineName(p) ? ' · ' + UI.esc(UI.lineName(p)) : ''}</div>
            <h3 class="kit-name">${UI.esc(p.name)}</h3>
            <ul class="kit-list">
              ${parts.map(x => `<li><span class="q">${x.qty}×</span> ${UI.esc(x.product.name)}</li>`).join('')}
            </ul>
            <div class="kit-foot">
              <div>
                <div class="p-price">${UI.money(p.price)}${save ? ` <span class="was">${UI.money(Store.kitListPrice(p))}</span>` : ''}</div>
                ${save ? `<div class="kit-save">${I18N.t('shop.kitSave', { amount: UI.money(save) })}</div>` : `<div class="p-stock muted">${I18N.t('shop.kitPieces', { n: parts.reduce((s, x) => s + x.qty, 0) })}</div>`}
              </div>
              <span class="btn btn-primary btn-sm">${I18N.t('shop.kitChoose')}</span>
            </div>
          </div>
        </article>`;
    }).join('');

    grid.querySelectorAll('[data-kit]').forEach(card => {
      const open = () => this.openKit(card.dataset.kit);
      card.onclick = open;
      card.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };
    });
  },

  /* ---------- Piezas sueltas ---------- */
  renderCats() {
    const box = document.getElementById('shopCats');
    if (!box) return;
    const used = new Set();
    this.singles().forEach(p => p.categories.forEach(c => used.add(c)));
    const cats = ['todos'].concat(SEED.categories.filter(c => used.has(c)));
    if (cats.length <= 2) { box.innerHTML = ''; box.style.display = 'none'; return; }
    box.style.display = '';
    box.innerHTML = cats.map(c =>
      `<button class="chip ${this.filters.cat === c ? 'active' : ''}" data-cat="${c}">${I18N.t(c === 'todos' ? 'shop.catAll' : 'cat.' + c)}</button>`
    ).join('');
    box.querySelectorAll('.chip').forEach(btn => btn.onclick = () => {
      this.filters.cat = btn.dataset.cat;
      this.renderCats();
      this.renderGrid();
    });
  },

  visibleProducts() {
    let list = this.singles();
    if (this.filters.cat !== 'todos') list = list.filter(p => p.categories.includes(this.filters.cat));

    if (this.filters.q) {
      const q = this.filters.q;
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q));
    }
    if (this.filters.hideOut) list = list.filter(p => Store.productStatus(p) !== 'agotado');

    const s = this.filters.sort;
    const kindRank = k => SEED.kinds.indexOf(k);
    if (s === 'price-asc')  list.sort((a, b) => a.price - b.price);
    if (s === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (s === 'name')       list.sort((a, b) => a.name.localeCompare(b.name, I18N.lang));
    if (s === 'stock')      list.sort((a, b) => Store.productStock(b) - Store.productStock(a));
    if (s === 'rel')        list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || kindRank(a.kind) - kindRank(b.kind));
    return list;
  },

  renderGrid() {
    const grid = document.getElementById('shopGrid');
    if (!grid) return;
    const list = this.visibleProducts();
    const count = document.getElementById('shopResultCount');
    count.textContent = list.length
      ? I18N.t(list.length === 1 ? 'shop.results' : 'shop.resultsPlural', { n: list.length })
      : '';

    if (!list.length) {
      grid.innerHTML = `<div style="grid-column:1/-1">${UI.empty(
        I18N.t('shop.noResults'), I18N.t('shop.noResultsBody'),
        '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>')}</div>`;
      return;
    }

    grid.innerHTML = list.map(p => {
      const status = Store.productStatus(p);
      const total = Store.productStock(p);
      // Avisar solo si el producto está realmente por agotarse: que una talla
      // suelta esté baja es normal y, si se avisa siempre, el aviso deja de leerse.
      const sellable = p.variants.filter(v => Store.available(v) > 0).length;
      const scarce = total > 0 && (total <= p.minStock * 2 || (p.variants.length > 2 && sellable <= 2));

      const flags = [];
      if (status === 'agotado') flags.push(`<span class="badge badge-danger">${I18N.t('shop.badgeOut')}</span>`);
      else if (scarce) flags.push(`<span class="badge badge-warn">${I18N.t('shop.badgeScarce')}</span>`);

      const sizes = p.variants.length === 1 && p.variants[0].size === 'U'
        ? I18N.t('size.one')
        : p.variants.map(v => `<span class="sz ${Store.available(v) > 0 ? '' : 'off'}">${UI.esc(v.size)}</span>`).join('');

      return `
        <article class="p-card" data-id="${p.id}" tabindex="0" role="button" aria-label="${I18N.t('shop.viewProduct', { name: UI.esc(p.name) })}">
          <div class="p-media" style="background:${UI.mediaBg()}">
            ${UI.media(p)}
            <div class="p-flags">${flags.join('')}</div>
          </div>
          <div class="p-info">
            <div class="p-cat">${UI.esc(UI.catNames(p))}</div>
            <div class="p-name">${UI.esc(p.name)}</div>
            <div class="p-sizes">${sizes}</div>
            <div class="p-meta">
              <div class="p-price">${UI.money(p.price)}</div>
              <div class="p-stock">${total > 0
                ? `<span class="muted">${I18N.t('shop.availableCount', { n: total })}</span>`
                : `<span style="color:var(--danger-600);font-weight:600">${I18N.t('shop.noStock')}</span>`}</div>
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

  /** Aviso dentro de una pieza suelta cuando la tienda exige el kit y el cliente no lo tiene. */
  gateNoteHTML() {
    const g = Store.kitGate();
    if (!g.required || g.ok) return '';
    return `
      <div class="alert alert-warn" style="margin-bottom:var(--s5)">
        ${UI.infoIcon()}
        <div>
          <div class="alert-title">${I18N.t('gate.noteTitle')}</div>
          <div class="alert-body">${I18N.t(Store.session ? 'gate.noteBodyKnown' : 'gate.noteBody')}</div>
        </div>
      </div>`;
  },

  /* ---------- Detalle de una pieza suelta ---------- */
  openProduct(id) {
    const p = Store.product(id);
    if (!p) return;
    if (Store.isKit(p)) return this.openKit(id);
    const only = p.variants.length === 1 ? p.variants[0] : null;
    this.sel = { productId: id, size: only ? only.size : null, qty: 1 };
    UI.modal(this.productHTML(p), 'wide');
    this.bindProduct();
  },

  productHTML(p) {
    const selVar = p.variants.find(v => v.size === this.sel.size);
    const avail = selVar ? this.free(selVar) : 0;
    const oneSize = p.variants.length === 1 && p.variants[0].size === 'U';

    let availText = `<span class="muted tiny">${I18N.t('shop.pickSize')}</span>`;
    if (selVar) {
      if (avail <= 0) availText = `<span class="badge badge-danger">${I18N.t(oneSize ? 'shop.badgeOut' : 'shop.outSize')}</span>`;
      else if (avail <= p.minStock) availText = `<span class="badge badge-warn">${I18N.t('shop.lowSize', { n: avail })}</span>`;
      else availText = `<span class="badge badge-ok">${I18N.t('shop.okSize', { n: avail })}</span>`;
    }

    return `
      <div class="modal-head">
        <div>
          <div class="p-cat">${UI.esc(UI.catNames(p))}${UI.lineName(p) ? ' · ' + UI.esc(UI.lineName(p)) : ''}</div>
          <h2 style="margin-top:3px">${UI.esc(p.name)}</h2>
        </div>
        ${UI.closeBtn()}
      </div>

      <div class="modal-body">
        <div class="pd-grid">
          <div>
            <div class="pd-media" style="background:${UI.mediaBg()}">${UI.media(p)}</div>
            <div class="mono tiny muted" style="margin-top:10px">${I18N.t('shop.skuBase', { sku: UI.esc(selVar ? selVar.sku : p.sku) })}</div>
          </div>

          <div>
            <div class="pd-price">${UI.money(p.price)} <span class="tax-note">+ ${I18N.t('shop.plusTax', { tax: UI.pct(this.store.taxRate) })}</span></div>
            ${p.description ? `<p class="pd-desc">${UI.esc(p.description)}</p>` : ''}
            ${p.provisional ? `<p class="tiny muted" style="margin-top:8px">${I18N.t('shop.provisional')}</p>` : ''}

            <div style="height:1px;background:var(--border);margin:20px 0"></div>
            ${this.gateNoteHTML()}

            ${oneSize ? '' : `
            <div class="opt-group">
              <div class="opt-label">
                <span>${I18N.t('shop.size')}</span>
                <span class="opt-aside">${I18N.t('shop.liveStock')}</span>
              </div>
              <div class="size-row">
                ${p.variants.map(v => {
                  const a = this.free(v);
                  return `<button class="size-btn ${this.sel.size === v.size ? 'sel' : ''} ${a <= 0 ? 'out' : ''} ${a > 0 && a <= p.minStock ? 'low' : ''}"
                            data-size="${UI.esc(v.size)}" ${a <= 0 ? 'disabled' : ''}
                            title="${UI.esc(UI.sizeTitle(v.size))} · ${a <= 0 ? I18N.t('shop.soldOutTitle') : I18N.t('shop.availableCount', { n: a })}">
                            <span>${UI.esc(v.size)}</span><span class="s-qty">${a}</span>
                          </button>`;
                }).join('')}
              </div>
              <div class="hint">${I18N.t('shop.sizeLegend')}</div>
            </div>`}
            <div style="margin:-6px 0 var(--s5)">${availText}</div>

            <div class="opt-group">
              <div class="opt-label">${I18N.t('shop.quantity')}</div>
              <div class="qty-stepper">
                <button id="qMinus" aria-label="${I18N.t('cart.decrease')}">−</button>
                <input id="qInput" type="text" inputmode="numeric" value="${this.sel.qty}" aria-label="${I18N.t('shop.quantity')}">
                <button id="qPlus" aria-label="${I18N.t('cart.increase')}">+</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-foot">
        <button class="btn" onclick="UI.closeModal()">${I18N.t('shop.keepShopping')}</button>
        <button class="btn btn-gold" id="addCart" ${(!selVar || avail <= 0) ? 'disabled' : ''}>
          ${!selVar ? I18N.t('shop.pickSizeBtn') : (avail <= 0 ? I18N.t('shop.soldOutBtn') : I18N.t('shop.addToCart', { price: UI.money(p.price * this.sel.qty) }))}
        </button>
      </div>`;
  },

  refreshProduct() {
    const p = Store.product(this.sel.productId);
    UI.rerenderModal(this.productHTML(p));
    this.bindProduct();
  },

  bindProduct() {
    const p = Store.product(this.sel.productId);
    const box = document.getElementById('modalBox');
    const current = () => p.variants.find(x => x.size === this.sel.size);
    const maxFor = () => { const v = current(); return v ? this.free(v) : 1; };

    box.querySelectorAll('.size-btn:not(.out)').forEach(b => b.onclick = () => {
      this.sel.size = b.dataset.size;
      this.sel.qty = 1;
      this.refreshProduct();
    });

    document.getElementById('qMinus').onclick = () => {
      if (this.sel.qty > 1) { this.sel.qty--; this.refreshProduct(); }
    };
    document.getElementById('qPlus').onclick = () => {
      if (this.sel.qty < maxFor()) { this.sel.qty++; this.refreshProduct(); }
      else UI.toast('warn', I18N.t('shop.limitReached'), I18N.t('shop.limitReachedBody'));
    };
    const input = document.getElementById('qInput');
    input.onchange = () => {
      this.sel.qty = Math.max(1, Math.min(Math.max(1, maxFor()), parseInt(input.value) || 1));
      this.refreshProduct();
    };

    document.getElementById('addCart').onclick = () => {
      const v = current();
      if (!v) return;
      const r = Store.addItem(p.id, v.id, this.sel.qty);
      if (!r.ok) { UI.toast('danger', I18N.t('shop.notFoundTitle'), r.error); return; }
      UI.closeModal();
      this.afterAdd(I18N.t('shop.addedBody', { qty: this.sel.qty, name: p.name, variant: UI.sizeLabel(v.size) }));
    };
  },

  afterAdd(msg) {
    this.renderGrid();
    this.renderKits();
    this.renderCart();
    this.bumpCart();
    UI.toast('ok', I18N.t('shop.addedTitle'), msg);
    this.openCart();
  },

  /* ---------- Configurador de kit: una talla por pieza ---------- */
  openKit(id) {
    const p = Store.product(id);
    if (!p) return;
    const sizes = {};
    Store.kitParts(p).forEach(x => {
      if (x.product.variants.length === 1) sizes[x.product.id] = x.product.variants[0].size;
    });
    this.kit = { productId: id, sizes, player: '', img: null };
    UI.modal(this.kitHTML(p), 'wide');
    this.bindKit();
  },

  /** Tallas de ropa que ofrece el kit (las medias tienen su propia escala). */
  kitMainSizes(p) {
    const set = new Set();
    Store.kitParts(p).forEach(x => {
      if (x.product.kind === 'socks') return;
      x.product.variants.forEach(v => { if (v.size !== 'U') set.add(v.size); });
    });
    return Store.sortSizes([...set]);
  },

  kitRows(p) {
    return Store.kitParts(p).map(x => {
      const size = this.kit.sizes[x.product.id] || '';
      const v = size ? x.product.variants.find(k => k.size === size) : null;
      const free = v ? this.free(v) : 0;
      return { product: x.product, qty: x.qty, size, variant: v, free, ok: !!v && free >= x.qty };
    });
  },

  kitHTML(p) {
    const rows = this.kitRows(p);
    const ready = rows.every(r => r.ok);
    const missing = rows.filter(r => !r.size).length;
    const short = rows.filter(r => r.size && !r.ok);
    const save = Store.kitSavings(p);
    const gallery = p.images && p.images.length > 1 ? p.images : [];
    const mains = this.kitMainSizes(p);
    const st = this.store;
    // Talla común a toda la ropa del kit (si la hay), para marcarla en el atajo.
    const apparel = rows.filter(r => r.product.kind !== 'socks' && r.product.variants.length > 1);
    const common = apparel.length && apparel.every(r => r.size && r.size === apparel[0].size) ? apparel[0].size : null;

    return `
      <div class="modal-head">
        <div>
          <div class="p-cat">${UI.esc(UI.catNames(p))}${UI.lineName(p) ? ' · ' + UI.esc(UI.lineName(p)) : ''}</div>
          <h2 style="margin-top:3px">${UI.esc(p.name)}</h2>
        </div>
        ${UI.closeBtn()}
      </div>

      <div class="modal-body">
        <div class="pd-grid">
          <div>
            <div class="pd-media" style="background:${UI.mediaBg()}">${UI.media(p, this.kit.img)}</div>
            ${gallery.length ? `<div class="pd-thumbs">
              ${gallery.map(src => `<button class="pd-thumb ${(this.kit.img || p.image) === src ? 'sel' : ''}" data-img="${UI.esc(src)}"><img src="${UI.esc(src)}" alt="" loading="lazy"></button>`).join('')}
            </div>` : ''}
            <div class="mono tiny muted" style="margin-top:10px">${I18N.t('shop.skuBase', { sku: UI.esc(p.sku) })}</div>
          </div>

          <div>
            <div class="pd-price">${UI.money(p.price)}
              ${save ? `<span class="was">${UI.money(Store.kitListPrice(p))}</span>` : ''}
              <span class="tax-note">+ ${I18N.t('shop.plusTax', { tax: UI.pct(st.taxRate) })}</span>
            </div>
            ${save ? `<div class="kit-save" style="margin-top:4px">${I18N.t('shop.kitSaveLong', { amount: UI.money(save) })}</div>` : ''}
            ${p.description ? `<p class="pd-desc">${UI.esc(p.description)}</p>` : ''}

            <div style="height:1px;background:var(--border);margin:18px 0"></div>

            <div class="field">
              <label for="kitPlayer">${I18N.t('kit.player')}</label>
              <input class="input" id="kitPlayer" value="${UI.esc(this.kit.player)}" placeholder="${I18N.t('kit.playerPh')}" autocomplete="off">
              <div class="hint">${I18N.t('kit.playerHint')}</div>
            </div>

            ${mains.length ? `
            <div class="opt-group">
              <div class="opt-label"><span>${I18N.t('kit.quick')}</span><span class="opt-aside">${I18N.t('kit.quickAside')}</span></div>
              <div class="size-row">
                ${mains.map(s => `<button class="size-btn compact ${common === s ? 'sel' : ''}" data-quick="${s}" title="${UI.esc(UI.sizeTitle(s))}">${s}</button>`).join('')}
              </div>
            </div>` : ''}

            <div class="opt-label"><span>${I18N.t('kit.contents')}</span><span class="opt-aside">${I18N.t('shop.liveStock')}</span></div>
            <div class="kit-rows">
              ${rows.map(r => {
                const one = r.product.variants.length === 1 && r.product.variants[0].size === 'U';
                return `
                <div class="kit-row ${r.size && !r.ok ? 'bad' : ''}">
                  <div class="thumb thumb-media">${UI.media(r.product)}</div>
                  <div class="kit-row-name"><span class="q">${r.qty}×</span> ${UI.esc(r.product.name)}</div>
                  ${one
                    ? `<span class="muted tiny">${I18N.t('size.one')}${r.free < r.qty ? ' · ' + I18N.t('shop.badgeOut') : ''}</span>`
                    : `<select class="select" data-comp="${r.product.id}" aria-label="${I18N.t('shop.size')} — ${UI.esc(r.product.name)}">
                        <option value="">${I18N.t('kit.pick')}</option>
                        ${r.product.variants.map(v => {
                          const a = this.free(v);
                          const tail = a < r.qty ? ' — ' + I18N.t('shop.soldOutTitle') : (a <= r.product.minStock ? ' — ' + I18N.t('kit.left', { n: a }) : '');
                          return `<option value="${v.size}"${r.size === v.size ? ' selected' : ''}${a < r.qty && r.size !== v.size ? ' disabled' : ''}>${v.size}${tail}</option>`;
                        }).join('')}
                      </select>`}
                </div>`;
              }).join('')}
            </div>
            ${short.length ? `<div class="err-msg show" style="margin-top:10px">${I18N.t('kit.shortMsg', { list: short.map(r => UI.esc(r.product.name) + ' ' + r.size).join(', ') })}</div>` : ''}
          </div>
        </div>
      </div>

      <div class="modal-foot">
        <button class="btn" onclick="UI.closeModal()">${I18N.t('shop.keepShopping')}</button>
        <button class="btn btn-gold" id="addKit" ${ready ? '' : 'disabled'}>
          ${ready ? I18N.t('kit.add', { price: UI.money(p.price) })
                  : (missing ? I18N.t(missing === 1 ? 'kit.missingOne' : 'kit.missing', { n: missing }) : I18N.t('kit.unavailable'))}
        </button>
      </div>`;
  },

  refreshKit() {
    const p = Store.product(this.kit.productId);
    UI.rerenderModal(this.kitHTML(p));
    this.bindKit();
  },

  bindKit() {
    const p = Store.product(this.kit.productId);
    const box = document.getElementById('modalBox');

    const player = document.getElementById('kitPlayer');
    player.oninput = () => { this.kit.player = player.value; };

    box.querySelectorAll('[data-img]').forEach(b => b.onclick = () => { this.kit.img = b.dataset.img; this.refreshKit(); });

    // Una talla para todo: se aplica a cada pieza que la tenga; las medias toman su equivalente.
    box.querySelectorAll('[data-quick]').forEach(b => b.onclick = () => {
      const s = b.dataset.quick;
      Store.kitParts(p).forEach(x => {
        const sizes = x.product.variants.map(v => v.size);
        if (sizes.length === 1) return;
        const want = x.product.kind === 'socks' ? SEED.sockFor[s] : s;
        if (sizes.includes(want)) this.kit.sizes[x.product.id] = want;
      });
      this.refreshKit();
    });

    box.querySelectorAll('[data-comp]').forEach(sel => sel.onchange = () => {
      this.kit.sizes[sel.dataset.comp] = sel.value;
      this.refreshKit();
    });

    document.getElementById('addKit').onclick = () => {
      const rows = this.kitRows(p);
      const r = Store.addKit(p.id, rows.map(x => ({ productId: x.product.id, variantId: x.variant && x.variant.id })), 1, this.kit.player);
      if (!r.ok) { UI.toast('danger', I18N.t('shop.notFoundTitle'), r.error); return; }
      UI.closeModal();
      this.afterAdd(this.kit.player ? I18N.t('kit.addedFor', { name: p.name, player: this.kit.player }) : p.name);
    };
  },

  /* ============================================================
     CARRITO
     ============================================================ */
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

  gateBannerHTML() {
    const g = Store.kitGate();
    if (!g.required || g.ok || !Store.cart.length) return '';
    return `
      <div class="alert alert-warn gate-banner">
        ${UI.infoIcon()}
        <div style="flex:1">
          <div class="alert-title">${I18N.t('gate.title')}</div>
          <div class="alert-body">${I18N.t(Store.session ? 'gate.bodyKnown' : 'gate.body')}</div>
          <div class="gate-actions">
            <button class="btn btn-sm btn-primary" id="gateKit">${I18N.t('gate.addKit')}</button>
            ${Store.session ? '' : `<button class="btn btn-sm" id="gateSign">${I18N.t('gate.signIn')}</button>`}
          </div>
        </div>
      </div>`;
  },

  renderCart() {
    document.getElementById('cartCount').textContent = Store.cartCount();
    document.getElementById('cartStoreName').textContent = this.store.name;

    const body = document.getElementById('cartBody');
    const foot = document.getElementById('cartFoot');
    const cart = Store.cart;
    const scrollTop = body.scrollTop;   // se conserva al cambiar cantidades
    requestAnimationFrame(() => { body.scrollTop = scrollTop; });

    if (!cart.length) {
      body.innerHTML = UI.empty(
        I18N.t('cart.empty'), I18N.t('cart.emptyBody'),
        '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>');
      foot.innerHTML = `<button class="btn btn-block" onclick="Shop.closeCart()">${I18N.t('cart.keepShopping')}</button>`;
      return;
    }

    const stepper = l => `
      <div class="qty-stepper sm">
        <button data-dec="${l.lineId}" aria-label="${I18N.t('cart.decrease')}">−</button>
        <input value="${l.qty}" readonly aria-label="${I18N.t('shop.quantity')}">
        <button data-inc="${l.lineId}" aria-label="${I18N.t('cart.increase')}">+</button>
      </div>`;
    const trash = l => `
      <button class="icon-btn" data-del="${l.lineId}" aria-label="${I18N.t('cart.remove')}" style="width:26px;height:26px">
        <svg style="width:14px;height:14px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
      </button>`;

    body.innerHTML = this.gateBannerHTML() + cart.map(l => {
      const p = Store.product(l.productId) || { kind: 'jersey', name: l.name };
      const detail = l.kind === 'kit'
        ? `<div class="cart-variant">${l.player ? UI.esc(l.player) + ' · ' : ''}${I18N.t('cart.kitLine')}</div>
           <ul class="cart-comps">${l.components.map(c => `<li>${c.qty > 1 ? c.qty + '× ' : ''}${UI.esc(c.name)} <b>${UI.esc(UI.sizeLabel(c.size))}</b></li>`).join('')}</ul>`
        : `<div class="cart-variant">${I18N.t('shop.size')} ${UI.esc(UI.sizeLabel(l.size))} · <span class="mono">${UI.esc(l.sku)}</span></div>`;
      return `
        <div class="cart-line">
          <div class="cart-thumb" style="background:${UI.mediaBg()}">${UI.media(p)}</div>
          <div class="cart-info">
            <div class="cart-name">${UI.esc(l.name)}</div>
            ${detail}
            <div class="cart-line-foot">
              ${stepper(l)}
              <div style="display:flex;align-items:center;gap:10px"><strong>${UI.money(l.price * l.qty)}</strong>${trash(l)}</div>
            </div>
          </div>
        </div>`;
    }).join('');

    const t = Store.cartTotals('pickup');
    const gate = Store.kitGate();
    foot.innerHTML = `
      <div class="sum-row"><span class="muted">${I18N.t('cart.subtotal')}</span><span>${UI.money(t.subtotal)}</span></div>
      ${t.savings ? `<div class="sum-row"><span class="muted">${I18N.t('cart.kitSavings')}</span><span style="color:var(--ok-600);font-weight:600">−${UI.money(t.savings)}</span></div>` : ''}
      <div class="sum-row"><span class="muted">${I18N.t('cart.tax', { tax: UI.pct(t.taxRate) })}</span><span>${UI.money(t.tax)}</span></div>
      <div class="sum-row"><span class="muted">${I18N.t('cart.shipping')}</span><span class="muted tiny">${I18N.t('cart.shippingLater')}</span></div>
      <div class="sum-row total"><span>${I18N.t('cart.total')}</span><span>${UI.money(t.total)}</span></div>
      <button class="btn btn-gold btn-block btn-lg" style="margin-top:14px" id="goCheckout">${I18N.t(gate.required && !gate.ok ? 'gate.checkoutBlocked' : 'cart.checkout')}</button>
      <button class="btn btn-ghost btn-block btn-sm" style="margin-top:6px" onclick="Shop.closeCart()">${I18N.t('cart.keepShopping')}</button>`;

    body.querySelectorAll('[data-inc]').forEach(b => b.onclick = () => {
      const line = Store.cart.find(l => l.lineId === b.dataset.inc);
      const r = Store.updateLineQty(line.lineId, line.qty + 1);
      if (!r.ok && r.error) UI.toast('warn', I18N.t('shop.limitReached'), r.error);
      this.afterCartChange();
    });
    body.querySelectorAll('[data-dec]').forEach(b => b.onclick = () => {
      const line = Store.cart.find(l => l.lineId === b.dataset.dec);
      Store.updateLineQty(line.lineId, line.qty - 1);
      this.afterCartChange();
    });
    body.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      Store.removeLine(b.dataset.del);
      this.afterCartChange();
      UI.toast('info', I18N.t('cart.removedTitle'), I18N.t('cart.removedBody'));
    });

    const gk = document.getElementById('gateKit');
    if (gk) gk.onclick = () => this.goToKit();
    const gs = document.getElementById('gateSign');
    if (gs) gs.onclick = () => { this.closeCart(); this.accountForm(); };

    document.getElementById('goCheckout').onclick = () => this.checkout();
  },

  afterCartChange() {
    this.renderCart();
    this.renderGrid();
    this.renderKits();
  },

  goToKit() {
    this.closeCart();
    const kits = this.kits();
    if (kits.length === 1) return this.openKit(kits[0].id);
    const el = document.getElementById('shopKits');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  /* ============================================================
     CHECKOUT — datos → entrega → pago → confirmación
     ============================================================ */
  checkout() {
    if (!Store.cart.length) { UI.toast('warn', I18N.t('cart.emptyWarnTitle'), I18N.t('cart.emptyWarnBody')); return; }

    // Regla del kit: sin kit propio ni en el carrito no se llega al pago.
    const gate = Store.kitGate();
    if (gate.required && !gate.ok) {
      if (!Store.session) {
        this.closeCart();
        UI.toast('warn', I18N.t('gate.title'), I18N.t('gate.toastSignIn'));
        return this.accountForm('checkout');
      }
      this.openCart();
      UI.toast('warn', I18N.t('gate.title'), I18N.t('gate.bodyKnown'));
      return;
    }

    const st = this.store;
    const c = Store.session;
    // Lo ya escrito se conserva si el formulario se cierra y se vuelve a abrir.
    if (!this.form || this.form.store !== st.id) this.form = { store: st.id };
    const f = this.form;
    if (!f.email && c) f.email = c.email;
    if (!f.name && c) f.name = c.name;
    if (!f.phone && c && c.phone !== '—') f.phone = c.phone;
    if (!st[this.fulfill]) this.fulfill = st.pickup ? 'pickup' : 'shipping';
    this.closeCart();
    UI.modal(this.checkoutHTML(), '');
    this.bindCheckout();
  },

  pickupLabel() {
    const id = this.store.id;
    return I18N.t('fulfill.pickup.' + (I18N.has('fulfill.pickup.' + id) ? id : 'generic'));
  },

  summaryHTML() {
    const t = Store.cartTotals(this.fulfill);
    return `
      <div style="font-weight:640;margin-bottom:10px">${I18N.t('checkout.orderSummary')}</div>
      ${Store.cart.map(l => `
        <div class="row"><span>${UI.esc(l.name)}${l.kind === 'kit' ? (l.player ? ' · ' + UI.esc(l.player) : '') : ' · ' + UI.esc(UI.sizeLabel(l.size))} × ${l.qty}</span><b>${UI.money(l.price * l.qty)}</b></div>
        ${l.kind === 'kit' ? `<div class="row sub"><span>${l.components.map(c => UI.esc(c.name) + ' ' + UI.esc(UI.sizeLabel(c.size))).join(' · ')}</span></div>` : ''}
      `).join('')}
      <div style="height:1px;background:#3a3f4a;margin:10px 0"></div>
      <div class="row"><span>${I18N.t('cart.subtotal')}</span><b>${UI.money(t.subtotal)}</b></div>
      <div class="row"><span>${I18N.t('cart.tax', { tax: UI.pct(t.taxRate) })}</span><b>${UI.money(t.tax)}</b></div>
      <div class="row"><span>${I18N.t(this.fulfill === 'shipping' ? 'fulfill.shipping' : 'cart.shipping')}</span><b>${this.fulfill === 'shipping' ? UI.money(t.shipping) : I18N.t('fulfill.noShipping')}</b></div>
      <div class="row" style="font-size:16px;margin-top:8px"><span style="color:#fff">${I18N.t('cart.total')}</span><b style="color:var(--gold-400)">${UI.money(t.total)}</b></div>`;
  },

  checkoutHTML() {
    const st = this.store;
    const t = Store.cartTotals(this.fulfill);
    const f = this.form;
    const opt = (val, title, sub, price) => `
      <label class="fulfill-opt ${this.fulfill === val ? 'sel' : ''}">
        <input type="radio" name="ckFulfill" value="${val}" ${this.fulfill === val ? 'checked' : ''}>
        <span class="fo-text"><span class="fo-title">${title}</span><span class="fo-sub">${sub}</span></span>
        <span class="fo-price">${price}</span>
      </label>`;

    return `
      <div class="modal-head">
        <div>
          <h2>${I18N.t('checkout.title')}</h2>
          <p class="muted tiny" style="margin-top:2px">${UI.esc(st.name)}</p>
        </div>
        ${UI.closeBtn()}
      </div>

      <div class="modal-body">
        <div class="steps">
          <div class="step active"><span class="n">1</span> ${I18N.t('checkout.step1')}</div>
          <div class="step-line"></div>
          <div class="step"><span class="n">2</span> ${I18N.t('checkout.step2')}</div>
          <div class="step-line"></div>
          <div class="step"><span class="n">3</span> ${I18N.t('checkout.step3')}</div>
        </div>

        <div class="demo-banner">${UI.infoIcon()} ${I18N.t('checkout.demoNote')}</div>

        <form id="checkoutForm" novalidate>
          <h3 class="form-h">${I18N.t('checkout.contact')}</h3>
          <div class="form-grid">
            <div class="field span-2">
              <label for="ckEmail">${I18N.t('checkout.email')} <span class="req">*</span></label>
              <input class="input" id="ckEmail" type="email" value="${UI.esc(f.email || '')}" placeholder="name@email.com" autocomplete="email" ${f.email ? '' : 'data-autofocus'}>
              <div class="hint">${I18N.t(st.kitRequired ? 'checkout.emailHintKit' : 'checkout.emailHint')}</div>
              <div class="err-msg" id="errEmail">${I18N.t('checkout.emailErr')}</div>
            </div>
            <div class="field">
              <label for="ckName">${I18N.t('checkout.fullName')} <span class="req">*</span></label>
              <input class="input" id="ckName" value="${UI.esc(f.name || '')}" autocomplete="name">
              <div class="err-msg" id="errName">${I18N.t('checkout.fullNameErr')}</div>
            </div>
            <div class="field">
              <label for="ckPhone">${I18N.t('checkout.phone')}</label>
              <input class="input" id="ckPhone" value="${UI.esc(f.phone || '')}" placeholder="(305) 555-0100" autocomplete="tel">
            </div>
          </div>

          <h3 class="form-h">${I18N.t('checkout.delivery')}</h3>
          <div class="fulfill-opts">
            ${st.pickup ? opt('pickup', this.pickupLabel(), I18N.t('fulfill.pickupSub'), I18N.t('cart.free')) : ''}
            ${st.shipping ? opt('shipping', I18N.t('fulfill.shipping'), I18N.t('fulfill.shippingSub'), UI.money(st.shippingFlat)) : ''}
          </div>

          <div id="ckAddress" style="${this.fulfill === 'shipping' ? '' : 'display:none'}">
            <div class="form-grid">
              <div class="field span-2">
                <label for="ckAddr">${I18N.t('checkout.address')} <span class="req">*</span></label>
                <input class="input" id="ckAddr" value="${UI.esc(f.addr || '')}" placeholder="${I18N.t('checkout.addressPh')}" autocomplete="street-address">
                <div class="err-msg" id="errAddr">${I18N.t('checkout.addressErr')}</div>
              </div>
              <div class="field">
                <label for="ckCity">${I18N.t('checkout.city')} <span class="req">*</span></label>
                <input class="input" id="ckCity" value="${UI.esc(f.city || '')}" autocomplete="address-level2">
                <div class="err-msg" id="errCity">${I18N.t('checkout.cityErr')}</div>
              </div>
              <div class="form-grid tight">
                <div class="field">
                  <label for="ckState">${I18N.t('checkout.state')}</label>
                  <input class="input" id="ckState" value="${UI.esc(f.state || 'FL')}" maxlength="2" autocomplete="address-level1" style="text-transform:uppercase">
                </div>
                <div class="field">
                  <label for="ckZip">${I18N.t('checkout.zip')} <span class="req">*</span></label>
                  <input class="input" id="ckZip" value="${UI.esc(f.zip || '')}" inputmode="numeric" placeholder="33131" autocomplete="postal-code">
                  <div class="err-msg" id="errZip">${I18N.t('checkout.zipErr')}</div>
                </div>
              </div>
            </div>
          </div>

          <h3 class="form-h">${I18N.t('checkout.paymentMethod')}</h3>
          <div class="pay-method">
            <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
            <div>
              <div class="pm-title">${I18N.t('checkout.cardOption')}</div>
              <div class="pm-sub">${I18N.t('checkout.tokenizeNote')}</div>
            </div>
          </div>
          <p class="tiny muted" style="margin:8px 0 16px">${I18N.t('checkout.noCash')}</p>

          <div class="pay-card" id="ckSummary">${this.summaryHTML()}</div>
        </form>
      </div>

      <div class="modal-foot">
        <button class="btn" onclick="UI.closeModal();Shop.openCart()">${I18N.t('checkout.backToCart')}</button>
        <button class="btn btn-gold" id="payNow">${I18N.t('checkout.pay', { amount: UI.money(t.total) })}</button>
      </div>`;
  },

  bindCheckout() {
    const val = id => document.getElementById(id).value.trim();

    const form = document.getElementById('checkoutForm');
    // Borrador: lo escrito sobrevive a un cierre accidental del formulario.
    form.addEventListener('input', () => Object.assign(this.form, {
      email: val('ckEmail'), name: val('ckName'), phone: val('ckPhone'),
      addr: val('ckAddr'), city: val('ckCity'), state: val('ckState'), zip: val('ckZip')
    }));
    // Enter en cualquier campo equivale a pulsar Pagar.
    form.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'radio') {
        e.preventDefault();
        document.getElementById('payNow').click();
      }
    });

    document.querySelectorAll('input[name="ckFulfill"]').forEach(r => r.onchange = () => {
      this.fulfill = r.value;
      document.querySelectorAll('.fulfill-opt').forEach(o => o.classList.toggle('sel', o.querySelector('input').checked));
      document.getElementById('ckAddress').style.display = this.fulfill === 'shipping' ? '' : 'none';
      document.getElementById('ckSummary').innerHTML = this.summaryHTML();
      document.getElementById('payNow').textContent = I18N.t('checkout.pay', { amount: UI.money(Store.cartTotals(this.fulfill).total) });
    });

    document.getElementById('payNow').onclick = () => {
      const name = val('ckName'), email = val('ckEmail');
      const ship = this.fulfill === 'shipping';

      let bad = false;
      const mark = (inputId, errId, cond) => {
        const i = document.getElementById(inputId), e = document.getElementById(errId);
        if (cond) { i.classList.add('error'); e.classList.add('show'); bad = true; }
        else { i.classList.remove('error'); e.classList.remove('show'); }
      };
      mark('ckName',  'errName',  !name);
      mark('ckEmail', 'errEmail', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
      if (ship) {
        mark('ckAddr', 'errAddr', !val('ckAddr'));
        mark('ckCity', 'errCity', !val('ckCity'));
        mark('ckZip',  'errZip',  !/^\d{5}(-\d{4})?$/.test(val('ckZip')));
      }
      if (bad) { UI.toast('danger', I18N.t('checkout.formErrTitle'), I18N.t('checkout.formErrBody')); return; }

      // El kit se comprueba contra el correo con el que realmente se paga.
      if (!Store.kitGate(email).ok) {
        UI.toast('warn', I18N.t('gate.title'), I18N.t('gate.emailNoKit', { email }));
        const i = document.getElementById('ckEmail');
        i.classList.add('error');
        i.focus();
        return;
      }

      this.processPayment({
        name, email, phone: val('ckPhone'),
        fulfillment: this.fulfill,
        address: ship ? { line: val('ckAddr'), city: val('ckCity'), state: val('ckState').toUpperCase(), zip: val('ckZip') } : null,
        paymentMethod: 'Stripe · Visa ···4242'
      });
    };
  },

  /** Simula la secuencia real: autorización → webhook → pedido → inventario. */
  processPayment(data) {
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
    setTimeout(() => on('ps1'), 450);
    setTimeout(() => on('ps2'), 950);
    setTimeout(() => on('ps3'), 1400);
    setTimeout(() => on('ps4'), 1850);

    setTimeout(() => {
      const r = Store.placeOrder(data);
      if (!r.ok) {
        UI.modal(`
          <div class="modal-head"><h2>${I18N.t('pay.failedTitle')}</h2></div>
          <div class="modal-body">
            <div class="alert alert-danger">
              <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              <div><div class="alert-title">${I18N.t('pay.failedHead')}</div><div class="alert-body">${UI.esc(r.error)}</div></div>
            </div>
            <p class="muted" style="font-size:13px;line-height:1.6">${I18N.t(r.code === 'kit' ? 'pay.failedNoteKit' : 'pay.failedNote')}</p>
          </div>
          <div class="modal-foot">
            <button class="btn btn-primary" onclick="UI.closeModal();Shop.openCart()">${I18N.t('pay.reviewCart')}</button>
          </div>`, 'narrow');
        UI.toast('danger', I18N.t('pay.blockedToast'), r.error);
        return;
      }

      this.form = null;
      this.successHTML(r);
      this.render();
      this.renderCart();
      if (typeof Admin !== 'undefined') Admin.refresh();
      // Al cliente no se le habla de inventario: eso es información interna.
      UI.toast('ok', I18N.t('pay.confirmedTitle'), App.storefront ? r.order.number : I18N.t('pay.confirmedToast', { number: r.order.number }));
    }, 2350);
  },

  successHTML(r) {
    const o = r.order;
    const pickup = o.fulfillment === 'pickup';
    const a = o.address;
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
          <div class="r-row"><span class="muted">${I18N.t('confirm.store')}</span><b>${UI.esc(UI.storeName(o.storeId))}</b></div>
          <div class="r-row"><span class="muted">${I18N.t('confirm.date')}</span><b>${UI.date(o.date, true)}</b></div>
          <div class="r-row"><span class="muted">${I18N.t('confirm.delivery')}</span><b style="text-align:right">${pickup ? this.pickupLabel() : UI.esc([a.line, a.city, a.state + ' ' + a.zip].join(', '))}</b></div>
          <div class="r-row"><span class="muted">${I18N.t('confirm.paymentMethod')}</span><b>${UI.esc(o.paymentMethod)}</b></div>
          <div style="height:1px;background:var(--border-strong);margin:8px 0"></div>
          ${o.items.map(i => `
            <div class="r-row"><span>${UI.esc(i.name)}${i.kind === 'kit' ? (i.player ? ' · ' + UI.esc(i.player) : '') : ' · ' + UI.esc(UI.sizeLabel(i.size))} × ${i.qty}</span><b>${UI.money(i.price * i.qty)}</b></div>
            ${i.kind === 'kit' ? `<div class="r-row sub"><span>${i.components.map(c => UI.esc(c.name) + ' ' + UI.esc(UI.sizeLabel(c.size))).join(' · ')}</span></div>` : ''}`).join('')}
          <div style="height:1px;background:var(--border-strong);margin:8px 0"></div>
          <div class="r-row"><span class="muted">${I18N.t('cart.subtotal')}</span><b>${UI.money(o.subtotal)}</b></div>
          <div class="r-row"><span class="muted">${I18N.t('cart.tax', { tax: UI.pct(o.taxRate) })}</span><b>${UI.money(o.tax)}</b></div>
          ${o.shipping ? `<div class="r-row"><span class="muted">${I18N.t('fulfill.shipping')}</span><b>${UI.money(o.shipping)}</b></div>` : ''}
          <div class="r-row" style="font-size:15px;margin-top:6px"><span><b>${I18N.t('confirm.total')}</b></span><b>${UI.money(o.total)}</b></div>
        </div>

        <p class="tiny muted" style="line-height:1.6">${I18N.t(pickup ? 'confirm.pickupNote' : 'confirm.shipNote')}</p>

        ${App.storefront ? '' : `
        <div class="trace">
          <div class="trace-title">
            <svg style="width:13px;height:13px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
            ${I18N.t('confirm.traceTitle')}
          </div>
          ${r.trace.map(m => `
            <div class="trace-line">
              <span>${UI.esc(m.product)}<br><span class="muted tiny">${UI.esc(UI.sizeLabel(m.variant))} · ${UI.esc(m.sku)}</span></span>
              <span class="nowrap"><span class="mono muted">${m.before}</span> → <b class="mono">${m.after}</b> <span class="trace-delta">(−${m.qty})</span></span>
            </div>`).join('')}
        </div>
        <p class="tiny muted" style="margin-top:12px;line-height:1.6">${I18N.t('confirm.traceFooter')}</p>`}
      </div>

      <div class="modal-foot">
        <button class="btn" onclick="UI.closeModal()">${I18N.t('cart.keepShopping')}</button>
        ${App.storefront ? '' : `<button class="btn btn-primary" id="seeOrder">${I18N.t('confirm.seeAdmin')}</button>`}
      </div>`, '');

    const see = document.getElementById('seeOrder');
    if (see) see.onclick = () => {
      UI.closeModal();
      App.setMode('admin');
      Admin.go('orders');
    };
  }
};
