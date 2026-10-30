<script>
'use strict';
/* =================== ESTADO =================== */
let state = 'title';   // title | select | stages | play | levelup | paused | over | shenron | capsule | shop | dex | opts
let G = null, P = null;
const BASE_SPD = 72;
function xpNeed(l) { return l < 20 ? 5 + (l - 1) * 9 : l < 40 ? 176 + (l - 20) * 16 : 496 + (l - 40) * 24; }

function newRun(cid, si, opt = {}) {
  const c = CHAR[cid], st = STAGES[si];
  G = {
    t: 0, si: st.tier, idx: si, stage: st, cid, kills: 0, zeni: 0, lvl: 1, xp: 0, xpNext: xpNeed(1),
    enemies: [], projs: [], eprojs: [], gems: [], picks: [], fx: [], nums: [],
    bossIdx: 0, boss: null, balls: [], spawnT: .5, eliteT: 55, waveT: 95, pendingLv: 0,
    rerolls: save.shop.reroll || 0, intro: null,
    diff: DIFFS[opt.endless ? 0 : opt.diff || 0], endless: !!opt.endless, bossCycle: 0, nextBossT: 0, hs: 0,
    ev: null, evT: 95, moonDone: 0, fuse: 0, fuseNeed: 150, fusionPair: null, buddy: null,
    stat: { specials: 0, events: 0, fusions: 0, evos: 0, trans: 0, shenron: 0, buddySp: 0, crates: 0, chests: 0, shrines: 0, healed: 0 },
    objs: [], objT: 0, curse: 0,
    tut: save.tut ? null : [[1, 'Muévete con WASD o las flechas. En el móvil, arrastra el dedo por la pantalla.'], [8, 'Tus ataques se lanzan solos contra el enemigo más cercano.'], [15, 'Recoge los cristales de ki para subir de nivel y elegir mejoras.'], [24, 'Los enemigos con nombre naranja sueltan Bolas de Dragón. ¡Reúne las 7!'], [31, 'Pulsa 1 (o toca el botón redondo) para usar la técnica especial de tu guerrero.'], [42, 'Rompe cajas y jarrones: sueltan comida que cura. Las fuentes azules también te curan.'], [52, 'Quédate en un altar de ki para cargarlo y ganar una bendición. Los cofres se abren con zenis.']], shake: 0, flash: 0, victoryT: -1, killedBosses: [], seen: {}, endT: -1, auraT: 0, pid: 0, maxCombo: 0,
  };
  P = {
    x: 0, y: 0, r: 6, dirx: 1, diry: 0, face: 1, ft: 0, frame: 0, inv: 1, moving: false,
    spr: c.id, name: c.name, aura: null, formIdx: -1, weapons: [], passives: [], hp: 1, maxHp: 1, revive: 0, immortal: 0,
    spT: 4, rage: null, shieldT: 0, fused: null, moon: 0, boons: {},
  };
  G.spq = []; G.spTint = null;
  P.weapons.push(newWeapon(c.weapon));
  recalc(true);
  P.revive = save.shop.revive || 0;
  P.hp = P.maxHp;
  markSeen(c.id);
  fillObjs(true);
  G.buddy = newBuddy(save.buddy);
  if (G.buddy) { G.fusionPair = fusionOf(cid, G.buddy.id); markSeen(G.buddy.id); }
  chunkCache.clear();
}
function newWeapon(id) { return { id, lvl: 1, evo: false, t: .3, dealt: 0, uid: ++uidC }; }
let uidC = 0;
function markSeen(id) { if (!save.seen[id]) { save.seen[id] = 1; } }

/* ---------- estadísticas ---------- */
function recalc(init) {
  const c = CHAR[G.cid], sh = save.shop;
  const s = { maxHp: c.hp, spd: 1, might: 1, area: 1, cd: 0, amount: 0, magnet: 1, armor: 0, regen: 0, crit: .05, luck: 1, growth: 1, dur: 1, greed: 1 };
  const add = o => { for (const k in o) s[k] = (s[k] || 0) + o[k]; };
  add(c.mods || {});
  const rr = RAR[c.rar] || RAR.C, st = Math.max(1, starsOf(c.id));
  add({ might: rr.might + (st - 1) * .06, maxHp: Math.round(c.hp * (st - 1) * .05) });
  add({ might: .05 * (sh.might || 0), maxHp: 10 * (sh.maxHp || 0), armor: sh.armor || 0, regen: .2 * (sh.regen || 0), spd: .05 * (sh.spd || 0), magnet: .2 * (sh.magnet || 0), cd: .03 * (sh.cd || 0), growth: .06 * (sh.growth || 0), greed: .1 * (sh.greed || 0), luck: .1 * (sh.luck || 0), amount: sh.amount || 0 });
  P.passives.forEach(p => { const st = PASSIVES[p.id].st; for (const k in st) s[k] += st[k] * p.lvl; });
  c.forms.forEach((f, i) => { if (i <= P.formIdx) add(f.bonus); });
  if (P.boons) add(P.boons);
  if (P.fused) add({ might: .6, spd: .15, cd: .15, armor: 2, maxHp: 40 });
  if (P.moon) add({ might: .4 });
  if (P.rage) add({ might: P.rage.might || 0, spd: P.rage.spd || 0, cd: P.rage.cd || 0, crit: P.rage.crit || 0 });
  const oldMax = P.maxHp;
  P.maxHp = Math.round(s.maxHp); P.spd = BASE_SPD * s.spd; P.might = s.might; P.area = s.area; P.cdm = Math.max(.35, 1 - s.cd);
  P.amount = s.amount; P.magnet = 40 * s.magnet; P.armor = s.armor; P.regen = s.regen; P.crit = s.crit; P.luck = s.luck; P.growth = s.growth; P.dur = s.dur; P.greed = s.greed;
  if (!init && P.maxHp > oldMax) P.hp += P.maxHp - oldMax;
  P.hp = Math.min(P.hp, P.maxHp);
}

/* ---------- utilidades de combate ---------- */
const GRIDS = 40; const egrid = new Map();
function gkey(x, y) { return (Math.floor(x / GRIDS) + 5000) * 10007 + (Math.floor(y / GRIDS) + 5000); }
function rebuildGrid() {
  egrid.clear();
  for (const e of G.enemies) { if (e.dead) continue; const k = gkey(e.x, e.y); let a = egrid.get(k); if (!a) { a = []; egrid.set(k, a); } a.push(e); }
}
function query(x, y, r, cb) {
  const x0 = Math.floor((x - r) / GRIDS), x1 = Math.floor((x + r) / GRIDS), y0 = Math.floor((y - r) / GRIDS), y1 = Math.floor((y + r) / GRIDS);
  for (let gx = x0; gx <= x1; gx++) for (let gy = y0; gy <= y1; gy++) {
    const a = egrid.get((gx + 5000) * 10007 + (gy + 5000)); if (!a) continue;
    for (let i = 0; i < a.length; i++) { const e = a[i]; if (!e.dead && cb(e) === false) return; }
  }
}
function nearestN(n, maxD = 320, x = P.x, y = P.y) {
  const arr = [];
  for (const e of G.enemies) { if (e.dead) continue; const d = (e.x - x) ** 2 + (e.y - y) ** 2; if (d < maxD * maxD) arr.push([d, e]); }
  arr.sort((a, b) => a[0] - b[0]);
  return arr.slice(0, n).map(a => a[1]);
}
function nearest(maxD = 320, x = P.x, y = P.y) { let best = null, bd = maxD * maxD; for (const e of G.enemies) { if (e.dead) continue; const d = (e.x - x) ** 2 + (e.y - y) ** 2; if (d < bd) { bd = d; best = e; } } return best; }
function visibleEnemies(margin = 0) { const hw = VW / 2 + margin, hh = VH / 2 + margin; return G.enemies.filter(e => !e.dead && Math.abs(e.x - P.x) < hw && Math.abs(e.y - P.y) < hh); }
function aimAt(e) { return e ? Math.atan2(e.y - e.h * .4 - (P.y - 8), e.x - P.x) : Math.atan2(P.diry, P.dirx); }
function segDist2(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy; let t = l2 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0; t = clamp(t, 0, 1);
  const cx = x1 + t * dx - px, cy = y1 + t * dy - py; return cx * cx + cy * cy;
}
function enemiesOnSeg(x1, y1, ang, len, w, cb) {
  const x2 = x1 + Math.cos(ang) * len, y2 = y1 + Math.sin(ang) * len;
  const minx = Math.min(x1, x2) - w - 20, maxx = Math.max(x1, x2) + w + 20, miny = Math.min(y1, y2) - w - 20, maxy = Math.max(y1, y2) + w + 20;
  for (const e of G.enemies) {
    if (e.dead || e.x < minx || e.x > maxx || e.y - e.h / 2 < miny || e.y - e.h / 2 > maxy) continue;
    const rr = w / 2 + e.r; if (segDist2(e.x, e.y - e.h / 2, x1, y1, x2, y2) < rr * rr) cb(e);
  }
}

