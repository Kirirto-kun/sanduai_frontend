"use client";
import { useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { createIdempotencyKey } from "@/lib/idempotency";
import { videoApi } from "./api";
import { videoError } from "./model";
import type { VideoProject, VideoScene } from "./types";
import { Button, Field, Icon, Modal, Spinner, fieldClass } from "./ui";

export function ImportSceneDialog({
  project,
  scene,
  kk,
  onClose,
}: {
  project: VideoProject;
  scene: VideoScene;
  kk: boolean;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const library = useInfiniteQuery({
    queryKey: ["video-import-targets", project.id],
    queryFn: ({ pageParam }) => videoApi.projectPage(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const count = pages.reduce((n, page) => n + page.items.length, 0);
      return count < last.total && last.items.length > 0 ? count : undefined;
    },
  });
  const projects = library.data?.pages.flatMap((page) => page.items) ?? [];
  const [target, setTarget] = useState("new");
  const [title, setTitle] = useState(
    `${project.title} · ${kk ? "көшірме" : "копия"}`,
  );
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [key] = useState(createIdempotencyKey);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  async function copy() {
    if (!scene.selected_version_id) return;
    setBusy(true);
    setError("");
    try {
      let id = target;
      if (target === "new") {
        if (createdId) id = createdId;
        else {
          const created = await videoApi.createProject({
            title: title.trim(),
            language: project.language,
            aspect_ratio: project.aspect_ratio,
            defaults: project.defaults,
            characters: project.characters,
            visual_style: project.visual_style,
            audio_notes: project.audio_notes,
          });
          id = created.id;
          setCreatedId(id);
        }
      }
      await videoApi.importVersion(id, scene.selected_version_id, key);
      setSuccess(id);
      void client.invalidateQueries({ queryKey: ["video-projects"] });
      void client.invalidateQueries({ queryKey: ["video-project"] });
    } catch (err) {
      setError(videoError(err, kk));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={kk ? "Дайын клипті жобаға қосу" : "Добавить готовый клип в проект"}
      onClose={onClose}
    >
      {success ? (
        <div className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-teal-50 text-teal-600">
            <Icon name="check" className="h-6 w-6" />
          </span>
          <p className="my-4 text-sm text-slate-700">
            {kk ? "Клип жобаға қосылды" : "Клип добавлен в проект"}
          </p>
          <a
            href={`/dashboard/media/video?project=${encodeURIComponent(success)}`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-xs font-semibold text-white"
          >
            {kk ? "Жобаны ашу" : "Открыть проект"}
          </a>
        </div>
      ) : (
        <>
          <p className="mb-5 text-xs leading-6 text-slate-500">
            {kk
              ? "Дайын нұсқа көшіріледі. Генерация мен токен шығыны болмайды. Файлдың бастапқы 24 сағат сақтау мерзімі өзгермейді."
              : "Готовая версия будет скопирована. Без генерации и списания токенов. Исходный срок хранения файла 24 часа сохраняется."}
          </p>
          <Field label={kk ? "Жоба" : "Проект"}>
            <select
              className={fieldClass}
              value={target}
              disabled={busy || Boolean(createdId)}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="new">
                {kk ? "Жаңа жоба жасау" : "Создать новый проект"}
              </option>
              {projects
                .filter((p) => p.id !== project.id)
                .map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                    disabled={p.aspect_ratio !== project.aspect_ratio}
                  >
                    {p.title}
                    {p.aspect_ratio !== project.aspect_ratio
                      ? ` · ${p.aspect_ratio}`
                      : ""}
                  </option>
                ))}
            </select>
          </Field>
          {library.hasNextPage && (
            <Button
              variant="ghost"
              disabled={library.isFetchingNextPage}
              onClick={() => void library.fetchNextPage()}
            >
              {library.isFetchingNextPage ? <Spinner /> : <Icon name="plus" />}
              {kk ? "Тағы жобалар" : "Загрузить ещё проекты"}
            </Button>
          )}
          {target === "new" && (
            <div className="mt-4">
              <Field label={kk ? "Жаңа жоба атауы" : "Название нового проекта"}>
                <input
                  className={fieldClass}
                  value={title}
                  maxLength={240}
                  disabled={Boolean(createdId)}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Field>
            </div>
          )}
          <Button
            variant="primary"
            className="mt-5 w-full"
            disabled={busy || (target === "new" && !title.trim())}
            onClick={() => void copy()}
          >
            {busy ? <Spinner /> : <Icon name="copy" />}
            {kk ? "Клипті тегін қосу" : "Добавить клип бесплатно"}
          </Button>
          {error && (
            <p role="alert" className="mt-3 text-xs leading-5 text-rose-600">
              {error}
            </p>
          )}
        </>
      )}
    </Modal>
  );
}
