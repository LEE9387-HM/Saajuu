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

function fallbackDisplayName(value: string | null | undefined) {
  const name = String(value ?? "").trim();
  return name || "연결된 상대";
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

  const { data: links, error: linksError } = await adminClient
    .from("relationship_links")
    .select("id, user_a_id, user_b_id, relationship, status, accepted_at, created_at, user_a_label, user_b_label")
    .eq("status", "active")
    .or(`user_a_id.eq.${currentUser.id},user_b_id.eq.${currentUser.id}`)
    .order("created_at", { ascending: false })
    .limit(10);

  if (linksError) return json({ error: linksError.message }, 500);

  const counterpartIds = [
    ...new Set(
      (links ?? []).map((link) => (link.user_a_id === currentUser.id ? link.user_b_id : link.user_a_id)),
    ),
  ];

  const profileMap = new Map<string, string>();
  if (counterpartIds.length) {
    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("id, display_name")
      .in("id", counterpartIds);
    if (profilesError) return json({ error: profilesError.message }, 500);
    (profiles ?? []).forEach((profile) => {
      profileMap.set(profile.id, fallbackDisplayName(profile.display_name));
    });
  }

  return json({
    links: (links ?? []).map((link) => {
      const participantSide = link.user_a_id === currentUser.id ? "a" : "b";
      const counterpartUserId = link.user_a_id === currentUser.id ? link.user_b_id : link.user_a_id;
      const savedLabel = participantSide === "a" ? link.user_a_label : link.user_b_label;
      const counterpartDefaultName = profileMap.get(counterpartUserId) ?? "연결된 상대";
      return {
        id: link.id,
        relationship: link.relationship,
        status: link.status,
        acceptedAt: link.accepted_at,
        createdAt: link.created_at,
        participantSide,
        editableDisplayName: String(savedLabel ?? "").trim(),
        counterpartUserId,
        counterpartDefaultName,
        counterpartDisplayName: String(savedLabel ?? "").trim() || counterpartDefaultName,
      };
    }),
  });
});
