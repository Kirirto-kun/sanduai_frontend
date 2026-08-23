import { describe, expect, it } from "vitest";
import { resolveBootstrapUser } from "./auth-token";

function jwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.signature`;
}

describe("resolveBootstrapUser", () => {
  const cachedUser = { userId: "teacher-1", fullName: "Teacher" };
  const nowMs = 2_000_000_000_000;

  it("rejects an expired token during auth bootstrap", () => {
    const expiredToken = jwt({ sub: "teacher-1", exp: nowMs / 1000 - 1, role: "teacher" });

    expect(resolveBootstrapUser(expiredToken, cachedUser, nowMs)).toBeNull();
  });

  it("rejects malformed tokens and restores a valid token with its role", () => {
    expect(resolveBootstrapUser("not-a-jwt", cachedUser, nowMs)).toBeNull();

    const validToken = jwt({ sub: "teacher-1", exp: nowMs / 1000 + 60, role: "teacher" });
    expect(resolveBootstrapUser(validToken, cachedUser, nowMs)).toEqual({
      ...cachedUser,
      role: "teacher",
    });
  });

  it("requires a matching subject and never trusts a cached role over the token", () => {
    const missingSubject = jwt({ exp: nowMs / 1000 + 60, role: "teacher" });
    expect(resolveBootstrapUser(missingSubject, cachedUser, nowMs)).toBeNull();

    const teacherToken = jwt({ sub: "teacher-1", exp: nowMs / 1000 + 60, role: "teacher" });
    expect(resolveBootstrapUser(teacherToken, { ...cachedUser, role: "admin" }, nowMs)).toEqual({
      ...cachedUser,
      role: "teacher",
    });

    const tokenWithoutRole = jwt({ sub: "teacher-1", exp: nowMs / 1000 + 60 });
    expect(resolveBootstrapUser(tokenWithoutRole, { ...cachedUser, role: "admin" }, nowMs)).toEqual({
      ...cachedUser,
      role: undefined,
    });
  });
});
