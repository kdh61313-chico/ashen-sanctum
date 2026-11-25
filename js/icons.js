// Canvas-painted ability glyphs. Each returns a data URL (64x64, transparent).
const cache = new Map();

export function icon(key, color = '#e8d8b8') {
  const k = key + color;
  if (cache.has(k)) return cache.get(k);
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const g = cv.getContext('2d');
  g.translate(32, 32);
  g.strokeStyle = color; g.fillStyle = color; g.lineWidth = 3.2; g.lineCap = 'round'; g.lineJoin = 'round';
  g.shadowColor = color; g.shadowBlur = 6;
  (GLYPH[key] || GLYPH.orb)(g, color);
  const url = cv.toDataURL();
  cache.set(k, url);
  return url;
}

const P = (g, pts, close = false, fill = false) => {
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  if (close) g.closePath(); fill ? g.fill() : g.stroke();
};
const C = (g, r, fill = false, x = 0, y = 0, a0 = 0, a1 = Math.PI * 2) => { g.beginPath(); g.arc(x, y, r, a0, a1); fill ? g.fill() : g.stroke(); };
const blade = (g, x, y, len, w, rot) => { g.save(); g.translate(x, y); g.rotate(rot); P(g, [[0, -len], [w, -len * 0.25], [w * 0.6, 0], [-w * 0.6, 0], [-w, -len * 0.25]], true, true); P(g, [[-w * 1.8, 2], [w * 1.8, 2]]); P(g, [[0, 2], [0, 10]]); g.restore(); };
const arrowHead = (g, x, y, rot, s = 8) => { g.save(); g.translate(x, y); g.rotate(rot); P(g, [[0, -s], [s * 0.7, s * 0.3], [-s * 0.7, s * 0.3]], true, true); g.restore(); };
const star = (g, r, n = 5, inner = 0.45, fill = true) => { const pts = []; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n; const rr = i % 2 ? r * inner : r; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); } P(g, pts, true, fill); };
const flame = (g, s = 1, y = 0) => { g.beginPath(); g.moveTo(0, -20 * s + y); g.bezierCurveTo(14 * s, -6 * s + y, 14 * s, 10 * s + y, 0, 18 * s + y); g.bezierCurveTo(-14 * s, 10 * s + y, -14 * s, -2 * s + y, -4 * s, -8 * s + y); g.bezierCurveTo(-2 * s, -2 * s + y, 2 * s, -4 * s + y, 0, -20 * s + y); g.fill(); };

