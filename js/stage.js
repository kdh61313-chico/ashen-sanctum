import * as THREE from 'three';
import { skinFx } from './skins.js';
import { buildHero, animateHero, triggerAttack, M, G, add, grp, GLOW } from './models.js';
import { makeTextures } from './world.js';
import { FX } from './fx.js';

// Hero-select altar: the hero stands on a ritual dais in a dark nave.
export class Stage {
  constructor() {
    const s = this.scene = new THREE.Scene();
    s.background = new THREE.Color('#0c0a10');
    s.fog = new THREE.Fog('#0c0a10', 9, 26);
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    this.camBase = new THREE.Vector3(0, 1.55, 7.2);
    this.camLook = new THREE.Vector3(0, 1.15, 0);
    this.t = 0; this.rotY = 0.35; this.rotV = 0; this.drag = false;
    const T = makeTextures();

    s.add(new THREE.HemisphereLight('#8a80c0', '#2a1a14', 1.1));
    const key = new THREE.DirectionalLight('#ffe2c0', 2.6); key.position.set(3, 6, 5); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -4; key.shadow.camera.right = 4; key.shadow.camera.top = 5; key.shadow.camera.bottom = -2; key.shadow.bias = -0.002;
    s.add(key);
    this.rim = new THREE.DirectionalLight('#b3262e', 4); this.rim.position.set(-3, 4, -5); s.add(this.rim);
    this.rim2 = new THREE.PointLight('#b3262e', 18, 10, 1.6); this.rim2.position.set(0, 3, -3); s.add(this.rim2);
    this.fill = new THREE.PointLight('#ff8a3a', 8, 9, 1.8); this.fill.position.set(2.6, 1.6, 1.8); s.add(this.fill);

    // floor & dais
    const ft = T.floor.clone(); ft.needsUpdate = true; ft.repeat.set(6, 6);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 32), new THREE.MeshStandardMaterial({ map: ft, color: '#6a625a', roughness: 0.95 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; s.add(floor);
    const stone = M('#3a3438', { r: 0.95 });
    add(s, G.cyl(2.1, 2.3, 0.3, 8), stone, [0, 0.15, 0]);
    add(s, G.cyl(1.7, 1.9, 0.18, 8), M('#2a2528'), [0, 0.39, 0]);
    this.daisY = 0.48;
    const runeMat = new THREE.MeshBasicMaterial({ map: T.runes, transparent: true, color: '#b3262e', blending: THREE.AdditiveBlending, depthWrite: false });
    this.runeMat = runeMat;
    const rune = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), runeMat); rune.rotation.x = -Math.PI / 2; rune.position.y = this.daisY + 0.01; s.add(rune); this.rune = rune;
    const outer = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), runeMat.clone()); outer.material.opacity = 0.35; outer.rotation.x = -Math.PI / 2; outer.position.y = 0.02; s.add(outer); this.outer = outer;

    // gothic arch behind
    const dark = M('#18141b', { r: 1 });
    const arch = grp(s, [0, 0, -4.2]);
    add(arch, G.box(1.1, 7, 1.1), dark, [-2.6, 3.5, 0]);
    add(arch, G.box(1.1, 7, 1.1), dark, [2.6, 3.5, 0]);
    add(arch, G.tor(2.6, 0.5, 4, 16, Math.PI), dark, [0, 7, 0]);
    this.window = add(arch, G.box(3.2, 6, 0.1), M('#0a0608', { e: '#b3262e', ei: 0.22 }), [0, 3.6, -0.3]);
    this.windowTop = add(arch, G.cyl(1.6, 1.6, 0.1, 16, 1), M('#0a0608', { e: '#b3262e', ei: 0.55 }), [0, 6.6, -0.3], [Math.PI / 2, 0, 0]);
    for (let i = 0; i < 5; i++) add(arch, G.box(0.1, 6.4, 0.14), dark, [-1.2 + i * 0.6, 3.6, -0.22]);
    for (let j = 0; j < 4; j++) add(arch, G.box(3.4, 0.1, 0.14), dark, [0, 1.6 + j * 1.5, -0.22]);
    add(arch, G.tor(1.0, 0.07, 3, 18), dark, [0, 6.6, -0.22]);
    // side pillars
    for (const x of [-5.5, 5.5]) { const p = grp(s, [x, 0, -2.5]); add(p, G.cyl(0.45, 0.55, 8, 8), dark, [0, 4, 0]); }
    // braziers
    this.braziers = [];
    for (const x of [-2.9, 2.9]) {
      const g = grp(s, [x, 0, 0.6]);
      for (let i = 0; i < 3; i++) add(g, G.cyl(0.035, 0.045, 1.1, 4), M('#2a2420', { m: 0.6 }), [Math.cos(i * 2.09) * 0.22, 0.5, Math.sin(i * 2.09) * 0.22], [Math.sin(i * 2.09) * 0.25, 0, -Math.cos(i * 2.09) * 0.25]);
      add(g, G.cyl(0.42, 0.24, 0.3, 8), M('#2e2824', { m: 0.7, r: 0.5 }), [0, 1.1, 0]);
      add(g, G.cyl(0.36, 0.36, 0.04, 8), GLOW('#ff7a1a', 2.5), [0, 1.24, 0]);
      this.braziers.push([x, 1.3, 0.6]);
      const pl = new THREE.PointLight('#ff8a3a', 10, 7, 1.8); pl.position.set(x, 1.8, 0.6); s.add(pl);
      this.braziers[this.braziers.length - 1].light = pl;
    }
    // candles on floor
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2, r = 2.6 + Math.random() * 0.5;
      if (Math.abs(Math.sin(a)) > 0.85 && Math.cos(a) > 0) continue;
      const h = 0.12 + Math.random() * 0.25;
      add(s, G.cyl(0.035, 0.04, h, 6), M('#d8cfb8'), [Math.cos(a) * r, h / 2, Math.sin(a) * r]);
      add(s, G.cone(0.022, 0.06, 4), GLOW('#ffb347', 3), [Math.cos(a) * r, h + 0.03, Math.sin(a) * r]);
    }
    this.fx = new FX(s);
    this.hero = null;
  }

  resize(w, h, pr) {
    this.camera.aspect = w / h;
    // keep hero centred but leave room for the panels on wide screens
    this.camera.fov = w / h < 1.3 ? 44 : 34;
    this.camera.updateProjectionMatrix();
    this.fx.setScale(h * pr, this.camera.fov);
  }

  setHero(def, burst = true, skin = null) {
    if (this.hero) this.scene.remove(this.hero.root);
    const P = buildHero(def, skin);
    P.root.position.y = this.daisY;
    P.root.traverse(o => { if (o.isMesh) { o.castShadow = !o.userData.skinFx; } });
    this.scene.add(P.root);
    this.hero = P;
    const c = new THREE.Color(def.color);
    this.rim.color.copy(c); this.rim2.color.copy(c);
    const rc = c.clone().lerp(new THREE.Color('#8a3a22'), 0.55).multiplyScalar(0.8); this.runeMat.color.copy(rc); this.outer.material.color.copy(rc);
    this.window.material = M('#0a0608', { e: def.color, ei: 0.2 });
    this.windowTop.material = this.window.material;
    if (burst) {
      this.fx.P.emit([0, this.daisY + 1, 0], { n: 70, c: def.color, c2: '#ffffff', sp: 3, up: 1, s: 0.18, life: 0.9, drag: 2, spread: [0.3, 0.9, 0.3] });
      this.fx.ring([0, this.daisY, 0], 2.2, def.color, 0.7);
      this.fx.flash([0, this.daisY + 1.5, 1], def.color, 40, 0.5, 8);
      triggerAttack(P, 'q');
    }
  }

  attackPreview() { if (this.hero) triggerAttack(this.hero, 'lmb'); }

  pointer(dx) { this.rotV = dx * 0.012; this.rotY += dx * 0.01; }

  update(dt, focus = 0) {
    this.t += dt;
    if (!this.drag) { this.rotV *= 0.94; this.rotY += this.rotV + dt * 0.12; }
    if (this.hero) {
      this.hero.root.rotation.y = this.rotY;
      animateHero(this.hero, { speed: 0, onGround: true, alive: true, t: this.t, pitch: -0.05 }, dt);
    }
    this.rune.rotation.z = this.t * 0.15;
    this.outer.rotation.z = -this.t * 0.05;
    this.runeMat.opacity = 0.42 + Math.sin(this.t * 1.5) * 0.08;
    for (const b of this.braziers) {
      if (Math.random() < dt * 45) this.fx.P.emit([b[0] + (Math.random() - 0.5) * 0.3, b[1], b[2] + (Math.random() - 0.5) * 0.3], { c: '#ff3a0a', c2: '#ffd27a', sp: 0.25, up: 1.8, s: 0.4, s1: 0.04, life: 0.6, drag: 0.5 });
      b.light.intensity = 9 + Math.sin(this.t * 12 + b[0]) * 1.5;
    }
    if (Math.random() < dt * 14) this.fx.P.emit([(Math.random() - 0.5) * 8, Math.random() * 3, (Math.random() - 0.5) * 5], { c: '#ff4a0a', c2: '#ffb347', sp: 0.1, v: [0.1, 0.35, 0], s: 0.04, life: 4, drag: 0, a: 0.8 });
    if (this.hero && Math.random() < dt * 10) {
      const a = Math.random() * Math.PI * 2;
      this.fx.P.emit([Math.cos(a) * 1.4, this.daisY + 0.05, Math.sin(a) * 1.4], { c: this.hero.def.color, c2: '#ffffff', sp: 0.05, v: [0, 0.6, 0], s: 0.08, life: 1.6, drag: 0 });
    }
    this.fx.update(dt);
    const cb = this.camBase;
    const zoom = focus; // 0 full body, 1 face
    const h = this.hero ? (this.hero.spec.h || 1) : 1;
    this.camera.position.set(cb.x + Math.sin(this.t * 0.3) * 0.08, cb.y + (0.75 * h) * zoom + Math.sin(this.t * 0.4) * 0.04, cb.z - 4.4 * zoom);
    this.camLook.set(0, 1.15 + (0.95 * h) * zoom, 0);
    this.camera.lookAt(this.camLook);
  }
}

