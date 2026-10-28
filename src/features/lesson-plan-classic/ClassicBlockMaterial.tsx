import type { LessonSubBlock } from "@/lib/api";
import { TextField, buttonClass } from "@/features/lesson-plan/Fields";

/** Keep structured materials separate from the teacher instructions when editing. */
export function ClassicBlockMaterial({ block, onChange, kk }: { block: LessonSubBlock; onChange: (patch: Partial<LessonSubBlock>) => void; kk: boolean }) {
  return <div className="mt-3 space-y-3">
    {block.free_text_content != null ? <TextField label={kk ? "Тапсырма материалы" : "Материал задания"} multiline value={block.free_text_content} onChange={(free_text_content) => onChange({ free_text_content })} /> : null}
    {block.quiz?.map((question, index) => <div key={index} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <TextField label={`${kk ? "Сұрақ" : "Вопрос"} ${index + 1}`} multiline value={question.text} onChange={(text) => onChange({ quiz: block.quiz?.map((item, i) => i !== index ? item : { ...item, text }) })} />
      <TextField label={kk ? "Жауап нұсқалары (әр жолға біреу)" : "Варианты ответа (по одному в строке)"} multiline value={question.options.join("\n")} onChange={(text) => onChange({ quiz: block.quiz?.map((item, i) => i !== index ? item : { ...item, options: text.split("\n") }) })} />
      <TextField label={kk ? "Дұрыс жауап" : "Правильный ответ"} value={question.correct} onChange={(correct) => onChange({ quiz: block.quiz?.map((item, i) => i !== index ? item : { ...item, correct }) })} />
    </div>)}
    {block.template_table ? <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <TextField label={kk ? "Кесте атауы" : "Название таблицы"} value={block.template_table.caption} onChange={(caption) => onChange({ template_table: { ...block.template_table!, caption } })} />
      <TextField label={kk ? "Баған атаулары (әр жолға біреу)" : "Названия столбцов (по одному в строке)"} multiline value={block.template_table.columns.join("\n")} onChange={(value) => {
        const columns = value.split("\n");
        onChange({ template_table: { ...block.template_table!, columns, rows: block.template_table!.rows.map((row) => Array.from({ length: columns.length }, (_, i) => row[i] ?? "")) } });
      }} />
      {block.template_table.rows.map((row, index) => <div key={index} className="space-y-2 rounded-lg border border-slate-200 bg-white p-2">
        {row.map((cell, column) => <TextField key={column} label={`${kk ? "Жол" : "Строка"} ${index + 1}: ${block.template_table!.columns[column] ?? column + 1}`} value={cell} onChange={(value) => onChange({ template_table: { ...block.template_table!, rows: block.template_table!.rows.map((item, i) => i !== index ? item : item.map((current, ci) => ci !== column ? current : value)) } })} />)}
      </div>)}
      <button type="button" className={buttonClass} onClick={() => onChange({ template_table: { ...block.template_table!, rows: [...block.template_table!.rows, block.template_table!.columns.map(() => "")] } })}>{kk ? "Жол қосу" : "Добавить строку"}</button>
    </div> : null}
    {block.task_objective ? <p className="whitespace-pre-wrap text-sm text-slate-600">{kk ? "Тапсырманың мақсаты" : "Цель задания"}: {block.task_objective}</p> : null}
    {block.interesting_fact ? <p className="whitespace-pre-wrap text-sm text-slate-600">{block.interesting_fact}</p> : null}
  </div>;
}
