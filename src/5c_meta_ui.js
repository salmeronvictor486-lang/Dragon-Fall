<script>
/* =================== PANTALLA DE MISIONES, LOGROS Y PERFIL =================== */
let misTab = 'daily', misTimer = null;
function toastIn(id, t) { const el = $('#' + id); if (!el) return; el.textContent = t; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); }
function progBar(p, g) { const f = clamp(p / g, 0, 1); return `<div class="bar"><i style="width:${f * 100}%"></i><b>${fmtNum(Math.min(p, g))}/${fmtNum(g)}</b></div>`; }
function renderMissions() {
  $('#zMis').innerHTML = `<i></i>${fmtNum(save.zeni)}`;
  const tabs = $('#misTabs'); tabs.innerHTML = '';
  const nAch = ACHIEVEMENTS.filter(a => !save.ach[a.id] && a.v() >= a.g).length;
  [['daily', 'DIARIAS'], ['ach', 'LOGROS' + (nAch ? ` (${nAch})` : '')], ['prof', 'PERFIL']].forEach(([k, n]) => {
    const b = document.createElement('button'); b.className = 'btn small' + (misTab === k ? ' on' : ''); b.textContent = n;
    b.onclick = () => { misTab = k; sfx('click'); renderMissions(); }; tabs.appendChild(b);
  });
  const body = $('#misBody'); body.innerHTML = '';
  if (misTab === 'daily') {
    const ms = missionsToday(), sec = document.createElement('div'); sec.className = 'panel shopsec';
    sec.innerHTML = `<div class="sechd"><b class="px gold">MISIONES DE HOY</b><span class="muted">Nuevas misiones en <b class="cd">${untilMidnight()}</b></span></div>`;
    ms.list.forEach((m, i) => {
      const done = m.p >= m.g, row = document.createElement('div'); row.className = 'misrow' + (m.c ? ' claimed' : done ? ' done' : '');
      row.innerHTML = `<div class="mt">${missionText(m)}<small>Premio: ${fmtNum(m.z)} zenis</small></div>
        ${m.c ? '<span class="rw">✓ RECOGIDO</span>' : `<button class="btn small ${done ? 'gold' : ''}" ${done ? '' : 'disabled'}>${done ? 'RECOGER' : 'EN CURSO'}</button>`}${progBar(m.p, m.g)}`;
      const b = row.querySelector('button'); if (b) b.onclick = () => { const t = claimMission(i); if (t) { persist(); sfx('ball'); toastIn('misToast', '¡Premio: ' + t + '!'); renderMissions(); } };
      sec.appendChild(row);
    });
    const all = ms.list.every(m => m.c), bon = document.createElement('div'); bon.className = 'misrow' + (ms.bonus ? ' claimed' : all ? ' done' : '');
    bon.innerHTML = `<div class="mt">★ Completa las 3 misiones<small>Premio extra: ${MISSION_BONUS.txt}</small></div>${ms.bonus ? '<span class="rw">✓ RECOGIDO</span>' : `<button class="btn small ${all ? 'gold' : ''}" ${all ? '' : 'disabled'}>${all ? 'RECOGER' : `${ms.list.filter(m => m.c).length}/3`}</button>`}`;
    const bb = bon.querySelector('button'); if (bb) bb.onclick = () => { const t = claimMissionBonus(); if (t) { persist(); sfx('win'); toastIn('misToast', '¡Premio: ' + t + '!'); renderMissions(); } };
    sec.appendChild(bon);
    sec.insertAdjacentHTML('beforeend', '<p class="muted" style="font-size:16px;margin:0">El progreso se suma al terminar cada partida. Las misiones cambian cada día y son distintas para cada jugador.</p>');
    body.appendChild(sec);
  } else if (misTab === 'ach') {
    const got = ACHIEVEMENTS.filter(a => save.ach[a.id]).length, sec = document.createElement('div'); sec.className = 'panel shopsec';
    sec.innerHTML = `<div class="sechd"><b class="px gold">LOGROS</b><span class="muted">${got}/${ACHIEVEMENTS.length} conseguidos</span></div><div class="achgrid"></div>`;
    const grid = sec.querySelector('.achgrid');
    ACHIEVEMENTS.slice().sort((a, b) => (save.ach[a.id] ? 1 : 0) - (save.ach[b.id] ? 1 : 0) || (b.v() >= b.g) - (a.v() >= a.g)).forEach(a => {
      const v = a.v(), done = v >= a.g, hid = a.secret && !done && !save.ach[a.id], row = document.createElement('div');
      row.className = 'misrow' + (save.ach[a.id] ? ' claimed' : done ? ' done' : '');
      const rw = [a.rw.z ? fmtNum(a.rw.z) + ' zenis' : '', a.rw.t ? BOX[a.rw.t].name : '', a.rw.title ? 'título «' + TITLES[a.rw.title] + '»' : ''].filter(Boolean).join(' + ');
      row.innerHTML = `<div class="mt"><b class="gold">${hid ? '???' : a.name}</b><small>${hid ? 'Logro secreto' : a.desc}</small><small style="color:#ffd23f">${rw}</small></div>
        ${save.ach[a.id] ? '<span class="rw">✓</span>' : `<button class="btn small ${done ? 'gold' : ''}" ${done ? '' : 'disabled'}>${done ? 'RECOGER' : '···'}</button>`}${hid ? '' : progBar(v, a.g)}`;
      const b = row.querySelector('button'); if (b) b.onclick = () => { const t = claimAch(a.id); if (t) { persist(); sfx('win'); toastIn('misToast', '¡Logro: ' + t + '!'); renderMissions(); } };
      grid.appendChild(row);
    });
    body.appendChild(sec);
  } else {
    const S = save.stats, fav = Object.entries(S.chars).sort((a, b) => b[1] - a[1])[0], favC = fav && CHAR[fav[0]] ? CHAR[fav[0]] : CHAR[save.lastChar] || CHAR.goku;
    const name = ACCT && ACCT.user ? ACCT.user.name : 'Invitado', need = accNeed(save.acc.lvl), nr = accReward(save.acc.lvl + 1);
    const sec = document.createElement('div'); sec.className = 'panel shopsec';
    sec.innerHTML = `<div class="prof"><canvas class="pedestal" width="72" height="84"></canvas><div>
      <div class="lv">${name}</div><div class="gold" style="font-size:18px">«${TITLES[save.title]}»</div>
      <div class="lv" style="font-size:11px;margin-top:8px">NIVEL DE CUENTA ${save.acc.lvl}</div>
      <div class="accbar"><i style="width:${save.acc.xp / need * 100}%"></i></div>
      <div class="muted" style="font-size:16px;margin-top:4px">${fmtNum(save.acc.xp)}/${fmtNum(need)} XP · Siguiente premio: ${fmtNum(nr.z)} zenis${nr.t ? ' + ' + BOX[nr.t].name : ''}${LVL_TITLES[save.acc.lvl + 1] ? ' + título' : ''}</div>
      <div class="muted" style="font-size:16px">Ganas XP de cuenta en cada partida: más tiempo, más bajas y más jefes = más XP.</div></div></div>
      <div class="sechd"><b class="px gold">TÍTULO</b><span class="muted">Se ve en tu perfil y en el ranking</span></div><div class="titles"></div>
      <div class="sechd"><b class="px gold">ESTADÍSTICAS</b></div><div class="statgrid"></div>`;
    paintPedestal(sec.querySelector('canvas'), favC, true);
    const tl = sec.querySelector('.titles');
    Object.keys(TITLES).filter(k => save.titles[k]).forEach(k => {
      const b = document.createElement('button'); b.className = 'btn small' + (save.title === k ? ' on' : ''); b.textContent = TITLES[k];
      b.onclick = () => { save.title = k; persist(); sfx('click'); renderMissions(); }; tl.appendChild(b);
    });
    const locked = Object.keys(TITLES).length - Object.keys(TITLES).filter(k => save.titles[k]).length;
    if (locked) tl.insertAdjacentHTML('beforeend', `<span class="muted" style="font-size:16px;align-self:center">+${locked} por desbloquear con logros y niveles de cuenta</span>`);
    const h = Math.floor(S.time / 3600), mi = Math.floor(S.time / 60) % 60;
    [['Partidas', fmtNum(save.runs)], ['Victorias', fmtNum(S.wins)], ['Tiempo jugado', `${h} h ${mi} min`], ['Enemigos derrotados', fmtNum(save.kills)],
     ['Jefes derrotados', fmtNum(S.bosses)], ['Técnicas especiales', fmtNum(S.specials)], ['Fusiones', fmtNum(S.fusions)], ['Eventos superados', fmtNum(S.events)],
     ['Cajas abiertas', fmtNum(S.boxes)], ['Altares activados', fmtNum(S.shrines)], ['Cofres del mapa', fmtNum(S.chests)], ['Vida recuperada', fmtNum(S.healed)], ['Shenron invocado', fmtNum(S.shenron)], ['Récord de bajas', fmtNum(S.bestKills)], ['Récord Supervivencia', fmtNum(S.bestInf) + ' pts'],
     ['Guerreros', `${CHARS.filter(isUnlocked).length}/${CHARS.length}`], ['Logros', `${ACHIEVEMENTS.filter(a => save.ach[a.id]).length}/${ACHIEVEMENTS.length}`], ['Misiones completadas', fmtNum(S.daily)], ['Favorito', fav ? `${favC.name} (${fav[1]})` : '—']]
      .forEach(([k, v]) => sec.querySelector('.statgrid').insertAdjacentHTML('beforeend', `<div>${k}<b>${v}</b></div>`));
    body.appendChild(sec);
  }
  clearInterval(misTimer);
  misTimer = setInterval(() => { if (state !== 'missions') { clearInterval(misTimer); return; } document.querySelectorAll('#misBody .cd').forEach(e => e.textContent = untilMidnight()); if (save.missions.day !== dayKey()) renderMissions(); }, 1000);
}

