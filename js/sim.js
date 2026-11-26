import { HERO_MAP, ULT_COST, HEROES, effLmb } from './heroes.js';
import { PASSIVES } from './passives.js';
import { SPAWNS, SPAWN_YAW, MAP, setMap, hazardAt } from './map.js';
import {
  moveCharacter, applyMoveAbility, MOVE_KINDS, raycast, losClear, rayPlayer, groundUnder,
  dirFromAngles, fwdFromYaw, EYE, P_HEIGHT, GRAVITY, clamp,
} from './physics.js';
import { BotBrain } from './ai.js';

export const ROUNDS_TO_WIN = 3;
const PRE_T = 4, LIVE_T = 120, POST_T = 4.5;

export function statusMods(st, glide, frozen) {
  let speed = 1;
  if (st.haste) speed += st.haste.v;
  if (st.resoSpd) speed += st.resoSpd.v;
  if (st.slow) speed -= st.slow.v;
  speed = Math.max(0.3, speed);
  return { speed, stunned: !!(st.stun || st.sleep), rooted: !!(st.root || st.channelRoot), glide: !!glide, frozen: !!frozen };
}

let nextEnt = 1;
const LOOK_COLORS = { drain: '#ff2a4a', holy: '#ffe08a', flame: '#ff7a2a', frost: '#8fd8ff', void: '#9a5cff', lightning: '#9fb0ff', vine: '#8acd32' };

export class Sim {
  constructor({ mode = 'match', difficulty = 1, mapId = 'sanctum' } = {}) {
    this.mapId = mapId; setMap(mapId);
    this.mode = mode; // 'match' | 'training'
    this.difficulty = difficulty;
    this.players = new Map();
    this.projs = [];
    this.zones = [];
    this.events = [];
    this.now = 0;
    this.phase = mode === 'training' ? 'train' : 'lobby';
    this.phaseT = 0;
    this.round = 0;
    this.score = [0, 0];
    this.winner = -1;
    this.brains = new Map();
  }

  // ---------- players ----------
  addPlayer({ id, name, team, hero, isBot = false, isDummy = false }) {
    const def = HERO_MAP[hero] || HERO_MAP.valok;
    const p = {
      id, name, team, hero: def.id, def, isBot, isDummy,
      pos: [0, 0, 0], vel: [0, 0, 0], yaw: SPAWN_YAW[team], pitch: 0, onGround: true,
      dashT: 0, dashV: [0, 0, 0], glideUntil: 0,
      hp: def.hp, maxHp: def.hp, alive: true, shield: 0, shieldT: 0,
      cds: { lmb: 0, q: 0, e: 0 }, ult: 0, st: {}, ammo: def.abilities.lmb.ammo || 0, reloadT: 0, combo: 0, lastAtk: -9,
      stats: { k: 0, d: 0, dmg: 0, heal: 0 },
      lastHurtBy: null, lastHurtAt: -99, dashHit: null, leap: null, traps: [], deadAt: 0,
      slot: 0,
    };
    this.players.set(id, p);
    if (isBot) this.brains.set(id, new BotBrain(this, p, this.difficulty));
    return p;
  }
  removePlayer(id) { this.players.delete(id); this.brains.delete(id); }
  makeBot(id) { const p = this.players.get(id); if (!p) return; p.isBot = true; this.brains.set(id, new BotBrain(this, p, this.difficulty)); }
  setHero(id, heroId) {
    const p = this.players.get(id); if (!p) return;
    const def = HERO_MAP[heroId]; if (!def) return;
    p.hero = def.id; p.def = def; p.pas = PASSIVES[def.id] || null; p.pasT = {}; p.rs = 0; p.fm = ''; p.sn = ''; p.marks = {}; p.maxHp = def.hp; p.hp = def.hp; p.cds = { lmb: 0, q: 0, e: 0 }; p.ammo = def.abilities.lmb.ammo || 0; p.reloadT = 0;
    if (this.mode === 'training') p.ult = ULT_COST;
    this.ev({ t: 'roster' });
  }
  roster() {
    return [...this.players.values()].map(p => ({ id: p.id, name: p.name, team: p.team, hero: p.hero, isBot: p.isBot, isDummy: p.isDummy }));
  }

  ev(e) { this.events.push(e); }
  drain() { const e = this.events; this.events = []; return e; }

  // ---------- match flow ----------
  startMatch() {
    this.score = [0, 0]; this.round = 0; this.winner = -1;
    for (const p of this.players.values()) { p.stats = { k: 0, d: 0, dmg: 0, heal: 0 }; p.ult = 0; }
    if (this.mode === 'horde') { this.wave = 0; this.startWave(); return; }
    this.startRound();
  }

  // ---------- 심연 토벌 (wave survival) ----------
  startWave() {
    this.wave++; this.round = this.wave;
    this.projs = []; this.zones = [];
    for (const p of [...this.players.values()]) if (p.team === 1) this.removePlayer(p.id);
    const n = Math.min(6, 1 + Math.ceil(this.wave * 0.55));
    const boss = this.wave % 5 === 0;
    const pool = HEROES.filter(h => h.id !== 'dummy');
    const mul = 0.66 + this.wave * 0.06;
    for (let i = 0; i < n; i++) {
      const h = pool[(Math.random() * pool.length) | 0];
      const isBoss = boss && i === 0;
      const p = this.addPlayer({ id: 'w' + this.wave + '_' + i, name: (isBoss ? '심연의 ' : '심연 ') + h.name, team: 1, hero: h.id, isBot: true });
      p.hpMul = mul * (isBoss ? 2.6 : 1); p.hordeMul = 0.7 + this.wave * 0.05 + (isBoss ? 0.25 : 0); p.boss = isBoss;
    }
    this.computeReso();
    const idx = [0, 0];
    for (const p of this.players.values()) {
      p.traps = []; p.cds = { lmb: 0, q: 0, e: 0 };
      if (p.team === 0 && !p.alive) { p.alive = true; }
      this.spawn(p, idx[p.team]++);
      if (p.boss) this.addSt(p, 'giant', 9999);
    }
    this.phase = 'pre'; this.phaseT = this.wave === 1 ? 4 : 3;
    this.ev({ t: 'round', n: this.wave, score: [...this.score], horde: true, boss });
    this.ev({ t: 'roster' });
  }

  computeReso() {
    const cnt = [{}, {}];
    for (const p of this.players.values()) { if (p.isDummy) continue; const el = p.def.el; if (el) cnt[p.team][el] = (cnt[p.team][el] || 0) + 1; }
    for (const p of this.players.values()) { const el = p.def.el; p.reso = el && cnt[p.team][el] >= 2 ? el : null; }
    const list = [];
    for (const t of [0, 1]) for (const el in cnt[t]) if (cnt[t][el] >= 2) list.push({ team: t, el, n: cnt[t][el] });
    return list;
  }
  startTraining() {
    this.phase = 'train';
    let i = 0;
    for (const p of this.players.values()) {
      if (p.isDummy) { const ds = MAP.cur.dummies; const s = ds[i++ % ds.length]; p.pos = [...s]; p.home = [...s]; p.yaw = -Math.PI / 2; p.yaw = Math.PI / 2; }
      else this.spawn(p, 0);
      p.ult = ULT_COST;
    }
  }
  spawn(p, idx) {
    p.pas = PASSIVES[p.def.id] || null; p.pasT = p.pasT || {}; p.marks = p.marks || {};
    p.hist = []; p.tpLock = 0; p.form = null; p.fm = ''; p.channel = null; p.flurry = null; p.marks = {}; p.rs = p.pas?.res?.start || 0; p.pasT = {};
    const s = SPAWNS[p.team][idx % 6];
    p.pos = [...s]; p.vel = [0, 0, 0]; p.yaw = SPAWN_YAW[p.team]; p.pitch = 0;
    p.maxHp = Math.round(p.def.hp * (p.hpMul || 1) * (p.reso === 'frost' ? 1.08 : 1));
    p.hp = p.maxHp; p.alive = true; p.st = {}; p.shield = 0; p.dashT = 0; p.glideUntil = 0; p.tether = null; p.doom = null;
    if (p.reso === 'storm') p.st.resoSpd = { t: 9999, v: 0.06 };
    p.pas?.spawn?.(this, p);
    p.dashHit = null; p.leap = null; p.ammo = this.lmbOf(p).ammo || 0; p.reloadT = 0;
    this.ev({ t: 'tp', id: p.id, pos: [...p.pos], yaw: p.yaw });
  }
  startRound() {
    this.round++;
    if (this.round === 1) this.computeReso();
    this.projs = []; this.zones = [];
    const idx = [0, 0];
    for (const p of this.players.values()) {
      p.traps = [];
      p.cds = { lmb: 0, q: 0, e: 0 };
      this.spawn(p, idx[p.team]++);
    }
    this.phase = 'pre'; this.phaseT = PRE_T;
    this.ev({ t: 'round', n: this.round, score: [...this.score] });
    if (this.round === 1) this.ev({ t: 'reso', list: this.computeReso() });
  }
  endRound(w) {
    if (this.phase !== 'live') return;
    if (w >= 0) this.score[w]++;
    this.phase = 'post'; this.phaseT = POST_T;
    this.ev({ t: 'roundEnd', w, score: [...this.score] });
    if (w >= 0 && this.score[w] >= ROUNDS_TO_WIN) {
      this.winner = w;
    }
  }

  // ---------- inputs from humans ----------
  clientState(id, s) {
    const p = this.players.get(id); if (!p || p.isBot) return;
    if (!p.alive) return;
    const ox = p.pos[0], oz = p.pos[2];
    if (p.tpLock > this.now && Math.hypot(s.pos[0] - ox, s.pos[2] - oz) > 1.5) return;
    p.pos = s.pos; p.yaw = s.yaw; p.pitch = s.pitch; p.onGround = s.onGround;
    p.vel = s.vel || [0, 0, 0];
    p._moved = Math.hypot(ox - p.pos[0], oz - p.pos[2]);
  }

  canAct(p) { return p.alive && (this.phase === 'live' || this.phase === 'train') && !p.st.stun && !p.st.sleep && !p.flurry; }
  gain(p, n) { const R = p.pas?.res; if (!R) return; p.rs = Math.max(0, Math.min(R.max, p.rs + n)); }
  lmbOf(p) { return effLmb(p.def, p.fm, p.sn); }

