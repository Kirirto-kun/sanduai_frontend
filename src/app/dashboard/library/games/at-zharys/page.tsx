"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ModuleGenerationHistory } from "../../../../../components/generations/ModuleGenerationHistory";
import { generationJobsQueryKey } from "../../../../../components/generations/GenerationCenter";
import { useLanguage, useTranslations } from "../../../../../i18n/LanguageContext";
import { useTokens } from "../../../../../hooks/useTokens";
import {
  enqueueGenerationJob,
  getGenerationJob,
  InsufficientTokensError,
} from "../../../../../lib/api";
import {
  generationJobIdFromSearchParam,
  generationServerStatusCopy,
  isActiveGenerationJob,
} from "../../../../../lib/generation-history";
import {
  racePayloadFromSettings,
  restoreRaceGame,
  RACE_GENERATION_KIND,
  RACE_SOURCE_PATH,
} from "../../../../../lib/race-generation";
import type { GameSettings } from "../../../../../types/games";
import { useTeacherErrorMessage } from "@/hooks/useTeacherErrorMessage";

const TEAM_COUNTS: GameSettings["teams_count"][] = [2, 3, 4];
const MODULE_KINDS = [RACE_GENERATION_KIND] as const;

function AtZharysSetupContent() {
  const t = useTranslations();
  const { language } = useLanguage();
  const toTeacherErrorMessage = useTeacherErrorMessage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { balance, refreshBalance } = useTokens();
  const requestedJobId = generationJobIdFromSearchParam(searchParams.get("job"));
  const [sessionJobId, setSessionJobId] = useState<string | null>(null);
  const currentJobId = requestedJobId ?? sessionJobId;
  const settledJobId = useRef<string | null>(null);

  const [formData, setFormData] = useState<GameSettings>({
    topic: "",
    grade: "",
    additional_info: "",
    teams_count: 2,
    victory_condition: 10,
    questions_count: 40,
    language: "kz",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const job = useQuery({
    queryKey: ["generation-job", currentJobId],
    queryFn: () => getGenerationJob(currentJobId as string),
    enabled: Boolean(currentJobId),
    retry: 2,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: (query) =>
      query.state.data && isActiveGenerationJob(query.state.data) ? 2_000 : false,
  });
  const isLoading = isSubmitting || Boolean(
    currentJobId && (job.isPending || (job.data && isActiveGenerationJob(job.data))),
  );

  useEffect(() => {
    settledJobId.current = null;
    setError(null);
  }, [currentJobId]);

  useEffect(() => {
    const value = job.data;
    if (!value || isActiveGenerationJob(value) || settledJobId.current === value.id) return;
    settledJobId.current = value.id;
    refreshBalance();

    if (value.kind !== RACE_GENERATION_KIND) {
      setError(
        language === "kk"
          ? "Бұл материал басқа бөлімде жасалған."
          : "Этот материал создан в другом разделе.",
      );
      return;
    }
    if ((value.status === "completed" || value.status === "billing_error") && value.result) {
      const restored = restoreRaceGame(value);
      if (!restored) {
        setError(
          language === "kk"
            ? "Ойын сақталды, бірақ оны ашу мүмкін болмады. Қайта жасап көріңіз."
            : "Игра сохранилась, но открыть её не удалось. Попробуйте создать заново.",
        );
        return;
      }
      router.replace(
        `${RACE_SOURCE_PATH}/${encodeURIComponent(restored.gameId)}?job=${encodeURIComponent(value.id)}`,
      );
      return;
    }
    setError(
      value.status === "cancelled"
        ? language === "kk"
          ? "Ойын жасау тоқтатылды. Монеталар қайтарылды."
          : "Создание игры остановлено. Монеты возвращены."
        : language === "kk"
          ? "Ойынды жасау мүмкін болмады. Монеталар қайтарылды. Қайта жасап көріңіз."
          : "Не удалось создать игру. Монеты возвращены. Попробуйте ещё раз.",
    );
  }, [job.data, language, refreshBalance, router]);

  useEffect(() => {
    if (job.error) setError(toTeacherErrorMessage(job.error));
  }, [job.error, toTeacherErrorMessage]);

  const handleInputChange = <K extends keyof GameSettings,>(field: K, value: GameSettings[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.topic.trim()) {
      setError(t.atZharys?.errors?.required || "Заполните все обязательные поля");
      return false;
    }
    if (!formData.grade.trim()) {
      setError(t.atZharys?.errors?.required || "Заполните все обязательные поля");
      return false;
    }
    if (formData.victory_condition < 5 || formData.victory_condition > 30) {
      setError("Условие победы должно быть от 5 до 30");
      return false;
    }
    if (formData.questions_count < 1 || formData.questions_count > 100) {
      setError("Количество вопросов должно быть от 1 до 100");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    // Check token balance
    if (balance !== null && balance < 10) {
      setError(t.atZharys?.errors?.insufficientTokens || "Недостаточно токенов. Нужно 10 токенов.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await enqueueGenerationJob(
        RACE_GENERATION_KIND,
        racePayloadFromSettings(formData),
        { title: formData.topic.trim() },
      );
      setSessionJobId(created.id);
      queryClient.setQueryData(["generation-job", created.id], created);
      void queryClient.invalidateQueries({ queryKey: generationJobsQueryKey });
      router.replace(`${RACE_SOURCE_PATH}?job=${encodeURIComponent(created.id)}`, {
        scroll: false,
      });
    } catch (err: unknown) {
      console.error("Error generating race:", err);
      if (err instanceof InsufficientTokensError) {
        setError(t.atZharys?.errors?.insufficientTokens || "Недостаточно токенов. Нужно 10 токенов.");
      } else {
        setError(
          toTeacherErrorMessage(
            err,
            t.atZharys?.errors?.generationError || "Ошибка генерации игры",
            {
              insufficientCoins:
                t.atZharys?.errors?.insufficientTokens ||
                "Недостаточно токенов. Нужно 10 токенов.",
            },
          ),
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {t.atZharys?.setup?.title || "Ат Жарыс"}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {t.atZharys?.setup?.subtitle || "Интерактивная игра-викторина"}
        </p>
      </div>

      <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Topic */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              {t.atZharys?.setup?.topic || "Тема урока"} *
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => handleInputChange("topic", e.target.value)}
              placeholder={t.atZharys?.setup?.topicPlaceholder || "Биография Абая Кунанбаева"}
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
            />
          </div>

          {/* Grade */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              {t.atZharys?.setup?.grade || "Класс"} *
            </label>
            <input
              type="text"
              value={formData.grade}
              onChange={(e) => handleInputChange("grade", e.target.value)}
              placeholder={t.atZharys?.setup?.gradePlaceholder || "7 класс"}
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
            />
          </div>

          {/* Additional Info */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              {t.atZharys?.setup?.additionalInfo || "Дополнительная информация"}
            </label>
            <textarea
              value={formData.additional_info}
              onChange={(e) => handleInputChange("additional_info", e.target.value)}
              placeholder={t.atZharys?.setup?.additionalInfoPlaceholder || "Упор на 'Слова назидания'"}
              rows={3}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
            />
          </div>

          {/* Teams Count */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              {t.atZharys?.setup?.teamsCount || "Количество команд"}
            </label>
            <div className="flex gap-4">
              {TEAM_COUNTS.map((count) => (
                <label
                  key={count}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 transition hover:border-[color:var(--primary)]"
                  style={{
                    borderColor:
                      formData.teams_count === count
                        ? "var(--primary)"
                        : undefined,
                    backgroundColor:
                      formData.teams_count === count
                        ? "rgba(var(--primary-rgb), 0.1)"
                        : undefined,
                  }}
                >
                  <input
                    type="radio"
                    name="teams_count"
                    value={count}
                    checked={formData.teams_count === count}
                    onChange={() => handleInputChange("teams_count", count)}
                    className="h-4 w-4 text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                  />
                  <span className="text-sm font-medium text-slate-700">{count}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Victory Condition */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              {t.atZharys?.setup?.victoryCondition || "Условие победы"}
            </label>
            <input
              type="number"
              min={5}
              max={30}
              value={isNaN(formData.victory_condition) ? "" : formData.victory_condition}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === "") {
                  handleInputChange("victory_condition", 10); // Use default when empty
                } else {
                  const numValue = parseInt(inputValue, 10);
                  if (!isNaN(numValue) && numValue >= 5 && numValue <= 30) {
                    handleInputChange("victory_condition", numValue);
                  }
                }
              }}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
            />
            <p className="mt-1 text-xs text-slate-500">
              {t.atZharys?.setup?.victoryConditionDescription ||
                "Сколько правильных ответов нужно для финиша?"}
            </p>
          </div>

          {/* Questions Count */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              {t.atZharys?.setup?.questionsCount || "Количество вопросов"}
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={isNaN(formData.questions_count) ? "" : formData.questions_count}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === "") {
                  handleInputChange("questions_count", 40); // Use default when empty
                } else {
                  const numValue = parseInt(inputValue, 10);
                  if (!isNaN(numValue) && numValue >= 1 && numValue <= 100) {
                    handleInputChange("questions_count", numValue);
                  }
                }
              }}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
            />
          </div>

          {/* Language */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              {t.atZharys?.setup?.language || "Язык"}
            </label>
            <select
              value={formData.language}
              onChange={(e) => handleInputChange("language", e.target.value as "kz" | "ru")}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
            >
              <option value="kz">Қазақша</option>
              <option value="ru">Русский</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Cost Info */}
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
            {t.atZharys?.setup?.cost || "Стоимость: 10 токенов"}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-4 py-3.5 text-sm font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span
                  aria-hidden="true"
                  className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"
                />
                {t.atZharys?.setup?.generating || "Генерация..."}
              </span>
            ) : (
              t.atZharys?.setup?.generate || "Сгенерировать игру"
            )}
          </button>
        </form>
      </div>

      {isLoading ? (
        <div
          aria-live="polite"
          className="flex items-center gap-4 rounded-3xl border border-sky-200 bg-gradient-to-r from-sky-50 to-indigo-50 p-6 shadow-sm"
        >
          <div className="h-11 w-11 shrink-0 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
          <div>
            <p className="font-bold text-slate-900">
              {language === "kk" ? "Ойын жасалып жатыр" : "Создаём игру"}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {generationServerStatusCopy(language, !isSubmitting && job.data?.id === currentJobId)}
            </p>
          </div>
        </div>
      ) : null}

      <ModuleGenerationHistory
        kinds={MODULE_KINDS}
        title={{ ru: "Мои игры «Ат жарыс»", kk: "«Ат жарыс» ойындарым" }}
      />
    </div>
  );
}


export default function AtZharysSetupPage() {
  return (
    <Suspense fallback={<div className="min-h-96 animate-pulse rounded-3xl bg-white/70" />}>
      <AtZharysSetupContent />
    </Suspense>
  );
}
