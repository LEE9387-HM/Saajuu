import { describe, expect, it } from "vitest";
import { FIVE_ELEMENTS } from "manseryeok";
import {
  BRANCHES,
  buildDailyFortune,
  ELEMENT_GENERATES,
  getBranchRelation,
  localDateKey,
  LUCKY_NUMBERS,
} from "./daily.js";
import { calculateChart, TOPIC_OPTIONS } from "./fortune.js";
import { buildTopicReading } from "./fortune.js";

// 1992-10-24 05:30 — 일주 계유, 강한 오행 금, 부족 오행 화
const chart = calculateChart({
  calendarType: "solar",
  birthDate: "1992-10-24",
  hour: 5,
  minute: 30,
  isLeapMonth: false,
});

describe("getBranchRelation", () => {
  it("resolves multi-relation pairs by priority (충 > 형 > 육합 > 반합)", () => {
    expect(getBranchRelation("인", "신")).toBe("충"); // 충이면서 삼형 → 충
    expect(getBranchRelation("축", "미")).toBe("충"); // 충이면서 삼형 → 충
    expect(getBranchRelation("사", "신")).toBe("형"); // 육합이면서 삼형 → 형
    expect(getBranchRelation("자", "묘")).toBe("형"); // 상형
    expect(getBranchRelation("자", "축")).toBe("육합");
    expect(getBranchRelation("신", "자")).toBe("반합"); // 신자진 수국
    expect(getBranchRelation("신", "유")).toBe("없음");
  });

  it("treats 진·오·유·해 same-branch pairs as self-punishment", () => {
    for (const branch of ["진", "오", "유", "해"]) {
      expect(getBranchRelation(branch, branch)).toBe("형");
    }
    expect(getBranchRelation("자", "자")).toBe("없음");
  });

  it("is symmetric across all 144 pairs", () => {
    for (const a of BRANCHES) {
      for (const b of BRANCHES) {
        expect(getBranchRelation(a, b)).toBe(getBranchRelation(b, a));
      }
    }
  });
});

describe("element data", () => {
  it("matches the library's five elements and forms a full generation cycle", () => {
    expect(Object.keys(ELEMENT_GENERATES).sort()).toEqual([...FIVE_ELEMENTS].sort());
    // 목→화→토→금→수→목 순환: 5번 생하면 제자리
    let element = "목";
    for (let i = 0; i < 5; i += 1) element = ELEMENT_GENERATES[element];
    expect(element).toBe("목");
  });

  it("assigns traditional numerology numbers per element", () => {
    expect(LUCKY_NUMBERS.목).toEqual([3, 8]);
    expect(LUCKY_NUMBERS.수).toEqual([1, 6]);
  });
});

describe("buildDailyFortune", () => {
  it("builds a deterministic daily fortune for a fixed date", () => {
    // 2026-07-09 일진 = 갑신. 일간 계 기준 갑 = 상관.
    const daily = buildDailyFortune(chart, new Date(2026, 6, 9));

    expect(daily.ganji).toBe("갑신");
    expect(daily.tenGod).toBe("상관");
    expect(daily.verdict).toContain("말은 아끼는 날");
    expect(daily.caution.length).toBeGreaterThan(5);
    expect(daily.dateKey).toBe("2026-07-09");
    expect(daily.evidence).toContain("일진 갑신");
  });

  it("uses the weakest element as lucky element when today differs from the strongest", () => {
    // 갑(목) ≠ 강한 오행(금) → 부족 오행(화), 숫자 2·7, 신(index 8, 짝수) → 주 숫자 2
    const daily = buildDailyFortune(chart, new Date(2026, 6, 9));
    expect(daily.luckyElement).toBe("화");
    expect(daily.luckyNumber).toBe(2);
    expect(daily.luckySecondary).toBe(7);
    expect(daily.luckyColor).toContain("붉은");
  });

  it("vents the strongest element on days that double it", () => {
    // 강한 오행(금)과 같은 오행의 일진 날 → 금이 생하는 수가 행운 오행
    // 2026-07-15 = 경인일(경=금)
    const daily = buildDailyFortune(chart, new Date(2026, 6, 15));
    expect(daily.ganji.startsWith("경")).toBe(true);
    expect(daily.luckyElement).toBe("수");
  });

  it("gives a different reading tomorrow (teaser)", () => {
    const daily = buildDailyFortune(chart, new Date(2026, 6, 9));
    expect(daily.tomorrow.ganji).toBe("을유");
    expect(daily.tomorrow.verdict).not.toBe(daily.verdict);
  });
});

describe("localDateKey", () => {
  it("uses the local calendar date, not UTC", () => {
    // 로컬 자정 직후 — toISOString이라면 전날로 밀리는 시각
    expect(localDateKey(new Date(2026, 6, 9, 0, 30))).toBe("2026-07-09");
  });
});

describe("topic verdicts", () => {
  it("gives every topic card a one-line verdict", () => {
    for (const topic of TOPIC_OPTIONS) {
      const reading = buildTopicReading(chart, topic.value);
      expect(reading.verdict, topic.value).toBeTruthy();
      expect(reading.verdict.length).toBeLessThan(40);
      expect(reading.copy.startsWith("아니")).toBe(false);
    }
  });
});