  // aim: {yaw, pitch, charge}. ownerMoved: movement part was already applied by the owner.
  cast(id, slot, aim, ownerMoved = false) {
    const p = this.players.get(id);
    if (!p || !this.canAct(p)) return false;
    const def = slot === 'lmb' ? this.lmbOf(p) : p.def.abilities[slot];
    if (!def) return false;
    if (slot !== 'lmb' && p.st.silence) return false;
    if (def.cost && p.rs < def.cost) return false;
    const tol = p.isBot ? 0.001 : 0.2;
    if (slot === 'x') { if (p.ult < ULT_COST - 0.5) return false; p.ult = 0; }
    p._spent = 0; if (def.cost || def.costAll) { p._spent = def.costAll ? p.rs : def.cost; p.rs -= p._spent; }
    else {
      if (slot === 'lmb' && def.ammo) {
        if (p.reloadT > 0) return false;
        if (p.ammo <= 0) { this.reload(id); return false; }
      }
      if (p.cds[slot] > tol) return false;
      let cd = def.cd;
      if (slot === 'lmb' && p.st.atkSpd) cd /= (1 + p.st.atkSpd.v);
      if (slot === 'lmb' && def.rsHaste && p.pas?.res) cd *= 1 - def.rsHaste * p.rs / p.pas.res.max;
      p.cds[slot] = cd;
      if (slot === 'lmb' && def.ammo && !p.st.infAmmo) { p.ammo--; if (p.ammo <= 0) this.reload(id); }
    }
    if (slot === 'lmb') { p.combo = this.now - p.lastAtk < Math.max(1.1, def.cd * 2.5) ? (p.combo + 1) % 3 : 0; p.lastAtk = this.now; }
    if (aim) { p.yaw = aim.yaw; p.pitch = aim.pitch; }
    const origin = aim?.pre ? [...aim.pre] : [...p.pos];
    this.ev({ t: 'cast', id, slot, hero: p.hero, combo: p.combo, from: origin, fm: p.fm, sn: p.sn });
    this._slot = slot; this._castDef = def;
    if (def.form) { p.form = { slot, until: this.now + def.form.dur }; p.fm = slot; if (def.form.st) this.applySt(p, def.form.st); if (def.form.heal) this.heal(p, p, def.form.heal); }
    if (def.kind === 'stance') { p.sn = p.sn === slot ? '' : slot; if (def.alt?.ammo) p.ammo = this.lmbOf(p).ammo || 0; this.ev({ t: 'fx', fx: 'stance', id: p.id, on: !!p.sn, color: p.def.color }); }
    if (def.gain) this.gain(p, def.gain);
    if (def.cleanse) this.cleanse(p, def.cleanse === 'allies' ? 10 : 0);
    if (def.hpCost) p.hp = Math.max(1, p.hp - def.hpCost);
    if (def.shield && def.kind !== 'buff') { p.shield = Math.max(p.shield, def.shield); p.shieldT = 4; }
    if (def.originZone) this.spawnZone(p, def.originZone, origin, p.yaw);
    if (def.decoy) this.spawnZone(p, { ...def.decoy, dur: 0, burst: { dmg: def.decoy.dmg } }, origin, p.yaw);
    if (def.refill) { p.ammo = this.lmbOf(p).ammo || 0; p.reloadT = 0; }
    if (this.mode === 'training' && slot === 'x') p.ult = ULT_COST;

    if (MOVE_KINDS.has(def.kind)) {
      if (!ownerMoved && (p.isBot || p.isDummy)) applyMoveAbility(p, def, p.yaw, p.pitch, this.now);
      if (def.kind === 'glide' && (p.isBot || p.isDummy)) p.glideUntil = this.now + def.dur;
      if (def.kind === 'glide') p.glideUntilSrv = this.now + def.dur;
      if (def.kind === 'dash') p.dashHit = { t: def.dur + 0.12, def, hit: new Set(), acc: 0 };
      if (def.kind === 'dash' && def.invuln) this.addSt(p, 'invuln', def.dur + 0.1);
      if (def.kind === 'leap' && def.land) p.leap = { def, t0: this.now };
      if (def.kind === 'launch' && def.aoe) this.aoeAt(p, origin, def.aoe.r, def.aoe.dmg, { knock: def.aoe.knock, look: 'burst' });
      if (def.kind === 'launch') this.ev({ t: 'fx', fx: 'burst', pos: origin, color: p.def.color });
      if (def.kind === 'blink') this.ev({ t: 'fx', fx: 'blink', pos: origin, to: [...p.pos], color: p.def.color });
    } else {
      this['k_' + def.kind]?.(p, def, aim || { yaw: p.yaw, pitch: p.pitch });
    }
    if (def.selfSt) this.applySt(p, def.selfSt);
    p.pas?.cast?.(this, p, slot, def);
    this._slot = null;
    return true;
  }

  reload(id) {
    const p = this.players.get(id); if (!p || !p.alive) return;
    const d = this.lmbOf(p);
    if (!d.ammo || p.reloadT > 0 || p.ammo >= d.ammo) return;
    p.reloadT = d.reload; this.ev({ t: 'reload', id });
  }

  eye(p) { return [p.pos[0], p.pos[1] + EYE * (p.st.giant ? 1.3 : 1), p.pos[2]]; }
  chest(p) { return [p.pos[0], p.pos[1] + 1.1, p.pos[2]]; }
  enemiesOf(p) { return [...this.players.values()].filter(o => o.alive && o.team !== p.team); }
  alliesOf(p) { return [...this.players.values()].filter(o => o.alive && o.team === p.team); }

  // ---------- ability kinds ----------
  k_melee(p, def, aim) {
    const eye = this.eye(p);
    const [fx, fz] = fwdFromYaw(aim.yaw);
    const range = def.range * (p.st.giant ? 1.3 : 1);
    const half = (def.arc * Math.PI / 180) / 2;
    let hitAny = false;
    for (const o of this.enemiesOf(p)) {
      const c = this.chest(o);
      const dx = c[0] - eye[0], dz = c[2] - eye[2], dy = c[1] - eye[1];
      const hd = Math.hypot(dx, dz);
      if (hd > range + 0.5 || Math.abs(dy) > 2.4) continue;
      const ang = Math.acos(clamp((dx * fx + dz * fz) / (hd || 1), -1, 1));
      if (hd > 1.0 && ang > half) continue;
      if (!losClear(eye, c)) continue;
      let dmg = def.dmg;
      if (def.combo && p.combo === 2) dmg *= def.combo;
      if (def.backstab) {
        const [tx, tz] = fwdFromYaw(o.yaw);
        if ((tx * dx + tz * dz) / (hd || 1) > 0.35) { dmg *= def.backstab; this.ev({ t: 'fx', fx: 'crit', pos: c }); }
      }
      if (def.vsSlowed && (o.st.slow || o.st.root)) { dmg *= def.vsSlowed; this.ev({ t: 'fx', fx: 'crit', pos: c }); }
      this.damage(p, o, dmg, { from: eye, steal: def.steal, onHit: def.onHit });
      hitAny = true;
    }
    if (def.look === 'flame') this.ev({ t: 'fx', fx: 'flame', id: p.id });
    else this.ev({ t: 'fx', fx: 'swing', id: p.id, hit: hitAny, combo: p.combo });
  }

  k_proj(p, def, aim) {
    const n = def.count || 1;
    const eye = this.eye(p);
    let speed = def.speed, dmg = def.dmg;
    if (def.charge) {
      const c = clamp(aim.charge || 0, 0, 1);
      speed = def.charge.spdMin + (def.charge.spdMax - def.charge.spdMin) * c;
      dmg = def.charge.dmgMin + (def.charge.dmgMax - def.charge.dmgMin) * c;
    }
    for (let i = 0; i < n; i++) {
      const off = n > 1 ? ((i / (n - 1)) - 0.5) * (def.spread * Math.PI / 180) : 0;
      const jy = def.jitter ? (Math.random() - 0.5) * 2 * def.jitter : 0, jp = def.jitter ? (Math.random() - 0.5) * 2 * def.jitter : 0;
      const d = dirFromAngles(aim.yaw + off + jy, aim.pitch + jp);
      const [fx, fz] = fwdFromYaw(aim.yaw);
      const start = [eye[0] + d[0] * 0.5 - fz * 0.15, eye[1] - 0.18 + d[1] * 0.5, eye[2] + d[2] * 0.5 + fx * 0.15];
      this.projs.push({ slot: this._slot,
        id: nextEnt++, owner: p.id, team: p.team, def, look: def.look, pos: start,
        vel: [d[0] * speed, d[1] * speed, d[2] * speed], life: def.boomerang ? def.life * 3 : def.life, dmg, hit: new Set(), t: 0, ret: false, bounces: def.bounce || 0, speed,
      });
    }
  }

  beamHit(from, dir, range, team, exclude = null) {
    const wall = raycast(from, dir, range);
    let best = wall, target = null;
    for (const o of this.players.values()) {
      if (!o.alive || o.team === team || o === exclude) continue;
      const t = rayPlayer(from, dir, o.pos, best, 0.6, P_HEIGHT * (o.st.giant ? 1.4 : 1));
      if (t >= 0 && t < best) { best = t; target = o; }
    }
    return { t: best, target };
  }

  k_beam(p, def, aim) {
    const eye = this.eye(p);
    let yaw = aim.yaw, pitch = aim.pitch;
    if (def.spread) { yaw += (Math.random() - 0.5) * 2 * def.spread; pitch += (Math.random() - 0.5) * 2 * def.spread; }
    const d = dirFromAngles(yaw, pitch);
    let dmg = def.dmg;
    if (def.charge) dmg = def.charge.dmgMin + (def.charge.dmgMax - def.charge.dmgMin) * clamp(aim.charge || 0, 0, 1);
    if (def.pierce) {
      const wall = raycast(eye, d, def.range);
      const end = [eye[0] + d[0] * wall, eye[1] + d[1] * wall, eye[2] + d[2] * wall];
      this.ev({ t: 'fx', fx: 'beam', look: def.look, id: p.id, from: [eye[0], eye[1] - 0.2, eye[2]], to: end, color: p.def.color });
      for (const o of this.enemiesOf(p)) {
        const tt = rayPlayer(eye, d, o.pos, wall, 0.6, P_HEIGHT * (o.st.giant ? 1.4 : 1));
        if (tt >= 0) this.damage(p, o, dmg, { from: eye, onHit: def.onHit });
      }
      return;
    }
    const { t, target } = this.beamHit(eye, d, def.range, p.team);
    const end = [eye[0] + d[0] * t, eye[1] + d[1] * t, eye[2] + d[2] * t];
    this.ev({ t: 'fx', fx: 'beam', look: def.look, id: p.id, from: [eye[0], eye[1] - 0.2, eye[2]], to: end, color: p.def.color });
    if (target) {
      this.damage(p, target, dmg, { from: eye, onHit: def.onHit, steal: def.steal });
      if (def.pullBeam) { const dx = p.pos[0] - target.pos[0], dz = p.pos[2] - target.pos[2], l = Math.hypot(dx, dz) || 1; const k = Math.min(def.pullBeam, Math.max(0, l - 2)) * 2.2; this.impulse(target, [dx / l * k, 4, dz / l * k], true); }
      if (def.chain) {
        let last = target; const hitSet = new Set([target.id]);
        for (let i = 0; i < def.chain.n; i++) {
          let best = null, bd = def.chain.r;
          for (const o of this.enemiesOf(p)) {
            if (hitSet.has(o.id)) continue;
            const dd = Math.hypot(o.pos[0] - last.pos[0], o.pos[2] - last.pos[2]);
            if (dd < bd && losClear(this.chest(last), this.chest(o))) { bd = dd; best = o; }
          }
          if (!best) break;
          this.ev({ t: 'fx', fx: 'beam', look: def.look, from: this.chest(last), to: this.chest(best), color: p.def.color });
          this.damage(p, best, def.chain.dmg, { from: this.chest(last), onHit: def.onHit });
          hitSet.add(best.id); last = best;
        }
      }
    }
  }

