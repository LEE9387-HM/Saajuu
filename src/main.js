import "./styles.css";
import {
  analyzeName,
  CONSULTATION_MODES,
  CONSULTATION_PERSONAS,
  buildCompatibilityReading,
  buildGuidance,
  buildNameReading,
  buildDetailedReading,
  buildPersonalizedBriefing,
  buildTopicReading,
  calculateChart,
  ELEMENTS,
  formatInputSummary,
  interpretElements,
  recommendConsultationPersonas,
  TOPIC_OPTIONS,
  TONE_OPTIONS,
} from "./fortune.js";
import { buildDailyFortune, localDateKey } from "./daily.js";
import { decodeShareHash, encodeShareHash } from "./share.js";
import { clearProfile, loadProfile, saveProfile } from "./storage.js";
import { initAnalytics, track } from "./track.js";
import {
  acceptRelationshipInvite,
  createConsultationSession,
  createRelationshipInvite,
  getRelationshipInviteTokenFromHash,
  getRelationshipLinks,
  getCurrentSession,
  getRequiredConsentStatus,
  isSupabaseConfigured,
  onAuthStateChange,
  recordRequiredConsents,
  REQUIRED_CONSENTS,
  signInWithOAuthProvider,
  signOut,
  syncProfileForSession,
} from "./auth.js";

const SWATCH_COLORS = { 목: "#3f7d5c", 화: "#c05a44", 토: "#c5964f", 금: "#9aa3ab", 수: "#22333f" };
const RELATIONSHIP_LABELS = {
  crush: "썸",
  lover: "연인",
  spouse: "부부",
  reunion: "재회",
  family: "가족",
  work: "직장",
};

const form = document.querySelector("#birth-form");
const calendarType = document.querySelector("#calendar-type");
const hourSelect = document.querySelector("#birth-hour");
const topicSelect = document.querySelector("#reading-topic");
const toneSelect = document.querySelector("#reading-tone");
const leapMonthField = document.querySelector("#leap-month-field");
const errorMessage = document.querySelector("#form-error");
const resultSection = document.querySelector("#result");
const detailToggle = document.querySelector("#detail-toggle");
const detailReading = document.querySelector("#detail-reading");
const premiumInterestButton = document.querySelector("#premium-interest");
const premiumInterestLabel = document.querySelector("#premium-interest-label");
const premiumInterestNote = document.querySelector("#premium-interest-note");
const navLinks = [...document.querySelectorAll(".app-nav__link")];
const compatibilityForm = document.querySelector("#compatibility-form");
const partnerCalendar = document.querySelector("#partner-calendar");
const partnerHourSelect = document.querySelector("#partner-hour");
const partnerLeapField = document.querySelector("#partner-leap-field");
const partnerLeapMonth = document.querySelector("#partner-leap-month");
const compatibilityError = document.querySelector("#compatibility-error");
const compatibilityResult = document.querySelector("#compatibility-result");
const personaCards = document.querySelector("#persona-cards");
const modeCards = document.querySelector("#mode-cards");
const personaRecommendation = document.querySelector("#persona-recommendation");
const authStatus = document.querySelector("#auth-status");
const authNote = document.querySelector("#auth-note");
const authButtons = [...document.querySelectorAll("[data-auth-provider]")];
const authSignout = document.querySelector("#auth-signout");
const consentForm = document.querySelector("#consent-form");
const consentNote = document.querySelector("#consent-note");
const relationshipAccountPanel = document.querySelector("#relationship-account-panel");
const relationshipInviteType = document.querySelector("#relationship-invite-type");
const relationshipInviteCreate = document.querySelector("#relationship-invite-create");
const relationshipInviteCopy = document.querySelector("#relationship-invite-copy");
const relationshipInviteNote = document.querySelector("#relationship-invite-note");
const relationshipAcceptPanel = document.querySelector("#relationship-accept-panel");
const relationshipInviteAccept = document.querySelector("#relationship-invite-accept");
const relationshipLinks = document.querySelector("#relationship-links");
const trialPersona = document.querySelector("#trial-persona");
const trialTopic = document.querySelector("#trial-topic");
const trialConcern = document.querySelector("#trial-concern");
const trialSessionStart = document.querySelector("#trial-session-start");
const trialSessionNote = document.querySelector("#trial-session-note");
let activeSession = null;
let hasRequiredConsents = false;
let pendingRelationshipInviteToken = "";
let latestRelationshipInviteUrl = "";

premiumInterestButton?.addEventListener("click", () => {
  // 이벤트는 항상 계측한다 — 수요 신호가 목적이라 영구 비활성화하지 않는다.
  track("premium-interest");
  premiumInterestLabel.textContent = "신청 완료";
  premiumInterestNote.textContent = "신청해 주셔서 감사해요. 상담이 열리면 가장 먼저 알려드릴게요.";
});

for (let hour = 0; hour < 24; hour += 1) {
  const option = document.createElement("option");
  option.value = String(hour);
  option.textContent = `${String(hour).padStart(2, "0")}시`;
  if (hour === 12) option.selected = true;
  hourSelect.append(option);
  partnerHourSelect?.append(option.cloneNode(true));
}

for (const topic of TOPIC_OPTIONS) {
  const option = document.createElement("option");
  option.value = topic.value;
  option.textContent = `${topic.label} — ${topic.prompt}`;
  topicSelect.append(option);
}

for (const tone of TONE_OPTIONS) {
  const option = document.createElement("option");
  option.value = tone.value;
  option.textContent = `${tone.label} — ${tone.prompt}`;
  toneSelect.append(option);
}

renderConsultationCatalog();
initAuthPanel();

topicSelect.addEventListener("change", () => {
  updatePersonaRecommendation(topicSelect.value);
  if (trialTopic) trialTopic.value = topicSelect.value;
});

personaCards?.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const button = target?.closest("[data-persona]");
  if (!button) return;
  const personaId = button.dataset.persona;
  const persona = CONSULTATION_PERSONAS.find((item) => item.id === personaId);
  if (!persona) return;
  track("persona_select");
  if (trialPersona) trialPersona.value = persona.id;
  premiumInterestLabel.textContent = `${persona.name} 상담 관심 등록`;
  premiumInterestNote.textContent = `${persona.name} 스타일로 상담이 열리면 알려드릴게요.`;
});

