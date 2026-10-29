<script>
'use strict';
/* =================== RENDER =================== */
let camX = 0, camY = 0;
const shadeMemo = new Map();
function sh(c, a) { const k = c + a; let v = shadeMemo.get(k); if (!v) { v = shade(c, a); shadeMemo.set(k, v); } return v; }
function circ(x, y, r, col) { lx.fillStyle = col; lx.beginPath(); lx.arc(Math.round(x - camX), Math.round(y - camY), Math.max(.5, r), 0, TAU); lx.fill(); }
function drawEnt(spr, x, y, sc, face, frame, variant, squash) {
  const s = getSprite(spr, frame, face < 0, variant || '');
  let w = Math.round(s.width * sc), h = Math.round(s.height * sc);
  if (squash) { w = Math.round(w * 1.12); h = Math.round(h * .9); }
  lx.drawImage(s, Math.round(x - w / 2 - camX), Math.round(y - h - camY + 1 - (frame === 1 ? 1 : 0)), w, h);
}
/* Cristales de ki y monedas */
const gemCache = new Map();
function gemSprite(col, big) {
  const k = col + big; let c = gemCache.get(k); if (c) return c;
  c = document.createElement('canvas'); const S = big ? 9 : 7; c.width = S; c.height = S + 2; const x = c.getContext('2d');
  const m = S >> 1, lt = shade(col, .55), dk = shade(col, -.38);
  for (let y = 0; y < S + 2; y++) { const half = y <= m ? y : Math.max(0, m - (y - m) * (m / (m + 2))) | 0; const hw = Math.round(y <= m ? y * .9 : (S + 1 - y) * (m / (m + 2)) * 1.1); x.fillStyle = OUTLINE; x.fillRect(m - hw - 1, y, hw * 2 + 3, 1); }
  for (let y = 1; y < S + 1; y++) { const hw = Math.round(y <= m ? (y - 1) * .9 : (S - y) * (m / (m + 2)) * 1.1); x.fillStyle = col; x.fillRect(m - hw, y, hw * 2 + 1, 1); x.fillStyle = y <= m ? lt : dk; x.fillRect(y <= m ? m - hw : m, y, hw + 1, 1); }
  x.fillStyle = '#ffffff'; x.fillRect(m - 1, 2, 1, 2);
  gemCache.set(k, c); return c;
}
// Comida (cura): muslo de carne
function drawFood(px, py) {
  const R = (c, a, b, w, h) => { lx.fillStyle = c; lx.fillRect(px + a, py + b, w, h); };
  R('#3a1608', -4, -4, 7, 7); R('#a8461e', -3, -3, 5, 5); R('#d8743a', -3, -3, 2, 2); R('#3a1608', 2, 1, 3, 2); R('#f6efdc', 3, 1, 3, 1); R('#f6efdc', 5, 0, 1, 3);
}
function drawCoin(px, py, t) {
  const w = Math.max(1, Math.round(Math.abs(Math.cos(t * 4)) * 4));
  pxEllipse(lx, px, py, w + 1, 5, OUTLINE); pxEllipse(lx, px, py, w, 4, '#b8860b');
  if (w > 1) { pxEllipse(lx, px, py, w - 1, 3, '#ffd23f'); lx.fillStyle = '#fff6b0'; lx.fillRect(px - w + 1, py - 2, 1, 2); if (w > 2) { lx.fillStyle = '#b8860b'; lx.fillRect(px, py - 1, 1, 3); } }
  else { lx.fillStyle = '#ffd23f'; lx.fillRect(px, py - 3, 1, 6); }
}
const shadowCache = new Map();
function drawShadow(x, y, r) {
  r = Math.max(2, Math.round(r)); let c = shadowCache.get(r);
  if (!c) { c = document.createElement('canvas'); c.width = r * 2 + 2; c.height = Math.ceil(r * .8) + 2; const g = c.getContext('2d'); g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(r + 1, c.height / 2, r, r * .4, 0, 0, TAU); g.fill(); shadowCache.set(r, c); }
  lx.drawImage(c, Math.round(x - camX - r - 1), Math.round(y - camY - c.height / 2));
}
function drawAura(x, y, h, col, t, big) {
  lx.globalCompositeOperation = 'lighter';
  lx.globalAlpha = .22 + Math.sin(t * 12) * .05; lx.fillStyle = col;
  lx.beginPath(); lx.ellipse(Math.round(x - camX), Math.round(y - h * .5 - camY), h * .42, h * .62, 0, 0, TAU); lx.fill();
  const n = big ? 22 : 12;
  for (let i = 0; i < n; i++) {
    const ph = (t * 1.6 + i / n) % 1, px = x + Math.sin(i * 2.4 + t * 4) * h * .32, py = y - ph * h * 1.15;
    lx.globalAlpha = (1 - ph) * .8; lx.fillRect(Math.round(px - camX), Math.round(py - camY), big ? 3 : 2, big ? 4 : 3);
  }
  lx.globalAlpha = 1; lx.globalCompositeOperation = 'source-over';
}
function drawBeam(x, y, ang, len, wd, col, frac) {
  const w = Math.max(1.5, wd * (.35 + .65 * frac) * (1 + Math.sin(performance.now() / 25) * .08));
  lx.save(); lx.translate(Math.round(x - camX), Math.round(y - camY)); lx.rotate(ang);
  lx.fillStyle = col; lx.globalAlpha = .35; lx.fillRect(0, -w * .75, len, w * 1.5);
  lx.globalAlpha = 1; lx.fillStyle = sh(col, -.25); lx.fillRect(0, -w / 2, len, w); lx.fillStyle = col; lx.fillRect(0, -w / 2 + 1, len, Math.max(1, w - 2));
  lx.fillStyle = sh(col, .55); lx.fillRect(0, -w * .3, len, w * .6);
  lx.fillStyle = '#ffffff'; lx.fillRect(0, -w * .12, len, Math.max(1, w * .24));
  lx.fillStyle = col; lx.beginPath(); lx.arc(len, 0, w * .62, 0, TAU); lx.fill();
  lx.beginPath(); lx.arc(0, 0, w * .85, 0, TAU); lx.fill();
  lx.fillStyle = '#ffffff'; lx.beginPath(); lx.arc(0, 0, w * .45, 0, TAU); lx.fill();
  lx.restore();
}
function drawGlowBall(x, y, r, col) {
  lx.globalAlpha = .35; circ(x, y, r * 1.55, col); lx.globalAlpha = 1;
  circ(x, y, r + .6, sh(col, -.35)); circ(x, y, r, col); circ(x, y, r * .55, sh(col, .6)); circ(x - r * .2, y - r * .2, r * .25, '#ffffff');
}
const GEMCOL = [[100, '#ffd23f'], [20, '#ff4a6a'], [5, '#59d66b'], [0, '#5fc8ff']];
function renderWorld(dt) {
  const shk = save.opts.shake ? G.shake : 0;
  camX = Math.round(P.x - VW / 2 + (Math.random() - .5) * shk * 10);
  camY = Math.round(P.y - 12 - VH / 2 + (Math.random() - .5) * shk * 10);
  drawBG(G.stage.id, camX, camY);
  const t = G.t;
  drawCloudShadows(G.stage.id, camX, camY, t);
  // cristales de ki
  for (const g of G.gems) {
    const col = GEMCOL.find(c => g.v >= c[0])[1], gx = Math.round(g.x - camX), gy = Math.round(g.y - camY);
    if (gx < -6 || gy < -6 || gx > VW + 6 || gy > VH + 6) continue;
    const sp = gemSprite(col, g.v >= 20), bob = Math.round(Math.sin(t * 4 + g.x * .3));
    lx.fillStyle = 'rgba(0,0,0,.22)'; lx.fillRect(gx - 2, gy + 3, 5, 1);
    lx.drawImage(sp, gx - (sp.width >> 1), gy - sp.height + 3 + bob);
    if (((t * 1.3 + g.x * .07 + g.y * .05) % 3) < .12) { lx.fillStyle = '#ffffff'; lx.fillRect(gx + 2, gy - sp.height + 2 + bob, 1, 3); lx.fillRect(gx + 1, gy - sp.height + 3 + bob, 3, 1); }
  }
  // objetos
  for (const p of G.picks) {
    const bob = Math.round(Math.sin(p.t * 5) * 1.5), px = Math.round(p.x - camX), py = Math.round(p.y - camY) + bob;
    drawShadow(p.x, p.y + 6, 4);
    if (p.k === 'ball') { lx.globalAlpha = .4 + Math.sin(p.t * 6) * .2; circ(p.x, p.y + bob, 9, '#ff8a1c'); lx.globalAlpha = 1; drawDragonBall(lx, px, py, 5, p.v); }
    else if (p.k === 'capsule') { lx.globalAlpha = .35; circ(p.x, p.y + bob, 12, '#ffd23f'); lx.globalAlpha = 1; lx.drawImage(makeIcon('cap', '#fff'), px - 9, py - 9, 18, 18); }
    else if (p.k === 'zeni') drawCoin(px, py, p.t + p.x);
    else if (p.k === 'food') drawFood(px, py);
    else lx.drawImage(makeIcon(p.k === 'senzu' ? 'senzu' : 'radar', p.k === 'radar' ? '#59d66b' : '#ffd23f'), px - 6, py - 6);
  }
  // sombras
  for (const e of G.enemies) drawShadow(e.x, e.y, e.r + 2);
  if (P.hp > 0) drawShadow(P.x, P.y, 7);
  // aura (Kienzan/aura de ki) por debajo
  const auraW = P.weapons.find(w => w.id === 'aura');
  if (auraW) {
    const R = 30 * wstats(auraW).area, col = auraW.evo ? '#dfe6ff' : '#ffd23f';
    lx.globalAlpha = .18 + Math.sin(t * 6) * .04; circ(P.x, P.y - 6, R, col); lx.globalAlpha = .6;
    lx.strokeStyle = col; lx.lineWidth = 1; lx.beginPath(); lx.arc(Math.round(P.x - camX), Math.round(P.y - 6 - camY), Math.max(.5, R), 0, TAU); lx.stroke(); lx.globalAlpha = 1;
  }
  drawObjsGround(t);
  drawEventWorld(t);
  for (const o of G.objs) if (!o.gone && (o.k === 'crate' || o.k === 'chest' || o.k === 'statue')) drawShadow(o.x, o.y, o.k === 'crate' ? 6 : 8);
  const B = G.buddy && !P.fused && P.hp > 0 ? G.buddy : null;
  if (B) drawShadow(B.x, B.y, 6);
  // entidades por profundidad
  const ents = G.enemies.slice(); if (P.hp > 0) ents.push(P); if (B) ents.push({ bud: B, y: B.y });
  for (const o of G.objs) if (!o.gone && (o.k === 'crate' || o.k === 'chest' || o.k === 'statue') && o.x > camX - 30 && o.x < camX + VW + 30 && o.y > camY - 10 && o.y < camY + VH + 40) ents.push({ obj: o, y: o.y });
  for (const pr of visibleProps(G.stage.id, camX, camY)) ents.push({ prop: pr, y: pr.y });
  ents.sort((a, b) => a.y - b.y);
  for (const e of ents) {
    if (e.obj) { drawObj(e.obj, t); continue; }
    if (e.bud) { drawEnt(e.bud.id, e.bud.x, e.bud.y, sprScale(e.bud.id) * .85, e.bud.face, e.bud.frame, '', false); continue; }
    if (e.prop) {
      const pr = e.prop, ps = getPropSprite(pr.type, G.stage.id, pr.v);
      const behind = P.y < pr.y && P.y > pr.y - ps.c.height && Math.abs(P.x - pr.x) < ps.c.width / 2 + 4;
      drawProp(pr, G.stage.id, camX, camY, behind); continue;
    }
    if (e === P) {
      if (P.aura || P.rage) drawAura(P.x, P.y, 28, P.rage ? P.rage.col : P.aura, t, P.formIdx >= 2 || !!P.rage);
      const blink = P.inv > 0 && Math.floor(t * 20) % 2 === 0;
      if (!blink) drawEnt(P.spr, P.x, P.y, sprScale(P.spr), P.face, P.frame, (G.hurtT || 0) > .1 ? '#ff6a6a' : '', (G.hurtT || 0) > .15);
      if (P.immortal > 0) { lx.globalAlpha = .4; circ(P.x, P.y - 12, 16, '#ffd23f'); lx.globalAlpha = 1; }
      if (P.shieldT > 0 && (P.shieldT > .6 || Math.floor(t * 12) % 2)) { lx.globalAlpha = .28; circ(P.x, P.y - 11, 18, '#9fd8ff'); lx.globalAlpha = .7; lx.strokeStyle = '#e6f6ff'; lx.lineWidth = 1; lx.beginPath(); lx.arc(Math.round(P.x - camX), Math.round(P.y - 11 - camY), 18, 0, TAU); lx.stroke(); lx.globalAlpha = 1; }
      continue;
    }
    if (e.x < camX - 60 || e.x > camX + VW + 60 || e.y < camY - 20 || e.y > camY + VH + 120) continue;
    if (e.boss) drawAura(e.x, e.y, e.h, e.aura, t + e.x, true);
    else if (e.elite) drawAura(e.x, e.y, e.h, '#ff7a3a', t + e.x, false);
    if (e.dash && e.dash.warn > 0 && Math.floor(t * 16) % 2) { drawEnt(e.spr, e.x, e.y, e.scale, e.face, e.frame, '#ff4040'); continue; }
    drawEnt(e.spr, e.x, e.y, e.scale, e.face, e.frame, e.flash > 0 && !e.boss ? 'white' : '', e.flash > 0 && !e.boss);
    if (e.stun > 0 && !e.boss) { lx.fillStyle = '#fff6a0'; lx.fillRect(Math.round(e.x - camX + Math.sin(t * 8) * 4), Math.round(e.y - e.h - camY - 2), 2, 2); }
  }
  // proyectiles
  for (const p of G.projs) {
    if (p.k === 'ball') {
      const sp = Math.hypot(p.vx, p.vy) || 1;
      for (let i = 1; i <= 3; i++) { lx.globalAlpha = .3 / i; circ(p.x - p.vx / sp * i * p.r * .9, p.y - p.vy / sp * i * p.r * .9, p.r * (1 - i * .18), p.col); }
      lx.globalAlpha = 1; drawGlowBall(p.x, p.y, p.r, p.col);
    } else if (p.k === 'beam') drawBeam(P.x, PY(), p.ang, p.len, p.wd, p.col, p.life / p.max);
    else if (p.k === 'disc') {
      const x = Math.round(p.x - camX), y = Math.round(p.y - camY);
      lx.fillStyle = sh(p.col, -.3); lx.beginPath(); lx.ellipse(x, y, p.r + 1, p.r * .45 + 1, 0, 0, TAU); lx.fill();
      lx.fillStyle = p.col; lx.beginPath(); lx.ellipse(x, y, p.r, p.r * .42, 0, 0, TAU); lx.fill();
      lx.fillStyle = '#ffffff'; lx.fillRect(x - Math.round(p.r * .7 * Math.abs(Math.cos(p.spin))), y, Math.max(1, Math.round(p.r * 1.4 * Math.abs(Math.cos(p.spin)))), 1);
    } else if (p.k === 'aoe') {
      const x = Math.round(p.x - camX), y = Math.round(p.y - camY);
      if (p.delay > 0) { lx.strokeStyle = p.col; lx.globalAlpha = .5; lx.lineWidth = 1; tri(x, y, p.r * .9); lx.stroke(); lx.globalAlpha = 1; }
      else { const f = p.life / p.max; lx.globalAlpha = f; lx.fillStyle = p.col; tri(x, y, p.r * (1.2 - f * .3)); lx.fill(); lx.fillStyle = '#ffffff'; tri(x, y, p.r * .5 * f); lx.fill(); lx.globalAlpha = 1; }
    } else if (p.k === 'genki') {
      lx.globalAlpha = .35; circ(p.x, p.y, p.r * 1.35, p.col); lx.globalAlpha = 1;
      circ(p.x, p.y, p.r + 1, '#2a6ab8'); circ(p.x, p.y, p.r, p.col); circ(p.x, p.y, p.r * .72, '#d6f2ff'); circ(p.x - p.r * .25, p.y - p.r * .25, p.r * .3, '#ffffff');
      if (p.charge > 0) for (let i = 0; i < 6; i++) { const a = Math.random() * TAU, d = p.r + rand(6, 26); lx.fillStyle = '#bfe8ff'; lx.fillRect(Math.round(p.x + Math.cos(a) * d - camX), Math.round(p.y + Math.sin(a) * d - camY), 1, 1); }
    }
  }
  // orbitales
  P.weapons.forEach(w => { if (w.id === 'orbital' && w.orbs) w.orbs.forEach(([x, y, r]) => drawGlowBall(x, y, r, w.evo ? '#ffd23f' : WEAPONS.orbital.col)); });
  // efectos
  for (const f of G.fx) {
    if (f.delay > 0) continue;
    const fr = f.life / f.max;
    if (f.k === 'p') { lx.globalAlpha = Math.min(1, fr * 2); lx.fillStyle = f.col; lx.fillRect(Math.round(f.x - camX), Math.round(f.y - camY), f.s, f.s); lx.globalAlpha = 1; }
    else if (f.k === 'ring') { lx.globalAlpha = fr; lx.strokeStyle = f.col; lx.lineWidth = Math.max(1, 4 * fr); lx.beginPath(); lx.arc(Math.round(f.x - camX), Math.round(f.y - camY), Math.max(.5, f.r0 + (f.r1 - f.r0) * (1 - fr)), 0, TAU); lx.stroke(); lx.globalAlpha = 1; }
    else if (f.k === 'boom') {
      const big = f.r > 45, rr = Math.max(.5, f.r * (1.15 - fr * .35));
      if (big) { lx.globalAlpha = fr * .22; circ(f.x, f.y, rr, f.col); lx.globalAlpha = fr; lx.strokeStyle = sh(f.col, .4); lx.lineWidth = 2; lx.beginPath(); lx.arc(Math.round(f.x - camX), Math.round(f.y - camY), rr, 0, TAU); lx.stroke(); lx.globalAlpha = fr * .8; circ(f.x, f.y, 10 * fr, '#ffffff'); }
      else { lx.globalAlpha = fr * .75; circ(f.x, f.y, rr, f.col); lx.globalAlpha = fr * .9; circ(f.x, f.y, rr * .7, sh(f.col, .5)); circ(f.x, f.y, f.r * .4 * fr, '#ffffff'); }
      lx.globalAlpha = 1;
    }
    else if (f.k === 'ray') {
      if (f.kind === 'makanko') {
        drawBeam(f.x, f.y, f.ang, f.len, f.wd * .5, f.col, fr);
        lx.save(); lx.translate(Math.round(f.x - camX), Math.round(f.y - camY)); lx.rotate(f.ang); lx.fillStyle = '#c8a0ff';
        for (let i = 0; i < f.len; i += 2) lx.fillRect(i, Math.round(Math.sin(i * .35 + f.life * 40) * f.wd * 1.1), 2, 2);
        lx.restore();
      } else if (f.kind === 'candy') {
        lx.save(); lx.translate(Math.round(f.x - camX), Math.round(f.y - camY)); lx.rotate(f.ang); lx.globalAlpha = fr;
        for (let i = 0; i < f.len; i += 2) { const o = Math.sin(i * .25 + f.life * 50) * f.wd * .6; lx.fillStyle = f.col; lx.fillRect(i, Math.round(o - 1.5), 2, 3); lx.fillStyle = '#fff'; lx.fillRect(i, Math.round(o), 2, 1); }
        lx.restore(); lx.globalAlpha = 1;
      } else drawBeam(f.x, f.y, f.ang, f.len, f.wd, f.col, fr);
    }
    else if (f.k === 'slash') {
      const x = Math.round(f.x - camX), y = Math.round(f.y - camY);
      lx.globalAlpha = fr;
      if (f.evo) {
        for (let i = 0; i < f.L; i += 2) { const u = i / f.L, yy = Math.sin(u * 9 + f.life * 30) * f.H * .3; const xx = x - f.dir * f.L / 2 + f.dir * i; circ(xx + camX, y + yy + camY, 4 * (1 - u * .5), u > .85 ? '#fff4a0' : '#ffd23f'); }
      } else {
        lx.fillStyle = '#ffffff';
        for (let i = -1; i <= 1; i++) lx.fillRect(f.dir > 0 ? x - f.L / 2 : x - f.L / 2 + 4, y + i * 6, f.L - 4, 2);
        lx.fillStyle = '#ffe9a8'; lx.fillRect(f.dir > 0 ? x + f.L / 2 - 6 : x - f.L / 2, y - 8, 6, 16);
      }
      lx.globalAlpha = 1;
    }
    else if (f.k === 'arc') {
      const x = Math.round(f.x - camX), y = Math.round(f.y - camY), rr = f.r * (1.05 - fr * .15);
      lx.globalAlpha = fr; lx.strokeStyle = f.col; lx.lineWidth = 5; lx.beginPath(); lx.arc(x, y, Math.max(.5, rr), f.ang - f.half, f.ang + f.half); lx.stroke();
      lx.strokeStyle = '#ffffff'; lx.lineWidth = 2; lx.beginPath(); lx.arc(x, y, Math.max(.5, rr - 1), f.ang - f.half * .8, f.ang + f.half * .8); lx.stroke(); lx.globalAlpha = 1;
    }
    else if (f.k === 'hakai') {
      lx.globalAlpha = fr; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + f.life * 12, d = f.r * (1 - fr) + 2; lx.fillStyle = i % 2 ? '#b06bff' : '#f0d8ff'; lx.fillRect(Math.round(f.x + Math.cos(a) * d - camX), Math.round(f.y + Math.sin(a) * d - camY), 2, 2); }
      lx.globalAlpha = 1;
    }
    else if (f.k === 'spark') {
      const x = Math.round(f.x - camX), y = Math.round(f.y - camY), s = Math.round((1 - fr) * 4) + 1, c = f.crit ? '#ffd23f' : '#ffffff';
      lx.fillStyle = c; lx.fillRect(x - s, y, s * 2 + 1, 1); lx.fillRect(x, y - s, 1, s * 2 + 1); if (fr > .5) { lx.fillRect(x - 1, y - 1, 3, 3); }
    }
    else if (f.k === 'poof') {
      lx.globalAlpha = fr * .85; const rr = f.r * (1.2 - fr * .6);
      for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + f.x; circ(f.x + Math.cos(a) * rr * .6, f.y + Math.sin(a) * rr * .45 - (1 - fr) * 4, rr * .45 * (.6 + fr * .4), i % 2 ? '#e8e4f0' : '#c8c4d8'); }
      lx.globalAlpha = 1;
    }
    else if (f.k === 'pillar') { lx.globalCompositeOperation = 'lighter'; lx.globalAlpha = fr * .8; lx.fillStyle = f.col; const w = 26 * fr + 4; lx.fillRect(Math.round(P.x - w / 2 - camX), 0, Math.round(w), Math.round(P.y - camY)); lx.fillStyle = '#ffffff'; lx.fillRect(Math.round(P.x - w / 6 - camX), 0, Math.round(w / 3), Math.round(P.y - camY)); lx.globalAlpha = 1; lx.globalCompositeOperation = 'source-over'; }
    else if (f.k === 'candy') { const x = Math.round(f.x - camX), y = Math.round(f.y - camY - (1 - fr) * 10); lx.globalAlpha = fr; lx.fillStyle = '#ff8ac8'; lx.fillRect(x - 3, y - 2, 6, 4); lx.fillStyle = '#ffd6ec'; lx.fillRect(x - 5, y - 1, 2, 2); lx.fillRect(x + 3, y - 1, 2, 2); lx.globalAlpha = 1; }
  }
  // balas enemigas
  for (const b of G.eprojs) {
    if (b.k === 'beam') {
      if (b.warn > 0) {
        lx.globalAlpha = .35 + .35 * (Math.floor(b.warn * 12) % 2); lx.save(); lx.translate(Math.round(b.x - camX), Math.round(b.y - camY)); lx.rotate(b.ang);
        lx.fillStyle = '#ff2a2a'; lx.fillRect(0, -1, b.len, 2); lx.globalAlpha = .12; lx.fillRect(0, -b.w / 2, b.len, b.w); lx.restore(); lx.globalAlpha = 1;
      } else drawBeam(b.x, b.y, b.ang, b.len, b.w, b.col, b.life / .5);
    } else { circ(b.x, b.y, b.r + 1, OUTLINE); circ(b.x, b.y, b.r, b.col); circ(b.x, b.y, b.r * .45, '#ffffff'); }
  }
  drawAtmosphere(G.stage.id, state === 'play' ? dt : 0);
}
function tri(x, y, r) { lx.beginPath(); lx.moveTo(x, y - r); lx.lineTo(x + r * .87, y + r * .5); lx.lineTo(x - r * .87, y + r * .5); lx.closePath(); }