const GLYPH = {
  slash(g) { blade(g, 0, 12, 34, 4.5, 0.6); g.globalAlpha = 0.6; C(g, 22, false, -6, 6, -1.9, -0.6); },
  dash(g) { P(g, [[-20, -10], [-4, -10]]); P(g, [[-24, 0], [0, 0]]); P(g, [[-20, 10], [-4, 10]]); arrowHead(g, 12, 0, Math.PI / 2, 12); },
  shield(g) { P(g, [[0, -22], [18, -14], [16, 6], [0, 22], [-16, 6], [-18, -14]], true); P(g, [[0, -14], [0, 14]]); P(g, [[-9, -3], [9, -3]]); },
  leap(g) { g.beginPath(); g.moveTo(-20, 18); g.quadraticCurveTo(0, -30, 18, 10); g.stroke(); arrowHead(g, 18, 12, Math.PI * 0.85, 9); P(g, [[-24, 20], [24, 20]]); },
  daggers(g) { blade(g, -6, 12, 26, 3.5, -0.4); blade(g, 6, 12, 26, 3.5, 0.4); },
  blink(g) { g.setLineDash([4, 5]); C(g, 10, false, -12, 4); g.setLineDash([]); C(g, 10, true, 12, -4); P(g, [[-2, 0], [6, -2]]); },
  shuriken(g) { star(g, 22, 4, 0.3); g.globalCompositeOperation = 'destination-out'; C(g, 4, true); },
  ghost(g) { g.beginPath(); g.moveTo(-14, 20); g.lineTo(-14, -4); g.arc(0, -4, 14, Math.PI, 0); g.lineTo(14, 20); g.lineTo(7, 14); g.lineTo(0, 20); g.lineTo(-7, 14); g.closePath(); g.fill(); g.globalCompositeOperation = 'destination-out'; C(g, 3, true, -5, -5); C(g, 3, true, 5, -5); },
  fire(g) { flame(g, 1.1); },
  burst(g) { for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; P(g, [[Math.cos(a) * 8, Math.sin(a) * 8], [Math.cos(a) * 22, Math.sin(a) * 22]]); } C(g, 6, true); },
  wall(g) { for (let i = -2; i <= 2; i++) { g.save(); g.translate(i * 9, 6); g.scale(0.45, 0.8); flame(g, 1); g.restore(); } P(g, [[-24, 22], [24, 22]]); },
  meteor(g) { C(g, 9, true, 8, 8); P(g, [[2, 2], [-20, -20]]); P(g, [[8, -2], [-12, -22]]); P(g, [[-2, 8], [-22, -12]]); },
  arrow(g) { P(g, [[-20, 20], [16, -16]]); arrowHead(g, 16, -16, Math.PI / 4, 9); P(g, [[-20, 20], [-20, 12]]); P(g, [[-20, 20], [-12, 20]]); },
  backjump(g) { g.beginPath(); g.moveTo(18, 18); g.quadraticCurveTo(0, -28, -18, 6); g.stroke(); arrowHead(g, -18, 8, -Math.PI * 0.85, 9); },
  trap(g) { for (let i = -2; i <= 2; i++) P(g, [[i * 9 - 4, 14], [i * 9, -6 - Math.abs(i) * -3], [i * 9 + 4, 14]], true, true); P(g, [[-24, 16], [24, 16]]); },
  snow(g) { for (let i = 0; i < 3; i++) { g.save(); g.rotate(i * Math.PI / 3); P(g, [[0, -22], [0, 22]]); P(g, [[-6, -16], [0, -10], [6, -16]]); P(g, [[-6, 16], [0, 10], [6, 16]]); g.restore(); } },
  orb(g) { C(g, 12, true); g.globalAlpha = 0.5; C(g, 20); },
  wing(g) { for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-18, 14); g.quadraticCurveTo(-4 + i * 4, -20 + i * 6, 20 - i * 2, -16 + i * 9); g.stroke(); } },
  heal(g) { P(g, [[0, -18], [0, 18]]); P(g, [[-18, 0], [18, 0]]); g.globalAlpha = .5; C(g, 22); },
  ankh(g) { g.beginPath(); g.ellipse(0, -12, 8, 10, 0, 0, Math.PI * 2); g.stroke(); P(g, [[0, -2], [0, 22]]); P(g, [[-14, 4], [14, 4]]); },
  hammer(g) { P(g, [[-14, 20], [8, -2]]); g.save(); g.translate(10, -8); g.rotate(-Math.PI / 4); g.fillRect(-14, -8, 28, 14); g.restore(); },
  hook(g) { P(g, [[0, -22], [0, 6]]); g.beginPath(); g.arc(-8, 6, 8, 0, Math.PI); g.stroke(); arrowHead(g, -16, 2, 0, 6); for (let i = 0; i < 3; i++) C(g, 3, false, 0, -16 + i * 7); },
  quake(g) { P(g, [[-22, 10], [-12, 4], [-6, 12], [2, 2], [10, 10], [22, 4]]); for (let i = -1; i <= 1; i++) P(g, [[i * 12, -2], [i * 14, -16]]); },
  giant(g) { C(g, 6, true, 0, -14); P(g, [[0, -6], [0, 10]]); P(g, [[-14, -2], [0, 0], [14, -2]]); P(g, [[0, 10], [-10, 22]]); P(g, [[0, 10], [10, 22]]); g.globalAlpha = .5; P(g, [[-22, -22], [-22, -14]]); P(g, [[-22, -22], [-14, -22]]); P(g, [[22, 22], [22, 14]]); P(g, [[22, 22], [14, 22]]); },
  bolt(g) { P(g, [[4, -22], [-10, 2], [2, 2], [-6, 22], [12, -4], [0, -4], [8, -22]], true, true); },
  chain(g) { P(g, [[-20, -14], [-6, 2], [-12, 4], [4, 20]]); P(g, [[20, -14], [8, 0], [14, 2], [2, 14]]); C(g, 4, true, -20, -14); C(g, 4, true, 20, -14); },
  storm(g) { g.beginPath(); g.arc(-8, -8, 9, Math.PI, 0); g.arc(6, -10, 11, Math.PI, 0); g.lineTo(18, 0); g.lineTo(-18, 0); g.closePath(); g.fill(); P(g, [[-2, 2], [-8, 12], [0, 12], [-6, 22]]); P(g, [[10, 2], [6, 10], [12, 10]]); },
  claw(g) { for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * 10 - 6, -20); g.quadraticCurveTo(i * 10 + 6, 0, i * 10 - 2, 22); g.stroke(); } },
  bat(g) { P(g, [[0, -4], [-8, -12], [-14, -4], [-24, -10], [-20, 6], [-10, 4], [0, 12], [10, 4], [20, 6], [24, -10], [14, -4], [8, -12]], true, true); },
  spear(g) { P(g, [[-20, 20], [12, -12]]); g.save(); g.translate(14, -14); g.rotate(Math.PI / 4); P(g, [[0, -12], [5, 0], [0, 6], [-5, 0]], true, true); g.restore(); },
  feast(g) { g.beginPath(); g.moveTo(0, -20); g.bezierCurveTo(14, 0, 12, 18, 0, 18); g.bezierCurveTo(-12, 18, -14, 0, 0, -20); g.fill(); g.globalAlpha = .5; C(g, 24); },
  flask(g) { P(g, [[-5, -20], [5, -20]]); P(g, [[-4, -20], [-4, -6], [-16, 14], [-12, 20], [12, 20], [16, 14], [4, -6], [4, -20]]); g.globalAlpha = .7; P(g, [[-12, 10], [12, 10], [14, 16], [-14, 16]], true, true); },
  smoke(g) { for (const [x, y, r] of [[-10, 6, 9], [4, 2, 11], [12, 12, 7], [-4, -10, 8]]) C(g, r, false, x, y); },
  miasma(g) { g.globalAlpha = .8; for (const [x, y, r] of [[-10, 4, 9], [6, 0, 11], [0, 12, 8]]) C(g, r, true, x, y); g.globalAlpha = 1; g.globalCompositeOperation = 'destination-out'; C(g, 3, true, -4, 2); C(g, 3, true, 6, 2); },
  skull(g) { g.beginPath(); g.arc(0, -4, 16, Math.PI * 0.85, Math.PI * 2.15); g.lineTo(8, 20); g.lineTo(-8, 20); g.closePath(); g.fill(); g.globalCompositeOperation = 'destination-out'; C(g, 5, true, -6, -2); C(g, 5, true, 6, -2); P(g, [[0, 6], [-3, 11], [3, 11]], true, true); },
  void(g) { C(g, 16, true); g.globalCompositeOperation = 'destination-out'; C(g, 9, true); g.globalCompositeOperation = 'source-over'; C(g, 22); },
  rift(g) { for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(0, 0, 6 + i * 7, i * 1.5, i * 1.5 + Math.PI * 1.3); g.stroke(); } C(g, 3, true); },
  collapse(g) { C(g, 10, true); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; P(g, [[Math.cos(a) * 24, Math.sin(a) * 24], [Math.cos(a) * 15, Math.sin(a) * 15]]); arrowHead(g, Math.cos(a) * 14, Math.sin(a) * 14, a - Math.PI / 2, 4); } },
  roar(g) { P(g, [[-20, -8], [-8, -8], [-8, 8], [-20, 8]], true, true); for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(-6, 0, 10 + i * 7, -0.8, 0.8); g.stroke(); } },
  wolf(g) { P(g, [[-16, -20], [-10, -6], [0, -2], [10, -6], [16, -20], [18, 4], [6, 20], [-6, 20], [-18, 4]], true, true); g.globalCompositeOperation = 'destination-out'; P(g, [[-10, 2], [-3, 6], [-10, 8]], true, true); P(g, [[10, 2], [3, 6], [10, 8]], true, true); },
  axe(g) { P(g, [[-16, 20], [10, -12]]); g.beginPath(); g.moveTo(2, -16); g.quadraticCurveTo(22, -24, 22, -2); g.lineTo(10, -8); g.closePath(); g.fill(); },
  whirl(g) { for (let i = 0; i < 3; i++) { g.save(); g.rotate(i * Math.PI * 2 / 3); g.beginPath(); g.arc(0, 0, 18, 0, 1.6); g.stroke(); arrowHead(g, Math.cos(1.6) * 18, Math.sin(1.6) * 18, 1.6 + Math.PI, 6); g.restore(); } },
  rage(g) { flame(g, 0.9, 4); g.globalCompositeOperation = 'destination-out'; P(g, [[-6, 0], [-1, 3], [-6, 5]], true, true); P(g, [[6, 0], [1, 3], [6, 5]], true, true); },
  star(g) { star(g, 20); },
  starfall(g) { g.save(); g.translate(6, 6); star(g, 11); g.restore(); P(g, [[-2, -2], [-20, -20]]); P(g, [[-10, 2], [-22, -10]]); g.save(); g.translate(-14, -16); star(g, 5); g.restore(); },
  dragon(g) { P(g, [[-20, 8], [-6, -6], [6, -4], [20, -16], [14, 2], [22, 6], [6, 10], [0, 20], [-6, 10]], true, true); g.globalCompositeOperation = 'destination-out'; C(g, 2.5, true, 8, 0); },
  eye(g) { g.beginPath(); g.moveTo(-22, 0); g.quadraticCurveTo(0, -20, 22, 0); g.quadraticCurveTo(0, 20, -22, 0); g.stroke(); C(g, 7, true); },
  fan(g) { for (let i = -3; i <= 3; i++) { g.save(); g.rotate(i * 0.25); P(g, [[0, 18], [0, -16]]); arrowHead(g, 0, -18, 0, 5); g.restore(); } },
  crow(g) { P(g, [[-22, -4], [-6, -2], [0, -10], [6, -2], [22, -4], [8, 4], [2, 14], [-2, 14], [-8, 4]], true, true); },
  reaper(g) { g.beginPath(); g.moveTo(-14, -20); g.quadraticCurveTo(22, -22, 20, 6); g.quadraticCurveTo(10, -10, -14, -12); g.fill(); P(g, [[-14, -20], [6, 22]]); },
  rune(g) { P(g, [[0, -22], [0, 22]]); P(g, [[0, -10], [12, -20]]); P(g, [[0, 2], [-12, -8]]); P(g, [[0, 12], [12, 4]]); g.globalAlpha = .5; C(g, 24); },
  ray(g) { P(g, [[-22, 22], [18, -18]]); g.lineWidth = 1.5; P(g, [[-14, 22], [22, -14]]); P(g, [[-22, 14], [14, -22]]); C(g, 5, true, 18, -18); },
  pillar(g) { g.fillRect(-6, -24, 12, 38); P(g, [[-20, 18], [20, 18]]); g.globalAlpha = .5; C(g, 16, false, 0, 18, Math.PI, Math.PI * 2); },
  halo(g) { g.beginPath(); g.ellipse(0, -10, 16, 6, 0, 0, Math.PI * 2); g.stroke(); P(g, [[0, -2], [-6, 20]]); P(g, [[0, -2], [6, 20]]); P(g, [[0, 4], [-18, 0]]); P(g, [[0, 4], [18, 0]]); },
  thorn(g) { P(g, [[-20, 20], [18, -18]]); for (let i = 0; i < 4; i++) { const x = -12 + i * 9, y = 12 - i * 9; P(g, [[x, y], [x - 6, y - 8]]); } },
  vine(g) { g.beginPath(); g.moveTo(-20, 22); g.bezierCurveTo(-20, -4, 20, 6, 18, -20); g.stroke(); for (const [x, y] of [[-12, 6], [4, 0], [12, -12]]) { g.beginPath(); g.ellipse(x, y, 5, 3, 0.8, 0, Math.PI * 2); g.fill(); } },
  roots(g) { for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 9, 22); g.quadraticCurveTo(i * 9 + (i % 2 ? 8 : -8), 0, i * 6, -18 + Math.abs(i) * 6); g.stroke(); } },
  cauldron(g) { g.beginPath(); g.arc(0, 6, 16, 0, Math.PI); g.lineTo(-16, 2); g.lineTo(16, 2); g.fill(); P(g, [[-20, 2], [20, 2]]); for (const [x, r] of [[-6, 4], [4, 5], [10, 3]]) C(g, r, false, x, -8 + r); },
  sanctum(g) { C(g, 20); g.globalAlpha = .6; C(g, 13); g.globalAlpha = 1; P(g, [[0, -10], [0, 10]]); P(g, [[-10, 0], [10, 0]]); },
};