modeCards?.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const button = target?.closest("[data-mode]");
  if (!button) return;
  const modeId = button.dataset.mode;
  const mode = CONSULTATION_MODES.find((item) => item.id === modeId);
  if (!mode) return;
  track("consultation_mode_select");
  premiumInterestLabel.textContent = `${mode.name} 관심 등록`;
  premiumInterestNote.textContent =
    mode.id === "pro"
      ? "프로 상담은 깊은 분석과 리포트 구조로 먼저 준비하겠습니다."
      : `${mode.name} 상품 구성이 정리되면 알려드릴게요.`;
});

function relationLabel(value) {
  return RELATIONSHIP_LABELS[value] ?? "인연";
}

function formatShortDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(value));
}

function renderRelationshipLinks(links) {
  if (!relationshipLinks) return;
  if (!links.length) {
    relationshipLinks.innerHTML = "<li>아직 연결된 인연이 없습니다.</li>";
    return;
  }

  relationshipLinks.innerHTML = links
    .map(
      (link) => `
        <li>
          <strong>${escapeHtml(relationLabel(link.relationship))}</strong>
          <span>${escapeHtml(formatShortDate(link.accepted_at ?? link.created_at))} 연결</span>
        </li>
      `,
    )
    .join("");
}

function updateTrialSessionState() {
  if (!trialSessionStart) return;
  trialSessionStart.disabled = !activeSession || !hasRequiredConsents;
  if (!activeSession && trialSessionNote) {
    trialSessionNote.textContent = "마이에서 로그인하면 무료 상담 체험을 준비할 수 있습니다.";
  } else if (activeSession && !hasRequiredConsents && trialSessionNote) {
    trialSessionNote.textContent = "마이에서 필수 동의를 저장한 뒤 무료 상담 체험을 시작할 수 있습니다.";
  }
}

async function refreshRelationshipPanel(session) {
  if (!relationshipAccountPanel) return;

  pendingRelationshipInviteToken = getRelationshipInviteTokenFromHash();
  relationshipAccountPanel.hidden = !session && !pendingRelationshipInviteToken;
  if (relationshipAcceptPanel) relationshipAcceptPanel.hidden = !session || !pendingRelationshipInviteToken;
  if (relationshipInviteCreate) relationshipInviteCreate.disabled = !session;
  if (relationshipInviteType) relationshipInviteType.disabled = !session;

  if (!session) {
    renderRelationshipLinks([]);
    if (relationshipInviteNote) {
      relationshipInviteNote.textContent = pendingRelationshipInviteToken
        ? "인연 초대를 받았습니다. 마이에서 로그인한 뒤 이 초대를 수락할 수 있습니다."
        : "";
    }
    return;
  }

  const { links, error } = await getRelationshipLinks(session);
  if (error) {
    renderRelationshipLinks([]);
    if (relationshipInviteNote) relationshipInviteNote.textContent = "인연 연결 목록은 DB 연결 확인 후 다시 불러옵니다.";
    return;
  }
  renderRelationshipLinks(links);

  if (relationshipInviteNote && pendingRelationshipInviteToken) {
    relationshipInviteNote.textContent = "받은 초대를 수락하면 이 계정과 상대 계정이 연결됩니다.";
  }
}

