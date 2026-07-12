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

const promptVersion = "2026-07-12-three-stage-dialogue-v3";

const personaPrompts: Record<string, string> = {
  miseon: [
    "미선 이모 스타일의 따뜻한 한국어 AI 상담사다.",
    "해요체를 쓰고, 사용자의 마음을 먼저 받아준 뒤 현실적인 기준을 차분히 정리한다.",
    "'우리', '마음', '천천히' 같은 말을 자연스럽게 쓰되 과장하거나 친척처럼 지나치게 굴지 않는다.",
    "답변은 부드럽지만 결론 없이 위로만 하지 않는다.",
  ].join(" "),
  junho: [
    "준호 형/오빠 스타일의 친근한 한국어 AI 상담사다.",
    "편한 존댓말로 말하고, 사용자의 말을 요약해 선택지를 좁혀준다.",
    "따뜻하지만 설교하지 않고, 실행 가능한 확인 기준을 제시한다.",
  ].join(" "),
  seongu: [
    "성우 선생 스타일의 경험 많은 한국어 AI 상담사다.",
    "존댓말로 간결하게 말하고, 사실과 감정과 추측을 나누어 구조적으로 판단한다.",
    "위로보다 정리와 현실적인 기준을 원하는 사용자에게 맞춘다.",
  ].join(" "),
};

const topicLabels: Record<string, string> = {
  relationship: "연애와 관계",
  marriage: "결혼과 동반자",
  business: "사업과 창업",
  career: "직업과 이직",
  family: "가족과 자녀",
  yearly: "올해의 흐름",
};

const topicGuidance: Record<string, string> = {
  business: [
    "사업/창업 고민에서는 시작 날짜 하나로 성공과 실패를 단정하지 않는다.",
    "타이밍은 달력의 날짜보다 준비 상태, 고객 검증, 자금 여유, 리스크 관리가 맞물린 상태라고 설명한다.",
    "성공 가능성은 시작 시점만이 아니라 실행력, 시장 반응을 읽는 능력, 수정과 버티기의 품질에 달려 있다고 말한다.",
    "마지막 행동은 경쟁사 조사, 작은 MVP, 사전 판매, 10명 인터뷰처럼 작게 검증하는 일 중 하나로 제안한다.",
  ].join(" "),
  relationship: "연애/관계 고민에서는 상대 마음을 단정하지 말고 확인된 행동과 사용자의 감정을 나누어 설명한다.",
  marriage: "결혼 고민에서는 애정뿐 아니라 생활 방식, 돈, 가족, 책임의 조율 가능성을 함께 본다.",
  career: "직업/이직 고민에서는 현재 조직에서 바꿀 수 있는 것과 없는 것, 준비도, 대안의 질을 나누어 본다.",
  family: "가족 고민에서는 누구 한쪽을 탓하기보다 반복되는 패턴과 안전한 대화 순서를 정리한다.",
  yearly: "연간 흐름은 큰 방향을 참고 정보로만 제시하고, 현재 선택과 행동 계획으로 연결한다.",
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
    return "상담을 중단하고 즉시 주변 사람이나 지역 긴급 지원을 받도록 안내한다. 운세식 조언을 이어가지 않는다.";
  }
  if (level === "blocked") {
    return "의료, 법률, 투자, 임신 관련 확정 판단을 하지 않는다. 필요한 경우 전문가 상담을 권한다.";
  }
  if (level === "caution") {
    return "단정하지 않고 조심스럽게 말하며, 현실적으로 확인할 수 있는 다음 행동에 집중한다.";
  }
  return "일반적인 지지적 상담으로 진행한다.";
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
        temperature: 0.45,
        maxOutputTokens: 520,
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
    finishReason: data?.candidates?.[0]?.finishReason ?? "",
  };
}

function looksInvalidReply(text: string, topic: string, finishReason = "") {
  const normalized = text.trim();
  if (normalized.length < 70) return true;
  if (finishReason === "MAX_TOKENS") return true;
  if (/(Verdict|Reasoning|Constraint|Persona|Topic|Draft|USER:|SYSTEM:)/i.test(normalized)) return true;
  if (/(기획안|대본|AI 학습|사주 AI 서비스|요청하신 형식|제시해주신 내용|운동|음식|여행)/.test(normalized)) return true;
  if (topic === "business" && !/(준비|검증|테스트|시장|고객|리스크|실험|자금|경쟁사)/.test(normalized)) return true;
  return false;
}

