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
import { icon } from './icons.js';
import { Stage, renderPortraits } from './stage.js';
import { Game, esc } from './game.js';
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
    { const pm = new THREE.PMREMGenerator(r); this.vmScene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; this.vmScene.environmentIntensity = 0.32; pm.dispose(); }
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
    this.vmCam.aspect = w / h; this.vmCam.fov = w / h < 1.4 ? 72 : 64; this.vmCam.updateProjectionMatrix();
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
    for (const s of ['home', 'select', 'recruit', 'shop']) $(s).scrollTop = 0;
    for (const s of ['home', 'select', 'recruit', 'shop']) $(s).classList.toggle('is-on', s === name);
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
    $('battle-sub').hidden = true;
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
    const sorted = [...HEROES].sort((a, b) => (b.rarity - a.rarity));
    $('roster').innerHTML = sorted.map(h => `<button class="sigil" data-id="${h.id}" data-r="${h.rarity}" style="--rc:${ROLES[h.role].color}" title="${h.name} · ${h.title}"><span class="sigil__frame"></span><span class="sigil__img" style="background-image:url(${this.portraits[h.id]})"></span><span class="sigil__stars">${stars(h.rarity)}</span><span class="sigil__role"></span><span class="sigil__pot" hidden></span></button>`).join('');
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
      s.hidden = !(f === 'all' || (f === 'owned' ? owned : h.role === f));
      const pot = s.querySelector('.sigil__pot'); const pv = this.profile.pot(h.id);
      pot.hidden = pv < 2; pot.textContent = '잠재 ' + pv;
    });
  }

  openSelect(mode) {
    this.selMode = mode;
    this.setScreen('select');
    $('back-label').textContent = mode === 'lobby' ? '방 나가기' : mode === 'swap' ? '훈련장' : '홈';
    if (!this.profile.owns(this.selHero) && mode !== 'browse') this.selHero = this.profile.owns(this.settings.hero) ? this.settings.hero : 'valok';
    this.filterRoster();
    this.setHero(this.selHero, false);
    this.updateSelectActions();
    this.updateLobbyUi();
  }

  updateSelectActions() {
    const m = this.selMode, owned = this.profile.owns(this.selHero);
    $('sel-actions').hidden = m === 'lobby';
    $('opt-map').hidden = !(m === 'ai' || m === 'training');
    $('opt-diff').hidden = m !== 'ai';
    qsa('button', $('diff-seg')).forEach(b => b.classList.toggle('is-on', +b.dataset.d === this.settings.diff));
    const note = $('locked-note');
    note.hidden = owned;
    note.textContent = '아직 모집하지 않은 영웅이에요. 모집이나 상점에서 얻을 수 있어요.';
    const go = $('btn-go'), k = go.querySelector('.btn__k'), sub = $('btn-go-sub');
    go.disabled = false;
    if (m === 'browse') { k.textContent = owned ? (this.profile.d.assistant === this.selHero ? '현재 조수' : '조수로 설정') : '모집하러 가기'; sub.textContent = owned ? '홈 화면에 이 영웅이 서 있어요' : ''; }
    else if (m === 'ai') { k.textContent = '전투 시작'; sub.textContent = '3대3 · 먼저 3라운드'; go.disabled = !owned; }
    else if (m === 'training') { k.textContent = '훈련 시작'; sub.textContent = '허수아비로 스킬 연습'; go.disabled = !owned; }
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
    $('sel-stars').textContent = stars(h.rarity); $('sel-stars').className = 'stars stars--' + h.rarity;
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
      return `<li class="skill${s === 'x' ? ' skill--ult' : ''}"><div class="rune"><img src="${icon(d.icon, s === 'x' ? '#ffb08a' : '#efe0c0')}" alt=""><span class="rune__key">${SLOT_KEYS[s]}</span></div><div><div class="skill__name">${d.name}<span class="skill__cd">${cd}</span></div><div class="skill__desc">${d.desc}</div></div></li>`;
    }).join('');
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
    const res = this.profile.pull(n);
    if (!res) { this.toast('잿빛 결정이 부족해요. 경기에서 결정을 모아 보세요.'); return; }
    const top = Math.max(...res.map(r => r.rarity));
    const wrap = $('pullres'), cards = $('pull-cards'), flash = $('pull-flash');
    cards.classList.toggle('is-one', n === 1);
    cards.innerHTML = res.map(r => {
      if (!r.id) return `<div class="pcard" data-r="3"><div class="pcard__in"><div class="pcard__face"><div class="pcard__name">잔불</div><div class="pcard__meta">잔불 증표 +${r.tokens}</div></div><div class="pcard__back"></div></div></div>`;
      const h = HERO_MAP[r.id];
      return `<div class="pcard" data-r="${r.rarity}"><div class="pcard__in"><div class="pcard__face" style="background-image:url(${this.portraits[r.id]})">${r.isNew ? '<span class="pcard__new">NEW</span>' : ''}<div class="stars stars--${r.rarity}">${stars(r.rarity)}</div><div class="pcard__name">${h.name}</div><div class="pcard__meta">${r.isNew ? h.title : `잠재 ${r.pot} · 증표 +${r.tokens}`}</div></div><div class="pcard__back"></div></div></div>`;
    }).join('');
    flash.style.background = top >= 6 ? 'radial-gradient(circle, rgba(255,170,80,.95), rgba(255,90,20,.4) 40%, transparent 70%)' : top === 5 ? 'radial-gradient(circle, rgba(255,230,160,.85), transparent 60%)' : 'radial-gradient(circle, rgba(170,130,255,.7), transparent 60%)';
    flash.classList.remove('is-go'); void flash.offsetWidth; flash.classList.add('is-go');
    wrap.hidden = false;
    this.audio.play(top >= 6 ? 'ult' : 'select');
    const list = qsa('.pcard', cards);
    clearInterval(this.pullT);
    let i = 0;
    clearTimeout(this.pullT0);
    this.pullT0 = setTimeout(() => {
      this.pullT = setInterval(() => {
        if (i >= list.length) { clearInterval(this.pullT); return; }
        const c = list[i++]; c.classList.add('is-open');
        const rr = +c.dataset.r; this.audio.play(rr >= 6 ? 'win' : rr === 5 ? 'heal' : 'tick');
      }, n === 1 ? 10 : 230);
    }, 700);
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
    seg($('lobby-diff'), (b) => { S.diff = +b.dataset.d; saveSettings(S); if (this.lobby && this.net?.isHost) { this.lobby.diff = S.diff; this.broadcastLobby(); } });
    qsa('button', $('set-q')).forEach(b => b.classList.toggle('is-on', b.dataset.q === S.q));
    seg($('set-q'), (b) => { S.q = b.dataset.q; saveSettings(S); this.applyQuality(); const m = this.world?.mapId; this.world?.dispose(); this.world = null; if (m) this.buildArena(m); });
    $('tile-battle').addEventListener('click', () => { this.audio.init(); this.audio.play('click'); $('battle-sub').hidden = !$('battle-sub').hidden; });
    $('btn-ai').addEventListener('click', () => this.openSelect('ai'));
    $('btn-training').addEventListener('click', () => this.openSelect('training'));
    $('btn-online').addEventListener('click', () => { this.audio.init(); $('in-name').value = S.name || ''; $('online').hidden = false; $('online-note').textContent = '브라우저끼리 직접 연결돼요. 방장이 나가거나 게임 화면을 오래 벗어나면 방이 닫혀요.'; });
    $('tile-recruit').addEventListener('click', () => { this.audio.init(); this.openRecruit(); });
    $('tile-roster').addEventListener('click', () => { this.audio.init(); this.openSelect('browse'); });
    $('tile-shop').addEventListener('click', () => { this.audio.init(); this.openShop(); });
    $('btn-back').addEventListener('click', () => {
      this.audio.play('click');
      if (this.state === 'select' && this.selMode === 'lobby') { this.leaveOnline(); return; }
      if (this.state === 'select' && this.selMode === 'swap') { this.resumeTrainingWith(this.settings.hero); return; }
      this.showHome();
    });
    $('btn-go').addEventListener('click', () => {
      this.audio.init();
      const m = this.selMode, owned = this.profile.owns(this.selHero);
      if (m === 'browse') { if (owned) { this.profile.d.assistant = this.selHero; this.profile.save(); this.updateSelectActions(); this.toast('조수를 바꿨어요'); } else this.openRecruit(); return; }
      if (!owned) return;
      if (m === 'ai') this.startOffline();
      else if (m === 'training') this.startTraining();
      else if (m === 'swap') this.resumeTrainingWith(this.selHero);
    });
    $('btn-pull1').addEventListener('click', () => this.doPull(1));
    $('btn-pull10').addEventListener('click', () => this.doPull(10));
    $('btn-pull-skip').addEventListener('click', () => { clearTimeout(this.pullT0); clearInterval(this.pullT); qsa('.pcard').forEach(c => c.classList.add('is-open')); });
    $('btn-pull-ok').addEventListener('click', () => { clearTimeout(this.pullT0); clearInterval(this.pullT); $('pullres').hidden = true; this.refreshRecruit(); this.filterRoster(); });
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
    $('btn-help').addEventListener('click', () => $('help').hidden = false);
    $('btn-help-close').addEventListener('click', () => $('help').hidden = true);
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

  pickBots(sim, used) {
    const pool = HEROES.map(h => h.id);
    for (const team of [0, 1]) {
      let n = [...sim.players.values()].filter(p => p.team === team).length, k = 0;
      while (n < 3) {
        const avail = pool.filter(id => !used[team].has(id));
        const id = avail[(Math.random() * avail.length) | 0];
        used[team].add(id);
        sim.addPlayer({ id: `b${team}${k++}`, name: HERO_MAP[id].name, team, hero: id, isBot: true });
        n++;
      }
    }
  }

  startOffline() {
    this.leaveOnline(true);
    const mapId = pickMap(this.settings.map);
    this.buildArena(mapId);
    const sim = new Sim({ mode: 'match', difficulty: this.settings.diff, mapId });
    sim.addPlayer({ id: 'me', name: this.settings.name || '나', team: 0, hero: this.selHero });
    this.pickBots(sim, [new Set([this.selHero]), new Set()]);
    sim.startMatch();
    this.beginGame(new Game(this, { role: 'offline', sim, localId: 'me', mapId }));
  }

  quitToMenu() {
    document.exitPointerLock?.();
    this.input.locked = false;
    if (this.net && this.lobby) { this.backToLobby(true); return; }
    this.game?.dispose(); this.game = null;
    $('results').hidden = true; $('scoreboard').hidden = true;
    this.showHome();
  }

  showResults(win, score, game) {
    document.exitPointerLock?.();
    this.input.locked = false;
    const my = game.myTeam();
    $('hud').classList.remove('is-on');
    $('res-title').textContent = win ? '승리' : '패배';
    $('res-title').className = 'results__title ' + (win ? 'is-win' : 'is-lose');
    $('res-score').textContent = `${score[my]} : ${score[1 - my]}`;
    $('res-body').innerHTML = game.scoreboardRows();
    const me = game.view.get(game.localId);
    const rw = this.profile.reward({ win, kills: me?.stats?.k || 0, mode: this.net ? 'online' : 'ai', diff: this.settings.diff, rounds: score[my] });
    $('res-reward').innerHTML = `<span><i class="cur__ico cur__ico--crystal"></i>잿빛 결정 +${rw.crystals}</span><span>경험치 +${rw.xp}</span>${rw.ups.length ? `<span class="lvup">레벨 ${rw.ups[rw.ups.length - 1]} 달성 · 결정 +${200 * rw.ups.length}${rw.ups.some(l => l % 5 === 0) ? ' · 허가증 +1' : ''}</span>` : ''}`;
    this.refreshTop();
    const online = !!this.net;
    $('btn-again').hidden = online && !this.net.isHost;
    $('btn-again').querySelector('.btn__k').textContent = online ? '로비로' : '다시 하기';
    $('btn-menu').querySelector('.btn__k').textContent = online ? '방 나가기' : '홈으로';
    $('results').hidden = false;
    this.audio.play(win ? 'win' : 'lose');
  }

  again() { $('results').hidden = true; if (this.net) { this.backToLobby(true); return; } this.game?.dispose(); this.game = null; this.openSelect('ai'); }

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
    this.lobby = { code, players: [{ id: 'h', name, team: 0, hero: this.settings.hero, host: true }], fill: true, diff: this.settings.diff, map: 'random', inGame: false };
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
    if (L.players.length >= 6) { this.net.send(peer, { t: 'full' }); return; }
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
      case 'team': if (p && !L.inGame) { const other = 1 - p.team; if (L.players.filter(x => x.team === other).length < 3) { p.team = other; this.assignHero(p, p.hero); } this.broadcastLobby(); } break;
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
    const pub = { code: L.code, players: L.players.map(({ id, name, team, hero, host }) => ({ id, name, team, hero, host })), fill: L.fill, diff: L.diff, map: L.map, inGame: L.inGame };
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
      if (this.lobby.players.filter(x => x.team === other).length >= 3) { this.toast('상대 팀이 가득 찼어요'); return; }
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
    if (L.fill) this.pickBots(sim, used);
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
      for (let i = ps.length; i < 3; i++) html += `<li class="empty">${L.fill ? 'AI' : '빈 자리'}</li>`;
      el.innerHTML = html;
    }
    $('opt-fill').checked = L.fill; $('opt-fill').disabled = !this.net.isHost;
    qsa('button', $('lobby-diff')).forEach(b => { b.classList.toggle('is-on', +b.dataset.d === L.diff); b.disabled = !this.net.isHost; });
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
window.__app = app;
app.boot().catch((e) => {
  console.error(e);
  document.querySelector('.loading__text').textContent = '불러오기에 실패했어요: ' + e.message;
});
