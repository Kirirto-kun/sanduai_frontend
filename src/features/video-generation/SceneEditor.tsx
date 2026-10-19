"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ApiRequestError } from "@/lib/http-client";
import { invalidateCachedBalance } from "@/lib/tokenCache";
import { videoApi } from "./api";
import {
  draftChanged,
  earliestVideoExpiry,
  expiryLabel,
  isActiveVideoJob,
  isVideoExpired,
  money,
  selectedVersion,
  validateTrim,
  versionAssetId,
  videoError,
} from "./model";
import {
  clearVideoIntent,
  createVideoIntent,
  readVideoIntent,
  type VideoIntent,
} from "./recovery";
import type {
  VideoCatalog,
  VideoAsset,
  VideoProject,
  VideoQuote,
  VideoScene,
  VideoVersion,
} from "./types";
import { Button, Field, Icon, Modal, Spinner, fieldClass } from "./ui";
import { useSceneDraft } from "./useSceneDraft";
import { SettingsPanel } from "./SettingsPanel";
import { ImageInput } from "./ImageInput";
import { DownloadVideo, PrivateMedia, useMediaExpired } from "./PrivateMedia";
import { videoInputLifetime } from "./input-availability";
import { SceneStructureDialog } from "./SceneStructureDialog";
import { ImportSceneDialog } from "./ImportSceneDialog";
import { DeleteVersionDialog, SimilarVersionDialog } from "./VersionActions";
import { videoPresetLabel } from "./presets";
import {
  hasUnresolvedPresetConflict,
  presetConflictKey,
} from "./preset-conflicts";

