import type { GenerationJob, RaceQuestion } from "./api";
import type { GameSettings } from "../types/games";


export const RACE_GENERATION_KIND = "race.generate";
export const RACE_SOURCE_PATH = "/dashboard/library/games/at-zharys";


export type RestoredRaceGame = {
  gameId: string;
  settings: GameSettings;
  questions: RaceQuestion[];
};


function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}


function isTeamCount(value: unknown): value is GameSettings["teams_count"] {
  return value === 2 || value === 3 || value === 4;
}


function isQuestion(value: unknown): value is RaceQuestion {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.text === "string" &&
    Array.isArray(value.options) &&
    value.options.length === 4 &&
    value.options.every((option) => typeof option === "string") &&
    typeof value.correct_answer === "string"
  );
}


export function racePayloadFromSettings(
  settings: GameSettings,
): Record<string, unknown> {
  return {
    topic: settings.topic.trim(),
    grade: settings.grade.trim(),
    additional_info: settings.additional_info?.trim() ?? "",
    questions_count: settings.questions_count,
    language: settings.language,
    teams_count: settings.teams_count,
    victory_condition: settings.victory_condition,
  };
}


export function restoreRaceGame(job: GenerationJob): RestoredRaceGame | null {
  if (job.kind !== RACE_GENERATION_KIND || !isRecord(job.result)) return null;
  const result = job.result;
  const settings = result.settings;
  const questions = result.questions;
  if (
    typeof result.game_id !== "string" ||
    !result.game_id.trim() ||
    !isRecord(settings) ||
    typeof settings.topic !== "string" ||
    typeof settings.grade !== "string" ||
    !isTeamCount(settings.teams_count) ||
    typeof settings.victory_condition !== "number" ||
    settings.victory_condition < 5 ||
    settings.victory_condition > 30 ||
    typeof settings.questions_count !== "number" ||
    settings.questions_count < 1 ||
    settings.questions_count > 100 ||
    (settings.language !== "kz" && settings.language !== "ru") ||
    !Array.isArray(questions) ||
    questions.length === 0 ||
    !questions.every(isQuestion)
  ) {
    return null;
  }

  return {
    gameId: result.game_id,
    settings: {
      topic: settings.topic,
      grade: settings.grade,
      additional_info:
        typeof settings.additional_info === "string" ? settings.additional_info : "",
      teams_count: settings.teams_count,
      victory_condition: settings.victory_condition,
      questions_count: settings.questions_count,
      language: settings.language,
    },
    questions,
  };
}


export function raceGameDocumentHtml(
  game: RestoredRaceGame,
  language: "ru" | "kk",
): string {
  const labels = language === "kk"
    ? {
        title: "«Ат жарыс» ойыны",
        topic: "Тақырып",
        grade: "Сынып",
        teams: "Команда саны",
        finish: "Жеңіс шарты",
        answers: "дұрыс жауап",
        correct: "Дұрыс жауап",
      }
    : {
        title: "Игра «Ат жарыс»",
        topic: "Тема",
        grade: "Класс",
        teams: "Количество команд",
        finish: "Условие победы",
        answers: "правильных ответов",
        correct: "Правильный ответ",
      };
  const questions = game.questions.map((question, questionIndex) => {
    const options = question.options.map((option, optionIndex) => (
      `<li><strong>${String.fromCharCode(65 + optionIndex)}.</strong> ${escapeHtml(option)}</li>`
    )).join("");
    return `
      <section class="question">
        <h2>${questionIndex + 1}. ${escapeHtml(question.text)}</h2>
        <ol>${options}</ol>
        <p class="answer"><strong>${labels.correct}:</strong> ${escapeHtml(question.correct_answer)}</p>
      </section>`;
  }).join("");

  return `<!doctype html>
    <html><head><meta charset="utf-8"><style>
      body { font-family: Arial, sans-serif; color: #172033; line-height: 1.45; }
      h1 { color: #182d61; }
      .meta { background: #eef4ff; padding: 12px 16px; border-radius: 8px; }
      .question { page-break-inside: avoid; margin-top: 22px; }
      .question h2 { font-size: 16px; }
      ol { list-style: none; padding-left: 8px; }
      li { margin: 6px 0; }
      .answer { color: #17633a; }
    </style></head><body>
      <h1>${labels.title}</h1>
      <div class="meta">
        <p><strong>${labels.topic}:</strong> ${escapeHtml(game.settings.topic)}</p>
        <p><strong>${labels.grade}:</strong> ${escapeHtml(game.settings.grade)}</p>
        <p><strong>${labels.teams}:</strong> ${game.settings.teams_count}</p>
        <p><strong>${labels.finish}:</strong> ${game.settings.victory_condition} ${labels.answers}</p>
      </div>
      ${questions}
    </body></html>`;
}
