// GoatCounter 사이트 코드. goatcounter.com에서 계정 생성 후 사이트 코드를 넣으면
// 계측이 켜진다. 비어 있으면 모든 추적이 no-op — 배포를 막지 않는다.
export const GOATCOUNTER_CODE = "fortune9388";

export function initAnalytics() {
  if (!GOATCOUNTER_CODE || typeof document === "undefined") return;
  const script = document.createElement("script");
  script.async = true;
  script.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
  script.src = "//gc.zgo.at/count.js";
  document.head.append(script);
}

export function track(eventName) {
  // 애드블록이 스크립트를 차단하면 window.goatcounter가 없다 — 조용히 무시한다.
  try {
    window.goatcounter?.count?.({ path: eventName, event: true });
  } catch {
    /* noop */
  }
}
