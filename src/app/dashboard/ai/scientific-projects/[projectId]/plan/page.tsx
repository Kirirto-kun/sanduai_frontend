"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "../../../../../../i18n/LanguageContext";
import {
  getProjectStatus,
  DraftPlanResponse,
  ProjectState,
} from "../../../../../../lib/api";

export default function PlanReviewPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<DraftPlanResponse | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    loadPlan();
  }, [projectId]);

  const loadPlan = async () => {
    try {
      const state: ProjectState = await getProjectStatus(projectId);
      setPlan(state.plan);
    } catch (err: any) {
      setError(err.message || "Ошибка загрузки плана");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field: string, currentValue: any) => {
    setEditing(field);
    if (typeof currentValue === "string") {
      setEditValue(currentValue);
    } else if (Array.isArray(currentValue)) {
      setEditValue(currentValue.join("\n"));
    } else {
      setEditValue(JSON.stringify(currentValue, null, 2));
    }
  };

  const handleSave = () => {
    if (!plan || !editing) return;

    const updatedPlan = { ...plan };
    if (editing === "hypothesis") {
      updatedPlan.hypothesis = editValue;
    } else if (editing === "object") {
      updatedPlan.object = editValue;
    } else if (editing === "subject_field") {
      updatedPlan.subject_field = editValue;
    } else if (editing === "methods") {
      updatedPlan.methods = editValue.split("\n").filter((m) => m.trim());
    } else if (editing === "chapter_1_title") {
      updatedPlan.structure.chapter_1_title = editValue;
    } else if (editing === "chapter_1_subsections") {
      updatedPlan.structure.chapter_1_subsections = editValue
        .split("\n")
        .filter((s) => s.trim());
    } else if (editing === "chapter_2_title") {
      updatedPlan.structure.chapter_2_title = editValue;
    } else if (editing === "chapter_2_subsections") {
      updatedPlan.structure.chapter_2_subsections = editValue
        .split("\n")
        .filter((s) => s.trim());
    } else if (editing === "scientific_novelty") {
      updatedPlan.scientific_novelty = editValue;
    } else if (editing === "practical_significance") {
      updatedPlan.practical_significance = editValue;
    }

    setPlan(updatedPlan);
    setEditing(null);
    setEditValue("");
  };

  const handleApproveAndGenerate = async () => {
    if (!plan) return;

    setLoading(true);
    try {
      // Start generating sections sequentially
      router.push(`/dashboard/ai/scientific-projects/${projectId}/generate`);
    } catch (err: any) {
      setError(err.message || "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !plan) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--primary)] border-r-transparent" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen p-4">
        <div className="rounded-xl bg-red-50 p-4 text-red-600">{error || "План не найден"}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-beige to-green-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">
          {t.scientificProject.wizard.step2}
        </h1>

        <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md">
          <div className="mb-6 space-y-6">
            {/* Hypothesis */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {t.scientificProject.plan.hypothesis}
              </label>
              {editing === "hypothesis" ? (
                <div className="space-y-2">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="rounded-lg bg-[color:var(--primary)] px-4 py-2 text-sm text-white"
                    >
                      {t.scientificProject.plan.save}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(null);
                        setEditValue("");
                      }}
                      className="rounded-lg bg-slate-200 px-4 py-2 text-sm"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between rounded-xl bg-white p-4">
                  <p className="text-sm text-slate-800">{plan.hypothesis}</p>
                  <button
                    onClick={() => handleEdit("hypothesis", plan.hypothesis)}
                    className="ml-4 text-xs text-[color:var(--primary)]"
                  >
                    {t.scientificProject.plan.edit}
                  </button>
                </div>
              )}
            </div>

            {/* Object */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {t.scientificProject.plan.object}
              </label>
              {editing === "object" ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSave} className="rounded-lg bg-[color:var(--primary)] px-4 py-2 text-sm text-white">
                      {t.scientificProject.plan.save}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(null);
                        setEditValue("");
                      }}
                      className="rounded-lg bg-slate-200 px-4 py-2 text-sm"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between rounded-xl bg-white p-4">
                  <p className="text-sm text-slate-800">{plan.object}</p>
                  <button
                    onClick={() => handleEdit("object", plan.object)}
                    className="ml-4 text-xs text-[color:var(--primary)]"
                  >
                    {t.scientificProject.plan.edit}
                  </button>
                </div>
              )}
            </div>

            {/* Methods */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {t.scientificProject.plan.methods}
              </label>
              {editing === "methods" ? (
                <div className="space-y-2">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                    rows={3}
                    placeholder="Каждый метод на новой строке"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSave} className="rounded-lg bg-[color:var(--primary)] px-4 py-2 text-sm text-white">
                      {t.scientificProject.plan.save}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(null);
                        setEditValue("");
                      }}
                      className="rounded-lg bg-slate-200 px-4 py-2 text-sm"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between rounded-xl bg-white p-4">
                  <ul className="list-disc pl-5 text-sm text-slate-800">
                    {plan.methods.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleEdit("methods", plan.methods)}
                    className="ml-4 text-xs text-[color:var(--primary)]"
                  >
                    {t.scientificProject.plan.edit}
                  </button>
                </div>
              )}
            </div>

            {/* Chapter 1 */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {t.scientificProject.plan.chapter1Title}
              </label>
              {editing === "chapter_1_title" ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSave} className="rounded-lg bg-[color:var(--primary)] px-4 py-2 text-sm text-white">
                      {t.scientificProject.plan.save}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(null);
                        setEditValue("");
                      }}
                      className="rounded-lg bg-slate-200 px-4 py-2 text-sm"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between rounded-xl bg-white p-4">
                  <p className="text-sm text-slate-800">{plan.structure.chapter_1_title}</p>
                  <button
                    onClick={() => handleEdit("chapter_1_title", plan.structure.chapter_1_title)}
                    className="ml-4 text-xs text-[color:var(--primary)]"
                  >
                    {t.scientificProject.plan.edit}
                  </button>
                </div>
              )}
            </div>

            {/* Chapter 2 */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {t.scientificProject.plan.chapter2Title}
              </label>
              {editing === "chapter_2_title" ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSave} className="rounded-lg bg-[color:var(--primary)] px-4 py-2 text-sm text-white">
                      {t.scientificProject.plan.save}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(null);
                        setEditValue("");
                      }}
                      className="rounded-lg bg-slate-200 px-4 py-2 text-sm"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between rounded-xl bg-white p-4">
                  <p className="text-sm text-slate-800">{plan.structure.chapter_2_title}</p>
                  <button
                    onClick={() => handleEdit("chapter_2_title", plan.structure.chapter_2_title)}
                    className="ml-4 text-xs text-[color:var(--primary)]"
                  >
                    {t.scientificProject.plan.edit}
                  </button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>
          )}

          <button
            onClick={handleApproveAndGenerate}
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] py-4 text-sm font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                Загрузка...
              </>
            ) : (
              t.scientificProject.wizard.approvePlan
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
