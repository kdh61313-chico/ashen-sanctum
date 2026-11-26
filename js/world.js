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
  parquet(g, w, h) {
    const r = rnd(17);
    g.fillStyle = '#1a110b'; g.fillRect(0, 0, w, h);
    const rows = 16, bh = h / rows;
    for (let y = 0; y < rows; y++) {
      let x = -r() * 120;
      while (x < w) {
        const L = 90 + r() * 110, v = 88 + r() * 22;
        g.fillStyle = `rgb(${v},${v * 0.66},${v * 0.44})`; g.fillRect(x + 1, y * bh + 1, L - 2, bh - 2);
        g.fillStyle = 'rgba(0,0,0,0.08)'; for (let i = 0; i < 4; i++) g.fillRect(x + r() * L, y * bh + 2 + r() * (bh - 4), 14 + r() * 40, 1);
        g.fillStyle = 'rgba(255,220,180,0.05)'; g.fillRect(x + 1, y * bh + 1, L - 2, 2);
        x += L;
      }
    }
    for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(10,6,4,${0.08 + r() * 0.12})`; g.beginPath(); g.ellipse(r() * w, r() * h, 20 + r() * 50, 10 + r() * 24, r() * 3, 0, 7); g.fill(); }
  },
  slate(g, w, h) {
    const r = rnd(23);
    g.fillStyle = '#23272c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const cx = r() * w, cy = r() * h, rad = 26 + r() * 40, v = 56 + r() * 16;
      g.fillStyle = `rgb(${v - 4},${v},${v + 6})`; g.beginPath();
      for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2 + r() * 0.4, rr = rad * (0.75 + r() * 0.3); const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; if (k) g.lineTo(x, y); else g.moveTo(x, y); }
      g.closePath(); g.fill(); g.strokeStyle = 'rgba(14,16,20,0.7)'; g.lineWidth = 2; g.stroke();
    }
    for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(150,180,200,${0.04 + r() * 0.06})`; g.beginPath(); g.ellipse(r() * w, r() * h, 12 + r() * 40, 5 + r() * 14, r() * 3, 0, 7); g.fill(); }
  },
  sand(g, w, h) {
    const r = rnd(31);
    g.fillStyle = '#b89870'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { const v = r(); g.fillStyle = v < 0.5 ? `rgba(225,195,150,${0.15 + r() * 0.15})` : `rgba(140,105,70,${0.1 + r() * 0.12})`; g.beginPath(); g.ellipse(r() * w, r() * h, 30 + r() * 90, 20 + r() * 50, r() * 3, 0, 7); g.fill(); }
    for (let i = 0; i < 70; i++) {
      const x0 = r() * w, y0 = r() * h, L = 30 + r() * 70, ph = r() * 6;
      g.strokeStyle = `rgba(${r() < 0.5 ? '250,230,195' : '120,88,58'},${0.08 + r() * 0.1})`; g.lineWidth = 1.5 + r() * 1.5;
      g.beginPath(); for (let k = 0; k <= 10; k++) { const x = x0 + (k / 10) * L, y = y0 + Math.sin(k * 0.6 + ph) * 3; if (k) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
    }
    for (let i = 0; i < 2400; i++) { const v = 140 + r() * 90; g.fillStyle = `rgba(${v},${v * 0.82},${v * 0.6},0.3)`; g.fillRect(r() * w, r() * h, 1.5, 1.5); }
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
function ashlar(g, w, h) {
  const r = rnd(41);
  g.fillStyle = '#6a5440'; g.fillRect(0, 0, w, h);
  const rows = 4, bh = h / rows;
  for (let y = 0; y < rows; y++) {
    let x = -(y % 2) * w / 6;
    while (x < w) {
      const bw = w / 3 * (0.7 + r() * 0.6), v = 150 + r() * 30;
      g.fillStyle = `rgb(${v},${v * 0.82},${v * 0.62})`; g.fillRect(x + 2, y * bh + 2, bw - 4, bh - 4);
      g.fillStyle = 'rgba(255,240,210,0.08)'; g.fillRect(x + 2, y * bh + 2, bw - 4, 4);
      g.fillStyle = 'rgba(70,50,30,0.18)'; g.fillRect(x + 2, y * bh + bh - 8, bw - 4, 6);
      for (let k = 0; k < 14; k++) { g.fillStyle = `rgba(90,64,40,${r() * 0.15})`; g.beginPath(); g.arc(x + r() * bw, y * bh + r() * bh, 1 + r() * 5, 0, 7); g.fill(); }
      x += bw;
    }
  }
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
    texCache.ashlar = canvasTex(256, 256, ashlar);
  }
  if (!texCache['f_' + floor]) texCache['f_' + floor] = canvasTex(512, 512, FLOORS[floor] || FLOORS.flag, [14, 10]);
  return { floor: texCache['f_' + floor], brick: floor === 'sand' ? texCache.ashlar : texCache.brick, runes: texCache.runes, planks: texCache.planks };
}
function boxTex(tex, sx, sy, k = 2.5) { const t = tex.clone(); t.needsUpdate = true; t.repeat.set(Math.max(1, sx / k), Math.max(1, sy / k)); return t; }

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
    uniforms: { t: { value: 0 }, top: { value: new THREE.Color(th.sky[0]) }, mid: { value: new THREE.Color(th.sky[1]) }, hor: { value: new THREE.Color(th.sky[2]) }, md: { value: md }, snow: { value: th.particles === 'snow' || th.particles === 'embers' || th.particles === 'rain' ? 1 : th.particles === 'spores' ? 0.5 : 0 }, cloud: { value: th.clouds ?? 0.35 }, flash: { value: 0 }, sunD: { value: th.sunDisc ? 1 : 0 }, cloudC: { value: new THREE.Color(th.cloudC || th.sky[2]).multiplyScalar(0.8) } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec3 vP; uniform float t; uniform vec3 top, mid, hor, md; uniform float snow, cloud, flash, sunD; uniform vec3 cloudC;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
      float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      float fb(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n2(p);p*=2.07;a*=.5;}return v;}
      void main(){
        float y = vP.y;
        vec3 c = mix(hor, mid, smoothstep(-0.02, 0.2, y));
        c = mix(c, top, smoothstep(0.18, 0.75, y));
        float m = max(dot(vP, md), 0.);
        c += vec3(0.6,0.62,0.8) * pow(m, 80.) * 0.8 + mid * pow(m, 6.) * 0.5;
        vec2 sp = vec2(atan(vP.z, vP.x)*260., vP.y*520.);
        float s = h(floor(sp));
        vec2 cp = vP.xz / (max(y, 0.02) + 0.12) * 0.9 + vec2(t*0.012, t*0.006);
        float d = fb(cp) * 0.8 + fb(cp*2.6 - t*0.01) * 0.35;
        float k = smoothstep(0.42, 0.85, d) * cloud * smoothstep(-0.01, 0.2, y);
        c += (1.0 - sunD) * (1.0 - min(1.0, k * 1.6)) * vec3(0.9,0.9,1.) * step(0.992, s) * smoothstep(0.08, 0.4, y) * (0.6 + 0.4*sin(t*2. + s*50.)) * (1.0 - snow*0.7);
        c += hor * exp(-abs(y-0.03)*28.) * 0.5;
        if (sunD > 0.5) { c += vec3(1.0,0.75,0.45) * (pow(m, 900.) * 3.0 + pow(m, 40.) * 0.5 + pow(m, 5.) * 0.25); }
        if (cloud > 0.) {
          vec3 cc = mix(cloudC, cloudC * 0.55 + hor * 0.5, smoothstep(0.3, -0.05, y)) * (0.6 + 0.55 * fb(cp*1.7 + 3.));
          cc += vec3(1.0,0.8,0.6) * pow(m, 4.) * (0.25 + sunD*0.6) + vec3(0.75,0.85,1.0) * flash * 1.6;
          c = mix(c, cc, k * 0.85);
        }
        c += vec3(0.55,0.65,0.85) * flash * 0.35;
        gl_FragColor = vec4(c,1.);
      }`,
  });
  root.add(new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), skyMat));
  upd.push((t) => { skyMat.uniforms.t.value = t; });
  const moon = new THREE.Mesh(new THREE.CircleGeometry(th.sunDisc ? 24 : th.particles === 'embers' ? 20 : 14, 32), new THREE.MeshBasicMaterial({ color: th.sunDisc ? '#ffe2b0' : th.particles === 'embers' ? '#ff8a4a' : '#dfe6ff', fog: false }));
  if (th.storm) moon.visible = false;
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

  // storm: lightning flashes light the whole arena for a heartbeat
  if (th.storm) {
    const bolts = new THREE.Group(); root.add(bolts);
    const boltMat = new THREE.LineBasicMaterial({ color: '#dff0ff', transparent: true, opacity: 0, fog: false });
    let next = 3 + Math.random() * 4, fl = 0, hemiL = null;
    root.traverse(o => { if (o.isHemisphereLight) hemiL = o; });
    upd.push((t, dt = 1 / 60) => {
      next -= dt;
      if (next <= 0) {
        next = 4 + Math.random() * 7; fl = 1;
        bolts.clear();
        const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 60, pts = [];
        let x = Math.cos(a) * d, z = Math.sin(a) * d, y = 110;
        while (y > 0) { pts.push(new THREE.Vector3(x, y, z)); x += (Math.random() - 0.5) * 14; z += (Math.random() - 0.5) * 14; y -= 6 + Math.random() * 10; }
        pts.push(new THREE.Vector3(x, 0, z));
        bolts.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), boltMat));
      }
      fl = Math.max(0, fl - dt * 3.2);
      const f = fl > 0 ? fl * (0.6 + 0.4 * Math.sin(t * 60)) : 0;
      skyMat.uniforms.flash.value = f; boltMat.opacity = f;
      if (hemiL) hemiL.intensity = th.hemi[2] * (1 + f * 1.6);
    });
  }

  // ground
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALF_X * 2, HALF_Z * 2), new THREE.MeshStandardMaterial({ map: T.floor, roughness: th.floor === 'snow' ? 0.75 : th.floor === 'slate' ? 0.42 : th.floor === 'parquet' ? 0.6 : 0.92, metalness: th.floor === 'forge' ? 0.3 : th.floor === 'slate' ? 0.25 : 0.02, color: th.floorTint }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; root.add(floor);
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: th.floor === 'snow' ? '#5a6474' : th.floor === 'sand' ? '#8a6a4a' : '#141015', roughness: 1 }));
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
    } else if (hz.kind === 'abyss') {
      // a parallax chasm: march down into the dark, hitting the cliff walls and drifting mist
      const alongX = w < d, hw = (alongX ? w : d) / 2;
      const mat = new THREE.ShaderMaterial({
        uniforms: { t: { value: 0 }, c: { value: new THREE.Vector2(cx, cz) }, hw: { value: hw }, hl: { value: (alongX ? d : w) / 2 }, ax: { value: alongX ? 1 : 0 } }, vertexShader: LAVA_VS,
        fragmentShader: `${NOISE} uniform float t, hw, hl, ax; uniform vec2 c; varying vec3 vW;
          void main(){
            vec3 V = normalize(vW - cameraPosition); float vy = min(V.y, -0.04);
            vec3 col = vec3(0.); float acc = 0.;
            for (int i = 1; i <= 14; i++) {
              float D = float(i) * float(i) * 0.12;
              vec3 P = vW + V * (D / -vy);
              vec2 q = ax > 0.5 ? vec2(abs(P.x - c.x), abs(P.z - c.y)) : vec2(abs(P.z - c.y), abs(P.x - c.x));
              if (q.x > hw || q.y > hl) {
                float strata = 0.5 + 0.5 * sin(D * 7. + n(P.xz * 1.7 + P.y) * 4.);
                vec3 rock = mix(vec3(0.012,0.014,0.018), vec3(0.05,0.055,0.065), strata) * exp(-D * 0.35);
                col += (1. - acc) * rock; acc = 1.; break;
              }
              float f = fbm(P.xz * 0.3 + vec2(t * 0.05, D * 0.2 - t * 0.03));
              float a = smoothstep(0.6, 0.95, f) * 0.1;
              col += (1. - acc) * a * mix(vec3(0.05,0.07,0.09), vec3(0.01,0.015,0.025), clamp(D / 10., 0., 1.));
              acc += (1. - acc) * a;
            }
            col += (1. - acc) * vec3(0.0015, 0.003, 0.008);
            gl_FragColor = vec4(col, 1.);
          }`,
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -Math.PI / 2; m.position.set(cx, 0.03, cz); root.add(m);
      upd.push((t) => { mat.uniforms.t.value = t; });
      const lip = M('#24282e', { r: 1 }), L = alongX ? d : w;
      for (const sgn of [-1, 1]) for (let i = 0; i < L / 1.3; i++) {
        const o = -L / 2 + 0.65 + i * 1.3, j = Math.sin(i * 12.9 + cx) * 0.18;
        add(root, G.dodec(0.38 + (i % 3) * 0.12), lip, alongX ? [cx + sgn * (hw + 0.15 + j), 0.05, cz + o] : [cx + o, 0.05, cz + sgn * (hw + 0.15 + j)], [i, i * 2, 0], [1, 0.45, 1]);
      }
    } else if (hz.kind === 'quicksand') {
      const mat = new THREE.ShaderMaterial({
        transparent: true, uniforms: { t: { value: 0 }, c: { value: new THREE.Vector2(cx, cz) } }, vertexShader: LAVA_VS,
        fragmentShader: `${NOISE} uniform float t; uniform vec2 c; varying vec3 vW;
          void main(){ vec2 q = vW.xz - c; float r = length(q), a = atan(q.y, q.x);
            float sw = fbm(vec2(a * 2. + r * 0.9 - t * 0.35, r * 1.4 - t * 0.2));
            vec3 col = mix(vec3(0.16,0.1,0.05), vec3(0.3,0.21,0.12), sw) * (0.6 + 0.4 * smoothstep(0., 3., r));
            float edge = smoothstep(0.0, 0.8, min(min(vW.x - ${(hz.min[0]).toFixed(2)}, ${(hz.max[0]).toFixed(2)} - vW.x), min(vW.z - ${(hz.min[1]).toFixed(2)}, ${(hz.max[1]).toFixed(2)} - vW.z)));
            gl_FragColor = vec4(col, 0.92 * edge); }`,
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -Math.PI / 2; m.position.set(cx, 0.05, cz); root.add(m);
      upd.push((t) => { mat.uniforms.t.value = t; });
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
  const stoneMat = (sx, sy, tint = wallTint) => new THREE.MeshStandardMaterial({ map: boxTex(T.brick, sx, sy, th.floor === 'sand' ? 4.5 : 2.5), color: tint, roughness: 0.95, flatShading: true });
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
      // ---- archive ----
      case 'dais': {
        mesh = new THREE.Mesh(G.box(sx, sy, sz), M('#4a3a34', { r: 0.7 }));
        add(root, G.box(sx + 0.1, 0.06, sz + 0.1), M('#8a6a3a', { m: 0.7, r: 0.35 }), [cx, b.max[1] - 0.02, cz]);
        if (sx > 5) for (const [a, c] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) add(root, G.box(a ? 0.05 : sx * 0.6, 0.02, c ? 0.05 : sz * 0.6), GLOW('#ffb347', 1.2), [cx + a * (sx / 2 - 0.4), b.max[1] + 0.01, cz + c * (sz / 2 - 0.4)]);
        break;
      }
      case 'pedestal': {
        const g = grp(root, [cx, b.min[1], cz]);
        add(g, G.cyl(sx * 0.5, sx * 0.62, sy, 8), M('#3a2a24', { r: 0.6 }), [0, sy / 2, 0]);
        add(g, G.cyl(sx * 0.66, sx * 0.66, 0.12, 8), M('#8a6a3a', { m: 0.8, r: 0.3 }), [0, sy, 0]);
        break;
      }
      case 'shelf': {
        const g = grp(root, [cx, 0, cz]);
        const long = sz > sx, L = long ? sz : sx, D = long ? sx : sz;
        const wood = M('#3a2418', { r: 0.85 }), dark = M('#1a100a', { r: 1 });
        add(g, G.box(sx, sy, sz), dark, [0, sy / 2, 0]);
        for (const e of [-1, 1]) add(g, G.box(long ? sx + 0.08 : 0.25, sy + 0.2, long ? 0.25 : sz + 0.08), wood, long ? [0, sy / 2 + 0.1, e * (L / 2 - 0.12)] : [e * (L / 2 - 0.12), sy / 2 + 0.1, 0]);
        add(g, G.box(sx + 0.16, 0.22, sz + 0.16), wood, [0, sy + 0.11, 0]);
        const cols = ['#5a1a16', '#1e3a4a', '#3a4a1e', '#4a3a1a', '#2a1a3a', '#6a4a2a', '#1a2a24'];
        const rows = Math.floor(sy / 0.85);
        for (const face of [-1, 1]) for (let r = 0; r < rows; r++) {
          const y = 0.12 + r * 0.85;
          add(g, G.box(long ? 0.1 : L - 0.5, 0.06, long ? L - 0.5 : 0.1), wood, long ? [face * (D / 2 + 0.02), y, 0] : [0, y, face * (D / 2 + 0.02)]);
          let o = -L / 2 + 0.35, k = Math.abs((r * 7 + (face > 0 ? 3 : 0) + Math.round(cx * 3 + cz * 7)) | 0) + 1;
          while (o < L / 2 - 0.4) {
            k = (k * 16807 + 11) % 2147483647; const bw = 0.08 + (k % 5) * 0.03, bh = 0.5 + (k % 7) * 0.04;
            if (k % 11 === 0) { o += 0.35; continue; }
            const lean = k % 13 === 0 ? 0.25 : 0;
            add(g, G.box(long ? 0.22 : bw, bh, long ? bw : 0.22), M(cols[k % cols.length], { r: 0.9 }), long ? [face * (D / 2 - 0.05), y + 0.03 + bh / 2, o + bw / 2] : [o + bw / 2, y + 0.03 + bh / 2, face * (D / 2 - 0.05)], long ? [lean, 0, 0] : [0, 0, lean]);
            o += bw + 0.01;
          }
        }
        mesh = null;
        g.traverse(o => { o.castShadow = true; o.receiveShadow = true; });
        break;
      }
      case 'gallery': {
        mesh = new THREE.Mesh(G.box(sx, sy, sz), M('#2a1a12', { r: 0.9 }));
        add(root, G.box(sx + 0.1, 0.12, sz + 0.1), new THREE.MeshStandardMaterial({ map: boxTex(T.planks, sx, sz), color: '#8a6a50', roughness: 0.7 }), [cx, b.max[1] - 0.05, cz]);
        for (let i = 0; i <= Math.floor(sx / 2.4); i++) add(root, G.box(0.5, sy, 0.5), M('#3a2418'), [b.min[0] + 0.25 + i * 2.4, sy / 2, b.max[2] - 0.25]);
        for (let i = 0; i < Math.floor(sx / 2.4); i++) add(root, G.tor(1.0, 0.12, 4, 12, Math.PI), M('#3a2418'), [b.min[0] + 1.45 + i * 2.4, sy - 1.2, b.max[2] + 0.01]);
        break;
      }
      case 'woodstep': mesh = new THREE.Mesh(G.box(sx, sy, sz), new THREE.MeshStandardMaterial({ map: boxTex(T.planks, sx, sz), color: '#7a5a42', roughness: 0.75 })); break;
      case 'rail': {
        const long = sx > sz, L = long ? sx : sz;
        add(root, G.box(long ? L : 0.12, 0.1, long ? 0.12 : L), M('#6a4a2a', { m: 0.4, r: 0.5 }), [cx, b.max[1] - 0.05, cz]);
        for (let i = 0; i <= L / 0.5; i++) add(root, G.cyl(0.03, 0.03, sy - 0.1, 5), M('#2a1a10', { r: 0.9 }), long ? [b.min[0] + i * 0.5, b.min[1] + (sy - 0.1) / 2, cz] : [cx, b.min[1] + (sy - 0.1) / 2, b.min[2] + i * 0.5]);
        break;
      }
      case 'table': {
        const g = grp(root, [cx, 0, cz]);
        add(g, G.box(sx, 0.12, sz), M('#4a2e1e', { r: 0.6 }), [0, sy - 0.06, 0]);
        for (const [a, c] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) add(g, G.box(0.12, sy - 0.12, 0.12), M('#2a1a10'), [a * (sx / 2 - 0.15), (sy - 0.12) / 2, c * (sz / 2 - 0.15)]);
        add(g, G.box(sx * 0.3, 0.05, sz * 0.25), M('#d8c8a0'), [sx * 0.1, sy + 0.02, 0], [0, 0.3, 0]);
        add(g, G.box(0.3, 0.12, 0.22), M('#5a1a16'), [-sx * 0.25, sy + 0.06, sz * 0.15]);
        break;
      }
      case 'fallen': {
        const g = grp(root, [cx, 0, cz], [0, 0, 0.12]);
        add(g, G.box(sx, sy * 0.8, sz), M('#2a1a10', { r: 1 }), [0, sy * 0.4, 0]);
        for (let i = 0; i < 18; i++) add(g, G.box(0.12 + (i % 3) * 0.04, 0.55, 0.35), M(['#5a1a16', '#1e3a4a', '#4a3a1a'][i % 3]), [-sx / 2 + 0.4 + (i * 0.27) % sx, 0.1, sz / 2 + 0.3 + (i % 4) * 0.2], [Math.PI / 2 - 0.3 * (i % 3), i, 0]);
        break;
      }
      case 'lectern': {
        const g = grp(root, [cx, 0, cz]);
        add(g, G.cyl(0.12, 0.3, sy - 0.2, 6), M('#3a2418'), [0, (sy - 0.2) / 2, 0]);
        add(g, G.box(sx, 0.1, sz), M('#4a2e1e'), [0, sy - 0.1, 0], [0, 0, 0.35]);
        add(g, G.box(sx * 0.7, 0.06, sz * 0.6), M('#e0d0a8'), [0, sy - 0.02, 0], [0, 0, 0.35]);
        add(g, G.box(0.05, 0.04, sz * 0.5), GLOW('#ffb347', 1.6), [0, sy + 0.02, 0], [0, 0, 0.35]);
        break;
      }
      case 'books': {
        const g = grp(root, [cx, 0, cz]);
        for (let i = 0; i < 9; i++) add(g, G.box(sx * (0.5 + (i % 3) * 0.15), sy / 6, sz * (0.6 + (i % 2) * 0.15)), M(['#5a1a16', '#1e3a4a', '#3a4a1e', '#6a4a2a'][i % 4], { r: 0.9 }), [(i % 3 - 1) * 0.08, sy / 12 + (i % 6) * sy / 6, (i % 2) * 0.06], [0, i * 0.5, 0]);
        break;
      }
      // ---- bastion ----
      case 'post': {
        const g = grp(root, [cx, 0, cz]);
        add(g, G.box(sx, sy, sz), stoneMat(sx, sy, '#7a828a'), [0, sy / 2, 0]);
        add(g, G.box(sx + 0.2, 0.25, sz + 0.2), M('#4a5058'), [0, sy, 0]);
        add(g, G.cyl(0.18, 0.22, 0.3, 6), M('#2a2e34', { m: 0.6 }), [0, sy + 0.25, 0]);
        add(g, G.ico(0.14, 0), GLOW('#8ad8ff', 3), [0, sy + 0.5, 0]);
        lightSpots.push({ pos: [cx, sy + 0.8, cz], color: '#8ad8ff', i: 4, d: 7 });
        break;
      }
      case 'keep': {
        mesh = new THREE.Mesh(G.box(sx, sy, sz), stoneMat(Math.max(sx, sz), sy, '#7a828a'));
        for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) { const a = i * Math.PI / 2, o = (k - 1) * sx * 0.32; add(root, G.box(0.9, 0.9, 0.9), M('#5a6068'), [cx + Math.cos(a) * sx / 2 * 0.9 + (i % 2 ? o : 0), b.max[1] + 0.45, cz + Math.sin(a) * sz / 2 * 0.9 + (i % 2 ? 0 : o)]); }
        for (const sg of [-1, 1]) { add(root, G.box(0.08, 1.4, 0.4), M('#0a0c10', { e: '#8ad8ff', ei: 0.6 }), [cx + sg * (sx / 2 + 0.02), sy * 0.62, cz]); add(root, G.box(0.4, 1.4, 0.08), M('#0a0c10', { e: '#8ad8ff', ei: 0.6 }), [cx, sy * 0.62, cz + sg * (sz / 2 + 0.02)]); }
        add(root, G.cone(sx * 0.62, 3.2, 4), M('#2e343c', { r: 0.8 }), [cx, b.max[1] + 2.6, cz], [0, Math.PI / 4, 0]);
        add(root, G.box(0.1, 3, 0.1), M('#2a2e34', { m: 0.7 }), [cx, b.max[1] + 5, cz]);
        add(root, G.box(1.4, 0.9, 0.04), M(cx < 0 ? '#1f5a58' : '#6a1218'), [cx + (cx < 0 ? 0.75 : -0.75), b.max[1] + 5.9, cz]);
        break;
      }
      case 'rampart': {
        mesh = new THREE.Mesh(G.box(sx, sy, sz), stoneMat(Math.max(sx, sz), sy, '#7a828a'));
        for (let i = 0; i < sx / 1.6; i++) add(root, G.box(0.8, 0.8, 0.5), M('#5a6068'), [b.min[0] + 0.4 + i * 1.6, b.max[1] + 0.4, b.min[2] + 0.25]);
        break;
      }
      // ---- dunes ----
      case 'sandstone': {
        mesh = new THREE.Mesh(G.box(sx, sy, sz), stoneMat(Math.max(sx, sz), sy * 3, '#f4e2c8'));
        add(root, G.box(sx + 0.12, 0.08, sz + 0.12), M('#b8946a'), [cx, b.max[1] - 0.02, cz]);
        if (sx > 8 && sz > 8) for (const [a, c] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) add(root, G.box(a ? 0.06 : 1.6, 0.4, c ? 0.06 : 1.6), M('#3a2818', { e: '#ffcf6a', ei: 0.5 }), [cx + a * (sx / 2 + 0.01), b.min[1] + sy / 2, cz + c * (sz / 2 + 0.01)]);
        break;
      }
      case 'sandwall': {
        mesh = new THREE.Mesh(G.box(sx, sy, sz), stoneMat(Math.max(sx, sz), sy, '#ecd8bc'));
        if (sy >= 9) { const long = sx > sz, L = long ? sx : sz; for (let i = 0; i < L / 6; i++) { const o = -L / 2 + 3 + i * 6, inner = long ? (cz > 0 ? -1 : 1) : (cx > 0 ? -1 : 1); add(root, G.box(long ? 2.2 : 0.06, 5, long ? 0.06 : 2.2), M('#6a4a2a', { r: 1 }), long ? [cx + o, 4, cz + inner * (sz / 2 + 0.02)] : [cx + inner * (sx / 2 + 0.02), 4, cz + o]); add(root, G.ico(0.35, 0), GLOW('#ffcf6a', 1.4), long ? [cx + o, 6.9, cz + inner * (sz / 2 + 0.05)] : [cx + inner * (sx / 2 + 0.05), 6.9, cz + o]); } }
        else add(root, G.box(sx + 0.12, 0.12, sz + 0.12), M('#a88a62'), [cx, b.max[1] + 0.04, cz]);
        break;
      }
      case 'spillar': {
        const g = grp(root, [cx, 0, cz]);
        const r = sx / 2, broken = sy < 5;
        add(g, G.box(sx * 1.3, 0.4, sz * 1.3), M('#c8a47a'), [0, 0.2, 0]);
        const segs = Math.max(1, Math.round(sy / 1.1));
        for (let i = 0; i < segs; i++) add(g, G.cyl(r * 0.9, r * 0.95, (sy - 0.4) / segs - 0.04, 10), M(i % 2 ? '#d8b88a' : '#ccac80', { r: 0.95 }), [0, 0.4 + ((sy - 0.4) / segs) * (i + 0.5), 0], [0, i * 0.4, 0]);
        if (!broken) { add(g, G.cyl(r * 1.4, r * 0.9, 0.5, 10), M('#c8a47a'), [0, sy + 0.1, 0]); add(g, G.box(sx * 1.6, 0.3, sz * 1.6), M('#b8946a'), [0, sy + 0.5, 0]); }
        else for (let i = 0; i < 3; i++) add(root, G.cyl(r * 0.9, r * 0.9, 0.9, 10), M('#ccac80'), [cx + 1.2 + i * 0.95, r * 0.9, cz + (i - 1) * 0.3], [0, 0.2, Math.PI / 2]);
        break;
      }
      case 'sobelisk': {
        const g = grp(root, [cx, 0, cz]);
        add(g, G.box(sx * 1.5, 0.5, sz * 1.5), M('#b8946a'), [0, 0.25, 0]);
        add(g, G.cyl(sx * 0.32, sx * 0.5, sy - 1.0, 4), M('#d0ac7e', { r: 0.9 }), [0, 0.5 + (sy - 1.0) / 2, 0], [0, Math.PI / 4, 0]);
        add(g, G.cone(sx * 0.32, 0.9, 4), M('#ffd27a', { m: 0.8, r: 0.25, e: '#7a4a10', ei: 0.4 }), [0, sy - 0.05, 0], [0, Math.PI / 4, 0]);
        for (let i = 0; i < 4; i++) add(g, G.box(0.08, sy * 0.5, 0.03), M('#3a2818', { e: '#ffcf6a', ei: 0.8 }), [Math.sin(i * Math.PI / 2) * sx * 0.42, sy * 0.45, Math.cos(i * Math.PI / 2) * sx * 0.42], [0, i * Math.PI / 2, 0]);
        break;
      }
      case 'colossus': {
        // a toppled stone king, half sunk in the sand
        const g = grp(root, [cx, 0, cz], [0, cx < 0 ? 0.5 : 0.5 + Math.PI, 0.18]);
        const st = M('#c8a47a', { r: 0.95 }), dk = M('#8a6a4a', { r: 1 });
        add(g, G.box(sx * 0.8, sy * 0.9, sz * 0.7), st, [0, sy * 0.35, 0]);
        add(g, G.box(sx * 0.85, sy * 0.25, sz * 0.75), dk, [0, sy * 0.85, 0]);
        add(g, G.box(sx * 0.18, sy * 0.3, 0.6), st, [0, sy * 0.45, sz * 0.4]);
        for (const e of [-1, 1]) { add(g, G.box(sx * 0.18, 0.18, 0.1), M('#1a1008', { e: '#ffcf6a', ei: 1.4 }), [e * sx * 0.18, sy * 0.62, sz * 0.36]); add(g, G.cone(sz * 0.4, sy * 0.9, 4), st, [e * sx * 0.46, sy * 0.55, -0.2], [0, 0, e * 0.25], [0.4, 1, 1]); }
        add(g, G.box(sx * 0.4, sy * 0.06, 0.1), dk, [0, sy * 0.18, sz * 0.36]);
        add(root, G.ico(sx * 0.42, 1), M('#d8bc90', { r: 1 }), [cx, -0.2, cz], [0, 0, 0], [1.6, 0.4, 1.2]);
        mesh = null;
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
    if (th.floor === 'sand') { add(g, G.cone(h * 0.9, h * 0.8, 4), M('#7a5a40', { r: 1 }), [0, h * 0.4 - 2, 0], [0, Math.PI / 4 + x, 0]); continue; }
    if (th.floor === 'slate') { add(g, G.cone(5 + h * 0.15, h * 1.4, 5), M('#161c22', { r: 1 }), [0, h * 0.7 - 4, 0], [0.1, x, 0.06]); add(g, G.cone(3, h * 0.8, 5), M('#1c242c', { r: 1 }), [6, h * 0.4 - 4, 3], [0, z, -0.1]); continue; }
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
  if (th.floor === 'sand') {
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + 0.2, d = 70 + (i * 23) % 30; add(far, G.ico(18 + (i * 7) % 14, 1), M('#a07a52', { r: 1 }), [Math.cos(a) * d, -6, Math.sin(a) * d], [0, a, 0], [1.8, 0.45, 1]); }
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
      // ---- archive ----
      case 'glasswin': {
        // tall stained-glass window set into the wall, with a dusty light shaft falling into the room
        const frame = M('#2a1a14', { r: 0.9 });
        add(g, G.box(3.2, 7.4, 0.3), frame, [0, 4.6, 0.1]);
        add(g, new THREE.CylinderGeometry(1.6, 1.6, 0.3, 16, 1, false, 0, Math.PI), frame, [0, 8.3, 0.1], [Math.PI / 2, 0, Math.PI / 2]);
        const cols = ['#ff7a2a', '#ffcf6a', '#c03a2a', '#5a8aff', '#ffb347', '#8a3aff'];
        for (let y = 0; y < 6; y++) for (let x = 0; x < 3; x++) add(g, G.box(0.86, 1.06, 0.06), M('#000', { e: cols[(x * 3 + y * 5) % cols.length], ei: 1.2 + ((x + y) % 2) * 0.5 }), [-0.9 + x * 0.9, 1.6 + y * 1.1, 0.26]);
        add(g, new THREE.CylinderGeometry(1.35, 1.35, 0.06, 16, 1, false, 0, Math.PI), M('#000', { e: '#ffcf6a', ei: 1.6 }), [0, 8.3, 0.26], [Math.PI / 2, 0, Math.PI / 2]);
        for (let i = 0; i < 4; i++) add(g, G.box(0.08, 7.0, 0.1), frame, [-1.35 + i * 0.9, 4.6, 0.3]);
        const sh = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 3.2, 11, 14, 1, true), new THREE.MeshBasicMaterial({ color: '#ffb060', transparent: true, opacity: 0.045, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
        sh.position.set(0, 3.5, 4.2); sh.rotation.set(-0.75, Math.PI / 4, 0); g.add(sh);
        lightSpots.push({ pos: [p.x + Math.sin(p.rot) * 3, 3, p.z + Math.cos(p.rot) * 3], color: '#ffa860', i: 10, d: 12 });
        break;
      }
      case 'chandelier': {
        const y = 7.2, iron = M('#1a1614', { m: 0.7, r: 0.5 });
        add(g, G.cyl(0.02, 0.02, 4, 4), iron, [0, y + 2, 0]);
        add(g, G.tor(1.3, 0.06, 4, 18), iron, [0, y, 0], [Math.PI / 2, 0, 0]);
        add(g, G.tor(0.7, 0.05, 4, 14), iron, [0, y + 0.3, 0], [Math.PI / 2, 0, 0]);
        for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; add(g, G.cyl(0.04, 0.04, 0.25, 5), M('#e8dcc0'), [Math.cos(a) * 1.3, y + 0.15, Math.sin(a) * 1.3]); add(g, G.cone(0.035, 0.1, 4), GLOW('#ffb347', 3.5), [Math.cos(a) * 1.3, y + 0.33, Math.sin(a) * 1.3]); }
        const swing = g.children.slice();
        upd.push((t) => { g.rotation.z = Math.sin(t * 0.6 + p.x) * 0.02; });
        lightSpots.push({ pos: [p.x, y - 0.4, p.z], color: '#ffb347', i: 8 * p.s, d: 16, flick: true });
        fires.push([p.x, y + 0.4, p.z]);
        void swing;
        break;
      }
      case 'candelabra': {
        const iron = M('#2a2420', { m: 0.7, r: 0.4 });
        add(g, G.cyl(0.05, 0.3, 0.2, 6), iron, [0, 0.1, 0]);
        add(g, G.cyl(0.04, 0.04, 2.0, 5), iron, [0, 1.1, 0]);
        add(g, G.box(1.0, 0.05, 0.05), iron, [0, 2.0, 0]);
        for (const x of [-0.5, 0, 0.5]) { add(g, G.cyl(0.05, 0.05, 0.3, 5), M('#e8dcc0'), [x, 2.18 + (x ? 0 : 0.12), 0]); add(g, G.cone(0.04, 0.12, 4), GLOW('#ffb347', 3.5), [x, 2.4 + (x ? 0 : 0.12), 0]); }
        lightSpots.push({ pos: [p.x, 2.6, p.z], color: '#ffb347', i: 5, d: 9, flick: true });
        break;
      }
      case 'armillary': {
        const brass = M('#b08a40', { m: 0.85, r: 0.3 });
        const rings = [];
        for (let i = 0; i < 3; i++) rings.push(add(g, G.tor(1.3 - i * 0.18, 0.05, 6, 28), brass, [0, 1.2, 0], [i * 0.9, i * 0.6, 0]));
        const core = add(g, G.ico(0.35, 1), GLOW('#ffb347', 2.6), [0, 1.2, 0]);
        add(g, G.tor(1.55, 0.03, 4, 32), GLOW('#ffcf6a', 1.4), [0, 1.2, 0], [Math.PI / 2, 0, 0]);
        upd.push((t) => { rings.forEach((r, i) => { r.rotation.y = t * (0.25 + i * 0.12); r.rotation.x = i * 0.9 + t * 0.1 * (i - 1); }); core.scale.setScalar(1 + Math.sin(t * 2) * 0.08); });
        lightSpots.unshift({ pos: [p.x, p.y + 1.4, p.z], color: '#ffb347', i: 18, d: 14 });
        break;
      }
      case 'scrolls': {
        for (let i = 0; i < 6; i++) add(g, G.cyl(0.06, 0.06, 0.55, 6), M(i % 2 ? '#d8c8a0' : '#c0aa80'), [Math.cos(i * 1.9) * 0.35, 0.06 + (i > 3 ? 0.11 : 0), Math.sin(i * 1.9) * 0.35], [Math.PI / 2, 0, i * 0.7]);
        for (let i = 0; i < 4; i++) add(g, G.box(0.42, 0.01, 0.3), M('#e8dcc0', { ds: true }), [Math.cos(i * 2.3) * 0.9, 0.01, Math.sin(i * 2.3) * 0.9], [0, i, 0]);
        break;
      }
      case 'firepatch': {
        add(g, G.cyl(1.6, 1.8, 0.04, 10), M('#120a06', { r: 1 }), [0, 0.02, 0]);
        for (let i = 0; i < 5; i++) add(g, G.box(0.6, 0.12, 0.2), M('#1a0e08', { e: '#ff5a1a', ei: 0.6 }), [Math.cos(i * 1.3) * 0.7, 0.06, Math.sin(i * 1.3) * 0.7], [0, i, 0]);
        fires.push([p.x, 0.3, p.z]); fires.push([p.x + 0.6, 0.2, p.z - 0.4]);
        lightSpots.push({ pos: [p.x, 1.2, p.z], color: '#ff6a1a', i: 12, d: 10, flick: true });
        break;
      }
      // ---- bastion ----
      case 'catapult': {
        const wood = M('#4a3424', { r: 0.9 }), iron = M('#2a2e34', { m: 0.7 });
        add(g, G.box(1.8, 0.3, 3.2), wood, [0, 0.5, 0]);
        for (const x of [-0.9, 0.9]) for (const z of [-1.2, 1.2]) add(g, G.cyl(0.42, 0.42, 0.15, 10), iron, [x * 1.08, 0.42, z], [0, 0, Math.PI / 2]);
        for (const x of [-0.7, 0.7]) add(g, G.box(0.2, 2.0, 0.2), wood, [x, 1.5, 0.2], [0.25, 0, 0]);
        add(g, G.box(0.18, 0.18, 3.6), wood, [0, 1.6, -0.6], [0.65, 0, 0]);
        add(g, G.box(0.7, 0.2, 0.7), wood, [0, 2.8, -2.0]);
        add(g, G.ico(0.32, 0), M('#5a5a5a'), [0, 3.1, -2.0]);
        break;
      }
      case 'stormcore': {
        const rocks = [];
        add(g, G.ico(0.8, 0), M('#1a2028', { r: 0.8 }), [0, 0, 0]);
        const orb = add(g, G.ico(0.5, 1), GLOW('#bfe8ff', 3.5), [0, 0, 0]);
        for (let i = 0; i < 7; i++) rocks.push(add(g, G.dodec(0.35 + (i % 3) * 0.15), M('#2a323c', { r: 0.9 }), [Math.cos(i) * 2.2, Math.sin(i * 2) * 0.6, Math.sin(i) * 2.2]));
        const arcs = new THREE.Group(); g.add(arcs);
        const arcMat = new THREE.LineBasicMaterial({ color: '#bfe8ff', transparent: true, opacity: 0.9, fog: false });
        let nt = 0;
        upd.push((t) => {
          rocks.forEach((r, i) => { const a = t * 0.4 + i * 0.9; r.position.set(Math.cos(a) * 2.2, Math.sin(t + i) * 0.5, Math.sin(a) * 2.2); r.rotation.y = t + i; });
          orb.scale.setScalar(1 + Math.sin(t * 9) * 0.12);
          if (t > nt) { nt = t + 0.12 + Math.random() * 0.3; arcs.clear(); const r = rocks[(Math.random() * rocks.length) | 0], pts = [new THREE.Vector3()]; for (let k = 1; k < 5; k++) pts.push(r.position.clone().multiplyScalar(k / 5).add(new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5))); pts.push(r.position.clone()); arcs.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), arcMat)); }
        });
        lightSpots.unshift({ pos: [p.x, p.y, p.z], color: '#8ad8ff', i: 30, d: 22, flick: true });
        break;
      }
      case 'bridge': {
        // stone span across the chasm (the floor under it is solid; this is the look)
        const st = new THREE.MeshStandardMaterial({ map: boxTex(T.brick, 7, 4), color: '#7a828a', roughness: 0.9, flatShading: true });
        add(g, G.box(7.6, 0.14, 3.8), st, [0, 0.07, 0]);
        add(g, G.box(7.6, 1.6, 3.2), M('#3a4048', { r: 1 }), [0, -0.8, 0]);
        for (const e of [-1, 1]) {
          add(g, G.box(7.6, 0.35, 0.3), M('#5a6068'), [0, 0.2, e * 1.95]);
          for (let i = 0; i < 5; i++) add(g, G.box(0.25, 0.55, 0.25), M('#5a6068'), [-3 + i * 1.5, 0.45, e * 1.95]);
          add(g, G.tor(3.2, 0.35, 4, 16, Math.PI), M('#3a4048'), [0, -1.4, e * 1.6], [Math.PI, 0, 0]);
        }
        break;
      }
      case 'spearrack': {
        const wood = M('#4a3424');
        add(g, G.box(1.6, 0.1, 0.1), wood, [0, 1.2, 0]); add(g, G.box(1.6, 0.1, 0.1), wood, [0, 0.3, 0]);
        for (const x of [-0.75, 0.75]) add(g, G.box(0.1, 1.4, 0.1), wood, [x, 0.7, 0]);
        for (let i = 0; i < 5; i++) { add(g, G.cyl(0.025, 0.025, 2.4, 4), wood, [-0.6 + i * 0.3, 1.2, 0.05], [0.12, 0, 0]); add(g, G.cone(0.05, 0.25, 4), M('#8a9099', { m: 0.8, r: 0.3 }), [-0.6 + i * 0.3, 2.5, 0.2], [0.12, 0, 0]); }
        break;
      }
      // ---- dunes ----
      case 'sunaltar': {
        add(g, G.cyl(0.9, 1.1, 0.4, 12), M('#b8946a'), [0, 0.2, 0]);
        const disc = add(g, G.cyl(1.0, 1.0, 0.08, 24), M('#ffd27a', { m: 0.9, r: 0.2, e: '#ff9a2a', ei: 0.6 }), [0, 2.4, 0], [Math.PI / 2, 0, 0]);
        add(g, G.box(0.14, 2.2, 0.14), M('#b08a40', { m: 0.8 }), [0, 1.3, 0]);
        const halo = add(g, G.tor(1.35, 0.05, 4, 32), GLOW('#ffcf6a', 2.2), [0, 2.4, 0]);
        for (let i = 0; i < 12; i++) add(g, G.cone(0.08, 0.5, 4), GLOW('#ffcf6a', 1.8), [Math.cos(i / 12 * Math.PI * 2) * 1.7, 2.4 + Math.sin(i / 12 * Math.PI * 2) * 1.7, 0], [0, 0, i / 12 * Math.PI * 2 - Math.PI / 2]);
        upd.push((t) => { g.rotation.y = t * 0.3; halo.scale.setScalar(1 + Math.sin(t * 1.6) * 0.04); disc.material.emissiveIntensity = 0.5 + Math.sin(t * 1.6) * 0.2; });
        lightSpots.unshift({ pos: [p.x, p.y + 2.6, p.z], color: '#ffcf6a', i: 16, d: 14 });
        break;
      }
      case 'canopy': {
        const wood = M('#5a3a24');
        for (const [x, z] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) add(g, G.cyl(0.06, 0.06, 2.8, 5), wood, [x, 1.4, z]);
        const cloth = add(g, G.box(3.4, 0.04, 3.4), M('#9a3a2a', { ds: true, r: 1 }), [0, 2.75, 0], [0.08, 0, -0.05]);
        add(g, G.box(3.4, 0.6, 0.02), M('#e8c890', { ds: true }), [0, 2.45, 1.7]);
        upd.push((t) => { cloth.rotation.x = 0.08 + Math.sin(t * 1.4 + p.x) * 0.03; });
        break;
      }
      case 'urns': {
        for (let i = 0; i < 4; i++) { const s2 = 0.7 + (i % 3) * 0.25; add(g, G.lathe([[0, 0], [0.22, 0.05], [0.3, 0.3], [0.22, 0.55], [0.12, 0.62], [0.15, 0.7], [0, 0.7]], 10), M(i % 2 ? '#9a5a34' : '#b8784a', { r: 0.8 }), [Math.cos(i * 1.7) * 0.6, 0, Math.sin(i * 1.7) * 0.6], [i === 3 ? Math.PI / 2 : 0, i, 0], s2); }
        break;
      }
      case 'palm': {
        const bark = M('#6a4a2a', { r: 1 });
        let x = 0, y = 0;
        for (let i = 0; i < 7; i++) { add(g, G.cyl(0.18 - i * 0.012, 0.22 - i * 0.012, 0.9, 6), bark, [x, y + 0.45, 0], [0, 0, -0.08 * i]); x += Math.sin(0.08 * i) * 0.9; y += Math.cos(0.08 * i) * 0.88; }
        const leaf = M('#4a6a2a', { ds: true, r: 0.9 });
        for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const f = grp(g, [x, y, 0], [0, a, 0]); add(f, G.box(0.5, 0.03, 2.6), leaf, [0, -0.3, 1.2], [0.45, 0, 0]); }
        break;
      }
      case 'jackal': {
        const st = M('#3a2c24', { r: 0.7, m: 0.2 }), gold = M('#d0a040', { m: 0.85, r: 0.3 });
        add(g, G.box(2.2, 1.2, 2.2), M('#c8a47a'), [0, 0.6, 0]);
        add(g, G.box(1.0, 1.4, 1.6), st, [0, 1.9, -0.2]);
        add(g, G.box(0.8, 1.6, 0.8), st, [0, 3.2, 0.1], [-0.1, 0, 0]);
        add(g, G.box(0.6, 0.6, 0.9), st, [0, 4.2, 0.35]);
        add(g, G.box(0.3, 0.25, 0.6), st, [0, 4.05, 0.95]);
        for (const e of [-1, 1]) add(g, G.cone(0.16, 0.8, 4), st, [e * 0.2, 4.85, 0.25], [0, Math.PI / 4, 0]);
        add(g, G.box(0.9, 0.12, 0.92), gold, [0, 3.95, 0.35]);
        for (const e of [-1, 1]) add(g, G.box(0.1, 0.06, 0.04), GLOW('#ffcf6a', 2.5), [e * 0.16, 4.3, 0.81]);
        break;
      }
    }
  }
  // ---- ground scatter: small debris that sells the floor material ----
  if (quality !== 'low') {
    const n = quality === 'high' ? 260 : 140;
    const kinds = {
      flag: [['#4a4440', 'rock'], ['#5a6040', 'tuft']], snow: [['#e8eef6', 'mound'], ['#7a8494', 'rock']],
      forge: [['#2a2220', 'rock'], ['#4a4442', 'scrap']], moss: [['#3a5a2a', 'tuft'], ['#5a6a4a', 'rock']],
      parquet: [['#e8dcc0', 'page'], ['#3a2418', 'scrap']], slate: [['#0e1216', 'puddle'], ['#3a4048', 'rock']],
      sand: [['#c8a47a', 'mound'], ['#8a6a4a', 'rock']],
    }[th.floor] || [['#4a4440', 'rock']];
    const geos = { rock: G.dodec(0.12), tuft: G.cone(0.08, 0.35, 3), mound: G.ico(0.4, 1), scrap: G.box(0.3, 0.04, 0.12), page: G.box(0.22, 0.005, 0.3), puddle: G.cyl(0.9, 0.9, 0.01, 12) };
    const r = rnd(97 + mapId.length);
    const free = (x, z, pad) => {
      if (Math.abs(x) > HALF_X - 1 || Math.abs(z) > HALF_Z - 1) return false;
      for (const b of map.boxes) if (x > b.min[0] - pad && x < b.max[0] + pad && z > b.min[2] - pad && z < b.max[2] + pad) return false;
      for (const h of map.hazards) if (x > h.min[0] - pad && x < h.max[0] + pad && z > h.min[1] - pad && z < h.max[1] + pad) return false;
      return true;
    };
    const dummy = new THREE.Object3D();
    for (const [col, kind] of kinds) {
      const mat = kind === 'puddle' ? new THREE.MeshStandardMaterial({ color: col, roughness: 0.05, metalness: 0.6, transparent: true, opacity: 0.75 }) : kind === 'page' ? M(col, { ds: true }) : M(col, { r: 1 });
      const cnt = kind === 'puddle' ? 22 : kind === 'mound' ? 40 : Math.floor(n / kinds.length);
      const im = new THREE.InstancedMesh(geos[kind], mat, cnt);
      let k = 0;
      for (let tries = 0; tries < cnt * 6 && k < cnt; tries++) {
        const x = (r() - 0.5) * HALF_X * 2, z = (r() - 0.5) * HALF_Z * 2;
        if (!free(x, z, kind === 'puddle' ? 1 : 0.3)) continue;
        const sc = kind === 'puddle' ? 0.6 + r() * 1.4 : kind === 'mound' ? 0.6 + r() * 1.2 : 0.6 + r() * 1.3;
        dummy.position.set(x, kind === 'mound' ? -0.22 : kind === 'puddle' ? 0.012 : kind === 'page' ? 0.01 : 0.04, z);
        dummy.rotation.set(kind === 'rock' ? r() * 3 : 0, r() * 6.28, kind === 'tuft' ? (r() - 0.5) * 0.4 : 0);
        dummy.scale.set(sc * (kind === 'mound' ? 2.2 : 1), sc * (kind === 'mound' ? 0.5 : 1), sc * (kind === 'puddle' ? 0.6 : 1));
        dummy.updateMatrix(); im.setMatrixAt(k++, dummy.matrix);
      }
      im.count = k; im.receiveShadow = true; im.castShadow = kind === 'rock' || kind === 'tuft';
      root.add(im);
    }
  }

  // ---- low drifting mist ----
  if (quality !== 'low') {
    const mc = new THREE.Color(th.mist || th.fog[0]);
    const mistMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, uniforms: { t: { value: 0 }, c: { value: mc }, k: { value: th.mist ? 0.32 : 0.18 } }, vertexShader: LAVA_VS,
      fragmentShader: `${NOISE} uniform float t, k; uniform vec3 c; varying vec3 vW;
        void main(){ float f = fbm(vW.xz * 0.06 + vec2(t * 0.02, t * 0.013)) * fbm(vW.xz * 0.13 - vec2(t * 0.03, 0.));
          float edge = smoothstep(${(HALF_X + 4).toFixed(1)}, ${(HALF_X - 8).toFixed(1)}, abs(vW.x)) * smoothstep(${(HALF_Z + 4).toFixed(1)}, ${(HALF_Z - 8).toFixed(1)}, abs(vW.z));
          gl_FragColor = vec4(c * 1.2, smoothstep(0.12, 0.45, f) * k * edge); }`,
    });
    for (const y of [0.35, 1.1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(HALF_X * 2, HALF_Z * 2), mistMat); m.rotation.x = -Math.PI / 2; m.position.y = y; m.renderOrder = 2; root.add(m); }
    upd.push((t) => { mistMat.uniforms.t.value = t; });
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
    update(t) { const dt = Math.min(0.1, Math.max(0, t - (this._lt ?? t))); this._lt = t; for (const f of upd) f(t, dt); },
    dispose() { scene.remove(root); root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); },
  };
}
