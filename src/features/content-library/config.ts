import type {
  ContentAssetRole,
  ContentLanguage,
  ContentSegment,
  MaterialType,
} from "./types";

export type UiLanguage = "ru" | "kk";
export type LocalizedLabel = Record<UiLanguage, string>;

export type AssetRule = {
  role: ContentAssetRole;
  label: LocalizedLabel;
  hint: LocalizedLabel;
  accept: string;
  extensions: string[];
  maxBytes: number;
  multiple?: boolean;
  required?: boolean;
};

export type MaterialTypeConfig = {
  label: LocalizedLabel;
  description: LocalizedLabel;
  icon: string;
  assets: AssetRule[];
};

const MB = 1024 * 1024;

const visualRule: AssetRule = {
  role: "visual",
  label: { ru: "Наглядные материалы", kk: "Көрнекіліктер" },
  hint: {
    ru: "Одно или несколько изображений либо PDF, до 25 МБ каждый.",
    kk: "Бір немесе бірнеше сурет не PDF, әрқайсысы 25 МБ-қа дейін.",
  },
  accept: "image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf",
  extensions: ["jpg", "jpeg", "png", "webp", "pdf"],
  maxBytes: 25 * MB,
  multiple: true,
  required: true,
};

const planRule = (required: boolean): AssetRule => ({
  role: "plan",
  label: { ru: "План", kk: "Жоспар" },
  hint: {
    ru: `DOCX или PDF, до 50 МБ${required ? ". Обязательный файл." : "."}`,
    kk: `DOCX немесе PDF, 50 МБ-қа дейін${required ? ". Міндетті файл." : "."}`,
  },
  accept: "application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,.docx,.pdf",
  extensions: ["docx", "pdf"],
  maxBytes: 50 * MB,
  required,
});

const presentationRule = (required: boolean): AssetRule => ({
  role: "presentation",
  label: { ru: "Презентация", kk: "Презентация" },
  hint: {
    ru: `PPTX, до 100 МБ${required ? ". Обязательный файл." : "."}`,
    kk: `PPTX, 100 МБ-қа дейін${required ? ". Міндетті файл." : "."}`,
  },
  accept: "application/vnd.openxmlformats-officedocument.presentationml.presentation,.pptx",
  extensions: ["pptx"],
  maxBytes: 100 * MB,
  required,
});

const previewRule: AssetRule = {
  role: "preview",
  label: { ru: "Обложка", kk: "Мұқаба" },
  hint: {
    ru: "Необязательно. JPG, PNG или WEBP до 10 МБ. Без обложки будет создано превью первого слайда.",
    kk: "Міндетті емес. JPG, PNG немесе WEBP 10 МБ-қа дейін. Мұқабасыз бірінші слайдтан превью жасалады.",
  },
  accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
  extensions: ["jpg", "jpeg", "png", "webp"],
  maxBytes: 10 * MB,
};

const visualAssets = [visualRule, planRule(false), presentationRule(false), previewRule];
const presentationAssets = [presentationRule(true), previewRule];

const openLessonWordRule: AssetRule = {
  role: "plan",
  label: { ru: "План урока (Word)", kk: "Сабақ жоспары (Word)" },
  hint: {
    ru: "Если есть план урока, загрузите DOCX до 50 МБ. Старый DOC пересохраните в Word как DOCX.",
    kk: "Сабақ жоспары бар болса, 50 МБ-қа дейінгі DOCX файлын жүктеңіз. Ескі DOC файлын Word-та DOCX түрінде қайта сақтаңыз.",
  },
  accept: "application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx",
  extensions: ["docx"],
  maxBytes: 50 * MB,
};

const openLessonAssets = [presentationRule(true), previewRule, openLessonWordRule];