// Render a bust portrait of every hero. Returns {id: dataURL}
export function renderPortraits(heroes, size = 160) {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setSize(size, Math.round(size * 1.12));
  r.toneMapping = THREE.ACESFilmicToneMapping; r.outputColorSpace = THREE.SRGBColorSpace;
  const out = {};
  for (const def of heroes) {
    const s = new THREE.Scene();
    s.add(new THREE.HemisphereLight('#b8b0e0', '#3a2a24', 1.6));
    const k = new THREE.DirectionalLight('#ffe8d0', 3); k.position.set(2, 3, 4); s.add(k);
    const rim = new THREE.DirectionalLight(def.color, 5); rim.position.set(-3, 2, -3); s.add(rim);
    const P = buildHero(def);
    animateHero(P, { speed: 0, onGround: true, alive: true, t: 0.4 }, 0.016);
    s.add(P.root);
    P.root.rotation.y = 0.35;
    P.root.updateMatrixWorld(true);
    const hp = new THREE.Vector3(); P.head.getWorldPosition(hp);
    const cam = new THREE.PerspectiveCamera(30, 1 / 1.12, 0.05, 20);
    cam.position.set(hp.x + 0.3, hp.y + 0.02, hp.z + 1.35);
    cam.lookAt(hp.x, hp.y - 0.08, hp.z);
    // backdrop gradient
    const bg = document.createElement('canvas'); bg.width = 4; bg.height = 64;
    const g = bg.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 64);
    gr.addColorStop(0, '#2a2330'); gr.addColorStop(1, '#120e14'); g.fillStyle = gr; g.fillRect(0, 0, 4, 64);
    s.background = new THREE.CanvasTexture(bg);
    r.render(s, cam);
    out[def.id] = r.domElement.toDataURL('image/png');
  }
  r.dispose();
  r.forceContextLoss?.();
  return out;
}

