import * as THREE from 'three';
import { buildHero, M } from './models.js';
import { skinObject, skinFx } from './skins.js';
import { Trail, runeTex } from './fx.js';

// ============================================================================
// First-person view model.
// Rendered in its own scene with its own camera (no clipping into walls, no
// FOV stretching). The weapon is posed by keyframes; the hands are placed on
// the weapon's grip points every frame and the arms are solved with 2-bone IK
// from shoulders that sit just off screen, so the hands never float.
// ============================================================================

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => { x = clamp01(x); return 1 - Math.pow(1 - x, 3); };
const easeIn = (x) => { x = clamp01(x); return x * x * x; };
const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const mix = (a, b, k) => a + (b - a) * k;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const E = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, 'XYZ'));
const Y_UP = V(0, 1, 0);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
const _a = V(), _b = V(), _c = V(), _d = V();

function basis(y, zHint, out = new THREE.Quaternion()) {
  const Y = _a.copy(y).normalize();
  const X = _b.crossVectors(Y, zHint).normalize();
  if (X.lengthSq() < 1e-6) X.set(1, 0, 0);
  const Z = _c.crossVectors(X, Y).normalize();
  _m.makeBasis(X, Y, Z);
  return out.setFromRotationMatrix(_m);
}

// pose = { h: Vector3 (right grip position), q: Quaternion (weapon orientation) }
const P = (h, r) => ({ h: V(...h), q: E(...r) });
// orientation from where the weapon points (its +Y) and which way its edge (+X) faces, in camera space
function aimQ(dir, edge) {
  const y = V(...dir).normalize(), x = V(...edge);
  x.sub(y.clone().multiplyScalar(x.dot(y))).normalize();
  const z = new THREE.Vector3().crossVectors(x, y);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}
const PA = (h, dir, edge) => ({ h: V(...h), q: aimQ(dir, edge) });
function lerpPose(a, b, k, out) {
  out.h.lerpVectors(a.h, b.h, k);
  out.q.slerpQuaternions(a.q, b.q, k);
  return out;
}

// ---------------------------------------------------------------------------
// Arm: upper arm, forearm, bracer, fist / open hand.
// ---------------------------------------------------------------------------
class Arm {
  constructor(parent, side, c) {
    this.side = side;
    const sm = (m) => { const k = m.clone(); k.flatShading = false; k.needsUpdate = true; return k; };
    const sleeve = sm(M(c.arm || c.cloth || '#3a3030', { r: 0.85 }));
    const fore = sm(M(c.fore || c.arm || c.cloth || '#3a3030', { r: 0.8 }));
    const glove = M(c.glove || c.hand || c.skin || '#2a2420', { r: 0.7 });
    const metal = M(c.metal || '#5a5a60', { m: 0.75, r: 0.35 });
    const cylY = (r0, r1, seg = 14) => { const g = new THREE.CylinderGeometry(r1, r0, 1, seg, 1); g.translate(0, 0.5, 0); return g; };
    this.upper = new THREE.Mesh(cylY(0.056, 0.05), sleeve);
    this.fore = new THREE.Mesh(cylY(0.05, 0.038), fore);
    this.elbow = new THREE.Mesh(new THREE.IcosahedronGeometry(0.052, 2), fore);
    this.bracer = new THREE.Mesh(cylY(0.047, 0.044, 8), metal);
    this.bracerTrim = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.006, 4, 12), M(c.glow || '#c9a45c', { e: c.glow || '#c9a45c', ei: 0.8 }));
    for (const m of [this.upper, this.fore, this.elbow, this.bracer, this.bracerTrim]) parent.add(m);

    // fist: bar runs along local Y through the origin, wrist toward +Z
    const fist = new THREE.Group();
    const s = side;
    const box = (w, h, d, x, y, z, rx = 0, ry = 0, rz = 0, mat = glove) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); fist.add(m); return m; };
    box(0.05, 0.088, 0.075, s * 0.03, 0, 0.012);           // back of hand (outer side)
    for (let i = 0; i < 4; i++) box(0.03, 0.02, 0.05, -s * 0.012, 0.03 - i * 0.021, -0.028, 0, 0, 0);   // curled fingers in front of the bar
    for (let i = 0; i < 4; i++) box(0.022, 0.019, 0.03, -s * 0.034, 0.03 - i * 0.021, -0.005);        // finger tips on the palm side
    box(0.028, 0.03, 0.06, -s * 0.02, 0.05, 0.005, 0.25, 0, s * 0.2);                                   // thumb over the top
    box(0.02, 0.07, 0.012, s * 0.056, 0, 0.012, 0, 0, 0, metal);                                         // knuckle plate
    this.fist = fist;
    // open hand: fingers along +Y, palm facing local -Z, wrist at -Y
    const open = new THREE.Group();
    const ob = (w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), glove); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); open.add(m); return m; };
    ob(0.082, 0.085, 0.028, 0, 0, 0);
    for (let i = 0; i < 4; i++) ob(0.017, 0.07 - Math.abs(i - 1.5) * 0.008, 0.018, (i - 1.5) * 0.02, 0.075, -0.004, -0.22 - i * 0.03, 0, (i - 1.5) * -0.05);
    ob(0.02, 0.055, 0.02, s * 0.05, 0.0, -0.01, -0.3, 0, s * -0.7);
    this.open = open;
    this.hand = new THREE.Group();
    this.hand.add(fist); this.hand.add(open);
    parent.add(this.hand);
    this.mode = 'fist';
    this.all = [this.upper, this.fore, this.elbow, this.bracer, this.bracerTrim, this.hand];
    this.lenU = 0.34; this.lenF = 0.31;
    this.S = V(); this.Ev = V(); this.W = V();
  }
  setMode(m) { this.mode = m; this.fist.visible = m === 'fist'; this.open.visible = m === 'open'; }
  setVisible(v) { for (const m of this.all) m.visible = v; if (v) this.setMode(this.mode); }
  // two-bone IK from shoulder S to target T, bending toward pole
  solve(S, T, pole, outE) {
    const a = this.lenU, b = this.lenF;
    const d = _d.subVectors(T, S); let L = d.length();
    const max = (a + b) * 0.995;
    const s0 = this.S.copy(S);
    if (L > max) { s0.addScaledVector(d, (L - max) / L); L = max; d.subVectors(T, s0); }
    if (L < Math.abs(a - b) + 0.01) L = Math.abs(a - b) + 0.01;
    const dn = d.clone().normalize();
    const cos = clamp01((a * a + L * L - b * b) / (2 * a * L) * 0.5 + 0.5) * 2 - 1;
    const sin = Math.sqrt(Math.max(0, 1 - cos * cos));
    const pp = pole.clone().addScaledVector(dn, -pole.dot(dn)).normalize();
    outE.copy(s0).addScaledVector(dn, a * cos).addScaledVector(pp, a * sin);
    return s0;
  }
  seg(mesh, A, B) {
    const d = _d.subVectors(B, A); const L = d.length();
    mesh.position.copy(A);
    mesh.quaternion.setFromUnitVectors(Y_UP, d.multiplyScalar(1 / (L || 1)));
    mesh.scale.set(1, L, 1);
  }
  // place hand at pos. Fist: barAxis is the grip axis. Open: q is the hand orientation.
  place(S, pos, barOrQ, pole) {
    const E1 = this.Ev;
    let wrist;
    if (this.mode === 'open') {
      this.hand.quaternion.copy(barOrQ);
      wrist = V(0, -0.062, 0.012).applyQuaternion(barOrQ).add(pos);
      this.solve(S, wrist, pole, E1);
    } else {
      this.solve(S, pos, pole, E1);
      const toE = _c.subVectors(E1, pos);
      basis(barOrQ, toE, this.hand.quaternion);
      wrist = V(0, -0.004, 0.05).applyQuaternion(this.hand.quaternion).add(pos);
      this.solve(S, wrist, pole, E1);
    }
    const S0 = this.S;
    this.hand.position.copy(pos);
    this.seg(this.upper, S0, E1);
    this.elbow.position.copy(E1);
    this.seg(this.fore, E1, wrist);
    // bracer just behind the wrist
    const dir = _a.subVectors(wrist, E1).normalize();
    const bs = _b.copy(wrist).addScaledVector(dir, -0.12);
    this.seg(this.bracer, bs, _c.copy(wrist).addScaledVector(dir, -0.025));
    this.bracerTrim.position.copy(wrist).addScaledVector(dir, -0.03);
    this.bracerTrim.quaternion.setFromUnitVectors(V(0, 0, 1), dir);
  }
}