export const MATERIAL_TYPE_CONFIG: Record<MaterialType, MaterialTypeConfig> = {
  visual_aid: {
    label: { ru: "Наглядные материалы", kk: "Көрнекіліктер" },
    description: {
      ru: "Изображения или PDF; план и презентацию можно добавить при наличии.",
      kk: "Суреттер немесе PDF; жоспар мен презентацияны бар болса қосуға болады.",
    },
    icon: "🖼️",
    assets: visualAssets,
  },
  safety_visual_aid: {
    label: { ru: "Наглядность по безопасности", kk: "Қауіпсіздік көрнекіліктері" },
    description: {
      ru: "Материалы по безопасности; план и презентация необязательны.",
      kk: "Қауіпсіздік материалдары; жоспар мен презентация міндетті емес.",
    },
    icon: "🛡️",
    assets: visualAssets,
  },
  offline_game: {
    label: { ru: "Игры без интернета", kk: "Интернетсіз ойындар" },
    description: { ru: "Готовые офлайн-игры в презентации.", kk: "Презентация түріндегі дайын офлайн ойындар." },
    icon: "🎲",
    assets: presentationAssets,
  },
  grouping: {
    label: { ru: "Деление на группы", kk: "Топқа бөлу" },
    description: { ru: "Шаблоны и игры для деления на группы.", kk: "Топқа бөлуге арналған шаблондар мен ойындар." },
    icon: "👥",
    assets: presentationAssets,
  },
  feedback: {
    label: { ru: "Обратная связь", kk: "Кері байланыс" },
    description: { ru: "Инструменты обратной связи в презентации.", kk: "Презентациядағы кері байланыс құралдары." },
    icon: "💬",
    assets: presentationAssets,
  },
  open_lesson_subject_template: {
    label: { ru: "Шаблоны открытых уроков", kk: "Ашық сабақ шаблондары" },
    description: { ru: "Предметные шаблоны для открытого урока.", kk: "Ашық сабаққа арналған пәндік шаблондар." },
    icon: "📐",
    assets: presentationAssets,
  },
  open_lesson: {
    label: { ru: "Открытые уроки", kk: "Ашық сабақтар" },
    description: {
      ru: "Презентация открытого урока, обложка и план урока в Word (DOCX).",
      kk: "Ашық сабақтың презентациясы, мұқабасы және Word (DOCX) форматындағы сабақ жоспары.",
    },
    icon: "🎓",
    assets: openLessonAssets,
  },
  event: {
    label: { ru: "Мероприятия", kk: "Іс-шаралар" },
    description: { ru: "Презентации и планы мероприятий.", kk: "Іс-шара презентациялары мен жоспарлары." },
    icon: "🎉",
    assets: [presentationRule(true), planRule(false), previewRule],
  },
  interactive_presentation: {
    label: { ru: "Интерактивные презентации", kk: "Интерактивті презентациялар" },
    description: { ru: "Готовые интерактивные презентации.", kk: "Дайын интерактивті презентациялар." },
    icon: "🖥️",
    assets: presentationAssets,
  },
};

export const SEGMENT_LABELS: Record<ContentSegment, LocalizedLabel> = {
  school: { ru: "Школа", kk: "Мектеп" },
  kindergarten: { ru: "Детский сад", kk: "Балабақша" },
  library: { ru: "Библиотека", kk: "Кітапхана" },
};

export const CONTENT_LANGUAGE_LABELS: Record<ContentLanguage, LocalizedLabel> = {
  kk: { ru: "Казахский", kk: "Қазақша" },
  ru: { ru: "Русский", kk: "Орысша" },
  both: { ru: "Казахский и русский", kk: "Қазақша және орысша" },
};

export const ASSET_ROLE_LABELS: Record<ContentAssetRole, LocalizedLabel> = {
  visual: { ru: "Наглядный материал", kk: "Көрнекілік" },
  presentation: { ru: "Презентация", kk: "Презентация" },
  plan: { ru: "План", kk: "Жоспар" },
  preview: { ru: "Обложка", kk: "Мұқаба" },
  attachment: { ru: "Дополнительный файл", kk: "Қосымша файл" },
};

export function localize(label: LocalizedLabel, language: UiLanguage): string {
  return label[language];
}
