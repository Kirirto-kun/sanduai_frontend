import type { LessonMeta, LessonSubBlock, LessonTemplateTable } from "@/lib/api";
import { generatedContentCopy } from "@/lib/generated-content-copy";
import { tryNormalizeContentLanguage } from "@/lib/content-languages";
import { buttonClass, fieldClass, TextField } from "./Fields";
import { getDocumentCopy, lessonWarning } from "./copy";
import { lessonMinutes, safeSourceUrl, validStudentCount, updateLessonBlock, type EditableLessonPlan } from "./model";
import { canonicalWorkType, taskReferenceOptions, workTypeOptions } from "./editor-labels";

function WorkTypeField({ value, onChange, kk }: { value?: string | null; onChange: (value: string | null) => void; kk: boolean }) {
  const options = workTypeOptions(kk);
  const selected = canonicalWorkType(value) ?? value ?? "";
  const custom = Boolean(selected && !options.some((option) => option.value === selected));
  return <label className="block text-sm font-semibold text-slate-700">{kk ? "Жұмыс түрі" : "Форма работы"}
    <select className={`${fieldClass} mt-1.5`} value={selected} onChange={(event) => onChange(event.target.value || null)}>
      <option value="">{kk ? "Көрсетілмеген" : "Не указана"}</option>
      {custom ? <option value={selected}>{/^[a-z][a-z0-9_-]*$/.test(selected) ? (kk ? "Басқа жұмыс түрі" : "Другая форма работы") : selected}</option> : null}
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>;
}