async function initAuthPanel() {
  if (!authStatus) return;

  if (!isSupabaseConfigured()) {
    authStatus.textContent = "Supabase 공개 URL과 publishable/anon key가 필요합니다.";
    authNote.textContent = ".env에 VITE_SUPABASE_URL과 VITE_SUPABASE_PUBLISHABLE_KEY를 입력한 뒤 다시 실행하세요.";
    authButtons.forEach((button) => {
      button.disabled = true;
    });
    if (relationshipInviteNote && getRelationshipInviteTokenFromHash()) {
      relationshipInviteNote.textContent = "인연 초대를 받았지만 Supabase 설정이 없어 수락할 수 없습니다.";
    }
    return;
  }

  const syncProfile = async (session) => {
    if (!session) return;
    const { synced, error: syncError } = await syncProfileForSession(session);
    if (synced) {
      authNote.textContent = "계정 프로필을 저장했습니다. 인연 초대와 상담 기록 저장은 다음 단계에서 이어집니다.";
      track("auth_profile_sync");
      return;
    }
    if (syncError) {
      authNote.textContent = "로그인은 완료됐습니다. 프로필 저장은 Supabase DB 마이그레이션 적용 후 활성화됩니다.";
    }
  };

  const updateConsentUi = async (session) => {
    if (!consentForm) return;
    activeSession = session;
    consentForm.hidden = !session;
    if (!session) {
      hasRequiredConsents = false;
      consentNote.textContent = "";
      updateTrialSessionState();
      return;
    }

    const { completed, acceptedTypes, error: consentError } = await getRequiredConsentStatus(session);
    if (consentError) {
      hasRequiredConsents = false;
      consentNote.textContent = "동의 상태는 원격 DB 연결 확인 후 다시 불러옵니다.";
      updateTrialSessionState();
      return;
    }
    hasRequiredConsents = completed;

    REQUIRED_CONSENTS.forEach((consent) => {
      const input = consentForm.elements.namedItem(consent.type);
      if (input instanceof HTMLInputElement) input.checked = acceptedTypes.has(consent.type);
    });

    consentNote.textContent = completed
      ? "필수 동의가 저장되어 있습니다. 상담 체험 준비를 이어갈 수 있습니다."
      : "상담 체험과 기록 저장을 위해 필수 고지를 확인해 주세요.";
    updateTrialSessionState();
  };

  const updateAuthUi = (session) => {
    const email = session?.user?.email;
    authStatus.textContent = email ? `${email} 계정으로 로그인되어 있습니다.` : "로그인하면 상담 체험과 인연 초대를 준비할 수 있습니다.";
    authButtons.forEach((button) => {
      button.hidden = Boolean(session);
      button.disabled = false;
    });
    if (authSignout) authSignout.hidden = !session;
    if (!session) {
      authNote.textContent = "실제 상담권·결제·AI 대화는 서버 함수와 정책 검토 후 열립니다.";
    }
    updateTrialSessionState();
  };

  const { session, error } = await getCurrentSession();
  if (error) {
    authStatus.textContent = "로그인 상태를 불러오지 못했습니다.";
    authNote.textContent = error.message;
  } else {
    updateAuthUi(session);
    await syncProfile(session);
    await updateConsentUi(session);
    await refreshRelationshipPanel(session);
  }

  onAuthStateChange((nextSession) => {
    updateAuthUi(nextSession);
    syncProfile(nextSession);
    updateConsentUi(nextSession);
    refreshRelationshipPanel(nextSession);
  });

  authButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const provider = button.dataset.authProvider;
      if (!provider) return;
      track(`auth_${provider}_start`);
      authStatus.textContent = `${button.textContent.trim()} 화면으로 이동합니다.`;
      button.disabled = true;
      const { error: signInError } = await signInWithOAuthProvider(provider);
      if (signInError) {
        authStatus.textContent = "로그인을 시작하지 못했습니다.";
        authNote.textContent = signInError.message;
        button.disabled = false;
      }
    });
  });

  authSignout?.addEventListener("click", async () => {
    track("auth_signout");
    authStatus.textContent = "로그아웃 중입니다.";
    const { error: signOutError } = await signOut();
    if (signOutError) {
      authStatus.textContent = "로그아웃하지 못했습니다.";
      authNote.textContent = signOutError.message;
    }
  });

  consentForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!activeSession) {
      consentNote.textContent = "로그인 후 동의를 저장할 수 있습니다.";
      return;
    }

    const allChecked = REQUIRED_CONSENTS.every((consent) => {
      const input = consentForm.elements.namedItem(consent.type);
      return input instanceof HTMLInputElement && input.checked;
    });
    if (!allChecked) {
      consentNote.textContent = "필수 고지를 모두 확인해 주세요.";
      return;
    }

    consentNote.textContent = "필수 동의를 저장하고 있습니다.";
    const { recorded, error: consentSaveError } = await recordRequiredConsents(activeSession);
    if (recorded) {
      track("required_consents_saved");
      hasRequiredConsents = true;
      updateTrialSessionState();
      consentNote.textContent = "필수 동의를 저장했습니다. 다음 단계에서 무료 상담 체험을 열 수 있습니다.";
      return;
    }

    consentNote.textContent = consentSaveError?.message ?? "동의를 저장하지 못했습니다.";
  });

  relationshipInviteCreate?.addEventListener("click", async () => {
    if (!activeSession) {
      relationshipInviteNote.textContent = "로그인 후 초대 링크를 만들 수 있습니다.";
      return;
    }

    relationshipInviteCreate.disabled = true;
    relationshipInviteNote.textContent = "초대 링크를 만들고 있습니다.";
    const relationship = relationshipInviteType?.value ?? "lover";
    const { inviteUrl, error: inviteError } = await createRelationshipInvite(activeSession, relationship);
    relationshipInviteCreate.disabled = false;

    if (inviteError) {
      relationshipInviteNote.textContent = inviteError.message;
      return;
    }

    latestRelationshipInviteUrl = inviteUrl;
    relationshipInviteCopy.hidden = false;
    relationshipInviteNote.textContent = `${relationLabel(relationship)} 초대 링크를 만들었습니다. 링크에는 생년월일시가 포함되지 않습니다.`;
    track("relationship_invite_created");
  });

  relationshipInviteCopy?.addEventListener("click", async () => {
    if (!latestRelationshipInviteUrl) return;
    try {
      await navigator.clipboard.writeText(latestRelationshipInviteUrl);
      relationshipInviteNote.textContent = "초대 링크를 복사했습니다. 상대에게 보내 주세요.";
    } catch {
      relationshipInviteNote.textContent = `초대 링크: ${latestRelationshipInviteUrl}`;
    }
  });

  relationshipInviteAccept?.addEventListener("click", async () => {
    if (!activeSession || !pendingRelationshipInviteToken) {
      relationshipInviteNote.textContent = "로그인 후 받은 인연 초대를 수락할 수 있습니다.";
      return;
    }

    relationshipInviteAccept.disabled = true;
    relationshipInviteNote.textContent = "인연 초대를 수락하고 있습니다.";
    const { data, error: acceptError } = await acceptRelationshipInvite(
      activeSession,
      pendingRelationshipInviteToken,
    );
    relationshipInviteAccept.disabled = false;

    if (acceptError) {
      relationshipInviteNote.textContent = acceptError.message;
      return;
    }

    track("relationship_connected");
    relationshipInviteNote.textContent = `${relationLabel(data?.relationship)} 인연으로 연결했습니다.`;
    relationshipAcceptPanel.hidden = true;
    pendingRelationshipInviteToken = "";
    history.replaceState(null, "", window.location.pathname + window.location.search);
    await refreshRelationshipPanel(activeSession);
  });

  trialSessionStart?.addEventListener("click", async () => {
    if (!activeSession) {
      trialSessionNote.textContent = "로그인 후 무료 상담 체험을 시작할 수 있습니다.";
      return;
    }
    if (!hasRequiredConsents) {
      trialSessionNote.textContent = "필수 동의를 먼저 저장해 주세요.";
      document.querySelector("#my-page")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    trialSessionStart.disabled = true;
    trialSessionNote.textContent = "무료 상담 세션을 만들고 있습니다.";
    const concern =
      trialConcern?.value?.trim() ||
      document.querySelector("#current-concern")?.value?.trim() ||
      "지금 고민을 사주 흐름과 함께 정리하고 싶어요.";
    const { data, error: sessionError } = await createConsultationSession(activeSession, {
      personaId: trialPersona?.value ?? "miseon",
      mode: "trial",
      topic: trialTopic?.value ?? topicSelect.value ?? "relationship",
      concernSummary: concern,
    });

    if (sessionError) {
      trialSessionNote.textContent = sessionError.message;
      updateTrialSessionState();
      return;
    }

    const session = data?.session;
    const sessionId = session?.id ? String(session.id).slice(0, 8) : "";
    const remainingTurns = session ? Number(session.turn_limit) - Number(session.used_turns) : 3;
    track("trial_started");
    trialSessionNote.textContent = data?.reused
      ? `이미 열린 무료 상담 세션을 불러왔습니다. 남은 턴 ${remainingTurns}회 · ${sessionId}`
      : `무료 상담 세션을 만들었습니다. 남은 턴 ${remainingTurns}회 · ${sessionId}`;
    updateTrialSessionState();
  });
}

