<script>
'use strict';
/* =========================================================
   TIENDA: cajas, tienda diaria, ofertas personales y regalo diario.
   Todo se paga con zenis del juego (nunca con dinero real).
   ========================================================= */
function drawCapsule(cv, col) {
  const x = cv.getContext('2d'), W = cv.width, s = W / 48; x.imageSmoothingEnabled = false; x.clearRect(0, 0, W, cv.height);
  const c1 = col, c2 = shade(col, .45);
  const r = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(a * s, b * s, w * s, h * s); };
  r(6, 6, 36, 20, OUTLINE); r(4, 8, 40, 16, OUTLINE);
  r(7, 7, 17, 18, c1); r(5, 9, 19, 14, c1); r(24, 7, 17, 18, '#f4f1e8'); r(24, 9, 19, 14, '#f4f1e8');
  r(8, 8, 14, 3, c2); r(26, 8, 14, 3, '#ffffff'); r(24, 23, 18, 2, '#c9c4b8'); r(6, 21, 17, 3, shade(c1, -.25));
  r(23, 7, 2, 18, '#3a4270'); r(29, 13, 6, 6, OUTLINE); r(30, 14, 4, 4, '#3aa0ff'); r(31, 15, 1, 1, '#ffffff');
  r(12, 14, 6, 4, shade(c1, -.4)); r(13, 15, 4, 2, c2);
}
function boxPool(b) { return b.pool ? b.pool.map(id => CHAR[id]).filter(Boolean) : CHARS; }
/* Probabilidades normalizadas a las rarezas que existen en la caja */
function boxOdds(b) {
  const pool = boxPool(b), has = r => pool.some(c => c.rar === r), o = {};
  let tot = 0; for (const r of RAR_ORDER) if (has(r)) tot += b.odds[r] || 0;
  for (const r of RAR_ORDER) o[r] = has(r) && tot ? (b.odds[r] || 0) / tot * 100 : 0;
  return o;
}
function rollBox(b) {
  const o = boxOdds(b), pool = boxPool(b); let q = Math.random() * 100, rar = 'C';
  for (const r of RAR_ORDER) { if (!o[r]) continue; q -= o[r]; if (q <= 0) { rar = r; break; } rar = r; }
  const opts = pool.filter(c => c.rar === rar); return pick(opts.length ? opts : pool);
}
/* Entrega un guerrero: nuevo, estrella extra o zenis si ya está al máximo */
function grantChar(c) {
  const st = starsOf(c.id);
  if (st === 0) { save.owned[c.id] = 1; markSeen(c.id); return { kind: 'new' }; }
  if (st < MAX_STARS) { save.owned[c.id] = st + 1; return { kind: 'star', stars: st + 1 }; }
  save.zeni += REFUND[c.rar]; return { kind: 'refund', z: REFUND[c.rar] };
}

/* ---------- días y semillas ---------- */
function dayKey(d = new Date()) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function yesterdayKey() { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); }
function seeded(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return rng((h >>> 0) || 1); }
function untilMidnight() { const n = new Date(), m = new Date(n); m.setHours(24, 0, 0, 0); const s = Math.max(0, Math.floor((m - n) / 1000)); return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(v => String(v).padStart(2, '0')).join(':'); }
function dailyState() { const d = dayKey(); if (save.daily.day !== d) save.daily = { day: d, bought: {} }; return save.daily; }
const round10 = v => Math.max(10, Math.round(v / 10) * 10);

