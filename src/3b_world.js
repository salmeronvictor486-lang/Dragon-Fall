<script>
'use strict';
/* =========================================================
   MUNDO: suelo con ruido + dithering, detalles y decorados
   ========================================================= */
const CH = 128, chunkCache = new Map(), propCache = new Map();
function hash(a, b, s = 0) { let h = (a * 374761393 + b * 668265263 + s * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function vnoise(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, seed), b = hash(xi + 1, yi, seed), c = hash(xi, yi + 1, seed), d = hash(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, seed) { return vnoise(x / 56, y / 56, seed) * .55 + vnoise(x / 18, y / 18, seed + 7) * .3 + vnoise(x / 6, y / 6, seed + 13) * .15; }
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => v / 16 - .5);

const WORLD = {
  saiyan: { ground: ['#9a6838', '#b07c45', '#c49155', '#d6a868', '#e4bd80'], seed: 3, rock: ['#6e4a2e', '#8a6040', '#a87a52', '#c49a6c'], tuft: ['#8a7a3a', '#b0a050'],
    props: [['boulder', 5], ['spire', 3], ['mesa', 1.2], ['pod', .7], ['deadtree', 1.4], ['rubble', 3]], amb: 'dust', tint: 'rgba(255,170,90,.06)' },
  namek: { ground: ['#3f8a6a', '#4f9f78', '#62b386', '#79c596', '#92d6a8'], seed: 5, rock: ['#3a6a6e', '#4e8488', '#68a0a0', '#8ac0bc'], tuft: ['#2f7a5a', '#a6e6bc'],
    props: [['ajisa', 5], ['nhouse', 1.1], ['boulder', 2], ['spire', 1.5], ['fship', .12]], amb: 'leaf', tint: 'rgba(120,255,200,.05)', water: '#4fb6d6' },
  cell: { tiles: 26, ground: ['#cfc6b2', '#ddd5c2', '#e8e1d0', '#f2ecde'], grout: '#9a8f7a', seed: 9, rock: ['#7a7060', '#958a76', '#b0a690', '#cec4ae'],
    props: [['pillar', 1.6], ['rubble', 3.5], ['boulder', 1]], amb: 'dust', tint: 'rgba(255,230,180,.05)' },
  buu: { ground: ['#3f8a38', '#4e9e42', '#62b250', '#79c460', '#94d678'], seed: 13, rock: ['#5e6070', '#787a8a', '#9496a6', '#b4b6c4'], tuft: ['#2f6e2a', '#a6e07a'],
    props: [['tree', 5], ['boulder', 2.4], ['bship', .15], ['rubble', 1]], amb: 'leaf', tint: null, water: '#5fb8e8', flowers: true },
  top: { tiles: 32, ground: ['#6e7088', '#7c7e96', '#8a8ca4', '#9a9cb2'], grout: '#3c3e54', seed: 17, rock: ['#4a4c62', '#62647a', '#7c7e94', '#a2a4b8'],
    props: [['pillar', 2], ['crystal', 1.6], ['rubble', 3]], amb: 'spark', tint: 'rgba(110,60,200,.10)', glow: '#9a6aff' },
  db: { ground: ['#4f9a3a', '#5eab45', '#70bc52', '#86cc64', '#9ed87a'], seed: 21, rock: ['#6a6458', '#86806e', '#a29a86', '#c0b8a2'], tuft: ['#3e7e2c', '#b8e88a'],
    props: [['tree', 4], ['boulder', 2.5], ['mesa', .8], ['rubble', 1]], amb: 'leaf', tint: null, water: '#5fb8e8', flowers: true },
  pelis: { ground: ['#d8a84a', '#e4b85a', '#eec86e', '#f6d888', '#fbe6a8'], seed: 25, rock: ['#8a3a4a', '#a84a5a', '#c86a6a', '#e08a7a'],
    props: [['crystal', 1.2], ['spire', 2], ['pillar', 1.6], ['deadtree', 1.6], ['rubble', 2]], amb: 'spark', tint: 'rgba(255,120,80,.07)', glow: '#ff7a3a' },
  daima: { ground: ['#3a2a52', '#463462', '#543e72', '#644a84', '#765a98'], seed: 29, rock: ['#2a1e3e', '#3e2e5a', '#56427a', '#70589a'],
    props: [['crystal', 2.5], ['spire', 2.5], ['deadtree', 2], ['boulder', 1.5], ['rubble', 2]], amb: 'spark', tint: 'rgba(150,60,220,.10)', glow: '#c86aff' },
  super: { tiles: 28, ground: ['#5a6070', '#666c7c', '#727888', '#808696'], grout: '#2e3240', seed: 33, rock: ['#4a4e5c', '#62667a', '#7c8094', '#a2a6b8'],
    props: [['pillar', 1.4], ['rubble', 3.5], ['crystal', .6], ['boulder', 1]], amb: 'dust', tint: 'rgba(255,60,60,.05)' },
  gt: { ground: ['#7a5a4a', '#8a6a56', '#9a7a62', '#ac8c72', '#be9e84'], seed: 37, rock: ['#5a3e32', '#76523e', '#946a50', '#b48a6a'],
    props: [['spire', 2.5], ['boulder', 2.5], ['rubble', 3], ['deadtree', 1.4], ['crystal', .5]], amb: 'dust', tint: 'rgba(255,80,40,.08)' },
};

/* ---------- suelo ---------- */
function paintGround(x, st, cx, cy) {
  const W = WORLD[st], img = x.createImageData(CH, CH), d = img.data, pal = W.ground.map(hexRgb), n = pal.length;
  const ox = cx * CH, oy = cy * CH;
  for (let y = 0; y < CH; y++) for (let xx = 0; xx < CH; xx++) {
    const wx = ox + xx, wy = oy + y;
    let v = fbm(wx, wy, W.seed) + BAYER[(wy & 3) * 4 + (wx & 3)] * .16;
    let idx = clamp(Math.floor((v - .18) * n * 1.6), 0, n - 1);
    if (W.tiles) {
      const T = W.tiles, tx = Math.floor(wx / T), ty = Math.floor(wy / T), lx_ = ((wx % T) + T) % T, ly_ = ((wy % T) + T) % T;
      const tv = hash(tx, ty, W.seed);
      idx = clamp(Math.floor(tv * 2) + 1 + (v > .62 ? 1 : v < .35 ? -1 : 0), 0, n - 1);
      if (lx_ === 0 || ly_ === 0) { const g = hexRgb(W.grout); const o = (y * CH + xx) * 4; d[o] = g[0]; d[o + 1] = g[1]; d[o + 2] = g[2]; d[o + 3] = 255; continue; }
      if (lx_ === 1 || ly_ === 1) idx = Math.min(n - 1, idx + 1);
      else if (lx_ === T - 1 || ly_ === T - 1) idx = Math.max(0, idx - 1);
    }
    const c = pal[idx], o = (y * CH + xx) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
  }
  x.putImageData(img, 0, 0);
}
function pxEllipse(x, cx, cy, rx, ry, col) { x.fillStyle = col; for (let yy = -ry; yy <= ry; yy++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (yy / ry) ** 2))); x.fillRect(Math.round(cx - w), Math.round(cy + yy), w * 2 + 1, 1); } }
function paintDecals(x, st, cx, cy) {
  const W = WORLD[st], r = rng(Math.floor(hash(cx, cy, W.seed + 99) * 1e9) + 1), g = W.ground;
  // charcas / lagos
  if (W.water && r() < .2) {
    const wx = 30 + r() * 68, wy = 30 + r() * 68, rx = 12 + Math.floor(r() * 14), ry = 6 + Math.floor(r() * 6);
    pxEllipse(x, wx, wy + 1, rx + 2, ry + 2, shade(g[0], -.25)); pxEllipse(x, wx, wy, rx + 1, ry + 1, '#d8c890');
    pxEllipse(x, wx, wy, rx, ry, shade(W.water, -.2)); pxEllipse(x, wx, wy - 1, rx - 1, ry - 2, W.water);
    x.fillStyle = '#e8f8ff'; for (let i = 0; i < 4; i++) x.fillRect(Math.round(wx - rx / 2 + r() * rx), Math.round(wy - ry / 2 + r() * ry), 3, 1);
  }
  // cráteres (Saiyan)
  if (st === 'saiyan' && r() < .4) {
    const wx = 24 + r() * 80, wy = 24 + r() * 80, rr = 8 + Math.floor(r() * 10);
    pxEllipse(x, wx, wy, rr + 2, Math.round(rr * .55) + 2, g[3]); pxEllipse(x, wx, wy + 1, rr, Math.round(rr * .55), g[0]); pxEllipse(x, wx + 1, wy + 2, rr - 2, Math.round(rr * .4), shade(g[0], -.15));
  }
  // grietas
  const cracks = st === 'saiyan' ? 3 : st === 'cell' || st === 'top' ? 2 : 0;
  for (let i = 0; i < cracks; i++) if (r() < .5) {
    let px = r() * CH, py = r() * CH; const col = st === 'top' && r() < .5 ? W.glow : shade(g[0], -.3);
    for (let k = 0; k < 14; k++) { x.fillStyle = col; x.fillRect(Math.floor(px), Math.floor(py), 1, 1); px += r() * 2 - .5; py += r() * 2 - 1; if (st === 'top' && col === W.glow) { x.fillStyle = 'rgba(200,170,255,.35)'; x.fillRect(Math.floor(px) - 1, Math.floor(py), 3, 1); } }
  }
  // piedrecitas
  for (let i = 0; i < (W.tiles ? 6 : 14); i++) { const px = Math.floor(r() * CH), py = Math.floor(r() * CH), c = W.rock || ['#777', '#999', '#bbb', '#ddd']; x.fillStyle = c[1]; x.fillRect(px, py, 2, 1); x.fillStyle = c[3]; x.fillRect(px, py - 1, 1, 1); x.fillStyle = c[0]; x.fillRect(px + 1, py + 1, 1, 1); }
  // hierba
  if (W.tuft) for (let i = 0; i < 22; i++) {
    const px = Math.floor(r() * CH), py = Math.floor(r() * CH), h = 2 + Math.floor(r() * 3);
    x.fillStyle = W.tuft[0]; x.fillRect(px, py - h, 1, h); x.fillRect(px + 2, py - h + 1, 1, h - 1); x.fillRect(px - 2, py - h + 2, 1, h - 2);
    x.fillStyle = W.tuft[1]; x.fillRect(px, py - h, 1, 1); x.fillRect(px + 2, py - h + 1, 1, 1);
  }
  // flores
  if (W.flowers) for (let i = 0; i < 10; i++) {
    const px = Math.floor(r() * CH), py = Math.floor(r() * CH), c = ['#ff6a8a', '#ffe14a', '#ffffff', '#b07aff'][Math.floor(r() * 4)];
    x.fillStyle = c; x.fillRect(px - 1, py, 3, 1); x.fillRect(px, py - 1, 1, 3); x.fillStyle = '#ffd23f'; x.fillRect(px, py, 1, 1);
  }
  // marcas de quemadura (Cell)
  if (st === 'cell' && r() < .3) { const wx = 20 + r() * 88, wy = 20 + r() * 88; for (let k = 0; k < 40; k++) { const a = r() * TAU, dd = r() * 9; x.fillStyle = 'rgba(40,30,20,.35)'; x.fillRect(Math.round(wx + Math.cos(a) * dd), Math.round(wy + Math.sin(a) * dd * .6), 1, 1); } }
}
function getChunk(stage, cx, cy) {
  const k = stage + cx + ',' + cy; let c = chunkCache.get(k);
  if (!c) {
    c = document.createElement('canvas'); c.width = CH; c.height = CH; const x = c.getContext('2d');
    paintGround(x, stage, cx, cy); paintDecals(x, stage, cx, cy);
    chunkCache.set(k, c); if (chunkCache.size > 120) chunkCache.delete(chunkCache.keys().next().value);
  }
  return c;
}

