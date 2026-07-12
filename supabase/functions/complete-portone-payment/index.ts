import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.2";
import { fetchPortonePayment, finalizePortonePayment } from "../_shared/portone.ts";

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
  const portoneApiSecret = Deno.env.get("PORTONE_API_SECRET");

  if (!supabaseUrl || !anonKey || !serviceRoleKey || !portoneApiSecret) {
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

  let payload: { paymentId?: string };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const paymentId = typeof payload.paymentId === "string" ? payload.paymentId.trim() : "";
  if (!paymentId) return json({ error: "paymentId is required" }, 400);

  try {
    const payment = await fetchPortonePayment(portoneApiSecret, paymentId);
    const result = await finalizePortonePayment(adminClient, payment, {
      expectedUserId: currentUser.id,
      source: "browser_complete",
    });
    return json({
      order: result.order,
      entitlement: result.entitlement,
      payment: {
        id: result.payment.id ?? result.payment.paymentId,
        status: result.status,
        amount: result.payment.amount,
      },
      finalized: result.finalized,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Payment verification failed" }, 400);
  }
});
