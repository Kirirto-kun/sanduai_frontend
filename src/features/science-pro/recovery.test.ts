import { beforeEach, describe, expect, it, vi } from "vitest";
import { getGenerationJob, type GenerationJob } from "@/lib/api";
import { scienceApi } from "./api";
import { blankRequest } from "./model";
import { loadScienceConsultation } from "./recovery";
import type { Assessment } from "./types";

vi.mock("@/lib/api", () => ({ getGenerationJob: vi.fn() }));
vi.mock("./api", () => ({ scienceApi: { consultation: vi.fn(), assess: vi.fn(), document: vi.fn(), open: vi.fn(), save: vi.fn(), consult: vi.fn() } }));
const jobId = "30bdc3b2-41e6-4399-877c-cbab8e93a5d9";
const result: Assessment = { mode: "idea", title: "Original advice", eligibility: { eligible: true, issues: [] }, sections: [], checks: [], official_checks: [], quality_checks: [], next_steps: [], provenance: { official_rules_verified: false, notice: "" }, ai_generated: true };
beforeEach(() => vi.clearAllMocks());

describe("retained Science consultation input", () => {
  it("restores the selected original job after the current project changes without saving or enqueueing", async () => {
    const request = { ...blankRequest("ru"), title: "Original research", document_ids: ["original-evidence"] };
    vi.mocked(scienceApi.consultation).mockResolvedValue({ project_id: "project", request });
    vi.mocked(getGenerationJob).mockResolvedValue({ id: jobId, kind: "science_pro.consult", status: "completed", result } as unknown as GenerationJob);
    vi.mocked(scienceApi.open).mockResolvedValue({ request: { ...request, title: "Later edited project" } } as never);
    vi.mocked(scienceApi.document).mockResolvedValue({ id: "original-evidence" } as never);
    expect(await loadScienceConsultation(jobId)).toMatchObject({ jobId, projectId: "project", request, result, documents: [{ id: "original-evidence" }] });
    expect(scienceApi.consultation).toHaveBeenCalledWith(jobId); expect(getGenerationJob).toHaveBeenCalledWith(jobId);
    expect(scienceApi.open).not.toHaveBeenCalled(); expect(scienceApi.save).not.toHaveBeenCalled(); expect(scienceApi.consult).not.toHaveBeenCalled(); expect(scienceApi.assess).not.toHaveBeenCalled();
  });
  it("restores pending polling context using only free checks and retains unavailable evidence IDs", async () => {
    const request = { ...blankRequest(), document_ids: ["temporarily-unavailable"] };
    vi.mocked(scienceApi.consultation).mockResolvedValue({ project_id: null, request });
    vi.mocked(getGenerationJob).mockResolvedValue({ id: jobId, kind: "science_pro.consult", status: "running", result: null } as GenerationJob);
    vi.mocked(scienceApi.assess).mockResolvedValue({ ...result, ai_generated: false }); vi.mocked(scienceApi.document).mockRejectedValue(new Error("offline"));
    const seed = await loadScienceConsultation(jobId);
    expect(seed).toMatchObject({ jobId, projectId: null, request, documents: [] }); expect(seed.result.ai_generated).toBe(false);
    expect(scienceApi.assess).toHaveBeenCalledWith(request); expect(scienceApi.consult).not.toHaveBeenCalled();
  });
  it.each([401, 404, 409, 410])("keeps owner/context/expiry failure %s instead of opening an unrelated draft", async status => {
    vi.mocked(scienceApi.consultation).mockRejectedValue({ status }); vi.mocked(getGenerationJob).mockRejectedValue({ status });
    await expect(loadScienceConsultation(jobId)).rejects.toMatchObject({ status });
    expect(scienceApi.assess).not.toHaveBeenCalled(); expect(scienceApi.open).not.toHaveBeenCalled(); expect(scienceApi.consult).not.toHaveBeenCalled();
  });
  it("rejects other modules and corrupt completed advice", async () => {
    vi.mocked(scienceApi.consultation).mockResolvedValue({ project_id: null, request: blankRequest() });
    vi.mocked(getGenerationJob).mockResolvedValue({ id: jobId, kind: "zerde.consult", status: "completed", result } as unknown as GenerationJob);
    await expect(loadScienceConsultation(jobId)).rejects.toMatchObject({ status: 404 });
    vi.mocked(getGenerationJob).mockResolvedValue({ id: jobId, kind: "science_pro.consult", status: "completed", result: null } as GenerationJob);
    await expect(loadScienceConsultation(jobId)).rejects.toMatchObject({ status: 502 }); expect(scienceApi.assess).not.toHaveBeenCalled();
  });
});
