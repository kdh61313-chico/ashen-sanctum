import { COLLIDERS } from './map.js';

export const GRAVITY = 24;
export const JUMP_V = 8.6;
export const P_RADIUS = 0.45;
export const P_HEIGHT = 1.8;
export const EYE = 1.6;
export const STEP = 0.55;

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export function fwdFromYaw(yaw) { return [-Math.sin(yaw), -Math.cos(yaw)]; }
export function dirFromAngles(yaw, pitch) {
  const cp = Math.cos(pitch);
  return [-Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp];
}
export function yawTo(dx, dz) { return Math.atan2(-dx, -dz); }
export function angDiff(a, b) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }

// Extra dynamic colliders (e.g. rune walls) only block projectiles; kept in sim.

function circleRect(px, pz, r, b) {
  const cx = clamp(px, b.min[0], b.max[0]);
  const cz = clamp(pz, b.min[2], b.max[2]);
  const dx = px - cx, dz = pz - cz;
  const d2 = dx * dx + dz * dz;
  return { hit: d2 < r * r, dx, dz, d2, cx, cz };
}

// Ground height under a circle at height y (highest box top <= y + STEP)
export function groundUnder(x, z, y, r = P_RADIUS * 0.7) {
  let g = 0;
  for (const b of COLLIDERS) {
    if (b.max[1] > y + 0.05) continue;
    if (x + r > b.min[0] && x - r < b.max[0] && z + r > b.min[2] && z - r < b.max[2]) g = Math.max(g, b.max[1]);
  }
  return g;
}

// Moves a body {pos:[x,y,z], vel:[x,y,z], onGround} with collision. Height h, radius r.
export function integrate(body, dt, h = P_HEIGHT, r = P_RADIUS) {
  const p = body.pos, v = body.vel;
  const prevY = p[1];
  // horizontal
  p[0] += v[0] * dt; p[2] += v[2] * dt;
  for (let iter = 0; iter < 2; iter++) {
    for (const b of COLLIDERS) {
      if (p[1] >= b.max[1] - 0.001 || p[1] + h <= b.min[1]) continue;
      const c = circleRect(p[0], p[2], r, b);
      if (!c.hit) continue;
      const rise = b.max[1] - p[1];
      if (rise > 0 && rise <= STEP && (body.onGround || v[1] <= 0) && !headBlocked(p[0], b.max[1], p[2], h, r)) {
        p[1] = b.max[1];
        continue;
      }
      if (c.d2 > 1e-8) {
        const d = Math.sqrt(c.d2);
        const push = r - d;
        p[0] += (c.dx / d) * push; p[2] += (c.dz / d) * push;
        // remove velocity into wall
        const nx = c.dx / d, nz = c.dz / d;
        const vn = v[0] * nx + v[2] * nz;
        if (vn < 0) { v[0] -= vn * nx; v[2] -= vn * nz; }
      } else {
        // center inside rect: push out along smallest axis
        const l = p[0] - b.min[0], rr = b.max[0] - p[0], f = p[2] - b.min[2], bk = b.max[2] - p[2];
        const m = Math.min(l, rr, f, bk);
        if (m === l) p[0] = b.min[0] - r; else if (m === rr) p[0] = b.max[0] + r;
        else if (m === f) p[2] = b.min[2] - r; else p[2] = b.max[2] + r;
      }
    }
  }
  // vertical
  p[1] += v[1] * dt;
  body.onGround = false;
  if (p[1] <= 0) { p[1] = 0; if (v[1] < 0) v[1] = 0; body.onGround = true; }
  for (const b of COLLIDERS) {
    const c = circleRect(p[0], p[2], r * 0.9, b);
    if (!c.hit) continue;
    if (v[1] <= 0 && p[1] < b.max[1] && prevY >= b.max[1] - STEP * 0.5 && p[1] + h > b.max[1]) {
      p[1] = b.max[1]; v[1] = 0; body.onGround = true;
    } else if (v[1] > 0 && p[1] + h > b.min[1] && prevY + h <= b.min[1] + 0.01) {
      p[1] = b.min[1] - h; v[1] = 0;
    }
  }
  // ground snap check (standing still on a box)
  if (!body.onGround && v[1] <= 0) {
    const g = groundUnder(p[0], p[2], p[1] + 0.02);
    if (g > 0 && p[1] - g < 0.03) { p[1] = g; v[1] = 0; body.onGround = true; }
  }
}

