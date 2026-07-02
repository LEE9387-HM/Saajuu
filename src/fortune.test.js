import { describe, expect, it } from "vitest";
import {
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
