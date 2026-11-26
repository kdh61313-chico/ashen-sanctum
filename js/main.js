import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { HEROES, HERO_MAP, ROLES, SLOTS, SLOT_KEYS } from './heroes.js';
import { Sim } from './sim.js';
import { MAPS, setMap } from './map.js';
import { buildWorld } from './world.js';
import { FX } from './fx.js';
import { Audio } from './audio.js';
import { Net, makeCode, cleanCode } from './net.js';
import { ELEMENTS, EL_ORDER, matchup, strongVs, weakTo } from './elements.js';
import { GachaShow } from './gacha.js';
import { NOTES, NOTES_VERSION } from './notes.js';
import { CHAPTERS, STAGE_MAP, STAGE_TYPES, RAID } from './campaign.js';
import { TIERS, tierOf } from './profile.js';
import { renderSplash } from './stage.js';
import { icon } from './icons.js';
import { Stage, renderPortraits } from './stage.js';
import { Game, esc } from './game.js';
import { COUPONS, normCode, isAdminCode, rewardText } from './codes.js';
import { installGuard } from './guard.js';
import { MAXPOT } from './profile.js';
import { Profile, PULL_COST, TOKEN_PRICE, PERMIT_TOKEN_PRICE, RATES, PITY_START } from './profile.js';

const $ = (id) => document.getElementById(id);
const qsa = (s, r = document) => [...r.querySelectorAll(s)];
const IS_TOUCH = matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
const stars = (n) => '★'.repeat(n);

const DEF_SET = { sens: 1, fov: 92, vol: 0.6, q: IS_TOUCH ? 'low' : 'high', name: '', hero: 'valok', diff: 1, map: 'random' };
function loadSettings() { try { return { ...DEF_SET, ...JSON.parse(localStorage.getItem('ashen.settings') || '{}') }; } catch (e) { return { ...DEF_SET }; } }
function saveSettings(s) { try { localStorage.setItem('ashen.settings', JSON.stringify(s)); } catch (e) { } }
const MAP_CHOICES = [{ id: 'random', name: '무작위', accent: '#c9a45c' }, ...MAPS];
const pickMap = (id) => id === 'random' || !id ? MAPS[(Math.random() * MAPS.length) | 0].id : id;

class App {
  constructor() {
    this.settings = loadSettings();
    this.profile = new Profile();
    if (!this.profile.owns(this.settings.hero)) this.settings.hero = 'valok';
    this.state = 'loading';
    this.audio = new Audio();
    this.audio.setVolume(this.settings.vol);
    this.input = { keys: {}, mouse: [false, false, false], dx: 0, dy: 0, pressed: [], pressedMouse: false, locked: false, move: { x: 0, y: 0 }, touch: IS_TOUCH };
    this.selHero = this.settings.hero;
    this.roleFilter = 'all';
    this.selMode = 'ai';
    this.focus = 0;
    this.net = null; this.lobby = null; this.myId = null; this.game = null; this.world = null;
    if (IS_TOUCH) document.body.classList.add('is-touch');
  }