function hurtEnemy(e, dmg, w, kx = 0, ky = 0, forceCrit = false) {
  if (e.dead) return;
  const crit = forceCrit || Math.random() < P.crit;
  dmg = dmg * (crit ? 2 : 1) * rand(.92, 1.08);
  e.hp -= dmg; e.flash = .06;
  if (!e.boss) { const m = e.elite ? .25 : 1; e.kx += kx * m; e.ky += ky * m; }
  if (w) w.dealt += dmg;
  if (G.fx.length < 260) G.fx.push({ k: 'spark', x: e.x + rand(-3, 3), y: e.y - e.h * .55 + rand(-3, 3), life: .16, max: .16, crit });
  if (save.opts.dmg && G.nums.length < 45) G.nums.push({ x: e.x + rand(-5, 5), y: e.y - e.h - 2, v: Math.round(dmg), crit, life: .7 });
  sfx('hit');
  if (e.hp <= 0) killEnemy(e, w);
}

/* =================== ENEMIGOS =================== */
function enemyHpMul() { const t = G.endless ? G.t : Math.min(G.t, 720); return (1 + t / 600 * G.stage.mul) * G.diff.hp * (G.endless ? 1 + Math.max(0, G.t - 600) / 900 : 1) * (1 + .15 * G.curse); }
function enemyDmgMul() { const t = G.endless ? G.t : Math.min(G.t, 720); return (1 + t / 600 * (.5 + G.si * .2)) * G.diff.dmg; }
function spawnPos(dist) {
  const a = Math.random() * TAU, d = dist || Math.hypot(VW, VH) / 2 + 20;
  return [P.x + Math.cos(a) * d, P.y + Math.sin(a) * d];
}
function spawnEnemy(id, x, y, isElite) {
  const d = ENEMIES[id], sc = sprScale(id) * (isElite ? 1.25 : 1);
  const hm = enemyHpMul();
  const e = {
    id, spr: d.vars ? pick(d.vars) : id, name: d.name, x, y, hp: d.hp * hm, maxHp: d.hp * hm, spd: d.spd * rand(.9, 1.1), dmg: d.dmg * enemyDmgMul(), xp: d.xp,
    r: 5 * sc, scale: sc, h: 31 * sc, ai: d.ai || 'chase', elite: !!(d.elite || isElite), boss: false,
    flash: 0, stun: 0, kx: 0, ky: 0, ft: Math.random(), frame: 0, face: -1, hitT: {}, shootT: rand(2, 5), dead: false,
  };
  G.enemies.push(e);
  if (!G.seen[id]) { G.seen[id] = 1; markSeen(id); if (G.t > 1) G.fx.push({ k: 'text', t: `Aparece: ${d.name}`, col: e.elite ? '#ffb070' : '#e6e9ff', x: P.x, y: P.y - 48, life: 1.8, max: 1.8 }); }
  return e;
}
function spawnBoss(id) {
  const d = BOSSES[id], spr = d.spr || id, sc = d.scale || 2;
  const [x, y] = spawnPos(Math.max(VW, VH) * .55);
  const cyc = G.endless ? 1 + G.bossCycle * .6 : 1, hp = d.hp * G.diff.hp * cyc;
  const e = {
    id, spr, name: d.name, x, y, hp, maxHp: hp, spd: d.spd, dmg: d.dmg * G.diff.dmg * (G.endless ? 1 + G.bossCycle * .25 : 1), xp: 60 + G.si * 40, r: 6 * sc, scale: sc, h: 31 * sc, ai: 'boss',
    elite: true, boss: true, final: !!d.final && !G.endless, flash: 0, stun: 0, kx: 0, ky: 0, ft: 0, frame: 0, face: -1, hitT: {}, atkT: 2.5, dash: null, dead: false, aura: SPR[spr] && SPR[spr].aura || '#ff4a4a',
  };
  G.enemies.push(e); G.boss = e;
  if (!G.seen[id]) { G.seen[id] = 1; markSeen(id); }
  G.intro = { kind: 'boss', t: 2, max: 2, spr, name: d.name, saga: d.saga, final: e.final, col: e.aura };
  sfx('boss'); G.shake = Math.max(G.shake, .5);
  return e;
}
function poolPick() {
  const t = G.t, opts = G.stage.pool.filter(p => t >= p[1] && t < p[2]);
  let tot = opts.reduce((a, p) => a + p[3], 0), r = Math.random() * tot;
  for (const p of opts) { r -= p[3]; if (r <= 0) return p[0]; }
  return opts[0][0];
}
function director(dt) {
  const t = G.t;
  const target = Math.min(330, (10 + t * .38 + G.si * 10) * G.diff.spawn) * (G.boss ? .6 : 1) * (G.ev && G.ev.k === 'tourney' ? .35 : 1) * (1 + .25 * G.curse);
  G.spawnT -= dt;
  if (G.spawnT <= 0) {
    G.spawnT = .45;
    const n = Math.min(14, Math.ceil((target - G.enemies.length) / 3));
    for (let i = 0; i < n; i++) { const [x, y] = spawnPos(); spawnEnemy(poolPick(), x, y); }
  }
  if (t >= G.eliteT) { G.eliteT += Math.max(28, 50 - G.si * 4); const [x, y] = spawnPos(); const e = spawnEnemy(pick(G.stage.elites), x, y, false); e.elite = true; }
  if (t >= G.waveT) {
    G.waveT += 80; const n = 22 + G.si * 4, id = poolPick(), R = Math.max(VW, VH) * .6;
    for (let i = 0; i < n; i++) { const a = i / n * TAU; spawnEnemy(id, P.x + Math.cos(a) * R, P.y + Math.sin(a) * R); }
    banner('¡OLEADA!', 'Te están rodeando');
  }
  const nb = G.stage.bosses[G.bossIdx];
  if (nb && t >= nb[0] && !G.boss) { spawnBoss(nb[1]); G.bossIdx++; if (G.endless && !G.stage.bosses[G.bossIdx]) G.nextBossT = nb[0] + 150; }
  else if (G.endless && !nb && !G.boss && t >= G.nextBossT) {
    G.bossCycle++; G.nextBossT = t + 150;
    spawnBoss(pick(STAGES.filter((s, i) => stageUnlocked(i)).flatMap(s => s.bosses.map(b => b[1]))));
  }
  eventTick(dt);
}

