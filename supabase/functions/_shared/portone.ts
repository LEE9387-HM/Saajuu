const portonePaymentBaseUrl = "https://api.portone.io/payments";

type AdminClient = {
  from: (table: string) => {
    select: (columns: string) => unknown;
    update: (values: Record<string, unknown>) => unknown;
    insert: (values: Record<string, unknown>) => unknown;
  };
};

type OrderRow = {
  id: string;
  user_id: string;
  product_id: string;
  provider_order_id: string;
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
  };
};

type FinalizeOptions = {
  expectedUserId?: string;
  source: "browser_complete" | "webhook";
};

function getPaymentAmount(payment: Record<string, unknown>) {
  const amount = payment.amount as { total?: unknown } | undefined;
  return Number(amount?.total ?? NaN);
}

function addDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function validityDays(product: OrderRow["product"]) {
  if (product.mode === "trial") return 1;
  return 7;
}

export async function fetchPortonePayment(apiSecret: string, paymentId: string) {
  const paymentResponse = await fetch(`${portonePaymentBaseUrl}/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `PortOne ${apiSecret}` },
  });

  const payment = await paymentResponse.json().catch(() => null);
  if (!paymentResponse.ok || !payment) {
    throw new Error(`PortOne payment lookup failed: ${paymentResponse.status}`);
  }
  return payment as Record<string, unknown>;
}

export async function finalizePortonePayment(adminClient: AdminClient, payment: Record<string, unknown>, options: FinalizeOptions) {
  const paymentId = String(payment.id ?? payment.paymentId ?? "");
  if (!paymentId) throw new Error("Payment id is missing");

  const orderQuery = adminClient
    .from("orders")
    .select(
      "id, user_id, product_id, provider_order_id, provider_payment_id, amount_krw, status, metadata, product:products(id, name, mode, turn_limit, valid_for)",
    ) as {
      eq: (column: string, value: string) => { maybeSingle: () => Promise<{ data: OrderRow | null; error: Error | null }> };
    };
  const { data: order, error: orderError } = await orderQuery.eq("provider_order_id", paymentId).maybeSingle();

  if (orderError) throw orderError;
  if (!order) throw new Error("Order not found for payment");
  if (options.expectedUserId && order.user_id !== options.expectedUserId) {
    throw new Error("Order owner mismatch");
  }

  const paidAmount = getPaymentAmount(payment);
  if (!Number.isFinite(paidAmount) || paidAmount !== Number(order.amount_krw)) {
    await (adminClient
      .from("orders")
      .update({
        status: "failed",
        metadata: {
          ...(order.metadata ?? {}),
          portone_payment_status: payment.status,
          portone_amount_total: paidAmount,
          verification_source: options.source,
          verification_error: "amount_mismatch",
        },
      }) as { eq: (column: string, value: string) => Promise<unknown> }).eq("id", order.id);
    throw new Error("Payment amount mismatch");
  }

  const paymentStatus = String(payment.status ?? "");
  if (paymentStatus !== "PAID") {
    return {
      order,
      entitlement: null,
      payment,
      finalized: false,
      status: paymentStatus || "UNKNOWN",
    };
  }

  const { data: updatedOrder, error: updateError } = await (adminClient
    .from("orders")
    .update({
      status: "paid",
      provider_payment_id: paymentId,
      paid_at: new Date().toISOString(),
      metadata: {
        ...(order.metadata ?? {}),
        portone_payment_status: paymentStatus,
        portone_amount_total: paidAmount,
        verification_source: options.source,
      },
    }) as {
    eq: (column: string, value: string) => {
      select: (columns: string) => { single: () => Promise<{ data: OrderRow; error: Error | null }> };
    };
  })
    .eq("id", order.id)
    .select("id, user_id, product_id, provider_order_id, provider_payment_id, amount_krw, status, metadata, product:products(id, name, mode, turn_limit, valid_for)")
    .single();

  if (updateError) throw updateError;

  const existingQuery = adminClient
    .from("entitlements")
    .select("id, user_id, product_id, order_id, status, total_turns, used_turns, expires_at") as {
      eq: (column: string, value: string) => { maybeSingle: () => Promise<{ data: unknown; error: Error | null }> };
    };
  const { data: existingEntitlement, error: existingError } = await existingQuery.eq("order_id", order.id).maybeSingle();
  if (existingError) throw existingError;
  if (existingEntitlement) {
    return {
      order: updatedOrder,
      entitlement: existingEntitlement,
      payment,
      finalized: true,
      status: paymentStatus,
    };
  }

  const { data: entitlement, error: entitlementError } = await (adminClient
    .from("entitlements")
    .insert({
      user_id: order.user_id,
      product_id: order.product_id,
      order_id: order.id,
      status: "active",
      total_turns: order.product.turn_limit,
      used_turns: 0,
      expires_at: addDays(validityDays(order.product)),
    }) as {
    select: (columns: string) => { single: () => Promise<{ data: unknown; error: Error | null }> };
  })
    .select("id, user_id, product_id, order_id, status, total_turns, used_turns, expires_at")
    .single();

  if (entitlementError) throw entitlementError;

  return {
    order: updatedOrder,
    entitlement,
    payment,
    finalized: true,
    status: paymentStatus,
  };
}
