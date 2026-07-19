import { describe, expect, it } from "vitest";
import {
  analyzeName,
  CONSULTATION_MODES,
  CONSULTATION_PERSONAS,
  buildCompatibilityReading,
  buildCompatibilityReadingSymmetric,
  buildGuidance,
  buildTarotOverview,
  buildDetailedReading,
  buildNameReading,
  buildPersonalizedBriefing,
  buildTopicReading,
  buildYearlyOverview,
  calculateChart,
  countElements,
  formatInputSummary,
  interpretElements,
  parseBirthDate,
  recommendConsultationPersonas,
  TOPIC_OPTIONS,
  TONE_OPTIONS,
} from "./fortune.js";

describe("parseBirthDate", () => {
  it("parses an ISO date", () => {
    expect(parseBirthDate("1992-10-24")).toEqual({
      year: 1992,
      month: 10,
      day: 24,
    });
  });

  it("rejects a malformed date", () => {
    expect(() => parseBirthDate("1992/10/24")).toThrow(
      "생년월일을 정확히 입력해 주세요.",
    );
  });
});

describe("calculateChart", () => {
  it("matches the reference manseryeok example", () => {
    const chart = calculateChart({
      calendarType: "solar",
      birthDate: "1992-10-24",
      hour: 5,
      minute: 30,
      isLeapMonth: false,
    });

    expect(chart.pillars.map(({ stem, branch }) => `${stem}${branch}`)).toEqual([
      "임신",
      "경술",
      "계유",
      "을묘",
    ]);
    expect(Object.values(chart.elements).reduce((sum, value) => sum + value, 0)).toBe(8);
  });

  it("converts the equivalent lunar date to the same pillars", () => {
    const chart = calculateChart({
      calendarType: "lunar",
      birthDate: "1992-09-29",
      hour: 5,
      minute: 30,
      isLeapMonth: false,
    });

    expect(chart.pillars.map(({ stem, branch }) => `${stem}${branch}`)).toEqual([
      "임신",
      "경술",
      "계유",
      "을묘",
    ]);
  });

  it("rejects a date that does not exist", () => {
    expect(() =>
      calculateChart({
        calendarType: "solar",
        birthDate: "2026-02-30",
        hour: 12,
        minute: 0,
        isLeapMonth: false,
      }),
    ).toThrow();
  });

  it("accepts every minute from 0 through 59", () => {
    for (let minute = 0; minute < 60; minute += 1) {
      expect(() =>
        calculateChart({
          calendarType: "solar",
          birthDate: "1992-10-24",
          hour: 5,
          minute,
          isLeapMonth: false,
        }),
      ).not.toThrow();
    }
  });

  it("rejects minute 60", () => {
    expect(() =>
      calculateChart({
        calendarType: "solar",
        birthDate: "1992-10-24",
        hour: 5,
        minute: 60,
        isLeapMonth: false,
      }),
    ).toThrow("분은 0부터 59 사이의 정수로 입력해 주세요.");
  });
});

describe("element helpers", () => {
  it("counts two elements from every pillar", () => {
    const counts = countElements([
      { stem: "갑", branch: "인" },
      { stem: "병", branch: "오" },
      { stem: "무", branch: "진" },
      { stem: "경", branch: "신" },
    ]);

    expect(counts).toEqual({ 목: 2, 화: 2, 토: 2, 금: 2, 수: 0 });
  });

  it("builds a deterministic reading", () => {
    const reading = interpretElements({ 목: 3, 화: 2, 토: 1, 금: 1, 수: 1 });
    expect(reading.strongest.element).toBe("목");
    expect(reading.title).toContain("나무");
    expect(reading.copy).toContain("성장과 시작을 상징하는");
  });
});

describe("formatInputSummary", () => {
  it("includes lunar leap month details", () => {
    expect(
      formatInputSummary({
        calendarType: "lunar",
        birthDate: "1990-04-21",
        hour: 5,
        minute: 0,
        isLeapMonth: true,
      }),
    ).toBe("음력 윤달 1990.04.21 · 05:00");
  });
});

describe("buildDetailedReading", () => {
  it("creates four evidence-backed reading sections", () => {
    const chart = calculateChart({
      calendarType: "solar",
      birthDate: "1992-10-24",
      hour: 5,
      minute: 37,
      isLeapMonth: false,
    });
    const sections = buildDetailedReading(chart);

    expect(sections).toHaveLength(4);
    expect(sections[0].title).toContain("계유 일주");
    expect(sections[1].title).toBe("쇠 기운은 살리고 불 기운은 의식하기");
    expect(sections.every((section) => section.evidence.length > 0)).toBe(true);
  });
});

