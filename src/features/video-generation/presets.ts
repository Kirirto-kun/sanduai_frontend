export const VIDEO_STYLE_PRESETS = [
  { value: "realistic", ru: "Реализм", kk: "Реализм" },
  { value: "cinematic", ru: "Кинематографичный", kk: "Кинематографиялық" },
  { value: "3d", ru: "3D", kk: "3D" },
  { value: "anime", ru: "Аниме", kk: "Аниме" },
  { value: "cartoon", ru: "Мультфильм", kk: "Мультфильм" },
  { value: "illustration", ru: "Иллюстрация", kk: "Иллюстрация" },
  { value: "fantasy", ru: "Фэнтези", kk: "Қиял-ғажайып" },
  { value: "cyberpunk", ru: "Киберпанк", kk: "Киберпанк" },
  { value: "vintage", ru: "Винтаж", kk: "Винтаж" },
  { value: "minimal", ru: "Минимализм", kk: "Минимализм" },
  { value: "product video", ru: "Предметное видео", kk: "Өнім видеосы" },
] as const;

export const VIDEO_CAMERA_PRESETS = [
  { value: "static", ru: "Статичная", kk: "Қозғалмайтын" },
  { value: "zoom in", ru: "Приближение", kk: "Жақындау" },
  { value: "zoom out", ru: "Отдаление", kk: "Алыстау" },
  { value: "pan left", ru: "Панорама влево", kk: "Солға панорама" },
  { value: "pan right", ru: "Панорама вправо", kk: "Оңға панорама" },
  { value: "tilt up", ru: "Наклон вверх", kk: "Жоғары бұрылу" },
  { value: "tilt down", ru: "Наклон вниз", kk: "Төмен бұрылу" },
  { value: "orbit", ru: "Облёт", kk: "Айналу" },
  { value: "tracking shot", ru: "Слежение за объектом", kk: "Нысанға ілесу" },
  { value: "handheld", ru: "С рук", kk: "Қол камерасы" },
  { value: "drone", ru: "Съёмка с дрона", kk: "Дронмен түсіру" },
  {
    value: "cinematic movement",
    ru: "Кинематографичное движение",
    kk: "Кинематографиялық қозғалыс",
  },
] as const;

export function videoPresetLabel(
  field: "style" | "camera",
  value: string,
  kk: boolean,
): string {
  const values = field === "style" ? VIDEO_STYLE_PRESETS : VIDEO_CAMERA_PRESETS;
  const preset = values.find((item) => item.value === value);
  return preset ? (kk ? preset.kk : preset.ru) : value;
}
