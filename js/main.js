import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { HEROES, HERO_MAP, ROLES, SLOTS, SLOT_KEYS } from './heroes.js';
import { Sim } from './sim.js';
import { buildWorld } from './world.js';
import { FX } from './fx.js';
import { Audio } from './audio.js';
import { Net, makeCode } from './net.js';
import { icon } from './icons.js';
import { Stage, renderPortraits } from './stage.js';
import { Game, esc } from './game.js';

const $ = (id) => document.getElementById(id);
const qsa = (s, r = document) => [...r.querySelectorAll(s)];

// ---------------- settings ----------------
const DEF_SET = { sens: 1, fov: 92, vol: 0.6, q: 'high', name: '', hero: 'valok', diff: 1 };
function loadSettings() { try { return { ...DEF_SET, ...JSON.parse(localStorage.getItem('ashen.settings') || '{}') }; } catch (e) { return { ...DEF_SET }; } }
function saveSettings(s) { try { localStorage.setItem('ashen.settings', JSON.stringify(s)); } catch (e) { } }

class App {
  constructor() {
    this.settings = loadSettings();
    if (!HERO_MAP[this.settings.hero] || this.settings.hero === 'dummy') this.settings.hero = 'valok';
    this.state = 'loading';
    this.audio = new Audio();
    this.audio.setVolume(this.settings.vol);
    this.input = { keys: {}, mouse: [false, false, false], dx: 0, dy: 0, pressed: [], pressedMouse: false, locked: false };
    this.selHero = this.settings.hero;
    this.roleFilter = 'all';
    this.focus = 0; this.focusT = 0;
    this.net = null; this.lobby = null; this.myId = null; this.game = null;
  }

  async boot() {
    const canvas = $('gl');
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.2;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.camera = new THREE.PerspectiveCamera(this.settings.fov, 1, 0.05, 600);
    this.gameScene = new THREE.Scene();
    this.gameScene.add(this.camera);
    this.stage = new Stage();
    this.composer = new EffectComposer(r);
    this.renderPass = new RenderPass(this.stage.scene, this.stage.camera);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.55, 0.82);
    this.composer.addPass(this.renderPass); this.composer.addPass(this.bloom); this.composer.addPass(new OutputPass());

