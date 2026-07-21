import {
  calculateFourPillars,
  getEarthlyBranchElement,
  getHeavenlyStemElement,
  getTenGod,
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

export const CONSULTATION_PERSONAS = [
  {
    id: "miseon",
    name: "미선 이모",
    role: "마음을 받아주는 동네 이모",
    initial: "미",
    tone: "부드러운 존댓말과 생활 비유로 감정을 먼저 받아줍니다.",
    specialties: ["부부", "가족", "자녀", "관계 불안"],
    bestFor: "누군가에게 편안히 말하면서 마음을 정리하고 싶을 때",
    sample:
      "그동안 혼자 생각을 많이 하셨겠어요. 지금은 상대 마음보다, 내가 어디까지 기다릴 수 있는지가 더 힘든 것 같아요.",
  },
  {
    id: "junho",
    name: "준호 형",
    role: "따뜻하지만 현실적인 이웃",
    initial: "준",
    tone: "편한 존댓말로 상황을 요약하고 선택지를 좁혀줍니다.",
    specialties: ["연애", "재회", "이직", "자신감"],
    bestFor: "위로도 필요하지만 실제 행동 기준을 같이 잡고 싶을 때",
    sample:
      "지금 당장 결론을 내리지 않아도 괜찮아요. 다만 추측과 실제 행동으로 확인된 것은 나눠서 봐야 해요.",
  },
  {
    id: "seongu",
    name: "성우 선생",
    role: "경험 많은 인생 선배",
    initial: "성",
    tone: "간결하게 사실, 해석, 감정을 분리해 판단 기준을 세웁니다.",
    specialties: ["직장", "사업", "리더십", "결혼생활"],
    bestFor: "위로보다 구조적인 정리와 결정 기준이 필요할 때",
    sample:
      "현재 문제는 능력 부족이라기보다 역할과 책임이 불분명한 데서 시작된 것으로 보입니다.",
  },
];

export const CONSULTATION_MODES = [
  {
    id: "trial",
    name: "무료 체험",
    price: "0원",
    turns: "대화 3회",
    summary: "마음을 듣고, 조건을 좁히고, 다음 행동을 정리합니다.",
    features: ["공감과 핵심 확인", "현실 조건 구체화", "선택지와 다음 행동"],
  },
  {
    id: "basic",
    name: "기본 상담",
    price: "4,900~9,900원",
    turns: "대화 10회",
    summary: "대화 전체를 바탕으로 선택지와 짧은 요약을 제공합니다.",
    features: ["상담사 3명 선택", "대화 전체 맥락 반영", "상담 요약 제공"],
  },
  {
    id: "pro",
    name: "프로 상담",
    price: "14,900원부터",
    turns: "대화 20회 이상",
    summary: "고민 구조화, 상반 근거 검토, 행동 계획까지 깊게 정리합니다.",
    features: ["현재 상황과 장기 흐름 종합", "선택지별 장단점 비교", "상세 리포트와 7일 후속 상담"],
  },
];

const PERSONA_RECOMMENDATION = {
  relationship: ["junho", "miseon"],
  marriage: ["miseon", "seongu"],
  business: ["seongu", "junho"],
  career: ["seongu", "junho"],
  family: ["miseon", "seongu"],
  yearly: ["seongu", "miseon"],
};

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
    verdict: "밀당을 읽으려 하지 말고, 내가 반복하는 패턴을 먼저 잡으세요",
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
    verdict: "설렘 말고 생활 리듬을 맞춰보면 답이 보입니다",
    title: ({ dayPillar }) => `${dayPillar.stem}${dayPillar.branch} 일주는 생활의 리듬을 먼저 봐야 해요`,
    copy: ({ balance }) =>
      `결혼운의 핵심은 오래 같이 살 때 균형이 맞는지입니다. ` +
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
    verdict: "돈은 아이디어가 아니라 30일 검증에서 나옵니다",
    title: ({ dominantTenGod }) => `${dominantTenGod} 흐름으로 돈을 버는 방식을 점검해 보세요`,
    copy: ({ dayMeta, balance }) =>
      `사업운은 내가 어떤 방식으로 기회를 만들고 어디서 리스크를 키우는지 보여주는 지도입니다. ` +
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
    verdict: "직함보다 일하는 방식이 맞아야 오래갑니다",
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
    verdict: "예측하려 하지 말고 가족 안의 내 역할부터 정리하세요",
    title: ({ dayMeta }) => `가족 안에서는 ${dayMeta.strength}이 역할로 나타날 수 있어요`,
    copy: ({ balance }) =>
      `가족운은 가까운 사람을 돌볼 때 내가 어떤 방식으로 책임을 느끼는지 보는 자기 이해입니다. ` +
      `${balance.weakest.label} 기운처럼 부족한 부분을 생활에서 어떻게 보완할지가 핵심이며, 임신·출산 같은 결과 예측은 다루지 않습니다.`,
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
    verdict: "올해는 크게 걸지 말고 30일 단위로 확인하세요",
    title: ({ balance }) => `${balance.strongest.label} 기운은 살리고 ${balance.weakest.label} 기운은 보완하는 흐름`,
    copy: ({ dominantTenGod }) =>
      `시기운은 이번 흐름에서 어떤 태도를 쓰면 덜 흔들리는지 정리하는 도구입니다. ` +
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

const CONCERN_FOCUS_RULES = [
  {
    id: "decision",
    label: "결정 기준",
    pattern: /(해야|할까요|될까요|괜찮|맞을까요|확신|결정|선택|시작|이직|결혼|창업)/,
    lens: "지금은 운이 좋다 나쁘다보다 결정을 미루게 하는 조건과 감정적으로 이미 기울어진 쪽을 분리해야 합니다.",
    questions: (concern) => [
      `“${concern}”에서 오늘 당장 결정하지 못하게 붙잡는 조건은 무엇인가요?`,
      "이 선택을 했을 때 잃을 수 있는 것과 얻을 수 있는 것을 각각 하나씩 적는다면 무엇인가요?",
    ],
  },
  {
    id: "relationship-signal",
    label: "상대 신호 확인",
    pattern: /(상대|그 사람|연락|재회|마음|썸|애인|남자친구|여자친구|배우자|파트너)/,
    lens: "상대의 속마음을 단정하기보다 이미 보인 행동, 아직 확인하지 못한 말, 내가 반복해서 해석하는 장면을 나눠야 합니다.",
    questions: (concern) => [
      `“${concern}”에서 상대가 실제 행동으로 보여준 신호는 무엇인가요?`,
      "아직 직접 묻지 않았지만 혼자 결론 내리고 있는 부분은 무엇인가요?",
    ],
  },
  {
    id: "money-risk",
    label: "돈과 리스크",
    pattern: /(돈|수익|매출|투자|비용|대출|사업|창업|동업|계약|월급|연봉)/,
    lens: "돈이 걸린 고민은 기대감과 현금흐름을 분리해서 봐야 합니다. 먼저 작게 검증할 수 있는 단위가 있는지 확인하세요.",
    questions: (concern) => [
      `“${concern}”에서 가장 빨리 숫자로 확인할 수 있는 지표는 무엇인가요?`,
      "실패해도 감당 가능한 비용과 절대 넘기면 안 되는 비용은 각각 어디까지인가요?",
    ],
  },
  {
    id: "timing",
    label: "시기 조율",
    pattern: /(언제|시기|올해|이번 달|다음 달|내년|타이밍|흐름|기다려|지금)/,
    lens: "시기 질문은 한 번에 맞히기보다 30일 안에 확인할 신호를 정할수록 현실적인 답이 됩니다.",
    questions: (concern) => [
      `“${concern}”을 30일 안에 확인한다면 어떤 변화가 보여야 하나요?`,
      "지금 움직일 조건과 조금 더 기다릴 조건을 나눈다면 각각 무엇인가요?",
    ],
  },
];

function buildConcernFocus(meta, concern) {
  if (!concern) {
    return {
      label: "기본 상담 질문",
      lens: "",
      questions: meta.questions,
    };
  }

  const matchedRule = CONCERN_FOCUS_RULES.find((rule) => rule.pattern.test(concern));
  const fallback = {
    label: "고민 구조화",
    lens:
      "먼저 고민을 하나의 결론으로 밀어붙이지 말고, 반복되는 장면과 아직 확인하지 못한 조건으로 나누는 편이 좋습니다.",
    questions: () => [
      `“${concern}”에서 지금 가장 답답한 장면은 무엇인가요?`,
      "이 고민과 관련해 이미 확인된 사실은 무엇이고, 아직 추측인 부분은 무엇인가요?",
    ],
  };
  const rule = matchedRule ?? fallback;

  return {
    label: rule.label,
    lens: rule.lens,
    questions: [...rule.questions(concern), meta.questions[0]],
  };
}

const RELATIONSHIP_LABEL = {
  crush: "썸",
  lover: "연인",
  spouse: "부부",
  reunion: "재회",
  family: "가족",
  work: "직장",
};

const ELEMENT_RELATION = {
  same: {
    label: "비슷한 리듬",
    copy: "두 사람 모두 비슷한 방식으로 힘을 쓰기 쉬워 처음에는 편하지만, 같은 약점도 함께 커질 수 있습니다.",
    advice: "같은 결론을 내리기 전에 서로가 놓치는 부분을 하나씩 맡아보세요.",
  },
  generates: {
    label: "밀어주는 리듬",
    copy: "한쪽의 강한 기운이 다른 쪽의 흐름을 자연스럽게 도와주는 구조라, 역할이 잘 나뉘면 안정감이 생깁니다.",
    advice: "도와주는 사람이 계속 희생하지 않도록 책임의 경계를 말로 정하세요.",
  },
  generatedBy: {
    label: "받쳐주는 리듬",
    copy: "상대의 방식이 내 흐름을 보완해 주는 쪽으로 읽힙니다. 고마움이 익숙함으로 바뀌지 않게 관리가 필요합니다.",
    advice: "상대가 해주는 것을 당연하게 여기지 말고, 고마운 지점을 구체적으로 말하세요.",
  },
  controls: {
    label: "긴장과 조율",
    copy: "서로의 기준과 속도가 부딪히기 쉬운 구조입니다. 갈등 자체보다 갈등을 다루는 방식이 중요합니다.",
    advice: "결론부터 정하지 말고, 각자 절대 양보하기 어려운 기준을 먼저 꺼내세요.",
  },
  controlledBy: {
    label: "조심스러운 균형",
    copy: "상대의 방식이 내 선택을 압박처럼 느끼게 할 수 있습니다. 다만 규칙을 정하면 현실적인 균형도 만들 수 있습니다.",
    advice: "상대에게 맞추기 전에 내 속도와 한계를 먼저 알려주세요.",
  },
};

const ELEMENT_CONTROLS = { 목: "토", 화: "금", 토: "수", 금: "목", 수: "화" };

export const ELEMENT_PRESCRIPTION = {
  목: {
    color: "초록·청록",
    boost: [
      "새로 배우는 수업이나 모임처럼 '시작'의 기운이 있는 자리에 나가기",
      "아침 산책, 책상 위 작은 화분처럼 자라나는 것을 곁에 두는 습관",
    ],
    excess: "벌여 놓는 일이 늘어나는 흐름 — 새 일을 더하기 전에 진행 중인 하나를 먼저 매듭지어 보세요",
  },
  화: {
    color: "붉은 계열",
    boost: [
      "발표, 글쓰기, 대화처럼 속마음을 밖으로 표현하는 활동 늘리기",
      "해가 있는 시간대의 가벼운 운동으로 몸의 온도를 올리기",
    ],
    excess: "말과 속도가 앞서는 흐름 — 중요한 결정과 답장은 하루 묵혔다가 보내 보세요",
  },
  토: {
    color: "노랑·베이지",
    boost: [
      "같은 시간에 자고 일어나는 일정한 생활 리듬 지키기",
      "믿을 수 있는 사람과의 느긋한 식사 자리 만들기",
    ],
    excess: "혼자 떠안고 버티는 흐름 — 이번 주에는 맡은 일 하나를 나누거나 정중히 거절해 보세요",
  },
  금: {
    color: "흰색·은색",
    boost: [
      "미뤄둔 일에 마감 시간을 정해 끝내기, 서랍과 파일 정리하기",
      "쓰지 않는 물건을 하나씩 덜어내는 습관 들이기",
    ],
    excess: "기준이 날카로워지는 흐름 — 결론을 말하기 전에 상대의 사정을 한 번 물어보세요",
  },
  수: {
    color: "검정·남색",
    boost: [
      "하루 10분 기록이나 독서처럼 생각을 가라앉히는 시간 확보하기",
      "물가 산책과 충분한 잠으로 회복 시간을 먼저 챙기기",
    ],
    excess: "생각이 길어져 시작이 늦어지는 흐름 — 가장 작은 한 걸음부터 실행해 보세요",
  },
};

const YEAR_TEN_GOD_HINT = {
  비견: "내 페이스를 지키는 힘이 살아나는 해라, 남과 비교하기보다 자기 기준을 세우는 일이 잘 풀립니다",
  겁재: "경쟁과 지출이 함께 커지기 쉬운 해라, 돈이 얽힌 약속과 동업 조건은 문서로 남기는 편이 안전합니다",
  식신: "꾸준한 결과물이 쌓이기 좋은 해라, 작게라도 계속 만들어 내보내는 쪽이 유리합니다",
  상관: "새로운 표현과 변화 욕구가 커지는 해라, 일을 벌이기 전에 말로 생기는 오해부터 조심할 필요가 있습니다",
  편재: "기회와 사람이 넓게 들어오는 해라, 대신 돈의 들고남도 커지니 현금 흐름을 기록해 두는 편이 좋습니다",
  정재: "성실하게 관리한 만큼 돌아오는 해라, 계획된 저축과 약속 이행이 힘을 발휘합니다",
  편관: "책임과 압박이 커질 수 있는 해라, 일정에 회복 시간을 먼저 넣어두는 편이 좋습니다",
  정관: "역할과 신뢰가 또렷해지는 해라, 공식적인 자리나 승인이 필요한 일을 진행하기에 유리합니다",
  편인: "낯선 공부와 직관이 살아나는 해라, 시작만 많아지지 않게 하나를 정해 깊게 파는 편이 좋습니다",
  정인: "배움과 문서, 자격의 기운이 들어오는 해라, 미뤄둔 공부나 증명을 정리하기 좋습니다",
};

export function buildGuidance(chart, now = new Date()) {
  const { balance, dayMeta, dayPillar } = getReadingContext(chart);
  const yearPillar = calculateFourPillars({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    hour: 12,
    minute: 0,
    isLunar: false,
    isLeapMonth: false,
  }).year;

  const yearLabel = `${yearPillar.heavenlyStem}${yearPillar.earthlyBranch}년`;
  const yearStemElement = getHeavenlyStemElement(yearPillar.heavenlyStem);
  const yearBranchElement = getEarthlyBranchElement(yearPillar.earthlyBranch);
  const yearTenGod = getTenGod(dayPillar.stem, yearPillar.heavenlyStem);
  const yearElementMeta = ELEMENT_META[yearStemElement];

  const yearRelation =
    yearStemElement === balance.weakest.element || yearBranchElement === balance.weakest.element
      ? `사주에서 부족했던 ${balance.weakest.label} 기운이 채워지는 흐름이라, 미뤄왔던 일을 다시 꺼내기 좋은 때입니다.`
      : yearStemElement === balance.strongest.element || yearBranchElement === balance.strongest.element
        ? `원국에서 이미 강한 ${balance.strongest.label} 기운이 한층 더 강해지는 흐름이라, 잘 풀릴수록 과속을 조심해야 하는 해입니다.`
        : `평소와 다른 결의 ${yearElementMeta.label} 기운이 더해지는 흐름이라, 익숙한 방식이 통하지 않는 순간을 변화의 신호로 읽으면 좋습니다.`;

  const strongMeta = ELEMENT_PRESCRIPTION[balance.strongest.element];
  const weakMeta = ELEMENT_PRESCRIPTION[balance.weakest.element];

  const yearCaution =
    yearStemElement === balance.strongest.element || yearBranchElement === balance.strongest.element
      ? `올해는 강한 ${balance.strongest.label} 기운 위에 같은 기운이 겹치는 해입니다. 흐름이 좋게 느껴질수록 큰 지출과 계약은 한 템포 늦춰 보세요`
      : `올해 들어오는 ${yearElementMeta.label} 기운이 낯설게 느껴질 수 있습니다. 평소 방식이 통하지 않는 순간에는 밀어붙이기보다 방법을 바꿔 보세요`;

  return {
    eyebrow: "올해의 흐름과 처방",
    title: `${now.getFullYear()}년 ${yearLabel}, ${yearElementMeta.label}의 기운이 들어오는 해`,
    copy:
      `올해의 간지 ${yearLabel}은 ${yearElementMeta.label}의 흐름을 몰고 옵니다. ` +
      `${yearRelation} 일간 ${dayPillar.stem} 기준으로 올해는 ${yearTenGod}의 해로 읽히는데, ${YEAR_TEN_GOD_HINT[yearTenGod]}.`,
    embrace: [
      weakMeta.boost[0],
      weakMeta.boost[1],
      `${balance.weakest.label} 기운을 돕는 ${weakMeta.color} 색 소품을 자주 쓰는 자리에 두기`,
    ],
    avoid: [
      strongMeta.excess,
      `${dayMeta.watch} 스스로 점검해 보기`,
      yearCaution,
    ],
    evidence: [
      `세운 ${yearPillar.heavenlyStem}${yearPillar.earthlyBranch}`,
      `세운 오행 ${yearStemElement}·${yearBranchElement}`,
      `세운 십신 ${yearTenGod}`,
      `강한 오행 ${balance.strongest.element} ${balance.strongest.count}`,
      `보완 오행 ${balance.weakest.element} ${balance.weakest.count}`,
    ],
  };
}

function clampScore(value, min = 45, max = 92) {
  return Math.max(min, Math.min(max, value));
}

function sumScores(items) {
  return items.reduce((total, item) => total + item.score, 0);
}

function describeMomentum(score) {
  if (score >= 78) return "추진";
  if (score >= 68) return "확장";
  if (score >= 58) return "정비";
  return "점검";
}

function buildMonthQuestion(topic) {
  const prompts = {
    relationship: "관계의 속도를 맞추기 위해 먼저 확인할 약속은 무엇인지 적어보세요.",
    marriage: "생활 리듬과 책임 분담에서 미리 합의할 항목을 한 줄로 적어보세요.",
    business: "이번 달 안에 검증할 가장 작은 사업 실험 하나를 정해보세요.",
    career: "지금 역할에서 키워야 할 실무 근거 하나를 숫자로 남겨보세요.",
    family: "가족과의 대화에서 먼저 꺼낼 현실 주제 하나를 적어보세요.",
    yearly: "이번 달에만 집중할 목표 한 가지를 정하고 나머지는 줄여보세요.",
  };
  return prompts[topic] ?? prompts.yearly;
}

function buildYearlyTopicFrame(topic) {
  const frames = {
    relationship: {
      eyebrow: "연애·관계 흐름",
      monthStrong: "연락과 거리감을 너무 재기보다, 대화의 속도를 자연스럽게 맞춰보는 편이 좋습니다.",
      monthSteady: "상대의 반응을 해석하기보다 내가 반복하는 기대와 서운함을 정리해 보는 편이 좋습니다.",
      monthCareful: "감정이 앞설수록 단정하지 말고, 확인해야 할 약속과 말투를 먼저 붙잡아야 합니다.",
      halfStrong: "감정선이 살아나는 때라 대화의 물꼬를 트기 좋지만, 기대를 앞세우기보다 리듬을 맞추는 쪽이 더 중요합니다.",
      halfSteady: "속도를 늦추고 관계의 기준을 확인하면 이후 흐름이 더 분명해집니다.",
      noteLead: "관계 흐름은 좋은 달에 마음을 열고, 조심할 달에는 해석보다 확인을 우선하는 편이 좋습니다.",
    },
    marriage: {
      eyebrow: "결혼·장기 관계 흐름",
      monthStrong: "감정보다 생활 리듬과 책임 분담을 현실적으로 맞춰보면 답이 더 잘 보이는 달입니다.",
      monthSteady: "결론을 서두르기보다 돈, 가족, 생활 기준을 하나씩 확인하는 편이 좋습니다.",
      monthCareful: "마음만으로 밀기보다 장기적으로 함께 살 때 부담이 되는 부분을 먼저 점검해야 합니다.",
      halfStrong: "같이 사는 그림을 구체화하기 좋은 때입니다. 다만 설렘보다 생활 기준을 먼저 맞추는 편이 안정적입니다.",
      halfSteady: "생활 리듬과 책임 분담을 정리하면 이후 판단이 훨씬 선명해집니다.",
      noteLead: "결혼운은 타이밍보다 생활 기준을 맞추는 정도에 더 크게 좌우됩니다.",
    },
    business: {
      eyebrow: "사업·현금 흐름",
      monthStrong: "고객 반응과 매출 가능성을 작게라도 확인해 보면 다음 판단이 빨라질 수 있습니다.",
      monthSteady: "아이디어를 넓히기보다 최소 상품, 가격, 판매 경로를 정리하는 편이 좋습니다.",
      monthCareful: "의욕만으로 밀면 비용과 역할이 먼저 흔들릴 수 있어, 현금흐름과 리스크를 점검해야 합니다.",
      halfStrong: "작은 검증을 실제 매출이나 예약 반응으로 연결하기 좋은 구간입니다.",
      halfSteady: "혼자 할 일과 맡길 일을 나누고, 돈이 들어오는 구조를 먼저 다듬는 편이 낫습니다.",
      noteLead: "사업운은 좋은 달에 크게 벌리기보다, 검증이 통하는 달을 골라 반복하는 편이 더 강합니다.",
    },
    career: {
      eyebrow: "직업·이직 흐름",
      monthStrong: "성과를 말로만 설명하기보다 숫자와 결과물로 보여주기 좋은 달입니다.",
      monthSteady: "역할을 정리하고 실무 근거를 쌓으면 다음 기회가 더 또렷해질 수 있습니다.",
      monthCareful: "평가와 감정이 엉키기 쉬워, 이직 충동보다 현재 포지션의 근거를 먼저 챙기는 편이 좋습니다.",
      halfStrong: "실무 성과를 쌓거나 포지션을 한 단계 넓히기 좋은 구간입니다.",
      halfSteady: "역할 기대치와 평가 기준을 먼저 정리하면 이후 이동 판단이 쉬워집니다.",
      noteLead: "직업운은 시기보다 근거 축적 속도에 더 크게 반응합니다.",
    },
    family: {
      eyebrow: "가족·자녀 흐름",
      monthStrong: "가족 안에서 먼저 꺼내야 할 현실 주제를 부드럽게 정리하면 흐름이 훨씬 편안해집니다.",
      monthSteady: "감정을 누르기보다 역할과 기대치를 조용히 맞춰보는 편이 좋습니다.",
      monthCareful: "서운함을 오래 품으면 작은 일도 커질 수 있어, 대화 주제를 먼저 좁혀야 합니다.",
      halfStrong: "가족 안의 리듬을 새로 맞추기 좋은 시기입니다. 다만 모두를 한 번에 바꾸려 하지는 않는 편이 낫습니다.",
      halfSteady: "말하지 않은 기대와 책임을 정리하면 이후 갈등이 훨씬 줄어듭니다.",
      noteLead: "가족운은 큰 사건보다 반복되는 역할과 말투를 조정할 때 훨씬 빨리 좋아집니다.",
    },
    yearly: {
      eyebrow: "올해의 흐름",
      monthStrong: "힘이 실리는 달에는 계획을 실행으로 연결하고, 결과를 작게라도 남겨두는 편이 좋습니다.",
      monthSteady: "크게 흔들지 말고 기준과 순서를 다듬으면 다음 전개가 더 선명해집니다.",
      monthCareful: "속도보다 균형이 중요하니, 벌린 일을 줄이고 핵심 우선순위를 붙잡는 편이 낫습니다.",
      halfStrong: "흐름을 끌어올릴 기회가 보이지만, 한 번에 넓히기보다 성과가 나는 축을 확인하는 편이 좋습니다.",
      halfSteady: "불필요한 힘 분산을 줄이고 핵심 목표를 다시 세우면 이후 흐름이 안정됩니다.",
      noteLead: "올해 흐름은 좋은 달에 확장하고, 조심할 달에 정비하는 리듬을 만드는 편이 좋습니다.",
    },
  };
  return frames[topic] ?? frames.yearly;
}

function buildMonthNarrative(score, monthTenGod, strongestLabel, weakestLabel, topic = "yearly") {
  const frame = buildYearlyTopicFrame(topic);
  if (score >= 76) {
    return `${strongestLabel} 쪽 판단이 힘을 받는 달입니다. ${monthTenGod} 흐름이 열리면 결정을 오래 끌기보다 작게 실행해 보는 편이 좋습니다. ${frame.monthStrong}`;
  }
  if (score >= 66) {
    return `크게 밀어붙이기보다는 리듬을 맞추는 달입니다. ${monthTenGod} 흐름을 정리와 점검에 쓰면 다음 달 전개가 더 매끈해집니다. ${frame.monthSteady}`;
  }
  return `${weakestLabel} 쪽 균형이 흔들리기 쉬운 달입니다. 일정과 감정을 너무 넓게 벌리기보다 한두 가지 기준을 먼저 붙잡는 편이 안전합니다. ${frame.monthCareful}`;
}

function buildHalfYearFocus(label, strongestMonths, carefulMonths) {
  const strongestText = strongestMonths.map((item) => item.label).join(", ");
  const carefulText = carefulMonths.map((item) => item.label).join(", ");
  return `${label}에는 밀어도 되는 달(${strongestText})과 속도를 낮춰야 하는 달(${carefulText})의 차이가 뚜렷합니다.`;
}

export function buildYearlyOverview(chart, topic = "yearly", now = new Date()) {
  const { balance, dayPillar } = getReadingContext(chart);
  const topicMeta = TOPIC_META[topic] ?? TOPIC_META.yearly;
  const topicFrame = buildYearlyTopicFrame(topic);
  const currentYear = now.getFullYear();
  const monthScores = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const monthPillar = calculateFourPillars({
      year: currentYear,
      month,
      day: 15,
      hour: 12,
      minute: 0,
      isLunar: false,
      isLeapMonth: false,
    }).month;
    const stemElement = getHeavenlyStemElement(monthPillar.heavenlyStem);
    const branchElement = getEarthlyBranchElement(monthPillar.earthlyBranch);
    const monthTenGod = getTenGod(dayPillar.stem, monthPillar.heavenlyStem);
    let score = 62;
    if (stemElement === balance.strongest.element) score += 10;
    if (branchElement === balance.strongest.element) score += 6;
    if (stemElement === balance.weakest.element) score -= 8;
    if (branchElement === balance.weakest.element) score -= 5;
    if (["비견", "겁재", "식신", "정인"].includes(monthTenGod)) score += 4;
    if (["편인", "정재", "편재"].includes(monthTenGod)) score += 1;
    if (["정관", "편관"].includes(monthTenGod)) score -= 3;

    const finalScore = clampScore(score);
    return {
      month,
      label: `${month}월`,
      score: finalScore,
      focus: describeMomentum(finalScore),
      evidence: `${monthPillar.heavenlyStem}${monthPillar.earthlyBranch} · ${monthTenGod}`,
      copy: buildMonthNarrative(finalScore, monthTenGod, balance.strongest.label, balance.weakest.label, topic),
    };
  });

  const firstHalfAverage = Math.round(sumScores(monthScores.slice(0, 6)) / 6);
  const secondHalfAverage = Math.round(sumScores(monthScores.slice(6)) / 6);
  const currentMonthEntry = monthScores[Math.max(0, Math.min(now.getMonth(), 11))];
  const sortedMonths = [...monthScores].sort((a, b) => b.score - a.score);
  const strongestMonths = sortedMonths.slice(0, 3);
  const carefulMonths = [...monthScores].sort((a, b) => a.score - b.score).slice(0, 2);
  const firstHalfStrongMonths = [...monthScores.slice(0, 6)].sort((a, b) => b.score - a.score).slice(0, 2);
  const firstHalfCarefulMonths = [...monthScores.slice(0, 6)].sort((a, b) => a.score - b.score).slice(0, 1);
  const secondHalfStrongMonths = [...monthScores.slice(6)].sort((a, b) => b.score - a.score).slice(0, 2);
  const secondHalfCarefulMonths = [...monthScores.slice(6)].sort((a, b) => a.score - b.score).slice(0, 1);
  const halfComparison =
    firstHalfAverage >= secondHalfAverage
      ? "상반기에 먼저 방향을 잡고, 하반기에는 그 흐름을 다듬는 쪽이 더 잘 맞습니다."
      : "상반기는 준비에 가깝고, 하반기로 갈수록 실제 성과를 붙잡기 쉬운 흐름입니다.";

  return {
    eyebrow: `${currentYear}년 ${topicFrame.eyebrow}`,
    title: `${topicMeta.eyebrow}에서는 ${balance.strongest.label} 기운을 살리고 ${balance.weakest.label} 균형을 보완하는 해`,
    summary:
      `${topicMeta.verdict} 올해는 ${balance.strongest.label} 쪽 감각을 살릴수록 기회를 만들기 좋고, ${balance.weakest.label} 쪽 균형을 놓치지 않아야 흐름이 길게 이어집니다. ` +
      halfComparison,
    currentMonth: {
      label: `${currentMonthEntry.label} 집중 포인트`,
      score: currentMonthEntry.score,
      focus:
        currentMonthEntry.score >= 72
          ? topicFrame.monthStrong
          : currentMonthEntry.score >= 60
            ? topicFrame.monthSteady
            : topicFrame.monthCareful,
      action: buildMonthQuestion(topic),
    },
    halfYear: [
      {
        label: "상반기",
        score: firstHalfAverage,
        copy:
          firstHalfAverage >= 70
            ? topicFrame.halfStrong
            : topicFrame.halfSteady,
        focus: buildHalfYearFocus("상반기", firstHalfStrongMonths, firstHalfCarefulMonths),
      },
      {
        label: "하반기",
        score: secondHalfAverage,
        copy:
          secondHalfAverage >= 70
            ? `${topicFrame.halfStrong} 상반기보다 결과를 회수하는 감각이 더 중요해집니다.`
            : `${topicFrame.halfSteady} 무리하게 벌리기보다 흐름을 지키는 편이 낫습니다.`,
        focus: buildHalfYearFocus("하반기", secondHalfStrongMonths, secondHalfCarefulMonths),
      },
    ],
    monthScores,
    strongestMonths,
    carefulMonths,
    note: `${topicFrame.noteLead} 특히 ${strongestMonths.map((item) => item.label).join(", ")}에는 기회를 넓혀 볼 만하고, ${carefulMonths.map((item) => item.label).join(", ")}에는 속도를 낮추고 기준을 다시 세우는 편이 좋습니다.`,
    evidence: [
      `강한 오행 ${balance.strongest.element} ${balance.strongest.count}개`,
      `약한 오행 ${balance.weakest.element} ${balance.weakest.count}개`,
      `이번 달 근거 ${currentMonthEntry.evidence}`,
    ],
  };
}

