import {
  calculateFourPillars,
  getEarthlyBranchElement,
  getHeavenlyStemElement,
} from "manseryeok";

export const ELEMENTS = ["목", "화", "토", "금", "수"];

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
  const ranked = ELEMENTS.map((element) => ({
    element,
    count: counts[element] ?? 0,
    ...ELEMENT_META[element],
  })).sort((a, b) => b.count - a.count || ELEMENTS.indexOf(a.element) - ELEMENTS.indexOf(b.element));

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

export function buildDetailedReading(chart) {
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

export function formatInputSummary(input) {
  const calendar = input.calendarType === "lunar" ? "음력" : "양력";
  const leap = input.calendarType === "lunar" && input.isLeapMonth ? " 윤달" : "";
  const hour = String(input.hour).padStart(2, "0");
  const minute = String(input.minute).padStart(2, "0");
  return `${calendar}${leap} ${input.birthDate.replaceAll("-", ".")} · ${hour}:${minute}`;
}
