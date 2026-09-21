import type { ContentLanguage } from "@/lib/content-languages";

export const preschoolDocumentCopy: Record<ContentLanguage, {
  goal: string;
  objectives: string;
  expected: string;
  resources: string;
  preliminary: string;
  organization: string;
  teacher: string;
  group: string;
  totalTime: string;
  minutes: string;
  years: string;
  children: string;
  phase: string;
  teacherSays: string;
  childrenDo: string;
  answers: string;
  taskPurpose: string;
  materials: string;
  teacherAction: string;
  childAction: string;
  execution: string;
  taskResult: string;
  safety: string;
  inclusion: string;
  experiment: string;
  experimentNeed: string;
  experimentDo: string;
  experimentObserve: string;
  experimentConclusion: string;
  steam: string;
  steamProblem: string;
  steamChoice: string;
  steamBuild: string;
  steamTest: string;
  steamImprove: string;
  reflection: string;
  integrated: string;
  storyArc: string;
  groupDivision: string;
  praise: string;
  regulatory: string;
}> = {
  kk: {
    goal: "Мақсат", objectives: "Міндеттер", expected: "Күтілетін нәтиже", resources: "Қажетті материалдар", preliminary: "Алдын ала жұмыс", organization: "Мектепке дейінгі ұйым", teacher: "Тәрбиеші", group: "Топ", totalTime: "Жалпы уақыт", minutes: "мин", years: "жас", children: "бала", phase: "Кезең", teacherSays: "Тәрбиеші репликалары", childrenDo: "Балалар не істейді", answers: "Ықтимал жауаптар", taskPurpose: "Мақсаты", materials: "Материалдар", teacherAction: "Тәрбиеші әрекеті", childAction: "Бала әрекеті", execution: "Өткізу реті", taskResult: "Нәтиже", safety: "Қауіпсіздік", inclusion: "Инклюзивті қолдау", experiment: "Зерттеу тәжірибесі", experimentNeed: "Не қажет", experimentDo: "Не істейміз", experimentObserve: "Нені бақылаймыз", experimentConclusion: "Қорытынды", steam: "STEAM циклі", steamProblem: "Мәселе", steamChoice: "Баланың таңдауы", steamBuild: "Құрастыру", steamTest: "Сынау", steamImprove: "Жақсарту", reflection: "Рефлексия", integrated: "Кіріктірілген бағыттар", storyArc: "Сюжет желісі", groupDivision: "Топқа бөлу тәсілі", praise: "Мадақтау", regulatory: "Нормативтік негіз",
  },
  ru: {
    goal: "Цель", objectives: "Задачи", expected: "Ожидаемый результат", resources: "Необходимые материалы", preliminary: "Предварительная работа", organization: "Дошкольная организация", teacher: "Воспитатель", group: "Группа", totalTime: "Общее время", minutes: "мин", years: "лет", children: "детей", phase: "Этап", teacherSays: "Реплики воспитателя", childrenDo: "Что делают дети", answers: "Возможные ответы", taskPurpose: "Цель задания", materials: "Материалы", teacherAction: "Действие воспитателя", childAction: "Действие ребёнка", execution: "Как провести", taskResult: "Результат", safety: "Безопасность", inclusion: "Инклюзивная поддержка", experiment: "Исследовательский опыт", experimentNeed: "Что нужно", experimentDo: "Что делаем", experimentObserve: "Что наблюдаем", experimentConclusion: "Вывод", steam: "STEAM-цикл", steamProblem: "Проблема", steamChoice: "Выбор ребёнка", steamBuild: "Создание", steamTest: "Проверка", steamImprove: "Улучшение", reflection: "Рефлексия", integrated: "Интегрированные направления", storyArc: "Сюжетная линия", groupDivision: "Способ деления на группы", praise: "Поощрение", regulatory: "Нормативная основа",
  },
  en: {
    goal: "Goal", objectives: "Objectives", expected: "Expected outcomes", resources: "Materials to prepare", preliminary: "Preliminary work", organization: "Preschool organisation", teacher: "Teacher", group: "Group", totalTime: "Total time", minutes: "min", years: "years", children: "children", phase: "Stage", teacherSays: "Teacher's lines", childrenDo: "What children do", answers: "Possible answers", taskPurpose: "Purpose", materials: "Materials", teacherAction: "Teacher action", childAction: "Child action", execution: "How to run it", taskResult: "Outcome", safety: "Safety", inclusion: "Inclusive support", experiment: "Experiment", experimentNeed: "What is needed", experimentDo: "What to do", experimentObserve: "What to observe", experimentConclusion: "Conclusion", steam: "STEAM cycle", steamProblem: "Problem", steamChoice: "Child's choice", steamBuild: "Build", steamTest: "Test", steamImprove: "Improve", reflection: "Reflection", integrated: "Integrated areas", storyArc: "Story arc", groupDivision: "Group division method", praise: "Praise and reward", regulatory: "Regulatory basis",
  },
  ky: {
    goal: "Максат", objectives: "Милдеттер", expected: "Күтүлгөн натыйжа", resources: "Даярдалуучу материалдар", preliminary: "Алдын ала иш", organization: "Мектепке чейинки уюм", teacher: "Тарбиячы", group: "Топ", totalTime: "Жалпы убакыт", minutes: "мүн", years: "жаш", children: "бала", phase: "Этап", teacherSays: "Тарбиячынын сөздөрү", childrenDo: "Балдар эмне кылат", answers: "Мүмкүн болгон жооптор", taskPurpose: "Максаты", materials: "Материалдар", teacherAction: "Тарбиячынын аракети", childAction: "Баланын аракети", execution: "Өткөрүү тартиби", taskResult: "Натыйжа", safety: "Коопсуздук", inclusion: "Инклюзивдик колдоо", experiment: "Изилдөө тажрыйбасы", experimentNeed: "Эмне керек", experimentDo: "Эмне кылабыз", experimentObserve: "Эмнени байкайбыз", experimentConclusion: "Жыйынтык", steam: "STEAM цикли", steamProblem: "Маселе", steamChoice: "Баланын тандоосу", steamBuild: "Куруу", steamTest: "Сыноо", steamImprove: "Жакшыртуу", reflection: "Рефлексия", integrated: "Интеграцияланган багыттар", storyArc: "Сюжеттик линия", groupDivision: "Топко бөлүү жолу", praise: "Мактоо", regulatory: "Ченемдик негиз",
  },
  uz: {
    goal: "Maqsad", objectives: "Vazifalar", expected: "Kutiladigan natija", resources: "Tayyorlanadigan materiallar", preliminary: "Dastlabki ish", organization: "Maktabgacha ta’lim tashkiloti", teacher: "Tarbiyachi", group: "Guruh", totalTime: "Umumiy vaqt", minutes: "daq", years: "yosh", children: "bola", phase: "Bosqich", teacherSays: "Tarbiyachi so‘zlari", childrenDo: "Bolalar nima qiladi", answers: "Kutiladigan javoblar", taskPurpose: "Maqsadi", materials: "Materiallar", teacherAction: "Tarbiyachi harakati", childAction: "Bola harakati", execution: "O‘tkazish tartibi", taskResult: "Natija", safety: "Xavfsizlik", inclusion: "Inklyuziv yordam", experiment: "Tadqiqot tajribasi", experimentNeed: "Nima kerak", experimentDo: "Nima qilamiz", experimentObserve: "Nimani kuzatamiz", experimentConclusion: "Xulosa", steam: "STEAM sikli", steamProblem: "Muammo", steamChoice: "Bolaning tanlovi", steamBuild: "Qurish", steamTest: "Sinash", steamImprove: "Yaxshilash", reflection: "Refleksiya", integrated: "Integratsiyalangan yo‘nalishlar", storyArc: "Syujet chizig‘i", groupDivision: "Guruhlarga bo‘lish usuli", praise: "Rag‘bat", regulatory: "Me’yoriy asos",
  },
};