const TAROT_ARCHETYPES = [
  {
    name: "바보",
    keyword: "새 출발",
    message: "지금은 겁보다 호기심이 더 중요한 시점입니다. 다만 바로 뛰기 전에 안전망을 하나 남겨두세요.",
    action: "오늘 안에 가볍게 시작할 수 있는 가장 작은 실험 하나를 적어보세요.",
  },
  {
    name: "마법사",
    keyword: "도구 활용",
    message: "이미 가진 자원과 기술을 다시 묶으면 답이 보입니다. 부족함보다 활용법을 먼저 점검해보세요.",
    action: "지금 가진 사람, 돈, 시간 중 바로 쓸 수 있는 자원 세 가지를 적어보세요.",
  },
  {
    name: "여사제",
    keyword: "관찰",
    message: "서두르기보다 숨은 신호를 읽는 편이 낫습니다. 지금은 판단보다 확인이 먼저입니다.",
    action: "결정 전에 꼭 확인해야 할 정보 한 가지를 오늘 안에 찾아보세요.",
  },
  {
    name: "황후",
    keyword: "돌봄과 확장",
    message: "좋은 흐름은 이미 있지만 한 번에 크게 키우기보다 잘 자라게 돌보는 방식이 맞습니다.",
    action: "지금 키우고 싶은 관계나 일 하나에 필요한 돌봄을 한 줄로 써보세요.",
  },
  {
    name: "황제",
    keyword: "구조화",
    message: "감각만으로 움직이면 흔들릴 수 있습니다. 기준과 순서를 세우면 훨씬 안정됩니다.",
    action: "오늘 할 일의 우선순위를 세 칸으로 나눠 적어보세요.",
  },
  {
    name: "연인",
    keyword: "선택과 합의",
    message: "마음만큼 중요한 것은 기준을 나누는 일입니다. 누구와 어떻게 맞출지부터 정해야 합니다.",
    action: "선택해야 할 두 가지 안의 장단점을 각각 하나씩 적어보세요.",
  },
  {
    name: "전차",
    keyword: "추진력",
    message: "밀어붙일 힘은 있습니다. 다만 방향이 흔들리면 힘이 분산되니 목표를 줄여야 합니다.",
    action: "이번 주에 꼭 끝낼 한 가지를 정하고 나머지는 뒤로 미루세요.",
  },
  {
    name: "은둔자",
    keyword: "정리와 성찰",
    message: "답을 찾는 속도를 늦추면 오히려 더 정확해집니다. 혼자 정리할 시간이 필요합니다.",
    action: "핵심 고민을 세 문장으로만 요약해보세요.",
  },
  {
    name: "별",
    keyword: "회복과 기대",
    message: "당장 큰 변화보다 흐름을 믿고 다시 정돈하는 쪽이 좋습니다. 회복이 먼저입니다.",
    action: "다시 시작하기 위해 내려놓을 부담 하나를 정해보세요.",
  },
  {
    name: "세계",
    keyword: "마무리와 다음 단계",
    message: "하나를 마무리해야 다음 기회가 선명해집니다. 끝맺음을 미루지 않는 편이 좋습니다.",
    action: "이번 달 안에 매듭지을 일 하나를 정하고 완료 기준을 적어보세요.",
  },
];

