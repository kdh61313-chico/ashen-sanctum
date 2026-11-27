import * as THREE from 'three';
import { HERO_MAP, SLOTS, SLOT_KEYS, ULT_COST } from './heroes.js';
import { statusMods, ROUNDS_TO_WIN } from './sim.js';
import { buildHero, animateHero, triggerAttack, triggerHurt, triggerCheer, triggerSpawn, ownMaterials, setOpacity, attackDur, optimizeHero } from './models.js';
import { Trail } from './fx.js';
import { ViewModel } from './viewmodel.js';
import { skinFx } from './skins.js';
import { icon } from './icons.js';
import { ELEMENTS, matchup } from './elements.js';
import { effLmb } from './heroes.js';
import { moveCharacter, applyMoveAbility, MOVE_KINDS, EYE, losClear, fwdFromYaw, dirFromAngles, raycast } from './physics.js';

const $ = (id) => document.getElementById(id);
const ST_NAMES = { silence: '침묵', sleep: '수면', vuln: '취약', thorns: '가시', guard: '수호', empower: '강화 대기', reflect: '반사', wither: '치유 감소', stun: '기절', root: '속박', slow: '둔화', poison: '중독', burn: '화상', invis: '은신', undying: '불사', giant: '거대화', haste: '가속', dr: '피해 감소', block: '방벽', invuln: '무적', dmgUp: '강화', atkSpd: '광폭', steal: '흡혈' };
const NEG = new Set(['stun', 'root', 'slow', 'poison', 'burn']);

export class Game {
  constructor(app, o) {
    this.app = app;
    this.role = o.role; // 'offline' | 'host' | 'client'
    this.sim = o.sim || null;
    this.net = o.net || null;
    this.localId = o.localId;
    this.training = !!o.training;
    this.scene = app.gameScene;
    this.camera = app.camera;
    this.fx = app.fx;
    this.audio = app.audio;
    this.view = new Map();     // id -> view player
    this.roster = new Map(); this.skinCol = new Map();   // id -> {name, team, hero, isBot}
    this.ents = new Map();     // id -> render entity
    this.projs = []; this.zones = [];
    this.phase = 'pre'; this.phaseT = 4; this.round = 1; this.score = [0, 0];
    this.clock = 0; this.acc = 0; this.snapT = 0; this.sendT = 0;
    this.body = { pos: [0, 0, 0], vel: [0, 0, 0], onGround: true, dashT: 0, dashV: [0, 0, 0], glideUntil: 0 };
    this.yaw = 0; this.pitch = 0;
    this.cds = { lmb: 0, q: 0, e: 0 };
    this.charging = false; this.charge = 0;
    this.shakeAmt = 0;
    this.spectIdx = 0;
    this.lastHp = null;
    this.stepDist = 0;
    this.ended = false;
    this.losT = 0;
    this.fxCtx = {
      view: this.view,
      shake: (pos, amt) => { const d = Math.hypot(pos[0] - this.camera.position.x, pos[2] - this.camera.position.z); this.shakeAmt = Math.max(this.shakeAmt, amt * Math.max(0, 1 - d / 30)); },
      buffFx: (e) => { const v = this.view.get(e.id); if (v) this.fx.P.emit([v.pos[0], v.pos[1] + 1, v.pos[2]], { n: 26, c: e.color, c2: '#ffffff', sp: 1.2, up: 2.2, s: 0.18, life: 0.9, spread: [0.4, 0.8, 0.4] }); },
      blockFx: (e) => { const v = this.view.get(e.id); if (v) { const [fx, fz] = fwdFromYaw(v.yaw); this.fx.P.emit([v.pos[0] + fx * 0.8, v.pos[1] + 1.2, v.pos[2] + fz * 0.8], { n: 12, c: '#ff3b3b', c2: '#ffffff', sp: 3, s: 0.15, life: 0.3 }); } },
    };
    this.vm = new ViewModel(app.vmScene, app.vmCam, this.camera);
    this.horde = !!o.horde; this.localStats = { skill: 0, ult: 0 };
    this.ammo = 0; this.reloadT = 0; this.combo = 0; this.lastAtk = -9; this.lastShot = -9;
    this._v3 = new THREE.Vector3(); this._v3b = new THREE.Vector3();
    this.plates = $('plates');
    this.dmgLayer = $('dmgnums');
    if (o.roster) this.setRoster(o.roster);
    if (this.sim) this.syncFromSim();
    const me = this.roster.get(this.localId);
    this.setLocalHero(me ? me.hero : 'valok');
    this.buildHud();
    $('train-tip').hidden = !this.training;
    if (this.training) this.phase = 'train';
  }

  // ---------- roster / view ----------
  // effect colour for a player: the skin's colour from 영웅 tier up, otherwise the hero's
  colOf(id, heroId) { return this.skinCol.get(id)?.c || HERO_MAP[heroId || this.roster.get(id)?.hero]?.color || '#ffffff'; }
  setRoster(list) {
    const ids = new Set();
    for (const r of list) {
      ids.add(r.id);
      const prev = this.roster.get(r.id);
      this.roster.set(r.id, r);
      { const sf = r.skin ? skinFx(r.skin) : null; if (sf) this.skinCol.set(r.id, sf); else this.skinCol.delete(r.id); }
      if (!prev && r.id === this.localId && r.skin && this.vm?.skin !== r.skin) this.setLocalHero(r.hero);
      if (prev && (prev.hero !== r.hero || (prev.skin || null) !== (r.skin || null))) { const e = this.ents.get(r.id); if (e) { this.scene.remove(e.P.root); e.plate?.remove(); this.ents.delete(r.id); } if (r.id === this.localId) this.setLocalHero(r.hero); }
    }
    for (const id of [...this.roster.keys()]) if (!ids.has(id)) { this.roster.delete(id); this.view.delete(id); const e = this.ents.get(id); if (e) { this.scene.remove(e.P.root); e.plate?.remove(); this.ents.delete(id); } }
    this.hudHeadsDirty = true;
  }

  syncFromSim() {
    const sim = this.sim;
    if (!this.rosterSig || this.rosterSig !== sim.players.size + ':' + [...sim.players.values()].map(p => p.hero + p.isBot + (p.skin || '')).join()) {
      this.rosterSig = sim.players.size + ':' + [...sim.players.values()].map(p => p.hero + p.isBot + (p.skin || '')).join();
      this.setRoster(sim.roster());
    }
    for (const p of sim.players.values()) this.view.set(p.id, p);
    this.phase = sim.phase; this.phaseT = sim.phaseT; this.round = sim.round; this.score = sim.score;
    this.projs = sim.projs.map(pr => ({ id: pr.id, look: pr.look, pos: pr.pos, vel: pr.vel, owner: pr.owner }));
    this.zones = sim.zones.map(z => ({ id: z.id, owner: z.owner, look: z.look, pos: z.pos, r: z.r, yaw: z.yaw, t: z.t, delay: z.delay, dur: z.dur, team: z.team, w: z.def.wall?.w || 0, d: z.def.wall?.d || 0, h: z.def.h || 0 }));
  }

