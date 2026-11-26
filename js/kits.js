// Reworked abilities for heroes 1–40. Each hero is built around its passive (passives.js).
// Only the slots listed here replace the original data.
export const KITS = {
  valok: {
    q: { name: '맹세의 돌진', desc: '돌진해 부딪힌 적을 앞으로 끌고 가며 0.4초 기절시킨다.', kind: 'dash', cd: 8, dist: 10, dur: 0.38, dmg: 30, hitR: 1.7, knock: 9, onHitSt: { stun: [0.4] }, icon: 'dash', ai: { use: 'gap', min: 4, max: 11 } },
    e: { name: '피의 방벽', desc: '모은 혈기를 모두 써서 보호막(30 + 혈기×1.3)을 얻는다.', kind: 'buff', target: 'self', cd: 9, cost: 1, costAll: true, icon: 'shield', ai: { use: 'defend' } },
    x: { name: '혈맹 서약', desc: '5초 동안 주변 적을 끌어당기는 피의 사슬을 두르고, 받는 피해 20% 감소, 받은 피해의 35%를 공격자에게 되돌린다.', kind: 'zone', at: 'self', follow: true, r: 7, dur: 5, dps: 16, pull: 2.5, look: 'bloodfeast', selfSt: { thorns: [5, 0.35], dr: [5, 0.2] }, icon: 'chain', ai: { use: 'self', max: 6 } },
  },
  nir: {
    e: { name: '처형 표식', desc: '8m 안의 적에게 쌓인 그림자 표식을 모두 터뜨린다 (기본 10 + 표식당 28). 터뜨릴 표식이 없으면 재사용 대기시간이 대부분 돌아온다.', kind: 'detonate', what: 'marks', cd: 7, range: 8, base: 10, per: 28, refund: true, look: 'void', icon: 'skull', ai: { use: 'self', max: 7 } },
    x: { name: '천 개의 칼날', desc: '14m 안의 적 최대 5명에게 차례로 순간이동하며 벤다. 시전 중 무적.', kind: 'flurry', range: 14, max: 5, every: 0.2, dmg: 60, icon: 'slash', ai: { use: 'engage', max: 12 } },
  },
  igna: {
    q: { name: '잿불 폭발', desc: '22m 안의 불타는 적을 모두 폭발시킨다. 남은 화상 시간이 길수록 강하다.', kind: 'detonate', what: 'burn', cd: 7, range: 22, base: 25, per: 12, refund: true, look: 'fireball', icon: 'burst', ai: { use: 'self', max: 18 } },
    e: { name: '도깨비불', desc: '가장 가까운 적을 쫓아가며 태우는 도깨비불을 6초 동안 부린다.', kind: 'zone', cd: 11, at: 'front', dist: 2, r: 1.8, dur: 6, dps: 32, chase: 6.5, st: { burn: [1, 6] }, look: 'wisp', icon: 'fire', ai: { use: 'engage', max: 16 } },
    x: { name: '재의 폭풍', desc: '6초 동안 재의 화신이 된다. 빨라지고, 화염구가 유도되는 유성탄으로 바뀐다.', kind: 'buff', target: 'self', form: { dur: 6, st: { haste: [6, 0.2] }, lmb: { name: '유성탄', desc: '적을 쫓아가는 작은 유성.', kind: 'proj', cd: 0.3, speed: 30, dmg: 28, r: 0.35, life: 1.6, homing: 3, splash: { r: 2, dmg: 16 }, look: 'meteorlet', icon: 'meteor' } }, icon: 'meteor', ai: { use: 'engage', max: 18 } },
  },
  selene: {
    q: { name: '파편 화살', desc: '맞으면 얼음 파편 여섯 개로 흩어지는 화살.', kind: 'proj', cd: 7, speed: 60, dmg: 30, r: 0.2, life: 1, onHit: { slow: [1.5, 0.3] }, split: { n: 6, def: { speed: 26, dmg: 14, r: 0.18, life: 0.35, onHit: { slow: [1, 0.2] }, look: 'iceshard' } }, look: 'icearrow', icon: 'arrow', ai: { use: 'aim', max: 26 } },
    e: { name: '올빼미 정령', desc: '8초 동안 적을 쫓아다니며 둔화시키는 서리 올빼미를 날린다.', kind: 'zone', cd: 12, at: 'front', dist: 2, r: 3, dur: 8, dps: 8, chase: 7.5, st: { slow: [0.5, 0.3] }, look: 'owl', icon: 'wing', ai: { use: 'engage', max: 20 } },
    x: { name: '빙하 화살', desc: '전장을 가로지르는 거대한 화살. 맞은 모든 적을 2초 동안 얼린다.', kind: 'beam', range: 90, pierce: true, wallPierce: true, dmg: 110, onHit: { root: [2] }, look: 'frost', icon: 'arrow', ai: { use: 'aim', max: 60 } },
  },
  mor: {
    lmb: { name: '영혼탄', desc: '적을 쫓아가는 영혼. 아군에 닿으면 치유한다.', kind: 'proj', cd: 0.6, speed: 30, dmg: 22, r: 0.3, life: 1.6, homing: 2.2, healAlly: 22, look: 'soul', icon: 'orb', ai: {} },
    q: { name: '영혼 방출', desc: '모은 영혼을 모두 풀어 12m 안 아군을 치유한다 (25 + 영혼당 30).', kind: 'buff', target: 'allies', cd: 10, r: 12, heal: 25, cost: 0, costAll: true, icon: 'heal', ai: { use: 'heal', r: 12 } },
    e: { name: '망자의 손', desc: '조준 지점에서 0.8초 뒤 손이 솟아 적을 1.5초 동안 붙잡는다.', kind: 'zone', cd: 10, at: 'aim', range: 20, r: 3.5, delay: 0.8, dur: 0.2, burst: { dmg: 40, st: { root: [1.5] } }, look: 'hands', icon: 'vine', ai: { use: 'aim', max: 18 } },
    x: { name: '망령 군단', desc: '망령 셋 + 모은 영혼 수만큼 망령을 불러 8초 동안 적을 쫓게 한다.', kind: 'buff', target: 'self', st: { dr: [2, 0.2] }, icon: 'skull', ai: { use: 'engage', max: 18 } },
  },
  grom: {
    q: { name: '땅굴', desc: '땅속으로 파고들어 이동한 뒤 솟아올라 주변 적을 띄운다.', kind: 'leap', cd: 9, fwd: 12, up: 3.5, selfSt: { invuln: [0.6], invis: [0.6] }, land: { r: 4, dmg: 40, knockup: 6 }, icon: 'leap', ai: { use: 'gap', min: 4, max: 12 } },
    e: { name: '묘비 세우기', desc: '앞에 투사체를 막는 묘비를 세운다.', kind: 'zone', cd: 10, at: 'front', dist: 3, wall: { w: 3.6, d: 0.8 }, dur: 6, blockProj: true, h: 2.6, look: 'tomb', icon: 'wall', ai: { use: 'defend' } },
    x: { name: '생매장', desc: '1초 뒤 조준 지점의 적을 땅에 묻어 2.2초 동안 기절시킨다.', kind: 'zone', at: 'aim', range: 18, r: 5, delay: 1, dur: 0.2, burst: { dmg: 70, st: { stun: [2.2] } }, look: 'grave', icon: 'quake', ai: { use: 'aim', max: 16 } },
  },
  razel: {
    e: { name: '연쇄 번개', desc: '적 다섯 명까지 튀는 번개. 맞은 적은 둔화된다.', kind: 'chain', cd: 8, range: 26, bounces: 4, dmg: 40, onHit: { slow: [1.2, 0.3] }, look: 'lightning', icon: 'bolt', ai: { use: 'aim', max: 24 } },
    x: { name: '번개 화신', desc: '6초 동안 번개의 화신이 된다. 빨라지고, 번개 줄기가 적 셋에게 튀는 연쇄 번개가 된다.', kind: 'buff', target: 'self', form: { dur: 6, st: { haste: [6, 0.3] }, lmb: { name: '화신의 번개', desc: '적 셋에게 튀는 번개.', kind: 'chain', cd: 0.45, range: 26, bounces: 2, dmg: 30, look: 'lightning', icon: 'bolt' } }, icon: 'bolt', ai: { use: 'engage', max: 20 } },
  },
  veyla: {
    e: { name: '생명 흡수', desc: '2초 동안 조준한 적의 피를 빨아들인다. 준 피해만큼 회복.', kind: 'channel', cd: 9, range: 14, dur: 2, tick: 0.25, dmg: 16, steal: 1, look: 'drain', icon: 'drop', ai: { use: 'aim', max: 12 } },
    x: { name: '피의 연회', desc: '4초 동안 주변 적을 끌어당기며 피를 뽑는다. 이 동안 흡혈 50%.', kind: 'zone', at: 'self', follow: true, r: 9, dur: 4, dps: 30, pull: 3, look: 'bloodfeast', selfSt: { steal: [4, 0.5] }, icon: 'bat', ai: { use: 'self', max: 7 } },
  },
  kael: {
    e: { name: '방패 결속', desc: '조준한 아군과 5초 동안 묶여 그 아군이 받는 피해의 40%를 대신 받고, 보호막 40을 준다.', kind: 'buff', target: 'ally', cd: 10, r: 26, shield: 40, guard: [5, 0.4], icon: 'shield', ai: { use: 'save', r: 22 } },
    x: { name: '성역의 창', desc: '창을 꽂아 6초 동안 적 투사체를 막고 아군을 치유하는 빛의 결계를 친다.', kind: 'zone', at: 'self', r: 6, dur: 6, hps: 26, dome: true, look: 'sanctum', icon: 'sanctum', ai: { use: 'heal', r: 8 } },
  },
  onyx: {
    q: { name: '해독제', desc: '터지면 아군을 치유하고 적을 중독시키는 플라스크.', kind: 'proj', cd: 8, speed: 24, grav: 0.8, dmg: 15, r: 0.3, life: 2, splash: { r: 3.5, dmg: 20, st: { poison: [3, 6] }, heal: 45 }, look: 'antidote', icon: 'flask', ai: { use: 'heal', r: 14 } },
    e: { name: '연막 후퇴', desc: '뒤로 물러나며 제자리에 독 연막을 남긴다.', kind: 'launch', cd: 8, back: 10, up: 5, selfSt: { invis: [1] }, originZone: { r: 3.5, dur: 4, dps: 12, st: { poison: [1, 5] }, look: 'smoke' }, icon: 'smoke', ai: { use: 'escape', min: 5 } },
    x: { name: '역병의 날', desc: '8초 동안 적을 쫓아다니는 역병 구름을 푼다. 중독, 치유 감소.', kind: 'zone', at: 'front', dist: 3, r: 4.5, dur: 8, dps: 22, chase: 4.5, st: { poison: [1, 6], wither: [1, 0.5], slow: [0.5, 0.2] }, look: 'miasma', icon: 'miasma', ai: { use: 'engage', max: 18 } },
  },
  sira: {
    e: { name: '중력 구체', desc: '천천히 날아가며 주변 적을 빨아들이는 구체.', kind: 'proj', cd: 9, speed: 9, dmg: 20, r: 0.8, life: 3, pierce: true, pullAround: 5, onHit: { slow: [1, 0.3] }, look: 'gravity', icon: 'void', ai: { use: 'aim', max: 18 } },
  },
  ulfric: {
    e: { name: '얼음 발톱', desc: '주변을 할퀴어 둔화시키고 표식을 남긴다.', kind: 'aoe', at: 'self', cd: 7, r: 4.2, dmg: 45, st: { slow: [2, 0.35] }, look: 'roar', icon: 'claw', ai: { use: 'self', max: 4 } },
    x: { name: '늑대 무리', desc: '7초 동안 거대해져 공격 속도가 오르고, 서리 늑대 셋을 불러 적을 쫓게 한다.', kind: 'buff', target: 'self', st: { giant: [7], atkSpd: [7, 0.5], dr: [7, 0.15] }, heal: 60, icon: 'wolf', ai: { use: 'engage', max: 10 } },
  },
  hark: {
    e: { name: '뼈 갑옷', desc: '보호막 40 + 주변 8m 적 하나당 25.', kind: 'buff', target: 'self', cd: 10, icon: 'shield', ai: { use: 'defend' } },
    x: { name: '광란', desc: '6초 동안 광란에 빠진다. 공격 속도 +80%, 흡혈 25%, 이동 속도 +20%.', kind: 'buff', target: 'self', form: { dur: 6, st: { atkSpd: [6, 0.8], steal: [6, 0.25], haste: [6, 0.2] }, lmb: { name: '광란의 도끼', desc: '더 빠르고 넓게 휘두른다.', kind: 'melee', cd: 0.42, range: 3.2, arc: 130, dmg: 38, icon: 'axe' } }, icon: 'rage', ai: { use: 'engage', max: 6 } },
  },
  eris: {
    e: { name: '별의 장막', desc: '조준한 아군과 나에게 보호막 60과 2초 이동 속도 증가.', kind: 'buff', target: 'ally', cd: 9, r: 28, shield: 60, st: { haste: [2, 0.3] }, alsoSelf: true, icon: 'star', ai: { use: 'save', r: 24 } },
    x: { name: '성운', desc: '14m 안의 아군을 80 치유하고 Q·E 재사용 대기시간을 6초 줄인다.', kind: 'buff', target: 'allies', r: 14, heal: 80, cdr: 6, st: { haste: [3, 0.2] }, icon: 'starfall', ai: { use: 'heal', r: 14 } },
  },
  azrak: {
    e: { name: '화염 숨결', desc: '1.5초 동안 앞쪽에 불을 뿜는다.', kind: 'channel', cd: 9, range: 8, cone: 55, dur: 1.5, tick: 0.25, dmg: 20, onHit: { burn: [2, 8] }, look: 'flame', icon: 'fire', ai: { use: 'self', max: 7 } },
    x: { name: '용화', desc: '7초 동안 용의 모습이 된다. 거대해지고 받는 피해 20% 감소, 창 대신 화염탄을 뱉는다.', kind: 'buff', target: 'self', form: { dur: 7, st: { giant: [7], dr: [7, 0.2] }, heal: 80, lmb: { name: '용의 화염탄', desc: '터지는 화염탄.', kind: 'proj', cd: 0.65, speed: 32, dmg: 40, r: 0.5, life: 1.2, splash: { r: 3, dmg: 30 }, look: 'dragonfire', icon: 'fire' } }, icon: 'dragon', ai: { use: 'engage', max: 14 } },
  },
  lian: {
    lmb: { name: '환영 단검', desc: '적 두 명에게 더 튀는 단검.', kind: 'proj', cd: 0.5, speed: 50, dmg: 24, r: 0.18, life: 0.8, ricochet: 2, look: 'mirror', icon: 'dagger', ai: {} },
    e: { name: '거울 결계', desc: '조준 지점에 4초 동안 적 투사체를 막는 거울 결계를 친다. 안의 적은 둔화.', kind: 'zone', cd: 11, at: 'aim', range: 16, r: 4, dur: 4, dome: true, st: { slow: [0.5, 0.3] }, look: 'mirrordome', icon: 'reflect', ai: { use: 'defend' } },
    x: { name: '만화경', desc: '조준 지점에 거울 넷을 세워 4초 동안 가까운 적에게 빛을 쏜다.', kind: 'zone', at: 'aim', range: 20, r: 4, dur: 4, look: 'mirror', turret: { every: 0.12, range: 14, speed: 90, dmg: 9, r: 0.12, life: 0.3, look: 'mirror' }, icon: 'star', ai: { use: 'aim', max: 18 } },
  },
  nox: {
    e: { name: '까마귀 떼', desc: '적을 쫓아가는 까마귀 셋을 날린다.', kind: 'proj', cd: 7, count: 3, spread: 22, speed: 28, dmg: 20, r: 0.3, life: 1.8, homing: 3.5, look: 'crow', icon: 'crow', ai: { use: 'aim', max: 22 } },
    x: { name: '흑익의 폭풍', desc: '6초 동안 적을 쫓는 까마귀 폭풍. 휩쓸린 적은 스킬을 쓰지 못한다.', kind: 'zone', at: 'front', dist: 3, r: 4, dur: 6, dps: 24, chase: 8, st: { silence: [0.5] }, look: 'crowstorm', icon: 'crow', ai: { use: 'engage', max: 20 } },
  },
  tyr: {
    e: { name: '강화 룬', desc: '조준한 아군의 다음 공격 피해를 40% 올리고 2초 동안 빠르게 한다.', kind: 'buff', target: 'ally', cd: 8, r: 26, st: { empower: [8, 0.4], haste: [2, 0.25] }, alsoSelf: true, icon: 'rune', ai: { use: 'save', r: 22 } },
    x: { name: '대장장이의 걸작', desc: '거대한 룬 망치를 던진다. 꿰뚫고 돌아오며 맞은 적을 기절시킨다.', kind: 'proj', speed: 26, dmg: 80, r: 0.9, life: 0.9, boomerang: true, pierce: true, onHit: { stun: [1.2] }, look: 'runehammer', icon: 'hammer', ai: { use: 'aim', max: 16 } },
  },
  seraph: {
    e: { name: '타락', desc: '빛과 타락 자세를 오간다. 타락 자세의 광휘는 피해가 크고 30%를 흡혈한다.', kind: 'stance', cd: 1.5, alt: { name: '타락한 광휘', desc: '검은 광휘. 피해 30% 흡혈.', kind: 'beam', cd: 0.5, range: 30, dmg: 30, steal: 0.3, look: 'void', icon: 'ray' }, icon: 'wing', ai: { use: 'self', max: 15 } },
    x: { name: '강림', desc: '하늘로 솟아 활공하며 4초 동안 아래로 깃털을 쏟아붓는다.', kind: 'glide', up: 12, dur: 4, icon: 'wing', ai: { use: 'engage', max: 14 } },
  },
  belladonna: {
    e: { name: '치유의 꽃', desc: '조준 지점에 6초 동안 아군을 초당 26 치유하는 꽃을 피운다.', kind: 'zone', cd: 11, at: 'aim', range: 18, r: 3.2, dur: 6, hps: 26, look: 'flower', icon: 'heal', ai: { use: 'heal', r: 16 } },
    x: { name: '만개', desc: '5초 동안 넓은 꽃밭을 펼쳐 아군을 치유하고 적을 중독시킨다.', kind: 'zone', at: 'self', r: 11, dur: 5, hps: 30, dps: 10, st: { poison: [1, 6], wither: [1, 0.4] }, look: 'bloom', icon: 'cauldron', ai: { use: 'heal', r: 10 } },
  },
  grave: {
    q: { name: '구르기', desc: '구르며 즉시 재장전한다.', kind: 'dash', cd: 6, dist: 7, dur: 0.3, refill: true, icon: 'dash', ai: { use: 'escape', min: 5 } },
    e: { name: '성수병', desc: '터지면 적을 태우고 아군을 치유하는 성수.', kind: 'proj', cd: 9, speed: 24, grav: 0.8, dmg: 20, r: 0.3, life: 2, splash: { r: 3.2, dmg: 35, heal: 40 }, look: 'holy', icon: 'flask', ai: { use: 'aim', max: 16 } },
  },
  bark: {
    q: { name: '사냥 갈고리', desc: '맞힌 적을 끌어온다.', kind: 'proj', cd: 9, speed: 55, dmg: 20, r: 0.3, life: 0.5, pullTo: 10, look: 'hook', icon: 'chain', ai: { use: 'aim', min: 5, max: 18 } },
    e: { name: '반동 사격', desc: '바닥에 쏴 그 반동으로 뒤로 날아오른다. 주변 적은 밀려난다.', kind: 'launch', cd: 7, back: 9, up: 7, aoe: { r: 4, dmg: 30, knock: 12 }, icon: 'backjump', ai: { use: 'escape', min: 3 } },
    x: { name: '용의 숨결탄', desc: '6초 동안 산탄이 불을 붙이고 더 멀리 퍼진다.', kind: 'buff', target: 'self', form: { dur: 6, lmb: { name: '용의 숨결탄', desc: '불붙는 산탄.', kind: 'proj', cd: 0.75, count: 7, spread: 14, speed: 55, dmg: 12, r: 0.15, life: 0.5, onHit: { burn: [3, 6] }, ammo: 6, reload: 1.4, look: 'ember', icon: 'fire' } }, refill: true, icon: 'fire', ai: { use: 'engage', max: 8 } },
  },
  elise: {
    e: { name: '감시 덫', desc: '밟은 적을 둔화시키고 받는 피해를 25% 늘린다. 최대 2개.', kind: 'trap', cd: 8, r: 2, life: 40, dmg: 15, st: { slow: [2, 0.4], vuln: [4, 0.25] }, max: 2, look: 'mine', icon: 'trap', ai: { use: 'escape', min: 6 } },
    x: { name: '은빛 탄환', desc: '벽을 꿰뚫는 한 발.', kind: 'beam', range: 120, pierce: true, wallPierce: true, dmg: 160, look: 'execution', icon: 'rifle', ai: { use: 'aim', max: 80 } },
  },
  karman: {
    q: { name: '용해 폭탄', desc: '맞은 적이 받는 피해 25% 증가, 둔화.', kind: 'proj', cd: 8, speed: 28, grav: 0.7, dmg: 20, r: 0.3, life: 2, splash: { r: 3.4, dmg: 30, st: { vuln: [4, 0.25], slow: [2, 0.3] } }, look: 'acid', icon: 'flask', ai: { use: 'aim', max: 20 } },
  },
  mira: {
    e: { name: '과열 방출', desc: '열기를 뿜어 주변 적을 밀어내고 즉시 재장전한다.', kind: 'aoe', at: 'self', cd: 9, r: 5, dmg: 30, knock: 12, refill: true, look: 'roar', icon: 'burst', ai: { use: 'self', max: 4 } },
  },
  rowan: {
    x: { name: '연발', desc: '4초 동안 탄을 쓰지 않고 한 번에 세 발씩 쏜다.', kind: 'buff', target: 'self', form: { dur: 4, lmb: { name: '연발', desc: '부채꼴 세 발.', kind: 'proj', cd: 0.28, count: 3, spread: 7, speed: 90, dmg: 18, r: 0.12, life: 0.6, look: 'bullet', icon: 'pistol' } }, icon: 'pistol', ai: { use: 'engage', max: 18 } },
  },
  helga: {
    e: { name: '성화 방패', desc: '보호막 80. 4초 동안 받은 피해의 30%를 공격자에게 되돌린다.', kind: 'buff', target: 'self', cd: 10, shield: 80, st: { thorns: [4, 0.3] }, icon: 'shield', ai: { use: 'defend' } },
    x: { name: '불의 순례', desc: '무적 상태로 멀리 돌진하며 지나간 길을 불바다로 만든다.', kind: 'dash', dist: 18, dur: 0.55, invuln: true, dmg: 60, hitR: 1.8, trail: { r: 2.4, dur: 4, dps: 35, st: { burn: [1.5, 8] }, look: 'fireground' }, icon: 'fire', ai: { use: 'gap', min: 4, max: 16 } },
  },
  zeno: {
    e: { name: '룬 지뢰', desc: '밟으면 1.2초 묶는 룬 지뢰. 최대 3개.', kind: 'trap', cd: 7, r: 2, life: 40, dmg: 45, st: { root: [1.2] }, max: 3, look: 'mine', icon: 'rune', ai: { use: 'escape', min: 6 } },
  },
  nocturne: {
    q: { name: '그림자 잠행', desc: '3초 동안 투명해지고 빨라진다.', kind: 'buff', target: 'self', cd: 10, st: { invis: [3], haste: [3, 0.3] }, icon: 'smoke', ai: { use: 'escape', min: 5 } },
    e: { name: '그림자 표창', desc: '적 셋에게 튀는 표창.', kind: 'proj', cd: 6, speed: 45, dmg: 30, r: 0.25, life: 0.8, ricochet: 3, look: 'shadowstar', icon: 'dagger', ai: { use: 'aim', max: 18 } },
    x: { name: '그림자 처형', desc: '25m 안에서 체력 비율이 가장 낮은 적 뒤로 순간이동해 처형한다. 잃은 체력이 많을수록 강하다.', kind: 'flurry', range: 25, max: 1, every: 0.15, dmg: 60, execute: 1.6, pick: 'low', icon: 'skull', ai: { use: 'engage', max: 22 } },
  },
  talon: {
    e: { name: '방어 자세', desc: '켜고 끈다. 켜면 느려지지만 받는 피해 40% 감소, 포격이 빠른 연사로 바뀐다.', kind: 'stance', cd: 2, alt: { name: '연사 포격', desc: '빠르지만 약한 포격.', kind: 'proj', cd: 0.22, speed: 60, dmg: 16, r: 0.2, life: 0.8, look: 'cannon', icon: 'arm' }, icon: 'shield', ai: { use: 'defend' } },
  },
  moloch: {
    q: { name: '심연 손아귀', desc: '맞힌 적을 끌어온다.', kind: 'proj', cd: 9, speed: 40, dmg: 30, r: 0.5, life: 0.6, pullTo: 12, onHit: { slow: [1, 0.4] }, look: 'abyss', icon: 'claw', ai: { use: 'aim', min: 4, max: 16 } },
    e: { name: '심해 도약', desc: '뛰어올라 내려찍는다.', kind: 'leap', cd: 10, fwd: 10, up: 9, land: { r: 4.5, dmg: 45, knockup: 5 }, icon: 'leap', ai: { use: 'gap', min: 4, max: 12 } },
  },
  sien: {
    e: { name: '자장가', desc: '조준 지점의 적을 2.5초 동안 재운다. 피해를 받으면 깬다.', kind: 'zone', cd: 12, at: 'aim', range: 18, r: 4, delay: 0.4, dur: 0.2, burst: { dmg: 1, st: { sleep: [2.5] } }, look: 'sleep', icon: 'moon', ai: { use: 'aim', max: 16 } },
  },
  crow: {
    x: { name: '단두대', desc: '0.8초 뒤 거대한 칼날이 떨어진다. 잃은 체력이 많은 적일수록 큰 피해.', kind: 'zone', at: 'aim', range: 18, r: 3.6, delay: 0.8, dur: 0.2, burst: { dmg: 80, execute: 2 }, look: 'guillotine', icon: 'skull', ai: { use: 'aim', max: 16 } },
  },
  aura: {
    e: { name: '연쇄 낙뢰', desc: '적 넷에게 튀는 낙뢰. 맞은 적은 0.4초 기절.', kind: 'chain', cd: 9, range: 22, bounces: 3, dmg: 35, onHit: { stun: [0.4] }, look: 'lightning', icon: 'bolt', ai: { use: 'aim', max: 20 } },
  },
  bael: {
    x: { name: '타락한 왕관', desc: '8초 동안 지옥의 왕이 된다. 거대해지고, 검을 휘두르면 불의 검기가 날아간다.', kind: 'buff', target: 'self', form: { dur: 8, st: { giant: [8], dr: [8, 0.2] }, heal: 100, lmb: { name: '지옥 검기', desc: '꿰뚫는 불의 검기.', kind: 'proj', cd: 0.8, speed: 34, dmg: 45, r: 0.9, life: 0.6, pierce: true, onHit: { burn: [2, 10] }, look: 'firewave', icon: 'slash' } }, icon: 'crown', ai: { use: 'engage', max: 10 } },
  },
  luna: {
    lmb: { name: '얼음 파편', desc: '맞으면 작은 파편으로 흩어진다.', kind: 'proj', cd: 0.6, speed: 44, dmg: 22, r: 0.25, life: 1.2, onHit: { slow: [1, 0.2] }, split: { n: 3, spread: 0.5, def: { speed: 30, dmg: 9, r: 0.15, life: 0.25, look: 'iceshard' } }, splitOnHitOnly: true, look: 'iceshard', icon: 'snow', ai: {} },
  },
  veronica: {
    x: { name: '성혈', desc: '6초 동안 주변 아군 모두가 준 피해의 40%를 흡혈한다.', kind: 'buff', target: 'allies', r: 12, st: { steal: [6, 0.4] }, heal: 40, icon: 'drop', ai: { use: 'engage', max: 12 } },
  },
  jack: {
    x: { name: '대왕 폭탄', desc: '굴러가다 크게 터지는 대왕 폭탄.', kind: 'proj', speed: 14, grav: 1, dmg: 40, r: 0.9, life: 2.5, bounce: 6, splash: { r: 7, dmg: 120, knockup: 6 }, look: 'bigbomb', icon: 'bomb', ai: { use: 'aim', max: 18 } },
  },
};