calendarType.addEventListener("change", () => {
  leapMonthField.hidden = calendarType.value !== "lunar";
  if (leapMonthField.hidden) {
    document.querySelector("#is-leap-month").checked = false;
  }
});

partnerCalendar?.addEventListener("change", () => {
  partnerLeapField.hidden = partnerCalendar.value !== "lunar";
  if (partnerLeapField.hidden && partnerLeapMonth) {
    partnerLeapMonth.checked = false;
  }
});

detailToggle.addEventListener("click", () => {
  const willOpen = detailReading.hidden;
  detailReading.hidden = !willOpen;
  detailToggle.setAttribute("aria-expanded", String(willOpen));
  detailToggle.lastElementChild.textContent = willOpen ? "−" : "＋";
  detailToggle.firstElementChild.textContent = willOpen
    ? "상세 풀이 접기"
    : "근거와 함께 상세 풀이 읽기";
});

const dailySection = document.querySelector("#daily");
const emptyDaily = document.querySelector("#empty-daily");
const saveCardButton = document.querySelector("#save-card");
let lastResult = null;

function renderDaily(chart, now = new Date()) {
  const daily = buildDailyFortune(chart, now);
  document.querySelector("#daily-date").textContent = `${daily.dateLabel} · ${daily.ganji}일`;
  document.querySelector("#daily-verdict").textContent = daily.verdict;
  document.querySelector("#daily-sub").textContent = daily.sub;
  document.querySelector("#daily-total-score").textContent = String(daily.totalScore);
  document.querySelector("#daily-number").textContent = String(daily.luckyNumber);
  document.querySelector("#daily-number-sub").textContent = `보조 ${daily.luckySecondary}`;
  document.querySelector("#daily-color").textContent = daily.luckyColor;
  document.querySelector("#daily-swatch").style.background = SWATCH_COLORS[daily.luckyElement];
  document.querySelector("#daily-ganji").textContent = daily.ganji;
  document.querySelector("#daily-area-scores").innerHTML = daily.areaScores
    .map(
      (area) => `
        <div class="daily-bar">
          <span>${escapeHtml(area.label)}</span>
          <div class="daily-bar__track" aria-label="${escapeHtml(area.label)} ${area.score}점">
            <i style="width: ${area.score}%"></i>
          </div>
          <strong>${area.score}</strong>
        </div>
      `,
    )
    .join("");
  document.querySelector("#daily-time-slots").innerHTML = daily.timeSlots
    .map(
      (slot) => `
        <div class="daily-slot">
          <span>${escapeHtml(slot.label)}</span>
          <strong>${slot.score}</strong>
        </div>
      `,
    )
    .join("");
  document.querySelector("#daily-direction").textContent = daily.luckyDirection;
  document.querySelector("#daily-food").textContent = daily.luckyFood;
  document.querySelector("#daily-item").textContent = daily.luckyItem;
  document.querySelector("#daily-caution").textContent = daily.caution;
  document.querySelector("#daily-action").textContent = daily.action;
  document.querySelector("#daily-consult-question").textContent = daily.consultQuestion;
  document.querySelector("#daily-tomorrow").textContent = daily.tomorrow.verdict;
  document.querySelector("#daily-evidence").innerHTML = renderEvidence("오늘의 근거", daily.evidence);
  dailySection.hidden = false;
  if (emptyDaily) emptyDaily.hidden = true;
  track("daily-view");
  return daily;
}

function refreshDailyIfStale() {
  if (!lastResult?.daily || dailySection.hidden) return;
  if (lastResult.daily.dateKey !== localDateKey(new Date())) {
    lastResult.daily = renderDaily(lastResult.chart);
  }
}

// 밤새 열어둔 탭 대응 — visibilitychange만으로는 안 잡히는 브라우저가 있어 focus를 병행한다.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshDailyIfStale();
});
window.addEventListener("focus", refreshDailyIfStale);

document.querySelector("#clear-profile")?.addEventListener("click", () => {
  clearProfile();
  dailySection.hidden = true;
  if (emptyDaily) emptyDaily.hidden = false;
  resultSection.hidden = true;
  lastResult = null;
  errorMessage.textContent = "저장된 정보를 삭제했어요. 다시 보려면 아래에서 새로 입력해 주세요.";
  errorMessage.hidden = false;
});

document.querySelector("#edit-profile")?.addEventListener("click", () => {
  document.querySelector(".calculator").scrollIntoView({ behavior: "smooth", block: "start" });
  document.querySelector("#birth-date").focus();
});

function applyProfileToForm(profile) {
  calendarType.value = profile.calendarType;
  calendarType.dispatchEvent(new Event("change"));
  document.querySelector("#birth-date").value = profile.birthDate;
  hourSelect.value = String(profile.hour);
  document.querySelector("#birth-minute").value = String(profile.minute);
  document.querySelector("#is-leap-month").checked = Boolean(profile.isLeapMonth);
  if (profile.topic) topicSelect.value = profile.topic;
  if (profile.tone) toneSelect.value = profile.tone;
  document.querySelector("#person-name").value = profile.name ?? "";
  document.querySelector("#current-concern").value = profile.concern ?? "";
}

const sharedBanner = document.querySelector("#shared-banner");
const backToMineButton = document.querySelector("#back-to-mine");
const shareLinkButton = document.querySelector("#share-link");
const shareNote = document.querySelector("#share-note");
const dailyManage = document.querySelector(".daily__manage");
const dailyNotice = document.querySelector(".daily__notice");

