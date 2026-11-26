// Arena registry. Pure data (no three.js). Every map shares bounds and spawn layout,
// and is point-symmetric for fairness. setMap() swaps the live collider list in place.

export const HALF_X = 34, HALF_Z = 24;

export const SPAWNS = [
  [[-29, 0, -3], [-29, 0, 0], [-29, 0, 3], [-30.5, 0, -1.5], [-30.5, 0, 1.5], [-28, 0, 5]],
  [[29, 0, 3], [29, 0, 0], [29, 0, -3], [30.5, 0, 1.5], [30.5, 0, -1.5], [28, 0, -5]],
];
export const SPAWN_YAW = [-Math.PI / 2, Math.PI / 2];

export const COLLIDERS = [];
export const HAZARDS = [];
export const MAP = { cur: null };

function builder() {
  const boxes = [], props = [], hazards = [];
  const B = (cx, cz, sx, sz, h, y0 = 0, kind = 'stone', mirror = true) => {
    boxes.push({ min: [cx - sx / 2, y0, cz - sz / 2], max: [cx + sx / 2, y0 + h, cz + sz / 2], kind });
    if (mirror && !(cx === 0 && cz === 0)) boxes.push({ min: [-cx - sx / 2, y0, -cz - sz / 2], max: [-cx + sx / 2, y0 + h, -cz + sz / 2], kind });
  };
  const P = (type, x, z, rot = 0, s = 1, y = 0, mirror = true) => {
    props.push({ type, x, z, rot, s, y });
    if (mirror) props.push({ type, x: -x, z: -z, rot: rot + Math.PI, s, y });
  };
  const H = (x0, z0, x1, z1, kind, mirror = true) => {
    hazards.push({ min: [x0, z0], max: [x1, z1], kind });
    if (mirror) hazards.push({ min: [-x1, -z1], max: [-x0, -z0], kind });
  };
  const steps = (x, z, dir, n, top, w = 3, kind = 'step') => {
    // dir: [dx, dz] direction steps descend toward
    for (let i = 0; i < n; i++) {
      const t = top - (i + 1) * (top / (n + 1));
      const cx = x + dir[0] * (0.6 + i * 1.2), cz = z + dir[1] * (0.6 + i * 1.2);
      if (dir[0]) B(cx, cz, 1.2, w, t, 0, kind); else B(cx, cz, w, 1.2, t, 0, kind);
    }
  };
  const outer = (kind = 'wall') => {
    B(0, -HALF_Z - 1, HALF_X * 2 + 4, 2, 10, 0, kind, false);
    B(0, HALF_Z + 1, HALF_X * 2 + 4, 2, 10, 0, kind, false);
    B(-HALF_X - 1, 0, 2, HALF_Z * 2 + 4, 10, 0, kind, false);
    B(HALF_X + 1, 0, 2, HALF_Z * 2 + 4, 10, 0, kind, false);
  };
  return { boxes, props, hazards, B, P, H, steps, outer };
}

