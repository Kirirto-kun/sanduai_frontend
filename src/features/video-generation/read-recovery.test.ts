import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError, API_ERROR_CODES } from "@/lib/http-client";
import { isVideoReadNetworkError, recoverVideoRead } from "./read-recovery";

const networkError = () =>
  new ApiRequestError(
    "Unable to reach server",
    0,
    undefined,
    API_ERROR_CODES.NETWORK_ERROR,
  );
afterEach(() => vi.useRealTimers());
describe("bounded video read recovery", () => {
  it("recovers one interrupted read and stops after the second network failure", async () => {
    vi.useFakeTimers();
    const recovered = vi
      .fn()
      .mockRejectedValueOnce(networkError())
      .mockResolvedValue("ready");
    const result = recoverVideoRead("catalog", recovered);
    await vi.runAllTimersAsync();
    await expect(result).resolves.toBe("ready");
    expect(recovered).toHaveBeenCalledTimes(2);
    const failed = vi.fn().mockRejectedValue(networkError());
    const failure = recoverVideoRead("catalog", failed);
    const assertion = expect(failure).rejects.toMatchObject({
      code: API_ERROR_CODES.NETWORK_ERROR,
    });
    await vi.runAllTimersAsync();
    await assertion;
    expect(failed).toHaveBeenCalledTimes(2);
  });
  it.each([401, 403, 404, 410, 422, 429, 500, 503])(
    "does not retry an HTTP %s response",
    async (status) => {
      const read = vi
        .fn()
        .mockRejectedValue(new ApiRequestError("HTTP failed", status));
      await expect(recoverVideoRead("catalog", read)).rejects.toMatchObject({
        status,
      });
      expect(read).toHaveBeenCalledOnce();
    },
  );
  it("does not retry a timeout or an explicitly cancelled request", () => {
    expect(
      isVideoReadNetworkError(
        new ApiRequestError("Timed out", 0, undefined, API_ERROR_CODES.TIMEOUT),
      ),
    ).toBe(false);
    expect(
      isVideoReadNetworkError(
        new ApiRequestError("Cancelled", 0, undefined, API_ERROR_CODES.ABORTED),
      ),
    ).toBe(false);
  });
  it("cancels recovery during the delay without starting another read", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const read = vi.fn().mockRejectedValue(networkError());
    const result = recoverVideoRead("catalog", read, controller.signal);
    const assertion = expect(result).rejects.toMatchObject({
      code: API_ERROR_CODES.ABORTED,
    });
    await vi.advanceTimersByTimeAsync(0);
    controller.abort();
    await assertion;
    expect(read).toHaveBeenCalledOnce();
  });
});
