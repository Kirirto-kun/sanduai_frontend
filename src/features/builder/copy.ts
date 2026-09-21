import type { BuilderProjectType } from "./types";

export const BUILDER_CATEGORIES: Array<{
  type: BuilderProjectType;
  icon: string;
  ru: string;
  kk: string;
  promptRu: string;
  promptKk: string;
  accent: string;
}> = [
  { type: "website", icon: "🌐", ru: "Сайт", kk: "Сайт", promptRu: "Создай современный адаптивный сайт…", promptKk: "Заманауи бейімделетін сайт жаса…", accent: "from-sky-400 to-cyan-500" },
  { type: "game", icon: "🎮", ru: "Интерактивная игра", kk: "Интерактивті ойын", promptRu: "Создай интерактивную обучающую игру…", promptKk: "Интерактивті оқу ойынын жаса…", accent: "from-violet-500 to-fuchsia-500" },
  { type: "3d", icon: "🧊", ru: "3D-проект", kk: "3D жоба", promptRu: "Создай интерактивный 3D-проект…", promptKk: "Интерактивті 3D жоба жаса…", accent: "from-blue-500 to-indigo-600" },
  { type: "hand_tracking", icon: "✋", ru: "Hand Tracking", kk: "Қол қимылын тану", promptRu: "Создай игру с управлением рукой через камеру…", promptKk: "Камера арқылы қолмен басқарылатын ойын жаса…", accent: "from-orange-400 to-rose-500" },
  { type: "camera", icon: "📷", ru: "Камера", kk: "Камера", promptRu: "Создай интерактивный проект с камерой…", promptKk: "Камерасы бар интерактивті жоба жаса…", accent: "from-emerald-400 to-teal-600" },
  { type: "education", icon: "📚", ru: "Обучение", kk: "Білім беру", promptRu: "Создай интерактивный учебный материал…", promptKk: "Интерактивті оқу материалын жаса…", accent: "from-amber-400 to-orange-500" },
  { type: "webapp", icon: "📱", ru: "Web App", kk: "Web App", promptRu: "Создай удобное веб-приложение…", promptKk: "Ыңғайлы веб-қосымша жаса…", accent: "from-pink-400 to-rose-500" },
  { type: "platform", icon: "🖥️", ru: "Платформа", kk: "Платформа", promptRu: "Создай цифровую платформу…", promptKk: "Цифрлық платформа жаса…", accent: "from-slate-500 to-slate-700" },
  { type: "dashboard", icon: "📊", ru: "Dashboard", kk: "Dashboard", promptRu: "Создай понятный dashboard с данными…", promptKk: "Деректері бар түсінікті dashboard жаса…", accent: "from-cyan-500 to-blue-600" },
  { type: "custom", icon: "✨", ru: "Своя идея", kk: "Өз идеям", promptRu: "Опиши любую идею — SanduAI соберёт проект…", promptKk: "Кез келген идеяңызды жазыңыз — SanduAI жобаны жасайды…", accent: "from-orange-500 to-emerald-500" },
];

export const BUILDER_EXAMPLES = {
  ru: [
    "Игра для детей 5–6 лет: перетащить животное к его домику. За верный ответ — звезда и конфетти.",
    "Интерактивная 3D-модель Солнечной системы. По клику на планету покажи название и три факта.",
    "Игра с камерой: ребёнок указательным пальцем лопает цветные шары, в конце появляется «Молодец!».",
  ],
  kk: [
    "5–6 жастағы балаларға жануарды мекенімен сәйкестендіретін ойын жаса. Дұрыс жауапқа жұлдыз бен конфетти шықсын.",
    "Күн жүйесінің интерактивті 3D моделін жаса. Планетаны басқанда атауы мен үш дерек көрсетілсін.",
    "Камерамен ойын жаса: бала сұқ саусағымен түрлі түсті шарларды жарып, соңында «Жарайсың!» шықсын.",
  ],
};

export const ACCEPTED_ASSET_TYPES = [
  "image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif",
  "video/mp4", "video/quicktime", "video/webm",
  "audio/mpeg", "audio/wav", "audio/ogg",
  "model/gltf-binary", "model/gltf+json", "application/octet-stream",
].join(",");

export function formatBytes(value?: number): string {
  if (!value || value < 1) return "—";
  if (value < 1024) return `${value} Б`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} КБ`;
  return `${(value / (1024 * 1024)).toFixed(value < 10 * 1024 * 1024 ? 1 : 0)} МБ`;
}

export function builderErrorMessage(error: unknown, language: "ru" | "kk"): string {
  const message = error instanceof Error ? error.message : "";
  if (/payment|required|token|balance|402/i.test(message)) {
    return language === "kk" ? "Бұл әрекетке монета жеткіліксіз." : "Недостаточно монет для этого действия.";
  }
  if (/network|reach|fetch|timeout/i.test(message)) {
    return language === "kk" ? "Серверге қосылу мүмкін болмады. Қайталап көріңіз." : "Не удалось связаться с сервером. Попробуйте ещё раз.";
  }
  return language === "kk"
    ? "Әрекетті орындау мүмкін болмады. Қайталап көріңіз."
    : "Не удалось выполнить действие. Попробуйте ещё раз.";
}