/* Tienda diaria: igual para todos los jugadores ese día */
function dailyOffers() {
  const day = dayKey(), r = seeded('df-daily-' + day), out = [];
  ['C', 'R', 'E', 'L'].forEach((rar, i) => {
    const pool = CHARS.filter(c => c.rar === rar), c = pool[Math.floor(r() * pool.length)], disc = [0, 10, 15, 20, 25, 30][Math.floor(r() * 6)];
    out.push({ id: 'd' + i, kind: 'char', char: c.id, base: CHAR_PRICE[rar], price: round10(CHAR_PRICE[rar] * (1 - disc / 100)), disc, limit: 1 });
  });
  const bx = BOXES.slice(); for (let i = bx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [bx[i], bx[j]] = [bx[j], bx[i]]; }
  bx.slice(0, 2).forEach((b, i) => { const disc = [20, 25, 30, 40][Math.floor(r() * 4)]; out.push({ id: 'db' + i, kind: 'box', box: b.id, base: b.price, price: round10(b.price * (1 - disc / 100)), disc, limit: 3 }); });
  return out;
}
/* Ofertas personales: distintas para cada jugador y cada día, según lo que le falta */
function personalOffers() {
  const day = dayKey(), r = seeded('df-me-' + save.pid + '-' + day), out = [];
  const unowned = CHARS.filter(c => !isUnlocked(c));
  if (unowned.length) {
    const w = unowned.map(c => ({ c, w: { C: 3, R: 3, E: 2, L: 1.2 }[c.rar] })), tot = w.reduce((a, x) => a + x.w, 0);
    let q = r() * tot, c = unowned[0]; for (const x of w) { q -= x.w; if (q <= 0) { c = x.c; break; } }
    const disc = 35 + Math.floor(r() * 4) * 5;
    out.push({ id: 'p0', kind: 'char', char: c.id, base: CHAR_PRICE[c.rar], price: round10(CHAR_PRICE[c.rar] * (1 - disc / 100)), disc, limit: 1, tag: 'Aún no lo tienes' });
  } else {
    const c = CHARS.filter(c => starsOf(c.id) < MAX_STARS)[0] || CHAR.goku;
    out.push({ id: 'p0', kind: 'star', char: c.id, base: round10(CHAR_PRICE[c.rar] * .6), price: round10(CHAR_PRICE[c.rar] * .35), disc: 40, limit: 1, tag: '¡Lo tienes todo!' });
  }
  const scored = BOXES.filter(b => b.pool).map(b => ({ b, miss: boxPool(b).filter(c => !isUnlocked(c)).length })).filter(x => x.miss > 0).sort((a, b) => b.miss - a.miss);
  const pb = scored.length ? scored[Math.floor(r() * Math.min(3, scored.length))] : { b: BOX.g, miss: 0 }, d2 = 30 + Math.floor(r() * 4) * 5;
  out.push({ id: 'p1', kind: 'box', box: pb.b.id, base: pb.b.price, price: round10(pb.b.price * (1 - d2 / 100)), disc: d2, limit: 2, tag: pb.miss ? `Te faltan ${pb.miss} de esta caja` : 'Para ti' });
  const fav = save.lastChar && CHAR[save.lastChar] && isUnlocked(CHAR[save.lastChar]) ? save.lastChar : null;
  if (fav && starsOf(fav) < MAX_STARS && r() < .65) {
    const c = CHAR[fav]; out.push({ id: 'p2', kind: 'star', char: fav, base: round10(CHAR_PRICE[c.rar] * .6), price: round10(CHAR_PRICE[c.rar] * .38), disc: 37, limit: 1, tag: 'Tu guerrero favorito' });
  } else {
    const q2 = 2 + Math.floor(r() * 2), d3 = 25 + Math.floor(r() * 3) * 5;
    out.push({ id: 'p2', kind: 'bundle', box: 'g', qty: q2, base: BOX.g.price * q2, price: round10(BOX.g.price * q2 * (1 - d3 / 100)), disc: d3, limit: 1, tag: 'Pack del día' });
  }
  return out;
}

/* ---------- regalo diario ---------- */
function giftState() { const t = dayKey(), s = save.streak, can = s.last !== t, next = can ? (s.last === yesterdayKey() ? s.n % 7 + 1 : 1) : s.n; return { can, day: next }; }
function claimGift() {
  const g = giftState(); if (!g.can) return;
  const rw = DAILY_GIFTS[g.day - 1];
  if (rw.z) save.zeni += rw.z; if (rw.t) save.tickets[rw.t] = (save.tickets[rw.t] || 0) + 1;
  save.streak = { last: dayKey(), n: g.day }; persist(); sfx('ball'); renderTitle();
  toastShop(`Regalo del día ${g.day}: ${giftLabel(rw)}`);
  renderShop2();
}
function giftLabel(rw) { return [rw.z ? `${fmtNum(rw.z)} zenis` : '', rw.t ? BOX[rw.t].name : ''].filter(Boolean).join(' + '); }

