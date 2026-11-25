// Arena layout: "잿빛 성역" — ruined cathedral courtyard. Pure data (no three.js).
// Boxes are axis-aligned {min:[x,y,z], max:[x,y,z], kind}. Point-symmetric for fairness.

const boxes = [];
function B(cx, cz, sx, sz, h, y0 = 0, kind = 'stone', mirror = true) {
  const b = { min: [cx - sx / 2, y0, cz - sz / 2], max: [cx + sx / 2, y0 + h, cz + sz / 2], kind };
  boxes.push(b);
  if (mirror && !(cx === 0 && cz === 0)) {
    boxes.push({ min: [-cx - sx / 2, y0, -cz - sz / 2], max: [-cx + sx / 2, y0 + h, -cz + sz / 2], kind });
  }
}

export const HALF_X = 34, HALF_Z = 24;

// Outer walls
B(0, -HALF_Z - 1, HALF_X * 2 + 4, 2, 10, 0, 'wall', false);
B(0, HALF_Z + 1, HALF_X * 2 + 4, 2, 10, 0, 'wall', false);
B(-HALF_X - 1, 0, 2, HALF_Z * 2 + 4, 10, 0, 'wall', false);
B(HALF_X + 1, 0, 2, HALF_Z * 2 + 4, 10, 0, 'wall', false);

// Central altar
B(0, 0, 8, 8, 1.2, 0, 'altar', false);
for (const [sx, sz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
  const along = sx !== 0;
  // two steps per side
  for (let i = 0; i < 2; i++) {
    const off = 4.6 + i * 1.2;
    const top = 0.8 - i * 0.4;
    const cx = sx * off, cz = sz * off;
    boxes.push(along
      ? { min: [cx - 0.6, 0, cz - 1.8], max: [cx + 0.6, top, cz + 1.8], kind: 'step' }
      : { min: [cx - 1.8, 0, cz - 0.6], max: [cx + 1.8, top, cz + 0.6], kind: 'step' });
  }
}
// altar pillars (corners) and broken obelisk
for (const [px, pz] of [[3.4, 3.4], [-3.4, 3.4], [3.4, -3.4], [-3.4, -3.4]]) {
  boxes.push({ min: [px - 0.45, 0, pz - 0.45], max: [px + 0.45, 6.2, pz + 0.45], kind: 'pillar' });
}
boxes.push({ min: [-0.7, 1.2, -0.7], max: [0.7, 4.2, 0.7], kind: 'obelisk' });

// Spawn cover walls
B(-21, -7, 1.2, 6, 3.2, 0, 'wall');
B(-21, 7, 1.2, 6, 3.2, 0, 'wall');
// Spawn gate arch pieces
B(-26, -13, 2, 2, 7, 0, 'pillar');
B(-26, 13, 2, 2, 7, 0, 'pillar');

// Mid broken columns
B(-10, -5, 1.4, 1.4, 4.5, 0, 'pillar');
B(-10, 5.5, 1.4, 1.4, 2.2, 0, 'pillar');
B(-11, -14, 1.4, 1.4, 4.5, 0, 'pillar');
B(-4, -14, 1.4, 1.4, 1.6, 0, 'rubble');

// Low corridor walls (jumpable)
B(-10, 11, 8, 0.9, 1.1, 0, 'lowwall');
B(10, 11, 8, 0.9, 1.1, 0, 'lowwall');

// Crates / sarcophagi stack
B(-15.5, 0, 2.2, 3.2, 1.0, 0, 'coffin');
B(-15.5, 0.3, 1.4, 1.4, 1.0, 1.0, 'coffin');

// Ruined wall segments near long walls
B(-6, -18.5, 5, 1.2, 3.6, 0, 'wall');
B(4, -20, 1.6, 1.6, 2.0, 0, 'rubble');
B(-18, 18, 4, 1.2, 3.0, 0, 'wall');

// Raised ledge with steps (one per team, point-symmetric)
B(-25, -18.5, 7, 6, 2.0, 0, 'ledge');
for (let i = 0; i < 4; i++) {
  const top = 1.6 - i * 0.4;
  const cx = -21.5 + 0.6 + i * 1.2;
  B(cx, -18.5, 1.2, 3, top, 0, 'step');
}
// ledge parapet
B(-25, -15.7, 7, 0.4, 0.8, 2.0, 'lowwall');

export const COLLIDERS = boxes;

export const SPAWNS = [
  [[-29, 0, -3], [-29, 0, 0], [-29, 0, 3], [-30.5, 0, -1.5], [-30.5, 0, 1.5], [-28, 0, 5]],
  [[29, 0, 3], [29, 0, 0], [29, 0, -3], [30.5, 0, 1.5], [30.5, 0, -1.5], [28, 0, -5]],
];
export const SPAWN_YAW = [-Math.PI / 2, Math.PI / 2];

// Training ground dummies positions (used in training mode)
export const DUMMY_SPOTS = [
  [-12, 0, -2], [-12, 0, 3], [-6, 0, -8], [-6, 0, 8], [0, 1.2, 0], [-16, 0, 8],
];

// Decorative props (non-colliding), consumed by world renderer
export const PROPS = (() => {
  const p = [];
  const add = (type, x, z, rot = 0, s = 1, y = 0) => { p.push({ type, x, z, rot, s, y }); p.push({ type, x: -x, z: -z, rot: rot + Math.PI, s, y }); };
  add('brazier', -21, -3.6); add('brazier', -21, 3.6);
  add('brazier', -4.6, -4.6, 0, 1, 0);
  add('grave', -14, -9, 0.2); add('grave', -13, -10.5, -0.3); add('grave', -15.5, -8.2, 0.1);
  add('grave', -8, 17, 0.4); add('grave', -9.5, 18.5, -0.2);
  add('tree', -28, -20, 0.5, 1.2); add('tree', -16, 21, 2, 1.0); add('tree', -31, 18, 1, 1.3);
  add('banner', -33.9, -6, Math.PI / 2); add('banner', -33.9, 6, Math.PI / 2);
  add('crystal', -12, 15, 0.3, 1); add('crystal', -24, 8, 1.3, 0.8);
  add('candles', -10.6, -3.6); add('candles', -1.8, -2.6, 0, 1, 1.2);
  add('bones', -6, 6); add('bones', -18, -11);
  add('statue', -32.6, 0, Math.PI / 2, 1.2);
  return p;
})();
