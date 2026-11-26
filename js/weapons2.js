// Remodelled weapons. Same contract as the originals: built along +Y from the grip at the
// origin. Guns: barrel along +Y, top of the gun toward +Z, handle toward -Z, with a 'muzzle'
// Object3D (and a spinning 'barrel' group on rotary guns). Blades get real bevelled edges.
import * as THREE from 'three';
import { M, G, add, grp, GLOW } from './models.js';

// ---------- geometry helpers ----------
// side-profile shape in (y, z) extruded along X, centred on x = 0
const PROFILE_M = new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1);
function profile(pts, thick, bevel = 0.006) {
  const sh = new THREE.Shape(); pts.forEach(([y, z], i) => (i ? sh.lineTo(y, z) : sh.moveTo(y, z))); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: Math.max(0.001, thick - bevel * 2), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 2, curveSegments: 6 });
  g.translate(0, 0, -(thick - bevel * 2) / 2);
  g.applyMatrix4(PROFILE_M);
  g.computeVertexNormals();
  return g;
}
// rounded rectangle profile
function rrect(y0, z0, y1, z1, r) {
  const pts = [], n = 4;
  const corner = (cy, cz, a0) => { for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * Math.PI / 2; pts.push([cy + Math.cos(a) * r, cz + Math.sin(a) * r]); } };
  corner(y1 - r, z1 - r, 0); corner(y0 + r, z1 - r, Math.PI / 2); corner(y0 + r, z0 + r, Math.PI); corner(y1 - r, z0 + r, Math.PI * 1.5);
  return pts;
}
// blade in the X-Y plane (flat side facing Z), bevelled to a cutting edge
function bladeGeo(len, w, tip, th, o = {}) {
  const sh = new THREE.Shape();
  const curve = o.curve || 0, taper = o.taper ?? 0.85;
  sh.moveTo(-w / 2, 0);
  sh.quadraticCurveTo(-w / 2 * (1 + taper) / 2 + curve * 0.5, (len - tip) / 2, -w / 2 * taper + curve, len - tip);
  sh.quadraticCurveTo(-w * 0.12 + curve * 1.2, len - tip * 0.35, curve * 1.4, len);
  sh.quadraticCurveTo(w / 2 * taper * 0.7 + curve, len - tip * 0.6, w / 2 * taper + curve, len - tip);
  sh.quadraticCurveTo(w / 2 * (1 + taper) / 2 + curve * 0.5, (len - tip) / 2, w / 2, 0);
  sh.closePath();
  const bev = Math.min(w * 0.42, th * 2.2);
  const g = new THREE.ExtrudeGeometry(sh, { depth: th * 0.25, bevelEnabled: true, bevelThickness: th * 0.5, bevelSize: bev, bevelOffset: -bev, bevelSegments: 1, curveSegments: 10 });
  g.translate(0, 0, -th * 0.125);
  g.computeVertexNormals();
  return g;
}
const cylY = (r0, r1, h, seg = 12) => new THREE.CylinderGeometry(r1, r0, h, seg);
const lathe = (pts, seg = 16) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
const smooth = (m) => { const k = m.clone(); k.flatShading = false; k.needsUpdate = true; k.userData = { smooth: true }; return k; };

// ---------- materials ----------
const steel = (c) => smooth(M(c.metal || '#5a5a60', { m: 0.88, r: 0.28 }));
const dark = () => smooth(M('#1b1b20', { m: 0.6, r: 0.45 }));
const black = () => smooth(M('#121216', { m: 0.4, r: 0.6 }));
const wood = () => smooth(M('#4a2c18', { r: 0.62, m: 0.05 }));
const leather = () => smooth(M('#2a1a12', { r: 0.9 }));
const brass = () => smooth(M('#b8913a', { m: 0.92, r: 0.28 }));
const edge = (tint = '#c8ccd6') => smooth(M(tint, { m: 0.95, r: 0.16 }));
const glow = (c, i = 2.4) => GLOW(c.glow || c, i);
const muzzleAt = (g, y, z) => { const m = new THREE.Object3D(); m.position.set(0, y, z); m.name = 'muzzle'; g.add(m); g.muzzle = m; return m; };

