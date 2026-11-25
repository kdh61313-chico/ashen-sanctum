// Heroes 21–40. Guns use `ammo` + `reload` on the basic attack (R to reload).
export const NEW_HEROES = [
  {
    id: 'grave', name: '그레이브', title: '묘지 총잡이', role: 'ranger', hp: 260, speed: 6.8, diff: 1,
    color: '#d4a24c', quote: '탄창엔 열두 발, 묘지엔 자리가 넉넉하지.', model: 'gunslinger', gun: 'dual',
    ai: { range: 14, style: 'ranged' },
    abilities: {
      lmb: { name: '쌍권총', desc: '양손 권총을 번갈아 쏜다. 12발, R로 재장전.', kind: 'beam', cd: 0.2, range: 42, dmg: 14, spread: 0.018, ammo: 12, reload: 1.5, look: 'bullet', icon: 'pistol', ai: {} },
      q: { name: '구르기', desc: '짧게 구르며 탄창을 즉시 채운다.', kind: 'dash', cd: 6, dist: 6, dur: 0.28, refill: true, icon: 'dash', ai: { use: 'escape', min: 5 } },
      e: { name: '은탄', desc: '적을 꿰뚫는 은탄 한 발.', kind: 'beam', cd: 7, range: 55, dmg: 60, pierce: true, look: 'silver', icon: 'bullet', ai: { use: 'aim', max: 40 } },
      x: { name: '데드아이', desc: '시야 앞쪽에 보이는 모든 적에게 동시에 탄을 박는다.', kind: 'deadeye', range: 40, cone: 90, dmg: 110, icon: 'eye', ai: { use: 'engage', max: 35 } },
    },
  },
  {
    id: 'bark', name: '바르크', title: '산탄 사냥꾼', role: 'bruiser', hp: 380, speed: 6.4, diff: 1,
    color: '#b86b3a', quote: '가까이 와. 더 가까이.', model: 'blunderbuss', gun: 'long',
    ai: { range: 5, style: 'melee' },
    abilities: {
      lmb: { name: '나팔총', desc: '산탄을 넓게 흩뿌린다. 가까울수록 치명적. 4발.', kind: 'proj', cd: 0.85, count: 9, spread: 16, speed: 85, dmg: 13, r: 0.22, life: 0.32, ammo: 4, reload: 2.0, look: 'pellet', icon: 'shotgun', ai: {} },
      q: { name: '반동 도약', desc: '발밑에 쏴서 뒤로 튀어오르며 주변 적을 밀친다.', kind: 'launch', cd: 7, back: 11, up: 7, aoe: { r: 3, dmg: 25, knock: 9 }, icon: 'burst', ai: { use: 'escape', min: 2 } },
      e: { name: '화약 지뢰', desc: '밟으면 터지는 지뢰를 놓는다. 최대 2개.', kind: 'trap', cd: 8, r: 2.2, life: 30, dmg: 70, st: { slow: [1.5, 0.4] }, max: 2, look: 'mine', icon: 'mine', ai: { use: 'escape', min: 7 } },
      x: { name: '용의 숨결탄', desc: '앞쪽을 거대한 화염 산탄으로 쓸어버린다.', kind: 'aoe', at: 'cone', r: 10, angle: 70, dmg: 120, st: { burn: [3, 12] }, look: 'breath', icon: 'dragon', ai: { use: 'self', max: 8 } },
    },
  },
  {
    id: 'elise', name: '엘리스', title: '은빛 저격수', role: 'ranger', hp: 230, speed: 6.4, diff: 3,
    color: '#cfd8e8', quote: '숨을 멈추면, 세상이 조용해져.', model: 'sniper', gun: 'rifle',
    ai: { range: 28, style: 'ranged' },
    abilities: {
      lmb: { name: '은빛 소총', desc: '누르고 있으면 조준을 모은다. 오래 모을수록 강하다. 5발.', kind: 'beam', cd: 0.9, range: 90, charge: { time: 1.2, dmgMin: 28, dmgMax: 110 }, ammo: 5, reload: 2.2, look: 'silver', icon: 'rifle', ai: {} },
      q: { name: '갈고리 사출', desc: '조준 지점으로 몸을 끌어당긴다.', kind: 'grapple', cd: 8, range: 24, icon: 'hook', ai: { use: 'escape', min: 6 } },
      e: { name: '섬광 연막', desc: '조준 지점에 연막을 터뜨려 적을 둔화시킨다.', kind: 'zone', cd: 11, at: 'aim', range: 25, r: 5, dur: 5, dps: 10, st: { slow: [0.5, 0.35] }, look: 'smoke', icon: 'smoke', ai: { use: 'aim', max: 22 } },
      x: { name: '처형 사격', desc: '모든 적을 꿰뚫는 한 발.', kind: 'beam', range: 120, dmg: 220, pierce: true, look: 'execution', icon: 'reaper', ai: { use: 'aim', max: 80 } },
    },
  },
  {
    id: 'karman', name: '카르만', title: '연금 포병', role: 'mage', hp: 280, speed: 6.2, diff: 2,
    color: '#8bd450', quote: '폭발은 과학이야. 아름다운 과학.', model: 'grenadier', gun: 'long',
    ai: { range: 15, style: 'ranged' },
    abilities: {
      lmb: { name: '연금 유탄', desc: '포물선으로 날아가 터지는 유탄. 6발.', kind: 'proj', cd: 0.9, speed: 26, grav: 0.9, dmg: 22, r: 0.3, life: 3, splash: { r: 3, dmg: 40 }, ammo: 6, reload: 1.8, look: 'grenade', icon: 'grenade', ai: {} },
      q: { name: '로켓 점프', desc: '발밑을 폭파해 높이 솟구친다.', kind: 'launch', cd: 8, back: 3, up: 13, aoe: { r: 3, dmg: 30, knock: 6 }, icon: 'leap', ai: { use: 'escape', min: 4 } },
      e: { name: '산성 웅덩이', desc: '조준 지점을 산성으로 뒤덮는다.', kind: 'zone', cd: 10, at: 'aim', range: 24, r: 4.5, dur: 5, dps: 26, st: { slow: [0.5, 0.25] }, look: 'acid', icon: 'flask', ai: { use: 'aim', max: 22 } },
      x: { name: '집중 포격', desc: '조준 지점에 4초 동안 포탄을 퍼붓는다.', kind: 'zone', at: 'aim', range: 45, r: 9, dur: 4, strikes: { every: 0.25, dmg: 34, r: 3 }, look: 'barrage', icon: 'meteor', ai: { use: 'aim', max: 40 } },
    },
  },
  {
    id: 'mira', name: '미라', title: '태엽 기관총수', role: 'ranger', hp: 310, speed: 5.9, diff: 2,
    color: '#e0a040', quote: '톱니가 돌면 비가 내려. 납으로 된 비.', model: 'gatling', gun: 'heavy',
    ai: { range: 16, style: 'ranged' },
    abilities: {
      lmb: { name: '태엽 기관총', desc: '누르고 있으면 쉬지 않고 쏜다. 60발.', kind: 'proj', cd: 0.085, speed: 110, dmg: 7, r: 0.18, life: 0.6, jitter: 0.03, ammo: 60, reload: 2.6, look: 'bullet', icon: 'gatling', ai: {} },
      q: { name: '강철 방벽', desc: '3초 동안 정면 피해를 60% 막는다.', kind: 'buff', target: 'self', cd: 9, st: { block: [3, 0.6] }, icon: 'shield', ai: { use: 'defend' } },
      e: { name: '과열', desc: '4초 동안 연사 속도가 크게 오른다.', kind: 'buff', target: 'self', cd: 12, st: { atkSpd: [4, 0.6] }, icon: 'rage', ai: { use: 'engage', max: 20 } },
      x: { name: '탄막 폭풍', desc: '6초 동안 탄이 줄지 않고 연사 속도가 두 배가 된다.', kind: 'buff', target: 'self', st: { atkSpd: [6, 1.0], dr: [6, 0.3], infAmmo: [6] }, icon: 'storm', ai: { use: 'engage', max: 20 } },
    },
  },
  {
    id: 'rowan', name: '로완', title: '현상금 사냥꾼', role: 'ranger', hp: 270, speed: 6.8, diff: 2,
    color: '#c8783c', quote: '살아서든 죽어서든. 난 죽어서가 편해.', model: 'bounty', gun: 'pistol',
    ai: { range: 18, style: 'ranged' },
    abilities: {
      lmb: { name: '리볼버', desc: '묵직한 한 발. 6발.', kind: 'beam', cd: 0.5, range: 55, dmg: 32, spread: 0.006, ammo: 6, reload: 1.6, look: 'bullet', icon: 'pistol', ai: {} },
      q: { name: '슬라이딩 사격 자세', desc: '미끄러지며 2.5초 동안 총알 피해가 50% 오른다.', kind: 'dash', cd: 7, dist: 8, dur: 0.3, selfSt: { dmgUp: [2.5, 0.5] }, icon: 'dash', ai: { use: 'escape', min: 5 } },
      e: { name: '올가미', desc: '올가미를 던져 맞힌 적을 묶는다.', kind: 'proj', cd: 9, speed: 40, dmg: 20, r: 0.5, life: 0.6, onHit: { root: [1.5] }, look: 'hook', icon: 'vine', ai: { use: 'aim', max: 22 } },
      x: { name: '정오의 결투', desc: '앞쪽에 보이는 모든 적에게 치명적인 탄을 쏜다.', kind: 'deadeye', range: 45, cone: 120, dmg: 130, icon: 'eye', ai: { use: 'engage', max: 35 } },
    },
  },
  {
    id: 'helga', name: '헬가', title: '화염 수녀', role: 'bruiser', hp: 370, speed: 6.2, diff: 1,
    color: '#ff6a2a', quote: '불은 모든 죄를 공평하게 태운다.', model: 'flamenun', gun: 'heavy',
    ai: { range: 4.5, style: 'melee' },
    abilities: {
      lmb: { name: '정화의 화염', desc: '앞쪽에 화염을 뿜는다. 연료 80.', kind: 'melee', cd: 0.12, range: 6.5, arc: 44, dmg: 9, onHit: { burn: [2, 6] }, look: 'flame', ammo: 80, reload: 2.2, icon: 'fire' },
      q: { name: '화염 분출', desc: '발밑에 불을 뿜어 앞으로 솟구치고, 떠난 자리에 불길을 남긴다.', kind: 'launch', cd: 8, back: -7, up: 10, originZone: { r: 3.2, dur: 3, dps: 35, st: { burn: [1.5, 6] }, look: 'fireground' }, icon: 'burst', ai: { use: 'gap', min: 5, max: 12 } },
      e: { name: '화형대', desc: '앞에 불기둥 벽을 세운다.', kind: 'zone', cd: 11, at: 'front', dist: 4, wall: { w: 6, d: 1.2 }, dur: 4, dps: 40, h: 2.4, look: 'firewall', icon: 'wall', ai: { use: 'aim', max: 7 } },
      x: { name: '심판의 업화', desc: '주변을 거대한 불길로 뒤덮는다.', kind: 'aoe', at: 'self', r: 8, dmg: 90, st: { burn: [5, 18] }, look: 'dragonburst', icon: 'rage', ai: { use: 'self', max: 7 } },
    },
  },
  {
    id: 'zeno', name: '제노', title: '룬 총사', role: 'ranger', hp: 270, speed: 6.5, diff: 2,
    color: '#5fd4ff', quote: '룬을 새긴 탄환은 빗나가지 않아. 거의.', model: 'musketeer', gun: 'rifle',
    ai: { range: 20, style: 'ranged' },
    abilities: {
      lmb: { name: '룬 머스킷', desc: '룬이 새겨진 강력한 탄. 3발.', kind: 'beam', cd: 0.8, range: 65, dmg: 44, ammo: 3, reload: 1.8, look: 'runebullet', icon: 'rifle', ai: {} },
      q: { name: '룬 회귀', desc: '2.5초 전 있던 자리로 되돌아가며 체력을 회복한다.', kind: 'recall', cd: 10, back: 2.5, heal: 50, icon: 'rune', ai: { use: 'escape', min: 6 } },
      e: { name: '결박의 룬탄', desc: '맞힌 적을 잠시 기절시킨다.', kind: 'beam', cd: 9, range: 40, dmg: 30, onHit: { stun: [0.9] }, look: 'mesmer', icon: 'rune', ai: { use: 'aim', max: 35 } },
      x: { name: '룬 폭풍', desc: '조준 지점에 룬 번개를 퍼붓는다.', kind: 'zone', at: 'aim', range: 45, r: 8, dur: 4.5, strikes: { every: 0.3, dmg: 30, r: 2.6 }, look: 'storm', icon: 'storm', ai: { use: 'aim', max: 40 } },
    },
  },
  {
    id: 'nocturne', name: '녹턴', title: '그림자 사냥꾼', role: 'assassin', hp: 250, speed: 7.2, diff: 2,
    color: '#8a5cff', quote: '불을 끄면, 내 차례야.', model: 'shadowgun', gun: 'pistol',
    ai: { range: 12, style: 'ranged' },
    abilities: {
      lmb: { name: '그림자 연발총', desc: '빠르게 연사한다. 18발.', kind: 'proj', cd: 0.16, speed: 95, dmg: 13, r: 0.2, life: 0.7, jitter: 0.015, ammo: 18, reload: 1.5, look: 'shadowbullet', icon: 'pistol', ai: {} },
      q: { name: '그림자 걸음', desc: '순간이동하고 1.5초 동안 투명해진다.', kind: 'blink', cd: 8, dist: 9, selfSt: { invis: [1.5] }, icon: 'blink', ai: { use: 'gap', min: 6, max: 14 } },
      e: { name: '암흑탄', desc: '터지면서 적을 둔화시키는 탄.', kind: 'proj', cd: 7, speed: 50, dmg: 35, r: 0.4, life: 1.2, splash: { r: 2.5, dmg: 20 }, onHit: { slow: [2, 0.4] }, look: 'void', icon: 'void', ai: { use: 'aim', max: 25 } },
      x: { name: '일식', desc: '5초 동안 투명해지고 빨라지며 공격력이 50% 오른다.', kind: 'buff', target: 'self', st: { invis: [5], haste: [5, 0.35], dmgUp: [5, 0.5] }, icon: 'ghost', ai: { use: 'engage', max: 25 } },
    },
  },
  {
    id: 'talon', name: '탈론', title: '강철 의수 포수', role: 'tank', hp: 430, speed: 6.0, diff: 2,
    color: '#ff9a3a', quote: '이 팔은 잃은 게 아니야. 업그레이드한 거지.', model: 'cannonarm', gun: 'arm',
    ai: { range: 11, style: 'ranged' },
    abilities: {
      lmb: { name: '의수 포격', desc: '누르고 있으면 충전해서 쏜다. 폭발한다.', kind: 'proj', cd: 0.5, charge: { time: 1.0, dmgMin: 28, dmgMax: 85, spdMin: 40, spdMax: 70 }, r: 0.5, life: 2, splash: { r: 2.5, dmg: 28 }, look: 'plasma', icon: 'cannon', ai: {} },
      q: { name: '로켓 대시', desc: '로켓을 분사해 돌진한다.', kind: 'dash', cd: 8, dist: 12, dur: 0.4, dmg: 30, hitR: 1.5, knock: 10, icon: 'dash', ai: { use: 'gap', min: 5, max: 12 } },
      e: { name: '전자기 방벽', desc: '앞에 적의 투사체를 막는 벽을 세운다.', kind: 'zone', cd: 12, at: 'front', dist: 3, wall: { w: 7, d: 0.6 }, dur: 5, blockProj: true, h: 3.2, look: 'runewall', icon: 'wall', ai: { use: 'defend' } },
      x: { name: '궤도 포격', desc: '1.5초 뒤 하늘에서 거대한 광선이 떨어진다.', kind: 'zone', at: 'aim', range: 50, r: 6, delay: 1.5, dur: 0, burst: { dmg: 170, knockup: 7 }, look: 'pillar', icon: 'pillar', ai: { use: 'aim', max: 45 } },
    },
  },
  {
    id: 'iris', name: '이리스', title: '꽃의 검무사', role: 'assassin', hp: 270, speed: 7.4, diff: 3,
    color: '#ff8ac8', quote: '꽃잎이 떨어지는 소리, 들려?', model: 'bladedancer',
    ai: { range: 2.2, style: 'melee' },
    abilities: {
      lmb: { name: '화검', desc: '빠른 3연격. 세 번째 베기는 더 강하다.', kind: 'melee', cd: 0.38, range: 3.0, arc: 95, dmg: 30, combo: 1.6, icon: 'slash' },
      q: { name: '꽃잎 질주', desc: '질주하며 지나가는 적을 베고, 꽃잎 칼날이 흩날리는 길을 남긴다.', kind: 'dash', cd: 6, dist: 9, dur: 0.25, dmg: 25, hitR: 1.4, trail: { r: 1.6, dur: 2.5, dps: 30, look: 'petals' }, icon: 'dash', ai: { use: 'gap', min: 4, max: 10 } },
      e: { name: '흘려베기', desc: '1.2초 동안 정면 공격을 모두 막아낸다.', kind: 'buff', target: 'self', cd: 8, st: { block: [1.2, 1.0] }, icon: 'shield', ai: { use: 'defend' } },
      x: { name: '천화난무', desc: '3초 동안 꽃잎 칼날의 폭풍이 된다.', kind: 'zone', at: 'self', follow: true, r: 4.5, dur: 3, dps: 70, look: 'petals', selfSt: { haste: [3, 0.3] }, icon: 'whirl', ai: { use: 'self', max: 5 } },
    },
  },
  {
    id: 'moloch', name: '몰록', title: '심연의 거인', role: 'tank', hp: 520, speed: 5.8, diff: 1,
    color: '#3a9aaa', quote: '심연은 배고프다. 나도 그렇고.', model: 'abyss',
    ai: { range: 2.6, style: 'melee' },
    abilities: {
      lmb: { name: '심연의 주먹', desc: '거대한 주먹으로 내려친다.', kind: 'melee', cd: 1.0, range: 3.5, arc: 100, dmg: 58, icon: 'fist' },
      q: { name: '심해 도약', desc: '크게 도약해 착지 지점의 적을 띄운다.', kind: 'leap', cd: 9, fwd: 12, up: 9, land: { r: 4, dmg: 40, knockup: 4 }, icon: 'leap', ai: { use: 'gap', min: 5, max: 13 } },
      e: { name: '심연의 손아귀', desc: '촉수를 뻗어 맞힌 적을 끌어온다.', kind: 'proj', cd: 9, speed: 38, dmg: 25, r: 0.6, life: 0.55, hook: 18, onHit: { stun: [0.4] }, look: 'tentacle', icon: 'hook', ai: { use: 'aim', min: 5, max: 20 } },
      x: { name: '해일', desc: '앞쪽을 거대한 파도로 휩쓸어 날려버린다.', kind: 'aoe', at: 'cone', r: 12, angle: 80, dmg: 100, knock: 18, knockup: 4, look: 'wave', icon: 'wave', ai: { use: 'self', max: 10 } },
    },
  },
  {
    id: 'sien', name: '시엔', title: '달빛 무녀', role: 'support', hp: 260, speed: 6.5, diff: 1,
    color: '#bfd4ff', quote: '달은 상처를 보지 않아. 그저 비출 뿐.', model: 'moonpriestess',
    ai: { range: 14, style: 'support' },
    abilities: {
      lmb: { name: '달빛 구슬', desc: '적에게는 피해, 아군에게 맞으면 치유.', kind: 'proj', cd: 0.55, speed: 34, dmg: 24, r: 0.35, life: 1.8, healAlly: 28, look: 'moon', icon: 'orb', ai: {} },
      q: { name: '달그림자', desc: '떠올라 활공한다.', kind: 'glide', cd: 8, up: 8, dur: 2.5, icon: 'wing', ai: { use: 'escape', min: 5 } },
      e: { name: '달빛 장막', desc: '주변 아군 모두에게 보호막을 씌운다.', kind: 'buff', target: 'allies', cd: 12, r: 12, shield: 70, icon: 'shield', ai: { use: 'heal', r: 12 } },
      x: { name: '만월', desc: '5초 동안 아군을 치유하고 적을 태우는 달빛을 내린다.', kind: 'zone', at: 'self', r: 10, dur: 5, hps: 40, dps: 18, look: 'moonzone', icon: 'halo', ai: { use: 'save', r: 10 } },
    },
  },
  {
    id: 'crow', name: '크로우', title: '사슬 처형인', role: 'bruiser', hp: 370, speed: 6.5, diff: 2,
    color: '#a0a0b4', quote: '사슬은 끊어지지 않아. 목이 먼저 끊어지지.', model: 'executioner',
    ai: { range: 3.5, style: 'melee' },
    abilities: {
      lmb: { name: '사슬 낫', desc: '긴 사슬 낫을 휘두른다.', kind: 'melee', cd: 0.8, range: 4.6, arc: 70, dmg: 42, icon: 'scythe' },
      q: { name: '사슬 당기기', desc: '사슬을 던져 맞힌 적을 끌어온다.', kind: 'proj', cd: 8, speed: 45, dmg: 20, r: 0.5, life: 0.55, hook: 20, look: 'hook', icon: 'hook', ai: { use: 'aim', min: 5, max: 22 } },
      e: { name: '회전 사슬', desc: '2.5초 동안 사슬을 휘둘러 주변을 벤다.', kind: 'zone', at: 'self', follow: true, cd: 10, r: 4.8, dur: 2.5, dps: 50, look: 'whirl', icon: 'whirl', ai: { use: 'self', max: 4.5 } },
      x: { name: '처형', desc: '바로 앞의 적에게 막대한 피해를 주고 기절시킨다.', kind: 'beam', range: 6, dmg: 160, onHit: { stun: [0.6] }, look: 'execution', icon: 'reaper', ai: { use: 'aim', max: 5 } },
    },
  },
  {
    id: 'aura', name: '아우라', title: '폭풍 창기사', role: 'bruiser', hp: 340, speed: 6.8, diff: 2,
    color: '#7fb8ff', quote: '천둥보다 먼저 도착하는 게 내 창이야.', model: 'stormlancer',
    ai: { range: 3.2, style: 'melee' },
    abilities: {
      lmb: { name: '뇌창', desc: '길게 찌른다.', kind: 'melee', cd: 0.65, range: 4.1, arc: 45, dmg: 40, icon: 'spear' },
      q: { name: '뇌창 투척', desc: '창을 던지고 창이 꽂힌 곳으로 번개처럼 이동한다. 맞은 적은 기절한다.', kind: 'proj', cd: 8, speed: 55, dmg: 40, r: 0.4, life: 0.5, warp: true, onHit: { stun: [0.6] }, look: 'lance', icon: 'spear', ai: { use: 'gap', min: 5, max: 22 } },
      e: { name: '연쇄 낙뢰', desc: '번개가 주변 적에게 튄다.', kind: 'beam', cd: 9, range: 25, dmg: 40, chain: { n: 2, r: 8, dmg: 30 }, look: 'chain', icon: 'chain', ai: { use: 'aim', max: 22 } },
      x: { name: '천벌의 도약', desc: '하늘 높이 뛰어올라 낙뢰와 함께 내려꽂힌다.', kind: 'leap', fwd: 14, up: 12, land: { r: 6, dmg: 110, knockup: 6, st: { stun: [0.8] } }, icon: 'bolt', ai: { use: 'gap', min: 3, max: 15 } },
    },
  },
  {
    id: 'mariette', name: '마리엣', title: '악몽 인형사', role: 'mage', hp: 250, speed: 6.4, diff: 2,
    color: '#d06090', quote: '줄에 매달린 너, 꽤 귀여운데?', model: 'puppeteer',
    ai: { range: 14, style: 'ranged' },
    abilities: {
      lmb: { name: '저주 바늘', desc: '바늘 세 개를 부채꼴로 던진다.', kind: 'proj', cd: 0.5, count: 3, spread: 8, speed: 55, dmg: 12, r: 0.18, life: 0.9, look: 'needle', icon: 'fan', ai: {} },
      q: { name: '실 끌어오기', desc: '조준한 적을 실로 낚아 끌어오고 크게 둔화시킨다.', kind: 'beam', cd: 8, range: 22, dmg: 20, pullBeam: 12, onHit: { slow: [2, 0.5] }, look: 'string', icon: 'web', ai: { use: 'aim', min: 5, max: 20 } },
      e: { name: '실의 그물', desc: '0.5초 뒤 조준 지점의 적을 묶는다.', kind: 'zone', cd: 10, at: 'aim', range: 26, r: 4, delay: 0.5, dur: 0, burst: { dmg: 25, st: { root: [1.4] } }, look: 'web', icon: 'web', ai: { use: 'aim', max: 24 } },
      x: { name: '꼭두각시', desc: '주변 적 모두를 줄에 매달아 기절시킨다.', kind: 'aoe', at: 'self', r: 14, dmg: 40, st: { stun: [1.3] }, look: 'puppet', icon: 'puppet', ai: { use: 'self', max: 12 } },
    },
  },
  {
    id: 'bael', name: '바엘', title: '지옥 기사', role: 'tank', hp: 470, speed: 6.1, diff: 2,
    color: '#ff3a1a', quote: '지옥에서 쫓겨났다. 너무 뜨거워서.', model: 'hellknight',
    ai: { range: 2.8, style: 'melee' },
    abilities: {
      lmb: { name: '지옥검', desc: '불타는 대검으로 벤다.', kind: 'melee', cd: 0.85, range: 3.6, arc: 100, dmg: 52, onHit: { burn: [2, 8] }, icon: 'slash' },
      q: { name: '지옥 낙하', desc: '높이 뛰어올라 내려꽂히며 착지 지점을 불바다로 만든다.', kind: 'leap', cd: 9, fwd: 11, up: 12, land: { r: 4, dmg: 45, knockup: 4, zone: { r: 4, dur: 3, dps: 30, look: 'fireground' } }, icon: 'gate', ai: { use: 'gap', min: 4, max: 12 } },
      e: { name: '지옥불 방벽', desc: '3초 동안 정면 피해를 75% 막는다.', kind: 'buff', target: 'self', cd: 10, st: { block: [3, 0.75] }, icon: 'shield', ai: { use: 'defend' } },
      x: { name: '지옥문', desc: '5초 동안 지옥문을 연다. 적은 불타고 아군은 단단해진다.', kind: 'zone', at: 'self', r: 8, dur: 5, dps: 45, st: { slow: [0.5, 0.3] }, allySt: { dr: [0.4, 0.25] }, look: 'hellgate', icon: 'gate', ai: { use: 'self', max: 7 } },
    },
  },
  {
    id: 'luna', name: '루나', title: '눈의 여왕', role: 'mage', hp: 260, speed: 6.3, diff: 3,
    color: '#a8e8ff', quote: '조용히 해. 얼음이 깨지잖아.', model: 'icequeen',
    ai: { range: 16, style: 'ranged' },
    abilities: {
      lmb: { name: '얼음 파편', desc: '파편 세 개를 쏜다. 맞은 적은 느려진다.', kind: 'proj', cd: 0.55, count: 3, spread: 6, speed: 45, dmg: 14, r: 0.25, life: 1.2, onHit: { slow: [1, 0.15] }, look: 'icicle', icon: 'snow', ai: {} },
      q: { name: '빙판 질주', desc: '얼음길을 만들며 질주한다. 얼음길 위의 적은 크게 느려진다.', kind: 'dash', cd: 7, dist: 10, dur: 0.35, trail: { r: 1.8, dur: 4, dps: 8, st: { slow: [0.5, 0.5] }, look: 'icepath' }, icon: 'snow', ai: { use: 'escape', min: 5 } },
      e: { name: '얼음 감옥', desc: '0.7초 뒤 조준 지점의 적을 얼려 묶는다.', kind: 'zone', cd: 10, at: 'aim', range: 28, r: 4, delay: 0.7, dur: 0, burst: { dmg: 40, st: { root: [1.6] } }, look: 'icecage', icon: 'trap', ai: { use: 'aim', max: 26 } },
      x: { name: '절대영도', desc: '주변을 얼려 모든 적을 기절시킨다.', kind: 'aoe', at: 'self', r: 15, dmg: 60, st: { stun: [1.6] }, look: 'frostnova', icon: 'snow', ai: { use: 'self', max: 13 } },
    },
  },
  {
    id: 'veronica', name: '베로니카', title: '피의 성녀', role: 'support', hp: 270, speed: 6.4, diff: 2,
    color: '#e04060', quote: '피는 생명이야. 나눠 줄게. 조금만.', model: 'bloodsaint',
    ai: { range: 14, style: 'support' },
    abilities: {
      lmb: { name: '성혈탄', desc: '적에게는 흡혈, 아군에게 맞으면 치유.', kind: 'proj', cd: 0.55, speed: 36, dmg: 26, r: 0.35, life: 1.8, healAlly: 30, steal: 0.3, look: 'bloodorb', icon: 'feast', ai: {} },
      q: { name: '붉은 날개', desc: '앞으로 높이 날아오른다.', kind: 'leap', cd: 7, fwd: 11, up: 9, icon: 'wing', ai: { use: 'escape', min: 5 } },
      e: { name: '피의 사슬', desc: '적의 피를 사슬로 빨아들여 준 피해만큼 회복한다.', kind: 'beam', cd: 8, range: 22, dmg: 45, steal: 1.0, onHit: { slow: [1, 0.3] }, look: 'bloodchain', icon: 'chain', ai: { use: 'aim', max: 20 } },
      x: { name: '피의 부활', desc: '주변 아군을 치유하고 3초 동안 죽지 않게 한다.', kind: 'buff', target: 'allies', r: 18, heal: 80, st: { undying: [3], dmgUp: [5, 0.2] }, icon: 'ankh', ai: { use: 'save', r: 18 } },
    },
  },
  {
    id: 'jack', name: '잭', title: '폭탄광', role: 'mage', hp: 270, speed: 6.6, diff: 1,
    color: '#ffcc3a', quote: '쾅! 하는 소리, 좋아하지?', model: 'bomber',
    ai: { range: 13, style: 'ranged' },
    abilities: {
      lmb: { name: '폭탄 투척', desc: '튕기듯 날아가 터지는 폭탄. 3개.', kind: 'proj', cd: 0.9, speed: 24, grav: 0.7, dmg: 18, r: 0.35, life: 2.5, splash: { r: 3.4, dmg: 52 }, ammo: 3, reload: 1.6, look: 'bomb', icon: 'bomb', ai: {} },
      q: { name: '고무 폭탄', desc: '통통 튀는 폭탄을 던진다. 세 번 튕긴 뒤 터진다.', kind: 'proj', cd: 6, speed: 22, grav: 0.8, dmg: 20, r: 0.35, life: 4, bounce: 3, splash: { r: 3.5, dmg: 55 }, look: 'bomb', icon: 'bomb', ai: { use: 'aim', max: 20 } },
      e: { name: '끈끈이 지뢰', desc: '밟으면 터지는 지뢰. 최대 3개.', kind: 'trap', cd: 8, r: 2.4, life: 30, dmg: 80, st: { slow: [1.5, 0.4] }, max: 3, look: 'mine', icon: 'mine', ai: { use: 'escape', min: 7 } },
      x: { name: '대폭발', desc: '초대형 폭탄을 던진다.', kind: 'proj', speed: 22, grav: 0.6, dmg: 60, r: 0.7, life: 3, splash: { r: 8, dmg: 150 }, look: 'bigbomb', icon: 'bomb', ai: { use: 'aim', max: 25 } },
    },
  },
];

// ★ rarity and starters (Arknights-style: ★6 / ★5 / ★4)
export const RARITY = {
  seraph: 6, sira: 6, azrak: 6, lian: 6, elise: 6, talon: 6, bael: 6, luna: 6,
  valok: 5, igna: 5, nir: 5, razel: 5, veyla: 5, ulfric: 5, eris: 5, nox: 5,
  rowan: 5, helga: 5, mira: 5, iris: 5, crow: 5, aura: 5, veronica: 5, zeno: 5,
  selene: 4, mor: 4, grom: 4, kael: 4, onyx: 4, hark: 4, tyr: 4, belladonna: 4,
  grave: 4, bark: 4, karman: 4, nocturne: 4, moloch: 4, sien: 4, mariette: 4, jack: 4,
};
export const STARTERS = ['valok', 'igna', 'selene', 'mor', 'grave'];
