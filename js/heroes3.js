// Heroes 41–60. New mechanics: tether, revive, turret zones, vuln (mark), reflect, doom.
export const THIRD_HEROES = [
  {
    id: 'kaira', name: '카이라', title: '불꽃 무희', role: 'assassin', hp: 270, speed: 7.6, diff: 2,
    color: '#ff7a3a', quote: '춤이 끝나면 재만 남아.', model: 'dancer',
    ai: { range: 2.2, style: 'melee' },
    abilities: {
      lmb: { name: '불꽃 차크람', desc: '양손의 차크람으로 빠르게 벤다.', kind: 'melee', cd: 0.4, range: 2.9, arc: 90, dmg: 30, icon: 'chakram' },
      q: { name: '차크람 투척', desc: '차크람을 던진다. 적을 꿰뚫고 돌아오며 불태운다.', kind: 'proj', cd: 6, speed: 30, dmg: 30, r: 0.5, life: 0.8, boomerang: true, pierce: true, onHit: { burn: [2, 10] }, look: 'chakram', icon: 'chakram', ai: { use: 'aim', max: 14 } },
      e: { name: '불의 춤', desc: '3초 동안 빨라지고 공격 속도가 오르며, 몸에 두른 불꽃이 주변을 태운다.', kind: 'zone', at: 'self', follow: true, cd: 10, r: 2.6, dur: 3, dps: 26, look: 'fireground', selfSt: { haste: [3, 0.3], atkSpd: [3, 0.5] }, icon: 'fire', ai: { use: 'self', max: 6 } },
      x: { name: '불새의 궤적', desc: '불새가 되어 멀리 돌진한다. 무적이며 지나간 자리가 불바다가 된다.', kind: 'dash', dist: 18, dur: 0.55, invuln: true, dmg: 70, hitR: 1.8, trail: { r: 2.2, dur: 3.5, dps: 40, st: { burn: [1.5, 8] }, look: 'fireground' }, icon: 'wing', ai: { use: 'gap', min: 4, max: 16 } },
    },
  },
  {
    id: 'brann', name: '브란', title: '서리 거인', role: 'tank', hp: 560, speed: 5.7, diff: 1,
    color: '#7fc8ff', quote: '산은 움직이지 않는다. 내가 산이다.', model: 'frostgiant',
    ai: { range: 2.8, style: 'melee' },
    abilities: {
      lmb: { name: '빙하 망치', desc: '무겁게 내려쳐 적을 둔화시킨다.', kind: 'melee', cd: 1.1, range: 3.4, arc: 90, dmg: 62, onHit: { slow: [1.2, 0.3] }, icon: 'hammer' },
      q: { name: '빙벽', desc: '앞에 투사체를 막는 얼음 벽을 세운다.', kind: 'zone', cd: 11, at: 'front', dist: 3.5, wall: { w: 7, d: 1.0 }, dur: 5, blockProj: true, h: 3.4, look: 'icewall', icon: 'wall', ai: { use: 'defend' } },
      e: { name: '서리 갑옷', desc: '4초 동안 보호막 140을 얻고, 받는 피해가 20% 줄어든다.', kind: 'buff', target: 'self', cd: 12, shield: 140, st: { dr: [4, 0.2] }, icon: 'snow', ai: { use: 'defend' } },
      x: { name: '빙하 붕괴', desc: '땅을 내리쳐 주변 적을 2초 동안 얼리고 큰 피해를 준다.', kind: 'aoe', at: 'self', r: 7, dmg: 85, st: { root: [2] }, look: 'frostnova', icon: 'quake', ai: { use: 'self', max: 6 } },
    },
  },
  {
    id: 'vesper', name: '베스퍼', title: '새벽의 사제', role: 'support', hp: 290, speed: 6.4, diff: 2,
    color: '#ffe08a', quote: '쓰러진 자여, 아직 새벽은 오지 않았다.', model: 'dawnpriest',
    ai: { range: 13, style: 'ranged' },
    abilities: {
      lmb: { name: '새벽빛', desc: '빛의 구체. 적에게는 피해, 맞히면 가장 다친 아군을 치유.', kind: 'proj', cd: 0.6, speed: 38, dmg: 26, r: 0.3, life: 1.6, healNearest: { r: 10, amt: 18 }, look: 'sunbolt', icon: 'orb', ai: {} },
      q: { name: '새벽의 성역', desc: '5초 동안 아군을 초당 32 치유하는 빛의 결계를 편다.', kind: 'zone', cd: 12, at: 'aim', range: 18, r: 4.2, dur: 5, hps: 32, look: 'sanctum', icon: 'sanctum', ai: { use: 'heal', r: 16 } },
      e: { name: '축복', desc: '조준한 아군의 공격력을 30% 올리고 받는 피해를 20% 줄인다 (4초).', kind: 'buff', target: 'ally', cd: 9, r: 30, st: { dmgUp: [4, 0.3], dr: [4, 0.2] }, heal: 20, icon: 'halo', ai: { use: 'save', r: 25 } },
      x: { name: '부활의 기도', desc: '쓰러진 아군 한 명을 곁에 되살린다. 쓰러진 아군이 없으면 주변 아군을 크게 치유한다.', kind: 'revive', hpPct: 0.6, r: 12, heal: 160, icon: 'ankh', ai: { use: 'revive' } },
    },
  },
  {
    id: 'orin', name: '오린', title: '태엽 기술자', role: 'ranger', hp: 280, speed: 6.6, diff: 2,
    color: '#ffb84a', quote: '톱니 하나 어긋나면, 세상이 멈추지.', model: 'tinker', gun: 'pistol',
    ai: { range: 13, style: 'ranged' },
    abilities: {
      lmb: { name: '리벳건', desc: '못을 박아 넣는다. 15발, R로 재장전.', kind: 'proj', cd: 0.18, speed: 70, dmg: 14, r: 0.12, life: 0.8, ammo: 15, reload: 1.6, look: 'rivet', icon: 'pistol', ai: {} },
      q: { name: '태엽 포탑', desc: '10초 동안 가까운 적을 쏘는 포탑을 세운다.', kind: 'zone', cd: 12, at: 'front', dist: 2, r: 0.8, dur: 10, look: 'turret', turret: { every: 0.5, range: 20, speed: 60, dmg: 9, r: 0.12, life: 0.6, look: 'rivet' }, icon: 'turret', ai: { use: 'engage', max: 18 } },
      e: { name: '전기 덫', desc: '밟으면 터져 기절시키는 덫. 최대 2개.', kind: 'trap', cd: 9, r: 2.2, life: 30, dmg: 40, st: { stun: [1.0] }, max: 2, look: 'trap', icon: 'trap', ai: { use: 'escape', min: 7 } },
      x: { name: '과부하 포대', desc: '8초 동안 번개 구체를 연사하는 대형 포탑을 세운다.', kind: 'zone', at: 'front', dist: 2.5, r: 1.2, dur: 8, look: 'turret', turret: { every: 0.25, range: 26, speed: 45, dmg: 22, r: 0.25, life: 0.9, splash: { r: 2, dmg: 12 }, look: 'lightningorb' }, icon: 'turret', ai: { use: 'engage', max: 20 } },
    },
  },
  {
    id: 'thalia', name: '탈리아', title: '바람의 궁수', role: 'ranger', hp: 250, speed: 7.2, diff: 2,
    color: '#8fe0c8', quote: '바람이 길을 알려 줘.', model: 'windarcher',
    ai: { range: 16, style: 'ranged' },
    abilities: {
      lmb: { name: '바람 화살', desc: '빠르게 연사하는 가벼운 화살.', kind: 'proj', cd: 0.32, speed: 70, dmg: 20, r: 0.15, life: 1.0, look: 'windarrow', icon: 'arrow', ai: {} },
      q: { name: '돌풍 도약', desc: '바람을 타고 뒤로 높이 뛰어오른다.', kind: 'launch', cd: 7, back: 10, up: 9, aoe: { r: 3, dmg: 15, knock: 10 }, icon: 'wing', ai: { use: 'escape', min: 5 } },
      e: { name: '표적 화살', desc: '맞힌 적이 4초 동안 받는 피해가 25% 늘어난다.', kind: 'proj', cd: 8, speed: 80, dmg: 30, r: 0.2, life: 1.0, onHit: { vuln: [4, 0.25] }, look: 'markarrow', icon: 'mark', ai: { use: 'aim', max: 30 } },
      x: { name: '폭풍 화살비', desc: '조준 지점에 4초 동안 바람 화살이 쏟아진다.', kind: 'zone', at: 'aim', range: 32, r: 6, dur: 4, dps: 50, st: { slow: [0.5, 0.3] }, look: 'storm', strikes: { every: 0.18, r: 1.6, dmg: 12 }, icon: 'starfall', ai: { use: 'aim', max: 28 } },
    },
  },
  {
    id: 'gorm', name: '고름', title: '늪지 주술사', role: 'mage', hp: 300, speed: 6.3, diff: 2,
    color: '#8acd32', quote: '늪은 모든 것을 삼키고, 다시 피워 내지.', model: 'shaman',
    ai: { range: 13, style: 'ranged' },
    abilities: {
      lmb: { name: '늪 거품', desc: '터지면서 독을 퍼뜨리는 거품.', kind: 'proj', cd: 0.7, speed: 26, dmg: 18, r: 0.3, life: 1.6, splash: { r: 2.6, dmg: 26 }, onHit: { poison: [3, 6] }, look: 'flask', icon: 'flask', ai: {} },
      q: { name: '덩굴 족쇄', desc: '조준한 적을 덩굴로 묶는다. 2초 버티면 묶인 적이 뿌리박힌다.', kind: 'tether', cd: 9, range: 16, hold: 2, dps: 18, st: { root: [1.6] }, look: 'vine', icon: 'vine', ai: { use: 'aim', max: 14 } },
      e: { name: '치유의 토템', desc: '8초 동안 주변 아군을 초당 20 치유하는 토템을 세운다.', kind: 'zone', cd: 13, at: 'front', dist: 2, r: 5, dur: 8, hps: 20, look: 'totem', icon: 'cauldron', ai: { use: 'heal', r: 10 } },
      x: { name: '썩은 늪', desc: '넓은 늪을 펼쳐 적을 끌어당기고 독으로 녹인다.', kind: 'zone', at: 'aim', range: 22, r: 7, dur: 5, dps: 35, pull: 4, st: { slow: [0.5, 0.4], wither: [0.5, 0.5] }, look: 'swamp', icon: 'miasma', ai: { use: 'aim', max: 20 } },
    },
  },
  {
    id: 'hyeon', name: '현', title: '뇌명 검성', role: 'bruiser', hp: 360, speed: 7.0, diff: 3,
    color: '#a8c0ff', quote: '칼은 한 번 뽑는다. 두 번은 없다.', model: 'swordsaint',
    ai: { range: 2.4, style: 'melee' },
    abilities: {
      lmb: { name: '발도', desc: '번개처럼 빠르게 벤다.', kind: 'melee', cd: 0.55, range: 3.2, arc: 85, dmg: 40, icon: 'slash' },
      q: { name: '섬광 돌파', desc: '번개처럼 꿰뚫고 지나가며 닿은 모든 적을 벤다.', kind: 'dash', cd: 7, dist: 12, dur: 0.2, dmg: 50, hitR: 1.6, trail: { r: 1.4, dur: 1.5, dps: 20, look: 'sparkpath' }, icon: 'bolt', ai: { use: 'gap', min: 4, max: 12 } },
      e: { name: '받아치기', desc: '1초 동안 날아오는 투사체를 되돌려 보내고 정면 피해를 막는다.', kind: 'buff', target: 'self', cd: 9, st: { reflect: [1.0], block: [1.0, 0.8] }, icon: 'reflect', ai: { use: 'defend' } },
      x: { name: '천뢰일섬', desc: '시야 앞쪽의 모든 적을 한 번에 벤다. 시전 중 무적.', kind: 'deadeye', range: 18, cone: 80, dmg: 125, selfSt: { invuln: [0.6] }, onHitSt: { stun: [0.6] }, look: 'slashline', icon: 'slash', ai: { use: 'engage', max: 16 } },
    },
  },
  {
    id: 'nyx', name: '닉스', title: '공허의 마녀', role: 'mage', hp: 260, speed: 6.6, diff: 3,
    color: '#9a5cff', quote: '별빛도 닿지 않는 곳에서 왔어.', model: 'voidwitch',
    ai: { range: 15, style: 'ranged' },
    abilities: {
      lmb: { name: '공허 탄', desc: '보랏빛 구체를 쏜다.', kind: 'proj', cd: 0.5, speed: 40, dmg: 26, r: 0.3, life: 1.5, look: 'void', icon: 'orb', ai: {} },
      q: { name: '파멸의 낙인', desc: '맞힌 적에게 낙인을 새긴다. 2.5초 뒤 폭발해 주변까지 큰 피해.', kind: 'proj', cd: 8, speed: 46, dmg: 20, r: 0.3, life: 1.2, onHit: { doom: [2.5, 85] }, look: 'doom', icon: 'skull', ai: { use: 'aim', max: 22 } },
      e: { name: '공허 보행', desc: '순간이동하며 1초 동안 투사체를 되돌린다.', kind: 'blink', cd: 8, dist: 8, selfSt: { reflect: [1.0] }, icon: 'blink', ai: { use: 'escape', min: 5 } },
      x: { name: '영원한 밤', desc: '넓은 어둠을 드리워 적이 받는 피해를 30% 늘리고 둔화시킨다.', kind: 'zone', at: 'aim', range: 24, r: 8, dur: 6, dps: 14, st: { vuln: [0.5, 0.3], slow: [0.5, 0.3] }, look: 'nightfall', icon: 'void', ai: { use: 'aim', max: 22 } },
    },
  },
  {
    id: 'ragna', name: '라그나', title: '서리 광전사', role: 'bruiser', hp: 400, speed: 6.6, diff: 1,
    color: '#5fb8e8', quote: '추위는 피를 끓게 하지.', model: 'frostberserker',
    ai: { range: 2.2, style: 'melee' },
    abilities: {
      lmb: { name: '서리 쌍도끼', desc: '양손 도끼를 번갈아 휘두른다.', kind: 'melee', cd: 0.5, range: 3.0, arc: 95, dmg: 36, icon: 'axe' },
      q: { name: '빙하 낙하', desc: '뛰어올라 내려찍고, 착지 지점의 적을 1초 동안 얼린다.', kind: 'leap', cd: 9, fwd: 11, up: 9, land: { r: 4, dmg: 40, st: { root: [1.0] } }, icon: 'leap', ai: { use: 'gap', min: 4, max: 12 } },
      e: { name: '피의 서리', desc: '4초 동안 공격 속도가 50% 오르고 피해의 25%를 흡혈한다.', kind: 'buff', target: 'self', cd: 11, st: { atkSpd: [4, 0.5], steal: [4, 0.25] }, icon: 'rage', ai: { use: 'self', max: 4 } },
      x: { name: '빙결 폭주', desc: '5초 동안 거대해지고 쓰러지지 않는다.', kind: 'buff', target: 'self', st: { giant: [5], undying: [5], haste: [5, 0.2] }, heal: 80, icon: 'giant', ai: { use: 'lowhp', hp: 0.45 } },
    },
  },
  {
    id: 'pell', name: '펠', title: '벌집 양봉가', role: 'support', hp: 290, speed: 6.5, diff: 1,
    color: '#ffc83a', quote: '벌들은 내 친구야. 너는... 글쎄?', model: 'beekeeper',
    ai: { range: 12, style: 'ranged' },
    abilities: {
      lmb: { name: '벌떼', desc: '벌떼를 날린다. 적을 쏘고, 아군에 닿으면 꿀로 치유한다.', kind: 'proj', cd: 0.55, speed: 28, dmg: 27, r: 0.4, life: 1.6, healAlly: 28, onHit: { poison: [2, 4] }, look: 'bees', icon: 'bee', ai: {} },
      q: { name: '꿀 웅덩이', desc: '아군을 치유하고 적을 끈적하게 둔화시키는 꿀을 붓는다.', kind: 'zone', cd: 10, at: 'aim', range: 16, r: 3.8, dur: 5, hps: 22, st: { slow: [0.5, 0.45] }, look: 'honey', icon: 'cauldron', ai: { use: 'heal', r: 14 } },
      e: { name: '벌집 방패', desc: '조준한 아군에게 보호막 90을 씌운다.', kind: 'buff', target: 'ally', cd: 8, r: 28, shield: 90, alsoSelf: false, icon: 'shield', ai: { use: 'save', r: 24 } },
      x: { name: '여왕벌의 분노', desc: '거대한 벌떼가 6초 동안 나를 따라다니며 주변 적을 쏘고 아군을 치유한다.', kind: 'zone', at: 'self', follow: true, r: 6, dur: 6, dps: 30, hps: 24, look: 'swarm', icon: 'bee', ai: { use: 'self', max: 7 } },
    },
  },
  {
    id: 'surtr', name: '수르트', title: '용암 골렘', role: 'tank', hp: 580, speed: 5.6, diff: 1,
    color: '#ff5a1a', quote: '쿠웅. 쿠웅. 쿠우웅.', model: 'lavagolem',
    ai: { range: 2.6, style: 'melee' },
    abilities: {
      lmb: { name: '용암 주먹', desc: '달아오른 주먹으로 내리친다.', kind: 'melee', cd: 0.95, range: 3.0, arc: 80, dmg: 55, icon: 'fist' },
      q: { name: '마그마 돌진', desc: '돌진해 부딪힌 적을 크게 밀쳐내고 지나간 길을 녹인다.', kind: 'dash', cd: 9, dist: 10, dur: 0.4, dmg: 40, hitR: 1.6, knock: 10, trail: { r: 1.8, dur: 2.5, dps: 25, look: 'fireground' }, icon: 'dash', ai: { use: 'gap', min: 4, max: 10 } },
      e: { name: '굳은 껍질', desc: '3초 동안 받는 피해가 45% 줄고, 근처 적은 불탄다.', kind: 'zone', at: 'self', follow: true, cd: 12, r: 3.2, dur: 3, dps: 20, look: 'fireground', selfSt: { dr: [3, 0.45] }, icon: 'shield', ai: { use: 'defend' } },
      x: { name: '분화', desc: '땅에서 용암을 터뜨려 주변 적을 띄우고 불바다를 남긴다.', kind: 'aoe', at: 'self', r: 7.5, dmg: 95, knockup: 8, st: { burn: [3, 12] }, look: 'dragonburst', originZone: { r: 6, dur: 4, dps: 30, look: 'fireground' }, icon: 'meteor', ai: { use: 'self', max: 6 } },
    },
  },
  {
    id: 'celes', name: '셀레스', title: '별의 점성술사', role: 'mage', hp: 270, speed: 6.5, diff: 3,
    color: '#c8b8ff', quote: '네 운명은 오늘 밤 별에 적혀 있어.', model: 'astrologer',
    ai: { range: 16, style: 'ranged' },
    abilities: {
      lmb: { name: '별가루', desc: '반짝이는 별 세 개를 부채꼴로 던진다.', kind: 'proj', cd: 0.65, count: 3, spread: 12, speed: 46, dmg: 15, r: 0.22, life: 1.2, look: 'star', icon: 'star', ai: {} },
      q: { name: '별자리 표식', desc: '꿰뚫는 별빛. 맞힌 모든 적이 받는 피해가 4초 동안 20% 늘어난다.', kind: 'beam', cd: 8, range: 40, dmg: 30, pierce: true, onHit: { vuln: [4, 0.2] }, look: 'holy', icon: 'mark', ai: { use: 'aim', max: 32 } },
      e: { name: '수호성', desc: '조준한 아군 주위에 별을 돌려 2초 동안 투사체를 되돌리게 한다.', kind: 'buff', target: 'ally', cd: 11, r: 28, st: { reflect: [2] }, alsoSelf: true, icon: 'reflect', ai: { use: 'defend' } },
      x: { name: '운명의 유성', desc: '거대한 유성을 떨어뜨린다. 1.6초 뒤 넓은 범위에 큰 피해.', kind: 'zone', at: 'aim', range: 30, r: 6.5, delay: 1.6, dur: 0.2, burst: { dmg: 170, knockup: 6 }, look: 'starmeteor', icon: 'meteor', ai: { use: 'aim', max: 28 } },
    },
  },
  {
    id: 'dorn', name: '도른', title: '맹세의 성기사', role: 'tank', hp: 500, speed: 6.0, diff: 1,
    color: '#f0d070', quote: '맹세가 방패이고, 방패가 맹세다.', model: 'paladin',
    ai: { range: 2.4, style: 'melee' },
    abilities: {
      lmb: { name: '성스러운 철퇴', desc: '철퇴로 내려친다.', kind: 'melee', cd: 0.85, range: 3.0, arc: 85, dmg: 48, icon: 'hammer' },
      q: { name: '방패 강타', desc: '방패로 돌진해 처음 부딪힌 적을 기절시킨다.', kind: 'dash', cd: 8, dist: 8, dur: 0.35, dmg: 30, hitR: 1.5, stun: 1.0, icon: 'shield', ai: { use: 'gap', min: 3, max: 9 } },
      e: { name: '수호의 맹세', desc: '주변 아군 모두에게 보호막 70을 씌운다.', kind: 'buff', target: 'allies', cd: 12, r: 9, shield: 70, icon: 'halo', ai: { use: 'defend' } },
      x: { name: '심판의 철퇴', desc: '빛의 철퇴를 던진다. 터진 자리의 적을 기절시키고 아군을 치유한다.', kind: 'proj', speed: 30, grav: 0.4, dmg: 50, r: 0.5, life: 2, splash: { r: 6, dmg: 90, st: { stun: [1.2] }, heal: 90 }, look: 'holyhammer', icon: 'hammer', ai: { use: 'aim', max: 20 } },
    },
  },
  {
    id: 'koru', name: '코루', title: '늑대 사냥꾼', role: 'ranger', hp: 290, speed: 6.8, diff: 1,
    color: '#a8865a', quote: '흔적은 거짓말을 안 해.', model: 'hunter', gun: 'rifle',
    ai: { range: 15, style: 'ranged' },
    abilities: {
      lmb: { name: '석궁', desc: '묵직한 볼트를 쏜다. 6발, R로 재장전.', kind: 'proj', cd: 0.55, speed: 85, dmg: 36, r: 0.15, life: 0.9, ammo: 6, reload: 1.8, look: 'bolt', icon: 'arrow', ai: {} },
      q: { name: '곰덫', desc: '밟은 적을 2초 동안 묶는 덫. 최대 3개.', kind: 'trap', cd: 7, r: 1.8, life: 40, dmg: 45, st: { root: [2] }, max: 3, look: 'trap', icon: 'trap', ai: { use: 'escape', min: 7 } },
      e: { name: '사냥감 표시', desc: '꿰뚫는 볼트. 맞힌 적이 받는 피해가 4초 동안 25% 늘어난다.', kind: 'beam', cd: 9, range: 45, dmg: 25, pierce: true, onHit: { vuln: [4, 0.25] }, look: 'silver', icon: 'mark', ai: { use: 'aim', max: 35 } },
      x: { name: '포획망', desc: '거대한 그물을 쏜다. 넓은 범위의 적을 2.5초 동안 묶는다.', kind: 'proj', speed: 38, grav: 0.3, dmg: 30, r: 0.6, life: 1.5, splash: { r: 6, dmg: 40, st: { root: [2.5] } }, look: 'net', icon: 'web', ai: { use: 'aim', max: 20 } },
    },
  },
  {
    id: 'maren', name: '마렌', title: '조류의 무녀', role: 'support', hp: 310, speed: 6.6, diff: 2,
    color: '#5ad8e8', quote: '밀물이 오면, 모두 돌아오게 돼.', model: 'tidepriestess',
    ai: { range: 13, style: 'ranged' },
    abilities: {
      lmb: { name: '물방울', desc: '적에게는 피해, 아군에게 맞으면 치유.', kind: 'proj', cd: 0.5, speed: 36, dmg: 22, r: 0.3, life: 1.6, healAlly: 26, onHit: { slow: [1, 0.15] }, look: 'water', icon: 'orb', ai: {} },
      q: { name: '물결 밀치기', desc: '앞쪽으로 물결을 일으켜 적을 밀어낸다.', kind: 'aoe', at: 'cone', cd: 8, r: 7, angle: 70, dmg: 30, knock: 12, look: 'wave', icon: 'wave', ai: { use: 'self', max: 6 } },
      e: { name: '물방울 보호막', desc: '조준한 아군과 나에게 보호막 75를 씌운다.', kind: 'buff', target: 'ally', cd: 9, r: 28, shield: 75, alsoSelf: true, icon: 'shield', ai: { use: 'save', r: 24 } },
      x: { name: '밀물', desc: '6초 동안 넓은 물결이 아군을 초당 45 치유하고 적을 둔화시킨다.', kind: 'zone', at: 'self', r: 8, dur: 6, hps: 45, st: { slow: [0.5, 0.35] }, look: 'tide', icon: 'wave', ai: { use: 'heal', r: 9 } },
    },
  },
  {
    id: 'garrick', name: '개릭', title: '사슬 교도관', role: 'tank', hp: 520, speed: 6.0, diff: 2,
    color: '#8a7a9a', quote: '도망칠 데는 없어. 여긴 내 감옥이야.', model: 'warden',
    ai: { range: 2.6, style: 'melee' },
    abilities: {
      lmb: { name: '쇠사슬 철퇴', desc: '사슬 철퇴를 휘두른다.', kind: 'melee', cd: 0.9, range: 3.6, arc: 110, dmg: 46, icon: 'chain' },
      q: { name: '구속의 사슬', desc: '사슬로 적을 묶는다. 1.5초 버티면 끌어당겨 기절시킨다.', kind: 'tether', cd: 10, range: 14, hold: 1.5, dps: 16, dmg: 30, st: { stun: [0.8] }, pull: 10, drain: 0.5, look: 'chain', icon: 'chain', ai: { use: 'aim', max: 12 } },
      e: { name: '교도관의 의지', desc: '4초 동안 받는 피해가 35% 줄어든다.', kind: 'buff', target: 'self', cd: 11, st: { dr: [4, 0.35] }, icon: 'shield', ai: { use: 'defend' } },
      x: { name: '어둠의 감옥', desc: '주변을 감옥으로 만든다. 안의 적은 둔화되고 투사체가 밖으로 나가지 못한다.', kind: 'zone', at: 'self', r: 7, dur: 5, dps: 18, st: { slow: [0.5, 0.4] }, pull: 2, look: 'prison', icon: 'collapse', ai: { use: 'self', max: 6 } },
    },
  },
  {
    id: 'zephyr', name: '제피르', title: '폭풍 기수', role: 'bruiser', hp: 380, speed: 7.0, diff: 2,
    color: '#7ad0ff', quote: '하늘을 달리는 자는 넘어지지 않아.', model: 'stormrider',
    ai: { range: 3.4, style: 'melee' },
    abilities: {
      lmb: { name: '폭풍 창', desc: '긴 창으로 멀리 찌른다.', kind: 'melee', cd: 0.75, range: 4.4, arc: 45, dmg: 44, icon: 'spear' },
      q: { name: '바람 타기', desc: '솟구쳐 바람을 타고 활공한다.', kind: 'glide', cd: 8, up: 9, dur: 2.2, icon: 'wing', ai: { use: 'gap', min: 6, max: 16 } },
      e: { name: '회오리 찌르기', desc: '주변을 휘감아 적을 띄워 올린다.', kind: 'aoe', at: 'self', cd: 8, r: 4.2, dmg: 45, knockup: 7, look: 'roar', icon: 'whirl', ai: { use: 'self', max: 4 } },
      x: { name: '천둥 질주', desc: '번개와 함께 멀리 돌격해 부딪힌 적을 날려 버리고 감전 지대를 남긴다.', kind: 'dash', dist: 22, dur: 0.5, invuln: true, dmg: 85, hitR: 2.0, knock: 12, trail: { r: 2, dur: 3, dps: 30, st: { slow: [0.4, 0.3] }, look: 'sparkpath' }, icon: 'bolt', ai: { use: 'gap', min: 5, max: 20 } },
    },
  },
  {
    id: 'lumen', name: '루멘', title: '태양의 총사', role: 'ranger', hp: 260, speed: 6.7, diff: 2,
    color: '#ffd84a', quote: '그늘에 숨어도 소용없어. 해는 어디에나 뜨니까.', model: 'sungunner', gun: 'rifle',
    ai: { range: 17, style: 'ranged' },
    abilities: {
      lmb: { name: '태양총', desc: '빛탄을 쏜다. 맞히면 가장 다친 주변 아군을 조금 치유한다. 20발.', kind: 'proj', cd: 0.16, speed: 80, dmg: 10, r: 0.12, life: 0.8, healNearest: { r: 10, amt: 4 }, ammo: 20, reload: 1.7, look: 'sunray', icon: 'rifle', ai: {} },
      q: { name: '태양 포탑', desc: '8초 동안 빛탄을 쏘며 맞힐 때마다 아군을 치유하는 포탑을 세운다.', kind: 'zone', cd: 13, at: 'front', dist: 2, r: 0.8, dur: 8, look: 'sunturret', turret: { every: 0.4, range: 22, speed: 70, dmg: 10, r: 0.12, life: 0.6, healNearest: { r: 10, amt: 8 }, look: 'sunray' }, icon: 'turret', ai: { use: 'engage', max: 18 } },
      e: { name: '섬광탄', desc: '눈부신 빛을 터뜨려 주변 적을 1초 동안 기절시킨다.', kind: 'aoe', at: 'self', cd: 11, r: 5, dmg: 20, st: { stun: [1.0] }, look: 'healwave', icon: 'halo', ai: { use: 'self', max: 5 } },
      x: { name: '정오의 포격', desc: '태양 광선을 모아 일직선의 모든 적을 꿰뚫고 불태운다.', kind: 'beam', range: 60, dmg: 160, pierce: true, onHit: { burn: [3, 15] }, look: 'execution', icon: 'ray', ai: { use: 'aim', max: 45 } },
    },
  },
  {
    id: 'frey', name: '프레이', title: '서리 결투가', role: 'assassin', hp: 300, speed: 7.4, diff: 2,
    color: '#bfe8ff', quote: '한 번의 찌르기로 충분해. 우아하게.', model: 'duelist',
    ai: { range: 2.6, style: 'melee' },
    abilities: {
      lmb: { name: '레이피어', desc: '날카롭게 찌른다. 둔화된 적에게 1.4배.', kind: 'melee', cd: 0.45, range: 3.4, arc: 50, dmg: 42, vsSlowed: 1.4, icon: 'spear' },
      q: { name: '서리 찌르기', desc: '앞으로 찌르며 돌진해 맞힌 적을 크게 둔화시킨다.', kind: 'dash', cd: 5, dist: 8, dur: 0.22, dmg: 30, hitR: 1.4, onHitSt: { slow: [2, 0.5] }, icon: 'dash', ai: { use: 'gap', min: 3, max: 9 } },
      e: { name: '물러서기', desc: '뒤로 빠지며 1초 동안 투명해진다.', kind: 'launch', cd: 8, back: 9, up: 4, selfSt: { invis: [1] }, icon: 'backjump', ai: { use: 'escape', min: 3 } },
      x: { name: '절대영도', desc: '시야 앞쪽의 모든 적을 찔러 1.5초 동안 얼린다.', kind: 'deadeye', range: 20, cone: 70, dmg: 90, onHitSt: { root: [1.5] }, look: 'icespike', icon: 'snow', ai: { use: 'engage', max: 18 } },
    },
  },
  {
    id: 'asha', name: '아샤', title: '재의 예언자', role: 'support', hp: 280, speed: 6.4, diff: 2,
    color: '#ff9a5a', quote: '재 속에서 무엇이 피어날지, 난 알아.', model: 'ashprophet',
    ai: { range: 13, style: 'ranged' },
    abilities: {
      lmb: { name: '불씨', desc: '타오르는 불씨를 던진다.', kind: 'proj', cd: 0.55, speed: 34, dmg: 24, r: 0.3, life: 1.5, look: 'fireball', icon: 'fire', ai: {} },
      q: { name: '재생의 불꽃', desc: '조준한 아군을 60 치유하고 4초 동안 공격력을 20% 올린다.', kind: 'buff', target: 'ally', cd: 8, r: 28, heal: 60, st: { dmgUp: [4, 0.2] }, icon: 'heal', ai: { use: 'save', r: 24 } },
      e: { name: '불의 장막', desc: '앞에 불의 벽을 세운다.', kind: 'zone', cd: 11, at: 'front', dist: 4, wall: { w: 6, d: 1.2 }, dur: 4, dps: 38, h: 2.4, look: 'firewall', icon: 'wall', ai: { use: 'aim', max: 7 } },
      x: { name: '불사조의 축복', desc: '주변 아군 모두를 100 치유하고 3초 동안 쓰러지지 않게 한다.', kind: 'buff', target: 'allies', r: 12, heal: 100, st: { undying: [3] }, icon: 'wing', ai: { use: 'save', r: 12 } },
    },
  },
];

export const THIRD_RARITY = {
  vesper: 6, hyeon: 6, celes: 6, lumen: 6,
  kaira: 5, orin: 5, nyx: 5, ragna: 5, surtr: 5, maren: 5, zephyr: 5,
  brann: 4, thalia: 4, gorm: 4, pell: 4, dorn: 4, koru: 4, garrick: 4, frey: 4, asha: 4,
};