/* ---------- interfaz ---------- */
let shopTab = 'today', shopTimer = null;
function toastShop(t) { const el = $('#shopToast'); if (!el) return; el.textContent = t; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); }
function portraitCanvas(id, cls = '') { const c = document.createElement('canvas'); c.width = 18; c.height = 19; c.className = cls; c.getContext('2d').drawImage(getPortrait(id), 0, 0); return c; }
function offerCard(o, personal) {
  const ds = dailyState(), n = ds.bought[o.id] || 0, left = o.limit - n, el = document.createElement('div');
  el.className = 'offer' + (personal ? ' mine' : '');
  let art = '', title = '', sub = '', soldOut = left <= 0;
  if (o.kind === 'char' || o.kind === 'star') {
    const c = CHAR[o.char], st = starsOf(c.id);
    title = c.name; sub = o.kind === 'star' ? `+1 estrella (${st}★ → ${Math.min(MAX_STARS, st + 1)}★)` : st ? `Ya lo tienes: +1 estrella (${st}★)` : '¡Nuevo guerrero!';
    if (st >= MAX_STARS) { soldOut = true; sub = 'Al máximo (5★)'; }
    el.dataset.r = c.rar; art = 'char';
  } else if (o.kind === 'box') { const b = BOX[o.box]; title = b.name; sub = 'Se abre al comprarla'; art = 'box'; }
  else { const b = BOX[o.box]; title = `${o.qty} × ${b.name}`; sub = 'Se guardan para abrirlas cuando quieras'; art = 'box'; }
  el.innerHTML = `${o.tag ? `<span class="otag">${o.tag}</span>` : ''}${o.disc ? `<span class="odisc">-${o.disc}%</span>` : ''}<div class="oart"></div>
    <div class="oname">${title}</div>${o.kind === 'char' || o.kind === 'star' ? rarTag(CHAR[o.char].rar) : ''}<div class="osub">${sub}</div>
    <div class="oprice">${o.disc ? `<s>${fmtNum(o.base)}</s>` : ''}<span class="zeni"><i></i>${fmtNum(o.price)}</span></div>
    <button class="btn small ${soldOut ? '' : 'gold'}" ${soldOut || save.zeni < o.price ? 'disabled' : ''}>${soldOut ? (left <= 0 ? 'COMPRADO' : 'AL MÁXIMO') : 'COMPRAR'}</button>
    ${o.limit > 1 && !soldOut ? `<div class="olim">Quedan ${left}</div>` : ''}`;
  const a = el.querySelector('.oart');
  if (art === 'char') { const cv = document.createElement('canvas'); cv.width = 72; cv.height = 84; cv.className = 'pedestal'; paintPedestal(cv, CHAR[o.char], true); a.appendChild(cv); }
  else { const cv = document.createElement('canvas'); cv.width = 48; cv.height = 32; drawCapsule(cv, BOX[o.box].col); a.appendChild(cv); }
  el.querySelector('button').onclick = () => buyOffer(o);
  if (art === 'box') { a.classList.add('inspect'); a.title = 'Ver lo que puede tocar'; a.onclick = () => inspectBox(BOX[o.box]); }
  return el;
}
async function buyOffer(o) {
  const ds = dailyState(); if ((ds.bought[o.id] || 0) >= o.limit || save.zeni < o.price) return;
  const what = o.kind === 'box' ? BOX[o.box].name : o.kind === 'bundle' ? `${o.qty} × ${BOX[o.box].name}` : CHAR[o.char].name;
  if (!(await ask(`¿Comprar ${what} por ${fmtNum(o.price)} zenis?`, 'COMPRAR'))) return;
  save.zeni -= o.price; ds.bought[o.id] = (ds.bought[o.id] || 0) + 1;
  if (o.kind === 'box') { persist(); openBox(BOX[o.box], 'paid'); return; }
  if (o.kind === 'bundle') { save.tickets[o.box] = (save.tickets[o.box] || 0) + o.qty; persist(); sfx('ball'); toastShop(`¡${o.qty} × ${BOX[o.box].name} guardadas! Ábrelas en CAJAS.`); renderShop2(); return; }
  const c = CHAR[o.char], res = grantChar(c); persist();
  showResult(c, res, null, false);
}
function renderShop2() {
  $('#zGacha').innerHTML = `<i></i>${fmtNum(save.zeni)}`;
  const tabs = $('#shopTabs'); tabs.innerHTML = '';
  [['today', 'HOY'], ['boxes', 'CAJAS']].forEach(([k, n]) => { const b = document.createElement('button'); b.className = 'btn small' + (shopTab === k ? ' on' : ''); b.textContent = n; b.onclick = () => { shopTab = k; sfx('click'); renderShop2(); }; tabs.appendChild(b); });
  const body = $('#shopBody'); body.innerHTML = '';
  if (shopTab === 'today') {
    // regalo diario
    const g = giftState(), gift = document.createElement('div'); gift.className = 'panel shopsec';
    gift.innerHTML = `<div class="sechd"><b class="px gold">REGALO DIARIO</b><span class="muted">Entra cada día: la racha sube el premio</span></div><div class="gifts">${DAILY_GIFTS.map((rw, i) => {
      const d = i + 1, done = g.can ? d < g.day : d <= g.day, today = g.can && d === g.day;
      return `<div class="gift${done ? ' done' : ''}${today ? ' today' : ''}"><span class="px">DÍA ${d}</span><span>${giftLabel(rw)}</span>${done ? '<b>✓</b>' : ''}</div>`; }).join('')}</div>
      <button class="btn ${g.can ? 'primary' : ''}" id="bGift" ${g.can ? '' : 'disabled'}>${g.can ? 'RECOGER REGALO' : 'VUELVE MAÑANA · ' + untilMidnight()}</button>`;
    body.appendChild(gift); if (g.can) gift.querySelector('#bGift').onclick = claimGift;
    // ofertas personales
    const me = document.createElement('div'); me.className = 'panel shopsec mine';
    me.innerHTML = `<div class="sechd"><b class="px gold">★ SOLO PARA TI ★</b><span class="muted">Ofertas exclusivas de tu cuenta · cambian en <b class="cd">${untilMidnight()}</b></span></div><div class="offers"></div>`;
    personalOffers().forEach(o => me.querySelector('.offers').appendChild(offerCard(o, true)));
    body.appendChild(me);
    // tienda diaria
    const dd = document.createElement('div'); dd.className = 'panel shopsec';
    dd.innerHTML = `<div class="sechd"><b class="px gold">TIENDA DIARIA</b><span class="muted">Se renueva en <b class="cd">${untilMidnight()}</b></span></div><div class="offers"></div>`;
    dailyOffers().forEach(o => dd.querySelector('.offers').appendChild(offerCard(o, false)));
    body.appendChild(dd);
  } else {
    const grid = document.createElement('div'); grid.className = 'boxgrid';
    BOXES.forEach(b => {
      const el = document.createElement('div'); el.className = 'cap boxc'; el.style.setProperty('--bc', b.col);
      const cv = document.createElement('canvas'); cv.width = 48; cv.height = 32; drawCapsule(cv, b.col);
      const o = boxOdds(b), pool = boxPool(b), tk = save.tickets[b.id] || 0, own = pool.filter(isUnlocked).length;
      el.appendChild(cv);
      el.insertAdjacentHTML('beforeend', `<div class="t">${b.name.toUpperCase()}</div><div class="muted" style="text-align:center;font-size:18px">${b.desc}</div>
        <div class="bpool"></div><div class="muted" style="text-align:center;font-size:17px">Tienes ${own}/${pool.length} de esta caja</div>
        <div class="odds">${RAR_ORDER.filter(r => o[r] > 0).map(r => `<span style="color:${RAR[r].col}">${RAR[r].name}</span><i><b style="width:${o[r]}%;background:${RAR[r].col}"></b></i><span>${Math.round(o[r])}%</span>`).join('')}</div>
        <button class="btn small" data-pay="i">🔍 VER CONTENIDO</button>
        <button class="btn primary" data-pay="z" ${save.zeni >= b.price ? '' : 'disabled'}>ABRIR · ${fmtNum(b.price)}</button>
        ${tk ? `<button class="btn gold" data-pay="t">ABRIR GRATIS (${tk})</button>` : ''}`);
      const bp = el.querySelector('.bpool');
      const show = b.pool ? pool : CHARS.filter(c => c.rar === 'L').concat(CHARS.filter(c => c.rar === 'E').slice(0, 5));
      show.slice(0, 14).forEach(c => { const pc = portraitCanvas(c.id, isUnlocked(c) ? '' : 'notown'); pc.title = c.name + ' · ' + RAR[c.rar].name; pc.style.borderColor = RAR[c.rar].col; bp.appendChild(pc); });
      el.querySelectorAll('button').forEach(btn => btn.onclick = e => { e.stopPropagation(); if (btn.dataset.pay === 'i') inspectBox(b); else openBox(b, btn.dataset.pay === 't' ? 'ticket' : 'zeni'); });
      el.classList.add('inspect'); el.title = 'Haz clic para ver todo lo que puede tocar'; el.onclick = () => inspectBox(b);
      grid.appendChild(el);
    });
    body.appendChild(grid);
  }
  clearInterval(shopTimer);
  shopTimer = setInterval(() => { if (state !== 'gacha') { clearInterval(shopTimer); return; } if (dailyState().day !== dayKey()) renderShop2(); document.querySelectorAll('#shopBody .cd').forEach(e => e.textContent = untilMidnight()); }, 1000);
}