    await tick();
    this.portraits = renderPortraits(HEROES);
    await tick();
    this.world = buildWorld(this.gameScene, this.settings.q);
    this.fx = new FX(this.gameScene, r);
    this.applyQuality();
    this.resize();
    addEventListener('resize', () => this.resize());
    this.bindInput();
    this.buildSelect();
    this.bindMenus();
    this.setHero(this.selHero, false);
    $('loading').classList.remove('is-on');
    this.showSelect();
    this.last = performance.now();
    requestAnimationFrame((t) => this.frame(t));
    // warm up shaders for the arena while on the menu
    setTimeout(() => { try { this.renderer.compile(this.gameScene, this.camera); } catch (e) { } }, 300);
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
    this.composer.setPixelRatio?.(this.pr || 1);
    this.camera.aspect = w / h; this.camera.fov = this.settings.fov; this.camera.updateProjectionMatrix();
    this.stage.resize(w, h, this.pr || 1);
    this.fx?.setScale(h * (this.pr || 1), this.settings.fov);
  }

  // ---------------- input ----------------
  bindInput() {
    const I = this.input;
    addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (this.state === 'game') {
        if (['Space', 'Tab', 'KeyQ', 'KeyE', 'KeyX'].includes(e.code)) e.preventDefault();
        if (!I.keys[e.code]) I.pressed.push(e.code);
        if (e.code === 'Tab') $('scoreboard').hidden = false;
      }
      I.keys[e.code] = true;
    });
    addEventListener('keyup', (e) => { I.keys[e.code] = false; if (e.code === 'Tab') $('scoreboard').hidden = true; });
    addEventListener('blur', () => { I.keys = {}; I.mouse = [false, false, false]; $('scoreboard').hidden = true; });
    addEventListener('mousedown', (e) => { if (this.state === 'game' && I.locked) { I.mouse[e.button] = true; if (e.button === 0) I.pressedMouse = true; } });
    addEventListener('mouseup', (e) => { I.mouse[e.button] = false; });
    addEventListener('mousemove', (e) => { if (I.locked) { I.dx += e.movementX; I.dy += e.movementY; } });
    addEventListener('contextmenu', (e) => { if (this.state === 'game') e.preventDefault(); });
    document.addEventListener('pointerlockchange', () => {
      I.locked = document.pointerLockElement === $('gl');
      if (this.state === 'game') {
        if (!I.locked && !this.game?.ended && $('results').hidden) this.openPause();
        $('click-to-play').hidden = true;
      }
    });
    $('gl').addEventListener('click', () => { if (this.state === 'game' && !I.locked && $('pause').hidden && $('results').hidden) this.lock(); });
    $('click-to-play').addEventListener('click', () => this.lock());
    // stage drag
    let dragging = false, lx = 0;
    $('select').addEventListener('pointerdown', (e) => { if (e.target.closest('button, aside, footer, .lobby, .actions')) return; dragging = true; lx = e.clientX; this.stage.drag = true; });
    addEventListener('pointermove', (e) => { if (dragging) { this.stage.pointer(e.clientX - lx); lx = e.clientX; } });
    addEventListener('pointerup', () => { dragging = false; this.stage.drag = false; });
    $('select').addEventListener('wheel', (e) => { this.focus = Math.max(0, Math.min(1, this.focus + (e.deltaY < 0 ? 0.25 : -0.25))); }, { passive: true });
  }
  lock() {
    this.audio.init();
    const fallback = () => { try { const q = $('gl').requestPointerLock?.(); q?.catch?.(() => {}); } catch (e) { } };
    try {
      const p = $('gl').requestPointerLock?.({ unadjustedMovement: true });
      if (p && p.catch) p.catch(fallback);
    } catch (e) { fallback(); }
  }

  // ---------------- select screen ----------------
  buildSelect() {
    const tabs = $('role-tabs');
    const roles = [['all', '전체', '#c9a45c'], ...Object.entries(ROLES).map(([k, v]) => [k, v.name, v.color])];
    tabs.innerHTML = roles.map(([k, n, c]) => `<button data-role="${k}" style="--rc:${c}" class="${k === 'all' ? 'is-on' : ''}">${n}</button>`).join('');
    tabs.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      this.roleFilter = b.dataset.role;
      qsa('button', tabs).forEach(x => x.classList.toggle('is-on', x === b));
      this.filterRoster(); this.audio.play('click');
    });
    const roster = $('roster');
    roster.innerHTML = HEROES.map(h => `<button class="sigil" data-id="${h.id}" style="--rc:${ROLES[h.role].color}" title="${h.name} · ${h.title}"><span class="sigil__frame"></span><span class="sigil__img" style="background-image:url(${this.portraits[h.id]})"></span><span class="sigil__role"></span></button>`).join('');
    roster.addEventListener('click', (e) => {
      const b = e.target.closest('.sigil'); if (!b) return;
      if (b.classList.contains('is-taken')) { this.toast('같은 팀이 이미 고른 영웅이에요'); return; }
      this.audio.init();
      this.setHero(b.dataset.id);
    });
    roster.addEventListener('mouseover', (e) => { if (e.target.closest('.sigil')) this.audio.play('hover'); });
  }

  filterRoster() {
    qsa('.sigil').forEach(s => { const h = HERO_MAP[s.dataset.id]; s.classList.toggle('is-dim', this.roleFilter !== 'all' && h.role !== this.roleFilter); });
  }

  setHero(id, sound = true) {
    const h = HERO_MAP[id]; if (!h) return;
    this.selHero = id; this.settings.hero = id; saveSettings(this.settings);
    qsa('.sigil').forEach(s => s.classList.toggle('is-on', s.dataset.id === id));
    const nm = $('sel-name');
    nm.textContent = h.name; nm.classList.remove('is-swap'); void nm.offsetWidth; nm.classList.add('is-swap');
    $('sel-title').textContent = h.title;
    $('sel-role').textContent = ROLES[h.role].name;
    $('select').style.setProperty('--accent', h.color);
    $('sel-quote').textContent = h.quote;
    const bars = (v, max) => Array.from({ length: 5 }, (_, i) => `<i class="${i < v ? 'on' : ''}"></i>`).join('');
    const hpLv = Math.round(((h.hp - 250) / (500 - 250)) * 4) + 1;
    const spLv = Math.round(((h.speed - 5.8) / (7.6 - 5.8)) * 4) + 1;
    $('sel-stats').innerHTML = `
      <dt>체력</dt><dd>${bars(hpLv)}<em>${h.hp}</em></dd>
      <dt>이동속도</dt><dd>${bars(spLv)}<em>${h.speed.toFixed(1)}</em></dd>
      <dt>난이도</dt><dd>${bars(h.diff * 2 - 1 + (h.diff === 3 ? 0 : 0))}<em>${['', '쉬움', '보통', '어려움'][h.diff]}</em></dd>`;
    $('sel-skills').innerHTML = SLOTS.map(s => {
      const d = h.abilities[s];
      const cd = s === 'x' ? '궁극기' : (s === 'lmb' ? '' : `${d.cd}초`);
      return `<li class="skill${s === 'x' ? ' skill--ult' : ''}"><div class="rune"><img src="${icon(d.icon, s === 'x' ? '#ffb08a' : '#efe0c0')}" alt=""><span class="rune__key">${SLOT_KEYS[s]}</span></div><div><div class="skill__name">${d.name}<span class="skill__cd">${cd}</span></div><div class="skill__desc">${d.desc}</div></div></li>`;
    }).join('');
    this.stage.setHero(h, sound);
    if (sound) this.audio.play('select');
    if (this.lobby) this.lobbyPick(id);
  }

  showSelect() {
    this.state = 'menu';
    $('select').classList.add('is-on');
    $('hud').classList.remove('is-on');
    this.renderPass.scene = this.stage.scene; this.renderPass.camera = this.stage.camera;
    this.updateLobbyUi();
  }

  // ---------------- menus ----------------
  bindMenus() {
    const S = this.settings;
    // difficulty
    const seg = (el, key, cb) => {
      qsa('button', el).forEach(b => b.classList.toggle('is-on', String(S[key]) === b.dataset.d || S[key] === b.dataset.q));
      el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; qsa('button', el).forEach(x => x.classList.toggle('is-on', x === b)); cb(b); this.audio.play('click'); });
    };
    seg($('diff-seg'), 'diff', (b) => { S.diff = +b.dataset.d; saveSettings(S); });
    seg($('lobby-diff'), 'diff', (b) => { S.diff = +b.dataset.d; saveSettings(S); if (this.lobby && this.net?.isHost) { this.lobby.diff = S.diff; this.broadcastLobby(); } });
    seg($('set-q'), 'q', (b) => { S.q = b.dataset.q; saveSettings(S); this.applyQuality(); });
    $('btn-training').addEventListener('click', () => { this.audio.init(); if (this.swapMode && this.game?.training) this.resumeTrainingWith(this.selHero); else this.startTraining(); });
    $('btn-ai').addEventListener('click', () => { this.audio.init(); this.startOffline(); });
    $('btn-online').addEventListener('click', () => { this.audio.init(); $('in-name').value = S.name || ''; $('online').hidden = false; $('online-note').textContent = '서버 없이 브라우저끼리 직접 연결돼요. 방을 만든 사람이 나가면 게임이 끝나요.'; });
    $('btn-online-close').addEventListener('click', () => $('online').hidden = true);
    $('btn-host').addEventListener('click', () => this.hostRoom());
    $('btn-join').addEventListener('click', () => this.joinRoom());
    $('in-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') this.joinRoom(); });
    // settings
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
    // pause
    $('btn-resume').addEventListener('click', () => { $('pause').hidden = true; this.lock(); });
    $('btn-pause-settings').addEventListener('click', () => { $('settings').hidden = false; });
    $('btn-pause-hero').addEventListener('click', () => { $('pause').hidden = true; this.openTrainingSwap(); });
    $('btn-quit').addEventListener('click', () => { $('pause').hidden = true; this.quitToMenu(); });
    $('btn-again').addEventListener('click', () => this.again());
    $('btn-menu').addEventListener('click', () => { $('results').hidden = true; if (this.net && this.lobby) this.backToLobby(true); else this.quitToMenu(); });
    // lobby
    $('lobby-code').addEventListener('click', () => { navigator.clipboard?.writeText(this.lobby?.code || ''); this.toast('방 코드를 복사했어요'); });
    $('btn-switch-team').addEventListener('click', () => this.lobbySwitchTeam());
    $('btn-leave-lobby').addEventListener('click', () => this.leaveOnline());
    $('btn-start').addEventListener('click', () => this.hostStart());
    $('opt-fill').addEventListener('change', (e) => { if (this.lobby && this.net?.isHost) { this.lobby.fill = e.target.checked; this.broadcastLobby(); } });
    addEventListener('keydown', (e) => {
      if (e.code === 'Escape') { qsa('.modal').forEach(m => { if (m.id !== 'pause') m.hidden = true; }); }
    });
  }

  toast(msg, ms = 2200) {
    const t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(this.toastT); this.toastT = setTimeout(() => t.hidden = true, ms);
  }

  openPause() {
    if (this.state !== 'game') return;
    $('pause').hidden = false;
    $('btn-pause-hero').hidden = !this.game?.training;
  }

  // ---------------- game start ----------------
  beginGame(game) {
    this.game?.dispose();
    this.game = game;
    this.state = 'game';
    this.swapMode = false;
    $('select').classList.remove('is-on');
    $('hud').classList.add('is-on');
    $('results').hidden = true;
    this.renderPass.scene = this.gameScene; this.renderPass.camera = this.camera;
    this.resize();
    this.lock();
    $('click-to-play').hidden = false;
  }

  startTraining() {
    this.leaveOnline(true);
    const sim = new Sim({ mode: 'training', difficulty: 1 });
    const name = this.settings.name || '나';
    sim.addPlayer({ id: 'me', name, team: 0, hero: this.selHero });
    for (let i = 0; i < 6; i++) { const p = sim.addPlayer({ id: 'd' + i, name: '허수아비', team: 1, hero: 'dummy', isDummy: true }); if (i === 5) p.mover = true; }
    sim.startTraining();
    this.beginGame(new Game(this, { role: 'offline', sim, localId: 'me', training: true }));
  }

  openTrainingSwap() {
    document.exitPointerLock?.();
    this.swapMode = true;
    this.state = 'menu';
    $('select').classList.add('is-on'); $('hud').classList.remove('is-on');
    this.renderPass.scene = this.stage.scene; this.renderPass.camera = this.stage.camera;
    $('btn-training').querySelector('.btn__k').textContent = '이 영웅으로 계속';
  }
  resumeTrainingWith(id) {
    $('btn-training').querySelector('.btn__k').textContent = '훈련장';
    this.game.sim.setHero('me', id);
    this.game.setRoster(this.game.sim.roster());
    this.game.setLocalHero(id);
    const g = this.game; this.game = null;
    this.beginGame(g);
  }

  pickBots(sim, teams, used) {
    const pool = HEROES.map(h => h.id);
    for (const team of [0, 1]) {
      let n = [...sim.players.values()].filter(p => p.team === team).length;
      let k = 0;
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
    const sim = new Sim({ mode: 'match', difficulty: this.settings.diff });
    sim.addPlayer({ id: 'me', name: this.settings.name || '나', team: 0, hero: this.selHero });
    this.pickBots(sim, [0, 1], [new Set([this.selHero]), new Set()]);
    sim.startMatch();
    this.lastMode = 'ai';
    this.beginGame(new Game(this, { role: 'offline', sim, localId: 'me' }));
  }

  quitToMenu() {
    document.exitPointerLock?.();
    if (this.net && this.lobby) { this.backToLobby(true); return; }
    this.game?.dispose(); this.game = null;
    $('results').hidden = true;
    $('btn-training').querySelector('.btn__k').textContent = '훈련장';
    this.showSelect();
  }

  showResults(win, score, game) {
    document.exitPointerLock?.();
    const my = game.myTeam();
    $('hud').classList.remove('is-on');
    $('res-title').textContent = win ? '승리' : '패배';
    $('res-title').className = 'results__title ' + (win ? 'is-win' : 'is-lose');
    $('res-score').textContent = `${score[my]} : ${score[1 - my]}`;
    $('res-body').innerHTML = game.scoreboardRows();
    const online = !!this.net;
    $('btn-again').hidden = online && !this.net.isHost;
    $('btn-again').querySelector('.btn__k').textContent = online ? '로비로' : '다시 하기';
    $('btn-menu').querySelector('.btn__k').textContent = online ? '나가기' : '메뉴로';
    $('results').hidden = false;
    this.audio.play(win ? 'win' : 'lose');
  }

  again() {
    $('results').hidden = true;
    if (this.net) { this.backToLobby(true); return; }
    this.startOffline();
  }

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
    this.lobby = { code, players: [{ id: 'h', name, team: 0, hero: this.selHero, host: true }], fill: true, diff: this.settings.diff, inGame: false };
    net.on({
      join: (peer) => this.onPeerJoin(peer),
      leave: (peer) => this.onPeerLeave(peer),
      data: (peer, m) => this.onHostData(peer, m),
    });
    $('online').hidden = true;
    this.updateLobbyUi();
  }

  async joinRoom() {
    const name = ($('in-name').value || '').trim() || '도전자';
    const code = ($('in-code').value || '').trim().toUpperCase();
    const note = $('online-note');
    if (code.length !== 5) { note.textContent = '방 코드는 다섯 글자예요.'; return; }
    this.settings.name = name; saveSettings(this.settings);
    this.leaveOnline(true);
    note.textContent = '연결하는 중…';
    const net = new Net();
    net.on({ data: (_, m) => this.onClientData(m), leave: () => this.onHostLost() });
    try { await net.join(code); }
    catch (e) { note.textContent = this.netErr(e); net.close(); return; }
    this.net = net;
    net.send('host', { t: 'hello', name, hero: this.selHero });
    note.textContent = '입장했어요.';
    this.pendingCode = code;
  }

  netErr(e) {
    const m = e?.message || e?.type || '';
    if (m === 'notfound') return '그 코드의 방을 찾지 못했어요. 코드를 다시 확인해 주세요.';
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
    if (!silent) this.showSelect();
    this.updateLobbyUi();
  }

  onHostLost() {
    if (!this.net) return;
    this.net.close(); this.net = null; this.lobby = null;
    if (this.game) { this.game.dispose(); this.game = null; document.exitPointerLock?.(); }
    $('results').hidden = true; $('pause').hidden = true;
    this.showSelect();
    this.toast('방장과 연결이 끊겼어요', 3500);
  }

  // host side
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
      case 'team': if (p && !L.inGame) { const other = 1 - p.team; if (L.players.filter(x => x.team === other).length < 3) { p.team = other; if (L.players.some(x => x !== p && x.team === p.team && x.hero === p.hero)) p.hero = null; this.assignHero(p, p.hero); } this.broadcastLobby(); } break;
      case 'st': if (this.game?.sim) this.game.sim.clientState(pid, m); break;
      case 'cast': if (this.game?.sim) { const sp = this.game.sim.players.get(pid); if (sp && m.pos && sp.alive) sp.pos = m.pos; this.game.sim.cast(pid, m.slot, m.aim, true); } break;
      case 'bye': this.onPeerLeave(peer); break;
    }
  }
  assignHero(p, want) {
    const L = this.lobby;
    const taken = new Set(L.players.filter(x => x !== p && x.team === p.team).map(x => x.hero));
    if (want && HERO_MAP[want] && want !== 'dummy' && !taken.has(want)) p.hero = want;
    else if (!p.hero || taken.has(p.hero)) p.hero = HEROES.map(h => h.id).find(id => !taken.has(id));
  }
  broadcastLobby() {
    const L = this.lobby; if (!L) return;
    const pub = { code: L.code, players: L.players.map(({ id, name, team, hero, host }) => ({ id, name, team, hero, host })), fill: L.fill, diff: L.diff, inGame: L.inGame };
    this.net.broadcast({ t: 'lobby', lobby: pub });
    this.updateLobbyUi();
  }
  lobbyPick(id) {
    if (!this.lobby) return;
    if (this.net.isHost) { const me = this.lobby.players.find(p => p.id === 'h'); this.assignHero(me, id); this.broadcastLobby(); }
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
    if (!L.fill && (counts[0] === 0 || counts[1] === 0)) { this.toast('양 팀에 한 명 이상 있어야 해요. AI로 채우기를 켜 보세요.'); return; }
    const sim = new Sim({ mode: 'match', difficulty: L.diff });
    const used = [new Set(), new Set()];
    for (const p of L.players) { if (!p.hero) this.assignHero(p, null); sim.addPlayer({ id: p.id, name: p.name, team: p.team, hero: p.hero }); used[p.team].add(p.hero); }
    if (L.fill) this.pickBots(sim, [0, 1], used);
    sim.startMatch();
    L.inGame = true;
    const roster = sim.roster();
    this.net.broadcast({ t: 'start', roster });
    this.broadcastLobby();
    const game = new Game(this, { role: 'host', sim, net: this.net, localId: 'h', roster });
    this.beginGame(game);
    // initial events (teleports etc.) must reach clients
  }
  backToLobby(broadcast) {
    this.game?.dispose(); this.game = null;
    document.exitPointerLock?.();
    $('results').hidden = true;
    if (this.lobby) this.lobby.inGame = false;
    if (broadcast && this.net?.isHost) { this.net.broadcast({ t: 'toLobby' }); this.broadcastLobby(); }
    this.showSelect();
  }

  // client side
  onClientData(m) {
    switch (m.t) {
      case 'welcome': this.myId = m.id; $('online').hidden = true; break;
      case 'lobby': this.lobby = m.lobby; this.updateLobbyUi(); break;
      case 'busy': this.toast('이미 경기가 진행 중인 방이에요'); this.leaveOnline(); break;
      case 'full': this.toast('방이 가득 찼어요'); this.leaveOnline(); break;
      case 'closed': this.onHostLost(); break;
      case 'start': {
        const me = m.roster.find(r => r.id === this.myId);
        if (me && me.hero !== this.selHero) this.setHeroQuiet(me.hero);
        this.beginGame(new Game(this, { role: 'client', net: this.net, localId: this.myId, roster: m.roster }));
        break;
      }
      case 'toLobby': this.backToLobby(false); break;
      default: this.game?.onNet('host', m);
    }
  }
  setHeroQuiet(id) { const lb = this.lobby; this.lobby = null; this.setHero(id, false); this.lobby = lb; }

  updateLobbyUi() {
    const L = this.lobby;
    const inLobby = !!(L && this.net);
    $('menu-actions').hidden = inLobby;
    $('lobby-panel').hidden = !inLobby;
    $('lobby-badge').hidden = !inLobby;
    $('select').classList.toggle('is-lobby', inLobby);
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
    $('btn-start').hidden = !this.net.isHost;
    $('lobby-note').textContent = this.net.isHost ? `친구에게 방 코드 ${L.code}를 알려 주세요. 최대 6명.` : '방장이 시작하기를 기다리는 중이에요.';
    // taken heroes for my team
    if (my) {
      const taken = new Set(L.players.filter(p => p.team === my.team && p.id !== this.myId).map(p => p.hero));
      qsa('.sigil').forEach(s => s.classList.toggle('is-taken', taken.has(s.dataset.id)));
      if (my.hero && my.hero !== this.selHero) this.setHeroQuiet(my.hero);
    }
  }

  // ---------------- loop ----------------
  frame(t) {
    requestAnimationFrame((tt) => this.frame(tt));
    const dt = Math.min(this.dtCap || 0.05, (t - this.last) / 1000);
    this.last = t;
    const I = this.input;
    if (this.state === 'menu' || this.state === 'loading') {
      this.stage.update(dt, this.focus);
    } else if (this.state === 'game' && this.game) {
      this.game.update(dt, I);
      this.world.update(t / 1000);
      this.fx.ambient(dt);
      this.fx.braziers(this.world.braziers, dt);
      this.fx.update(dt);
      if (!$('scoreboard').hidden) $('board-body').innerHTML = this.game.scoreboardRows();
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