  applySnapshot(s) {
    this.phase = s.ph; this.phaseT = s.pt; this.round = s.rd; this.score = s.sc;
    const seen = new Set();
    for (const a of s.p) {
      const id = a[0]; seen.add(id);
      let v = this.view.get(id);
      if (!v) { v = { id, pos: [a[1], a[2], a[3]], vel: [0, 0, 0], cds: {}, stats: {} }; this.view.set(id, v); }
      v.pos = [a[1], a[2], a[3]]; v.rt = this.clock; v.yaw = a[4]; v.pitch = a[5]; v.hp = a[6]; v.alive = !!a[7]; v.ult = a[8]; v.shield = a[9];
      const st = {}; for (const k in a[10]) st[k] = { t: a[10][k][0], v: a[10][k][1] }; v.st = st;
      v.cds = { lmb: a[11], q: a[12], e: a[13] }; v.vel = [a[14], 0, a[15]]; v.onGround = !!a[16];
      v.stats = { k: a[17], d: a[18], dmg: a[19], heal: a[20] }; v.maxHp = a[21]; v.ammo = a[22]; v.reloadT = a[23]; v.rs = a[24]; v.fm = a[25]; v.sn = a[26]; v.channel = a[27];
      const r = this.roster.get(id); if (r) { v.team = r.team; v.hero = r.hero; v.name = r.name; v.isBot = r.isBot; }
    }
    const now = this.clock;
    this.projs = s.pr.map(a => ({ id: a[0], look: a[1], pos0: [a[2], a[3], a[4]], pos: [a[2], a[3], a[4]], vel: [a[6], a[7], a[8]], owner: a[9], t0: now }));
    this.zones = s.z.map(a => ({ id: a[0], look: a[1], pos: [a[2], a[3], a[4]], r: a[5], yaw: a[6], t: a[7], delay: a[8], dur: a[9], team: a[10], w: a[11], d: a[12], h: a[13], owner: a[14], t0: now }));
    // reconcile local cooldowns
    const me = this.view.get(this.localId);
    if (me) for (const k of ['lmb', 'q', 'e']) { if (Math.abs((me.cds[k] || 0) - this.cds[k]) > 0.5 && this.clock - (this.lastCast?.[k] || -9) > 0.8) this.cds[k] = me.cds[k]; }
  }

  setLocalHero(heroId) {
    this.hero = HERO_MAP[heroId];
    const sk = this.sim?.players?.get(this.localId)?.skin ?? this.roster.get(this.localId)?.skin ?? null;
    this.vm.setHero(this.hero, sk);
    this.vm.setTheme?.(this.app?.world?.theme);
    this.cds = { lmb: 0, q: 0, e: 0 };
    this.ammo = this.hero.abilities.lmb.ammo || 0; this.reloadT = 0;
    this.buildHud();
  }

  // ---------- HUD ----------
  buildHud() {
    if (!this.hero) return;
    const h = this.hero, app = this.app;
    $('me-portrait').src = app.portraits[h.id] || '';
    $('me-name').textContent = h.name;
    { const st = $('me-stars'); if (st) { st.textContent = '★'.repeat(h.rarity || 4); st.className = 'me__stars r' + (h.rarity || 4); } const ei = $('me-el'); if (ei) { ei.hidden = !h.el; if (h.el) ei.src = `assets/el-${h.el}.svg`; } }
    const ab = $('abilities'); ab.innerHTML = '';
    this.abEls = {};
    for (const s of SLOTS) {
      const d = h.abilities[s];
      const el = document.createElement('div');
      el.className = 'ab' + (s === 'x' ? ' ab--ult' : '');
      el.innerHTML = `<div class="ab__gem"><img src="${icon(d.icon, s === 'x' ? '#ffb08a' : '#efe0c0')}" alt=""><div class="ab__cd"></div><div class="ab__num"></div>${s === 'x' ? '<svg class="ab__ring" viewBox="0 0 80 80"><circle class="bg" cx="40" cy="40" r="36"/><circle class="fg" cx="40" cy="40" r="36" stroke-dasharray="226.2" stroke-dashoffset="226.2"/></svg>' : ''}</div><div class="ab__key">${SLOT_KEYS[s]}</div>`;
      el.title = d.name;
      ab.appendChild(el);
      this.abEls[s] = { el, cd: el.querySelector('.ab__cd'), num: el.querySelector('.ab__num'), ring: el.querySelector('.fg') };
    }
    const ticks = $('me-ticks'); ticks.innerHTML = '';
    for (let v = 50; v < h.hp; v += 50) { const i = document.createElement('i'); i.style.left = (v / h.hp * 100) + '%'; ticks.appendChild(i); }
    $('crosshair').classList.toggle('is-melee', h.abilities.lmb.kind === 'melee');
    this.hudHeadsDirty = true;
  }

  myTeam() { return this.roster.get(this.localId)?.team ?? 0; }
  lmbDef() { const me = this.view.get(this.localId); return effLmb(this.hero, me?.fm, me?.sn); }

