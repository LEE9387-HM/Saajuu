import {
  calculateFourPillars,
  getEarthlyBranchElement,
  getHeavenlyStemElement,
  getTenGod,
} from "manseryeok";
import { ELEMENT_PRESCRIPTION, getReadingContext } from "./fortune.js";

// 상생(相生) 맵 — manseryeok이 루트로 export하지 않아 자체 정의한다.
export const ELEMENT_GENERATES = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };

export const LUCKY_NUMBERS = { 목: [3, 8], 화: [2, 7], 토: [5, 10], 금: [4, 9], 수: [1, 6] };
const LUCKY_DIRECTION = { 목: "동쪽", 화: "남쪽", 토: "중앙", 금: "서쪽", 수: "북쪽" };
const LUCKY_FOOD = {
  목: "푸른 채소와 산뜻한 차",
  화: "따뜻한 국물과 붉은 과일",
  토: "곡물과 뿌리채소",
  금: "담백한 단백질과 흰 음식",
  수: "물 많은 과일과 해조류",
};
const LUCKY_ITEM = {
  목: "메모장",
  화: "작은 조명",
  토: "편한 신발",
  금: "금속 펜",
  수: "텀블러",
};

export const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 지지 관계 — 배타 분류가 아니라 다중 관계라서 우선순위로 확정한다: 충 > 형 > 육합 > 반합.
// 예: 인-신(충+삼형)→충, 사-신(육합+삼형)→형, 축-미(충+삼형)→충, 진·오·유·해 동일지지→형(자형).
const CLASH_PAIRS = [
  ["자", "오"],
  ["축", "미"],
  ["인", "신"],
  ["묘", "유"],
  ["진", "술"],
  ["사", "해"],
];
const PUNISH_PAIRS = [
  ["인", "사"],
  ["사", "신"],
  ["인", "신"],
  ["축", "술"],
  ["술", "미"],
  ["축", "미"],
  ["자", "묘"],
];
const SELF_PUNISH = ["진", "오", "유", "해"];
const HARMONY_PAIRS = [
  ["자", "축"],
  ["인", "해"],
  ["묘", "술"],
  ["진", "유"],
  ["사", "신"],
  ["오", "미"],
];
const TRIAD_GROUPS = [
  ["신", "자", "진"],
  ["해", "묘", "미"],
  ["인", "오", "술"],
  ["사", "유", "축"],
];