export function SceneEditor({
  scene,
  project,
  catalog,
  ownerId,
  kk,
  onRefresh,
  onAdd,
  onDelete,
  timeline,
  initialMode,
}: {
  scene: VideoScene;
  project: VideoProject;
  catalog: VideoCatalog;
  ownerId: string;
  kk: boolean;
  onRefresh: () => void;
  onAdd: (source?: VideoScene) => void;
  onDelete: (scene: VideoScene) => void;
  timeline?: ReactNode;
  initialMode?: "text" | "image";
}) {
  const { draft, update, save, saveMyDraft, adopt, state, saveError } =
    useSceneDraft(scene, ownerId, project.expires_at, onRefresh);
  const [mode, setMode] = useState<"text" | "image">(
    initialMode ?? (draft.input_asset_id ? "image" : "text"),
  );
  const [quote, setQuote] = useState<VideoQuote | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [keptPresetConflicts, setKeptPresetConflicts] = useState("");
  const [quoteAttempt, setQuoteAttempt] = useState(0);
  const [uploadedInput, setUploadedInput] = useState<VideoAsset | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [enhanced, setEnhanced] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [deletingVersion, setDeletingVersion] = useState<VideoVersion | null>(
    null,
  );
  const [similarVersion, setSimilarVersion] = useState<VideoVersion | null>(
    null,
  );
  const [trim, setTrim] = useState<VideoVersion | null>(null);
  const [structure, setStructure] = useState<"split" | "merge" | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(5);
  const [intent, setIntent] = useState<VideoIntent | null>(() =>
    readVideoIntent(ownerId, scene.id),
  );
  const submitLock = useRef(false);
  const quoteRequest = useRef(0);
  const version = selectedVersion(scene);
  const assetId = versionAssetId(version);
  const latestVersion = scene.versions[scene.versions.length - 1];
  const sourceParent = project.scenes.find(
    (s) => s.id === scene.source_scene_id,
  );
  const sourceVersion = sourceParent?.versions.find(
    (v) => v.id === scene.source_version_id,
  );
  const sourceVersionNumber = sourceParent
    ? sourceParent.versions.findIndex((v) => v.id === scene.source_version_id) +
      1
    : 0;
  const sourceTime = Number(
    scene.source_timecode ??
      sourceVersion?.duration ??
      sourceVersion?.asset?.duration ??
      sourceVersion?.settings.duration ??
      0,
  );
  const sourceFullDuration = Number(
    sourceVersion?.duration ??
      sourceVersion?.asset?.duration ??
      sourceVersion?.settings.duration ??
      0,
  );
  const jobs = project.jobs.filter(
    (j) => j.scene_id === scene.id && isActiveVideoJob(j),
  );
  const ordered = project.scenes
    .slice()
    .sort((a, b) => a.position - b.position);
  const nextScene = ordered[ordered.findIndex((s) => s.id === scene.id) + 1];
  const projectExpired = useMediaExpired(project.expires_at);
  const inputLifetime = videoInputLifetime({
    inputId: draft.input_asset_id,
    savedInputId: scene.input_asset_id,
    savedAsset: scene.input_asset,
    uploadedAsset: uploadedInput,
    projectExpiresAt: project.expires_at,
  });
  const inputExpiresAt = earliestVideoExpiry(
    inputLifetime.expiresAt,
    scene.source_scene_id
      ? (sourceVersion?.asset?.expires_at ?? sourceVersion?.expires_at)
      : undefined,
  );
  const inputExpired = useMediaExpired(inputExpiresAt);
  const inputUnavailable = Boolean(
    (mode === "image" || scene.source_scene_id) &&
      (inputExpired ||
        inputLifetime.unavailable ||
        (sourceVersion?.status === "completed" &&
          (sourceVersion.asset === null || sourceVersion.asset_expired))),
  );
  const canGenerate =
    Boolean(
      catalog.models.find((m) => m.id === draft.settings.model_id)?.available,
    ) &&
    !busy &&
    jobs.length === 0 &&
    draft.prompt.trim().length > 0 &&
    (mode !== "image" || Boolean(draft.input_asset_id)) &&
    !inputUnavailable &&
    !projectExpired;
  const draftKey = JSON.stringify(draft);
  const conflictKey = presetConflictKey(quote, draftKey);
  const conflictsPending = hasUnresolvedPresetConflict(
    quote,
    draftKey,
    keptPresetConflicts,
  );
  useEffect(() => {
    if (!quoteError) return;
    const recover = () => setQuoteAttempt((n) => n + 1);
    window.addEventListener("online", recover);
    window.addEventListener("focus", recover);
    return () => {
      window.removeEventListener("online", recover);
      window.removeEventListener("focus", recover);
    };
  }, [quoteError]);
  useEffect(() => {
    if (!intent) return;
    const known = scene.versions.some((v) => v.quote_id === intent.quoteId);
    if (known) {
      clearVideoIntent(intent);
      queueMicrotask(() => setIntent(null));
      return;
    }
    const timer = window.setInterval(onRefresh, 5000);
    return () => window.clearInterval(timer);
  }, [intent, scene.versions, onRefresh]);
  useEffect(() => {
    const requestId = ++quoteRequest.current;
    setQuote(null);
    setQuoteError("");
    if (!canGenerate || intent) {
      setQuoteBusy(false);
      return;
    }
    setQuoteBusy(true);
    const timer = window.setTimeout(() => {
      void save()
        .then(() => videoApi.quote(scene.id))
        .then((value) => {
          if (requestId === quoteRequest.current) {
            setQuote(value);
            onRefresh();
          }
        })
        .catch((err) => {
          if (requestId === quoteRequest.current)
            setQuoteError(videoError(err, kk));
        })
        .finally(() => {
          if (requestId === quoteRequest.current) setQuoteBusy(false);
        });
    }, 1000);
    return () => {
      window.clearTimeout(timer);
      quoteRequest.current += 1;
    };
  }, [
    draftKey,
    canGenerate,
    scene.id,
    save,
    kk,
    intent,
    onRefresh,
    quoteAttempt,
  ]);

  async function submit(recovery?: VideoIntent) {
    if (
      submitLock.current ||
      (!recovery &&
        (!canGenerate || inputUnavailable || isVideoExpired(inputExpiresAt))) ||
      (!recovery && conflictsPending) ||
      (!recovery && (!quote || isVideoExpired(quote.expires_at)))
    )
      return;
    submitLock.current = true;
    setBusy(true);
    setError("");
    const pending =
      recovery ?? createVideoIntent(ownerId, project.id, scene.id, quote!.id);
    setIntent(pending);
    try {
      await videoApi.generate(pending.quoteId, pending.key);
      clearVideoIntent(pending);
      setIntent(null);
      setQuote(null);
      invalidateCachedBalance();
      onRefresh();
    } catch (err) {
      if (
        err instanceof ApiRequestError &&
        [400, 402, 403, 404, 409, 410, 422, 429].includes(err.status)
      ) {
        clearVideoIntent(pending);
        setIntent(null);
      }
      setError(videoError(err, kk));
    } finally {
      submitLock.current = false;
      setBusy(false);
    }
  }
  async function select(v: VideoVersion) {
    setBusy(true);
    setError("");
    try {
      await save();
      await videoApi.select(scene.id, v.id);
      setShowVersions(false);
      onRefresh();
    } catch (err) {
      setError(videoError(err, kk));
    } finally {
      setBusy(false);
    }
  }
  const states: Record<string, string> = kk
    ? {
        queued: "Кезекте",
        submitting: "Жіберілуде",
        submission_unknown: "Провайдермен тексерілуде",
        uncertain: "Провайдермен тексерілуде",
        refunding: "Резерв қайтарылуда",
        processing: "Видео жасалуда",
        generating: "Видео жасалуда",
        downloading: "Сақталуда",
        saving: "Сақталуда",
        running: "Видео жасалуда",
        succeeded: "Дайын",
        completed: "Дайын",
        failed: "Сәтсіз",
        cancelled: "Тоқтатылды",
      }
    : {
        queued: "В очереди",
        submitting: "Отправляем",
        submission_unknown: "Сверяем с провайдером",
        uncertain: "Сверяем с провайдером",
        refunding: "Возвращаем резерв",
        processing: "Создаём видео",
        generating: "Создаём видео",
        downloading: "Сохраняем",
        saving: "Сохраняем",
        running: "Создаём видео",
        succeeded: "Готово",
        completed: "Готово",
        failed: "Не удалось",
        cancelled: "Отменено",
      };

  return (
    <div className="min-w-0 space-y-4">
      <div className="min-w-0 space-y-4">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="relative flex min-h-[160px] items-center justify-center bg-[#101524] p-3 sm:min-h-[220px]">
            {assetId ? (
              <div className="w-full">
                <PrivateMedia
                  projectExpiresAt={project.expires_at}
                  key={assetId}
                  assetId={assetId}
                  expiresAt={version?.expires_at ?? version?.asset?.expires_at}
                  kk={kk}
                  trimIn={Number(scene.trim_in ?? 0)}
                  trimOut={
                    scene.trim_out === null ? undefined : Number(scene.trim_out)
                  }
                />
              </div>
            ) : scene.source_scene_id &&
              sourceVersion?.frame_asset_id &&
              Math.abs(sourceTime - sourceFullDuration) < 0.15 ? (
              <div className="relative w-full max-w-xl">
                <PrivateMedia
                  projectExpiresAt={project.expires_at}
                  assetId={sourceVersion.frame_asset_id}
                  expiresAt={
                    sourceVersion.asset?.expires_at ?? sourceVersion.expires_at
                  }
                  image
                  kk={kk}
                />
                <p className="mt-3 text-center text-xs text-white/80">
                  {kk
                    ? "Жалғасы осы кадрдан басталады"
                    : "Продолжение начнётся с этого кадра"}
                </p>
              </div>
            ) : (
              <div className="max-w-md p-3 text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-indigo-300">
                  <Icon name="play" className="h-7 w-7" />
                </div>
                <p className="text-sm font-medium text-white/85">
                  {jobs.length
                    ? kk
                      ? "Сіздің идеяңыз қозғалысқа айналуда"
                      : "Создаём ваше видео"
                    : kk
                      ? "Оқиға осы жерден басталады"
                      : "Здесь появится ваше видео"}
                </p>
                <p className="mt-2 text-xs leading-6 text-slate-400">
                  {jobs.length
                    ? kk
                      ? "Бетті жабуға болады — дайын нәтиже осы жобада қалады."
                      : "Можно закрыть страницу — готовый результат появится в этом проекте."
                    : kk
                      ? "Сахнаны сипаттаңыз, параметрлерді таңдаңыз және алғашқы клипті жасаңыз."
                      : "Напишите ниже, что хотите увидеть, и нажмите «Создать видео»."}
                </p>
                {jobs.length > 0 && (
                  <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs text-indigo-200">
                    <Spinner />
                    {states[jobs[0].status] ??
                      (kk ? "Өңделуде" : "В обработке")}
                  </span>
                )}
              </div>
            )}
          </div>
          {(assetId || scene.versions.length > 0) && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  {version
                    ? `${version.settings.resolution ?? draft.settings.resolution} · ${version.duration ?? version.settings.duration ?? draft.settings.duration} ${kk ? "сек" : "сек"} · MP4`
                    : `${draft.settings.resolution} · ${draft.settings.duration} ${kk ? "сек" : "сек"} · ${draft.settings.aspect_ratio}`}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {version?.expires_at || version?.asset?.expires_at
                    ? `${kk ? "Файл жойылғанша" : "До удаления файла"}: ${expiryLabel(version.expires_at ?? version.asset!.expires_at, kk)}`
                    : kk
                      ? "Дыбысты видеомодель жасайды"
                      : "Звук создаёт видеомодель"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={busy || project.scenes.length >= catalog.max_scenes}
                  onClick={() => {
                    void save()
                      .then(() => onAdd(scene))
                      .catch((err) => setError(videoError(err, kk)));
                  }}
                >
                  <Icon name="plus" />
                  {kk ? "Әрі қарай" : "Что дальше?"}
                </Button>
                {assetId && (
                  <DownloadVideo
                    projectExpiresAt={project.expires_at}
                    expiresAt={
                      version?.expires_at ?? version?.asset?.expires_at
                    }
                    assetId={assetId}
                    name={`${project.title}-${scene.title}`}
                    kk={kk}
                  />
                )}
                <Button
                  disabled={!scene.versions.length}
                  onClick={() => setShowVersions(true)}
                >
                  <Icon name="film" />
                  {kk ? "Нұсқалар" : "Варианты"}
                  {scene.versions.length ? ` · ${scene.versions.length}` : ""}
                </Button>
              </div>
            </div>
          )}
        </section>
        {timeline}
        {jobs.length > 0 && (
          <section
            aria-live="polite"
            className="space-y-2 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4"
          >
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span className="inline-flex items-center gap-2 text-xs font-medium text-indigo-700">
                  <Spinner />
                  {states[job.status] ?? (kk ? "Өңделуде" : "В обработке")}
                  <span className="font-normal text-indigo-400">
                    · {money(job.reserved_tokens)}{" "}
                    {kk ? "токен резервте" : "токенов в резерве"}
                  </span>
                </span>
                {job.status === "queued" && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      void videoApi
                        .cancel(job.id)
                        .then(onRefresh)
                        .catch((err) => setError(videoError(err, kk)));
                    }}
                  >
                    {kk ? "Тоқтату" : "Отменить"}
                  </Button>
                )}
              </div>
            ))}
            <p className="text-[11px] leading-5 text-indigo-500">
              {kk
                ? "Басқа сахналарды өңдеуді жалғастырыңыз. Қайта басу қосымша тапсырма жасамайды."
                : "Продолжайте работать с другими сценами. Повторная отправка не создаст дубль задания."}
            </p>
          </section>
        )}
        {version &&
          !assetId &&
          (version.asset_expired || isVideoExpired(version.expires_at)) && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-800">
              {kk
                ? "Таңдалған клиптің 24 сағат сақтау мерзімі аяқталды. Жобада жаңа нұсқа жасауға болады."
                : "Срок хранения выбранного клипа 24 часа истёк. В этом проекте можно создать новую версию."}
            </p>
          )}
        {latestVersion &&
          ["failed", "cancelled"].includes(latestVersion.status) &&
          jobs.length === 0 && (
            <div
              role="status"
              className="rounded-2xl border border-rose-100 bg-rose-50 p-4"
            >
              <p className="text-xs font-semibold text-rose-800">
                {kk
                  ? "Соңғы генерация аяқталмады. Резерв қайтарылды."
                  : "Последняя генерация не завершилась. Резерв возвращён."}
              </p>
              <p className="mt-1 text-[11px] leading-6 text-rose-600">
                {kk
                  ? "Промпт пен параметрлер сақталды. Оларды түзетіп, жаңа бағаны растауға болады. Алдыңғы дайын нұсқалар сақталады."
                  : "Промпт и настройки сохранены. Можно изменить их и подтвердить новую цену. Предыдущие готовые версии остаются доступны."}
              </p>
            </div>
          )}
        {scene.source_scene_id && (
          <details
            open={scene.source_stale || undefined}
            className="rounded-2xl border border-teal-100 bg-teal-50/40 px-4 py-2"
          >
            <summary className="flex min-h-8 cursor-pointer items-center gap-2 text-xs font-medium text-teal-900">
              <Icon name="scenes" />
              {kk
                ? "Алдыңғы сахнадан жалғастыру · бастапқы кадр"
                : "Продолжение предыдущей сцены · начальный кадр"}
              <Icon name="chevron" className="ml-auto h-3 w-3" />
            </summary>
            <div
              className={`mt-2 flex gap-3 rounded-2xl border p-4 ${scene.source_stale ? "border-amber-200 bg-amber-50 text-amber-800" : "border-teal-100 bg-teal-50 text-teal-800"}`}
            >
              <Icon name="scenes" className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-xs font-semibold">
                  {kk
                    ? "Алдыңғы сахнаның соңғы кадрынан жалғасады"
                    : "Продолжение от последнего кадра предыдущей сцены"}
                </p>
                <p className="mt-1 text-[11px] leading-5">
                  {scene.source_stale
                    ? kk
                      ? "Бастапқы көрініс не сахналардың реті өзгерді. Бастапқы кадр сол күйінде қалды. Оны растауға не ауыстыруға болады; видео өздігінен қайта жасалмайды."
                      : "Источник или порядок сцен изменились. Начальный кадр остался прежним. Можно подтвердить его или выбрать другой; видео само не перегенерируется."
                    : kk
                      ? "Сервер таңдалған клиптің соңғы кадрын алады. Дауыс пен қозғалыстың толық үздіксіздігіне кепіл жоқ."
                      : "Этот кадр станет началом нового видео. Голос и движение могут немного отличаться."}
                </p>
                <div className="mt-3 flex flex-wrap items-start gap-3 rounded-xl bg-white/50 p-3">
                  {sourceVersion?.frame_asset_id &&
                  Math.abs(sourceTime - sourceFullDuration) < 0.15 ? (
                    <div className="w-28 shrink-0">
                      <PrivateMedia
                        projectExpiresAt={project.expires_at}
                        key={sourceVersion.frame_asset_id}
                        assetId={sourceVersion.frame_asset_id}
                        expiresAt={
                          sourceVersion.expires_at ??
                          sourceVersion.asset?.expires_at
                        }
                        image
                        compact
                        kk={kk}
                      />
                    </div>
                  ) : versionAssetId(sourceVersion) ? (
                    <div className="w-28 shrink-0">
                      <PrivateMedia
                        projectExpiresAt={project.expires_at}
                        key={sourceVersion!.id}
                        assetId={versionAssetId(sourceVersion)!}
                        expiresAt={
                          sourceVersion?.expires_at ??
                          sourceVersion?.asset?.expires_at
                        }
                        compact
                        kk={kk}
                        stillAt={sourceTime}
                      />
                    </div>
                  ) : null}
                  <div>
                    <p className="text-[11px] font-semibold">
                      {sourceParent?.title ??
                        (kk
                          ? "Бастапқы сахна жойылған"
                          : "Исходная сцена удалена")}
                    </p>
                    <p className="mt-1 text-[10px] opacity-75">
                      {kk ? "Нұсқа" : "Версия"} {sourceVersionNumber || "—"} ·{" "}
                      {kk ? "Кадр" : "Кадр"} {sourceTime.toFixed(2)}{" "}
                      {kk ? "сек" : "сек"}
                    </p>
                    <p className="mt-1 text-[10px] leading-5 opacity-65">
                      {kk
                        ? "Дәл осы кадр жаңа сахнаның басы болады."
                        : "Именно этот кадр станет началом новой сцены."}
                    </p>
                  </div>
                </div>
                {scene.source_stale &&
                  project.scenes.find((s) => s.id === scene.source_scene_id)
                    ?.selected_version_id && (
                    <Button
                      className="mt-2"
                      disabled={busy}
                      onClick={() => {
                        const parent = project.scenes.find(
                          (s) => s.id === scene.source_scene_id,
                        );
                        if (!parent?.selected_version_id) return;
                        setBusy(true);
                        void save()
                          .then(() =>
                            videoApi.rebase(
                              scene.id,
                              parent.selected_version_id!,
                            ),
                          )
                          .then(onRefresh)
                          .catch((err) => setError(videoError(err, kk)))
                          .finally(() => setBusy(false));
                      }}
                    >
                      {kk
                        ? "Жаңа бастапқы кадрды қабылдау"
                        : "Принять новый исходный кадр"}
                    </Button>
                  )}
                <Button
                  variant="ghost"
                  className="mt-2"
                  disabled={busy || jobs.length > 0}
                  onClick={() => {
                    setBusy(true);
                    void save()
                      .then(() => videoApi.unlink(scene.id))
                      .then(onRefresh)
                      .catch((err) => setError(videoError(err, kk)))
                      .finally(() => setBusy(false));
                  }}
                >
                  {kk ? "Тәуелсіз сахна жасау" : "Сделать независимой"}
                </Button>
              </div>
            </div>
          </details>
        )}
        {version &&
          draftChanged({
            ...scene,
            ...draft,
            draft_changed: Boolean(
              scene.draft_changed ||
                draft.prompt !== scene.prompt ||
                draft.dialogue !== (scene.dialogue ?? "") ||
                JSON.stringify(draft.settings) !==
                  JSON.stringify(scene.settings) ||
                draft.input_asset_id !== scene.input_asset_id,
            ),
          }) && (
            <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
              {kk
                ? "Параметрлер өзгерді. Таңдалған клип бұрын жасалған; жаңа нұсқа тек сіздің әрекетіңізбен жасалады."
                : "Настройки изменены. Выбранный клип создан раньше; новая версия появится только после вашего запуска."}
            </p>
          )}
        <section
          className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          aria-label={
            kk
              ? "Видео сипаттамасы мен параметрлері"
              : "Описание и параметры видео"
          }
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex rounded-xl bg-slate-100 p-1">
              {scene.source_scene_id && (
                <span className="inline-flex min-h-9 items-center gap-2 px-3 text-xs font-semibold text-indigo-700">
                  <Icon name="scenes" />
                  {kk ? "Видеоны жалғастыру" : "Продолжение видео"}
                </span>
              )}
              {!scene.source_scene_id &&
                (["text", "image"] as const).map((value) => (
                  <button
                    type="button"
                    key={value}
                    disabled={Boolean(scene.source_scene_id)}
                    onClick={() => {
                      setMode(value);
                      if (value === "text") update({ input_asset_id: null });
                    }}
                    className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition disabled:opacity-50 ${mode === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    <Icon name={value === "text" ? "sparkles" : "image"} />
                    {value === "text"
                      ? kk
                        ? "Мәтіннен"
                        : "Из текста"
                      : kk
                        ? "Суреттен"
                        : "Из фото"}
                  </button>
                ))}
            </div>
            <span
              aria-live="polite"
              className={`inline-flex items-center gap-1.5 text-[11px] ${state === "error" ? "text-rose-500" : "text-slate-400"}`}
            >
              {state === "saving" ? (
                <Spinner className="h-3 w-3" />
              ) : state === "saved" ? (
                <Icon name="check" className="h-3 w-3" />
              ) : null}
              {state === "saving"
                ? kk
                  ? "Сақталуда"
                  : "Сохраняем"
                : state === "saved"
                  ? kk
                    ? "Сақталды"
                    : "Сохранено"
                  : state === "error"
                    ? kk
                      ? "Сақталмады"
                      : "Не сохранено"
                    : kk
                      ? "Өзгерістер бар"
                      : "Есть изменения"}
            </span>
          </div>

          {mode === "image" && !scene.source_scene_id && (
            <div className="mt-4">
              <ImageInput
                projectId={project.id}
                projectExpiresAt={project.expires_at}
                assetId={draft.input_asset_id}
                aspectRatio={draft.settings.aspect_ratio}
                limitMb={catalog.max_image_mb}
                kk={kk}
                onChange={(id, asset) => {
                  setUploadedInput(asset ?? null);
                  update({ input_asset_id: id });
                }}
              />
            </div>
          )}
          <div className="mt-4">
            <Field
              label={
                scene.source_scene_id
                  ? kk
                    ? "Әрі қарай не болады?"
                    : "Что произойдёт дальше?"
                  : mode === "image"
                    ? kk
                      ? "Суретте не болғанын қалайсыз?"
                      : "Как оживить фото?"
                    : kk
                      ? "Сахнада не болады?"
                      : "Какое видео хотите создать?"
              }
            >
              <textarea
                className={`${fieldClass} min-h-24 resize-y border-transparent bg-slate-50 text-sm focus:bg-white`}
                value={draft.prompt}
                onChange={(e) => update({ prompt: e.target.value })}
                maxLength={12000}
                placeholder={
                  kk
                    ? "Кейіпкерді, орынды, әрекетті және атмосфераны сипаттаңыз…"
                    : "Опишите героя, место, действие и атмосферу. Например: девушка идёт по степи на закате, ветер колышет траву, камера плавно следует за ней…"
                }
              />
            </Field>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              className="-ml-3 text-indigo-600"
              disabled={!draft.prompt.trim() || enhancing}
              onClick={() => {
                setEnhancing(true);
                void videoApi
                  .enhance(draft.prompt, project.language)
                  .then((result) =>
                    setEnhanced(result.enhanced_prompt ?? result.prompt),
                  )
                  .catch((err) => setError(videoError(err, kk)))
                  .finally(() => setEnhancing(false));
              }}
            >
              {enhancing ? <Spinner /> : <Icon name="sparkles" />}
              {kk ? "Промптты жақсарту" : "Помочь с описанием"}
            </Button>
            <span className="text-[10px] text-slate-400">
              {draft.prompt.length.toLocaleString()} / 12 000
            </span>
          </div>
          {saveError ? (
            <div
              role="alert"
              className="mt-3 rounded-xl bg-rose-50 p-3 text-xs leading-5 text-rose-700"
            >
              <p>{videoError(saveError, kk)}</p>
              <Button
                className="mt-2"
                onClick={() =>
                  void (
                    saveError instanceof ApiRequestError &&
                    saveError.status === 409
                      ? saveMyDraft()
                      : save()
                  ).catch(() => undefined)
                }
              >
                {saveError instanceof ApiRequestError &&
                saveError.status === 409
                  ? kk
                    ? "Өз нұсқамды сервердегінің орнына сақтау"
                    : "Сохранить мой черновик поверх серверного"
                  : kk
                    ? "Сақтауды қайталау"
                    : "Повторить сохранение"}
              </Button>
            </div>
          ) : null}
          <div className="mt-4 border-t border-slate-100 pt-4">
            {Boolean(scene.dialogue) && (
              <details className="mb-3 rounded-xl border border-slate-200 px-3 py-2">
                <summary className="min-h-8 cursor-pointer text-xs font-medium text-slate-600">
                  {kk ? "Сценарийдегі репликалар" : "Реплики из сценария"}
                </summary>
                <Field
                  label={
                    kk
                      ? "Өзгеріссіз айтылатын мәтін"
                      : "Текст, который нужно произнести точно"
                  }
                  hint={
                    kk
                      ? "Бұл мәтінді видеомодель айтады."
                      : "Эти реплики произнесёт видеомодель."
                  }
                >
                  <textarea
                    className={`${fieldClass} mt-2 min-h-24`}
                    value={draft.dialogue ?? ""}
                    maxLength={12000}
                    onChange={(event) =>
                      update({ dialogue: event.target.value })
                    }
                  />
                </Field>
              </details>
            )}
            <SettingsPanel
              inputMode={
                mode === "image" || scene.source_scene_id ? "image" : "text"
              }
              settings={draft.settings}
              models={catalog.models}
              profiles={catalog.default_profiles}
              onChange={(settings) => {
                if (settings.aspect_ratio === project.aspect_ratio) {
                  update({ settings });
                  return;
                }
                setBusy(true);
                void save()
                  .then(() =>
                    videoApi.updateProject(project.id, {
                      aspect_ratio: settings.aspect_ratio,
                    }),
                  )
                  .then(() => videoApi.project(project.id))
                  .then((p) => {
                    const fresh = p.scenes.find((s) => s.id === scene.id);
                    if (fresh) adopt(fresh);
                    update({ settings });
                    onRefresh();
                  })
                  .catch((err) => setError(videoError(err, kk)))
                  .finally(() => setBusy(false));
              }}
              kk={kk}
              aspectLocked={
                project.scenes.some((s) => Boolean(s.selected_version_id)) ||
                project.jobs.some(isActiveVideoJob)
              }
            />
            <div className="mt-4 border-t border-slate-100 pt-4">
              {inputUnavailable && !projectExpired && (
                <p
                  role="alert"
                  className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-900"
                >
                  {scene.source_scene_id
                    ? kk
                      ? "Жалғастыруға арналған бастапқы клип қолжетімсіз немесе сақтау мерзімі аяқталған. Басқа қолжетімді нұсқаны таңдаңыз немесе сахнаны ажыратыңыз."
                      : "Исходный клип для продолжения недоступен или срок его хранения истёк. Выберите другую доступную версию или отвяжите сцену."
                    : kk
                      ? "Бастапқы сурет қолжетімсіз немесе сақтау мерзімі аяқталған. Генерация алдында жаңа сурет жүктеңіз."
                      : "Исходное изображение недоступно или срок его хранения истёк. Загрузите свежее изображение перед генерацией."}
                </p>
              )}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] text-slate-400">
                    {kk ? "Видео жасау бағасы" : "Цена генерации"}
                  </p>
                  <p className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                    {quoteBusy ? (
                      <Spinner className="h-5 w-5" />
                    ) : quote ? (
                      money(quote.cost_tokens)
                    ) : (
                      "—"
                    )}
                    <span className="ml-1.5 text-xs font-medium text-slate-400">
                      {kk ? "токен" : "токенов"}
                    </span>
                  </p>
                </div>
                {quote && (
                  <span className="pb-0.5 text-xs text-slate-500">
                    = {money(quote.cost_kzt)} ₸
                  </span>
                )}
              </div>
              <p className="mt-2 text-[10px] leading-5 text-slate-400">
                {kk
                  ? "1 токен = API шығынының 1 ₸. Үстемесіз. Сәтсіз нәтиже болса, резерв қайтарылады."
                  : "1 токен = 1 ₸ себестоимости API. Без наценки. При конечном сбое резерв вернётся."}
              </p>
              {quote?.warnings?.map((w) => (
                <p
                  key={w.code}
                  className="mt-3 rounded-lg bg-amber-50 p-3 text-[11px] leading-5 text-amber-800"
                >
                  {kk
                    ? "Реплика ұзақтығынан ұзын болуы мүмкін. Мәтінді қысқартыңыз немесе бірнеше сахнаға бөліңіз; ол автоматты өзгертілмейді."
                    : w.message}
                </p>
              ))}
              {Boolean(quote?.preset_conflicts?.length) && (
                <div
                  role="status"
                  className="mt-3 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-900"
                >
                  <p className="font-semibold">
                    {kk
                      ? "Пресет пен нұсқаулар сәйкес келмейді"
                      : "Пресет расходится с вашими инструкциями"}
                  </p>
                  <p>
                    {kk
                      ? "Мәтіндегі нақты нұсқаулар басым. Қайшы пресетті алып тастаңыз немесе оны қалдыруды нақты таңдаңыз."
                      : "Явные инструкции в тексте имеют приоритет. Уберите конфликтующий пресет или явно выберите оставить его."}
                  </p>
                  {quote?.preset_conflicts?.map((conflict) => (
                    <div
                      key={`${conflict.field}:${conflict.preset}`}
                      className="rounded-lg border border-amber-200 bg-white/60 p-3"
                    >
                      <p>
                        {conflict.field === "camera"
                          ? kk
                            ? "Камера"
                            : "Камера"
                          : kk
                            ? "Стиль"
                            : "Стиль"}
                        :{" "}
                        <strong>
                          {videoPresetLabel(
                            conflict.field,
                            conflict.preset,
                            kk,
                          )}
                        </strong>
                      </p>
                      <p className="mt-1">
                        {conflict.reason_code === "EXPLICIT_CAMERA"
                          ? kk
                            ? "Нұсқауда камераның басқа қозғалысы көрсетілген."
                            : "В инструкции задано другое движение камеры."
                          : kk
                            ? "Нұсқауда басқа визуалды стиль көрсетілген."
                            : "В инструкции задан другой визуальный стиль."}
                      </p>
                      <Button
                        className="mt-2"
                        disabled={busy}
                        onClick={() =>
                          update({
                            settings: {
                              ...draft.settings,
                              [conflict.field]: "",
                            },
                          })
                        }
                      >
                        {kk ? "Осы пресетті алып тастау" : "Убрать этот пресет"}
                      </Button>
                    </div>
                  ))}
                  {conflictsPending ? (
                    <Button
                      disabled={busy}
                      onClick={() => setKeptPresetConflicts(conflictKey)}
                    >
                      {kk
                        ? "Таңдалған пресеттерді қалдыру"
                        : "Оставить выбранные пресеты"}
                    </Button>
                  ) : (
                    <p className="font-semibold text-teal-800">
                      {kk
                        ? "Пресеттерді қалдыруды таңдадыңыз. Мәтіндегі нұсқаулар басым болып қалады."
                        : "Вы выбрали оставить пресеты. Инструкции в тексте сохраняют приоритет."}
                    </p>
                  )}
                </div>
              )}
              {quoteError && (
                <div
                  role="alert"
                  className="mt-2 text-xs leading-5 text-rose-600"
                >
                  <p>{quoteError}</p>
                  <Button
                    className="mt-2 w-full"
                    disabled={quoteBusy || busy || jobs.length > 0}
                    onClick={() => setQuoteAttempt((n) => n + 1)}
                  >
                    <Icon name="refresh" />
                    {kk ? "Бағаны қайта есептеу" : "Повторить расчёт цены"}
                  </Button>
                </div>
              )}
              {intent ? (
                <div className="mt-3 rounded-xl bg-amber-50 p-3">
                  <p className="text-xs leading-5 text-amber-800">
                    {kk
                      ? "Алдыңғы сұраудың жауабы тексеріледі. Екінші ақылы сұрау жасалмайды."
                      : "Проверим ответ предыдущего запроса. Второй платный запрос создан не будет."}
                  </p>
                  <Button
                    variant="primary"
                    disabled={busy}
                    className="mt-3 w-full"
                    onClick={() => void submit(intent)}
                  >
                    {busy ? <Spinner /> : <Icon name="refresh" />}
                    {kk ? "Сұрауды қалпына келтіру" : "Восстановить запрос"}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="primary"
                  className="mt-4 min-h-12 w-full text-sm"
                  disabled={
                    conflictsPending ||
                    !canGenerate ||
                    !quote ||
                    quoteBusy ||
                    busy ||
                    isVideoExpired(quote?.expires_at)
                  }
                  onClick={() => void submit()}
                >
                  {busy || jobs.length > 0 ? (
                    <Spinner />
                  ) : (
                    <Icon name={assetId ? "refresh" : "sparkles"} />
                  )}
                  {jobs.length > 0
                    ? kk
                      ? "Сахна жасалуда"
                      : "Сцена создаётся"
                    : assetId
                      ? kk
                        ? "Жаңа нұсқа жасау"
                        : "Создать новую версию"
                      : scene.source_scene_id
                        ? kk
                          ? "Жалғасын жасау"
                          : "Создать продолжение"
                        : kk
                          ? "Видео жасау"
                          : "Создать видео"}
                  {quote && !busy && (
                    <span className="ml-auto rounded-md bg-white/15 px-2 py-0.5 text-[11px]">
                      {money(quote.cost_tokens)} {kk ? "токен" : "токенов"}
                    </span>
                  )}
                </Button>
              )}
              {quote && !isVideoExpired(quote.expires_at) && (
                <p className="mt-2 text-center text-[10px] text-slate-400">
                  {kk
                    ? "Басу арқылы осы бағаны растайсыз"
                    : "Нажатием вы подтверждаете указанную цену"}
                </p>
              )}
              {quote && isVideoExpired(quote.expires_at) && (
                <Button
                  className="mt-3 w-full"
                  onClick={() => {
                    setQuoteBusy(true);
                    void save()
                      .then(() => videoApi.quote(scene.id))
                      .then(setQuote)
                      .catch((err) => setQuoteError(videoError(err, kk)))
                      .finally(() => setQuoteBusy(false));
                  }}
                >
                  <Icon name="refresh" />
                  {kk ? "Бағаны жаңарту" : "Обновить цену"}
                </Button>
              )}
            </div>
          </div>
          <details className="mt-4 border-t border-slate-100 pt-2">
            <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 text-xs font-medium text-slate-500">
              {kk ? "Атауы және басқа әрекеттер" : "Название и другие действия"}
              <Icon name="chevron" className="ml-auto h-3 w-3" />
            </summary>
            <div className="space-y-3 py-3">
              <Field label={kk ? "Сахна атауы" : "Название сцены"}>
                <input
                  className={fieldClass}
                  value={draft.title}
                  onChange={(e) => update({ title: e.target.value })}
                  maxLength={240}
                />
              </Field>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => {
                    void save()
                      .then(() => videoApi.duplicateScene(scene.id))
                      .then(onRefresh)
                      .catch((err) => setError(videoError(err, kk)));
                  }}
                >
                  <Icon name="copy" />
                  {kk ? "Ұқсас жасау" : "Создать похожее"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={!assetId}
                  onClick={() => setImportOpen(true)}
                >
                  <Icon name="film" />
                  {kk ? "Жобаға қосу" : "В другой проект"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={
                    jobs.length > 0 ||
                    draft.prompt.trim().length < 2 ||
                    project.scenes.length >= catalog.max_scenes
                  }
                  onClick={() => setStructure("split")}
                >
                  <Icon name="scenes" />
                  {kk ? "Бөлу" : "Разделить"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={
                    jobs.length > 0 ||
                    !nextScene ||
                    project.jobs.some(
                      (j) =>
                        j.scene_id === nextScene?.id && isActiveVideoJob(j),
                    )
                  }
                  onClick={() => setStructure("merge")}
                >
                  <Icon name="scenes" />
                  {kk ? "Біріктіру" : "Объединить"}
                </Button>
                <Button variant="ghost" onClick={() => onDelete(scene)}>
                  <Icon name="trash" />
                  {kk ? "Жою" : "Удалить сцену"}
                </Button>
              </div>

              {assetId && version && (
                <Button
                  onClick={() => {
                    setTrimStart(Number(scene.trim_in ?? 0));
                    setTrimEnd(
                      Number(
                        scene.trim_out ??
                          version.duration ??
                          version.asset?.duration ??
                          version.settings.duration ??
                          5,
                      ),
                    );
                    setTrim(version);
                  }}
                >
                  {kk ? "Видеоны қию" : "Обрезать видео"}
                </Button>
              )}
            </div>
          </details>
        </section>
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs leading-6 text-rose-700 xl:col-span-2"
        >
          {error}
        </div>
      )}
      {structure && (
        <SceneStructureDialog
          scene={scene}
          prompt={draft.prompt}
          next={nextScene}
          mode={structure}
          kk={kk}
          save={save}
          onClose={() => setStructure(null)}
          onRefresh={onRefresh}
        />
      )}
      {importOpen && (
        <ImportSceneDialog
          scene={scene}
          project={project}
          kk={kk}
          onClose={() => setImportOpen(false)}
        />
      )}
      {enhanced !== null && (
        <Modal
          title={kk ? "Ұсынылған промпт" : "Предложение для промпта"}
          onClose={() => setEnhanced(null)}
        >
          <p className="mb-4 text-xs leading-5 text-slate-500">
            {kk
              ? "Мәтінді тексеріп, қажет болса өңдеңіз. Қабылдау видео жасамайды және токен алмайды."
              : "Проверьте и при необходимости отредактируйте текст. Принятие не запускает видео и не списывает токены."}
          </p>
          <textarea
            className={`${fieldClass} min-h-64`}
            value={enhanced}
            maxLength={12000}
            onChange={(e) => setEnhanced(e.target.value)}
          />
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button onClick={() => setEnhanced(null)}>
              {kk ? "Өз мәтінімді қалдыру" : "Оставить свой текст"}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                update({
                  original_prompt: draft.original_prompt || draft.prompt,
                  enhanced_prompt: enhanced,
                  prompt: enhanced,
                });
                setEnhanced(null);
              }}
            >
              <Icon name="check" />
              {kk ? "Қабылдау" : "Применить"}
            </Button>
          </div>
        </Modal>
      )}
      {showVersions && (
        <Modal
          title={kk ? "Сахна нұсқалары" : "Версии сцены"}
          onClose={() => setShowVersions(false)}
          wide
        >
          <p className="mb-4 text-xs leading-5 text-slate-500">
            {kk
              ? "Дайын нұсқаны таңдау тегін. Әр жаңа генерация бөлек төленеді."
              : "Выбор готовой версии бесплатный. Каждая новая генерация оплачивается отдельно."}
          </p>
          <div className="space-y-3">
            {scene.versions
              .slice()
              .reverse()
              .map((v, i) => (
                <div
                  key={v.id}
                  className={`rounded-2xl border p-4 ${v.id === scene.selected_version_id ? "border-indigo-300 bg-indigo-50/40" : "border-slate-200"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {kk ? "Нұсқа" : "Версия"} {scene.versions.length - i}
                        {v.id === scene.selected_version_id ? (
                          <span className="ml-2 text-[10px] text-indigo-600">
                            ● {kk ? "Таңдалған" : "Выбрана"}
                          </span>
                        ) : (
                          ""
                        )}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {v.settings.model_id} · {v.settings.resolution} ·{" "}
                        {states[v.status] ?? v.status}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {v.status === "completed"
                          ? kk
                            ? "Есептен шығарылды"
                            : "Списано"
                          : v.status === "failed" || v.status === "cancelled"
                            ? kk
                              ? "Резерв қайтарылды"
                              : "Резерв возвращён"
                            : kk
                              ? "Резервте"
                              : "В резерве"}
                        :{" "}
                        {money(
                          v.status === "completed"
                            ? (v.captured_tokens ?? v.cost_tokens)
                            : v.cost_tokens,
                        )}{" "}
                        {kk ? "токен" : "токенов"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        disabled={busy || !v.prompt}
                        onClick={() => {
                          setShowVersions(false);
                          setSimilarVersion(v);
                        }}
                      >
                        <Icon name="copy" />
                        {kk ? "Ұқсас жасау" : "Создать похожее"}
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={busy || isActiveVideoJob(v)}
                        onClick={() => setDeletingVersion(v)}
                      >
                        <Icon name="trash" />
                        {kk ? "Жою" : "Удалить"}
                      </Button>
                      {versionAssetId(v) &&
                        !isVideoExpired(
                          v.expires_at ?? v.asset?.expires_at,
                        ) && (
                          <>
                            <Button
                              disabled={busy}
                              onClick={() => void select(v)}
                            >
                              {kk ? "Таңдау" : "Выбрать"}
                            </Button>
                            <Button
                              onClick={() => {
                                setTrim(v);
                                setTrimStart(
                                  v.id === scene.selected_version_id
                                    ? Number(scene.trim_in ?? 0)
                                    : 0,
                                );
                                setTrimEnd(
                                  v.id === scene.selected_version_id
                                    ? Number(
                                        scene.trim_out ??
                                          v.duration ??
                                          v.settings.duration ??
                                          5,
                                      )
                                    : Number(
                                        v.duration ?? v.settings.duration ?? 5,
                                      ),
                                );
                              }}
                            >
                              {kk ? "Қию" : "Обрезать"}
                            </Button>
                            <DownloadVideo
                              projectExpiresAt={project.expires_at}
                              expiresAt={v.expires_at ?? v.asset?.expires_at}
                              assetId={versionAssetId(v)!}
                              name={`${scene.title}-${i + 1}`}
                              kk={kk}
                            />
                          </>
                        )}
                    </div>
                  </div>
                  {v.prompt && (
                    <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-500">
                      {v.prompt}
                    </p>
                  )}
                  {(v.original_prompt ||
                    v.enhanced_prompt ||
                    v.final_prompt) && (
                    <details className="mt-3 rounded-xl bg-white/70 p-3">
                      <summary className="cursor-pointer text-[11px] font-semibold text-slate-500">
                        {kk ? "Промпттар тарихы" : "История промптов"}
                      </summary>
                      <div className="mt-3 space-y-4">
                        {[
                          [
                            kk ? "Бастапқы мәтін" : "Исходный текст",
                            v.original_prompt,
                          ],
                          [
                            kk
                              ? "Жақсартылған ұсыныс"
                              : "Улучшенное предложение",
                            v.enhanced_prompt,
                          ],
                          [
                            kk
                              ? "Модельге жіберілген сұрау"
                              : "Запрос, отправленный модели",
                            v.final_prompt,
                          ],
                        ]
                          .filter(([, text]) => Boolean(text))
                          .map(([label, text]) => (
                            <div key={label}>
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                {label}
                              </p>
                              <p className="mt-1 whitespace-pre-wrap text-xs leading-6 text-slate-600">
                                {text}
                              </p>
                            </div>
                          ))}
                      </div>
                    </details>
                  )}
                </div>
              ))}
          </div>
        </Modal>
      )}
      {trim && (
        <Modal
          title={kk ? "Клипті қию" : "Обрезка клипа"}
          onClose={() => setTrim(null)}
        >
          {versionAssetId(trim) && (
            <PrivateMedia
              projectExpiresAt={project.expires_at}
              expiresAt={trim.expires_at ?? trim.asset?.expires_at}
              key={trim.id}
              assetId={versionAssetId(trim)!}
              kk={kk}
              trimIn={trimStart}
              trimOut={trimEnd}
            />
          )}
          <div className="my-4 grid grid-cols-2 gap-3">
            <Field label={kk ? "Басы, сек" : "Начало, сек"}>
              <input
                type="number"
                step="0.1"
                min="0"
                className={fieldClass}
                value={trimStart}
                onChange={(e) => setTrimStart(Number(e.target.value))}
              />
            </Field>
            <Field label={kk ? "Соңы, сек" : "Конец, сек"}>
              <input
                type="number"
                step="0.1"
                min="0.1"
                className={fieldClass}
                value={trimEnd}
                onChange={(e) => setTrimEnd(Number(e.target.value))}
              />
            </Field>
          </div>
          <p className="mb-4 text-xs leading-5 text-slate-500">
            {kk
              ? "Қию тегін. Дәл осы шекаралар алдын ала қарауға, жалғастыру кадрына және жинақтауға қолданылады."
              : "Обрезка бесплатна. Эти границы используются в предпросмотре, кадре продолжения и сборке."}
          </p>
          <Button
            variant="primary"
            className="w-full"
            disabled={
              busy ||
              !validateTrim(
                trimStart,
                trimEnd,
                Number(trim.duration ?? trim.settings.duration ?? 5),
              )
            }
            onClick={() => {
              setBusy(true);
              void save()
                .then(() =>
                  videoApi.select(scene.id, trim.id, trimStart, trimEnd),
                )
                .then(() => {
                  setTrim(null);
                  setShowVersions(false);
                  onRefresh();
                })
                .catch((err) => setError(videoError(err, kk)))
                .finally(() => setBusy(false));
            }}
          >
            <Icon name="check" />
            {kk ? "Қиюды сақтау" : "Сохранить обрезку"}
          </Button>
        </Modal>
      )}
      {deletingVersion && (
        <DeleteVersionDialog
          version={deletingVersion}
          kk={kk}
          onClose={() => setDeletingVersion(null)}
          onDeleted={() => {
            setShowVersions(false);
            onRefresh();
          }}
        />
      )}
      {similarVersion && (
        <SimilarVersionDialog
          version={similarVersion}
          project={project}
          catalog={catalog}
          title={scene.title}
          kk={kk}
          onClose={() => setSimilarVersion(null)}
          onCreated={() => onRefresh()}
        />
      )}
    </div>
  );
}
