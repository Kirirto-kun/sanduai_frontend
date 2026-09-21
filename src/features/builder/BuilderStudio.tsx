"use client";

import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GenerationJob } from "@/lib/api";
import { ACCEPTED_ASSET_TYPES, BUILDER_CATEGORIES, formatBytes } from "./copy";
import { builderApi } from "./api";
import {
  availableBuilderContentLanguages,
  compactBuilderContentLanguageLabel,
  normalizeBuilderContentLanguage,
} from "./language";
import {
  clearBuilderComposerDraft,
  isActiveBuilderJob,
  readBuilderComposerDraft,
  writeBuilderComposerDraft,
  type BuilderComposerDraft,
  type BuilderPersistenceScope,
} from "./persistence";
import PreviewFrame from "./PreviewFrame";
import type {
  BuilderAsset,
  BuilderBuildMode,
  BuilderConfig,
  BuilderContentLanguage,
  BuilderConsoleEntry,
  BuilderDevice,
  BuilderProject,
  BuilderTab,
  BuilderVersion,
  BuilderVisibility,
} from "./types";

type BuilderStudioProps = {
  language: "ru" | "kk";
  project: BuilderProject;
  versions: BuilderVersion[];
  config: BuilderConfig | null;
  busy: boolean;
  saving: boolean;
  error: string;
  generationJob: GenerationJob | null;
  pendingPrompt: string;
  retryDraft: BuilderComposerDraft | null;
  persistenceScope: BuilderPersistenceScope;
  onBack: () => void;
  onBuild: (prompt: string, mode: BuilderBuildMode, assetIds: string[], errors: string[], maxCost: number) => Promise<boolean>;
  onSaveFiles: (files: Record<string, string | null>, message: string) => Promise<boolean>;
  onRestore: (version: number) => Promise<void>;
  onUploadAsset: (file: File) => Promise<BuilderAsset | null>;
  onRemoveAsset: (assetId: string) => Promise<void>;
  onContentLanguageChange: (language: BuilderContentLanguage) => Promise<boolean>;
  onPublish: (visibility: BuilderVisibility, allowDuplicate: boolean) => Promise<BuilderProject | null>;
  onDownload: (format: "html" | "zip") => Promise<void>;
};

type MobilePane = "chat" | "preview" | "project";

const TABS: Array<{ key: BuilderTab; ru: string; kk: string; icon: string }> = [
  { key: "preview", ru: "Предпросмотр", kk: "Алдын ала көру", icon: "◫" },
  { key: "files", ru: "Файлы", kk: "Файлдар", icon: "⌘" },
  { key: "code", ru: "Код", kk: "Код", icon: "</>" },
  { key: "console", ru: "Консоль", kk: "Консоль", icon: "›_" },
  { key: "assets", ru: "Материалы", kk: "Материалдар", icon: "◇" },
  { key: "versions", ru: "Версии", kk: "Нұсқалар", icon: "↶" },
];

const DEVICES: Array<{ key: BuilderDevice; icon: string; ru: string; kk: string }> = [
  { key: "mobile", icon: "▯", ru: "Телефон", kk: "Телефон" },
  { key: "tablet", icon: "▭", ru: "Планшет", kk: "Планшет" },
  { key: "desktop", icon: "▱", ru: "Компьютер", kk: "Компьютер" },
];

function versionNumber(version: BuilderVersion): number {
  return version.number ?? version.version ?? 0;
}

