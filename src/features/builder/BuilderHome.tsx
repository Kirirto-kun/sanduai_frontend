"use client";

import { useRef } from "react";
import { ACCEPTED_ASSET_TYPES, BUILDER_CATEGORIES, BUILDER_EXAMPLES, formatBytes } from "./copy";
import { builderContentLanguageLabel, normalizeBuilderContentLanguage } from "./language";
import type { BuilderConfig, BuilderContentLanguage, BuilderProjectSummary, BuilderProjectType, PendingAsset } from "./types";

type BuilderHomeProps = {
  language: "ru" | "kk";
  projects: BuilderProjectSummary[];
  projectsLoading: boolean;
  config: BuilderConfig | null;
  estimatedCost: number | null;
  prompt: string;
  selectedType: BuilderProjectType;
  selectedContentLanguage: BuilderContentLanguage;
  contentLanguages: BuilderContentLanguage[];
  pendingAssets: PendingAsset[];
  busy: boolean;
  error: string;
  onPromptChange: (value: string) => void;
  onSelectType: (type: BuilderProjectType) => void;
  onSelectContentLanguage: (language: BuilderContentLanguage) => void;
  onFiles: (files: File[]) => void;
  onRemovePending: (id: string) => void;
  onCreate: () => void;
  onOpen: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
};

const TYPE_ICON = Object.fromEntries(BUILDER_CATEGORIES.map(category => [category.type, category.icon]));

function relativeDate(value: string, language: "ru" | "kk"): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  return new Intl.DateTimeFormat(language === "kk" ? "kk-KZ" : "ru-RU", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  }).format(date);
}

