import type { ScenarioResult } from "./visuals-ai-api";
import type { ContentLanguage } from "./content-languages";

export type ScenarioDocumentLabels = {
  total: string;
  program: string;
  goal: string;
  equipment: string;
  participants: string;
  props: string;
  minutes: string;
};

const SCENARIO_DOCUMENT_LABELS: Record<ContentLanguage, ScenarioDocumentLabels> = {
  kk: {
    total: "Барлығы",
    program: "Бағдарлама",
    goal: "Мақсаты",
    equipment: "Қажетті жабдық",
    participants: "Қатысушылар",
    props: "Реквизит",
    minutes: "минут",
  },
  ru: {
    total: "Всего",
    program: "Программа",
    goal: "Цель",
    equipment: "Необходимое оборудование",
    participants: "Участники",
    props: "Реквизит",
    minutes: "минут",
  },
  en: {
    total: "Total",
    program: "Programme",
    goal: "Objective",
    equipment: "Equipment",
    participants: "Participants",
    props: "Props",
    minutes: "minutes",
  },
  ky: {
    total: "Жалпы",
    program: "Программа",
    goal: "Максаты",
    equipment: "Керектүү жабдуулар",
    participants: "Катышуучулар",
    props: "Реквизит",
    minutes: "мүнөт",
  },
  uz: {
    total: "Jami",
    program: "Dastur",
    goal: "Maqsad",
    equipment: "Kerakli jihozlar",
    participants: "Ishtirokchilar",
    props: "Rekvizit",
    minutes: "daqiqa",
  },
};

export function scenarioDocumentLabels(
  language: ContentLanguage,
): ScenarioDocumentLabels {
  return SCENARIO_DOCUMENT_LABELS[language];
}

function escapeDocumentText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function scenarioDocumentFileName(value: string): string {
  const safeName = value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "_")
    .slice(0, 80);
  return `${safeName || "scenario"}.doc`;
}

export function buildScenarioDocumentHtml(
  result: ScenarioResult,
  labels: ScenarioDocumentLabels,
): string {
  const blocks = result.blocks.map((block) => `
    <h2>${block.index}. ${escapeDocumentText(block.title)} (${block.minutes} ${escapeDocumentText(labels.minutes)})</h2>
    <p>${escapeDocumentText(block.content).replaceAll("\n", "<br>")}</p>
    ${block.participants ? `<p><strong>${escapeDocumentText(labels.participants)}:</strong> ${escapeDocumentText(block.participants)}</p>` : ""}
    ${block.props ? `<p><strong>${escapeDocumentText(labels.props)}:</strong> ${escapeDocumentText(block.props)}</p>` : ""}
  `).join("");

  return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;line-height:1.5;color:#172033}h1{font-size:24px}h2{font-size:18px;margin-top:24px}p{white-space:normal}</style></head><body>
    <h1>${escapeDocumentText(result.title)}</h1>
    <p><strong>${escapeDocumentText(labels.goal)}:</strong> ${escapeDocumentText(result.goal)}</p>
    <p><strong>${escapeDocumentText(labels.equipment)}:</strong> ${escapeDocumentText(result.equipment)}</p>
    ${blocks}
  </body></html>`;
}