/* =================== RANKING SEMANAL =================== */
const RANK_BOARDS = [
  { id: 'inf', name: '∞ SUPERVIVENCIA', unit: 'pts', desc: 'Puntuación en el modo Supervivencia' },
  { id: 'kill', name: 'BAJAS', unit: 'bajas', desc: 'Más enemigos derrotados en una sola partida (cualquier modo)' },
];
let rankTab = 'inf', rankReq = 0;
function isoWeek(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const w = Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
  return t.getUTCFullYear() + 'w' + String(w).padStart(2, '0');
}
function untilMonday() { const n = new Date(), m = new Date(n); m.setHours(24, 0, 0, 0); while (m.getDay() !== 1) m.setDate(m.getDate() + 1); const s = Math.floor((m - n) / 1000), d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24; return d ? `${d} d ${h} h` : `${h} h ${Math.floor(s / 60) % 60} min`; }
const rankCol = (b, w = isoWeek()) => `rank_${b}_${w}`;
const canRank = () => !!(ACCT && ACCT.backend && ACCT.backend.rankTop);
async function rankSubmit(board, score, t, cid) {
  if (!canRank() || !ACCT.user || !(score > 0)) return 'guest';
  const col = rankCol(board);
  if ((save.rankSent[col] || 0) >= score) return 'same';
  try {
    await ACCT.backend.rankPut(col, ACCT.user.uid, { name: String(ACCT.user.name).slice(0, 24), title: TITLES[save.title] || '', cid, score: Math.round(score), t: Math.round(t), ts: Date.now() });
    const wk = isoWeek(); for (const k in save.rankSent) if (!k.endsWith(wk)) delete save.rankSent[k];
    save.rankSent[col] = score; persist(); return 'ok';
  } catch (e) { console.warn('Ranking no disponible', e); return 'err'; }
}
function renderRank() {
  $('#rankWeek').textContent = 'Termina en ' + untilMonday();
  const tabs = $('#rankTabs'); tabs.innerHTML = '';
  RANK_BOARDS.forEach(b => { const el = document.createElement('button'); el.className = 'btn small' + (rankTab === b.id ? ' on' : ''); el.textContent = b.name; el.onclick = () => { rankTab = b.id; sfx('click'); renderRank(); }; tabs.appendChild(el); });
  const B = RANK_BOARDS.find(b => b.id === rankTab), body = $('#rankBody');
  const head = `<div class="sechd"><b class="px gold">${B.name}</b><span class="muted">${B.desc}. Se reinicia cada lunes.</span></div>`;
  const who = ACCT && ACCT.user ? '' : `<p class="muted" style="font-size:17px;margin:0">Para aparecer en el ranking, <a href="#" id="rkLogin" style="color:var(--gold)">inicia sesión o crea una cuenta</a> con tu correo.</p>`;
  if (!canRank()) { body.innerHTML = head + '<p class="muted">El ranking necesita conexión a internet. Vuelve a intentarlo más tarde.</p>'; return; }
  body.innerHTML = head + who + '<p class="muted">Cargando…</p>';
  const lk = $('#rkLogin'); if (lk) lk.onclick = e => { e.preventDefault(); go('account'); };
  const req = ++rankReq;
  ACCT.backend.rankTop(rankCol(rankTab)).then(list => {
    if (req !== rankReq || state !== 'rank') return;
    const me = ACCT.user && ACCT.user.uid;
    body.innerHTML = head + who + (list.length ? '' : '<p class="muted">Todavía no hay nadie esta semana. ¡Sé el primero!</p>');
    list.forEach((r, i) => {
      const row = document.createElement('div'); row.className = 'rkrow' + (r.uid === me ? ' me' : '');
      row.innerHTML = `<span class="pos">${i + 1}</span><span class="pc"></span><span class="nm">${escHtml(r.name || '???')}<small>${escHtml(r.title || '')}${CHAR[r.cid] ? ' · ' + CHAR[r.cid].name : ''}</small></span><span class="sc">${fmtNum(r.score)}<small>${B.unit} · ${fmtTime(r.t || 0)}</small></span>`;
      if (CHAR[r.cid]) row.querySelector('.pc').appendChild(portraitCanvas(r.cid));
      body.appendChild(row);
    });
    const mine = save.rankSent[rankCol(rankTab)];
    if (ACCT.user) body.insertAdjacentHTML('beforeend', `<p class="muted" style="font-size:16px;margin:0">${mine ? `Tu mejor marca esta semana: <b class="gold">${fmtNum(mine)}</b> ${B.unit}.` : 'Juega una partida para entrar en el ranking de esta semana.'}</p>`);
  }).catch(e => {
    if (req !== rankReq) return;
    console.warn('Ranking', e);
    body.innerHTML = head + '<p class="muted">El ranking no está disponible ahora mismo. Vuelve a intentarlo más tarde.</p>';
  });
}
function escHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

