<script>
/* ---------- dibujo de la carta (canvas) ---------- */
const TC_W = 500, TC_H = 700;
function rr(x, X, Y, W, H, R) { x.beginPath(); x.moveTo(X + R, Y); x.arcTo(X + W, Y, X + W, Y + H, R); x.arcTo(X + W, Y + H, X, Y + H, R); x.arcTo(X, Y + H, X, Y, R); x.arcTo(X, Y, X + W, Y, R); x.closePath(); }
function wrapText(x, t, maxW) { const words = String(t).split(' '), lines = []; let cur = ''; for (const w of words) { const n = cur ? cur + ' ' + w : w; if (x.measureText(n).width > maxW && cur) { lines.push(cur); cur = w; } else cur = n; } if (cur) lines.push(cur); return lines; }
function rainbow(x, x0, y0, x1, y1, a = 1) { const g = x.createLinearGradient(x0, y0, x1, y1); ['#ff5a5a', '#ffb03a', '#fff27a', '#59d66b', '#5fd0ff', '#b06bff', '#ff8ac8'].forEach((c, i, A) => g.addColorStop(i / (A.length - 1), c)); x.globalAlpha = a; return g; }
const PS = '"Press Start 2P", monospace', VT = 'VT323, monospace';
// Ajusta el tamaño de la letra para que el texto quepa en el ancho dado
function fitFont(x, t, size, fam, maxW, min = 8) { let s = size; x.font = `${s}px ${fam}`; while (s > min && x.measureText(t).width > maxW) { s--; x.font = `${s}px ${fam}`; } return s; }
function drawCard(k, fin, sim, scale = 1) {
  const cv = document.createElement('canvas'); cv.width = Math.round(TC_W * scale); cv.height = Math.round(TC_H * scale);
  const x = cv.getContext('2d'); x.scale(scale, scale); x.imageSmoothingEnabled = false;
  const c = CHAR[k.base], T = CTYPES[cardType(c)], tc = T.col, rar = cardRar(k), sp = SPECIALS[k.base], w = WEAPONS[c.weapon];
  // marco
  rr(x, 0, 0, TC_W, TC_H, 28);
  if (fin === 'g') { const g = x.createLinearGradient(0, 0, TC_W, TC_H); g.addColorStop(0, '#fff2a8'); g.addColorStop(.3, '#ffd23f'); g.addColorStop(.55, '#b8860b'); g.addColorStop(.8, '#ffe27a'); g.addColorStop(1, '#a8740b'); x.fillStyle = g; }
  else if (fin === 'r') x.fillStyle = rainbow(x, 0, 0, TC_W, TC_H);
  else if (fin === 'h') { const g = x.createLinearGradient(0, 0, TC_W, TC_H); g.addColorStop(0, '#e6f6ff'); g.addColorStop(.5, '#9fb8d8'); g.addColorStop(1, '#e6ecff'); x.fillStyle = g; }
  else { const g = x.createLinearGradient(0, 0, 0, TC_H); g.addColorStop(0, shade(tc, .25)); g.addColorStop(1, shade(tc, -.35)); x.fillStyle = g; }
  x.fill(); x.globalAlpha = 1;
  rr(x, 14, 14, TC_W - 28, TC_H - 28, 18); x.fillStyle = '#10163a'; x.fill();
  rr(x, 14, 14, TC_W - 28, TC_H - 28, 18); x.lineWidth = 3; x.strokeStyle = shade(tc, -.2); x.stroke();
  // cabecera: nombre, PV y tipo
  x.textBaseline = 'middle'; x.textAlign = 'left';
  const nm = L(k.name); fitFont(x, nm, 21, PS, 270, 11);
  x.fillStyle = '#05060f'; x.fillText(nm, 34, 54); x.fillStyle = '#ffffff'; x.fillText(nm, 32, 52);
  const hp = Math.round(c.hp + (k.form ? 20 * (k.fi + 1) : 0) + (RAR[rar] ? RAR[rar].hp - 100 : 0));
  x.textAlign = 'right'; x.font = `24px ${PS}`; x.fillStyle = '#ffffff'; x.fillText(String(hp), 430, 54);
  const hw = x.measureText(String(hp)).width; x.font = `12px ${PS}`; x.fillStyle = '#ff9a8a'; x.fillText(L('PV'), 430 - hw - 8, 58);
  x.beginPath(); x.arc(455, 52, 17, 0, TAU); x.fillStyle = tc; x.fill(); x.lineWidth = 3; x.strokeStyle = '#05060f'; x.stroke();
  x.drawImage(makeIcon(sp ? 'kiai' : 'dball', '#ffffff'), 443, 40, 24, 24);
  // subtítulo
  x.textAlign = 'left'; x.font = `20px ${VT}`; x.fillStyle = k.form ? '#ffd23f' : '#9aa6d8';
  x.fillText(k.form ? `${L('TRANSFORMACIÓN')} · ${L('Nv')} ${k.form.lv} · ${L(c.name)}` : `${L('BÁSICO')} · ${L(T.n)}`, 34, 84);
  // ventana del dibujo
  const AX = 34, AY = 100, AW = TC_W - 68, AH = 300;
  x.save(); rr(x, AX, AY, AW, AH, 10); x.clip();
  const bg = x.createLinearGradient(0, AY, 0, AY + AH); bg.addColorStop(0, shade(tc, -.15)); bg.addColorStop(1, shade(tc, -.65)); x.fillStyle = bg; x.fillRect(AX, AY, AW, AH);
  // rayos de energía
  x.globalAlpha = .18; x.fillStyle = '#ffffff';
  for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; x.beginPath(); x.moveTo(TC_W / 2, AY + AH * .58); x.lineTo(TC_W / 2 + Math.cos(a) * 420, AY + AH * .58 + Math.sin(a) * 420); x.lineTo(TC_W / 2 + Math.cos(a + .09) * 420, AY + AH * .58 + Math.sin(a + .09) * 420); x.fill(); }
  x.globalAlpha = 1;
  if (fin === 'h' || fin === 'r') { // foil en el fondo
    x.globalCompositeOperation = 'overlay'; x.fillStyle = rainbow(x, AX, AY, AX + AW, AY + AH, fin === 'r' ? .8 : .55); x.fillRect(AX, AY, AW, AH);
    x.globalAlpha = .35; for (let i = -6; i < 14; i++) { x.fillStyle = i % 2 ? '#ffffff' : 'rgba(255,255,255,0)'; x.beginPath(); x.moveTo(AX + i * 40, AY); x.lineTo(AX + i * 40 + 18, AY); x.lineTo(AX + i * 40 + 18 - 160, AY + AH); x.lineTo(AX + i * 40 - 160, AY + AH); x.fill(); }
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  }
  if (fin === 'g') { x.globalAlpha = .9; for (let i = 0; i < 40; i++) { const sx = AX + (i * 97 % AW), sy = AY + (i * 53 % AH); x.fillStyle = i % 3 ? '#fff6b0' : '#ffd23f'; x.fillRect(sx, sy, 3, 3); x.fillRect(sx - 3, sy + 1, 9, 1); x.fillRect(sx + 1, sy - 3, 1, 9); } x.globalAlpha = 1; }
  // aura y pedestal
  const ag = x.createRadialGradient(TC_W / 2, AY + AH * .62, 10, TC_W / 2, AY + AH * .62, 190); ag.addColorStop(0, (sp ? sp.col : tc) + 'cc'); ag.addColorStop(1, (sp ? sp.col : tc) + '00'); x.fillStyle = ag; x.fillRect(AX, AY, AW, AH);
  x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(TC_W / 2, AY + AH - 26, 110, 18, 0, 0, TAU); x.fill();
  const s = getSprite(k.spr, 0, false), sc = Math.max(4, Math.floor(Math.min((AH - 40) / s.height, (AW - 40) / s.width)));
  x.imageSmoothingEnabled = false; x.drawImage(s, Math.round(TC_W / 2 - s.width * sc / 2), Math.round(AY + AH - 26 - s.height * sc), s.width * sc, s.height * sc);
  x.restore();
  rr(x, AX, AY, AW, AH, 10); x.lineWidth = 4; x.strokeStyle = fin === 'g' ? '#ffd23f' : fin === 'r' ? '#ffffff' : '#c8d0f0'; x.stroke();
  // franja de datos
  x.font = `18px ${VT}`; x.fillStyle = '#c8d0f0'; x.textAlign = 'center';
  x.fillText(`Nº ${String(k.no).padStart(3, '0')} · ${L(c.saga)}`, TC_W / 2, AY + AH + 16);
  // ataque 1 (técnica inicial)
  let y = AY + AH + 40;
  const dots = (n, X, Y) => { for (let i = 0; i < n; i++) { x.beginPath(); x.arc(X + i * 22, Y, 8, 0, TAU); x.fillStyle = tc; x.fill(); x.lineWidth = 2; x.strokeStyle = '#05060f'; x.stroke(); } };
  dots(Math.min(3, Math.max(1, Math.round(w.base.cd))), 44, y + 12);
  x.textAlign = 'left'; fitFont(x, L(w.name), 14, PS, 260, 9); x.fillStyle = '#ffffff'; x.fillText(L(w.name), 116, y + 12);
  x.textAlign = 'right'; x.font = `20px ${PS}`; x.fillText(String(Math.round(w.base.dmg * 10 * (k.form ? 1.5 + k.fi * .3 : 1))), 464, y + 12);
  x.textAlign = 'left'; x.font = `18px ${VT}`; x.fillStyle = '#9aa6d8'; { const ls = wrapText(x, L(w.desc), 410); x.fillText(ls[0] + (ls.length > 1 ? '…' : ''), 44, y + 36); }
  // ataque 2 (técnica especial)
  y += 66; x.fillStyle = 'rgba(255,255,255,.06)'; x.fillRect(32, y - 6, TC_W - 64, 92);
  if (sp) {
    dots(3, 44, y + 12); fitFont(x, '⚡ ' + L(sp.name), 13, PS, 340, 8); x.fillStyle = sp.col; x.fillText('⚡ ' + L(sp.name), 116, y + 12);
    x.font = `18px ${VT}`; x.fillStyle = '#dfe4ff'; wrapText(x, L(sp.desc), 420).slice(0, 2).forEach((l, i) => x.fillText(l, 44, y + 38 + i * 19));
    x.textAlign = 'right'; x.font = `16px ${VT}`; x.fillStyle = '#9aa6d8'; x.fillText(`${L('recarga')} ${sp.cd} s`, 464, y + 76); x.textAlign = 'left';
  }
  // descripción
  y += 98; x.font = `italic 17px ${VT}`; x.fillStyle = '#9aa6d8';
  wrapText(x, L(c.desc), 430).slice(0, 2).forEach((l, i) => x.fillText(l, 36, y + i * 18));
  // pie: colección, rareza, número, propietario
  const fy = TC_H - 46;
  x.font = `9px ${PS}`; x.fillStyle = '#c8d0f0'; x.textAlign = 'left'; x.fillText('DRAGON FALL · ' + L('COLECCIÓN') + ' 1', 32, fy);
  x.textAlign = 'center'; x.font = `18px ${PS}`; x.fillStyle = RAR[rar].col; x.fillText({ C: '●', R: '◆', E: '★', L: '★★' }[rar], TC_W / 2 + 40, fy);
  x.textAlign = 'right'; x.font = `9px ${PS}`; x.fillStyle = '#c8d0f0'; x.fillText(`${String(k.no).padStart(3, '0')}/${String(CARD_SET.length).padStart(3, '0')}`, TC_W - 32, fy);
  x.font = `15px ${VT}`; x.fillStyle = FINISH[fin].col; x.textAlign = 'left';
  const owner = sim ? L('Carta de prueba') : (ACCT && ACCT.user ? ACCT.user.name : L('Invitado'));
  x.fillText(`${L(FINISH[fin].name).toUpperCase()} · ${owner} · ${L('Serie')} ${cardSerial(k, fin)}`, 32, fy + 16);
  // capa de foil general en Arcoíris
  if (fin === 'r') { x.save(); rr(x, 0, 0, TC_W, TC_H, 28); x.clip(); x.globalCompositeOperation = 'overlay'; x.fillStyle = rainbow(x, 0, TC_H, TC_W, 0, .35); x.fillRect(0, 0, TC_W, TC_H); x.restore(); x.globalAlpha = 1; }
  // marca del simulador
  if (sim) {
    x.save(); x.translate(TC_W / 2, TC_H / 2); x.rotate(-.5); x.textAlign = 'center'; x.font = `26px ${PS}`;
    x.globalAlpha = .28; x.fillStyle = '#ffffff'; x.fillText(L('SIMULADOR'), 0, -10); x.font = `14px ${PS}`; x.fillText(L('NO OFICIAL'), 0, 26); x.restore(); x.globalAlpha = 1;
  }
  return cv;
}
function drawCardBack(sim, scale = 1) {
  const cv = document.createElement('canvas'); cv.width = Math.round(TC_W * scale); cv.height = Math.round(TC_H * scale);
  const x = cv.getContext('2d'); x.scale(scale, scale); x.imageSmoothingEnabled = false;
  rr(x, 0, 0, TC_W, TC_H, 28); const g = x.createLinearGradient(0, 0, TC_W, TC_H); g.addColorStop(0, '#2a1a5e'); g.addColorStop(.5, '#1a2150'); g.addColorStop(1, '#3a1430'); x.fillStyle = g; x.fill();
  rr(x, 18, 18, TC_W - 36, TC_H - 36, 18); x.lineWidth = 6; x.strokeStyle = '#ff8a1c'; x.stroke();
  x.globalAlpha = .12; x.fillStyle = '#ffd23f'; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; x.beginPath(); x.moveTo(TC_W / 2, TC_H / 2); x.lineTo(TC_W / 2 + Math.cos(a) * 600, TC_H / 2 + Math.sin(a) * 600); x.lineTo(TC_W / 2 + Math.cos(a + .1) * 600, TC_H / 2 + Math.sin(a + .1) * 600); x.fill(); } x.globalAlpha = 1;
  const b = document.createElement('canvas'); b.width = b.height = 26; const bx = b.getContext('2d'); bx.imageSmoothingEnabled = false; drawDragonBall(bx, 13, 13, 11, 4);
  x.drawImage(b, TC_W / 2 - 104, TC_H / 2 - 150, 208, 208);
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `34px ${PS}`; x.fillStyle = '#05060f'; x.fillText('DRAGON', TC_W / 2 + 3, TC_H / 2 + 103); x.fillText('FALL', TC_W / 2 + 3, TC_H / 2 + 153);
  x.fillStyle = '#ffd23f'; x.fillText('DRAGON', TC_W / 2, TC_H / 2 + 100); x.fillStyle = '#ff8a1c'; x.fillText('FALL', TC_W / 2, TC_H / 2 + 150);
  if (sim) { x.font = `14px ${PS}`; x.fillStyle = '#9fd8ff'; x.fillText(L('SIMULADOR'), TC_W / 2, TC_H - 60); }
  return cv;
}
const cardImgCache = new Map();
function cardURL(k, fin, sim, small) {
  const key = k.id + fin + (sim ? 's' : '') + (small ? 't' : '') + LANG;
  let u = cardImgCache.get(key); if (u) return u;
  u = drawCard(k, fin, sim, small ? .5 : 1).toDataURL('image/png'); cardImgCache.set(key, u); return u;
}

