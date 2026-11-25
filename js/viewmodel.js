import * as THREE from 'three';
import { buildHero, M } from './models.js';
import { Trail } from './fx.js';

const ease = (x) => { x = Math.max(0, Math.min(1, x)); return 1 - Math.pow(1 - x, 3); };
const mix = (a, b, k) => a + (b - a) * k;

// First-person arms + weapon, attached to the camera.
export class ViewModel {
  constructor(camera) {
    this.cam = camera;
    this.root = new THREE.Group();
    camera.add(this.root);
    this.t = 0; this.atk = 9; this.cast = 9; this.side = 1; this.combo = 0; this.bob = 0;
    this.sway = [0, 0]; this.recoil = 0; this.reloadT = 0; this.reloadDur = 1;
    this.trail = null; this._a = new THREE.Vector3(); this._b = new THREE.Vector3();
  }

  setHero(def) {
    this.root.clear();
    this.trail?.dispose(); this.trail = null;
    this.def = def;
    const P = buildHero(def);
    this.pose = P.spec.pose;
    this.isGun = P.isGun; this.isMelee = P.isMelee;
    const c = P.c;
    const armMat = M(c.fore || c.arm || c.cloth), handMat = M(c.hand || c.skin || '#2a2420');
    const mkArm = (side) => {
      const g = new THREE.Group();
      const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.058, 0.46, 7), armMat);
      fore.rotation.x = Math.PI / 2; fore.position.z = 0.25; g.add(fore);
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.08, 7), M(c.metal || '#444', { m: 0.6, r: 0.4 }));
      cuff.rotation.x = Math.PI / 2; cuff.position.z = 0.08; g.add(cuff);
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.1), handMat);
      hand.position.z = -0.02; g.add(hand);
      const fing = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.045, 0.06), handMat);
      fing.position.set(0, -0.02, -0.075); fing.rotation.x = 0.6; g.add(fing);
      g.userData.hand = [hand, fing];
      this.root.add(g);
      return g;
    };
    this.R = mkArm(1); this.L = mkArm(-1);
    this.wR = P.weaponR ? P.weaponR.clone() : null;
    this.wL = P.weaponL ? P.weaponL.clone() : null;
    if (this.wR) { this.R.add(this.wR); this.wR.position.set(0, 0, -0.02); }
    if (this.wL) { this.L.add(this.wL); this.wL.position.set(0, 0, -0.02); }
    const W = (w, rx, ry, rz, s = 1) => { if (w) { w.rotation.set(rx, ry, rz); w.scale.setScalar(s); } };
    const fwd = -Math.PI / 2; // weapon +Y → camera -Z
    switch (this.pose) {
      case 'twohand': W(this.wR, -1.05, 0, 0.55, 0.75); this.base = { R: [0.22, -0.3, -0.5], L: [0.02, -0.38, -0.46], rR: [0.2, 0, 0], rL: [0.3, 0.4, 0] }; break;
      case 'onehand': W(this.wR, -1.15, 0, 0.2, 0.8); W(this.wL, 0, Math.PI / 2 - 0.5, 0, 0.42); this.base = { R: [0.24, -0.3, -0.48], L: [-0.36, -0.38, -0.55], rR: [0.15, 0, 0], rL: [0.1, 0.2, 0] }; break;
      case 'dual': W(this.wR, -1.35, 0, 0.1, 0.9); W(this.wL, -1.35, 0, -0.1, 0.9); this.base = { R: [0.26, -0.28, -0.45], L: [-0.26, -0.28, -0.45], rR: [0.2, -0.1, 0], rL: [0.2, 0.1, 0] }; break;
      case 'claws': W(this.wR, -1.4, 0, 0, 1.2); W(this.wL, -1.4, 0, 0, 1.2); this.base = { R: [0.25, -0.27, -0.45], L: [-0.25, -0.27, -0.45], rR: [0.25, -0.15, 0.2], rL: [0.25, 0.15, -0.2] }; break;
      case 'staff': W(this.wR, -0.2, 0, 0.1, 0.55); W(this.wL, 0, 0, 0, 0.45); this.base = { R: [0.3, -0.46, -0.55], L: [-0.26, -0.33, -0.52], rR: [-0.1, 0, 0], rL: [0.3, 0.2, 0] }; break;
      case 'bow': this.base = { R: [0.16, -0.3, -0.4], L: [-0.2, -0.24, -0.62], rR: [0.1, 0, 0], rL: [0.0, 0.25, 0.1] }; break;
      case 'cast': W(this.wR, 0, 0, 0, 0.55); W(this.wL, 0, 0, 0, 0.55); this.base = { R: [0.24, -0.3, -0.48], L: [-0.24, -0.3, -0.48], rR: [0.35, -0.2, 0], rL: [0.35, 0.2, 0] }; break;
      case 'pistol': W(this.wR, fwd, 0, 0, 0.85); this.base = { R: [0.2, -0.21, -0.42], L: [-0.3, -0.42, -0.5], rR: [0, 0, 0], rL: [0.2, 0.1, 0] }; break;
      case 'dualgun': W(this.wR, fwd, 0, 0, 0.8); W(this.wL, fwd, 0, 0, 0.8); this.base = { R: [0.2, -0.22, -0.42], L: [-0.2, -0.22, -0.42], rR: [0, 0, 0], rL: [0, 0, 0] }; break;
      case 'rifle': W(this.wR, fwd, 0, 0, 0.7); this.base = { R: [0.15, -0.22, -0.3], L: [0.02, -0.26, -0.66], rR: [0, 0, 0], rL: [0.1, 0.25, -0.4] }; break;
      case 'heavy': W(this.wR, fwd, 0, 0, 0.7); this.base = { R: [0.22, -0.32, -0.42], L: [0.04, -0.34, -0.66], rR: [0, 0, 0], rL: [0.15, 0.25, -0.3] }; break;
      case 'armcannon': W(this.wR, fwd, 0, 0, 0.75); this.R.userData.hand.forEach(h => h.visible = false); this.base = { R: [0.22, -0.26, -0.3], L: [-0.32, -0.4, -0.5], rR: [0, 0, 0], rL: [0.2, 0.1, 0] }; break;
      default: this.base = { R: [0.24, -0.3, -0.48], L: [-0.24, -0.3, -0.48], rR: [0, 0, 0], rL: [0, 0, 0] };
    }
    if (this.pose === 'bow' && this.wL) {
      this.wL.traverse(o => { if (o.userData.string) this.string = o; });
      this.wL.rotation.set(0.05, -Math.PI / 2 + 0.75, 0.12);
      this.wL.position.set(0.02, 0.02, -0.04);
      this.wL.scale.setScalar(0.62);
    }
    this.muzR = this.wR?.getObjectByName('muzzle') || null;
    this.muzL = this.wL?.getObjectByName('muzzle') || null;
    this.barrel = this.wR?.getObjectByName('barrel') || null;
    this.tip = this.wR?.getObjectByName('tip') || null;
    this.tipBase = this.wR?.getObjectByName('tipbase') || null;
    if (this.isMelee && this.tip && this.cam.parent) this.trail = new Trail(this.cam.parent, def.color, 12);
    this.flick = [];
    this.root.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; o.frustumCulled = false; } if (o.userData.flicker || o.userData.spin) this.flick.push(o); });
    this.root.visible = true;
  }

  attack(slot, combo = 0) {
    if (slot === 'lmb') { this.atk = 0; this.side = -this.side; this.combo = combo; this.recoil = 1; if (this.barrel) this.barrel.userData.bspin = 40; }
    else this.cast = 0;
  }
  reload(dur) { this.reloadT = dur; this.reloadDur = dur; }

  muzzleWorld() {
    const m = (this.pose === 'dualgun' && this.side < 0) ? this.muzL : this.muzR;
    if (!m) return null;
    this.root.updateMatrixWorld(true);
    m.getWorldPosition(this._a);
    return [this._a.x, this._a.y, this._a.z];
  }

  update(dt, s) {
    if (!this.R) return;
    this.t += dt; this.atk += dt; this.cast += dt;
    this.recoil = Math.max(0, this.recoil - dt * 9);
    if (this.reloadT > 0) this.reloadT -= dt;
    const mv = Math.min(1, s.speed / 6);
    if (s.onGround) this.bob += dt * (6 + s.speed * 1.2) * (mv > 0.05 ? 1 : 0.3);
    const bx = Math.cos(this.bob) * 0.012 * mv, by = Math.abs(Math.sin(this.bob)) * 0.016 * mv;
    const idle = Math.sin(this.t * 1.6) * 0.004;
    this.sway[0] += (-(s.dYaw || 0) * 0.6 - this.sway[0]) * Math.min(1, dt * 10);
    this.sway[1] += (-(s.dPitch || 0) * 0.6 - this.sway[1]) * Math.min(1, dt * 10);
    const sx = Math.max(-0.05, Math.min(0.05, this.sway[0])), sy = Math.max(-0.05, Math.min(0.05, this.sway[1]));
    const air = s.onGround ? 0 : Math.max(-0.04, Math.min(0.04, -(s.vy || 0) * 0.004));
    const B = this.base;
    const setArm = (arm, p, r) => { arm.position.set(p[0] + bx + sx, p[1] - by + idle + sy + air, p[2]); arm.rotation.set(r[0], r[1], r[2]); };
    const pR = [...B.R], pL = [...B.L], rR = [...B.rR], rL = [...B.rL];
    const pose = this.pose;
    if (this.isGun) {
      const r = this.recoil * this.recoil;
      const left = pose === 'dualgun' && this.side < 0;
      const p = left ? pL : pR, rr = left ? rL : rR;
      const k = pose === 'heavy' ? 0.35 : pose === 'rifle' ? 1.3 : 1;
      p[2] += 0.07 * r * k; p[1] += 0.015 * r * k; rr[0] += 0.22 * r * k;
      if (pose === 'rifle' || pose === 'heavy') { pL[2] += 0.05 * r * k; rL[0] += 0.12 * r * k; }
      if (this.reloadT > 0) {
        const kk = 1 - this.reloadT / this.reloadDur, e = Math.sin(kk * Math.PI);
        pR[1] -= 0.12 * e; rR[0] -= 0.6 * e; rR[2] += 0.5 * e;
        pL[1] -= 0.06 * e; pL[0] += 0.08 * e;
        if (pose === 'dualgun') { pL[1] -= 0.12 * e; rL[0] -= 0.6 * e; rL[2] -= 0.5 * e; }
      }
      if (this.barrel) { this.barrel.userData.bspin = Math.max(0, (this.barrel.userData.bspin || 0) - dt * 20); this.barrel.rotation.y += this.barrel.userData.bspin * dt; }
    } else {
      const D = pose === 'twohand' ? 0.4 : (pose === 'dual' || pose === 'claws') ? 0.22 : pose === 'onehand' ? 0.32 : 0.26;
      if (this.atk < D) {
        const k = this.atk / D, e = Math.sin(k * Math.PI);
        if (pose === 'twohand' || pose === 'onehand') {
          const wu = ease(k / 0.25), st = ease((k - 0.25) / 0.35), rc = ease((k - 0.6) / 0.4);
          const c = this.combo % 3;
          if (c === 2) { // overhead chop
            pR[1] += mix(mix(0, 0.22, wu), -0.12, st) * (1 - rc); pR[0] -= 0.12 * st * (1 - rc); pR[2] -= 0.12 * st * (1 - rc);
            rR[0] += mix(mix(0, 1.1, wu), -1.2, st) * (1 - rc);
            if (pose === 'twohand') { pL[1] += mix(mix(0, 0.2, wu), -0.1, st) * (1 - rc); rL[0] += mix(mix(0, 1.0, wu), -1.0, st) * (1 - rc); }
          } else {
            const d = c === 0 ? 1 : -1;
            pR[0] += mix(mix(0, 0.12 * d, wu), -0.45 * d, st) * (1 - rc); pR[1] += mix(mix(0, 0.16, wu), -0.1, st) * (1 - rc); pR[2] -= 0.14 * e;
            rR[2] += mix(mix(0, 0.9 * d, wu), -1.9 * d, st) * (1 - rc); rR[0] += mix(mix(0, 0.4, wu), -0.5, st) * (1 - rc);
            if (pose === 'twohand') { pL[0] += mix(mix(0, 0.1 * d, wu), -0.35 * d, st) * (1 - rc); pL[1] += mix(mix(0, 0.14, wu), -0.12, st) * (1 - rc); }
          }
        } else if (pose === 'dual' || pose === 'claws') {
          const p = this.side > 0 ? pR : pL, r = this.side > 0 ? rR : rL;
          p[2] -= 0.28 * e; p[0] -= this.side * 0.12 * e; p[1] += 0.06 * e;
          r[2] += this.side * -1.2 * e; r[0] -= 0.3 * e;
        } else if (pose === 'bow') {
          pR[2] += 0.05 * (1 - k);
        } else {
          pR[2] -= 0.18 * e; rR[0] -= 0.5 * e;
          if (pose === 'cast') { pL[2] -= 0.18 * e; rL[0] -= 0.5 * e; }
        }
      }
      if (this.trail && this.tip) {
        const active = this.atk < D && this.atk > D * 0.2;
        if (active || this.trail.fade > 0) { this.root.updateMatrixWorld(true); this.tipBase.getWorldPosition(this._a); this.tip.getWorldPosition(this._b); this.trail.push(this._a, this._b, active); }
      }
    }
    if (pose === 'bow') {
      const c = s.charge || 0;
      pR[2] += c * 0.2; pR[0] += c * 0.03; pL[2] -= c * 0.03;
      if (this.string) this.string.position.x = -0.26 + c * 0.25;
    }
    if (this.cast < 0.45) {
      const e = Math.sin((this.cast / 0.45) * Math.PI);
      pL[0] += 0.12 * e; pL[1] += 0.12 * e; pL[2] -= 0.15 * e; rL[0] -= 0.6 * e;
    }
    setArm(this.R, pR, rR); setArm(this.L, pL, rL);
    for (const o of this.flick) {
      if (o.userData.flicker) o.scale.setScalar(1 + Math.sin(this.t * 13) * 0.08);
      if (o.userData.spin) o.rotation.y = this.t * o.userData.spin;
    }
    this.root.visible = s.alive !== false;
  }
}