  aimPoint(p, aim, range) {
    const eye = this.eye(p);
    const d = dirFromAngles(aim.yaw, aim.pitch);
    const t = raycast(eye, d, range);
    const pt = [eye[0] + d[0] * t, eye[1] + d[1] * t, eye[2] + d[2] * t];
    pt[1] = groundUnder(pt[0], pt[2], pt[1] + 0.3);
    if (t >= range) pt[1] = groundUnder(pt[0], pt[2], 50);
    return pt;
  }

  k_zone(p, def, aim) {
    let pos, yaw = aim.yaw;
    if (def.at === 'aim') pos = this.aimPoint(p, aim, def.range);
    else if (def.at === 'front') {
      const [fx, fz] = fwdFromYaw(aim.yaw);
      pos = [p.pos[0] + fx * def.dist, 0, p.pos[2] + fz * def.dist];
      pos[1] = groundUnder(pos[0], pos[2], p.pos[1] + 1);
    } else pos = [...p.pos];
    const z = {
      id: nextEnt++, owner: p.id, team: p.team, def, look: def.look, pos, yaw, r: def.r || 0,
      t: 0, delay: def.delay || 0, dur: def.dur, acc: 0, sacc: 0, fired: false,
    };
    z.slot = z.slot || this._slot; this.zones.push(z);
  }

  k_deadeye(p, def, aim) {
    const eye = this.eye(p);
    const [fx, fz] = fwdFromYaw(aim.yaw);
    const half = (def.cone * Math.PI / 180) / 2;
    for (const o of this.enemiesOf(p)) {
      if (o.st.invis) continue;
      const c = this.chest(o);
      const dx = c[0] - eye[0], dz = c[2] - eye[2];
      const hd = Math.hypot(dx, dz);
      if (hd > def.range) continue;
      if (Math.acos(clamp((dx * fx + dz * fz) / (hd || 1), -1, 1)) > half) continue;
      if (!losClear(eye, c)) continue;
      this.ev({ t: 'fx', fx: 'beam', look: def.look || 'silver', id: p.id, from: [eye[0], eye[1] - 0.2, eye[2]], to: c, color: p.def.color });
      this.damage(p, o, def.dmg, { from: eye, onHit: def.onHitSt });
    }
    this.ev({ t: 'fx', fx: 'deadeye', pos: [...p.pos], color: p.def.color });
  }

  spawnZone(p, zd, pos, yaw = 0) {
    const z = { id: nextEnt++, owner: p.id, team: p.team, def: zd, look: zd.look, pos: [...pos], yaw, r: zd.r || 0, t: 0, delay: zd.delay || 0, dur: zd.dur ?? 2, acc: 0, sacc: 0, fired: false };
    z.pos[1] = groundUnder(z.pos[0], z.pos[2], z.pos[1] + 0.5);
    z.slot = z.slot || this._slot; this.zones.push(z);
    return z;
  }
  teleport(p, pos, yaw = p.yaw) {
    p.pos = [...pos]; p.vel = [0, 0, 0]; p.dashT = 0; p.yaw = yaw;
    if (!p.isBot && !p.isDummy) { p.tpLock = this.now + 0.6; this.ev({ t: 'tp', id: p.id, pos: [...pos], yaw, keep: true }); }
  }
  aimTarget(p, aim, range, cone = 0.35, list = null) {
    const eye = this.eye(p), d = dirFromAngles(aim.yaw, aim.pitch);
    let best = null, bs = Math.cos(cone);
    for (const o of (list || this.enemiesOf(p))) {
      if (o === p || (o.st.invis && list === null)) continue;
      const c = this.chest(o); const v = [c[0] - eye[0], c[1] - eye[1], c[2] - eye[2]]; const l = Math.hypot(...v);
      if (l > range) continue;
      const dot = (v[0] * d[0] + v[1] * d[1] + v[2] * d[2]) / l;
      if (dot > bs && losClear(eye, c)) { bs = dot; best = o; }
    }
    return best;
  }
  k_shadowstep(p, def, aim) {
    const o = this.aimTarget(p, aim, def.range, 0.3);
    const from = [...p.pos];
    if (o) {
      const [fx, fz] = fwdFromYaw(o.yaw);
      let pos = [o.pos[0] - fx * 1.3, o.pos[1], o.pos[2] - fz * 1.3];
      if (!losClear([o.pos[0], o.pos[1] + 1, o.pos[2]], [pos[0], pos[1] + 1, pos[2]])) pos = [o.pos[0] + fx * 1.3, o.pos[1], o.pos[2] + fz * 1.3];
      this.teleport(p, pos, o.yaw);
    } else { applyMoveAbility(p, { kind: 'blink', dist: def.dist }, aim.yaw, aim.pitch, this.now); this.teleport(p, p.pos, aim.yaw); }
    this.ev({ t: 'fx', fx: 'blink', pos: from, to: [...p.pos], color: p.def.color });
  }
  k_swap(p, def, aim) {
    const o = this.aimTarget(p, aim, def.range, 0.12);
    if (!o) { this.ev({ t: 'fx', fx: 'blink', pos: [...p.pos], color: p.def.color }); return; }
    const a = [...p.pos], b = [...o.pos];
    this.teleport(p, b, p.yaw); this.teleport(o, a, o.yaw);
    this.applySt(o, { stun: [0.6] });
    this.ev({ t: 'fx', fx: 'swap', from: [a[0], a[1] + 1, a[2]], to: [b[0], b[1] + 1, b[2]], color: p.def.color });
  }
  k_allywarp(p, def, aim) {
    const allies = this.alliesOf(p).filter(o => o !== p);
    let o = this.aimTarget(p, aim, def.range, 0.6, allies);
    if (!o && allies.length) o = allies.reduce((m, x) => (Math.hypot(x.pos[0] - p.pos[0], x.pos[2] - p.pos[2]) < Math.hypot(m.pos[0] - p.pos[0], m.pos[2] - p.pos[2]) ? x : m));
    if (!o) return;
    const from = [...p.pos];
    const [fx, fz] = fwdFromYaw(o.yaw);
    this.teleport(p, [o.pos[0] - fx * 1.4, o.pos[1], o.pos[2] - fz * 1.4], o.yaw);
    if (def.heal) this.heal(p, o, def.heal);
    this.ev({ t: 'fx', fx: 'blink', pos: from, to: [...p.pos], color: p.def.color });
  }
  k_recall(p, def) {
    const want = this.now - def.back;
    const h = (p.hist || []).find(e => e[0] >= want) || p.hist?.[0];
    if (!h) return;
    const from = [...p.pos];
    this.teleport(p, [h[1], h[2], h[3]], p.yaw);
    if (def.heal) this.heal(p, p, def.heal);
    this.ev({ t: 'fx', fx: 'recall', from, to: [...p.pos], color: p.def.color });
  }

  k_trap(p, def) {
    const z = { id: nextEnt++, owner: p.id, team: p.team, def, look: def.look || 'trap', pos: [...p.pos], yaw: 0, r: def.r, t: 0, delay: 0.4, dur: def.life, trap: true };
    p.traps.push(z.id);
    while (p.traps.length > def.max) { const old = p.traps.shift(); this.zones = this.zones.filter(zz => zz.id !== old); }
    z.slot = z.slot || this._slot; this.zones.push(z);
  }

  k_aoe(p, def, aim) {
    const c = def.at === 'cone' ? this.eye(p) : p.pos;
    if (def.dmg || def.st || def.knock || def.knockup) {
      this.aoeAt(p, c, def.r, def.dmg || 0, { st: def.st, knock: def.knock, knockup: def.knockup, noLos: def.noLos, cone: def.at === 'cone' ? { yaw: aim.yaw, angle: def.angle } : null });
    }
    if (def.heal) for (const o of this.alliesOf(p)) {
      if (Math.hypot(o.pos[0] - p.pos[0], o.pos[2] - p.pos[2]) <= def.r) this.heal(p, o, def.heal);
    }
    this.ev({ t: 'fx', fx: def.look || (def.heal ? 'healwave' : 'shock'), pos: [...p.pos], r: def.r, yaw: aim.yaw, angle: def.angle, color: p.def.color });
  }

  aoeAt(p, c, r, dmg, o = {}) {
    for (const e of this.enemiesOf(p)) {
      const ch = this.chest(e);
      const dx = ch[0] - c[0], dz = ch[2] - c[2];
      const d = Math.hypot(dx, dz);
      if (d > r + 0.4 || Math.abs(ch[1] - c[1]) > Math.max(3, r * 0.6)) continue;
      if (o.cone) {
        const [fx, fz] = fwdFromYaw(o.cone.yaw);
        const ang = Math.acos(clamp((dx * fx + dz * fz) / (d || 1), -1, 1));
        if (d > 1 && ang > (o.cone.angle * Math.PI / 180) / 2) continue;
      }
      if (!o.noLos && !losClear([c[0], c[1] + 0.6, c[2]], ch)) continue;
      if (dmg) this.damage(p, e, dmg, { from: c, onHit: o.st, execute: o.execute });
      else if (o.st) this.applySt(e, o.st);
      if (o.knock || o.knockup) {
        const n = d > 0.01 ? [dx / d, dz / d] : [1, 0];
        const k = o.knock || 0;
        this.impulse(e, [n[0] * k, o.knockup || (k ? 4 : 0), n[1] * k], true);
      }
    }
  }

