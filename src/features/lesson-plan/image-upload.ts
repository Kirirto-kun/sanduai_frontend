export const MAX_LESSON_IMAGES = 3;
export const MAX_LESSON_IMAGE_BYTES = 10 * 1024 * 1024;

export function lessonImageUploadError(existingCount: number, files: readonly { size: number; type: string }[], kk: boolean): string | null {
  if (existingCount + files.length > MAX_LESSON_IMAGES) return kk
    ? "Ең көбі 3 сурет тіркеуге болады. Артық суреттерді жойыңыз немесе азырақ файл таңдаңыз."
    : "Можно прикрепить не более 3 изображений. Удалите лишние изображения или выберите меньше файлов.";
  if (files.some((file) => !file.type.startsWith("image/"))) return kk ? "Сурет файлын таңдаңыз." : "Выберите файл изображения.";
  if (files.some((file) => file.size > MAX_LESSON_IMAGE_BYTES)) return kk ? "Әр суреттің көлемі 10 МБ-тан аспауы керек." : "Размер каждого изображения не должен превышать 10 МБ.";
  return null;
}
