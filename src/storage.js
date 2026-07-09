const PROFILE_KEY = "saajuu:profile";

function getStore(store) {
  if (store) return store;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function saveProfile(input, store) {
  const target = getStore(store);
  if (!target) return false;
  try {
    target.setItem(
      PROFILE_KEY,
      JSON.stringify({
        v: 1,
        calendarType: input.calendarType,
        birthDate: input.birthDate,
        hour: input.hour,
        minute: input.minute,
        isLeapMonth: Boolean(input.isLeapMonth),
        topic: input.topic,
        tone: input.tone,
        name: input.name ?? "",
        concern: input.concern ?? "",
        savedAt: new Date().toISOString(),
      }),
    );
    return true;
  } catch {
    // 사파리 프라이빗 모드 등 — 저장 실패해도 앱 동작에는 지장 없음
    return false;
  }
}

export function loadProfile(store) {
  const target = getStore(store);
  if (!target) return null;
  try {
    const raw = target.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed?.v !== 1 ||
      typeof parsed.birthDate !== "string" ||
      !Number.isInteger(parsed.hour) ||
      !Number.isInteger(parsed.minute)
    ) {
      target.removeItem(PROFILE_KEY);
      return null;
    }
    return parsed;
  } catch {
    try {
      target.removeItem(PROFILE_KEY);
    } catch {
      /* noop */
    }
    return null;
  }
}

export function clearProfile(store) {
  const target = getStore(store);
  if (!target) return;
  try {
    target.removeItem(PROFILE_KEY);
  } catch {
    /* noop */
  }
}
