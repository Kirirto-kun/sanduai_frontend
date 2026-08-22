"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import {
  generateImage,
  GenerateImageResponse,
  InsufficientTokensError,
} from "../../../../lib/api";
import { useLanguage, useTranslations } from "../../../../i18n/LanguageContext";
import { useTokens } from "../../../../hooks/useTokens";
import { TokenBalance } from "../../../../components/TokenBalance";
import { useTeacherErrorMessage } from "@/hooks/useTeacherErrorMessage";

export default function ImageGenerationPage() {
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
      setError("Введите описание изображения");
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
        setError(toTeacherErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (result?.temp_url) {
      // Создаем временную ссылку для скачивания
      const link = document.createElement("a");
      link.href = result.temp_url;
      link.download = `generated-image-${Date.now()}.png`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-slate-800">
          Генерация изображений
        </h1>
        <p className="text-slate-600">
          Создавайте изображения с помощью искусственного интеллекта
        </p>
      </div>

      {/* Предупреждение */}
      <div className="mb-6 rounded-lg border border-orange-300 bg-orange-50 p-4">
        <div className="flex items-start gap-3">
          <svg
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h3 className="font-semibold text-orange-800">
              Внимание: Изображение не сохраняется в истории
            </h3>
            <p className="mt-1 text-sm text-orange-700">
              Скачайте изображение сразу после генерации. Ссылка действительна только 1 час.
            </p>
          </div>
        </div>
      </div>

      {/* Информация о стоимости */}
      <div className="mb-6">
        <TokenBalance showCost={operationType} />
        {!hasEnoughBalance && balance !== null && (
          <div className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            Недостаточно токенов для генерации. Требуется: {cost}, доступно: {balance}
          </div>
        )}
      </div>

      {/* Форма генерации */}
      <form onSubmit={onGenerate} className="mb-6 space-y-4">
        <div>
          <label
            htmlFor="prompt"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Описание изображения
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Например: Абай Кунанбаев читает книгу"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            rows={4}
            disabled={loading}
          />
          <p className="mt-1 text-xs text-slate-500">
            Опишите, какое изображение вы хотите создать
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !hasEnoughBalance || !prompt.trim()}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? "Генерация..." : "Сгенерировать изображение"}
        </button>
      </form>

      {/* Ошибка */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Результат */}
      {result && result.status === "success" && result.temp_url && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800">
                Сгенерированное изображение
              </h2>
            </div>

            <div className="mb-4">
              <Image
                src={result.temp_url}
                alt="Generated image"
                width={1024}
                height={1024}
                unoptimized
                className="w-full rounded-lg border border-slate-200"
              />
            </div>

            {result.warning && (
              <div className="mb-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
                {language === "kk"
                  ? "Сурет жасалды, бірақ нәтижені мұқият тексеріңіз."
                  : "Изображение создано, но внимательно проверьте результат."}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700"
              >
                Скачать изображение
              </button>
              <a
                href={result.temp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-center font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Открыть в новой вкладке
              </a>
            </div>
          </div>
        </div>
      )}

      {result && result.status === "error" && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {language === "kk" ? "Суретті жасау мүмкін болмады: " : "Не удалось создать изображение: "}
          {toTeacherErrorMessage(
            result.error_message ? new Error(result.error_message) : null,
          )}
        </div>
      )}
    </div>
  );
}