  async boot() {
    const canvas = $('gl');
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !IS_TOUCH, powerPreference: 'high-performance' });
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.25;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.camera = new THREE.PerspectiveCamera(this.settings.fov, 1, 0.05, 600);
    this.gameScene = new THREE.Scene();
    this.gameScene.add(this.camera);
    this.stage = new Stage();
    this.composer = new EffectComposer(r);
    this.renderPass = new RenderPass(this.stage.scene, this.stage.camera);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.55, 0.82);
    // first-person view model: own scene + camera, drawn over the world with a cleared depth buffer
    this.vmScene = new THREE.Scene();
    this.vmCam = new THREE.PerspectiveCamera(58, 1, 0.01, 8);
    this.vmPass = new RenderPass(this.vmScene, this.vmCam);
    { const pm = new THREE.PMREMGenerator(r); this.vmScene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; this.vmScene.environmentIntensity = 0.2; pm.dispose(); }
    this.vmPass.clear = false; this.vmPass.clearDepth = true; this.vmPass.enabled = false;
    this.composer.addPass(this.renderPass); this.composer.addPass(this.vmPass); this.composer.addPass(this.bloom); this.composer.addPass(new OutputPass());

    await tick();
    this.portraits = renderPortraits(HEROES);
    await tick();
    this.fx = new FX(this.gameScene, r);
    this.buildArena('sanctum');
    this.applyQuality();
    addEventListener('resize', () => this.resize());
    this.bindInput();
    this.bindTouch();
    this.buildSelect();
    this.bindMenus();
    $('loading').classList.remove('is-on');
    await this.profile.recover();
    const daily = this.profile.daily();
    this.showHome();
    if (daily) setTimeout(() => this.toast(`오늘의 보급: 잿빛 결정 ${daily.crystals}`, 3500), 600);
    { // invite link: ?join=CODE opens the online window with the code filled in
      const inv = cleanCode(new URLSearchParams(location.search).get('join') || '');
      if (inv.length === 5) {
        $('btn-online').click();
        $('in-code').value = inv;
        $('online-note').textContent = `초대받은 방 ${inv}. 이름을 적고 참가를 눌러 주세요.`;
        history.replaceState(null, '', location.pathname);
      }
    }
    this.last = performance.now();
    requestAnimationFrame((t) => this.frame(t));
  }

  buildArena(mapId) {
    if (this.world && this.world.mapId === mapId) { setMap(mapId); return; }
    this.world?.dispose();
    setMap(mapId);
    this.world = buildWorld(this.gameScene, this.settings.q, mapId);
    try { this.renderer.compile(this.gameScene, this.camera); } catch (e) { }
  }

  applyQuality() {
    const q = this.settings.q;
    const pr = Math.min(devicePixelRatio || 1, q === 'high' ? 1.5 : q === 'medium' ? 1 : 0.75);
    this.renderer.setPixelRatio(pr);
    this.renderer.shadowMap.enabled = q !== 'low';
    this.bloom.enabled = q !== 'low';
    this.pr = pr;
    this.resize();
  }

  resize() {
    if (!this.renderer) return;
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h; this.camera.fov = this.settings.fov; this.camera.updateProjectionMatrix();
    this.vmCam.aspect = w / h; this.vmCam.fov = w / h < 1.4 ? 80 : 72; this.vmCam.updateProjectionMatrix();
    this.stage.resize(w, h, this.pr || 1);
    this.fx?.setScale(h * (this.pr || 1), this.settings.fov);
    $('rotate').hidden = !(IS_TOUCH && h > w && this.state === 'game');
  }

  // ---------------- input ----------------
  bindInput() {
    const I = this.input;
    addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (this.state === 'game') {
        if (['Space', 'Tab', 'KeyQ', 'KeyE', 'KeyX', 'KeyR'].includes(e.code)) e.preventDefault();
        if (!I.keys[e.code]) I.pressed.push(e.code);
        if (e.code === 'Tab') $('scoreboard').hidden = false;
      }
      I.keys[e.code] = true;
    });
    addEventListener('keyup', (e) => { I.keys[e.code] = false; if (e.code === 'Tab') $('scoreboard').hidden = true; });
    addEventListener('blur', () => { I.keys = {}; I.mouse = [false, false, false]; $('scoreboard').hidden = true; });
    addEventListener('mousedown', (e) => { if (this.state === 'game' && I.locked && !IS_TOUCH) { I.mouse[e.button] = true; if (e.button === 0) I.pressedMouse = true; } });
    addEventListener('mouseup', (e) => { if (!IS_TOUCH) I.mouse[e.button] = false; });
    addEventListener('mousemove', (e) => { if (I.locked && !IS_TOUCH) { I.dx += e.movementX; I.dy += e.movementY; } });
    addEventListener('contextmenu', (e) => { if (this.state === 'game') e.preventDefault(); });
    document.addEventListener('pointerlockchange', () => {
      if (IS_TOUCH) return;
      I.locked = document.pointerLockElement === $('gl');
      if (this.state === 'game') {
        if (!I.locked && !this.game?.ended && $('results').hidden) this.openPause();
        $('click-to-play').hidden = true;
      }
    });
    $('gl').addEventListener('click', () => { if (this.state === 'game' && !I.locked && $('pause').hidden && $('results').hidden) this.lock(); });
    $('click-to-play').addEventListener('click', () => this.lock());
    let dragging = false, lx = 0;
    for (const id of ['select', 'home', 'recruit']) $(id).addEventListener('pointerdown', (e) => { if (IS_TOUCH) return; if (e.target.closest('button, aside, footer, .lobby, .actions, nav, .banner, .pull')) return; dragging = true; lx = e.clientX; this.stage.drag = true; });
    addEventListener('pointermove', (e) => { if (dragging) { this.stage.pointer(e.clientX - lx); lx = e.clientX; } });
    addEventListener('pointerup', () => { dragging = false; this.stage.drag = false; });
    $('select').addEventListener('wheel', (e) => { this.focus = Math.max(0, Math.min(1, this.focus + (e.deltaY < 0 ? 0.25 : -0.25))); }, { passive: true });
  }

  bindTouch() {
    if (!IS_TOUCH) return;
    const I = this.input;
    // Force fullscreen on phones: browsers only allow it from a tap, so try on every tap until it sticks.
    const fs = () => {
      if (document.fullscreenElement || document.webkitFullscreenElement) return;
      const d = document.documentElement;
      try { const p = d.requestFullscreen ? d.requestFullscreen({ navigationUI: 'hide' }) : d.webkitRequestFullscreen?.(); p?.catch?.(() => {}); } catch (e) { }
    };
    addEventListener('pointerup', fs, { passive: true });
    addEventListener('touchend', fs, { passive: true });
    document.addEventListener('fullscreenchange', () => { if (document.fullscreenElement) try { screen.orientation?.lock?.('landscape')?.catch?.(() => {}); } catch (e) { } });
    const stick = $('t-stick'), knob = $('t-knob');
    let sid = null, cx = 0, cy = 0;
    const move = (e) => { if (e.pointerId !== sid) return; let dx = e.clientX - cx, dy = e.clientY - cy; const l = Math.hypot(dx, dy), m = 60; if (l > m) { dx *= m / l; dy *= m / l; } I.move.x = dx / m; I.move.y = dy / m; knob.style.transform = `translate(${dx}px, ${dy}px)`; };
    stick.addEventListener('pointerdown', (e) => { sid = e.pointerId; const r = stick.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; stick.setPointerCapture(sid); move(e); });
    stick.addEventListener('pointermove', move);
    const end = (e) => { if (e.pointerId !== sid) return; sid = null; I.move.x = 0; I.move.y = 0; knob.style.transform = ''; };
    stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
    const look = $('t-look');
    const looks = new Map();
    look.addEventListener('pointerdown', (e) => { looks.set(e.pointerId, [e.clientX, e.clientY]); look.setPointerCapture(e.pointerId); });
    look.addEventListener('pointermove', (e) => { const p = looks.get(e.pointerId); if (!p) return; I.dx += (e.clientX - p[0]) * 1.5; I.dy += (e.clientY - p[1]) * 1.5; looks.set(e.pointerId, [e.clientX, e.clientY]); });
    const lend = (e) => looks.delete(e.pointerId);
    look.addEventListener('pointerup', lend); look.addEventListener('pointercancel', lend);
    for (const b of qsa('.tb[data-k]')) {
      const k = b.dataset.k;
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault(); b.classList.add('is-down'); b.setPointerCapture(e.pointerId);
        if (k === 'atk') { I.mouse[0] = true; I.pressedMouse = true; }
        else if (k === 'Space') I.keys.Space = true;
        else I.pressed.push(k);
        b._lp = [e.clientX, e.clientY];
      });
      b.addEventListener('pointermove', (e) => { if (k !== 'atk' || !b._lp) return; I.dx += (e.clientX - b._lp[0]) * 1.2; I.dy += (e.clientY - b._lp[1]) * 1.2; b._lp = [e.clientX, e.clientY]; });
      const up = () => { b.classList.remove('is-down'); b._lp = null; if (k === 'atk') I.mouse[0] = false; else if (k === 'Space') I.keys.Space = false; };
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
    }
    $('t-menu').addEventListener('click', () => this.openPause());
    $('t-board').addEventListener('click', () => { const sb = $('scoreboard'); sb.hidden = !sb.hidden; if (!sb.hidden) $('board-body').innerHTML = this.game?.scoreboardRows() || ''; });
  }

  lock() {
    this.audio.init();
    if (IS_TOUCH) { this.input.locked = true; $('click-to-play').hidden = true; try { document.documentElement.requestFullscreen?.().catch(() => {}); } catch (e) { } return; }
    const fallback = () => { try { const q = $('gl').requestPointerLock?.(); q?.catch?.(() => {}); } catch (e) { } };
    try { const p = $('gl').requestPointerLock?.({ unadjustedMovement: true }); if (p && p.catch) p.catch(fallback); } catch (e) { fallback(); }
  }

  // ---------------- screens ----------------
  setScreen(name) {
    this.state = name;
    const SCR = ['home', 'select', 'recruit', 'shop', 'quests', 'play', 'campaign', 'raid', 'ranked'];
    for (const s of SCR) $(s).scrollTop = 0;
    for (const s of SCR) $(s).classList.toggle('is-on', s === name);
    $('hud').classList.toggle('is-on', name === 'game');
    $('topbar').hidden = name === 'game';
    $('btn-back').hidden = name === 'home';
    $('logo').hidden = name !== 'home';
    if (name !== 'game') { this.renderPass.scene = this.stage.scene; this.renderPass.camera = this.stage.camera; }
    this.vmPass.enabled = name === 'game';
    this.refreshTop();
    this.resize();
  }
  refreshTop() {
    const d = this.profile.d;
    $('cur-crystal').textContent = d.crystals.toLocaleString();
    $('cur-permit').textContent = d.permits;
    $('cur-token').textContent = d.tokens;
    $('lv-num').textContent = d.level;
    $('lv-xp').style.width = (d.xp / this.profile.xpNeed() * 100) + '%';
  }

  showHome() {
    this.setScreen('home');
    const a = HERO_MAP[this.profile.d.assistant] || HERO_MAP.valok;
    this.stage.setHero(a, false);
    $('home').style.setProperty('--accent', a.color);
    $('home-line').textContent = `“${a.quote}” — ${a.name}`;
    const B = this.profile.banner(), six = HERO_MAP[B.six];
    $('tile-recruit-sub').textContent = `오늘의 영웅 · ${six.name} ${stars(6)}`;
    let bg = $('tile-recruit').querySelector('.slab__bg');
    if (!bg) { bg = document.createElement('span'); bg.className = 'slab__bg'; $('tile-recruit').prepend(bg); }
    bg.style.backgroundImage = `url(${this.portraits[six.id]})`;
    $('tile-roster-sub').textContent = `보유 ${this.profile.ownedList().length} / ${HEROES.length}`;
    { const next = CHAPTERS.flatMap(c => c.stages).find(st => !this.profile.stars(st.id)); $('tile-battle-sub').textContent = next ? `캠페인 · 레이드 · 랭크전 · 대전 — 다음 ${next.id} ${next.name}` : '캠페인 · 레이드 · 랭크전 · 대전'; }
    this.refreshQuestBadge();
    $('notes-badge').hidden = this.profile.d.lastPatch === NOTES_VERSION;
  }

  // ---------------- admin tools ----------------
  openAdmin() {
    if (!this.adminOn) return;
    const d = this.profile.d;
    const F = [['crystals', '잿빛 결정', d.crystals], ['permits', '모집 허가증', d.permits], ['tokens', '잔불 증표', d.tokens], ['essence', '정수', d.mats.essence], ['seal', '인장', d.mats.seal], ['tome', '기술서', d.mats.tome], ['level', '계정 레벨', d.level]];
    $('adm-cur').innerHTML = F.map(([k, n, v]) => `<label class="admin__f">${n}<input type="number" min="0" data-cur="${k}" value="${v}"></label>`).join('');
    $('adm-hero').innerHTML = [...HEROES].filter(h => !h.boss).sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name)).map(h => `<option value="${h.id}">${'★'.repeat(h.rarity)} ${esc(h.name)}${d.owned[h.id] ? '' : ' (미보유)'}</option>`).join('');
    $('adm-rank').value = d.rank.pts || 0; $('adm-horde').value = d.hordeBest || 0;
    $('adm-note').textContent = '';
    $('settings').hidden = true; $('admin').hidden = false;
  }
  adminDone(msg) { this.profile.save(); this.refreshTop(); if (this.state === 'home') this.showHome?.(); $('adm-note').textContent = msg; const sel = $('adm-hero').value; this.openAdmin(); $('adm-hero').value = sel; $('adm-note').textContent = msg; }
  adminApplyCurrency() {
    if (!this.adminOn) return;
    const d = this.profile.d;
    for (const inp of qsa('[data-cur]', $('adm-cur'))) {
      const v = Math.max(0, Math.floor(+inp.value || 0)), k = inp.dataset.cur;
      if (k === 'crystals' || k === 'permits' || k === 'tokens') d[k] = v;
      else if (k === 'level') { d.level = Math.max(1, Math.min(99, v)); d.xp = 0; }
      else d.mats[k] = v;
    }
    this.adminDone('재화를 바꿨어요.');
  }
  adminAction(a) {
    if (!this.adminOn) return;
    const P = this.profile, d = P.d, id = $('adm-hero').value;
    const own = (hid) => { if (!d.owned[hid]) d.owned[hid] = { pot: 1, at: Date.now() }; };
    const maxGrow = (hid) => { own(hid); d.owned[hid].pot = MAXPOT; d.growth[hid] = { lv: 40, elite: 2, sk: 7 }; };
    const heroes = HEROES.filter(h => !h.boss);
    switch (a) {
      case 'rich': for (const k of ['crystals', 'permits', 'tokens']) d[k] = 99999; for (const k of ['essence', 'seal', 'tome']) d.mats[k] = 99999; return this.adminDone('모든 재화를 99,999로 바꿨어요.');
      case 'zero': for (const k of ['crystals', 'permits', 'tokens']) d[k] = 0; for (const k of ['essence', 'seal', 'tome']) d.mats[k] = 0; return this.adminDone('모든 재화를 0으로 바꿨어요.');
      case 'give1': own(id); return this.adminDone(`${HERO_MAP[id].name}을(를) 얻었어요.`);
      case 'max1': maxGrow(id); return this.adminDone(`${HERO_MAP[id].name}: 레벨 40, 정예 2, 기술 7, 잠재 ${MAXPOT}.`);
      case 'take1': if (Object.keys(d.owned).length <= 1) return this.adminDone('마지막 영웅은 뺄 수 없어요.'); delete d.owned[id]; delete d.growth[id]; return this.adminDone(`${HERO_MAP[id].name}을(를) 목록에서 뺐어요.`);
      case 'all': heroes.forEach(h => own(h.id)); return this.adminDone(`영웅 ${heroes.length}명을 모두 얻었어요.`);
      case 'maxall': heroes.forEach(h => maxGrow(h.id)); return this.adminDone('모든 영웅을 최대로 육성했어요.');
      case 'resetgrowth': d.growth = {}; return this.adminDone('육성을 초기화했어요.');
      case 'camp': for (const ch of CHAPTERS) for (const st of ch.stages) d.camp[st.id] = 3; return this.adminDone('캠페인을 모두 ★3으로 클리어했어요.');
      case 'raid': for (let i = 0; i < RAID.diffs.length; i++) { d.raid.clears[i] = (d.raid.clears[i] || 0) + 1; d.raid.best[i] = d.raid.best[i] || 60; } return this.adminDone('레이드를 모든 난이도로 클리어했어요.');
      case 'quests': { P.adminCompleteQuests(); if (this.qTab) this.renderQuests(); this.refreshQuestBadge?.(); return this.adminDone('일일 · 주간 임무를 모두 달성 상태로 바꿨어요. 임무 화면에서 보상을 받으세요.'); }
      case 'pity': d.force6 = true; return this.adminDone('다음 모집 한 번은 ★6이 확정이에요.');
      case 'prog': d.rank.pts = Math.max(0, Math.floor(+$('adm-rank').value || 0)); d.rank.best = Math.max(d.rank.best || 0, d.rank.pts); d.hordeBest = Math.max(0, Math.floor(+$('adm-horde').value || 0)); return this.adminDone('랭크 점수와 심연 기록을 바꿨어요.');
      case 'codes': d.codes = {}; return this.adminDone('쿠폰 코드를 다시 쓸 수 있어요.');
      case 'wipe': if (!confirm('정말 저장 데이터를 처음 상태로 되돌릴까요? 되돌릴 수 없어요.')) return; P.wipe(); setTimeout(() => location.reload(), 300); return;
    }
  }

  openElChart() {
    const g = $('elchart-grid');
    const head = (k) => `<span class="hd"><img src="assets/el-${k}.svg" alt="">${ELEMENTS[k].name}</span>`;
    let html = '<span class="hd"></span>' + EL_ORDER.map(head).join('');
    for (const a of EL_ORDER) {
      html += head(a);
      for (const d of EL_ORDER) { const m = matchup(a, d); html += m > 1 ? '<span class="up">×1.25</span>' : m < 0.85 ? '<span class="dn">×0.8</span>' : m < 1 ? '<span class="dn">×0.9</span>' : '<span class="eq">—</span>'; }
    }
    g.innerHTML = html;
    $('elchart').hidden = false;
  }

  refreshQuestBadge() {
    const n = this.profile.claimable();
    $('quest-badge').hidden = !n; $('quest-badge').textContent = n;
    $('tile-quests-sub').textContent = n ? `받을 보상 ${n}개` : '일일 · 주간 · 업적';
  }

  // ---------------- quests ----------------
  openQuests() { this.setScreen('quests'); $('back-label').textContent = '홈'; this.qTab = this.qTab || 'daily'; this.renderQuests(); }
  renderQuests() {
    const L = this.profile.questList();
    qsa('button', $('qtabs')).forEach(b => {
      b.classList.toggle('is-on', b.dataset.t === this.qTab);
      const list = L[b.dataset.t]; const n = list.filter(x => x.done && !x.claimed).length;
      b.dataset.n = n || '';
    });
    const rw = (r) => [r.crystals ? `<span><i class="cur__ico cur__ico--crystal"></i>${r.crystals}</span>` : '', r.permits ? `<span><i class="cur__ico cur__ico--permit"></i>${r.permits}</span>` : '', r.tokens ? `<span><i class="cur__ico cur__ico--token"></i>${r.tokens}</span>` : ''].join('');
    const list = L[this.qTab];
    const fmt = (n) => n >= 1000 ? n.toLocaleString() : n;
    $('qlist').innerHTML = list.map(q => `<li class="quest${q.claimed ? ' is-claimed' : q.done ? ' is-done' : ''}">
      <div class="quest__main"><b>${q.name}</b><p>${q.desc}</p><div class="quest__bar"><i style="width:${q.value / q.goal * 100}%"></i></div><small>${fmt(q.value)} / ${fmt(q.goal)}</small></div>
      <div class="quest__rw">${rw(q.reward)}</div>
      <button class="btn ${q.done && !q.claimed ? 'btn--ember' : 'btn--ghost'} btn--sm quest__btn" data-id="${q.id}" ${q.done && !q.claimed ? '' : 'disabled'}><span class="btn__k">${q.claimed ? '받음' : q.done ? '받기' : '진행 중'}</span></button></li>`).join('');
    const bonus = this.qTab === 'ach' ? '' : (() => {
      const scope = this.qTab, got = scope === 'daily' ? L.dailyBonus : L.weeklyBonus;
      const all = list.filter(x => x.claimed).length;
      const r = scope === 'daily' ? { crystals: 250 } : { permits: 1, tokens: 30 };
      return `<div class="qbonus__in${this.profile.bonusReady(scope) ? ' is-ready' : ''}${got ? ' is-got' : ''}"><div><b>${scope === 'daily' ? '오늘의' : '이번 주'} 임무 완수 보상</b><small>${all} / ${list.length} 완료</small></div><div class="quest__rw">${rw(r)}</div><button class="btn btn--ember btn--sm" data-bonus="${scope}" ${this.profile.bonusReady(scope) ? '' : 'disabled'}><span class="btn__k">${got ? '받음' : '받기'}</span></button></div>`;
    })();
    $('qbonus').innerHTML = bonus;
  }
  claimFx(r) {
    if (!r) return;
    this.audio.play('win');
    this.toast('보상 획득: ' + [r.crystals ? `잿빛 결정 ${r.crystals}` : '', r.permits ? `허가증 ${r.permits}` : '', r.tokens ? `증표 ${r.tokens}` : ''].filter(Boolean).join(' · '));
    this.refreshTop(); this.renderQuests(); this.refreshQuestBadge();
  }

  // ---------------- patch notes ----------------
  openNotes() {
    $('notes-body').innerHTML = NOTES.map((n, i) => `<article class="note${i === 0 ? ' is-new' : ''}"><header><b>v${n.v}</b><h3>${n.title}</h3><time>${n.date}</time></header>${n.sections.map(([h, items]) => `<h4>${h}</h4><ul>${items.map(t => `<li>${t}</li>`).join('')}</ul>`).join('')}</article>`).join('');
    $('notes').hidden = false;
    this.profile.d.lastPatch = NOTES_VERSION; this.profile.save();
    $('notes-badge').hidden = true;
  }

  // ---------------- hero select ----------------
  buildSelect() {
    const tabs = $('role-tabs');
    const roles = [['all', '전체', '#c9a45c'], ['owned', '보유', '#e8cf8a'], ...Object.entries(ROLES).map(([k, v]) => [k, v.name, v.color])];
    tabs.innerHTML = roles.map(([k, n, c]) => `<button data-role="${k}" style="--rc:${c}" class="${k === 'all' ? 'is-on' : ''}">${n}</button>`).join('');
    tabs.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      this.roleFilter = b.dataset.role;
      qsa('button', tabs).forEach(x => x.classList.toggle('is-on', x === b));
      this.filterRoster(); this.audio.play('click');
    });
    const et = $('el-tabs');
    et.innerHTML = `<button data-el="all" class="is-on">모든 속성</button>` + EL_ORDER.map(k => `<button data-el="${k}" style="--rc:${ELEMENTS[k].color}"><img src="assets/el-${k}.svg" alt="">${ELEMENTS[k].name}</button>`).join('');
    this.elFilter = 'all';
    et.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      this.elFilter = b.dataset.el;
      qsa('button', et).forEach(x => x.classList.toggle('is-on', x === b));
      this.filterRoster(); this.audio.play('click');
    });
    const sorted = [...HEROES].sort((a, b) => (b.rarity - a.rarity));
    $('roster').innerHTML = sorted.map(h => `<button class="sigil" data-id="${h.id}" data-r="${h.rarity}" style="--rc:${ROLES[h.role].color}" title="${h.name} · ${h.title}"><span class="sigil__frame"></span><span class="sigil__img" style="background-image:url(${this.portraits[h.id]})"></span><span class="sigil__stars"><i>★</i>${h.rarity}</span><span class="sigil__role"></span><img class="sigil__el" src="assets/el-${h.el}.svg" alt=""><span class="sigil__pot" hidden></span><span class="sigil__name">${h.name}</span></button>`).join('');
    $('roster').addEventListener('click', (e) => {
      const b = e.target.closest('.sigil'); if (!b) return;
      if (b.classList.contains('is-taken')) { this.toast('같은 팀이 이미 고른 영웅이에요'); return; }
      this.audio.init();
      this.setHero(b.dataset.id);
    });
    $('roster').addEventListener('mouseover', (e) => { if (e.target.closest('.sigil')) this.audio.play('hover'); });
    const chips = (el, cb) => {
      el.innerHTML = MAP_CHOICES.map(m => `<button data-m="${m.id}" style="--chip:${m.accent}">${m.name}</button>`).join('');
      el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || b.disabled) return; cb(b.dataset.m); this.audio.play('click'); });
    };
    chips($('map-chips'), (m) => { this.settings.map = m; saveSettings(this.settings); this.refreshChips(); });
    chips($('lobby-maps'), (m) => { if (this.lobby && this.net?.isHost) { this.lobby.map = m; this.broadcastLobby(); } });
    this.refreshChips();
  }
  refreshChips() {
    qsa('button', $('map-chips')).forEach(b => b.classList.toggle('is-on', b.dataset.m === this.settings.map));
    if (this.lobby) qsa('button', $('lobby-maps')).forEach(b => { b.classList.toggle('is-on', b.dataset.m === (this.lobby.map || 'random')); b.disabled = !this.net?.isHost; });
  }

  filterRoster() {
    qsa('.sigil').forEach(s => {
      const h = HERO_MAP[s.dataset.id];
      const owned = this.profile.owns(h.id);
      s.classList.toggle('is-locked', !owned);
      const f = this.roleFilter;
      s.hidden = !(f === 'all' || (f === 'owned' ? owned : h.role === f)) || (this.elFilter && this.elFilter !== 'all' && h.el !== this.elFilter);
      const pot = s.querySelector('.sigil__pot'); const pv = this.profile.pot(h.id);
      pot.hidden = pv < 2; pot.textContent = '잠재 ' + pv;
    });
  }

  openSelect(mode) {
    this.selMode = mode;
    if (!['stage', 'raid', 'ranked'].includes(mode)) this.ctx = null;
    this.setScreen('select');
    $('back-label').textContent = mode === 'lobby' ? '방 나가기' : mode === 'swap' ? '훈련장' : mode === 'stage' ? '캠페인' : mode === 'raid' ? '레이드' : mode === 'ranked' ? '랭크전' : mode === 'browse' ? '홈' : '출정';
    if (!this.profile.owns(this.selHero) && mode !== 'browse') this.selHero = this.profile.owns(this.settings.hero) ? this.settings.hero : 'valok';
    this.filterRoster();
    this.setHero(this.selHero, false);
    this.updateSelectActions();
    this.updateLobbyUi();
  }

  updateSelectActions() {
    const m = this.selMode, owned = this.profile.owns(this.selHero);
    $('sel-actions').hidden = m === 'lobby';
    $('opt-map').hidden = !(m === 'ai' || m === 'ai5' || m === 'training' || m === 'horde');
    $('opt-diff').hidden = !(m === 'ai' || m === 'ai5' || m === 'horde');
    { const g = this.profile.gr(this.selHero); $('btn-grow').hidden = !owned || m === 'lobby'; $('grow-sub').textContent = `레벨 ${g.lv} · ${['', '정예 1', '정예 2'][g.elite] || '정예 0'} · 기술 ${g.sk}`; }
    qsa('button', $('diff-seg')).forEach(b => b.classList.toggle('is-on', +b.dataset.d === this.settings.diff));
    const note = $('locked-note');
    note.hidden = owned;
    note.textContent = '아직 모집하지 않은 영웅이에요. 모집이나 상점에서 얻을 수 있어요.';
    const go = $('btn-go'), k = go.querySelector('.btn__k'), sub = $('btn-go-sub');
    go.disabled = false;
    if (m === 'browse') { k.textContent = owned ? (this.profile.d.assistant === this.selHero ? '현재 조수' : '조수로 설정') : '모집하러 가기'; sub.textContent = owned ? '홈 화면에 이 영웅이 서 있어요' : ''; }
    else if (m === 'ai') { k.textContent = '전투 시작'; sub.textContent = '3대3 · 먼저 3라운드'; go.disabled = !owned; }
    else if (m === 'ai5') { k.textContent = '난전 시작'; sub.textContent = '5대5 · 먼저 3라운드'; go.disabled = !owned; }
    else if (m === 'training') { k.textContent = '훈련 시작'; sub.textContent = '허수아비로 스킬 연습'; go.disabled = !owned; }
    else if (m === 'stage') { const st = this.ctx?.st; k.textContent = '출전'; sub.textContent = st ? `${st.id} ${st.name} · ${STAGE_TYPES[st.type]}` : ''; go.disabled = !owned; }
    else if (m === 'raid') { k.textContent = '레이드 시작'; sub.textContent = `${RAID.name} · ${RAID.diffs[this.ctx?.diff || 0].name}`; go.disabled = !owned; }
    else if (m === 'ranked') { const R = this.profile.rankState(); k.textContent = '랭크전 시작'; sub.textContent = `${TIERS[tierOf(R.pts)].name} · ${R.pts}점`; go.disabled = !owned; }
    else if (m === 'horde') { k.textContent = '토벌 시작'; sub.textContent = `AI 아군 2명과 웨이브 생존 · 최고 ${this.profile.d.hordeBest}웨이브`; go.disabled = !owned; }
    else if (m === 'swap') { k.textContent = '이 영웅으로 계속'; sub.textContent = ''; go.disabled = !owned; }
  }

  setHero(id, sound = true) {
    const h = HERO_MAP[id]; if (!h) return;
    this.selHero = id;
    if (this.profile.owns(id)) { this.settings.hero = id; saveSettings(this.settings); }
    qsa('.sigil').forEach(s => s.classList.toggle('is-on', s.dataset.id === id));
    const nm = $('sel-name');
    nm.textContent = h.name; nm.classList.remove('is-swap'); void nm.offsetWidth; nm.classList.add('is-swap');
    $('sel-title').textContent = h.title;
    $('sel-role').textContent = ROLES[h.role].name;
    { const E = ELEMENTS[h.el]; const ec = $('sel-el'); ec.innerHTML = `<img src="assets/el-${h.el}.svg" alt="">${E.name}`; ec.style.setProperty('--ec', E.color);
      const elTag = (k) => `<img src="assets/el-${k}.svg" alt=""><b style="color:${ELEMENTS[k].color}">${ELEMENTS[k].name}</b>`;
      $('sel-elbox').innerHTML = `<img src="assets/el-${h.el}.svg" alt=""><div><b style="color:${E.color}">${E.name} 속성</b><p>${E.desc}</p><small>같은 속성 2명 이상이면 공명: ${E.reso}</small><div class="el-mu"><span>강함 ${strongVs(h.el).map(elTag).join(' ')}</span><span>약함 ${weakTo(h.el).map(elTag).join(' ')}</span><button type="button" data-elchart>상성표</button></div></div>`; }
    $('sel-stars').innerHTML = `${stars(h.rarity)} <b>${h.rarity}성</b>`; $('sel-stars').className = 'stars stars--' + h.rarity;
    $('select').style.setProperty('--accent', h.color);
    $('sel-quote').textContent = h.quote;
    const bars = (v) => Array.from({ length: 5 }, (_, i) => `<i class="${i < v ? 'on' : ''}"></i>`).join('');
    const hpLv = Math.max(1, Math.min(5, Math.round(((h.hp - 250) / (520 - 250)) * 4) + 1));
    const spLv = Math.max(1, Math.min(5, Math.round(((h.speed - 5.8) / (7.6 - 5.8)) * 4) + 1));
    const lmb = h.abilities.lmb;
    $('sel-stats').innerHTML = `
      <dt>체력</dt><dd>${bars(hpLv)}<em>${h.hp}</em></dd>
      <dt>이동속도</dt><dd>${bars(spLv)}<em>${h.speed.toFixed(1)}</em></dd>
      <dt>난이도</dt><dd>${bars(h.diff * 2 - 1)}<em>${['', '쉬움', '보통', '어려움'][h.diff]}</em></dd>
      ${lmb.ammo ? `<dt>탄창</dt><dd>${bars(Math.min(5, Math.ceil(lmb.ammo / 12)))}<em>${lmb.ammo}발</em></dd>` : ''}`;
    $('sel-skills').innerHTML = SLOTS.map(s => {
      const d = h.abilities[s];
      const cd = s === 'x' ? '궁극기' : (s === 'lmb' ? (d.ammo ? `${d.ammo}발 · 재장전 ${d.reload}초` : '') : `${d.cd}초`);
      const alt = d.form?.lmb || d.alt;
      return `<li class="skill${s === 'x' ? ' skill--ult' : ''}"><div class="rune"><img src="${icon(d.icon, s === 'x' ? '#ffb08a' : '#efe0c0')}" alt=""><span class="rune__key">${SLOT_KEYS[s]}</span></div><div><div class="skill__name">${d.name}<span class="skill__cd">${cd}</span></div><div class="skill__desc">${d.desc}${alt ? `<br><i class="skill__alt">→ 좌클릭: ${alt.name}. ${alt.desc}</i>` : ''}</div></div></li>`;
    }).join('');
    if (h.passive) $('sel-skills').insertAdjacentHTML('afterbegin', `<li class="skill skill--passive"><div class="rune rune--passive"><img src="assets/el-${h.el}.svg" alt=""><span class="rune__key">패시브</span></div><div><div class="skill__name">${h.passive.name}${h.passive.res ? `<span class="skill__cd" style="color:${h.passive.res.color}">${h.passive.res.name}</span>` : ''}</div><div class="skill__desc">${h.passive.desc}</div></div></li>`);
    this.stage.setHero(h, sound);
    if (sound) this.audio.play('select');
    if (this.state === 'select') this.updateSelectActions();
    if (this.lobby && this.profile.owns(id)) this.lobbyPick(id);
  }

  // ---------------- recruit ----------------
  openRecruit() {
    this.setScreen('recruit');
    $('back-label').textContent = '홈';
    const B = this.profile.banner(), six = HERO_MAP[B.six];
    this.stage.setHero(six, true);
    $('recruit').style.setProperty('--accent', six.color);
    $('ban-name').textContent = six.name;
    $('ban-title').textContent = `${six.title} · ${ROLES[six.role].name}`;
    $('ban-feat').innerHTML = [B.six, ...B.five].map(id => { const h = HERO_MAP[id]; return `<div class="feat"><img src="${this.portraits[id]}" alt=""><span>${h.name}<small>${stars(h.rarity)} 확률 상승</small></span></div>`; }).join('');
    this.refreshRecruit();
  }
  refreshRecruit() {
    const d = this.profile.d;
    $('rate6').textContent = (this.profile.rate6() * 100).toFixed(0) + '%';
    $('ban-pity').textContent = d.pity6 >= PITY_START ? `★6 확률이 올라가는 중이에요. 지금 ${(this.profile.rate6() * 100).toFixed(0)}%.` : `★6 없이 ${d.pity6}회 모집했어요. ${PITY_START}회가 넘으면 매번 ★6 확률이 2%씩 올라요.`;
    const cost = (n) => d.permits >= n ? `허가증 ${n}장` : `잿빛 결정 ${(PULL_COST * (n - Math.min(d.permits, n))).toLocaleString()}${d.permits ? ` + 허가증 ${Math.min(d.permits, n)}장` : ''}`;
    $('pull1-cost').textContent = cost(1); $('pull10-cost').textContent = cost(10);
    $('btn-pull1').disabled = !this.profile.canPull(1); $('btn-pull10').disabled = !this.profile.canPull(10);
    this.refreshTop();
  }
  doPull(n) {
    this.audio.init();
    if (this.gacha?.busy) return;
    const res = this.profile.pull(n);
    if (!res) { this.toast('잿빛 결정이 부족해요. 경기와 임무로 결정을 모아 보세요.'); return; }
    if (res.some(r => r.rarity === 6)) this.profile.d.totals.six += res.filter(r => r.rarity === 6).length;
    this.refreshTop();
    this.gacha = this.gacha || new GachaShow(this);
    this.gacha.busy = true;
    this.gacha.play(res).finally(() => { this.gacha.busy = false; });
    this.refreshRecruit();
  }

  // ---------------- shop ----------------
  openShop() { this.setScreen('shop'); $('back-label').textContent = '홈'; this.renderShop(); }
  renderShop() {
    const d = this.profile.d;
    const items = [...HEROES].sort((a, b) => (this.profile.owns(a.id) - this.profile.owns(b.id)) || (b.rarity - a.rarity));
    const permitSvg = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect x="4" y="6" width="52" height="28" rx="2" fill="#c9a45c"/><rect x="9" y="11" width="42" height="18" fill="none" stroke="#5a4020" stroke-width="2"/><circle cx="30" cy="20" r="5" fill="#b3262e"/></svg>')}`;
    $('shop-grid').innerHTML = `<button class="sitem sitem--permit" data-permit="1" ${d.tokens < PERMIT_TOKEN_PRICE ? 'disabled' : ''}><img src="${permitSvg}" alt=""><span class="sitem__name">모집 허가증</span><span class="sitem__price"><i class="cur__ico cur__ico--token"></i>${PERMIT_TOKEN_PRICE}</span></button>` +
      items.map(h => {
        const own = this.profile.owns(h.id), price = TOKEN_PRICE[h.rarity];
        return `<button class="sitem${own ? ' is-owned' : ''}" data-id="${h.id}" ${own || d.tokens < price ? 'disabled' : ''}><img src="${this.portraits[h.id]}" alt=""><span class="stars stars--${h.rarity}">${stars(h.rarity)}</span><span class="sitem__name">${h.name}</span><span class="sitem__price">${own ? '보유 중' : `<i class="cur__ico cur__ico--token"></i>${price}`}</span></button>`;
      }).join('');
  }

  // ---------------- menus ----------------
  bindMenus() {
    const S = this.settings;
    const seg = (el, cb) => el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || b.disabled) return; qsa('button', el).forEach(x => x.classList.toggle('is-on', x === b)); cb(b); this.audio.play('click'); });
    seg($('diff-seg'), (b) => { S.diff = +b.dataset.d; saveSettings(S); });
    seg($('lobby-size'), (b) => {
      const L = this.lobby; if (!L || !this.net?.isHost) return;
      const n = +b.dataset.n;
      if (n < (L.size || 3) && [0, 1].some(t => L.players.filter(p => p.team === t).length > n)) { this.toast('한 팀 인원이 3명보다 많아서 줄일 수 없어요'); this.updateLobbyUi(); return; }
      L.size = n; this.broadcastLobby();
    });
    seg($('lobby-diff'), (b) => { S.diff = +b.dataset.d; saveSettings(S); if (this.lobby && this.net?.isHost) { this.lobby.diff = S.diff; this.broadcastLobby(); } });
    qsa('button', $('set-q')).forEach(b => b.classList.toggle('is-on', b.dataset.q === S.q));
    seg($('set-q'), (b) => { S.q = b.dataset.q; saveSettings(S); this.applyQuality(); const m = this.world?.mapId; this.world?.dispose(); this.world = null; if (m) this.buildArena(m); });
    $('tile-battle').addEventListener('click', () => { this.audio.init(); this.audio.play('click'); this.openPlay(); });
    $('btn-campaign').addEventListener('click', () => { this.audio.play('click'); this.openCampaign(); });
    $('btn-raid').addEventListener('click', () => { this.audio.play('click'); this.openRaid(); });
    $('btn-ranked').addEventListener('click', () => { this.audio.play('click'); this.openRanked(); });
    $('btn-raid-go').addEventListener('click', () => { this.ctx = { type: 'raid', diff: this.raidDiff || 0 }; this.openSelect('raid'); });
    $('btn-ranked-go').addEventListener('click', () => { this.ctx = { type: 'ranked' }; this.openSelect('ranked'); });
    $('btn-grow').addEventListener('click', () => this.openGrowth(this.selHero));
    $('btn-gr-close').addEventListener('click', () => { $('growth').hidden = true; this.updateSelectActions(); this.refreshTop(); });
    $('gr-body').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-act]'); if (!b) return;
      const id = this.grHero, P = this.profile; let ok = false;
      if (b.dataset.act === 'lv1') ok = P.levelUp(id, 1) > 0;
      else if (b.dataset.act === 'lv10') ok = P.levelUp(id, 10) > 0;
      else if (b.dataset.act === 'promote') ok = P.promote(id);
      else if (b.dataset.act === 'skill') ok = P.skillUp(id);
      this.audio.play(ok ? 'heal' : 'deny'); if (!ok) this.toast('재료가 부족하거나 조건이 맞지 않아요.');
      this.openGrowth(id); this.refreshTop();
    });
    $('camp-chapters').addEventListener('click', (e) => { const b = e.target.closest('button[data-ch]'); if (!b || b.disabled) return; this.audio.play('click'); this.openCampaign(+b.dataset.ch); });
    $('camp-map').addEventListener('click', (e) => { const b = e.target.closest('button[data-st]'); if (!b || b.disabled) return; this.audio.play('click'); this.showStage(b.dataset.st); });
    $('stage-panel').addEventListener('click', (e) => { if (e.target.closest('#btn-stage-go')) { this.ctx = { type: 'stage', st: STAGE_MAP[this.curStage] }; this.openSelect('stage'); } if (e.target.closest('#btn-stage-close')) $('stage-panel').hidden = true; });
    $('raid-diffs').addEventListener('click', (e) => { const b = e.target.closest('button[data-d]'); if (!b) return; this.raidDiff = +b.dataset.d; this.audio.play('click'); this.openRaid(); });
    $('rank-season-rw').addEventListener('click', (e) => { if (!e.target.closest('button')) return; const r = this.profile.claimSeason(); if (r) { this.toast(`시즌 보상: 결정 ${r.crystals} · 허가증 ${r.permits}`); this.audio.play('win'); this.refreshTop(); this.openRanked(); } });
    $('btn-ai').addEventListener('click', () => this.openSelect('ai'));
    $('btn-ai5').addEventListener('click', () => this.openSelect('ai5'));
    $('btn-training').addEventListener('click', () => this.openSelect('training'));
    $('btn-online').addEventListener('click', () => { this.audio.init(); $('in-name').value = S.name || ''; $('online').hidden = false; $('online-note').textContent = '브라우저끼리 직접 연결돼요. 방장이 나가거나 게임 화면을 오래 벗어나면 방이 닫혀요.'; });
    $('tile-recruit').addEventListener('click', () => { this.audio.init(); this.openRecruit(); });
    $('tile-roster').addEventListener('click', () => { this.audio.init(); this.openSelect('browse'); });
    $('tile-shop').addEventListener('click', () => { this.audio.init(); this.openShop(); });
    $('tile-quests').addEventListener('click', () => { this.audio.init(); this.openQuests(); });
    $('tile-notes').addEventListener('click', () => { this.audio.init(); this.openNotes(); });
    $('btn-notes-close').addEventListener('click', () => { $('notes').hidden = true; });
    $('btn-horde').addEventListener('click', () => this.openSelect('horde'));
    $('qtabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; this.qTab = b.dataset.t; this.renderQuests(); this.audio.play('click'); });
    $('qlist').addEventListener('click', (e) => { const b = e.target.closest('button[data-id]'); if (!b) return; this.claimFx(this.profile.claim(b.dataset.id)); });
    $('qbonus').addEventListener('click', (e) => { const b = e.target.closest('button[data-bonus]'); if (!b) return; this.claimFx(this.profile.claimBonus(b.dataset.bonus)); });
    $('btn-export').addEventListener('click', async () => {
      const code = this.profile.exportCode(); const ta = $('save-code'); ta.hidden = false; ta.value = code; ta.select();
      try { await navigator.clipboard.writeText(code); $('save-note').textContent = '저장 코드를 복사했어요. 메모장 같은 곳에 붙여 넣어 보관하세요.'; } catch (e) { $('save-note').textContent = '위 코드를 길게 눌러 복사해 보관하세요.'; }
    });
    $('btn-import').addEventListener('click', () => {
      const ta = $('save-code');
      if (ta.hidden || !ta.value.trim().startsWith('ASH3.')) { ta.hidden = false; ta.value = ''; ta.focus(); $('save-note').textContent = '저장 코드를 붙여 넣고 한 번 더 누르세요. 지금 진행 상황은 덮어써져요.'; return; }
      if (this.profile.importCode(ta.value)) { $('save-note').textContent = '불러왔어요.'; this.refreshTop(); this.filterRoster(); this.showHome(); }
      else $('save-note').textContent = '저장 코드가 올바르지 않아요. 전체를 빠짐없이 붙여 넣었는지 확인해 주세요.';
    });
    $('btn-back').addEventListener('click', () => {
      this.audio.play('click');
      if (this.state === 'select' && this.selMode === 'lobby') { this.leaveOnline(); return; }
      if (this.state === 'select' && this.selMode === 'swap') { this.resumeTrainingWith(this.settings.hero); return; }
      if (this.state === 'select' && this.selMode === 'stage') { this.openCampaign(); return; }
      if (this.state === 'select' && this.selMode === 'raid') { this.openRaid(); return; }
      if (this.state === 'select' && this.selMode === 'ranked') { this.openRanked(); return; }
      if ((this.state === 'select' && ['ai', 'ai5', 'horde', 'training'].includes(this.selMode)) || ['campaign', 'raid', 'ranked'].includes(this.state)) { this.openPlay(); return; }
      this.showHome();
    });
    $('btn-go').addEventListener('click', () => {
      this.audio.init();
      const m = this.selMode, owned = this.profile.owns(this.selHero);
      if (m === 'browse') { if (owned) { this.profile.d.assistant = this.selHero; this.profile.save(); this.updateSelectActions(); this.toast('조수를 바꿨어요'); } else this.openRecruit(); return; }
      if (!owned) return;
      if (m === 'ai') this.startOffline(3);
      else if (m === 'ai5') this.startOffline(5);
      else if (m === 'horde') this.startHorde();
      else if (m === 'stage') this.startStage();
      else if (m === 'raid') this.startRaid();
      else if (m === 'ranked') this.startRanked();
      else if (m === 'training') this.startTraining();
      else if (m === 'swap') this.resumeTrainingWith(this.selHero);
    });
    $('btn-pull1').addEventListener('click', () => this.doPull(1));
    $('btn-pull10').addEventListener('click', () => this.doPull(10));
    $('btn-pull-ok').addEventListener('click', (e) => { e.stopPropagation(); $('pullres').hidden = true; this.refreshRecruit(); this.filterRoster(); this.refreshQuestBadge?.(); });
    $('shop-grid').addEventListener('click', (e) => {
      const b = e.target.closest('.sitem'); if (!b || b.disabled) return;
      if (b.dataset.permit) { if (this.profile.buyPermit()) { this.toast('모집 허가증을 교환했어요'); this.audio.play('select'); } }
      else if (this.profile.buyHero(b.dataset.id)) { const h = HERO_MAP[b.dataset.id]; this.toast(`${h.name} 합류`); this.audio.play('win'); this.filterRoster(); }
      this.renderShop(); this.refreshTop();
    });
    $('btn-online-close').addEventListener('click', () => $('online').hidden = true);
    $('btn-host').addEventListener('click', () => this.hostRoom());
    $('btn-join').addEventListener('click', () => this.joinRoom());
    $('in-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') this.joinRoom(); });
    const rng = (id, key, out, fmt) => {
      const el = $(id); el.value = S[key]; $(out).textContent = fmt(S[key]);
      el.addEventListener('input', () => { S[key] = +el.value; $(out).textContent = fmt(S[key]); saveSettings(S); if (key === 'vol') this.audio.setVolume(S.vol); if (key === 'fov') this.resize(); });
    };
    rng('set-sens', 'sens', 'out-sens', v => (+v).toFixed(2));
    rng('set-fov', 'fov', 'out-fov', v => v + '°');
    rng('set-vol', 'vol', 'out-vol', v => Math.round(v * 100) + '%');
    $('btn-settings').addEventListener('click', () => $('settings').hidden = false);
    $('btn-settings-close').addEventListener('click', () => { $('settings').hidden = true; });
    // coupon codes (and the admin code)
    $('code-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const raw = $('code-input').value, code = normCode(raw), note = $('code-note');
      if (!code) return;
      if (await isAdminCode(code)) { this.adminOn = true; $('btn-admin').hidden = false; $('code-input').value = ''; note.textContent = '관리자 도구가 열렸어요.'; this.openAdmin(); return; }
      const c = COUPONS.find(x => normCode(x.code) === code);
      if (!c) { note.textContent = '없는 코드예요. 철자를 확인해 주세요.'; return; }
      const r = this.profile.redeem(c);
      if (!r.ok) { note.textContent = r.msg; return; }
      $('code-input').value = ''; note.textContent = `${c.label}: ${rewardText(c.reward)} 받았어요.`;
      this.refreshTop(); this.audio.ui?.('buy');
    });
    $('btn-admin').addEventListener('click', () => this.openAdmin());
    $('btn-admin-close').addEventListener('click', () => { $('admin').hidden = true; });
    $('adm-apply').addEventListener('click', () => this.adminApplyCurrency());
    $('admin').addEventListener('click', (e) => { const b = e.target.closest('[data-adm]'); if (b) this.adminAction(b.dataset.adm); });
    $('btn-help').addEventListener('click', () => $('help').hidden = false);
    $('btn-help-close').addEventListener('click', () => $('help').hidden = true);
    $('btn-help-el').addEventListener('click', () => { $('help').hidden = true; this.openElChart(); });
    $('btn-elchart-close').addEventListener('click', () => $('elchart').hidden = true);
    $('sel-elbox').addEventListener('click', (e) => { if (e.target.closest('[data-elchart]')) this.openElChart(); });
    $('btn-resume').addEventListener('click', () => { $('pause').hidden = true; this.lock(); });
    $('btn-pause-settings').addEventListener('click', () => { $('settings').hidden = false; });
    $('btn-pause-hero').addEventListener('click', () => { $('pause').hidden = true; this.openTrainingSwap(); });
    $('btn-quit').addEventListener('click', () => { $('pause').hidden = true; this.quitToMenu(); });
    $('btn-again').addEventListener('click', () => this.again());
    $('btn-menu').addEventListener('click', () => { $('results').hidden = true; if (this.net && this.lobby) this.leaveOnline(); else this.quitToMenu(); });
    $('lobby-code').addEventListener('click', () => this.shareInvite());
    $('btn-switch-team').addEventListener('click', () => this.lobbySwitchTeam());
    $('btn-leave-lobby').addEventListener('click', () => this.leaveOnline());
    $('btn-start').addEventListener('click', () => this.hostStart());
    $('opt-fill').addEventListener('change', (e) => { if (this.lobby && this.net?.isHost) { this.lobby.fill = e.target.checked; this.broadcastLobby(); } });
    addEventListener('keydown', (e) => { if (e.code === 'Escape') qsa('.modal').forEach(m => { if (m.id !== 'pause') m.hidden = true; }); });
  }

  toast(msg, ms = 2400) {
    const t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(this.toastT); this.toastT = setTimeout(() => t.hidden = true, ms);
  }

  openPause() {
    if (this.state !== 'game') return;
    if (IS_TOUCH) this.input.locked = false;
    $('pause').hidden = false;
    $('btn-pause-hero').hidden = !this.game?.training;
  }

  // ---------------- game start ----------------
  beginGame(game) {
    this.game?.dispose();
    this.game = game;
    this.setScreen('game');
    $('results').hidden = true;
    $('touch').hidden = !IS_TOUCH;
    this.renderPass.scene = this.gameScene; this.renderPass.camera = this.camera;
    this.resize();
    this.lock();
    $('click-to-play').hidden = IS_TOUCH;
  }

  startTraining() {
    this.leaveOnline(true);
    const mapId = pickMap(this.settings.map);
    this.buildArena(mapId);
    const sim = new Sim({ mode: 'training', difficulty: 1, mapId });
    sim.addPlayer({ id: 'me', name: this.settings.name || '나', team: 0, hero: this.selHero });
    for (let i = 0; i < 6; i++) { const p = sim.addPlayer({ id: 'd' + i, name: '허수아비', team: 1, hero: 'dummy', isDummy: true }); if (i === 5) p.mover = true; }
    sim.startTraining();
    this.beginGame(new Game(this, { role: 'offline', sim, localId: 'me', training: true }));
  }

  openTrainingSwap() { document.exitPointerLock?.(); this.input.locked = false; this.openSelect('swap'); }
  resumeTrainingWith(id) {
    if (!this.game?.training) { this.showHome(); return; }
    this.game.sim.setHero('me', id);
    this.game.setRoster(this.game.sim.roster());
    this.game.setLocalHero(id);
    const g = this.game; this.game = null;
    this.beginGame(g);
  }

  pickBots(sim, used, size = 3) {
    const pool = HEROES.map(h => h.id);
    for (const team of [0, 1]) {
      let n = [...sim.players.values()].filter(p => p.team === team).length, k = 0;
      while (n < size) {
        const avail = pool.filter(id => !used[team].has(id));
        const id = avail[(Math.random() * avail.length) | 0];
        used[team].add(id);
        sim.addPlayer({ id: `b${team}${k++}`, name: HERO_MAP[id].name, team, hero: id, isBot: true });
        n++;
      }
    }
  }

  startOffline(size = 3) {
    this.leaveOnline(true);
    const mapId = pickMap(this.settings.map);
    this.buildArena(mapId);
    const sim = new Sim({ mode: 'match', difficulty: this.settings.diff, mapId });
    sim.addPlayer({ id: 'me', name: this.settings.name || '나', team: 0, hero: this.selHero, mul: this.growthFor(this.selHero) });
    this.pickBots(sim, [new Set([this.selHero]), new Set()], size);
    sim.teamSize = size;
    sim.startMatch();
    this.beginGame(new Game(this, { role: 'offline', sim, localId: 'me', mapId }));
  }

  // ---------------- play / campaign / raid / ranked ----------------
  modeArt(id) { try { return renderSplash(HERO_MAP[id], 300, 440); } catch (e) { return this.portraits[id] || ''; } }
  openPlay() {
    this.setScreen('play'); $('back-label').textContent = '홈';
    this.stage.setHero(HERO_MAP[this.profile.d.assistant] || HERO_MAP.valok, false);
    for (const b of qsa('.mode', $('modes'))) { const a = b.querySelector('.mode__art'); if (!a.style.backgroundImage) a.style.backgroundImage = `url(${this.modeArt(b.dataset.art)})`; }
    const total = CHAPTERS.reduce((a, c) => a + c.stages.length * 3, 0), got = CHAPTERS.reduce((a, c) => a + this.profile.campStars(c), 0);
    const next = CHAPTERS.flatMap(c => c.stages).find(st => !this.profile.stars(st.id));
    $('rec-campaign').textContent = `별 ${got} / ${total}` + (next ? ` · 다음 ${next.id}` : ' · 완료');
    const R = this.profile.rankState(); $('rec-ranked').textContent = `${TIERS[tierOf(R.pts)].name} · ${R.pts}점`;
    const rc = this.profile.d.raid.clears; $('rec-raid').textContent = ['보통', '어려움', '악몽'].map((n, i) => rc[i] ? `${n} ✓` : null).filter(Boolean).join(' · ') || '아직 처치하지 못했어요';
    $('horde-sub').textContent = this.profile.d.hordeBest ? `최고 ${this.profile.d.hordeBest}웨이브` : '';
  }
  chapterOpen(i) { if (i === 0) return true; const prev = CHAPTERS[i - 1]; return this.profile.stars(prev.stages[prev.stages.length - 1].id) > 0; }
  stageOpen(st) { const all = CHAPTERS.flatMap(c => c.stages); const i = all.findIndex(x => x.id === st.id); return i === 0 || this.profile.stars(all[i - 1].id) > 0; }
  openCampaign(ch) {
    if (ch === undefined) ch = this.campCh ?? Math.max(0, CHAPTERS.findIndex((c, i) => this.chapterOpen(i) && c.stages.some(st => !this.profile.stars(st.id))));
    if (ch < 0) ch = 0;
    this.campCh = ch;
    this.setScreen('campaign'); $('back-label').textContent = '출정';
    const C = CHAPTERS[ch];
    $('camp-chapters').innerHTML = CHAPTERS.map((c, i) => `<button data-ch="${i}" class="${i === ch ? 'is-on' : ''}" ${this.chapterOpen(i) ? '' : 'disabled'}><small>${c.sub}</small><b>${c.name}</b><span>${this.chapterOpen(i) ? `별 ${this.profile.campStars(c)} / ${c.stages.length * 3}` : '이전 장을 끝내면 열려요'}</span></button>`).join('');
    $('camp-sub').textContent = C.sub; $('camp-title').textContent = C.name; $('camp-story').textContent = C.story;
    // stages laid out along a winding road
    const pts = C.stages.map((st, i) => ({ x: 8 + i * (84 / (C.stages.length - 1)), y: 50 + Math.sin(i * 1.3 + ch) * 26 }));
    const path = pts.map((p, i) => (i ? 'L' : 'M') + p.x + ' ' + p.y).join(' ');
    $('camp-map').innerHTML = `<svg class="camp__road" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${path}"/></svg>` + C.stages.map((st, i) => {
      const n = this.profile.stars(st.id), open = this.stageOpen(st);
      return `<button class="node node--${st.type}${n ? ' is-clear' : ''}${this.curStage === st.id ? ' is-sel' : ''}" data-st="${st.id}" style="left:${pts[i].x}%;top:${pts[i].y}%" ${open ? '' : 'disabled'}><span class="node__dot"></span><span class="node__id">${st.id}</span><span class="node__name">${st.name}</span><span class="node__stars">${[0, 1, 2].map(k => `<i class="${k < n ? 'on' : ''}"></i>`).join('')}</span></button>`;
    }).join('');
    const sel = C.stages.find(st => st.id === this.curStage);
    if (sel) this.showStage(sel.id); else $('stage-panel').hidden = true;
    this.stage.setHero(HERO_MAP[C.stages[C.stages.length - 1].boss] || HERO_MAP.valok, false);
  }
  showStage(id) {
    const st = STAGE_MAP[id]; this.curStage = id;
    qsa('.node', $('camp-map')).forEach(n => n.classList.toggle('is-sel', n.dataset.st === id));
    const n = this.profile.stars(id);
    const rw = (o) => Object.entries(o || {}).map(([k, v]) => `<span>${{ crystals: '결정', permits: '허가증', essence: '잿빛 정수', seal: '승급 인장', tome: '기술서' }[k]} ${v}</span>`).join('');
    const foes = st.enemies.map(e => `<img src="${this.portraits[e] || ''}" title="${HERO_MAP[e].name}">`).join('');
    $('stage-panel').innerHTML = `<button class="stage__x" id="btn-stage-close" aria-label="닫기">✕</button>
      <p class="stage__type">${STAGE_TYPES[st.type]}${st.type === 'skirmish' && st.rounds > 1 ? ` · 먼저 ${st.rounds}라운드` : ''}${st.type === 'survive' ? ` · ${st.waves}웨이브` : ''}</p>
      <h3>${st.id} ${st.name}</h3><p class="stage__desc">${st.desc}</p>
      <div class="stage__foes">${foes}</div>
      <ul class="stage__stars"><li class="${n >= 1 ? 'on' : ''}">승리</li><li class="${n >= 2 ? 'on' : ''}">한 번도 쓰러지지 않기</li><li class="${n >= 3 ? 'on' : ''}">${st.time}초 안에 끝내기</li></ul>
      <div class="stage__rw"><b>${n ? '반복 보상' : '첫 클리어'}</b>${rw(n ? st.again : { ...st.first, ...Object.fromEntries(Object.entries(st.again).map(([k, v]) => [k, (st.first[k] || 0) + v])) })}${st.perfect && n < 3 ? `<b>별 세 개</b>${rw(st.perfect)}` : ''}</div>
      <p class="stage__lv">권장 육성: 레벨 ${Math.round((st.lv - 0.75) * 60)} 이상</p>
      <button class="btn btn--ember" id="btn-stage-go"><span class="btn__k">출전 준비</span></button>`;
    $('stage-panel').hidden = false;
  }
  openRaid() {
    this.setScreen('raid'); $('back-label').textContent = '출정';
    const d = this.raidDiff || 0, P = this.profile.d.raid;
    $('raid-art').style.backgroundImage = `url(${this.modeArt('ashlord')})`;
    $('raid-title').textContent = RAID.title; $('raid-name').textContent = RAID.name; $('raid-desc').textContent = RAID.desc;
    const rws = [{ crystals: 400, seal: 2, essence: 30, tome: 1 }, { crystals: 700, seal: 4, essence: 50, tome: 2 }, { crystals: 1100, seal: 6, essence: 80, tome: 3 }];
    $('raid-diffs').innerHTML = RAID.diffs.map((x, i) => `<button data-d="${i}" class="${i === d ? 'is-on' : ''}"><b>${x.name}</b><small>${x.desc}</small><span>${P.clears[i] ? `처치 ${P.clears[i]}회 · 최고 ${Math.floor(P.best[i] / 60)}분 ${P.best[i] % 60}초` : '첫 처치 시 허가증 ' + (i + 1)}</span><em>결정 ${rws[i].crystals} · 인장 ${rws[i].seal} · 정수 ${rws[i].essence} · 기술서 ${rws[i].tome}</em></button>`).join('');
    $('raid-go-sub').textContent = `${RAID.diffs[d].name} 난이도`;
    this.stage.setHero(HERO_MAP.ashlord, false);
  }
  openRanked() {
    this.setScreen('ranked'); $('back-label').textContent = '출정';
    const R = this.profile.rankState(), t = tierOf(R.pts), T = TIERS[t], N = TIERS[t + 1];
    $('rank-crest').innerHTML = `<svg viewBox="0 0 120 140"><path d="M60 6 L110 26 L104 86 Q96 116 60 134 Q24 116 16 86 L10 26Z" fill="#141114" stroke="${T.color}" stroke-width="3"/><path d="M60 22 L94 36 L90 82 Q84 104 60 118 Q36 104 30 82 L26 36Z" fill="none" stroke="${T.color}" stroke-opacity=".45"/>${Array.from({ length: t + 1 }, (_, i) => `<path d="M${60 - t * 7 + i * 14} 58 l6 10 -6 10 -6 -10z" fill="${T.color}"/>`).join('')}</svg>`;
    $('rank-season').textContent = `${R.season.replace('-', '년 ')}월 시즌 · 최고 ${TIERS[tierOf(R.best)].name} ${R.best}점`;
    $('rank-tier').textContent = T.name; $('rank-tier').style.color = T.color;
    $('rank-bar').style.width = N ? ((R.pts - T.pts) / (N.pts - T.pts) * 100) + '%' : '100%';
    $('rank-pts').textContent = N ? `${R.pts}점 · ${N.name}까지 ${N.pts - R.pts}점` : `${R.pts}점 · 최고 등급`;
    $('rank-ladder').innerHTML = TIERS.map((x, i) => `<li class="${i === t ? 'is-on' : ''}${R.reached[i] || i <= t ? ' is-past' : ''}" style="--c:${x.color}"><b>${x.name}</b><span>${x.pts}점</span><em>${i ? `처음 도달 시 결정 ${300 * i}${i >= 3 ? ' · 허가증 1' : ''}` : ''}</em></li>`).join('');
    const L = this.profile.d.rank.last;
    $('rank-season-rw').innerHTML = L && !L.claimed ? `<p>지난 시즌(${L.season}) 최고 ${TIERS[tierOf(L.best)].name}</p><button class="btn btn--ghost btn--sm"><span class="btn__k">시즌 보상 받기</span></button>` : `<p>시즌은 매달 1일에 바뀌어요. 바뀌면 점수가 절반이 되고, 최고 등급에 따라 보상을 받아요.</p>`;
    this.stage.setHero(HERO_MAP.hyeon, false);
  }
  openGrowth(id) {
    this.grHero = id; const P = this.profile, g = P.gr(id), h = HERO_MAP[id], m = P.growthMul(id), M = P.d.mats;
    const lc = P.lvCost(id), pc = P.promoteCost(id), sc = P.skillCost(id), cap = P.lvCap(id);
    const cost = (c) => c ? Object.entries(c).map(([k, v]) => `<span class="${(k === 'crystals' ? P.d.crystals : M[k]) >= v ? '' : 'is-short'}">${{ crystals: '결정', essence: '정수', seal: '인장', tome: '기술서' }[k]} ${v}</span>`).join('') : '<span>최대</span>';
    $('gr-title').textContent = `${h.name} 육성`;
    $('gr-body').innerHTML = `
      <div class="gr__mats"><span>잿빛 정수 <b>${M.essence}</b></span><span>승급 인장 <b>${M.seal}</b></span><span>기술서 <b>${M.tome}</b></span><span>결정 <b>${P.d.crystals}</b></span></div>
      <div class="gr__stats"><div><small>레벨</small><b>${g.lv}<i> / ${cap}</i></b></div><div><small>정예화</small><b>${['없음', '1단계', '2단계'][g.elite]}</b></div><div><small>기술 레벨</small><b>${g.sk}<i> / 7</i></b></div><div><small>체력·피해</small><b>+${Math.round((m.hp - 1) * 100)}%</b></div><div><small>기술 대기시간</small><b>-${Math.round((1 - m.cd) * 100)}%</b></div></div>
      <div class="gr__row"><div><b>레벨 올리기</b><p>체력과 피해가 레벨마다 1.2% 오른다.</p><div class="gr__cost">${g.lv < cap ? cost(lc) : '<span>정예화가 필요해요</span>'}</div></div><div class="gr__btns"><button class="btn btn--ember btn--sm" data-act="lv1" ${g.lv < cap ? '' : 'disabled'}><span class="btn__k">+1</span></button><button class="btn btn--ghost btn--sm" data-act="lv10" ${g.lv < cap ? '' : 'disabled'}><span class="btn__k">+10</span></button></div></div>
      <div class="gr__row"><div><b>정예화</b><p>최대 레벨이 오르고 체력과 피해가 6% 더 오른다. 현재 최대 레벨이어야 해요.</p><div class="gr__cost">${cost(pc)}</div></div><div class="gr__btns"><button class="btn btn--ember btn--sm" data-act="promote" ${pc && g.lv >= cap ? '' : 'disabled'}><span class="btn__k">정예화</span></button></div></div>
      <div class="gr__row"><div><b>기술 수련</b><p>Q·E 재사용 대기시간이 단계마다 3% 줄어든다.</p><div class="gr__cost">${cost(sc)}</div></div><div class="gr__btns"><button class="btn btn--ember btn--sm" data-act="skill" ${sc ? '' : 'disabled'}><span class="btn__k">수련</span></button></div></div>
      <p class="gr__note">육성은 캠페인, 레이드, 랭크전, AI 대전, 심연 토벌에 적용돼요. 온라인 대전은 모두 같은 조건으로 싸워요. 재료는 캠페인과 레이드에서 얻어요.</p>`;
    $('growth').hidden = false;
  }
  growthFor(id) { return this.profile.owns(id) ? this.profile.growthMul(id) : null; }
  baseSim(o) { this.leaveOnline(true); const mapId = pickMap(o.map || this.settings.map); this.buildArena(mapId); return { sim: new Sim({ ...o, mapId }), mapId }; }
  pickBotsFor(sim, team, n, used, mul = null) { const pool = HEROES.map(h => h.id).filter(id => !used.has(id)); for (let k = 0; k < n; k++) { const id = pool.splice((Math.random() * pool.length) | 0, 1)[0]; used.add(id); sim.addPlayer({ id: `b${team}${k}`, name: HERO_MAP[id].name, team, hero: id, isBot: true, mul }); } }
  startStage() {
    const st = this.ctx.st; const used = new Set([this.selHero, ...st.enemies]);
    const lv = st.lv, emul = { hp: lv, dmg: Math.pow(lv, 0.8), cd: 1 };
    const raidBoss = st.boss === 'ashlord';
    const { sim, mapId } = this.baseSim({ mode: raidBoss ? 'raid' : st.type === 'survive' ? 'horde' : 'match', difficulty: Math.min(2, Math.max(0, Math.round((lv - 0.8) * 4))), roundsToWin: st.rounds || 1, winWaves: st.waves || 0, map: st.map });
    sim.addPlayer({ id: 'me', name: this.settings.name || '나', team: 0, hero: this.selHero, mul: this.growthFor(this.selHero) });
    this.pickBotsFor(sim, 0, st.allies, used);
    if (st.type !== 'survive') st.enemies.forEach((id, k) => sim.addPlayer({ id: `e${k}`, name: (id === st.boss ? (raidBoss ? '' : '우두머리 ') : '') + HERO_MAP[id].name, team: 1, hero: id, isBot: true, mul: id === st.boss && !raidBoss ? { hp: emul.hp * 2.4, dmg: emul.dmg * 1.15, cd: 0.85 } : emul }));
    sim.startMatch();
    if (st.type === 'survive') for (const p of sim.players.values()) if (p.team === 1) { p.hpMul = (p.hpMul || 1) * lv; }
    if (st.boss && !raidBoss) for (const p of sim.players.values()) if (p.hero === st.boss && p.team === 1) { p.st.giant = { t: 9999, v: 0 }; p.boss = true; }
    this.beginGame(new Game(this, { role: 'offline', sim, localId: 'me', mapId, horde: st.type === 'survive' }));
  }
  startRaid() {
    const D = RAID.diffs[this.ctx.diff || 0];
    const { sim, mapId } = this.baseSim({ mode: 'raid', difficulty: Math.min(2, this.ctx.diff + 1), map: 'forge' });
    sim.addPlayer({ id: 'me', name: this.settings.name || '나', team: 0, hero: this.selHero, mul: this.growthFor(this.selHero) });
    this.pickBotsFor(sim, 0, 2, new Set([this.selHero]));
    sim.addPlayer({ id: 'boss', name: RAID.name, team: 1, hero: RAID.boss, isBot: true, mul: { hp: D.mul, dmg: D.dmg, cd: 1 } });
    sim.startMatch();
    this.beginGame(new Game(this, { role: 'offline', sim, localId: 'me', mapId }));
  }
  startRanked() {
    const R = this.profile.rankState(), t = tierOf(R.pts);
    const { sim, mapId } = this.baseSim({ mode: 'match', difficulty: Math.min(2, Math.floor(t / 2)), roundsToWin: 2, map: 'random' });
    sim.addPlayer({ id: 'me', name: this.settings.name || '나', team: 0, hero: this.selHero, mul: this.growthFor(this.selHero) });
    const used = new Set([this.selHero]);
    this.pickBotsFor(sim, 0, 2, used);
    const em = 0.92 + 0.07 * t; this.pickBotsFor(sim, 1, 3, used, { hp: em, dmg: em, cd: 1 });
    sim.startMatch();
    this.beginGame(new Game(this, { role: 'offline', sim, localId: 'me', mapId }));
  }

  startHorde() {
    this.leaveOnline(true);
    const mapId = pickMap(this.settings.map);
    this.buildArena(mapId);
    const sim = new Sim({ mode: 'horde', difficulty: this.settings.diff, mapId });
    sim.addPlayer({ id: 'me', name: this.settings.name || '나', team: 0, hero: this.selHero, mul: this.growthFor(this.selHero) });
    const pool = HEROES.map(h => h.id).filter(id => id !== this.selHero);
    for (let k = 0; k < 2; k++) { const id = pool.splice((Math.random() * pool.length) | 0, 1)[0]; sim.addPlayer({ id: 'b0' + k, name: HERO_MAP[id].name, team: 0, hero: id, isBot: true }); }
    sim.startMatch();
    this.beginGame(new Game(this, { role: 'offline', sim, localId: 'me', mapId, horde: true }));
  }

  quitToMenu() {
    document.exitPointerLock?.();
    this.input.locked = false;
    if (this.net && this.lobby) { this.backToLobby(true); return; }
    this.game?.dispose(); this.game = null;
    $('results').hidden = true; $('scoreboard').hidden = true;
    this.showHome();
  }

  showResults(win, score, game, extra = {}) {
    document.exitPointerLock?.();
    this.input.locked = false;
    const my = game.myTeam();
    $('hud').classList.remove('is-on');
    const horde = !!extra.horde;
    const ctx = this.net ? null : this.ctx;
    const kind = ctx?.type || null;
    $('res-title').textContent = kind === 'raid' ? (win ? '토벌 성공' : '시간 초과') : kind === 'stage' && horde ? (win ? '방어 성공' : '방어 실패') : horde ? '심연 토벌 종료' : win ? '승리' : '패배';
    $('res-title').className = 'results__title ' + (win || horde ? 'is-win' : 'is-lose');
    $('res-score').textContent = horde ? `${score[0]}웨이브 돌파${score[0] > this.profile.d.hordeBest ? ' · 최고 기록!' : ''}` : `${score[my]} : ${score[1 - my]}`;
    $('res-body').innerHTML = game.scoreboardRows();
    const me = game.view.get(game.localId);
    const ls = game.localStats || {};
    const rw = this.profile.reward({ win, kills: me?.stats?.k || 0, mode: kind === 'stage' ? 'stage' : kind === 'raid' ? 'raid' : kind === 'ranked' ? 'ranked' : horde ? 'horde' : this.net ? 'online' : 'ai', diff: this.settings.diff, rounds: score[my], waves: horde ? score[0] : 0, stats: { skill: ls.skill, ult: ls.ult, heal: me?.stats?.heal, dmg: me?.stats?.dmg } });
    const qn = this.profile.claimable();
    let extraHtml = '';
    const rwTxt = (r) => [r.crystals ? `결정 +${r.crystals}` : '', r.permits ? `허가증 +${r.permits}` : '', r.essence ? `정수 +${r.essence}` : '', r.seal ? `인장 +${r.seal}` : '', r.tome ? `기술서 +${r.tome}` : ''].filter(Boolean).join(' · ');
    if (kind === 'stage') {
      const st = ctx.st, t = extra.time || 999;
      const starsGot = win ? 1 + ((me?.stats?.d || 0) === 0 ? 1 : 0) + (t <= st.time ? 1 : 0) : 0;
      $('res-score').innerHTML = `${st.id} ${st.name}<span class="res-stars">${[0, 1, 2].map(k => `<i class="${k < starsGot ? 'on' : ''}">★</i>`).join('')}</span>`;
      if (win) { const r = this.profile.clearStage(st, starsGot); extraHtml = `<span class="lvup">${r.first ? '첫 클리어 · ' : ''}${rwTxt(r)}</span>`; }
    } else if (kind === 'raid') {
      const t = extra.raidTime || extra.time || 0;
      $('res-score').textContent = win ? `${RAID.diffs[ctx.diff].name} · ${Math.floor(t / 60)}분 ${Math.round(t % 60)}초` : `${RAID.diffs[ctx.diff].name} · 4분 안에 쓰러뜨리지 못했어요`;
      if (win) { const r = this.profile.raidClear(ctx.diff, t); extraHtml = `<span class="lvup">${rwTxt(r)}</span>`; }
    } else if (kind === 'ranked') {
      const r = this.profile.rankResult(win), R = this.profile.d.rank;
      extraHtml = `<span class="lvup">${TIERS[r.tier].name} ${R.pts}점 (${win ? '+30' : '-18'})${r.up ? ' · 승급!' : ''}${r.crystals ? ' · ' + rwTxt(r) : ''}</span>`;
    }
    $('res-reward').innerHTML = extraHtml + (rw.crystals ? `<span><i class="cur__ico cur__ico--crystal"></i>잿빛 결정 +${rw.crystals}</span>` : '') + `<span>경험치 +${rw.xp}</span>${qn ? `<span class="lvup">받을 수 있는 임무 보상 ${qn}개</span>` : ''}${rw.ups.length ? `<span class="lvup">레벨 ${rw.ups[rw.ups.length - 1]} 달성 · 결정 +${300 * rw.ups.length}${rw.ups.some(l => l % 5 === 0) ? ' · 허가증 +1' : ''}</span>` : ''}`;
    this.refreshTop();
    const online = !!this.net;
    $('btn-again').hidden = online && !this.net.isHost;
    $('btn-again').querySelector('.btn__k').textContent = online ? '로비로' : '다시 하기';
    $('btn-menu').querySelector('.btn__k').textContent = online ? '방 나가기' : '홈으로';
    $('results').hidden = false;
    this.audio.play(win ? 'win' : 'lose');
  }

  again() { $('results').hidden = true; if (this.net) { this.backToLobby(true); return; } const h = this.game?.horde; this.game?.dispose(); this.game = null; const k = this.ctx?.type; if (k === 'stage') { this.openCampaign(); return; } if (k === 'raid') { this.openRaid(); return; } if (k === 'ranked') { this.openSelect('ranked'); return; } this.openSelect(h ? 'horde' : 'ai'); }

  // ---------------- online ----------------
  async hostRoom() {
    const name = ($('in-name').value || '').trim() || '방장';
    this.settings.name = name; saveSettings(this.settings);
    this.leaveOnline(true);
    const note = $('online-note');
    note.textContent = '방을 여는 중…';
    const net = new Net();
    let code;
    for (let i = 0; i < 3; i++) {
      code = makeCode();
      try { await net.host(code); break; } catch (e) { if (e.message !== 'taken' || i === 2) { note.textContent = this.netErr(e); net.close(); return; } }
    }
    this.net = net; this.myId = 'h';
    this.peerMap = new Map(); this.nextPid = 1;
    this.lobby = { code, players: [{ id: 'h', name, team: 0, hero: this.settings.hero, host: true }], fill: true, diff: this.settings.diff, map: 'random', size: 3, inGame: false };
    net.on({ join: (peer) => this.onPeerJoin(peer), leave: (peer) => this.onPeerLeave(peer), data: (peer, m) => this.onHostData(peer, m),
      status: (st) => { if (st === 'reconnecting') this.toast('방 연결을 다시 잇는 중…'); else if (st === 'lost') this.toast('방이 중계 서버에서 끊겼어요. 새 친구는 들어올 수 없어요. 방을 다시 만들어 주세요.'); } });
    $('online').hidden = true;
    this.openSelect('lobby');
  }

  async joinRoom() {
    const name = ($('in-name').value || '').trim() || '도전자';
    const code = cleanCode($('in-code').value);
    $('in-code').value = code;
    const note = $('online-note');
    if (code.length !== 5) { note.textContent = '방 코드는 다섯 글자예요.'; return; }
    this.settings.name = name; saveSettings(this.settings);
    this.leaveOnline(true);
    note.textContent = '연결하는 중…';
    const net = new Net();
    net.on({ data: (_, m) => this.onClientData(m), leave: () => this.onHostLost() });
    const stages = { server: '중계 서버에 접속하는 중…', search: `방 ${code}을(를) 찾는 중…`, p2p: '방을 찾았어요. 방장과 직접 연결하는 중…' };
    try { await net.join(code, (st) => { note.textContent = stages[st] || note.textContent; }); }
    catch (e) { note.textContent = this.netErr(e); net.close(); return; }
    this.net = net;
    net.send('host', { t: 'hello', name, hero: this.settings.hero });
    note.textContent = '입장했어요.';
  }

  inviteUrl() { return location.origin + location.pathname + '?join=' + (this.lobby?.code || ''); }
  async shareInvite() {
    const code = this.lobby?.code; if (!code) return;
    const url = this.inviteUrl();
    const text = `잿빛 성역 같이 하자! 방 코드 ${code}`;
    try { await navigator.clipboard?.writeText(`${text}\n${url}`); this.toast('초대 링크를 복사했어요. 보낸 뒤 이 화면으로 바로 돌아와 주세요'); } catch (e) { this.toast('방 코드: ' + code); }
  }

  netErr(e) {
    const m = e?.message || e?.type || '';
    if (m === 'notfound') return '그 코드의 방을 찾지 못했어요. 코드가 맞는지, 방장이 게임 화면을 켜 두고 있는지 확인해 주세요. (방장이 다른 앱으로 오래 나가 있으면 방이 닫혀요)';
    if (m === 'server') return '중계 서버에 접속하지 못했어요. 인터넷 연결을 확인하고 잠시 후 다시 시도해 주세요.';
    if (m === 'p2p') return '방은 찾았지만 방장과 직접 연결이 막혔어요. 휴대폰 데이터에서 자주 생겨요. 두 사람 중 한 명이라도 와이파이로 바꾸거나, 방장을 바꿔서 다시 시도해 주세요.';
    if (m === 'timeout') return '연결 시간이 초과됐어요. 네트워크를 확인하고 다시 시도해 주세요.';
    if (m === 'nolib') return '연결 모듈을 불러오지 못했어요. 페이지를 새로고침해 주세요.';
    return '연결에 실패했어요 (' + m + '). 잠시 후 다시 시도해 주세요.';
  }

  leaveOnline(silent = false) {
    if (!this.net) return;
    try { if (!this.net.isHost) this.net.send('host', { t: 'bye' }); else this.net.broadcast({ t: 'closed' }); } catch (e) { }
    this.net.close();
    this.net = null; this.lobby = null; this.myId = null;
    if (this.game && this.game.role !== 'offline') { this.game.dispose(); this.game = null; }
    qsa('.sigil').forEach(s => s.classList.remove('is-taken'));
    this.updateLobbyUi();
    if (!silent) this.showHome();
  }

  onHostLost() {
    if (!this.net) return;
    this.net.close(); this.net = null; this.lobby = null;
    if (this.game) { this.game.dispose(); this.game = null; document.exitPointerLock?.(); }
    $('results').hidden = true; $('pause').hidden = true;
    this.updateLobbyUi();
    this.showHome();
    this.toast('방장과 연결이 끊겼어요', 3500);
  }

  onPeerJoin(peer) {
    const L = this.lobby;
    if (L.inGame) { this.net.send(peer, { t: 'busy' }); return; }
    if (L.players.length >= (L.size || 3) * 2) { this.net.send(peer, { t: 'full' }); return; }
    const pid = 'c' + this.nextPid++;
    this.peerMap.set(peer, pid);
    const ta = L.players.filter(p => p.team === 0).length, tb = L.players.length - ta;
    L.players.push({ id: pid, name: '도전자', team: ta <= tb ? 0 : 1, hero: null, peer });
    this.net.send(peer, { t: 'welcome', id: pid });
    this.broadcastLobby();
    this.audio.play('tick');
  }
  onPeerLeave(peer) {
    const L = this.lobby; if (!L) return;
    const pid = this.peerMap.get(peer); if (!pid) return;
    this.peerMap.delete(peer);
    const p = L.players.find(x => x.id === pid);
    L.players = L.players.filter(x => x.id !== pid);
    if (this.game?.sim && this.game.role === 'host') { this.game.sim.makeBot(pid); const sp = this.game.sim.players.get(pid); if (sp) sp.name += ' (AI)'; this.net.broadcast({ t: 'roster', list: this.game.sim.roster() }); this.game.setRoster(this.game.sim.roster()); }
    if (p) this.toast(`${p.name} 님이 나갔어요`);
    this.broadcastLobby();
  }
  onHostData(peer, m) {
    const L = this.lobby; if (!L) return;
    const pid = this.peerMap.get(peer); if (!pid) return;
    const p = L.players.find(x => x.id === pid);
    switch (m.t) {
      case 'hello': if (p) { p.name = String(m.name || '도전자').slice(0, 10); this.assignHero(p, m.hero); this.broadcastLobby(); } break;
      case 'pick': if (p && !L.inGame) { this.assignHero(p, m.hero); this.broadcastLobby(); } break;
      case 'team': if (p && !L.inGame) { const other = 1 - p.team; if (L.players.filter(x => x.team === other).length < (L.size || 3)) { p.team = other; this.assignHero(p, p.hero); } this.broadcastLobby(); } break;
      case 'st': if (this.game?.sim) this.game.sim.clientState(pid, m); break;
      case 'cast': if (this.game?.sim) { const sp = this.game.sim.players.get(pid); if (sp && m.pos && sp.alive) sp.pos = m.pos; this.game.sim.cast(pid, m.slot, m.aim, true); } break;
      case 'reload': if (this.game?.sim) this.game.sim.reload(pid); break;
      case 'bye': this.onPeerLeave(peer); break;
    }
  }
  assignHero(p, want) {
    const L = this.lobby;
    const taken = new Set(L.players.filter(x => x !== p && x.team === p.team).map(x => x.hero));
    if (want && HERO_MAP[want] && want !== 'dummy' && !taken.has(want)) p.hero = want;
    else if (!p.hero || taken.has(p.hero)) p.hero = ['valok', 'igna', 'selene', 'mor', 'grave'].find(id => !taken.has(id));
  }
  broadcastLobby() {
    const L = this.lobby; if (!L) return;
    const pub = { code: L.code, players: L.players.map(({ id, name, team, hero, host }) => ({ id, name, team, hero, host })), fill: L.fill, diff: L.diff, map: L.map, size: L.size || 3, inGame: L.inGame };
    this.net.broadcast({ t: 'lobby', lobby: pub });
    this.updateLobbyUi();
  }
  lobbyPick(id) {
    if (!this.lobby || !this.net) return;
    if (this.net.isHost) { const me = this.lobby.players.find(p => p.id === 'h'); if (me && me.hero !== id) { this.assignHero(me, id); this.broadcastLobby(); } }
    else this.net.send('host', { t: 'pick', hero: id });
  }
  lobbySwitchTeam() {
    if (!this.lobby) return;
    if (this.net.isHost) {
      const me = this.lobby.players.find(p => p.id === 'h');
      const other = 1 - me.team;
      if (this.lobby.players.filter(x => x.team === other).length >= (this.lobby.size || 3)) { this.toast('상대 팀이 가득 찼어요'); return; }
      me.team = other; this.assignHero(me, me.hero); this.broadcastLobby();
    } else this.net.send('host', { t: 'team' });
  }
  hostStart() {
    const L = this.lobby; if (!L || !this.net?.isHost) return;
    const counts = [0, 1].map(t => L.players.filter(p => p.team === t).length);
    if (!L.fill && (counts[0] === 0 || counts[1] === 0)) { this.toast('양 팀에 한 명 이상 있어야 해요. 빈 자리 AI를 켜 보세요.'); return; }
    const mapId = pickMap(L.map);
    this.buildArena(mapId);
    const sim = new Sim({ mode: 'match', difficulty: L.diff, mapId });
    const used = [new Set(), new Set()];
    for (const p of L.players) { if (!p.hero) this.assignHero(p, null); sim.addPlayer({ id: p.id, name: p.name, team: p.team, hero: p.hero }); used[p.team].add(p.hero); }
    if (L.fill) this.pickBots(sim, used, L.size || 3);
    sim.teamSize = L.size || 3;
    sim.startMatch();
    L.inGame = true;
    const roster = sim.roster();
    this.net.broadcast({ t: 'start', roster, map: mapId });
    this.broadcastLobby();
    this.beginGame(new Game(this, { role: 'host', sim, net: this.net, localId: 'h', roster, mapId }));
  }
  backToLobby(broadcast) {
    this.game?.dispose(); this.game = null;
    document.exitPointerLock?.();
    this.input.locked = false;
    $('results').hidden = true;
    if (this.lobby) this.lobby.inGame = false;
    if (broadcast && this.net?.isHost) { this.net.broadcast({ t: 'toLobby' }); this.broadcastLobby(); }
    this.openSelect('lobby');
  }

  onClientData(m) {
    switch (m.t) {
      case 'welcome': this.myId = m.id; $('online').hidden = true; break;
      case 'lobby': { const first = !this.lobby; this.lobby = m.lobby; if (first && this.state !== 'game') this.openSelect('lobby'); else this.updateLobbyUi(); break; }
      case 'busy': this.toast('이미 경기가 진행 중인 방이에요'); this.leaveOnline(); break;
      case 'full': this.toast('방이 가득 찼어요'); this.leaveOnline(); break;
      case 'closed': this.onHostLost(); break;
      case 'start': {
        const me = m.roster.find(r => r.id === this.myId);
        if (me) this.selHero = me.hero;
        this.buildArena(m.map || 'sanctum');
        this.beginGame(new Game(this, { role: 'client', net: this.net, localId: this.myId, roster: m.roster, mapId: m.map }));
        break;
      }
      case 'toLobby': this.backToLobby(false); break;
      default: this.game?.onNet('host', m);
    }
  }

  updateLobbyUi() {
    const L = this.lobby;
    const inLobby = !!(L && this.net);
    $('lobby-panel').hidden = !(inLobby && this.state === 'select');
    $('lobby-badge').hidden = !inLobby;
    $('select').classList.toggle('is-lobby', inLobby && this.state === 'select');
    if (!inLobby) { qsa('.sigil').forEach(s => s.classList.remove('is-taken')); return; }
    $('lobby-badge').textContent = this.net.isHost ? '방장' : '참가자';
    $('lobby-code').textContent = L.code;
    const my = L.players.find(p => p.id === this.myId);
    for (const [team, el] of [[0, $('team-a')], [1, $('team-b')]]) {
      const ps = L.players.filter(p => p.team === team);
      let html = ps.map(p => `<li>${p.hero ? `<img src="${this.portraits[p.hero]}" alt="">` : ''}<span>${esc(p.name)}</span>${p.id === this.myId ? '<span class="me-tag">나</span>' : ''}${p.host ? '<span class="me-tag">방장</span>' : ''}</li>`).join('');
      for (let i = ps.length; i < (L.size || 3); i++) html += `<li class="empty">${L.fill ? 'AI' : '빈 자리'}</li>`;
      el.innerHTML = html;
    }
    $('opt-fill').checked = L.fill; $('opt-fill').disabled = !this.net.isHost;
    qsa('button', $('lobby-diff')).forEach(b => { b.classList.toggle('is-on', +b.dataset.d === L.diff); b.disabled = !this.net.isHost; });
    qsa('button', $('lobby-size')).forEach(b => { b.classList.toggle('is-on', +b.dataset.n === (L.size || 3)); b.disabled = !this.net.isHost; });
    this.refreshChips();
    $('btn-start').hidden = !this.net.isHost;
    $('lobby-note').textContent = this.net.isHost ? `방 코드를 누르면 초대 링크가 복사돼요. 친구에게 보낸 뒤 이 화면으로 바로 돌아와 주세요. 방장이 다른 앱에 오래 있으면 방이 닫혀요.` : '아래에서 영웅을 고르고 방장을 기다려요.';
    if (my) {
      const taken = new Set(L.players.filter(p => p.team === my.team && p.id !== this.myId).map(p => p.hero));
      qsa('.sigil').forEach(s => s.classList.toggle('is-taken', taken.has(s.dataset.id)));
      if (my.hero && my.hero !== this.selHero && this.profile.owns(my.hero) && this.state === 'select') { const L0 = this.lobby; this.lobby = null; this.setHero(my.hero, false); this.lobby = L0; }
    }
  }

  // ---------------- loop ----------------
  frame(t) {
    requestAnimationFrame((tt) => this.frame(tt));
    const dt = Math.min(this.dtCap || 0.05, (t - this.last) / 1000);
    this.last = t;
    const I = this.input;
    if (this.state === 'game' && this.game) {
      if (IS_TOUCH) I.locked = $('pause').hidden && $('results').hidden;
      this.game.update(dt, I);
      this.world.update(t / 1000);
      this.fx.ambient(dt, this.world.theme.particles);
      this.fx.braziers(this.world.braziers, dt);
      this.fx.update(dt);
      if (!$('scoreboard').hidden && !IS_TOUCH) $('board-body').innerHTML = this.game.scoreboardRows();
    } else if (this.state !== 'loading') {
      this.stage.update(dt, this.state === 'select' ? this.focus : 0);
    }
    I.dx = 0; I.dy = 0; I.pressed.length = 0; I.pressedMouse = false;
    this.composer.render(dt);
  }
}

function tick() { return new Promise(r => setTimeout(r, 16)); }

const app = new App();
// the app handle is only exposed on a local dev server (tests); on the live site it stays out of the console
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) window.__app = app;
installGuard({
  onOpen: () => { $('devguard').hidden = false; try { document.exitPointerLock?.(); } catch (e) { } },
  onClose: () => { $('devguard').hidden = true; },
});
app.boot().catch((e) => {
  console.error(e);
  document.querySelector('.loading__text').textContent = '불러오기에 실패했어요: ' + e.message;
});
