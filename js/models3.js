import * as THREE from 'three';
import { M, G, add, grp, GLOW, rig, pauldron, eyes, cape, robe, hair, face, WEAPONS } from './models.js';
import { NEW_WEAPONS } from './models2.js';

// ---------------- weapons for heroes 41–60 (built along +Y from the grip) ----------------
const metal = (c, m = 0.8) => M(c.metal || '#7a7a80', { m, r: 0.3 });
export const THIRD_WEAPONS = {
  chakram(c) {
    const g = new THREE.Group();
    add(g, G.cyl(0.02, 0.02, 0.12, 5), M('#3a2018'), [0, 0, 0]);
    const ring = grp(g, [0, 0.2, 0]);
    add(ring, G.tor(0.17, 0.022, 4, 18), metal(c, 0.9), [0, 0, 0]);
    add(ring, G.tor(0.17, 0.008, 3, 18), GLOW(c.glow, 3), [0, 0, 0.012]);
    for (let i = 0; i < 6; i++) add(ring, G.cone(0.03, 0.1, 3), metal(c, 0.9), [Math.cos(i * 1.047) * 0.2, Math.sin(i * 1.047) * 0.2, 0], [0, 0, i * 1.047 - Math.PI / 2], [1, 1, 0.3]);
    ring.userData.spin = 0; g.userData.ring = ring;
    return g;
  },
  frostmaul(c) {
    const g = new THREE.Group();
    add(g, G.cyl(0.04, 0.045, 1.3, 6), M('#4a5a6a', { m: 0.4 }), [0, 0.35, 0]);
    const head = add(g, G.dodec(0.26), M('#bfe8ff', { t: true, op: 0.9, e: '#5ac8ff', ei: 0.6 }), [0, 1.08, 0], [0.3, 0.4, 0], [1.3, 0.9, 0.9]);
    for (let i = 0; i < 5; i++) add(g, G.cone(0.05, 0.22, 4), M('#e0f7ff', { e: '#7fd8ff', ei: 0.8 }), [Math.cos(i * 1.26) * 0.22, 1.12 + Math.sin(i * 2) * 0.08, Math.sin(i * 1.26) * 0.18], [Math.sin(i) * 1.2, 0, Math.cos(i) * 1.2]);
    add(g, G.tor(0.06, 0.015, 3, 8), GLOW(c.glow, 2.4), [0, 0.82, 0], [Math.PI / 2, 0, 0]);
    return g;
  },
  sunstaff(c) {
    const g = new THREE.Group();
    add(g, G.cyl(0.026, 0.03, 1.7, 6), M('#f0e6c8', { m: 0.6, r: 0.3 }), [0, 0.2, 0]);
    const sun = grp(g, [0, 1.18, 0]);
    add(sun, G.ico(0.09, 1), GLOW(c.glow, 3.4), [0, 0, 0]).userData.flicker = true;
    for (let i = 0; i < 8; i++) add(sun, G.cone(0.025, 0.16, 3), M('#e8c060', { m: 0.9, r: 0.25 }), [Math.cos(i * 0.785) * 0.15, Math.sin(i * 0.785) * 0.15, 0], [0, 0, i * 0.785 - Math.PI / 2]);
    add(sun, G.tor(0.15, 0.012, 3, 20), M('#e8c060', { m: 0.9 }), [0, 0, 0]);
    sun.userData.spin = 0.8;
    return g;
  },
  windbow(c) {
    const g = WEAPONS.bow({ ...c, wood: '#c8ecdc' });
    for (const s of [-1, 1]) add(g, G.cone(0.03, 0.25, 3), M('#ffffff', { e: c.glow, ei: 1.2 }), [-0.1, s * 0.58, 0], [0, 0, s * 0.8], [1, 1, 0.2]);
    return g;
  },
  mace(c) {
    const g = new THREE.Group();
    add(g, G.cyl(0.024, 0.028, 0.7, 6), M('#5a4630'), [0, 0.15, 0]);
    add(g, G.ico(0.13, 0), metal(c, 0.85), [0, 0.6, 0]);
    for (let i = 0; i < 6; i++) { const a = i * 1.047; add(g, G.box(0.03, 0.14, 0.16), metal(c, 0.9), [Math.cos(a) * 0.11, 0.6, Math.sin(a) * 0.11], [0, -a, 0]); }
    add(g, G.ico(0.05, 0), GLOW(c.glow, 3), [0, 0.76, 0]);
    return g;
  },
  crossbow(c) {
    const g = NEW_WEAPONS.rifle(c, { short: true });
    const limbs = grp(g, [0, 0.66, 0.02]);
    for (const s of [-1, 1]) add(limbs, G.box(0.38, 0.04, 0.03), M('#5a3a22'), [s * 0.2, 0, 0], [0, 0, s * 0.18]);
    add(limbs, G.cyl(0.004, 0.004, 0.7, 3), M('#e8e0d0'), [0, -0.08, 0], [0, 0, Math.PI / 2]);
    add(g, G.cone(0.025, 0.12, 4), GLOW(c.glow, 2), [0, 0.82, 0.05]);
    return g;
  },
  rapier(c) {
    const g = new THREE.Group();
    add(g, G.cyl(0.02, 0.02, 0.16, 5), M('#2a2a3a'), [0, 0, 0]);
    add(g, G.tor(0.07, 0.01, 3, 12, Math.PI), metal(c, 0.9), [0.02, 0.06, 0], [0, Math.PI / 2, 0]);
    add(g, G.cyl(0.0, 0.016, 1.0, 4), M('#dfefff', { m: 0.9, r: 0.15, e: '#7fd8ff', ei: 0.3 }), [0, 0.6, 0]);
    add(g, G.box(0.006, 0.8, 0.006), GLOW(c.glow, 3), [0, 0.52, 0.008]);
    return g;
  },
  flail(c) {
    const g = new THREE.Group();
    add(g, G.cyl(0.03, 0.035, 0.55, 6), M('#2a2026'), [0, 0.1, 0]);
    for (let i = 0; i < 5; i++) add(g, G.tor(0.025, 0.008, 3, 6), metal(c), [0, 0.4 + i * 0.06, 0], [i % 2 ? 0 : Math.PI / 2, 0, 0]);
    add(g, G.ico(0.13, 0), M('#3a3440', { m: 0.8, r: 0.4 }), [0, 0.78, 0]);
    for (let i = 0; i < 8; i++) { const v = new THREE.Vector3().setFromSphericalCoords(0.13, Math.acos(1 - 2 * (i + 0.5) / 8), i * 2.4); const s = add(g, G.cone(0.03, 0.1, 4), metal(c), [v.x, 0.78 + v.y, v.z]); s.lookAt(new THREE.Vector3(v.x * 3, 0.78 + v.y * 3, v.z * 3)); s.rotateX(Math.PI / 2); }
    add(g, G.ico(0.04, 0), GLOW(c.glow, 2.5), [0, 0.78, 0.12]);
    return g;
  },
  sunrifle(c) {
    const g = NEW_WEAPONS.rifle(c);
    add(g, G.oct(0.06), GLOW(c.glow, 3.4), [0, 0.12, 0.08], [0, 0, 0], [0.8, 1.6, 0.8]).userData.flicker = true;
    for (let i = 0; i < 3; i++) add(g, G.tor(0.04, 0.008, 3, 10), M('#e8c060', { m: 0.9 }), [0, 0.5 + i * 0.18, 0.02], [Math.PI / 2, 0, 0]);
    return g;
  },
  rivetgun(c) {
    const g = NEW_WEAPONS.pistol(c, { drum: true });
    add(g, G.cyl(0.05, 0.05, 0.05, 8), M('#b8862a', { m: 0.9 }), [0.05, 0.12, 0.015], [0, 0, Math.PI / 2]);
    add(g, G.tor(0.03, 0.008, 3, 8), GLOW(c.glow, 2), [0, 0.42, 0.015], [Math.PI / 2, 0, 0]);
    return g;
  },
  netlauncher: null,
  hive(c) {
    const g = new THREE.Group();
    add(g, G.cyl(0.012, 0.012, 0.12, 4), M('#3a2a18'), [0, 0.02, 0]);
    add(g, G.ico(0.1, 1), M('#e8b040', { r: 0.8, e: '#ff9a20', ei: 0.3 }), [0, 0.14, 0.06], [0, 0, 0], [1, 1.2, 1]);
    for (let i = 0; i < 3; i++) add(g, G.tor(0.1 - Math.abs(i - 1) * 0.02, 0.012, 3, 10), M('#a8781a'), [0, 0.08 + i * 0.06, 0.06], [Math.PI / 2, 0, 0]);
    return g;
  },
};
delete THIRD_WEAPONS.netlauncher;

