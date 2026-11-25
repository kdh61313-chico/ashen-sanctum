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
  mine: { c: '#ffaa3a', c2: '#ffffff' },
  bullet: { c: '#ffcf6a', c2: '#fff6d8', s: 0.07, stretch: 0.9 },
  silver: { c: '#dfe8ff', c2: '#ffffff', s: 0.08, stretch: 1.2 },
  runebullet: { c: '#5fd4ff', c2: '#e0f8ff', s: 0.1, stretch: 1.0 },
  execution: { c: '#ff2a3a', c2: '#ffffff' },
  pellet: { c: '#ffb04a', c2: '#fff0c8', s: 0.06, stretch: 0.5 },
  grenade: { c: '#8bd450', c2: '#e8ffc8', s: 0.2, spin: true, trail: 'poison' },
  plasma: { c: '#ff9a3a', c2: '#fff0c8', s: 0.42, trail: 'fire' },
  shadowbullet: { c: '#a07cff', c2: '#f0e8ff', s: 0.08, stretch: 0.8 },
  needle: { c: '#ff7ac0', c2: '#ffffff', s: 0.06, stretch: 0.6 },
  icicle: { c: '#a8e8ff', c2: '#ffffff', s: 0.14, stretch: 0.6, trail: 'frost' },
  bloodorb: { c: '#ff2a4a', c2: '#ffd0d8', s: 0.26, trail: 'blood' },
  moon: { c: '#cfe0ff', c2: '#ffffff', s: 0.26, trail: 'star' },
  tentacle: { c: '#4affe8', c2: '#e0fff8', s: 0.3, trail: 'soul' },
  bomb: { c: '#ffcc3a', c2: '#fff6c8', s: 0.25, spin: true, trail: 'fire' },
  bigbomb: { c: '#ff8a1a', c2: '#fff0c8', s: 0.6, spin: true, trail: 'fire' },
  smoke: { c: '#9aa4b4', c2: '#ffffff' },
  acid: { c: '#8bd450', c2: '#e8ffc8' },
  barrage: { c: '#ff8a3a', c2: '#ffffff' },
  petals: { c: '#ff8ac8', c2: '#ffffff' },
  moonzone: { c: '#cfe0ff', c2: '#ffffff' },
  hellgate: { c: '#ff3a1a', c2: '#ffcf8a' },
  web: { c: '#ff7ac0', c2: '#ffffff' },
  icecage: { c: '#a8e8ff', c2: '#ffffff' },
  axe: { c: '#ff9a4a', c2: '#ffffff', s: 0.3, trail: 'fire' },
  lance: { c: '#8fd8ff', c2: '#ffffff', s: 0.18, stretch: 1.6, trail: 'spark' },
  string: { c: '#ff7ac0', c2: '#ffffff' },
  bloodchain: { c: '#ff1f4b', c2: '#ffb0c0' },
  sparkpath: { c: '#8fd8ff', c2: '#ffffff' },
  bloodmist: { c: '#c0102a', c2: '#ff6a80' },
  fireground: { c: '#ff5a1a', c2: '#ffd27a' },
  icepath: { c: '#a8e8ff', c2: '#ffffff' },
  decoy: { c: '#ff9ce8', c2: '#ffffff' },
};
let _runeTex = null;
export function runeTex() {
  if (_runeTex) return _runeTex;
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'); g.translate(S / 2, S / 2);
  g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineCap = 'round';
  const ring = (r, w) => { g.lineWidth = w; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); };
  ring(122, 4); ring(110, 2); ring(70, 3); ring(60, 1.5);
  for (let i = 0; i < 24; i++) { // glyph band
    g.save(); g.rotate(i / 24 * Math.PI * 2); g.translate(0, -90); g.lineWidth = 2.4;
    const t = i * 7919 % 5;
    g.beginPath();
    if (t === 0) { g.moveTo(-5, -8); g.lineTo(0, 8); g.lineTo(5, -8); }
    else if (t === 1) { g.moveTo(0, -9); g.lineTo(0, 9); g.moveTo(-6, -2); g.lineTo(6, 3); }
    else if (t === 2) { g.arc(0, 0, 6, 0.3, Math.PI * 1.7); }
    else if (t === 3) { g.moveTo(-6, 8); g.lineTo(0, -8); g.lineTo(6, 8); g.moveTo(-3, 2); g.lineTo(3, 2); }
    else { g.moveTo(-6, -6); g.lineTo(6, 6); g.moveTo(6, -6); g.lineTo(-6, 6); }
    g.stroke(); g.restore();
  }
  g.lineWidth = 2.5; // hexagram
  for (const o of [0, Math.PI]) { g.beginPath(); for (let i = 0; i <= 3; i++) { const a = o + i / 3 * Math.PI * 2 - Math.PI / 2; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 60, Math.sin(a) * 60); } g.stroke(); }
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.beginPath(); g.arc(Math.cos(a) * 116, Math.sin(a) * 116, 5, 0, Math.PI * 2); g.fill(); }
  _runeTex = new THREE.CanvasTexture(c); _runeTex.colorSpace = THREE.SRGBColorSpace;
  return _runeTex;
}

let _glowTex = null;
export function glowTex() {
  if (_glowTex) return _glowTex;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'); const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.4, 'rgba(255,255,255,.35)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  _glowTex = new THREE.CanvasTexture(c); return _glowTex;
}
let _smokeTex = null;
function smokeTex() {
  if (_smokeTex) return _smokeTex;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  for (let i = 0; i < 14; i++) { const x = 64 + (Math.random() - 0.5) * 50, y = 64 + (Math.random() - 0.5) * 50, r = 20 + Math.random() * 26; const grd = g.createRadialGradient(x, y, 0, x, y, r); grd.addColorStop(0, 'rgba(255,255,255,.35)'); grd.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = grd; g.fillRect(0, 0, 128, 128); }
  _smokeTex = new THREE.CanvasTexture(c); return _smokeTex;
}
// vertical gradient for light pillars
let _beamTex = null;
function beamTex() {
  if (_beamTex) return _beamTex;
  const c = document.createElement('canvas'); c.width = 4; c.height = 128;
  const g = c.getContext('2d'); const grd = g.createLinearGradient(0, 128, 0, 0);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.3, 'rgba(255,255,255,.55)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 4, 128);
  _beamTex = new THREE.CanvasTexture(c); return _beamTex;
}
// fresnel energy shell (domes, afterimages, decoys)
function fresnelMat(color, power = 2.2, base = 0.05) {
  return new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(color) }, op: { value: 1 }, power: { value: power }, base: { value: base }, time: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform vec3 color; uniform float op; uniform float power; uniform float base; uniform float time; varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main(){ float f = pow(1.0 - abs(dot(normalize(vN), vV)), power); float bands = 0.75 + 0.25*sin(vW.y*14.0 - time*6.0); gl_FragColor = vec4(color*(1.2+f*1.5), (base + f)*op*bands); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
}

