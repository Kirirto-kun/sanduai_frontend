import type { CurriculumObjective, LessonPlanRequest, LessonPlanResponse, LessonSubBlock, LessonTemplateTable } from "@/lib/api";

export type EditableLessonPlan = Omit<LessonPlanResponse, "flow"> & {
  flow: (LessonPlanResponse["flow"][number] & { sub_blocks: LessonSubBlock[] })[];
  editor_review?: { task_ids: string[] };
};

export type LessonPlanDraft = LessonPlanRequest & { selected_objective_texts?: string[]; selected_objectives?: CurriculumObjective[]; selection_backup_texts?: string[] };

export const createLessonDraft = (): LessonPlanDraft => ({
  planner_version: "open_lesson_v1", schema_version: "v2",
  subject: "", grade: "", topic: "", school_name: "", teacher_name: "",
  section_name: "", lesson_number: "1", lesson_type: "new_lesson",
  learning_objectives: [""], selected_objective_ids: [], language: "kazakh",
  teaching_language: "kazakh", duration: 45, student_count: null,
  assessment_mode: "feedback", lesson_score_max: null,
  inclusive_support: "", resources: [], additional_requirements: "", date: "",
  textbook_images: [], textbook_text: "", preferred_platform: null,
});

export const lines = (value: string): string[] => value.split("\n").map((line) => line.trim()).filter(Boolean);

// Keep v2 as the only editable source of truth, including when opening old history.
export function editableLessonPlan(plan: LessonPlanResponse): EditableLessonPlan {
  return {
    ...plan,
    flow: plan.flow.map((stage) => {
      const { tasks, ...rest } = stage;
      return {
        ...rest,
        sub_blocks: stage.sub_blocks?.length ? stage.sub_blocks : (tasks ?? []).map((task) => ({
          ...task, time: task.time_marker ?? "", phase_name: task.method_name,
          descriptors: task.descriptors.map((text) => ({ text, points: 0 })),
          resource_urls: [], resource_materials: task.resources ? [task.resources] : [],
        })),
      };
    }),
  };
}

export function lessonExportPayload(plan: EditableLessonPlan): LessonPlanResponse {
  const { editor_review: _review, ...document } = plan;
  void _review;
  return {
    ...document,
    flow: plan.flow.map((stage) => {
      // Compatibility tasks may arrive alongside sub_blocks. Never send a stale duplicate.
      const { tasks: _tasks, ...canonical } = stage;
      void _tasks;
      return canonical;
    }),
  };
}

export function updateLessonBlock(plan: EditableLessonPlan, stageIndex: number, blockIndex: number, patch: Partial<LessonSubBlock>): EditableLessonPlan {
  const original = plan.flow[stageIndex].sub_blocks[blockIndex];
  const pointsChanged = patch.descriptors && JSON.stringify(original.descriptors.map((item) => item.points)) !== JSON.stringify(patch.descriptors.map((item) => item.points));
  const taskId = original.task_id || `${stageIndex}:${blockIndex}`;
  const updates = patch.descriptors ? { ...patch, total_points: patch.descriptors.reduce((sum, item) => sum + item.points, 0) } : patch;
  const reviewed = new Set(plan.editor_review?.task_ids ?? []);
  if (pointsChanged || ["teacher_activity", "free_text_content", "quiz", "template_table"].some((key) => key in patch)) reviewed.add(taskId);
  return markLessonEdited({
    ...plan,
    flow: plan.flow.map((stage, si) => si !== stageIndex ? stage : {
      ...stage, sub_blocks: stage.sub_blocks.map((block, bi) => bi !== blockIndex ? block : { ...block, ...updates }),
    }),
    editor_review: { task_ids: [...reviewed] },
  });
}

export function markLessonEdited(plan: EditableLessonPlan): EditableLessonPlan {
  return { ...plan, quality_review: { status: "edited", corrections: 0 } };
}

