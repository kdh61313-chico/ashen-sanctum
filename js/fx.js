import * as THREE from 'three';
import { HALF_X, HALF_Z } from './map.js';

export const LOOK = {
  fireball: { c: '#ff7a1a', c2: '#ffd27a', s: 0.32, trail: 'fire' },
  arrow: { c: '#9fe8ff', c2: '#ffffff', s: 0.12, stretch: 1.2, trail: 'frost' },
  soul: { c: '#58ffb0', c2: '#d8fff0', s: 0.26, trail: 'soul' },
  shuriken: { c: '#b06cff', c2: '#f0e0ff', s: 0.2, spin: true },
  hook: { c: '#c8c8c8', c2: '#ffffff', s: 0.22 },
  bloodspear: { c: '#ff1f4b', c2: '#ffb0c0', s: 0.16, stretch: 1.6, trail: 'blood' },
  flask: { c: '#a6ff4d', c2: '#eaffd0', s: 0.18, spin: true, trail: 'poison' },
  void: { c: '#a06bff', c2: '#1a0030', s: 0.5, trail: 'void' },
  star: { c: '#bcd0ff', c2: '#ffffff', s: 0.24, trail: 'star' },
  mirrorblade: { c: '#ff9ce8', c2: '#ffffff', s: 0.12, stretch: 0.7 },
  feather: { c: '#7d8cff', c2: '#e0e4ff', s: 0.1, stretch: 1.1 },
  reaper: { c: '#6a7bff', c2: '#e8ecff', s: 0.6, stretch: 3.2, trail: 'void' },
  thorn: { c: '#7bc96f', c2: '#eaffd8', s: 0.12, stretch: 0.8 },
  lightning: { c: '#8fb8ff', c2: '#ffffff' },
  chain: { c: '#8fb8ff', c2: '#ffffff' },
  holy: { c: '#ffd54f', c2: '#fff6d0' },
  mesmer: { c: '#ff9ce8', c2: '#ffffff' },
  // zones
  firewall: { c: '#ff6a1a', c2: '#ffd27a' },
  meteor: { c: '#ff5a1a', c2: '#ffcf7a' },
  blizzard: { c: '#9fe8ff', c2: '#ffffff' },
  storm: { c: '#8fb8ff', c2: '#ffffff' },
  bloodfeast: { c: '#ff1f4b', c2: '#ff9ab0' },
  sanctum: { c: '#ffe08a', c2: '#ffffff' },
  miasma: { c: '#8acd32', c2: '#d8ff9a' },
  rift: { c: '#9a5cff', c2: '#e0c8ff' },
  collapse: { c: '#7a3aff', c2: '#ffffff' },
  crows: { c: '#5c6bc0', c2: '#0c0c14' },
  runewall: { c: '#4fc3f7', c2: '#e0f7ff' },
  runecircle: { c: '#4fc3f7', c2: '#e0f7ff' },
  constellation: { c: '#bcd0ff', c2: '#ffffff' },
  starfall: { c: '#bcd0ff', c2: '#ffffff' },
  pillar: { c: '#ffd54f', c2: '#ffffff' },
  roots: { c: '#7bc96f', c2: '#d8ffb0' },
  cauldron: { c: '#7bc96f', c2: '#d8ff9a' },
  whirl: { c: '#d9c7a1', c2: '#ffffff' },
  trap: { c: '#9fe8ff', c2: '#ffffff' },
};

const _c = new THREE.Color(), _c2 = new THREE.Color();

