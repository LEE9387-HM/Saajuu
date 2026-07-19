import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL ?? "";
const supabaseKey =
  import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env?.VITE_SUPABASE_ANON_KEY ?? "";
const relationshipInviteDays = 7;

export const REQUIRED_CONSENTS = [
  { type: "terms", label: "서비스 이용약관", version: "2026-07-11" },
  { type: "privacy", label: "개인정보 처리방침", version: "2026-07-11" },
  { type: "ai_notice", label: "AI 상담 및 오락·자기성찰 목적 고지", version: "2026-07-11" },
];

let client = null;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseKey);
}

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    });
  }
  return client;
}

export async function getCurrentSession() {
  const supabase = getSupabaseClient();
  if (!supabase) return { session: null, error: null };
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session ?? null, error };
}

function getDisplayNameFromUser(user) {
  return (
    user?.user_metadata?.name ??
    user?.user_metadata?.full_name ??
    user?.user_metadata?.nickname ??
    user?.email?.split("@")[0] ??
    null
  );
}

export async function syncProfileForSession(session) {
  const supabase = getSupabaseClient();
  const user = session?.user;
  if (!supabase || !user) return { synced: false, error: null };

  const displayName = getDisplayNameFromUser(user);

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: displayName,
    },
    { onConflict: "id" }
  );

  return { synced: !error, error };
}

export async function getRequiredConsentStatus(session) {
  const supabase = getSupabaseClient();
  const user = session?.user;
  if (!supabase || !user) return { completed: false, acceptedTypes: new Set(), error: null };

  const consentTypes = REQUIRED_CONSENTS.map((consent) => consent.type);
  const { data, error } = await supabase
    .from("consent_logs")
    .select("consent_type, consent_version, accepted")
    .eq("user_id", user.id)
    .eq("accepted", true)
    .in("consent_type", consentTypes);

  if (error) return { completed: false, acceptedTypes: new Set(), error };

  const acceptedTypes = new Set(
    (data ?? [])
      .filter((item) => {
        const required = REQUIRED_CONSENTS.find((consent) => consent.type === item.consent_type);
        return required && item.consent_version === required.version;
      })
      .map((item) => item.consent_type)
  );

  return {
    completed: REQUIRED_CONSENTS.every((consent) => acceptedTypes.has(consent.type)),
    acceptedTypes,
    error: null,
  };
}

export async function recordRequiredConsents(session) {
  const supabase = getSupabaseClient();
  const user = session?.user;
  if (!supabase || !user) return { recorded: false, error: null };

  const rows = REQUIRED_CONSENTS.map((consent) => ({
    user_id: user.id,
    consent_type: consent.type,
    consent_version: consent.version,
    accepted: true,
    evidence: {
      source: "web",
      user_agent: typeof navigator === "undefined" ? null : navigator.userAgent,
      path: typeof window === "undefined" ? null : window.location.pathname,
    },
  }));

  const { error } = await supabase.from("consent_logs").insert(rows);
  return { recorded: !error, error };
}