/* =================== COMPAÑERO (selección de personaje) =================== */
function buddyBox(cid) {
  const b = save.buddy && save.buddy !== cid && CHAR[save.buddy] && isUnlocked(CHAR[save.buddy]) ? CHAR[save.buddy] : null, f = b && fusionOf(cid, b.id);
  return `<button class="buddy" id="buddyBtn" type="button"><canvas width="18" height="19"></canvas><span class="bt"><b>COMPAÑERO</b>${b ? b.name + (f ? ` <span class="fz">· ¡Fusión: ${CHAR[f.into].name}!</span>` : '') : 'Ninguno · toca para elegir'}</span></button>`;
}
function wireBuddy(cid) {
  const el = $('#buddyBtn'); if (!el) return;
  const b = save.buddy && save.buddy !== cid && CHAR[save.buddy] && isUnlocked(CHAR[save.buddy]) ? save.buddy : null;
  const cv = el.querySelector('canvas'); if (b) cv.getContext('2d').drawImage(getPortrait(b), 0, 0);
  el.onclick = () => openBuddyPicker(cid);
}
function openBuddyPicker(cid) {
  sfx('click');
  const ov = document.createElement('div'); ov.className = 'bpick'; ov.id = 'buddyPick';
  const own = CHARS.filter(c => isUnlocked(c) && c.id !== cid);
  const pair = FUSIONS.find(f => f.a === cid || f.b === cid);
  ov.innerHTML = `<div class="panel"><div class="sechd"><b class="px gold">ELIGE COMPAÑERO</b><button class="btn small" id="bpX">X</button></div>
    <p class="muted" style="margin:0;font-size:17px">Tu compañero te sigue, dispara solo y usa su técnica especial cuando hay muchos enemigos. Algunas parejas se pueden <b class="gold">fusionar</b> durante ${FUSION_TIME} s al llenar el medidor: Goku + Vegeta, Goten + Trunks y Kale + Caulifla.</p>
    ${pair ? `<p class="gold" style="margin:0;font-size:17px">Con ${CHAR[cid].name}, elige a ${CHAR[pair.a === cid ? pair.b : pair.a].name} para fusionaros en ${CHAR[pair.into].name}${isUnlocked(CHAR[pair.a === cid ? pair.b : pair.a]) ? '.' : ' (aún no lo tienes).'}</p>` : ''}
    <div class="bpgrid"></div></div>`;
  const g = ov.querySelector('.bpgrid');
  const none = document.createElement('button'); none.className = save.buddy ? '' : 'on'; none.innerHTML = '<div style="height:68px;display:grid;place-items:center;font-size:30px">∅</div>Ninguno';
  none.onclick = () => { save.buddy = ''; persist(); ov.remove(); renderSelect(); }; g.appendChild(none);
  own.forEach(c => {
    const f = fusionOf(cid, c.id), b = document.createElement('button'); b.className = (save.buddy === c.id ? 'on' : '') + (f ? ' fus' : '');
    const cv = document.createElement('canvas'); cv.width = 36; cv.height = 56; paintSprite(cv, c.id); b.appendChild(cv);
    b.insertAdjacentHTML('beforeend', `<span>${c.name}</span>${f ? `<span class="fz">¡Fusión: ${CHAR[f.into].name}!</span>` : ''}`);
    b.onclick = () => { save.buddy = c.id; persist(); sfx('ball'); ov.remove(); renderSelect(); };
    g.appendChild(b);
  });
  ov.onclick = e => { if (e.target === ov) ov.remove(); };
  ov.querySelector('#bpX').onclick = () => ov.remove();
  document.body.appendChild(ov);
}

