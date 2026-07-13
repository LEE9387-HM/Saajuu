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

  let payload: { linkId?: string; displayName?: string };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const linkId = String(payload.linkId ?? "").trim();
  const displayName = String(payload.displayName ?? "").trim().slice(0, 40);

  if (!linkId) return json({ error: "linkId is required" }, 400);
  if (!displayName) return json({ error: "displayName is required" }, 400);

  const { data: link, error: linkError } = await adminClient
    .from("relationship_links")
    .select("id, user_a_id, user_b_id, status")
    .eq("id", linkId)
    .maybeSingle();

  if (linkError) return json({ error: linkError.message }, 500);
  if (!link || link.status !== "active") return json({ error: "Relationship link not found" }, 404);

  let patch: Record<string, string>;
  if (link.user_a_id === currentUser.id) {
    patch = { user_a_label: displayName };
  } else if (link.user_b_id === currentUser.id) {
    patch = { user_b_label: displayName };
  } else {
    return json({ error: "Not allowed" }, 403);
  }

  const { error: updateError } = await adminClient
    .from("relationship_links")
    .update(patch)
    .eq("id", linkId);

  if (updateError) return json({ error: updateError.message }, 500);

  return json({ linkId, displayName });
});
