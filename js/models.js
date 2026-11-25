import * as THREE from 'three';

// ---------------------------------------------------------------
// Procedural low-poly hero models. Flat-shaded, faceted, emissive accents.
// ---------------------------------------------------------------
const matCache = new Map();
export function M(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshStandardMaterial({
    color, flatShading: true,
    roughness: o.r ?? 0.78, metalness: o.m ?? 0.05,
    emissive: o.e ? new THREE.Color(o.e) : new THREE.Color(0),
    emissiveIntensity: o.ei ?? 1,
    transparent: !!o.t, opacity: o.op ?? 1, side: o.ds ? THREE.DoubleSide : THREE.FrontSide,
    depthWrite: o.t ? false : true,
  });
  matCache.set(key, m);
  return m;
}
const GLOW = (c, i = 2.2) => M(c, { e: c, ei: i, r: 0.4 });

const G = {
  box: (w, h, d) => new THREE.BoxGeometry(w, h, d),
  cyl: (rt, rb, h, s = 6) => new THREE.CylinderGeometry(rt, rb, h, s),
  ico: (r, d = 0) => new THREE.IcosahedronGeometry(r, d),
  oct: (r) => new THREE.OctahedronGeometry(r),
  cone: (r, h, s = 6) => new THREE.ConeGeometry(r, h, s),
  tor: (r, t, rs = 4, ts = 14, arc = Math.PI * 2) => new THREE.TorusGeometry(r, t, rs, ts, arc),
  lathe: (pts, s = 8) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), s),
  dodec: (r) => new THREE.DodecahedronGeometry(r),
  plane: (w, h) => new THREE.PlaneGeometry(w, h),
};
function add(parent, geo, mat, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(p[0], p[1], p[2]); m.rotation.set(r[0], r[1], r[2]);
  if (typeof s === 'number') m.scale.setScalar(s); else m.scale.set(s[0], s[1], s[2]);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}
function grp(parent, p = [0, 0, 0], r = [0, 0, 0]) {
  const g = new THREE.Group(); g.position.set(...p); g.rotation.set(...r); parent.add(g); return g;
}

// ---------------- weapons (built along +Y from grip at origin) ----------------
export const WEAPONS = {
  greatsword(c) {
    const g = new THREE.Group();
    add(g, G.cyl(0.025, 0.025, 0.32, 5), M('#2a1a14'), [0, 0.05, 0]);
    add(g, G.oct(0.045), M(c.metal, { m: 0.8, r: 0.35 }), [0, -0.13, 0]);
    add(g, G.box(0.42, 0.05, 0.07), M(c.metal, { m: 0.8, r: 0.35 }), [0, 0.22, 0]);
    add(g, G.box(0.03, 0.06, 0.09), GLOW(c.glow), [0, 0.22, 0]);
    const blade = add(g, G.cyl(0.0, 0.085, 1.25, 4), M('#8b9099', { m: 0.85, r: 0.28 }), [0, 0.86, 0], [0, Math.PI / 4, 0], [1, 1, 0.28]);
    add(g, G.box(0.03, 0.95, 0.03), GLOW(c.glow, 2.6), [0, 0.75, 0]);
    blade.scale.set(1.5, 1, 0.22);
    return g;
  },
  dagger(c) {
    const g = new THREE.Group();
    add(g, G.cyl(0.02, 0.022, 0.13, 5), M('#1d1626'), [0, 0, 0]);
    add(g, G.box(0.12, 0.025, 0.035), M(c.metal, { m: 0.7 }), [0, 0.07, 0]);
    const b = add(g, G.cone(0.05, 0.38, 4), M('#9aa0b5', { m: 0.85, r: 0.25 }), [0, 0.27, 0], [0, 0, 0.12], [1, 1, 0.3]);
    add(g, G.box(0.008, 0.3, 0.012), GLOW(c.glow, 3), [0.012, 0.24, 0], [0, 0, 0.12]);
    return g;
  },
  staff(c) {
    const g = new THREE.Group();
    add(g, G.cyl(0.03, 0.035, 1.7, 5), M('#2b1e17'), [0, 0.2, 0]);
    for (let i = 0; i < 4; i++) {
      add(g, G.cone(0.03, 0.32, 4), M('#3a2a20'), [Math.cos(i * 1.57) * 0.09, 1.12, Math.sin(i * 1.57) * 0.09], [Math.sin(i * 1.57) * 0.5, 0, -Math.cos(i * 1.57) * 0.5]);
    }
    const orb = add(g, G.ico(0.11, 1), GLOW(c.glow, 3), [0, 1.18, 0]);
    orb.userData.flicker = true;
    add(g, G.tor(0.08, 0.012, 3, 10), M(c.metal, { m: 0.8 }), [0, 0.98, 0], [Math.PI / 2, 0, 0]);
    return g;
  },
  bow(c) {
    const g = new THREE.Group();
    const arc = add(g, G.tor(0.62, 0.025, 4, 16, Math.PI * 0.85), M(c.wood || '#2d3540', { m: 0.3 }), [-0.42, 0, 0], [0, 0, -Math.PI * 0.425]);
    add(g, G.tor(0.62, 0.012, 3, 16, Math.PI * 0.85), GLOW(c.glow, 2.4), [-0.4, 0, 0], [0, 0, -Math.PI * 0.425]);
    const s = add(g, G.cyl(0.004, 0.004, 1.06, 3), M('#e8eef2', { e: '#ffffff', ei: 0.3 }), [-0.26, 0, 0]);
    s.userData.string = true;
    add(g, G.box(0.05, 0.16, 0.05), M('#3b2a1f'), [0, 0, 0]);
    add(g, G.cone(0.05, 0.16, 4), GLOW(c.glow, 2), [0.06, 0.53, 0], [0, 0, -0.5]);
    add(g, G.cone(0.05, 0.16, 4), GLOW(c.glow, 2), [0.06, -0.53, 0], [Math.PI, 0, 0.5]);
    return g;
  },
  hammer(c) {
    const g = new THREE.Group();
    add(g, G.cyl(0.035, 0.04, 1.2, 5), M('#3a2b20'), [0, 0.3, 0]);
    add(g, G.box(0.5, 0.3, 0.28), M(c.metal, { m: 0.6, r: 0.5 }), [0, 0.95, 0]);
    add(g, G.box(0.52, 0.06, 0.3), M('#1f1f22', { m: 0.7 }), [0, 1.02, 0]);
    add(g, G.box(0.06, 0.2, 0.3), GLOW(c.glow, 2.4), [0.24, 0.95, 0]);
    add(g, G.box(0.06, 0.2, 0.3), GLOW(c.glow, 2.4), [-0.24, 0.95, 0]);
    return g;
  },
  gravestone(c) {
    const g = new THREE.Group();
    add(g, G.cyl(0.04, 0.045, 1.35, 5), M('#3a3026'), [0, 0.35, 0]);
    const s = add(g, G.box(0.62, 0.72, 0.18), M('#5d5f5a', { r: 0.95 }), [0, 1.2, 0]);
    add(g, G.cyl(0.31, 0.31, 0.18, 7, 1), M('#5d5f5a', { r: 0.95 }), [0, 1.56, 0], [Math.PI / 2, 0, 0]);
    add(g, G.box(0.06, 0.32, 0.2), GLOW(c.glow, 1.6), [0, 1.3, 0.0]);
    add(g, G.box(0.22, 0.06, 0.2), GLOW(c.glow, 1.6), [0, 1.36, 0.0]);
    add(g, G.tor(0.12, 0.02, 3, 8), M('#444', { m: 0.8 }), [0, 0.75, 0], [Math.PI / 2, 0, 0]);
    return g;
  },
  spear(c) {
    const g = new THREE.Group();
    add(g, G.cyl(0.025, 0.028, 2.1, 5), M(c.shaft || '#3d2c1f'), [0, 0.45, 0]);
    add(g, G.cone(0.075, 0.45, 4), M(c.metal, { m: 0.85, r: 0.3 }), [0, 1.72, 0], [0, Math.PI / 4, 0], [1, 1, 0.35]);
    add(g, G.box(0.02, 0.32, 0.02), GLOW(c.glow, 2.6), [0, 1.7, 0]);
    add(g, G.tor(0.05, 0.015, 3, 8), M(c.metal, { m: 0.8 }), [0, 1.47, 0], [Math.PI / 2, 0, 0]);
    const tass = add(g, G.cone(0.04, 0.25, 4), M(c.cloth || '#8a1c1c'), [0, 1.33, 0], [Math.PI, 0, 0]);
    return g;
  },
  glaive(c) {
    const g = WEAPONS.spear({ ...c, cloth: '#2a1210' });
    const b = add(g, G.cone(0.12, 0.6, 3), M('#3b2620', { m: 0.6 }), [0.05, 1.8, 0], [0, 0, -0.15], [1, 1, 0.25]);
    add(g, G.box(0.04, 0.45, 0.03), GLOW(c.glow, 3), [0.07, 1.78, 0], [0, 0, -0.15]);
    return g;
  },
  axe(c) {
    const g = new THREE.Group();
    add(g, G.cyl(0.028, 0.03, 0.75, 5), M('#3a2a1e'), [0, 0.18, 0]);
    const head = add(g, G.cyl(0.26, 0.26, 0.04, 6, 1, false), M('#7e7f84', { m: 0.8, r: 0.35 }), [0.14, 0.52, 0], [Math.PI / 2, 0, 0]);
    head.scale.set(0.55, 1, 0.75);
    add(g, G.box(0.09, 0.16, 0.06), M('#2b2b2e', { m: 0.7 }), [0, 0.52, 0]);
    add(g, G.box(0.02, 0.22, 0.05), GLOW(c.glow, 2), [0.27, 0.52, 0]);
    return g;
  },
  lantern(c) {
    const g = new THREE.Group();
    add(g, G.cyl(0.028, 0.032, 1.9, 5), M('#1e1a16'), [0, 0.3, 0]);
    add(g, G.box(0.4, 0.03, 0.03), M('#1e1a16'), [0.15, 1.22, 0]);
    const lg = grp(g, [0.32, 1.05, 0]);
    add(lg, G.cyl(0.005, 0.005, 0.14, 3), M('#222'), [0, 0.1, 0]);
    add(lg, G.cyl(0.07, 0.09, 0.05, 6), M('#2a2a28', { m: 0.8 }), [0, 0.02, 0]);
    add(lg, G.cyl(0.09, 0.07, 0.05, 6), M('#2a2a28', { m: 0.8 }), [0, -0.2, 0]);
    const f = add(lg, G.ico(0.07, 1), GLOW(c.glow, 3.4), [0, -0.09, 0]);
    f.userData.flicker = true;
    add(lg, G.cyl(0.085, 0.085, 0.18, 6, 1, true), M('#c8ffe8', { t: true, op: 0.18, e: c.glow, ei: 0.5, ds: true }), [0, -0.09, 0]);
    // skull at top
    add(g, G.ico(0.09, 0), M('#d8d0bc'), [0, 1.3, 0]);
    add(g, G.box(0.03, 0.02, 0.02), GLOW(c.glow, 3), [0.03, 1.31, 0.075]);
    add(g, G.box(0.03, 0.02, 0.02), GLOW(c.glow, 3), [-0.03, 1.31, 0.075]);
    return g;
  },
  flask(c) {
    const g = new THREE.Group();
    add(g, G.ico(0.1, 1), M('#9cff70', { t: true, op: 0.55, e: c.glow, ei: 1.4 }), [0, 0.1, 0]);
    add(g, G.cyl(0.03, 0.04, 0.1, 6), M('#5a4a3a'), [0, 0.22, 0]);
    add(g, G.cyl(0.035, 0.035, 0.03, 6), M('#3a2b22'), [0, 0.28, 0]);
    return g;
  },
  claw(c) {
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      add(g, G.cone(0.02, 0.26, 4), M(c.claw || '#e8e0d0', { e: c.glow, ei: c.glowClaw ? 0.8 : 0 }), [(i - 1) * 0.03, 0.14, 0.02], [0.25, 0, (i - 1) * 0.12]);
    }
    return g;
  },
  starstaff(c) {
    const g = new THREE.Group();
    add(g, G.cyl(0.025, 0.03, 1.65, 5), M('#e7e3ff', { m: 0.6, r: 0.3 }), [0, 0.2, 0]);
    add(g, G.tor(0.16, 0.012, 3, 18), M('#d4c48a', { m: 0.8 }), [0, 1.18, 0]);
    const s = add(g, G.oct(0.1), GLOW(c.glow, 3.4), [0, 1.18, 0], [0, 0, 0], [0.7, 1.4, 0.7]);
    s.userData.spin = 1.5;
    return g;
  },
  vinestaff(c) {
    const g = new THREE.Group();
    for (let i = 0; i < 6; i++) add(g, G.cyl(0.03, 0.035, 0.32, 4), M('#3c2d1c'), [Math.sin(i) * 0.03, -0.35 + i * 0.3, Math.cos(i * 1.3) * 0.03], [Math.sin(i) * 0.15, 0, Math.cos(i) * 0.12]);
    add(g, G.ico(0.1, 1), GLOW(c.glow, 2.8), [0, 1.45, 0]).userData.flicker = true;
    for (let i = 0; i < 3; i++) add(g, G.cone(0.05, 0.22, 4), M('#4f7a3a'), [Math.cos(i * 2.1) * 0.1, 1.4, Math.sin(i * 2.1) * 0.1], [Math.sin(i * 2.1) * 0.8, 0, -Math.cos(i * 2.1) * 0.8]);
    return g;
  },
  sword(c) {
    const g = new THREE.Group();
    add(g, G.cyl(0.022, 0.022, 0.2, 5), M('#1b1410'), [0, 0, 0]);
    add(g, G.box(0.26, 0.04, 0.05), M('#a8893f', { m: 0.85, r: 0.3 }), [0, 0.11, 0]);
    const b = add(g, G.cyl(0.0, 0.06, 0.85, 4), M('#2b2b31', { m: 0.9, r: 0.2 }), [0, 0.55, 0], [0, Math.PI / 4, 0]);
    b.scale.set(1.3, 1, 0.25);
    add(g, G.box(0.015, 0.7, 0.02), GLOW(c.glow, 3), [0, 0.5, 0]);
    return g;
  },
  shield(c) {
    const g = new THREE.Group();
    const s = add(g, G.cyl(0.34, 0.34, 0.06, 7), M(c.metal, { m: 0.75, r: 0.4 }), [0, 0, 0], [Math.PI / 2, 0, 0]);
    add(g, G.cyl(0.28, 0.28, 0.07, 7), M(c.cloth || '#4a4a52', { r: 0.9 }), [0, 0, 0.01], [Math.PI / 2, 0, 0]);
    add(g, G.box(0.05, 0.42, 0.02), GLOW(c.glow, 1.8), [0, 0, 0.05]);
    add(g, G.box(0.3, 0.05, 0.02), GLOW(c.glow, 1.8), [0, 0.06, 0.05]);
    return g;
  },
  orbhand(c) {
    const g = new THREE.Group();
    const o = add(g, G.ico(0.08, 1), GLOW(c.glow, 3), [0, 0.06, 0.06]);
    o.userData.flicker = true;
    return g;
  },
};