function timeLabel(value?: string, language: "ru" | "kk" = "ru"): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  return new Intl.DateTimeFormat(language === "kk" ? "kk-KZ" : "ru-RU", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

function assetIcon(asset: Pick<BuilderAsset, "type" | "mime_type" | "filename">): string {
  const type = `${asset.type} ${asset.mime_type}`;
  if (type.includes("image")) return "🖼️";
  if (type.includes("video")) return "🎬";
  if (type.includes("audio")) return "🎵";
  if (type.includes("3d") || /\.(glb|gltf)$/i.test(asset.filename)) return "🧊";
  return "📎";
}

function BuilderGenerationProgress({
  job,
  language,
}: {
  job: GenerationJob;
  language: "ru" | "kk";
}) {
  const isKk = language === "kk";
  const current = Number(job.progress?.current ?? 0);
  const total = Number(job.progress?.total ?? 0);
  const determinate = Number.isFinite(current) && Number.isFinite(total) && total > 0;
  const progress = determinate ? Math.max(6, Math.min(96, (current / total) * 100)) : 48;
  const title = job.status === "queued"
    ? isKk ? "Сұрау кезекке қабылданды" : "Запрос принят в очередь"
    : job.status === "settling"
      ? isKk ? "Жобаны сақтап жатырмыз" : "Сохраняем проект"
      : job.status === "refunding"
        ? isKk ? "Монеталарды қайтарып жатырмыз" : "Возвращаем монеты"
        : isKk ? "Жобаны құрастырып жатырмын…" : "Собираю проект…";
  return (
    <div className="mr-3 rounded-2xl rounded-bl-md border border-orange-100 bg-orange-50/70 p-3" aria-live="polite">
      <div className="flex items-center gap-2">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-r-transparent" />
        <span className="text-xs font-bold text-slate-700">{title}</span>
      </div>
      <p className="mt-1.5 text-[10px] leading-4 text-slate-500">
        {isKk
          ? "Бетті жабуға немесе жаңартуға болады — жұмыс серверде жалғасады және осы жерден қалпына келеді."
          : "Страницу можно закрыть или обновить — работа продолжится на сервере и восстановится здесь."}
      </p>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-orange-100"
        role="progressbar"
        aria-label={title}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={determinate ? Math.round(Math.max(0, Math.min(100, (current / total) * 100))) : undefined}
      >
        <div
          className={`h-full rounded-full bg-gradient-to-r from-orange-500 to-emerald-500 transition-[width] duration-500 ${determinate ? "" : "animate-pulse"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {determinate && (
        <p className="mt-1 text-right text-[9px] font-semibold text-slate-400">
          {Math.max(0, Math.trunc(current))}/{Math.max(1, Math.trunc(total))}
        </p>
      )}
    </div>
  );
}

function codeDraftStorageKey(
  projectId: string,
  persistenceScope: BuilderPersistenceScope,
): string | null {
  const scope = persistenceScope?.trim();
  return scope ? `sandu-builder-draft:v2:${encodeURIComponent(scope)}:${projectId}` : null;
}

function restoredDraft(
  project: BuilderProject,
  persistenceScope: BuilderPersistenceScope,
): Record<string, string> {
  if (typeof window === "undefined") return project.files;
  const storageKey = codeDraftStorageKey(project.id, persistenceScope);
  if (!storageKey) return project.files;
  try {
    sessionStorage.removeItem(`sandu-builder-draft:${project.id}`);
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return project.files;
    const stored = JSON.parse(raw) as { version?: number; files?: Record<string, string> };
    if (stored.version === project.current_version && stored.files && typeof stored.files === "object") return stored.files;
    sessionStorage.removeItem(storageKey);
  } catch {
    // Corrupt or over-quota browser storage must not block the editor.
  }
  return project.files;
}

function PublishDialog({
  language, project, busy, onClose, onPublish,
}: {
  language: "ru" | "kk";
  project: BuilderProject;
  busy: boolean;
  onClose: () => void;
  onPublish: (visibility: BuilderVisibility, allowDuplicate: boolean) => Promise<BuilderProject | null>;
}) {
  const isKk = language === "kk";
  const [visibility, setVisibility] = useState<BuilderVisibility>(project.visibility);
  const [allowDuplicate, setAllowDuplicate] = useState(Boolean(project.allow_duplicate));
  const [publishedUrl, setPublishedUrl] = useState(project.share_url ?? project.deployment_url ?? "");
  const [copied, setCopied] = useState(false);
  const publicationIsStale = Boolean(publishedUrl && project.published_version !== project.current_version);

  const publish = async () => {
    const updated = await onPublish(visibility, allowDuplicate);
    if (updated) setPublishedUrl(updated.share_url ?? updated.deployment_url ?? "");
  };

  const copy = async () => {
    if (!publishedUrl) return;
    await navigator.clipboard.writeText(publishedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1_500);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-3 backdrop-blur-sm" onMouseDown={event => { if (event.currentTarget === event.target) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="publish-title" className="max-h-[calc(100vh-24px)] w-full max-w-lg overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">SANDU PUBLISH</p>
            <h2 id="publish-title" className="mt-1 text-2xl font-black text-slate-950">{isKk ? "Жобаны жариялау" : "Опубликовать проект"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={isKk ? "Жабу" : "Закрыть"} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100">×</button>
        </div>

        {publishedUrl ? (
          <div className="mt-6 text-center">
            <div className="mx-auto w-fit rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><QRCodeSVG value={publishedUrl} size={176} level="M" /></div>
            <p className={`mt-4 text-sm font-black ${publicationIsStale ? "text-amber-700" : "text-emerald-700"}`}>
              {publicationIsStale
                ? (isKk ? `Сілтемеде v${project.published_version ?? "—"}, редакторда v${project.current_version}` : `По ссылке v${project.published_version ?? "—"}, в редакторе v${project.current_version}`)
                : (isKk ? `Жоба жарияланды · v${project.published_version ?? project.current_version}` : `Проект опубликован · v${project.published_version ?? project.current_version}`)}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{isKk ? "QR-кодты сканерлеңіз немесе сілтемені бөлісіңіз." : "Отсканируйте QR-код или поделитесь ссылкой."}</p>
            <div className="mt-4 flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <input readOnly value={publishedUrl} aria-label={isKk ? "Жоба сілтемесі" : "Ссылка на проект"} className="min-w-0 flex-1 bg-transparent px-3 text-xs text-slate-600 outline-none" />
              <button type="button" onClick={copy} className="min-h-10 shrink-0 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white">{copied ? (isKk ? "Көшірілді" : "Скопировано") : (isKk ? "Көшіру" : "Копировать")}</button>
            </div>
            {publicationIsStale && (
              <button type="button" onClick={publish} disabled={busy} className="mt-3 min-h-11 w-full rounded-xl bg-orange-600 px-4 text-xs font-black text-white hover:bg-orange-700 disabled:opacity-50">
                {busy ? (isKk ? "Жаңартылуда…" : "Обновляем…") : (isKk ? `Сілтемені v${project.current_version} нұсқасына жаңарту` : `Обновить ссылку до v${project.current_version}`)}
              </button>
            )}
            <button type="button" onClick={() => setPublishedUrl("")} className="mt-3 min-h-10 rounded-xl px-4 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900">{isKk ? "Қолжетімділікті өзгерту" : "Изменить доступ"}</button>
          </div>
        ) : (
          <>
            <div className="mt-6 space-y-2">
              <button type="button" onClick={() => setVisibility("private")} className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${visibility === "private" ? "border-orange-400 bg-orange-50" : "border-slate-200 hover:bg-slate-50"}`}>
                <span className="text-xl">🔒</span><span><strong className="block text-sm text-slate-900">{isKk ? "Жеке жоба" : "Приватный проект"}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{isKk ? "Жобаны тек сіз көре аласыз. Бұрынғы сілтеме жабылады." : "Проект виден только вам. Ранее опубликованная ссылка перестанет работать."}</span></span>
              </button>
              <button type="button" onClick={() => setVisibility("link")} className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${visibility === "link" ? "border-orange-400 bg-orange-50" : "border-slate-200 hover:bg-slate-50"}`}>
                <span className="text-xl">🔗</span><span><strong className="block text-sm text-slate-900">{isKk ? "Сілтемесі бар адамдар" : "Доступ по ссылке"}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{isKk ? "Іздеуде көрінбейді. Сілтемесі бар адам аша алады." : "Не появится в поиске. Откроется у тех, кому вы отправите ссылку."}</span></span>
              </button>
              <button type="button" onClick={() => setVisibility("public")} className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${visibility === "public" ? "border-orange-400 bg-orange-50" : "border-slate-200 hover:bg-slate-50"}`}>
                <span className="text-xl">🌍</span><span><strong className="block text-sm text-slate-900">{isKk ? "Ашық жоба" : "Публичный проект"}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{isKk ? "Барлығына ашық және галереяда көрсетілуі мүмкін." : "Доступен всем и может появиться в галерее проектов."}</span></span>
              </button>
            </div>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl bg-slate-50 p-4">
              <input type="checkbox" checked={allowDuplicate} onChange={event => setAllowDuplicate(event.target.checked)} className="mt-0.5 h-4 w-4 accent-orange-600" />
              <span><strong className="block text-xs text-slate-800">{isKk ? "Көшірме жасауға рұқсат беру" : "Разрешить копирование"}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{isKk ? "Басқалар жобаны өз аккаунтына көшіре алады." : "Другие смогут сделать собственную копию проекта."}</span></span>
            </label>
            <button type="button" onClick={publish} disabled={busy} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 disabled:opacity-50">
              {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />}{busy ? (isKk ? "Сақталуда…" : "Сохраняем…") : visibility === "private" ? (isKk ? "Жобаны жасыру" : "Сделать приватным") : (isKk ? "Жариялау" : "Опубликовать")}
            </button>
          </>
        )}
      </section>
    </div>
  );
}