  updateHud(dt) {
    const me = this.view.get(this.localId);
    const h = this.hero;
    if (!me || !h) return;
    const myTeam = this.myTeam();
    // score
    if (!this.training) {
      const mine = this.score[myTeam], theirs = this.score[1 - myTeam];
      const pips = (el, n) => { el.innerHTML = ''; for (let i = 0; i < (this.sim?.roundsToWin || this.roundsToWin || ROUNDS_TO_WIN); i++) { const p = document.createElement('i'); if (i < n) p.className = 'on'; el.appendChild(p); } };
      const sig = mine + ':' + theirs;
      if (this.pipSig !== sig) { this.pipSig = sig; pips($('pips-a'), mine); pips($('pips-b'), theirs); $('pips-a').style.visibility = $('pips-b').style.visibility = this.horde ? 'hidden' : ''; }
      let t = this.phase === 'pre' ? Math.ceil(this.phaseT) : this.phase === 'live' ? Math.max(0, Math.ceil(this.phaseT)) : 0;
      const tm = this.phase === 'pre' ? `0:0${Math.max(0, t)}` : this.phase === 'live' ? `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}` : '—';
      $('hud-timer').textContent = tm;
      $('hud-timer').classList.toggle('is-low', this.phase === 'live' && t <= 15);
      $('hud-round').textContent = this.horde ? `${this.round}웨이브` : `${this.round}라운드`;
      { let boss = null; for (const v of this.view.values()) if (v.alive !== undefined && HERO_MAP[v.hero]?.boss) boss = v;
        const bb = $('bossbar'); bb.hidden = !boss;
        if (boss) { const f = Math.max(0, boss.hp / (boss.maxHp || 1)); bb.querySelector('i').style.width = (f * 100) + '%'; const t = `${HERO_MAP[boss.hero].name}  ${Math.ceil(boss.hp)} / ${boss.maxHp}`; const b2 = bb.querySelector('b'); if (b2.textContent !== t) b2.textContent = t; bb.classList.toggle('is-enrage', f < 0.3); } }
      if (this.horde) { $('hud-timer').textContent = `${this.score[0]}`; $('hud-timer').classList.remove('is-low'); }
      // heads
      const heads = (el, team) => {
        const list = [...this.roster.values()].filter(r => r.team === team);
        if (this.hudHeadsDirty || el.childElementCount !== list.length) {
          el.innerHTML = '';
          for (const r of list) { const img = document.createElement('img'); img.src = this.app.portraits[r.hero]; img.dataset.id = r.id; img.title = r.name; el.appendChild(img); }
        }
        for (const img of el.children) { const v = this.view.get(img.dataset.id); img.classList.toggle('dead', !!v && !v.alive); }
      };
      heads($('heads-a'), myTeam); heads($('heads-b'), 1 - myTeam);
      this.hudHeadsDirty = false;
    }
    document.querySelector('.hud__score').style.display = this.training ? 'none' : '';
    // hp
    const max = me.maxHp || h.hp;
    const f = Math.max(0, me.hp / max);
    $('me-hp').style.width = (f * 100) + '%';
    $('me-hp').classList.toggle('is-low', f < 0.3);
    const sh = Math.min(1 - f, (me.shield || 0) / max);
    $('me-shield').style.left = (f * 100) + '%'; $('me-shield').style.width = (Math.max(0, (me.shield || 0) / max) * 100) + '%';
    $('me-hpnum').textContent = Math.ceil(Math.max(0, me.hp));
    $('me-hpmax').textContent = '/ ' + max;
    const sts = Object.keys(me.st || {}).filter(k => ST_NAMES[k]).map(k => ST_NAMES[k]);
    $('me-status').textContent = sts.join(' · ');
    // abilities
    for (const s of ['lmb', 'q', 'e']) {
      const e = this.abEls[s]; if (!e) continue;
      const d = h.abilities[s];
      const cd = this.cds[s];
      const full = s === 'lmb' ? d.cd : d.cd;
      e.cd.style.setProperty('--p', cd > 0 ? ((cd / full) * 100) + '%' : '0%');
      e.num.textContent = cd > 0.05 && s !== 'lmb' ? (cd < 1 ? cd.toFixed(1) : Math.ceil(cd)) : '';
      const ready = cd <= 0.05;
      if (ready && e.wasCd && s !== 'lmb') { e.el.classList.remove('is-flash'); void e.el.offsetWidth; e.el.classList.add('is-flash'); }
      e.wasCd = !ready;
      e.el.classList.toggle('is-ready', ready);
    }
    if (this.app.input.touch) {
      for (const [k, id] of [['q', 't-q'], ['e', 't-e']]) { const b = $(id); const cd = this.cds[k]; const txt = cd > 0.05 ? (cd < 1 ? cd.toFixed(1) : Math.ceil(cd)) : k.toUpperCase(); if (b.textContent !== String(txt)) b.textContent = txt; b.classList.toggle('is-cd', cd > 0.05); }
      const bx = $('t-x'), u = Math.floor(Math.min(100, me.ult || 0)); const tx = u >= 100 ? 'X' : u + '%'; if (bx.textContent !== tx) bx.textContent = tx; bx.classList.toggle('is-ready-ult', u >= 100);
    }
    const ue = this.abEls.x;
    if (ue) {
      const u = Math.min(ULT_COST, me.ult || 0);
      ue.ring.setAttribute('stroke-dashoffset', String(226.2 * (1 - u / ULT_COST)));
      ue.num.textContent = Math.floor(u) + '%';
      const ready = u >= ULT_COST - 0.5;
      if (ready && !this.ultWasReady && this.phase !== 'pre') this.audio.play('ultReady');
      this.ultWasReady = ready;
      ue.el.classList.toggle('is-ready', ready);
    }
    // ammo
    // transformations / stances swap the left-click ability
    const key = (me.fm || '') + '|' + (me.sn || '');
    if (key !== this._lmbKey) {
      const prevKey = this._lmbKey; this._lmbKey = key;
      const ld = this.lmbDef(), e = this.abEls.lmb;
      if (e) { e.el.querySelector('img').src = icon(ld.icon, me.fm || me.sn ? '#ffcf8a' : '#efe0c0'); e.el.title = ld.name; e.el.classList.toggle('is-alt', !!(me.fm || me.sn)); }
      if (prevKey !== undefined) { this.ammo = ld.ammo || 0; this.reloadT = 0; this.cds.lmb = 0; }
      $('crosshair').classList.toggle('is-melee', ld.kind === 'melee');
    }
    { const R = h.passive?.res, el = $('me-res');
      if (el) { el.hidden = !R; if (R) { el.style.setProperty('--c', R.color); el.querySelector('i').style.width = Math.min(100, (me.rs || 0) / R.max * 100) + '%'; const t = `${R.name} ${R.max <= 10 ? Math.floor(me.rs || 0) + '/' + R.max : Math.floor(me.rs || 0)}`; const b = el.querySelector('b'); if (b.textContent !== t) b.textContent = t; } } }
    const lmbd = this.lmbDef();
    const am = $('ammo');
    am.hidden = !lmbd.ammo;
    if (lmbd.ammo) {
      $('ammo-num').textContent = me.st?.infAmmo ? '∞' : this.ammo;
      $('ammo-max').textContent = '/ ' + lmbd.ammo;
      am.classList.toggle('is-reloading', this.reloadT > 0);
      am.classList.toggle('is-low', this.ammo <= Math.ceil(lmbd.ammo * 0.25));
      if (this.app.input.touch) { const tr = $('t-r'); if (tr) tr.hidden = false; }
    } else if (this.app.input.touch) { const tr = $('t-r'); if (tr) tr.hidden = true; }
    // charge
    const cb = $('chargebar');
    cb.classList.toggle('is-on', this.charging);
    if (this.charging) cb.firstElementChild.style.width = (this.charge * 100) + '%';
    // vignette
    const vg = $('vignette');
    const lowv = f < 0.3 && me.alive ? 0.45 + Math.sin(this.clock * 5) * 0.15 : 0;
    this.hurtV = Math.max(0, (this.hurtV || 0) - dt * 2.5);
    vg.style.opacity = Math.max(lowv, this.hurtV, me.alive ? 0 : 0.6);
    // spectate
    const sp = $('spectate');
    if (!me.alive) {
      sp.hidden = false;
      const t = this.spectTarget ? this.roster.get(this.spectTarget.id) : null;
      sp.innerHTML = this.training ? '곧 부활해요' : (t ? `관전 중 · ${t.name}<small>좌클릭으로 다른 아군 보기</small>` : '쓰러졌어요');
    } else sp.hidden = true;
  }

  announce(main, sub = '', color = null, dur = 2.2) {
    const el = $('announce');
    el.querySelector('.announce__main').textContent = main;
    el.querySelector('.announce__sub').textContent = sub;
    el.style.setProperty('--ac', color || 'rgba(179,38,46,.6)');
    el.classList.add('is-on');
    clearTimeout(this.annT);
    this.annT = setTimeout(() => el.classList.remove('is-on'), dur * 1000);
  }

  killfeed(e) {
    const kf = $('killfeed');
    const vr = this.roster.get(e.id), kr = e.by ? this.roster.get(e.by) : null;
    const my = this.myTeam();
    const cls = (r, id) => id === this.localId ? 'me' : (r && r.team === my ? 'ally' : 'enemy');
    const row = document.createElement('div'); row.className = 'kf';
    row.innerHTML = (kr ? `<img src="${this.app.portraits[kr.hero]}"><span class="${cls(kr, e.by)}">${esc(kr.name)}</span>` : '') + `<span class="kf__x"></span><img src="${this.app.portraits[vr?.hero]}"><span class="${cls(vr, e.id)}">${esc(vr?.name || '')}</span>`;
    kf.prepend(row);
    while (kf.childElementCount > 5) kf.lastElementChild.remove();
    setTimeout(() => row.remove(), 6000);
  }

  floatNum(pos, text, cls, color = null) {
    const v = new THREE.Vector3(pos[0], pos[1] + 0.6, pos[2]).project(this.camera);
    if (v.z > 1) return;
    const el = document.createElement('div');
    el.className = 'dmg ' + (cls || '');
    el.textContent = text;
    if (color) el.style.color = color;
    el.style.left = ((v.x * 0.5 + 0.5) * innerWidth + (Math.random() - 0.5) * 30) + 'px';
    el.style.top = ((-v.y * 0.5 + 0.5) * innerHeight) + 'px';
    this.dmgLayer.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }

  hitmark(kind) {
    const h = $('hitmark');
    h.className = 'hitmark';
    void h.offsetWidth;
    h.className = 'hitmark is-hit' + (kind ? ' is-' + kind : '');
  }

  // ---------- events ----------
  soundAt(name, pos) {
    if (!pos) return this.audio.play(name);
    const c = this.camera.position;
    const dx = pos[0] - c.x, dz = pos[2] - c.z;
    const d = Math.hypot(dx, dz);
    const [fx, fz] = fwdFromYaw(this.yaw);
    const rx = -fz, rz = fx;
    const pan = d > 0.5 ? (dx * rx + dz * rz) / d : 0;
    this.audio.play(name, d, pan * 0.8);
  }