function enemyShoot(e, ang, spd = 90, dmg = e.dmg * .8, r = 4, col = '#ff5a3a') {
  G.eprojs.push({ x: e.x, y: e.y - e.h * .5, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, r, dmg, life: 4, col });
}
function bossAttack(e) {
  const d = BOSSES[e.id], a = pick(d.atk), ang = Math.atan2(P.y - 8 - (e.y - e.h * .5), P.x - e.x);
  const col = e.aura;
  if (a === 'aim') { for (let i = -2; i <= 2; i++) enemyShoot(e, ang + i * .14, 120, e.dmg * .7, 5, col); }
  else if (a === 'burst') { const n = 18 + G.si * 2, off = Math.random(); for (let i = 0; i < n; i++) enemyShoot(e, off + i / n * TAU, 85, e.dmg * .6, 5, col); }
  else if (a === 'dash') { e.dash = { warn: .6, t: .55, ang }; }
  else if (a === 'summon') { for (let i = 0; i < 6 + G.si; i++) { const aa = i / 6 * TAU; spawnEnemy(poolPick(), e.x + Math.cos(aa) * 30, e.y + Math.sin(aa) * 30); } }
  else if (a === 'beam') { G.eprojs.push({ k: 'beam', x: e.x, y: e.y - e.h * .5, ang, len: 420, w: 16, warn: .9, life: .5, dmg: e.dmg * 1.2, col, owner: e, hit: false }); }
}
function updateEnemies(dt) {
  const far2 = (Math.hypot(VW, VH) * .85) ** 2;
  for (const e of G.enemies) {
    if (e.dead) continue;
    e.flash -= dt; e.ft += dt; if (e.ft > .22) { e.ft = 0; e.frame ^= 1; }
    let dx = P.x - e.x, dy = P.y - e.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    let mvx = 0, mvy = 0;
    if (e.stun > 0) { e.stun -= dt; }
    else if (e.boss) {
      e.atkT -= dt;
      if (e.dash) {
        if (e.dash.warn > 0) { e.dash.warn -= dt; e.dash.ang = Math.atan2(P.y - e.y, P.x - e.x); }
        else { mvx = Math.cos(e.dash.ang) * e.spd * 4.2; mvy = Math.sin(e.dash.ang) * e.spd * 4.2; e.dash.t -= dt; if (e.dash.t <= 0) e.dash = null; }
      } else { mvx = dx * e.spd; mvy = dy * e.spd; if (e.atkT <= 0) { e.atkT = rand(2, 3.4) - G.si * .15; bossAttack(e); } }
    } else if (e.ai === 'ranged') {
      const s = d < 95 ? -.5 : d < 150 ? .15 : 1; mvx = dx * e.spd * s - dy * e.spd * .35; mvy = dy * e.spd * s + dx * e.spd * .35;
      e.shootT -= dt; if (e.shootT <= 0 && d < 200 && G.eprojs.length < 90) { e.shootT = rand(3.5, 5.5); enemyShoot(e, Math.atan2(P.y - 8 - (e.y - e.h * .5), P.x - e.x), 95, e.dmg * .8, 3.5, e.elite ? '#ffb03a' : '#ff5a3a'); }
    } else { mvx = dx * e.spd; mvy = dy * e.spd; if (e.elite && e.ai === 'tank' && d < 160) { e.shootT -= dt; if (e.shootT <= 0) { e.shootT = 3; for (let i = 0; i < 10; i++) enemyShoot(e, i / 10 * TAU, 80, e.dmg * .6, 4, '#ff8a3a'); } } }
    if (Math.abs(mvx) > .1) e.face = mvx > 0 ? 1 : -1;
    e.view = viewOf(mvx, mvy, e.view);
    e.x += (mvx + e.kx) * dt; e.y += (mvy + e.ky) * dt;
    e.kx *= .86; e.ky *= .86;
    // separación
    if (!e.boss) {
      let c = 0;
      query(e.x, e.y, e.r * 2, o => {
        if (o === e || o.boss) return; const ox = e.x - o.x, oy = e.y - o.y, dd = ox * ox + oy * oy, rr = e.r + o.r;
        if (dd < rr * rr && dd > .01) { const k = (rr - Math.sqrt(dd)) / rr * 30 * dt; e.x += ox * k; e.y += oy * k; }
        if (++c > 6) return false;
      });
    }
    // contacto
    const cr = e.r + P.r;
    if ((e.x - P.x) ** 2 + (e.y - P.y) ** 2 < cr * cr) hurtPlayer(e.dmg);
    // reposicionar enemigos lejanos
    if (!e.boss && (e.x - P.x) ** 2 + (e.y - P.y) ** 2 > far2) {
      const a = Math.atan2(P.diry, P.dirx) + rand(-1, 1), R = Math.hypot(VW, VH) / 2 + 15;
      e.x = P.x + Math.cos(a) * R; e.y = P.y + Math.sin(a) * R;
    }
  }
}
function updateEProjs(dt) {
  for (const b of G.eprojs) {
    if (b.k === 'beam') {
      if (b.owner && !b.owner.dead && b.warn > 0) { b.x = b.owner.x; b.y = b.owner.y - b.owner.h * .5; }
      if (b.warn > 0) { b.warn -= dt; if (b.warn <= 0) { sfx('beam'); G.shake = Math.max(G.shake, .25); } continue; }
      b.life -= dt;
      if (!b.hit && segDist2(P.x, P.y - 8, b.x, b.y, b.x + Math.cos(b.ang) * b.len, b.y + Math.sin(b.ang) * b.len) < (b.w / 2 + P.r) ** 2) { b.hit = true; hurtPlayer(b.dmg); }
      continue;
    }
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if ((b.x - P.x) ** 2 + (b.y - (P.y - 8)) ** 2 < (b.r + P.r) ** 2) { hurtPlayer(b.dmg); b.life = 0; }
  }
  G.eprojs = G.eprojs.filter(b => b.life > 0);
}

function killEnemy(e, w) {
  if (e.dead) return;
  e.dead = true; G.kills++;
  if (G.fusionPair && !P.fused && G.fuse < G.fuseNeed && ++G.fuse >= G.fuseNeed) { floatText(FINE_PTR ? '¡FUSIÓN LISTA! PULSA 2' : '¡FUSIÓN LISTA!', '#ffd23f'); sfx('ball'); }
  if (e.elite && !e.boss) hitstop(.02);
  const luck = P.luck;
  burst(e.x, e.y - e.h / 2, e.boss ? 40 : e.elite ? 16 : 5, e.boss ? e.aura : '#ffffff', e.boss ? 3 : 1.4);
  if (G.fx.length < 280) G.fx.push({ k: 'poof', x: e.x, y: e.y - e.h * .4, r: e.r * 1.6, life: .38, max: .38 });
  sfx('kill');
  const candy = w && w.id === 'candy' && !e.boss;
  if (candy) { G.fx.push({ k: 'candy', x: e.x, y: e.y - 6, life: .6, max: .6 }); }
  dropGem(e.x, e.y, e.xp * (candy ? 2 : 1));
  const zc = (e.elite ? .9 : .035) * luck;
  if (Math.random() < zc) dropPick('zeni', e.x + rand(-6, 6), e.y + rand(-6, 6), Math.ceil(rand(1, 4) * (G.si + 1) * (e.elite ? 5 : 1)));
  if (Math.random() < .004 * luck) dropPick('senzu', e.x, e.y);
  else if (Math.random() < (e.elite ? .35 : .012) * luck) dropPick('food', e.x + 4, e.y);
  if (Math.random() < .0012 * luck) dropPick('radar', e.x, e.y);
  if (e.elite && !e.boss) {
    if (Math.random() < .25 * luck) dropPick('senzu', e.x + 8, e.y);
    if (Math.random() < .45 * luck) dropBall(e.x - 8, e.y);
  }
  if (e.boss) {
    G.boss = null; G.killedBosses.push(e.id);
    G.shake = 1; G.flash = .6; sfx('boom');
    dropPick('capsule', e.x, e.y);
    dropBall(e.x + 14, e.y + 4);
    for (let i = 0; i < 10; i++) dropPick('zeni', e.x + rand(-26, 26), e.y + rand(-20, 20), Math.ceil(rand(4, 9) * (G.si + 1)));
    banner(`¡${e.name.toUpperCase()} DERROTADO!`, e.final ? '¡Has completado la saga!' : G.endless ? 'Recoge la cápsula y sigue aguantando' : 'Recoge la cápsula');
    hitstop(.16); vibrate(90);
    if (e.final) G.victoryT = 3;
  }
}
function dropGem(x, y, v) {
  if (G.gems.length > 300) { const g = G.gems[Math.floor(Math.random() * G.gems.length)]; g.v += v; return; }
  G.gems.push({ x: x + rand(-3, 3), y: y + rand(-3, 3), v, mag: false, vx: 0, vy: 0 });
}
function dropPick(k, x, y, v = 1) { G.picks.push({ k, x, y, v, mag: false, t: 0 }); }
function dropBall(x, y) {
  const have = new Set(G.balls.concat(G.picks.filter(p => p.k === 'ball').map(p => p.v)));
  const miss = [1, 2, 3, 4, 5, 6, 7].filter(n => !have.has(n));
  if (miss.length) dropPick('ball', x, y, pick(miss));
}

