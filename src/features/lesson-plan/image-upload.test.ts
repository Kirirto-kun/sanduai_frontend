import { describe, expect, it } from "vitest";
import { lessonImageUploadError, MAX_LESSON_IMAGE_BYTES } from "./image-upload";

const image = { size: MAX_LESSON_IMAGE_BYTES, type: "image/png" };
describe("lesson source upload limits", () => {
  it("allows at most three images, including already attached pages, before reading bytes", () => {
    expect(lessonImageUploadError(0, [image, image, image], false)).toBeNull();
    expect(lessonImageUploadError(2, [image], true)).toBeNull();
    expect(lessonImageUploadError(2, [image, image], false)).toContain("не более 3");
    expect(lessonImageUploadError(0, [image, image, image, image], true)).toContain("3 сурет");
  });
  it("accepts exactly 10 MiB and rejects larger or non-image input with localized recovery text", () => {
    expect(lessonImageUploadError(0, [image], false)).toBeNull();
    expect(lessonImageUploadError(0, [{ ...image, size: image.size + 1 }], false)).toContain("10 МБ");
    expect(lessonImageUploadError(0, [{ size: 10, type: "application/pdf" }], true)).toBe("Сурет файлын таңдаңыз.");
  });
});
