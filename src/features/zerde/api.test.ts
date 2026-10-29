import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { zerdeApi } from "./api";
import { blankRequest } from "./model";

vi.mock("@/lib/api", () => ({ getToken: () => "private-test-token" }));
const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => { vi.stubGlobal("fetch", fetchMock); });
afterEach(() => { vi.unstubAllGlobals(); fetchMock.mockReset(); });
function json(value: unknown, status = 200) { return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } }); }

describe("Zerde authenticated API contracts", () => {
  it("consumes the direct assessment response instead of expecting a project wrapper", async () => {
    const result = { mode: "idea", title: "Result", sections: [] }; fetchMock.mockResolvedValue(json(result));
    expect(await zerdeApi.assessProject("project-id")).toEqual(result);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/v1/zerde/projects/project-id/assess"), expect.objectContaining({ method: "POST" }));
  });
  it("preserves evidence identifiers on project save", async () => {
    fetchMock.mockResolvedValue(json({ id: "saved" })); const body = { ...blankRequest(), document_ids: ["evidence-1", "evidence-2"] };
    await zerdeApi.save(body, "existing"); const init = fetchMock.mock.calls[0][1]!;
    expect(init.method).toBe("PUT"); expect(JSON.parse(init.body as string).request.document_ids).toEqual(["evidence-1", "evidence-2"]);
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer private-test-token");
  });
  it("uses the same explicit idempotency key for paid consultation retries", async () => {
    fetchMock.mockResolvedValue(json({ id: "accepted", kind: "zerde.consult" }, 202));
    await zerdeApi.consult(blankRequest(), "project", "intent-123");
    const init = fetchMock.mock.calls[0][1]!;
    expect(new Headers(init.headers).get("Idempotency-Key")).toBe("intent-123");
    expect(JSON.parse(init.body as string).project_id).toBe("project");
  });
  it("lets the browser generate the multipart boundary on real uploads", async () => {
    fetchMock.mockResolvedValue(json({ id: "upload" }));
    await zerdeApi.upload(new File(["real research"], "research.txt", { type: "text/plain" }), "project");
    const init = fetchMock.mock.calls[0][1]!; expect(init.body).toBeInstanceOf(FormData);
    expect(new Headers(init.headers).has("Content-Type")).toBe(false);
    expect((init.body as FormData).get("kind")).toBe("project");
  });
  it("rejects errors and HTML responses instead of downloading them as official documents", async () => {
    fetchMock.mockResolvedValue(json({ detail: "Not available" }, 400));
    await expect(zerdeApi.export(blankRequest(), "diary", "pdf", "jury")).rejects.toMatchObject({ status: 400 });
    fetchMock.mockResolvedValue(new Response("<html>login</html>", { status: 200, headers: { "Content-Type": "text/html" } }));
    await expect(zerdeApi.export(blankRequest(), "diary", "pdf", "jury")).rejects.toMatchObject({ status: 502 });
  });
  it("downloads only a real nonempty PDF and retains the requested audience", async () => {
    fetchMock.mockResolvedValue(new Response("%PDF-1.7", { headers: { "Content-Type": "application/pdf" } }));
    const result = await zerdeApi.export(blankRequest(), "diary", "pdf", "administrative"); expect(result.size).toBeGreaterThan(0);
    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string)).toMatchObject({ audience: "administrative", template: "diary", format: "pdf" });
  });
});
