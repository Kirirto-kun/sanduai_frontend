"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useLanguage, useTranslations } from "../../../../../../i18n/LanguageContext";
import {
  enqueueAllProjectSections,
  getProjectStatus,
  type DraftPlanResponse,
  type ProjectState,
  updateScienceProjectPlan,
} from "../../../../../../lib/api";
import { useTeacherErrorMessage } from "@/hooks/useTeacherErrorMessage";

import {
  applyScienceProjectPlanEdit,
  type SciencePlanEditableField,
} from "./plan-utils";

type EditablePlanFieldProps = {
  field: SciencePlanEditableField;
  label: string;
  value: string | string[];
  editing: SciencePlanEditableField | null;
  editValue: string;
  disabled: boolean;
  list?: boolean;
  multiline?: boolean;
  editLabel: string;
  saveLabel: string;
  cancelLabel: string;
  listPlaceholder: string;
  onStartEdit: (field: SciencePlanEditableField, value: string | string[]) => void;
  onEditValueChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

function EditablePlanField({
  field,
  label,
  value,
  editing,
  editValue,
  disabled,
  list = false,
  multiline = false,
  editLabel,
  saveLabel,
  cancelLabel,
  listPlaceholder,
  onStartEdit,
  onEditValueChange,
  onSave,
  onCancel,
}: EditablePlanFieldProps) {
  const isEditing = editing === field;
  const values = Array.isArray(value) ? value : null;

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-slate-700">{label}</h2>
      {isEditing ? (
        <div className="space-y-2 rounded-xl border border-[color:var(--primary)]/30 bg-white p-4">
          {multiline || list ? (
            <textarea
              autoFocus
              value={editValue}
              onChange={(event) => onEditValueChange(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)]/20"
              rows={list ? 4 : 3}
              placeholder={list ? listPlaceholder : undefined}
              disabled={disabled}
            />
          ) : (
            <input
              autoFocus
              type="text"
              value={editValue}
              onChange={(event) => onEditValueChange(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)]/20"
              disabled={disabled}
            />
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={disabled}
              className="rounded-lg bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saveLabel}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={disabled}
              className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4 rounded-xl bg-white p-4">
          {values ? (
            values.length > 0 ? (
              <ul className="min-w-0 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-800">
                {values.map((item, index) => (
                  <li key={`${field}-${index}`}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">—</p>
            )
          ) : (
            <p className="min-w-0 whitespace-pre-wrap text-sm leading-6 text-slate-800">{value || "—"}</p>
          )}
          <button
            type="button"
            onClick={() => onStartEdit(field, value)}
            disabled={disabled || editing !== null}
            className="shrink-0 text-xs font-semibold text-[color:var(--primary)] disabled:opacity-50"
          >
            {editLabel}
          </button>
        </div>
      )}
    </section>
  );
}

export default function PlanReviewPage() {
  const t = useTranslations();
  const { language } = useLanguage();
  const toTeacherErrorMessage = useTeacherErrorMessage();
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submissionStarted = useRef(false);
  const [plan, setPlan] = useState<DraftPlanResponse | null>(null);
  const [editing, setEditing] = useState<SciencePlanEditableField | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    let active = true;

    const loadPlan = async () => {
      setInitialLoading(true);
      setInitialError(null);
      try {
        const state: ProjectState = await getProjectStatus(projectId);
        if (active) setPlan(state.plan);
      } catch (error: unknown) {
        if (active) setInitialError(toTeacherErrorMessage(error));
      } finally {
        if (active) setInitialLoading(false);
      }
    };

    void loadPlan();
    return () => {
      active = false;
    };
  }, [loadAttempt, projectId, toTeacherErrorMessage]);

  const handleEdit = (field: SciencePlanEditableField, currentValue: string | string[]) => {
    setEditing(field);
    setEditValue(Array.isArray(currentValue) ? currentValue.join("\n") : currentValue);
    setActionError(null);
  };

  const handleSave = () => {
    if (!plan || !editing) return;
    setPlan(applyScienceProjectPlanEdit(plan, editing, editValue));
    setEditing(null);
    setEditValue("");
  };

  const handleCancel = () => {
    setEditing(null);
    setEditValue("");
  };

  const handleApproveAndGenerate = async () => {
    if (!plan || submissionStarted.current) return;

    const approvedPlan = editing
      ? applyScienceProjectPlanEdit(plan, editing, editValue)
      : plan;

    if (editing) {
      setPlan(approvedPlan);
      setEditing(null);
      setEditValue("");
    }

    submissionStarted.current = true;
    setSubmitting(true);
    setActionError(null);
    try {
      const saved = await updateScienceProjectPlan(projectId, approvedPlan);
      const createdJob = await enqueueAllProjectSections({
        project_id: projectId,
        approved_plan: saved.plan,
      });
      router.push(
        `/dashboard/ai/scientific-projects/${encodeURIComponent(projectId)}/generate?job=${encodeURIComponent(createdJob.id)}`,
      );
    } catch (error: unknown) {
      setActionError(toTeacherErrorMessage(error, t.scientificProject.errors.generic));
      setSubmitting(false);
      submissionStarted.current = false;
    }
  };

  if (initialLoading && !plan) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--primary)] border-r-transparent" />
        <span className="sr-only">{language === "kk" ? "Жоспар жүктелуде" : "План загружается"}</span>
      </div>
    );
  }

  if (initialError || !plan) {
    return (
      <div className="min-h-screen p-4">
        <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <p>{initialError || (language === "kk" ? "Жоспар табылмады" : "План не найден")}</p>
          <button
            type="button"
            onClick={() => setLoadAttempt((attempt) => attempt + 1)}
            className="mt-3 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            {language === "kk" ? "Қайта көру" : "Повторить"}
          </button>
        </div>
      </div>
    );
  }

  const labels = t.scientificProject.plan;
  const commonFieldProps = {
    editing,
    editValue,
    disabled: submitting,
    editLabel: labels.edit,
    saveLabel: labels.save,
    cancelLabel: t.scientificProject.results.cancel,
    listPlaceholder:
      language === "kk" ? "Әр тармақты жаңа жолдан жазыңыз" : "Каждый пункт с новой строки",
    onStartEdit: handleEdit,
    onEditValueChange: setEditValue,
    onSave: handleSave,
    onCancel: handleCancel,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-beige to-green-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">{t.scientificProject.wizard.step2}</h1>
        <p className="mb-6 text-sm text-slate-600">
          {language === "kk"
            ? "Жоспардың барлық бөлімін тексеріп, қажет болса түзетіңіз."
            : "Проверьте все разделы плана и при необходимости исправьте их."}
        </p>

        <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md">
          <div className="grid gap-6 md:grid-cols-2">
            <EditablePlanField field="hypothesis" label={labels.hypothesis} value={plan.hypothesis} multiline {...commonFieldProps} />
            <EditablePlanField field="object" label={labels.object} value={plan.object} multiline {...commonFieldProps} />
            <EditablePlanField field="subject_field" label={labels.subjectField} value={plan.subject_field} multiline {...commonFieldProps} />
            <EditablePlanField field="methods" label={labels.methods} value={plan.methods} list {...commonFieldProps} />
            <EditablePlanField field="scientific_novelty" label={labels.scientificNovelty} value={plan.scientific_novelty} multiline {...commonFieldProps} />
            <EditablePlanField field="practical_significance" label={labels.practicalSignificance} value={plan.practical_significance} multiline {...commonFieldProps} />
          </div>

          <div className="my-8 border-t border-slate-200" />

          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <EditablePlanField field="chapter_1_title" label={labels.chapter1Title} value={plan.structure.chapter_1_title} {...commonFieldProps} />
              <EditablePlanField field="chapter_2_title" label={labels.chapter2Title} value={plan.structure.chapter_2_title} {...commonFieldProps} />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <EditablePlanField field="chapter_1_subsections" label={labels.chapter1Subsections} value={plan.structure.chapter_1_subsections} list {...commonFieldProps} />
              <EditablePlanField field="chapter_2_subsections" label={labels.chapter2Subsections} value={plan.structure.chapter_2_subsections} list {...commonFieldProps} />
            </div>
          </div>

          {actionError ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
              <p>{actionError}</p>
              <button
                type="button"
                onClick={() => void handleApproveAndGenerate()}
                disabled={submitting}
                className="mt-3 rounded-lg bg-slate-950 px-4 py-2 font-semibold text-white disabled:opacity-50"
              >
                {language === "kk" ? "Қайта көру" : "Повторить"}
              </button>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => void handleApproveAndGenerate()}
            disabled={submitting}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] py-4 text-sm font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" aria-hidden="true" />
                {language === "kk" ? "Сақталуда…" : "Сохраняем…"}
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
