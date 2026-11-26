import { HEROES, HERO_MAP, STARTERS } from './heroes.js';
import { ELEMENTS } from './elements.js';

// Player profile, saved in this browser only (never shared with other players).
// Arknights-inspired recruitment: ★6 1% (+2% per pull after 70 without a ★6),
// ★5 5%, ★4 45%, 49% "잔불" (tokens). Duplicates raise potential and give tokens.
//
// Save safety: updates never wipe or shrink a save. Old saves are only ever
// extended with new fields. Every save also goes to a backup slot and to
// IndexedDB, and players can export/import a save code.
const KEY = 'ashen.profile.v1';
const BAK = KEY + '.bak';
const VER = 3;
export const PULL_COST = 600;
export const TOKEN_PRICE = { 4: 60, 5: 180, 6: 450 };
export const PERMIT_TOKEN_PRICE = 40;
export const RATES = { 6: 0.01, 5: 0.05, 4: 0.45 };
export const PITY_START = 70;
const DUP_TOKENS = { 4: 4, 5: 10, 6: 20 };
const MAXPOT = 6;

// ---------------- quests ----------------
// counters: match, win, kill, skill, ult, online, horde (best wave), heal, dmg
export const DAILY_POOL = [
  { id: 'd_match2', name: '전장에 서다', desc: '경기 2판 하기', stat: 'match', goal: 2, reward: { crystals: 80 } },
  { id: 'd_win1', name: '첫 승전보', desc: '경기 1번 이기기', stat: 'win', goal: 1, reward: { crystals: 100 } },
  { id: 'd_kill10', name: '사냥꾼의 하루', desc: '적 10명 처치', stat: 'kill', goal: 10, reward: { crystals: 100 } },
  { id: 'd_skill40', name: '기술 연마', desc: '스킬 40번 쓰기 (좌클릭 제외)', stat: 'skill', goal: 40, reward: { crystals: 80 } },
  { id: 'd_ult3', name: '결정타', desc: '궁극기 3번 쓰기', stat: 'ult', goal: 3, reward: { crystals: 80 } },
  { id: 'd_horde3', name: '심연 정찰', desc: '심연 토벌에서 3웨이브 돌파', stat: 'hordeWave', goal: 3, reward: { crystals: 100 } },
  { id: 'd_heal1500', name: '구원의 손길', desc: '아군을 1500 치유', stat: 'heal', goal: 1500, reward: { crystals: 80 } },
  { id: 'd_dmg6000', name: '파괴의 의지', desc: '피해 6000 주기', stat: 'dmg', goal: 6000, reward: { crystals: 80 } },
];
export const WEEKLY_POOL = [
  { id: 'w_win6', name: '연승의 깃발', desc: '경기 6번 이기기', stat: 'win', goal: 6, reward: { crystals: 300 } },
  { id: 'w_match15', name: '불굴의 전사', desc: '경기 15판 하기', stat: 'match', goal: 15, reward: { crystals: 300 } },
  { id: 'w_kill60', name: '전장의 지배자', desc: '적 60명 처치', stat: 'kill', goal: 60, reward: { crystals: 250 } },
  { id: 'w_ult20', name: '궁극의 일격', desc: '궁극기 20번 쓰기', stat: 'ult', goal: 20, reward: { crystals: 200 } },
  { id: 'w_horde8', name: '심연 정복', desc: '심연 토벌에서 8웨이브 돌파', stat: 'hordeWave', goal: 8, reward: { permits: 1 } },
];
export const ACHIEVEMENTS = [
  { id: 'a_firstwin', name: '첫 승리', desc: '처음으로 경기에서 이기기', stat: 'win', goal: 1, reward: { crystals: 300 } },
  { id: 'a_win25', name: '역전의 용사', desc: '경기 25번 이기기', stat: 'win', goal: 25, reward: { permits: 2 } },
  { id: 'a_kill100', name: '백인참', desc: '적 100명 처치', stat: 'kill', goal: 100, reward: { crystals: 500 } },
  { id: 'a_kill500', name: '전장의 망령', desc: '적 500명 처치', stat: 'kill', goal: 500, reward: { permits: 3 } },
  { id: 'a_hero10', name: '모여드는 영웅들', desc: '영웅 10명 보유', stat: 'owned', goal: 10, reward: { crystals: 400 } },
  { id: 'a_hero25', name: '성역의 군단', desc: '영웅 25명 보유', stat: 'owned', goal: 25, reward: { permits: 2 } },
  { id: 'a_hero60', name: '모든 이름을 부르다', desc: '영웅 60명 모두 보유', stat: 'owned', goal: 60, reward: { permits: 10 } },
  { id: 'a_six', name: '별의 계시', desc: '★6 영웅 얻기', stat: 'six', goal: 1, reward: { crystals: 500 } },
  { id: 'a_allel', name: '여섯 원소', desc: '모든 속성의 영웅을 하나씩 보유', stat: 'elements', goal: 6, reward: { permits: 1 } },
  { id: 'a_lv10', name: '숙련된 지휘관', desc: '레벨 10 달성', stat: 'level', goal: 10, reward: { permits: 2 } },
  { id: 'a_online', name: '함께 싸우는 법', desc: '온라인 경기 1판 하기', stat: 'online', goal: 1, reward: { crystals: 300 } },
  { id: 'a_horde10', name: '심연을 들여다본 자', desc: '심연 토벌에서 10웨이브 돌파', stat: 'hordeBest', goal: 10, reward: { permits: 2 } },
  { id: 'a_horde20', name: '심연의 끝', desc: '심연 토벌에서 20웨이브 돌파', stat: 'hordeBest', goal: 20, reward: { permits: 5 } },
  { id: 'a_pull50', name: '끝없는 모집', desc: '모집 50회', stat: 'pulls', goal: 50, reward: { crystals: 600 } },
];
const QUEST_MAP = Object.fromEntries([...DAILY_POOL, ...WEEKLY_POOL, ...ACHIEVEMENTS].map(q => [q.id, q]));

