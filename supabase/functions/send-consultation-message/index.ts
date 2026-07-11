import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const requiredConsents = [
  { type: "terms", version: "2026-07-11" },
  { type: "privacy", version: "2026-07-11" },
  { type: "ai_notice", version: "2026-07-11" },
];

const personaPrompts: Record<string, string> = {
  miseon: "You are Miseon, a warm Korean aunt-like 상담사. You listen carefully, summarize gently, and give practical advice.",
  junho: "You are Junho, a friendly Korean neighbor-brother 상담사. You are calm, conversational, and direct without sounding cold.",
  seongu: "You are Seongu, a seasoned senior 상담사. You are concise, structured, and grounded in real-world judgment.",
};

const safetyKeywords = {
  crisis: ["자살", "죽고 싶", "죽어버", "극단적 선택", "자해", "폭력", "살해"],
  blocked: ["의사", "진단", "처방", "투자", "주식", "코인", "임신", "불임", "소송", "법률"],
  caution: ["헤어질", "이별", "재회", "결혼", "이직", "창업", "사업", "돈", "해고"],
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function classifySafety(text: string) {
  const lower = text.toLowerCase();
  if (safetyKeywords.crisis.some((keyword) => lower.includes(keyword))) {
    return "crisis" as const;
  }
  if (safetyKeywords.blocked.some((keyword) => lower.includes(keyword))) {
    return "blocked" as const;
  }
  if (safetyKeywords.caution.some((keyword) => lower.includes(keyword))) {
    return "caution" as const;
  }
  return "none" as const;
}

function safetyGuidance(level: ReturnType<typeof classifySafety>) {
  if (level === "crisis") {
    return "Stop the consultation, encourage immediate local emergency support, and do not continue with fortune-style advice.";
  }
  if (level === "blocked") {
    return "Do not provide deterministic medical, legal, investment, or pregnancy advice. Redirect to professional support where relevant.";
  }
  if (level === "caution") {
    return "Use careful, non-deterministic wording and focus on practical next steps.";
  }
  return "Proceed with normal supportive consultation.";
}

async function callGemini(apiKey: string, model: string, prompt: string) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 600,
      },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message ?? `Gemini request failed with status ${response.status}`;
    throw new Error(message);
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part?.text ?? "")
      .join("")
      .trim() ?? "";

  return {
    text,
    raw: data,
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const llmProvider = (Deno.env.get("LLM_PROVIDER") ?? "gemini").toLowerCase();
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  const geminiModel = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";

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

  let payload: {
    sessionId?: string;
    message?: string;
  };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const sessionId = normalizeText(payload.sessionId, 80);
  const userMessage = normalizeText(payload.message, 1200);

  if (!sessionId) return json({ error: "sessionId is required" }, 400);
  if (!userMessage) return json({ error: "message is required" }, 400);

  const safetyLevel = classifySafety(userMessage);
  if (safetyLevel === "crisis") {
    const { error: safetyError } = await adminClient.from("safety_events").insert({
      user_id: currentUser.id,
      session_id: sessionId,
      level: safetyLevel,
      category: "crisis",
      action: "blocked_and_redirected",
      metadata: { source: "send-consultation-message" },
    });
    if (safetyError) return json({ error: safetyError.message }, 500);
    return json({
      error: "Crisis-related requests are blocked. Please contact local emergency support.",
      safetyLevel,
    }, 403);
  }

  const { data: session, error: sessionError } = await adminClient
    .from("consultation_sessions")
    .select("id, user_id, persona_id, topic, mode, status, turn_limit, used_turns, expires_at, concern_id")
    .eq("id", sessionId)
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (sessionError) return json({ error: sessionError.message }, 500);
  if (!session) return json({ error: "Session not found" }, 404);
  if (session.status !== "active") return json({ error: "Session is not active" }, 409);
  if (session.used_turns >= session.turn_limit) return json({ error: "Turn limit reached" }, 409);
  if (session.expires_at && new Date(session.expires_at).getTime() < Date.now()) {
    return json({ error: "Session has expired" }, 409);
  }

  const { data: consentRows, error: consentError } = await adminClient
    .from("consent_logs")
    .select("consent_type, consent_version, accepted")
    .eq("user_id", currentUser.id)
    .eq("accepted", true)
    .in("consent_type", requiredConsents.map((consent) => consent.type));
  if (consentError) return json({ error: consentError.message }, 500);

  const accepted = new Set(
    (consentRows ?? [])
      .filter((row) =>
        requiredConsents.some(
          (consent) => consent.type === row.consent_type && consent.version === row.consent_version,
        ),
      )
      .map((row) => row.consent_type),
  );
  if (!requiredConsents.every((consent) => accepted.has(consent.type))) {
    return json({ error: "Required consents are missing" }, 403);
  }

  const { data: concern, error: concernError } = await adminClient
    .from("concerns")
    .select("concern_summary")
    .eq("id", session.concern_id)
    .maybeSingle();
  if (concernError) return json({ error: concernError.message }, 500);

  const { data: history, error: historyError } = await adminClient
    .from("consultation_messages")
    .select("role, content, created_at")
    .eq("session_id", session.id)
    .order("created_at", { ascending: true })
    .limit(12);
  if (historyError) return json({ error: historyError.message }, 500);

  const { error: insertUserError } = await adminClient.from("consultation_messages").insert({
    session_id: session.id,
    user_id: currentUser.id,
    role: "user",
    content: userMessage,
    safety_level: safetyLevel,
    model: llmProvider,
    prompt_version: "2026-07-11",
    metadata: { source: "web" },
  });
  if (insertUserError) return json({ error: insertUserError.message }, 500);

  const personaInstruction = personaPrompts[session.persona_id] ?? personaPrompts.miseon;
  const prompt = [
    "You are a Korean fortune consultation assistant.",
    "Keep the tone supportive, practical, and not deterministic.",
    `Persona: ${personaInstruction}`,
    `Topic: ${session.topic}`,
    `Safety guidance: ${safetyGuidance(safetyLevel)}`,
    concern?.concern_summary ? `User concern summary: ${concern.concern_summary}` : "User concern summary: not provided.",
    "Recent conversation:",
    ...(history ?? []).map((item) => `${String(item.role).toUpperCase()}: ${item.content}`),
    `USER: ${userMessage}`,
    "Answer in Korean. Start with a short verdict line, then explain the reasoning, then end with one concrete next step.",
  ].join("\n");

  if (llmProvider !== "gemini") {
    return json({ error: "Only Gemini is wired for consultation replies right now" }, 501);
  }
  if (!geminiApiKey) {
    return json({ error: "GEMINI_API_KEY is not configured" }, 500);
  }

  let assistantText = "";
  try {
    const result = await callGemini(geminiApiKey, geminiModel, prompt);
    assistantText = result.text || "지금은 답변을 생성하지 못했어요. 잠시 후 다시 시도해 주세요.";
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Gemini request failed" }, 502);
  }

  const nextUsedTurns = session.used_turns + 1;
  const sessionStatus = nextUsedTurns >= session.turn_limit ? "completed" : "active";
  const completedAt = sessionStatus === "completed" ? new Date().toISOString() : null;

  const { error: insertAssistantError } = await adminClient.from("consultation_messages").insert({
    session_id: session.id,
    user_id: currentUser.id,
    role: "assistant",
    content: assistantText,
    safety_level: safetyLevel,
    model: geminiModel,
    prompt_version: "2026-07-11",
    metadata: { provider: "gemini", topic: session.topic },
  });
  if (insertAssistantError) return json({ error: insertAssistantError.message }, 500);

  const { error: sessionUpdateError } = await adminClient
    .from("consultation_sessions")
    .update({
      used_turns: nextUsedTurns,
      status: sessionStatus,
      completed_at: completedAt,
      safety_level: safetyLevel,
    })
    .eq("id", session.id)
    .eq("user_id", currentUser.id);
  if (sessionUpdateError) return json({ error: sessionUpdateError.message }, 500);

  if (safetyLevel !== "none") {
    const { error: safetyError } = await adminClient.from("safety_events").insert({
      user_id: currentUser.id,
      session_id: session.id,
      level: safetyLevel,
      category: safetyLevel,
      action: "consultation_answer_generated",
      metadata: { provider: "gemini", topic: session.topic },
    });
    if (safetyError) return json({ error: safetyError.message }, 500);
  }

  return json({
    reply: assistantText,
    safetyLevel,
    usedTurns: nextUsedTurns,
    remainingTurns: Math.max(session.turn_limit - nextUsedTurns, 0),
    model: geminiModel,
    provider: "gemini",
  });
});
