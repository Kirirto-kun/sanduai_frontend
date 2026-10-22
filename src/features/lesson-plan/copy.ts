const warningCopy: Record<string, [string, string]> = {
  objective_formulation_completed_from_source: ["Формулировка учебной цели дополнена по официальному источнику.", "Оқу мақсатының тұжырымы ресми дереккөзден толықтырылды."],
  selected_objective_unavailable_or_scope_changed: ["Выбранная цель больше недоступна или не соответствует выбранной программе. Проверьте код и формулировку.", "Таңдалған мақсат қолжетімсіз немесе бағдарламаға сәйкес келмейді. Код пен тұжырымды тексеріңіз."],
  teacher_objective_requires_verification: ["Введённая вручную учебная цель требует сверки с официальной программой.", "Қолмен енгізілген оқу мақсатын ресми бағдарламамен салыстыру қажет."],
  objectives_not_provided_topic_based_draft: ["Цели не указаны: создан черновик по теме. Добавьте и проверьте учебные цели.", "Мақсаттар берілмеген: тақырып бойынша жоба жасалды. Оқу мақсаттарын қосып, тексеріңіз."],
  academic_year_guidance_not_verified: ["Методические рекомендации на этот учебный год ещё не подтверждены в базе.", "Осы оқу жылына арналған әдістемелік ұсынымдар базада әлі расталмаған."],
  regulatory_revision_review_partial: ["Сверка действующих редакций нормативных документов завершена частично.", "Нормативтік құжаттардың қолданыстағы редакцияларын салыстыру ішінара аяқталған."],
  document_sources_not_verified: ["Нормативные источники этого документа требуют проверки.", "Бұл құжаттың нормативтік дереккөздерін тексеру қажет."],
  edited_objectives_require_verification: ["Учебные цели изменены. Повторно сравните их с официальной формулировкой.", "Оқу мақсаттары өңделді. Ресми тұжырыммен қайта салыстырыңыз."],
  content_review_requires_teacher_check: ["Проверка содержания выявила вопросы, требующие внимания учителя. Проверьте задания, ответы и доступность материалов перед уроком.", "Мазмұнды тексеру мұғалім назарын қажет ететін тұстарды анықтады. Сабаққа дейін тапсырмаларды, жауаптарды және материалдардың қолжетімділігін тексеріңіз."],
};

export function lessonWarning(warning: string, kk: boolean): string {
  const copy = warningCopy[warning];
  if (copy) return copy[kk ? 1 : 0];
  // Unknown machine codes remain useful as a general notice, never raw implementation text.
  if (/^[a-z][a-z0-9_:.\-]+$/.test(warning)) return kk ? "Бұл деректерді ресми бағдарламамен салыстырып тексеріңіз." : "Сравните эти данные с официальной учебной программой.";
  return warning;
}

const documentCopy = {
  kk: { stageTime: "Сабақтың кезеңі/ уақыт", flow: "Сабақтың барысы", field: "Көрсеткіш", details: "Мәлімет" },
  ru: { stageTime: "Этап урока/ Время", flow: "Ход урока", field: "Показатель", details: "Сведения" },
  en: { stageTime: "Lesson stage / time", flow: "Lesson flow", field: "Field", details: "Details" },
  ky: { stageTime: "Сабактын этабы / убакыт", flow: "Сабактын жүрүшү", field: "Көрсөткүч", details: "Маалымат" },
  uz: { stageTime: "Dars bosqichi / vaqt", flow: "Dars jarayoni", field: "Ko‘rsatkich", details: "Ma’lumot" },
};

export function getDocumentCopy(language: keyof typeof documentCopy) {
  return documentCopy[language];
}