// ---------------- rig ----------------
function rig(spec) {
  const c = spec.c;
  const root = new THREE.Group();
  const body = grp(root);
  body.scale.setScalar(spec.h || 1);
  const bw = spec.bw || 1, lw = spec.lw || 1;
  const parts = { root, body, c, spec, update: [], capes: [], extras: {} };

  const hips = grp(body, [0, 0.95, 0]);
  parts.hips = hips;
  const legMat = M(c.leg || c.cloth), bootMat = M(c.boot || '#1c1714', { r: 0.6 });
  for (const side of [-1, 1]) {
    const leg = grp(hips, [side * 0.11 * bw, 0, 0]);
    const knee = grp(leg, [0, -0.45, 0]);
    if (!spec.noLegs) {
      add(leg, G.cyl(0.08 * lw, 0.065 * lw, 0.46, 5), legMat, [0, -0.22, 0]);
      add(knee, G.cyl(0.065 * lw, 0.05 * lw, 0.44, 5), legMat, [0, -0.21, 0]);
      add(knee, G.box(0.13 * lw, 0.12, 0.25), bootMat, [0, -0.43, -0.05]);
      if (spec.kneeGuard) add(knee, G.cone(0.07, 0.16, 4), M(c.armor || c.metal, { m: 0.7, r: 0.35 }), [0, 0.02, -0.06], [-1.4, 0, 0]);
    }
    parts[side < 0 ? 'legL' : 'legR'] = leg;
    parts[side < 0 ? 'kneeL' : 'kneeR'] = knee;
  }
  add(hips, G.box(0.34 * bw, 0.17, 0.21 * bw), M(c.pelvis || c.leather || c.cloth), [0, -0.02, 0]);
  add(hips, G.box(0.36 * bw, 0.05, 0.23 * bw), M(c.belt || '#2a1d15'), [0, 0.05, 0]);

  const spine = grp(hips, [0, 0.06, 0]);
  parts.spine = spine;
  const chest = add(spine, G.cyl(0.2 * bw, 0.15 * bw, 0.52, 6), M(c.torso || c.cloth), [0, 0.27, 0], [0, Math.PI / 6, 0], [1, 1, 0.66]);
  parts.chest = chest;
  const neck = grp(spine, [0, 0.56, 0]);
  add(neck, G.cyl(0.05, 0.06, 0.1, 5), M(c.skin || '#3a2f2a'), [0, 0.03, 0]);
  const head = grp(neck, [0, 0.1, 0]);
  parts.head = head;

  for (const side of [-1, 1]) {
    const sh = grp(spine, [side * 0.25 * bw, 0.47, 0]);
    const armMat = M(c.arm || c.cloth);
    add(sh, G.cyl(0.062 * lw, 0.052 * lw, 0.3, 5), armMat, [0, -0.15, 0]);
    const el = grp(sh, [0, -0.3, 0]);
    add(el, G.cyl(0.052 * lw, 0.045 * lw, 0.27, 5), M(c.fore || c.arm || c.cloth), [0, -0.135, 0]);
    const hand = grp(el, [0, -0.29, 0]);
    add(hand, G.box(0.075 * lw, 0.095, 0.065), M(c.hand || c.skin || '#2a2420'), [0, -0.02, 0]);
    parts[side < 0 ? 'shL' : 'shR'] = sh;
    parts[side < 0 ? 'elL' : 'elR'] = el;
    parts[side < 0 ? 'handL' : 'handR'] = hand;
  }
  return parts;
}

// ---- reusable details ----
function pauldron(P, side, mat, size = 1, spikes = 0, spikeMat) {
  const sh = side < 0 ? P.shL : P.shR;
  const pd = add(sh, G.ico(0.13 * size, 0), mat, [side * 0.03, 0.02, 0], [0, 0, side * 0.3], [1.25, 0.8, 1.1]);
  for (let i = 0; i < spikes; i++) add(sh, G.cone(0.035 * size, 0.2 * size, 4), spikeMat || mat, [side * (0.04 + i * 0.05), 0.12 * size, (i - (spikes - 1) / 2) * 0.08], [0, 0, side * -0.4]);
  return pd;
}
function eyes(head, color, y = 0.02, z = 0.11, gap = 0.045, w = 0.035, h = 0.015) {
  const m = GLOW(color, 3.2);
  add(head, G.box(w, h, 0.02), m, [-gap, y, z]);
  add(head, G.box(w, h, 0.02), m, [gap, y, z]);
}
function cape(P, color, len = 1.05, width = 0.5, tattered = true, attach = 0.5) {
  const root = grp(P.spine, [0, attach, -0.13]);
  const mat = M(color, { ds: true, r: 0.95 });
  let parent = root;
  const segs = [];
  const n = 4;
  for (let i = 0; i < n; i++) {
    const seg = grp(parent, i === 0 ? [0, 0, 0] : [0, -len / n, 0]);
    const w = width * (1 + i * 0.12);
    add(seg, G.box(w, len / n + 0.01, 0.025), mat, [0, -len / n / 2, 0]);
    if (tattered && i === n - 1) {
      for (let k = 0; k < 4; k++) add(seg, G.cone(w / 9, 0.18, 3), mat, [(k - 1.5) * w / 4, -len / n - 0.08, 0], [Math.PI, 0, 0], [1, 1, 0.3]);
    }
    segs.push(seg); parent = seg;
  }
  P.capes.push(segs);
  return root;
}
function robe(P, color, trim, flare = 0.36, len = 0.95) {
  const g = grp(P.hips, [0, 0.08, 0]);
  add(g, G.lathe([[0.17, 0], [0.22, -0.3], [flare * 0.9, -len + 0.15], [flare, -len]], 8), M(color, { ds: true, r: 0.9 }), [0, 0, 0], [0, Math.PI / 8, 0], [1, 1, 0.85]);
  if (trim) add(g, G.tor(flare * 0.98, 0.02, 3, 8), GLOW(trim, 1.8), [0, -len + 0.02, 0], [Math.PI / 2, 0, Math.PI / 8], [1, 0.85, 1]);
  P.robe = g;
  return g;
}
function hair(head, color, style = 'short') {
  const m = M(color, { r: 0.7 });
  add(head, G.ico(0.135, 0), m, [0, 0.06, -0.02], [0.2, 0, 0], [1.05, 0.85, 1.05]);
  if (style === 'long') {
    add(head, G.box(0.26, 0.45, 0.08), m, [0, -0.15, -0.1], [0.1, 0, 0]);
  } else if (style === 'pony') {
    add(head, G.cone(0.07, 0.5, 5), m, [0, -0.1, -0.2], [2.6, 0, 0]);
  } else if (style === 'bun') {
    add(head, G.ico(0.07, 0), m, [0, 0.12, -0.12]);
  }
  for (let i = 0; i < 5; i++) add(head, G.cone(0.05, 0.14, 3), m, [(i - 2) * 0.05, 0.1, 0.09], [1.9, 0, (i - 2) * 0.15]);
}
function face(head, skin, eyeColor, o = {}) {
  add(head, G.ico(0.12, 1), M(skin, { r: 0.6 }), [0, 0, 0], [0, 0, 0], [0.92, 1.08, 0.95]);
  add(head, G.box(0.03, 0.05, 0.04), M(skin), [0, -0.02, 0.115]); // nose
  eyes(head, eyeColor, 0.02, 0.105, 0.042, 0.032, 0.014);
  if (o.brow !== false) {
    add(head, G.box(0.05, 0.012, 0.02), M('#1a1210'), [-0.042, 0.048, 0.11], [0, 0, 0.18]);
    add(head, G.box(0.05, 0.012, 0.02), M('#1a1210'), [0.042, 0.048, 0.11], [0, 0, -0.18]);
  }
}

