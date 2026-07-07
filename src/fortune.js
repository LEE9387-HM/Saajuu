import {
  calculateFourPillars,
  getEarthlyBranchElement,
  getHeavenlyStemElement,
} from "manseryeok";

export const ELEMENTS = ["목", "화", "토", "금", "수"];

export const TOPIC_OPTIONS = [
  { value: "relationship", label: "궁합·연애", prompt: "이 관계의 흐름이 궁금해요" },
  { value: "marriage", label: "결혼운", prompt: "결혼과 장기 관계를 보고 싶어요" },
  { value: "business", label: "사업운", prompt: "창업·동업·돈의 흐름이 궁금해요" },
  { value: "career", label: "직업·이직운", prompt: "일과 역할의 방향을 보고 싶어요" },
  { value: "family", label: "가족·자녀운", prompt: "가족 안에서의 역할을 이해하고 싶어요" },
  { value: "yearly", label: "신년·월간운", prompt: "앞으로의 흐름을 정리하고 싶어요" },
];

export const TONE_OPTIONS = [
  { value: "balanced", label: "차분한 상담톤", prompt: "마음을 받아주되 현실을 정리해요" },
  { value: "direct", label: "현실 점검톤", prompt: "돌려 말하지 않고 핵심을 짚어요" },
  { value: "warm", label: "위로 중심톤", prompt: "불안을 먼저 낮추며 이야기해요" },
];

const ELEMENT_META = {
  목: { label: "나무", hint: "성장과 시작을" },
  화: { label: "불", hint: "표현과 활력을" },
  토: { label: "흙", hint: "안정과 연결을" },
  금: { label: "쇠", hint: "결단과 정리를" },
  수: { label: "물", hint: "통찰과 유연함을" },
};

const PILLAR_LABELS = [
  ["year", "연주", "뿌리"],
  ["month", "월주", "환경"],
  ["day", "일주", "나"],
  ["hour", "시주", "미래"],
];