// ---------------------------------------------------------------------------
// Per-pose layout. h = right grip position in view space, r = weapon euler.
// ---------------------------------------------------------------------------
function layoutFor(pose, len, minY, hero, wid = 0) {
  const gunQ = (x = 0, y = 0, z = 0) => [-Math.PI / 2 + x, y, z];
  switch (pose) {
    case 'twohand': {
      const pole = minY < -0.4;
      if (wid > 0.3 && !pole) return { kind: 'heavyMelee', scale: Math.min(0.62, 1.1 / Math.max(1, len)), rest: PA([0.31, -0.42, -0.5], [0.18, 0.62, -0.62], [0.3, 0, -1]), gripR: V(0, 0.13, 0), gripL: V(0, -0.04, 0), dur: 0.46 };
      return { kind: 'heavyMelee', scale: Math.min(0.72, 1.25 / Math.max(1, len)), rest: P([0.24, -0.33, -0.42], [0.28, 0.4, -0.85]), gripR: V(0, 0.13, 0), gripL: V(0, pole ? -0.3 : -0.04, 0), dur: 0.46 };
    }
    case 'onehand':
      if (len > 2.0) return { kind: 'polearm', scale: 0.72, rest: PA([0.21, -0.3, -0.44], [-0.12, 0.3, -0.95], [1, 0, 0]), gripR: V(0, 0, 0), gripL: V(0, 0.42, 0), dur: 0.4 };
      if (len < 0.5) return { kind: 'knife', scale: wid > 0.17 ? 0.62 : 1.1, rest: P([0.23, -0.26, wid > 0.17 ? -0.48 : -0.4], [-1.05, 0.3, 0.25]), gripR: V(0, 0.02, 0), dur: 0.3 };
      return { kind: 'sword', scale: Math.min(0.8, 0.95 / Math.max(0.8, len)), rest: PA([0.25, -0.3, -0.44], [-0.32, 0.62, -0.7], [0.35, 0.1, -1]), gripR: V(0, 0.02, 0), dur: 0.38 };
    case 'dual': return len > 0.6 ? { kind: 'dual', scale: 0.6, rest: PA([0.27, -0.31, -0.43], [-0.22, 0.68, -0.7], [-0.75, 0.2, -0.65]), gripR: V(0, 0.05, 0), dur: 0.27 } : { kind: 'dual', scale: wid > 0.3 ? 0.6 : 1.05, rest: P([0.25, -0.27, -0.44], [-1.05, 0.25, 0.28]), gripR: V(0, 0.02, 0), dur: 0.27 };
    case 'claws': return { kind: 'claws', gauntlet: wid > 0.2, scale: wid > 0.2 ? 0.42 : 1.15, rest: P([0.22, -0.27, -0.38], [-1.4, 0.2, 0.2]), gripR: V(0, 0, 0), dur: 0.25 };
    case 'staff': return { kind: 'staff', scale: 0.8, rest: P([0.27, -0.34, -0.5], [-0.26, 0.25, 0.14]), gripR: V(0, 0.42, 0), dur: 0.34 };
    case 'bow': return { kind: 'bow', scale: 0.62, dur: 0.3 };
    case 'cast': return { kind: 'cast', dur: 0.32 };
    case 'pistol': return { kind: 'pistol', scale: 1.05, rest: P([0.18, -0.22, -0.44], gunQ(-0.16, 0.42, 0)), gripR: V(0, -0.02, -0.06), gripL: V(-0.045, -0.035, -0.085), barAxis: V(0, 0.32, 1), kick: 1.25, dur: 0.16 };
    case 'dualgun': return { kind: 'dualgun', scale: 0.98, rest: P([0.23, -0.22, -0.46], gunQ(-0.16, 0.38, -0.1)), gripR: V(0, -0.02, -0.06), barAxis: V(0, 0.32, 1), kick: 1, dur: 0.16 };
    case 'rifle': return { kind: 'rifle', scale: 0.74, rest: P([0.165, -0.225, -0.42], gunQ(-0.04, 0.08, 0)), gripR: V(0, -0.03, -0.07), gripL: V(0, 0.45, -0.05), barAxis: V(0, 0.3, 1), barAxisL: V(0, 1, 0), kick: hero.gun === 'long' ? 1.6 : 0.7, dur: 0.16 };
    case 'heavy': return { kind: 'heavy', scale: 0.7, rest: P([0.22, -0.27, -0.44], gunQ(0.0, 0.1, 0)), gripR: V(0, -0.12, -0.07), gripL: V(0, 0.32, -0.06), barAxis: V(0, 0.3, 1), barAxisL: V(0, 1, 0), kick: 0.45, dur: 0.16 };
    case 'armcannon': return { kind: 'armcannon', scale: 0.8, rest: P([0.21, -0.25, -0.3], gunQ(0.04, 0.06, 0)), gripR: V(0, -0.09, 0), barAxis: V(0, 0, 1), kick: 1.1, dur: 0.18 };
    default: return { kind: 'cast', dur: 0.32 };
  }
}