// ---------------- hero specs ----------------
const BUILDERS = {
  knight() {
    const c = { cloth: '#5e1016', armor: '#3b3f47', metal: '#6c717c', glow: '#ff2b2b', leg: '#2a2d33', arm: '#3b3f47', torso: '#3b3f47', pelvis: '#2f3238', fore: '#4a4f58', hand: '#2a2d33', skin: '#2a2d33' };
    const P = rig({ c, h: 1.1, bw: 1.35, lw: 1.3, kneeGuard: true, pose: 'twohand' });
    const A = M(c.armor, { m: 0.75, r: 0.38 });
    // breastplate with ridge & tabard
    add(P.spine, G.cyl(0.215 * 1.35, 0.16 * 1.35, 0.36, 6), A, [0, 0.36, 0.01], [0, Math.PI / 6, 0], [1, 1, 0.72]);
    add(P.spine, G.box(0.03, 0.34, 0.05), M('#8b1a1a', { e: '#300', ei: 1 }), [0, 0.34, 0.16]);
    add(P.hips, G.box(0.26, 0.5, 0.03), M(c.cloth, { ds: true }), [0, -0.28, 0.12]);
    add(P.hips, G.box(0.08, 0.08, 0.04), GLOW(c.glow, 2), [0, -0.12, 0.14]);
    pauldron(P, -1, A, 1.35, 3, M('#25272c', { m: 0.8 }));
    pauldron(P, 1, A, 1.35, 3, M('#25272c', { m: 0.8 }));
    // great helm with horns
    const h = P.head;
    add(h, G.cyl(0.13, 0.14, 0.27, 6), A, [0, 0.0, 0], [0, Math.PI / 6, 0]);
    add(h, G.cone(0.135, 0.12, 6), A, [0, 0.19, 0], [0, Math.PI / 6, 0]);
    add(h, G.box(0.2, 0.022, 0.05), GLOW(c.glow, 3.5), [0, 0.03, 0.115]);
    add(h, G.box(0.022, 0.1, 0.05), GLOW(c.glow, 2), [0, -0.04, 0.12]);
    for (const s of [-1, 1]) {
      const hg = grp(h, [s * 0.13, 0.08, 0]);
      add(hg, G.cone(0.05, 0.22, 5), M('#d8ccb0'), [s * 0.08, 0.04, 0], [0, 0, s * -1.25]);
      add(hg, G.cone(0.035, 0.2, 5), M('#d8ccb0'), [s * 0.2, 0.15, 0], [0, 0, s * -0.25]);
    }
    cape(P, '#4a0c10', 1.15, 0.55);
    const w = WEAPONS.greatsword(c);
    P.handR.add(w); w.rotation.set(2.45, 0, 0); w.position.set(0, -0.05, 0.02);
    P.weaponR = w;
    return P;
  },
  shade() {
    const c = { cloth: '#231a33', leather: '#2e2440', metal: '#5f5a73', glow: '#b06cff', leg: '#1b1528', arm: '#271d38', skin: '#120d18', hand: '#1b1528' };
    const P = rig({ c, h: 0.98, bw: 0.9, lw: 0.85, pose: 'dual' });
    // hood + void face
    const h = P.head;
    add(h, G.cone(0.19, 0.42, 6), M('#2b2040', { r: 0.95 }), [0, 0.1, -0.03], [-0.25, 0, 0]);
    add(h, G.ico(0.13, 0), M('#06040a'), [0, -0.01, 0.02]);
    eyes(h, c.glow, 0.0, 0.12, 0.04, 0.045, 0.012);
    // scarf trailing
    add(P.spine, G.tor(0.13, 0.05, 4, 8), M('#3c2a5a'), [0, 0.52, 0], [Math.PI / 2, 0, 0]);
    const sc = cape(P, '#3c2a5a', 0.8, 0.12, true, 0.53);
    sc.position.x = 0.08;
    cape(P, '#1d152b', 0.95, 0.42, true, 0.45);
    // belts / straps
    add(P.spine, G.box(0.05, 0.55, 0.3), M('#4a3d5e'), [0, 0.28, 0], [0, 0, 0.6]);
    for (const s of [-1, 1]) add(s < 0 ? P.elL : P.elR, G.cyl(0.058, 0.058, 0.12, 5), M('#463a5a', { m: 0.5 }), [0, -0.15, 0]);
    const wR = WEAPONS.dagger(c), wL = WEAPONS.dagger(c);
    P.handR.add(wR); wR.rotation.set(2.9, 0, 0); wR.position.set(0, -0.05, 0.02);
    P.handL.add(wL); wL.rotation.set(-0.2, 0, 0); wL.position.set(0, -0.05, -0.02);
    P.weaponR = wR; P.weaponL = wL;
    return P;
  },
  witch() {
    const c = { cloth: '#2a1a17', torso: '#3a1f1a', metal: '#7a5a3a', glow: '#ff7a1f', skin: '#d9c4b0', arm: '#2d1d19', hand: '#d9c4b0' };
    const P = rig({ c, h: 1.0, bw: 0.85, lw: 0.85, noLegs: true, pose: 'staff' });
    robe(P, '#231512', '#ff5a10', 0.38);
    add(P.spine, G.box(0.36, 0.05, 0.22), M('#5a2a12'), [0, 0.06, 0]);
    // embers sash
    add(P.spine, G.box(0.06, 0.5, 0.25), GLOW('#ff5a10', 1.2), [0.05, 0.28, 0], [0, 0, -0.5]);
    const h = P.head;
    face(h, c.skin, '#ffb347');
    hair(h, '#1a0f0c', 'long');
    // crooked witch hat
    const hat = grp(h, [0, 0.1, 0]);
    add(hat, G.cyl(0.32, 0.34, 0.03, 9), M('#1c1210'), [0, 0, 0]);
    const t1 = grp(hat, [0, 0.02, 0], [-0.15, 0, 0]);
    add(t1, G.cyl(0.11, 0.15, 0.2, 7), M('#1c1210'), [0, 0.1, 0]);
    const t2 = grp(t1, [0, 0.2, 0], [-0.4, 0, 0.1]);
    add(t2, G.cyl(0.05, 0.11, 0.2, 7), M('#1c1210'), [0, 0.1, 0]);
    const t3 = grp(t2, [0, 0.2, 0], [-0.6, 0, 0]);
    add(t3, G.cone(0.05, 0.18, 7), M('#1c1210'), [0, 0.09, 0]);
    add(hat, G.cyl(0.155, 0.155, 0.05, 9), GLOW('#ff5a10', 1.4), [0, 0.04, 0]);
    // collar
    add(P.spine, G.cone(0.22, 0.2, 7, 1), M('#1c1210', { ds: true }), [0, 0.58, -0.02], [Math.PI, 0, 0]);
    const w = WEAPONS.staff(c);
    P.handR.add(w); w.position.set(0, -0.05, 0); w.rotation.set(1.3, 0, 0);
    P.weaponR = w;
    // floating flame in left hand
    const f = WEAPONS.orbhand(c); P.handL.add(f); P.weaponL = f;
    return P;
  },
  huntress() {
    const c = { cloth: '#344656', leather: '#3b3a40', metal: '#9ab', glow: '#8fe3ff', skin: '#e2d2c6', leg: '#2b3640', arm: '#3b4b5a', torso: '#3d4f5e', hand: '#2d2a2a', wood: '#2b3138' };
    const P = rig({ c, h: 1.0, bw: 0.9, lw: 0.9, pose: 'bow' });
    const fur = M('#e3e9ee', { r: 1 });
    add(P.spine, G.tor(0.18, 0.08, 5, 9), fur, [0, 0.5, 0], [Math.PI / 2, 0, 0], [1.1, 0.9, 1]);
    for (const s of [-1, 1]) pauldron(P, s, fur, 0.9);
    const h = P.head;
    face(h, c.skin, '#9fe8ff');
    hair(h, '#cfd8e0', 'pony');
    // half mask
    add(h, G.box(0.21, 0.07, 0.06), M('#a9b8c4', { m: 0.6 }), [0, -0.06, 0.1]);
    add(h, G.cone(0.03, 0.12, 4), M('#a9b8c4', { m: 0.6 }), [-0.1, 0.08, 0.02], [0, 0, 0.6]);
    add(h, G.cone(0.03, 0.12, 4), M('#a9b8c4', { m: 0.6 }), [0.1, 0.08, 0.02], [0, 0, -0.6]);
    // quiver
    const q = grp(P.spine, [0.12, 0.3, -0.17], [0, 0, -0.35]);
    add(q, G.cyl(0.07, 0.06, 0.5, 6), M('#3a2b22'), [0, 0, 0]);
    for (let i = 0; i < 4; i++) add(q, G.cone(0.02, 0.1, 3), GLOW('#bdf2ff', 1.5), [(i - 1.5) * 0.025, 0.3, 0]);
    // skirt flaps
    add(P.hips, G.box(0.36, 0.3, 0.24), M('#2b3640', { ds: true }), [0, -0.18, 0]);
    const w = WEAPONS.bow(c);
    P.handL.add(w); w.rotation.set(Math.PI / 2, -Math.PI / 2, 0); w.position.set(0, -0.04, 0);
    P.weaponL = w;
    return P;
  },
  priest() {
    const c = { cloth: '#151817', torso: '#1c201e', metal: '#7d8a7f', glow: '#58ffb0', skin: '#d8d0bc', arm: '#1b1f1d', hand: '#cfc6b0' };
    const P = rig({ c, h: 1.12, bw: 0.82, lw: 0.75, noLegs: true, pose: 'staff' });
    robe(P, '#121514', '#3dffa0', 0.34, 0.98);
    add(P.spine, G.box(0.08, 0.6, 0.02), GLOW('#3dffa0', 0.9), [0, 0.2, 0.13]);
    // skull mask + bone crown
    const h = P.head;
    add(h, G.cone(0.2, 0.4, 6), M('#101211', { r: 1 }), [0, 0.07, -0.04], [-0.2, 0, 0]);
    add(h, G.ico(0.11, 1), M(c.skin, { r: 0.85 }), [0, -0.01, 0.04], [0, 0, 0], [0.95, 1.1, 0.95]);
    add(h, G.box(0.09, 0.05, 0.06), M(c.skin), [0, -0.1, 0.06]);
    add(h, G.box(0.04, 0.035, 0.02), M('#050505'), [-0.042, 0.01, 0.135]);
    add(h, G.box(0.04, 0.035, 0.02), M('#050505'), [0.042, 0.01, 0.135]);
    eyes(h, c.glow, 0.01, 0.142, 0.042, 0.016, 0.016);
    for (let i = 0; i < 7; i++) {
      const a = (i / 6 - 0.5) * 2.2;
      add(h, G.cone(0.02, 0.16 + (i === 3 ? 0.08 : 0), 4), M('#e4dcc6'), [Math.sin(a) * 0.12, 0.17, Math.cos(a) * 0.1 - 0.02], [Math.cos(a) * 0.3, 0, -Math.sin(a) * 0.3]);
    }
    // rune ring orbit
    const ring = add(P.hips, G.tor(0.45, 0.012, 3, 24), GLOW(c.glow, 2.2), [0, 0.1, 0], [Math.PI / 2, 0, 0]);
    P.update.push((t) => { ring.rotation.z = t * 0.8; ring.position.y = 0.1 + Math.sin(t * 1.5) * 0.04; });
    for (const s of [-1, 1]) add(s < 0 ? P.shL : P.shR, G.cone(0.12, 0.2, 5), M('#0e100f'), [s * 0.02, 0.03, 0], [0, 0, s * 0.5]);
    const w = WEAPONS.lantern(c);
    P.handR.add(w); w.position.set(0, -0.05, 0); w.rotation.x = 1.3; P.weaponR = w;
    return P;
  },
  gravekeeper() {
    const c = { cloth: '#3e3a2f', torso: '#4a4436', leather: '#3a3025', metal: '#555a55', glow: '#c6ff6a', skin: '#5c6b4a', leg: '#2e2a22', arm: '#4a4436', hand: '#5c6b4a' };
    const P = rig({ c, h: 1.16, bw: 1.55, lw: 1.5, pose: 'twohand' });
    P.spine.rotation.x = 0.25;
    // hunched back + coat
    add(P.spine, G.ico(0.3, 0), M('#3e3a2f'), [0, 0.42, -0.1], [0, 0, 0], [1.2, 0.9, 0.9]);
    add(P.hips, G.lathe([[0.25, 0.05], [0.32, -0.3], [0.36, -0.62]], 7), M('#35312a', { ds: true }), [0, 0, 0]);
    const h = P.head;
    h.position.z = 0.08;
    add(h, G.ico(0.13, 0), M(c.skin), [0, 0, 0]);
    add(h, G.cone(0.13, 0.25, 6), M('#5a5a50', { r: 1 }), [0, -0.13, 0.06], [Math.PI + 0.3, 0, 0]); // beard
    eyes(h, '#ffe36a', 0.03, 0.11, 0.045, 0.03, 0.02);
    add(h, G.cyl(0.32, 0.34, 0.03, 8), M('#1f1c18'), [0, 0.1, 0], [0.1, 0, 0]);
    add(h, G.cyl(0.13, 0.15, 0.16, 8), M('#1f1c18'), [0, 0.18, -0.01]);
    add(h, G.cyl(0.155, 0.155, 0.03, 8), M('#4a3020'), [0, 0.12, -0.01]);
    // hanging lantern on belt
    const lan = grp(P.hips, [0.28, 0.0, 0.08]);
    add(lan, G.cyl(0.05, 0.06, 0.12, 6), M('#2a2a26', { m: 0.7 }), [0, -0.1, 0]);
    add(lan, G.ico(0.04, 0), GLOW(c.glow, 3), [0, -0.1, 0]).userData.flicker = true;
    // chains
    for (let i = 0; i < 4; i++) add(P.spine, G.tor(0.035, 0.01, 3, 6), M('#666', { m: 0.8 }), [-0.2 + i * 0.07, 0.15 + i * 0.07, 0.14], [0, 0.6, 0]);
    pauldron(P, -1, M('#4a4a44', { m: 0.6 }), 1.3, 2);
    const w = WEAPONS.gravestone(c);
    P.handR.add(w); w.rotation.set(2.3, 0, 0); w.position.set(0, -0.05, 0.02); w.scale.setScalar(0.85);
    P.weaponR = w;
    return P;
  },
  stormcaller() {
    const c = { cloth: '#243049', torso: '#2a3956', metal: '#8a96ad', glow: '#8fb8ff', skin: '#c8b8a8', leg: '#1e2738', arm: '#26324a', hand: '#5a6680' };
    const P = rig({ c, h: 1.02, bw: 0.95, lw: 0.9, pose: 'cast' });
    robe(P, '#1d2639', '#8fb8ff', 0.3, 0.7);
    const h = P.head;
    add(h, G.cone(0.2, 0.38, 6), M('#1d2639', { r: 0.95 }), [0, 0.05, -0.05], [-0.35, 0, 0]);
    add(h, G.ico(0.12, 0), M('#2b3240', { m: 0.7, r: 0.3 }), [0, -0.01, 0.02]);
    add(h, G.box(0.18, 0.025, 0.04), GLOW(c.glow, 3.5), [0, 0.02, 0.12]);
    add(h, G.box(0.03, 0.12, 0.04), GLOW(c.glow, 2.5), [0, -0.05, 0.12], [0, 0, 0.4]);
    for (const s of [-1, 1]) {
      pauldron(P, s, M('#59647a', { m: 0.7, r: 0.35 }), 1.0, 1, GLOW(c.glow, 1.8));
      add(s < 0 ? P.elL : P.elR, G.cyl(0.065, 0.06, 0.18, 6), M('#59647a', { m: 0.8 }), [0, -0.17, 0]);
    }
    // floating rune stones
    const orbit = grp(P.spine, [0, 0.4, 0]);
    for (let i = 0; i < 3; i++) {
      const g = grp(orbit, [Math.cos(i * 2.09) * 0.55, 0, Math.sin(i * 2.09) * 0.55]);
      add(g, G.oct(0.08), M('#3b4152', { m: 0.4 }), [0, 0, 0], [0, 0, 0], [0.8, 1.4, 0.8]);
      add(g, G.box(0.02, 0.08, 0.02), GLOW(c.glow, 3), [0, 0, 0.06]);
    }
    P.update.push((t) => { orbit.rotation.y = t * 1.1; orbit.children.forEach((g, i) => g.position.y = Math.sin(t * 2 + i) * 0.1); });
    const fR = WEAPONS.orbhand(c), fL = WEAPONS.orbhand(c);
    P.handR.add(fR); P.handL.add(fL); P.weaponR = fR; P.weaponL = fL;
    return P;
  },
  vampire() {
    const c = { cloth: '#5a0d1f', torso: '#6b1024', metal: '#c9a45c', glow: '#ff1f4b', skin: '#e8dcdc', leg: '#1a0b10', arm: '#5a0d1f', hand: '#e8dcdc', claw: '#2a0a10', glowClaw: true };
    const P = rig({ c, h: 1.06, bw: 0.85, lw: 0.82, pose: 'claws' });
    // long coat tails
    add(P.hips, G.lathe([[0.18, 0.05], [0.24, -0.35], [0.3, -0.78]], 8), M('#4a0a19', { ds: true }), [0, 0, -0.02], [0, 0, 0], [1, 1, 0.8]);
    add(P.spine, G.box(0.04, 0.42, 0.06), M(c.metal, { m: 0.9, r: 0.3 }), [0, 0.3, 0.13]);
    // high collar
    for (const s of [-1, 1]) add(P.spine, G.box(0.03, 0.3, 0.18), M('#3a0812', { ds: true }), [s * 0.12, 0.62, -0.02], [0.2, 0, s * -0.35]);
    const h = P.head;
    face(h, c.skin, c.glow);
    hair(h, '#140608', 'bun');
    add(h, G.box(0.03, 0.02, 0.02), M('#ffffff'), [-0.02, -0.07, 0.11]); // fangs
    add(h, G.box(0.03, 0.02, 0.02), M('#ffffff'), [0.02, -0.07, 0.11]);
    for (let i = 0; i < 5; i++) add(h, G.cone(0.015, 0.08 + (i === 2 ? 0.05 : 0), 4), M(c.metal, { m: 0.9, r: 0.3 }), [(i - 2) * 0.04, 0.16, 0.05]);
    // folded bat wings
    for (const s of [-1, 1]) {
      const wg = grp(P.spine, [s * 0.1, 0.45, -0.14], [0.3, s * 0.5, 0]);
      add(wg, G.cone(0.22, 0.6, 3), M('#2a0610', { ds: true }), [s * 0.12, -0.15, 0], [0, 0, s * 0.4], [1, 1, 0.1]);
    }
    const wR = WEAPONS.claw(c), wL = WEAPONS.claw(c);
    P.handR.add(wR); wR.rotation.x = Math.PI; P.handL.add(wL); wL.rotation.x = Math.PI;
    P.weaponR = wR; P.weaponL = wL;
    return P;
  },
  paladin() {
    const c = { cloth: '#6e6a62', torso: '#8c7a4c', armor: '#8c7a4c', metal: '#b39a5c', glow: '#ffe8a3', skin: '#bfae8c', leg: '#4a463e', arm: '#8c7a4c', fore: '#a08c58', hand: '#5a5040' };
    const P = rig({ c, h: 1.08, bw: 1.2, lw: 1.15, kneeGuard: true, pose: 'onehand' });
    const A = M(c.armor, { m: 0.8, r: 0.35 });
    add(P.spine, G.cyl(0.25, 0.19, 0.34, 6), A, [0, 0.37, 0], [0, Math.PI / 6, 0], [1, 1, 0.7]);
    pauldron(P, -1, A, 1.2); pauldron(P, 1, A, 1.2);
    add(P.hips, G.box(0.3, 0.55, 0.03), M('#d8d2c2', { ds: true }), [0, -0.3, 0.12]);
    add(P.hips, G.box(0.05, 0.3, 0.035), GLOW(c.glow, 1.2), [0, -0.3, 0.13]);
    const h = P.head;
    add(h, G.cyl(0.135, 0.13, 0.26, 7), A, [0, 0.01, 0]);
    add(h, G.box(0.03, 0.26, 0.05), M('#d6c486', { m: 0.9 }), [0, 0.07, 0.11]);
    add(h, G.box(0.18, 0.02, 0.04), M('#111'), [0, 0.02, 0.125]);
    add(h, G.box(0.02, 0.22, 0.2), M('#efe8d4'), [0, 0.2, -0.02]); // crest
    // broken halo
    const halo = add(h, G.tor(0.24, 0.02, 3, 18, Math.PI * 1.6), GLOW(c.glow, 2.4), [0, 0.12, -0.16], [0, 0, 0.6]);
    P.update.push((t) => { halo.rotation.z = 0.6 + Math.sin(t * 0.7) * 0.1; });
    cape(P, '#d8d2c2', 1.05, 0.5);
    const w = WEAPONS.spear(c); P.handR.add(w); w.rotation.set(2.6, 0, 0); w.position.set(0, -0.05, -0.1);
    const s = WEAPONS.shield(c); P.handL.add(s); s.position.set(-0.05, -0.05, 0.08); s.rotation.set(0, -Math.PI / 2, 0);
    P.weaponR = w; P.weaponL = s;
    return P;
  },
  plague() {
    const c = { cloth: '#1d1c19', torso: '#25231f', leather: '#2c2620', metal: '#6a6050', glow: '#a6ff4d', skin: '#1d1c19', leg: '#1a1916', arm: '#23211d', hand: '#2b2621' };
    const P = rig({ c, h: 1.04, bw: 0.95, lw: 0.9, pose: 'onehand' });
    add(P.hips, G.lathe([[0.2, 0.08], [0.26, -0.4], [0.3, -0.82]], 8), M('#1b1a17', { ds: true }), [0, 0, 0], [0, 0, 0], [1, 1, 0.85]);
    for (let i = 0; i < 3; i++) add(P.spine, G.box(0.42, 0.035, 0.27), M('#4a3a2a'), [0, 0.12 + i * 0.12, 0], [0, 0, 0.3]);
    for (let i = 0; i < 4; i++) add(P.hips, G.cyl(0.025, 0.025, 0.09, 5), GLOW(i % 2 ? c.glow : '#9a5cff', 1.8), [-0.15 + i * 0.1, 0.03, 0.14]);
    const h = P.head;
    add(h, G.ico(0.13, 0), M('#2b2620'), [0, 0, 0]);
    add(h, G.cone(0.07, 0.4, 5), M('#d6ccb4', { r: 0.6 }), [0, -0.05, 0.27], [Math.PI / 2 + 0.35, 0, 0]);
    add(h, G.cyl(0.04, 0.04, 0.02, 7), GLOW(c.glow, 3), [-0.05, 0.03, 0.12], [Math.PI / 2, 0, 0]);
    add(h, G.cyl(0.04, 0.04, 0.02, 7), GLOW(c.glow, 3), [0.05, 0.03, 0.12], [Math.PI / 2, 0, 0]);
    add(h, G.cyl(0.33, 0.35, 0.03, 8), M('#14130f'), [0, 0.1, 0]);
    add(h, G.cyl(0.13, 0.14, 0.18, 8), M('#14130f'), [0, 0.2, 0]);
    cape(P, '#141310', 0.9, 0.48);
    const w = WEAPONS.flask(c); P.handR.add(w); w.position.set(0, -0.08, 0.05);
    P.weaponR = w;
    return P;
  },
  voidcaller() {
    const c = { cloth: '#1b1030', torso: '#241540', metal: '#8a7ab0', glow: '#b17cff', skin: '#efeaf6', arm: '#21143a', hand: '#4a3a70' };
    const P = rig({ c, h: 1.05, bw: 0.85, lw: 0.8, noLegs: true, pose: 'cast' });
    robe(P, '#160c28', '#9a5cff', 0.32, 0.8);
    // wisps instead of feet
    for (let i = 0; i < 5; i++) {
      const wsp = add(P.hips, G.cone(0.06, 0.4, 4), M('#2a1650', { t: true, op: 0.7, e: '#4a1aa0', ei: 0.8 }), [Math.cos(i * 1.25) * 0.22, -0.95, Math.sin(i * 1.25) * 0.22], [Math.PI, 0, 0]);
      P.update.push((t) => { wsp.scale.y = 0.8 + Math.sin(t * 4 + i) * 0.25; });
    }
    P.hover = 0.18;
    const h = P.head;
    add(h, G.cone(0.2, 0.36, 6), M('#140a24', { r: 1 }), [0, 0.06, -0.04], [-0.2, 0, 0]);
    add(h, G.ico(0.115, 1), M(c.skin, { r: 0.3, m: 0.2 }), [0, -0.01, 0.03], [0, 0, 0], [0.9, 1.1, 0.8]);
    add(h, G.box(0.005, 0.14, 0.02), M('#000'), [0.02, 0.0, 0.13], [0, 0, 0.3]);
    eyes(h, c.glow, 0.02, 0.125, 0.04, 0.03, 0.008);
    for (const s of [-1, 1]) add(h, G.cone(0.025, 0.25, 4), M('#120a20'), [s * 0.09, 0.2, -0.04], [-0.3, 0, s * -0.4]);
    // void halo
    const halo = add(P.spine, G.tor(0.32, 0.03, 4, 20), M('#050208', { e: '#5a1fc0', ei: 0.9 }), [0, 0.72, -0.25]);
    P.update.push((t) => { halo.rotation.z = t * 0.5; });
    const orbs = grp(P.hips, [0, 0.4, 0]);
    for (let i = 0; i < 3; i++) add(orbs, G.ico(0.07, 0), M('#0a0512', { e: '#7a3aff', ei: 1.5 }), [Math.cos(i * 2.09) * 0.5, 0, Math.sin(i * 2.09) * 0.5]);
    P.update.push((t) => { orbs.rotation.y = -t * 1.4; });
    const fR = WEAPONS.orbhand(c), fL = WEAPONS.orbhand(c);
    P.handR.add(fR); P.handL.add(fL); P.weaponR = fR; P.weaponL = fL;
    return P;
  },
  werewolf() {
    const c = { cloth: '#3b2f26', torso: '#4a3a2e', leather: '#3a2b20', metal: '#666', glow: '#ff3a1a', skin: '#4a3a2e', leg: '#4a3a2e', arm: '#4a3a2e', hand: '#2e241c', claw: '#e8dcc0' };
    const P = rig({ c, h: 1.12, bw: 1.4, lw: 1.35, pose: 'claws' });
    P.spine.rotation.x = 0.35;
    const fur = M('#3a2d24', { r: 1 });
    add(P.spine, G.ico(0.32, 0), fur, [0, 0.4, -0.05], [0, 0, 0], [1.2, 1, 0.9]);
    for (let i = 0; i < 5; i++) add(P.spine, G.cone(0.06, 0.22, 4), M('#2a1f18'), [0, 0.55 - i * 0.1, -0.3 + i * 0.02], [-1.0, 0, 0]);
    add(P.hips, G.box(0.36, 0.25, 0.24), M('#2c2a2a'), [0, -0.15, 0]);
    // tail
    const tail = grp(P.hips, [0, 0, -0.15], [0.9, 0, 0]);
    add(tail, G.cone(0.08, 0.6, 5), fur, [0, -0.3, 0], [Math.PI, 0, 0]);
    P.update.push((t, s) => { tail.rotation.z = Math.sin(t * 3) * 0.25 * (1 + (s?.speed || 0) * 0.2); });
    // wolf head
    const h = P.head;
    h.position.z = 0.07;
    add(h, G.ico(0.15, 0), fur, [0, 0, 0], [0, 0, 0], [1, 0.95, 1.1]);
    add(h, G.box(0.11, 0.1, 0.22), fur, [0, -0.04, 0.16]);
    add(h, G.box(0.08, 0.05, 0.08), M('#1a1210'), [0, -0.01, 0.27]);
    add(h, G.box(0.1, 0.03, 0.2), M('#2a1a14'), [0, -0.1, 0.15]);
    for (let i = 0; i < 4; i++) add(h, G.cone(0.01, 0.04, 3), M('#fff'), [(i - 1.5) * 0.025, -0.08, 0.25], [Math.PI, 0, 0]);
    for (const s of [-1, 1]) add(h, G.cone(0.05, 0.16, 4), fur, [s * 0.08, 0.14, -0.02], [-0.2, 0, s * -0.3]);
    eyes(h, c.glow, 0.035, 0.12, 0.055, 0.035, 0.014);
    // torn bracers
    for (const s of [-1, 1]) add(s < 0 ? P.elL : P.elR, G.cyl(0.07, 0.065, 0.1, 5), M('#3a2b20'), [0, -0.18, 0]);
    const wR = WEAPONS.claw(c), wL = WEAPONS.claw(c);
    P.handR.add(wR); wR.rotation.x = Math.PI; P.handL.add(wL); wL.rotation.x = Math.PI;
    P.weaponR = wR; P.weaponL = wL;
    return P;
  },
  skeleton() {
    const c = { cloth: '#d9cfb4', torso: '#d9cfb4', metal: '#6b6b6b', glow: '#ff3b2b', skin: '#d9cfb4', leg: '#d9cfb4', arm: '#d9cfb4', fore: '#cfc5a8', hand: '#cfc5a8', pelvis: '#4a3a2a' };
    const P = rig({ c, h: 1.06, bw: 1.05, lw: 0.55, pose: 'dual' });
    P.chest.visible = false;
    const bone = M('#ddd3b8', { r: 0.9 });
    add(P.spine, G.cyl(0.04, 0.04, 0.5, 5), bone, [0, 0.26, -0.06]);
    for (let i = 0; i < 4; i++) add(P.spine, G.tor(0.15 - i * 0.012, 0.02, 3, 10, Math.PI * 1.4), bone, [0, 0.45 - i * 0.08, 0], [Math.PI / 2, 0, Math.PI * 0.8]);
    add(P.spine, G.ico(0.06, 0), GLOW(c.glow, 2.6), [0, 0.34, 0]).userData.flicker = true;
    add(P.hips, G.box(0.4, 0.3, 0.26), M('#4a3524', { r: 1 }), [0, -0.15, 0]);
    pauldron(P, 1, M('#5a5a5e', { m: 0.8, r: 0.35 }), 1.4, 2, M('#ddd3b8'));
    const h = P.head;
    add(h, G.ico(0.12, 1), bone, [0, 0.01, 0], [0, 0, 0], [0.95, 1.05, 1.05]);
    add(h, G.box(0.1, 0.06, 0.07), bone, [0, -0.11, 0.05]);
    add(h, G.box(0.045, 0.04, 0.02), M('#050505'), [-0.045, 0.01, 0.12]);
    add(h, G.box(0.045, 0.04, 0.02), M('#050505'), [0.045, 0.01, 0.12]);
    eyes(h, c.glow, 0.01, 0.13, 0.045, 0.018, 0.018);
    // viking helm
    add(h, G.ico(0.13, 0), M('#55575c', { m: 0.8, r: 0.35 }), [0, 0.07, -0.01], [0, 0, 0], [1.05, 0.75, 1.05]);
    for (const s of [-1, 1]) add(h, G.cone(0.04, 0.26, 5), M('#e8dcbc'), [s * 0.16, 0.14, 0], [0, 0, s * -0.9]);
    const wR = WEAPONS.axe(c), wL = WEAPONS.axe(c);
    P.handR.add(wR); wR.rotation.set(2.6, 0, 0); wR.position.set(0, -0.05, 0.02);
    P.handL.add(wL); wL.rotation.set(2.6, Math.PI, 0); wL.position.set(0, -0.05, 0.02);
    P.weaponR = wR; P.weaponL = wL;
    return P;
  },
  astrologer() {
    const c = { cloth: '#1a2147', torso: '#232c5e', metal: '#d4c48a', glow: '#bcd0ff', skin: '#e6d8cc', arm: '#1f2752', hand: '#e6d8cc' };
    const P = rig({ c, h: 1.0, bw: 0.85, lw: 0.8, noLegs: true, pose: 'staff' });
    const rb = robe(P, '#18204a', '#d4c48a', 0.36, 0.95);
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2, y = -Math.random() * 0.85;
      const r = 0.2 + (-y) * 0.17;
      add(rb, G.oct(0.012), GLOW('#ffffff', 3), [Math.cos(a) * r, y, Math.sin(a) * r * 0.85]);
    }
    const h = P.head;
    face(h, c.skin, '#d6e2ff');
    hair(h, '#e6e9ff', 'long');
    add(h, G.box(0.24, 0.03, 0.03), M(c.metal, { m: 0.9, r: 0.3 }), [0, 0.07, 0.1]);
    add(h, G.oct(0.03), GLOW('#bcd0ff', 3), [0, 0.07, 0.12]);
    // celestial rings
    const rings = grp(P.spine, [0, 0.7, -0.2]);
    add(rings, G.tor(0.3, 0.01, 3, 24), M(c.metal, { m: 0.9, r: 0.3 }), [0, 0, 0]);
    const r2 = add(rings, G.tor(0.36, 0.008, 3, 24), GLOW('#9fb8ff', 1.4), [0, 0, 0], [0.4, 0.3, 0]);
    for (let i = 0; i < 5; i++) add(rings, G.oct(0.025), GLOW('#ffffff', 3), [Math.cos(i * 1.26) * 0.3, Math.sin(i * 1.26) * 0.3, 0]);
    P.update.push((t) => { rings.rotation.z = t * 0.3; r2.rotation.y = t; });
    add(P.spine, G.box(0.3, 0.06, 0.26), M(c.metal, { m: 0.9, r: 0.35 }), [0, 0.06, 0]);
    const w = WEAPONS.starstaff(c); P.handR.add(w); w.position.set(0, -0.05, 0); w.rotation.x = 1.3; P.weaponR = w;
    return P;
  },
  dragonknight() {
    const c = { cloth: '#3a1410', torso: '#4a1c14', armor: '#5a2a1c', metal: '#9a6a40', glow: '#ff8a1f', skin: '#2a1410', leg: '#2a1410', arm: '#4a1c14', fore: '#5a2a1c', hand: '#2a1410' };
    const P = rig({ c, h: 1.1, bw: 1.3, lw: 1.25, kneeGuard: true, pose: 'twohand' });
    const A = M('#3a1a12', { m: 0.6, r: 0.4 });
    // scale plates
    for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) add(P.spine, G.cone(0.06, 0.12, 3), A, [(i - 1.5) * 0.09, 0.5 - r * 0.1, 0.13], [-0.4, 0, Math.PI], [1, 1, 0.4]);
    pauldron(P, -1, A, 1.3, 3, M('#1a0a08')); pauldron(P, 1, A, 1.3, 3, M('#1a0a08'));
    const h = P.head;
    add(h, G.ico(0.14, 0), A, [0, 0.01, 0], [0, 0, 0], [1, 1, 1.1]);
    add(h, G.cone(0.08, 0.2, 4), A, [0, -0.02, 0.17], [Math.PI / 2, Math.PI / 4, 0], [1, 1, 0.6]);
    add(h, G.box(0.17, 0.02, 0.04), GLOW(c.glow, 3.5), [0, 0.02, 0.12]);
    for (const s of [-1, 1]) {
      add(h, G.cone(0.04, 0.32, 5), M('#1e0f0a'), [s * 0.1, 0.1, -0.12], [-1.2, 0, s * -0.25]);
      add(h, G.cone(0.025, 0.2, 5), M('#1e0f0a'), [s * 0.15, 0.02, -0.08], [-1.4, 0, s * -0.6]);
    }
    // wings
    for (const s of [-1, 1]) {
      const wg = grp(P.spine, [s * 0.12, 0.45, -0.15], [0.2, s * -0.5, s * 0.3]);
      add(wg, G.cyl(0.02, 0.015, 0.7, 4), M('#1e0f0a'), [s * 0.3, 0.12, 0], [0, 0, s * -1.2]);
      const mem = add(wg, G.cone(0.42, 0.75, 3), M('#5a1a0e', { ds: true, e: '#300800', ei: 1 }), [s * 0.3, -0.12, 0], [0, 0, s * -0.6], [1, 1, 0.06]);
      P.update.push((t) => { wg.rotation.y = s * (-0.5 + Math.sin(t * 1.6) * 0.08); });
    }
    const tail = grp(P.hips, [0, 0, -0.15], [1.1, 0, 0]);
    add(tail, G.cone(0.09, 0.8, 5), A, [0, -0.4, 0], [Math.PI, 0, 0]);
    P.update.push((t) => { tail.rotation.z = Math.sin(t * 2) * 0.2; });
    const w = WEAPONS.glaive(c); P.handR.add(w); w.rotation.set(2.5, 0, 0); w.position.set(0, -0.05, -0.15);
    P.weaponR = w;
    return P;
  },
  illusionist() {
    const c = { cloth: '#e9e0f0', torso: '#d9c8e8', metal: '#e8c86a', glow: '#ff9ce8', skin: '#efe6ea', leg: '#3a2e46', arm: '#d9c8e8', hand: '#efe6ea' };
    const P = rig({ c, h: 1.0, bw: 0.85, lw: 0.8, pose: 'dual' });
    add(P.hips, G.lathe([[0.18, 0.06], [0.24, -0.35], [0.32, -0.7]], 8), M('#cdb8e0', { ds: true }), [0, 0, 0]);
    add(P.spine, G.box(0.4, 0.05, 0.26), M(c.metal, { m: 0.9, r: 0.3 }), [0, 0.05, 0]);
    const h = P.head;
    hair(h, '#3a1e4a', 'long');
    add(h, G.ico(0.12, 1), M('#f4f0f6', { m: 0.5, r: 0.15 }), [0, 0, 0.01], [0, 0, 0], [0.92, 1.1, 0.95]);
    add(h, G.box(0.006, 0.24, 0.02), M(c.metal, { m: 1, r: 0.2 }), [0, 0, 0.125]);
    eyes(h, c.glow, 0.02, 0.118, 0.042, 0.03, 0.01);
    add(h, G.tor(0.1, 0.01, 3, 12), M(c.metal, { m: 1, r: 0.2 }), [0, 0.12, 0], [Math.PI / 2, 0, 0]);
    // floating mirror shards
    const shards = grp(P.spine, [0, 0.35, 0]);
    for (let i = 0; i < 5; i++) {
      const s = add(shards, G.oct(0.09), M('#f0e8ff', { m: 1, r: 0.05, e: '#a050c0', ei: 0.35 }), [Math.cos(i * 1.26) * 0.55, Math.sin(i * 2) * 0.2, Math.sin(i * 1.26) * 0.55], [0, i, 0], [0.5, 1.3, 0.12]);
    }
    P.update.push((t) => { shards.rotation.y = t * 0.7; shards.children.forEach((s, i) => s.rotation.y = t * 2 + i); });
    cape(P, '#b89ad0', 0.85, 0.4, false);
    const wR = WEAPONS.dagger(c), wL = WEAPONS.dagger(c);
    P.handR.add(wR); wR.rotation.set(2.9, 0, 0); wR.position.set(0, -0.05, 0.02);
    P.handL.add(wL); wL.rotation.set(2.9, 0, 0); wL.position.set(0, -0.05, 0.02);
    P.weaponR = wR; P.weaponL = wL;
    return P;
  },
  raven() {
    const c = { cloth: '#14151f', torso: '#1a1c2a', metal: '#5c6bc0', glow: '#7d8cff', skin: '#14151f', leg: '#13141c', arm: '#1a1c2a', hand: '#262838', wood: '#1a1a22' };
    const P = rig({ c, h: 1.04, bw: 0.95, lw: 0.9, pose: 'bow' });
    const feather = M('#151827', { r: 0.6, m: 0.3, ds: true });
    // feather mantle
    for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) {
      const a = (i / 8 - 0.5) * 3.2;
      add(P.spine, G.cone(0.05, 0.3, 3), feather, [Math.sin(a) * (0.24 + r * 0.03), 0.55 - r * 0.13, Math.cos(a) * 0.17 * (1 + r * 0.1) - 0.02], [Math.PI - 0.3, a, 0], [1, 1, 0.3]);
    }
    add(P.hips, G.lathe([[0.2, 0.06], [0.27, -0.35], [0.32, -0.75]], 9), feather, [0, 0, 0]);
    // raven skull helm
    const h = P.head;
    add(h, G.cone(0.19, 0.38, 6), M('#10111a', { r: 1 }), [0, 0.06, -0.04], [-0.3, 0, 0]);
    add(h, G.ico(0.11, 0), M('#d8d0bc'), [0, 0.01, 0.04]);
    add(h, G.cone(0.05, 0.3, 4), M('#2a2a30', { m: 0.6, r: 0.3 }), [0, -0.04, 0.24], [Math.PI / 2 + 0.25, 0, 0]);
    eyes(h, c.glow, 0.03, 0.125, 0.045, 0.025, 0.02);
    // crow on shoulder
    const crow = grp(P.shL, [-0.04, 0.12, 0]);
    add(crow, G.ico(0.06, 0), M('#0c0c12'), [0, 0, 0], [0, 0, 0], [1, 0.9, 1.4]);
    add(crow, G.ico(0.04, 0), M('#0c0c12'), [0, 0.06, 0.06]);
    add(crow, G.cone(0.012, 0.06, 3), M('#333'), [0, 0.055, 0.11], [Math.PI / 2, 0, 0]);
    add(crow, G.box(0.01, 0.01, 0.01), GLOW('#7d8cff', 3), [0.02, 0.07, 0.09]);
    P.update.push((t) => { crow.rotation.y = Math.sin(t * 0.9) * 0.6; });
    const w = WEAPONS.bow(c); P.handL.add(w); w.rotation.set(Math.PI / 2, -Math.PI / 2, 0); w.position.set(0, -0.04, 0);
    P.weaponL = w;
    return P;
  },
  runesmith() {
    const c = { cloth: '#3a2a1e', torso: '#4a3524', leather: '#5a3a22', metal: '#5f6a72', glow: '#4fc3f7', skin: '#c89a78', leg: '#2b241e', arm: '#c89a78', fore: '#5f6a72', hand: '#3a2a1e' };
    const P = rig({ c, h: 0.9, bw: 1.55, lw: 1.55, kneeGuard: true, pose: 'twohand' });
    // apron + armor
    add(P.spine, G.box(0.34, 0.5, 0.03), M('#5a3a22'), [0, 0.26, 0.13]);
    for (let i = 0; i < 3; i++) add(P.spine, G.box(0.06, 0.06, 0.02), GLOW(c.glow, 2.4), [(i - 1) * 0.1, 0.3, 0.145], [0, 0, Math.PI / 4]);
    pauldron(P, -1, M(c.metal, { m: 0.8, r: 0.35 }), 1.5, 0); pauldron(P, 1, M(c.metal, { m: 0.8, r: 0.35 }), 1.5, 0);
    const h = P.head;
    face(h, c.skin, '#8fe3ff', { brow: false });
    // beard braids
    add(h, G.cone(0.14, 0.38, 6), M('#b4502a', { r: 0.9 }), [0, -0.18, 0.06], [Math.PI + 0.15, 0, 0]);
    for (const s of [-1, 1]) add(h, G.cyl(0.02, 0.02, 0.06, 5), M(c.metal, { m: 0.9 }), [s * 0.06, -0.28, 0.09]);
    add(h, G.ico(0.14, 0), M(c.metal, { m: 0.8, r: 0.35 }), [0, 0.08, -0.01], [0, 0, 0], [1.05, 0.7, 1.05]);
    add(h, G.box(0.04, 0.12, 0.17), M(c.metal, { m: 0.9 }), [0, 0.06, 0.08]);
    add(h, G.box(0.18, 0.025, 0.02), GLOW(c.glow, 2), [0, 0.11, 0.115]);
    const w = WEAPONS.hammer(c); P.handR.add(w); w.rotation.set(2.45, 0, 0); w.position.set(0, -0.05, 0.02);
    P.weaponR = w;
    return P;
  },
  fallen() {
    const c = { cloth: '#1a1610', torso: '#2a2418', armor: '#2a2418', metal: '#c9a24a', glow: '#ffd54f', skin: '#e8dcc8', leg: '#1e1a12', arm: '#2a2418', fore: '#3a3020', hand: '#e8dcc8' };
    const P = rig({ c, h: 1.08, bw: 0.95, lw: 0.9, pose: 'onehand' });
    P.hover = 0.12;
    const A = M('#1f1b14', { m: 0.85, r: 0.3 });
    add(P.spine, G.cyl(0.21, 0.16, 0.32, 6), A, [0, 0.38, 0], [0, Math.PI / 6, 0], [1, 1, 0.68]);
    add(P.spine, G.box(0.02, 0.3, 0.02), GLOW(c.glow, 1.6), [0, 0.38, 0.15]);
    pauldron(P, -1, M(c.metal, { m: 0.9, r: 0.3 }), 1.0); pauldron(P, 1, M(c.metal, { m: 0.9, r: 0.3 }), 1.0);
    add(P.hips, G.lathe([[0.18, 0.05], [0.24, -0.4], [0.3, -0.72]], 8), M('#15120c', { ds: true }), [0, 0, 0]);
    const h = P.head;
    face(h, c.skin, '#ffeaa0');
    hair(h, '#f2ecd8', 'long');
    const halo = add(h, G.tor(0.18, 0.018, 3, 18, Math.PI * 1.5), GLOW(c.glow, 3), [0, 0.22, -0.02], [Math.PI / 2 - 0.2, 0, 0]);
    P.update.push((t) => { halo.rotation.z = t * 0.6; });
    // great wings
    for (const s of [-1, 1]) {
      const wg = grp(P.spine, [s * 0.1, 0.45, -0.15]);
      for (let i = 0; i < 7; i++) {
        const len = 0.5 + i * 0.12;
        add(wg, G.box(0.08, len, 0.02), M(i % 2 ? '#2a241a' : '#1a160f', { m: 0.3 }), [s * (0.15 + i * 0.09), 0.1 + i * 0.03 - len / 2 + 0.25, -0.02 * i], [0, 0, s * (0.2 + i * 0.12)]);
        add(wg, G.box(0.012, len * 0.9, 0.025), GLOW(c.glow, 1.2), [s * (0.15 + i * 0.09 + 0.04), 0.1 + i * 0.03 - len / 2 + 0.25, -0.02 * i], [0, 0, s * (0.2 + i * 0.12)]);
      }
      wg.rotation.y = s * -0.4;
      P.update.push((t, st) => { wg.rotation.z = s * (Math.sin(t * (st?.glide ? 8 : 1.4)) * (st?.glide ? 0.35 : 0.06)); });
    }
    const w = WEAPONS.sword(c); P.handR.add(w); w.rotation.set(2.5, 0, 0); w.position.set(0, -0.05, 0.02);
    P.weaponR = w;
    return P;
  },
  bogwitch() {
    const c = { cloth: '#2c3a22', torso: '#33452a', leather: '#3a3020', metal: '#7a6a40', glow: '#9dff6a', skin: '#7a9a6a', arm: '#33452a', hand: '#7a9a6a' };
    const P = rig({ c, h: 0.98, bw: 0.9, lw: 0.85, noLegs: true, pose: 'staff' });
    P.spine.rotation.x = 0.2;
    robe(P, '#26321e', '#7bc96f', 0.4, 0.95);
    // moss cloak with hanging strands
    const moss = M('#3e5a2a', { r: 1 });
    for (let i = 0; i < 8; i++) add(P.spine, G.cone(0.05, 0.4, 3), moss, [(i - 3.5) * 0.06, 0.32, -0.15 + Math.abs(i - 3.5) * 0.02], [Math.PI, 0, 0], [1, 1, 0.5]);
    add(P.spine, G.ico(0.26, 0), moss, [0, 0.5, -0.05], [0, 0, 0], [1.1, 0.6, 0.9]);
    // mushrooms
    for (const [x, y, z, s] of [[0.2, 0.62, 0.02, 1], [-0.18, 0.6, -0.04, 0.7], [0.1, 0.65, -0.15, 0.6]]) {
      add(P.spine, G.cyl(0.015, 0.02, 0.06, 4), M('#ddd'), [x, y, z]);
      add(P.spine, G.cone(0.06 * s, 0.05 * s, 6), GLOW('#9dff6a', 0.9), [x, y + 0.04, z]);
    }
    const h = P.head;
    face(h, c.skin, '#d4ff6a');
    hair(h, '#1e2614', 'long');
    add(h, G.cone(0.025, 0.08, 4), M(c.skin), [0, -0.01, 0.15], [1.6, 0, 0]); // long nose
    // antlers
    for (const s of [-1, 1]) {
      const a = grp(h, [s * 0.08, 0.12, -0.02], [0, 0, s * -0.4]);
      add(a, G.cyl(0.015, 0.02, 0.3, 4), M('#4a3a24'), [0, 0.15, 0]);
      add(a, G.cyl(0.01, 0.015, 0.14, 4), M('#4a3a24'), [s * 0.05, 0.2, 0], [0, 0, s * -0.8]);
      add(a, G.cyl(0.01, 0.015, 0.12, 4), M('#4a3a24'), [s * -0.03, 0.26, 0], [0, 0, s * 0.6]);
    }
    const w = WEAPONS.vinestaff(c); P.handR.add(w); w.position.set(0, -0.05, 0); w.rotation.x = 1.3; P.weaponR = w;
    return P;
  },
};

