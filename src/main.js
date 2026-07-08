import "./styles.css";
import {
  buildGuidance,
  buildNameReading,
  buildDetailedReading,
  buildPersonalizedBriefing,
  buildTopicReading,
  calculateChart,
  ELEMENTS,
  formatInputSummary,
  interpretElements,
  TOPIC_OPTIONS,
  TONE_OPTIONS,
} from "./fortune.js";

const form = document.querySelector("#birth-form");
const calendarType = document.querySelector("#calendar-type");
const hourSelect = document.querySelector("#birth-hour");
const topicSelect = document.querySelector("#reading-topic");
const toneSelect = document.querySelector("#reading-tone");
const leapMonthField = document.querySelector("#leap-month-field");
const errorMessage = document.querySelector("#form-error");
const resultSection = document.querySelector("#result");
const detailToggle = document.querySelector("#detail-toggle");
const detailReading = document.querySelector("#detail-reading");
const premiumInterestButton = document.querySelector("#premium-interest");
const premiumInterestLabel = document.querySelector("#premium-interest-label");
const premiumInterestNote = document.querySelector("#premium-interest-note");

const PREMIUM_INTEREST_KEY = "saajuu:premium-interest";

premiumInterestButton?.addEventListener("click", () => {
  if (localStorage.getItem(PREMIUM_INTEREST_KEY) === "1") {
    premiumInterestNote.textContent = "이미 신청하셨어요. 오픈되면 가장 먼저 알려드릴게요.";
    return;
  }
  localStorage.setItem(PREMIUM_INTEREST_KEY, "1");
  premiumInterestButton.disabled = true;
  premiumInterestLabel.textContent = "신청 완료";
  premiumInterestNote.textContent = "신청해 주셔서 감사해요. 상담이 열리면 가장 먼저 알려드릴게요.";
});

if (premiumInterestButton && localStorage.getItem(PREMIUM_INTEREST_KEY) === "1") {
  premiumInterestButton.disabled = true;
  premiumInterestLabel.textContent = "신청 완료";
}

for (let hour = 0; hour < 24; hour += 1) {
  const option = document.createElement("option");
  option.value = String(hour);
  option.textContent = `${String(hour).padStart(2, "0")}시`;
  if (hour === 12) option.selected = true;
  hourSelect.append(option);
}

for (const topic of TOPIC_OPTIONS) {
  const option = document.createElement("option");
  option.value = topic.value;
  option.textContent = `${topic.label} — ${topic.prompt}`;
  topicSelect.append(option);
}

for (const tone of TONE_OPTIONS) {
  const option = document.createElement("option");
  option.value = tone.value;
  option.textContent = `${tone.label} — ${tone.prompt}`;
  toneSelect.append(option);
}

calendarType.addEventListener("change", () => {
  leapMonthField.hidden = calendarType.value !== "lunar";
  if (leapMonthField.hidden) {
    document.querySelector("#is-leap-month").checked = false;
  }
});

detailToggle.addEventListener("click", () => {
  const willOpen = detailReading.hidden;
  detailReading.hidden = !willOpen;
  detailToggle.setAttribute("aria-expanded", String(willOpen));
  detailToggle.lastElementChild.textContent = willOpen ? "−" : "＋";
  detailToggle.firstElementChild.textContent = willOpen
    ? "상세 풀이 접기"
    : "근거와 함께 상세 풀이 읽기";
});

const saveCardButton = document.querySelector("#save-card");
let lastResult = null;

saveCardButton?.addEventListener("click", () => {
  if (!lastResult) return;
  const canvas = drawSajuCard(lastResult);
  canvas.toBlob(async (blob) => {
    if (!blob) return;
    const file = new File([blob], "saajuu-card.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "사주 한 장" });
        return;
      } catch {
        return;
      }
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "saajuu-card.png";
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
});

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(" ");
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y);
  return y + lineHeight;
}

