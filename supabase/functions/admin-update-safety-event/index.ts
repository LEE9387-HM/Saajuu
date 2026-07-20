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
  if (!isAdmin) return json({ error: "Admin access required", code: "admin_only" }, 403);

  const body = await request.json().catch(() => ({}));
  const safetyEventId = String(body?.safetyEventId ?? "").trim();
  if (!safetyEventId) {
    return json({ error: "safetyEventId is required" }, 400);
  }

  const now = new Date().toISOString();
  const { data: updatedSafetyEvent, error: updateError } = await adminClient
    .from("safety_events")
    .update({
      reviewed_at: now,
      reviewed_by: currentUser.id,
    })
    .eq("id", safetyEventId)
    .select("id, reviewed_at, reviewed_by")
    .maybeSingle();

  if (updateError) return json({ error: updateError.message }, 500);
  if (!updatedSafetyEvent) return json({ error: "Safety event not found" }, 404);

  const { error: logError } = await adminClient.from("admin_action_logs").insert({
    admin_user_id: currentUser.id,
    action_type: "review_safety_event",
    target_type: "safety_event",
    target_id: safetyEventId,
    metadata: {
      reviewerEmail: currentUser.email ?? "",
      reviewerDisplayName: profile?.display_name ?? "",
    },
  });
  if (logError) return json({ error: logError.message }, 500);

  return json({
    ok: true,
    reviewedAt: updatedSafetyEvent.reviewed_at,
    reviewedBy: updatedSafetyEvent.reviewed_by,
  });
});
