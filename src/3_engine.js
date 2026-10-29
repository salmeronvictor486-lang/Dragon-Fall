<script>
// Ganchos de depuración/tests solo en local (file:// o localhost), nunca en la web publicada
const DEV = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
'use strict';
/* =================== SPRITES =================== */
const SW_ = 16, SH_ = 26, OUTLINE = '#0d0716';
const DEFC = { K: '#1a1024', W: '#ffffff', E: '#1a1024', M: '#8a2c35', S: SKIN, R: '#c0392b', Y: '#d8d8e0', X: '#cfcfd8', T: '#7a4a24', H: '#1d1b2e' };
function parseRows(rows) {
  return rows.map(r => {
    if (!r) return '.'.repeat(16);
    if (r.length === 8) return r + [...r].reverse().join('');
    return r.padEnd(16, '.').slice(0, 16);
  });
}
function colorOf(ch, pal) {
  if (pal[ch]) return pal[ch];
  if (ch === 'L') return shade(pal.H || DEFC.H, .35);
  const up = ch.toUpperCase();
  if (ch !== up) return shade(pal[up] || DEFC[up] || '#888888', -.28);
  return DEFC[ch] || '#ff00ff';
}
function walkRows(body) {
  const b = body.slice();
  for (let y = 8; y < 12; y++) {
    const r = b[y];
    b[y] = r.slice(1, 8) + '.' + '.' + r.slice(8, 15);
  }
  return b;
}
function buildGrid(def, frame) {
  const g = Array.from({ length: SH_ }, () => Array(SW_).fill(null));
  const put = (rows, oy) => parseRows(rows).forEach((r, y) => {
    const yy = y + oy; if (yy < 0 || yy >= SH_) return;
    for (let x = 0; x < 16; x++) { const ch = r[x]; if (ch === '.') continue; g[yy][x] = ch === '_' ? null : ch; }
  });
  let body = parseRows(BODY[def.body || 'gi']);
  if (frame === 1) body = walkRows(body);
  put(body, 14);
  put(FACES[def.face || 'base'], 0);
  if (def.eyes === 'angry') [5, 6, 9, 10].forEach(x => { if (g[8][x] === 'S') g[8][x] = 'K'; });
  if (def.eyes === 'smile') { [5, 6, 9, 10].forEach(x => { g[9][x] = 'S'; g[10][x] = 'K'; }); }
  if (def.hair) put(HAIR[def.hair], 0);
  if (def.x) put(def.x, 0);
  return g;
}
const NO_SHADE = new Set(['W', 'E', 'K', 'M', 'R']);
const shadeCache = new Map();
function shadeC(c, a) { const k = c + a; let v = shadeCache.get(k); if (v === undefined) { v = shade(c, a); shadeCache.set(k, v); } return v; }
function mixHex(a, b, t) { const A = hexRgb(a), B = hexRgb(b); return rgbHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
/* Pinta la rejilla con volumen: luz arriba-izquierda, sombra abajo-derecha y contorno tintado */
function gridToCanvas(g, pal) {
  const c = document.createElement('canvas'); c.width = SW_ + 2; c.height = SH_ + 2;
  const x = c.getContext('2d');
  const H = g.length, W = g[0].length;
  const filled = (yy, xx) => yy >= 0 && yy < H && xx >= 0 && xx < W && g[yy][xx];
  const base = (yy, xx) => colorOf(g[yy][xx], pal);
  for (let y = -1; y <= H; y++) for (let xx = -1; xx <= W; xx++) {
    if (filled(y, xx)) continue;
    const nb = filled(y - 1, xx) ? [y - 1, xx] : filled(y + 1, xx) ? [y + 1, xx] : filled(y, xx - 1) ? [y, xx - 1] : filled(y, xx + 1) ? [y, xx + 1] : null;
    if (!nb) continue;
    x.fillStyle = mixHex(OUTLINE, shadeC(base(nb[0], nb[1]), -.55), .35); x.fillRect(xx + 1, y + 1, 1, 1);
  }
  for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
    const ch = g[y][xx]; if (!ch) continue;
    let col = colorOf(ch, pal);
    if (!NO_SHADE.has(ch.toUpperCase())) {
      const up = !filled(y - 1, xx), lf = !filled(y, xx - 1), dn = !filled(y + 1, xx), rt = !filled(y, xx + 1);
      const chDn = filled(y + 1, xx) && g[y + 1][xx] !== ch;
      if (up && !dn) col = shadeC(col, .22);
      else if (lf && !rt) col = shadeC(col, .1);
      else if (dn || rt) col = shadeC(col, -.2);
      else if (chDn && 'HSGPXU'.includes(ch)) col = shadeC(col, -.1);
    }
    x.fillStyle = col; x.fillRect(xx + 1, y + 1, 1, 1);
  }
  return c;
}
/* Retrato (cabeza y hombros) para la interfaz */
const portraitCache = new Map();
function getPortrait(id) {
  let c = portraitCache.get(id); if (c) return c;
  const s = getSprite(id, 0, false); c = document.createElement('canvas'); c.width = 18; c.height = 19;
  c.getContext('2d').drawImage(s, 0, 0, 18, 19, 0, 0, 18, 19); portraitCache.set(id, c); return c;
}
const sprCache = new Map();
function getSprite(id, frame = 0, flip = false, variant = '') {
  const key = id + '|' + frame + '|' + (flip ? 1 : 0) + '|' + variant;
  let c = sprCache.get(key);
  if (c) return c;
  if (flip || variant) {
    const base = getSprite(id, frame, false, '');
    c = document.createElement('canvas'); c.width = base.width; c.height = base.height;
    const x = c.getContext('2d');
    if (flip) { x.translate(c.width, 0); x.scale(-1, 1); }
    x.drawImage(base, 0, 0);
    if (variant) { x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = variant === 'white' ? .5 : variant === 'black' ? 1 : .55; x.fillStyle = variant === 'black' ? '#000000' : variant === 'white' ? '#ffffff' : variant; x.fillRect(0, 0, c.width, c.height); }
  } else {
    const def = SPR[id] || SPR.goku;
    c = gridToCanvas(buildGrid(def, frame), def.pal || {});
  }
  sprCache.set(key, c);
  return c;
}
function sprScale(id) { return (SPR[id] && SPR[id].scale) || 1; }
/* Dibuja un sprite en un canvas de UI escalado */
function paintSprite(cv, id, opts = {}) {
  const s = getSprite(id, 0, !!opts.flip);
  const x = cv.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.clearRect(0, 0, cv.width, cv.height);
  const sc = Math.floor(Math.min(cv.width / s.width, cv.height / s.height));
  x.drawImage(s, Math.floor((cv.width - s.width * sc) / 2), Math.floor(cv.height - s.height * sc), s.width * sc, s.height * sc);
}