const DEFS = {
  // ------------------------------------------------------------------
  sanctum: {
    name: '잿빛 성역', desc: '무너진 대성당의 안뜰. 가운데 제단을 차지하는 쪽이 유리해요.',
    theme: {
      sky: ['#090812', '#1f1429', '#52262a'], fog: ['#1b1624', 0.0125], hemi: ['#8a86c8', '#4a3024', 1.7], amb: ['#3a3050', 1.1],
      sun: ['#b4c0ff', 2.6, [-26, 62, -30]], rim: ['#ff8a5a', 0.9], floor: 'flag', floorTint: '#c4bab0', wallTint: '#8f8780',
      accent: '#ff3b3b', particles: 'ash', moon: [-0.55, 0.42, -0.72],
    },
    build(m) {
      const { B, P, steps, outer } = m;
      outer();
      B(0, 0, 8, 8, 1.2, 0, 'altar', false);
      for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let i = 0; i < 2; i++) {
        const off = 4.6 + i * 1.2, top = 0.8 - i * 0.4;
        if (d[0]) B(d[0] * off, 0, 1.2, 3.6, top, 0, 'step', false); else B(0, d[1] * off, 3.6, 1.2, top, 0, 'step', false);
      }
      for (const [px, pz] of [[3.4, 3.4], [-3.4, 3.4], [3.4, -3.4], [-3.4, -3.4]]) B(px, pz, 0.9, 0.9, 6.2, 0, 'pillar', false);
      B(0, 0, 1.4, 1.4, 3, 1.2, 'obelisk', false);
      B(-21, -7, 1.2, 6, 3.2, 0, 'wall'); B(-21, 7, 1.2, 6, 3.2, 0, 'wall');
      B(-26, -13, 2, 2, 7, 0, 'pillar'); B(-26, 13, 2, 2, 7, 0, 'pillar');
      B(-10, -5, 1.4, 1.4, 4.5, 0, 'pillar'); B(-10, 5.5, 1.4, 1.4, 2.2, 0, 'pillar');
      B(-11, -14, 1.4, 1.4, 4.5, 0, 'pillar'); B(-4, -14, 1.4, 1.4, 1.6, 0, 'rubble');
      B(-10, 11, 8, 0.9, 1.1, 0, 'lowwall'); B(10, 11, 8, 0.9, 1.1, 0, 'lowwall');
      B(-15.5, 0, 2.2, 3.2, 1.0, 0, 'coffin'); B(-15.5, 0.3, 1.4, 1.4, 1.0, 1.0, 'coffin');
      B(-6, -18.5, 5, 1.2, 3.6, 0, 'wall'); B(4, -20, 1.6, 1.6, 2.0, 0, 'rubble'); B(-18, 18, 4, 1.2, 3.0, 0, 'wall');
      B(-25, -18.5, 7, 6, 2.0, 0, 'ledge'); steps(-21.5, -18.5, [1, 0], 4, 2.0);
      B(-25, -15.7, 7, 0.4, 0.8, 2.0, 'lowwall');
      P('brazier', -21, -3.6); P('brazier', -21, 3.6); P('brazier', -4.6, -4.6);
      P('grave', -14, -9, 0.2); P('grave', -13, -10.5, -0.3); P('grave', -15.5, -8.2, 0.1); P('grave', -8, 17, 0.4); P('grave', -9.5, 18.5, -0.2);
      P('tree', -28, -20, 0.5, 1.2); P('tree', -16, 21, 2, 1.0); P('tree', -31, 18, 1, 1.3);
      P('banner', -33.9, -6, Math.PI / 2); P('banner', -33.9, 6, Math.PI / 2);
      P('crystal', -12, 15, 0.3, 1); P('crystal', -24, 8, 1.3, 0.8);
      P('candles', -10.6, -3.6); P('candles', -1.8, -2.6, 0, 1, 1.2); P('bones', -6, 6); P('bones', -18, -11);
      P('statue', -32.6, 0, Math.PI / 2, 1.2);
    },
    dummies: [[-12, 0, -2], [-12, 0, 3], [-6, 0, -8], [-6, 0, 8], [0, 1.2, 0], [-16, 0, 8]],
  },
  // ------------------------------------------------------------------
  frostgrave: {
    name: '서리 묘지', desc: '눈 덮인 왕가의 묘역. 영묘 주변의 묘비 줄이 엄폐물이 돼요.',
    theme: {
      sky: ['#0a1020', '#1c2a44', '#4a5a78'], fog: ['#a8b8d0', 0.016], hemi: ['#c8d8ff', '#5a6070', 2.0], amb: ['#506080', 1.0],
      sun: ['#dfe8ff', 2.4, [30, 55, -35]], rim: ['#7ab8ff', 0.8], floor: 'snow', floorTint: '#eef3fa', wallTint: '#9aa4b4',
      accent: '#7ad8ff', particles: 'snow', moon: [0.5, 0.4, -0.75],
    },
    build(m) {
      const { B, P, steps, outer } = m;
      outer('wall');
      B(0, 0, 7, 5, 4.2, 0, 'crypt', false);
      for (const [px, pz] of [[4.3, 3.2], [-4.3, 3.2], [4.3, -3.2], [-4.3, -3.2]]) B(px, pz, 0.8, 0.8, 4.8, 0, 'pillar', false);
      B(-12, -6, 0.6, 1.3, 1.2, 0, 'grave'); B(-12, 6, 0.6, 1.3, 1.2, 0, 'grave');
      B(-8.5, -10, 0.6, 1.3, 1.2, 0, 'grave'); B(-8.5, 10, 0.6, 1.3, 1.2, 0, 'grave');
      B(-15.5, -11, 0.6, 1.3, 1.2, 0, 'grave'); B(-15.5, 12, 0.6, 1.3, 1.2, 0, 'grave');
      B(-12, -1.5, 0.6, 1.3, 1.2, 0, 'grave');
      B(-20, -8, 1.2, 5, 3, 0, 'wall'); B(-20, 9, 1.2, 4, 3, 0, 'wall');
      B(-6, -17, 6, 4, 1.6, 0, 'ledge'); steps(-6, -14.4, [0, 1], 3, 1.6, 4);
      B(-26, 17, 6, 5, 2.2, 0, 'ledge'); steps(-22.4, 17, [1, 0], 4, 2.2, 3);
      B(-26, 14.3, 6, 0.4, 0.8, 2.2, 'lowwall');
      B(-3, 12, 4, 2.5, 2.6, 0, 'tomb'); B(-16, 3, 2.5, 2.5, 2.0, 0, 'tomb');
      P('pine', -30, -20, 0, 1.3); P('pine', -22, 21, 1, 1.1); P('pine', -12, 21.5, 2, 1.2); P('pine', -31, 10, 0.5, 1.0); P('pine', -18, -21, 0.2, 1.4);
      P('lantern', -21, -3.5); P('lantern', -21, 3.5); P('lantern', -5, -4.2); P('lantern', -9, 14);
      P('grave', -24, -8, 0.3); P('grave', -25, -10, -0.2); P('grave', -14, 17, 0.2); P('angel', -33, 0, Math.PI / 2, 1.1);
      P('crystal', -11, -19, 0.4, 0.9); P('bones', -7, 4);
    },
    dummies: [[-12, 0, 2], [-10, 0, -4], [-6, 0, 8], [-6, 0, -8], [-14, 0, 8], [-3, 0, -2]],
  },
  // ------------------------------------------------------------------
  forge: {
    name: '용암 제련소', desc: '드워프의 대장간. 용암에 빠지면 크게 다치니 다리를 건너요.',
    theme: {
      sky: ['#0c0606', '#2a0e08', '#6a2410'], fog: ['#2a1410', 0.014], hemi: ['#ff9a6a', '#3a1a10', 1.5], amb: ['#4a2a20', 1.1],
      sun: ['#ffb080', 1.8, [-20, 60, 30]], rim: ['#ff5a1a', 1.4], floor: 'forge', floorTint: '#9a8a80', wallTint: '#6a6060',
      accent: '#ff6a1a', particles: 'embers', moon: [-0.3, 0.3, 0.9],
    },
    build(m) {
      const { B, P, H, steps, outer } = m;
      outer('wall');
      // lava river at x -10..-7 with two bridges (mirrors to x 7..10)
      H(-10.2, -24, -6.8, -18.5, 'lava'); H(-10.2, -14.5, -6.8, 1.2, 'lava'); H(-10.2, 4.8, -6.8, 24, 'lava');
      B(0, 0, 5, 3, 2.0, 0, 'anvil', false);
      B(0, 9, 2.2, 2.2, 8, 0, 'chimney');
      B(-3.5, -4.5, 2, 1.4, 1.2, 0, 'crate'); B(-3.5, -4.5, 1.2, 1.0, 1.0, 1.2, 'crate');
      B(-18, -11, 8, 2.4, 2.4, 0, 'metal'); steps(-13.4, -11, [1, 0], 3, 2.4, 2.4, 'metalstep');
      B(-18, 6, 2.2, 6, 3.2, 0, 'wall'); B(-24, -2, 2.2, 2.2, 1.6, 0, 'crate');
      B(-14, 15, 3, 3, 1.4, 0, 'crate'); B(-14, 15, 1.6, 1.6, 1.2, 1.4, 'crate');
      B(-27, -17, 5, 5, 2.4, 0, 'metal'); steps(-23.9, -17, [1, 0], 4, 2.4, 3, 'metalstep');
      P('furnace', -4, 18, 0, 1); P('furnace', -32, -8, Math.PI / 2, 1);
      P('anvilprop', -21, -3.6); P('anvilprop', -12, 6, 0.5);
      P('chain', -8.5, -16.5); P('chain', -8.5, 3); P('ore', -20, 16); P('ore', -2, -16, 1.2);
      P('brazier', -21, 3.6); P('brazier', -5, 5); P('lavafall', -8.5, -23.2);
    },
    dummies: [[-14, 0, -4], [-14, 0, 2], [-4, 0, -9], [-4, 0, 9], [0, 2.0, 0], [-20, 0, 10]],
  },
  // ------------------------------------------------------------------
  bog: {
    name: '가라앉은 사원', desc: '늪에 잠긴 고대 사원. 물속에서는 느려지니 기둥 위를 노려요.',
    theme: {
      sky: ['#060c0a', '#14241c', '#3a4a30'], fog: ['#1c2a22', 0.02], hemi: ['#a8d8a0', '#2a2a1a', 1.7], amb: ['#30402a', 1.1],
      sun: ['#d8ffc8', 2.0, [20, 55, 25]], rim: ['#9dff6a', 0.7], floor: 'moss', floorTint: '#a8b098', wallTint: '#7a8a70',
      accent: '#9dff6a', particles: 'spores', moon: [0.3, 0.35, 0.88],
    },
    build(m) {
      const { B, P, H, steps, outer } = m;
      outer('wall');
      H(-6, -14, 6, 14, 'water', false);
      H(-24, 8, -14, 16, 'water');
      B(0, 0, 2.6, 2.6, 9, 0, 'trunk', false);
      B(-14, -8, 6, 6, 2.0, 0, 'ledge'); steps(-14, -4.4, [0, 1], 4, 2.0, 3);
      B(-14, -10.8, 6, 0.4, 0.8, 2.0, 'lowwall');
      B(-9, 2, 1.3, 1.3, 3.5, 0, 'pillar'); B(-9, 9, 1.3, 1.3, 1.8, 0, 'pillar');
      B(-20, 0, 1.2, 7, 2.6, 0, 'wall');
      B(-4, -18, 6, 1.2, 3, 0, 'wall'); B(-26, -16, 4, 4, 1.2, 0, 'ruin'); B(-26, -16, 2, 2, 1.2, 1.2, 'ruin');
      B(-4, 17, 3, 3, 1.0, 0, 'ruin');
      P('reeds', -3, -8); P('reeds', 4, -11); P('reeds', -19, 11); P('reeds', -16, 14);
      P('mushroom', -24, 4, 0, 1.2); P('mushroom', -11, -15, 0.5); P('mushroom', -6, 21, 1, 0.9);
      P('willow', -30, -20, 0.5, 1.1); P('willow', -12, 21, 1.5, 1.0); P('willow', -31, 19, 2, 1.2);
      P('idol', -33, 0, Math.PI / 2, 1.1); P('lantern', -21, -4); P('lantern', -21, 4.5); P('crystal', -27, 9, 0.3, 0.8);
    },
    dummies: [[-12, 0, 0], [-10, 0, 6], [-6, 0, -8], [-14, 2, -8], [-4, 0, 4], [-18, 0, 6]],
  },
  // ------------------------------------------------------------------
  archive: {
    name: '불타는 서고', desc: '불길이 번지는 대서고. 책장 사이의 좁은 통로와 위층 회랑을 오가며 싸워요.',
    theme: {
      sky: ['#0c0a14', '#2a1a2e', '#6a3424'], fog: ['#2a1c20', 0.017], hemi: ['#e0b080', '#2a1a18', 1.5], amb: ['#3a2a2c', 1.15],
      sun: ['#ffcf9a', 1.6, [-30, 50, 22]], rim: ['#ff9a4a', 1.1], floor: 'parquet', floorTint: '#c0a48c', wallTint: '#8a7466',
      accent: '#ffb347', particles: 'pages', moon: [-0.6, 0.25, 0.4], clouds: 0.6, cloudC: '#5a3436', mist: '#3a2424',
    },
    build(m) {
      const { B, P, steps, outer } = m;
      outer('wall');
      B(0, 0, 7, 7, 0.5, 0, 'dais', false); B(0, 0, 4.2, 4.2, 0.5, 0.5, 'dais', false);
      B(0, 0, 1.0, 1.0, 1.6, 1.0, 'pedestal', false);
      B(-14, -10, 1.1, 7, 4.4, 0, 'shelf'); B(-14, 9.5, 1.1, 6, 4.4, 0, 'shelf');
      B(-21, -12, 7, 1.1, 4.4, 0, 'shelf'); B(-21, 12.5, 7, 1.1, 4.4, 0, 'shelf');
      B(-8, 15, 1.1, 6, 4.4, 0, 'shelf');
      B(-6, -20, 14, 4, 2.4, 0, 'gallery'); steps(1, -20, [1, 0], 4, 2.4, 3.6, 'woodstep');
      B(-6, -17.85, 14, 0.3, 0.9, 2.4, 'rail');
      B(-8, -5, 3.2, 1.6, 0.95, 0, 'table'); B(-9, 6, 1.6, 3.2, 0.95, 0, 'table');
      B(-24, -18, 5, 1.4, 1.3, 0, 'fallen'); B(-18.5, 0, 1.0, 1.4, 1.35, 0, 'lectern');
      B(-4, -11, 1.6, 1.6, 0.8, 0, 'books'); B(-24, 6, 1.4, 1.4, 1.1, 0, 'books');
      P('glasswin', -33.9, -12, Math.PI / 2); P('glasswin', -33.9, 12, Math.PI / 2); P('glasswin', -20, -23.9, 0); P('glasswin', -2, 23.9, Math.PI);
      P('chandelier', -14, 0, 0, 1); P('chandelier', 0, 0, 0, 1.3, 0, false);
      P('candles', -8, -5, 0, 1, 0.95); P('candles', -9, 6, 0, 1, 0.95); P('candles', -6, -20, 0, 1, 2.4);
      P('candelabra', -21, -3.6); P('candelabra', -21, 3.6);
      P('armillary', 0, 0, 0, 1, 2.6, false);
      P('scrolls', -11, -2); P('scrolls', -17, 7, 1); P('scrolls', -26, -10, 2);
      P('firepatch', -28, -21, 0, 1); P('firepatch', -10, 20, 1, 0.8);
      P('statue', -32.6, 0, Math.PI / 2, 1.1);
    },
    dummies: [[-10, 0, -2], [-10, 0, 3], [-6, 0, -9], [-5, 0, 9], [0, 1.0, 0], [-6, 2.4, -20]],
  },
  // ------------------------------------------------------------------
  bastion: {
    name: '폭풍 성채', desc: '번개가 치는 절벽 요새. 가운데 협곡은 다리로만 건널 수 있고, 떨어지면 크게 다쳐요.',
    theme: {
      sky: ['#05080c', '#141e26', '#34424a'], fog: ['#222c34', 0.017], hemi: ['#a8c0d0', '#24262c', 1.8], amb: ['#303a44', 1.1],
      sun: ['#c8d8ff', 2.2, [-30, 58, -20]], rim: ['#7ad0ff', 1.0], floor: 'slate', floorTint: '#a4aab0', wallTint: '#828a92',
      accent: '#8ad8ff', particles: 'rain', moon: [-0.4, 0.35, -0.8], storm: true, clouds: 1, cloudC: '#4a5a68', mist: '#1e262e',
    },
    build(m) {
      const { B, P, H, steps, outer } = m;
      outer('wall');
      H(-3.5, -24, 3.5, -15, 'abyss', false); H(-3.5, -11, 3.5, -2.2, 'abyss', false);
      H(-3.5, 2.2, 3.5, 11, 'abyss', false); H(-3.5, 15, 3.5, 24, 'abyss', false);
      for (const [x, z] of [[-4.6, -15.6], [-4.6, -10.4], [4.6, -15.6], [4.6, -10.4], [-4.6, -2.8], [-4.6, 2.8]]) B(x, z, 0.9, 0.9, 3.2, 0, 'post');
      B(-17, 0, 5, 5, 7, 0, 'keep');
      B(-24, -16, 8, 5, 2.6, 0, 'rampart'); steps(-20, -16, [1, 0], 4, 2.6, 3);
      B(-24, -13.3, 8, 0.4, 0.8, 2.6, 'lowwall');
      B(-10, -7, 1.2, 6, 3, 0, 'wall'); B(-10, 9, 1.2, 5, 1.3, 0, 'lowwall');
      B(-12, -20, 6, 1.2, 3, 0, 'wall');
      B(-7, 3, 1.5, 1.5, 1.5, 0, 'crate'); B(-22, 7, 2, 2, 1.4, 0, 'crate'); B(-22, 7, 1.1, 1.1, 1.0, 1.4, 'crate');
      B(-26, 14, 3, 3, 1.2, 0, 'rubble');
      P('catapult', -14, 17, 0.6, 1); P('banner', -33.9, -6, Math.PI / 2); P('banner', -33.9, 6, Math.PI / 2);
      P('lantern', -21, -3.5); P('lantern', -21, 3.5); P('lantern', -6, -13); P('lantern', -6, 0.5);
      P('stormcore', 0, 0, 0, 1, 8, false); P('bridge', 0, -13, 0, 1, 0, false); P('bridge', 0, 0, 0, 1.1, 0, false); P('bridge', 0, 13, 0, 1, 0, false);
      P('chasm', 0, 0, 0, 1, 0, false);
      P('spearrack', -18, -9, 0.2); P('spearrack', -27, 3, 1.4);
    },
    dummies: [[-12, 0, -2], [-12, 0, 4], [-6, 0, -12], [-6, 0, 12], [0, 0, 0], [-24, 2.6, -16]],
  },
  // ------------------------------------------------------------------
  dunes: {
    name: '황혼 왕릉', desc: '지는 해 아래 모래에 묻힌 왕의 무덤. 계단식 피라미드 위가 가장 넓게 보여요.',
    theme: {
      sky: ['#1c1838', '#8a4a4a', '#f2a456'], fog: ['#c88a60', 0.011], hemi: ['#ffd8a8', '#6a4a34', 1.6], amb: ['#6a4a40', 1.0],
      sun: ['#ffc48a', 3.2, [-62, 24, 12]], rim: ['#ff7a4a', 1.1], floor: 'sand', floorTint: '#e4cca4', wallTint: '#cfae86',
      accent: '#ffcf6a', particles: 'dust', moon: [-0.9, 0.1, 0.18], sunDisc: true, clouds: 0.7, cloudC: '#ffb87a', mist: '#d8a070',
    },
    build(m) {
      const { B, P, H, outer } = m;
      outer('sandwall');
      B(0, 0, 12, 12, 0.5, 0, 'sandstone', false); B(0, 0, 9, 9, 0.5, 0.5, 'sandstone', false);
      B(0, 0, 6, 6, 0.5, 1.0, 'sandstone', false); B(0, 0, 3, 3, 0.5, 1.5, 'sandstone', false);
      B(-6, -13, 1.3, 1.3, 5.5, 0, 'spillar'); B(-11, -13, 1.3, 1.3, 2.4, 0, 'spillar'); B(-16, -13, 1.3, 1.3, 5.5, 0, 'spillar');
      B(-6, 13, 1.3, 1.3, 1.8, 0, 'spillar'); B(-11, 13, 1.3, 1.3, 5.5, 0, 'spillar'); B(-16, 13, 1.3, 1.3, 3.2, 0, 'spillar');
      B(-12.5, -4.5, 1.4, 1.4, 7.5, 0, 'sobelisk'); B(-12.5, 5, 2.4, 1.2, 1.2, 0, 'sandstone');
      B(-23, -12, 5, 4, 3.4, 0, 'colossus');
      H(-21, 3, -15.5, 9.5, 'quicksand');
      B(-25, 16, 2, 2, 1.2, 0, 'crate'); B(-6, -20.5, 7, 1, 1.2, 0, 'sandwall'); B(-19, 20, 6, 1, 1.4, 0, 'sandwall');
      P('sunaltar', 0, 0, 0, 1, 2.0, false);
      P('canopy', -25, 16, 0.3, 1); P('urns', -9, -16); P('urns', -27, -4, 1); P('urns', -19, 6, 2, 0.8);
      P('palm', -30, -20, 0.3, 1.2); P('palm', -29, 20, 1.2, 1.0); P('palm', -8, 21, 2.2, 1.1);
      P('brazier', -21, -3.6); P('brazier', -21, 3.6); P('bones', -17, -6); P('bones', -4, 17, 1);
      P('jackal', -32.6, 0, Math.PI / 2, 1.1);
    },
    dummies: [[-12, 0, 0], [-8, 0, -6], [-8, 0, 8], [-14, 0, -9], [0, 2.0, 0], [-3, 0.5, 4]],
  },
};

export const MAPS = Object.entries(DEFS).map(([id, d]) => ({ id, name: d.name, desc: d.desc, accent: d.theme.accent }));

const built = {};
export function getMap(id) {
  if (!DEFS[id]) id = 'sanctum';
  if (!built[id]) {
    const m = builder();
    DEFS[id].build(m);
    built[id] = { id, ...DEFS[id], boxes: m.boxes, props: m.props, hazards: m.hazards };
  }
  return built[id];
}

export function setMap(id) {
  const m = getMap(id);
  COLLIDERS.length = 0; COLLIDERS.push(...m.boxes);
  HAZARDS.length = 0; HAZARDS.push(...m.hazards);
  MAP.cur = m;
  return m;
}

export const PIT = { lava: 1, abyss: 1 };
export function pitAt(x, z) { const k = hazardAt(x, z); return k && PIT[k] ? k : null; }
export function hazardAt(x, z) {
  for (const h of HAZARDS) if (x >= h.min[0] && x <= h.max[0] && z >= h.min[1] && z <= h.max[1]) return h.kind;
  return null;
}

setMap('sanctum');
