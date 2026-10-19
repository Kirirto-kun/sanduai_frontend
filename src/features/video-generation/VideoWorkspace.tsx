"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { invalidateCachedBalance } from "@/lib/tokenCache";
import { videoApi } from "./api";
import {
  catalogDefaultSettings,
  expiryLabel,
  isActiveVideoJob,
  isVideoExpired,
  money,
  projectDuration,
  selectedVersion,
  utcTimestamp,
  versionAssetId,
  videoError,
} from "./model";
import { lastVideoProject, rememberVideoProject } from "./recovery";
import type { VideoProject, VideoScene } from "./types";
import { SceneTimeline } from "./SceneTimeline";
import { Button, Icon, Modal, Spinner } from "./ui";
import { SceneEditor } from "./SceneEditor";
import { LibraryCard } from "./LibraryCard";
import { PlanDialog } from "./PlanDialog";
import { ExportDialog, ProjectDetails, ProjectPreview } from "./ProjectDialogs";

export function VideoWorkspace({
  initialPrompt = "",
  requestedProject = null,
}: {
  initialPrompt?: string;
  requestedProject?: string | null;
}) {
  const { language } = useLanguage();
  const kk = language === "kk";
  const { user } = useAuth();
  const client = useQueryClient();
  const ownerId = user?.userId ?? "";
  const [projectId, setProjectId] = useState<string | null>(requestedProject);
  const [sceneId, setSceneId] = useState<string | null>(null);
  const [screen, setScreen] = useState<"studio" | "library">("studio");
  const [dialog, setDialog] = useState<
    "plan" | "details" | "export" | "preview" | null
  >(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [deletion, setDeletion] = useState<{
    kind: "scene" | "project";
    id: string;
    title: string;
  } | null>(null);
  const [imageSceneId, setImageSceneId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const reorderLock = useRef(false);
  const [addAfter, setAddAfter] = useState<VideoScene | null>(null);
  const [, tick] = useState(0);
  const catalog = useQuery({
    queryKey: ["video-catalog", ownerId],
    queryFn: ({ signal }) => videoApi.catalog(signal),
    enabled: Boolean(ownerId),
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: (query) => query.state.status === "error",
  });
  const library = useInfiniteQuery({
    queryKey: ["video-projects", ownerId],
    queryFn: ({ pageParam }) => videoApi.projectPage(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const count = pages.reduce((n, page) => n + page.items.length, 0);
      return count < last.total && last.items.length > 0 ? count : undefined;
    },
    enabled: Boolean(ownerId),
    staleTime: 15_000,
    retry: false,
  });
  const query = useQuery({
    queryKey: ["video-project", ownerId, projectId],
    queryFn: () => videoApi.project(projectId!),
    enabled: Boolean(ownerId && projectId),
    retry: false,
    refetchInterval: (q) => {
      const p = q.state.data;
      return p &&
        (p.jobs.some(isActiveVideoJob) || p.exports.some(isActiveVideoJob))
        ? 4000
        : false;
    },
    refetchOnWindowFocus: true,
  });
  const project = query.data;
  const fastAvailable =
    catalog.data?.default_profile_availability?.fast ??
    Boolean(
      catalog.data?.models.some(
        (model) =>
          model.available &&
          (!catalog.data?.default_profiles ||
            model.id === catalog.data.default_profiles.fast.model_id),
      ),
    );
  const scenes =
    project?.scenes.slice().sort((a, b) => a.position - b.position) ?? [];
  const scene = scenes.find((s) => s.id === sceneId) ?? scenes[0];
  const projects = library.data?.pages.flatMap((page) => page.items) ?? [];
  const expired = project ? isVideoExpired(project.expires_at) : false;
  const refresh = useCallback(() => {
    void client.invalidateQueries({
      queryKey: ["video-project", ownerId, projectId],
    });
    void client.invalidateQueries({ queryKey: ["video-projects", ownerId] });
  }, [client, ownerId, projectId]);
  const openProject = useCallback(
    (id: string, selectedSceneId?: string) => {
      setProjectId(id);
      setSceneId(selectedSceneId ?? null);
      setScreen("studio");
      setDialog(null);
      setError("");
      rememberVideoProject(ownerId, id);
      const url = new URL(window.location.href);
      url.searchParams.set("project", id);
      window.history.replaceState(null, "", url);
    },
    [ownerId],
  );
  useEffect(() => {
    const timer = window.setInterval(() => tick((n) => n + 1), 15_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!project?.expires_at) return;
    const timer = window.setTimeout(
      () => tick((n) => n + 1),
      Math.max(0, utcTimestamp(project.expires_at) - Date.now() + 20),
    );
    return () => window.clearTimeout(timer);
  }, [project?.expires_at]);
  useEffect(() => {
    if (!ownerId || requestedProject || initialPrompt) return;
    const id = lastVideoProject(ownerId);
    if (id) setProjectId(id);
  }, [ownerId, requestedProject, initialPrompt]);
  const billingState =
    project?.scenes
      .flatMap((s) =>
        s.versions.map((v) => `${v.id}:${v.status}:${v.cost_tokens}`),
      )
      .join("|") ?? "";
  useEffect(() => {
    if (billingState) invalidateCachedBalance();
  }, [billingState]);

  async function createProject() {
    if (busy || !catalog.data || !fastAvailable) return;
    setBusy(true);
    setError("");
    try {
      const defaults = catalogDefaultSettings(catalog.data, language);
      const created = await videoApi.createProject({
        title: kk ? "Жаңа видео" : "Новое видео",
        language,
        defaults,
        aspect_ratio: defaults.aspect_ratio,
      });
      const first = await videoApi.createScene(created.id, {
        title: kk ? "Бірінші сахна" : "Первая сцена",
        prompt: initialPrompt,
        original_prompt: initialPrompt,
        settings: defaults,
      });
      await client.invalidateQueries({ queryKey: ["video-projects", ownerId] });
      openProject(created.id, first.id);
    } catch (err) {
      setError(videoError(err, kk));
    } finally {
      setBusy(false);
    }
  }
  async function addScene(
    source?: VideoScene,
    after?: VideoScene,
    inputMode: "text" | "image" = "text",
  ) {
    if (!project || busy) return;
    setBusy(true);
    setError("");
    setAddAfter(null);
    try {
      const next = await videoApi.createScene(project.id, {
        title: `${kk ? "Сахна" : "Сцена"} ${project.scenes.length + 1}`,
        prompt: "",
        settings: { ...project.defaults, aspect_ratio: project.aspect_ratio },
        ...(source
          ? {
              source_scene_id: source.id,
              source_version_id: source.selected_version_id ?? undefined,
            }
          : {}),
        ...(after ? { after_scene_id: after.id } : {}),
      });
      await client.invalidateQueries({
        queryKey: ["video-project", ownerId, projectId],
      });
      setImageSceneId(inputMode === "image" ? next.id : null);
      setSceneId(next.id);
    } catch (err) {
      setError(videoError(err, kk));
    } finally {
      setBusy(false);
    }
  }
  async function reorderScenes(ids: string[]) {
    if (!project || reorderLock.current) return;
    const key = ["video-project", ownerId, projectId];
    if (
      ids.length !== scenes.length ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => !scenes.some((item) => item.id === id))
    )
      return;
    reorderLock.current = true;
    if (scene) setSceneId(scene.id);
    setReordering(true);
    await client.cancelQueries({ queryKey: key });
    const previous = client.getQueryData<VideoProject>(key);
    client.setQueryData<VideoProject>(key, (current) =>
      current
        ? {
            ...current,
            scenes: ids.map((id, position) => ({
              ...current.scenes.find((item) => item.id === id)!,
              position,
            })),
          }
        : current,
    );
    try {
      await videoApi.reorder(project.id, ids);
    } catch (err) {
      if (previous) client.setQueryData(key, previous);
      setError(videoError(err, kk));
      throw err;
    } finally {
      reorderLock.current = false;
      setReordering(false);
      refresh();
    }
  }
  async function toggleIncluded(item: VideoScene) {
    if (busy) return;
    setBusy(true);
    try {
      await videoApi.updateScene(item.id, {
        included: !item.included,
        expected_revision: item.revision,
      });
      refresh();
    } catch (err) {
      setError(videoError(err, kk));
    } finally {
      setBusy(false);
    }
  }
  const allReady = Boolean(
    scenes.filter((s) => s.included).length &&
      scenes
        .filter((s) => s.included)
        .every((s) => versionAssetId(selectedVersion(s))),
  );
  const inFlight = project?.jobs.filter(isActiveVideoJob).length ?? 0;
  const nextAfter = addAfter
    ? scenes[scenes.findIndex((s) => s.id === addAfter.id) + 1]
    : undefined;
  const reusableNext =
    nextAfter &&
    !nextAfter.selected_version_id &&
    !nextAfter.source_scene_id &&
    !project?.jobs.some(
      (j) => j.scene_id === nextAfter.id && isActiveVideoJob(j),
    )
      ? nextAfter
      : undefined;
  async function continueExisting() {
    if (!reusableNext || !addAfter?.selected_version_id) return;
    setBusy(true);
    setError("");
    try {
      await videoApi.rebase(
        reusableNext.id,
        addAfter.selected_version_id,
        addAfter.id,
      );
      setSceneId(reusableNext.id);
      setAddAfter(null);
      refresh();
    } catch (err) {
      setError(videoError(err, kk));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] pb-8">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div
            className={`mb-1 items-center gap-2 ${project && screen === "studio" ? "hidden" : "flex"}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Sandu AI · Video Studio
            </p>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {kk ? "Видеостудия" : "Видеостудия"}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={screen === "library" ? "primary" : "secondary"}
            onClick={() =>
              setScreen(screen === "library" ? "studio" : "library")
            }
          >
            <Icon name="grid" />
            {kk ? "Менің видеоларым" : "Мои видео"}
            {projects.length ? (
              <span className="ml-1 text-[10px] opacity-60">
                {projects.length}
              </span>
            ) : (
              ""
            )}
          </Button>
          <Button
            disabled={busy || !catalog.data || !fastAvailable}
            aria-label={kk ? "Жаңа видео" : "Новое видео"}
            onClick={() => void createProject()}
          >
            <Icon name="plus" />
            <span
              className={
                project && screen === "studio" ? "hidden sm:inline" : ""
              }
            >
              {kk ? "Жаңа видео" : "Новое видео"}
            </span>
          </Button>
        </div>
      </header>
      <details className="group mb-4 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-2 text-[11px] leading-5 text-amber-900">
        <summary className="flex min-h-7 cursor-pointer list-none flex-wrap items-center gap-x-2 gap-y-1">
          <Icon name="clock" className="h-3.5 w-3.5" />
          <span>
            {kk
              ? "Видео 24 сағат сақталады. Дайын роликті жүктеп алыңыз."
              : "Видео хранятся 24 часа. Скачайте готовый ролик."}
          </span>
          <span className="ml-auto text-amber-700 underline decoration-dotted underline-offset-4">
            {kk ? "Толығырақ" : "Подробнее"}
          </span>
        </summary>
        <p className="mt-2 border-t border-amber-100 pt-2">
          {kk
            ? "Әр файл жасалғаннан кейін 24 сағаттан соң жойылады. Жоба соңғы өзгерістен кейін 24 сағаттан соң барлық материалдарымен жойылады. Қарау сақтау мерзімін ұзартпайды."
            : "Каждый файл удаляется через 24 часа после создания. Проект со всеми материалами — через 24 часа после последнего изменения. Просмотр не продлевает хранение."}
        </p>
      </details>
      {catalog.data && !fastAvailable && (
        <aside className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
          {kk
            ? "«Жылдам» әдепкі профилі уақытша қолжетімсіз. Сахналармен құрастыруда қолжетімді модельді таңдауға болады."
            : "Профиль «Быстрый» для новых клипов временно недоступен. В построении по сценам можно выбрать доступную модель."}
          <Button
            className="ml-3"
            variant="ghost"
            onClick={() => setDialog("plan")}
          >
            {kk ? "Модельді таңдау" : "Выбрать модель"}
          </Button>
        </aside>
      )}
      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs leading-6 text-rose-700"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label={kk ? "Жабу" : "Закрыть"}
          >
            <Icon name="close" />
          </button>
        </div>
      )}
      {catalog.isLoading ? (
        <div className="grid min-h-72 place-items-center rounded-3xl border border-slate-200 bg-white text-slate-400">
          <Spinner className="h-7 w-7" />
        </div>
      ) : catalog.isError ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8">
          <p className="text-sm text-slate-600">
            {kk
              ? "Видеостудияға қосылу мүмкін болмады."
              : "Не удалось подключиться к видеостудии."}
          </p>
          <Button className="mt-4" onClick={() => void catalog.refetch()}>
            <Icon name="refresh" />
            {kk ? "Қайталау" : "Повторить"}
          </Button>
        </div>
      ) : screen === "library" ? (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-600">
              {kk ? "Жобалар мен клиптер" : "Проекты и клипы"}
            </h2>
            <Button
              variant="ghost"
              onClick={() => void library.refetch()}
              aria-label={kk ? "Тізімді жаңарту" : "Обновить список"}
            >
              <Icon name="refresh" />
            </Button>
          </div>
          {library.isLoading ? (
            <Spinner />
          ) : library.isError ? (
            <div
              role="alert"
              className="rounded-2xl bg-white p-5 text-xs text-slate-500"
            >
              {videoError(library.error, kk)}
              <Button className="ml-3" onClick={() => void library.refetch()}>
                {kk ? "Қайталау" : "Повторить"}
              </Button>
            </div>
          ) : projects.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((item) => (
                <LibraryCard
                  key={item.id}
                  item={item}
                  catalog={catalog.data}
                  kk={kk}
                  onOpen={(selectedSceneId) =>
                    openProject(item.id, selectedSceneId)
                  }
                  onDelete={() =>
                    setDeletion({
                      kind: "project",
                      id: item.id,
                      title: item.title,
                    })
                  }
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <Icon name="film" className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-4 text-sm font-semibold text-slate-700">
                {kk
                  ? "Алғашқы видеоңызды жасаңыз"
                  : "Создайте своё первое видео"}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {kk
                  ? "Мұнда жобалар, сахна нұсқалары және дайын MP4 болады."
                  : "Здесь будут проекты, версии сцен и готовые MP4."}
              </p>
              <Button
                variant="primary"
                className="mt-5"
                disabled={busy || !fastAvailable}
                onClick={() => void createProject()}
              >
                <Icon name="plus" />
                {kk ? "Видео жасау" : "Создать видео"}
              </Button>
            </div>
          )}
          {library.hasNextPage && (
            <div className="mt-5 flex justify-center">
              <Button
                disabled={library.isFetchingNextPage}
                onClick={() => void library.fetchNextPage()}
              >
                {library.isFetchingNextPage ? (
                  <Spinner />
                ) : (
                  <Icon name="plus" />
                )}
                {kk ? "Тағы жобалар" : "Показать ещё проекты"}
              </Button>
            </div>
          )}
        </section>
      ) : projectId && query.isLoading ? (
        <div className="grid min-h-80 place-items-center rounded-3xl bg-white text-slate-400">
          <Spinner className="h-7 w-7" />
        </div>
      ) : projectId && (query.isError || expired) ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-8">
          <Icon name="clock" className="h-8 w-8 text-amber-400" />
          <h2 className="mt-4 text-lg font-semibold text-slate-800">
            {expired
              ? kk
                ? "Жобаның мерзімі аяқталды"
                : "Срок хранения проекта истёк"
              : kk
                ? "Жобаны ашу мүмкін болмады"
                : "Не удалось открыть проект"}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            {expired
              ? kk
                ? "Жоба мен материалдар 24 сағат белсенділік болмаған соң жойылады. Жаңа жоба бастауға болады."
                : "Проект и материалы удаляются после 24 часов без изменений. Можно начать новый проект."
              : videoError(query.error, kk)}
          </p>
          <div className="mt-5 flex gap-2">
            <Button
              variant="primary"
              onClick={() => {
                setProjectId(null);
                rememberVideoProject(ownerId, null);
              }}
            >
              {kk ? "Жаңа жобаны бастау" : "Начать новый проект"}
            </Button>
            {!expired && (
              <Button onClick={() => void query.refetch()}>
                {kk ? "Қайталау" : "Повторить"}
              </Button>
            )}
          </div>
        </section>
      ) : project && catalog.data ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <button
                type="button"
                className="max-w-full truncate text-left text-sm font-semibold text-slate-800 hover:text-indigo-600"
                onClick={() => setDialog("details")}
                title={
                  kk
                    ? "Жоба атауы мен параметрлері"
                    : "Название и настройки проекта"
                }
              >
                {project.title}{" "}
                <span aria-hidden="true" className="ml-1 text-slate-400">
                  ⌄
                </span>
              </button>
              <p className="mt-1 text-[11px] text-slate-500">
                {scenes.filter((item) => item.included).length}{" "}
                {kk ? "сахна роликте" : "сцен в ролике"} ·{" "}
                {projectDuration(project).toFixed(1)} {kk ? "сек" : "сек"}
                <span className="ml-2 text-amber-600">
                  {expiryLabel(project.expires_at, kk)}{" "}
                  {kk ? "қалды" : "до удаления проекта"}
                </span>
                {inFlight > 0
                  ? ` · ${inFlight} ${kk ? "жасалуда" : "в работе"}`
                  : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" onClick={() => setDialog("plan")}>
                <Icon name="sparkles" />
                {kk ? "Сценарий" : "Сценарий"}
              </Button>
              {allReady && (
                <Button onClick={() => setDialog("preview")}>
                  <Icon name="play" />
                  {kk ? "Роликті қарау" : "Смотреть весь ролик"}
                </Button>
              )}
              {(scenes.some((item) =>
                Boolean(versionAssetId(selectedVersion(item))),
              ) ||
                project.exports.length > 0) && (
                <Button variant="primary" onClick={() => setDialog("export")}>
                  <Icon name="download" />
                  {kk ? "Роликті жүктеу" : "Скачать ролик"}
                </Button>
              )}
            </div>
          </div>
          {scene ? (
            <SceneEditor
              key={`${ownerId}:${scene.id}`}
              scene={scene}
              project={project}
              catalog={catalog.data}
              ownerId={ownerId}
              kk={kk}
              initialMode={imageSceneId === scene.id ? "image" : undefined}
              onRefresh={refresh}
              onAdd={(source) => setAddAfter(source ?? scene)}
              onDelete={(item) =>
                setDeletion({ kind: "scene", id: item.id, title: item.title })
              }
              timeline={
                <SceneTimeline
                  scenes={scenes.map((item) => ({
                    ...item,
                    jobs: project.jobs.filter(
                      (job) => job.scene_id === item.id,
                    ),
                  }))}
                  selectedSceneId={scene.id}
                  projectExpiresAt={project.expires_at}
                  kk={kk}
                  disabled={busy || reordering}
                  onSelect={setSceneId}
                  onAddAfter={(item) => {
                    if (scenes.length < catalog.data!.max_scenes)
                      setAddAfter(item);
                    else
                      setError(
                        kk
                          ? `Ең көбі ${catalog.data!.max_scenes} сахна қосуға болады.`
                          : `В одном ролике может быть до ${catalog.data!.max_scenes} сцен.`,
                      );
                  }}
                  onReorder={reorderScenes}
                  onToggleIncluded={(item) => void toggleIncluded(item)}
                  onDelete={(item) =>
                    setDeletion({
                      kind: "scene",
                      id: item.id,
                      title: item.title,
                    })
                  }
                />
              }
            />
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
              <p className="text-sm text-slate-600">
                {kk ? "Алғашқы сахнадан бастаңыз" : "Начните с первой сцены"}
              </p>
              <Button
                variant="primary"
                className="mt-4"
                disabled={busy}
                onClick={() => void addScene()}
              >
                <Icon name="plus" />
                {kk ? "Сахна қосу" : "Добавить сцену"}
              </Button>
            </div>
          )}
          <details className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
            <summary className="flex min-h-8 cursor-pointer items-center justify-between gap-3 font-medium">
              <span>{kk ? "Жоба шығындары" : "Расходы по проекту"}</span>
              <span>
                {money(project.total_spent_tokens)} {kk ? "токен" : "токенов"}
              </span>
            </summary>
            <div className="grid gap-4 border-t border-slate-100 py-3 sm:grid-cols-3">
              <p>
                {kk ? "Барлық нұсқаларға жұмсалды" : "Потрачено на все версии"}
                <strong className="mt-1 block text-slate-800">
                  {money(project.total_spent_tokens)} ₸
                </strong>
              </p>
              <p>
                {kk
                  ? "Роликтегі клиптердің бастапқы құны"
                  : "Исходная стоимость выбранных клипов"}
                <strong className="mt-1 block text-slate-800">
                  {money(project.selected_cost_tokens)} ₸
                </strong>
              </p>
              <p>
                {kk ? "Қалған сахналардың бағасы" : "Расчёт оставшихся сцен"}
                <strong className="mt-1 block text-slate-800">
                  {money(project.estimated_remaining_tokens)} ₸
                </strong>
                {Boolean(project.unquoted_scene_count) && (
                  <span className="mt-1 block text-[10px]">
                    {project.unquoted_scene_count}{" "}
                    {kk
                      ? "сахнаға баға әлі есептелмеген"
                      : "сцен ещё без расчёта цены"}
                  </span>
                )}
              </p>
            </div>
            <p className="pb-2 text-[10px]">
              {kk
                ? "1 токен = 1 ₸. Дайын клиптерді көшіру мен роликті біріктіру тегін."
                : "1 токен = 1 ₸. Копирование готовых клипов и соединение в ролик бесплатны."}
            </p>
          </details>
        </>
      ) : (
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-7 sm:p-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-semibold text-indigo-600">
                <Icon name="sparkles" className="h-3 w-3" />
                Grok · H3 Max · Native audio
              </span>
              <h2 className="mt-6 max-w-lg text-3xl font-bold leading-[1.2] tracking-tight text-slate-900 sm:text-4xl">
                {kk
                  ? "Кез келген оқиға бір сахнадан басталады"
                  : "Любая история начинается с одной сцены"}
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-slate-500">
                {kk
                  ? "Бір клип жасаңыз немесе сценарий құрастырып, оны сахнадан сахнаға дамытыңыз. Сапа, ұзақтық, камера және дыбыс — өз таңдауыңыз."
                  : "Создайте один клип или подготовьте сценарий и развивайте его сцена за сценой. Качество, длительность, камера и звук — на ваш выбор."}
              </p>
              {initialPrompt && (
                <div className="mt-4 max-h-32 overflow-auto rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-600">
                  {initialPrompt}
                </div>
              )}
              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  className="min-h-12 px-5 text-sm"
                  disabled={busy || !fastAvailable}
                  onClick={() => void createProject()}
                >
                  {busy ? <Spinner /> : <Icon name="plus" />}
                  {kk ? "Видео жасау" : "Создать видео"}
                </Button>
                <Button
                  className="min-h-12 px-5 text-sm"
                  disabled={!catalog.data}
                  onClick={() => setDialog("plan")}
                >
                  <Icon name="scenes" />
                  {kk ? "Сахналармен құрастыру" : "Построить по сценам"}
                </Button>
              </div>
              <p className="mt-4 flex items-center gap-2 text-[10px] text-slate-400">
                <Icon name="shield" className="h-3 w-3" />
                {kk
                  ? "Баға әр генерация алдында көрсетіледі"
                  : "Цена показывается перед каждой генерацией"}
              </p>
            </div>
            <div className="relative flex min-h-[270px] items-center justify-center overflow-hidden bg-[#101524] p-8">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />
              <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />
              <div className="relative w-full max-w-sm">
                <div className="mb-3 flex items-center gap-2 px-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                  <span className="h-1 w-1 rounded-full bg-indigo-400" />
                  {kk ? "Сіздің келесі видеоңыз" : "Ваше следующее видео"}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex aspect-video items-center justify-center rounded-xl border border-white/5 bg-gradient-to-br from-indigo-900/25 via-slate-800 to-teal-950/50">
                    <div className="grid h-14 w-14 place-items-center rounded-full border border-white/15 bg-white/5 text-white/80">
                      <Icon name="play" className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <div className="h-1.5 w-24 rounded bg-white/20" />
                      <div className="mt-2 h-1 w-16 rounded bg-white/10" />
                    </div>
                    <span className="text-[9px] text-slate-500">00:15</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="flex h-12 flex-1 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[10px] font-medium text-slate-500"
                    >
                      {String(n).padStart(2, "0")}
                    </div>
                  ))}
                  <div className="grid h-12 w-10 place-items-center rounded-lg border border-dashed border-indigo-400/40 text-indigo-400">
                    <Icon name="plus" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-px border-t border-slate-100 bg-slate-100 sm:grid-cols-3">
            {[
              [
                "image",
                kk ? "Суретті жандандырыңыз" : "Оживите фото",
                kk
                  ? "Бастапқы кадрдан қозғалысқа"
                  : "От исходного кадра к движению",
              ],
              [
                "scenes",
                kk ? "Әрекетті жалғастырыңыз" : "Продолжите действие",
                kk
                  ? "Соңғы кадр — келесі сахнаның басы"
                  : "Последний кадр — начало новой сцены",
              ],
              [
                "download",
                kk ? "Бір MP4 етіп жинаңыз" : "Соберите в один MP4",
                kk
                  ? "Нұсқалар, қию және тегін жинақтау"
                  : "Версии, обрезка и бесплатная сборка",
              ],
            ].map(([icon, title, desc]) => (
              <div key={title} className="bg-white px-6 py-5">
                <Icon
                  name={icon as "image" | "scenes" | "download"}
                  className="mb-3 h-5 w-5 text-indigo-400"
                />
                <h3 className="text-xs font-semibold text-slate-700">
                  {title}
                </h3>
                <p className="mt-1 text-[11px] leading-5 text-slate-400">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
      {dialog === "plan" && catalog.data && (
        <PlanDialog
          key={project?.id ?? "new"}
          kk={kk}
          catalog={catalog.data}
          project={project}
          initialIdea={project?.idea || initialPrompt}
          onClose={() => setDialog(null)}
          onCreated={(id, selected) => {
            void client.invalidateQueries({
              queryKey: ["video-projects", ownerId],
            });
            openProject(id, selected);
            refresh();
          }}
        />
      )}{" "}
      {dialog === "details" && project && !expired && (
        <ProjectDetails
          project={project}
          catalog={catalog.data!}
          kk={kk}
          onClose={() => setDialog(null)}
          onRefresh={refresh}
        />
      )}{" "}
      {dialog === "preview" && project && !expired && (
        <ProjectPreview
          project={project}
          kk={kk}
          onClose={() => setDialog(null)}
        />
      )}{" "}
      {dialog === "export" && project && !expired && (
        <ExportDialog
          project={project}
          kk={kk}
          onClose={() => setDialog(null)}
          onRefresh={refresh}
        />
      )}
      {addAfter && !expired && (
        <Modal
          title={kk ? "Әрі қарай не болады?" : "Что будет дальше?"}
          onClose={() => setAddAfter(null)}
        >
          <div className="space-y-3">
            {reusableNext && versionAssetId(selectedVersion(addAfter)) && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void continueExisting()}
                className="w-full rounded-2xl border border-teal-200 bg-teal-50 p-4 text-left"
              >
                <strong className="block text-sm text-teal-900">
                  {kk
                    ? "Дайын жоспардағы келесі сахнаны жалғастыру"
                    : "Продолжить следующую сцену из плана"}
                </strong>
                <span className="mt-1 block text-xs leading-6 text-teal-700">
                  {reusableNext.title}.{" "}
                  {kk
                    ? "Жаңа көшірме жасалмайды; бастапқы кадр алдыңғы клиптен алынады."
                    : "Без дубликата: начальный кадр будет взят из предыдущего клипа."}
                  {reusableNext.input_asset_id
                    ? kk
                      ? " Жүктелген сурет осы кадрмен ауыстырылады."
                      : " Загруженное фото будет заменено этим кадром."
                    : ""}
                </span>
              </button>
            )}
            <button
              type="button"
              disabled={!versionAssetId(selectedVersion(addAfter)) || busy}
              onClick={() => void addScene(addAfter, addAfter)}
              className="flex w-full items-start gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 text-left transition hover:bg-indigo-50 disabled:opacity-40"
            >
              <Icon name="scenes" className="mt-1 h-5 w-5 text-indigo-500" />
              <span>
                <strong className="text-sm text-slate-800">
                  {kk ? "Осы сахнаны жалғастыру" : "Продолжить эту сцену"}
                </strong>
                <span className="mt-1 block text-xs leading-6 text-slate-500">
                  {kk
                    ? "Таңдалған клиптің соңғы кадрынан жаңа сахна."
                    : "Начнём с последнего кадра. Опишите, что произойдёт дальше."}
                </span>
              </span>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void addScene(undefined, addAfter)}
              className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 p-4 text-left transition hover:bg-slate-50"
            >
              <Icon name="plus" className="mt-1 h-5 w-5 text-slate-400" />
              <span>
                <strong className="text-sm text-slate-800">
                  {kk ? "Жаңа сахна қосу" : "Новая сцена"}
                </strong>
                <span className="mt-1 block text-xs leading-6 text-slate-500">
                  {kk
                    ? "Тәуелсіз көрініс — мәтіннен немесе басқа суреттен."
                    : "Другое место, время или действие. Просто опишите его."}
                </span>
              </span>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void addScene(undefined, addAfter, "image")}
              className="flex min-h-20 w-full items-start gap-3 rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50 disabled:opacity-40"
            >
              <Icon name="image" className="mt-1 h-5 w-5 text-slate-500" />
              <span>
                <strong className="text-sm text-slate-800">
                  {kk ? "Суреттен сахна" : "Сцена из фото"}
                </strong>
                <span className="mt-1 block text-xs leading-6 text-slate-500">
                  {kk
                    ? "Сурет жүктеп, оның қалай қозғалатынын сипаттаңыз."
                    : "Загрузите картинку и опишите, как её оживить."}
                </span>
              </span>
            </button>
            {!versionAssetId(selectedVersion(addAfter)) && (
              <p className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                {kk
                  ? "Жалғастыру үшін алдымен осы сахнаның видеосын жасаңыз."
                  : "Чтобы продолжить эту сцену, сначала создайте для неё видео."}
              </p>
            )}
            <Button
              className="w-full"
              onClick={() => {
                setAddAfter(null);
                setDialog("plan");
              }}
            >
              <Icon name="sparkles" />
              {kk ? "Сценарийден қосу" : "Добавить из сценария"}
            </Button>
            <p className="text-center text-[11px] text-slate-400">
              {kk
                ? "Сахна қосу тегін. Видео бөлек батырмамен жасалады."
                : "Добавление сцены бесплатно. Видео запускается отдельной кнопкой."}
            </p>
          </div>
        </Modal>
      )}
      {deletion && (
        <Modal
          title={
            deletion.kind === "project"
              ? kk
                ? "Жобаны жою керек пе?"
                : "Удалить проект?"
              : kk
                ? "Сахнаны жою керек пе?"
                : "Удалить сцену?"
          }
          onClose={() => setDeletion(null)}
        >
          <p className="text-sm font-semibold text-slate-800">
            {deletion.title}
          </p>
          <p className="mt-3 text-xs leading-6 text-slate-500">
            {deletion.kind === "project"
              ? kk
                ? "Жоба, барлық сахналар мен жеке файлдар қолжетімсіз болады."
                : "Проект, все сцены и приватные файлы станут недоступны."
              : kk
                ? "Сахна мен оның нұсқалары жобадан алынады. Оған байланысты жалғастырулар бұрынғы клипке сүйенеді."
                : "Сцена и её версии будут удалены из проекта. Связанные продолжения используют прежний исходный клип."}{" "}
            {kk
              ? "Сәтті генерация үшін токендер қайтарылмайды."
              : "Токены за успешные генерации не возвращаются."}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button disabled={busy} onClick={() => setDeletion(null)}>
              {kk ? "Бас тарту" : "Отмена"}
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                const current = deletion;
                void (
                  current.kind === "project"
                    ? videoApi.deleteProject(current.id)
                    : videoApi.deleteScene(current.id)
                )
                  .then(() => {
                    if (
                      current.kind === "project" &&
                      projectId === current.id
                    ) {
                      setProjectId(null);
                      rememberVideoProject(ownerId, null);
                    }
                    refresh();
                    setDeletion(null);
                  })
                  .catch((err) => setError(videoError(err, kk)))
                  .finally(() => setBusy(false));
              }}
            >
              {busy ? <Spinner /> : <Icon name="trash" />}
              {kk ? "Жою" : "Удалить"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
