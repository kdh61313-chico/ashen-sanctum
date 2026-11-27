// Models for heroes 61–64.
import * as THREE from 'three';
import { M, G, add, grp, GLOW, rig, pauldron, eyes, cape, robe, hair, face, WEAPONS } from './models.js';

const hold = (P, side, w, rx = 2.5, pos = [0, -0.05, 0.02]) => { (side < 0 ? P.handL : P.handR).add(w); w.rotation.set(rx, 0, 0); w.position.set(...pos); if (side < 0) P.weaponL = w; else P.weaponR = w; return w; };
const staff = (P, w) => { P.handR.add(w); w.position.set(0, -0.05, 0); w.rotation.set(1.3, 0, 0); P.weaponR = w; return w; };
const skirt = (P, color, len = 0.45, flare = 0.3) => add(P.hips, G.lathe([[0.18, 0.06], [0.23, -0.2], [flare, -len]], 12), M(color, { ds: true, r: 0.85 }), [0, 0, 0], [0, 0, 0], [1, 1, 0.85]);

export const FOURTH_WEAPONS = {
  // a black greatsword with a void seam running down the blade
  abyssblade(c) {
    const g = new THREE.Group();
    add(g, G.cyl(0.026, 0.03, 0.36, 8), M('#1a1218', { r: 0.9 }), [0, 0.02, 0]);
    add(g, G.ico(0.045, 1), M('#3a2a48', { m: 0.8, r: 0.3 }), [0, -0.18, 0]);
    add(g, G.box(0.46, 0.07, 0.08), M('#2a1e36', { m: 0.8, r: 0.35 }), [0, 0.22, 0]);
    for (const s of [-1, 1]) add(g, G.cone(0.04, 0.16, 4), M('#2a1e36', { m: 0.8 }), [s * 0.27, 0.24, 0], [0, 0, s * -1.2]);
    const bl = grp(g, [0, 0.26, 0]);
    add(bl, G.box(0.15, 1.1, 0.035), M('#151018', { m: 0.7, r: 0.3 }), [0, 0.55, 0]);
    add(bl, G.cone(0.075, 0.2, 4), M('#151018', { m: 0.7, r: 0.3 }), [0, 1.2, 0], [0, Math.PI / 4, 0], [1, 1, 0.25]);
    add(bl, G.box(0.03, 1.0, 0.04), GLOW('#9a5aff', 2.6), [0, 0.55, 0]);
    for (let i = 0; i < 5; i++) add(bl, G.cone(0.03, 0.08, 3), M('#151018', { m: 0.7 }), [(i % 2 ? 1 : -1) * 0.085, 0.2 + i * 0.2, 0], [0, 0, (i % 2 ? -1 : 1) * 1.3]);
    return g;
  },
  // stormbow: a recurve bow with a lightning bowstring
  stormbow(c) {
    const g = WEAPONS.bow({ ...c, wood: '#2a3a4a' });
    for (const s of [-1, 1]) {
      add(g, G.cone(0.025, 0.22, 3), M('#cfe8ff', { m: 0.8, e: '#8fd0ff', ei: 0.8 }), [-0.08, s * 0.6, 0], [0, 0, s * 0.7]);
      add(g, G.oct(0.03), GLOW('#bfe8ff', 3.2), [-0.12, s * 0.66, 0]);
    }
    return g;
  },
  // gardener's staff: a crooked branch with a glowing seed pod lantern
  seedstaff(c) {
    const g = new THREE.Group();
    const wood = M('#5a4028', { r: 0.95 });
    let y = 0;
    for (let i = 0; i < 6; i++) { add(g, G.cyl(0.028 - i * 0.002, 0.032 - i * 0.002, 0.3, 6), wood, [Math.sin(i * 1.3) * 0.02, y + 0.15, 0], [0, 0, Math.sin(i) * 0.08]); y += 0.29; }
    const top = grp(g, [0, y + 0.02, 0]);
    for (let i = 0; i < 4; i++) add(top, G.cyl(0.008, 0.012, 0.28, 4), wood, [Math.cos(i * 1.57) * 0.07, 0.08, Math.sin(i * 1.57) * 0.07], [Math.sin(i * 1.57) * 0.5, 0, -Math.cos(i * 1.57) * 0.5]);
    add(top, G.ico(0.075, 1), GLOW('#b8ff8a', 2.6), [0, 0.13, 0]).userData.flicker = true;
    for (let i = 0; i < 6; i++) add(top, G.box(0.09, 0.005, 0.04), M('#6ab04a', { ds: true }), [Math.cos(i) * 0.1, 0.02 + (i % 3) * 0.05, Math.sin(i) * 0.1], [0.3, i, 0.4]);
    top.userData.spin = 0.3;
    return g;
  },
};

