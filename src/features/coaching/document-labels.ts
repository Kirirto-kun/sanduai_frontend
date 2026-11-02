import type { ContentLanguage } from "@/lib/content-languages";
import type { StageKind } from "./types";

// API-created retained materials can use all supported content languages.
const labels: Record<string, readonly [string, string, string]> = {
  "Готовые слова коуча": ["Ready facilitator speech", "Коучтун даяр сөзү", "Kouchning tayyor so‘zlari"],
  "Действия участников": ["Participant actions", "Катышуучулардын аракеттери", "Ishtirokchilar harakatlari"],
  "Ожидаемый результат": ["Expected result", "Күтүлгөн натыйжа", "Kutilgan natija"],
  "Паспорт коучинга": ["Coaching overview", "Коучинг паспорту", "Kouching ma’lumotlari"],
  "Принятые условия": ["Accepted assumptions", "Кабыл алынган шарттар", "Qabul qilingan shartlar"],
  "Тема": ["Topic", "Темасы", "Mavzu"], "Цель": ["Goal", "Максаты", "Maqsad"],
  "Аудитория": ["Audience", "Аудитория", "Auditoriya"], "Участники": ["Participants", "Катышуучулар", "Ishtirokchilar"],
  "Группы": ["Groups", "Топтор", "Guruhlar"], "Длительность, минут": ["Duration, minutes", "Узактыгы, мүнөт", "Davomiyligi, daqiqa"],
  "Формат": ["Delivery format", "Өткөрүү форматы", "O‘tkazish shakli"], "Смешанный": ["Hybrid", "Аралаш", "Aralash"],
  "Онлайн": ["Online", "Онлайн", "Onlayn"], "Офлайн": ["Offline", "Офлайн", "Oflayn"],
  "Задачи": ["Objectives", "Милдеттер", "Vazifalar"], "Измеримые результаты": ["Measurable outcomes", "Өлчөнүүчү натыйжалар", "O‘lchanadigan natijalar"],
  "Ресурсы": ["Resources", "Ресурстар", "Resurslar"], "Подготовка": ["Preparation", "Даярдык", "Tayyorgarlik"],
  "Основная идея": ["Core idea", "Негизги идея", "Asosiy g‘oya"], "Концепция": ["Concept", "Концепция", "Konsepsiya"],
  "Итоговый продукт": ["Final product", "Акыркы продукт", "Yakuniy mahsulot"],
  "Временной план": ["Timing plan", "Убакыт планы", "Vaqt rejasi"], "Время": ["Time", "Убакыт", "Vaqt"],
  "Этап": ["Stage", "Этап", "Bosqich"], "Метод": ["Method", "Ыкма", "Usul"], "Результат": ["Result", "Натыйжа", "Natija"],
  "мин": ["min", "мүн", "daq"], "Общее время, минут": ["Total time, minutes", "Жалпы убакыт, мүнөт", "Umumiy vaqt, daqiqa"],
  "Полный сценарий": ["Complete scenario", "Толук сценарий", "To‘liq ssenariy"], "Время, минут": ["Time, minutes", "Убактысы, мүнөт", "Vaqti, daqiqa"],
  "Материалы": ["Materials", "Материалдар", "Materiallar"], "Переход к следующему этапу": ["Transition to the next stage", "Кийинки этапка өтүү", "Keyingi bosqichga o‘tish"],
  "Способ деления": ["Grouping method", "Топко бөлүү ыкмасы", "Guruhlarga ajratish usuli"],
  "Практические задания": ["Practical tasks", "Практикалык тапшырмалар", "Amaliy topshiriqlar"],
  "Пошаговая инструкция": ["Step by step instructions", "Кадамдык нускама", "Bosqichma bosqich ko‘rsatma"],
  "Готовый образец продукта": ["Ready product example", "Даяр продукт үлгүсү", "Tayyor mahsulot namunasi"],
  "Критерии оценки": ["Evaluation criteria", "Баалоо критерийлери", "Baholash mezonlari"],
  "Для чего": ["Purpose", "Максаты", "Maqsadi"], "Промпт": ["Ready prompt", "Даяр промпт", "Tayyor so‘rov"],
  "Критическая проверка": ["Critical review", "Сынчыл текшерүү", "Tanqidiy tekshirish"],
  "Офлайн-альтернатива": ["Offline alternative", "Интернетсиз альтернатива", "Oflayn muqobil"],
  "Наглядные и раздаточные материалы": ["Visuals and handouts", "Көрсөтмө жана таратма материалдар", "Ko‘rgazmali va tarqatma materiallar"],
  "Содержание слайдов — текстовый план": ["Slide content — text plan", "Слайд мазмуну — тексттик план", "Slayd mazmuni — matnli reja"],
  "Текст на экране": ["On-screen text", "Экрандагы текст", "Ekrandagi matn"], "Визуал": ["Suggested visual", "Сунушталган көрүнүш", "Tavsiya etilgan tasvir"],
  "Заметки ведущего": ["Facilitator notes", "Алып баруучуга эскертүүлөр", "Boshlovchi izohlari"],
  "Рефлексия": ["Reflection", "Рефлексия", "Refleksiya"], "Вопросы": ["Questions", "Суроолор", "Savollar"],
  "Заключение": ["Conclusion", "Жыйынтык", "Xulosa"],
  "Адаптации и доступные альтернативы": ["Adaptations and accessible alternatives", "Ыңгайлаштыруу жана жеткиликтүү альтернативалар", "Moslashtirish va qulay muqobillar"],
};
export function documentLabel(language: ContentLanguage, ru: string, kk: string) {
  if (language === "kk") return kk;
  if (language === "ru") return ru;
  return labels[ru]?.[({ en: 0, ky: 1, uz: 2 } as const)[language]] ?? ru;
}
export function documentStageLabel(kind: StageKind, language: ContentLanguage, fallback: string) {
  if (language === "kk" || language === "ru") return fallback;
  const stageNames: Record<StageKind, readonly [string, string, string]> = {
    organization: ["Organization", "Уюштуруу", "Tashkil etish"], engagement: ["Engagement", "Кызыгууну ойготуу", "Qiziqish uyg‘otish"],
    theory: ["Topic exploration", "Теманы ачуу", "Mavzuni ochish"], grouping: ["Group formation", "Топко бөлүү", "Guruhlarga ajratish"],
    practice: ["Practical work", "Практикалык иш", "Amaliy ish"], energizer: ["Energizer", "Сергитүү", "Tetiklashtirish"],
    application: ["Classroom application", "Практикага киргизүү", "Amaliyotga joriy etish"], reflection: ["Reflection", "Рефлексия", "Refleksiya"],
    closing: ["Conclusion", "Жыйынтык", "Xulosa"],
  };
  return stageNames[kind][({ en: 0, ky: 1, uz: 2 } as const)[language]];
}
