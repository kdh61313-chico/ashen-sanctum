import * as THREE from 'three';
import { HALF_X, HALF_Z, getMap } from './map.js';
import { M, G, add, grp, GLOW } from './models.js';

// ---------- procedural textures ----------
function canvasTex(w, h, draw, repeat = [1, 1]) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function rnd(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

const FLOORS = {
  flag(g, w, h) {
    const r = rnd(7);
    g.fillStyle = '#26221f'; g.fillRect(0, 0, w, h);
    const n = 8, s = w / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const off = (y % 2) * s * 0.5;
      const v = 52 + r() * 26;
      g.fillStyle = `rgb(${v + 6},${v},${v - 6})`;
      g.fillRect(x * s + off + 3, y * s + 3, s - 6, s - 6);
      if (x === 0 && off) g.fillRect(off - s + 3, y * s + 3, s - 6, s - 6);
      for (let k = 0; k < 18; k++) { g.fillStyle = `rgba(0,0,0,${r() * 0.12})`; g.fillRect(x * s + off + r() * s, y * s + r() * s, 2 + r() * 8, 2 + r() * 8); }
      if (r() < 0.3) { g.strokeStyle = 'rgba(10,8,6,0.6)'; g.lineWidth = 1.5; g.beginPath(); const sx = x * s + off + r() * s, sy = y * s + r() * s; g.moveTo(sx, sy); g.lineTo(sx + (r() - 0.5) * s * 0.8, sy + (r() - 0.5) * s * 0.8); g.stroke(); }
      if (r() < 0.12) { g.fillStyle = 'rgba(70,90,50,0.35)'; g.fillRect(x * s + off, y * s + s - 8, s * 0.6, 6); }
    }
  },
  snow(g, w, h) {
    const r = rnd(5);
    g.fillStyle = '#c8d2de'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const v = 190 + r() * 60; g.fillStyle = `rgba(${v},${v + 4},${v + 10},${0.25 + r() * 0.3})`; const s = 2 + r() * 14; g.beginPath(); g.arc(r() * w, r() * h, s, 0, 7); g.fill(); }
    for (let i = 0; i < 18; i++) { g.fillStyle = 'rgba(70,80,96,0.35)'; g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 30, 6 + r() * 14, r() * 3, 0, 7); g.fill(); }
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(120,130,150,0.25)'; g.beginPath(); g.ellipse(r() * w, r() * h, 4, 7, r() * 3, 0, 7); g.fill(); }
  },
  forge(g, w, h) {
    const r = rnd(9);
    g.fillStyle = '#1c1816'; g.fillRect(0, 0, w, h);
    const n = 4, s = w / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const v = 44 + r() * 16;
      g.fillStyle = `rgb(${v + 6},${v + 2},${v})`; g.fillRect(x * s + 3, y * s + 3, s - 6, s - 6);
      g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(x * s + 3, y * s + 3, s - 6, 4);
      g.fillStyle = '#2a2624'; for (const [a, b] of [[10, 10], [s - 14, 10], [10, s - 14], [s - 14, s - 14]]) { g.beginPath(); g.arc(x * s + a + 2, y * s + b + 2, 4, 0, 7); g.fill(); }
      for (let k = 0; k < 20; k++) { g.fillStyle = `rgba(0,0,0,${r() * 0.2})`; g.fillRect(x * s + r() * s, y * s + r() * s, 3 + r() * 16, 2 + r() * 6); }
    }
    g.strokeStyle = 'rgba(255,110,30,0.55)'; g.lineWidth = 2; g.shadowColor = '#ff6a1a'; g.shadowBlur = 8;
    for (let i = 0; i < 6; i++) { g.beginPath(); let px = r() * w, py = r() * h; g.moveTo(px, py); for (let k = 0; k < 5; k++) { px += (r() - 0.5) * 60; py += (r() - 0.5) * 60; g.lineTo(px, py); } g.stroke(); }
  },
  moss(g, w, h) {
    FLOORS.flag(g, w, h);
    const r = rnd(13);
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${50 + r() * 30},${80 + r() * 40},${40 + r() * 20},${0.3 + r() * 0.4})`; g.beginPath(); g.ellipse(r() * w, r() * h, 8 + r() * 40, 6 + r() * 26, r() * 3, 0, 7); g.fill(); }
  },
};
function bricks(g, w, h) {
  const r = rnd(3);
  g.fillStyle = '#3a3532'; g.fillRect(0, 0, w, h);
  const rows = 8, bh = h / rows;
  for (let y = 0; y < rows; y++) {
    const bw = w / 4, off = (y % 2) * bw / 2;
    for (let x = -1; x < 5; x++) {
      const v = 92 + r() * 34;
      g.fillStyle = `rgb(${v + 4},${v},${v - 3})`;
      g.fillRect(x * bw + off + 2, y * bh + 2, bw - 4, bh - 4);
      g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(x * bw + off + 2, y * bh + 2, bw - 4, 3);
      g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x * bw + off + 2, y * bh + bh - 6, bw - 4, 4);
    }
  }
  for (let k = 0; k < 120; k++) { g.fillStyle = `rgba(0,0,0,${r() * 0.15})`; g.fillRect(r() * w, r() * h, 3 + r() * 10, 2 + r() * 6); }
}
function planks(g, w, h) {
  const r = rnd(21);
  g.fillStyle = '#2a1c12'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 6; i++) { const v = 120 + r() * 35; g.fillStyle = `rgb(${v},${v * 0.66},${v * 0.4})`; g.fillRect(2, i * h / 6 + 2, w - 4, h / 6 - 4); for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(r() * w, i * h / 6 + r() * h / 6, 20 + r() * 40, 1.5); } }
  g.strokeStyle = '#1a120c'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8); g.beginPath(); g.moveTo(4, 4); g.lineTo(w - 4, h - 4); g.stroke();
}
function runes(g, w, h) {
  g.clearRect(0, 0, w, h);
  g.strokeStyle = '#fff'; g.lineWidth = 6; g.lineCap = 'round';
  const r = rnd(11);
  g.beginPath(); g.arc(w / 2, h / 2, w * 0.46, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 3; g.beginPath(); g.arc(w / 2, h / 2, w * 0.4, 0, Math.PI * 2); g.stroke();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const cx = w / 2 + Math.cos(a) * w * 0.43, cy = h / 2 + Math.sin(a) * h * 0.43;
    g.save(); g.translate(cx, cy); g.rotate(a + Math.PI / 2); g.beginPath();
    const k = (r() * 4) | 0;
    g.moveTo(0, -10); g.lineTo(0, 10);
    if (k === 0) { g.moveTo(0, -4); g.lineTo(6, -9); }
    if (k === 1) { g.moveTo(-6, 0); g.lineTo(6, 6); }
    if (k === 2) { g.moveTo(0, 2); g.lineTo(-6, -6); g.moveTo(0, 2); g.lineTo(6, -6); }
    if (k === 3) { g.moveTo(-5, -8); g.lineTo(5, 8); }
    g.stroke(); g.restore();
  }
  g.lineWidth = 4; g.beginPath();
  for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * (Math.PI * 4 / 5); const x = w / 2 + Math.cos(a) * w * 0.36, y = h / 2 + Math.sin(a) * h * 0.36; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
  g.stroke();
}

const texCache = {};
export function makeTextures(floor = 'flag') {
  if (!texCache.brick) {
    texCache.brick = canvasTex(256, 256, bricks);
    texCache.runes = canvasTex(512, 512, runes);
    texCache.planks = canvasTex(128, 128, planks);
  }
  if (!texCache['f_' + floor]) texCache['f_' + floor] = canvasTex(512, 512, FLOORS[floor] || FLOORS.flag, [14, 10]);
  return { floor: texCache['f_' + floor], brick: texCache.brick, runes: texCache.runes, planks: texCache.planks };
}
function boxTex(tex, sx, sy) { const t = tex.clone(); t.needsUpdate = true; t.repeat.set(Math.max(1, sx / 2.5), Math.max(1, sy / 2.5)); return t; }

const LAVA_VS = `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
const NOISE = `float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);} float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}`;

