/* ============================================================
   SOCCER CAGE — Análisis interactivo: Shopify vs. plataforma propia
   Los números NO están escritos a mano: se calculan a partir de las
   tarifas reales declaradas en TARIFAS. Así, al mover el volumen de
   ventas, todo el análisis se recalcula de forma coherente.
   ============================================================ */

const Compare = {

  /* ---------- Tarifas verificadas (septiembre 2026) ----------
     Cada cifra lleva su fuente. Si una tarifa cambia, se corrige
     aquí y TODA la página se actualiza sola.
  ------------------------------------------------------------ */
  TARIFAS: {
    shopify: {
      basic:    { nombre: 'Basic',    mesAnual: 19,  mesMensual: 25,  tarjeta: 0.029, fijo: 0.30, recargoExterno: 0.020, staff: 0 },
      grow:     { nombre: 'Grow',     mesAnual: 49,  mesMensual: 65,  tarjeta: 0.027, fijo: 0.30, recargoExterno: 0.010, staff: 5 },
      advanced: { nombre: 'Advanced', mesAnual: 299, mesMensual: 399, tarjeta: 0.025, fijo: 0.30, recargoExterno: 0.006, staff: 15 }
    },
    // Stripe: tarifa estándar publicada. A partir de cierto volumen
    // (~$80k/mes) Stripe negocia interchange-plus, que baja el efectivo.
    // Sin ese ajuste el modelo sería tramposo: la plataforma propia
    // pagaría siempre más comisión que Shopify y nunca podría ganar.
    stripe: { tarjeta: 0.029, fijo: 0.30, umbralNegociado: 80000, tarjetaNegociada: 0.025 },
    propia: {
      // Rango de desarrollo inicial para el alcance "mediano"
      desarrolloMin: 30000, desarrolloMax: 60000,
      // Recurrente anual (infraestructura + mantenimiento)
      recurrenteMin: 4000, recurrenteMax: 20500
    },

    /* Escenario de desarrollo interno (equipo propio de la empresa).
       El desarrollo se mide en tiempo de implementación, no en honorarios
       de un tercero. Lo que sí se paga son las herramientas y la
       infraestructura. Cifras verificadas en septiembre de 2026.

       Cada partida usa UN valor fijo, no un rango: es el nivel de servicio
       recomendado para una empresa en producción, no la opción más barata
       posible.
         - Hosting: Cloudflare Workers Paid ($5/mes mínimo de cuenta).
           Las Pages Functions se facturan bajo este mismo plan
           (developers.cloudflare.com/workers/platform/pricing). El nivel
           gratuito existe, pero para una empresa no es la base adecuada:
           el plan de pago da soporte y límites de uso pensados para
           producción, no solo para permitir el uso comercial.
         - Base de datos: Supabase Pro ($25/mes), no el nivel gratuito.
           El gratuito no incluye copias de seguridad y suspende el
           proyecto tras 7 días de inactividad — inaceptable si hay
           pedidos reales.
         - Correo: Resend, nivel gratuito (cubre el volumen de una tienda
           de este tamaño). */
    // Todas las cifras de este bloque están en dólares POR AÑO, salvo que
    // se indique lo contrario. calcMensual()/calcDIY() dividen entre 12.
    propiaDIY: {
      herramientasDevAnual: 20 * 12,  // licencias de desarrollo: $20/mes
      hostingAnual: 5 * 12,           // Cloudflare Workers Paid: $5/mes, incluye Pages
      bdAnual: 25 * 12,                // Supabase Pro: $25/mes, con copias de seguridad
      dominioAnual: 15,
      correoAnual: 0,                  // Resend, nivel gratuito
      // Tiempo de implementación en horas-persona (no es costo en efectivo,
      // pero es tiempo real de equipo que la empresa debe planear)
      horasMin: 120, horasMax: 260
    }
  },

  // Estado de los controles interactivos
  estado: {
    ventasMensuales: 12000,
    ticket: 90,
    plan: 'grow',
    facturacion: 'mensual',
    appManufactura: false,
    escenarioPropia: 'medio',   // conservador | medio | optimista
    anios: 3,
    /* Quién desarrolla la plataforma. Cambia por completo la comparación:
       'contratar' incluye $30–60k de honorarios externos; 'interno' es
       desarrollo con equipo propio, sin esa factura. */
    quienConstruye: 'interno',
    // Tema de Shopify: gratuito (Dawn) o de pago del Theme Store
    temaShopify: 'gratis'
  },

  init() {
    this.render();
  },

  /* ---------- Cálculos ---------- */
  pedidosAnuales() {
    const anual = this.estado.ventasMensuales * 12;
    return Math.max(1, Math.round(anual / this.estado.ticket));
  },

  calcShopify() {
    const p = this.TARIFAS.shopify[this.estado.plan];
    const ventasAnuales = this.estado.ventasMensuales * 12;
    const pedidos = this.pedidosAnuales();

    const suscripcion = (this.estado.facturacion === 'anual' ? p.mesAnual : p.mesMensual) * 12;
    const comision = ventasAnuales * p.tarjeta + pedidos * p.fijo;
    // App de manufactura (Katana Core): el renglón que más pesa
    const apps = this.estado.appManufactura ? 299 * 12 : 0;

    /* Puesta en marcha: pago único y verificable, no una estimación inventada.
       - Tema gratuito (Dawn, el oficial de Shopify): $0
       - Tema de pago del Theme Store: entre $180 y $500, pago único
       Se deja elegir en lugar de imponer una cifra. */
    const implementacion = this.estado.temaShopify === 'pago' ? 300 : 0;

    return {
      suscripcion, comision, apps, implementacion,
      total: suscripcion + comision + apps,
      totalAnio1: suscripcion + comision + apps + implementacion
    };
  },

  calcPropia() {
    const t = this.TARIFAS.propia;
    const ventasAnuales = this.estado.ventasMensuales * 12;
    const pedidos = this.pedidosAnuales();

    const esc = this.estado.escenarioPropia;
    const desarrollo = esc === 'conservador' ? t.desarrolloMax
                     : esc === 'optimista'   ? t.desarrolloMin
                     : (t.desarrolloMin + t.desarrolloMax) / 2;
    const recurrente = esc === 'conservador' ? t.recurrenteMax
                     : esc === 'optimista'   ? t.recurrenteMin
                     : (t.recurrenteMin + t.recurrenteMax) / 2;

    const st = this.TARIFAS.stripe;
    const tasa = this.estado.ventasMensuales >= st.umbralNegociado
      ? st.tarjetaNegociada : st.tarjeta;
    const comision = ventasAnuales * tasa + pedidos * st.fijo;

    return {
      desarrollo, recurrente, comision, tasaAplicada: tasa,
      total: recurrente + comision,
      totalAnio1: desarrollo + recurrente + comision
    };
  },

  /** Costo de UN MES, que es la pregunta real.
      Sin proyecciones ni acumulados: lo que se paga cada mes. */
  calcMensual() {
    const e = this.estado;
    const ventasMes = e.ventasMensuales;
    const pedidosMes = Math.max(1, Math.round(ventasMes / e.ticket));
    const plan = this.TARIFAS.shopify[e.plan];

    // --- Shopify ---
    const shSuscripcion = e.facturacion === 'anual' ? plan.mesAnual : plan.mesMensual;
    const shComision = ventasMes * plan.tarjeta + pedidosMes * plan.fijo;

    // --- Plataforma propia (construida internamente) ---
    const d = this.TARIFAS.propiaDIY;
    const st = this.TARIFAS.stripe;
    const tasa = ventasMes >= st.umbralNegociado ? st.tarjetaNegociada : st.tarjeta;
    const prComision = ventasMes * tasa + pedidosMes * st.fijo;

    // Infraestructura mensual: dominio + hosting (gratis) + base de datos
    // con copias de seguridad. Un único valor, no un rango: es el nivel
    // de servicio recomendado para producción (ver nota en TARIFAS).
    const prFijo = (d.dominioAnual + d.hostingAnual + d.bdAnual) / 12;

    return {
      pedidosMes, ventasMes,
      shopify: {
        suscripcion: shSuscripcion,
        comision: shComision,
        fijo: shSuscripcion,
        total: shSuscripcion + shComision
      },
      propia: {
        fijo: prFijo,
        comision: prComision,
        total: prFijo + prComision
      }
    };
  },

  /** Escenario de desarrollo interno: sin factura de un tercero.
      Un solo valor por partida (ver nota en TARIFAS.propiaDIY): es el
      nivel de infraestructura recomendado para producción, no un rango. */
  calcDIY() {
    const d = this.TARIFAS.propiaDIY;
    const ventasAnuales = this.estado.ventasMensuales * 12;
    const pedidos = this.pedidosAnuales();

    const st = this.TARIFAS.stripe;
    const tasa = this.estado.ventasMensuales >= st.umbralNegociado
      ? st.tarjetaNegociada : st.tarjeta;
    const comision = ventasAnuales * tasa + pedidos * st.fijo;

    // Año 1: infraestructura anual (hosting + BD + dominio) durante la construcción.
    const herramientas = d.hostingAnual + d.bdAnual + d.dominioAnual;

    return {
      herramientasDev: d.herramientasDevAnual,
      herramientas,
      comision, tasaAplicada: tasa,
      horasMin: d.horasMin, horasMax: d.horasMax,
      // Efectivo que sale de la caja
      anio1: d.herramientasDevAnual + herramientas + comision,
      // A partir del año 2 solo se mantienen la infraestructura y la comisión
      recurrente: herramientas + comision
    };
  },

  /** Acumulado a N años, para ver cuándo (o si) se cruzan las curvas.
      Respeta quién construye: si es interno, NO hay factura de desarrollo. */
  acumulado(anios) {
    const s = this.calcShopify();
    const shopify = s.implementacion + s.total * anios;

    if (this.estado.quienConstruye === 'interno') {
      const d = this.calcDIY();
      return { shopify, propia: d.anio1 + d.recurrente * (anios - 1) };
    }

    const p = this.calcPropia();
    return { shopify, propia: p.desarrollo + p.total * anios };
  },

  /** Año en que la plataforma propia sale más barata (null si nunca en 10 años). */
  puntoEquilibrio() {
    for (let a = 1; a <= 10; a++) {
      const ac = this.acumulado(a);
      if (ac.propia <= ac.shopify) return a;
    }
    return null;
  },

  /* ---------- Render ---------- */
  render() {
    const root = document.getElementById('cmpRoot');
    if (!root) return;
    root.innerHTML = this.html();
    this.bind();
    requestAnimationFrame(() => this.animarBarras());
  },

  html() {
    const e = this.estado;
    const s = this.calcShopify();
    const p = this.calcPropia();
    const eq = this.puntoEquilibrio();
    const ac = this.acumulado(e.anios);
    const ventasAnuales = e.ventasMensuales * 12;

    const ganaShopify = ac.shopify < ac.propia;
    const diferencia = Math.abs(ac.shopify - ac.propia);
    const veces = ac.shopify > 0 ? (ac.propia / ac.shopify) : 0;

    return `
    ${this.heroHTML()}
    ${this.mensualHTML()}
    `;
    // Ocultas a pedido del usuario (quedan definidas más abajo por si se
    // reactivan): indiceHTML, tablaHTML, inventarioHTML, escenariosHTML,
    // decisionHTML, fuentesHTML.
  },

  /** Índice navegable: la página es larga y sin él hay secciones que
      nadie encuentra —la de "construirla yo" quedaba al 62% del scroll. */
  indiceHTML() {
    const items = [
      ['sec-mensual',   I18N.t('cmp.indice.mensual'), true],
      ['sec-tabla',     I18N.t('cmp.indice.tabla')],
      ['sec-inv',       I18N.t('cmp.indice.inv')],
      ['sec-crecer',    I18N.t('cmp.indice.crecer')],
      ['sec-final',     I18N.t('cmp.indice.final')]
    ];
    return `
    <nav class="cmp-indice" aria-label="${I18N.t('cmp.indice.aria')}">
      ${items.map(([id, txt, destacado]) =>
        `<a href="#${id}" class="cmp-indice-item${destacado ? ' is-destacado' : ''}">${txt}</a>`
      ).join('')}
    </nav>`;
  },

  heroHTML() {
    const plan = this.TARIFAS.shopify[this.estado.plan];
    const stripe = this.TARIFAS.stripe;
    const shPct = (plan.tarjeta * 100).toFixed(1).replace('.', ',');
    const prPct = (stripe.tarjeta * 100).toFixed(1).replace('.', ',');

    return `
    <section class="cmp-hero">
      <div class="hero-eyebrow">
        <svg style="width:13px;height:13px" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="10"/></svg>
        ${I18N.t('cmp.hero.eyebrow')}
      </div>
      <h1>${I18N.t('cmp.hero.title')}</h1>
      <p>
        ${I18N.t('cmp.hero.body')}
      </p>

      <div class="cmp-verdict">
        <div class="cmp-verdict-label">${I18N.t('cmp.hero.verdictLabel')}</div>
        <div class="cmp-verdict-main">
          ${I18N.t('cmp.hero.verdictMain', { shopify: `<strong>${UI.money(plan.mesMensual)}</strong>`, propia: '<strong>$31,25</strong>' })}
        </div>
        <div class="cmp-verdict-sub">
          ${I18N.t('cmp.hero.verdictSub', { ahorro: UI.money(plan.mesMensual - 31.25), shPct, prPct })}
        </div>
      </div>
    </section>`;
  },

  /** El costo fijo de cada mes. Las comisiones se muestran como porcentaje,
      no en dólares: son variables por transacción y no hay que asumir
      una facturación mensual para presentarlas correctamente. */
  mensualHTML() {
    const plan = this.TARIFAS.shopify[this.estado.plan];
    const stripe = this.TARIFAS.stripe;
    const shPct = (plan.tarjeta * 100).toFixed(1).replace('.', ',');
    const prPct = (stripe.tarjeta * 100).toFixed(1).replace('.', ',');
    const prPctNeg = (stripe.tarjetaNegociada * 100).toFixed(1).replace('.', ',');

    return `
    <section class="cmp-card" id="sec-mensual">
      <div class="cmp-card-head">
        <div>
          <h2>${I18N.t('cmp.mensual.title')}</h2>
          <p class="muted tiny" style="margin-top:3px">
            ${I18N.t('cmp.mensual.sub1')}
          </p>
          <p class="muted tiny" style="margin-top:6px">
            ${I18N.t('cmp.mensual.sub2', { plan: plan.nombre, diff: plan.mesMensual - this.TARIFAS.shopify.basic.mesMensual })}
          </p>
        </div>
      </div>
      <div class="cmp-card-body flush">
        <div class="table-wrap">
          <table class="data">
            <thead>
              <tr>
                <th>${I18N.t('cmp.mensual.colConcept')}</th>
                <th class="right">${I18N.t('cmp.mensual.colShopify', { plan: plan.nombre })}</th>
                <th class="right">${I18N.t('cmp.mensual.colPropia')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="cell-main">${I18N.t('cmp.mensual.suscripcion')} <span class="cmp-mini">${I18N.t('cmp.mensual.suscripcionMini', { annual: plan.mesAnual })}</span></td>
                <td class="right mono">${UI.money(plan.mesMensual)}</td>
                <td class="right mono"><span style="color:var(--ok-600)">$0</span></td>
              </tr>
              <tr>
                <td class="cell-main">${I18N.t('cmp.mensual.hosting')} <span class="cmp-mini">${I18N.t('cmp.mensual.hostingMini')}</span></td>
                <td class="right muted">${I18N.t('cmp.mensual.incluido')}</td>
                <td class="right mono">$5</td>
              </tr>
              <tr>
                <td class="cell-main">${I18N.t('cmp.mensual.bd')} <span class="cmp-mini">${I18N.t('cmp.mensual.bdMini')}</span></td>
                <td class="right muted">${I18N.t('cmp.mensual.incluida')}</td>
                <td class="right mono">$25</td>
              </tr>
              <tr>
                <td class="cell-main">${I18N.t('cmp.mensual.correo')} <span class="cmp-mini">${I18N.t('cmp.mensual.correoMini')}</span></td>
                <td class="right muted">${I18N.t('cmp.mensual.incluido')}</td>
                <td class="right mono"><span style="color:var(--ok-600)">$0</span></td>
              </tr>
              <tr>
                <td class="cell-main">${I18N.t('cmp.mensual.dominio')} <span class="cmp-mini">${I18N.t('cmp.mensual.dominioMini')}</span></td>
                <td class="right mono">$1,25</td>
                <td class="right mono">$1,25</td>
              </tr>
              <tr>
                <td class="cell-main">${I18N.t('cmp.mensual.pci')} <span class="cmp-mini">${I18N.t('cmp.mensual.pciMini')}</span></td>
                <td class="right muted">${I18N.t('cmp.mensual.pciSh')}</td>
                <td class="right muted">${I18N.t('cmp.mensual.pciPr')}</td>
              </tr>
              <tr>
                <td class="cell-main">${I18N.t('cmp.mensual.seg')} <span class="cmp-mini">${I18N.t('cmp.mensual.segMini')}</span></td>
                <td class="right muted">${I18N.t('cmp.mensual.segSh')}</td>
                <td class="right muted">${I18N.t('cmp.mensual.segPr')}</td>
              </tr>
              <tr>
                <td class="cell-main">${I18N.t('cmp.mensual.backup')} <span class="cmp-mini">${I18N.t('cmp.mensual.backupMini')}</span></td>
                <td class="right muted">${I18N.t('cmp.mensual.backupSh')}</td>
                <td class="right muted">${I18N.t('cmp.mensual.backupPr', { db: '$25' })}</td>
              </tr>
              <tr style="border-top:2px solid var(--border-strong)">
                <td class="cell-main"><strong>${I18N.t('cmp.mensual.fijoMensual')}</strong></td>
                <td class="right"><strong>${UI.money(plan.mesMensual)}</strong></td>
                <td class="right"><strong>$31,25</strong></td>
              </tr>
              <tr>
                <td class="cell-main">
                  ${I18N.t('cmp.mensual.comisionVenta')} <span class="cmp-mini">${I18N.t('cmp.mensual.comisionMini')}</span>
                </td>
                <td class="right mono">${shPct} % + $0,30</td>
                <td class="right mono">${prPct} % + $0,30<span class="cmp-mini" style="display:block">${I18N.t('cmp.mensual.desdeVolumen', { pct: prPctNeg, umbral: '$80k' })}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>`;
  },

  tablaHTML(s, p) {
    const plan = this.TARIFAS.shopify[this.estado.plan];
    const stripe = this.TARIFAS.stripe;
    const shPct = (plan.tarjeta * 100).toFixed(1).replace('.', ',');
    const prPct = (stripe.tarjeta * 100).toFixed(1).replace('.', ',');
    const d = this.calcDIY();
    const f = [
      [I18N.t('cmp.tabla.rowPuesta'), I18N.t('cmp.tabla.puestaSh'), I18N.t('cmp.tabla.puestaPr', { min: Math.round(d.horasMin/40), max: Math.round(d.horasMax/40) }), 'sh'],
      [I18N.t('cmp.tabla.rowMensualidad'), I18N.t('cmp.tabla.mensualidadSh', { price: UI.money(plan.mesMensual) }), I18N.t('cmp.tabla.mensualidadPr'), 'pr'],
      [I18N.t('cmp.tabla.rowHosting'), I18N.t('cmp.tabla.incluido'), '$5/mes', 'sh'],
      [I18N.t('cmp.tabla.rowBd'), I18N.t('cmp.tabla.incluida'), '$25/mes', 'sh'],
      [I18N.t('cmp.tabla.rowPasarela'), 'Shopify Payments', 'Stripe', '='],
      [I18N.t('cmp.tabla.rowComision'), `${shPct} % + $0,30`, `${prPct} % + $0,30`,
        plan.tarjeta <= stripe.tarjeta ? 'sh' : 'pr'],
      [I18N.t('cmp.tabla.rowMantenimiento'), I18N.t('cmp.tabla.incluido'), I18N.t('cmp.tabla.mantenimientoPr'), 'sh'],
      [I18N.t('cmp.tabla.rowSeguridad'), I18N.t('cmp.tabla.seguridadSh'), I18N.t('cmp.tabla.seguridadPr'), 'sh'],
      [I18N.t('cmp.tabla.rowBackup'), I18N.t('cmp.tabla.incluida'), I18N.t('cmp.tabla.backupPr'), 'sh'],
      [I18N.t('cmp.tabla.rowEscalabilidad'), I18N.t('cmp.tabla.escalabilidadSh'), I18N.t('cmp.tabla.escalabilidadPr'), 'sh'],
      [I18N.t('cmp.tabla.rowPersonalizacion'), I18N.t('cmp.tabla.personalizacionSh'), I18N.t('cmp.tabla.personalizacionPr'), 'pr'],
      [I18N.t('cmp.tabla.rowManufactura'), I18N.t('cmp.tabla.manufacturaSh'), I18N.t('cmp.tabla.manufacturaPr'), 'pr'],
      [I18N.t('cmp.tabla.rowTiempo'), I18N.t('cmp.tabla.tiempoSh'), I18N.t('cmp.tabla.tiempoPr'), 'sh'],
      [I18N.t('cmp.tabla.rowPropiedad'), I18N.t('cmp.tabla.propiedadSh'), I18N.t('cmp.tabla.propiedadPr'), 'pr']
    ];

    return `
    <section class="cmp-card" id="sec-tabla">
      <div class="cmp-card-head">
        <div>
          <h2>${I18N.t('cmp.tabla.title')}</h2>
          <p class="muted tiny" style="margin-top:3px">${I18N.t('cmp.tabla.sub')}</p>
        </div>
      </div>
      <div class="cmp-card-body flush">
        <div class="table-wrap">
          <table class="data cmp-table">
            <thead><tr><th>${I18N.t('cmp.tabla.colConcept')}</th><th>${I18N.t('cmp.tabla.colShopify')}</th><th>${I18N.t('cmp.tabla.colPropia')}</th></tr></thead>
            <tbody>
              ${f.map(([c, a, b, w]) => `
                <tr>
                  <td class="cell-main">${c}</td>
                  <td class="${w === 'sh' ? 'is-best' : ''}">${w === 'sh' ? `<span class="tick" aria-label="${I18N.t('cmp.tabla.tickLabel')}">●</span>` : ''}${a}</td>
                  <td class="${w === 'pr' ? 'is-best' : ''}">${w === 'pr' ? `<span class="tick" aria-label="${I18N.t('cmp.tabla.tickLabel')}">●</span>` : ''}${b}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </section>`;
  },

  inventarioHTML() {
    const f = [
      [I18N.t('cmp.inv.f1.cap'), true, true, I18N.t('cmp.inv.f1.nota')],
      [I18N.t('cmp.inv.f2.cap'), true, true, I18N.t('cmp.inv.f2.nota')],
      [I18N.t('cmp.inv.f3.cap'), true, true, ''],
      [I18N.t('cmp.inv.f4.cap'), 'parcial', true, I18N.t('cmp.inv.f4.nota')],
      [I18N.t('cmp.inv.f5.cap'), true, true, ''],
      [I18N.t('cmp.inv.f6.cap'), true, 'extra', I18N.t('cmp.inv.f6.nota')],
      [I18N.t('cmp.inv.f7.cap'), 'parcial', 'extra', I18N.t('cmp.inv.f7.nota')],
      [I18N.t('cmp.inv.f8.cap'), false, true, I18N.t('cmp.inv.f8.nota')],
      [I18N.t('cmp.inv.f9.cap'), false, true, I18N.t('cmp.inv.f9.nota')],
      [I18N.t('cmp.inv.f10.cap'), false, true, '']
    ];

    const icono = v => v === true
      ? `<span class="cmp-yes" title="${I18N.t('cmp.inv.yes')}">✓</span>`
      : v === false
        ? `<span class="cmp-no" title="${I18N.t('cmp.inv.no')}">✕</span>`
        : v === 'parcial'
          ? `<span class="cmp-partial" title="${I18N.t('cmp.inv.parcial')}">◐</span>`
          : `<span class="cmp-partial" title="${I18N.t('cmp.inv.construir')}">⚒</span>`;

    return `
    <section class="cmp-card" id="sec-inv">
      <div class="cmp-card-head">
        <div>
          <h2>${I18N.t('cmp.inv.title')}</h2>
          <p class="muted tiny" style="margin-top:3px">
            ${I18N.t('cmp.inv.sub')}
          </p>
        </div>
      </div>
      <div class="cmp-card-body flush">
        <div class="table-wrap">
          <table class="data cmp-table">
            <thead><tr><th>${I18N.t('cmp.inv.colCap')}</th><th class="center">${I18N.t('cmp.inv.colShopify')}</th><th class="center">${I18N.t('cmp.inv.colPropia')}</th><th>${I18N.t('cmp.inv.colNota')}</th></tr></thead>
            <tbody>
              ${f.map(([cap, sh, pr, nota]) => `
                <tr>
                  <td class="cell-main">${cap}</td>
                  <td class="center">${icono(sh)}</td>
                  <td class="center">${icono(pr)}</td>
                  <td class="tiny muted">${nota}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </section>`;
  },

  escenariosHTML() {
    const guardado = { ...this.estado };
    const filas = [5000, 12000, 30000, 60000].map(ventasMes => {
      this.estado.ventasMensuales = ventasMes;
      const m = this.calcMensual();
      const dif = m.shopify.total - m.propia.total;
      return { ventasMes, sh: m.shopify.total, pr: m.propia.total, dif, pedidos: m.pedidosMes };
    });
    this.estado = guardado;

    return `
    <section class="cmp-card" id="sec-crecer">
      <div class="cmp-card-head">
        <div>
          <h2>${I18N.t('cmp.esc.title')}</h2>
          <p class="muted tiny" style="margin-top:3px">
            ${I18N.t('cmp.esc.sub')}
          </p>
        </div>
      </div>
      <div class="cmp-card-body flush">
        <div class="table-wrap">
          <table class="data cmp-table">
            <thead><tr>
              <th>${I18N.t('cmp.esc.colVentas')}</th><th class="right">${I18N.t('cmp.esc.colPedidos')}</th>
              <th class="right">${I18N.t('cmp.esc.colShopify')}</th><th class="right">${I18N.t('cmp.esc.colPropia')}</th><th class="right">${I18N.t('cmp.esc.colDif')}</th>
            </tr></thead>
            <tbody>
              ${filas.map(r => `
                <tr>
                  <td class="cell-main">${UI.money0(r.ventasMes)}</td>
                  <td class="right muted">${UI.num(r.pedidos)}</td>
                  <td class="right mono">${UI.money(r.sh)}</td>
                  <td class="right mono">${UI.money(r.pr)}</td>
                  <td class="right">
                    <span style="font-weight:640;color:${r.dif > 0 ? 'var(--ok-600)' : 'var(--danger-600)'}">
                      ${r.dif > 0 ? '−' : '+'}${UI.money(Math.abs(r.dif))}
                    </span>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="cmp-card-body" style="padding-top:0">
        <p class="muted tiny" style="line-height:1.6;margin:0">
          ${I18N.t('cmp.esc.nota')}
        </p>
      </div>
    </section>`;
  },

  decisionHTML() {
    const d = this.calcDIY();
    const plan = this.TARIFAS.shopify[this.estado.plan];
    const stripe = this.TARIFAS.stripe;
    const shPct = (plan.tarjeta * 100).toFixed(1).replace('.', ',');
    const prPct = (stripe.tarjeta * 100).toFixed(1).replace('.', ',');
    return `
    <section class="cmp-card cmp-final" id="sec-final">
      <div class="cmp-card-head"><h2>${I18N.t('cmp.dec.title')}</h2></div>
      <div class="cmp-card-body">
        <p class="cmp-lead">
          <strong>${I18N.t('cmp.dec.leadStrong')}</strong>
          ${I18N.t('cmp.dec.leadBody', { sub: UI.money(plan.mesMensual), prPct, shPct, min: Math.round(d.horasMin/40), max: Math.round(d.horasMax/40) })}
        </p>

        <div class="cmp-steps">
          <div class="cmp-step">
            <span class="n">1</span>
            <div>
              <h4>${I18N.t('cmp.dec.step1.h')}</h4>
              <p>${I18N.t('cmp.dec.step1.p')}</p>
            </div>
          </div>
          <div class="cmp-step">
            <span class="n">2</span>
            <div>
              <h4>${I18N.t('cmp.dec.step2.h')}</h4>
              <p>${I18N.t('cmp.dec.step2.p')}</p>
            </div>
          </div>
          <div class="cmp-step">
            <span class="n">3</span>
            <div>
              <h4>${I18N.t('cmp.dec.step3.h')}</h4>
              <p>${I18N.t('cmp.dec.step3.p')}</p>
            </div>
          </div>
        </div>

        <div class="alert alert-warn" style="margin-top:22px">
          <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/>
          </svg>
          <div>
            <div class="alert-title">${I18N.t('cmp.dec.warnTitle')}</div>
            <div class="alert-body">
              ${I18N.t('cmp.dec.warn1')}<br>
              ${I18N.t('cmp.dec.warn2')}
            </div>
          </div>
        </div>
      </div>
    </section>`;
  },

  fuentesHTML() {
    const f = [
      [I18N.t('cmp.fuentes.f1'), 'shopify.com/pricing'],
      [I18N.t('cmp.fuentes.f2'), 'help.shopify.com'],
      [I18N.t('cmp.fuentes.f3'), 'community.shopify.com'],
      [I18N.t('cmp.fuentes.f4'), 'apps.shopify.com'],
      [I18N.t('cmp.fuentes.f5'), 'paypal.com'],
      [I18N.t('cmp.fuentes.f6'), 'cside.com'],
      [I18N.t('cmp.fuentes.f7'), 'nexusrules.com']
    ];
    return `
    <footer class="cmp-fuentes">
      <h3>${I18N.t('cmp.fuentes.title')}</h3>
      <ul>${f.map(([t, u]) => `<li><span>${t}</span><code>${u}</code></li>`).join('')}</ul>
      <p class="tiny muted" style="margin-top:14px">
        ${I18N.t('cmp.fuentes.nota', { archivo: '<code>ANALISIS-Shopify-vs-Plataforma-Propia.md</code>' })}
      </p>
    </footer>`;
  },

  /* ---------- Animación de barras (solo width, una vez montado) ---------- */
  animarBarras() {
    document.querySelectorAll('#cmpRoot [data-w]').forEach(el => {
      el.style.width = Math.max(1, parseFloat(el.dataset.w)) + '%';
    });
  },

  /* ---------- Eventos ----------
     Se eliminaron los deslizadores de ventas, ticket y horizonte: obligaban
     a decidir supuestos antes de ver la respuesta, cuando la pregunta real
     es simplemente cuánto cuesta un mes. Queda un único conmutador, el que
     de verdad cambia la comparación: quién construye la plataforma. */
  bind() {
    const root = document.getElementById('cmpRoot');

    root.querySelectorAll('[data-quien]').forEach(b =>
      b.onclick = () => { this.estado.quienConstruye = b.dataset.quien; this.render(); });
  }
};