/* Iconos de ataques/pasivas (pixel 12x12) */
const iconCache = new Map();
function makeIcon(kind, col) {
  const key = kind + col; if (iconCache.has(key)) return iconCache.get(key);
  const c = document.createElement('canvas'); c.width = 12; c.height = 12; const x = c.getContext('2d');
  const lt = shade(col, .55), dk = shade(col, -.45);
  const px = (a, b, cc) => { x.fillStyle = cc; x.fillRect(a, b, 1, 1); };
  const rect = (a, b, w, h, cc) => { x.fillStyle = cc; x.fillRect(a, b, w, h); };
  const disk = (cx, cy, r, cc) => { for (let yy = 0; yy < 12; yy++) for (let xx = 0; xx < 12; xx++) if ((xx - cx) ** 2 + (yy - cy) ** 2 <= r * r) px(xx, yy, cc); };
  switch (kind) {
    case 'beam': rect(0, 4, 12, 4, col); rect(0, 5, 12, 2, lt); disk(2, 6, 3, col); disk(2, 6, 1.6, '#fff'); break;
    case 'ball': disk(6, 6, 4.5, dk); disk(6, 6, 3.6, col); disk(5, 5, 1.8, lt); px(4, 4, '#fff'); break;
    case 'big': disk(6, 6, 5.6, dk); disk(6, 6, 4.8, col); disk(5, 5, 2.8, lt); px(4, 3, '#fff'); px(3, 4, '#fff'); break;
    case 'bomb': disk(6, 6, 5, dk); disk(6, 6, 4, col); disk(6, 6, 2, '#fff'); break;
    case 'spiral': for (let i = 0; i < 12; i++) { px(i, 6, col); px(i, 6 + Math.round(Math.sin(i * 1.2) * 3), lt); } break;
    case 'disc': for (let yy = 4; yy < 8; yy++) for (let xx = 1; xx < 11; xx++) if (((xx - 5.5) / 5) ** 2 + ((yy - 5.5) / 2) ** 2 <= 1) px(xx, yy, col); rect(3, 5, 6, 1, lt); break;
    case 'tri': for (let yy = 1; yy < 11; yy++) { const w = Math.floor((yy - 1) * .6); rect(6 - w, yy, w * 2 + 1, 1, yy % 3 ? col : lt); } break;
    case 'flash': disk(6, 6, 2.5, '#fff'); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; px(Math.round(6 + Math.cos(a) * 5), Math.round(6 + Math.sin(a) * 5), col); px(Math.round(6 + Math.cos(a) * 4), Math.round(6 + Math.sin(a) * 4), lt); } break;
    case 'ring': for (let yy = 0; yy < 12; yy++) for (let xx = 0; xx < 12; xx++) { const d = Math.hypot(xx - 5.5, yy - 5.5); if (d > 3.6 && d < 5.6) px(xx, yy, d < 4.6 ? lt : col); } break;
    case 'orbit': disk(6, 6, 1.5, '#fff'); disk(2, 3, 1.6, col); disk(9, 9, 1.6, col); disk(10, 3, 1.2, lt); break;
    case 'fist': rect(3, 3, 6, 6, col); rect(3, 3, 6, 1, lt); rect(4, 9, 4, 2, dk); rect(2, 4, 1, 4, col); break;
    case 'laser': for (let i = 0; i < 12; i++) px(i, 11 - i, col); for (let i = 0; i < 11; i++) px(i + 1, 11 - i, lt); disk(10, 1, 1.4, '#fff'); break;
    case 'fire': disk(6, 7, 4, '#e8433a'); disk(6, 7, 3, col); disk(6, 8, 1.6, '#ffe14a'); px(6, 2, col); px(5, 3, col); px(7, 3, col); break;
    case 'grav': rect(2, 2, 8, 8, dk); rect(3, 3, 6, 6, col); rect(5, 4, 2, 4, '#fff'); rect(4, 4, 4, 1, '#fff'); break;
    case 'kaio': disk(6, 6, 5, '#e8433a'); disk(6, 6, 3, '#ff8a8a'); disk(6, 6, 1.5, '#fff'); break;
    case 'cloud': disk(4, 7, 3, col); disk(8, 7, 3, col); disk(6, 5, 3, lt); rect(1, 8, 10, 2, col); break;
    case 'radar': disk(6, 6, 5, '#2a3a2a'); disk(6, 6, 4.2, col); rect(1, 6, 10, 1, dk); rect(6, 1, 1, 10, dk); px(8, 4, '#ffd23f'); px(4, 8, '#ffd23f'); break;
    case 'armor': rect(1, 2, 10, 3, '#e6c046'); rect(3, 3, 6, 8, col); rect(3, 3, 6, 1, '#fff'); break;
    case 'weight': rect(2, 3, 8, 7, col); rect(2, 3, 8, 1, lt); rect(4, 1, 4, 2, dk); break;
    case 'scouter': rect(1, 4, 7, 5, col); rect(2, 5, 5, 3, lt); rect(8, 3, 3, 7, '#c9c9d4'); break;
    case 'multi': for (let i = 0; i < 3; i++) { rect(1 + i * 4, 3, 3, 3, col); rect(1 + i * 4, 7, 3, 3, dk); } break;
    case 'zenkai': rect(5, 1, 2, 10, col); rect(1, 5, 10, 2, col); disk(6, 6, 1.4, '#fff'); break;
    case 'kiai': for (let i = 0; i < 3; i++) { const r = 2 + i * 1.8; for (let a = 0; a < 16; a++) { const ang = a / 16 * TAU; px(Math.round(6 + Math.cos(ang) * r), Math.round(6 + Math.sin(ang) * r), i === 2 ? col : lt); } } break;
    case 'clock': disk(6, 6, 5, dk); disk(6, 6, 4, col); rect(6, 3, 1, 3, '#fff'); rect(6, 6, 3, 1, '#fff'); break;
    case 'hakai': disk(6, 6, 5, '#2a1040'); for (let a = 0; a < 20; a++) { const r = a / 20 * 5, an = a * .9; px(Math.round(6 + Math.cos(an) * r), Math.round(6 + Math.sin(an) * r), a % 2 ? col : lt); } px(6, 6, '#fff'); break;
    case 'blade': for (let i = 0; i < 9; i++) { px(2 + i, 9 - i, lt); px(3 + i, 9 - i, col); } rect(1, 9, 3, 2, '#c9c9d4'); px(2, 11, '#c9c9d4'); break;
    case 'wave': for (let i = 0; i < 3; i++) { const r = 1.5 + i * 2; for (let a = 0; a < 18; a++) { const an = a / 18 * TAU; px(Math.round(6 + Math.cos(an) * r), Math.round(6 + Math.sin(an) * r), i === 0 ? '#fff' : i === 1 ? lt : col); } } break;
    case 'book': rect(2, 2, 8, 9, '#7a2a1a'); rect(3, 2, 7, 8, col); rect(4, 3, 5, 1, lt); rect(4, 5, 4, 1, lt); rect(3, 10, 7, 1, '#f4f1e8'); break;
    case 'gear': disk(6, 6, 4.6, dk); disk(6, 6, 3.8, col); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; rect(Math.round(5.5 + Math.cos(a) * 5), Math.round(5.5 + Math.sin(a) * 5), 2, 2, col); } disk(6, 6, 1.6, '#0d0716'); break;
    case 'user': disk(6, 4, 2.6, col); disk(6, 4, 1.6, lt); rect(2, 8, 8, 3, col); rect(3, 8, 6, 1, lt); break;
    case 'temple': rect(1, 9, 10, 2, dk); rect(2, 4, 1, 5, col); rect(5, 4, 1, 5, col); rect(9, 4, 1, 5, col); rect(1, 2, 10, 2, lt); rect(3, 1, 6, 1, col); break;
    case 'skull': disk(6, 5, 4, '#e8e4f0'); rect(4, 8, 5, 3, '#e8e4f0'); rect(3, 4, 2, 2, '#0d0716'); rect(7, 4, 2, 2, '#0d0716'); rect(6, 7, 1, 1, '#0d0716'); rect(5, 10, 1, 1, '#0d0716'); rect(7, 10, 1, 1, '#0d0716'); break;
    case 'dball': disk(6, 6, 5.4, '#7a3a00'); disk(6, 6, 4.6, '#ff9a1c'); disk(5, 5, 2, '#ffcf6a'); px(5, 6, '#d8261a'); px(7, 5, '#d8261a'); px(7, 8, '#d8261a'); px(4, 8, '#d8261a'); break;
    case 'senzu': disk(5, 6, 3, '#59d66b'); disk(7, 6, 3, '#59d66b'); rect(4, 5, 4, 1, '#b4ffb4'); break;
    case 'zeni': disk(6, 6, 4.5, '#7a5200'); disk(6, 6, 3.6, '#ffd23f'); rect(5, 4, 2, 5, '#a87a00'); break;
    case 'cap': rect(2, 3, 8, 6, '#f4f4f4'); rect(2, 6, 8, 3, '#ff8a1c'); rect(5, 4, 2, 2, '#3aa0ff'); break;
    default: disk(6, 6, 4, col);
  }
  iconCache.set(key, c); return c;
}
function iconCanvas(kind, col, size = 40) {
  const c = document.createElement('canvas'); c.width = size; c.height = size;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(makeIcon(kind, col), 0, 0, size, size); return c;
}
/* ---------- Marcos pixel art de 9 piezas (UI) ---------- */
const FRAME_DEF = {
  panel: { rim: '#d89a3a', lt: '#ffd27a', dk: '#8a5418', fill: '#18204a', fillLt: '#232d62' },
  card: { rim: '#3a4a8a', lt: '#5a6cb8', dk: '#222c5a', fill: '#1d2552', fillLt: '#27316c' },
  cardsel: { rim: '#ff8a1c', lt: '#ffc27a', dk: '#a8500a', fill: '#3a2618', fillLt: '#4a3020' },
  rC: { rim: '#8a93b8', lt: '#c4cae0', dk: '#5a6384', fill: '#1d2552', fillLt: '#27316c' },
  rR: { rim: '#3aa0ff', lt: '#9ad0ff', dk: '#1e5aa8', fill: '#17264e', fillLt: '#1f3266' },
  rE: { rim: '#a46bff', lt: '#d0b0ff', dk: '#6a3ab8', fill: '#22194e', fillLt: '#2c2266' },
  rL: { rim: '#ffc83a', lt: '#fff0a0', dk: '#b8860b', fill: '#2e2416', fillLt: '#3c301c' },
  btn: { rim: '#5a6ab8', lt: '#8a9ae0', dk: '#2a346e', fill: '#2c3878', fillLt: '#3c4a96' },
  btnp: { rim: '#ffd08a', lt: '#fff0d0', dk: '#b8500a', fill: '#ff8a1c', fillLt: '#ffb04a', inner: '#7a2a00' },
  btng: { rim: '#fff0a0', lt: '#ffffff', dk: '#b8860b', fill: '#ffd23f', fillLt: '#fff09a', inner: '#7a5200' },
  btnw: { rim: '#ffffff', lt: '#ffffff', dk: '#a8a49a', fill: '#f2eee4', fillLt: '#ffffff', inner: '#5a5650' },
  btngr: { rim: '#a8f0b0', lt: '#e0ffe4', dk: '#2a8a3a', fill: '#59d66b', fillLt: '#8af09a', inner: '#0a4a1a' },
  evo: { rim: '#ffd23f', lt: '#fff0a0', dk: '#b8860b', fill: '#3a2600', fillLt: '#4e3404' },
  slot: { rim: '#2a3466', lt: '#3e4a8a', dk: '#141a3a', fill: '#0e1330', fillLt: '#141a40' },
  hp: { rim: '#d89a3a', lt: '#ffd27a', dk: '#8a5418', fill: '#2a0d16', fillLt: '#3a1420' },
};
const FRAMES = {};
function makeFrame(o) {
  const c = document.createElement('canvas'); c.width = 16; c.height = 16; const x = c.getContext('2d');
  const r = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  const out = '#0d0716', inn = o.inner || '#0d0716';
  r(1, 0, 14, 16, out); r(0, 1, 16, 14, out);
  r(2, 1, 12, 14, o.rim); r(1, 2, 14, 12, o.rim);
  r(2, 1, 12, 1, o.lt); r(1, 2, 1, 12, o.lt);
  r(2, 14, 12, 1, o.dk); r(14, 2, 1, 12, o.dk);
  r(3, 2, 10, 12, inn); r(2, 3, 12, 10, inn);
  if (o.grad) {   // botón con volumen: luz arriba, sombra abajo (o al revés si está pulsado)
    const top = o.down ? shade(o.fill, -.22) : shade(o.fillLt, .12), bot = o.down ? o.fillLt : shade(o.fill, -.28);
    for (let y = 3; y < 13; y++) { const t = (y - 3) / 9; r(3, y, 10, 1, mixHex(top, bot, t < .45 ? t * .6 : .27 + (t - .45) * 1.3)); }
    r(3, o.down ? 12 : 3, 10, 1, o.down ? shade(o.fill, .2) : shade(o.fillLt, .4));
    r(4, o.down ? 3 : 12, 8, 1, shade(o.fill, -.35));
  } else { r(3, 3, 10, 10, o.fill); r(3, 3, 10, 1, o.fillLt); r(3, 12, 10, 1, shade(o.fill, -.15)); }
  return c;
}
for (const k of Object.keys(FRAME_DEF)) if (k.startsWith('btn')) { FRAME_DEF[k].grad = true; FRAME_DEF[k + 'Dn'] = Object.assign({}, FRAME_DEF[k], { down: true }); }
for (const k in FRAME_DEF) { FRAMES[k] = makeFrame(FRAME_DEF[k]); document.documentElement.style.setProperty('--fr-' + k, `url(${FRAMES[k].toDataURL()})`); }
document.documentElement.classList.add('fr');
/* Dibuja un marco de 9 piezas en un canvas (s = escala de píxel) */
const frameCache = new Map();
function draw9(c, name, x, y, w, h, s = 2) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  const key = name + w + 'x' + h + '@' + s; let fc = frameCache.get(key);
  if (!fc) { fc = document.createElement('canvas'); fc.width = Math.max(1, w); fc.height = Math.max(1, h); draw9raw(fc.getContext('2d'), name, 0, 0, w, h, s); frameCache.set(key, fc); if (frameCache.size > 200) frameCache.delete(frameCache.keys().next().value); }
  c.drawImage(fc, x, y);
}
function draw9raw(c, name, x, y, w, h, s) {
  const f = FRAMES[name], k = 4, K = k * s;
  c.imageSmoothingEnabled = false;
  c.drawImage(f, 0, 0, k, k, x, y, K, K); c.drawImage(f, 16 - k, 0, k, k, x + w - K, y, K, K);
  c.drawImage(f, 0, 16 - k, k, k, x, y + h - K, K, K); c.drawImage(f, 16 - k, 16 - k, k, k, x + w - K, y + h - K, K, K);
  c.drawImage(f, k, 0, 16 - 2 * k, k, x + K, y, w - 2 * K, K); c.drawImage(f, k, 16 - k, 16 - 2 * k, k, x + K, y + h - K, w - 2 * K, K);
  c.drawImage(f, 0, k, k, 16 - 2 * k, x, y + K, K, h - 2 * K); c.drawImage(f, 16 - k, k, k, 16 - 2 * k, x + w - K, y + K, K, h - 2 * K);
  c.drawImage(f, k, k, 16 - 2 * k, 16 - 2 * k, x + K, y + K, w - 2 * K, h - 2 * K);
}
/* Bola de dragón (n estrellas) */
function drawDragonBall(x, cx, cy, r, stars) {
  x.fillStyle = '#7a3a00'; x.beginPath(); x.arc(cx, cy, r + 1, 0, TAU); x.fill();
  x.fillStyle = '#ff9a1c'; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
  x.fillStyle = '#ffcf6a'; x.beginPath(); x.arc(cx - r * .3, cy - r * .3, r * .45, 0, TAU); x.fill();
  x.fillStyle = '#d8261a';
  const pos = [[0, 0]];
  if (stars > 1) { pos.length = 0; for (let i = 0; i < stars; i++) { const a = i / stars * TAU - Math.PI / 2; pos.push([Math.cos(a) * r * .45, Math.sin(a) * r * .45]); } }
  const sr = Math.max(1, r * (stars > 1 ? .18 : .3));
  pos.forEach(([dx, dy]) => x.fillRect(Math.round(cx + dx - sr / 2), Math.round(cy + dy - sr / 2), Math.ceil(sr), Math.ceil(sr)));
}

