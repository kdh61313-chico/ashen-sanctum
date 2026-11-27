// Skins: two per hero, 128 in all, each its own idea: a name, a palette and a set of
// pieces added to the body (crowns, horns, wings, lanterns, veils...). From 영웅 tier up the
// hero's skill effects take the skin's colours too.
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

// palette styles: [saturation, lightness] for dark / main / light / metal, then glow
const GOLD = '#d8a84a', BRONZE = '#9a6a3a';
const STYLES = {
  noir: [[0.1, 0.06], [0.3, 0.15], [0.42, 0.42], [0.25, 0.3]],
  royal: [[0.6, 0.12], [0.62, 0.32], [0.5, 0.78], GOLD],
  pastel: [[0.3, 0.3], [0.45, 0.66], [0.5, 0.88], [0.15, 0.76]],
  metal: [[0.15, 0.12], [0.22, 0.4], [0.2, 0.8], [0.12, 0.7]],
  vivid: [[0.7, 0.15], [0.85, 0.44], [0.7, 0.8], [0.5, 0.55]],
  earth: [[0.3, 0.1], [0.36, 0.3], [0.3, 0.64], BRONZE],
  bone: [[0.12, 0.2], [0.14, 0.78], [0.08, 0.93], [0.15, 0.5]],
  gilded: [[0.45, 0.08], [0.55, 0.22], [0.6, 0.72], GOLD],
  spectral: [[0.4, 0.2], [0.55, 0.55], [0.5, 0.86], [0.4, 0.7]],
};
const SRGB = THREE.SRGBColorSpace;
const hsl = (h, s, l) => '#' + new THREE.Color().setHSL((((h % 360) + 360) % 360) / 360, s, l, SRGB).getHexString();
function palette(hue, style, glowHue) {
  const S = STYLES[style] || STYLES.metal;
  const p = S.map(x => typeof x === 'string' ? x : hsl(hue, x[0], x[1]));
  p.push(hsl(glowHue, 1, style === 'bone' || style === 'pastel' ? 0.68 : 0.6));
  return p;
}

