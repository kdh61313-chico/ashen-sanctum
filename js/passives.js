// Hero passives: one unique rule per hero. Hooks are called by the sim:
//  spawn(S,p) tick(S,p,dt) cast(S,p,slot,def) reload(S,p)
//  out(S,p,tgt,dmg,o) -> damage multiplier      inc(S,p,src,dmg,o) -> new incoming damage
//  hit(S,p,tgt,dmg,o) after dealing damage     hurt(S,p,src,dmg,o) after taking damage
//  kill(S,p,victim) anyDeath(S,p,victim) cheat(S,p) -> true to survive a lethal hit
//  healOut(S,p,tgt,amt) -> heal multiplier
// res: a resource bar shown in the HUD ({ max, name, color, start, decay }).
const ready = (S, p, k, cd) => { if ((p.pasT[k] || -99) + cd > S.now) return false; p.pasT[k] = S.now; return true; };
const dist = (a, b) => Math.hypot(a.pos[0] - b.pos[0], a.pos[2] - b.pos[2]);
const behind = (p, t) => { const fx = -Math.sin(t.yaw), fz = -Math.cos(t.yaw); const dx = p.pos[0] - t.pos[0], dz = p.pos[2] - t.pos[2]; const l = Math.hypot(dx, dz) || 1; return (dx * fx + dz * fz) / l < -0.25; };
const isMelee = (o) => o.slot === 'lmb';