/* =================== JUGADOR =================== */
function hurtPlayer(d) {
  if (P.inv > 0 || P.immortal > 0 || P.shieldT > 0 || G.endT >= 0) return;
  d = Math.max(1, d - P.armor);
  P.hp -= d; P.inv = .5; G.shake = Math.max(G.shake, .18); G.hurtT = .25; sfx('hurt'); vibrate(25);
  if (P.hp <= 0) {
    if (P.revive > 0) {
      P.revive--; P.hp = P.maxHp * .6; P.inv = 2.5; sfx('heal');
      banner('¡SEMILLA DEL ERMITAÑO!', 'Vuelves a la batalla');
      shockwave(160, 80);
    } else { P.hp = 0; G.endT = 1.2; sfx('lose'); burst(P.x, P.y - 10, 40, '#ffffff', 2.5); }
  }
}
function shockwave(R, dmg) {
  G.fx.push({ k: 'ring', x: P.x, y: P.y - 10, r0: 6, r1: R, life: .5, max: .5, col: P.aura || '#ffffff' });
  hitObjsCircle(P.x, P.y - 5, R);
  for (const e of G.enemies) {
    if (e.dead) continue; const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy);
    if (d < R) hurtEnemy(e, dmg * P.might, null, dx / (d || 1) * 260, dy / (d || 1) * 260);
  }
  for (const b of G.eprojs) if (!b.k && (b.x - P.x) ** 2 + (b.y - P.y) ** 2 < R * R) b.life = 0;
}
function updatePlayer(dt) {
  const [mx, my] = moveVec();
  P.moving = mx !== 0 || my !== 0;
  if (P.moving) { const d = Math.hypot(mx, my); P.dirx = mx / d; P.diry = my / d; if (Math.abs(mx) > .05) P.face = mx > 0 ? 1 : -1; P.view = viewOf(mx, my, P.view); P.still = 0; }
  else if ((P.still = (P.still || 0) + dt) > .12) P.view = 0;
  P.x += mx * P.spd * dt; P.y += my * P.spd * dt;
  P.ft += dt; if (P.ft > (P.moving ? .14 : .4)) { P.ft = 0; P.frame = P.moving ? P.frame ^ 1 : 0; }
  P.inv -= dt; P.immortal -= dt; P.shieldT -= dt; P.spT -= dt; G.hurtT = (G.hurtT || 0) - dt;
  if (P.rage && (P.rage.t -= dt) <= 0) { P.rage = null; recalc(); }
  for (const q of G.spq) if ((q.t -= dt) <= 0) q.fn();
  G.spq = G.spq.filter(q => q.t > 0);
  if (P.hp > 0) P.hp = Math.min(P.maxHp, P.hp + P.regen * dt);
}