// hero -> two skins: [name, tier, hue, style, glow hue, pieces, extra]
// extra: motes ('ember' | 'star' | 'wisp' | 'shard' | 'spark'), flame colour, prism, spectral
const DEFS = {
  valok: [['눈보라 순찰대', 1, 205, 'metal', 190, ['mantle', 'plume']], ['검은 왕관 집행관', 4, 0, 'noir', 350, ['crown', 'pauldrons', 'banner'], { motes: 'ember' }]],
  nir: [['모래바람 자객', 2, 35, 'earth', 40, ['scarf', 'mask']], ['달그림자 여우', 3, 270, 'noir', 300, ['tail', 'mask', 'orbs']]],
  igna: [['호박등 축제', 1, 28, 'vivid', 35, ['lantern', 'flowers']], ['청염의 마녀', 4, 215, 'royal', 200, ['runes', 'circlet'], { motes: 'wisp' }]],
  selene: [['가을 숲 사냥꾼', 0, 25, 'earth', 45, ['hood', 'quiver']], ['오로라 추적자', 3, 170, 'pastel', 160, ['antlers', 'scarf']]],
  mor: [['촛농 수도사', 1, 40, 'bone', 45, ['hood', 'lantern']], ['저승 뱃사공', 2, 190, 'noir', 175, ['veil', 'chains']]],
  grom: [['이끼 덮인 묘지기', 0, 95, 'earth', 110, ['mantle']], ['해골 왕관 파수꾼', 3, 50, 'bone', 60, ['crown', 'chains']]],
  razel: [['바닷바람 술사', 1, 195, 'pastel', 185, ['scarf', 'circlet']], ['적뢰의 군주', 4, 355, 'noir', 0, ['horns', 'runes', 'energywings'], { motes: 'spark' }]],
  veyla: [['장미 정원 무도회', 2, 330, 'royal', 340, ['flowers', 'mantle']], ['은월 사교계', 3, 230, 'metal', 220, ['batwings', 'circlet']]],
  kael: [['새벽 견습 기사', 1, 45, 'pastel', 50, ['sash', 'plume']], ['청동 수호상', 2, 30, 'earth', 170, ['pauldrons', 'gem']]],
  onyx: [['양귀비 약제사', 0, 0, 'earth', 10, ['flowers', 'lantern']], ['유리병 연금술사', 2, 140, 'vivid', 120, ['shards', 'sash']]],
  sira: [['심해 소환사', 3, 205, 'noir', 185, ['veil', 'orbs']], ['사건의 지평선', 5, 265, 'noir', 280, ['runes', 'halo', 'shards'], { motes: 'shard', flame: '#9a5aff' }]],
  ulfric: [['설원 늑대', 1, 210, 'bone', 200, ['mantle', 'tail']], ['화산 늑대', 3, 15, 'noir', 25, ['horns', 'tail', 'chains']]],
  hark: [['사막 유골', 0, 38, 'bone', 30, ['scarf']], ['수정 해골', 3, 185, 'pastel', 180, ['shards', 'crown']]],
  eris: [['해바라기 점성술사', 2, 48, 'vivid', 50, ['flowers', 'circlet']], ['혜성의 길', 4, 220, 'royal', 200, ['orbs', 'scarf', 'energywings'], { motes: 'star' }]],
  azrak: [['흑요 용기사', 4, 270, 'noir', 285, ['horns', 'pauldrons', 'tail'], { motes: 'ember', flame: '#b07aff' }], ['황금 용왕', 5, 42, 'gilded', 45, ['crown', 'batwings', 'tail'], { motes: 'ember', flame: '#ffb347' }]],
  lian: [['깨진 거울 광대', 3, 300, 'pastel', 320, ['mask', 'plume']], ['만화경', 5, 180, 'pastel', 0, ['shards', 'orbs', 'veil'], { motes: 'star', prism: true }]],
  nox: [['흰까마귀', 2, 220, 'bone', 200, ['plume', 'mantle']], ['역병 까마귀 왕', 3, 100, 'noir', 90, ['crown', 'wings']]],
  tyr: [['구리 풀무', 0, 22, 'earth', 25, ['sash']], ['얼음 모루', 2, 195, 'metal', 190, ['runes', 'pauldrons']]],
  seraph: [['구원받은 천사', 4, 48, 'bone', 50, ['wings', 'halo'], { motes: 'star' }], ['재가 된 날개', 5, 10, 'noir', 20, ['wings', 'horns', 'chains'], { motes: 'ember', flame: '#ff6a2a' }]],
  belladonna: [['버섯 숲 마녀', 1, 10, 'earth', 330, ['flowers', 'hood']], ['반딧불 늪', 3, 80, 'noir', 70, ['lantern', 'orbs']]],
  grave: [['석양 무법자', 0, 20, 'earth', 30, ['scarf']], ['망령 보안관', 3, 175, 'spectral', 170, ['mask', 'chains']]],
  bark: [['갈대밭 오리 사냥꾼', 1, 70, 'earth', 60, ['hood']], ['포경선 작살꾼', 2, 205, 'metal', 200, ['scarf', 'lantern']]],
  elise: [['눈꽃 저격수', 3, 200, 'pastel', 195, ['hood', 'scarf']], ['여명의 사수', 4, 30, 'royal', 40, ['plume', 'energywings', 'circlet'], { motes: 'star' }]],
  karman: [['광산 화약병', 0, 30, 'earth', 35, ['lantern']], ['불꽃놀이 장인', 2, 320, 'vivid', 50, ['orbs', 'sash']]],
  mira: [['증기 정비공', 1, 30, 'earth', 35, ['gem', 'sash']], ['백자 태엽 인형', 3, 210, 'bone', 200, ['circlet', 'runes']]],
  rowan: [['사막 추적자', 2, 35, 'earth', 30, ['scarf', 'quiver']], ['밤의 수배범', 4, 0, 'noir', 355, ['mask', 'mantle', 'chains'], { motes: 'wisp' }]],
  helga: [['촛불 수녀', 1, 45, 'bone', 40, ['veil', 'lantern']], ['흑철 이단심문관', 3, 10, 'metal', 15, ['halo', 'pauldrons']]],
  zeno: [['근위대 의장병', 1, 0, 'royal', 45, ['plume', 'sash']], ['시계탑 총사', 3, 40, 'gilded', 45, ['runes', 'mantle']]],
  nocturne: [['도시 야경꾼', 0, 230, 'earth', 210, ['hood']], ['보랏빛 망령', 3, 280, 'spectral', 290, ['veil', 'orbs']]],
  talon: [['심해 잠수부', 3, 190, 'metal', 180, ['gem', 'pauldrons']], ['거신의 팔', 5, 25, 'gilded', 30, ['crown', 'pauldrons', 'runes'], { motes: 'ember', flame: '#ff8a2a' }]],
  iris: [['벚꽃 검무', 2, 340, 'pastel', 345, ['flowers', 'scarf']], ['청자 연꽃', 3, 165, 'pastel', 170, ['circlet', 'energywings']]],
  moloch: [['산호초 거인', 1, 15, 'vivid', 190, ['shards']], ['용암 심장', 3, 15, 'noir', 25, ['horns', 'gem']]],
  sien: [['복숭아꽃 무녀', 0, 345, 'pastel', 340, ['flowers']], ['초승달 신녀', 3, 235, 'royal', 220, ['halo', 'veil']]],
  crow: [['광장 고수형리', 1, 0, 'earth', 10, ['hood', 'chains']], ['서리 교수대', 4, 200, 'noir', 195, ['mask', 'chains', 'mantle'], { motes: 'wisp' }]],
  aura: [['해풍 창병', 2, 190, 'metal', 185, ['plume', 'sash']], ['천둥새 기수', 4, 50, 'royal', 55, ['wings', 'plume', 'scarf'], { motes: 'spark' }]],
  mariette: [['서커스 단장', 1, 355, 'vivid', 45, ['plume', 'sash']], ['도자기 인형의 밤', 3, 300, 'bone', 310, ['mask', 'orbs']]],
  bael: [['얼어붙은 지옥', 4, 200, 'noir', 195, ['horns', 'pauldrons', 'chains'], { motes: 'wisp' }], ['심판의 날', 5, 45, 'gilded', 50, ['halo', 'wings', 'pauldrons'], { motes: 'star', flame: '#ffd27a' }]],
  luna: [['봄눈 녹는 정원', 3, 120, 'pastel', 140, ['flowers', 'circlet']], ['극야의 여왕', 5, 230, 'noir', 195, ['crown', 'veil', 'shards'], { motes: 'star', prism: true }]],
  veronica: [['백합 성녀', 2, 200, 'bone', 210, ['flowers', 'veil']], ['홍옥 순교자', 4, 350, 'royal', 355, ['halo', 'mantle', 'orbs'], { motes: 'ember', flame: '#ff3a4a' }]],
  jack: [['호박 머리 장난꾼', 1, 30, 'vivid', 35, ['lantern', 'scarf']], ['네온 폭파범', 2, 300, 'vivid', 175, ['mask', 'orbs']]],
  kaira: [['물빛 무희', 2, 195, 'pastel', 190, ['scarf', 'flowers']], ['태양 제전', 4, 40, 'gilded', 35, ['crown', 'energywings', 'orbs'], { motes: 'ember' }]],
  brann: [['빙하 이끼', 0, 150, 'earth', 160, ['mantle']], ['오로라 거인', 3, 165, 'noir', 150, ['shards', 'runes']]],
  vesper: [['황혼의 사제', 3, 280, 'royal', 25, ['halo', 'mantle']], ['첫 햇살', 5, 40, 'bone', 45, ['wings', 'halo', 'orbs'], { motes: 'star', flame: '#ffe08a' }]],
  orin: [['구리 시계공', 1, 28, 'earth', 40, ['gem', 'lantern']], ['하늘 비행사', 3, 205, 'pastel', 40, ['scarf', 'energywings']]],
  thalia: [['민들레 궁수', 1, 55, 'pastel', 60, ['flowers', 'quiver']], ['태풍의 눈', 3, 175, 'vivid', 180, ['scarf', 'energywings', 'plume']]],
  gorm: [['산호 주술사', 1, 10, 'vivid', 15, ['mask']], ['뼈 토템', 2, 40, 'bone', 90, ['antlers', 'chains']]],
  hyeon: [['청죽 검객', 3, 140, 'earth', 150, ['scarf', 'hood']], ['천둥신', 5, 230, 'royal', 205, ['runes', 'halo', 'energywings'], { motes: 'spark', flame: '#9fd0ff' }]],
  nyx: [['별사탕 마녀', 2, 320, 'pastel', 300, ['orbs', 'circlet']], ['검은 해일', 3, 200, 'noir', 185, ['veil', 'tail']]],
  ragna: [['피 묻은 눈', 1, 0, 'bone', 355, ['mantle']], ['빙룡 사냥꾼', 4, 195, 'metal', 190, ['horns', 'pauldrons', 'tail'], { motes: 'wisp' }]],
  pell: [['꿀단지 양봉가', 0, 42, 'vivid', 45, ['hood']], ['여왕벌 친위대', 3, 50, 'gilded', 50, ['crown', 'energywings']]],
  surtr: [['현무암', 1, 220, 'earth', 20, ['shards']], ['청동 거신상', 3, 35, 'gilded', 170, ['runes', 'crown']]],
  celes: [['은하 도서관', 4, 250, 'royal', 45, ['orbs', 'scarf', 'circlet'], { motes: 'star' }], ['사라진 별자리', 5, 270, 'noir', 300, ['runes', 'halo', 'shards'], { motes: 'shard', flame: '#c07aff' }]],
  dorn: [['은빛 맹세', 1, 210, 'metal', 200, ['plume']], ['태양 서약', 2, 40, 'gilded', 45, ['halo', 'pauldrons']]],
  koru: [['눈밭 사냥꾼', 0, 210, 'bone', 200, ['hood', 'mantle']], ['붉은 망토 사냥꾼', 2, 0, 'vivid', 10, ['mantle', 'quiver']]],
  maren: [['진주 무녀', 2, 300, 'bone', 290, ['circlet', 'orbs']], ['심해 해파리', 4, 190, 'spectral', 185, ['veil', 'tail', 'orbs'], { motes: 'wisp' }]],
  garrick: [['녹슨 열쇠', 0, 25, 'earth', 30, ['chains']], ['감옥섬 간수장', 3, 215, 'metal', 200, ['lantern', 'pauldrons', 'chains']]],
  zephyr: [['초원 기수', 1, 90, 'earth', 80, ['scarf', 'plume']], ['청뢰 기수', 3, 220, 'vivid', 210, ['energywings', 'scarf']]],
  lumen: [['일식', 4, 270, 'noir', 40, ['halo', 'mantle', 'orbs'], { motes: 'ember' }], ['정오의 성화', 5, 45, 'bone', 40, ['crown', 'wings', 'halo'], { motes: 'ember', flame: '#ffb347' }]],
  frey: [['벚꽃 결투가', 1, 345, 'pastel', 340, ['flowers', 'sash']], ['빙화 귀족', 2, 200, 'royal', 195, ['mantle', 'circlet']]],
  asha: [['모래시계 예언자', 0, 40, 'earth', 45, ['hood']], ['불사조의 재', 4, 20, 'royal', 25, ['wings', 'plume', 'orbs'], { motes: 'ember' }]],
  serenia: [['새벽별 직조공', 4, 30, 'pastel', 40, ['orbs', 'veil', 'circlet'], { motes: 'star' }], ['천구의 주인', 5, 230, 'royal', 210, ['halo', 'wings', 'runes'], { motes: 'star', prism: true }]],
  karnok: [['산호 심연', 3, 175, 'noir', 170, ['crown', 'tail']], ['공허왕', 5, 275, 'noir', 285, ['crown', 'horns', 'shards'], { motes: 'shard', flame: '#9a5aff' }]],
  mir: [['여름 소나기', 2, 150, 'pastel', 140, ['hood', 'scarf']], ['홍뢰 사냥꾼', 4, 350, 'noir', 0, ['plume', 'energywings', 'quiver'], { motes: 'spark' }]],
  osel: [['가을 정원', 2, 25, 'earth', 35, ['flowers', 'hood']], ['세계수의 싹', 4, 110, 'royal', 90, ['antlers', 'flowers', 'orbs'], { motes: 'wisp' }]],
};