const STEM_META = {
  갑: {
    symbol: "곧게 자라는 큰 나무",
    core: "방향을 정하면 긴 호흡으로 밀고 나가는 성향을 살펴볼 수 있습니다.",
    strength: "기준을 세우고 새로운 판을 시작하는 힘",
    watch: "옳다고 정한 방향에 매여 다른 가능성을 놓치지 않는지",
    question: "지금 지키는 원칙은 나의 성장을 돕고 있나요?",
  },
  을: {
    symbol: "빛을 찾아 뻗는 풀과 덩굴",
    core: "주변을 읽고 연결점을 찾으며 유연하게 성장하는 성향을 살펴볼 수 있습니다.",
    strength: "관계를 엮고 상황에 맞는 길을 찾는 힘",
    watch: "배려와 적응이 지나쳐 내 방향을 늦게 말하지 않는지",
    question: "맞춰주기 전에 내가 원하는 것을 먼저 말해보면 어떨까요?",
  },
  병: {
    symbol: "넓게 비추는 태양",
    core: "에너지를 밖으로 표현하고 사람과 분위기를 밝히는 성향을 살펴볼 수 있습니다.",
    strength: "빠르게 공유하고 주변의 온도를 올리는 힘",
    watch: "속도를 내느라 세부와 회복 시간을 건너뛰지 않는지",
    question: "오늘 나의 에너지를 어디에 비추면 가장 효과적일까요?",
  },
  정: {
    symbol: "가까운 곳을 밝히는 등불",
    core: "섬세하게 관찰하고 필요한 곳에 집중해 온기를 만드는 성향을 살펴볼 수 있습니다.",
    strength: "작은 차이를 알아보고 깊이 몰입하는 힘",
    watch: "마음속 긴장을 혼자 오래 품고 있지 않은지",
    question: "지금 집중할 단 하나를 고른다면 무엇인가요?",
  },
  무: {
    symbol: "흔들림을 받아내는 산",
    core: "중심을 잡고 사람과 일을 안정적으로 받쳐주는 성향을 살펴볼 수 있습니다.",
    strength: "큰 흐름을 지키고 책임을 오래 감당하는 힘",
    watch: "변화를 늦추는 것이 신중함인지 익숙함 때문인지",
    question: "지켜야 할 것과 바꿔도 될 것을 나눠본다면?",
  },
  기: {
    symbol: "씨앗을 품는 밭",
    core: "세부를 돌보고 자원이 자랄 환경을 만드는 성향을 살펴볼 수 있습니다.",
    strength: "현실적인 순서로 정리하고 꾸준히 돌보는 힘",
    watch: "모두를 챙기느라 내 자원을 먼저 소진하지 않는지",
    question: "내가 돌보는 것 중 하나를 덜어낸다면 무엇일까요?",
  },
  경: {
    symbol: "단련을 기다리는 쇠",
    core: "문제를 분명히 보고 결단하며 구조를 바꾸는 성향을 살펴볼 수 있습니다.",
    strength: "불필요한 것을 걷어내고 실행으로 전환하는 힘",
    watch: "정확함을 위해 관계의 온도를 놓치지 않는지",
    question: "결론을 내리기 전 한 번 더 들어야 할 목소리는 누구인가요?",
  },
  신: {
    symbol: "정교하게 다듬은 보석",
    core: "완성도와 차이를 세밀하게 감지하고 표현하는 성향을 살펴볼 수 있습니다.",
    strength: "기준을 높이고 결과물을 정교하게 다듬는 힘",
    watch: "완벽한 때를 기다리며 공개와 실험을 미루지 않는지",
    question: "80%의 완성도로 먼저 보여줄 수 있는 것은 무엇인가요?",
  },
  임: {
    symbol: "경계를 넘나드는 큰물",
    core: "정보와 사람을 폭넓게 받아들이며 큰 흐름을 찾는 성향을 살펴볼 수 있습니다.",
    strength: "새로운 가능성을 연결하고 판을 넓게 보는 힘",
    watch: "선택지를 늘리다가 한 방향에 힘을 모으지 못하는지",
    question: "많은 가능성 중 이번 주에 실험할 하나는 무엇인가요?",
  },
  계: {
    symbol: "스며들어 변화를 만드는 비",
    core: "미세한 분위기와 맥락을 읽고 조용히 해답을 찾는 성향을 살펴볼 수 있습니다.",
    strength: "관찰한 정보를 연결해 섬세한 통찰로 바꾸는 힘",
    watch: "생각이 깊어질수록 행동의 시작이 늦어지지 않는지",
    question: "더 생각하기보다 작게 확인해볼 수 있는 행동은 무엇인가요?",
  },
};

const TEN_GOD_META = {
  비견: "자기 기준과 독립성을 중요하게 여기는 흐름",
  겁재: "경쟁과 협업 속에서 추진력이 살아나는 흐름",
  식신: "경험을 결과물과 꾸준한 표현으로 바꾸는 흐름",
  상관: "기존 방식에 질문하고 새롭게 표현하려는 흐름",
  편재: "사람과 기회를 넓게 연결하고 빠르게 움직이는 흐름",
  정재: "현실적인 기준으로 자원과 약속을 관리하는 흐름",
  편관: "압박을 목표와 실행력으로 전환하려는 흐름",
  정관: "질서와 책임, 신뢰할 수 있는 역할을 중시하는 흐름",
  편인: "익숙하지 않은 관점과 직관에서 답을 찾는 흐름",
  정인: "배움과 이해를 쌓아 안정적인 판단으로 만드는 흐름",
};

