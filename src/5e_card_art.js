<script>
/* =================== ILUSTRACIÓN 3D DE LAS CARTAS ===================
   El guerrero se convierte en un modelo de vóxeles (a partir de su sprite: cada píxel gana grosor según lo lejos
   que está del borde, así queda redondeado y con sombreado) y se coloca en plena acción: brazo extendido lanzando
   su técnica, enemigo recibiendo el golpe y el escenario de su saga detrás. Todo dibujado por código. */

// Pose de ataque: el brazo derecho se extiende hacia delante con el puño cerrado
const poseCache = new Map();
function actionSprite(id) {
  let c = poseCache.get(id); if (c) return c;
  const s = getSprite(id, 1, false), W = s.width, H = s.height, EX = 9;
  c = document.createElement('canvas'); c.width = W + EX; c.height = H;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(s, 0, 0);
  const img = x.getImageData(0, 0, W + EX, H), d = img.data, at = (X, Y) => (Y * (W + EX) + X) * 4, op = (X, Y) => X >= 0 && Y >= 0 && X < W + EX && Y < H && d[at(X, Y) + 3] > 0;
  // hombro: primera fila (desde arriba, pasada la cabeza) donde el cuerpo se ensancha
  let sh = -1, xr = 0;
  for (let Y = Math.floor(H * .5); Y < H * .75; Y++) { let r = -1; for (let X = W - 1; X >= 0; X--) if (op(X, Y)) { r = X; break; } if (r > xr + 0 && r >= W * .7) { sh = Y; xr = r; break; } }
  if (sh < 0) { sh = Math.floor(H * .58); for (let X = W - 1; X >= 0; X--) if (op(X, sh)) { xr = X; break; } }
  const col = (X, Y) => [d[at(X, Y)], d[at(X, Y) + 1], d[at(X, Y) + 2]];
  const sleeve = col(Math.max(0, xr - 1), sh + 1), skinPix = (() => { for (let Y = 6; Y < sh; Y++) for (let X = 6; X < W - 6; X++) { const [r, g, b] = col(X, Y); if (d[at(X, Y) + 3] && r > 200 && g > 150 && b > 110 && r > b + 40) return [r, g, b]; } return [246, 200, 160]; })();
  // quitar el brazo que colgaba (columnas exteriores derechas bajo el hombro)
  for (let Y = sh + 1; Y < Math.min(H - 6, sh + 8); Y++) for (let X = xr - 1; X <= xr; X++) if (X >= 0) d[at(X, Y) + 3] = 0;
  const put = (X, Y, rgb) => { if (X < 0 || Y < 0 || X >= W + EX || Y >= H) return; const i = at(X, Y); d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255; };
  const dark = [20, 16, 30];
  for (let X = xr - 1; X <= xr + 5; X++) { put(X, sh, dark); put(X, sh + 1, sleeve); put(X, sh + 2, sleeve.map(v => v * .8)); put(X, sh + 3, dark); }
  for (let X = xr + 5; X <= xr + 7; X++) for (let Y = sh - 1; Y <= sh + 4; Y++) put(X, Y, (Y === sh - 1 || Y === sh + 4 || X === xr + 7) ? dark : skinPix);
  // cerrar el hueco del costado con el color del cuerpo
  for (let Y = sh + 4; Y < Math.min(H - 6, sh + 8); Y++) { const i = at(xr - 2, Y); if (d[i + 3]) put(xr - 1, Y, dark); }
  x.putImageData(img, 0, 0);
  c.hand = [xr + 7, sh + 1.5]; poseCache.set(id, c); return c;
}