export const SKINS = [];
for (const h of HEROES) {
  const two = DEFS[h.id]; if (!two) continue;
  two.forEach(([concept, tier, hue, style, glow, acc, x = {}], k) => {
    SKINS.push({ id: `${h.id}_${k + 1}`, hero: h.id, k: k + 1, tier, concept, name: `${concept} ${h.name}`, p: palette(hue, style, glow), acc, spectral: style === 'spectral', motes: x.motes || (tier >= 4 ? 'star' : null), flame: x.flame || null, prism: !!x.prism });
  });
}
export const SKIN_MAP = Object.fromEntries(SKINS.map(s => [s.id, s]));
export const skinsOf = (hero) => SKINS.filter(s => s.hero === hero);
// skill-effect colours for 영웅 and above: c = main glow, c2 = pale core
export function skinFx(id) { const s = SKIN_MAP[id]; return s && s.tier >= 3 ? { c: s.p[4], c2: s.p[2], tier: s.tier, flame: s.flame } : null; }

// ---------------- recolouring ----------------
const tmp = { h: 0, s: 0, l: 0 };
const isSkinTone = (c) => { c.getHSL(tmp, SRGB); return tmp.h > 0.025 && tmp.h < 0.1 && tmp.s > 0.2 && tmp.s < 0.7 && tmp.l > 0.55 && tmp.l < 0.85; };
const matCache = new Map();
function recolor(mat, S) {
  const key = mat.uuid + S.id;
  if (matCache.has(key)) return matCache.get(key);
  const m = mat.clone(); m.userData = { ...mat.userData };
  if (mat.onBeforeCompile) { m.onBeforeCompile = mat.onBeforeCompile; m.customProgramCacheKey = mat.customProgramCacheKey; }
  const P = S.p.map(c => new THREE.Color(c));
  const glowing = m.emissive && m.emissiveIntensity > 0.5 && (m.emissive.r + m.emissive.g + m.emissive.b) > 0.3;
  if (glowing) { m.color.copy(P[4]); m.emissive.copy(P[4]); }
  else if (m.color && !(isSkinTone(m.color) && !S.spectral)) {
    m.color.getHSL(tmp, SRGB); const l = tmp.l;
    const band = m.metalness > 0.5 ? 3 : l < 0.3 ? 0 : l < 0.68 ? 1 : 2;
    // pale parts take a tint between main and light, so even white robes change colour
    const tgt = band === 2 ? P[1].clone().lerp(P[2], 0.42) : P[band].clone(); const tl = { h: 0, s: 0, l: 0 }; tgt.getHSL(tl, SRGB);
    tgt.setHSL(tl.h, tl.s, Math.min(0.94, tl.l * 0.8 + l * 0.2), SRGB);
    m.color.copy(tgt);
    if (S.tier >= 4 && band !== 2) { m.emissive = P[4].clone(); m.emissiveIntensity = S.tier >= 5 ? 0.16 : 0.08; }
  }
  if (S.spectral) { m.transparent = true; m.opacity = Math.min(m.opacity, 0.62); m.depthWrite = false; m.emissive = P[4].clone(); m.emissiveIntensity = Math.max(m.emissiveIntensity || 0, 0.35); }
  m.needsUpdate = true;
  matCache.set(key, m);
  return m;
}