  k_buff(p, def, aim) {
    if (def.cdr) for (const a of this.alliesOf(p)) if (Math.hypot(a.pos[0] - p.pos[0], a.pos[2] - p.pos[2]) <= (def.r || 12)) for (const k of ['q', 'e']) a.cds[k] = Math.max(0, a.cds[k] - def.cdr);
    let targets = [];
    if (def.target === 'self') targets = [p];
    else if (def.target === 'allies') targets = this.alliesOf(p).filter(o => Math.hypot(o.pos[0] - p.pos[0], o.pos[2] - p.pos[2]) <= def.r);
    else if (def.target === 'ally') {
      // best aligned ally in view, else most wounded nearby, else self
      const eye = this.eye(p); const d = dirFromAngles(aim.yaw, aim.pitch);
      let best = null, bs = 0.9;
      for (const o of this.alliesOf(p)) {
        if (o === p) continue;
        const c = this.chest(o); const v = [c[0] - eye[0], c[1] - eye[1], c[2] - eye[2]];
        const l = Math.hypot(...v); if (l > def.r) continue;
        const dot = (v[0] * d[0] + v[1] * d[1] + v[2] * d[2]) / l;
        if (dot > bs && losClear(eye, c)) { bs = dot; best = o; }
      }
      if (!best && p.isBot) {
        let lw = 0.95;
        for (const o of this.alliesOf(p)) { if (o === p) continue; const f = o.hp / o.maxHp; if (f < lw && Math.hypot(o.pos[0] - p.pos[0], o.pos[2] - p.pos[2]) < def.r) { lw = f; best = o; } }
      }
      targets = best ? [best] : [];
      if (def.alsoSelf || !best) targets.push(p);
    }
    for (const t of targets) {
      if (def.st) this.applySt(t, def.st);
      if (def.heal) this.heal(p, t, def.heal);
      if (def.guard && t !== p) t.st.guard = { t: def.guard[0], v: def.guard[1], by: p.id };
      if (def.shield) { t.shield = Math.max(t.shield, def.shield); t.shieldT = 4; }
      this.ev({ t: 'fx', fx: 'buff', id: t.id, color: p.def.color, icon: def.icon });
    }
  }

  // ---------- status / damage ----------
  addSt(p, key, t, v = 0) {
    const cur = p.st[key];
    if (!cur || cur.t < t || (cur.v || 0) < v) p.st[key] = { t: Math.max(t, cur?.t || 0), v: Math.max(v, cur?.v || 0) };
  }
  applySt(p, st) {
    for (const k in st) {
      const [t, v] = st[k];
      if ((k === 'stun' || k === 'root' || k === 'slow') && p.st.invuln) continue;
      this.addSt(p, k, t, v || 0);
    }
  }

  damage(src, tgt, amount, o = {}) {
    if (!tgt.alive || tgt.st.invuln) return 0;
    if (this.phase !== 'live' && this.phase !== 'train') return 0;
    let dmg = amount;
    if (o.slot === undefined) o.slot = this._slot || 'other';
    if (src) {
      if (src.pas?.out) dmg *= src.pas.out(this, src, tgt, dmg, o) ?? 1;
      if (o.execute) dmg *= 1 + o.execute * (1 - tgt.hp / tgt.maxHp);
      if (src.st.empower && o.slot === 'lmb' && !o.dot) { dmg *= 1 + src.st.empower.v; delete src.st.empower; this.ev({ t: 'fx', fx: 'crit', pos: this.chest(tgt) }); }
      if (src.st.giant && !src.st.dmgUp) dmg *= 1.15;
      if (src.reso === 'fire') dmg *= 1.06;
      if (src.hordeMul) dmg *= src.hordeMul;
      if (src.def.el === 'shadow' && tgt.hp / tgt.maxHp < 0.35) dmg *= 1.15;
    }
    if (tgt.st.vuln) dmg *= 1 + tgt.st.vuln.v;
    if (tgt.st.block && o.from) {
      const [tx, tz] = fwdFromYaw(tgt.yaw);
      const dx = o.from[0] - tgt.pos[0], dz = o.from[2] - tgt.pos[2];
      const l = Math.hypot(dx, dz) || 1;
      if ((tx * dx + tz * dz) / l > 0.15) { dmg *= 1 - tgt.st.block.v; this.ev({ t: 'fx', fx: 'blocked', id: tgt.id }); }
    }
    if (tgt.st.dr) dmg *= 1 - tgt.st.dr.v;
    if (tgt.pas?.inc) dmg = tgt.pas.inc(this, tgt, src, dmg, o) ?? dmg;
    // guard: part of the damage goes to the guardian instead
    if (tgt.st.guard && !o.guarded) { const g = this.players.get(tgt.st.guard.by); if (g && g.alive && g !== tgt) { const part = dmg * tgt.st.guard.v; dmg -= part; this.damage(src, g, part, { ...o, guarded: true, noElem: true, onHit: null }); } }
    dmg = Math.max(1, Math.round(dmg));
    let absorbed = 0;
    if (tgt.shield > 0) { absorbed = Math.min(tgt.shield, dmg); tgt.shield -= absorbed; }
    let real = dmg - absorbed;
    let newHp = tgt.hp - real;
    if (tgt.st.undying && newHp < 1) newHp = 1;
    if (newHp < 1 && tgt.pas?.cheat && tgt.pas.cheat(this, tgt)) newHp = 1;
    if (tgt.st.sleep) delete tgt.st.sleep;
    real = tgt.hp - newHp;
    tgt.hp = newHp;
    if (src) {
      src.stats.dmg += dmg;
      if (this.phase === 'live' || this.mode === 'training') src.ult = Math.min(ULT_COST, src.ult + dmg / 5);
      let steal = (o.steal || 0) + (src.st.steal ? src.st.steal.v : 0) + (src.def.el === 'shadow' && !o.dot ? 0.08 : 0) + (src.reso === 'shadow' ? 0.04 : 0);
      if (steal > 0) this.heal(src, src, dmg * steal, true);
      tgt.lastHurtBy = src.id; tgt.lastHurtAt = this.now;
    }
    if (o.onHit) { this.applySt(tgt, o.onHit); if (o.onHit.doom && src) tgt.doom = { at: this.now + o.onHit.doom[0], dmg: o.onHit.doom[1], src: src.id }; }
    this.ev({ t: 'dmg', id: tgt.id, by: src?.id, a: dmg, sh: absorbed > 0, pos: this.chest(tgt), el: src && !o.dot ? src.def.el : undefined });
    if (src && src !== tgt) { src.pas?.hit?.(this, src, tgt, dmg, o); if (o.mark) this.addMark(src, tgt, o.mark); }
    tgt.pas?.hurt?.(this, tgt, src, dmg, o);
    if (tgt.st.thorns && src && src !== tgt && !o.thorn && !o.dot) this.damage(tgt, src, dmg * tgt.st.thorns.v, { thorn: true, noElem: true, slot: 'thorns' });
    if (src && src !== tgt && !o.noElem && !o.dot && tgt.hp > 0) this.elemProc(src, tgt, dmg);
    if (tgt.hp <= 0) this.kill(tgt, src);
    return dmg;
  }

