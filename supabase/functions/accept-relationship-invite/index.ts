import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type RelationshipInvite = {
  id: string;
  inviter_user_id: string;
  relationship: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
};

function fallbackDisplayName(value: string | null | undefined) {
  const name = String(value ?? "").trim();
  return name || "연결된 상대";
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
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

  let payload: { inviteToken?: string };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const inviteToken = payload.inviteToken?.trim();
  if (!inviteToken || inviteToken.length < 32) return json({ error: "Invalid invite token" }, 400);

  const inviteTokenHash = await sha256Hex(inviteToken);
  const { data: invite, error: inviteError } = await adminClient
    .from("relationship_invites")
    .select("id, inviter_user_id, relationship, expires_at, accepted_at, revoked_at")
    .eq("invite_token_hash", inviteTokenHash)
    .maybeSingle<RelationshipInvite>();

  if (inviteError) return json({ error: inviteError.message }, 500);
  if (!invite) return json({ error: "Invite not found" }, 404);
  if (invite.inviter_user_id === currentUser.id) return json({ error: "Cannot accept your own invite" }, 400);
  if (invite.revoked_at) return json({ error: "Invite revoked" }, 400);
  if (invite.accepted_at) return json({ error: "Invite already accepted" }, 409);
  if (new Date(invite.expires_at).getTime() <= Date.now()) return json({ error: "Invite expired" }, 400);

  const { data: claimedInvite, error: claimError } = await adminClient
    .from("relationship_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id)
    .is("accepted_at", null)
    .select("id")
    .maybeSingle();

  if (claimError) return json({ error: claimError.message }, 500);
  if (!claimedInvite) return json({ error: "Invite already accepted" }, 409);

  const pair = [invite.inviter_user_id, currentUser.id].sort();
  const { data: existingLink, error: existingError } = await adminClient
    .from("relationship_links")
    .select("id, relationship, accepted_at")
    .eq("status", "active")
    .eq("relationship", invite.relationship)
    .or(`and(user_a_id.eq.${pair[0]},user_b_id.eq.${pair[1]}),and(user_a_id.eq.${pair[1]},user_b_id.eq.${pair[0]})`)
    .maybeSingle();

  if (existingError) return json({ error: existingError.message }, 500);
  const counterpartProfileId = invite.inviter_user_id;
  const { data: counterpartProfile, error: counterpartError } = await adminClient
    .from("profiles")
    .select("display_name")
    .eq("id", counterpartProfileId)
    .maybeSingle();
  if (counterpartError) return json({ error: counterpartError.message }, 500);
  const counterpartDisplayName = fallbackDisplayName(counterpartProfile?.display_name);

  if (existingLink) {
    return json({
      linkId: existingLink.id,
      relationship: existingLink.relationship,
      inviterUserId: invite.inviter_user_id,
      inviteeUserId: currentUser.id,
      acceptedAt: existingLink.accepted_at,
      counterpartDisplayName,
    });
  }

  const { data: link, error: linkError } = await adminClient
    .from("relationship_links")
    .insert({
      user_a_id: invite.inviter_user_id,
      user_b_id: currentUser.id,
      relationship: invite.relationship,
      status: "active",
      requested_by: invite.inviter_user_id,
      accepted_at: new Date().toISOString(),
    })
    .select("id, relationship, accepted_at")
    .single();

  if (linkError) return json({ error: linkError.message }, 500);

  return json({
    linkId: link.id,
    relationship: link.relationship,
    inviterUserId: invite.inviter_user_id,
    inviteeUserId: currentUser.id,
    acceptedAt: link.accepted_at,
    counterpartDisplayName,
  });
});
