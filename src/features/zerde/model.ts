import type { Draft, Language, ModeId, Template, ZerdeRequest } from "./types";

export const MODES: { id: ModeId; kk: string; ru: string; hintKk: string; hintRu: string; icon: string; group: number }[] = [
  { id: "idea", kk: "Идеяны нақтылау", ru: "Уточнить идею", hintKk: "Өз сұрағыңызды зерттеуге айналдырыңыз", hintRu: "Превратите свой вопрос в исследование", icon: "spark", group: 0 },
  { id: "methods", kk: "Әдісті таңдау", ru: "Выбрать метод", hintKk: "Әдіс, құралдар және қауіпсіздік", hintRu: "Метод, инструменты и безопасность", icon: "flask", group: 0 },
  { id: "plan", kk: "Зерттеу жоспары", ru: "План исследования", hintKk: "Кезеңдер мен келесі әрекеттер", hintRu: "Этапы и следующие действия", icon: "layers", group: 0 },
  { id: "diary", kk: "Зерттеу күнделігі", ru: "Дневник исследования", hintKk: "Нақты жасалған әрекеттерді тіркеңіз", hintRu: "Фиксируйте выполненные действия", icon: "book", group: 1 },
  { id: "contribution", kk: "Авторлық үлес", ru: "Вклад авторов", hintKk: "Екі автордың еңбегін көрсетіңіз", hintRu: "Отразите работу двух авторов", icon: "people", group: 1 },
  { id: "editing", kk: "Авторлық мәтін", ru: "Проверка текста", hintKk: "Өз мәтініңіздің құрылымын тексеріңіз", hintRu: "Проверьте структуру своего текста", icon: "edit", group: 1 },
  { id: "visualization", kk: "Деректерді көрсету", ru: "Визуализация данных", hintKk: "Өз деректеріңізден көрнекі диаграмма", hintRu: "Наглядная диаграмма ваших данных", icon: "chart", group: 1 },
  { id: "antiplagiarism", kk: "Антиплагиат анықтамасы", ru: "Справка антиплагиата", hintKk: "Нақты тексеру нәтижесіне арналған үлгі", hintRu: "Шаблон для реального результата", icon: "search", group: 2 },
  { id: "ai_declaration", kk: "ЖИ декларациясы", ru: "Декларация ИИ", hintKk: "ЖИ көмегін ашық тіркеңіз", hintRu: "Открыто укажите помощь ИИ", icon: "shield", group: 2 },
  { id: "ethics", kk: "Этика және қауіпсіздік", ru: "Этика и безопасность", hintKk: "Зерттеу тәуекелдері мен келісімдер", hintRu: "Риски исследования и согласия", icon: "shield", group: 2 },
  { id: "audit", kk: "Жобаны тексеру", ru: "Проверить проект", hintKk: "Сегіз критерий бойынша әдістемелік тексеріс", hintRu: "Методическая проверка по 8 критериям", icon: "check", group: 2 },
  { id: "defense", kk: "Қорғауға дайындық", ru: "Подготовка к защите", hintKk: "5–7 минут және сұрақтарға 3 минут", hintRu: "5–7 минут и 3 минуты на вопросы", icon: "mic", group: 3 },
  { id: "stand", kk: "Көрме стенді", ru: "Выставочный стенд", hintKk: "Үш панель: 30 + 60 + 30 см", hintRu: "Три панели: 30 + 60 + 30 см", icon: "slides", group: 3 },
  { id: "package", kk: "Құжаттар пакеті", ru: "Пакет документов", hintKk: "Әр файл мен толықтықты тексеріңіз", hintRu: "Проверьте каждый файл и комплектность", icon: "file", group: 3 },
];
export const SECTION_FALLBACK = [
  ["mathematics", "Математика және қолданбалы математика", "Математика и прикладная математика"],
  ["physics", "Физика, ғарыш және Жер туралы ғылымдар", "Физика, космос и науки о Земле"],
  ["tourism", "Туризм, спорт және өмір қауіпсіздігі", "Туризм, спорт и безопасная жизнедеятельность"],
  ["chemistry", "Химия және биология", "Химия и биология"],
  ["informatics", "Информатика, жасанды интеллект, робототехника және STEM-инженерия", "Информатика, искусственный интеллект, робототехника и STEM-инженерия"],
  ["ecology", "Экология, адам денсаулығы және психология", "Экология, здоровье человека и психология"],
  ["kazakh", "Қазақ тілі және әдебиеті", "Казахский язык и литература"],
  ["russian", "Орыс тілі және әдебиеті", "Русский язык и литература"],
  ["languages", "Шет тілдері және мәдениетаралық коммуникация", "Иностранные языки и межкультурная коммуникация"],
  ["history", "Тарих, өлкетану, құқықтық және азаматтық сауаттылық", "История, краеведение, правовая и гражданская грамотность"],
  ["heritage", "Этномәдениеттану және мәдени мұра", "Этнокультуроведение и культурное наследие"],
  ["design", "Технология, өнер, дизайн және креативті индустриялар", "Технология, искусство, дизайн и креативные индустрии"],
].map(([id, title_kk, title_ru], i) => ({ id, title_kk, title_ru, direction: i < 6 ? "science" : "humanities" }));
export const DOCUMENT_KINDS = [
  ["project", "Конкурстық жұмыс", "Конкурсная работа"], ["abstract", "Аннотация", "Аннотация"],
  ["review", "Жетекшінің пікірі", "Отзыв руководителя"], ["antiplagiarism", "Антиплагиат анықтамасы", "Справка антиплагиата"],
  ["ai_declaration", "ЖИ декларациясы", "Декларация ИИ"], ["ethics", "Этика парағы", "Лист этики"],
  ["diary", "Зерттеу күнделігі", "Дневник исследования"], ["contribution", "Авторлық үлес парағы", "Лист вклада авторов"],
  ["application", "Өтінім", "Заявка"], ["official_rules", "Ресми ереже / ақпараттық хат", "Официальные правила / информационное письмо"],
] as const;
export const MODE_TEMPLATE: Record<ModeId, Template> = { idea: "structure", methods: "plan", plan: "plan", diary: "diary", contribution: "contribution", editing: "structure", visualization: "structure", antiplagiarism: "antiplagiarism", ai_declaration: "ai_declaration", ethics: "ethics", audit: "structure", defense: "structure", stand: "stand", package: "structure" };
export function blankRequest(language: Language = "kk"): ZerdeRequest {
  return { mode: "idea", language, title: "", grades: [4], section: "ecology", project_type: "research", stage: 1, authored_text: "", research_question: "", goal: "", methods: [], sources: [], data: [], registration_code: "", document_ids: [] };
}
export function eligibility(grades: number[], language: Language) {
  const t = (kk: string, ru: string) => language === "kk" ? kk : ru;
  const invalid = grades.length < 1 || grades.length > 2 || grades.some(x => !Number.isInteger(x) || x < 2 || x > 8);
  const mixed = !invalid && grades.length === 2 && ((grades[0] <= 4) !== (grades[1] <= 4));
  const effective = Math.max(...grades);
  return { eligible: !invalid && !mixed, effective, junior: effective <= 4, message: invalid ? t("«Зерде» 2–8-сынып оқушыларына арналған. Жобаға бір немесе екі автор қатысады.", "«Зерде» предназначен для 2–8 классов. В проекте участвуют один или два автора.") : mixed ? t("Екі автор бір жас санатында болуы тиіс: 2–4 немесе 5–8-сынып.", "Два автора должны быть в одной возрастной категории: 2–4 или 5–8 классы.") : t(effective <= 4 ? "Бастауыш буын · 2–4-сынып" : "Орта буын · 5–8-сынып", effective <= 4 ? "Младшая группа · 2–4 классы" : "Средняя группа · 5–8 классы") };
}
export function parseData(text: string): { data: { label: string; value: number }[]; invalidLines: number[] } {
  const data: { label: string; value: number }[] = []; const invalidLines: number[] = [];
  text.split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) return;
    const parts = line.split(/[;\t]/); const label = parts[0]?.trim();
    const raw = parts[1]?.trim().replace(",", "."); const value = raw ? Number(raw) : NaN;
    if (parts.length !== 2 || !label || !Number.isFinite(value)) invalidLines.push(index + 1);
    else data.push({ label, value });
  });
  return { data, invalidLines };
}
export function wordCount(text: string) { return text.trim() ? text.trim().split(/\s+/u).length : 0; }
export function isDraft(value: unknown): value is Draft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<Draft>; const r = draft.request;
  return !!r && MODES.some(m => m.id === r.mode) && ["kk", "ru"].includes(r.language) && typeof r.title === "string" && Array.isArray(r.grades) && r.grades.length >= 1 && r.grades.length <= 2 && r.grades.every(Number.isInteger) && typeof r.authored_text === "string" && typeof r.research_question === "string" && typeof r.goal === "string" && typeof r.section === "string" && ["research", "engineering", "digital", "social", "creative"].includes(r.project_type) && Number.isInteger(r.stage) && r.stage >= 1 && r.stage <= 4 && [r.methods, r.sources, r.document_ids].every(a => Array.isArray(a) && a.every(s => typeof s === "string")) && Array.isArray(r.data) && r.data.every(d => typeof d.label === "string" && Number.isFinite(d.value)) && typeof r.registration_code === "string" && typeof draft.dataText === "string" && Array.isArray(draft.documents) && draft.documents.every(d => typeof d.id === "string" && typeof d.name === "string" && typeof d.kind === "string" && ["readable", "partial", "unreadable"].includes(d.inspection_status) && Array.isArray(d.format_checks)) && (draft.projectId === null || typeof draft.projectId === "string");
}
