<script>
/* =================== DIFICULTADES Y MODOS =================== */
const DIFFS = [
  { id: 0, name: 'Normal', col: '#59d66b', hp: 1, dmg: 1, spawn: 1, zeni: 1, xp: 1, desc: 'La experiencia de siempre.' },
  { id: 1, name: 'Difícil', col: '#ffb03a', hp: 1.7, dmg: 1.4, spawn: 1.2, zeni: 1.6, xp: 1.3, desc: 'Enemigos más duros y más numerosos. Zenis x1,6.' },
  { id: 2, name: 'Pesadilla', col: '#e8433a', hp: 2.8, dmg: 1.9, spawn: 1.4, zeni: 2.5, xp: 1.6, desc: 'Solo para guerreros de élite. Zenis x2,5.' },
];
// Premio la primera vez que completas una saga en esa dificultad
const DIFF_PRIZE = { 1: { t: 'g', n: 2, txt: '2 Cápsulas Doradas' }, 2: { t: 'gods', n: 1, txt: 'Caja Divina' } };
function diffUnlocked(si, d) { const id = STAGES[si].id; return d === 0 ? stageUnlocked(si) : d === 1 ? !!save.cleared[id] : !!save.clearedD[id + ':1']; }
function endlessUnlocked() { return !!save.cleared.saiyan; }
function runScore() { return Math.round(G.kills + G.t * 5 + G.killedBosses.length * 300 + G.lvl * 10); }

/* =================== COMPAÑERO Y FUSIONES =================== */
const FUSIONS = [
  { a: 'goku', b: 'vegeta', into: 'gogeta', how: 'Danza de la Fusión' },
  { a: 'goten', b: 'trunks', into: 'gotenks', how: 'Danza de la Fusión' },
  { a: 'kale', b: 'caulifla', into: 'kefla', how: 'Pendientes Potara' },
];
function fusionOf(a, b) { return FUSIONS.find(f => (f.a === a && f.b === b) || (f.a === b && f.b === a)) || null; }
const FUSION_TIME = 25;
const SAIYANS = new Set(['goku', 'vegeta', 'gohan', 'goten', 'trunks', 'raditz', 'nappa', 'bardock', 'turles', 'cabba', 'caulifla', 'kale', 'broly', 'pan', 'gotenks', 'vegito', 'gogeta', 'kefla']);

