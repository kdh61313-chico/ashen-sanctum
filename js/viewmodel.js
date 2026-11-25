import * as THREE from 'three';
import { buildHero, M } from './models.js';

// First-person arms + weapon, attached to the camera.
export class ViewModel {
  constructor(camera) {
    this.cam = camera;
    this.root = new THREE.Group();
    camera.add(this.root);
    this.t = 0; this.atk = 9; this.cast = 9; this.side = 1; this.charge = 0; this.bob = 0;
    this.sway = [0, 0]; this.land = 0;
  }

  setHero(def) {
    this.root.clear();
    this.def = def;
    const P = buildHero(def);
    this.pose = P.spec.pose;
    const c = P.c;
    const armMat = M(c.fore || c.arm || c.cloth), handMat = M(c.hand || c.skin || '#2a2420');
    const mkArm = (side) => {
      const g = new THREE.Group();
      const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.062, 0.5, 6), armMat);
      fore.rotation.x = Math.PI / 2; fore.position.z = 0.27; g.add(fore);
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.066, 0.1, 6), M(c.metal || '#444', { m: 0.6, r: 0.4 }));
      cuff.rotation.x = Math.PI / 2; cuff.position.z = 0.1; g.add(cuff);
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.07, 0.11), handMat);
      hand.position.z = -0.02; g.add(hand);
      g.userData.side = side;
      this.root.add(g);
      return g;
    };
    this.R = mkArm(1); this.L = mkArm(-1);
    this.wR = P.weaponR ? P.weaponR.clone() : null;
    this.wL = P.weaponL ? P.weaponL.clone() : null;
    const pose = this.pose;
    // weapon placement in hand space (hand looks toward -Z)
    if (this.wR) { this.R.add(this.wR); this.wR.position.set(0, 0, -0.02); }
    if (this.wL) { this.L.add(this.wL); this.wL.position.set(0, 0, -0.02); }
    const W = (w, rx, ry, rz, s = 1) => { if (w) { w.rotation.set(rx, ry, rz); w.scale.setScalar(s); } };
    switch (pose) {
      case 'twohand': W(this.wR, -1.05, 0, 0.55, 0.75); this.base = { R: [0.22, -0.3, -0.5], L: [0.02, -0.38, -0.46], rR: [0.2, 0, 0], rL: [0.3, 0.4, 0] }; break;
      case 'onehand': W(this.wR, -1.15, 0, 0.2, 0.8); W(this.wL, 0, Math.PI / 2 - 0.5, 0, 0.42); this.base = { R: [0.24, -0.3, -0.48], L: [-0.36, -0.38, -0.55], rR: [0.15, 0, 0], rL: [0.1, 0.2, 0] }; break;
      case 'dual': W(this.wR, -1.35, 0, 0.1, 0.9); W(this.wL, -1.35, 0, -0.1, 0.9); this.base = { R: [0.26, -0.28, -0.45], L: [-0.26, -0.28, -0.45], rR: [0.2, -0.1, 0], rL: [0.2, 0.1, 0] }; break;
      case 'claws': W(this.wR, -1.4, 0, 0, 1.2); W(this.wL, -1.4, 0, 0, 1.2); this.base = { R: [0.25, -0.27, -0.45], L: [-0.25, -0.27, -0.45], rR: [0.25, -0.15, 0.2], rL: [0.25, 0.15, -0.2] }; break;
      case 'staff': W(this.wR, -0.2, 0, 0.1, 0.55); W(this.wL, 0, 0, 0, 0.45); this.base = { R: [0.3, -0.46, -0.55], L: [-0.26, -0.33, -0.52], rR: [-0.1, 0, 0], rL: [0.3, 0.2, 0] }; break;
      case 'bow': W(this.wL, -0.08, 0, 0, 0.9); this.base = { R: [0.16, -0.3, -0.4], L: [-0.2, -0.24, -0.62], rR: [0.1, 0, 0], rL: [0.0, 0.25, 0.1] }; break;
      case 'cast': W(this.wR, 0, 0, 0, 0.55); W(this.wL, 0, 0, 0, 0.55); this.base = { R: [0.24, -0.3, -0.48], L: [-0.24, -0.3, -0.48], rR: [0.35, -0.2, 0], rL: [0.35, 0.2, 0] }; break;
    }
    if (pose === 'bow' && this.wL) {
      this.wL.traverse(o => { if (o.userData.string) this.string = o; });
      this.wL.rotation.set(0, Math.PI / 2, 0.0);
      this.wL.position.set(0, 0, -0.02);
      // bow is built with arc toward -X: turn so arc faces away from camera
      this.wL.rotation.set(0.05, -Math.PI / 2 + 0.75, 0.12);
      this.wL.position.set(0.02, 0.02, -0.04);
      this.wL.scale.setScalar(0.62);
    }
    this.flick = [];
    this.root.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; o.frustumCulled = false; } if (o.userData.flicker || o.userData.spin) this.flick.push(o); });
    this.root.visible = true;
  }

  attack(slot) {
    if (slot === 'lmb') { this.atk = 0; this.side = -this.side; }
    else this.cast = 0;
  }

  update(dt, s) {
    if (!this.R) return;
    this.t += dt; this.atk += dt; this.cast += dt;
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
    // attack
    const D = pose === 'twohand' ? 0.38 : (pose === 'dual' || pose === 'claws') ? 0.22 : 0.26;
    if (this.atk < D) {
      const k = this.atk / D, e = Math.sin(k * Math.PI);
      if (pose === 'twohand' || pose === 'onehand') {
        // big diagonal sweep: from upper right to lower left
        const a = k < 0.25 ? k / 0.25 : 1;
        const sw = k < 0.25 ? 0 : (k - 0.25) / 0.75;
        pR[0] += 0.12 * a - 0.45 * sw; pR[1] += 0.18 * a - 0.25 * sw; pR[2] -= 0.15 * e;
        rR[2] += 0.9 * a - 2.0 * sw; rR[0] += 0.5 * a - 0.6 * sw;
        if (pose === 'twohand') { pL[0] += 0.1 * a - 0.35 * sw; pL[1] += 0.15 * a - 0.15 * sw; }
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
    if (pose === 'bow') {
      const c = s.charge || 0;
      pR[2] += c * 0.2; pR[0] += c * 0.03;
      pL[2] -= c * 0.03;
      if (this.string) this.string.position.x = -0.26 + c * 0.25;
    }
    if (this.cast < 0.45) {
      const e = Math.sin((this.cast / 0.45) * Math.PI);
      pL[0] += 0.12 * e; pL[1] += 0.12 * e; pL[2] -= 0.15 * e; rL[0] -= 0.6 * e;
    }
    setArm(this.R, pR, rR); setArm(this.L, pL, rL);
    if (pose === 'bow' || (pose === 'onehand' && !this.wL) || pose === 'twohand') this.L.visible = true;
    for (const o of this.flick) {
      if (o.userData.flicker) o.scale.setScalar(1 + Math.sin(this.t * 13) * 0.08);
      if (o.userData.spin) o.rotation.y = this.t * o.userData.spin;
    }
    this.root.visible = s.alive !== false;
  }
}
