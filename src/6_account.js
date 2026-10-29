<script>
'use strict';
/* =========================================================
   CUENTAS Y GUARDADO EN LA NUBE (Firebase Auth + Firestore)
   Pega aquí la configuración de tu proyecto de Firebase
   (Consola de Firebase → Configuración del proyecto → Tus apps → Web).
   Mientras sea null, el juego guarda solo en este navegador.
   ========================================================= */
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAgmV_P0N_zk1hHreejxR9PNhUbIIegGLI',
  authDomain: 'dragon-fall-5aaa6.firebaseapp.com',
  projectId: 'dragon-fall-5aaa6',
  storageBucket: 'dragon-fall-5aaa6.firebasestorage.app',
  messagingSenderId: '193504966514',
  appId: '1:193504966514:web:e1840fd5f9e777887c4feb',
};
/* Ejemplo:
const FIREBASE_CONFIG = {
  apiKey: 'AIza...',
  authDomain: 'dragon-fall-xxxx.firebaseapp.com',
  projectId: 'dragon-fall-xxxx',
  appId: '1:123456789:web:abc123',
};
*/

async function firebaseBackend(cfg) {
  const B = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const [app, auth, fs] = await Promise.all([import(B + 'firebase-app.js'), import(B + 'firebase-auth.js'), import(B + 'firebase-firestore.js')]);
  const a = app.initializeApp(cfg), au = auth.getAuth(a), db = fs.getFirestore(a);
  au.languageCode = 'es';
  const wrap = u => u && { uid: u.uid, email: u.email || '', name: u.displayName || '' };
  const ref = uid => fs.doc(db, 'players', uid);
  return {
    online: true,
    onAuth: cb => auth.onAuthStateChanged(au, u => cb(wrap(u))),
    register: async (email, pw, name) => { const c = await auth.createUserWithEmailAndPassword(au, email, pw); await auth.updateProfile(c.user, { displayName: name }); },
    login: (email, pw) => auth.signInWithEmailAndPassword(au, email, pw),
    google: () => auth.signInWithPopup(au, new auth.GoogleAuthProvider()),
    logout: () => auth.signOut(au),
    reset: email => auth.sendPasswordResetEmail(au, email),
    load: async uid => { const d = await fs.getDoc(ref(uid)); return d.exists() ? d.data() : null; },
    store: (uid, data) => fs.setDoc(ref(uid), { name: data.name, save: data.save, updatedAt: fs.serverTimestamp() }),
    remove: async uid => { await fs.deleteDoc(ref(uid)); await auth.deleteUser(au.currentUser); },
  };
}

const AUTH_ERR = {
  'auth/email-already-in-use': 'Ya existe una cuenta con ese email. Prueba a entrar.',
  'auth/invalid-email': 'El email no es válido.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/wrong-password': 'Email o contraseña incorrectos.',
  'auth/user-not-found': 'No hay ninguna cuenta con ese email.',
  'auth/missing-password': 'Escribe la contraseña.',
  'auth/too-many-requests': 'Demasiados intentos. Espera un momento y vuelve a probar.',
  'auth/network-request-failed': 'Sin conexión a internet.',
  'auth/popup-closed-by-user': 'Has cerrado la ventana de Google.',
  'auth/popup-blocked': 'El navegador ha bloqueado la ventana de Google.',
  'auth/operation-not-allowed': 'Este método de acceso no está activado en Firebase.',
  'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase.',
  'auth/requires-recent-login': 'Por seguridad, cierra sesión, vuelve a entrar y repite la acción.',
};
const authMsg = e => {
  const c = (e && e.code) || '';
  if (c.startsWith('auth/api-key-not-valid') || c === 'auth/invalid-api-key') return 'La configuración de Firebase no es válida (revisa FIREBASE_CONFIG).';
  if (c === 'permission-denied') return 'Firebase ha rechazado el guardado: revisa las reglas de Firestore.';
  return AUTH_ERR[c] || 'Algo ha fallado. Inténtalo de nuevo.';
};

