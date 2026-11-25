// 20 heroes. Abilities are data-driven; sim.js interprets `kind`.
// Keys: lmb (basic), q, e, x (ultimate, needs 100 charge)
// Status keys: stun, root, slow{v}, haste{v}, invis, undying, dr{v}, block{v}, dmgUp{v},
//   atkSpd{v}, steal{v}, poison{v}, burn{v}, invuln, giant, glide, empower{v}

export const ROLES = {
  tank: { name: '수호자', color: '#c9a45c' },
  bruiser: { name: '투사', color: '#b5523b' },
  assassin: { name: '암살자', color: '#9b6bd1' },
  mage: { name: '술사', color: '#e0773a' },
  ranger: { name: '사수', color: '#6fb0c9' },
  support: { name: '인도자', color: '#5fd4a4' },
};

import { NEW_HEROES, RARITY, STARTERS } from './heroes2.js';
export { RARITY, STARTERS };

const BASE = [
  {
    id: 'valok', name: '발로크', title: '혈맹 기사', role: 'tank', hp: 480, speed: 6.2, diff: 1,
    color: '#b3262e', quote: '맹세는 피로 쓰고, 피로 지킨다.',
    model: 'knight',
    ai: { range: 2.4, style: 'melee' },
    abilities: {
      lmb: { name: '처형 대검', desc: '넓게 휘둘러 앞쪽 적을 벤다.', kind: 'melee', cd: 0.9, range: 3.3, arc: 100, dmg: 52, icon: 'slash' },
      q: { name: '피의 돌진', desc: '앞으로 돌진해 처음 부딪힌 적을 기절시킨다.', kind: 'dash', cd: 8, dist: 11, dur: 0.45, dmg: 35, hitR: 1.4, stun: 0.7, icon: 'dash', ai: { use: 'gap', min: 4, max: 11 } },
      e: { name: '피의 방벽', desc: '3초 동안 정면 피해를 75% 막는다.', kind: 'buff', target: 'self', cd: 10, st: { block: [3, 0.75] }, icon: 'shield', ai: { use: 'defend' } },
      x: { name: '심판의 도약', desc: '높이 뛰어올라 내려찍는다. 주변 적을 띄우고 큰 피해.', kind: 'leap', fwd: 13, up: 11, land: { r: 6, dmg: 95, knockup: 7 }, icon: 'leap', ai: { use: 'gap', min: 3, max: 14 } },
    },
  },
  {
    id: 'nir', name: '니르', title: '그림자 칼날', role: 'assassin', hp: 260, speed: 7.6, diff: 3,
    color: '#7b4fc9', quote: '등 뒤를 내준 자는 이미 죽은 자다.',
    model: 'shade',
    ai: { range: 2.0, style: 'melee' },
    abilities: {
      lmb: { name: '쌍단검', desc: '빠른 찌르기. 등 뒤에서 맞히면 1.8배.', kind: 'melee', cd: 0.42, range: 2.8, arc: 75, dmg: 34, backstab: 1.8, icon: 'daggers' },
      q: { name: '그림자 걸음', desc: '바라보는 방향으로 순간이동한다.', kind: 'blink', cd: 6, dist: 10, icon: 'blink', ai: { use: 'gap', min: 5, max: 12 } },
      e: { name: '그림자 표창', desc: '표창을 던져 맞힌 적을 2초간 둔화시킨다.', kind: 'proj', cd: 5, speed: 48, dmg: 42, r: 0.35, life: 1.2, onHit: { slow: [2, 0.35] }, look: 'shuriken', icon: 'shuriken', ai: { use: 'aim', max: 22 } },
      x: { name: '망령화', desc: '6초 동안 투명해지고 빨라지며 공격력이 2배가 된다.', kind: 'buff', target: 'self', st: { invis: [6], haste: [6, 0.4], dmgUp: [6, 1.0] }, icon: 'ghost', ai: { use: 'engage', max: 25 } },
    },
  },
  {
    id: 'igna', name: '이그나', title: '잿불 마녀', role: 'mage', hp: 280, speed: 6.4, diff: 2,
    color: '#e0602a', quote: '재가 되면, 다들 똑같이 가벼워져.',
    model: 'witch',
    ai: { range: 15, style: 'ranged' },
    abilities: {
      lmb: { name: '화염구', desc: '폭발하는 화염구를 던진다.', kind: 'proj', cd: 0.7, speed: 34, dmg: 34, r: 0.35, life: 2, splash: { r: 2.4, dmg: 18 }, onHit: { burn: [2, 8] }, look: 'fireball', icon: 'fire', ai: {} },
      q: { name: '폭염 도약', desc: '발밑을 폭발시켜 뒤로 높이 튀어오른다.', kind: 'launch', cd: 8, back: 9, up: 9, aoe: { r: 3, dmg: 30, knock: 8 }, icon: 'burst', ai: { use: 'escape', min: 4 } },
      e: { name: '화염 장벽', desc: '앞에 불의 벽을 세운다. 지나는 적은 불탄다.', kind: 'zone', cd: 12, at: 'front', dist: 5, wall: { w: 8, d: 1.2 }, dur: 4.5, dps: 45, h: 2.6, look: 'firewall', icon: 'wall', ai: { use: 'aim', max: 9 } },
      x: { name: '운석 낙하', desc: '조준 지점에 운석을 떨어뜨린다.', kind: 'zone', at: 'aim', range: 40, r: 7, delay: 1.3, dur: 0, burst: { dmg: 150, knockup: 6 }, look: 'meteor', icon: 'meteor', ai: { use: 'aim', max: 35 } },
    },
  },
  {
    id: 'selene', name: '셀레네', title: '서리 사냥꾼', role: 'ranger', hp: 250, speed: 6.6, diff: 2,
    color: '#7cc7e8', quote: '숨을 참아. 서리는 소리를 내지 않아.',
    model: 'huntress',
    ai: { range: 22, style: 'ranged' },
    abilities: {
      lmb: { name: '서리 화살', desc: '누르고 있으면 모았다가 쏜다. 오래 모을수록 강하다.', kind: 'proj', cd: 0.35, charge: { time: 1.1, dmgMin: 28, dmgMax: 98, spdMin: 45, spdMax: 85 }, r: 0.25, grav: 0.18, life: 2.5, look: 'arrow', icon: 'arrow', ai: {} },
      q: { name: '후퇴 도약', desc: '뒤로 크게 뛰어오른다.', kind: 'launch', cd: 7, back: 12, up: 7, icon: 'backjump', ai: { use: 'escape', min: 5 } },
      e: { name: '빙결 덫', desc: '발밑에 덫을 놓는다. 밟은 적은 1.5초간 묶인다.', kind: 'trap', cd: 9, r: 1.6, life: 25, dmg: 30, st: { root: [1.5] }, max: 2, icon: 'trap', ai: { use: 'escape', min: 7 } },
      x: { name: '눈보라', desc: '조준 지점에 눈보라를 일으켜 적을 둔화시키고 얼린다.', kind: 'zone', at: 'aim', range: 40, r: 8, dur: 5, dps: 30, st: { slow: [0.5, 0.45] }, look: 'blizzard', icon: 'snow', ai: { use: 'aim', max: 35 } },
    },
  },
  {
    id: 'mor', name: '모르', title: '망자의 사제', role: 'support', hp: 290, speed: 6.3, diff: 2,
    color: '#5fd4a4', quote: '아직은 아니다. 망자들이 너를 거절했다.',
    model: 'priest',
    ai: { range: 14, style: 'support' },
    abilities: {
      lmb: { name: '영혼탄', desc: '적에게 맞으면 영혼이 가장 다친 아군을 치유한다.', kind: 'proj', cd: 0.6, speed: 30, dmg: 28, r: 0.35, life: 2, healNearest: { r: 14, amt: 20 }, look: 'soul', icon: 'orb', ai: {} },
      q: { name: '망령 비행', desc: '떠올라 3초간 천천히 활공한다.', kind: 'glide', cd: 8, up: 7, dur: 3, icon: 'wing', ai: { use: 'escape', min: 5 } },
      e: { name: '치유의 파동', desc: '주변 아군과 자신을 즉시 치유한다.', kind: 'aoe', at: 'self', cd: 10, r: 10, heal: 80, icon: 'heal', ai: { use: 'heal', r: 10 } },
      x: { name: '죽음의 유예', desc: '주변 아군이 4초간 죽지 않고, 체력을 회복한다.', kind: 'buff', target: 'allies', r: 16, heal: 50, st: { undying: [4] }, icon: 'ankh', ai: { use: 'save', r: 16 } },
    },
  },
  {
    id: 'grom', name: '그롬', title: '무덤지기', role: 'tank', hp: 500, speed: 5.9, diff: 1,
    color: '#8a9a5b', quote: '자리는 충분하다. 언제나.',
    model: 'gravekeeper',
    ai: { range: 2.6, style: 'melee' },
    abilities: {
      lmb: { name: '묘비 망치', desc: '느리지만 묵직하게 내려찍는다.', kind: 'melee', cd: 1.1, range: 3.5, arc: 80, dmg: 64, onHit: { slow: [1, 0.3] }, icon: 'hammer' },
      q: { name: '사슬 갈고리', desc: '갈고리를 던져 맞힌 적을 끌어온다.', kind: 'proj', cd: 9, speed: 40, dmg: 30, r: 0.5, life: 0.55, hook: 18, onHit: { stun: [0.4] }, look: 'hook', icon: 'hook', ai: { use: 'aim', min: 5, max: 20 } },
      e: { name: '대지 강타', desc: '땅을 내려쳐 주변 적을 띄우고 둔화시킨다.', kind: 'aoe', at: 'self', look: 'quake', cd: 9, r: 5, dmg: 45, knockup: 5, st: { slow: [2, 0.4] }, icon: 'quake', ai: { use: 'self', max: 4.5 } },
      x: { name: '무덤의 거인', desc: '7초 동안 거대해진다. 받는 피해 50% 감소, 공격력 40% 증가.', kind: 'buff', target: 'self', heal: 100, st: { giant: [7], dr: [7, 0.5], dmgUp: [7, 0.4] }, icon: 'giant', ai: { use: 'engage', max: 10 } },
    },
  },
  {
    id: 'razel', name: '라젤', title: '폭풍 술사', role: 'mage', hp: 260, speed: 6.8, diff: 2,
    color: '#7fa8ff', quote: '하늘이 화를 낼 때, 나는 그 목소리다.',
    model: 'stormcaller',
    ai: { range: 16, style: 'ranged' },
    abilities: {
      lmb: { name: '번개 줄기', desc: '즉시 꽂히는 번개를 쏜다.', kind: 'beam', cd: 0.34, range: 28, dmg: 16, look: 'lightning', icon: 'bolt', ai: {} },
      q: { name: '섬광 질주', desc: '번개처럼 빠르게 질주한다.', kind: 'dash', cd: 6, dist: 10, dur: 0.22, icon: 'dash', ai: { use: 'escape', min: 5 } },
      e: { name: '연쇄 번개', desc: '대상에게 튀어 주변 적 2명에게 연쇄된다.', kind: 'beam', cd: 8, range: 30, dmg: 50, chain: { n: 2, r: 9, dmg: 35 }, onHit: { stun: [0.3] }, look: 'chain', icon: 'chain', ai: { use: 'aim', max: 28 } },
      x: { name: '뇌우', desc: '조준 지점에 5초간 번개가 연달아 내리친다.', kind: 'zone', at: 'aim', range: 40, r: 8, dur: 5, strikes: { every: 0.35, dmg: 30, r: 2.6 }, look: 'storm', icon: 'storm', ai: { use: 'aim', max: 35 } },
    },
  },
  {
    id: 'veyla', name: '베일라', title: '핏빛 백작부인', role: 'bruiser', hp: 360, speed: 6.9, diff: 2,
    color: '#c2185b', quote: '한 모금만. 정말이야, 한 모금만.',
    model: 'vampire',
    ai: { range: 2.4, style: 'melee' },
    abilities: {
      lmb: { name: '핏빛 발톱', desc: '할퀴어 입힌 피해의 35%를 흡수한다.', kind: 'melee', cd: 0.55, range: 2.9, arc: 90, dmg: 34, steal: 0.35, icon: 'claw' },
      q: { name: '박쥐 변신', desc: '박쥐 떼로 흩어져 돌진한다. 이동 중 무적.', kind: 'dash', cd: 8, dist: 10, dur: 0.4, invuln: true, icon: 'bat', ai: { use: 'gap', min: 4, max: 11 } },
      e: { name: '피의 창', desc: '관통하는 피의 창을 던져 체력을 흡수한다.', kind: 'proj', cd: 7, speed: 50, dmg: 55, r: 0.4, life: 0.8, pierce: true, steal: 0.5, look: 'bloodspear', icon: 'spear', ai: { use: 'aim', max: 30 } },
      x: { name: '피의 연회', desc: '4초간 주변 적의 생명을 빨아들인다.', kind: 'zone', at: 'self', follow: true, r: 7, dur: 4, dps: 42, stealAll: 1.0, look: 'bloodfeast', icon: 'feast', ai: { use: 'self', max: 6 } },
    },
  },
  {
    id: 'kael', name: '카엘', title: '잿빛 성기사', role: 'support', hp: 380, speed: 6.2, diff: 1,
    color: '#e8d08a', quote: '빛은 꺼졌다. 그래도 맹세는 남았다.',
    model: 'paladin',
    ai: { range: 3.2, style: 'melee' },
    abilities: {
      lmb: { name: '성창 찌르기', desc: '길게 찌른다.', kind: 'melee', cd: 0.75, range: 4.2, arc: 40, dmg: 44, icon: 'spear' },
      q: { name: '신성 돌격', desc: '짧게 돌격해 부딪힌 적을 밀쳐낸다.', kind: 'dash', cd: 7, dist: 8, dur: 0.35, dmg: 25, hitR: 1.4, knock: 9, icon: 'dash', ai: { use: 'gap', min: 4, max: 9 } },
      e: { name: '빛의 보호막', desc: '조준한 아군(없으면 자신)과 자신에게 보호막을 씌운다.', kind: 'buff', target: 'ally', r: 25, cd: 9, shield: 90, alsoSelf: true, icon: 'shield', ai: { use: 'heal', r: 25 } },
      x: { name: '성역', desc: '6초간 성역을 펼친다. 아군은 치유되고 받는 피해가 줄어든다.', kind: 'zone', at: 'self', r: 9, dur: 6, hps: 35, allySt: { dr: [0.4, 0.3] }, look: 'sanctum', icon: 'sanctum', ai: { use: 'save', r: 9 } },
    },
  },
  {
    id: 'onyx', name: '오닉스', title: '역병 의사', role: 'mage', hp: 290, speed: 6.3, diff: 2,
    color: '#9acd32', quote: '진단은 끝났다. 처방은... 더 많은 역병.',
    model: 'plague',
    ai: { range: 13, style: 'ranged' },
    abilities: {
      lmb: { name: '역병 플라스크', desc: '포물선으로 던져 터뜨린다. 맞은 적은 중독된다.', kind: 'proj', cd: 0.85, speed: 24, dmg: 20, r: 0.35, grav: 0.8, life: 3, splash: { r: 3, dmg: 26 }, onHit: { poison: [3, 9] }, look: 'flask', icon: 'flask', ai: {} },
      q: { name: '연막 후퇴', desc: '연기를 남기고 뒤로 물러난다.', kind: 'launch', cd: 7, back: 10, up: 5, selfSt: { invis: [1.2] }, icon: 'smoke', ai: { use: 'escape', min: 5 } },
      e: { name: '독안개', desc: '조준 지점에 독안개를 퍼뜨린다.', kind: 'zone', cd: 10, at: 'aim', range: 28, r: 5, dur: 6, dps: 22, st: { slow: [0.5, 0.25] }, look: 'miasma', icon: 'miasma', ai: { use: 'aim', max: 26 } },
      x: { name: '역병 창궐', desc: '반경 24m 안의 모든 적을 6초간 강하게 중독시킨다.', kind: 'aoe', at: 'self', look: 'skull', r: 24, noLos: true, dmg: 10, st: { poison: [6, 20] }, icon: 'skull', ai: { use: 'self', max: 22 } },
    },
  },
  {
    id: 'sira', name: '시라', title: '공허 소환사', role: 'mage', hp: 280, speed: 6.3, diff: 3,
    color: '#a06bff', quote: '저 너머엔 아무것도 없어. 그게 좋은 거야.',
    model: 'voidcaller',
    ai: { range: 15, style: 'ranged' },
    abilities: {
      lmb: { name: '공허 구체', desc: '느리지만 적을 관통하는 구체.', kind: 'proj', cd: 0.75, speed: 20, dmg: 36, r: 0.55, life: 2.4, pierce: true, look: 'void', icon: 'void', ai: {} },
      q: { name: '위상 이동', desc: '짧게 순간이동한다.', kind: 'blink', cd: 5, dist: 8, icon: 'blink', ai: { use: 'escape', min: 5 } },
      e: { name: '공허의 균열', desc: '균열을 열어 적을 중심으로 빨아들인다.', kind: 'zone', cd: 10, at: 'aim', range: 28, r: 6, dur: 2.5, dps: 16, pull: 9, look: 'rift', icon: 'rift', ai: { use: 'aim', max: 26 } },
      x: { name: '공허 붕괴', desc: '1.5초 뒤 조준 지점이 붕괴해 막대한 피해를 준다.', kind: 'zone', at: 'aim', range: 40, r: 8, delay: 1.5, dur: 0, pullDuringDelay: 6, burst: { dmg: 140 }, look: 'collapse', icon: 'collapse', ai: { use: 'aim', max: 35 } },
    },
  },
  {
    id: 'ulfric', name: '울프릭', title: '혈월 늑대', role: 'bruiser', hp: 350, speed: 7.3, diff: 2,
    color: '#d4552f', quote: '달이 붉을 때, 나는 사냥을 멈추지 않는다.',
    model: 'werewolf',
    ai: { range: 2.2, style: 'melee' },
    abilities: {
      lmb: { name: '발톱 연타', desc: '빠르게 연속으로 할퀸다.', kind: 'melee', cd: 0.32, range: 2.8, arc: 85, dmg: 27, icon: 'claw' },
      q: { name: '덮치기', desc: '조준 방향으로 도약해 착지 지점에 피해.', kind: 'leap', cd: 7, fwd: 14, up: 7, land: { r: 3.2, dmg: 40, st: { slow: [1, 0.3] } }, icon: 'leap', ai: { use: 'gap', min: 5, max: 15 } },
      e: { name: '포효', desc: '주변 적을 둔화시키고 자신은 빨라진다.', kind: 'aoe', at: 'self', look: 'roar', cd: 10, r: 7, dmg: 15, st: { slow: [2.5, 0.4] }, selfSt: { haste: [3, 0.3] }, icon: 'roar', ai: { use: 'self', max: 6 } },
      x: { name: '야수화', desc: '7초간 빨라지고 공격 속도와 흡혈이 크게 오른다.', kind: 'buff', target: 'self', heal: 60, st: { haste: [7, 0.35], atkSpd: [7, 0.6], steal: [7, 0.3], giant: [7] }, icon: 'wolf', ai: { use: 'engage', max: 12 } },
    },
  },
  {
    id: 'hark', name: '하르크', title: '해골 광전사', role: 'bruiser', hp: 400, speed: 6.6, diff: 1,
    color: '#d9c7a1', quote: '죽었냐고? 한 번. 그게 뭐 어쨌다고.',
    model: 'skeleton',
    ai: { range: 2.4, style: 'melee' },
    abilities: {
      lmb: { name: '쌍도끼', desc: '양손 도끼로 내려친다.', kind: 'melee', cd: 0.7, range: 3.0, arc: 100, dmg: 40, icon: 'axe' },
      q: { name: '광폭 질주', desc: '돌진하며 부딪힌 적을 튕겨낸다.', kind: 'dash', cd: 7, dist: 11, dur: 0.4, dmg: 30, hitR: 1.5, knock: 12, icon: 'dash', ai: { use: 'gap', min: 4, max: 11 } },
      e: { name: '회전베기', desc: '3초간 회전하며 주변을 벤다.', kind: 'zone', at: 'self', follow: true, cd: 10, r: 3.8, dur: 3, dps: 48, look: 'whirl', selfSt: { slow: [3, 0.15] }, icon: 'whirl', ai: { use: 'self', max: 3.5 } },
      x: { name: '불사의 분노', desc: '6초간 죽지 않고, 공격력이 30% 오른다.', kind: 'buff', target: 'self', st: { undying: [6], dmgUp: [6, 0.3], haste: [6, 0.2] }, icon: 'rage', ai: { use: 'lowhp', hp: 0.35 } },
    },
  },
  {
    id: 'eris', name: '에리스', title: '별빛 점성술사', role: 'support', hp: 260, speed: 6.5, diff: 2,
    color: '#9fb8ff', quote: '별은 이미 결말을 알고 있어. 나는 조금 고칠 뿐.',
    model: 'astrologer',
    ai: { range: 15, style: 'support' },
    abilities: {
      lmb: { name: '별똥 구슬', desc: '적에게는 피해, 아군에게 맞으면 치유.', kind: 'proj', cd: 0.55, speed: 36, dmg: 26, r: 0.35, life: 1.8, healAlly: 30, look: 'star', icon: 'star', ai: {} },
      q: { name: '별의 도약', desc: '앞으로 높이 도약한다.', kind: 'leap', cd: 7, fwd: 10, up: 10, icon: 'leap', ai: { use: 'escape', min: 5 } },
      e: { name: '별자리 결계', desc: '조준 지점에 아군을 치유하는 결계를 편다.', kind: 'zone', cd: 11, at: 'aim', range: 25, r: 6, dur: 5, hps: 32, look: 'constellation', icon: 'heal', ai: { use: 'heal', r: 20 } },
      x: { name: '유성우', desc: '유성이 쏟아져 적은 다치고 아군은 치유된다.', kind: 'zone', at: 'aim', range: 40, r: 9, dur: 4.5, strikes: { every: 0.3, dmg: 28, r: 2.8, heal: 22 }, look: 'starfall', icon: 'starfall', ai: { use: 'aim', max: 35 } },
    },
  },
  {
    id: 'azrak', name: '아즈락', title: '용혈 전사', role: 'tank', hp: 450, speed: 6.2, diff: 2,
    color: '#ff7a1a', quote: '내 피에는 아직 용이 잠들어 있다.',
    model: 'dragonknight',
    ai: { range: 3.0, style: 'melee' },
    abilities: {
      lmb: { name: '용비늘 창', desc: '긴 창으로 휘둘러 벤다.', kind: 'melee', cd: 0.8, range: 3.8, arc: 70, dmg: 46, icon: 'spear' },
      q: { name: '비룡 도약', desc: '조준 방향으로 크게 도약한다.', kind: 'leap', cd: 8, fwd: 13, up: 9, land: { r: 3, dmg: 30 }, icon: 'wing', ai: { use: 'gap', min: 6, max: 14 } },
      e: { name: '용의 숨결', desc: '앞쪽 원뿔 범위에 불을 뿜는다.', kind: 'aoe', at: 'cone', cd: 8, r: 7, angle: 60, dmg: 55, st: { burn: [3, 12] }, look: 'breath', icon: 'fire', ai: { use: 'self', max: 6 } },
      x: { name: '용의 분노', desc: '거대한 화염 폭발로 주변 적을 날려버린다.', kind: 'aoe', at: 'self', r: 8, dmg: 115, knock: 16, knockup: 6, st: { burn: [4, 15] }, selfSt: { dr: [3, 0.4] }, look: 'dragonburst', icon: 'dragon', ai: { use: 'self', max: 7 } },
    },
  },
  {
    id: 'lian', name: '리안', title: '거울 환술사', role: 'assassin', hp: 250, speed: 7.1, diff: 3,
    color: '#e0b3ff', quote: '네가 본 나는 몇 번째 나였을까?',
    model: 'illusionist',
    ai: { range: 12, style: 'ranged' },
    abilities: {
      lmb: { name: '환영 단검', desc: '빠른 단검을 던진다.', kind: 'proj', cd: 0.45, speed: 60, dmg: 26, r: 0.25, life: 0.9, look: 'mirrorblade', icon: 'daggers', ai: {} },
      q: { name: '거울 걸음', desc: '순간이동하고 1.5초간 투명해진다.', kind: 'blink', cd: 8, dist: 9, selfSt: { invis: [1.5] }, icon: 'blink', ai: { use: 'escape', min: 5 } },
      e: { name: '현혹', desc: '조준한 적을 1초간 기절시킨다.', kind: 'beam', cd: 9, range: 20, dmg: 20, onHit: { stun: [1.0] }, look: 'mesmer', icon: 'eye', ai: { use: 'aim', max: 18 } },
      x: { name: '천 개의 칼날', desc: '부채꼴로 환영 단검 9개를 동시에 던진다.', kind: 'proj', count: 9, spread: 40, speed: 55, dmg: 34, r: 0.3, life: 1, look: 'mirrorblade', icon: 'fan', ai: { use: 'aim', max: 12 } },
    },
  },
  {
    id: 'nox', name: '녹스', title: '까마귀 군주', role: 'ranger', hp: 250, speed: 6.7, diff: 2,
    color: '#5c6bc0', quote: '까마귀는 시체보다 먼저 도착한다.',
    model: 'raven',
    ai: { range: 20, style: 'ranged' },
    abilities: {
      lmb: { name: '깃털 화살', desc: '빠르게 연사하는 화살.', kind: 'proj', cd: 0.46, speed: 75, dmg: 21, r: 0.22, grav: 0.1, life: 1.6, look: 'feather', icon: 'arrow', ai: {} },
      q: { name: '깃털 활강', desc: '떠올라 활강한다.', kind: 'glide', cd: 8, up: 9, dur: 3, icon: 'wing', ai: { use: 'escape', min: 5 } },
      e: { name: '까마귀 떼', desc: '조준 지점에 까마귀 떼를 풀어 공격하고 둔화시킨다.', kind: 'zone', cd: 9, at: 'aim', range: 30, r: 4.5, dur: 3, dps: 28, st: { slow: [0.5, 0.3] }, look: 'crows', icon: 'crow', ai: { use: 'aim', max: 28 } },
      x: { name: '사신의 화살', desc: '모든 것을 꿰뚫는 거대한 화살을 쏜다.', kind: 'proj', speed: 70, dmg: 150, r: 0.8, life: 1.5, pierce: true, wallPierce: true, look: 'reaper', icon: 'reaper', ai: { use: 'aim', max: 50 } },
    },
  },
  {
    id: 'tyr', name: '티르', title: '룬 대장장이', role: 'tank', hp: 450, speed: 6.0, diff: 2,
    color: '#4fc3f7', quote: '두드려라. 쇠도, 적도, 운명도.',
    model: 'runesmith',
    ai: { range: 2.6, style: 'melee' },
    abilities: {
      lmb: { name: '룬 망치', desc: '망치로 내려친다.', kind: 'melee', cd: 0.85, range: 3.2, arc: 90, dmg: 52, icon: 'hammer' },
      q: { name: '룬 도약', desc: '앞으로 도약해 착지 지점을 내려친다.', kind: 'leap', cd: 8, fwd: 11, up: 8, land: { r: 3.5, dmg: 35, st: { slow: [1.5, 0.35] } }, icon: 'leap', ai: { use: 'gap', min: 5, max: 12 } },
      e: { name: '룬 방벽', desc: '앞에 적의 투사체를 막는 벽을 세운다.', kind: 'zone', at: 'front', dist: 3, wall: { w: 7, d: 0.6 }, dur: 5, blockProj: true, h: 3.2, cd: 12, look: 'runewall', icon: 'wall', ai: { use: 'defend' } },
      x: { name: '대지의 룬', desc: '6초간 룬을 새긴다. 아군은 단단해지고 적은 느려진다.', kind: 'zone', at: 'self', r: 9, dur: 6, dps: 15, st: { slow: [0.5, 0.4] }, allySt: { dr: [0.4, 0.4] }, look: 'runecircle', icon: 'rune', ai: { use: 'self', max: 8 } },
    },
  },
  {
    id: 'seraph', name: '세라핀', title: '타락한 천사', role: 'mage', hp: 280, speed: 6.5, diff: 3,
    color: '#ffd54f', quote: '나는 떨어졌다. 그러니 너희도 떨어뜨리겠다.',
    model: 'fallen',
    ai: { range: 16, style: 'ranged' },
    abilities: {
      lmb: { name: '타락한 광휘', desc: '즉시 꽂히는 빛줄기.', kind: 'beam', cd: 0.4, range: 30, dmg: 18, look: 'holy', icon: 'ray', ai: {} },
      q: { name: '날갯짓', desc: '날개를 펼쳐 앞으로 날아오른다.', kind: 'leap', cd: 6, fwd: 12, up: 8, icon: 'wing', ai: { use: 'escape', min: 5 } },
      e: { name: '심판의 빛', desc: '1초 뒤 조준 지점에 빛의 기둥이 떨어진다.', kind: 'zone', cd: 8, at: 'aim', range: 30, r: 3.5, delay: 1.0, dur: 0, burst: { dmg: 80, st: { stun: [0.5] } }, look: 'pillar', icon: 'pillar', ai: { use: 'aim', max: 28 } },
      x: { name: '강림', desc: '7초간 날아다니며 공격력이 오르고 공격 속도가 빨라진다.', kind: 'glide', up: 10, dur: 7, selfSt: { dmgUp: [7, 0.35], atkSpd: [7, 0.4] }, icon: 'halo', ai: { use: 'engage', max: 25 } },
    },
  },
  {
    id: 'belladonna', name: '벨라돈나', title: '늪지 마녀', role: 'support', hp: 280, speed: 6.4, diff: 2,
    color: '#7bc96f', quote: '독과 약은 같은 병에 담겨 있어. 양이 다를 뿐.',
    model: 'bogwitch',
    ai: { range: 14, style: 'support' },
    abilities: {
      lmb: { name: '독가시', desc: '맞힌 적을 잠시 둔화시킨다.', kind: 'proj', cd: 0.55, speed: 40, dmg: 26, r: 0.3, life: 1.4, onHit: { slow: [1, 0.2] }, healNearest: { r: 12, amt: 10 }, look: 'thorn', icon: 'thorn', ai: {} },
      q: { name: '덩굴 끌기', desc: '조준 지점으로 덩굴을 걸어 몸을 끌어당긴다.', kind: 'grapple', cd: 8, range: 22, icon: 'vine', ai: { use: 'escape', min: 5 } },
      e: { name: '속박의 덩굴', desc: '0.6초 뒤 조준 지점의 적을 묶는다.', kind: 'zone', cd: 9, at: 'aim', range: 26, r: 3.6, delay: 0.6, dur: 0, burst: { dmg: 30, st: { root: [1.6] } }, look: 'roots', icon: 'roots', ai: { use: 'aim', max: 24 } },
      x: { name: '마녀의 가마솥', desc: '6초간 아군은 치유하고 적은 중독시키는 늪을 만든다.', kind: 'zone', at: 'self', r: 9, dur: 6, hps: 30, dps: 22, look: 'cauldron', icon: 'cauldron', ai: { use: 'save', r: 9 } },
    },
  },
];

export const HEROES = [...BASE, ...NEW_HEROES];
for (const h of HEROES) { h.rarity = RARITY[h.id] || 4; h.starter = STARTERS.includes(h.id); }

export const DUMMY = {
  id: 'dummy', name: '허수아비', title: '훈련용', role: 'tank', hp: 750, speed: 3, diff: 1, color: '#c9a45c', quote: '', model: 'dummy',
  ai: { range: 2, style: 'melee' },
  abilities: { lmb: { kind: 'melee', cd: 1, range: 2, arc: 60, dmg: 0 }, q: { kind: 'buff', target: 'self', cd: 99 }, e: { kind: 'buff', target: 'self', cd: 99 }, x: { kind: 'buff', target: 'self' } },
};
export const HERO_MAP = Object.fromEntries([...HEROES, DUMMY].map(h => [h.id, h]));
export const SLOTS = ['lmb', 'q', 'e', 'x'];
export const SLOT_KEYS = { lmb: '좌클릭', q: 'Q', e: 'E', x: 'X' };
export const ULT_COST = 100;