// Melee swing key poses (right grip + weapon orientation), per class and combo.
const SWINGS = {
  // [windup grip, windup orientation, strike grip, strike orientation]; orientation = aimQ(blade direction, edge direction)
  sword: [
    [[0.34, -0.06, -0.3], aimQ([0.5, 0.78, 0.25], [-1, 0, -0.4]), [-0.24, -0.3, -0.5], aimQ([-0.78, -0.2, -0.58], [-0.4, -0.7, 0.3])],   // right → left
    [[-0.16, -0.32, -0.36], aimQ([-0.7, -0.4, -0.35], [1, 0.4, 0]), [0.36, -0.05, -0.48], aimQ([0.62, 0.6, -0.5], [0.4, 0.5, 0.6])],      // rising backhand
    [[0.14, 0.05, -0.26], aimQ([0.06, 0.62, 0.78], [0, 1, -0.3]), [0.05, -0.4, -0.55], aimQ([0, -0.5, -0.86], [0, -1, 0.35])],            // overhead chop
  ],
  heavyMelee: [
    [[0.36, -0.08, -0.3], aimQ([0.45, 0.8, 0.35], [-1, 0, -0.3]), [-0.26, -0.32, -0.5], aimQ([-0.8, -0.25, -0.55], [-0.3, -0.8, 0.3])],
    [[-0.18, -0.36, -0.36], aimQ([-0.72, -0.4, -0.3], [1, 0.4, 0]), [0.38, -0.04, -0.5], aimQ([0.6, 0.62, -0.5], [0.4, 0.5, 0.6])],
    [[0.12, 0.08, -0.24], aimQ([0.05, 0.55, 0.84], [0, 1, -0.3]), [0.04, -0.44, -0.55], aimQ([0, -0.55, -0.83], [0, -1, 0.3])],
  ],
  polearm: [
    [[0.24, -0.25, -0.16], [-1.3, 0.2, 0.18], [0.12, -0.2, -0.72], [-1.5, 0.1, 0.05]],      // thrust
    [[0.24, -0.25, -0.16], [-1.3, 0.2, 0.18], [0.12, -0.2, -0.72], [-1.5, 0.1, 0.05]],
    [[0.36, -0.16, -0.3], [-1.0, 0.4, -1.1], [-0.2, -0.3, -0.45], [-1.5, 0.1, 1.4]],        // sweep
  ],
  knife: [
    [[0.32, -0.16, -0.3], [-0.5, 0.3, -0.8], [-0.06, -0.32, -0.58], [-1.6, 0.2, 1.1]],
    [[0.1, -0.34, -0.3], [-1.4, 0.3, 1.2], [0.3, -0.12, -0.58], [-1.1, 0.3, -0.9]],
    [[0.24, -0.2, -0.24], [-1.2, 0.3, 0.2], [0.08, -0.2, -0.68], [-1.55, 0.2, 0.1]],
  ],
};

// soft star-shaped flash texture (muzzle flash / rune glow)
let _flashTex = null;
function flashTex() {
  if (_flashTex) return _flashTex;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.18, 'rgba(255,230,170,.9)'); grd.addColorStop(0.5, 'rgba(255,140,40,.25)'); grd.addColorStop(1, 'rgba(255,90,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2 + Math.random() * 0.3, l = 40 + Math.random() * 22;
    g.save(); g.translate(64, 64); g.rotate(a);
    const sg = g.createLinearGradient(0, 0, l, 0); sg.addColorStop(0, 'rgba(255,240,200,.9)'); sg.addColorStop(1, 'rgba(255,120,20,0)');
    g.fillStyle = sg; g.beginPath(); g.moveTo(0, -5); g.lineTo(l, 0); g.lineTo(0, 5); g.fill(); g.restore();
  }
  _flashTex = new THREE.CanvasTexture(c); _flashTex.colorSpace = THREE.SRGBColorSpace;
  return _flashTex;
}
const addMat = (color, map = null, op = 1) => new THREE.MeshBasicMaterial({ color, map, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });

// spring helper (vector, under-damped)
class Spring {
  constructor(k = 170, c = 15) { this.x = V(); this.v = V(); this.k = k; this.c = c; }
  step(dt) {
    const n = Math.max(1, Math.ceil(dt / 0.008)), h = dt / n;
    for (let i = 0; i < n; i++) { this.v.addScaledVector(this.x, -this.k * h).multiplyScalar(Math.max(0, 1 - this.c * h)); this.x.addScaledVector(this.v, h); }
  }
}

export class ViewModel {
  constructor(vmScene, vmCam, gameCam) {
    this.scene = vmScene; this.vcam = vmCam; this.cam = gameCam;
    this.root = new THREE.Group();
    vmScene.add(this.root);
    // lights for the arms only
    this.lights = new THREE.Group();
    const hemi = new THREE.HemisphereLight('#d8d0c4', '#2a2018', 0.75);
    const key = new THREE.DirectionalLight('#ffe2c0', 2.2); key.position.set(1.2, 2, 0.6);
    this.hemi = hemi; this.key = key;
    this.rim = new THREE.DirectionalLight('#7fd8ff', 2.2); this.rim.position.set(-1.5, 0.6, -1.4);
    this.flashL = new THREE.PointLight('#ffb050', 0, 1.6, 2);
    this.lights.add(hemi, key, this.rim, this.flashL);
    vmScene.add(this.lights);
    this.t = 0; this.atk = 9; this.cast = 9; this.side = 1; this.combo = 0; this.bob = 0;
    this.sway = V(); this.recoil = new Spring(220, 16); this.recoilR = new Spring(200, 14);
    this.land = new Spring(120, 10); this.jolt = new Spring(160, 12);
    this.reloadT = 0; this.reloadDur = 1; this.equip = 0; this.hs = 0; this.wasAir = false; this.lastVy = 0; this.alive = true;
    this.shells = []; this.trail = null;
    this._pose = { h: V(), q: new THREE.Quaternion() }; this._poseL = { h: V(), q: new THREE.Quaternion() };
    this.release = 9; this.charge = 0;
    this.carry = 0; this.idleT = 0; this.inspect = 9; this.lastShot = 9; this.shotN = 0;
  }