  addMark(src, tgt, n = 1, max = 5) {
    const m = tgt.marks[src.id] || { n: 0, t: 0 };
    m.n = Math.min(max, m.n + n); m.t = this.now + 6; tgt.marks[src.id] = m;
    this.ev({ t: 'fx', fx: 'mark', id: tgt.id, n: m.n, color: src.def.color });
  }
  markCount(src, tgt) { const m = tgt.marks[src.id]; return m && m.t > this.now ? m.n : 0; }
  cleanse(p, r = 0) {
    const list = r ? this.alliesOf(p).filter(a => Math.hypot(a.pos[0] - p.pos[0], a.pos[2] - p.pos[2]) <= r) : [p];
    for (const a of list) { for (const k of ['slow', 'root', 'stun', 'burn', 'poison', 'silence', 'sleep', 'wither', 'vuln']) delete a.st[k]; this.ev({ t: 'fx', fx: 'cleanse', pos: [...a.pos] }); }
  }
  k_stance() { }
  k_channel(p, def) { p.channel = { def, t: 0, acc: 0, fx: 0 }; if (def.root) this.addSt(p, 'channelRoot', def.dur); }
  stepChannel(p, dt) {
    const C = p.channel, def = C.def;
    if (!p.alive || p.st.stun || p.st.sleep || p.st.silence) { p.channel = null; delete p.st.channelRoot; return; }
    C.t += dt; C.acc += dt; C.fx += dt;
    const eye = this.eye(p), d = dirFromAngles(p.yaw, p.pitch);
    if (C.acc >= def.tick) {
      C.acc -= def.tick;
      this._slot = 'channel';
      if (def.cone) {
        for (const o of this.enemiesOf(p)) {
          const c = this.chest(o); const v = [c[0] - eye[0], c[1] - eye[1], c[2] - eye[2]]; const l = Math.hypot(...v);
          if (l > def.range || (v[0] * d[0] + v[1] * d[1] + v[2] * d[2]) / l < Math.cos(def.cone * Math.PI / 360) || !losClear(eye, c)) continue;
          this.damage(p, o, def.dmg, { from: eye, onHit: def.onHit, steal: def.steal });
        }
        if (def.healAllies) for (const a of this.alliesOf(p)) { if (a === p) continue; const c = this.chest(a); const v = [c[0] - eye[0], c[1] - eye[1], c[2] - eye[2]]; const l = Math.hypot(...v); if (l < def.range && (v[0] * d[0] + v[1] * d[1] + v[2] * d[2]) / l > Math.cos(def.cone * Math.PI / 360)) this.heal(p, a, def.healAllies); }
      } else {
        const o = this.aimTarget(p, { yaw: p.yaw, pitch: p.pitch }, def.range, 0.3);
        if (o) {
          this.damage(p, o, def.dmg, { from: eye, onHit: def.onHit, steal: def.steal });
          if (def.pull) this.impulse(o, [(p.pos[0] - o.pos[0]) * 0.6, 1, (p.pos[2] - o.pos[2]) * 0.6], true);
          C.tgt = o.id;
        } else C.tgt = null;
      }
      this._slot = null;
    }
    if (C.fx >= 0.1) {
      C.fx = 0;
      if (def.cone) this.ev({ t: 'fx', fx: 'cone', from: eye, dir: d, r: def.range, look: def.look, color: p.def.color, ang: def.cone });
      else { const o = C.tgt && this.players.get(C.tgt); this.ev({ t: 'fx', fx: 'tether', from: [eye[0], eye[1] - 0.3, eye[2]], to: o ? this.chest(o) : [eye[0] + d[0] * def.range, eye[1] + d[1] * def.range, eye[2] + d[2] * def.range], color: (LOOK_COLORS[def.look] || p.def.color) }); }
    }
    if (C.t >= def.dur) { p.channel = null; delete p.st.channelRoot; if (def.end) this.aoeAt(p, p.pos, def.end.r, def.end.dmg, { knock: def.end.knock, look: def.look }); }
  }
  k_chain(p, def, aim) {
    let from = this.eye(p), cur = this.aimTarget(p, aim, def.range, 0.2);
    const hit = new Set();
    for (let i = 0; i <= def.bounces && cur; i++) {
      hit.add(cur.id);
      const c = this.chest(cur);
      this.ev({ t: 'fx', fx: 'beam', look: def.look || 'chain', from, to: c, color: p.def.color });
      this.damage(p, cur, def.dmg * Math.pow(def.falloff ?? 0.85, i), { from, onHit: def.onHit, mark: def.mark });
      if (def.healAlly) { /* chain heals through allies */ }
      from = c; let best = null, bd = def.jump || 8;
      for (const o of this.enemiesOf(p)) { if (hit.has(o.id)) continue; const d = Math.hypot(o.pos[0] - cur.pos[0], o.pos[2] - cur.pos[2]); if (d < bd && losClear(c, this.chest(o))) { bd = d; best = o; } }
      cur = best;
    }
  }
  k_detonate(p, def) {
    let n = 0;
    for (const o of this.enemiesOf(p)) {
      if (Math.hypot(o.pos[0] - p.pos[0], o.pos[2] - p.pos[2]) > def.range) continue;
      let stacks = 0;
      if (def.what === 'marks') { stacks = this.markCount(p, o); delete o.marks[p.id]; }
      else if (def.what === 'burn' && o.st.burn) { stacks = 1 + o.st.burn.t; delete o.st.burn; }
      else if (def.what === 'poison' && o.st.poison) { stacks = 1 + o.st.poison.t; delete o.st.poison; }
      else if (def.what === 'slow' && (o.st.slow || o.st.root)) { stacks = 2; }
      if (!stacks) continue;
      n++;
      this.ev({ t: 'fx', fx: 'explode', pos: this.chest(o), r: 1.6 + stacks * 0.25, look: def.look || 'void' });
      this.damage(p, o, def.base + def.per * stacks, { from: p.pos, onHit: def.onHit, noLos: true });
    }
    if (def.refund && n === 0) p.cds[this._slot] = def.cd * 0.3;
    if (def.healPer && n) this.heal(p, p, def.healPer * n);
  }
  k_flurry(p, def) {
    let list = this.enemiesOf(p).filter(o => !o.st.invis && Math.hypot(o.pos[0] - p.pos[0], o.pos[2] - p.pos[2]) < def.range && losClear(this.chest(p), this.chest(o)));
    if (def.pick === 'low') list.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
    list = list.slice(0, def.max);
    if (!list.length) return;
    p.flurry = { list: list.map(o => o.id), i: 0, t: 0, def, back: [...p.pos] };
    this.addSt(p, 'invuln', list.length * def.every + 0.3);
  }
  stepFlurry(p, dt) {
    const F = p.flurry; F.t -= dt;
    if (F.t > 0) return;
    F.t = F.def.every;
    if (F.i >= F.list.length) { p.flurry = null; if (F.def.returnBack) this.teleport(p, F.back, p.yaw); return; }
    const o = this.players.get(F.list[F.i++]);
    if (!o || !o.alive) return;
    const [fx, fz] = fwdFromYaw(o.yaw);
    const from = [...p.pos];
    this.teleport(p, [o.pos[0] - fx * 1.2, o.pos[1], o.pos[2] - fz * 1.2], o.yaw);
    this.ev({ t: 'fx', fx: 'slashLine', from: [from[0], from[1] + 1, from[2]], to: this.chest(o), color: p.def.color });
    this._slot = 'x'; this.damage(p, o, F.def.dmg, { from: p.pos, onHit: F.def.onHit, execute: F.def.execute }); this._slot = null;
  }

  // element on-hit effects (rate-limited per attacker/target pair)
  elemProc(src, tgt, dmg) {
    const el = src.def.el; if (!el || el === 'shadow') return;
    tgt._elT = tgt._elT || {};
    if (this.now - (tgt._elT[src.id] || -9) < 0.3) return;
    tgt._elT[src.id] = this.now;
    switch (el) {
      case 'fire': this.addSt(tgt, 'burn', 3, 6); break;
      case 'frost': {
        if (this.now - (tgt._chillT || 0) > 3) tgt._chill = 0;
        tgt._chillT = this.now; tgt._chill = (tgt._chill || 0) + 1;
        if (!tgt.st.invuln) this.addSt(tgt, 'slow', 1.2, 0.15);
        if (tgt._chill >= 5) { tgt._chill = 0; if (!tgt.st.invuln) this.addSt(tgt, 'root', 0.7); this.ev({ t: 'fx', fx: 'freeze', pos: [...tgt.pos] }); }
        break;
      }
      case 'storm': {
        if (Math.random() > 0.25) break;
        const c = this.chest(tgt); let best = null, bd = 6;
        for (const o of this.enemiesOf(src)) { if (o === tgt) continue; const d = Math.hypot(o.pos[0] - tgt.pos[0], o.pos[2] - tgt.pos[2]); if (d < bd && losClear(c, this.chest(o))) { bd = d; best = o; } }
        if (best) { this.ev({ t: 'fx', fx: 'beam', look: 'chain', from: c, to: this.chest(best) }); this.damage(src, best, Math.max(8, dmg * 0.35), { noElem: true }); }
        break;
      }
      case 'holy': {
        let best = null, bf = 0.999;
        for (const a of this.alliesOf(src)) { const f = a.hp / a.maxHp; if (f < bf && Math.hypot(a.pos[0] - src.pos[0], a.pos[2] - src.pos[2]) < 10) { bf = f; best = a; } }
        if (best) this.heal(src, best, dmg * 0.1 / 1.2, true);
        break;
      }
      case 'nature': this.addSt(tgt, 'poison', 3, 4); this.addSt(tgt, 'wither', 3, 0.3); break;
    }
  }

  k_tether(p, def, aim) {
    const o = this.aimTarget(p, aim, def.range, 0.25);
    if (!o) { this.ev({ t: 'fx', fx: 'impact', pos: this.eye(p), look: def.look || 'chain' }); return; }
    p.tether = { id: o.id, t: 0, acc: 0, fx: 0, def };
    this.ev({ t: 'fx', fx: 'chain', from: this.chest(p), to: this.chest(o) });
  }
  stepTether(p, dt) {
    const T = p.tether, def = T.def, o = this.players.get(T.id);
    const brk = !o || !o.alive || !p.alive || Math.hypot(o.pos[0] - p.pos[0], o.pos[2] - p.pos[2]) > def.range * 1.25 || !losClear(this.chest(p), this.chest(o));
    if (brk) { p.tether = null; if (o) this.ev({ t: 'fx', fx: 'impact', pos: this.chest(o), look: def.look || 'chain' }); return; }
    T.t += dt; T.acc += dt; T.fx += dt;
    if (T.fx >= 0.1) { T.fx = 0; this.ev({ t: 'fx', fx: 'tether', from: this.chest(p), to: this.chest(o), color: p.def.color }); }
    if (T.acc >= 0.25) { T.acc -= 0.25; if (def.dps) this.damage(p, o, def.dps * 0.25, { from: p.pos, noElem: true }); if (def.drain) this.heal(p, p, def.dps * 0.25 * def.drain, true); }
    if (T.t >= def.hold) {
      p.tether = null;
      if (def.dmg) this.damage(p, o, def.dmg, { from: p.pos, onHit: def.st });
      else if (def.st) this.applySt(o, def.st);
      if (def.pull) { const dx = p.pos[0] - o.pos[0], dz = p.pos[2] - o.pos[2], l = Math.hypot(dx, dz) || 1; const k = Math.min(def.pull, Math.max(0, l - 2)) * 2.2; this.impulse(o, [dx / l * k, 5, dz / l * k], true); }
      this.ev({ t: 'fx', fx: 'burst', pos: [...o.pos], color: p.def.color });
    }
  }

  k_revive(p, def) {
    const dead = [...this.players.values()].filter(o => !o.alive && o.team === p.team && !o.isDummy).sort((a, b) => b.deadAt - a.deadAt);
    const o = dead[0];
    if (o) {
      const [fx, fz] = fwdFromYaw(p.yaw);
      const pos = [p.pos[0] - fx * 1.4, p.pos[1], p.pos[2] - fz * 1.4];
      o.alive = true; o.hp = Math.round(o.maxHp * def.hpPct); o.st = {}; o.shield = 0; o.vel = [0, 0, 0]; o.tether = null; o.doom = null;
      this.addSt(o, 'invuln', 1.5);
      o.pos = pos; o.yaw = p.yaw;
      this.ev({ t: 'tp', id: o.id, pos: [...pos], yaw: p.yaw });
      this.ev({ t: 'respawn', id: o.id, revived: true });
      this.ev({ t: 'fx', fx: 'revive', pos: [...pos], color: p.def.color });
    } else {
      for (const a of this.alliesOf(p)) if (Math.hypot(a.pos[0] - p.pos[0], a.pos[2] - p.pos[2]) <= def.r) this.heal(p, a, def.heal);
      this.ev({ t: 'fx', fx: 'healwave', pos: [...p.pos], r: def.r, color: p.def.color });
    }
  }

  splitProj(pr, pt) {
    const S = pr.def.split, src = this.players.get(pr.owner); if (!src || pr.splitDone) return; pr.splitDone = true;
    const base = Math.atan2(pr.vel[0], pr.vel[2]);
    for (let i = 0; i < S.n; i++) { const a = base + (i - (S.n - 1) / 2) * (S.spread || (Math.PI * 2 / S.n)) * (S.spread ? 1 : 1); const d = [Math.sin(a), S.up || 0.1, Math.cos(a)]; const l = Math.hypot(...d); (this._pend || this.projs).push({ id: nextEnt++, owner: src.id, team: pr.team, def: S.def, look: S.def.look, pos: [pt[0], pt[1] + 0.2, pt[2]], vel: d.map(x => x / l * S.def.speed), life: S.def.life, dmg: S.def.dmg, hit: new Set(pr.hit), t: 0, ret: false, bounces: S.def.bounce || 0, speed: S.def.speed, slot: pr.slot }); }
  }
  spawnProj(p, def, start, d, dmg = def.dmg) {
    const speed = def.speed;
    this.projs.push({ id: nextEnt++, slot: this._slot, owner: p.id, team: p.team, def, look: def.look, pos: [...start], vel: [d[0] * speed, d[1] * speed, d[2] * speed], life: def.life, dmg, hit: new Set(), t: 0, ret: false, bounces: def.bounce || 0, speed });
  }

