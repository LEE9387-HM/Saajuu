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
  const result = calculateFourPillars({
    ...date,
    hour: Number(input.hour),
    minute: Number(input.minute),
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

export function formatInputSummary(input) {
  const calendar = input.calendarType === "lunar" ? "음력" : "양력";
  const leap = input.calendarType === "lunar" && input.isLeapMonth ? " 윤달" : "";
  const hour = String(input.hour).padStart(2, "0");
  const minute = String(input.minute).padStart(2, "0");
  return `${calendar}${leap} ${input.birthDate.replaceAll("-", ".")} · ${hour}:${minute}`;
}
