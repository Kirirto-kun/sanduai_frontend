"use client";
import { useState } from "react";
import { videoApi } from "./api";
import { catalogDefaultSettings, settingsForModel, videoError } from "./model";
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
  const [idea, setIdea] = useState(initialIdea);
  const [count, setCount] = useState(3);
  const [duration, setDuration] = useState(15);
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
  const [manual, setManual] = useState(false);
  const [applied, setApplied] = useState<string[]>([]);
  const [createdProject, setCreatedProject] = useState<VideoProject | null>(
    project ?? null,
  );
  async function plan() {
    setBusy(true);
    setError("");
    try {
      setProposal(
        await videoApi.plan({
          idea,
          language: kk ? "kk" : "ru",
          scene_count: count,
          total_duration: duration,
          model_id: model,
        }),
      );
    } catch (err) {
      setError(videoError(err, kk));
    } finally {
      setBusy(false);
    }
  }
  async function accept() {
    if (!proposal) return;
    setBusy(true);
    setError("");
    let target = createdProject;
    const accepted = [...applied];
    try {
      const capability = catalog.models.find((m) => m.id === model);
      const defaults = capability
        ? settingsForModel(
            catalogDefaultSettings(catalog, kk ? "kk" : "ru"),
            capability,
          )
        : catalogDefaultSettings(catalog, kk ? "kk" : "ru");
      if (!target) {
        target = await videoApi.createProject({
          title: proposal.title || (kk ? "Жаңа видео" : "Новое видео"),
          idea,
          script: proposal.script,
          language: kk ? "kk" : "ru",
          defaults,
          characters: proposal.characters,
          visual_style: proposal.visual_style,
          audio_notes: proposal.audio_notes,
        });
        setCreatedProject(target);
      } else if (!accepted.length)
        await videoApi.updateProject(target.id, {
          script: proposal.script,
          characters: proposal.characters,
          visual_style: proposal.visual_style,
          audio_notes: proposal.audio_notes,
        });
      for (let i = accepted.length; i < proposal.scenes.length; i++) {
        const scene = proposal.scenes[i];
        const created = await videoApi.createScene(target.id, {
          title: scene.title || `${kk ? "Сахна" : "Сцена"} ${i + 1}`,
          prompt: scene.prompt,
          original_prompt: scene.prompt,
          settings: {
            ...defaults,
            ...scene.settings,
            aspect_ratio: target.aspect_ratio,
            duration: scene.duration ?? defaults.duration,
            speech_text: scene.dialogue ?? "",
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
  return (
    <Modal
      wide
      title={
        proposal
          ? kk
            ? "Сценарийді тексеріңіз"
            : "Проверьте сценарий"
          : kk
            ? "Идеядан — сахналарға"
            : "От идеи — к сценам"
      }
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      {!proposal ? (
        <div className="space-y-5">
          <p className="text-sm leading-6 text-slate-500">
            {kk
              ? "Идеяны сипаттаңыз немесе дайын сценарийді қойыңыз. Алдымен өңдеуге болатын жоспар жасалады — видео генерациясы басталмайды."
              : "Опишите идею или вставьте готовый сценарий. Сначала появится редактируемый план — генерация видео не начнётся."}
          </p>
          <Field
            label={kk ? "Идея немесе сценарий" : "Идея или готовый сценарий"}
          >
            <textarea
              autoFocus
              rows={5}
              className={fieldClass}
              maxLength={20000}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder={
                kk
                  ? "Мысалы: қазақ даласы туралы қысқа фильм, 3 сахна…"
                  : "Например: короткий фильм о казахской степи. Рассвет, девушка на лошади, закат у юрты…"
              }
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={kk ? "Сахна саны" : "Количество сцен"}>
              <input
                className={fieldClass}
                type="number"
                min="1"
                max={Math.min(
                  catalog.max_scenes - (project?.scenes.length ?? 0),
                  20,
                )}
                value={count}
                onChange={(e) => {
                  setCount(Number(e.target.value));
                  setDuration(Number(e.target.value) * 5);
                }}
              />
            </Field>
            <Field label={kk ? "Жалпы ұзақтығы, сек" : "Общая длина, сек"}>
              <input
                className={fieldClass}
                type="number"
                min="5"
                max="300"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </Field>
            <Field label={kk ? "Әдепкі модель" : "Модель по умолчанию"}>
              <select
                className={fieldClass}
                value={model}
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
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              disabled={
                busy ||
                !idea.trim() ||
                count < 1 ||
                count > 20 ||
                duration < 5 ||
                duration > 300
              }
              onClick={() => void plan()}
            >
              {busy ? <Spinner /> : <Icon name="sparkles" />}
              {kk ? "Жоспар ұсыну" : "Предложить сценарий"}
            </Button>
            <Button
              disabled={busy}
              onClick={() => {
                setManual(true);
                setProposal({
                  title: kk ? "Жаңа видео" : "Новое видео",
                  script: idea,
                  characters: "",
                  visual_style: "",
                  audio_notes: "",
                  scenes: Array.from(
                    { length: Math.max(1, Math.min(count, 20)) },
                    (_, i) => ({
                      title: `${kk ? "Сахна" : "Сцена"} ${i + 1}`,
                      prompt: i === 0 ? idea : "",
                      duration: 5,
                      dialogue: "",
                    }),
                  ),
                });
              }}
            >
              {kk ? "Өзім құрастырамын" : "Создам вручную"}
            </Button>
          </div>
          <p className="text-[11px] text-slate-400">
            {kk
              ? "Жоспарлау тегін. Әр сахна кейін өз бағасымен жеке жасалады."
              : "Подготовка сценария бесплатна. Каждая сцена создаётся позже, отдельно, с собственной ценой."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-xs leading-6 text-indigo-700">
            {proposal.scenes.length} {kk ? "сахна" : "сцены"} ·{" "}
            {proposal.scenes.reduce((n, s) => n + (s.duration ?? 5), 0)}{" "}
            {kk ? "сек жоспарланды" : "сек запланировано"} ·{" "}
            {kk ? "Генерация әлі басталмаған" : "Генерации ещё не запущены"}
          </div>
          <Field label={kk ? "Видео атауы" : "Название видео"}>
            <input
              className={fieldClass}
              value={proposal.title}
              onChange={(e) =>
                setProposal({ ...proposal, title: e.target.value })
              }
              maxLength={240}
            />
          </Field>
          <Field
            label={
              kk
                ? "Тұрақты кейіпкерлер және орта"
                : "Постоянные персонажи и окружение"
            }
          >
            <textarea
              rows={2}
              className={fieldClass}
              value={proposal.characters}
              onChange={(e) =>
                setProposal({ ...proposal, characters: e.target.value })
              }
              maxLength={10000}
            />
          </Field>
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
                  aria-label={`${kk ? "Сахна атауы" : "Название сцены"} ${i + 1}`}
                  className={`${fieldClass} border-transparent bg-slate-50 font-semibold`}
                  value={scene.title}
                  maxLength={240}
                  disabled={i < applied.length}
                  onChange={(e) =>
                    setProposal({
                      ...proposal,
                      scenes: proposal.scenes.map((s, j) =>
                        i === j ? { ...s, title: e.target.value } : s,
                      ),
                    })
                  }
                />
                <input
                  aria-label={kk ? "Ұзақтығы, сек" : "Длительность, сек"}
                  type="number"
                  className={`${fieldClass} w-20`}
                  min={
                    catalog.models.find((m) => m.id === model)?.min_duration ??
                    1
                  }
                  max="15"
                  value={scene.duration ?? 5}
                  onChange={(e) =>
                    setProposal({
                      ...proposal,
                      scenes: proposal.scenes.map((s, j) =>
                        i === j
                          ? { ...s, duration: Number(e.target.value) }
                          : s,
                      ),
                    })
                  }
                />
              </div>
              <Field
                label={
                  kk ? "Әрекет және бейне" : "Действие и визуальное описание"
                }
              >
                <textarea
                  rows={3}
                  className={fieldClass}
                  value={scene.prompt}
                  maxLength={12000}
                  onChange={(e) =>
                    setProposal({
                      ...proposal,
                      scenes: proposal.scenes.map((s, j) =>
                        i === j ? { ...s, prompt: e.target.value } : s,
                      ),
                    })
                  }
                />
              </Field>
              <div className="mt-3">
                <Field label={kk ? "Репликалар" : "Реплики"}>
                  <textarea
                    rows={2}
                    className={fieldClass}
                    value={scene.dialogue ?? ""}
                    maxLength={4000}
                    onChange={(e) =>
                      setProposal({
                        ...proposal,
                        scenes: proposal.scenes.map((s, j) =>
                          i === j ? { ...s, dialogue: e.target.value } : s,
                        ),
                      })
                    }
                  />
                </Field>
              </div>
            </section>
          ))}
          <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-white py-3">
            <Button
              disabled={busy || applied.length > 0}
              onClick={() => setProposal(null)}
            >
              {manual
                ? kk
                  ? "Артқа"
                  : "Назад"
                : kk
                  ? "Идеяны өзгерту"
                  : "Изменить идею"}
            </Button>
            <Button
              variant="primary"
              disabled={
                busy ||
                !proposal.title.trim() ||
                proposal.scenes.length + (project?.scenes.length ?? 0) >
                  catalog.max_scenes
              }
              onClick={() => void accept()}
            >
              {busy ? <Spinner /> : <Icon name="check" />}
              {applied.length
                ? kk
                  ? "Қалған сахналарды қосу"
                  : "Продолжить добавление"
                : kk
                  ? "Сценарийді қабылдау"
                  : "Принять сценарий"}
            </Button>
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
            ? ` ${applied.length} ${kk ? "сахна сақталды. Қайталау оларды қайта жасамайды." : "сцены уже сохранены. Повтор не создаст их заново."}`
            : ""}
        </p>
      )}
    </Modal>
  );
}