export const FOURTH_BUILDERS = {
  starweaver() {
    const c = { cloth: '#f4ecdc', torso: '#fff8e8', metal: '#e8c878', glow: '#ffe6a8', skin: '#f2e2d2', leg: '#e8dcc8', arm: '#f4ecdc', hand: '#f2e2d2' };
    const P = rig({ c, h: 1.0, bw: 0.84, lw: 0.82, pose: 'cast' });
    robe(P, '#f4ecdc', '#e8c878', 0.44, 1.05);
    // inner robe with stars sewn in
    for (let i = 0; i < 14; i++) add(P.robe, G.oct(0.013), GLOW(i % 3 ? '#ffffff' : '#ffe6a8', 3), [Math.cos(i * 2.4) * 0.3, -0.15 - (i % 5) * 0.15, Math.sin(i * 2.4) * 0.26]);
    add(P.spine, G.box(0.06, 0.46, 0.02), M('#e8c878', { m: 0.9, r: 0.25 }), [0, 0.3, 0.14]);
    add(P.spine, G.oct(0.04), GLOW(c.glow, 3), [0, 0.46, 0.16]);
    for (const s of [-1, 1]) { const sh = grp(s < 0 ? P.shL : P.shR, [s * 0.04, 0.08, 0]); add(sh, G.ico(0.1, 1), M('#fff8e8', { r: 0.5 }), [0, 0, 0], [0, 0, 0], [1.2, 0.6, 1]); add(sh, G.tor(0.1, 0.01, 3, 16), M('#e8c878', { m: 0.9 }), [0, 0.01, 0], [Math.PI / 2, 0, 0]); }
    const h = P.head;
    face(h, c.skin, '#ffe6a8', { brow: false });
    hair(h, '#f8eed8', 'long');
    // veil and circlet
    add(h, G.cone(0.2, 0.5, 10, 1, true), M('#ffffff', { t: true, op: 0.35, ds: true }), [0, -0.12, -0.03], [0.1, 0, 0]);
    add(h, G.tor(0.135, 0.01, 3, 20), M('#e8c878', { m: 0.9 }), [0, 0.07, 0], [Math.PI / 2 + 0.15, 0, 0]);
    add(h, G.oct(0.028), GLOW('#ffffff', 3.5), [0, 0.09, 0.13]);
    // constellation rings: two tilted orbits with star knots, turning slowly
    const sky = grp(P.root, [0, 1.95, 0]);
    const ringA = grp(sky, [0, 0, 0], [0.5, 0, 0.2]), ringB = grp(sky, [0, 0, 0], [-0.4, 0, -0.3]);
    for (const [r, k] of [[ringA, 0.5], [ringB, 0.62]]) {
      add(r, G.tor(k, 0.005, 3, 40), GLOW('#ffe6a8', 1.8), [0, 0, 0], [Math.PI / 2, 0, 0]);
      for (let i = 0; i < 6; i++) add(r, G.oct(0.03), GLOW(i % 2 ? '#ffffff' : '#ffe6a8', 3.2), [Math.cos(i * 1.05) * k, 0, Math.sin(i * 1.05) * k]);
    }
    P.update.push((t) => { ringA.rotation.y = t * 0.6; ringB.rotation.y = -t * 0.45; sky.position.y = 1.95 + Math.sin(t * 1.3) * 0.04; });
    // star shards orbiting each hand
    for (const hand of [P.handR, P.handL]) {
      const o = grp(hand, [0, -0.06, 0]);
      for (let i = 0; i < 3; i++) add(o, G.oct(0.022), GLOW('#ffffff', 3), [Math.cos(i * 2.1) * 0.11, 0, Math.sin(i * 2.1) * 0.11]);
      P.update.push((t) => { o.rotation.y = t * 3; });
    }
    const oR = WEAPONS.orbhand(c), oL = WEAPONS.orbhand(c); P.handR.add(oR); P.handL.add(oL); P.weaponR = oR; P.weaponL = oL;
    return P;
  },

  abyssking() {
    const c = { cloth: '#1a1220', torso: '#2a1e36', armor: '#3a2a48', metal: '#4a3a5a', glow: '#9a5aff', skin: '#2a1e36', leg: '#1a1220', arm: '#2a1e36', fore: '#3a2a48', hand: '#2a1e36', pelvis: '#1a1220' };
    const P = rig({ c, h: 1.14, bw: 1.35, lw: 1.25, kneeGuard: true, pose: 'twohand' });
    const plate = M('#2e2240', { m: 0.75, r: 0.35 });
    for (const s of [-1, 1]) {
      pauldron(P, s, plate, 1.45, 3, M('#1a1220', { m: 0.6 }));
      add(s < 0 ? P.shL : P.shR, G.box(0.03, 0.12, 0.2), GLOW('#9a5aff', 1.4), [s * 0.2, 0.1, 0]);
    }
    // breastplate with an open void core
    add(P.spine, G.box(0.5, 0.42, 0.06), plate, [0, 0.32, 0.13]);
    const core = add(P.spine, G.ico(0.085, 1), GLOW('#b88aff', 3.5), [0, 0.34, 0.17]);
    add(P.spine, G.tor(0.11, 0.02, 4, 16), M('#120c18', { m: 0.8 }), [0, 0.34, 0.165]);
    for (let i = 0; i < 6; i++) add(P.spine, G.box(0.012, 0.16, 0.01), GLOW('#9a5aff', 1.8), [Math.cos(i * 1.05) * 0.16, 0.34 + Math.sin(i * 1.05) * 0.14, 0.165], [0, 0, i * 1.05 + Math.PI / 2]);
    P.update.push((t) => { core.scale.setScalar(1 + Math.sin(t * 3) * 0.12); });
    add(P.hips, G.box(0.42, 0.34, 0.04), M('#1a1220', { r: 0.9 }), [0, -0.22, 0.14]);
    cape(P, '#160e1e', 1.15, 0.6, true, 0.52);
    // helm: closed visor, long horns curving back, a broken crown
    const h = P.head;
    add(h, G.ico(0.16, 1), plate, [0, 0.01, 0], [0, 0, 0], [1, 1.1, 1.05]);
    add(h, G.box(0.24, 0.03, 0.04), M('#0a060e'), [0, 0.0, 0.14]);
    eyes(h, '#c8a0ff', 0.0, 0.155, 0.05, 0.04, 0.012);
    for (const s of [-1, 1]) {
      const horn = grp(h, [s * 0.12, 0.1, -0.02], [0, 0, s * -0.4]);
      for (let i = 0; i < 4; i++) add(horn, G.cone(0.045 - i * 0.008, 0.16, 5), M('#1a1220', { m: 0.4, r: 0.5 }), [s * i * 0.04, 0.1 + i * 0.1, -i * 0.06], [-0.5 - i * 0.2, 0, s * -0.3]);
    }
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; if (i === 2) continue; add(h, G.cone(0.02, 0.1 + (i % 2) * 0.05, 4), M('#6a5a7a', { m: 0.9, r: 0.3 }), [Math.cos(a) * 0.13, 0.17, Math.sin(a) * 0.13]); }
    hold(P, 1, FOURTH_WEAPONS.abyssblade(c), 2.45);
    return P;
  },

  stormhunter() {
    const c = { cloth: '#2a3a4a', torso: '#34485a', metal: '#cfe8ff', glow: '#8fd0ff', skin: '#e2c8b0', leg: '#1e2a36', arm: '#34485a', hand: '#1e2a36', wood: '#2a3a4a' };
    const P = rig({ c, h: 1.0, bw: 0.88, lw: 0.86, pose: 'bow' });
    skirt(P, '#22303e', 0.42, 0.3);
    // feather mantle over the shoulders
    const mantle = grp(P.spine, [0, 0.5, 0]);
    for (let i = 0; i < 14; i++) { const a = -Math.PI * 0.9 + (i / 13) * Math.PI * 1.8; add(mantle, G.box(0.06, 0.22, 0.012), M(i % 3 ? '#4a5a6a' : '#cfe8ff', { ds: true, r: 0.9 }), [Math.sin(a) * 0.22, -0.08, Math.cos(a) * 0.17], [0.3, a, 0]); }
    add(P.spine, G.box(0.36, 0.04, 0.24), M('#3a2a1e'), [0, 0.12, 0], [0, 0, 0.5]);
    const h = P.head;
    face(h, c.skin, '#8fd0ff');
    hair(h, '#1a1a22', 'short');
    add(h, G.cone(0.2, 0.38, 8), M('#2a3a4a', { r: 0.95 }), [0, 0.07, -0.04], [-0.3, 0, 0]);
    add(h, G.box(0.24, 0.025, 0.02), GLOW('#8fd0ff', 1.6), [0, 0.06, 0.12]);
    // lightning-etched quiver
    const quiver = grp(P.spine, [0.12, 0.3, -0.17], [0, 0, -0.35]);
    add(quiver, G.cyl(0.055, 0.048, 0.42, 8), M('#2a1e16'), [0, 0, 0]);
    add(quiver, G.box(0.01, 0.3, 0.06), GLOW('#8fd0ff', 1.8), [0.05, 0, 0]);
    for (let i = 0; i < 5; i++) add(quiver, G.cone(0.015, 0.09, 3), M('#cfe8ff', { e: '#8fd0ff', ei: 1 }), [(i - 2) * 0.018, 0.26, 0]);
    cape(P, '#2a3a4a', 0.85, 0.32, true, 0.52);
    const w = FOURTH_WEAPONS.stormbow(c); P.handL.add(w); w.rotation.set(Math.PI / 2, -Math.PI / 2, 0); w.position.set(0, -0.04, 0); P.weaponL = w;
    // a faint spark that hops along the bowstring
    const spark = add(w, G.oct(0.02), GLOW('#ffffff', 4), [-0.12, 0, 0]);
    P.update.push((t) => { spark.position.y = Math.sin(t * 7) * 0.55; spark.visible = Math.sin(t * 23) > -0.3; });
    return P;
  },

  mossgardener() {
    const c = { cloth: '#4a5a2a', torso: '#5a6a34', metal: '#8a7a4a', glow: '#b8ff8a', skin: '#c8a882', leg: '#3a3020', arm: '#5a6a34', hand: '#c8a882' };
    const P = rig({ c, h: 0.96, bw: 0.95, lw: 0.9, pose: 'staff' });
    robe(P, '#4a5a2a', '#8fe08a', 0.4, 0.9);
    // bark plates and moss tufts
    const bark = M('#5a4028', { r: 0.95 }), moss = M('#6a9a3a', { r: 1 });
    add(P.spine, G.box(0.42, 0.3, 0.05), bark, [0, 0.3, 0.12], [0.05, 0, 0]);
    for (let i = 0; i < 8; i++) add(P.spine, G.ico(0.04 + (i % 3) * 0.015, 0), moss, [Math.cos(i * 0.8) * 0.2, 0.46 + Math.sin(i * 1.7) * 0.05, Math.sin(i * 0.8) * 0.12 + 0.02]);
    for (const s of [-1, 1]) {
      const sh = grp(s < 0 ? P.shL : P.shR, [s * 0.05, 0.1, 0]);
      add(sh, G.ico(0.1, 0), moss, [0, 0, 0], [0, 0, 0], [1.3, 0.6, 1.1]);
      for (let i = 0; i < 3; i++) { add(sh, G.cyl(0.012, 0.016, 0.08, 5), M('#e8dcc0'), [s * (0.02 + i * 0.04), 0.07, (i - 1) * 0.04]); add(sh, G.ico(0.035, 0), M(i % 2 ? '#c84a3a' : '#e8a040', { r: 0.7 }), [s * (0.02 + i * 0.04), 0.12, (i - 1) * 0.04], [0, 0, 0], [1, 0.5, 1]); }
    }
    // satchel of seed jars
    const bag = grp(P.hips, [0.2, -0.05, 0.08], [0, 0, 0.2]);
    add(bag, G.box(0.14, 0.14, 0.08), M('#6a4a2a'), [0, 0, 0]);
    for (let i = 0; i < 3; i++) add(bag, G.cyl(0.018, 0.018, 0.06, 6), GLOW(['#b8ff8a', '#ffe08a', '#8fd0ff'][i], 1.6), [(i - 1) * 0.04, 0.09, 0]);
    const h = P.head;
    face(h, c.skin, '#b8ff8a');
    hair(h, '#3a2a1a', 'short');
    // wide-brimmed hat grown over with moss and a sprout
    add(h, G.cyl(0.3, 0.3, 0.02, 16), M('#4a3a22', { r: 0.95 }), [0, 0.1, 0]);
    add(h, G.cyl(0.13, 0.16, 0.16, 12), M('#4a3a22', { r: 0.95 }), [0, 0.18, 0]);
    for (let i = 0; i < 7; i++) add(h, G.ico(0.04, 0), moss, [Math.cos(i * 0.9) * 0.22, 0.12, Math.sin(i * 0.9) * 0.22], [0, 0, 0], [1, 0.5, 1]);
    const sprout = grp(h, [0.05, 0.26, 0]);
    add(sprout, G.cyl(0.005, 0.007, 0.1, 4), M('#6ab04a'), [0, 0.05, 0]);
    for (const s of [-1, 1]) add(sprout, G.box(0.06, 0.004, 0.03), M('#8fe08a', { ds: true }), [s * 0.03, 0.1, 0], [0, 0, s * 0.4]);
    P.update.push((t) => { sprout.rotation.z = Math.sin(t * 1.6) * 0.15; });
    staff(P, FOURTH_WEAPONS.seedstaff(c));
    return P;
  },
};