  heal(src, tgt, amt, silent = false) {
    if (!tgt.alive) return;
    if (src && src.def.el === 'holy') amt *= 1.2;
    if (src?.pas?.healOut) amt *= src.pas.healOut(this, src, tgt, amt) ?? 1;
    if (tgt.reso === 'holy') amt *= 1.1;
    if (tgt.st.wither) amt *= 1 - tgt.st.wither.v;
    const real = Math.min(tgt.maxHp - tgt.hp, amt);
    if (real <= 0) return;
    tgt.hp += real;
    if (src) { src.stats.heal += real; if (src !== tgt || !silent) src.ult = Math.min(ULT_COST, src.ult + real / 4); }
    if (!silent || real > 8) this.ev({ t: 'heal', id: tgt.id, a: Math.round(real), pos: this.chest(tgt) });
  }

  impulse(p, v, setY = false) {
    if (!p.alive) return;
    if (p.isBot || p.isDummy) {
      if (p.isDummy && !p.mover) { p.vel[1] = Math.max(p.vel[1], v[1] * 0.6); return; }
      p.vel[0] += v[0]; p.vel[2] += v[2]; p.vel[1] = setY ? Math.max(p.vel[1], v[1]) : p.vel[1] + v[1];
      p.onGround = false; p.pos[1] += 0.02; p.dashT = 0;
    } else this.ev({ t: 'imp', id: p.id, v, setY });
  }

  kill(p, src) {
    p.channel = null; p.form = null; p.fm = ''; p.flurry = null;
    p.alive = false; p.hp = 0; p.deadAt = this.now; p.st = {}; p.shield = 0;
    p.stats.d++;
    let killer = src && src !== p ? src : (p.lastHurtBy && this.now - p.lastHurtAt < 6 ? this.players.get(p.lastHurtBy) : null);
    if (killer) { killer.stats.k++; killer.pas?.kill?.(this, killer, p); }
    for (const o of this.players.values()) if (o.alive && o !== killer && o.pas?.anyDeath) o.pas.anyDeath(this, o, p);
    this.ev({ t: 'kill', id: p.id, by: killer?.id, hero: p.hero, byHero: killer?.hero, pos: [...p.pos] });
  }

  // ---------- step ----------
  step(dt) {
    this.now += dt;
    // phase
    if (this.phase === 'pre') { this.phaseT -= dt; if (this.phaseT <= 0) { this.phase = 'live'; this.phaseT = LIVE_T; this.ev({ t: 'fight' }); } }
    else if (this.phase === 'live') {
      this.phaseT -= dt;
      const alive = [0, 0];
      for (const p of this.players.values()) if (p.alive) alive[p.team]++;
      if (this.mode === 'horde') {
        this.phaseT = LIVE_T;
        if (alive[0] === 0) { this.winner = 1; this.phase = 'post'; this.phaseT = POST_T; this.ev({ t: 'roundEnd', w: 1, score: [...this.score], horde: true }); }
        else if (alive[1] === 0) { this.score[0]++; this.phase = 'post'; this.phaseT = 3; this.ev({ t: 'roundEnd', w: 0, score: [...this.score], horde: true, wave: this.wave }); }
      }
      else if (alive[0] === 0 || alive[1] === 0) this.endRound(alive[0] === 0 && alive[1] === 0 ? -1 : (alive[0] === 0 ? 1 : 0));
      else if (this.phaseT <= 0) {
        const hpf = [0, 0];
        for (const p of this.players.values()) if (p.alive) hpf[p.team] += p.hp / p.maxHp;
        const w = alive[0] !== alive[1] ? (alive[0] > alive[1] ? 0 : 1) : (Math.abs(hpf[0] - hpf[1]) < 0.05 ? -1 : (hpf[0] > hpf[1] ? 0 : 1));
        this.endRound(w);
      }
    } else if (this.phase === 'post') {
      this.phaseT -= dt;
      if (this.phaseT <= 0) {
        if (this.winner >= 0) { this.phase = 'end'; this.ev({ t: 'matchEnd', w: this.winner, score: [...this.score], horde: this.mode === 'horde', wave: this.wave }); }
        else if (this.mode === 'horde') this.startWave();
        else this.startRound();
      }
    }

    const frozen = this.phase === 'pre' || this.phase === 'end';
    for (const p of this.players.values()) {
      // statuses
      for (const k in p.st) { p.st[k].t -= dt; if (p.st[k].t <= 0) delete p.st[k]; }
      if (p.shieldT > 0) { p.shieldT -= dt; if (p.shieldT <= 0) p.shield = 0; }
      for (const s of ['lmb', 'q', 'e']) if (p.cds[s] > 0) p.cds[s] = Math.max(0, p.cds[s] - dt);
      if (!p.alive) {
        if (this.phase === 'train' && this.now - p.deadAt > (p.isDummy ? 2.5 : 2)) {
          if (p.isDummy) { p.alive = true; p.hp = p.maxHp; p.pos = [...p.home]; p.vel = [0, 0, 0]; this.ev({ t: 'respawn', id: p.id }); }
          else { this.spawn(p, 0); this.ev({ t: 'respawn', id: p.id }); }
        }
        continue;
      }
      if (this.phase === 'live') p.ult = Math.min(ULT_COST, p.ult + dt * 0.9);
      if (this.phase === 'train') p.ult = Math.min(ULT_COST, p.ult + dt * 8);
      p._ht = (p._ht || 0) + dt;
      if (p._ht >= 0.1) { p._ht = 0; (p.hist = p.hist || []).push([this.now, p.pos[0], p.pos[1], p.pos[2]]); while (p.hist.length > 34) p.hist.shift(); }
      if (p.reloadT > 0) { p.reloadT -= dt; if (p.reloadT <= 0) { p.reloadT = 0; p.ammo = this.lmbOf(p).ammo || 0; p.pas?.reload?.(this, p); } }
      // hazards
      if (p.pos[1] < 0.35 && (this.phase === 'live' || this.phase === 'train')) {
        const hz = hazardAt(p.pos[0], p.pos[2]);
        if (hz === 'lava') { p._lava = (p._lava || 0) + dt; if (p._lava >= 0.25) { p._lava -= 0.25; this.damage(null, p, 12, {}); this.addSt(p, 'burn', 1.5, 6); } }
        else if (hz === 'water') this.addSt(p, 'slow', 0.3, 0.35);
      }
      if (p.form && this.now >= p.form.until) { p.form = null; p.fm = ''; this.ev({ t: 'fx', fx: 'formEnd', id: p.id, color: p.def.color }); if (p.ammo > (this.lmbOf(p).ammo || 0)) p.ammo = this.lmbOf(p).ammo || 0; }
      if (p.channel) this.stepChannel(p, dt);
      if (p.flurry) this.stepFlurry(p, dt);
      if (p.pas?.tick && p.alive) p.pas.tick(this, p, dt);
      if (p.pas?.res?.decay && p.alive) this.gain(p, -p.pas.res.decay * dt);
      if (p.tether) this.stepTether(p, dt);
      if (p.doom && this.now >= p.doom.at) {
        const D = p.doom; p.doom = null; const s2 = this.players.get(D.src);
        this.ev({ t: 'fx', fx: 'explode', pos: this.chest(p), r: 3, look: 'void' });
        if (s2) this.aoeAt(s2, p.pos, 3, D.dmg, { noLos: true }); else this.damage(null, p, D.dmg, {});
      }
      if (p.reso === 'nature' && p.hp < p.maxHp && (this.phase === 'live' || this.phase === 'train')) p.hp = Math.min(p.maxHp, p.hp + dt * 2);
      // DoTs
      if (p.st.poison || p.st.burn) {
        p._dot = (p._dot || 0) + dt;
        if (p._dot >= 0.5) {
          p._dot -= 0.5;
          const dps = (p.st.poison?.v || 0) + (p.st.burn?.v || 0);
          const src = p.lastHurtBy ? this.players.get(p.lastHurtBy) : null;
          this.damage(src, p, dps * 0.5, { dot: true, slot: 'dot' });
        }
      }
      // dummies: regen when idle
      if (p.isDummy && this.now - p.lastHurtAt > 3) p.hp = Math.min(p.maxHp, p.hp + dt * 120);

      // movement for host-simulated characters
      if (p.isBot || p.isDummy) {
        let inp = { fwd: 0, right: 0, jump: false, yaw: p.yaw };
        const brain = this.brains.get(p.id);
        if (brain && !frozen) inp = brain.think(dt);
        else if (brain && frozen) brain.lookAround(dt);
        if (p.isDummy && p.mover) { inp.right = Math.sin(this.now * 0.8) > 0 ? 1 : -1; }
        const mods = statusMods(p.st, p.glideUntil > this.now, frozen);
        moveCharacter(p, inp, dt, p.def.speed * (p.isDummy ? 0.5 : 1), mods);
      }
      // dash damage
      if (p.dashHit) {
        p.dashHit.t -= dt;
        const d = p.dashHit.def;
        if (d.dmg || d.knock || d.stun) {
          for (const o of this.enemiesOf(p)) {
            if (p.dashHit.hit.has(o.id)) continue;
            if (Math.hypot(o.pos[0] - p.pos[0], o.pos[2] - p.pos[2]) < (d.hitR || 1.3) && Math.abs(o.pos[1] - p.pos[1]) < 1.6) {
              p.dashHit.hit.add(o.id);
              this.damage(p, o, d.dmg || 0, { from: p.pos, onHit: d.stun ? { stun: [d.stun] } : (d.onHitSt || null) });
              if (d.knock) { const [fx, fz] = fwdFromYaw(p.yaw); this.impulse(o, [fx * d.knock, 4, fz * d.knock], true); }
              if (d.stun && !d.knock) { p.dashHit.t = 0; if (p.isBot) p.dashT = 0; }
            }
          }
        }
        if (d.trail) { const lp = p.dashHit.lp; if (!lp || Math.hypot(p.pos[0] - lp[0], p.pos[2] - lp[2]) > d.trail.r * 1.5) { p.dashHit.lp = [...p.pos]; this.spawnZone(p, d.trail, p.pos, p.yaw); } }
        if (p.dashHit.t <= 0) p.dashHit = null;
      }
      // leap landing
      if (p.leap && this.now - p.leap.t0 > 0.25 && p.onGround) {
        const L = p.leap.def.land;
        this.aoeAt(p, p.pos, L.r, L.dmg, { knockup: L.knockup, st: L.st });
        this.ev({ t: 'fx', fx: 'slam', pos: [...p.pos], r: L.r, color: p.def.color });
        if (L.zone) this.spawnZone(p, L.zone, p.pos, p.yaw);
        if (L.heal) for (const a of this.alliesOf(p)) if (Math.hypot(a.pos[0] - p.pos[0], a.pos[2] - p.pos[2]) <= L.r) this.heal(p, a, L.heal);
        p.leap = null;
      } else if (p.leap && this.now - p.leap.t0 > 4) p.leap = null;
      // fell out of world safety
      if (p.pos[1] < -5) { p.pos = [...SPAWNS[p.team][0]]; p.vel = [0, 0, 0]; this.ev({ t: 'tp', id: p.id, pos: [...p.pos], yaw: p.yaw }); }
    }

    this.stepProjectiles(dt);
    this.stepZones(dt);
  }

