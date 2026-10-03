/* ============================================================
   SOCCER CAGE — Utilidades de interfaz
   Formato, etiquetas, toasts, modales, imagen de producto y QR.
   ============================================================ */

const UI = {

  /* ---------- Formato ---------- */
  money(n) {
    return '$' + (Number(n) || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    });
  },

  money0(n) {
    return '$' + Math.round(Number(n) || 0).toLocaleString('en-US');
  },

  num(n) { return (Number(n) || 0).toLocaleString('en-US'); },

  pct(rate) {
    const v = (Number(rate) || 0) * 100;
    return (Number.isInteger(v) ? v : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')) + '%';
  },

  locale() { return I18N.lang === 'en' ? 'en-US' : 'es-ES'; },

  date(iso, withTime) {
    // "YYYY-MM-DD" a secas se interpreta como UTC y puede retroceder un día
    // al mostrarla en husos negativos (Miami es UTC−4/−5). Se fuerza local.
    const plain = typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso);
    const d = plain ? new Date(iso + 'T00:00:00') : new Date(iso);
    if (isNaN(d)) return iso;
    const f = d.toLocaleDateString(UI.locale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (!withTime) return f;
    return f + ' · ' + UI.time(iso);
  },

  time(iso) {
    return new Date(iso).toLocaleTimeString(UI.locale(), { hour: '2-digit', minute: '2-digit', hour12: false });
  },

  relative(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return I18N.t('time.now');
    if (min < 60) return I18N.t('time.min', { n: min });
    const h = Math.floor(min / 60);
    if (h < 24) return I18N.t('time.hours', { n: h });
    const d = Math.floor(h / 24);
    if (d < 30) return I18N.t('time.days', { n: d });
    return UI.date(iso);
  },

  /** Escapa texto antes de inyectarlo en HTML. */
  esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  },

  /* ---------- Tallas, categorías y motivos ---------- */
  sizeLabel(code) { return code === 'U' ? I18N.t('size.one') : (code || '—'); },
  sizeTitle(code) { return SEED.sizeNames[code] || UI.sizeLabel(code); },

  catNames(p) { return (p.categories || []).map(c => I18N.t('cat.' + c)).join(' · '); },
  kindName(kind) { return I18N.t('kind.' + kind); },
  lineName(p) { return SEED.lines[p.line] || ''; },

  /** Motivo de un movimiento: código conocido → etiqueta; texto libre → tal cual. */
  reason(code) { return I18N.has('reason.' + code) ? I18N.t('reason.' + code) : code; },

  storeName(id) {
    const s = Store.storeCfg(id);
    return s ? s.name : id;
  },

  storeTags(p) {
    if (!p.stores || !p.stores.length) return `<span class="badge badge-neutral">${I18N.t('store.internal')}</span>`;
    return p.stores.map(id => {
      const s = Store.storeCfg(id);
      return `<span class="tag">${UI.esc(s ? s.short : id)}</span>`;
    }).join('');
  },

  /* ---------- Imagen de producto ----------
     Foto real cuando existe (catálogo importado o subida desde el panel);
     si no, se dibuja la prenda en SVG según su tipo y color. */
  mediaBg() { return 'linear-gradient(160deg, #f7f8fa, #e9ebef)'; },

  shade(hex, pct) {
    const h = (hex || '#6b7280').replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const num = parseInt(full, 16);
    let r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
    const amt = Math.round(2.55 * pct);
    r = Math.min(255, Math.max(0, r + amt));
    g = Math.min(255, Math.max(0, g + amt));
    b = Math.min(255, Math.max(0, b + amt));
    return `rgb(${r},${g},${b})`;
  },

  garment(kind, hex) {
    const c = UI.esc(hex || '#6b7280');
    const dark = UI.shade(hex, -26);
    const light = UI.shade(hex, 16);

    const shapes = {
      jersey: `
        <path d="M32 18 L48 10 L58 16 L72 10 L88 18 L94 40 L82 45 L82 96 Q60 101 38 96 L38 45 L26 40 Z"
              fill="${c}" stroke="${dark}" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M48 10 L60 22 L72 10 L60 16 Z" fill="${dark}" opacity=".5"/>
        <path d="M38 45 L38 96 Q49 99 60 99 L60 45 Z" fill="${light}" opacity=".28"/>`,
      short: `
        <path d="M30 26 L90 26 L94 60 Q94 88 86 92 L72 92 L60 56 L48 92 L34 92 Q26 88 26 60 Z"
              fill="${c}" stroke="${dark}" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M30 26 L90 26 L91 34 L29 34 Z" fill="${dark}" opacity=".45"/>`,
      socks: `
        <path d="M40 12 L58 12 L58 62 Q58 82 72 84 L72 98 L44 98 Q38 84 38 62 Z"
              fill="${c}" stroke="${dark}" stroke-width="1.5" stroke-linejoin="round"/>
        <rect x="38" y="12" width="20" height="11" fill="${dark}" opacity=".5"/>
        <path d="M44 86 L72 86 L72 98 L44 98 Z" fill="${dark}" opacity=".3"/>`,
      apparel: `
        <path d="M30 18 L46 10 L60 16 L74 10 L90 18 L96 44 L84 48 L84 98 L36 98 L36 48 L24 44 Z"
              fill="${c}" stroke="${dark}" stroke-width="1.5" stroke-linejoin="round"/>
        <rect x="57" y="16" width="6" height="82" fill="${dark}" opacity=".55"/>
        <path d="M46 10 L60 16 L74 10 L60 24 Z" fill="${dark}" opacity=".4"/>`,
      accessory: `
        <rect x="18" y="38" width="84" height="48" rx="12" fill="${c}" stroke="${dark}" stroke-width="1.5"/>
        <path d="M46 38 V30 a14 14 0 0128 0 v8" fill="none" stroke="${dark}" stroke-width="3.5"/>
        <rect x="18" y="55" width="84" height="9" fill="${dark}" opacity=".45"/>`,
      kit: `
        <path d="M20 20 L32 13 L42 18 L52 13 L64 20 L68 38 L58 42 L58 76 Q39 80 24 76 L24 42 L14 38 Z"
              fill="#f2f3f5" stroke="${dark}" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M66 52 L110 52 L112 74 Q112 92 106 95 L96 95 L88 72 L80 95 L70 95 Q64 92 64 74 Z"
              fill="${c}" stroke="${dark}" stroke-width="1.4" stroke-linejoin="round"/>`
    };

    return `<svg class="jersey" viewBox="0 0 120 110" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">${shapes[kind] || shapes.jersey}</svg>`;
  },

  /** Foto o dibujo del producto, listo para meter en un contenedor cuadrado. */
  media(p, src) {
    const img = src || p.image;
    if (img) return `<img class="p-photo" src="${UI.esc(img)}" alt="${UI.esc(p.name)}" loading="lazy">`;
    return UI.garment(p.kind, p.colorHex);
  },

  thumb(p) {
    return `<div class="thumb thumb-media">${UI.media(p)}</div>`;
  },

  /* ---------- Etiquetas de estado ---------- */
  stockBadge(status, qty) {
    const cls = { ok: 'badge-ok', bajo: 'badge-warn', agotado: 'badge-danger', inactivo: 'badge-neutral' }[status] || 'badge-ok';
    const q = qty !== undefined ? ` · ${qty}` : '';
    return `<span class="badge ${cls}"><span class="dot"></span>${I18N.t('stock.' + (status in { ok: 1, bajo: 1, agotado: 1, inactivo: 1 } ? status : 'ok'))}${q}</span>`;
  },

  /** El mismo estado se nombra distinto si el pedido se envía o se entrega en mano. */
  orderStatusLabel(status, fulfillment) {
    if (fulfillment === 'pickup' && (status === 'enviado' || status === 'completado')) {
      return I18N.t('order.statusPickup.' + status);
    }
    return I18N.t('adm.orders.status.' + status);
  },

  orderBadge(status, fulfillment) {
    const cls = {
      pendiente: 'badge-warn', procesando: 'badge-info', enviado: 'badge-gold',
      completado: 'badge-ok', cancelado: 'badge-danger'
    }[status] || 'badge-neutral';
    return `<span class="badge ${cls}"><span class="dot"></span>${UI.orderStatusLabel(status, fulfillment)}</span>`;
  },

  payBadge(s) {
    const cls = { pagado: 'badge-ok', pendiente: 'badge-warn', fallido: 'badge-danger', reembolsado: 'badge-neutral' }[s] || 'badge-neutral';
    return `<span class="badge ${cls}">${I18N.has('pay.status.' + s) ? I18N.t('pay.status.' + s) : UI.esc(s)}</span>`;
  },

  fulfillBadge(f) {
    return `<span class="badge badge-neutral">${I18N.t(f === 'shipping' ? 'fulfill.shippingShort' : 'fulfill.pickupShort')}</span>`;
  },

  stockBar(qty, min) {
    const target = Math.max(min * 3, 10);
    const pct = Math.min(100, (qty / target) * 100);
    const cls = qty <= 0 ? 'danger' : (qty <= min ? 'warn' : 'ok');
    return `<div class="stock-bar"><div class="stock-fill ${cls}" style="width:${pct}%"></div></div>`;
  },

  /* ---------- Código QR (enlace público de cada tienda) ---------- */
  qr(text, px) {
    if (typeof qrcode !== 'function') return '';
    const q = qrcode(0, 'M');
    q.addData(text);
    q.make();
    const n = q.getModuleCount();
    let path = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) path += `M${c + 2} ${r + 2}h1v1h-1z`;
    const size = n + 4;
    return `<svg class="qr" viewBox="0 0 ${size} ${size}" width="${px || 180}" height="${px || 180}" role="img" aria-label="QR" shape-rendering="crispEdges">
      <rect width="${size}" height="${size}" fill="#fff"/><path d="${path}" fill="#0b0c0e"/></svg>`;
  },

  /* ---------- Toasts ---------- */
  toast(kind, title, msg) {
    const icons = {
      ok:     '<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>',
      danger: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
      warn:   '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
      info:   '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>'
    };
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.innerHTML = `
      <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">${icons[kind] || icons.info}</svg>
      <div style="flex:1">
        <div class="toast-title">${UI.esc(title)}</div>
        ${msg ? `<div class="toast-msg">${UI.esc(msg)}</div>` : ''}
      </div>`;
    document.getElementById('toastZone').appendChild(el);
    setTimeout(() => {
      el.classList.add('hide');
      setTimeout(() => el.remove(), 260);
    }, 3800);
  },

  /* ---------- Modal ---------- */
  modal(html, size) {
    const ov = document.getElementById('modalOverlay');
    const box = document.getElementById('modalBox');
    box.className = 'modal' + (size ? ' ' + size : '');
    box.innerHTML = html;
    ov.classList.add('open');
    document.body.classList.add('no-scroll');
    const f = box.querySelector('[data-autofocus]');
    if (f) setTimeout(() => f.focus(), 60);
  },

  /** Repinta un modal abierto conservando el desplazamiento y el foco:
      sin esto, cada clic en una talla devolvía la ventana al inicio. */
  rerenderModal(html) {
    const box = document.getElementById('modalBox');
    const body = box.querySelector('.modal-body');
    const top = body ? body.scrollTop : 0;
    // El elemento con foco se identifica por id o por su primer atributo data-*
    // (los botones de talla no tienen id).
    const a = document.activeElement;
    let sel = '';
    if (a && box.contains(a)) {
      if (a.id) sel = '#' + a.id;
      else {
        const k = Object.keys(a.dataset || {})[0];
        if (k) sel = `[data-${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}="${String(a.dataset[k]).replace(/"/g, '\\"')}"]`;
      }
    }
    box.innerHTML = html;
    if (sel) {
      const el = box.querySelector(sel);
      if (el) el.focus({ preventScroll: true });
    }
    // Después de enfocar: algunos navegadores desplazan igualmente al elemento.
    const nb = box.querySelector('.modal-body');
    if (nb) {
      nb.scrollTop = top;
      requestAnimationFrame(() => { nb.scrollTop = top; });
    }
  },

  closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.body.classList.remove('no-scroll');
    document.getElementById('modalBox').innerHTML = '';
  },

  closeBtn() {
    return `<button class="icon-btn" onclick="UI.closeModal()" aria-label="${I18N.t('ui.close')}"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>`;
  },

  confirm(title, message, onYes, danger) {
    UI.modal(`
      <div class="modal-head"><h2>${UI.esc(title)}</h2></div>
      <div class="modal-body"><p style="color:var(--ink-600);line-height:1.6">${message}</p></div>
      <div class="modal-foot">
        <button class="btn" onclick="UI.closeModal()">${I18N.t('ui.cancel')}</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirmYes" data-autofocus>${I18N.t('ui.confirm')}</button>
      </div>`, 'narrow');
    document.getElementById('confirmYes').onclick = () => { UI.closeModal(); onYes(); };
  },

  empty(title, msg, icon) {
    return `
      <div class="empty">
        <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
             stroke-linecap="round" stroke-linejoin="round">
          ${icon || '<path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05"/>'}
        </svg>
        <h3>${UI.esc(title)}</h3>
        <p>${UI.esc(msg || '')}</p>
      </div>`;
  },

  infoIcon() {
    return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>';
  },

  download(filename, text, type) {
    const blob = new Blob(['﻿' + text], { type: (type || 'text/csv') + ';charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
};

/* Cierre de modal por clic fuera y tecla Escape */
document.addEventListener('click', e => {
  if (e.target.id === 'modalOverlay') UI.closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    UI.closeModal();
    if (typeof Shop !== 'undefined') Shop.closeCart();
    document.getElementById('sidebar').classList.remove('open');
  }
});