// 재방문: 저장 프로필이 있으면 오늘의 운세를 폼보다 먼저 보여준다.
// 복원~렌더 전체를 격리해, 손상 데이터로 페이지가 죽지 않게 한다.
function restoreProfile() {
  const profile = loadProfile();
  if (!profile) return false;
  try {
    const chart = calculateChart(profile);
    applyProfileToForm(profile);
    const guidance = renderResult(chart, profile);
    const daily = renderDaily(chart);
    lastResult = { chart, input: profile, guidance, daily };
    resultSection.hidden = false;
    return true;
  } catch {
    clearProfile();
    dailySection.hidden = true;
    if (emptyDaily) emptyDaily.hidden = false;
    return false;
  }
}

// 공유 링크: 일회성 렌더. 저장 프로필을 덮지 않으며 관리 버튼도 숨긴다.
function renderShared(shared) {
  try {
    const chart = calculateChart(shared);
    const guidance = renderResult(chart, shared);
    const daily = renderDaily(chart);
    lastResult = { chart, input: shared, guidance, daily };
    resultSection.hidden = false;
    dailyManage.hidden = true;
    dailyNotice.hidden = true;
    sharedBanner.hidden = false;
    backToMineButton.hidden = !loadProfile();
    track("share-open");
    return true;
  } catch {
    errorMessage.textContent = "공유 링크가 올바르지 않아요. 아래에서 직접 입력해 주세요.";
    errorMessage.hidden = false;
    return false;
  }
}

function exitSharedView() {
  sharedBanner.hidden = true;
  dailyManage.hidden = false;
  dailyNotice.hidden = false;
  dailySection.hidden = true;
  if (emptyDaily) emptyDaily.hidden = false;
  resultSection.hidden = true;
  restoreProfile();
}

backToMineButton?.addEventListener("click", exitSharedView);

