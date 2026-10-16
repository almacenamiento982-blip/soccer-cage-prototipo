/* ============================================================
   SOCCER CAGE — Conexión con Supabase (datos compartidos)

   Sin configuración (js/config.js vacío) la plataforma sigue
   siendo la demo local de siempre. Con configuración:
   · el equipo inicia sesión y todos trabajan sobre los mismos datos;
   · la tienda pública lee solo catálogo y stock;
   · cada guardado lleva el número de revisión: si otra persona
     guardó antes, no se pisa su trabajo (se recarga y se avisa).

   Solo se usa la clave publicable (pública por diseño). Los
   permisos los decide el servidor (supabase/schema.sql).
   ============================================================ */

const Cloud = {
  cfg: null,
  session: null,
  staff: null,
  rev: 0,
  inflight: false,
  dirty: false,
  failed: false,
  retryMs: 3000,
  getState: null,
  onRemote: null,     // (data, rev, motivo) → la app adopta datos más nuevos del servidor
  onStatus: null,     // (estado, error) → 'saving' | 'saved' | 'error'
  SESSION_KEY: 'soccercage_cloud_session',

  init() {
    const c = window.SOCCERCAGE_CLOUD;
    const params = new URLSearchParams(location.search);
    // ?modo=demo abre la demo local aunque haya base de datos (para presentaciones).
    const local = window.SOCCERCAGE_FORCE_LOCAL || params.get('modo') === 'demo';
    this.cfg = !local && c && c.enabled && c.url && c.key ? { url: String(c.url).replace(/\/$/, ''), key: c.key } : null;
    if (this.cfg) {
      try { this.session = JSON.parse(localStorage.getItem(this.SESSION_KEY) || 'null'); } catch (e) { this.session = null; }
      window.addEventListener('beforeunload', e => { if (this.dirty || this.inflight) { e.preventDefault(); e.returnValue = ''; } });
    }
    return this.enabled;
  },

  get enabled() { return !!this.cfg; },
  get signedIn() { return !!(this.session && this.staff); },
  get isAdmin() { return !!(this.staff && this.staff.role === 'admin'); },
  get pending() { return this.dirty || this.inflight; },

  /* ---------- HTTP ---------- */
  async request(path, opts = {}) {
    const { method = 'POST', body, auth = true } = opts;
    const headers = { apikey: this.cfg.key, 'Content-Type': 'application/json' };
    if (auth && this.session) headers.Authorization = 'Bearer ' + (await this.accessToken());
    let res;
    try {
      res = await fetch(this.cfg.url + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    } catch (e) {
      const err = new Error('offline'); err.code = 'offline'; throw err;
    }
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
    if (!res.ok) {
      const msg = data && typeof data === 'object' ? (data.message || data.msg || data.error_description || data.error) : '';
      const err = new Error(msg || ('HTTP ' + res.status));
      err.status = res.status;
      err.code = data && typeof data === 'object' ? (data.error_code || data.code || '') : '';
      throw err;
    }
    return data;
  },

  rpc(name, args = {}, opts = {}) { return this.request('/rest/v1/rpc/' + name, Object.assign({ body: args }, opts)); },

  /* ---------- Sesión del equipo ---------- */
  saveSession(s) {
    this.session = s;
    try { s ? localStorage.setItem(this.SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(this.SESSION_KEY); } catch (e) { /* sin almacenamiento */ }
  },

  normSession(d) {
    return {
      access_token: d.access_token,
      refresh_token: d.refresh_token,
      expires_at: Number(d.expires_at) || Math.floor(Date.now() / 1000) + (Number(d.expires_in) || 3600),
      email: (d.user && d.user.email) || (this.session && this.session.email) || ''
    };
  },

  async accessToken() {
    if (this.session.expires_at - 60 < Date.now() / 1000) await this.refresh();
    return this.session.access_token;
  },

  refresh() {
    if (this._refreshing) return this._refreshing;
    this._refreshing = (async () => {
      try {
        const d = await this.request('/auth/v1/token?grant_type=refresh_token', { body: { refresh_token: this.session.refresh_token }, auth: false });
        this.saveSession(this.normSession(d));
      } catch (e) {
        if (e.status) { this.saveSession(null); this.staff = null; }   // sesión vencida o revocada
        throw e;
      } finally {
        this._refreshing = null;
      }
    })();
    return this._refreshing;
  },

  async signIn(email, password) {
    const d = await this.request('/auth/v1/token?grant_type=password', { body: { email: String(email).trim(), password }, auth: false });
    this.saveSession(this.normSession(d));
    return this.loadMe();
  },

  /** Quién soy en el equipo. null si la cuenta existe pero no está autorizada. */
  async loadMe() {
    this.staff = await this.rpc('whoami');
    return this.staff;
  },

  async signOut() {
    if (this.session) { try { await this.request('/auth/v1/logout', {}); } catch (e) { /* se cierra igual */ } }
    this.saveSession(null);
    this.staff = null;
    this.rev = 0;
  },

  recover(email) {
    const back = location.origin + location.pathname;
    return this.request('/auth/v1/recover?redirect_to=' + encodeURIComponent(back), { body: { email: String(email).trim() }, auth: false });
  },

  updatePassword(password) { return this.request('/auth/v1/user', { method: 'PUT', body: { password } }); },

  /** Enlaces de los correos (invitación, recuperar contraseña): #access_token=…&type=… */
  takeRedirect() {
    const h = new URLSearchParams(location.hash.slice(1));
    if (!h.get('access_token') && !h.get('error_description')) return null;
    history.replaceState(null, '', location.pathname + location.search);
    if (!h.get('access_token')) return { error: h.get('error_description') };
    this.saveSession(this.normSession({
      access_token: h.get('access_token'), refresh_token: h.get('refresh_token'),
      expires_at: h.get('expires_at'), expires_in: h.get('expires_in')
    }));
    return { type: h.get('type') || '' };
  },

  /* ---------- Datos ---------- */
  async loadState() {
    const r = await this.rpc('load_state');
    this.rev = Number(r.rev) || 0;
    return r;
  },

  async catalog() {
    const r = await this.rpc('public_catalog', {}, { auth: false });
    this.rev = Number(r.rev) || 0;
    return r;
  },

  /** Se llama en cada cambio. Los cambios seguidos se agrupan en un solo envío. */
  queueSave(getState) {
    this.getState = getState;
    this.dirty = true;
    this.flush();
  },

  async flush() {
    if (this.inflight || !this.dirty || this.failed || !this.signedIn) return;
    this.inflight = true;
    this.dirty = false;
    this.status('saving');
    try {
      const r = await this.rpc('save_state', { p_rev: this.rev, p_data: this.getState() });
      if (r && r.ok) {
        this.rev = Number(r.rev);
        this.retryMs = 3000;
        if (!this.dirty) this.status('saved');
      } else if (r && r.conflict) {
        // Otra persona guardó antes: se adopta lo suyo. Lo que se acababa de hacer aquí se descarta.
        this.dirty = false;
        const cur = await this.loadState();
        if (this.onRemote) this.onRemote(cur.data, this.rev, { conflict: true, by: r.updated_by });
        this.status('saved');
      }
    } catch (e) {
      this.dirty = true;
      this.failed = true;
      this.status('error', e);
      const wait = this.retryMs;
      this.retryMs = Math.min(this.retryMs * 2, 60000);
      setTimeout(() => { this.failed = false; this.flush(); }, wait);
    } finally {
      this.inflight = false;
      if (this.dirty && !this.failed) this.flush();
    }
  },

  /** Trae los cambios de los demás si no hay nada propio pendiente de guardar. */
  async poll() {
    if (!this.signedIn || this.pending || this.failed) return false;
    try {
      const r = await this.rpc('load_state_if_newer', { p_rev: this.rev });
      if (!r || this.pending) return false;
      this.rev = Number(r.rev) || 0;
      if (this.onRemote) this.onRemote(r.data, this.rev, { conflict: false, by: r.updated_by });
      return true;
    } catch (e) {
      return false;
    }
  },

  startPolling(ms = 20000) {
    clearInterval(this._poll);
    this._poll = setInterval(() => { if (!document.hidden) this.poll(); }, ms);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.poll(); });
  },

  status(s, err) { if (this.onStatus) this.onStatus(s, err); },

  /* ---------- Fotos (almacenamiento de archivos) ----------
     La foto ya llega reducida. Nombre único: nunca se pisa otra foto. */
  async uploadImage(blob, folder) {
    const name = (folder || 'productos') + '/' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
    let res;
    try {
      res = await fetch(this.cfg.url + '/storage/v1/object/fotos/' + name, {
        method: 'POST',
        headers: { apikey: this.cfg.key, Authorization: 'Bearer ' + (await this.accessToken()), 'Content-Type': 'image/jpeg', 'cache-control': '31536000' },
        body: blob
      });
    } catch (e) {
      const err = new Error('offline'); err.code = 'offline'; throw err;
    }
    if (!res.ok) {
      let msg = 'HTTP ' + res.status;
      try { const d = await res.json(); msg = d.message || d.error || msg; } catch (e) { /* sin cuerpo */ }
      const err = new Error(msg); err.status = res.status; throw err;
    }
    return this.cfg.url + '/storage/v1/object/public/fotos/' + name;
  },

  /* ---------- Equipo y copias (solo administradores) ---------- */
  listStaff() { return this.rpc('list_staff'); },
  upsertStaff(email, name, role) { return this.rpc('upsert_staff', { p_email: email, p_name: name, p_role: role }); },
  removeStaff(email) { return this.rpc('remove_staff', { p_email: email }); },
  listHistory() { return this.rpc('list_history'); },
  restore(id) { return this.rpc('restore_state', { p_history_id: id }); }
};