function drawSajuCard({ chart, input }) {
  const guidance = buildGuidance(chart);
  const reading = interpretElements(chart.elements);

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");

  const ink = "#152a38";
  const jade = "#4d8072";
  const gold = "#c5964f";
  const muted = "#718087";
  const serif = '"Gowun Batang", "Noto Serif KR", serif';

  ctx.fillStyle = "#fbf6ec";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);

  ctx.textAlign = "center";
  ctx.fillStyle = gold;
  ctx.font = `700 30px ${serif}`;
  ctx.fillText("四柱", canvas.width / 2, 110);

  ctx.fillStyle = ink;
  ctx.font = `700 68px ${serif}`;
  ctx.fillText("사주 한 장", canvas.width / 2, 190);

  ctx.fillStyle = muted;
  ctx.font = `400 32px ${serif}`;
  ctx.fillText(formatInputSummary(input), canvas.width / 2, 248);

  const columnWidth = 230;
  const startX = canvas.width / 2 - columnWidth * 1.5;
  chart.pillars.forEach((pillar, index) => {
    const x = startX + columnWidth * index;
    ctx.fillStyle = muted;
    ctx.font = `400 28px ${serif}`;
    ctx.fillText(pillar.label, x, 340);
    ctx.fillStyle = ink;
    ctx.font = `700 120px ${serif}`;
    ctx.fillText(pillar.stem, x, 480);
    ctx.fillText(pillar.branch, x, 620);
  });

  ctx.strokeStyle = "rgba(197, 150, 79, 0.45)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, 690);
  ctx.lineTo(canvas.width - 120, 690);
  ctx.stroke();

  ctx.fillStyle = ink;
  ctx.font = `700 44px ${serif}`;
  ctx.fillText(reading.title, canvas.width / 2, 770);

  ctx.fillStyle = muted;
  ctx.font = `400 30px ${serif}`;
  ctx.fillText(guidance.title, canvas.width / 2, 826);

  ctx.textAlign = "left";
  const textX = 130;
  const maxWidth = canvas.width - textX * 2;

  ctx.fillStyle = jade;
  ctx.font = `700 34px ${serif}`;
  ctx.fillText("가까이할 것", textX, 930);
  ctx.fillStyle = ink;
  ctx.font = `400 32px ${serif}`;
  let cursorY = wrapText(ctx, guidance.embrace[0], textX, 986, maxWidth, 46);

  ctx.fillStyle = "#b0563f";
  ctx.font = `700 34px ${serif}`;
  ctx.fillText("조심할 것", textX, cursorY + 60);
  ctx.fillStyle = ink;
  ctx.font = `400 32px ${serif}`;
  wrapText(ctx, guidance.avoid[0], textX, cursorY + 116, maxWidth, 46);

  ctx.textAlign = "center";
  ctx.fillStyle = muted;
  ctx.font = `400 26px ${serif}`;
  ctx.fillText("사주 한 장 · 브라우저에서만 계산되는 작은 만세력", canvas.width / 2, 1290);

  return canvas;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  errorMessage.hidden = true;

  const data = new FormData(form);
  const input = {
    calendarType: data.get("calendarType"),
    birthDate: data.get("birthDate"),
    hour: Number(data.get("birthHour")),
    minute: Number(data.get("birthMinute")),
    isLeapMonth: data.get("isLeapMonth") === "on",
    topic: data.get("readingTopic") ?? "relationship",
    tone: data.get("readingTone") ?? "balanced",
    name: data.get("personName") ?? "",
    concern: data.get("currentConcern") ?? "",
  };

  try {
    const chart = calculateChart(input);
    renderResult(chart, input);
    lastResult = { chart, input };
    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    errorMessage.textContent =
      error instanceof Error
        ? error.message
        : "계산 중 문제가 생겼습니다. 입력값을 확인해 주세요.";
    errorMessage.hidden = false;
  }
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderList(items) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderEvidence(label, items) {
  return `
    <span>${escapeHtml(label)}</span>
    ${items.map((item) => `<em>${escapeHtml(item)}</em>`).join("")}
  `;
}

