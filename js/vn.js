// Story scene player: portraits on either side, a name plate, typed-out lines.
// Click / tap / Space / Enter advances (finishes the line first if it is still typing).
// Esc or the skip button ends the scene.
import { HERO_MAP } from './heroes.js';
import { SPEAKERS } from './story.js';
import { getMap } from './map.js';
import { renderBusts } from './stage.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class StoryPlayer {
  constructor(app) {
    this.app = app; this.busts = {};
    const el = document.createElement('section');
    el.id = 'vn'; el.className = 'vn'; el.hidden = true;
    el.innerHTML = `
      <div class="vn__bg"></div><div class="vn__grain"></div>
      <div class="vn__card" id="vn-card"><small id="vn-sub"></small><h2 id="vn-title"></h2></div>
      <img class="vn__bust vn__bust--l" id="vn-l" alt=""><img class="vn__bust vn__bust--r" id="vn-r" alt="">
      <div class="vn__box" id="vn-box">
        <div class="vn__name" id="vn-name"></div>
        <p class="vn__text" id="vn-text"></p>
        <span class="vn__next" id="vn-next">▼</span>
      </div>
      <div class="vn__ctrl"><button id="vn-auto" type="button">자동</button><button id="vn-log-btn" type="button">기록</button><button id="vn-skip" type="button">건너뛰기</button></div>
      <div class="vn__log" id="vn-log" hidden><div class="vn__login" id="vn-login"></div><button type="button" id="vn-log-close">닫기</button></div>`;
    document.body.appendChild(el);
    this.el = el;
    el.addEventListener('click', (e) => {
      if (e.target.closest('.vn__ctrl, .vn__log')) return;
      this.advance();
    });
    $('vn-skip').addEventListener('click', () => this.finish());
    $('vn-auto').addEventListener('click', () => { this.auto = !this.auto; $('vn-auto').classList.toggle('is-on', this.auto); if (this.auto && !this.typing) this.queueAuto(); });
    $('vn-log-btn').addEventListener('click', () => { $('vn-login').innerHTML = this.log.map(([n, t]) => `<p>${n ? `<b>${esc(n)}</b>` : ''}${esc(t)}</p>`).join(''); $('vn-log').hidden = false; });
    $('vn-log-close').addEventListener('click', () => { $('vn-log').hidden = true; });
    addEventListener('keydown', (e) => {
      if (this.el.hidden) return;
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); e.stopPropagation(); this.advance(); }
      else if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); if (!$('vn-log').hidden) $('vn-log').hidden = true; else this.finish(); }
    }, true);
  }

  ensureBusts(ids) {
    const need = ids.filter(id => HERO_MAP[id] && !this.busts[id]);
    if (need.length) Object.assign(this.busts, renderBusts(need.map(id => HERO_MAP[id])));
  }

  // script: { lines, bg?, title?, sub? }
  play(script, { title = '', sub = '', bg, onDone } = {}) {
    const lines = script.lines || [];
    if (!lines.length) { onDone?.(); return; }
    this.ensureBusts([...new Set(lines.map(l => l[0]))]);
    this.lines = lines; this.i = -1; this.onDone = onDone; this.log = []; this.sides = {}; this.lastSide = 'r';
    this.paintBg(bg || script.bg);
    $('vn-l').className = 'vn__bust vn__bust--l'; $('vn-r').className = 'vn__bust vn__bust--r'; $('vn-l').removeAttribute('src'); $('vn-r').removeAttribute('src');
    $('vn-text').textContent = ''; $('vn-name').textContent = ''; $('vn-box').classList.remove('is-narr');
    $('vn-log').hidden = true; $('vn-card').classList.remove('is-on'); clearTimeout(this.cardT);
    this.el.hidden = false;
    try { document.exitPointerLock?.(); } catch (e) { }
    if (title) {
      $('vn-title').textContent = title; $('vn-sub').textContent = sub;
      $('vn-card').classList.add('is-on'); this.card = true;
      clearTimeout(this.cardT); this.cardT = setTimeout(() => { if (this.card) this.advance(); }, 1800);
    } else { this.card = false; this.advance(); }
  }

  paintBg(mapId) {
    let sky = ['#0c0a10', '#1c1620', '#3a2a24'];
    try { const th = getMap(mapId || 'sanctum').theme; sky = th.sky; } catch (e) { }
    this.el.querySelector('.vn__bg').style.background =
      `radial-gradient(120% 80% at 50% 110%, ${sky[2]} 0%, transparent 60%), linear-gradient(180deg, ${sky[0]} 0%, ${sky[1]} 70%, ${sky[2]} 130%)`;
  }

  advance() {
    if (this.el.hidden) return;
    if (this.card) { this.card = false; $('vn-card').classList.remove('is-on'); clearTimeout(this.cardT); }
    if (this.typing) { this.finishTyping(); return; }
    clearTimeout(this.autoT);
    this.i++;
    if (this.i >= this.lines.length) { this.finish(); return; }
    const [who, text] = this.lines[this.i];
    const h = HERO_MAP[who], sp = SPEAKERS[who];
    const name = h ? h.name : sp ? sp.name : who;
    const box = $('vn-box');
    box.classList.toggle('is-narr', who === 'narr');
    $('vn-name').textContent = name; $('vn-name').style.setProperty('--c', h ? h.color : '#c9b89a');
    this.log.push([who === 'narr' ? '' : name, text]);
    if (h) {
      // a speaker keeps the side they first appeared on; new speakers take the other side
      let side = this.sides[who];
      if (!side) { side = this.lastSide === 'l' ? 'r' : 'l'; this.sides[who] = side; }
      this.lastSide = side;
      const img = $(side === 'l' ? 'vn-l' : 'vn-r'), other = $(side === 'l' ? 'vn-r' : 'vn-l');
      if (img.dataset.who !== who) { img.dataset.who = who; img.src = this.busts[who] || ''; img.classList.remove('is-in'); void img.offsetWidth; img.classList.add('is-in'); }
      img.classList.add('is-on'); img.classList.remove('is-dim');
      if (other.getAttribute('src')) { other.classList.add('is-dim'); other.classList.remove('is-on'); }
    } else {
      for (const id of ['vn-l', 'vn-r']) if ($(id).getAttribute('src')) $(id).classList.add('is-dim');
    }
    this.type(text);
  }

  type(text) {
    const el = $('vn-text'); el.textContent = '';
    this.full = text; this.typing = true; $('vn-next').hidden = true;
    let n = 0; const step = () => {
      n += 2; el.textContent = text.slice(0, n);
      if (n >= text.length) { this.finishTyping(); return; }
      this.typeT = setTimeout(step, 28);
    };
    step();
  }
  finishTyping() {
    clearTimeout(this.typeT); this.typing = false;
    $('vn-text').textContent = this.full; $('vn-next').hidden = false;
    if (this.auto) this.queueAuto();
  }
  queueAuto() { clearTimeout(this.autoT); this.autoT = setTimeout(() => this.advance(), 1200 + (this.full || '').length * 45); }

  finish() {
    if (this.el.hidden) return;
    clearTimeout(this.typeT); clearTimeout(this.autoT); clearTimeout(this.cardT);
    this.typing = false; this.el.hidden = true; this.card = false; $('vn-card').classList.remove('is-on');
    const cb = this.onDone; this.onDone = null; cb?.();
  }
}
