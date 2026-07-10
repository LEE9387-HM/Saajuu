import { TOPIC_OPTIONS } from "./fortune.js";

// 공유 해시 스키마: #r=s|l|ll.YYYY-MM-DD.HH.MM[.topic]
// s=양력, l=음력, ll=음력 윤달. 이름·고민·톤은 절대 담지 않는다(개인정보 최소화).
const HASH_PREFIX = "#r=";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TOPIC_VALUES = new Set(TOPIC_OPTIONS.map((topic) => topic.value));

export function encodeShareHash(input) {
  const cal = input.calendarType === "lunar" ? (input.isLeapMonth ? "ll" : "l") : "s";
  const parts = [
    cal,
    input.birthDate,
    String(input.hour).padStart(2, "0"),
    String(input.minute).padStart(2, "0"),
  ];
  if (input.topic && TOPIC_VALUES.has(input.topic)) {
    parts.push(input.topic);
  }
  return `${HASH_PREFIX}${parts.join(".")}`;
}

export function decodeShareHash(hash) {
  if (typeof hash !== "string" || !hash.startsWith(HASH_PREFIX)) return null;

  const parts = hash.slice(HASH_PREFIX.length).split(".");
  if (parts.length < 4 || parts.length > 5) return null;

  const [cal, birthDate, hourRaw, minuteRaw, topic] = parts;
  if (!["s", "l", "ll"].includes(cal)) return null;
  if (!DATE_PATTERN.test(birthDate)) return null;

  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null;
  if (topic !== undefined && !TOPIC_VALUES.has(topic)) return null;

  return {
    calendarType: cal === "s" ? "solar" : "lunar",
    isLeapMonth: cal === "ll",
    birthDate,
    hour,
    minute,
    topic: topic ?? "relationship",
    tone: "balanced",
    name: "",
    concern: "",
  };
}