/* ---------- decorados (props) ---------- */
function outlineCanvas(c) {
  const x = c.getContext('2d'), W = c.width, H = c.height, src = x.getImageData(0, 0, W, H), d = src.data, out = x.createImageData(W, H), o = out.data;
  const A = (xx, yy) => xx >= 0 && yy >= 0 && xx < W && yy < H && d[(yy * W + xx) * 4 + 3] > 40;
  for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
    const i = (y * W + xx) * 4;
    if (d[i + 3] > 40) { o[i] = d[i]; o[i + 1] = d[i + 1]; o[i + 2] = d[i + 2]; o[i + 3] = d[i + 3]; }
    else if (A(xx - 1, y) || A(xx + 1, y) || A(xx, y - 1) || A(xx, y + 1)) { o[i] = 13; o[i + 1] = 7; o[i + 2] = 22; o[i + 3] = 255; }
  }
  x.putImageData(out, 0, 0); return c;
}
function newPropCanvas(w, h) { const c = document.createElement('canvas'); c.width = w + 2; c.height = h + 2; const x = c.getContext('2d'); x.translate(1, 1); return [c, x]; }
const PROP_PAINT = {
  boulder(st, v) {
    const R = WORLD[st].rock, r = rng(v * 77 + 3), w = 16 + Math.floor(r() * 8), h = 11 + Math.floor(r() * 5), [c, x] = newPropCanvas(w, h);
    pxEllipse(x, w / 2, h - h / 2, w / 2 - 1, h / 2 - 1, R[1]); pxEllipse(x, w / 2 - 2, h / 2 - 1, w / 3, h / 3, R[2]); pxEllipse(x, w / 2 - 3, h / 2 - 3, w / 5, h / 5, R[3]);
    x.fillStyle = R[0]; x.fillRect(Math.floor(w * .55), Math.floor(h * .4), 1, 3); x.fillRect(Math.floor(w * .55) + 1, Math.floor(h * .4) + 3, 2, 1);
    if (WORLD[st].tuft) { x.fillStyle = WORLD[st].tuft[0]; x.fillRect(2, h - 3, 4, 2); x.fillStyle = WORLD[st].tuft[1]; x.fillRect(3, h - 4, 2, 1); }
    return { c: outlineCanvas(c), shadow: w * .55 };
  },
  spire(st, v) {
    const R = WORLD[st].rock, r = rng(v * 91 + 5), w = 12 + Math.floor(r() * 5), h = 34 + Math.floor(r() * 14), [c, x] = newPropCanvas(w + 4, h);
    for (let y = 0; y < h; y++) {
      const t = y / h, ww = Math.round(w * (.55 + t * .45)), x0 = Math.round((w + 4 - ww) / 2), band = Math.floor((y + v * 3) / 5) % 2;
      x.fillStyle = band ? R[1] : R[2]; x.fillRect(x0, y, ww, 1);
      x.fillStyle = R[3]; x.fillRect(x0, y, 2, 1); x.fillStyle = R[0]; x.fillRect(x0 + ww - 3, y, 3, 1);
    }
    x.clearRect(0, 0, w + 4, 2); x.fillStyle = R[3]; x.fillRect(Math.round((w + 4) * .3), 2, Math.round((w + 4) * .4), 2);
    return { c: outlineCanvas(c), shadow: w * .7 };
  },
  mesa(st, v) {
    const R = WORLD[st].rock, w = 46, h = 26, [c, x] = newPropCanvas(w, h);
    x.fillStyle = R[1]; x.fillRect(2, 8, w - 4, h - 8); x.fillRect(4, 5, w - 8, 4);
    x.fillStyle = R[3]; x.fillRect(4, 4, w - 8, 3); x.fillStyle = R[2]; x.fillRect(4, 7, w - 8, 2);
    for (let i = 0; i < 9; i++) { const xx = 5 + i * 4 + (i % 2); x.fillStyle = R[0]; x.fillRect(xx, 10, 1, h - 12 - (i % 3) * 2); }
    x.fillStyle = R[0]; x.fillRect(2, h - 3, w - 4, 3); x.fillStyle = R[2]; x.fillRect(3, 9, 2, h - 12);
    return { c: outlineCanvas(c), shadow: w * .5 };
  },
  pod(st, v) {
    const w = 24, h = 20, [c, x] = newPropCanvas(w, h), g = WORLD[st].ground;
    pxEllipse(x, w / 2, h - 4, w / 2 - 1, 3, g[0]); pxEllipse(x, w / 2, h - 4, w / 2 - 4, 2, shade(g[0], -.2));
    pxEllipse(x, w / 2, 9, 7, 7, '#c8c8d4'); pxEllipse(x, w / 2 - 1, 8, 6, 6, '#e8e8f0'); pxEllipse(x, w / 2 - 3, 6, 2, 2, '#ffffff');
    pxEllipse(x, w / 2 + 1, 10, 3, 3, '#7a1f4a'); pxEllipse(x, w / 2 + 1, 10, 2, 2, '#c43a7a'); x.fillStyle = '#ffb0d8'; x.fillRect(w / 2, 9, 1, 1);
    x.fillStyle = '#9a9aa8'; x.fillRect(w / 2 - 7, 12, 14, 1);
    return { c: outlineCanvas(c), shadow: 0 };
  },
  deadtree(st, v) {
    const w = 18, h = 26, [c, x] = newPropCanvas(w, h), col = '#5a3e26', lt = '#7a583a';
    x.fillStyle = col; x.fillRect(8, 8, 3, h - 8); x.fillStyle = lt; x.fillRect(8, 8, 1, h - 8);
    x.fillStyle = col; for (let i = 0; i < 6; i++) { x.fillRect(8 - i, 12 - i, 1, 1); x.fillRect(11 + i, 9 - i, 1, 1); } x.fillRect(4, 3, 1, 4); x.fillRect(15, 1, 1, 4); x.fillRect(9, 2, 1, 6);
    return { c: outlineCanvas(c), shadow: 6 };
  },
  rubble(st, v) {
    const R = WORLD[st].rock, r = rng(v * 13 + 1), w = 16, h = 8, [c, x] = newPropCanvas(w, h);
    for (let i = 0; i < 4; i++) { const px = Math.floor(r() * 11), py = 2 + Math.floor(r() * 4), s = 2 + Math.floor(r() * 3); x.fillStyle = R[1]; x.fillRect(px, py, s + 1, s); x.fillStyle = R[3]; x.fillRect(px, py, s, 1); x.fillStyle = R[0]; x.fillRect(px + s, py + 1, 1, s - 1); }
    return { c: outlineCanvas(c), shadow: 0 };
  },
  ajisa(st, v) {
    const r = rng(v * 31 + 7), w = 26, th = 22 + Math.floor(r() * 10), h = th + 18, [c, x] = newPropCanvas(w, h);
    x.fillStyle = '#7a6a4a'; x.fillRect(12, 14, 2, h - 14); x.fillStyle = '#9a8a62'; x.fillRect(12, 14, 1, h - 14);
    const cc = ['#2e8a7a', '#3aa892', '#5cc8ae', '#8ee6cc'];
    pxEllipse(x, 13, 10, 11, 8, cc[0]); pxEllipse(x, 12, 9, 10, 7, cc[1]); pxEllipse(x, 10, 7, 7, 5, cc[2]); pxEllipse(x, 9, 5, 3, 2, cc[3]);
    x.fillStyle = cc[0]; for (let i = 0; i < 8; i++) x.fillRect(4 + Math.floor(r() * 18), 4 + Math.floor(r() * 10), 1, 1);
    return { c: outlineCanvas(c), shadow: 8, tall: true };
  },
  nhouse(st, v) {
    const w = 30, h = 22, [c, x] = newPropCanvas(w, h);
    x.fillStyle = '#d8d4c4'; x.fillRect(13, 0, 4, 4); x.fillStyle = '#f4f0e0'; x.fillRect(13, 0, 2, 4);
    pxEllipse(x, 15, 14, 14, 10, '#c8c2ae'); pxEllipse(x, 14, 13, 13, 9, '#e8e2ce'); pxEllipse(x, 11, 10, 7, 5, '#faf6e8');
    x.clearRect(0, 18, w, 6); x.fillStyle = '#b0aa96'; x.fillRect(1, 17, w - 2, 3);
    [[7, 12], [19, 12]].forEach(([a, b]) => { pxEllipse(x, a, b, 2, 2, '#4a6a7a'); x.fillStyle = '#9ad0e0'; x.fillRect(a - 1, b - 1, 1, 1); });
    x.fillStyle = '#5a4a3a'; x.fillRect(13, 13, 4, 6); x.fillStyle = '#7a6a5a'; x.fillRect(13, 13, 1, 6);
    return { c: outlineCanvas(c), shadow: 14 };
  },
  fship(st, v) {
    const w = 64, h = 34, [c, x] = newPropCanvas(w, h);
    x.fillStyle = '#7a7a8a'; x.fillRect(10, 22, 3, 12); x.fillRect(51, 22, 3, 12); x.fillRect(30, 24, 4, 10);
    pxEllipse(x, 32, 20, 31, 8, '#9a9aac'); pxEllipse(x, 32, 19, 30, 7, '#c8c8d6'); pxEllipse(x, 32, 14, 18, 10, '#d8d8e4'); pxEllipse(x, 28, 10, 10, 5, '#f2f2fa');
    x.clearRect(0, 22, w, 1); x.fillStyle = '#6a6a7a'; x.fillRect(2, 21, w - 4, 2);
    for (let i = 0; i < 9; i++) { x.fillStyle = i % 2 ? '#ffd23f' : '#ff8a3a'; x.fillRect(6 + i * 6, 19, 2, 2); }
    x.fillStyle = '#4a6aa8'; x.fillRect(24, 13, 16, 2);
    return { c: outlineCanvas(c), shadow: 30 };
  },
  pillar(st, v) {
    const R = st === 'top' ? ['#8a8ca8', '#b4b6cc', '#d4d6e6', '#f0f0f8'] : ['#a89e88', '#c8bea6', '#e0d8c4', '#f6f0e2'], r = rng(v * 17 + 2), h = 22 + Math.floor(r() * 14), w = 14, [c, x] = newPropCanvas(w, h);
    x.fillStyle = R[0]; x.fillRect(0, h - 4, w, 4); x.fillStyle = R[2]; x.fillRect(0, h - 4, w, 1);
    x.fillStyle = R[1]; x.fillRect(2, 3, w - 4, h - 7); x.fillStyle = R[3]; x.fillRect(3, 3, 1, h - 7); x.fillStyle = R[2]; x.fillRect(6, 3, 1, h - 7); x.fillStyle = R[0]; x.fillRect(w - 4, 3, 2, h - 7);
    x.clearRect(2, 0, w - 4, 3); x.fillStyle = R[1]; x.fillRect(2, 3, 3, 1); x.fillRect(7, 1, 3, 3); x.fillStyle = R[3]; x.fillRect(7, 1, 2, 1);
    if (st === 'top') { x.fillStyle = WORLD.top.glow; x.fillRect(5, 8, 1, 3); x.fillRect(6, 11, 1, 2); }
    return { c: outlineCanvas(c), shadow: 8, tall: h > 28 };
  },
  tree(st, v) {
    const r = rng(v * 41 + 9), w = 28, h = 34 + Math.floor(r() * 6), [c, x] = newPropCanvas(w, h);
    x.fillStyle = '#5a3a1e'; x.fillRect(12, 18, 4, h - 18); x.fillStyle = '#7a5530'; x.fillRect(12, 18, 1, h - 18);
    const cc = ['#2a6a2a', '#3a8a34', '#56a844', '#82c860'];
    pxEllipse(x, 14, 14, 13, 11, cc[0]); pxEllipse(x, 13, 13, 12, 10, cc[1]); pxEllipse(x, 11, 10, 8, 6, cc[2]); pxEllipse(x, 9, 7, 4, 3, cc[3]);
    for (let i = 0; i < 4; i++) { x.fillStyle = '#e8433a'; x.fillRect(5 + Math.floor(r() * 18), 8 + Math.floor(r() * 12), 2, 2); }
    return { c: outlineCanvas(c), shadow: 10, tall: true };
  },
  bship(st, v) {
    const w = 44, h = 26, [c, x] = newPropCanvas(w, h);
    pxEllipse(x, 22, 20, 21, 7, '#5a5a6a'); pxEllipse(x, 22, 14, 18, 12, '#8a6a9a'); pxEllipse(x, 19, 11, 12, 8, '#a888b8'); pxEllipse(x, 16, 8, 5, 3, '#d8c0e8');
    x.clearRect(0, 24, w, 3); x.fillStyle = '#4a3a5a'; x.fillRect(4, 14, 36, 2); x.fillStyle = '#ffd23f'; x.fillRect(20, 6, 4, 4); x.fillStyle = '#c41f1f'; x.fillRect(21, 7, 2, 2);
    return { c: outlineCanvas(c), shadow: 20 };
  },
  crystal(st, v) {
    const r = rng(v * 23 + 4), w = 20, h = 24, [c, x] = newPropCanvas(w, h), cc = r() < .5 ? ['#5a2aa8', '#8a5aff', '#c8a8ff', '#ffffff'] : ['#2a6aa8', '#4aa8ff', '#a8e0ff', '#ffffff'];
    const shard = (x0, h0, w0) => { for (let y = 0; y < h0; y++) { const ww = Math.max(1, Math.round(w0 * Math.min(1, (y + 1) / (h0 * .4)))); x.fillStyle = cc[1]; x.fillRect(x0 - ww / 2, h - h0 + y, ww, 1); x.fillStyle = cc[2]; x.fillRect(x0 - ww / 2, h - h0 + y, 1, 1); x.fillStyle = cc[0]; x.fillRect(x0 + ww / 2 - 1, h - h0 + y, 1, 1); } };
    shard(6, 14, 5); shard(14, 18, 6); shard(10, 22, 6); x.fillStyle = cc[3]; x.fillRect(9, h - 20, 1, 3);
    return { c: outlineCanvas(c), shadow: 8, glow: cc[1] };
  },
};
function getPropSprite(type, st, v) { const k = type + st + v; let p = propCache.get(k); if (!p) { p = PROP_PAINT[type](st, v); propCache.set(k, p); } return p; }
const chunkPropsCache = new Map();
function chunkProps(st, cx, cy) {
  const k = st + cx + ',' + cy; let list = chunkPropsCache.get(k); if (list) return list;
  list = []; const W = WORLD[st], r = rng(Math.floor(hash(cx, cy, W.seed + 555) * 1e9) + 7);
  if (Math.abs(cx) <= 0 && Math.abs(cy) <= 0) { chunkPropsCache.set(k, list); return list; }   // zona de inicio despejada
  const tot = W.props.reduce((a, p) => a + p[1], 0), n = Math.floor(r() * 3.2);
  for (let i = 0; i < n; i++) {
    let q = r() * tot, type = W.props[0][0]; for (const [t, w] of W.props) { q -= w; if (q <= 0) { type = t; break; } }
    const px = cx * CH + 12 + r() * (CH - 24), py = cy * CH + 16 + r() * (CH - 20);
    if (list.some(o => Math.abs(o.x - px) < 26 && Math.abs(o.y - py) < 16)) continue;
    list.push({ type, x: px, y: py, v: Math.floor(r() * 4) });
  }
  chunkPropsCache.set(k, list); if (chunkPropsCache.size > 400) chunkPropsCache.delete(chunkPropsCache.keys().next().value);
  return list;
}
function visibleProps(st, camX, camY) {
  const out = [], x0 = Math.floor((camX - 40) / CH), y0 = Math.floor((camY - 20) / CH), x1 = Math.floor((camX + VW + 40) / CH), y1 = Math.floor((camY + VH + 60) / CH);
  for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) for (const p of chunkProps(st, cx, cy)) out.push(p);
  return out;
}
function drawProp(p, st, camX, camY, fade) {
  const s = getPropSprite(p.type, st, p.v), w = s.c.width, h = s.c.height, X = Math.round(p.x - w / 2 - camX), Y = Math.round(p.y - h - camY + 1);
  if (s.shadow) { lx.fillStyle = 'rgba(0,0,0,.25)'; lx.beginPath(); lx.ellipse(Math.round(p.x - camX + 2), Math.round(p.y - camY), s.shadow, s.shadow * .3, 0, 0, TAU); lx.fill(); }
  if (s.glow) { lx.globalAlpha = .18 + Math.sin(performance.now() / 400 + p.x) * .06; lx.fillStyle = s.glow; lx.beginPath(); lx.arc(X + w / 2, Y + h * .6, w * .7, 0, TAU); lx.fill(); lx.globalAlpha = 1; }
  if (fade) lx.globalAlpha = .45;
  lx.drawImage(s.c, X, Y);
  lx.globalAlpha = 1;
}
function drawBG(stage, camX, camY) {
  const x0 = Math.floor(camX / CH), y0 = Math.floor(camY / CH), x1 = Math.floor((camX + VW) / CH), y1 = Math.floor((camY + VH) / CH);
  for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) lx.drawImage(getChunk(stage, cx, cy), cx * CH - camX, cy * CH - camY);
}

