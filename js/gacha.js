import { HERO_MAP, ROLES } from './heroes.js';
import { ELEMENTS } from './elements.js';
import { renderSplash } from './stage.js';

// Recruitment show, in the spirit of Arknights' headhunting:
//  1. a sealed rune capsule falls and cracks open in the colour of the best result
//  2. (10 pulls) slim cards slide in and flip one by one
//  3. each ★5/★6 (and every new hero) gets a full-screen reveal
//  4. summary
const $ = (id) => document.getElementById(id);
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const RC = { 6: ['#ff9a3a', '#ffe0a0'], 5: ['#ffd76a', '#fff4d0'], 4: ['#a98aff', '#e8dcff'], 3: ['#8a8078', '#d8d0c8'] };
const stars = (n) => '★'.repeat(n);

export class GachaShow {
  constructor(app) {
    this.app = app;
    this.root = $('pullres');
    this.skip = false;
    $('btn-pull-skip').addEventListener('click', (e) => { e.stopPropagation(); this.skip = true; this._tap?.(); });
    this.root.addEventListener('pointerdown', () => this._tap?.());
  }
  tap(ms = 0) {
    // resolves on a tap (or after ms if given)
    return new Promise(res => {
      let t = null;
      this._tap = () => { clearTimeout(t); this._tap = null; res(); };
      if (ms) t = setTimeout(() => { this._tap = null; res(); }, ms);
    });
  }
  async play(res) {
    const app = this.app, A = app.audio;
    const R = this.root;
    this.skip = false;
    const top = Math.max(...res.map(r => r.rarity));
    const [c1, c2] = RC[top];
    R.style.setProperty('--c1', c1); R.style.setProperty('--c2', c2);
    R.className = 'gacha is-drop'; R.dataset.top = top;
    R.hidden = false;
    $('pull-reveal').hidden = true; $('pull-cards').innerHTML = ''; $('btn-pull-ok').hidden = true;
    $('gacha-hint').textContent = '';
    // ---- 1. the seal falls ----
    A.play('bell');
    await this.tap(1150);
    if (!this.skip) {
      R.classList.add('is-crack');
      A.play(top >= 6 ? 'ult' : top === 5 ? 'win' : 'select');
      await this.tap(top >= 5 ? 1250 : 800);
    }
    R.classList.remove('is-drop', 'is-crack');
    // ---- 2. cards ----
    const cards = $('pull-cards');
    cards.classList.toggle('is-one', res.length === 1);
    cards.innerHTML = res.map((r, i) => {
      if (!r.id) return `<div class="gcard" data-r="3" style="--i:${i}"><div class="gcard__in"><div class="gcard__face gcard__face--ember"><b>잔불</b><small>증표 +${r.tokens}</small></div><div class="gcard__back"></div></div></div>`;
      const h = HERO_MAP[r.id];
      return `<div class="gcard" data-r="${r.rarity}" style="--i:${i}"><div class="gcard__in"><div class="gcard__face" style="background-image:url(${app.portraits[r.id]})">${r.isNew ? '<span class="gcard__new">NEW</span>' : ''}<img class="gcard__el" src="assets/el-${h.el}.svg" alt=""><span class="gcard__stars">${stars(r.rarity)}</span><b>${h.name}</b><small>${r.isNew ? h.title : `잠재 ${r.pot} · 증표 +${r.tokens}`}</small></div><div class="gcard__back"></div></div></div>`;
    }).join('');
    R.classList.add('is-cards');
    const list = [...cards.children];
    if (!this.skip) await this.tap(res.length === 1 ? 250 : 650 + res.length * 60);
    for (let i = 0; i < list.length; i++) {
      const c = list[i], r = res[i];
      if (!this.skip) {
        c.classList.add('is-open');
        A.play(r.rarity >= 6 ? 'win' : r.rarity === 5 ? 'heal' : 'tick');
        await this.tap(r.rarity >= 5 ? 380 : 150);
      } else c.classList.add('is-open');
    }
    // ---- 3. reveals ----
    const shows = res.filter(r => r.id && (r.rarity >= 5 || r.isNew));
    for (const r of shows) {
      if (this.skip) break;
      await this.reveal(r);
    }
    // ---- 4. summary ----
    $('pull-reveal').hidden = true;
    R.classList.add('is-sum');
    $('btn-pull-ok').hidden = false;
    $('gacha-hint').textContent = '';
    this._tap = null;
  }
  async reveal(r) {
    const h = HERO_MAP[r.id], E = ELEMENTS[h.el];
    const box = $('pull-reveal');
    const [c1, c2] = RC[r.rarity];
    box.style.setProperty('--c1', c1); box.style.setProperty('--c2', c2); box.style.setProperty('--hc', h.color);
    box.dataset.r = r.rarity;
    let img = this.app.portraits[r.id];
    try { img = renderSplash(h); } catch (e) { }
    box.innerHTML = `
      <div class="rv__bg"></div><div class="rv__rays"></div>
      <img class="rv__art" src="${img}" alt="">
      <div class="rv__text">
        <div class="rv__stars">${Array.from({ length: r.rarity }, (_, i) => `<i style="--d:${0.55 + i * 0.12}s">★</i>`).join('')}</div>
        <div class="rv__title">${h.title}</div>
        <div class="rv__name">${h.name}</div>
        <div class="rv__meta"><span class="el-chip" style="--ec:${E.color}"><img src="assets/el-${h.el}.svg" alt="">${E.name}</span><span class="role-chip">${ROLES[h.role].name}</span>${r.isNew ? '<span class="rv__new">NEW</span>' : `<span class="rv__dup">잠재 ${r.pot} · 증표 +${r.tokens}</span>`}</div>
        <p class="rv__quote">“${h.quote}”</p>
      </div>
      <div class="rv__tap">화면을 눌러 계속</div>`;
    box.hidden = false;
    box.classList.remove('is-go'); void box.offsetWidth; box.classList.add('is-go');
    this.app.audio.play(r.rarity >= 6 ? 'ult' : 'select');
    await wait(450);
    await this.tap(r.rarity >= 6 ? 0 : 4200);
    box.hidden = true;
  }
}