function buildTarotTopicFrame(topic) {
  const frames = {
    relationship: {
      summary: "상대의 마음을 맞히기보다, 지금 관계에서 내가 어떤 속도와 기대를 반복하는지 비춰보세요.",
      leadLabel: "지금 마음",
      supportLabel: "도움이 되는 흐름",
      guardLabel: "먼저 점검할 지점",
      supportCopy: "감정의 결론보다 대화의 속도와 표현 방식을 정리하는 편이 더 도움이 됩니다.",
      guardCopy: "서운함을 단정으로 바꾸지 말고, 실제로 확인할 수 있는 신호를 먼저 구분해야 합니다.",
      followUps: [
        "내가 가장 자주 서운해지는 장면은 무엇인가요?",
        "상대에게 확인하지 않고 혼자 해석한 부분은 무엇인가요?",
        "지금 필요한 것은 결론인가요, 대화의 기준인가요?",
      ],
      closing: "관계 질문은 빠른 답보다 오해를 줄이는 질문을 먼저 세울 때 훨씬 정확해집니다.",
    },
    marriage: {
      summary: "결혼 질문은 설렘보다 생활 기준을 비춰보는 쪽이 더 현실적인 답에 가깝습니다.",
      leadLabel: "지금 마음",
      supportLabel: "같이 맞춰볼 기준",
      guardLabel: "먼저 점검할 지점",
      supportCopy: "생활 리듬, 돈, 가족 문제처럼 오래 함께 가야 하는 기준을 먼저 확인하는 편이 좋습니다.",
      guardCopy: "감정 확신만으로 밀기보다 장기적으로 부담이 되는 생활 조건을 먼저 점검해야 합니다.",
      followUps: [
        "함께 살 때 가장 걱정되는 현실 조건은 무엇인가요?",
        "아직 말하지 못한 생활 기준은 무엇인가요?",
        "내가 절대 양보하기 어려운 부분은 무엇인가요?",
      ],
      closing: "결혼운은 타이밍보다 같이 버틸 생활 기준이 맞는지에서 더 크게 갈립니다.",
    },
    business: {
      summary: "사업 질문은 운보다 검증이 먼저입니다. 카드도 결국 고객, 돈, 실행 순서를 다시 보라고 말합니다.",
      leadLabel: "지금 마음",
      supportLabel: "작게 검증할 흐름",
      guardLabel: "먼저 점검할 지점",
      supportCopy: "작은 테스트, 고객 반응, 돈이 들어오는 구조를 확인할수록 다음 선택이 선명해집니다.",
      guardCopy: "의욕만으로 밀면 비용과 역할이 먼저 흔들릴 수 있어, 현금흐름과 리스크를 먼저 봐야 합니다.",
      followUps: [
        "30일 안에 시험할 최소 상품은 무엇인가요?",
        "돈이 들어오는 구조를 오늘 한 문장으로 설명할 수 있나요?",
        "혼자 할 일과 맡길 일을 지금 구분할 수 있나요?",
      ],
      closing: "사업운은 좋은 타이밍을 맞히는 것보다, 검증이 통하는 리듬을 반복하는 쪽이 훨씬 강합니다.",
    },
    career: {
      summary: "직업 질문은 감정적 결단보다, 지금 내 역할과 실무 근거를 다시 읽어보는 쪽이 더 유리합니다.",
      leadLabel: "지금 마음",
      supportLabel: "실무 근거를 쌓는 흐름",
      guardLabel: "먼저 점검할 지점",
      supportCopy: "성과를 숫자와 결과물로 남기는 흐름이 다음 기회와 이동 판단을 더 또렷하게 만듭니다.",
      guardCopy: "이직 충동이 커질수록 현재 역할의 근거와 평가 기준을 먼저 분리해 보는 편이 좋습니다.",
      followUps: [
        "지금 역할에서 증명할 수 있는 성과 한 가지는 무엇인가요?",
        "이직하고 싶은 이유가 피로인지 방향인지 구분되나요?",
        "다음 자리에서 꼭 필요한 조건 세 가지는 무엇인가요?",
      ],
      closing: "직업운은 큰 결심보다 작은 성과 근거를 쌓을 때 훨씬 빠르게 방향이 열립니다.",
    },
    family: {
      summary: "가족 질문은 누가 옳은지보다, 반복되는 역할과 기대를 어떻게 조정할지 비춰보는 쪽이 더 낫습니다.",
      leadLabel: "지금 마음",
      supportLabel: "부드럽게 풀 수 있는 흐름",
      guardLabel: "먼저 점검할 지점",
      supportCopy: "대화 주제를 먼저 좁히고 기대치를 천천히 맞추면 가족 안의 긴장이 줄어들 수 있습니다.",
      guardCopy: "오래 참고만 있으면 작은 말도 크게 번질 수 있어, 먼저 꺼낼 현실 주제를 정하는 편이 좋습니다.",
      followUps: [
        "가족과의 대화에서 가장 자주 막히는 주제는 무엇인가요?",
        "지금 바로 바꾸고 싶은 역할은 무엇인가요?",
        "이번 주에 한 번만 꺼내도 되는 현실 대화는 무엇인가요?",
      ],
      closing: "가족운은 큰 사건보다 반복되는 말투와 역할을 조정할 때 가장 빨리 풀립니다.",
    },
    yearly: {
      summary: "지금 흐름을 한 번에 결론내리기보다, 오늘 필요한 질문과 다음 행동을 같이 정리해보세요.",
      leadLabel: "지금 마음",
      supportLabel: "도움이 되는 흐름",
      guardLabel: "먼저 점검할 지점",
      supportCopy: "흐름이 좋을 때는 실행을 남기고, 애매할 때는 기준과 순서를 다시 세우는 편이 더 좋습니다.",
      guardCopy: "크게 흔들릴수록 새로운 답을 찾기보다 이미 벌린 일을 정리하는 쪽이 더 중요합니다.",
      followUps: [
        "지금 가장 먼저 정리해야 할 고민 한 줄은 무엇인가요?",
        "이번 주 안에 확인할 현실 조건은 무엇인가요?",
        "다음 행동으로 바로 옮길 수 있는 가장 작은 일은 무엇인가요?",
      ],
      closing: "타로는 답을 대신 정해주기보다, 지금 무엇부터 질문해야 하는지 순서를 잡아주는 도구로 쓰는 편이 좋습니다.",
    },
  };
  return frames[topic] ?? frames.yearly;
}

