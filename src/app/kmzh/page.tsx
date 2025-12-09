"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import {
  KmzhDocxPayload,
  KmzhLesson,
  KmzhGeneratePayload,
  downloadKmzhDocx,
  generateKmzh,
} from "../../lib/api";
import { useTranslations } from "../../i18n/LanguageContext";

const emptyLesson: KmzhLesson = {
  lesson_topic: "",
  learning_objective: "",
  hours: 1,
  date: "",
  adal_azamat_value: "",
};

export default function KmzhPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const t = useTranslations();

  const [form, setForm] = useState<KmzhGeneratePayload>({
    subject: "",
    grade: "",
    period: "",
    hours_total: 0,
    teacher_name: "",
    user_input: "",
  });
  const [lessons, setLessons] = useState<KmzhLesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = useMemo(
    () =>
      form.subject.trim() &&
      form.grade.trim() &&
      form.period.trim() &&
      form.teacher_name.trim() &&
      form.hours_total > 0,
    [form],
  );

  const onGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError(t.kmzh.errors.auth);
      router.push("/login");
      return;
    }
    if (!canGenerate) {
      setError(t.kmzh.errors.required);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await generateKmzh(form);
      setLessons(data.lessons ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.kmzh.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  const onDownload = async () => {
    if (!lessons.length) {
      setError(t.kmzh.errors.required);
      return;
    }
    const payload: KmzhDocxPayload = {
      subject: form.subject,
      grade: form.grade,
      period: form.period,
      teacher_name: form.teacher_name,
      lessons,
    };
    setError(null);
    setLoading(true);
    try {
      const blob = await downloadKmzhDocx(payload);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "kmzh.docx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.kmzh.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  const updateLesson = (idx: number, patch: Partial<KmzhLesson>) => {
    setLessons((prev) =>
      prev.map((lesson, i) => (i === idx ? { ...lesson, ...patch } : lesson)),
    );
  };

  const addLesson = () => setLessons((prev) => [...prev, { ...emptyLesson }]);
  const removeLesson = (idx: number) =>
    setLessons((prev) => prev.filter((_, i) => i !== idx));

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fff7ed,_#fdfbf7_40%,_#f5e6d3_80%)]">
      <div className="section-container py-12 sm:py-16 space-y-8">
        <div className="glass-card rounded-3xl border border-white/60 px-6 py-8 shadow-xl sm:px-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900">
              {t.kmzh.title}
            </h1>
            <p className="text-sm text-slate-600">{t.kmzh.subtitle}</p>
          </div>

          <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={onGenerate}>
            <InputField
              label={t.kmzh.form.subject}
              value={form.subject}
              onChange={(v) => setForm((f) => ({ ...f, subject: v }))}
              placeholder="Қазақ әдебиеті"
            />
            <InputField
              label={t.kmzh.form.grade}
              value={form.grade}
              onChange={(v) => setForm((f) => ({ ...f, grade: v }))}
              placeholder="7 сынып"
            />
            <InputField
              label={t.kmzh.form.period}
              value={form.period}
              onChange={(v) => setForm((f) => ({ ...f, period: v }))}
              placeholder="3-тоқсан"
            />
            <InputField
              label={t.kmzh.form.hoursTotal}
              value={String(form.hours_total || "")}
              type="number"
              min={1}
              onChange={(v) =>
                setForm((f) => ({ ...f, hours_total: Number(v) || 0 }))
              }
              placeholder="20"
            />
            <InputField
              label={t.kmzh.form.teacherName}
              value={form.teacher_name}
              onChange={(v) => setForm((f) => ({ ...f, teacher_name: v }))}
              placeholder="Айгүл Омарова"
              className="sm:col-span-2"
            />
            <TextAreaField
              label={t.kmzh.form.userInput}
              value={form.user_input}
              onChange={(v) => setForm((f) => ({ ...f, user_input: v }))}
              placeholder="Темы: Абай Құнанбаев, Ескендір поэмасы"
              className="sm:col-span-2"
            />

            {error && (
              <div className="sm:col-span-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:shadow-xl hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? t.kmzh.loading : t.kmzh.form.generate}
              </button>
            </div>
          </form>
        </div>

        <div className="glass-card rounded-3xl border border-white/60 px-6 py-8 shadow-xl sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {t.kmzh.lessonsTitle}
              </h2>
            </div>
            <button
              type="button"
              onClick={addLesson}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[color:var(--primary)] hover:text-[color:var(--primary)]"
            >
              {t.kmzh.addLesson}
            </button>
          </div>

          {!lessons.length ? (
            <p className="mt-4 text-sm text-slate-600">{t.kmzh.noLessons}</p>
          ) : (
            <div className="mt-4 space-y-3">
              {lessons.map((lesson, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeLesson(idx)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <InputField
                      label="Тақырып / Тема"
                      value={lesson.lesson_topic}
                      onChange={(v) =>
                        updateLesson(idx, { lesson_topic: v })
                      }
                      placeholder="Абай Құнанбаев: өмірі"
                    />
                    <InputField
                      label="Оқу мақсаты / Learning objective"
                      value={lesson.learning_objective}
                      onChange={(v) =>
                        updateLesson(idx, { learning_objective: v })
                      }
                      placeholder="7.1.2.1 - Автордың өмірбаяны"
                    />
                    <InputField
                      label="Сағат / Hours"
                      type="number"
                      min={1}
                      value={String(lesson.hours ?? "")}
                      onChange={(v) =>
                        updateLesson(idx, { hours: Number(v) || 0 })
                      }
                      placeholder="2"
                    />
                    <InputField
                      label="Күні / Date"
                      type="date"
                      value={lesson.date}
                      onChange={(v) => updateLesson(idx, { date: v })}
                      placeholder="2025-01-15"
                    />
                    <InputField
                      label="Құндылық / Value"
                      value={lesson.adal_azamat_value}
                      onChange={(v) =>
                        updateLesson(idx, { adal_azamat_value: v })
                      }
                      placeholder="Білімге құштарлық"
                      className="sm:col-span-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onDownload}
              disabled={loading || !lessons.length}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {t.kmzh.downloadDocx}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
  min,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  min?: number;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-700">{label}</label>
      <input
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
        placeholder={placeholder}
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-700">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
        placeholder={placeholder}
        rows={3}
      />
    </div>
  );
}