/* ---------- pantalla CARTAS: álbum, sobres y simulador ---------- */
const CARD_PACKS = [
  { id: 'basic', name: 'Sobre Básico', desc: '3 cartas brillantes de tus guerreros', price: 300, n: 3, odds: { h: 80, g: 17, r: 3 }, col: '#3aa0ff' },
  { id: 'shiny', name: 'Sobre Brillante', desc: '4 cartas, al menos 1 de Oro', price: 900, n: 4, odds: { h: 55, g: 35, r: 10 }, min: 'g', col: '#b06bff' },
  { id: 'legend', name: 'Sobre Leyenda', desc: '3 cartas, al menos 1 Arcoíris', price: 2500, n: 3, odds: { g: 70, r: 30 }, min: 'r', col: '#ffd23f' },
];
const SIM_PACK = { id: 'sim', name: 'Sobre de prueba', desc: '5 cartas de cualquier guerrero. Gratis', price: 0, n: 5, odds: { n: 55, h: 28, g: 12, r: 5 }, col: '#59d66b' };
let cardTab = 'album', cardFilter = 'all';
function cardStats(sim) {
  const own = CARD_SET.filter(k => sim ? cardBest(k, true) : cardOwned(k)).length;
  const shiny = CARD_SET.filter(k => ['h', 'g', 'r'].some(f => cardHas(k, f, sim))).length;
  return { own, shiny };
}
function renderCards() {
  $('#zCards').innerHTML = `<i></i>${fmtNum(save.zeni)}`;
  const tabs = $('#cardTabs'); tabs.innerHTML = '';
  [['album', 'ÁLBUM'], ['shop', 'SOBRES'], ['sim', 'SIMULADOR']].forEach(([k, n]) => { const b = document.createElement('button'); b.className = 'btn small' + (cardTab === k ? ' on' : ''); b.textContent = n; b.onclick = () => { cardTab = k; sfx('click'); renderCards(); }; tabs.appendChild(b); });
  const body = $('#cardBody'); body.innerHTML = '';
  if (cardTab === 'album' || cardTab === 'simbook') {
    const sim = cardTab === 'simbook', st = cardStats(sim), sec = document.createElement('div'); sec.className = 'panel shopsec';
    sec.innerHTML = `<div class="sechd"><b class="px gold">${sim ? 'CARPETA DEL SIMULADOR' : 'MI ÁLBUM'}</b><span class="muted">${sim ? 'Cartas de prueba, no oficiales' : 'Cartas'} ${st.own}/${CARD_SET.length} · ${'brillantes'} ${st.shiny}</span></div>
      <div class="row wrap" style="gap:8px">${[['all', 'TODAS'], ['own', 'TENGO'], ['no', 'ME FALTAN']].map(([k, n]) => `<button class="btn small ${cardFilter === k ? 'on' : ''}" data-f="${k}">${n}</button>`).join('')}${sim ? '<button class="btn small" id="cbBack">◀ SIMULADOR</button>' : ''}</div>
      <div class="cgrid"></div>`;
    sec.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { cardFilter = b.dataset.f; sfx('click'); renderCards(); });
    if (sim) sec.querySelector('#cbBack').onclick = () => { cardTab = 'sim'; renderCards(); };
    body.appendChild(sec);
    const grid = sec.querySelector('.cgrid'), list = CARD_SET.filter(k => { const h = sim ? !!cardBest(k, true) : cardOwned(k); return cardFilter === 'all' || (cardFilter === 'own' ? h : !h); });
    const queue = [];
    list.forEach(k => {
      const best = cardBest(k, sim), el = document.createElement('button'); el.className = 'cthumb' + (best ? ' have fin-' + best : ' miss');
      if (best) {
        const im = document.createElement('img'); im.alt = L(k.name); im.width = 250; im.height = 350; el.appendChild(im); queue.push([im, k, best]);
        const cnt = FIN_ORDER.filter(f => cardHas(k, f, sim)).length; if (cnt > 1) el.insertAdjacentHTML('beforeend', `<span class="cfins">${FIN_ORDER.filter(f => cardHas(k, f, sim)).map(f => `<i style="background:${FINISH[f].col}"></i>`).join('')}</span>`);
        el.onclick = () => openCardViewer(k, best, sim);
      } else {
        el.innerHTML = `<div class="cback"><span class="cno">${String(k.no).padStart(3, '0')}</span><canvas width="36" height="56"></canvas><b>${k.name}</b><small>${sim ? 'Ábrelo en el simulador' : cardHint(k)}</small></div>`;
        const cv2 = el.querySelector('canvas'); paintSprite(cv2, k.spr); cv2.style.filter = 'brightness(0) opacity(.45)';
      }
      grid.appendChild(el);
    });
    // las miniaturas se dibujan poco a poco para no congelar la pantalla
    const step = () => { for (let i = 0; i < 6 && queue.length; i++) { const [im, k, f] = queue.shift(); im.src = cardURL(k, f, sim, true); } if (queue.length && (state === 'cards')) requestAnimationFrame(step); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => requestAnimationFrame(step)); else requestAnimationFrame(step);
  } else if (cardTab === 'shop') {
    const sec = document.createElement('div'); sec.className = 'panel shopsec';
    sec.innerHTML = `<div class="sechd"><b class="px gold">TIENDA DE SOBRES</b><span class="muted">Te tocan versiones brillantes de las cartas de tus guerreros</span></div><div class="packs"></div>
      <p class="muted" style="font-size:16px;margin:0">La versión Normal de cada carta ya la tienes al conseguir al guerrero. Los sobres dan versiones Holo, Oro y Arcoíris. Las transformaciones entran cuando las consigues en una partida.</p>`;
    CARD_PACKS.forEach(p => sec.querySelector('.packs').appendChild(packCard(p, false)));
    body.appendChild(sec);
  } else {
    const st = cardStats(true), sec = document.createElement('div'); sec.className = 'panel shopsec sim';
    sec.innerHTML = `<div class="sechd"><b class="px" style="color:#59d66b">SIMULADOR DE SOBRES</b><span class="muted">Gratis e ilimitado · cartas de prueba</span></div>
      <p class="muted" style="font-size:18px;margin:0">Abre todos los sobres que quieras sin pagar nada. Pueden salir <b class="gold">todos</b> los guerreros y transformaciones, aunque no los tengas. Las cartas del simulador se guardan en su propia carpeta, llevan la marca «SIMULADOR · NO OFICIAL» y no cuentan para tu álbum.</p>
      <div class="packs"></div>
      <div class="row wrap center" style="gap:10px"><button class="btn" id="simBook">📁 CARPETA DEL SIMULADOR (${st.own}/${CARD_SET.length})</button><button class="btn small" id="simReset">VACIAR CARPETA</button></div>`;
    sec.querySelector('.packs').appendChild(packCard(SIM_PACK, true));
    sec.querySelector('#simBook').onclick = () => { cardTab = 'simbook'; cardFilter = 'all'; renderCards(); };
    sec.querySelector('#simReset').onclick = async () => { if (await ask('¿Vaciar la carpeta del simulador? Tu álbum oficial no se toca.', 'VACIAR')) { save.sim = {}; persist(); renderCards(); } };
    body.appendChild(sec);
  }
}
function packArt(p) { return `<div class="pack" style="--pc:${p.col}"><span class="pk-top"></span><b>DRAGON FALL</b><i></i><span class="pk-name">${p.name}</span></div>`; }
function packCard(p, sim) {
  const el = document.createElement('div'); el.className = 'packc';
  const pool = cardPool(sim), can = sim || save.zeni >= p.price;
  el.innerHTML = `${packArt(p)}<div class="oname">${p.name}</div><div class="osub">${p.desc}</div>
    <button class="btn ${sim ? 'primary' : 'gold'}" ${can && pool.length ? '' : 'disabled'}>${sim ? 'ABRIR GRATIS' : 'ABRIR · ' + fmtNum(p.price)}</button>`;
  el.querySelector('button').onclick = () => buyPack(p, sim);
  return el;
}
function cardPool(sim) { return sim ? CARD_SET : CARD_SET.filter(cardOwned); }
function rollFinish(odds) { let q = Math.random() * 100; for (const f of ['r', 'g', 'h', 'n']) { q -= odds[f] || 0; if (q <= 0) return f; } return 'n'; }
function buyPack(p, sim) {
  const pool = cardPool(sim); if (!pool.length) return;
  if (!sim) { if (save.zeni < p.price) return; save.zeni -= p.price; }
  unlockSpeech && unlockSpeech();
  const got = [];
  for (let i = 0; i < p.n; i++) got.push({ k: pick(pool), f: rollFinish(p.odds) });
  if (p.min) { const rank = f => FIN_ORDER.length - FIN_ORDER.indexOf(f); if (!got.some(g => rank(g.f) >= rank(p.min))) got[got.length - 1].f = p.min; }
  // guardar (y marcar las nuevas)
  for (const g of got) {
    const box = sim ? save.sim : save.cards, cur = box[g.k.id] || (box[g.k.id] = {});
    g.isNew = !cardHas(g.k, g.f, sim);
    cur[g.f] = (cur[g.f] || 0) + 1;
  }
  if (!sim) { save.stats.packs = (save.stats.packs || 0) + 1; trackMis('packs', 1); }
  persist();
  openPack(p, got, sim);
}
/* ---------- abrir sobre: el sobre se rasga y las cartas se giran ---------- */
function openPack(p, got, sim) {
  const ov = document.createElement('div'); ov.className = 'packopen'; ov.id = 'packOpen';
  ov.innerHTML = `<div class="po-stage">${packArt(p)}<p class="muted po-hint">Toca el sobre para abrirlo</p></div>`;
  document.body.appendChild(ov); sfx('click');
  const pk = ov.querySelector('.pack');
  pk.onclick = () => {
    pk.classList.add('rip'); sfx('boom'); vibrate && vibrate(30);
    setTimeout(() => {
      const st = ov.querySelector('.po-stage'); st.innerHTML = `<div class="po-cards"></div><div class="row wrap center po-btns"><button class="btn small" id="poAll">REVELAR TODAS</button><button class="btn primary" id="poOk" hidden>${sim ? 'OTRO SOBRE GRATIS' : 'GUARDAR EN EL ÁLBUM'}</button><button class="btn small" id="poClose" hidden>CERRAR</button></div>`;
      const wrap = st.querySelector('.po-cards'); let left = got.length;
      got.forEach((g, i) => {
        const c = document.createElement('button'); c.className = 'pocard fin-' + g.f; c.style.animationDelay = (i * .08) + 's';
        c.innerHTML = `<span class="pc-in"><img class="pc-back" alt=""><img class="pc-front" alt="${L(g.k.name)}"><span class="pc-shine"></span></span>${g.isNew ? '<span class="pc-new">¡NUEVA!</span>' : ''}<span class="pc-fin" style="color:${FINISH[g.f].col}">${FINISH[g.f].name}</span>`;
        c.querySelector('.pc-back').src = drawCardBack(sim, .5).toDataURL();
        c.querySelector('.pc-front').src = cardURL(g.k, g.f, sim, true);
        c.onclick = () => {
          if (c.classList.contains('flip')) { openCardViewer(g.k, g.f, sim); return; }
          c.classList.add('flip'); left--;
          if (g.f === 'r' || g.f === 'g') { sfx('trans'); if (typeof kmhRelease === 'function' && g.f === 'r') kmhRelease('L'); } else if (g.f === 'h') sfx('ball'); else sfx('pick');
          if (!left) { st.querySelector('#poAll').hidden = true; st.querySelector('#poOk').hidden = false; st.querySelector('#poClose').hidden = !sim; }
        };
        wrap.appendChild(c);
      });
      st.querySelector('#poAll').onclick = () => wrap.querySelectorAll('.pocard:not(.flip)').forEach((c, i) => setTimeout(() => c.click(), i * 180));
      st.querySelector('#poOk').onclick = () => { ov.remove(); if (sim) buyPack(p, true); else renderCards(); };
      st.querySelector('#poClose').onclick = () => { ov.remove(); renderCards(); };
    }, 520);
  };
}
/* ---------- visor: carta grande animada, brillo que sigue al ratón, descarga ---------- */
function openCardViewer(k, fin, sim) {
  const prev = $('#cardView'); if (prev) prev.remove();
  const ov = document.createElement('div'); ov.className = 'cview'; ov.id = 'cardView';
  const fins = FIN_ORDER.filter(f => cardHas(k, f, sim)).reverse();
  ov.innerHTML = `<div class="cv-wrap">
      <div class="tcard fin-${fin} idle"><img alt="${L(k.name)}"><span class="tc-shine"></span><span class="tc-glare"></span></div>
      <div class="cv-side">
        <b class="px gold">${k.name}</b>
        <div class="muted">${sim ? 'Carta de prueba del simulador (no oficial)' : 'Carta de tu colección'} · Nº ${String(k.no).padStart(3, '0')}</div>
        <div class="row wrap" style="gap:6px">${fins.map(f => `<button class="btn small ${f === fin ? 'on' : ''}" data-fin="${f}">${FINISH[f].name}</button>`).join('')}</div>
        <button class="btn primary" id="cvDl">⬇ DESCARGAR IMAGEN</button>
        <button class="btn small" id="cvX">CERRAR</button>
        <p class="muted" style="font-size:15px;margin:0">Mueve el ratón o el dedo por la carta para ver el brillo.</p>
      </div></div>`;
  document.body.appendChild(ov);
  const tc = ov.querySelector('.tcard'), img = tc.querySelector('img');
  const show = f => { fin = f; tc.className = 'tcard fin-' + f + ' idle'; img.src = cardURL(k, f, sim, false); ov.querySelectorAll('[data-fin]').forEach(b => b.classList.toggle('on', b.dataset.fin === f)); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => show(fin)); else show(fin);
  ov.querySelectorAll('[data-fin]').forEach(b => b.onclick = () => { sfx('click'); show(b.dataset.fin); });
  const move = e => {
    const r = tc.getBoundingClientRect(), px = clamp((e.clientX - r.left) / r.width, 0, 1), py = clamp((e.clientY - r.top) / r.height, 0, 1);
    tc.classList.remove('idle');
    tc.style.setProperty('--mx', (px * 100) + '%'); tc.style.setProperty('--my', (py * 100) + '%');
    tc.style.setProperty('--rx', ((.5 - py) * 22) + 'deg'); tc.style.setProperty('--ry', ((px - .5) * 26) + 'deg'); tc.style.setProperty('--bp', (px * 100) + '% ' + (py * 100) + '%');
  };
  tc.addEventListener('pointermove', move); tc.addEventListener('pointerdown', move);
  tc.addEventListener('pointerleave', () => { tc.classList.add('idle'); tc.style.removeProperty('--rx'); tc.style.removeProperty('--ry'); });
  ov.querySelector('#cvDl').onclick = () => downloadCard(k, fin, sim);
  ov.querySelector('#cvX').onclick = () => ov.remove();
  ov.onclick = e => { if (e.target === ov) ov.remove(); };
  sfx('ball');
}
function downloadCard(k, fin, sim) {
  const cv = drawCard(k, fin, sim, 2);
  const name = `dragon-fall-${k.id}-${FINISH[fin].name.toLowerCase().replace(/[^a-z]/g, '')}${sim ? '-simulador' : ''}.png`;
  cv.toBlob(b => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); sfx('pick'); }, 'image/png');
}
addEventListener('keydown', e => { if (e.code === 'Escape') { const v = $('#cardView'); if (v) { v.remove(); e.stopPropagation(); } } }, true);
</script>