/* =================== HUD: fusión, eventos y Supervivencia =================== */
let fuBtn = null;
function drawFusionBtn(small) {
  fuBtn = null;
  if (!G.fusionPair || !spBtn) return;
  const f = G.fusionPair, r = small ? 24 : 28, x = spBtn.x - (spBtn.r - 8) - r - 18, y = spBtn.y + 4, ready = fusionReady(), on = !!P.fused;
  const fr = on ? P.fused.t / FUSION_TIME : clamp(G.fuse / G.fuseNeed, 0, 1);
  fuBtn = { x, y, r: r + 6 };
  if (ready) { ctx.globalAlpha = .35 + .25 * Math.sin(performance.now() / 150); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(x, y, r + 7, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
  ctx.fillStyle = '#0d0716'; ctx.beginPath(); ctx.arc(x, y, r + 3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a1a50'; ctx.beginPath(); ctx.arc(x, y, r - 2, 0, TAU); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r - 4, 0, TAU); ctx.clip();
  const s = Math.max(1, Math.floor((r * 2 - 8) / 19)); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(getPortrait(f.into), Math.round(x - 9 * s), Math.round(y - 9.5 * s + 2), 18 * s, 19 * s);
  if (!ready && !on) { ctx.fillStyle = 'rgba(13,7,22,.6)'; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
  ctx.restore();
  ctx.strokeStyle = '#2a3572'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = ready || on ? '#ffd23f' : '#b06bff'; ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + fr * TAU); ctx.stroke();
  txt(on ? Math.ceil(P.fused.t) + ' s' : ready ? '¡FUSIÓN!' : 'FUSIÓN', x, y - r - 12, small ? 6 : 7, ready || on ? '#ffd23f' : '#8a90b8', 'center');
  if (FINE_PTR && !on) keycap('2', x - r * .78, y - r * .78);
}
function drawRunInfo(small, y) {
  // dificultad / Supervivencia y evento activo, centrados bajo el tiempo (o la barra del jefe)
  let yy = y;
  if (G.endless) { txt('∞ ' + fmtNum(runScore()) + ' PTS', SWd / 2, yy + 8, small ? 7 : 9, '#9fd8ff', 'center'); yy += 18; }
  else if (G.diff.id) { txt(G.diff.name.toUpperCase(), SWd / 2, yy + 8, small ? 6 : 7, G.diff.col, 'center'); yy += 16; }
  if (G.curse) { txt('MALDICIÓN x' + G.curse, SWd / 2, yy + 8, small ? 6 : 7, '#c89bff', 'center'); yy += 16; }
  const ev = G.ev; if (!ev) return;
  const w = Math.min(320, SWd * .8), h = small ? 40 : 46, x = (SWd - w) / 2;
  draw9(ctx, 'panel', x, yy, w, h, small ? 1.5 : 2);
  txt(ev.name, SWd / 2, yy + h * .32, small ? 7 : 8, '#ffd23f', 'center');
  let det = '', fr = ev.t / ev.max;
  if (ev.k === 'horde') det = `Quedan ${ev.left ?? ev.total} · ${Math.ceil(ev.t)} s`;
  else if (ev.k === 'supply') { det = `Recogiendo ${Math.floor(ev.prog / ev.need * 100)}% · ${Math.ceil(ev.t)} s`; fr = ev.prog / ev.need; }
  else if (ev.k === 'tourney') det = `Luchador ${ev.n}/${ev.list.length} · ¡no salgas del ring! · ${Math.ceil(ev.t)} s`;
  else if (ev.k === 'moon') { det = `Gran Mono ${Math.max(0, Math.round(ev.mon.hp / ev.mon.maxHp * 100))}% · ${Math.ceil(ev.t)} s`; fr = ev.mon.hp / ev.mon.maxHp; }
  txt(det, SWd / 2, yy + h * .62, small ? 6 : 7, '#e6e9ff', 'center');
  ctx.fillStyle = '#0b0f24'; ctx.fillRect(x + 10, yy + h - 9, w - 20, 4); ctx.fillStyle = ev.k === 'supply' ? '#59d66b' : '#ff8a1c'; ctx.fillRect(x + 10, yy + h - 9, (w - 20) * clamp(fr, 0, 1), 4);
}
function drawEventWorld(t) {
  const ev = G.ev; if (!ev) return;
  if (ev.k === 'supply') {
    const x = Math.round(ev.x - camX), y = Math.round(ev.y - camY);
    lx.globalAlpha = .18 + Math.sin(t * 5) * .05; circ(ev.x, ev.y, ev.R, '#59d66b'); lx.globalAlpha = .9;
    lx.strokeStyle = '#a8f0b0'; lx.lineWidth = 1; lx.beginPath(); lx.arc(x, y, ev.R, 0, TAU); lx.stroke();
    lx.strokeStyle = '#ffd23f'; lx.lineWidth = 2; lx.beginPath(); lx.arc(x, y, ev.R + 3, -Math.PI / 2, -Math.PI / 2 + ev.prog / ev.need * TAU); lx.stroke(); lx.globalAlpha = 1;
    lx.drawImage(makeIcon('cap', '#ffd23f'), x - 6, y - 8 + Math.round(Math.sin(t * 4) * 2));
  } else if (ev.k === 'tourney') {
    const x = Math.round(ev.x - camX), y = Math.round(ev.y - camY);
    lx.globalAlpha = .1; circ(ev.x, ev.y, ev.R, '#e8d8b0'); lx.globalAlpha = .8;
    lx.strokeStyle = '#ffd23f'; lx.lineWidth = 2; lx.setLineDash([6, 4]); lx.beginPath(); lx.arc(x, y, ev.R, 0, TAU); lx.stroke(); lx.setLineDash([]); lx.globalAlpha = 1;
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4, px = Math.round(x + Math.cos(a) * ev.R), py = Math.round(y + Math.sin(a) * ev.R); lx.fillStyle = '#3a2a1a'; lx.fillRect(px, py - 12, 1, 12); lx.fillStyle = i % 2 ? '#e8433a' : '#ffd23f'; lx.fillRect(px + 1, py - 12, 5, 3); }
  }
}
function drawMoon() {
  if (!G.ev || G.ev.k !== 'moon') return;
  const a = Math.min(1, (G.ev.max - G.ev.t) / 1.5, G.ev.t / 1.5);
  ctx.globalAlpha = .28 * a; ctx.fillStyle = '#0a1240'; ctx.fillRect(0, 0, SWd, SHd);
  ctx.globalAlpha = a; const r = Math.min(SWd, SHd) * .07, x = SWd - r - 30, y = SHd * .32;
  const g = ctx.createRadialGradient(x, y, r * .2, x, y, r * 2.2); g.addColorStop(0, 'rgba(255,250,220,.5)'); g.addColorStop(1, 'rgba(255,250,220,0)'); ctx.fillStyle = g; ctx.fillRect(x - r * 2.5, y - r * 2.5, r * 5, r * 5);
  ctx.fillStyle = '#fff8dc'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8dfb8'; ctx.beginPath(); ctx.arc(x - r * .3, y - r * .2, r * .22, 0, TAU); ctx.arc(x + r * .35, y + r * .3, r * .15, 0, TAU); ctx.fill();
  ctx.globalAlpha = 1;
}

/* =================== MANDO (Gamepad API) =================== */
// En partida: stick/cruceta mueven, A = técnica especial, X/Y = fusión, Start = pausa.
// En menús: stick/cruceta mueven el foco, A pulsa, B vuelve atrás.
function padLayer() { return $('#boxInfo') || $('#buddyPick') || document.querySelector('.screen.on'); }
function padButtons() {
  const L = padLayer(); if (!L) return [];
  return [...L.querySelectorAll('button, a[href], input')].filter(b => !b.disabled && b.offsetParent !== null && !b.closest('[hidden]'));
}
function padMove(dir) {
  const bs = padButtons(); if (!bs.length) return;
  const cur = document.activeElement && bs.includes(document.activeElement) ? document.activeElement : null;
  if (!cur) return padFocus(bs[0]);
  const r0 = cur.getBoundingClientRect(), cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
  const v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
  let best = null, bs2 = 1e9;
  for (const b of bs) {
    if (b === cur) continue;
    const r = b.getBoundingClientRect(), dx = r.left + r.width / 2 - cx, dy = r.top + r.height / 2 - cy, along = dx * v[0] + dy * v[1];
    if (along <= 4) continue;
    const perp = Math.abs(dx * v[1] - dy * v[0]), sc = along + perp * 1.2;
    if (sc < bs2) { bs2 = sc; best = b; }
  }
  if (best) padFocus(best);
}
function padFocus(b) { document.querySelectorAll('.padfocus').forEach(e => e.classList.remove('padfocus')); b.classList.add('padfocus'); b.focus({ preventScroll: false }); b.scrollIntoView({ block: 'nearest' }); sfx('click'); }
function padBack() {
  const ov = $('#boxInfo') || $('#buddyPick'); if (ov) { ov.remove(); return; }
  if (state === 'paused') { resumeGame(); return; }
  const L = document.querySelector('.screen.on'), bk = L && L.querySelector('[data-back]'); if (bk) bk.click();
}
function pollPad(dt) {
  const gps = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  const gp = gps[0]; if (!gp) { pad.on = false; return; }
  pad.on = true;
  const bt = i => !!(gp.buttons[i] && gp.buttons[i].pressed), was = i => !!pad.prev[i], hit = i => bt(i) && !was(i);
  let x = gp.axes[0] || 0, y = gp.axes[1] || 0;
  if (bt(14)) x = -1; if (bt(15)) x = 1; if (bt(12)) y = -1; if (bt(13)) y = 1;
  const d = Math.hypot(x, y); if (d > 1) { x /= d; y /= d; }
  pad.x = x; pad.y = y;
  if (state === 'play') {
    if (G && G.intro && (hit(0) || hit(9))) G.intro.t = Math.min(G.intro.t, .15);
    else { if (hit(0)) useSpecial(); if (hit(2) || hit(3)) startFusion(); if (hit(9)) pauseGame(); }
  } else {
    const dir = Math.abs(x) > .5 || Math.abs(y) > .5 ? (Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up')) : '';
    if (dir && (dir !== pad.dir || (pad.rep -= dt) <= 0)) { padMove(dir); pad.rep = dir !== pad.dir ? .35 : .16; }
    pad.dir = dir;
    if (hit(0)) { const a = document.activeElement; if (a && padButtons().includes(a)) a.click(); else { const bs = padButtons(); if (bs[0]) padFocus(bs[0]); } }
    if (hit(1)) padBack();
    if (hit(9) && state === 'paused') resumeGame();
  }
  pad.prev = gp.buttons.map(b => b.pressed);
}
addEventListener('gamepadconnected', () => { if (state !== 'play') { const bs = padButtons(); if (bs[0]) padFocus(bs[0]); } });

/* =================== INSTALAR (PWA) =================== */
let installEvt = null;
const isStandalone = () => matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function syncInstall() { const b = $('#bInstall'); if (b) b.hidden = !installEvt || isStandalone(); if (state === 'opts') renderOpts(); }
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; syncInstall(); });
addEventListener('appinstalled', () => { installEvt = null; syncInstall(); });
async function doInstall() { if (!installEvt) return; installEvt.prompt(); try { await installEvt.userChoice; } catch (e) { } installEvt = null; syncInstall(); }
$('#bInstall').onclick = doInstall;
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW', e)));
// Filas extra de Opciones: instalar y (más abajo) idioma
function optsExtra(box) {
  if (typeof langRow === 'function') box.appendChild(langRow());
  if (isStandalone()) return;
  const row = document.createElement('div'); row.className = 'opt';
  if (installEvt) { row.innerHTML = '<span>Instalar el juego en este dispositivo</span><button class="btn toggle on">📲 INSTALAR</button>'; row.querySelector('button').onclick = doInstall; }
  else row.innerHTML = `<span style="font-size:17px">📲 Instálalo como app: ${isIOS ? 'en iPhone/iPad, pulsa <b>Compartir</b> y luego <b>Añadir a pantalla de inicio</b>.' : 'en el menú del navegador, elige <b>Instalar app</b> o <b>Añadir a pantalla de inicio</b>.'} Funciona sin conexión.</span>`;
  box.appendChild(row);
}

/* =================== FIN DE PARTIDA: extras =================== */
function overExtras(res, rankable) {
  const out = [];
  if (res.rec) out.push(`<div class="unlock">🏆 ¡Nuevo récord personal en Supervivencia: <b>${fmtNum(res.rec)}</b> puntos!</div>`);
  out.push(`<div class="unlock">⭐ +${fmtNum(res.xp)} XP de cuenta · Nivel ${save.acc.lvl} <div class="accbar"><i style="width:${save.acc.xp / accNeed(save.acc.lvl) * 100}%"></i></div></div>`);
  res.ups.forEach(u => out.push(`<div class="unlock">⬆️ ¡Nivel de cuenta <b>${u.lvl}</b>! Premio: <b>${u.txt}</b></div>`));
  res.doneNow.forEach(t => out.push(`<div class="unlock">✅ Misión completada: <b>${t}</b> (recoge el premio en MISIONES)</div>`));
  if (rankable) out.push(`<div class="unlock" id="overRank">📊 Ranking semanal: ${ACCT && ACCT.user ? 'enviando…' : 'inicia sesión con tu correo para aparecer.'}</div>`);
  return `<div class="ovx">${out.join('')}</div>`;
}
</script>
