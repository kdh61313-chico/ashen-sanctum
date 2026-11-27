// Skins: every hero has two. Six tiers. A skin recolours the hero by brightness band
// (dark / main / light / metal / glow) and, from 희귀 up, adds effects around the body.
import * as THREE from 'three';
import { HEROES } from './heroes.js';

export const TIERS = [
  { name: '일반', color: '#a8a39a', rate: 0.35, shard: 5, cost: 30 },
  { name: '고급', color: '#6fcf8a', rate: 0.28, shard: 10, cost: 60 },
  { name: '희귀', color: '#5aa8ff', rate: 0.20, shard: 20, cost: 120 },
  { name: '영웅', color: '#b77aff', rate: 0.11, shard: 40, cost: 240 },
  { name: '전설', color: '#ffb347', rate: 0.05, shard: 80, cost: 480 },
  { name: '초전설', color: '#ff5a7a', rate: 0.01, shard: 160, cost: 960 },
];
export const SKIN_PULL_COST = 280, SKIN_PITY = 100;

// palettes: dark / main / light / metal / glow (+ options)
export const THEMES = {
  // 일반
  ash: { name: '잿빛', t: 0, p: ['#2a2826', '#6a6560', '#b8b0a4', '#8a8680', '#d8d0c0'] },
  sand: { name: '사막', t: 0, p: ['#4a3a28', '#a88a62', '#e4d2b0', '#b89a6a', '#ffd89a'] },
  moss: { name: '이끼', t: 0, p: ['#1e2a1a', '#4a6a3a', '#a8c08a', '#7a8a6a', '#b8ff8a'] },
  steel: { name: '강철', t: 0, p: ['#1a2028', '#4a5a6a', '#a8b8c8', '#c0c8d0', '#9ad8ff'] },
  // 고급
  crimson: { name: '심홍', t: 1, p: ['#2a0a0e', '#8a1a22', '#e8b0a8', '#a0303a', '#ff5a5a'] },
  frost: { name: '서리', t: 1, p: ['#1a2a3a', '#5a8ab0', '#e0f2ff', '#a8d0ec', '#9ae8ff'] },
  obsidian: { name: '흑요', t: 1, p: ['#08080c', '#1e1c24', '#6a6474', '#3a3644', '#c0a0ff'] },
  brass: { name: '황동', t: 1, p: ['#2a1e10', '#7a5a2a', '#e8c890', '#c8963a', '#ffcf6a'] },
  // 희귀
  moon: { name: '월광', t: 2, p: ['#10142a', '#3a4a7a', '#dfe6ff', '#c8d0f0', '#a8c0ff'] },
  bloodmoon: { name: '혈월', t: 2, p: ['#1a0608', '#5a1018', '#ff9a8a', '#8a2a2a', '#ff3a3a'] },
  jade: { name: '비취', t: 2, p: ['#0a1e18', '#2a7a5a', '#c8f0dc', '#6ac8a0', '#7affc8'] },
  amethyst: { name: '자수정', t: 2, p: ['#1a0e2a', '#5a3a8a', '#e0c8ff', '#9a7ac8', '#d08aff'] },
  // 영웅
  oath: { name: '황금 맹세', t: 3, p: ['#3a2a14', '#e8dcc0', '#ffffff', '#ffcf5a', '#ffe08a'] },
  abyss: { name: '심연', t: 3, p: ['#06040a', '#1e1030', '#7a5aa8', '#2e1e44', '#9a5aff'] },
  sun: { name: '태양', t: 3, p: ['#4a1e08', '#e86a1a', '#ffe0a0', '#ffb030', '#ffd060'] },
  aurora: { name: '극광', t: 3, p: ['#06141e', '#1a5a6a', '#bff8e8', '#5ac8c0', '#6affd8'] },
  // 전설
  dragon: { name: '용린', t: 4, p: ['#1a0604', '#8a1a0a', '#ffb070', '#d8902a', '#ff7a1a'], motes: 'ember' },
  stars: { name: '별무리', t: 4, p: ['#04061a', '#141a4a', '#c8d0ff', '#8a90d0', '#ffffff'], motes: 'star' },
  spectre: { name: '유령', t: 4, p: ['#0a2a2a', '#3ac8c0', '#e0ffff', '#8ae8e0', '#8afff0'], motes: 'wisp', spectral: true },
  // 초전설
  sacred: { name: '성화', t: 5, p: ['#3a2410', '#fff4e0', '#ffffff', '#ffd27a', '#fff0b0'], motes: 'ember', halo: true, flame: '#ffb347' },
  voidking: { name: '공허왕', t: 5, p: ['#020104', '#0e0816', '#4a2a7a', '#1a1028', '#c07aff'], motes: 'shard', halo: true, flame: '#9a5aff' },
  celestial: { name: '천상', t: 5, p: ['#0e1240', '#2a3ab8', '#aab8ff', '#ffd27a', '#ffffff'], motes: 'star', halo: true, prism: true },
};
const BY_TIER = [0, 1, 2, 3, 4, 5].map(t => Object.keys(THEMES).filter(k => THEMES[k].t === t));

