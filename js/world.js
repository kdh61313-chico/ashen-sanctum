import * as THREE from 'three';
import { COLLIDERS, PROPS, HALF_X, HALF_Z } from './map.js';
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

function flagstones(g, w, h) {
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
}
function bricks(g, w, h) {
  const r = rnd(3);
  g.fillStyle = '#1e1b19'; g.fillRect(0, 0, w, h);
  const rows = 8, bh = h / rows;
  for (let y = 0; y < rows; y++) {
    const bw = w / 4, off = (y % 2) * bw / 2;
    for (let x = -1; x < 5; x++) {
      const v = 46 + r() * 22;
      g.fillStyle = `rgb(${v + 4},${v},${v - 3})`;
      g.fillRect(x * bw + off + 2, y * bh + 2, bw - 4, bh - 4);
      g.fillStyle = 'rgba(255,255,255,0.04)'; g.fillRect(x * bw + off + 2, y * bh + 2, bw - 4, 3);
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x * bw + off + 2, y * bh + bh - 6, bw - 4, 4);
    }
  }
  for (let k = 0; k < 120; k++) { g.fillStyle = `rgba(0,0,0,${r() * 0.15})`; g.fillRect(r() * w, r() * h, 3 + r() * 10, 2 + r() * 6); }
  const grad = g.createLinearGradient(0, h, 0, h * 0.6); grad.addColorStop(0, 'rgba(40,55,30,0.35)'); grad.addColorStop(1, 'rgba(40,55,30,0)');
  g.fillStyle = grad; g.fillRect(0, 0, w, h);
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
    g.save(); g.translate(cx, cy); g.rotate(a + Math.PI / 2);
    g.beginPath();
    const k = (r() * 4) | 0;
    g.moveTo(0, -10); g.lineTo(0, 10);
    if (k === 0) { g.moveTo(0, -4); g.lineTo(6, -9); }
    if (k === 1) { g.moveTo(-6, 0); g.lineTo(6, 6); }
    if (k === 2) { g.moveTo(0, 2); g.lineTo(-6, -6); g.moveTo(0, 2); g.lineTo(6, -6); }
    if (k === 3) { g.moveTo(-5, -8); g.lineTo(5, 8); }
    g.stroke(); g.restore();
  }
  g.lineWidth = 4;
  g.beginPath();
  for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * (Math.PI * 4 / 5); const x = w / 2 + Math.cos(a) * w * 0.36, y = h / 2 + Math.sin(a) * h * 0.36; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
  g.stroke();
}

export function makeTextures() {
  return {
    floor: canvasTex(512, 512, flagstones, [14, 10]),
    brick: canvasTex(256, 256, bricks),
    runes: canvasTex(512, 512, runes),
  };
}

function boxTex(tex, sx, sy) {
  const t = tex.clone(); t.needsUpdate = true; t.repeat.set(Math.max(1, sx / 2.5), Math.max(1, sy / 2.5)); return t;
}

