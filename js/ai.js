import { COLLIDERS, HALF_X, HALF_Z, MAP, hazardAt, pitAt } from './map.js';
import { losClear, raycast, groundUnder, yawTo, angDiff, clamp, GRAVITY, EYE, P_RADIUS, rayPlayer } from './physics.js';

// ---------- navigation graph ----------
let NAV = null, NAV_ID = null;
function blockedAt(x, z, y) {
  for (const b of COLLIDERS) {
    if (b.max[1] <= y + 0.6) continue; // walkable top or below
    if (b.min[1] > y + 1.7) continue;
    if (x > b.min[0] - 0.6 && x < b.max[0] + 0.6 && z > b.min[2] - 0.6 && z < b.max[2] + 0.6) return true;
  }
  return false;
}
function buildNav() {
  const nodes = [];
  const S = 2.0;
  for (let x = -HALF_X + 1.5; x <= HALF_X - 1.5; x += S) {
    for (let z = -HALF_Z + 1.5; z <= HALF_Z - 1.5; z += S) {
      const y = groundUnder(x, z, 3.0, 0.3);
      if (blockedAt(x, z, y)) continue;
      if (y < 0.3 && pitAt(x, z)) continue;
      nodes.push({ x, y, z, n: [] });
    }
  }
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const b = nodes[j];
      const d = Math.hypot(a.x - b.x, a.z - b.z);
      if (d > S * 1.5) continue;
      // walkability: sample heights, allow climbing up to 0.55 per sample, or 1.3 with a jump
      let ok = true, jump = false, prevY = a.y;
      const n = Math.ceil(d / 0.35);
      for (let k = 1; k <= n; k++) {
        const x = a.x + (b.x - a.x) * k / n, z = a.z + (b.z - a.z) * k / n;
        const y = groundUnder(x, z, prevY + 1.35, 0.25);
        if (blockedAt(x, z, y) || (y < 0.3 && pitAt(x, z))) { ok = false; break; }
        if (y - prevY > 0.56) { if (y - prevY <= 1.3) jump = true; else { ok = false; break; } }
        prevY = y;
      }
      if (ok && Math.abs(prevY - b.y) < 0.2) a.n.push({ j, d, jump });
    }
  }
  NAV = nodes; NAV_ID = MAP.cur?.id;
}
function nearestNode(pos) {
  let best = -1, bd = 1e9;
  for (let i = 0; i < NAV.length; i++) {
    const n = NAV[i];
    const d = Math.hypot(n.x - pos[0], n.z - pos[2]) + Math.abs(n.y - pos[1]) * 3;
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}
function findPath(from, to) {
  const s = nearestNode(from), g = nearestNode(to);
  if (s < 0 || g < 0) return [];
  const open = new Set([s]);
  const gS = new Map([[s, 0]]);
  const fS = new Map([[s, 0]]);
  const came = new Map();
  const H = (i) => Math.hypot(NAV[i].x - NAV[g].x, NAV[i].z - NAV[g].z);
  let iter = 0;
  while (open.size && iter++ < 3000) {
    let cur = -1, cf = 1e9;
    for (const i of open) { const f = fS.get(i); if (f < cf) { cf = f; cur = i; } }
    if (cur === g) break;
    open.delete(cur);
    for (const e of NAV[cur].n) {
      const t = gS.get(cur) + e.d + (e.jump ? 1.5 : 0);
      if (t < (gS.get(e.j) ?? 1e9)) { came.set(e.j, cur); gS.set(e.j, t); fS.set(e.j, t + H(e.j)); open.add(e.j); }
    }
  }
  const path = [];
  let c = g;
  if (!came.has(g) && g !== s) return [];
  while (c !== undefined && c !== s) { path.unshift(NAV[c]); c = came.get(c); }
  return path;
}

const DIFF = [
  { aimErr: 0.11, turn: 3.5, react: 0.55, abil: 0.35 },
  { aimErr: 0.055, turn: 6, react: 0.32, abil: 0.7 },
  { aimErr: 0.025, turn: 10, react: 0.16, abil: 1 },
];

export class BotBrain {
  constructor(sim, p, difficulty = 1) {
    if (!NAV || NAV_ID !== MAP.cur?.id) buildNav();
    this.sim = sim; this.p = p;
    this.d = DIFF[clamp(difficulty, 0, 2)];
    this.target = null; this.seeT = 0; this.scanT = 0;
    this.path = []; this.pathT = 0; this.strafe = Math.random() < 0.5 ? 1 : -1; this.strafeT = 0;
    this.charge = 0; this.charging = false;
    this.abilT = 0; this.stuckT = 0; this.lastPos = [...p.pos];
    this.lastSeen = null; this.jitter = [0, 0]; this.jitterT = 0;
  }

  lookAround(dt) { this.p.pitch *= 0.9; }

  visible(o) {
    const sim = this.sim, p = this.p;
    if (!o.alive) return false;
    const d = Math.hypot(o.pos[0] - p.pos[0], o.pos[2] - p.pos[2]);
    if (o.st.invis && d > 4) return false;
    if (d > 60) return false;
    return losClear(sim.eye(p), sim.chest(o)) || losClear(sim.eye(p), [o.pos[0], o.pos[1] + 1.7, o.pos[2]]);
  }

  pickTarget() {
    const p = this.p;
    let best = null, bs = 1e9;
    for (const o of this.sim.enemiesOf(p)) {
      if (o.isDummy && !p.isDummy && this.sim.mode === 'training') continue;
      if (!this.visible(o)) continue;
      const d = Math.hypot(o.pos[0] - p.pos[0], o.pos[2] - p.pos[2]);
      const s = d * (0.55 + 0.6 * o.hp / o.maxHp) - (o === this.target ? 4 : 0);
      if (s < bs) { bs = s; best = o; }
    }
    if (best && best !== this.target) this.seeT = 0;
    this.target = best;
    if (best) this.lastSeen = [...best.pos];
  }

  aimAt(o, def) {
    const p = this.p, sim = this.sim;
    const eye = sim.eye(p);
    let tp = sim.chest(o);
    if (def && def.kind === 'proj') {
      const speed = def.charge ? (def.charge.spdMin + def.charge.spdMax) / 2 : def.speed;
      const dist = Math.hypot(tp[0] - eye[0], tp[1] - eye[1], tp[2] - eye[2]);
      const t = dist / speed;
      tp = [tp[0] + o.vel[0] * t * 0.85, tp[1], tp[2] + o.vel[2] * t * 0.85];
      if (def.grav) tp[1] += 0.5 * GRAVITY * def.grav * t * t;
    }
    if (def && (def.kind === 'zone' && def.at === 'aim')) tp = [o.pos[0] + o.vel[0] * 0.5, o.pos[1], o.pos[2] + o.vel[2] * 0.5];
    const dx = tp[0] - eye[0], dy = tp[1] - eye[1], dz = tp[2] - eye[2];
    return { yaw: yawTo(dx, dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) };
  }

  turnTo(yaw, pitch, dt) {
    const p = this.p;
    const k = Math.min(1, this.d.turn * dt);
    p.yaw += angDiff(p.yaw, yaw + this.jitter[0]) * k;
    p.pitch += ((pitch + this.jitter[1]) - p.pitch) * k;
    p.pitch = clamp(p.pitch, -1.4, 1.4);
  }

  cast(slot, aim, charge = 0) {
    return this.sim.cast(this.p.id, slot, { yaw: aim.yaw, pitch: aim.pitch, charge }, false);
  }

  ready(slot) {
    const p = this.p;
    if (slot === 'x') return p.ult >= 100;
    return p.cds[slot] <= 0;
  }

  // decide whether ability fits the situation
  wantAbility(slot, def, tgt, dist) {
    const p = this.p, ai = def.ai || {};
    const hpf = p.hp / p.maxHp;
    switch (ai.use) {
      case 'gap': return tgt && dist >= (ai.min || 0) && dist <= (ai.max || 99);
      case 'escape': return tgt && ((dist < (ai.min || 5) && p.def.ai.style !== 'melee') || hpf < 0.35);
      case 'aim': return tgt && dist >= (ai.min || 0) && dist <= (ai.max || 30);
      case 'engage': return tgt && dist <= (ai.max || 15);
      case 'self': return tgt && dist <= (ai.max || 5);
      case 'defend': return tgt && hpf < 0.85 && dist < 16;
      case 'lowhp': return tgt && hpf < (ai.hp || 0.35);
      case 'heal': {
        const r = ai.r || 10;
        return this.sim.alliesOf(p).some(o => o.hp / o.maxHp < 0.7 && Math.hypot(o.pos[0] - p.pos[0], o.pos[2] - p.pos[2]) < r);
      }
      case 'revive': {
        const deadAlly = [...this.sim.players.values()].some(o => !o.alive && o.team === p.team && !o.isDummy);
        const hurt = this.sim.alliesOf(p).filter(o => o.hp / o.maxHp < 0.45).length;
        return deadAlly || hurt >= 2;
      }
      case 'save': {
        const r = ai.r || 10;
        const hurt = this.sim.alliesOf(p).filter(o => o.hp / o.maxHp < 0.5 && Math.hypot(o.pos[0] - p.pos[0], o.pos[2] - p.pos[2]) < r);
        return hurt.length >= 1 && tgt && dist < 18;
      }
    }
    return false;
  }

  think(dt) {
    const p = this.p, sim = this.sim;
    const inp = { fwd: 0, right: 0, jump: false, yaw: p.yaw };
    if (!p.alive) return inp;
    this.scanT -= dt;
    if (this.scanT <= 0) { this.scanT = 0.25; this.pickTarget(); }
    this.jitterT -= dt;
    if (this.jitterT <= 0) { this.jitterT = 0.4 + Math.random() * 0.4; this.jitter = [(Math.random() - 0.5) * 2 * this.d.aimErr, (Math.random() - 0.5) * 2 * this.d.aimErr * 0.6]; }

    const tgt = this.target && this.target.alive ? this.target : null;
    const hdef = p.def;
    const lmb = this.sim.lmbOf ? this.sim.lmbOf(p) : hdef.abilities.lmb;
    let moveGoal = null;
    let dist = 99;

    if (tgt) {
      this.seeT += dt;
      dist = Math.hypot(tgt.pos[0] - p.pos[0], tgt.pos[2] - p.pos[2]);
      const aim = this.aimAt(tgt, lmb);
      this.turnTo(aim.yaw, aim.pitch, dt);
      const err = Math.abs(angDiff(p.yaw, aim.yaw)) + Math.abs(p.pitch - aim.pitch) * 0.5;
      const reacted = this.seeT > this.d.react;

      // movement relative to preferred range
      const want = hdef.ai.range;
      let support = hdef.ai.style === 'support';
      const lowHp = p.hp / p.maxHp < 0.3;
      const toT = yawTo(tgt.pos[0] - p.pos[0], tgt.pos[2] - p.pos[2]);
      const rel = angDiff(p.yaw, toT);
      let fwd = 0;
      if (hdef.ai.style === 'melee') fwd = dist > want - 0.4 ? 1 : (dist < 1.2 ? -0.5 : 0);
      else if (dist > want + 1.5) fwd = 1; else if (dist < want - 3) fwd = -1;
      if (lowHp && hdef.ai.style !== 'melee') fwd = -1;
      // convert desire toward target into input frame (we face roughly toward target)
      inp.fwd = fwd * Math.cos(rel);
      inp.right = -fwd * Math.sin(rel);
      this.strafeT -= dt;
      if (this.strafeT <= 0) { this.strafeT = 0.6 + Math.random() * 1.2; this.strafe = Math.random() < 0.5 ? 1 : -1; if (Math.random() < 0.15) inp.jump = true; }
      const strafeAmt = hdef.ai.style === 'melee' ? (dist < 4 ? 0.6 : 0.25) : 0.9;
      inp.right += this.strafe * strafeAmt;
      if (support) {
        // stay near allies
        const allies = sim.alliesOf(p).filter(o => o !== p);
        if (allies.length) {
          const a = allies.reduce((m, o) => (Math.hypot(o.pos[0] - p.pos[0], o.pos[2] - p.pos[2]) < Math.hypot(m.pos[0] - p.pos[0], m.pos[2] - p.pos[2]) ? o : m));
          if (Math.hypot(a.pos[0] - p.pos[0], a.pos[2] - p.pos[2]) > 8) moveGoal = a.pos;
        }
      }
      if (!losClear(sim.eye(p), sim.chest(tgt))) moveGoal = tgt.pos;

      // basic attack
      if (reacted) {
        if (lmb.kind === 'melee') {
          if (dist < lmb.range + 0.6 && err < 0.5 && this.ready('lmb')) this.cast('lmb', aim);
        } else if (lmb.charge) {
          if (!this.charging && this.ready('lmb') && dist < 45) { this.charging = true; this.charge = 0; this.chargeGoal = 0.45 + Math.random() * 0.55; }
          if (this.charging) {
            this.charge += dt / lmb.charge.time;
            if (this.charge >= this.chargeGoal && err < 0.12) { this.cast('lmb', aim, Math.min(1, this.charge)); this.charging = false; }
          }
        } else if (lmb.kind === 'beam') {
          if (dist < lmb.range && err < 0.1 && this.ready('lmb')) this.cast('lmb', aim);
        } else {
          if (dist < 40 && err < 0.12 && this.ready('lmb')) this.cast('lmb', aim);
        }
      }
      // abilities
      this.abilT -= dt;
      if (reacted && this.abilT <= 0) {
        this.abilT = 0.25;
        if (Math.random() < this.d.abil) {
          for (const slot of ['x', 'q', 'e']) {
            const def = hdef.abilities[slot];
            if (!this.ready(slot)) continue;
            if (!this.wantAbility(slot, def, tgt, dist)) continue;
            let a = this.aimAt(tgt, def);
            if ((def.kind === 'launch') || (def.ai?.use === 'escape' && (def.kind === 'blink' || def.kind === 'dash' || def.kind === 'leap' || def.kind === 'glide' || def.kind === 'grapple'))) {
              // escape: face away (launch already goes backward)
              if (def.kind !== 'launch') a = { yaw: a.yaw + Math.PI + (Math.random() - 0.5), pitch: 0.15 };
              else a = { yaw: a.yaw, pitch: 0 };
            }
            if (def.kind === 'grapple') a.pitch = 0.35;
            if (this.cast(slot, a)) { this.abilT = 0.6; break; }
          }
        }
      }
    } else {
      this.charging = false;
      this.seeT = 0;
      { const L = this.sim.lmbOf(p); if (L.ammo && p.ammo < L.ammo) this.sim.reload(p.id); }
      // heal/support usage without target
      if (hdef.abilities.e.ai?.use === 'heal' && this.ready('e') && this.wantAbility('e', hdef.abilities.e, null, 0)) this.cast('e', { yaw: p.yaw, pitch: -0.3 });
      // hunt: last seen, else nearest enemy (bots get a rough sense of the fight)
      let goal = this.lastSeen;
      if (goal && Math.hypot(goal[0] - p.pos[0], goal[2] - p.pos[2]) < 2) { this.lastSeen = null; goal = null; }
      if (!goal) {
        const en = sim.enemiesOf(p).filter(o => !(o.isDummy && sim.mode === 'training'));
        if (en.length) {
          const o = en.reduce((m, o) => (Math.hypot(o.pos[0] - p.pos[0], o.pos[2] - p.pos[2]) < Math.hypot(m.pos[0] - p.pos[0], m.pos[2] - p.pos[2]) ? o : m));
          goal = o.pos;
        }
      }
      moveGoal = goal;
    }

    if (moveGoal) {
      this.pathT -= dt;
      if (this.pathT <= 0 || !this.path.length) { this.pathT = 0.8; this.path = findPath(p.pos, moveGoal); }
      while (this.path.length && Math.hypot(this.path[0].x - p.pos[0], this.path[0].z - p.pos[2]) < 1.1) this.path.shift();
      const nx = this.path.length ? this.path[0] : { x: moveGoal[0], y: moveGoal[1], z: moveGoal[2] };
      const wy = yawTo(nx.x - p.pos[0], nx.z - p.pos[2]);
      if (!tgt) this.turnTo(wy, -0.05, dt);
      const rel = angDiff(p.yaw, wy);
      inp.fwd = Math.cos(rel); inp.right = -Math.sin(rel);
      if (tgt) inp.right += this.strafe * 0.3;
      if (nx.y - p.pos[1] > 0.5 && Math.hypot(nx.x - p.pos[0], nx.z - p.pos[2]) < 2.2) inp.jump = true;
    }

    // never walk (or strafe) into lava or a chasm
    if (p.pos[1] < 0.6 && (inp.fwd || inp.right)) {
      const fy = p.yaw, fx = -Math.sin(fy), fz = -Math.cos(fy), rx = Math.cos(fy), rz = -Math.sin(fy);
      const ahead = (f, r) => { const dx = fx * f + rx * r, dz = fz * f + rz * r, l = Math.hypot(dx, dz) || 1; return pitAt(p.pos[0] + dx / l * 1.3, p.pos[2] + dz / l * 1.3); };
      if (ahead(inp.fwd, inp.right)) {
        if (!ahead(inp.fwd, 0)) inp.right = 0;
        else if (!ahead(0, inp.right)) inp.fwd = 0;
        else { inp.fwd = -inp.fwd * 0.5; inp.right = -inp.right * 0.5; this.path = []; }
      }
    }

    // stuck detection
    this.stuckT += dt;
    if (this.stuckT > 0.8) {
      const moved = Math.hypot(p.pos[0] - this.lastPos[0], p.pos[2] - this.lastPos[2]);
      if (moved < 0.4 && (Math.abs(inp.fwd) + Math.abs(inp.right)) > 0.5) { inp.jump = true; this.strafe *= -1; this.path = []; }
      this.lastPos = [...p.pos]; this.stuckT = 0;
    }
    inp.yaw = p.yaw;
    return inp;
  }
}