/* ---------- Inspeccionar caja: todo lo que puede tocar y su probabilidad ---------- */
function closeInspect() { const o = $('#boxInfo'); if (o) o.remove(); }
function inspectBox(b) {
  closeInspect(); sfx('click');
  const o = boxOdds(b), pool = boxPool(b), own = pool.filter(isUnlocked).length;
  const ov = document.createElement('div'); ov.id = 'boxInfo'; ov.className = 'boxinfo';
  ov.innerHTML = `<div class="panel bi-panel" role="dialog" aria-label="Contenido de ${b.name}">
    <button class="btn small bi-x" aria-label="Cerrar">X</button>
    <div class="bi-head"><canvas width="48" height="32"></canvas><div><b class="px gold">${b.name.toUpperCase()}</b><div class="muted">${b.desc}</div>
      <div class="muted">${pool.length} guerreros posibles · tienes <span class="bi-own">${own}</span> · precio <span class="zeni"><i></i>${fmtNum(b.price)}</span></div></div></div>
    <div class="bi-odds">${RAR_ORDER.filter(r => o[r] > 0).map(r => `<span style="--rc:${RAR[r].col}"><b>${RAR[r].name}</b>${fmtPct(o[r])}</span>`).join('')}</div>
    <div class="bi-list"></div>
    <p class="muted" style="text-align:center;font-size:16px">Si te toca uno que ya tienes, gana una estrella (máx. ${MAX_STARS}★). Al máximo, te devuelve zenis.</p>
    <div class="row center"><button class="btn primary bi-open" ${save.zeni >= b.price ? '' : 'disabled'}>ABRIR · ${fmtNum(b.price)}</button></div></div>`;
  drawCapsule(ov.querySelector('.bi-head canvas'), b.col);
  const list = ov.querySelector('.bi-list');
  RAR_ORDER.forEach(r => {
    const cs = pool.filter(c => c.rar === r); if (!cs.length || !o[r]) return;
    const each = o[r] / cs.length;
    list.insertAdjacentHTML('beforeend', `<div class="bi-rh" style="--rc:${RAR[r].col}">${rarTag(r)}<span>${fmtPct(o[r])} en total · ${fmtPct(each)} cada uno</span></div>`);
    const grid = document.createElement('div'); grid.className = 'bi-grid';
    cs.forEach(c => {
      const st = starsOf(c.id), un = isUnlocked(c), it = document.createElement('div');
      it.className = 'bi-c' + (un ? ' own' : ''); it.style.setProperty('--rc', RAR[c.rar].col);
      const cv = document.createElement('canvas'); cv.width = 36; cv.height = 56; paintSprite(cv, c.id); it.appendChild(cv);
      it.insertAdjacentHTML('beforeend', `<div class="n">${c.name}</div><div class="p">${fmtPct(each)}</div><div class="st">${un ? (st >= MAX_STARS ? 'AL MÁXIMO' : '★'.repeat(st)) : 'NO LO TIENES'}</div>${SPECIALS[c.id] ? `<div class="sp">⚡ ${SPECIALS[c.id].name}</div>` : ''}`);
      it.title = `${c.name} · ${c.saga}`;
      grid.appendChild(it);
    });
    list.appendChild(grid);
  });
  ov.onclick = e => { if (e.target === ov) closeInspect(); };
  ov.querySelector('.bi-x').onclick = closeInspect;
  ov.querySelector('.bi-open').onclick = () => { closeInspect(); openBox(b, 'zeni'); };
  document.body.appendChild(ov);
  ov.querySelector('.bi-x').focus();
}
function fmtPct(v) { return (v >= 10 ? Math.round(v) : v >= 1 ? v.toFixed(1) : v.toFixed(2)).toString().replace('.', ',') + '%'; }
addEventListener('keydown', e => { if (e.code === 'Escape' && $('#boxInfo')) { e.stopPropagation(); closeInspect(); } }, true);