// recolour every not-yet-skinned mesh under obj (first-person arms); effect layers are left alone
export function skinObject(obj, skinId) {
  const S = SKIN_MAP[skinId]; if (!S) return;
  obj.traverse(o => {
    if (!o.isMesh || o.userData.skinDone || o.userData.skinFx) return;
    const m = o.material; if (!m || Array.isArray(m) || m.map || m.transparent || m.blending !== THREE.NormalBlending) return;
    o.material = recolor(m, S); o.userData.skinDone = skinId;
  });
}

// ---------------- pieces added to the body ----------------
const matC = new Map();
function mat(c, o = {}) {
  const k = c + JSON.stringify(o); if (matC.has(k)) return matC.get(k);
  const op = o.op ?? 1;
  const m = new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.6, metalness: o.m ?? 0.1, emissive: o.e || '#000000', emissiveIntensity: o.ei ?? 0, transparent: op < 1, opacity: op, depthWrite: op >= 1, side: o.ds ? THREE.DoubleSide : THREE.FrontSide, flatShading: true });
  matC.set(k, m); return m;
}
const glowM = (c, i = 2.5, op = 1) => mat(c, { e: c, ei: i, r: 0.4, op, ds: op < 1 });
function put(parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], sc) {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); if (sc) o.scale.set(...sc);
  o.castShadow = m.opacity >= 1; o.userData.skinFx = true; o.userData.skinDone = true; parent.add(o); return o;
}
function grp(parent, pos = [0, 0, 0], rot = [0, 0, 0]) { const g = new THREE.Group(); g.position.set(...pos); g.rotation.set(...rot); g.userData.skinFx = true; parent.add(g); return g; }

