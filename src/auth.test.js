import { describe, expect, it } from "vitest";
import { getOAuthBrowserWarning, isKakaoInAppBrowser } from "./auth.js";

const kakaoTalkAndroidUserAgent =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/125.0.0.0 Mobile Safari/537.36 KAKAOTALK 11.0.0";

describe("OAuth browser warnings", () => {
  it("detects KakaoTalk in-app browsers", () => {
    expect(isKakaoInAppBrowser(kakaoTalkAndroidUserAgent)).toBe(true);
    expect(isKakaoInAppBrowser("Mozilla/5.0 Chrome/125.0.0.0 Safari/537.36")).toBe(false);
  });

  it("blocks Google OAuth inside KakaoTalk in-app browsers", () => {
    const warning = getOAuthBrowserWarning("google", kakaoTalkAndroidUserAgent);
    expect(warning?.status).toContain("Google");
    expect(warning?.note).toContain("Chrome");
  });

  it("does not block Kakao OAuth or normal browsers", () => {
    expect(getOAuthBrowserWarning("kakao", kakaoTalkAndroidUserAgent)).toBeNull();
    expect(getOAuthBrowserWarning("google", "Mozilla/5.0 Chrome/125.0.0.0 Safari/537.36")).toBeNull();
  });
});