const TOPIC_META = {
  relationship: {
    eyebrow: "궁합·연애",
    title: ({ balance }) => `끌림보다 ${balance.strongest.label} 기운의 표현 방식을 살펴보세요`,
    copy: ({ dayMeta, dominantTenGod }) =>
      `관계에서는 ${dayMeta.core.replace("살펴볼 수 있습니다.", "드러나기 쉽습니다.")} ` +
      `특히 ${dominantTenGod} 흐름이 반복될 때, 상대의 마음을 맞히려 하기보다 내가 어떤 방식으로 다가가고 물러나는지 보는 편이 더 정확합니다.`,
    point: "상대의 답을 기다리기 전에 내가 반복하는 거리감과 기대치를 먼저 정리하기",
    checklist: ["자주 서운해지는 장면", "연락과 만남의 속도", "갈등 뒤 회복 방식"],
    questions: [
      "이 관계에서 가장 자주 반복되는 서운함은 무엇인가요?",
      "상대가 바뀌길 바라는 부분과 내가 조정할 수 있는 부분은 무엇인가요?",
      "결론보다 먼저 확인해야 할 대화 주제는 무엇인가요?",
    ],
  },
  marriage: {
    eyebrow: "결혼운",
    title: ({ dayPillar }) => `${dayPillar.stem}${dayPillar.branch} 일주는 생활의 리듬을 먼저 봐야 해요`,
    copy: ({ balance }) =>
      `결혼운은 결혼 여부를 맞히는 문제가 아니라 오래 같이 살 때 균형이 맞는지를 보는 질문입니다. ` +
      `${balance.strongest.label} 기운이 강하게 쓰일수록 장점은 분명해지지만, 생활 습관과 책임 분담에서는 같은 방식이 부담으로 읽힐 수 있습니다.`,
    point: "감정의 확신보다 돈, 가족, 생활 리듬을 대화로 확인하기",
    checklist: ["돈과 생활비 기준", "양가와 거리감", "집안일과 책임 분담"],
    questions: [
      "결혼을 생각할 때 가장 불안한 현실 조건은 무엇인가요?",
      "상대와 아직 말하지 못한 생활 기준은 무엇인가요?",
      "내가 결혼에서 절대 양보하기 어려운 것은 무엇인가요?",
    ],
  },
  business: {
    eyebrow: "사업운",
    title: ({ dominantTenGod }) => `${dominantTenGod} 흐름으로 돈을 버는 방식을 점검해 보세요`,
    copy: ({ dayMeta, balance }) =>
      `사업운은 성공을 보장하는 답이 아니라 내가 어떤 방식으로 기회를 만들고 리스크를 키우는지 보는 지도에 가깝습니다. ` +
      `${dayMeta.strength}은 강점으로 쓰이지만, ${balance.weakest.label} 기운이 약하게 보이는 부분은 운영 습관이나 파트너로 보완해야 합니다.`,
    point: "아이디어보다 고객, 현금흐름, 같이 일할 사람의 역할을 먼저 검증하기",
    checklist: ["30일 안에 팔 수 있는 최소 상품", "혼자 할 일과 맡길 일", "동업자와 돈을 나누는 기준"],
    questions: [
      "지금 사업 아이디어를 가장 빨리 돈으로 확인하는 방법은 무엇인가요?",
      "내가 직접 해야 하는 일과 파트너가 맡아야 하는 일은 무엇인가요?",
      "실패했을 때 가장 먼저 흔들릴 비용은 무엇인가요?",
    ],
  },
  career: {
    eyebrow: "직업·이직운",
    title: ({ balance }) => `${balance.strongest.label} 기운이 잘 쓰이는 역할을 찾아보세요`,
    copy: ({ dayMeta }) =>
      `직업운은 직업 이름 하나를 고르는 것보다, 어떤 환경에서 내 힘이 오래 유지되는지를 보는 쪽이 실용적입니다. ` +
      `${dayMeta.strength}이 살아나는 역할에서는 속도가 붙지만, 맞지 않는 조직에서는 같은 장점이 피로로 바뀔 수 있습니다.`,
    point: "직무명보다 일하는 방식, 의사결정 속도, 피드백 문화를 먼저 비교하기",
    checklist: ["에너지가 나는 업무", "소진되는 회의와 관계", "다음 역할에서 지킬 기준"],
    questions: [
      "최근 일에서 가장 자주 지치는 장면은 무엇인가요?",
      "내 강점이 가장 잘 보였던 프로젝트는 어떤 조건이었나요?",
      "이직을 한다면 피하고 싶은 조직의 패턴은 무엇인가요?",
    ],
  },
  family: {
    eyebrow: "가족·자녀운",
    title: ({ dayMeta }) => `가족 안에서는 ${dayMeta.strength}이 역할로 나타날 수 있어요`,
    copy: ({ balance }) =>
      `가족운과 자녀운은 임신이나 출산을 예측하는 풀이가 아닙니다. ` +
      `가까운 사람을 돌볼 때 어떤 방식으로 책임을 느끼고, ${balance.weakest.label} 기운처럼 부족한 부분을 어떻게 생활로 보완할지 살펴보는 자기 이해에 가깝습니다.`,
    point: "결과를 맞히기보다 가족 안에서 반복되는 소통 방식과 책임감을 보기",
    checklist: ["돌봄을 혼자 떠안는 순간", "가족에게 기대하는 말", "휴식과 경계선"],
    questions: [
      "가족 안에서 내가 자주 맡게 되는 역할은 무엇인가요?",
      "돌봄과 책임이 부담으로 바뀌는 순간은 언제인가요?",
      "가족과의 대화에서 먼저 정리해야 할 경계는 무엇인가요?",
    ],
  },
  yearly: {
    eyebrow: "신년·월간운",
    title: ({ balance }) => `${balance.strongest.label} 기운은 살리고 ${balance.weakest.label} 기운은 보완하는 흐름`,
    copy: ({ dominantTenGod }) =>
      `시기운은 좋은 달과 나쁜 달을 단정하기보다, 이번 흐름에서 어떤 태도를 쓰면 덜 흔들리는지 정리하는 도구로 보는 편이 좋습니다. ` +
      `${dominantTenGod} 흐름이 익숙하게 나타나므로, 올해의 계획도 이 방식이 과해지는 순간을 미리 체크하는 데서 시작합니다.`,
    point: "올해의 목표를 크게 세우기보다 30일 단위로 확인할 행동을 정하기",
    checklist: ["이번 달에 줄일 것", "이번 달에 반복할 것", "다시 미루지 않을 결정"],
    questions: [
      "올해 가장 정리하고 싶은 관계나 일은 무엇인가요?",
      "이번 달에 작게 확인할 수 있는 변화는 무엇인가요?",
      "좋은 흐름이 왔을 때 바로 잡을 준비가 된 일은 무엇인가요?",
    ],
  },
};