const PIECES = {
  crown(P, c) { const h = P.head; if (!h) return; const g = grp(h, [0, 0.16, 0]); put(g, new THREE.CylinderGeometry(0.13, 0.12, 0.05, 10, 1, true), mat(c.metal, { m: 0.85, r: 0.3, ds: true }));
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; put(g, new THREE.ConeGeometry(0.022, i % 2 ? 0.09 : 0.14, 4), mat(c.metal, { m: 0.85, r: 0.3 }), [Math.sin(a) * 0.125, 0.07, Math.cos(a) * 0.125]); }
    put(g, new THREE.OctahedronGeometry(0.03), glowM(c.glow, 2.6), [0, 0.02, 0.13]); },
  circlet(P, c) { const h = P.head; if (!h) return; put(h, new THREE.TorusGeometry(0.135, 0.01, 6, 24), mat(c.metal, { m: 0.9, r: 0.25 }), [0, 0.07, 0], [Math.PI / 2 - 0.15, 0, 0]); put(h, new THREE.OctahedronGeometry(0.025), glowM(c.glow, 3), [0, 0.09, 0.135]); },
  halo(P, c) { const h = P.head; if (!h) return; const g = grp(h, [0, 0.3, -0.06], [-0.25, 0, 0]); put(g, new THREE.TorusGeometry(0.17, 0.012, 6, 32), glowM(c.glow, 2.8), [0, 0, 0], [Math.PI / 2, 0, 0]); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; put(g, new THREE.OctahedronGeometry(0.018), glowM(c.glow, 3), [Math.cos(a) * 0.17, 0, Math.sin(a) * 0.17]); } P.update.push((t) => { g.rotation.y = t * 0.6; }); },
  horns(P, c) { const h = P.head; if (!h) return; for (const s of [-1, 1]) { const g = grp(h, [s * 0.1, 0.1, -0.02], [0, 0, -s * 0.5]); put(g, new THREE.ConeGeometry(0.035, 0.16, 5), mat(c.dark, { r: 0.4 }), [0, 0.07, 0]); const g2 = grp(g, [0, 0.14, 0], [0, 0, s * 0.9]); put(g2, new THREE.ConeGeometry(0.024, 0.13, 5), mat(c.light, { r: 0.4, e: c.glow, ei: 0.2 }), [0, 0.05, 0]); } },
  antlers(P, c) { const h = P.head; if (!h) return; for (const s of [-1, 1]) { const g = grp(h, [s * 0.08, 0.12, 0], [0, 0, -s * 0.35]); put(g, new THREE.CylinderGeometry(0.012, 0.018, 0.26, 5), mat(c.light), [0, 0.13, 0]); for (let i = 0; i < 3; i++) put(g, new THREE.CylinderGeometry(0.008, 0.012, 0.1, 5), mat(c.light), [s * 0.04, 0.08 + i * 0.07, 0], [0, 0, -s * 0.8]); put(g, new THREE.SphereGeometry(0.018, 6, 4), glowM(c.glow, 2), [0, 0.27, 0]); } },
  hood(P, c) { const h = P.head; if (!h) return; put(h, new THREE.SphereGeometry(0.17, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.62), mat(c.main, { r: 0.9, ds: true }), [0, 0.02, -0.025], [-0.25, 0, 0], [1, 1.05, 1.05]); },
  veil(P, c) { const h = P.head; if (!h) return; put(h, new THREE.ConeGeometry(0.2, 0.5, 12, 1, true), mat(c.light, { op: 0.45, ds: true, e: c.glow, ei: 0.2 }), [0, -0.06, -0.01]); },
  mask(P, c) { const h = P.head; if (!h) return; put(h, new THREE.BoxGeometry(0.2, 0.11, 0.03), mat(c.light, { r: 0.35, m: 0.3 }), [0, 0.02, 0.125]); for (const s of [-1, 1]) put(h, new THREE.BoxGeometry(0.05, 0.012, 0.01), glowM(c.glow, 3.4), [s * 0.045, 0.025, 0.142]); },
  plume(P, c) { const h = P.head; if (!h) return; const g = grp(h, [0, 0.15, -0.04], [-0.5, 0, 0]); for (let i = 0; i < 4; i++) put(g, new THREE.ConeGeometry(0.03, 0.26 - i * 0.03, 4), mat(i % 2 ? c.glow : c.main, { e: i % 2 ? c.glow : '#000000', ei: i % 2 ? 0.5 : 0 }), [0, 0.12, -i * 0.04], [-i * 0.18, 0, 0], [1, 1, 0.35]); },
  flowers(P, c) { const h = P.head; if (!h) return; for (let i = 0; i < 5; i++) { const a = -0.9 + i * 0.45; const f = grp(h, [Math.sin(a) * 0.13, 0.1 + Math.cos(i) * 0.02, Math.cos(a) * 0.05 - 0.02]); for (let k = 0; k < 5; k++) put(f, new THREE.SphereGeometry(0.022, 5, 4), mat(i % 2 ? c.light : c.glow, { e: c.glow, ei: 0.25 }), [Math.cos(k * 1.256) * 0.025, Math.sin(k * 1.256) * 0.025, 0], [0, 0, 0], [1, 1, 0.5]); put(f, new THREE.SphereGeometry(0.014, 5, 4), mat(c.metal), [0, 0, 0.01]); } },
  mantle(P, c) { const s = P.spine; if (!s) return; put(s, new THREE.TorusGeometry(0.17, 0.065, 6, 14), mat(c.light, { r: 0.95 }), [0, 0.53, -0.01], [Math.PI / 2, 0, 0], [1.15, 0.85, 1]); put(s, new THREE.BoxGeometry(0.46, 0.75, 0.03), mat(c.main, { r: 0.9, ds: true }), [0, 0.18, -0.17], [0.12, 0, 0]); },
  scarf(P, c) { const s = P.spine; if (!s) return; put(s, new THREE.TorusGeometry(0.11, 0.04, 6, 12), mat(c.glow, { r: 0.9, e: c.glow, ei: 0.15 }), [0, 0.56, 0], [Math.PI / 2, 0, 0]); const tail = grp(s, [0.06, 0.55, -0.12]); for (let i = 0; i < 4; i++) put(tail, new THREE.BoxGeometry(0.09, 0.12, 0.012), mat(c.glow, { r: 0.9, e: c.glow, ei: 0.15, ds: true }), [i * 0.03, -i * 0.1, -i * 0.05], [0.5, 0, -0.2]); P.update.push((t) => { tail.rotation.x = 0.2 + Math.sin(t * 3.1) * 0.15; tail.rotation.z = Math.sin(t * 2.3) * 0.12; }); },
  pauldrons(P, c) { for (const side of [-1, 1]) { const sh = side < 0 ? P.shL : P.shR; if (!sh) continue; put(sh, new THREE.IcosahedronGeometry(0.12, 0), mat(c.metal, { m: 0.8, r: 0.3 }), [side * 0.04, 0.05, 0], [0, 0, side * 0.35], [1.3, 0.75, 1.15]); for (let i = 0; i < 2; i++) put(sh, new THREE.ConeGeometry(0.025, 0.16, 4), mat(c.dark, { r: 0.4 }), [side * (0.05 + i * 0.05), 0.15, (i - 0.5) * 0.08], [0, 0, side * -0.45]); put(sh, new THREE.OctahedronGeometry(0.02), glowM(c.glow, 2.5), [side * 0.11, 0.06, 0.08]); } },
  wings(P, c) { const s = P.spine; if (!s) return; for (const side of [-1, 1]) { const w = grp(s, [side * 0.1, 0.42, -0.18], [0.2, side * 0.5, side * 0.35]); for (let i = 0; i < 6; i++) put(w, new THREE.BoxGeometry(0.08, 0.6 - i * 0.07, 0.015), mat(i < 2 ? c.glow : c.light, { e: c.glow, ei: i < 2 ? 0.6 : 0.12, ds: true }), [side * (0.08 + i * 0.09), 0.12 - i * 0.05, 0], [0, 0, side * (-0.6 - i * 0.12)]); P.update.push((t) => { w.rotation.y = side * (0.5 + Math.sin(t * 1.6) * 0.12); }); } },
  batwings(P, c) { const s = P.spine; if (!s) return; for (const side of [-1, 1]) { const w = grp(s, [side * 0.1, 0.42, -0.18], [0.15, side * 0.55, 0]); const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(side * 0.7, 0.35); shape.lineTo(side * 0.6, 0.05); shape.lineTo(side * 0.5, -0.12); shape.lineTo(side * 0.32, -0.02); shape.lineTo(side * 0.2, -0.2); shape.lineTo(0, -0.1);
      put(w, new THREE.ShapeGeometry(shape), mat(c.dark, { r: 0.6, ds: true, e: c.glow, ei: 0.08 })); put(w, new THREE.CylinderGeometry(0.012, 0.012, 0.78, 5), mat(c.metal), [side * 0.35, 0.18, 0.01], [0, 0, side * -1.1]);
      P.update.push((t) => { w.rotation.y = side * (0.55 + Math.sin(t * 2) * 0.15); }); } },
  energywings(P, c) { const s = P.spine; if (!s) return; for (const side of [-1, 1]) { const w = grp(s, [side * 0.08, 0.4, -0.2], [0.1, side * 0.4, 0]); for (let i = 0; i < 3; i++) { const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.quadraticCurveTo(side * 0.35, 0.5 - i * 0.15, side * (0.75 - i * 0.12), 0.25 - i * 0.22); shape.quadraticCurveTo(side * 0.3, 0.05 - i * 0.05, 0, 0); put(w, new THREE.ShapeGeometry(shape, 8), glowM(c.glow, 1.8, 0.45 - i * 0.08)); }
      P.update.push((t) => { w.rotation.y = side * (0.4 + Math.sin(t * 2.4) * 0.18); }); } },
  tail(P, c) { const hp = P.hips; if (!hp) return; let par = grp(hp, [0, -0.02, -0.14], [0.9, 0, 0]); const segs = []; for (let i = 0; i < 5; i++) { put(par, new THREE.ConeGeometry(0.06 - i * 0.009, 0.16, 6), mat(i === 4 ? c.glow : c.main, { e: i === 4 ? c.glow : '#000000', ei: i === 4 ? 1.2 : 0 }), [0, 0.07, 0]); const nx = grp(par, [0, 0.14, 0], [0.25, 0, 0]); segs.push(nx); par = nx; }
    P.update.push((t) => segs.forEach((g, i) => { g.rotation.z = Math.sin(t * 2.6 - i * 0.6) * 0.25; })); },
  banner(P, c) { const s = P.spine; if (!s) return; const g = grp(s, [0.12, 0.2, -0.2], [0, 0, -0.12]); put(g, new THREE.CylinderGeometry(0.015, 0.015, 1.3, 6), mat(c.metal, { m: 0.8 }), [0, 0.45, 0]); const fl = grp(g, [0, 1.05, 0]); put(fl, new THREE.BoxGeometry(0.34, 0.42, 0.01), mat(c.main, { ds: true, r: 0.9 }), [-0.18, -0.2, 0]); put(fl, new THREE.OctahedronGeometry(0.05), glowM(c.glow, 2), [-0.18, -0.18, 0.012], [0, 0, 0], [1, 1, 0.2]); P.update.push((t) => { fl.rotation.y = Math.sin(t * 2) * 0.25; }); },
  orbs(P, c) { const h = P.head; if (!h) return; const g = grp(h, [0, 0.05, 0]); const os = []; for (let i = 0; i < 3; i++) os.push(put(g, new THREE.IcosahedronGeometry(0.035, 1), glowM(c.glow, 3))); P.update.push((t) => os.forEach((o, i) => { const a = t * 1.4 + i * 2.09; o.position.set(Math.cos(a) * 0.3, Math.sin(t * 2 + i) * 0.06, Math.sin(a) * 0.3); })); },
  runes(P, c) { const s = P.spine; if (!s) return; const g = grp(s, [0, 0.4, -0.3]); put(g, new THREE.TorusGeometry(0.32, 0.008, 4, 40), glowM(c.glow, 2.2, 0.8)); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; put(g, new THREE.BoxGeometry(0.05, 0.05, 0.008), glowM(c.glow, 2.6), [Math.cos(a) * 0.32, Math.sin(a) * 0.32, 0], [0, 0, a + 0.78]); } P.update.push((t) => { g.rotation.z = t * 0.5; }); },
  shards(P, c) { for (const side of [-1, 1]) { const sh = side < 0 ? P.shL : P.shR; if (!sh) continue; const g = grp(sh, [side * 0.12, 0.25, -0.05]); for (let i = 0; i < 3; i++) put(g, new THREE.OctahedronGeometry(0.04 + i * 0.012), glowM(i ? c.light : c.glow, i ? 0.6 : 2.4, 0.9), [side * i * 0.04, i * 0.09, -i * 0.03], [0, 0, 0], [0.6, 1.6, 0.6]); P.update.push((t) => { g.position.y = 0.25 + Math.sin(t * 1.8 + side) * 0.04; g.rotation.y = t * side; }); } },
  chains(P, c) { const hp = P.hips; if (!hp) return; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; put(hp, new THREE.TorusGeometry(0.03, 0.009, 4, 8), mat(c.metal, { m: 0.9, r: 0.35 }), [Math.sin(a) * 0.21, 0.02 - Math.abs(Math.sin(a * 0.5)) * 0.05, Math.cos(a) * 0.16], [0, a, i % 2 ? Math.PI / 2 : 0]); } },
  lantern(P, c) { const hp = P.hips; if (!hp) return; const g = grp(hp, [-0.21, -0.05, 0.05]); put(g, new THREE.CylinderGeometry(0.004, 0.004, 0.1, 4), mat(c.metal), [0, 0.02, 0]); put(g, new THREE.CylinderGeometry(0.045, 0.05, 0.11, 6), glowM(c.glow, 2.2), [0, -0.08, 0]); put(g, new THREE.ConeGeometry(0.06, 0.04, 6), mat(c.metal, { m: 0.8 }), [0, -0.01, 0]); P.update.push((t) => { g.rotation.z = Math.sin(t * 3) * 0.12; }); },
  sash(P, c) { const hp = P.hips; if (!hp) return; put(hp, new THREE.BoxGeometry(0.16, 0.42, 0.012), mat(c.main, { r: 0.9, ds: true }), [0, -0.2, 0.135]); put(hp, new THREE.BoxGeometry(0.17, 0.03, 0.014), mat(c.metal, { m: 0.8 }), [0, -0.38, 0.137]); put(hp, new THREE.OctahedronGeometry(0.025), glowM(c.glow, 2), [0, -0.08, 0.145]); },
  quiver(P, c) { const s = P.spine; if (!s) return; const g = grp(s, [0.08, 0.3, -0.16], [0, 0, 0.45]); put(g, new THREE.CylinderGeometry(0.05, 0.045, 0.42, 7), mat(c.main, { r: 0.8 })); for (let i = 0; i < 4; i++) put(g, new THREE.ConeGeometry(0.018, 0.07, 3), mat(c.glow, { e: c.glow, ei: 0.5 }), [(i - 1.5) * 0.02, 0.25, 0]); },
  gem(P, c) { const s = P.spine; if (!s) return; put(s, new THREE.OctahedronGeometry(0.05), glowM(c.glow, 3), [0, 0.38, 0.14], [0, 0, 0], [0.8, 1.2, 0.5]); put(s, new THREE.TorusGeometry(0.06, 0.012, 4, 12), mat(c.metal, { m: 0.85 }), [0, 0.38, 0.13]); },
};
export const PIECE_NAMES = { crown: '왕관', circlet: '머리띠', halo: '후광', horns: '뿔', antlers: '사슴뿔', hood: '두건', veil: '면사포', mask: '가면', plume: '깃털 장식', flowers: '꽃 장식', mantle: '털 망토', scarf: '스카프', pauldrons: '견갑', wings: '날개', batwings: '박쥐 날개', energywings: '빛 날개', tail: '꼬리', banner: '깃발', orbs: '떠도는 구슬', runes: '룬 고리', shards: '수정 조각', chains: '사슬', lantern: '등불', sash: '앞치마', quiver: '화살통', gem: '가슴 보석' };