/* =================== ATAQUES =================== */
function wstats(w) {
  const d = WEAPONS[w.id], s = Object.assign({ spd: 0, pierce: 1, life: 1 }, d.base);
  for (let i = 0; i < w.lvl - 1; i++) for (const k in d.up[i]) s[k] = (s[k] || 0) + d.up[i][k];
  if (w.evo) for (const k in d.evo.mod) s[k] = (s[k] || 0) + d.evo.mod[k];
  return { dmg: s.dmg * P.might, cd: Math.max(.1, s.cd * P.cdm), n: s.n + P.amount, area: s.area * P.area, spd: s.spd, pierce: s.pierce, life: s.life * P.dur };
}
function wname(w) { return w.evo ? WEAPONS[w.id].evo.name : WEAPONS[w.id].name; }
function addProj(p) { p.id = ++G.pid; G.projs.push(p); return p; }
const PY = () => P.y - 9;
function fireWeapon(w) {
  const s = wstats(w), d = WEAPONS[w.id], col = w.evo && w.id === 'deathbeam' ? '#ffd23f' : d.col;
  switch (w.id) {
    case 'kamehameha': {
      const tg = nearest(260), base = tg ? aimAt(tg) : Math.atan2(P.diry, P.dirx), angs = [];
      for (let i = 0; i < s.n; i++) angs.push(base + (i - (s.n - 1) / 2) * .4);
      if (w.evo) angs.push(...angs.map(a => a + Math.PI));
      angs.forEach(a => addProj({ k: 'beam', w, ang: a, len: 150 * s.area, wd: 10 * s.area * (w.evo ? 1.5 : 1), dmg: s.dmg, life: s.life, max: s.life, tick: .12, tt: 0, col, follow: true, tickN: 0 }));
      sfx('beam'); break;
    }
    case 'galick': {
      const ts = nearestN(s.n, 260); if (!ts.length) return false;
      for (let i = 0; i < s.n; i++) { const t = ts[i % ts.length]; addProj({ k: 'beam', w, ang: aimAt(t) + (i >= ts.length ? rand(-.3, .3) : 0), len: (w.evo ? 300 : 170) * s.area, wd: (w.evo ? 26 : 9) * s.area, dmg: s.dmg, life: s.life, max: s.life, tick: .12, tt: 0, col: w.evo ? '#fff27a' : col, follow: true, tickN: 0 }); }
      sfx('beam'); break;
    }
    case 'masenko': case 'kiblast': case 'burning': case 'sokidan': case 'bigbang': case 'eraser': {
      const t = nearest(300); if (!t && w.id !== 'sokidan') return false;
      const base = aimAt(t), spread = w.id === 'burning' ? .2 : w.id === 'kiblast' ? .1 : .16;
      for (let i = 0; i < s.n; i++) {
        const a = base + (i - (s.n - 1) / 2) * spread;
        const p = { k: 'ball', w, x: P.x, y: PY(), vx: Math.cos(a) * s.spd, vy: Math.sin(a) * s.spd, r: 3, dmg: s.dmg, pierce: s.pierce, life: s.life, col, hit: new Set() };
        if (w.id === 'masenko') p.r = 6 * s.area;
        if (w.id === 'kiblast') p.r = 3 * Math.sqrt(s.area);
        if (w.id === 'burning') { p.r = 4 * s.area; p.boom = 16 * s.area; p.pierce = 1; }
        if (w.id === 'sokidan') { p.r = 4.5 * s.area; p.homing = 7; }
        if (w.id === 'bigbang') { p.r = 7 * s.area; p.boom = 38 * s.area; p.pierce = 1; p.bdmg = s.dmg; p.dmg = s.dmg * .3; }
        if (w.id === 'eraser') { p.r = 7 * s.area; p.boom = 34 * s.area; p.bdmg = s.dmg; p.dmg = s.dmg * .5; p.boomEach = true; }
        addProj(p);
      }
      sfx('shot'); break;
    }
    case 'makanko': case 'deathbeam': case 'candy': {
      const ts = w.id === 'deathbeam' ? shuffle(visibleEnemies(10)).slice(0, s.n) : nearestN(s.n, 300);
      if (!ts.length) return false;
      ts.forEach(t => {
        const a = aimAt(t), len = w.id === 'makanko' ? 300 : Math.hypot(t.x - P.x, t.y - t.h / 2 - PY()) + 6;
        const wd = w.id === 'makanko' ? 6 * s.area : w.id === 'candy' ? 5 * s.area : 2.5;
        enemiesOnSeg(P.x, PY(), a, len, wd, e => {
          if (w.id === 'candy' && w.evo && !e.elite && Math.random() < .12) { hurtEnemy(e, e.hp + 1, w); return; }
          hurtEnemy(e, s.dmg, w, Math.cos(a) * 60, Math.sin(a) * 60, w.id === 'makanko' && w.evo);
        });
        G.fx.push({ k: 'ray', kind: w.id, x: P.x, y: PY(), ang: a, len, wd, col, life: .22, max: .22 });
      });
      sfx('shot'); break;
    }
    case 'kienzan': {
      const t = nearest(300); const base = aimAt(t);
      for (let i = 0; i < s.n; i++) { const a = base + (i - (s.n - 1) / 2) * .45; addProj({ k: 'disc', w, x: P.x, y: PY(), ang: a, sp: s.spd, out: s.life * .5, back: false, r: 6 * s.area, dmg: s.dmg, life: s.life * 2.2, col, homing: w.evo, cdHit: .3 }); }
      sfx('shot'); break;
    }
    case 'genkidama': {
      addProj({ k: 'genki', w, x: P.x, y: P.y - 40, r: 2, R: Math.min(40, 22 * s.area), boom: Math.min(150, 75 * s.area), dmg: s.dmg, charge: 1.1, life: 5, col, sp: 150 });
      break;
    }
    case 'kikoho': {
      const vis = visibleEnemies(-10); if (!vis.length) return false;
      for (let i = 0; i < s.n; i++) { const t = pick(vis); addProj({ k: 'aoe', w, x: t.x, y: t.y - 6, r: 26 * s.area, dmg: s.dmg, delay: .28, life: .55, max: .55, col, tri: true }); }
      break;
    }
    case 'taiyoken': {
      const R = 120 * s.area; G.flash = Math.max(G.flash, .18);
      G.fx.push({ k: 'ring', x: P.x, y: PY(), r0: 4, r1: R, life: .45, max: .45, col: '#fffbe0' });
      for (const e of G.enemies) { if (e.dead) continue; if ((e.x - P.x) ** 2 + (e.y - P.y) ** 2 < R * R) { e.stun = e.boss ? .4 : s.life; hurtEnemy(e, s.dmg, w); } }
      sfx('pick'); break;
    }
    case 'aura': {
      const R = 30 * s.area;
      query(P.x, P.y - 6, R + 10, e => { if ((e.x - P.x) ** 2 + (e.y - 6 - P.y + 6) ** 2 < (R + e.r) ** 2) { const a = Math.atan2(e.y - P.y, e.x - P.x); hurtEnemy(e, s.dmg, w, Math.cos(a) * 50, Math.sin(a) * 50); } });
      if (w.evo) P.hp = Math.min(P.maxHp, P.hp + .6);
      break;
    }
    case 'orbital': break; // continuo
    case 'hakai': {
      const vis = shuffle(visibleEnemies(-10)); if (!vis.length) return false;
      const normals = vis.filter(e => !e.elite), elites = vis.filter(e => e.elite);
      const ts = normals.slice(0, s.n); if (ts.length < s.n) ts.push(...elites.slice(0, s.n - ts.length));
      ts.forEach(e => { G.fx.push({ k: 'hakai', x: e.x, y: e.y - e.h / 2, r: e.h * .6, life: .6, max: .6 }); burst(e.x, e.y - e.h / 2, 8, '#b06bff', 1.2); hurtEnemy(e, e.elite ? s.dmg * 3 : e.hp + 1, w, 0, 0, !e.elite); });
      sfx('boom'); break;
    }
    case 'kiblade': {
      const tg = nearest(160), a = tg ? aimAt(tg) : Math.atan2(P.diry, P.dirx), R = 46 * s.area, half = w.evo ? Math.PI : 1.25;
      query(P.x, P.y, R + 20, e => {
        const dx = e.x - P.x, dy = e.y - e.h / 2 - PY(), d = Math.hypot(dx, dy); if (d > R + e.r) return;
        let da = Math.atan2(dy, dx) - a; da = Math.atan2(Math.sin(da), Math.cos(da));
        if (Math.abs(da) <= half) hurtEnemy(e, s.dmg, w, dx / (d || 1) * 120, dy / (d || 1) * 120);
      });
      G.fx.push({ k: 'arc', x: P.x, y: PY(), ang: a, half, r: R, col: w.evo ? '#ffd23f' : WEAPONS.kiblade.col, life: .22, max: .22 });
      sfx('hit'); break;
    }
    case 'shockwave': {
      const R = 70 * s.area;
      G.fx.push({ k: 'ring', x: P.x, y: PY(), r0: 8, r1: R, life: .4, max: .4, col: '#ff6a4a' });
      G.fx.push({ k: 'ring', x: P.x, y: PY(), r0: 4, r1: R * .7, life: .3, max: .3, col: '#ffd0a0' });
      query(P.x, P.y, R + 20, e => { const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy); if (d < R + e.r) { hurtEnemy(e, s.dmg, w, dx / (d || 1) * 260, dy / (d || 1) * 260); if (w.evo && !e.boss) e.stun = .8; } });
      G.shake = Math.max(G.shake, .12); sfx('boom'); break;
    }
    case 'combo': {
      const tg = nearest(140), fs = tg ? (tg.x >= P.x ? 1 : -1) : P.face;
      const sides = s.n >= 2 ? [fs, -fs] : [fs];
      const L = (w.evo ? 80 : 34) * s.area, H = (w.evo ? 26 : 22) * s.area;
      sides.forEach((sd, i) => {
        const cx = P.x + sd * (L / 2 + 4), cy = PY();
        for (const e of G.enemies) if (!e.dead && Math.abs(e.x - cx) < L / 2 + e.r && Math.abs(e.y - e.h / 2 - cy) < H / 2 + e.r) hurtEnemy(e, s.dmg, w, sd * 140, 0);
        G.fx.push({ k: 'slash', x: cx, y: cy, dir: sd, L, H, life: .2, max: .2, evo: w.evo, delay: i * .08 });
      });
      for (let i = 2; i < s.n; i++) { const t = nearest(100); if (t) hurtEnemy(t, s.dmg * .6, w); }
      sfx('hit'); break;
    }
  }
  return true;
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }
function updateWeapons(dt) {
  for (const w of P.weapons) {
    if (w.id === 'orbital') { updateOrbital(w, dt); continue; }
    w.t -= dt;
    if (w.t <= 0) { const s = wstats(w); const ok = fireWeapon(w); w.t = ok === false ? .25 : s.cd; }
  }
}
function updateOrbital(w, dt) {
  const s = wstats(w), R = 36 * s.area, r = (w.evo ? 7 : 5) * Math.sqrt(s.area);
  w.ang = (w.ang || 0) + s.spd * dt; w.orbs = [];
  for (let i = 0; i < s.n; i++) {
    const a = w.ang + i / s.n * TAU, ox = P.x + Math.cos(a) * R, oy = PY() + Math.sin(a) * R * .8;
    w.orbs.push([ox, oy, r]);
    query(ox, oy + 8, r + 12, e => {
      if ((e.x - ox) ** 2 + (e.y - e.h / 2 - oy) ** 2 < (r + e.r + 2) ** 2) { const k = 'o' + w.uid; if ((e.hitT[k] || 0) <= G.t) { e.hitT[k] = G.t + s.cd; hurtEnemy(e, s.dmg, w, Math.cos(a) * 90, Math.sin(a) * 90); } }
    });
  }
}
function explode(x, y, R, dmg, w, col) {
  G.fx.push({ k: 'boom', x, y, r: R, life: .4, max: .4, col });
  hitObjsCircle(x, y, R);
  query(x, y + 6, R + 14, e => { const dx = e.x - x, dy = e.y - e.h / 2 - y; if (dx * dx + dy * dy < (R + e.r) ** 2) { const d = Math.hypot(dx, dy) || 1; hurtEnemy(e, dmg, w, dx / d * 150, dy / d * 150); } });
  if (R > 40) { G.shake = Math.max(G.shake, .25); sfx('boom'); }
}
function updateProjs(dt) {
  for (const p of G.projs) {
    p.life -= dt;
    if (p.k === 'ball') {
      if (p.homing) {
        p.rt = (p.rt || 0) - dt;
        if (p.rt <= 0) { p.rt = .15; p.tg = nearest(220, p.x, p.y); }
        if (p.tg && !p.tg.dead) { const a = Math.atan2(p.tg.y - p.tg.h / 2 - p.y, p.tg.x - p.x), sp = Math.hypot(p.vx, p.vy), ca = Math.atan2(p.vy, p.vx); let da = a - ca; da = Math.atan2(Math.sin(da), Math.cos(da)); const na = ca + clamp(da, -p.homing * dt, p.homing * dt); p.vx = Math.cos(na) * sp; p.vy = Math.sin(na) * sp; }
      }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (G.objs.length) hitObjsCircle(p.x, p.y, p.r);
      query(p.x, p.y + 8, p.r + 14, e => {
        if (p.hit.has(e)) return;
        if ((e.x - p.x) ** 2 + (e.y - e.h / 2 - p.y) ** 2 < (p.r + e.r) ** 2) {
          p.hit.add(e); const sp = Math.hypot(p.vx, p.vy) || 1;
          hurtEnemy(e, p.dmg, p.w, p.vx / sp * 70, p.vy / sp * 70);
          if (p.boomEach) explode(p.x, p.y, p.boom * .6, p.bdmg * .5, p.w, p.col);
          if (--p.pierce <= 0) { p.life = 0; return false; }
        }
      });
      if (p.life <= 0 && p.boom) explode(p.x, p.y, p.boom, p.bdmg || p.dmg, p.w, p.col);
    } else if (p.k === 'beam') {
      p.tt -= dt;
      if (p.tt <= 0 && p.dmg) {
        p.tt = p.tick; p.tickN++;
        const k = 'b' + p.id + '_' + p.tickN;
        hitObjsSeg(P.x, PY(), p.ang, p.len, p.wd);
        enemiesOnSeg(P.x, PY(), p.ang, p.len, p.wd, e => { if (!e.hitT[k]) { e.hitT[k] = 1; hurtEnemy(e, p.dmg, p.w, Math.cos(p.ang) * 50, Math.sin(p.ang) * 50); } });
      }
    } else if (p.k === 'disc') {
      if (!p.back) {
        p.out -= dt;
        if (p.homing) { const t = nearest(200, p.x, p.y); if (t) { const a = Math.atan2(t.y - t.h / 2 - p.y, t.x - p.x); let da = Math.atan2(Math.sin(a - p.ang), Math.cos(a - p.ang)); p.ang += clamp(da, -6 * dt, 6 * dt); } }
        p.x += Math.cos(p.ang) * p.sp * dt; p.y += Math.sin(p.ang) * p.sp * dt;
        if (p.out <= 0) p.back = true;
      } else {
        const a = Math.atan2(PY() - p.y, P.x - p.x); p.x += Math.cos(a) * p.sp * 1.25 * dt; p.y += Math.sin(a) * p.sp * 1.25 * dt;
        if ((p.x - P.x) ** 2 + (p.y - PY()) ** 2 < 100) p.life = 0;
      }
      p.spin = (p.spin || 0) + dt * 20;
      query(p.x, p.y + 8, p.r + 14, e => {
        if ((e.x - p.x) ** 2 + (e.y - e.h / 2 - p.y) ** 2 < (p.r + e.r) ** 2) { const k = 'd' + p.id; if ((e.hitT[k] || 0) <= G.t) { e.hitT[k] = G.t + p.cdHit; hurtEnemy(e, p.dmg, p.w, Math.cos(p.ang) * 40, Math.sin(p.ang) * 40); } }
      });
    } else if (p.k === 'aoe') {
      if (p.delay > 0) { p.delay -= dt; p.life += dt; if (p.delay <= 0) { explode(p.x, p.y, p.r, p.dmg, p.w, p.col); } }
    } else if (p.k === 'genki') {
      if (p.charge > 0) {
        p.charge -= dt; p.x = P.x; p.y = P.y - 40 - p.r; p.r = Math.min(p.R, p.r + p.R * dt * 1.2); p.life = 5;
        if (p.charge <= 0) { const vis = visibleEnemies(-20); let best = null, bc = -1; for (let i = 0; i < 8 && vis.length; i++) { const c = pick(vis); let n = 0; query(c.x, c.y, 50, () => { n++; }); if (n > bc) { bc = n; best = c; } } p.tx = best ? best.x : P.x + P.dirx * 80; p.ty = best ? best.y - 8 : P.y + P.diry * 80; }
      } else {
        const a = Math.atan2(p.ty - p.y, p.tx - p.x); p.x += Math.cos(a) * p.sp * dt; p.y += Math.sin(a) * p.sp * dt; p.sp += 220 * dt;
        if ((p.tx - p.x) ** 2 + (p.ty - p.y) ** 2 < 64 || p.life <= 0) { explode(p.x, p.y, p.boom, p.dmg, p.w, p.col); G.shake = .5; G.flash = Math.max(G.flash, .3); p.life = 0; }
      }
    }
  }
  G.projs = G.projs.filter(p => p.life > 0);
}

