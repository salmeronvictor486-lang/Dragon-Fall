<script>
/* =================== OBJETOS DEL MAPA (inspirado en Megabonk) ===================
   cajas y jarrones rompibles · comida que cura · fuentes curativas · altares de ki (se cargan y dan una bendición)
   cofres que se abren con los zenis de la partida (cada uno más caro) · estatuas de Babidi (maldición: más riesgo, más premio) */
const OBJ_COUNT = { crate: 14, shrine: 2, chest: 2, fountain: 1, statue: 1 };
const BOON_RAR = [
  { n: 'Común', col: '#b8c0dc', m: 1, w: 60 },
  { n: 'Raro', col: '#3aa0ff', m: 1.6, w: 27 },
  { n: 'Épico', col: '#b06bff', m: 2.4, w: 10 },
  { n: 'Legendario', col: '#ffd23f', m: 3.6, w: 3 },
];
const BOONS = [
  { k: 'might', n: 'Daño', v: .06, pct: 1, ic: 'fist', col: '#ff7a3a' },
  { k: 'maxHp', n: 'Vida máxima', v: 12, ic: 'heal', col: '#59d66b' },
  { k: 'spd', n: 'Velocidad', v: .05, pct: 1, ic: 'cloud', col: '#9fd8ff' },
  { k: 'cd', n: 'Recarga', v: .04, pct: 1, neg: 1, ic: 'clock', col: '#5fd0ff' },
  { k: 'area', n: 'Área', v: .06, pct: 1, ic: 'kiai', col: '#ffd23f' },
  { k: 'armor', n: 'Armadura', v: .7, ic: 'armor', col: '#b8c0dc' },
  { k: 'regen', n: 'Regeneración', v: .3, ic: 'zenkai', col: '#59d66b', per: '/s' },
  { k: 'magnet', n: 'Radio de recogida', v: .15, pct: 1, ic: 'radar', col: '#59d66b' },
  { k: 'crit', n: 'Crítico', v: .03, pct: 1, ic: 'scouter', col: '#ff5a3a' },
  { k: 'luck', n: 'Suerte', v: .08, pct: 1, ic: 'ball', col: '#ffb03a' },
  { k: 'growth', n: 'Experiencia', v: .06, pct: 1, ic: 'lvl', col: '#3aa0ff' },
  { k: 'greed', n: 'Zenis', v: .08, pct: 1, ic: 'zeni', col: '#ffd23f' },
];
function chestCost() { return Math.round((18 + G.stat.chests * 14) * (1 + G.si * .6) * Math.pow(1.12, G.stat.chests)); }
function placeObj(k, minD, maxD) {
  for (let tries = 0; tries < 8; tries++) {
    const a = Math.random() * TAU, d = rand(minD, maxD), x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
    if (G.objs.some(o => (o.x - x) ** 2 + (o.y - y) ** 2 < (k === 'crate' ? 26 : 70) ** 2)) continue;
    const o = { k, x, y, t: Math.random() * 9 };
    if (k === 'crate') o.v = Math.random() < .5 ? 0 : 1;
    if (k === 'fountain') { o.R = 22; o.water = 1; }
    if (k === 'shrine') { o.R = 24; o.ch = 0; }
    G.objs.push(o); return o;
  }
  return null;
}
function fillObjs(first) {
  const near = (o, R) => (o.x - P.x) ** 2 + (o.y - P.y) ** 2 < R * R;
  G.objs = G.objs.filter(o => !o.gone && near(o, 1100));
  for (const k in OBJ_COUNT) {
    if (k === 'statue' && G.t < 60) continue;
    const R = k === 'fountain' ? 900 : 700, have = G.objs.filter(o => o.k === k && !o.used && near(o, R)).length;
    for (let i = have; i < OBJ_COUNT[k]; i++) {
      if (k === 'statue' && Math.random() > .35) continue;
      placeObj(k, first ? (k === 'crate' ? 70 : 140) : 300, first ? 600 : 680);
    }
  }
}
function updateObjs(dt) {
  if ((G.objT -= dt) <= 0) { G.objT = 1.5; fillObjs(false); }
  for (const o of G.objs) {
    if (o.gone) continue;
    o.t += dt;
    const d2 = (o.x - P.x) ** 2 + (o.y - P.y) ** 2;
    if (o.k === 'crate') { if (d2 < 11 * 11) breakCrate(o); }
    else if (o.k === 'fountain') {
      if (o.water > 0 && d2 < o.R * o.R && P.hp < P.maxHp && P.hp > 0) {
        const h = Math.min(P.maxHp * .09 * dt, P.maxHp - P.hp, o.water * P.maxHp);
        P.hp += h; o.water -= h / P.maxHp; G.stat.healed += h;
        if (Math.random() < dt * 14) G.fx.push({ k: 'p', x: P.x + rand(-6, 6), y: P.y - rand(4, 20), vx: rand(-8, 8), vy: -rand(20, 40), life: .5, max: .5, col: Math.random() < .5 ? '#9fd8ff' : '#59d66b', s: 1 });
        if (o.water <= 0) { o.water = 0; floatText('LA FUENTE SE HA SECADO', '#9fd8ff'); }
      }
    } else if (o.k === 'shrine') {
      if (o.done) continue;
      if (d2 < o.R * o.R) { o.ch += dt / 4; if (Math.random() < dt * 10) burst(o.x + rand(-o.R, o.R) * .7, o.y + rand(-o.R, o.R) * .5, 1, '#b06bff', .5); }
      else o.ch = Math.max(0, o.ch - dt * .08);
      if (o.ch >= 1) { o.done = true; G.stat.shrines++; openShrine(); }
    } else if (o.k === 'chest') {
      o.cd = (o.cd || 0) - dt;
      if (d2 < 13 * 13 && o.cd <= 0) {
        const c = chestCost();
        if (G.zeni >= c) { G.zeni -= c; G.stat.chests++; o.gone = true; burst(o.x, o.y - 6, 22, '#ffd23f', 1.5); sfx('ball'); openCapsule(); }
        else { o.cd = 2.5; floatText(`NECESITAS ${c} ZENIS`, '#ff8a7a'); sfx('click'); }
      }
    } else if (o.k === 'statue') {
      if (!o.used && d2 < 13 * 13) {
        o.used = true; G.curse++;
        banner('¡MALDICIÓN DE BABIDI!', 'Más enemigos y más duros, pero más experiencia y zenis');
        G.fx.push({ k: 'ring', x: o.x, y: o.y - 12, r0: 6, r1: 90, life: .6, max: .6, col: '#b06bff' }); sfx('boss'); G.shake = .5; vibrate(50);
      }
    }
  }
}
function breakCrate(o) {
  if (o.gone) return;
  o.gone = true; G.stat.crates++;
  burst(o.x, o.y - 5, 10, o.v ? '#b0643a' : '#e8e2d0', 1.2); sfx('hit');
  const r = Math.random() / Math.max(.5, P.luck * .8 + .2);
  if (r < .3) dropPick('food', o.x, o.y);
  else if (r < .62) for (let i = 0; i < 3; i++) dropPick('zeni', o.x + rand(-6, 6), o.y + rand(-5, 5), Math.ceil(rand(1, 3) * (G.si + 1)));
  else if (r < .8) { dropGem(o.x - 3, o.y, 4); dropGem(o.x + 3, o.y, 4); }
  else if (r < .84) dropPick('senzu', o.x, o.y);
  else if (r < .87) dropPick('radar', o.x, o.y);
}
// Las cajas también se rompen con los ataques
function hitObjsCircle(x, y, R) { for (const o of G.objs) if (o.k === 'crate' && !o.gone && (o.x - x) ** 2 + (o.y - 5 - y) ** 2 < (R + 6) ** 2) breakCrate(o); }
function hitObjsSeg(x, y, ang, len, w) { const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len; for (const o of G.objs) if (o.k === 'crate' && !o.gone && segDist2(o.x, o.y - 5, x, y, x2, y2) < (w / 2 + 6) ** 2) breakCrate(o); }