class Particles {
  constructor(scene, N = 6000) {
    this.N = N;
    this.pos = new Float32Array(N * 3);
    this.col = new Float32Array(N * 4);
    this.size = new Float32Array(N);
    this.vel = new Float32Array(N * 3);
    this.life = new Float32Array(N);
    this.max = new Float32Array(N);
    this.s0 = new Float32Array(N); this.s1 = new Float32Array(N);
    this.grav = new Float32Array(N); this.drag = new Float32Array(N);
    this.c0 = new Float32Array(N * 3); this.c1 = new Float32Array(N * 3);
    this.a0 = new Float32Array(N);
    this.i = 0;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('col', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('size', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.mat = new THREE.ShaderMaterial({
      uniforms: { scale: { value: 500 } },
      vertexShader: `attribute float size; attribute vec4 col; varying vec4 vC; uniform float scale;
        void main(){ vC = col; vec4 mv = modelViewMatrix*vec4(position,1.); gl_PointSize = size * scale / max(0.1, -mv.z); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `varying vec4 vC; void main(){ vec2 d = gl_PointCoord-0.5; float r = length(d); if (r>0.5) discard; float a = pow(1.0 - r*2.0, 1.6); gl_FragColor = vec4(vC.rgb * (1.0 + a*0.6), vC.a*a); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    scene.add(this.points);
    this.geo = g;
  }
  emit(p, o) {
    const n = o.n || 1;
    _c.set(o.c || '#ffffff'); _c2.set(o.c2 || o.c || '#ffffff');
    for (let k = 0; k < n; k++) {
      const i = this.i; this.i = (this.i + 1) % this.N;
      const sp = o.sp ?? 2;
      const sx = o.spread?.[0] ?? 0, sy = o.spread?.[1] ?? 0, sz = o.spread?.[2] ?? 0;
      this.pos[i * 3] = p[0] + (Math.random() - 0.5) * 2 * sx;
      this.pos[i * 3 + 1] = p[1] + (Math.random() - 0.5) * 2 * sy;
      this.pos[i * 3 + 2] = p[2] + (Math.random() - 0.5) * 2 * sz;
      let vx = (Math.random() - 0.5) * 2, vy = (Math.random() - 0.5) * 2, vz = (Math.random() - 0.5) * 2;
      const l = Math.hypot(vx, vy, vz) || 1;
      const m = sp * (0.4 + Math.random() * 0.6) / l;
      this.vel[i * 3] = vx * m + (o.v?.[0] || 0);
      this.vel[i * 3 + 1] = vy * m + (o.up || 0) + (o.v?.[1] || 0);
      this.vel[i * 3 + 2] = vz * m + (o.v?.[2] || 0);
      const life = (o.life || 0.6) * (0.6 + Math.random() * 0.6);
      this.life[i] = life; this.max[i] = life;
      this.s0[i] = (o.s || 0.2) * (0.7 + Math.random() * 0.6); this.s1[i] = o.s1 ?? this.s0[i] * 0.2;
      this.grav[i] = o.g || 0; this.drag[i] = o.drag ?? 1.5;
      this.c0[i * 3] = _c.r; this.c0[i * 3 + 1] = _c.g; this.c0[i * 3 + 2] = _c.b;
      this.c1[i * 3] = _c2.r; this.c1[i * 3 + 1] = _c2.g; this.c1[i * 3 + 2] = _c2.b;
      this.a0[i] = o.a ?? 1;
    }
  }
  update(dt) {
    const N = this.N;
    for (let i = 0; i < N; i++) {
      if (this.life[i] <= 0) { if (this.size[i] !== 0) { this.size[i] = 0; this.col[i * 4 + 3] = 0; } continue; }
      this.life[i] -= dt;
      const k = 1 - Math.max(0, this.life[i]) / this.max[i];
      const d = Math.max(0, 1 - this.drag[i] * dt);
      this.vel[i * 3] *= d; this.vel[i * 3 + 2] *= d; this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * d - this.grav[i] * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.size[i] = this.s0[i] + (this.s1[i] - this.s0[i]) * k;
      // color: c1 (hot) -> c0
      const h = Math.max(0, 1 - k * 2.2);
      this.col[i * 4] = this.c0[i * 3] + (this.c1[i * 3] - this.c0[i * 3]) * h;
      this.col[i * 4 + 1] = this.c0[i * 3 + 1] + (this.c1[i * 3 + 1] - this.c0[i * 3 + 1]) * h;
      this.col[i * 4 + 2] = this.c0[i * 3 + 2] + (this.c1[i * 3 + 2] - this.c0[i * 3 + 2]) * h;
      this.col[i * 4 + 3] = this.a0[i] * (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85);
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.col.needsUpdate = true;
    this.geo.attributes.size.needsUpdate = true;
  }
}

function addMat(color, op = 1) { return new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); }

export class FX {
  constructor(scene, renderer) {
    this.scene = scene;
    this.P = new Particles(scene);
    this.projMeshes = new Map();
    this.zoneVis = new Map();
    this.temps = []; // {obj, t, dur, update}
    this.lights = [];
    for (let i = 0; i < 4; i++) { const l = new THREE.PointLight('#fff', 0, 10, 2); scene.add(l); this.lights.push({ l, t: 0, dur: 1, i0: 0 }); }
    this.li = 0;
    this.time = 0;
    this.ringGeo = new THREE.RingGeometry(0.93, 1, 48);
    this.discGeo = new THREE.CircleGeometry(1, 40);
    this.sphere = new THREE.IcosahedronGeometry(1, 1);
  }

  setScale(h, fov) { this.P.mat.uniforms.scale.value = h / (2 * Math.tan((fov * Math.PI / 180) / 2)); }

  flash(pos, color, intensity = 30, dur = 0.25, dist = 12) {
    const L = this.lights[this.li]; this.li = (this.li + 1) % this.lights.length;
    L.l.position.set(pos[0], pos[1] + 0.5, pos[2]); L.l.color.set(color); L.l.distance = dist;
    L.t = dur; L.dur = dur; L.i0 = intensity; L.l.intensity = intensity;
  }

  temp(obj, dur, update) { this.scene.add(obj); this.temps.push({ obj, t: 0, dur, update }); }

  ring(pos, r, color, dur = 0.5, y = 0.06, grow = 1.0) {
    const m = new THREE.Mesh(this.ringGeo, addMat(color, 0.9));
    m.rotation.x = -Math.PI / 2; m.position.set(pos[0], pos[1] + y, pos[2]);
    this.temp(m, dur, (k) => { const s = r * (0.3 + 0.7 * Math.pow(k, 0.5) * grow + (1 - grow)); m.scale.set(s, s, s); m.material.opacity = 0.9 * (1 - k); });
  }
  sphereFlash(pos, r, color, dur = 0.35) {
    const m = new THREE.Mesh(this.sphere, addMat(color, 0.8));
    m.position.set(...pos);
    this.temp(m, dur, (k) => { m.scale.setScalar(r * (0.3 + k * 0.9)); m.material.opacity = 0.8 * (1 - k) * (1 - k); });
  }

  bolt(from, to, color, width = 0.05, dur = 0.16, jag = 0.5) {
    const g = new THREE.Group();
    const seg = Math.max(3, Math.floor(Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]) / 1.4));
    const pts = [];
    for (let i = 0; i <= seg; i++) {
      const k = i / seg;
      const j = (i === 0 || i === seg) ? 0 : jag;
      pts.push(new THREE.Vector3(from[0] + (to[0] - from[0]) * k + (Math.random() - 0.5) * j, from[1] + (to[1] - from[1]) * k + (Math.random() - 0.5) * j, from[2] + (to[2] - from[2]) * k + (Math.random() - 0.5) * j));
    }
    const mat = addMat(color, 1), core = addMat('#ffffff', 1);
    for (let i = 0; i < seg; i++) {
      const a = pts[i], b = pts[i + 1];
      const len = a.distanceTo(b);
      for (const [mm, w] of [[mat, width * 2.4], [core, width]]) {
        const c = new THREE.Mesh(new THREE.CylinderGeometry(w, w, len, 4, 1, true), mm);
        c.position.copy(a).add(b).multiplyScalar(0.5);
        c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
        g.add(c);
      }
    }
    this.temp(g, dur, (k) => { mat.opacity = 1 - k; core.opacity = 1 - k; });
  }

  ray(from, to, color, width = 0.08, dur = 0.18) {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const len = a.distanceTo(b);
    const g = new THREE.Group();
    const m1 = addMat(color, 0.9), m2 = addMat('#ffffff', 1);
    const c1 = new THREE.Mesh(new THREE.CylinderGeometry(width * 2.5, width * 2.5, len, 6, 1, true), m1);
    const c2 = new THREE.Mesh(new THREE.CylinderGeometry(width, width, len, 6, 1, true), m2);
    for (const c of [c1, c2]) { c.position.copy(a).add(b).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); g.add(c); }
    this.temp(g, dur, (k) => { m1.opacity = 0.9 * (1 - k); m2.opacity = 1 - k; g.scale.set(1 - k * 0.6, 1, 1 - k * 0.6); });
  }

  slash(origin, yaw, color, radius = 2.4, dur = 0.2, side = 1) {
    const arc = new THREE.Mesh(new THREE.RingGeometry(radius * 0.55, radius, 24, 1, -Math.PI * 0.35, Math.PI * 0.7), addMat(color, 0.85));
    arc.material.side = THREE.DoubleSide;
    const g = new THREE.Group();
    g.add(arc); arc.rotation.x = -Math.PI / 2; arc.rotation.z = Math.PI / 2;
    g.position.set(...origin); g.rotation.y = yaw; g.rotation.z = side * 0.35;
    this.temp(g, dur, (k) => { arc.material.opacity = 0.85 * (1 - k); arc.rotation.z = Math.PI / 2 + side * (k - 0.5) * 1.2; });
  }

  // continuous emitters
  trail(look, p, v) {
    const L = LOOK[look]; if (!L) return;
    switch (L.trail) {
      case 'fire': this.P.emit(p, { n: 2, c: '#ff3a0a', c2: '#ffd27a', sp: 0.6, s: 0.35, s1: 0.05, life: 0.4, up: 0.8 }); break;
      case 'frost': this.P.emit(p, { n: 1, c: '#5fc8ff', c2: '#ffffff', sp: 0.2, s: 0.12, life: 0.35 }); break;
      case 'soul': this.P.emit(p, { n: 2, c: '#1aff8a', c2: '#e0fff0', sp: 0.4, s: 0.2, life: 0.5 }); break;
      case 'blood': this.P.emit(p, { n: 2, c: '#a0001a', c2: '#ff5a7a', sp: 0.4, s: 0.16, life: 0.4, g: 4 }); break;
      case 'poison': this.P.emit(p, { n: 1, c: '#4a8a10', c2: '#c8ff7a', sp: 0.3, s: 0.18, life: 0.6 }); break;
      case 'void': this.P.emit(p, { n: 2, c: '#3a0a8a', c2: '#c8a0ff', sp: 0.5, s: 0.4, life: 0.5 }); break;
      case 'star': this.P.emit(p, { n: 1, c: '#7a9aff', c2: '#ffffff', sp: 0.5, s: 0.14, life: 0.6 }); break;
    }
  }

  // ---------- projectiles ----------
  syncProjectiles(list, dt) {
    const seen = new Set();
    for (const pr of list) {
      seen.add(pr.id);
      let m = this.projMeshes.get(pr.id);
      const L = LOOK[pr.look] || LOOK.soul;
      if (!m) {
        m = new THREE.Group();
        const core = new THREE.Mesh(this.sphere, addMat(L.c2, 1)); core.scale.setScalar(L.s * 0.55);
        const glow = new THREE.Mesh(this.sphere, addMat(L.c, 0.55)); glow.scale.setScalar(L.s);
        m.add(glow); m.add(core);
        if (L.stretch) {
          core.scale.set(L.s * 0.35, L.s * 0.35, L.stretch); glow.scale.set(L.s, L.s, L.stretch * 1.3);
          if (pr.look === 'arrow' || pr.look === 'feather' || pr.look === 'reaper') {
            const tip = new THREE.Mesh(new THREE.ConeGeometry(L.s * 0.9, L.s * 2.5, 4), addMat('#ffffff', 1));
            tip.rotation.x = -Math.PI / 2; tip.position.z = -L.stretch; m.add(tip);
          }
        }
        if (L.spin) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(L.s * 1.1), addMat(L.c, 0.9)); s.scale.set(1, 0.25, 1); m.add(s); m.userData.spinner = s; }
        if (pr.look === 'void') { const sh = new THREE.Mesh(this.sphere, new THREE.MeshBasicMaterial({ color: '#05010a' })); sh.scale.setScalar(L.s * 0.6); m.add(sh); }
        m.userData.look = pr.look;
        this.scene.add(m); this.projMeshes.set(pr.id, m);
      }
      m.position.set(pr.pos[0], pr.pos[1], pr.pos[2]);
      if (pr.vel) { const v = new THREE.Vector3(...pr.vel); if (v.lengthSq() > 0.01) m.lookAt(m.position.clone().sub(v)); }
      if (m.userData.spinner) m.userData.spinner.rotation.y += dt * 18;
      this.trail(pr.look, pr.pos, pr.vel);
    }
    for (const [id, m] of this.projMeshes) if (!seen.has(id)) { this.scene.remove(m); this.projMeshes.delete(id); }
  }