export function confirmLessonAssessmentReview(plan: EditableLessonPlan, taskId: string): EditableLessonPlan {
  return { ...plan, editor_review: { task_ids: (plan.editor_review?.task_ids ?? []).filter((id) => id !== taskId) } };
}

export function selectLessonProgramme(draft: LessonPlanDraft, programId: string): LessonPlanDraft {
  if (draft.program_id === programId && !draft.selected_objectives?.length) return draft;
  const items = (draft.selected_objectives ?? []).filter((item) => item.program_id === programId);
  const kept = new Set(items.map((item) => `${item.code} ${item.text}`));
  const backup = [...new Set([...(draft.selection_backup_texts ?? []), ...(draft.selected_objective_texts ?? []).filter((text) => !kept.has(text))])];
  return { ...draft, program_id: programId || undefined, selected_objectives: items,
    selected_objective_ids: items.map((item) => item.id),
    selected_objective_texts: items.map((item) => `${item.code} ${item.text}`), ...(backup.length ? { selection_backup_texts: backup } : {}) };
}

export function selectLessonObjectives(draft: LessonPlanDraft, items: CurriculumObjective[]): LessonPlanDraft {
  const programId = draft.program_id || items[0]?.program_id;
  const compatible = items.filter((item) => item.program_id === programId && item.selectable !== false);
  return { ...draft, program_id: programId, selected_objectives: compatible,
    selected_objective_ids: compatible.map((item) => item.id),
    selected_objective_texts: compatible.map((item) => `${item.code} ${item.text}`) };
}

export const validLessonMinutes = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 180;

/** Only our documented public validation errors may bypass the generic transport copy. */
export function lessonApiErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const record = error as { status?: number; details?: { detail?: unknown } };
  if (record.status !== 422 || !record.details?.detail || typeof record.details.detail !== "object") return undefined;
  const detail = record.details.detail as { code?: string; message?: unknown; issues?: { message?: unknown }[] };
  if (!["invalid_open_lesson_document", "conflicting_curriculum_programmes", "selected_objective_requires_reselection"].includes(detail.code ?? "")) return undefined;
  const messages = [detail.message, ...(Array.isArray(detail.issues) ? detail.issues.map((item) => item.message) : [])]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim().slice(0, 500));
  return [...new Set(messages)].slice(0, 10).join("\n") || undefined;
}

export type LessonValidationIssue = { path: string; message: string };
const hasText = (value?: string | null, minimum = 1) => (value?.trim().length ?? 0) >= minimum;
const validTable = (table: LessonTemplateTable) => table.columns.length > 0 && table.columns.every((column) => hasText(column)) && table.rows.every((row) => row.length === table.columns.length);
const reference = (value?: string | null) => value?.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, "") ?? "";
const matchesAnswer = (taskRef: string, block: LessonSubBlock) => [block.task_id, block.phase_name, block.method_name].some((value) => Boolean(reference(value)) && reference(value) === reference(taskRef));

