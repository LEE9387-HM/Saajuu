import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const requiredConsents = [
  { type: "terms", version: "2026-07-11" },
  { type: "privacy", version: "2026-07-11" },
  { type: "ai_notice", version: "2026-07-11" },
];

const allowedPersonas = new Set(["miseon", "junho", "seongu"]);
const allowedTopics = new Set(["relationship", "marriage", "business", "career", "family", "yearly"]);
const allowedModes = new Set(["trial", "basic", "pro"]);

type Product = {
  id: string;
  mode: "trial" | "basic" | "pro";
  turn_limit: number;
  valid_for: string;
};

type EntitlementRow = {
  id: string;
  product_id: string;
  status: "active" | "expired" | "consumed" | "revoked";
  total_turns: number;
  used_turns: number;
  expires_at: string;
  product: Product | null;
};

type SessionRow = {
  id: string;
  persona_id: string;
  mode: "trial" | "basic" | "pro";
  topic: string;
  status: string;
  turn_limit: number;
  used_turns: number;
  entitlement_id?: string | null;
  expires_at?: string | null;
  created_at?: string;
  metadata?: Record<string, unknown> | null;
};

type ContextMeta = {
  source: "manual" | "relationship_link";
  relationship?: string;
  counterpartDisplayName?: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sanitizeConcern(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed ? trimmed.slice(0, 220) : null;
}

function sanitizeContextMeta(value: unknown): ContextMeta {
  if (!value || typeof value !== "object") return { source: "manual" };

  const source = value.source === "relationship_link" ? "relationship_link" : "manual";
  const relationship = typeof value.relationship === "string" ? value.relationship.trim().slice(0, 40) : undefined;
  const counterpartDisplayName =
    typeof value.counterpartDisplayName === "string"
      ? value.counterpartDisplayName.trim().replace(/\s+/g, " ").slice(0, 40)
      : undefined;

  return {
    source,
    relationship,
    counterpartDisplayName,
  };
}

function addIntervalFallback() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "Function secrets are not configured" }, 500);
  }

  const authorization = request.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  const currentUser = userData.user;
  if (userError || !currentUser) return json({ error: "Authentication required" }, 401);

  let payload: {
    personaId?: string;
    mode?: string;
    topic?: string;
    concernSummary?: string;
    contextMeta?: ContextMeta;
    entitlementId?: string | null;
    productId?: string | null;
  };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const personaId = payload.personaId ?? "miseon";
  const mode = (payload.mode ?? "trial").trim();
  const topic = payload.topic ?? "relationship";
  const concernSummary = sanitizeConcern(payload.concernSummary);
  const contextMeta = sanitizeContextMeta(payload.contextMeta);
  const entitlementId = typeof payload.entitlementId === "string" ? payload.entitlementId.trim() : "";
  const productId = typeof payload.productId === "string" ? payload.productId.trim() : "";

  if (!allowedPersonas.has(personaId)) return json({ error: "Invalid persona" }, 400);
  if (!allowedTopics.has(topic)) return json({ error: "Invalid topic" }, 400);
  if (!allowedModes.has(mode)) return json({ error: "Invalid consultation mode" }, 400);

  const consentTypes = requiredConsents.map((consent) => consent.type);
  const { data: consentRows, error: consentError } = await adminClient
    .from("consent_logs")
    .select("consent_type, consent_version, accepted")
    .eq("user_id", currentUser.id)
    .eq("accepted", true)
    .in("consent_type", consentTypes);

  if (consentError) return json({ error: consentError.message }, 500);

  const accepted = new Set(
    (consentRows ?? [])
      .filter((row) =>
        requiredConsents.some(
          (consent) => consent.type === row.consent_type && consent.version === row.consent_version,
        ),
      )
      .map((row) => row.consent_type),
  );

  if (!requiredConsents.every((consent) => accepted.has(consent.type))) {
    return json({ error: "Required consents are missing" }, 403);
  }

  if (mode === "trial") {
    const { data: existingSession, error: existingError } = await adminClient
      .from("consultation_sessions")
      .select("id, persona_id, mode, topic, status, turn_limit, used_turns, expires_at, created_at, metadata")
      .eq("user_id", currentUser.id)
      .eq("mode", "trial")
      .in("status", ["draft", "active"])
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<SessionRow>();

    if (existingError) return json({ error: existingError.message }, 500);
    if (existingSession) {
      return json({ session: existingSession, reused: true });
    }

    const { data: completedTrial, error: completedTrialError } = await adminClient
      .from("consultation_sessions")
      .select("id, status, turn_limit, used_turns, completed_at, created_at")
      .eq("user_id", currentUser.id)
      .eq("mode", "trial")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (completedTrialError) return json({ error: completedTrialError.message }, 500);
    if (completedTrial) {
      return json(
        {
          error: "무료 3턴 체험을 이미 사용했습니다.",
          code: "trial_used",
          session: completedTrial,
        },
        409,
      );
    }

    const { data: product, error: productError } = await adminClient
      .from("products")
      .select("id, mode, turn_limit, valid_for")
      .eq("id", "trial_3_turns")
      .eq("is_active", true)
      .single<Product>();

    if (productError || !product) return json({ error: productError?.message ?? "Trial product not found" }, 500);

    const { data: concern, error: concernError } = await adminClient
      .from("concerns")
      .insert({
        user_id: currentUser.id,
        topic,
        concern_summary: concernSummary,
        source: "consultation",
      })
      .select("id")
      .single();

    if (concernError) return json({ error: concernError.message }, 500);

    const { data: session, error: sessionError } = await adminClient
      .from("consultation_sessions")
      .insert({
        user_id: currentUser.id,
        persona_id: personaId,
        product_id: product.id,
        concern_id: concern.id,
        mode: "trial",
        topic,
        status: "active",
        turn_limit: product.turn_limit,
        used_turns: 0,
        metadata: { context: contextMeta },
        expires_at: addIntervalFallback(),
      })
      .select("id, persona_id, product_id, concern_id, mode, topic, status, turn_limit, used_turns, expires_at, created_at, metadata")
      .single<SessionRow>();

    if (sessionError) return json({ error: sessionError.message }, 500);

    return json({ session, reused: false });
  }

  const entitlementQuery = adminClient
    .from("entitlements")
    .select("id, product_id, status, total_turns, used_turns, expires_at, product:products(id, mode, turn_limit, valid_for)")
    .eq("user_id", currentUser.id)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  const filteredEntitlementQuery = entitlementId
    ? entitlementQuery.eq("id", entitlementId)
    : productId
      ? entitlementQuery.eq("product_id", productId)
      : entitlementQuery;

  const { data: entitlementRows, error: entitlementError } = await filteredEntitlementQuery.limit(10);
  if (entitlementError) return json({ error: entitlementError.message }, 500);

  const entitlement = (entitlementRows ?? []).find((item) => {
    const product = item.product as Product | null;
    const remainingTurns = Number(item.total_turns ?? 0) - Number(item.used_turns ?? 0);
    return product?.mode === mode && remainingTurns > 0;
  }) as EntitlementRow | undefined;

  if (!entitlement) {
    return json({ error: "No active entitlement is available for this consultation mode." }, 402);
  }

  const remainingTurns = Math.max(Number(entitlement.total_turns ?? 0) - Number(entitlement.used_turns ?? 0), 0);
  if (remainingTurns <= 0) {
    return json({ error: "This entitlement has already been used." }, 409);
  }

  const { data: existingPaidSession, error: existingPaidSessionError } = await adminClient
    .from("consultation_sessions")
    .select("id, persona_id, product_id, entitlement_id, concern_id, mode, topic, status, turn_limit, used_turns, expires_at, created_at, metadata")
    .eq("user_id", currentUser.id)
    .eq("entitlement_id", entitlement.id)
    .in("status", ["draft", "active"])
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<SessionRow>();

  if (existingPaidSessionError) return json({ error: existingPaidSessionError.message }, 500);
  if (existingPaidSession) {
    return json({ session: existingPaidSession, reused: true });
  }

  const { data: concern, error: concernError } = await adminClient
    .from("concerns")
    .insert({
      user_id: currentUser.id,
      topic,
      concern_summary: concernSummary,
      source: "consultation",
    })
    .select("id")
    .single();

  if (concernError) return json({ error: concernError.message }, 500);

  const { data: session, error: sessionError } = await adminClient
    .from("consultation_sessions")
    .insert({
      user_id: currentUser.id,
      persona_id: personaId,
      product_id: entitlement.product_id,
      entitlement_id: entitlement.id,
      concern_id: concern.id,
      mode,
      topic,
      status: "active",
      turn_limit: remainingTurns,
      used_turns: 0,
      metadata: { context: contextMeta, entry: "paid_entitlement" },
      expires_at: entitlement.expires_at,
    })
    .select("id, persona_id, product_id, entitlement_id, concern_id, mode, topic, status, turn_limit, used_turns, expires_at, created_at, metadata")
    .single<SessionRow>();

  if (sessionError) return json({ error: sessionError.message }, 500);

  return json({ session, reused: false });
});