/* ---------- Easter egg: escribir W A S D en la tienda (una vez por partida) ---------- */
function shopEgg() {
  if (save.eggWasd) { toastShop('Ya encontraste este secreto. ¡Buen intento!'); sfx('click'); return; }
  save.zeni += 14000; save.eggWasd = 1; persist();
  sfx('trans'); setTimeout(() => sfx('ball'), 400);
  toastShop('¡SECRETO ENCONTRADO! +14.000 zenis');
  const box = document.createElement('div'); box.className = 'coinrain';
  for (let i = 0; i < 40; i++) { const c = document.createElement('i'); c.style.left = Math.random() * 100 + 'vw'; c.style.animationDelay = Math.random() * .9 + 's'; c.style.animationDuration = 1.4 + Math.random() * 1.2 + 's'; box.appendChild(c); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 3600);
  renderShop2(); renderTitle();
}

/* ---------- apertura estilo ruleta ---------- */
const CARD_W = 104;
function reelCard(c) {
  const d = document.createElement('div'); d.className = 'rc'; d.dataset.r = c.rar;
  d.appendChild(portraitCanvas(c.id)); d.insertAdjacentHTML('beforeend', `<span>${c.name}</span>`); return d;
}
/* ---------- «Kamehameha» al abrir cajas ----------
   Voz sintetizada del propio navegador (no son grabaciones del anime) + carga de energía y explosión hechas con Web Audio.
   Si el dispositivo tiene voz japonesa se usa esa; si no, castellano/catalán o inglés. */