export const PASSIVES = {
  // ---------------- 1–40 ----------------
  valok: {
    name: '피의 맹세', desc: '받은 피해와 준 피해로 혈기가 찬다. 혈기 100이면 다음 대검 공격이 40% 강해지고 체력 40을 회복한다. E는 모은 혈기를 방패로 바꾼다.',
    res: { max: 100, name: '혈기', color: '#d0303a' },
    hurt(S, p, src, dmg) { S.gain(p, dmg * 0.5); },
    hit(S, p, t, dmg, o) { if (o.slot !== 'lmb') S.gain(p, dmg * 0.2); },
    out(S, p, t, dmg, o) { if (o.slot === 'lmb' && p.rs >= 100) { p.rs = 0; S.heal(p, p, 40); S.ev({ t: 'fx', fx: 'crit', pos: S.chest(t) }); return 1.4; } },
    cast(S, p, slot) { if (slot === 'e') { p.shield = Math.max(p.shield, 30 + (p._spent || 0) * 1.3); p.shieldT = 5; } },
  },
  nir: {
    name: '그림자 표식', desc: '등 뒤에서 공격하면 피해 +40%. 쌍단검이 맞을 때마다 표식이 쌓이고(최대 5), E로 표식을 한꺼번에 터뜨린다.',
    out(S, p, t, dmg, o) { return o.slot === 'lmb' && behind(p, t) ? 1.4 : 1; },
    hit(S, p, t, dmg, o) { if (o.slot === 'lmb') S.addMark(p, t, 1, 5); },
  },
  igna: {
    name: '열기', desc: '적을 맞힐 때마다 열기가 오르고, 열기만큼 피해가 최대 25% 늘어난다. 싸우지 않으면 식는다.',
    res: { max: 100, name: '열기', color: '#ff7a2a', decay: 7 },
    hit(S, p, t, dmg) { S.gain(p, 4 + dmg * 0.15); },
    out(S, p) { return 1 + p.rs * 0.0025; },
  },
  selene: {
    name: '사냥꾼의 집중', desc: '같은 적을 연달아 맞히면 피해가 8%씩, 최대 40%까지 오른다.',
    out(S, p, t) { const f = p.pasT.focus; return f && f.id === t.id && S.now - f.at < 4 ? 1 + 0.08 * f.n : 1; },
    hit(S, p, t) { const f = p.pasT.focus; p.pasT.focus = f && f.id === t.id && S.now - f.at < 4 ? { id: t.id, n: Math.min(5, f.n + 1), at: S.now } : { id: t.id, n: 1, at: S.now }; },
  },
  mor: {
    name: '영혼 수확', desc: '주변에서 누군가 쓰러질 때마다 영혼을 거둔다(최대 5). Q는 영혼을 모두 써서 영혼 하나당 아군을 30 더 치유하고, 궁극기는 영혼 수만큼 망령을 더 부른다.',
    res: { max: 5, name: '영혼', color: '#8a5cff' },
    anyDeath(S, p, v) { if (dist(p, v) < 22) S.gain(p, 1); },
    kill(S, p) { S.gain(p, 1); },
    cast(S, p, slot) {
      if (slot === 'q') for (const a of S.alliesOf(p)) if (dist(a, p) <= 12) S.heal(p, a, 30 * (p._spent || 0));
      if (slot === 'x') { const n = 3 + Math.round(p.rs); p.rs = 0; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; S.spawnZone(p, { r: 2.2, dur: 6, dps: 14, chase: 6.5, look: 'ghost', st: { slow: [0.4, 0.25] } }, [p.pos[0] + Math.cos(a) * 2, p.pos[1], p.pos[2] + Math.sin(a) * 2]); } }
    },
  },
  grom: {
    name: '참호', desc: '1초 동안 거의 움직이지 않으면 받는 피해가 25% 줄어든다.',
    tick(S, p, dt) { const sp = Math.hypot(p.vel[0], p.vel[2]); p.pasT.still = sp < 1 ? (p.pasT.still || 0) + dt : 0; if (p.pasT.still > 1) S.addSt(p, 'dr', 0.25, 0.25); },
  },
  razel: {
    name: '정전기', desc: '네 번째 번개 줄기마다 번개가 적 3명에게 튄다.',
    cast(S, p, slot) { if (slot !== 'lmb') return; p.pasT.n = (p.pasT.n || 0) + 1; if (p.pasT.n >= 4) { p.pasT.n = 0; S._slot = 'lmb'; S.k_chain(p, { range: 26, bounces: 2, dmg: 26, look: 'lightning' }, { yaw: p.yaw, pitch: p.pitch }); } },
  },
  veyla: {
    name: '피의 갈증', desc: '준 피해의 15%를 흡혈한다. 체력이 절반 아래면 30%. 처치하면 최대 체력의 25%를 회복한다.',
    hit(S, p, t, dmg, o) { if (o.slot === 'dot') return; S.heal(p, p, dmg * (p.hp < p.maxHp / 2 ? 0.3 : 0.15), true); },
    kill(S, p) { S.heal(p, p, p.maxHp * 0.25); },
  },
  kael: {
    name: '수호 오라', desc: '8m 안의 아군은 받는 피해가 10% 줄어든다.',
    tick(S, p, dt) { if (!ready(S, p, 'aura', 0.4)) return; for (const a of S.alliesOf(p)) if (dist(a, p) < 8) S.addSt(a, 'dr', 0.6, 0.1); },
  },
  onyx: {
    name: '전염', desc: '중독된 적의 독은 2초마다 4m 안의 다른 적에게 옮는다.',
    tick(S, p) { if (!ready(S, p, 'spread', 2)) return; for (const e of S.enemiesOf(p)) if (e.st.poison) for (const o of S.enemiesOf(p)) if (o !== e && !o.st.poison && dist(o, e) < 4) { S.addSt(o, 'poison', 3, e.st.poison.v); S.ev({ t: 'fx', fx: 'wisp', from: S.chest(e), to: S.chest(o), color: '#8acd32' }); } },
  },
  sira: {
    name: '공허 균열', desc: '공허 구체가 맞힌 자리에 균열이 남아 1초 뒤 터진다.',
    hit(S, p, t, dmg, o) { if (o.slot === 'lmb' && ready(S, p, 'rift', 1.2)) S.spawnZone(p, { r: 2.4, delay: 1, dur: 0.1, burst: { dmg: 30 }, look: 'void' }, t.pos); },
  },
  ulfric: {
    name: '사냥 본능', desc: '15m 안에 체력이 절반 아래인 적이 있으면 이동 속도가 25% 오른다.',
    tick(S, p) { if (!ready(S, p, 'hunt', 0.3)) return; if (S.enemiesOf(p).some(e => e.hp < e.maxHp / 2 && dist(e, p) < 15)) S.addSt(p, 'haste', 0.4, 0.25); },
    cast(S, p, slot) { if (slot === 'x') for (let i = 0; i < 3; i++) S.spawnZone(p, { r: 1.8, dur: 6, dps: 18, chase: 9, look: 'wolf', st: { slow: [0.5, 0.2] } }, [p.pos[0] + (i - 1) * 1.5, p.pos[1], p.pos[2]]); },
  },
  hark: {
    name: '불사의 뼈', desc: '라운드마다 한 번, 치명상을 입으면 쓰러지지 않고 2초 동안 버틴 뒤 체력 25%로 다시 맞춘다. E는 주변 적 하나당 보호막 25를 더 얻는다.',
    spawn(S, p) { p.pasT.used = false; },
    cheat(S, p) { if (p.pasT.used) return false; p.pasT.used = true; S.addSt(p, 'undying', 2); p.pasT.reform = S.now + 2; S.ev({ t: 'fx', fx: 'bones', pos: [...p.pos] }); return true; },
    tick(S, p) { if (p.pasT.reform && S.now >= p.pasT.reform) { p.pasT.reform = 0; S.heal(p, p, p.maxHp * 0.25); } },
    cast(S, p, slot) { if (slot === 'e') { const n = S.enemiesOf(p).filter(e => dist(e, p) < 8).length; p.shield = Math.max(p.shield, 40 + n * 25); p.shieldT = 5; } },
  },
  eris: {
    name: '성좌', desc: '에리스가 치유한 아군은 4초 동안 피해가 10% 오른다.',
    healOut(S, p, t) { if (t !== p) S.addSt(t, 'dmgUp', 4, 0.1); return 1; },
  },
  azrak: {
    name: '용의 피', desc: '체력이 40% 아래면 받는 피해가 20% 줄고 몸에서 불꽃이 피어 주변을 태운다.',
    tick(S, p) { if (p.hp > p.maxHp * 0.4 || !ready(S, p, 'blood', 0.5)) return; S.addSt(p, 'dr', 0.6, 0.2); S.aoeAt(p, p.pos, 3, 8, { noLos: true }); S.ev({ t: 'fx', fx: 'burst', pos: [...p.pos], color: '#ff5a1a' }); },
  },
  lian: {
    name: '거울상', desc: '피격되면 8초마다 그 자리에 분신을 남기고 0.8초 동안 투명해진다. 분신은 1.2초 뒤 터진다.',
    hurt(S, p, src) { if (!src || !ready(S, p, 'mirror', 8)) return; S.addSt(p, 'invis', 0.8); S.spawnZone(p, { r: 3, delay: 1.2, dur: 0, burst: { dmg: 40 }, look: 'decoy' }, p.pos, p.yaw); },
  },
  nox: {
    name: '까마귀 눈', desc: '화살에 맞은 적은 3초 동안 감시당해 받는 피해가 8% 늘어난다.',
    hit(S, p, t, dmg, o) { if (o.slot === 'lmb') S.addSt(t, 'vuln', 3, 0.08); },
  },
  tyr: {
    name: '룬 각인', desc: '망치로 세 번 때릴 때마다 룬을 새겨 3초 동안 대상이 받는 피해가 20% 늘어난다.',
    hit(S, p, t, dmg, o) { if (o.slot !== 'lmb') return; p.pasT.n = (p.pasT.n || 0) + 1; if (p.pasT.n >= 3) { p.pasT.n = 0; S.addSt(t, 'vuln', 3, 0.2); S.ev({ t: 'fx', fx: 'rune', pos: S.chest(t), color: '#7fd8ff' }); } },
  },
  seraph: {
    name: '타락과 구원', desc: '빛의 자세에서는 주변 아군을 초당 4 치유한다. 타락 자세(E)에서는 광휘가 피해를 30% 흡혈하지만 받는 피해가 10% 늘어난다.',
    tick(S, p) { if (p.sn || !ready(S, p, 'light', 0.5)) return; for (const a of S.alliesOf(p)) if (a !== p && dist(a, p) < 9) S.heal(p, a, 2, true); },
    inc(S, p, src, dmg) { return p.sn ? dmg * 1.1 : dmg; },
    cast(S, p, slot) { if (slot === 'x') S.spawnZone(p, { r: 7, dur: 4.2, follow: true, strikes: { every: 0.18, r: 1.6, dmg: 18 }, look: 'feathers' }, p.pos); },
  },
  belladonna: {
    name: '독의 연금술', desc: '중독된 적은 벨라돈나에게 받는 피해가 15% 늘어난다.',
    out(S, p, t) { return t.st.poison ? 1.15 : 1; },
  },
  grave: {
    name: '은탄', desc: '여섯 번째 총알마다 세 배 피해를 준다.',
    cast(S, p, slot) { if (slot === 'lmb') p.pasT.n = ((p.pasT.n || 0) + 1) % 6; },
    out(S, p, t, dmg, o) { if (o.slot === 'lmb' && p.pasT.n === 0) { S.ev({ t: 'fx', fx: 'crit', pos: S.chest(t) }); return 3; } },
  },
  bark: {
    name: '근거리 사격', desc: '5m 안의 적에게 산탄 피해가 50% 늘어난다.',
    out(S, p, t, dmg, o) { return o.slot === 'lmb' && dist(p, t) < 5 ? 1.5 : 1; },
  },
  elise: {
    name: '고요한 조준', desc: '1초 동안 움직이지 않으면 다음 사격 피해가 35% 늘어난다.',
    tick(S, p, dt) { const sp = Math.hypot(p.vel[0], p.vel[2]); p.pasT.still = sp < 0.8 ? (p.pasT.still || 0) + dt : 0; },
    out(S, p, t, dmg, o) { return o.slot === 'lmb' && p.pasT.still > 1 ? 1.35 : 1; },
  },
  karman: {
    name: '연금 탄약', desc: '유탄이 쏠 때마다 화염 → 냉기 → 산성 순으로 탄종이 바뀐다.',
    cast(S, p, slot) { if (slot === 'lmb') p.pasT.ammo = ((p.pasT.ammo || 0) + 1) % 3; },
    hit(S, p, t, dmg, o) { if (o.slot !== 'lmb') return; const k = p.pasT.ammo || 0; if (k === 0) S.addSt(t, 'burn', 3, 8); else if (k === 1) S.addSt(t, 'slow', 1.5, 0.35); else { S.addSt(t, 'poison', 3, 6); S.addSt(t, 'vuln', 2, 0.1); } },
  },
  mira: {
    name: '회전 가속', desc: '계속 쏘면 총열이 빨라져 연사 속도가 최대 2배가 된다. 쏘지 않으면 식는다.',
    res: { max: 100, name: '회전', color: '#ffb84a', decay: 45 },
    cast(S, p, slot) { if (slot === 'lmb') S.gain(p, 12); },
  },
  rowan: {
    name: '현상금', desc: '처치 수가 가장 많은 적에게 현상금이 걸린다. 현상금 대상에게 피해 +25%, 처치하면 Q와 E 재사용 대기시간이 초기화된다.',
    out(S, p, t) { const top = S.enemiesOf(p).sort((a, b) => b.stats.k - a.stats.k)[0]; return top && top === t ? 1.25 : 1; },
    kill(S, p) { p.cds.q = 0; p.cds.e = 0; },
  },
  helga: {
    name: '정화의 불꽃', desc: '불길로 적을 태우면 가장 가까운 다친 아군이 그 피해의 20%만큼 치유된다.',
    hit(S, p, t, dmg) { let best = null, bd = 9; for (const a of S.alliesOf(p)) { if (a === p || a.hp >= a.maxHp) continue; const d = dist(a, p); if (d < bd) { bd = d; best = a; } } if (best) S.heal(p, best, dmg * 0.2, true); },
  },
  zeno: {
    name: '룬 탄창', desc: '재장전하면 다음 다섯 발에 무작위 룬(화염·냉기·번개)이 새겨진다.',
    reload(S, p) { p.pasT.rune = 5; p.pasT.kind = (Math.random() * 3) | 0; },
    hit(S, p, t, dmg, o) { if (o.slot !== 'lmb' || !(p.pasT.rune > 0)) return; p.pasT.rune--; const k = p.pasT.kind; if (k === 0) S.addSt(t, 'burn', 3, 10); else if (k === 1) S.addSt(t, 'slow', 2, 0.35); else { S.aoeAt(p, t.pos, 3, 14, { noLos: true }); S.ev({ t: 'fx', fx: 'explode', pos: S.chest(t), r: 2, look: 'lightning' }); } },
  },
  nocturne: {
    name: '어둠 속에서', desc: '투명한 동안, 그리고 투명이 풀린 뒤 1.5초 동안 피해가 40% 늘어난다.',
    tick(S, p) { if (p.st.invis) p.pasT.lastInvis = S.now; },
    out(S, p) { return p.st.invis || S.now - (p.pasT.lastInvis || -9) < 1.5 ? 1.4 : 1; },
  },
  talon: {
    name: '과충전', desc: '3초 동안 쏘지 않으면 다음 포격이 80% 강해진다. 방어 자세(E)에서는 받는 피해가 40% 줄지만 느려진다.',
    cast(S, p, slot) { if (slot === 'lmb') { p.pasT.charged = S.now - (p.pasT.last || -9) > 3; p.pasT.last = S.now; } },
    out(S, p, t, dmg, o) { return o.slot === 'lmb' && p.pasT.charged ? 1.8 : 1; },
    tick(S, p) { if (p.sn === 'e') { S.addSt(p, 'dr', 0.3, 0.4); S.addSt(p, 'slow', 0.3, 0.45); } },
  },
  iris: {
    name: '꽃잎 무도', desc: 'Q나 E를 쓸 때마다 꽃잎이 쌓인다(최대 3). 3개가 모이면 다음 베기가 꽃잎 검기를 날린다.',
    res: { max: 3, name: '꽃잎', color: '#ff7ac0' },
    cast(S, p, slot) {
      if (slot === 'q' || slot === 'e') S.gain(p, 1);
      if (slot === 'lmb' && p.rs >= 3) { p.rs = 0; const d = [-Math.sin(p.yaw) * Math.cos(p.pitch), Math.sin(p.pitch), -Math.cos(p.yaw) * Math.cos(p.pitch)]; const e = S.eye(p); S._slot = 'lmb'; S.spawnProj(p, { speed: 34, dmg: 55, r: 0.9, life: 0.6, pierce: true, look: 'petalwave' }, [e[0], e[1] - 0.3, e[2]], d); }
    },
  },
  moloch: {
    name: '심연 흡수', desc: '8m 안의 아군이 받는 피해의 15%를 대신 받는다.',
    tick(S, p) { if (!ready(S, p, 'g', 0.4)) return; for (const a of S.alliesOf(p)) if (a !== p && dist(a, p) < 8) a.st.guard = { t: 0.6, v: 0.15, by: p.id }; },
  },
  sien: {
    name: '달빛 축복', desc: '시엔이 치유한 아군은 1.5초 동안 25% 빨라진다.',
    healOut(S, p, t) { S.addSt(t, 'haste', 1.5, 0.25); return 1; },
  },
  crow: {
    name: '처형인', desc: '체력 30% 아래의 적에게 피해 +50%. 처치하면 Q 재사용 대기시간이 초기화된다.',
    out(S, p, t) { return t.hp < t.maxHp * 0.3 ? 1.5 : 1; },
    kill(S, p) { p.cds.q = 0; },
  },
  aura: {
    name: '충전', desc: '움직이면 전하가 쌓인다. 가득 차면 다음 창 공격이 번개 창이 되어 멀리 날아간다.',
    res: { max: 100, name: '전하', color: '#9fb0ff' },
    tick(S, p, dt) { S.gain(p, Math.hypot(p.vel[0], p.vel[2]) * dt * 2.2); },
    cast(S, p, slot) { if (slot === 'lmb' && p.rs >= 100) { p.rs = 0; const d = [-Math.sin(p.yaw) * Math.cos(p.pitch), Math.sin(p.pitch), -Math.cos(p.yaw) * Math.cos(p.pitch)]; const e = S.eye(p); S._slot = 'lmb'; S.spawnProj(p, { speed: 70, dmg: 70, r: 0.4, life: 0.6, pierce: true, onHit: { stun: [0.5] }, look: 'lance' }, [e[0], e[1] - 0.2, e[2]], d); } },
  },
  mariette: {
    name: '꼭두각시', desc: '같은 적을 바늘로 세 번 맞히면 1초 동안 60% 둔화시킨다.',
    hit(S, p, t, dmg, o) { if (o.slot !== 'lmb') return; S.addMark(p, t, 1, 3); if (S.markCount(p, t) >= 3) { delete t.marks[p.id]; S.addSt(t, 'slow', 1, 0.6); S.ev({ t: 'fx', fx: 'puppet', id: t.id, pos: [...t.pos], r: 1.2, color: '#ff7ac0' }); } },
  },
  bael: {
    name: '지옥불 갑옷', desc: '4m 안에서 바엘을 때린 적은 불탄다.',
    hurt(S, p, src) { if (src && src !== p && dist(src, p) < 4) S.addSt(src, 'burn', 2, 10); },
  },
  luna: {
    name: '영구 동토', desc: '둔화되거나 얼어붙은 적은 루나에게 받는 피해가 25% 늘어난다.',
    out(S, p, t) { return t.st.slow || t.st.root ? 1.25 : 1; },
  },
  veronica: {
    name: '피의 계약', desc: '아군을 치유할 때 치유량의 10%만큼 자신의 체력을 쓰지만, 치유량이 60% 늘어난다.',
    healOut(S, p, t, amt) { if (t === p) return 1; p.hp = Math.max(1, p.hp - amt * 0.1); return 1.6; },
  },
  jack: {
    name: '연쇄 폭발', desc: '폭발이 적에게 맞으면 0.8초 뒤 그 자리에서 작은 폭탄이 한 번 더 터진다.',
    hit(S, p, t, dmg, o) { if (o.slot === 'dot' || o.slot === 'zone' || !ready(S, p, 'chain', 1.2)) return; S.spawnZone(p, { r: 2.6, delay: 0.8, dur: 0, burst: { dmg: 25 }, look: 'grenade' }, t.pos); },
  },
  // ---------------- 41–60 ----------------
  kaira: {
    name: '불꽃 춤', desc: '차크람을 연속으로 세 번 맞히면 2초 동안 25% 빨라지고 피해가 15% 늘어난다.',
    hit(S, p, t, dmg, o) { if (o.slot !== 'lmb') return; p.pasT.n = S.now - (p.pasT.at || -9) < 1.5 ? (p.pasT.n || 0) + 1 : 1; p.pasT.at = S.now; if (p.pasT.n >= 3) { p.pasT.n = 0; S.addSt(p, 'haste', 2, 0.25); S.addSt(p, 'dmgUp', 2, 0.15); S.ev({ t: 'fx', fx: 'burst', pos: [...p.pos], color: '#ff7a3a' }); } },
  },
  brann: {
    name: '빙하의 몸', desc: '받는 둔화 효과가 절반이 되고, 근접에서 브란을 때린 적은 둔화된다.',
    tick(S, p) { if (p.st.slow) p.st.slow.v = Math.min(p.st.slow.v, 0.2); },
    hurt(S, p, src) { if (src && src !== p && dist(src, p) < 4) S.addSt(src, 'slow', 1, 0.25); },
  },
  vesper: {
    name: '새벽 기도', desc: '치유로 궁극기가 두 배 빨리 찬다.',
    healOut(S, p, t, amt) { p.ult = Math.min(100, p.ult + amt / 4); return 1; },
  },
  orin: {
    name: '정비', desc: '포탑 근처(6m)에 있으면 받는 피해가 15% 줄고 포탑이 더 빨리 쏜다.',
    tick(S, p) { const near = S.zones.some(z => z.owner === p.id && z.def.turret && Math.hypot(z.pos[0] - p.pos[0], z.pos[2] - p.pos[2]) < 6); if (near) { S.addSt(p, 'dr', 0.3, 0.15); for (const z of S.zones) if (z.owner === p.id && z.def.turret) z.tacc = (z.tacc || 0) + 0.004; } },
  },
  thalia: {
    name: '순풍', desc: '세 번째 화살마다 돌풍이 실려 맞힌 적을 밀어낸다.',
    cast(S, p, slot) { if (slot === 'lmb') p.pasT.n = ((p.pasT.n || 0) + 1) % 3; },
    hit(S, p, t, dmg, o) { if (o.slot === 'lmb' && p.pasT.n === 0) { const dx = t.pos[0] - p.pos[0], dz = t.pos[2] - p.pos[2], l = Math.hypot(dx, dz) || 1; S.impulse(t, [dx / l * 9, 3, dz / l * 9], true); } },
  },
  gorm: {
    name: '늪의 친구', desc: '자신이 만든 늪이나 토템 안에 있으면 초당 체력 12를 회복한다.',
    tick(S, p, dt) { if (S.zones.some(z => z.owner === p.id && Math.hypot(z.pos[0] - p.pos[0], z.pos[2] - p.pos[2]) < z.r)) S.heal(p, p, 12 * dt, true); },
  },
  hyeon: {
    name: '발도술', desc: '2초 동안 칼을 뽑지 않았다면 다음 베기 피해가 두 배다.',
    cast(S, p, slot) { if (slot === 'lmb') { p.pasT.iai = S.now - (p.pasT.last || -9) > 2; p.pasT.last = S.now; } },
    out(S, p, t, dmg, o) { if (o.slot === 'lmb' && p.pasT.iai) { p.pasT.iai = false; S.ev({ t: 'fx', fx: 'crit', pos: S.chest(t) }); return 2; } },
  },
  nyx: {
    name: '공허의 메아리', desc: '파멸의 낙인이 터지면 E 재사용 대기시간이 초기화된다.',
    tick(S, p) { const had = p.pasT.dooms || 0; const now = S.enemiesOf(p).filter(e => e.doom && e.doom.src === p.id).length; if (now < had) p.cds.e = 0; p.pasT.dooms = now; },
  },
  ragna: {
    name: '광전사의 분노', desc: '잃은 체력 1%마다 피해가 0.8% 늘어난다.',
    out(S, p) { return 1 + (1 - p.hp / p.maxHp) * 0.8; },
  },
  pell: {
    name: '꿀벌의 은혜', desc: '펠이 치유한 아군은 3초 동안 초당 체력 6을 더 회복한다.',
    healOut(S, p, t) { if (t !== p) t.pasRegen = { until: S.now + 3, by: p.id }; return 1; },
    tick(S, p, dt) { for (const a of S.alliesOf(p)) if (a.pasRegen && a.pasRegen.by === p.id && a.pasRegen.until > S.now) a.hp = Math.min(a.maxHp, a.hp + 6 * dt); },
  },
  surtr: {
    name: '녹아내리는 발자국', desc: '움직이면 1초마다 발자국에 용암이 남는다. 화염 피해를 30% 덜 받는다.',
    tick(S, p) { if (Math.hypot(p.vel[0], p.vel[2]) > 2 && ready(S, p, 'step', 1)) S.spawnZone(p, { r: 1.4, dur: 3, dps: 18, look: 'fireground' }, p.pos); },
    inc(S, p, src, dmg) { return src && src.def.el === 'fire' ? dmg * 0.7 : dmg; },
  },
  celes: {
    name: '점성술', desc: '표식(받는 피해 증가)이 붙은 적을 별가루로 맞히면 작은 별이 터져 주변에 피해를 준다.',
    hit(S, p, t, dmg, o) { if (o.slot === 'lmb' && t.st.vuln && ready(S, p, 'star', 0.4)) { S.aoeAt(p, t.pos, 2.5, 18, { noLos: true }); S.ev({ t: 'fx', fx: 'explode', pos: S.chest(t), r: 2, look: 'star' }); } },
  },
  dorn: {
    name: '맹세', desc: '5초마다 6m 안의 아군 모두에게 보호막 20을 씌운다.',
    tick(S, p) { if (!ready(S, p, 'oath', 5)) return; for (const a of S.alliesOf(p)) if (dist(a, p) < 6) { a.shield = Math.max(a.shield, Math.min(80, (a.shield || 0) + 20)); a.shieldT = 4; } },
  },
  koru: {
    name: '추적자', desc: '자신이 피해를 준 적을 향해 움직이면 20% 빨라진다.',
    hit(S, p, t) { p.pasT.prey = t.id; p.pasT.preyT = S.now; },
    tick(S, p) { if (S.now - (p.pasT.preyT || -9) < 5) S.addSt(p, 'haste', 0.3, 0.2); },
  },
  maren: {
    name: '물의 순환', desc: '물방울로 아군을 치유하면 E 재사용 대기시간이 1초 줄어든다.',
    healOut(S, p, t) { if (t !== p) p.cds.e = Math.max(0, p.cds.e - 1); return 1; },
  },
  garrick: {
    name: '구속', desc: '묶이거나 기절한 적은 개릭에게 받는 피해가 20% 늘어난다.',
    out(S, p, t) { return t.st.root || t.st.stun ? 1.2 : 1; },
  },
  zephyr: {
    name: '바람 질주', desc: '공중에 있는 동안 피해가 30% 늘어난다.',
    out(S, p) { return p.onGround ? 1 : 1.3; },
  },
  lumen: {
    name: '태양 축적', desc: '열 번 맞힐 때마다 다음 탄이 폭발하는 태양탄이 된다.',
    res: { max: 10, name: '햇빛', color: '#ffd84a' },
    hit(S, p, t, dmg, o) { if (o.slot !== 'lmb') return; if (p.rs >= 10) { p.rs = 0; S.aoeAt(p, t.pos, 3, 32, { noLos: true }); S.ev({ t: 'fx', fx: 'explode', pos: S.chest(t), r: 3, look: 'sunbolt' }); } else S.gain(p, 1); },
  },
  frey: {
    name: '결투가', desc: '주변 6m에 다른 아군이 없는 고립된 적에게 피해가 25% 늘어난다.',
    out(S, p, t) { return S.alliesOf(t).some(a => a !== t && dist(a, t) < 6) ? 1 : 1.25; },
  },
  asha: {
    name: '불씨 수호', desc: '근처에서 아군이 쓰러지면 궁극기가 40% 찬다.',
    anyDeath(S, p, v) { if (v.team === p.team && dist(p, v) < 20) p.ult = Math.min(100, p.ult + 40); },
  },
  // ---------------- bosses ----------------
  ashlord: {
    name: '용광로의 핵', desc: '등 뒤의 핵을 맞으면 피해 +40%. 체력 2/3, 1/3에서 잿빛 망령을 부르고, 30% 아래에서는 격노한다.',
    spawn(S, p) { p.pasT.phase = 0; },
    inc(S, p, src, dmg) { return src && behind(src, p) ? dmg * 1.4 : dmg; },
    tick(S, p, dt) {
      const f = p.hp / p.maxHp;
      const want = f < 0.34 ? 2 : f < 0.67 ? 1 : 0;
      if (want > p.pasT.phase) {
        p.pasT.phase = want;
        S.ev({ t: 'fx', fx: 'bossPhase', id: p.id, n: want, pos: [...p.pos] });
        for (let i = 0; i < 3 + want; i++) { const a = i / (3 + want) * Math.PI * 2; S.spawnZone(p, { r: 2.2, dur: 14, dps: 22, chase: 5.5, look: 'ghost', st: { slow: [0.5, 0.25] } }, [p.pos[0] + Math.cos(a) * 6, p.pos[1], p.pos[2] + Math.sin(a) * 6]); }
        S.aoeAt(p, p.pos, 9, 40, { knock: 16, noLos: true });
      }
      if (f < 0.3 && !p.st.enrage) { p.st.enrage = { t: 999, v: 1 }; S.addSt(p, 'dmgUp', 999, 0.3); S.addSt(p, 'haste', 999, 0.25); S.ev({ t: 'fx', fx: 'bossPhase', id: p.id, n: 3, pos: [...p.pos] }); }
      p.ult = Math.min(100, p.ult + dt * 1.5);
    },
  },
};