const Account = {
  backend: null, user: null, status: 'local', lastSync: 0, timer: null, dirty: false, pendingName: '', pendingInit: null, initFromGuest: false, ready: false,
  async init() {
    try {
      if (DEV && window.DF_BACKEND) this.backend = window.DF_BACKEND;
      else if (FIREBASE_CONFIG) this.backend = await firebaseBackend(FIREBASE_CONFIG);
    } catch (e) { console.warn('Firebase no disponible', e); this.backend = null; this.status = 'error'; }
    this.ready = true;
    if (!this.backend) { renderAccountBadge(); return; }
    this.status = 'guest';
    this.backend.onAuth(u => this.onUser(u));
    addEventListener('pagehide', () => this.flush());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.flush(); });
    addEventListener('online', () => { if (this.user && this.dirty) this.push(); });
  },
  inRun() { return G && ['play', 'levelup', 'paused', 'shenron', 'capsule'].includes(state); },
  async onUser(u) {
    if (!u) {
      this.user = null; this.status = 'guest';
      if (!this.inRun()) { saveKey = SAVE_KEY; save = loadSave(); }
      this.refresh(); return;
    }
    if (!u.name) u.name = this.pendingName || u.email.split('@')[0];
    this.user = u; this.status = 'sync'; this.refresh();
    const key = SAVE_KEY + '_' + u.uid, local = readSave(key);
    let cloud = null, cloudOk = true;
    try { const d = await this.backend.load(u.uid); if (d) { cloud = normalizeSave(d.save); if (d.name) u.name = d.name; } } catch (e) { cloudOk = false; }
    let chosen;
    const init = this.pendingInit;
    if (init && !cloud) {   // cuenta nueva: empieza con el progreso elegido (navegador, código o de cero)
      chosen = normalizeSave(init); chosen.opts = save.opts; chosen.ts = Date.now();
      if (this.initFromGuest) try { localStorage.removeItem(SAVE_KEY); } catch (e) { }
    } else chosen = [local, cloud].filter(Boolean).sort((a, b) => b.ts - a.ts)[0];   // la versión más reciente
    this.pendingInit = null; this.initFromGuest = false; this.pendingName = '';
    if (this.inRun()) { this.status = cloudOk ? 'ok' : 'off'; this.refresh(); return; }
    saveKey = key; save = normalizeSave(chosen || defSave()); if (!save.ts) save.ts = Date.now();
    writeLocal();
    if (cloudOk) await this.push(); else { this.status = 'off'; this.dirty = true; }
    this.refresh();
  },
  queue() { if (!this.user) return; this.dirty = true; clearTimeout(this.timer); this.timer = setTimeout(() => this.push(), 2500); },
  flush() { if (this.user && this.dirty) { clearTimeout(this.timer); return this.push(); } return Promise.resolve(); },
  async push() {
    if (!this.user || !this.backend) return;
    clearTimeout(this.timer); this.status = 'sync'; renderAccountBadge();
    try { await this.backend.store(this.user.uid, { name: this.user.name, save: JSON.parse(JSON.stringify(save)) }); this.dirty = false; this.status = 'ok'; this.lastSync = Date.now(); }
    catch (e) { console.warn('No se pudo sincronizar', e); this.status = 'off'; this.dirty = true; }
    this.refresh();
  },
  refresh() { renderAccountBadge(); if (state === 'account') renderAccount(); if (state === 'title') renderTitle(); },
};

/* ---------- código de guardado ----------
   DF2 = JSON comprimido (deflate) en base64url + suma de control. DF1 (antiguo) sigue funcionando. */
