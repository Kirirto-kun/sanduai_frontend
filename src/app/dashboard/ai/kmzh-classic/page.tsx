"use client";

import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

import { ModuleGenerationHistory } from "../../../../components/generations/ModuleGenerationHistory";
import { useLanguage, useTranslations } from "../../../../i18n/LanguageContext";
import {
  enqueueGenerationJob,
  exportLessonPlanDocx,
  getGenerationJob,
  type LessonPlanLanguage,
  type LessonSubBlock,
  type NeuroExercise,
  InsufficientTokensError,
} from "../../../../lib/api";
import {
  generationJobIdFromSearchParam,
  generationServerStatusCopy,
  isAcknowledgedGenerationJob,
  isActiveGenerationJob,
  isUnavailableGenerationJobError,
} from "../../../../lib/generation-history";
import { useTokens } from "../../../../hooks/useTokens";
import { errorMessageIncludes } from "../../../../lib/error-utils";
import { useTeacherErrorMessage } from "@/hooks/useTeacherErrorMessage";
import { tryNormalizeContentLanguage } from "@/lib/content-languages";
import { generatedContentCopy } from "@/lib/generated-content-copy";
import { PlannerVersions } from "@/features/lesson-plan/PlannerVersions";
import { lessonImageUploadError } from "@/features/lesson-plan/image-upload";
import { canonicalWorkType, workTypeOptions } from "@/features/lesson-plan/editor-labels";
import { ClassicBlockMaterial } from "@/features/lesson-plan-classic/ClassicBlockMaterial";
import { CLASSIC_LESSON_KIND, CLASSIC_LESSON_KINDS, CLASSIC_LESSON_PATH, createClassicLessonDraft, editableClassicLesson, isClassicLessonResult, updateClassicLessonBlock, classicLessonExportPayload, type ClassicLessonRequest, type ClassicLessonPlan } from "@/features/lesson-plan-classic/model";