// Camera-facing streaks (sparks, comet tails, speed lines). Each streak has a head and a tail point.
class Streaks {
  constructor(scene, N = 1400) {
    this.N = N; this.i = 0;
    const g = new THREE.BufferGeometry();
    this.head = new Float32Array(N * 4 * 3); this.tail = new Float32Array(N * 4 * 3);
    this.corner = new Float32Array(N * 4 * 2); this.col = new Float32Array(N * 4 * 4); this.w = new Float32Array(N * 4);
    const idx = new Uint32Array(N * 6);
    for (let k = 0; k < N; k++) {
      const c = [[0, -1], [0, 1], [1, -1], [1, 1]];
      for (let j = 0; j < 4; j++) { this.corner[(k * 4 + j) * 2] = c[j][0]; this.corner[(k * 4 + j) * 2 + 1] = c[j][1]; }
      const b = k * 4; idx.set([b, b + 1, b + 2, b + 1, b + 3, b + 2], k * 6);
    }
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.setAttribute('position', new THREE.BufferAttribute(this.head, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('tail', new THREE.BufferAttribute(this.tail, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('corner', new THREE.BufferAttribute(this.corner, 2));
    g.setAttribute('col', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('wid', new THREE.BufferAttribute(this.w, 1).setUsage(THREE.DynamicDrawUsage));
    this.mat = new THREE.ShaderMaterial({
      vertexShader: `attribute vec3 tail; attribute vec2 corner; attribute vec4 col; attribute float wid; varying vec4 vC; varying vec2 vUv;
        void main(){ vec3 P = mix(tail, position, corner.x); vec3 d = position - tail; vec3 vd = cameraPosition - P;
          vec3 side = cross(d, vd); float l = length(side); side = l > 1e-5 ? side / l : vec3(0.,1.,0.);
          P += side * wid * corner.y * mix(0.35, 1.0, corner.x); vC = col; vUv = corner; gl_Position = projectionMatrix*viewMatrix*vec4(P,1.); }`,
      fragmentShader: `varying vec4 vC; varying vec2 vUv; void main(){ float e = 1.0 - abs(vUv.y); float a = e*e * (0.25 + 0.75*vUv.x); gl_FragColor = vec4(vC.rgb*(1.0+e*0.8), vC.a*a); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = 6;
    scene.add(this.mesh); this.geo = g;
    this.p = new Float32Array(N * 3); this.v = new Float32Array(N * 3); this.len = new Float32Array(N); this.life = new Float32Array(N); this.max = new Float32Array(N);
    this.w0 = new Float32Array(N); this.g = new Float32Array(N); this.c = new Float32Array(N * 3); this.fixed = new Uint8Array(N); this.t0 = new Float32Array(N * 3);
    this.dirty = false;
  }
  // moving spark: pos, vel, len(seconds of velocity), width, life, color, gravity
  spark(p, v, o = {}) {
    const i = this.i; this.i = (this.i + 1) % this.N;
    this.p.set(p, i * 3); this.v.set(v, i * 3); this.fixed[i] = 0;
    this.len[i] = o.len ?? 0.04; this.w0[i] = o.w ?? 0.03; this.life[i] = this.max[i] = o.life ?? 0.3; this.g[i] = o.g ?? 6;
    _c.set(o.c || '#ffffff'); this.c[i * 3] = _c.r; this.c[i * 3 + 1] = _c.g; this.c[i * 3 + 2] = _c.b;
  }
  // static segment that fades (tails, lines)
  seg(a, b, o = {}) {
    const i = this.i; this.i = (this.i + 1) % this.N;
    this.p.set(b, i * 3); this.t0.set(a, i * 3); this.fixed[i] = 1;
    this.w0[i] = o.w ?? 0.05; this.life[i] = this.max[i] = o.life ?? 0.2;
    _c.set(o.c || '#ffffff'); this.c[i * 3] = _c.r; this.c[i * 3 + 1] = _c.g; this.c[i * 3 + 2] = _c.b;
  }
  update(dt) {
    for (let i = 0; i < this.N; i++) {
      const o4 = i * 4;
      if (this.life[i] <= 0) { if (this.w[o4]) { for (let j = 0; j < 4; j++) { this.w[o4 + j] = 0; this.col[(o4 + j) * 4 + 3] = 0; } } continue; }
      this.life[i] -= dt;
      const k = Math.max(0, this.life[i] / this.max[i]);
      let hx, hy, hz, tx, ty, tz;
      if (this.fixed[i]) { hx = this.p[i * 3]; hy = this.p[i * 3 + 1]; hz = this.p[i * 3 + 2]; tx = this.t0[i * 3]; ty = this.t0[i * 3 + 1]; tz = this.t0[i * 3 + 2]; }
      else {
        this.v[i * 3 + 1] -= this.g[i] * dt;
        const dr = Math.max(0, 1 - 2.5 * dt); this.v[i * 3] *= dr; this.v[i * 3 + 1] *= dr; this.v[i * 3 + 2] *= dr;
        this.p[i * 3] += this.v[i * 3] * dt; this.p[i * 3 + 1] += this.v[i * 3 + 1] * dt; this.p[i * 3 + 2] += this.v[i * 3 + 2] * dt;
        hx = this.p[i * 3]; hy = this.p[i * 3 + 1]; hz = this.p[i * 3 + 2];
        const L = this.len[i];
        tx = hx - this.v[i * 3] * L; ty = hy - this.v[i * 3 + 1] * L; tz = hz - this.v[i * 3 + 2] * L;
      }
      const w = this.w0[i] * (this.fixed[i] ? k : (0.4 + 0.6 * k));
      for (let j = 0; j < 4; j++) {
        const q = o4 + j;
        this.head[q * 3] = hx; this.head[q * 3 + 1] = hy; this.head[q * 3 + 2] = hz;
        this.tail[q * 3] = tx; this.tail[q * 3 + 1] = ty; this.tail[q * 3 + 2] = tz;
        this.w[q] = w;
        this.col[q * 4] = this.c[i * 3]; this.col[q * 4 + 1] = this.c[i * 3 + 1]; this.col[q * 4 + 2] = this.c[i * 3 + 2]; this.col[q * 4 + 3] = Math.min(1, k * 1.6);
      }
    }
    const A = this.geo.attributes;
    A.position.needsUpdate = A.tail.needsUpdate = A.col.needsUpdate = A.wid.needsUpdate = true;
  }
}


// Ribbon trail that follows a weapon's blade (base → tip) for a short time.
export class Trail {
  constructor(scene, color, n = 14) {
    this.n = n; this.pts = []; this.scene = scene;
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(n * 2 * 3); this.col = new Float32Array(n * 2 * 4);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    const idx = []; for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    g.setIndex(idx);
    this.c = new THREE.Color(color);
    this.mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 6;
    scene.add(this.mesh);
    this.geo = g; this.fade = 0;
  }
  push(base, tip, active) {
    if (active) { this.pts.unshift([base.x, base.y, base.z, tip.x, tip.y, tip.z]); this.fade = 1; }
    else { this.fade = Math.max(0, this.fade - 0.12); if (this.pts.length) this.pts.pop(); }
    if (this.pts.length > this.n) this.pts.length = this.n;
    const L = this.pts.length;
    for (let i = 0; i < this.n; i++) {
      const p = this.pts[Math.min(i, L - 1)] || [0, -99, 0, 0, -99, 0];
      this.pos.set(p, i * 6);
      const a = L ? Math.max(0, 1 - i / Math.max(1, L - 1)) * this.fade : 0;
      for (const k of [0, 1]) { const o = (i * 2 + k) * 4; this.col[o] = this.c.r; this.col[o + 1] = this.c.g; this.col[o + 2] = this.c.b; this.col[o + 3] = a * (k ? 0.95 : 0.15); }
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.color.needsUpdate = true;
    this.mesh.visible = L > 1 && this.fade > 0;
  }
  dispose() { this.scene.remove(this.mesh); this.geo.dispose(); }
}

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
    this.S = new Streaks(scene);
    this.decalGeo = new THREE.PlaneGeometry(2, 2); this.decalGeo.rotateX(-Math.PI / 2);
    this.capsule = new THREE.CapsuleGeometry(0.32, 1.05, 4, 10); this.capsule.translate(0, 0.85, 0);
    this.beamGeo = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true); this.beamGeo.translate(0, 0.5, 0);
    this.domeGeo = new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2);
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

  // ---------- new skill visuals ----------
  // rotating rune circle on the ground
  runeDecal(pos, r, color, dur = 0.7, spin = 2, y = 0.05) {
    const m = new THREE.Mesh(this.decalGeo, addMat(color, 1)); m.material.map = runeTex();
    m.position.set(pos[0], pos[1] + y, pos[2]); m.renderOrder = 4;
    this.temp(m, dur, (k) => { const g = Math.min(1, k / 0.18); m.scale.setScalar(r * (0.6 + 0.4 * (1 - Math.pow(1 - g, 3)))); m.rotation.y = this.time * spin; m.material.opacity = (k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4); });
    return m;
  }
  pillar(pos, color, r = 0.8, h = 14, dur = 0.8) {
    const g = new THREE.Group(); g.position.set(...pos);
    const outer = new THREE.Mesh(this.beamGeo, addMat(color, 0.9)); outer.material.map = beamTex(); outer.material.side = THREE.DoubleSide;
    const inner = new THREE.Mesh(this.beamGeo, addMat('#ffffff', 1)); inner.material.map = beamTex(); inner.material.side = THREE.DoubleSide;
    g.add(outer, inner);
    this.temp(g, dur, (k) => { const w = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85; outer.scale.set(r * (0.4 + w * 0.6), h * (0.6 + k * 0.5), r * (0.4 + w * 0.6)); inner.scale.set(r * 0.3 * w, h * (0.6 + k * 0.5), r * 0.3 * w); outer.material.opacity = 0.8 * w; inner.material.opacity = w; outer.rotation.y = this.time * 3; });
  }
  // casting flourish under the caster
  castCircle(pos, color, ult = false) {
    this.runeDecal(pos, ult ? 3.4 : 1.6, color, ult ? 1.3 : 0.6, ult ? 1.2 : 3.5);
    if (ult) {
      this.runeDecal(pos, 2.0, '#ffffff', 1.0, -2.5, 0.07);
      this.pillar(pos, color, 1.1, 16, 1.0);
      this.ring(pos, 5, color, 0.7);
      for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; this.P.emit([pos[0] + Math.cos(a) * 2.6, pos[1] + 0.2, pos[2] + Math.sin(a) * 2.6], { c: color, c2: '#ffffff', sp: 0.3, v: [-Math.cos(a) * 3, 4 + Math.random() * 3, -Math.sin(a) * 3], s: 0.2, life: 0.9, drag: 1 }); }
      this.flash(pos, color, 60, 0.6, 18);
    } else {
      for (let i = 0; i < 14; i++) { const a = Math.random() * Math.PI * 2; this.P.emit([pos[0] + Math.cos(a) * 0.9, pos[1] + 0.1, pos[2] + Math.sin(a) * 0.9], { c: color, c2: '#ffffff', sp: 0.2, up: 2.5, s: 0.12, life: 0.6, drag: 1 }); }
    }
  }
  // energy silhouette left behind by fast movement
  ghost(pos, yaw, color, dur = 0.35, op = 0.6) {
    const mat = fresnelMat(color, 1.6, 0.08);
    const m = new THREE.Mesh(this.capsule, mat); m.position.set(...pos); m.rotation.y = yaw; m.scale.set(1, 1, 0.75);
    this.temp(m, dur, (k) => { mat.uniforms.op.value = op * (1 - k); m.scale.set(1 + k * 0.15, 1 - k * 0.1, 0.75); });
  }
  dust(pos, r = 1.2, n = 24, color = '#8a7a6a') {
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; this.P.emit([pos[0] + Math.cos(a) * 0.3, pos[1] + 0.1, pos[2] + Math.sin(a) * 0.3], { c: color, c2: '#d8ccbc', sp: 0.2, v: [Math.cos(a) * r * 3, 0.6, Math.sin(a) * r * 3], s: 0.4, s1: 0.8, life: 0.55, a: 0.35, drag: 3.5 }); }
  }
  implode(pos, color, r = 1.6) {
    for (let i = 0; i < 36; i++) {
      const a = Math.random() * Math.PI * 2, b = (Math.random() - 0.3) * 1.4;
      const q = [pos[0] + Math.cos(a) * r, pos[1] + b, pos[2] + Math.sin(a) * r];
      this.S.spark(q, [(pos[0] - q[0]) * 5, (pos[1] - q[1]) * 5, (pos[2] - q[2]) * 5], { c: color, len: 0.05, w: 0.03, life: 0.2, g: 0 });
    }
    this.sphereFlash(pos, 0.9, color, 0.25);
  }
  burstSparks(pos, color, n = 16, sp = 9, w = 0.035, up = 1) {
    for (let i = 0; i < n; i++) {
      let x = Math.random() - 0.5, y = Math.random() - 0.5 + up * 0.3, z = Math.random() - 0.5; const l = Math.hypot(x, y, z) || 1;
      const v = sp * (0.5 + Math.random() * 0.7) / l;
      this.S.spark(pos, [x * v, y * v, z * v], { c: color, len: 0.03, w, life: 0.22 + Math.random() * 0.15, g: 9 });
    }
  }
  hitSpark(pos, dir, color, big = false) {
    const n = big ? 18 : 9;
    for (let i = 0; i < n; i++) {
      const v = [dir[0] * 4 + (Math.random() - 0.5) * 9, dir[1] * 4 + (Math.random() - 0.2) * 7, dir[2] * 4 + (Math.random() - 0.5) * 9];
      this.S.spark(pos, v, { c: Math.random() < 0.4 ? '#ffffff' : color, len: 0.035, w: big ? 0.035 : 0.025, life: 0.18 + Math.random() * 0.12, g: 10 });
    }
    const f = new THREE.Mesh(this.decalGeo, addMat(color, 1)); f.material.map = glowTex();
    f.position.set(...pos); f.quaternion.copy(this._camQ || f.quaternion); f.rotateX(Math.PI / 2);
    this.temp(f, 0.12, (k) => { f.scale.setScalar((big ? 0.7 : 0.45) * (0.6 + k)); f.material.opacity = 1 - k; });
  }
  line(a, b, color, w = 0.08, life = 0.35) { this.S.seg(a, b, { c: color, w, life }); this.S.seg(a, b, { c: '#ffffff', w: w * 0.35, life: life * 0.8 }); }

  // continuous emitters
  trail(look, p, v) {
    const L = LOOK[look]; if (!L) return;
    switch (L.trail) {
      case 'fire': this.P.emit(p, { n: 2, c: '#ff3a0a', c2: '#ffd27a', sp: 0.6, s: 0.35, s1: 0.05, life: 0.4, up: 0.8 }); break;
      case 'frost': this.P.emit(p, { n: 1, c: '#5fc8ff', c2: '#ffffff', sp: 0.2, s: 0.12, life: 0.35 }); break;
      case 'soul': this.P.emit(p, { n: 2, c: '#1aff8a', c2: '#e0fff0', sp: 0.4, s: 0.2, life: 0.5 }); break;
      case 'blood': this.P.emit(p, { n: 2, c: '#a0001a', c2: '#ff5a7a', sp: 0.4, s: 0.16, life: 0.4, g: 4 }); break;
      case 'soul2': break;
      case 'poison': this.P.emit(p, { n: 1, c: '#4a8a10', c2: '#c8ff7a', sp: 0.3, s: 0.18, life: 0.6 }); break;
      case 'void': this.P.emit(p, { n: 2, c: '#3a0a8a', c2: '#c8a0ff', sp: 0.5, s: 0.4, life: 0.5 }); break;
      case 'star': this.P.emit(p, { n: 1, c: '#7a9aff', c2: '#ffffff', sp: 0.5, s: 0.14, life: 0.6 }); break;
      case 'spark': this.P.emit(p, { n: 2, c: '#5fb8ff', c2: '#ffffff', sp: 1.5, s: 0.1, life: 0.25 }); break;
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
        if (pr.look === 'axe') {
          const ax = new THREE.Group();
          const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.05, 6), new THREE.MeshStandardMaterial({ color: '#8a8a90', metalness: 0.8, roughness: 0.3, emissive: '#ff6a1a', emissiveIntensity: 0.4 }));
          hd.scale.set(0.55, 1, 0.75); hd.position.x = 0.2; ax.add(hd);
          const hf = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 5), new THREE.MeshStandardMaterial({ color: '#3a2a1e' })); hf.rotation.z = Math.PI / 2; ax.add(hf);
          m.add(ax); m.userData.axe = ax; core.visible = false;
        }
        if (pr.look === 'lance') {
          const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 5), addMat('#bfe8ff', 1)); sp.rotation.x = Math.PI / 2; m.add(sp);
          const tp = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 4), addMat('#ffffff', 1)); tp.rotation.x = -Math.PI / 2; tp.position.z = -1.0; m.add(tp);
        }
        const halo = new THREE.Mesh(this.decalGeo, addMat(L.c, 0.7)); halo.material.map = glowTex(); halo.scale.setScalar((L.s || 0.2) * 3.2); m.add(halo); m.userData.halo = halo;
        if (pr.look === 'void') { const sh = new THREE.Mesh(this.sphere, new THREE.MeshBasicMaterial({ color: '#05010a' })); sh.scale.setScalar(L.s * 0.6); m.add(sh); }
        m.userData.look = pr.look;
        this.scene.add(m); this.projMeshes.set(pr.id, m);
      }
      const lp = m.userData.lp;
      if (lp) {
        const w = Math.max(0.05, (L.s || 0.15) * 1.1);
        if (Math.hypot(pr.pos[0] - lp[0], pr.pos[1] - lp[1], pr.pos[2] - lp[2]) < 8) { this.S.seg(lp, [...pr.pos], { c: L.c, w, life: 0.22 }); this.S.seg(lp, [...pr.pos], { c: L.c2, w: w * 0.35, life: 0.12 }); }
      }
      m.userData.lp = [...pr.pos];
      m.position.set(pr.pos[0], pr.pos[1], pr.pos[2]);
      if (m.userData.halo && this._camQ) { m.userData.halo.quaternion.copy(m.quaternion).invert().multiply(this._camQ); m.userData.halo.rotateX(Math.PI / 2); }
      if (m.userData.axe) m.userData.axe.rotation.y += dt * 22;
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
          const look = z.look;
          const trailLook = ['sparkpath', 'bloodmist', 'fireground', 'icepath', 'petals', 'smoke', 'decoy'].includes(look);
          const ring = new THREE.Mesh(this.ringGeo, addMat(col, trailLook ? 0.0 : 0.85)); ring.rotation.x = -Math.PI / 2; ring.scale.setScalar(z.r); v.g.add(ring); v.ring = ring;
          if (!trailLook && look !== 'trap' && look !== 'mine') {
            const dec = new THREE.Mesh(this.decalGeo, addMat(col, 0.55)); dec.material.map = runeTex(); dec.scale.setScalar(z.r); dec.position.y = 0.02; dec.renderOrder = 4; v.g.add(dec); v.dec = dec;
            const glow = new THREE.Mesh(this.decalGeo, addMat(col, 0.35)); glow.material.map = glowTex(); glow.scale.setScalar(z.r * 1.1); glow.position.y = 0.01; v.g.add(glow);
          } else if (look === 'fireground' || look === 'bloodmist' || look === 'sparkpath' || look === 'icepath') {
            const glow = new THREE.Mesh(this.decalGeo, addMat(col, look === 'icepath' ? 0.5 : 0.7)); glow.material.map = glowTex(); glow.scale.setScalar(z.r * 1.2); glow.position.y = 0.03; v.g.add(glow); v.glow = glow;
          }
          if (z.delay > 0) { const tel = new THREE.Mesh(this.discGeo, addMat(col, 0.3)); tel.rotation.x = -Math.PI / 2; tel.position.y = 0.04; v.g.add(tel); v.tel = tel; }
          if (look === 'sanctum' || look === 'bloodfeast' || look === 'runecircle' || look === 'cauldron' || look === 'moonzone' || look === 'constellation') {
            v.fres = fresnelMat(col, 2.4, 0.02);
            const dome = new THREE.Mesh(this.domeGeo, v.fres); dome.scale.set(z.r, z.r * 0.6, z.r); v.g.add(dome); v.dome = dome;
          }
          if (look === 'pillar' || look === 'sanctum' || look === 'hellgate') {
            const b = new THREE.Mesh(this.beamGeo, addMat(col, 0.35)); b.material.map = beamTex(); b.scale.set(z.r * 0.9, 7, z.r * 0.9); v.g.add(b); v.beam = b;
          }
          if (look === 'storm' || look === 'starfall' || look === 'blizzard') {
            const cloud = new THREE.Mesh(this.discGeo, new THREE.MeshBasicMaterial({ color: look === 'storm' ? '#1a1f30' : '#202840', transparent: true, opacity: 0.55, depthWrite: false })); cloud.rotation.x = Math.PI / 2; cloud.position.y = 9; cloud.scale.setScalar(z.r * 1.1); v.g.add(cloud);
            const swirl = new THREE.Mesh(this.decalGeo, addMat(col, 0.5)); swirl.material.map = runeTex(); swirl.rotation.x = Math.PI; swirl.position.y = 8.9; swirl.scale.setScalar(z.r * 0.9); v.g.add(swirl); v.swirl = swirl;
          }
          if (look === 'meteor') {
            const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1), new THREE.MeshStandardMaterial({ color: '#2a1a10', emissive: '#ff4a0a', emissiveIntensity: 1.6, flatShading: true }));
            v.g.add(rock); v.rock = rock;
          }
          if (look === 'whirl') {
            for (let i = 0; i < 3; i++) { const bl = new THREE.Mesh(new THREE.RingGeometry(z.r * 0.75, z.r * 0.95, 32, 1, i * 2.1, 1.3), addMat(col, 0.35)); bl.material.side = THREE.DoubleSide; bl.rotation.x = -Math.PI / 2; bl.position.y = 0.45; v.g.add(bl); (v.blades = v.blades || []).push(bl); }
          }
          if (look === 'smoke') {
            v.smoke = [];
            for (let i = 0; i < 9; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex(), color: '#5a6270', transparent: true, opacity: 0.0, depthWrite: false })); const a = i / 9 * Math.PI * 2, d = z.r * (0.2 + Math.random() * 0.6); sp.position.set(Math.cos(a) * d, 0.8 + Math.random() * 1.2, Math.sin(a) * d); sp.scale.setScalar(2.6 + Math.random() * 1.5); sp.userData.rot = (Math.random() - 0.5); v.g.add(sp); v.smoke.push(sp); }
          }
          if (look === 'decoy') {
            v.fres = fresnelMat(col, 1.4, 0.15);
            const gh = new THREE.Mesh(this.capsule, v.fres); gh.scale.set(1, 1, 0.75); v.g.add(gh); v.ghost = gh;
          }
          if (look === 'icepath') {
            for (let i = 0; i < 5; i++) { const sh = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6 + Math.random() * 0.5, 4), new THREE.MeshStandardMaterial({ color: '#cfefff', emissive: '#5ac8ff', emissiveIntensity: 0.7, transparent: true, opacity: 0.85, flatShading: true })); const a = Math.random() * 6.28, d = Math.random() * z.r * 0.8; sh.position.set(Math.cos(a) * d, 0.2, Math.sin(a) * d); sh.rotation.set((Math.random() - 0.5) * 0.8, 0, (Math.random() - 0.5) * 0.8); v.g.add(sh); }
          }
          if (look === 'trap' || look === 'mine') {
            const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.08, 8), new THREE.MeshStandardMaterial({ color: '#3a3a40', metalness: 0.8, roughness: 0.35 })); plate.position.y = 0.04; v.g.add(plate);
            const led = new THREE.Mesh(this.sphere, addMat(col, 1)); led.scale.setScalar(0.07); led.position.y = 0.12; v.g.add(led); v.led = led;
            if (look === 'trap') for (let i = 0; i < 8; i++) { const s2 = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 4), new THREE.MeshStandardMaterial({ color: '#c8d0d8', metalness: 0.9, roughness: 0.2 })); const a = i / 8 * Math.PI * 2; s2.position.set(Math.cos(a) * 0.42, 0.16, Math.sin(a) * 0.42); s2.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); v.g.add(s2); }
          }
        }
        this.scene.add(v.g); this.zoneVis.set(z.id, v);
      }
      v.g.position.set(z.pos[0], z.pos[1] + 0.05, z.pos[2]);
      v.g.rotation.y = z.w ? -z.yaw : 0;
      if (z.w) v.g.rotation.y = z.yaw;
      if (v.ring) v.ring.rotation.z += dt * 0.6;
      if (v.dec) { v.dec.rotation.y += dt * 0.5; v.dec.material.opacity = 0.45 + Math.sin(this.time * 3 + z.id) * 0.1; }
      if (v.swirl) v.swirl.rotation.z += dt * 0.8;
      if (v.blades) v.blades.forEach((bl, i) => { bl.rotation.z = this.time * 9 + i * 2.1; });
      if (v.smoke) for (const sp of v.smoke) { sp.material.opacity = Math.min(0.75, z.t * 1.5) * Math.min(1, Math.max(0, (z.dur + z.delay - z.t) * 1.2)); sp.material.rotation += sp.userData.rot * dt; sp.position.y += dt * 0.05; }
      if (v.led) v.led.material.opacity = (Math.sin(this.time * (z.look === 'mine' ? 10 : 4)) > 0 ? 1 : 0.15) * (z.t > z.delay ? 1 : 0.4);
      if (v.ghost) { v.ghost.rotation.y = z.yaw; const kk = Math.min(1, z.t / Math.max(0.01, z.delay)); v.fres.uniforms.op.value = 0.6 + Math.sin(this.time * (8 + kk * 20)) * 0.3; v.ghost.scale.set(1 + kk * 0.15, 1, 0.75 + kk * 0.1); }
      if (v.glow) v.glow.material.opacity = (z.look === 'icepath' ? 0.4 : 0.6) * Math.min(1, Math.max(0, (z.dur + z.delay - z.t) * 1.5));
      if (v.beam) v.beam.material.opacity = 0.2 + Math.sin(this.time * 4) * 0.08;
      if (v.rock) { const kk = Math.min(1, z.t / Math.max(0.01, z.delay)); v.rock.visible = z.t < z.delay; v.rock.position.set(6 * (1 - kk), 22 * (1 - kk) + 0.5, -3 * (1 - kk)); v.rock.rotation.x += dt * 3; v.rock.rotation.z += dt * 2; if (v.rock.visible) this.P.emit([z.pos[0] + v.rock.position.x, z.pos[1] + v.rock.position.y, z.pos[2] + v.rock.position.z], { n: 3, c: '#ff3a0a', c2: '#ffd27a', sp: 0.8, s: 0.9, s1: 0.2, life: 0.5 }); }
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
        case 'fireground': if (Math.random() < 0.7) this.P.emit(rp(), { c: '#ff3a0a', c2: '#ffd27a', sp: 0.3, up: 2.6, s: 0.45, s1: 0.05, life: 0.55, drag: 0.6 }); break;
        case 'bloodmist': if (Math.random() < 0.5) this.P.emit(rp(), { c: '#6a0010', c2: '#ff4a6a', sp: 0.3, up: 0.5, s: 0.8, s1: 1.2, life: 1, a: 0.35, drag: 0.6 }); break;
        case 'sparkpath': if (Math.random() < 0.25) { const a1 = rp(), a2 = rp(); a1[1] += 0.2; a2[1] += 0.4; this.bolt(a1, a2, '#8fd8ff', 0.02, 0.08, 0.3); } break;
        case 'petals': if (Math.random() < 0.6) { const q = rp(); q[1] += Math.random() * 1.4; const a = this.time * 3; this.P.emit(q, { c: '#ff6ab0', c2: '#ffe0f0', sp: 0.4, v: [Math.cos(a) * 1.5, 0.5, Math.sin(a) * 1.5], s: 0.14, life: 0.9, drag: 0.4, g: 0.6 }); } break;
        case 'icepath': if (Math.random() < 0.15) this.P.emit(rp(), { c: '#9fe8ff', c2: '#ffffff', sp: 0.2, up: 0.8, s: 0.1, life: 0.8 }); break;
        case 'decoy': if (Math.random() < 0.4) this.P.emit([p[0] + (Math.random() - 0.5) * 0.6, p[1] + Math.random() * 1.8, p[2] + (Math.random() - 0.5) * 0.6], { c: '#ff9ce8', c2: '#ffffff', sp: 0.3, up: 0.6, s: 0.1, life: 0.5 }); break;
      }
    }
  }

  // ---------- event effects ----------
  handle(e, ctx) {
    const P = this.P;
    switch (e.fx) {
      case 'beam': {
        const L = LOOK[e.look] || LOOK.lightning;
        if (e.look === 'bullet' || e.look === 'silver' || e.look === 'runebullet') { this.ray(e.from, e.to, L.c, e.look === 'bullet' ? 0.012 : 0.025, 0.09); P.emit(e.to, { n: 6, c: '#ffcf6a', c2: '#ffffff', sp: 4, s: 0.08, life: 0.2 }); break; }
        if (e.look === 'execution') { this.ray(e.from, e.to, L.c, 0.12, 0.35); this.flash(e.to, L.c, 40, 0.3, 10); break; }
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
        this.burstSparks(e.pos, L.c2, 24, e.r * 5, 0.05); this.ring([e.pos[0], e.pos[1] - 0.4, e.pos[2]], e.r * 1.3, L.c, 0.45); this.dust([e.pos[0], e.pos[1] - 0.4, e.pos[2]], e.r * 0.6, 16);
        P.emit(e.pos, { n: 40, c: L.c, c2: L.c2, sp: e.r * 3.2, s: 0.4, s1: 0.05, life: 0.6, drag: 3 });
        if (e.look === 'flask') P.emit(e.pos, { n: 18, c: '#3a6a10', c2: '#c8ff7a', sp: 1.5, up: 0.8, s: 1.0, s1: 1.4, life: 1.4, a: 0.35 });
        this.flash(e.pos, L.c, 40, 0.3, e.r * 5);
        ctx?.shake?.(e.pos, 0.25);
        break;
      }
      case 'impact': {
        const L = LOOK[e.look] || LOOK.soul;
        P.emit(e.pos, { n: 10, c: L.c, c2: L.c2, sp: 3, s: 0.15, life: 0.3 });
        this.burstSparks(e.pos, L.c, 8, 6, 0.025);
        break;
      }
      case 'swing': break; // handled by renderer for attacker
      case 'deadeye': this.ring(e.pos, 3, e.color || '#ffcf6a', 0.5); this.flash(e.pos, '#ffcf6a', 30, 0.3); break;
      case 'puppet': this.ring(e.pos, e.r, '#ff7ac0', 0.7); for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; P.emit([e.pos[0] + Math.cos(a) * e.r * 0.7, e.pos[1] + 4, e.pos[2] + Math.sin(a) * e.r * 0.7], { c: '#ff7ac0', c2: '#ffffff', sp: 0.2, v: [0, -6, 0], s: 0.1, life: 0.6, drag: 0 }); } break;
      case 'frostnova': this.ring(e.pos, e.r, '#a8e8ff', 0.7); this.ring(e.pos, e.r * 0.6, '#ffffff', 0.5); P.emit([e.pos[0], e.pos[1] + 0.5, e.pos[2]], { n: 120, c: '#5fc8ff', c2: '#ffffff', sp: e.r * 2.6, s: 0.25, life: 0.8, drag: 2 }); this.flash(e.pos, '#a8e8ff', 50, 0.4, 18); ctx?.shake?.(e.pos, 0.5); break;
      case 'wave': {
        for (let i = 0; i < 80; i++) { const a = e.yaw + (Math.random() - 0.5) * (e.angle * Math.PI / 180); const sp = 10 + Math.random() * 8; P.emit([e.pos[0], e.pos[1] + 0.6 + Math.random(), e.pos[2]], { c: '#1a8aaa', c2: '#e0fff8', sp: 0.5, v: [-Math.sin(a) * sp, 2, -Math.cos(a) * sp], s: 0.6, s1: 1.1, life: 0.6, drag: 1.2, g: 6 }); }
        ctx?.shake?.(e.pos, 0.6); break;
      }
      case 'crit': this.burstSparks(e.pos, '#ff3a8a', 20, 10, 0.04); P.emit(e.pos, { n: 22, c: '#ff2a6a', c2: '#ffffff', sp: 5, s: 0.18, life: 0.4 }); this.sphereFlash(e.pos, 0.8, '#ff3a8a', 0.2); break;
      case 'burst': this.dust(e.pos, 1.6, 26); this.ghost(e.pos, 0, e.color || '#ff7a1a', 0.4, 0.7); this.ring(e.pos, 3.2, e.color || '#ff7a1a', 0.4); P.emit([e.pos[0], e.pos[1] + 0.3, e.pos[2]], { n: 30, c: e.color || '#ff5a1a', c2: '#ffe0a0', sp: 6, s: 0.35, life: 0.45, drag: 4 }); this.flash(e.pos, e.color || '#ff7a1a', 25, 0.25); break;
      case 'blink': {
        const c = e.color || '#b06cff';
        const a = [e.pos[0], e.pos[1] + 1, e.pos[2]];
        this.implode(a, c, 1.4); this.ghost(e.pos, 0, c, 0.45, 0.8);
        P.emit(a, { n: 30, c, c2: '#ffffff', sp: 2.5, s: 0.25, life: 0.5, spread: [0.3, 0.8, 0.3] });
        if (e.to) { const b = [e.to[0], e.to[1] + 1, e.to[2]]; this.line(a, b, c, 0.09, 0.3); this.burstSparks(b, c, 18, 7); this.sphereFlash(b, 1.1, c, 0.3); this.runeDecal(e.to, 1.3, c, 0.5, 4); this.flash(b, c, 25, 0.25); }
        break;
      }
      case 'swap': { const c = e.color || '#9a5cff'; this.line(e.from, e.to, c, 0.12, 0.45); this.bolt(e.from, e.to, c, 0.04, 0.3, 0.8); this.implode(e.from, c); this.implode(e.to, c); this.flash(e.to, c, 35, 0.3); ctx?.shake?.(e.to, 0.3); break; }
      case 'warp': { const c = e.color || '#8fd8ff'; this.bolt(e.from, e.to, c, 0.06, 0.25, 1.0); this.bolt(e.from, e.to, '#ffffff', 0.025, 0.2, 0.6); this.ghost([e.from[0], e.from[1] - 1, e.from[2]], 0, c, 0.5, 0.9); this.burstSparks(e.to, c, 26, 10); this.ring([e.to[0], e.to[1] - 1, e.to[2]], 3.5, c, 0.4); this.flash(e.to, c, 45, 0.3, 14); ctx?.shake?.(e.to, 0.35); break; }
      case 'recall': {
        const c = e.color || '#5fd4ff';
        this.ghost(e.from, 0, c, 0.6, 0.9);
        for (let i = 0; i <= 8; i++) { const k = i / 8; this.ghost([e.from[0] + (e.to[0] - e.from[0]) * k, e.from[1] + (e.to[1] - e.from[1]) * k, e.from[2] + (e.to[2] - e.from[2]) * k], 0, c, 0.25 + k * 0.4, 0.25 + k * 0.35); }
        this.runeDecal(e.to, 2.2, c, 0.8, -3); this.ring(e.to, 2.6, c, 0.5);
        P.emit([e.to[0], e.to[1] + 1, e.to[2]], { n: 40, c, c2: '#ffffff', sp: 3, s: 0.18, life: 0.6, spread: [0.3, 0.8, 0.3] });
        break;
      }
      case 'slam': this.runeDecal(e.pos, e.r, e.color || '#ff3b3b', 0.7, 2); this.dust(e.pos, e.r * 0.6, 30); this.burstSparks([e.pos[0], e.pos[1] + 0.3, e.pos[2]], e.color || '#ffbb88', 24, e.r * 3, 0.05, 2); this.ring(e.pos, e.r, e.color || '#ff3b3b', 0.55); this.ring(e.pos, e.r * 0.6, '#ffffff', 0.35); P.emit([e.pos[0], e.pos[1] + 0.2, e.pos[2]], { n: 50, c: '#6a5a4a', c2: e.color || '#ffbb88', sp: e.r * 2, up: 3, s: 0.35, life: 0.7, g: 9, drag: 1.5 }); this.flash(e.pos, e.color || '#ff3b3b', 40, 0.3, 14); ctx?.shake?.(e.pos, 0.5); break;
      case 'shock': this.ring(e.pos, e.r, e.color || '#ccc', 0.5); P.emit([e.pos[0], e.pos[1] + 0.2, e.pos[2]], { n: 40, c: '#7a6a5a', c2: '#ddd', sp: e.r * 2, up: 2.5, s: 0.35, life: 0.6, g: 7 }); ctx?.shake?.(e.pos, 0.35); break;
      case 'healwave': this.runeDecal(e.pos, e.r, e.color || '#58ffb0', 0.8, 1.5); this.pillar(e.pos, e.color || '#58ffb0', 0.6, 6, 0.6); this.ring(e.pos, e.r, e.color || '#58ffb0', 0.6); this.ring(e.pos, e.r * 0.7, '#ffffff', 0.45); P.emit([e.pos[0], e.pos[1] + 0.5, e.pos[2]], { n: 40, c: e.color || '#58ffb0', c2: '#ffffff', sp: e.r * 1.2, up: 1.5, s: 0.2, life: 0.8, drag: 2 }); break;
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
        } else if (e.look === 'roots' || e.look === 'web' || e.look === 'icecage') {
          if (e.look === 'icecage') { for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const sp = new THREE.Mesh(new THREE.ConeGeometry(0.2, 2.2, 4), new THREE.MeshStandardMaterial({ color: '#bfefff', emissive: '#5ac8ff', emissiveIntensity: 0.8, transparent: true, opacity: 0.85, flatShading: true })); sp.position.set(e.pos[0] + Math.cos(a) * e.r * 0.8, e.pos[1] + 0.9, e.pos[2] + Math.sin(a) * e.r * 0.8); sp.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); this.temp(sp, 1.6, (k) => { sp.scale.set(1, k < 0.1 ? k / 0.1 : (k > 0.8 ? (1 - k) / 0.2 : 1), 1); }); } this.ring(e.pos, e.r, '#a8e8ff', 0.5); this.flash(e.pos, '#a8e8ff', 30, 0.3); break; }
          if (e.look === 'web') { for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; this.bolt([e.pos[0], e.pos[1] + 0.1, e.pos[2]], [e.pos[0] + Math.cos(a) * e.r, e.pos[1] + 0.1, e.pos[2] + Math.sin(a) * e.r], '#ff7ac0', 0.02, 1.2, 0.1); } this.ring(e.pos, e.r, '#ff7ac0', 0.6); break; }
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

  muzzle(pos, dir, color = '#ffcf6a', big = false) {
    this.P.emit(pos, { n: big ? 14 : 7, c: '#ff8a2a', c2: '#fff6d8', sp: big ? 3 : 1.6, v: [dir[0] * 4, dir[1] * 4, dir[2] * 4], s: big ? 0.3 : 0.16, s1: 0.02, life: 0.12, drag: 6 });
    this.flash(pos, color, big ? 22 : 10, 0.06, 6);
  }
  flameCone(pos, dir) {
    for (let i = 0; i < 6; i++) {
      const sp = 9 + Math.random() * 5, j = () => (Math.random() - 0.5) * 2.2;
      this.P.emit(pos, { c: '#ff3a0a', c2: '#ffe08a', sp: 0.3, v: [dir[0] * sp + j(), dir[1] * sp + j() * 0.5 + 0.6, dir[2] * sp + j()], s: 0.35, s1: 0.9, life: 0.45, drag: 2.2 });
    }
  }

  deathFx(pos, color) {
    this.P.emit([pos[0], pos[1] + 1, pos[2]], { n: 60, c: '#1a1020', c2: color || '#ff3b3b', sp: 2.5, up: 1.5, s: 0.4, s1: 0.05, life: 1.4, drag: 1.2, spread: [0.3, 0.7, 0.3] });
    this.flash(pos, color || '#ff3b3b', 20, 0.4);
  }

  ambient(dt, kind = 'ash') {
    if (kind === 'snow') { for (let i = 0; i < 3; i++) if (Math.random() < dt * 60) this.P.emit([(Math.random() - 0.5) * HALF_X * 2, 6 + Math.random() * 5, (Math.random() - 0.5) * HALF_Z * 2], { c: '#dfe8f4', c2: '#ffffff', sp: 0.2, v: [0.6, -1.2, 0.3], s: 0.09, life: 7, drag: 0, a: 0.8 }); return; }
    if (kind === 'embers') { for (let i = 0; i < 2; i++) if (Math.random() < dt * 50) this.P.emit([(Math.random() - 0.5) * HALF_X * 2, Math.random() * 2, (Math.random() - 0.5) * HALF_Z * 2], { c: '#ff4a0a', c2: '#ffd27a', sp: 0.3, v: [0.2, 1.2, 0.1], s: 0.08, life: 4, drag: 0, a: 1 }); return; }
    if (kind === 'spores') { if (Math.random() < dt * 40) this.P.emit([(Math.random() - 0.5) * HALF_X * 2, Math.random() * 4, (Math.random() - 0.5) * HALF_Z * 2], { c: '#6aff4a', c2: '#e8ffc8', sp: 0.2, v: [0.1, 0.25, 0.1], s: 0.07, life: 6, drag: 0, a: 0.8 }); return; }
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
    this.S.update(dt);
    for (const v of this.zoneVis.values()) if (v.fres) v.fres.uniforms.time.value = this.time;
    this.temps = this.temps.filter(t => {
      t.t += dt;
      const k = Math.min(1, t.t / t.dur);
      t.update?.(k);
      if (k >= 1) { this.scene.remove(t.obj); t.obj.traverse?.(o => { if (o.geometry && o.geometry !== this.ringGeo && o.geometry !== this.sphere && o.geometry !== this.discGeo && o.geometry !== this.decalGeo && o.geometry !== this.capsule && o.geometry !== this.beamGeo && o.geometry !== this.domeGeo) o.geometry.dispose(); }); return false; }
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
