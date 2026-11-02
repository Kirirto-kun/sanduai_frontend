import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { scienceApi } from "./api";
import { blankRequest } from "./model";

vi.mock("@/lib/api", () => ({ getToken: () => "private-token", validateGenerationJobAcknowledgement: (value: unknown) => value }));
const fetchMock = vi.fn<typeof fetch>(); beforeEach(() => vi.stubGlobal("fetch", fetchMock)); afterEach(() => { vi.unstubAllGlobals(); fetchMock.mockReset(); });
function json(value: unknown, status = 200) { return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } }); }
describe("Scientific PRO private API", () => {
  it("reads the selected private consultation snapshot with authentication and no cache", async () => {
    fetchMock.mockResolvedValue(json({ project_id: "original-project", request: blankRequest() })); await scienceApi.consultation("selected-job");
    const [url, init] = fetchMock.mock.calls[0]; expect(url).toContain("/api/v1/science-pro/consultations/selected-job"); expect(init?.method).toBe("GET"); expect(init?.cache).toBe("no-store"); expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer private-token");
  });
  it("saves the full scientific context with owner authentication and evidence IDs", async () => {
    fetchMock.mockResolvedValue(json({ id: "saved" })); const request = { ...blankRequest(), grades: [8, 12], contributions: ["", "Second author's own work"], document_ids: ["rules", "research"] }; await scienceApi.save(request, "existing");
    const [url, init] = fetchMock.mock.calls[0]; expect(url).toContain("/api/v1/science-pro/projects/existing"); expect(init?.method).toBe("PUT"); expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer private-token"); expect(JSON.parse(init?.body as string).request).toMatchObject(request);
  });
  it("retains consultation idempotency and project association", async () => {
    fetchMock.mockResolvedValue(json({ id: "job", kind: "science_pro.consult" }, 202)); await scienceApi.consult(blankRequest(), "project", "same-intent");
    const init = fetchMock.mock.calls[0][1]; expect(new Headers(init?.headers).get("Idempotency-Key")).toBe("same-intent"); expect(JSON.parse(init?.body as string).project_id).toBe("project");
  });
  it("passes file type and selected language in multipart without overriding the boundary", async () => {
    fetchMock.mockResolvedValue(json({ id: "file" })); await scienceApi.upload(new File(["Actual research"], "rules.txt"), "official_rules", "ru"); const init = fetchMock.mock.calls[0][1];
    expect(new Headers(init?.headers).has("Content-Type")).toBe(false); const body = init?.body as FormData; expect(body.get("kind")).toBe("official_rules"); expect(body.get("language")).toBe("ru"); expect(body.get("file")).toBeInstanceOf(File);
  });
  it("accepts deletion's empty 204 response", async () => { fetchMock.mockResolvedValue(new Response(null, { status: 204 })); await expect(scienceApi.remove("project")).resolves.toBeUndefined(); });
  it("rejects unsuccessful exports, HTML and false MIME signatures", async () => {
    fetchMock.mockResolvedValue(json({ detail: "Unavailable" }, 403)); await expect(scienceApi.export(blankRequest(), "diary", "pdf")).rejects.toMatchObject({ status: 403 });
    fetchMock.mockResolvedValue(new Response("<html>Login</html>", { headers: { "Content-Type": "text/html" } })); await expect(scienceApi.export(blankRequest(), "diary", "pdf")).rejects.toMatchObject({ status: 502 });
    fetchMock.mockResolvedValue(new Response("Not a PDF", { headers: { "Content-Type": "application/pdf" } })); await expect(scienceApi.export(blankRequest(), "diary", "pdf")).rejects.toMatchObject({ status: 502 });
  });
  it("exports actual document bytes without inheriting a Zerde jury/administrative format", async () => {
    fetchMock.mockResolvedValue(new Response("%PDF-1.7", { headers: { "Content-Type": "application/pdf" } })); const blob = await scienceApi.export(blankRequest(), "passport", "pdf", "owner-project"); expect(blob.size).toBeGreaterThan(0); const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string); expect(body).toMatchObject({ template: "passport", format: "pdf", project_id: "owner-project" }); expect(body).not.toHaveProperty("audience");
  });
});