/* =================== OBJETOS =================== */
function updatePickups(dt) {
  const mag2 = P.magnet * P.magnet;
  for (const g of G.gems) {
    const dx = P.x - g.x, dy = P.y - 6 - g.y, d2 = dx * dx + dy * dy;
    if (!g.mag && d2 < mag2) g.mag = true;
    if (g.mag) { const d = Math.sqrt(d2) || 1, sp = 120 + (g.sp = (g.sp || 0) + 500 * dt); g.x += dx / d * sp * dt; g.y += dy / d * sp * dt; }
    if (d2 < 64) { g.v = -g.v; addXp(-g.v); sfx('gem'); }
  }
  G.gems = G.gems.filter(g => g.v > 0);
  for (const p of G.picks) {
    p.t += dt;
    const dx = P.x - p.x, dy = P.y - 6 - p.y, d2 = dx * dx + dy * dy;
    if (!p.mag && d2 < mag2 * .7) p.mag = true;
    if (p.mag) { const d = Math.sqrt(d2) || 1; p.x += dx / d * 160 * dt; p.y += dy / d * 160 * dt; }
    if (d2 < 100) { p.got = true; collect(p); }
  }
  G.picks = G.picks.filter(p => !p.got);
}
function collect(p) {
  if (p.k === 'zeni') { G.zeni += p.v * P.greed * (1 + .25 * G.curse); sfx('pick'); }
  else if (p.k === 'food') { const h = Math.min(P.maxHp * .15, P.maxHp - P.hp); P.hp += h; G.stat.healed += h; sfx('heal'); floatText('+' + Math.round(h) + ' VIDA', '#59d66b'); }
  else if (p.k === 'senzu') { P.hp = Math.min(P.maxHp, P.hp + P.maxHp * .35); sfx('heal'); floatText('+VIDA', '#59d66b'); }
  else if (p.k === 'radar') { G.gems.forEach(g => g.mag = true); sfx('pick'); floatText('¡RADAR!', '#59d66b'); }
  else if (p.k === 'ball') {
    if (!G.balls.includes(p.v)) G.balls.push(p.v);
    sfx('ball'); floatText(`¡BOLA DE ${p.v} ★!`, '#ffb347');
    if (G.balls.length >= 7) setTimeout(() => { if (state === 'play') openShenron(); }, 400);
  }
  else if (p.k === 'capsule') { openCapsule(); }
}
function floatText(t, col) { G.fx.push({ k: 'text', t, col, x: P.x, y: P.y - 34, life: 1.2, max: 1.2 }); }
function addXp(v) {
  G.xp += v * P.growth * (1 + .2 * G.curse);
  while (G.xp >= G.xpNext) {
    G.xp -= G.xpNext; G.lvl++; G.xpNext = xpNeed(G.lvl); G.pendingLv++;
    if (P.hp > 0) P.hp = Math.min(P.maxHp, P.hp + P.maxHp * .06);
    checkForm();
  }
}
function checkForm() {
  const forms = CHAR[G.cid].forms;
  const f = forms[P.formIdx + 1];
  if (f && G.lvl >= f.lv) {
    P.formIdx++; G.stat.trans++;
    if (P.fused) { P.fused.prev = { spr: f.spr, name: f.name, aura: f.aura || (SPR[f.spr] && SPR[f.spr].aura) || '#ffffff' }; recalc(); markSeen(f.spr); return; }
    P.spr = f.spr; P.name = f.name; P.aura = f.aura || (SPR[f.spr] && SPR[f.spr].aura) || '#ffffff';
    recalc(); P.hp = Math.min(P.maxHp, P.hp + P.maxHp * .3);
    markSeen(f.spr);
    G.intro = { kind: 'trans', t: 1.7, max: 1.7, spr: f.spr, name: f.name, col: P.aura };
    sfx('trans'); G.shake = .7; G.flash = .5;
    shockwave(150, 60 + G.lvl * 4);
    G.fx.push({ k: 'pillar', x: P.x, y: P.y, life: 1.1, max: 1.1, col: P.aura });
  }
}
function burst(x, y, n, col, sp = 1) {
  for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = rand(20, 80) * sp; G.fx.push({ k: 'p', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, life: rand(.25, .6), max: .6, col: Math.random() < .5 ? col : '#ffffff', s: Math.random() < .3 ? 2 : 1 }); }
}
function updateFx(dt) {
  for (const f of G.fx) {
    if (f.delay > 0) { f.delay -= dt; continue; }
    f.life -= dt; if (f.k === 'p') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 80 * dt; }
    if (f.k === 'text') f.y -= 18 * dt;
  }
  G.fx = G.fx.filter(f => f.life > 0);
  for (const n of G.nums) { n.life -= dt; n.y -= 22 * dt; }
  G.nums = G.nums.filter(n => n.life > 0);
  G.shake = Math.max(0, G.shake - dt * 1.6); G.flash = Math.max(0, G.flash - dt * 1.4);
  if (G.spTint && (G.spTint.t -= dt) <= 0) G.spTint = null;
}

