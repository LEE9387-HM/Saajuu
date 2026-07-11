import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL ?? "";
const supabaseKey =
  import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env?.VITE_SUPABASE_ANON_KEY ?? "";

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