BUILDERS.dummy = function () {
  const c = { cloth: '#8a7a50', torso: '#9a8858', leg: '#5a4630', arm: '#9a8858', hand: '#9a8858', skin: '#b8a070', metal: '#666', glow: '#ff3b3b' };
  const P = rig({ c, h: 1.0, bw: 1.15, lw: 1.1, noLegs: true, pose: 'cast' });
  const wood = M('#4a3624', { r: 1 });
  add(P.root, G.cyl(0.07, 0.08, 1.2, 5), wood, [0, 0.6, 0]);
  add(P.root, G.box(0.9, 0.1, 0.9), M('#3a2a1c'), [0, 0.05, 0]);
  add(P.spine, G.box(0.9, 0.07, 0.07), wood, [0, 0.45, 0]);
  const h = P.head;
  add(h, G.ico(0.15, 0), M('#c8b080', { r: 1 }), [0, 0, 0]);
  add(h, G.box(0.07, 0.02, 0.02), GLOW('#ff3b3b', 2), [-0.05, 0.02, 0.14], [0, 0, 0.5]);
  add(h, G.box(0.07, 0.02, 0.02), GLOW('#ff3b3b', 2), [-0.05, 0.02, 0.14], [0, 0, -0.5]);
  add(h, G.box(0.07, 0.02, 0.02), GLOW('#ff3b3b', 2), [0.05, 0.02, 0.14], [0, 0, 0.5]);
  add(h, G.box(0.07, 0.02, 0.02), GLOW('#ff3b3b', 2), [0.05, 0.02, 0.14], [0, 0, -0.5]);
  for (let i = 0; i < 6; i++) add(P.spine, G.cone(0.03, 0.18, 3), M('#d8c088'), [(i - 2.5) * 0.08, 0.02, 0.1], [Math.PI + 0.3, 0, (i - 2.5) * 0.15]);
  // target rings on chest
  add(P.spine, G.tor(0.12, 0.018, 3, 14), GLOW('#ff3b3b', 1.2), [0, 0.3, 0.15]);
  add(P.spine, G.tor(0.05, 0.018, 3, 10), GLOW('#ff3b3b', 1.2), [0, 0.3, 0.15]);
  return P;
};