function headBlocked(x, y, z, h, r) {
  for (const b of COLLIDERS) {
    if (b.min[1] >= y + h || b.max[1] <= y + 0.01) continue;
    if (circleRect(x, z, r * 0.8, b).hit) return true;
  }
  return false;
}

// Ray vs boxes. Returns distance to first hit (or maxDist). Ground plane included.
export function raycast(o, d, maxDist, extra = null) {
  let best = maxDist;
  if (d[1] < -1e-6) { const t = -o[1] / d[1]; if (t >= 0 && t < best) best = t; }
  const test = (b) => {
    let tmin = 0, tmax = best;
    for (let a = 0; a < 3; a++) {
      if (Math.abs(d[a]) < 1e-9) { if (o[a] < b.min[a] || o[a] > b.max[a]) return; continue; }
      let t1 = (b.min[a] - o[a]) / d[a], t2 = (b.max[a] - o[a]) / d[a];
      if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
      if (t1 > tmin) tmin = t1;
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) return;
    }
    if (tmin < best) best = tmin;
  };
  for (const b of COLLIDERS) test(b);
  if (extra) for (const b of extra) test(b);
  return best;
}

export function losClear(a, b, extra = null) {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const len = Math.hypot(d[0], d[1], d[2]);
  if (len < 1e-4) return true;
  d[0] /= len; d[1] /= len; d[2] /= len;
  return raycast(a, d, len, extra) >= len - 0.05;
}

// Ray vs vertical capsule-ish cylinder (player). Returns t or -1.
export function rayPlayer(o, d, pos, maxDist, r = 0.55, h = P_HEIGHT) {
  // closest approach in XZ
  const ox = o[0] - pos[0], oz = o[2] - pos[2];
  const a = d[0] * d[0] + d[2] * d[2];
  const bq = 2 * (ox * d[0] + oz * d[2]);
  const c = ox * ox + oz * oz - r * r;
  let t;
  if (a < 1e-9) { if (c > 0) return -1; t = 0; }
  else {
    const disc = bq * bq - 4 * a * c;
    if (disc < 0) return -1;
    const s = Math.sqrt(disc);
    const t1 = (-bq - s) / (2 * a), t2 = (-bq + s) / (2 * a);
    t = t1 >= 0 ? t1 : t2;
    if (t < 0) return -1;
    // check vertical overlap between t1..t2
    for (const tt of [Math.max(0, t1), (Math.max(0, t1) + t2) / 2, t2]) {
      const y = o[1] + d[1] * tt;
      if (y >= pos[1] && y <= pos[1] + h && tt <= maxDist) return tt;
    }
    return -1;
  }
  return t <= maxDist ? t : -1;
}

// Distance from point to player's vertical segment
export function distToPlayer(pt, pos, h = P_HEIGHT) {
  const y = clamp(pt[1], pos[1] + 0.3, pos[1] + h - 0.3);
  return Math.hypot(pt[0] - pos[0], pt[1] - y, pt[2] - pos[2]);
}