// ---------- world ----------
export function buildWorld(scene, quality = 'high') {
  const T = makeTextures();
  const upd = [];
  const lights = [];

  scene.background = new THREE.Color('#0d0b14');
  scene.fog = new THREE.FogExp2('#1b1624', 0.0125);

  // sky dome
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { t: { value: 0 } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec3 vP; uniform float t;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
      void main(){
        float y = vP.y;
        vec3 top = vec3(0.035,0.03,0.07);
        vec3 mid = vec3(0.12,0.08,0.16);
        vec3 hor = vec3(0.32,0.15,0.16);
        vec3 c = mix(hor, mid, smoothstep(-0.02, 0.18, y));
        c = mix(c, top, smoothstep(0.15, 0.7, y));
        // moon glow
        vec3 md = normalize(vec3(-0.55, 0.42, -0.72));
        float m = max(dot(vP, md), 0.);
        c += vec3(0.55,0.6,0.85) * pow(m, 60.) * 0.6 + vec3(0.3,0.25,0.45)*pow(m, 6.)*0.25;
        // stars
        vec2 sp = vec2(atan(vP.z, vP.x)*260., vP.y*520.);
        float s = h(floor(sp));
        float tw = 0.6 + 0.4*sin(t*2. + s*50.);
        c += vec3(0.9,0.9,1.) * step(0.992, s) * smoothstep(0.08, 0.4, y) * tw * 0.8;
        // bands of ember haze near horizon
        c += vec3(0.25,0.08,0.03) * exp(-abs(y-0.03)*30.) * 0.6;
        gl_FragColor = vec4(c,1.);
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), skyMat);
  scene.add(sky);
  upd.push((t) => { skyMat.uniforms.t.value = t; });

  // moon disc
  const moonDir = new THREE.Vector3(-0.55, 0.42, -0.72).normalize();
  const moon = new THREE.Mesh(new THREE.CircleGeometry(14, 24), new THREE.MeshBasicMaterial({ color: '#dfe6ff', fog: false }));
  moon.position.copy(moonDir).multiplyScalar(260); moon.lookAt(0, 0, 0);
  scene.add(moon);

  // lights
  const hemi = new THREE.HemisphereLight('#8a86c8', '#4a3024', 1.7);
  scene.add(hemi);
  const amb = new THREE.AmbientLight('#3a3050', 1.1);
  scene.add(amb);
  const sun = new THREE.DirectionalLight('#b4c0ff', 2.6);
  sun.position.set(-26, 62, -30);
  sun.castShadow = quality !== 'low';
  sun.shadow.mapSize.set(quality === 'high' ? 2048 : 1024, quality === 'high' ? 2048 : 1024);
  const sc = sun.shadow.camera; sc.left = -45; sc.right = 45; sc.top = 40; sc.bottom = -40; sc.near = 1; sc.far = 160;
  sun.shadow.bias = -0.0012; sun.shadow.normalBias = 0.08;
  scene.add(sun); scene.add(sun.target);
  // rim light from opposite side (warm ember)
  const rim = new THREE.DirectionalLight('#ff8a5a', 0.9);
  rim.position.set(40, 12, 50);
  scene.add(rim);

  // ground
  const floorMat = new THREE.MeshStandardMaterial({ map: T.floor, roughness: 0.92, metalness: 0.02, color: '#c4bab0' });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALF_X * 2, HALF_Z * 2), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  scene.add(floor);
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: '#141015', roughness: 1 }));
  outer.rotation.x = -Math.PI / 2; outer.position.y = -0.02; scene.add(outer);

  // altar rune circle on floor
  const runeMat = new THREE.MeshBasicMaterial({ map: T.runes, transparent: true, color: '#ff3b3b', blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9, fog: false });
  const runeCircle = new THREE.Mesh(new THREE.PlaneGeometry(15, 15), runeMat);
  runeCircle.rotation.x = -Math.PI / 2; runeCircle.position.y = 0.03; scene.add(runeCircle);
  const runeTop = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), runeMat.clone());
  runeTop.material.color.set('#ff5a2a');
  runeTop.rotation.x = -Math.PI / 2; runeTop.position.y = 1.21; scene.add(runeTop);
  upd.push((t) => { runeCircle.rotation.z = t * 0.05; runeTop.rotation.z = -t * 0.12; runeMat.opacity = 0.55 + Math.sin(t * 1.3) * 0.2; });
  // team spawn sigils
  for (const [x, col] of [[-29, '#4fe0d0'], [29, '#ff3b4b']]) {
    const m = runeMat.clone(); m.color.set(col); m.opacity = 0.5;
    const s = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), m);
    s.rotation.x = -Math.PI / 2; s.position.set(x, 0.03, 0); scene.add(s);
    upd.push((t) => { s.rotation.z = t * 0.08 * Math.sign(x); });
  }

  // colliders → meshes
  const stoneMat = (sx, sy, tint = '#8f8780') => new THREE.MeshStandardMaterial({ map: boxTex(T.brick, sx, sy), color: tint, roughness: 0.95, flatShading: true });
  for (const b of COLLIDERS) {
    const sx = b.max[0] - b.min[0], sy = b.max[1] - b.min[1], sz = b.max[2] - b.min[2];
    const cx = (b.min[0] + b.max[0]) / 2, cy = (b.min[1] + b.max[1]) / 2, cz = (b.min[2] + b.max[2]) / 2;
    let mesh;
    switch (b.kind) {
      case 'pillar': {
        const g = grp(scene, [cx, b.min[1], cz]);
        const r = Math.min(sx, sz) / 2;
        add(g, G.cyl(r * 1.25, r * 1.35, 0.4, 8), M('#4a4440'), [0, 0.2, 0]);
        const broken = sy < 5;
        add(g, G.cyl(r * 0.95, r, sy - (broken ? 0.3 : 0.9), 8), M('#5c5550', { r: 0.95 }), [0, (sy - (broken ? 0.3 : 0.9)) / 2 + 0.3, 0]);
        if (!broken) {
          add(g, G.cyl(r * 1.35, r * 1.0, 0.5, 8), M('#4a4440'), [0, sy - 0.25, 0]);
        } else {
          for (let i = 0; i < 4; i++) add(g, G.cone(r * 0.45, 0.5 + Math.random() * 0.4, 4), M('#5c5550'), [Math.cos(i * 1.6) * r * 0.5, sy, Math.sin(i * 1.6) * r * 0.5], [0, i, 0.1]);
        }
        // fluting glow on tall pillars near altar
        if (Math.abs(cx) < 5 && Math.abs(cz) < 5) add(g, G.box(0.06, sy * 0.6, 0.06), GLOW('#ff3b3b', 1.4), [0, sy * 0.5, r * 0.98]);
        break;
      }
      case 'obelisk': {
        const g = grp(scene, [cx, b.min[1], cz]);
        add(g, G.cyl(0.5, 0.75, sy - 0.5, 4), M('#2a2628', { r: 0.8, m: 0.2 }), [0, (sy - 0.5) / 2, 0], [0, Math.PI / 4, 0]);
        add(g, G.cone(0.5, 0.9, 4), M('#2a2628'), [0, sy - 0.1, 0], [0.2, Math.PI / 4, 0.15]);
        for (let i = 0; i < 4; i++) add(g, G.box(0.06, sy * 0.55, 0.04), GLOW('#ff3030', 2.2), [Math.sin(i * Math.PI / 2) * 0.62, sy * 0.4, Math.cos(i * Math.PI / 2) * 0.62], [0, i * Math.PI / 2, 0]);
        const core = add(g, G.oct(0.35), GLOW('#ff2a2a', 3), [0, sy + 1.0, 0]);
        upd.push((t) => { core.rotation.y = t; core.position.y = sy + 1.0 + Math.sin(t * 1.5) * 0.2; });
        const pl = new THREE.PointLight('#ff3a2a', 18, 16, 1.6); pl.position.set(cx, b.max[1] + 1.6, cz); scene.add(pl); lights.push(pl);
        break;
      }
      case 'coffin': {
        mesh = new THREE.Mesh(G.box(sx, sy, sz), M('#4f4a45', { r: 0.9 }));
        const lid = new THREE.Mesh(G.box(sx + 0.12, 0.12, sz + 0.12), M('#3c3835'));
        lid.position.set(cx, b.max[1] - 0.04, cz); lid.castShadow = true; scene.add(lid);
        break;
      }
      case 'altar':
        mesh = new THREE.Mesh(G.box(sx, sy, sz), new THREE.MeshStandardMaterial({ map: boxTex(T.brick, sx, sy), color: '#6a5d5a', roughness: 0.9, flatShading: true }));
        add(scene, G.box(sx + 0.3, 0.15, sz + 0.3), M('#2e2826'), [cx, b.max[1] - 0.05, cz]);
        break;
      case 'wall': {
        mesh = new THREE.Mesh(G.box(sx, sy, sz), stoneMat(Math.max(sx, sz), sy));
        if (sy >= 9) {
          // merlons
          const long = sx > sz;
          const L = long ? sx : sz;
          for (let i = 0; i < L / 2.2; i++) {
            const o = -L / 2 + 1.1 + i * 2.2;
            add(scene, G.box(long ? 1.2 : sx, 1.1, long ? sz : 1.2), M('#3e3935'), long ? [cx + o, b.max[1] + 0.55, cz] : [cx, b.max[1] + 0.55, cz + o]);
          }
          // gothic window slits with dim glow on inner face
          for (let i = 0; i < L / 9; i++) {
            const o = -L / 2 + 4.5 + i * 9;
            const inner = long ? (cz > 0 ? -1 : 1) : (cx > 0 ? -1 : 1);
            const p = long ? [cx + o, 6.2, cz + inner * (sz / 2 + 0.01)] : [cx + inner * (sx / 2 + 0.01), 6.2, cz + o];
            const win = add(scene, G.box(long ? 0.7 : 0.05, 2.4, long ? 0.05 : 0.7), M('#0a0608', { e: '#ff6a2a', ei: 0.35 }), p);
            add(scene, G.cone(0.5, 0.7, 4), M('#0a0608', { e: '#ff6a2a', ei: 0.35 }), [p[0], 7.75, p[2]], [0, Math.PI / 4, 0], long ? [1, 1, 0.07] : [0.07, 1, 1]);
          }
        }
        break;
      }
      case 'lowwall':
        mesh = new THREE.Mesh(G.box(sx, sy, sz), stoneMat(Math.max(sx, sz), sy, '#7a726a'));
        add(scene, G.box(sx + 0.15, 0.12, sz + 0.15), M('#36312d'), [cx, b.max[1] + 0.04, cz]);
        break;
      case 'ledge':
        mesh = new THREE.Mesh(G.box(sx, sy, sz), stoneMat(Math.max(sx, sz), sy, '#827970'));
        break;
      case 'rubble': {
        mesh = new THREE.Mesh(G.box(sx, sy, sz), M('#4d4742', { r: 1 }));
        for (let i = 0; i < 5; i++) add(scene, G.dodec(0.25 + Math.random() * 0.3), M('#56504a'), [cx + (Math.random() - 0.5) * sx * 1.6, 0.2, cz + (Math.random() - 0.5) * sz * 1.6], [Math.random(), Math.random(), 0]);
        break;
      }
      default:
        mesh = new THREE.Mesh(G.box(sx, sy, sz), stoneMat(Math.max(sx, sz), sy, '#7d756d'));
    }
    if (mesh) { mesh.position.set(cx, cy, cz); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); }
  }

  // ---- distant silhouettes: mountains + ruined spires ----
  const silMat = new THREE.MeshBasicMaterial({ color: '#0d0a13', fog: false });
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + Math.random() * 0.1;
    const d = 150 + Math.random() * 40;
    const h = 25 + Math.random() * 45;
    const m = new THREE.Mesh(G.cone(20 + Math.random() * 20, h, 5), silMat);
    m.position.set(Math.cos(a) * d, h / 2 - 4, Math.sin(a) * d); scene.add(m);
  }
  const spireMat = new THREE.MeshStandardMaterial({ color: '#1b1720', roughness: 1, flatShading: true });
  const spires = [[-50, -40, 34], [-60, 10, 26], [48, 36, 30], [62, -18, 22], [0, -55, 40], [10, 58, 28], [-30, 55, 22]];
  for (const [x, z, h] of spires) {
    const g = grp(scene, [x, 0, z]);
    add(g, G.box(6, h, 6), spireMat, [0, h / 2, 0]);
    add(g, G.cone(4.4, h * 0.45, 4), spireMat, [0, h + h * 0.22, 0], [0, Math.PI / 4, 0]);
    add(g, G.box(1.2, 4, 0.2), M('#0a0810', { e: '#ff7a3a', ei: 0.9 }), [0, h * 0.7, 3.05]);
    for (const s of [-1, 1]) add(g, G.box(2.5, h * 0.55, 2.5), spireMat, [s * 4.3, h * 0.27, 0]);
  }
  scene.children.forEach(o => { if (o.isGroup && Math.hypot(o.position.x, o.position.z) > 45) o.traverse(m => { m.castShadow = false; m.receiveShadow = false; }); });
  // giant broken rose-window arch behind north wall
  const arch = grp(scene, [0, 0, -40]);
  add(arch, G.tor(14, 1.6, 4, 16, Math.PI * 0.78), spireMat, [0, 10, 0], [0, 0, 0.35]);
  add(arch, G.box(3.4, 12, 3.4), spireMat, [-13.5, 6, 0]);
  add(arch, G.box(3.4, 16, 3.4), spireMat, [13.5, 8, 0]);
  arch.traverse(m => { m.castShadow = false; });
  const rose = add(arch, G.tor(7, 0.25, 3, 24), M('#0a0810', { e: '#ff4a3a', ei: 1.1 }), [0, 18, 0.5]);
  for (let i = 0; i < 8; i++) add(arch, G.box(0.18, 6.6, 0.2), M('#0a0810', { e: '#ff4a3a', ei: 0.8 }), [0, 18, 0.5], [0, 0, i * Math.PI / 8]);

  // ---- props ----
  const braziers = [];
  for (const p of PROPS) {
    const g = grp(scene, [p.x, p.y, p.z], [0, p.rot, 0]);
    g.scale.setScalar(p.s);
    switch (p.type) {
      case 'brazier': {
        for (let i = 0; i < 3; i++) add(g, G.cyl(0.04, 0.05, 1.2, 4), M('#2a2420', { m: 0.6 }), [Math.cos(i * 2.09) * 0.25, 0.55, Math.sin(i * 2.09) * 0.25], [Math.sin(i * 2.09) * 0.25, 0, -Math.cos(i * 2.09) * 0.25]);
        add(g, G.cyl(0.5, 0.28, 0.35, 8), M('#2e2824', { m: 0.7, r: 0.5 }), [0, 1.2, 0]);
        add(g, G.cyl(0.42, 0.42, 0.05, 8), GLOW('#ff7a1a', 2.5), [0, 1.36, 0]);
        braziers.push([p.x, p.y + 1.45, p.z]);
        break;
      }
      case 'grave': {
        add(g, G.box(0.7, 1.0, 0.18), M('#5a5650', { r: 1 }), [0, 0.5, 0], [0.08, 0, 0.06]);
        add(g, G.cyl(0.35, 0.35, 0.18, 7, 1), M('#5a5650'), [0, 1.0, 0], [Math.PI / 2 + 0.08, 0, 0.06]);
        add(g, G.box(1.0, 0.1, 1.8), M('#2a2620'), [0, 0.05, 0.9]);
        break;
      }
      case 'tree': {
        const bark = M('#1e1814', { r: 1 });
        add(g, G.cyl(0.25, 0.45, 4, 5), bark, [0, 2, 0], [0.08, 0, -0.06]);
        const br = (par, len, rad, dep, rx, rz) => {
          const b = grp(par, [0, len * 0.9, 0], [rx, 0, rz]);
          add(b, G.cyl(rad * 0.6, rad, len, 4), bark, [0, len / 2, 0]);
          if (dep > 0) { br(b, len * 0.72, rad * 0.6, dep - 1, 0.5, 0.6); br(b, len * 0.7, rad * 0.6, dep - 1, -0.4, -0.7); }
        };
        const top = grp(g, [0, 2.4, 0]);
        br(top, 2.0, 0.22, 2, 0.4, 0.5); br(top, 1.8, 0.2, 2, -0.5, -0.4); br(top, 2.2, 0.2, 1, 0.1, -0.1);
        break;
      }
      case 'banner': {
        add(g, G.cyl(0.05, 0.05, 2.4, 5), M('#2a2420', { m: 0.6 }), [0, 7.5, 0.3], [0, 0, Math.PI / 2]);
        const col = p.x < 0 ? '#1f5a58' : '#6a1218';
        const cloth = add(g, G.box(1.6, 5, 0.05), M(col, { r: 0.95 }), [0, 4.9, 0.3]);
        add(g, G.box(0.5, 0.5, 0.06), GLOW(p.x < 0 ? '#4fe0d0' : '#ff3b4b', 1.6), [0, 5.6, 0.31], [0, 0, Math.PI / 4]);
        add(g, G.cone(0.8, 0.8, 3), M(col), [0, 2.2, 0.3], [Math.PI, 0, 0], [1, 1, 0.06]);
        break;
      }
      case 'crystal': {
        const col = '#b06cff';
        for (let i = 0; i < 5; i++) add(g, G.cone(0.18 + Math.random() * 0.12, 0.8 + Math.random() * 1.2, 5), M('#6a3ab0', { e: col, ei: 1.3, r: 0.2, m: 0.3 }), [(Math.random() - 0.5) * 0.8, 0.4, (Math.random() - 0.5) * 0.8], [(Math.random() - 0.5) * 0.6, 0, (Math.random() - 0.5) * 0.6]);
        const pl = new THREE.PointLight(col, 6, 8, 2); pl.position.set(p.x, 1.2, p.z); scene.add(pl); lights.push(pl);
        break;
      }
      case 'candles': {
        for (let i = 0; i < 7; i++) {
          const h = 0.15 + Math.random() * 0.3; const x = (Math.random() - 0.5) * 0.7, z = (Math.random() - 0.5) * 0.7;
          add(g, G.cyl(0.035, 0.04, h, 6), M('#d8cfb8'), [x, h / 2, z]);
          const f = add(g, G.cone(0.025, 0.07, 4), GLOW('#ffb347', 3), [x, h + 0.04, z]); f.userData.flick = true;
        }
        break;
      }
      case 'bones': {
        const bone = M('#cfc5a8');
        add(g, G.ico(0.13, 0), bone, [0, 0.1, 0]);
        for (let i = 0; i < 5; i++) add(g, G.cyl(0.03, 0.03, 0.5, 4), bone, [(Math.random() - 0.5) * 0.9, 0.04, (Math.random() - 0.5) * 0.9], [Math.PI / 2, Math.random() * 3, 0]);
        break;
      }
      case 'statue': {
        const st = M('#58524c', { r: 1 });
        add(g, G.box(2, 1.2, 2), st, [0, 0.6, 0]);
        add(g, G.cyl(0.5, 0.7, 2.6, 6), st, [0, 2.5, 0]);
        add(g, G.ico(0.4, 0), st, [0, 4.1, 0.1]);
        for (const s of [-1, 1]) add(g, G.cone(1.2, 3.2, 3), st, [s * 0.9, 3.4, -0.3], [0.2, 0, s * -0.4], [1, 1, 0.12]);
        add(g, G.box(0.3, 0.3, 0.1), GLOW('#ff3b3b', 1.5), [0, 4.1, 0.48]);
        break;
      }
    }
  }
  // brazier lights (limit count)
  const bl = braziers.slice(0, quality === 'low' ? 2 : 6);
  for (const b of bl) {
    const pl = new THREE.PointLight('#ff8a3a', 14, 13, 1.7);
    pl.position.set(b[0], b[1] + 0.5, b[2]); scene.add(pl); lights.push(pl);
    upd.push((t) => { pl.intensity = 12 + Math.sin(t * 11 + b[0]) * 2 + Math.sin(t * 23 + b[2]) * 1.4; });
  }

  return {
    braziers,
    update(t) { for (const f of upd) f(t); },
    sun,
  };
}
