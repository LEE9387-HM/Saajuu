import "./styles.css";
import * as PortOne from "@portone/browser-sdk/v2";
import {
  analyzeName,
  CONSULTATION_MODES,
  CONSULTATION_PERSONAS,
  buildCompatibilityReading,
  buildCompatibilityReadingSymmetric,
  buildGuidance,
  buildNameReading,
  buildDetailedReading,
  buildPersonalizedBriefing,
  buildTarotOverview,
  buildTopicReading,
  buildYearlyOverview,
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
  completePortonePayment,
  createConsultationOrder,
  createConsultationSession,
  createRelationshipInvite,
  getCommerceOverview,
  getAccountProfile,
  getAdminDashboard,
  getConsultationMessages,
  getConsultationSummary,
  getRelationshipInviteTokenFromHash,
  getRelationshipLinks,
  getCurrentSession,
  getOAuthBrowserWarning,
  getRequiredConsentStatus,
  isSupabaseConfigured,
  onAuthStateChange,
  requestPasswordReset,
  recordRequiredConsents,
  REQUIRED_CONSENTS,
  sendConsultationMessage,
  signInWithPassword,
  signInWithOAuthProvider,
  signUpWithPassword,
  signOut,
  syncProfileForSession,
  updateRelationshipLabel,
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
const RELATIONSHIP_TOPIC_MAP = {
  crush: "relationship",
  lover: "relationship",
  spouse: "marriage",
  reunion: "relationship",
  family: "family",
  work: "career",
};
const TRIAL_STAGES = [
  { number: 1, label: "마음 듣기", description: "지금 가장 걸리는 마음을 정확히 듣는 단계" },
  { number: 2, label: "조건 좁히기", description: "사실과 걱정, 준비 상태를 나누는 단계" },
  { number: 3, label: "행동 정리", description: "선택지와 바로 할 행동을 정리하는 단계" },
];
const PERSONA_IMAGE_MAP = {
  miseon: "./generated/persona-miseon.jpg",
  junho: "./generated/persona-junho.jpg",
  seongu: "./generated/persona-seongu.jpg",
};
const portoneStoreId = import.meta.env?.VITE_PORTONE_STORE_ID ?? "";
const portoneChannelKey = import.meta.env?.VITE_PORTONE_CHANNEL_KEY ?? "";

const form = document.querySelector("#birth-form");
const calendarType = document.querySelector("#calendar-type");
const hourSelect = document.querySelector("#birth-hour");
const topicSelect = document.querySelector("#reading-topic");
const toneSelect = document.querySelector("#reading-tone");
const leapMonthField = document.querySelector("#leap-month-field");
const errorMessage = document.querySelector("#form-error");
const profileModal = document.querySelector("#profile-modal");
const profileModalClose = document.querySelector("#profile-modal-close");
const profileModalTitle = document.querySelector("#profile-modal-title");
const profileModalCopy = document.querySelector("#profile-modal-copy");
const profileSummaryTitle = document.querySelector("#profile-summary-title");
const profileSummaryCopy = document.querySelector("#profile-summary-copy");
const profileSummaryList = document.querySelector("#profile-summary-list");
const myProfileSummaryList = document.querySelector("#my-profile-summary-list");
const myProfileEmpty = document.querySelector("#my-profile-empty");
const myProfileTitle = document.querySelector("#my-profile-title");
const myProfileNote = document.querySelector("#my-profile-note");
const myProfileActions = document.querySelector("#my-profile-actions");
const birthDateInput = document.querySelector("#birth-date");
const partnerDateInput = document.querySelector("#partner-date");
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
const personaSwitcher = document.querySelector("#persona-switcher");
const modeSwitcher = document.querySelector("#mode-switcher");
const personaRecommendation = document.querySelector("#persona-recommendation");
const authStatus = document.querySelector("#auth-status");
const authNote = document.querySelector("#auth-note");
const authProviderNote = document.querySelector("#auth-provider-note");
const authButtons = [...document.querySelectorAll("[data-auth-provider]")];
const authJumpButtons = [...document.querySelectorAll("[data-auth-jump]")];
const authPanelTabs = [...document.querySelectorAll("[data-auth-panel-tab]")];
const authPanels = [...document.querySelectorAll("[data-auth-panel]")];
const authSignout = document.querySelector("#auth-signout");
const emailSignupForm = document.querySelector("#email-signup-form");
const emailLoginForm = document.querySelector("#email-login-form");
const signupDisplayNameInput = document.querySelector("#signup-display-name");
const signupEmailInput = document.querySelector("#signup-email");
const signupPasswordInput = document.querySelector("#signup-password");
const loginEmailInput = document.querySelector("#login-email");
const loginPasswordInput = document.querySelector("#login-password");
const passwordResetRequestButton = document.querySelector("#password-reset-request");
const emailAuthNote = document.querySelector("#email-auth-note");
const adminNavLink = document.querySelector("#admin-nav-link");
const adminStatus = document.querySelector("#admin-status");
const adminPanel = document.querySelector("#admin-panel");
const adminStats = document.querySelector("#admin-stats");
const adminSessionFilters = [...document.querySelectorAll("[data-admin-session-filter]")];
const adminSafetyFilters = [...document.querySelectorAll("[data-admin-safety-filter]")];
const adminProfiles = document.querySelector("#admin-profiles");
const adminSessions = document.querySelector("#admin-sessions");
const adminEntitlements = document.querySelector("#admin-entitlements");
const adminOrders = document.querySelector("#admin-orders");
const adminSafety = document.querySelector("#admin-safety");
const commercePanel = document.querySelector("#commerce-panel");
const commerceNote = document.querySelector("#commerce-note");
const entitlementList = document.querySelector("#entitlement-list");
const orderHistoryList = document.querySelector("#order-history-list");
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
const relationshipPanelTitle = document.querySelector("#relationship-panel-title");
const relationshipPanelCopy = document.querySelector("#relationship-panel-copy");
const relationshipPanelSummary = document.querySelector("#relationship-panel-summary");
const trialPersona = document.querySelector("#trial-persona");
const trialTopic = document.querySelector("#trial-topic");
const trialConcern = document.querySelector("#trial-concern");
const trialSessionStart = document.querySelector("#trial-session-start");
const trialSessionNote = document.querySelector("#trial-session-note");
const trialChat = document.querySelector("#trial-chat");
const trialChatStatus = document.querySelector("#trial-chat-status");
const trialChatPersonaImage = document.querySelector("#trial-chat-persona-image");
const trialChatPersonaName = document.querySelector("#trial-chat-persona-name");
const trialChatRemaining = document.querySelector("#trial-chat-remaining");
const trialStageStrip = document.querySelector("#trial-stage-strip");
const trialGuidance = document.querySelector("#trial-guidance");
const trialGuidanceStage = document.querySelector("#trial-guidance-stage");
const trialGuidanceTitle = document.querySelector("#trial-guidance-title");
const trialGuidancePrompt = document.querySelector("#trial-guidance-prompt");
const trialGuidanceChips = document.querySelector("#trial-guidance-chips");
const trialChatLog = document.querySelector("#trial-chat-log");
const trialMessage = document.querySelector("#trial-message");
const trialMessageSend = document.querySelector("#trial-message-send");
const trialNextStep = document.querySelector("#trial-next-step");
const resultTabs = [...document.querySelectorAll("[data-result-tab]")];
const resultPanels = [...document.querySelectorAll("[data-result-panel]")];
const consultTabs = [...document.querySelectorAll("[data-consult-tab]")];
const consultPanels = [...document.querySelectorAll("[data-consult-panel]")];
const profileModalTriggers = [...document.querySelectorAll("[data-profile-modal-open]")];
const profileClearButtons = [...document.querySelectorAll("[data-profile-clear]")];
let activeSession = null;
let hasRequiredConsents = false;
let pendingRelationshipInviteToken = "";
let latestRelationshipInviteUrl = "";
let activeConsultationSession = null;
let activeConsultationMessages = [];
let activeConsultationGuidance = null;
let activeRelationshipLinks = [];
let activeRelationshipLabelEditorId = "";
let pendingConsultationContext = null;
let selectedPersonaId = "miseon";
let selectedModeId = "trial";
let preferredEntitlementId = "";
let profileModalMode = "create";
let activeAccountProfile = null;
let activeAdminDashboard = null;
let activeCommerceOverview = null;
let adminSessionFilter = "all";
let adminSafetyFilter = "all";

function getAuthProviderLabel(user) {
  const provider = String(
    user?.app_metadata?.provider ??
      user?.identities?.[0]?.provider ??
      ""
  )
    .trim()
    .toLowerCase();

  if (provider === "google") return "구글 로그인";
  if (provider === "kakao") return "카카오 로그인";
  if (provider === "email") return "이메일 계정";
  return "계정 로그인";
}

function setAuthPanelTab(tabId) {
  authPanelTabs.forEach((button) => {
    const isActive = button.dataset.authPanelTab === tabId;
    button.setAttribute("aria-selected", String(isActive));
  });
  authPanels.forEach((panel) => {
    panel.hidden = panel.dataset.authPanel !== tabId;
  });
}

function setResultTab(tabId) {
  const nameAvailable = !document.querySelector("#name-reading")?.hidden;
  const nextTabId = tabId === "name" && !nameAvailable ? "question" : tabId;
  resultTabs.forEach((button) => {
    const isActive = button.dataset.resultTab === nextTabId;
    button.setAttribute("aria-selected", String(isActive));
    button.classList.toggle("result-tabs__button--active", isActive);
    if (button.dataset.resultTab === "name") button.hidden = !nameAvailable;
  });
  resultPanels.forEach((panel) => {
    panel.hidden = panel.dataset.resultPanel !== nextTabId;
  });
}

resultTabs.forEach((button) => {
  button.addEventListener("click", () => setResultTab(button.dataset.resultTab ?? "question"));
});

function setConsultTab(tabId) {
  consultTabs.forEach((button) => {
    const isActive = button.dataset.consultTab === tabId;
    button.setAttribute("aria-selected", String(isActive));
  });
  consultPanels.forEach((panel) => {
    panel.hidden = panel.dataset.consultPanel !== tabId;
  });
}

consultTabs.forEach((button) => {
  button.addEventListener("click", () => setConsultTab(button.dataset.consultTab ?? "start"));
});

premiumInterestButton?.addEventListener("click", () => {
  track("premium-interest");
  window.location.hash = "consult";
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
renderSelectedPersonaSurfaces();
initAuthPanel();

authPanelTabs.forEach((button) => {
  button.addEventListener("click", () => {
    const nextTab = button.dataset.authPanelTab ?? "signup";
    setAuthPanelTab(nextTab);
    const focusTarget = nextTab === "login" ? loginEmailInput : signupDisplayNameInput ?? signupEmailInput;
    window.setTimeout(() => focusTarget?.focus(), 120);
  });
});

authJumpButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextTab = button.dataset.authJump === "login" ? "login" : "signup";
    setAuthPanelTab(nextTab);
    const target = nextTab === "login" ? emailLoginForm : emailSignupForm;
    if (!(target instanceof HTMLElement)) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    const focusTarget =
      nextTab === "login" ? loginEmailInput : signupDisplayNameInput ?? signupEmailInput;
    window.setTimeout(() => focusTarget?.focus(), 180);
  });
});

topicSelect.addEventListener("change", () => {
  updatePersonaRecommendation(topicSelect.value);
  if (trialTopic) trialTopic.value = topicSelect.value;
  pendingConsultationContext = null;
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
  selectedPersonaId = persona.id;
  renderSelectedPersonaSurfaces();
});

personaSwitcher?.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target.closest("[data-persona-tab]") : null;
  if (!(target instanceof HTMLButtonElement)) return;
  selectedPersonaId = target.dataset.personaTab ?? "miseon";
  if (trialPersona) trialPersona.value = selectedPersonaId;
  renderPersonaChoice();
  renderSelectedPersonaSurfaces();
});

modeCards?.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const button = target?.closest("[data-mode]");
  if (!button) return;
  const modeId = button.dataset.mode;
  const mode = CONSULTATION_MODES.find((item) => item.id === modeId);
  if (!mode) return;
  selectedModeId = mode.id;
  if (mode.id === "trial") preferredEntitlementId = "";
  renderModeChoice();
  updateTrialSessionState();
  track("consultation_mode_select");
  premiumInterestLabel.textContent = `${mode.name} 관심 등록`;
  premiumInterestNote.textContent =
    mode.id === "pro"
      ? "프로 상담은 깊은 분석과 리포트 구조로 먼저 준비하겠습니다."
      : `${mode.name} 상품 구성이 정리되면 알려드릴게요.`;
});