// Capas de vóxeles: grosor según distancia al borde (2D chamfer) y brillo por profundidad
const voxCache = new Map();
function voxelize(src, key) {
  let v = voxCache.get(key); if (v) return v;
  const W = src.width, H = src.height, D = 5, sd = src.getContext('2d').getImageData(0, 0, W, H).data;
  const dist = new Float32Array(W * H).fill(1e9), a = i => sd[i * 4 + 3] > 0;
  for (let i = 0; i < W * H; i++) if (!a(i)) dist[i] = 0;
  for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) { const i = Y * W + X; if (!dist[i]) continue; const l = X ? dist[i - 1] : 0, u = Y ? dist[i - W] : 0; dist[i] = Math.min(dist[i], l + 1, u + 1); }
  for (let Y = H - 1; Y >= 0; Y--) for (let X = W - 1; X >= 0; X--) { const i = Y * W + X; if (!dist[i]) continue; const r = X < W - 1 ? dist[i + 1] : 0, b = Y < H - 1 ? dist[i + W] : 0; dist[i] = Math.min(dist[i], r + 1, b + 1); }
  const layers = [];
  for (let z = -D + 1; z < D; z++) {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), im = x.createImageData(W, H), o = im.data;
    const f = .5 + .5 * (z + D) / (2 * D);
    for (let i = 0; i < W * H; i++) { const h = Math.min(D, Math.ceil(dist[i] * 1.25)); if (!h || Math.abs(z) >= h) continue; const surf = z === h - 1 ? 1 : .82; o[i * 4] = sd[i * 4] * f * surf; o[i * 4 + 1] = sd[i * 4 + 1] * f * surf; o[i * 4 + 2] = sd[i * 4 + 2] * f * surf; o[i * 4 + 3] = 255; }
    x.putImageData(im, 0, 0); layers.push({ z, c });
  }
  v = { W, H, layers }; voxCache.set(key, v); return v;
}
function drawVoxel(x, src, key, cx, baseY, scale, yaw, pitch = .12, flip = false) {
  const v = voxelize(src, key), cw = Math.cos(yaw), sw = Math.sin(yaw) * (flip ? -1 : 1), sp = Math.sin(pitch);
  x.save(); x.imageSmoothingEnabled = false;
  if (flip) { x.translate(cx * 2, 0); x.scale(-1, 1); }
  for (const L of v.layers) for (let s = 0; s < 2; s++) {
    const z = L.z + s * .5;
    x.drawImage(L.c, Math.round(cx - v.W * scale * cw / 2 + z * sw * scale * .9), Math.round(baseY - v.H * scale - z * sp * scale), Math.round(v.W * scale * cw), Math.round(v.H * scale));
  }
  x.restore();
}

let artLayerCv = null;
function artLayer(W, H) { const c = artLayerCv || (artLayerCv = document.createElement('canvas')); if (c.width !== W || c.height !== H) { c.width = W; c.height = H; } const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W, H); return c; }

// Silueta de un color (para el resplandor)
const silCache = new Map();
function glowSil(src, col) {
  const key = src.width + 'x' + src.height + col + (src.hand || ''); let c = silCache.get(src); if (c && c.key === key) return c;
  c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const x = c.getContext('2d');
  x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); c.key = key; silCache.set(src, c); return c;
}

// Técnica que se ilustra: la más vistosa de las que encadena el especial
const FX_PRI = ['beam', 'bomb', 'rain', 'hakai', 'freeze', 'absorb', 'candy', 'fortune', 'dash', 'nova', 'shield', 'rage', 'heal'];
function artFx(sp) { if (!sp) return 'beam'; const has = sp.fx.map(f => f[0]); return FX_PRI.find(f => has.includes(f)) || has[0]; }

// Resplandor difuminado de la silueta (se calcula una vez; el filtro blur es caro)
const glowCache = new Map();
function blurGlow(src, key, col, scale, S) {
  key += '|' + col + '|' + scale + '|' + S; let c = glowCache.get(key); if (c) return c;
  const pad = 16 * S; c = document.createElement('canvas'); c.width = Math.round(src.width * scale * S + pad * 2); c.height = Math.round(src.height * scale * S + pad * 2);
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.filter = `blur(${7 * S}px)`;
  x.drawImage(glowSil(src, col), pad, pad, src.width * scale * S, src.height * scale * S);
  glowCache.set(key, c); if (glowCache.size > 16) glowCache.delete(glowCache.keys().next().value); return c;
}