// two skins per hero, tiers spread by hero rarity
function tiersFor(h, i) {
  if (h.rarity >= 6) return [i % 2 ? 3 : 4, i % 2 ? 5 : (i % 4 === 0 ? 5 : 4)];
  if (h.rarity === 5) return [i % 2 ? 1 : 2, i % 4 === 0 ? 4 : 3];
  return [i % 2 ? 0 : 1, i % 7 === 0 ? 4 : i % 3 === 0 ? 3 : 2];
}
export const SKINS = [];
// a few top-tier skins matched to the hero's story
const PICK = { serenia_2: 'celestial', luna_2: 'celestial', karnok_2: 'voidking', celes_2: 'voidking', lumen_2: 'sacred' };
const rr = [0, 0, 0, 0, 0, 0]; // round-robin through each tier's themes so they spread evenly
HEROES.forEach((h, i) => {
  const ts = tiersFor(h, i);
  ts.forEach((t, k) => {
    const pool = BY_TIER[t], theme = PICK[`${h.id}_${k + 1}`] || pool[(rr[t]++ + i) % pool.length];
    SKINS.push({ id: `${h.id}_${k + 1}`, hero: h.id, k: k + 1, tier: t, theme, name: `${THEMES[theme].name} ${h.name}` });
  });
});
export const SKIN_MAP = Object.fromEntries(SKINS.map(s => [s.id, s]));
export const skinsOf = (hero) => SKINS.filter(s => s.hero === hero);

// ---------------- applying a skin ----------------
const tmp = { h: 0, s: 0, l: 0 };
const isSkinTone = (c) => { c.getHSL(tmp); return tmp.h > 0.025 && tmp.h < 0.1 && tmp.s > 0.25 && tmp.s < 0.65 && tmp.l > 0.5 && tmp.l < 0.8; };
const matCache = new Map();
function recolor(mat, th, skinId) {
  const key = mat.uuid + skinId;
  if (matCache.has(key)) return matCache.get(key);
  const m = mat.clone(); m.userData = { ...mat.userData };
  if (mat.onBeforeCompile) { m.onBeforeCompile = mat.onBeforeCompile; m.customProgramCacheKey = mat.customProgramCacheKey; }
  const P = th.p.map(c => new THREE.Color(c));
  const glowing = m.emissive && m.emissiveIntensity > 0.5 && (m.emissive.r + m.emissive.g + m.emissive.b) > 0.3;
  if (glowing) { m.color.copy(P[4]); m.emissive.copy(P[4]); }
  else if (m.color) {
    if (!(isSkinTone(m.color) && !th.spectral)) {
      m.color.getHSL(tmp); const l = tmp.l;
      const band = m.metalness > 0.5 ? 3 : l < 0.2 ? 0 : l < 0.55 ? 1 : 2;
      // pale parts take a tint between main and light, so even white robes change colour
      const tgt = band === 2 ? P[1].clone().lerp(P[2], 0.55) : P[band].clone(); const tl = { h: 0, s: 0, l: 0 }; tgt.getHSL(tl);
      tgt.setHSL(tl.h, tl.s, Math.min(0.92, tl.l * 0.75 + l * 0.25));
      m.color.copy(tgt);
      if (th.t >= 4 && band !== 2) { m.emissive = P[4].clone(); m.emissiveIntensity = th.t >= 5 ? 0.16 : 0.08; }
    }
  }
  if (th.spectral) { m.transparent = true; m.opacity = Math.min(m.opacity, 0.62); m.depthWrite = false; m.emissive = P[4].clone(); m.emissiveIntensity = Math.max(m.emissiveIntensity || 0, 0.35); }
  m.needsUpdate = true;
  matCache.set(key, m);
  return m;
}

function glowMat(c, i = 2.5, op = 1) { return new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, roughness: 0.4, transparent: op < 1, opacity: op, depthWrite: op >= 1 }); }

// recolour every not-yet-skinned mesh under obj (used for first-person arms)
export function skinObject(obj, skinId) {
  const S = SKIN_MAP[skinId]; if (!S) return;
  const th = THEMES[S.theme];
  // leave effect layers (textured, additive or see-through: rune rings, flashes, orbs) alone
  obj.traverse(o => {
    if (!o.isMesh || o.userData.skinDone || o.userData.skinFx) return;
    const m = o.material; if (!m || Array.isArray(m) || m.map || m.transparent || m.blending !== THREE.NormalBlending) return;
    o.material = recolor(m, th, skinId); o.userData.skinDone = skinId;
  });
}

