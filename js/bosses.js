// Bosses: not recruitable, used by the campaign and the raid.
export const BOSSES = [
  {
    id: 'ashlord', name: '잿빛 군주', title: '용광로의 폭군', role: 'tank', hp: 12000, speed: 4.6, diff: 3, scale: 2.3, boss: true,
    color: '#ff5a1a', quote: '불은 꺼지지 않는다. 옮겨 갈 뿐.', model: 'ashlord', el: 'fire',
    ai: { range: 4.5, style: 'melee' },
    abilities: {
      lmb: { name: '잿빛 대검', desc: '넓게 휘두른다.', kind: 'melee', cd: 2.1, range: 6, arc: 140, dmg: 38, icon: 'slash' },
      q: { name: '분쇄', desc: '대상 위치를 1.2초 뒤 내려찍는다.', kind: 'zone', cd: 7, at: 'aim', range: 26, r: 5, delay: 1.2, dur: 0.2, burst: { dmg: 70, knockup: 5 }, look: 'grave', icon: 'quake', ai: { use: 'aim', max: 26 } },
      e: { name: '용광로 숨결', desc: '2.4초 동안 앞쪽을 불태운다.', kind: 'channel', cd: 11, range: 13, cone: 70, dur: 2.4, tick: 0.25, dmg: 9, onHit: { burn: [2, 6] }, look: 'flame', icon: 'fire', ai: { use: 'self', max: 12 } },
      x: { name: '재의 비', desc: '전장에 6초 동안 불타는 재를 쏟는다.', kind: 'zone', at: 'self', r: 22, dur: 6, strikes: { every: 0.12, r: 2.2, dmg: 24 }, look: 'starfall', icon: 'meteor', ai: { use: 'self', max: 40 } },
    },
  },
];
