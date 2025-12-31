"use client";

import { useState, FormEvent } from "react";
import { useTranslations } from "../../../../i18n/LanguageContext";
import {
  generateExam,
  exportExamDocx,
  type ExamGeneratePayload,
  type ExamGenerateResponse,
  type ExamTask,
  type WidgetType,
} from "../../../../lib/api";
import { LatexRenderer } from "../../../../components/LatexRenderer";

export default function ExamPage() {
  const t = useTranslations();
  
  // BJB/TJB exam generation page

  // Form state
  const [form, setForm] = useState<ExamGeneratePayload>({
    exam_type: "bjb",
    subject: "",
    grade: "",
    topic: "",
    learning_objectives: [""],
    total_score: 20,
    lang: "rus",
  });

  // Results state
  const [examProject, setExamProject] = useState<ExamGenerateResponse | null>(null);
  const [tasks, setTasks] = useState<ExamTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculate current total score
  const currentTotal = tasks.reduce((sum, task) => sum + task.grading.score, 0);
  const isValid = examProject ? currentTotal === examProject.meta.total_score : true;

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (
      !form.subject ||
      !form.grade ||
      !form.topic ||
      form.learning_objectives.filter((obj) => obj.trim()).length === 0
    ) {
      setError(t.exam.errors.required);
      return;
    }

    setLoading(true);
    try {
      const filteredObjectives = form.learning_objectives.filter((obj) => obj.trim());
      const response = await generateExam({
        ...form,
        learning_objectives: filteredObjectives,
      });
      setExamProject(response);
      setTasks(response.tasks);
    } catch (err: any) {
      setError(err.message || t.exam.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  const handleAddObjective = () => {
    setForm((prev) => ({
      ...prev,
      learning_objectives: [...prev.learning_objectives, ""],
    }));
  };

  const handleRemoveObjective = (index: number) => {
    if (form.learning_objectives.length === 1) return; // Keep at least one
    setForm((prev) => ({
      ...prev,
      learning_objectives: prev.learning_objectives.filter((_, i) => i !== index),
    }));
  };

  const handleObjectiveChange = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      learning_objectives: prev.learning_objectives.map((obj, i) =>
        i === index ? value : obj,
      ),
    }));
  };

  const handleScoreChange = (taskId: string, newScore: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, grading: { ...task.grading, score: newScore } } : task,
      ),
    );
  };

  const handleDescriptorChange = (taskId: string, newDescriptor: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, grading: { ...task.grading, descriptor: newDescriptor } }
          : task,
      ),
    );
  };

  const handleExport = async (version: "student" | "teacher") => {
    if (!examProject) return;

    try {
      const blob = await exportExamDocx({
        exam_project: { ...examProject, tasks },
        version,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${form.exam_type}_${form.subject}_${form.grade}_${version}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || t.exam.errors.generic);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-beige to-green-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">{t.exam.form.title}</h1>

        {/* Generation Form */}
        <div className="glass-card mb-6 rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
          <form className="space-y-6" onSubmit={handleGenerate}>
            {/* Exam Type */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {t.exam.form.examType}
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                    form.exam_type === "bjb"
                      ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5 ring-1 ring-[color:var(--primary)]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="exam_type"
                      value="bjb"
                      checked={form.exam_type === "bjb"}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, exam_type: e.target.value as "bjb" | "tjb" }))
                      }
                      className="h-4 w-4 text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                    />
                    <span className="text-sm font-medium text-slate-900">{t.exam.types.bjb}</span>
                  </div>
                </label>
                <label
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                    form.exam_type === "tjb"
                      ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5 ring-1 ring-[color:var(--primary)]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="exam_type"
                      value="tjb"
                      checked={form.exam_type === "tjb"}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, exam_type: e.target.value as "bjb" | "tjb" }))
                      }
                      className="h-4 w-4 text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                    />
                    <span className="text-sm font-medium text-slate-900">{t.exam.types.tjb}</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Subject, Grade, Topic, Total Score */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t.exam.form.subject}
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  placeholder={t.exam.form.subject}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t.exam.form.grade}
                </label>
                <select
                  value={form.grade}
                  onChange={(e) => setForm((prev) => ({ ...prev, grade: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                >
                  <option value="">--</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i} value={String(i + 1)}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t.exam.form.topic}
                </label>
                <input
                  type="text"
                  value={form.topic}
                  onChange={(e) => setForm((prev) => ({ ...prev, topic: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  placeholder={t.exam.form.topic}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t.exam.form.totalScore}
                </label>
                <input
                  type="number"
                  value={form.total_score}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, total_score: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  min="1"
                />
              </div>
            </div>

            {/* Learning Objectives */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {t.exam.form.learningObjectives}
              </label>
              <div className="space-y-3">
                {form.learning_objectives.map((obj, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={obj}
                      onChange={(e) => handleObjectiveChange(index, e.target.value)}
                      className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                      placeholder={`${t.exam.form.learningObjectives} ${index + 1}`}
                    />
                    {form.learning_objectives.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveObjective(index)}
                        className="rounded-xl bg-red-50 px-4 text-red-600 hover:bg-red-100"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddObjective}
                  className="flex items-center gap-2 rounded-xl border border-dashed border-[color:var(--primary)] bg-[color:var(--primary)]/5 px-4 py-2 text-sm font-semibold text-[color:var(--primary)] hover:bg-[color:var(--primary)]/10"
                >
                  + {t.exam.form.addObjective}
                </button>
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {t.exam.form.language}
              </label>
              <div className="flex gap-4">
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                    form.lang === "rus"
                      ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5 ring-1 ring-[color:var(--primary)]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="lang"
                    value="rus"
                    checked={form.lang === "rus"}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, lang: e.target.value as "rus" | "kaz" }))
                    }
                    className="h-4 w-4 text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                  />
                  <span className="text-sm font-medium text-slate-900">Русский</span>
                </label>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                    form.lang === "kaz"
                      ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5 ring-1 ring-[color:var(--primary)]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="lang"
                    value="kaz"
                    checked={form.lang === "kaz"}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, lang: e.target.value as "rus" | "kaz" }))
                    }
                    className="h-4 w-4 text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                  />
                  <span className="text-sm font-medium text-slate-900">Қазақша</span>
                </label>
              </div>
            </div>

            {/* Error */}
            {error && !loading && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] py-4 text-sm font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                  {t.exam.loading}
                </>
              ) : (
                t.exam.form.generate
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {examProject && tasks.length > 0 && (
          <div className="animate-fade-in space-y-6">
            {/* Score Indicator */}
            <div
              className={`glass-card rounded-2xl border px-6 py-4 ${
                isValid
                  ? "border-green-400 bg-green-50"
                  : "border-red-400 bg-red-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  {t.exam.results.scoreIndicator}:
                </span>
                <span
                  className={`text-2xl font-bold ${
                    isValid ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {currentTotal} / {examProject.meta.total_score}{" "}
                  {isValid ? t.exam.results.valid : t.exam.results.invalid}
                </span>
              </div>
              {!isValid && (
                <p className="mt-2 text-sm text-red-700">{t.exam.results.warning}</p>
              )}
            </div>

            {/* Tasks */}
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                t={t}
                onScoreChange={handleScoreChange}
                onDescriptorChange={handleDescriptorChange}
              />
            ))}

            {/* Export Buttons */}
            <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md">
              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={() => handleExport("student")}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-6 py-3 font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
                >
                  {t.exam.results.exportStudent}
                </button>
                <button
                  onClick={() => handleExport("teacher")}
                  className="flex-1 rounded-2xl bg-white px-6 py-3 font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                >
                  {t.exam.results.exportTeacher}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// TaskCard Component
type TaskCardProps = {
  task: ExamTask;
  index: number;
  t: any;
  onScoreChange: (taskId: string, newScore: number) => void;
  onDescriptorChange: (taskId: string, newDescriptor: string) => void;
};

function TaskCard({ task, index, t, onScoreChange, onDescriptorChange }: TaskCardProps) {
  const widgetTypeLabel = {
    multiple_choice: t.exam.widgets.multipleChoice,
    matching: t.exam.widgets.matching,
    true_false: t.exam.widgets.trueFalse,
    text_open: t.exam.widgets.textOpen,
  }[task.widget_type];

  return (
    <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">
          {t.exam.results.taskNumber} {index + 1}
        </h3>
        <span className="rounded-full bg-[color:var(--primary)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--primary)]">
          {widgetTypeLabel}
        </span>
      </div>

      {/* Task Content */}
      <div className="mb-6 space-y-3 rounded-2xl bg-white/50 p-4">
        <TaskContent task={task} t={t} />
      </div>

      {/* Score and Descriptor */}
      <div className="grid gap-6 border-t border-slate-200 pt-6 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            {t.exam.results.score}
          </label>
          <input
            type="number"
            value={task.grading.score}
            onChange={(e) => onScoreChange(task.id, parseInt(e.target.value) || 0)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
            min="0"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            {t.exam.results.descriptor}
          </label>
          <textarea
            value={task.grading.descriptor}
            onChange={(e) => onDescriptorChange(task.id, e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}

// TaskContent Component (No changes needed to structure, just rendering)
type TaskContentProps = {
  task: ExamTask;
  t: any;
};

function TaskContent({ task, t }: TaskContentProps) {
  const { widget_type, content } = task;

  if (widget_type === "multiple_choice") {
    return (
      <>
        {content.question && (
          <div>
            <div className="font-semibold text-slate-700">Вопрос:</div>
            <div className="mt-1">
              <LatexRenderer text={content.question} />
            </div>
          </div>
        )}
        {content.options && content.options.length > 0 && (
          <div className="mt-2">
            <div className="font-semibold text-slate-700">Варианты:</div>
            <ul className="mt-1 list-inside list-disc space-y-1 pl-2">
              {content.options.map((option, idx) => (
                <li key={idx}>
                  <LatexRenderer text={option} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  }

  if (widget_type === "matching") {
    return (
      <>
        {content.instruction && (
          <div>
            <div className="font-semibold text-slate-700">Инструкция:</div>
            <div className="mt-1">
              <LatexRenderer text={content.instruction} />
            </div>
          </div>
        )}
        {content.pairs && content.pairs.length > 0 && (
          <div className="mt-2">
            <div className="font-semibold text-slate-700">Пары:</div>
            <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border-b border-r border-slate-200 px-4 py-2 text-left text-xs font-semibold text-slate-600">Левая колонка</th>
                    <th className="border-b border-slate-200 px-4 py-2 text-left text-xs font-semibold text-slate-600">Правая колонка</th>
                  </tr>
                </thead>
                <tbody>
                  {content.pairs.map((pair, idx) => (
                    <tr key={idx} className="even:bg-slate-50/50">
                      <td className="border-r border-slate-200 px-4 py-2 text-sm text-slate-800">
                        <LatexRenderer text={pair.left} />
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-800">
                        <LatexRenderer text={pair.right} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>
    );
  }

  if (widget_type === "true_false") {
    return (
      <>
        {content.statement && (
          <div>
            <div className="font-semibold text-slate-700">Утверждение:</div>
            <div className="mt-1">
              <LatexRenderer text={content.statement} />
            </div>
          </div>
        )}
        <div className="mt-2 text-sm italic text-slate-600">Верно / Неверно</div>
      </>
    );
  }

  if (widget_type === "text_open") {
    return (
      <>
        {content.question && (
          <div>
            <div className="font-semibold text-slate-700">Вопрос:</div>
            <div className="mt-1">
              <LatexRenderer text={content.question} />
            </div>
          </div>
        )}
        {content.image_placeholder_prompt && (
          <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm">
            <div className="font-semibold text-slate-600">{t.exam.results.imagePlaceholder}</div>
            <div className="mt-1 text-slate-500">{content.image_placeholder_prompt}</div>
          </div>
        )}
      </>
    );
  }

  return null;
}