  castSound(heroId, slot, pos) {
    const d = HERO_MAP[heroId]?.abilities[slot]; if (!d) return;
    let s = 'magic';
    switch (d.kind) {
      case 'melee': s = d.look === 'flame' ? 'fire' : (d.range > 3.2 || d.cd > 0.8 ? 'heavySwing' : 'swing'); break;
      case 'proj': s = ({ bullet: 'gun', shadowbullet: 'gun', pellet: 'shotgun', grenade: 'thump', bomb: 'thump', bigbomb: 'thump', plasma: 'cannon', icicle: 'ice', bloodorb: 'dark', tentacle: 'dark', needle: 'swing', fireball: 'fire', arrow: 'arrow', feather: 'arrow', reaper: 'dark', flask: 'poison', hook: 'heavySwing', bloodspear: 'dark', shuriken: 'swing', mirrorblade: 'swing', void: 'dark' })[d.look] || 'magic'; break;
      case 'beam': s = d.look === 'bullet' ? 'gun' : (d.look === 'silver' || d.look === 'runebullet' || d.look === 'execution') ? 'rifle' : (d.look === 'lightning' || d.look === 'chain' ? 'zap' : 'magic'); break;
      case 'deadeye': s = 'rifle'; break;
      case 'dash': case 'leap': case 'launch': case 'glide': case 'grapple': s = 'dash'; break;
      case 'blink': s = 'blink'; break;
      case 'buff': s = 'shield'; break;
      case 'aoe': s = d.heal ? 'heal' : (d.look === 'breath' ? 'fire' : 'boom'); break;
      case 'zone': s = ({ firewall: 'fire', meteor: 'fire', blizzard: 'ice', storm: 'thunder', miasma: 'poison', bloodfeast: 'dark', rift: 'dark', collapse: 'dark' })[d.look] || 'magic'; break;
      case 'trap': s = 'ice'; break;
    }
    this.soundAt(s, pos);
    if (slot === 'x') this.soundAt('ult', pos);
  }

  handleEvent(e) {
    const me = this.localId;
    switch (e.t) {
      case 'tp':
        if (e.id === me) { this.body.pos = [...e.pos]; this.body.vel = [0, 0, 0]; this.body.dashT = 0; this.body.glideUntil = 0; this.yaw = e.yaw; if (!e.keep) this.pitch = 0; this.charging = false; this.vm?.blinkFx?.(); }
        { const en = this.ents.get(e.id); if (en) en.snap = true; }
        break;
      case 'imp':
        if (e.id === me) {
          const v = this.body.vel;
          v[0] += e.v[0]; v[2] += e.v[2];
          v[1] = e.setY ? Math.max(v[1], e.v[1]) : v[1] + e.v[1];
          if (e.v[1] > 0) { this.body.onGround = false; this.body.pos[1] += 0.02; }
          this.body.dashT = 0;
        }
        break;
      case 'cast': {
        const v = this.view.get(e.id);
        if (e.slot !== 'lmb') {
          const hd = HERO_MAP[e.hero], ab = hd?.abilities[e.slot];
          const at = e.from || v?.pos;
          if (at && hd) {
            if (e.id !== me) this.fx.castCircle(at, this.colOf(e.id, hd.id), e.slot === 'x');
            else if (e.slot === 'x') this.fx.runeDecal(at, 3.2, this.colOf(e.id, hd.id), 1.1, 1.2);
            if (ab && (ab.kind === 'dash' || ab.kind === 'leap' || ab.kind === 'launch' || ab.kind === 'grapple')) this.fx.dust(at, 1.3, 22);
          }
          if (e.slot === 'x' && hd) this.ultBanner(e, hd);
        }
        if (e.id !== me) {
          const en = this.ents.get(e.id);
          if (en) {
            triggerAttack(en.P, e.slot, e.combo || 0, HERO_MAP[e.hero]?.abilities?.[e.slot]?.kind || '');
            const hd = HERO_MAP[e.hero];
            if (e.slot === 'lmb' && hd?.gun && v) {
              const w = (hd.gun === 'dual' && en.P.anim.swingSide < 0) ? en.P.weaponL : en.P.weaponR;
              if (w?.muzzle) { en.P.root.updateMatrixWorld(true); w.muzzle.getWorldPosition(this._v3); this.fx.muzzle([this._v3.x, this._v3.y, this._v3.z], dirFromAngles(v.yaw, v.pitch || 0), hd.color, hd.gun === 'long' || hd.gun === 'arm'); }
            }
          }
          this.castSound(e.hero, e.slot, v?.pos);
        }
        if (e.slot === 'x' && e.id !== me && v) {
          const r = this.roster.get(e.id);
          if (r && r.team !== this.myTeam()) this.fx.flash(v.pos, HERO_MAP[e.hero].color, 30, 0.5, 14);
        }
        break;
      }
      case 'fx': {
        if (e.fx === 'flame') {
          if (e.id !== me) { const v = this.view.get(e.id), en = this.ents.get(e.id); if (v && en?.P.weaponR?.muzzle) { en.P.root.updateMatrixWorld(true); en.P.weaponR.muzzle.getWorldPosition(this._v3); this.fx.flameCone([this._v3.x, this._v3.y, this._v3.z], dirFromAngles(v.yaw, v.pitch || 0)); } }
          break;
        }
        if (e.fx === 'swing') {
          if (e.id !== me) { const v = this.view.get(e.id); if (v) { const [fx, fz] = fwdFromYaw(v.yaw); this.fx.slash([v.pos[0] + fx * 1.1, v.pos[1] + 1.2, v.pos[2] + fz * 1.1], v.yaw, this.colOf(e.id, v.hero), 1.8, 0.18, Math.random() < 0.5 ? 1 : -1); } }
          else if (e.hit) this.soundAt('hit');
          break;
        }
        try { this.fx.handle(e, this.fxCtx); } catch (err) { if (!this._fxErr) { this._fxErr = 1; console.warn('fx', e.fx, err); } }
        const p = e.pos || e.to;
        if (e.fx === 'explode') this.soundAt('boom', p);
        else if (e.fx === 'burstZone') this.soundAt(e.look === 'meteor' || e.look === 'collapse' ? 'bigboom' : (e.look === 'roots' ? 'poison' : 'boom'), p);
        else if (e.fx === 'slam' || e.fx === 'quake' || e.fx === 'dragonburst') this.soundAt('boom', p);
        else if (e.fx === 'strike') this.soundAt(e.look === 'storm' ? 'thunder' : 'magic', p);
        else if (e.fx === 'trapSnap') this.soundAt('ice', p);
        else if (e.fx === 'crit') this.audio.play('crit');
        else if (e.fx === 'healwave') this.soundAt('heal', p);
        break;
      }
      case 'dmg':
        if (e.by === me && e.id !== me) {
          this.floatNum(e.pos, e.a, (e.a >= 70 ? 'is-big' : '') + (e.eff > 0 ? ' is-up' : e.eff < 0 ? ' is-down' : '') + (e.sh ? ' is-shield' : ''), e.el ? ELEMENTS[e.el]?.color : null);

          this.hitmark(e.a >= 70 ? 'crit' : '');
          this.audio.play('hitmark');
        }
        if (e.id === me) { this.hurtV = Math.min(0.8, (this.hurtV || 0) + e.a / 120); this.audio.play('hurt'); }
        { const en = this.ents.get(e.id); if (en) { en.hurt = 0.15;
          const vv = this.view.get(e.id), att = this.view.get(e.by);
          if (vv && e.a >= 4) { let dir = 1, side = 0;
            if (att && att !== vv) { const dx = vv.pos[0] - att.pos[0], dz = vv.pos[2] - att.pos[2], l = Math.hypot(dx, dz) || 1; const [fx, fz] = fwdFromYaw(vv.yaw || 0); const f = (dx * fx + dz * fz) / l, sd = (dx * -fz + dz * fx) / l; dir = f > 0.3 ? -1 : 1; side = Math.abs(f) < 0.7 ? Math.sign(sd) : 0; }
            triggerHurt(en.P, dir, side, e.a); } } }
        this.fx.P.emit(e.pos, { n: 6, c: '#8a0a14', c2: '#ff5a5a', sp: 2.5, s: 0.12, life: 0.4, g: 8 });
        { const att = this.view.get(e.by), ar = this.roster.get(e.by);
          const col = ar ? this.colOf(e.by, ar.hero) : '#ffcf6a';
          let dir = [0, 0.4, 0];
          if (att) { const d = [e.pos[0] - att.pos[0], e.pos[1] - att.pos[1] - 1.2, e.pos[2] - att.pos[2]]; const l = Math.hypot(...d) || 1; dir = d.map(x => x / l); }
          this.fx.hitSpark(e.pos, dir, col, e.a >= 45);
          if (e.by === me && e.id !== me && this.lmbDef().kind === 'melee' && e.a >= 10) { this.vm.hitstop(e.a >= 45 ? 0.08 : 0.05); this.kick = Math.min(0.05, (this.kick || 0) + 0.02); }
        }
        break;
      case 'heal':
        if (e.id === me && e.a >= 5) this.floatNum(e.pos, '+' + e.a, 'is-heal');
        if (Math.random() < 0.5) this.fx.P.emit(e.pos, { n: 4, c: '#3aff9a', c2: '#ffffff', sp: 0.6, up: 1.2, s: 0.14, life: 0.7 });
        break;
      case 'kill': {
        this.killfeed(e);
        const col = HERO_MAP[e.hero]?.color;
        this.fx.deathFx(e.pos, col);
        if (e.id === me) { this.audio.play('death'); this.charging = false; this.spectTarget = null; }
        else if (e.by === me) { this.audio.play('kill'); this.hitmark('kill'); }
        break;
      }
      case 'round':
        this.fx.clear();
        if (e.horde) this.announce(e.boss ? `${e.n}웨이브 · 우두머리` : `${e.n}웨이브`, '심연이 몰려온다', e.boss ? 'rgba(179,38,46,.85)' : 'rgba(154,92,255,.7)', 3);
        else this.announce(`${e.n}라운드`, '준비', 'rgba(201,164,92,.6)', 3);
        this.audio.play('bell');
        this.cds = { lmb: 0, q: 0, e: 0 };
        this.hudHeadsDirty = true;
        break;
      case 'reso': {
        const mine = (e.list || []).filter(r => r.team === this.myTeam());
        if (mine.length) setTimeout(() => this.app.toast('속성 공명 · ' + mine.map(r => `${ELEMENTS[r.el].name} ${r.n}명: ${ELEMENTS[r.el].reso}`).join(' / '), 3500), 900);
        break;
      }
      case 'fight': this.announce('전투 개시', '', 'rgba(179,38,46,.8)', 1.4); this.audio.play('select'); break;
      case 'roundEnd': {
        const my = this.myTeam();
        if (e.w >= 0 && !e.horde) for (const [id, en] of this.ents) { const r = this.roster.get(id), vv = this.view.get(id); if (r && r.team === e.w && vv?.alive) triggerCheer(en.P); }
        if (e.horde) { if (e.w === 0) { this.announce('웨이브 돌파', `${e.score[0]}웨이브 클리어`, 'rgba(79,224,208,.7)', 2.5); this.audio.play('win'); } else { this.announce('전멸', `${e.score[0]}웨이브 돌파`, 'rgba(179,38,46,.8)', 3); this.audio.play('lose'); } break; }
        if (e.w < 0) this.announce('무승부', '라운드', 'rgba(201,164,92,.6)', 3);
        else if (e.w === my) { this.announce('라운드 승리', `${e.score[my]} : ${e.score[1 - my]}`, 'rgba(79,224,208,.7)', 3); this.audio.play('win'); }
        else { this.announce('라운드 패배', `${e.score[my]} : ${e.score[1 - my]}`, 'rgba(179,38,46,.8)', 3); this.audio.play('lose'); }
        break;
      }
      case 'matchEnd':
        setTimeout(() => this.app.showResults(e.w === this.myTeam(), e.score, this, { horde: !!e.horde, time: e.time, raidTime: e.raidTime }), 1200);
        this.ended = true;
        break;
      case 'respawn':
        { const en = this.ents.get(e.id); if (en) triggerSpawn(en.P); }
        if (e.id === me) this.announce('부활', '', 'rgba(79,224,208,.6)', 1);
        break;
    }
  }

