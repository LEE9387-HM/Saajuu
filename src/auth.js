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

export async function syncProfileForSession(session) {
  const supabase = getSupabaseClient();
  const user = session?.user;
  if (!supabase || !user) return { synced: false, error: null };

  const displayName =
    user.user_metadata?.name ??
    user.user_metadata?.full_name ??
    user.user_metadata?.nickname ??
    user.email?.split("@")[0] ??
    null;

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

  const { data, error } = await supabase
    .from("relationship_links")
    .select("id, user_a_id, user_b_id, relationship, status, accepted_at, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(10);

  return { links: data ?? [], error };
}

export async function createConsultationSession(session, payload) {
  const supabase = getSupabaseClient();
  if (!supabase || !session?.user) {
    return { data: null, error: new Error("로그인 후 무료 상담 체험을 시작할 수 있습니다.") };
  }

  const { data, error } = await supabase.functions.invoke("create-consultation-session", {
    body: payload,
  });

  return { data: data ?? null, error };
}

export async function sendConsultationMessage(session, payload) {
  const supabase = getSupabaseClient();
  if (!supabase || !session?.user) {
    return { data: null, error: new Error("로그인 후 AI 상담 메시지를 보낼 수 있습니다.") };
  }

  const { data, error } = await supabase.functions.invoke("send-consultation-message", {
    body: payload,
  });

  return { data: data ?? null, error };
}

export function onAuthStateChange(callback) {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
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
