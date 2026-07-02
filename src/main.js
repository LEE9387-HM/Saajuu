import "./styles.css";
import {
  calculateChart,
  ELEMENTS,
  formatInputSummary,
  interpretElements,
} from "./fortune.js";

const form = document.querySelector("#birth-form");
const calendarType = document.querySelector("#calendar-type");
const hourSelect = document.querySelector("#birth-hour");
const leapMonthField = document.querySelector("#leap-month-field");
const errorMessage = document.querySelector("#form-error");
const resultSection = document.querySelector("#result");

for (let hour = 0; hour < 24; hour += 1) {
  const option = document.createElement("option");
  option.value = String(hour);
  option.textContent = `${String(hour).padStart(2, "0")}시`;
  if (hour === 12) option.selected = true;
  hourSelect.append(option);
}

calendarType.addEventListener("change", () => {
  leapMonthField.hidden = calendarType.value !== "lunar";
  if (leapMonthField.hidden) {
    document.querySelector("#is-leap-month").checked = false;
  }
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
}