// Full-body splash art for the recruit reveal (transparent background, cached).
const splashCache = new Map();
let splashR = null;
export function renderSplash(def, w = 520, h = 760, skin = null) {
  const key = def.id + (skin || '');
  if (splashCache.has(key)) return splashCache.get(key);
  if (!splashR) { splashR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); splashR.toneMapping = THREE.ACESFilmicToneMapping; splashR.outputColorSpace = THREE.SRGBColorSpace; }
  const r = splashR; r.setSize(w, h); r.setClearColor(0x000000, 0);
  const s = new THREE.Scene();
  s.add(new THREE.HemisphereLight('#c8c0e8', '#3a2a24', 1.5));
  const k = new THREE.DirectionalLight('#ffe8d0', 3.2); k.position.set(2.5, 3, 4); s.add(k);
  const rc = (skin && skinFx(skin)?.c) || def.color;
  const rim = new THREE.DirectionalLight(rc, 7); rim.position.set(-3, 2.5, -2.5); s.add(rim);
  const rim2 = new THREE.DirectionalLight(rc, 3); rim2.position.set(3, 1, -3); s.add(rim2);
  const P = buildHero(def, skin);
  for (let i = 0; i < 4; i++) animateHero(P, { speed: 0, onGround: true, alive: true, t: 0.6 + i * 0.016 }, 0.016);
  for (const f of P.update) { try { f(1.2, {}); } catch (e) { } }
  s.add(P.root);
  P.root.rotation.y = 0.45;
  P.root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(P.root);
  const c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  const cam = new THREE.PerspectiveCamera(26, w / h, 0.05, 40);
  const dist = (Math.max(size.y * 1.08, size.x * h / w) / 2) / Math.tan(13 * Math.PI / 180);
  cam.position.set(c.x + dist * 0.12, c.y + size.y * 0.06, c.z + dist);
  cam.lookAt(c.x, c.y, c.z);
  r.render(s, cam);
  const url = r.domElement.toDataURL('image/png');
  splashCache.set(key, url);
  P.root.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  return url;
}