  // ---------- local input / casting ----------
  tryReload(auto = false) {
    const d = this.lmbDef();
    if (!d.ammo || this.reloadT > 0 || this.ammo >= d.ammo) return;
    const me = this.view.get(this.localId); if (!me || !me.alive) return;
    this.reloadT = d.reload;
    this.vm.reload?.(d.reload);
    this.audio.play('reload');
    if (this.sim) this.sim.reload(this.localId); else this.net.send('host', { t: 'reload' });
  }

  tryCast(slot, charge = 0) {
    const me = this.view.get(this.localId);
    const def = slot === 'lmb' ? this.lmbDef() : this.hero.abilities[slot];
    if (!me || !me.alive) return false;
    if (slot !== 'lmb' && me.st?.silence) { this.deny(slot); return false; }
    if (def.cost && (me.rs || 0) < def.cost) { this.deny(slot); return false; }
    if (this.phase !== 'live' && this.phase !== 'train') return false;
    if (me.st?.stun) { this.deny(slot); return false; }
    if (slot === 'x') { if ((me.ult || 0) < ULT_COST - 0.5) { this.deny(slot); return false; } }
    else if (this.cds[slot] > 0.02) { if (slot !== 'lmb') this.deny(slot); return false; }
    if (slot === 'lmb' && def.ammo) {
      if (this.reloadT > 0) return false;
      if (this.ammo <= 0) { this.tryReload(true); return false; }
      if (!me.st?.infAmmo) this.ammo--;
      this.lastShot = this.clock;
    }
    if (slot === 'lmb') { this.combo = this.clock - this.lastAtk < Math.max(1.1, def.cd * 2.5) ? (this.combo + 1) % 3 : 0; this.lastAtk = this.clock; }
    if (slot !== 'x') {
      let cd = def.cd;
      if (slot === 'lmb' && me.st?.atkSpd) cd /= (1 + me.st.atkSpd.v);
      if (slot === 'lmb' && def.rsHaste && this.hero.passive?.res) cd *= 1 - def.rsHaste * (me.rs || 0) / this.hero.passive.res.max;
      this.cds[slot] = cd;
      this.lastCast = this.lastCast || {}; this.lastCast[slot] = this.clock;
    }
    const pre = this.body.pos.map(v => +v.toFixed(2));
    if (MOVE_KINDS.has(def.kind)) applyMoveAbility(this.body, def, this.yaw, this.pitch, this.clock);
    this.vm.attack(slot, this.combo);
    if (slot === 'q' || slot === 'e') this.localStats.skill++; else if (slot === 'x') this.localStats.ult++;
    this.castSound(this.hero.id, slot, null);
    if (slot === 'lmb' && this.hero.gun) { const mp = this.vm.muzzleWorld(); if (mp) this.fx.muzzle(mp, dirFromAngles(this.yaw, this.pitch), this.hero.color, this.hero.gun === 'long' || this.hero.gun === 'arm'); }
    if (def.look === 'flame') { const mp = this.vm.muzzleWorld() || [this.camera.position.x, this.camera.position.y - 0.3, this.camera.position.z]; this.fx.flameCone(mp, dirFromAngles(this.yaw, this.pitch)); }
    else if (def.kind === 'melee') {
      const [fx, fz] = fwdFromYaw(this.yaw);
      const c = this.camera.position;
      this.fx.slash([c.x + fx * 1.0, c.y - 0.35, c.z + fz * 1.0], this.yaw, this.hero.color, Math.min(2.2, def.range * 0.6), 0.16, this.vm.side);
    }
    if (slot === 'lmb' && def.ammo && this.ammo <= 0 && !me.st?.infAmmo) setTimeout(() => this.tryReload(true), 120);
    const aim = { yaw: +this.yaw.toFixed(4), pitch: +this.pitch.toFixed(4), charge, pre };
    if (this.sim) {
      this.pushLocalState();
      this.sim.cast(this.localId, slot, aim, true);
    } else this.net.send('host', { t: 'cast', slot, aim, pos: this.body.pos.map(v => +v.toFixed(2)) });
    if (slot === 'x' && this.sim) { /* ult resets on host */ }
    return true;
  }

  ultBanner(e, hd) {
    const el = $('ult-banner'); if (!el) return;
    const r = this.roster.get(e.id);
    const mine = e.id === this.localId, ally = r && r.team === this.myTeam();
    el.style.setProperty('--c', this.colOf(e.id, hd.id));
    el.className = 'ult-banner ' + (mine ? 'is-me' : ally ? 'is-ally' : 'is-enemy');
    el.innerHTML = `<img src="${this.app.portraits[hd.id] || ''}"><div><small>${ally ? (mine ? '궁극기' : '아군 궁극기') : '적 궁극기'} · ${esc(r?.name || hd.name)}</small><b>${esc(hd.abilities.x.name)}</b></div>`;
    void el.offsetWidth; el.classList.add('is-on');
    clearTimeout(this._ubT); this._ubT = setTimeout(() => el.classList.remove('is-on'), 2200);
    if (mine) { const f = $('ult-flash'); if (f) { f.style.setProperty('--c', hd.color); f.classList.remove('is-on'); void f.offsetWidth; f.classList.add('is-on'); } this.shakeAmt = Math.max(this.shakeAmt, 0.35); }
  }

