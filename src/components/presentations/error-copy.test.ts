import { describe, expect, it } from "vitest";
import { API_ERROR_CODES } from "../../lib/http-client";
import { getPresentationCopy } from "./copy";
import {
  isSlidesNotReadyError,
  presentationErrorMessage,
  qaWarningMessage,
} from "./error-copy";

function apiError({
  message = "provider stack trace: secret-key-123",
  status = 500,
  code = API_ERROR_CODES.SERVER_ERROR,
  serverCode,
}: {
  message?: string;
  status?: number;
  code?: string;
  serverCode?: string;
} = {}) {
  return Object.assign(new Error(message), { status, code, serverCode });
}

describe("presentation teacher-facing error copy", () => {
  const ru = getPresentationCopy("ru");
  const kk = getPresentationCopy("kk");

  it("never returns a raw provider or stack-trace message", () => {
    const message = presentationErrorMessage(apiError(), ru);
    expect(message).toBe(ru.genericError);
    expect(message).not.toContain("provider");
    expect(message).not.toContain("secret-key-123");
  });

  it("localizes actionable transport and balance failures", () => {
    expect(
      presentationErrorMessage(
        apiError({ status: 0, code: API_ERROR_CODES.NETWORK_ERROR }),
        kk,
      ),
    ).toBe(kk.connectionError);
    expect(
      presentationErrorMessage(
        apiError({ status: 402, code: API_ERROR_CODES.PAYMENT_REQUIRED }),
        ru,
      ),
    ).toBe(ru.paymentError);
  });

  it("uses the stable slides-not-ready code without exposing the server message", () => {
    const error = apiError({
      message: "All slides must be generated before export /srv/app/internal.py:81",
      status: 409,
      code: API_ERROR_CODES.CONFLICT,
      serverCode: "slides_not_ready",
    });
    expect(isSlidesNotReadyError(error)).toBe(true);
    expect(presentationErrorMessage(error, kk)).toBe(kk.exportSlidesNotReady);
  });

  it("accepts the namespaced slides-not-ready server code", () => {
    const error = apiError({
      message: "hidden server detail",
      status: 409,
      code: API_ERROR_CODES.CONFLICT,
      serverCode: "PRESENTATION_SLIDES_NOT_READY",
    });
    expect(isSlidesNotReadyError(error)).toBe(true);
    expect(presentationErrorMessage(error, ru)).toBe(ru.exportSlidesNotReady);
  });

  it("turns technical image checks into clear review guidance", () => {
    expect(
      qaWarningMessage({ message: "OCR provider unavailable: upstream 502" }, kk),
    ).toBe(kk.qaTextWarning);
    const hiddenCost = qaWarningMessage(
      { message: "Себестоимость 9.95 ₸ достигла лимита" },
      ru,
    );
    expect(hiddenCost).toBe(ru.qaGenericWarning);
    expect(hiddenCost).not.toContain("₸");
    expect(hiddenCost).not.toContain("9.95");
  });
});