modeSwitcher?.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target.closest("[data-mode-tab]") : null;
  if (!(target instanceof HTMLButtonElement)) return;
  selectedModeId = target.dataset.modeTab ?? "trial";
  if (selectedModeId === "trial") preferredEntitlementId = "";
  renderModeChoice();
  updateTrialSessionState();
});

commercePanel?.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target.closest("[data-commerce-action]") : null;
  if (!(target instanceof HTMLButtonElement)) return;

  const action = target.dataset.commerceAction;
  const personaId = target.dataset.personaId ?? "";
  const productId = target.dataset.productId ?? "";
  const entitlementId = target.dataset.entitlementId ?? "";

  if (action === "resume-consult") {
    prepareConsultationEntry({ personaId, productId, entitlementId, focusMode: false });
    return;
  }

  if (action === "prepare-order") {
    prepareConsultationEntry({ personaId, productId, entitlementId, focusMode: true });
  }
});

trialPersona?.addEventListener("change", () => {
  selectedPersonaId = trialPersona.value || "miseon";
  renderSelectedPersonaSurfaces();
});

function prepareConsultationEntry({ personaId, productId, entitlementId = "", focusMode = false } = {}) {
  if (personaId) {
    const persona = getPersonaById(personaId);
    selectedPersonaId = persona.id;
    if (trialPersona) trialPersona.value = persona.id;
  }

  if (productId) {
    selectedModeId = modeIdForProduct(productId);
    renderModeChoice();
  }

  preferredEntitlementId = entitlementId;

  renderPersonaChoice();
  renderSelectedPersonaSurfaces();
  setConsultTab(focusMode ? "mode" : "start");
  openHubSection("consult");
}

function relationLabel(value) {
  return RELATIONSHIP_LABELS[value] ?? "인연";
}

function getPersonaById(personaId) {
  return CONSULTATION_PERSONAS.find((item) => item.id === personaId) ?? CONSULTATION_PERSONAS[0];
}

function topicLabel(value) {
  return TOPIC_OPTIONS.find((item) => item.value === value)?.label ?? "기본 흐름";
}

function toneLabel(value) {
  return TONE_OPTIONS.find((item) => item.value === value)?.label ?? "차분한 해석";
}

function formatShortDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function trialStageMeta(number) {
  const safeNumber = Math.min(Math.max(Number(number) || 1, 1), TRIAL_STAGES.length);
  return TRIAL_STAGES.find((stage) => stage.number === safeNumber) ?? TRIAL_STAGES[0];
}