function newBuddy(id) {
  if (!id || !CHAR[id] || id === G.cid || !isUnlocked(CHAR[id])) return null;
  return { id, x: P.x - 16, y: P.y + 4, face: 1, frame: 0, ft: 0, atkT: 1, spT: 8 };
}
function updateBuddy(dt) {
  const B = G.buddy; if (!B || P.fused) return;
  const tx = P.x - P.face * 16, ty = P.y + 3, dx = tx - B.x, dy = ty - B.y, d = Math.hypot(dx, dy);
  if (d > 160) { B.x = tx; B.y = ty; }
  else if (d > 2) { const sp = Math.min(d * 6, P.spd * 1.6) * dt; B.x += dx / d * sp; B.y += dy / d * sp; B.face = dx > .5 ? 1 : dx < -.5 ? -1 : B.face; }
  B.ft += dt; if (B.ft > (d > 4 ? .14 : .4)) { B.ft = 0; B.frame = d > 4 ? B.frame ^ 1 : 0; }
  B.atkT -= dt;
  if (B.atkT <= 0) {
    const t = nearest(220, B.x, B.y);
    B.atkT = t ? 1.05 : .3;
    if (t) {
      const a = Math.atan2(t.y - t.h / 2 - (B.y - 9), t.x - B.x), c = CHAR[B.id], dmg = (7 + G.lvl * .9) * (1 + (starsOf(B.id) - 1) * .1) * P.might * .7;
      addProj({ k: 'ball', w: null, x: B.x, y: B.y - 9, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, r: 3, dmg, pierce: 2, life: 1.3, col: (SPECIALS[c.id] || {}).col || '#ffd23f', hit: new Set() });
    }
  }
  B.spT -= dt;
  if (B.spT <= 0 && visibleEnemies(0).length >= 6 && !G.intro) {
    const sp = SPECIALS[B.id]; if (!sp) return;
    B.spT = sp.cd * 1.6;
    floatTextAt(B.x, B.y - 30, sp.name.toUpperCase(), sp.col);
    SP_MUL = .6;
    for (const [k, o] of sp.fx) { if (k === 'dash') SPFX.nova({ R: 80, dmg: o.dmg }, sp.col); else SPFX[k](o, sp.col); }
    SP_MUL = 1;
    G.stat.buddySp++;
  }
}
function floatTextAt(x, y, t, col) { G.fx.push({ k: 'text', t, col, x, y, life: 1.3, max: 1.3 }); }
function fusionReady() { return G.fusionPair && !P.fused && G.fuse >= G.fuseNeed && P.hp > 0; }
function startFusion() {
  if (!fusionReady() || state !== 'play' || G.intro) return;
  const f = G.fusionPair, into = CHAR[f.into];
  P.fused = { into: f.into, t: FUSION_TIME, prev: { spr: P.spr, name: P.name, aura: P.aura }, spT: P.spT };
  P.spr = f.into; P.name = f.name || into.name; P.aura = (SPR[f.into] && SPR[f.into].aura) || '#ffd23f';
  P.spT = 0; G.fuse = 0; G.fuseNeed = Math.round(G.fuseNeed * 1.4);
  recalc(); P.hp = Math.min(P.maxHp, P.hp + P.maxHp * .4);
  markSeen(f.into);
  G.intro = { kind: 'trans', t: 1.9, max: 1.9, spr: f.into, name: P.name, col: P.aura, top: '¡' + f.how.toUpperCase() + '!' };
  sfx('trans'); G.shake = .8; G.flash = .6; vibrate(60);
  shockwave(170, 80 + G.lvl * 5);
  G.fx.push({ k: 'pillar', x: P.x, y: P.y, life: 1.2, max: 1.2, col: P.aura });
  G.stat.fusions++;
}
function updateFusion(dt) {
  if (!P.fused) return;
  P.fused.t -= dt;
  if (P.fused.t <= 0) {
    const pv = P.fused.prev; P.spr = pv.spr; P.name = pv.name; P.aura = pv.aura;
    P.spT = Math.max(P.fused.spT, 4); P.fused = null; recalc();
    banner('LA FUSIÓN HA TERMINADO', 'Sigue cargando el medidor para repetirla');
    burst(P.x, P.y - 10, 24, '#ffffff', 2);
    if (G.buddy) { G.buddy.x = P.x - 16; G.buddy.y = P.y + 4; }
  }
}
function curSpecial() { return SPECIALS[P && P.fused ? P.fused.into : G.cid]; }