// ---------------- helpers ----------------
const hold = (P, side, w, rx = 2.5, pos = [0, -0.05, 0.02]) => { (side < 0 ? P.handL : P.handR).add(w); w.rotation.set(rx, 0, 0); w.position.set(...pos); if (side < 0) P.weaponL = w; else P.weaponR = w; return w; };
const gun = (P, w) => hold(P, 1, w, Math.PI, [0, -0.06, 0.03]);
const staff = (P, w) => { P.handR.add(w); w.position.set(0, -0.05, 0); w.rotation.set(1.3, 0, 0); P.weaponR = w; return w; };
const orbs = (P) => { const fR = WEAPONS.orbhand(P.c), fL = WEAPONS.orbhand(P.c); P.handR.add(fR); P.handL.add(fL); P.weaponR = fR; P.weaponL = fL; };
const skirt = (P, color, len = 0.45, flare = 0.3) => add(P.hips, G.lathe([[0.18, 0.06], [0.23, -0.2], [flare, -len]], 9), M(color, { ds: true, r: 0.85 }), [0, 0, 0], [0, 0, 0], [1, 1, 0.85]);
const crown = (h, color, glow, n = 5, r = 0.12, y = 0.13) => { for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; add(h, G.cone(0.025, 0.1, 4), M(color, { m: 0.9, r: 0.3 }), [Math.cos(a) * r, y, Math.sin(a) * r]); } add(h, G.tor(r, 0.015, 3, 14), M(color, { m: 0.9 }), [0, y - 0.04, 0], [Math.PI / 2, 0, 0]); if (glow) add(h, G.oct(0.025), GLOW(glow, 3), [0, y - 0.02, r + 0.01]); };
const hood = (h, color, size = 1) => add(h, G.cone(0.19 * size, 0.4 * size, 7), M(color, { r: 0.95 }), [0, 0.08, -0.03], [-0.25, 0, 0]);
const floatRing = (P, color, r = 0.3, y = 0.6, parent = null) => { const g = grp(parent || P.spine, [0, y, 0]); add(g, G.tor(r, 0.01, 3, 24), GLOW(color, 2.4), [0, 0, 0], [Math.PI / 2, 0, 0]); return g; };