const KMH = { ja: ['か', 'め', 'は', 'め', 'はーーーっ！'], es: ['ka', 'me', 'ja', 'me', '¡jaaaaaa!'], en: ['kah', 'meh', 'hah', 'meh', 'haaaaaa!'], cur: null, timers: [], nodes: null };
const canSpeak = () => 'speechSynthesis' in window && save.opts.voice && save.opts.sfx;
function pickVoice(pref) { try { const vs = speechSynthesis.getVoices(); for (const p of pref) { const v = vs.find(v => (v.lang || '').toLowerCase().startsWith(p)); if (v) return v; } } catch (e) { } return null; }
function say(text, o = {}) {
  if (!canSpeak()) return;
  try {
    const u = new SpeechSynthesisUtterance(text); u.lang = o.lang || 'es-ES';
    try { if (o.voice) { u.voice = o.voice; u.lang = o.voice.lang; } } catch (e) { }
    u.rate = o.rate || 1; u.pitch = o.pitch || 1; u.volume = 1; speechSynthesis.speak(u);
  } catch (e) { }
}
function unlockSpeech() { if (!canSpeak()) return; try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) { } }
function kmhCharge(ms) {
  kmhStop();
  const ja = pickVoice(['ja']), lang = ja ? 'ja' : LANG === 'en' ? 'en' : 'es', voice = ja || pickVoice(lang === 'en' ? ['en'] : LANG === 'ca' ? ['ca', 'es'] : ['es']);
  KMH.cur = { voice, lang: lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'es-ES', syl: KMH[lang] };
  const step = ms / 4.5;
  KMH.cur.syl.slice(0, 4).forEach((s, i) => KMH.timers.push(setTimeout(() => say(s, { voice, lang: KMH.cur.lang, rate: .85, pitch: .75 + i * .1 }), i * step)));
  // zumbido de energía que sube hasta el disparo
  const a = AU.ctx; if (!a || !save.opts.sfx) return;
  const t = a.currentTime, d = ms / 1000, o = a.createOscillator(), o2 = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain(), lfo = a.createOscillator(), lg = a.createGain();
  o.type = 'sawtooth'; o2.type = 'triangle'; o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(320, t + d); o2.frequency.setValueAtTime(140, t); o2.frequency.exponentialRampToValueAtTime(980, t + d);
  f.type = 'lowpass'; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(3200, t + d); f.Q.value = 6;
  g.gain.setValueAtTime(.001, t); g.gain.exponentialRampToValueAtTime(.16, t + d);
  lfo.frequency.setValueAtTime(6, t); lfo.frequency.linearRampToValueAtTime(26, t + d); lg.gain.value = .05;
  lfo.connect(lg); lg.connect(g.gain); o.connect(f); o2.connect(f); f.connect(g); g.connect(AU.master);
  [o, o2, lfo].forEach(n => { n.start(t); n.stop(t + d + 1.5); });
  KMH.nodes = { g, stop: [o, o2, lfo] };
}
function kmhRelease(rar) {
  KMH.timers.forEach(clearTimeout); KMH.timers = [];
  const c = KMH.cur || { lang: 'es-ES', syl: KMH.es };
  try { speechSynthesis.cancel(); } catch (e) { }
  say(c.syl[4], { voice: c.voice, lang: c.lang, rate: .8, pitch: 1.15 });
  const a = AU.ctx; if (!a || !save.opts.sfx) return;
  if (KMH.nodes) { const t = a.currentTime; KMH.nodes.g.gain.cancelScheduledValues(t); KMH.nodes.g.gain.setValueAtTime(.16, t); KMH.nodes.g.gain.exponentialRampToValueAtTime(.001, t + .25); KMH.nodes = null; }
  // ¡disparo! ruido + golpe grave + barrido brillante
  const big = rar === 'L' ? 1.6 : rar === 'E' ? 1.25 : 1;
  noise(.9 * big, .35, 180); tone(110, .7 * big, 'sine', .4, -80); tone(1400, .5, 'sawtooth', .08, -1100); tone(700, .6 * big, 'square', .05, -500, .05);
  if (rar === 'L') [784, 988, 1175, 1568, 1976].forEach((fq, i) => tone(fq, .18, 'triangle', .1, 0, .35 + i * .07));
}
function kmhStop() {
  KMH.timers.forEach(clearTimeout); KMH.timers = [];
  try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) { }
  if (KMH.nodes && AU.ctx) { const t = AU.ctx.currentTime; KMH.nodes.g.gain.cancelScheduledValues(t); KMH.nodes.g.gain.setValueAtTime(.001, t); KMH.nodes = null; }
}
// Al ver al guerrero, grita su técnica especial con la voz del idioma del juego
function shoutSpecial(c) {
  const sp = SPECIALS[c.id]; if (!sp) return;
  const v = pickVoice(LANG === 'en' ? ['en'] : LANG === 'ca' ? ['ca', 'es'] : ['es']);
  setTimeout(() => say(L(sp.name).replace(/^¡|!$/g, '') + '!', { voice: v, lang: LANG === 'en' ? 'en-US' : LANG === 'ca' ? 'ca-ES' : 'es-ES', rate: 1.05, pitch: 1.05 }), 650);
}
try { if ('speechSynthesis' in window) { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices(); } } catch (e) { }

