import { describe, expect, it } from "vitest";
import { decodeShareHash, encodeShareHash } from "./share.js";

describe("share hash", () => {
  it("round-trips a solar profile with topic", () => {
    const input = {
      calendarType: "solar",
      birthDate: "1992-10-24",
      hour: 5,
      minute: 30,
      isLeapMonth: false,
      topic: "business",
    };
    const hash = encodeShareHash(input);
    expect(hash).toBe("#r=s.1992-10-24.05.30.business");

    const decoded = decodeShareHash(hash);
    expect(decoded.calendarType).toBe("solar");
    expect(decoded.birthDate).toBe("1992-10-24");
    expect(decoded.hour).toBe(5);
    expect(decoded.minute).toBe(30);
    expect(decoded.topic).toBe("business");
  });

  it("round-trips lunar and lunar-leap calendars", () => {
    const lunar = decodeShareHash(
      encodeShareHash({ calendarType: "lunar", birthDate: "1990-04-21", hour: 12, minute: 0, isLeapMonth: false }),
    );
    expect(lunar.calendarType).toBe("lunar");
    expect(lunar.isLeapMonth).toBe(false);

    const leap = decodeShareHash(
      encodeShareHash({ calendarType: "lunar", birthDate: "1990-04-21", hour: 12, minute: 0, isLeapMonth: true }),
    );
    expect(leap.isLeapMonth).toBe(true);
  });

  it("never encodes name, concern, or tone", () => {
    const hash = encodeShareHash({
      calendarType: "solar",
      birthDate: "1992-10-24",
      hour: 5,
      minute: 30,
      isLeapMonth: false,
      topic: "marriage",
      name: "김사주",
      concern: "비밀 고민",
      tone: "warm",
    });
    expect(hash).not.toContain("김사주");
    expect(hash).not.toContain("비밀");
    expect(hash).not.toContain("warm");
  });

  it("rejects malformed hashes", () => {
    expect(decodeShareHash("")).toBeNull();
    expect(decodeShareHash("#other")).toBeNull();
    expect(decodeShareHash("#r=x.1992-10-24.05.30")).toBeNull(); // 잘못된 달력 토큰
    expect(decodeShareHash("#r=s.19921024.05.30")).toBeNull(); // 날짜 형식 위반
    expect(decodeShareHash("#r=s.1992-10-24.24.30")).toBeNull(); // 시각 범위 밖
    expect(decodeShareHash("#r=s.1992-10-24.05.61")).toBeNull(); // 분 범위 밖
    expect(decodeShareHash("#r=s.1992-10-24.05.30.hacking")).toBeNull(); // 미지의 주제
    expect(decodeShareHash("#r=s.1992-10-24.05.30.business.extra")).toBeNull(); // 초과 세그먼트
  });

  it("defaults missing topic to relationship with balanced tone", () => {
    const decoded = decodeShareHash("#r=s.1992-10-24.05.30");
    expect(decoded.topic).toBe("relationship");
    expect(decoded.tone).toBe("balanced");
    expect(decoded.name).toBe("");
  });
});
