/* ============================================================
   SOCCER CAGE — Panel administrativo
   Dashboard · Inventario · Productos · Movimientos · Entregas
   Pedidos · Envíos · Clientes · Tiendas · Alertas · Reportes · Configuración
   ============================================================ */

const Admin = {
  current: 'dashboard',
  f: {
    inv:  { q: '', raw: '', status: 'todos', store: 'todos', kind: 'todos' },
    prod: { q: '', raw: '', store: 'todos', type: 'todos', active: 'todos' },
    mov:  { q: '', raw: '', type: 'todos', reason: 'todos' },
    ord:  { q: '', raw: '', status: 'todos', store: 'todos' },
    cust: { q: '', raw: '' },
    del:  { q: '', raw: '', program: 'todos', status: 'todos' },
    ship: { sel: [] }
  },
  draft: null,

  init() {
    document.querySelectorAll('.side-link').forEach(btn => {
      btn.onclick = () => {
        this.go(btn.dataset.page);
        document.getElementById('sidebar').classList.remove('open');
      };
    });
    this.go('dashboard');
  },

  go(page) {
    this.current = page;
    document.querySelectorAll('.side-link').forEach(b =>
      b.classList.toggle('active', b.dataset.page === page));
    document.querySelectorAll('.page').forEach(p =>
      p.classList.toggle('active', p.id === 'page-' + page));
    this.renderPage(page);
    window.scrollTo({ top: 0 });
  },

  refresh() {
    this.renderPage(this.current);
    this.updateBadge();
  },

  updateBadge() {
    const m = Store.metrics();
    const set = (id, n) => {
      const b = document.getElementById(id);
      if (!b) return;
      b.textContent = n;
      b.style.display = n ? 'grid' : 'none';
    };
    set('alertBadge', m.alertCount);
    set('deliveryBadge', m.deliveriesPending);
    set('shipBadge', Store.pendingShipments().length);
  },

  renderPage(page) {
    const el = document.getElementById('page-' + page);
    if (!el || !this[page + 'HTML']) return;
    el.innerHTML = this[page + 'HTML']();
    if (this[page + 'Bind']) this[page + 'Bind']();
    this.updateBadge();
  },

  head(title, sub, actions) {
    return `<div class="page-head">
      <div><h1>${title}</h1><p class="sub">${sub}</p></div>
      <div class="head-actions">${actions || ''}</div>
    </div>`;
  },

  searchBox(id, f, ph) {
    return `<div class="search-box">
      <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      <input class="input" id="${id}" placeholder="${ph}" value="${UI.esc(f.raw)}">
    </div>`;
  },

  /** Búsqueda en vivo: repinta la página y devuelve el cursor a su sitio. */
  bindSearch(id, f, page) {
    const q = document.getElementById(id);
    if (!q) return;
    q.oninput = () => {
      f.raw = q.value;
      f.q = q.value.trim().toLowerCase();
      const pos = q.selectionStart;
      this.renderPage(page);
      const nq = document.getElementById(id);
      nq.focus();
      nq.setSelectionRange(pos, pos);
    };
  },

  bindSelect(id, f, key, page) {
    const el = document.getElementById(id);
    if (el) el.onchange = e => { f[key] = e.target.value; this.renderPage(page); };
  },

  storeOptions(sel, extra) {
    return `<option value="todos">${I18N.t('adm.common.allStores')}</option>` +
      Store.stores.map(s => `<option value="${s.id}"${sel === s.id ? ' selected' : ''}>${UI.esc(s.name)}</option>`).join('') +
      (extra ? `
        <option value="shared"${sel === 'shared' ? ' selected' : ''}>${I18N.t('adm.common.sharedStores')}</option>
        <option value="internal"${sel === 'internal' ? ' selected' : ''}>${I18N.t('adm.common.internalOnly')}</option>` : '');
  },

  matchStore(p, f) {
    if (f === 'todos') return true;
    if (f === 'internal') return !p.stores.length;
    if (f === 'shared') return p.stores.length > 1;
    return p.stores.includes(f);
  },

  customerOf(o) { return Store.customers.find(x => x.id === o.customerId); },

  /* ============================================================
     DASHBOARD
     ============================================================ */
  dashboardHTML() {
    const m = Store.metrics();
    const recent = Store.movements.slice(0, 8);
    const pending = Store.orders.filter(o => ['pendiente', 'procesando'].includes(o.status)).slice(0, 5);
    const maxQty = Math.max(1, ...m.topProducts.map(p => p.qty));
    const maxStore = Math.max(1, ...m.byStore.map(b => b.revenue));
    const activeStores = Store.stores.filter(s => s.active).length;
    const withKit = Store.customers.filter(c => Store.stores.some(s => Store.hasKit(c, s.id))).length;

    return this.head(
      I18N.t('adm.dashboard.title'),
      I18N.t('adm.dashboard.sub', { date: UI.date(new Date().toISOString()), company: UI.esc(Store.settings.company) }),
      `<button class="btn btn-sm" id="dashReset">${I18N.t('adm.dashboard.resetDemo')}</button>
       <button class="btn btn-primary btn-sm" id="dashNew">${I18N.t('adm.dashboard.newProduct')}</button>`
    ) + `

    <div class="demo-banner">
      ${UI.infoIcon()}
      <span>${I18N.t('adm.dashboard.dataNote', { date: typeof CATALOG !== 'undefined' ? UI.date(CATALOG.importedAt) : '—' })}</span>
    </div>

    <div class="kpi-grid">
      <div class="kpi kpi-principal">
        <div class="kpi-label">${I18N.t('adm.dashboard.invValue')}</div>
        <div class="kpi-value">${UI.money0(m.invValue)}</div>
        <div class="kpi-foot">${I18N.t('adm.dashboard.invValueFoot', { units: UI.num(m.units) })}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">${I18N.t('adm.dashboard.sales30')}</div>
        <div class="kpi-value">${UI.money0(m.sales30)}</div>
        <div class="kpi-foot">${I18N.t('adm.dashboard.salesTodayFoot', { today: `<strong>${UI.money0(m.salesToday)}</strong>`, ticket: UI.money0(m.ticket) })}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">${I18N.t('adm.dashboard.stores')}</div>
        <div class="kpi-value">${activeStores}<span class="kpi-of">/${Store.stores.length}</span></div>
        <div class="kpi-foot">${I18N.t('adm.dashboard.storesFoot')}</div>
      </div>
      <div class="kpi ${m.outCount ? 'kpi-critico' : ''}">
        <div class="kpi-label">${I18N.t('adm.dashboard.needsAttention')}</div>
        <div class="kpi-value">${m.lowCount + m.outCount}</div>
        <div class="kpi-foot">
          <span style="color:var(--warn-600);font-weight:600">${I18N.t('adm.dashboard.lowStock', { n: m.lowCount })}</span> ·
          <span style="color:var(--danger-600);font-weight:600">${I18N.t('adm.dashboard.outStock', { n: m.outCount })}</span>
        </div>
      </div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.dashboard.activeProducts')}</div><div class="kpi-value">${m.activeCount}</div><div class="kpi-foot">${I18N.t('adm.dashboard.skuCount', { n: m.skuCount, kits: m.kitCount })}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.dashboard.pendingOrders')}</div><div class="kpi-value">${m.pending}</div><div class="kpi-foot">${I18N.t('adm.dashboard.pendingFoot')}</div></div>
      <div class="kpi ${m.deliveriesPending ? 'kpi-alerta' : ''}"><div class="kpi-label">${I18N.t('adm.dashboard.deliveries')}</div><div class="kpi-value">${m.deliveriesPending}</div><div class="kpi-foot">${I18N.t('adm.dashboard.deliveriesFoot')}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.dashboard.customers')}</div><div class="kpi-value">${Store.customers.length}</div><div class="kpi-foot">${I18N.t('adm.dashboard.customersFoot', { n: withKit })}</div></div>
    </div>

    ${m.outCount ? `
      <div class="alert alert-danger">
        <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
        <div style="flex:1">
          <div class="alert-title">${I18N.t(m.outCount === 1 ? 'adm.dashboard.outAlertTitle' : 'adm.dashboard.outAlertTitlePlural', { n: m.outCount })}</div>
          <div class="alert-body">${I18N.t('adm.dashboard.outAlertBody')}</div>
        </div>
        <button class="btn btn-sm" data-goto="alerts">${I18N.t('adm.dashboard.viewAlerts')}</button>
      </div>` : ''}

    <div class="grid-2">
      <div class="card">
        <div class="card-head">
          <div><h2>${I18N.t('adm.dashboard.recentMovements')}</h2><p class="muted tiny" style="margin-top:2px">${I18N.t('adm.dashboard.recentMovementsSub')}</p></div>
          <button class="btn btn-sm" data-goto="movements">${I18N.t('adm.dashboard.viewAll')}</button>
        </div>
        <div class="card-body flush">
          <div class="table-wrap">
            <table class="data">
              <thead><tr><th>${I18N.t('adm.dashboard.colProduct')}</th><th>${I18N.t('adm.dashboard.colReason')}</th><th class="right">${I18N.t('adm.dashboard.colChange')}</th><th class="right">${I18N.t('adm.dashboard.colStock')}</th><th>${I18N.t('adm.dashboard.colDate')}</th></tr></thead>
              <tbody>
                ${recent.map(mv => `
                  <tr>
                    <td><div class="cell-main">${UI.esc(mv.product)}</div><div class="cell-sub mono">${UI.esc(UI.sizeLabel(mv.variant))} · ${UI.esc(mv.sku)}</div></td>
                    <td><div>${UI.esc(UI.reason(mv.reason))}</div><div class="cell-sub mono">${UI.esc(mv.ref)}</div></td>
                    <td class="right"><span class="mov-delta ${mv.type === 'entrada' ? 'in' : 'out'}">${mv.type === 'entrada' ? '+' : '−'}${mv.qty}</span></td>
                    <td class="right"><span class="mov-flow"><span class="from">${mv.before}</span><span class="arrow">→</span><span class="to">${mv.after}</span></span></td>
                    <td class="tiny muted nowrap">${UI.relative(mv.date)}<div class="cell-sub">${UI.esc(mv.user)}</div></td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:var(--s5)">
        <div class="card">
          <div class="card-head"><h2>${I18N.t('adm.dashboard.salesByStore')}</h2><button class="btn btn-sm" data-goto="stores">${I18N.t('adm.dashboard.viewAll')}</button></div>
          <div class="card-body">
            ${m.byStore.map((b, i) => `
              <div class="bar-row">
                <div class="bar-label">
                  <div style="font-weight:560">${UI.esc(b.store.short)}</div>
                  <div class="tiny muted">${I18N.t(b.store.active ? 'adm.dashboard.storeOrders' : 'adm.dashboard.storePrep', { n: b.orders, phase: b.store.phase })}</div>
                </div>
                <div class="bar-track"><div class="bar-fill ${i === 0 ? 'gold' : ''}" style="width:${(b.revenue / maxStore) * 100}%"></div></div>
                <div class="bar-val">${UI.money0(b.revenue)}</div>
              </div>`).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h2>${I18N.t('adm.dashboard.topSellers')}</h2></div>
          <div class="card-body">
            ${m.topProducts.length ? m.topProducts.map((p, i) => `
              <div class="bar-row">
                <div class="bar-label" title="${UI.esc(p.name)}">
                  <div style="font-weight:560;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${UI.esc(p.name)}</div>
                  <div class="tiny muted">${UI.money0(p.revenue)}</div>
                </div>
                <div class="bar-track"><div class="bar-fill ${i === 0 ? 'gold' : ''}" style="width:${(p.qty / maxQty) * 100}%"></div></div>
                <div class="bar-val">${I18N.t('adm.dashboard.units', { n: p.qty })}</div>
              </div>`).join('') : `<p class="muted tiny">${I18N.t('adm.dashboard.noSales')}</p>`}
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h2>${I18N.t('adm.dashboard.ordersToAttend')}</h2><button class="btn btn-sm" data-goto="orders">${I18N.t('adm.dashboard.viewAll')}</button></div>
          <div class="card-body">
            ${pending.length ? pending.map(o => {
              const c = this.customerOf(o);
              return `<div class="list-row">
                <div style="flex:1;min-width:0">
                  <div class="cell-main mono">${o.number}</div>
                  <div class="cell-sub">${UI.esc(c ? c.name : '—')} · ${UI.esc(UI.storeName(o.storeId))}</div>
                </div>
                <div style="text-align:right">
                  <div style="font-weight:620">${UI.money(o.total)}</div>
                  <div style="margin-top:3px">${UI.orderBadge(o.status, o.fulfillment)}</div>
                </div>
              </div>`;
            }).join('') : `<p class="muted tiny">${I18N.t('adm.dashboard.noPendingOrders')}</p>`}
          </div>
        </div>
      </div>
    </div>`;
  },

  dashboardBind() {
    document.querySelectorAll('[data-goto]').forEach(b => b.onclick = () => this.go(b.dataset.goto));
    document.getElementById('dashNew').onclick = () => this.productForm();
    document.getElementById('dashReset').onclick = () => this.confirmReset();
  },

  confirmReset() {
    UI.confirm(
      I18N.t('adm.dashboard.resetTitle'),
      I18N.t('adm.dashboard.resetBody'),
      () => { Store.reset(); App.refreshAll(); UI.toast('ok', I18N.t('adm.dashboard.resetDone'), I18N.t('adm.dashboard.resetDoneBody')); },
      true
    );
  },

  /* ============================================================
     INVENTARIO — una fila por talla, sin importar en qué tienda se venda
     ============================================================ */
  inventoryRows() {
    const f = this.f.inv;
    const rows = [];
    Store.products.forEach(p => {
      if (!p.active || Store.isKit(p)) return;
      if (!this.matchStore(p, f.store)) return;
      if (f.kind !== 'todos' && p.kind !== f.kind) return;
      p.variants.forEach(v => {
        const st = Store.variantStatus(p, v);
        if (f.status !== 'todos' && st !== f.status) return;
        if (f.q) {
          const q = f.q;
          const hit = p.name.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q) || v.size.toLowerCase() === q;
          if (!hit) return;
        }
        rows.push({ p, v, st });
      });
    });
    const rank = { agotado: 0, bajo: 1, ok: 2 };
    const si = s => SEED.sizeScale.indexOf(s);
    rows.sort((a, b) => (rank[a.st] - rank[b.st]) || a.p.name.localeCompare(b.p.name) || si(a.v.size) - si(b.v.size));
    return rows;
  },

  inventoryHTML() {
    const f = this.f.inv;
    const rows = this.inventoryRows();
    const totalValue = rows.reduce((s, r) => s + r.v.stock * r.p.cost, 0);
    const totalUnits = rows.reduce((s, r) => s + r.v.stock, 0);
    const low = rows.filter(r => r.st === 'bajo').length;
    const shared = Store.products.filter(p => p.stores.length > 1).length;

    return this.head(
      I18N.t('adm.inv.title'),
      I18N.t('adm.inv.sub'),
      `<button class="btn btn-sm" id="invImport">${UI.icon('upload')} ${I18N.t('imp.btn')}</button>
       <button class="btn btn-sm" id="invExport">${I18N.t('adm.inv.exportCsv')}</button>
       <button class="btn btn-primary btn-sm" id="invMove">${I18N.t('adm.inv.newMovement')}</button>`
    ) + `
    <div class="kpi-grid">
      <div class="kpi kpi-principal"><div class="kpi-label">${I18N.t('adm.inv.listedSkus')}</div><div class="kpi-value">${rows.length}</div><div class="kpi-foot">${I18N.t('adm.inv.ofActive', { n: Store.metrics().skuCount })}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.inv.unitsInStock')}</div><div class="kpi-value">${UI.num(totalUnits)}</div><div class="kpi-foot">${I18N.t('adm.inv.sharedFoot', { n: shared })}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.inv.costValue')}</div><div class="kpi-value">${UI.money0(totalValue)}</div><div class="kpi-foot">${I18N.t('adm.inv.tiedCapital')}</div></div>
      <div class="kpi ${low ? 'kpi-alerta' : ''}"><div class="kpi-label">${I18N.t('adm.inv.belowMin')}</div><div class="kpi-value">${low}</div><div class="kpi-foot">${I18N.t('adm.inv.needsRestock')}</div></div>
    </div>

    <div class="card">
      <div class="filter-bar">
        ${this.searchBox('invQ', f, I18N.t('adm.inv.searchPlaceholder'))}
        <select class="select" id="invStore">${this.storeOptions(f.store, true)}</select>
        <select class="select" id="invKind">
          <option value="todos">${I18N.t('adm.inv.allKinds')}</option>
          ${SEED.kinds.filter(k => k !== 'kit').map(k => `<option value="${k}"${f.kind === k ? ' selected' : ''}>${I18N.t('kind.' + k)}</option>`).join('')}
        </select>
        <select class="select" id="invStatus">
          <option value="todos">${I18N.t('adm.inv.allStatuses')}</option>
          <option value="ok"${f.status === 'ok' ? ' selected' : ''}>${I18N.t('adm.inv.available')}</option>
          <option value="bajo"${f.status === 'bajo' ? ' selected' : ''}>${I18N.t('adm.inv.lowStock')}</option>
          <option value="agotado"${f.status === 'agotado' ? ' selected' : ''}>${I18N.t('adm.inv.outOfStock')}</option>
        </select>
      </div>

      <div class="card-body flush">
        ${rows.length ? `
        <div class="table-wrap">
          <table class="data">
            <thead><tr>
              <th>${I18N.t('adm.inv.colProductVariant')}</th><th>${I18N.t('adm.inv.colSku')}</th><th>${I18N.t('adm.inv.colStores')}</th>
              <th class="right">${I18N.t('adm.inv.colStock')}</th><th class="right">${I18N.t('adm.inv.colMin')}</th><th>${I18N.t('adm.inv.colStatus')}</th>
              <th class="right">${I18N.t('adm.inv.colCostValue')}</th><th class="right">${I18N.t('adm.inv.colActions')}</th>
            </tr></thead>
            <tbody>
              ${rows.slice(0, 300).map(({ p, v, st }) => `
                <tr>
                  <td>
                    <div class="cell-flex">
                      ${UI.thumb(p)}
                      <div>
                        <div class="cell-main">${UI.esc(p.name)}</div>
                        <div class="cell-sub">${I18N.t('shop.size')} <b>${UI.esc(UI.sizeLabel(v.size))}</b> · ${I18N.t('kind.' + p.kind)}</div>
                      </div>
                    </div>
                  </td>
                  <td class="mono tiny">${UI.esc(v.sku)}</td>
                  <td><div class="tags">${UI.storeTags(p)}</div></td>
                  <td class="right">
                    <div style="font-weight:680;font-size:15px">${v.stock}</div>
                    ${UI.stockBar(v.stock, p.minStock)}
                  </td>
                  <td class="right muted">${p.minStock}</td>
                  <td>${UI.stockBadge(st)}</td>
                  <td class="right mono">${UI.money(v.stock * p.cost)}</td>
                  <td class="right nowrap">
                    <button class="btn btn-sm" data-in="${v.id}" title="${I18N.t('adm.inv.entryTitle')}">${I18N.t('adm.inv.entryBtn')}</button>
                    <button class="btn btn-sm" data-out="${v.id}" title="${I18N.t('adm.inv.exitTitle')}" ${v.stock <= 0 ? 'disabled' : ''}>${I18N.t('adm.inv.exitBtn')}</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>` : UI.empty(I18N.t('adm.inv.emptyTitle'), I18N.t('adm.inv.emptyBody'))}
      </div>
    </div>`;
  },

  inventoryBind() {
    this.bindSearch('invQ', this.f.inv, 'inventory');
    this.bindSelect('invStatus', this.f.inv, 'status', 'inventory');
    this.bindSelect('invStore', this.f.inv, 'store', 'inventory');
    this.bindSelect('invKind', this.f.inv, 'kind', 'inventory');
    document.getElementById('invMove').onclick = () => this.movementForm();
    document.getElementById('invExport').onclick = () => this.exportInventory();
    document.getElementById('invImport').onclick = () => this.stockImportForm();

    document.querySelectorAll('[data-in]').forEach(b  => b.onclick = () => this.movementForm(b.dataset.in, 'entrada'));
    document.querySelectorAll('[data-out]').forEach(b => b.onclick = () => this.movementForm(b.dataset.out, 'salida'));
  },

  /* ---------- Importar inventario desde Excel ----------
     Plantilla → se llena la columna Cantidad → se sube → vista previa → aplicar. */
  stockImportForm() {
    const st = { rows: null, file: '', mode: 'entrada' };
    UI.modal(`
      <div class="modal-head">
        <div><h2>${I18N.t('imp.title')}</h2><p class="muted tiny" style="margin-top:2px">${I18N.t('imp.sub')}</p></div>
        ${UI.closeBtn()}
      </div>
      <div class="modal-body">
        <ol class="imp-steps">
          <li>
            <div class="imp-step-title">${I18N.t('imp.step1')}</div>
            <div class="hint" style="margin:2px 0 8px">${I18N.t('imp.step1Hint')}</div>
            <button class="btn btn-sm" id="siTemplate">${I18N.t('imp.template')}</button>
          </li>
          <li>
            <div class="imp-step-title">${I18N.t('imp.step2')}</div>
            <div class="imp-mode" role="radiogroup" aria-label="${I18N.t('imp.step2')}">
              <label class="imp-opt"><input type="radio" name="siMode" value="entrada" checked><span><b>${I18N.t('imp.modeIn')}</b><small>${I18N.t('imp.modeInHint')}</small></span></label>
              <label class="imp-opt"><input type="radio" name="siMode" value="conteo"><span><b>${I18N.t('imp.modeCount')}</b><small>${I18N.t('imp.modeCountHint')}</small></span></label>
            </div>
          </li>
          <li>
            <div class="imp-step-title">${I18N.t('imp.step3')}</div>
            <label class="imp-drop" for="siFile">
              ${UI.icon('upload')}
              <span id="siFileName">${I18N.t('imp.choose')}</span>
              <input type="file" id="siFile" accept=".xlsx,.csv,text/csv" class="sr-only">
            </label>
          </li>
        </ol>
        <div id="siPreview"></div>
      </div>
      <div class="modal-foot">
        <button class="btn" onclick="UI.closeModal()">${I18N.t('ui.cancel')}</button>
        <button class="btn btn-primary" id="siApply" disabled>${I18N.t('imp.apply', { n: 0 })}</button>
      </div>`, 'wide');

    const preview = () => {
      const box = document.getElementById('siPreview');
      const btn = document.getElementById('siApply');
      if (!st.rows) { box.innerHTML = ''; btn.disabled = true; return; }
      const plan = Store.planStockImport(st.rows, st.mode);
      btn.disabled = !plan.lines.length;
      btn.textContent = I18N.t('imp.apply', { n: plan.lines.length });
      const units = plan.lines.reduce((s, l) => s + l.diff, 0);
      box.innerHTML = `
        <div class="imp-summary">
          <span class="badge badge-ok">${I18N.t('imp.sumChanges', { n: plan.lines.length })}</span>
          <span class="badge badge-neutral">${I18N.t('imp.sumSame', { n: plan.unchanged + plan.empty })}</span>
          ${plan.errors.length ? `<span class="badge badge-danger">${I18N.t('imp.sumErrors', { n: plan.errors.length })}</span>` : ''}
          ${plan.lines.length ? `<span class="muted tiny">${I18N.t('imp.sumUnits', { n: (units > 0 ? '+' : '') + units })}</span>` : ''}
        </div>
        ${plan.lines.length ? `
        <div class="table-wrap imp-table">
          <table class="data">
            <thead><tr><th>SKU</th><th>${I18N.t('adm.inv.colProductVariant')}</th><th class="right">${I18N.t('imp.colBefore')}</th><th class="right">${I18N.t('imp.colAfter')}</th><th class="right">${I18N.t('imp.colDiff')}</th></tr></thead>
            <tbody>${plan.lines.map(l => `<tr>
              <td class="mono tiny">${UI.esc(l.sku)}</td>
              <td><div class="cell-main">${UI.esc(l.product)}</div><div class="cell-sub">${UI.esc(UI.sizeLabel(l.size))}</div></td>
              <td class="right mono">${l.before}</td>
              <td class="right mono"><b>${l.after}</b></td>
              <td class="right"><span class="mov-delta ${l.diff > 0 ? 'in' : 'out'}">${l.diff > 0 ? '+' : '−'}${Math.abs(l.diff)}</span></td>
            </tr>`).join('')}</tbody>
          </table>
        </div>` : `<p class="muted" style="margin:10px 0">${I18N.t('imp.noChanges')}</p>`}
        ${plan.errors.length ? `
        <div class="imp-errors">
          <div class="imp-step-title">${I18N.t('imp.errorsTitle')}</div>
          <ul>${plan.errors.slice(0, 30).map(e => `<li>${I18N.t('imp.rowN', { n: e.row })} · <span class="mono">${UI.esc(e.sku)}</span> — ${UI.esc(e.msg)}</li>`).join('')}</ul>
          ${plan.errors.length > 30 ? `<div class="hint">${I18N.t('imp.moreErrors', { n: plan.errors.length - 30 })}</div>` : ''}
        </div>` : ''}`;
    };

    document.getElementById('siTemplate').onclick = () => {
      const q = x => '"' + String(x).replace(/"/g, '""') + '"';
      const lines = [['SKU', I18N.t('imp.hProduct'), I18N.t('imp.hSize'), I18N.t('imp.hCurrent'), I18N.t('imp.hQty')].join(',')];
      Store.products.filter(p => p.active && !Store.isKit(p)).forEach(p => p.variants.forEach(v =>
        lines.push([v.sku, q(p.name), q(UI.sizeLabel(v.size)), v.stock, ''].join(','))));
      UI.download('plantilla_inventario_' + Store.dayKey(new Date()) + '.csv', lines.join('\n'));
    };

    document.querySelectorAll('input[name="siMode"]').forEach(r => r.onchange = () => { st.mode = r.value; preview(); });

    document.getElementById('siFile').onchange = async ev => {
      const file = ev.target.files[0];
      if (!file) return;
      document.getElementById('siFileName').textContent = file.name;
      try {
        st.rows = await XlsxLite.readFile(file);
        st.file = file.name;
      } catch (e) {
        st.rows = null;
        UI.toast('danger', I18N.t('imp.readFail'), I18N.t('imp.readFailBody'));
      }
      preview();
    };

    document.getElementById('siApply').onclick = () => {
      if (!st.rows) return;
      const r = Store.applyStockImport(st.rows, st.mode);
      UI.closeModal();
      App.refreshAll();
      if (r.failed.length) UI.toast('warn', I18N.t('imp.partialTitle'), I18N.t('imp.partialBody', { n: r.applied, f: r.failed.length, ref: r.ref }));
      else UI.toast('ok', I18N.t('imp.doneTitle'), I18N.t('imp.doneBody', { n: r.applied, ref: r.ref }));
    };
  },

  exportInventory() {
    const lines = [['SKU', 'Product', 'Size', 'Stores', 'Stock', 'Min', 'Cost', 'Price', 'Cost_value'].join(',')];
    Store.products.filter(p => p.active && !Store.isKit(p)).forEach(p => p.variants.forEach(v => {
      lines.push([v.sku, `"${p.name}"`, v.size, `"${p.stores.join(' / ') || 'internal'}"`, v.stock, p.minStock, p.cost, p.price, (v.stock * p.cost).toFixed(2)].join(','));
    }));
    UI.download('inventory_soccercage_' + Store.dayKey(new Date()) + '.csv', lines.join('\n'));
    UI.toast('ok', I18N.t('adm.inv.exportDone'), I18N.t('adm.inv.exportDoneBody'));
  },

  /* ---------- Formulario de movimiento manual ---------- */
  movementForm(variantId, type) {
    const opts = [];
    Store.products.filter(p => p.active && !Store.isKit(p)).forEach(p =>
      p.variants.forEach(v => opts.push({ id: v.id, label: `${p.name} · ${UI.sizeLabel(v.size)} (${v.stock})` }))
    );
    opts.sort((a, b) => a.label.localeCompare(b.label));

    UI.modal(`
      <div class="modal-head"><h2>${I18N.t('adm.mv.formTitle')}</h2>${UI.closeBtn()}</div>
      <div class="modal-body">
        <div class="field">
          <label for="mvVariant">${I18N.t('adm.mv.variant')} <span class="req">*</span></label>
          <select class="select" id="mvVariant" data-autofocus>
            ${opts.map(o => `<option value="${o.id}"${o.id === variantId ? ' selected' : ''}>${UI.esc(o.label)}</option>`).join('')}
          </select>
        </div>
        <div class="form-grid">
          <div class="field">
            <label for="mvType">${I18N.t('adm.mv.type')} <span class="req">*</span></label>
            <select class="select" id="mvType">
              <option value="entrada"${type !== 'salida' ? ' selected' : ''}>${I18N.t('adm.mv.typeIn')}</option>
              <option value="salida"${type === 'salida' ? ' selected' : ''}>${I18N.t('adm.mv.typeOut')}</option>
            </select>
          </div>
          <div class="field">
            <label for="mvQty">${I18N.t('adm.mv.qty')} <span class="req">*</span></label>
            <input class="input" id="mvQty" type="number" min="1" value="1">
          </div>
        </div>
        <div class="field">
          <label for="mvReason">${I18N.t('adm.mv.reason')} <span class="req">*</span></label>
          <select class="select" id="mvReason"></select>
        </div>
        <div class="field">
          <label for="mvRef">${I18N.t('adm.mv.refDoc')}</label>
          <input class="input" id="mvRef" placeholder="${I18N.t('adm.mv.refPlaceholder')}">
          <div class="hint">${I18N.t('adm.mv.refHint')}</div>
        </div>
        <div class="alert alert-info" id="mvPreview" style="margin-top:4px"></div>
      </div>
      <div class="modal-foot">
        <button class="btn" onclick="UI.closeModal()">${I18N.t('adm.mv.cancel')}</button>
        <button class="btn btn-primary" id="mvSave">${I18N.t('adm.mv.save')}</button>
      </div>`);

    const sel = document.getElementById('mvVariant');
    const tp  = document.getElementById('mvType');
    const qty = document.getElementById('mvQty');
    const rs  = document.getElementById('mvReason');
    const pv  = document.getElementById('mvPreview');

    const fillReasons = () => {
      rs.innerHTML = SEED.reasons[tp.value].map(r => `<option value="${r}">${UI.esc(UI.reason(r))}</option>`).join('');
    };

    const preview = () => {
      const f = Store.findVariant(sel.value);
      if (!f) return;
      const n = parseInt(qty.value) || 0;
      const before = f.variant.stock;
      const after = tp.value === 'entrada' ? before + n : before - n;
      const bad = after < 0;
      pv.className = 'alert ' + (bad ? 'alert-danger' : 'alert-info');
      pv.innerHTML = `
        ${UI.infoIcon()}
        <div>
          <div class="alert-title">${bad ? I18N.t('adm.mv.notAllowed') : I18N.t('adm.mv.expectedResult')}</div>
          <div class="alert-body mono">
            ${UI.esc(f.variant.sku)}: ${before} → ${Math.max(0, after)}
            ${bad ? I18N.t('adm.mv.negativeStock') : ''}
          </div>
        </div>`;
      document.getElementById('mvSave').disabled = bad || n <= 0;
    };

    fillReasons();
    preview();
    sel.onchange = preview;
    tp.onchange  = () => { fillReasons(); preview(); };
    qty.oninput  = preview;

    document.getElementById('mvSave').onclick = () => {
      const r = Store.applyMovement({
        variantId: sel.value,
        type: tp.value,
        qty: parseInt(qty.value) || 0,
        reason: rs.value,
        ref: document.getElementById('mvRef').value.trim() || '—'
      });
      if (!r.ok) { UI.toast('danger', I18N.t('adm.mv.notLogged'), r.error); return; }
      UI.closeModal();
      App.refreshAll();
      UI.toast('ok', I18N.t('adm.mv.logged'),
        `${r.movement.sku}: ${r.movement.before} → ${r.movement.after} (${UI.reason(r.movement.reason)})`);
    };
  },

  /* ============================================================
     PRODUCTOS — piezas y kits
     ============================================================ */
  productsHTML() {
    const f = this.f.prod;
    let list = Store.products.slice();

    list = list.filter(p => this.matchStore(p, f.store));
    if (f.type === 'kits')   list = list.filter(p => Store.isKit(p));
    if (f.type === 'pieces') list = list.filter(p => !Store.isKit(p));
    if (f.active === 'activos')   list = list.filter(p => p.active);
    if (f.active === 'inactivos') list = list.filter(p => !p.active);
    if (f.q) list = list.filter(p => p.name.toLowerCase().includes(f.q) || p.sku.toLowerCase().includes(f.q));

    return this.head(
      I18N.t('adm.products.title'),
      I18N.t('adm.products.sub'),
      `<button class="btn btn-sm" id="prodNewKit">${I18N.t('adm.products.newKitBtn')}</button>
       <button class="btn btn-primary btn-sm" id="prodNew">${I18N.t('adm.products.newBtn')}</button>`
    ) + `
    <div class="card">
      <div class="filter-bar">
        ${this.searchBox('prodQ', f, I18N.t('adm.products.searchPh'))}
        <select class="select" id="prodStore">${this.storeOptions(f.store, true)}</select>
        <select class="select" id="prodType">
          <option value="todos">${I18N.t('adm.products.allTypes')}</option>
          <option value="kits"${f.type === 'kits' ? ' selected' : ''}>${I18N.t('adm.products.onlyKits')}</option>
          <option value="pieces"${f.type === 'pieces' ? ' selected' : ''}>${I18N.t('adm.products.onlyPieces')}</option>
        </select>
        <select class="select" id="prodActive">
          <option value="todos">${I18N.t('adm.products.allActive')}</option>
          <option value="activos"${f.active === 'activos' ? ' selected' : ''}>${I18N.t('adm.products.onlyActive')}</option>
          <option value="inactivos"${f.active === 'inactivos' ? ' selected' : ''}>${I18N.t('adm.products.onlyInactive')}</option>
        </select>
      </div>

      <div class="card-body flush">
        ${list.length ? `
        <div class="table-wrap">
          <table class="data">
            <thead><tr>
              <th>${I18N.t('adm.products.colProduct')}</th><th>${I18N.t('adm.products.colType')}</th><th>${I18N.t('adm.products.colStores')}</th>
              <th class="right">${I18N.t('adm.products.colSizes')}</th><th class="right">${I18N.t('adm.products.colTotalStock')}</th>
              <th class="right">${I18N.t('adm.products.colPrice')}</th>
              <th>${I18N.t('adm.products.colStatus')}</th><th class="right">${I18N.t('adm.products.colActions')}</th>
            </tr></thead>
            <tbody>
              ${list.map(p => {
                const kit = Store.isKit(p);
                const cost = kit ? Store.kitCost(p) : p.cost;
                const margin = p.price > 0 ? ((p.price - cost) / p.price * 100) : 0;
                const st = Store.productStatus(p);
                return `<tr>
                  <td>
                    <div class="cell-flex">
                      ${UI.thumb(p)}
                      <div>
                        <div class="cell-main">${UI.esc(p.name)}</div>
                        <div class="cell-sub mono">${UI.esc(p.sku)}</div>
                      </div>
                    </div>
                  </td>
                  <td><div>${kit ? `<span class="badge badge-gold">${I18N.t('kind.kit')}</span>` : I18N.t('kind.' + p.kind)}</div><div class="cell-sub">${UI.esc(UI.catNames(p))}</div></td>
                  <td><div class="tags">${UI.storeTags(p)}</div></td>
                  <td class="right nowrap">${kit ? I18N.t('adm.products.pieces', { n: (p.components || []).reduce((s, c) => s + c.qty, 0) }) : p.variants.length}</td>
                  <td class="right nowrap"><strong>${kit ? I18N.t('adm.products.kitsPossible', { n: UI.num(Store.productStock(p)) }) : UI.num(Store.productStock(p))}</strong></td>
                  <td class="right nowrap"><strong class="mono">${UI.money(p.price)}</strong>
                    <div class="cell-sub">${I18N.t('adm.products.costLine', { cost: UI.money(cost) })}${p.price > 0 ? ` · <span class="delta ${margin >= 40 ? 'up' : ''}">${margin.toFixed(0)}%</span>` : ''}</div>
                    ${kit && Store.kitSavings(p) ? `<div class="cell-sub">${I18N.t('adm.products.kitDiscount', { amount: UI.money(Store.kitSavings(p)) })}</div>` : ''}</td>
                  <td>${UI.stockBadge(st)}</td>
                  <td class="right nowrap">
                    <button class="btn btn-sm" data-edit="${p.id}">${I18N.t('adm.products.editBtn')}</button>
                    <button class="btn btn-sm" data-toggle="${p.id}">${p.active ? I18N.t('adm.products.deactivateBtn') : I18N.t('adm.products.activateBtn')}</button>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : UI.empty(I18N.t('adm.products.emptyTitle'), I18N.t('adm.products.emptyBody'))}
      </div>
    </div>`;
  },

  productsBind() {
    this.bindSearch('prodQ', this.f.prod, 'products');
    this.bindSelect('prodStore', this.f.prod, 'store', 'products');
    this.bindSelect('prodType', this.f.prod, 'type', 'products');
    this.bindSelect('prodActive', this.f.prod, 'active', 'products');
    document.getElementById('prodNew').onclick = () => this.productForm();
    document.getElementById('prodNewKit').onclick = () => this.productForm(null, 'kit');

    document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => this.productForm(b.dataset.edit));
    document.querySelectorAll('[data-toggle]').forEach(b => b.onclick = () => {
      const p = Store.product(b.dataset.toggle);
      const act = () => {
        const r = Store.toggleProduct(p.id);
        App.refreshAll();
        UI.toast('ok', r.active ? I18N.t('adm.products.activatedTitle') : I18N.t('adm.products.deactivatedTitle'),
          r.active ? I18N.t('adm.products.activatedBody') : I18N.t('adm.products.deactivatedBody'));
      };
      if (!p.active) return act();
      const kits = Store.kitsUsing(p.id).filter(k => k.active);
      UI.confirm(I18N.t('adm.products.confirmDeactivateTitle'),
        I18N.t('adm.products.confirmDeactivateBody', { name: `<strong>${UI.esc(p.name)}</strong>` }) +
        (kits.length ? `<br><br><strong>${I18N.t('adm.products.confirmKits', { list: kits.map(k => UI.esc(k.name)).join(', ') })}</strong>` : ''),
        act, true);
    });
  },

  /* ---------- Alta / edición de producto ---------- */
  productForm(id, presetKind) {
    const p = id ? Store.product(id) : null;
    const kit = p ? Store.isKit(p) : presetKind === 'kit';

    const sizes = {};
    if (p && !kit) p.variants.forEach(v => { sizes[v.size] = { on: true, stock: v.stock }; });
    if (!p && !kit) SEED.sizeSets.apparel.forEach(s => { sizes[s] = { on: true, stock: 0 }; });

    this.draft = {
      existing: p, kit,
      image: p ? p.image : null,
      sizes,
      components: p && kit ? clone(p.components || []) : []
    };

    const check = (name, value, label, on, cls) => `
      <label class="chip chip-check ${cls || ''}">
        <input type="checkbox" name="${name}" value="${value}" ${on ? 'checked' : ''}> ${label}
      </label>`;

    UI.modal(`
      <div class="modal-head">
        <div>
          <h2>${I18N.t(p ? (kit ? 'adm.pf.editKitTitle' : 'adm.pf.editTitle') : (kit ? 'adm.pf.newKitTitle' : 'adm.pf.newTitle'))}</h2>
          <p class="muted tiny" style="margin-top:2px">${I18N.t(kit ? 'adm.pf.kitIntro' : 'adm.pf.pieceIntro')}</p>
        </div>
        ${UI.closeBtn()}
      </div>
      <div class="modal-body">
        <div class="pf-top">
          <div class="pf-image">
            <div class="pf-preview" id="pfPreview"></div>
            <label class="btn btn-sm pf-upload">
              ${I18N.t('adm.pf.upload')}
              <input type="file" id="pfFile" accept="image/*" hidden>
            </label>
            <button class="btn btn-sm btn-ghost" id="pfImgClear" type="button">${I18N.t('adm.pf.removeImage')}</button>
          </div>

          <div class="pf-main">
            <div class="field">
              <label for="pfName">${I18N.t('adm.pf.name')} <span class="req">*</span></label>
              <input class="input" id="pfName" data-autofocus value="${p ? UI.esc(p.name) : ''}" placeholder="${I18N.t(kit ? 'adm.pf.namePhKit' : 'adm.pf.namePh')}">
              <div class="err-msg" id="pfErrName">${I18N.t('adm.pf.errName')}</div>
            </div>
            <div class="form-grid">
              <div class="field">
                <label for="pfSku">${I18N.t('adm.pf.sku')} <span class="req">*</span></label>
                <input class="input mono" id="pfSku" value="${p ? UI.esc(p.sku) : ''}" placeholder="${kit ? 'CAMP-KIT' : 'CAMP-JER'}" style="text-transform:uppercase">
                <div class="err-msg" id="pfErrSku">${I18N.t('adm.pf.errSku')}</div>
              </div>
              ${kit ? `
              <div class="field">
                <label for="pfLine">${I18N.t('adm.pf.line')}</label>
                <select class="select" id="pfLine">${this.lineOptions(p)}</select>
              </div>` : `
              <div class="field">
                <label for="pfKind">${I18N.t('adm.pf.kind')}</label>
                <select class="select" id="pfKind">
                  ${SEED.kinds.filter(k => k !== 'kit').map(k => `<option value="${k}"${p && p.kind === k ? ' selected' : ''}>${I18N.t('kind.' + k)}</option>`).join('')}
                </select>
              </div>`}
            </div>
          </div>
        </div>

        <div class="form-grid">
          <div class="field">
            <label>${I18N.t('adm.pf.category')}</label>
            <div class="chips">
              ${SEED.categories.map(c => check('pfCat', c, I18N.t('cat.' + c), p ? p.categories.includes(c) : c === 'player')).join('')}
            </div>
          </div>
          <div class="field">
            <label>${I18N.t('adm.pf.stores')}</label>
            <div class="chips">
              ${Store.stores.map(s => check('pfStore', s.id, UI.esc(s.short), p ? p.stores.includes(s.id) : s.id === Store.state.currentStore)).join('')}
            </div>
            <div class="hint">${I18N.t('adm.pf.storesHint')}</div>
          </div>
          <div class="field span-2">
            <label for="pfDesc">${I18N.t('adm.pf.desc')}</label>
            <textarea class="input" id="pfDesc" rows="2" placeholder="${I18N.t('adm.pf.descPh')}">${p ? UI.esc(p.description || '') : ''}</textarea>
          </div>

          <div class="field">
            <label for="pfPrice">${I18N.t(kit ? 'adm.pf.kitPrice' : 'adm.pf.price')} <span class="req">*</span></label>
            <input class="input" id="pfPrice" type="number" step="0.01" min="0" value="${p ? p.price : ''}" placeholder="${kit ? '50.00' : '25.00'}">
            <div class="hint" id="pfMargin"></div>
          </div>
          ${kit ? `
          <div class="field">
            <label for="pfDisc">${I18N.t('adm.pf.kitDiscount')}</label>
            <input class="input" id="pfDisc" type="number" step="1" min="0" max="90" placeholder="10">
            <div class="hint">${I18N.t('adm.pf.kitDiscountHint')}</div>
          </div>` : `
          <div class="field">
            <label for="pfCost">${I18N.t('adm.pf.cost')}</label>
            <input class="input" id="pfCost" type="number" step="0.01" min="0" value="${p ? p.cost : ''}" placeholder="12.00">
          </div>
          <div class="field">
            <label for="pfMin">${I18N.t('adm.pf.min')}</label>
            <input class="input" id="pfMin" type="number" min="0" value="${p ? p.minStock : Store.settings.lowStockGlobal}">
            <div class="hint">${I18N.t('adm.pf.minHint')}</div>
          </div>
          <div class="field">
            <label for="pfLine">${I18N.t('adm.pf.line')}</label>
            <select class="select" id="pfLine">${this.lineOptions(p)}</select>
          </div>`}
          <div class="field span-2">
            <label style="display:inline-flex;align-items:center;gap:8px;font-weight:500;cursor:pointer;margin-right:18px">
              <input type="checkbox" id="pfActive" ${!p || p.active ? 'checked' : ''}> ${I18N.t('adm.pf.activeLabel')}
            </label>
            <label style="display:inline-flex;align-items:center;gap:8px;font-weight:500;cursor:pointer">
              <input type="checkbox" id="pfFeat" ${p && p.featured ? 'checked' : ''}> ${I18N.t('adm.pf.featuredLabel')}
            </label>
          </div>
        </div>

        <div id="pfDyn"></div>
        ${p && !kit ? `<div class="hint" style="margin-top:10px">${I18N.t('adm.pf.editHint')}</div>` : ''}
      </div>
      <div class="modal-foot">
        <button class="btn" onclick="UI.closeModal()">${I18N.t('adm.pf.cancel')}</button>
        <button class="btn btn-primary" id="pfSave">${p ? I18N.t('adm.pf.saveEdit') : I18N.t(kit ? 'adm.pf.saveNewKit' : 'adm.pf.saveNew')}</button>
      </div>`, 'wide');

    this.renderPfImage();
    this.renderPfDyn();

    document.getElementById('pfFile').onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      this.readImage(file, data => {
        if (!data) { UI.toast('danger', I18N.t('adm.pf.imageErr'), I18N.t('adm.pf.imageErrBody')); return; }
        this.draft.image = data;
        this.renderPfImage();
      });
    };
    document.getElementById('pfImgClear').onclick = () => { this.draft.image = null; this.renderPfImage(); };

    const kindSel = document.getElementById('pfKind');
    if (kindSel) kindSel.onchange = () => this.renderPfImage();

    const price = document.getElementById('pfPrice');
    const cost = document.getElementById('pfCost');
    price.oninput = () => this.pfSummary();
    if (cost) cost.oninput = () => this.pfSummary();
    const disc = document.getElementById('pfDisc');
    if (disc) disc.oninput = () => {
      const sum = this.draftKitSum();
      const d = Math.min(90, Math.max(0, parseFloat(disc.value) || 0));
      if (sum > 0) price.value = (Math.round(sum * (1 - d / 100) * 100) / 100).toFixed(2);
      this.pfSummary();
    };
    this.pfSummary();

    document.getElementById('pfSave').onclick = () => this.saveProductForm();
  },

  lineOptions(p) {
    return `<option value="">—</option>` +
      Object.keys(SEED.lines).map(k => `<option value="${k}"${p && p.line === k ? ' selected' : ''}>${UI.esc(SEED.lines[k])}</option>`).join('');
  },

  /** Reduce la foto a 600 px: basta para la tienda y no llena el almacenamiento. */
  readImage(file, cb) {
    const r = new FileReader();
    r.onerror = () => cb(null);
    r.onload = () => {
      const img = new Image();
      img.onerror = () => cb(null);
      img.onload = () => {
        const k = Math.min(1, 600 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        const g = c.getContext('2d');
        g.fillStyle = '#fff';
        g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', 0.85));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  },

  renderPfImage() {
    const d = this.draft;
    const kindSel = document.getElementById('pfKind');
    const kind = d.kit ? 'kit' : (kindSel ? kindSel.value : 'jersey');
    const hex = d.existing ? d.existing.colorHex : '#16181d';
    document.getElementById('pfPreview').innerHTML = d.image
      ? `<img class="p-photo" src="${UI.esc(d.image)}" alt="">`
      : UI.garment(kind, hex);
    document.getElementById('pfImgClear').style.display = d.image ? '' : 'none';
  },

  draftKitSum() {
    return round2(this.draft.components.reduce((s, c) => {
      const x = Store.product(c.productId);
      return s + (x ? x.price * c.qty : 0);
    }, 0));
  },

  pfSummary() {
    const el = document.getElementById('pfMargin');
    const pr = parseFloat(document.getElementById('pfPrice').value) || 0;
    if (this.draft.kit) {
      const sum = this.draftKitSum();
      if (!sum) { el.textContent = I18N.t('adm.pf.kitSumEmpty'); return; }
      const save = round2(sum - pr);
      el.innerHTML = I18N.t('adm.pf.kitSum', { sum: UI.money(sum) }) + (pr > 0
        ? ' · ' + (save > 0
            ? `<strong style="color:var(--ok-600)">${I18N.t('adm.pf.kitSaves', { amount: UI.money(save), pct: Math.round(save / sum * 100) })}</strong>`
            : I18N.t('adm.pf.kitNoDiscount'))
        : '');
      return;
    }
    const c = parseFloat(document.getElementById('pfCost').value) || 0;
    if (pr > 0 && c > 0) {
      const m = ((pr - c) / pr * 100);
      el.innerHTML = `${I18N.t('adm.pf.marginLabel')}: <strong style="color:${m >= 40 ? 'var(--ok-600)' : 'var(--warn-600)'}">${m.toFixed(1)}%</strong> · ${UI.money(pr - c)} ${I18N.t('adm.pf.perUnit')}`;
    } else el.textContent = '';
  },

  /** Parte variable del formulario: tallas (pieza) o composición (kit). */
  renderPfDyn() {
    const d = this.draft;
    const box = document.getElementById('pfDyn');

    if (d.kit) {
      const pieces = Store.products.filter(x => !Store.isKit(x) && x.active)
        .sort((a, b) => a.name.localeCompare(b.name));
      box.innerHTML = `
        <div class="pf-section-head">
          <div>
            <h3>${I18N.t('adm.pf.componentsTitle')}</h3>
            <p class="muted tiny" style="margin-top:2px">${I18N.t('adm.pf.componentsSub')}</p>
          </div>
          <button class="btn btn-sm" id="pfAddComp" type="button">${I18N.t('adm.pf.addComponent')}</button>
        </div>
        <div class="comp-editor">
          ${d.components.length ? d.components.map((c, i) => {
            const x = Store.product(c.productId);
            return `
            <div class="comp-row">
              <select class="select" data-comp-p="${i}">
                ${pieces.map(o => `<option value="${o.id}"${o.id === c.productId ? ' selected' : ''}>${UI.esc(o.name)} — ${UI.money(o.price)} · ${UI.esc(o.stores.map(s => (Store.storeCfg(s) || {}).short).join(' / ') || I18N.t('store.internal'))}</option>`).join('')}
              </select>
              <input class="input" type="number" min="1" value="${c.qty}" data-comp-q="${i}" aria-label="${I18N.t('adm.mv.qty')}">
              <span class="mono tiny muted comp-sub">${x ? UI.money(x.price * c.qty) : ''}</span>
              <button class="icon-btn" data-comp-del="${i}" type="button" aria-label="${I18N.t('cart.remove')}">
                <svg style="width:15px;height:15px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>`;
          }).join('') : `<p class="muted tiny" style="padding:14px">${I18N.t('adm.pf.componentsEmpty')}</p>`}
        </div>`;

      const firstFree = () => (pieces.find(o => !d.components.some(c => c.productId === o.id)) || pieces[0]);
      document.getElementById('pfAddComp').onclick = () => {
        const o = firstFree();
        if (!o) return;
        d.components.push({ productId: o.id, qty: 1 });
        this.renderPfDyn();
      };
      box.querySelectorAll('[data-comp-p]').forEach(s => s.onchange = () => { d.components[+s.dataset.compP].productId = s.value; this.renderPfDyn(); });
      box.querySelectorAll('[data-comp-q]').forEach(s => s.onchange = () => { d.components[+s.dataset.compQ].qty = Math.max(1, parseInt(s.value) || 1); this.renderPfDyn(); });
      box.querySelectorAll('[data-comp-del]').forEach(b => b.onclick = () => { d.components.splice(+b.dataset.compDel, 1); this.renderPfDyn(); });
      this.pfSummary();
      return;
    }

    box.innerHTML = `
      <div class="pf-section-head">
        <div>
          <h3>${I18N.t('adm.pf.sizesTitle')}</h3>
          <p class="muted tiny" style="margin-top:2px">${I18N.t('adm.pf.sizesSub')}</p>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-sm" data-preset="apparel" type="button">${I18N.t('adm.pf.presetApparel')}</button>
          <button class="btn btn-sm" data-preset="socks" type="button">${I18N.t('adm.pf.presetSocks')}</button>
          <button class="btn btn-sm" data-preset="one" type="button">${I18N.t('adm.pf.presetOne')}</button>
        </div>
      </div>
      <div class="size-grid">
        ${SEED.sizeScale.map(s => {
          const cur = d.sizes[s] || { on: false, stock: 0 };
          return `
          <div class="size-cell ${cur.on ? 'on' : ''}">
            <label title="${UI.esc(UI.sizeTitle(s))}">
              <input type="checkbox" data-sz="${s}" ${cur.on ? 'checked' : ''}>
              <span>${UI.esc(UI.sizeLabel(s))}</span>
            </label>
            <input class="input" type="number" min="0" data-sz-stock="${s}" value="${cur.stock}" ${cur.on ? '' : 'disabled'} aria-label="${I18N.t('adm.pf.colStock')} ${s}">
          </div>`;
        }).join('')}
      </div>`;

    box.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => {
      const set = SEED.sizeSets[b.dataset.preset];
      SEED.sizeScale.forEach(s => {
        const cur = d.sizes[s] || { on: false, stock: 0 };
        // Una talla con existencias no se desmarca sola: el inventario no desaparece.
        d.sizes[s] = { on: set.includes(s) || cur.stock > 0 && cur.on, stock: cur.stock };
      });
      this.renderPfDyn();
    });
    box.querySelectorAll('[data-sz]').forEach(c => c.onchange = () => {
      const cur = d.sizes[c.dataset.sz] || { on: false, stock: 0 };
      d.sizes[c.dataset.sz] = { on: c.checked, stock: cur.stock };
      this.renderPfDyn();
    });
    box.querySelectorAll('[data-sz-stock]').forEach(i => i.onchange = () => {
      d.sizes[i.dataset.szStock].stock = Math.max(0, parseInt(i.value) || 0);
    });
  },

  saveProductForm() {
    const d = this.draft;
    const existing = d.existing;
    const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const checked = name => [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(i => i.value);

    const name = val('pfName');
    const sku = val('pfSku').toUpperCase().replace(/\s+/g, '-');
    const price = parseFloat(val('pfPrice')) || 0;
    const stores = checked('pfStore');

    let bad = false;
    const mark = (i, e, cond) => {
      const inp = document.getElementById(i), err = document.getElementById(e);
      if (cond) { inp.classList.add('error'); if (err) err.classList.add('show'); bad = true; }
      else { inp.classList.remove('error'); if (err) err.classList.remove('show'); }
    };
    mark('pfName', 'pfErrName', !name);
    mark('pfSku', 'pfErrSku', !sku);
    // Un producto que no se vende en ninguna tienda (uso interno) puede no tener precio.
    mark('pfPrice', null, stores.length > 0 && price <= 0);
    if (bad) { UI.toast('danger', I18N.t('adm.pf.missingData'), I18N.t('adm.pf.missingDataBody')); return; }

    if (Store.products.some(x => x.sku === sku && (!existing || x.id !== existing.id))) {
      UI.toast('danger', I18N.t('adm.pf.dupeSku'), I18N.t('adm.pf.dupeSkuBody', { sku }));
      return;
    }

    const sizes = SEED.sizeScale.filter(s => d.sizes[s] && d.sizes[s].on).map(s => ({ size: s, stock: d.sizes[s].stock }));
    if (!d.kit && !sizes.length) { UI.toast('danger', I18N.t('adm.pf.missingData'), I18N.t('adm.pf.needSize')); return; }
    if (d.kit && !d.components.length) { UI.toast('danger', I18N.t('adm.pf.missingData'), I18N.t('adm.pf.needComponent')); return; }
    if (d.kit && new Set(d.components.map(c => c.productId)).size !== d.components.length) {
      UI.toast('danger', I18N.t('adm.pf.missingData'), I18N.t('adm.pf.dupeComponent'));
      return;
    }

    const cats = checked('pfCat');
    const payload = {
      name, sku, price, stores,
      kind: d.kit ? 'kit' : val('pfKind'),
      categories: cats.length ? cats : ['player'],
      line: val('pfLine'),
      description: val('pfDesc'),
      cost: d.kit ? 0 : (parseFloat(val('pfCost')) || 0),
      minStock: d.kit ? 0 : (parseInt(val('pfMin')) || 0),
      active: document.getElementById('pfActive').checked,
      featured: document.getElementById('pfFeat').checked,
      image: d.image,
      colorHex: existing ? existing.colorHex : '#16181d'
    };
    if (!existing || existing.image !== d.image) payload.images = d.image ? [d.image] : [];
    if (d.kit) payload.components = d.components;
    else payload.sizes = sizes;
    if (existing) payload.id = existing.id;

    const r = Store.saveProduct(payload);
    if (!r.ok) { UI.toast('danger', I18N.t('adm.pf.missingData'), r.error || ''); return; }
    if (!Store.save()) UI.toast('warn', I18N.t('adm.pf.storageTitle'), I18N.t('adm.pf.storageBody'));

    UI.closeModal();
    App.refreshAll();
    if (existing) UI.toast('ok', I18N.t('adm.pf.updated'), I18N.t('adm.pf.updatedBody', { name }));
    else {
      const count = d.kit ? d.components.length : r.product.variants.length;
      UI.toast('ok', I18N.t('adm.pf.created'),
        I18N.t(d.kit ? 'adm.pf.createdKitBody' : (count === 1 ? 'adm.pf.createdBodyOne' : 'adm.pf.createdBody'), { name, count }));
    }
  },

  /* ============================================================
     MOVIMIENTOS
     ============================================================ */
  movementsHTML() {
    const f = this.f.mov;
    let list = Store.movements.slice();

    if (f.type !== 'todos') list = list.filter(m => m.type === f.type);
    if (f.reason !== 'todos') list = list.filter(m => m.reason === f.reason);
    if (f.q) {
      const q = f.q;
      list = list.filter(m =>
        m.product.toLowerCase().includes(q) || m.sku.toLowerCase().includes(q) ||
        m.ref.toLowerCase().includes(q) || m.user.toLowerCase().includes(q) ||
        UI.reason(m.reason).toLowerCase().includes(q));
    }

    const allReasons = [...new Set(Store.movements.map(m => m.reason))].sort((a, b) => UI.reason(a).localeCompare(UI.reason(b)));
    const ins  = list.filter(m => m.type === 'entrada').reduce((s, m) => s + m.qty, 0);
    const outs = list.filter(m => m.type === 'salida').reduce((s, m) => s + m.qty, 0);

    return this.head(
      I18N.t('adm.movements.title'),
      I18N.t('adm.movements.sub'),
      `<button class="btn btn-sm" id="movExport">${I18N.t('adm.movements.exportBtn')}</button>
       <button class="btn btn-primary btn-sm" id="movNew">${I18N.t('adm.movements.newBtn')}</button>`
    ) + `
    <div class="kpi-grid">
      <div class="kpi kpi-principal"><div class="kpi-label">${I18N.t('adm.movements.kpiListed')}</div><div class="kpi-value">${list.length}</div><div class="kpi-foot">${I18N.t('adm.movements.kpiListedFoot', { total: Store.movements.length })}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.movements.kpiIn')}</div><div class="kpi-value">+${UI.num(ins)}</div><div class="kpi-foot">${I18N.t('adm.movements.kpiInFoot')}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.movements.kpiOut')}</div><div class="kpi-value">−${UI.num(outs)}</div><div class="kpi-foot">${I18N.t('adm.movements.kpiOutFoot')}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.movements.kpiNet')}</div><div class="kpi-value">${ins - outs >= 0 ? '+' : ''}${UI.num(ins - outs)}</div><div class="kpi-foot">${I18N.t('adm.movements.kpiNetFoot')}</div></div>
    </div>

    <div class="card">
      <div class="filter-bar">
        ${this.searchBox('movQ', f, I18N.t('adm.movements.searchPh'))}
        <select class="select" id="movType">
          <option value="todos">${I18N.t('adm.movements.allTypes')}</option>
          <option value="entrada"${f.type === 'entrada' ? ' selected' : ''}>${I18N.t('adm.movements.onlyIn')}</option>
          <option value="salida"${f.type === 'salida' ? ' selected' : ''}>${I18N.t('adm.movements.onlyOut')}</option>
        </select>
        <select class="select" id="movReason">
          <option value="todos">${I18N.t('adm.movements.allReasons')}</option>
          ${allReasons.map(r => `<option value="${UI.esc(r)}"${f.reason === r ? ' selected' : ''}>${UI.esc(UI.reason(r))}</option>`).join('')}
        </select>
      </div>

      <div class="card-body flush">
        ${list.length ? `
        <div class="table-wrap">
          <table class="data">
            <thead><tr>
              <th>${I18N.t('adm.movements.colDate')}</th><th>${I18N.t('adm.movements.colProductVariant')}</th><th>${I18N.t('adm.movements.colSku')}</th><th>${I18N.t('adm.movements.colType')}</th>
              <th>${I18N.t('adm.movements.colReason')}</th><th>${I18N.t('adm.movements.colRef')}</th><th class="right">${I18N.t('adm.movements.colChange')}</th>
              <th class="right">${I18N.t('adm.movements.colBeforeAfter')}</th><th>${I18N.t('adm.movements.colUser')}</th>
            </tr></thead>
            <tbody>
              ${list.slice(0, 120).map(m => `
                <tr>
                  <td class="nowrap"><div>${UI.date(m.date)}</div><div class="cell-sub">${UI.time(m.date)}</div></td>
                  <td><div class="cell-main">${UI.esc(m.product)}</div><div class="cell-sub">${I18N.t('shop.size')} ${UI.esc(UI.sizeLabel(m.variant))}</div></td>
                  <td class="mono tiny">${UI.esc(m.sku)}</td>
                  <td>${m.type === 'entrada'
                        ? `<span class="badge badge-ok">${I18N.t('adm.movements.badgeIn')}</span>`
                        : `<span class="badge badge-danger">${I18N.t('adm.movements.badgeOut')}</span>`}</td>
                  <td>${UI.esc(UI.reason(m.reason))}</td>
                  <td class="mono tiny">${UI.esc(m.ref)}</td>
                  <td class="right"><span class="mov-delta ${m.type === 'entrada' ? 'in' : 'out'}">${m.type === 'entrada' ? '+' : '−'}${m.qty}</span></td>
                  <td class="right"><span class="mov-flow"><span class="from">${m.before}</span><span class="arrow">→</span><span class="to">${m.after}</span></span></td>
                  <td class="tiny">${UI.esc(m.user)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        ${list.length > 120 ? `<div class="pager"><span class="muted tiny">${I18N.t('adm.movements.showingRecent', { n: 120, total: list.length })}</span></div>` : ''}
        ` : UI.empty(I18N.t('adm.movements.emptyTitle'), I18N.t('adm.movements.emptyBody'))}
      </div>
    </div>`;
  },

  movementsBind() {
    this.bindSearch('movQ', this.f.mov, 'movements');
    this.bindSelect('movType', this.f.mov, 'type', 'movements');
    this.bindSelect('movReason', this.f.mov, 'reason', 'movements');
    document.getElementById('movNew').onclick = () => this.movementForm();
    document.getElementById('movExport').onclick = () => {
      const lines = [[
        I18N.t('adm.movements.csvDate'), I18N.t('adm.movements.csvSku'), I18N.t('adm.movements.csvProduct'),
        I18N.t('adm.movements.csvVariant'), I18N.t('adm.movements.csvType'), I18N.t('adm.movements.csvQty'),
        I18N.t('adm.movements.csvReason'), I18N.t('adm.movements.csvRef'), I18N.t('adm.movements.csvBefore'),
        I18N.t('adm.movements.csvAfter'), I18N.t('adm.movements.csvUser')
      ].join(',')];
      Store.movements.forEach(m => lines.push([
        m.date, m.sku, `"${m.product}"`, m.variant, m.type, m.qty,
        `"${UI.reason(m.reason)}"`, m.ref, m.before, m.after, `"${m.user}"`
      ].join(',')));
      UI.download('movements_soccercage.csv', lines.join('\n'));
      UI.toast('ok', I18N.t('adm.movements.exportDone'), I18N.t('adm.movements.exportDoneBody'));
    };
  },

  /* ============================================================
     ENTREGAS — salidas que no son venta
     Academia: tallas reportadas en PlayMetrics. Clínica: camiseta incluida.
     ============================================================ */
  deliveryState(e) {
    if (e.status === 'entregado') return 'done';
    const plan = Store.deliveryPlan(e.id);
    if (!plan) return 'nosize';
    if (plan.lines.some(l => !l.size)) return 'nosize';
    return plan.ok ? 'ready' : 'nostock';
  },

  deliveriesHTML() {
    const f = this.f.del;
    const all = Store.roster.map(e => ({ e, state: this.deliveryState(e) }));

    let list = all;
    if (f.program !== 'todos') list = list.filter(x => x.e.program === f.program);
    if (f.status !== 'todos') list = list.filter(x => x.state === f.status);
    if (f.q) list = list.filter(x =>
      x.e.player.toLowerCase().includes(f.q) || (x.e.email || '').toLowerCase().includes(f.q) || (x.e.team || '').toLowerCase().includes(f.q));

    const rank = { nostock: 0, nosize: 1, ready: 2, done: 3 };
    list = list.slice().sort((a, b) => rank[a.state] - rank[b.state] || a.e.player.localeCompare(b.e.player));

    const count = s => all.filter(x => x.state === s).length;
    const stateBadge = (x) => {
      if (x.state === 'done') return `<span class="badge badge-ok"><span class="dot"></span>${I18N.t('adm.del.stDone')}</span><div class="cell-sub mono">${UI.esc(x.e.ref)} · ${UI.date(x.e.deliveredAt)}</div>`;
      if (x.state === 'ready') return `<span class="badge badge-info"><span class="dot"></span>${I18N.t('adm.del.stReady')}</span>`;
      if (x.state === 'nosize') return `<span class="badge badge-warn"><span class="dot"></span>${I18N.t('adm.del.stNoSize')}</span>`;
      return `<span class="badge badge-danger"><span class="dot"></span>${I18N.t('adm.del.stNoStock')}</span>`;
    };

    return this.head(
      I18N.t('adm.del.title'),
      I18N.t('adm.del.sub'),
      `<button class="btn btn-sm" id="delTemplate">${I18N.t('adm.del.templateBtn')}</button>
       <button class="btn btn-primary btn-sm" id="delImport">${I18N.t('adm.del.importBtn')}</button>`
    ) + `
    <div class="kpi-grid">
      <div class="kpi kpi-principal"><div class="kpi-label">${I18N.t('adm.del.kpiReady')}</div><div class="kpi-value">${count('ready')}</div><div class="kpi-foot">${I18N.t('adm.del.kpiReadyFoot')}</div></div>
      <div class="kpi ${count('nosize') ? 'kpi-alerta' : ''}"><div class="kpi-label">${I18N.t('adm.del.kpiNoSize')}</div><div class="kpi-value">${count('nosize')}</div><div class="kpi-foot">${I18N.t('adm.del.kpiNoSizeFoot')}</div></div>
      <div class="kpi ${count('nostock') ? 'kpi-critico' : ''}"><div class="kpi-label">${I18N.t('adm.del.kpiNoStock')}</div><div class="kpi-value">${count('nostock')}</div><div class="kpi-foot">${I18N.t('adm.del.kpiNoStockFoot')}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.del.kpiDone')}</div><div class="kpi-value">${count('done')}</div><div class="kpi-foot">${I18N.t('adm.del.kpiDoneFoot', { n: all.length })}</div></div>
    </div>

    <div class="card">
      <div class="filter-bar">
        ${this.searchBox('delQ', f, I18N.t('adm.del.searchPh'))}
        <select class="select" id="delProgram">
          <option value="todos">${I18N.t('adm.del.allPrograms')}</option>
          ${Store.programs.map(p => `<option value="${p.id}"${f.program === p.id ? ' selected' : ''}>${I18N.t('program.' + p.id)}</option>`).join('')}
        </select>
        <select class="select" id="delStatus">
          <option value="todos">${I18N.t('adm.del.allStatuses')}</option>
          ${[['ready', 'adm.del.stReady'], ['nosize', 'adm.del.stNoSize'], ['nostock', 'adm.del.stNoStock'], ['done', 'adm.del.stDone']]
            .map(([v, k]) => `<option value="${v}"${f.status === v ? ' selected' : ''}>${I18N.t(k)}</option>`).join('')}
        </select>
      </div>

      <div class="card-body flush">
        ${list.length ? `
        <div class="table-wrap">
          <table class="data">
            <thead><tr>
              <th>${I18N.t('adm.del.colPlayer')}</th><th>${I18N.t('adm.del.colGuardian')}</th><th>${I18N.t('adm.del.colProgram')}</th>
              <th>${I18N.t('adm.del.colPackage')}</th><th>${I18N.t('adm.del.colSize')}</th><th>${I18N.t('adm.del.colStatus')}</th>
              <th class="right">${I18N.t('adm.del.colActions')}</th>
            </tr></thead>
            <tbody>
              ${list.map(x => {
                const e = x.e;
                const prog = Store.program(e.program);
                const pkg = Store.product(prog.packages[e.role] || prog.packages.player);
                const sizeCell = e.size
                  ? `<b>${UI.esc(e.size)}</b>${e.sockSize ? ` <span class="muted tiny">· ${I18N.t('adm.del.socks')} ${UI.esc(e.sockSize)}</span>` : ''}`
                  : (e.status === 'entregado'
                      ? UI.esc((e.items || []).map(i => i.size).join(' / '))
                      : `<select class="select select-sm" data-set-size="${e.id}" aria-label="${I18N.t('shop.size')}">
                          <option value="">${I18N.t('adm.del.pickSize')}</option>
                          ${SEED.sizeSets.apparel.map(s => `<option>${s}</option>`).join('')}
                        </select>`);
                return `<tr>
                  <td><div class="cell-main">${UI.esc(e.player)}</div><div class="cell-sub">${UI.esc(e.team || '—')} · ${I18N.t('cat.' + (e.role === 'goalkeeper' ? 'goalkeeper' : 'player'))}</div></td>
                  <td class="tiny">${UI.esc(e.email || '—')}</td>
                  <td><span class="badge badge-neutral">${I18N.t('program.' + e.program)}</span><div class="cell-sub">${UI.esc(prog.source)}</div></td>
                  <td>${pkg ? UI.esc(pkg.name) : '—'}</td>
                  <td class="nowrap">${sizeCell}</td>
                  <td>${stateBadge(x)}</td>
                  <td class="right nowrap">
                    ${e.status === 'entregado'
                      ? `<button class="btn btn-sm btn-ghost" data-undo="${e.id}">${I18N.t('adm.del.undoBtn')}</button>`
                      : `<button class="btn btn-sm ${x.state === 'ready' ? 'btn-primary' : ''}" data-deliver="${e.id}">${I18N.t('adm.del.deliverBtn')}</button>`}
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : UI.empty(I18N.t('adm.del.emptyTitle'), I18N.t('adm.del.emptyBody'))}
      </div>
    </div>`;
  },

  deliveriesBind() {
    this.bindSearch('delQ', this.f.del, 'deliveries');
    this.bindSelect('delProgram', this.f.del, 'program', 'deliveries');
    this.bindSelect('delStatus', this.f.del, 'status', 'deliveries');

    document.getElementById('delTemplate').onclick = () => {
      UI.download('playmetrics_roster_template.csv',
        'player,guardian_email,team,role,jersey_size,sock_size\nJohn Doe,parent@email.com,U10 Blue,player,YM,S\nJane Doe,parent2@email.com,U12 Red,goalkeeper,YL,M');
    };
    document.getElementById('delImport').onclick = () => this.importForm();

    document.querySelectorAll('[data-set-size]').forEach(s => s.onchange = () => {
      if (!s.value) return;
      Store.updateRoster(s.dataset.setSize, { size: s.value });
      this.renderPage('deliveries');
      UI.toast('ok', I18N.t('adm.del.sizeSaved'), I18N.t('adm.del.sizeSavedBody', { size: s.value }));
    });
    document.querySelectorAll('[data-deliver]').forEach(b => b.onclick = () => this.deliverForm(b.dataset.deliver));
    document.querySelectorAll('[data-undo]').forEach(b => b.onclick = () => {
      const e = Store.rosterEntry(b.dataset.undo);
      UI.confirm(I18N.t('adm.del.undoTitle'), I18N.t('adm.del.undoBody', { player: `<strong>${UI.esc(e.player)}</strong>`, ref: UI.esc(e.ref) }), () => {
        Store.undoDelivery(e.id);
        App.refreshAll();
        UI.toast('ok', I18N.t('adm.del.undoneTitle'), I18N.t('adm.del.undoneBody'));
      }, true);
    });
  },

  /** Confirmación de entrega: pieza por pieza, con la talla y el stock a la vista. */
  deliverForm(entryId, overrides) {
    overrides = overrides || {};
    const plan = Store.deliveryPlan(entryId, overrides);
    if (!plan) return;
    const e = plan.entry;

    const html = `
      <div class="modal-head">
        <div>
          <h2>${I18N.t('adm.del.formTitle', { player: UI.esc(e.player) })}</h2>
          <p class="muted tiny" style="margin-top:2px">${I18N.t('program.' + e.program)} · ${UI.esc(plan.package.name)}</p>
        </div>
        ${UI.closeBtn()}
      </div>
      <div class="modal-body">
        <p class="muted" style="font-size:13.5px;line-height:1.6;margin-bottom:14px">${I18N.t('adm.del.formIntro')}</p>
        <div class="kit-rows">
          ${plan.lines.map(l => {
            const one = l.product.variants.length === 1 && l.product.variants[0].size === 'U';
            return `
            <div class="kit-row ${l.ok ? '' : 'bad'}">
              ${UI.thumb(l.product)}
              <div class="kit-row-name"><span class="q">${l.qty}×</span> ${UI.esc(l.product.name)}
                <div class="cell-sub">${l.variant ? I18N.t('adm.del.inStock', { n: l.available }) : I18N.t('adm.del.needsSize')}</div>
              </div>
              ${one ? `<span class="muted tiny">${I18N.t('size.one')}</span>` : `
              <select class="select" data-ov="${l.product.id}">
                <option value="">${I18N.t('kit.pick')}</option>
                ${l.product.variants.map(v => `<option value="${v.size}"${l.size === v.size ? ' selected' : ''}>${v.size} — ${Store.available(v)}</option>`).join('')}
              </select>`}
            </div>`;
          }).join('')}
        </div>
        ${plan.ok ? '' : `<div class="alert alert-danger" style="margin:14px 0 0">${UI.infoIcon()}<div><div class="alert-title">${I18N.t('adm.del.blockedTitle')}</div><div class="alert-body">${I18N.t('adm.del.blockedBody')}</div></div></div>`}
      </div>
      <div class="modal-foot">
        <button class="btn" onclick="UI.closeModal()">${I18N.t('ui.cancel')}</button>
        <button class="btn btn-primary" id="delGo" ${plan.ok ? '' : 'disabled'}>${I18N.t('adm.del.confirmBtn')}</button>
      </div>`;
    // Al cambiar una talla se repinta conservando el desplazamiento.
    if (document.getElementById('delGo')) UI.rerenderModal(html); else UI.modal(html);

    document.querySelectorAll('[data-ov]').forEach(s => s.onchange = () => {
      overrides[s.dataset.ov] = s.value;
      this.deliverForm(entryId, overrides);
    });

    document.getElementById('delGo').onclick = () => {
      const r = Store.deliver(entryId, overrides);
      if (!r.ok) { UI.toast('danger', I18N.t('adm.del.blockedTitle'), r.error); return; }
      UI.closeModal();
      App.refreshAll();
      UI.toast('ok', I18N.t('adm.del.doneTitle'), I18N.t('adm.del.doneBody', { player: e.player, ref: r.ref }));
    };
  },

  importForm() {
    UI.modal(`
      <div class="modal-head"><h2>${I18N.t('adm.del.importTitle')}</h2>${UI.closeBtn()}</div>
      <div class="modal-body">
        <p class="muted" style="font-size:13.5px;line-height:1.6;margin-bottom:14px">${I18N.t('adm.del.importIntro')}</p>
        <div class="field">
          <label for="imProgram">${I18N.t('adm.del.colProgram')}</label>
          <select class="select" id="imProgram">
            ${Store.programs.map(p => `<option value="${p.id}">${I18N.t('program.' + p.id)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="imFile">${I18N.t('adm.del.importFile')}</label>
          <input class="input" type="file" id="imFile" accept=".csv,text/csv,text/plain">
        </div>
        <div class="field">
          <label for="imText">${I18N.t('adm.del.importPaste')}</label>
          <textarea class="input mono" id="imText" rows="6" placeholder="player,guardian_email,team,role,jersey_size,sock_size"></textarea>
          <div class="hint">${I18N.t('adm.del.importHint')}</div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn" onclick="UI.closeModal()">${I18N.t('ui.cancel')}</button>
        <button class="btn btn-primary" id="imGo">${I18N.t('adm.del.importGo')}</button>
      </div>`);

    document.getElementById('imFile').onchange = ev => {
      const file = ev.target.files[0];
      if (!file) return;
      const r = new FileReader();
      r.onload = () => { document.getElementById('imText').value = r.result; };
      r.readAsText(file);
    };

    document.getElementById('imGo').onclick = () => {
      const r = Store.importRoster(document.getElementById('imText').value, document.getElementById('imProgram').value);
      if (!r.added && !r.skipped) { UI.toast('warn', I18N.t('adm.del.importEmpty'), I18N.t('adm.del.importEmptyBody')); return; }
      UI.closeModal();
      App.refreshAll();
      UI.toast('ok', I18N.t('adm.del.importDone'), I18N.t('adm.del.importDoneBody', { added: r.added, skipped: r.skipped }));
    };
  },

  /* ============================================================
     PEDIDOS
     ============================================================ */
  ordersHTML() {
    const f = this.f.ord;
    let list = Store.orders.slice();

    if (f.store !== 'todos') list = list.filter(o => o.storeId === f.store);
    if (f.status !== 'todos') list = list.filter(o => o.status === f.status);
    if (f.q) {
      list = list.filter(o => {
        const c = this.customerOf(o);
        return o.number.toLowerCase().includes(f.q) ||
          (c && (c.name.toLowerCase().includes(f.q) || c.email.toLowerCase().includes(f.q))) ||
          o.items.some(i => (i.player || '').toLowerCase().includes(f.q));
      });
    }

    const count = s => Store.orders.filter(o => o.status === s).length;
    const paid = Store.orders.filter(o => o.paymentStatus === 'pagado');
    const revenue = paid.reduce((s, o) => s + o.total, 0);
    const tax = paid.reduce((s, o) => s + (o.tax || 0), 0);

    return this.head(I18N.t('adm.orders.title'), I18N.t('adm.orders.sub')) + `
    <div class="kpi-grid">
      <div class="kpi ${count('pendiente') ? 'kpi-alerta' : ''}"><div class="kpi-label">${I18N.t('adm.orders.kpiPending')}</div><div class="kpi-value">${count('pendiente')}</div><div class="kpi-foot">${I18N.t('adm.orders.kpiPendingFoot')}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.orders.kpiProcessing')}</div><div class="kpi-value">${count('procesando')}</div><div class="kpi-foot">${I18N.t('adm.orders.kpiProcessingFoot')}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.orders.kpiShipped')}</div><div class="kpi-value">${count('enviado')}</div><div class="kpi-foot">${I18N.t('adm.orders.kpiShippedFoot')}</div></div>
      <div class="kpi kpi-principal"><div class="kpi-label">${I18N.t('adm.orders.kpiRevenue')}</div><div class="kpi-value">${UI.money0(revenue)}</div><div class="kpi-foot">${I18N.t('adm.orders.kpiRevenueFoot', { tax: UI.money(tax) })}</div></div>
    </div>

    <div class="card">
      <div class="filter-bar">
        ${this.searchBox('ordQ', f, I18N.t('adm.orders.searchPh'))}
        <select class="select" id="ordStore">${this.storeOptions(f.store)}</select>
        <select class="select" id="ordStatus">
          <option value="todos">${I18N.t('adm.orders.allStatuses')}</option>
          ${['pendiente', 'procesando', 'enviado', 'completado', 'cancelado'].map(s =>
            `<option value="${s}"${f.status === s ? ' selected' : ''}>${I18N.t('adm.orders.status.' + s)}</option>`).join('')}
        </select>
      </div>

      <div class="card-body flush">
        ${list.length ? `
        <div class="table-wrap">
          <table class="data">
            <thead><tr>
              <th>${I18N.t('adm.orders.colOrder')}</th><th>${I18N.t('adm.orders.colCustomer')}</th><th>${I18N.t('adm.orders.colDate')}</th>
              <th>${I18N.t('adm.orders.colItems')}</th><th>${I18N.t('adm.orders.colDelivery')}</th>
              <th class="right">${I18N.t('adm.orders.colTotal')}</th><th>${I18N.t('adm.orders.colPayment')}</th><th>${I18N.t('adm.orders.colStatus')}</th><th class="right">${I18N.t('adm.orders.colActions')}</th>
            </tr></thead>
            <tbody>
              ${list.map(o => {
                const c = this.customerOf(o);
                const kits = o.items.filter(i => i.kind === 'kit').reduce((s, i) => s + i.qty, 0);
                const singles = o.items.filter(i => i.kind !== 'kit').reduce((s, i) => s + i.qty, 0);
                const parts = [];
                if (kits) parts.push(I18N.t(kits === 1 ? 'adm.orders.kitOne' : 'adm.orders.kitMany', { n: kits }));
                if (singles) parts.push(I18N.t(singles === 1 ? 'adm.orders.pieceOne' : 'adm.orders.pieceMany', { n: singles }));
                return `<tr>
                  <td><div class="cell-main mono">${o.number}</div><div class="cell-sub">${UI.esc(UI.storeName(o.storeId))}</div></td>
                  <td><div class="cell-main">${UI.esc(c ? c.name : '—')}</div><div class="cell-sub">${UI.esc(c ? c.email : '')}</div></td>
                  <td class="nowrap">${UI.date(o.date)}<div class="cell-sub">${UI.time(o.date)}</div></td>
                  <td>${parts.join(' + ')}${kits ? `<div class="cell-sub">${UI.esc(o.items.filter(i => i.kind === 'kit' && i.player).map(i => i.player).join(', '))}</div>` : ''}</td>
                  <td>${UI.fulfillBadge(o.fulfillment)}</td>
                  <td class="right"><strong>${UI.money(o.total)}</strong><div class="cell-sub">${I18N.t('adm.orders.taxIncl', { tax: UI.money(o.tax || 0) })}</div></td>
                  <td>${UI.payBadge(o.paymentStatus)}</td>
                  <td>${UI.orderBadge(o.status, o.fulfillment)}</td>
                  <td class="right"><button class="btn btn-sm" data-order="${o.id}">${I18N.t('adm.orders.viewDetail')}</button></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : UI.empty(I18N.t('adm.orders.emptyTitle'), I18N.t('adm.orders.emptyBody'))}
      </div>
    </div>`;
  },

  ordersBind() {
    this.bindSearch('ordQ', this.f.ord, 'orders');
    this.bindSelect('ordStatus', this.f.ord, 'status', 'orders');
    this.bindSelect('ordStore', this.f.ord, 'store', 'orders');
    document.querySelectorAll('[data-order]').forEach(b => b.onclick = () => this.orderDetail(b.dataset.order));
  },

  orderDetail(id) {
    const o = Store.orders.find(x => x.id === id);
    if (!o) return;
    const c = this.customerOf(o);
    const related = Store.movements.filter(m => m.ref === o.number);
    const pickup = o.fulfillment === 'pickup';
    const a = o.address;

    const flow = ['pendiente', 'procesando', 'enviado', 'completado'];
    const idx = flow.indexOf(o.status);
    const label = s => UI.orderStatusLabel(s, o.fulfillment);

    UI.modal(`
      <div class="modal-head">
        <div>
          <h2>${I18N.t('adm.orders.detail.title', { number: o.number })}</h2>
          <p class="muted tiny" style="margin-top:3px">${UI.esc(UI.storeName(o.storeId))} · ${UI.date(o.date, true)} · ${UI.esc(o.paymentMethod)}</p>
        </div>
        ${UI.closeBtn()}
      </div>

      <div class="modal-body">
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px">
          ${UI.orderBadge(o.status, o.fulfillment)} ${UI.payBadge(o.paymentStatus)} ${UI.fulfillBadge(o.fulfillment)}
        </div>

        ${o.status !== 'cancelado' ? `
        <div class="steps" style="margin-bottom:20px">
          ${flow.map((s, i) => `
            <div class="step ${i < idx ? 'done' : ''} ${i === idx ? 'active' : ''}">
              <span class="n">${i < idx ? '✓' : i + 1}</span> ${label(s)}
            </div>${i < flow.length - 1 ? '<div class="step-line"></div>' : ''}`).join('')}
        </div>` : `
        <div class="alert alert-danger">
          <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
          <div><div class="alert-title">${I18N.t('adm.orders.detail.cancelledTitle')}</div><div class="alert-body">${I18N.t('adm.orders.detail.cancelledBody')}</div></div>
        </div>`}

        <div class="grid-halves" style="margin-bottom:18px">
          <div>
            <h3 style="margin-bottom:10px">${I18N.t('adm.orders.detail.customer')}</h3>
            <div class="kv"><span class="k">${I18N.t('adm.orders.detail.name')}</span><span class="v">${UI.esc(c ? c.name : '—')}</span></div>
            <div class="kv"><span class="k">${I18N.t('adm.orders.detail.email')}</span><span class="v">${UI.esc(c ? c.email : '—')}</span></div>
            <div class="kv"><span class="k">${I18N.t('adm.orders.detail.phone')}</span><span class="v">${UI.esc(c ? c.phone : '—')}</span></div>
            <div class="kv"><span class="k">${I18N.t('adm.orders.detail.delivery')}</span><span class="v" style="text-align:right">${pickup
              ? I18N.t('fulfill.pickup.' + (I18N.has('fulfill.pickup.' + o.storeId) ? o.storeId : 'generic'))
              : UI.esc(a ? [a.line, a.city, a.state + ' ' + a.zip].join(', ') : '—') + ' · USPS'}</span></div>
          </div>
          <div>
            <h3 style="margin-bottom:10px">${I18N.t('adm.orders.detail.amount')}</h3>
            <div class="kv"><span class="k">${I18N.t('adm.orders.detail.subtotal')}</span><span class="v">${UI.money(o.subtotal)}</span></div>
            <div class="kv"><span class="k">${I18N.t('cart.tax', { tax: UI.pct(o.taxRate) })}</span><span class="v">${UI.money(o.tax || 0)}</span></div>
            <div class="kv"><span class="k">${I18N.t('adm.orders.detail.shipping')}</span><span class="v">${o.shipping ? UI.money(o.shipping) : I18N.t('fulfill.noShipping')}</span></div>
            <div class="kv" style="font-size:16px"><span class="k"><b>${I18N.t('adm.orders.detail.total')}</b></span><span class="v">${UI.money(o.total)}</span></div>
          </div>
        </div>

        <h3 style="margin-bottom:10px">${I18N.t('adm.orders.detail.items')}</h3>
        <div class="table-wrap" style="border:1px solid var(--border);border-radius:var(--r-md)">
          <table class="data">
            <thead><tr><th>${I18N.t('adm.orders.detail.colProduct')}</th><th>${I18N.t('adm.orders.detail.colSku')}</th><th class="right">${I18N.t('adm.orders.detail.colQty')}</th><th class="right">${I18N.t('adm.orders.detail.colPrice')}</th><th class="right">${I18N.t('adm.orders.detail.colTotal')}</th></tr></thead>
            <tbody>
              ${o.items.map(i => `
                <tr>
                  <td><div class="cell-main">${UI.esc(i.name)}${i.kind === 'kit' ? ` <span class="badge badge-gold">${I18N.t('kind.kit')}</span>` : ''}</div>
                      <div class="cell-sub">${i.kind === 'kit' ? (i.player ? I18N.t('adm.orders.detail.player', { name: Shop.playerLine(i) }) : '') : I18N.t('shop.size') + ' ' + UI.esc(UI.sizeLabel(i.size))}</div></td>
                  <td class="mono tiny">${UI.esc(i.sku)}</td>
                  <td class="right">${i.qty}</td>
                  <td class="right mono">${UI.money(i.price)}</td>
                  <td class="right mono"><strong>${UI.money(i.price * i.qty)}</strong></td>
                </tr>
                ${i.kind === 'kit' ? i.components.map(k => `
                <tr class="sub-row">
                  <td><div class="cell-sub">↳ ${UI.esc(k.name)} · ${I18N.t('shop.size')} <b>${UI.esc(UI.sizeLabel(k.size))}</b></div></td>
                  <td class="mono tiny muted">${UI.esc(k.sku)}</td>
                  <td class="right muted">${k.qty * i.qty}</td><td></td><td></td>
                </tr>`).join('') : ''}`).join('')}
            </tbody>
          </table>
        </div>

        ${related.length ? `
        <h3 style="margin:20px 0 10px">${I18N.t('adm.orders.detail.invImpact')}</h3>
        <div class="trace" style="margin-top:0">
          <div class="trace-title">${I18N.t('adm.orders.detail.generatedMovements')}</div>
          ${related.map(m => `
            <div class="trace-line">
              <span>${UI.esc(m.sku)}<br><span class="muted tiny">${UI.esc(UI.reason(m.reason))} · ${UI.esc(m.user)}</span></span>
              <span class="nowrap"><span class="mono muted">${m.before}</span> → <b class="mono">${m.after}</b>
                <span class="trace-delta" style="color:${m.type === 'entrada' ? 'var(--ok-600)' : 'var(--danger-600)'}">(${m.type === 'entrada' ? '+' : '−'}${m.qty})</span></span>
            </div>`).join('')}
        </div>` : ''}

        ${o.label ? `
        <h3 style="margin:20px 0 10px">${I18N.t('adm.ship.labelTitle')}</h3>
        <div class="kv"><span class="k">${I18N.t('adm.ship.tracking')}</span><span class="v mono">${UI.esc(o.label.tracking)}</span></div>
        <div class="kv"><span class="k">${I18N.t('adm.ship.service')}</span><span class="v">${UI.esc(o.label.service)} · ${UI.money(o.label.cost)}${o.label.simulated ? ' · ' + I18N.t('adm.ship.simulated') : ''}</span></div>` : ''}

        ${(mail => mail ? `
        <div class="mail-row">
          ${UI.icon('mail')}
          <div style="flex:1;min-width:0">
            <div class="cell-main">${I18N.t('adm.mail.sentTo', { to: UI.esc(mail.to.join(', ')) })}</div>
            <div class="cell-sub">${UI.date(mail.date, true)} · ${I18N.t('adm.mail.simulatedNote')}</div>
          </div>
          <button class="btn btn-sm" id="odMail">${I18N.t('adm.mail.view')}</button>
        </div>` : '')(Store.emailForOrder(o.id))}
      </div>

      <div class="modal-foot">
        <button class="btn" onclick="UI.closeModal()">${I18N.t('ui.close')}</button>
        ${o.status !== 'cancelado' ? `<button class="btn btn-danger" id="odCancel">${I18N.t('adm.orders.detail.cancelOrder')}</button>` : ''}
        ${idx >= 0 && idx < flow.length - 1
          ? `<button class="btn btn-primary" id="odNext">${I18N.t('adm.orders.detail.markAs', { status: label(flow[idx + 1]) })}</button>` : ''}
      </div>`, 'wide');

    const mailBtn = document.getElementById('odMail');
    if (mailBtn) mailBtn.onclick = () => this.mailPreview(o.id, () => this.orderDetail(id));

    const next = document.getElementById('odNext');
    if (next) next.onclick = () => {
      Store.setOrderStatus(o.id, flow[idx + 1]);
      UI.closeModal();
      App.refreshAll();
      UI.toast('ok', I18N.t('adm.orders.detail.statusUpdated'), I18N.t('adm.orders.detail.statusUpdatedBody', { number: o.number, status: label(flow[idx + 1]) }));
    };

    const cancel = document.getElementById('odCancel');
    if (cancel) cancel.onclick = () => UI.confirm(
      I18N.t('adm.orders.detail.confirmCancelTitle'),
      I18N.t('adm.orders.detail.confirmCancelBody', { number: o.number }),
      () => {
        Store.setOrderStatus(o.id, 'cancelado');
        UI.closeModal();
        App.refreshAll();
        UI.toast('ok', I18N.t('adm.orders.detail.cancelledToast'), I18N.t('adm.orders.detail.cancelledToastBody'));
      }, true);
  },

  /* ---------- Correo de pedido (lo que recibe quien prepara las órdenes) ---------- */
  mailBody(o) {
    const c = this.customerOf(o) || {};
    const st = Store.storeCfg(o.storeId) || {};
    const a = o.address;
    const kits = o.items.filter(i => i.kind === 'kit');
    const row = (k, v) => `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;white-space:nowrap;vertical-align:top">${k}</td><td style="padding:4px 0">${v}</td></tr>`;
    return `
      <div class="mail">
        <div class="mail-brand" style="background:${UI.esc(st.brand || '#111')};color:${UI.inkFor(st.brand || '#111')}">${UI.esc(st.name || '')}</div>
        <div class="mail-body">
          <h2 style="margin:0 0 4px">${I18N.t('mail.heading', { number: o.number })}</h2>
          <p style="margin:0 0 16px;color:#6b7280">${UI.date(o.date, true)} · ${UI.esc(o.paymentMethod)}</p>
          ${kits.length ? `
          <h3 style="margin:0 0 8px">${I18N.t('mail.players')}</h3>
          <table style="border-collapse:collapse;width:100%;margin-bottom:16px">
            ${kits.map(i => `<tr style="border-top:1px solid #e5e7eb">
              <td style="padding:8px 12px 8px 0"><b>${UI.esc(i.player || '—')}</b><br><span style="color:#6b7280">${I18N.t('mail.born', { year: i.birthYear || '—' })}${i.team ? ' · ' + UI.esc(i.team) : ''}</span></td>
              <td style="padding:8px 0;text-align:right">${UI.esc(i.name)}<br><span style="color:#6b7280">${i.components.map(k => UI.esc(k.name) + ' ' + UI.esc(UI.sizeLabel(k.size))).join(' · ')}</span></td>
            </tr>`).join('')}
          </table>` : ''}
          <h3 style="margin:0 0 8px">${I18N.t('mail.items')}</h3>
          <table style="border-collapse:collapse;width:100%;margin-bottom:16px">
            ${o.items.map(i => `<tr style="border-top:1px solid #e5e7eb">
              <td style="padding:6px 0">${i.qty} × ${UI.esc(i.name)}${i.kind === 'kit' ? '' : ' · ' + UI.esc(UI.sizeLabel(i.size))}</td>
              <td style="padding:6px 0;text-align:right">${UI.money(i.price * i.qty)}</td></tr>`).join('')}
            <tr style="border-top:1px solid #e5e7eb"><td style="padding:6px 0"><b>${I18N.t('cart.total')}</b> <span style="color:#6b7280">(${I18N.t('cart.tax', { tax: UI.pct(o.taxRate) })} ${UI.money(o.tax)}${o.shipping ? ' · ' + I18N.t('cart.shipping') + ' ' + UI.money(o.shipping) : ''})</span></td><td style="padding:6px 0;text-align:right"><b>${UI.money(o.total)}</b></td></tr>
          </table>
          <h3 style="margin:0 0 8px">${I18N.t('mail.buyer')}</h3>
          <table style="border-collapse:collapse">
            ${row(I18N.t('adm.orders.detail.name'), UI.esc(c.name || '—'))}
            ${row(I18N.t('adm.orders.detail.email'), UI.esc(c.email || '—'))}
            ${row(I18N.t('adm.orders.detail.phone'), UI.esc(c.phone || '—'))}
            ${row(I18N.t('adm.orders.detail.delivery'), o.fulfillment === 'shipping' && a
              ? UI.esc([a.line, a.city, a.state + ' ' + a.zip].join(', ')) + ' · USPS'
              : I18N.t('fulfill.pickup.' + (I18N.has('fulfill.pickup.' + o.storeId) ? o.storeId : 'generic')))}
          </table>
        </div>
      </div>`;
  },

  mailPreview(orderId, back) {
    const o = Store.orders.find(x => x.id === orderId);
    const mail = Store.emailForOrder(orderId);
    if (!o || !mail) return;
    UI.modal(`
      <div class="modal-head">
        <div>
          <h2>${UI.esc(mail.subject)}</h2>
          <p class="muted tiny" style="margin-top:2px">${I18N.t('adm.mail.to')}: ${UI.esc(mail.to.join(', '))}</p>
        </div>
        ${UI.closeBtn()}
      </div>
      <div class="modal-body mail-wrap">
        <div class="demo-banner">${UI.infoIcon()} ${I18N.t('adm.mail.protoNote')}</div>
        ${this.mailBody(o)}
      </div>
      <div class="modal-foot">
        ${back ? `<button class="btn" id="mailBack">${I18N.t('adm.mail.back')}</button>` : ''}
        <button class="btn btn-primary" onclick="UI.closeModal()">${I18N.t('ui.close')}</button>
      </div>`, 'wide');
    const b = document.getElementById('mailBack');
    if (b) b.onclick = back;
  },

  /* ============================================================
     ENVÍOS — etiquetas y resumen del día
     Hoy cada envío son 5 pasos manuales en USPS. Aquí se seleccionan
     los pedidos, se generan las etiquetas de una vez y queda el
     resumen "N envíos · N pagos · N personas" para verificar.
     ============================================================ */
  shipmentsHTML() {
    const f = this.f.ship;
    const all = Store.orders.filter(o => o.status !== 'cancelado' && o.paymentStatus === 'pagado');
    const toShip = Store.pendingShipments();
    const toPickup = all.filter(o => o.fulfillment === 'pickup' && o.status !== 'completado');
    const today = Store.dayKey(new Date());
    const shippedToday = all.filter(o => o.label && Store.dayKey(o.label.createdAt) === today);
    const recent = all.filter(o => o.label).sort((a, b) => b.label.createdAt.localeCompare(a.label.createdAt)).slice(0, 20);
    const people = new Set(shippedToday.map(o => o.customerId)).size;
    const cost = shippedToday.reduce((s, o) => s + (o.label.cost || 0), 0);
    const kitsOf = o => o.items.filter(i => i.kind === 'kit').map(i => i.player).filter(Boolean);

    const row = o => {
      const c = this.customerOf(o) || {};
      const a = o.address || {};
      return `<tr>
        <td><input type="checkbox" data-ship="${o.id}" ${f.sel.includes(o.id) ? 'checked' : ''} aria-label="${o.number}"></td>
        <td><div class="cell-main mono">${o.number}</div><div class="cell-sub">${UI.esc(UI.storeName(o.storeId))} · ${UI.date(o.date)}</div></td>
        <td><div class="cell-main">${UI.esc(c.name || '—')}</div><div class="cell-sub">${UI.esc(kitsOf(o).join(', '))}</div></td>
        <td class="tiny">${UI.esc([a.line, a.city, (a.state || '') + ' ' + (a.zip || '')].join(', '))}</td>
        <td class="right">${o.items.reduce((s, i) => s + i.qty, 0)}</td>
        <td class="right mono">${UI.money(o.shipping)}</td>
      </tr>`;
    };

    return this.head(I18N.t('adm.ship.title'), I18N.t('adm.ship.sub'),
      `<button class="btn btn-sm" id="shipCsv">${I18N.t('adm.ship.csv')}</button>`) + `
    <div class="alert alert-info">
      ${UI.infoIcon()}
      <div><div class="alert-title">${I18N.t('adm.ship.protoTitle')}</div><div class="alert-body">${I18N.t('adm.ship.protoBody')}</div></div>
    </div>

    <div class="kpi-grid">
      <div class="kpi kpi-principal ${toShip.length ? 'kpi-alerta' : ''}"><div class="kpi-label">${I18N.t('adm.ship.kpiToShip')}</div><div class="kpi-value">${toShip.length}</div><div class="kpi-foot">${I18N.t('adm.ship.kpiToShipFoot')}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.ship.kpiToday')}</div><div class="kpi-value">${shippedToday.length}</div><div class="kpi-foot">${I18N.t('adm.ship.summary', { n: shippedToday.length, p: shippedToday.length, people })}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.ship.kpiCost')}</div><div class="kpi-value">${UI.money(cost)}</div><div class="kpi-foot">${I18N.t('adm.ship.kpiCostFoot')}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.ship.kpiPickup')}</div><div class="kpi-value">${toPickup.length}</div><div class="kpi-foot">${I18N.t('adm.ship.kpiPickupFoot')}</div></div>
    </div>

    <div class="card" style="margin-bottom:var(--s5)">
      <div class="card-head">
        <div><h2>${I18N.t('adm.ship.toShipTitle')}</h2><p class="muted tiny" style="margin-top:2px">${I18N.t('adm.ship.toShipSub')}</p></div>
        <div class="head-actions">
          <button class="btn btn-sm" id="shipAll" ${toShip.length ? '' : 'disabled'}>${I18N.t('adm.ship.selectAll')}</button>
          <button class="btn btn-primary btn-sm" id="shipGo" ${f.sel.length ? '' : 'disabled'}>${UI.icon('label')} ${f.sel.length ? I18N.t('adm.ship.create', { n: f.sel.length }) : I18N.t('adm.ship.createNone')}</button>
        </div>
      </div>
      <div class="card-body flush">
        ${toShip.length ? `
        <div class="table-wrap">
          <table class="data">
            <thead><tr><th style="width:36px"></th><th>${I18N.t('adm.orders.colOrder')}</th><th>${I18N.t('adm.ship.colWho')}</th><th>${I18N.t('adm.ship.colAddress')}</th><th class="right">${I18N.t('adm.orders.colItems')}</th><th class="right">${I18N.t('adm.ship.colCharged')}</th></tr></thead>
            <tbody>${toShip.map(row).join('')}</tbody>
          </table>
        </div>` : UI.empty(I18N.t('adm.ship.emptyTitle'), I18N.t('adm.ship.emptyBody'))}
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div><h2>${I18N.t('adm.ship.doneTitle')}</h2><p class="muted tiny" style="margin-top:2px">${I18N.t('adm.ship.doneSub')}</p></div>
        <button class="btn btn-sm" id="shipPrint" ${recent.length ? '' : 'disabled'}>${UI.icon('printer')} ${I18N.t('adm.ship.printToday', { n: shippedToday.length })}</button>
      </div>
      <div class="card-body flush">
        ${recent.length ? `
        <div class="table-wrap">
          <table class="data">
            <thead><tr><th>${I18N.t('adm.orders.colOrder')}</th><th>${I18N.t('adm.ship.colWho')}</th><th>${I18N.t('adm.ship.tracking')}</th><th>${I18N.t('adm.ship.colWhen')}</th><th class="right">${I18N.t('adm.ship.colLabelCost')}</th><th class="right"></th></tr></thead>
            <tbody>${recent.map(o => `<tr>
              <td class="mono">${o.number}</td>
              <td>${UI.esc((this.customerOf(o) || {}).name || '—')}</td>
              <td class="mono tiny">${UI.esc(o.label.tracking)}</td>
              <td class="tiny">${UI.date(o.label.createdAt, true)}<div class="cell-sub">${UI.esc(o.label.createdBy)}</div></td>
              <td class="right mono">${UI.money(o.label.cost)}</td>
              <td class="right"><button class="btn btn-sm btn-ghost" data-reprint="${o.id}">${I18N.t('adm.ship.reprint')}</button></td>
            </tr>`).join('')}</tbody>
          </table>
        </div>` : UI.empty(I18N.t('adm.ship.noneDoneTitle'), I18N.t('adm.ship.noneDoneBody'))}
      </div>
    </div>`;
  },

  shipmentsBind() {
    const f = this.f.ship;
    const pending = () => Store.pendingShipments().map(o => o.id);
    f.sel = f.sel.filter(id => pending().includes(id));

    document.querySelectorAll('[data-ship]').forEach(c => c.onchange = () => {
      f.sel = c.checked ? f.sel.concat(c.dataset.ship) : f.sel.filter(x => x !== c.dataset.ship);
      this.renderPage('shipments');
    });
    const all = document.getElementById('shipAll');
    if (all) all.onclick = () => { const p = pending(); f.sel = f.sel.length === p.length ? [] : p; this.renderPage('shipments'); };

    document.getElementById('shipGo').onclick = () => {
      const r = Store.createLabels(f.sel);
      f.sel = [];
      App.refreshAll();
      const people = new Set(r.done.map(o => o.customerId)).size;
      UI.toast('ok', I18N.t('adm.ship.createdTitle'), I18N.t('adm.ship.summary', { n: r.done.length, p: r.done.length, people }));
      if (r.done.length) this.printLabels(r.done);
    };

    const today = Store.dayKey(new Date());
    const pr = document.getElementById('shipPrint');
    if (pr) pr.onclick = () => this.printLabels(Store.orders.filter(o => o.label && Store.dayKey(o.label.createdAt) === today));
    document.querySelectorAll('[data-reprint]').forEach(b => b.onclick = () => this.printLabels([Store.orders.find(o => o.id === b.dataset.reprint)]));

    document.getElementById('shipCsv').onclick = () => {
      const lines = [['order', 'store', 'customer', 'players', 'address', 'city', 'state', 'zip', 'tracking', 'label_cost', 'created_at'].join(',')];
      Store.orders.filter(o => o.label).forEach(o => {
        const c = this.customerOf(o) || {}, a = o.address || {};
        const q = x => '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"';
        lines.push([o.number, q(UI.storeName(o.storeId)), q(c.name), q(o.items.filter(i => i.kind === 'kit').map(i => i.player).join(' / ')), q(a.line), q(a.city), a.state, a.zip, q(o.label.tracking), o.label.cost, o.label.createdAt].join(','));
      });
      UI.download('envios_soccercage_' + today + '.csv', lines.join('\n'));
    };
  },

  /** Hoja de etiquetas 4×6 pulgadas lista para imprimir. */
  printLabels(orders) {
    orders = orders.filter(Boolean);
    if (!orders.length) return;
    const from = Store.settings.shipFrom || {};
    const w = window.open('', '_blank');
    if (!w) { UI.toast('warn', I18N.t('adm.stores.popupTitle'), I18N.t('adm.stores.popupBody')); return; }
    const label = o => {
      const c = this.customerOf(o) || {}, a = o.address || {};
      return `<section class="lbl">
        <div class="hd"><b>USPS GROUND ADVANTAGE</b><span>${UI.esc(o.number)}</span></div>
        <div class="from">${UI.esc(from.name || Store.settings.company)}<br>${UI.esc(from.line || '')}<br>${UI.esc([from.city, from.state, from.zip].filter(Boolean).join(' '))}</div>
        <div class="to"><small>SHIP TO</small><br><b>${UI.esc(c.name || '')}</b><br>${UI.esc(a.line || '')}<br>${UI.esc(a.city || '')}, ${UI.esc(a.state || '')} ${UI.esc(a.zip || '')}</div>
        <div class="trk"><div class="bars"></div>${UI.esc(o.label.tracking)}</div>
        <div class="ft">${o.items.map(i => i.qty + '× ' + UI.esc(i.name) + (i.kind === 'kit' && i.player ? ' (' + UI.esc(i.player) + ')' : '')).join(' · ')}${o.label.simulated ? '<br><b>' + I18N.t('adm.ship.simulatedPrint') + '</b>' : ''}</div>
      </section>`;
    };
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${I18N.t('adm.ship.title')}</title>
      <style>@page{size:4in 6in;margin:0}body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#000}
      .lbl{width:4in;height:6in;box-sizing:border-box;padding:.25in;border:1px dashed #999;page-break-after:always;display:flex;flex-direction:column;gap:.15in}
      .hd{display:flex;justify-content:space-between;border-bottom:3px solid #000;padding-bottom:6px;font-size:13px}
      .from{font-size:11px;line-height:1.4}.to{font-size:16px;line-height:1.45;padding:.1in;border:2px solid #000}
      .to small{font-size:10px}.trk{font-family:monospace;font-size:13px;text-align:center;margin-top:auto}
      .bars{height:.7in;margin-bottom:6px;background:repeating-linear-gradient(90deg,#000 0 2px,#fff 2px 4px,#000 4px 5px,#fff 5px 8px)}
      .ft{font-size:9.5px;color:#333;border-top:1px solid #000;padding-top:4px}</style></head>
      <body>${orders.map(label).join('')}<script>window.onload=function(){window.print()}<\/script></body></html>`);
    w.document.close();
  },

  /* ============================================================
     CLIENTES — cuentas y estado del kit por tienda
     ============================================================ */
  kitCell(c) {
    return Store.stores.map(s => {
      const src = Store.kitSource(c, s.id);
      return src
        ? `<span class="tag tag-ok" title="${UI.esc(I18N.t('adm.customers.kitVia.' + src.type, { ref: src.ref || '' }))}">${UI.esc(s.short)} ✓</span>`
        : `<span class="tag tag-off">${UI.esc(s.short)}</span>`;
    }).join('');
  },

  customersHTML() {
    const f = this.f.cust;
    let list = Store.customers.slice();
    if (f.q) list = list.filter(c =>
      c.name.toLowerCase().includes(f.q) || c.email.toLowerCase().includes(f.q) || (c.city || '').toLowerCase().includes(f.q));
    list.sort((a, b) => b.spent - a.spent);

    const total = Store.customers.reduce((s, c) => s + c.spent, 0);
    const withKit = Store.customers.filter(c => Store.stores.some(s => Store.hasKit(c, s.id))).length;

    return this.head(I18N.t('adm.customers.title'), I18N.t('adm.customers.sub')) + `
    <div class="kpi-grid">
      <div class="kpi kpi-principal"><div class="kpi-label">${I18N.t('adm.customers.kpiCustomers')}</div><div class="kpi-value">${Store.customers.length}</div><div class="kpi-foot">${I18N.t('adm.customers.kpiCustomersFoot')}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.customers.kpiKit')}</div><div class="kpi-value">${withKit}</div><div class="kpi-foot">${I18N.t('adm.customers.kpiKitFoot', { n: Store.customers.length - withKit })}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.customers.kpiRevenue')}</div><div class="kpi-value">${UI.money0(total)}</div><div class="kpi-foot">${I18N.t('adm.customers.kpiRevenueFoot')}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.customers.kpiOrders')}</div><div class="kpi-value">${Store.customers.reduce((s, c) => s + c.orders, 0)}</div><div class="kpi-foot">${I18N.t('adm.customers.kpiOrdersFoot')}</div></div>
    </div>

    <div class="card">
      <div class="filter-bar">${this.searchBox('custQ', f, I18N.t('adm.customers.searchPh'))}</div>
      <div class="card-body flush">
        ${list.length ? `
        <div class="table-wrap">
          <table class="data">
            <thead><tr><th>${I18N.t('adm.customers.colCustomer')}</th><th>${I18N.t('adm.customers.colContact')}</th><th>${I18N.t('adm.customers.colKit')}</th><th class="right">${I18N.t('adm.customers.colOrders')}</th><th class="right">${I18N.t('adm.customers.colTotalSpent')}</th><th>${I18N.t('adm.customers.colSince')}</th><th class="right">${I18N.t('adm.orders.colActions')}</th></tr></thead>
            <tbody>
              ${list.map(c => `
                <tr>
                  <td>
                    <div class="cell-flex">
                      <div class="thumb" style="background:var(--ink-800)">${UI.esc(c.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase())}</div>
                      <div><div class="cell-main">${UI.esc(c.name)}</div><div class="cell-sub">${UI.esc(c.city || '—')}</div></div>
                    </div>
                  </td>
                  <td><div class="tiny">${UI.esc(c.email)}</div><div class="cell-sub">${UI.esc(c.phone)}</div></td>
                  <td><div class="tags">${this.kitCell(c)}</div></td>
                  <td class="right">${c.orders}</td>
                  <td class="right"><strong>${UI.money(c.spent)}</strong></td>
                  <td class="muted tiny">${UI.date(c.since)}</td>
                  <td class="right"><button class="btn btn-sm" data-kit-of="${c.id}">${I18N.t('adm.customers.kitBtn')}</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>` : UI.empty(I18N.t('adm.customers.emptyTitle'), I18N.t('adm.customers.emptyBody'))}
      </div>
    </div>`;
  },

  customersBind() {
    this.bindSearch('custQ', this.f.cust, 'customers');
    document.querySelectorAll('[data-kit-of]').forEach(b => b.onclick = () => this.kitForm(b.dataset.kitOf));
  },

  /** Marca a mano que una familia ya tiene el kit (lo compró antes de que existiera esta tienda). */
  kitForm(customerId) {
    const c = Store.customers.find(x => x.id === customerId);
    if (!c) return;
    UI.modal(`
      <div class="modal-head">
        <div><h2>${I18N.t('adm.customers.kitTitle')}</h2><p class="muted tiny" style="margin-top:2px">${UI.esc(c.name)} · ${UI.esc(c.email)}</p></div>
        ${UI.closeBtn()}
      </div>
      <div class="modal-body">
        <p class="muted" style="font-size:13.5px;line-height:1.6;margin-bottom:14px">${I18N.t('adm.customers.kitIntro')}</p>
        ${Store.stores.map(s => {
          const src = Store.kitSource(c, s.id);
          const auto = src && src.type !== 'grant';
          return `
          <label class="list-row" style="cursor:${auto ? 'default' : 'pointer'}">
            <input type="checkbox" data-grant="${s.id}" ${src ? 'checked' : ''} ${auto ? 'disabled' : ''}>
            <div style="flex:1">
              <div class="cell-main">${UI.esc(s.name)}</div>
              <div class="cell-sub">${src ? I18N.t('adm.customers.kitVia.' + src.type, { ref: UI.esc(src.ref || '') }) : I18N.t(s.kitRequired ? 'adm.customers.kitNone' : 'adm.customers.kitNotRequired')}</div>
            </div>
          </label>`;
        }).join('')}
      </div>
      <div class="modal-foot">
        <button class="btn" onclick="UI.closeModal()">${I18N.t('ui.cancel')}</button>
        <button class="btn btn-primary" id="kitSave">${I18N.t('adm.settings.saveBtn')}</button>
      </div>`, 'narrow');

    document.getElementById('kitSave').onclick = () => {
      document.querySelectorAll('[data-grant]:not([disabled])').forEach(i => Store.setKitGrant(c.id, i.dataset.grant, i.checked));
      UI.closeModal();
      App.refreshAll();
      UI.toast('ok', I18N.t('adm.customers.kitSaved'), c.name);
    };
  },

  /* ============================================================
     TIENDAS — tres canales sobre el mismo inventario
     ============================================================ */
  storeUrl(id) {
    return location.origin + location.pathname + '?store=' + id;
  },

  storesHTML() {
    const m = Store.metrics();
    const shared = Store.products.filter(p => p.stores.length > 1 && p.active).length;

    return this.head(I18N.t('adm.stores.title'), I18N.t('adm.stores.sub'),
      `<button class="btn btn-primary btn-sm" id="storeNew">${I18N.t('adm.stores.newBtn')}</button>`) + `
    <div class="alert alert-info">
      ${UI.infoIcon()}
      <div>
        <div class="alert-title">${I18N.t('adm.stores.sharedTitle')}</div>
        <div class="alert-body">${I18N.t('adm.stores.sharedBody', { n: shared })}</div>
      </div>
    </div>

    <div class="store-grid">
      ${Store.stores.map(s => {
        const list = Store.productsInStore(s.id);
        const kits = list.filter(p => Store.isKit(p)).length;
        const stat = m.byStore.find(b => b.store.id === s.id);
        const url = this.storeUrl(s.id);
        const yes = I18N.t('adm.stores.yes'), no = I18N.t('adm.stores.no');
        return `
        <div class="card store-card" data-store-card="${s.id}">
          <div class="card-head">
            <div class="cell-flex">
              ${UI.storeMark(s, 40)}
              <div>
                <h2>${UI.esc(s.name)}</h2>
                <p class="muted tiny" style="margin-top:2px">${I18N.t('shop.phase', { n: s.phase })}${s.source ? ' · ' + I18N.t('adm.stores.replaces', { url: UI.esc(s.source.replace(/^https?:\/\//, '').replace(/\/$/, '')) }) : ''}</p>
              </div>
            </div>
            <span class="badge ${s.active ? 'badge-ok' : 'badge-neutral'}"><span class="dot"></span>${I18N.t(s.active ? 'store.statusActive' : 'store.statusPrep')}</span>
          </div>
          <div class="card-body">
            <div class="store-stats">
              <div><div class="v">${kits}</div><div class="l">${I18N.t('adm.stores.kits')}</div></div>
              <div><div class="v">${list.length - kits}</div><div class="l">${I18N.t('adm.stores.pieces')}</div></div>
              <div><div class="v">${stat.orders}</div><div class="l">${I18N.t('adm.stores.orders')}</div></div>
              <div><div class="v">${UI.money0(stat.revenue)}</div><div class="l">${I18N.t('adm.stores.revenue')}</div></div>
            </div>

            <div class="store-kv">
              <div class="kv"><span class="k">${I18N.t('adm.stores.tax')}</span><span class="v">${UI.pct(s.taxRate)}</span></div>
              <div class="kv"><span class="k">${I18N.t('adm.stores.delivery')}</span><span class="v">${[s.pickup ? I18N.t('fulfill.pickupShort') : '', s.shipping ? I18N.t('fulfill.shippingShort') + ' (' + UI.money(s.shippingFlat) + ')' : ''].filter(Boolean).join(' · ')}</span></div>
              <div class="kv"><span class="k">${I18N.t('adm.stores.kitRequiredShort')}</span><span class="v">${s.kitRequired ? yes : no}</span></div>
              <div class="kv"><span class="k">${I18N.t('adm.stores.stripe')}</span><span class="v">${s.stripeAccount
                ? `<span class="mono tiny">${UI.esc(s.stripeAccount)}</span>`
                : `<span class="badge badge-warn">${I18N.t('adm.stores.stripeMissing')}</span>`}</span></div>
            </div>

            <div class="store-actions">
              <button class="btn btn-sm btn-primary" data-edit-store="${s.id}">${I18N.t('adm.stores.editBtn')}</button>
              <button class="btn btn-sm" data-toggle-store="${s.id}">${I18N.t(s.active ? 'adm.stores.pause' : 'adm.stores.publish')}</button>
              <button class="btn btn-sm btn-ghost" data-open-store="${s.id}">${I18N.t('adm.stores.preview')}</button>
            </div>

            <div class="store-link">
              ${UI.qr(url, 132)}
              <div class="store-link-text">
                <div class="kpi-label">${I18N.t('adm.stores.linkTitle')}</div>
                <p class="muted tiny" style="margin:4px 0 8px;line-height:1.5">${I18N.t('adm.stores.linkBody')}</p>
                <div class="mono tiny store-url">${UI.esc(url)}</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
                  <button class="btn btn-sm" data-copy="${s.id}">${I18N.t('adm.stores.copy')}</button>
                  <button class="btn btn-sm" data-print="${s.id}">${I18N.t('adm.stores.printQr')}</button>
                </div>
              </div>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  },

  storesBind() {
    document.getElementById('storeNew').onclick = () => this.storeForm();
    document.querySelectorAll('[data-edit-store]').forEach(b => b.onclick = () => this.storeForm(b.dataset.editStore));

    document.querySelectorAll('[data-toggle-store]').forEach(b => b.onclick = () => {
      const s = Store.storeCfg(b.dataset.toggleStore);
      Store.saveStore(s.id, { active: !s.active });
      App.refreshAll();
      UI.toast('ok', I18N.t(s.active ? 'adm.stores.publishedTitle' : 'adm.stores.pausedTitle'), I18N.t(s.active ? 'adm.stores.publishedBody' : 'adm.stores.pausedBody', { name: s.name }));
    });

    document.querySelectorAll('[data-open-store]').forEach(b => b.onclick = () => {
      Store.setStore(b.dataset.openStore);
      App.setMode('shop');
    });

    document.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => {
      const url = this.storeUrl(b.dataset.copy);
      const done = () => UI.toast('ok', I18N.t('adm.stores.copied'), url);
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, done);
      else done();
    });

    document.querySelectorAll('[data-print]').forEach(b => b.onclick = () => this.printQR(b.dataset.print));
  },

  /** Alta o edición de una tienda: identidad, cobro, impuesto y entrega. */
  storeForm(id) {
    const s = id ? Store.storeCfg(id) : null;
    const d = this.storeDraft = {
      logo: s ? s.logo : null,
      brand: s ? s.brand || '#111111' : SEED.brandPalette[Store.stores.length % SEED.brandPalette.length]
    };
    const v = (k, def) => s ? s[k] : def;

    UI.modal(`
      <div class="modal-head">
        <div>
          <h2>${I18N.t(s ? 'adm.stores.editTitle' : 'adm.stores.newTitle')}</h2>
          <p class="muted tiny" style="margin-top:2px">${I18N.t('adm.stores.formIntro')}</p>
        </div>
        ${UI.closeBtn()}
      </div>
      <div class="modal-body">
        <div class="pf-top">
          <div class="pf-image">
            <div class="pf-preview store-logo-preview" id="sfLogoPreview"></div>
            <label class="btn btn-sm pf-upload">${I18N.t('adm.stores.uploadLogo')}<input type="file" id="sfLogo" accept="image/*" hidden></label>
            <button class="btn btn-sm btn-ghost" id="sfLogoClear" type="button">${I18N.t('adm.pf.removeImage')}</button>
          </div>
          <div class="pf-main">
            <div class="field">
              <label for="sfName">${I18N.t('adm.stores.name')} <span class="req">*</span></label>
              <input class="input" id="sfName" data-autofocus value="${UI.esc(v('name', ''))}" placeholder="Juventus Summer Camp Chicago">
              <div class="err-msg" id="sfErrName">${I18N.t('err.storeName')}</div>
            </div>
            <div class="field">
              <label for="sfShort">${I18N.t('adm.stores.short')}</label>
              <input class="input" id="sfShort" value="${UI.esc(v('short', ''))}" maxlength="24" placeholder="Chicago">
            </div>
            <div class="field">
              <label>${I18N.t('adm.stores.brand')}</label>
              <div class="swatches" id="sfSwatches">
                ${SEED.brandPalette.map(c => `<button type="button" class="swatch ${d.brand.toLowerCase() === c ? 'sel' : ''}" data-color="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}
                <input type="color" id="sfColor" value="${UI.esc(d.brand)}" aria-label="${I18N.t('adm.stores.brandCustom')}">
              </div>
            </div>
          </div>
        </div>

        <div class="form-grid">
          <div class="field">
            <label for="sfTax">${I18N.t('adm.stores.tax')}</label>
            <input class="input" id="sfTax" type="number" step="0.001" min="0" max="25" value="${s ? Math.round(s.taxRate * 100000) / 1000 : 7}">
            <div class="hint">${I18N.t('adm.stores.taxHint')}</div>
          </div>
          <div class="field">
            <label for="sfShip">${I18N.t('adm.stores.shipFlat')}</label>
            <input class="input" id="sfShip" type="number" step="0.01" min="0" value="${v('shippingFlat', 9)}">
          </div>
          <div class="field span-2 store-checks">
            <label><input type="checkbox" id="sfKit" ${v('kitRequired', true) ? 'checked' : ''}> ${I18N.t('adm.stores.kitRequired')}</label>
            <label><input type="checkbox" id="sfPickup" ${v('pickup', true) ? 'checked' : ''}> ${I18N.t('adm.stores.pickup')}</label>
            <label><input type="checkbox" id="sfShipping" ${v('shipping', true) ? 'checked' : ''}> ${I18N.t('adm.stores.shipping')}</label>
            <label><input type="checkbox" id="sfActive" ${v('active', false) ? 'checked' : ''}> ${I18N.t('adm.stores.activeLabel')}</label>
          </div>
          <div class="field span-2">
            <label for="sfStripe">${I18N.t('adm.stores.stripe')}</label>
            <input class="input mono" id="sfStripe" value="${UI.esc(v('stripeAccount', ''))}" placeholder="acct_1Abc…">
            <div class="hint">${I18N.t('adm.stores.stripeHint')}</div>
          </div>
          ${s ? '' : `
          <div class="field span-2">
            <label for="sfCopy">${I18N.t('adm.stores.copyFrom')}</label>
            <select class="select" id="sfCopy">
              <option value="">${I18N.t('adm.stores.copyNone')}</option>
              ${Store.stores.map(x => `<option value="${x.id}">${UI.esc(x.name)}</option>`).join('')}
            </select>
            <div class="hint">${I18N.t('adm.stores.copyHint')}</div>
          </div>`}
        </div>
        <div class="err-msg" id="sfErr"></div>
      </div>
      <div class="modal-foot">
        <button class="btn" onclick="UI.closeModal()">${I18N.t('ui.cancel')}</button>
        <button class="btn btn-primary" id="sfSave">${I18N.t(s ? 'adm.pf.saveEdit' : 'adm.stores.create')}</button>
      </div>`, 'wide');

    const preview = () => {
      const name = document.getElementById('sfName').value || '?';
      document.getElementById('sfLogoPreview').innerHTML = UI.storeMark({ name, brand: d.brand, logo: d.logo }, 96);
      document.getElementById('sfLogoClear').style.display = d.logo ? '' : 'none';
      document.querySelectorAll('#sfSwatches .swatch').forEach(b => b.classList.toggle('sel', b.dataset.color.toLowerCase() === d.brand.toLowerCase()));
    };
    preview();
    document.getElementById('sfName').addEventListener('input', preview);
    document.querySelectorAll('#sfSwatches .swatch').forEach(b => b.onclick = () => { d.brand = b.dataset.color; document.getElementById('sfColor').value = d.brand; preview(); });
    document.getElementById('sfColor').oninput = e => { d.brand = e.target.value; preview(); };
    document.getElementById('sfLogo').onchange = e => {
      const f = e.target.files[0];
      if (!f) return;
      this.readImage(f, data => {
        if (!data) { UI.toast('danger', I18N.t('adm.pf.imageErr'), I18N.t('adm.pf.imageErrBody')); return; }
        d.logo = data;
        preview();
      });
    };
    document.getElementById('sfLogoClear').onclick = () => { d.logo = null; preview(); };

    document.getElementById('sfSave').onclick = () => {
      const val = x => document.getElementById(x).value.trim();
      const data = {
        name: val('sfName'), short: val('sfShort') || val('sfName'),
        taxRate: (parseFloat(val('sfTax')) || 0) / 100,
        shippingFlat: parseFloat(val('sfShip')) || 0,
        kitRequired: document.getElementById('sfKit').checked,
        pickup: document.getElementById('sfPickup').checked,
        shipping: document.getElementById('sfShipping').checked,
        active: document.getElementById('sfActive').checked,
        stripeAccount: val('sfStripe'), brand: d.brand, logo: d.logo
      };
      const err = document.getElementById('sfErr');
      const nameInput = document.getElementById('sfName');
      // Sin nombre: el aviso va junto al campo, no al pie del formulario.
      nameInput.classList.toggle('error', !data.name);
      document.getElementById('sfErrName').classList.toggle('show', !data.name);
      if (!data.name) { err.classList.remove('show'); nameInput.focus(); return; }

      const r = s ? Store.saveStore(s.id, data) : Store.addStore(data, val('sfCopy'));
      if (!r.ok) {
        err.textContent = r.error;
        err.classList.add('show');
        return;
      }
      if (!Store.save()) UI.toast('warn', I18N.t('adm.pf.storageTitle'), I18N.t('adm.pf.storageBody'));
      UI.closeModal();
      App.refreshAll();
      UI.toast('ok', I18N.t(s ? 'adm.settings.saved' : 'adm.stores.createdTitle'), r.store.name);
    };
  },

  printQR(id) {
    const s = Store.storeCfg(id);
    const url = this.storeUrl(id);
    const w = window.open('', '_blank');
    if (!w) { UI.toast('warn', I18N.t('adm.stores.popupTitle'), I18N.t('adm.stores.popupBody')); return; }
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${UI.esc(s.name)} — QR</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;text-align:center;padding:48px 24px;color:#0b0c0e}
      h1{font-size:34px;margin:0 0 6px}p{font-size:18px;margin:6px 0;color:#3a3f4a}.u{font-family:monospace;font-size:13px;margin-top:18px}</style></head>
      <body><h1>${UI.esc(s.name)}</h1><p>${I18N.t('adm.stores.qrCall')}</p><div style="margin:28px 0">${UI.qr(url, 440)}</div>
      <p>${I18N.t('adm.stores.qrNoCash')}</p><div class="u">${UI.esc(url)}</div>
      <script>window.onload=function(){window.print()}<\/script></body></html>`);
    w.document.close();
  },

  /* ============================================================
     ALERTAS
     ============================================================ */
  alertsHTML() {
    const m = Store.metrics();

    const row = (p, v, critical) => `
      <tr>
        <td>
          <div class="cell-flex">
            ${UI.thumb(p)}
            <div><div class="cell-main">${UI.esc(p.name)}</div><div class="cell-sub">${I18N.t('shop.size')} <b>${UI.esc(UI.sizeLabel(v.size))}</b></div></div>
          </div>
        </td>
        <td class="mono tiny">${UI.esc(v.sku)}</td>
        <td><div class="tags">${UI.storeTags(p)}</div></td>
        <td class="right"><strong style="color:${critical ? 'var(--danger-600)' : 'var(--warn-600)'};font-size:15px">${v.stock}</strong></td>
        <td class="right muted">${p.minStock}</td>
        <td class="right">${critical ? `<span class="badge badge-danger">${I18N.t('adm.alerts.restockNow')}</span>` : `<span class="badge badge-warn">${I18N.t('adm.alerts.missing', { n: Math.max(1, p.minStock - v.stock + 1) })}</span>`}</td>
        <td class="right"><button class="btn btn-sm btn-primary" data-restock="${v.id}">${I18N.t('adm.alerts.restockBtn')}</button></td>
      </tr>`;

    const table = items => `
      <div class="table-wrap">
        <table class="data">
          <thead><tr><th>${I18N.t('adm.alerts.colProductVariant')}</th><th>${I18N.t('adm.alerts.colSku')}</th><th>${I18N.t('adm.inv.colStores')}</th><th class="right">${I18N.t('adm.alerts.colStock')}</th><th class="right">${I18N.t('adm.alerts.colMin')}</th><th class="right">${I18N.t('adm.alerts.colStatus')}</th><th class="right">${I18N.t('adm.alerts.colAction')}</th></tr></thead>
          <tbody>${items}</tbody>
        </table>
      </div>`;

    return this.head(
      I18N.t('adm.alerts.title'),
      I18N.t('adm.alerts.sub'),
      `<button class="btn btn-sm" id="alertOrder">${I18N.t('adm.alerts.genOrderBtn')}</button>`
    ) + `
    ${!m.alertCount ? `
      <div class="alert alert-info">
        <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
        <div><div class="alert-title">${I18N.t('adm.alerts.allGoodTitle')}</div><div class="alert-body">${I18N.t('adm.alerts.allGoodBody')}</div></div>
      </div>` : ''}

    ${m.outCount ? `
    <div class="card" style="margin-bottom:var(--s5)">
      <div class="card-head">
        <div>
          <h2 style="color:var(--danger-600)">${I18N.t('adm.alerts.outTitle', { n: m.outCount })}</h2>
          <p class="muted tiny" style="margin-top:2px">${I18N.t('adm.alerts.outSub')}</p>
        </div>
      </div>
      <div class="card-body flush">${table(m.outItems.map(({ p, v }) => row(p, v, true)).join(''))}</div>
    </div>` : ''}

    ${m.lowCount ? `
    <div class="card">
      <div class="card-head">
        <div>
          <h2 style="color:var(--warn-600)">${I18N.t('adm.alerts.lowTitle', { n: m.lowCount })}</h2>
          <p class="muted tiny" style="margin-top:2px">${I18N.t('adm.alerts.lowSub')}</p>
        </div>
      </div>
      <div class="card-body flush">${table(m.lowItems.map(({ p, v }) => row(p, v, false)).join(''))}</div>
    </div>` : ''}`;
  },

  alertsBind() {
    document.querySelectorAll('[data-restock]').forEach(b =>
      b.onclick = () => this.movementForm(b.dataset.restock, 'entrada'));

    document.getElementById('alertOrder').onclick = () => {
      const m = Store.metrics();
      const items = [...m.outItems, ...m.lowItems];
      if (!items.length) { UI.toast('info', I18N.t('adm.alerts.nothingToRestock'), I18N.t('adm.alerts.nothingToRestockBody')); return; }
      const need = (p, v) => Math.max(p.minStock * 2 - v.stock, p.minStock, 1);
      const lines = items.map(({ p, v }) => ({ sku: v.sku, name: p.name, size: v.size, need: need(p, v), cost: need(p, v) * p.cost }));
      const total = lines.reduce((s, l) => s + l.cost, 0);

      UI.modal(`
        <div class="modal-head"><h2>${I18N.t('adm.alerts.proposalTitle')}</h2>${UI.closeBtn()}</div>
        <div class="modal-body">
          <p class="muted" style="font-size:13.5px;margin-bottom:16px">${I18N.t('adm.alerts.proposalExplain')}</p>
          <div class="table-wrap" style="border:1px solid var(--border);border-radius:var(--r-md)">
            <table class="data">
              <thead><tr><th>${I18N.t('adm.alerts.colSku')}</th><th>${I18N.t('adm.alerts.colProduct')}</th><th class="right">${I18N.t('adm.alerts.colUnits')}</th><th class="right">${I18N.t('adm.alerts.colEstCost')}</th></tr></thead>
              <tbody>
                ${lines.map(l => `<tr>
                  <td class="mono tiny">${UI.esc(l.sku)}</td>
                  <td><div class="cell-main">${UI.esc(l.name)}</div><div class="cell-sub">${I18N.t('shop.size')} ${UI.esc(UI.sizeLabel(l.size))}</div></td>
                  <td class="right"><strong>${l.need}</strong></td>
                  <td class="right mono">${UI.money(l.cost)}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div class="sum-row total" style="margin-top:14px"><span>${I18N.t('adm.alerts.estInvestment')}</span><span>${UI.money(total)}</span></div>
        </div>
        <div class="modal-foot">
          <button class="btn" onclick="UI.closeModal()">${I18N.t('ui.close')}</button>
          <button class="btn btn-primary" id="opConfirm">${I18N.t('adm.alerts.logAsIn')}</button>
        </div>`, 'wide');

      document.getElementById('opConfirm').onclick = () => {
        const ref = 'OC-' + Math.floor(1000 + Math.random() * 9000);
        let n = 0;
        items.forEach(({ p, v }) => {
          const r = Store.applyMovement({ variantId: v.id, type: 'entrada', qty: need(p, v), reason: 'purchase', ref });
          if (r.ok) n++;
        });
        UI.closeModal();
        App.refreshAll();
        UI.toast('ok', I18N.t('adm.alerts.producedTitle'), I18N.t('adm.alerts.producedBody', { n, ref }));
      };
    };
  },

  /* ============================================================
     REPORTES
     ============================================================ */
  reportsHTML() {
    const m = Store.metrics();
    const stocked = Store.products.filter(p => p.active && !Store.isKit(p));

    const byKind = {};
    stocked.forEach(p => {
      if (!byKind[p.kind]) byKind[p.kind] = { value: 0, units: 0 };
      byKind[p.kind].value += p.variants.reduce((s, v) => s + v.stock * p.cost, 0);
      byKind[p.kind].units += p.variants.reduce((s, v) => s + v.stock, 0);
    });
    const kinds = Object.entries(byKind).sort((a, b) => b[1].value - a[1].value);
    const maxKind = Math.max(1, ...kinds.map(c => c[1].value));

    const byDay = {};
    Store.orders.filter(o => o.paymentStatus === 'pagado').forEach(o => {
      const d = Store.dayKey(o.date);
      byDay[d] = (byDay[d] || 0) + o.total;
    });
    const days = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0])).slice(-14);
    const maxDay = Math.max(1, ...days.map(d => d[1]));

    const byReason = {};
    Store.movements.forEach(mv => {
      if (!byReason[mv.reason]) byReason[mv.reason] = { in: 0, out: 0 };
      byReason[mv.reason][mv.type === 'entrada' ? 'in' : 'out'] += mv.qty;
    });
    const reasons = Object.entries(byReason).sort((a, b) => (b[1].in + b[1].out) - (a[1].in + a[1].out));
    const maxReason = Math.max(1, ...reasons.map(r => r[1].in + r[1].out));

    const topMax = Math.max(1, ...m.topProducts.map(p => p.qty));
    const maxStore = Math.max(1, ...m.byStore.map(b => b.revenue));

    return this.head(
      I18N.t('adm.reports.title'),
      I18N.t('adm.reports.sub'),
      `<button class="btn btn-sm" onclick="window.print()">${I18N.t('adm.reports.printBtn')}</button>`
    ) + `
    <div class="kpi-grid">
      <div class="kpi kpi-principal"><div class="kpi-label">${I18N.t('adm.reports.kpiInvCapital')}</div><div class="kpi-value">${UI.money0(m.invValue)}</div><div class="kpi-foot">${I18N.t('adm.reports.kpiInvCapitalFoot')}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.reports.kpiMargin')}</div><div class="kpi-value">${UI.money0(m.margin)}</div><div class="kpi-foot">${I18N.t('adm.reports.kpiMarginFoot')}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.dashboard.sales30')}</div><div class="kpi-value">${UI.money0(m.sales30)}</div><div class="kpi-foot">${I18N.t('adm.reports.kpiTicketFoot', { ticket: UI.money0(m.ticket) })}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.reports.kpiTax')}</div><div class="kpi-value">${UI.money(m.tax30)}</div><div class="kpi-foot">${I18N.t('adm.reports.kpiTaxFoot')}</div></div>
    </div>

    <div class="grid-halves">
      <div class="card">
        <div class="card-head"><h2>${I18N.t('adm.reports.salesByStore')}</h2></div>
        <div class="card-body">
          ${m.byStore.map((b, i) => `
            <div class="bar-row">
              <div class="bar-label"><div style="font-weight:560">${UI.esc(b.store.short)}</div><div class="tiny muted">${I18N.t('adm.reports.ordersN', { n: b.orders })}</div></div>
              <div class="bar-track"><div class="bar-fill ${i === 0 ? 'gold' : ''}" style="width:${(b.revenue / maxStore) * 100}%"></div></div>
              <div class="bar-val">${UI.money0(b.revenue)}</div>
            </div>`).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h2>${I18N.t('adm.reports.salesByDay')}</h2></div>
        <div class="card-body">
          ${days.length ? days.map(([d, v]) => `
            <div class="bar-row">
              <div class="bar-label">${UI.date(d)}</div>
              <div class="bar-track"><div class="bar-fill" style="width:${(v / maxDay) * 100}%"></div></div>
              <div class="bar-val">${UI.money0(v)}</div>
            </div>`).join('') : `<p class="muted tiny">${I18N.t('adm.reports.noSales')}</p>`}
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h2>${I18N.t('adm.reports.invByKind')}</h2></div>
        <div class="card-body">
          ${kinds.map(([k, d], i) => `
            <div class="bar-row">
              <div class="bar-label"><div style="font-weight:560">${I18N.t('kind.' + k)}</div><div class="tiny muted">${I18N.t('adm.reports.units', { n: UI.num(d.units) })}</div></div>
              <div class="bar-track"><div class="bar-fill ${i === 0 ? 'gold' : ''}" style="width:${(d.value / maxKind) * 100}%"></div></div>
              <div class="bar-val">${UI.money0(d.value)}</div>
            </div>`).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h2>${I18N.t('adm.reports.topProducts')}</h2></div>
        <div class="card-body">
          ${m.topProducts.length ? m.topProducts.map((p, i) => `
            <div class="bar-row">
              <div class="bar-label"><div style="font-weight:560;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${UI.esc(p.name)}">${UI.esc(p.name)}</div><div class="tiny muted">${UI.money0(p.revenue)}</div></div>
              <div class="bar-track"><div class="bar-fill ${i === 0 ? 'gold' : ''}" style="width:${(p.qty / topMax) * 100}%"></div></div>
              <div class="bar-val">${I18N.t('adm.reports.unitsShort', { n: p.qty })}</div>
            </div>`).join('') : `<p class="muted tiny">${I18N.t('adm.reports.noData')}</p>`}
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:var(--s5)">
      <div class="card-head"><h2>${I18N.t('adm.reports.movementsByReason')}</h2></div>
      <div class="card-body">
        ${reasons.map(([code, d]) => `
          <div class="bar-row">
            <div class="bar-label wide"><div style="font-weight:560;font-size:12.5px">${UI.esc(UI.reason(code))}</div>
              <div class="tiny"><span style="color:var(--ok-600)">+${UI.num(d.in)}</span> · <span style="color:var(--danger-600)">−${UI.num(d.out)}</span></div></div>
            <div class="bar-track"><div class="bar-fill" style="width:${((d.in + d.out) / maxReason) * 100}%"></div></div>
            <div class="bar-val">${I18N.t('adm.reports.unitsShort', { n: UI.num(d.in + d.out) })}</div>
          </div>`).join('')}
      </div>
    </div>

    <div class="card" style="margin-top:var(--s5)">
      <div class="card-head"><h2>${I18N.t('adm.reports.valuationDetail')}</h2></div>
      <div class="card-body flush">
        <div class="table-wrap">
          <table class="data">
            <thead><tr><th>${I18N.t('adm.reports.colProduct')}</th><th>${I18N.t('adm.inv.colStores')}</th><th class="right">${I18N.t('adm.reports.colUnits')}</th><th class="right">${I18N.t('adm.reports.colUnitCost')}</th><th class="right">${I18N.t('adm.reports.colCostValue')}</th><th class="right">${I18N.t('adm.reports.colSaleValue')}</th><th class="right">${I18N.t('adm.reports.colMargin')}</th></tr></thead>
            <tbody>
              ${stocked.map(p => {
                const u = Store.productStock(p);
                const vc = u * p.cost, vv = u * p.price;
                return `<tr>
                  <td><div class="cell-main">${UI.esc(p.name)}</div><div class="cell-sub mono">${UI.esc(p.sku)}</div></td>
                  <td><div class="tags">${UI.storeTags(p)}</div></td>
                  <td class="right">${UI.num(u)}</td>
                  <td class="right mono muted">${UI.money(p.cost)}</td>
                  <td class="right mono">${UI.money(vc)}</td>
                  <td class="right mono">${UI.money(vv)}</td>
                  <td class="right"><span class="delta ${vv - vc > 0 ? 'up' : ''}">${UI.money(vv - vc)}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  },

  /* ============================================================
     CONFIGURACIÓN
     ============================================================ */
  settingsHTML() {
    const s = Store.settings;
    const cat = typeof CATALOG !== 'undefined' ? CATALOG : null;
    return this.head(I18N.t('adm.settings.title'), I18N.t('adm.settings.sub')) + `
    <div class="grid-halves">
      <div class="card">
        <div class="card-head"><h2>${I18N.t('adm.settings.companyData')}</h2></div>
        <div class="card-body">
          <div class="field"><label for="stCompany">${I18N.t('adm.settings.companyName')}</label><input class="input" id="stCompany" value="${UI.esc(s.company)}"></div>
          <div class="field"><label for="stCity">${I18N.t('adm.settings.city')}</label><input class="input" id="stCity" value="${UI.esc(s.city)}"></div>
          <div class="field">
            <label for="stLow">${I18N.t('adm.settings.lowStockThreshold')}</label>
            <input class="input" id="stLow" type="number" min="0" value="${s.lowStockGlobal}">
            <div class="hint">${I18N.t('adm.settings.lowStockHint')}</div>
          </div>
          <p class="tiny muted" style="margin-bottom:14px;line-height:1.6">${I18N.t('adm.settings.perStoreNote')}</p>
          <button class="btn btn-primary" id="stSave">${I18N.t('adm.settings.saveBtn')}</button>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h2>${I18N.t('adm.settings.opsTitle')}</h2></div>
        <div class="card-body">
          <div class="field">
            <label for="stNotify">${I18N.t('adm.settings.notifyEmails')}</label>
            <input class="input" id="stNotify" type="text" inputmode="email" value="${UI.esc(s.orderNotifyEmails || '')}" placeholder="ordenes@soccercage.com">
            <div class="hint">${I18N.t('adm.settings.notifyHint')}</div>
            <div class="err-msg" id="errNotify"></div>
          </div>
          <div class="field"><label for="stFromName">${I18N.t('adm.settings.shipFromName')}</label><input class="input" id="stFromName" value="${UI.esc((s.shipFrom || {}).name || '')}"></div>
          <div class="field"><label for="stFromLine">${I18N.t('adm.settings.shipFromLine')}</label><input class="input" id="stFromLine" value="${UI.esc((s.shipFrom || {}).line || '')}" autocomplete="street-address"></div>
          <div class="form-grid tight" style="grid-template-columns:2fr 1fr 1fr">
            <div class="field"><label for="stFromCity">${I18N.t('checkout.city')}</label><input class="input" id="stFromCity" value="${UI.esc((s.shipFrom || {}).city || '')}"></div>
            <div class="field"><label for="stFromState">${I18N.t('checkout.state')}</label><input class="input" id="stFromState" maxlength="2" value="${UI.esc((s.shipFrom || {}).state || '')}"></div>
            <div class="field"><label for="stFromZip">${I18N.t('checkout.zip')}</label><input class="input" id="stFromZip" inputmode="numeric" maxlength="10" value="${UI.esc((s.shipFrom || {}).zip || '')}"></div>
          </div>
          <div class="hint" style="margin-bottom:14px">${I18N.t('adm.settings.shipFromHint')}</div>
          <button class="btn btn-primary" id="stOpsSave">${I18N.t('adm.settings.saveBtn')}</button>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h2>${I18N.t('adm.settings.usersPerms')}</h2></div>
        <div class="card-body">
          ${Store.state.users.filter(u => u.id !== 'sys').map(u => `
            <div class="list-row">
              <div class="thumb" style="background:var(--ink-800);width:34px;height:34px">${UI.esc(u.initials)}</div>
              <div style="flex:1;min-width:0">
                <div class="cell-main">${UI.esc(u.name)}</div>
                <div class="cell-sub">${I18N.t('role.' + u.role + '.desc')}</div>
              </div>
              <span class="badge ${u.role === 'admin' ? 'badge-gold' : 'badge-neutral'}">${I18N.t('role.' + u.role)}</span>
            </div>`).join('')}
          <div class="field" style="margin-top:16px">
            <label for="stUser">${I18N.t('adm.settings.activeUser')}</label>
            <select class="select" id="stUser">
              ${Store.state.users.filter(u => u.id !== 'sys').map(u =>
                `<option value="${u.id}"${Store.state.currentUser === u.id ? ' selected' : ''}>${UI.esc(u.name)} — ${I18N.t('role.' + u.role)}</option>`).join('')}
            </select>
            <div class="hint">${I18N.t('adm.settings.activeUserHint')}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h2>${I18N.t('adm.settings.catalogTitle')}</h2></div>
        <div class="card-body">
          <p class="muted" style="font-size:13.5px;line-height:1.6;margin-bottom:14px">${I18N.t('adm.settings.catalogBody')}</p>
          ${cat ? Object.keys(cat.sources).map(k => `
            <div class="kv"><span class="k">${UI.esc(cat.sources[k].name)}</span><span class="v">${I18N.t('adm.settings.catalogCount', { n: cat.products.filter(p => p.stores.includes(k)).length })}</span></div>`).join('') : ''}
          <div class="kv"><span class="k">${I18N.t('adm.settings.catalogShared')}</span><span class="v">${cat ? cat.products.filter(p => p.stores.length > 1).length : 0}</span></div>
          <div class="kv"><span class="k">${I18N.t('adm.settings.catalogDate')}</span><span class="v">${cat ? UI.date(cat.importedAt) : '—'}</span></div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h2>${I18N.t('adm.settings.demoData')}</h2></div>
        <div class="card-body">
          <p class="muted" style="font-size:13.5px;line-height:1.6;margin-bottom:14px">${I18N.t('adm.settings.demoDataBody')}</p>
          <div class="kv"><span class="k">${I18N.t('adm.settings.products')}</span><span class="v">${Store.products.length}</span></div>
          <div class="kv"><span class="k">${I18N.t('adm.settings.skus')}</span><span class="v">${Store.products.reduce((n, p) => n + p.variants.length, 0)}</span></div>
          <div class="kv"><span class="k">${I18N.t('adm.settings.orders')}</span><span class="v">${Store.orders.length}</span></div>
          <div class="kv"><span class="k">${I18N.t('adm.settings.movements')}</span><span class="v">${Store.movements.length}</span></div>
          <div class="kv"><span class="k">${I18N.t('adm.settings.customers')}</span><span class="v">${Store.customers.length}</span></div>
          <button class="btn btn-danger" style="margin-top:16px" id="stReset">${I18N.t('adm.settings.resetDemoBtn')}</button>
        </div>
      </div>
    </div>`;
  },

  settingsBind() {
    document.getElementById('stSave').onclick = () => {
      const s = Store.settings;
      s.company = document.getElementById('stCompany').value.trim() || s.company;
      s.city = document.getElementById('stCity').value.trim() || s.city;
      s.lowStockGlobal = parseInt(document.getElementById('stLow').value) || 0;
      Store.save();
      App.refreshAll();
      UI.toast('ok', I18N.t('adm.settings.saved'), I18N.t('adm.settings.savedBody'));
    };

    document.getElementById('stOpsSave').onclick = () => {
      const s = Store.settings;
      const raw = document.getElementById('stNotify').value.trim();
      const list = raw.split(/[,;\s]+/).filter(Boolean);
      const bad = list.filter(x => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x));
      const err = document.getElementById('errNotify');
      if (bad.length) {
        err.textContent = I18N.t('adm.settings.notifyBad', { list: bad.join(', ') });
        err.classList.add('show');
        document.getElementById('stNotify').focus();
        return;
      }
      err.classList.remove('show');
      s.orderNotifyEmails = list.join(', ');
      const v = id => document.getElementById(id).value.trim();
      s.shipFrom = { name: v('stFromName'), line: v('stFromLine'), city: v('stFromCity'), state: v('stFromState').toUpperCase(), zip: v('stFromZip') };
      Store.save();
      UI.toast('ok', I18N.t('adm.settings.saved'), I18N.t('adm.settings.savedBody'));
    };

    document.getElementById('stUser').onchange = e => {
      Store.state.currentUser = e.target.value;
      Store.save();
      App.syncUser();
      UI.toast('info', I18N.t('adm.settings.userChanged'), I18N.t('adm.settings.userChangedBody', { name: Store.user().name }));
    };

    document.getElementById('stReset').onclick = () => this.confirmReset();
  }
};