describe("buildTopicReading", () => {
  it("defines the service topics shown in the form", () => {
    expect(TOPIC_OPTIONS.map((topic) => topic.value)).toEqual([
      "relationship",
      "marriage",
      "business",
      "career",
      "family",
      "yearly",
    ]);
  });

  it("uses the user's concern as the primary reading context", () => {
    const chart = calculateChart({
      calendarType: "solar",
      birthDate: "1990-04-21",
      hour: 12,
      minute: 0,
      isLeapMonth: false,
    });
    const reading = buildTopicReading(chart, "business", "지금 사업을 시작해도 될까요?");

    expect(reading.title).toContain("지금 사업을 시작해도 될까요?");
    expect(reading.copy).toContain("결정 기준");
    expect(reading.questions[0]).toContain("지금 사업을 시작해도 될까요?");
  });

  it("narrows concern follow-up questions by the user's intent", () => {
    const chart = calculateChart({
      calendarType: "solar",
      birthDate: "1990-04-21",
      hour: 12,
      minute: 0,
      isLeapMonth: false,
    });

    const relationship = buildTopicReading(chart, "relationship", "그 사람 마음이 아직 있을까요?");
    const money = buildTopicReading(chart, "business", "동업 계약과 투자 비용이 걱정돼요");

    expect(relationship.copy).toContain("상대 신호 확인");
    expect(relationship.questions[0]).toContain("실제 행동으로 보여준 신호");
    expect(money.copy).toContain("돈과 리스크");
    expect(money.questions[0]).toContain("숫자로 확인할 수 있는 지표");
  });

  it("creates a topic-specific reading with counseling prompts", () => {
    const chart = calculateChart({
      calendarType: "solar",
      birthDate: "1992-10-24",
      hour: 5,
      minute: 37,
      isLeapMonth: false,
    });
    const reading = buildTopicReading(chart, "business");

    expect(reading.eyebrow).toBe("사업운");
    expect(reading.title).toContain("흐름");
    expect(reading.checklist).toHaveLength(3);
    expect(reading.questions).toHaveLength(3);
    expect(reading.evidence).toContain("일간 계");
  });
});

describe("buildYearlyOverview", () => {
  it("creates twelve monthly scores and a current-month action", () => {
    const chart = calculateChart({
      calendarType: "solar",
      birthDate: "1992-10-24",
      hour: 5,
      minute: 37,
      isLeapMonth: false,
    });

    const overview = buildYearlyOverview(chart, "business", new Date("2026-07-19T09:00:00+09:00"));

    expect(overview.monthScores).toHaveLength(12);
    expect(overview.currentMonth.label).toBe("7월 집중 포인트");
    expect(overview.currentMonth.score).toBeGreaterThanOrEqual(45);
    expect(overview.currentMonth.score).toBeLessThanOrEqual(92);
    expect(overview.halfYear).toHaveLength(2);
    expect(overview.evidence.length).toBeGreaterThanOrEqual(3);
  });
});

describe("buildTarotOverview", () => {
  it("creates a deterministic lead card and reflection prompts", () => {
    const chart = calculateChart({
      calendarType: "solar",
      birthDate: "1990-04-21",
      hour: 12,
      minute: 0,
      isLeapMonth: false,
    });

    const tarot = buildTarotOverview(
      chart,
      "business",
      "당장 사업 시작하고 싶어요",
      new Date("2026-07-19T09:00:00+09:00"),
    );

    expect(tarot.lead.name).toBeTruthy();
    expect(tarot.choice.aLabel).toBe("지금 바로 밀기");
    expect(tarot.choice.bLabel).toBe("작게 시험하기");
    expect(tarot.reflection).toHaveLength(3);
  });
});

describe("buildCompatibilityReading", () => {
  it("creates an evidence-backed relationship reading from two charts", () => {
    const primaryChart = calculateChart({
      calendarType: "solar",
      birthDate: "1992-10-24",
      hour: 5,
      minute: 37,
      isLeapMonth: false,
    });
    const partnerChart = calculateChart({
      calendarType: "solar",
      birthDate: "1990-04-21",
      hour: 12,
      minute: 0,
      isLeapMonth: false,
    });

    const reading = buildCompatibilityReading(primaryChart, partnerChart, "lover");

    expect(reading.relationshipLabel).toBe("연인");
    expect(reading.score).toBeGreaterThanOrEqual(42);
    expect(reading.score).toBeLessThanOrEqual(94);
    expect(reading.strengths).toHaveLength(3);
    expect(reading.frictions).toHaveLength(3);
    expect(reading.talkGuide).toHaveLength(3);
    expect(reading.evidence.some((item) => item.includes("관계 리듬"))).toBe(true);
  });

  it("keeps the relationship score identical when the two people are swapped", () => {
    const first = calculateChart({
      calendarType: "solar",
      birthDate: "1992-10-24",
      hour: 5,
      minute: 37,
      isLeapMonth: false,
    });
    const second = calculateChart({
      calendarType: "solar",
      birthDate: "1990-04-21",
      hour: 12,
      minute: 0,
      isLeapMonth: false,
    });

    expect(buildCompatibilityReading(first, second, "spouse").score).toBe(
      buildCompatibilityReading(second, first, "spouse").score,
    );
  });

  it("keeps the relationship copy identical when the two people are swapped", () => {
    const first = calculateChart({
      calendarType: "solar",
      birthDate: "1992-10-24",
      hour: 5,
      minute: 37,
      isLeapMonth: false,
    });
    const second = calculateChart({
      calendarType: "solar",
      birthDate: "1990-04-21",
      hour: 12,
      minute: 0,
      isLeapMonth: false,
    });

    const forward = buildCompatibilityReadingSymmetric(first, second, "spouse");
    const backward = buildCompatibilityReadingSymmetric(second, first, "spouse");

    expect(backward).toEqual(forward);
  });
});