export default function BuilderStudio(props: BuilderStudioProps) {
  const {
    language, project, versions, config, busy, saving, error, onBack, onBuild,
    generationJob, pendingPrompt, retryDraft, onSaveFiles, onRestore, onUploadAsset,
    persistenceScope, onRemoveAsset, onContentLanguageChange, onPublish, onDownload,
  } = props;
  const isKk = language === "kk";
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const retryDraftAppliedRef = useRef<number | null>(null);
  const draftStorageKey = codeDraftStorageKey(project.id, persistenceScope);
  const [activeTab, setActiveTab] = useState<BuilderTab>("preview");
  const [mobilePane, setMobilePane] = useState<MobilePane>("preview");
  const [device, setDevice] = useState<BuilderDevice>("desktop");
  const [selectedFile, setSelectedFile] = useState("");
  const [draftFiles, setDraftFiles] = useState<Record<string, string>>(() => restoredDraft(project, persistenceScope));
  const [message, setMessage] = useState("");
  const [attachedAssetIds, setAttachedAssetIds] = useState<string[]>([]);
  const [composerHydratedProject, setComposerHydratedProject] = useState("");
  const [uploading, setUploading] = useState(false);
  const [consoleEntries, setConsoleEntries] = useState<BuilderConsoleEntry[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [publishOpen, setPublishOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [messageQuote, setMessageQuote] = useState<{ key: string; tokens: number } | null>(null);
  const [fixQuote, setFixQuote] = useState<{ key: string; tokens: number } | null>(null);
  const [attachmentNotice, setAttachmentNotice] = useState("");

  const fileNames = useMemo(() => Object.keys(draftFiles).sort((left, right) => {
    if (left === "index.html") return -1;
    if (right === "index.html") return 1;
    return left.localeCompare(right);
  }), [draftFiles]);
  const currentFile = selectedFile && selectedFile in draftFiles ? selectedFile : fileNames[0] ?? "";
  const dirtyFiles = useMemo(() => Object.keys(draftFiles).filter(path => draftFiles[path] !== project.files[path]), [draftFiles, project.files]);
  const hasDirtyFiles = dirtyFiles.length > 0;
  const mutationBusy = busy || saving || uploading;
  const activeBuilderGeneration = isActiveBuilderJob(generationJob);
  const buildMode: BuilderBuildMode = project.current_version === 0 ? "generate" : "edit";
  const messageQuoteKey = useMemo(
    () => JSON.stringify([buildMode, project.project_type, message.trim(), attachedAssetIds.length]),
    [attachedAssetIds.length, buildMode, message, project.project_type],
  );
  const editCost = messageQuote?.key === messageQuoteKey ? messageQuote.tokens : null;
  const runtimeErrors = useMemo(
    () => consoleEntries.filter(entry => entry.level === "error").map(entry => entry.message).slice(0, 30),
    [consoleEntries],
  );
  const fixPrompt = isKk ? "Консольдегі қателерді түзет. Жұмыс істеп тұрған бөліктерді өзгертпе." : "Исправь ошибки из консоли. Не меняй уже работающие части проекта.";
  const fixQuoteKey = useMemo(
    () => JSON.stringify([project.project_type, fixPrompt, runtimeErrors]),
    [fixPrompt, project.project_type, runtimeErrors],
  );
  const fixCost = fixQuote?.key === fixQuoteKey ? fixQuote.tokens : null;
  const accept = Object.values(config?.accepted_asset_types ?? {}).flat().join(",") || ACCEPTED_ASSET_TYPES;
  const maxProjectAssets = config?.limits?.max_assets ?? 60;
  const category = BUILDER_CATEGORIES.find(item => item.type === project.project_type);
  const contentLanguages = useMemo(
    () => availableBuilderContentLanguages(config?.content_languages),
    [config?.content_languages],
  );
  const contentLanguage = normalizeBuilderContentLanguage(project.content_language, contentLanguages);

  useEffect(() => {
    setDraftFiles(restoredDraft(project, persistenceScope));
    setSelectedFile(current => current && project.files[current] !== undefined ? current : Object.keys(project.files)[0] ?? "");
    setRefreshKey(value => value + 1);
  }, [persistenceScope, project]);

  useEffect(() => {
    const draft = readBuilderComposerDraft(project.id, persistenceScope);
    setMessage(draft?.message ?? "");
    setAttachedAssetIds((draft?.assetIds ?? []).filter((id) =>
      project.assets.some((asset) => asset.id === id)).slice(0, 12));
    setAttachmentNotice(draft?.unuploadedAttachmentNames?.length
      ? isKk
        ? `Қауіпсіздік үшін мына файлдарды қайта тіркеңіз: ${draft.unuploadedAttachmentNames.join(", ")}`
        : `Из соображений безопасности прикрепите файлы заново: ${draft.unuploadedAttachmentNames.join(", ")}`
      : "");
    setComposerHydratedProject(project.id);
  }, [isKk, persistenceScope, project.assets, project.id]);

  useEffect(() => {
    if (!retryDraft || retryDraftAppliedRef.current === retryDraft.updatedAt) return;
    retryDraftAppliedRef.current = retryDraft.updatedAt;
    setMessage(retryDraft.message);
    setAttachedAssetIds(retryDraft.assetIds.filter((id) =>
      project.assets.some((asset) => asset.id === id)).slice(0, 12));
  }, [project.assets, retryDraft]);

  useEffect(() => {
    if (!isActiveBuilderJob(generationJob) || !pendingPrompt) return;
    setMessage("");
    setAttachedAssetIds([]);
    setAttachmentNotice("");
    clearBuilderComposerDraft(project.id, persistenceScope);
  }, [generationJob, pendingPrompt, persistenceScope, project.id]);

  useEffect(() => {
    setAttachedAssetIds(ids => ids.filter(id => project.assets.some(asset => asset.id === id)).slice(0, 12));
  }, [project.assets]);

  useEffect(() => {
    if (composerHydratedProject !== project.id || isActiveBuilderJob(generationJob)) return;
    writeBuilderComposerDraft(project.id, {
      version: 1,
      message,
      assetIds: attachedAssetIds,
      updatedAt: Date.now(),
    }, persistenceScope);
  }, [attachedAssetIds, composerHydratedProject, generationJob, message, persistenceScope, project.id]);

  useEffect(() => {
    if (!hasDirtyFiles) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasDirtyFiles]);

  useEffect(() => {
    if (message.trim().length < 3) {
      setMessageQuote(null);
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      builderApi.estimate({
        mode: buildMode,
        project_type: project.project_type,
        prompt: message.trim(),
        media_count: attachedAssetIds.length,
      }).then(estimate => {
        if (active) setMessageQuote({ key: messageQuoteKey, tokens: estimate.tokens });
      }).catch(() => {
        if (active) setMessageQuote(null);
      });
    }, 350);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [attachedAssetIds.length, buildMode, message, messageQuoteKey, project.project_type]);

  useEffect(() => {
    if (runtimeErrors.length === 0) {
      setFixQuote(null);
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      builderApi.estimate({
        mode: "fix",
        project_type: project.project_type,
        prompt: fixPrompt,
        media_count: 0,
      }).then(estimate => {
        if (active) setFixQuote({ key: fixQuoteKey, tokens: estimate.tokens });
      }).catch(() => {
        if (active) setFixQuote(null);
      });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [fixPrompt, fixQuoteKey, project.project_type, runtimeErrors.length]);

  const addConsole = useCallback((entry: BuilderConsoleEntry) => {
    setConsoleEntries(entries => [...entries.slice(-199), entry]);
  }, []);

  const send = async (mode: BuilderBuildMode = buildMode) => {
    const trimmed = message.trim();
    if (trimmed.length < 3 || mutationBusy || hasDirtyFiles || editCost === null) return;
    const errors = mode === "fix" ? runtimeErrors : [];
    const succeeded = await onBuild(trimmed, mode, attachedAssetIds, errors, editCost);
    if (!succeeded) return;
    setMessage("");
    setAttachedAssetIds([]);
    setMobilePane("preview");
  };

  const fixErrors = async () => {
    if (runtimeErrors.length === 0 || fixCost === null || mutationBusy || hasDirtyFiles) return;
    const succeeded = await onBuild(fixPrompt, "fix", [], runtimeErrors, fixCost);
    if (succeeded) setActiveTab("preview");
  };

  const toggleAttachedAsset = (assetId: string) => {
    setAttachmentNotice("");
    setAttachedAssetIds(ids => {
      if (ids.includes(assetId)) return ids.filter(id => id !== assetId);
      if (ids.length >= 12) {
        setAttachmentNotice(isKk ? "Бір сұрауға ең көбі 12 файл." : "Не больше 12 файлов в одном запросе.");
        return ids;
      }
      return [...ids, assetId];
    });
  };

  const uploadFiles = async (files: File[]) => {
    if (mutationBusy || hasDirtyFiles || project.assets.length >= maxProjectAssets) return;
    setAttachmentNotice("");
    setUploading(true);
    try {
      const remaining = Math.max(0, maxProjectAssets - project.assets.length);
      for (const file of files.slice(0, remaining)) {
        const asset = await onUploadAsset(file);
        if (asset) setAttachedAssetIds(ids => ids.includes(asset.id) || ids.length >= 12 ? ids : [...ids, asset.id]);
      }
    } finally {
      setUploading(false);
    }
  };

  const saveCode = async () => {
    if (dirtyFiles.length === 0 || mutationBusy) return;
    const patch = Object.fromEntries(dirtyFiles.map(path => [path, draftFiles[path]]));
    await onSaveFiles(patch, isKk ? "Код қолмен өзгертілді" : "Код изменён вручную");
  };

  const deleteCurrentFile = async () => {
    if (!currentFile || currentFile === "index.html" || hasDirtyFiles || mutationBusy) return;
    await onSaveFiles({ [currentFile]: null }, `${isKk ? "Файл жойылды" : "Файл удалён"}: ${currentFile}`);
  };

  const goBack = () => {
    if (mutationBusy) return;
    if (hasDirtyFiles && !window.confirm(isKk ? "Сақталмаған код өзгерістерін тастау керек пе?" : "Отменить несохранённые изменения кода?")) return;
    if (hasDirtyFiles && draftStorageKey) sessionStorage.removeItem(draftStorageKey);
    onBack();
  };

  const updateDraftFile = (path: string, value: string) => {
    setDraftFiles(files => {
      const next = { ...files, [path]: value };
      try {
        const dirty = Object.keys(next).some(filePath => next[filePath] !== project.files[filePath]);
        if (draftStorageKey) {
          if (dirty) sessionStorage.setItem(draftStorageKey, JSON.stringify({ version: project.current_version, files: next }));
          else sessionStorage.removeItem(draftStorageKey);
        }
      } catch {
        // The beforeunload guard remains active if browser storage is full.
      }
      return next;
    });
  };

  const renderCodeEditor = () => (
    <div className="grid h-full min-h-0 grid-cols-[150px_minmax(0,1fr)] bg-[#111827] sm:grid-cols-[190px_minmax(0,1fr)]">
      <aside className="min-h-0 overflow-y-auto border-r border-white/10 bg-[#0b1220] p-2">
        <p className="px-2 pb-2 pt-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Explorer</p>
        {fileNames.map(path => (
          <button key={path} type="button" onClick={() => setSelectedFile(path)} className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[11px] transition ${currentFile === path ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}>
            <span className={path.endsWith(".html") ? "text-orange-400" : path.endsWith(".css") ? "text-sky-400" : "text-yellow-300"}>●</span>
            <span className="truncate">{path}</span>
          </button>
        ))}
      </aside>
      <div className="flex min-h-0 min-w-0 flex-col">
        <div className="flex min-h-10 items-center justify-between border-b border-white/10 bg-[#111827] px-3">
          <span className="truncate font-mono text-[11px] text-slate-400">{currentFile}</span>
          <div className="flex items-center gap-1">
            {currentFile !== "index.html" && <button type="button" onClick={deleteCurrentFile} disabled={mutationBusy || hasDirtyFiles} className="rounded px-2 py-1 text-[10px] text-slate-500 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-35">{isKk ? "Жою" : "Удалить"}</button>}
            <button type="button" onClick={saveCode} disabled={mutationBusy || dirtyFiles.length === 0} className="rounded-lg bg-orange-500 px-3 py-1.5 text-[10px] font-black text-white disabled:opacity-35">{saving ? "…" : (isKk ? "Сақтау" : "Сохранить")}</button>
          </div>
        </div>
        {currentFile ? (
          <textarea
            value={draftFiles[currentFile] ?? ""}
            onChange={event => updateDraftFile(currentFile, event.target.value)}
            disabled={mutationBusy}
            spellCheck={false}
            aria-label={`${isKk ? "Код файлы" : "Код файла"} ${currentFile}`}
            className="min-h-0 flex-1 resize-none bg-[#111827] p-4 font-mono text-[12px] leading-6 text-slate-200 outline-none selection:bg-orange-500/30"
          />
        ) : <p className="m-auto text-xs text-slate-500">{isKk ? "Файл жоқ" : "Нет файлов"}</p>}
      </div>
    </div>
  );

  const renderConsole = () => (
    <div className="flex h-full min-h-0 flex-col bg-[#0b1220] text-slate-300">
      <div className="flex min-h-11 items-center justify-between border-b border-white/10 px-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Консоль · {consoleEntries.length}</span>
        <div className="flex gap-1">
          {runtimeErrors.length > 0 && <button type="button" onClick={fixErrors} disabled={mutationBusy || hasDirtyFiles || fixCost === null} className="rounded-lg bg-violet-500/15 px-3 py-1.5 text-[10px] font-black text-violet-300 hover:bg-violet-500/25 disabled:opacity-35">✦ {isKk ? "ЖИ-мен түзету" : "Исправить с ИИ"}{fixCost !== null ? ` · ${fixCost}` : " · …"}</button>}
          <button type="button" onClick={() => setConsoleEntries([])} className="rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-white/5 hover:text-slate-300">{isKk ? "Тазарту" : "Очистить"}</button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-5">
        {consoleEntries.length === 0 ? <p className="text-slate-600">{isKk ? "Консоль хабарлары осында шығады." : "Сообщения консоли появятся здесь."}</p> : consoleEntries.map(entry => (
          <div key={entry.id} className={`border-b border-white/5 py-1.5 ${entry.level === "error" ? "text-red-300" : entry.level === "warn" ? "text-amber-300" : "text-slate-400"}`}>
            <span className="mr-2 opacity-50">{new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>{entry.message}
          </div>
        ))}
      </div>
    </div>
  );

  const renderAssets = () => (
    <div className="h-full overflow-y-auto bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div><h3 className="text-sm font-black text-slate-900">{isKk ? "Жоба материалдары" : "Материалы проекта"}</h3><p className="mt-0.5 text-xs text-slate-500">{isKk ? "Сурет, видео, дыбыс және 3D модельдер" : "Изображения, видео, аудио и 3D-модели"}</p></div>
        <button type="button" onClick={() => uploadInputRef.current?.click()} disabled={mutationBusy || hasDirtyFiles || project.assets.length >= maxProjectAssets} className="min-h-10 rounded-xl bg-slate-950 px-4 text-xs font-black text-white disabled:opacity-50">{uploading ? "…" : `＋ ${isKk ? "Жүктеу" : "Загрузить"}`}</button>
      </div>
      {project.assets.length > 0 ? <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {project.assets.map(asset => (
          <div key={asset.id} className={`flex items-center gap-3 rounded-2xl border p-3 ${attachedAssetIds.includes(asset.id) ? "border-orange-300 bg-orange-50" : "border-slate-200"}`}>
            <button type="button" onClick={() => toggleAttachedAsset(asset.id)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-lg" aria-label={isKk ? "Prompt-қа қосу" : "Добавить к prompt"}>{assetIcon(asset)}</button>
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-800">{asset.filename}</p><p className="mt-0.5 text-[10px] text-slate-400">{formatBytes(asset.size_bytes ?? asset.size)} · {asset.type}</p></div>
            <button type="button" disabled={mutationBusy || hasDirtyFiles} onClick={() => onRemoveAsset(asset.id)} aria-label={`${isKk ? "Жою" : "Удалить"}: ${asset.filename}`} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-35">×</button>
          </div>
        ))}
      </div> : <div className="mt-8 rounded-3xl border border-dashed border-slate-300 p-10 text-center text-xs text-slate-500">{isKk ? "Әзірге материалдар жоқ. Келесі сұрауға тіркеңіз." : "Пока нет материалов. Прикрепите их к следующему запросу."}</div>}
    </div>
  );

  const renderVersions = () => (
    <div className="h-full overflow-y-auto bg-white p-4">
      <div><h3 className="text-sm font-black text-slate-900">{isKk ? "Нұсқалар тарихы" : "История версий"}</h3><p className="mt-0.5 text-xs text-slate-500">{isKk ? "Әр ЖИ өзгерісінен кейін snapshot сақталады." : "После каждого изменения ИИ сохраняется snapshot."}</p></div>
      <div className="relative mt-5 space-y-3 before:absolute before:bottom-3 before:left-[17px] before:top-3 before:w-px before:bg-slate-200">
        {versions.map(version => {
          const number = versionNumber(version);
          const current = number === project.current_version;
          return <article key={version.id ?? number} className="relative flex gap-3">
            <div className={`relative z-[1] mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full border-4 border-white text-[10px] font-black ${current ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500"}`}>{number}</div>
            <div className={`min-w-0 flex-1 rounded-2xl border p-3 ${current ? "border-orange-200 bg-orange-50" : "border-slate-200"}`}>
              <div className="flex items-start justify-between gap-2"><div><p className="text-xs font-black text-slate-800">{version.summary || version.prompt || `${isKk ? "Нұсқа" : "Версия"} ${number}`}</p><p className="mt-1 text-[10px] text-slate-400">{timeLabel(version.created_at, language)} · {version.changed_files.length} {isKk ? "файл" : "файлов"}</p></div>{!current && <button type="button" onClick={() => onRestore(number)} disabled={mutationBusy || hasDirtyFiles} className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-black text-orange-600 hover:bg-orange-100 disabled:opacity-35">{isKk ? "Қалпына келтіру" : "Восстановить"}</button>}</div>
              {version.prompt && version.summary && <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-slate-500">{version.prompt}</p>}
            </div>
          </article>;
        })}
        {versions.length === 0 && <p className="pl-12 text-xs text-slate-500">{isKk ? "Нұсқалар әлі жоқ." : "Версий пока нет."}</p>}
      </div>
    </div>
  );

  const renderMain = () => {
    if (activeTab === "preview") return <PreviewFrame files={draftFiles} assets={project.assets} device={device} language={language} refreshKey={refreshKey} onConsole={addConsole} />;
    if (activeTab === "code" || activeTab === "files") return renderCodeEditor();
    if (activeTab === "console") return renderConsole();
    if (activeTab === "assets") return renderAssets();
    return renderVersions();
  };

  return (
    <div className="-mx-2 -mt-4 flex h-[calc(100vh-4.6rem)] min-h-[650px] flex-col overflow-hidden bg-[#f6f7f9] sm:-mx-4 md:-mx-6 lg:-mx-8">
      <input ref={uploadInputRef} type="file" multiple accept={accept} onChange={event => { uploadFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} className="sr-only" />

      <header className="flex min-h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-2 sm:px-4">
        <button type="button" onClick={goBack} disabled={mutationBusy} aria-label={isKk ? "Жобаларға оралу" : "Вернуться к проектам"} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 disabled:opacity-35">←</button>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="min-w-0 flex-1 truncate text-sm font-black text-slate-950">{project.title}</h1>
            <span className="hidden rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-500 sm:inline">v{project.current_version}</span>
            <label className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-1.5 text-[10px] font-bold text-slate-600 focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100" title={isKk ? "Жоба контентінің тілі" : "Язык контента проекта"}>
              <span aria-hidden="true">🌐</span>
              <span className="sr-only">{isKk ? "Жоба контентінің тілі" : "Язык контента проекта"}</span>
              <select
                value={contentLanguage}
                onChange={event => { void onContentLanguageChange(event.target.value as BuilderContentLanguage); }}
                disabled={mutationBusy || hasDirtyFiles}
                className="max-w-24 bg-transparent py-0.5 font-bold text-slate-700 outline-none disabled:opacity-50 sm:max-w-32"
              >
                {contentLanguages.map(item => <option key={item} value={item}>{compactBuilderContentLanguageLabel(item)}</option>)}
              </select>
            </label>
          </div>
          <p className={`truncate text-[10px] ${hasDirtyFiles ? "font-bold text-orange-600" : "text-slate-400"}`}>{category?.icon} {isKk ? category?.kk : category?.ru} · {saving ? (isKk ? "Сақталуда…" : "Сохраняем…") : hasDirtyFiles ? (isKk ? "Сақталмаған өзгерістер" : "Есть несохранённые изменения") : (isKk ? "Сақталды" : "Сохранено")}</p>
        </div>

        <div className="hidden items-center rounded-xl bg-slate-100 p-1 lg:flex">
          {DEVICES.map(item => <button key={item.key} type="button" onClick={() => { setDevice(item.key); setActiveTab("preview"); }} aria-label={isKk ? item.kk : item.ru} aria-pressed={device === item.key} className={`grid h-8 w-9 place-items-center rounded-lg text-base transition ${device === item.key ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-slate-700"}`}>{item.icon}</button>)}
        </div>
        <button type="button" onClick={() => setRefreshKey(key => key + 1)} className="hidden h-9 items-center gap-1 rounded-xl px-3 text-xs font-bold text-slate-500 hover:bg-slate-100 sm:flex">↻ <span className="hidden xl:inline">{isKk ? "Жаңарту" : "Обновить"}</span></button>
        <div className="relative">
          <button type="button" onClick={() => setDownloadOpen(open => !open)} disabled={mutationBusy || hasDirtyFiles} className="hidden min-h-9 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-35 sm:block">↓ {isKk ? "Жүктеу" : "Скачать"}</button>
          {downloadOpen && <div className="absolute right-0 top-11 z-30 w-44 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl"><button type="button" onClick={() => { setDownloadOpen(false); onDownload("html"); }} className="w-full rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50">HTML</button><button type="button" onClick={() => { setDownloadOpen(false); onDownload("zip"); }} className="w-full rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50">ZIP source</button></div>}
        </div>
        <button type="button" onClick={() => setPublishOpen(true)} disabled={mutationBusy || hasDirtyFiles} className="min-h-9 shrink-0 rounded-xl bg-orange-600 px-3 text-xs font-black text-white shadow-sm transition hover:bg-orange-700 disabled:opacity-35 sm:px-4">{isKk ? "Жариялау" : "Опубликовать"}</button>
      </header>

      <nav role="tablist" className="grid shrink-0 grid-cols-3 border-b border-slate-200 bg-white lg:hidden" aria-label={isKk ? "Builder бөлімдері" : "Разделы Builder"}>
        {(["chat", "preview", "project"] as MobilePane[]).map(pane => <button key={pane} role="tab" aria-selected={mobilePane === pane} type="button" onClick={() => setMobilePane(pane)} className={`min-h-11 border-b-2 text-xs font-black ${mobilePane === pane ? "border-orange-500 text-orange-600" : "border-transparent text-slate-500"}`}>{pane === "chat" ? (isKk ? "ЖИ чат" : "ИИ-чат") : pane === "preview" ? (isKk ? "Көрініс" : "Просмотр") : (isKk ? "Жоба" : "Проект")}</button>)}
      </nav>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[310px_minmax(420px,1fr)_330px] xl:grid-cols-[340px_minmax(480px,1fr)_360px]">
        <aside className={`${mobilePane === "chat" ? "flex" : "hidden"} min-h-0 flex-col border-r border-slate-200 bg-white lg:flex`}>
          <div className="border-b border-slate-100 px-4 py-3"><p className="text-xs font-black text-slate-900">SanduAI Builder</p><p className="mt-0.5 text-[10px] text-slate-400">{isKk ? "Жобаны сөзбен өзгертіңіз" : "Меняйте проект обычными словами"}</p></div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {project.chat_history.length === 0 && <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-emerald-50 p-4"><div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg shadow-sm">✦</div><p className="mt-3 text-xs font-black text-slate-800">{isKk ? "Не жасағыңыз келеді?" : "Что создадим?"}</p><p className="mt-1 text-xs leading-5 text-slate-500">{isKk ? "Идеяңызды сипаттаңыз. Құрылымын жоспарлап, кодын жазып, preview-да көрсетемін." : "Опишите идею. Я спланирую структуру, напишу код и покажу результат в preview."}</p></div>}
            {project.chat_history.map((entry, index) => <div key={`${entry.created_at ?? "message"}-${index}`} className={entry.role === "user" ? "ml-7" : "mr-3"}>
              <div className={`rounded-2xl px-3.5 py-3 text-xs leading-5 ${entry.role === "user" ? "rounded-br-md bg-slate-950 text-white" : "rounded-bl-md bg-slate-100 text-slate-700"}`}>{entry.content}</div>
              {entry.created_at && <p className={`mt-1 text-[9px] text-slate-400 ${entry.role === "user" ? "text-right" : ""}`}>{timeLabel(entry.created_at, language)}</p>}
            </div>)}
            {project.plan && project.plan.length > 0 && <div className="rounded-2xl border border-violet-100 bg-violet-50 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-violet-600">{isKk ? "Жоба жоспары" : "План проекта"}</p><ol className="mt-2 space-y-1.5">{project.plan.map((item, index) => <li key={`${item}-${index}`} className="flex gap-2 text-[11px] leading-4 text-violet-900"><span className="font-black text-violet-400">{index + 1}.</span>{item}</li>)}</ol></div>}
            {activeBuilderGeneration && pendingPrompt && (
              <div className="ml-7 rounded-2xl rounded-br-md bg-slate-950 px-3.5 py-3 text-xs leading-5 text-white">
                {pendingPrompt}
              </div>
            )}
            {activeBuilderGeneration && generationJob ? (
              <BuilderGenerationProgress job={generationJob} language={language} />
            ) : busy && !generationJob ? (
              <div className="mr-3 rounded-2xl rounded-bl-md bg-slate-100 p-3" aria-live="polite"><div className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-r-transparent" /><span className="text-xs font-bold text-slate-600">{isKk ? "Сұрауды серверге жіберіп жатырмыз…" : "Передаём запрос серверу…"}</span></div><p className="mt-1.5 text-[10px] leading-4 text-slate-500">{isKk ? "Сервер тапсырманы қабылдағанша бетті жаппаңыз." : "Не закрывайте страницу, пока сервер не примет задачу."}</p><div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-orange-500 to-emerald-500" /></div></div>
            ) : null}
          </div>
          {error && <p role="alert" className="mx-3 mb-2 rounded-xl bg-red-50 p-2.5 text-[11px] leading-4 text-red-700">{error}</p>}
          <div className="border-t border-slate-100 p-3">
            {attachedAssetIds.length > 0 && <div className="mb-2 flex flex-wrap gap-1">{attachedAssetIds.map(id => { const asset = project.assets.find(item => item.id === id); return <button type="button" key={id} onClick={() => toggleAttachedAsset(id)} className="max-w-32 truncate rounded-lg bg-orange-50 px-2 py-1 text-[9px] font-bold text-orange-700">{asset ? `${assetIcon(asset)} ${asset.filename}` : id} ×</button>; })}</div>}
            {attachmentNotice && <p role="status" className="mb-2 text-[10px] font-semibold text-amber-700">{attachmentNotice}</p>}
            <div className="rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100">
              <textarea aria-label={isKk ? "Жобаға өзгеріс сұрауы" : "Запрос на изменение проекта"} value={message} maxLength={12_000} onChange={event => setMessage(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} rows={3} disabled={mutationBusy || hasDirtyFiles} placeholder={hasDirtyFiles ? (isKk ? "Алдымен кодты сақтаңыз" : "Сначала сохраните изменения кода") : (isKk ? "Не өзгертеміз?" : "Что изменить или добавить?")} className="w-full resize-none border-0 bg-transparent px-2 py-1.5 text-xs leading-5 text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-55" />
              <div className="flex items-center justify-between"><button type="button" onClick={() => uploadInputRef.current?.click()} disabled={mutationBusy || hasDirtyFiles || project.assets.length >= maxProjectAssets} aria-label={isKk ? "Файл тіркеу" : "Прикрепить файл"} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-35">＋</button><div className="flex items-center gap-2"><span className="text-[9px] font-bold text-slate-400">{message.trim().length >= 3 ? editCost !== null ? `${editCost} ${isKk ? "монета" : "монет"}` : (isKk ? "Баға…" : "Цена…") : `${message.length}/12000`}</span><button type="button" onClick={() => send()} disabled={mutationBusy || hasDirtyFiles || message.trim().length < 3 || editCost === null} aria-label={isKk ? "Жіберу" : "Отправить"} className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950 text-white transition hover:bg-orange-600 disabled:opacity-30">↑</button></div></div>
            </div>
            <p className="mt-1.5 text-center text-[9px] text-slate-400">Enter — {isKk ? "жіберу" : "отправить"} · Shift+Enter — {isKk ? "жаңа жол" : "новая строка"}</p>
          </div>
        </aside>

        <main className={`${mobilePane === "preview" ? "flex" : "hidden"} min-h-0 min-w-0 flex-col bg-[#eef1f5] lg:flex`}>
          <div className="flex min-h-11 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-2">
            <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto">
              {TABS.map(tab => <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-bold transition ${activeTab === tab.key ? "bg-slate-100 text-slate-950" : "text-slate-400 hover:text-slate-700"}`}><span>{tab.icon}</span><span className="hidden sm:inline">{isKk ? tab.kk : tab.ru}</span>{tab.key === "console" && consoleEntries.some(entry => entry.level === "error") && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}</button>)}
            </div>
            <div className="flex items-center rounded-lg bg-slate-100 p-0.5 lg:hidden">{DEVICES.map(item => <button key={item.key} type="button" onClick={() => setDevice(item.key)} aria-label={isKk ? item.kk : item.ru} className={`grid h-7 w-7 place-items-center rounded-md text-sm ${device === item.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"}`}>{item.icon}</button>)}</div>
          </div>
          <div className="min-h-0 flex-1">{renderMain()}</div>
        </main>

        <aside className={`${mobilePane === "project" ? "flex" : "hidden"} min-h-0 flex-col border-l border-slate-200 bg-white lg:flex`}>
          <div className="border-b border-slate-100 p-4"><p className="text-xs font-black text-slate-900">{isKk ? "Жоба" : "Проект"}</p><p className="mt-0.5 text-[10px] text-slate-400">{project.framework} · {Object.keys(project.files).length} {isKk ? "файл" : "файлов"}</p></div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
              {(["files", "assets", "versions"] as BuilderTab[]).map(tab => <button key={tab} type="button" onClick={() => { setActiveTab(tab); setMobilePane("preview"); }} className="rounded-lg px-2 py-2 text-[10px] font-bold text-slate-500 hover:bg-white hover:text-slate-900">{tab === "files" ? (isKk ? "Файлдар" : "Файлы") : tab === "assets" ? (isKk ? "Материалдар" : "Материалы") : (isKk ? "Нұсқалар" : "Версии")}</button>)}
            </div>
            <div className="mt-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{isKk ? "Файлдар" : "Файлы"}</p><div className="mt-2 space-y-0.5">{fileNames.slice(0, 12).map(path => <button key={path} type="button" onClick={() => { setSelectedFile(path); setActiveTab("code"); setMobilePane("preview"); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] text-slate-600 hover:bg-slate-50"><span className="text-slate-300">◇</span><span className="truncate">{path}</span>{draftFiles[path] !== project.files[path] && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-orange-500" />}</button>)}</div></div>
            <div className="mt-5"><div className="flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{isKk ? "Материалдар" : "Материалы"} · {attachedAssetIds.length}/12</p><button type="button" disabled={mutationBusy || hasDirtyFiles || project.assets.length >= maxProjectAssets} onClick={() => uploadInputRef.current?.click()} className="text-[10px] font-black text-orange-600 disabled:opacity-35">＋ {isKk ? "Қосу" : "Добавить"}</button></div><div className="mt-2 space-y-1">{project.assets.slice(0, 6).map(asset => <button key={asset.id} type="button" onClick={() => toggleAttachedAsset(asset.id)} className={`flex w-full items-center gap-2 rounded-lg p-2 text-left ${attachedAssetIds.includes(asset.id) ? "bg-orange-50" : "hover:bg-slate-50"}`}><span>{assetIcon(asset)}</span><span className="min-w-0 flex-1 truncate text-[10px] font-bold text-slate-600">{asset.filename}</span></button>)}{project.assets.length === 0 && <p className="py-3 text-[10px] text-slate-400">{isKk ? "Материалдар жоқ" : "Нет материалов"}</p>}</div></div>
          </div>
          <div className="border-t border-slate-100 p-3"><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => { const previous = versions.map(versionNumber).filter(number => number < project.current_version).sort((a, b) => b - a)[0]; if (previous !== undefined) onRestore(previous); }} disabled={mutationBusy || hasDirtyFiles || project.current_version <= 1} className="min-h-9 rounded-xl border border-slate-200 text-[10px] font-bold text-slate-600 disabled:opacity-35">↶ {isKk ? "Болдырмау" : "Отменить"}</button><button type="button" onClick={() => { setActiveTab("versions"); setMobilePane("preview"); }} className="min-h-9 rounded-xl border border-slate-200 text-[10px] font-bold text-slate-600">{isKk ? "Тарих" : "История"}</button></div></div>
        </aside>
      </div>

      {publishOpen && <PublishDialog language={language} project={project} busy={mutationBusy} onClose={() => setPublishOpen(false)} onPublish={onPublish} />}
    </div>
  );
}
