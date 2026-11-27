// Pull cinematic for both hero recruitment and skin pulls.
//  1. gather   — a star field; motes spiral into a rune sigil that draws itself
//  2. charge   — a pillar of light rises; its colour teases the best result
//                (blue → violet → gold/crimson, each change cracks with a flash and a shake)
//  3. burst    — white flash, a shock ring, and one comet per result arcs out to its card
//  4. cards    — each card ignites where its comet lands; best results get a full-screen reveal
// Tap moves to the next beat; 건너뛰기 skips to the summary.
import { HERO_MAP, ROLES } from './heroes.js';
import { ELEMENTS } from './elements.js';
import { renderSplash } from './stage.js';
import { SKIN_MAP, TIERS as SKIN_TIERS, PIECE_NAMES } from './skins.js';

const $ = (id) => document.getElementById(id);
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
const eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
const rgba = (h, a) => { const c = h.startsWith('rgb(') ? h.slice(4, -1).split(',').map(Number) : hex(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };

// tease levels: 0 blue, 1 violet, 2 gold, 3 crimson-gold
const LEVEL = ['#9fc8ff', '#b98aff', '#ffcf5a', '#ff7a3a'];
const HERO_C = { 6: ['#ff8a3a', '#ffe0a0'], 5: ['#ffd76a', '#fff4d0'], 4: ['#a98aff', '#e8dcff'], 3: ['#8ab4ff', '#e0ecff'] };
const SKIN_C = ['#c8d0dc', '#6fe0a0', '#5aa8ff', '#b77aff', '#ffb347', '#ff5a7a'];

class Engine {
  constructor(cv) { this.cv = cv; this.ctx = cv.getContext('2d'); this.parts = []; this.comets = []; this.running = false; }
  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = this.cv.clientWidth || innerWidth, h = this.cv.clientHeight || innerHeight;
    this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr);
    this.dpr = dpr; this.w = w; this.h = h;
    this.stars = Array.from({ length: Math.round(w * h / 5200) }, () => ({ x: Math.random() * w, y: Math.random() * h, s: Math.random() * 1.4 + 0.3, tw: Math.random() * 6.3, sp: 0.5 + Math.random() * 2 }));
  }
  start(o) {
    this.o = o; this.t = 0; this.flash = 0; this.shake = 0; this.parts.length = 0; this.comets.length = 0;
    this.level = 0; this.color = LEVEL[0]; this.burstAt = o.gather + o.charge; this.burst = false; this.cracks = o.cracks;
    this.resize();
    if (!this.running) { this.running = true; this.last = performance.now(); const loop = (now) => { if (!this.running) return; const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; this.step(dt); this.draw(); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
  }
  stop() { this.running = false; }
  skipToBurst() { if (this.t < this.burstAt) { this.t = this.burstAt - 0.01; while (this.cracks.length && this.cracks[0].at <= this.burstAt) this.crack(this.cracks.shift()); } }
  crack(c) { this.level = c.level; this.color = LEVEL[c.level]; this.flash = Math.max(this.flash, 0.55); this.shake = 10 + c.level * 4; this.o.onCrack?.(c.level); this.ring(this.w / 2, this.h * 0.46, LEVEL[c.level], 0.7); for (let i = 0; i < 60; i++) this.spark(this.w / 2, this.h * 0.46, LEVEL[c.level], 260 + Math.random() * 420, 0.9); }
  spark(x, y, c, sp = 200, life = 0.8, s = 2.2) { const a = Math.random() * Math.PI * 2, v = sp * (0.3 + Math.random() * 0.7); this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, c, s: s * (0.6 + Math.random()), drag: 2.2 }); }
  ring(x, y, c, life = 0.8, r1 = 0.6) { this.parts.push({ ring: true, x, y, c, life, max: life, r1: Math.max(this.w, this.h) * r1 }); }
  step(dt) {
    const o = this.o; this.t += dt;
    const cx = this.w / 2, cy = this.h * 0.46;
    // motes spiral in while gathering and charging
    if (this.t < this.burstAt) {
      const n = this.t < o.gather ? 3 : 6;
      for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, r = Math.max(this.w, this.h) * (0.45 + Math.random() * 0.3); this.parts.push({ orbit: true, a, r, r0: r, x: cx, y: cy, life: 1.6, max: 1.6, c: Math.random() < 0.7 ? this.color : '#ffffff', s: 1 + Math.random() * 2 }); }
    }
    while (this.cracks.length && this.t >= this.cracks[0].at) this.crack(this.cracks.shift());
    if (!this.burst && this.t >= this.burstAt) { this.burst = true; this.doBurst(); }
    for (const p of this.parts) {
      p.life -= dt;
      if (p.orbit) { const k = 1 - p.life / p.max; p.r = p.r0 * Math.pow(1 - k, 1.6); p.a += dt * (1.2 + k * 5); p.x = cx + Math.cos(p.a) * p.r; p.y = cy + Math.sin(p.a) * p.r * 0.55; }
      else if (!p.ring) { p.x += p.vx * dt; p.y += p.vy * dt; const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= d; p.vy += (p.g || 0) * dt; }
    }
    this.parts = this.parts.filter(p => p.life > 0);
    for (const c of this.comets) {
      const u = (this.t - c.t0) / c.dur;
      if (u < 0) continue;
      const k = eio(u), x = (1 - k) * (1 - k) * c.a[0] + 2 * (1 - k) * k * c.b[0] + k * k * c.e[0], y = (1 - k) * (1 - k) * c.a[1] + 2 * (1 - k) * k * c.b[1] + k * k * c.e[1];
      if (u <= 1) { c.hist.push([x, y]); if (c.hist.length > 22) c.hist.shift(); if (Math.random() < 0.6) this.parts.push({ x, y, vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 40, life: 0.5, max: 0.5, c: c.c, s: 1.6 + c.lvl * 0.5, drag: 1 }); }
      else { if (!c.landed) { c.landed = true; this.o.onLand?.(c.i); for (let i = 0; i < 16 + c.lvl * 10; i++) this.spark(c.e[0], c.e[1], i % 3 ? c.c : '#ffffff', 120 + c.lvl * 90, 0.7); this.ring(c.e[0], c.e[1], c.c, 0.5, 0.06 + c.lvl * 0.03); } if (c.hist.length) c.hist.shift(); }
    }
    this.flash = Math.max(0, this.flash - dt * 1.6); this.shake = Math.max(0, this.shake - dt * 30);
  }
  doBurst() {
    const o = this.o, cx = this.w / 2, cy = this.h * 0.46;
    this.flash = 1; this.shake = 14 + this.level * 5; o.onBurst?.();
    this.ring(cx, cy, '#ffffff', 0.9, 0.9); this.ring(cx, cy, this.color, 1.2, 0.7);
    for (let i = 0; i < 140; i++) this.spark(cx, cy, i % 4 ? this.color : '#ffffff', 300 + Math.random() * 700, 1.1, 2.6);
    const targets = o.targets();
    targets.forEach((tg, i) => {
      const it = o.items[i], side = tg[0] < cx ? -1 : 1;
      this.comets.push({ i, a: [cx, cy], e: tg, b: [cx + side * this.w * (0.12 + Math.random() * 0.12), cy - this.h * (0.25 + Math.random() * 0.15)], t0: this.t + 0.12 + i * 0.07, dur: 0.6 + Math.random() * 0.2, c: it.c, lvl: it.lvl, hist: [] });
    });
  }
  sigil(ctx, cx, cy, R, rot, c, a) {
    if (a <= 0.01) return;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.92);
    const line = (w, al) => { ctx.lineWidth = w; ctx.strokeStyle = rgba(c, al * a); };
    for (const [w, al] of [[6, 0.12], [1.4, 0.9]]) {
      line(w, al);
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
      ctx.save(); ctx.rotate(-rot * 1.4); ctx.setLineDash([R * 0.05, R * 0.09]); ctx.beginPath(); ctx.arc(0, 0, R * 0.86, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.rotate(rot * 0.5);
      for (let k = 0; k < 2; k++) { ctx.beginPath(); for (let i = 0; i <= 3; i++) { const ang = -Math.PI / 2 + k * Math.PI + i * Math.PI * 2 / 3; const x = Math.cos(ang) * R * 0.78, y = Math.sin(ang) * R * 0.78; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
      ctx.restore();
      ctx.beginPath(); ctx.arc(0, 0, R * 0.42, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.save(); ctx.rotate(rot);
    line(1.2, 0.8);
    for (let i = 0; i < 72; i++) { const ang = i / 72 * Math.PI * 2, l = i % 6 ? 0.03 : 0.07; ctx.beginPath(); ctx.moveTo(Math.cos(ang) * R * 1.02, Math.sin(ang) * R * 1.02); ctx.lineTo(Math.cos(ang) * R * (1.02 + l), Math.sin(ang) * R * (1.02 + l)); ctx.stroke(); }
    for (let i = 0; i < 6; i++) { const ang = i / 6 * Math.PI * 2; ctx.beginPath(); ctx.arc(Math.cos(ang) * R * 0.62, Math.sin(ang) * R * 0.62, R * 0.07, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
    ctx.restore();
  }
  draw() {
    const { ctx, w, h, dpr, o } = this; if (!o) return;
    const t = this.t, cx = w / 2, cy = h * 0.46;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.8);
    bg.addColorStop(0, mix('#151024', this.color.startsWith('#') ? this.color : '#9fc8ff', this.burst ? 0.08 : 0.04 + this.level * 0.02)); bg.addColorStop(0.5, '#0a0812'); bg.addColorStop(1, '#040306');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    ctx.globalCompositeOperation = 'lighter';
    // nebula
    for (let i = 0; i < 3; i++) { const nx = cx + Math.cos(t * 0.05 + i * 2.1) * w * 0.3, ny = cy + Math.sin(t * 0.07 + i) * h * 0.2, r = Math.max(w, h) * 0.35; const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, r); g.addColorStop(0, rgba(i === 1 ? '#5a3a8a' : this.color, 0.06)); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
    // stars
    for (const s of this.stars) { const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * s.sp + s.tw)); ctx.fillStyle = `rgba(220,225,255,${a})`; ctx.fillRect(s.x, s.y, s.s, s.s); }
    // sigil and pillar
    const g0 = o.gather, ch = o.charge;
    const sa = this.burst ? Math.max(0.1, 1 - (t - this.burstAt) * 2) : ease(t / g0);
    const R = Math.min(w, h) * (0.2 + 0.06 * ease(t / g0)) * (this.burst ? 1 + ease((t - this.burstAt) * 2) * 0.6 : 1);
    const rot = t * (0.4 + (t > g0 ? (t - g0) * 1.6 : 0));
    this.sigil(ctx, cx, cy, R, rot, this.color, sa);
    if (t > g0 * 0.6) {
      const k = this.burst ? Math.max(0, 1 - (t - this.burstAt) * 2.5) : ease((t - g0 * 0.6) / (ch + g0 * 0.4));
      const pw = 6 + k * Math.min(w, 600) * 0.16;
      const gr = ctx.createLinearGradient(cx - pw, 0, cx + pw, 0);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.42, rgba(this.color, 0.35 * k)); gr.addColorStop(0.5, `rgba(255,255,255,${0.75 * k})`); gr.addColorStop(0.58, rgba(this.color, 0.35 * k)); gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr; ctx.fillRect(cx - pw, 0, pw * 2, h);
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * (0.5 + k * 0.6)); core.addColorStop(0, `rgba(255,255,255,${0.9 * k})`); core.addColorStop(0.3, rgba(this.color, 0.6 * k)); core.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = core; ctx.fillRect(cx - R * 1.2, cy - R * 1.2, R * 2.4, R * 2.4);
    }
    // particles
    for (const p of this.parts) {
      const a = clamp(p.life / p.max);
      if (p.ring) { const k = 1 - a; ctx.strokeStyle = rgba(p.c, a * 0.8); ctx.lineWidth = 1 + a * 10; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r1 * ease(k), p.r1 * ease(k) * 0.55, 0, 0, Math.PI * 2); ctx.stroke(); continue; }
      const r = p.s * (p.orbit ? 1 : 0.6 + a);
      ctx.fillStyle = rgba(p.c, a); ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      if (r > 1.6) { ctx.fillStyle = rgba(p.c, a * 0.15); ctx.beginPath(); ctx.arc(p.x, p.y, r * 3.5, 0, Math.PI * 2); ctx.fill(); }
    }
    // comets
    for (const c of this.comets) {
      const H = c.hist; if (H.length < 2) continue;
      for (let i = 1; i < H.length; i++) { const k = i / H.length; ctx.strokeStyle = rgba(c.c, k * 0.9); ctx.lineWidth = (2 + c.lvl * 1.6) * k * 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(H[i - 1][0], H[i - 1][1]); ctx.lineTo(H[i][0], H[i][1]); ctx.stroke(); }
      const [x, y] = H[H.length - 1]; if (!c.landed) { const rr = 10 + c.lvl * 6; const g = ctx.createRadialGradient(x, y, 0, x, y, rr * 2.5); g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, rgba(c.c, 0.9)); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - rr * 2.5, y - rr * 2.5, rr * 5, rr * 5); }
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.85})`; ctx.fillRect(0, 0, w, h); }
    ctx.globalCompositeOperation = 'source-over';
  }
}

export class Summon {
  constructor(app) {
    this.app = app; this.R = $('pullres'); this.busy = false;
    this.E = new Engine($('pull-cv'));
    $('btn-pull-skip').addEventListener('click', (e) => { e.stopPropagation(); this.skipAll = true; this.E.skipToBurst(); this._tap?.(); });
    this.R.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; this._tap?.(); });
    addEventListener('resize', () => { if (!this.R.hidden) this.E.resize(); });
    $('btn-pull-ok').addEventListener('click', () => { this.E.stop(); });
  }
  tap(ms = 0) { return new Promise(res => { let t = null; this._tap = () => { clearTimeout(t); this._tap = null; res(); }; if (ms) t = setTimeout(() => { this._tap = null; res(); }, ms); }); }

  // items: [{ c, lvl, html, reveal?: async fn }]
  async run(items, kind) {
    const A = this.app.audio, R = this.R;
    this.skipAll = false;
    const top = Math.max(...items.map(i => i.lvl));
    R.className = 'gacha sm sm--' + kind; R.dataset.top = top; R.hidden = false;
    $('pull-reveal').hidden = true; $('btn-pull-ok').hidden = true; $('gacha-hint').textContent = '화면을 누르면 빨리 넘어가요';
    const cards = $('pull-cards');
    cards.className = 'sm__cards' + (items.length === 1 ? ' is-one' : '');
    cards.innerHTML = items.map((it, i) => it.html.replace('<div class="sc"', `<div class="sc" style="--rc:${it.c};--i:${i}"`)).join('');
    await new Promise(r => requestAnimationFrame(r));
    const list = [...cards.children];
    // the colour climbs one step at a time up to the best result
    const cracks = [];
    const gather = 1.25, charge = 1.15 + top * 0.35;
    for (let l = 1; l <= top; l++) cracks.push({ at: gather + charge * (0.35 + 0.6 * (l / (top + 0.5))), level: l });
    let landed = 0, done;
    const allLanded = new Promise(r => { done = r; });
    this.E.start({
      gather, charge, cracks, items,
      targets: () => list.map(el => { const b = el.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height * 0.45]; }),
      onCrack: (l) => A.play(l >= 3 ? 'thunder' : l >= 2 ? 'bell' : 'magic'),
      onBurst: () => A.play(top >= 2 ? 'bigboom' : 'boom'),
      onLand: (i) => { list[i].classList.add('is-in'); if (items[i].lvl >= 2) list[i].classList.add('is-hi'); A.play(items[i].lvl >= 2 ? 'heal' : 'tick'); if (++landed === list.length) done(); },
    });
    A.play('magic');
    // tap during the gather jumps straight to the burst
    const tapSkip = this.tap(); tapSkip.then(() => this.E.skipToBurst());
    await Promise.race([allLanded, wait((gather + charge + 2.5) * 1000)]);
    this._tap = null;
    list.forEach(el => el.classList.add('is-in'));
    if (!this.skipAll) await this.tap(items.length === 1 ? 700 : 1400);
    for (const it of items) { if (this.skipAll) break; if (it.reveal) await it.reveal(); }
    $('pull-reveal').hidden = true;
    R.classList.add('is-sum');
    $('gacha-hint').textContent = '';
    $('btn-pull-ok').hidden = false;
    this._tap = null;
  }

  // ---------------- heroes ----------------
  playHeroes(res) {
    const lvlOf = (r) => !r.id ? 0 : r.rarity >= 6 ? 3 : r.rarity === 5 ? 2 : 1;
    const items = res.map(r => {
      const lvl = lvlOf(r), c = r.id ? HERO_C[r.rarity][0] : HERO_C[3][0];
      if (!r.id) return { c, lvl, html: `<div class="sc sc--ember"><div class="sc__art"></div><div class="sc__txt"><em>잔불</em><b>증표 +${r.tokens}</b></div></div>` };
      const h = HERO_MAP[r.id];
      return { c, lvl, reveal: (r.rarity >= 5 || r.isNew) ? () => this.heroReveal(r) : null,
        html: `<div class="sc" data-l="${lvl}"><div class="sc__art" style="background-image:url(${this.app.portraits[r.id]})"></div>${r.isNew ? '<span class="sc__new">NEW</span>' : ''}<img class="sc__el" src="assets/el-${h.el}.svg" alt=""><div class="sc__txt"><em>${'★'.repeat(r.rarity)}</em><b>${esc(h.name)}</b><small>${r.isNew ? esc(h.title) : `잠재 ${r.pot} · 증표 +${r.tokens}`}</small></div></div>` };
    });
    return this.run(items, 'hero');
  }
  async heroReveal(r) {
    const h = HERO_MAP[r.id], E = ELEMENTS[h.el], [c1, c2] = HERO_C[r.rarity];
    let img = this.app.portraits[r.id]; try { img = renderSplash(h); } catch (e) { }
    await this.showReveal({ c1, c2, hc: h.color, r: r.rarity, img,
      top: `<div class="rv__stars">${Array.from({ length: r.rarity }, (_, i) => `<i style="--d:${0.55 + i * 0.12}s">★</i>`).join('')}</div><div class="rv__title">${esc(h.title)}</div>`,
      name: h.name,
      meta: `<span class="el-chip" style="--ec:${E.color}"><img src="assets/el-${h.el}.svg" alt="">${E.name}</span><span class="role-chip">${ROLES[h.role].name}</span>${r.isNew ? '<span class="rv__new">NEW</span>' : `<span class="rv__dup">잠재 ${r.pot} · 증표 +${r.tokens}</span>`}`,
      quote: `“${esc(h.quote)}”`, hold: r.rarity >= 6 ? 0 : 4200, sound: r.rarity >= 6 ? 'ult' : 'select' });
  }

  // ---------------- skins ----------------
  playSkins(res) {
    const items = res.map(r => {
      const sk = SKIN_MAP[r.id], T = SKIN_TIERS[r.tier], h = HERO_MAP[sk.hero];
      const lvl = r.tier >= 5 ? 3 : r.tier >= 4 ? 2 : r.tier >= 3 ? 1 : 0;
      return { c: SKIN_C[r.tier], lvl, reveal: r.tier >= 3 ? () => this.skinReveal(r) : null,
        html: `<div class="sc" data-l="${lvl}" data-t="${r.tier}"><div class="sc__art sc__art--skin" style="background-image:linear-gradient(160deg, ${sk.p[2]}cc, ${sk.p[1]}aa 45%, ${sk.p[0]}ee), url(${this.app.portraits[sk.hero]})"></div>${r.dup ? '' : '<span class="sc__new">NEW</span>'}<div class="sc__txt"><em>${T.name}</em><b>${esc(sk.concept)}</b><small>${esc(h.name)}${r.dup ? ` · 빛조각 +${r.shards}` : ''}</small></div></div>` };
    });
    return this.run(items, 'skin');
  }
  async skinReveal(r) {
    const sk = SKIN_MAP[r.id], T = SKIN_TIERS[r.tier], h = HERO_MAP[sk.hero];
    let img = this.app.portraits[sk.hero]; try { img = renderSplash(h, 520, 760, sk.id); } catch (e) { }
    await this.showReveal({ c1: SKIN_C[r.tier], c2: sk.p[2], hc: sk.p[4], r: r.tier >= 5 ? 6 : 5, img,
      top: `<div class="rv__tier" style="--tc:${T.color}">${T.name} 스킨</div><div class="rv__title">${esc(h.name)} · ${esc(h.title)}</div>`,
      name: sk.concept,
      meta: `${sk.acc.map(a => `<span class="role-chip">${PIECE_NAMES[a] || a}</span>`).join('')}${r.dup ? `<span class="rv__dup">중복 · 빛조각 +${r.shards}</span>` : '<span class="rv__new">NEW</span>'}`,
      quote: `스킬 이펙트가 <b style="color:${sk.p[4]}">이 스킨의 빛깔</b>로 바뀌어요.`, hold: r.tier >= 5 ? 0 : 4200, sound: r.tier >= 5 ? 'ult' : 'select', skin: true });
  }

  async showReveal(o) {
    const box = $('pull-reveal');
    box.style.setProperty('--c1', o.c1); box.style.setProperty('--c2', o.c2); box.style.setProperty('--hc', o.hc);
    box.dataset.r = o.r; box.classList.toggle('is-skin', !!o.skin);
    box.innerHTML = `<div class="rv__bg"></div><div class="rv__rays"></div><div class="rv__sweep"></div>
      <img class="rv__art" src="${o.img}" alt="">
      <div class="rv__text">${o.top}<div class="rv__name">${esc(o.name)}</div><div class="rv__meta">${o.meta}</div><p class="rv__quote">${o.quote}</p></div>
      <div class="rv__tap">화면을 눌러 계속</div>`;
    box.hidden = false;
    box.classList.remove('is-go'); void box.offsetWidth; box.classList.add('is-go');
    this.app.audio.play(o.sound);
    await wait(450);
    await this.tap(o.hold);
    box.hidden = true;
  }
}
