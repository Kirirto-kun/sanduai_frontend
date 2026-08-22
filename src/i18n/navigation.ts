import type { AccessPolicy } from "../lib/access-policy";

/**
 * Структура навигации дашборда.
 *
 * Вынесена из `translations.ts` намеренно: тот файл — монолит на 3800 строк,
 * где каждый новый пункт меню нужно добавлять в трёх местах (тип, ru, kk).
 * Здесь пункт описывается один раз вместе со своими переводами.
 */

export type Lang = "ru" | "kk";

export type SegmentKey = "school" | "kindergarten" | "library";

export type NavItem = {
  key: string;
  href: string;
  label: Record<Lang, string>;
  /** Функция ещё не готова — ведём на страницу «скоро появится». */
  soon?: boolean;
  /** Помечаем новинки, чтобы учитель их заметил. */
  isNew?: boolean;
  /** Override group access, for example the token-paid At Zharys game. */
  access?: AccessPolicy;
};

export type NavGroup = {
  key: string;
  label: Record<Lang, string>;
  items: NavItem[];
  access: AccessPolicy;
};

export type NavSegment = {
  key: SegmentKey;
  label: Record<Lang, string>;
  hint: Record<Lang, string>;
  icon: string;
  groups: NavGroup[];
};

const soon = (key: string, href?: string) => href ?? `/dashboard/soon?f=${key}`;

const catalog = (segment: SegmentKey, type: string, grade?: number) => {
  const params = new URLSearchParams({ segment, type });
  if (grade) params.set("grade", String(grade));
  return `/dashboard/library/catalog?${params.toString()}`;
};

// --- Общие пункты, одинаковые во всех сегментах ------------------------------

const AI_KMZH: NavItem = {
  key: "kmzh",
  href: "/dashboard/ai/kmzh",
  label: { ru: "ҚМЖ (краткосрочный план)", kk: "ҚМЖ жазу" },
};

const AI_BJB: NavItem = {
  key: "bjb",
  href: "/dashboard/ai/bjb-tjb",
  label: { ru: "БЖБ / ТЖБ (СОР/СОЧ)", kk: "БЖБ, ТЖБ" },
};

const AI_SCIPROJECT: NavItem = {
  key: "sciproject",
  href: "/dashboard/ai/scientific-projects",
  label: { ru: "Научный проект", kk: "Ғылыми жоба" },
};

const AI_WORKSHEET: NavItem = {
  key: "worksheet",
  href: "/dashboard/ai/worksheets",
  label: { ru: "Рабочие листы", kk: "Жұмыс парақтарын жасау" },
};

const AI_COMICS: NavItem = {
  key: "comics",
  href: "/dashboard/ai/comics",
  label: { ru: "Комиксы", kk: "Комикс жасау" },
  isNew: true,
};

const AI_KORNEKILIK: NavItem = {
  key: "kornekilik",
  href: "/dashboard/ai/kornekilik",
  label: { ru: "Наглядные пособия", kk: "Көрнекілік жасау" },
  isNew: true,
};

const AI_INFOGRAPHICS: NavItem = {
  key: "infographics",
  href: "/dashboard/ai/infographics",
  label: { ru: "Инфографика", kk: "Инфографика жасау" },
  isNew: true,
};

const AI_PRESENTATIONS: NavItem = {
  key: "presentations",
  href: "/dashboard/ai/presentations",
  label: {
    ru: "ИИ-презентации",
    kk: "ЖИ презентациялар",
  },
  isNew: true,
};

const AI_SCENARIO: NavItem = {
  key: "scenario",
  href: "/dashboard/ai/scenario",
  label: { ru: "Сценарий мероприятия", kk: "Сценарий жазу" },
  isNew: true,
};

// --- Сегмент: Мектеп ---------------------------------------------------------

