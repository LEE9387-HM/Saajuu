import { describe, expect, it } from "vitest";
import {
  buildDetailedReading,
  calculateChart,
  countElements,
  formatInputSummary,
  interpretElements,
  parseBirthDate,
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