function openBox(b, pay) {
  if (pay === 'ticket') { if (!(save.tickets[b.id] > 0)) return; save.tickets[b.id]--; }
  else if (pay === 'zeni') { if (save.zeni < b.price) return; save.zeni -= b.price; }
  unlockSpeech();
  const win = rollBox(b), res = grantChar(win); save.stats.boxes++; trackMis('boxes', 1); persist();
  state = 'gacha'; showScreen('reveal');
  $('#rvTitle').textContent = b.name.toUpperCase(); $('#rvBox').hidden = true; $('#rvSkip').hidden = false;
  const track = $('#rvTrack'), reel = $('#rvReel'); track.innerHTML = ''; track.style.transition = 'none'; track.style.transform = 'translateX(0)';
  const N = 56, WIN = 48, cards = [];
  for (let i = 0; i < N; i++) { const c = i === WIN ? win : rollBox(b); const el = reelCard(c); track.appendChild(el); cards.push(el); }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, dur = reduce ? 900 : 5600;
  const target = WIN * CARD_W - reel.clientWidth / 2 + CARD_W / 2 + rand(-CARD_W * .38, CARD_W * .38);
  let lastIdx = -1, done = false, raf = 0;
  const finish = () => {
    if (done) return; done = true; cancelAnimationFrame(raf);
    track.style.transition = 'none'; track.style.transform = `translateX(${-target}px)`;
    cards[WIN].classList.add('win'); clearTimeout(chargeT); kmhRelease(win.rar); $('#rvSkip').hidden = true;
    setTimeout(() => showResult(win, res, b, pay), 650);
  };
  const tick = () => {
    const m = getComputedStyle(track).transform, x = m && m !== 'none' ? -new DOMMatrixReadOnly(m).m41 : 0, idx = Math.floor((x + reel.clientWidth / 2) / CARD_W);
    if (idx !== lastIdx) { lastIdx = idx; if (AU.ctx && save.opts.sfx) tone(900 + (idx % 3) * 60, .03, 'square', .04); }
    if (!done) raf = requestAnimationFrame(tick);
  };
  requestAnimationFrame(() => requestAnimationFrame(() => {
    track.style.transition = `transform ${dur}ms cubic-bezier(.06,.72,.1,1)`; track.style.transform = `translateX(${-target}px)`; raf = requestAnimationFrame(tick);
  }));
  // la carga empieza cuando la ruleta frena: «ka… me… ha… me…» y el «¡HA!» al pararse
  const chargeMs = Math.min(2400, dur * .45), chargeT = setTimeout(() => { if (!done) kmhCharge(chargeMs); }, dur - chargeMs);
  track.ontransitionend = finish;
  $('#rvSkip').onclick = finish;
  setTimeout(finish, dur + 400);
}
function showResult(c, res, box, pay) {
  state = 'gacha'; showScreen('reveal'); $('#rvSkip').hidden = true;
  if (!box) { $('#rvTitle').textContent = 'COMPRA'; $('#rvTrack').innerHTML = ''; }
  if (box) shoutSpecial(c);
  const rb = $('#rvBox'); rb.hidden = false; rb.classList.remove('show'); void rb.offsetWidth; rb.classList.add('show'); rb.style.setProperty('--rc', RAR[c.rar].col);
  paintSprite($('#rvCv'), c.id);
  const msg = res.kind === 'new' ? `<div class="new">¡NUEVO GUERRERO!</div>` : res.kind === 'star' ? `<div class="gold" style="font-size:20px;margin-top:6px">Repetido: ${starTxt(res.stars)} (+poder)</div>` : `<div class="gold" style="font-size:20px;margin-top:6px">Ya está al máximo: +${fmtNum(res.z)} zenis</div>`;
  $('#rvText').innerHTML = `${rarTag(c.rar)}<div class="nm">${c.name}</div>${msg}`;
  const again = box && (pay === 'ticket' ? save.tickets[box.id] > 0 : pay === 'zeni' && save.zeni >= box.price);
  $('#rvBtns').innerHTML = `${again ? `<button class="btn primary" id="rvAgain">OTRA${pay === 'ticket' ? ' GRATIS' : ' · ' + fmtNum(box.price)}</button>` : ''}<button class="btn" id="rvPlay">JUGAR CON ${c.name.toUpperCase()}</button><button class="btn" id="rvBack">VOLVER A LA TIENDA</button>`;
  if (again) $('#rvAgain').onclick = () => openBox(box, pay);
  $('#rvPlay').onclick = () => { kmhStop(); selChar = c.id; save.lastChar = c.id; persist(); go('select'); };
  $('#rvBack').onclick = () => { kmhStop(); go('gacha'); };
}
if (state === 'title') renderTitle();
</script>
