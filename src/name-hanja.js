// 한자 성명학 — 사격(원형이정)과 81수리.
// 획수는 원획(강희자전 기준, scripts/build-hanja-db.mjs 참조)을 사용한다.
// 81수리 길흉 분류는 유파별 차이가 있어, 결과 화면에 반드시 고지한다.

const LUCKY = new Set([
  1, 3, 5, 6, 7, 8, 11, 13, 15, 16, 17, 18, 21, 23, 24, 25, 29, 31, 32, 33, 35, 37, 38, 39, 41,
  45, 47, 48, 52, 57, 61, 63, 65, 67, 68, 81,
]);
const NEUTRAL = new Set([27, 30, 42, 51, 53, 55, 58, 71, 72, 73, 75, 77, 78]);

const KEYWORDS = {
  1: "시작과 우두머리",
  3: "밝은 재능",
  5: "복덕과 성공",
  6: "계승과 안정",
  7: "굳센 독립",
  8: "근면한 발전",
  11: "다시 일어서는 힘",
  13: "지혜와 총명",
  15: "덕망과 통솔",
  16: "귀인의 도움",
  17: "돌파하는 의지",
  18: "성취와 결단",
  21: "우두머리의 그릇",
  23: "떠오르는 기세",
  24: "재물이 모이는 형",
  25: "재주와 안전",
  29: "성공과 지모",
  31: "흥가하는 지도력",
  32: "뜻밖의 행운",
  33: "왕성한 융창",
  35: "평온한 성취",
  37: "인덕과 출세",
  38: "학예의 재능",
  39: "안락한 부영",
  41: "덕과 명망",
  45: "순풍의 지혜",
  47: "결실과 전개",
  48: "유덕한 스승",
  52: "선견지명",
  57: "노력 끝의 영달",
  61: "명리를 얻는 영화",
  63: "순조로운 발전",
  65: "장수와 흥가",
  67: "통달하는 성공",
  68: "발명과 성실",
  81: "다시 근원으로",
  27: "중도의 좌절을 조심",
  30: "크게 얻거나 크게 잃거나",
  42: "재예는 많으나 흩어지기 쉬움",
  51: "성쇠가 갈마드는 형",
  53: "겉은 화려하나 안이 허함",
  55: "선악이 반반",
  58: "늦게 피는 복",
  71: "견실하면 안락",
  72: "길흉이 상반",
  73: "무리하지 않으면 평온",
  75: "지키면 길, 나서면 흉",
  77: "도움 속의 반길",
  78: "중년까지의 발전",
};

export function gradeOf(number) {
  if (LUCKY.has(number)) return "길";
  if (NEUTRAL.has(number)) return "평";
  return "흉";
}

export function describeNumber(number) {
  const grade = gradeOf(number);
  const keyword =
    KEYWORDS[number] ??
    (grade === "길" ? "무난히 풀리는 수" : grade === "평" ? "쓰기 나름인 수" : "주의가 필요한 수");
  return { number, grade, keyword };
}

// 81수리: 81을 넘으면 80을 빼고 다시 센다 (81 = 1로 회귀하는 순환 관례)
export function normalize81(sum) {
  let value = sum;
  while (value > 81) value -= 80;
  return value;
}

/**
 * 사격(원형이정) 계산.
 * @param surnameStrokes 성 글자들의 원획 배열 (복성은 두 글자)
 * @param givenStrokes   이름 글자들의 원획 배열
 * 원격(元)=이름 획수 합 / 형격(亨)=성 합+이름 첫 자 / 이격(利)=성 합+이름 끝 자 / 정격(貞)=전체 합.
 * 외자 이름은 이격=형격과 동일함을 호출 측에서 고지한다.
 */
export function calculateFourGrids(surnameStrokes, givenStrokes) {
  if (!surnameStrokes.length || !givenStrokes.length) return null;

  const surname = surnameStrokes.reduce((sum, s) => sum + s, 0);
  const givenTotal = givenStrokes.reduce((sum, s) => sum + s, 0);
  const first = givenStrokes[0];
  const last = givenStrokes[givenStrokes.length - 1];

  const grids = [
    { key: "won", label: "원격(元)", meaning: "초년의 바탕", sum: givenTotal },
    { key: "hyeong", label: "형격(亨)", meaning: "청년의 주운", sum: surname + first },
    { key: "i", label: "이격(利)", meaning: "장년의 대외운", sum: surname + last },
    { key: "jeong", label: "정격(貞)", meaning: "인생 전체의 총운", sum: surname + givenTotal },
  ];

  return grids.map((grid) => ({
    ...grid,
    ...describeNumber(normalize81(grid.sum)),
  }));
}

export function buildHanjaNameReading(selection) {
  // selection: [{ char, strokes, reading, isSurname }] — 이름 순서대로
  const surname = selection.filter((item) => item.isSurname);
  const given = selection.filter((item) => !item.isSurname);
  if (!surname.length || !given.length) return null;

  const grids = calculateFourGrids(
    surname.map((item) => item.strokes),
    given.map((item) => item.strokes),
  );

  const luckyCount = grids.filter((grid) => grid.grade === "길").length;
  const badCount = grids.filter((grid) => grid.grade === "흉").length;
  const verdict =
    badCount === 0
      ? "네 격이 고르게 안정된 이름입니다"
      : luckyCount >= badCount
        ? "좋은 격이 우세하되, 조심할 격이 하나 있는 이름입니다"
        : "격의 흐름을 보완할 지점이 보이는 이름입니다";

  return {
    verdict,
    grids,
    isSingleGiven: given.length === 1,
    hanjaName: selection.map((item) => item.char).join(""),
    evidence: selection.map((item) => `${item.char} ${item.strokes}획`),
  };
}