const SCHOOL: NavSegment = {
  key: "school",
  label: { ru: "Школа", kk: "Мектеп" },
  hint: { ru: "Для учителей-предметников", kk: "Пән мұғалімдеріне" },
  icon: "🏫",
  groups: [
    {
      key: "school-ai",
      access: "authenticated",
      label: { ru: "ИИ-функции", kk: "ЖИ функциялар" },
      items: [
        AI_KMZH,
        AI_BJB,
        AI_SCIPROJECT,
        AI_WORKSHEET,
        AI_COMICS,
        AI_KORNEKILIK,
        AI_INFOGRAPHICS,
        AI_PRESENTATIONS,
      ],
    },
    {
      key: "school-ai-extra",
      access: "authenticated",
      label: { ru: "Документы и тексты", kk: "Құжаттар мен мәтіндер" },
      items: [
        {
          key: "essay",
          href: "/dashboard/ai/essay",
          label: { ru: "Эссе", kk: "Эссе" },
        },
        {
          key: "article",
          href: "/dashboard/ai/article",
          label: { ru: "Статья (Мақала)", kk: "Мақала" },
        },
        {
          key: "class-hours",
          href: "/dashboard/ai/class-hours",
          label: { ru: "Классный час", kk: "Тәрбие сағаты" },
        },
        AI_SCENARIO,
        {
          key: "tests",
          href: "/dashboard/ai/tests",
          label: { ru: "Тесты", kk: "Тесттер" },
        },
      ],
    },
    {
      key: "school-ready",
      access: "subscription",
      label: { ru: "Готовые материалы", kk: "Дайын материалдар" },
      items: [
        {
          key: "visual-aids-1",
          href: catalog("school", "visual_aid", 1),
          label: { ru: "Наглядность — 1 класс", kk: "Көрнекіліктер — 1 сынып" },
        },
        {
          key: "visual-aids-2",
          href: catalog("school", "visual_aid", 2),
          label: { ru: "Наглядность — 2 класс", kk: "Көрнекіліктер — 2 сынып" },
        },
        {
          key: "visual-aids-3",
          href: catalog("school", "visual_aid", 3),
          label: { ru: "Наглядность — 3 класс", kk: "Көрнекіліктер — 3 сынып" },
        },
        {
          key: "visual-aids-4",
          href: catalog("school", "visual_aid", 4),
          label: { ru: "Наглядность — 4 класс", kk: "Көрнекіліктер — 4 сынып" },
        },
        {
          key: "visual-aids-all",
          href: catalog("school", "visual_aid"),
          label: { ru: "Вся наглядность", kk: "Барлық көрнекіліктер" },
        },
      ],
    },
    {
      key: "school-homeroom",
      access: "subscription",
      label: { ru: "Классным руководителям", kk: "Сынып жетекшілерге" },
      items: [
        {
          key: "events",
          href: catalog("school", "event"),
          label: { ru: "Мероприятия", kk: "Іс-шаралар" },
        },
        {
          key: "safety-1",
          href: catalog("school", "safety_visual_aid", 1),
          label: { ru: "Безопасность — 1 класс", kk: "Қауіпсіздік — 1 сынып" },
        },
        {
          key: "safety-2",
          href: catalog("school", "safety_visual_aid", 2),
          label: { ru: "Безопасность — 2 класс", kk: "Қауіпсіздік — 2 сынып" },
        },
        {
          key: "safety-3",
          href: catalog("school", "safety_visual_aid", 3),
          label: { ru: "Безопасность — 3 класс", kk: "Қауіпсіздік — 3 сынып" },
        },
        {
          key: "safety-4",
          href: catalog("school", "safety_visual_aid", 4),
          label: { ru: "Безопасность — 4 класс", kk: "Қауіпсіздік — 4 сынып" },
        },
        {
          key: "safety-all",
          href: catalog("school", "safety_visual_aid"),
          label: { ru: "Вся наглядность по безопасности", kk: "Барлық қауіпсіздік көрнекіліктері" },
        },
      ],
    },
    {
      key: "school-offline",
      access: "subscription",
      label: { ru: "Игры без интернета", kk: "Интернетсіз ойындар" },
      items: [
        {
          key: "offline-games",
          href: catalog("school", "offline_game"),
          label: { ru: "Все игры без интернета", kk: "Барлық интернетсіз ойындар" },
        },
        {
          key: "grouping",
          href: catalog("school", "grouping"),
          label: { ru: "Деление на группы", kk: "Топқа бөлу" },
        },
        {
          key: "feedback",
          href: catalog("school", "feedback"),
          label: { ru: "Обратная связь", kk: "Кері байланыс" },
        },
        {
          key: "open-lesson-templates",
          href: catalog("school", "open_lesson_subject_template"),
          label: {
            ru: "Шаблоны открытых уроков по предметам",
            kk: "Пән бойынша ашық сабаққа шаблондар",
          },
        },
        {
          key: "open-lessons",
          href: catalog("school", "open_lesson"),
          label: { ru: "Открытые уроки", kk: "Ашық сабақтар" },
        },
        {
          key: "games",
          access: "authenticated",
          href: "/dashboard/library/games",
          label: { ru: "Игра «Ат жарыс»", kk: "«Ат жарыс» ойыны" },
        },
      ],
    },
  ],
};

// --- Сегмент: Балабақша ------------------------------------------------------