function renderResult(chart, input) {
  document.querySelector("#result-date").textContent = formatInputSummary(input);

  document.querySelector("#pillars").innerHTML = chart.pillars
    .map(
      (pillar) => `
        <article class="pillar pillar--${pillar.key}">
          <div class="pillar__label">
            <span>${pillar.meaning}</span>
            <strong>${pillar.label}</strong>
          </div>
          <div class="pillar__characters" aria-label="${pillar.label} ${pillar.stem}${pillar.branch}">
            <span>${pillar.stem}</span>
            <span>${pillar.branch}</span>
          </div>
        </article>
      `,
    )
    .join("");

  const reading = interpretElements(chart.elements);
  document.querySelector("#elements").innerHTML = ELEMENTS.map((element) => {
    const count = chart.elements[element];
    const percentage = (count / 8) * 100;
    return `
      <div class="element-row">
        <div class="element-row__label">
          <strong>${element}</strong>
          <span>${count}</span>
        </div>
        <div class="element-track" aria-label="${element} ${count}개">
          <span class="element-fill element-fill--${element}" style="width: ${percentage}%"></span>
        </div>
      </div>
    `;
  }).join("");

  document.querySelector("#reading-title").textContent = reading.title;
  document.querySelector("#reading-copy").textContent = reading.copy;

  const guidance = buildGuidance(chart);
  document.querySelector("#guidance-eyebrow").textContent = guidance.eyebrow;
  document.querySelector("#guidance-title").textContent = guidance.title;
  document.querySelector("#guidance-copy").textContent = guidance.copy;
  document.querySelector("#guidance-embrace").innerHTML = renderList(guidance.embrace);
  document.querySelector("#guidance-avoid").innerHTML = renderList(guidance.avoid);
  document.querySelector("#guidance-evidence").innerHTML = renderEvidence("처방 근거", guidance.evidence);

  const topicReading = buildTopicReading(chart, input.topic);
  document.querySelector("#topic-eyebrow").textContent = topicReading.eyebrow;
  document.querySelector("#topic-title").textContent = topicReading.title;
  document.querySelector("#topic-copy").textContent = topicReading.copy;
  document.querySelector("#topic-point").textContent = topicReading.point;
  document.querySelector("#topic-checklist").innerHTML = renderList(topicReading.checklist);
  document.querySelector("#topic-questions").innerHTML = renderList(topicReading.questions);
  document.querySelector("#topic-evidence").innerHTML = renderEvidence("주제 풀이 근거", topicReading.evidence);

  const briefing = buildPersonalizedBriefing(chart, input);
  document.querySelector("#briefing-eyebrow").textContent = briefing.eyebrow;
  document.querySelector("#briefing-title").textContent = briefing.title;
  document.querySelector("#briefing-copy").textContent = briefing.copy;
  document.querySelector("#briefing-notes").innerHTML = briefing.notes
    .map(
      (note) => `
        <article class="briefing-note">
          <span>${escapeHtml(note.label)}</span>
          <p>${escapeHtml(note.text)}</p>
        </article>
      `,
    )
    .join("");
  document.querySelector("#session-opening").textContent = briefing.session.opening;
  document.querySelector("#session-avoid").textContent = briefing.session.avoid;
  document.querySelector("#session-questions").innerHTML = renderList(briefing.session.questions);
  document.querySelector("#briefing-evidence").innerHTML = renderEvidence("맞춤 근거", briefing.evidence);

  const nameReading = buildNameReading(chart, input.name);
  const nameReadingSection = document.querySelector("#name-reading");
  nameReadingSection.hidden = !nameReading;
  if (nameReading) {
    document.querySelector("#name-eyebrow").textContent = nameReading.eyebrow;
    document.querySelector("#name-title").textContent = nameReading.title;
    document.querySelector("#name-copy").textContent = nameReading.copy;
    document.querySelector("#name-point").textContent = nameReading.point;
    document.querySelector("#name-elements").innerHTML = nameReading.elements
      .map(
        (element) => `
          <div class="name-element-row">
            <div>
              <strong>${escapeHtml(element.element)}</strong>
              <span>${escapeHtml(element.label)}</span>
            </div>
            <div class="element-track" aria-label="${escapeHtml(element.element)} ${element.count}개">
              <span class="element-fill" style="width: ${element.percentage}%"></span>
            </div>
            <em>${element.count}</em>
          </div>
        `,
      )
      .join("");
    document.querySelector("#name-checklist").innerHTML = renderList(nameReading.checklist);
    document.querySelector("#name-evidence").innerHTML = renderEvidence("이름 풀이 근거", nameReading.evidence);
  }

  detailReading.hidden = true;
  detailToggle.setAttribute("aria-expanded", "false");
  detailToggle.firstElementChild.textContent = "근거와 함께 상세 풀이 읽기";
  detailToggle.lastElementChild.textContent = "＋";

  document.querySelector("#detail-sections").innerHTML = buildDetailedReading(chart)
    .map(
      (section) => `
        <article class="detail-section">
          <div class="detail-section__number">${section.number}</div>
          <div class="detail-section__body">
            <p class="eyebrow">${section.eyebrow}</p>
            <h4>${section.title}</h4>
            <p>${section.copy}</p>
            <div class="detail-section__point">
              <span>읽는 포인트</span>
              <strong>${section.point}</strong>
            </div>
            <div class="evidence">
              <span>풀이 근거</span>
              ${section.evidence.map((item) => `<em>${escapeHtml(item)}</em>`).join("")}
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}
