import { beforeEach, describe, expect, it, vi } from "vitest";
import { getGenerationJob, type GenerationJob } from "@/lib/api";
import { zerdeApi } from "./api";
import { blankRequest } from "./model";
import { loadConsultationWorkspace } from "./recovery";
import type { Assessment } from "./types";

vi.mock("@/lib/api", () => ({ getGenerationJob: vi.fn() }));
vi.mock("./api", () => ({ zerdeApi: { consultation: vi.fn(), assess: vi.fn(), document: vi.fn() } }));
const jobId = "30bdc3b2-41e6-4399-877c-cbab8e93a5d9";
const result: Assessment = { mode: "idea", title: "Saved advice", eligibility: { eligible: true, age_category: "junior", effective_grade: 4, abstract_word_limit: 150, recommended_pages: 15, issues: [] }, sections: [], checks: [], next_steps: [], provenance: { status: "official_rules", official_rules_verified: true, notice: "" }, ai_generated: true };
beforeEach(() => { vi.mocked(zerdeApi.consultation).mockReset(); vi.mocked(zerdeApi.assess).mockReset(); vi.mocked(zerdeApi.document).mockReset(); vi.mocked(getGenerationJob).mockReset(); });

describe("retained Zerde consultations", () => {
  it("restores the exact original request without consulting the newer project draft or enqueueing another paid job", async () => {
    const request = { ...blankRequest("ru"), title: "Original topic", document_ids: ["evidence-1"] };
    vi.mocked(zerdeApi.consultation).mockResolvedValue({ project_id: "project-1", request });
    vi.mocked(getGenerationJob).mockResolvedValue({ id: jobId, kind: "zerde.consult", status: "completed", result } as unknown as GenerationJob);
    vi.mocked(zerdeApi.document).mockResolvedValue({ id: "evidence-1", name: "Original evidence.pdf" } as never);
    const restored = await loadConsultationWorkspace(jobId);
    expect(restored).toMatchObject({ jobId, projectId: "project-1", request, result, documents: [{ id: "evidence-1" }] });
    expect(zerdeApi.assess).not.toHaveBeenCalled();
  });
  it("restores a pending consultation with free checks and preserves temporarily unavailable evidence IDs", async () => {
    const request = { ...blankRequest(), document_ids: ["not-yet-readable"] };
    vi.mocked(zerdeApi.consultation).mockResolvedValue({ project_id: "project-1", request });
    vi.mocked(getGenerationJob).mockResolvedValue({ id: jobId, kind: "zerde.consult", status: "running", result: null } as GenerationJob);
    vi.mocked(zerdeApi.assess).mockResolvedValue({ ...result, ai_generated: false });
    vi.mocked(zerdeApi.document).mockRejectedValue(new Error("temporary transport failure"));
    const restored = await loadConsultationWorkspace(jobId);
    expect(restored.request.document_ids).toEqual(["not-yet-readable"]); expect(restored.documents).toEqual([]);
    expect(restored.result.ai_generated).toBe(false); expect(zerdeApi.assess).toHaveBeenCalledWith(request);
  });
  it("keeps owner and expiry errors instead of falling back to an unrelated local draft", async () => {
    vi.mocked(zerdeApi.consultation).mockRejectedValue({ status: 404 });
    vi.mocked(getGenerationJob).mockRejectedValue({ status: 404 });
    await expect(loadConsultationWorkspace(jobId)).rejects.toMatchObject({ status: 404 });
    expect(zerdeApi.assess).not.toHaveBeenCalled();
  });
  it("rejects another module or a corrupt completed result", async () => {
    vi.mocked(zerdeApi.consultation).mockResolvedValue({ project_id: null, request: blankRequest() });
    vi.mocked(getGenerationJob).mockResolvedValue({ id: jobId, kind: "essay.generate", status: "completed", result } as unknown as GenerationJob);
    await expect(loadConsultationWorkspace(jobId)).rejects.toMatchObject({ status: 404 });
    vi.mocked(getGenerationJob).mockResolvedValue({ id: jobId, kind: "zerde.consult", status: "completed", result: null } as GenerationJob);
    await expect(loadConsultationWorkspace(jobId)).rejects.toMatchObject({ status: 502 });
    expect(zerdeApi.assess).not.toHaveBeenCalled();
  });
});
