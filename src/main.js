import "./styles.css";
import {
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