function bootstrap(hash) {
  const shared = decodeShareHash(hash);
  if (shared) {
    const rendered = renderShared(shared);
    // 새로고침·뒤로가기 시 공유 뷰가 반복되지 않게 해시를 지운다
    history.replaceState(null, "", window.location.pathname + window.location.search);
    if (rendered) return;
  } else if (hash.startsWith("#r=")) {
    errorMessage.textContent = "공유 링크가 올바르지 않아요. 아래에서 직접 입력해 주세요.";
    errorMessage.hidden = false;
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
  restoreProfile();
}

// 같은 탭에 다른 공유 링크를 붙여넣는 경우까지 처리한다
window.addEventListener("hashchange", () => {
  if (window.location.hash.startsWith("#r=")) bootstrap(window.location.hash);
  if (window.location.hash.startsWith("#invite=")) {
    refreshRelationshipPanel(activeSession);
    document.querySelector("#relationship")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

shareLinkButton?.addEventListener("click", async () => {
  if (!lastResult) return;
  track("share-link");
  const url =
    window.location.origin + window.location.pathname + encodeShareHash(lastResult.input);
  if (navigator.share) {
    try {
      await navigator.share({ title: "사주 한 장", url });
      return;
    } catch {
      return; // 사용자가 공유 시트를 닫음
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    shareNote.textContent = "링크를 복사했어요. 붙여넣어 공유해 보세요.";
  } catch {
    shareNote.textContent = `이 링크를 복사해 공유하세요: ${url}`;
  }
});

// ── 한자 성명학 (사격) — 한자 데이터는 버튼을 눌렀을 때만 lazy-load한다 ──
const hanjaOpenButton = document.querySelector("#hanja-open");
const hanjaPanel = document.querySelector("#hanja-panel");
const hanjaSelects = document.querySelector("#hanja-selects");
const hanjaResult = document.querySelector("#hanja-result");
const hanjaDoubleSurnameField = document.querySelector("#hanja-double-surname-field");
const hanjaDoubleSurname = document.querySelector("#hanja-double-surname");
let hanjaData = null;

async function loadHanjaData() {
  if (hanjaData) return hanjaData;
  const module = await import("./data/name-hanja.json");
  hanjaData = module.default;
  return hanjaData;
}

function currentCleanName() {
  return analyzeName(lastResult?.input?.name)?.cleanName ?? "";
}

function renderHanjaSelects(cleanName) {
  hanjaSelects.innerHTML = "";
  hanjaResult.hidden = true;
  const surnameLength = hanjaDoubleSurname.checked && cleanName.length >= 3 ? 2 : 1;

  [...cleanName].forEach((syllable, index) => {
    const candidates = hanjaData[syllable] ?? [];
    const wrapper = document.createElement("label");
    wrapper.className = "hanja-select";
    const role = index < surnameLength ? "성" : "이름";
    wrapper.innerHTML = `<span>${escapeHtml(syllable)} <em>(${role})</em></span>`;

    const select = document.createElement("select");
    select.dataset.isSurname = String(index < surnameLength);
    select.dataset.reading = syllable;
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = candidates.length
      ? `한자 선택 (${candidates.length}자)`
      : "인명용 한자 없음";
    select.append(placeholder);
    candidates.forEach((candidate, candidateIndex) => {
      const option = document.createElement("option");
      option.value = String(candidateIndex);
      option.textContent = `${candidate.c} ${candidate.m || syllable} · ${candidate.s}획`;
      select.append(option);
    });
    select.disabled = candidates.length === 0;
    select.addEventListener("change", renderHanjaResultIfComplete);
    wrapper.append(select);
    hanjaSelects.append(wrapper);
  });
}

async function renderHanjaResultIfComplete() {
  const selects = [...hanjaSelects.querySelectorAll("select")];
  if (!selects.length || selects.some((select) => !select.disabled && select.value === "")) return;

  const { buildHanjaNameReading } = await import("./name-hanja.js");
  const selection = selects
    .filter((select) => !select.disabled)
    .map((select) => {
      const candidate = hanjaData[select.dataset.reading][Number(select.value)];
      return {
        char: candidate.c,
        strokes: candidate.s,
        reading: select.dataset.reading,
        isSurname: select.dataset.isSurname === "true",
      };
    });

  const reading = buildHanjaNameReading(selection);
  if (!reading) return;

  document.querySelector("#hanja-verdict").textContent =
    `${reading.hanjaName} — ${reading.verdict}`;
  document.querySelector("#hanja-grids").innerHTML = reading.grids
    .map(
      (grid) => `
        <div class="hanja-grid hanja-grid--${grid.grade === "길" ? "good" : grid.grade === "평" ? "even" : "bad"}">
          <span>${escapeHtml(grid.label)}</span>
          <strong>${grid.number}수 · ${escapeHtml(grid.grade)}</strong>
          <p>${escapeHtml(grid.keyword)}</p>
          <small>${escapeHtml(grid.meaning)}</small>
        </div>
      `,
    )
    .join("");
  document.querySelector("#hanja-note").textContent =
    (reading.isSingleGiven ? "외자 이름은 이격이 형격과 같게 계산됩니다. " : "") +
    "81수리 길흉 분류는 유파에 따라 차이가 있어 참고용으로 봐 주세요.";
  document.querySelector("#hanja-evidence").innerHTML = renderEvidence(
    "원획 근거",
    reading.evidence,
  );
  hanjaResult.hidden = false;
  track("hanja-reading");
}

hanjaOpenButton?.addEventListener("click", async () => {
  const cleanName = currentCleanName();
  if (!cleanName || cleanName.length < 2) {
    hanjaPanel.hidden = false;
    hanjaSelects.innerHTML = "<p class='hanja-hint'>성과 이름을 포함한 한글 이름을 먼저 입력해 주세요.</p>";
    return;
  }
  track("hanja-open");
  hanjaOpenButton.disabled = true;
  try {
    await loadHanjaData();
    hanjaDoubleSurnameField.hidden = cleanName.length < 3;
    hanjaPanel.hidden = false;
    renderHanjaSelects(cleanName);
  } catch {
    hanjaPanel.hidden = false;
    hanjaSelects.innerHTML =
      "<p class='hanja-hint'>한자 사전을 불러오지 못했어요. 네트워크 확인 후 다시 시도해 주세요.</p>";
  } finally {
    hanjaOpenButton.disabled = false;
  }
});

hanjaDoubleSurname?.addEventListener("change", () => {
  const cleanName = currentCleanName();
  if (cleanName && hanjaData) renderHanjaSelects(cleanName);
});

bootstrap(window.location.hash);
if (getRelationshipInviteTokenFromHash()) {
  document.querySelector("#relationship")?.scrollIntoView({ block: "start" });
}

initAnalytics();

function setActiveNav(id) {
  navLinks.forEach((link) => {
    const isActive = link.dataset.navTarget === id;
    link.classList.toggle("app-nav__link--active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

const navSections = navLinks
  .map((link) => document.getElementById(link.dataset.navTarget))
  .filter(Boolean);

if ("IntersectionObserver" in window) {
  const navObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveNav(visible.target.id);
    },
    { rootMargin: "-18% 0px -62% 0px", threshold: [0.15, 0.35, 0.6] },
  );
  navSections.forEach((section) => navObserver.observe(section));
}

window.addEventListener("hashchange", () => {
  const id = window.location.hash.slice(1);
  if (navSections.some((section) => section.id === id)) setActiveNav(id);
});

const initialNavId = window.location.hash.slice(1);
setActiveNav(navSections.some((section) => section.id === initialNavId) ? initialNavId : "today");

saveCardButton?.addEventListener("click", () => {
  if (!lastResult) return;
  track("card-save");
  const canvas = drawSajuCard(lastResult);
  canvas.toBlob(async (blob) => {
    if (!blob) return;
    const file = new File([blob], "saajuu-card.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "사주 한 장" });
        return;
      } catch {
        return;
      }
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "saajuu-card.png";
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
});

compatibilityForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (compatibilityError) compatibilityError.hidden = true;

  if (!lastResult?.chart) {
    if (compatibilityError) {
      compatibilityError.textContent = "먼저 내 사주를 입력한 뒤 상대와의 흐름을 볼 수 있어요.";
      compatibilityError.hidden = false;
    }
    document.querySelector("#saju")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const data = new FormData(compatibilityForm);
  const partnerInput = {
    calendarType: data.get("partnerCalendar"),
    birthDate: data.get("partnerDate"),
    hour: Number(data.get("partnerHour")),
    minute: Number(data.get("partnerMinute")),
    isLeapMonth: data.get("partnerLeapMonth") === "on",
    topic: "relationship",
    tone: "balanced",
    name: "",
    concern: "",
  };

  try {
    const partnerChart = calculateChart(partnerInput);
    const reading = buildCompatibilityReading(
      lastResult.chart,
      partnerChart,
      data.get("partnerRelation"),
    );
    renderCompatibility(reading);
    track("compatibility-view");
  } catch (error) {
    if (compatibilityError) {
      compatibilityError.textContent =
        error instanceof Error
          ? error.message
          : "상대 정보를 계산하는 중 문제가 생겼어요. 입력값을 다시 확인해 주세요.";
      compatibilityError.hidden = false;
    }
  }
});

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(" ");
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y);
  return y + lineHeight;
}

function drawSajuCard({ chart, input, guidance: storedGuidance }) {
  // 화면과 카드의 내용이 어긋나지 않도록 렌더 시점 값을 재사용한다
  const guidance = storedGuidance ?? buildGuidance(chart);
  const reading = interpretElements(chart.elements);

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");

  const ink = "#152a38";
  const jade = "#4d8072";
  const gold = "#c5964f";
  const muted = "#718087";
  const serif = '"Gowun Batang", "Noto Serif KR", serif';

  ctx.fillStyle = "#fbf6ec";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);

  ctx.textAlign = "center";
  ctx.fillStyle = gold;
  ctx.font = `700 30px ${serif}`;
  ctx.fillText("四柱", canvas.width / 2, 110);

  ctx.fillStyle = ink;
  ctx.font = `700 68px ${serif}`;
  ctx.fillText("사주 한 장", canvas.width / 2, 190);

  ctx.fillStyle = muted;
  ctx.font = `400 32px ${serif}`;
  ctx.fillText(formatInputSummary(input), canvas.width / 2, 248);

  const columnWidth = 230;
  const startX = canvas.width / 2 - columnWidth * 1.5;
  chart.pillars.forEach((pillar, index) => {
    const x = startX + columnWidth * index;
    ctx.fillStyle = muted;
    ctx.font = `400 28px ${serif}`;
    ctx.fillText(pillar.label, x, 340);
    ctx.fillStyle = ink;
    ctx.font = `700 120px ${serif}`;
    ctx.fillText(pillar.stem, x, 480);
    ctx.fillText(pillar.branch, x, 620);
  });

  ctx.strokeStyle = "rgba(197, 150, 79, 0.45)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, 690);
  ctx.lineTo(canvas.width - 120, 690);
  ctx.stroke();

  ctx.fillStyle = ink;
  ctx.font = `700 44px ${serif}`;
  ctx.fillText(reading.title, canvas.width / 2, 770);

  ctx.fillStyle = muted;
  ctx.font = `400 30px ${serif}`;
  ctx.fillText(guidance.title, canvas.width / 2, 826);

  ctx.textAlign = "left";
  const textX = 130;
  const maxWidth = canvas.width - textX * 2;

  ctx.fillStyle = jade;
  ctx.font = `700 34px ${serif}`;
  ctx.fillText("가까이할 것", textX, 930);
  ctx.fillStyle = ink;
  ctx.font = `400 32px ${serif}`;
  let cursorY = wrapText(ctx, guidance.embrace[0], textX, 986, maxWidth, 46);

  ctx.fillStyle = "#b0563f";
  ctx.font = `700 34px ${serif}`;
  ctx.fillText("조심할 것", textX, cursorY + 60);
  ctx.fillStyle = ink;
  ctx.font = `400 32px ${serif}`;
  wrapText(ctx, guidance.avoid[0], textX, cursorY + 116, maxWidth, 46);

  ctx.textAlign = "center";
  ctx.fillStyle = muted;
  ctx.font = `400 26px ${serif}`;
  ctx.fillText("사주 한 장 · 브라우저에서만 계산되는 작은 만세력", canvas.width / 2, 1290);

  return canvas;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  errorMessage.hidden = true;

  const data = new FormData(form);
  const input = {
    calendarType: data.get("calendarType"),
    birthDate: data.get("birthDate"),
    hour: Number(data.get("birthHour")),
    minute: Number(data.get("birthMinute")),
    isLeapMonth: data.get("isLeapMonth") === "on",
    topic: data.get("readingTopic") ?? "relationship",
    tone: data.get("readingTone") ?? "balanced",
    name: data.get("personName") ?? "",
    concern: data.get("currentConcern") ?? "",
  };

  try {
    const chart = calculateChart(input);
    const guidance = renderResult(chart, input);
    const daily = renderDaily(chart);
    saveProfile(input);
    lastResult = { chart, input, guidance, daily };
    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    errorMessage.textContent =
      error instanceof Error
        ? error.message
        : "계산 중 문제가 생겼습니다. 입력값을 확인해 주세요.";
    errorMessage.hidden = false;
  }
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderList(items) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderEvidence(label, items) {
  return `
    <span>${escapeHtml(label)}</span>
    ${items.map((item) => `<em>${escapeHtml(item)}</em>`).join("")}
  `;
}

function renderCompatibility(reading) {
  document.querySelector("#compatibility-label").textContent = reading.relationshipLabel;
  document.querySelector("#compatibility-score").textContent = String(reading.score);
  document.querySelector("#compatibility-verdict").textContent = reading.verdict;
  document.querySelector("#compatibility-copy").textContent = reading.copy;
  document.querySelector("#compatibility-strengths").innerHTML = renderList(reading.strengths);
  document.querySelector("#compatibility-frictions").innerHTML = renderList(reading.frictions);
  document.querySelector("#compatibility-talk").innerHTML = renderList(reading.talkGuide);
  document.querySelector("#compatibility-question").textContent = reading.consultQuestion;
  document.querySelector("#compatibility-evidence").innerHTML = renderEvidence("궁합 근거", reading.evidence);
  if (compatibilityResult) {
    compatibilityResult.hidden = false;
    compatibilityResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function renderConsultationCatalog() {
  if (trialPersona) {
    trialPersona.innerHTML = CONSULTATION_PERSONAS.map(
      (persona) => `<option value="${escapeHtml(persona.id)}">${escapeHtml(persona.name)}</option>`,
    ).join("");
  }

  if (trialTopic) {
    trialTopic.innerHTML = TOPIC_OPTIONS.map(
      (topic) => `<option value="${escapeHtml(topic.value)}">${escapeHtml(topic.label)}</option>`,
    ).join("");
  }

  if (personaCards) {
    personaCards.innerHTML = CONSULTATION_PERSONAS.map(
      (persona) => `
        <article class="persona-card" data-persona="${escapeHtml(persona.id)}">
          <div class="persona-card__top">
            <span class="persona-avatar" aria-hidden="true">${escapeHtml(persona.initial)}</span>
            <div>
              <h4>${escapeHtml(persona.name)}</h4>
              <p>${escapeHtml(persona.role)}</p>
            </div>
          </div>
          <p>${escapeHtml(persona.tone)}</p>
          <div class="persona-tags">
            ${persona.specialties.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
          </div>
          <blockquote>${escapeHtml(persona.sample)}</blockquote>
          <button type="button" class="persona-select" data-persona="${escapeHtml(persona.id)}">
            ${escapeHtml(persona.name)} 상담 관심
          </button>
        </article>
      `,
    ).join("");
  }

  if (modeCards) {
    modeCards.innerHTML = CONSULTATION_MODES.map(
      (mode) => `
        <article class="mode-card mode-card--${escapeHtml(mode.id)}">
          <span>${escapeHtml(mode.turns)}</span>
          <h4>${escapeHtml(mode.name)}</h4>
          <strong>${escapeHtml(mode.price)}</strong>
          <p>${escapeHtml(mode.summary)}</p>
          <ul>
            ${mode.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}
          </ul>
          <button type="button" class="mode-select" data-mode="${escapeHtml(mode.id)}">
            ${escapeHtml(mode.name)} 관심
          </button>
        </article>
      `,
    ).join("");
  }

  updatePersonaRecommendation(topicSelect.value);
  if (trialTopic) trialTopic.value = topicSelect.value;
}

function updatePersonaRecommendation(topic) {
  if (!personaRecommendation) return;
  const recommended = recommendConsultationPersonas(topic);
  personaRecommendation.innerHTML = `
    <span>현재 고민 추천</span>
    <strong>${recommended.map((persona) => escapeHtml(persona.name)).join(" · ")}</strong>
  `;
}

function renderResult(chart, input) {
  document.querySelector("#result-date").textContent = formatInputSummary(input);

  document.querySelector("#pillars").innerHTML = chart.pillars
    .map(
      (pillar) => `
        <article class="pillar pillar--${pillar.key}">
          <div class="pillar__label">
            <span>${pillar.meaning}</span>
            <strong>${pillar.label}</strong>
          </div>
          <div class="pillar__characters" aria-label="${pillar.label} ${pillar.stem}${pillar.branch}">
            <span>${pillar.stem}</span>
            <span>${pillar.branch}</span>
          </div>
        </article>
      `,
    )
    .join("");

  const reading = interpretElements(chart.elements);
  document.querySelector("#elements").innerHTML = ELEMENTS.map((element) => {
    const count = chart.elements[element];
    const percentage = (count / 8) * 100;
    return `
      <div class="element-row">
        <div class="element-row__label">
          <strong>${element}</strong>
          <span>${count}</span>
        </div>
        <div class="element-track" aria-label="${element} ${count}개">
          <span class="element-fill element-fill--${element}" style="width: ${percentage}%"></span>
        </div>
      </div>
    `;
  }).join("");

  document.querySelector("#reading-title").textContent = reading.title;
  document.querySelector("#reading-copy").textContent = reading.copy;

  const guidance = buildGuidance(chart);
  document.querySelector("#guidance-eyebrow").textContent = guidance.eyebrow;
  document.querySelector("#guidance-title").textContent = guidance.title;
  document.querySelector("#guidance-copy").textContent = guidance.copy;
  document.querySelector("#guidance-embrace").innerHTML = renderList(guidance.embrace);
  document.querySelector("#guidance-avoid").innerHTML = renderList(guidance.avoid);
  document.querySelector("#guidance-evidence").innerHTML = renderEvidence("처방 근거", guidance.evidence);

  const topicReading = buildTopicReading(chart, input.topic);
  document.querySelector("#topic-eyebrow").textContent = topicReading.eyebrow;
  document.querySelector("#topic-verdict").textContent = topicReading.verdict;
  document.querySelector("#topic-title").textContent = topicReading.title;
  document.querySelector("#topic-copy").textContent = topicReading.copy;
  document.querySelector("#topic-point").textContent = topicReading.point;
  document.querySelector("#topic-checklist").innerHTML = renderList(topicReading.checklist);
  document.querySelector("#topic-questions").innerHTML = renderList(topicReading.questions);
  document.querySelector("#topic-evidence").innerHTML = renderEvidence("주제 풀이 근거", topicReading.evidence);

  const briefing = buildPersonalizedBriefing(chart, input);
  document.querySelector("#briefing-eyebrow").textContent = briefing.eyebrow;
  document.querySelector("#briefing-title").textContent = briefing.title;
  document.querySelector("#briefing-copy").textContent = briefing.copy;
  document.querySelector("#briefing-notes").innerHTML = briefing.notes
    .map(
      (note) => `
        <article class="briefing-note">
          <span>${escapeHtml(note.label)}</span>
          <p>${escapeHtml(note.text)}</p>
        </article>
      `,
    )
    .join("");
  document.querySelector("#session-opening").textContent = briefing.session.opening;
  document.querySelector("#session-avoid").textContent = briefing.session.avoid;
  document.querySelector("#session-questions").innerHTML = renderList(briefing.session.questions);
  document.querySelector("#briefing-evidence").innerHTML = renderEvidence("맞춤 근거", briefing.evidence);

  const nameReading = buildNameReading(chart, input.name);
  const nameReadingSection = document.querySelector("#name-reading");
  nameReadingSection.hidden = !nameReading;
  if (nameReading) {
    document.querySelector("#name-eyebrow").textContent = nameReading.eyebrow;
    document.querySelector("#name-title").textContent = nameReading.title;
    document.querySelector("#name-copy").textContent = nameReading.copy;
    document.querySelector("#name-point").textContent = nameReading.point;
    document.querySelector("#name-elements").innerHTML = nameReading.elements
      .map(
        (element) => `
          <div class="name-element-row">
            <div>
              <strong>${escapeHtml(element.element)}</strong>
              <span>${escapeHtml(element.label)}</span>
            </div>
            <div class="element-track" aria-label="${escapeHtml(element.element)} ${element.count}개">
              <span class="element-fill" style="width: ${element.percentage}%"></span>
            </div>
            <em>${element.count}</em>
          </div>
        `,
      )
      .join("");
    document.querySelector("#name-checklist").innerHTML = renderList(nameReading.checklist);
    document.querySelector("#name-evidence").innerHTML = renderEvidence("이름 풀이 근거", nameReading.evidence);
  }

  detailReading.hidden = true;
  detailToggle.setAttribute("aria-expanded", "false");
  detailToggle.firstElementChild.textContent = "근거와 함께 상세 풀이 읽기";
  detailToggle.lastElementChild.textContent = "＋";

  document.querySelector("#detail-sections").innerHTML = buildDetailedReading(chart)
    .map(
      (section) => `
        <article class="detail-section">
          <div class="detail-section__number">${section.number}</div>
          <div class="detail-section__body">
            <p class="eyebrow">${section.eyebrow}</p>
            <h4>${section.title}</h4>
            <p>${section.copy}</p>
            <div class="detail-section__point">
              <span>읽는 포인트</span>
              <strong>${section.point}</strong>
            </div>
            <div class="evidence">
              <span>풀이 근거</span>
              ${section.evidence.map((item) => `<em>${escapeHtml(item)}</em>`).join("")}
            </div>
          </div>
        </article>
      `,
    )
    .join("");

  // 이름이 바뀌었을 수 있으니 한자 정밀 풀이 패널은 접는다
  const hanjaPanelEl = document.querySelector("#hanja-panel");
  if (hanjaPanelEl) {
    hanjaPanelEl.hidden = true;
    document.querySelector("#hanja-result").hidden = true;
    document.querySelector("#hanja-selects").innerHTML = "";
  }

  return guidance;
}