const b64u = {
  enc: bytes => { let s = ''; bytes.forEach(b => s += String.fromCharCode(b)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
  dec: str => { str = str.replace(/-/g, '+').replace(/_/g, '/'); while (str.length % 4) str += '='; const s = atob(str), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; },
};
function crc4(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36).slice(-4).toUpperCase(); }
async function streamBytes(bytes, stream) { const s = new Blob([bytes]).stream().pipeThrough(stream); return new Uint8Array(await new Response(s).arrayBuffer()); }
function codeData() { const o = JSON.parse(JSON.stringify(save)); delete o.opts; delete o.ts; return o; }
async function exportCode() {
  const json = JSON.stringify(codeData());
  if (typeof CompressionStream === 'undefined') return 'DF1.' + btoa(unescape(encodeURIComponent(json)));
  const body = b64u.enc(await streamBytes(new TextEncoder().encode(json), new CompressionStream('deflate-raw')));
  return `DF2.${body}.${crc4(body)}`;
}
async function decodeCode(code) {
  code = (code || '').replace(/\s+/g, '');
  let o;
  if (code.startsWith('DF1.')) { try { o = JSON.parse(decodeURIComponent(escape(atob(code.slice(4))))); } catch (e) { throw new Error('El código está incompleto o dañado.'); } }
  else if (code.startsWith('DF2.')) {
    const parts = code.split('.'); if (parts.length !== 3) throw new Error('El código está incompleto: cópialo entero, desde «DF2.» hasta el final.');
    if (crc4(parts[1]) !== parts[2].toUpperCase()) throw new Error('El código tiene algún carácter mal copiado. Vuelve a copiarlo entero.');
    if (typeof DecompressionStream === 'undefined') throw new Error('Este navegador es demasiado antiguo para leer el código. Actualízalo y vuelve a probar.');
    try { o = JSON.parse(new TextDecoder().decode(await streamBytes(b64u.dec(parts[1]), new DecompressionStream('deflate-raw')))); } catch (e) { throw new Error('El código está dañado.'); }
  } else throw new Error('Eso no es un código de Dragon Fall (empieza por «DF2.» o «DF1.»).');
  if (!o || typeof o !== 'object' || !('zeni' in o)) throw new Error('El código no contiene una partida válida.');
  return normalizeSave(o);
}
async function importCode(code) { const s = await decodeCode(code); s.opts = save.opts; save = s; persist(); }
function hasProgress(s) { return !!s && (s.runs > 0 || s.zeni > 0 || Object.keys(s.owned || {}).length > 0 || Object.keys(s.shop || {}).length > 0 || Object.keys(s.cleared || {}).length > 0); }
function saveSummary(s) { return `${fmtNum(s.zeni)} zenis · ${CHARS.filter(c => s.owned[c.id] || (c.unlock == null)).length} guerreros · ${Object.keys(s.cleared).filter(k => STAGES.some(st => st.id === k)).length} sagas · ${fmtNum(s.runs)} partidas`; }

/* ---------- interfaz de cuenta ---------- */
const svg = (d, vb = '0 0 16 16') => `<svg viewBox="${vb}" width="16" height="16" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true">${d}</svg>`;
const ICO = {
  mail: svg('<path d="M1 3h14v10H1z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2 4l6 5 6-5" fill="none" stroke="currentColor" stroke-width="2"/>'),
  lock: svg('<rect x="2" y="7" width="12" height="8"/><path d="M4 7V5a4 4 0 0 1 8 0v2" fill="none" stroke="currentColor" stroke-width="2"/>'),
  user: svg('<rect x="5" y="1" width="6" height="6"/><rect x="2" y="9" width="12" height="6"/>'),
  key: svg('<rect x="1" y="5" width="6" height="6"/><rect x="6" y="7" width="9" height="2"/><rect x="11" y="9" width="2" height="3"/><rect x="13" y="9" width="2" height="2"/>'),
  eye: svg('<path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" fill="none" stroke="currentColor" stroke-width="2"/><rect x="6" y="6" width="4" height="4"/>'),
  eyeOff: svg('<path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2 14L14 2" stroke="currentColor" stroke-width="2"/>'),
};
/* Logotipo «G» oficial de Google para el botón de acceso */
const GOOGLE_G = `<svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`;
function fieldHTML(id, label, ico, type, ac, ph, extra = '') {
  return `<label class="field" for="${id}">${label}<span class="inp"><span class="ico">${ICO[ico]}</span><input id="${id}" type="${type}" autocomplete="${ac}" placeholder="${ph}" ${extra}>${type === 'password' ? `<button type="button" class="eye" data-for="${id}" aria-label="Mostrar contraseña">${ICO.eye}</button>` : ''}</span></label>`;
}
function renderAccountBadge() {
  const el = $('#acctBadge'); if (!el) return;
  const A = Account, dot = { ok: 'ok', sync: 'sync', off: 'off' }[A.status] || '';
  if (A.user) {
    const st = A.status === 'ok' ? 'guardado en la nube' : A.status === 'sync' ? 'sincronizando…' : 'sin conexión, se guardará al volver';
    el.innerHTML = `<span class="dot ${dot}"></span>👤 <b>${esc(A.user.name)}</b> · ${st}`;
  } else el.innerHTML = `<span class="dot"></span>Invitado · <b>guarda tu partida</b> con correo o con código`;
}
function esc(t) { return String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
let acctTab = 'mail', mailTab = 'login', acctMsg = null, regSource = null;
const PRIVACY = `<details class="priv"><summary>Privacidad (léela antes de registrarte)</summary>
  <p style="margin-top:6px">Solo guardamos tu <b>email</b>, tu <b>nombre de jugador</b> y tu <b>progreso del juego</b>, únicamente para que puedas recuperar tu partida en cualquier dispositivo. No se usa para publicidad ni se comparte con nadie. Los datos se alojan en Firebase (Google). Puedes borrar tu cuenta y todos tus datos cuando quieras desde esta misma pantalla. Si tienes menos de 14 años necesitas el permiso de tu madre, padre o tutor para crear una cuenta.</p></details>`;
function setMsg(type, text) { acctMsg = text ? { type, text } : null; const m = $('#acctMsg'); if (m) { m.className = 'msg' + (text ? ' on ' + type : ''); m.textContent = text || ''; } }
async function busy(btn, fn) { const t = btn.textContent; btn.disabled = true; btn.textContent = '...'; try { await fn(); } finally { btn.disabled = false; btn.textContent = t; } }
function codePane() {
  return `<p style="font-size:20px">Tu <b class="gold">código de guardado</b> contiene todo tu progreso: zenis, guerreros, estrellas, mejoras y sagas. Cópialo y guárdalo donde quieras (notas del móvil, un correo a ti mismo…). Para recuperar la partida en otro navegador, pégalo abajo.</p>
   <div class="row wrap"><button class="btn primary small" id="bkExport">COPIAR MI CÓDIGO</button></div>
   <textarea class="code" id="bkCode" placeholder="Pega aquí tu código DF2… para cargar tu partida" spellcheck="false"></textarea>
   <div class="row wrap"><button class="btn small" id="bkImport">CARGAR CÓDIGO</button></div>
   <p class="muted" style="font-size:17px">Progreso actual: ${saveSummary(save)}</p>`;
}
function sourcePicker() {
  const guest = readSave(SAVE_KEY), local = hasProgress(guest);
  if (!regSource) regSource = local ? 'local' : 'new';
  const opt = (v, t, d) => `<label class="check"><input type="radio" name="src" value="${v}" ${regSource === v ? 'checked' : ''}><span><b class="gold">${t}</b><br>${d}</span></label>`;
  return `<fieldset class="srcbox"><legend>¿Ya habías jugado antes?</legend>
    ${local ? opt('local', 'Sí, en este navegador', 'Tu cuenta empezará con lo que ya tienes aquí: ' + saveSummary(guest) + '.') : ''}
    ${opt('code', 'Sí, tengo un código', 'Si jugaste en una versión anterior o en otro dispositivo, pega tu código para no perder nada.')}
    <textarea class="code" id="fCode" placeholder="Pega tu código DF2… o DF1…" spellcheck="false" ${regSource === 'code' ? '' : 'hidden'}></textarea>
    ${opt('new', 'No, empiezo de cero', 'Tu cuenta empezará sin progreso.')}
  </fieldset>`;
}
function renderAccount() {
  const A = Account, box = $('#acctPanel');
  const msg = `<div class="msg${acctMsg ? ' on ' + acctMsg.type : ''}" id="acctMsg">${acctMsg ? esc(acctMsg.text) : ''}</div>`;
  if (!A.ready) { box.innerHTML = '<p class="muted">Conectando…</p>'; return; }
  const tabs = `<div class="seg" role="tablist"><button class="${acctTab === 'mail' ? 'on' : ''}" id="tMail" role="tab">${ICO.mail} CON CORREO</button><button class="${acctTab === 'code' ? 'on' : ''}" id="tCode" role="tab">${ICO.key} CON CÓDIGO</button></div>`;
  let body = '';
  if (acctTab === 'code') body = codePane();
  else if (!A.backend) {
    body = `<div class="msg on" style="background:#2a2410;color:#ffe9a8">Las cuentas con correo todavía no están activadas en esta web. De momento, guarda tu partida con tu <b>código</b> (pestaña «Con código»): cuando se activen, podrás crear tu cuenta y pegar ese código para conservarlo todo.</div>`;
  } else if (A.user) {
    const st = A.status === 'ok' ? `Guardado en la nube${A.lastSync ? ' a las ' + new Date(A.lastSync).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}` : A.status === 'sync' ? 'Sincronizando…' : 'Sin conexión: se subirá cuando vuelva internet';
    body = `<div class="prof"><canvas id="profCv" width="18" height="19"></canvas><div><h2 class="px" style="text-align:left">${esc(A.user.name).toUpperCase()}</h2><div class="muted" style="font-size:18px">${esc(A.user.email)}</div></div></div>
      <div class="stats"><span>Email</span><b>${esc(A.user.email)}</b><span>Estado</span><b>${st}</b><span>Zenis</span><b class="gold">${fmtNum(save.zeni)}</b><span>Guerreros</span><b>${CHARS.filter(isUnlocked).length}/${CHARS.length}</b><span>Sagas completadas</span><b>${Object.keys(save.cleared).filter(k => STAGES.some(s => s.id === k)).length}/${STAGES.length}</b><span>Partidas</span><b>${fmtNum(save.runs)}</b></div>
      <div class="row wrap"><button class="btn primary small" id="acSync">SINCRONIZAR AHORA</button><button class="btn small" id="acOut">CERRAR SESIÓN</button></div>
      <p class="muted" style="font-size:17px">Tu código de guardado sigue funcionando también: lo tienes en la pestaña «Con código».</p>
      <button class="linkbtn" id="acDel" style="color:#ff8a7a">Borrar mi cuenta y todos mis datos</button>`;
  } else {
    const reg = mailTab === 'register';
    body = `<div class="seg small"><button class="${reg ? '' : 'on'}" id="tLogin">ENTRAR</button><button class="${reg ? 'on' : ''}" id="tReg">CREAR CUENTA</button></div>
      <p class="muted" style="font-size:19px">${reg ? 'Con una cuenta tu progreso se guarda solo en la nube y lo recuperas en cualquier móvil u ordenador con tu correo y tu contraseña.' : 'Entra con tu correo para recuperar tu progreso.'}</p>
      <form id="acForm" class="col" novalidate>
        ${reg ? fieldHTML('fName', 'Nombre de jugador', 'user', 'text', 'nickname', 'Ej.: Kakarotto99', 'maxlength="16"') : ''}
        ${fieldHTML('fMail', 'Correo electrónico', 'mail', 'email', 'email', 'tu@correo.com')}
        ${fieldHTML('fPass', 'Contraseña', 'lock', 'password', reg ? 'new-password' : 'current-password', reg ? 'Mínimo 6 caracteres' : 'Tu contraseña')}
        ${reg ? `${fieldHTML('fPass2', 'Repite la contraseña', 'lock', 'password', 'new-password', 'Otra vez la misma')}${sourcePicker()}<label class="check"><input type="checkbox" id="fOk"><span>He leído la privacidad y tengo 14 años o más (o permiso de mi madre, padre o tutor).</span></label>${PRIVACY}` : `<button type="button" class="linkbtn" id="fForgot">¿Has olvidado la contraseña?</button>`}
        <button class="btn primary" type="submit" id="fGo">${reg ? 'CREAR CUENTA' : 'ENTRAR'}</button>
      </form>
      <div class="orsep"><span>o</span></div>
      <button class="gbtn" id="fGoogle" type="button">${GOOGLE_G}<span>${reg ? 'Registrarse' : 'Continuar'} con Google</span></button>`;
  }
  box.innerHTML = tabs + msg + body;
  const pc = $('#profCv'); if (pc) pc.getContext('2d').drawImage(getPortrait(save.lastChar && CHAR[save.lastChar] ? save.lastChar : 'goku'), 0, 0);
  box.querySelectorAll('.eye').forEach(btn => btn.onclick = () => { const inp = $('#' + btn.dataset.for), show = inp.type === 'password'; inp.type = show ? 'text' : 'password'; btn.innerHTML = show ? ICO.eyeOff : ICO.eye; btn.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña'); });
  $('#tMail').onclick = () => { acctTab = 'mail'; acctMsg = null; renderAccount(); };
  $('#tCode').onclick = () => { acctTab = 'code'; acctMsg = null; renderAccount(); };
  if (acctTab === 'code') {
    $('#bkExport').onclick = async () => { const c = await exportCode(); $('#bkCode').value = c; try { await navigator.clipboard.writeText(c); setMsg('ok', 'Código copiado. Guárdalo en un sitio seguro.'); } catch (e) { $('#bkCode').select(); setMsg('ok', 'Código listo: cópialo del cuadro.'); } };
    $('#bkImport').onclick = async () => {
      const c = $('#bkCode').value; if (!c.trim()) return setMsg('err', 'Pega primero un código.');
      let s; try { s = await decodeCode(c); } catch (e) { return setMsg('err', e.message); }
      if (!(await ask(`Este código tiene: ${saveSummary(s)}. Sustituirá tu progreso actual. ¿Cargarlo?`, 'CARGAR'))) return;
      await importCode(c); acctMsg = { type: 'ok', text: 'Partida cargada.' + (A.user ? ' También se ha guardado en tu cuenta.' : '') }; renderAccount();
    };
    return;
  }
  if (!A.backend) return;
  if (A.user) {
    $('#acSync').onclick = e => busy(e.target, async () => { await A.push(); setMsg(A.status === 'ok' ? 'ok' : 'err', A.status === 'ok' ? 'Progreso guardado en la nube.' : 'No hay conexión. Lo intentaremos más tarde.'); });
    $('#acOut').onclick = e => busy(e.target, async () => { await A.flush(); await A.backend.logout(); acctMsg = { type: 'ok', text: 'Has cerrado sesión. Ahora juegas como invitado.' }; });
    $('#acDel').onclick = async () => {
      if (!(await ask('¿Borrar tu cuenta? Se eliminarán tu email, tu nombre y todo tu progreso en la nube. No se puede deshacer.', 'BORRAR CUENTA'))) return;
      const uid = A.user.uid;
      try { await A.backend.remove(uid); try { localStorage.removeItem(SAVE_KEY + '_' + uid); } catch (e) { } acctMsg = { type: 'ok', text: 'Cuenta borrada.' }; renderAccount(); }
      catch (e) { setMsg('err', authMsg(e)); }
    };
    return;
  }
  const reg = mailTab === 'register';
  $('#tLogin').onclick = () => { mailTab = 'login'; acctMsg = null; renderAccount(); };
  $('#tReg').onclick = () => { mailTab = 'register'; acctMsg = null; renderAccount(); };
  if (reg) document.querySelectorAll('input[name=src]').forEach(r => r.onchange = () => { regSource = r.value; $('#fCode').hidden = regSource !== 'code'; });
  // Prepara el progreso inicial de la cuenta nueva según lo elegido
  const prepareInit = async () => {
    if (regSource === 'code') { const c = $('#fCode').value; if (!c.trim()) throw new Error('Pega tu código o elige otra opción.'); A.pendingInit = await decodeCode(c); A.initFromGuest = false; }
    else if (regSource === 'local') { A.pendingInit = readSave(SAVE_KEY); A.initFromGuest = true; }
    else { A.pendingInit = defSave(); A.initFromGuest = false; }
  };
  $('#acForm').onsubmit = ev => {
    ev.preventDefault();
    const mail = $('#fMail').value.trim(), pass = $('#fPass').value;
    if (!reg) return busy($('#fGo'), async () => { try { await A.backend.login(mail, pass); acctMsg = { type: 'ok', text: 'Sesión iniciada. Progreso recuperado.' }; } catch (e) { setMsg('err', authMsg(e)); } });
    const name = $('#fName').value.trim();
    if (name.length < 3) return setMsg('err', 'El nombre debe tener al menos 3 caracteres.');
    if (!/^[\p{L}\p{N} _.-]+$/u.test(name)) return setMsg('err', 'El nombre solo puede tener letras, números, espacios, puntos y guiones.');
    if (pass.length < 6) return setMsg('err', 'La contraseña debe tener al menos 6 caracteres.');
    if (pass !== $('#fPass2').value) return setMsg('err', 'Las dos contraseñas no coinciden.');
    if (!$('#fOk').checked) return setMsg('err', 'Tienes que aceptar la privacidad para crear la cuenta.');
    busy($('#fGo'), async () => {
      try { await prepareInit(); } catch (e) { return setMsg('err', e.message); }
      A.pendingName = name;
      try { await A.backend.register(mail, pass, name); acctMsg = { type: 'ok', text: `¡Cuenta creada! Bienvenido, ${name}. Tu progreso ya está en la nube.` }; regSource = null; }
      catch (e) { A.pendingInit = null; setMsg('err', authMsg(e)); }
    });
  };
  $('#fGoogle').onclick = e => {
    if (reg && !$('#fOk').checked) return setMsg('err', 'Tienes que aceptar la privacidad para crear la cuenta.');
    busy(e.target, async () => {
      if (reg) { try { await prepareInit(); } catch (er) { return setMsg('err', er.message); } }
      try { await A.backend.google(); acctMsg = { type: 'ok', text: 'Sesión iniciada con Google.' }; } catch (er) { A.pendingInit = null; setMsg('err', authMsg(er)); }
    });
  };
  if (!reg) $('#fForgot').onclick = () => {
    const mail = $('#fMail').value.trim(); if (!mail) return setMsg('err', 'Escribe tu correo y vuelve a pulsar.');
    A.backend.reset(mail).then(() => setMsg('ok', 'Te hemos enviado un correo para cambiar la contraseña.'), e => setMsg('err', authMsg(e)));
  };
}
$('#bAcct').onclick = () => { acctMsg = null; acctTab = Account.backend ? 'mail' : 'code'; go('account'); };
$('#acctBadge').onclick = () => { acctMsg = null; acctTab = Account.backend ? 'mail' : 'code'; go('account'); };
Account.init();
ACCT = Account;
if (window.DF) window.DF.account = Account;
</script>
</body>
</html>