/* =================== EVENTOS EN PARTIDA =================== */
const EVENTS = {
  horde: { name: '¡HORDA!', desc: 'Acaba con toda la horda antes de que pase el tiempo' },
  supply: { name: 'CÁPSULA DE SUMINISTROS', desc: 'Quédate dentro del círculo para recogerla' },
  tourney: { name: 'TORNEO DE ARTES MARCIALES', desc: 'Vence a 3 luchadores sin salir del ring' },
  moon: { name: '¡LUNA LLENA!', desc: 'Un Gran Mono anda suelto. Los Saiyan ganan poder' },
};
const TOURNEY_FIGHTERS = ['tennenman', 'guldo', 'burter', 'jeice', 'recoome', 'a19', 'a17', 'yakon', 'spopovich', 'kale', 'dyspo'];
function eventTick(dt) {
  if (G.ev) { updateEvent(dt); return; }
  if (G.t < G.evT || G.boss || G.intro || G.endT >= 0 || G.victoryT >= 0) return;
  const opts = ['horde', 'supply', 'supply', 'horde'];
  if (G.t > 150) opts.push('tourney', 'tourney');
  if (G.t > 200 && !G.moonDone) opts.push('moon');
  startEvent(pick(opts));
  G.evT = G.t + rand(100, 140);
}
function startEvent(k) {
  const d = EVENTS[k], ev = { k, name: d.name, desc: d.desc, t: 40, max: 40 };
  const lvlMul = 1 + G.si * .5;
  if (k === 'horde') {
    const n = 30 + G.si * 4, R = Math.max(VW, VH) * .5, id = poolPick();
    for (let i = 0; i < n; i++) { const a = i / n * TAU, e = spawnEnemy(id, P.x + Math.cos(a) * R, P.y + Math.sin(a) * R); e.ev = 1; }
    ev.t = ev.max = 35; ev.total = n;
  } else if (k === 'supply') {
    const a = Math.random() * TAU, R = Math.min(VW, VH) * .32;
    Object.assign(ev, { x: P.x + Math.cos(a) * R, y: P.y + Math.sin(a) * R, R: 26, prog: 0, need: 7, t: 45, max: 45 });
  } else if (k === 'tourney') {
    Object.assign(ev, { x: P.x, y: P.y, R: 105, n: 0, cur: null, t: 80, max: 80, list: shuffle(TOURNEY_FIGHTERS.slice()).slice(0, 3) });
    for (const e of G.enemies) if (!e.boss && (e.x - P.x) ** 2 + (e.y - P.y) ** 2 < 130 * 130) { const d2 = Math.hypot(e.x - P.x, e.y - P.y) || 1; e.kx += (e.x - P.x) / d2 * 400; e.ky += (e.y - P.y) / d2 * 400; }
    tourneyNext(ev);
  } else if (k === 'moon') {
    const [x, y] = spawnPos(Math.max(VW, VH) * .45), e = spawnEnemy('ozaru_w', x, y, false);
    e.elite = true; e.scale = 2.4; e.r = 12; e.h = 28 * 2.4; e.hp = e.maxHp = 900 * enemyHpMul() * lvlMul; e.ev = 1;
    Object.assign(ev, { mon: e, t: 55, max: 55 }); G.moonDone = 1;
    if (SAIYANS.has(G.cid)) { P.moon = 1; recalc(); floatText('¡PODER DE LA LUNA! +40% DAÑO', '#ffd23f'); }
  }
  G.ev = ev;
  banner(d.name, d.desc); sfx('boss');
}
function tourneyNext(ev) {
  if (ev.n >= ev.list.length) return endEvent(true);
  const a = Math.random() * TAU, id = ev.list[ev.n], e = spawnEnemy(id, ev.x + Math.cos(a) * ev.R * .8, ev.y + Math.sin(a) * ev.R * .8, true);
  e.elite = true; e.hp = e.maxHp = ENEMIES[id].hp * enemyHpMul() * (.8 + ev.n * .25); e.ev = 1; e.name = 'Luchador ' + (ev.n + 1) + ': ' + e.name;
  ev.cur = e; ev.n++;
  G.fx.push({ k: 'ring', x: e.x, y: e.y - 10, r0: 30, r1: 4, life: .5, max: .5, col: '#ffd23f' });
}
function updateEvent(dt) {
  const ev = G.ev; ev.t -= dt;
  if (ev.k === 'horde') {
    ev.left = G.enemies.filter(e => e.ev && !e.dead).length;
    if (ev.left === 0) return endEvent(true);
  } else if (ev.k === 'supply') {
    const inside = (P.x - ev.x) ** 2 + (P.y - ev.y) ** 2 < ev.R * ev.R;
    if (inside) { ev.prog += dt; if (Math.random() < dt * 6) burst(ev.x + rand(-ev.R, ev.R) * .6, ev.y + rand(-ev.R, ev.R) * .6, 1, '#59d66b', .6); }
    if (ev.prog >= ev.need) return endEvent(true);
  } else if (ev.k === 'tourney') {
    if ((P.x - ev.x) ** 2 + (P.y - ev.y) ** 2 > (ev.R + 6) ** 2) { banner('¡FUERA DEL RING!', 'Has perdido el torneo'); return endEvent(false, true); }
    if (ev.cur && ev.cur.dead) tourneyNext(ev);
    if (!G.ev) return;
  } else if (ev.k === 'moon') {
    if (ev.mon.dead) return endEvent(true);
  }
  if (ev.t <= 0) endEvent(false);
}
function endEvent(ok, quiet) {
  const ev = G.ev; if (!ev) return;
  G.ev = null;
  if (P.moon) { P.moon = 0; recalc(); }
  if (ev.k === 'moon' && !ok && ev.mon && !ev.mon.dead) { ev.mon.dead = true; burst(ev.mon.x, ev.mon.y - 20, 30, '#ffffff', 2); }
  if (ev.k === 'tourney' && !ok && ev.cur && !ev.cur.dead) ev.cur.name = ENEMIES[ev.cur.id].name;
  if (!ok) { if (!quiet) banner('EVENTO FALLIDO', ev.name); return; }
  G.stat.events++;
  const z = Math.round((ev.k === 'tourney' ? 90 : ev.k === 'moon' ? 80 : 45) * (G.si + 1) * G.diff.zeni);
  for (let i = 0; i < 8; i++) dropPick('zeni', P.x + rand(-30, 30), P.y + rand(-24, 24), Math.ceil(z / 8));
  if (ev.k === 'supply') dropPick('capsule', ev.x, ev.y);
  if (ev.k === 'horde') dropPick('senzu', P.x + 12, P.y);
  if (ev.k === 'tourney' || ev.k === 'moon') dropBall(P.x - 14, P.y);
  banner('¡EVENTO SUPERADO!', ev.name + ' · recoge tu premio'); sfx('ball'); vibrate(40);
}