  deny(slot) {
    const e = this.abEls?.[slot]; if (!e) return;
    e.el.classList.remove('is-deny'); void e.el.offsetWidth; e.el.classList.add('is-deny');
    this.audio.play('deny');
  }

  pushLocalState() {
    const b = this.body;
    if (this.sim) this.sim.clientState(this.localId, { pos: [...b.pos], vel: [...b.vel], yaw: this.yaw, pitch: this.pitch, onGround: b.onGround });
  }

  // ---------- main update ----------
  // host only, while its page is hidden (browsers pause drawing then): keep the match running for everyone
  netTick(dt) {
    if (this.role !== 'host' || !this.sim) return;
    this.acc += Math.min(dt, 0.5);
    while (this.acc >= 1 / 60) { this.sim.step(1 / 60); this.acc -= 1 / 60; }
    const evs = this.sim.drain();
    const out = evs.filter(e => e.t !== 'roster');
    if (out.length) this.net.broadcast({ t: 'ev', list: out });
    if (evs.some(e => e.t === 'roster')) this.net.broadcast({ t: 'roster', list: this.sim.roster() });
    const snap = this.sim.snapshot(); snap.n = this.snapSeq = (this.snapSeq || 0) + 1;
    this.net.broadcastFast ? this.net.broadcastFast(snap) : this.net.broadcast(snap);
  }