/* ---------- pantalla (HUD, nombres, números) ---------- */
const FONT = '"Press Start 2P", monospace';
function txt(s, x, y, size, col, align = 'center', stroke = '#05060f') {
  s = L(s);
  ctx.font = `${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(2, size / 3); ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y);
  ctx.fillStyle = col; ctx.fillText(s, x, y);
}
function toS(x, y) { return [(x - camX) * ZOOM, (y - camY) * ZOOM]; }
function renderScreen() {
  const small = SWd < 560, fs = small ? 7 : 8;
  // nombres
  const showAll = save.opts.names;
  for (const e of G.enemies) {
    if (!(e.boss || e.elite || showAll)) continue;
    const [x, y] = toS(e.x, e.y - e.h - 3); if (x < -80 || x > SWd + 80 || y < -20 || y > SHd + 20) continue;
    txt(e.name, x, y, e.boss ? fs + 1 : fs - 1, e.boss ? '#ffd23f' : e.elite ? '#ffb070' : '#e6e9ff');
    if (e.elite && !e.boss) { const w = 30 * ZOOM / 2, fr = Math.max(0, e.hp / e.maxHp); ctx.fillStyle = '#05060f'; ctx.fillRect(x - w / 2 - 1, y + 6, w + 2, 5); ctx.fillStyle = '#ff7a3a'; ctx.fillRect(x - w / 2, y + 7, w * fr, 3); }
  }
  if (P.hp > 0) {
    const [px, py] = toS(P.x, P.y);
    txt(P.name, px, py - 30 * ZOOM * sprScale(P.spr) - 4, fs, '#ffffff');
    const w = 16 * ZOOM, fr = P.hp / P.maxHp;
    ctx.fillStyle = '#05060f'; ctx.fillRect(px - w / 2 - 2, py + 4, w + 4, 7);
    ctx.fillStyle = '#3a0d14'; ctx.fillRect(px - w / 2, py + 6, w, 3);
    ctx.fillStyle = fr > .5 ? '#59d66b' : fr > .25 ? '#ffd23f' : '#e8433a'; ctx.fillRect(px - w / 2, py + 6, w * fr, 3);
  }
  drawObjLabels(fs - 1);
  if (G.buddy && !P.fused && P.hp > 0) { const [bx, by] = toS(G.buddy.x, G.buddy.y); txt(CHAR[G.buddy.id].name, bx, by - 30 * ZOOM * sprScale(G.buddy.id) * .85 - 2, fs - 1, '#9fd8ff'); }
  // números de daño
  for (const n of G.nums) {
    const [x, y] = toS(n.x, n.y); ctx.globalAlpha = Math.min(1, n.life * 3);
    txt(String(n.v), x, y, n.crit ? fs + 3 : fs, n.crit ? '#ffd23f' : '#ffffff'); ctx.globalAlpha = 1;
  }
  for (const f of G.fx) if (f.k === 'text') { const [x, y] = toS(f.x, f.y); ctx.globalAlpha = Math.min(1, f.life * 2); txt(f.t, x, y, fs + 2, f.col); ctx.globalAlpha = 1; }
  // flash / daño
  if (G.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${Math.min(.32, G.flash * .6)})`; ctx.fillRect(0, 0, SWd, SHd); }
  if ((G.hurtT || 0) > 0 || P.hp / P.maxHp < .25) {
    const a = (G.hurtT || 0) > 0 ? .35 : .15 + Math.sin(G.t * 6) * .08;
    const gr = ctx.createRadialGradient(SWd / 2, SHd / 2, Math.min(SWd, SHd) * .3, SWd / 2, SHd / 2, Math.max(SWd, SHd) * .7);
    gr.addColorStop(0, 'rgba(232,67,58,0)'); gr.addColorStop(1, `rgba(232,67,58,${a})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, SWd, SHd);
  }
  drawMoon();
  if (G.spTint) { ctx.globalAlpha = .22 * Math.min(1, G.spTint.t / .4); ctx.fillStyle = G.spTint.col; ctx.fillRect(0, 0, SWd, SHd); ctx.globalAlpha = 1; }
  drawHUD(small);
  drawSpecialBtn(small);
  drawFusionBtn(small);
  drawPointers();
  if (G.tut) { const cur = G.tut.filter(([t]) => G.t >= t && G.t < t + 6).pop(); if (cur) drawTip(cur[1], G.t - cur[0]); }
  if (G.intro) drawIntro(G.intro);
  if (joy.on) {
    ctx.globalAlpha = .3; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(joy.ox, joy.oy, 48, 0, TAU); ctx.fill();
    const dx = joy.x - joy.ox, dy = joy.y - joy.oy, d = Math.hypot(dx, dy), m = Math.min(d, 48) / (d || 1);
    ctx.globalAlpha = .6; ctx.fillStyle = '#ff8a1c'; ctx.beginPath(); ctx.arc(joy.ox + dx * m, joy.oy + dy * m, 20, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  }
}
/* Botón de técnica especial (abajo a la derecha). Tecla 1 o tocarlo. */
let spBtn = null;
const FINE_PTR = matchMedia('(pointer:fine)').matches;
function drawSpecialBtn(small) {
  const sp = SPECIALS[G.cid]; if (!sp) { spBtn = null; return; }
  const r = small ? 30 : 34, x = SWd - r - 16, y = SHd - r - 74, ready = P.spT <= 0, fr = ready ? 1 : clamp(1 - P.spT / sp.cd, 0, 1);
  spBtn = { x, y, r: r + 8 };
  if (ready) { ctx.globalAlpha = .35 + .25 * Math.sin(performance.now() / 180); ctx.fillStyle = sp.col; ctx.beginPath(); ctx.arc(x, y, r + 7, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
  ctx.fillStyle = '#0d0716'; ctx.beginPath(); ctx.arc(x, y, r + 3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a2150'; ctx.beginPath(); ctx.arc(x, y, r - 2, 0, TAU); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r - 4, 0, TAU); ctx.clip();
  const por = getPortrait(P.spr), s = Math.max(1, Math.floor((r * 2 - 8) / 19)); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(por, Math.round(x - 9 * s), Math.round(y - 9.5 * s + 2), 18 * s, 19 * s);
  if (!ready) { ctx.fillStyle = 'rgba(13,7,22,.62)'; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
  ctx.restore();
  ctx.strokeStyle = '#2a3572'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = ready ? '#ffffff' : sp.col; ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + fr * TAU); ctx.stroke();
  if (!ready) txt(String(Math.ceil(P.spT)), x, y + 1, small ? 12 : 14, '#ffffff', 'center');
  txt(ready ? '¡LISTA!' : 'ESPECIAL', x, y - r - 12, small ? 6 : 7, ready ? sp.col : '#8a90b8', 'center');
  if (FINE_PTR) keycap('1', x - r * .78, y - r * .78);
}
// Tecla dibujada en la esquina de los botones redondos
function keycap(k, x, y) {
  ctx.fillStyle = '#05060f'; ctx.fillRect(Math.round(x - 10), Math.round(y - 10), 20, 20);
  ctx.fillStyle = '#e6e9ff'; ctx.fillRect(Math.round(x - 9), Math.round(y - 9), 18, 18);
  ctx.fillStyle = '#b8c0dc'; ctx.fillRect(Math.round(x - 9), Math.round(y + 5), 18, 4);
  txt(k, x, y - 1, 9, '#1a2150', 'center', '#e6e9ff');
}
function hudText(t, x, y, size, col, align = 'left') { txt(t, x, y, size, col, align); }
/* Flechas hacia objetivos fuera de pantalla */
function drawPointers() {
  const tg = [];
  for (const p of G.picks) if (p.k === 'ball' || p.k === 'capsule') tg.push({ x: p.x, y: p.y, k: p.k, v: p.v });
  if (G.boss) tg.push({ x: G.boss.x, y: G.boss.y - G.boss.h / 2, k: 'boss', spr: G.boss.spr });
  // objetos del mapa: la fuente más cercana si vas mal de vida, y altares y cofres cercanos
  const nearestObj = (f, R) => { let b = null, bd = R * R; for (const o of G.objs) { if (o.gone || !f(o)) continue; const d = (o.x - P.x) ** 2 + (o.y - P.y) ** 2; if (d < bd) { bd = d; b = o; } } return b; };
  const fo = P.hp / P.maxHp < .6 ? nearestObj(o => o.k === 'fountain' && o.water > 0, 1100) : null;
  if (fo) tg.push({ x: fo.x, y: fo.y, k: 'fountain' });
  const sh = nearestObj(o => o.k === 'shrine' && !o.done, 650); if (sh) tg.push({ x: sh.x, y: sh.y, k: 'shrine' });
  const ch = nearestObj(o => o.k === 'chest' && G.zeni >= chestCost(), 650); if (ch) tg.push({ x: ch.x, y: ch.y - 6, k: 'chest' });
  const m = 34, top = 150, cx = SWd / 2, cy = SHd / 2;
  for (const t of tg) {
    let [sx, sy] = toS(t.x, t.y);
    if (sx > m && sx < SWd - m && sy > top && sy < SHd - m) continue;
    const bot = 120, dx = sx - cx, dy = sy - cy, k = Math.min(Math.abs((SWd / 2 - m - (dy > 0 && dx > 0 ? 70 : 0)) / (dx || 1e-6)), Math.abs(((dy < 0 ? cy - top : SHd / 2 - bot)) / (dy || 1e-6)));
    const px = cx + dx * k, py = cy + dy * k, a = Math.atan2(dy, dx), pul = 1 + Math.sin(performance.now() / 180) * .08, r = 15 * pul;
    ctx.save(); ctx.translate(px, py); ctx.rotate(a); ctx.fillStyle = t.k === 'boss' ? '#e8433a' : '#ffd23f';
    ctx.beginPath(); ctx.moveTo(r + 10, 0); ctx.lineTo(r + 1, -6); ctx.lineTo(r + 1, 6); ctx.closePath(); ctx.fill(); ctx.restore();
    draw9(ctx, t.k === 'boss' ? 'cardsel' : 'slot', px - r - 3, py - r - 3, (r + 3) * 2, (r + 3) * 2, 1.5);
    if (t.k === 'ball') drawDragonBall(ctx, px, py, 8, t.v);
    else if (t.k === 'capsule') ctx.drawImage(makeIcon('cap', '#fff'), px - 10, py - 10, 20, 20);
    else if (t.k === 'fountain') ctx.drawImage(makeIcon('heal', '#5fd0ff'), px - 10, py - 10, 20, 20);
    else if (t.k === 'shrine') ctx.drawImage(makeIcon('kiai', '#b06bff'), px - 10, py - 10, 20, 20);
    else if (t.k === 'chest') ctx.drawImage(makeIcon('zeni', '#ffd23f'), px - 10, py - 10, 20, 20);
    else { const pr = getPortrait(t.spr); ctx.drawImage(pr, px - 9 * 1.2, py - 11, 18 * 1.2, 19 * 1.2); }
    const d = Math.round(Math.hypot(t.x - P.x, t.y - P.y) / 10);
    txt(d + 'm', px, py + r + 10, 6, '#ffffff', 'center');
  }
}
/* Consejos de la primera partida */
function drawTip(text, age) {
  text = L(text);
  const a = Math.min(1, age * 3, (6 - age) * 2); if (a <= 0) return;
  ctx.globalAlpha = a; ctx.font = '21px VT323, monospace';
  const w = Math.min(SWd - 24, ctx.measureText(text).width + 50), lines = ctx.measureText(text).width > w - 40 ? 2 : 1, h = 34 + lines * 20, x = (SWd - w) / 2, y = SHd - h - 74;
  draw9(ctx, 'panel', x, y, w, h, 2);
  ctx.fillStyle = '#f6efdc'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (lines === 1) ctx.fillText(text, SWd / 2, y + h / 2);
  else { const words = text.split(' '), half = Math.ceil(words.length / 2); ctx.fillText(words.slice(0, half).join(' '), SWd / 2, y + h / 2 - 10); ctx.fillText(words.slice(half).join(' '), SWd / 2, y + h / 2 + 10); }
  ctx.globalAlpha = 1;
}
/* Escenas: presentación de jefe (VS) y transformación */
function drawIntro(it) {
  const bn = $('#banner'); if (bn.classList.contains('on')) bn.classList.remove('on');
  const p = 1 - it.t / it.max, ease = x => 1 - Math.pow(1 - clamp(x, 0, 1), 3), fade = Math.min(1, p * 5, it.t * 4);
  ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = `rgba(6,4,18,${.72 * fade})`; ctx.fillRect(0, 0, SWd, SHd);
  const big = Math.max(4, Math.floor(Math.min(SWd, SHd) / 95));
  if (it.kind === 'boss') {
    const bh = Math.min(SHd * .42, 260), by = SHd / 2 - bh / 2, sl = ease(p * 2.2);
    ctx.globalAlpha = fade;
    ctx.fillStyle = '#1e3a8a'; ctx.beginPath(); ctx.moveTo(-SWd * (1 - sl), by); ctx.lineTo(SWd * .55 - SWd * (1 - sl), by); ctx.lineTo(SWd * .45 - SWd * (1 - sl), by + bh); ctx.lineTo(-SWd * (1 - sl), by + bh); ctx.fill();
    ctx.fillStyle = '#8a1a24'; ctx.beginPath(); ctx.moveTo(SWd * .55 + SWd * (1 - sl), by); ctx.lineTo(SWd * 2, by); ctx.lineTo(SWd * 2, by + bh); ctx.lineTo(SWd * .45 + SWd * (1 - sl), by + bh); ctx.fill();
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(0, by - 4, SWd, 4); ctx.fillRect(0, by + bh, SWd, 4);
    const ps = getPortrait(P.spr), bs = getPortrait(it.spr), sc = Math.floor(bh * .82 / 19);
    ctx.drawImage(ps, SWd * .26 - 9 * sc - SWd * (1 - sl), by + bh - 19 * sc, 18 * sc, 19 * sc);
    ctx.save(); ctx.translate(SWd * .74 + 9 * sc + SWd * (1 - sl), by + bh - 19 * sc); ctx.scale(-1, 1); ctx.drawImage(bs, 0, 0, 18 * sc, 19 * sc); ctx.restore();
    const vs = ease((p - .25) * 4), vsz = Math.round(Math.min(SWd, SHd) * .14 * (2 - vs));
    if (p > .25) { ctx.globalAlpha = fade * vs; txt('VS', SWd / 2, SHd / 2, vsz, Math.floor(p * 20) % 2 ? '#ffd23f' : '#ffffff', 'center'); }
    ctx.globalAlpha = fade;
    txt(P.name.toUpperCase(), SWd * .26, by - 22, SWd < 560 ? 8 : 12, '#9ad0ff', 'center');
    txt(it.name.toUpperCase(), SWd * .74, by - 22, SWd < 560 ? 9 : 14, '#ff9a8a', 'center');
    txt(it.final ? '¡JEFE FINAL!' : it.saga, SWd / 2, by + bh + 26, SWd < 560 ? 8 : 11, it.final ? '#ffd23f' : '#ffffff', 'center');
  } else {
    const cx = SWd / 2, cy = SHd / 2, R = Math.hypot(SWd, SHd), rot = performance.now() / 900;
    ctx.globalAlpha = .35 * fade; ctx.fillStyle = it.col || '#ffd23f';
    for (let i = 0; i < 18; i++) { const a = rot + i / 18 * TAU; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.lineTo(cx + Math.cos(a + .12) * R, cy + Math.sin(a + .12) * R); ctx.fill(); }
    ctx.globalAlpha = fade;
    const s = getSprite(it.spr, 0, false), sc = big * (1 + (1 - ease(p * 3)) * .6);
    if (p < .18) { ctx.globalAlpha = 1 - p / .18; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, SWd, SHd); ctx.globalAlpha = fade; }
    ctx.drawImage(s, Math.round(cx - s.width * sc / 2), Math.round(cy - s.height * sc / 2 - 20), Math.round(s.width * sc), Math.round(s.height * sc));
    txt(it.name.toUpperCase(), cx, cy + s.height * big / 2 + 20, SWd < 560 ? 10 : 16, '#ffd23f', 'center');
    txt(it.top || '¡TRANSFORMACIÓN!', cx, cy - s.height * big / 2 - 40, SWd < 560 ? 8 : 10, '#ffffff', 'center');
  }
  ctx.restore(); ctx.globalAlpha = 1;
}
function drawHUD(small) {
  ctx.imageSmoothingEnabled = false;
  const S = small ? 1.5 : 2, f = small ? .78 : 1;
  // --- barra de experiencia
  const bh = Math.round(22 * f);
  draw9(ctx, 'slot', 0, 0, SWd, bh, S);
  const ix = 4 * S, iy = 4 * S, iw = SWd - 8 * S, ih = bh - 8 * S, fr = clamp(G.xp / G.xpNext, 0, 1);
  const gx = ctx.createLinearGradient(0, iy, 0, iy + ih); gx.addColorStop(0, '#9fd8ff'); gx.addColorStop(.45, '#3aa0ff'); gx.addColorStop(1, '#1e5aa8');
  ctx.fillStyle = gx; ctx.fillRect(ix, iy, iw * fr, ih);
  ctx.fillStyle = 'rgba(13,7,22,.5)'; for (let i = 1; i < 10; i++) ctx.fillRect(ix + iw * i / 10, iy, 2, ih);
  txt(`NV ${G.lvl}`, SWd - 12, bh / 2 + 1, small ? 7 : 9, '#ffffff', 'right');
  // --- ficha del guerrero
  const px0 = 8, py0 = bh + 6, pw = Math.round(240 * f), ph = Math.round(68 * f);
  draw9(ctx, 'panel', px0, py0, pw, ph, S);
  const ps = Math.round(48 * f), ppx = px0 + 9 * S / 2 + 2, ppy = py0 + (ph - ps) / 2;
  const rc = (RAR[CHAR[G.cid].rar] || RAR.C).col;
  draw9(ctx, 'slot', ppx, ppy, ps, ps, S);
  const grd = ctx.createRadialGradient(ppx + ps / 2, ppy + ps * .7, 2, ppx + ps / 2, ppy + ps * .7, ps * .6); grd.addColorStop(0, rc + '88'); grd.addColorStop(1, rc + '00');
  ctx.fillStyle = grd; ctx.fillRect(ppx + 3 * S, ppy + 3 * S, ps - 6 * S, ps - 6 * S);
  const por = getPortrait(P.spr), psc = Math.max(1, Math.round((ps - 6 * S) / 19));
  ctx.save(); ctx.beginPath(); ctx.rect(ppx + 3 * S, ppy + 3 * S, ps - 6 * S, ps - 6 * S); ctx.clip();
  ctx.drawImage(por, Math.round(ppx + ps / 2 - 9 * psc), Math.round(ppy + ps - 3 * S - 19 * psc + 2), 18 * psc, 19 * psc); ctx.restore();
  const tx = ppx + ps + 8;
  txt(P.name.length > 18 ? P.name.slice(0, 17) + '…' : P.name, tx, py0 + ph * .32, small ? 7 : 9, '#ffd23f', 'left');
  const hbw = px0 + pw - tx - 10, hbh = Math.round(16 * f), hby = py0 + ph * .52;
  draw9(ctx, 'hp', tx, hby, hbw, hbh, S / 2 + .5);
  const hfr = clamp(P.hp / P.maxHp, 0, 1), hx = tx + 3, hy = hby + 3, hw = hbw - 6, hh = hbh - 6;
  const hc = hfr > .5 ? ['#a8f0b0', '#59d66b', '#2a8a3a'] : hfr > .25 ? ['#fff0a0', '#ffd23f', '#b8860b'] : ['#ffb0a8', '#e8433a', '#8a1a14'];
  const gh = ctx.createLinearGradient(0, hy, 0, hy + hh); gh.addColorStop(0, hc[0]); gh.addColorStop(.4, hc[1]); gh.addColorStop(1, hc[2]);
  ctx.fillStyle = gh; ctx.fillRect(hx, hy, hw * hfr, hh);
  ctx.fillStyle = 'rgba(13,7,22,.35)'; for (let i = 1; i < 10; i++) ctx.fillRect(hx + hw * i / 10, hy, 1, hh);
  txt(`${Math.ceil(P.hp)}/${P.maxHp}`, tx + hbw / 2, hby + hbh / 2 + 1, small ? 6 : 7, '#ffffff', 'center');
  if (P.revive > 0) { ctx.drawImage(makeIcon('senzu', '#59d66b'), tx, py0 + ph - 14 * f - 4, 12 * f, 12 * f); txt('x' + P.revive, tx + 14 * f, py0 + ph - 8 * f - 4, 6, '#a8f0b0', 'left'); }
  // --- ranuras de ataques y pasivas
  const is = Math.round(32 * f), gap = 3;
  P.weapons.forEach((w, i) => {
    const x = 8 + i * (is + gap), y = py0 + ph + 6, d = WEAPONS[w.id];
    draw9(ctx, w.evo ? 'evo' : 'slot', x, y, is, is, S / 2 + .5);
    ctx.drawImage(makeIcon(d.icon, w.evo ? '#ffd23f' : d.col), x + 5, y + 5, is - 10, is - 10);
    txt(w.evo ? '★' : String(w.lvl), x + is - 5, y + is - 5, small ? 6 : 7, w.evo ? '#ffd23f' : '#ffffff', 'center');
  });
  P.passives.forEach((p, i) => {
    const s2 = is - 6, x = 8 + i * (s2 + gap), y = py0 + ph + 10 + is, d = PASSIVES[p.id];
    draw9(ctx, 'slot', x, y, s2, s2, S / 2 + .5);
    ctx.drawImage(makeIcon(d.icon, d.col), x + 5, y + 5, s2 - 10, s2 - 10);
    txt(String(p.lvl), x + s2 - 5, y + s2 - 5, 6, '#ffffff', 'center');
  });
  // --- tiempo
  const tw = Math.round(118 * f), th = Math.round(36 * f), tX = SWd / 2 - tw / 2, tY = small ? py0 + ph + is * 2 + 24 : bh + 6;
  draw9(ctx, 'panel', tX, tY, tw, th, S);
  txt(fmtTime(G.t), SWd / 2, tY + th / 2 + 1, small ? 12 : 15, G.t >= 540 ? '#ff8a7a' : '#ffffff', 'center');
  // --- bajas, zenis y Bolas de Dragón
  const rw = Math.round(150 * f), rh = Math.round(56 * f), rX = SWd - rw - 8, rY = bh + 6;
  draw9(ctx, 'panel', rX, rY, rw, rh, S);
  ctx.drawImage(makeIcon('skull', '#fff'), rX + 12, rY + rh * .3 - 7, 14, 14);
  txt(fmtNum(G.kills), rX + rw - 14, rY + rh * .3, small ? 8 : 10, '#e6e9ff', 'right');
  ctx.drawImage(makeIcon('zeni', '#ffd23f'), rX + 12, rY + rh * .68 - 7, 14, 14);
  txt(fmtNum(G.zeni), rX + rw - 14, rY + rh * .68, small ? 8 : 10, '#ffd23f', 'right');
  const bY = rY + rh + 4, bH = Math.round(30 * f);
  draw9(ctx, 'slot', rX, bY, rw, bH, S / 2 + .5);
  for (let i = 0; i < 7; i++) {
    const bx = rX + 12 + i * ((rw - 24) / 6), by = bY + bH / 2;
    if (G.balls.includes(i + 1)) drawDragonBall(ctx, bx, by, 6 * f, i + 1);
    else { ctx.fillStyle = 'rgba(80,90,140,.35)'; ctx.beginPath(); ctx.arc(bx, by, 5 * f, 0, TAU); ctx.fill(); }
  }
  // --- jefe
  const nb = G.stage.bosses[G.bossIdx];
  const byy = small ? tY + th + 8 : tY + th + 6;
  if (G.boss) {
    const b = G.boss, w = Math.min(500, SWd * (small ? .94 : .5)), h = Math.round(46 * f), x = (SWd - w) / 2;
    draw9(ctx, 'panel', x, byy, w, h, S);
    const bs = h - 8; draw9(ctx, 'slot', x + 6, byy + 4, bs, bs, S / 2 + .5);
    const bp = getPortrait(b.spr), bsc = Math.max(1, Math.round((bs - 6) / 19));
    ctx.save(); ctx.beginPath(); ctx.rect(x + 9, byy + 7, bs - 6, bs - 6); ctx.clip(); ctx.drawImage(bp, Math.round(x + 6 + bs / 2 - 9 * bsc), Math.round(byy + 4 + bs - 19 * bsc), 18 * bsc, 19 * bsc); ctx.restore();
    const bx = x + bs + 14, bw = w - bs - 26;
    txt(b.name.toUpperCase(), bx, byy + h * .32, small ? 7 : 9, '#ffd23f', 'left');
    const fr2 = Math.max(0, b.hp / b.maxHp), by2 = byy + h * .52, bh2 = Math.round(12 * f);
    ctx.fillStyle = '#0d0716'; ctx.fillRect(bx - 2, by2 - 2, bw + 4, bh2 + 4); ctx.fillStyle = '#3a0d14'; ctx.fillRect(bx, by2, bw, bh2);
    const gb = ctx.createLinearGradient(0, by2, 0, by2 + bh2); gb.addColorStop(0, '#ff9a8a'); gb.addColorStop(.4, '#e8433a'); gb.addColorStop(1, '#8a1a14');
    ctx.fillStyle = gb; ctx.fillRect(bx, by2, bw * fr2, bh2);
  } else if (nb && nb[0] - G.t < 10 && nb[0] - G.t > 0) txt(`¡${BOSSES[nb[1]].name.toUpperCase()} SE ACERCA!`, SWd / 2, byy + 12, small ? 8 : 10, '#ff7a6a', 'center');
  drawRunInfo(small, G.boss ? byy + Math.round(46 * f) + 6 : nb && nb[0] - G.t < 10 && nb[0] - G.t > 0 ? byy + 24 : byy);
}

/* ---------- fondo de menús: paisaje con parallax ---------- */
const menu = { stage: 'saiyan', walkers: [], t: 0, pano: null, kin: null };
const PARADE = ['goku', 'vegeta', 'gohan', 'piccolo', 'krilin', 'trunks', 'goten', 'a18', 'freezer', 'cell', 'buu', 'broly', 'saibaman', 'raditz', 'nappa', 'ginyu', 'satan', 'goku_ssj', 'vegeta_blue', 'jiren', 'hit', 'kidbuu', 'beerus', 'whis', 'vegito', 'gogeta_blue', 'goku_rose', 'gotenks', 'bardock', 'caulifla', 'cooler', 'videl', 'pan'];
function periodicH(x, L, seed, oct) { let h = 0; for (let i = 1; i <= oct; i++) { const k = i * 2 + Math.floor(hash(i, seed) * 3); h += Math.sin(TAU * k * x / L + hash(seed, i) * TAU) / (i * 1.3); } return h; }
function buildPano() {
  const W = VW, H = VH, L = W * 2, hor = Math.round(H * .64), pano = { W, H, hor, layers: [] };
  const sky = document.createElement('canvas'); sky.width = W; sky.height = H; const sx = sky.getContext('2d');
  const bands = ['#120c34', '#1d1450', '#2c1d66', '#47287c', '#6e3486', '#a24684', '#d8607a', '#ff8a6a', '#ffb878', '#ffd99a'];
  const id = sx.createImageData(W, H), d = id.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = Math.min(.999, Math.max(0, y / hor)) * (bands.length - 1) + BAYER[(y & 3) * 4 + (x & 3)] * .9;
    const c = hexRgb(bands[clamp(Math.floor(t), 0, bands.length - 1)]), o = (y * W + x) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
  }
  sx.putImageData(id, 0, 0);
  for (let i = 0; i < 70; i++) { const x = hash(i, 1) * W, y = hash(i, 2) * hor * .55; sx.fillStyle = hash(i, 3) > .7 ? '#ffffff' : '#c8b8ff'; sx.fillRect(Math.round(x), Math.round(y), 1, 1); }
  const sunX = Math.round(W * .7), sunY = Math.round(hor - H * .1), sr = Math.round(H * .13);
  sx.globalAlpha = .25; pxEllipse(sx, sunX, sunY, sr + 8, sr + 8, '#ffd99a'); sx.globalAlpha = 1;
  pxEllipse(sx, sunX, sunY, sr, sr, '#fff0b8'); pxEllipse(sx, sunX - 2, sunY - 2, sr - 4, sr - 4, '#fffbe6');
  for (let i = 0; i < 4; i++) { sx.fillStyle = bands[7]; sx.fillRect(sunX - sr, sunY + sr * .25 + i * 5, sr * 2 + 1, 1 + i); }
  pano.sky = sky;
  // capas de montañas
  const layer = (seed, baseY, amp, col, colTop, extra) => {
    const c = document.createElement('canvas'); c.width = L; c.height = H; const x = c.getContext('2d');
    for (let xx = 0; xx < L; xx++) {
      const h = Math.round(baseY - periodicH(xx, L, seed, 5) * amp);
      x.fillStyle = col; x.fillRect(xx, h, 1, H - h); x.fillStyle = colTop; x.fillRect(xx, h, 1, 2);
    }
    if (extra) extra(x, L);
    return c;
  };
  pano.layers.push({ c: layer(3, hor - H * .1, H * .07, '#3a2a6e', '#5a46a0', (x, L) => {
    const lx_ = Math.round(L * .2), ly = Math.round(H * .26);
    x.fillStyle = '#4a3a86'; x.fillRect(lx_ - 1, ly, 3, Math.round(H * .3)); pxEllipse(x, lx_, ly, 16, 4, '#6a5aa8'); pxEllipse(x, lx_, ly - 2, 14, 3, '#8a7ac8');
    pxEllipse(x, lx_ - 4, ly - 6, 5, 4, '#9a8ad8'); x.fillStyle = '#5a4a96'; for (const dx of [6, 10]) { x.fillRect(lx_ + dx, ly - 9, 1, 7); pxEllipse(x, lx_ + dx, ly - 10, 3, 2, '#5a4a96'); }
  }), sp: 3 });
  pano.layers.push({ c: layer(7, hor - H * .02, H * .06, '#251a50', '#3e2f78', (x, L) => {
    for (let i = 0; i < 9; i++) { const sx_ = Math.round(hash(i, 9) * L), sh = Math.round(H * (.1 + hash(i, 8) * .12)), base = hor + 4, w = 12 + Math.round(hash(i, 7) * 10);
      for (let y = 0; y < sh; y++) { const ww = Math.round(w * (.5 + y / sh * .5)); x.fillStyle = '#251a50'; x.fillRect(sx_ - (ww >> 1), base - sh + y, ww, 1); x.fillStyle = '#3e2f78'; x.fillRect(sx_ - (ww >> 1), base - sh + y, 1, 1); }
      pxEllipse(x, sx_, base - sh, w * .7, 2, '#3e2f78'); }
  }), sp: 8 });
  // suelo cercano
  const g = document.createElement('canvas'); g.width = L; g.height = H; const gx = g.getContext('2d'), gTop = Math.round(H * .74);
  const gid = gx.createImageData(L, H - gTop), gd = gid.data, gpal = ['#2a5a2a', '#34702e', '#3f8a38', '#4e9e42', '#62b250'].map(hexRgb);
  for (let y = 0; y < H - gTop; y++) for (let xx = 0; xx < L; xx++) {
    const v = vnoise(xx / 14, y / 6, 4) * .7 + (y / (H - gTop)) * .25 + BAYER[(y & 3) * 4 + (xx & 3)] * .2;
    const c = gpal[clamp(4 - Math.floor(v * 5), 0, 4)], o = (y * L + xx) * 4; gd[o] = c[0]; gd[o + 1] = c[1]; gd[o + 2] = c[2]; gd[o + 3] = 255;
  }
  gx.putImageData(gid, 0, gTop);
  for (let xx = 0; xx < L; xx++) { const bump = Math.round(Math.sin(xx * .21) * 1.2 + Math.sin(xx * .05) * 2); gx.clearRect(xx, gTop - 4, 1, 4 + Math.min(0, bump)); gx.fillStyle = '#7ad06a'; gx.fillRect(xx, gTop + Math.max(0, bump), 1, 1); }
  for (let i = 0; i < 90; i++) { const xx = Math.round(hash(i, 21) * L), yy = gTop + 4 + Math.round(hash(i, 22) * (H - gTop - 6)); gx.fillStyle = '#2a5a2a'; gx.fillRect(xx, yy - 3, 1, 3); gx.fillRect(xx + 2, yy - 2, 1, 2); gx.fillStyle = '#8ae07a'; gx.fillRect(xx, yy - 3, 1, 1); }
  for (let i = 0; i < 18; i++) { const xx = Math.round(hash(i, 31) * L), yy = gTop + 6 + Math.round(hash(i, 32) * (H - gTop - 10)), c = ['#ff6a8a', '#ffe14a', '#ffffff'][i % 3]; gx.fillStyle = c; gx.fillRect(xx - 1, yy, 3, 1); gx.fillRect(xx, yy - 1, 1, 3); }
  pano.ground = g; pano.gTop = gTop;
  // nubes
  pano.clouds = [];
  for (let i = 0; i < 3; i++) {
    const c = document.createElement('canvas'), w = 40 + i * 14, h = 16 + i * 4; c.width = w; c.height = h; const x = c.getContext('2d');
    for (let k = 0; k < 6; k++) { const cx = 8 + hash(k, i + 40) * (w - 16), cy = h - 6 - hash(k, i + 41) * (h * .5), r = 5 + hash(k, i + 42) * 6; pxEllipse(x, cx, cy, r, r * .8, '#e8b8c8'); }
    for (let k = 0; k < 6; k++) { const cx = 8 + hash(k, i + 40) * (w - 16), cy = h - 7 - hash(k, i + 41) * (h * .5), r = 5 + hash(k, i + 42) * 6; pxEllipse(x, cx - 1, cy - 1, r - 2, r * .6, '#fff0f4'); }
    x.clearRect(0, h - 3, w, 3);
    pano.clouds.push({ c, y: Math.round(H * (.08 + i * .1)), sp: 4 + i * 3, off: hash(i, 50) * W });
  }
  return pano;
}
function kintonSprite() {
  if (menu.kin) return menu.kin;
  const c = document.createElement('canvas'); c.width = 30; c.height = 12; const x = c.getContext('2d');
  pxEllipse(x, 15, 7, 12, 4, '#e8a820'); pxEllipse(x, 8, 6, 5, 4, '#ffd23f'); pxEllipse(x, 16, 5, 6, 4, '#ffd23f'); pxEllipse(x, 23, 6, 5, 3, '#ffd23f'); pxEllipse(x, 14, 4, 3, 2, '#fff2a0');
  menu.kin = outlineCanvas(c); return menu.kin;
}
function renderMenuBG(dt) {
  menu.t += dt; const t = menu.t;
  if (!menu.pano || menu.pano.W !== VW || menu.pano.H !== VH) menu.pano = buildPano();
  const pn = menu.pano; camX = 0; camY = 0;
  lx.drawImage(pn.sky, 0, 0);
  for (const cl of pn.clouds) { const xx = ((cl.off + t * cl.sp) % (VW + cl.c.width)) - cl.c.width; lx.drawImage(cl.c, Math.round(xx), cl.y); }
  // Goku en la nube Kinton
  const kt = (t % 16) / 16, kx = -40 + kt * (VW + 80), ky = Math.round(VH * .3 + Math.sin(t * 2) * 3);
  if (kt < .9) {
    for (let i = 1; i < 8; i++) { lx.globalAlpha = .5 - i * .06; lx.fillStyle = '#ffe680'; lx.fillRect(Math.round(kx - i * 7), ky + 5 + (i % 2), 5, 2); } lx.globalAlpha = 1;
    const gs = getSprite('goku', 0, false); lx.drawImage(gs, 0, 0, 18, 22, Math.round(kx - 9), ky - 16, 18, 22); lx.drawImage(kintonSprite(), Math.round(kx - 15), ky);
  }
  for (const L of pn.layers) { const o = Math.round((t * L.sp) % L.c.width); lx.drawImage(L.c, -o, 0); lx.drawImage(L.c, L.c.width - o, 0); }
  const go = Math.round((t * 22) % pn.ground.width); lx.drawImage(pn.ground, -go, 0); lx.drawImage(pn.ground, pn.ground.width - go, 0);
  // guerreros caminando
  if (menu.walkers.length < 6 && Math.random() < dt * 1.2) {
    const dir = Math.random() < .5 ? 1 : -1, id = pick(PARADE);
    menu.walkers.push({ id, x: dir > 0 ? -20 : VW + 20, y: pn.gTop + 10 + Math.random() * (VH - pn.gTop - 12), dir, sp: rand(16, 30), ft: 0, fr: 0 });
  }
  menu.walkers.sort((a, b) => a.y - b.y);
  for (const w of menu.walkers) {
    w.x += (w.dir * w.sp - 22) * dt; w.ft += dt; if (w.ft > .16) { w.ft = 0; w.fr ^= 1; }
    drawShadow(w.x, w.y, 7);
    if (SPR[w.id].aura) drawAura(w.x, w.y, 28 * sprScale(w.id), SPR[w.id].aura, t + w.x, false);
    drawEnt(w.id, w.x, w.y, sprScale(w.id), w.dir, w.fr);
  }
  menu.walkers = menu.walkers.filter(w => w.x > -60 && w.x < VW + 60);
  // héroes del título
  if (state === 'title' && VW > 330) {
    const sc = Math.min(3, VH / 90), gy = VH - 6;
    [['goku_ssj', VW * .14, 1], ['vegeta_ssj', VW * .86, -1]].forEach(([id, x, f]) => {
      drawShadow(x, gy, 10 * sc); drawAura(x, gy, 28 * sc, '#ffd43a', t * 1.2 + x, true); drawEnt(id, x, gy + Math.round(Math.sin(t * 2 + x) * 1.5), sc, f, 0);
    });
  }
}
function render(dt) {
  lx.imageSmoothingEnabled = false;
  const inGame = G && P && ['play', 'levelup', 'paused', 'shenron', 'capsule', 'over', 'shrine'].includes(state);
  if (inGame) renderWorld(dt); else renderMenuBG(dt);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(lc, 0, 0, VW * ZOOM, VH * ZOOM);
  if (inGame) renderScreen();
  if (state === 'shenron') drawShenron(performance.now() / 1000);
}

/* =================== INTERFAZ =================== */
const SCREENS = ['cards', 'shrine', 'title', 'select', 'stages', 'shop', 'dex', 'opts', 'account', 'gacha', 'reveal', 'levelup', 'pause', 'over', 'shenron', 'capsule', 'missions', 'rank'];
function showScreen(id) {
  SCREENS.forEach(s => $('#' + s).classList.toggle('on', s === id));
  $('#pausebtn').style.display = id ? 'none' : 'block';
}
let selChar = save.lastChar && CHAR[save.lastChar] ? save.lastChar : 'goku', optsReturn = 'title';
function go(id) {
  sfx('click');
  state = id; showScreen(id);
  if (id === 'title') renderTitle();
  if (id === 'select') renderSelect();
  if (id === 'stages') renderStages();
  if (id === 'shop') renderShop();
  if (id === 'dex') renderDex();
  if (id === 'opts') renderOpts();
  if (id === 'account') renderAccount();
  if (id === 'gacha') renderShop2();
  if (id === 'missions') renderMissions();
  if (id === 'rank') renderRank();
  if (id === 'cards') renderCards();
}
document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => {
  const to = b.dataset.back;
  if (b.closest('#opts') && optsReturn === 'pause') { state = 'paused'; showScreen('pause'); renderPause(); return; }
  go(to);
}));
document.addEventListener('pointerdown', () => audioInit(), { once: false, capture: true });

function renderTitle() {
  const n = CHARS.filter(isUnlocked).length;
  const sagas = Object.keys(save.cleared).filter(k => STAGES.some(s => s.id === k)).length, ts = $('#titleStats'); ts.innerHTML = '';
  [['zeni', '#ffd23f', fmtNum(save.zeni), 'zenis'], ['user', '#59d66b', `${n}/${CHARS.length}`, 'guerreros'], ['book', '#3aa0ff', `${sagas}/${STAGES.length}`, 'sagas'], ['skull', '#fff', fmtNum(save.kills), 'bajas'], ['lvl', '#9fd8ff', 'Nv ' + save.acc.lvl, 'cuenta']].forEach(([ic, col, v, l]) => {
    const ch = document.createElement('span'); ch.className = 'chip'; ch.appendChild(iconCanvas(ic, col, 18)); ch.insertAdjacentHTML('beforeend', `<span><b>${v}</b> ${l}</span>`); ts.appendChild(ch);
  });
  $('#subDex').textContent = `${n}/${CHARS.length} guerreros conseguidos`;
  if (typeof dayKey === 'function') { const c = claimable(); $('#misBadge').hidden = !c; $('#subMis').textContent = c ? `¡${c} premio${c > 1 ? 's' : ''} por recoger!` : `Nivel de cuenta ${save.acc.lvl} · logros`; }
  if (typeof giftState === 'function') { const g = giftState().can; $('#giftBadge').hidden = !g; $('#subShop').textContent = g ? 'Tu regalo diario te espera' : 'Ofertas de hoy y cajas'; }
  $('#subAcct').textContent = ACCT && ACCT.user ? ACCT.user.name : 'Guarda tu partida';
  menu.stage = 'saiyan';
  if (ACCT) renderAccountBadge();
}
$('#bPlay').onclick = () => { audioInit(); go('select'); };
$('#bDex').onclick = () => go('dex');
$('#bMis').onclick = () => { audioInit(); go('missions'); };
$('#bRank').onclick = () => { audioInit(); go('rank'); };
$('#bCards').onclick = () => { audioInit(); go('cards'); };
$('#bGacha').onclick = () => { audioInit(); go('gacha'); };
$('#bShop').onclick = () => go('shop');
$('#bOpts').onclick = () => { optsReturn = 'title'; go('opts'); };

/* ---------- selección de personaje ---------- */
function statTags(c) {
  const st = Math.max(1, starsOf(c.id)), rr = RAR[c.rar];
  const t = [`Vida ${Math.round(c.hp * (1 + (st - 1) * .05) + (c.mods.maxHp || 0))}`, `+${Math.round((rr.might + (st - 1) * .06) * 100)}% daño (rareza${st > 1 ? ' y estrellas' : ''})`], m = Object.assign({}, c.mods || {}); delete m.maxHp;
  const L = { might: 'daño', area: 'área', spd: 'velocidad', cd: 'recarga', luck: 'suerte', greed: 'zenis', growth: 'experiencia', crit: 'crítico', magnet: 'atracción' };
  for (const k in m) {
    if (k === 'regen') t.push(`Regenera ${m[k]}/s`);
    else if (k === 'amount') t.push(`+${m[k]} proyectil`);
    else if (k === 'maxHp') t.push(`+${m[k]} vida`);
    else if (k === 'cd') t.push(`${m[k] > 0 ? '-' : '+'}${Math.round(Math.abs(m[k]) * 100)}% recarga`);
    else t.push(`${m[k] > 0 ? '+' : ''}${Math.round(m[k] * 100)}% ${L[k] || k}`);
  }
  return t;
}
let charFilter = 'all';
function paintPedestal(cv, c, un) {
  const x = cv.getContext('2d'), W = cv.width, H = cv.height, col = (RAR[c.rar] || RAR.C).col; x.imageSmoothingEnabled = false; x.clearRect(0, 0, W, H);
  const g = x.createRadialGradient(W / 2, H * .62, 2, W / 2, H * .62, W * .55); g.addColorStop(0, col + 'aa'); g.addColorStop(1, col + '00'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; x.fillStyle = col + '44'; x.fillRect(Math.round(W / 2 + Math.cos(a) * W * .42), Math.round(H * .5 + Math.sin(a) * H * .35), 1, 3); }
  const pb = H - 8; pxEllipse(x, W / 2, pb, 26, 6, '#0d0716'); pxEllipse(x, W / 2, pb - 1, 25, 5, '#5a4a7a'); pxEllipse(x, W / 2, pb - 2, 24, 4, '#8a7ab0'); pxEllipse(x, W / 2, pb - 2, 20, 3, '#a898d0');
  x.fillStyle = col; x.fillRect(W / 2 - 22, pb, 44, 1);
  const s = getSprite(c.id, 0, false), sc = 2; x.save(); if (!un) x.filter = 'grayscale(.8) brightness(.7)';
  x.drawImage(s, Math.round(W / 2 - s.width * sc / 2), Math.round(pb - 2 - s.height * sc), s.width * sc, s.height * sc); x.restore();
}
function statBars(c) {
  const m = c.mods || {}, st = Math.max(1, starsOf(c.id)), rr = RAR[c.rar] || RAR.C;
  const hp = c.hp * (1 + (st - 1) * .05) + (m.maxHp || 0), pow = 1 + rr.might + (st - 1) * .06 + (m.might || 0);
  const rows = [['Vida', hp / 200, Math.round(hp)], ['Poder', (pow - .9) / .6, Math.round(pow * 100) + '%'], ['Velocidad', (1 + (m.spd || 0) - .8) / .5, Math.round((1 + (m.spd || 0)) * 100) + '%'], ['Recarga', (1 + (m.cd || 0) - .85) / .35, Math.round((1 + (m.cd || 0)) * 100) + '%']];
  return `<div class="statbars">${rows.map(([n, v, t]) => `<span>${n}</span><i><b style="width:${Math.round(clamp(v, .05, 1) * 100)}%"></b></i><span class="gold">${t}</span>`).join('')}</div>`;
}
const starTxt = n => '★'.repeat(n) + '☆'.repeat(MAX_STARS - n);
const spInfo = id => { const sp = SPECIALS[id]; return sp ? `<div class="spinfo" style="--sc:${sp.col}"><b class="px">⚡ ${sp.name}</b><span class="muted">${sp.desc}</span><small>Técnica especial · tecla 1 o botón · recarga ${sp.cd} s</small></div>` : ''; };
const rarTag = r => `<span class="rar" style="background:${RAR[r].col}">${RAR[r].name.toUpperCase()}</span>`;
function renderSelect() {
  $('#zSel').innerHTML = `<i></i>${fmtNum(save.zeni)}`;
  const own = CHARS.filter(isUnlocked).length;
  const fl = $('#charFilters'); fl.innerHTML = '';
  [['all', `TODOS ${own}/${CHARS.length}`], ...RAR_ORDER.map(r => [r, RAR[r].name.toUpperCase()])].forEach(([k, n]) => {
    const b = document.createElement('button'); b.className = 'btn' + (charFilter === k ? ' on' : ''); b.textContent = n;
    b.onclick = () => { charFilter = k; sfx('click'); renderSelect(); }; fl.appendChild(b);
  });
  const g = $('#charGrid'); g.innerHTML = '';
  const list = CHARS.filter(c => charFilter === 'all' || c.rar === charFilter)
    .sort((a, b) => (isUnlocked(b) - isUnlocked(a)) || (RAR_ORDER.indexOf(a.rar) - RAR_ORDER.indexOf(b.rar)));
  list.forEach(c => {
    const un = isUnlocked(c), st = starsOf(c.id), b = document.createElement('button');
    b.className = 'card' + (un ? '' : ' locked') + (c.id === selChar ? ' sel' : ''); b.dataset.r = c.rar;
    const cv2 = document.createElement('canvas'); cv2.width = 36; cv2.height = 56; paintSprite(cv2, c.id);
    b.appendChild(cv2);
    b.insertAdjacentHTML('beforeend', `<div class="nm">${c.name}</div><div class="st">${un ? '★'.repeat(st) : ''}</div>${un ? '' : '<span class="lock">🔒</span>'}`);
    b.onclick = () => { selChar = c.id; sfx('click'); renderSelect(); };
    b.ondblclick = () => { if (isUnlocked(c)) { save.lastChar = c.id; go('stages'); } };
    g.appendChild(b);
  });
  const c = CHAR[selChar], un = isUnlocked(c), w = WEAPONS[c.weapon], st = starsOf(c.id);
  const d = $('#charDetail');
  d.innerHTML = `<div class="big"><canvas width="72" height="84" id="bigSpr" class="pedestal"></canvas><div><div class="name">${c.name}</div><div class="saga">${c.saga}</div><div class="row" style="gap:8px;margin-top:6px">${rarTag(c.rar)}<span class="gold" style="font-size:18px">${un ? starTxt(st) : ''}</span></div><p style="margin-top:6px">${c.desc}</p></div></div>
    <div class="tags" hidden></div>
    <div class="row" style="background:#0f1430;padding:8px;box-shadow:0 0 0 2px var(--line)"><span id="wIcon"></span><div><b class="gold px" style="font-size:10px">${w.name}</b><div class="muted">${w.desc}</div></div></div>
    ${spInfo(c.id)}
    ${un ? buddyBox(c.id) : ''}
    ${c.forms.length ? `<div class="muted">Transformaciones</div><div class="forms" id="formsBox"></div>` : ''}
    <div id="selAction"></div>`;
  paintPedestal($('#bigSpr'), c, un);
  d.querySelector('.tags').insertAdjacentHTML('afterend', statBars(c));
  $('#wIcon').appendChild(iconCanvas(w.icon, w.col, 36));
  if (un) wireBuddy(c.id);
  if (c.forms.length) {
    const fb = $('#formsBox');
    c.forms.forEach(f => { const el = document.createElement('div'); el.className = 'form'; const cc = document.createElement('canvas'); cc.width = 18; cc.height = 28; paintSprite(cc, f.spr); el.appendChild(cc); el.insertAdjacentHTML('beforeend', `<div>Nv ${f.lv}</div>`); el.title = f.name; if (!un) cc.style.filter = 'grayscale(.8) brightness(.7)'; fb.appendChild(el); });
  }
  const act = $('#selAction');
  if (un) { act.innerHTML = `<button class="btn primary" style="width:100%">ELEGIR SAGA ▶</button>`; act.firstChild.onclick = () => { save.lastChar = selChar; persist(); go('stages'); }; }
  else if (c.unlock.cost) {
    const can = save.zeni >= c.unlock.cost;
    act.innerHTML = `<p class="muted">🔒 ${c.unlock.txt}</p><button class="btn gold" style="width:100%;margin-top:8px" ${can ? '' : 'disabled'}>COMPRAR · ${fmtNum(c.unlock.cost)} ZENIS</button>`;
    act.querySelector('button').onclick = () => { if (save.zeni >= c.unlock.cost) { save.zeni -= c.unlock.cost; save.bought[c.id] = 1; markSeen(c.id); persist(); sfx('ball'); renderSelect(); } };
  } else {
    act.innerHTML = `<p class="muted">🔒 ${c.unlock.txt}</p><button class="btn gold" style="width:100%;margin-top:8px">IR A LA TIENDA</button>`;
    act.querySelector('button').onclick = () => go('gacha');
  }
}

/* ---------- selección de saga ---------- */
function stagePreview(cv2, st) {
  const x = cv2.getContext('2d'); x.imageSmoothingEnabled = false;
  for (let i = 0; i < 2; i++) x.drawImage(getChunk(st.id, 40 + i, 40), i * 128, 0);
  const pt = WORLD[st.id].props.slice().sort((a, b) => b[1] - a[1]).map(p => p[0]);
  [[30, 0], [205, 1], [120, 2]].forEach(([px, k]) => { const ps = getPropSprite(pt[k % pt.length], st.id, k).c; x.drawImage(ps, px - (ps.width >> 1), Math.min(30, 64 - ps.height)); });
  const bossId = st.bosses[3][1], spr = BOSSES[bossId].spr || bossId;
  const s = getSprite(spr, 0, true);
  x.drawImage(s, 150, 4, s.width * 2, s.height * 2);
  const enemies = st.pool.map(p => p[0]);
  enemies.forEach((id, i) => { const e = getSprite(id, 0, true); x.drawImage(e, 100 - i * 26, 30, e.width, e.height); });
  const h = getSprite(selChar, 0, false); x.drawImage(h, 22, 30, h.width, h.height);
}
function renderStages() {
  const mode = save.mode === 'inf' && endlessUnlocked() ? 'inf' : 'saga';
  if (mode === 'saga' && !STAGES.some((s, i) => diffUnlocked(i, save.diff))) save.diff = 0;
  const mt = $('#modeTabs'); mt.innerHTML = '';
  [['saga', 'SAGAS'], ['inf', '∞ SUPERVIVENCIA']].forEach(([k, n]) => {
    const b = document.createElement('button'); b.className = 'btn small' + (mode === k ? ' on' : ''); b.textContent = n;
    if (k === 'inf' && !endlessUnlocked()) { b.disabled = true; b.textContent += ' 🔒'; b.title = 'Completa la Saga Saiyan para desbloquearlo'; }
    b.onclick = () => { save.mode = k; persist(); sfx('click'); renderStages(); }; mt.appendChild(b);
  });
  const db = $('#diffBar'); db.innerHTML = ''; db.hidden = mode !== 'saga';
  if (mode === 'saga') DIFFS.forEach(d => {
    const b = document.createElement('button'); b.className = 'btn small' + (save.diff === d.id ? ' on' : ''); b.style.setProperty('--dc', d.col);
    const ok = STAGES.some((s, i) => diffUnlocked(i, d.id)); b.disabled = !ok; b.textContent = d.name.toUpperCase() + (ok ? '' : ' 🔒');
    if (!ok) b.title = d.id === 1 ? 'Completa una saga en Normal' : 'Completa una saga en Difícil';
    b.onclick = () => { save.diff = d.id; persist(); sfx('click'); renderStages(); }; db.appendChild(b);
  });
  $('#modeInfo').innerHTML = mode === 'inf'
    ? `Aguanta todo lo que puedas: los enemigos no paran de hacerse más fuertes y los jefes vuelven una y otra vez. Tu récord: <b class="gold">${fmtNum(save.stats.bestInf)}</b> puntos. Elige el escenario.`
    : DIFFS[save.diff].desc + (save.diff ? ` Primera victoria en cada saga: <b class="gold">${DIFF_PRIZE[save.diff].txt}</b>.` : ' Al completar una saga se desbloquea en Difícil.');
  const g = $('#stageGrid'); g.innerHTML = '';
  STAGES.forEach((st, i) => {
    const un = mode === 'inf' ? stageUnlocked(i) : diffUnlocked(i, save.diff), b = document.createElement('button');
    b.className = 'stage' + (un ? '' : ' locked') + (mode === 'saga' && (save.diff ? save.clearedD[st.id + ':' + save.diff] : save.cleared[st.id]) ? ' done' : '');
    const cv2 = document.createElement('canvas'); cv2.width = 240; cv2.height = 66; stagePreview(cv2, st);
    if (!un) cv2.style.filter = 'grayscale(1) brightness(.5)';
    b.appendChild(cv2);
    const best = save.best[st.id];
    const lockTxt = mode === 'inf' || save.diff === 0 ? '🔒 Completa la saga anterior' : `🔒 Complétala antes en ${DIFFS[save.diff - 1].name}`;
    const dd = DIFFS.map(d => `<span style="--c:${d.col}" class="${(d.id ? save.clearedD[st.id + ':' + d.id] : save.cleared[st.id]) ? '' : 'no'}">${d.name}</span>`).join('');
    b.insertAdjacentHTML('beforeend', `<div class="in"><div class="t">${i + 1}. ${st.name}</div><div class="s">${st.place}</div><div class="s" style="color:#cfd6f5">${un ? st.desc : lockTxt}</div>
      <div class="s">Jefes: ${st.bosses.map(b => save.seen[b[1]] ? BOSSES[b[1]].name : '???').join(' · ')}</div>${best && mode === 'saga' ? `<div class="s gold">Récord: ${fmtTime(best.t)} · Nv ${best.lvl}</div>` : ''}${mode === 'saga' ? `<div class="dd">${dd}</div>` : ''}</div>`);
    b.onclick = () => { if (un) startRun(selChar, i, mode === 'inf' ? { endless: true } : { diff: save.diff }); };
    b.onmouseenter = () => { if (un) menu.stage = st.id; };
    g.appendChild(b);
  });
}

/* ---------- partida ---------- */
let lastOpt = {};
function startRun(cid, si, opt = {}) {
  audioInit(); lastOpt = opt;
  newRun(cid, si, opt);
  state = 'play'; showScreen(null);
  if (G.endless) banner('∞ SUPERVIVENCIA', `${G.stage.place} · Aguanta todo lo que puedas`);
  else banner(G.stage.name.toUpperCase() + (G.diff.id ? ' · ' + G.diff.name.toUpperCase() : ''), `${G.stage.place} · Sobrevive 10 minutos y derrota al jefe final`);
  musicSet(true); lastT = performance.now();
}
function pauseGame() { if (state !== 'play') return; state = 'paused'; showScreen('pause'); renderPause(); }
function resumeGame() { state = 'play'; showScreen(null); lastT = performance.now(); if (P) P.inv = Math.max(P.inv, .6); }
function renderPause() {
  $('#pauseInfo').innerHTML = `<div class="stats"><span>Guerrero</span><b>${P.name}</b><span>Saga</span><b>${G.stage.name}</b><span>Tiempo</span><b>${fmtTime(G.t)}</b><span>Nivel</span><b>${G.lvl}</b><span>Bajas</span><b>${fmtNum(G.kills)}</b><span>Vida</span><b>${Math.ceil(P.hp)} / ${P.maxHp}</b></div>
  <table class="dmgtable">${P.weapons.map(w => `<tr><td>${wname(w)} ${w.evo ? '★' : 'Nv ' + w.lvl}</td><td>${fmtNum(w.dealt)}</td></tr>`).join('')}${P.passives.map(p => `<tr><td class="muted">${PASSIVES[p.id].name} Nv ${p.lvl}</td><td></td></tr>`).join('')}</table>`;
}
$('#pausebtn').onclick = () => pauseGame();
$('#bResume').onclick = () => resumeGame();
$('#bPauseOpts').onclick = () => { optsReturn = 'pause'; state = 'opts'; showScreen('opts'); renderOpts(); };
/* Diálogo de confirmación propio (los confirm() del navegador no siempre funcionan) */
function ask(text, yes = 'SÍ') {
  return new Promise(res => {
    const el = $('#ask'); $('#askText').textContent = text; $('#askYes').textContent = yes;
    el.classList.add('on'); $('#askNo').focus();
    const done = v => { el.classList.remove('on'); $('#askYes').onclick = $('#askNo').onclick = null; sfx('click'); res(v); };
    $('#askYes').onclick = () => done(true); $('#askNo').onclick = () => done(false);
  });
}
$('#bQuit').onclick = async () => { if (await ask('¿Abandonar la partida? Conservarás los zenis conseguidos.', 'ABANDONAR')) endRun(false, true); };

/* ---------- subir de nivel ---------- */
function openLevelUp() {
  state = 'levelup'; showScreen('levelup'); sfx('lvl');
  G.choices = buildChoices(P.luck >= 1.5 ? 4 : 3);
  renderChoices();
}
function renderChoices() {
  $('#luTitle').textContent = `¡NIVEL ${G.lvl - G.pendingLv + 1}!`;
  const box = $('#choices'); box.innerHTML = '';
  G.choices.forEach((o, i) => {
    const inf = choiceInfo(o), b = document.createElement('button');
    b.className = 'choice' + (inf.evo ? ' evo' : '');
    const isW = o.t === 'wnew' || o.t === 'wup' || o.t === 'evo', isP = o.t === 'pnew' || o.t === 'pup';
    const cur = isW ? ((P.weapons.find(w => w.id === o.id) || {}).lvl || 0) : isP ? ((P.passives.find(p => p.id === o.id) || {}).lvl || 0) : 0;
    const max = isW ? MAXW : isP ? (PASSIVES[o.id].max || MAXP) : 0;
    const rib = o.t === 'evo' ? ['EVOLUCIÓN', '#ffd23f'] : o.t === 'wnew' ? ['NUEVA TÉCNICA', '#59d66b'] : o.t === 'pnew' ? ['NUEVA PASIVA', '#a46bff'] : isW ? ['MEJORA', '#3aa0ff'] : isP ? ['PASIVA', '#b06bff'] : ['OBJETO', '#ff8a1c'];
    const hd = document.createElement('div'); hd.className = 'icrow';
    const ic = document.createElement('canvas'); ic.width = 40; ic.height = 40; const ix = ic.getContext('2d'); ix.imageSmoothingEnabled = false; ix.drawImage(inf.icon, 2, 2, 36, 36);
    hd.appendChild(ic);
    hd.insertAdjacentHTML('beforeend', `<div class="meta"><span class="rib" style="background:${rib[1]}">${rib[0]}</span><div class="cn">${inf.name}</div>${max && o.t !== 'evo' ? `<div class="pipsl">${Array.from({ length: max }, (_, k) => `<i class="${k < cur ? 'on' : k === cur ? 'nx' : ''}"></i>`).join('')}</div>` : ''}</div><span class="key">${i + 1}</span>`);
    b.appendChild(hd); b.insertAdjacentHTML('beforeend', `<div class="ds">${inf.desc}</div>${inf.hint ? `<div class="muted" style="font-size:16px">${inf.hint}</div>` : ''}`);
    b.onclick = () => pickChoice(i);
    box.appendChild(b);
  });
  const rr = $('#bReroll'); rr.textContent = `CAMBIAR (${G.rerolls})`; rr.disabled = G.rerolls <= 0;
}
function pickChoice(i) {
  const o = G.choices[i]; if (!o) return;
  applyChoice(o); sfx('click');
  nextLevel();
}
function nextLevel() {
  G.pendingLv--;
  if (G.pendingLv > 0) { G.choices = buildChoices(P.luck >= 1.5 ? 4 : 3); renderChoices(); }
  else resumeGame();
}
$('#bReroll').onclick = () => { if (G.rerolls > 0) { G.rerolls--; G.choices = buildChoices(P.luck >= 1.5 ? 4 : 3); renderChoices(); } };
$('#bSkip').onclick = () => { G.zeni += 10 * (G.si + 1); nextLevel(); };

/* ---------- Shenron ---------- */
const WISHES = [
  { t: 'Vida eterna (temporal)', d: 'Vida al máximo y eres invencible durante 20 segundos.', f: () => { P.hp = P.maxHp; P.immortal = 20; } },
  { t: 'Más poder', d: 'Subes 3 niveles al instante.', f: () => { for (let i = 0; i < 3; i++) addXp(G.xpNext - G.xp + .01); } },
  { t: 'Riqueza', d: 'Recibes una montaña de zenis.', f: () => { G.zeni += 300 * (G.si + 1); } },
  { t: 'Una segunda oportunidad', d: 'Recuperas toda la vida y ganas una resurrección extra.', f: () => { P.hp = P.maxHp; P.revive++; } },
];
function openShenron() {
  state = 'shenron'; showScreen('shenron'); sfx('trans'); G.stat.shenron++;
  const box = $('#wishes'); box.innerHTML = '';
  WISHES.forEach(w => { const b = document.createElement('button'); b.className = 'btn wish'; b.innerHTML = `<b>${w.t}</b>${w.d}`; b.onclick = () => { w.f(); G.balls = []; sfx('ball'); banner('¡TU DESEO HA SIDO CONCEDIDO!', 'Las Bolas de Dragón se dispersan por la galaxia'); resumeGame(); }; box.appendChild(b); });
}
const SHEN_HEAD = [
  '...hh.....hh............',
  '....hh.....hh...........',
  '.....hh.....hh..........',
  '....GGGGGGGGGGG.........',
  '...GGGGGGGGGGGGGGG......',
  '..GGGGKKKGGGGGGGGGGGG...',
  '..GGGKRRWKGGGGGGGGGGGGG.',
  '.GGGGKKKKGGGGGGGGGGGGGGG',
  '.GGGGGGGGGGGGGGGGGGGGGgK',
  'GGGGGGGGGGGGGGGGGGGGGGG.',
  'GGGGGWW.W.W.W.W.W.WWW...',
  'GGGGG...................',
  'GGGGGYYYYYYYYYYYYYYYY...',
  '.GGGGGYYYYYYYYYYYYYY....',
  '..GGGGGGGGGGGGGGGG......',
];
function drawPixMap(x, map, pal, ox, oy) {
  const filled = (r, c) => map[r] && map[r][c] && map[r][c] !== '.';
  x.fillStyle = '#05140c';
  for (let r = -1; r <= map.length; r++) for (let c = -1; c <= map[0].length; c++) if (!filled(r, c) && (filled(r - 1, c) || filled(r + 1, c) || filled(r, c - 1) || filled(r, c + 1))) x.fillRect(ox + c, oy + r, 1, 1);
  map.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== '.') { x.fillStyle = pal[ch] || '#f0f'; x.fillRect(ox + c, oy + r, 1, 1); } }));
}
function drawShenron(t) {
  const c = $('#shenCv'), x = c.getContext('2d'), W = c.width, H = c.height;
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#05140c'); g.addColorStop(1, '#0d2a1a'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  if (Math.sin(t * 3) > .97) { x.fillStyle = 'rgba(200,255,200,.25)'; x.fillRect(0, 0, W, H); }
  x.fillStyle = '#123a22'; for (let i = 0; i < 40; i++) x.fillRect((i * 37 + Math.floor(t * 4)) % W, (i * 53) % H, 1, 1);
  const pts = [];
  for (let i = 0; i <= 80; i++) { const u = i / 80; pts.push([12 + u * 160 + Math.sin(u * 7 + t) * 6, 104 - u * 80 + Math.sin(u * 11 + t * 1.6) * 12, 10 - u * 3.5]); }
  for (const [px, py, r] of pts) { x.fillStyle = '#05140c'; x.beginPath(); x.arc(px, py, r + 1, 0, TAU); x.fill(); }
  pts.forEach(([px, py, r], i) => {
    x.fillStyle = '#2f9a3c'; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill();
    x.fillStyle = '#e6d27a'; x.beginPath(); x.arc(px + 1, py + r * .45, r * .45, 0, TAU); x.fill();
    if (i % 3 === 0) { x.fillStyle = '#1f6a2a'; x.fillRect(Math.round(px - 1), Math.round(py - r * .5), 2, 2); }
    if (i % 10 === 5) { x.fillStyle = '#c8e05a'; x.fillRect(Math.round(px - 1), Math.round(py - r - 2), 2, 3); }
  });
  const [hx, hy] = pts[pts.length - 1];
  drawPixMap(x, SHEN_HEAD, { G: '#2f9a3c', g: '#1f6a2a', Y: '#e6d27a', K: '#0b2a12', R: '#ff2020', W: '#ffffff', h: '#8a6a3a' }, Math.round(hx - 6), Math.round(hy - 9));
  x.fillStyle = '#e6d27a';
  for (let i = 0; i < 28; i++) { x.fillRect(Math.round(hx + 18 + i), Math.round(hy - 1 + Math.sin(i * .3 + t * 3) * 3 - i * .45), 1, 1); x.fillRect(Math.round(hx + 18 + i), Math.round(hy + 4 + Math.sin(i * .3 + t * 3 + 1) * 3 + i * .25), 1, 1); }
  for (let i = 0; i < 7; i++) drawDragonBall(x, 60 + i * 15, 100, 5, i + 1);
}

/* ---------- Cápsula ---------- */
function openCapsule() {
  state = 'capsule'; showScreen('capsule'); sfx('ball');
  const r = Math.random() * P.luck, n = r > 1.1 ? 3 : r > .7 ? 2 : 1;
  const box = $('#capList'); box.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const o = buildChoices(1)[0]; const inf = choiceInfo(o); applyChoice(o);
    const row = document.createElement('div'); row.className = 'row'; row.style.cssText = 'background:#0f1430;padding:8px;box-shadow:0 0 0 2px var(--line);text-align:left';
    const ic = document.createElement('canvas'); ic.width = 36; ic.height = 36; ic.style.cssText = 'width:36px;height:36px;image-rendering:pixelated'; const ix = ic.getContext('2d'); ix.imageSmoothingEnabled = false; ix.drawImage(inf.icon, 0, 0, 36, 36);
    row.appendChild(ic); row.insertAdjacentHTML('beforeend', `<div><b class="px gold" style="font-size:10px">${inf.name}</b><div class="muted">${inf.lv}</div></div>`);
    box.appendChild(row);
  }
  const z = 60 * (G.si + 1); G.zeni += z;
  box.insertAdjacentHTML('beforeend', `<div class="zeni" style="justify-content:center"><i></i>+${z} zenis</div>`);
}
$('#bCapOk').onclick = () => resumeGame();

/* ---------- Fin de partida ---------- */
function endRun(win, quit) {
  if (state === 'over') return;
  const before = new Set(CHARS.filter(isUnlocked).map(c => c.id));
  const nextWas = STAGES[G.si + 1] ? stageUnlocked(G.si + 1) : true;
  const st = G.stage, D = G.diff;
  let bonus = win ? Math.round(500 * (G.si + 1) * [1, 2, 4][D.id]) : 0;
  const earned = Math.floor(G.zeni * D.zeni + bonus);
  save.zeni += earned; save.kills += G.kills; save.runs++; save.maxTime = Math.max(save.maxTime, G.t);
  G.killedBosses.forEach(b => save.bosses[b] = 1);
  const tk = [];
  if (win && D.id === 0) {
    save.cleared[st.id] = 1;
    const b = save.best[st.id]; if (!b || G.t < b.t) save.best[st.id] = { t: G.t, lvl: G.lvl, c: G.cid };
  } else if (win) {
    const key = st.id + ':' + D.id;
    if (!save.clearedD[key]) { const pz = DIFF_PRIZE[D.id]; save.tickets[pz.t] = (save.tickets[pz.t] || 0) + pz.n; tk.push(pz.txt + ' (primera victoria en ' + D.name + ')'); }
    save.clearedD[key] = 1;
  }
  save.tut = 1;
  if (win) { if (!save.gifts[st.id]) { save.gifts[st.id] = 1; save.tickets.g++; tk.push('Cápsula Dorada'); } save.tickets.n++; tk.push('Cápsula Normal'); }
  const newly = CHARS.filter(c => isUnlocked(c) && !before.has(c.id));
  newly.forEach(c => markSeen(c.id));
  const nextStage = win && !nextWas ? STAGES[G.si + 1] : null;
  const res = recordRun(win, earned);
  persist();
  const rkA = G.endless ? rankSubmit('inf', runScore(), G.t, G.cid) : Promise.resolve('same'), rkB = rankSubmit('kill', G.kills, G.t, G.cid);
  Promise.all([rkA, rkB]).then(r => { const el = $('#overRank'); if (!el) return; el.innerHTML = r.includes('ok') ? '📊 Ranking semanal: <b>¡marca enviada!</b> Mírala en RANKING.' : r.includes('err') ? '📊 Ranking semanal: no se ha podido enviar ahora.' : r.includes('guest') ? '📊 Ranking semanal: inicia sesión con tu correo para aparecer.' : '📊 Ranking semanal: no has superado tu mejor marca de esta semana.'; });
  state = 'over'; showScreen('over'); musicSet(false);
  sfx(win ? 'win' : 'lose');
  const tot = P.weapons.reduce((a, w) => a + w.dealt, 0) || 1;
  $('#overPanel').innerHTML = `<h2 class="px" style="font-size:22px;color:${win ? 'var(--gold)' : 'var(--red)'}">${G.endless ? 'FIN DE LA SUPERVIVENCIA' : win ? '¡VICTORIA!' : quit ? 'RETIRADA' : 'HAS CAÍDO'}</h2>
   <canvas id="overPed" class="pedestal" width="72" height="84" style="align-self:center;width:108px;height:126px"></canvas>
   <p style="text-align:center" class="muted">${P.name} · ${G.endless ? '∞ Supervivencia · ' + st.place : st.name}${D.id ? ' · ' + D.name : ''}</p>
   <div class="stats">${G.endless ? `<span>Puntuación</span><b class="gold">${fmtNum(runScore())}</b>` : ''}<span>Tiempo</span><b>${fmtTime(G.t)}</b><span>Nivel</span><b>${G.lvl}</b><span>Bajas</span><b>${fmtNum(G.kills)}</b><span>Jefes derrotados</span><b>${G.killedBosses.length}</b><span>Zenis</span><b class="gold">+${fmtNum(earned)}${bonus ? ` (bonus ${fmtNum(bonus)})` : ''}</b></div>
   <table class="dmgtable">${P.weapons.slice().sort((a, b) => b.dealt - a.dealt).map(w => `<tr><td>${wname(w)} ${w.evo ? '★' : 'Nv ' + w.lvl} <span class="muted">${Math.round(w.dealt / tot * 100)}%</span></td><td>${fmtNum(w.dealt)}</td></tr>`).join('')}</table>
   ${newly.map(c => `<div class="unlock">🔓 ¡Nuevo guerrero desbloqueado: <b class="gold">${c.name}</b>!</div>`).join('')}
   ${tk.map(n => `<div class="unlock">🎁 Premio: <b class="gold">${n}</b> gratis (ábrela en TIENDA → CAJAS)</div>`).join('')}
   ${nextStage ? `<div class="unlock">🗺️ ¡Nueva saga desbloqueada: <b class="gold">${nextStage.name}</b>!</div>` : ''}
   ${win && D.id < 2 && !save.clearedD[st.id + ':' + (D.id + 1)] ? `<div class="unlock">🔥 ¡Dificultad ${DIFFS[D.id + 1].name} desbloqueada en esta saga!</div>` : ''}
   ${overExtras(res, true)}
   <div class="row wrap center" style="margin-top:6px"><button class="btn primary" id="bRetry">REINTENTAR</button><button class="btn" id="bOther">OTRO GUERRERO</button><button class="btn" id="bMenu">MENÚ</button></div>`;
  paintPedestal($('#overPed'), Object.assign({}, CHAR[G.cid], { id: P.spr }), true);
  const cid = G.cid, si = G.si;
  const opt = lastOpt; $('#bRetry').onclick = () => startRun(cid, si, opt);
  $('#bOther').onclick = () => { G = null; go('select'); };
  $('#bMenu').onclick = () => { G = null; go('title'); };
}

/* ---------- Tienda ---------- */
function shopCost(it) { const l = save.shop[it.id] || 0; return Math.round(it.cost * (1 + l * .9)); }
function renderShop() {
  $('#zShop').innerHTML = `<i></i>${fmtNum(save.zeni)}`;
  const g = $('#shopGrid'); g.innerHTML = '';
  SHOP.forEach(it => {
    const l = save.shop[it.id] || 0, max = l >= it.max, cost = shopCost(it), el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `<div class="t">${it.name}</div><div class="muted">${it.desc}</div><div class="pips">${Array.from({ length: it.max }, (_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('')}</div>
      <button class="btn small ${max ? '' : 'gold'}" ${max || save.zeni < cost ? 'disabled' : ''}>${max ? 'MÁXIMO' : `MEJORAR · ${fmtNum(cost)}`}</button>`;
    el.querySelector('button').onclick = () => { if (!max && save.zeni >= cost) { save.zeni -= cost; save.shop[it.id] = l + 1; persist(); sfx('pick'); renderShop(); } };
    g.appendChild(el);
  });
  const el = document.createElement('div'); el.className = 'item';
  const spent = SHOP.reduce((a, it) => { let s = 0; for (let l = 0; l < (save.shop[it.id] || 0); l++) s += Math.round(it.cost * (1 + l * .9)); return a + s; }, 0);
  el.innerHTML = `<div class="t">Devolver mejoras</div><div class="muted">Recupera todos los zenis invertidos (${fmtNum(spent)}).</div><button class="btn small" ${spent ? '' : 'disabled'}>REEMBOLSAR</button>`;
  el.querySelector('button').onclick = async () => { if (await ask('¿Devolver todas las mejoras y recuperar los zenis?', 'REEMBOLSAR')) { save.zeni += spent; save.shop = {}; persist(); renderShop(); } };
  g.appendChild(el);
}

/* ---------- Dragonpedia ---------- */
let dexTab = 'chars';
function dexEntries(tab) {
  if (tab === 'chars') {
    const out = [];
    CHARS.slice().sort((a, b) => RAR_ORDER.indexOf(a.rar) - RAR_ORDER.indexOf(b.rar)).forEach(c => {
      const own = isUnlocked(c);
      out.push({ id: c.id, spr: c.id, name: c.name, saga: c.saga + ' · ' + RAR[c.rar].name, desc: c.desc, own, how: own ? '' : c.unlock.txt, rar: c.rar, stars: own ? starsOf(c.id) : 0, sp: SPECIALS[c.id] });
      c.forms.forEach(f => { if (f.spr !== c.id) out.push({ id: f.spr, spr: f.spr, name: f.name, saga: 'Transformación de ' + c.name + ' (Nv ' + f.lv + ')', desc: `Se desbloquea al llegar al nivel ${f.lv} con ${c.name}.`, own, how: own ? '' : `Consigue a ${c.name}.`, rar: c.rar }); });
    });
    return out;
  }
  if (tab === 'enemies') return Object.entries(ENEMIES).map(([id, d]) => ({ id, spr: id, name: d.name, saga: d.saga + (d.elite ? ' · Élite' : ''), desc: d.desc, met: !!save.seen[id] }));
  if (tab === 'bosses') return Object.entries(BOSSES).map(([id, d]) => ({ id, spr: d.spr || id, name: d.name, saga: d.saga + (d.final ? ' · Jefe final' : ' · Jefe'), desc: d.desc, met: !!save.seen[id], beat: !!save.bosses[id] }));
  return Object.entries(WEAPONS).map(([id, d]) => ({ id, icon: [d.icon, d.col], name: d.name, saga: 'Evoluciona con ' + PASSIVES[d.evo.with].name + ' → ' + d.evo.name, desc: d.desc }))
    .concat(Object.entries(PASSIVES).map(([id, d]) => ({ id, icon: [d.icon, d.col], name: d.name, saga: 'Pasiva', desc: d.desc })));
}
let dexFilter = 'all';
function renderDex() {
  const tabs = [['chars', 'GUERREROS'], ['enemies', 'ENEMIGOS'], ['bosses', 'JEFES'], ['tech', 'TÉCNICAS']];
  $('#dexTabs').innerHTML = '';
  tabs.forEach(([k, n]) => { const b = document.createElement('button'); b.className = 'btn small' + (dexTab === k ? ' on' : ''); b.textContent = n; b.onclick = () => { dexTab = k; sfx('click'); renderDex(); }; $('#dexTabs').appendChild(b); });
  if (dexTab === 'chars') [['all', 'TODOS'], ['own', 'CONSEGUIDOS'], ['no', 'TE FALTAN']].forEach(([k, n]) => { const b = document.createElement('button'); b.className = 'btn small' + (dexFilter === k ? ' on' : ''); b.textContent = n; b.style.opacity = dexFilter === k ? 1 : .8; b.onclick = () => { dexFilter = k; sfx('click'); renderDex(); }; $('#dexTabs').appendChild(b); });
  const own = CHARS.filter(isUnlocked).length;
  $('#dexCount').textContent = `Guerreros ${own}/${CHARS.length}`;
  const g = $('#dexGrid'); g.innerHTML = '';
  let list = dexEntries(dexTab);
  if (dexTab === 'chars' && dexFilter !== 'all') list = list.filter(e => dexFilter === 'own' ? e.own : !e.own);
  list.forEach(e => {
    const el = document.createElement('div'); el.className = 'dexc' + (e.own === false ? ' notown' : '');
    let cv2;
    if (e.icon) { cv2 = iconCanvas(e.icon[0], e.icon[1], 48); cv2.style.height = '48px'; }
    else { cv2 = document.createElement('canvas'); cv2.width = 36; cv2.height = 56; paintSprite(cv2, e.spr); cv2.style.width = '62px'; }
    el.appendChild(cv2);
    let badge = '';
    if ('own' in e) badge = e.own ? `<span class="own yes">CONSEGUIDO${e.stars ? ' ' + '★'.repeat(e.stars) : ''}</span>` : `<span class="own no">NO CONSEGUIDO</span>`;
    else if ('beat' in e) badge = e.beat ? `<span class="own yes">DERROTADO</span>` : e.met ? `<span class="own no">VISTO</span>` : `<span class="own no">SIN ENCONTRAR</span>`;
    else if ('met' in e) badge = e.met ? `<span class="own yes">ENCONTRADO</span>` : `<span class="own no">SIN ENCONTRAR</span>`;
    el.insertAdjacentHTML('beforeend', `<div class="n">${e.name}</div>${e.rar ? rarTag(e.rar) : ''}<div class="s">${e.saga}</div><div class="d">${e.desc}</div>${e.sp ? `<div class="d" style="color:${e.sp.col}">⚡ ${e.sp.name}</div>` : ''}${badge}${e.how ? `<div class="d" style="color:#ffc27a">🔒 ${e.how}</div>` : ''}`);
    g.appendChild(el);
  });
}

/* ---------- Cápsulas ---------- */
/* ---------- Opciones ---------- */
function renderOpts() {
  const L = [['sfx', 'Efectos de sonido'], ['music', 'Música'], ['names', 'Nombre de todos los enemigos'], ['dmg', 'Números de daño'], ['shake', 'Temblor de pantalla'], ['vib', 'Vibración (móvil)'], ['voice', 'Voces al abrir cajas (Kamehameha)']];
  const box = $('#optList'); box.innerHTML = '';
  L.forEach(([k, n]) => {
    const row = document.createElement('div'); row.className = 'opt';
    row.innerHTML = `<span>${n}</span><button class="btn toggle ${save.opts[k] ? 'on' : ''}">${save.opts[k] ? 'SÍ' : 'NO'}</button>`;
    row.querySelector('button').onclick = () => { save.opts[k] = !save.opts[k]; persist(); if (k === 'music') musicSet(state === 'play' || optsReturn === 'pause'); renderOpts(); };
    box.appendChild(row);
  });
  if (typeof optsExtra === 'function') optsExtra(box);
}
$('#bResetSave').onclick = async () => { if (await ask('¿Seguro? Se borrarán zenis, mejoras y personajes desbloqueados.', 'BORRAR')) { const o = save.opts; save = defSave(); save.opts = o; persist(); renderOpts(); } };

/* ---------- Banner ---------- */
let banTimer = null;
function banner(a, b) {
  const el = $('#banner'); $('#banA').textContent = a; $('#banB').textContent = b || '';
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  clearTimeout(banTimer); banTimer = setTimeout(() => el.classList.remove('on'), 2700);
}

/* ---------- Teclado ---------- */
let eggBuf = '';
function onKey(e) {
  if (state === 'gacha' && $('#gacha').classList.contains('on') && e.key && e.key.length === 1) {
    eggBuf = (eggBuf + e.key.toLowerCase()).slice(-4);
    if (eggBuf === 'wasd') { eggBuf = ''; shopEgg(); return; }
  }
  if (state === 'play' && G && G.intro && ['Space', 'Enter', 'Escape'].includes(e.code)) { G.intro.t = Math.min(G.intro.t, .15); return; }
  if (state === 'play' && (e.code === 'Escape' || e.code === 'KeyP')) { pauseGame(); return; }
  // Técnica especial: tecla 1 (también Espacio, E o Q). Fusión: tecla 2 (o F).
  if (state === 'play' && ['Digit1', 'Numpad1', 'Space', 'KeyE', 'KeyQ'].includes(e.code)) { e.preventDefault(); useSpecial(); return; }
  if (state === 'play' && ['Digit2', 'Numpad2', 'KeyF'].includes(e.code)) { startFusion(); return; }
  if (state === 'paused' && (e.code === 'Escape' || e.code === 'KeyP')) { resumeGame(); return; }
  if (state === 'shrine') { const m = e.code.match(/^(?:Digit|Numpad)([1-3])$/); if (m) { pickBoon(+m[1] - 1); return; } }
  if (state === 'levelup') {
    const m = e.code.match(/^(?:Digit|Numpad)([1-4])$/); if (m) { pickChoice(+m[1] - 1); return; }
    if (e.code === 'KeyR') $('#bReroll').click();
  }
  if (state === 'title' && e.code === 'Enter') $('#bPlay').click();
}

/* ---------- Arranque ---------- */
(function boot() {
  [['bPlay', 'dball', '#ff9a1c'], ['bGacha', 'cap', '#fff'], ['bMis', 'win', '#ffd23f'], ['bCards', 'gem', '#ff8ac8'], ['bRank', 'lvl', '#ff8a1c'], ['bDex', 'book', '#3aa0ff'], ['bShop', 'temple', '#e8d8b0'], ['bOpts', 'gear', '#b8c0dc'], ['bAcct', 'user', '#59d66b']].forEach(([id, ic, col]) => { const b = $('#' + id + ' .mi'); if (b) b.appendChild(iconCanvas(ic, col, 24)); });
  const lb = $('#logoBall'), x = lb.getContext('2d'); x.imageSmoothingEnabled = false; drawDragonBall(x, 10, 10, 8.5, 4);
  renderTitle();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { });
  if (DEV) window.DF = { CHARS, STAGES, get G() { return G; }, get P() { return P; }, get state() { return state; }, startRun, go, save: () => save, persist, update, render, pickChoice, resumeGame, useSpecial, miss: () => [...trMiss] };
  requestAnimationFrame(loop);
})();
</script>
