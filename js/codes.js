// Coupon codes. Every update adds a few; each works once per save.
// Codes are matched case-insensitively and ignore spaces and dashes.
export const COUPONS = [
  { code: 'STORY20', ver: '2.0', until: '2027-04-30', reward: { crystals: 3000, permits: 5 }, label: '2.0 업데이트 기념' },
  { code: 'NARHEL', ver: '2.0', until: '2027-04-30', reward: { crystals: 2000, essence: 150, tome: 6 }, label: '별의 왕국' },
  { code: 'SEEDOFHOPE', ver: '2.0', until: '2027-04-30', reward: { permits: 5, seal: 8 }, label: '심연에서도 자라는 씨앗' },
  { code: 'ASHEN19', ver: '1.9', until: '2027-03-31', reward: { crystals: 3000, permits: 5 }, label: '1.9 업데이트 기념' },
  { code: 'SANCTUM2026', ver: '1.9', until: '2027-03-31', reward: { crystals: 1500, essence: 120, tome: 5 }, label: '성역 개방 감사' },
  { code: 'TYPECHART', ver: '1.9', until: '2027-03-31', reward: { permits: 3, seal: 6 }, label: '속성 상성 추가 기념' },
];

export const normCode = (s) => String(s || '').toUpperCase().replace(/[\s\-_]/g, '');

// The admin code is kept only as a SHA-256 digest so it does not sit in the source as text.
const ADMIN_DIGEST = '5f71d95ababa19405148ba61b9382334451e17e980f57c68678631c7ff04984e';
export async function digest(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ashen:' + normCode(s)));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
export async function isAdminCode(s) { try { return (await digest(s)) === ADMIN_DIGEST; } catch (e) { return false; } }

export const REWARD_NAMES = { crystals: '잿빛 결정', permits: '모집 허가증', tokens: '잔불 증표', essence: '정수', seal: '인장', tome: '기술서' };
export const rewardText = (r) => Object.entries(r).map(([k, v]) => `${REWARD_NAMES[k] || k} ${v.toLocaleString()}`).join(', ');
