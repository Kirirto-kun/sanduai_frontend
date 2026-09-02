import { describe, expect, it } from "vitest";

import type { GenerationJob } from "./api";
import {
  raceGameDocumentHtml,
  racePayloadFromSettings,
  restoreRaceGame,
  RACE_GENERATION_KIND,
  RACE_SOURCE_PATH,
} from "./race-generation";


function completedRaceJob(result: GenerationJob["result"]): GenerationJob {
  return {
    id: "30bdc3b2-41e6-4399-877c-cbab8e93a5d9",
    kind: RACE_GENERATION_KIND,
    title: "Компьютер жады",
    source_path: RACE_SOURCE_PATH,
    status: "completed",
    progress: { current: 1, total: 1 },
    cost_tokens: 10,
    captured_tokens: 10,
    billing_status: "captured",
    attempt_count: 1,
    cancel_requested: false,
    error_code: null,
    error_message: null,
    created_at: "2026-09-01T08:00:00Z",
    updated_at: "2026-09-01T08:01:00Z",
    started_at: "2026-09-01T08:00:01Z",
    completed_at: "2026-09-01T08:01:00Z",
    expires_at: "2026-09-02T08:01:00Z",
    artifact_urls: [],
    result,
  };
}


describe("durable At Zharys result", () => {
  it("sends arena settings to the durable job", () => {
    expect(racePayloadFromSettings({
      topic: "  Компьютер жады ",
      grade: " 7 ",
      additional_info: "  Қысқа сұрақтар ",
      teams_count: 3,
      victory_condition: 12,
      questions_count: 20,
      language: "kz",
    })).toEqual({
      topic: "Компьютер жады",
      grade: "7",
      additional_info: "Қысқа сұрақтар",
      teams_count: 3,
      victory_condition: 12,
      questions_count: 20,
      language: "kz",
    });
  });

  it("restores the complete game without browser storage", () => {
    const restored = restoreRaceGame(completedRaceJob({
      game_id: "game-1",
      settings: {
        topic: "Компьютер жады",
        grade: "7",
        additional_info: "",
        teams_count: 3,
        victory_condition: 12,
        questions_count: 1,
        language: "kz",
      },
      questions: [{
        id: "q1",
        text: "RAM деген не?",
        options: ["Жедел жад", "Диск", "Процессор", "Монитор"],
        correct_answer: "Жедел жад",
      }],
    }));

    expect(restored?.gameId).toBe("game-1");
    expect(restored?.settings.teams_count).toBe(3);
    expect(restored?.questions[0].correct_answer).toBe("Жедел жад");
    const document = raceGameDocumentHtml(restored!, "kk");
    expect(document).toContain("«Ат жарыс» ойыны");
    expect(document).toContain("RAM деген не?");
    expect(document).toContain("Дұрыс жауап");
    expect(document).not.toContain("game_id");
  });

  it("rejects a malformed or unrelated result", () => {
    expect(restoreRaceGame(completedRaceJob({ game_id: "game-1" }))).toBeNull();
    expect(restoreRaceGame({
      ...completedRaceJob({}),
      kind: "quiz.generate",
    })).toBeNull();
  });
});