/* =================== TÉCNICA ESPECIAL =================== */
let SP_MUL = 1;
function spPow() { return P.might * (1 + G.lvl * .08) * SP_MUL; }
function useSpecial() {
  if (state !== 'play' || !G || G.intro || P.hp <= 0 || G.endT >= 0 || P.spT > 0) return;
  const sp = curSpecial(); if (!sp) return;
  P.spT = sp.cd; G.stat.specials++; vibrate(20); sfx('trans'); G.flash = Math.max(G.flash, .2);
  G.fx.push({ k: 'ring', x: P.x, y: P.y - 10, r0: 4, r1: 46, life: .45, max: .45, col: sp.col });
  floatText(sp.name.toUpperCase(), sp.col);
  for (const [k, o] of sp.fx) SPFX[k](o, sp.col);
}
function later(t, fn) { G.spq.push({ t, fn }); }
const SPFX = {
  nova(o, col) {
    G.fx.push({ k: 'ring', x: P.x, y: P.y - 10, r0: 8, r1: o.R, life: .55, max: .55, col });
    shockwave(o.R, o.dmg * (1 + G.lvl * .08) * SP_MUL); G.shake = Math.max(G.shake, .5); sfx('boom');
  },
  beam(o, col) {
    const tg = nearest(320), base = tg ? aimAt(tg) : Math.atan2(P.diry, P.dirx), ts = o.target ? nearestN(o.n, 320) : [];
    for (let i = 0; i < (o.n || 1); i++) {
      const ang = o.target ? (ts[i] ? aimAt(ts[i]) : base + rand(-1, 1)) : o.ring ? base + i / o.n * TAU : base + (i - ((o.n || 1) - 1) / 2) * (o.spread || .3);
      addProj({ k: 'beam', w: null, ang, len: o.len, wd: o.wd, dmg: o.dmg * spPow(), life: o.life, max: o.life, tick: .12, tt: 0, col, tickN: 0 });
    }
    sfx('beam'); G.shake = Math.max(G.shake, .35);
  },
  dash(o, col) {
    for (let i = 0; i < (o.n || 1); i++) later(i * .18, () => {
      const tg = nearest(260), ang = tg ? Math.atan2(tg.y - P.y, tg.x - P.x) : Math.atan2(P.diry, P.dirx);
      const dist = tg ? Math.min(o.dist, Math.hypot(tg.x - P.x, tg.y - P.y) + 24) : o.dist;
      enemiesOnSeg(P.x, PY(), ang, dist, 16, e => hurtEnemy(e, o.dmg * spPow(), null, Math.cos(ang) * 220, Math.sin(ang) * 220));
      P.x += Math.cos(ang) * dist; P.y += Math.sin(ang) * dist; P.inv = Math.max(P.inv, .5);
      if (Math.abs(Math.cos(ang)) > .1) P.face = Math.cos(ang) > 0 ? 1 : -1;
      addProj({ k: 'beam', w: null, ang: ang + Math.PI, len: dist, wd: 7, dmg: 0, life: .25, max: .25, tick: 1, tt: 0, col, tickN: 0 });
      burst(P.x, P.y - 8, 10, col, 1.6); sfx('kill');
    });
  },
  freeze(o, col) {
    let list;
    if (o.R) list = G.enemies.filter(e => !e.dead && (e.x - P.x) ** 2 + (e.y - P.y) ** 2 < o.R * o.R);
    else if (o.n) list = nearestN(o.n, 400);
    else if (o.vis) list = visibleEnemies(20);
    else list = G.enemies.filter(e => !e.dead);
    for (const e of list) { e.stun = e.boss ? o.t * .35 : o.t; if (o.dmg) hurtEnemy(e, o.dmg * spPow(), null); }
    if (o.all) { G.eprojs = G.eprojs.filter(b => b.k === 'beam' && b.warn > 0); G.spTint = { t: o.t, max: o.t, col: '#8a90b8' }; }
    else if (o.R) G.fx.push({ k: 'ring', x: P.x, y: P.y - 10, r0: 6, r1: o.R, life: .4, max: .4, col: '#ffffff' });
    G.flash = Math.max(G.flash, o.R ? .55 : .3);
  },
  heal(o) {
    P.hp = Math.min(P.maxHp, P.hp + P.maxHp * o.pct); if (o.imm) P.immortal = Math.max(P.immortal, o.imm);
    burst(P.x, P.y - 10, 16, '#59d66b', 1.2); sfx('heal');
  },
  rage(o, col) {
    P.rage = Object.assign({}, o, { col }); recalc();
    G.fx.push({ k: 'pillar', x: P.x, y: P.y, life: .8, max: .8, col });
  },
  shield(o) { P.shieldT = Math.max(P.shieldT, o.t); },
  rain(o, col) {
    for (let i = 0; i < o.n; i++) later(.15 + i * o.dur / o.n, () => {
      const vs = visibleEnemies(0), e = vs.length ? pick(vs) : null;
      const x = e ? e.x : P.x + rand(-80, 80), y = e ? e.y - e.h / 2 : P.y + rand(-60, 60);
      explode(x, y, o.R, o.dmg * spPow(), null, col);
    });
  },
  bomb(o, col) {
    const tg = G.boss && !G.boss.dead ? G.boss : nearest(300);
    const x = tg ? tg.x : P.x + P.dirx * 60, y = tg ? tg.y - tg.h / 2 : P.y + P.diry * 60;
    G.fx.push({ k: 'ring', x, y, r0: o.R, r1: 4, life: o.delay, max: o.delay, col });
    later(o.delay, () => { explode(x, y, o.R, o.dmg * spPow(), null, col); G.shake = Math.max(G.shake, .7); G.flash = Math.max(G.flash, .4); });
  },
  hakai(o) {
    const vs = visibleEnemies(10).filter(e => !e.boss).sort((a, b) => b.hp - a.hp).slice(0, o.n);
    vs.forEach((e, i) => later(i * .07, () => { if (e.dead) return; G.fx.push({ k: 'hakai', x: e.x, y: e.y - e.h / 2, r: 14, life: .5, max: .5 }); killEnemy(e, null); }));
    if (G.boss && !G.boss.dead) { G.fx.push({ k: 'hakai', x: G.boss.x, y: G.boss.y - G.boss.h / 2, r: 24, life: .6, max: .6 }); hurtEnemy(G.boss, G.boss.maxHp * o.boss, null); }
  },
  candy() {
    for (const e of visibleEnemies(10)) {
      if (e.boss) continue;
      if (e.elite) hurtEnemy(e, 60 * spPow(), null); else killEnemy(e, { id: 'candy', dealt: 0 });
    }
    G.flash = Math.max(G.flash, .3);
  },
  absorb(o, col) {
    let n = 0;
    for (const e of G.enemies) if (!e.dead && (e.x - P.x) ** 2 + (e.y - P.y) ** 2 < o.R * o.R) { hurtEnemy(e, o.dmg * spPow(), null, (P.x - e.x) * .6, (P.y - e.y) * .6); n++; }
    P.hp = Math.min(P.maxHp, P.hp + Math.min(n * o.heal, P.maxHp * .5));
    G.fx.push({ k: 'ring', x: P.x, y: P.y - 10, r0: o.R, r1: 6, life: .5, max: .5, col }); sfx('heal');
  },
  fortune(o) {
    for (const g of G.gems) g.mag = true;
    for (const p of G.picks) if (p.k === 'zeni' || p.k === 'senzu') p.mag = true;
    for (const e of visibleEnemies(20)) e.stun = e.boss ? 1 : o.t;
    for (let i = 0; i < o.z; i++) dropPick('zeni', P.x + rand(-40, 40), P.y + rand(-34, 34), Math.ceil(rand(1, 3) * (G.si + 1)));
    sfx('ball');
  },
};

