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

const paidProducts = new Set(["basic_10_turns", "pro_20_turns"]);

type Product = {
  id: string;
  name: string;
  mode: "basic" | "pro";
  price_krw: number;
  turn_limit: number;
  valid_for: string;
  description: string | null;
};

type Persona = {
  id: string;
  display_name: string;
  role: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function createProviderOrderId() {
  return `saajuu_${crypto.randomUUID().replaceAll("-", "")}`;
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

  let payload: { productId?: string; personaId?: string };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const productId = typeof payload.productId === "string" ? payload.productId.trim() : "";
  if (!paidProducts.has(productId)) return json({ error: "Invalid paid consultation product" }, 400);
  const personaId = typeof payload.personaId === "string" ? payload.personaId.trim() : "";

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

  const { data: product, error: productError } = await adminClient
    .from("products")
    .select("id, name, mode, price_krw, turn_limit, valid_for, description")
    .eq("id", productId)
    .eq("is_active", true)
    .in("mode", ["basic", "pro"])
    .single<Product>();

  if (productError || !product) return json({ error: productError?.message ?? "Product not found" }, 500);

  let persona: Persona | null = null;
  if (personaId) {
    const { data: personaData, error: personaError } = await adminClient
      .from("persona_catalog")
      .select("id, display_name, role")
      .eq("id", personaId)
      .eq("is_active", true)
      .single<Persona>();

    if (personaError || !personaData) {
      return json({ error: personaError?.message ?? "Persona not found" }, 400);
    }

    persona = personaData;
  }

  const providerOrderId = createProviderOrderId();
  const { data: order, error: orderError } = await adminClient
    .from("orders")
    .insert({
      user_id: currentUser.id,
      product_id: product.id,
      provider: "portone",
      provider_order_id: providerOrderId,
      amount_krw: product.price_krw,
      status: "pending",
      metadata: {
        checkout_status: "ready",
        product_mode: product.mode,
        requested_from: "web",
        persona_id: persona?.id ?? null,
        persona_name: persona?.display_name ?? null,
        persona_role: persona?.role ?? null,
      },
    })
    .select("id, product_id, provider, provider_order_id, amount_krw, status, created_at")
    .single();

  if (orderError) return json({ error: orderError.message }, 500);

  return json({
    order,
    product,
    checkout: {
      status: "ready",
      message: "PortOne 결제창을 열 수 있습니다.",
    },
  });
});