// Upper-body cut-outs for story scenes: transparent background, lit from the front-left.
export function renderBusts(heroes, w = 360, h = 480) {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setSize(w, h); r.setClearColor(0x000000, 0);
  r.toneMapping = THREE.ACESFilmicToneMapping; r.outputColorSpace = THREE.SRGBColorSpace;
  const out = {};
  for (const def of heroes) {
    const s = new THREE.Scene();
    s.add(new THREE.HemisphereLight('#c8c0d8', '#1a1416', 0.9));
    const k = new THREE.DirectionalLight('#ffe8cc', 2.1); k.position.set(-2.5, 2.5, 3); s.add(k);
    const fill = new THREE.DirectionalLight('#8a90c0', 0.5); fill.position.set(3, 0.5, 2); s.add(fill);
    const rim = new THREE.DirectionalLight(def.color, 5); rim.position.set(3, 2, -3); s.add(rim);
    const P = buildHero(def);
    animateHero(P, { speed: 0, onGround: true, alive: true, t: 1.2 }, 0.016);
    s.add(P.root);
    P.root.rotation.y = -0.25;
    P.root.updateMatrixWorld(true);
    const hp = new THREE.Vector3(); P.head.getWorldPosition(hp);
    const sc = def.scale || 1;
    const cam = new THREE.PerspectiveCamera(26, w / h, 0.05, 30);
    cam.position.set(hp.x - 0.25 * sc, hp.y - 0.3 * sc, hp.z + 3.1 * sc);
    cam.lookAt(hp.x, hp.y - 0.42 * sc, hp.z);
    r.render(s, cam);
    out[def.id] = r.domElement.toDataURL('image/png');
  }
  r.dispose(); r.forceContextLoss?.();
  return out;
}
