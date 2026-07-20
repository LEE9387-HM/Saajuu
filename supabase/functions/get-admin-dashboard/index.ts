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

function compactText(value: unknown, maxLength = 96) {
  const normalized = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trim()}…`;
}

function clampLimit(value: unknown, fallback = 8, max = 40) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), max);
}

function buildSessionSearchTerm(input: {
  userLabel?: string;
  topic?: string;
  mode?: string;
  status?: string;
  summarySnippet?: string;
  lastUserMessageSnippet?: string;
  lastAssistantMessageSnippet?: string;
}) {
  return [
    input.userLabel,
    input.topic,
    input.mode,
    input.status,
    input.summarySnippet,
    input.lastUserMessageSnippet,
    input.lastAssistantMessageSnippet,
  ]
    .map((value) => String(value ?? "").trim().toLowerCase())
    .filter(Boolean)
    .join(" ");
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

  const body = await request.json().catch(() => ({}));
  const sessionLimit = clampLimit(body?.sessionLimit, 8);
  const profileLimit = clampLimit(body?.profileLimit, 8);
  const entitlementLimit = clampLimit(body?.entitlementLimit, 8);
  const orderLimit = clampLimit(body?.orderLimit, 8);
  const safetyLimit = clampLimit(body?.safetyLimit, 8);
  const actionLogLimit = clampLimit(body?.actionLogLimit, 8);
  const searchQuery = String(body?.searchQuery ?? "").trim().toLowerCase();
  const detailSessionId = String(body?.detailSessionId ?? "").trim();

  const [
    totalUsersResult,
    totalLinksResult,
    totalSessionsResult,
    activeSessionsResult,
    totalPaidOrdersResult,
    activeEntitlementsResult,
    consumedEntitlementsResult,
    totalSafetyEventsResult,
    reviewedSafetyEventsResult,
    recentProfilesResult,
    recentSessionsResult,
    recentEntitlementsResult,
    recentOrdersResult,
    recentSafetyEventsResult,
    recentActionLogsResult,
  ] = await Promise.all([
    adminClient.from("profiles").select("id", { count: "exact", head: true }),
    adminClient.from("relationship_links").select("id", { count: "exact", head: true }).eq("status", "active"),
    adminClient.from("consultation_sessions").select("id", { count: "exact", head: true }),
    adminClient.from("consultation_sessions").select("id", { count: "exact", head: true }).eq("status", "active"),
    adminClient.from("orders").select("id", { count: "exact", head: true }).eq("status", "paid"),
    adminClient.from("entitlements").select("id", { count: "exact", head: true }).eq("status", "active"),
    adminClient.from("entitlements").select("id", { count: "exact", head: true }).eq("status", "consumed"),
    adminClient.from("safety_events").select("id", { count: "exact", head: true }),
    adminClient.from("safety_events").select("id", { count: "exact", head: true }).not("reviewed_at", "is", null),
    adminClient
      .from("profiles")
      .select("id, display_name, role, created_at")
      .order("created_at", { ascending: false })
      .limit(profileLimit),
    adminClient
      .from("consultation_sessions")
      .select("id, user_id, persona_id, topic, mode, status, used_turns, turn_limit, created_at")
      .order("created_at", { ascending: false })
      .limit(sessionLimit),
    adminClient
      .from("entitlements")
      .select("id, user_id, product_id, status, total_turns, used_turns, expires_at, created_at")
      .order("created_at", { ascending: false })
      .limit(entitlementLimit),
    adminClient
      .from("orders")
      .select("id, user_id, product_id, provider_order_id, provider_payment_id, amount_krw, status, created_at")
      .order("created_at", { ascending: false })
      .limit(orderLimit),
    adminClient
      .from("safety_events")
      .select("id, user_id, session_id, level, category, action, reviewed_at, reviewed_by, created_at")
      .order("created_at", { ascending: false })
      .limit(safetyLimit),
    adminClient
      .from("admin_action_logs")
      .select("id, admin_user_id, action_type, target_type, target_id, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(actionLogLimit),
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
    reviewedSafetyEventsResult.error,
    recentProfilesResult.error,
    recentSessionsResult.error,
    recentEntitlementsResult.error,
    recentOrdersResult.error,
    recentSafetyEventsResult.error,
    recentActionLogsResult.error,
  ].find(Boolean);

  if (firstError) return json({ error: firstError.message }, 500);

  const userIds = [
    ...new Set(
      [
        ...(recentSessionsResult.data ?? []).map((item) => item.user_id),
        ...(recentEntitlementsResult.data ?? []).map((item) => item.user_id),
        ...(recentOrdersResult.data ?? []).map((item) => item.user_id),
        ...(recentSafetyEventsResult.data ?? []).map((item) => item.user_id).filter(Boolean),
        ...(recentSafetyEventsResult.data ?? []).map((item) => item.reviewed_by).filter(Boolean),
        ...(recentActionLogsResult.data ?? []).map((item) => item.admin_user_id).filter(Boolean),
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

  const sessionSummaryMap = new Map<
    string,
    { summary: string; options: unknown[]; actionPlan: unknown[]; updatedAt: string | null }
  >();
  const sessionLastUserMessageMap = new Map<string, string>();
  const sessionLastAssistantMessageMap = new Map<string, string>();
  const recentSessionIds = (recentSessionsResult.data ?? []).map((item) => item.id).filter(Boolean);
  const entitlementByOrderId = new Map<string, { id: string; status: string; usedTurns: number; totalTurns: number }>();

  const recentOrderIds = (recentOrdersResult.data ?? []).map((item) => item.id).filter(Boolean);
  if (recentOrderIds.length) {
    const { data: linkedEntitlements, error: linkedEntitlementsError } = await adminClient
      .from("entitlements")
      .select("id, order_id, status, used_turns, total_turns")
      .in("order_id", recentOrderIds);
    if (linkedEntitlementsError) return json({ error: linkedEntitlementsError.message }, 500);
    (linkedEntitlements ?? []).forEach((item) => {
      if (item.order_id) {
        entitlementByOrderId.set(item.order_id, {
          id: item.id,
          status: item.status,
          usedTurns: item.used_turns,
          totalTurns: item.total_turns,
        });
      }
    });
  }

  if (recentSessionIds.length) {
    const { data: sessionSummaries, error: sessionSummariesError } = await adminClient
      .from("session_summaries")
      .select("session_id, summary, options, action_plan, updated_at")
      .in("session_id", recentSessionIds);
    if (sessionSummariesError) return json({ error: sessionSummariesError.message }, 500);
    (sessionSummaries ?? []).forEach((item) => {
      sessionSummaryMap.set(item.session_id, {
        summary: compactText(item.summary),
        options: Array.isArray(item.options) ? item.options : [],
        actionPlan: Array.isArray(item.action_plan) ? item.action_plan : [],
        updatedAt: item.updated_at ?? null,
      });
    });

    const { data: recentUserMessages, error: recentUserMessagesError } = await adminClient
      .from("consultation_messages")
      .select("session_id, role, content, created_at")
      .eq("role", "user")
      .in("session_id", recentSessionIds)
      .order("created_at", { ascending: false });
    if (recentUserMessagesError) return json({ error: recentUserMessagesError.message }, 500);
    (recentUserMessages ?? []).forEach((item) => {
      if (!sessionLastUserMessageMap.has(item.session_id)) {
        sessionLastUserMessageMap.set(item.session_id, compactText(item.content, 72));
      }
    });

    const { data: recentAssistantMessages, error: recentAssistantMessagesError } = await adminClient
      .from("consultation_messages")
      .select("session_id, role, content, created_at")
      .eq("role", "assistant")
      .in("session_id", recentSessionIds)
      .order("created_at", { ascending: false });
    if (recentAssistantMessagesError) return json({ error: recentAssistantMessagesError.message }, 500);
    (recentAssistantMessages ?? []).forEach((item) => {
      if (!sessionLastAssistantMessageMap.has(item.session_id)) {
        sessionLastAssistantMessageMap.set(item.session_id, compactText(item.content, 72));
      }
    });
  }

  let sessionDetail: Record<string, unknown> | null = null;
  if (detailSessionId) {
    const { data: sessionRow, error: sessionRowError } = await adminClient
      .from("consultation_sessions")
      .select("id, user_id, persona_id, topic, mode, status, used_turns, turn_limit, metadata, created_at")
      .eq("id", detailSessionId)
      .maybeSingle();
    if (sessionRowError) return json({ error: sessionRowError.message }, 500);

    if (sessionRow) {
      const [summaryResult, messagesResult, safetyResult] = await Promise.all([
        adminClient
          .from("session_summaries")
          .select("summary, options, action_plan, updated_at")
          .eq("session_id", detailSessionId)
          .maybeSingle(),
        adminClient
          .from("consultation_messages")
          .select("role, content, created_at")
          .eq("session_id", detailSessionId)
          .order("created_at", { ascending: false })
          .limit(12),
        adminClient
          .from("safety_events")
          .select("id, level, category, action, reviewed_at, created_at")
          .eq("session_id", detailSessionId)
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      const detailError = [summaryResult.error, messagesResult.error, safetyResult.error].find(Boolean);
      if (detailError) return json({ error: detailError.message }, 500);

      sessionDetail = {
        id: sessionRow.id,
        userId: sessionRow.user_id,
        userLabel: profileNameMap.get(sessionRow.user_id) ?? compactUserId(sessionRow.user_id),
        personaId: sessionRow.persona_id,
        topic: sessionRow.topic,
        mode: sessionRow.mode,
        status: sessionRow.status,
        usedTurns: sessionRow.used_turns,
        turnLimit: sessionRow.turn_limit,
        createdAt: sessionRow.created_at,
        metadata: sessionRow.metadata ?? {},
        summary: summaryResult.data?.summary ?? "",
        options: Array.isArray(summaryResult.data?.options) ? summaryResult.data?.options : [],
        actionPlan: Array.isArray(summaryResult.data?.action_plan) ? summaryResult.data?.action_plan : [],
        summaryUpdatedAt: summaryResult.data?.updated_at ?? null,
        messages: (messagesResult.data ?? []).map((item) => ({
          role: item.role,
          content: item.content,
          createdAt: item.created_at,
        })),
        safetyEvents: (safetyResult.data ?? []).map((item) => ({
          id: item.id,
          level: item.level,
          category: item.category,
          action: item.action,
          reviewedAt: item.reviewed_at,
          createdAt: item.created_at,
        })),
      };
    }
  }

  let recentSessions = (recentSessionsResult.data ?? []).map((item) => {
    const summaryInfo = sessionSummaryMap.get(item.id);
    return {
      id: item.id,
      userId: item.user_id,
      userLabel: profileNameMap.get(item.user_id) ?? compactUserId(item.user_id),
      personaId: item.persona_id,
      topic: item.topic,
      mode: item.mode,
      status: item.status,
      usedTurns: item.used_turns,
      turnLimit: item.turn_limit,
      summarySnippet: summaryInfo?.summary ?? "",
      lastUserMessageSnippet: sessionLastUserMessageMap.get(item.id) ?? "",
      lastAssistantMessageSnippet: sessionLastAssistantMessageMap.get(item.id) ?? "",
      createdAt: item.created_at,
    };
  });

  if (searchQuery) {
    recentSessions = recentSessions.filter((item) =>
      buildSessionSearchTerm(item).includes(searchQuery),
    );
  }

  return json({
    fetchedAt: new Date().toISOString(),
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
      reviewedSafetyEvents: reviewedSafetyEventsResult.count ?? 0,
    },
    recentProfiles: (recentProfilesResult.data ?? []).map((item) => ({
      id: item.id,
      displayName: compactName(item.display_name),
      role: item.role,
      createdAt: item.created_at,
    })),
    recentSessions,
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
      providerOrderId: item.provider_order_id,
      providerPaymentId: item.provider_payment_id,
      amountKrw: item.amount_krw,
      status: item.status,
      linkedEntitlement: entitlementByOrderId.get(item.id) ?? null,
      createdAt: item.created_at,
    })),
    recentSafetyEvents: (recentSafetyEventsResult.data ?? []).map((item) => ({
      id: item.id,
      userId: item.user_id,
      sessionId: item.session_id,
      userLabel: item.user_id
        ? profileNameMap.get(item.user_id) ?? compactUserId(item.user_id)
        : "연결 계정 없음",
      level: item.level,
      category: item.category,
      action: item.action,
      reviewedAt: item.reviewed_at,
      reviewedByLabel: item.reviewed_by
        ? profileNameMap.get(item.reviewed_by) ?? compactUserId(item.reviewed_by)
        : "",
      createdAt: item.created_at,
    })),
    recentActionLogs: (recentActionLogsResult.data ?? []).map((item) => ({
      id: item.id,
      adminUserId: item.admin_user_id,
      adminLabel: item.admin_user_id
        ? profileNameMap.get(item.admin_user_id) ?? compactUserId(item.admin_user_id)
        : "관리자 계정 없음",
      actionType: item.action_type,
      targetType: item.target_type,
      targetId: item.target_id,
      metadata: item.metadata ?? {},
      createdAt: item.created_at,
    })),
    sessionDetail,
  });
});
