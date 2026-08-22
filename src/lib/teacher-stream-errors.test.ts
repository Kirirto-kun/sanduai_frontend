import { afterEach, describe, expect, it, vi } from "vitest";

import { chatWithYbyraiStream, sendSandubotMessageStream } from "./api";

describe("teacher-facing stream failures", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps a failed SanduBot response without exposing provider text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ detail: "OpenAI upstream 502: secret diagnostic" }),
          { status: 502, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const consume = async () => {
      for await (const event of sendSandubotMessageStream("Сәлем", "kk")) {
        void event;
      }
    };

    await expect(consume()).rejects.toMatchObject({
      message: "Қызмет уақытша қолжетімсіз. Сәл кейінірек қайталап көріңіз.",
    });
  });

  it("sanitizes an error event yielded by the SanduBot stream", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'data: {"type":"error","message":"provider stack api-key=secret"}\n\n',
          ),
        );
        controller.close();
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(body, { status: 200 })),
    );

    const events = [];
    for await (const event of sendSandubotMessageStream("hello", "ru")) {
      events.push(event);
    }

    expect(events).toEqual([
      { type: "error", message: "Не удалось выполнить действие. Попробуйте ещё раз." },
    ]);
  });

  it("maps Ybyrai HTTP failures before invoking the UI callback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ detail: "voice provider key leaked" }),
          { status: 503, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const onError = vi.fn();
    const audio = new Blob(["audio"], { type: "audio/webm" }) as File;

    const stop = chatWithYbyraiStream(
      audio,
      "auto",
      {
        onTranscription: vi.fn(),
        onTextChunk: vi.fn(),
        onAudioChunk: vi.fn(),
        onDone: vi.fn(),
        onError,
      },
      "kk",
    );

    await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError.mock.calls[0]?.[0]).toMatchObject({
      name: "TeacherFacingError",
      message: "Қызмет уақытша қолжетімсіз. Сәл кейінірек қайталап көріңіз.",
    });
    expect(onError.mock.calls[0]?.[0]?.message).not.toContain("provider");
    stop();
  });
});