/* =================== SENSACIÓN: micro-pausa y vibración =================== */
function hitstop(t) { if (G) G.hs = Math.max(G.hs || 0, t); }
function vibrate(ms) { try { if (save.opts.vib && navigator.vibrate) navigator.vibrate(ms); } catch (e) { } }

/* =================== ESTADÍSTICAS, NIVEL DE CUENTA, MISIONES Y LOGROS =================== */
const STAT_KEYS = ['wins', 'time', 'specials', 'bosses', 'boxes', 'events', 'fusions', 'shenron', 'evos', 'trans', 'zeniRun', 'daily', 'level'];
function accNeed(l) { return 120 + (l - 1) * 70; }
function accReward(l) {
  const r = { z: 150 + l * 30 };
  if (l % 5 === 0) r.t = 'g';
  if (l % 10 === 0) r.t2 = 'saiyan';
  return r;
}
const LVL_TITLES = { 5: 'guerrero_z', 15: 'elite', 25: 'ssgod', 40: 'angel' };
const TITLES = {
  novato: 'Aprendiz de Kame', guerrero_z: 'Guerrero Z', elite: 'Élite Saiyan', ssgod: 'Super Saiyan Dios', angel: 'Ángel del Universo 7',
  exterminador: 'Exterminador', calamidad: 'Calamidad galáctica', discipulo: 'Discípulo constante', heroe: 'Héroe del multiverso',
  leyenda: 'Leyenda de Pesadilla', cazadioses: 'Cazador de dioses', capsulas: 'Maestro de las cápsulas', fusionado: 'Fusión perfecta',
  inmortal: 'Inmortal', devoto: 'Devoto del ki', saqueador: 'Saqueador', millonario: 'Millonario', explorador: 'Explorador curioso', deseo: 'Amigo de Shenron',
};
const ACHIEVEMENTS = [
  { id: 'k1', name: 'Primeros pasos', desc: 'Derrota a 1.000 enemigos', v: () => save.kills, g: 1000, rw: { z: 500 } },
  { id: 'k2', name: 'Exterminador', desc: 'Derrota a 10.000 enemigos', v: () => save.kills, g: 10000, rw: { z: 1500, title: 'exterminador' } },
  { id: 'k3', name: 'Calamidad galáctica', desc: 'Derrota a 50.000 enemigos', v: () => save.kills, g: 50000, rw: { z: 4000, t: 'gods', title: 'calamidad' } },
  { id: 'r1', name: 'Guerrero constante', desc: 'Juega 10 partidas', v: () => save.runs, g: 10, rw: { z: 400 } },
  { id: 'r2', name: 'Entrenamiento diario', desc: 'Juega 50 partidas', v: () => save.runs, g: 50, rw: { z: 1500, title: 'discipulo' } },
  { id: 's1', name: 'El primer Saiyan', desc: 'Completa la Saga Saiyan', v: () => save.cleared.saiyan ? 1 : 0, g: 1, rw: { t: 'g' } },
  { id: 's5', name: 'Héroe del multiverso', desc: 'Completa las 5 sagas', v: () => STAGES.filter(s => save.cleared[s.id]).length, g: 5, rw: { z: 3000, title: 'heroe' } },
  { id: 'd1', name: 'Sin miedo', desc: 'Completa una saga en Difícil', v: () => Object.keys(save.clearedD).filter(k => k.endsWith(':1')).length, g: 1, rw: { z: 1500 } },
  { id: 'd2', name: 'Pesadilla superada', desc: 'Completa una saga en Pesadilla', v: () => Object.keys(save.clearedD).filter(k => k.endsWith(':2')).length, g: 1, rw: { t: 'gods', title: 'leyenda' } },
  { id: 'b1', name: 'Cazajefes', desc: 'Derrota a 25 jefes', v: () => save.stats.bosses, g: 25, rw: { z: 1000 } },
  { id: 'b2', name: 'Cazador de dioses', desc: 'Derrota a 100 jefes', v: () => save.stats.bosses, g: 100, rw: { z: 3000, title: 'cazadioses' } },
  { id: 'c1', name: 'Coleccionista', desc: 'Consigue 10 guerreros', v: () => CHARS.filter(isUnlocked).length, g: 10, rw: { z: 600 } },
  { id: 'c2', name: '¡Hazte con todos!', desc: 'Consigue 25 guerreros', v: () => CHARS.filter(isUnlocked).length, g: 25, rw: { z: 2000, t: 'g' } },
  { id: 'c3', name: 'Álbum completo', desc: 'Consigue los 54 guerreros', v: () => CHARS.filter(isUnlocked).length, g: CHARS.length, rw: { z: 10000, title: 'capsulas' } },
  { id: 'st', name: 'Poder al máximo', desc: 'Sube un guerrero a 5★', v: () => Math.max(0, ...CHARS.map(c => starsOf(c.id))), g: MAX_STARS, rw: { z: 1500 } },
  { id: 'sp', name: 'Técnica secreta', desc: 'Usa 100 técnicas especiales', v: () => save.stats.specials, g: 100, rw: { z: 1000 } },
  { id: 'fu', name: 'Danza de la fusión', desc: 'Fusiónate 10 veces', v: () => save.stats.fusions, g: 10, rw: { z: 1500, title: 'fusionado' } },
  { id: 'sh', name: 'Deseo concedido', desc: 'Invoca a Shenron 5 veces', v: () => save.stats.shenron, g: 5, rw: { z: 1500, title: 'deseo' } },
  { id: 'ev', name: 'Aventurero', desc: 'Supera 20 eventos de partida', v: () => save.stats.events, g: 20, rw: { z: 1200 } },
  { id: 'i1', name: 'Superviviente', desc: 'Aguanta 15 minutos en Supervivencia', v: () => Math.floor((save.stats.bestInfT || 0) / 60), g: 15, rw: { z: 1500 } },
  { id: 'i2', name: 'Inmortal', desc: 'Aguanta 30 minutos en Supervivencia', v: () => Math.floor((save.stats.bestInfT || 0) / 60), g: 30, rw: { z: 4000, title: 'inmortal' } },
  { id: 'a1', name: 'Veterano', desc: 'Llega al nivel de cuenta 10', v: () => save.acc.lvl, g: 10, rw: { t: 'saiyan' } },
  { id: 'zn', name: 'Millonario', desc: 'Gana 100.000 zenis en partidas', v: () => save.stats.zeniRun, g: 100000, rw: { title: 'millonario' } },
  { id: 'dm', name: 'Constancia', desc: 'Completa 30 misiones diarias', v: () => save.stats.daily, g: 30, rw: { z: 2000, t: 'g' } },
  { id: 'sr', name: 'Devoto del ki', desc: 'Activa 25 altares de ki', v: () => save.stats.shrines, g: 25, rw: { z: 1500, title: 'devoto' } },
  { id: 'ch', name: 'Saqueador', desc: 'Abre 50 cofres del mapa', v: () => save.stats.chests, g: 50, rw: { z: 2000, title: 'saqueador' } },
  { id: 'eg', name: 'Curioso', desc: 'Encuentra el secreto de la tienda', v: () => save.eggWasd ? 1 : 0, g: 1, rw: { title: 'explorador' }, secret: 1 },
];
// Plantillas de misiones diarias. max = cuenta el mejor valor de una sola partida.
const MISSIONS = [
  { k: 'kills', txt: n => `Derrota a ${fmtNum(n)} enemigos`, g: [300, 600, 1000], z: [250, 400, 600] },
  { k: 'surv', max: 1, txt: n => `Sobrevive ${n} minutos en una partida`, g: [4, 7, 10], z: [250, 400, 600] },
  { k: 'specials', txt: n => `Usa ${n} técnicas especiales`, g: [6, 12], z: [250, 400] },
  { k: 'bosses', txt: n => `Derrota a ${n} jefes`, g: [2, 4], z: [300, 500] },
  { k: 'lvl', max: 1, txt: n => `Llega al nivel ${n} en una partida`, g: [15, 25], z: [250, 450] },
  { k: 'evos', txt: () => 'Evoluciona una técnica', g: [1], z: [400] },
  { k: 'trans', txt: n => `Transfórmate ${n} veces`, g: [2, 4], z: [250, 400], need: () => CHARS.some(c => c.forms.length && isUnlocked(c)) },
  { k: 'wins', txt: () => 'Completa una saga', g: [1], z: [600] },
  { k: 'boxes', txt: n => `Abre ${n} cajas`, g: [2, 3], z: [200, 300] },
  { k: 'events', txt: n => n > 1 ? `Supera ${n} eventos de partida` : 'Supera un evento de partida', g: [1, 2], z: [300, 500] },
  { k: 'fusions', txt: () => 'Fusiónate con tu compañero', g: [1], z: [450], need: () => FUSIONS.some(f => isUnlocked(CHAR[f.a]) && isUnlocked(CHAR[f.b])) },
  { k: 'zeniRun', txt: n => `Consigue ${fmtNum(n)} zenis en partidas`, g: [400, 900], z: [250, 450] },
  { k: 'shrines', txt: n => `Activa ${n} altares de ki`, g: [2, 4], z: [300, 500] },
  { k: 'chests', txt: n => `Abre ${n} cofres del mapa`, g: [2, 4], z: [300, 500] },
  { k: 'crates', txt: n => `Rompe ${n} cajas o jarrones`, g: [15, 30], z: [200, 350] },
  { k: 'buddySp', txt: n => `Tu compañero usa ${n} técnicas especiales`, g: [3, 6], z: [250, 400], need: () => CHARS.filter(isUnlocked).length >= 2 },
];
const MISSION_BONUS = { t: 'g', txt: 'Cápsula Dorada' };
function missionsToday() {
  const d = dayKey(), m = save.missions;
  if (m.day === d && m.list.length) return m;
  const r = seeded(d + '|' + save.pid), pool = MISSIONS.filter(x => !x.need || x.need()), list = [];
  while (list.length < 3 && pool.length) {
    const i = Math.floor(r() * pool.length), t = pool.splice(i, 1)[0], gi = Math.floor(r() * t.g.length);
    list.push({ k: t.k, g: t.g[gi], z: t.z[gi], p: 0, c: 0 });
  }
  save.missions = { day: d, list, bonus: 0 };
  return save.missions;
}
function missionText(m) { const t = MISSIONS.find(x => x.k === m.k); return t ? t.txt(m.g) : m.k; }
// Suma progreso a misiones (al terminar partida o al abrir cajas)
function trackMis(k, v) {
  if (!v) return;
  const t = MISSIONS.find(x => x.k === k);
  for (const m of missionsToday().list) if (m.k === k) m.p = t && t.max ? Math.max(m.p, v) : m.p + v;
}
function claimable() {
  const ms = missionsToday(), a = ACHIEVEMENTS.filter(x => !save.ach[x.id] && x.v() >= x.g).length;
  return ms.list.filter(m => !m.c && m.p >= m.g).length + a + (ms.list.every(m => m.c) && !ms.bonus ? 1 : 0);
}
function giveReward(rw) {
  const out = [];
  if (rw.z) { save.zeni += rw.z; out.push(fmtNum(rw.z) + ' zenis'); }
  for (const k of ['t', 't2']) if (rw[k]) { save.tickets[rw[k]] = (save.tickets[rw[k]] || 0) + 1; out.push(BOX[rw[k]].name); }
  if (rw.title) { save.titles[rw.title] = 1; out.push('título «' + TITLES[rw.title] + '»'); }
  return out.join(' + ');
}
function claimMission(i) {
  const m = missionsToday().list[i]; if (!m || m.c || m.p < m.g) return '';
  m.c = 1; save.stats.daily++; return giveReward({ z: m.z });
}
function claimMissionBonus() { const ms = missionsToday(); if (ms.bonus || !ms.list.every(m => m.c)) return ''; ms.bonus = 1; return giveReward({ t: MISSION_BONUS.t }); }
function claimAch(id) { const a = ACHIEVEMENTS.find(x => x.id === id); if (!a || save.ach[id] || a.v() < a.g) return ''; save.ach[id] = 1; return giveReward(a.rw); }
function addAccXp(v) {
  const ups = [];
  save.acc.xp += v;
  while (save.acc.xp >= accNeed(save.acc.lvl)) {
    save.acc.xp -= accNeed(save.acc.lvl); save.acc.lvl++;
    const rw = accReward(save.acc.lvl); if (LVL_TITLES[save.acc.lvl]) rw.title = LVL_TITLES[save.acc.lvl];
    ups.push({ lvl: save.acc.lvl, txt: giveReward(rw) });
  }
  return ups;
}
// Resumen de la partida que acaba: estadísticas, misiones, nivel de cuenta y récords
function recordRun(win, earned) {
  const S = save.stats, st = G.stat, minutes = Math.floor(G.t / 60);
  S.time += G.t; S.chars[G.cid] = (S.chars[G.cid] || 0) + 1;
  S.bosses += G.killedBosses.length; S.specials += st.specials; S.events += st.events; S.fusions += st.fusions;
  S.evos += st.evos; S.trans += st.trans; S.zeniRun += earned; S.shenron += st.shenron;
  if (win) S.wins++;
  S.bestKills = Math.max(S.bestKills || 0, G.kills);
  const before = missionsToday().list.map(m => m.p >= m.g);
  trackMis('kills', G.kills); trackMis('surv', minutes); trackMis('specials', st.specials); trackMis('bosses', G.killedBosses.length);
  trackMis('lvl', G.lvl); trackMis('evos', st.evos); trackMis('trans', st.trans); trackMis('wins', win ? 1 : 0); trackMis('events', st.events);
  trackMis('fusions', st.fusions); trackMis('zeniRun', earned); trackMis('buddySp', st.buddySp);
  trackMis('shrines', st.shrines); trackMis('chests', st.chests); trackMis('crates', st.crates);
  S.shrines += st.shrines; S.chests += st.chests; S.crates += st.crates; S.healed += Math.round(st.healed);
  const doneNow = missionsToday().list.filter((m, i) => !before[i] && m.p >= m.g).map(missionText);
  let rec = null;
  if (G.endless) {
    const sc = runScore();
    if (sc > (S.bestInf || 0)) { rec = sc; S.bestInf = sc; }
    S.bestInfT = Math.max(S.bestInfT || 0, G.t);
  }
  const xp = Math.round((G.t / 6 + G.kills / 40 + G.killedBosses.length * 15 + (win ? 60 : 0)) * G.diff.xp);
  const ups = addAccXp(xp);
  return { doneNow, xp, ups, rec };
}
</script>
