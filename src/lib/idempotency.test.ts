import { afterEach, describe, expect, it, vi } from "vitest";
import {
  chatWithYbyrai,
  chatWithYbyraiStream,
  createProjectPlan,
  generateArticle,
  generateClassHour,
  generateEssay,
  generateExam,
  generateImage,
  generateLessonPlan,
  generateQuiz,
  generateRace,
  generateSection,
  generateVoiceover,
  generateWorksheet,
  regenerateClassHourBlock,
  regenerateSection,
  finalizeProject,
  reviseArticle,
  reviseEssay,
  sendSandubotMessage,
  sendSandubotMessageStream,
} from "./api";
import {
  generateComic,
  generateInfographic,
  generateKornekilik,
  generateScenario,
} from "./visuals-ai-api";
import {
  createIdempotencyKey,
  IDEMPOTENCY_HEADER,
  withIdempotencyKey,
} from "./idempotency";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function lastIdempotencyKey(fetchMock: ReturnType<typeof vi.fn>): string {
  const init = fetchMock.mock.calls.at(-1)?.[1] as RequestInit | undefined;
  const key = new Headers(init?.headers).get(IDEMPOTENCY_HEADER);
  expect(key).toMatch(UUID_V4);
  return key!;
}

describe("paid request idempotency", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a UUID once and preserves it in retry headers", () => {
    const key = createIdempotencyKey();
    const firstAttempt = withIdempotencyKey({ Accept: "application/json" }, key);
    const retryAttempt = withIdempotencyKey(firstAttempt, key);

    expect(key).toMatch(UUID_V4);
    expect(firstAttempt.get(IDEMPOTENCY_HEADER)).toBe(key);
    expect(retryAttempt.get(IDEMPOTENCY_HEADER)).toBe(key);
  });

  it("does not replace an idempotency key supplied by the action", () => {
    const headers = withIdempotencyKey({ [IDEMPOTENCY_HEADER]: "existing-action-key" });
    expect(headers.get(IDEMPOTENCY_HEADER)).toBe("existing-action-key");
  });

  it("adds a distinct key to every paid JSON, multipart, and streaming action", async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response("{}", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const jsonActions: Array<() => Promise<unknown>> = [
      () => generateEssay({} as Parameters<typeof generateEssay>[0]),
      () => reviseEssay({} as Parameters<typeof reviseEssay>[0]),
      () => generateArticle({} as Parameters<typeof generateArticle>[0]),
      () => reviseArticle({} as Parameters<typeof reviseArticle>[0]),
      () => generateExam({} as Parameters<typeof generateExam>[0]),
      () => generateClassHour({} as Parameters<typeof generateClassHour>[0]),
      () => regenerateClassHourBlock({} as Parameters<typeof regenerateClassHourBlock>[0]),
      () => generateQuiz({} as Parameters<typeof generateQuiz>[0]),
      () => generateVoiceover({} as Parameters<typeof generateVoiceover>[0]),
      () => sendSandubotMessage("hello"),
      () => generateLessonPlan({} as Parameters<typeof generateLessonPlan>[0]),
      () => createProjectPlan({} as Parameters<typeof createProjectPlan>[0]),
      () => generateSection({} as Parameters<typeof generateSection>[0]),
      () => regenerateSection({} as Parameters<typeof regenerateSection>[0]),
      () => finalizeProject({ project_id: "project-1" }),
      () => generateWorksheet({} as Parameters<typeof generateWorksheet>[0]),
      () => generateRace({} as Parameters<typeof generateRace>[0]),
      () => generateImage({ prompt: "classroom" }),
      () => generateKornekilik({ topic: "topic", language: "kk", orientation: "portrait" }),
      () => generateInfographic({ topic: "topic", language: "kk", orientation: "portrait" }),
      () => generateComic({ description: "description", panelCount: 4, language: "kk", style: "cartoon" }),
      () => generateScenario({ topic: "topic", segment: "school", age: "12", durationMinutes: 30, language: "kk" }),
    ];

    const keys: string[] = [];
    for (const action of jsonActions) {
      await action();
      keys.push(lastIdempotencyKey(fetchMock));
    }

    for await (const event of sendSandubotMessageStream("hello")) {
      // Empty mocked stream.
      void event;
    }
    keys.push(lastIdempotencyKey(fetchMock));

    const audio = new Blob(["audio"], { type: "audio/webm" }) as File;
    await chatWithYbyrai(audio, "auto");
    keys.push(lastIdempotencyKey(fetchMock));

    const callCount = fetchMock.mock.calls.length;
    const stop = chatWithYbyraiStream(audio, "auto", {
      onTranscription: vi.fn(),
      onTextChunk: vi.fn(),
      onAudioChunk: vi.fn(),
      onDone: vi.fn(),
      onError: vi.fn(),
    });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(callCount + 1));
    keys.push(lastIdempotencyKey(fetchMock));
    stop();

    expect(new Set(keys).size).toBe(keys.length);
  });

  it("sends the backend-required key on science section generation and finalization", async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response("{}", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await generateSection({} as Parameters<typeof generateSection>[0]);
    await finalizeProject({ project_id: "project-42" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(
      /\/api\/v1\/science-project\/generate-section$/,
    );
    expect(String(fetchMock.mock.calls[1]?.[0])).toMatch(
      /\/api\/v1\/science-project\/project-42\/finalize$/,
    );
    for (const [, init] of fetchMock.mock.calls) {
      expect(init?.method).toBe("POST");
      expect(new Headers(init?.headers).get(IDEMPOTENCY_HEADER)).toMatch(UUID_V4);
    }
  });
});