// Shared movement step for any controlled character.
// inp: {fwd, right, jump, yaw}; mods: {speed, rooted, stunned, glide, frozen}
export function moveCharacter(body, inp, dt, baseSpeed, mods) {
  const v = body.vel;
  if (body.dashT > 0) {
    body.dashT -= dt;
    v[0] = body.dashV[0]; v[2] = body.dashV[2]; v[1] = body.dashV[1];
    integrate(body, dt);
    if (body.dashT <= 0) { v[0] *= 0.3; v[2] *= 0.3; v[1] = Math.min(v[1], 0); }
    return;
  }
  let wx = 0, wz = 0;
  if (!mods.stunned && !mods.rooted && !mods.frozen) {
    const [fx, fz] = fwdFromYaw(inp.yaw);
    const rx = -fz, rz = fx; // right vector
    wx = fx * inp.fwd + rx * inp.right;
    wz = fz * inp.fwd + rz * inp.right;
    const l = Math.hypot(wx, wz);
    if (l > 1) { wx /= l; wz /= l; }
  }
  const spd = baseSpeed * (mods.speed ?? 1);
  const tx = wx * spd, tz = wz * spd;
  const accel = body.onGround ? 70 : (mods.glide ? 30 : 14);
  const dx = tx - v[0], dz = tz - v[2];
  const dl = Math.hypot(dx, dz);
  const maxd = accel * dt;
  if (body.onGround || dl > 0.01) {
    if (body.onGround) {
      if (dl <= maxd) { v[0] = tx; v[2] = tz; } else { v[0] += (dx / dl) * maxd; v[2] += (dz / dl) * maxd; }
    } else {
      // air: only accelerate toward wish, don't brake hard
      if (wx || wz) {
        if (dl <= maxd) { v[0] = tx; v[2] = tz; } else { v[0] += (dx / dl) * maxd; v[2] += (dz / dl) * maxd; }
      }
    }
  }
  if (inp.jump && body.onGround && !mods.stunned && !mods.rooted && !mods.frozen) { v[1] = JUMP_V; body.onGround = false; }
  v[1] -= GRAVITY * (mods.glide ? 0.25 : 1) * dt;
  if (mods.glide && v[1] < -2.2) v[1] = -2.2;
  if (v[1] < -40) v[1] = -40;
  integrate(body, dt);
}

// Movement abilities applied by whoever controls the body (owner client or host for bots).
export function applyMoveAbility(body, def, yaw, pitch, now) {
  const [fx, fz] = fwdFromYaw(yaw);
  switch (def.kind) {
    case 'dash': {
      const sp = def.dist / def.dur;
      body.dashT = def.dur;
      body.dashV = [fx * sp, 0, fz * sp];
      return true;
    }
    case 'blink': {
      const eye = [body.pos[0], body.pos[1] + 1.0, body.pos[2]];
      const d = dirFromAngles(yaw, Math.max(-0.15, Math.min(0.35, pitch)));
      const hit = raycast(eye, d, def.dist);
      const dist = Math.max(0, hit - 0.7);
      body.pos[0] += d[0] * dist; body.pos[2] += d[2] * dist;
      body.pos[1] = Math.max(body.pos[1] + d[1] * dist, groundUnder(body.pos[0], body.pos[2], body.pos[1] + 0.6 + d[1] * dist));
      body.vel[0] = d[0] * 4; body.vel[2] = d[2] * 4; body.vel[1] = Math.max(body.vel[1], 0);
      return true;
    }
    case 'leap': {
      body.vel[0] = fx * def.fwd; body.vel[2] = fz * def.fwd; body.vel[1] = def.up;
      body.onGround = false; body.pos[1] += 0.05;
      return true;
    }
    case 'launch': {
      body.vel[0] = -fx * def.back; body.vel[2] = -fz * def.back; body.vel[1] = def.up;
      body.onGround = false; body.pos[1] += 0.05;
      return true;
    }
    case 'glide': {
      body.vel[1] = def.up; body.onGround = false; body.pos[1] += 0.05;
      body.glideUntil = now + def.dur;
      return true;
    }
    case 'grapple': {
      const eye = [body.pos[0], body.pos[1] + EYE, body.pos[2]];
      const d = dirFromAngles(yaw, pitch);
      const hit = raycast(eye, d, def.range);
      const dist = Math.min(hit, def.range);
      const dur = Math.max(0.2, dist / 28);
      body.dashT = dur;
      body.dashV = [d[0] * dist / dur, Math.max(2, d[1] * dist / dur + 3), d[2] * dist / dur];
      return true;
    }
  }
  return false;
}
export const MOVE_KINDS = new Set(['dash', 'blink', 'leap', 'launch', 'glide', 'grapple']);