function hasPair(pairs, a, b) {
  return pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

export function getBranchRelation(a, b) {
  if (a === b) {
    return SELF_PUNISH.includes(a) ? "형" : "없음";
  }
  if (hasPair(CLASH_PAIRS, a, b)) return "충";
  if (hasPair(PUNISH_PAIRS, a, b)) return "형";
  if (hasPair(HARMONY_PAIRS, a, b)) return "육합";
  if (TRIAD_GROUPS.some((group) => group.includes(a) && group.includes(b))) return "반합";
  return "없음";
}

const DAILY_TEN_GOD = {
  비견: {
    verdict: "내 페이스대로 밀고 가기 좋은 날",
    hint: "남과 비교하지 않을수록 일이 가볍습니다",
    caution: "고집이 세지기 쉬운 날이에요. 반대 의견 하나는 끝까지 들어보세요.",
  },
  겁재: {
    verdict: "지갑과 승부욕을 단속해야 하는 날",
    hint: "경쟁심이 살아나는 만큼 지출도 커지기 쉽습니다",
    caution: "충동 지출과 즉흥적인 내기·약속을 조심하세요.",
  },
  식신: {
    verdict: "꾸준히 만들어온 것이 빛나는 날",
    hint: "작게라도 결과물을 내보내기 좋습니다",
    caution: "먹고 쉬는 리듬이 무너지면 집중도 함께 무너져요.",
  },
  상관: {
    verdict: "아이디어는 살리고 말은 아끼는 날",
    hint: "새로운 표현 욕구가 커지는 흐름입니다",
    caution: "윗사람·규칙과의 마찰을 조심하세요. 비판은 하루 묵혔다 전하세요.",
  },
  편재: {
    verdict: "기회와 사람이 넓게 들어오는 날",
    hint: "가벼운 만남에서 뜻밖의 연결이 생깁니다",
    caution: "돈이 드나드는 만큼 오늘 쓴 돈을 기록해 두세요.",
  },
  정재: {
    verdict: "성실함이 그대로 돌아오는 날",
    hint: "계획한 일을 순서대로 처리하기 좋습니다",
    caution: "작은 약속일수록 지키세요. 오늘의 신용이 오래 갑니다.",
  },
  편관: {
    verdict: "압박을 실행력으로 바꾸는 날",
    hint: "미뤄둔 어려운 일을 정면으로 처리하기 좋습니다",
    caution: "무리한 일정은 몸부터 상하게 해요. 회복 시간을 먼저 잡으세요.",
  },
  정관: {
    verdict: "벌이기보다 매듭짓기 좋은 날",
    hint: "약속·서류·마무리가 힘을 받습니다",
    caution: "절차를 건너뛰면 두 번 일하게 됩니다. 순서대로 가세요.",
  },
  편인: {
    verdict: "직감과 낯선 공부가 살아나는 날",
    hint: "평소와 다른 관점에서 힌트가 옵니다",
    caution: "시작만 늘어놓지 말고 오늘은 하나만 정해 파고드세요.",
  },
  정인: {
    verdict: "배움과 문서에 힘이 붙는 날",
    hint: "미뤄둔 공부·증명·신청을 정리하기 좋습니다",
    caution: "받기만 하다 답례와 연락을 놓치지 마세요.",
  },
};

const RELATION_NOTE = {
  충: "다만 오늘 일진이 내 일지와 부딪히는 충이라, 계획이 흔들리면 억지로 붙잡기보다 방향을 다시 잡는 계기로 삼으세요.",
  형: "다만 오늘은 일지와 형이 걸려 신경이 곤두서기 쉬우니, 사소한 마찰에 힘을 쓰지 마세요.",
  육합: "게다가 오늘 일진이 내 일지와 합을 이뤄, 인연과 협력이 부드럽게 붙는 날입니다.",
  반합: "게다가 일지와 반합이 걸려, 같은 목표를 가진 사람과 힘을 모으기 좋은 날입니다.",
  없음: "",
};

const RELATION_SCORE = { 충: -10, 형: -7, 없음: 0, 반합: 6, 육합: 8 };
const TEN_GOD_SCORE = {
  비견: { work: 76, relation: 68, money: 64, life: 72, action: "오늘 결정 하나는 남과 비교하지 말고 내 기준으로 정리하세요." },
  겁재: { work: 70, relation: 62, money: 56, life: 66, action: "지출과 약속을 하나 줄이고, 기록으로 남겨두세요." },
  식신: { work: 78, relation: 72, money: 68, life: 80, action: "작게라도 결과물을 끝내고 눈에 보이게 남기세요." },
  상관: { work: 72, relation: 60, money: 66, life: 68, action: "하고 싶은 말은 메모에 먼저 쓰고, 핵심만 전하세요." },
  편재: { work: 74, relation: 76, money: 73, life: 67, action: "새 제안은 열어두되, 돈이 오가는 일은 조건을 확인하세요." },
  정재: { work: 80, relation: 70, money: 78, life: 74, action: "미뤄둔 정산, 예약, 약속 하나를 마무리하세요." },
  편관: { work: 77, relation: 64, money: 65, life: 60, action: "어려운 일 하나를 정면으로 처리하되 쉬는 시간을 먼저 잡으세요." },
  정관: { work: 82, relation: 72, money: 70, life: 76, action: "절차가 필요한 일부터 순서대로 매듭지으세요." },
  편인: { work: 68, relation: 66, money: 60, life: 73, action: "새로운 자료를 넓게 보기보다 한 가지 질문만 파고드세요." },
  정인: { work: 75, relation: 74, money: 66, life: 78, action: "문서, 신청, 공부처럼 쌓아둔 일을 정리하세요." },
};

const TIME_SLOT_LABELS = ["아침", "점심", "오후", "저녁", "밤"];
const CONSULT_QUESTION = {
  충: "오늘 흔들리는 결정이 있다면, 무엇을 붙잡고 무엇을 바꿔야 할지 같이 정리해 볼까요?",
  형: "사소한 말에 마음이 걸린다면, 그 감정이 어디서 반복되는지 같이 짚어볼까요?",
  육합: "오늘 가까워지는 사람과 어떤 기대를 맞춰야 할지 이야기해 볼까요?",
  반합: "같은 목표를 가진 사람과 어디까지 함께 가도 좋을지 정리해 볼까요?",
  없음: "오늘 마음에 남는 고민을 사주 흐름과 함께 한 문장으로 좁혀볼까요?",
};

function clampScore(score) {
  return Math.max(35, Math.min(96, Math.round(score)));
}

function buildScores(tenGod, relation, branchIndex) {
  const base = TEN_GOD_SCORE[tenGod];
  const relationDelta = RELATION_SCORE[relation];
  const rhythm = (branchIndex % 5) - 2;
  const areas = {
    work: clampScore(base.work + relationDelta + rhythm),
    relation: clampScore(base.relation + relationDelta - rhythm),
    money: clampScore(base.money + Math.floor(relationDelta / 2) + (branchIndex % 3) - 1),
    life: clampScore(base.life + Math.floor(relationDelta / 2) - (branchIndex % 4) + 1),
  };
  const total = clampScore((areas.work + areas.relation + areas.money + areas.life) / 4);
  return {
    total,
    areas: [
      { key: "work", label: "일", score: areas.work },
      { key: "relation", label: "관계", score: areas.relation },
      { key: "money", label: "금전", score: areas.money },
      { key: "life", label: "생활", score: areas.life },
    ],
  };
}

function buildTimeSlots(total, relation, branchIndex) {
  const relationShift = relation === "충" || relation === "형" ? -5 : relation === "육합" || relation === "반합" ? 4 : 0;
  return TIME_SLOT_LABELS.map((label, index) => {
    const wave = ((branchIndex + index * 2) % 7) - 3;
    return { label, score: clampScore(total + relationShift + wave * 3) };
  });
}

function getDayPillarOf(date) {
  return calculateFourPillars({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: 12,
    minute: 0,
    isLunar: false,
    isLeapMonth: false,
  }).day;
}

export function localDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function resolveLuckyElement(todayStemElement, balance) {
  if (todayStemElement === balance.strongest.element) {
    return ELEMENT_GENERATES[balance.strongest.element];
  }
  return balance.weakest.element;
}

export function buildDailyFortune(chart, now = new Date()) {
  const { balance, dayPillar } = getReadingContext(chart);

  const today = getDayPillarOf(now);
  const todayStem = today.heavenlyStem;
  const todayBranch = today.earthlyBranch;
  const todayStemElement = getHeavenlyStemElement(todayStem);
  const tenGod = getTenGod(dayPillar.stem, todayStem);
  const meta = DAILY_TEN_GOD[tenGod];
  const relation = getBranchRelation(todayBranch, dayPillar.branch);

  const luckyElement = resolveLuckyElement(todayStemElement, balance);
  const [numA, numB] = LUCKY_NUMBERS[luckyElement];
  const branchIndex = BRANCHES.indexOf(todayBranch);
  const luckyNumber = branchIndex % 2 === 0 ? numA : numB;
  const luckySecondary = branchIndex % 2 === 0 ? numB : numA;
  const luckyColor = ELEMENT_PRESCRIPTION[luckyElement].color;
  const scores = buildScores(tenGod, relation, branchIndex);
  const timeSlots = buildTimeSlots(scores.total, relation, branchIndex);

  const tomorrowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 0);
  const tomorrowPillar = getDayPillarOf(tomorrowDate);
  const tomorrowTenGod = getTenGod(dayPillar.stem, tomorrowPillar.heavenlyStem);

  return {
    dateKey: localDateKey(now),
    dateLabel: `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(
      now.getDate(),
    ).padStart(2, "0")} ${WEEKDAYS[now.getDay()]}요일`,
    ganji: `${todayStem}${todayBranch}`,
    tenGod,
    relation,
    verdict: meta.verdict,
    sub: `일간 ${dayPillar.stem} 기준 ${tenGod}의 하루 — ${meta.hint}. ${RELATION_NOTE[relation]}`.trim(),
    caution: meta.caution,
    totalScore: scores.total,
    areaScores: scores.areas,
    timeSlots,
    action: TEN_GOD_SCORE[tenGod].action,
    luckyElement,
    luckyNumber,
    luckySecondary,
    luckyColor,
    luckyDirection: LUCKY_DIRECTION[luckyElement],
    luckyFood: LUCKY_FOOD[luckyElement],
    luckyItem: LUCKY_ITEM[luckyElement],
    consultQuestion: CONSULT_QUESTION[relation],
    tomorrow: {
      ganji: `${tomorrowPillar.heavenlyStem}${tomorrowPillar.earthlyBranch}`,
      verdict: DAILY_TEN_GOD[tomorrowTenGod].verdict,
    },
    evidence: [
      `일진 ${todayStem}${todayBranch}`,
      `십신 ${tenGod}`,
      relation === "없음" ? `일지 ${dayPillar.branch}` : `일지 관계 ${relation}`,
      `행운 오행 ${luckyElement}`,
    ],
  };
}