  update(dt, input) {
    this.clock += dt;
    const me = this.view.get(this.localId);
    const alive = me ? me.alive : true;
    const frozen = this.phase === 'pre' || this.phase === 'end';
    // look
    if (input.locked) {
      const sens = this.app.settings.sens * 0.0022;
      this.dYaw = input.dx * sens; this.dPitch = input.dy * sens;
      if (alive) {
        this.yaw -= input.dx * sens;
        this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch - input.dy * sens));
      } else this.spectYaw = (this.spectYaw || 0) - input.dx * sens;
    } else { this.dYaw = 0; this.dPitch = 0; }

    // movement
    const st = me?.st || {};
    const mods = statusMods(st, this.body.glideUntil > this.clock, frozen);
    if (alive && me) {
      const inp = { fwd: (input.keys.KeyW ? 1 : 0) - (input.keys.KeyS ? 1 : 0) - (input.move?.y || 0), right: (input.keys.KeyD ? 1 : 0) - (input.keys.KeyA ? 1 : 0) + (input.move?.x || 0), jump: !!input.keys.Space, yaw: this.yaw };
      const wasGround = this.body.onGround, vy = this.body.vel[1];
      let rem = dt;
      const speed = this.hero.speed * (st.giant ? 1.05 : 1);
      while (rem > 1e-4) { const s = Math.min(rem, 1 / 60); moveCharacter(this.body, inp, s, speed, mods); rem -= s; }
      if (!wasGround && this.body.onGround && vy < -6) this.audio.play('land');
      if (wasGround && !this.body.onGround && this.body.vel[1] > 5 && inp.jump) this.audio.play('jump');
      if (this.body.onGround) {
        this.stepDist += Math.hypot(this.body.vel[0], this.body.vel[2]) * dt;
        if (this.stepDist > 2.4) { this.stepDist = 0; this.audio.play('step', 0, 0); }
      }
      // abilities
      if (input.locked && !this.ended) {
        const lmb = this.lmbDef();
        if (lmb.charge) {
          if (input.mouse[0] && this.cds.lmb <= 0.02 && (this.phase === 'live' || this.phase === 'train') && !st.stun) {
            this.charging = true; this.charge = Math.min(1, this.charge + dt / lmb.charge.time);
          } else if (this.charging && !input.mouse[0]) {
            this.tryCast('lmb', this.charge); this.charging = false; this.charge = 0;
          } else if (!input.mouse[0]) { this.charging = false; this.charge = 0; }
        } else if (input.mouse[0]) this.tryCast('lmb');
        for (const s of input.pressed) {
          if (s === 'KeyQ') this.tryCast('q');
          if (s === 'KeyE') this.tryCast('e');
          if (s === 'KeyX') this.tryCast('x');
          if (s === 'KeyR') this.tryReload();
        }
      }
    } else {
      this.charging = false;
      if (input.locked && input.pressedMouse) this.spectIdx++;
    }
    for (const k of ['lmb', 'q', 'e']) if (this.cds[k] > 0) this.cds[k] = Math.max(0, this.cds[k] - dt);
    if (this.reloadT > 0) { this.reloadT -= dt; if (this.reloadT <= 0) { this.reloadT = 0; this.ammo = this.lmbDef().ammo || 0; } }
    if (me && this.clock - this.lastShot > 0.6 && this.reloadT <= 0 && me.ammo !== undefined && me.reloadT !== undefined) {
      if (me.reloadT > 0.15 && this.reloadT <= 0) this.reloadT = me.reloadT;
      else if (me.reloadT <= 0 && Math.abs(me.ammo - this.ammo) >= 2) this.ammo = me.ammo;
    }

    // simulation / networking
    if (this.sim) {
      if (alive) this.pushLocalState();
      this.acc += Math.min(dt, 0.25);
      while (this.acc >= 1 / 60) { this.sim.step(1 / 60); this.acc -= 1 / 60; }
      const evs = this.sim.drain();
      for (const e of evs) this.handleEvent(e);
      if (this.role === 'host') {
        const out = evs.filter(e => e.t !== 'roster');
        if (out.length) this.net.broadcast({ t: 'ev', list: out });
        if (evs.some(e => e.t === 'roster')) this.net.broadcast({ t: 'roster', list: this.sim.roster() });
        this.snapT += dt;
        if (this.snapT >= 0.05) { this.snapT = 0; const snap = this.sim.snapshot(); snap.n = this.snapSeq = (this.snapSeq || 0) + 1; this.net.broadcastFast ? this.net.broadcastFast(snap) : this.net.broadcast(snap); }
      }
      this.syncFromSim();
    } else {
      this.sendT += dt;
      if (this.sendT >= 1 / 30 && alive) {
        this.sendT = 0;
        const b = this.body;
        const st = { t: 'st', q: this.stSeq = (this.stSeq || 0) + 1, pos: b.pos.map(v => +v.toFixed(3)), vel: b.vel.map(v => +v.toFixed(2)), yaw: +this.yaw.toFixed(3), pitch: +this.pitch.toFixed(3), onGround: b.onGround };
        if (this.net.sendFast) this.net.sendFast('host', st); else this.net.send('host', st);
      }
      if (this.phase === 'live' || this.phase === 'pre' || this.phase === 'post') this.phaseT -= dt;
      for (const pr of this.projs) { const k = this.clock - pr.t0; pr.pos = [pr.pos0[0] + pr.vel[0] * k, pr.pos0[1] + pr.vel[1] * k, pr.pos0[2] + pr.vel[2] * k]; }
      for (const z of this.zones) { z.t += dt; }
      if (me && alive) { me.pos = [...this.body.pos]; }
    }

    // camera
    this.updateCamera(dt, me, alive);
    // entities
    this.updateEntities(dt);
    // fx
    this.fx.skinCol = this.skinCol;
    this.fx.syncProjectiles(this.projs, dt);
    this.fx.syncZones(this.zones, dt, this.myTeam());
    // viewmodel
    { const [fx, fz] = fwdFromYaw(this.yaw); this._side = this.body.vel[0] * -fz + this.body.vel[2] * fx; }
    this.fx._camQ = this.camera.quaternion;
    { const bv = this.body.vel, hs = Math.hypot(bv[0], bv[2], bv[1] * 0.5);
      if (alive && hs > 12) {
        const c = this.camera.position, col = this.hero.color, n = Math.min(4, (hs - 10) / 5 + 1) | 0;
        const L = 1 / hs;
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2, rr = 1.2 + Math.random() * 1.6;
          const [fx, fz] = [bv[0] * L, bv[2] * L];
          const px = c.x + fx * (3 + Math.random() * 4) + Math.cos(a) * rr * fz, py = c.y + Math.sin(a) * rr * 0.8, pz = c.z + fz * (3 + Math.random() * 4) - Math.cos(a) * rr * fx;
          this.fx.S.seg([px, py, pz], [px - bv[0] * 0.06, py - bv[1] * 0.06, pz - bv[2] * 0.06], { c: Math.random() < 0.5 ? '#ffffff' : col, w: 0.012, life: 0.12 });
        }
      } }
    this.vm.update(dt, { side: this._side / 6, speed: Math.hypot(this.body.vel[0], this.body.vel[2]), onGround: this.body.onGround, vy: this.body.vel[1], dYaw: this.dYaw, dPitch: this.dPitch, charge: this.charging ? this.charge : 0, alive, reloading: this.reloadT > 0 });
    this.updateHud(dt);
  }

  updateCamera(dt, me, alive) {
    const cam = this.camera;
    this.shakeAmt = Math.max(0, this.shakeAmt - dt * 2.5);
    const sh = this.shakeAmt * 0.15;
    if (alive) {
      const giant = me?.st?.giant ? 1.35 : 1;
      cam.position.set(this.body.pos[0], this.body.pos[1] + EYE * giant, this.body.pos[2]);
      cam.rotation.order = 'YXZ';
      this.kick = Math.max(0, (this.kick || 0) - dt * 0.4);
      cam.rotation.set(this.pitch + (this.kick || 0) * 0.6 + (Math.random() - 0.5) * sh * 0.5, this.yaw + (Math.random() - 0.5) * sh * 0.5, 0);
      this.vm.root.visible = true;
    } else {
      this.vm.root.visible = false;
      // spectate an ally
      const allies = [...this.view.values()].filter(v => v.alive && v.team === this.myTeam() && v.id !== this.localId);
      const t = allies.length ? allies[this.spectIdx % allies.length] : null;
      this.spectTarget = t;
      let target, yaw;
      if (t) { target = new THREE.Vector3(t.pos[0], t.pos[1] + 1.6, t.pos[2]); yaw = t.yaw + (this.spectYaw || 0); }
      else { target = new THREE.Vector3(this.body.pos[0], this.body.pos[1] + 0.8, this.body.pos[2]); yaw = this.yaw + this.clock * 0.2; }
      const [fx, fz] = fwdFromYaw(yaw);
      const want = new THREE.Vector3(target.x - fx * 4.2, target.y + 1.4, target.z - fz * 4.2);
      // keep out of walls
      const d = [want.x - target.x, want.y - target.y, want.z - target.z]; const L = Math.hypot(...d);
      const hit = raycast([target.x, target.y, target.z], d.map(x => x / L), L);
      if (hit < L) want.set(target.x + d[0] / L * (hit - 0.3), target.y + d[1] / L * (hit - 0.3), target.z + d[2] / L * (hit - 0.3));
      cam.position.lerp(want, Math.min(1, dt * 6));
      cam.lookAt(target);
    }
  }

  updateEntities(dt) {
    const myTeam = this.myTeam();
    this.losT -= dt;
    const doLos = this.losT <= 0;
    if (doLos) this.losT = 0.12;
    const camPos = [this.camera.position.x, this.camera.position.y, this.camera.position.z];
    const tmp = new THREE.Vector3();
    for (const [id, v] of this.view) {
      const r = this.roster.get(id); if (!r) continue;
      let en = this.ents.get(id);
      if (!en) {
        const P = buildHero(HERO_MAP[r.hero] || HERO_MAP.valok, r.skin || null);
        optimizeHero(P);
        ownMaterials(P);
        this.scene.add(P.root);
        const plate = document.createElement('div');
        plate.className = 'plate ' + (r.team === myTeam ? 'plate--ally' : 'plate--enemy');
        const hel = HERO_MAP[r.hero]?.el, mine = this.hero?.el;
        const mu = r.team !== myTeam && hel && mine ? matchup(mine, hel) : 1;
        const tag = mu > 1 ? '<em class="plate__mu is-up" title="내 공격이 잘 들어요">▲</em>' : mu < 1 && mu !== 0.9 ? '<em class="plate__mu is-down" title="내 공격이 덜 들어요">▼</em>' : '';
        plate.innerHTML = `<div class="plate__st"></div><div class="plate__nm">${hel ? `<img class="plate__el" src="assets/el-${hel}.svg" alt="">` : ''}${esc(r.name)}${tag}</div><div class="plate__bar"><i></i><b></b></div>`;
        this.plates.appendChild(plate);
        en = { P, plate, rpos: [...v.pos], speed: 0, vel: [0, 0, 0], snap: false, vis: true, hurt: 0, team: r.team, statusMesh: {}, trail: P.isMelee && P.weaponR?.tip ? new Trail(this.scene, this.colOf(r.id, r.hero)) : null };
        this.ents.set(id, en);
      }
      if (en.team !== r.team) { en.team = r.team; en.plate.className = 'plate ' + (r.team === myTeam ? 'plate--ally' : 'plate--enemy'); }
      const isMe = id === this.localId;
      let tgt = isMe ? this.body.pos : v.pos;
      if (!isMe && !this.sim && v.alive && v.vel && v.rt !== undefined) { const ahead = Math.min(0.12, this.clock - v.rt); tgt = [v.pos[0] + v.vel[0] * ahead, v.pos[1], v.pos[2] + v.vel[2] * ahead]; }
      const prev = [...en.rpos];
      if (en.snap || isMe) { en.rpos = [...tgt]; en.snap = false; }
      else {
        const k = 1 - Math.exp(-dt * (this.sim ? 30 : 18));
        en.rpos[0] += (tgt[0] - en.rpos[0]) * k; en.rpos[1] += (tgt[1] - en.rpos[1]) * k; en.rpos[2] += (tgt[2] - en.rpos[2]) * k;
        if (Math.hypot(tgt[0] - en.rpos[0], tgt[2] - en.rpos[2]) > 6) en.rpos = [...tgt];
      }
      const idt = 1 / Math.max(dt, 1e-3);
      const kv = Math.min(1, dt * 10);
      for (let i = 0; i < 3; i++) en.vel[i] += ((en.rpos[i] - prev[i]) * idt - en.vel[i]) * kv;
      const sp = Math.hypot(en.vel[0], en.vel[2]);
      en.speed += (sp - en.speed) * Math.min(1, dt * 10);
      const P = en.P;
      // afterimages while dashing / blinking / leaping
      if (!isMe && v.alive && !v.st?.invis && sp > 12) {
        en.ghostT = (en.ghostT || 0) - dt;
        if (en.ghostT <= 0) { en.ghostT = 0.035; this.fx.ghost([...en.rpos], (v.yaw || 0) + Math.PI, this.colOf(r.id, r.hero), 0.3, 0.55); }
      }
      P.root.position.set(en.rpos[0], en.rpos[1], en.rpos[2]);
      const yaw = isMe ? this.yaw : v.yaw;
      P.root.rotation.y = yaw + Math.PI;
      const onGround = v.onGround !== undefined ? v.onGround : true;
      const [efx, efz] = fwdFromYaw(isMe ? this.yaw : v.yaw);
      const fwdS = en.vel[0] * efx + en.vel[2] * efz, sideS = en.vel[0] * -efz + en.vel[2] * efx;
      animateHero(P, { speed: en.speed, fwd: fwdS, side: sideS, onGround: isMe ? this.body.onGround : (onGround && Math.abs(en.vel[1]) < 2.5), vy: en.vel[1], alive: v.alive, t: this.clock, pitch: v.pitch, giant: !!v.st?.giant, glide: false, aiming: false, stun: !!(v.st?.stun || v.st?.sleep) }, dt);
      if (en.trail) {
        const w = P.weaponR;
        const active = P.anim.atk < attackDur(P) && P.anim.atk > attackDur(P) * 0.2 && v.alive && !isMe;
        if (active || en.trail.fade > 0) { P.root.updateMatrixWorld(true); w.tipBase.getWorldPosition(this._v3); w.tip.getWorldPosition(this._v3b); en.trail.push(this._v3, this._v3b, active); }
      }
      // visibility
      P.root.visible = !isMe || !v.alive;
      if (isMe && v.alive) P.root.visible = false;
      const invis = !!v.st?.invis;
      const dist = Math.hypot(en.rpos[0] - camPos[0], en.rpos[2] - camPos[2]);
      let op = 1;
      if (invis) op = r.team === myTeam ? 0.35 : (dist < 5 ? 0.18 : 0.04);
      if (!v.alive) op = Math.max(0, 1 - (P.anim.dead >= 1 ? (en.deadT = (en.deadT || 0) + dt) : 0) / 3);
      else en.deadT = 0;
      setOpacity(P, Math.round(op * 20) / 20);
      if (en.hurt > 0) en.hurt -= dt;
      this.statusVisuals(en, v, dt);
      // nameplate
      const plate = en.plate;
      if (isMe || !v.alive || (invis && r.team !== myTeam)) { plate.style.display = 'none'; continue; }
      const hgt = 2.25 * (v.st?.giant ? 1.4 : 1) * ((HERO_MAP[r.hero]?.model === 'runesmith') ? 0.9 : 1);
      tmp.set(en.rpos[0], en.rpos[1] + hgt, en.rpos[2]).project(this.camera);
      if (tmp.z > 1 || Math.abs(tmp.x) > 1.1 || Math.abs(tmp.y) > 1.1) { plate.style.display = 'none'; continue; }
      if (doLos) en.vis = r.team === myTeam || losClear(camPos, [en.rpos[0], en.rpos[1] + 1.6, en.rpos[2]]);
      if (!en.vis || dist > 45) { plate.style.display = 'none'; continue; }
      plate.style.display = '';
      plate.style.left = ((tmp.x * 0.5 + 0.5) * innerWidth) + 'px';
      plate.style.top = ((-tmp.y * 0.5 + 0.5) * innerHeight) + 'px';
      const max = v.maxHp || HERO_MAP[r.hero].hp;
      const f = Math.max(0, v.hp / max);
      const bar = plate.lastElementChild;
      bar.firstElementChild.style.width = (f * 100) + '%';
      const shw = Math.min(1 - f, (v.shield || 0) / max);
      bar.lastElementChild.style.left = (f * 100) + '%'; bar.lastElementChild.style.width = (shw * 100) + '%';
      const stTxt = Object.keys(v.st || {}).filter(k => NEG.has(k) || k === 'undying' || k === 'block').map(k => ST_NAMES[k]).join(' ');
      if (plate.firstElementChild.textContent !== stTxt) plate.firstElementChild.textContent = stTxt;
      plate.style.opacity = dist > 30 ? 0.6 : 1;
    }
    for (const [id, en] of this.ents) if (!this.view.has(id) || !this.roster.has(id)) { this.scene.remove(en.P.root); en.plate.remove(); en.trail?.dispose(); this.ents.delete(id); }
  }

  statusVisuals(en, v, dt) {
    const st = v.st || {};
    const S = en.statusMesh;
    const root = en.P.root;
    const want = (key, make) => {
      if (st[key] && v.alive) { if (!S[key]) { S[key] = make(); root.add(S[key]); } S[key].visible = true; return S[key]; }
      if (S[key]) S[key].visible = false;
      return null;
    };
    const add = (c, op) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const s1 = want('stun', () => { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.07), add('#ffe08a', 1)); m.position.set(Math.cos(i * 2.1) * 0.35, 0, Math.sin(i * 2.1) * 0.35); g.add(m); } g.position.y = 2.15; return g; });
    if (s1) s1.rotation.y += dt * 5;
    want('root', () => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.06, 4, 16), add('#9fe8ff', 0.8)); m.rotation.x = Math.PI / 2; m.position.y = 0.1; return m; });
    want('block', () => { const m = new THREE.Mesh(new THREE.SphereGeometry(1.1, 16, 8, -Math.PI / 2.6, Math.PI / 1.3, Math.PI * 0.15, Math.PI * 0.6), add('#ff2a3a', 0.28)); m.position.set(0, 1.1, 0.2); return m; });
    const u = want('undying', () => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 4, 20), add('#ffd54f', 0.95)); m.rotation.x = Math.PI / 2; m.position.y = 2.35; return m; });
    if (u) u.rotation.z += dt * 2;
    want('invuln', () => { const m = new THREE.Mesh(new THREE.SphereGeometry(1.0, 14, 10), add('#ffffff', 0.12)); m.position.y = 1; return m; });
    const sh = (v.shield || 0) > 0 && v.alive;
    if (sh && !S.shield) { S.shield = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 1), add('#cfe8ff', 0.13)); S.shield.position.y = 1; root.add(S.shield); }
    if (S.shield) { S.shield.visible = sh; S.shield.rotation.y += dt; }
    if (st.poison && v.alive && Math.random() < dt * 8) this.fx.P.emit([v.pos[0], v.pos[1] + 1.2, v.pos[2]], { c: '#4a8a10', c2: '#c8ff7a', sp: 0.5, up: 0.8, s: 0.2, life: 0.6 });
    if (st.burn && v.alive && Math.random() < dt * 14) this.fx.P.emit([v.pos[0] + (Math.random() - 0.5) * 0.5, v.pos[1] + 0.5 + Math.random(), v.pos[2] + (Math.random() - 0.5) * 0.5], { c: '#ff3a0a', c2: '#ffd27a', sp: 0.3, up: 1.6, s: 0.25, life: 0.4 });
    if (st.slow && v.alive && Math.random() < dt * 5) this.fx.P.emit([v.pos[0], v.pos[1] + 0.3, v.pos[2]], { c: '#5fc8ff', c2: '#ffffff', sp: 0.6, s: 0.1, life: 0.5 });
  }

  // ---------- network (both roles) ----------
  onNet(from, m) {
    if (this.role === 'client') {
      if (m.t === 's') {
        // the fast channel is unordered: ignore a snapshot older than the one already shown
        if (m.n && this.lastSnapN && m.n <= this.lastSnapN && this.lastSnapN - m.n < 600) return;
        if (m.n) this.lastSnapN = m.n;
        this.applySnapshot(m);
      }
      else if (m.t === 'ev') for (const e of m.list) this.handleEvent(e);
      else if (m.t === 'roster') this.setRoster(m.list);
    }
  }

  scoreboardRows() {
    const rows = [...this.roster.values()].map(r => ({ r, v: this.view.get(r.id) })).filter(x => x.v && !x.r.isDummy);
    const my = this.myTeam();
    rows.sort((a, b) => (a.r.team === my ? 0 : 1) - (b.r.team === my ? 0 : 1) || (b.v.stats?.k || 0) - (a.v.stats?.k || 0));
    return rows.map(({ r, v }) => `<tr class="${r.team === my ? 'row-a' : 'row-b'}${r.id === this.localId ? ' row-me' : ''}${v.alive ? '' : ' row-dead'}"><td><img src="${this.app.portraits[r.hero]}"></td><td>${esc(r.name)}${r.isBot ? ' <small style="color:#6f665c">AI</small>' : ''}</td><td>${v.stats?.k || 0}</td><td>${v.stats?.d || 0}</td><td>${Math.round(v.stats?.dmg || 0)}</td><td>${Math.round(v.stats?.heal || 0)}</td></tr>`).join('');
  }

  dispose() {
    for (const en of this.ents.values()) { this.scene.remove(en.P.root); en.plate.remove(); en.trail?.dispose(); }
    this.ents.clear();
    this.fx.clear();
    this.vm.dispose();
    $('killfeed').innerHTML = ''; this.dmgLayer.innerHTML = ''; this.plates.innerHTML = '';
  }
}

export function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