/* =================== AUDIO =================== */
const AU = { ctx: null, last: {}, master: null };
function audioInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  try { AU.ctx = new (window.AudioContext || window.webkitAudioContext)(); AU.master = AU.ctx.createGain(); AU.master.gain.value = .35; AU.master.connect(AU.ctx.destination); } catch (e) { AU.ctx = null; }
}
function tone(f, d, type = 'square', v = .2, slide = 0, delay = 0) {
  const a = AU.ctx; if (!a) return;
  const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(g); g.connect(AU.master); o.start(t); o.stop(t + d + .02);
}
function noise(d, v = .2, hp = 400, delay = 0) {
  const a = AU.ctx; if (!a) return;
  const t = a.currentTime + delay, len = Math.floor(a.sampleRate * d), b = a.createBuffer(1, len, a.sampleRate), ch = b.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = b; f.type = 'highpass'; f.frequency.value = hp; g.gain.value = v;
  s.connect(f); f.connect(g); g.connect(AU.master); s.start(t);
}
function sfx(n) {
  if (!AU.ctx || !save.opts.sfx) return;
  const now = performance.now(), gap = { hit: 45, shot: 60, gem: 35, kill: 40 }[n] || 0;
  if (gap && now - (AU.last[n] || 0) < gap) return; AU.last[n] = now;
  switch (n) {
    case 'shot': tone(880, .06, 'square', .05, -400); break;
    case 'beam': tone(220, .4, 'sawtooth', .07, 400); noise(.35, .05, 1200); break;
    case 'hit': tone(200, .05, 'square', .04, -80); break;
    case 'kill': noise(.08, .06, 1500); break;
    case 'gem': tone(1200 + Math.random() * 300, .05, 'triangle', .06, 300); break;
    case 'lvl': [523, 659, 784, 1046].forEach((f, i) => tone(f, .12, 'square', .08, 0, i * .07)); break;
    case 'hurt': tone(160, .18, 'sawtooth', .12, -90); break;
    case 'boom': noise(.45, .18, 120); tone(90, .4, 'sine', .25, -50); break;
    case 'boss': [196, 185, 175, 165].forEach((f, i) => tone(f, .28, 'sawtooth', .1, 0, i * .22)); break;
    case 'trans': noise(1.1, .1, 300); [262, 330, 392, 523, 659, 784].forEach((f, i) => tone(f, .25, 'square', .07, 0, i * .09)); break;
    case 'pick': tone(660, .08, 'square', .08, 0); tone(990, .1, 'square', .08, 0, .07); break;
    case 'ball': [784, 988, 1175, 1568].forEach((f, i) => tone(f, .16, 'triangle', .1, 0, i * .08)); break;
    case 'heal': [440, 554, 659].forEach((f, i) => tone(f, .14, 'triangle', .1, 0, i * .06)); break;
    case 'click': tone(520, .04, 'square', .05); break;
    case 'win': [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone(f, .2, 'square', .09, 0, i * .12)); break;
    case 'lose': [392, 330, 262, 196].forEach((f, i) => tone(f, .3, 'triangle', .12, 0, i * .2)); break;
  }
}
/* Música chiptune original (bucle sencillo) */
const MUS = { on: false, step: 0, next: 0, timer: null };
const MUS_BASS = [45, 45, 57, 45, 43, 43, 55, 43, 41, 41, 53, 41, 43, 43, 55, 47];
const MUS_LEAD = [69, 0, 72, 74, 76, 0, 74, 72, 74, 0, 72, 69, 67, 0, 69, 0, 69, 0, 72, 74, 76, 0, 79, 76, 77, 0, 76, 74, 76, 0, 0, 0];
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function musicTick() {
  if (!AU.ctx || !MUS.on) return;
  const a = AU.ctx, spb = .15;
  while (MUS.next < a.currentTime + .25) {
    const s = MUS.step, t = MUS.next - a.currentTime;
    const b = MUS_BASS[Math.floor(s / 2) % 16];
    if (s % 2 === 0) tone(mtof(b), .14, 'triangle', .09, 0, Math.max(0, t));
    const ld = MUS_LEAD[s % 32]; if (ld && G && G.t > 0) tone(mtof(ld), .12, 'square', .025, 0, Math.max(0, t));
    if (s % 4 === 2) noise(.04, .03, 5000, Math.max(0, t));
    MUS.step++; MUS.next += spb;
  }
}
function musicSet(on) {
  MUS.on = on && save.opts.music;
  if (MUS.on && AU.ctx) { MUS.next = AU.ctx.currentTime + .05; if (!MUS.timer) MUS.timer = setInterval(musicTick, 80); }
  if (!MUS.on && MUS.timer) { clearInterval(MUS.timer); MUS.timer = null; }
}