export function buildTarotOverview(chart, topic = "yearly", concern = "", now = new Date()) {
  const concernText = String(concern ?? "").trim();
  const topicFrame = buildTarotTopicFrame(topic);
  const seedBase =
    chart.pillars.map(({ stem, branch }) => `${stem}${branch}`).join("") +
    `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${topic}-${concernText}`;
  const seed = [...seedBase].reduce((total, character) => total + character.charCodeAt(0), 0);
  const leadCard = TAROT_ARCHETYPES[seed % TAROT_ARCHETYPES.length];
  const supportCard = TAROT_ARCHETYPES[(seed + 3) % TAROT_ARCHETYPES.length];
  const guardCard = TAROT_ARCHETYPES[(seed + 6) % TAROT_ARCHETYPES.length];
  const questionLabel = concernText || TOPIC_META[topic]?.eyebrow || "지금 고민";

  return {
    eyebrow: "타로·질문 카드",
    title: `${questionLabel}에 비춘 오늘의 한 장`,
    summary: topicFrame.summary,
    lead: leadCard,
    support: supportCard,
    spread: [
      {
        label: topicFrame.leadLabel,
        card: leadCard,
        copy: leadCard.message,
        action: leadCard.action,
      },
      {
        label: topicFrame.supportLabel,
        card: supportCard,
        copy: topicFrame.supportCopy,
        action: supportCard.action,
      },
      {
        label: topicFrame.guardLabel,
        card: guardCard,
        copy: topicFrame.guardCopy,
        action: guardCard.action,
      },
    ],
    choice: {
      prompt: concernText
        ? `"${concernText}"에 바로 답하기보다, 어떤 조건이 갖춰져야 움직일 수 있는지 먼저 따져보세요.`
        : "지금의 선택은 정답 찾기보다 조건 정리에서 시작하는 편이 더 정확합니다.",
      aLabel: "지금 바로 밀기",
      aCopy: `${guardCard.keyword} 관점에서는 속도보다 리스크 점검이 먼저입니다.`,
      bLabel: "작게 시험하기",
      bCopy: `${supportCard.keyword} 관점에서는 작은 검증을 거친 뒤 확대하는 편이 안정적입니다.`,
    },
    reflection: [
      `${leadCard.name} 카드가 말하는 지금 내 마음의 핵심은 무엇인지 적어보세요.`,
      "내가 두려워하는 실패가 실제 손실인지, 막연한 불안인지 나눠보세요.",
      "오늘 바로 확인할 수 있는 현실 조건 한 가지를 정해보세요.",
    ],
    followUps: topicFrame.followUps,
    closing: topicFrame.closing,
  };
}

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