/* =================== MEJORAS =================== */
function buildChoices(count) {
  const opts = [];
  P.weapons.forEach(w => {
    const d = WEAPONS[w.id];
    if (w.lvl >= MAXW && !w.evo && P.passives.some(p => p.id === d.evo.with)) opts.push({ t: 'evo', id: w.id, wt: 1000 });
    else if (w.lvl < MAXW) opts.push({ t: 'wup', id: w.id, wt: 10 });
  });
  if (P.weapons.length < 6) Object.keys(WEAPONS).forEach(id => { if (!P.weapons.some(w => w.id === id)) opts.push({ t: 'wnew', id, wt: 5 }); });
  P.passives.forEach(p => { if (p.lvl < (PASSIVES[p.id].max || MAXP)) opts.push({ t: 'pup', id: p.id, wt: 7 }); });
  if (P.passives.length < 6) Object.keys(PASSIVES).forEach(id => { if (!P.passives.some(p => p.id === id)) opts.push({ t: 'pnew', id, wt: 5 }); });
  const out = [];
  while (out.length < count && opts.length) {
    const tot = opts.reduce((a, o) => a + o.wt, 0); let r = Math.random() * tot, i = 0;
    for (; i < opts.length; i++) { r -= opts[i].wt; if (r <= 0) break; }
    out.push(opts.splice(Math.min(i, opts.length - 1), 1)[0]);
  }
  if (!out.length) out.push({ t: 'senzu' }, { t: 'zeni' });
  return out;
}
function applyChoice(o) {
  if (o.t === 'wnew') P.weapons.push(newWeapon(o.id));
  else if (o.t === 'wup') P.weapons.find(w => w.id === o.id).lvl++;
  else if (o.t === 'evo') { const w = P.weapons.find(w => w.id === o.id); w.evo = true; G.stat.evos++; banner('¡EVOLUCIÓN!', WEAPONS[o.id].evo.name); sfx('trans'); markSeen('evo_' + o.id); }
  else if (o.t === 'pnew') P.passives.push({ id: o.id, lvl: 1 });
  else if (o.t === 'pup') P.passives.find(p => p.id === o.id).lvl++;
  else if (o.t === 'senzu') P.hp = Math.min(P.maxHp, P.hp + P.maxHp * .3);
  else if (o.t === 'zeni') G.zeni += 25 * (G.si + 1);
  recalc();
}
function choiceInfo(o) {
  if (o.t === 'senzu') return { name: 'Semilla del Ermitaño', lv: 'Objeto', desc: 'Recupera un 30% de vida.', icon: makeIcon('senzu', '#59d66b') };
  if (o.t === 'zeni') return { name: 'Bolsa de zenis', lv: 'Objeto', desc: `+${25 * (G.si + 1)} zenis.`, icon: makeIcon('zeni', '#ffd23f') };
  if (o.t === 'evo') { const d = WEAPONS[o.id]; return { name: d.evo.name, lv: 'EVOLUCIÓN', desc: d.evo.desc, icon: makeIcon(d.icon, '#ffd23f'), evo: true }; }
  if (o.t === 'wnew' || o.t === 'wup') {
    const d = WEAPONS[o.id], w = P.weapons.find(w => w.id === o.id);
    const lv = w ? w.lvl + 1 : 1;
    return { name: d.name, lv: w ? `Nivel ${lv}` : '¡NUEVO ATAQUE!', desc: w ? upDesc(d.up[w.lvl - 1]) : d.desc, icon: makeIcon(d.icon, d.col), hint: !w || lv === MAXW ? `Evoluciona con ${PASSIVES[d.evo.with].name}` : '' };
  }
  const d = PASSIVES[o.id], p = P.passives.find(p => p.id === o.id);
  const evoFor = Object.values(WEAPONS).filter(w => w.evo.with === o.id).map(w => w.name);
  return { name: d.name, lv: p ? `Nivel ${p.lvl + 1}` : '¡NUEVA PASIVA!', desc: d.desc, icon: makeIcon(d.icon, d.col), hint: !p && evoFor.length ? 'Evoluciona: ' + evoFor.slice(0, 2).join(', ') : '' };
}
function upDesc(u) {
  const t = [];
  for (const k in u) {
    const v = u[k];
    if (k === 'dmg') t.push(`+${v} de daño`);
    else if (k === 'n') t.push(`+${v} proyectil${v > 1 ? 'es' : ''}`);
    else if (k === 'cd') t.push(`${v < 0 ? '-' : '+'}${Math.abs(v)} s de recarga`);
    else if (k === 'area') t.push(`+${Math.round(v * 100)}% de área`);
    else if (k === 'pierce') t.push(`atraviesa +${v} enemigo${v > 1 ? 's' : ''}`);
    else if (k === 'life') t.push(`+${Math.round(v * 100)}% de duración`);
    else if (k === 'spd') t.push(`+velocidad de giro`);
  }
  const s = t.map(L).join(', ');
  return s.charAt(0).toUpperCase() + s.slice(1) + '.';
}

/* =================== BUCLE PRINCIPAL =================== */
function update(dt) {
  if (G.intro) { G.intro.t -= dt; if (G.intro.t <= 0) G.intro = null; return; }
  if (G.hs > 0) { G.hs -= dt; return; }
  G.t += dt;
  updatePlayer(dt);
  updateFusion(dt);
  updateBuddy(dt);
  if (G.endT < 0 && G.victoryT < 0) director(dt);
  rebuildGrid();
  if (P.hp > 0) updateWeapons(dt);
  updateProjs(dt);
  rebuildGrid();
  updateEnemies(dt);
  updateEProjs(dt);
  updatePickups(dt);
  updateObjs(dt);
  updateFx(dt);
  G.enemies = G.enemies.filter(e => !e.dead);
  if (G.boss && G.boss.dead) G.boss = null;
  if (G.endT >= 0) { G.endT -= dt; if (G.endT < 0) endRun(false); return; }
  if (G.victoryT >= 0) { G.victoryT -= dt; if (G.victoryT < 0) { endRun(true); return; } }
  if (G.pendingLv > 0 && state === 'play') openLevelUp();
}
let lastT = performance.now();
// Si con el movimiento suave el equipo no llega a 45 fps durante 4 s, se pasa al modo clásico en esta sesión
const perfWin = { t: 0, n: 0 };
function perfWatch(raw) {
  if (perfLow || save.opts.smooth === false || state !== 'play' || !G || G.t < 3 || document.hidden || raw > .25) { perfWin.t = perfWin.n = 0; return; }
  perfWin.t += raw; perfWin.n++;
  if (perfWin.t < 4) return;
  if (perfWin.t / perfWin.n > 1 / 45) { perfLow = true; banner('MODO RENDIMIENTO', 'Movimiento clásico para que vaya más fluido'); }
  perfWin.t = perfWin.n = 0;
}
function loop(now) {
  const raw = (now - lastT) / 1000, dt = Math.min(.05, raw); lastT = now;
  perfWatch(raw);
  if (typeof pollPad === 'function') pollPad(dt);
  if (state === 'play' && G) update(dt);
  render(dt);
  requestAnimationFrame(loop);
}
</script>
