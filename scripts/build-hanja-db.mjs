// 대법원 인명용 한자 → 성명학용 JSON 변환 스크립트
//
// 데이터 출처: 대법원 「가족관계의 등록 등에 관한 규칙」 별표 인명용 한자표.
//   법령·대법원규칙과 국가 작성 편집물은 저작권법 제7조 제1호·제4호에 따라
//   저작권 보호를 받지 않는다. 전사본: https://github.com/delvier/krcourt (webhanja.db)
//
// 사용법:
//   1. curl -sL -o /tmp/webhanja.db https://github.com/delvier/krcourt/raw/main/webhanja.db
//   2. node scripts/build-hanja-db.mjs /tmp/webhanja.db
//   → src/data/name-hanja.json 생성 (음절 → 후보 목록)
//
// 원획(강희자전 획수) 계산:
//   rad_stroke.stroke는 부수를 제외한 나머지 획수, rad_id는 강희 부수 번호(1~214).
//   원획 = 강희 부수의 본자 획수 + 나머지 획수. 부수 변형(氵→水 등)은 rad_id가
//   본자 기준이라 자동 보정된다. 숫자 한자(一~十)만 수의(數意) 획으로 덮어쓴다.

import { DatabaseSync } from "node:sqlite";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dbPath = process.argv[2];
if (!dbPath) {
  console.error("사용법: node scripts/build-hanja-db.mjs <webhanja.db 경로>");
  process.exit(1);
}

// 강희 214부수의 본자 획수 — 부수 번호 구간으로 확정된다 (강희자전 배열 순서)
const RADICAL_STROKE_RANGES = [
  [1, 6, 1],
  [7, 29, 2],
  [30, 60, 3],
  [61, 94, 4],
  [95, 113, 5],
  [114, 146, 6],
  [147, 166, 7],
  [167, 175, 8],
  [176, 186, 9],
  [187, 194, 10],
  [195, 200, 11],
  [201, 204, 12],
  [205, 208, 13],
  [209, 210, 14],
  [211, 211, 15],
  [212, 213, 16],
  [214, 214, 17],
];

function radicalStrokes(radId) {
  for (const [from, to, strokes] of RADICAL_STROKE_RANGES) {
    if (radId >= from && radId <= to) return strokes;
  }
  throw new Error(`알 수 없는 부수 번호: ${radId}`);
}

// 성명학 관례: 숫자 한자는 필획이 아니라 뜻하는 수로 센다
const NUMERAL_OVERRIDES = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };

const db = new DatabaseSync(dbPath, { readOnly: true });
const rows = db
  .prepare(
    `SELECT h.cd, h.inm, h.ineum, r.rad_id, MIN(r.stroke) AS stroke
     FROM hanja_info h
     JOIN rad_stroke r ON h.cd = r.cd
     WHERE h.isin = 1 AND h.ineum IS NOT NULL AND h.ineum != ''
     GROUP BY h.cd`,
  )
  .all();

const byReading = {};
let count = 0;

for (const row of rows) {
  const char = String.fromCodePoint(Number.parseInt(row.cd, 16));
  const strokes = NUMERAL_OVERRIDES[char] ?? radicalStrokes(row.rad_id) + row.stroke;
  // inm 형식: "지 : 갈(지) 이를(지)" — 콜론 뒤가 뜻
  const meaning = String(row.inm ?? "")
    .split(":")
    .slice(1)
    .join(":")
    .trim()
    .slice(0, 24);

  const readings = String(row.ineum)
    .split(",")
    .map((reading) => reading.trim())
    .filter((reading) => /^[가-힣]$/.test(reading));

  for (const reading of readings) {
    (byReading[reading] ??= []).push({ c: char, m: meaning, s: strokes });
    count += 1;
  }
}

// 획수 오름차순, 같은 획수는 코드포인트 순 — UI에서 안정된 순서 보장
for (const reading of Object.keys(byReading)) {
  byReading[reading].sort((a, b) => a.s - b.s || a.c.codePointAt(0) - b.c.codePointAt(0));
}

const outPath = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "name-hanja.json");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(byReading));

console.log(`완료: 음절 ${Object.keys(byReading).length}개, 한자 항목 ${count}개 → ${outPath}`);