// wrapped grip: leather core with raised cord rings
function wrappedGrip(g, y0, len, r, mat = leather(), ring = dark()) {
  add(g, cylY(r, r * 0.92, len, 10), mat, [0, y0 + len / 2, 0]);
  const n = Math.max(3, Math.round(len / 0.035));
  for (let i = 0; i < n; i++) add(g, new THREE.TorusGeometry(r * 1.02, r * 0.18, 4, 10), ring, [0, y0 + (i + 0.5) * len / n, 0], [Math.PI / 2, 0, i * 0.4]);
}

export const REMODEL = {
  // ================= guns =================
  pistol(c, o = {}) {
    const g = new THREE.Group();
    const L = o.long ? 0.12 : 0;
    // grip: raked, with a textured panel
    add(g, profile([[-0.07, -0.005], [-0.105, -0.15], [-0.035, -0.158], [0.012, -0.01]], 0.046, 0.008), black(), [0, 0, 0]);
    add(g, profile([[-0.075, -0.03], [-0.098, -0.135], [-0.045, -0.14], [-0.016, -0.03]], 0.05, 0.003), wood(), [0, 0, 0]);
    // frame + trigger guard
    add(g, profile([[-0.07, -0.022], [0.19 + L * 0.5, -0.022], [0.2 + L * 0.5, 0.0], [-0.075, 0.0]], 0.04, 0.004), dark(), [0, 0, 0]);
    add(g, new THREE.TorusGeometry(0.03, 0.005, 5, 12, Math.PI), dark(), [0, 0.03, -0.028], [Math.PI / 2, Math.PI / 2, 0]);
    add(g, G.box(0.006, 0.008, 0.026), steel(c), [0, 0.025, -0.032], [0.4, 0, 0]);
    // slide with serrations and an ejection port
    const slide = grp(g); slide.name = 'slide';
    add(slide, profile(rrect(-0.075, 0.0, 0.215 + L, 0.052, 0.008), 0.044, 0.004), steel(c), [0, 0, 0]);
    for (let i = 0; i < 6; i++) add(slide, G.box(0.046, 0.005, 0.034), dark(), [0, -0.06 + i * 0.009, 0.028]);
    add(slide, G.box(0.046, 0.05, 0.016), black(), [0.004, 0.06, 0.04]);
    if (o.drum) add(g, cylY(0.042, 0.042, 0.07, 12), brass(), [0, 0.08, 0.03]);
    // barrel crown, sights, rune inlay
    add(g, cylY(0.012, 0.012, 0.03, 10), black(), [0, 0.225 + L, 0.026]);
    add(slide, G.box(0.03, 0.012, 0.012), black(), [0, -0.068, 0.058]);
    add(slide, G.box(0.006, 0.012, 0.012), glow(c, 3), [0, 0.2 + L, 0.058]);
    add(slide, G.box(0.003, 0.2 + L, 0.006), glow(c, 2.4), [0.023, 0.07 + L / 2, 0.026]);
    add(slide, G.box(0.003, 0.2 + L, 0.006), glow(c, 2.4), [-0.023, 0.07 + L / 2, 0.026]);
    // hammer
    add(g, G.box(0.012, 0.016, 0.03), steel(c), [0, -0.082, 0.05], [-0.5, 0, 0]);
    muzzleAt(g, 0.245 + L, 0.026);
    return g;
  },

  rifle(c, o = {}) {
    const g = new THREE.Group();
    const S = o.short ? 0.72 : 1;
    // stock with a cheek rest and a butt plate
    add(g, profile([[-0.12, 0.05], [-0.56, 0.035], [-0.58, -0.11], [-0.5, -0.115], [-0.26, -0.035], [-0.12, -0.03]], 0.05, 0.01), wood(), [0, 0, 0]);
    add(g, profile([[-0.565, 0.04], [-0.59, 0.04], [-0.6, -0.115], [-0.575, -0.118]], 0.054, 0.004), black(), [0, 0, 0]);
    add(g, profile([[-0.38, 0.05], [-0.2, 0.052], [-0.2, 0.075], [-0.38, 0.07]], 0.044, 0.006), wood(), [0, 0, 0]);
    // receiver
    add(g, profile(rrect(-0.13, -0.025, 0.28, 0.062, 0.012), 0.062, 0.006), steel(c), [0, 0, 0]);
    add(g, G.box(0.064, 0.09, 0.018), black(), [0.003, 0.09, 0.045]);
    const bolt = grp(g, [0, 0, 0]); bolt.name = 'slide';
    add(bolt, cylY(0.008, 0.008, 0.035, 6), steel(c), [0.04, 0.1, 0.04], [0, 0, Math.PI / 2]);
    add(bolt, G.ico(0.011, 1), steel(c), [0.058, 0.1, 0.04]);
    // pistol grip + trigger
    add(g, profile([[-0.01, -0.02], [-0.05, -0.135], [0.01, -0.142], [0.04, -0.02]], 0.045, 0.007), black(), [0, 0, 0]);
    add(g, new THREE.TorusGeometry(0.03, 0.005, 5, 12, Math.PI), dark(), [0, 0.07, -0.04], [Math.PI / 2, Math.PI / 2, 0]);
    // magazine (curved)
    add(g, profile([[0.085, -0.02], [0.07, -0.1], [0.1, -0.175], [0.155, -0.165], [0.14, -0.09], [0.15, -0.02]], 0.04, 0.005), dark(), [0, 0, 0]);
    // handguard with vents and a top rail
    const hg = 0.28 + 0.42 * S;
    add(g, profile(rrect(0.27, -0.028, hg, 0.05, 0.012), 0.058, 0.006), o.short ? wood() : dark(), [0, 0, 0]);
    for (let i = 0; i < Math.round(5 * S); i++) add(g, G.box(0.06, 0.03, 0.012), black(), [0, 0.32 + i * 0.075, 0.01]);
    add(g, G.box(0.03, hg - 0.12, 0.012), black(), [0, (hg + 0.12) / 2 - 0.0, 0.068]);
    for (let i = 0; i < Math.round(9 * S); i++) add(g, G.box(0.036, 0.01, 0.008), steel(c), [0, 0.14 + i * 0.05, 0.076]);
    // barrel and muzzle brake
    const end = o.short ? 0.86 : 1.18;
    add(g, cylY(0.018, 0.017, end - hg + 0.04, 12), dark(), [0, (hg + end) / 2, 0.018]);
    add(g, cylY(0.027, 0.027, 0.07, 12), black(), [0, end - 0.02, 0.018]);
    for (const s of [-1, 1]) add(g, G.box(0.006, 0.04, 0.016), glow(c, 2), [s * 0.026, end - 0.02, 0.018]);
    // glowing inlay along the side
    for (const s of [-1, 1]) add(g, G.box(0.004, hg - 0.3, 0.006), glow(c, 2.2), [s * 0.031, (hg + 0.3) / 2, 0.035]);
    // optics or iron sights
    if (o.scope) {
      const sc = grp(g, [0, 0.12, 0.125]);
      add(sc, cylY(0.026, 0.026, 0.24, 14), black(), [0, 0, 0]);
      add(sc, cylY(0.026, 0.036, 0.07, 14), black(), [0, 0.15, 0]);
      add(sc, cylY(0.034, 0.03, 0.06, 14), black(), [0, -0.14, 0]);
      add(sc, cylY(0.03, 0.03, 0.006, 14), glow(c, 3), [0, 0.186, 0]);
      add(sc, cylY(0.022, 0.022, 0.006, 14), smooth(M('#2a3a4a', { m: 0.9, r: 0.05 })), [0, -0.172, 0]);
      add(sc, cylY(0.012, 0.012, 0.03, 8), black(), [0.035, 0.0, 0], [0, 0, Math.PI / 2]);
      for (const y of [-0.07, 0.07]) add(g, G.box(0.02, 0.025, 0.055), dark(), [0, 0.12 + y, 0.09]);
    } else {
      add(g, G.box(0.03, 0.03, 0.03), black(), [0, 0.0, 0.085]);
      add(g, G.box(0.008, 0.012, 0.03), glow(c, 2.6), [0, 0.0, 0.1]);
      add(g, G.box(0.012, 0.02, 0.05), black(), [0, end - 0.1, 0.05]);
      add(g, G.box(0.004, 0.008, 0.012), glow(c, 3), [0, end - 0.1, 0.08]);
    }
    muzzleAt(g, end + 0.02, 0.018);
    return g;
  },

  blunderbuss(c) {
    const g = REMODEL.rifle(c, { short: true });
    add(g, lathe([[0.02, 0], [0.026, 0.05], [0.04, 0.13], [0.07, 0.2], [0.075, 0.215], [0.06, 0.215]]), brass(), [0, 0.8, 0.018]);
    add(g, new THREE.TorusGeometry(0.072, 0.008, 6, 16), glow(c, 2.2), [0, 1.01, 0.018], [Math.PI / 2, 0, 0]);
    g.muzzle.position.y = 1.03;
    return g;
  },

  gatling(c) {
    const g = new THREE.Group();
    // housing with a rear spade grip and a top carry handle
    add(g, profile(rrect(-0.11, -0.07, 0.2, 0.09, 0.02), 0.15, 0.012), smooth(M('#6a4a20', { m: 0.75, r: 0.35 })), [0, 0, 0]);
    add(g, profile([[-0.11, -0.02], [-0.15, -0.04], [-0.17, -0.14], [-0.12, -0.15], [-0.1, -0.06]], 0.05, 0.008), black(), [0, 0, 0]);
    add(g, new THREE.TorusGeometry(0.07, 0.012, 6, 12, Math.PI), black(), [0, 0.05, 0.09], [Math.PI / 2, Math.PI / 2, 0]);
    // ammo drum on the side with a belt
    add(g, cylY(0.09, 0.09, 0.07, 18), brass(), [0.12, 0.02, -0.02], [0, 0, Math.PI / 2]);
    add(g, cylY(0.06, 0.06, 0.074, 18), dark(), [0.12, 0.02, -0.02], [0, 0, Math.PI / 2]);
    for (let i = 0; i < 6; i++) add(g, G.box(0.03, 0.012, 0.018), brass(), [0.06 - i * 0.012, 0.09 + i * 0.012, -0.02 + i * 0.006], [0, 0, 0.5]);
    // motor + spinning cluster
    add(g, cylY(0.07, 0.075, 0.08, 16), dark(), [0, 0.23, 0.0]);
    const spin = grp(g, [0, 0.27, 0.0]);
    add(spin, cylY(0.012, 0.012, 0.74, 8), black(), [0, 0.37, 0]);
    for (let i = 0; i < 6; i++) add(spin, cylY(0.016, 0.016, 0.74, 10), steel(c), [Math.cos(i * 1.047) * 0.048, 0.37, Math.sin(i * 1.047) * 0.048]);
    for (const y of [0.08, 0.4, 0.7]) add(spin, cylY(0.072, 0.072, 0.03, 18), brass(), [0, y, 0]);
    add(spin, cylY(0.075, 0.075, 0.012, 18), glow(c, 2.4), [0, 0.725, 0]);
    spin.name = 'barrel'; g.barrel = spin;
    for (const s of [-1, 1]) add(g, G.box(0.004, 0.24, 0.01), glow(c, 2.4), [s * 0.077, 0.05, 0.02]);
    muzzleAt(g, 1.03, 0.0);
    return g;
  },

  launcher(c) {
    const g = new THREE.Group();
    add(g, profile([[-0.02, -0.02], [-0.06, -0.13], [0.0, -0.14], [0.035, -0.02]], 0.045, 0.007), black(), [0, 0, 0]);
    add(g, profile([[-0.3, 0.0], [-0.3, -0.06], [-0.12, -0.04], [-0.05, 0.0]], 0.05, 0.008), wood(), [0, 0, 0]);
    add(g, cylY(0.068, 0.068, 0.72, 18), smooth(M('#4a5a3a', { m: 0.55, r: 0.45 })), [0, 0.26, 0.05]);
    for (const y of [-0.08, 0.3, 0.58]) add(g, cylY(0.074, 0.074, 0.03, 18), dark(), [0, y, 0.05]);
    add(g, lathe([[0.068, 0], [0.085, 0.04], [0.088, 0.08], [0.07, 0.08]]), dark(), [0, 0.6, 0.05]);
    add(g, new THREE.TorusGeometry(0.075, 0.01, 6, 18), glow(c, 2.6), [0, 0.66, 0.05], [Math.PI / 2, 0, 0]);
    add(g, G.box(0.05, 0.12, 0.05), dark(), [0.06, 0.1, 0.12]);
    add(g, G.box(0.02, 0.02, 0.006), glow(c, 3), [0.06, 0.16, 0.14]);
    muzzleAt(g, 0.7, 0.05);
    return g;
  },

  flamer(c) {
    const g = new THREE.Group();
    add(g, profile([[-0.02, -0.02], [-0.06, -0.13], [0.0, -0.14], [0.035, -0.02]], 0.045, 0.007), black(), [0, 0, 0]);
    add(g, profile(rrect(-0.12, -0.03, 0.3, 0.06, 0.02), 0.07, 0.01), dark(), [0, 0, 0]);
    // fuel tank underneath with a gauge
    add(g, cylY(0.05, 0.05, 0.24, 16), smooth(M('#8a2a1a', { m: 0.6, r: 0.4 })), [0, 0.12, -0.08]);
    for (const y of [0.0, 0.24]) add(g, lathe([[0.05, 0], [0.04, 0.02], [0.0, 0.03]]), smooth(M('#8a2a1a', { m: 0.6, r: 0.4 })), [0, y, -0.08], [y ? 0 : Math.PI, 0, 0]);
    add(g, cylY(0.018, 0.018, 0.012, 12), brass(), [0.05, 0.12, -0.08], [0, 0, Math.PI / 2]);
    // nozzle with heat fins and a pilot flame
    add(g, cylY(0.03, 0.036, 0.42, 14), brass(), [0, 0.5, 0.02]);
    for (let i = 0; i < 6; i++) add(g, cylY(0.046, 0.046, 0.008, 14), dark(), [0, 0.34 + i * 0.045, 0.02]);
    add(g, lathe([[0.03, 0], [0.04, 0.03], [0.05, 0.07], [0.042, 0.07]]), black(), [0, 0.7, 0.02]);
    const pilot = add(g, G.ico(0.022, 1), GLOW('#4aa8ff', 4), [0, 0.77, 0.06]); pilot.userData.flicker = true;
    add(g, new THREE.TorusGeometry(0.06, 0.008, 6, 14, Math.PI * 1.2), black(), [0, 0.0, -0.06], [0, Math.PI / 2, 0.4]);
    muzzleAt(g, 0.78, 0.02);
    return g;
  },


  // ================= axes and hammers =================
  axe(c) {
    const g = new THREE.Group();
    // haft with a leather wrap at the grip and an iron butt cap
    add(g, cylY(0.022, 0.026, 0.82, 10), wood(), [0, 0.21, 0]);
    wrappedGrip(g, -0.1, 0.18, 0.027);
    add(g, cylY(0.03, 0.026, 0.04, 10), steel(c), [0, -0.19, 0]);
    // bearded head: profile in the X-Y plane, edge toward +X
    const sh = new THREE.Shape();
    sh.moveTo(0.0, 0.47); sh.lineTo(0.09, 0.5); sh.quadraticCurveTo(0.16, 0.56, 0.25, 0.64);
    sh.quadraticCurveTo(0.3, 0.52, 0.27, 0.36); sh.quadraticCurveTo(0.17, 0.4, 0.09, 0.4);
    sh.lineTo(0.03, 0.33); sh.lineTo(0.0, 0.33); sh.closePath();
    const hg = new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.022, bevelOffset: -0.022, bevelSegments: 1, curveSegments: 10 });
    hg.translate(0, 0, -0.006); hg.computeVertexNormals();
    add(g, hg, edge('#9aa0aa'), [0, 0, 0]);
    // socket, back spike, rune
    add(g, profile(rrect(0.31, -0.035, 0.53, 0.035, 0.01), 0.06, 0.006), dark(), [0, 0, 0], [0, Math.PI / 2, 0]);
    add(g, new THREE.ConeGeometry(0.022, 0.1, 4), steel(c), [-0.07, 0.43, 0], [0, 0, Math.PI / 2]);
    add(g, G.box(0.006, 0.18, 0.05), glow(c, 2.4), [0.255, 0.5, 0], [0, 0, -0.2]);
    add(g, cylY(0.03, 0.03, 0.04, 10), steel(c), [0, 0.58, 0]);
    return g;
  },

  hammer(c) {
    const g = new THREE.Group();
    add(g, cylY(0.032, 0.036, 1.16, 10), wood(), [0, 0.32, 0]);
    wrappedGrip(g, -0.18, 0.3, 0.038);
    add(g, lathe([[0, 0], [0.05, 0.01], [0.052, 0.05], [0.03, 0.08], [0, 0.085]]), steel(c), [0, -0.27, 0]);
    for (const y of [0.55, 0.72]) add(g, new THREE.TorusGeometry(0.04, 0.009, 5, 12), steel(c), [0, y, 0], [Math.PI / 2, 0, 0]);
    // head: a bevelled block with stepped faces on both ends
    add(g, profile(rrect(0.83, -0.13, 1.09, 0.13, 0.025), 0.42, 0.02), steel(c), [0, 0, 0], [0, Math.PI / 2, 0]);
    for (const sd of [-1, 1]) {
      add(g, profile(rrect(0.86, -0.1, 1.06, 0.1, 0.02), 0.07, 0.012), dark(), [sd * 0.235, 0, 0], [0, Math.PI / 2, 0]);
      add(g, G.box(0.012, 0.12, 0.12), glow(c, 2.2), [sd * 0.272, 0.96, 0]);
    }
    add(g, G.box(0.36, 0.024, 0.27), dark(), [0, 0.96, 0]);
    add(g, new THREE.ConeGeometry(0.03, 0.12, 4), steel(c), [0, 1.15, 0]);
    return g;
  },

  // ================= blades =================
  sword(c) {
    const g = new THREE.Group();
    wrappedGrip(g, -0.1, 0.19, 0.02);
    add(g, lathe([[0, 0], [0.032, 0.01], [0.036, 0.035], [0.02, 0.06], [0, 0.065]]), brass(), [0, -0.16, 0]);
    add(g, profile([[-0.012, -0.14], [-0.004, -0.04], [0.02, -0.02], [0.03, 0.0], [0.02, 0.02], [-0.004, 0.04], [-0.012, 0.14], [0.006, 0.0]], 0.04, 0.006), brass(), [0, 0.1, 0], [0, Math.PI / 2, 0]);
    add(g, G.ico(0.018, 1), glow(c, 2.6), [0, 0.1, 0.02]);
    add(g, bladeGeo(0.82, 0.068, 0.13, 0.014), edge(), [0, 0.12, 0]);
    add(g, G.box(0.012, 0.6, 0.016), glow(c, 2.8), [0, 0.46, 0]);
    return g;
  },

  greatsword(c) {
    const g = new THREE.Group();
    wrappedGrip(g, -0.14, 0.34, 0.024);
    add(g, lathe([[0, 0], [0.04, 0.012], [0.046, 0.045], [0.026, 0.08], [0, 0.085]]), steel(c), [0, -0.21, 0]);
    // winged crossguard
    add(g, profile([[-0.03, -0.24], [0.0, -0.2], [0.03, -0.06], [0.05, 0.0], [0.03, 0.06], [0.0, 0.2], [-0.03, 0.24], [0.0, 0.0]], 0.07, 0.01), steel(c), [0, 0.22, 0], [0, Math.PI / 2, 0]);
    add(g, G.oct(0.034), glow(c, 2.8), [0, 0.22, 0.03]);
    // ricasso + blade
    add(g, profile(rrect(0.24, -0.05, 0.36, 0.05, 0.008), 0.03, 0.004), steel(c), [0, 0, 0], [0, Math.PI / 2, 0]);
    add(g, bladeGeo(1.08, 0.13, 0.2, 0.02), edge('#a9aeb8'), [0, 0.32, 0]);
    add(g, G.box(0.022, 0.82, 0.024), glow(c, 2.8), [0, 0.76, 0]);
    return g;
  },

  dagger(c) {
    const g = new THREE.Group();
    wrappedGrip(g, -0.06, 0.12, 0.018, leather(), black());
    add(g, G.ico(0.022, 1), steel(c), [0, -0.075, 0]);
    add(g, profile([[-0.01, -0.07], [0.012, -0.02], [0.012, 0.02], [-0.01, 0.07], [0.004, 0.0]], 0.03, 0.005), steel(c), [0, 0.065, 0], [0, Math.PI / 2, 0]);
    add(g, bladeGeo(0.33, 0.05, 0.12, 0.012, { curve: 0.012 }), edge(), [0, 0.07, 0]);
    add(g, G.box(0.006, 0.22, 0.014), glow(c, 3), [0.004, 0.2, 0]);
    return g;
  },

  katana(c) {
    const g = new THREE.Group();
    wrappedGrip(g, -0.12, 0.25, 0.019, smooth(M('#e8e0d0', { r: 0.8 })), smooth(M('#2a1a2a', { r: 0.8 })));
    add(g, cylY(0.022, 0.022, 0.03, 10), brass(), [0, -0.13, 0]);
    add(g, cylY(0.05, 0.05, 0.012, 16), brass(), [0, 0.135, 0]);
    add(g, cylY(0.022, 0.024, 0.03, 10), brass(), [0, 0.155, 0]);
    add(g, bladeGeo(0.88, 0.036, 0.09, 0.011, { curve: 0.045, taper: 0.95 }), edge('#e8e4ee'), [0, 0.16, 0]);
    add(g, G.box(0.006, 0.7, 0.014), glow(c, 2.6), [0.01, 0.52, 0], [0, 0, -0.04]);
    return g;
  },

  rapier(c) {
    const g = new THREE.Group();
    wrappedGrip(g, -0.07, 0.15, 0.017, smooth(M('#2a2a3a', { r: 0.7 })), steel(c));
    add(g, G.ico(0.024, 1), steel(c), [0, -0.085, 0]);
    // swept hilt: knuckle bow and side rings
    add(g, new THREE.TorusGeometry(0.08, 0.007, 6, 18, Math.PI * 1.1), steel(c), [0.0, 0.02, 0.03], [0, Math.PI / 2, -0.2]);
    for (const s of [-1, 1]) add(g, new THREE.TorusGeometry(0.035, 0.006, 6, 14), steel(c), [s * 0.035, 0.09, 0], [0, Math.PI / 2, 0]);
    add(g, cylY(0.045, 0.045, 0.006, 16), steel(c), [0, 0.085, 0]);
    add(g, bladeGeo(1.0, 0.022, 0.2, 0.01, { taper: 0.75 }), edge('#dfefff'), [0, 0.09, 0]);
    add(g, G.box(0.004, 0.75, 0.012), glow(c, 3), [0, 0.5, 0]);
    return g;
  },
};

// Install over the old builders on every registry that holds them.
export function installRemodel(...registries) {
  for (const R of registries) for (const k of Object.keys(REMODEL)) if (k in R || R === registries[0]) R[k] = REMODEL[k];
}
