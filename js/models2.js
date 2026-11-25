import * as THREE from 'three';
import { M, G, add, grp, GLOW, rig, pauldron, eyes, cape, robe, hair, face, WEAPONS } from './models.js';

// ---------------- new weapons (built along +Y from grip; guns point along +Y) ----------------
const gunMetal = (c) => M(c.metal || '#5a5a60', { m: 0.85, r: 0.3 });
const wood = () => M('#3a2618', { r: 0.8 });
export const NEW_WEAPONS = {
  pistol(c, o = {}) {
    const g = new THREE.Group();
    add(g, G.box(0.055, 0.12, 0.09), M('#2a1c14'), [0, -0.02, -0.05], [0.35, 0, 0]);
    add(g, G.box(0.065, 0.2, 0.085), gunMetal(c), [0, 0.1, 0.0]);
    add(g, G.cyl(0.022, 0.026, o.long ? 0.42 : 0.3, 7), gunMetal(c), [0, o.long ? 0.36 : 0.3, 0.015]);
    if (o.drum) add(g, G.cyl(0.048, 0.048, 0.08, 7), gunMetal(c), [0, 0.12, 0.015], [0, 0, 0]);
    add(g, G.box(0.012, 0.18, 0.012), GLOW(c.glow, 2.2), [0.035, 0.18, 0.015]);
    add(g, G.box(0.02, 0.04, 0.05), gunMetal(c), [0, 0.04, 0.06]);
    const muzzle = new THREE.Object3D(); muzzle.position.set(0, o.long ? 0.58 : 0.46, 0.015); g.add(muzzle); muzzle.name = 'muzzle'; g.muzzle = muzzle;
    return g;
  },
  rifle(c, o = {}) {
    const g = new THREE.Group();
    add(g, G.box(0.07, 0.42, 0.11), wood(), [0, -0.2, -0.03]);
    add(g, G.box(0.075, 0.3, 0.09), gunMetal(c), [0, 0.12, 0]);
    add(g, G.cyl(0.024, 0.03, o.short ? 0.6 : 0.95, 7), gunMetal(c), [0, o.short ? 0.55 : 0.72, 0.02]);
    add(g, G.box(0.05, 0.5, 0.05), wood(), [0, 0.45, -0.01]);
    if (o.scope) { add(g, G.cyl(0.032, 0.032, 0.3, 8), M('#1a1a1e', { m: 0.8 }), [0, 0.22, 0.08]); add(g, G.cyl(0.03, 0.03, 0.01, 8), GLOW(c.glow, 3), [0, 0.375, 0.08]); }
    add(g, G.box(0.012, 0.6, 0.012), GLOW(c.glow, 2), [0.04, 0.4, 0.02]);
    const muzzle = new THREE.Object3D(); muzzle.position.set(0, o.short ? 0.86 : 1.2, 0.02); g.add(muzzle); muzzle.name = 'muzzle'; g.muzzle = muzzle;
    return g;
  },
  blunderbuss(c) {
    const g = NEW_WEAPONS.rifle(c, { short: true });
    add(g, G.cyl(0.085, 0.032, 0.22, 8, 1), gunMetal(c), [0, 0.92, 0.02]);
    g.muzzle.position.y = 1.02;
    return g;
  },
  gatling(c) {
    const g = new THREE.Group();
    add(g, G.box(0.18, 0.3, 0.2), M('#6a4a20', { m: 0.7, r: 0.4 }), [0, 0.05, 0]);
    add(g, G.box(0.06, 0.16, 0.06), wood(), [0, -0.13, -0.06]);
    const spin = grp(g, [0, 0.25, 0.02]);
    for (let i = 0; i < 6; i++) add(spin, G.cyl(0.018, 0.018, 0.75, 5), gunMetal(c), [Math.cos(i * 1.047) * 0.055, 0.35, Math.sin(i * 1.047) * 0.055]);
    add(spin, G.tor(0.07, 0.012, 3, 10), M('#b8862a', { m: 0.9 }), [0, 0.7, 0], [Math.PI / 2, 0, 0]);
    add(spin, G.tor(0.07, 0.012, 3, 10), M('#b8862a', { m: 0.9 }), [0, 0.15, 0], [Math.PI / 2, 0, 0]);
    spin.name = 'barrel'; g.barrel = spin;
    add(g, G.cyl(0.11, 0.11, 0.12, 10), M('#b8862a', { m: 0.9, r: 0.3 }), [0.14, 0.05, 0], [0, 0, Math.PI / 2]);
    add(g, G.box(0.02, 0.2, 0.02), GLOW(c.glow, 2), [-0.095, 0.08, 0]);
    const muzzle = new THREE.Object3D(); muzzle.position.set(0, 1.05, 0.02); g.add(muzzle); muzzle.name = 'muzzle'; g.muzzle = muzzle;
    return g;
  },
  launcher(c) {
    const g = new THREE.Group();
    add(g, G.box(0.06, 0.25, 0.09), wood(), [0, -0.12, -0.04]);
    add(g, G.cyl(0.09, 0.09, 0.14, 8), gunMetal(c), [0, 0.08, 0.03]);
    add(g, G.cyl(0.06, 0.065, 0.55, 8), M('#4a5a3a', { m: 0.6 }), [0, 0.4, 0.03]);
    add(g, G.tor(0.065, 0.015, 3, 10), GLOW(c.glow, 2.4), [0, 0.66, 0.03], [Math.PI / 2, 0, 0]);
    const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.7, 0.03); g.add(muzzle); muzzle.name = 'muzzle'; g.muzzle = muzzle;
    return g;
  },
  flamer(c) {
    const g = new THREE.Group();
    add(g, G.box(0.08, 0.3, 0.12), M('#3a3030', { m: 0.7 }), [0, 0.05, 0]);
    add(g, G.cyl(0.035, 0.05, 0.5, 8), M('#8a6a3a', { m: 0.85, r: 0.3 }), [0, 0.42, 0.02]);
    add(g, G.cyl(0.06, 0.04, 0.08, 8), M('#2a2020', { m: 0.8 }), [0, 0.7, 0.02]);
    const pilot = add(g, G.ico(0.03, 0), GLOW('#4aa8ff', 4), [0, 0.75, 0.06]); pilot.userData.flicker = true;
    add(g, G.cyl(0.015, 0.015, 0.4, 5), M('#222'), [0, -0.05, -0.1], [0.6, 0, 0]);
    const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.76, 0.02); g.add(muzzle); muzzle.name = 'muzzle'; g.muzzle = muzzle;
    return g;
  },
  armcannon(c) {
    const g = new THREE.Group();
    add(g, G.cyl(0.13, 0.11, 0.46, 8), M('#4a4440', { m: 0.85, r: 0.35 }), [0, 0.12, 0]);
    add(g, G.cyl(0.09, 0.1, 0.14, 8), M('#2a2420', { m: 0.8 }), [0, 0.4, 0]);
    for (let i = 0; i < 3; i++) add(g, G.tor(0.12, 0.014, 3, 12), GLOW(c.glow, 2.6), [0, 0.0 + i * 0.12, 0], [Math.PI / 2, 0, 0]);
    add(g, G.cyl(0.06, 0.06, 0.02, 10), GLOW(c.glow, 4), [0, 0.475, 0]);
    for (const s of [-1, 1]) add(g, G.box(0.04, 0.3, 0.06), M('#2a2420', { m: 0.8 }), [s * 0.13, 0.15, 0]);
    const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.5, 0); g.add(muzzle); muzzle.name = 'muzzle'; g.muzzle = muzzle;
    return g;
  },
  katana(c) {
    const g = new THREE.Group();
    add(g, G.cyl(0.02, 0.022, 0.24, 6), M('#2a1a2a'), [0, 0, 0]);
    add(g, G.cyl(0.05, 0.05, 0.015, 8), M('#d4af6a', { m: 0.9 }), [0, 0.13, 0]);
    const b = add(g, G.box(0.03, 0.85, 0.01), M('#e8e4ee', { m: 0.9, r: 0.15 }), [0, 0.56, 0], [0, 0, 0.04]);
    add(g, G.box(0.008, 0.8, 0.012), GLOW(c.glow, 2.4), [0.012, 0.56, 0], [0, 0, 0.04]);
    return g;
  },
  fist(c) {
    const g = new THREE.Group();
    add(g, G.ico(0.16, 0), M(c.skin, { r: 0.7 }), [0, 0.02, 0.02]);
    for (let i = 0; i < 3; i++) add(g, G.cone(0.03, 0.12, 4), GLOW(c.glow, 1.6), [(i - 1) * 0.07, -0.08, 0.1], [2.4, 0, 0]);
    return g;
  },
  scythe(c) {
    const g = new THREE.Group();
    add(g, G.cyl(0.028, 0.03, 1.6, 6), M('#1e1a1a'), [0, 0.3, 0]);
    for (let i = 0; i < 5; i++) add(g, G.tor(0.035, 0.012, 3, 6), M('#7a7a80', { m: 0.9 }), [0, -0.5 - i * 0.08, 0], [0, i * 1.2, 0]);
    const blade = grp(g, [0, 1.08, 0]);
    add(blade, G.tor(0.42, 0.04, 3, 14, Math.PI * 0.6), M('#9a9aa8', { m: 0.9, r: 0.25 }), [-0.42, 0, 0], [0, 0, 0.1], [1, 1, 0.3]);
    add(blade, G.tor(0.42, 0.012, 3, 14, Math.PI * 0.6), GLOW(c.glow, 2.4), [-0.42, 0.01, 0.015], [0, 0, 0.1], [1, 1, 0.3]);
    return g;
  },
  lance(c) {
    const g = new THREE.Group();
    add(g, G.cyl(0.03, 0.035, 1.8, 6), M('#2a3048'), [0, 0.35, 0]);
    add(g, G.cone(0.13, 0.25, 8), M('#c0c8d8', { m: 0.9, r: 0.25 }), [0, -0.25, 0], [Math.PI, 0, 0]);
    add(g, G.cone(0.06, 0.95, 6), M('#d8e0f0', { m: 0.9, r: 0.2 }), [0, 1.7, 0]);
    add(g, G.box(0.015, 0.8, 0.015), GLOW(c.glow, 3), [0, 1.6, 0.03]);
    for (let i = 0; i < 3; i++) add(g, G.tor(0.04, 0.01, 3, 8), GLOW(c.glow, 2), [0, 1.1 + i * 0.1, 0], [Math.PI / 2, 0, 0]);
    return g;
  },
  hellsword(c) {
    const g = WEAPONS.greatsword({ metal: '#2a2020', glow: c.glow });
    for (let i = 0; i < 5; i++) { const f = add(g, G.cone(0.05, 0.18, 4), GLOW('#ff5a1a', 2.8), [0.06 * (i % 2 ? 1 : -1), 0.45 + i * 0.22, 0], [0, 0, (i % 2 ? -1 : 1) * 0.4]); f.userData.flicker = true; }
    return g;
  },
  icestaff(c) {
    const g = new THREE.Group();
    add(g, G.cyl(0.025, 0.03, 1.7, 6), M('#d8eef8', { m: 0.6, r: 0.25 }), [0, 0.2, 0]);
    for (let i = 0; i < 5; i++) add(g, G.cone(0.04, 0.35 - i * 0.03, 4), M('#a8e8ff', { t: true, op: 0.85, e: '#5ac8ff', ei: 1.2, r: 0.1 }), [Math.cos(i * 1.26) * 0.07, 1.2, Math.sin(i * 1.26) * 0.07], [Math.sin(i * 1.26) * 0.35, 0, -Math.cos(i * 1.26) * 0.35]);
    const cr = add(g, G.oct(0.11), GLOW('#c8f4ff', 3), [0, 1.2, 0], [0, 0, 0], [0.7, 1.5, 0.7]); cr.userData.spin = 1.2;
    return g;
  },
  bellstaff(c) {
    const g = new THREE.Group();
    add(g, G.cyl(0.022, 0.026, 1.7, 6), M('#e8e4f0', { m: 0.5 }), [0, 0.2, 0]);
    add(g, G.tor(0.18, 0.015, 3, 20, Math.PI * 1.4), M('#d8c890', { m: 0.9, r: 0.25 }), [0, 1.18, 0], [0, 0, -0.9]);
    for (const x of [-0.08, 0.08]) { add(g, G.cyl(0.003, 0.003, 0.12, 3), M('#aaa'), [x, 1.05, 0]); add(g, G.cone(0.035, 0.05, 6), M('#e8d88a', { m: 0.9 }), [x, 0.97, 0]); }
    const m = add(g, G.ico(0.07, 1), GLOW('#e0ecff', 3), [0, 1.22, 0]); m.userData.flicker = true;
    return g;
  },
  censer(c) {
    const g = WEAPONS.lantern({ glow: '#ff2a4a' });
    return g;
  },
  bomb(c, s = 1) {
    const g = new THREE.Group();
    add(g, G.ico(0.11 * s, 1), M('#1a1a1e', { m: 0.6, r: 0.4 }), [0, 0.08 * s, 0]);
    add(g, G.cyl(0.025 * s, 0.03 * s, 0.05 * s, 6), M('#5a4a3a'), [0, 0.2 * s, 0]);
    const f = add(g, G.ico(0.025, 0), GLOW('#ffcc3a', 4), [0, 0.25 * s, 0]); f.userData.flicker = true;
    return g;
  },
};

