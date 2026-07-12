import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.2";
import { Webhook } from "jsr:@portone/server-sdk@0.19.0";
import { fetchPortonePayment, finalizePortonePayment } from "../_shared/portone.ts";

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const portoneApiSecret = Deno.env.get("PORTONE_API_SECRET");
  const portoneWebhookSecret = Deno.env.get("PORTONE_WEBHOOK_SECRET");

  if (!supabaseUrl || !serviceRoleKey || !portoneApiSecret || !portoneWebhookSecret) {
    return new Response("Function secrets are not configured", { status: 500 });
  }

  const payload = await request.text();
  let webhook: unknown;
  try {
    webhook = await Webhook.verify(portoneWebhookSecret, payload, {
      "webhook-id": request.headers.get("webhook-id") ?? "",
      "webhook-signature": request.headers.get("webhook-signature") ?? "",
      "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
    });
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  const typedWebhook = webhook as { type?: string; data?: { paymentId?: string } };
  const paymentId = typedWebhook.data?.paymentId;
  if (!paymentId) return new Response("ok", { status: 200 });

  if (typedWebhook.type !== "Transaction.Paid" && typedWebhook.type !== "Transaction.VirtualAccountIssued") {
    return new Response("ok", { status: 200 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const payment = await fetchPortonePayment(portoneApiSecret, paymentId);
    await finalizePortonePayment(adminClient, payment, { source: "webhook" });
    return new Response("ok", { status: 200 });
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Webhook handling failed", { status: 400 });
  }
});