/* ---------- altar de ki: elegir bendición ---------- */
function rollBoonRar() {
  const luck = Math.max(.5, P.luck), ws = BOON_RAR.map((r, i) => r.w * (i ? Math.pow(luck, 1 + i * .5) : 1));
  let q = Math.random() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < ws.length; i++) { q -= ws[i]; if (q <= 0) return i; }
  return 0;
}
function boonVal(b, ri) { const v = b.v * BOON_RAR[ri].m; return b.k === 'armor' ? Math.max(1, Math.round(v)) : b.k === 'maxHp' ? Math.round(v) : v; }
function boonTxt(b, v) { return (b.neg ? '-' : '+') + (b.pct ? Math.round(v * 100) + '%' : (Math.round(v * 10) / 10).toString().replace('.', ',')) + (b.per || ''); }
function openShrine() {
  state = 'shrine'; showScreen('shrine'); sfx('trans'); hitstop(.05);
  const pool = shuffle(BOONS.slice()).slice(0, 3);
  G.boonChoices = pool.map(b => ({ b, ri: rollBoonRar() }));
  const box = $('#shrineChoices'); box.innerHTML = '';
  G.boonChoices.forEach((c, i) => {
    const R = BOON_RAR[c.ri], v = boonVal(c.b, c.ri), el = document.createElement('button');
    el.className = 'choice boon'; el.style.setProperty('--rc', R.col);
    const ic = document.createElement('canvas'); ic.width = 40; ic.height = 40; const ix = ic.getContext('2d'); ix.imageSmoothingEnabled = false; ix.drawImage(makeIcon(c.b.ic, c.b.col), 2, 2, 36, 36);
    const hd = document.createElement('div'); hd.className = 'icrow'; hd.appendChild(ic);
    hd.insertAdjacentHTML('beforeend', `<div class="meta"><span class="rib" style="background:${R.col}">${R.n.toUpperCase()}</span><div class="cn">${c.b.n}</div></div><span class="kb">${i + 1}</span>`);
    el.appendChild(hd); el.insertAdjacentHTML('beforeend', `<div class="ds big">${boonTxt(c.b, v)}</div>`);
    el.onclick = () => pickBoon(i);
    box.appendChild(el);
  });
}
function pickBoon(i) {
  const c = G.boonChoices && G.boonChoices[i]; if (!c || state !== 'shrine') return;
  const v = boonVal(c.b, c.ri);
  P.boons[c.b.k] = (P.boons[c.b.k] || 0) + (c.b.neg ? v : v);
  G.boonChoices = null; recalc(); sfx('ball');
  floatText(`${L(c.b.n).toUpperCase()} ${boonTxt(c.b, v)}`, BOON_RAR[c.ri].col);
  resumeGame();
}