function openHubSection(id) {
  const currentId = window.location.hash.slice(1);
  if (currentId !== id) {
    window.location.hash = id;
  } else {
    setActiveNav(id);
  }
  document.querySelector(`#${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function consultationTopicForRelationship(relationship) {
  return RELATIONSHIP_TOPIC_MAP[relationship] ?? "relationship";
}

function relationshipDisplayName(link) {
  return String(link?.counterpartDisplayName ?? "").trim() || "연결된 상대";
}

function buildRelationshipConsultConcern(link) {
  const name = relationshipDisplayName(link);
  const relation = relationLabel(link?.relationship);
  return `${name}님과의 ${relation} 관계 흐름을 더 구체적으로 상담하고 싶어요. 지금 가장 조심해야 할 점과 먼저 꺼낼 대화를 알고 싶어요.`;
}

function buildConsultationContextForRelationship(link) {
  return {
    source: "relationship_link",
    relationship: link?.relationship ?? "relationship",
    counterpartDisplayName: relationshipDisplayName(link),
  };
}

function buildTrialPromptSuggestions(session, stageNumber) {
  const topic = session?.topic ?? "relationship";
  const context = session?.metadata?.context ?? {};
  const counterpart = String(context?.counterpartDisplayName ?? "").trim();
  const partnerWord = counterpart ? `${counterpart}님` : "상대";

  if (stageNumber === 1) {
    if (topic === "business") {
      return [
        "지금 바로 시작하고 싶은 이유는 이거예요.",
        "가장 기대하는 결과와 가장 두려운 결과는 이거예요.",
        "준비는 어느 정도 됐고 뭐가 아직 부족한지 말해볼게요.",
      ];
    }
    if (context?.source === "relationship_link") {
      return [
        `${partnerWord}과 요즘 가장 자주 부딪히는 장면은 이거예요.`,
        `${partnerWord}의 마음보다 제가 더 불안한 지점은 이거예요.`,
        "이번에는 어떤 말을 먼저 꺼내야 할지가 제일 막막해요.",
      ];
    }
    return [
      "지금 가장 마음에 걸리는 장면부터 말해볼게요.",
      "제가 원하는 결과와 두려운 결과는 이거예요.",
      "상대보다 제 마음이 더 흔들리는 부분은 이거예요.",
    ];
  }

  if (stageNumber === 2) {
    if (topic === "business") {
      return [
        "이미 확인한 시장 반응은 여기까지예요.",
        "자금과 일정에서 현실적으로 가능한 범위는 이 정도예요.",
        "제가 추측만 하고 있는 부분은 이거예요.",
      ];
    }
    if (context?.source === "relationship_link") {
      return [
        `${partnerWord}이 실제로 한 말과 제가 추측하는 마음을 나눠보면 이래요.`,
        "바꿀 수 있는 조건과 제가 통제 못 하는 조건을 나눠보면 이래요.",
        "이미 확인한 사실과 아직 추측인 부분을 정리해볼게요.",
      ];
    }
    return [
      "이미 확인한 사실과 아직 추측인 부분을 나눠보면 이래요.",
      "제가 바꿀 수 있는 조건과 없는 조건은 이거예요.",
      "상대 행동 중 확실한 신호와 제가 해석한 부분을 나눠볼게요.",
    ];
  }

  if (topic === "business") {
    return [
      "당장 이번 주에 검증할 수 있는 작은 실험은 이거예요.",
      "지금 시작할지 더 준비할지 두 선택지를 비교하면 이래요.",
      "지금 제 상황에서 가장 안전한 다음 행동을 정리해볼게요.",
    ];
  }
  if (context?.source === "relationship_link") {
    return [
      `${partnerWord}과 먼저 꺼낼 한 문장은 이거예요.`,
      "지금 관계에서 멈춰야 할 행동과 먼저 해볼 행동을 나눠보면 이래요.",
      "이번 주 안에 해볼 수 있는 대화 한 가지를 정해볼게요.",
    ];
  }
  return [
    "지금 제게 가장 현실적인 선택지 두 가지를 비교해볼게요.",
    "이번 주 안에 해볼 수 있는 행동 한 가지를 정해볼게요.",
    "지금 멈춰야 할 것과 먼저 해볼 것을 나눠보면 이래요.",
  ];
}

function updateTrialGuidanceUi() {
  if (!trialGuidance || !trialGuidanceStage || !trialGuidanceTitle || !trialGuidancePrompt || !trialGuidanceChips) {
    return;
  }

  if (!activeConsultationSession || activeConsultationSession.status !== "active") {
    trialGuidance.hidden = true;
    trialGuidanceChips.innerHTML = "";
    return;
  }

  const currentStageNumber = Math.min(
    Number(activeConsultationSession.current_stage ?? Number(activeConsultationSession.used_turns ?? 0) + 1) || 1,
    TRIAL_STAGES.length,
  );
  const stage = trialStageMeta(currentStageNumber);
  const suggestions = buildTrialPromptSuggestions(activeConsultationSession, currentStageNumber);
  const prompt =
    activeConsultationGuidance?.focusPrompt ??
    stage.description ??
    "지금 단계에서 가장 중요한 사실과 마음을 짧게 정리해 주세요.";

  trialGuidance.hidden = false;
  trialGuidanceStage.textContent = `${stage.number}단계`;
  trialGuidanceTitle.textContent = stage.label;
  trialGuidancePrompt.textContent = prompt;
  trialGuidanceChips.innerHTML = suggestions
    .map(
      (suggestion) =>
        `<button type="button" data-trial-suggestion="${escapeHtml(suggestion)}">${escapeHtml(suggestion)}</button>`,
    )
    .join("");

  if (trialMessage && suggestions[0]) {
    trialMessage.placeholder = suggestions[0];
  }
}

function formatProfileDate(profile) {
  if (!profile?.birthDate) return "입력 전";
  const date = new Date(profile.birthDate);
  const dateLabel = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
  const minute = String(Number(profile.minute ?? 0)).padStart(2, "0");
  return `${dateLabel} ${String(profile.hour).padStart(2, "0")}:${minute}`;
}

function formatDateDraft(value) {
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

function normalizeDateText(value) {
  const compact = String(value ?? "").trim().replace(/[./\s]+/g, "-");
  if (/^\d{4}-\d{2}-\d{2}$/.test(compact)) return compact;
  return formatDateDraft(compact);
}

function bindTypedDateInput(input) {
  if (!(input instanceof HTMLInputElement)) return;
  input.addEventListener("input", () => {
    const nextValue = formatDateDraft(input.value);
    if (input.value !== nextValue) input.value = nextValue;
  });
  input.addEventListener("blur", () => {
    input.value = normalizeDateText(input.value);
  });
}

function buildProfileSummaryItems(profile) {
  if (!profile) return [];
  return [
    { label: "생년월일시", value: formatProfileDate(profile) },
    { label: "주제", value: topicLabel(profile.topic) },
    { label: "톤", value: toneLabel(profile.tone) },
    { label: "이름", value: profile.name?.trim() || "입력 안 함" },
    { label: "고민", value: profile.concern?.trim() || "입력 안 함" },
  ];
}

function renderProfileSummaryList(target, profile) {
  if (!target) return;
  const items = buildProfileSummaryItems(profile);
  target.hidden = !items.length;
  target.innerHTML = items
    .map(
      (item) => `
        <div>
          <dt>${escapeHtml(item.label)}</dt>
          <dd>${escapeHtml(item.value)}</dd>
        </div>
      `,
    )
    .join("");
}

function renderStoredProfilePanels(profile = loadProfile()) {
  const hasProfile = Boolean(profile);
  if (profileSummaryTitle) {
    profileSummaryTitle.textContent = hasProfile ? "저장된 사주 정보를 관리할 수 있어요" : "아직 저장된 사주 정보가 없어요";
  }
  if (profileSummaryCopy) {
    profileSummaryCopy.textContent = hasProfile
      ? "수정은 팝업에서 바로 하고, 로그인과 동의 상태는 마이 페이지에서 이어서 관리할 수 있어요."
      : "생년월일시와 지금 궁금한 주제를 입력하면 오늘의 운세와 상담 연결 질문이 함께 열립니다.";
  }
  renderProfileSummaryList(profileSummaryList, profile);
  renderProfileSummaryList(myProfileSummaryList, profile);
  if (myProfileEmpty) myProfileEmpty.hidden = hasProfile;
  if (myProfileTitle) {
    myProfileTitle.textContent = hasProfile ? "저장된 사주 정보를 요약해서 확인해요" : "입력, 수정, 삭제를 여기서 관리해요";
  }
  if (myProfileNote) {
    myProfileNote.textContent = hasProfile
      ? "수정은 팝업에서 하고, 이 화면에서는 로그인 · 인연 · 상담 상태를 이어서 관리합니다."
      : "사주 계산과 수정은 팝업에서 하고, 로그인 · 인연 · 상담 상태는 이 화면에서 이어서 관리합니다.";
  }
  if (myProfileActions) {
    myProfileActions.innerHTML = hasProfile
      ? `
        <button type="button" class="auth-button auth-button--ghost" data-profile-modal-open="manage">정보 열기</button>
        <button type="button" class="auth-button auth-button--ghost" data-profile-modal-open="edit">기존 정보 수정</button>
      `
      : `
        <button type="button" class="auth-button auth-button--ghost" data-profile-modal-open="create">새 정보 입력</button>
      `;
    bindProfileActionTriggers(myProfileActions);
  }
}

function syncFormError(message = "") {
  if (!errorMessage) return;
  errorMessage.hidden = !message;
  errorMessage.textContent = message;
}

function openProfileModal(mode = "create") {
  if (!profileModal) return;
  profileModalMode = mode;
  const profile = loadProfile();
  const hasProfile = Boolean(profile);
  if (profileModalTitle) {
    profileModalTitle.textContent =
      mode === "edit" || (mode === "manage" && hasProfile) ? "사주 정보 수정" : "사주 정보 입력";
  }
  if (profileModalCopy) {
    profileModalCopy.textContent =
      mode === "edit" || (mode === "manage" && hasProfile)
        ? "저장된 정보를 바꾸면 오늘의 운세와 사주 결과도 바로 함께 갱신됩니다."
        : "입력한 정보는 이 기기에서만 저장되고 서버로 전송되지 않습니다.";
  }
  if (hasProfile && (mode === "edit" || mode === "manage")) {
    applyProfileToForm(profile);
  }
  if (mode === "create") {
    form.reset();
    calendarType.value = "solar";
    calendarType.dispatchEvent(new Event("change"));
    topicSelect.value = TOPIC_OPTIONS[0]?.value ?? "relationship";
    toneSelect.value = TONE_OPTIONS[0]?.value ?? "balanced";
    hourSelect.value = "12";
    document.querySelector("#birth-minute").value = "0";
  }
  syncFormError("");
  if (typeof profileModal.showModal === "function") profileModal.showModal();
  document.querySelector("#birth-date")?.focus();
}

function closeProfileModal() {
  profileModal?.close();
}

function bindProfileActionTriggers(scope = document) {
  scope.querySelectorAll("[data-profile-modal-open]").forEach((button) => {
    if (button.dataset.profileBound === "true") return;
    button.dataset.profileBound = "true";
    button.addEventListener("click", () => {
      openProfileModal(button.dataset.profileModalOpen ?? "create");
    });
  });

  scope.querySelectorAll("[data-profile-clear]").forEach((button) => {
    if (button.dataset.profileBound === "true") return;
    button.dataset.profileBound = "true";
    button.addEventListener("click", () => clearStoredProfile());
  });
}

bindProfileActionTriggers();
bindTypedDateInput(birthDateInput);
bindTypedDateInput(partnerDateInput);

profileModalClose?.addEventListener("click", closeProfileModal);
profileModal?.addEventListener("click", (event) => {
  const rect = profileModal.getBoundingClientRect();
  const withinDialog =
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom;
  if (!withinDialog) closeProfileModal();
});

function renderRelationshipLinks(links) {
  if (!relationshipLinks) return;
  if (!links.length) {
    relationshipLinks.innerHTML = "<li class=\"relationship-links__empty\">아직 연결된 인연이 없습니다.</li>";
    return;
  }

  relationshipLinks.innerHTML = links
    .map((link) => {
      const isEditing = activeRelationshipLabelEditorId === link.id;
      const displayName = relationshipDisplayName(link);
      const editableDisplayName = String(link.editableDisplayName ?? "").trim();
      const defaultName = String(link.counterpartDefaultName ?? "").trim() || displayName;
      return `
        <li class="relationship-link-card">
          <div class="relationship-link-card__head">
            <div>
              <span class="relationship-link-card__eyebrow">${escapeHtml(relationLabel(link.relationship))}</span>
              <strong>${escapeHtml(displayName)}</strong>
            </div>
            <span>${escapeHtml(formatShortDate(link.acceptedAt ?? link.createdAt))} 연결</span>
          </div>
          <p>연결된 관계에서 바로 궁합을 이어 보거나, 이 관계를 주제로 상담을 시작할 수 있어요.</p>
          <div class="relationship-link-card__actions">
            <button type="button" class="auth-button auth-button--ghost" data-relationship-action="compatibility" data-link-id="${escapeHtml(link.id)}">
              이 관계로 궁합 보기
            </button>
            <button type="button" class="auth-button" data-relationship-action="consult" data-link-id="${escapeHtml(link.id)}">
              이 관계로 상담 이어가기
            </button>
            <button type="button" class="auth-button auth-button--ghost" data-relationship-action="${isEditing ? "cancel-label" : "toggle-label"}" data-link-id="${escapeHtml(link.id)}">
              ${isEditing ? "닫기" : editableDisplayName ? "이름 수정" : "이름 정하기"}
            </button>
          </div>
          ${
            isEditing
              ? `
            <div class="relationship-link-card__label-editor">
              <label for="relationship-label-${escapeHtml(link.id)}">내 화면에서 부를 이름</label>
              <input
                id="relationship-label-${escapeHtml(link.id)}"
                type="text"
                maxlength="40"
                value="${escapeHtml(editableDisplayName || defaultName)}"
                data-relationship-label-input="${escapeHtml(link.id)}"
                placeholder="${escapeHtml(defaultName)}"
              />
              <div class="relationship-link-card__label-actions">
                <button type="button" class="auth-button auth-button--ghost" data-relationship-action="cancel-label" data-link-id="${escapeHtml(link.id)}">
                  취소
                </button>
                <button type="button" class="auth-button" data-relationship-action="save-label" data-link-id="${escapeHtml(link.id)}">
                  저장
                </button>
              </div>
            </div>
          `
              : ""
          }
        </li>
      `;
    })
    .join("");
}

function renderRelationshipPanelState(session, links = [], options = {}) {
  const hasSession = Boolean(session);
  const count = links.length;
  const hasPendingInvite = Boolean(options.pendingInvite);

  if (relationshipPanelTitle) {
    relationshipPanelTitle.textContent = !hasSession
      ? "로그인 후 초대 링크를 만들 수 있어요"
      : count > 0
        ? `연결된 인연 ${count}건을 관리해요`
        : "초대 링크로 서로의 관계를 묶기";
  }

  if (relationshipPanelCopy) {
    relationshipPanelCopy.textContent = !hasSession
      ? "상대와 계정을 묶는 초대 링크와 연결 목록은 로그인 후 관리됩니다."
      : count > 0
        ? "연결된 관계 카드에서 바로 궁합 흐름이나 AI 상담으로 이어질 수 있고, 필요하면 새 초대 링크를 더 만들 수 있어요."
        : "상대가 링크로 들어와 로그인하면 두 계정이 같은 관계로 연결됩니다. 생년월일시는 링크에 담지 않습니다.";
  }

  if (relationshipPanelSummary) {
    if (!hasSession) {
      relationshipPanelSummary.hidden = !hasPendingInvite;
      relationshipPanelSummary.innerHTML = hasPendingInvite
        ? `<span>받은 초대</span><strong>로그인 후 수락 가능</strong>`
        : "";
    } else {
      relationshipPanelSummary.hidden = false;
      relationshipPanelSummary.innerHTML = `
        <span>연결 상태</span>
        <strong>${count > 0 ? `${count}건 연결됨` : "아직 연결 전"}</strong>
        <em>${hasPendingInvite ? "받은 초대 1건 있음" : count > 0 ? "카드에서 궁합/상담 바로가기 가능" : "새 링크 생성 가능"}</em>
      `;
    }
  }
}

function productLookupMap(products = []) {
  return new Map(products.map((product) => [product.id, product]));
}

function personaLookupMap(personas = []) {
  return new Map(personas.map((persona) => [persona.id, persona]));
}

function modeIdForProduct(productId) {
  return String(productId ?? "").startsWith("pro_") ? "pro" : "basic";
}

function productIdForMode(modeId) {
  if (modeId === "pro") return "pro_20_turns";
  if (modeId === "basic") return "basic_10_turns";
  return "trial_3_turns";
}

function findActiveEntitlement(modeId, entitlementId = "") {
  const entitlements = activeCommerceOverview?.entitlements ?? [];
  const products = productLookupMap(activeCommerceOverview?.products ?? []);
  const now = Date.now();

  return (
    entitlements.find((item) => {
      const matchesExplicit = entitlementId ? item.id === entitlementId : true;
      const product = products.get(item.product_id);
      const matchesMode = modeId === "trial" ? item.product_id === "trial_3_turns" : product?.mode === modeId;
      const remainingTurns = Math.max(Number(item.total_turns ?? 0) - Number(item.used_turns ?? 0), 0);
      const notExpired = !item.expires_at || new Date(item.expires_at).getTime() > now;
      return matchesExplicit && matchesMode && item.status === "active" && remainingTurns > 0 && notExpired;
    }) ?? null
  );
}

function orderStatusLabel(status) {
  return (
    {
      pending: "결제 대기",
      paid: "결제 완료",
      failed: "결제 실패",
      canceled: "주문 취소",
      refunded: "환불 완료",
    }[String(status ?? "").toLowerCase()] ?? "상태 확인 필요"
  );
}

function entitlementStatusLabel(status) {
  return (
    {
      active: "사용 가능",
      expired: "기간 만료",
      consumed: "모두 사용",
      revoked: "회수됨",
    }[String(status ?? "").toLowerCase()] ?? "상태 확인 필요"
  );
}

function renderCommerceOverview(session, overview) {
  activeCommerceOverview = overview ?? null;
  if (!commercePanel || !entitlementList || !orderHistoryList) return;

  if (!session) {
    commercePanel.hidden = true;
    entitlementList.innerHTML = "";
    orderHistoryList.innerHTML = "";
    return;
  }

  commercePanel.hidden = false;
  const products = productLookupMap(overview?.products ?? []);
  const personas = personaLookupMap(overview?.personas ?? []);
  const entitlements = overview?.entitlements ?? [];
  const orders = overview?.orders ?? [];

  if (commerceNote) {
    commerceNote.textContent =
      entitlements.length || orders.length
        ? "무료 체험 이후 결제한 상담권과 최근 주문 상태를 이곳에서 이어서 확인할 수 있어요."
        : "아직 발급된 상담 이용권이나 최근 주문이 없습니다. 무료 3턴 이후 여기로 이어집니다.";
  }

  entitlementList.innerHTML = entitlements.length
    ? entitlements
        .map((item) => {
          const product = products.get(item.product_id);
          const remainingTurns = Math.max(Number(item.total_turns ?? 0) - Number(item.used_turns ?? 0), 0);
          return `
            <article class="commerce-entry">
              <div class="commerce-entry__head">
                <div>
                  <span>${escapeHtml(entitlementStatusLabel(item.status))}</span>
                  <strong>${escapeHtml(product?.name ?? "상담 이용권")}</strong>
                </div>
                <em>${remainingTurns}턴 남음</em>
              </div>
              <p>총 ${Number(item.total_turns ?? 0)}턴 중 ${Number(item.used_turns ?? 0)}턴 사용했어요.</p>
              <small>${item.expires_at ? `${escapeHtml(formatDateTime(item.expires_at))}까지 사용 가능` : "만료 정보 없음"}</small>
            </article>
          `;
        })
        .join("")
    : '<p class="commerce-list__empty">아직 발급된 상담 이용권이 없습니다.</p>';

  orderHistoryList.innerHTML = orders.length
    ? orders
        .map((item) => {
          const product = products.get(item.product_id);
          const metadata = typeof item.metadata === "object" && item.metadata ? item.metadata : {};
          const personaId = String(metadata.persona_id ?? "").trim();
          const persona = personas.get(personaId);
          const personaImage = PERSONA_IMAGE_MAP[personaId] ?? "";
          const paidAt = item.paid_at ? formatDateTime(item.paid_at) : formatDateTime(item.created_at);
          return `
            <article class="commerce-entry">
              <div class="commerce-entry__head">
                <div>
                  <span>${escapeHtml(orderStatusLabel(item.status))}</span>
                  <strong>${escapeHtml(product?.name ?? "상담 주문")}</strong>
                </div>
                <em>${Number(item.amount_krw ?? 0).toLocaleString("ko-KR")}원</em>
              </div>
              ${
                persona
                  ? `
                    <div class="commerce-entry__persona">
                      <span class="commerce-entry__avatar" aria-hidden="true">
                        <img src="${escapeHtml(personaImage)}" alt="" loading="lazy" />
                      </span>
                      <div>
                        <strong>${escapeHtml(persona.display_name)}</strong>
                        <span>${escapeHtml(persona.role)}</span>
                      </div>
                    </div>
                  `
                  : ""
              }
              <p>${escapeHtml(paidAt)} · 주문번호 ${escapeHtml(String(item.provider_order_id ?? item.id ?? "").slice(0, 18))}</p>
            </article>
          `;
        })
        .join("")
    : '<p class="commerce-list__empty">아직 최근 주문 내역이 없습니다.</p>';
}

function renderCommerceOverviewV2(session, overview) {
  activeCommerceOverview = overview ?? null;
  if (!commercePanel || !entitlementList || !orderHistoryList) return;

  if (!session) {
    commercePanel.hidden = true;
    entitlementList.innerHTML = "";
    orderHistoryList.innerHTML = "";
    return;
  }

  commercePanel.hidden = false;
  const products = productLookupMap(overview?.products ?? []);
  const personas = personaLookupMap(overview?.personas ?? []);
  const entitlements = overview?.entitlements ?? [];
  const orders = overview?.orders ?? [];

  if (commerceNote) {
    commerceNote.textContent =
      entitlements.length || orders.length
        ? "무료 체험 이후 결제한 상담권과 최근 주문 상태를 여기에서 바로 확인하고 이어갈 수 있어요."
        : "아직 발급된 상담 이용권이나 최근 주문이 없습니다. 무료 3턴 이후 여기로 이어집니다.";
  }

  entitlementList.innerHTML = entitlements.length
    ? entitlements
        .map((item) => {
          const product = products.get(item.product_id);
          const linkedOrder = orders.find((order) => order.id === item.order_id);
          const linkedMetadata =
            typeof linkedOrder?.metadata === "object" && linkedOrder?.metadata ? linkedOrder.metadata : {};
          const personaId = String(linkedMetadata.persona_id ?? "").trim();
          const persona = personas.get(personaId);
          const personaImage = PERSONA_IMAGE_MAP[personaId] ?? "";
          const remainingTurns = Math.max(Number(item.total_turns ?? 0) - Number(item.used_turns ?? 0), 0);

          return `
            <article class="commerce-entry">
              <div class="commerce-entry__head">
                <div>
                  <span>${escapeHtml(entitlementStatusLabel(item.status))}</span>
                  <strong>${escapeHtml(product?.name ?? "상담 이용권")}</strong>
                </div>
                <em>${remainingTurns}턴 남음</em>
              </div>
              ${
                persona
                  ? `
                    <div class="commerce-entry__persona">
                      <span class="commerce-entry__avatar" aria-hidden="true">
                        <img src="${escapeHtml(personaImage)}" alt="" loading="lazy" />
                      </span>
                      <div>
                        <strong>${escapeHtml(persona.display_name)}</strong>
                        <span>${escapeHtml(persona.role)}</span>
                      </div>
                    </div>
                  `
                  : ""
              }
              <p>총 ${Number(item.total_turns ?? 0)}턴 중 ${Number(item.used_turns ?? 0)}턴을 사용했어요.</p>
              <small>${item.expires_at ? `${escapeHtml(formatDateTime(item.expires_at))}까지 사용 가능` : "만료 정보 없음"}</small>
              <div class="commerce-entry__actions">
                <button
                  type="button"
                  class="auth-button"
                  data-commerce-action="resume-consult"
                  data-product-id="${escapeHtml(item.product_id ?? "")}"
                  data-persona-id="${escapeHtml(personaId)}"
                  data-entitlement-id="${escapeHtml(item.id ?? "")}"
                >
                  상담 이어가기
                </button>
              </div>
            </article>
          `;
        })
        .join("")
    : '<p class="commerce-list__empty">아직 발급된 상담 이용권이 없습니다.</p>';

  orderHistoryList.innerHTML = orders.length
    ? orders
        .map((item) => {
          const product = products.get(item.product_id);
          const metadata = typeof item.metadata === "object" && item.metadata ? item.metadata : {};
          const personaId = String(metadata.persona_id ?? "").trim();
          const persona = personas.get(personaId);
          const personaImage = PERSONA_IMAGE_MAP[personaId] ?? "";
          const paidAt = item.paid_at ? formatDateTime(item.paid_at) : formatDateTime(item.created_at);
          const isPaid = String(item.status ?? "").toLowerCase() === "paid";
          const linkedEntitlement = entitlements.find((entitlement) => entitlement.order_id === item.id);

          return `
            <article class="commerce-entry">
              <div class="commerce-entry__head">
                <div>
                  <span>${escapeHtml(orderStatusLabel(item.status))}</span>
                  <strong>${escapeHtml(product?.name ?? "상담 주문")}</strong>
                </div>
                <em>${Number(item.amount_krw ?? 0).toLocaleString("ko-KR")}원</em>
              </div>
              ${
                persona
                  ? `
                    <div class="commerce-entry__persona">
                      <span class="commerce-entry__avatar" aria-hidden="true">
                        <img src="${escapeHtml(personaImage)}" alt="" loading="lazy" />
                      </span>
                      <div>
                        <strong>${escapeHtml(persona.display_name)}</strong>
                        <span>${escapeHtml(persona.role)}</span>
                      </div>
                    </div>
                  `
                  : ""
              }
              <p>${escapeHtml(paidAt)} · 주문번호 ${escapeHtml(String(item.provider_order_id ?? item.id ?? "").slice(0, 18))}</p>
              <div class="commerce-entry__actions">
                <button
                  type="button"
                  class="auth-button ${isPaid ? "" : "auth-button--ghost"}"
                  data-commerce-action="${isPaid ? "resume-consult" : "prepare-order"}"
                  data-product-id="${escapeHtml(item.product_id ?? "")}"
                  data-persona-id="${escapeHtml(personaId)}"
                  data-entitlement-id="${escapeHtml(linkedEntitlement?.id ?? "")}"
                >
                  ${isPaid ? "상담 이어가기" : "같은 상담권 다시 준비"}
                </button>
              </div>
            </article>
          `;
        })
        .join("")
    : '<p class="commerce-list__empty">아직 최근 주문 내역이 없습니다.</p>';
}

async function refreshCommercePanel(session) {
  if (!session) {
    renderCommerceOverviewV2(null, null);
    return;
  }

  const { data, error } = await getCommerceOverview(session);
  if (error) {
    renderCommerceOverviewV2(session, { products: [], personas: [], orders: [], entitlements: [] });
    if (commerceNote) commerceNote.textContent = "이용권과 주문 내역을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.";
    return;
  }

  renderCommerceOverviewV2(session, data);
}

function updateConsultationStartButton() {
  if (!trialSessionStart) return;
  const mode = CONSULTATION_MODES.find((item) => item.id === selectedModeId) ?? CONSULTATION_MODES[0];
  const entitlement = selectedModeId === "trial" ? null : findActiveEntitlement(selectedModeId, preferredEntitlementId);

  if (selectedModeId === "trial") {
    trialSessionStart.textContent = "이 고민으로 무료 상담 시작";
    return;
  }

  trialSessionStart.textContent = entitlement
    ? `${mode.name} 시작하기`
    : `${mode.name} 이용권이 필요해요`;
}

function updateTrialSessionState() {
  if (!trialSessionStart) return;
  trialSessionStart.disabled = false;
  updateConsultationStartButton();
  if (!activeSession && trialSessionNote) {
    trialSessionNote.textContent = "마이에서 로그인하면 무료 상담 체험을 준비할 수 있습니다.";
  } else if (activeSession && !hasRequiredConsents && trialSessionNote) {
    trialSessionNote.textContent = "마이에서 필수 동의를 저장한 뒤 무료 상담 체험을 시작할 수 있습니다.";
  } else if (activeSession && hasRequiredConsents && selectedModeId !== "trial" && trialSessionNote) {
    const entitlement = findActiveEntitlement(selectedModeId, preferredEntitlementId);
    trialSessionNote.textContent = entitlement
      ? "선택한 상담권으로 바로 이어서 상담을 시작할 수 있습니다."
      : "이 모드는 활성 상담권이 있어야 시작할 수 있습니다. 마이 페이지에서 이용권을 확인해 주세요.";
  }
}

function focusMyPageForConsultation() {
  if (window.location.hash !== "#my-page") {
    window.location.hash = "my-page";
  }
  document.querySelector("#my-page")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderTrialChatMessages() {
  if (!trialChatLog) return;
  if (!activeConsultationMessages.length) {
    trialChatLog.innerHTML = "<p class=\"auth-panel__note\">상담을 시작하면 대화가 여기 쌓입니다.</p>";
    return;
  }

  trialChatLog.innerHTML = activeConsultationMessages
    .map(
      (message) => `
        <article class="trial-chat__message" data-role="${escapeHtml(message.role)}">
          <span>${message.role === "assistant" ? "AI 상담" : "나"}</span>
          <div class="trial-chat__message-body">
            ${renderMessageParagraphs(message.content)}
          </div>
        </article>
      `,
    )
    .join("");
  trialChatLog.scrollTop = trialChatLog.scrollHeight;
}

function replaceConsultationMessages(messages) {
  activeConsultationMessages = (messages ?? []).map((message) => ({
    role: message.role === "assistant" ? "assistant" : "user",
    content: typeof message.content === "string" ? message.content : "",
  }));
  renderTrialChatMessages();
}

function normalizeConsultationGuidance(summaryRecord, fallbackStage) {
  if (!summaryRecord || typeof summaryRecord !== "object") return null;
  const options = Array.isArray(summaryRecord.options) ? summaryRecord.options.filter((item) => typeof item === "string") : [];
  const actionPlan = Array.isArray(summaryRecord.action_plan)
    ? summaryRecord.action_plan.filter((item) => typeof item === "string")
    : [];
  return {
    stage: Number(fallbackStage ?? 1),
    stageLabel: trialStageMeta(Number(fallbackStage ?? 1)).label,
    nextStageLabel: Number(fallbackStage ?? 1) >= TRIAL_STAGES.length ? "" : trialStageMeta(Number(fallbackStage ?? 1) + 1).label,
    focusPrompt:
      actionPlan[0] ??
      options[0] ??
      (typeof summaryRecord.summary === "string" ? summaryRecord.summary : "") ??
      "",
    summary: typeof summaryRecord.summary === "string" ? summaryRecord.summary : "",
    options,
    actionPlan,
  };
}

async function hydrateConsultationSnapshot(sessionRecord) {
  const sessionId = sessionRecord?.id;
  if (!activeSession || !sessionId) {
    replaceConsultationMessages([]);
    activeConsultationGuidance = null;
    return { loaded: false, errors: [] };
  }

  const [messagesResult, summaryResult] = await Promise.all([
    getConsultationMessages(activeSession, sessionId),
    getConsultationSummary(activeSession, sessionId),
  ]);

  if (messagesResult.error) {
    replaceConsultationMessages([]);
  } else {
    replaceConsultationMessages(messagesResult.messages);
  }

  activeConsultationGuidance = summaryResult.error
    ? null
    : normalizeConsultationGuidance(
        summaryResult.summary,
        Number(sessionRecord.current_stage ?? Number(sessionRecord.used_turns ?? 0) + 1),
      );

  return {
    loaded: !messagesResult.error && !summaryResult.error,
    errors: [messagesResult.error, summaryResult.error].filter(Boolean),
  };
}

function renderSelectedPersonaSurfaces() {
  const persona = getPersonaById(trialPersona?.value ?? selectedPersonaId ?? "miseon");
  selectedPersonaId = persona.id;

  if (trialChatPersonaImage) {
    trialChatPersonaImage.src = PERSONA_IMAGE_MAP[persona.id] ?? PERSONA_IMAGE_MAP.miseon;
  }
  if (trialChatPersonaName) {
    trialChatPersonaName.textContent = `${persona.name}와 대화를 이어가고 있어요`;
  }
  if (premiumInterestLabel) {
    premiumInterestLabel.textContent = `${persona.name} 상담으로 이어가기`;
  }
  if (premiumInterestNote) {
    premiumInterestNote.textContent = `${persona.name} 스타일로 현재 고민을 더 깊게 정리할 수 있게 준비합니다.`;
  }
}

function updateTrialChatUi() {
  if (!trialChat || !trialMessageSend || !trialChatStatus || !trialChatRemaining) return;

  const hasSession = Boolean(activeConsultationSession);
  renderSelectedPersonaSurfaces();
  trialChat.hidden = !hasSession;
  if (trialNextStep) trialNextStep.hidden = true;
  if (trialStageStrip) trialStageStrip.hidden = !hasSession;
  if (!hasSession) {
    trialMessageSend.disabled = true;
    if (trialStageStrip) trialStageStrip.innerHTML = "";
    updateTrialGuidanceUi();
    return;
  }

  const turnLimit = Number(activeConsultationSession.turn_limit ?? 0);
  const usedTurns = Number(activeConsultationSession.used_turns ?? 0);
  const remainingTurns = Math.max(turnLimit - usedTurns, 0);
  const isActive = activeConsultationSession.status === "active" && remainingTurns > 0;
  const currentStageNumber = isActive ? Math.min(usedTurns + 1, TRIAL_STAGES.length) : TRIAL_STAGES.length;
  const currentStage = trialStageMeta(currentStageNumber);
  const persona = getPersonaById(trialPersona?.value ?? selectedPersonaId ?? "miseon");

  if (trialStageStrip) {
    trialStageStrip.innerHTML = TRIAL_STAGES.map((stage) => {
      const state = usedTurns >= stage.number ? "done" : stage.number === currentStageNumber ? "active" : "todo";
      return `
        <div class="trial-stage-chip trial-stage-chip--${state}">
          <span>${stage.number}단계</span>
          <strong>${escapeHtml(stage.label)}</strong>
        </div>
      `;
    }).join("");
  }

  trialChatStatus.textContent =
    activeConsultationSession.status === "completed"
      ? "3단계까지 고민 정리를 마쳤습니다"
      : `지금은 ${currentStage.label} 단계예요`;
  trialChatRemaining.textContent = activeConsultationSession.status === "completed"
    ? "무료 3턴 완료"
    : `남은 턴 ${remainingTurns}회`;
  trialMessageSend.disabled = !isActive;
  if (trialMessage) trialMessage.disabled = !isActive;
  if (trialNextStep && !isActive) {
    trialNextStep.hidden = false;
    trialNextStep.innerHTML = `
      <div class="trial-next-step__persona">
        <span class="trial-next-step__persona-avatar" aria-hidden="true">
          <img src="${escapeHtml(PERSONA_IMAGE_MAP[persona.id] ?? "")}" alt="" loading="lazy" />
        </span>
        <div>
          <span>${escapeHtml(persona.name)}</span>
          <strong>${escapeHtml(persona.role)}</strong>
        </div>
      </div>
      <strong>무료 체험이 끝났습니다</strong>
      <p>다음 단계는 기본 상담권과 프로 상담으로 이어집니다. 기본 상담은 10턴 대화와 짧은 요약, 프로 상담은 더 긴 문맥과 선택지별 행동 계획을 제공하는 구조로 준비합니다.</p>
      <div class="trial-next-step__chips">
        <span>기본 상담 10턴</span>
        <span>프로 상담 20턴 + 상세 리포트</span>
      </div>
      <div class="trial-next-step__actions">
        <button type="button" data-order-product="basic_10_turns">기본 상담권 준비</button>
        <button type="button" data-order-product="pro_20_turns">프로 상담 준비</button>
      </div>
      <p id="paid-order-note" class="trial-next-step__note" role="status"></p>
    `;
  }
  updateTrialGuidanceUi();
  renderTrialChatMessages();
}

function updateTrialChatUiV2() {
  if (!trialChat || !trialMessageSend || !trialChatStatus || !trialChatRemaining) return;

  const hasSession = Boolean(activeConsultationSession);
  renderSelectedPersonaSurfaces();
  trialChat.hidden = !hasSession;
  if (trialNextStep) trialNextStep.hidden = true;
  if (trialStageStrip) trialStageStrip.hidden = !hasSession;
  if (!hasSession) {
    trialMessageSend.disabled = true;
    if (trialMessage) trialMessage.disabled = true;
    if (trialStageStrip) trialStageStrip.innerHTML = "";
    updateTrialGuidanceUi();
    return;
  }

  const turnLimit = Number(activeConsultationSession.turn_limit ?? 0);
  const usedTurns = Number(activeConsultationSession.used_turns ?? 0);
  const remainingTurns = Math.max(turnLimit - usedTurns, 0);
  const isActive = activeConsultationSession.status === "active" && remainingTurns > 0;
  const sessionMode = String(activeConsultationSession.mode ?? selectedModeId ?? "trial");
  const currentStageNumber = isActive ? Math.min(usedTurns + 1, TRIAL_STAGES.length) : TRIAL_STAGES.length;
  const currentStage = trialStageMeta(currentStageNumber);
  const persona = getPersonaById(trialPersona?.value ?? selectedPersonaId ?? "miseon");

  if (trialStageStrip) {
    trialStageStrip.innerHTML = TRIAL_STAGES.map((stage) => {
      const state = usedTurns >= stage.number ? "done" : stage.number === currentStageNumber ? "active" : "todo";
      return `
        <div class="trial-stage-chip trial-stage-chip--${state}">
          <span>${stage.number}단계</span>
          <strong>${escapeHtml(stage.label)}</strong>
        </div>
      `;
    }).join("");
  }

  trialChatStatus.textContent =
    activeConsultationSession.status === "completed"
      ? sessionMode === "trial"
        ? "무료 3턴 정리를 마쳤어요"
        : "이번 상담권 대화를 모두 사용했어요"
      : `지금은 ${currentStage.label} 단계예요`;
  trialChatRemaining.textContent = activeConsultationSession.status === "completed"
    ? sessionMode === "trial"
      ? "무료 3턴 완료"
      : "이용권 사용 완료"
    : `${remainingTurns}턴 남음`;
  trialMessageSend.disabled = !isActive;
  if (trialMessage) trialMessage.disabled = !isActive;

  if (trialNextStep && !isActive) {
    const completionTitle = sessionMode === "trial" ? "무료 체험이 끝났어요" : "이번 상담권이 마무리됐어요";
    const completionBody = sessionMode === "trial"
      ? "다음 단계는 기본 상담권과 프로 상담으로 이어집니다. 기본 상담은 10턴 대화와 짧은 요약, 프로 상담은 긴 문맥과 선택지 비교까지 준비합니다."
      : "같은 흐름으로 다시 이어가려면 새 상담권을 준비하면 됩니다. 기본 상담은 빠르게 이어가고, 프로 상담은 더 긴 맥락과 정리까지 포함합니다.";

    trialNextStep.hidden = false;
    trialNextStep.innerHTML = `
      <div class="trial-next-step__persona">
        <span class="trial-next-step__persona-avatar" aria-hidden="true">
          <img src="${escapeHtml(PERSONA_IMAGE_MAP[persona.id] ?? "")}" alt="" loading="lazy" />
        </span>
        <div>
          <span>${escapeHtml(persona.name)}</span>
          <strong>${escapeHtml(persona.role)}</strong>
        </div>
      </div>
      <strong>${completionTitle}</strong>
      <p>${completionBody}</p>
      <div class="trial-next-step__chips">
        <span>기본 상담 10턴</span>
        <span>프로 상담 20턴 + 상세 리포트</span>
      </div>
      <div class="trial-next-step__actions">
        <button type="button" data-order-product="basic_10_turns">기본 상담권 준비</button>
        <button type="button" data-order-product="pro_20_turns">프로 상담 준비</button>
      </div>
      <p id="paid-order-note" class="trial-next-step__note" role="status"></p>
    `;
  }

  updateTrialGuidanceUi();
  renderTrialChatMessages();
}

function setActiveConsultationSession(session, reused = false) {
  activeConsultationSession = session
    ? {
        ...session,
        metadata: session.metadata ?? {},
        turn_limit: Number(session.turn_limit ?? 0),
        used_turns: Number(session.used_turns ?? 0),
        current_stage: Number(session.current_stage ?? session.used_turns ?? 0) + 1,
      }
    : null;
  activeConsultationGuidance = null;
  activeConsultationMessages = reused ? activeConsultationMessages : [];
  updateTrialChatUiV2();
}

function appendTrialMessage(role, content) {
  activeConsultationMessages = [...activeConsultationMessages, { role, content }];
  renderTrialChatMessages();
}

async function submitTrialMessage(message) {
  if (!activeSession || !activeConsultationSession?.id || !message) return false;

  trialMessageSend.disabled = true;
  if (trialMessage) trialMessage.disabled = true;
  trialSessionNote.textContent = "AI 상담 답변을 받고 있습니다.";
  appendTrialMessage("user", message);

  const { data, error: messageError } = await sendConsultationMessage(activeSession, {
    sessionId: activeConsultationSession.id,
    message,
  });

  if (messageError) {
    trialSessionNote.textContent = messageError.message;
    activeConsultationMessages = activeConsultationMessages.slice(0, -1);
    updateTrialChatUiV2();
    return false;
  }

  appendTrialMessage("assistant", data?.reply ?? "지금은 답변을 받지 못했습니다.");
  activeConsultationSession = {
    ...activeConsultationSession,
    metadata: activeConsultationSession.metadata ?? {},
    used_turns: Number(data?.usedTurns ?? activeConsultationSession.used_turns),
    status: Number(data?.remainingTurns ?? 0) > 0 ? "active" : "completed",
    current_stage: Number(data?.stage ?? activeConsultationSession.current_stage ?? 1),
  };
  activeConsultationGuidance = {
    stage: Number(data?.stage ?? 1),
    stageLabel: data?.stageLabel ?? "",
    nextStageLabel: data?.nextStageLabel ?? "",
    focusPrompt: data?.focusPrompt ?? "",
  };
  if (trialMessage) trialMessage.value = "";
  track("trial_message_sent");
  trialSessionNote.textContent =
    Number(data?.remainingTurns ?? 0) > 0
      ? `답변을 받았습니다. 다음은 ${data?.nextStageLabel ?? "다음 단계"}로 이어집니다.`
      : String(activeConsultationSession?.mode ?? selectedModeId ?? "trial") === "trial"
        ? "고민 정리를 마쳤습니다. 무료 대화 3회를 모두 사용했습니다."
        : "이번 상담권의 대화를 모두 사용했습니다. 이어서 상담하려면 새 상담권을 준비해 주세요.";
  updateTrialChatUiV2();
  return true;
}

async function refreshRelationshipPanel(session) {
  if (!relationshipAccountPanel) return;

  pendingRelationshipInviteToken = getRelationshipInviteTokenFromHash();
  relationshipAccountPanel.hidden = !session && !pendingRelationshipInviteToken;
  if (relationshipAcceptPanel) relationshipAcceptPanel.hidden = !session || !pendingRelationshipInviteToken;
  if (relationshipInviteCreate) relationshipInviteCreate.disabled = !session;
  if (relationshipInviteType) relationshipInviteType.disabled = !session;

  if (!session) {
    activeRelationshipLinks = [];
    activeRelationshipLabelEditorId = "";
    renderRelationshipLinks([]);
    renderRelationshipPanelState(session, [], { pendingInvite: pendingRelationshipInviteToken });
    if (relationshipInviteNote) {
      relationshipInviteNote.textContent = pendingRelationshipInviteToken
        ? "인연 초대를 받았습니다. 마이에서 로그인한 뒤 이 초대를 수락할 수 있습니다."
        : "";
    }
    return;
  }

  const { links, error } = await getRelationshipLinks(session);
  if (error) {
    activeRelationshipLinks = [];
    activeRelationshipLabelEditorId = "";
    renderRelationshipLinks([]);
    renderRelationshipPanelState(session, [], { pendingInvite: pendingRelationshipInviteToken });
    if (relationshipInviteNote) relationshipInviteNote.textContent = "인연 연결 목록은 DB 연결 확인 후 다시 불러옵니다.";
    return;
  }
  activeRelationshipLinks = links;
  if (!links.some((link) => link.id === activeRelationshipLabelEditorId)) {
    activeRelationshipLabelEditorId = "";
  }
  renderRelationshipLinks(links);
  renderRelationshipPanelState(session, links, { pendingInvite: pendingRelationshipInviteToken });

  if (relationshipInviteNote && pendingRelationshipInviteToken) {
    relationshipInviteNote.textContent = "받은 초대를 수락하면 이 계정과 상대 계정이 연결됩니다.";
  } else if (relationshipInviteNote && links.length) {
    relationshipInviteNote.textContent = "연결된 인연은 유지되고, 필요하면 새 초대 링크를 추가로 만들 수 있습니다.";
  } else if (relationshipInviteNote) {
    relationshipInviteNote.textContent = "초대 링크를 만들면 상대가 로그인 후 같은 관계로 연결됩니다.";
  }
}

function setEmailAuthBusy(isBusy) {
  emailSignupForm?.querySelectorAll("input, button").forEach((element) => {
    element.disabled = isBusy;
  });
  emailLoginForm?.querySelectorAll("input, button").forEach((element) => {
    element.disabled = isBusy;
  });
}

function renderAdminList(target, items, formatter) {
  if (!target) return;
  if (!items?.length) {
    target.innerHTML = '<p class="admin-list__empty">아직 표시할 항목이 없습니다.</p>';
    return;
  }

  target.innerHTML = items
    .map((item) => {
      const formatted = formatter(item);
      return `
        <article class="admin-list__item">
          <strong class="admin-list__title">${escapeHtml(formatted.title)}</strong>
          <p class="admin-list__meta">${escapeHtml(formatted.meta)}</p>
          ${formatted.detail ? `<p class="admin-list__detail">${escapeHtml(formatted.detail)}</p>` : ""}
        </article>
      `;
    })
    .join("");
}

function syncAdminFilterButtons(buttons, activeValue) {
  buttons.forEach((button) => {
    const isActive = button.dataset.adminFilterValue === activeValue;
    button.dataset.active = isActive ? "true" : "false";
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function renderAdminDashboard(dashboard) {
  activeAdminDashboard = dashboard ?? null;
  if (!adminNavLink || !adminStatus || !adminPanel || !adminStats) return;

  const isAdmin = Boolean(dashboard);
  adminNavLink.hidden = !isAdmin;
  adminPanel.hidden = !isAdmin;

  if (!isAdmin) {
    adminStatus.textContent = activeSession
      ? "관리자 권한이 있는 계정에서만 운영 화면을 열 수 있습니다."
      : "로그인 후 관리자 권한을 확인할 수 있습니다.";
    if (window.location.hash === "#admin") openHubSection("my-page");
    return;
  }

  adminStatus.textContent = `${dashboard.currentAdmin.displayName} 계정으로 운영 현황을 확인하고 있습니다.`;
  syncAdminFilterButtons(adminSessionFilters, adminSessionFilter);
  syncAdminFilterButtons(adminSafetyFilters, adminSafetyFilter);
  adminStats.innerHTML = [
    ["사용자", dashboard.stats.totalUsers],
    ["연결 인연", dashboard.stats.activeRelationships],
    ["상담 세션", dashboard.stats.totalConsultationSessions],
    ["활성 세션", dashboard.stats.activeConsultationSessions],
    ["결제 완료", dashboard.stats.paidOrders],
    ["활성 상담권", dashboard.stats.activeEntitlements],
    ["소진 상담권", dashboard.stats.consumedEntitlements],
    ["안전 이벤트", dashboard.stats.safetyEvents],
  ]
    .map(
      ([label, value]) => `
        <article class="admin-stat">
          <span>${escapeHtml(String(label))}</span>
          <strong>${escapeHtml(String(value))}</strong>
        </article>
      `,
    )
    .join("");

  const filteredSessions = (dashboard.recentSessions ?? []).filter((item) => {
    if (adminSessionFilter === "all") return true;
    return item.status === adminSessionFilter;
  });
  const filteredSafetyEvents = (dashboard.recentSafetyEvents ?? []).filter((item) => {
    if (adminSafetyFilter === "all") return true;
    return item.level === adminSafetyFilter;
  });

  renderAdminList(adminProfiles, dashboard.recentProfiles, (item) => ({
    title: `${item.displayName} · ${item.role}`,
    meta: `가입 ${formatShortDate(item.createdAt)}`,
  }));
  renderAdminList(adminSessions, filteredSessions, (item) => ({
    title: `${item.userLabel} · ${item.topic} · ${item.mode}`,
    meta: `${item.status} · ${item.usedTurns}/${item.turnLimit}턴 · 남은 ${Math.max(Number(item.turnLimit) - Number(item.usedTurns), 0)}턴 · ${formatShortDate(item.createdAt)}`,
    detail: item.summarySnippet ?? "",
  }));
  renderAdminList(adminEntitlements, dashboard.recentEntitlements, (item) => ({
    title: `${item.userLabel} · ${item.productId}`,
    meta: `${item.status} · ${Math.max(Number(item.totalTurns) - Number(item.usedTurns), 0)}/${item.totalTurns}턴 남음 · 만료 ${formatShortDate(item.expiresAt ?? item.createdAt)}`,
  }));
  renderAdminList(adminOrders, dashboard.recentOrders, (item) => ({
    title: `${item.userLabel} · ${item.productId}`,
    meta: `${item.status} · ${Number(item.amountKrw).toLocaleString("ko-KR")}원 · ${formatShortDate(item.createdAt)}`,
  }));
  renderAdminList(adminSafety, filteredSafetyEvents, (item) => ({
    title: `${item.userLabel} · ${item.level}`,
    meta: `${item.category} / ${item.action} · ${formatShortDate(item.createdAt)}`,
  }));
}

async function refreshAdminDashboard(session) {
  if (!adminNavLink || !adminStatus || !adminPanel) return;
  if (!session) {
    renderAdminDashboard(null);
    return;
  }

  const { data, error } = await getAdminDashboard(session);
  if (error) {
    renderAdminDashboard(null);
    if (error.code !== "admin_only") {
      adminStatus.textContent = error.message ?? "관리자 화면을 불러오지 못했습니다.";
    }
    return;
  }

  renderAdminDashboard(data);
}

adminSessionFilters.forEach((button) => {
  button.addEventListener("click", () => {
    const nextValue = button.dataset.adminFilterValue?.trim() || "all";
    if (adminSessionFilter === nextValue) return;
    adminSessionFilter = nextValue;
    if (activeAdminDashboard) renderAdminDashboard(activeAdminDashboard);
  });
});

adminSafetyFilters.forEach((button) => {
  button.addEventListener("click", () => {
    const nextValue = button.dataset.adminFilterValue?.trim() || "all";
    if (adminSafetyFilter === nextValue) return;
    adminSafetyFilter = nextValue;
    if (activeAdminDashboard) renderAdminDashboard(activeAdminDashboard);
  });
});

async function initAuthPanel() {
  if (!authStatus) return;

  if (!isSupabaseConfigured()) {
    authStatus.textContent = "Supabase URL 또는 anon key 설정이 필요합니다.";
    authNote.textContent = ".env에 VITE_SUPABASE_URL과 VITE_SUPABASE_PUBLISHABLE_KEY를 먼저 입력해 주세요.";
    authButtons.forEach((button) => {
      button.disabled = true;
    });
    setEmailAuthBusy(true);
    if (adminStatus) adminStatus.textContent = "Supabase 설정 전에는 관리자 데이터를 불러올 수 없습니다.";
    if (relationshipInviteNote && getRelationshipInviteTokenFromHash()) {
      relationshipInviteNote.textContent = "초대 수락 전에 Supabase 설정을 먼저 완료해 주세요.";
    }
    return;
  }

  const syncProfile = async (session) => {
    if (!session) {
      activeAccountProfile = null;
      return;
    }
    const { synced, error: syncError } = await syncProfileForSession(session);
    const { profile } = await getAccountProfile(session);
    activeAccountProfile = profile;
    if (synced) {
      authNote.textContent = "계정 정보를 동기화했습니다. 이제 인연 연결과 상담 기록을 이어서 사용할 수 있어요.";
      track("auth_profile_sync");
      return;
    }
    if (syncError) {
      authNote.textContent = "프로필 동기화에 실패했습니다. Supabase DB 권한과 테이블 구성을 확인해 주세요.";
    }
  };

  const updateConsentUi = async (session) => {
    if (!consentForm) return;
    activeSession = session;
    consentForm.hidden = !session;
    if (!session) {
      hasRequiredConsents = false;
      consentNote.textContent = "";
      setActiveConsultationSession(null);
      updateTrialSessionState();
      return;
    }

    const { completed, acceptedTypes, error: consentError } = await getRequiredConsentStatus(session);
    if (consentError) {
      hasRequiredConsents = false;
      consentNote.textContent = "필수 동의 상태를 불러오지 못했습니다.";
      updateTrialSessionState();
      return;
    }
    hasRequiredConsents = completed;

    REQUIRED_CONSENTS.forEach((consent) => {
      const input = consentForm.elements.namedItem(consent.type);
      if (input instanceof HTMLInputElement) input.checked = acceptedTypes.has(consent.type);
    });

    consentNote.textContent = completed
      ? "필수 동의가 저장되어 있습니다. 바로 상담 체험을 이어갈 수 있어요."
      : "상담 체험 전 필요한 동의를 먼저 완료해 주세요.";
    updateTrialSessionState();
  };

  const updateAuthUi = (session) => {
    const email = session?.user?.email;
    const providerLabel = getAuthProviderLabel(session?.user);
    const roleSuffix =
      session && activeAccountProfile?.role === "admin"
        ? " (관리자)"
        : activeAdminDashboard
          ? " (관리 데이터 확인 가능)"
          : "";

    authStatus.textContent = email
      ? `${email} 계정으로 로그인되어 있습니다.${roleSuffix}`
      : "로그인하면 저장한 정보와 상담 흐름을 이어서 관리할 수 있어요.";
    authButtons.forEach((button) => {
      button.hidden = Boolean(session);
      button.disabled = false;
    });
    authJumpButtons.forEach((button) => {
      button.hidden = Boolean(session);
      button.disabled = false;
    });
    if (authSignout) authSignout.hidden = !session;
    if (emailSignupForm) emailSignupForm.hidden = Boolean(session);
    if (emailLoginForm) emailLoginForm.hidden = Boolean(session);
    if (!session) setAuthPanelTab("signup");

    if (!session) {
      const googleBrowserWarning = getOAuthBrowserWarning("google");
      authNote.textContent = googleBrowserWarning?.note ?? "간편 로그인 또는 이메일 계정으로 이어서 사용할 수 있어요.";
      if (authProviderNote) {
        authProviderNote.textContent = "처음이면 이메일로 가입하고, 이미 만든 계정이 있으면 같은 방식으로 다시 로그인해 주세요.";
      }
      if (emailAuthNote) {
        emailAuthNote.textContent = "이메일 계정을 만들면 비밀번호로 직접 로그인할 수 있어요.";
      }
      updateTrialSessionState();
      return;
    }

    if (authProviderNote) {
      authProviderNote.textContent = `현재 연결된 로그인 방식: ${providerLabel}`;
    }
    if (emailAuthNote) {
      const displayName = activeAccountProfile?.displayName?.trim();
      emailAuthNote.textContent = displayName
        ? `${displayName} 이름으로 계정이 연결되어 있습니다.`
        : `${providerLabel}으로 연결된 계정입니다. 마이 페이지에서 표시 이름을 정리할 수 있어요.`;
    }
    updateTrialSessionState();
  };

  const { session, error } = await getCurrentSession();
  if (error) {
    authStatus.textContent = "로그인 상태를 확인하지 못했습니다.";
    authNote.textContent = error.message;
  } else {
    await syncProfile(session);
    await refreshAdminDashboard(session);
    await refreshCommercePanel(session);
    updateAuthUi(session);
    await updateConsentUi(session);
    await refreshRelationshipPanel(session);
  }

  onAuthStateChange(async (nextSession) => {
    await syncProfile(nextSession);
    await refreshAdminDashboard(nextSession);
    await refreshCommercePanel(nextSession);
    updateAuthUi(nextSession);
    await updateConsentUi(nextSession);
    await refreshRelationshipPanel(nextSession);
  });

  emailSignupForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!(signupEmailInput instanceof HTMLInputElement) || !(signupPasswordInput instanceof HTMLInputElement)) return;

    const email = signupEmailInput.value.trim();
    const password = signupPasswordInput.value;
    const displayName = signupDisplayNameInput instanceof HTMLInputElement ? signupDisplayNameInput.value.trim() : "";

    if (!email || !password) {
      if (emailAuthNote) emailAuthNote.textContent = "이메일과 비밀번호를 모두 입력해 주세요.";
      return;
    }

    setEmailAuthBusy(true);
    if (emailAuthNote) emailAuthNote.textContent = "이메일 계정을 만드는 중입니다.";
    const { data, error: signUpError } = await signUpWithPassword({ email, password, displayName });
    setEmailAuthBusy(false);

    if (signUpError) {
      if (emailAuthNote) emailAuthNote.textContent = signUpError.message;
      return;
    }

    track("auth_email_signup");
    if (signupPasswordInput instanceof HTMLInputElement) signupPasswordInput.value = "";
    if (emailAuthNote) {
      emailAuthNote.textContent = data?.session
        ? "가입과 동시에 로그인되었습니다."
        : "가입이 완료되었습니다. 받은 메일에서 인증 후 로그인해 주세요.";
    }
  });

  emailLoginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!(loginEmailInput instanceof HTMLInputElement) || !(loginPasswordInput instanceof HTMLInputElement)) return;

    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value;
    if (!email || !password) {
      if (emailAuthNote) emailAuthNote.textContent = "이메일과 비밀번호를 모두 입력해 주세요.";
      return;
    }

    setEmailAuthBusy(true);
    if (emailAuthNote) emailAuthNote.textContent = "이메일 로그인을 진행하고 있습니다.";
    const { error: signInError } = await signInWithPassword({ email, password });
    setEmailAuthBusy(false);

    if (signInError) {
      if (emailAuthNote) emailAuthNote.textContent = signInError.message;
      return;
    }

    track("auth_email_login");
    if (loginPasswordInput instanceof HTMLInputElement) loginPasswordInput.value = "";
    if (emailAuthNote) emailAuthNote.textContent = "이메일 로그인에 성공했습니다.";
  });

  passwordResetRequestButton?.addEventListener("click", async () => {
    const email = loginEmailInput instanceof HTMLInputElement ? loginEmailInput.value.trim() : "";
    if (!email) {
      if (emailAuthNote) emailAuthNote.textContent = "비밀번호를 재설정할 이메일 주소를 먼저 입력해 주세요.";
      return;
    }

    setEmailAuthBusy(true);
    if (emailAuthNote) emailAuthNote.textContent = "비밀번호 재설정 메일을 보내고 있습니다.";
    const { error: resetError } = await requestPasswordReset(email);
    setEmailAuthBusy(false);

    if (resetError) {
      if (emailAuthNote) emailAuthNote.textContent = resetError.message;
      return;
    }

    if (emailAuthNote) emailAuthNote.textContent = "비밀번호 재설정 메일을 보냈습니다. 받은 편지함을 확인해 주세요.";
  });

  authButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const provider = button.dataset.authProvider;
      if (!provider) return;
      const browserWarning = getOAuthBrowserWarning(provider);
      if (browserWarning) {
        authStatus.textContent = browserWarning.status;
        authNote.textContent = browserWarning.note;
        track(`auth_${provider}_blocked_in_app_browser`);
        return;
      }
      track(`auth_${provider}_start`);
      authStatus.textContent = `${button.textContent.trim()} 로그인을 진행하고 있습니다.`;
      button.disabled = true;
      const { error: signInError } = await signInWithOAuthProvider(provider);
      if (signInError) {
        authStatus.textContent = "소셜 로그인에 실패했습니다.";
        authNote.textContent = signInError.message;
        button.disabled = false;
      }
    });
  });

  authSignout?.addEventListener("click", async () => {
    track("auth_signout");
    authStatus.textContent = "로그아웃하는 중입니다.";
    const { error: signOutError } = await signOut();
    if (signOutError) {
      authStatus.textContent = "로그아웃에 실패했습니다.";
      authNote.textContent = signOutError.message;
    }
  });

  consentForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!activeSession) {
      consentNote.textContent = "로그인 후 다시 시도해 주세요.";
      return;
    }

    const allChecked = REQUIRED_CONSENTS.every((consent) => {
      const input = consentForm.elements.namedItem(consent.type);
      return input instanceof HTMLInputElement && input.checked;
    });
    if (!allChecked) {
      consentNote.textContent = "필수 항목에 모두 동의해 주세요.";
      return;
    }

    consentNote.textContent = "필수 동의를 저장하고 있습니다.";
    const { recorded, error: consentSaveError } = await recordRequiredConsents(activeSession);
    if (recorded) {
      track("required_consents_saved");
      hasRequiredConsents = true;
      updateTrialSessionState();
      consentNote.textContent = "필수 동의가 저장되었습니다. 이제 무료 상담을 시작할 수 있어요.";
      return;
    }

    consentNote.textContent = consentSaveError?.message ?? "필수 동의 저장에 실패했습니다.";
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

    const counterpartName = String(data?.counterpartDisplayName ?? "").trim();
    track("relationship_connected");
    relationshipInviteNote.textContent = counterpartName
      ? `${counterpartName}님과 ${relationLabel(data?.relationship)} 인연으로 연결했습니다.`
      : `${relationLabel(data?.relationship)} 인연으로 연결했습니다.`;
    relationshipAcceptPanel.hidden = true;
    pendingRelationshipInviteToken = "";
    history.replaceState(null, "", window.location.pathname + window.location.search);
    await refreshRelationshipPanel(activeSession);
  });

  relationshipLinks?.addEventListener("click", async (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest("[data-relationship-action]");
    if (!(button instanceof HTMLButtonElement)) return;

    const linkId = button.dataset.linkId;
    const action = button.dataset.relationshipAction;
    const link = Array.isArray(activeRelationshipLinks)
      ? activeRelationshipLinks.find((item) => item.id === linkId)
      : null;
    if (!link) return;

    if (action === "compatibility") {
      if (relationshipInviteType) relationshipInviteType.value = link.relationship;
      const relationInput = document.querySelector("#partner-relation");
      if (relationInput instanceof HTMLSelectElement) relationInput.value = link.relationship;
      if (relationshipInviteNote) {
        relationshipInviteNote.textContent = `${relationshipDisplayName(link)}님과의 궁합 흐름으로 이어집니다. 상대 생년월일시는 보안을 위해 한 번 더 직접 입력해 주세요.`;
      }
      openHubSection("relationship");
      partnerDateInput?.focus();
      return;
    }

    if (action === "consult") {
      const mappedTopic = consultationTopicForRelationship(link.relationship);
      const concern = buildRelationshipConsultConcern(link);
      pendingConsultationContext = buildConsultationContextForRelationship(link);
      if (trialTopic) trialTopic.value = mappedTopic;
      if (topicSelect) topicSelect.value = mappedTopic;
      if (trialConcern) trialConcern.value = concern;
      const currentConcern = document.querySelector("#current-concern");
      if (currentConcern instanceof HTMLTextAreaElement) currentConcern.value = concern;
      setConsultTab("start");
      openHubSection("consult");
      if (trialSessionNote) {
        trialSessionNote.textContent = `${relationshipDisplayName(link)}님과의 관계 고민으로 바로 이어집니다. 이 문장 그대로 시작하거나 조금 고쳐서 보내도 됩니다.`;
      }
      trialConcern?.focus();
      return;
    }

    if (action === "toggle-label") {
      activeRelationshipLabelEditorId = link.id;
      renderRelationshipLinks(activeRelationshipLinks);
      relationshipLinks?.querySelector(`[data-relationship-label-input="${link.id}"]`)?.focus();
      return;
    }

    if (action === "cancel-label") {
      activeRelationshipLabelEditorId = "";
      renderRelationshipLinks(activeRelationshipLinks);
      return;
    }

    if (action === "save-label") {
      const input = relationshipLinks?.querySelector(`[data-relationship-label-input="${link.id}"]`);
      const nextName = input instanceof HTMLInputElement ? input.value.trim() : "";
      if (!nextName) {
        if (relationshipInviteNote) relationshipInviteNote.textContent = "관계 카드에 표시할 이름을 입력해 주세요.";
        input?.focus();
        return;
      }

      button.disabled = true;
      if (relationshipInviteNote) {
        relationshipInviteNote.textContent = `${nextName} 이름으로 저장하고 있어요.`;
      }
      const { error } = await updateRelationshipLabel(activeSession, link.id, nextName);
      button.disabled = false;

      if (error) {
        if (relationshipInviteNote) relationshipInviteNote.textContent = error.message ?? "관계 이름을 저장하지 못했습니다.";
        input?.focus();
        return;
      }

      activeRelationshipLinks = activeRelationshipLinks.map((item) =>
        item.id === link.id
          ? {
              ...item,
              editableDisplayName: nextName,
              counterpartDisplayName: nextName,
            }
          : item,
      );
      activeRelationshipLabelEditorId = "";
      if (relationshipInviteNote) {
        relationshipInviteNote.textContent = `${nextName} 이름으로 이 관계를 다시 불러드릴게요.`;
      }
      renderRelationshipLinks(activeRelationshipLinks);
    }
  });

  trialSessionStart?.addEventListener("click", async () => {
    if (!activeSession) {
      trialSessionNote.textContent = "로그인 후 상담을 시작할 수 있습니다.";
      focusMyPageForConsultation();
      return;
    }
    if (!hasRequiredConsents) {
      trialSessionNote.textContent = "필수 동의를 먼저 저장해 주세요.";
      focusMyPageForConsultation();
      return;
    }

    const sessionMode = selectedModeId === "pro" ? "pro" : selectedModeId === "basic" ? "basic" : "trial";
    const entitlement = sessionMode === "trial" ? null : findActiveEntitlement(sessionMode, preferredEntitlementId);
    if (sessionMode !== "trial" && !entitlement) {
      trialSessionNote.textContent = "이 모드는 활성 상담권이 있어야 시작할 수 있습니다. 마이 페이지에서 이용권을 확인해 주세요.";
      setConsultTab("mode");
      return;
    }

    trialSessionStart.disabled = true;
    trialSessionNote.textContent = sessionMode === "trial" ? "무료 상담을 시작하고 있습니다." : "유료 상담 세션을 준비하고 있습니다.";
    const concern =
      trialConcern?.value?.trim() ||
      document.querySelector("#current-concern")?.value?.trim() ||
      "지금 고민을 사주 흐름과 함께 정리하고 싶어요.";
    const { data, error: sessionError } = await createConsultationSession(activeSession, {
      personaId: trialPersona?.value ?? "miseon",
      mode: sessionMode,
      entitlementId: entitlement?.id ?? null,
      productId: entitlement?.product_id ?? productIdForMode(sessionMode),
      topic: trialTopic?.value ?? topicSelect.value ?? "relationship",
      concernSummary: concern,
      contextMeta:
        pendingConsultationContext ??
        {
          source: "manual",
        },
    });

    if (sessionError) {
      trialSessionNote.textContent =
        sessionMode === "trial" && sessionError.code === "trial_used"
          ? "무료 3턴 체험을 이미 사용했습니다. 다음 단계는 기본 상담권과 프로 상담으로 이어집니다."
          : sessionError.message;
      if (sessionMode === "trial" && sessionError.code === "trial_used") {
        activeConsultationSession = {
          status: "completed",
          mode: "trial",
          turn_limit: 3,
          used_turns: 3,
        };
      }
      updateTrialSessionState();
      updateTrialChatUiV2();
      return;
    }

    const session = data?.session;
    preferredEntitlementId = sessionMode === "trial" ? "" : String(session?.entitlement_id ?? entitlement?.id ?? "");
    setActiveConsultationSession(session, Boolean(data?.reused));
    let historyLoadFailed = false;
    if (data?.reused && session?.id) {
      const snapshotResult = await hydrateConsultationSnapshot(session);
      if (snapshotResult.errors.length) {
        historyLoadFailed = true;
      }
    } else {
      replaceConsultationMessages([]);
      activeConsultationGuidance = null;
    }
    track(sessionMode === "trial" ? "trial_started" : "paid_session_started");
    trialSessionNote.textContent = historyLoadFailed
      ? "이전 대화를 불러오지 못했습니다. 새 메시지는 계속 이어서 보낼 수 있습니다."
      : data?.reused
        ? `이어서 이야기할 수 있어요. 다음은 ${trialStageMeta(Number(session?.used_turns ?? 0) + 1).label} 단계입니다.`
        : sessionMode === "trial"
          ? "적어주신 고민을 듣고 있어요."
          : "선택한 상담권으로 바로 대화를 이어갑니다.";
    if (!data?.reused) pendingConsultationContext = null;
    updateTrialSessionState();
    if (!data?.reused && concern) await submitTrialMessage(concern);
  });

  trialMessageSend?.addEventListener("click", async () => {
    if (!activeSession) {
      trialSessionNote.textContent = "로그인 후 AI 상담 메시지를 보낼 수 있습니다.";
      return;
    }
    if (!activeConsultationSession?.id) {
      trialSessionNote.textContent = selectedModeId === "trial"
        ? "먼저 위에 고민을 적고 무료 상담을 시작해 주세요."
        : "먼저 상담 세션을 시작한 뒤 메시지를 보내 주세요.";
      return;
    }

    const message = trialMessage?.value?.trim();
    if (!message) {
      trialSessionNote.textContent = "보낼 메시지를 입력해 주세요.";
      return;
    }

    await submitTrialMessage(message);
  });

  trialGuidanceChips?.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("[data-trial-suggestion]") : null;
    if (!(target instanceof HTMLButtonElement) || !trialMessage) return;
    const suggestion = target.dataset.trialSuggestion?.trim();
    if (!suggestion) return;
    trialMessage.value = suggestion;
    trialMessage.focus();
    trialSessionNote.textContent = "예시 문장을 넣었습니다. 그대로 보내거나 조금 고쳐서 보내도 됩니다.";
  });

  trialNextStep?.addEventListener("click", async (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest("[data-order-product]");
    if (!(button instanceof HTMLButtonElement)) return;

    const note = trialNextStep.querySelector("#paid-order-note");
    const setNote = (message) => {
      if (note) note.textContent = message;
      if (trialSessionNote) trialSessionNote.textContent = message;
    };

    if (!activeSession) {
      setNote("로그인 후 상담권 주문을 준비할 수 있습니다.");
      focusMyPageForConsultation();
      return;
    }
    if (!hasRequiredConsents) {
      setNote("필수 동의를 저장한 뒤 상담권 주문을 준비할 수 있습니다.");
      focusMyPageForConsultation();
      return;
    }

    const productId = button.dataset.orderProduct;
    if (!portoneStoreId || !portoneChannelKey) {
      setNote("PortOne Store ID와 Channel Key가 아직 설정되지 않았습니다.");
      return;
    }

    button.disabled = true;
    setNote("상담권 주문 정보를 서버에 준비하고 있습니다.");
    const { data, error: orderError } = await createConsultationOrder(activeSession, {
      productId,
      personaId: selectedPersonaId,
    });

    if (orderError) {
      button.disabled = false;
      setNote(orderError.message);
      return;
    }

    const amount = Number(data?.order?.amount_krw ?? 0).toLocaleString("ko-KR");
    const orderId = data?.order?.provider_order_id ?? data?.order?.id ?? "";
    const productName = data?.product?.name ?? "상담권";
    setNote(`${productName} ${amount}원 주문을 준비했습니다. 결제창을 여는 중입니다.`);
    track("paid_order_intent");

    let paymentResponse;
    try {
      paymentResponse = await PortOne.requestPayment({
        storeId: portoneStoreId,
        channelKey: portoneChannelKey,
        paymentId: orderId,
        orderName: productName,
        totalAmount: Number(data?.order?.amount_krw ?? 0),
        currency: "CURRENCY_KRW",
        payMethod: "CARD",
      });
    } catch (error) {
      button.disabled = false;
      setNote(error instanceof Error ? error.message : "결제창을 열지 못했습니다.");
      return;
    }

    if (paymentResponse?.code) {
      button.disabled = false;
      setNote(paymentResponse.message ?? "결제가 완료되지 않았습니다.");
      return;
    }

    setNote("결제 결과를 서버에서 검증하고 있습니다.");
    const paymentId = paymentResponse?.paymentId ?? orderId;
    const { data: completeData, error: completeError } = await completePortonePayment(activeSession, { paymentId });
    button.disabled = false;

    if (completeError) {
      setNote(`결제 검증에 실패했습니다. ${completeError.message}`);
      return;
    }

    if (completeData?.finalized) {
      const turns = completeData?.entitlement?.total_turns ?? data?.product?.turn_limit ?? "";
      setNote(`${productName} 결제가 확인됐습니다. 상담 ${turns}턴 이용권이 발급됐습니다.`);
      track("payment_complete");
      await refreshCommercePanel(activeSession);
      preferredEntitlementId = String(completeData?.entitlement?.id ?? "");
      selectedModeId = modeIdForProduct(productId);
      updateTrialSessionState();
      prepareConsultationEntry({
        personaId: selectedPersonaId,
        productId,
        entitlementId: preferredEntitlementId,
        focusMode: false,
      });
      return;
    }

    setNote("결제는 접수됐지만 아직 완료 상태가 아닙니다. 상태가 바뀌면 웹훅으로 다시 확인합니다.");
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
const yearFlowSummary = document.querySelector("#year-flow-summary");
const yearFlowEyebrow = document.querySelector("#year-flow-eyebrow");
const yearFlowTitle = document.querySelector("#year-flow-title");
const yearFlowEvidence = document.querySelector("#year-flow-evidence");
const yearCurrentLabel = document.querySelector("#year-current-label");
const yearCurrentScore = document.querySelector("#year-current-score");
const yearCurrentFocus = document.querySelector("#year-current-focus");
const yearCurrentAction = document.querySelector("#year-current-action");
const yearFlowHalves = document.querySelector("#year-flow-halves");
const yearFlowMonths = document.querySelector("#year-flow-months");
const tarotSummary = document.querySelector("#tarot-summary");
const tarotEyebrow = document.querySelector("#tarot-eyebrow");
const tarotTitle = document.querySelector("#tarot-title");
const tarotCardName = document.querySelector("#tarot-card-name");
const tarotCardKeyword = document.querySelector("#tarot-card-keyword");
const tarotCardMessage = document.querySelector("#tarot-card-message");
const tarotCardAction = document.querySelector("#tarot-card-action");
const tarotChoicePrompt = document.querySelector("#tarot-choice-prompt");
const tarotChoiceALabel = document.querySelector("#tarot-choice-a-label");
const tarotChoiceACopy = document.querySelector("#tarot-choice-a-copy");
const tarotChoiceBLabel = document.querySelector("#tarot-choice-b-label");
const tarotChoiceBCopy = document.querySelector("#tarot-choice-b-copy");
const tarotReflectionList = document.querySelector("#tarot-reflection-list");
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

function renderYearFlow(chart, input, now = new Date()) {
  const overview = buildYearlyOverview(chart, input.topic, now);
  if (yearFlowSummary) yearFlowSummary.textContent = overview.summary;
  if (yearFlowEyebrow) yearFlowEyebrow.textContent = overview.eyebrow;
  if (yearFlowTitle) yearFlowTitle.textContent = overview.title;
  if (yearFlowEvidence) {
    yearFlowEvidence.innerHTML = overview.evidence
      .map((item) => `<em>${escapeHtml(item)}</em>`)
      .join("");
  }
  if (yearCurrentLabel) yearCurrentLabel.textContent = overview.currentMonth.label;
  if (yearCurrentScore) yearCurrentScore.textContent = `${overview.currentMonth.score}점`;
  if (yearCurrentFocus) yearCurrentFocus.textContent = overview.currentMonth.focus;
  if (yearCurrentAction) yearCurrentAction.textContent = overview.currentMonth.action;
  if (yearFlowHalves) {
    yearFlowHalves.innerHTML = overview.halfYear
      .map(
        (half) => `
          <article class="year-half-card">
            <span>${escapeHtml(half.label)}</span>
            <strong>${half.score}점</strong>
            <p>${escapeHtml(half.copy)}</p>
          </article>
        `,
      )
      .join("");
  }
  if (yearFlowMonths) {
    yearFlowMonths.innerHTML = overview.monthScores
      .map(
        (month) => `
          <article class="year-month-chip" data-score-band="${month.score >= 72 ? "strong" : month.score >= 60 ? "steady" : "careful"}">
            <span>${escapeHtml(month.label)}</span>
            <strong>${month.score}</strong>
            <em>${escapeHtml(month.focus)}</em>
          </article>
        `,
      )
      .join("");
  }
}

function renderTarot(chart, input, now = new Date()) {
  const tarot = buildTarotOverview(chart, input.topic, input.concern, now);
  if (tarotSummary) {
    tarotSummary.textContent =
      input.concern?.trim()
        ? `입력한 고민을 바탕으로 오늘의 카드와 선택 질문을 정리했어요.`
        : "지금 마음을 비춰볼 질문과 오늘의 한 장을 같이 정리해보세요.";
  }
  if (tarotEyebrow) tarotEyebrow.textContent = tarot.eyebrow;
  if (tarotTitle) tarotTitle.textContent = tarot.title;
  if (tarotCardName) tarotCardName.textContent = tarot.lead.name;
  if (tarotCardKeyword) tarotCardKeyword.textContent = tarot.lead.keyword;
  if (tarotCardMessage) tarotCardMessage.textContent = tarot.lead.message;
  if (tarotCardAction) tarotCardAction.textContent = tarot.lead.action;
  if (tarotChoicePrompt) tarotChoicePrompt.textContent = tarot.choice.prompt;
  if (tarotChoiceALabel) tarotChoiceALabel.textContent = tarot.choice.aLabel;
  if (tarotChoiceACopy) tarotChoiceACopy.textContent = tarot.choice.aCopy;
  if (tarotChoiceBLabel) tarotChoiceBLabel.textContent = tarot.choice.bLabel;
  if (tarotChoiceBCopy) tarotChoiceBCopy.textContent = tarot.choice.bCopy;
  if (tarotReflectionList) tarotReflectionList.innerHTML = renderList(tarot.reflection);
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

function clearStoredProfile() {
  clearProfile();
  closeProfileModal();
  dailySection.hidden = true;
  if (emptyDaily) emptyDaily.hidden = false;
  resultSection.hidden = true;
  lastResult = null;
  renderStoredProfilePanels(null);
  syncFormError("저장된 정보를 삭제했어요. 다시 보려면 새로 입력해 주세요.");
}

function applyProfileToForm(profile) {
  calendarType.value = profile.calendarType;
  calendarType.dispatchEvent(new Event("change"));
  document.querySelector("#birth-date").value = normalizeDateText(profile.birthDate);
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
  renderStoredProfilePanels(profile);
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
    renderStoredProfilePanels(loadProfile());
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
    setActiveNav("relationship");
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
  setActiveNav("relationship");
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

  const freeHub = document.querySelector(".free-hub");
  const hubIds = ["year-flow", "relationship", "tarot", "consult", "my-page", "admin"];
  const isHubView = hubIds.includes(id);
  if (freeHub) freeHub.hidden = !isHubView;
  document.querySelector("#today")?.toggleAttribute("hidden", id !== "today");
  document.querySelector("#saju")?.toggleAttribute("hidden", id !== "saju");
  hubIds.forEach((hubId) => document.querySelector(`#${hubId}`)?.toggleAttribute("hidden", hubId !== id));
  if (resultSection) resultSection.toggleAttribute("hidden", id !== "saju" || !lastResult);
}

const navSections = navLinks
  .map((link) => document.getElementById(link.dataset.navTarget))
  .filter(Boolean);

window.addEventListener("hashchange", () => {
  const id = window.location.hash.slice(1);
  if (navSections.some((section) => section.id === id)) setActiveNav(id);
});

const initialNavId = getRelationshipInviteTokenFromHash()
  ? "relationship"
  : navSections.some((section) => section.id === window.location.hash.slice(1))
    ? window.location.hash.slice(1)
    : "today";
setActiveNav(initialNavId);

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
  const normalizedPartnerDate = normalizeDateText(data.get("partnerDate"));
  if (partnerDateInput) partnerDateInput.value = normalizedPartnerDate;
  const partnerInput = {
    calendarType: data.get("partnerCalendar"),
    birthDate: normalizedPartnerDate,
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
    const reading = buildCompatibilityReadingSymmetric(
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
  ctx.fillText("사주 한 장 · 고민을 차분히 정리하는 사주 기록", canvas.width / 2, 1290);

  return canvas;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  syncFormError("");

  const data = new FormData(form);
  const normalizedBirthDate = normalizeDateText(data.get("birthDate"));
  if (birthDateInput) birthDateInput.value = normalizedBirthDate;
  const input = {
    calendarType: data.get("calendarType"),
    birthDate: normalizedBirthDate,
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
    renderStoredProfilePanels(input);
    resultSection.hidden = false;
    closeProfileModal();
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    syncFormError(
      error instanceof Error
        ? error.message
        : "계산 중 문제가 생겼습니다. 입력값을 확인해 주세요.",
    );
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

function renderMessageParagraphs(value) {
  const paragraphs = String(value)
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (!paragraphs.length) return "<p></p>";
  return paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
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

  renderPersonaChoice();
  renderModeChoice();

  updatePersonaRecommendation(topicSelect.value);
  if (trialTopic) trialTopic.value = topicSelect.value;
}

function renderPersonaChoice() {
  const persona = CONSULTATION_PERSONAS.find((item) => item.id === selectedPersonaId) ?? CONSULTATION_PERSONAS[0];
  if (personaSwitcher) {
    personaSwitcher.innerHTML = CONSULTATION_PERSONAS.map(
      (item) => `
        <button type="button" role="tab" data-persona-tab="${escapeHtml(item.id)}" aria-selected="${item.id === persona.id}">
          ${escapeHtml(item.name)}
        </button>
      `,
    ).join("");
  }
  if (personaCards) {
    personaCards.innerHTML = `
        <article class="persona-card" data-persona="${escapeHtml(persona.id)}">
          <div class="persona-card__top">
            <span class="persona-avatar" aria-hidden="true">
              <img src="${escapeHtml(PERSONA_IMAGE_MAP[persona.id] ?? "")}" alt="" loading="lazy" />
            </span>
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
      `;
  }
}

function renderModeChoice() {
  const mode = CONSULTATION_MODES.find((item) => item.id === selectedModeId) ?? CONSULTATION_MODES[0];
  if (modeSwitcher) {
    modeSwitcher.innerHTML = CONSULTATION_MODES.map(
      (item) => `
        <button type="button" role="tab" data-mode-tab="${escapeHtml(item.id)}" aria-selected="${item.id === mode.id}">
          ${escapeHtml(item.name)}
        </button>
      `,
    ).join("");
  }
  if (modeCards) {
    modeCards.innerHTML = `
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
      `;
  }
}

function updatePersonaRecommendation(topic) {
  if (!personaRecommendation) return;
  const recommended = recommendConsultationPersonas(topic);
  personaRecommendation.innerHTML = `
    <span>현재 고민 추천</span>
    <strong>${recommended.map((persona) => escapeHtml(persona.name)).join(" · ")}</strong>
  `;
  if (recommended[0]) {
    selectedPersonaId = recommended[0].id;
    if (trialPersona) trialPersona.value = selectedPersonaId;
    renderPersonaChoice();
  }
}

function renderResult(chart, input) {
  document.querySelector("#result-date").textContent = formatInputSummary(input);
  renderYearFlow(chart, input, new Date());
  renderTarot(chart, input, new Date());

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

  const topicReading = buildTopicReading(chart, input.topic, input.concern);
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
  setResultTab("question");

  if (trialTopic) trialTopic.value = input.topic ?? "relationship";
  if (trialConcern && input.concern) trialConcern.value = input.concern;

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