const TONE_META = {
  balanced: {
    opening: "차분하게 보면 지금 필요한 것은 정답보다 감정과 조건을 나눠 정리하는 일입니다.",
    caution: "불안한 마음을 바로 결론으로 바꾸기보다, 확인 가능한 장면부터 좁혀보세요.",
    action: "이번 주에는 생각을 길게 붙잡기보다 한 가지 질문을 실제 대화나 행동으로 확인해 보세요.",
  },
  direct: {
    opening: "현실적으로 보면 지금은 느낌보다 반복 패턴과 비용을 먼저 봐야 합니다.",
    caution: "좋은 말만 듣고 싶은 순간일수록 상대, 돈, 시간, 책임 중 무엇이 막혀 있는지 분리해야 합니다.",
    action: "이번 주에는 미루던 기준 하나를 문장으로 적고, 그 기준에 맞지 않는 선택을 하나 줄여보세요.",
  },
  warm: {
    opening: "먼저 지금의 고민이 가볍지 않다는 점을 인정하고 시작하는 편이 좋습니다.",
    caution: "스스로를 몰아붙이기보다, 계속 반복된 마음의 피로가 어디에서 시작되는지 살펴보세요.",
    action: "이번 주에는 큰 결정을 내리기보다 마음이 안정되는 대화 한 번을 먼저 만들어 보세요.",
  },
};

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
const HANGUL_INITIALS = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];
const HANGUL_MEDIALS = [
  "ㅏ",
  "ㅐ",
  "ㅑ",
  "ㅒ",
  "ㅓ",
  "ㅔ",
  "ㅕ",
  "ㅖ",
  "ㅗ",
  "ㅘ",
  "ㅙ",
  "ㅚ",
  "ㅛ",
  "ㅜ",
  "ㅝ",
  "ㅞ",
  "ㅟ",
  "ㅠ",
  "ㅡ",
  "ㅢ",
  "ㅣ",
];
const HANGUL_FINALS = [
  "",
  "ㄱ",
  "ㄲ",
  "ㄳ",
  "ㄴ",
  "ㄵ",
  "ㄶ",
  "ㄷ",
  "ㄹ",
  "ㄺ",
  "ㄻ",
  "ㄼ",
  "ㄽ",
  "ㄾ",
  "ㄿ",
  "ㅀ",
  "ㅁ",
  "ㅂ",
  "ㅄ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

const SOUND_ELEMENT = {
  ㄱ: "목",
  ㄲ: "목",
  ㅋ: "목",
  ㄴ: "화",
  ㄷ: "화",
  ㄸ: "화",
  ㄹ: "화",
  ㅌ: "화",
  ㅁ: "토",
  ㅂ: "토",
  ㅃ: "토",
  ㅍ: "토",
  ㅅ: "금",
  ㅆ: "금",
  ㅈ: "금",
  ㅉ: "금",
  ㅊ: "금",
  ㅇ: "수",
  ㅎ: "수",
  ㅏ: "목",
  ㅐ: "목",
  ㅑ: "목",
  ㅒ: "목",
  ㅗ: "화",
  ㅘ: "화",
  ㅙ: "화",
  ㅚ: "화",
  ㅛ: "화",
  ㅡ: "토",
  ㅢ: "토",
  ㅣ: "금",
  ㅓ: "수",
  ㅔ: "수",
  ㅕ: "수",
  ㅖ: "수",
  ㅜ: "수",
  ㅝ: "수",
  ㅞ: "수",
  ㅟ: "수",
  ㅠ: "수",
};

const NAME_ELEMENT_GUIDE = {
  목: {
    asset: "새로운 관계와 일을 시작하는 인상을 만듭니다.",
    risk: "방향을 빨리 정하려다 상대의 속도를 놓칠 수 있습니다.",
    action: "첫 제안은 작게 열고, 상대가 따라올 시간을 남겨두세요.",
  },
  화: {
    asset: "표현력과 존재감을 먼저 느끼게 합니다.",
    risk: "감정의 온도가 높아질수록 말이 앞설 수 있습니다.",
    action: "중요한 대화 전에는 핵심 문장 하나만 남기고 덜어내 보세요.",
  },
  토: {
    asset: "안정감과 책임감을 주는 이름 흐름입니다.",
    risk: "참고 버티는 쪽으로 기울면 부담이 늦게 터질 수 있습니다.",
    action: "맡을 일과 맡지 않을 일을 문장으로 나눠보세요.",
  },
  금: {
    asset: "기준, 정리, 판단이 분명한 인상을 줍니다.",
    risk: "정확함이 강해질수록 관계의 여지를 좁힐 수 있습니다.",
    action: "결론을 말하기 전에 상대가 받아들일 수 있는 순서를 먼저 잡아보세요.",
  },
  수: {
    asset: "관찰력과 유연함, 깊은 생각을 느끼게 합니다.",
    risk: "생각이 많아지면 표현과 실행이 늦어질 수 있습니다.",
    action: "완벽한 답을 기다리기보다 작은 확인을 먼저 해보세요.",
  },
};

function rankElements(counts) {
  return ELEMENTS.map((element) => ({
    element,
    count: counts[element] ?? 0,
    ...ELEMENT_META[element],
  })).sort((a, b) => b.count - a.count || ELEMENTS.indexOf(a.element) - ELEMENTS.indexOf(b.element));
}

function normalizeFreeText(value, maxLength = 80) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeName(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[^가-힣]/g, "")
    .slice(0, 8);
}

