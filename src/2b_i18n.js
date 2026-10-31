<script>
// Ganchos de depuración/tests solo en local (file:// o localhost), nunca en la web publicada
const DEV = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
/* =================== IDIOMAS (castellano, català, English) ===================
   El juego se escribe en castellano. Cada texto que se muestra (HTML o canvas) pasa por L():
   se busca tal cual en el diccionario y, si no, con los números cambiados por # (y se vuelven a poner).
   Los textos con nombres dentro usan los patrones de I18N_PAT. */
const LANGS = { es: 'Castellano', ca: 'Català', en: 'English' };
let LANG = 'es';
function detectLang() {
  let l = '';
  try { const raw = localStorage.getItem('dragonfall_lang'); if (raw) l = raw; } catch (e) { }
  if (!LANGS[l]) { const n = (navigator.language || 'es').toLowerCase(); l = n.startsWith('ca') ? 'ca' : n.startsWith('es') || n.startsWith('gl') || n.startsWith('eu') ? 'es' : 'en'; }
  return l;
}
LANG = detectLang();
document.documentElement.lang = LANG;
const I18N = { ca: {}, en: {} }, I18N_PAT = { ca: [], en: [] };
const NUM_RE = /\d+(?:[.,]\d+)*/g;
const trMemo = new Map();
function L(s) {
  if (LANG === 'es' || s == null) return s;
  s = String(s);
  if (!/[A-Za-zÀ-ÿ¡¿]/.test(s)) return s;
  if (capsOut.has(s)) return s;   // ya traducido y sin tildes en mayúscula (ver pxCaps)
  const m = trMemo.get(s); if (m !== undefined) return m;
  if (trOut.has(s)) return s;   // ya es una traducción (el observador ve nuestros propios cambios)
  const r = trRaw(s);
  if (r !== s) trOut.add(r);
  if (trMemo.size > 6000) trMemo.clear();
  trMemo.set(s, r); return r;
}
function trRaw(s) {
  const D = I18N[LANG], lead = s.match(/^\s*/)[0], tail = s.match(/\s*$/)[0], core = s.trim();
  if (!core) return s;
  if (D[core] !== undefined) return lead + D[core] + tail;
  const nums = core.match(NUM_RE);
  if (nums) { const k = core.replace(NUM_RE, '#'); if (D[k] !== undefined) { let i = 0; return lead + D[k].replace(/#/g, () => fmtLoc(nums[i++] ?? '')) + tail; } }
  // MAYÚSCULAS: se busca la versión normal y se devuelve en mayúsculas
  if (core === core.toUpperCase()) { const up = upperIndex().get(nums ? core.replace(NUM_RE, '#') : core); if (up !== undefined) { let i = 0; return lead + up.replace(/#/g, () => fmtLoc(nums[i++] ?? '')) + tail; } }
  // Símbolos delante o detrás (⚡, 🔒, ★, ▶…): se traduce lo de dentro
  const sm = core.match(/^([^\p{L}\p{N}¡¿«"(#+\-]+)?(.*?)([^\p{L}\p{N}!?.:)»"#%…]+)?$/u);
  if (sm && (sm[1] || sm[3]) && sm[2]) { const inner = L(sm[2]); if (inner !== sm[2]) return lead + (sm[1] || '') + inner + (sm[3] || '') + tail; }
  // Trozos separados por « · », « + » o « → »
  for (const sep of [' · ', ' + ', ' → ']) if (core.includes(sep)) { const parts = core.split(sep); trQuiet++; const tr = parts.map(L); trQuiet--; if (tr.some((t, i) => t !== parts[i])) return lead + tr.join(sep) + tail; }
  for (const [re, out] of I18N_PAT[LANG]) { const mm = core.match(re); if (mm) return lead + (typeof out === 'function' ? out(mm) : core.replace(re, out)) + tail; }
  if (DEV && trMiss && !trQuiet) trMiss.add(nums ? core.replace(NUM_RE, '#') : core);
  return s;
}
const upIdx = {};
function upperIndex() {
  if (upIdx[LANG]) return upIdx[LANG];
  const m = new Map(), D = I18N[LANG];
  for (const k in D) { const u = k.toUpperCase(); if (u !== k && !(u in D)) m.set(u, D[k].toUpperCase()); }
  return (upIdx[LANG] = m);
}
// En inglés los miles van con coma (1,000); en castellano y catalán, con punto (1.000)
function fmtLoc(n) { return LANG === 'en' && /^\d{1,3}(\.\d{3})+$/.test(n) ? n.replace(/\./g, ',') : n; }
const trMiss = new Set(), trOut = new Set();
let trQuiet = 0;
// Traduce el HTML al vuelo: texto y atributos visibles. Lo que se pinta en canvas pasa por txt().
const TR_ATTR = ['title', 'aria-label', 'placeholder'];
function trNode(n) {
  if (n.nodeType === 3) { const p = n.parentNode; if (!p || p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE') return; const t = L(n.data); if (t !== n.data) n.data = t; return; }
  if (n.nodeType !== 1) return;
  for (const a of TR_ATTR) if (n.hasAttribute(a)) { const v = n.getAttribute(a), t = L(v); if (t !== v) n.setAttribute(a, t); }
  if (n.nodeName === 'SCRIPT' || n.nodeName === 'STYLE') return;
  const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let c; while ((c = w.nextNode())) {
    if (c.nodeType === 3) { const p = c.parentNode; if (p && p.nodeName !== 'SCRIPT' && p.nodeName !== 'STYLE') { const t = L(c.data); if (t !== c.data) c.data = t; } }
    else for (const a of TR_ATTR) if (c.hasAttribute(a)) { const v = c.getAttribute(a), t = L(v); if (t !== v) c.setAttribute(a, t); }
  }
}
/* La fuente pixel (Press Start 2P) dibuja las mayúsculas con tilde casi como minúsculas («éPICO», «CAíDO»):
   en esa fuente se escriben sin tilde. Vale para el HTML y para todo lo que se pinta en canvas. */
const CAP_ACC = /[ÁÀÉÈÍÏÓÒÚÜ]/g, CAP_MAP = { Á: 'A', À: 'A', É: 'E', È: 'E', Í: 'I', Ï: 'I', Ó: 'O', Ò: 'O', Ú: 'U', Ü: 'U' };
const pxCaps = s => typeof s === 'string' && CAP_ACC.test(s) ? (CAP_ACC.lastIndex = 0, s.replace(CAP_ACC, c => CAP_MAP[c])) : s;
for (const fn of ['fillText', 'strokeText']) {
  const orig = CanvasRenderingContext2D.prototype[fn];
  CanvasRenderingContext2D.prototype[fn] = function (t, ...a) { return orig.call(this, this.font.includes('Press') ? pxCaps(t) : t, ...a); };
}
const pxFontCache = new WeakMap(), capsOut = new Set();
function isPxEl(el) { let v = pxFontCache.get(el); if (v === undefined) { v = /Press Start/.test(getComputedStyle(el).fontFamily); pxFontCache.set(el, v); } return v; }
function capsText(t) { const p = t.parentNode; if (p && p.nodeType === 1 && p.nodeName !== 'SCRIPT' && p.nodeName !== 'STYLE' && isPxEl(p)) { const v = pxCaps(t.data); if (v !== t.data) { if (capsOut.size > 4000) capsOut.clear(); capsOut.add(v); t.data = v; } } }
function capsNode(n) {
  if (n.nodeType === 3) return capsText(n);
  if (n.nodeType !== 1 || n.nodeName === 'SCRIPT' || n.nodeName === 'STYLE') return;
  const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT); let c; while ((c = w.nextNode())) capsText(c);
}
// Va después del traductor (los observadores se avisan en orden de creación): así se traduce con la tilde y luego se quita
function startCaps() {
  capsNode(document.body);
  new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') capsText(m.target); else m.addedNodes.forEach(capsNode); } })
    .observe(document.body, { childList: true, subtree: true, characterData: true });
}
function startI18n() {
  if (LANG === 'es') return;
  document.title = L(document.title);
  trNode(document.body);
  new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === 'characterData') trNode(m.target);
      else if (m.type === 'attributes') trNode(m.target);
      else m.addedNodes.forEach(trNode);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: TR_ATTR });
}
function setLang(l) {
  if (!LANGS[l] || l === LANG) return;
  try { localStorage.setItem('dragonfall_lang', l); } catch (e) { }
  location.reload();
}
function langRow() {
  const row = document.createElement('div'); row.className = 'opt';
  row.innerHTML = `<span>Idioma · Idioma · Language</span><span class="langs">${Object.entries(LANGS).map(([k, n]) => `<button class="btn small ${k === LANG ? 'on' : ''}" data-l="${k}">${n}</button>`).join('')}</span>`;
  row.querySelectorAll('button').forEach(b => b.onclick = () => setLang(b.dataset.l));
  return row;
}
</script>
