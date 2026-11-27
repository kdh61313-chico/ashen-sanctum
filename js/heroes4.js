// Heroes 61–64 (v2.0): two 6★ and two 5★.
export const FOURTH_HEROES = [
  {
    id: 'serenia', name: '세레니아', title: '별을 엮는 자', role: 'mage', hp: 300, speed: 6.4, diff: 3,
    color: '#ffe6a8', quote: '하늘은 아직 너희를 잊지 않았다.', model: 'starweaver',
    ai: { range: 18, style: 'ranged' },
    abilities: {
      lmb: { name: '별빛 바늘', desc: '적을 따라가는 빛의 바늘을 쏜다.', kind: 'proj', cd: 0.44, speed: 52, dmg: 18, r: 0.18, life: 1.1, homing: 1.6, look: 'star', icon: 'star', ai: {} },
      q: { name: '별자리 사슬', desc: '적 넷까지 이어지는 별빛 사슬. 맞은 적은 1초 동안 묶인다.', kind: 'chain', cd: 9, range: 24, bounces: 3, dmg: 38, onHit: { root: [1] }, look: 'constellation', icon: 'chain', ai: { use: 'aim', max: 22 } },
      e: { name: '유성우 장막', desc: '4초 동안 적 투사체를 막고 아군을 치유하는 별의 장막을 친다.', kind: 'zone', cd: 14, at: 'self', r: 5.5, dur: 4, hps: 18, dome: true, look: 'sanctum', icon: 'halo', ai: { use: 'defend' } },
      x: { name: '별의 추락', desc: '1.3초 동안 적을 끌어모은 뒤 조준 지점에 별을 떨어뜨린다. 맞은 적은 1초 기절.', kind: 'zone', at: 'aim', range: 38, r: 7, delay: 1.3, dur: 0, pullDuringDelay: 4, burst: { dmg: 150, st: { stun: [1] } }, look: 'starfall', icon: 'starfall', ai: { use: 'aim', max: 34 } },
    },
  },
  {
    id: 'karnok', name: '카르녹', title: '심연을 삼킨 왕', role: 'bruiser', hp: 495, speed: 6.1, diff: 2,
    color: '#9a5aff', quote: '배고픔은 왕관보다 무겁다.', model: 'abyssking',
    ai: { range: 3, style: 'melee' },
    abilities: {
      lmb: { name: '심연 대검', desc: '넓게 베어 가른다.', kind: 'melee', cd: 0.95, range: 3.3, arc: 110, dmg: 55, icon: 'slash' },
      q: { name: '삼키는 손아귀', desc: '심연의 손을 뻗어 맞힌 적을 끌어오고 둔화시킨다.', kind: 'proj', cd: 9, speed: 50, dmg: 32, r: 0.4, life: 0.45, pullTo: 10, onHit: { slow: [1.5, 0.35] }, look: 'hands', icon: 'hook', ai: { use: 'aim', min: 4, max: 20 } },
      e: { name: '공허 갑주', desc: '4초 동안 보호막 140을 두르고, 받은 피해의 30%를 되돌린다.', kind: 'buff', target: 'self', cd: 12, shield: 140, st: { thorns: [4, 0.3] }, icon: 'shield', ai: { use: 'defend' } },
      x: { name: '심연 개방', desc: '5초 동안 주변을 심연으로 바꾼다. 적을 끌어당기며 태우고, 받는 피해가 25% 줄어든다.', kind: 'zone', at: 'self', follow: true, r: 7, dur: 5, dps: 28, pull: 2.2, look: 'abyss', selfSt: { dr: [5, 0.25] }, icon: 'void', ai: { use: 'engage', max: 6 } },
    },
  },
  {
    id: 'mir', name: '미르', title: '폭풍 사냥꾼', role: 'ranger', hp: 260, speed: 7.0, diff: 2,
    color: '#8fd0ff', quote: '바람이 먼저 닿고, 화살은 그 뒤에 온다.', model: 'stormhunter',
    ai: { range: 20, style: 'ranged' },
    abilities: {
      lmb: { name: '번개 화살', desc: '맞으면 가까운 적 하나에게 튀는 화살.', kind: 'proj', cd: 0.58, speed: 80, dmg: 23, r: 0.2, life: 1, grav: 0.1, ricochet: 1, look: 'windarrow', icon: 'arrow', ai: {} },
      q: { name: '회오리 화살', desc: '적을 꿰뚫고 크게 둔화시키는 회오리 화살.', kind: 'proj', cd: 8, speed: 60, dmg: 36, r: 0.45, life: 0.8, pierce: true, onHit: { slow: [1.6, 0.45] }, look: 'storm', icon: 'whirl', ai: { use: 'aim', max: 26 } },
      e: { name: '바람 걸음', desc: '짧게 미끄러지듯 이동하고 2초 동안 빨라진다.', kind: 'dash', cd: 7, dist: 7, dur: 0.25, selfSt: { haste: [2, 0.3] }, icon: 'dash', ai: { use: 'escape', min: 4 } },
      x: { name: '폭풍의 눈', desc: '조준 지점에 4초 동안 적을 빨아들이고 번개를 내리치는 폭풍을 일으킨다.', kind: 'zone', at: 'aim', range: 32, r: 6, dur: 4, dps: 32, pull: 2.4, st: { slow: [0.5, 0.25] }, look: 'storm', icon: 'storm', ai: { use: 'aim', max: 30 } },
    },
  },
  {
    id: 'osel', name: '오셀', title: '이끼 정원사', role: 'support', hp: 330, speed: 6.3, diff: 1,
    color: '#8fe08a', quote: '썩은 자리에서도 무언가는 자라.', model: 'mossgardener',
    ai: { range: 14, style: 'ranged' },
    abilities: {
      lmb: { name: '가시 씨앗', desc: '아군에 닿으면 치유하는 씨앗.', kind: 'proj', cd: 0.55, speed: 34, dmg: 22, r: 0.28, life: 1.2, healAlly: 20, look: 'thorn', icon: 'thorn', ai: {} },
      q: { name: '새싹 포탑', desc: '6초 동안 가까운 적에게 가시를 쏘는 새싹을 심는다.', kind: 'zone', cd: 10, at: 'aim', range: 20, r: 2, dur: 6, look: 'roots', turret: { every: 0.5, range: 14, speed: 40, dmg: 12, r: 0.16, life: 0.5, look: 'thorn' }, icon: 'turret', ai: { use: 'aim', max: 18 } },
      e: { name: '치유의 이끼', desc: '4초 동안 아군을 치유하고 적의 발을 붙잡아 느리게 하는 이끼밭을 깐다.', kind: 'zone', cd: 13, at: 'aim', range: 20, r: 5, dur: 4, hps: 26, st: { slow: [0.5, 0.35] }, look: 'bloom', icon: 'roots', ai: { use: 'heal', r: 10 } },
      x: { name: '대지의 품', desc: '쓰러진 아군 한 명을 되살린다. 쓰러진 아군이 없으면 주변 아군을 크게 치유한다.', kind: 'revive', hpPct: 0.5, r: 12, heal: 150, icon: 'ankh', ai: { use: 'revive' } },
    },
  },
];
export const FOURTH_RARITY = { serenia: 6, karnok: 6, mir: 5, osel: 5 };
export const FOURTH_EL = { serenia: 'holy', karnok: 'shadow', mir: 'storm', osel: 'nature' };