function decomposeHangulSyllable(char) {
  const code = char.charCodeAt(0);
  if (code < HANGUL_START || code > HANGUL_END) return null;

  const offset = code - HANGUL_START;
  const initialIndex = Math.floor(offset / 588);
  const medialIndex = Math.floor((offset % 588) / 28);
  const finalIndex = offset % 28;

  return {
    initial: HANGUL_INITIALS[initialIndex],
    medial: HANGUL_MEDIALS[medialIndex],
    final: HANGUL_FINALS[finalIndex],
  };
}

function getSoundElement(sound) {
  return SOUND_ELEMENT[sound] ?? SOUND_ELEMENT[[...sound][0]];
}

export function parseBirthDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) {
    throw new Error("생년월일을 정확히 입력해 주세요.");
  }

  const [, year, month, day] = match.map(Number);
  return { year, month, day };
}

export function calculateChart(input) {
  const date = parseBirthDate(input.birthDate);
  const hour = Number(input.hour);
  const minute = Number(input.minute);

  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new Error("태어난 시각은 0시부터 23시 사이로 입력해 주세요.");
  }
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    throw new Error("분은 0부터 59 사이의 정수로 입력해 주세요.");
  }

  const result = calculateFourPillars({
    ...date,
    hour,
    minute,
    isLunar: input.calendarType === "lunar",
    isLeapMonth: Boolean(input.isLeapMonth),
  });

  const pillars = PILLAR_LABELS.map(([key, label, meaning]) => {
    const pillar = result[key];
    return {
      key,
      label,
      meaning,
      stem: pillar.heavenlyStem,
      branch: pillar.earthlyBranch,
    };
  });

  return {
    source: result,
    pillars,
    elements: countElements(pillars),
  };
}

