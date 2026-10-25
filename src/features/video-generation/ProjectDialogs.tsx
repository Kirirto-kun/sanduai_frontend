"use client";
import { useState } from "react";
import { createIdempotencyKey } from "@/lib/idempotency";
import { videoApi } from "./api";
import { ApiRequestError } from "@/lib/http-client";
import { mergeVideoDraft } from "./draft-merge";
import {
  expiryLabel,
  isActiveVideoJob,
  modelDurations,
  projectDuration,
  promptVideoSettings,
  sceneDuration,
  selectedVersion,
  settingsForModel,
  versionAssetId,
  videoError,
} from "./model";
import { DownloadVideo, PrivateMedia } from "./PrivateMedia";
import type { VideoCatalog, VideoExport, VideoProject } from "./types";
import { Button, Field, Icon, Modal, Spinner, fieldClass } from "./ui";

function projectFields(project: VideoProject) {
  return {
    title: project.title,
    idea: project.idea,
    script: project.script,
  };
}

export function ProjectDetails({
  project,
  catalog,
  kk,
  onClose,
  onRefresh,
}: {
  project: VideoProject;
  catalog: VideoCatalog;
  kk: boolean;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [value, setValue] = useState(() => projectFields(project));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [defaults, setDefaults] = useState(() =>
    promptVideoSettings(project.defaults),
  );
  const [baseline, setBaseline] = useState(project);
  const [conflict, setConflict] = useState<VideoProject | null>(null);
  const [applyDrafts, setApplyDrafts] = useState(false);
  const model = catalog.models.find((m) => m.id === defaults.model_id);
  async function persist() {
    setBusy(true);
    setError("");
    try {
      const saved = await videoApi.updateProject(project.id, {
        ...value,
        defaults,
        expected_revision: baseline.revision,
      });
      setBaseline(saved);
      if (applyDrafts)
        for (const scene of project.scenes.filter(
          (s) =>
            !s.selected_version_id &&
            !project.jobs.some(
              (j) => j.scene_id === s.id && isActiveVideoJob(j),
            ),
        )) {
          await videoApi.updateScene(scene.id, {
            expected_revision: scene.revision,
            settings: {
              ...scene.settings,
              model_id: defaults.model_id,
              resolution: defaults.resolution,
              duration: defaults.duration,
            },
          });
        }
      onRefresh();
      onClose();
    } catch (err) {
      onRefresh();
      if (err instanceof ApiRequestError && err.status === 409) {
        const latest = await videoApi.project(project.id).catch(() => null);
        if (latest) setConflict(latest);
      }
      setError(videoError(err, kk));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={kk ? "Жоба туралы" : "О проекте"} wide onClose={onClose}>
      <p className="mb-5 text-xs leading-6 text-slate-500">
        {kk
          ? "Жобаның атауы мен идеясын сақтаңыз. Қалған өрістерді қажет болса толтыруға болады."
          : "Сохраните название и идею. Остальные поля можно заполнить, когда они понадобятся."}
      </p>
      <fieldset disabled={busy} className="min-w-0 space-y-4">
        <Field label={kk ? "Жоба атауы" : "Название проекта"}>
          <input
            className={fieldClass}
            value={value.title}
            maxLength={240}
            onChange={(e) => setValue({ ...value, title: e.target.value })}
          />
        </Field>
        <Field label={kk ? "Видео не туралы?" : "О чём видео?"}>
          <textarea
            rows={2}
            className={fieldClass}
            value={value.idea}
            maxLength={20000}
            onChange={(e) => setValue({ ...value, idea: e.target.value })}
          />
        </Field>
        <details className="rounded-2xl border border-slate-200 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            {kk ? "Толық сценарий" : "Полный сценарий"}
          </summary>
          <div className="mt-4">
            <Field label={kk ? "Сценарий" : "Сценарий"}>
              <textarea
                rows={5}
                className={fieldClass}
                value={value.script}
                maxLength={40000}
                onChange={(e) => setValue({ ...value, script: e.target.value })}
              />
            </Field>
          </div>
        </details>
        <details className="rounded-2xl border border-slate-200 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            {kk ? "Жаңа көріністердің баптаулары" : "Настройки новых сцен"}
          </summary>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {kk
              ? "Келесі қосылатын көріністер осы баптаулардан басталады. Әр көріністе оларды бөлек өзгертуге болады."
              : "С этими параметрами будут создаваться новые сцены. В каждой сцене их можно изменить отдельно."}
          </p>
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label={kk ? "Модель" : "Модель"}>
                <select
                  className={fieldClass}
                  value={defaults.model_id}
                  onChange={(e) => {
                    const next = catalog.models.find(
                      (m) => m.id === e.target.value,
                    );
                    if (next)
                      setDefaults({
                        ...settingsForModel(defaults, next),
                        aspect_ratio: project.aspect_ratio,
                      });
                  }}
                >
                  {catalog.models.map((m) => (
                    <option
                      key={m.id}
                      value={m.id}
                      disabled={
                        !m.available ||
                        !m.aspect_ratios.includes(project.aspect_ratio)
                      }
                    >
                      {m.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={kk ? "Сапа" : "Качество"}>
                <select
                  className={fieldClass}
                  value={defaults.resolution}
                  onChange={(e) =>
                    setDefaults({ ...defaults, resolution: e.target.value })
                  }
                >
                  {(model?.resolutions ?? [defaults.resolution]).map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </Field>
              <Field label={kk ? "Ұзақтығы, сек" : "Длительность, сек"}>
                <select
                  className={fieldClass}
                  value={defaults.duration}
                  onChange={(e) =>
                    setDefaults({
                      ...defaults,
                      duration: Number(e.target.value),
                    })
                  }
                >
                  {(model ? modelDurations(model) : [defaults.duration]).map(
                    (d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ),
                  )}
                </select>
              </Field>
            </div>
            <label className="flex items-start gap-3 rounded-xl bg-indigo-50 p-4 text-xs leading-6 text-indigo-800">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 accent-indigo-600"
                checked={applyDrafts}
                onChange={(e) => setApplyDrafts(e.target.checked)}
              />
              {kk
                ? "Осы баптауларды видеосы әлі жасалмаған көріністерге де қолдану. Дайын видео мен репликалар сақталады."
                : "Обновить эти параметры и у сцен, для которых видео ещё не создано. Готовые видео и реплики сохранятся."}
            </label>
          </div>
        </details>
        <Button
          variant="primary"
          disabled={busy || Boolean(conflict) || !value.title.trim()}
          className="w-full"
          onClick={() => void persist()}
        >
          {busy ? <Spinner /> : <Icon name="check" />}
          {kk ? "Өзгерістерді сақтау" : "Сохранить изменения"}
        </Button>
        {error && (
          <p role="alert" className="text-xs text-rose-600">
            {error}
          </p>
        )}
        {conflict && (
          <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
            <p>
              {kk
                ? "Жобаны басқа терезе өзгертті. Сіздің мәтініңіз осы жерде сақталды. Жаңа нұсқаны жүктеңіз; бірдей өрістер өзгерсе, өз мәндеріңізді сақтауды таңдауға болады."
                : "Проект изменился в другой вкладке. Ваш текст сохранён здесь. Загрузите актуальную версию; если изменены одни поля, можно явно сохранить свои значения."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  const keys = Object.keys(value) as Array<keyof typeof value>;
                  const old = {
                    ...projectFields(baseline),
                    defaults: baseline.defaults,
                  };
                  const remote = {
                    ...projectFields(conflict),
                    defaults: conflict.defaults,
                  };
                  const merged = mergeVideoDraft(
                    old,
                    { ...value, defaults },
                    remote,
                  ).draft;
                  setValue(
                    Object.fromEntries(
                      keys.map((key) => [key, merged[key]]),
                    ) as typeof value,
                  );
                  setDefaults(promptVideoSettings(merged.defaults));
                  setBaseline(conflict);
                  setConflict(null);
                  setError("");
                }}
              >
                {kk
                  ? "Жаңарту, өз өрістерімді сақтау"
                  : "Обновить, сохранив мои поля"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  const latest = conflict;
                  setValue(projectFields(latest));
                  setDefaults(promptVideoSettings(latest.defaults));
                  setBaseline(latest);
                  setConflict(null);
                  setError("");
                }}
              >
                {kk ? "Өз түзетулерімнен бас тарту" : "Отменить мои правки"}
              </Button>
            </div>
          </div>
        )}
      </fieldset>
    </Modal>
  );
}

export function ProjectPreview({
  project,
  kk,
  onClose,
}: {
  project: VideoProject;
  kk: boolean;
  onClose: () => void;
}) {
  const scenes = project.scenes.filter((s) => s.included);
  const [index, setIndex] = useState(0);
  const scene = scenes[index];
  const version = selectedVersion(scene);
  const id = versionAssetId(version);
  const incomplete = scenes.filter((s) => !versionAssetId(selectedVersion(s)));
  return (
    <Modal
      title={kk ? "Роликті қарау" : "Посмотреть ролик"}
      wide
      onClose={onClose}
    >
      {incomplete.length > 0 ? (
        <div className="space-y-4 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          <p>
            {kk
              ? "Бұл көріністердің видеосы әлі дайын емес: "
              : "Для этих сцен ещё нет готового видео: "}
            {incomplete.map((s) => s.title).join(", ")}.
          </p>
          <p>
            {kk
              ? "Олардың видеосын жасаңыз немесе көрініс мәзірінен «Роликтен алып тастау» пәрменін таңдаңыз. Содан кейін роликті толық көре аласыз."
              : "Сгенерируйте их или выберите «Убрать из ролика» в меню сцены. После этого можно посмотреть весь ролик."}
          </p>
          <Button onClick={onClose}>
            {kk ? "Көріністерге оралу" : "Вернуться к сценам"}
          </Button>
        </div>
      ) : scene && id ? (
        <>
          <PrivateMedia
            projectExpiresAt={project.expires_at}
            key={scene.id}
            assetId={id}
            expiresAt={version?.asset?.expires_at ?? version?.expires_at}
            kk={kk}
            trimIn={Number(scene.trim_in ?? 0)}
            trimOut={
              scene.trim_out === null ? undefined : Number(scene.trim_out)
            }
            autoPlay={index > 0}
            onEnded={() => {
              if (index + 1 < scenes.length) setIndex(index + 1);
            }}
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-700">
              {kk ? "Көрініс" : "Сцена"} {index + 1} / {scenes.length} ·{" "}
              {scene.title}
            </p>
            <span className="text-xs text-slate-400">
              {sceneDuration(scene).toFixed(1)} {kk ? "сек" : "сек"}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button disabled={index === 0} onClick={() => setIndex(index - 1)}>
              {kk ? "Алдыңғы" : "Предыдущая"}
            </Button>
            <select
              className={`${fieldClass} min-w-0 flex-1 sm:w-auto`}
              aria-label={kk ? "Көріністі таңдау" : "Перейти к сцене"}
              value={index}
              onChange={(e) => setIndex(Number(e.target.value))}
            >
              {scenes.map((s, i) => (
                <option key={s.id} value={i}>
                  {i + 1}. {s.title}
                </option>
              ))}
            </select>
            <Button
              disabled={index + 1 >= scenes.length}
              onClick={() => setIndex(index + 1)}
            >
              {kk ? "Келесі" : "Следующая"}
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-500">
          {kk
            ? "Роликте әлі көрініс жоқ. Көрініс қосып, оның видеосын жасаңыз."
            : "В ролике пока нет сцен. Добавьте сцену и сгенерируйте для неё видео."}
        </p>
      )}
    </Modal>
  );
}

export function ExportDialog({
  project,
  kk,
  onClose,
  onRefresh,
}: {
  project: VideoProject;
  kk: boolean;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [resolution, setResolution] = useState("720p");
  const [aspect, setAspect] = useState(project.aspect_ratio);
  const [crop, setCrop] = useState("contain");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [transition, setTransition] = useState<"cut" | "fade">("cut");
  const [key] = useState(createIdempotencyKey);
  const included = project.scenes.filter((s) => s.included);
  const incomplete = included.filter(
    (s) => !versionAssetId(selectedVersion(s)),
  );
  const hasSmall = included.some(
    (s) =>
      Number(selectedVersion(s)?.settings.resolution?.replace("p", "") ?? 0) <
      Number(resolution.replace("p", "")),
  );
  const active = project.exports.some((e) => isActiveVideoJob(e));
  const firstScene = included.find((s) => versionAssetId(selectedVersion(s)));
  const firstVersion = selectedVersion(firstScene);
  const excluded = project.scenes.filter((s) => !s.included);
  const exports = project.exports.slice().reverse();
  const latestExport = exports[0];
  function exportCard(item: VideoExport, latest = false) {
    const assetId = item.asset_id ?? item.asset?.id;
    return (
      <div
        key={item.id}
        className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${latest && assetId ? "border-emerald-200 bg-emerald-50" : "border-slate-200"}`}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">
            {isActiveVideoJob(item)
              ? kk
                ? "Ролик дайындалуда…"
                : "Готовим ролик…"
              : item.status === "failed"
                ? kk
                  ? "Роликті дайындау мүмкін болмады"
                  : "Не удалось подготовить ролик"
                : assetId
                  ? latest
                    ? kk
                      ? "Соңғы дайын файл"
                      : "Последний готовый файл"
                    : kk
                      ? "Дайын файл"
                      : "Готовый файл"
                  : kk
                    ? "Файл қолжетімсіз"
                    : "Файл недоступен"}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            MP4 · {item.resolution}
            {item.expires_at ? ` · ${expiryLabel(item.expires_at, kk)}` : ""}
          </p>
          {latest && assetId && (
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {kk
                ? "Одан кейін көріністер өзгерсе, төмендегі батырмамен жаңа файл дайындаңыз."
                : "Если после подготовки меняли сцены, подготовьте новый файл кнопкой ниже."}
            </p>
          )}
          {item.status === "failed" && (
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {kk
                ? "Төмендегі батырмамен қайта көріңіз. Токендер алынбайды."
                : "Попробуйте ещё раз кнопкой ниже. Токены не списываются."}
            </p>
          )}
        </div>
        {assetId ? (
          <DownloadVideo
            projectExpiresAt={project.expires_at}
            expiresAt={item.expires_at ?? item.asset?.expires_at}
            assetId={assetId}
            name={project.title}
            kk={kk}
          />
        ) : isActiveVideoJob(item) ? (
          <Spinner />
        ) : null}
      </div>
    );
  }
  return (
    <Modal
      wide
      title={kk ? "Роликті жүктеп алу" : "Скачать ролик"}
      onClose={onClose}
    >
      {latestExport && (
        <div className="mb-5" aria-live="polite">
          {exportCard(latestExport, true)}
        </div>
      )}
      <div className="mb-5 rounded-2xl bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-800">
          {kk ? "Роликтегі көріністер" : "Сцен в ролике"}: {included.length} ·{" "}
          {projectDuration(project).toFixed(1)} {kk ? "сек" : "сек"}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {kk
            ? "Көріністерді өзіңіз қойған ретпен бір MP4 файлға біріктіреміз. Әр көріністің өз дыбысы сақталады. Дайындау мен жүктеу тегін."
            : "Соединим сцены в вашем порядке в один MP4. Звук каждой сцены сохранится. Подготовка и скачивание бесплатны."}
        </p>
        {excluded.length > 0 && (
          <details className="mt-2 text-xs text-slate-500">
            <summary className="cursor-pointer">
              {kk ? "Роликке кірмейтін көріністер" : "Не войдут в ролик"}:{" "}
              {excluded.length}
            </summary>
            <p className="mt-2 leading-5">
              {excluded.map((s) => s.title).join(", ")}
            </p>
          </details>
        )}
      </div>
      {included.length === 0 && (
        <p className="mb-5 rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-800">
          {kk
            ? "Роликте әлі көрініс жоқ. Көріністерге оралып, роликке кемінде бір дайын видео қосыңыз."
            : "В ролике пока нет сцен. Вернитесь к сценам и добавьте в ролик хотя бы одно готовое видео."}
        </p>
      )}
      {incomplete.length > 0 && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold text-amber-800">
            {kk
              ? "Кейбір көріністердің видеосы әлі дайын емес"
              : "Для некоторых сцен ещё нет видео"}
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-700">
            {incomplete.map((s) => s.title).join(", ")}.{" "}
            {kk
              ? "Видеосын жасаңыз немесе көрініс мәзірінен «Роликтен алып тастау» пәрменін таңдаңыз."
              : "Сгенерируйте их или выберите «Убрать из ролика» в меню сцены."}
          </p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={kk ? "Видео сапасы" : "Качество видео"}>
          <select
            className={fieldClass}
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
          >
            {["480p", "720p", "768p", "1080p"].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label={kk ? "Видео пішімі" : "Формат видео"}>
          <select
            className={fieldClass}
            value={aspect}
            onChange={(e) => setAspect(e.target.value)}
          >
            {Array.from(
              new Set([project.aspect_ratio, "16:9", "9:16", "1:1", "4:5"]),
            ).map((r) => (
              <option key={r} value={r}>
                {r === "16:9"
                  ? kk
                    ? "Көлденең · 16:9"
                    : "Горизонтальный · 16:9"
                  : r === "9:16"
                    ? kk
                      ? "Тік · 9:16"
                      : "Вертикальный · 9:16"
                    : r === "1:1"
                      ? kk
                        ? "Шаршы · 1:1"
                        : "Квадратный · 1:1"
                      : r === "4:5"
                        ? kk
                          ? "Тік · 4:5"
                          : "Вертикальный · 4:5"
                        : r}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <details className="mt-4 rounded-2xl border border-slate-200 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">
          {kk ? "Кадрды қию және өтулер" : "Обрезка кадра и переходы"}
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={kk ? "Кадрды орналастыру" : "Размещение кадра"}>
            <select
              className={fieldClass}
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
            >
              <option value="contain">
                {kk ? "Кадрды толық сақтау" : "Сохранить кадр целиком"}
              </option>
              <option value="crop">
                {kk ? "Ортасынан қию" : "Обрезать по центру"}
              </option>
            </select>
          </Field>
          <Field
            label={kk ? "Көріністер арасындағы өту" : "Переход между сценами"}
          >
            <select
              className={fieldClass}
              value={transition}
              onChange={(e) => setTransition(e.target.value as "cut" | "fade")}
            >
              <option value="cut">
                {kk ? "Бірден келесі көрініске" : "Сразу к следующей сцене"}
              </option>
              <option value="fade">
                {kk ? "Қысқа бәсеңдеу" : "Короткое затухание"}
              </option>
            </select>
          </Field>
        </div>
        {transition === "fade" && (
          <p className="mt-2 text-xs leading-5 text-amber-700">
            {kk
              ? "Көріністердің басы мен соңында дыбыс пен бейне қысқа бәсеңдейді. Реплика соңында үзіліс барын тексеріңіз."
              : "В начале и конце сцен звук и изображение кратко затухают. Проверьте, что в конце реплики есть пауза."}
          </p>
        )}
      </details>
      {(aspect !== project.aspect_ratio || crop === "crop") && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
          <p>
            {kk
              ? "Кадрдың қалай орналасатынын тексеріңіз. Ортасынан қию шеткі нысандарды жасыруы мүмкін. Кадрды толық сақтағанда бос өріс қосылады."
              : "Проверьте, как поместится кадр. Обрезка по центру может скрыть объекты у краёв. При сохранении целиком добавятся поля."}
          </p>
          <div className="mx-auto mt-4 max-w-sm overflow-hidden rounded-2xl bg-slate-900">
            {versionAssetId(firstVersion) ? (
              <PrivateMedia
                projectExpiresAt={project.expires_at}
                key={firstVersion!.id}
                assetId={versionAssetId(firstVersion)!}
                expiresAt={
                  firstVersion?.expires_at ?? firstVersion?.asset?.expires_at
                }
                kk={kk}
                fit={crop as "contain" | "crop"}
                frameAspect={aspect}
                trimIn={Number(firstScene?.trim_in ?? 0)}
                trimOut={firstScene?.trim_out}
              />
            ) : (
              <p className="p-5 text-slate-400">
                {project.aspect_ratio} → {aspect}
              </p>
            )}
          </div>
        </div>
      )}
      {hasSmall && (
        <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
          {kk
            ? "Кейбір көріністердің сапасы таңдалғаннан төмен. Олардың өлшемі үлкейеді, бірақ жаңа детальдар қосылмайды."
            : "Качество некоторых сцен ниже выбранного. Их размер увеличится, но новые детали не появятся."}
        </p>
      )}
      <Button
        variant="primary"
        className="mt-5 w-full"
        disabled={
          busy || active || incomplete.length > 0 || included.length === 0
        }
        onClick={() => {
          setBusy(true);
          setError("");
          void videoApi
            .export(
              project.id,
              { resolution, aspect_ratio: aspect, crop_mode: crop, transition },
              key,
            )
            .then(onRefresh)
            .catch((err) => setError(videoError(err, kk)))
            .finally(() => setBusy(false));
        }}
      >
        {busy || active ? <Spinner /> : <Icon name="film" />}
        {busy || active
          ? kk
            ? "Ролик дайындалуда…"
            : "Готовим ролик…"
          : kk
            ? "MP4 дайындау · тегін"
            : "Подготовить MP4 · бесплатно"}
      </Button>
      {error && (
        <p role="alert" className="mt-3 text-xs text-rose-600">
          {error}
        </p>
      )}
      {exports.length > 1 && (
        <details className="mt-6 border-t border-slate-100 pt-4">
          <summary className="cursor-pointer text-xs font-semibold text-slate-500">
            {kk ? "Алдыңғы файлдар" : "Предыдущие файлы"} · {exports.length - 1}
          </summary>
          <div className="mt-3 space-y-3">
            {exports.slice(1).map((item) => exportCard(item))}
          </div>
        </details>
      )}
    </Modal>
  );
}