const POSES = {
  // [shR.x, shR.z, elR.x, shL.x, shL.z, elL.x]
  twohand: [-0.55, -0.15, -1.2, -0.75, 0.55, -1.1],
  onehand: [-0.35, -0.1, -0.9, -0.5, 0.25, -1.1],
  dual: [-0.3, -0.25, -1.3, -0.3, 0.25, -1.3],
  staff: [-0.3, -0.15, -1.0, 0.05, 0.12, -0.4],
  bow: [-0.5, -0.4, -1.5, -1.3, 0.2, -0.1],
  claws: [-0.6, -0.3, -1.4, -0.6, 0.3, -1.4],
  cast: [-0.5, -0.2, -1.2, -0.5, 0.2, -1.2],
};

export function buildHero(heroDef, { teamColor = null } = {}) {
  const P = BUILDERS[heroDef.model]();
  P.def = heroDef;
  P.pose = POSES[P.spec.pose] || POSES.onehand;
  P.root.userData.hero = heroDef.id;
  P.anim = { phase: 0, atk: 9, atkSlot: 'lmb', cast: 9, dead: 0, hurt: 0 };
  P.baseSpine = P.spine.rotation.x;
  P.root.traverse(o => { if (o.isMesh) o.userData.baseMat = o.material; });
  applyPose(P, 0);
  return P;
}