// Fondos por tipo de guerrero (escenario de su saga)
const ART_STAGE = { saiyan: 'saiyan', earth: 'db', namek: 'namek', android: 'cell', majin: 'buu', empire: 'namek', god: 'top', uni: 'top', demon: 'daima', dragon: 'gt', space: 'super' };
const ART_FOE = { saiyan: 'saibaman', earth: 'rr', namek: 'soldado_f', android: 'celljr', majin: 'majin', empire: 'soldado_f', god: 'pride', uni: 'pride', demon: 'demon_s', dragon: 'tsufur', space: 'prisoner' };
const SKY = { saiyan: ['#3a1a5e', '#ff8a5a'], namek: ['#1e5a4a', '#9fe8b0'], cell: ['#2a3a5a', '#c8d0e8'], buu: ['#4a2a6a', '#ffb0d8'], top: ['#0a0a1e', '#3a3a7a'], db: ['#3a7ad8', '#bfe8ff'], pelis: ['#5a1a2a', '#ffb05a'], daima: ['#1a0a2e', '#8a4ac8'], super: ['#1a1a2e', '#e85a4a'], gt: ['#2a0a0a', '#e8843a'] };
function seededR(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

const artBgCache = new Map();
function paintArtBg(x, k, st, AX, AY, AW, AH) {
  const R = seededR(hashStr(k.id + '|bg')), horizon = AY + AH * .66;
  // cielo
  const sky = SKY[st] || SKY.saiyan, g = x.createLinearGradient(0, AY, 0, horizon); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]); x.fillStyle = g; x.fillRect(AX, AY, AW, horizon - AY);
  // sol / luna con halo
  const sx = AX + AW * (.7 + R() * .2), sy = AY + AH * (.18 + R() * .12), sg = x.createRadialGradient(sx, sy, 2, sx, sy, 90); sg.addColorStop(0, 'rgba(255,248,220,.9)'); sg.addColorStop(.2, 'rgba(255,230,180,.35)'); sg.addColorStop(1, 'rgba(255,230,180,0)'); x.fillStyle = sg; x.fillRect(AX, AY, AW, AH);
  // montañas lejanas en dos capas
  for (let layer = 0; layer < 2; layer++) {
    x.fillStyle = shade(sky[0], layer ? -.15 : .1); x.beginPath(); x.moveTo(AX, horizon);
    const ph = R() * 10, amp = layer ? 26 : 40, base = horizon - (layer ? 8 : 22);
    for (let i = 0; i <= 40; i++) { const px = AX + AW * i / 40; x.lineTo(px, base - Math.abs(Math.sin(i * .45 + ph)) * amp - Math.sin(i * 1.7 + ph) * 6); }
    x.lineTo(AX + AW, horizon); x.closePath(); x.fill();
  }
  // suelo: textura del mapa de la saga con perspectiva y difuminado
  const ch = getChunk(st, 7, 7), GH = AY + AH - horizon;
  x.save(); x.beginPath(); x.rect(AX, horizon, AW, GH); x.clip();
  for (let i = 0; i < 24; i++) {
    const f0 = i / 24, f1 = (i + 1) / 24, y0 = horizon + GH * f0 * f0, y1 = horizon + GH * f1 * f1, wsc = .6 + f1 * 2.2;
    x.drawImage(ch, 0, (f0 * 120) | 0, 128, 6, AX + AW / 2 - AW * wsc / 2, y0, AW * wsc, Math.max(1, y1 - y0) + 1);
  }
  const fog = x.createLinearGradient(0, horizon, 0, AY + AH); fog.addColorStop(0, sky[1] + 'cc'); fog.addColorStop(.35, sky[1] + '00'); fog.addColorStop(1, 'rgba(0,0,0,.35)'); x.fillStyle = fog; x.fillRect(AX, horizon, AW, GH);
  x.restore();
}