export default function BuilderHome(props: BuilderHomeProps) {
  const {
    language, projects, projectsLoading, config, estimatedCost, prompt, selectedType,
    selectedContentLanguage, contentLanguages, pendingAssets,
    busy, error, onPromptChange, onSelectType, onSelectContentLanguage, onFiles, onRemovePending, onCreate,
    onOpen, onDuplicate, onDelete, onRefresh,
  } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isKk = language === "kk";
  const selected = BUILDER_CATEGORIES.find(category => category.type === selectedType) ?? BUILDER_CATEGORIES.at(-1)!;
  const generationCost = estimatedCost;
  const accept = Object.values(config?.accepted_asset_types ?? {}).flat().join(",") || ACCEPTED_ASSET_TYPES;
  const waitingForQuote = prompt.trim().length >= 3 && generationCost === null;

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] pb-12">
      <section className="relative overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,#fff_0%,#fffaf5_46%,#ecfdf5_100%)] px-4 py-8 shadow-[0_28px_80px_rgba(15,23,42,0.09)] sm:px-8 sm:py-11 lg:px-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-orange-200/50 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 left-1/3 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/85 px-3 py-1.5 text-xs font-bold text-orange-700 shadow-sm backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            SANDU AI · VIBE CODING
          </div>
          <h1 className="mt-5 text-balance text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">
            {isKk ? "Идеяңызды жұмыс істейтін жобаға айналдырыңыз" : "Превратите идею в работающий проект"}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            {isKk
              ? "Кодты білудің қажеті жоқ. Не жасағыңыз келетінін айтыңыз, сурет немесе видео тіркеңіз — SanduAI жобалап, кодтап, бірден көрсетеді."
              : "Не нужно знать код. Опишите идею, приложите изображение или видео — SanduAI спроектирует, соберёт и сразу покажет результат."}
          </p>
        </div>

        <div className="relative mx-auto mt-8 max-w-4xl rounded-[26px] border border-slate-200/80 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.12)] sm:p-3">
          <label htmlFor="builder-prompt" className="sr-only">
            {isKk ? "Не жасағыңыз келетінін сипаттаңыз" : "Опишите, что хотите создать"}
          </label>
          <textarea
            id="builder-prompt"
            value={prompt}
            onChange={event => onPromptChange(event.target.value)}
            onKeyDown={event => {
              if ((event.ctrlKey || event.metaKey) && event.key === "Enter") onCreate();
            }}
            disabled={busy}
            maxLength={12_000}
            rows={5}
            placeholder={isKk ? selected.promptKk : selected.promptRu}
            className="min-h-36 w-full resize-none rounded-2xl border-0 bg-transparent px-4 py-4 text-base leading-7 text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60 sm:px-5"
          />

          {pendingAssets.length > 0 && (
            <div className="flex flex-wrap gap-2 px-3 pb-2">
              {pendingAssets.map(asset => (
                <div key={asset.id} className="group flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  <span aria-hidden="true">{asset.file.type.startsWith("image/") ? "🖼️" : asset.file.type.startsWith("video/") ? "🎬" : asset.file.name.endsWith(".glb") || asset.file.name.endsWith(".gltf") ? "🧊" : "📎"}</span>
                  <span className="max-w-40 truncate font-semibold">{asset.file.name}</span>
                  <span className="text-slate-400">{formatBytes(asset.file.size)}</span>
                  <button type="button" onClick={() => onRemovePending(asset.id)} aria-label={`${isKk ? "Жою" : "Удалить"}: ${asset.file.name}`} className="ml-1 text-slate-400 transition hover:text-red-600">×</button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-slate-100 px-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              <input ref={fileInputRef} type="file" multiple accept={accept} onChange={handleFileInput} className="sr-only" />
              <label className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-600 transition focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100">
                <span aria-hidden="true">🌐</span>
                <span className="hidden md:inline">{isKk ? "Жоба тілі:" : "Язык проекта:"}</span>
                <select
                  aria-label={isKk ? "Жоба контентінің тілі" : "Язык контента проекта"}
                  value={selectedContentLanguage}
                  onChange={event => onSelectContentLanguage(event.target.value as BuilderContentLanguage)}
                  disabled={busy}
                  className="max-w-44 bg-transparent py-1 font-bold text-slate-700 outline-none disabled:opacity-50"
                >
                  {contentLanguages.map(contentLanguage => (
                    <option key={contentLanguage} value={contentLanguage}>
                      {builderContentLanguageLabel(contentLanguage, language)}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={busy || pendingAssets.length >= 12} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:opacity-50">
                <span className="text-base">＋</span>{isKk ? "Файл қосу" : "Добавить файл"}
              </button>
              <span className="hidden text-xs text-slate-400 sm:inline">PNG · JPG · SVG · MP4 · WEBM · GLB</span>
            </div>
            <div className="flex items-center justify-end gap-3">
              <span className="text-xs font-semibold text-slate-500">
                {waitingForQuote ? (isKk ? "Бағасы есептелуде…" : "Считаем точную цену…") : generationCost !== null ? `${generationCost} ${isKk ? "монета" : "монет"}` : `${prompt.length}/12000`}
              </span>
              <button
                type="button"
                onClick={onCreate}
                disabled={busy || prompt.trim().length < 3 || generationCost === null}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" /> : <span>✦</span>}
                {busy ? (isKk ? "Жоба жасалуда…" : "Создаём проект…") : (isKk ? "Жоба жасау" : "Создать проект")}
              </button>
            </div>
          </div>
        </div>

        {error && <p role="alert" className="relative mx-auto mt-4 max-w-4xl rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

        <div className="relative mx-auto mt-7 grid max-w-5xl grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {BUILDER_CATEGORIES.map(category => {
            const active = category.type === selectedType;
            return (
              <button
                key={category.type}
                type="button"
                aria-pressed={active}
                onClick={() => onSelectType(category.type)}
                className={`group min-h-24 rounded-2xl border p-3 text-left transition ${active ? "border-slate-900 bg-slate-950 text-white shadow-lg" : "border-white/90 bg-white/75 text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-orange-200 hover:bg-white"}`}
              >
                <span className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${category.accent} text-lg shadow-sm`}>{category.icon}</span>
                <span className="mt-2 block text-xs font-bold leading-4">{isKk ? category.kk : category.ru}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">{isKk ? "Сіздің кеңістігіңіз" : "Ваше пространство"}</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{isKk ? "Менің жобаларым" : "Мои проекты"}</h2>
            </div>
            <button type="button" onClick={onRefresh} className="rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-white hover:text-slate-900">
              ↻ {isKk ? "Жаңарту" : "Обновить"}
            </button>
          </div>

          {projectsLoading ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label={isKk ? "Жобалар жүктелуде" : "Загрузка проектов"}>
              {[0, 1, 2].map(item => <div key={item} className="h-60 animate-pulse rounded-3xl border border-white bg-white/65" />)}
            </div>
          ) : projects.length > 0 ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map(project => (
                <article key={project.id} className="group overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.07)] transition hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(15,23,42,0.12)]">
                  <button type="button" onClick={() => onOpen(project.id)} className="block w-full text-left">
                    <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#fff7ed,#ecfdf5)]">
                      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-orange-300/35 blur-2xl" />
                      <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-emerald-300/35 blur-2xl" />
                      <span className="relative text-4xl drop-shadow-sm">{TYPE_ICON[project.project_type] ?? "✨"}</span>
                      <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${project.visibility === "public" ? "bg-emerald-100 text-emerald-700" : project.visibility === "link" ? "bg-sky-100 text-sky-700" : "bg-white/85 text-slate-500"}`}>
                        {project.visibility === "public" ? (isKk ? "Ашық" : "Публичный") : project.visibility === "link" ? (isKk ? "Сілтеме" : "По ссылке") : (isKk ? "Жеке" : "Приватный")}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="truncate text-sm font-black text-slate-950">{project.title}</h3>
                      <p className="mt-1 line-clamp-2 min-h-9 text-xs leading-4 text-slate-500">{project.description || (isKk ? "Сипаттамасы жоқ" : "Без описания")}</p>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                        <span>v{project.current_version} · {builderContentLanguageLabel(normalizeBuilderContentLanguage(project.content_language), language)}</span>
                        <span>{relativeDate(project.updated_at, language)}</span>
                      </div>
                    </div>
                  </button>
                  <div className="flex border-t border-slate-100 p-2">
                    <button type="button" onClick={() => onOpen(project.id)} className="min-h-9 flex-1 rounded-lg text-xs font-bold text-orange-600 hover:bg-orange-50">{isKk ? "Ашу" : "Открыть"}</button>
                    <button type="button" onClick={() => onDuplicate(project.id)} aria-label={`${isKk ? "Көшіру" : "Дублировать"}: ${project.title}`} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">⧉</button>
                    <button type="button" onClick={() => onDelete(project.id)} aria-label={`${isKk ? "Жою" : "Удалить"}: ${project.title}`} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600">⌫</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white/55 px-6 py-14 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-2xl shadow-sm">✦</div>
              <h3 className="mt-4 font-black text-slate-900">{isKk ? "Алғашқы жобаңызды жасаңыз" : "Создайте первый проект"}</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{isKk ? "Жоғарыда идеяңызды жазыңыз — код, дизайн және интерактивті алдын ала көріністі SanduAI өзі дайындайды." : "Опишите идею выше — SanduAI подготовит код, дизайн и интерактивный предпросмотр."}</p>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-3xl border border-white/80 bg-white/80 p-5 shadow-[0_14px_45px_rgba(15,23,42,0.06)] backdrop-blur lg:sticky lg:top-24">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">{isKk ? "Бастауға идеялар" : "Идеи для старта"}</p>
          <div className="mt-3 space-y-2">
            {BUILDER_EXAMPLES[language].map((example, index) => (
              <button key={example} type="button" onClick={() => onPromptChange(example)} className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left text-xs leading-5 text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-slate-900">
                <span className="mr-2 font-black text-orange-500">0{index + 1}</span>{example}
              </button>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-white">
            <p className="text-xs font-black">{isKk ? "Жақсы prompt формуласы" : "Формула хорошего prompt"}</p>
            <p className="mt-2 text-xs leading-5 text-slate-300">{isKk ? "Кім үшін + не істеуі керек + стиль + нәтиже қандай болуы керек." : "Для кого + что должно происходить + стиль + какой результат считать успешным."}</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