function TaskReferenceField({ plan, reference, index, onChange, kk }: { plan: EditableLessonPlan; reference: string; index: number; onChange: (value: string) => void; kk: boolean }) {
  return <label className="block text-sm font-semibold text-slate-700">{kk ? "Жауап берілген тапсырма" : "Задание для этого ответа"}
    <select value={reference} onChange={(event) => onChange(event.target.value)} className={`${fieldClass} mt-1.5`}>
      {taskReferenceOptions(plan, reference, index, kk).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>;
}

function TableEditor({ table, onChange, kk }: { table: LessonTemplateTable; onChange: (table: LessonTemplateTable) => void; kk: boolean }) {
  return <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
    <TextField label={kk ? "Кесте атауы" : "Название таблицы"} value={table.caption} onChange={(caption) => onChange({ ...table, caption })} />
    <TextField label={kk ? "Баған атаулары (әр жолға біреу)" : "Названия столбцов (по одному в строке)"} multiline value={table.columns.join("\n")} onChange={(value) => onChange({ ...table, columns: value.split("\n") })} />
    {table.rows.map((row, index) => <div key={index} className="space-y-2 rounded-xl border border-slate-200 bg-white p-2"><p className="text-xs font-semibold">{kk ? "Жол" : "Строка"} {index + 1}</p>{row.map((cell, column) => <TextField key={column} label={table.columns[column] || `${column + 1}`} value={cell} onChange={(value) => onChange({ ...table, rows: table.rows.map((current, i) => i !== index ? current : current.map((text, j) => j === column ? value : text)) })} />)}<button type="button" className={buttonClass} onClick={() => onChange({ ...table, rows: table.rows.filter((_, i) => i !== index) })}>{kk ? "Жолды жою" : "Удалить строку"}</button></div>)}
    <button type="button" className={buttonClass} onClick={() => onChange({ ...table, rows: [...table.rows, table.columns.map(() => "")] })}>{kk ? "Жол қосу" : "Добавить строку"}</button>
  </div>;
}

function BlockContent({ block, onChange, kk }: { block: LessonSubBlock; onChange: (patch: Partial<LessonSubBlock>) => void; kk: boolean }) {
  return <div className="space-y-3">
    <TextField label={kk ? "Әдіс" : "Метод"} value={block.method_name ?? ""} onChange={(method_name) => onChange({ method_name })} />
    <WorkTypeField value={block.work_type} onChange={(work_type) => onChange({ work_type })} kk={kk} />
    <TextField label={kk ? "Тапсырма, нұсқау және сұрақтар" : "Задание, инструкция и вопросы"} multiline value={block.teacher_activity} onChange={(teacher_activity) => onChange({ teacher_activity })} />
    {block.free_text_content != null ? <TextField label={kk ? "Тапсырма материалы" : "Материал задания"} multiline value={block.free_text_content} onChange={(free_text_content) => onChange({ free_text_content })} /> : null}
    {block.quiz?.map((question, index) => <div key={index} className="space-y-2 rounded-xl border border-slate-200 p-3">
      <TextField label={`${kk ? "Сұрақ" : "Вопрос"} ${index + 1}`} multiline value={question.text} onChange={(text) => onChange({ quiz: block.quiz?.map((current, i) => i !== index ? current : { ...current, text }) })} />
      <TextField label={kk ? "Жауап нұсқалары (әр жолға біреу)" : "Варианты ответа (по одному в строке)"} multiline value={question.options.join("\n")} onChange={(value) => onChange({ quiz: block.quiz?.map((current, i) => i !== index ? current : { ...current, options: value.split("\n") }) })} />
      <TextField label={kk ? "Дұрыс жауаптың әрпі" : "Буква правильного ответа"} value={question.correct} onChange={(correct) => onChange({ quiz: block.quiz?.map((current, i) => i !== index ? current : { ...current, correct }) })} />
    </div>)}
    {block.template_table ? <TableEditor table={block.template_table} onChange={(template_table) => onChange({ template_table })} kk={kk} /> : null}
    <details><summary className="cursor-pointer py-2 text-sm font-semibold text-[var(--primary)]">{kk ? "Қолдау және әдістемелік мәліметтер" : "Поддержка и методические детали"}</summary><div className="space-y-3 pt-2">
      <TextField label={kk ? "ЕББҚ қолдауы" : "Поддержка ученика с ООП"} multiline value={block.inclusive_support ?? ""} onChange={(inclusive_support) => onChange({ inclusive_support })} />
      <TextField label={kk ? "Тапсырманың мақсаты" : "Цель задания"} multiline value={block.task_objective ?? ""} onChange={(task_objective) => onChange({ task_objective })} />
      {block.interesting_fact != null ? <TextField label={kk ? "Қосымша дерек" : "Дополнительный факт"} multiline value={block.interesting_fact} onChange={(interesting_fact) => onChange({ interesting_fact })} /> : null}
      {block.neuro_exercise != null ? <TextField label={kk ? "Жаттығу" : "Разминка"} multiline value={block.neuro_exercise} onChange={(neuro_exercise) => onChange({ neuro_exercise })} /> : null}
    </div></details>
  </div>;
}

export function PlannerEditor({ plan, onChange, kk, onExport, exporting, onNew, error }: { plan: EditableLessonPlan; onChange: (plan: EditableLessonPlan) => void; kk: boolean; onExport: () => void; exporting: boolean; onNew: () => void; error: string }) {
  const outputLanguage = tryNormalizeContentLanguage(plan.language) ?? "kk";
  const baseCopy = generatedContentCopy(outputLanguage).lessonPlan;
  const copy = outputLanguage === "kk" ? { ...baseCopy, title: "Қысқа мерзімді (сабақ) жоспары", teacherName: "Педагогтің тегі, аты, әкесінің аты (болған жағдайда)", learningObjectives: "Оқу бағдарламасына сәйкес оқыту мақсаттары", studentsPresent: "Қатысушылар саны" } : outputLanguage === "ru" ? { ...baseCopy, title: "Краткосрочный (поурочный) план", learningObjectives: "Цели обучения в соответствии с учебной программой" } : baseCopy;
  const updateMeta = <K extends keyof LessonMeta,>(key: K, value: LessonMeta[K]) => onChange({
    ...plan, meta: { ...plan.meta, [key]: value },
    ...(key === "learning_objectives" && plan.knowledge ? { knowledge: { ...plan.knowledge, status: "partial" as const, warnings: [...new Set([...plan.knowledge.warnings, "edited_objectives_require_verification"])] } } : {}),
  });
  const minutes = lessonMinutes(plan);
  const timeMismatch = minutes != null && plan.meta.duration != null && minutes !== plan.meta.duration;
  const objectivesText = Array.isArray(plan.meta.lesson_objectives) ? plan.meta.lesson_objectives.join("\n") : plan.meta.lesson_objectives;
  const docCopy = getDocumentCopy(outputLanguage);
  const countInvalid = !validStudentCount(plan.meta.student_count);
  const stageTimeTitle = docCopy.stageTime;
  const columns = [stageTimeTitle, copy.teacherActivity, copy.studentActivity, copy.assessment, copy.resources];
  const metaRows: [keyof LessonMeta, string][] = [["section_name", copy.sectionName], ["teacher_name", copy.teacherName], ["date", copy.date], ["grade", copy.grade], ["students_present", copy.studentsPresent], ["students_absent", copy.studentsAbsent], ["topic", copy.topic]];

  return <div className="space-y-6">
    <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
      <TextField label={kk ? "Білім беру ұйымының атауы" : "Название организации образования"} value={plan.meta.school_name ?? ""} onChange={(value) => updateMeta("school_name", value)} />
      <h2 className="text-center text-xl font-bold text-slate-900">{copy.title}</h2>
      <div className="overflow-hidden rounded-2xl border border-slate-200"><table className="w-full border-collapse"><caption className="sr-only">{kk ? "Сабақ туралы мәлімет" : "Сведения об уроке"}</caption><thead><tr><th scope="col" className="border-b border-slate-200 bg-slate-100 px-3 py-3 text-left text-sm font-bold">{docCopy.field}</th><th scope="col" className="border-b border-slate-200 bg-slate-100 px-3 py-3 text-left text-sm font-bold">{docCopy.details}</th></tr></thead><tbody>{metaRows.map(([key, title]) => <tr key={key} className="border-b border-slate-200 last:border-0"><th scope="row" className="w-1/3 bg-slate-50 px-3 py-2 text-left align-top text-sm font-semibold text-slate-700">{title}</th><td className="px-3 py-2"><input aria-label={title} className={fieldClass} value={String(plan.meta[key] ?? "")} onChange={(event) => updateMeta(key, event.target.value)} /></td></tr>)}
        <tr className="border-t border-slate-200"><th scope="row" className="bg-slate-50 px-3 py-2 text-left align-top text-sm font-semibold text-slate-700">{copy.learningObjectives}</th><td className="px-3 py-2"><textarea aria-label={copy.learningObjectives} className={fieldClass} rows={3} value={plan.meta.learning_objectives.join("\n")} onChange={(event) => updateMeta("learning_objectives", event.target.value.split("\n"))} /></td></tr>
        <tr className="border-t border-slate-200"><th scope="row" className="bg-slate-50 px-3 py-2 text-left align-top text-sm font-semibold text-slate-700">{copy.lessonObjectives}</th><td className="px-3 py-2"><textarea aria-label={copy.lessonObjectives} className={fieldClass} rows={3} value={objectivesText} onChange={(event) => updateMeta("lesson_objectives", Array.isArray(plan.meta.lesson_objectives) ? event.target.value.split("\n") : event.target.value)} /></td></tr>
      </tbody></table></div>
      <div className="grid gap-4 sm:grid-cols-3"><TextField label={copy.subject} value={plan.meta.subject} onChange={(value) => updateMeta("subject", value)} /><TextField label={kk ? "Ұзақтығы, минут" : "Продолжительность, минут"} type="number" min={10} max={180} value={String(plan.meta.duration ?? "")} onChange={(value) => updateMeta("duration", value === "" ? undefined : Number(value))} /><TextField label={kk ? "Оқушылар саны" : "Количество учеников"} type="number" min={1} max={1000} step={1} value={plan.meta.student_count == null ? "" : String(plan.meta.student_count)} onChange={(value) => updateMeta("student_count", value === "" ? null : Number(value))} /></div>
    </section>
    <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-bold">{docCopy.flow}</h2>{minutes != null ? <p className={`text-sm font-semibold ${timeMismatch ? "text-red-700" : "text-slate-600"}`}>{kk ? "Жалпы уақыт" : "Общее время"}: {minutes} / {plan.meta.duration ?? "—"} {kk ? "минут" : "мин"}</p> : null}</div>
      {timeMismatch ? <p role="alert" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{kk ? "Кезеңдердің уақытын сабақ ұзақтығына сәйкестендіріңіз." : "Согласуйте время заданий с продолжительностью урока перед скачиванием."}</p> : null}
      <p className="mb-4 text-sm leading-6 text-slate-600">{kk ? "Барлық ұяшықтарды өңдеуге болады. Кестені көлденең айналдырыңыз." : "Все ячейки можно редактировать. Прокручивайте таблицу по горизонтали."}</p>
      <div className="overflow-x-auto rounded-2xl border border-slate-200" tabIndex={0} role="region" aria-label={kk ? "ҚМЖ кестесі" : "Таблица КМЖ"}><table className="w-full min-w-[1350px] table-fixed border-collapse"><thead><tr>{columns.map((title, i) => <th key={title} scope="col" className={`border-r border-slate-200 bg-slate-100 px-3 py-4 text-left text-sm font-bold text-slate-800 last:border-0 ${i === 0 ? "w-[160px]" : i === 1 ? "w-[390px]" : "w-[265px]"}`}>{title}</th>)}</tr></thead><tbody>
      {plan.flow.map((stage, stageIndex) => stage.sub_blocks.map((block, blockIndex) => {
        const patch = (value: Partial<LessonSubBlock>) => onChange(updateLessonBlock(plan, stageIndex, blockIndex, value));
        return <tr key={`${stageIndex}-${blockIndex}`} className="border-t border-slate-200 align-top">
          <td className="space-y-3 border-r border-slate-200 bg-slate-50 p-3">
            {blockIndex === 0 ? <TextField label={kk ? "Кезең" : "Этап"} value={stage.stage_name} onChange={(stage_name) => onChange({ ...plan, flow: plan.flow.map((item, i) => i !== stageIndex ? item : { ...item, stage_name }) })} /> : <p className="text-sm font-semibold">{stage.stage_name}</p>}
            <TextField label={kk ? "Тапсырма атауы" : "Название задания"} value={block.phase_name} onChange={(phase_name) => patch({ phase_name })} />
            <TextField label={kk ? "Уақыт, минут" : "Время, минут"} type="number" min={0} max={180} step={1} value={block.minutes == null ? "" : String(block.minutes)} onChange={(value) => patch({ minutes: value === "" ? null : Number(value), time: value === "" ? "" : `${value} мин` })} />
            {block.minutes == null ? <TextField label={kk ? "Уақыт белгісі" : "Обозначение времени"} value={block.time} onChange={(time) => patch({ time })} /> : null}
          </td>
          <td className="border-r border-slate-200 p-3"><BlockContent block={block} onChange={patch} kk={kk} /></td>
          <td className="space-y-3 border-r border-slate-200 p-3"><TextField label={kk ? "Оқушының іс-әрекеті" : "Действия ученика"} multiline value={block.student_activity} onChange={(student_activity) => patch({ student_activity })} /><TextField label={kk ? "Күтілетін нәтиже" : "Ожидаемый результат"} multiline value={block.expected_result ?? ""} onChange={(expected_result) => patch({ expected_result })} /><TextField label={kk ? "Рефлексия сұрақтары" : "Вопросы рефлексии"} multiline value={(block.reflection_questions ?? []).join("\n")} onChange={(value) => patch({ reflection_questions: value.split("\n") })} />
            {plan.knowledge?.objectives?.length ? <fieldset><legend className="mb-2 text-sm font-semibold">{kk ? "Тапсырманың оқу мақсаттары" : "Учебные цели задания"}</legend>{plan.knowledge.objectives.map((objective) => { const id = objective.context_id ?? objective.id; return <label key={id} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={block.objective_ids?.includes(id) ?? false} onChange={(event) => patch({ objective_ids: event.target.checked ? [...(block.objective_ids ?? []), id] : block.objective_ids?.filter((item) => item !== id) })} /><span>{objective.code}</span></label>; })}</fieldset> : null}
          </td>
          <td className="space-y-3 border-r border-slate-200 p-3"><TextField label={kk ? "Бағалау критерийі" : "Критерий оценивания"} multiline value={block.assessment_criteria ?? ""} onChange={(assessment_criteria) => patch({ assessment_criteria })} />
            {block.descriptors.map((descriptor, index) => <div key={index} className="space-y-2 rounded-xl border border-slate-200 p-2"><TextField label={`${kk ? "Дескриптор" : "Дескриптор"} ${index + 1}`} multiline value={descriptor.text} onChange={(text) => patch({ descriptors: block.descriptors.map((item, i) => i !== index ? item : { ...item, text }) })} /><TextField label={kk ? "Балл (0 — баллсыз)" : "Баллы (0 — без баллов)"} type="number" min={0} max={100} step={1} value={String(descriptor.points)} onChange={(value) => patch({ descriptors: block.descriptors.map((item, i) => i !== index ? item : { ...item, points: Number(value) || 0 }) })} /><button type="button" className={buttonClass} onClick={() => patch({ descriptors: block.descriptors.filter((_, i) => i !== index) })}>{kk ? "Жою" : "Удалить"}</button></div>)}
            <button type="button" className={buttonClass} onClick={() => patch({ descriptors: [...block.descriptors, { text: "", points: 0 }] })}>{kk ? "Дескриптор қосу" : "Добавить дескриптор"}</button>
            <TextField label={kk ? "Кері байланыс және бағалау" : "Обратная связь и оценивание"} multiline value={block.assessment_note ?? ""} onChange={(assessment_note) => patch({ assessment_note })} /><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={block.individual_check ?? false} onChange={(event) => patch({ individual_check: event.target.checked })} />{kk ? "Әр оқушының нәтижесін тексеру" : "Проверить индивидуальный результат"}</label>
          </td>
          <td className="space-y-3 p-3"><TextField label={kk ? "Материалдар (әр жолға біреу)" : "Материалы (по одному в строке)"} multiline value={block.resource_materials.join("\n")} onChange={(value) => patch({ resource_materials: value.split("\n") })} /><TextField label={kk ? "Ресурс сілтемелері" : "Ссылки на ресурсы"} multiline value={block.resource_urls.join("\n")} onChange={(value) => patch({ resource_urls: value.split("\n") })} /><TextField label={kk ? "Интернетсіз балама" : "Альтернатива без интернета"} multiline value={block.offline_alternative ?? ""} onChange={(offline_alternative) => patch({ offline_alternative })} /></td>
        </tr>;
      }))}</tbody></table></div>
      {plan.flow.map((stage, index) => stage.homework != null ? <div key={index} className="mt-4"><TextField label={kk ? "Үй тапсырмасы" : "Домашнее задание"} multiline value={stage.homework} onChange={(homework) => onChange({ ...plan, flow: plan.flow.map((item, i) => i !== index ? item : { ...item, homework }) })} /></div> : null)}
    </section>
    {plan.answer_keys?.length ? <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5"><h2 className="text-xl font-bold">{kk ? "Мұғалімге арналған қосымша материалдар" : "Дополнительные материалы учителю"}</h2>{plan.answer_keys.map((answer, index) => <div key={index} className="space-y-3 rounded-2xl border border-slate-200 p-4"><TaskReferenceField plan={plan} reference={answer.task_ref} index={index} kk={kk} onChange={(task_ref) => onChange({ ...plan, answer_keys: plan.answer_keys?.map((item, i) => i !== index ? item : { ...item, task_ref }) })} /><TextField label={kk ? "Жауаптар мен шешімдер" : "Ответы и решения"} multiline value={answer.content} onChange={(content) => onChange({ ...plan, answer_keys: plan.answer_keys?.map((item, i) => i !== index ? item : { ...item, content }) })} />{answer.table ? <TableEditor table={answer.table} kk={kk} onChange={(table) => onChange({ ...plan, answer_keys: plan.answer_keys?.map((item, i) => i !== index ? item : { ...item, table }) })} /> : null}</div>)}</section> : null}
    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><h2 className="text-lg font-bold">{kk ? "Дереккөздер және тексеру" : "Источники и проверка"}</h2><p className="mt-2 text-sm leading-6 text-slate-700">{plan.knowledge?.status === "verified" ? (kk ? "Таңдалған нормативтік деректер базамен расталған." : "Выбранные нормативные данные подтверждены базой.") : (kk ? "Деректердің бір бөлігі тексеруді қажет етеді. Оқу мақсаттарын ресми бағдарламамен салыстырыңыз." : "Часть данных требует проверки. Сравните учебные цели с официальной программой.")}</p>{plan.knowledge ? <p className="mt-1 text-xs text-slate-600">{kk ? "База нұсқасы" : "Версия базы"}: {plan.knowledge.version} {plan.knowledge.checked_at ? `· ${plan.knowledge.checked_at}` : ""}</p> : null}<ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-amber-900">{plan.knowledge?.warnings.map((warning, index) => <li key={index}>{lessonWarning(warning, kk)}</li>)}</ul><ul className="mt-3 space-y-2 text-sm">{plan.knowledge?.sources.map((source, index) => <li key={index}>{safeSourceUrl(source.url) ? <a className="font-semibold text-[var(--primary)] underline" href={safeSourceUrl(source.url)} target="_blank" rel="noopener noreferrer">{source.title}</a> : source.title}{source.version ? ` · ${source.version}` : ""}{source.checked_at ? ` · ${source.checked_at}` : ""}</li>)}</ul></section>
    {countInvalid ? <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{kk ? "Оқушылар саны 1–1000 аралығындағы бүтін сан болуы керек немесе бос қалсын." : "Укажите целое количество учеников от 1 до 1000 или оставьте поле пустым."}</p> : null}
    {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">{error}</p> : null}
    <div className="flex flex-col gap-3 sm:flex-row"><button type="button" onClick={onExport} disabled={exporting || timeMismatch || countInvalid} className="min-h-12 flex-1 rounded-2xl bg-[var(--primary)] px-6 py-3 font-bold text-white shadow-sm hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] disabled:opacity-50">{exporting ? (kk ? "Дайындалуда…" : "Подготавливаем…") : (kk ? "Word форматында жүктеу" : "Скачать Word")}</button><button type="button" onClick={onNew} className={`${buttonClass} flex-1`}>{kk ? "Жаңа ҚМЖ" : "Новый КМЖ"}</button></div>
  </div>;
}
