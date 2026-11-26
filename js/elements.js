// Six elements. Every hero has one. Hits apply the attacker's element effect;
// two or more heroes of the same element on a team trigger a resonance bonus.
export const ELEMENTS = {
  fire: { name: '화염', color: '#ff6a2a', c2: '#ffd27a', desc: '적중한 적을 3초 동안 불태운다 (초당 6).', reso: '피해 +6%' },
  frost: { name: '빙결', color: '#7fd8ff', c2: '#ffffff', desc: '적중할 때마다 둔화시키고, 5번 쌓이면 0.7초 동안 얼린다.', reso: '최대 체력 +8%' },
  storm: { name: '뇌전', color: '#9fb0ff', c2: '#ffffff', desc: '적중 시 25% 확률로 주변 적에게 번개가 튄다 (피해의 35%).', reso: '이동 속도 +6%' },
  shadow: { name: '암흑', color: '#b07cff', c2: '#f0e0ff', desc: '피해의 8%를 흡혈하고, 체력 35% 이하인 적에게 피해 +15%.', reso: '흡혈 +4%' },
  holy: { name: '신성', color: '#ffd86a', c2: '#fff6d0', desc: '주는 치유 +20%. 적중 시 가장 다친 주변 아군을 피해의 10%만큼 치유.', reso: '받는 치유 +10%' },
  nature: { name: '자연', color: '#7bd36a', c2: '#e8ffd0', desc: '적중한 적을 중독시키고, 중독된 적은 받는 치유가 30% 줄어든다.', reso: '초당 체력 2 회복' },
};
export const EL_ORDER = ['fire', 'frost', 'storm', 'shadow', 'holy', 'nature'];

export const HERO_EL = {
  // fire
  valok: 'fire', igna: 'fire', azrak: 'fire', helga: 'fire', bael: 'fire', jack: 'fire', karman: 'fire', kaira: 'fire', surtr: 'fire', asha: 'fire',
  // frost
  selene: 'frost', luna: 'frost', elise: 'frost', tyr: 'frost', ulfric: 'frost', sien: 'frost', brann: 'frost', ragna: 'frost', maren: 'frost', frey: 'frost',
  // storm
  razel: 'storm', aura: 'storm', zeno: 'storm', talon: 'storm', mira: 'storm', rowan: 'storm', orin: 'storm', thalia: 'storm', hyeon: 'storm', zephyr: 'storm',
  // shadow
  nir: 'shadow', veyla: 'shadow', mor: 'shadow', nox: 'shadow', crow: 'shadow', moloch: 'shadow', veronica: 'shadow', sira: 'shadow', nocturne: 'shadow', mariette: 'shadow', nyx: 'shadow', garrick: 'shadow',
  // holy
  kael: 'holy', eris: 'holy', seraph: 'holy', lian: 'holy', grave: 'holy', vesper: 'holy', celes: 'holy', dorn: 'holy', lumen: 'holy',
  // nature
  belladonna: 'nature', onyx: 'nature', hark: 'nature', iris: 'nature', grom: 'nature', bark: 'nature', gorm: 'nature', pell: 'nature', koru: 'nature',
};

// ---- type matchups (Pokémon-style) ----
// Four elements chase each other in a circle: 화염 → 자연 → 뇌전 → 빙결 → 화염.
// Fire burns plants, roots ground lightning, lightning shatters ice, ice smothers fire.
// 암흑 and 신성 are each other's bane: both hit the other hard.
export const BEATS = { fire: ['nature'], nature: ['storm'], storm: ['frost'], frost: ['fire'], shadow: ['holy'], holy: ['shadow'] };
export const SUPER = 1.25, RESIST = 0.8, SAME = 0.9;
export function matchup(a, d) {
  if (!a || !d) return 1;
  if (BEATS[a]?.includes(d)) return SUPER;
  if (a === d) return SAME;
  if (BEATS[d]?.includes(a) && !BEATS[a]?.includes(d)) return RESIST;
  return 1;
}
export function strongVs(el) { return BEATS[el] || []; }
export function weakTo(el) { return Object.keys(BEATS).filter(k => BEATS[k].includes(el) && !BEATS[el]?.includes(k)); }