function LessonPlanContent() {
  const t = useTranslations();
  const { language } = useLanguage();
  const toTeacherErrorMessage = useTeacherErrorMessage();
  const { costs, balance, checkBalance, refreshBalance } = useTokens();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const requestedJobId = generationJobIdFromSearchParam(searchParams.get("job"));
  const [sessionJobId, setSessionJobId] = useState<string | null>(null);
  const currentJobId = requestedJobId ?? sessionJobId;
  const loadedJobId = useRef<string | null>(null);

  // Helper function to safely render neuro_exercise
  const renderNeuroExercise = (neuroExercise: NeuroExercise): string => {
    if (!neuroExercise) return "";
    if (typeof neuroExercise === "string") return neuroExercise;
    if (typeof neuroExercise === "object" && neuroExercise.name) {
      return neuroExercise.description
        ? `${neuroExercise.name}: ${neuroExercise.description}`
        : neuroExercise.name;
    }
    return "";
  };

  // Helper to safely convert any value to string
  const safeString = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      // If it's an object with name, return name
      if (typeof record.name === "string") return record.name;
      // Otherwise try to stringify
      return JSON.stringify(value);
    }
    return String(value);
  };

  // Form state
  const [formData, setFormData] = useState<ClassicLessonRequest>(createClassicLessonDraft);

  // Lesson plan state
  const [lessonPlan, setLessonPlan] = useState<ClassicLessonPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string>("");
  const resultCopy = generatedContentCopy(
    tryNormalizeContentLanguage(lessonPlan?.language ?? formData.language) ?? "kk",
  ).lessonPlan;
  const job = useQuery({
    queryKey: ["generation-job", currentJobId],
    queryFn: () => getGenerationJob(currentJobId as string),
    enabled: Boolean(currentJobId),
    retry: (failureCount, requestError) =>
      !isUnavailableGenerationJobError(requestError) && failureCount < 2,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const value = query.state.data;
      return value && isActiveGenerationJob(value) ? 2_000 : false;
    },
  });

  useEffect(() => {
    if (!currentJobId || loadedJobId.current === currentJobId) return;
    setLessonPlan(null);
    setError("");
  }, [currentJobId]);

  useEffect(() => {
    const value = job.data;
    if (!value || loadedJobId.current === value.id) return;
    if (!CLASSIC_LESSON_KINDS.includes(value.kind as typeof CLASSIC_LESSON_KINDS[number])) {
      loadedJobId.current = value.id;
      setLessonPlan(null);
      setError(
        language === "kk"
          ? "Бұл сілтеме ҚМЖ материалына жатпайды."
          : "Эта ссылка ведёт не на материал КМЖ.",
      );
      return;
    }
    if ((value.status === "completed" || value.status === "billing_error") && value.result) {
      loadedJobId.current = value.id;
      if (typeof value.result === "object" && "planner_version" in value.result && value.result.planner_version === "open_lesson_v1") {
        router.replace(`/dashboard/ai/kmzh?job=${encodeURIComponent(value.id)}`, { scroll: false });
        return;
      }
      try {
        if (!isClassicLessonResult(value.result)) throw new Error("Invalid saved classic plan");
        setLessonPlan(editableClassicLesson(value.result));
      } catch (failure) {
        setError(toTeacherErrorMessage(failure, language === "kk" ? "Жоспарды ашу мүмкін болмады." : "Не удалось открыть план."));
        return;
      }
      setError("");
      refreshBalance();
      return;
    }
    if (value.status === "failed" || value.status === "cancelled") {
      loadedJobId.current = value.id;
      setError(
        value.status === "cancelled"
          ? language === "kk"
            ? "ҚМЖ жасау тоқтатылды. Монеталар қайтарылды."
            : "Создание КМЖ было остановлено. Монеты возвращены."
          : language === "kk"
            ? "ҚМЖ жасау мүмкін болмады. Монеталар қайтарылды — қайталап көріңіз."
            : "Не удалось создать КМЖ. Монеты возвращены — попробуйте ещё раз.",
      );
      refreshBalance();
    }
  }, [job.data, language, refreshBalance, router, toTeacherErrorMessage]);

  useEffect(() => {
    if (!job.error) return;
    const acknowledged = isAcknowledgedGenerationJob(
      job.data,
      currentJobId,
      CLASSIC_LESSON_KINDS,
    );
    if (isUnavailableGenerationJobError(job.error) && !acknowledged) {
      if (currentJobId) loadedJobId.current = currentJobId;
      setSessionJobId(null);
      setError(
        language === "kk"
          ? "Бұл тапсырма енді қолжетімді емес. Жаңа ҚМЖ жасап көріңіз."
          : "Эта задача больше недоступна. Создайте новый КМЖ.",
      );
      router.replace(CLASSIC_LESSON_PATH, { scroll: false });
      return;
    }
    setError(toTeacherErrorMessage(job.error));
  }, [currentJobId, job.data, job.error, language, router, toTeacherErrorMessage]);

  // Convert image to Base64
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // FileReader.readAsDataURL already includes data:image/{type};base64, prefix
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle image upload
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const filesToRead = Array.from(files);
    const uploadError = lessonImageUploadError(formData.textbook_images?.length ?? 0, filesToRead, language === "kk");
    if (uploadError) { setError(uploadError); return; }
    try {
      const base64Images = await Promise.all(filesToRead.map(convertImageToBase64));
      setFormData((prev) => ({
        ...prev,
        textbook_images: [...(prev.textbook_images || []), ...base64Images],
      }));
    } catch (err) {
      setError(toTeacherErrorMessage(err));
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      textbook_images: (prev.textbook_images || []).filter((_, i) => i !== index),
    }));
  };

  // Handle form input changes
  const handleInputChange = <K extends keyof ClassicLessonRequest,>(
    field: K,
    value: ClassicLessonRequest[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle learning objectives
  const addObjective = () => {
    setFormData((prev) => ({
      ...prev,
      learning_objectives: [...prev.learning_objectives, ""],
    }));
  };

  const updateObjective = (index: number, value: string) => {
    setFormData((prev) => {
      const newObjectives = [...prev.learning_objectives];
      newObjectives[index] = value;
      return { ...prev, learning_objectives: newObjectives };
    });
  };

  const removeObjective = (index: number) => {
    if (formData.learning_objectives.length > 1) {
      setFormData((prev) => ({
        ...prev,
        learning_objectives: prev.learning_objectives.filter((_, i) => i !== index),
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    if (
      !formData.subject.trim() ||
      !formData.grade.trim() ||
      !formData.topic.trim() ||
      !formData.teacher_name.trim() ||
      !formData.section_name.trim() ||
      !formData.lesson_number.trim() ||
      !formData.lesson_type
    ) {
      setError(t.lessonPlan.errors.required);
      return false;
    }

    if (!/^\d+$/.test(formData.lesson_number.trim()) || Number(formData.lesson_number) < 1) {
      setError(language === "kk" ? "Сабақ нөмірі оң бүтін сан болуы керек." : "Номер урока должен быть положительным целым числом.");
      return false;
    }
    const nonEmptyObjectives = formData.learning_objectives.filter((obj) => obj.trim());
    if (nonEmptyObjectives.length === 0) {
      setError(t.lessonPlan.errors.objectivesMin);
      return false;
    }

    // Validate date format if provided (DD.MM.YYYY)
    if (formData.date && formData.date.trim()) {
      const datePattern = /^\d{2}\.\d{2}\.\d{4}$/;
      if (!datePattern.test(formData.date.trim())) {
        setError(language === "kk" ? "Күнді КК.АА.ЖЖЖЖ пішімінде енгізіңіз." : "Введите дату в формате ДД.ММ.ГГГГ.");
        return false;
      }
    }

    return true;
  };

  // Generate lesson plan
  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Filter out empty objectives and prepare data
      const cleanedData: ClassicLessonRequest = {
        ...formData,
        planner_version: "legacy_v2", schema_version: "v2",
        learning_objectives: formData.learning_objectives.filter((obj) => obj.trim()),
        date: formData.date && formData.date.trim() ? formData.date.trim() : null,
        textbook_text: formData.textbook_text && formData.textbook_text.trim() ? formData.textbook_text.trim() : null,
        preferred_platform: formData.preferred_platform || null,
        textbook_images: formData.textbook_images && formData.textbook_images.length > 0 ? formData.textbook_images : [],
        language: formData.language || "kazakh",
      };

      const createdJob = await enqueueGenerationJob(
        CLASSIC_LESSON_KIND,
        cleanedData as unknown as Record<string, unknown>,
        { title: cleanedData.topic },
      );
      setSessionJobId(createdJob.id);
      loadedJobId.current = null;
      setLessonPlan(null);
      queryClient.setQueryData(["generation-job", createdJob.id], createdJob);
      router.replace(
        `${CLASSIC_LESSON_PATH}?job=${encodeURIComponent(createdJob.id)}`,
        { scroll: false },
      );
    } catch (err: unknown) {
      if (err instanceof InsufficientTokensError) {
        setError(
          `${t.tokens?.insufficient || "Недостаточно токенов"}. ${t.tokens?.required || "Требуется"}: ${err.required}, ${t.tokens?.available || "Доступно"}: ${err.available}`
        );
      } else if (errorMessageIncludes(err, "401") || errorMessageIncludes(err, "auth")) {
        setError(t.lessonPlan.errors.auth);
      } else {
        setError(toTeacherErrorMessage(err, t.lessonPlan.errors.generic));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update meta field
  const updateMetaField = <K extends keyof ClassicLessonPlan["meta"],>(field: K, value: ClassicLessonPlan["meta"][K]) => {
    if (!lessonPlan) return;
    setLessonPlan((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        meta: { ...prev.meta, [field]: value },
      };
    });
  };

  const updateBlock = (stageIndex: number, blockIndex: number, patch: Partial<LessonSubBlock>) => {
    setLessonPlan((previous) => previous ? updateClassicLessonBlock(previous, stageIndex, blockIndex, patch) : previous);
  };

  // Update lesson objective
  const updateLessonObjective = (index: number, value: string) => {
    if (!lessonPlan) return;
    setLessonPlan((prev) => {
      if (!prev) return null;
      const newObjectives = [...prev.meta.lesson_objectives];
      newObjectives[index] = value;
      return {
        ...prev,
        meta: { ...prev.meta, lesson_objectives: newObjectives },
      };
    });
  };

  // Add lesson objective
  const addLessonObjective = () => {
    if (!lessonPlan) return;
    setLessonPlan((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        meta: {
          ...prev.meta,
          lesson_objectives: [...prev.meta.lesson_objectives, ""],
        },
      };
    });
  };

  // Remove lesson objective
  const removeLessonObjective = (index: number) => {
    if (!lessonPlan || lessonPlan.meta.lesson_objectives.length <= 1) return;
    setLessonPlan((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        meta: {
          ...prev.meta,
          lesson_objectives: prev.meta.lesson_objectives.filter((_, i) => i !== index),
        },
      };
    });
  };

  // Export to DOCX
  const handleExport = async () => {
    if (!lessonPlan || exporting) return;
    setExporting(true);
    setError("");
    try {
      const blob = await exportLessonPlanDocx(classicLessonExportPayload(lessonPlan));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kmzh_${lessonPlan.meta.subject}_${lessonPlan.meta.grade}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: unknown) {
      setError(toTeacherErrorMessage(err, t.lessonPlan.errors.generic));
    } finally { setExporting(false); }
  };

  // Create new plan
  const handleCreateNew = () => {
    setSessionJobId(null);
    loadedJobId.current = null;
    setLessonPlan(null);
    setFormData(createClassicLessonDraft());
    setError("");
    router.replace(CLASSIC_LESSON_PATH, { scroll: false });
  };

  const currentJob = job.data;
  const currentJobAcknowledged = isAcknowledgedGenerationJob(
    currentJob,
    currentJobId,
    CLASSIC_LESSON_KINDS,
  );
  const showJobProgress = Boolean(
    currentJobId && (job.isLoading || (currentJobAcknowledged && currentJob && isActiveGenerationJob(currentJob))),
  );
  const progressCurrent = Math.max(0, Number(currentJob?.progress.current ?? 0));
  const progressTotal = Math.max(1, Number(currentJob?.progress.total ?? 1));
  const progressPercent = Math.max(
    4,
    Math.min(100, (progressCurrent / progressTotal) * 100),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-beige to-green-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <PlannerVersions active="classic" kk={language === "kk"} />
        <header className="mb-6"><h1 className="text-3xl font-bold text-slate-900">{language === "kk" ? "Классикалық ҚМЖ" : "Классический КСП"}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{language === "kk" ? "Бұрынғы нұсқа: оқу мақсаттарын өзіңіз енгізіп, сабақ жоспарын жасаңыз. Дайын жоспарды өңдеп, Word форматында жүктеуге болады." : "Прежняя версия: введите учебные цели вручную и создайте план урока. Готовый план можно отредактировать и скачать в Word."}</p>
        </header>
        {error ? <p role="alert" className="mb-6 whitespace-pre-line rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}

        {showJobProgress ? (
          <section
            aria-live="polite"
            className="glass-card rounded-3xl border border-sky-200 bg-white/90 px-6 py-10 text-center shadow-md sm:px-10"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-2xl" aria-hidden="true">
              ✨
            </div>
            <h2 className="mt-5 text-2xl font-bold text-slate-950">
              {language === "kk" ? "ҚМЖ жасалып жатыр" : "Создаём КМЖ"}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              {generationServerStatusCopy(language, currentJobAcknowledged)}
            </p>
            {error ? <button type="button" onClick={() => void job.refetch()} className="mt-4 min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">{language === "kk" ? "Күйін қайта тексеру" : "Проверить состояние снова"}</button> : null}
            <div className="mx-auto mt-6 h-3 max-w-2xl overflow-hidden rounded-full bg-sky-100">
              <div
                className="h-full motion-safe:animate-pulse rounded-full bg-sky-500 transition-[width] duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </section>
        ) : !lessonPlan ? (
          // Generation Form
          <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Subject */}
                <div>
                  <label htmlFor="classic-subject" className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.lessonPlan.form.subject} *
                  </label>
                  <input
                    id="classic-subject"
                    type="text"
                    value={formData.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    required
                  />
                </div>

                {/* Grade */}
                <div>
                  <label htmlFor="classic-grade" className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.lessonPlan.form.grade} *
                  </label>
                  <select
                    id="classic-grade"
                    value={formData.grade}
                    onChange={(e) => handleInputChange("grade", e.target.value)}
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

                {/* Topic */}
                <div className="sm:col-span-2">
                  <label htmlFor="classic-topic" className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.lessonPlan.form.topic} *
                  </label>
                  <input
                    id="classic-topic"
                    type="text"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    required
                  />
                </div>

                {/* Teacher Name */}
                <div>
                  <label htmlFor="classic-teacher_name" className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.lessonPlan.form.teacherName} *
                  </label>
                  <input
                    id="classic-teacher_name"
                    type="text"
                    value={formData.teacher_name}
                    onChange={(e) => handleInputChange("teacher_name", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    required
                  />
                </div>

                {/* Section Name */}
                <div>
                  <label htmlFor="classic-section_name" className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.lessonPlan.form.sectionName} *
                  </label>
                  <input
                    id="classic-section_name"
                    type="text"
                    value={formData.section_name}
                    onChange={(e) => handleInputChange("section_name", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    required
                  />
                </div>

                {/* Lesson Number */}
                <div>
                  <label htmlFor="classic-lesson_number" className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.lessonPlan.form.lessonNumber} *
                  </label>
                  <input
                    id="classic-lesson_number"
                    type="text"
                    value={formData.lesson_number}
                    onChange={(e) => handleInputChange("lesson_number", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    required
                  />
                </div>

                {/* Lesson Type (required) */}
                <div>
                  <label htmlFor="classic-lesson_type" className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.lessonPlan.form.lessonType} *
                  </label>
                  <select
                    id="classic-lesson_type"
                    value={formData.lesson_type}
                    onChange={(e) => handleInputChange("lesson_type", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    required
                  >
                    <option value="">-- {t.lessonPlan.form.lessonType} --</option>
                    <option value="new_lesson">{t.lessonPlan.form.lessonTypeOptions.new}</option>
                    <option value="consolidation">{t.lessonPlan.form.lessonTypeOptions.consolidation}</option>
                    <option value="review">{t.lessonPlan.form.lessonTypeOptions.review}</option>
                  </select>
                </div>

                {/* Date (optional) - Format DD.MM.YYYY */}
                <div>
                  <label htmlFor="classic-date" className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.lessonPlan.form.date} (DD.MM.YYYY)
                  </label>
                  <input
                    id="classic-date"
                    type="text"
                    value={formData.date || ""}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    placeholder="15.01.2026"
                    pattern="\d{2}\.\d{2}\.\d{4}"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  />
                </div>

                {/* Language */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.lessonPlan.form.language}
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {(
                      [
                        ["kazakh", t.lessonPlan.form.languageOptions.kazakh],
                        ["russian", t.lessonPlan.form.languageOptions.russian],
                        ["english", t.lessonPlan.form.languageOptions.english],
                        ["kyrgyz", t.lessonPlan.form.languageOptions.kyrgyz],
                        ["uzbek", t.lessonPlan.form.languageOptions.uzbek],
                      ] as Array<[LessonPlanLanguage, string]>
                    ).map(([value, label]) => (
                      <label
                        key={value}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                          formData.language === value
                            ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5 ring-1 ring-[color:var(--primary)]"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="language"
                          value={value}
                          checked={formData.language === value}
                          onChange={() => handleInputChange("language", value)}
                          className="h-4 w-4 text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                        />
                        <span className="text-sm font-medium text-slate-900">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Learning Objectives */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t.lessonPlan.form.learningObjectives} *
                </label>
                <div className="space-y-3">
                  {formData.learning_objectives.map((objective, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={objective}
                        aria-label={`${t.lessonPlan.form.learningObjectives} ${index + 1}`}
                        onChange={(e) => updateObjective(index, e.target.value)}
                        className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                        placeholder={`${t.lessonPlan.form.learningObjectives} ${index + 1}`}
                      />
                      {formData.learning_objectives.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeObjective(index)}
                          aria-label={language === "kk" ? "Оқу мақсатын жою" : "Удалить учебную цель"}
                          className="min-h-11 min-w-11 rounded-xl bg-red-50 px-4 text-red-600 hover:bg-red-100"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addObjective}
                    className="flex items-center gap-2 rounded-xl border border-dashed border-[color:var(--primary)] bg-[color:var(--primary)]/5 px-4 py-2 text-sm font-semibold text-[color:var(--primary)] hover:bg-[color:var(--primary)]/10"
                  >
                    + {t.lessonPlan.form.addObjective}
                  </button>
                </div>
              </div>

              {/* Textbook Images */}
              <div>
                <label htmlFor="classic-textbook_images" className="mb-2 block text-sm font-semibold text-slate-700">
                  {t.lessonPlan.form.textbookImages}
                </label>
                <input
                    id="classic-textbook_images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e.target.files)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                />
                {formData.textbook_images && formData.textbook_images.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {formData.textbook_images.map((img, index) => (
                      <div
                        key={index}
                        className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                      >
                        {/* Data URLs selected by the teacher cannot be optimized by next/image. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img}
                          alt={`${language === "kk" ? "Оқулық беті" : "Страница учебника"} ${index + 1}`}
                          className="aspect-[3/4] w-full object-cover"
                        />
                        <span className="absolute left-2 top-2 rounded-full bg-slate-950/80 px-2 py-0.5 text-[10px] font-bold text-white">
                          {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          aria-label={`${language === "kk" ? "Оқулық бетін жою" : "Удалить страницу учебника"} ${index + 1}`}
                          className="absolute right-2 top-2 rounded-lg bg-white/95 px-2 py-1 text-[10px] font-semibold text-red-700 shadow-sm hover:bg-red-50"
                        >
                          {language === "kk" ? "Жою" : "Удалить"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Textbook Text */}
              <div>
                <label htmlFor="classic-textbook_text" className="mb-2 block text-sm font-semibold text-slate-700">
                  {t.lessonPlan.form.textbookText}
                </label>
                <textarea
                    id="classic-textbook_text"
                  value={formData.textbook_text || ""}
                  onChange={(e) => handleInputChange("textbook_text", e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  placeholder={language === "kk" ? "Оқулықтағы тапсырма мәтінін енгізіңіз…" : "Введите текст упражнений из учебника…"}
                />
              </div>

              {/* Preferred Platform */}
              <div>
                <label htmlFor="classic-preferred_platform" className="mb-2 block text-sm font-semibold text-slate-700">
                  {t.lessonPlan.form.preferredPlatform}
                </label>
                <select
                    id="classic-preferred_platform"
                  value={formData.preferred_platform || ""}
                  onChange={(e) =>
                    handleInputChange("preferred_platform", e.target.value || null)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                >
                  <option value="">{t.lessonPlan.form.platformOptions.none}</option>
                  <option value="Kahoot">{t.lessonPlan.form.platformOptions.kahoot}</option>
                  <option value="BilimClass">{t.lessonPlan.form.platformOptions.bilimClass}</option>
                  <option value="SanduAI.kz">{t.lessonPlan.form.platformOptions.sanduAI}</option>
                  <option value="Mentimeter">{t.lessonPlan.form.platformOptions.mentimeter}</option>
                  <option value="Quizlet">{t.lessonPlan.form.platformOptions.quizlet}</option>
                  <option value="Wordwall">{t.lessonPlan.form.platformOptions.wordwall}</option>
                </select>
              </div>

              {/* Error Message */}
              {/* Cost Info */}
              {costs.kmzh_generate && (
                <div className={`rounded-2xl border px-4 py-3 ${
                  checkBalance("kmzh_generate")
                    ? "border-green-200 bg-green-50"
                    : "border-orange-200 bg-orange-50"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      {t.tokens?.cost || "Стоимость"}:
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {costs.kmzh_generate} {t.tokens?.balance || "токенов"}
                    </span>
                  </div>
                  {balance !== null && (
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-slate-600">
                        {t.tokens?.available || "Доступно"}: {balance}
                      </span>
                      {!checkBalance("kmzh_generate") && (
                        <span className="font-semibold text-orange-600">
                          {t.tokens?.insufficient || "Недостаточно токенов"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || (balance !== null && !checkBalance("kmzh_generate"))}
                className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] py-4 text-sm font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                    {t.lessonPlan.loading}
                  </>
                ) : (
                  t.lessonPlan.form.generate
                )}
              </button>
            </form>
          </div>
        ) : (
          // Lesson Plan Preview & Edit
          <div className="animate-fade-in space-y-6">
            {/* Meta Section */}
            <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                {resultCopy.title}
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Section Name */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {resultCopy.sectionName}
                  </label>
                  <input
                    type="text"
                    aria-label={resultCopy.sectionName}
                    value={lessonPlan.meta.section_name}
                    onChange={(e) => updateMetaField("section_name", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {resultCopy.subject}
                  </label>
                  <input
                    type="text"
                    aria-label={resultCopy.subject}
                    value={lessonPlan.meta.subject}
                    onChange={(e) => updateMetaField("subject", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  />
                </div>

                {/* Teacher Name */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {resultCopy.teacherName}
                  </label>
                  <input
                    type="text"
                    aria-label={resultCopy.teacherName}
                    value={lessonPlan.meta.teacher_name}
                    onChange={(e) => updateMetaField("teacher_name", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {resultCopy.date}
                  </label>
                  <input
                    type="text"
                    aria-label={resultCopy.date}
                    value={lessonPlan.meta.date}
                    onChange={(e) => updateMetaField("date", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  />
                </div>

                {/* Grade */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {resultCopy.grade}
                  </label>
                  <input
                    type="text"
                    aria-label={resultCopy.grade}
                    value={lessonPlan.meta.grade}
                    onChange={(e) => updateMetaField("grade", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  />
                </div>

                {/* Students Present */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {resultCopy.studentsPresent}
                  </label>
                  <input
                    type="text"
                    aria-label={resultCopy.studentsPresent}
                    value={lessonPlan.meta.students_present}
                    onChange={(e) => updateMetaField("students_present", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  />
                </div>

                {/* Students Absent */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {resultCopy.studentsAbsent}
                  </label>
                  <input
                    type="text"
                    aria-label={resultCopy.studentsAbsent}
                    value={lessonPlan.meta.students_absent}
                    onChange={(e) => updateMetaField("students_absent", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  />
                </div>

                {/* Topic */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {resultCopy.topic}
                  </label>
                  <input
                    type="text"
                    aria-label={resultCopy.topic}
                    value={lessonPlan.meta.topic}
                    onChange={(e) => updateMetaField("topic", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  />
                </div>
              </div>

              {/* Learning Objectives */}
              <div className="mt-6">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {resultCopy.learningObjectives}
                </label>
                <ul className="list-disc space-y-1 pl-5">
                  {lessonPlan.meta.learning_objectives.map((obj, index) => (
                    <li key={index} className="text-slate-600">
                      {safeString(obj)}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Lesson Objectives */}
              <div className="mt-6">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {resultCopy.lessonObjectives}
                </label>
                <div className="space-y-3">
                  {lessonPlan.meta.lesson_objectives.map((obj, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={obj}
                        aria-label={`${resultCopy.lessonObjectives} ${index + 1}`}
                        onChange={(e) => updateLessonObjective(index, e.target.value)}
                        className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                      />
                      {lessonPlan.meta.lesson_objectives.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLessonObjective(index)}
                          aria-label={language === "kk" ? "Сабақ мақсатын жою" : "Удалить цель урока"}
                          className="min-h-11 min-w-11 rounded-xl bg-red-50 px-4 text-red-600 hover:bg-red-100"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addLessonObjective}
                    className="flex items-center gap-2 rounded-xl border border-dashed border-[color:var(--primary)] bg-[color:var(--primary)]/5 px-4 py-2 text-sm font-semibold text-[color:var(--primary)] hover:bg-[color:var(--primary)]/10"
                  >
                    + {t.lessonPlan.meta.addObjective}
                  </button>
                </div>
              </div>
            </div>

            {/* Lesson Flow Table */}
            <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                {resultCopy.stage}
              </h2>

              {lessonPlan.flow.map((stage, stageIndex) => (
                <div key={stageIndex} className="mb-8 last:mb-0">
                  {/* Stage Header */}
                  <div className="mb-4 rounded-2xl bg-gradient-to-r from-orange-100 to-green-100 px-6 py-4">
                    <h3 className="text-lg font-bold text-slate-800">
                      {stage.stage_name} — {stage.time}
                    </h3>
                    {stage.neuro_exercise && (
                      <p className="mt-1 text-sm text-slate-600">
                        {resultCopy.neuroExercise}: {renderNeuroExercise(stage.neuro_exercise)}
                      </p>
                    )}
                  </div>

                  {/* Tasks Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="w-full min-w-[800px] border-collapse">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="border-b border-r border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 w-1/4">
                            {resultCopy.teacherActivity}
                          </th>
                          <th className="border-b border-r border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 w-1/4">
                            {resultCopy.studentActivity}
                          </th>
                          <th className="border-b border-r border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 w-1/4">
                            {resultCopy.assessment}
                          </th>
                          <th className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 w-1/4">
                            {resultCopy.resources}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {stage.sub_blocks.map((task, taskIndex) => (
                          <tr key={taskIndex} className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                            {/* Teacher Activity */}
                            <td className="border-r border-slate-200 px-4 py-3 align-top">
                              <div className="mb-2 text-xs text-slate-500">
                                <span className="font-semibold">{workTypeOptions(language === "kk").find((option) => option.value === canonicalWorkType(task.work_type))?.label ?? task.work_type}</span> •{" "}
                                {task.method_name}
                              </div>
                              <textarea
                                aria-label={`${resultCopy.teacherActivity}, ${stage.stage_name}, ${taskIndex + 1}`}
                                value={task.teacher_activity}
                                onChange={(e) =>
                                  updateBlock(stageIndex, taskIndex, { teacher_activity: e.target.value })
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                                rows={4}
                              />
                              <ClassicBlockMaterial block={task} onChange={(patch) => updateBlock(stageIndex, taskIndex, patch)} kk={language === "kk"} />
                            </td>

                            {/* Student Activity */}
                            <td className="border-r border-slate-200 px-4 py-3 align-top">
                              <textarea
                                aria-label={`${resultCopy.studentActivity}, ${stage.stage_name}, ${taskIndex + 1}`}
                                value={task.student_activity}
                                onChange={(e) =>
                                  updateBlock(stageIndex, taskIndex, { student_activity: e.target.value })
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                                rows={4}
                              />
                            </td>

                            {/* Assessment (Descriptors) */}
                            <td className="border-r border-slate-200 px-4 py-3 align-top">
                              <div className="space-y-2">
                                {task.descriptors.map((descriptor, descIndex) => (
                                  <div key={descIndex} className="flex gap-1">
                                    <input
                                      type="text"
                                      aria-label={`${resultCopy.assessment}, ${taskIndex + 1}, ${descIndex + 1}`}
                                      value={descriptor.text}
                                      onChange={(e) =>
                                        updateBlock(stageIndex, taskIndex, { descriptors: task.descriptors.map((item, index) => index !== descIndex ? item : { ...item, text: e.target.value }) })
                                      }
                                      className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                                    />
                                    <input type="number" min={0} max={100} step={1} value={descriptor.points} aria-label={language === "kk" ? "Дескриптор балы" : "Баллы дескриптора"}
                                      onChange={(event) => updateBlock(stageIndex, taskIndex, { descriptors: task.descriptors.map((item, index) => index !== descIndex ? item : { ...item, points: Math.max(0, Math.min(100, Number(event.target.value) || 0)) }) })}
                                      className="w-16 rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm" />
                                    <button
                                      type="button"
                                      aria-label={language === "kk" ? "Дескрипторды жою" : "Удалить дескриптор"}
                                      onClick={() =>
                                        updateBlock(stageIndex, taskIndex, { descriptors: task.descriptors.filter((_, index) => index !== descIndex) })
                                      }
                                      className="min-h-11 min-w-11 rounded-lg px-2 text-red-600 hover:bg-red-50"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => updateBlock(stageIndex, taskIndex, { descriptors: [...task.descriptors, { text: "", points: 0 }] })}
                                  className="mt-1 text-xs font-semibold text-[color:var(--primary)] hover:underline"
                                >
                                  + {t.lessonPlan.actions.addDescriptor}
                                </button>
                              </div>
                            </td>

                            {/* Resources */}
                            <td className="px-4 py-3 align-top">
                              <textarea
                                aria-label={`${resultCopy.resources}, ${stage.stage_name}, ${taskIndex + 1}`}
                                value={[...task.resource_urls, ...task.resource_materials].join("\n")}
                                onChange={(e) =>
                                  updateBlock(stageIndex, taskIndex, {
                                    resource_urls: e.target.value.split("\n").filter((line) => /^https?:\/\//i.test(line.trim())),
                                    resource_materials: e.target.value.split("\n").filter((line) => !/^https?:\/\//i.test(line.trim())),
                                  })
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                                rows={2}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md">
              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={() => void handleExport()}
                  disabled={exporting}
                  className="min-w-0 flex-1 rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-6 py-3 font-bold text-white shadow-lg transition hover:opacity-90"
                >
                  {exporting ? (language === "kk" ? "Word дайындалуда…" : "Готовим Word…") : t.lessonPlan.actions.download}
                </button>
                <button
                  onClick={handleCreateNew}
                  className="min-w-0 flex-1 rounded-2xl bg-white px-6 py-3 font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                >
                  {t.lessonPlan.actions.createNew}
                </button>
              </div>
            </div>
          </div>
        )}

        <ModuleGenerationHistory
          kinds={[CLASSIC_LESSON_KIND]}
          title={{ ru: "Мои классические КСП", kk: "Менің классикалық ҚМЖ-ларым" }}
        />
      </div>
    </div>
  );
}


export default function ClassicLessonPlanPage() {
  return (
    <Suspense
      fallback={(
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-beige to-green-50 p-6">
          <div className="mx-auto h-64 max-w-7xl animate-pulse rounded-3xl bg-white/70" />
        </div>
      )}
    >
      <LessonPlanContent />
    </Suspense>
  );
}
