"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { videoApi } from "./api";
import { DEFAULT_VIDEO_SETTINGS, videoError } from "./model";
import type { VideoCatalog, VideoProject, VideoVersion } from "./types";
import { ImageInput } from "./ImageInput";
import { Button, Field, Icon, Modal, Spinner, fieldClass } from "./ui";

export function DeleteVersionDialog({
  version,
  kk,
  onClose,
  onDeleted,
}: {
  version: VideoVersion;
  kk: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dependencies = useQuery({
    queryKey: ["video-version-dependencies", version.id],
    queryFn: () => videoApi.versionDependencies(version.id),
    retry: false,
  });
  const value = dependencies.data;
  const t = (ru: string, kz: string) => (kk ? kz : ru);
  return (
    <Modal
      title={t("Удалить эту версию?", "Осы нұсқаны жою керек пе?")}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <p className="text-xs leading-6 text-slate-600">
        {t(
          "Версия исчезнет из истории, прямой просмотр и скачивание будут закрыты. Удаление не возвращает токены. Если версия выбрана для сцены, выбор будет очищен.",
          "Нұсқа тарихтан жойылады, тікелей қарау және жүктеу жабылады. Жою токендерді қайтармайды. Нұсқа сахнаға таңдалған болса, таңдау тазартылады.",
        )}
      </p>
      {dependencies.isLoading ? (
        <div className="my-5">
          <Spinner />
        </div>
      ) : dependencies.error ? (
        <div className="my-4 space-y-3">
          <p role="alert" className="text-xs text-rose-600">
            {videoError(dependencies.error, kk)}
          </p>
          <Button onClick={() => void dependencies.refetch()}>
            {t("Повторить проверку связей", "Байланыстарды қайта тексеру")}
          </Button>
        </div>
      ) : (
        value && (
          <div className="my-4 space-y-3 rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-600">
            <p className="font-semibold text-slate-700">
              {t("Связанные материалы", "Байланысты материалдар")}
            </p>
            {value.selected_by_scenes.map((item) => (
              <p key={`selected-${item.id}`}>
                {t("Выбрана в сцене", "Сахнада таңдалған")}: {item.title}
              </p>
            ))}
            {value.continuations.map((item) => (
              <p key={`continue-${item.id}`}>
                {t("Источник продолжения", "Жалғастыру көзі")}: {item.title}
              </p>
            ))}
            {value.input_scenes?.map((item) => (
              <p key={`input-${item.id}`}>
                {t("Входное изображение сцены", "Сахнаның кіріс суреті")}:{" "}
                {item.title}
              </p>
            ))}
            {value.active_generations.map((item) => (
              <p key={`job-${item.id}`}>
                {t("Активная генерация", "Белсенді генерация")}:{" "}
                {item.id.slice(0, 12)} · {item.status}
              </p>
            ))}
            {value.exports.map((item) => (
              <p key={`export-${item.id}`}>
                {t("Сборка MP4", "MP4 жинағы")}: {item.id.slice(0, 12)} ·{" "}
                {item.status}
              </p>
            ))}
            {!value.selected_by_scenes.length &&
              !value.continuations.length &&
              !value.input_scenes?.length &&
              !value.active_generations.length &&
              !value.exports.length && (
                <p>{t("Связей нет.", "Байланыстар жоқ.")}</p>
              )}
            {value.retained_for_dependencies && (
              <p className="text-amber-800">
                {t(
                  "Внутренняя копия останется для уже существующих продолжений и сборок до освобождения связей или истечения 24 часов. Новые продолжения из удалённой версии недоступны.",
                  "Ішкі көшірме бұрыннан бар жалғастырулар мен жинақтар үшін байланыстар босатылғанша немесе 24 сағат аяқталғанша қалады. Жойылған нұсқадан жаңа жалғастыру жасалмайды.",
                )}
              </p>
            )}
          </div>
        )
      )}
      {error && (
        <p role="alert" className="my-4 text-xs text-rose-600">
          {error}
        </p>
      )}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button disabled={busy} onClick={onClose}>
          {t("Оставить версию", "Нұсқаны қалдыру")}
        </Button>
        <Button
          variant="danger"
          disabled={busy || !value || dependencies.isFetching}
          onClick={() => {
            setBusy(true);
            setError("");
            void videoApi
              .deleteVersion(version.id)
              .then(() => {
                onDeleted();
                onClose();
              })
              .catch((err) => setError(videoError(err, kk)))
              .finally(() => setBusy(false));
          }}
        >
          {busy ? <Spinner /> : <Icon name="trash" />}
          {t("Удалить версию", "Нұсқаны жою")}
        </Button>
      </div>
    </Modal>
  );
}

export function SimilarVersionDialog({
  version,
  project,
  catalog,
  title,
  kk,
  onClose,
  onCreated,
}: {
  version: VideoVersion;
  project: VideoProject;
  catalog: VideoCatalog;
  title: string;
  kk: boolean;
  onClose: () => void;
  onCreated: (sceneId: string) => void;
}) {
  const imageMode =
    version.input_mode === "image" || Boolean(version.input_asset_id);
  const [input, setInput] = useState<string | null>(
    !version.input_expired ? (version.input_asset_id ?? null) : null,
  );
  const [name, setName] = useState(
    `${title} · ${kk ? "ұқсас" : "похожее"}`.slice(0, 240),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const t = (ru: string, kz: string) => (kk ? kz : ru);
  const settings = {
    ...DEFAULT_VIDEO_SETTINGS,
    ...version.settings,
    aspect_ratio: project.aspect_ratio,
  };
  return (
    <Modal
      title={t("Создать похожее из этой версии", "Осы нұсқадан ұқсас жасау")}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <p className="mb-4 text-xs leading-6 text-slate-600">
        {t(
          "Будет создан новый редактируемый черновик из промпта и настроек выбранной версии. Текущие правки сцены не подменят этот снимок. Генерация не запускается, токены не списываются.",
          "Таңдалған нұсқа промпты мен баптауларынан жаңа өңделетін жоба сахнасы жасалады. Сахнаның қазіргі түзетулері бұл көшірмені өзгертпейді. Генерация іске қосылмайды, токен алынбайды.",
        )}
      </p>
      <div className="space-y-4">
        <Field label={t("Название новой сцены", "Жаңа сахна атауы")}>
          <input
            maxLength={240}
            className={fieldClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <p className="text-xs text-slate-500">
          {catalog.models.find((m) => m.id === settings.model_id)?.label ??
            settings.model_id}{" "}
          · {settings.resolution} · {settings.duration} {t("сек", "сек")}
        </p>
        {imageMode && (
          <div>
            <p className="mb-3 text-xs leading-6 text-slate-500">
              {version.input_expired
                ? t(
                    "Исходное изображение уже недоступно. Подготовьте новое изображение, чтобы сохранить режим I2V.",
                    "Бастапқы сурет енді қолжетімсіз. I2V режимін сақтау үшін жаңа сурет дайындаңыз.",
                  )
                : t(
                    "Будет использовано исходное изображение этой версии; при необходимости замените его.",
                    "Осы нұсқаның бастапқы суреті қолданылады; қажет болса ауыстырыңыз.",
                  )}
            </p>
            <ImageInput
              projectId={project.id}
              projectExpiresAt={project.expires_at}
              assetId={input}
              aspectRatio={settings.aspect_ratio}
              limitMb={catalog.max_image_mb}
              kk={kk}
              onChange={setInput}
            />
          </div>
        )}
        {error && (
          <p role="alert" className="text-xs text-rose-600">
            {error}
          </p>
        )}
        <Button
          variant="primary"
          className="w-full"
          disabled={busy || !name.trim() || (imageMode && !input)}
          onClick={() => {
            setBusy(true);
            setError("");
            void videoApi
              .createScene(project.id, {
                title: name.trim(),
                prompt: version.prompt ?? version.original_prompt ?? "",
                original_prompt:
                  version.original_prompt ?? version.prompt ?? "",
                enhanced_prompt: version.enhanced_prompt ?? undefined,
                dialogue:
                  version.dialogue ?? version.settings.speech_text ?? "",
                settings,
                ...(imageMode ? { input_asset_id: input } : {}),
              })
              .then((scene) => {
                onCreated(scene.id);
                onClose();
              })
              .catch((err) => setError(videoError(err, kk)))
              .finally(() => setBusy(false));
          }}
        >
          {busy ? <Spinner /> : <Icon name="copy" />}
          {t("Создать черновик бесплатно", "Жобалық сахнаны тегін жасау")}
        </Button>
      </div>
    </Modal>
  );
}
