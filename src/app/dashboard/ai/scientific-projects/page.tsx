"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "../../../../i18n/LanguageContext";
import {
  createProjectPlan,
  CreatePlanPayload,
  InsufficientTokensError,
} from "../../../../lib/api";
import { useTokens } from "../../../../hooks/useTokens";
import { getErrorMessage } from "../../../../lib/error-utils";

export default function ScientificProjectPage() {
  const t = useTranslations();
  const router = useRouter();
  const { refreshBalance, costs, balance, checkBalance } = useTokens();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [topic, setTopic] = useState("");
  const [direction, setDirection] = useState("");
  const [grade, setGrade] = useState("");
  const [researchType, setResearchType] = useState<"тәжірибелік" | "теориялық">("тәжірибелік");
  const [subject, setSubject] = useState("");
  const [language, setLanguage] = useState<"ru" | "kz" | "en">("ru");
  const [schoolName, setSchoolName] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [city, setCity] = useState("");

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !direction || !grade || !subject) {
      setError(t.scientificProject.errors.required);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: CreatePlanPayload = {
        topic,
        direction,
        grade,
        research_type: researchType,
        subject,
        language,
        school_name: schoolName || undefined,
        supervisor: supervisor || undefined,
        city: city || undefined,
      };
      const res = await createProjectPlan(payload);
      refreshBalance();
      router.push(`/dashboard/ai/scientific-projects/${res.project_id}/plan`);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof InsufficientTokensError) {
        setError(
          `${t.tokens?.insufficient || "Недостаточно токенов"}. ${t.tokens?.required || "Требуется"}: ${err.required}, ${t.tokens?.available || "Доступно"}: ${err.available}`
        );
      } else {
        setError(getErrorMessage(err, t.scientificProject.errors.generic));
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-beige to-green-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">
          {t.scientificProject.form.title}
        </h1>

        <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
          <form onSubmit={handleCreatePlan} className="space-y-6">
              {/* Topic */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t.scientificProject.form.topic}
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  placeholder="Плесень на хлебе"
                  required
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {/* Direction */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.scientificProject.form.direction}
                  </label>
                  <input
                    type="text"
                    value={direction}
                    onChange={(e) => setDirection(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    placeholder="Биология"
                    required
                  />
                </div>

                {/* Grade */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.scientificProject.form.grade}
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    required
                  >
                    <option value="">--</option>
                    {[...Array(11)].map((_, i) => (
                      <option key={i} value={String(i + 1)}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Research Type */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t.scientificProject.form.researchType}
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { val: "тәжірибелік" as const, label: t.scientificProject.form.experimental },
                    { val: "теориялық" as const, label: t.scientificProject.form.theoretical },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                        researchType === opt.val
                          ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5 ring-1 ring-[color:var(--primary)]"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="researchType"
                          value={opt.val}
                          checked={researchType === opt.val}
                          onChange={(e) => setResearchType(e.target.value as "тәжірибелік" | "теориялық")}
                          className="h-4 w-4 text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                        />
                        <span className="text-sm font-medium text-slate-900">{opt.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t.scientificProject.form.subject}
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  placeholder="Биология"
                  required
                />
              </div>

              {/* Optional Fields */}
              <div className="grid gap-6 sm:grid-cols-3">
                {/* School Name */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.scientificProject.form.schoolName}
                  </label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    placeholder={t.scientificProject.form.schoolNamePlaceholder}
                  />
                </div>

                {/* Supervisor */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.scientificProject.form.supervisor}
                  </label>
                  <input
                    type="text"
                    value={supervisor}
                    onChange={(e) => setSupervisor(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    placeholder={t.scientificProject.form.supervisorPlaceholder}
                  />
                </div>

                {/* City */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.scientificProject.form.city}
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    placeholder={t.scientificProject.form.cityPlaceholder}
                  />
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t.scientificProject.form.language}
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { val: "ru", label: "Русский" },
                    { val: "kz", label: "Қазақша" },
                    { val: "en", label: "English" },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                        language === opt.val
                          ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5 ring-1 ring-[color:var(--primary)]"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="language"
                          value={opt.val}
                          checked={language === opt.val}
                          onChange={(e) => setLanguage(e.target.value as typeof language)}
                          className="h-4 w-4 text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                        />
                        <span className="text-sm font-medium text-slate-900">{opt.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Cost Info */}
              {costs.sciproject_create_plan && (
                <div className={`rounded-2xl border px-4 py-3 ${
                  checkBalance("sciproject_create_plan")
                    ? "border-green-200 bg-green-50"
                    : "border-orange-200 bg-orange-50"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      {t.tokens?.cost || "Стоимость"}:
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {costs.sciproject_create_plan} {t.tokens?.balance || "токенов"}
                    </span>
                  </div>
                  {balance !== null && (
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-slate-600">
                        {t.tokens?.available || "Доступно"}: {balance}
                      </span>
                      {!checkBalance("sciproject_create_plan") && (
                        <span className="font-semibold text-orange-600">
                          {t.tokens?.insufficient || "Недостаточно токенов"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Create Plan Button */}
              <button
                type="submit"
                disabled={loading || (balance !== null && !checkBalance("sciproject_create_plan"))}
                className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] py-4 text-sm font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                    {t.scientificProject.wizard.step1}
                  </>
                ) : (
                  t.scientificProject.wizard.createPlan
                )}
              </button>
            </form>
          </div>
      </div>
    </div>
  );
}
