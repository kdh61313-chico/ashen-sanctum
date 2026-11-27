// Story campaign. Stage types:
//  skirmish: 3v3, first to `rounds`   duel: 1v1   survive: hold for `waves` waves   boss: enemy leader is huge
// stars: [win, no local deaths, finish under `time` seconds]
// story nodes: read-only scenes between fights (script in story.js)
const T = (id, name, desc, o = {}) => ({ id, name, type: 'story', desc, enemies: [], allies: 0, first: { crystals: 120 }, again: {}, ...o });
const S = (id, name, type, o) => ({ id, name, type, map: 'sanctum', allies: 2, enemies: [], lv: 1, rounds: 1, waves: 0, time: 150, first: { crystals: 200, essence: 20 }, again: { essence: 8 }, ...o });

export const CHAPTERS = [
  {
    id: 1, name: '꺼진 잿불', sub: '제1장',
    story: '성역의 성화가 꺼진 밤, 문을 지키던 기사들이 하나둘 쓰러졌다. 무너진 안뜰에서 무엇이 불을 삼켰는지 알아내야 한다.',
    stages: [
      T('1-0', '성화가 꺼진 밤', '종탑의 종이 열세 번 울렸다. 별을 엮는 자가 성화지기를 깨운다.'),
      S('1-1', '무너진 정문', 'skirmish', { enemies: ['grom', 'selene', 'mor'], lv: 0.8, desc: '정문을 막은 약탈자들을 쫓아낸다.', time: 120, first: { crystals: 200, essence: 20, tome: 1 } }),
      S('1-2', '묘지기의 경고', 'duel', { allies: 0, enemies: ['grom'], lv: 0.9, desc: '묘지기 그롬이 길을 막는다. 일대일로 설득할 수밖에.', time: 90 }),
      S('1-3', '불타는 서고', 'skirmish', { map: 'archive', enemies: ['nir', 'nocturne', 'lian'], lv: 0.9, desc: '불길이 번지는 서고의 책장 사이에서 암살자들이 기다린다.', first: { crystals: 250, essence: 25, seal: 1 } }),
      S('1-4', '잿빛 행렬', 'survive', { waves: 3, lv: 0.85, desc: '성화로 몰려드는 망령의 행렬을 세 번 막아낸다.', time: 160 }),
      T('1-4s', '꺼지지 않은 등불', '무너진 회랑에서 카엘이 그날 밤의 이야기를 꺼낸다.'),
      S('1-5', '부서진 제단', 'skirmish', { rounds: 2, enemies: ['kael', 'eris', 'tyr'], lv: 0.95, map: 'sanctum', desc: '성역의 수호자였던 이들이 제단을 지킨다. 왜 우리를 막는가?', time: 220 }),
      S('1-6', '피의 맹세', 'duel', { allies: 0, enemies: ['valok'], lv: 1, desc: '혈맹 기사 발로크가 맹세를 걸고 결투를 청한다.', time: 100, first: { crystals: 300, essence: 30, tome: 1 } }),
      S('1-7', '성화의 잔해', 'skirmish', { map: 'archive', enemies: ['igna', 'helga', 'jack'], lv: 1, desc: '꺼진 성화 옆에 불을 다루는 자들이 모였다.' }),
      S('1-8', '잿불 삼킨 자', 'boss', { enemies: ['azrak', 'igna', 'helga'], boss: 'azrak', lv: 1.05, desc: '용의 피를 마신 아즈락이 성화의 불을 삼켰다. 되찾아라.', time: 180, first: { crystals: 500, essence: 40, seal: 2, permits: 1 }, perfect: { permits: 1 } }),
      T('1-9', '한 줌의 불씨', '되찾은 불씨가 성역에 작은 불을 밝힌다.', { first: { crystals: 200, permits: 1 } }),
    ],
  },
  {
    id: 2, name: '서리 묘지의 왕', sub: '제2장',
    story: '불의 흔적은 북쪽 왕가 묘역으로 이어진다. 눈 속에서 잠든 왕들이 다시 일어서고 있다.',
    stages: [
      T('2-0', '얼어붙은 묘역', '북쪽 왕가 묘역. 망자들이 성화 없이도 잠들어 있다.'),
      S('2-1', '얼어붙은 길', 'skirmish', { map: 'frostgrave', enemies: ['selene', 'ulfric', 'sien'], lv: 1.05, desc: '눈보라 속 사냥꾼들.' }),
      S('2-2', '늑대의 영역', 'duel', { map: 'frostgrave', allies: 0, enemies: ['ulfric'], lv: 1.1, desc: '혈월 늑대 울프릭의 사냥터.', time: 90 }),
      S('2-3', '영묘의 망령', 'survive', { map: 'frostgrave', waves: 4, lv: 0.95, desc: '영묘에서 깨어난 망령을 네 번 막는다.', time: 220, first: { crystals: 300, essence: 30, seal: 1 } }),
      S('2-4', '얼음 거울', 'skirmish', { map: 'frostgrave', enemies: ['luna', 'lian', 'elise'], lv: 1.1, desc: '얼음과 거울이 진짜를 감춘다.' }),
      T('2-4s', '모닥불 곁에서', '발로크가 세레니아에게 숨긴 것을 묻는다.'),
      S('2-5', '폭풍의 다리', 'skirmish', { map: 'bastion', rounds: 2, enemies: ['brann', 'tyr', 'maren'], lv: 1.12, desc: '협곡 위 다리를 막아선 산 같은 방어선. 밀려 떨어지지 마라.', time: 240 }),
      S('2-6', '결투가의 초대', 'duel', { map: 'frostgrave', allies: 0, enemies: ['frey'], lv: 1.15, desc: '프레이가 장갑을 던진다.', time: 80, first: { crystals: 300, essence: 30, tome: 2 } }),
      S('2-7', '왕의 근위대', 'skirmish', { map: 'bastion', enemies: ['ragna', 'luna', 'sien'], lv: 1.15, desc: '왕묘로 가는 마지막 근위대.' }),
      S('2-8', '눈의 여왕', 'boss', { map: 'frostgrave', enemies: ['luna', 'ragna', 'maren'], boss: 'luna', lv: 1.2, desc: '잠든 왕 대신 일어선 것은 여왕이었다.', time: 200, first: { crystals: 600, essence: 50, seal: 3, permits: 1 }, perfect: { permits: 1 } }),
      T('2-9', '녹은 관', '여왕이 아버지의 관을 연다. 목소리는 별지기를 알고 있었다.', { first: { crystals: 200, permits: 1 } }),
    ],
  },
  {
    id: 3, name: '심연의 용광로', sub: '제3장',
    story: '성화를 삼킨 불은 땅속 깊은 제련소에서 무언가를 벼리고 있었다. 잿빛 군주가 깨어나기 전에 막아야 한다.',
    stages: [
      T('3-0', '쇳물의 강', '얼어붙은 강 밑, 무언가를 벼리는 제련소.'),
      S('3-1', '용암 다리', 'skirmish', { map: 'forge', enemies: ['surtr', 'karman', 'bael'], lv: 1.2, desc: '녹아내리는 다리 위의 싸움.' }),
      S('3-2', '황혼의 왕릉', 'skirmish', { map: 'dunes', enemies: ['orin', 'mira', 'talon'], lv: 1.22, desc: '모래에 묻힌 왕릉을 포탑과 기관총이 지킨다.' }),
      S('3-3', '가라앉은 길', 'survive', { map: 'bog', waves: 5, lv: 1.05, desc: '늪에 잠긴 사원을 지나는 동안 다섯 웨이브를 버틴다.', time: 280, first: { crystals: 350, essence: 40, seal: 2 } }),
      S('3-4', '역병의 사원', 'skirmish', { map: 'bog', enemies: ['onyx', 'belladonna', 'gorm'], lv: 1.25, desc: '독과 늪의 술사들.' }),
      T('3-4s', '별지기의 고백', '세레니아가 별의 왕국 나르헬과 그 왕의 이야기를 한다.'),
      S('3-5', '공허의 문턱', 'skirmish', { map: 'bog', rounds: 2, enemies: ['sira', 'nyx', 'mariette'], lv: 1.28, desc: '공허가 새어 나오는 곳.', time: 260 }),
      S('3-6', '검성', 'duel', { map: 'dunes', allies: 0, enemies: ['hyeon'], lv: 1.3, desc: '뇌명 검성 현. 칼은 한 번만 뽑는다.', time: 80, first: { crystals: 400, essence: 40, tome: 2 } }),
      S('3-7', '지옥의 기사단', 'skirmish', { map: 'forge', enemies: ['bael', 'crow', 'veronica'], lv: 1.3, desc: '군주의 마지막 기사단.' }),
      S('3-8', '잿빛 군주', 'boss', { map: 'forge', enemies: ['ashlord'], allies: 2, boss: 'ashlord', lv: 0.75, desc: '용광로에서 벼려진 잿빛 군주. 성화를 되찾을 마지막 기회다.', time: 260, first: { crystals: 1000, essence: 80, seal: 5, permits: 2 }, perfect: { permits: 2 } }),
      T('3-9', '빼앗긴 심지', '그릇은 깨졌지만, 성화의 심지는 사라졌다.', { first: { crystals: 200, permits: 1 } }),
    ],
  },
  {
    id: 4, name: '심연을 삼킨 왕', sub: '제4장',
    story: '성화의 심지를 빼앗겼다. 천 년 동안 굶주린 왕이 성역으로 향한다. 폭풍 성채와 늪의 정원을 지나, 그보다 먼저 성역에 닿아야 한다.',
    stages: [
      T('4-0', '바람의 사냥꾼', '폭풍 성채에서 미르가 길잡이를 자청한다.'),
      S('4-1', '폭풍의 관문', 'skirmish', { map: 'bastion', allyHeroes: ['mir'], enemies: ['zephyr', 'aura', 'thalia'], lv: 1.32, desc: '왕의 그림자에 홀린 폭풍 기수들이 관문을 막는다.' }),
      S('4-2', '하늘의 목소리', 'duel', { map: 'bastion', allies: 0, enemies: ['razel'], lv: 1.36, desc: '폭풍 술사 라젤이 협곡 위에서 기다린다.', time: 90, first: { crystals: 400, essence: 45, tome: 2 } }),
      S('4-3', '시든 정원', 'survive', { map: 'bog', allyHeroes: ['osel'], waves: 5, lv: 1.15, desc: '오셀이 씨앗을 심는 동안 말라 죽은 것들을 막아낸다.', time: 280, first: { crystals: 400, essence: 45, seal: 2 } }),
      S('4-4', '왕의 감옥', 'skirmish', { map: 'dunes', enemies: ['moloch', 'garrick', 'crow'], lv: 1.38, desc: '심연의 왕을 섬기는 간수들.' }),
      T('4-4s', '심연에서도 자라는 씨앗', '오셀이 작은 씨앗 주머니를 건넨다.'),
      S('4-5', '피의 별지기', 'skirmish', { map: 'archive', rounds: 2, enemies: ['veyla', 'sira', 'nyx'], lv: 1.4, desc: '왕은 별지기의 피를 원한다.', time: 260 }),
      S('4-6', '왕의 그림자', 'duel', { map: 'sanctum', allies: 0, enemies: ['karnok'], lv: 1.05, desc: '성역으로 가는 길목, 왕의 그림자가 맛을 보러 왔다.', time: 100, first: { crystals: 450, essence: 50, tome: 2 } }),
      S('4-7', '심연의 연회', 'skirmish', { map: 'archive', allyHeroes: ['serenia'], enemies: ['mariette', 'nocturne', 'veronica'], lv: 1.42, desc: '성화를 요리로 내놓는 연회장.' }),
      S('4-8', '심연을 삼킨 왕', 'boss', { map: 'sanctum', allyHeroes: ['serenia', 'mir'], enemies: ['karnok', 'moloch', 'veyla'], boss: 'karnok', lv: 1.45, desc: '성역의 제단에서 카르녹이 마지막 불을 삼키려 한다.', time: 240, first: { crystals: 1200, essence: 100, seal: 6, tome: 4, permits: 3 }, perfect: { crystals: 600, permits: 2 } }),
      T('4-9', '다시 타오르는 불', '성역의 성화가 다시 타오른다.', { first: { crystals: 500, permits: 2 } }),
    ],
  },
];
export const STAGE_MAP = Object.fromEntries(CHAPTERS.flatMap(c => c.stages.map(s => [s.id, { ...s, chapter: c.id }])));
export const STAGE_TYPES = { skirmish: '교전', duel: '결투', survive: '방어', boss: '우두머리', story: '이야기' };

export const RAID = {
  boss: 'ashlord', name: '잿빛 군주', title: '용광로의 폭군',
  desc: '심연의 용광로에서 벼려진 거인. 등 뒤의 불타는 핵이 약점이다. 체력이 2/3, 1/3이 되면 잿빛 망령을 부르고, 30% 아래에서는 격노한다.',
  diffs: [
    { name: '보통', mul: 0.8, dmg: 0.65, desc: '처음 도전할 때.' },
    { name: '어려움', mul: 1.2, dmg: 0.9, desc: '육성한 영웅으로.' },
    { name: '악몽', mul: 1.7, dmg: 1.2, desc: '최고의 영웅과 실력이 필요해요.' },
  ],
};
