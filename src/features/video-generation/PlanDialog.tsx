"use client";
import { useState } from "react";
import { videoApi } from "./api";
import {
  catalogDefaultSettings,
  modelDurations,
  promptVideoSettings,
  settingsForModel,
  videoError,
} from "./model";
import {
  nearestScenarioDuration,
  scenarioCapacity,
  scenarioDurationOptions,
  scenarioPrompt,
} from "./scenario";
import type { VideoCatalog, VideoPlan, VideoProject } from "./types";
import { Button, Field, Icon, Modal, Spinner, fieldClass } from "./ui";

export function PlanDialog({
  kk,
  catalog,
  initialIdea = "",
  project,
  onClose,
  onCreated,
}: {
  kk: boolean;
  catalog: VideoCatalog;
  initialIdea?: string;
  project?: VideoProject | null;
  onClose: () => void;
  onCreated: (id: string, sceneId?: string) => void;
}) {
  const initialRemainingScenes = Math.min(
    catalog.max_scenes - (project?.scenes.length ?? 0),
    20,
  );
  const [idea, setIdea] = useState(initialIdea);
  const [count, setCount] = useState(
    Math.max(1, Math.min(3, initialRemainingScenes)),
  );
  const [requestedDuration, setRequestedDuration] = useState(15);
  const [speechLanguage, setSpeechLanguage] = useState(
    project?.defaults.speech_language ?? "",
  );
  const [model, setModel] = useState(() => {
    const preferred =
      project?.defaults.model_id ??
      catalogDefaultSettings(catalog, kk ? "kk" : "ru").model_id;
    return catalog.models.some((m) => m.id === preferred && m.available)
      ? preferred
      : (catalog.models.find((m) => m.available)?.id ?? preferred);
  });
  const [proposal, setProposal] = useState<VideoPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState<string[]>([]);
  const [createdProject, setCreatedProject] = useState<VideoProject | null>(
    project ?? null,
  );
  const currentProject =
    project && createdProject
      ? (project.revision ?? 0) >= (createdProject.revision ?? 0)
        ? project
        : createdProject
      : (project ?? createdProject);
  const capacity = scenarioCapacity(currentProject, proposal, applied, catalog);
  const remainingScenes = Math.min(capacity.remainingScenes, 20);
  const capability = catalog.models.find((m) => m.id === model);
  const shotDurations = capability ? modelDurations(capability) : [];
  const totalDurations = scenarioDurationOptions(shotDurations, count).filter(
    (value) => value <= capacity.remainingDuration,
  );
  const duration = nearestScenarioDuration(totalDurations, requestedDuration);
  const canPlan = Boolean(
    idea.trim() &&
      capability?.available &&
      count <= remainingScenes &&
      totalDurations.length,
  );

  async function plan() {
    if (!canPlan) return;
    setBusy(true);
    setError("");
    try {
      const result = await videoApi.plan({
        idea,
        language: kk ? "kk" : "ru",
        speech_language: speechLanguage,
        scene_count: count,
        total_duration: duration,
        model_id: model,
      });
      setProposal({
        ...result,
        scenes: result.scenes.map((scene) => ({
          ...scene,
          prompt: scenarioPrompt(scene),
          dialogue: "",
        })),
      });
    } catch (err) {
      setError(videoError(err, kk));
    } finally {
      setBusy(false);
    }
  }

  async function accept() {
    if (!proposal || !capability) return;
    const limitError = kk
      ? "Қалған көріністер жоба шегінен асып кетті. Көрініс санын немесе ұзақтығын азайтыңыз."
      : "Оставшиеся сцены превышают лимит проекта. Уменьшите количество сцен или их длительность.";
    if (!capacity.fits) {
      setError(limitError);
      return;
    }
    setBusy(true);
    setError("");
    let target = currentProject;
    const accepted = [...applied];
    try {
      const defaults = {
        ...promptVideoSettings(
          settingsForModel(
            project?.defaults ??
              catalogDefaultSettings(catalog, kk ? "kk" : "ru"),
            capability,
          ),
        ),
        speech_language: speechLanguage,
        speech_text: "",
      };
      if (target) {
        target = await videoApi.project(target.id);
        setCreatedProject(target);
        if (!scenarioCapacity(target, proposal, accepted, catalog).fits) {
          setError(limitError);
          return;
        }
      }
      if (!target) {
        target = await videoApi.createProject({
          title: proposal.title || (kk ? "Жаңа видео" : "Новое видео"),
          idea,
          script: proposal.script,
          language: kk ? "kk" : "ru",
          aspect_ratio: defaults.aspect_ratio,
          defaults,
          characters: proposal.characters,
          visual_style: proposal.visual_style,
          audio_notes: proposal.audio_notes,
        });
        setCreatedProject(target);
      } else if (!accepted.length) {
        await videoApi.updateProject(target.id, {
          expected_revision: target.revision,
          script: proposal.script,
          characters: proposal.characters,
          visual_style: proposal.visual_style,
          audio_notes: proposal.audio_notes,
        });
      }
      for (let i = accepted.length; i < proposal.scenes.length; i++) {
        const scene = proposal.scenes[i];
        const created = await videoApi.createScene(target.id, {
          title: scene.title || `${kk ? "Көрініс" : "Сцена"} ${i + 1}`,
          prompt: scene.prompt,
          original_prompt: scene.prompt,
          dialogue: "",
          settings: {
            ...defaults,
            aspect_ratio: target.aspect_ratio,
            duration: scene.duration ?? defaults.duration,
          },
        });
        accepted.push(created.id);
        setApplied([...accepted]);
      }
      onCreated(target.id, accepted[0]);
    } catch (err) {
      setError(videoError(err, kk));
    } finally {
      setBusy(false);
    }
  }

  function changeScene(
    index: number,
    patch: Partial<VideoPlan["scenes"][number]>,
  ) {
    setProposal((current) =>
      current
        ? {
            ...current,
            scenes: current.scenes.map((scene, i) =>
              i === index ? { ...scene, ...patch } : scene,
            ),
          }
        : current,
    );
  }

  return (
    <Modal
      wide
      title={
        proposal
          ? kk
            ? "Көріністерді тексеріңіз"
            : "Проверьте сцены"
          : kk
            ? "ЖИ көмегімен сценарий"
            : "Сценарий с ИИ"
      }
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      {!proposal ? (
        <div className="space-y-5">
          <p className="text-sm leading-6 text-slate-500">
            {kk
              ? "Идеяңызды немесе өз сценарийіңізді жазыңыз. ЖИ оны толықтырып, әр көрініске дайын промпт ұсынады. Кейіпкерлер мен оқиға сақталады."
              : "Напишите идею или вставьте свой сценарий. ИИ доработает его и подготовит промпт для каждой сцены, сохранив ваших персонажей и сюжет."}
          </p>
          <Field
            label={
              kk ? "Идея немесе өз сценарийіңіз" : "Ваша идея или сценарий"
            }
          >
            <textarea
              autoFocus
              rows={6}
              className={fieldClass}
              maxLength={20000}
              value={idea}
              disabled={busy}
              onChange={(e) => setIdea(e.target.value)}
              placeholder={
                kk
                  ? "Құлпынай мен банан көшеде жүріп, нан жеп келеді. Құлпынай салтанатты той туралы армандайды, ал банан оны қолдайды…"
                  : "Клубника и банан идут по улице, едят хлеб и обсуждают свадьбу. Клубника мечтает о роскошном празднике, а банан её поддерживает…"
              }
            />
          </Field>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label={kk ? "Видео тілі" : "Язык видео"}>
              <select
                className={fieldClass}
                value={speechLanguage}
                disabled={busy}
                onChange={(e) => setSpeechLanguage(e.target.value)}
              >
                <option value="">
                  {kk ? "Сипаттамаға сай" : "Как в описании"}
                </option>
                <option value="kk">Қазақша</option>
                <option value="ru">Русский</option>
                <option value="en">English</option>
                {speechLanguage &&
                  !["kk", "ru", "en"].includes(speechLanguage) && (
                    <option value={speechLanguage}>{speechLanguage}</option>
                  )}
              </select>
            </Field>
            <Field label={kk ? "Көрініс саны" : "Количество сцен"}>
              <input
                className={fieldClass}
                type="number"
                min="1"
                max={remainingScenes}
                value={count}
                disabled={busy}
                onChange={(e) => setCount(Number(e.target.value))}
              />
            </Field>
            <Field label={kk ? "Ролик ұзақтығы" : "Длительность ролика"}>
              <select
                className={fieldClass}
                value={duration}
                disabled={busy || !totalDurations.length}
                onChange={(e) => setRequestedDuration(Number(e.target.value))}
              >
                {totalDurations.map((value) => (
                  <option key={value} value={value}>
                    {value} {kk ? "сек" : "сек"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={kk ? "Модель" : "Модель"}>
              <select
                className={fieldClass}
                value={model}
                disabled={busy}
                onChange={(e) => setModel(e.target.value)}
              >
                {catalog.models.map((m) => (
                  <option key={m.id} value={m.id} disabled={!m.available}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
            {kk
              ? "Алдымен промпттарды қарап, өңдейсіз. Видео тек кейін «Видео жасау» түймесі арқылы жасалады."
              : "Сначала вы увидите и отредактируете промпты. Видео создаётся позже — по кнопке «Создать видео»."}
          </div>
          {remainingScenes <= 0 && (
            <p role="alert" className="text-sm text-amber-700">
              {kk
                ? "Бұл жобада көріністер шегіне жеттіңіз."
                : "В проекте уже достигнут лимит сцен."}
            </p>
          )}
          {remainingScenes > 0 &&
            (!totalDurations.length || count > remainingScenes) && (
              <p role="alert" className="text-sm text-amber-700">
                {kk
                  ? "Бұл жобаға көріністер саны немесе ұзақтығы аз сценарийді таңдаңыз."
                  : "Для этого проекта выберите меньше сцен или сократите длительность ролика."}
              </p>
            )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button disabled={busy} onClick={onClose}>
              {kk ? "Бас тарту" : "Отмена"}
            </Button>
            <Button
              variant="primary"
              disabled={busy || !canPlan}
              onClick={() => void plan()}
            >
              {busy ? <Spinner /> : <Icon name="sparkles" />}
              {kk ? "Сценарийді жақсарту" : "Доработать сценарий"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-sm leading-6 text-slate-500">
            {kk
              ? "Әр промптта кадрдағы кейіпкерлер, әрекет пен репликалар бірге берілген. Мәтінді өз қалауыңызша өзгертіңіз, содан кейін көріністерді қосыңыз."
              : "В каждом промпте вместе описаны персонажи в кадре, действие и реплики. Измените текст по своему вкусу, затем добавьте сцены в проект."}
          </p>
          {!project && (
            <Field label={kk ? "Видео атауы" : "Название видео"}>
              <input
                className={fieldClass}
                value={proposal.title}
                disabled={busy || applied.length > 0}
                onChange={(e) =>
                  setProposal({ ...proposal, title: e.target.value })
                }
                maxLength={240}
              />
            </Field>
          )}
          {proposal.scenes.map((scene, i) => (
            <section
              key={i}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <input
                  aria-label={`${kk ? "Көрініс атауы" : "Название сцены"} ${i + 1}`}
                  className={`${fieldClass} min-w-0 border-transparent bg-slate-50 font-semibold`}
                  value={scene.title}
                  maxLength={240}
                  disabled={busy || i < applied.length}
                  onChange={(e) => changeScene(i, { title: e.target.value })}
                />
                <select
                  aria-label={`${kk ? "Ұзақтығы, сек" : "Длительность, сек"} ${i + 1}`}
                  className={`${fieldClass} w-24 shrink-0`}
                  value={scene.duration ?? 5}
                  disabled={busy || i < applied.length}
                  onChange={(e) =>
                    changeScene(i, { duration: Number(e.target.value) })
                  }
                >
                  {shotDurations.map((value) => (
                    <option key={value} value={value}>
                      {value} сек
                    </option>
                  ))}
                </select>
              </div>
              <Field
                label={kk ? "Видеоға арналған промпт" : "Промпт для видео"}
              >
                <textarea
                  rows={5}
                  className={fieldClass}
                  value={scene.prompt}
                  maxLength={12000}
                  disabled={busy || i < applied.length}
                  onChange={(e) => changeScene(i, { prompt: e.target.value })}
                />
              </Field>
            </section>
          ))}
          <details className="rounded-xl border border-slate-200 p-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-600">
              {kk ? "ЖИ ұсынған толық сценарий" : "Полный сценарий от ИИ"}
            </summary>
            <textarea
              aria-label={kk ? "Толық сценарий" : "Полный сценарий"}
              rows={5}
              className={`${fieldClass} mt-3`}
              value={proposal.script}
              readOnly
            />
          </details>
          <div className="sticky bottom-0 space-y-3 border-t border-slate-100 bg-white py-3">
            <p className="text-xs text-slate-500">
              {kk
                ? "Көріністерді қосу видео генерациясын іске қоспайды."
                : "Добавление сцен не запускает генерацию видео."}
            </p>
            {!capacity.fits && (
              <p role="alert" className="text-sm text-amber-700">
                {kk
                  ? "Қалған көріністердің ұзақтығын азайтыңыз: жоба шегіне жеттіңіз."
                  : "Сократите длительность оставшихся сцен: они превышают лимит проекта."}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                disabled={busy || applied.length > 0}
                onClick={() => setProposal(null)}
              >
                {kk ? "Сценарийді өзгерту" : "Изменить сценарий"}
              </Button>
              <Button
                variant="primary"
                disabled={
                  busy ||
                  (!project && !proposal.title.trim()) ||
                  proposal.scenes.some(
                    (scene) =>
                      !scene.prompt.trim() ||
                      !shotDurations.includes(scene.duration ?? 5),
                  ) ||
                  !capacity.fits
                }
                onClick={() => void accept()}
              >
                {busy ? <Spinner /> : <Icon name="check" />}
                {applied.length
                  ? kk
                    ? "Қалған көріністерді қосу"
                    : "Продолжить добавление"
                  : kk
                    ? "Көріністерді қосу"
                    : "Добавить сцены в проект"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-rose-50 p-3 text-xs leading-5 text-rose-700"
        >
          {error}
          {applied.length > 0
            ? ` ${kk ? "Сақталған көріністер" : "Уже сохранено сцен"}: ${applied.length}. ${kk ? "Қайталау оларды қайта жасамайды." : "Повтор не создаст их заново."}`
            : ""}
        </p>
      )}
    </Modal>
  );
}