/* ---------- dibujo ---------- */
function drawObjsGround(t) {
  for (const o of G.objs) {
    if (o.gone || (o.k !== 'fountain' && o.k !== 'shrine')) continue;
    const x = Math.round(o.x - camX), y = Math.round(o.y - camY);
    if (x < -40 || y < -40 || x > VW + 40 || y > VH + 40) continue;
    if (o.k === 'fountain') {
      lx.fillStyle = '#4a4f68'; lx.beginPath(); lx.ellipse(x, y, o.R + 3, (o.R + 3) * .55, 0, 0, TAU); lx.fill();
      lx.fillStyle = '#8a8fa8'; lx.beginPath(); lx.ellipse(x, y - 1, o.R + 1, (o.R + 1) * .55, 0, 0, TAU); lx.fill();
      lx.fillStyle = o.water > 0 ? '#1e5aa8' : '#6a5a4a'; lx.beginPath(); lx.ellipse(x, y - 1, o.R - 2, (o.R - 2) * .55, 0, 0, TAU); lx.fill();
      if (o.water > 0) {
        lx.globalAlpha = .5 + o.water * .5; lx.fillStyle = '#3aa0ff'; lx.beginPath(); lx.ellipse(x, y - 1, (o.R - 3) * (.4 + o.water * .6), (o.R - 3) * .55 * (.4 + o.water * .6), 0, 0, TAU); lx.fill();
        lx.fillStyle = '#c8ecff'; for (let i = 0; i < 4; i++) { const a = t * 1.3 + i * 1.6; lx.fillRect(Math.round(x + Math.cos(a) * o.R * .5), Math.round(y - 1 + Math.sin(a * 1.3) * o.R * .25), 3, 1); }
        lx.globalAlpha = 1;
        // chorrito central
        lx.fillStyle = '#9fd8ff'; const h = 6 + Math.round(Math.sin(t * 6) * 1.5); lx.fillRect(x - 1, y - 1 - h, 2, h); lx.fillStyle = '#ffffff'; lx.fillRect(x, y - 1 - h, 1, 2);
      }
      // piedras del borde
      lx.fillStyle = '#5a5f78'; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; lx.fillRect(Math.round(x + Math.cos(a) * (o.R + 1) - 1), Math.round(y - 1 + Math.sin(a) * (o.R + 1) * .55 - 1), 3, 2); }
    } else {
      const col = o.done ? '#5a5f78' : '#b06bff', glow = o.done ? 0 : .18 + Math.sin(t * 3) * .06 + o.ch * .25;
      lx.globalAlpha = glow; lx.fillStyle = col; lx.beginPath(); lx.ellipse(x, y, o.R, o.R * .55, 0, 0, TAU); lx.fill(); lx.globalAlpha = 1;
      lx.strokeStyle = col; lx.lineWidth = 1; lx.beginPath(); lx.ellipse(x, y, o.R, o.R * .55, 0, 0, TAU); lx.stroke();
      if (!o.done && o.ch > 0) { lx.strokeStyle = '#ffd23f'; lx.lineWidth = 2; lx.beginPath(); lx.ellipse(x, y, o.R + 3, (o.R + 3) * .55, 0, -Math.PI / 2, -Math.PI / 2 + o.ch * TAU); lx.stroke(); }
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * TAU + Math.PI / 6, px = Math.round(x + Math.cos(a) * o.R), py = Math.round(y + Math.sin(a) * o.R * .55);
        lx.fillStyle = '#3a3f58'; lx.fillRect(px - 2, py - 9, 4, 9); lx.fillStyle = '#8a8fa8'; lx.fillRect(px - 2, py - 10, 4, 2);
        if (!o.done) { lx.fillStyle = i / 6 < o.ch ? '#ffd23f' : '#c89bff'; lx.fillRect(px - 1, py - 7, 2, 2); }
      }
      if (!o.done) { lx.globalAlpha = .7; lx.fillStyle = '#e6d6ff'; lx.fillRect(x - 1, y - 8 - Math.round(Math.sin(t * 2) * 2), 2, 6); lx.fillRect(x - 3, y - 6 - Math.round(Math.sin(t * 2) * 2), 6, 2); lx.globalAlpha = 1; }
    }
  }
}
function drawObj(o, t) {
  const x = Math.round(o.x - camX), y = Math.round(o.y - camY), R = (c, a, b, w, h) => { lx.fillStyle = c; lx.fillRect(x + a, y + b, w, h); };
  if (o.k === 'crate') {
    if (o.v === 0) { // caja Capsule Corp
      R('#2a2a38', -7, -11, 14, 11); R('#e8e2d0', -6, -10, 12, 9); R('#f6f2e6', -6, -10, 12, 2); R('#c8c0a8', -6, -3, 12, 2);
      R('#2b6fd6', -2, -7, 4, 3); R('#ffffff', -1, -6, 2, 1);
    } else { // jarrón
      R('#3a1e10', -5, -12, 10, 12); R('#b0643a', -4, -11, 8, 10); R('#d88a52', -3, -11, 2, 8); R('#7a3a1e', -4, -6, 8, 1);
      R('#3a1e10', -3, -14, 6, 3); R('#b0643a', -2, -13, 4, 2);
    }
  } else if (o.k === 'chest') {
    const can = G.zeni >= chestCost(), bob = can ? Math.round(Math.sin(t * 4)) : 0;
    if (can) { lx.globalAlpha = .25 + Math.sin(t * 4) * .1; circ(o.x, o.y - 6, 13, '#ffd23f'); lx.globalAlpha = 1; }
    R('#2a1608', -8, -12 + bob, 16, 12); R('#8a5a2a', -7, -11 + bob, 14, 10); R('#a8743a', -7, -11 + bob, 14, 3);
    R('#ffd23f', -7, -8 + bob, 14, 1); R('#ffd23f', -6, -11 + bob, 1, 10); R('#ffd23f', 5, -11 + bob, 1, 10);
    R('#ffd23f', -1, -9 + bob, 2, 3); R('#7a4a00', -1, -8 + bob, 2, 1);
  } else if (o.k === 'statue') {
    const used = o.used, c1 = used ? '#4a4a58' : '#4a2a6a', c2 = used ? '#6a6a78' : '#7a4ab0';
    if (!used) { lx.globalAlpha = .2 + Math.sin(t * 2.5) * .08; circ(o.x, o.y - 12, 14, '#b06bff'); lx.globalAlpha = 1; }
    R('#1a0f24', -7, -25, 14, 25); R(c1, -6, -24, 12, 23); R(c2, -6, -24, 3, 23); R('#2a2a38', -8, -2, 16, 3);
    // la «M» de Babidi
    const m = used ? '#3a3a48' : '#e8433a'; R(m, -4, -18, 1, 7); R(m, 3, -18, 1, 7); R(m, -3, -17, 1, 2); R(m, 2, -17, 1, 2); R(m, -2, -16, 1, 2); R(m, 1, -16, 1, 2); R(m, -1, -15, 2, 2);
    if (used) { R('#2a2a38', -2, -24, 1, 6); R('#2a2a38', -1, -19, 1, 4); }
  }
}
function drawObjLabels(fs) {
  // precio sobre los cofres cercanos
  for (const o of G.objs) {
    if (o.gone || o.k !== 'chest' || (o.x - P.x) ** 2 + (o.y - P.y) ** 2 > 160 * 160) continue;
    const [x, y] = toS(o.x, o.y - 18), c = chestCost();
    txt(fmtNum(c) + ' Z', x, y, fs, G.zeni >= c ? '#ffd23f' : '#ff8a7a', 'center');
  }
}
</script>