// Give an instance its own materials so it can fade (invisibility / death).
export function ownMaterials(P) {
  P.root.traverse(o => {
    if (o.isMesh) {
      o.material = o.material.clone();
      o.userData.baseOpacity = o.material.opacity;
      o.userData.baseTransparent = o.material.transparent;
    }
  });
  P.ownMats = true;
}
export function setOpacity(P, a) {
  if (!P.ownMats) return;
  if (P._op === a) return;
  P._op = a;
  P.root.traverse(o => {
    if (!o.isMesh) return;
    const m = o.material;
    if (a >= 0.999) { m.transparent = o.userData.baseTransparent; m.opacity = o.userData.baseOpacity; m.depthWrite = !o.userData.baseTransparent; }
    else { m.transparent = true; m.opacity = o.userData.baseOpacity * a; m.depthWrite = false; }
    m.needsUpdate = true;
  });
}

function applyPose(P, k) {
  const [a, b, c2, d, e, f] = P.pose;
  P.shR.rotation.set(a, 0, b); P.elR.rotation.set(c2, 0, 0);
  P.shL.rotation.set(d, 0, e); P.elL.rotation.set(f, 0, 0);
}

// s: {speed, onGround, vy, alive, glide, giant, t}
export function animateHero(P, s, dt) {
  const A = P.anim;
  const t = s.t;
  A.atk += dt; A.cast += dt;
  if (!s.alive) A.dead = Math.min(1, A.dead + dt * 2.2); else A.dead = Math.max(0, A.dead - dt * 4);
  const mv = Math.min(1, s.speed / 6);
  A.phase += dt * (3 + s.speed * 1.35);
  const sw = Math.sin(A.phase);
  const air = !s.onGround;
  // legs
  const legAmp = air ? 0 : 0.75 * mv;
  P.legL.rotation.x = air ? -0.5 : sw * legAmp;
  P.legR.rotation.x = air ? 0.2 : -sw * legAmp;
  P.kneeL.rotation.x = air ? 0.9 : Math.max(0, -Math.cos(A.phase) * 0.9 * mv) + 0.05;
  P.kneeR.rotation.x = air ? 0.4 : Math.max(0, Math.cos(A.phase) * 0.9 * mv) + 0.05;
  const breathe = Math.sin(t * 2.1) * 0.02;
  P.hips.position.y = 0.95 + (P.hover || 0) + (P.hover ? Math.sin(t * 2) * 0.05 : 0) + (air ? 0 : Math.abs(Math.cos(A.phase)) * 0.04 * mv) + breathe * 0.5;
  P.spine.rotation.x = P.baseSpine + 0.12 * mv + breathe;
  P.spine.rotation.y = Math.sin(A.phase) * 0.08 * mv;
  P.head.rotation.x = -(s.pitch || 0) * 0.5;
  if (P.robe) { P.robe.rotation.x = -0.15 * mv; P.robe.scale.x = 1 + Math.sin(A.phase * 2) * 0.03 * mv; }

  // arms
  applyPose(P, 0);
  const armSwing = sw * 0.35 * mv;
  P.shR.rotation.x += -armSwing * 0.4;
  P.shL.rotation.x += armSwing * 0.4;
  P.shR.rotation.x += breathe; P.shL.rotation.x -= breathe;
  const pose = P.spec.pose;
  // attack animation
  const atkDur = 0.34;
  if (A.atk < atkDur) {
    const k = A.atk / atkDur;
    const e = Math.sin(k * Math.PI);
    if (pose === 'twohand' || pose === 'onehand') {
      const wind = k < 0.35 ? k / 0.35 : 1 - (k - 0.35) / 0.65;
      P.shR.rotation.x = -2.6 * (k < 0.35 ? wind : 1) + (k >= 0.35 ? (k - 0.35) / 0.65 * 3.0 : 0);
      P.shR.rotation.z = -0.3;
      P.spine.rotation.y += (k < 0.35 ? -0.5 * wind : -0.5 + (k - 0.35) / 0.65 * 1.0);
      if (pose === 'twohand') { P.shL.rotation.x = P.shR.rotation.x * 0.9; P.shL.rotation.z = 0.6; }
    } else if (pose === 'dual' || pose === 'claws') {
      const side = (A.swingSide = A.swingSide ?? 1);
      const sh = side > 0 ? P.shR : P.shL;
      sh.rotation.x = -1.6 - e * 0.6;
      sh.rotation.z += (side > 0 ? 0.6 : -0.6) * (k * 2 - 1);
      P.spine.rotation.y += side * 0.4 * (k - 0.5);
    } else if (pose === 'bow') {
      P.shR.rotation.x = -1.5; P.shR.rotation.z = -0.1;
      P.elR.rotation.x = -1.9 + e * 0.8;
      P.shL.rotation.x = -1.55;
    } else {
      P.shR.rotation.x = -1.5 - e * 0.4;
      if (pose === 'cast') P.shL.rotation.x = -1.5 - e * 0.4;
      P.elR.rotation.x = -0.4;
    }
  } else if (pose === 'bow' && s.aiming) {
    P.shR.rotation.x = -1.5; P.elR.rotation.x = -1.9; P.shL.rotation.x = -1.55;
  }
  if (A.cast < 0.45) {
    const e = Math.sin((A.cast / 0.45) * Math.PI);
    P.shL.rotation.x = Math.min(P.shL.rotation.x, -1.2 * e - 0.3);
    P.shL.rotation.z += 0.3 * e;
    P.spine.rotation.x -= 0.15 * e;
  }
  if (air && A.atk > atkDur) { P.shR.rotation.z -= 0.25; P.shL.rotation.z += 0.25; }

  // capes
  for (const segs of P.capes) {
    segs.forEach((seg, i) => {
      seg.rotation.x = (i === 0 ? 0.12 + 0.55 * mv + (air ? (s.vy > 0 ? -0.2 : 0.6) : 0) : 0.12 * mv) + Math.sin(t * 3 + i * 0.9) * (0.05 + 0.08 * mv);
    });
  }
  // flicker & extras
  for (const fn of P.update) fn(t, s);
  if (!P._flick) { P._flick = []; P.root.traverse(o => { if (o.userData.flicker) P._flick.push(o); if (o.userData.spin) P._flick.push(o); }); }
  for (const o of P._flick) {
    if (o.userData.flicker) o.scale.setScalar(1 + Math.sin(t * 13 + o.id) * 0.08 + Math.sin(t * 7.3) * 0.05);
    if (o.userData.spin) o.rotation.y = t * o.userData.spin;
  }
  // death: topple
  P.body.rotation.x = -A.dead * 1.45;
  P.body.position.y = -A.dead * 0.25;
  const gs = s.giant ? 1.4 : 1;
  const cur = P.root.scale.x;
  P.root.scale.setScalar(cur + (gs - cur) * Math.min(1, dt * 6));
}

export function triggerAttack(P, slot) {
  if (slot === 'lmb') { P.anim.atk = 0; P.anim.swingSide = -(P.anim.swingSide || 1); }
  else P.anim.cast = 0;
}

export { G, add, grp, GLOW };