// ---------------- builders ----------------
const hat = (h, c, brim = 0.32, crown = 0.16, tilt = 0) => {
  const g = grp(h, [0, 0.1, 0], [tilt, 0, 0]);
  add(g, G.cyl(brim, brim * 1.04, 0.025, 10), M(c), [0, 0, 0]);
  add(g, G.cyl(crown * 0.8, crown, 0.17, 8), M(c), [0, 0.09, 0]);
  add(g, G.cyl(crown * 1.02, crown * 1.02, 0.035, 8), M('#2a1a10'), [0, 0.03, 0]);
  return g;
};
const goggles = (h, lens, y = 0.03, z = 0.1) => {
  add(h, G.box(0.26, 0.03, 0.2), M('#2a2220'), [0, y, z - 0.08]);
  for (const s of [-1, 1]) { add(h, G.cyl(0.045, 0.045, 0.05, 8), M('#6a5a3a', { m: 0.8 }), [s * 0.05, y, z], [Math.PI / 2, 0, 0]); add(h, G.cyl(0.035, 0.035, 0.01, 8), GLOW(lens, 2.2), [s * 0.05, y, z + 0.028], [Math.PI / 2, 0, 0]); }
};
const coat = (P, color, len = 0.8, flare = 0.3) => add(P.hips, G.lathe([[0.19, 0.06], [0.24, -0.35], [flare, -len]], 9), M(color, { ds: true, r: 0.85 }), [0, 0, 0], [0, 0, 0], [1, 1, 0.85]);
const holdR = (P, w, rx = 2.5, pos = [0, -0.05, 0.02]) => { P.handR.add(w); w.rotation.set(rx, 0, 0); w.position.set(...pos); P.weaponR = w; return w; };
const holdL = (P, w, rx = 2.5, pos = [0, -0.05, 0.02]) => { P.handL.add(w); w.rotation.set(rx, 0, 0); w.position.set(...pos); P.weaponL = w; return w; };
const gunR = (P, w) => holdR(P, w, Math.PI, [0, -0.06, 0.03]);
const gunL = (P, w) => holdL(P, w, Math.PI, [0, -0.06, 0.03]);