export const THIRD_BUILDERS = {
  dancer() {
    const c = { cloth: '#8a1e1a', torso: '#a8281e', metal: '#d8a040', glow: '#ff9a3a', skin: '#c8906a', leg: '#5a1410', arm: '#c8906a', fore: '#c8906a', hand: '#c8906a' };
    const P = rig({ c, h: 0.98, bw: 0.82, lw: 0.82, pose: 'dual' });
    skirt(P, '#c8301e', 0.55, 0.34);
    for (let i = 0; i < 6; i++) add(P.hips, G.cone(0.03, 0.4, 3), M('#ffb04a', { e: '#ff6a1a', ei: 0.6, ds: true }), [Math.cos(i) * 0.25, -0.35, Math.sin(i) * 0.2], [Math.PI, 0, 0]);
    add(P.spine, G.tor(0.15, 0.025, 3, 12), M(c.metal, { m: 0.9 }), [0, 0.52, 0], [Math.PI / 2, 0, 0]);
    const h = P.head;
    face(h, c.skin, '#ffd27a');
    hair(h, '#3a0a08', 'pony');
    add(h, G.box(0.26, 0.04, 0.03), M('#d8a040', { m: 0.9 }), [0, 0.06, 0.1]);
    add(h, G.oct(0.025), GLOW('#ff6a1a', 3), [0, 0.06, 0.12]);
    const veil = cape(P, '#ff7a3a', 0.7, 0.3, true, 0.5); veil.position.z = -0.12;
    const fR = hold(P, 1, THIRD_WEAPONS.chakram(c), 2.6), fL = hold(P, -1, THIRD_WEAPONS.chakram(c), 2.6);
    P.update.push((t) => { fR.userData.ring.rotation.z = t * 4; fL.userData.ring.rotation.z = -t * 4; });
    return P;
  },
  frostgiant() {
    const c = { cloth: '#3a4a5a', torso: '#5a6a7a', armor: '#8ab0c8', metal: '#9ac0d8', glow: '#7fd8ff', skin: '#8ab0c8', leg: '#3a4a5a', arm: '#8ab0c8', fore: '#8ab0c8', hand: '#6a90a8', pelvis: '#3a4a5a' };
    const P = rig({ c, h: 1.2, bw: 1.6, lw: 1.5, kneeGuard: true, pose: 'twohand' });
    const ice = M('#d8f2ff', { t: true, op: 0.9, e: '#5ac8ff', ei: 0.5 });
    for (const s of [-1, 1]) { pauldron(P, s, M('#6a8aa0', { m: 0.3, r: 0.6 }), 1.5); for (let i = 0; i < 3; i++) add(s < 0 ? P.shL : P.shR, G.cone(0.05, 0.3, 4), ice, [s * (0.06 + i * 0.04), 0.14, (i - 1) * 0.07], [0, 0, s * -0.3]); }
    for (let i = 0; i < 5; i++) add(P.spine, G.cone(0.05, 0.32, 4), ice, [(i - 2) * 0.09, 0.62, -0.12], [-0.4, 0, (i - 2) * 0.2]);
    add(P.hips, G.box(0.36, 0.3, 0.03), M('#4a3a2a', { r: 1 }), [0, -0.2, 0.15]);
    const h = P.head;
    add(h, G.ico(0.15, 0), M(c.skin, { r: 0.7 }), [0, 0, 0], [0, 0, 0], [1.1, 1, 1]);
    eyes(h, c.glow, 0.02, 0.13, 0.05, 0.04, 0.016);
    add(h, G.cone(0.13, 0.3, 6), M('#e8f6ff', { r: 0.5 }), [0, -0.16, 0.06], [Math.PI + 0.25, 0, 0]);
    crown(h, '#bfe8ff', c.glow, 6, 0.13, 0.14);
    hold(P, 1, THIRD_WEAPONS.frostmaul(c), 2.45);
    return P;
  },
  dawnpriest() {
    const c = { cloth: '#f4ecd8', torso: '#fff6e0', metal: '#e8c060', glow: '#ffe08a', skin: '#f0d8c0', leg: '#e8dcc0', arm: '#f4ecd8', hand: '#f0d8c0' };
    const P = rig({ c, h: 1.0, bw: 0.9, lw: 0.85, pose: 'staff' });
    robe(P, '#f4ecd8', '#ffd86a', 0.4, 1.0);
    add(P.spine, G.box(0.08, 0.5, 0.03), M('#e8c060', { m: 0.9 }), [0, 0.3, 0.14]);
    add(P.spine, G.oct(0.05), GLOW(c.glow, 3), [0, 0.42, 0.16]);
    const h = P.head;
    face(h, c.skin, '#ffcf6a', { brow: false });
    hair(h, '#f8f0d0', 'long');
    const halo = grp(h, [0, 0.12, -0.14]);
    add(halo, G.tor(0.18, 0.014, 3, 24), GLOW(c.glow, 3), [0, 0, 0]);
    for (let i = 0; i < 12; i++) add(halo, G.cone(0.015, 0.08, 3), GLOW(c.glow, 2), [Math.cos(i * 0.52) * 0.23, Math.sin(i * 0.52) * 0.23, 0], [0, 0, i * 0.52 - Math.PI / 2]);
    for (const s of [-1, 1]) { const w = grp(P.spine, [s * 0.12, 0.45, -0.15]); for (let i = 0; i < 4; i++) add(w, G.box(0.04, 0.32 - i * 0.05, 0.015), M('#fffaf0', { e: '#ffe08a', ei: 0.4 }), [s * (0.08 + i * 0.07), 0.05 - i * 0.04, 0], [0, 0, s * (-0.9 + i * 0.15)]); P.update.push((t) => { w.rotation.y = s * (0.3 + Math.sin(t * 2) * 0.12); }); }
    P.update.push((t) => { halo.rotation.z = t * 0.6; });
    staff(P, THIRD_WEAPONS.sunstaff(c));
    return P;
  },
  tinker() {
    const c = { cloth: '#5a4a3a', torso: '#6a5038', metal: '#b8862a', glow: '#ffb84a', skin: '#d8b090', leg: '#3a3028', arm: '#5a4a3a', hand: '#3a2a1c' };
    const P = rig({ c, h: 0.92, bw: 0.95, lw: 0.9, pose: 'pistol' });
    add(P.hips, G.box(0.42, 0.08, 0.3), M('#4a3a28'), [0, 0.02, 0]);
    for (let i = 0; i < 4; i++) add(P.hips, G.box(0.05, 0.12, 0.04), M('#8a6a3a'), [-0.15 + i * 0.1, -0.05, 0.15]);
    const pack = grp(P.spine, [0, 0.3, -0.2]);
    add(pack, G.box(0.32, 0.4, 0.16), M('#6a5038', { m: 0.5 }), [0, 0, 0]);
    const gear = grp(pack, [0, 0.05, -0.09]);
    add(gear, G.cyl(0.12, 0.12, 0.03, 10), M('#b8862a', { m: 0.9, r: 0.3 }), [0, 0, 0], [Math.PI / 2, 0, 0]);
    for (let i = 0; i < 10; i++) add(gear, G.box(0.04, 0.04, 0.03), M('#b8862a', { m: 0.9 }), [Math.cos(i * 0.628) * 0.14, Math.sin(i * 0.628) * 0.14, 0]);
    add(pack, G.cyl(0.02, 0.02, 0.3, 5), M('#555'), [0.12, 0.3, 0]);
    add(pack, G.ico(0.03, 0), GLOW(c.glow, 3), [0.12, 0.46, 0]);
    P.update.push((t) => { gear.rotation.z = t * 2; });
    const h = P.head;
    face(h, c.skin, '#ffd27a');
    hair(h, '#c8601a', 'short');
    add(h, G.tor(0.04, 0.012, 3, 10), M('#b8862a', { m: 0.9 }), [-0.045, 0.02, 0.11]);
    add(h, G.cyl(0.035, 0.035, 0.02, 10), M('#9af0ff', { t: true, op: 0.6, e: '#5ac8ff', ei: 0.8 }), [-0.045, 0.02, 0.115], [Math.PI / 2, 0, 0]);
    add(h, G.box(0.28, 0.05, 0.05), M('#4a3a28'), [0, 0.1, 0.05]);
    gun(P, THIRD_WEAPONS.rivetgun(c));
    return P;
  },
  windarcher() {
    const c = { cloth: '#2a6a5a', torso: '#3a8a6a', metal: '#c8ecdc', glow: '#8fe0c8', skin: '#e8d0b8', leg: '#2a4a40', arm: '#3a8a6a', hand: '#2a4a40', wood: '#c8ecdc' };
    const P = rig({ c, h: 1.0, bw: 0.85, lw: 0.85, pose: 'bow' });
    skirt(P, '#2a6a5a', 0.4, 0.28);
    const h = P.head;
    face(h, c.skin, '#8fe0c8');
    hair(h, '#e8f8f0', 'pony');
    add(h, G.box(0.26, 0.03, 0.03), M('#8fe0c8', { e: '#2a8a6a', ei: 0.6 }), [0, 0.07, 0.1]);
    for (const s of [-1, 1]) add(h, G.cone(0.03, 0.2, 3), M('#ffffff', { e: '#8fe0c8', ei: 0.6 }), [s * 0.13, 0.08, -0.04], [0.2, 0, s * -1.0]);
    const sc = cape(P, '#8fe0c8', 0.9, 0.12, true, 0.53); sc.position.x = 0.06;
    const sc2 = cape(P, '#5ac0a8', 0.75, 0.1, true, 0.53); sc2.position.x = -0.06;
    const quiver = grp(P.spine, [0.1, 0.32, -0.16], [0, 0, -0.4]);
    add(quiver, G.cyl(0.05, 0.045, 0.4, 6), M('#4a3a28'), [0, 0, 0]);
    for (let i = 0; i < 4; i++) add(quiver, G.cone(0.015, 0.08, 3), M('#ffffff', { e: '#8fe0c8', ei: 1 }), [(i - 1.5) * 0.02, 0.24, 0]);
    const w = THIRD_WEAPONS.windbow(c); P.handL.add(w); w.rotation.set(Math.PI / 2, -Math.PI / 2, 0); w.position.set(0, -0.04, 0); P.weaponL = w;
    return P;
  },
  shaman() {
    const c = { cloth: '#3a4a20', torso: '#4a5a28', metal: '#8a7a4a', glow: '#b8ff5a', skin: '#5a7a3a', leg: '#2a3a18', arm: '#5a7a3a', fore: '#5a7a3a', hand: '#4a6a2a' };
    const P = rig({ c, h: 0.96, bw: 1.1, lw: 1.0, pose: 'staff' });
    robe(P, '#3a3a20', '#8acd32', 0.38, 0.8);
    for (let i = 0; i < 8; i++) add(P.hips, G.box(0.05, 0.3, 0.02), M('#6a7a3a', { ds: true }), [Math.cos(i * 0.785) * 0.24, -0.25, Math.sin(i * 0.785) * 0.2], [0, -i * 0.785, 0]);
    for (let i = 0; i < 5; i++) add(P.spine, G.ico(0.035, 0), M('#e8e0c8'), [(i - 2) * 0.06, 0.5 - Math.abs(i - 2) * 0.03, 0.13]);
    const h = P.head;
    add(h, G.ico(0.13, 0), M(c.skin, { r: 0.8 }), [0, 0, 0]);
    eyes(h, c.glow, 0.02, 0.12, 0.045);
    add(h, G.box(0.24, 0.24, 0.04), M('#d8c8a0', { r: 0.9 }), [0, 0.01, 0.12]);
    eyes(h, c.glow, 0.03, 0.145, 0.05, 0.04, 0.02);
    for (const s of [-1, 1]) add(h, G.cone(0.04, 0.3, 4), M('#d8c8a0'), [s * 0.14, 0.15, -0.02], [0, 0, s * -0.5]);
    const fl = grp(P.spine, [0, 0.9, 0]);
    for (let i = 0; i < 3; i++) add(fl, G.ico(0.03, 0), GLOW('#b8ff5a', 3), [Math.cos(i * 2.1) * 0.3, 0, Math.sin(i * 2.1) * 0.3]);
    P.update.push((t) => { fl.rotation.y = t * 1.4; fl.position.y = 0.9 + Math.sin(t * 2) * 0.05; });
    staff(P, WEAPONS.vinestaff(c));
    return P;
  },
  swordsaint() {
    const c = { cloth: '#2a2e4a', torso: '#3a405a', metal: '#c8d0e8', glow: '#a8c0ff', skin: '#e8d8c8', leg: '#1a1e30', arm: '#3a405a', hand: '#2a2e3a' };
    const P = rig({ c, h: 1.04, bw: 0.95, lw: 0.9, pose: 'onehand' });
    add(P.hips, G.lathe([[0.18, 0.05], [0.26, -0.3], [0.32, -0.75]], 8), M('#1a1e30', { ds: true }), [0, 0, 0], [0, 0, 0], [1, 1, 0.8]);
    add(P.spine, G.box(0.42, 0.06, 0.3), M('#c8d0e8'), [0, 0.06, 0], [0, 0, 0]);
    pauldron(P, -1, M('#3a405a', { m: 0.6 }), 1.0);
    const h = P.head;
    face(h, c.skin, '#a8c0ff');
    hair(h, '#e8ecf8', 'bun');
    add(h, G.box(0.3, 0.025, 0.02), M('#a8c0ff', { e: '#5a7aff', ei: 0.8 }), [0, 0.07, 0.1]);
    const tail = cape(P, '#a8c0ff', 0.5, 0.06, false, 0.6); tail.position.set(0, 0.1, -0.05);
    // sheath on the left hip
    add(P.hips, G.cyl(0.03, 0.03, 0.9, 6), M('#1a1a2a', { m: 0.4 }), [-0.22, -0.1, -0.05], [0.6, 0, 0.3]);
    const sparks = grp(P.root, [0, 1.2, 0]);
    for (let i = 0; i < 4; i++) add(sparks, G.oct(0.02), GLOW('#a8c0ff', 3), [Math.cos(i * 1.57) * 0.5, Math.sin(i * 2) * 0.2, Math.sin(i * 1.57) * 0.5]);
    P.update.push((t) => { sparks.rotation.y = t * 3; sparks.children.forEach((s, i) => { s.visible = Math.sin(t * 9 + i * 2) > 0.3; }); });
    hold(P, 1, NEW_WEAPONS.katana(c), 2.5);
    return P;
  },
  voidwitch() {
    const c = { cloth: '#1a0a2a', torso: '#2a1040', metal: '#8a5aca', glow: '#b07cff', skin: '#d8c8f0', leg: '#120820', arm: '#1a0a2a', hand: '#d8c8f0' };
    const P = rig({ c, h: 1.0, bw: 0.82, lw: 0.8, pose: 'cast' });
    robe(P, '#1a0a2a', '#9a5cff', 0.42, 1.0);
    const h = P.head;
    face(h, c.skin, '#d8a0ff', { brow: false });
    hair(h, '#3a1a5a', 'long');
    const hat = grp(h, [0, 0.1, 0]);
    add(hat, G.cyl(0.3, 0.3, 0.02, 12), M('#1a0a2a'), [0, 0, 0]);
    add(hat, G.cone(0.14, 0.45, 8), M('#1a0a2a'), [0, 0.22, -0.04], [-0.3, 0, 0]);
    add(hat, G.tor(0.15, 0.015, 3, 12), GLOW(c.glow, 2.5), [0, 0.03, 0], [Math.PI / 2, 0, 0]);
    const orbit = grp(P.root, [0, 1.3, 0]);
    for (let i = 0; i < 5; i++) add(orbit, G.ico(0.04, 0), M('#05010a', { e: '#9a5cff', ei: 0.4 }), [Math.cos(i * 1.26) * 0.55, 0, Math.sin(i * 1.26) * 0.55]);
    P.update.push((t) => { orbit.rotation.y = -t * 0.9; orbit.children.forEach((g, i) => g.position.y = Math.sin(t * 1.7 + i) * 0.15); });
    orbs(P);
    return P;
  },
  frostberserker() {
    const c = { cloth: '#3a2a20', torso: '#c89a78', metal: '#9ac0d8', glow: '#5fb8e8', skin: '#c89a78', leg: '#3a3028', arm: '#c89a78', fore: '#c89a78', hand: '#5a4a3a', pelvis: '#4a3a2a' };
    const P = rig({ c, h: 1.08, bw: 1.35, lw: 1.3, pose: 'dual' });
    const fur = M('#e8e8f0', { r: 1 });
    add(P.spine, G.tor(0.17, 0.065, 5, 9), fur, [0, 0.53, -0.02], [Math.PI / 2, 0, 0], [1.1, 1, 1]);
    for (let i = 0; i < 4; i++) add(P.spine, G.box(0.04, 0.2, 0.02), M('#5fb8e8', { e: '#2a8ac8', ei: 0.8 }), [-0.12 + i * 0.08, 0.32, 0.15], [0, 0, 0.3]);
    add(P.hips, G.box(0.3, 0.35, 0.03), fur, [0, -0.22, 0.14]);
    const h = P.head;
    face(h, c.skin, '#7fd8ff');
    add(h, G.cone(0.12, 0.25, 6), M('#e8a060'), [0, -0.14, 0.06], [Math.PI + 0.2, 0, 0]);
    const helm = grp(h, [0, 0.06, 0]);
    add(helm, G.ico(0.14, 0), M('#6a7a8a', { m: 0.8, r: 0.3 }), [0, 0.02, -0.01], [0, 0, 0], [1.05, 0.8, 1.05]);
    for (const s of [-1, 1]) add(helm, G.cone(0.04, 0.3, 5), M('#e8f6ff', { e: '#5fb8e8', ei: 0.5 }), [s * 0.16, 0.1, 0], [0, 0, s * -0.8]);
    hold(P, 1, WEAPONS.axe({ ...c, glow: '#7fd8ff' }), 2.6); hold(P, -1, WEAPONS.axe({ ...c, glow: '#7fd8ff' }), 2.6);
    return P;
  },
  beekeeper() {
    const c = { cloth: '#e8d8a0', torso: '#f0e0b0', metal: '#a8781a', glow: '#ffc83a', skin: '#e8c8a0', leg: '#c8b880', arm: '#f0e0b0', hand: '#f0e8d0' };
    const P = rig({ c, h: 0.95, bw: 1.0, lw: 0.95, pose: 'cast' });
    add(P.hips, G.lathe([[0.19, 0.06], [0.25, -0.3], [0.28, -0.6]], 9), M('#e8d8a0', { ds: true }), [0, 0, 0]);
    const h = P.head;
    face(h, c.skin, '#ffc83a');
    add(h, G.cyl(0.3, 0.3, 0.02, 12), M('#f0e8d0'), [0, 0.1, 0]);
    add(h, G.cyl(0.14, 0.15, 0.14, 10), M('#f0e8d0'), [0, 0.17, 0]);
    add(h, G.cyl(0.28, 0.24, 0.3, 12, 1, true), M('#2a2a2a', { t: true, op: 0.35, ds: true }), [0, -0.05, 0]);
    const swarm = grp(P.root, [0, 1.2, 0]);
    for (let i = 0; i < 7; i++) { const b = grp(swarm, [0, 0, 0]); add(b, G.ico(0.025, 0), M('#ffc83a', { e: '#ff9a20', ei: 0.6 }), [0, 0, 0], [0, 0, 0], [1.3, 1, 1]); add(b, G.box(0.04, 0.005, 0.02), M('#ffffff', { t: true, op: 0.6 }), [0, 0.02, 0]); }
    P.update.push((t) => { swarm.children.forEach((b, i) => { const a = t * (1.5 + i * 0.2) + i; b.position.set(Math.cos(a) * (0.45 + (i % 3) * 0.1), Math.sin(t * 3 + i) * 0.2, Math.sin(a * 1.3) * (0.45 + (i % 2) * 0.1)); }); });
    hold(P, 1, THIRD_WEAPONS.hive(c), Math.PI); P.weaponL = null;
    const fL = WEAPONS.orbhand(c); P.handL.add(fL); P.weaponL = fL;
    return P;
  },
  lavagolem() {
    const c = { cloth: '#2a1a14', torso: '#3a2a22', metal: '#2a2020', glow: '#ff5a1a', skin: '#3a2a22', leg: '#2a1a14', arm: '#3a2a22', fore: '#3a2a22', hand: '#2a1a14', pelvis: '#2a1a14' };
    const P = rig({ c, h: 1.2, bw: 1.7, lw: 1.6, pose: 'claws' });
    const rock = M('#3a2a22', { r: 0.95 }), lava = GLOW('#ff5a1a', 2.2);
    for (let i = 0; i < 7; i++) add(P.spine, G.dodec(0.12), rock, [Math.cos(i) * 0.18, 0.2 + (i % 3) * 0.15, Math.sin(i) * 0.12 + 0.05]);
    for (let i = 0; i < 6; i++) add(P.spine, G.box(0.02, 0.18, 0.02), lava, [(i - 2.5) * 0.07, 0.3 + Math.sin(i) * 0.1, 0.17], [0, 0, Math.sin(i * 3) * 0.6]);
    for (const s of [-1, 1]) { pauldron(P, s, rock, 1.7); add(s < 0 ? P.shL : P.shR, G.cone(0.06, 0.3, 4), lava, [s * 0.06, 0.18, 0], [0, 0, s * -0.3]); }
    const h = P.head;
    add(h, G.dodec(0.14), rock, [0, 0, 0]);
    eyes(h, '#ffb03a', 0.0, 0.13, 0.05, 0.045, 0.02);
    add(h, G.box(0.14, 0.02, 0.02), lava, [0, -0.07, 0.12]);
    const core = add(P.spine, G.ico(0.07, 1), GLOW('#ffb03a', 4), [0, 0.38, 0.16]);
    P.update.push((t) => { core.scale.setScalar(1 + Math.sin(t * 5) * 0.15); });
    const fR = NEW_WEAPONS.fist({ ...c, glow: '#ff5a1a' }), fL = NEW_WEAPONS.fist({ ...c, glow: '#ff5a1a' });
    P.handR.add(fR); P.handL.add(fL); P.weaponR = fR; P.weaponL = fL;
    return P;
  },
  astrologer() {
    const c = { cloth: '#1a1a40', torso: '#2a2a5a', metal: '#d8c8ff', glow: '#c8b8ff', skin: '#f0e8f8', leg: '#14143a', arm: '#2a2a5a', hand: '#f0e8f8' };
    const P = rig({ c, h: 1.0, bw: 0.85, lw: 0.82, pose: 'cast' });
    robe(P, '#1a1a40', '#c8b8ff', 0.42, 1.0);
    for (let i = 0; i < 10; i++) add(P.robe, G.oct(0.015), GLOW('#ffffff', 3), [Math.cos(i * 2.3) * 0.3, -0.2 - (i % 4) * 0.17, Math.sin(i * 2.3) * 0.25]);
    const h = P.head;
    face(h, c.skin, '#e0d8ff', { brow: false });
    hair(h, '#c8b8ff', 'long');
    hood(h, '#1a1a40', 1.05);
    add(h, G.oct(0.03), GLOW('#ffffff', 3.5), [0, 0.09, 0.12]);
    const sky = grp(P.root, [0, 2.15, 0]);
    for (let i = 0; i < 7; i++) add(sky, G.oct(0.035), GLOW(i % 2 ? '#ffffff' : '#c8b8ff', 3), [Math.cos(i * 0.9) * 0.4, Math.sin(i * 1.7) * 0.08, Math.sin(i * 0.9) * 0.4]);
    add(sky, G.tor(0.42, 0.006, 3, 30), GLOW('#c8b8ff', 2), [0, 0, 0], [Math.PI / 2, 0, 0]);
    P.update.push((t) => { sky.rotation.y = t * 0.5; sky.position.y = 2.15 + Math.sin(t * 1.4) * 0.05; });
    orbs(P);
    return P;
  },
  paladin() {
    const c = { cloth: '#f0e8d8', armor: '#d8c890', torso: '#d8c890', metal: '#f0d070', glow: '#fff0a0', skin: '#e8c8a8', leg: '#a89868', arm: '#d8c890', fore: '#d8c890', hand: '#a89868', pelvis: '#a89868' };
    const P = rig({ c, h: 1.1, bw: 1.3, lw: 1.25, kneeGuard: true, pose: 'onehand' });
    const A = M(c.armor, { m: 0.85, r: 0.3 });
    add(P.spine, G.cyl(0.27, 0.2, 0.36, 6), A, [0, 0.36, 0.01], [0, Math.PI / 6, 0], [1, 1, 0.72]);
    add(P.spine, G.box(0.05, 0.25, 0.04), GLOW(c.glow, 2.5), [0, 0.38, 0.17]);
    add(P.spine, G.box(0.18, 0.05, 0.04), GLOW(c.glow, 2.5), [0, 0.42, 0.17]);
    add(P.hips, G.box(0.3, 0.55, 0.03), M('#f0e8d8', { ds: true }), [0, -0.3, 0.13]);
    pauldron(P, -1, A, 1.4); pauldron(P, 1, A, 1.4);
    const h = P.head;
    add(h, G.cyl(0.13, 0.14, 0.26, 8), A, [0, 0, 0]);
    add(h, G.box(0.2, 0.02, 0.05), GLOW(c.glow, 3), [0, 0.02, 0.12]);
    add(h, G.cone(0.04, 0.25, 4), M('#e8e0c8'), [0, 0.24, -0.04], [-0.3, 0, 0]);
    cape(P, '#f0e8d8', 1.1, 0.55, false);
    hold(P, 1, THIRD_WEAPONS.mace(c), 2.5);
    const s = WEAPONS.shield({ ...c, cloth: '#f0e8d8' }); P.handL.add(s); s.position.set(-0.05, -0.05, 0.08); s.rotation.set(0, -Math.PI / 2, 0); s.scale.setScalar(1.25); P.weaponL = s;
    return P;
  },
  hunter() {
    const c = { cloth: '#5a4a32', torso: '#6a5638', metal: '#7a6a5a', glow: '#ffcf6a', skin: '#c8a07a', leg: '#3a3022', arm: '#6a5638', hand: '#3a2a1c' };
    const P = rig({ c, h: 1.02, bw: 1.0, lw: 0.95, pose: 'rifle' });
    const fur = M('#8a7a6a', { r: 1 });
    const pelt = grp(P.spine, [0, 0.55, -0.05]);
    add(pelt, G.tor(0.2, 0.08, 5, 9), fur, [0, 0, 0], [Math.PI / 2, 0, 0], [1.15, 1, 1]);
    add(pelt, G.ico(0.1, 0), fur, [0.16, 0.08, 0.06], [0, 0, 0], [1, 0.8, 1.3]);
    add(pelt, G.cone(0.03, 0.08, 3), fur, [0.2, 0.15, 0.04]);
    eyes(pelt, '#ffcf6a', 0.1, 0.16, 0.025, 0.02, 0.01);
    cape(P, '#6a5a48', 0.85, 0.45);
    const h = P.head;
    face(h, c.skin, '#ffcf6a');
    hair(h, '#3a2a1a', 'short');
    add(h, G.box(0.25, 0.05, 0.03), M('#8a2a1a'), [0, -0.08, 0.1]);
    for (let i = 0; i < 3; i++) add(P.hips, G.cone(0.02, 0.1, 4), M('#e8e0d0'), [-0.1 + i * 0.1, -0.05, 0.15], [Math.PI, 0, 0]);
    gun(P, THIRD_WEAPONS.crossbow(c));
    return P;
  },
  tidepriestess() {
    const c = { cloth: '#1a5a6a', torso: '#2a7a8a', metal: '#c8f0f8', glow: '#5ad8e8', skin: '#d8eef0', leg: '#14404a', arm: '#2a7a8a', hand: '#d8eef0' };
    const P = rig({ c, h: 1.0, bw: 0.85, lw: 0.82, pose: 'cast' });
    robe(P, '#1a5a6a', '#5ad8e8', 0.44, 1.0);
    for (let i = 0; i < 6; i++) add(P.robe, G.tor(0.3 + i * 0.015, 0.008, 3, 16, Math.PI), GLOW('#9af0ff', 1.6), [0, -0.3 - i * 0.1, 0], [Math.PI / 2, 0, i]);
    const h = P.head;
    face(h, c.skin, '#5ad8e8', { brow: false });
    hair(h, '#5ad8e8', 'long');
    for (let i = 0; i < 3; i++) add(h, G.cone(0.03, 0.14, 3), M('#e8f8ff', { e: '#5ad8e8', ei: 0.8 }), [(i - 1) * 0.07, 0.17, -0.02], [0, 0, (i - 1) * 0.3]);
    const drops = grp(P.root, [0, 1.1, 0]);
    for (let i = 0; i < 6; i++) add(drops, G.ico(0.04, 1), M('#9af0ff', { t: true, op: 0.7, e: '#5ad8e8', ei: 0.9 }), [Math.cos(i * 1.05) * 0.5, 0, Math.sin(i * 1.05) * 0.5], [0, 0, 0], [1, 1.3, 1]);
    P.update.push((t) => { drops.rotation.y = t * 0.8; drops.children.forEach((d, i) => d.position.y = Math.sin(t * 2 + i * 1.2) * 0.2); });
    orbs(P);
    return P;
  },
  warden() {
    const c = { cloth: '#2a2430', armor: '#4a4250', torso: '#4a4250', metal: '#6a6274', glow: '#c08aff', skin: '#2a2430', leg: '#2a2430', arm: '#4a4250', fore: '#4a4250', hand: '#2a2430', pelvis: '#2a2430' };
    const P = rig({ c, h: 1.12, bw: 1.45, lw: 1.35, kneeGuard: true, pose: 'twohand' });
    const A = M(c.armor, { m: 0.75, r: 0.4 });
    add(P.spine, G.cyl(0.29, 0.22, 0.38, 6), A, [0, 0.36, 0.01], [0, Math.PI / 6, 0], [1, 1, 0.72]);
    for (let i = 0; i < 9; i++) add(P.spine, G.tor(0.04, 0.012, 3, 6), M('#6a6274', { m: 0.9 }), [-0.24 + i * 0.06, 0.48 - Math.abs(i - 4) * 0.04, 0.17], [0, i % 2 ? Math.PI / 2 : 0, 0]);
    pauldron(P, -1, A, 1.5, 2); pauldron(P, 1, A, 1.5, 2);
    const h = P.head;
    add(h, G.box(0.26, 0.28, 0.26), A, [0, 0.01, 0]);
    for (let i = 0; i < 4; i++) add(h, G.box(0.015, 0.16, 0.02), M('#1a1620'), [(i - 1.5) * 0.045, 0.0, 0.135]);
    eyes(h, c.glow, 0.0, 0.12, 0.045);
    const lantern = grp(P.hips, [0.24, -0.05, 0.05]);
    add(lantern, G.cyl(0.05, 0.06, 0.12, 6), M('#2a2430', { m: 0.8 }), [0, 0, 0]);
    add(lantern, G.ico(0.04, 0), GLOW(c.glow, 3), [0, 0, 0]);
    P.update.push((t, s) => { lantern.rotation.z = Math.sin(t * 3) * 0.2 * (0.3 + (s?.speed || 0) / 6); });
    cape(P, '#1a1620', 1.1, 0.6);
    hold(P, 1, THIRD_WEAPONS.flail(c), 2.45);
    return P;
  },
  stormrider() {
    const c = { cloth: '#2a3a5a', armor: '#5a7a9a', torso: '#4a6a8a', metal: '#c8e0ff', glow: '#7ad0ff', skin: '#e0d0c0', leg: '#2a3a4a', arm: '#4a6a8a', hand: '#2a3a4a', shaft: '#2a3a4a' };
    const P = rig({ c, h: 1.06, bw: 1.0, lw: 0.95, pose: 'onehand' });
    const A = M(c.armor, { m: 0.75, r: 0.35 });
    add(P.spine, G.cyl(0.22, 0.17, 0.34, 6), A, [0, 0.36, 0.01], [0, Math.PI / 6, 0], [1, 1, 0.72]);
    pauldron(P, -1, A, 1.15); pauldron(P, 1, A, 1.15);
    const h = P.head;
    add(h, G.ico(0.14, 0), A, [0, 0.01, 0], [0, 0, 0], [1, 1.05, 1.05]);
    add(h, G.box(0.18, 0.025, 0.04), GLOW(c.glow, 3), [0, 0.02, 0.12]);
    const wings = grp(h, [0, 0.08, 0]);
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) add(wings, G.box(0.02, 0.18 - i * 0.03, 0.04), M('#e8f4ff', { e: c.glow, ei: 0.4 }), [s * (0.15 + i * 0.03), 0.05 + i * 0.04, -0.03], [0, 0, s * (-0.6 - i * 0.2)]);
    const scarf = cape(P, '#7ad0ff', 1.0, 0.18, true, 0.55); scarf.position.x = 0.05;
    const arcs = grp(P.root, [0, 1.0, 0]);
    for (let i = 0; i < 3; i++) add(arcs, G.tor(0.45, 0.005, 3, 20, 1.2), GLOW('#7ad0ff', 3), [0, i * 0.3 - 0.3, 0], [Math.PI / 2, 0, i * 2]);
    P.update.push((t) => { arcs.rotation.y = t * 4; arcs.visible = Math.sin(t * 7) > -0.2; });
    hold(P, 1, NEW_WEAPONS.lance(c), 2.5);
    return P;
  },
  sungunner() {
    const c = { cloth: '#f0e0b0', torso: '#f8e8c0', metal: '#e8c060', glow: '#ffd84a', skin: '#d8a880', leg: '#a88a5a', arm: '#f8e8c0', hand: '#8a6a3a' };
    const P = rig({ c, h: 1.02, bw: 0.95, lw: 0.92, pose: 'rifle' });
    add(P.hips, G.lathe([[0.19, 0.06], [0.24, -0.35], [0.3, -0.8]], 9), M('#f0e0b0', { ds: true }), [0, 0, 0], [0, 0, 0], [1, 1, 0.85]);
    add(P.spine, G.box(0.05, 0.6, 0.3), M('#a8783a'), [0, 0.28, 0], [0, 0, -0.65]);
    pauldron(P, 1, M('#e8c060', { m: 0.9, r: 0.25 }), 1.1);
    const h = P.head;
    face(h, c.skin, '#ffd84a');
    hair(h, '#f8e0a0', 'short');
    const vis = add(h, G.box(0.24, 0.05, 0.04), M('#ffd84a', { t: true, op: 0.75, e: '#ffb020', ei: 1.2 }), [0, 0.03, 0.12]);
    const sun = grp(P.spine, [0, 0.5, -0.25]);
    add(sun, G.tor(0.22, 0.02, 3, 20), M('#e8c060', { m: 0.9 }), [0, 0, 0]);
    for (let i = 0; i < 10; i++) add(sun, G.cone(0.025, 0.12, 3), GLOW('#ffd84a', 2), [Math.cos(i * 0.628) * 0.28, Math.sin(i * 0.628) * 0.28, 0], [0, 0, i * 0.628 - Math.PI / 2]);
    P.update.push((t) => { sun.rotation.z = t * 0.6; });
    gun(P, THIRD_WEAPONS.sunrifle(c));
    return P;
  },
  duelist() {
    const c = { cloth: '#e8f4ff', torso: '#d0e8f8', metal: '#bfe8ff', glow: '#bfe8ff', skin: '#f0e0d8', leg: '#3a4a6a', arm: '#d0e8f8', hand: '#3a4a6a' };
    const P = rig({ c, h: 1.0, bw: 0.85, lw: 0.85, pose: 'onehand' });
    add(P.hips, G.lathe([[0.18, 0.06], [0.22, -0.3], [0.28, -0.6]], 9), M('#e8f4ff', { ds: true }), [0, 0, 0], [0, 0, 0], [1, 1, 0.6]);
    add(P.spine, G.tor(0.13, 0.04, 4, 10), M('#ffffff'), [0, 0.54, 0.02], [Math.PI / 2, 0, 0]);
    for (let i = 0; i < 4; i++) add(P.spine, G.ico(0.02, 0), M('#bfe8ff', { m: 0.9 }), [0.02, 0.45 - i * 0.08, 0.16]);
    const h = P.head;
    face(h, c.skin, '#7fd8ff');
    hair(h, '#e8f4ff', 'long');
    const hat = grp(h, [0, 0.12, 0], [0, 0, -0.15]);
    add(hat, G.cyl(0.25, 0.25, 0.02, 12), M('#3a4a6a'), [0, 0, 0]);
    add(hat, G.cyl(0.12, 0.14, 0.12, 10), M('#3a4a6a'), [0, 0.06, 0]);
    const feather = add(hat, G.cone(0.03, 0.35, 3), M('#bfe8ff', { e: '#7fd8ff', ei: 0.7 }), [-0.12, 0.15, -0.05], [0.3, 0, 0.9]);
    P.update.push((t) => { feather.rotation.x = 0.3 + Math.sin(t * 3) * 0.1; });
    const half = cape(P, '#3a4a6a', 0.85, 0.3, false, 0.52); half.position.x = -0.1;
    hold(P, 1, THIRD_WEAPONS.rapier(c), 2.5);
    return P;
  },
  ashprophet() {
    const c = { cloth: '#3a2a26', torso: '#4a3430', metal: '#c88a5a', glow: '#ff9a5a', skin: '#c8a090', leg: '#2a1e1a', arm: '#4a3430', hand: '#c8a090' };
    const P = rig({ c, h: 0.98, bw: 0.85, lw: 0.82, pose: 'cast' });
    robe(P, '#4a3430', '#ff6a2a', 0.42, 1.0);
    for (let i = 0; i < 8; i++) add(P.robe, G.box(0.05, 0.12, 0.01), M('#2a1a16', { ds: true }), [Math.cos(i * 0.785) * 0.4, -0.95, Math.sin(i * 0.785) * 0.34], [0, -i * 0.785, 0]);
    const h = P.head;
    face(h, c.skin, '#ffb07a', { brow: false });
    hood(h, '#4a3430', 1.1);
    add(h, G.box(0.22, 0.03, 0.02), M('#1a1210'), [0, 0.03, 0.115]);
    const third = add(h, G.oct(0.025), GLOW('#ff9a5a', 4), [0, 0.07, 0.12]);
    const embers = grp(P.root, [0, 0.4, 0]);
    for (let i = 0; i < 8; i++) add(embers, G.oct(0.018), GLOW(i % 2 ? '#ffd27a' : '#ff6a2a', 3), [Math.cos(i * 0.785) * 0.35, i * 0.15, Math.sin(i * 0.785) * 0.35]);
    P.update.push((t) => { embers.rotation.y = t * 0.7; embers.children.forEach((e, i) => { e.position.y = ((t * 0.4 + i * 0.13) % 1.4); }); third.scale.setScalar(1 + Math.sin(t * 4) * 0.2); });
    orbs(P);
    return P;
  },
};
