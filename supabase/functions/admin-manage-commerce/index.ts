import { createClient } from "jsr:@supabase/supabase-js@2";
import { fetchPortonePayment, finalizePortonePayment } from "../_shared/portone.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type OrderRow = {
  id: string;
  user_id: string;
  product_id: string;
  provider: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  amount_krw: number;
  status: "pending" | "paid" | "failed" | "canceled" | "refunded";
  metadata: Record<string, unknown>;
  product: {
    id: string;
    name: string;
    mode: "basic" | "pro" | "trial";
    turn_limit: number;
    valid_for: string;
  } | null;
};

type EntitlementRow = {
  id: string;
  user_id: string;
  product_id: string;
  order_id: string | null;
  status: "active" | "expired" | "consumed" | "revoked";
  total_turns: number;
  used_turns: number;
  expires_at: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeAdminEmails(value: string | undefined) {
  return new Set(
    String(value ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

function addDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function validityDays(productMode: string) {
  if (productMode === "trial") return 1;
  return 7;
}

async function createEntitlementForOrder(adminClient: ReturnType<typeof createClient>, order: OrderRow) {
  if (!order.product) {
    throw new Error("Product data is missing for this order.");
  }

  const existingQuery = adminClient
    .from("entitlements")
    .select("id, user_id, product_id, order_id, status, total_turns, used_turns, expires_at") as {
      eq: (column: string, value: string) => { maybeSingle: () => Promise<{ data: EntitlementRow | null; error: Error | null }> };
    };
  const { data: existingEntitlement, error: existingError } = await existingQuery.eq("order_id", order.id).maybeSingle();
  if (existingError) throw existingError;
  if (existingEntitlement) return existingEntitlement;

  const { data: entitlement, error: entitlementError } = await (adminClient
    .from("entitlements")
    .insert({
      user_id: order.user_id,
      product_id: order.product_id,
      order_id: order.id,
      status: "active",
      total_turns: order.product.turn_limit,
      used_turns: 0,
      expires_at: addDays(validityDays(order.product.mode)),
    }) as {
    select: (columns: string) => { single: () => Promise<{ data: EntitlementRow; error: Error | null }> };
  })
    .select("id, user_id, product_id, order_id, status, total_turns, used_turns, expires_at")
    .single();
  if (entitlementError) throw entitlementError;
  return entitlement;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const portoneApiSecret = Deno.env.get("PORTONE_API_SECRET");
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

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("display_name, role")
    .eq("id", currentUser.id)
    .maybeSingle();
  if (profileError) return json({ error: profileError.message }, 500);

  const adminEmails = normalizeAdminEmails(Deno.env.get("ADMIN_EMAILS"));
  const isAdmin =
    profile?.role === "admin" || adminEmails.has(String(currentUser.email ?? "").trim().toLowerCase());
  if (!isAdmin) return json({ error: "Admin access required", code: "admin_only" }, 403);

  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!payload) return json({ error: "Invalid JSON body" }, 400);

  const action = String(payload.action ?? "").trim();
  const note = String(payload.note ?? "").trim();

  try {
    if (action === "grant_entitlement") {
      const userId = String(payload.userId ?? "").trim();
      const productId = String(payload.productId ?? "").trim();
      if (!userId || !productId) return json({ error: "userId and productId are required" }, 400);

      const { data: product, error: productError } = await adminClient
        .from("products")
        .select("id, mode, turn_limit, valid_for")
        .eq("id", productId)
        .eq("is_active", true)
        .single<{ id: string; mode: "basic" | "pro" | "trial"; turn_limit: number; valid_for: string }>();
      if (productError || !product) return json({ error: productError?.message ?? "Product not found" }, 404);

      const { data: entitlement, error: entitlementError } = await (adminClient
        .from("entitlements")
        .insert({
          user_id: userId,
          product_id: product.id,
          status: "active",
          total_turns: product.turn_limit,
          used_turns: 0,
          expires_at: addDays(validityDays(product.mode)),
        }) as {
        select: (columns: string) => { single: () => Promise<{ data: EntitlementRow; error: Error | null }> };
      })
        .select("id, user_id, product_id, order_id, status, total_turns, used_turns, expires_at")
        .single();
      if (entitlementError) throw entitlementError;

      const { error: logError } = await adminClient.from("admin_action_logs").insert({
        admin_user_id: currentUser.id,
        action_type: "grant_entitlement",
        target_type: "entitlement",
        target_id: entitlement.id,
        metadata: {
          user_id: userId,
          product_id: product.id,
          note,
        },
      });
      if (logError) throw logError;

      return json({ ok: true, action, entitlement });
    }

    if (action === "revoke_entitlement") {
      const entitlementId = String(payload.entitlementId ?? "").trim();
      if (!entitlementId) return json({ error: "entitlementId is required" }, 400);

      const { data: entitlement, error: entitlementError } = await (adminClient
        .from("entitlements")
        .update({ status: "revoked" })
        .eq("id", entitlementId)
        .select("id, user_id, product_id, order_id, status, total_turns, used_turns, expires_at")
        .maybeSingle()) as { data: EntitlementRow | null; error: Error | null };
      if (entitlementError) throw entitlementError;
      if (!entitlement) return json({ error: "Entitlement not found" }, 404);

      const { error: logError } = await adminClient.from("admin_action_logs").insert({
        admin_user_id: currentUser.id,
        action_type: "revoke_entitlement",
        target_type: "entitlement",
        target_id: entitlement.id,
        metadata: {
          user_id: entitlement.user_id,
          product_id: entitlement.product_id,
          note,
        },
      });
      if (logError) throw logError;

      return json({ ok: true, action, entitlement });
    }

    if (action === "recover_order") {
      const orderId = String(payload.orderId ?? "").trim();
      if (!orderId) return json({ error: "orderId is required" }, 400);

      const { data: order, error: orderError } = await (adminClient
        .from("orders")
        .select("id, user_id, product_id, provider, provider_order_id, provider_payment_id, amount_krw, status, metadata, product:products(id, name, mode, turn_limit, valid_for)")
        .eq("id", orderId)
        .maybeSingle()) as { data: OrderRow | null; error: Error | null };
      if (orderError) throw orderError;
      if (!order) return json({ error: "Order not found" }, 404);

      let recoveredEntitlement: EntitlementRow | null = null;
      let recoveryMode = "unknown";

      if (order.status === "paid") {
        recoveredEntitlement = await createEntitlementForOrder(adminClient, order);
        recoveryMode = "grant_missing_entitlement";
      } else {
        if (order.provider !== "portone") {
          return json({ error: "Only PortOne orders can be re-verified automatically." }, 400);
        }
        if (!portoneApiSecret) {
          return json({ error: "PORTONE_API_SECRET is not configured." }, 500);
        }
        const paymentLookupId = String(order.provider_payment_id ?? order.provider_order_id ?? "").trim();
        if (!paymentLookupId) {
          return json({ error: "No payment identifier is stored on this order." }, 409);
        }
        const payment = await fetchPortonePayment(portoneApiSecret, paymentLookupId);
        const finalized = await finalizePortonePayment(adminClient, payment, {
          expectedUserId: order.user_id,
          source: "webhook",
        });
        recoveredEntitlement = (finalized.entitlement as EntitlementRow | null) ?? null;
        recoveryMode = "verify_portone_payment";
      }

      const { error: logError } = await adminClient.from("admin_action_logs").insert({
        admin_user_id: currentUser.id,
        action_type: "recover_order",
        target_type: "order",
        target_id: order.id,
        metadata: {
          user_id: order.user_id,
          product_id: order.product_id,
          recovery_mode: recoveryMode,
          entitlement_id: recoveredEntitlement?.id ?? null,
          note,
        },
      });
      if (logError) throw logError;

      return json({
        ok: true,
        action,
        orderId: order.id,
        recoveryMode,
        entitlement: recoveredEntitlement,
      });
    }

    return json({ error: "Unsupported action" }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Admin commerce update failed" }, 500);
  }
});