  stepProjectiles(dt) {
    const walls = this.zones.filter(z => z.def.blockProj);
    const keep = [];
    const domes = this.zones.filter(z => z.def.dome && z.t >= z.delay);
    this._pend = [];
    for (const pr of this.projs) {
      const def = pr.def;
      const prev = [...pr.pos];
      pr.t += dt;
      this._slot = pr.slot || 'proj';
      // homing: steer toward the nearest enemy in front
      if (def.homing && pr.t > 0.08) {
        const sp = Math.hypot(...pr.vel); const dir = pr.vel.map(x => x / sp);
        let best = null, bs = 0.5;
        for (const o of this.players.values()) {
          if (!o.alive || o.team === pr.team || o.st.invis || pr.hit.has(o.id)) continue;
          const c = this.chest(o); const v = [c[0] - pr.pos[0], c[1] - pr.pos[1], c[2] - pr.pos[2]]; const l = Math.hypot(...v);
          if (l > 25) continue; const dot = (v[0] * dir[0] + v[1] * dir[1] + v[2] * dir[2]) / l;
          if (dot > bs) { bs = dot; best = v.map(x => x / l); }
        }
        if (best) { const k = Math.min(1, def.homing * dt); const nd = dir.map((x, i) => x + (best[i] - x) * k); const nl = Math.hypot(...nd); pr.vel = nd.map(x => x / nl * sp); }
      }
      if (def.boomerang) {
        const own = this.players.get(pr.owner);
        if (!pr.ret && pr.t >= def.life * 0.5) { pr.ret = true; pr.hit.clear(); }
        if (pr.ret && own) { const c = this.chest(own); const v = [c[0] - pr.pos[0], c[1] - pr.pos[1], c[2] - pr.pos[2]]; const l = Math.hypot(...v); if (l < 1.2) { continue; } pr.vel = v.map(x => x / l * pr.speed * 1.15); }
        if (pr.ret && !own) continue;
      }
      if (def.pullAround) for (const o of this.players.values()) { if (!o.alive || o.team === pr.team) continue; const dx = pr.pos[0] - o.pos[0], dz = pr.pos[2] - o.pos[2], l = Math.hypot(dx, dz); if (l < def.pullAround && l > 0.4) { o.vel[0] += dx / l * 26 * dt; o.vel[2] += dz / l * 26 * dt; } }
      pr.vel[1] -= GRAVITY * (def.grav || 0) * dt;
      pr.pos[0] += pr.vel[0] * dt; pr.pos[1] += pr.vel[1] * dt; pr.pos[2] += pr.vel[2] * dt;
      pr.life -= dt;
      let dead = false;
      const seg = [pr.pos[0] - prev[0], pr.pos[1] - prev[1], pr.pos[2] - prev[2]];
      const len = Math.hypot(...seg);
      // rune walls block enemy projectiles
      for (const w of walls) {
        if (w.team === pr.team) continue;
        if (this.inWall(w, pr.pos, 0.2) && pr.pos[1] < w.pos[1] + (w.def.h || 3)) { dead = true; this.ev({ t: 'fx', fx: 'spark', pos: [...pr.pos], color: '#4fc3f7' }); break; }
      }
      // domes stop enemy projectiles entering them
      for (const z of domes) {
        if (z.team === pr.team) continue;
        const a = Math.hypot(prev[0] - z.pos[0], prev[2] - z.pos[2]), b = Math.hypot(pr.pos[0] - z.pos[0], pr.pos[2] - z.pos[2]);
        if (a > z.r && b <= z.r && pr.pos[1] < z.pos[1] + z.r * 0.7) { dead = true; this.ev({ t: 'fx', fx: 'spark', pos: [...pr.pos], color: '#ffe08a' }); break; }
      }
      // players
      let reflected = false;
      if (!dead) {
        const steps = Math.max(1, Math.ceil(len / 0.3));
        outer: for (let s = 1; s <= steps; s++) {
          const pt = [prev[0] + seg[0] * s / steps, prev[1] + seg[1] * s / steps, prev[2] + seg[2] * s / steps];
          for (const o of this.players.values()) {
            if (!o.alive || o.id === pr.owner || pr.hit.has(o.id)) continue;
            const h = P_HEIGHT * (o.st.giant ? 1.4 : 1);
            const y = clamp(pt[1], o.pos[1] + 0.35, o.pos[1] + h - 0.35);
            const d = Math.hypot(pt[0] - o.pos[0], pt[1] - y, pt[2] - o.pos[2]);
            if (d > def.r + 0.45 * (o.st.giant ? 1.4 : 1)) continue;
            const src = this.players.get(pr.owner);
            if (o.team !== pr.team && o.st.reflect && !def.noReflect) {
              pr.owner = o.id; pr.team = o.team; pr.vel = pr.vel.map(x => -x * 1.15); pr.hit = new Set([o.id]); pr.life = Math.max(pr.life, 1); pr.pos = [...pt];
              this.ev({ t: 'fx', fx: 'reflect', pos: [...pt], color: o.def.color });
              reflected = true; break outer;
            }
            if (o.team !== pr.team) {
              pr.hit.add(o.id);
              this.damage(src, o, pr.dmg, { from: prev, steal: def.steal, onHit: def.onHit, execute: def.execute, mark: def.mark, slot: pr.slot });
              if (def.pullTo && src) { const dx = src.pos[0] - o.pos[0], dz = src.pos[2] - o.pos[2], l = Math.hypot(dx, dz) || 1; const k = Math.min(def.pullTo, Math.max(0, l - 2)) * 2.4; this.impulse(o, [dx / l * k, 5, dz / l * k], true); this.ev({ t: 'fx', fx: 'chain', from: this.chest(src), to: this.chest(o) }); }
              if (def.ricochet && (pr.ric ?? def.ricochet) > 0) {
                let best = null, bd = 9;
                for (const q of this.players.values()) { if (!q.alive || q.team === pr.team || pr.hit.has(q.id)) continue; const d = Math.hypot(q.pos[0] - o.pos[0], q.pos[2] - o.pos[2]); if (d < bd && losClear(pt, this.chest(q))) { bd = d; best = q; } }
                if (best) { pr.ric = (pr.ric ?? def.ricochet) - 1; const c = this.chest(best); const v = [c[0] - pt[0], c[1] - pt[1], c[2] - pt[2]]; const l = Math.hypot(...v); pr.vel = v.map(x => x / l * pr.speed); pr.pos = [...pt]; pr.life = Math.max(pr.life, l / pr.speed + 0.2); pr.dmg *= 0.85; this.ev({ t: 'fx', fx: 'impact', pos: [...pt], look: def.look }); break outer; }
              }
              if (def.split) this.splitProj(pr, pt);
              if (def.hook && src) {
                const dx = src.pos[0] - o.pos[0], dz = src.pos[2] - o.pos[2];
                const l = Math.hypot(dx, dz) || 1;
                const pull = Math.min(def.hook, Math.max(0, l - 2)) * 2.4;
                this.impulse(o, [dx / l * pull, 5, dz / l * pull], true);
                this.ev({ t: 'fx', fx: 'chain', from: this.chest(src), to: this.chest(o) });
              }
              if (def.healNearest && src) {
                let best = null, bf = 1;
                for (const a of this.alliesOf(src)) { const f = a.hp / a.maxHp; if (f < bf && Math.hypot(a.pos[0] - o.pos[0], a.pos[2] - o.pos[2]) < def.healNearest.r + 6) { bf = f; best = a; } }
                if (best) { this.heal(src, best, def.healNearest.amt); this.ev({ t: 'fx', fx: 'wisp', from: [...pt], to: this.chest(best), color: src.def.color }); }
              }
              if (def.splash) this.explode(pr, pt, o);
              if (!def.pierce) { dead = true; pr.endAt = [...pt]; break outer; }
            } else if (def.healAlly) {
              pr.hit.add(o.id);
              this.heal(src, o, def.healAlly);
              if (def.allySt) this.applySt(o, def.allySt);
              dead = true; break outer;
            }
          }
        }
      }
      // world
      if (!dead && !reflected && !def.wallPierce && !(def.boomerang && pr.ret) && len > 0) {
        const d = [seg[0] / len, seg[1] / len, seg[2] / len];
        const t = raycast(prev, d, len);
        if (t < len) {
          const hp = [prev[0] + d[0] * t, prev[1] + d[1] * t, prev[2] + d[2] * t];
          if (pr.bounces > 0) {
            pr.bounces--;
            pr.pos = [hp[0] - d[0] * 0.08, Math.max(0.1, hp[1] - d[1] * 0.08), hp[2] - d[2] * 0.08];
            if (hp[1] < 0.15 || d[1] < -0.6) { pr.vel[1] = Math.abs(pr.vel[1]) * 0.65; pr.vel[0] *= 0.85; pr.vel[2] *= 0.85; }
            else { pr.vel[0] *= -0.6; pr.vel[2] *= -0.6; }
            this.ev({ t: 'fx', fx: 'impact', pos: hp, look: def.look });
          } else if (def.boomerang) { if (!pr.ret) { pr.ret = true; pr.hit.clear(); } }
          else {
            if (def.splash) this.explode(pr, hp, null);
            else this.ev({ t: 'fx', fx: 'impact', pos: hp, look: def.look });
            dead = true; pr.endAt = hp;
          }
        }
      }
      if (!dead && pr.life <= 0 && def.split && !def.splitOnHitOnly) this.splitProj(pr, pr.pos);
      if (!dead && pr.life <= 0) { if (def.splash && (def.grav || def.bounce)) this.explode(pr, pr.pos, null); dead = true; }
      if (dead && def.warp) { const own = this.players.get(pr.owner); if (own && own.alive) { const e = pr.endAt || pr.pos; const v = pr.vel, l = Math.hypot(v[0], v[2]) || 1; const to = [e[0] - v[0] / l * 0.9, 0, e[2] - v[2] / l * 0.9]; to[1] = groundUnder(to[0], to[2], e[1] + 0.5); const from = [...own.pos]; this.teleport(own, to, own.yaw); this.ev({ t: 'fx', fx: 'warp', from: [from[0], from[1] + 1, from[2]], to: [to[0], to[1] + 1, to[2]], color: own.def.color }); } }
      if (!dead && Math.abs(pr.pos[0]) > 60) dead = true;
      if (!dead) keep.push(pr);
    }
    this.projs = keep.concat(this._pend); this._pend = null; this._slot = null;
  }