export function lessonValidationIssues(plan: EditableLessonPlan, kk: boolean): LessonValidationIssue[] {
  const issues: LessonValidationIssue[] = [];
  const strict = plan.planner_version === "open_lesson_v1";
  const add = (path: string, ru: string, kaz: string) => issues.push({ path, message: kk ? kaz : ru });
  if (strict) {
    for (const [key, ru, kaz] of [["subject", "Укажите предмет.", "Пәнді көрсетіңіз."], ["grade", "Укажите класс.", "Сыныпты көрсетіңіз."], ["topic", "Укажите тему урока.", "Сабақ тақырыбын көрсетіңіз."]] as const) {
      if (!hasText(plan.meta[key])) add(`meta-${key}`, ru, kaz);
    }
    const objectives = Array.isArray(plan.meta.lesson_objectives) ? plan.meta.lesson_objectives : [plan.meta.lesson_objectives];
    if (!objectives.some((text) => hasText(text))) add("meta-lesson-objectives", "Добавьте цель урока.", "Сабақ мақсатын қосыңыз.");
  }
  if (strict && (!validLessonMinutes(plan.meta.duration) || plan.meta.duration < 10)) add("duration", "Укажите продолжительность урока целым числом от 10 до 180 минут.", "Сабақ ұзақтығын 10–180 минут аралығындағы бүтін санмен көрсетіңіз.");
  if (plan.meta.assessment_mode === "recorded_formative" && plan.meta.lesson_score_max !== 10) add("assessment-mode", "Для оценки в журнале используется шкала 1–10 баллов: максимальное значение должно быть 10.", "Журнал бағасына 1–10 балл шкаласы қолданылады: ең жоғары мәні 10 болуы керек.");
  plan.flow.forEach((stage, si) => stage.sub_blocks.forEach((block, bi) => {
    const path = `block-${si}-${bi}`;
    if (strict) {
      if (!hasText(block.phase_name)) add(`${path}-phase`, "Укажите название задания.", "Тапсырма атауын көрсетіңіз.");
      if (!hasText(block.teacher_activity, 4)) add(`${path}-teacher`, "Заполните задание и действия учителя (не менее 4 символов).", "Тапсырма мен мұғалімнің іс-әрекетін толтырыңыз (кемінде 4 таңба).");
      if (!hasText(block.student_activity, 4)) add(`${path}-student`, "Заполните действия ученика (не менее 4 символов).", "Оқушының іс-әрекетін толтырыңыз (кемінде 4 таңба).");
      block.quiz?.forEach((question, qi) => {
        const quizPath = `${path}-quiz-${qi}`;
        if (!/[\p{L}\p{N}]/u.test(question.text)) add(`${quizPath}-text`, "Введите текст вопроса викторины.", "Викторина сұрағының мәтінін енгізіңіз.");
        const options = question.options.map((option, index) => {
          const match = option.trim().match(/^([a-z])\s*[)\].:\-]\s*(.+)$/i);
          return { label: match?.[1].toUpperCase() ?? String.fromCharCode(65 + index), body: (match?.[2] ?? option).trim().toLocaleLowerCase() };
        });
        if (options.length < 2 || options.length > 6 || options.some((option) => !/[\p{L}\p{N}]/u.test(option.body)) || new Set(options.map((option) => option.body)).size !== options.length || new Set(options.map((option) => option.label)).size !== options.length) add(`${quizPath}-options`, "Добавьте от 2 до 6 разных непустых вариантов с уникальными буквами.", "Бірегей әріптері бар 2–6 түрлі бос емес жауап нұсқасын қосыңыз.");
        const correct = question.correct.trim();
        const letter = correct.match(/^([a-z])\s*[)\].:]?$/i)?.[1].toUpperCase();
        if (!options.some((option) => option.label === letter || option.body === correct.toLocaleLowerCase() || `${option.label.toLocaleLowerCase()}) ${option.body}` === correct.toLocaleLowerCase())) add(`${quizPath}-correct`, "Укажите букву или полный текст одного из вариантов правильного ответа.", "Дұрыс жауап нұсқасының әрпін немесе толық мәтінін көрсетіңіз.");
      });
      if (block.template_table && !validTable(block.template_table)) add(`${path}-table`, "Заполните названия столбцов и сделайте число ячеек в каждой строке равным числу столбцов.", "Баған атауларын толтырып, әр жолдағы ұяшық санын баған санына теңестіріңіз.");
      const main = stage.stage_id === "middle" || block.is_main_task || block.individual_check;
      if (main) {
        if (!block.quiz?.length && !block.template_table && !hasText(block.free_text_content, 20)) add(`${path}-material`, "Добавьте полное условие задания (не менее 20 символов), викторину или таблицу.", "Тапсырманың толық шартын (кемінде 20 таңба), викторина немесе кесте қосыңыз.");
        if (!hasText(block.expected_result, 5)) add(`${path}-result`, "Заполните ожидаемый результат задания (не менее 5 символов).", "Тапсырманың күтілетін нәтижесін толтырыңыз (кемінде 5 таңба).");
        if (!hasText(block.assessment_criteria, 5)) add(`${path}-criteria`, "Заполните критерий оценивания (не менее 5 символов).", "Бағалау критерийін толтырыңыз (кемінде 5 таңба).");
        if (!block.descriptors.length || block.descriptors.some((descriptor) => !hasText(descriptor.text, 5))) add(`${path}-assessment`, "Добавьте содержательные дескрипторы (не менее 5 символов каждый).", "Нақты дескрипторлар қосыңыз (әрқайсысы кемінде 5 таңба).");
        if (plan.meta.answer_keys_required !== false && !plan.answer_keys?.some((answer) => matchesAnswer(answer.task_ref, block))) add("answer-keys", `Добавьте ответ для задания «${block.phase_name || bi + 1}» и выберите его в поле «Задание для этого ответа».`, `«${block.phase_name || bi + 1}» тапсырмасының жауабын қосып, тиісті тапсырманы таңдаңыз.`);
      }
      if (block.resource_urls.some((url) => hasText(url)) && !hasText(block.offline_alternative)) add(`${path}-offline`, "Добавьте конкретную альтернативу цифровому заданию без интернета.", "Цифрлық тапсырманың интернетсіз нақты баламасын қосыңыз.");
    }
    if ((strict || block.minutes != null) && !validLessonMinutes(block.minutes)) add(`${path}-minutes`, `Укажите для задания «${block.phase_name || bi + 1}» целое время от 1 до 180 минут.`, `«${block.phase_name || bi + 1}» тапсырмасының уақытын 1–180 минут аралығындағы бүтін санмен көрсетіңіз.`);
    if (block.descriptors.some((item) => !Number.isInteger(item.points) || item.points < 0 || item.points > 100)) add(`${path}-assessment`, "Баллы дескрипторов должны быть целыми числами от 0 до 100.", "Дескриптор балдары 0–100 аралығындағы бүтін сан болуы керек.");
    const points = block.descriptors.reduce((sum, item) => sum + item.points, 0);
    const statedTotal = block.assessment_note?.match(/(?:итого|всего|барлығы|жиыны|total)\s*[:—–-]?\s*(\d+)\s*(?:балл|ұпай|points?)/i);
    if (strict && statedTotal && Number(statedTotal[1]) !== points) add(`${path}-assessment-note`, `Обновите итог в примечании: сумма дескрипторов — ${points}.`, `Ескертпедегі қорытындыны жаңартыңыз: дескрипторлар қосындысы — ${points}.`);
    if (/^1(?:\D|$)/.test(plan.meta.grade) && block.descriptors.some((item) => item.points > 0)) add(`${path}-assessment`, "В 1 классе используйте описательную обратную связь: все баллы равны 0.", "1-сыныпта сипаттамалық кері байланыс қолданылады: барлық балл 0 болуы керек.");
    if (strict && block.is_main_task && !block.descriptors.some((item) => item.text.trim())) add(`${path}-assessment`, "Добавьте содержательные дескрипторы к основному заданию.", "Негізгі тапсырмаға нақты дескрипторлар қосыңыз.");
    const taskId = block.task_id || `${si}:${bi}`;
    if (plan.editor_review?.task_ids.includes(taskId)) add(`${path}-assessment`, "Задание или баллы изменены. Согласуйте примечание оценивания и ответы, затем подтвердите проверку у задания.", "Тапсырма немесе балдар өзгерді. Бағалау ескертпесі мен жауаптарды сәйкестендіріп, тапсырмадағы тексеруді растаңыз.");
  }));
  if (strict) {
    const main = plan.flow.flatMap((stage, si) => stage.sub_blocks.map((block, bi) => ({ block, si, bi, main: stage.stage_id === "middle" || block.is_main_task || block.individual_check }))).filter((item) => item.main);
    if (main.length && !main.some(({ block }) => hasText(block.inclusive_support))) add(`block-${main[0].si}-${main[0].bi}-support`, "Добавьте дифференциацию или опору хотя бы к одному основному заданию.", "Кемінде бір негізгі тапсырмаға саралау немесе тірек қосыңыз.");
    const endIndex = plan.flow.findIndex((stage) => stage.stage_id === "end");
    const end = plan.flow[endIndex];
    if (end?.sub_blocks.length) {
      if (!end.sub_blocks.some((block) => block.individual_check && block.work_type === "individual")) add(`block-${endIndex}-0-individual`, "В конце урока отметьте индивидуальную проверку и выберите форму работы «Индивидуальная».", "Сабақ соңында жеке тексеруді белгілеп, «Жеке» жұмыс түрін таңдаңыз.");
      if (!end.sub_blocks.some((block) => block.reflection_questions?.some((question) => hasText(question)))) add(`block-${endIndex}-0-reflection`, "Добавьте вопрос рефлексии по результату обучения в конце урока.", "Сабақ соңында оқу нәтижесі бойынша рефлексия сұрағын қосыңыз.");
    }
    plan.answer_keys?.forEach((answer, index) => {
      if (!hasText(answer.content) && !answer.table?.rows.some((row) => row.some((cell) => hasText(cell)))) add(`answer-${index}-content`, "Заполните ответ или таблицу с решением; пустой ключ ответа нельзя скачать.", "Жауапты немесе шешімі бар кестені толтырыңыз; бос жауап кілтін жүктеу мүмкін емес.");
      if (answer.table && !validTable(answer.table)) add(`answer-${index}-table`, "В таблице ответа нужны непустые названия столбцов и одинаковое число ячеек в каждой строке.", "Жауап кестесінде бос емес баған атаулары және әр жолда бірдей ұяшық саны болуы керек.");
    });
  }
  const minutes = lessonMinutes(plan);
  if (strict && minutes != null && validLessonMinutes(plan.meta.duration) && minutes !== plan.meta.duration) add("lesson-flow", `Сумма времени заданий ${minutes} мин. Согласуйте её с продолжительностью урока ${plan.meta.duration} мин.`, `Тапсырмалар уақытының қосындысы ${minutes} минут. Оны сабақтың ${plan.meta.duration} минут ұзақтығына сәйкестендіріңіз.`);
  if (!validStudentCount(plan.meta.student_count)) add("student-count", "Укажите целое количество учеников от 1 до 1000 или оставьте поле пустым.", "Оқушылар санын 1–1000 аралығындағы бүтін санмен көрсетіңіз немесе бос қалдырыңыз.");
  return issues;
}