export const NEW_BUILDERS = {
  gunslinger() {
    const c = { cloth: '#4a3424', torso: '#5a3e28', metal: '#6a6460', glow: '#ffcc6a', skin: '#c8b8a8', leg: '#2e2620', arm: '#4a3424', hand: '#2a1e18' };
    const P = rig({ c, h: 1.04, bw: 1.0, lw: 0.95, pose: 'dualgun' });
    coat(P, '#3e2c1e', 0.85, 0.32);
    add(P.spine, G.box(0.05, 0.6, 0.3), M('#2a1c14'), [0, 0.28, 0], [0, 0, 0.65]);
    for (let i = 0; i < 6; i++) add(P.spine, G.cyl(0.012, 0.012, 0.05, 5), M('#d4a24c', { m: 0.9 }), [-0.14 + i * 0.055, 0.12 + i * 0.07, 0.13], [0, 0, 0.65]);
    const h = P.head;
    face(h, c.skin, '#ffd27a');
    add(h, G.box(0.24, 0.1, 0.06), M('#7a2a1a'), [0, -0.06, 0.1]);
    hat(h, '#2a1e16', 0.32, 0.15, -0.08);
    cape(P, '#3a2a1e', 0.6, 0.32, true, 0.52);
    gunR(P, NEW_WEAPONS.pistol(c, { long: true })); gunL(P, NEW_WEAPONS.pistol(c, { long: true }));
    return P;
  },
  blunderbuss() {
    const c = { cloth: '#5a3a22', torso: '#6a4a2a', metal: '#7a6a5a', glow: '#ffaa4a', skin: '#c89a78', leg: '#3a2a1c', arm: '#5a3a22', hand: '#3a2a1c' };
    const P = rig({ c, h: 1.06, bw: 1.35, lw: 1.3, pose: 'rifle' });
    const fur = M('#6a5040', { r: 1 });
    add(P.spine, G.tor(0.2, 0.09, 5, 9), fur, [0, 0.52, 0], [Math.PI / 2, 0, 0], [1.2, 1, 1]);
    for (let i = 0; i < 8; i++) add(P.hips, G.cyl(0.02, 0.02, 0.07, 5), M('#c83a2a'), [-0.2 + i * 0.057, 0.05, 0.15]);
    const h = P.head;
    face(h, c.skin, '#ffb070', { brow: false });
    add(h, G.cone(0.13, 0.3, 6), M('#8a4a2a', { r: 1 }), [0, -0.15, 0.07], [Math.PI + 0.2, 0, 0]);
    add(h, G.ico(0.15, 0), fur, [0, 0.1, -0.01], [0, 0, 0], [1.05, 0.7, 1.05]);
    for (const s of [-1, 1]) add(h, G.box(0.06, 0.16, 0.03), fur, [s * 0.15, 0.0, 0], [0, 0, s * 0.2]);
    coat(P, '#4a3020', 0.6, 0.3);
    gunR(P, NEW_WEAPONS.blunderbuss(c));
    return P;
  },
  sniper() {
    const c = { cloth: '#c8ccd8', torso: '#d8dce8', metal: '#8890a0', glow: '#e8f0ff', skin: '#efe4dc', leg: '#3a3e4a', arm: '#c8ccd8', hand: '#2a2e3a' };
    const P = rig({ c, h: 1.02, bw: 0.88, lw: 0.85, pose: 'rifle' });
    coat(P, '#b8bccc', 0.9, 0.3);
    add(P.spine, G.tor(0.15, 0.06, 4, 9), M('#3a4050'), [0, 0.52, 0], [Math.PI / 2, 0, 0]);
    const sc = cape(P, '#3a4050', 0.7, 0.12, true, 0.53); sc.position.x = -0.09;
    const h = P.head;
    face(h, c.skin, '#cfe8ff');
    hair(h, '#e8ecf4', 'long');
    add(h, G.cyl(0.035, 0.035, 0.02, 8), GLOW('#9fe0ff', 3), [0.045, 0.02, 0.12], [Math.PI / 2, 0, 0]);
    add(h, G.tor(0.04, 0.008, 3, 10), M('#c8b070', { m: 0.9 }), [0.045, 0.02, 0.122]);
    add(h, G.box(0.24, 0.035, 0.03), M('#3a4050'), [0, 0.11, 0.08]);
    gunR(P, NEW_WEAPONS.rifle(c, { scope: true }));
    return P;
  },
  grenadier() {
    const c = { cloth: '#4a4a32', torso: '#55553a', metal: '#6a6a5a', glow: '#9dff5a', skin: '#3a3a2a', leg: '#3a3a28', arm: '#4a4a32', hand: '#2a2a20' };
    const P = rig({ c, h: 1.0, bw: 1.15, lw: 1.1, pose: 'heavy' });
    add(P.spine, G.box(0.36, 0.5, 0.03), M('#5a3a22'), [0, 0.25, 0.14]);
    const pack = grp(P.spine, [0, 0.32, -0.2]);
    add(pack, G.box(0.36, 0.42, 0.18), M('#3a3a28'), [0, 0, 0]);
    for (let i = 0; i < 4; i++) add(pack, G.cyl(0.04, 0.04, 0.22, 6), M('#9dff5a', { t: true, op: 0.7, e: '#5aaa20', ei: 1.3 }), [-0.13 + i * 0.087, 0.26, 0]);
    const h = P.head;
    add(h, G.ico(0.13, 0), M('#2a2a22'), [0, 0, 0]);
    goggles(h, '#9dff5a', 0.03, 0.11);
    add(h, G.cyl(0.05, 0.06, 0.1, 8), M('#3a3a30', { m: 0.6 }), [0, -0.07, 0.12], [Math.PI / 2, 0, 0]);
    for (const s of [-1, 1]) add(h, G.cyl(0.04, 0.04, 0.06, 8), M('#5a5a4a', { m: 0.7 }), [s * 0.1, -0.08, 0.08], [Math.PI / 2, 0, s * 0.6]);
    gunR(P, NEW_WEAPONS.launcher(c));
    return P;
  },
  gatling() {
    const c = { cloth: '#6a4a2a', torso: '#b8862a', metal: '#8a7a5a', glow: '#ffcc5a', skin: '#efd8c8', leg: '#3a2a1a', arm: '#6a4a2a', fore: '#b8862a', hand: '#3a2a1a' };
    const P = rig({ c, h: 0.96, bw: 1.0, lw: 1.0, pose: 'heavy' });
    const brass = M('#b8862a', { m: 0.9, r: 0.3 });
    add(P.spine, G.cyl(0.22, 0.17, 0.3, 8), brass, [0, 0.38, 0], [0, 0, 0], [1, 1, 0.7]);
    add(P.hips, G.lathe([[0.18, 0.05], [0.26, -0.25], [0.3, -0.4]], 10), M('#6a2a2a', { ds: true }), [0, 0, 0]);
    const gear = grp(P.spine, [0, 0.4, -0.2]);
    add(gear, G.cyl(0.18, 0.18, 0.05, 12), brass, [0, 0, 0], [Math.PI / 2, 0, 0]);
    for (let i = 0; i < 10; i++) add(gear, G.box(0.05, 0.06, 0.05), brass, [Math.cos(i * 0.628) * 0.2, Math.sin(i * 0.628) * 0.2, 0], [0, 0, i * 0.628]);
    P.update.push((t) => { gear.rotation.z = t * 1.5; });
    const h = P.head;
    face(h, c.skin, '#ffcc5a');
    hair(h, '#c85a2a', 'pony');
    goggles(h, '#ffcc5a', 0.13, 0.06);
    pauldron(P, 1, brass, 1.1);
    gunR(P, NEW_WEAPONS.gatling(c));
    return P;
  },
  bounty() {
    const c = { cloth: '#6a4a30', torso: '#5a3a24', metal: '#8a7a6a', glow: '#ffaa5a', skin: '#c8a888', leg: '#2e261e', arm: '#5a3a24', hand: '#2a1e16' };
    const P = rig({ c, h: 1.04, bw: 1.0, lw: 0.95, pose: 'pistol' });
    add(P.spine, G.cone(0.42, 0.55, 8), M('#8a5a30', { ds: true, r: 1 }), [0, 0.36, 0], [0, 0, 0], [1, 1, 0.85]);
    for (let i = 0; i < 8; i++) add(P.spine, G.box(0.05, 0.03, 0.02), M(i % 2 ? '#d4a24c' : '#8a2a1a'), [Math.cos(i * 0.785) * 0.35, 0.12, Math.sin(i * 0.785) * 0.3]);
    const h = P.head;
    face(h, c.skin, '#ffcc8a');
    add(h, G.box(0.2, 0.08, 0.06), M('#3a2a1a'), [0, -0.08, 0.09]);
    hat(h, '#4a3220', 0.3, 0.14, 0.05);
    for (const s of [-1, 1]) add(P[s < 0 ? 'kneeL' : 'kneeR'], G.cyl(0.03, 0.03, 0.01, 8), M('#c8a050', { m: 0.9 }), [0, -0.45, -0.17], [Math.PI / 2, 0, 0]);
    gunR(P, NEW_WEAPONS.pistol(c, { drum: true, long: true }));
    return P;
  },
  flamenun() {
    const c = { cloth: '#1a1a1e', torso: '#8a8a90', metal: '#8a7a6a', glow: '#ff6a2a', skin: '#e8d8c8', arm: '#1a1a1e', fore: '#6a6a70', hand: '#2a2220' };
    const P = rig({ c, h: 1.04, bw: 1.05, lw: 1.0, noLegs: true, pose: 'heavy' });
    robe(P, '#141418', '#ff6a2a', 0.38, 0.95);
    add(P.spine, G.cyl(0.22, 0.17, 0.3, 7), M('#8a8a90', { m: 0.85, r: 0.3 }), [0, 0.38, 0.01], [0, 0, 0], [1, 1, 0.7]);
    add(P.spine, G.box(0.04, 0.22, 0.02), GLOW('#ff6a2a', 1.6), [0, 0.38, 0.16]); add(P.spine, G.box(0.14, 0.04, 0.02), GLOW('#ff6a2a', 1.6), [0, 0.42, 0.16]);
    for (const s of [-1, 1]) add(P.spine, G.cyl(0.08, 0.08, 0.5, 8), M('#6a2a1a', { m: 0.6 }), [s * 0.1, 0.32, -0.2]);
    const h = P.head;
    face(h, c.skin, '#ffaa6a');
    add(h, G.cone(0.2, 0.4, 7), M('#f0ece4', { ds: true }), [0, -0.02, -0.05], [-0.15, 0, 0]);
    add(h, G.cyl(0.15, 0.17, 0.08, 9, 1), M('#141418'), [0, 0.08, -0.01]);
    add(h, G.cone(0.21, 0.5, 7), M('#141418', { ds: true }), [0, -0.12, -0.1], [-0.25, 0, 0]);
    gunR(P, NEW_WEAPONS.flamer(c));
    return P;
  },
  musketeer() {
    const c = { cloth: '#1e2a4a', torso: '#24325a', metal: '#c8a860', glow: '#5fd4ff', skin: '#d8c4b4', leg: '#e8e4dc', arm: '#24325a', hand: '#e8e4dc' };
    const P = rig({ c, h: 1.04, bw: 0.95, lw: 0.9, pose: 'rifle' });
    coat(P, '#1a2440', 0.75, 0.3);
    for (let i = 0; i < 5; i++) add(P.spine, G.cyl(0.015, 0.015, 0.02, 6), M('#d4b060', { m: 0.9 }), [0.05, 0.14 + i * 0.08, 0.14], [Math.PI / 2, 0, 0]);
    add(P.spine, G.box(0.05, 0.5, 0.02), M('#d4b060', { m: 0.9 }), [0, 0.3, 0.14]);
    const h = P.head;
    face(h, c.skin, '#7ae0ff');
    hair(h, '#3a2a1a', 'pony');
    const tri = grp(h, [0, 0.12, 0]);
    for (let i = 0; i < 3; i++) add(tri, G.box(0.34, 0.1, 0.03), M('#141a2a'), [Math.sin(i * 2.09) * 0.1, 0, Math.cos(i * 2.09) * 0.1], [0.2, i * 2.09, 0]);
    add(tri, G.cyl(0.13, 0.14, 0.12, 8), M('#141a2a'), [0, 0.04, 0]);
    add(tri, G.cone(0.03, 0.4, 4), M('#e8e4dc'), [0.12, 0.12, -0.05], [-0.6, 0, -0.8]);
    gunR(P, NEW_WEAPONS.rifle(c));
    return P;
  },
  shadowgun() {
    const c = { cloth: '#1e1630', torso: '#261c3c', metal: '#5a5070', glow: '#a07cff', skin: '#0a0810', leg: '#18122a', arm: '#261c3c', hand: '#18122a' };
    const P = rig({ c, h: 0.99, bw: 0.9, lw: 0.86, pose: 'pistol' });
    const h = P.head;
    add(h, G.cone(0.19, 0.4, 6), M('#2a2040', { r: 0.95 }), [0, 0.1, -0.03], [-0.2, 0, 0]);
    add(h, G.ico(0.125, 0), M('#0a0810'), [0, -0.01, 0.02]);
    add(h, G.box(0.22, 0.09, 0.06), M('#3a2a5a', { m: 0.6 }), [0, -0.06, 0.09]);
    eyes(h, c.glow, 0.02, 0.12, 0.045, 0.04, 0.012);
    cape(P, '#1a1228', 0.95, 0.44, true, 0.45);
    add(P.hips, G.box(0.04, 0.25, 0.04), M('#5a5070', { m: 0.8 }), [-0.2, -0.1, 0.05], [0.3, 0, 0.2]);
    gunR(P, NEW_WEAPONS.pistol(c));
    return P;
  },
  cannonarm() {
    const c = { cloth: '#3a2a22', torso: '#4a3a30', metal: '#6a6058', glow: '#ff9a3a', skin: '#b08a6a', leg: '#2e241e', arm: '#b08a6a', fore: '#b08a6a', hand: '#b08a6a' };
    const P = rig({ c, h: 1.1, bw: 1.45, lw: 1.35, kneeGuard: true, pose: 'armcannon' });
    const A = M('#5a5048', { m: 0.8, r: 0.35 });
    add(P.spine, G.cyl(0.29, 0.22, 0.34, 7), A, [0, 0.36, 0], [0, 0, 0], [1, 1, 0.7]);
    pauldron(P, 1, A, 1.5, 2, M('#2a2420', { m: 0.8 }));
    add(P.shL, G.cyl(0.07, 0.07, 0.12, 6), M('#3a2a22'), [0, -0.1, 0]);
    const h = P.head;
    face(h, c.skin, '#ffb06a', { brow: false });
    for (let i = 0; i < 5; i++) add(h, G.cone(0.03, 0.12, 4), M('#ff7a2a'), [0, 0.12, 0.08 - i * 0.05], [-0.3, 0, 0]);
    add(h, G.box(0.06, 0.05, 0.02), M('#111'), [-0.045, 0.02, 0.115]);
    add(h, G.box(0.25, 0.012, 0.02), M('#111'), [0, 0.04, 0.11], [0, 0, 0.3]);
    // cannon replaces right forearm
    P.elR.children.forEach(ch => { if (ch.isMesh) ch.visible = false; });
    P.handR.visible = true; P.handR.children.forEach(ch => { if (ch.isMesh) ch.visible = false; });
    const can = NEW_WEAPONS.armcannon(c);
    P.elR.add(can); can.rotation.set(Math.PI, 0, 0); can.position.set(0, -0.02, 0); P.weaponR = can;
    return P;
  },
  bladedancer() {
    const c = { cloth: '#e86aa8', torso: '#f0e0ea', metal: '#d4af6a', glow: '#ffb0dc', skin: '#f2e2da', leg: '#2a1a2a', arm: '#e86aa8', hand: '#f2e2da' };
    const P = rig({ c, h: 1.0, bw: 0.88, lw: 0.84, pose: 'onehand' });
    add(P.hips, G.lathe([[0.18, 0.06], [0.24, -0.3], [0.32, -0.68]], 10), M('#c84a88', { ds: true }), [0, 0, 0]);
    add(P.spine, G.box(0.42, 0.1, 0.27), M('#2a1a2a'), [0, 0.08, 0]);
    add(P.spine, G.box(0.2, 0.2, 0.05), M('#d4af6a', { m: 0.9 }), [0, 0.08, -0.15]);
    for (const s of [-1, 1]) add(s < 0 ? P.shL : P.shR, G.cone(0.13, 0.45, 6), M('#f0a8cc', { ds: true }), [0, -0.3, 0], [0, 0, 0], [1, 1, 0.6]);
    const h = P.head;
    face(h, c.skin, '#ff8ac8');
    hair(h, '#1a0a1a', 'bun');
    for (let i = 0; i < 4; i++) add(h, G.oct(0.035), GLOW(['#ff8ac8', '#ffffff', '#ffd0e8', '#ff6aa8'][i], 1.5), [0.08 + i * 0.03, 0.12, -0.06 - i * 0.03]);
    add(h, G.box(0.006, 0.18, 0.006), M('#d4af6a', { m: 0.9 }), [-0.06, 0.15, -0.1], [0.4, 0, 0.6]);
    const sheath = add(P.hips, G.box(0.04, 0.8, 0.06), M('#2a1a2a'), [-0.2, -0.1, -0.05], [0.9, 0, 0.3]);
    holdR(P, NEW_WEAPONS.katana(c), 2.5);
    return P;
  },
  abyss() {
    const c = { cloth: '#1a3a42', torso: '#2a5a66', metal: '#3a6a70', glow: '#4affe8', skin: '#2a5a66', leg: '#1a3a42', arm: '#2a5a66', hand: '#2a5a66' };
    const P = rig({ c, h: 1.2, bw: 1.65, lw: 1.6, pose: 'claws' });
    P.spine.rotation.x = 0.3;
    const sk = M('#2a5a66', { r: 0.55, m: 0.15 });
    add(P.spine, G.ico(0.36, 0), sk, [0, 0.38, -0.06], [0, 0, 0], [1.2, 1, 0.9]);
    for (let i = 0; i < 9; i++) add(P.spine, G.ico(0.025, 0), GLOW('#4affe8', 2.2), [(Math.random() - 0.5) * 0.5, 0.2 + Math.random() * 0.4, 0.2 + Math.random() * 0.06]);
    for (let i = 0; i < 4; i++) add(P.spine, G.cone(0.1, 0.45 - i * 0.05, 3), M('#1a3a42', { ds: true }), [0, 0.65 - i * 0.12, -0.3 + i * 0.03], [-0.7, 0, 0], [0.4, 1, 1]);
    const tent = [];
    for (let i = 0; i < 4; i++) {
      const t = grp(P.spine, [(i - 1.5) * 0.12, 0.2, -0.25], [0.6, 0, (i - 1.5) * 0.3]);
      add(t, G.cone(0.05, 0.7, 5), sk, [0, -0.35, 0], [Math.PI, 0, 0]); tent.push(t);
    }
    P.update.push((tm) => tent.forEach((t, i) => { t.rotation.x = 0.6 + Math.sin(tm * 2 + i) * 0.25; }));
    const h = P.head;
    h.position.z = 0.08;
    add(h, G.ico(0.15, 0), sk, [0, 0, 0], [0, 0, 0], [1.1, 0.9, 1.15]);
    for (const s of [-1, 1]) add(h, G.cone(0.08, 0.2, 3), M('#1a3a42', { ds: true }), [s * 0.14, 0.04, -0.04], [0, 0, s * -1.2], [0.3, 1, 1]);
    eyes(h, '#4affe8', 0.02, 0.15, 0.06, 0.04, 0.02);
    add(h, G.box(0.16, 0.02, 0.02), M('#0a1a1e'), [0, -0.07, 0.15]);
    const fR = NEW_WEAPONS.fist(c), fL = NEW_WEAPONS.fist(c);
    P.handR.add(fR); P.handL.add(fL); P.weaponR = fR; P.weaponL = fL;
    return P;
  },
  moonpriestess() {
    const c = { cloth: '#e8ecf8', torso: '#f4f6ff', metal: '#c8d0e8', glow: '#cfe0ff', skin: '#f4ece8', arm: '#e8ecf8', hand: '#f4ece8' };
    const P = rig({ c, h: 1.0, bw: 0.84, lw: 0.8, noLegs: true, pose: 'staff' });
    robe(P, '#d8e0f4', '#9fc0ff', 0.36, 0.95);
    add(P.spine, G.box(0.06, 0.5, 0.02), M('#4a5a8a'), [0, 0.25, 0.135]);
    const h = P.head;
    face(h, c.skin, '#9fc0ff');
    hair(h, '#c8d4f0', 'long');
    add(h, G.cone(0.2, 0.45, 8), M('#ffffff', { t: true, op: 0.5, ds: true }), [0, -0.03, -0.03], [-0.1, 0, 0]);
    const moon = add(h, G.tor(0.2, 0.03, 4, 18, Math.PI * 1.3), GLOW('#e0ecff', 2.6), [0, 0.2, -0.14], [0, 0, -0.6]);
    P.update.push((t) => { moon.position.y = 0.2 + Math.sin(t * 1.4) * 0.02; });
    holdR(P, NEW_WEAPONS.bellstaff(c), 1.3, [0, -0.05, 0]);
    return P;
  },
  executioner() {
    const c = { cloth: '#2a2228', torso: '#8a7a70', metal: '#6a6a72', glow: '#ff3a3a', skin: '#8a7a70', leg: '#1e1a1e', arm: '#8a7a70', hand: '#4a3a34' };
    const P = rig({ c, h: 1.1, bw: 1.35, lw: 1.3, pose: 'twohand' });
    add(P.spine, G.box(0.38, 0.4, 0.03), M('#2a1a14'), [0, 0.22, 0.13]);
    for (let i = 0; i < 6; i++) add(P.spine, G.tor(0.035, 0.011, 3, 6), M('#7a7a80', { m: 0.9 }), [-0.22 + i * 0.09, 0.42 - i * 0.05, 0.14], [0, 1.2, 0]);
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) add(s < 0 ? P.elL : P.elR, G.tor(0.06, 0.01, 3, 8), M('#7a7a80', { m: 0.9 }), [0, -0.08 - i * 0.06, 0], [Math.PI / 2, 0, 0]);
    add(P.hips, G.box(0.38, 0.4, 0.24), M('#1e1a1e'), [0, -0.2, 0]);
    const h = P.head;
    add(h, G.cone(0.16, 0.42, 6), M('#16121a', { r: 1 }), [0, 0.06, 0], [0, 0, 0]);
    add(h, G.ico(0.14, 0), M('#16121a', { r: 1 }), [0, -0.02, 0]);
    eyes(h, c.glow, 0.02, 0.13, 0.05, 0.03, 0.03);
    holdR(P, NEW_WEAPONS.scythe(c), 2.4);
    return P;
  },
  stormlancer() {
    const c = { cloth: '#1e2a48', torso: '#3a4a70', armor: '#4a5a80', metal: '#c0c8d8', glow: '#9fd0ff', skin: '#d8c8b8', leg: '#2a3450', arm: '#3a4a70', fore: '#4a5a80', hand: '#2a3450' };
    const P = rig({ c, h: 1.08, bw: 1.1, lw: 1.05, kneeGuard: true, pose: 'onehand' });
    const A = M('#4a5a80', { m: 0.85, r: 0.3 });
    add(P.spine, G.cyl(0.24, 0.18, 0.34, 7), A, [0, 0.37, 0], [0, 0, 0], [1, 1, 0.7]);
    add(P.spine, G.box(0.03, 0.3, 0.04), GLOW(c.glow, 1.8), [0, 0.35, 0.16], [0, 0, 0.25]);
    pauldron(P, -1, A, 1.15); pauldron(P, 1, A, 1.15);
    const h = P.head;
    add(h, G.cyl(0.13, 0.13, 0.26, 8), A, [0, 0.01, 0]);
    add(h, G.box(0.17, 0.02, 0.04), GLOW(c.glow, 3.5), [0, 0.02, 0.12]);
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) add(h, G.box(0.02, 0.18 - i * 0.03, 0.08), M('#e8ecf4', { m: 0.8 }), [s * 0.14, 0.12 + i * 0.02, -0.03 - i * 0.05], [-0.4, 0, s * -0.5]);
    cape(P, '#1e2a48', 1.0, 0.48);
    holdR(P, NEW_WEAPONS.lance(c), 2.6, [0, -0.05, -0.15]);
    return P;
  },
  puppeteer() {
    const c = { cloth: '#2a1a24', torso: '#3a1a30', metal: '#c8a0b0', glow: '#ff7ac0', skin: '#f4e4e4', arm: '#3a1a30', hand: '#f4e4e4' };
    const P = rig({ c, h: 0.95, bw: 0.85, lw: 0.8, noLegs: true, pose: 'cast' });
    const rb = robe(P, '#2a1424', '#ff7ac0', 0.4, 0.92);
    for (let i = 0; i < 3; i++) add(rb, G.tor(0.26 + i * 0.05, 0.02, 3, 12), M('#f0d0e0'), [0, -0.35 - i * 0.18, 0], [Math.PI / 2, 0, 0], [1, 0.85, 1]);
    const h = P.head;
    face(h, c.skin, '#ff7ac0');
    hair(h, '#1a0a14', 'long');
    const th = grp(h, [0.04, 0.14, 0], [0, 0, -0.2]);
    add(th, G.cyl(0.07, 0.08, 0.14, 8), M('#1a0a14'), [0, 0.07, 0]);
    add(th, G.cyl(0.12, 0.12, 0.015, 10), M('#1a0a14'), [0, 0, 0]);
    add(th, G.cyl(0.081, 0.081, 0.025, 8), GLOW('#ff7ac0', 1.5), [0, 0.03, 0]);
    // floating doll + strings
    const doll = grp(P.spine, [0.4, 0.75, 0.15]);
    add(doll, G.ico(0.06, 1), M('#f4e4e4'), [0, 0.12, 0]);
    add(doll, G.cone(0.07, 0.16, 6), M('#8a2a4a'), [0, 0.0, 0]);
    add(doll, G.box(0.01, 0.01, 0.01), GLOW('#ff3a8a', 3), [0.02, 0.13, 0.055]);
    add(doll, G.cyl(0.002, 0.002, 0.5, 3), GLOW('#ffb0dc', 2), [-0.15, 0.3, -0.05], [0, 0, 0.6]);
    P.update.push((t) => { doll.position.y = 0.75 + Math.sin(t * 2) * 0.06; doll.rotation.y = Math.sin(t * 0.7) * 0.6; });
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) add(s < 0 ? P.handL : P.handR, G.cyl(0.002, 0.002, 0.6, 3), GLOW('#ffb0dc', 2), [(i - 1) * 0.02, -0.35, 0]);
    return P;
  },
  hellknight() {
    const c = { cloth: '#2a0a08', torso: '#1e1414', armor: '#1e1414', metal: '#2a2020', glow: '#ff4a1a', skin: '#1e1414', leg: '#1a1010', arm: '#1e1414', fore: '#2a1a18', hand: '#1a1010' };
    const P = rig({ c, h: 1.12, bw: 1.4, lw: 1.3, kneeGuard: true, pose: 'twohand' });
    const A = M('#1e1414', { m: 0.8, r: 0.35 });
    add(P.spine, G.cyl(0.29, 0.21, 0.36, 7), A, [0, 0.36, 0.01], [0, 0, 0], [1, 1, 0.7]);
    for (let i = 0; i < 6; i++) add(P.spine, G.box(0.012, 0.12 + Math.random() * 0.12, 0.02), GLOW('#ff4a1a', 2.4), [-0.18 + i * 0.07, 0.3 + (Math.random() - 0.5) * 0.15, 0.17], [0, 0, (Math.random() - 0.5)]);
    pauldron(P, -1, A, 1.45, 3, M('#3a1a10')); pauldron(P, 1, A, 1.45, 3, M('#3a1a10'));
    const h = P.head;
    add(h, G.cyl(0.13, 0.15, 0.28, 7), A, [0, 0, 0]);
    add(h, G.box(0.18, 0.03, 0.05), GLOW('#ff6a2a', 3.5), [0, 0.02, 0.12]);
    for (const s of [-1, 1]) { add(h, G.cone(0.06, 0.4, 5), M('#2a1a14'), [s * 0.16, 0.2, -0.02], [0, 0, s * -0.5]); add(h, G.cone(0.04, 0.22, 5), M('#2a1a14'), [s * 0.3, 0.4, -0.02], [0, 0, s * 0.3]); }
    const crown = add(h, G.tor(0.1, 0.02, 3, 10), GLOW('#ff4a1a', 2), [0, 0.18, 0], [Math.PI / 2, 0, 0]);
    cape(P, '#2a0a08', 1.15, 0.58);
    holdR(P, NEW_WEAPONS.hellsword(c), 2.45);
    return P;
  },
  icequeen() {
    const c = { cloth: '#a8d8f0', torso: '#d8f0fc', metal: '#e8f8ff', glow: '#bff0ff', skin: '#f0f4fa', arm: '#c8e8f8', hand: '#f0f4fa' };
    const P = rig({ c, h: 1.04, bw: 0.84, lw: 0.8, noLegs: true, pose: 'staff' });
    robe(P, '#8ac0e0', '#e0f8ff', 0.42, 0.98);
    add(P.spine, G.cone(0.24, 0.3, 8, 1), M('#e8f8ff', { ds: true, t: true, op: 0.75 }), [0, 0.6, -0.05], [Math.PI, 0, 0]);
    const h = P.head;
    face(h, c.skin, '#8fe8ff');
    hair(h, '#f0f8ff', 'long');
    for (let i = 0; i < 7; i++) { const a = (i / 6 - 0.5) * 2; add(h, G.cone(0.025, 0.16 + (i === 3 ? 0.14 : Math.abs(3 - i) < 2 ? 0.06 : 0), 4), M('#bff0ff', { t: true, op: 0.9, e: '#5ac8ff', ei: 1.1 }), [Math.sin(a) * 0.11, 0.16, Math.cos(a) * 0.09 - 0.02]); }
    cape(P, '#bfe8f8', 1.0, 0.5, false);
    holdR(P, NEW_WEAPONS.icestaff(c), 1.3, [0, -0.05, 0]);
    return P;
  },
  bloodsaint() {
    const c = { cloth: '#f0e8e8', torso: '#8a1a2a', metal: '#d4af6a', glow: '#ff2a4a', skin: '#f2e4e0', arm: '#8a1a2a', hand: '#f2e4e0' };
    const P = rig({ c, h: 1.02, bw: 0.86, lw: 0.82, noLegs: true, pose: 'staff' });
    robe(P, '#ece4e4', '#ff2a4a', 0.38, 0.96);
    add(P.hips, G.box(0.16, 0.8, 0.02), M('#8a1a2a', { ds: true }), [0, -0.4, 0.17]);
    const h = P.head;
    face(h, c.skin, '#ff4a6a');
    add(h, G.cone(0.19, 0.42, 7), M('#8a1a2a', { ds: true }), [0, 0.02, -0.04], [-0.15, 0, 0]);
    add(h, G.box(0.22, 0.04, 0.05), M('#f0e8e8'), [0, 0.08, 0.09]);
    const halo = add(h, G.tor(0.2, 0.02, 3, 20), GLOW('#ff2a4a', 2.4), [0, 0.18, -0.15], [0.3, 0, 0]);
    for (let i = 0; i < 6; i++) add(halo, G.cone(0.02, 0.08, 4), GLOW('#ff2a4a', 2.4), [Math.cos(i * 1.047) * 0.2, Math.sin(i * 1.047) * 0.2, 0], [0, 0, i * 1.047 - Math.PI / 2]);
    P.update.push((t) => { halo.rotation.z = t * 0.5; });
    for (const s of [-1, 1]) { const wg = grp(P.spine, [s * 0.08, 0.45, -0.15], [0.2, s * 0.5, 0]); add(wg, G.cone(0.2, 0.55, 3), M('#8a1a2a', { ds: true }), [s * 0.12, -0.12, 0], [0, 0, s * 0.4], [1, 1, 0.08]); }
    holdR(P, NEW_WEAPONS.censer(c), 1.3, [0, -0.05, 0]);
    return P;
  },
  bomber() {
    const c = { cloth: '#6a4a2a', torso: '#c88a2a', metal: '#7a6a5a', glow: '#ffcc3a', skin: '#e8c8a8', leg: '#3a2a1a', arm: '#c88a2a', hand: '#3a2a1a' };
    const P = rig({ c, h: 0.94, bw: 1.0, lw: 1.0, pose: 'onehand' });
    add(P.spine, G.box(0.4, 0.06, 0.28), M('#3a2a1a'), [0, 0.12, 0], [0, 0, 0.4]);
    for (let i = 0; i < 4; i++) { const b = NEW_WEAPONS.bomb(c, 0.6); b.position.set(-0.18 + i * 0.12, 0.02, 0.15); P.hips.add(b); }
    const bag = grp(P.spine, [0, 0.3, -0.18]);
    add(bag, G.ico(0.2, 1), M('#5a4a2a', { r: 1 }), [0, 0, 0], [0, 0, 0], [1, 1, 0.7]);
    const h = P.head;
    face(h, c.skin, '#ffcc3a');
    hair(h, '#e8a02a', 'short');
    goggles(h, '#ffcc3a', 0.12, 0.07);
    add(h, G.box(0.06, 0.02, 0.02), M('#6a2a1a'), [0, -0.07, 0.11]);
    holdR(P, NEW_WEAPONS.bomb(c, 1.3), Math.PI, [0, -0.1, 0.03]);
    return P;
  },
};

export const NEW_POSES = {
  // [shR.x, shR.z, elR.x, shL.x, shL.z, elL.x]
  pistol: [-1.45, -0.05, -0.12, -0.35, 0.2, -1.0],
  dualgun: [-1.4, -0.12, -0.15, -1.4, 0.12, -0.15],
  rifle: [-1.3, -0.3, -0.27, -1.25, 0.8, -0.95],
  heavy: [-0.85, -0.25, -0.75, -0.95, 0.55, -1.05],
  armcannon: [-1.45, -0.05, -0.05, -0.5, 0.25, -1.1],
};
