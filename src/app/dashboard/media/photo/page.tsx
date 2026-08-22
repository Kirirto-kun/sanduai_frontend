"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import {
  generateImage,
  GenerateImageResponse,
  InsufficientTokensError,
  downloadImage,
} from "../../../../lib/api";
import { useLanguage, useTranslations } from "../../../../i18n/LanguageContext";
import { useTokens } from "../../../../hooks/useTokens";
import { TokenBalance } from "../../../../components/TokenBalance";
import { useTeacherErrorMessage } from "@/hooks/useTeacherErrorMessage";

export default function PhotoPage() {
  const t = useTranslations();
  const { language } = useLanguage();
  const toTeacherErrorMessage = useTeacherErrorMessage();
  const { refreshBalance, costs, balance, checkBalance } = useTokens();
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<GenerateImageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const operationType = "image_generate";
  const cost = costs[operationType] || 20;
  const hasEnoughBalance = checkBalance(operationType);

  const onGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError(t.photoPage?.enterPrompt || "Введите описание изображения");
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const data = await generateImage({ prompt: prompt.trim() });
      setResult(data);
      refreshBalance();
    } catch (err) {
      if (err instanceof InsufficientTokensError) {
        setError(
          `${t.tokens?.insufficient || "Недостаточно токенов"}. ${t.tokens?.required || "Требуется"}: ${err.required}, ${t.tokens?.available || "Доступно"}: ${err.available}`
        );
      } else {
        setError(
          toTeacherErrorMessage(
            err,
            t.photoPage?.generationError || "Ошибка генерации изображения",
          ),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!result?.temp_url) return;

    try {
      // Используем прокси бэкенда для скачивания (обход CORS)
      const blob = await downloadImage(result.temp_url);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed:", e);
      // Fallback: открываем в новой вкладке, если прокси не удался
      const link = document.createElement("a");
      link.href = result.temp_url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-beige to-green-50 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">{t.photoPage?.title || "Генерация изображений"}</h1>

        {/* Ссылка на изображение теперь постоянная — картинка лежит в CDN,
            а не во временном хранилище провайдера на 60 минут. */}
        <div className="glass-card mb-6 rounded-3xl border border-white/60 px-6 py-4 shadow-md sm:px-8">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-lg leading-none">💡</span>
            <p className="text-sm text-slate-600">
              {language === "kk"
                ? "Кескін тұрақты сілтемеде сақталады — оны кейін де ашуға болады. Жазуларды қазақ тілінде сұрасаңыз, суретте де қазақша шығады."
                : "Изображение сохраняется по постоянной ссылке — его можно открыть и позже. Если попросите надписи на казахском, они появятся на картинке на казахском."}
            </p>
          </div>
        </div>

        {/* Форма генерации */}
        <div className="glass-card mb-6 rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
          <form onSubmit={onGenerate} className="space-y-6">
            {/* Информация о стоимости */}
            <div>
              <TokenBalance showCost={operationType} />
              {!hasEnoughBalance && balance !== null && (
                <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  {(t.photoPage?.insufficientTokensFormat || "Недостаточно токенов для генерации. Требуется: {cost}, доступно: {balance}").replace("{cost}", String(cost)).replace("{balance}", String(balance))}
                </div>
              )}
            </div>

            {/* Поле ввода промпта */}
            <div>
              <label
                htmlFor="prompt"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                {t.photoPage?.promptLabel || "Описание изображения"}
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t.photoPage?.promptPlaceholder || "Например: Абай Кунанбаев читает книгу"}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                rows={6}
                disabled={loading}
              />
              <p className="mt-2 text-xs text-slate-500">
                {t.photoPage?.promptHint || "Опишите детально, какое изображение вы хотите создать"}
              </p>
            </div>

            {/* Ошибка */}
            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Кнопка генерации */}
            <button
              type="submit"
              disabled={loading || !hasEnoughBalance || !prompt.trim()}
              className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] py-3.5 text-sm font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                  {t.photoPage?.generating || "Генерация..."}
                </>
              ) : (
                t.photoPage?.generate || "Сгенерировать изображение"
              )}
            </button>
          </form>
        </div>

        {/* Результат */}
        {result && result.status === "success" && result.temp_url && (
          <div className="glass-card animate-fade-in rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              {t.photoPage?.resultTitle || "Сгенерированное изображение"}
            </h2>

            <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <Image
                src={result.temp_url}
                alt="Generated image"
                width={1024}
                height={1024}
                unoptimized
                className="w-full"
              />
            </div>

            {result.warning && (
              <div className="mb-4 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-800">
                {language === "kk"
                  ? "Сурет жасалды, бірақ нәтижені мұқият тексеріңіз."
                  : "Изображение создано, но внимательно проверьте результат."}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-[color:var(--primary)]"
              >
                <span>⬇️</span>
                {t.photoPage?.download || "Скачать изображение"}
              </button>
              <a
                href={result.temp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-[color:var(--primary)]"
              >
                <span>🔗</span>
                {t.photoPage?.openInNewTab || "Открыть в новой вкладке"}
              </a>
            </div>
          </div>
        )}

        {result && result.status === "error" && (
          <div className="glass-card rounded-3xl border border-red-200 bg-red-50 px-6 py-4 shadow-md sm:px-8">
            <div className="text-sm text-red-700">
              <strong>{t.photoPage?.errorLabel || "Ошибка генерации:"}</strong>{" "}
              {toTeacherErrorMessage(
                result.error_message ? new Error(result.error_message) : null,
                t.photoPage?.generationError || "Ошибка генерации изображения",
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