const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const weekKey = () => { const d = new Date(); const day = (d.getDay() + 6) % 7; const m = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day); return `${m.getFullYear()}-${m.getMonth() + 1}-${m.getDate()}`; };
const seedPick = (arr, n, seed) => { const a = [...arr]; let x = 0; for (const ch of seed) x = (x * 31 + ch.charCodeAt(0)) >>> 0; for (let i = a.length - 1; i > 0; i--) { x = (x * 1103515245 + 12345) >>> 0; const j = x % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };

const fresh = () => ({
  ver: VER, crystals: 1200, permits: 1, tokens: 0, level: 1, xp: 0,
  owned: Object.fromEntries(STARTERS.map(id => [id, { pot: 1, at: Date.now() }])),
  pity6: 0, pulls: 0, history: [], lastDaily: '', matches: 0, wins: 0, kills: 0,
  assistant: 'valok', seen: {},
  // v3
  q: { day: '', week: '', daily: {}, weekly: {}, dailyIds: [], weeklyIds: [], ach: {}, claimed: {}, dailyBonus: false, weeklyBonus: false },
  totals: { ult: 0, skill: 0, heal: 0, dmg: 0, online: 0, six: 0 },
  hordeBest: 0, lastPatch: '', created: Date.now(), saves: 0,
});

// deep-merge saved data over defaults without ever dropping saved values
function merge(def, saved) {
  if (saved === null || saved === undefined) return def;
  if (typeof def !== 'object' || def === null || Array.isArray(def)) return saved;
  const out = { ...def };
  for (const k in saved) out[k] = (k in def) ? merge(def[k], saved[k]) : saved[k];
  return out;
}
function valid(s) { return s && typeof s === 'object' && typeof s.crystals === 'number' && s.owned && typeof s.owned === 'object'; }

// ---- IndexedDB mirror (survives localStorage being cleared on its own) ----
const IDB = {
  open() { return new Promise((res, rej) => { try { const r = indexedDB.open('ashen-sanctum', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } }); },
  async get(k) { const db = await this.open(); return new Promise((res) => { const t = db.transaction('kv').objectStore('kv').get(k); t.onsuccess = () => res(t.result); t.onerror = () => res(null); }); },
  async set(k, v) { const db = await this.open(); return new Promise((res) => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = () => res(true); t.onerror = () => res(false); }); },
};

export class Profile {
  constructor() { this.d = fresh(); this.loaded = false; this.load(); }
  load() {
    for (const k of [KEY, BAK]) {
      try {
        const s = JSON.parse(localStorage.getItem(k) || 'null');
        if (valid(s)) { this.d = merge(fresh(), s); this.d.ver = VER; this.loaded = true; break; }
      } catch (e) { }
    }
    this.refreshQuests();
  }
  // called once at boot: if localStorage was wiped but IndexedDB still has the save, bring it back
  async recover() {
    try { navigator.storage?.persist?.(); } catch (e) { }
    try {
      const s = await IDB.get(KEY);
      if (valid(s) && (!this.loaded || (s.saves || 0) > (this.d.saves || 0))) { this.d = merge(fresh(), s); this.d.ver = VER; this.loaded = true; this.refreshQuests(); this.save(); return true; }
    } catch (e) { }
    if (this.loaded) this.save();
    return false;
  }
  save() {
    this.d.saves = (this.d.saves || 0) + 1;
    const json = JSON.stringify(this.d);
    try { const prev = localStorage.getItem(KEY); if (prev) localStorage.setItem(BAK, prev); localStorage.setItem(KEY, json); } catch (e) { }
    try { IDB.set(KEY, JSON.parse(json)); } catch (e) { }
  }
  exportCode() {
    const json = JSON.stringify(this.d);
    let h = 0; for (let i = 0; i < json.length; i++) h = (h * 31 + json.charCodeAt(i)) >>> 0;
    return 'ASH3.' + btoa(unescape(encodeURIComponent(json))) + '.' + h.toString(36);
  }
  importCode(code) {
    const m = String(code || '').trim().match(/^ASH3\.([A-Za-z0-9+/=]+)\.([a-z0-9]+)$/);
    if (!m) return false;
    try {
      const json = decodeURIComponent(escape(atob(m[1])));
      let h = 0; for (let i = 0; i < json.length; i++) h = (h * 31 + json.charCodeAt(i)) >>> 0;
      if (h.toString(36) !== m[2]) return false;
      const s = JSON.parse(json); if (!valid(s)) return false;
      try { localStorage.setItem(BAK + '.import', JSON.stringify(this.d)); } catch (e) { }
      this.d = merge(fresh(), s); this.d.ver = VER; this.refreshQuests(); this.save();
      return true;
    } catch (e) { return false; }
  }

  owns(id) { return !!this.d.owned[id]; }
  pot(id) { return this.d.owned[id]?.pot || 0; }
  ownedList() { return HEROES.filter(h => this.owns(h.id)); }
  xpNeed(lv = this.d.level) { return 300 + lv * 60; }

  daily() {
    const t = new Date().toISOString().slice(0, 10);
    if (this.d.lastDaily === t) return null;
    this.d.lastDaily = t;
    this.d.crystals += 300;
    this.save();
    return { crystals: 300, permits: 0 };
  }

  // ---------------- quests ----------------
  refreshQuests() {
    const q = this.d.q;
    const d = today(), w = weekKey();
    if (q.day !== d) { q.day = d; q.daily = {}; q.dailyIds = seedPick(DAILY_POOL, 4, d).map(x => x.id); q.dailyBonus = false; for (const k in q.claimed) if (k.startsWith('d_')) delete q.claimed[k]; }
    if (q.week !== w) { q.week = w; q.weekly = {}; q.weeklyIds = seedPick(WEEKLY_POOL, 4, w).map(x => x.id); q.weeklyBonus = false; for (const k in q.claimed) if (k.startsWith('w_')) delete q.claimed[k]; }
  }
  statFor(qd, scope) {
    const q = this.d.q, d = this.d;
    if (scope === 'daily') return q.daily[qd.stat] || 0;
    if (scope === 'weekly') return q.weekly[qd.stat] || 0;
    switch (qd.stat) {
      case 'win': return d.wins; case 'kill': return d.kills; case 'level': return d.level; case 'pulls': return d.pulls;
      case 'owned': return Object.keys(d.owned).length;
      case 'six': return HEROES.filter(h => h.rarity === 6 && this.owns(h.id)).length;
      case 'elements': return new Set(this.ownedList().map(h => h.el)).size;
      case 'hordeBest': return d.hordeBest;
      default: return d.totals[qd.stat] || 0;
    }
  }
  questList() {
    this.refreshQuests();
    const q = this.d.q;
    const row = (qd, scope) => { const v = this.statFor(qd, scope); return { ...qd, scope, value: Math.min(v, qd.goal), done: v >= qd.goal, claimed: !!q.claimed[qd.id] }; };
    return {
      daily: q.dailyIds.map(id => row(QUEST_MAP[id], 'daily')),
      weekly: q.weeklyIds.map(id => row(QUEST_MAP[id], 'weekly')),
      ach: ACHIEVEMENTS.map(a => row(a, 'ach')),
      dailyBonus: q.dailyBonus, weeklyBonus: q.weeklyBonus,
    };
  }
  claimable() { const L = this.questList(); return [...L.daily, ...L.weekly, ...L.ach].filter(x => x.done && !x.claimed).length + (this.bonusReady('daily') ? 1 : 0) + (this.bonusReady('weekly') ? 1 : 0); }
  bonusReady(scope) { const L = this.questList(); const list = scope === 'daily' ? L.daily : L.weekly; return list.every(x => x.claimed) && !(scope === 'daily' ? L.dailyBonus : L.weeklyBonus); }
  give(r) { if (r.crystals) this.d.crystals += r.crystals; if (r.permits) this.d.permits += r.permits; if (r.tokens) this.d.tokens += r.tokens; }
  claim(id) {
    const L = this.questList();
    const it = [...L.daily, ...L.weekly, ...L.ach].find(x => x.id === id);
    if (!it || !it.done || it.claimed) return null;
    this.d.q.claimed[id] = true; this.give(it.reward); this.save();
    return it.reward;
  }
  claimBonus(scope) {
    if (!this.bonusReady(scope)) return null;
    const r = scope === 'daily' ? { crystals: 150 } : { permits: 1, tokens: 20 };
    if (scope === 'daily') this.d.q.dailyBonus = true; else this.d.q.weeklyBonus = true;
    this.give(r); this.save(); return r;
  }
  track(stat, n = 1) {
    this.refreshQuests();
    const q = this.d.q;
    if (stat === 'hordeWave') { q.daily.hordeWave = Math.max(q.daily.hordeWave || 0, n); q.weekly.hordeWave = Math.max(q.weekly.hordeWave || 0, n); this.d.hordeBest = Math.max(this.d.hordeBest, n); return; }
    q.daily[stat] = (q.daily[stat] || 0) + n; q.weekly[stat] = (q.weekly[stat] || 0) + n;
    if (stat in this.d.totals) this.d.totals[stat] += n;
  }

  // Featured banner rotates every day: one ★6 and two ★5.
  banner() {
    const day = Math.floor(Date.now() / 86400000);
    const six = HEROES.filter(h => h.rarity === 6), five = HEROES.filter(h => h.rarity === 5);
    return { six: six[day % six.length].id, five: [five[(day * 3) % five.length].id, five[(day * 3 + 7) % five.length].id] };
  }

  rate6() { return RATES[6] + Math.max(0, this.d.pity6 - (PITY_START - 1)) * 0.02; }

  canPull(n) { return (this.d.permits + Math.floor(this.d.crystals / PULL_COST)) >= n; }

  pull(n) {
    if (!this.canPull(n)) return null;
    let left = n;
    const usePermits = Math.min(this.d.permits, left); this.d.permits -= usePermits; left -= usePermits;
    this.d.crystals -= left * PULL_COST;
    const B = this.banner();
    const out = [];
    for (let i = 0; i < n; i++) {
      this.d.pulls++;
      const r = Math.random();
      let rar;
      const p6 = this.rate6();
      if (r < p6) rar = 6; else if (r < p6 + RATES[5]) rar = 5; else if (r < p6 + RATES[5] + RATES[4]) rar = 4; else rar = 3;
      if (rar === 6) this.d.pity6 = 0; else this.d.pity6++;
      if (rar === 3) { this.d.tokens += 1; out.push({ id: null, rarity: 3, tokens: 1 }); continue; }
      const pool = HEROES.filter(h => h.rarity === rar);
      let id;
      if (rar === 6 && Math.random() < 0.5) id = B.six;
      else if (rar === 5 && Math.random() < 0.5) id = B.five[(Math.random() * 2) | 0];
      else id = pool[(Math.random() * pool.length) | 0].id;
      const isNew = !this.owns(id);
      let tokens = 0;
      if (isNew) this.d.owned[id] = { pot: 1, at: Date.now() };
      else {
        const o = this.d.owned[id];
        tokens = DUP_TOKENS[rar] * (o.pot >= MAXPOT ? 2 : 1);
        o.pot = Math.min(MAXPOT, o.pot + 1);
        this.d.tokens += tokens;
      }
      out.push({ id, rarity: rar, isNew, tokens, pot: this.d.owned[id].pot });
      this.d.history.unshift({ id, r: rar, t: Date.now() });
    }
    this.d.history = this.d.history.slice(0, 100);
    this.save();
    return out;
  }

  buyHero(id) {
    const h = HERO_MAP[id]; if (!h || this.owns(id)) return false;
    const price = TOKEN_PRICE[h.rarity];
    if (this.d.tokens < price) return false;
    this.d.tokens -= price; this.d.owned[id] = { pot: 1, at: Date.now() }; this.save(); return true;
  }
  buyPermit() { if (this.d.tokens < PERMIT_TOKEN_PRICE) return false; this.d.tokens -= PERMIT_TOKEN_PRICE; this.d.permits += 1; this.save(); return true; }

  // Rewards after a match. mode: 'ai' | 'online' | 'horde'. diff 0..2
  reward({ win, kills = 0, mode = 'ai', diff = 1, rounds = 0, waves = 0, stats = {} }) {
    let crystals;
    if (mode === 'horde') crystals = Math.round((30 + waves * 22 + kills * 4) * ([0.7, 1, 1.4][diff] ?? 1) / 10) * 10;
    else { const mul = mode === 'online' ? 1.2 : [0.7, 1, 1.4][diff] ?? 1; crystals = Math.round(((win ? 150 : 50) + kills * 8 + rounds * 10) * mul / 10) * 10; }
    const xp = mode === 'horde' ? Math.round(60 + waves * 18 + kills * 4) : Math.round((win ? 140 : 70) + kills * 6);
    this.d.crystals += crystals; this.d.matches++; if (win) this.d.wins++; this.d.kills += kills;
    this.track('match'); if (win) this.track('win'); if (kills) this.track('kill', kills);
    if (stats.skill) this.track('skill', stats.skill); if (stats.ult) this.track('ult', stats.ult);
    if (stats.heal) this.track('heal', Math.round(stats.heal)); if (stats.dmg) this.track('dmg', Math.round(stats.dmg));
    if (mode === 'online') this.track('online');
    if (mode === 'horde') this.track('hordeWave', waves);
    this.d.xp += xp;
    const ups = [];
    while (this.d.xp >= this.xpNeed()) { this.d.xp -= this.xpNeed(); this.d.level++; this.d.crystals += 200; if (this.d.level % 5 === 0) this.d.permits += 1; ups.push(this.d.level); }
    this.save();
    return { crystals, xp, ups };
  }
}
export { ELEMENTS };
