import { describe, expect, it } from "vitest";

import { ApiRequestError } from "./http-client";
import type { AdminUser } from "./api";
import {
  adminUserActionErrorMessage,
  applyAdminUserAction,
  isAdminUserNotFoundError,
  isAmbiguousAdminUserDeleteError,
  isExactEmailConfirmation,
  isProtectedAdminUser,
  reconciledDeletedAdminUserResult,
} from "./admin-user-management";

const teacher: AdminUser = {
  user_id: "teacher-1",
  email: "teacher@example.kz",
  phone: null,
  full_name: "Teacher",
  role: "teacher",
  balance: 145,
  created_at: "2026-09-03T00:00:00Z",
  has_subscription: true,
  subscription_end: "2026-10-03T00:00:00Z",
  subscription_plan: "premium",
};

describe("admin user management state", () => {
  it("updates subscription and token state from authoritative responses", () => {
    const withoutSubscription = applyAdminUserAction([teacher], "revoke-subscription", {
      user_id: teacher.user_id,
      has_subscription: false,
      subscription_plan: "free",
      subscription_end: null,
      balance: 145,
      message: "ok",
    });
    expect(withoutSubscription[0]).toMatchObject({
      balance: 145,
      has_subscription: false,
      subscription_plan: "free",
      subscription_end: null,
    });

    const withoutTokens = applyAdminUserAction(withoutSubscription, "reset-tokens", {
      user_id: teacher.user_id,
      balance: 0,
      has_subscription: false,
      subscription_plan: "free",
      subscription_end: null,
      message: "ok",
    });
    expect(withoutTokens[0]?.balance).toBe(0);
  });

  it("removes only the deleted user and protects administrator accounts", () => {
    const admin = { ...teacher, user_id: "admin-1", role: "admin" };
    const remaining = applyAdminUserAction([teacher, admin], "delete-user", {
      user_id: teacher.user_id,
      balance: 0,
      has_subscription: false,
      subscription_plan: "free",
      subscription_end: null,
      message: "deleted",
      deleted: true,
    });

    expect(remaining).toEqual([admin]);
    expect(isProtectedAdminUser(admin, "admin-1")).toBe(true);
    expect(isProtectedAdminUser(teacher, "admin-1")).toBe(false);
  });

  it("requires the complete email confirmation while ignoring harmless casing and spaces", () => {
    expect(isExactEmailConfirmation(" Teacher@Example.KZ ", teacher.email)).toBe(true);
    expect(isExactEmailConfirmation("teacher", teacher.email)).toBe(false);
    expect(isExactEmailConfirmation("teacher@example.kz.extra", teacher.email)).toBe(false);
  });

  it.each([
    "revoke-subscription",
    "reset-tokens",
    "delete-user",
  ] as const)("shows a specific retry message for active-work conflict during %s", (action) => {
    const error = new ApiRequestError("raw database error", 409, {
      detail: { code: "USER_HAS_ACTIVE_GENERATIONS", message: "internal details" },
    });

    const message = adminUserActionErrorMessage(error, "ru", action);
    expect(message).toContain("выполняется работа");
    expect(message).not.toContain("database");
    expect(message).not.toContain("internal");
  });

  it("classifies only ambiguous transport/server failures for delete reconciliation", () => {
    expect(isAmbiguousAdminUserDeleteError(new ApiRequestError("network", 0, undefined, "NETWORK_ERROR")))
      .toBe(true);
    expect(isAmbiguousAdminUserDeleteError(new ApiRequestError("server", 503))).toBe(true);
    expect(isAmbiguousAdminUserDeleteError(new ApiRequestError("conflict", 409))).toBe(false);
    expect(isAdminUserNotFoundError(new ApiRequestError("missing", 404))).toBe(true);
    expect(reconciledDeletedAdminUserResult("teacher-1")).toMatchObject({
      user_id: "teacher-1",
      deleted: true,
      has_subscription: false,
      balance: 0,
    });
  });

  it("maps the exact protected-admin code before the generic conflict copy", () => {
    const error = new ApiRequestError("raw", 409, {
      detail: { code: "ADMIN_ACCOUNT_PROTECTED" },
    });

    expect(adminUserActionErrorMessage(error, "ru", "delete-user"))
      .toContain("аккаунт администратора");
  });
});