/* =================== GUARDADO =================== */
const SAVE_KEY = 'dragonfall_save_v1';
let saveKey = SAVE_KEY;   // invitado; con cuenta: SAVE_KEY + '_' + uid
function defSave() { return { zeni: 0, shop: {}, cleared: {}, best: {}, bosses: {}, seen: {}, bought: {}, owned: {}, gifts: {}, tickets: { n: 0, g: 0 }, pid: '', streak: { last: '', n: 0 }, daily: { day: '', bought: {} }, kills: 0, maxTime: 0, runs: 0, ts: 0, opts: { sfx: true, music: true, names: false, shake: true, dmg: true } }; }
function normalizeSave(o) {
  const s = Object.assign(defSave(), o || {});
  s.opts = Object.assign(defSave().opts, (o && o.opts) || {});
  ['shop', 'cleared', 'best', 'bosses', 'seen', 'bought', 'owned', 'gifts'].forEach(k => { if (!s[k] || typeof s[k] !== 'object') s[k] = {}; });
  const tk = {}; for (const k in (s.tickets || {})) tk[k] = Math.max(0, Number(s.tickets[k]) || 0); s.tickets = Object.assign({ n: 0, g: 0 }, tk);
  if (!s.pid) s.pid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  if (!s.streak || typeof s.streak !== 'object') s.streak = { last: '', n: 0 };
  if (!s.daily || typeof s.daily !== 'object' || !s.daily.bought) s.daily = { day: '', bought: {} };
  ['zeni', 'kills', 'maxTime', 'runs', 'ts'].forEach(k => { s[k] = Number(s[k]) || 0; });
  return s;
}
function readSave(key) { try { const raw = localStorage.getItem(key); return raw ? normalizeSave(JSON.parse(raw)) : null; } catch (e) { return null; } }
function loadSave(key = saveKey) { return readSave(key) || normalizeSave(defSave()); }
function writeLocal() { try { localStorage.setItem(saveKey, JSON.stringify(save)); } catch (e) { } }
function persist() { save.ts = Date.now(); writeLocal(); if (ACCT) ACCT.queue(); }
let ACCT = null; // la cuenta se engancha al final (6_account)
let save = loadSave();
try { if (!localStorage.getItem(saveKey)) writeLocal(); } catch (e) { }
function isUnlocked(c) {
  if (save.owned[c.id]) return true;
  const u = c.unlock; if (!u) return true;
  if (u.gacha) return false;
  if (u.boss) return !!save.bosses[u.boss];
  if (u.clear) return !!save.cleared[u.clear];
  if (u.time) return save.maxTime >= u.time;
  if (u.cost) return !!save.bought[c.id];
  return false;
}
function starsOf(id) { const c = CHAR[id]; return save.owned[id] || (c && isUnlocked(c) ? 1 : 0); }
function stageUnlocked(i) { return i === 0 || !!save.cleared[STAGES[i - 1].id]; }

