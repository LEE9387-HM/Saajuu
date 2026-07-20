import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

function compactName(value: unknown) {
  const trimmed = String(value ?? "").trim();
  return trimmed || "이름 없음";
}

function compactUserId(value: string) {
  return `${value.slice(0, 8)}…`;
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

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("display_name, role")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (profileError) return json({ error: profileError.message }, 500);

  const adminEmails = normalizeAdminEmails(Deno.env.get("ADMIN_EMAILS"));
  const isAdmin =
    profile?.role === "admin" || adminEmails.has(String(currentUser.email ?? "").trim().toLowerCase());

  if (!isAdmin) {
    return json({ error: "Admin access required", code: "admin_only" }, 403);
  }

  const [
    totalUsersResult,
    totalLinksResult,
    totalSessionsResult,
    activeSessionsResult,
    totalPaidOrdersResult,
    activeEntitlementsResult,
    consumedEntitlementsResult,
    totalSafetyEventsResult,
    recentProfilesResult,
    recentSessionsResult,
    recentEntitlementsResult,
    recentOrdersResult,
    recentSafetyEventsResult,
  ] = await Promise.all([
    adminClient.from("profiles").select("id", { count: "exact", head: true }),
    adminClient.from("relationship_links").select("id", { count: "exact", head: true }).eq("status", "active"),
    adminClient.from("consultation_sessions").select("id", { count: "exact", head: true }),
    adminClient.from("consultation_sessions").select("id", { count: "exact", head: true }).eq("status", "active"),
    adminClient.from("orders").select("id", { count: "exact", head: true }).eq("status", "paid"),
    adminClient.from("entitlements").select("id", { count: "exact", head: true }).eq("status", "active"),
    adminClient.from("entitlements").select("id", { count: "exact", head: true }).eq("status", "consumed"),
    adminClient.from("safety_events").select("id", { count: "exact", head: true }),
    adminClient
      .from("profiles")
      .select("id, display_name, role, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    adminClient
      .from("consultation_sessions")
      .select("id, user_id, persona_id, topic, mode, status, used_turns, turn_limit, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    adminClient
      .from("entitlements")
      .select("id, user_id, product_id, status, total_turns, used_turns, expires_at, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    adminClient
      .from("orders")
      .select("id, user_id, product_id, amount_krw, status, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    adminClient
      .from("safety_events")
      .select("id, user_id, level, category, action, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const firstError = [
    totalUsersResult.error,
    totalLinksResult.error,
    totalSessionsResult.error,
    activeSessionsResult.error,
    totalPaidOrdersResult.error,
    activeEntitlementsResult.error,
    consumedEntitlementsResult.error,
    totalSafetyEventsResult.error,
    recentProfilesResult.error,
    recentSessionsResult.error,
    recentEntitlementsResult.error,
    recentOrdersResult.error,
    recentSafetyEventsResult.error,
  ].find(Boolean);

  if (firstError) return json({ error: firstError.message }, 500);

  const userIds = [
    ...new Set(
      [
        ...(recentSessionsResult.data ?? []).map((item) => item.user_id),
        ...(recentEntitlementsResult.data ?? []).map((item) => item.user_id),
        ...(recentOrdersResult.data ?? []).map((item) => item.user_id),
        ...(recentSafetyEventsResult.data ?? []).map((item) => item.user_id).filter(Boolean),
      ].filter(Boolean),
    ),
  ];

  const profileNameMap = new Map<string, string>();
  if (userIds.length) {
    const { data: linkedProfiles, error: linkedProfilesError } = await adminClient
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);
    if (linkedProfilesError) return json({ error: linkedProfilesError.message }, 500);
    (linkedProfiles ?? []).forEach((item) => {
      profileNameMap.set(item.id, compactName(item.display_name));
    });
  }

  return json({
    currentAdmin: {
      email: currentUser.email ?? "",
      displayName: compactName(profile?.display_name ?? currentUser.email?.split("@")[0]),
      role: profile?.role === "admin" ? "admin" : "bootstrap_admin",
    },
    stats: {
      totalUsers: totalUsersResult.count ?? 0,
      activeRelationships: totalLinksResult.count ?? 0,
      totalConsultationSessions: totalSessionsResult.count ?? 0,
      activeConsultationSessions: activeSessionsResult.count ?? 0,
      paidOrders: totalPaidOrdersResult.count ?? 0,
      activeEntitlements: activeEntitlementsResult.count ?? 0,
      consumedEntitlements: consumedEntitlementsResult.count ?? 0,
      safetyEvents: totalSafetyEventsResult.count ?? 0,
    },
    recentProfiles: (recentProfilesResult.data ?? []).map((item) => ({
      id: item.id,
      displayName: compactName(item.display_name),
      role: item.role,
      createdAt: item.created_at,
    })),
    recentSessions: (recentSessionsResult.data ?? []).map((item) => ({
      id: item.id,
      userId: item.user_id,
      userLabel: profileNameMap.get(item.user_id) ?? compactUserId(item.user_id),
      personaId: item.persona_id,
      topic: item.topic,
      mode: item.mode,
      status: item.status,
      usedTurns: item.used_turns,
      turnLimit: item.turn_limit,
      createdAt: item.created_at,
    })),
    recentEntitlements: (recentEntitlementsResult.data ?? []).map((item) => ({
      id: item.id,
      userId: item.user_id,
      userLabel: profileNameMap.get(item.user_id) ?? compactUserId(item.user_id),
      productId: item.product_id,
      status: item.status,
      totalTurns: item.total_turns,
      usedTurns: item.used_turns,
      expiresAt: item.expires_at,
      createdAt: item.created_at,
    })),
    recentOrders: (recentOrdersResult.data ?? []).map((item) => ({
      id: item.id,
      userId: item.user_id,
      userLabel: profileNameMap.get(item.user_id) ?? compactUserId(item.user_id),
      productId: item.product_id,
      amountKrw: item.amount_krw,
      status: item.status,
      createdAt: item.created_at,
    })),
    recentSafetyEvents: (recentSafetyEventsResult.data ?? []).map((item) => ({
      id: item.id,
      userId: item.user_id,
      userLabel: item.user_id
        ? profileNameMap.get(item.user_id) ?? compactUserId(item.user_id)
        : "알 수 없음",
      level: item.level,
      category: item.category,
      action: item.action,
      createdAt: item.created_at,
    })),
  });
});
