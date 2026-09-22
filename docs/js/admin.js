/* ============================================================
   SOCCER CAGE — Panel administrativo
   Dashboard · Inventario · Productos · Movimientos · Pedidos
   Clientes · Alertas · Reportes · Configuración
   ============================================================ */

const Admin = {
  current: 'dashboard',
  f: {
    inv:  { q: '', status: 'todos', cat: 'todos' },
    prod: { q: '', cat: 'todos', active: 'todos' },
    mov:  { q: '', type: 'todos', reason: 'todos' },
    ord:  { q: '', status: 'todos' },
    cust: { q: '' }
  },
  draftVariants: [],

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
    document.querySelector('.content').scrollTo({ top: 0 });
  },

  refresh() {
    this.renderPage(this.current);
    this.updateBadge();
  },

  updateBadge() {
    const m = Store.metrics();
    const b = document.getElementById('alertBadge');
    b.textContent = m.alertCount;
    b.style.display = m.alertCount ? 'grid' : 'none';
  },

  renderPage(page) {
    const el = document.getElementById('page-' + page);
    if (!el) return;
    const fn = {
      dashboard: 'dashboard', inventory: 'inventory', products: 'products',
      movements: 'movements', orders: 'orders', customers: 'customers',
      alerts: 'alerts', reports: 'reports', settings: 'settings'
    }[page];
    el.innerHTML = this[fn + 'HTML']();
    if (this[fn + 'Bind']) this[fn + 'Bind']();
    this.updateBadge();
  },

  head(title, sub, actions) {
    return `<div class="page-head">
      <div><h1>${title}</h1><p class="sub">${sub}</p></div>
      <div class="head-actions">${actions || ''}</div>
    </div>`;
  },

  /* ============================================================
     DASHBOARD
     ============================================================ */
  dashboardHTML() {
    const m = Store.metrics();
    const recent = Store.movements.slice(0, 8);
    const pending = Store.orders.filter(o => ['pendiente', 'procesando'].includes(o.status)).slice(0, 5);
    const maxQty = Math.max(1, ...m.topProducts.map(p => p.qty));

    return this.head(
      I18N.t('adm.dashboard.title'),
      I18N.t('adm.dashboard.sub', { date: UI.date('2026-09-19'), company: UI.esc(Store.settings.company) }),
      `<button class="btn btn-sm" id="dashReset">${I18N.t('adm.dashboard.resetDemo')}</button>
       <button class="btn btn-primary btn-sm" id="dashNew">${I18N.t('adm.dashboard.newProduct')}</button>`
    ) + `

    <div class="kpi-grid">
      <div class="kpi kpi-principal">
        <div class="kpi-label">${I18N.t('adm.dashboard.invValue')}</div>
        <div class="kpi-value">${UI.money0(m.invValue)}</div>
        <div class="kpi-foot">${I18N.t('adm.dashboard.invValueFoot', { units: UI.num(m.units) })}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">${I18N.t('adm.dashboard.invRetail')}</div>
        <div class="kpi-value">${UI.money0(m.invRetail)}</div>
        <div class="kpi-foot">${I18N.t('adm.dashboard.marginFoot', { margin: `<span class="delta up">${UI.money0(m.margin)}</span>` })}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">${I18N.t('adm.dashboard.salesMonth')}</div>
        <div class="kpi-value">${UI.money0(m.salesMonth)}</div>
        <div class="kpi-foot">${I18N.t('adm.dashboard.salesTodayFoot', { today: `<strong>${UI.money0(m.salesToday)}</strong>`, ticket: UI.money0(m.ticket) })}</div>
      </div>
      <div class="kpi ${m.outCount ? 'kpi-critico' : ''}">
        <div class="kpi-label">${I18N.t('adm.dashboard.needsAttention')}</div>
        <div class="kpi-value">${m.lowCount + m.outCount}</div>
        <div class="kpi-foot">
          <span style="color:var(--warn-600);font-weight:600">${I18N.t('adm.dashboard.lowStock', { n: m.lowCount })}</span> ·
          <span style="color:var(--danger-600);font-weight:600">${I18N.t('adm.dashboard.outStock', { n: m.outCount })}</span>
        </div>
      </div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.dashboard.activeProducts')}</div><div class="kpi-value">${m.activeCount}</div><div class="kpi-foot">${I18N.t('adm.dashboard.skuCount', { n: m.skuCount })}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.dashboard.pendingOrders')}</div><div class="kpi-value">${m.pending}</div><div class="kpi-foot">${I18N.t('adm.dashboard.pendingFoot')}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.dashboard.completedOrders')}</div><div class="kpi-value">${m.completed}</div><div class="kpi-foot">${I18N.t('adm.dashboard.completedFoot')}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.dashboard.customers')}</div><div class="kpi-value">${Store.customers.length}</div><div class="kpi-foot">${I18N.t('adm.dashboard.customersFoot')}</div></div>
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
                    <td><div class="cell-main">${UI.esc(mv.product)}</div><div class="cell-sub mono">${UI.esc(mv.variant)} · ${UI.esc(mv.sku)}</div></td>
                    <td><div>${UI.esc(mv.reason)}</div><div class="cell-sub mono">${UI.esc(mv.ref)}</div></td>
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
              const c = Store.customers.find(x => x.id === o.customerId);
              return `<div class="list-row">
                <div style="flex:1;min-width:0">
                  <div class="cell-main mono">${o.number}</div>
                  <div class="cell-sub">${UI.esc(c ? c.name : '—')}</div>
                </div>
                <div style="text-align:right">
                  <div style="font-weight:620">${UI.money(o.total)}</div>
                  <div style="margin-top:3px">${UI.orderBadge(o.status)}</div>
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
    const n = document.getElementById('dashNew');
    if (n) n.onclick = () => this.productForm();
    const r = document.getElementById('dashReset');
    if (r) r.onclick = () => UI.confirm(
      I18N.t('adm.dashboard.resetTitle'),
      I18N.t('adm.dashboard.resetBody'),
      () => { Store.reset(); App.refreshAll(); UI.toast('ok', I18N.t('adm.dashboard.resetDone'), I18N.t('adm.dashboard.resetDoneBody')); },
      true
    );
  },

  /* ============================================================
     INVENTARIO — vista por variante (la unidad real de stock)
     ============================================================ */
  inventoryHTML() {
    const f = this.f.inv;
    const rows = [];

    Store.products.forEach(p => {
      if (!p.active) return;
      if (f.cat !== 'todos' && p.category !== f.cat) return;
      p.variants.forEach(v => {
        const st = Store.variantStatus(p, v);
        if (f.status !== 'todos' && st !== f.status) return;
        if (f.q) {
          const q = f.q;
          const hit = p.name.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q) ||
                      v.color.toLowerCase().includes(q) || v.size.toLowerCase().includes(q);
          if (!hit) return;
        }
        rows.push({ p, v, st });
      });
    });

    rows.sort((a, b) => {
      const rank = { 'agotado': 0, 'bajo': 1, 'ok': 2, 'bajo-pedido': 3 };
      return (rank[a.st] - rank[b.st]) || a.p.name.localeCompare(b.p.name, 'es');
    });

    // Los artículos bajo pedido no son stock físico en bodega: su "99" es un
    // marcador de fabricación, no capital inmovilizado. Se excluyen del valor.
    const real = rows.filter(r => !r.p.madeToOrder);
    const totalValue = real.reduce((s, r) => s + r.v.stock * r.p.cost, 0);
    const totalUnits = real.reduce((s, r) => s + r.v.stock, 0);

    return this.head(
      I18N.t('adm.inv.title'),
      I18N.t('adm.inv.sub'),
      `<button class="btn btn-sm" id="invExport">${I18N.t('adm.inv.exportCsv')}</button>
       <button class="btn btn-primary btn-sm" id="invMove">${I18N.t('adm.inv.newMovement')}</button>`
    ) + `
    <div class="kpi-grid">
      <div class="kpi kpi-principal"><div class="kpi-label">${I18N.t('adm.inv.listedSkus')}</div><div class="kpi-value">${rows.length}</div><div class="kpi-foot">${I18N.t('adm.inv.ofActive', { n: Store.metrics().skuCount })}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.inv.unitsInStock')}</div><div class="kpi-value">${UI.num(totalUnits)}</div><div class="kpi-foot">${I18N.t('adm.inv.excludesMadeToOrder')}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.inv.costValue')}</div><div class="kpi-value">${UI.money0(totalValue)}</div><div class="kpi-foot">${I18N.t('adm.inv.tiedCapital')}</div></div>
      <div class="kpi ${rows.filter(r => r.st === 'bajo').length ? 'kpi-alerta' : ''}"><div class="kpi-label">${I18N.t('adm.inv.belowMin')}</div><div class="kpi-value">${rows.filter(r => r.st === 'bajo').length}</div><div class="kpi-foot">${I18N.t('adm.inv.needsRestock')}</div></div>
    </div>

    <div class="card">
      <div class="filter-bar">
        <div class="search-box">
          <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input class="input" id="invQ" placeholder="${I18N.t('adm.inv.searchPlaceholder')}" value="${UI.esc(f.q)}">
        </div>
        <select class="select" id="invStatus">
          <option value="todos">${I18N.t('adm.inv.allStatuses')}</option>
          <option value="ok"${f.status === 'ok' ? ' selected' : ''}>${I18N.t('adm.inv.available')}</option>
          <option value="bajo"${f.status === 'bajo' ? ' selected' : ''}>${I18N.t('adm.inv.lowStock')}</option>
          <option value="agotado"${f.status === 'agotado' ? ' selected' : ''}>${I18N.t('adm.inv.outOfStock')}</option>
        </select>
        <select class="select" id="invCat">
          <option value="todos">${I18N.t('adm.inv.allCategories')}</option>
          ${SEED.categories.map(c => `<option value="${c.id}"${f.cat === c.id ? ' selected' : ''}>${UI.esc(c.name)}</option>`).join('')}
        </select>
      </div>

      <div class="card-body flush">
        ${rows.length ? `
        <div class="table-wrap">
          <table class="data">
            <thead><tr>
              <th>${I18N.t('adm.inv.colProductVariant')}</th><th>${I18N.t('adm.inv.colSku')}</th><th class="right">${I18N.t('adm.inv.colStock')}</th>
              <th class="right">${I18N.t('adm.inv.colMin')}</th><th>${I18N.t('adm.inv.colStatus')}</th><th class="right">${I18N.t('adm.inv.colCostValue')}</th><th class="right">${I18N.t('adm.inv.colActions')}</th>
            </tr></thead>
            <tbody>
              ${rows.map(({ p, v, st }) => `
                <tr>
                  <td>
                    <div class="cell-flex">
                      <div class="thumb" style="background:${v.colorHex};color:${['#f2f3f5','#c9a227'].includes(v.colorHex) ? '#16181d' : '#fff'}">${UI.esc(v.size)}</div>
                      <div>
                        <div class="cell-main">${UI.esc(p.name)}</div>
                        <div class="cell-sub">${UI.esc(v.size)} · ${UI.esc(v.color)}</div>
                      </div>
                    </div>
                  </td>
                  <td class="mono tiny">${UI.esc(v.sku)}</td>
                  <td class="right">
                    <div style="font-weight:680;font-size:15px">${v.stock}</div>
                    ${p.madeToOrder ? '' : UI.stockBar(v.stock, p.minStock)}
                  </td>
                  <td class="right muted">${p.madeToOrder ? '—' : p.minStock}</td>
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
    const q = document.getElementById('invQ');
    q.oninput = () => {
      this.f.inv.q = q.value.trim().toLowerCase();
      const pos = q.selectionStart;
      this.renderPage('inventory');
      const nq = document.getElementById('invQ');
      nq.focus(); nq.setSelectionRange(pos, pos);
    };
    document.getElementById('invStatus').onchange = e => { this.f.inv.status = e.target.value; this.renderPage('inventory'); };
    document.getElementById('invCat').onchange    = e => { this.f.inv.cat = e.target.value; this.renderPage('inventory'); };
    document.getElementById('invMove').onclick    = () => this.movementForm();
    document.getElementById('invExport').onclick  = () => this.exportInventory();

    document.querySelectorAll('[data-in]').forEach(b  => b.onclick = () => this.movementForm(b.dataset.in, 'entrada'));
    document.querySelectorAll('[data-out]').forEach(b => b.onclick = () => this.movementForm(b.dataset.out, 'salida'));
  },

  exportInventory() {
    const lines = [['SKU', 'Producto', 'Talla', 'Color', 'Stock', 'Minimo', 'Costo', 'Precio', 'Valor_costo'].join(',')];
    Store.products.filter(p => p.active).forEach(p => p.variants.forEach(v => {
      lines.push([v.sku, `"${p.name}"`, v.size, v.color, v.stock, p.minStock, p.cost, p.price, (v.stock * p.cost).toFixed(2)].join(','));
    }));
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'inventario_soccercage_2026-09-19.csv';
    a.click();
    UI.toast('ok', I18N.t('adm.inv.exportDone'), I18N.t('adm.inv.exportDoneBody'));
  },

  /* ---------- Formulario de movimiento manual ---------- */
  movementForm(variantId, type) {
    const opts = [];
    Store.products.filter(p => p.active).forEach(p =>
      p.variants.forEach(v => opts.push({ id: v.id, label: `${p.name} · ${v.size} / ${v.color} (${v.stock} u.)`, sku: v.sku }))
    );

    UI.modal(`
      <div class="modal-head"><h2>${I18N.t('adm.mv.formTitle')}</h2>
        <button class="icon-btn" onclick="UI.closeModal()" aria-label="${I18N.t('adm.mv.close')}"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
      </div>
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
              <option value="entrada"${type === 'entrada' ? ' selected' : ''}>${I18N.t('adm.mv.typeIn')}</option>
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
      rs.innerHTML = SEED.reasons[tp.value].map(r => `<option>${UI.esc(r)}</option>`).join('');
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
        <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
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
        `${r.movement.sku}: ${r.movement.before} → ${r.movement.after} (${r.movement.reason})`);
    };
  },

  /* ============================================================
     PRODUCTOS
     ============================================================ */
  productsHTML() {
    const f = this.f.prod;
    let list = Store.products.slice();

    if (f.cat !== 'todos') list = list.filter(p => p.category === f.cat);
    if (f.active === 'activos')   list = list.filter(p => p.active);
    if (f.active === 'inactivos') list = list.filter(p => !p.active);
    if (f.q) {
      const q = f.q;
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }

    return this.head(
      I18N.t('adm.products.title'),
      I18N.t('adm.products.sub'),
      `<button class="btn btn-primary btn-sm" id="prodNew">${I18N.t('adm.products.newBtn')}</button>`
    ) + `
    <div class="card">
      <div class="filter-bar">
        <div class="search-box">
          <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input class="input" id="prodQ" placeholder="${I18N.t('adm.products.searchPh')}" value="${UI.esc(f.q)}">
        </div>
        <select class="select" id="prodCat">
          <option value="todos">${I18N.t('adm.products.allCategories')}</option>
          ${SEED.categories.map(c => `<option value="${c.id}"${f.cat === c.id ? ' selected' : ''}>${UI.esc(c.name)}</option>`).join('')}
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
              <th>${I18N.t('adm.products.colProduct')}</th><th>${I18N.t('adm.products.colCategory')}</th><th class="right">${I18N.t('adm.products.colVariants')}</th>
              <th class="right">${I18N.t('adm.products.colTotalStock')}</th><th class="right">${I18N.t('adm.products.colCost')}</th><th class="right">${I18N.t('adm.products.colPrice')}</th>
              <th class="right">${I18N.t('adm.products.colMargin')}</th><th>${I18N.t('adm.products.colStatus')}</th><th class="right">${I18N.t('adm.products.colActions')}</th>
            </tr></thead>
            <tbody>
              ${list.map(p => {
                const total = Store.productStock(p);
                const st = Store.productStatus(p);
                const margin = p.price > 0 ? ((p.price - p.cost) / p.price * 100) : 0;
                const hex = (p.variants[0] || {}).colorHex || '#6b7280';
                return `<tr>
                  <td>
                    <div class="cell-flex">
                      <div class="thumb" style="background:${UI.mediaBg()};padding:4px">${UI.garment(p.category, hex)}</div>
                      <div>
                        <div class="cell-main">${UI.esc(p.name)}</div>
                        <div class="cell-sub mono">${UI.esc(p.sku)}</div>
                      </div>
                    </div>
                  </td>
                  <td class="muted">${UI.esc(UI.catName(p.category))}</td>
                  <td class="right">${p.variants.length}</td>
                  <td class="right"><strong>${p.madeToOrder ? '—' : UI.num(total)}</strong></td>
                  <td class="right mono muted">${UI.money(p.cost)}</td>
                  <td class="right mono"><strong>${UI.money(p.price)}</strong></td>
                  <td class="right"><span class="delta ${margin >= 50 ? 'up' : ''}">${margin.toFixed(0)}%</span></td>
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
    const q = document.getElementById('prodQ');
    q.oninput = () => {
      this.f.prod.q = q.value.trim().toLowerCase();
      const pos = q.selectionStart;
      this.renderPage('products');
      const nq = document.getElementById('prodQ');
      nq.focus(); nq.setSelectionRange(pos, pos);
    };
    document.getElementById('prodCat').onchange    = e => { this.f.prod.cat = e.target.value; this.renderPage('products'); };
    document.getElementById('prodActive').onchange = e => { this.f.prod.active = e.target.value; this.renderPage('products'); };
    document.getElementById('prodNew').onclick     = () => this.productForm();

    document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => this.productForm(b.dataset.edit));
    document.querySelectorAll('[data-toggle]').forEach(b => b.onclick = () => {
      const p = Store.product(b.dataset.toggle);
      const act = () => {
        const r = Store.toggleProduct(p.id);
        App.refreshAll();
        UI.toast('ok', r.active ? I18N.t('adm.products.activatedTitle') : I18N.t('adm.products.deactivatedTitle'),
          r.active ? I18N.t('adm.products.activatedBody') : I18N.t('adm.products.deactivatedBody'));
      };
      if (p.active) UI.confirm(I18N.t('adm.products.confirmDeactivateTitle'),
        I18N.t('adm.products.confirmDeactivateBody', { name: `<strong>${UI.esc(p.name)}</strong>` }),
        act, true);
      else act();
    });
  },

  /* ---------- Alta / edición de producto ---------- */
  productForm(id) {
    const p = id ? Store.product(id) : null;
    this.draftVariants = p
      ? JSON.parse(JSON.stringify(p.variants))
      : [{ id: 'nv1', sku: '', size: 'M', color: 'Negro', colorHex: '#16181d', stock: 0, reserved: 0, priceDelta: 0 }];

    UI.modal(`
      <div class="modal-head">
        <h2>${p ? I18N.t('adm.pf.editTitle') : I18N.t('adm.pf.newTitle')}</h2>
        <button class="icon-btn" onclick="UI.closeModal()" aria-label="${I18N.t('adm.pf.close')}"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
      </div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="field span-2">
            <label for="pfName">${I18N.t('adm.pf.name')} <span class="req">*</span></label>
            <input class="input" id="pfName" data-autofocus value="${p ? UI.esc(p.name) : ''}" placeholder="${I18N.t('adm.pf.namePh')}">
            <div class="err-msg" id="pfErrName">${I18N.t('adm.pf.errName')}</div>
          </div>
          <div class="field">
            <label for="pfSku">${I18N.t('adm.pf.sku')} <span class="req">*</span></label>
            <input class="input mono" id="pfSku" value="${p ? UI.esc(p.sku) : ''}" placeholder="${I18N.t('adm.pf.skuPh')}">
            <div class="err-msg" id="pfErrSku">${I18N.t('adm.pf.errSku')}</div>
          </div>
          <div class="field">
            <label for="pfCat">${I18N.t('adm.pf.category')}</label>
            <select class="select" id="pfCat">
              ${SEED.categories.map(c => `<option value="${c.id}"${p && p.category === c.id ? ' selected' : ''}>${UI.esc(c.name)}</option>`).join('')}
            </select>
          </div>
          <div class="field span-2">
            <label for="pfDesc">${I18N.t('adm.pf.desc')}</label>
            <textarea class="input" id="pfDesc" rows="3" placeholder="${I18N.t('adm.pf.descPh')}">${p ? UI.esc(p.description) : ''}</textarea>
          </div>
          <div class="field">
            <label for="pfCost">${I18N.t('adm.pf.cost')} <span class="req">*</span></label>
            <input class="input" id="pfCost" type="number" step="0.01" min="0" value="${p ? p.cost : ''}" placeholder="17.80">
          </div>
          <div class="field">
            <label for="pfPrice">${I18N.t('adm.pf.price')} <span class="req">*</span></label>
            <input class="input" id="pfPrice" type="number" step="0.01" min="0" value="${p ? p.price : ''}" placeholder="42.00">
            <div class="hint" id="pfMargin"></div>
          </div>
          <div class="field">
            <label for="pfMin">${I18N.t('adm.pf.min')}</label>
            <input class="input" id="pfMin" type="number" min="0" value="${p ? p.minStock : 8}">
            <div class="hint">${I18N.t('adm.pf.minHint')}</div>
          </div>
          <div class="field">
            <label>${I18N.t('adm.pf.options')}</label>
            <label style="display:flex;align-items:center;gap:8px;font-weight:500;margin-top:8px;cursor:pointer">
              <input type="checkbox" id="pfActive" ${!p || p.active ? 'checked' : ''} style="accent-color:#c9a227"> ${I18N.t('adm.pf.activeLabel')}
            </label>
            <label style="display:flex;align-items:center;gap:8px;font-weight:500;margin-top:8px;cursor:pointer">
              <input type="checkbox" id="pfFeat" ${p && p.featured ? 'checked' : ''} style="accent-color:#c9a227"> ${I18N.t('adm.pf.featuredLabel')}
            </label>
          </div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin:20px 0 12px;gap:12px;flex-wrap:wrap">
          <div>
            <h3>${I18N.t('adm.pf.variantsTitle')}</h3>
            <p class="muted tiny" style="margin-top:2px">${I18N.t('adm.pf.variantsSub')}</p>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-sm" id="pfGen">${I18N.t('adm.pf.genSizes')}</button>
            <button class="btn btn-sm" id="pfAddVar">${I18N.t('adm.pf.addVar')}</button>
          </div>
        </div>

        <div class="var-editor">
          <div class="var-head"><span>${I18N.t('adm.pf.colSku')}</span><span>${I18N.t('adm.pf.colColor')}</span><span>${I18N.t('adm.pf.colSize')}</span><span>${I18N.t('adm.pf.colStock')}</span><span>${I18N.t('adm.pf.colPriceDelta')}</span><span></span></div>
          <div id="pfVars"></div>
        </div>
        ${p ? `<div class="hint" style="margin-top:10px">${I18N.t('adm.pf.editHint')}</div>` : ''}
      </div>
      <div class="modal-foot">
        <button class="btn" onclick="UI.closeModal()">${I18N.t('adm.pf.cancel')}</button>
        <button class="btn btn-primary" id="pfSave">${p ? I18N.t('adm.pf.saveEdit') : I18N.t('adm.pf.saveNew')}</button>
      </div>`, 'wide');

    this.renderVariantRows();

    const cost = document.getElementById('pfCost');
    const price = document.getElementById('pfPrice');
    const showMargin = () => {
      const c = parseFloat(cost.value) || 0, pr = parseFloat(price.value) || 0;
      const el = document.getElementById('pfMargin');
      if (pr > 0 && c > 0) {
        const m = ((pr - c) / pr * 100);
        el.innerHTML = `${I18N.t('adm.pf.marginLabel')}: <strong style="color:${m >= 50 ? 'var(--ok-600)' : 'var(--warn-600)'}">${m.toFixed(1)}%</strong> · ${UI.money(pr - c)} ${I18N.t('adm.pf.perUnit')}`;
      } else el.textContent = '';
    };
    cost.oninput = showMargin; price.oninput = showMargin; showMargin();

    document.getElementById('pfAddVar').onclick = () => {
      this.draftVariants.push({
        id: 'nv' + Date.now(), sku: '', size: 'M', color: 'Negro',
        colorHex: '#16181d', stock: 0, reserved: 0, priceDelta: 0
      });
      this.renderVariantRows();
    };

    document.getElementById('pfGen').onclick = () => {
      const base = document.getElementById('pfSku').value.trim().toUpperCase() || 'SKU';
      const color = this.draftVariants[0] ? this.draftVariants[0].color : 'Negro';
      const code = color.replace(/[^A-Za-zÁÉÍÓÚÑ]/g, '').slice(0, 3).toUpperCase();
      this.draftVariants = SEED.sizes.map((s, i) => ({
        id: 'nv' + Date.now() + i,
        sku: `${base}-${code}-${s}`,
        size: s, color,
        colorHex: SEED.colorMap[color] || '#6b7280',
        stock: 0, reserved: 0, priceDelta: 0
      }));
      this.renderVariantRows();
      UI.toast('info', I18N.t('adm.pf.varsGenerated'), I18N.t('adm.pf.varsGeneratedBody'));
    };

    document.getElementById('pfSave').onclick = () => this.saveProductForm(p);
  },

  renderVariantRows() {
    const box = document.getElementById('pfVars');
    box.innerHTML = this.draftVariants.map((v, i) => `
      <div class="var-row">
        <input class="input mono" data-v="sku" data-i="${i}" value="${UI.esc(v.sku)}" placeholder="SKU-COL-M">
        <select class="select" data-v="color" data-i="${i}">
          ${Object.keys(SEED.colorMap).map(c => `<option${v.color === c ? ' selected' : ''}>${c}</option>`).join('')}
        </select>
        <select class="select" data-v="size" data-i="${i}">
          ${SEED.sizes.concat(['Única']).map(s => `<option${v.size === s ? ' selected' : ''}>${s}</option>`).join('')}
        </select>
        <input class="input" data-v="stock" data-i="${i}" type="number" min="0" value="${v.stock}">
        <input class="input" data-v="priceDelta" data-i="${i}" type="number" step="0.01" value="${v.priceDelta || 0}">
        <button class="icon-btn" data-del-v="${i}" aria-label="${I18N.t('adm.pf.deleteVariant')}">
          <svg style="width:15px;height:15px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>`).join('');

    box.querySelectorAll('[data-v]').forEach(inp => {
      inp.onchange = () => {
        const i = +inp.dataset.i, k = inp.dataset.v;
        let val = inp.value;
        if (k === 'stock') val = Math.max(0, parseInt(val) || 0);
        if (k === 'priceDelta') val = parseFloat(val) || 0;
        this.draftVariants[i][k] = val;
        if (k === 'color') this.draftVariants[i].colorHex = SEED.colorMap[val] || '#6b7280';
      };
    });

    box.querySelectorAll('[data-del-v]').forEach(b => b.onclick = () => {
      if (this.draftVariants.length <= 1) {
        UI.toast('warn', I18N.t('adm.pf.cantDelete'), I18N.t('adm.pf.cantDeleteBody'));
        return;
      }
      this.draftVariants.splice(+b.dataset.delV, 1);
      this.renderVariantRows();
    });
  },

  saveProductForm(existing) {
    const name  = document.getElementById('pfName').value.trim();
    const sku   = document.getElementById('pfSku').value.trim().toUpperCase();
    const cost  = parseFloat(document.getElementById('pfCost').value) || 0;
    const price = parseFloat(document.getElementById('pfPrice').value) || 0;

    let bad = false;
    const mark = (i, e, cond) => {
      const inp = document.getElementById(i), err = document.getElementById(e);
      if (cond) { inp.classList.add('error'); err.classList.add('show'); bad = true; }
      else { inp.classList.remove('error'); err.classList.remove('show'); }
    };
    mark('pfName', 'pfErrName', !name);
    mark('pfSku', 'pfErrSku', !sku);

    if (price <= 0) { document.getElementById('pfPrice').classList.add('error'); bad = true; }
    if (bad) { UI.toast('danger', I18N.t('adm.pf.missingData'), I18N.t('adm.pf.missingDataBody')); return; }

    // Autocompleta SKUs vacíos de variante
    this.draftVariants.forEach(v => {
      if (!v.sku) {
        const code = v.color.replace(/[^A-Za-zÁÉÍÓÚÑ]/g, '').slice(0, 3).toUpperCase();
        v.sku = `${sku}-${code}-${v.size}`;
      }
    });

    const dupes = this.draftVariants.map(v => v.sku).filter((s, i, a) => a.indexOf(s) !== i);
    if (dupes.length) {
      UI.toast('danger', I18N.t('adm.pf.dupeSku'), I18N.t('adm.pf.dupeSkuBody', { sku: dupes[0] }));
      return;
    }

    const payload = {
      name, sku, cost, price,
      category: document.getElementById('pfCat').value,
      description: document.getElementById('pfDesc').value.trim(),
      minStock: parseInt(document.getElementById('pfMin').value) || 0,
      active: document.getElementById('pfActive').checked,
      featured: document.getElementById('pfFeat').checked,
      tags: existing ? existing.tags : [],
      variants: this.draftVariants
    };

    if (existing) {
      // Los cambios manuales de stock quedan asentados en el libro de movimientos.
      const before = {};
      existing.variants.forEach(v => before[v.id] = v.stock);

      payload.id = existing.id;
      payload.madeToOrder = existing.madeToOrder;
      Store.saveProduct(payload);

      this.draftVariants.forEach(v => {
        const prev = before[v.id];
        if (prev === undefined) return;
        const diff = v.stock - prev;
        if (diff !== 0) {
          const target = Store.findVariant(v.id);
          if (target) {
            target.variant.stock = prev;  // revierte para que el movimiento lo aplique
            Store.applyMovement({
              variantId: v.id,
              type: diff > 0 ? 'entrada' : 'salida',
              qty: Math.abs(diff),
              reason: 'Conteo físico (ajuste)',
              ref: 'EDIT-' + sku
            });
          }
        }
      });

      UI.closeModal();
      App.refreshAll();
      UI.toast('ok', I18N.t('adm.pf.updated'), I18N.t('adm.pf.updatedBody', { name }));
    } else {
      const r = Store.saveProduct(payload);
      UI.closeModal();
      App.refreshAll();
      UI.toast('ok', I18N.t('adm.pf.created'),
        I18N.t('adm.pf.createdBody', { name, count: r.product.variants.length }));
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
        m.reason.toLowerCase().includes(q));
    }

    const allReasons = [...new Set(Store.movements.map(m => m.reason))].sort();
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
        <div class="search-box">
          <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input class="input" id="movQ" placeholder="${I18N.t('adm.movements.searchPh')}" value="${UI.esc(f.q)}">
        </div>
        <select class="select" id="movType">
          <option value="todos">${I18N.t('adm.movements.allTypes')}</option>
          <option value="entrada"${f.type === 'entrada' ? ' selected' : ''}>${I18N.t('adm.movements.onlyIn')}</option>
          <option value="salida"${f.type === 'salida' ? ' selected' : ''}>${I18N.t('adm.movements.onlyOut')}</option>
        </select>
        <select class="select" id="movReason">
          <option value="todos">${I18N.t('adm.movements.allReasons')}</option>
          ${allReasons.map(r => `<option value="${UI.esc(r)}"${f.reason === r ? ' selected' : ''}>${UI.esc(r)}</option>`).join('')}
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
                  <td class="nowrap"><div>${UI.date(m.date)}</div><div class="cell-sub">${new Date(m.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })}</div></td>
                  <td><div class="cell-main">${UI.esc(m.product)}</div><div class="cell-sub">${UI.esc(m.variant)}</div></td>
                  <td class="mono tiny">${UI.esc(m.sku)}</td>
                  <td>${m.type === 'entrada'
                        ? `<span class="badge badge-ok">${I18N.t('adm.movements.badgeIn')}</span>`
                        : `<span class="badge badge-danger">${I18N.t('adm.movements.badgeOut')}</span>`}</td>
                  <td>${UI.esc(m.reason)}</td>
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
    const q = document.getElementById('movQ');
    q.oninput = () => {
      this.f.mov.q = q.value.trim().toLowerCase();
      const pos = q.selectionStart;
      this.renderPage('movements');
      const nq = document.getElementById('movQ');
      nq.focus(); nq.setSelectionRange(pos, pos);
    };
    document.getElementById('movType').onchange   = e => { this.f.mov.type = e.target.value; this.renderPage('movements'); };
    document.getElementById('movReason').onchange = e => { this.f.mov.reason = e.target.value; this.renderPage('movements'); };
    document.getElementById('movNew').onclick     = () => this.movementForm();
    document.getElementById('movExport').onclick  = () => {
      const lines = [[
        I18N.t('adm.movements.csvDate'), I18N.t('adm.movements.csvSku'), I18N.t('adm.movements.csvProduct'),
        I18N.t('adm.movements.csvVariant'), I18N.t('adm.movements.csvType'), I18N.t('adm.movements.csvQty'),
        I18N.t('adm.movements.csvReason'), I18N.t('adm.movements.csvRef'), I18N.t('adm.movements.csvBefore'),
        I18N.t('adm.movements.csvAfter'), I18N.t('adm.movements.csvUser')
      ].join(',')];
      Store.movements.forEach(m => lines.push([
        m.date, m.sku, `"${m.product}"`, `"${m.variant}"`, m.type, m.qty,
        `"${m.reason}"`, m.ref, m.before, m.after, `"${m.user}"`
      ].join(',')));
      const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'movimientos_soccercage.csv';
      a.click();
      UI.toast('ok', I18N.t('adm.movements.exportDone'), I18N.t('adm.movements.exportDoneBody'));
    };
  },

  /* ============================================================
     PEDIDOS
     ============================================================ */
  ordersHTML() {
    const f = this.f.ord;
    let list = Store.orders.slice();

    if (f.status !== 'todos') list = list.filter(o => o.status === f.status);
    if (f.q) {
      const q = f.q;
      list = list.filter(o => {
        const c = Store.customers.find(x => x.id === o.customerId);
        return o.number.toLowerCase().includes(q) || (c && c.name.toLowerCase().includes(q));
      });
    }

    const counts = {
      pendiente:  Store.orders.filter(o => o.status === 'pendiente').length,
      procesando: Store.orders.filter(o => o.status === 'procesando').length,
      enviado:    Store.orders.filter(o => o.status === 'enviado').length,
      completado: Store.orders.filter(o => o.status === 'completado').length
    };
    const revenue = Store.orders.filter(o => o.paymentStatus === 'pagado').reduce((s, o) => s + o.total, 0);

    return this.head(I18N.t('adm.orders.title'), I18N.t('adm.orders.sub')) + `
    <div class="kpi-grid">
      <div class="kpi ${counts.pendiente ? 'kpi-alerta' : ''}"><div class="kpi-label">${I18N.t('adm.orders.kpiPending')}</div><div class="kpi-value">${counts.pendiente}</div><div class="kpi-foot">${I18N.t('adm.orders.kpiPendingFoot')}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.orders.kpiProcessing')}</div><div class="kpi-value">${counts.procesando}</div><div class="kpi-foot">${I18N.t('adm.orders.kpiProcessingFoot')}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.orders.kpiShipped')}</div><div class="kpi-value">${counts.enviado}</div><div class="kpi-foot">${I18N.t('adm.orders.kpiShippedFoot')}</div></div>
      <div class="kpi kpi-principal"><div class="kpi-label">${I18N.t('adm.orders.kpiRevenue')}</div><div class="kpi-value">${UI.money0(revenue)}</div><div class="kpi-foot">${I18N.t('adm.orders.kpiRevenueFoot', { n: counts.completado })}</div></div>
    </div>

    <div class="card">
      <div class="filter-bar">
        <div class="search-box">
          <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input class="input" id="ordQ" placeholder="${I18N.t('adm.orders.searchPh')}" value="${UI.esc(f.q)}">
        </div>
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
              <th>${I18N.t('adm.orders.colOrder')}</th><th>${I18N.t('adm.orders.colCustomer')}</th><th>${I18N.t('adm.orders.colDate')}</th><th class="right">${I18N.t('adm.orders.colItems')}</th>
              <th class="right">${I18N.t('adm.orders.colTotal')}</th><th>${I18N.t('adm.orders.colPayment')}</th><th>${I18N.t('adm.orders.colStatus')}</th><th class="right">${I18N.t('adm.orders.colActions')}</th>
            </tr></thead>
            <tbody>
              ${list.map(o => {
                const c = Store.customers.find(x => x.id === o.customerId);
                const units = o.items.reduce((s, i) => s + i.qty, 0);
                return `<tr>
                  <td><div class="cell-main mono">${o.number}</div><div class="cell-sub">${UI.esc(o.paymentMethod)}</div></td>
                  <td><div class="cell-main">${UI.esc(c ? c.name : '—')}</div><div class="cell-sub">${UI.esc(c ? c.city : '')}</div></td>
                  <td class="nowrap">${UI.date(o.date)}<div class="cell-sub">${new Date(o.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })}</div></td>
                  <td class="right">${I18N.t('adm.orders.units', { n: units })}<div class="cell-sub">${I18N.t(o.items.length === 1 ? 'adm.orders.lineItem' : 'adm.orders.lineItemPlural', { n: o.items.length })}</div></td>
                  <td class="right"><strong>${UI.money(o.total)}</strong></td>
                  <td>${UI.payBadge(o.paymentStatus)}</td>
                  <td>${UI.orderBadge(o.status)}</td>
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
    const q = document.getElementById('ordQ');
    q.oninput = () => {
      this.f.ord.q = q.value.trim().toLowerCase();
      const pos = q.selectionStart;
      this.renderPage('orders');
      const nq = document.getElementById('ordQ');
      nq.focus(); nq.setSelectionRange(pos, pos);
    };
    document.getElementById('ordStatus').onchange = e => { this.f.ord.status = e.target.value; this.renderPage('orders'); };
    document.querySelectorAll('[data-order]').forEach(b => b.onclick = () => this.orderDetail(b.dataset.order));
  },

  orderDetail(id) {
    const o = Store.orders.find(x => x.id === id);
    if (!o) return;
    const c = Store.customers.find(x => x.id === o.customerId);
    const related = Store.movements.filter(m => m.ref === o.number);

    const flow = ['pendiente', 'procesando', 'enviado', 'completado'];
    const idx = flow.indexOf(o.status);

    UI.modal(`
      <div class="modal-head">
        <div>
          <h2>${I18N.t('adm.orders.detail.title', { number: o.number })}</h2>
          <p class="muted tiny" style="margin-top:3px">${UI.date(o.date, true)} · ${UI.esc(o.paymentMethod)}</p>
        </div>
        <button class="icon-btn" onclick="UI.closeModal()" aria-label="${I18N.t('adm.alerts.close')}"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
      </div>

      <div class="modal-body">
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px">
          ${UI.orderBadge(o.status)} ${UI.payBadge(o.paymentStatus)}
        </div>

        ${o.status !== 'cancelado' ? `
        <div class="steps" style="margin-bottom:20px">
          ${flow.map((s, i) => `
            <div class="step ${i < idx ? 'done' : ''} ${i === idx ? 'active' : ''}">
              <span class="n">${i < idx ? '✓' : i + 1}</span> ${I18N.t('adm.orders.status.' + s)}
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
            <div class="kv"><span class="k">${I18N.t('adm.orders.detail.city')}</span><span class="v">${UI.esc(c ? c.city : '—')}</span></div>
          </div>
          <div>
            <h3 style="margin-bottom:10px">${I18N.t('adm.orders.detail.amount')}</h3>
            <div class="kv"><span class="k">${I18N.t('adm.orders.detail.subtotal')}</span><span class="v">${UI.money(o.subtotal)}</span></div>
            <div class="kv"><span class="k">${I18N.t('adm.orders.detail.shipping')}</span><span class="v">${o.shipping ? UI.money(o.shipping) : I18N.t('adm.orders.detail.free')}</span></div>
            <div class="kv"><span class="k">${I18N.t('adm.orders.detail.tax')}</span><span class="v">${UI.money(o.tax || 0)}</span></div>
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
                  <td><div class="cell-main">${UI.esc(i.name)}</div><div class="cell-sub">${UI.esc(i.variant)}</div></td>
                  <td class="mono tiny">${UI.esc(i.sku)}</td>
                  <td class="right">${i.qty}</td>
                  <td class="right mono">${UI.money(i.price)}</td>
                  <td class="right mono"><strong>${UI.money(i.price * i.qty)}</strong></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>

        ${related.length ? `
        <h3 style="margin:20px 0 10px">${I18N.t('adm.orders.detail.invImpact')}</h3>
        <div class="trace" style="margin-top:0">
          <div class="trace-title">${I18N.t('adm.orders.detail.generatedMovements')}</div>
          ${related.map(m => `
            <div class="trace-line">
              <span>${UI.esc(m.sku)}<br><span class="muted tiny">${UI.esc(m.reason)} · ${UI.esc(m.user)}</span></span>
              <span class="nowrap"><span class="mono muted">${m.before}</span> → <b class="mono">${m.after}</b>
                <span class="trace-delta" style="color:${m.type === 'entrada' ? 'var(--ok-600)' : 'var(--danger-600)'}">(${m.type === 'entrada' ? '+' : '−'}${m.qty})</span></span>
            </div>`).join('')}
        </div>` : ''}
      </div>

      <div class="modal-foot">
        <button class="btn" onclick="UI.closeModal()">${I18N.t('adm.alerts.close')}</button>
        ${o.status !== 'cancelado' ? `<button class="btn btn-danger" id="odCancel">${I18N.t('adm.orders.detail.cancelOrder')}</button>` : ''}
        ${idx >= 0 && idx < flow.length - 1
          ? `<button class="btn btn-primary" id="odNext">${I18N.t('adm.orders.detail.markAs', { status: I18N.t('adm.orders.status.' + flow[idx + 1]) })}</button>` : ''}
      </div>`, 'wide');

    const next = document.getElementById('odNext');
    if (next) next.onclick = () => {
      Store.setOrderStatus(o.id, flow[idx + 1]);
      UI.closeModal();
      App.refreshAll();
      UI.toast('ok', I18N.t('adm.orders.detail.statusUpdated'), I18N.t('adm.orders.detail.statusUpdatedBody', { number: o.number, status: I18N.t('adm.orders.status.' + flow[idx + 1]) }));
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

  /* ============================================================
     CLIENTES
     ============================================================ */
  customersHTML() {
    const q = this.f.cust.q;
    let list = Store.customers.slice();
    if (q) list = list.filter(c =>
      c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.city.toLowerCase().includes(q));
    list.sort((a, b) => b.spent - a.spent);

    const total = Store.customers.reduce((s, c) => s + c.spent, 0);
    const clubs = Store.customers.filter(c => c.type !== 'Particular').length;

    return this.head(I18N.t('adm.customers.title'), I18N.t('adm.customers.sub')) + `
    <div class="kpi-grid">
      <div class="kpi kpi-principal"><div class="kpi-label">${I18N.t('adm.customers.kpiCustomers')}</div><div class="kpi-value">${Store.customers.length}</div><div class="kpi-foot">${I18N.t('adm.customers.kpiCustomersFoot', { n: clubs })}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.customers.kpiRevenue')}</div><div class="kpi-value">${UI.money0(total)}</div><div class="kpi-foot">${I18N.t('adm.customers.kpiRevenueFoot')}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.customers.kpiAvg')}</div><div class="kpi-value">${UI.money0(Store.customers.length ? total / Store.customers.length : 0)}</div><div class="kpi-foot">${I18N.t('adm.customers.kpiAvgFoot')}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.customers.kpiOrders')}</div><div class="kpi-value">${Store.customers.reduce((s, c) => s + c.orders, 0)}</div><div class="kpi-foot">${I18N.t('adm.customers.kpiOrdersFoot')}</div></div>
    </div>

    <div class="card">
      <div class="filter-bar">
        <div class="search-box">
          <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input class="input" id="custQ" placeholder="${I18N.t('adm.customers.searchPh')}" value="${UI.esc(q)}">
        </div>
      </div>
      <div class="card-body flush">
        ${list.length ? `
        <div class="table-wrap">
          <table class="data">
            <thead><tr><th>${I18N.t('adm.customers.colCustomer')}</th><th>${I18N.t('adm.customers.colContact')}</th><th>${I18N.t('adm.customers.colType')}</th><th class="right">${I18N.t('adm.customers.colOrders')}</th><th class="right">${I18N.t('adm.customers.colTotalSpent')}</th><th>${I18N.t('adm.customers.colSince')}</th></tr></thead>
            <tbody>
              ${list.map(c => `
                <tr>
                  <td>
                    <div class="cell-flex">
                      <div class="thumb" style="background:var(--ink-800)">${UI.esc(c.name.split(' ').map(w => w[0]).slice(0, 2).join(''))}</div>
                      <div><div class="cell-main">${UI.esc(c.name)}</div><div class="cell-sub">${UI.esc(c.city)}</div></div>
                    </div>
                  </td>
                  <td><div class="tiny">${UI.esc(c.email)}</div><div class="cell-sub">${UI.esc(c.phone)}</div></td>
                  <td><span class="badge ${c.type === 'Particular' ? 'badge-neutral' : 'badge-info'}">${UI.esc(c.type)}</span></td>
                  <td class="right">${c.orders}</td>
                  <td class="right"><strong>${UI.money(c.spent)}</strong></td>
                  <td class="muted tiny">${UI.date(c.since)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>` : UI.empty(I18N.t('adm.customers.emptyTitle'), I18N.t('adm.customers.emptyBody'))}
      </div>
    </div>`;
  },

  customersBind() {
    const q = document.getElementById('custQ');
    q.oninput = () => {
      this.f.cust.q = q.value.trim().toLowerCase();
      const pos = q.selectionStart;
      this.renderPage('customers');
      const nq = document.getElementById('custQ');
      nq.focus(); nq.setSelectionRange(pos, pos);
    };
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
            <div class="thumb" style="background:${v.colorHex};color:${['#f2f3f5','#c9a227'].includes(v.colorHex) ? '#16181d' : '#fff'}">${UI.esc(v.size)}</div>
            <div><div class="cell-main">${UI.esc(p.name)}</div><div class="cell-sub">${UI.esc(v.size)} · ${UI.esc(v.color)}</div></div>
          </div>
        </td>
        <td class="mono tiny">${UI.esc(v.sku)}</td>
        <td class="right"><strong style="color:${critical ? 'var(--danger-600)' : 'var(--warn-600)'};font-size:15px">${v.stock}</strong></td>
        <td class="right muted">${p.minStock}</td>
        <td class="right">${critical ? `<span class="badge badge-danger">${I18N.t('adm.alerts.restockNow')}</span>` : `<span class="badge badge-warn">${I18N.t('adm.alerts.missing', { n: Math.max(1, p.minStock - v.stock) })}</span>`}</td>
        <td class="right"><button class="btn btn-sm btn-primary" data-restock="${v.id}">${I18N.t('adm.alerts.restockBtn')}</button></td>
      </tr>`;

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
      <div class="card-body flush">
        <div class="table-wrap">
          <table class="data">
            <thead><tr><th>${I18N.t('adm.alerts.colProductVariant')}</th><th>${I18N.t('adm.alerts.colSku')}</th><th class="right">${I18N.t('adm.alerts.colStock')}</th><th class="right">${I18N.t('adm.alerts.colMin')}</th><th class="right">${I18N.t('adm.alerts.colStatus')}</th><th class="right">${I18N.t('adm.alerts.colAction')}</th></tr></thead>
            <tbody>${m.outItems.map(({ p, v }) => row(p, v, true)).join('')}</tbody>
          </table>
        </div>
      </div>
    </div>` : ''}

    ${m.lowCount ? `
    <div class="card">
      <div class="card-head">
        <div>
          <h2 style="color:var(--warn-600)">${I18N.t('adm.alerts.lowTitle', { n: m.lowCount })}</h2>
          <p class="muted tiny" style="margin-top:2px">${I18N.t('adm.alerts.lowSub')}</p>
        </div>
      </div>
      <div class="card-body flush">
        <div class="table-wrap">
          <table class="data">
            <thead><tr><th>${I18N.t('adm.alerts.colProductVariant')}</th><th>${I18N.t('adm.alerts.colSku')}</th><th class="right">${I18N.t('adm.alerts.colStock')}</th><th class="right">${I18N.t('adm.alerts.colMin')}</th><th class="right">${I18N.t('adm.alerts.colStatus')}</th><th class="right">${I18N.t('adm.alerts.colAction')}</th></tr></thead>
            <tbody>${m.lowItems.map(({ p, v }) => row(p, v, false)).join('')}</tbody>
          </table>
        </div>
      </div>
    </div>` : ''}`;
  },

  alertsBind() {
    document.querySelectorAll('[data-restock]').forEach(b =>
      b.onclick = () => this.movementForm(b.dataset.restock, 'entrada'));

    const g = document.getElementById('alertOrder');
    if (g) g.onclick = () => {
      const m = Store.metrics();
      const items = [...m.outItems, ...m.lowItems];
      if (!items.length) { UI.toast('info', I18N.t('adm.alerts.nothingToRestock'), I18N.t('adm.alerts.nothingToRestockBody')); return; }
      const lines = items.map(({ p, v }) => {
        const need = Math.max(p.minStock * 2 - v.stock, p.minStock);
        return { sku: v.sku, name: p.name, variant: `${v.size} / ${v.color}`, need, cost: need * p.cost };
      });
      const total = lines.reduce((s, l) => s + l.cost, 0);

      UI.modal(`
        <div class="modal-head"><h2>${I18N.t('adm.alerts.proposalTitle')}</h2>
          <button class="icon-btn" onclick="UI.closeModal()" aria-label="${I18N.t('adm.alerts.close')}"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
        </div>
        <div class="modal-body">
          <p class="muted" style="font-size:13.5px;margin-bottom:16px">
            ${I18N.t('adm.alerts.proposalExplain')}
          </p>
          <div class="table-wrap" style="border:1px solid var(--border);border-radius:var(--r-md)">
            <table class="data">
              <thead><tr><th>${I18N.t('adm.alerts.colSku')}</th><th>${I18N.t('adm.alerts.colProduct')}</th><th class="right">${I18N.t('adm.alerts.colUnits')}</th><th class="right">${I18N.t('adm.alerts.colEstCost')}</th></tr></thead>
              <tbody>
                ${lines.map(l => `<tr>
                  <td class="mono tiny">${UI.esc(l.sku)}</td>
                  <td><div class="cell-main">${UI.esc(l.name)}</div><div class="cell-sub">${UI.esc(l.variant)}</div></td>
                  <td class="right"><strong>${l.need}</strong></td>
                  <td class="right mono">${UI.money(l.cost)}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div class="sum-row total" style="margin-top:14px"><span>${I18N.t('adm.alerts.estInvestment')}</span><span>${UI.money(total)}</span></div>
        </div>
        <div class="modal-foot">
          <button class="btn" onclick="UI.closeModal()">${I18N.t('adm.alerts.close')}</button>
          <button class="btn btn-primary" id="opConfirm">${I18N.t('adm.alerts.logAsIn')}</button>
        </div>`, 'wide');

      document.getElementById('opConfirm').onclick = () => {
        const ref = 'OP-' + Math.floor(1000 + Math.random() * 9000);
        let n = 0;
        items.forEach(({ p, v }) => {
          const need = Math.max(p.minStock * 2 - v.stock, p.minStock);
          const r = Store.applyMovement({
            variantId: v.id, type: 'entrada', qty: need,
            reason: 'Producción terminada', ref
          });
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

    // Valor de inventario por categoría
    const byCat = {};
    Store.products.filter(p => p.active && !p.madeToOrder).forEach(p => {
      const val = p.variants.reduce((s, v) => s + v.stock * p.cost, 0);
      const units = p.variants.reduce((s, v) => s + v.stock, 0);
      const k = UI.catName(p.category);
      if (!byCat[k]) byCat[k] = { value: 0, units: 0 };
      byCat[k].value += val;
      byCat[k].units += units;
    });
    const cats = Object.entries(byCat).sort((a, b) => b[1].value - a[1].value);
    const maxCat = Math.max(1, ...cats.map(c => c[1].value));

    // Ventas por día del mes
    const byDay = {};
    Store.orders.filter(o => o.paymentStatus === 'pagado').forEach(o => {
      const d = o.date.slice(0, 10);
      byDay[d] = (byDay[d] || 0) + o.total;
    });
    const days = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]));
    const maxDay = Math.max(1, ...days.map(d => d[1]));

    // Rotación por motivo
    const byReason = {};
    Store.movements.forEach(mv => {
      if (!byReason[mv.reason]) byReason[mv.reason] = { in: 0, out: 0 };
      byReason[mv.reason][mv.type === 'entrada' ? 'in' : 'out'] += mv.qty;
    });
    const reasons = Object.entries(byReason).sort((a, b) => (b[1].in + b[1].out) - (a[1].in + a[1].out));
    const maxReason = Math.max(1, ...reasons.map(r => r[1].in + r[1].out));

    const topMax = Math.max(1, ...m.topProducts.map(p => p.qty));

    return this.head(
      I18N.t('adm.reports.title'),
      I18N.t('adm.reports.sub'),
      `<button class="btn btn-sm" onclick="window.print()">${I18N.t('adm.reports.printBtn')}</button>`
    ) + `
    <div class="kpi-grid">
      <div class="kpi kpi-principal"><div class="kpi-label">${I18N.t('adm.reports.kpiInvCapital')}</div><div class="kpi-value">${UI.money0(m.invValue)}</div><div class="kpi-foot">${I18N.t('adm.reports.kpiInvCapitalFoot')}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.reports.kpiMargin')}</div><div class="kpi-value">${UI.money0(m.margin)}</div><div class="kpi-foot">${I18N.t('adm.reports.kpiMarginFoot')}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.reports.kpiMonthSales')}</div><div class="kpi-value">${UI.money0(m.salesMonth)}</div><div class="kpi-foot">${I18N.t('adm.reports.kpiMonthSalesFoot')}</div></div>
      <div class="kpi"><div class="kpi-label">${I18N.t('adm.reports.kpiTicket')}</div><div class="kpi-value">${UI.money0(m.ticket)}</div><div class="kpi-foot">${I18N.t('adm.reports.kpiTicketFoot')}</div></div>
    </div>

    <div class="grid-halves">
      <div class="card">
        <div class="card-head"><h2>${I18N.t('adm.reports.invByCategory')}</h2></div>
        <div class="card-body">
          ${cats.map(([name, d], i) => `
            <div class="bar-row">
              <div class="bar-label"><div style="font-weight:560">${UI.esc(name)}</div><div class="tiny muted">${I18N.t('adm.reports.units', { n: d.units })}</div></div>
              <div class="bar-track"><div class="bar-fill ${i === 0 ? 'gold' : ''}" style="width:${(d.value / maxCat) * 100}%"></div></div>
              <div class="bar-val">${UI.money0(d.value)}</div>
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

      <div class="card">
        <div class="card-head"><h2>${I18N.t('adm.reports.movementsByReason')}</h2></div>
        <div class="card-body">
          ${reasons.map(([name, d]) => `
            <div class="bar-row">
              <div class="bar-label"><div style="font-weight:560;font-size:12.5px">${UI.esc(name)}</div>
                <div class="tiny"><span style="color:var(--ok-600)">+${d.in}</span> · <span style="color:var(--danger-600)">−${d.out}</span></div></div>
              <div class="bar-track"><div class="bar-fill" style="width:${((d.in + d.out) / maxReason) * 100}%"></div></div>
              <div class="bar-val">${I18N.t('adm.reports.unitsShort', { n: d.in + d.out })}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:var(--s5)">
      <div class="card-head"><h2>${I18N.t('adm.reports.valuationDetail')}</h2></div>
      <div class="card-body flush">
        <div class="table-wrap">
          <table class="data">
            <thead><tr><th>${I18N.t('adm.reports.colProduct')}</th><th class="right">${I18N.t('adm.reports.colUnits')}</th><th class="right">${I18N.t('adm.reports.colUnitCost')}</th><th class="right">${I18N.t('adm.reports.colCostValue')}</th><th class="right">${I18N.t('adm.reports.colSaleValue')}</th><th class="right">${I18N.t('adm.reports.colMargin')}</th></tr></thead>
            <tbody>
              ${Store.products.filter(p => p.active && !p.madeToOrder).map(p => {
                const u = Store.productStock(p);
                const vc = u * p.cost, vv = u * p.price;
                return `<tr>
                  <td><div class="cell-main">${UI.esc(p.name)}</div><div class="cell-sub mono">${UI.esc(p.sku)}</div></td>
                  <td class="right">${UI.num(u)}</td>
                  <td class="right mono muted">${UI.money(p.cost)}</td>
                  <td class="right mono">${UI.money(vc)}</td>
                  <td class="right mono">${UI.money(vv)}</td>
                  <td class="right"><span class="delta up">${UI.money(vv - vc)}</span></td>
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
    return this.head(I18N.t('adm.settings.title'), I18N.t('adm.settings.sub')) + `
    <div class="grid-halves">
      <div class="card">
        <div class="card-head"><h2>${I18N.t('adm.settings.companyData')}</h2></div>
        <div class="card-body">
          <div class="field"><label for="stCompany">${I18N.t('adm.settings.companyName')}</label><input class="input" id="stCompany" value="${UI.esc(s.company)}"></div>
          <div class="field"><label for="stCity">${I18N.t('adm.settings.city')}</label><input class="input" id="stCity" value="${UI.esc(s.city)}"></div>
          <div class="form-grid">
            <div class="field"><label for="stShip">${I18N.t('adm.settings.flatShipping')}</label><input class="input" id="stShip" type="number" step="0.01" value="${s.shippingFlat}"></div>
            <div class="field"><label for="stFree">${I18N.t('adm.settings.freeShippingOver')}</label><input class="input" id="stFree" type="number" step="1" value="${s.freeShippingOver}"></div>
          </div>
          <div class="field">
            <label for="stLow">${I18N.t('adm.settings.lowStockThreshold')}</label>
            <input class="input" id="stLow" type="number" min="0" value="${s.lowStockGlobal}">
            <div class="hint">${I18N.t('adm.settings.lowStockHint')}</div>
          </div>
          <button class="btn btn-primary" id="stSave">${I18N.t('adm.settings.saveBtn')}</button>
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
                <div class="cell-sub">${UI.esc(u.email)}</div>
              </div>
              <span class="badge ${u.role === 'Administrador' ? 'badge-gold' : 'badge-neutral'}">${UI.esc(u.role)}</span>
            </div>`).join('')}
          <div class="alert alert-info" style="margin-top:16px;margin-bottom:0">
            <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            <div>
              <div class="alert-title">${I18N.t('adm.settings.rolesTitle')}</div>
              <div class="alert-body">${I18N.t('adm.settings.rolesBody')}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h2>${I18N.t('adm.settings.activeUser')}</h2></div>
        <div class="card-body">
          <p class="muted tiny" style="margin-bottom:12px">${I18N.t('adm.settings.activeUserHint')}</p>
          <div class="field">
            <select class="select" id="stUser">
              ${Store.state.users.filter(u => u.id !== 'sys').map(u =>
                `<option value="${u.id}"${Store.state.currentUser === u.id ? ' selected' : ''}>${UI.esc(u.name)} — ${UI.esc(u.role)}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h2>${I18N.t('adm.settings.demoData')}</h2></div>
        <div class="card-body">
          <p class="muted" style="font-size:13.5px;line-height:1.6;margin-bottom:14px">
            ${I18N.t('adm.settings.demoDataBody')}
          </p>
          <div class="kv"><span class="k">${I18N.t('adm.settings.products')}</span><span class="v">${Store.products.length}</span></div>
          <div class="kv"><span class="k">${I18N.t('adm.settings.skus')}</span><span class="v">${Store.products.reduce((s, p) => s + p.variants.length, 0)}</span></div>
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
      s.shippingFlat = parseFloat(document.getElementById('stShip').value) || 0;
      s.freeShippingOver = parseFloat(document.getElementById('stFree').value) || 0;
      s.lowStockGlobal = parseInt(document.getElementById('stLow').value) || 0;
      Store.save();
      App.refreshAll();
      UI.toast('ok', I18N.t('adm.settings.saved'), I18N.t('adm.settings.savedBody'));
    };

    document.getElementById('stUser').onchange = e => {
      Store.state.currentUser = e.target.value;
      Store.save();
      App.syncUser();
      UI.toast('info', I18N.t('adm.settings.userChanged'), I18N.t('adm.settings.userChangedBody', { name: Store.user().name }));
    };

    document.getElementById('stReset').onclick = () => UI.confirm(
      I18N.t('adm.settings.confirmResetTitle'),
      I18N.t('adm.settings.confirmResetBody'),
      () => { Store.reset(); App.refreshAll(); UI.toast('ok', I18N.t('adm.settings.resetDone'), I18N.t('adm.settings.resetDoneBody')); },
      true
    );
  }
};