function base64UrlEncode(bytes) {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function sha256Hex(value) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function createInviteToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export function getRelationshipInviteTokenFromHash(hash = window.location.hash) {
  if (!hash.startsWith("#invite=")) return "";
  return decodeURIComponent(hash.slice("#invite=".length)).trim();
}

export function isKakaoInAppBrowser(userAgent = navigator.userAgent) {
  return /KAKAOTALK/i.test(userAgent ?? "");
}

export function getOAuthBrowserWarning(provider, userAgent = navigator.userAgent) {
  if (provider === "google" && isKakaoInAppBrowser(userAgent)) {
    return {
      status: "카카오톡 안에서는 Google 로그인을 열 수 없습니다.",
      note: "Google 정책상 카카오톡 인앱 브라우저에서는 로그인이 차단됩니다. 오른쪽 위 메뉴에서 Chrome 또는 Safari로 열어 다시 로그인해 주세요.",
    };
  }
  return null;
}

export async function createRelationshipInvite(session, relationship) {
  const supabase = getSupabaseClient();
  const user = session?.user;
  if (!supabase || !user) return { inviteUrl: "", error: new Error("로그인 후 초대 링크를 만들 수 있습니다.") };
  if (!crypto?.subtle || !crypto?.getRandomValues) {
    return { inviteUrl: "", error: new Error("이 브라우저에서는 안전한 초대 토큰을 만들 수 없습니다.") };
  }

  const token = createInviteToken();
  const inviteTokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + relationshipInviteDays * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("relationship_invites").insert({
    inviter_user_id: user.id,
    invite_token_hash: inviteTokenHash,
    relationship,
    expires_at: expiresAt,
  });

  if (error) return { inviteUrl: "", error };

  const inviteUrl = `${window.location.origin}${window.location.pathname}#invite=${encodeURIComponent(token)}`;
  return { inviteUrl, error: null };
}

export async function acceptRelationshipInvite(session, token) {
  const supabase = getSupabaseClient();
  if (!supabase || !session?.user) {
    return { data: null, error: new Error("로그인 후 인연 초대를 수락할 수 있습니다.") };
  }

  const { data, error } = await supabase.functions.invoke("accept-relationship-invite", {
    body: { inviteToken: token },
  });

  return { data: data ?? null, error };
}

export async function getRelationshipLinks(session) {
  const supabase = getSupabaseClient();
  if (!supabase || !session?.user) return { links: [], error: null };

  const { data, error } = await supabase.functions.invoke("list-relationship-links", {
    body: {},
  });

  return { links: data?.links ?? [], error: await normalizeFunctionError(error) };
}

export async function updateRelationshipLabel(session, linkId, displayName) {
  const supabase = getSupabaseClient();
  if (!supabase || !session?.user) {
    return { data: null, error: new Error("로그인 후 연결된 관계 이름을 정할 수 있습니다.") };
  }

  const { data, error } = await supabase.functions.invoke("update-relationship-label", {
    body: { linkId, displayName },
  });

  return { data: data ?? null, error: await normalizeFunctionError(error) };
}

async function normalizeFunctionError(error) {
  if (!error) return null;

  let details = null;
  const context = error.context;

  if (context?.json) {
    try {
      details = await context.json();
    } catch {
      details = null;
    }
  } else if (context?.text) {
    try {
      details = JSON.parse(await context.text());
    } catch {
      details = null;
    }
  }

  const normalized = new Error(details?.error ?? error.message ?? "Supabase Function call failed");
  normalized.code = details?.code ?? error.code ?? null;
  normalized.status = error.status ?? context?.status ?? null;
  normalized.details = details;
  return normalized;
}

export async function createConsultationSession(session, payload) {
  const supabase = getSupabaseClient();
  if (!supabase || !session?.user) {
    return { data: null, error: new Error("로그인 후 무료 상담 체험을 시작할 수 있습니다.") };
  }

  const { data, error } = await supabase.functions.invoke("create-consultation-session", {
    body: payload,
  });

  return { data: data ?? null, error: await normalizeFunctionError(error) };
}

export async function createConsultationOrder(session, payload) {
  const supabase = getSupabaseClient();
  if (!supabase || !session?.user) {
    return { data: null, error: new Error("로그인 후 상담권 주문을 준비할 수 있습니다.") };
  }

  const { data, error } = await supabase.functions.invoke("create-consultation-order", {
    body: payload,
  });

  return { data: data ?? null, error: await normalizeFunctionError(error) };
}

export async function getCommerceOverview(session) {
  const supabase = getSupabaseClient();
  if (!supabase || !session?.user) {
    return {
      data: { orders: [], entitlements: [], products: [], personas: [] },
      error: null,
    };
  }

  const [ordersResult, entitlementsResult, productsResult, personasResult] = await Promise.all([
    supabase
      .from("orders")
      .select("id, product_id, provider_order_id, amount_krw, status, paid_at, created_at, metadata")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("entitlements")
      .select("id, product_id, order_id, status, total_turns, used_turns, expires_at, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("products")
      .select("id, name, mode, turn_limit, valid_for, description")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("persona_catalog")
      .select("id, display_name, role")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  return {
    data: {
      orders: ordersResult.data ?? [],
      entitlements: entitlementsResult.data ?? [],
      products: productsResult.data ?? [],
      personas: personasResult.data ?? [],
    },
    error: ordersResult.error ?? entitlementsResult.error ?? productsResult.error ?? personasResult.error ?? null,
  };
}

export async function completePortonePayment(session, payload) {
  const supabase = getSupabaseClient();
  if (!supabase || !session?.user) {
    return { data: null, error: new Error("로그인 후 결제 완료를 확인할 수 있습니다.") };
  }

  const { data, error } = await supabase.functions.invoke("complete-portone-payment", {
    body: payload,
  });

  return { data: data ?? null, error: await normalizeFunctionError(error) };
}

export async function sendConsultationMessage(session, payload) {
  const supabase = getSupabaseClient();
  if (!supabase || !session?.user) {
    return { data: null, error: new Error("로그인 후 AI 상담 메시지를 보낼 수 있습니다.") };
  }

  const { data, error } = await supabase.functions.invoke("send-consultation-message", {
    body: payload,
  });

  return { data: data ?? null, error: await normalizeFunctionError(error) };
}

export async function getConsultationMessages(session, sessionId) {
  const supabase = getSupabaseClient();
  if (!supabase || !session?.user || !sessionId) {
    return { messages: [], error: null };
  }

  const { data, error } = await supabase
    .from("consultation_messages")
    .select("id, role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(100);

  return { messages: data ?? [], error };
}

export function onAuthStateChange(callback) {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

export async function signUpWithPassword({ email, password, displayName }) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { data: null, error: new Error("Supabase 설정이 없습니다.") };
  }

  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const normalizedName = typeof displayName === "string" ? displayName.trim().slice(0, 40) : "";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
      data: normalizedName ? { name: normalizedName } : undefined,
    },
  });

  return { data: data ?? null, error };
}

export async function signInWithPassword({ email, password }) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { data: null, error: new Error("Supabase 설정이 없습니다.") };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data: data ?? null, error };
}

export async function requestPasswordReset(email) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { data: null, error: new Error("Supabase 설정이 없습니다.") };
  }

  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  return { data: data ?? null, error };
}

export async function signInWithOAuthProvider(provider) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: new Error("Supabase 설정이 없습니다.") };
  }

  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  return supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });
}

export async function signOut() {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: null };
  return supabase.auth.signOut();
}

export async function getAccountProfile(session) {
  const supabase = getSupabaseClient();
  const user = session?.user;
  if (!supabase || !user) {
    return { profile: null, error: null };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    profile: data
      ? {
          displayName: String(data.display_name ?? "").trim() || getDisplayNameFromUser(user) || "",
          role: data.role ?? "user",
        }
      : {
          displayName: getDisplayNameFromUser(user) || "",
          role: "user",
        },
    error,
  };
}

export async function getAdminDashboard(session) {
  const supabase = getSupabaseClient();
  if (!supabase || !session?.user) {
    return { data: null, error: new Error("로그인 후 관리자 화면을 확인할 수 있습니다.") };
  }

  const { data, error } = await supabase.functions.invoke("get-admin-dashboard", {
    body: {},
  });

  return { data: data ?? null, error: await normalizeFunctionError(error) };
}
