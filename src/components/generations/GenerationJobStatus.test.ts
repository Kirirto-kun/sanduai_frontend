import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GenerationJobStatus } from "./GenerationJobStatus";
import type { GenerationJobSummary } from "@/lib/api";
const job = { id: "own-job", status: "queued", created_at: "2026-11-10T10:00:00Z", started_at: null } as GenerationJobSummary;
const render = (props: Partial<Parameters<typeof GenerationJobStatus>[0]> = {}) => renderToStaticMarkup(createElement(GenerationJobStatus, { job, language: "ru", now: Date.parse("2026-11-10T10:02:00Z"), ...props }));
describe("durable job status feedback", () => {
  it("distinguishes queue from execution and labels elapsed wait without exact promises", () => {
    expect(render()).toContain("В очереди"); expect(render()).toContain("2 мин");
    const running = render({ job: { ...job, status: "running", started_at: "2026-11-10T10:01:00Z" } });
    expect(running).toContain("Создаём материал"); expect(running).toContain("Выполняется");
  });
  it("supports missing metadata, marks estimates and only labels server supplied admin priority", () => {
    expect(render()).not.toContain("Приоритет администратора");
    const estimate = render({ job: { ...job, estimated_wait_seconds: 80, priority: "admin" } });
    expect(estimate).toContain("Ориентировочное ожидание"); expect(estimate).toContain("Приоритет администратора");
    expect(estimate).not.toContain("queue_position");
  });
  it.each([401, 403, 404, 410])("shows a recoverable %i state instead of announcing stale execution", status => {
    const html = render({ error: { status }, onRetry: () => {} });
    expect(html).not.toContain("В очереди"); expect(html).toContain("Проверить снова");
    expect(html).toContain(status < 404 ? "Войдите снова" : "недоступен");
  });
  it("keeps Kazakh reconnect copy separate from last known phase and avoids clock live announcements", () => {
    const html = render({ language: "kk", error: new Error("offline"), onRetry: () => {} });
    expect(html).toContain("Байланыс"); expect(html).toContain("Соңғы белгілі күй");
    expect(html).toContain('aria-live="off"'); expect(html).toContain('role="status"');
    expect(html).not.toContain("animate-spin");
  });
});
