import { HEROES, HERO_MAP, STARTERS } from './heroes.js';

// Player profile (localStorage). Arknights-inspired recruitment:
//  ★6 2% (+2% per pull after 50 without a ★6), ★5 8%, ★4 50%, 40% "잔불" (tokens)
//  First 10 recruits guarantee a ★5 or better. Duplicates raise potential and give tokens.
const KEY = 'ashen.profile.v1';
export const PULL_COST = 600;
export const TOKEN_PRICE = { 4: 35, 5: 100, 6: 240 };
export const PERMIT_TOKEN_PRICE = 18;
const DUP_TOKENS = { 4: 4, 5: 10, 6: 20 };
const MAXPOT = 6;

const fresh = () => ({
  crystals: 6000, permits: 10, tokens: 0, level: 1, xp: 0,
  owned: Object.fromEntries(STARTERS.map(id => [id, { pot: 1, at: Date.now() }])),
  pity6: 0, pulls: 0, history: [], lastDaily: '', matches: 0, wins: 0, kills: 0,
  assistant: 'valok', seen: {},
});

export class Profile {
  constructor() { this.d = fresh(); this.load(); }
  load() {
    try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) this.d = { ...fresh(), ...s, owned: { ...fresh().owned, ...(s.owned || {}) } }; } catch (e) { }
  }
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.d)); } catch (e) { } }
  owns(id) { return !!this.d.owned[id]; }
  pot(id) { return this.d.owned[id]?.pot || 0; }
  ownedList() { return HEROES.filter(h => this.owns(h.id)); }
  xpNeed(lv = this.d.level) { return 300 + lv * 60; }

  daily() {
    const today = new Date().toISOString().slice(0, 10);
    if (this.d.lastDaily === today) return null;
    this.d.lastDaily = today;
    this.d.crystals += 900; this.d.permits += 1;
    this.save();
    return { crystals: 900, permits: 1 };
  }

  // Featured banner rotates every day: one ★6 and two ★5.
  banner() {
    const day = Math.floor(Date.now() / 86400000);
    const six = HEROES.filter(h => h.rarity === 6), five = HEROES.filter(h => h.rarity === 5);
    return { six: six[day % six.length].id, five: [five[(day * 3) % five.length].id, five[(day * 3 + 7) % five.length].id] };
  }

  rate6() { return 0.02 + Math.max(0, this.d.pity6 - 49) * 0.02; }

  canPull(n) { return this.d.permits >= n || this.d.crystals >= PULL_COST * n || (this.d.permits + Math.floor(this.d.crystals / PULL_COST)) >= n; }

  pull(n) {
    if (!this.canPull(n)) return null;
    // pay: permits first, then crystals
    let left = n;
    const usePermits = Math.min(this.d.permits, left); this.d.permits -= usePermits; left -= usePermits;
    this.d.crystals -= left * PULL_COST;
    const B = this.banner();
    const out = [];
    for (let i = 0; i < n; i++) {
      this.d.pulls++;
      let r = Math.random();
      let rar;
      const p6 = this.rate6();
      if (r < p6) rar = 6; else if (r < p6 + 0.08) rar = 5; else if (r < p6 + 0.58) rar = 4; else rar = 3;
      // newbie guarantee: within the first 10 recruits at least one ★5+
      if (this.d.pulls === 10 && !this.d.history.some(h => h.r >= 5) && !out.some(o => o.rarity >= 5) && rar < 5) rar = 5;
      if (rar === 6) this.d.pity6 = 0; else this.d.pity6++;
      if (rar === 3) { this.d.tokens += 2; out.push({ id: null, rarity: 3, tokens: 2 }); continue; }
      let pool = HEROES.filter(h => h.rarity === rar);
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

  // Rewards after a match. mode: 'ai' | 'online'. diff 0..2
  reward({ win, kills = 0, mode = 'ai', diff = 1, rounds = 0 }) {
    const mul = mode === 'online' ? 1.2 : [0.7, 1, 1.4][diff] ?? 1;
    const crystals = Math.round(((win ? 520 : 220) + kills * 25 + rounds * 30) * mul / 10) * 10;
    const xp = Math.round((win ? 140 : 70) + kills * 6);
    this.d.crystals += crystals; this.d.matches++; if (win) this.d.wins++; this.d.kills += kills;
    this.d.xp += xp;
    const ups = [];
    while (this.d.xp >= this.xpNeed()) { this.d.xp -= this.xpNeed(); this.d.level++; this.d.crystals += 600; this.d.permits += 1; ups.push(this.d.level); }
    this.save();
    return { crystals, xp, ups };
  }
}