export function countElements(pillars) {
  const counts = Object.fromEntries(ELEMENTS.map((element) => [element, 0]));

  for (const pillar of pillars) {
    const stemElement = getHeavenlyStemElement(pillar.stem);
    const branchElement = getEarthlyBranchElement(pillar.branch);
    counts[stemElement] += 1;
    counts[branchElement] += 1;
  }

  return counts;
}

export function interpretElements(counts) {
  const ranked = rankElements(counts);

  const strongest = ranked[0];
  const weakest = [...ranked].sort(
    (a, b) => a.count - b.count || ELEMENTS.indexOf(a.element) - ELEMENTS.indexOf(b.element),
  )[0];

  return {
    strongest,
    weakest,
    title: `${strongest.label}의 기운이 가장 또렷해요`,
    copy:
      `${strongest.hint} 상징하는 ${strongest.label}의 흐름이 두드러집니다. ` +
      `${weakest.label}의 기운은 상대적으로 적으니, ${weakest.hint} 의식적으로 챙기며 균형을 만들어 보세요.`,
  };
}

function getReadingContext(chart) {
  const dayPillar = chart.pillars.find((pillar) => pillar.key === "day");
  const dayMeta = STEM_META[dayPillar.stem];
  const balance = interpretElements(chart.elements);
  const tenGodValues = Object.values(chart.source.tenGods ?? {})
    .flatMap((pillar) => [pillar.stem, pillar.branch])
    .filter((value) => value && value !== "일간");
  const tenGodCounts = tenGodValues.reduce((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
  const dominantTenGod =
    Object.entries(tenGodCounts).sort(([a, aCount], [b, bCount]) =>
      bCount - aCount || a.localeCompare(b, "ko"),
    )[0]?.[0] ?? "비견";

  return { balance, dayMeta, dayPillar, dominantTenGod, tenGodCounts };
}

export function analyzeName(rawName) {
  const cleanName = normalizeName(rawName);
  if (!cleanName) return null;

  const counts = Object.fromEntries(ELEMENTS.map((element) => [element, 0]));
  const syllables = [...cleanName].map((char) => {
    const parts = decomposeHangulSyllable(char);
    const sounds = [parts.initial, parts.medial, parts.final].filter(Boolean);
    const elements = sounds.map(getSoundElement).filter(Boolean);

    for (const element of elements) {
      counts[element] += 1;
    }

    return {
      char,
      sounds,
      elements,
    };
  });

  const ranked = rankElements(counts);
  const strongest = ranked[0];
  const weakest = [...ranked].sort(
    (a, b) => a.count - b.count || ELEMENTS.indexOf(a.element) - ELEMENTS.indexOf(b.element),
  )[0];
  const totalMarks = Object.values(counts).reduce((sum, value) => sum + value, 0);

  return {
    cleanName,
    syllableCount: cleanName.length,
    totalMarks,
    counts,
    strongest,
    weakest,
    syllables,
    evidence: syllables.map(
      (syllable) => `${syllable.char} ${syllable.sounds.join("")} → ${syllable.elements.join("·")}`,
    ),
  };
}

export function buildNameReading(chart, rawName) {
  const name = analyzeName(rawName);
  if (!name) return null;

  const { balance } = getReadingContext(chart);
  const guide = NAME_ELEMENT_GUIDE[name.strongest.element];
  const relationship =
    name.strongest.element === balance.weakest.element
      ? "사주에서 부족하게 보이는 기운을 이름의 소리 흐름이 보완하는 쪽으로 읽힙니다."
      : name.strongest.element === balance.strongest.element
        ? "사주에서 강한 기운을 이름에서도 한 번 더 강조하는 쪽으로 읽힙니다."
        : "사주의 중심 기운과 다른 결을 더해, 상황에 따라 보완 또는 긴장으로 나타날 수 있습니다.";

  return {
    eyebrow: "성명학 맛보기",
    title: `${name.cleanName} 이름은 ${name.strongest.label} 기운을 먼저 드러냅니다`,
    copy:
      "정확한 한자 획수 성명학이 아니라, 한글 이름의 소리와 자모 흐름을 오행 언어로 가볍게 번역한 보조 해석입니다. " +
      relationship,
    point: guide.action,
    elements: ELEMENTS.map((element) => ({
      element,
      label: ELEMENT_META[element].label,
      count: name.counts[element],
      percentage: name.totalMarks > 0 ? (name.counts[element] / name.totalMarks) * 100 : 0,
    })),
    checklist: [
      guide.asset,
      guide.risk,
      `${balance.weakest.label} 기운이 약한 사주 흐름과 함께 볼 때, 이름이 실제 행동에서 어떻게 쓰이는지 관찰해야 합니다.`,
    ],
    evidence: [
      `이름 ${name.cleanName}`,
      `음가 ${name.totalMarks}개`,
      `이름 강점 ${name.strongest.element} ${name.strongest.count}`,
      `사주 보완 ${balance.weakest.element} ${balance.weakest.count}`,
      ...name.evidence,
    ],
  };
}

export function buildPersonalizedBriefing(chart, input = {}) {
  const context = getReadingContext(chart);
  const topicMeta = TOPIC_META[input.topic] ?? TOPIC_META.relationship;
  const tone = TONE_META[input.tone] ?? TONE_META.balanced;
  const name = analyzeName(input.name);
  const concern = normalizeFreeText(input.concern);
  const subject = name ? `${name.cleanName}님` : "이 사주";
  const nameLine = name
    ? `이름에서는 ${name.strongest.label} 기운이 먼저 잡히므로, 사주의 ${context.balance.strongest.label} 흐름과 함께 실제 말투와 선택 방식으로 드러날 수 있습니다.`
    : "이름을 넣으면 한글 성명학 보조 해석까지 함께 연결할 수 있습니다.";
  const concernLine = concern
    ? `적어주신 고민은 "${concern}"입니다. 이 문장은 ${topicMeta.eyebrow} 관점에서 바로 결론을 내기보다, 반복되는 장면과 확인해야 할 조건으로 나눠 읽는 편이 좋습니다.`
    : "구체적인 고민을 한 줄로 적으면, 같은 사주라도 상담 질문과 행동 제안이 더 개인적으로 정리됩니다.";

  return {
    eyebrow: "개인 맞춤 상담 노트",
    title: `${subject}에게 필요한 ${topicMeta.eyebrow} 해석은 ${context.balance.strongest.label} 기운을 어떻게 쓰는지에 달려 있어요`,
    copy: `${tone.opening} ${concernLine} ${nameLine}`,
    notes: [
      {
        label: "핵심 흐름",
        text: `${context.dayPillar.stem}${context.dayPillar.branch} 일주는 ${context.dayMeta.strength}이 자연스럽게 살아나는 구조입니다.`,
      },
      {
        label: "주의 지점",
        text: `${context.balance.weakest.label} 기운이 약하게 보일 때는 ${context.balance.weakest.hint} 의식적으로 챙겨야 같은 문제가 반복되지 않습니다.`,
      },
      {
        label: "이번 주 행동",
        text: tone.action,
      },
    ],
    session: {
      opening: `${subject}, 지금은 ${topicMeta.eyebrow}의 답을 맞히기보다 왜 같은 감정이 반복되는지부터 함께 좁혀보면 좋겠습니다.`,
      avoid: tone.caution,
      questions: [
        topicMeta.questions[0],
        name
          ? `${name.cleanName}이라는 이름으로 불릴 때 가장 자주 맡게 되는 역할은 무엇인가요?`
          : "내 이름이나 별명으로 불릴 때 자주 기대받는 역할은 무엇인가요?",
        `${context.balance.strongest.label} 기운을 잘 쓰면서도 ${context.balance.weakest.label} 기운을 보완할 생활 습관은 무엇인가요?`,
      ],
    },
    evidence: [
      `주제 ${topicMeta.eyebrow}`,
      `일간 ${context.dayPillar.stem}`,
      `강한 오행 ${context.balance.strongest.element} ${context.balance.strongest.count}`,
      `보완 오행 ${context.balance.weakest.element} ${context.balance.weakest.count}`,
      `십신 ${context.dominantTenGod}`,
    ],
  };
}

export function buildDetailedReading(chart) {
  const { balance, dayMeta, dayPillar, dominantTenGod, tenGodCounts } = getReadingContext(chart);

  return [
    {
      number: "01",
      eyebrow: "나의 중심축",
      title: `${dayPillar.stem}${dayPillar.branch} 일주, ${dayMeta.symbol}`,
      copy: dayMeta.core,
      point: dayMeta.strength,
      evidence: [`일간 ${dayPillar.stem}`, `일지 ${dayPillar.branch}`],
    },
    {
      number: "02",
      eyebrow: "에너지 사용법",
      title: `${balance.strongest.label} 기운은 살리고 ${balance.weakest.label} 기운은 의식하기`,
      copy:
        `${balance.strongest.label}의 기운이 ${balance.strongest.count}개로 가장 많고, ` +
        `${balance.weakest.label}의 기운은 ${balance.weakest.count}개로 가장 적습니다. ` +
        `강한 기운은 자연스럽게 쓰되 약한 기운은 환경과 습관으로 보완한다는 관점이 유용합니다.`,
      point: `${balance.strongest.hint} 활용하고 ${balance.weakest.hint} 챙기는 선택`,
      evidence: [
        `${balance.strongest.element} ${balance.strongest.count}`,
        `${balance.weakest.element} ${balance.weakest.count}`,
      ],
    },
    {
      number: "03",
      eyebrow: "반복되는 행동 단서",
      title: `${dominantTenGod}, 익숙하게 꺼내 쓰는 방식`,
      copy:
        `${TEN_GOD_META[dominantTenGod] ?? "반복해서 나타나는 행동 흐름"}이 원국에서 상대적으로 자주 보입니다. ` +
        "좋고 나쁨보다 어떤 상황에서 이 방식이 도움이 되고, 언제 과해지는지 관찰해 보세요.",
      point: dayMeta.watch,
      evidence: [`십신 ${dominantTenGod}`, `등장 ${tenGodCounts[dominantTenGod] ?? 0}회`],
    },
    {
      number: "04",
      eyebrow: "나에게 던질 질문",
      title: dayMeta.question,
      copy:
        "사주를 정답표보다 자기 관찰을 시작하는 언어로 사용해 보세요. 최근의 실제 선택 하나를 떠올려 이 질문에 답하면 풀이가 훨씬 구체적으로 읽힙니다.",
      point: "이번 주에 확인할 수 있는 작은 행동 하나 정하기",
      evidence: [`${dayPillar.stem} 일간 관찰 질문`],
    },
  ];
}

export function buildTopicReading(chart, topic = "relationship") {
  const context = getReadingContext(chart);
  const meta = TOPIC_META[topic] ?? TOPIC_META.relationship;

  return {
    eyebrow: meta.eyebrow,
    title: meta.title(context),
    copy: meta.copy(context),
    point: meta.point,
    checklist: meta.checklist,
    questions: meta.questions,
    evidence: [
      `일간 ${context.dayPillar.stem}`,
      `${context.balance.strongest.element} ${context.balance.strongest.count}`,
      `십신 ${context.dominantTenGod}`,
    ],
  };
}

export function formatInputSummary(input) {
  const calendar = input.calendarType === "lunar" ? "음력" : "양력";
  const leap = input.calendarType === "lunar" && input.isLeapMonth ? " 윤달" : "";
  const hour = String(input.hour).padStart(2, "0");
  const minute = String(input.minute).padStart(2, "0");
  return `${calendar}${leap} ${input.birthDate.replaceAll("-", ".")} · ${hour}:${minute}`;
}