// ---------- world ----------
export function buildWorld(scene, quality = 'high', mapId = 'sanctum') {
  const map = getMap(mapId);
  const th = map.theme;
  const T = makeTextures(th.floor);
  const root = new THREE.Group();
  scene.add(root);
  const upd = [];
  const lightSpots = [];

  scene.background = new THREE.Color(th.sky[0]);
  scene.fog = new THREE.FogExp2(th.fog[0], th.fog[1]);

  // sky dome
  const md = new THREE.Vector3(...th.moon).normalize();
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { t: { value: 0 }, top: { value: new THREE.Color(th.sky[0]) }, mid: { value: new THREE.Color(th.sky[1]) }, hor: { value: new THREE.Color(th.sky[2]) }, md: { value: md }, snow: { value: th.particles === 'snow' || th.particles === 'embers' ? 1 : th.particles === 'spores' ? 0.5 : 0 } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec3 vP; uniform float t; uniform vec3 top, mid, hor, md; uniform float snow;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
      void main(){
        float y = vP.y;
        vec3 c = mix(hor, mid, smoothstep(-0.02, 0.2, y));
        c = mix(c, top, smoothstep(0.18, 0.75, y));
        float m = max(dot(vP, md), 0.);
        c += vec3(0.6,0.62,0.8) * pow(m, 80.) * 0.8 + mid * pow(m, 6.) * 0.5;
        vec2 sp = vec2(atan(vP.z, vP.x)*260., vP.y*520.);
        float s = h(floor(sp));
        c += vec3(0.9,0.9,1.) * step(0.992, s) * smoothstep(0.08, 0.4, y) * (0.6 + 0.4*sin(t*2. + s*50.)) * (1.0 - snow*0.7);
        c += hor * exp(-abs(y-0.03)*28.) * 0.5;
        gl_FragColor = vec4(c,1.);
      }`,
  });
  root.add(new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), skyMat));
  upd.push((t) => { skyMat.uniforms.t.value = t; });
  const moon = new THREE.Mesh(new THREE.CircleGeometry(th.particles === 'embers' ? 20 : 14, 24), new THREE.MeshBasicMaterial({ color: th.particles === 'embers' ? '#ff8a4a' : '#dfe6ff', fog: false }));
  moon.position.copy(md).multiplyScalar(260); moon.lookAt(0, 0, 0); root.add(moon);

  // lights
  root.add(new THREE.HemisphereLight(th.hemi[0], th.hemi[1], th.hemi[2]));
  root.add(new THREE.AmbientLight(th.amb[0], th.amb[1]));
  const sun = new THREE.DirectionalLight(th.sun[0], th.sun[1]);
  sun.position.set(...th.sun[2]);
  sun.castShadow = quality !== 'low';
  const sm = quality === 'high' ? 2048 : 1024;
  sun.shadow.mapSize.set(sm, sm);
  const sc = sun.shadow.camera; sc.left = -45; sc.right = 45; sc.top = 40; sc.bottom = -40; sc.near = 1; sc.far = 160;
  sun.shadow.bias = -0.0012; sun.shadow.normalBias = 0.08;
  root.add(sun); root.add(sun.target);
  const rim = new THREE.DirectionalLight(th.rim[0], th.rim[1]); rim.position.set(40, 12, 50); root.add(rim);
  const fill = new THREE.DirectionalLight(th.hemi[0], 0.9); fill.position.set(-th.sun[2][0], 18, -th.sun[2][2]); root.add(fill);
  const fill2 = new THREE.DirectionalLight(th.hemi[0], 0.5); fill2.position.set(th.sun[2][2], 10, -th.sun[2][0]); root.add(fill2);

  // ground
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALF_X * 2, HALF_Z * 2), new THREE.MeshStandardMaterial({ map: T.floor, roughness: th.floor === 'snow' ? 0.75 : 0.92, metalness: th.floor === 'forge' ? 0.3 : 0.02, color: th.floorTint }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; root.add(floor);
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: th.floor === 'snow' ? '#5a6474' : '#141015', roughness: 1 }));
  outer.rotation.x = -Math.PI / 2; outer.position.y = -0.02; root.add(outer);

  // rune circles (center + spawns)
  const runeMat = new THREE.MeshBasicMaterial({ map: T.runes, transparent: true, color: th.accent, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8, fog: false });
  if (mapId === 'sanctum') {
    const rc = new THREE.Mesh(new THREE.PlaneGeometry(15, 15), runeMat); rc.rotation.x = -Math.PI / 2; rc.position.y = 0.03; root.add(rc);
    const rt = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), runeMat.clone()); rt.material.color.set('#ff5a2a'); rt.rotation.x = -Math.PI / 2; rt.position.y = 1.21; root.add(rt);
    upd.push((t) => { rc.rotation.z = t * 0.05; rt.rotation.z = -t * 0.12; runeMat.opacity = 0.55 + Math.sin(t * 1.3) * 0.2; });
  }
  for (const [x, col] of [[-29, '#4fe0d0'], [29, '#ff3b4b']]) {
    const m = runeMat.clone(); m.color.set(col); m.opacity = 0.5;
    const s = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), m);
    s.rotation.x = -Math.PI / 2; s.position.set(x, 0.03, 0); root.add(s);
    upd.push((t) => { s.rotation.z = t * 0.08 * Math.sign(x); });
  }

  // hazards
  for (const hz of map.hazards) {
    const w = hz.max[0] - hz.min[0], d = hz.max[1] - hz.min[1];
    const cx = (hz.min[0] + hz.max[0]) / 2, cz = (hz.min[1] + hz.max[1]) / 2;
    if (hz.kind === 'lava') {
      const mat = new THREE.ShaderMaterial({
        uniforms: { t: { value: 0 } }, vertexShader: LAVA_VS,
        fragmentShader: `${NOISE} uniform float t; varying vec3 vW;
          void main(){ vec2 p = vW.xz*0.35; float f = fbm(p + vec2(0., t*0.25)) + 0.5*fbm(p*2.3 - vec2(t*0.15, 0.));
          vec3 c = mix(vec3(0.35,0.03,0.0), vec3(1.0,0.45,0.05), smoothstep(0.45, 1.0, f)); c += vec3(1.,0.85,0.4)*smoothstep(0.95,1.2,f);
          gl_FragColor = vec4(c*1.6, 1.); }`,
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -Math.PI / 2; m.position.set(cx, 0.04, cz); root.add(m);
      upd.push((t) => { mat.uniforms.t.value = t; });
      for (const s of [-1, 1]) add(root, G.box(0.3, 0.25, d), M('#2a2220', { r: 0.9 }), [cx + s * (w / 2 + 0.15), 0.12, cz]);
      lightSpots.push({ pos: [cx, 1.2, cz], color: '#ff5a1a', i: 16, d: 12, flick: true });
    } else if (hz.kind === 'water') {
      const mat = new THREE.ShaderMaterial({
        transparent: true, uniforms: { t: { value: 0 } }, vertexShader: LAVA_VS,
        fragmentShader: `${NOISE} uniform float t; varying vec3 vW;
          void main(){ vec2 p = vW.xz*0.5; float f = fbm(p + vec2(t*0.1, t*0.07)); float r = smoothstep(0.55,0.6,fbm(p*3.0 - t*0.2));
          vec3 c = mix(vec3(0.05,0.12,0.09), vec3(0.18,0.32,0.22), f) + vec3(0.4,0.6,0.45)*r*0.35;
          gl_FragColor = vec4(c, 0.82); }`,
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -Math.PI / 2; m.position.set(cx, 0.09, cz); root.add(m);
      upd.push((t) => { mat.uniforms.t.value = t; });
    }
  }

  // colliders → meshes
  const wallTint = th.wallTint;
  const stoneMat = (sx, sy, tint = wallTint) => new THREE.MeshStandardMaterial({ map: boxTex(T.brick, sx, sy), color: tint, roughness: 0.95, flatShading: true });
  const snowCap = th.floor === 'snow', mossCap = th.floor === 'moss';
  const cap = (cx, top, cz, sx, sz) => {
    if (snowCap) add(root, G.box(sx + 0.08, 0.16, sz + 0.08), M('#eef4fa', { r: 0.7 }), [cx, top + 0.06, cz]);
    if (mossCap) add(root, G.box(sx + 0.06, 0.1, sz + 0.06), M('#4a6a34', { r: 1 }), [cx, top + 0.03, cz]);
  };
  for (const b of map.boxes) {
    const sx = b.max[0] - b.min[0], sy = b.max[1] - b.min[1], sz = b.max[2] - b.min[2];
    const cx = (b.min[0] + b.max[0]) / 2, cy = (b.min[1] + b.max[1]) / 2, cz = (b.min[2] + b.max[2]) / 2;
    let mesh = null;
    switch (b.kind) {
      case 'pillar': {
        const g = grp(root, [cx, b.min[1], cz]);
        const r = Math.min(sx, sz) / 2;
        add(g, G.cyl(r * 1.25, r * 1.35, 0.4, 8), M('#4a4440'), [0, 0.2, 0]);
        const broken = sy < 5;
        add(g, G.cyl(r * 0.95, r, sy - (broken ? 0.3 : 0.9), 8), M(th.floor === 'snow' ? '#7a8494' : '#5c5550', { r: 0.95 }), [0, (sy - (broken ? 0.3 : 0.9)) / 2 + 0.3, 0]);
        if (!broken) add(g, G.cyl(r * 1.35, r * 1.0, 0.5, 8), M('#4a4440'), [0, sy - 0.25, 0]);
        else for (let i = 0; i < 4; i++) add(g, G.cone(r * 0.45, 0.5 + (i % 2) * 0.3, 4), M('#5c5550'), [Math.cos(i * 1.6) * r * 0.5, sy, Math.sin(i * 1.6) * r * 0.5], [0, i, 0.1]);
        if (Math.abs(cx) < 5 && Math.abs(cz) < 5) add(g, G.box(0.06, sy * 0.6, 0.06), GLOW(th.accent, 1.4), [0, sy * 0.5, r * 0.98]);
        cap(cx, b.max[1], cz, sx, sz);
        break;
      }
      case 'obelisk': {
        const g = grp(root, [cx, b.min[1], cz]);
        add(g, G.cyl(0.5, 0.75, sy - 0.5, 4), M('#2a2628', { r: 0.8, m: 0.2 }), [0, (sy - 0.5) / 2, 0], [0, Math.PI / 4, 0]);
        add(g, G.cone(0.5, 0.9, 4), M('#2a2628'), [0, sy - 0.1, 0], [0.2, Math.PI / 4, 0.15]);
        for (let i = 0; i < 4; i++) add(g, G.box(0.06, sy * 0.55, 0.04), GLOW('#ff3030', 2.2), [Math.sin(i * Math.PI / 2) * 0.62, sy * 0.4, Math.cos(i * Math.PI / 2) * 0.62], [0, i * Math.PI / 2, 0]);
        const core = add(g, G.oct(0.35), GLOW('#ff2a2a', 3), [0, sy + 1.0, 0]);
        upd.push((t) => { core.rotation.y = t; core.position.y = sy + 1.0 + Math.sin(t * 1.5) * 0.2; });
        lightSpots.push({ pos: [cx, b.max[1] + 1.6, cz], color: '#ff3a2a', i: 18, d: 16 });
        break;
      }
      case 'crypt': {
        mesh = new THREE.Mesh(G.box(sx, sy, sz), stoneMat(sx, sy, '#8a94a4'));
        const g = grp(root, [cx, b.max[1], cz]);
        const roof = add(g, G.cyl(0.01, sz * 0.75, sx + 0.6, 3), M('#4a5464', { r: 0.8 }), [0, 0.8, 0]);
        roof.rotation.set(0, 0, Math.PI / 2); roof.scale.set(1, 1, 0.62);
        add(g, G.box(sx + 0.7, 0.18, sz + 0.5), M('#e8eef6'), [0, 0.05, 0]);
        for (const s of [-1, 1]) {
          add(root, G.box(1.4, 2.6, 0.12), M('#0a0c10', { e: th.accent, ei: 0.4 }), [cx, 1.3, cz + s * (sz / 2 + 0.02)]);
          add(root, G.cone(0.7, 0.8, 4), M('#0a0c10', { e: th.accent, ei: 0.4 }), [cx, 2.9, cz + s * (sz / 2 + 0.02)], [0, Math.PI / 4, 0], [1, 1, 0.1]);
          add(root, G.tor(0.45, 0.06, 4, 16), GLOW(th.accent, 1.6), [cx, 3.5, cz + s * (sz / 2 + 0.06)]);
        }
        lightSpots.push({ pos: [cx, 1.5, cz + sz / 2 + 1.5], color: th.accent, i: 10, d: 10 });
        break;
      }
      case 'grave': {
        const gm = new THREE.Mesh(G.box(sx, sy * 0.85, sz), M('#6a7080', { r: 1 }));
        gm.position.set(cx, b.min[1] + sy * 0.425, cz); gm.castShadow = true; root.add(gm);
        add(root, G.cyl(sz / 2, sz / 2, sx, 7), M('#6a7080', { r: 1 }), [cx, b.min[1] + sy * 0.85, cz], [0, 0, Math.PI / 2]);
        cap(cx, b.max[1] - 0.05, cz, sx, sz * 0.8);
        break;
      }
      case 'tomb': {
        mesh = new THREE.Mesh(G.box(sx, sy, sz), stoneMat(sx, sy, '#7a8090'));
        add(root, G.box(sx + 0.2, 0.2, sz + 0.2), M('#5a6070'), [cx, b.max[1] + 0.02, cz]);
        add(root, G.box(sx * 0.3, 0.12, sz * 0.6), M('#8a94a4'), [cx, b.max[1] + 0.18, cz]);
        cap(cx, b.max[1] + 0.12, cz, sx, sz);
        break;
      }
      case 'coffin': {
        mesh = new THREE.Mesh(G.box(sx, sy, sz), M('#4f4a45', { r: 0.9 }));
        add(root, G.box(sx + 0.12, 0.12, sz + 0.12), M('#3c3835'), [cx, b.max[1] - 0.04, cz]);
        break;
      }
      case 'crate': {
        mesh = new THREE.Mesh(G.box(sx, sy, sz), new THREE.MeshStandardMaterial({ map: boxTex(T.planks, sx * 1.2, sy * 1.2), roughness: 0.9, flatShading: true }));
        for (const s of [-1, 1]) add(root, G.box(sx + 0.04, 0.08, 0.08), M('#5a5250', { m: 0.8 }), [cx, b.min[1] + sy * (0.5 + s * 0.38), cz + sz / 2]);
        break;
      }
      case 'anvil': {
        const g = grp(root, [cx, 0, cz]);
        add(g, G.box(sx * 0.55, sy * 0.45, sz * 0.7), M('#2a2624', { m: 0.6, r: 0.5 }), [0, sy * 0.22, 0]);
        add(g, G.box(sx * 0.35, sy * 0.25, sz * 0.4), M('#3a3432', { m: 0.7 }), [0, sy * 0.55, 0]);
        add(g, G.box(sx, sy * 0.3, sz), M('#4a4442', { m: 0.85, r: 0.35 }), [0, sy * 0.85, 0]);
        add(g, G.cone(sz * 0.5, sx * 0.4, 4), M('#4a4442', { m: 0.85, r: 0.35 }), [sx * 0.65, sy * 0.85, 0], [0, 0, -Math.PI / 2], [1, 1, 0.6]);
        add(g, G.box(sx * 0.4, 0.12, 0.5), GLOW('#ff7a1a', 3), [0, sy + 0.05, 0]);
        lightSpots.push({ pos: [cx, sy + 1.4, cz], color: '#ff6a1a', i: 18, d: 13, flick: true });
        break;
      }
      case 'chimney': {
        const g = grp(root, [cx, 0, cz]);
        add(g, G.cyl(sx * 0.55, sx * 0.62, sy, 8), stoneMat(sx * 2, sy, '#6a5a54'), [0, sy / 2, 0]);
        add(g, G.cyl(sx * 0.65, sx * 0.65, 0.4, 8), M('#3a3230'), [0, sy, 0]);
        add(g, G.cyl(sx * 0.45, sx * 0.45, 0.05, 8), GLOW('#ff5a1a', 3), [0, sy + 0.21, 0]);
        add(g, G.box(1.0, 1.0, 0.1), GLOW('#ff6a1a', 2.6), [0, 0.6, (cz > 0 ? -1 : 1) * sz * 0.56]);
        break;
      }
      case 'metal': {
        mesh = new THREE.Mesh(G.box(sx, sy, sz), M('#4a4442', { m: 0.7, r: 0.45 }));
        for (let i = 0; i <= Math.floor(sx / 1.2); i++) add(root, G.cyl(0.04, 0.04, 1.0, 5), M('#2a2624', { m: 0.8 }), [b.min[0] + i * 1.2, b.max[1] + 0.5, b.max[2] - 0.05]);
        add(root, G.box(sx, 0.06, 0.06), M('#2a2624', { m: 0.8 }), [cx, b.max[1] + 1.0, b.max[2] - 0.05]);
        break;
      }
      case 'metalstep': mesh = new THREE.Mesh(G.box(sx, sy, sz), M('#3a3432', { m: 0.7, r: 0.5 })); break;
      case 'trunk': {
        const g = grp(root, [cx, 0, cz]);
        const bark = M('#3a2e22', { r: 1 });
        add(g, G.cyl(sx * 0.45, sx * 0.62, sy, 9), bark, [0, sy / 2, 0], [0, 0, 0.03]);
        for (let i = 0; i < 6; i++) { const a = i * 1.047; add(g, G.cone(0.5, 3.2, 5), bark, [Math.cos(a) * 1.6, 0.6, Math.sin(a) * 1.6], [Math.sin(a) * 1.15, 0, -Math.cos(a) * 1.15]); }
        const leaf = M('#24402a', { r: 1 });
        for (let i = 0; i < 9; i++) { const a = i * 0.7, r = 2.5 + (i % 3) * 2.2; add(g, G.ico(2.4 + (i % 2), 0), leaf, [Math.cos(a) * r, sy + 0.5 + (i % 3), Math.sin(a) * r]); }
        for (let i = 0; i < 14; i++) add(g, G.cyl(0.03, 0.01, 2 + (i % 4), 3), M('#3a5a2a'), [Math.cos(i) * (3 + i % 4), sy - 1.2, Math.sin(i) * (3 + i % 4)]);
        for (let i = 0; i < 8; i++) add(g, G.ico(0.12, 0), GLOW('#9dff6a', 2), [Math.cos(i * 0.8) * 1.6, 1 + i * 0.7, Math.sin(i * 0.8) * 1.6]);
        lightSpots.push({ pos: [0, 4, 3], color: '#9dff6a', i: 10, d: 14 });
        break;
      }
      case 'ruin': mesh = new THREE.Mesh(G.box(sx, sy, sz), stoneMat(sx, sy, '#6a7a60')); cap(cx, b.max[1], cz, sx, sz); break;
      case 'altar':
        mesh = new THREE.Mesh(G.box(sx, sy, sz), new THREE.MeshStandardMaterial({ map: boxTex(T.brick, sx, sy), color: '#6a5d5a', roughness: 0.9, flatShading: true }));
        add(root, G.box(sx + 0.3, 0.15, sz + 0.3), M('#2e2826'), [cx, b.max[1] - 0.05, cz]);
        break;
      case 'wall': {
        mesh = new THREE.Mesh(G.box(sx, sy, sz), stoneMat(Math.max(sx, sz), sy));
        cap(cx, b.max[1], cz, sx, sz);
        if (sy >= 9) {
          const long = sx > sz, L = long ? sx : sz;
          for (let i = 0; i < L / 2.2; i++) {
            const o = -L / 2 + 1.1 + i * 2.2;
            add(root, G.box(long ? 1.2 : sx, 1.1, long ? sz : 1.2), M('#3e3935'), long ? [cx + o, b.max[1] + 0.55, cz] : [cx, b.max[1] + 0.55, cz + o]);
          }
          const glow = th.floor === 'snow' ? '#7ac8ff' : th.floor === 'moss' ? '#9dff6a' : '#ff6a2a';
          for (let i = 0; i < L / 9; i++) {
            const o = -L / 2 + 4.5 + i * 9;
            const inner = long ? (cz > 0 ? -1 : 1) : (cx > 0 ? -1 : 1);
            const p = long ? [cx + o, 6.2, cz + inner * (sz / 2 + 0.01)] : [cx + inner * (sx / 2 + 0.01), 6.2, cz + o];
            add(root, G.box(long ? 0.7 : 0.05, 2.4, long ? 0.05 : 0.7), M('#0a0608', { e: glow, ei: 0.35 }), p);
            add(root, G.cone(0.5, 0.7, 4), M('#0a0608', { e: glow, ei: 0.35 }), [p[0], 7.75, p[2]], [0, Math.PI / 4, 0], long ? [1, 1, 0.07] : [0.07, 1, 1]);
          }
        }
        break;
      }
      case 'lowwall':
        mesh = new THREE.Mesh(G.box(sx, sy, sz), stoneMat(Math.max(sx, sz), sy));
        add(root, G.box(sx + 0.15, 0.12, sz + 0.15), M('#36312d'), [cx, b.max[1] + 0.04, cz]);
        cap(cx, b.max[1] + 0.1, cz, sx, sz);
        break;
      case 'ledge': mesh = new THREE.Mesh(G.box(sx, sy, sz), stoneMat(Math.max(sx, sz), sy)); cap(cx, b.max[1], cz, sx, sz); break;
      case 'rubble': {
        mesh = new THREE.Mesh(G.box(sx, sy, sz), M('#4d4742', { r: 1 }));
        for (let i = 0; i < 5; i++) add(root, G.dodec(0.25 + (i % 3) * 0.12), M('#56504a'), [cx + Math.cos(i * 2.3) * sx * 0.8, 0.2, cz + Math.sin(i * 2.3) * sz * 0.8], [i, i * 2, 0]);
        break;
      }
      default:
        mesh = new THREE.Mesh(G.box(sx, sy, sz), stoneMat(Math.max(sx, sz), sy));
        cap(cx, b.max[1], cz, sx, sz);
    }
    if (mesh) { mesh.position.set(cx, cy, cz); mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh); }
  }

  // ---- distant silhouettes ----
  const silMat = new THREE.MeshBasicMaterial({ color: th.sky[0], fog: false });
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + (i % 3) * 0.04;
    const d = 150 + (i * 37) % 40, h = 25 + (i * 53) % 45;
    const m = new THREE.Mesh(G.cone(20 + (i * 17) % 20, h, 5), silMat);
    m.position.set(Math.cos(a) * d, h / 2 - 4, Math.sin(a) * d); root.add(m);
  }
  const spireMat = new THREE.MeshStandardMaterial({ color: '#1b1720', roughness: 1, flatShading: true });
  const far = grp(root);
  const spires = [[-50, -40, 34], [-60, 10, 26], [48, 36, 30], [62, -18, 22], [0, -55, 40], [10, 58, 28], [-30, 55, 22]];
  for (const [x, z, h] of spires) {
    const g = grp(far, [x, 0, z]);
    if (th.floor === 'snow') { add(g, G.cone(7, h * 1.2, 6), M('#2a3444', { r: 1 }), [0, h * 0.6, 0]); add(g, G.cone(3.5, h * 0.4, 6), M('#e8eef6'), [0, h * 1.05, 0]); continue; }
    if (th.floor === 'moss') { add(g, G.cyl(1.2, 2, h, 6), M('#1a2218', { r: 1 }), [0, h / 2, 0]); add(g, G.ico(8, 0), M('#18281a', { r: 1 }), [0, h, 0]); continue; }
    add(g, G.box(6, h, 6), spireMat, [0, h / 2, 0]);
    add(g, G.cone(4.4, h * 0.45, 4), spireMat, [0, h + h * 0.22, 0], [0, Math.PI / 4, 0]);
    add(g, G.box(1.2, 4, 0.2), M('#0a0810', { e: th.accent, ei: 0.9 }), [0, h * 0.7, 3.05]);
    for (const s of [-1, 1]) add(g, G.box(2.5, h * 0.55, 2.5), spireMat, [s * 4.3, h * 0.27, 0]);
  }
  if (mapId === 'sanctum') {
    const arch = grp(far, [0, 0, -40]);
    add(arch, G.tor(14, 1.6, 4, 16, Math.PI * 0.78), spireMat, [0, 10, 0], [0, 0, 0.35]);
    add(arch, G.box(3.4, 12, 3.4), spireMat, [-13.5, 6, 0]); add(arch, G.box(3.4, 16, 3.4), spireMat, [13.5, 8, 0]);
    add(arch, G.tor(7, 0.25, 3, 24), M('#0a0810', { e: '#ff4a3a', ei: 1.1 }), [0, 18, 0.5]);
    for (let i = 0; i < 8; i++) add(arch, G.box(0.18, 6.6, 0.2), M('#0a0810', { e: '#ff4a3a', ei: 0.8 }), [0, 18, 0.5], [0, 0, i * Math.PI / 8]);
  }
  if (mapId === 'forge') {
    for (const [x, z] of [[-45, 0], [45, 0], [0, 45], [0, -45]]) { const g = grp(far, [x, 0, z]); add(g, G.cone(16, 30, 7), M('#1a0e0a', { r: 1 }), [0, 15, 0]); add(g, G.cyl(4, 5, 1, 7), GLOW('#ff4a0a', 2.5), [0, 29.5, 0]); }
  }
  far.traverse(m => { m.castShadow = false; m.receiveShadow = false; });

  // ---- props ----
  const fires = [];
  for (const p of map.props) {
    const g = grp(root, [p.x, p.y, p.z], [0, p.rot, 0]);
    g.scale.setScalar(p.s);
    switch (p.type) {
      case 'brazier': {
        for (let i = 0; i < 3; i++) add(g, G.cyl(0.04, 0.05, 1.2, 4), M('#2a2420', { m: 0.6 }), [Math.cos(i * 2.09) * 0.25, 0.55, Math.sin(i * 2.09) * 0.25], [Math.sin(i * 2.09) * 0.25, 0, -Math.cos(i * 2.09) * 0.25]);
        add(g, G.cyl(0.5, 0.28, 0.35, 8), M('#2e2824', { m: 0.7, r: 0.5 }), [0, 1.2, 0]);
        add(g, G.cyl(0.42, 0.42, 0.05, 8), GLOW('#ff7a1a', 2.5), [0, 1.36, 0]);
        fires.push([p.x, p.y + 1.45, p.z]); lightSpots.push({ pos: [p.x, p.y + 1.9, p.z], color: '#ff8a3a', i: 14, d: 13, flick: true });
        break;
      }
      case 'lantern': {
        const lc = th.accent === '#ff3b3b' ? '#ffb347' : th.accent;
        add(g, G.cyl(0.06, 0.08, 2.6, 6), M('#1e1a18', { m: 0.6 }), [0, 1.3, 0]);
        add(g, G.box(0.6, 0.05, 0.05), M('#1e1a18'), [0.25, 2.5, 0]);
        add(g, G.cyl(0.12, 0.16, 0.08, 6), M('#2a2420', { m: 0.7 }), [0.5, 2.36, 0]);
        add(g, G.cyl(0.13, 0.13, 0.28, 6), M('#ffffff', { t: true, op: 0.3, e: lc, ei: 1.2 }), [0.5, 2.18, 0]);
        add(g, G.ico(0.07, 0), GLOW(lc, 3.5), [0.5, 2.18, 0]);
        const c = Math.cos(p.rot), s = Math.sin(p.rot);
        lightSpots.push({ pos: [p.x + c * 0.5 * p.s, 2.2, p.z - s * 0.5 * p.s], color: lc, i: 9, d: 10, flick: true });
        break;
      }
      case 'grave': {
        add(g, G.box(0.7, 1.0, 0.18), M('#5a5650', { r: 1 }), [0, 0.5, 0], [0.08, 0, 0.06]);
        add(g, G.cyl(0.35, 0.35, 0.18, 7), M('#5a5650'), [0, 1.0, 0], [Math.PI / 2 + 0.08, 0, 0.06]);
        add(g, G.box(1.0, 0.1, 1.8), M('#2a2620'), [0, 0.05, 0.9]);
        if (snowCap) add(g, G.box(0.74, 0.08, 0.22), M('#eef4fa'), [0, 1.3, 0]);
        break;
      }
      case 'tree': {
        const bark = M('#1e1814', { r: 1 });
        add(g, G.cyl(0.25, 0.45, 4, 5), bark, [0, 2, 0], [0.08, 0, -0.06]);
        const br = (par, len, rad, dep, rx, rz) => { const b = grp(par, [0, len * 0.9, 0], [rx, 0, rz]); add(b, G.cyl(rad * 0.6, rad, len, 4), bark, [0, len / 2, 0]); if (dep > 0) { br(b, len * 0.72, rad * 0.6, dep - 1, 0.5, 0.6); br(b, len * 0.7, rad * 0.6, dep - 1, -0.4, -0.7); } };
        const top = grp(g, [0, 2.4, 0]); br(top, 2.0, 0.22, 2, 0.4, 0.5); br(top, 1.8, 0.2, 2, -0.5, -0.4); br(top, 2.2, 0.2, 1, 0.1, -0.1);
        break;
      }
      case 'pine': {
        add(g, G.cyl(0.18, 0.3, 2, 5), M('#2a1e16'), [0, 1, 0]);
        for (let i = 0; i < 4; i++) { add(g, G.cone(2.2 - i * 0.45, 2.2, 7), M('#1e3428', { r: 1 }), [0, 2.2 + i * 1.3, 0], [0, i, 0]); add(g, G.cone(1.6 - i * 0.35, 0.8, 7), M('#eef4fa', { r: 0.8 }), [0, 2.9 + i * 1.3, 0], [0, i + 0.3, 0]); }
        break;
      }
      case 'willow': {
        add(g, G.cyl(0.3, 0.55, 4, 6), M('#2a2218', { r: 1 }), [0, 2, 0], [0.1, 0, 0]);
        add(g, G.ico(2.6, 0), M('#2a4a2a', { r: 1 }), [0, 5, 0], [0, 0, 0], [1.2, 0.6, 1.2]);
        for (let i = 0; i < 16; i++) { const a = i * 0.39; add(g, G.box(0.08, 2.8, 0.25), M('#3a5a30', { ds: true }), [Math.cos(a) * 2.6, 3.4, Math.sin(a) * 2.6], [0, -a, 0]); }
        break;
      }
      case 'banner': {
        add(g, G.cyl(0.05, 0.05, 2.4, 5), M('#2a2420', { m: 0.6 }), [0, 7.5, 0.3], [0, 0, Math.PI / 2]);
        const col = p.x < 0 ? '#1f5a58' : '#6a1218';
        add(g, G.box(1.6, 5, 0.05), M(col, { r: 0.95 }), [0, 4.9, 0.3]);
        add(g, G.box(0.5, 0.5, 0.06), GLOW(p.x < 0 ? '#4fe0d0' : '#ff3b4b', 1.6), [0, 5.6, 0.31], [0, 0, Math.PI / 4]);
        add(g, G.cone(0.8, 0.8, 3), M(col), [0, 2.2, 0.3], [Math.PI, 0, 0], [1, 1, 0.06]);
        break;
      }
      case 'crystal': case 'ore': {
        const col = p.type === 'ore' ? '#ff9a3a' : (snowCap ? '#7ad8ff' : '#b06cff');
        if (p.type === 'ore') add(g, G.dodec(0.7), M('#2a2420'), [0, 0.3, 0]);
        for (let i = 0; i < 5; i++) add(g, G.cone(0.18 + (i % 3) * 0.06, 0.8 + (i % 4) * 0.35, 5), M('#4a2a6a', { e: col, ei: 1.3, r: 0.2, m: 0.3 }), [Math.cos(i * 1.3) * 0.35, 0.4, Math.sin(i * 1.3) * 0.35], [Math.cos(i) * 0.3, 0, Math.sin(i) * 0.3]);
        lightSpots.push({ pos: [p.x, 1.2, p.z], color: col, i: 6, d: 8 });
        break;
      }
      case 'candles': {
        for (let i = 0; i < 7; i++) { const h = 0.15 + (i % 4) * 0.08; const x = Math.cos(i * 2.4) * 0.3, z = Math.sin(i * 2.4) * 0.3; add(g, G.cyl(0.035, 0.04, h, 6), M('#d8cfb8'), [x, h / 2, z]); add(g, G.cone(0.025, 0.07, 4), GLOW('#ffb347', 3), [x, h + 0.04, z]); }
        break;
      }
      case 'bones': {
        const bone = M('#cfc5a8');
        add(g, G.ico(0.13, 0), bone, [0, 0.1, 0]);
        for (let i = 0; i < 5; i++) add(g, G.cyl(0.03, 0.03, 0.5, 4), bone, [Math.cos(i * 1.7) * 0.4, 0.04, Math.sin(i * 1.7) * 0.4], [Math.PI / 2, i, 0]);
        break;
      }
      case 'statue': case 'angel': {
        const st = M(snowCap ? '#8a94a4' : '#58524c', { r: 1 });
        add(g, G.box(2, 1.2, 2), st, [0, 0.6, 0]);
        add(g, G.cyl(0.5, 0.7, 2.6, 6), st, [0, 2.5, 0]);
        add(g, G.ico(0.4, 0), st, [0, 4.1, 0.1]);
        for (const s of [-1, 1]) add(g, G.cone(1.2, 3.2, 3), st, [s * 0.9, 3.4, -0.3], [0.2, 0, s * -0.4], [1, 1, 0.12]);
        add(g, G.box(0.3, 0.3, 0.1), GLOW(th.accent, 1.5), [0, 4.1, 0.48]);
        if (snowCap) add(g, G.box(2.1, 0.15, 2.1), M('#eef4fa'), [0, 1.25, 0]);
        break;
      }
      case 'idol': {
        const st = M('#4a5a40', { r: 1 });
        add(g, G.box(3, 1, 3), st, [0, 0.5, 0]);
        add(g, G.box(2.2, 3.4, 2), st, [0, 2.7, 0]);
        add(g, G.box(2.6, 0.4, 2.3), st, [0, 3.6, 0]);
        for (const s of [-1, 1]) add(g, G.box(0.4, 0.25, 0.1), GLOW('#9dff6a', 2.5), [s * 0.5, 3.0, 1.02]);
        add(g, G.box(1.0, 0.3, 0.1), M('#1a2218'), [0, 2.2, 1.02]);
        break;
      }
      case 'furnace': {
        add(g, G.box(4, 4, 3), new THREE.MeshStandardMaterial({ map: boxTex(T.brick, 4, 4), color: '#6a5048', flatShading: true }), [0, 2, 0]);
        add(g, G.cyl(1.0, 1.0, 0.2, 10), GLOW('#ff6a1a', 3), [0, 1.4, 1.5], [Math.PI / 2, 0, 0]);
        add(g, G.cyl(0.8, 1.2, 3, 8), M('#4a3a34'), [0, 5.5, -0.3]);
        lightSpots.push({ pos: [p.x + Math.sin(p.rot) * 2.5, 1.6, p.z + Math.cos(p.rot) * 2.5], color: '#ff6a1a', i: 20, d: 14, flick: true });
        fires.push([p.x + Math.sin(p.rot) * 1.6, 1.4, p.z + Math.cos(p.rot) * 1.6]);
        break;
      }
      case 'anvilprop': {
        add(g, G.box(0.5, 0.6, 0.4), M('#2a2624', { m: 0.7 }), [0, 0.3, 0]);
        add(g, G.box(1.0, 0.3, 0.45), M('#4a4442', { m: 0.85, r: 0.35 }), [0, 0.75, 0]);
        add(g, G.cone(0.2, 0.4, 4), M('#4a4442', { m: 0.85 }), [0.65, 0.75, 0], [0, 0, -Math.PI / 2]);
        add(g, G.box(0.3, 0.05, 0.12), GLOW('#ff8a2a', 2.5), [0, 0.93, 0]);
        break;
      }
      case 'chain': {
        for (let i = 0; i < 14; i++) add(g, G.tor(0.12, 0.03, 4, 8), M('#4a4442', { m: 0.9 }), [0, 9 - i * 0.22, 0], [0, i * Math.PI / 2, 0]);
        add(g, G.cone(0.3, 0.6, 4), M('#4a4442', { m: 0.9 }), [0, 5.7, 0], [Math.PI, 0, 0]);
        break;
      }
      case 'lavafall': {
        const mat = new THREE.ShaderMaterial({ uniforms: { t: { value: 0 } }, vertexShader: LAVA_VS, fragmentShader: `${NOISE} uniform float t; varying vec2 vUv; void main(){ float f = fbm(vec2(vUv.x*4., vUv.y*3. + t*1.5)); vec3 c = mix(vec3(0.5,0.05,0.), vec3(1.,0.55,0.1), f); gl_FragColor = vec4(c*1.7,1.); }` });
        const m = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 9), mat); m.position.set(0, 4.5, 0.05); g.add(m);
        upd.push((t) => { mat.uniforms.t.value = t; });
        break;
      }
      case 'reeds': {
        for (let i = 0; i < 12; i++) add(g, G.cyl(0.015, 0.03, 1.4 + (i % 4) * 0.3, 3), M('#5a6a3a'), [Math.cos(i * 2.4) * 0.6, 0.7, Math.sin(i * 2.4) * 0.6], [Math.cos(i) * 0.15, 0, Math.sin(i) * 0.15]);
        break;
      }
      case 'mushroom': {
        for (let i = 0; i < 4; i++) { const s = 0.6 + (i % 3) * 0.35; const x = Math.cos(i * 1.7) * 0.6, z = Math.sin(i * 1.7) * 0.6; add(g, G.cyl(0.08 * s, 0.12 * s, 0.8 * s, 6), M('#d8d0c0'), [x, 0.4 * s, z]); add(g, G.cone(0.4 * s, 0.35 * s, 8), GLOW('#9dff6a', 1.1), [x, 0.85 * s, z]); }
        lightSpots.push({ pos: [p.x, 1, p.z], color: '#9dff6a', i: 6, d: 8 });
        break;
      }
    }
  }
  // lights, budgeted by quality
  const maxL = quality === 'low' ? 2 : quality === 'medium' ? 5 : 8;
  lightSpots.slice(0, maxL).forEach((L, i) => {
    const pl = new THREE.PointLight(L.color, L.i, L.d, 1.7);
    pl.position.set(...L.pos); root.add(pl);
    if (L.flick) upd.push((t) => { pl.intensity = L.i * (0.85 + Math.sin(t * 11 + i) * 0.1 + Math.sin(t * 23 + i * 3) * 0.06); });
  });

  return {
    root, theme: th, braziers: fires, mapId,
    update(t) { for (const f of upd) f(t); },
    dispose() { scene.remove(root); root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); },
  };
}