  explode(pr, pt, direct) {
    const src = this.players.get(pr.owner);
    const s = pr.def.splash;
    for (const o of this.players.values()) {
      if (!o.alive || o.team === pr.team || o === direct) continue;
      const c = this.chest(o);
      if (Math.hypot(c[0] - pt[0], c[1] - pt[1], c[2] - pt[2]) <= s.r + 0.4 && losClear([pt[0], pt[1] + 0.2, pt[2]], c)) {
        this.damage(src, o, s.dmg, { from: pt, onHit: s.st || pr.def.onHit });
      }
    }
    if (s.heal && src) for (const o of this.players.values()) if (o.alive && o.team === pr.team && Math.hypot(o.pos[0] - pt[0], o.pos[2] - pt[2]) <= s.r) this.heal(src, o, s.heal);
    this.ev({ t: 'fx', fx: 'explode', pos: [...pt], r: s.r, look: pr.def.look });
  }

  inWall(z, pt, pad = 0) {
    const w = z.def.wall;
    const dx = pt[0] - z.pos[0], dz = pt[2] - z.pos[2];
    const c = Math.cos(z.yaw), s = Math.sin(z.yaw);
    const lx = dx * c - dz * s; // local x along wall width
    const lz = dx * s + dz * c;
    return Math.abs(lx) <= w.w / 2 + pad && Math.abs(lz) <= w.d / 2 + pad;
  }

  inZone(z, o) {
    if (z.def.wall) return this.inWall(z, o.pos, 0.45) && o.pos[1] < z.pos[1] + (z.def.h || 3);
    const d = Math.hypot(o.pos[0] - z.pos[0], o.pos[2] - z.pos[2]);
    return d <= z.r + 0.3 && o.pos[1] < z.pos[1] + Math.max(4, z.r) && o.pos[1] > z.pos[1] - 3;
  }

  stepZones(dt) {
    const keep = [];
    for (const z of this.zones) {
      z.t += dt;
      const def = z.def;
      const src = this.players.get(z.owner);
      if (def.follow && src && src.alive) z.pos = [...src.pos];
      if (def.follow && (!src || !src.alive)) continue;
      this._slot = z.slot || 'zone';
      if (def.chase && z.t >= z.delay) {
        let best = null, bd = def.chaseR || 18;
        for (const o of this.players.values()) { if (!o.alive || o.team === z.team || o.st.invis) continue; const d = Math.hypot(o.pos[0] - z.pos[0], o.pos[2] - z.pos[2]); if (d < bd) { bd = d; best = o; } }
        const goal = best ? best.pos : (src && src.alive ? src.pos : null);
        if (goal) { const dx = goal[0] - z.pos[0], dz = goal[2] - z.pos[2], l = Math.hypot(dx, dz); if (l > (best ? 0.6 : 3)) { const st = Math.min(l, def.chase * dt); const nx = z.pos[0] + dx / l * st, nz = z.pos[2] + dz / l * st; z.pos = [nx, groundUnder(nx, nz, z.pos[1] + 1), nz]; z.yaw = Math.atan2(-dx, -dz); } }
      }
      if (z.trap) {
        if (z.t > z.delay) {
          let fired = false;
          for (const o of this.players.values()) {
            if (!o.alive || o.team === z.team) continue;
            if (Math.hypot(o.pos[0] - z.pos[0], o.pos[2] - z.pos[2]) < z.r && o.pos[1] - z.pos[1] < 1.2) {
              this.damage(src, o, def.dmg, { onHit: def.st });
              fired = true;
            }
          }
          if (fired) { this.ev({ t: 'fx', fx: z.look === 'mine' ? 'explode' : 'trapSnap', pos: [...z.pos], r: z.r + 1, look: z.look === 'mine' ? 'grenade' : 'trap' }); if (src) src.traps = src.traps.filter(i => i !== z.id); continue; }
        }
        if (z.t < z.dur) keep.push(z);
        continue;
      }
      if (z.t < z.delay) {
        if (def.pullDuringDelay) this.pullTick(z, def.pullDuringDelay, dt);
        keep.push(z); continue;
      }
      if (z.delay > 0 && !z.fired) {
        z.fired = true;
        if (def.burst) {
          this.aoeAt(src || { team: z.team, st: {}, stats: { dmg: 0 }, ult: 0, id: -1, def: {} }, z.pos, z.r, def.burst.dmg, { knockup: def.burst.knockup, st: def.burst.st, noLos: true, execute: def.burst.execute });
          this.ev({ t: 'fx', fx: 'burstZone', look: def.look, pos: [...z.pos], r: z.r });
        }
      }
      const active = z.t - z.delay;
      // ticks
      z.acc += dt;
      while (z.acc >= 0.25) {
        z.acc -= 0.25;
        for (const o of this.players.values()) {
          if (!o.alive || !this.inZone(z, o)) continue;
          if (o.team !== z.team) {
            if (def.dps) {
              const d = this.damage(src, o, def.dps * 0.25, { from: z.pos });
              if (def.stealAll && src && src.alive) this.heal(src, src, d * def.stealAll, true);
            }
            if (def.st) this.applySt(o, def.st);
          } else {
            if (def.hps) this.heal(src, o, def.hps * 0.25, true);
            if (def.allySt) this.applySt(o, def.allySt);
          }
        }
        if (def.pull) this.pullTick(z, def.pull, 0.25);
      }
      if (def.turret && src) {
        z.tacc = (z.tacc || 0) + dt;
        const T = def.turret;
        if (z.tacc >= T.every) {
          const mz = [z.pos[0], z.pos[1] + (T.h || 1.3), z.pos[2]];
          let best = null, bd = T.range;
          for (const o of this.players.values()) {
            if (!o.alive || o.team === z.team || o.st.invis) continue;
            const c = this.chest(o); const d = Math.hypot(c[0] - mz[0], c[1] - mz[1], c[2] - mz[2]);
            if (d < bd && losClear(mz, c)) { bd = d; best = o; }
          }
          if (best) {
            z.tacc = 0;
            const c = this.chest(best); const v = [c[0] - mz[0], c[1] - mz[1], c[2] - mz[2]]; const l = Math.hypot(...v);
            z.yaw = Math.atan2(-v[0], -v[2]);
            this.spawnProj(src, T, mz, v.map(x => x / l));
            this.ev({ t: 'fx', fx: 'turretShot', pos: mz, dir: v.map(x => x / l), look: T.look });
          }
        }
      }
      if (def.strikes) {
        z.sacc += dt;
        while (z.sacc >= def.strikes.every) {
          z.sacc -= def.strikes.every;
          // bias strikes toward enemies inside
          const inside = [...this.players.values()].filter(o => o.alive && o.team !== z.team && this.inZone(z, o));
          let pt;
          if (inside.length && Math.random() < 0.55) { const o = inside[(Math.random() * inside.length) | 0]; pt = [o.pos[0] + (Math.random() - 0.5) * 2, z.pos[1], o.pos[2] + (Math.random() - 0.5) * 2]; }
          else { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * z.r; pt = [z.pos[0] + Math.cos(a) * r, z.pos[1], z.pos[2] + Math.sin(a) * r]; }
          pt[1] = groundUnder(pt[0], pt[2], z.pos[1] + 2);
          this.ev({ t: 'fx', fx: 'strike', look: def.look, pos: pt });
          for (const o of this.players.values()) {
            if (!o.alive) continue;
            if (Math.hypot(o.pos[0] - pt[0], o.pos[2] - pt[2]) > def.strikes.r) continue;
            if (o.team !== z.team) this.damage(src, o, def.strikes.dmg, { from: pt });
            else if (def.strikes.heal) this.heal(src, o, def.strikes.heal);
          }
        }
      }
      if (active < z.dur) keep.push(z);
    }
    this._slot = null;
    this.zones = keep;
  }

  pullTick(z, strength, dt) {
    for (const o of this.players.values()) {
      if (!o.alive || o.team === z.team) continue;
      const dx = z.pos[0] - o.pos[0], dz = z.pos[2] - o.pos[2];
      const d = Math.hypot(dx, dz);
      if (d > z.r * 1.3 || d < 0.6) continue;
      const k = strength * dt * 4;
      this.impulse(o, [dx / d * k, 0, dz / d * k]);
    }
  }

  // ---------- network snapshot ----------
  snapshot() {
    const r2 = (v) => Math.round(v * 100) / 100;
    const ps = [];
    for (const p of this.players.values()) {
      const st = {};
      for (const k in p.st) st[k] = [r2(p.st[k].t), r2(p.st[k].v || 0)];
      ps.push([p.id, r2(p.pos[0]), r2(p.pos[1]), r2(p.pos[2]), r2(p.yaw), r2(p.pitch), Math.ceil(p.hp), p.alive ? 1 : 0,
        Math.floor(p.ult), Math.ceil(p.shield), st, r2(p.cds.lmb), r2(p.cds.q), r2(p.cds.e), r2(p.vel[0]), r2(p.vel[2]), p.onGround ? 1 : 0,
        p.stats.k, p.stats.d, Math.round(p.stats.dmg), Math.round(p.stats.heal), p.maxHp, p.ammo, r2(p.reloadT), Math.round(p.rs || 0), p.fm || '', p.sn || '', p.channel ? 1 : 0]);
    }
    return {
      t: 's', tm: r2(this.now), ph: this.phase, pt: r2(this.phaseT), rd: this.round, sc: this.score,
      p: ps,
      pr: this.projs.map(pr => [pr.id, pr.look, r2(pr.pos[0]), r2(pr.pos[1]), r2(pr.pos[2]), pr.team, r2(pr.vel[0]), r2(pr.vel[1]), r2(pr.vel[2])]),
      z: this.zones.map(z => [z.id, z.look, r2(z.pos[0]), r2(z.pos[1]), r2(z.pos[2]), z.r, r2(z.yaw), r2(z.t), z.delay, z.dur, z.team, z.def.wall ? z.def.wall.w : 0, z.def.wall ? z.def.wall.d : 0, z.def.h || 0]),
    };
  }
}
