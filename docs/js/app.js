/* ============================================================
   SOCCER CAGE — Arranque y conmutación Tienda ⇄ Panel admin
   ============================================================ */

const App = {
  mode: 'admin',

  init() {
    I18N.init();
    Store.load();
    this.medirScrollbar();
    this.applyStaticI18n();

    document.getElementById('btnShop').onclick    = () => this.setMode('shop');
    document.getElementById('btnAdmin').onclick   = () => this.setMode('admin');
    document.getElementById('btnCompare').onclick = () => this.setMode('compare');

    document.getElementById('sidebarToggle').onclick = () =>
      document.getElementById('sidebar').classList.toggle('open');

    document.getElementById('langBtn').onclick = () =>
      I18N.setLang(I18N.lang === 'es' ? 'en' : 'es');

    Shop.init();
    Admin.init();
    Compare.init();
    this.syncUser();
    this.setMode('admin');   // deja la barra coherente desde el arranque; Tienda queda oculta

    // Atajos de teclado para la demostración en vivo
    document.addEventListener('keydown', e => {
      if (e.altKey && e.key === '1') { e.preventDefault(); this.setMode('shop'); }
      if (e.altKey && e.key === '2') { e.preventDefault(); this.setMode('admin'); }
      if (e.altKey && e.key === '3') { e.preventDefault(); this.setMode('compare'); }
    });

    console.log(
      '%cSoccer Cage · Prototipo de inventario y ventas',
      'background:#0b0c0e;color:#c9a227;padding:6px 12px;border-radius:4px;font-weight:bold'
    );
    console.log('Atajos: Alt+1 Tienda · Alt+2 Panel admin');
  },

  setMode(mode) {
    this.mode = mode;

    const vistas = {
      shop:    { app: 'appShop',    btn: 'btnShop' },
      admin:   { app: 'appAdmin',   btn: 'btnAdmin' },
      compare: { app: 'appCompare', btn: 'btnCompare' }
    };

    Object.entries(vistas).forEach(([k, v]) => {
      const activa = k === mode;
      document.getElementById(v.app).classList.toggle('active', activa);
      const btn = document.getElementById(v.btn);
      btn.classList.toggle('active', activa);
      btn.setAttribute('aria-selected', activa);
    });

    // El carrito solo tiene sentido en la tienda, pero ocultarlo con
    // `display:none` liberaba su espacio y desplazaba toda la barra 138px
    // de golpe al cambiar de pestaña. Se atenúa en su sitio: la barra
    // no se mueve nunca.
    const cart = document.getElementById('cartBtn');
    cart.classList.toggle('is-inactive', mode !== 'shop');
    cart.setAttribute('aria-hidden', mode !== 'shop');
    cart.tabIndex = mode === 'shop' ? 0 : -1;
    document.getElementById('sidebarToggle').classList.toggle('is-hidden', mode !== 'admin');
    document.getElementById('sidebar').classList.remove('open');

    if (mode === 'shop') { Shop.render(); Shop.updateHero(); Shop.renderCart(); }
    else if (mode === 'admin') Admin.refresh();
    else Compare.render();

    // Al arrancar no hay nada que desplazar: evita un salto visible.
    if (this._arrancado) window.scrollTo({ top: 0, behavior: 'smooth' });
    this._arrancado = true;
  },

  /** Traduce el shell estático del HTML (data-i18n / data-i18n-aria) y
      actualiza la etiqueta del botón de idioma. Los módulos (Shop, Admin,
      Compare) se repintan aparte porque generan su HTML por JS. */
  applyStaticI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = I18N.t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      el.setAttribute('aria-label', I18N.t(el.dataset.i18nAria));
    });
    const label = document.getElementById('langBtnLabel');
    if (label) label.textContent = I18N.lang === 'es' ? 'EN' : 'ES';
  },

  /** Mide la barra de scroll para compensarla al bloquear el fondo. */
  medirScrollbar() {
    const w = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-w', Math.max(0, w) + 'px');
  },

  syncUser() {
    const u = Store.user();
    document.getElementById('userAvatar').textContent = u.initials;
    document.getElementById('userName').textContent = u.name;
  },

  /** Repinta todo lo visible tras una mutación de datos. */
  refreshAll() {
    this.applyStaticI18n();
    Shop.render();
    Shop.updateHero();
    Shop.renderCart();
    Admin.refresh();
    this.syncUser();
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