  // light the arms like the arena around them, so the weapon sits in the scene
  setTheme(th) {
    if (!th) return;
    const mixc = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), k);
    this.hemi.color.copy(mixc(th.hemi[0], '#d8d0c4', 0.45)); this.hemi.groundColor.copy(mixc(th.hemi[1], '#2a2018', 0.4)); this.hemi.intensity = 0.8;
    this.key.color.copy(mixc(th.sun[0], '#ffe2c0', 0.35)); this.key.intensity = 1.6 + Math.min(1, th.sun[1] / 3) * 0.8;
    this.rim.color.copy(mixc(th.rim[0], this.def?.color || '#ffffff', 0.45)); this.rim.intensity = 1.2 + th.rim[1] * 0.8;
  }

  dispose() {
    this.trail?.dispose(); this.trail = null; this.trail2?.dispose(); this.trail2 = null;
    for (const sh of this.shells) this.scene.remove(sh.m);
    this.scene.remove(this.root); this.scene.remove(this.lights);
  }

  setHero(def, skin = null) {
    this.skin = skin;
    const fc = skinFx(skin)?.c || def.color; this.fc = fc;
    this.trail?.dispose(); this.trail = null; this.trail2?.dispose(); this.trail2 = null;
    for (const sh of this.shells) this.scene.remove(sh.m);
    this.root.clear(); this.shells = [];
    this.def = def;
    const PH = buildHero(def); // recoloured below without the body FX (rings/motes)
    this.pose = PH.spec.pose; this.isGun = PH.isGun; this.isMelee = PH.isMelee;
    const c = PH.c;
    this.rim.color.set(fc);
    const prep = (w) => {
      if (!w) return null; const k = w.clone(); k.position.set(0, 0, 0); k.rotation.set(0, 0, 0); k.scale.setScalar(1);
      // up close, glowing parts bloom across the screen: tone them down for the first-person copy
      k.traverse(o => { if (o.isMesh && o.material?.emissiveIntensity > 1.2) { o.material = o.material.clone(); o.material.emissiveIntensity = 1.2 + (o.material.emissiveIntensity - 1.2) * 0.35; } });
      return k;
    };
    let wR = prep(PH.weaponR), wL = prep(PH.weaponL);
    const bb = new THREE.Box3();
    if (wR) { wR.updateMatrixWorld(true); bb.setFromObject(wR); }
    const len = wR ? bb.max.y - bb.min.y : 0;
    this.L = layoutFor(this.pose, len, wR ? bb.min.y : 0, def, wR ? Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) : 0);
    const Lk = this.L.kind;
    this.armR = new Arm(this.root, 1, c); this.armL = new Arm(this.root, -1, c);
    this.W = new THREE.Group(); this.root.add(this.W);
    this.W2 = null; this.shield = null; this.bow = null; this.orbs = [];
    if (Lk === 'bow') { this.bow = wL || wR; this.W.add(this.bow); wR = null; wL = null; this.bow.scale.setScalar(this.L.scale); }
    else if (wR && Lk !== 'cast') { this.W.add(wR); wR.scale.setScalar(this.L.scale || 1); }
    if ((Lk === 'dual' || Lk === 'claws' || Lk === 'dualgun') && wL) { this.W2 = new THREE.Group(); this.root.add(this.W2); this.W2.add(wL); wL.scale.setScalar(this.L.scale || 1); }
    else if (wL && (Lk === 'sword' || Lk === 'knife') && wL.getObjectByName('tip') == null) {
      // off-hand item (shield / lantern / orb) rides on the left fist
      this.shield = wL; this.armL.hand.add(wL); wL.scale.setScalar(0.46); wL.position.set(-0.05, 0, -0.06); wL.rotation.set(0, Math.PI / 2, 0);
    }
    this.wR = Lk === 'bow' ? null : wR; this.wL = wL;
    // magic orbs for casters / free hands
    const needOrb = (Lk === 'cast' || Lk === 'staff' || Lk === 'armcannon' || (Lk === 'sword' && !this.shield) || (Lk === 'knife' && !this.shield));
    const mkOrb = (arm) => {
      const g = new THREE.Group();
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.03, 1), addMat('#ffffff'));
      const glow = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 1), addMat(fc, null, 0.5));
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.075, 0.09, 32), addMat(fc, null, 0.7));
      g.add(core, glow, ring); g.position.set(0, 0.06, -0.06);
      arm.open.add(g); this.orbs.push({ g, glow, ring, core });
      return g;
    };
    if (Lk === 'cast') { mkOrb(this.armR); mkOrb(this.armL); }
    else if (needOrb && Lk !== 'knife' && Lk !== 'sword') mkOrb(this.armL);
    else if (needOrb) { mkOrb(this.armL); this.orbs[0].g.visible = false; }
    if (skin) skinObject(this.root, skin);
    // gun details
    this.slides = [this.W.getObjectByName('slide'), this.W2?.getObjectByName('slide')].map(o => o ? { o, y: o.position.y, t: 9 } : null);
    this.muzR = this.W.getObjectByName('muzzle') || null;
    this.muzL = this.W2?.getObjectByName('muzzle') || null;
    this.barrel = this.W.getObjectByName('barrel') || null;
    this.tip = this.W.getObjectByName('tip') || null; this.tipBase = this.W.getObjectByName('tipbase') || null;
    this.tip2 = this.W2?.getObjectByName('tip') || null; this.tipBase2 = this.W2?.getObjectByName('tipbase') || null;
    this.flashes = [];
    for (const m of [this.muzR, this.muzL]) {
      if (!m) continue;
      const g = new THREE.Group();
      const big = this.L.kind === 'rifle' || this.L.kind === 'armcannon' || this.L.kind === 'heavy';
      for (let i = 0; i < 2; i++) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), addMat('#ffd9a0', flashTex())); pl.rotation.y = i * Math.PI / 2; pl.position.y = 0.06; pl.scale.set(0.12, 0.24, 1); g.add(pl); }
      const face = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), addMat('#fff0c8', flashTex())); face.rotation.x = Math.PI / 2; face.scale.setScalar(big ? 0.22 : 0.15); g.add(face);
      if (this.L.kind === 'heavy' && def.abilities.lmb.look === 'flame') g.scale.setScalar(0.01);
      g.scale.multiplyScalar(big ? 1.35 : 1);
      g.userData.base = g.scale.x;
      g.visible = false; m.add(g); this.flashes.push({ g, m, t: 9 });
    }
    // bow string + arrow
    if (this.bow) {
      this.bow.traverse(o => { if (o.userData.string) this.string = o; });
      this.stringX0 = this.string ? this.string.position.x : -0.26;
      const arrow = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.78, 5), M('#3a2a1c'));
      shaft.rotation.z = Math.PI / 2; shaft.position.x = 0.39; arrow.add(shaft);
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.07, 4), M('#cfd8e0', { m: 0.9, r: 0.2, e: fc, ei: 0.6 }));
      head.rotation.z = -Math.PI / 2; head.position.x = 0.8; arrow.add(head);
      for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.002), M(fc, { e: fc, ei: 0.4 })); f.position.set(0.05, 0, 0); f.rotation.x = i * Math.PI / 3 * 2; arrow.add(f); }
      arrow.position.set(this.stringX0, 0.02, 0);
      this.bow.add(arrow); this.arrow = arrow;
    }
    // skill rune disc in front of the casting palm
    this.rune = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), addMat(fc, runeTex(), 0));
    this.rune.visible = false; this.root.add(this.rune);
    this.ultRune = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), addMat(fc, runeTex(), 0));
    this.ultRune.visible = false; this.root.add(this.ultRune);
    // trails (drawn in view space)
    if (this.tip) this.trail = new Trail(this.scene, fc, 12, 0.42);
    if (this.tip2) this.trail2 = new Trail(this.scene, fc, 10, 0.42);
    // muzzle aim convergence for guns: rotate rest so the barrel points at the crosshair 25 m out
    if (this.isGun && this.muzR) {
      this.root.updateMatrixWorld(true);
      const r = this.L.rest; const mz = this.muzR.position.clone().multiplyScalar(this.L.scale || 1).sub(this.L.gripR.clone().multiplyScalar(this.L.scale || 1)).applyQuaternion(r.q).add(r.h);
      const want = V(0, 0, -25).sub(mz).normalize();
      const have = V(0, 1, 0).applyQuaternion(r.q);
      r.q.premultiply(_q.setFromUnitVectors(have, want.lerp(have, 0.85).normalize()));
    }
    this.flick = [];
    this.root.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; o.frustumCulled = false; } if (o.userData.flicker || o.userData.spin) this.flick.push(o); });
    this.armR.setMode(Lk === 'cast' ? 'open' : 'fist');
    this.armL.setMode((Lk === 'cast' || Lk === 'staff' || Lk === 'armcannon' || ((Lk === 'sword' || Lk === 'knife') && !this.shield)) ? 'open' : 'fist');
    if (Lk === 'armcannon') this.armR.hand.visible = false;
    if (this.L.gauntlet) { this.armR.hand.visible = false; this.armL.hand.visible = false; }
    this.equip = 0; this.atk = 9; this.cast = 9; this.reloadT = 0; this.release = 9;
    this.root.visible = true;
  }

  attack(slot, combo = 0) {
    if (slot === 'lmb') {
      this.atk = 0; this.side = -this.side; this.combo = combo;
      if (this.isGun) {
        this.lastShot = 0; this.shotN++; this.inspect = 9; this.idleT = 0;
        { const sl = this.slides?.[(this.L.kind === 'dualgun' && this.side < 0) ? 1 : 0]; if (sl) sl.t = 0; }
        const k = (this.L.kick || 1) * Math.min(1, Math.max(0.35, (this.def.abilities.lmb.cd || 0.3) / 0.35));
        this.recoil.v.add(V((Math.random() - 0.5) * 0.15 * k, 0.25 * k, 1.1 * k));
        this.recoilR.v.add(V(5.5 * k, (Math.random() - 0.5) * 1.5 * k, (Math.random() - 0.5) * 2 * k));
        const f = this.flashes[(this.L.kind === 'dualgun' && this.side < 0 && this.flashes[1]) ? 1 : 0];
        if (f) { f.t = 0; f.g.rotation.y = Math.random() * 6; }
        this.flashL.intensity = 3.5 * k + 1.5; this.flashL.color.set(this.fc || this.def.color);
        if (this.barrel) this.barrel.userData.bspin = 45;
        if (this.L.kind === 'pistol' || this.L.kind === 'dualgun' || this.L.kind === 'rifle') this.ejectShell();
      }
      if (this.L.kind === 'bow') { this.release = 0; }
    } else { this.cast = 0; this.castSlot = slot; }
  }
  reload(dur) { this.reloadT = dur; this.reloadDur = dur; }
  hitstop(d = 0.06) { this.hs = Math.max(this.hs, d); this.jolt.v.add(V(0, 0, 0.5)); }
  blinkFx() { this.jolt.v.add(V(0, -0.6, 1.4)); }
  respawn() { this.equip = 0; }

  ejectShell() {
    const m = this.W.getObjectByName('muzzle'); if (!m) return;
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.022, 6), M('#d0a040', { m: 0.95, r: 0.25, e: '#5a3a10', ei: 0.3 }));
    this.root.updateMatrixWorld(true);
    const side = this.L.kind === 'dualgun' && this.side < 0 ? -1 : 1;
    const host = side < 0 && this.W2 ? this.W2 : this.W;
    host.localToWorld(s.position.set(0, 0.12, 0.03));
    this.scene.add(s);
    this.shells.push({ m: s, v: V(side * (0.9 + Math.random() * 0.4), 1.1 + Math.random() * 0.4, 0.15), w: V(Math.random() * 20, Math.random() * 20, 0), t: 0 });
  }

  muzzleWorld() {
    let m = (this.L.kind === 'dualgun' && this.side < 0) ? this.muzL : this.muzR;
    if (!m) m = this.orbs[0]?.g || this.W.children[0];
    if (!m) return null;
    this.root.updateMatrixWorld(true);
    m.getWorldPosition(_a);                       // view-space point
    const dist = _a.length();
    _b.copy(_a).project(this.vcam);               // NDC through the view-model camera
    _b.z = 0.5; _b.unproject(this.cam);           // same screen point seen by the game camera
    _b.sub(this.cam.position).normalize();
    const p = this.cam.position.clone().addScaledVector(_b, Math.max(0.3, dist));
    return [p.x, p.y, p.z];
  }

  // ---- animation helpers ----
  swingPose(rest, keys, k, out) {
    // keys: [windupH, windupR, strikeH, strikeR]
    const w = this._w || (this._w = { h: V(), q: new THREE.Quaternion() });
    const s = this._s || (this._s = { h: V(), q: new THREE.Quaternion() });
    w.h.set(...keys[0]); if (keys[1].isQuaternion) w.q.copy(keys[1]); else w.q.setFromEuler(new THREE.Euler(...keys[1], 'XYZ'));
    s.h.set(...keys[2]); if (keys[3].isQuaternion) s.q.copy(keys[3]); else s.q.setFromEuler(new THREE.Euler(...keys[3], 'XYZ'));
    if (k < 0.24) return lerpPose(rest, w, ease(k / 0.24), out);
    if (k < 0.52) return lerpPose(w, s, easeIn((k - 0.24) / 0.28) * 0.7 + smooth((k - 0.24) / 0.28) * 0.3, out);
    if (k < 0.62) return lerpPose(s, s, 0, out);
    return lerpPose(s, rest, smooth((k - 0.62) / 0.38), out);
  }

  update(dtRaw, s) {
    if (!this.armR) return;
    if (this.hs > 0) this.hs -= dtRaw;
    const dt = this.hs > 0 ? dtRaw * 0.12 : dtRaw;
    this.t += dt; this.atk += dt; this.cast += dt; this.release += dt; this.lastShot += dt; this.inspect += dt;
    if (s.alive && !this.alive) this.equip = 0;
    this.alive = s.alive !== false;
    this.equip = Math.min(1, this.equip + dt / 0.5);
    if (this.reloadT > 0) this.reloadT -= dt;
    const Lk = this.L.kind;
    // ----- global motion -----
    const mv = Math.min(1, s.speed / 6.5);
    if (s.onGround) this.bob += dt * (5.2 + s.speed * 0.9) * (mv > 0.05 ? 1 : 0.25);
    const air = !s.onGround;
    if (this.wasAir && !air) this.land.v.y -= Math.min(2.6, Math.abs(this.lastVy) * 0.12 + 0.5);
    if (!this.wasAir && air && s.vy > 2) this.land.v.y += 0.6;
    this.wasAir = air; this.lastVy = s.vy || 0;
    this.recoil.step(dt); this.recoilR.step(dt); this.land.step(dt); this.jolt.step(dt);
    this.recoil.x.clampScalar(-1.2, 1.2); this.recoilR.x.clampScalar(-1.4, 1.4);
    const swayK = Math.min(1, dt * 9);
    this.sway.x += (-(s.dYaw || 0) * 0.9 - this.sway.x) * swayK;
    this.sway.y += ((s.dPitch || 0) * 0.9 - this.sway.y) * swayK;
    const sx = THREE.MathUtils.clamp(this.sway.x, -0.06, 0.06), sy = THREE.MathUtils.clamp(this.sway.y, -0.05, 0.05);
    const bx = Math.sin(this.bob) * 0.011 * mv, by = -Math.abs(Math.cos(this.bob)) * 0.013 * mv;
    const breathe = Math.sin(this.t * 1.7) * 0.0035;
    const strafe = THREE.MathUtils.clamp(s.side || 0, -1, 1);
    const eq = ease(this.equip);
    const dash = clamp01((s.speed - 9) / 6);
    this.root.position.set(0.04 + bx + sx * 0.4, 0.06 + by + breathe + this.land.x.y * 0.05 - (1 - eq) * 0.35 + (air ? THREE.MathUtils.clamp(-(s.vy || 0) * 0.003, -0.025, 0.025) : 0) - dash * 0.03, this.jolt.x.z * 0.04 + dash * 0.05);
    this.root.rotation.set(sy * 1.2 - (1 - eq) * 0.7 + this.land.x.y * 0.04 + this.jolt.x.y * 0.05, sx * 1.4, -strafe * 0.035 + Math.sin(this.bob) * 0.012 * mv + sx * 0.5);

    // ----- weapon pose -----
    const pose = this._pose; const rest = this.L.rest;
    if (rest) { pose.h.copy(rest.h); pose.q.copy(rest.q); }
    let attackActive = false, attackActive2 = false;
    const D = this.L.dur;
    const atkK = this.atk / D;
    let freeL = null; // {pos, q (open) | bar (fist), w}
    if (this.isMelee && rest) {
      if (atkK < 1) {
        let kind = Lk === 'dual' || Lk === 'claws' ? null : Lk;
        if (kind && SWINGS[kind]) { this.swingPose(rest, SWINGS[kind][this.combo % 3], atkK, pose); attackActive = atkK > 0.2 && atkK < 0.6; }
      }
    }
    // dual / claws: each hand has its own pose
    let poseL = null;
    if (Lk === 'dual' || Lk === 'claws' || Lk === 'dualgun') {
      poseL = this._poseL;
      poseL.h.set(-rest.h.x, rest.h.y, rest.h.z);
      _q.copy(rest.q); poseL.q.set(_q.x, -_q.y, -_q.z, _q.w); // mirror across X
      if (Lk !== 'dualgun' && atkK < 1) {
        const both = this.combo % 3 === 2;
        const doHand = (p, sd) => {
          const kk = atkK;
          const wu = { h: V(sd * 0.34, -0.1, -0.3), q: aimQ([sd * 0.45, 0.8, 0.3], [-sd, 0, -0.4]) };
          const st = { h: V(-sd * 0.12, -0.34, -0.58), q: aimQ([-sd * 0.7, -0.25, -0.66], [-sd * 0.4, -0.7, 0.3]) };
          if (Lk === 'claws') { wu.h.set(sd * 0.36, -0.06, -0.28); wu.q = E(-0.5, 0, -sd * 0.7); st.h.set(-sd * 0.14, -0.38, -0.56); st.q = E(-1.65, 0, sd * 0.95); }
          const r0 = { h: p.h.clone(), q: p.q.clone() };
          this.swingPose(r0, [wu.h.toArray(), [0, 0, 0], st.h.toArray(), [0, 0, 0]], kk, p);
          // orientation explicitly
          const qq = kk < 0.24 ? _q2.slerpQuaternions(r0.q, wu.q, ease(kk / 0.24)) : kk < 0.62 ? _q2.slerpQuaternions(wu.q, st.q, ease((kk - 0.24) / 0.28)) : _q2.slerpQuaternions(st.q, r0.q, smooth((kk - 0.62) / 0.38));
          p.q.copy(qq);
        };
        if (this.side > 0 || both) { doHand(pose, 1); attackActive = atkK > 0.2 && atkK < 0.6; }
        if (this.side < 0 || both) { doHand(poseL, -1); attackActive2 = atkK > 0.2 && atkK < 0.6; }
      }
    }
    // staff: thrust the head forward, free hand pushes
    if (Lk === 'staff' && atkK < 1) {
      const e = Math.sin(clamp01(atkK) * Math.PI);
      pose.h.z -= 0.08 * e; pose.h.y += 0.03 * e;
      pose.q.multiply(_q.setFromEuler(new THREE.Euler(-0.45 * e, 0, -0.12 * e)));
    }
    // guns: recoil spring
    if (this.isGun) {
      const r = this.recoil.x, rr = this.recoilR.x;
      const tgt = (Lk === 'dualgun' && this.side < 0) ? poseL : pose;
      tgt.h.add(V(r.x * 0.02, r.y * 0.02, r.z * 0.05));
      tgt.q.multiply(_q.setFromEuler(new THREE.Euler(rr.x * 0.03, rr.y * 0.02, rr.z * 0.02)));
      if (Lk === 'heavy') { const j = this.atk < 0.2 ? 0.004 : 0; pose.h.x += (Math.random() - 0.5) * j; pose.h.y += (Math.random() - 0.5) * j; }
      if (this.barrel) { this.barrel.userData.bspin = Math.max(0, (this.barrel.userData.bspin || 0) - dt * 30); this.barrel.rotation.y += this.barrel.userData.bspin * dt; }
    }
    // guns: carry, draw, inspect and fire feel
    if (this.isGun && rest) {
      const busy = this.reloadT > 0 || this.cast < 0.55 || this.lastShot < 0.45 || s.charge > 0;
      // running: cant the weapon in and down (tactical carry); snaps back the moment you fire
      const wantCarry = !busy && s.onGround && mv > 0.55 ? (mv - 0.55) / 0.45 : 0;
      this.carry += (wantCarry - this.carry) * Math.min(1, dt * (wantCarry > this.carry ? 5 : 14));
      const cv = smooth(this.carry);
      const tg = [pose]; if (poseL) tg.push(poseL);
      for (const p of tg) {
        const sd = p === poseL ? -1 : 1;
        p.h.x -= sd * 0.04 * cv; p.h.y -= 0.035 * cv; p.h.z += 0.01 * cv;
        p.q.multiply(_q.setFromEuler(new THREE.Euler(0.32 * cv, sd * 0.22 * cv, sd * 0.5 * cv)));
        // step rhythm: the gun rocks with each footfall
        p.q.multiply(_q.setFromEuler(new THREE.Euler(Math.abs(Math.cos(this.bob)) * 0.05 * mv, 0, Math.sin(this.bob) * 0.06 * mv)));
        // strafing leans the weapon
        p.q.multiply(_q.setFromEuler(new THREE.Euler(0, 0, -strafe * 0.09)));
      }
      // draw: pistols twirl into the hand, long guns swing up from the hip
      if (eq < 1) {
        const r = 1 - eq;
        for (const p of tg) {
          const sd = p === poseL ? -1 : 1;
          if (Lk === 'pistol' || Lk === 'dualgun') p.q.multiply(_q.setFromEuler(new THREE.Euler(-Math.PI * 2 * smooth(r), 0, sd * 0.3 * r)));
          else { p.q.multiply(_q.setFromEuler(new THREE.Euler(0.9 * r, sd * 0.5 * r, sd * 0.9 * r))); p.h.x += sd * 0.08 * r; }
        }
      }
      // idle: after a while, turn the weapon over and look at it
      this.idleT = (!busy && mv < 0.05 && s.onGround) ? this.idleT + dt : 0;
      if (this.idleT > 7 && this.inspect > 3) { this.inspect = 0; this.idleT = 0; }
      if (this.inspect < 2.4) {
        const k = this.inspect / 2.4, e = smooth(k / 0.25) * (1 - smooth((k - 0.75) / 0.25));
        const turn = Math.sin(k * Math.PI * 2) * 0.35;
        const long = Lk === 'rifle' || Lk === 'heavy' || Lk === 'armcannon';
        for (const p of tg) {
          const sd = p === poseL ? -1 : 1;
          if (long) { p.h.x -= sd * 0.03 * e; p.h.y += 0.03 * e; p.h.z -= 0.02 * e; p.q.multiply(_q.setFromEuler(new THREE.Euler(0.12 * e, sd * turn * 0.25 * e, sd * -0.75 * e))); }
          else { p.h.x -= sd * 0.07 * e; p.h.y += 0.04 * e; p.h.z -= 0.03 * e; p.q.multiply(_q.setFromEuler(new THREE.Euler(0.2 * e, sd * (0.35 + turn * 0.6) * e, sd * -1.0 * e))); }
        }
      }
      // sustained fire walks the muzzle up a touch and settles back
      const climb = Math.min(1, this.shotN * 0.12) * Math.max(0, 1 - this.lastShot / 0.6);
      if (this.lastShot > 0.6) this.shotN = 0;
      pose.q.multiply(_q.setFromEuler(new THREE.Euler(0.05 * climb, 0, 0)));
    }
    // slide / bolt blowback
    if (this.slides) for (const sl of this.slides) {
      if (!sl) continue; sl.t += dt;
      const k = sl.t < 0.03 ? sl.t / 0.03 : Math.max(0, 1 - (sl.t - 0.03) / 0.09);
      sl.o.position.y = sl.y - 0.045 * k * (this.reloadT > 0 ? 0 : 1);
    }
    // melee: idle twirl to show off the blade, and a settle after each swing
    if (this.isMelee && rest) {
      const idle = mv < 0.05 && s.onGround && atkK > 1.5 && this.cast > 1;
      this.idleT = idle ? this.idleT + dt : 0;
      if (this.idleT > 6 && this.inspect > 3) { this.inspect = 0; this.idleT = 0; }
      if (this.inspect < 2.2) {
        const k = this.inspect / 2.2, e = smooth(k / 0.22) * (1 - smooth((k - 0.78) / 0.22));
        const tg = [pose]; if (poseL) tg.push(poseL);
        for (const p of tg) {
          const sd = p === poseL ? -1 : 1;
          p.h.x -= sd * 0.05 * e; p.h.y += 0.03 * e; p.h.z -= 0.02 * e;
          p.q.multiply(_q.setFromEuler(new THREE.Euler(0.35 * e, sd * Math.sin(k * Math.PI * 2) * 0.9 * e, sd * -0.5 * e)));
        }
      }
      // after-swing settle: a small wobble as the weight stops
      if (atkK > 1 && atkK < 1.8) { const w = Math.sin((atkK - 1) * 14) * Math.exp(-(atkK - 1) * 5) * 0.04; pose.q.multiply(_q.setFromEuler(new THREE.Euler(w, 0, w * 0.6))); }
      // running: blade rides lower and swings with the stride
      pose.h.y -= 0.02 * mv; pose.q.multiply(_q.setFromEuler(new THREE.Euler(Math.abs(Math.cos(this.bob)) * 0.06 * mv, 0, Math.sin(this.bob) * 0.07 * mv)));
    }
    // reload
    let reloadL = 0, reloadPos = null;
    if (this.reloadT > 0 && this.isGun) {
      const k = 1 - this.reloadT / this.reloadDur;
      const tilt = smooth(k / 0.18) * (1 - smooth((k - 0.82) / 0.18));
      const tg = [pose]; if (poseL) tg.push(poseL);
      for (const p of tg) {
        const sd = p === poseL ? -1 : 1;
        p.h.y -= 0.07 * tilt; p.h.x -= sd * 0.05 * tilt; p.h.z += 0.04 * tilt;
        p.q.multiply(_q.setFromEuler(new THREE.Euler(0.5 * tilt, 0, sd * (Lk === 'dualgun' ? 1.4 : 0.85) * tilt)));
        if (Lk === 'dualgun') p.q.multiply(_q.setFromEuler(new THREE.Euler(-Math.PI * 2 * smooth((k - 0.3) / 0.4), 0, 0)));
      }
      if (Lk !== 'dualgun' && Lk !== 'armcannon') {
        // left hand: grip → under the receiver → down (mag out) → back up (mag in) → cock → grip
        reloadL = smooth(k / 0.14) * (1 - smooth((k - 0.86) / 0.14));
        const magWell = V(0, 0.08, -0.13);
        const low = V(-0.12, -0.62, -0.3);
        const cock = V(0.0, 0.1, 0.09);
        let lw;
        if (k < 0.3) lw = { mode: 'well', t: 1 };
        else if (k < 0.55) lw = { mode: 'low', t: Math.sin(((k - 0.3) / 0.25) * Math.PI) };
        else if (k < 0.72) lw = { mode: 'well', t: 1 };
        else lw = { mode: 'cock', t: Math.sin(clamp01((k - 0.72) / 0.14) * Math.PI) };
        reloadPos = { magWell, low, cock, lw };
        if (k > 0.6 && k < 0.66) this.jolt.v.z += 0.3;
      }
    }
    // skill cast flourish
    const castK = this.cast / 0.55;
    const isUlt = this.castSlot === 'x';
    let castW = 0;
    if (castK < 1) {
      castW = Math.sin(clamp01(castK) * Math.PI);
      if (isUlt) { pose.h.y += 0.05 * castW; pose.q.multiply(_q.setFromEuler(new THREE.Euler(0.25 * castW, 0, 0))); }
      else if (this.isMelee) { pose.h.z += 0.04 * castW; pose.h.y -= 0.03 * castW; }
    }
    // bow
    if (Lk === 'bow') {
      const c = clamp01(s.charge || 0);
      this.charge += (c - this.charge) * Math.min(1, dt * 18);
      const rel = this.release < 0.3 ? 1 - ease(this.release / 0.3) : 0;
      pose.h.set(-0.1 + this.charge * 0.05, -0.15 + this.charge * 0.05, -0.6);
      pose.q.setFromEuler(new THREE.Euler(0.32 - this.charge * 0.14, Math.PI / 2 - 0.06, 0.04 + this.charge * 0.04, 'YXZ'));
      const sxp = this.stringX0 - this.charge * 0.36 * (1 / (this.L.scale || 1)) * 0.75;
      const snap = this.release < 0.12 ? Math.sin(this.release * 80) * 0.03 * (1 - this.release / 0.12) : 0;
      if (this.string) { this.string.position.x = sxp + snap; this.string.scale.y = 1; }
      if (this.arrow) { this.arrow.visible = this.release > 0.32; this.arrow.position.x = sxp; }
      if (this.charge > 0.95) { pose.h.x += (Math.random() - 0.5) * 0.002; pose.h.y += (Math.random() - 0.5) * 0.002; }
      this._bowRel = rel;
    }
    // apply weapon transforms
    const sc = this.L.scale || 1;
    const placeW = (G, p, grip) => {
      G.quaternion.copy(p.q);
      G.position.copy(grip).multiplyScalar(-sc).applyQuaternion(p.q).add(p.h);
    };
    if (rest) placeW(this.W, pose, this.L.gripR || V());
    if (this.bow) { this.W.quaternion.copy(pose.q); this.W.position.copy(pose.h); }
    if (this.W2 && poseL) placeW(this.W2, poseL, this.L.gripR || V());
    this.root.updateMatrixWorld(true);

    // ----- hands -----
    const shR = V(0.2, -0.42, 0.04), shL = V(-0.2, -0.42, 0.04);
    if (Lk === 'bow') shR.set(0.26, -0.5, 0.0);
    const poleR = V(0.8, -1, 0.35), poleL = V(-0.8, -1, 0.35);
    const toRoot = (G, local) => this.root.worldToLocal(G.localToWorld(local.clone()));
    const axisOf = (G, ax) => ax.clone().applyQuaternion(G.quaternion).normalize();
    const openQ = (fingers, palm) => basis(fingers, palm.clone().negate(), new THREE.Quaternion());
    // right hand
    if (Lk === 'cast') {
      const pr = V(0.21, -0.27, -0.42), pl = V(-0.21, -0.27, -0.42);
      let qr = openQ(V(0.15, 0.75, -0.6), V(-0.35, 0.3, -0.9)), ql = openQ(V(-0.15, 0.75, -0.6), V(0.35, 0.3, -0.9));
      if (atkK < 1) {
        const e = Math.sin(clamp01(atkK) * Math.PI), sd = this.side;
        const p = sd > 0 ? pr : pl;
        p.z -= 0.2 * e; p.x -= sd * 0.08 * e; p.y += 0.05 * e;
        const q2 = openQ(V(sd * 0.1, 0.95, -0.2), V(-sd * 0.15, 0.1, -1));
        if (sd > 0) qr.slerp(q2, e); else ql.slerp(q2, e);
      }
      if (castK < 1) { pl.x += 0.1 * castW; pl.y += 0.08 * castW; pl.z -= 0.12 * castW; ql.slerp(openQ(V(0.1, 1, -0.1), V(0.1, 0, -1)), castW); if (isUlt) { pr.x -= 0.1 * castW; pr.y += 0.08 * castW; pr.z -= 0.12 * castW; qr.slerp(openQ(V(-0.1, 1, -0.1), V(-0.1, 0, -1)), castW); } }
      this.armR.place(shR, pr, qr, poleR);
      this.armL.place(shL, pl, ql, poleL);
    } else if (Lk === 'bow') {
      const grip = toRoot(this.W, V(0, 0, 0));
      this.armL.place(shL, grip, axisOf(this.W, V(0, 1, 0)), poleL);
      const sp = toRoot(this.bow, V(this.string ? this.string.position.x : -0.26, 0.0, 0));
      const rel = this._bowRel || 0;
      sp.x += 0.12 * rel; sp.y += 0.06 * rel; sp.z += 0.08 * rel;
      this.armR.place(shR, sp, axisOf(this.W, V(0, 1, 0)), poleR);
    } else {
      // right grip
      const gR = toRoot(this.W, this.L.gripR || V());
      this.armR.place(shR, gR, axisOf(this.W, this.L.barAxis || V(0, 1, 0)), poleR);
      // left
      if (this.W2) {
        const gL = toRoot(this.W2, this.L.gripR || V());
        this.armL.place(shL, gL, axisOf(this.W2, this.L.barAxis || V(0, 1, 0)), poleL);
      } else if (this.L.gripL) {
        let gL = toRoot(this.W, this.L.gripL);
        let bar = axisOf(this.W, this.L.barAxisL || this.L.barAxis || V(0, 1, 0));
        if (reloadPos) {
          const { magWell, low, cock, lw } = reloadPos;
          const tgt = lw.mode === 'low' ? V().lerpVectors(toRoot(this.W, magWell), low, lw.t) : lw.mode === 'cock' ? V().lerpVectors(toRoot(this.W, magWell), toRoot(this.W, cock), lw.t) : toRoot(this.W, magWell);
          gL = gL.lerp(tgt, reloadL);
          bar = bar.lerp(V(0, 1, 0.2), reloadL).normalize();
        }
        if (castW > 0 && !isUlt && this.isMelee) {
          // let go of the grip for a quick off-hand sign
          const free = V(-0.16, -0.14, -0.4);
          gL = gL.lerp(free, castW);
        }
        this.armL.place(shL, gL, bar, poleL);
      } else {
        // free off hand
        if (this.armL.mode === 'open') {
          const p = Lk === 'staff' ? V(-0.22, -0.3, -0.46) : V(-0.27, -0.38, -0.42);
          let q = Lk === 'staff' ? openQ(V(-0.15, 0.8, -0.55), V(0.4, 0.2, -0.9)) : openQ(V(0.15, 0.55, -0.8), V(0.8, -0.2, -0.3));
          if (Lk === 'staff' && atkK < 1) { const e = Math.sin(clamp01(atkK) * Math.PI); p.z -= 0.16 * e; p.x += 0.06 * e; p.y += 0.04 * e; q.slerp(openQ(V(0, 1, -0.2), V(0.1, 0.1, -1)), e); }
          if (castW > 0) { p.x += 0.08 * castW; p.y += 0.14 * castW; p.z -= 0.08 * castW; q.slerp(openQ(V(0.1, 1, -0.15), V(0.15, 0, -1)), castW); }
          if (Lk === 'armcannon' && atkK < 1) p.z += 0.02 * Math.sin(clamp01(atkK) * Math.PI);
          this.armL.place(shL, p, q, poleL);
          if (this.orbs[0] && (Lk === 'sword' || Lk === 'knife')) this.orbs[0].g.visible = castW > 0.05;
        } else {
          // fist (shield arm)
          const p = V(-0.34, -0.37 + castW * 0.1, -0.46 - castW * 0.06);
          if (atkK < 1 && this.shield) p.x += 0.03 * Math.sin(clamp01(atkK) * Math.PI);
          this.armL.place(shL, p, V(0.25, 1, 0.1).normalize(), poleL);
        }
      }
    }
    // ----- orbs / runes / flashes -----
    for (const o of this.orbs) {
      const pulse = 1 + Math.sin(this.t * 6 + o.g.id) * 0.12 + castW * 0.8 + (atkK < 1 ? Math.sin(clamp01(atkK) * Math.PI) * 0.5 : 0);
      o.glow.scale.setScalar(pulse); o.core.scale.setScalar(0.8 + castW * 0.6);
      o.ring.rotation.z = this.t * 2.4; o.ring.scale.setScalar(0.9 + castW * 0.9);
      o.ring.material.opacity = 0.35 + castW * 0.6;
    }
    // rune disc
    if (castK < 1) {
      const rr = isUlt ? this.ultRune : this.rune;
      const other = isUlt ? this.rune : this.ultRune; other.visible = false;
      rr.visible = true;
      const k = clamp01(castK);
      const grow = ease(k / 0.35), fade = 1 - smooth((k - 0.55) / 0.45);
      if (isUlt) { rr.position.set(0, -0.06, -0.8); rr.scale.setScalar(0.5 * grow); }
      else {
        const hp = (this.armL.mode === 'open' || Lk === 'cast') ? this.armL.hand.position : V(-0.14, -0.13, -0.42);
        rr.position.set(hp.x + 0.02, hp.y + 0.04, hp.z - 0.1); rr.scale.setScalar(0.15 * grow);
      }
      rr.rotation.set(0, 0, this.t * (isUlt ? 1.6 : 3));
      rr.material.opacity = (isUlt ? 0.75 : 0.7) * fade;
    } else { this.rune.visible = false; this.ultRune.visible = false; }
    for (const f of this.flashes) {
      f.t += dtRaw;
      const on = f.t < 0.055;
      f.g.visible = on;
      if (on) { const k = 1 - f.t / 0.055; f.g.scale.setScalar(f.g.userData.base * (0.7 + k * 0.6 + Math.random() * 0.2)); }
    }
    this.flashL.intensity = Math.max(0, this.flashL.intensity - dtRaw * 60);
    if (this.flashL.intensity > 0 && this.flashes[0]) { this.flashes[0].m.getWorldPosition(this.flashL.position); }
    // shells
    this.shells = this.shells.filter(sh => {
      sh.t += dt; sh.v.y -= 5.5 * dt;
      sh.m.position.addScaledVector(sh.v, dt * 0.35);
      sh.m.rotation.x += sh.w.x * dt; sh.m.rotation.z += sh.w.y * dt;
      if (sh.t > 0.7) { this.scene.remove(sh.m); sh.m.geometry.dispose(); return false; }
      return true;
    });
    // trails
    if (this.trail && this.tip) {
      if (attackActive || this.trail.fade > 0) { this.tipBase.getWorldPosition(_a); this.tip.getWorldPosition(_b); _a.lerp(_b, 0.55); this.trail.push(_a, _b, attackActive); }
    }
    if (this.trail2 && this.tip2) {
      if (attackActive2 || this.trail2.fade > 0) { this.tipBase2.getWorldPosition(_a); this.tip2.getWorldPosition(_b); _a.lerp(_b, 0.55); this.trail2.push(_a, _b, attackActive2); }
    }
    for (const o of this.flick) {
      if (o.userData.flicker) o.scale.setScalar(1 + Math.sin(this.t * 13) * 0.08);
      if (o.userData.spin) o.rotation.y = this.t * o.userData.spin;
    }
    this.root.visible = this.alive;
    if (this.trail) this.trail.mesh.visible = this.trail.mesh.visible && this.alive;
    if (this.trail2) this.trail2.mesh.visible = this.trail2.mesh.visible && this.alive;
  }
}
