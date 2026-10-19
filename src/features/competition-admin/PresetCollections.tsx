import { EmptyRows, Field, fieldClass, LocalizedField, RowControls, secondaryButton, SectionHeading } from "./EditorFields";
import { moveRow, nextId, toggleValue } from "./model";
import type { CompetitionCriterion, CompetitionDirection, CompetitionPresetInput, CompetitionSection } from "./types";

const roles = [
  ["manager", "Басшы", "Руководитель"],
  ["subject_teacher", "Пән мұғалімі", "Предметный учитель"],
  ["kindergarten_teacher", "Тәрбиеші", "Воспитатель"],
  ["primary_teacher", "Бастауыш мұғалімі", "Учитель начальных классов"],
  ["class_teacher", "Сынып жетекшісі", "Классный руководитель"],
  ["psychologist", "Психолог", "Психолог"],
  ["speech_therapist", "Логопед", "Логопед"],
  ["special_educator", "Дефектолог", "Дефектолог"],
] as const;

type Props = { preset: CompetitionPresetInput; kk: boolean; onChange: (patch: Partial<CompetitionPresetInput>) => void };

export function DirectionsEditor({ preset, kk, onChange }: Props) {
  const patch = (index: number, value: Partial<CompetitionDirection>) => onChange({ directions: preset.directions.map((row, position) => position === index ? { ...row, ...value } : row) });
  return <section>
    <SectionHeading title={kk ? "Байқау бағыттары" : "Направления конкурса"} description={preset.kind === "panorama"
      ? (kk ? "Педагог бір жұмысқа бір негізгі бағыт таңдайды. Бағыттар тек осы жылғы ережеге қатысты." : "Педагог выбирает одно основное направление для одной работы. Список действует только для этого года.")
      : (kk ? "Рөлдер фестиваль бағытын автоматты ұсынуға көмектеседі." : "Свяжите направления с ролями для автоматической рекомендации педагогу.")}
      action={<button type="button" className={secondaryButton} onClick={() => onChange({ directions: [...preset.directions, { id: nextId("direction", preset.directions.map(row => row.id)), label: { kk: "", ru: "" }, roles: [] }] })}>+ {kk ? "Бағыт қосу" : "Добавить направление"}</button>} />
    {!preset.directions.length ? <EmptyRows message={kk ? "Әлі бағыт жоқ. Осы жылдың ресми ережесінен бағыт қосыңыз." : "Направлений пока нет. Добавьте их из официальных правил этого года."} /> : null}
    <div className="space-y-4">
      {preset.directions.map((row, index) => <article key={index} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-sm font-bold text-teal-700">{String(index + 1).padStart(2, "0")}</span><RowControls index={index} count={preset.directions.length} label={row.label[kk ? "kk" : "ru"] || row.id} kk={kk} onMove={direction => onChange({ directions: moveRow(preset.directions, index, direction) })} onRemove={() => onChange({ directions: preset.directions.filter((_, position) => position !== index) })} /></div>
        <div className="space-y-4"><Field label={kk ? "Бағыт коды" : "Код направления"}><input className={fieldClass} value={row.id} onChange={event => patch(index, { id: event.target.value })} /></Field><LocalizedField label={kk ? "Бағыт атауы" : "Название направления"} value={row.label} onChange={label => patch(index, { label })} />
          {preset.kind === "festival" ? <fieldset className="border-t border-slate-100 pt-4"><legend className="text-sm font-semibold text-slate-700">{kk ? "Кімге ұсынылады" : "Кому рекомендовать"}</legend><div className="mt-3 flex flex-wrap gap-2">{roles.map(([id, kz, ru]) => <label key={id} className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 text-xs font-medium transition ${row.roles.includes(id) ? "border-teal-300 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}><input type="checkbox" className="h-4 w-4 accent-teal-700" checked={row.roles.includes(id)} onChange={() => patch(index, { roles: toggleValue(row.roles, id) })} />{kk ? kz : ru}</label>)}</div></fieldset> : null}
        </div>
      </article>)}
    </div>
  </section>;
}

export function StructureEditor({ preset, kk, onChange }: Props) {
  const patch = (index: number, value: Partial<CompetitionSection>) => {
    const previousId = preset.structure[index].id;
    const nextIdValue = value.id ?? previousId;
    onChange({
      structure: preset.structure.map((row, position) => position === index ? { ...row, ...value } : row),
      rubric: preset.rubric.map(row => ({ ...row, section_ids: row.section_ids.map(id => id === previousId ? nextIdValue : id) })),
    });
  };
  const remove = (index: number) => onChange({
    structure: preset.structure.filter((_, position) => position !== index),
    rubric: preset.rubric.map(row => ({ ...row, section_ids: row.section_ids.filter(id => id !== preset.structure[index].id) })),
  });
  return <section>
    <SectionHeading title={kk ? "Құжат құрылымы" : "Структура документа"} description={kk ? "Ретіне қарай ЖИ жұмыс бөлімдерін құрастырады, экспорт пен дайындық тексеруі осы құрылымды қолданады." : "ИИ создаёт разделы в этом порядке. Структура используется для экспорта и проверки готовности."} action={<button type="button" className={secondaryButton} onClick={() => onChange({ structure: [...preset.structure, { id: nextId("section", preset.structure.map(row => row.id)), label: { kk: "", ru: "" } }] })}>+ {kk ? "Бөлім қосу" : "Добавить раздел"}</button>} />
    {!preset.structure.length ? <EmptyRows message={kk ? "Осы жылғы ережеге сәйкес міндетті бөлімдерді қосыңыз." : "Добавьте обязательные разделы по правилам этого года."} /> : null}
    <div className="space-y-4">{preset.structure.map((row, index) => <article key={index} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{kk ? "Бөлім" : "Раздел"} {String(index + 1).padStart(2, "0")}</p><RowControls index={index} count={preset.structure.length} label={row.label[kk ? "kk" : "ru"] || row.id} kk={kk} onMove={direction => onChange({ structure: moveRow(preset.structure, index, direction) })} onRemove={() => remove(index)} /></div>
      <div className="space-y-4"><Field label={kk ? "Бөлім коды" : "Код раздела"}><input className={fieldClass} value={row.id} onChange={event => patch(index, { id: event.target.value })} /></Field><LocalizedField label={kk ? "Бөлім атауы" : "Название раздела"} value={row.label} onChange={label => patch(index, { label })} /></div>
    </article>)}</div>
  </section>;
}

export function RubricEditor({ preset, kk, onChange }: Props) {
  const patch = (index: number, value: Partial<CompetitionCriterion>) => onChange({ rubric: preset.rubric.map((row, position) => position === index ? { ...row, ...value } : row) });
  return <section>
    <SectionHeading title={kk ? "Ресми бағалау критерийлері" : "Официальные критерии оценки"} description={kk ? "ЖИ әр критерий бойынша толықтықты тексереді. Нұсқауларды ресми дереккөзге сүйеніп жазыңыз." : "ИИ проверяет полноту работы по каждому критерию. Формулируйте требования на основе официального источника."} action={<button type="button" className={secondaryButton} onClick={() => onChange({ rubric: [...preset.rubric, { id: nextId("criterion", preset.rubric.map(row => row.id)), label: { kk: "", ru: "" }, guidance: { kk: "", ru: "" }, section_ids: [] }] })}>+ {kk ? "Критерий қосу" : "Добавить критерий"}</button>} />
    {!preset.rubric.length ? <EmptyRows message={kk ? "Ресми ереженің бағалау критерийлерін қосыңыз." : "Добавьте критерии оценки из официальных правил."} /> : null}
    <div className="space-y-4">{preset.rubric.map((row, index) => <article key={index} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{kk ? "Критерий" : "Критерий"} {String(index + 1).padStart(2, "0")}</p><RowControls index={index} count={preset.rubric.length} label={row.label[kk ? "kk" : "ru"] || row.id} kk={kk} onMove={direction => onChange({ rubric: moveRow(preset.rubric, index, direction) })} onRemove={() => onChange({ rubric: preset.rubric.filter((_, position) => position !== index) })} /></div>
      <div className="space-y-4"><Field label={kk ? "Критерий коды" : "Код критерия"}><input className={fieldClass} value={row.id} onChange={event => patch(index, { id: event.target.value })} /></Field><LocalizedField label={kk ? "Критерий атауы" : "Название критерия"} value={row.label} onChange={label => patch(index, { label })} /><LocalizedField multiline label={kk ? "Нені тексеру керек" : "Что проверять в работе"} value={row.guidance} onChange={guidance => patch(index, { guidance })} />
        <fieldset className="border-t border-slate-100 pt-3"><legend className="text-sm font-semibold text-slate-700">{kk ? "Құжат бөлімдері" : "Связанные разделы"}</legend><div className="mt-2 flex flex-wrap gap-2">{preset.structure.map(section => <label key={section.id} className={`flex min-h-9 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${row.section_ids.includes(section.id) ? "border-teal-300 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-600"}`}><input type="checkbox" className="h-4 w-4 accent-teal-700" checked={row.section_ids.includes(section.id)} onChange={() => patch(index, { section_ids: toggleValue(row.section_ids, section.id) })} />{section.label[kk ? "kk" : "ru"] || section.id}</label>)}{!preset.structure.length ? <p className="text-xs text-slate-500">{kk ? "Алдымен құжат бөлімдерін қосыңыз." : "Сначала добавьте разделы документа."}</p> : null}</div></fieldset>
      </div>
    </article>)}</div>
  </section>;
}
