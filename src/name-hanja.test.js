import { describe, expect, it } from "vitest";
import {
  buildHanjaNameReading,
  calculateFourGrids,
  describeNumber,
  gradeOf,
  normalize81,
} from "./name-hanja.js";
import hanjaData from "./data/name-hanja.json";

describe("81수리", () => {
  it("classifies every number from 1 to 81 into exactly one grade", () => {
    for (let n = 1; n <= 81; n += 1) {
      expect(["길", "평", "흉"]).toContain(gradeOf(n));
    }
  });

  it("matches the traditional classification on canonical numbers", () => {
    expect(gradeOf(1)).toBe("길");
    expect(gradeOf(23)).toBe("길");
    expect(gradeOf(81)).toBe("길");
    expect(gradeOf(4)).toBe("흉");
    expect(gradeOf(9)).toBe("흉");
    expect(gradeOf(30)).toBe("평");
  });

  it("wraps sums above 81 by subtracting 80", () => {
    expect(normalize81(81)).toBe(81);
    expect(normalize81(82)).toBe(2);
    expect(normalize81(100)).toBe(20);
    expect(normalize81(162)).toBe(2);
  });

  it("always yields a keyword", () => {
    for (let n = 1; n <= 81; n += 1) {
      expect(describeNumber(n).keyword.length).toBeGreaterThan(2);
    }
  });
});

describe("calculateFourGrids", () => {
  it("computes 원형이정 for a standard 3-syllable name (김지수 金智洙)", () => {
    // 金8 智12 洙10
    const grids = calculateFourGrids([8], [12, 10]);
    const byKey = Object.fromEntries(grids.map((grid) => [grid.key, grid]));
    expect(byKey.won.number).toBe(22); // 원격 = 12+10
    expect(byKey.hyeong.number).toBe(20); // 형격 = 8+12
    expect(byKey.i.number).toBe(18); // 이격 = 8+10
    expect(byKey.jeong.number).toBe(30); // 정격 = 8+12+10
    expect(byKey.i.grade).toBe("길");
    expect(byKey.jeong.grade).toBe("평");
  });

  it("treats a single-syllable given name with 이격 equal to 형격", () => {
    const grids = calculateFourGrids([8], [12]);
    const byKey = Object.fromEntries(grids.map((grid) => [grid.key, grid]));
    expect(byKey.hyeong.number).toBe(byKey.i.number);
  });

  it("sums a two-syllable surname (남궁)", () => {
    const grids = calculateFourGrids([9, 10], [4]);
    const byKey = Object.fromEntries(grids.map((grid) => [grid.key, grid]));
    expect(byKey.jeong.number).toBe(23);
  });

  it("returns null when surname or given name is empty", () => {
    expect(calculateFourGrids([], [10])).toBeNull();
    expect(calculateFourGrids([8], [])).toBeNull();
  });
});

describe("buildHanjaNameReading", () => {
  it("builds a verdict-first reading with evidence", () => {
    const reading = buildHanjaNameReading([
      { char: "金", strokes: 8, reading: "김", isSurname: true },
      { char: "智", strokes: 12, reading: "지", isSurname: false },
      { char: "洙", strokes: 10, reading: "수", isSurname: false },
    ]);
    expect(reading.hanjaName).toBe("金智洙");
    expect(reading.grids).toHaveLength(4);
    expect(reading.verdict.length).toBeGreaterThan(5);
    expect(reading.evidence).toContain("智 12획");
    expect(reading.isSingleGiven).toBe(false);
  });
});

describe("name-hanja dataset", () => {
  it("contains court-registered hanja with correct 원획 spot checks", () => {
    const find = (reading, char) => hanjaData[reading]?.find((entry) => entry.c === char);
    expect(find("지", "智").s).toBe(12);
    expect(find("수", "洙").s).toBe(10); // 氵 변형 부수 → 水 4획 보정
    expect(find("오", "五").s).toBe(5); // 숫자 한자 수의 획
    expect(find("사", "四").s).toBe(4);
    expect(find("김", "金").s).toBe(8);
  });

  it("keeps every entry well-formed", () => {
    const readings = Object.keys(hanjaData);
    expect(readings.length).toBeGreaterThan(400);
    for (const reading of readings) {
      for (const entry of hanjaData[reading]) {
        expect(typeof entry.c).toBe("string");
        expect(entry.s).toBeGreaterThan(0);
        expect(entry.s).toBeLessThan(60);
      }
    }
  });
});