  // ---------- zones ----------
  syncZones(list, dt, myTeam) {
    const seen = new Set();
    for (const z of list) {
      seen.add(z.id);
      let v = this.zoneVis.get(z.id);
      const L = LOOK[z.look] || LOOK.trap;
      const friendly = z.team === myTeam;
      if (!v) {
        v = { g: new THREE.Group(), look: z.look, acc: 0 };
        const col = z.look === 'trap' ? (friendly ? '#9fe8ff' : '#ff6a6a') : L.c;
        if (z.w) {
          const box = new THREE.Mesh(new THREE.BoxGeometry(z.w, z.h || 2.5, Math.max(0.3, z.d)), addMat(col, z.look === 'runewall' ? 0.3 : 0.07));
          box.position.y = (z.h || 2.5) / 2; v.g.add(box); v.box = box;
          if (z.look === 'runewall') {
            const edge = new THREE.Mesh(new THREE.BoxGeometry(z.w, 0.08, z.d + 0.05), addMat('#e0f7ff', 0.9)); edge.position.y = z.h || 3; v.g.add(edge);
          }
        } else {
          const ring = new THREE.Mesh(this.ringGeo, addMat(col, 0.85)); ring.rotation.x = -Math.PI / 2; ring.scale.setScalar(z.r); v.g.add(ring); v.ring = ring;
          const disc = new THREE.Mesh(this.discGeo, addMat(col, 0.12)); disc.rotation.x = -Math.PI / 2; disc.scale.setScalar(z.r); disc.position.y = -0.01; v.g.add(disc); v.disc = disc;
          if (z.delay > 0) { const tel = new THREE.Mesh(this.discGeo, addMat(col, 0.3)); tel.rotation.x = -Math.PI / 2; tel.position.y = 0.01; v.g.add(tel); v.tel = tel; }
          if (z.look === 'sanctum' || z.look === 'bloodfeast' || z.look === 'runecircle' || z.look === 'cauldron') {
            const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), addMat(col, 0.07)); dome.material.side = THREE.DoubleSide; dome.scale.set(z.r, z.r * 0.5, z.r); v.g.add(dome); v.dome = dome;
          }
          if (z.look === 'storm' || z.look === 'starfall' || z.look === 'blizzard') {
            const cloud = new THREE.Mesh(this.discGeo, new THREE.MeshBasicMaterial({ color: z.look === 'storm' ? '#1a1f30' : '#202840', transparent: true, opacity: 0.55, depthWrite: false })); cloud.rotation.x = Math.PI / 2; cloud.position.y = 9; cloud.scale.setScalar(z.r * 1.1); v.g.add(cloud);
          }
          if (z.look === 'trap') { for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 4), addMat(col, 0.9)); s.position.set(Math.cos(i) * 0.6, 0.15, Math.sin(i) * 0.6); s.rotation.z = Math.cos(i) * 0.5; s.rotation.x = Math.sin(i) * 0.5; v.g.add(s); } }
        }
        this.scene.add(v.g); this.zoneVis.set(z.id, v);
      }
      v.g.position.set(z.pos[0], z.pos[1] + 0.05, z.pos[2]);
      v.g.rotation.y = z.w ? -z.yaw : 0;
      if (z.w) v.g.rotation.y = z.yaw;
      if (v.ring) v.ring.rotation.z += dt * 0.6;
      const active = z.t >= z.delay;
      if (v.tel) { const k = Math.min(1, z.t / Math.max(0.01, z.delay)); v.tel.scale.setScalar(z.r * k); v.tel.visible = !active; }
      this.zoneParticles(z, v, dt, L, active);
    }
    for (const [id, v] of this.zoneVis) if (!seen.has(id)) { this.scene.remove(v.g); this.zoneVis.delete(id); }
  }

  zoneParticles(z, v, dt, L, active) {
    const p = z.pos, r = z.r;
    const rp = () => { const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * r; return [p[0] + Math.cos(a) * d, p[1] + 0.1, p[2] + Math.sin(a) * d]; };
    v.acc += dt;
    const rate = 1 / 60;
    while (v.acc > rate) {
      v.acc -= rate;
      switch (z.look) {
        case 'firewall': {
          const c = Math.cos(z.yaw), s = Math.sin(z.yaw);
          for (let i = 0; i < 3; i++) { const lx = (Math.random() - 0.5) * z.w; this.P.emit([p[0] + lx * c, p[1] + 0.2, p[2] - lx * s], { c: '#ff3a0a', c2: '#ffd27a', sp: 0.5, up: 3.5, s: 0.7, s1: 0.1, life: 0.7, drag: 0.5 }); }
          break;
        }
        case 'meteor': if (!active) { this.P.emit(rp(), { c: '#ff3a0a', c2: '#ffb347', sp: 0.3, up: 1, s: 0.2, life: 0.4 }); } break;
        case 'blizzard': for (let i = 0; i < 4; i++) { const q = rp(); q[1] += 4 + Math.random() * 3; this.P.emit(q, { c: '#bfefff', c2: '#ffffff', sp: 1, v: [3, -6, 1], s: 0.15, life: 0.9, drag: 0.1 }); } break;
        case 'storm': this.P.emit([p[0] + (Math.random() - 0.5) * r * 2, p[1] + 8.5, p[2] + (Math.random() - 0.5) * r * 2], { c: '#3a4a80', c2: '#8fb8ff', sp: 0.5, s: 1.2, life: 0.6, a: 0.3 }); break;
        case 'bloodfeast': { const q = rp(); this.P.emit(q, { c: '#a0001a', c2: '#ff4a6a', sp: 0.3, v: [(p[0] - q[0]) * 1.2, 1.5, (p[2] - q[2]) * 1.2], s: 0.2, life: 0.7, drag: 0.2 }); break; }
        case 'sanctum': if (Math.random() < 0.6) this.P.emit(rp(), { c: '#ffd54f', c2: '#ffffff', sp: 0.2, up: 2, s: 0.16, life: 1.2, drag: 0.3 }); break;
        case 'miasma': this.P.emit(rp(), { c: '#3a6a10', c2: '#b8ff6a', sp: 0.4, up: 0.6, s: 1.4, s1: 1.8, life: 1.4, a: 0.25, drag: 0.5 }); break;
        case 'rift': { const a = Math.random() * Math.PI * 2; const q = [p[0] + Math.cos(a) * r, p[1] + 0.3, p[2] + Math.sin(a) * r]; this.P.emit(q, { c: '#5a1fc0', c2: '#e0c8ff', sp: 0.1, v: [(p[0] - q[0]) * 1.8 - Math.sin(a) * 4, 0.5, (p[2] - q[2]) * 1.8 + Math.cos(a) * 4], s: 0.25, life: 0.55, drag: 0 }); break; }
        case 'collapse': { const a = Math.random() * Math.PI * 2; const q = [p[0] + Math.cos(a) * r, p[1] + Math.random() * 3, p[2] + Math.sin(a) * r]; this.P.emit(q, { c: '#3a0a8a', c2: '#ffffff', sp: 0, v: [(p[0] - q[0]) * 1.5, (p[1] + 1 - q[1]), (p[2] - q[2]) * 1.5], s: 0.3, life: 0.6, drag: 0 }); break; }
        case 'crows': if (Math.random() < 0.5) { const q = rp(); q[1] += 1 + Math.random() * 2; this.P.emit(q, { c: '#0a0a12', c2: '#5c6bc0', sp: 5, s: 0.35, life: 0.5, drag: 0.5, a: 0.9 }); } break;
        case 'runecircle': if (Math.random() < 0.5) this.P.emit(rp(), { c: '#1a8ac0', c2: '#e0f7ff', sp: 0.1, up: 1.5, s: 0.14, life: 1, drag: 0.2 }); break;
        case 'constellation': if (Math.random() < 0.5) { const q = rp(); q[1] += Math.random() * 2; this.P.emit(q, { c: '#7a9aff', c2: '#ffffff', sp: 0.1, s: 0.14, life: 1, drag: 0.2 }); } break;
        case 'starfall': if (Math.random() < 0.3) this.P.emit(rp(), { c: '#7a9aff', c2: '#ffffff', sp: 0.2, up: 0.5, s: 0.12, life: 0.8 }); break;
        case 'cauldron': if (Math.random() < 0.7) this.P.emit(rp(), { c: '#3a7a20', c2: '#c8ff8a', sp: 0.3, up: 1.2, s: 0.3, life: 1, a: 0.6 }); break;
        case 'whirl': { const a = this.time * 14 + Math.random(); this.P.emit([p[0] + Math.cos(a) * r * 0.8, p[1] + 1.1, p[2] + Math.sin(a) * r * 0.8], { c: '#ff6a4a', c2: '#ffffff', sp: 0.2, s: 0.25, life: 0.25 }); break; }
        case 'pillar': if (!active) this.P.emit(rp(), { c: '#ffb300', c2: '#ffffff', sp: 0.1, up: 3, s: 0.12, life: 0.5 }); break;
        case 'roots': if (!active) this.P.emit(rp(), { c: '#3a7a20', c2: '#c8ff8a', sp: 0.2, up: 1, s: 0.15, life: 0.4 }); break;
      }
    }
  }

  // ---------- event effects ----------
  handle(e, ctx) {
    const P = this.P;
    switch (e.fx) {
      case 'beam': {
        const L = LOOK[e.look] || LOOK.lightning;
        if (e.look === 'holy') this.ray(e.from, e.to, L.c, 0.06, 0.2);
        else if (e.look === 'mesmer') this.ray(e.from, e.to, L.c, 0.04, 0.3);
        else this.bolt(e.from, e.to, L.c, e.look === 'chain' ? 0.05 : 0.035, 0.16, e.look === 'chain' ? 0.9 : 0.5);
        P.emit(e.to, { n: 8, c: L.c, c2: L.c2, sp: 4, s: 0.15, life: 0.3 });
        this.flash(e.to, L.c, 12, 0.12, 8);
        break;
      }
      case 'explode': {
        const L = LOOK[e.look] || LOOK.fireball;
        this.sphereFlash(e.pos, e.r, L.c, 0.35);
        P.emit(e.pos, { n: 40, c: L.c, c2: L.c2, sp: e.r * 3.2, s: 0.4, s1: 0.05, life: 0.6, drag: 3 });
        if (e.look === 'flask') P.emit(e.pos, { n: 18, c: '#3a6a10', c2: '#c8ff7a', sp: 1.5, up: 0.8, s: 1.0, s1: 1.4, life: 1.4, a: 0.35 });
        this.flash(e.pos, L.c, 40, 0.3, e.r * 5);
        ctx?.shake?.(e.pos, 0.25);
        break;
      }
      case 'impact': {
        const L = LOOK[e.look] || LOOK.soul;
        P.emit(e.pos, { n: 10, c: L.c, c2: L.c2, sp: 3, s: 0.15, life: 0.3 });
        break;
      }
      case 'swing': break; // handled by renderer for attacker
      case 'crit': P.emit(e.pos, { n: 22, c: '#ff2a6a', c2: '#ffffff', sp: 5, s: 0.18, life: 0.4 }); this.sphereFlash(e.pos, 0.8, '#ff3a8a', 0.2); break;
      case 'burst': this.ring(e.pos, 3.2, e.color || '#ff7a1a', 0.4); P.emit([e.pos[0], e.pos[1] + 0.3, e.pos[2]], { n: 30, c: e.color || '#ff5a1a', c2: '#ffe0a0', sp: 6, s: 0.35, life: 0.45, drag: 4 }); this.flash(e.pos, e.color || '#ff7a1a', 25, 0.25); break;
      case 'blink': P.emit([e.pos[0], e.pos[1] + 1, e.pos[2]], { n: 30, c: e.color || '#b06cff', c2: '#ffffff', sp: 2.5, s: 0.25, life: 0.5, spread: [0.3, 0.8, 0.3] }); break;
      case 'slam': this.ring(e.pos, e.r, e.color || '#ff3b3b', 0.55); this.ring(e.pos, e.r * 0.6, '#ffffff', 0.35); P.emit([e.pos[0], e.pos[1] + 0.2, e.pos[2]], { n: 50, c: '#6a5a4a', c2: e.color || '#ffbb88', sp: e.r * 2, up: 3, s: 0.35, life: 0.7, g: 9, drag: 1.5 }); this.flash(e.pos, e.color || '#ff3b3b', 40, 0.3, 14); ctx?.shake?.(e.pos, 0.5); break;
      case 'shock': this.ring(e.pos, e.r, e.color || '#ccc', 0.5); P.emit([e.pos[0], e.pos[1] + 0.2, e.pos[2]], { n: 40, c: '#7a6a5a', c2: '#ddd', sp: e.r * 2, up: 2.5, s: 0.35, life: 0.6, g: 7 }); ctx?.shake?.(e.pos, 0.35); break;
      case 'healwave': this.ring(e.pos, e.r, e.color || '#58ffb0', 0.6); this.ring(e.pos, e.r * 0.7, '#ffffff', 0.45); P.emit([e.pos[0], e.pos[1] + 0.5, e.pos[2]], { n: 40, c: e.color || '#58ffb0', c2: '#ffffff', sp: e.r * 1.2, up: 1.5, s: 0.2, life: 0.8, drag: 2 }); break;
      case 'skull': this.ring(e.pos, 10, '#9acd32', 0.9); this.ring(e.pos, 20, '#9acd32', 1.2); P.emit([e.pos[0], e.pos[1] + 1, e.pos[2]], { n: 80, c: '#3a6a10', c2: '#c8ff7a', sp: 12, s: 0.6, life: 1.2, a: 0.5, drag: 1.2 }); break;
      case 'roar': this.ring(e.pos, e.r, '#d4552f', 0.5); this.ring(e.pos, e.r * 0.6, '#ffaa88', 0.4); ctx?.shake?.(e.pos, 0.3); break;
      case 'quake': this.ring(e.pos, e.r, '#c6ff6a', 0.5); P.emit([e.pos[0], e.pos[1] + 0.2, e.pos[2]], { n: 60, c: '#5a4a3a', c2: '#c6ff6a', sp: e.r * 2, up: 4, s: 0.4, life: 0.8, g: 9 }); this.flash(e.pos, '#c6ff6a', 30, 0.3); ctx?.shake?.(e.pos, 0.55); break;
      case 'breath': {
        const yaw = e.yaw;
        for (let i = 0; i < 50; i++) {
          const a = yaw + (Math.random() - 0.5) * (e.angle * Math.PI / 180);
          const sp = 8 + Math.random() * 8;
          P.emit([e.pos[0], e.pos[1] + 1.5, e.pos[2]], { c: '#ff3a0a', c2: '#ffe08a', sp: 0.5, v: [-Math.sin(a) * sp, 0.5, -Math.cos(a) * sp], s: 0.5, s1: 1.0, life: 0.5, drag: 1.5 });
        }
        this.flash(e.pos, '#ff7a1a', 40, 0.4);
        break;
      }
      case 'dragonburst': this.sphereFlash([e.pos[0], e.pos[1] + 1, e.pos[2]], e.r, '#ff6a1a', 0.5); this.ring(e.pos, e.r, '#ffb347', 0.6); P.emit([e.pos[0], e.pos[1] + 1, e.pos[2]], { n: 120, c: '#ff3a0a', c2: '#ffe08a', sp: e.r * 3, s: 0.6, s1: 0.1, life: 0.8, drag: 2.5 }); this.flash(e.pos, '#ff6a1a', 80, 0.5, 20); ctx?.shake?.(e.pos, 0.8); break;
      case 'buff': ctx?.buffFx?.(e); break;
      case 'blocked': ctx?.blockFx?.(e); break;
      case 'wisp': {
        const steps = 10;
        for (let i = 0; i <= steps; i++) {
          const k = i / steps;
          const q = [e.from[0] + (e.to[0] - e.from[0]) * k, e.from[1] + (e.to[1] - e.from[1]) * k + Math.sin(k * Math.PI) * 1.2, e.from[2] + (e.to[2] - e.from[2]) * k];
          P.emit(q, { n: 2, c: e.color || '#58ffb0', c2: '#ffffff', sp: 0.3, s: 0.2, life: 0.4 + k * 0.4 });
        }
        break;
      }
      case 'chain': this.bolt(e.from, e.to, '#b8b8c0', 0.03, 0.4, 0.15); break;
      case 'strike': {
        if (e.look === 'storm') { this.bolt([e.pos[0] + (Math.random() - 0.5), e.pos[1] + 9, e.pos[2]], e.pos, '#8fb8ff', 0.07, 0.2, 1.2); this.flash(e.pos, '#8fb8ff', 50, 0.15, 12); this.ring(e.pos, 2.6, '#8fb8ff', 0.3); P.emit(e.pos, { n: 14, c: '#8fb8ff', c2: '#ffffff', sp: 5, s: 0.15, life: 0.3 }); }
        else { // starfall
          this.ray([e.pos[0] + 2, e.pos[1] + 12, e.pos[2] - 1], e.pos, '#bcd0ff', 0.06, 0.25);
          this.ring(e.pos, 2.8, '#bcd0ff', 0.35); P.emit(e.pos, { n: 18, c: '#7a9aff', c2: '#ffffff', sp: 5, s: 0.18, life: 0.4 });
          this.flash(e.pos, '#bcd0ff', 30, 0.15);
        }
        ctx?.shake?.(e.pos, 0.15);
        break;
      }
      case 'burstZone': {
        const L = LOOK[e.look] || LOOK.meteor;
        if (e.look === 'meteor') {
          // falling rock
          const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2), new THREE.MeshStandardMaterial({ color: '#2a1a10', emissive: '#ff4a0a', emissiveIntensity: 1.5, flatShading: true }));
          this.sphereFlash([e.pos[0], e.pos[1] + 1, e.pos[2]], e.r * 1.1, '#ff6a1a', 0.6);
          P.emit([e.pos[0], e.pos[1] + 0.5, e.pos[2]], { n: 140, c: '#ff3a0a', c2: '#ffe08a', sp: e.r * 3.5, up: 2, s: 0.7, s1: 0.1, life: 0.9, drag: 2.2 });
          P.emit([e.pos[0], e.pos[1] + 0.5, e.pos[2]], { n: 40, c: '#2a2020', c2: '#5a4a40', sp: e.r * 2, up: 5, s: 1.6, s1: 2.5, life: 1.5, a: 0.4, drag: 1.5 });
          this.flash(e.pos, '#ff6a1a', 120, 0.6, 26);
          ctx?.shake?.(e.pos, 1.0);
        } else if (e.look === 'collapse') {
          this.sphereFlash([e.pos[0], e.pos[1] + 1, e.pos[2]], e.r, '#7a3aff', 0.5);
          P.emit([e.pos[0], e.pos[1] + 1, e.pos[2]], { n: 120, c: '#3a0a8a', c2: '#ffffff', sp: e.r * 3, s: 0.5, life: 0.8, drag: 2 });
          this.flash(e.pos, '#7a3aff', 90, 0.5, 22); ctx?.shake?.(e.pos, 0.8);
        } else if (e.look === 'pillar') {
          this.ray([e.pos[0], e.pos[1] + 20, e.pos[2]], e.pos, '#ffd54f', 0.9, 0.45);
          this.ring(e.pos, e.r, '#ffffff', 0.4);
          P.emit(e.pos, { n: 50, c: '#ffb300', c2: '#ffffff', sp: 6, up: 3, s: 0.25, life: 0.6 });
          this.flash(e.pos, '#ffd54f', 70, 0.4, 16); ctx?.shake?.(e.pos, 0.4);
        } else if (e.look === 'roots') {
          for (let i = 0; i < 9; i++) {
            const a = (i / 9) * Math.PI * 2; const d = Math.random() * e.r;
            const sp = new THREE.Mesh(new THREE.ConeGeometry(0.15, 1.6, 4), new THREE.MeshStandardMaterial({ color: '#3a5a20', emissive: '#4a8a20', emissiveIntensity: 0.6, flatShading: true }));
            sp.position.set(e.pos[0] + Math.cos(a) * d, e.pos[1], e.pos[2] + Math.sin(a) * d);
            sp.rotation.set((Math.random() - 0.5) * 0.6, 0, (Math.random() - 0.5) * 0.6);
            this.temp(sp, 1.6, (k) => { const s = k < 0.15 ? k / 0.15 : (k > 0.8 ? (1 - k) / 0.2 : 1); sp.scale.set(1, s, 1); sp.position.y = e.pos[1] + 0.8 * s - 0.2; });
          }
          this.ring(e.pos, e.r, '#7bc96f', 0.5);
        }
        break;
      }
      case 'trapSnap': P.emit([e.pos[0], e.pos[1] + 0.3, e.pos[2]], { n: 40, c: '#5fc8ff', c2: '#ffffff', sp: 4, up: 2, s: 0.22, life: 0.5, g: 6 }); this.ring(e.pos, 1.8, '#9fe8ff', 0.4); break;
      case 'spark': P.emit(e.pos, { n: 12, c: e.color || '#4fc3f7', c2: '#ffffff', sp: 4, s: 0.15, life: 0.3 }); break;
    }
  }

  deathFx(pos, color) {
    this.P.emit([pos[0], pos[1] + 1, pos[2]], { n: 60, c: '#1a1020', c2: color || '#ff3b3b', sp: 2.5, up: 1.5, s: 0.4, s1: 0.05, life: 1.4, drag: 1.2, spread: [0.3, 0.7, 0.3] });
    this.flash(pos, color || '#ff3b3b', 20, 0.4);
  }

  ambient(dt, camPos) {
    // floating embers & ash
    if (Math.random() < dt * 30) {
      const x = (Math.random() - 0.5) * HALF_X * 2, z = (Math.random() - 0.5) * HALF_Z * 2;
      const ember = Math.random() < 0.35;
      this.P.emit([x, Math.random() * 6, z], ember
        ? { c: '#ff4a0a', c2: '#ffb347', sp: 0.2, v: [0.3, 0.5, 0.15], s: 0.07, life: 5, drag: 0, a: 0.9 }
        : { c: '#6a6070', c2: '#a8a0b0', sp: 0.2, v: [0.4, -0.15, 0.2], s: 0.06, life: 6, drag: 0, a: 0.5 });
    }
  }

  braziers(list, dt) {
    for (const b of list) if (Math.random() < dt * 40) this.P.emit([b[0] + (Math.random() - 0.5) * 0.4, b[1], b[2] + (Math.random() - 0.5) * 0.4], { c: '#ff3a0a', c2: '#ffd27a', sp: 0.3, up: 2.2, s: 0.55, s1: 0.05, life: 0.6, drag: 0.5 });
  }

  update(dt) {
    this.time += dt;
    this.P.update(dt);
    this.temps = this.temps.filter(t => {
      t.t += dt;
      const k = Math.min(1, t.t / t.dur);
      t.update?.(k);
      if (k >= 1) { this.scene.remove(t.obj); t.obj.traverse?.(o => { if (o.geometry && o.geometry !== this.ringGeo && o.geometry !== this.sphere && o.geometry !== this.discGeo) o.geometry.dispose(); }); return false; }
      return true;
    });
    for (const L of this.lights) { if (L.t > 0) { L.t -= dt; L.l.intensity = Math.max(0, L.i0 * (L.t / L.dur)); } else L.l.intensity = 0; }
  }

  clear() {
    for (const [, m] of this.projMeshes) this.scene.remove(m);
    for (const [, v] of this.zoneVis) this.scene.remove(v.g);
    this.projMeshes.clear(); this.zoneVis.clear();
  }
}
