<script>
/* =================== CARTAS COLECCIONABLES ===================
   Cada guerrero que tienes = su carta. Cada transformación que consigues en partida = otra carta.
   Acabados: Normal, Holo, Oro y Arcoíris (se consiguen en sobres con zenis).
   Simulador: sobres gratis con todas las cartas; se guardan aparte y llevan la marca «SIMULADOR · NO OFICIAL». */
const CARD_SET = [];
CHARS.forEach(c => {
  CARD_SET.push({ id: c.id, base: c.id, spr: c.id, name: c.name, form: null });
  c.forms.forEach((f, i) => { if (f.spr !== c.id) CARD_SET.push({ id: f.spr, base: c.id, spr: f.spr, name: f.name, form: f, fi: i }); });
});
CARD_SET.forEach((k, i) => k.no = i + 1);
const CARD = Object.fromEntries(CARD_SET.map(k => [k.id, k]));
const FINISH = {
  n: { name: 'Normal', col: '#b8c0dc' },
  h: { name: 'Holo', col: '#9fd8ff' },
  g: { name: 'Oro', col: '#ffd23f' },
  r: { name: 'Arcoíris', col: '#ff8ac8' },
};
const FIN_ORDER = ['r', 'g', 'h', 'n'];
const CTYPES = {
  saiyan: { n: 'Saiyan', col: '#ff8a1c' }, earth: { n: 'Terrícola', col: '#ffd23f' }, namek: { n: 'Namekiano', col: '#59d66b' },
  android: { n: 'Androide', col: '#3aa0ff' }, majin: { n: 'Majin', col: '#ff8ac8' }, empire: { n: 'Imperio', col: '#b06bff' },
  god: { n: 'Divino', col: '#cfc6ff' }, uni: { n: 'Otro universo', col: '#e8433a' },
};
function cardType(c) {
  const id = c.id, s = (c.saga || '') + ' ' + c.name;
  if (['beerus', 'whis', 'zamasu', 'goku_black'].includes(id)) return 'god';
  if (SAIYANS.has(id)) return 'saiyan';
  if (['jiren', 'toppo', 'dyspo', 'hit'].includes(id)) return 'uni';
  if (id === 'piccolo') return 'namek';
  if (['a16', 'a17', 'a18', 'a19', 'gero', 'cell', 'celljr'].includes(id)) return 'android';
  if (['buu', 'superbuu', 'kidbuu', 'dabura', 'uub'].includes(id) || /Majin/.test(s)) return 'majin';
  if (['freezer', 'cooler', 'zarbon', 'dodoria', 'ginyu', 'recoome', 'jeice', 'burter', 'guldo'].includes(id)) return 'empire';
  return 'earth';
}
const RAR_UP = { C: 'R', R: 'E', E: 'L', L: 'L' };
function cardRar(k) { const c = CHAR[k.base]; return k.form ? RAR_UP[c.rar] : c.rar; }
function cardOwned(k) { const c = CHAR[k.base]; return !!c && isUnlocked(c) && (!k.form || !!save.seen[k.spr]); }
function cardHas(k, f, sim) { if (sim) return ((save.sim[k.id] || {})[f] || 0) > 0; return f === 'n' ? cardOwned(k) : cardOwned(k) && ((save.cards[k.id] || {})[f] || 0) > 0; }
function cardBest(k, sim) { return FIN_ORDER.find(f => cardHas(k, f, sim)) || null; }
function cardHint(k) {
  const c = CHAR[k.base];
  if (!isUnlocked(c)) return L(c.unlock ? c.unlock.txt : '');
  return L('Transfórmate en') + ' ' + L(k.name) + ' ' + L('jugando con') + ' ' + L(c.name) + ' (' + L('Nv') + ' ' + k.form.lv + ')';
}
function cardSerial(k, f) { let h = 2166136261; const s = save.pid + '|' + k.id + '|' + f; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36).toUpperCase().slice(-5).padStart(5, '0'); }
</script>