export function cleanLessonRequest(draft: LessonPlanDraft): LessonPlanRequest {
  const { selected_objective_texts = [], selected_objectives: _selection, selection_backup_texts: _backup, ...request } = draft;
  void _selection;
  void _backup;
  return {
    ...request, planner_version: "open_lesson_v1", schema_version: "v2",
    subject: draft.subject.trim(), grade: draft.grade.trim(), topic: draft.topic.trim(),
    teacher_name: draft.teacher_name.trim(), section_name: draft.section_name.trim(),
    learning_objectives: [...new Set([...draft.learning_objectives, ...selected_objective_texts].map((value) => value.trim()).filter(Boolean))],
    date: draft.date?.trim() || null, textbook_text: draft.textbook_text?.trim() || null,
    resources: (draft.resources ?? []).map((value) => value.trim()).filter(Boolean),
  };
}

export function validStudentCount(value: number | null | undefined): boolean {
  return value == null || (Number.isInteger(value) && value >= 1 && value <= 1000);
}

export function lessonMinutes(plan: EditableLessonPlan): number | null {
  const blocks = plan.flow.flatMap((stage) => stage.sub_blocks);
  if (!blocks.length || blocks.some((block) => !validLessonMinutes(block.minutes))) return null;
  return blocks.reduce((sum, block) => sum + (block.minutes ?? 0), 0);
}

export function safeSourceUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : undefined; }
  catch { return undefined; }
}