function drawCardArt(x, k, AX, AY, AW, AH, t = 0) {
  const c = CHAR[k.base], ty = cardType(c), st = ART_STAGE[ty], sp = SPECIALS[k.base], col = sp ? sp.col : CTYPES[ty].col, fx = artFx(sp);
  const R = seededR(hashStr(k.id)), horizon = AY + AH * .66;
  // escenario (estático: se pinta una vez por carta y resolución)
  const S = x.getTransform().a, bkey = k.id + '|' + S;
  let bgc = artBgCache.get(bkey);
  if (!bgc) {
    bgc = document.createElement('canvas'); bgc.width = Math.round(AW * S); bgc.height = Math.round(AH * S);
    const b = bgc.getContext('2d'); b.setTransform(S, 0, 0, S, -AX * S, -AY * S); b.imageSmoothingEnabled = false;
    paintArtBg(b, k, st, AX, AY, AW, AH);
    artBgCache.set(bkey, bgc); if (artBgCache.size > 12) artBgCache.delete(artBgCache.keys().next().value);
  }
  x.drawImage(bgc, AX, AY, AW, AH);
  // líneas de velocidad (fondo de anime)
  x.save(); x.globalAlpha = .12; x.strokeStyle = '#ffffff'; x.lineWidth = 2;
  for (let i = 0; i < 26; i++) { const yy = AY + R() * AH * .9, len = 60 + R() * 140, xx = AX + ((R() * AW + t * 260 * (1 + R())) % (AW + len)) - len; x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + len, yy); x.stroke(); }
  x.restore();

  const heroH = AH * .74, scale = Math.max(4, Math.floor(heroH / 28)), pose = actionSprite(k.spr), yaw = -.42 + Math.sin(t * 1.3) * .14;
  const hx = AX + AW * .3, hy = AY + AH * .9 + Math.sin(t * 2.2) * 3;
  const hand = [hx - pose.width * scale * Math.cos(yaw) / 2 + pose.hand[0] * scale * Math.cos(yaw) + 6, hy - pose.height * scale + pose.hand[1] * scale];
  // enemigo al otro lado, recibiendo el golpe
  const foe = ART_FOE[ty], fsp = getSprite(foe, 0, false), fx0 = AX + AW * .84, fy0 = AY + AH * .86, fsc = Math.max(3, Math.floor(scale * .62)), hitT = (Math.sin(t * 3) + 1) / 2;
  // aura del héroe
  x.save(); x.globalCompositeOperation = 'lighter';
  const au = x.createRadialGradient(hx, hy - heroH * .45, 10, hx, hy - heroH * .45, heroH * .75); au.addColorStop(0, col + 'aa'); au.addColorStop(.6, col + '33'); au.addColorStop(1, col + '00'); x.fillStyle = au; x.fillRect(AX, AY, AW, AH);
  for (let i = 0; i < 14; i++) { const a = -Math.PI / 2 + (R() - .5) * 1.6, l = heroH * (.35 + R() * .45) * (1 + Math.sin(t * 6 + i) * .08), bx = hx + (R() - .5) * heroH * .5; x.strokeStyle = col + '88'; x.lineWidth = 3 + R() * 4; x.beginPath(); x.moveTo(bx, hy - 8); x.quadraticCurveTo(bx + Math.cos(a) * l * .4, hy - l * .5, bx + Math.cos(a) * l * .2, hy - l); x.stroke(); }
  x.restore();
  // sombra en el suelo
  x.fillStyle = 'rgba(0,0,0,.4)'; x.beginPath(); x.ellipse(hx, hy + 2, pose.width * scale * .42, 12, 0, 0, TAU); x.fill();
  x.beginPath(); x.ellipse(fx0, fy0 + 2, fsp.width * fsc * .4, 8, 0, 0, TAU); x.fill();
  // enemigo (vóxel, mirando al héroe) con destello del impacto
  x.save(); x.translate(Math.sin(t * 20) * 2 * hitT, 0);
  drawVoxel(x, fsp, 'foe:' + foe, fx0, fy0, fsc, .35, .1, true);
  x.restore();
  // técnica
  drawTechFx(x, fx, col, hand, [fx0, fy0 - fsp.height * fsc * .5], AX, AY, AW, AH, t, R, hx, hy, heroH);
  // estela de imágenes residuales al embestir
  if (fx === 'dash') { const gs = glowSil(pose, col); for (let i = 3; i >= 1; i--) { x.save(); x.globalAlpha = .18 * (4 - i) / 3; drawVoxel(x, gs, 'glow:' + k.spr + col, hx - i * 46, hy - i * 4, scale, yaw, .14); x.restore(); } }
  // resplandor del color de la técnica detrás del héroe y héroe en 3D
  { const gl = blurGlow(pose, k.spr, col, scale, S), pad = 16, cw = Math.cos(yaw);
    x.save(); x.globalAlpha = .75 + Math.sin(t * 4) * .15; x.imageSmoothingEnabled = true;
    x.drawImage(gl, hx - (pose.width * scale / 2 + pad) * cw, hy - pose.height * scale - pad, (pose.width * scale + pad * 2) * cw, pose.height * scale + pad * 2); x.restore(); }
  // héroe en una capa aparte para iluminarlo: luz de la técnica por delante y sombra por detrás
  const hc = artLayer(Math.round(AW * S), Math.round(AH * S)), h = hc.getContext('2d'); h.setTransform(S, 0, 0, S, -AX * S, -AY * S);
  drawVoxel(h, pose, 'pose:' + k.spr, hx, hy, scale, yaw, .14);
  h.globalCompositeOperation = 'source-atop';
  const lg = h.createLinearGradient(hx - heroH * .35, 0, hx + heroH * .4, 0); lg.addColorStop(0, 'rgba(10,8,30,.3)'); lg.addColorStop(.5, 'rgba(0,0,0,0)'); lg.addColorStop(1, col + '77'); h.fillStyle = lg; h.fillRect(AX, AY, AW, AH);
  const tg = h.createLinearGradient(0, hy - heroH, 0, hy); tg.addColorStop(0, 'rgba(255,255,255,.12)'); tg.addColorStop(1, 'rgba(0,0,20,.18)'); h.fillStyle = tg; h.fillRect(AX, AY, AW, AH);
  x.drawImage(hc, AX, AY, AW, AH);
  // destellos y polvo
  x.save(); x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 30; i++) { const px = AX + R() * AW, py = AY + ((R() * AH - t * 40 * (1 + R())) % AH + AH) % AH, s = 1 + R() * 2.5; x.fillStyle = i % 3 ? col + 'aa' : '#ffffffcc'; x.fillRect(px, py, s, s); }
  x.restore();
  // viñeta
  const vg = x.createRadialGradient(AX + AW / 2, AY + AH / 2, AH * .3, AX + AW / 2, AY + AH / 2, AW * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)'); x.fillStyle = vg; x.fillRect(AX, AY, AW, AH);
}