/* =================== INPUT =================== */
const keys = {};
const joy = { on: false, id: null, ox: 0, oy: 0, x: 0, y: 0 };
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) && state === 'play') e.preventDefault();
  onKey(e);
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; if (state === 'play') pauseGame(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') pauseGame(); });
function moveVec() {
  let x = 0, y = 0;
  if (keys.KeyA || keys.ArrowLeft) x -= 1; if (keys.KeyD || keys.ArrowRight) x += 1;
  if (keys.KeyW || keys.ArrowUp) y -= 1; if (keys.KeyS || keys.ArrowDown) y += 1;
  if (joy.on) { const dx = joy.x - joy.ox, dy = joy.y - joy.oy, d = Math.hypot(dx, dy); if (d > 6) { const m = Math.min(1, d / 48); x = dx / d * m; y = dy / d * m; } }
  const d = Math.hypot(x, y); if (d > 1) { x /= d; y /= d; }
  return [x, y];
}

/* =================== CANVAS =================== */
const cv = $('#game'), ctx = cv.getContext('2d');
const lc = document.createElement('canvas'), lx = lc.getContext('2d');
let SWd = 0, SHd = 0, DPR = 1, ZOOM = 2, VW = 320, VH = 180;
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1); SWd = innerWidth; SHd = innerHeight;
  cv.width = Math.floor(SWd * DPR); cv.height = Math.floor(SHd * DPR);
  const z = Math.min(Math.min(SWd, SHd) / 225, Math.max(SWd, SHd) / 400);
  ZOOM = z >= 2 ? Math.floor(z) : Math.max(1, Math.round(z * 2) / 2);
  VW = Math.ceil(SWd / ZOOM); VH = Math.ceil(SHd / ZOOM);
  lc.width = VW; lc.height = VH;
}
addEventListener('resize', resize); resize();
cv.addEventListener('pointerdown', e => {
  audioInit();
  if (state === 'play' && G && G.intro) G.intro.t = Math.min(G.intro.t, .15);
  if (state === 'play' && G && spBtn && (e.clientX - spBtn.x) ** 2 + (e.clientY - spBtn.y) ** 2 < spBtn.r ** 2) { useSpecial(); return; }
  if (state !== 'play' || e.pointerType === 'mouse') return;
  joy.on = true; joy.id = e.pointerId; joy.ox = joy.x = e.clientX; joy.oy = joy.y = e.clientY;
});
addEventListener('pointermove', e => { if (joy.on && e.pointerId === joy.id) { joy.x = e.clientX; joy.y = e.clientY; } });
const endJoy = e => { if (e.pointerId === joy.id) joy.on = false; };
addEventListener('pointerup', endJoy); addEventListener('pointercancel', endJoy);

</script>