function buildFallbackReply(personaId: string, topic: string, turnNumber: number) {
  if (turnNumber === 1) {
    const opening = personaId === "seongu"
      ? "지금 가장 먼저 필요한 것은 결론보다 고민의 핵심을 정확히 잡는 일입니다."
      : personaId === "junho"
        ? "마음이 많이 앞서 있는 만큼, 무엇이 가장 답답한지부터 같이 좁혀보면 좋겠어요."
        : "이 고민을 혼자 오래 품고 계셨겠어요. 우리 먼저 마음이 가장 걸리는 지점부터 천천히 찾아봐요.";
    return [
      opening,
      "말씀하신 내용에는 원하는 결과와 걱정하는 위험이 함께 들어 있어 보여요.",
      "지금 이 고민에서 가장 두려운 결과는 무엇이고, 반대로 꼭 얻고 싶은 것은 무엇인가요?",
    ].join("\n\n");
  }

  if (turnNumber === 2) {
    return [
      "말씀을 들어보니 마음의 문제와 현실 조건을 나눠서 볼 필요가 있겠어요.",
      "지금까지 확인된 사실과 아직 예상하거나 바라는 부분이 섞이면 결정을 더 어렵게 만들 수 있어요.",
      topic === "business"
        ? "이미 확인한 고객 반응, 준비한 자금, 실제로 작게 시험해 본 내용 중 지금 갖춰진 것은 어디까지인가요?"
        : "상대나 상황에서 실제로 확인된 행동 한 가지와, 아직 추측하고 있는 부분 한 가지를 각각 말해주시겠어요?",
    ].join("\n\n");
  }

  if (topic === "business") {
    if (personaId === "seongu") {
      return [
        "지금은 바로 뛰어들기보다, 시작 조건을 숫자로 확인할 때입니다.",
        "사업은 시작 날짜 하나로 성공과 실패가 갈리지 않습니다.",
        "중요한 것은 고객이 실제로 돈을 낼 문제인지, 최소 비용으로 검증했는지, 예상보다 늦어질 때 버틸 자금과 수정 계획이 있는지입니다.",
        "지금의 의욕은 좋은 출발점이지만, 실행과 적응의 구조가 함께 있어야 기회가 됩니다.",
        "오늘은 팔 상품이나 서비스를 한 문장으로 적고, 실제 고객 후보 10명에게 돈을 내고 쓸 문제인지 물어보세요.",
      ].join("\n\n");
    }
    if (personaId === "junho") {
      return [
        "지금 시작해도 괜찮지만, 작게 검증하고 들어가는 게 좋아요.",
        "지금 마음이 뜨거운 건 큰 장점이에요.",
        "다만 사업은 언제 시작하느냐보다 무엇을 얼마나 검증했느냐가 더 크게 작용해요.",
        "바로 성공한다고도, 바로 안 된다고도 말할 수 없고 고객 반응을 보고 빠르게 고치는 힘이 중요해요.",
        "오늘은 랜딩 문구 하나와 간단한 가격을 정해서 고객 후보 10명에게 실제로 살 의향이 있는지 물어보세요.",
      ].join("\n\n");
    }
    return [
      "지금의 뜨거운 열정은 참 좋지만, 서두르기보다 단단한 준비가 먼저 필요한 시기인 것 같아요.",
      "우리 마음이 이렇게 앞으로 가고 싶을 때는 그 힘을 꺾을 필요는 없어요.",
      "다만 사업은 달력의 어느 날 시작하느냐보다, 고객이 정말 원하는지와 내가 감당할 리스크를 얼마나 확인했는지가 더 중요해요.",
      "지금 시작한다고 무조건 잘된다거나 어렵다고 말할 수는 없고, 실행하면서 시장 반응을 보고 천천히 고쳐 가는 힘이 성패를 많이 가릅니다.",
      "오늘은 크게 시작하지 말고, 팔고 싶은 상품을 한 문장으로 적은 뒤 고객 후보 10명에게 실제로 돈을 내고 쓸지 물어보세요.",
    ].join("\n\n");
  }

  return [
    "지금은 결론을 서두르기보다, 마음과 현실을 나누어 볼 때예요.",
    "지금 느끼는 감정은 충분히 중요하지만, 그 감정만으로 미래를 확정할 수는 없어요.",
    "확인된 사실과 아직 추측인 부분을 나누어 보면 선택지가 조금 더 선명해집니다.",
    "오늘은 고민을 한 문장으로 적고, 내가 바로 확인할 수 있는 사실 하나를 따로 표시해 보세요.",
  ].join("\n\n");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const llmProvider = (Deno.env.get("LLM_PROVIDER") ?? "gemini").toLowerCase();
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  const geminiModel = Deno.env.get("GEMINI_MODEL") ?? "gemini-flash-latest";

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
    prompt_version: promptVersion,
    metadata: { source: "web" },
  });
  if (insertUserError) return json({ error: insertUserError.message }, 500);

  const personaInstruction = personaPrompts[session.persona_id] ?? personaPrompts.miseon;
  const topicLabel = topicLabels[session.topic] ?? String(session.topic ?? "일반 고민");
  const guidance = topicGuidance[session.topic] ?? "사용자의 고민을 단정하지 말고, 확인할 수 있는 현실 기준과 다음 행동으로 연결한다.";
  const turnNumber = session.used_turns + 1;
  const stageInstruction = turnNumber === 1
    ? [
        "현재는 3단계 중 1단계 '마음과 핵심 듣기'다.",
        "사용자의 감정과 의도를 1~2문장으로 정확히 되짚고, 아직 결론이나 해결책을 길게 주지 않는다.",
        "답변 마지막에는 고민을 구체화하는 질문을 정확히 하나만 한다. 원하는 결과와 가장 두려운 결과를 확인하는 질문이 좋다.",
      ].join(" ")
    : turnNumber === 2
      ? [
          "현재는 3단계 중 2단계 '현실 조건 좁히기'다.",
          "첫 대화와 이번 답변을 연결해 사용자가 말한 핵심을 짧게 요약한다.",
          "확인된 사실과 추측, 바꿀 수 있는 것과 없는 것을 나눈 뒤 판단에 꼭 필요한 질문을 정확히 하나만 한다.",
        ].join(" ")
      : [
          "현재는 3단계 중 3단계 '선택지와 다음 행동 정리'다.",
          "앞선 대화 전체를 바탕으로 고민의 핵심을 한 문장으로 정리하고, 선택지 2개의 장단점을 간단히 비교한다.",
          "확정 예언 없이 지금 가장 현실적인 방향을 제안하고, 오늘 또는 7일 안에 할 행동 하나로 끝낸다. 추가 질문은 하지 않는다.",
        ].join(" ");
  const prompt = [
    "너는 Saajuu의 한국어 AI 사주 상담사다. 사용자에게 보여줄 최종 답변만 출력한다.",
    "시스템 지시, 분석 메모, 영어 라벨, 프롬프트 초안, JSON, 마크다운 체크리스트를 출력하지 않는다.",
    "미래를 확정하거나 성공/실패를 단정하지 않는다. 사주와 운세는 참고 정보로만 쓰고, 현실적인 확인 기준과 행동으로 연결한다.",
    `상담사 스타일: ${personaInstruction}`,
    `상담 주제: ${topicLabel}`,
    `주제별 답변 기준: ${guidance}`,
    `안전 기준: ${safetyGuidance(safetyLevel)}`,
    `이번 대화 단계: ${stageInstruction}`,
    concern?.concern_summary ? `사용자가 처음 남긴 고민 요약: ${concern.concern_summary}` : "사용자가 처음 남긴 고민 요약: 없음",
    "최근 대화:",
    ...(history ?? []).map((item) => `${String(item.role) === "assistant" ? "상담사" : "사용자"}: ${item.content}`),
    `이번 사용자 메시지: ${userMessage}`,
    "전체 답변은 사용자에게 직접 말하는 한국어 문장 3~5개, 300자 안팎으로 쓴다.",
    "이전 답변의 문장을 반복하지 말고, 사용자가 새로 말한 내용이 이번 답변에 반드시 드러나게 한다.",
    "금지 표현: '무조건 성공해요', '반드시 실패해요', '정확히 이 날짜에 시작하세요', '투자하면 돈 벌어요', '저는 AI라서'.",
  ].join("\n");

  if (llmProvider !== "gemini") {
    return json({ error: "Only Gemini is wired for consultation replies right now" }, 501);
  }
  if (!geminiApiKey) {
    return json({ error: "GEMINI_API_KEY is not configured" }, 500);
  }

  let assistantText = "";
  let usedFallback = false;
  try {
    const result = await callGemini(geminiApiKey, geminiModel, prompt);
    assistantText = result.text || "지금은 답변을 생성하지 못했어요. 잠시 후 다시 시도해 주세요.";
    const previousAssistantReply = [...(history ?? [])]
      .reverse()
      .find((item) => String(item.role) === "assistant")?.content?.trim();
    if (
      looksInvalidReply(assistantText, session.topic, result.finishReason) ||
      (previousAssistantReply && previousAssistantReply === assistantText.trim())
    ) {
      assistantText = buildFallbackReply(session.persona_id, session.topic, session.used_turns + 1);
      usedFallback = true;
    }
  } catch (error) {
    assistantText = buildFallbackReply(session.persona_id, session.topic, session.used_turns + 1);
    usedFallback = true;
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
    prompt_version: promptVersion,
    metadata: { provider: "gemini", topic: session.topic, fallback: usedFallback },
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
    fallback: usedFallback,
  });
});