const KINDERGARTEN: NavSegment = {
  key: "kindergarten",
  label: { ru: "Детский сад", kk: "Балабақша" },
  hint: { ru: "Для воспитателей", kk: "Тәрбиешілерге" },
  icon: "🧸",
  groups: [
    {
      key: "kg-ai",
      access: "authenticated",
      label: { ru: "ИИ-функции", kk: "ЖИ функциялар" },
      items: [
        AI_SCENARIO,
        AI_SCIPROJECT,
        AI_WORKSHEET,
        AI_COMICS,
        AI_KORNEKILIK,
        AI_PRESENTATIONS,
      ],
    },
    {
      key: "kg-ready",
      access: "subscription",
      label: { ru: "Готовые материалы", kk: "Дайын материалдар" },
      items: [
        {
          key: "kg-open-lessons",
          href: catalog("kindergarten", "open_lesson"),
          label: { ru: "Открытые занятия", kk: "Ашық сабақтар" },
        },
        {
          key: "kg-visual-aids",
          href: catalog("kindergarten", "visual_aid"),
          label: { ru: "Наглядные пособия", kk: "Көрнекіліктер" },
        },
        {
          key: "kg-safety",
          href: catalog("kindergarten", "safety_visual_aid"),
          label: { ru: "Наглядность по безопасности", kk: "Қауіпсіздік көрнекіліктері" },
        },
        {
          key: "kg-offline-games",
          href: catalog("kindergarten", "offline_game"),
          label: { ru: "Игры без интернета", kk: "Интернетсіз ойындар" },
        },
        {
          key: "kg-event-materials",
          href: catalog("kindergarten", "event"),
          label: {
            ru: "Материалы к мероприятиям",
            kk: "Іс-шараларға дайын материалдар",
          },
        },
        {
          key: "kg-cartoons",
          href: soon("kg-cartoons"),
          label: { ru: "Мультфильмы", kk: "Мультфильмдер" },
          soon: true,
        },
      ],
    },
  ],
};

// --- Сегмент: Кітапхана ------------------------------------------------------

const LIBRARY: NavSegment = {
  key: "library",
  label: { ru: "Библиотека", kk: "Кітапхана" },
  hint: { ru: "Для школьных библиотекарей", kk: "Кітапханашыларға" },
  icon: "📚",
  groups: [
    {
      key: "lib-ai",
      access: "authenticated",
      label: { ru: "ИИ-функции", kk: "ЖИ функциялар" },
      items: [
        {
          ...AI_SCENARIO,
          key: "lib-scenario",
          label: { ru: "Генерация сценария", kk: "Сценарий генерациялау" },
        },
        AI_KORNEKILIK,
        AI_COMICS,
      ],
    },
    {
      key: "lib-ready",
      access: "subscription",
      label: { ru: "Готовые материалы", kk: "Дайын материалдар" },
      items: [
        {
          key: "lib-events",
          href: catalog("library", "event"),
          label: { ru: "Мероприятия", kk: "Іс-шаралар" },
        },
        {
          key: "lib-cartoons",
          href: soon("lib-cartoons"),
          label: { ru: "Мультфильмы", kk: "Мультфильмдер" },
          soon: true,
        },
      ],
    },
  ],
};

export const SEGMENTS: NavSegment[] = [SCHOOL, KINDERGARTEN, LIBRARY];

// --- Общие разделы, показываются под сегментом -------------------------------

export const COMMON_GROUPS: NavGroup[] = [
  {
    key: "common-library",
    access: "subscription",
    label: { ru: "Библиотека материалов", kk: "Материалдар кітапханасы" },
    items: [
      {
        key: "courses",
        href: "/dashboard/library/courses",
        label: { ru: "Курсы", kk: "Курстар" },
      },
      {
        key: "lib-presentations",
        href: "/dashboard/library/catalog?type=interactive_presentation",
        label: { ru: "Интерактивные презентации", kk: "Интерактивті презентациялар" },
      },
      {
        key: "simulations",
        href: "/dashboard/library/simulations",
        label: { ru: "PhET Симуляции", kk: "PhET симуляциялары" },
      },
      {
        key: "interactive-games",
        href: "/dashboard/library/interactive-games",
        label: { ru: "Игры Wordwall", kk: "Wordwall ойындары" },
      },
      {
        key: "materials",
        href: "/dashboard/library/materials",
        label: { ru: "Полезные материалы", kk: "Пайдалы материалдар" },
      },
    ],
  },
  {
    key: "common-media",
    access: "authenticated",
    label: { ru: "Медиа", kk: "Медиа" },
    items: [
      {
        key: "photo",
        href: "/dashboard/media/photo",
        label: { ru: "Генерация фото", kk: "Фото генерациясы" },
      },
      {
        key: "avatar",
        href: "/dashboard/media/avatar",
        label: { ru: "Цифровой аватар", kk: "Цифрлық аватар" },
      },
      {
        key: "voiceover",
        href: "/dashboard/media/voiceover",
        label: { ru: "Озвучка ИИ", kk: "ЖИ дыбыстау" },
      },
      {
        key: "qr",
        href: "/dashboard/media/qr-generator",
        label: { ru: "QR-генератор", kk: "QR-генератор" },
      },
      {
        key: "video",
        href: soon("video"),
        label: { ru: "Генерация видео", kk: "Видео генерациясы" },
        soon: true,
      },
    ],
  },
];

/** Подписи страницы «скоро появится» по ключу функции. */
export const SOON_LABELS: Record<string, Record<Lang, string>> = Object.fromEntries(
  [...SEGMENTS.flatMap((s) => s.groups), ...COMMON_GROUPS]
    .flatMap((g) => g.items)
    .filter((i) => i.soon)
    .map((i) => [i.key, i.label]),
);

export const SEGMENT_STORAGE_KEY = "sanduai_segment";

export function resolveNavAccess(item: NavItem, group: NavGroup): AccessPolicy {
  return item.access ?? group.access;
}
