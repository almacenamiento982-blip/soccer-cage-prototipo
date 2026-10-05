/* ============================================================
   SOCCER CAGE — Arranque y conmutación Tienda ⇄ Panel ⇄ Análisis

   Dos formas de entrar:
   · Demo completa (sin parámetros): las tres vistas y las tres tiendas.
   · Tienda pública (?store=camps): solo la tienda de ese canal, sin
     panel. Es el enlace del QR que se imprime para los campamentos.
   ============================================================ */

const App = {
  mode: 'shop',
  storefront: null,

  init() {
    I18N.init();
    Store.load();

    // Avisos del almacenamiento: lleno o no disponible, y conflicto entre pestañas.
    Store.onSaveError = () => UI.toast('danger', I18N.t('sys.saveFailTitle'), I18N.t('sys.saveFailBody'));
    Store.onConflict = () => { this.refreshAll(); UI.toast('warn', I18N.t('sys.conflictTitle'), I18N.t('sys.conflictBody')); };
    // Otra pestaña guardó: se adopta su estado para no trabajar sobre datos viejos.
    window.addEventListener('storage', e => {
      if (e.key === 'soccercage_rev' && Store.syncFromStorage()) this.refreshAll();
    });

    const wanted = new URLSearchParams(location.search).get('store');
    if (wanted && Store.storeCfg(wanted)) {
      this.storefront = wanted;
      Store.setStore(wanted);
      document.body.classList.add('storefront');
    }

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
    if (!this.storefront) {
      Admin.init();
      Compare.init();
    }
    this.syncUser();
    this.setMode('shop');   // deja la barra coherente desde el arranque

    // Atajos de teclado para la demostración en vivo
    document.addEventListener('keydown', e => {
      if (this.storefront || !e.altKey) return;
      // El análisis está oculto por ahora: sin atajo de teclado.
      const m = { '1': 'shop', '2': 'admin' }[e.key];
      if (m) { e.preventDefault(); this.setMode(m); }
    });
  },

  setMode(mode) {
    if (this.storefront) mode = 'shop';
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

    // El carrito solo tiene sentido en la tienda. Se atenúa en su sitio en
    // vez de ocultarlo: así la barra no salta al cambiar de pestaña.
    ['cartBtn', 'acctBtn'].forEach(id => {
      const b = document.getElementById(id);
      b.classList.toggle('is-inactive', mode !== 'shop');
      b.setAttribute('aria-hidden', mode !== 'shop');
      b.tabIndex = mode === 'shop' ? 0 : -1;
    });
    document.getElementById('sidebarToggle').classList.toggle('is-hidden', mode !== 'admin');
    document.getElementById('sidebar').classList.remove('open');

    if (mode === 'shop') { Shop.render(); Shop.renderCart(); }
    else if (mode === 'admin') Admin.refresh();
    else Compare.render();

    // Al arrancar no hay nada que desplazar: evita un salto visible.
    if (this._arrancado) window.scrollTo({ top: 0 });
    this._arrancado = true;
  },

  /** Traduce el shell estático del HTML (data-i18n / data-i18n-aria) y la marca. */
  applyStaticI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = I18N.t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      el.setAttribute('aria-label', I18N.t(el.dataset.i18nAria));
    });
    document.getElementById('langBtnLabel').textContent = I18N.lang === 'es' ? 'EN' : 'ES';

    // En la tienda pública la marca es la de la tienda, no la de la plataforma.
    const st = this.storefront ? Store.storeCfg(this.storefront) : null;
    document.getElementById('brandName').textContent = st ? st.name : Store.settings.company;
    document.getElementById('brandSub').textContent = I18N.t(st ? 'shop.official' : 'nav.brandSub');
    document.title = (st ? st.name : Store.settings.company) + ' — ' + I18N.t(st ? 'shop.official' : 'nav.brandSub');
    const mark = document.getElementById('brandMark');
    if (st) mark.outerHTML = UI.storeMark(st, 30).replace('class="store-mark"', 'class="store-mark brand-mark" id="brandMark"');
    if (st) document.body.style.cssText = UI.brandVars(st);
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

  /** Repinta todo lo visible tras una mutación de datos o un cambio de idioma. */
  refreshAll() {
    this.applyStaticI18n();
    Shop.render();
    Shop.renderCart();
    if (!this.storefront) Admin.refresh();
    this.syncUser();
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