/* ---------- ambiente: sombras de nubes, partículas, tinte y viñeta ---------- */
const AMB = { parts: [], vig: null, vw: 0, vh: 0 };
function drawCloudShadows(stage, camX, camY, t) {
  // sombras de nubes que se desplazan por el mapa
  lx.fillStyle = 'rgba(10,10,40,.10)';
  for (let i = 0; i < 4; i++) {
    const sp = 9 + i * 3, ox = (t * sp + i * 400) % 1400 - 700, cxw = Math.floor(camX / 700) * 700 + ox + i * 260, cyw = camY + ((i * 173) % VH);
    for (const dx of [0, 700, -700]) { const X = Math.round(cxw + dx - camX), Y = Math.round(cyw - camY); if (X < -160 || X > VW + 160) continue; lx.beginPath(); lx.ellipse(X, Y, 90 + i * 14, 34 + i * 6, 0, 0, TAU); lx.fill(); lx.beginPath(); lx.ellipse(X + 50, Y - 10, 60, 26, 0, 0, TAU); lx.fill(); }
  }
}
function drawAtmosphere(stage, dt) {
  const W = WORLD[stage];
  const P_ = AMB.parts, want = Math.round(VW * VH / 4500);
  while (P_.length < want) P_.push({ x: Math.random() * VW, y: Math.random() * VH, s: Math.random(), ph: Math.random() * TAU });
  for (const q of P_) {
    if (W.amb === 'leaf') { q.x += (8 + q.s * 10) * dt; q.y += (10 + q.s * 8) * dt; q.ph += dt * 3; }
    else if (W.amb === 'spark') { q.y -= (8 + q.s * 16) * dt; q.ph += dt * 4; }
    else { q.x += (14 + q.s * 18) * dt; q.y += Math.sin(q.ph += dt) * 4 * dt; }
    if (q.x > VW + 4) q.x = -4; if (q.y > VH + 4) q.y = -4; if (q.y < -4) q.y = VH + 4;
    const X = Math.round(q.x + Math.sin(q.ph) * 3), Y = Math.round(q.y);
    if (W.amb === 'leaf') { lx.fillStyle = q.s > .5 ? '#a6e07a' : '#5cc8ae'; lx.fillRect(X, Y, 2, 1); lx.fillRect(X + (Math.sin(q.ph) > 0 ? 1 : 0), Y + 1, 1, 1); }
    else if (W.amb === 'spark') { lx.globalAlpha = .4 + Math.sin(q.ph) * .3; lx.fillStyle = q.s > .5 ? '#c8a8ff' : '#7ad8ff'; lx.fillRect(X, Y, 1, 2); lx.globalAlpha = 1; }
    else { lx.globalAlpha = .35; lx.fillStyle = '#fff2d0'; lx.fillRect(X, Y, q.s > .7 ? 2 : 1, 1); lx.globalAlpha = 1; }
  }
  if (W.tint) { lx.fillStyle = W.tint; lx.fillRect(0, 0, VW, VH); }
  if (!AMB.vig || AMB.vw !== VW || AMB.vh !== VH) {
    const c = document.createElement('canvas'); c.width = VW; c.height = VH; const x = c.getContext('2d');
    const g = x.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * .35, VW / 2, VH / 2, Math.hypot(VW, VH) * .62);
    g.addColorStop(0, 'rgba(8,6,24,0)'); g.addColorStop(1, 'rgba(8,6,24,.42)'); x.fillStyle = g; x.fillRect(0, 0, VW, VH);
    AMB.vig = c; AMB.vw = VW; AMB.vh = VH;
  }
  lx.drawImage(AMB.vig, 0, 0);
}
</script>