describe("consultation catalog", () => {
  it("keeps persona choice separate from consultation mode", () => {
    expect(CONSULTATION_PERSONAS.map((persona) => persona.id)).toEqual([
      "miseon",
      "junho",
      "seongu",
    ]);
    expect(CONSULTATION_MODES.map((mode) => mode.id)).toEqual(["trial", "basic", "pro"]);
    expect(CONSULTATION_MODES.find((mode) => mode.id === "pro").features).toContain(
      "선택지별 장단점 비교",
    );
  });

  it("recommends personas from the concern topic without changing the paid mode", () => {
    expect(recommendConsultationPersonas("marriage").map((persona) => persona.name)).toEqual([
      "미선 이모",
      "성우 선생",
    ]);
    expect(recommendConsultationPersonas("career").map((persona) => persona.name)).toEqual([
      "성우 선생",
      "준호 형",
    ]);
  });
});

describe("name reading", () => {
  it("analyzes a Hangul name as a supplemental five-element profile", () => {
    const name = analyzeName(" 김사주 ");

    expect(name.cleanName).toBe("김사주");
    expect(name.syllableCount).toBe(3);
    expect(Object.values(name.counts).reduce((sum, value) => sum + value, 0)).toBeGreaterThan(0);
    expect(name.evidence[0]).toContain("김");
  });

  it("ignores names that cannot be read as Hangul syllables", () => {
    expect(analyzeName("Alex")).toBeNull();
  });

  it("builds a composite name and saju reading", () => {
    const chart = calculateChart({
      calendarType: "solar",
      birthDate: "1992-10-24",
      hour: 5,
      minute: 37,
      isLeapMonth: false,
    });
    const reading = buildNameReading(chart, "김사주");

    expect(reading.title).toContain("김사주");
    expect(reading.copy).toContain("한글 이름");
    expect(reading.elements).toHaveLength(5);
    expect(reading.evidence).toContain("이름 김사주");
  });
});

describe("buildGuidance", () => {
  const chart = calculateChart({
    calendarType: "solar",
    birthDate: "1992-10-24",
    hour: 5,
    minute: 30,
    isLeapMonth: false,
  });

  it("builds a yearly prescription anchored to the current year pillar", () => {
    const guidance = buildGuidance(chart, new Date(2026, 6, 8));

    expect(guidance.title).toContain("2026년 병오년");
    expect(guidance.evidence).toContain("세운 병오");
    expect(guidance.copy).toContain("일간 계 기준");
  });

  it("prescribes embrace items from the weakest element and cautions from the strongest", () => {
    const guidance = buildGuidance(chart, new Date(2026, 6, 8));

    // 이 사주는 화(불)가 가장 약하고 금(쇠)이 가장 강하다
    expect(guidance.embrace).toHaveLength(3);
    expect(guidance.avoid).toHaveLength(3);
    expect(guidance.embrace[0]).toContain("표현하는 활동");
    expect(guidance.embrace[2]).toContain("붉은 계열");
    expect(guidance.avoid[0]).toContain("기준이 날카로워지는");
  });

  it("marks a year that doubles the strongest element as one to slow down in", () => {
    // 2025 을사년: 사(화)는 이 사주의 보완 오행이라 채워지는 해로 읽힌다
    const guidance2025 = buildGuidance(chart, new Date(2025, 6, 8));
    expect(guidance2025.copy).toContain("채워지는 흐름");
  });
});

describe("buildPersonalizedBriefing", () => {
  it("creates a tone-aware counseling note from topic, name, and concern", () => {
    const chart = calculateChart({
      calendarType: "solar",
      birthDate: "1992-10-24",
      hour: 5,
      minute: 37,
      isLeapMonth: false,
    });
    const briefing = buildPersonalizedBriefing(chart, {
      topic: "marriage",
      tone: "direct",
      name: "김사주",
      concern: "결혼을 확신해도 될지 고민돼요",
    });

    expect(TONE_OPTIONS.map((tone) => tone.value)).toEqual(["balanced", "direct", "warm"]);
    expect(briefing.title).toContain("김사주");
    expect(briefing.copy).toContain("결혼을 확신해도 될지 고민돼요");
    expect(briefing.copy).toContain("결정 기준");
    expect(briefing.notes).toHaveLength(3);
    expect(briefing.session.questions).toHaveLength(3);
    expect(briefing.session.questions[0]).toContain("오늘 당장 결정하지 못하게");
    expect(briefing.evidence).toContain("주제 결혼운");
  });
});