function glowMat(c, i = 2.5, op = 1) { return new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, roughness: 0.4, transparent: op < 1, opacity: op, depthWrite: op >= 1 }); }

export function applySkin(P, skinId) {
  const S = SKIN_MAP[skinId]; if (!S) return P;
  P.root.traverse(o => {
    if (!o.isMesh || o.userData.skinFx || o.userData.skinDone) return;
    o.material = recolor(o.material, S);
    o.userData.baseMat = o.material; o.userData.skinDone = skinId;
  });
  P.skin = skinId;
  const c = { dark: S.p[0], main: S.p[1], light: S.p[2], metal: S.p[3], glow: S.p[4] };
  for (const a of S.acc) { try { PIECES[a]?.(P, c); } catch (e) { /* model without that part */ } }
  const glow = new THREE.Color(c.glow);
  const fx = new THREE.Group(); fx.userData.skinFx = true; P.root.add(fx);
  const mark = (m) => { m.userData.skinFx = true; return m; };
  const t = S.tier, sc = P.spec?.h || 1;
  // 희귀+: a ring at the feet; 영웅+: rune ticks turning around it
  if (t >= 2) {
    const ring = mark(new THREE.Mesh(new THREE.RingGeometry(0.55 * sc, 0.62 * sc, 40), glowMat(glow, t >= 4 ? 2.2 : 1.4, t >= 3 ? 0.85 : 0.5)));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; ring.material.side = THREE.DoubleSide; fx.add(ring);
    if (t >= 3) {
      const ticks = new THREE.Group(); fx.add(ticks);
      for (let i = 0; i < 12; i++) { const b = mark(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.006, 0.12), glowMat(glow, 2))); const a = i / 12 * Math.PI * 2; b.position.set(Math.cos(a) * 0.72 * sc, 0.03, Math.sin(a) * 0.72 * sc); b.rotation.y = -a; ticks.add(b); }
      P.update.push((tt) => { ticks.rotation.y = tt * 0.4; ring.material.opacity = 0.7 + Math.sin(tt * 2) * 0.15; });
    }
  }
  // 전설+: motes drifting around the body
  if (t >= 4 && S.motes) {
    const kind = S.motes, motes = new THREE.Group(); fx.add(motes);
    const geo = kind === 'shard' ? new THREE.OctahedronGeometry(0.045, 0) : kind === 'star' ? new THREE.OctahedronGeometry(0.03, 0) : kind === 'spark' ? new THREE.BoxGeometry(0.012, 0.09, 0.012) : new THREE.IcosahedronGeometry(0.03, 0);
    const mc = kind === 'ember' ? new THREE.Color(S.flame || c.glow) : glow;
    const n = t >= 5 ? 16 : 10, list = [];
    for (let i = 0; i < n; i++) { const m = mark(new THREE.Mesh(geo, glowMat(mc, 3))); motes.add(m); list.push({ m, a: i / n * Math.PI * 2, r: (0.5 + (i % 3) * 0.12) * sc, y: (0.3 + (i * 0.37) % 1.6) * sc, sp: 0.6 + (i % 4) * 0.2 }); }
    const rising = kind === 'ember' || kind === 'wisp';
    P.update.push((tt) => { for (const q of list) { const a = q.a + tt * q.sp * (rising ? 0.6 : 0.4); const y = rising ? ((q.y + tt * 0.35) % (1.9 * sc)) : q.y + Math.sin(tt * 1.3 + q.a) * 0.08; q.m.position.set(Math.cos(a) * q.r, y, Math.sin(a) * q.r); q.m.rotation.y = tt * 2; if (kind === 'spark') q.m.visible = Math.sin(tt * 9 + q.a * 5) > 0.2; const f = rising ? 1 - y / (1.9 * sc) : 1; q.m.scale.setScalar(0.4 + f * 0.8); } });
  }
  // 초전설: a flame aura, and for some a body that shifts through colours
  if (t >= 5) {
    const fl = new THREE.Group(); fx.add(fl); const cones = [];
    const fc = new THREE.Color(S.flame || c.glow);
    for (let i = 0; i < 9; i++) { const k = mark(new THREE.Mesh(new THREE.ConeGeometry(0.06 * sc, 0.42 * sc, 5), glowMat(fc, 2.4, 0.42))); const a = i / 9 * Math.PI * 2; k.position.set(Math.cos(a) * 0.45 * sc, 0.2 * sc, Math.sin(a) * 0.45 * sc); fl.add(k); cones.push(k); }
    P.update.push((tt) => { cones.forEach((k, i) => { const v = 0.6 + Math.abs(Math.sin(tt * 6 + i * 1.7)) * 0.6; k.scale.set(1, v, 1); k.position.y = 0.12 * sc + v * 0.12 * sc; }); fl.rotation.y = tt * 0.5; });
    if (S.prism) {
      const col = new THREE.Color();
      P.root.traverse(o => { if (o.isMesh && !o.userData.skinFx && o.material.emissive) { const e = o.material.emissive; if ((e.r + e.g + e.b) * o.material.emissiveIntensity < 0.6) o.userData.prism = true; } });
      P.update.push((tt) => { col.setHSL((tt * 0.08) % 1, 0.9, 0.5, SRGB); P.root.traverse(o => { if (o.userData.prism && o.material.emissive) { o.material.emissive.copy(col); o.material.emissiveIntensity = 0.07; } }); });
    }
  }
  return P;
}