export function getReadingContext(chart) {
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
  const concernFocus = buildConcernFocus(topicMeta, concern);
  const subject = name ? `${name.cleanName}님` : "이 사주";
  const nameLine = name
    ? `이름에서는 ${name.strongest.label} 기운이 먼저 잡히므로, 사주의 ${context.balance.strongest.label} 흐름과 함께 실제 말투와 선택 방식으로 드러날 수 있습니다.`
    : "이름을 넣으면 한글 성명학 보조 해석까지 함께 연결할 수 있습니다.";
  const concernLine = concern
    ? `적어주신 고민은 "${concern}"입니다. 이 문장은 ${topicMeta.eyebrow} 관점에서 ${concernFocus.label}에 가까우니, ${concernFocus.lens}`
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
      questions: concern
        ? [
            concernFocus.questions[0],
            concernFocus.questions[1],
            name
              ? `${name.cleanName}이라는 이름으로 불릴 때 이 고민에서 자주 맡게 되는 역할은 무엇인가요?`
              : `${context.balance.strongest.label} 기운을 잘 쓰면서도 ${context.balance.weakest.label} 기운을 보완할 생활 습관은 무엇인가요?`,
          ]
        : [
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

export function buildTopicReading(chart, topic = "relationship", concern = "") {
  const context = getReadingContext(chart);
  const meta = TOPIC_META[topic] ?? TOPIC_META.relationship;
  const normalizedConcern = normalizeFreeText(concern);
  const concernFocus = buildConcernFocus(meta, normalizedConcern);
  const concernTitle = normalizedConcern ? `“${normalizedConcern}” 질문부터 풀어볼게요` : meta.title(context);
  const concernCopy = normalizedConcern
    ? `${meta.copy(context)} 지금 적어주신 질문은 ${concernFocus.label}에 가까우므로, ${concernFocus.lens}`
    : meta.copy(context);

  return {
    eyebrow: meta.eyebrow,
    verdict: meta.verdict,
    title: concernTitle,
    copy: concernCopy,
    point: meta.point,
    checklist: meta.checklist,
    questions: concernFocus.questions,
    evidence: [
      `일간 ${context.dayPillar.stem}`,
      `${context.balance.strongest.element} ${context.balance.strongest.count}`,
      `십신 ${context.dominantTenGod}`,
    ],
  };
}

function relationBetweenElements(a, b) {
  if (a === b) return "same";
  if (ELEMENT_CONTROLS[a] === b) return "controls";
  if (ELEMENT_CONTROLS[b] === a) return "controlledBy";
  const generates = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
  if (generates[a] === b) return "generates";
  if (generates[b] === a) return "generatedBy";
  return "same";
}

function scoreCompatibility(primary, partner, relationKey) {
  const primaryContext = getReadingContext(primary);
  const partnerContext = getReadingContext(partner);
  const primaryElement = primaryContext.balance.strongest.element;
  const partnerElement = partnerContext.balance.strongest.element;
  const elementRelation = relationBetweenElements(primaryElement, partnerElement);
  const dayStemMatch = primaryContext.dayPillar.stem === partnerContext.dayPillar.stem ? 6 : 0;
  const dayBranchMatch = primaryContext.dayPillar.branch === partnerContext.dayPillar.branch ? 4 : 0;
  // 관계 점수는 두 사람의 입력 순서를 바꿔도 같아야 한다. 방향성은 설명에서만 다룬다.
  const relationBoost = { same: 8, generates: 11, generatedBy: 11, controls: -5, controlledBy: -5 }[elementRelation];
  const topicBoost = relationKey === "spouse" || relationKey === "lover" ? 4 : relationKey === "reunion" ? -2 : 0;
  return Math.max(42, Math.min(94, 68 + relationBoost + dayStemMatch + dayBranchMatch + topicBoost));
}

export function buildCompatibilityReading(primaryChart, partnerChart, relationKey = "lover") {
  const primary = getReadingContext(primaryChart);
  const partner = getReadingContext(partnerChart);
  const primaryElement = primary.balance.strongest.element;
  const partnerElement = partner.balance.strongest.element;
  const relationType = relationBetweenElements(primaryElement, partnerElement);
  const relationMeta = ELEMENT_RELATION[relationType];
  const relationshipLabel = RELATIONSHIP_LABEL[relationKey] ?? RELATIONSHIP_LABEL.lover;
  const score = scoreCompatibility(primaryChart, partnerChart, relationKey);

  const verdict =
    score >= 82
      ? "끌림과 조율 포인트가 함께 살아나는 관계입니다"
      : score >= 68
        ? "잘 맞는 지점은 분명하지만 대화 규칙이 필요합니다"
        : "감정보다 속도와 기대치를 먼저 맞춰야 합니다";

  return {
    relationshipLabel,
    score,
    verdict,
    title: `${relationshipLabel} 관계에서 ${relationMeta.label}이 먼저 보입니다`,
    copy:
      `${primary.dayPillar.stem}${primary.dayPillar.branch} 일주와 ${partner.dayPillar.stem}${partner.dayPillar.branch} 일주를 함께 보면, ` +
      `${primary.balance.strongest.label} 기운과 ${partner.balance.strongest.label} 기운의 만남으로 읽힙니다. ${relationMeta.copy}`,
    strengths: [
      `${primary.balance.strongest.label} 기운의 추진 방식과 ${partner.balance.strongest.label} 기운의 반응이 서로를 자극합니다.`,
      `${primary.dominantTenGod} 흐름과 ${partner.dominantTenGod} 흐름이 만나 관계 안의 역할이 비교적 선명해집니다.`,
      "서로의 다름을 성격 문제로 단정하지 않고 생활 리듬으로 보면 조율 여지가 생깁니다.",
    ],
    frictions: [
      `${primary.dayMeta.watch}`,
      `${partner.dayMeta.watch}`,
      relationMeta.advice,
    ],
    talkGuide: [
      "연락과 만남의 속도를 어느 정도로 느끼는지 먼저 이야기하기",
      "돈, 가족, 일상 루틴처럼 감정 밖의 현실 조건을 확인하기",
      "갈등이 생겼을 때 회피하는지, 바로 풀려 하는지 대화 방식 정하기",
    ],
    consultQuestion: `${relationshipLabel} 관계에서 가장 자주 반복되는 서운함을 사주 흐름과 함께 정리해 볼까요?`,
    evidence: [
      `내 일주 ${primary.dayPillar.stem}${primary.dayPillar.branch}`,
      `상대 일주 ${partner.dayPillar.stem}${partner.dayPillar.branch}`,
      `내 강한 오행 ${primaryElement}`,
      `상대 강한 오행 ${partnerElement}`,
      `관계 리듬 ${relationMeta.label}`,
    ],
  };
}

export function buildCompatibilityReadingSymmetric(primaryChart, partnerChart, relationKey = "lover") {
  const primary = getReadingContext(primaryChart);
  const partner = getReadingContext(partnerChart);
  const pair = [
    {
      pillar: `${primary.dayPillar.stem}${primary.dayPillar.branch}`,
      element: primary.balance.strongest.element,
      elementLabel: primary.balance.strongest.label,
      tenGod: primary.dominantTenGod,
      watch: primary.dayMeta.watch,
    },
    {
      pillar: `${partner.dayPillar.stem}${partner.dayPillar.branch}`,
      element: partner.balance.strongest.element,
      elementLabel: partner.balance.strongest.label,
      tenGod: partner.dominantTenGod,
      watch: partner.dayMeta.watch,
    },
  ].sort((a, b) => a.pillar.localeCompare(b.pillar, "ko-KR"));

  const relationType = relationBetweenElements(pair[0].element, pair[1].element);
  const relationMeta = ELEMENT_RELATION[relationType];
  const relationshipLabel = RELATIONSHIP_LABEL[relationKey] ?? RELATIONSHIP_LABEL.lover;
  const score = scoreCompatibility(primaryChart, partnerChart, relationKey);
  const pairPillars = pair.map((item) => item.pillar).join(" · ");
  const pairElements = pair.map((item) => item.elementLabel).join("과 ");
  const pairTenGods = pair.map((item) => item.tenGod).join(" · ");
  const uniqueWatchPoints = [...new Set(pair.map((item) => item.watch))];

  const verdict =
    score >= 82
      ? "끌림과 조율 포인트가 함께 살아나는 관계입니다"
      : score >= 68
        ? "잘 맞는 지점은 분명하지만 대화 규칙이 필요합니다"
        : "감정보다 속도와 기대치를 먼저 맞춰야 합니다";

  return {
    relationshipLabel,
    score,
    verdict,
    title: `${relationshipLabel} 관계에서는 ${relationMeta.label}이 먼저 보입니다`,
    copy:
      `${pairPillars} 일주를 함께 보면, ${pairElements} 기운의 만남으로 읽힙니다. ` +
      `${relationMeta.copy}`,
    strengths: [
      `${pairElements} 기운이 서로의 장면을 다르게 보게 하면서도 시야를 넓혀줍니다.`,
      `${pairTenGods} 흐름이 만나 관계 안의 역할과 기대를 비교적 선명하게 보여줍니다.`,
      "서로의 다름을 성격 문제로 단정하지 않고 생활 리듬으로 보면 조율 여지가 생깁니다.",
    ],
    frictions: [...uniqueWatchPoints, relationMeta.advice].slice(0, 3),
    talkGuide: [
      "연락과 만남의 속도를 어느 정도로 느끼는지 먼저 이야기하기",
      "돈, 가족, 일상 루틴처럼 감정 밖의 현실 조건을 확인하기",
      "갈등이 생겼을 때 회피하는지, 바로 풀려 하는지 대화 방식 정하기",
    ],
    consultQuestion: `${relationshipLabel} 관계에서 가장 자주 반복되는 서운함을 사주 흐름과 함께 정리해 볼까요?`,
    evidence: [
      `두 일주 ${pairPillars}`,
      `두 강한 오행 ${pair.map((item) => item.element).join(" · ")}`,
      `관계 리듬 ${relationMeta.label}`,
    ],
  };
}

export function recommendConsultationPersonas(topic = "relationship") {
  const ids = PERSONA_RECOMMENDATION[topic] ?? PERSONA_RECOMMENDATION.relationship;
  return ids
    .map((id) => CONSULTATION_PERSONAS.find((persona) => persona.id === id))
    .filter(Boolean);
}

export function formatInputSummary(input) {
  const calendar = input.calendarType === "lunar" ? "음력" : "양력";
  const leap = input.calendarType === "lunar" && input.isLeapMonth ? " 윤달" : "";
  const hour = String(input.hour).padStart(2, "0");
  const minute = String(input.minute).padStart(2, "0");
  return `${calendar}${leap} ${input.birthDate.replaceAll("-", ".")} · ${hour}:${minute}`;
}