export function applySkin(P, skinId) {
  const S = SKIN_MAP[skinId]; if (!S) return P;
  const th = THEMES[S.theme];
  P.root.traverse(o => {
    if (!o.isMesh || o.userData.skinFx) return;
    if (o.userData.skinDone) return;
    o.material = recolor(o.material, th, skinId);
    o.userData.baseMat = o.material; o.userData.skinDone = skinId;
  });
  P.skin = skinId;
  const glow = new THREE.Color(th.p[4]);
  const fx = new THREE.Group(); fx.userData.skinFx = true; P.root.add(fx);
  const mark = (m) => { m.userData.skinFx = true; m.traverse?.(c => { c.userData.skinFx = true; }); return m; };
  const t = S.tier, sc = P.def?.scale || 1;
  // 희귀+: a faint ring at the feet
  if (t >= 2) {
    const ring = mark(new THREE.Mesh(new THREE.RingGeometry(0.55 * sc, 0.62 * sc, 40), glowMat(glow, t >= 4 ? 2.2 : 1.4, t >= 3 ? 0.85 : 0.5)));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; ring.material.side = THREE.DoubleSide; fx.add(ring);
    if (t >= 3) {
      // rune ticks around the ring
      const ticks = new THREE.Group(); fx.add(ticks);
      for (let i = 0; i < 12; i++) { const b = mark(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.006, 0.12), glowMat(glow, 2))); const a = i / 12 * Math.PI * 2; b.position.set(Math.cos(a) * 0.72 * sc, 0.03, Math.sin(a) * 0.72 * sc); b.rotation.y = -a; ticks.add(b); }
      P.update.push((tt) => { ticks.rotation.y = tt * 0.4; ring.material.opacity = 0.7 + Math.sin(tt * 2) * 0.15; });
    }
  }
  // 전설+: drifting motes around the body
  if (t >= 4) {
    const motes = new THREE.Group(); fx.add(motes);
    const geo = th.motes === 'shard' ? new THREE.OctahedronGeometry(0.045, 0) : th.motes === 'star' ? new THREE.OctahedronGeometry(0.03, 0) : new THREE.IcosahedronGeometry(0.03, 0);
    const n = t >= 5 ? 16 : 10, list = [];
    for (let i = 0; i < n; i++) { const m = mark(new THREE.Mesh(geo, glowMat(th.motes === 'ember' ? new THREE.Color(th.flame || '#ff7a1a') : glow, 3))); motes.add(m); list.push({ m, a: i / n * Math.PI * 2, r: (0.5 + (i % 3) * 0.12) * sc, y: (0.3 + (i * 0.37) % 1.6) * sc, sp: 0.6 + (i % 4) * 0.2 }); }
    P.update.push((tt) => { for (const q of list) { const a = q.a + tt * q.sp * (th.motes === 'ember' ? 0.6 : 0.4); const y = th.motes === 'ember' ? ((q.y + tt * 0.35) % (1.9 * sc)) : q.y + Math.sin(tt * 1.3 + q.a) * 0.08; q.m.position.set(Math.cos(a) * q.r, y, Math.sin(a) * q.r); q.m.rotation.y = tt * 2; const f = th.motes === 'ember' ? 1 - y / (1.9 * sc) : 1; q.m.scale.setScalar(0.4 + f * 0.8); } });
  }
  // 초전설: a halo above the head, a flame or prism shimmer
  if (t >= 5 && th.halo && P.head) {
    const halo = mark(new THREE.Group()); P.head.add(halo); halo.position.set(0, 0.3, -0.04);
    halo.add(mark(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 6, 32), glowMat(glow, 3.2))));
    for (let i = 0; i < 8; i++) { const sp = mark(new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.07, 4), glowMat(glow, 3))); const a = i / 8 * Math.PI * 2; sp.position.set(Math.cos(a) * 0.2, Math.sin(a) * 0.2, 0); sp.rotation.z = a - Math.PI / 2; halo.add(sp); }
    halo.rotation.x = -Math.PI / 2 + 0.25;
    P.update.push((tt) => { halo.rotation.z = tt * 0.8; halo.position.y = 0.3 + Math.sin(tt * 1.6) * 0.02; });
    if (th.flame) {
      const fl = new THREE.Group(); fx.add(fl); const cones = [];
      for (let i = 0; i < 9; i++) { const c = mark(new THREE.Mesh(new THREE.ConeGeometry(0.08 * sc, 0.5 * sc, 5), glowMat(new THREE.Color(th.flame), 2.6, 0.55))); const a = i / 9 * Math.PI * 2; c.position.set(Math.cos(a) * 0.45 * sc, 0.2 * sc, Math.sin(a) * 0.45 * sc); fl.add(c); cones.push(c); }
      P.update.push((tt) => { cones.forEach((c, i) => { const k = 0.7 + Math.abs(Math.sin(tt * 6 + i * 1.7)) * 0.6; c.scale.set(1, k, 1); c.position.y = 0.15 * sc + k * 0.12 * sc; }); fl.rotation.y = tt * 0.5; });
    }
    if (th.prism) {
      const c = new THREE.Color();
      P.update.push((tt) => { c.setHSL((tt * 0.08) % 1, 0.9, 0.55); P.root.traverse(o => { if (o.isMesh && !o.userData.skinFx && o.material.emissive && o.material.emissiveIntensity < 0.5) { o.material.emissive.copy(c); o.material.emissiveIntensity = 0.1; } }); });
    }
  }
  return P;
}
