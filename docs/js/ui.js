/* ============================================================
   SOCCER CAGE — Utilidades de interfaz
   Formato, toasts, modales y gráficos vectoriales de producto.
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

  date(iso, withTime) {
    // Una fecha simple "YYYY-MM-DD" se interpreta como UTC y puede retroceder
    // un día al mostrarla en husos negativos (Miami es UTC−4/−5). Se fuerza local.
    const plain = typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso);
    const d = plain ? new Date(iso + 'T00:00:00') : new Date(iso);
    if (isNaN(d)) return iso;
    const f = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (!withTime) return f;
    return f + ' · ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
  },

  relative(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'hace un momento';
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    if (d < 30) return `hace ${d} d`;
    return UI.date(iso);
  },

  /** Escapa texto antes de inyectarlo en HTML. */
  esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  },

  /* ---------- Identidad visual de producto ----------
     Sin imágenes externas: el prototipo debe abrirse sin internet.
     Se dibuja una prenda en SVG según la categoría y el color. ---- */
  gradient(hex) {
    return `linear-gradient(145deg, ${UI.shade(hex, 22)}, ${UI.shade(hex, -14)})`;
  },

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

  /** Fondo de la tarjeta: gris neutro, nunca el color de la prenda. */
  mediaBg() { return 'linear-gradient(160deg, #f7f8fa, #e9ebef)'; },

  garment(category, hex) {
    const c = UI.esc(hex || '#6b7280');
    const dark = UI.shade(hex, -26);
    const light = UI.shade(hex, 16);

    const shirt = `
      <path d="M32 18 L48 10 L58 16 L72 10 L88 18 L94 40 L82 45 L82 96 Q60 101 38 96 L38 45 L26 40 Z"
            fill="${c}" stroke="${dark}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M48 10 L60 22 L72 10 L60 16 Z" fill="${dark}" opacity=".5"/>
      <path d="M38 45 L38 96 Q49 99 60 99 L60 45 Z" fill="${light}" opacity=".28"/>`;

    const shorts = `
      <path d="M30 26 L90 26 L94 60 Q94 88 86 92 L72 92 L60 56 L48 92 L34 92 Q26 88 26 60 Z"
            fill="${c}" stroke="${dark}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M30 26 L90 26 L91 34 L29 34 Z" fill="${dark}" opacity=".45"/>`;

    const socks = `
      <path d="M40 12 L58 12 L58 62 Q58 82 72 84 L72 98 L44 98 Q38 84 38 62 Z"
            fill="${c}" stroke="${dark}" stroke-width="1.5" stroke-linejoin="round"/>
      <rect x="38" y="12" width="20" height="11" fill="${dark}" opacity=".5"/>
      <path d="M44 86 L72 86 L72 98 L44 98 Z" fill="${dark}" opacity=".3"/>`;

    const jacket = `
      <path d="M30 18 L46 10 L60 16 L74 10 L90 18 L96 44 L84 48 L84 98 L36 98 L36 48 L24 44 Z"
            fill="${c}" stroke="${dark}" stroke-width="1.5" stroke-linejoin="round"/>
      <rect x="57" y="16" width="6" height="82" fill="${dark}" opacity=".55"/>
      <path d="M46 10 L60 16 L74 10 L60 24 Z" fill="${dark}" opacity=".4"/>`;

    const ball = `
      <circle cx="60" cy="56" r="40" fill="${c}" stroke="${dark}" stroke-width="1.5"/>
      <path d="M60 28 L76 40 L70 60 L50 60 L44 40 Z" fill="${dark}" opacity=".75"/>
      <path d="M60 16 L60 28 M44 40 L30 34 M76 40 L90 34 M50 60 L44 82 M70 60 L76 82"
            stroke="${dark}" stroke-width="2.5" opacity=".6" stroke-linecap="round"/>`;

    const bag = `
      <rect x="18" y="38" width="84" height="48" rx="12" fill="${c}" stroke="${dark}" stroke-width="1.5"/>
      <path d="M46 38 V30 a14 14 0 0128 0 v8" fill="none" stroke="${dark}" stroke-width="3.5"/>
      <rect x="18" y="55" width="84" height="9" fill="${dark}" opacity=".45"/>`;

    const kit = `
      <path d="M20 20 L32 13 L42 18 L52 13 L64 20 L68 38 L58 42 L58 76 Q39 80 24 76 L24 42 L14 38 Z"
            fill="${c}" stroke="${dark}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M66 52 L110 52 L112 74 Q112 92 106 95 L96 95 L88 72 L80 95 L70 95 Q64 92 64 74 Z"
            fill="${light}" stroke="${dark}" stroke-width="1.4" stroke-linejoin="round"/>`;

    let body;
    switch (category) {
      case 'pantalones': body = shorts; break;
      case 'medias':     body = socks;  break;
      case 'chaquetas':
      case 'sudaderas':  body = jacket; break;
      case 'uniformes':  body = kit;    break;
      case 'accesorios': body = (hex === '#f2f3f5' || hex === '#c9a227') ? ball : bag; break;
      default:           body = shirt;
    }

    return `<svg class="jersey" viewBox="0 0 120 110" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">${body}</svg>`;
  },

  productArt(p, hex) {
    const color = hex || (p.variants[0] && p.variants[0].colorHex) || '#6b7280';
    return UI.garment(p.category, color);
  },

  /* ---------- Etiquetas de estado ---------- */
  stockBadge(status, qty) {
    const map = {
      'ok':         ['badge-ok',      'Disponible'],
      'bajo':       ['badge-warn',    'Stock bajo'],
      'agotado':    ['badge-danger',  'Agotado'],
      'inactivo':   ['badge-neutral', 'Inactivo'],
      'bajo-pedido':['badge-gold',    'Bajo pedido']
    };
    const [cls, label] = map[status] || map.ok;
    const q = (qty !== undefined && status !== 'bajo-pedido') ? ` · ${qty}` : '';
    return `<span class="badge ${cls}"><span class="dot"></span>${label}${q}</span>`;
  },

  orderBadge(status) {
    const map = {
      'pendiente':  ['badge-warn',    'Pendiente'],
      'procesando': ['badge-info',    'Procesando'],
      'enviado':    ['badge-gold',    'Enviado'],
      'completado': ['badge-ok',      'Completado'],
      'cancelado':  ['badge-danger',  'Cancelado']
    };
    const [cls, label] = map[status] || ['badge-neutral', status];
    return `<span class="badge ${cls}"><span class="dot"></span>${label}</span>`;
  },

  payBadge(s) {
    const map = {
      'pagado':      ['badge-ok',     'Pagado'],
      'pendiente':   ['badge-warn',   'Pago pendiente'],
      'fallido':     ['badge-danger', 'Fallido'],
      'reembolsado': ['badge-neutral','Reembolsado']
    };
    const [cls, label] = map[s] || ['badge-neutral', s];
    return `<span class="badge ${cls}">${label}</span>`;
  },

  stockBar(qty, min) {
    const target = Math.max(min * 3, 10);
    const pct = Math.min(100, (qty / target) * 100);
    const cls = qty <= 0 ? 'danger' : (qty <= min ? 'warn' : 'ok');
    return `<div class="stock-bar"><div class="stock-fill ${cls}" style="width:${pct}%"></div></div>`;
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
    }, 3600);
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

  closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.body.classList.remove('no-scroll');
    document.getElementById('modalBox').innerHTML = '';
  },

  confirm(title, message, onYes, danger) {
    UI.modal(`
      <div class="modal-head"><h2>${UI.esc(title)}</h2></div>
      <div class="modal-body"><p style="color:var(--ink-600);line-height:1.6">${message}</p></div>
      <div class="modal-foot">
        <button class="btn" onclick="UI.closeModal()">Cancelar</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirmYes" data-autofocus>Confirmar</button>
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

  catName(id) {
    const c = SEED.categories.find(x => x.id === id);
    return c ? c.name : id;
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