// Efectos según el tipo de técnica especial
function drawTechFx(x, fx, col, hand, target, AX, AY, AW, AH, t, R, hx, hy, heroH) {
  const [ax, ay] = hand, [tx, ty] = target, pulse = 1 + Math.sin(t * 9) * .12;
  x.save(); x.globalCompositeOperation = 'lighter';
  const glowBall = (X, Y, r, c) => { const g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, '#ffffff'); g.addColorStop(.25, '#ffffff'); g.addColorStop(.45, c); g.addColorStop(1, c + '00'); x.fillStyle = g; x.beginPath(); x.arc(X, Y, r, 0, TAU); x.fill(); };
  const impact = (X, Y, r) => { glowBall(X, Y, r * pulse, col); x.strokeStyle = '#ffffffaa'; x.lineWidth = 2; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + t, l = r * (1.1 + R() * .9); x.beginPath(); x.moveTo(X + Math.cos(a) * r * .5, Y + Math.sin(a) * r * .5); x.lineTo(X + Math.cos(a) * l, Y + Math.sin(a) * l); x.stroke(); } };
  if (fx === 'dash') {
    // tajos cruzados sobre el enemigo y estela de velocidad
    for (let i = 0; i < 3; i++) { const a = -.7 + i * .7 + Math.sin(t * 5) * .1, r = 46 + i * 8; x.strokeStyle = i === 1 ? '#ffffff' : col; x.lineWidth = 6 - i; x.beginPath(); x.arc(tx - 10, ty, r, a - .9, a + .9); x.stroke(); }
    const sl = x.createLinearGradient(ax, 0, tx, 0); sl.addColorStop(0, col + '00'); sl.addColorStop(1, col + 'cc'); x.fillStyle = sl;
    x.beginPath(); x.moveTo(AX, ay - 40); x.lineTo(tx - 20, ty - 6); x.lineTo(tx - 20, ty + 6); x.lineTo(AX, ay + 40); x.fill();
    impact(tx, ty, 38);
  } else if (fx === 'beam' || fx === 'absorb') {
    // rayo tipo Kamehameha desde la mano hasta el enemigo
    const ang = Math.atan2(ty - ay, tx - ax), len = Math.hypot(tx - ax, ty - ay), w = 22 * pulse;
    x.translate(ax, ay); x.rotate(ang);
    const bg = x.createLinearGradient(0, -w * 1.6, 0, w * 1.6); bg.addColorStop(0, col + '00'); bg.addColorStop(.3, col + 'aa'); bg.addColorStop(.5, '#ffffff'); bg.addColorStop(.7, col + 'aa'); bg.addColorStop(1, col + '00');
    x.fillStyle = bg; x.beginPath(); x.moveTo(0, -w * .7); x.lineTo(len, -w * 1.5); x.lineTo(len, w * 1.5); x.lineTo(0, w * .7); x.fill();
    x.fillStyle = '#ffffff'; x.fillRect(0, -w * .22, len, w * .44);
    for (let i = 0; i < 5; i++) { const px = ((t * 420 + i * len / 5) % len); x.strokeStyle = '#ffffffaa'; x.lineWidth = 2; x.beginPath(); x.ellipse(px, 0, 4, w * (.9 + px / len * .7), 0, 0, TAU); x.stroke(); }
    x.restore(); x.save(); x.globalCompositeOperation = 'lighter';
    glowBall(ax, ay, 34 * pulse, col); impact(tx, ty, 46);
  } else if (fx === 'bomb' || fx === 'rain' || fx === 'candy' || fx === 'fortune') {
    // gran esfera de energía sobre la mano
    const bx = ax + 30, by = ay - 70, r = 62 * pulse;
    x.strokeStyle = col + '88'; x.lineWidth = 3; for (let i = 0; i < 8; i++) { const a = t * 2 + i / 8 * TAU; x.beginPath(); x.moveTo(bx + Math.cos(a) * r * 1.6, by + Math.sin(a) * r * 1.6); x.lineTo(bx + Math.cos(a) * r * .9, by + Math.sin(a) * r * .9); x.stroke(); }
    glowBall(bx, by, r, col); glowBall(bx - r * .25, by - r * .25, r * .35, '#ffffff');
    if (fx === 'rain' || fx === 'fortune' || fx === 'candy') for (let i = 0; i < 9; i++) { const px = AX + AW * (.45 + R() * .5), py = AY + ((t * 160 + R() * AH) % AH); glowBall(px, py, 10, fx === 'fortune' ? '#ffd23f' : fx === 'candy' ? '#ff8ac8' : col); }
    impact(tx, ty, 30);
  } else if (fx === 'nova' || fx === 'rage' || fx === 'shield' || fx === 'heal') {
    // onda expansiva / escudo alrededor del guerrero
    const cy = hy - heroH * .45;
    for (let i = 0; i < 3; i++) { const p = ((t * .8 + i / 3) % 1), r = 40 + p * heroH * .9; x.strokeStyle = col; x.globalAlpha = (1 - p) * .9; x.lineWidth = 8 * (1 - p) + 2; x.beginPath(); x.ellipse(hx, cy, r, r * .8, 0, 0, TAU); x.stroke(); }
    x.globalAlpha = 1;
    if (fx === 'shield') { x.fillStyle = col + '33'; x.beginPath(); x.ellipse(hx, cy, heroH * .55, heroH * .6, 0, 0, TAU); x.fill(); x.strokeStyle = '#ffffffaa'; x.lineWidth = 3; x.stroke(); }
    if (fx === 'heal') for (let i = 0; i < 10; i++) { const px = hx + (R() - .5) * heroH * .8, py = cy + heroH * .4 - ((t * 60 + R() * heroH) % heroH); x.fillStyle = '#7dffa0'; x.fillRect(px - 2, py - 7, 4, 14); x.fillRect(px - 7, py - 2, 14, 4); }
    glowBall(ax, ay, 26 * pulse, col); impact(tx, ty, 26);
  } else if (fx === 'freeze') {
    // destello / tiempo detenido
    const g = x.createRadialGradient(ax, ay, 0, ax, ay, AW * .8); g.addColorStop(0, '#ffffffee'); g.addColorStop(.15, col + '88'); g.addColorStop(1, col + '00'); x.fillStyle = g; x.fillRect(AX, AY, AW, AH);
    x.strokeStyle = '#ffffff88'; x.lineWidth = 2; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU + t * .5; x.beginPath(); x.moveTo(ax, ay); x.lineTo(ax + Math.cos(a) * AW, ay + Math.sin(a) * AW); x.stroke(); }
  } else if (fx === 'hakai') {
    // esfera de destrucción morada sobre el enemigo
    glowBall(tx, ty, 70 * pulse, '#b06bff'); x.strokeStyle = '#f0d8ff'; x.lineWidth = 2;
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + t * 3, r = 30 + ((t * 40 + i * 9) % 50); x.fillStyle = i % 2 ? '#b06bff' : '#f0d8ff'; x.fillRect(tx + Math.cos(a) * r, ty + Math.sin(a) * r, 4, 4); }
    glowBall(ax, ay, 24 * pulse, '#b06bff');
  } else { glowBall(ax, ay, 30 * pulse, col); impact(tx, ty, 34); }
  x.restore();
}
</script>
