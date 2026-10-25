"use client";

import { Fragment, useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { isActiveVideoJob, sceneDuration, selectedVersion } from "./model";
import { PrivateMedia } from "./PrivateMedia";
import {
  isValidSceneOrder,
  moveSceneToIndex,
  sameSceneOrder,
} from "./scene-timeline";
import type { VideoScene } from "./types";
import { Button, Icon, Modal, Spinner } from "./ui";

type SceneTimelineProps = {
  scenes: VideoScene[];
  selectedSceneId?: string;
  projectExpiresAt: string;
  kk: boolean;
  disabled?: boolean;
  onSelect: (id: string) => void;
  onAddAfter: (scene: VideoScene) => void;
  onReorder: (ids: string[]) => Promise<void>;
  onToggleIncluded: (scene: VideoScene) => void;
  onAddFirst?: () => void;
  onDelete?: (scene: VideoScene) => void;
};

type PointerDrag = {
  sceneId: string;
  pointerId: number;
  startX: number;
  startY: number;
  active: boolean;
  originalIds: string[];
  previewIds: string[];
};

function DragHandleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5"
    >
      {[5, 10, 15].map((y) => (
        <Fragment key={y}>
          <circle cx="7" cy={y} r="1.25" />
          <circle cx="13" cy={y} r="1.25" />
        </Fragment>
      ))}
    </svg>
  );
}

function sceneStatus(scene: VideoScene, kk: boolean) {
  const latest = scene.versions.reduce<VideoScene["versions"][number] | null>(
    (current, item) =>
      !current || item.created_at > current.created_at ? item : current,
    null,
  );
  if (
    scene.jobs?.some(isActiveVideoJob) ||
    (latest && isActiveVideoJob(latest))
  )
    return { label: kk ? "Жасалып жатыр" : "Создаётся", busy: true };
  const version = selectedVersion(scene);
  if (version?.asset_expired)
    return { label: kk ? "Мерзімі аяқталды" : "Срок истёк", busy: false };
  if (version?.asset_id || version?.asset?.id)
    return { label: kk ? "Дайын" : "Готово", busy: false };
  if (latest && ["failed", "error", "cancelled"].includes(latest.status))
    return { label: kk ? "Қайта көріңіз" : "Не получилось", busy: false };
  return { label: kk ? "Жоба нұсқасы" : "Черновик", busy: false };
}

/** The parent persists order. Only the pointer preview is local to the filmstrip. */
export function SceneTimeline({
  scenes,
  selectedSceneId,
  projectExpiresAt,
  kk,
  disabled = false,
  onSelect,
  onAddAfter,
  onReorder,
  onToggleIncluded,
  onAddFirst,
  onDelete,
}: SceneTimelineProps) {
  const helpId = useId();
  const track = useRef<HTMLOListElement>(null);
  const cards = useRef(new Map<string, HTMLLIElement>());
  const drag = useRef<PointerDrag | null>(null);
  const savingOrder = useRef(false);
  const [preview, setPreview] = useState<{
    sceneId: string;
    ids: string[];
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [actionSceneId, setActionSceneId] = useState<string | null>(null);
  const currentIds = scenes.map((scene) => scene.id);
  const orderKey = currentIds.join("|");
  const displayedIds =
    preview && isValidSceneOrder(currentIds, preview.ids)
      ? preview.ids
      : currentIds;
  const byId = new Map(scenes.map((scene) => [scene.id, scene]));
  const actionScene = actionSceneId ? byId.get(actionSceneId) : undefined;
  const locked = disabled || busy;

  useEffect(() => {
    const card = selectedSceneId && cards.current.get(selectedSceneId);
    const list = track.current;
    if (!card || !list) return;
    const cardBounds = card.getBoundingClientRect();
    const listBounds = list.getBoundingClientRect();
    // Only scroll this strip horizontally; selecting a scene must not move the page.
    if (cardBounds.left < listBounds.left)
      list.scrollLeft += cardBounds.left - listBounds.left - 8;
    else if (cardBounds.right > listBounds.right)
      list.scrollLeft += cardBounds.right - listBounds.right + 8;
  }, [selectedSceneId, orderKey]);

  async function commitOrder(ids: string[], sceneId: string) {
    if (
      disabled ||
      savingOrder.current ||
      !isValidSceneOrder(currentIds, ids) ||
      sameSceneOrder(currentIds, ids)
    )
      return;
    savingOrder.current = true;
    setBusy(true);
    setError("");
    try {
      await onReorder(ids);
      const title = byId.get(sceneId)?.title || (kk ? "Көрініс" : "Сцена");
      setAnnouncement(
        kk
          ? `${title}: ${ids.indexOf(sceneId) + 1}-орынға ауыстырылды`
          : `${title}: перемещена на место ${ids.indexOf(sceneId) + 1}`,
      );
    } catch {
      setError(
        kk
          ? "Ретін сақтау мүмкін болмады. Қайта көріңіз."
          : "Не удалось сохранить порядок. Попробуйте ещё раз.",
      );
    } finally {
      savingOrder.current = false;
      setBusy(false);
    }
  }

  function beginDrag(event: PointerEvent<HTMLButtonElement>, sceneId: string) {
    const list = track.current;
    if (
      !list ||
      drag.current ||
      locked ||
      scenes.length < 2 ||
      event.button !== 0 ||
      !event.isPrimary
    )
      return;
    event.stopPropagation();
    // Capture on the stable strip, not the handle React moves during the preview.
    list.setPointerCapture(event.pointerId);
    drag.current = {
      sceneId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
      originalIds: currentIds,
      previewIds: currentIds,
    };
    setError("");
  }

  function moveDrag(event: PointerEvent<HTMLOListElement>) {
    const active = drag.current;
    const list = track.current;
    if (!active || active.pointerId !== event.pointerId || !list || locked)
      return;
    event.stopPropagation();
    if (!active.active) {
      if (
        Math.hypot(
          event.clientX - active.startX,
          event.clientY - active.startY,
        ) < 7
      )
        return;
      active.active = true;
    }
    event.preventDefault();
    const bounds = list.getBoundingClientRect();
    if (event.clientX < bounds.left + 40) list.scrollLeft -= 20;
    else if (event.clientX > bounds.right - 40) list.scrollLeft += 20;
    const destination = active.originalIds
      .filter((id) => id !== active.sceneId)
      .filter((id) => {
        const rect = cards.current.get(id)?.getBoundingClientRect();
        return rect && event.clientX > rect.left + rect.width / 2;
      }).length;
    const ids = moveSceneToIndex(
      active.originalIds,
      active.sceneId,
      destination,
    );
    if (!sameSceneOrder(active.previewIds, ids) || !preview) {
      active.previewIds = ids;
      setPreview({ sceneId: active.sceneId, ids });
    }
  }

  function endDrag(event: PointerEvent<HTMLOListElement>, cancel = false) {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    // Clear first: releasing capture and the subsequent click cannot submit twice.
    drag.current = null;
    setPreview(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    event.stopPropagation();
    if (!cancel && active.active) {
      if (sameSceneOrder(currentIds, active.originalIds))
        void commitOrder(active.previewIds, active.sceneId);
      else
        setError(
          kk
            ? "Көріністердің реті өзгерді. Қайта сүйреңіз."
            : "Порядок сцен изменился. Перетащите сцену ещё раз.",
        );
    }
  }

  function moveWithKeyboard(
    event: KeyboardEvent<HTMLButtonElement>,
    sceneId: string,
  ) {
    if (event.key === "Escape") {
      const active = drag.current;
      drag.current = null;
      setPreview(null);
      if (active && track.current?.hasPointerCapture(active.pointerId))
        track.current.releasePointerCapture(active.pointerId);
      return;
    }
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    event.stopPropagation();
    const index = currentIds.indexOf(sceneId);
    void commitOrder(
      moveSceneToIndex(
        currentIds,
        sceneId,
        index + (event.key === "ArrowLeft" ? -1 : 1),
      ),
      sceneId,
    );
  }

  return (
    <section aria-label={kk ? "Видео көріністері" : "Сцены видео"}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 className="text-sm font-semibold text-slate-800">
          {kk ? "Көріністер" : "Сцены"}
          <span className="ml-2 font-normal text-slate-400">
            {scenes.length}
          </span>
        </h2>
        <p id={helpId} className="text-xs leading-5 text-slate-500">
          {kk
            ? "Ретін өзгерту үшін ⋮⋮ тұтқасынан сүйреңіз"
            : "Потяните за ⋮⋮, чтобы поменять порядок"}
        </p>
      </div>
      {scenes.length === 0 ? (
        <Button
          className="min-h-24 w-full border-dashed"
          disabled={locked || !onAddFirst}
          onClick={onAddFirst}
        >
          <Icon name="plus" />
          {kk ? "Алғашқы көріністі қосу" : "Добавить первую сцену"}
        </Button>
      ) : (
        <ol
          ref={track}
          className="flex min-w-0 items-center overflow-x-auto overscroll-x-contain py-2 pr-1"
          aria-describedby={helpId}
          data-scene-timeline="true"
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={(event) => endDrag(event, true)}
          onLostPointerCapture={(event) => {
            // Touch's implicit capture may transfer from a child handle to this
            // strip. That child's bubbling lost-capture event is not a cancel.
            if (event.target === event.currentTarget) endDrag(event, true);
          }}
        >
          {displayedIds.map((id, index) => {
            const scene = byId.get(id)!;
            const version = selectedVersion(scene);
            const thumbnailId = version?.frame_asset_id || scene.input_asset_id;
            const status = sceneStatus(scene, kk);
            const selected = scene.id === selectedSceneId;
            const dragging = preview?.sceneId === id;
            const title =
              scene.title || `${kk ? "Көрініс" : "Сцена"} ${index + 1}`;
            const duration = sceneDuration(scene);
            return (
              <Fragment key={scene.id}>
                <li
                  ref={(element) => {
                    if (element) cards.current.set(scene.id, element);
                    else cards.current.delete(scene.id);
                  }}
                  className={`w-40 shrink-0 overflow-hidden rounded-2xl border-2 bg-white motion-reduce:transition-none sm:w-44 ${selected ? "border-indigo-500 ring-2 ring-indigo-100" : "border-slate-200"} ${dragging ? "opacity-65 shadow-lg" : ""}`}
                >
                  <div className="relative">
                    <div
                      aria-hidden="true"
                      inert
                      className={`pointer-events-none relative flex aspect-video items-center justify-center overflow-hidden bg-slate-100 text-slate-400 [&_img]:h-full [&_img]:max-h-none [&_img]:rounded-none [&_img]:object-cover [&>div]:h-full [&>div]:min-h-0 [&>div]:w-full ${!scene.included ? "opacity-60" : ""}`}
                    >
                      {thumbnailId ? (
                        <PrivateMedia
                          key={thumbnailId}
                          assetId={thumbnailId}
                          expiresAt={
                            version?.frame_asset_id
                              ? version.expires_at || version.asset?.expires_at
                              : scene.input_asset?.expires_at
                          }
                          projectExpiresAt={projectExpiresAt}
                          image
                          compact
                          kk={kk}
                        />
                      ) : (
                        <Icon name="film" className="h-7 w-7" />
                      )}
                      <span className="absolute left-2 top-2 rounded-md bg-slate-950/65 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {index + 1}
                      </span>
                      {Number.isFinite(duration) && duration > 0 && (
                        <span className="absolute bottom-2 right-2 rounded-md bg-slate-950/65 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          {Number(duration.toFixed(1))} {kk ? "сек" : "с"}
                        </span>
                      )}
                    </div>
                    <div className="px-3 pb-1 pt-2">
                      <p
                        className="truncate text-xs font-semibold text-slate-800"
                        title={title}
                      >
                        {title}
                      </p>
                      <p
                        className={`mt-1 flex min-h-4 items-center gap-1.5 text-[11px] ${!scene.included ? "text-amber-700" : "text-slate-500"}`}
                      >
                        {status.busy && <Spinner className="h-3 w-3" />}
                        {!scene.included
                          ? kk
                            ? "Видеоға кірмейді"
                            : "Не в ролике"
                          : status.label}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-pressed={selected}
                      aria-label={`${index + 1}. ${title}. ${status.label}${!scene.included ? (kk ? ". Видеоға кірмейді" : ". Не в ролике") : ""}`}
                      onClick={() => onSelect(scene.id)}
                      className="absolute inset-0 block w-full rounded-t-xl outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-indigo-500"
                    />
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <button
                      type="button"
                      disabled={locked || scenes.length < 2}
                      aria-label={`${kk ? "Көріністі сүйреу" : "Перетащить сцену"}: ${title}`}
                      aria-describedby={helpId}
                      aria-keyshortcuts="ArrowLeft ArrowRight"
                      title={
                        kk
                          ? "Сүйреңіз немесе ← → пернелерін басыңыз"
                          : "Перетащите или используйте клавиши ← →"
                      }
                      onPointerDown={(event) => beginDrag(event, scene.id)}
                      onKeyDown={(event) => moveWithKeyboard(event, scene.id)}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      className="flex min-h-11 min-w-11 touch-none select-none items-center justify-center rounded-lg text-slate-400 outline-none hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-default disabled:opacity-35 enabled:cursor-grab enabled:active:cursor-grabbing"
                    >
                      <DragHandleIcon />
                    </button>
                    <button
                      type="button"
                      disabled={locked}
                      aria-label={`${kk ? "Көрініс әрекеттері" : "Действия со сценой"}: ${title}`}
                      onClick={() => setActionSceneId(scene.id)}
                      className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-lg font-semibold text-slate-400 outline-none hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-35"
                    >
                      <span aria-hidden="true">···</span>
                    </button>
                  </div>
                </li>
                <li
                  className="flex shrink-0 items-center justify-center px-1.5"
                  role="presentation"
                >
                  <button
                    type="button"
                    disabled={locked}
                    aria-label={`${kk ? "Осыдан кейін көрініс қосу" : "Добавить сцену после"}: ${title}`}
                    title={kk ? "Көрініс қосу" : "Добавить сцену"}
                    onClick={() => onAddAfter(scene)}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 outline-none transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:ring-3 focus-visible:ring-indigo-200 disabled:opacity-40 motion-reduce:transition-none"
                  >
                    <Icon name="plus" className="h-5 w-5" />
                  </button>
                </li>
              </Fragment>
            );
          })}
        </ol>
      )}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      {error && (
        <p role="alert" className="mt-2 text-xs text-rose-600">
          {error}
        </p>
      )}
      {actionScene && (
        <Modal
          title={actionScene.title || (kk ? "Көрініс" : "Сцена")}
          onClose={() => setActionSceneId(null)}
        >
          <div className="space-y-2">
            <Button
              className="min-h-11 w-full justify-start"
              disabled={locked}
              onClick={() => {
                setActionSceneId(null);
                onToggleIncluded(actionScene);
              }}
            >
              <Icon name={actionScene.included ? "close" : "check"} />
              {actionScene.included
                ? kk
                  ? "Видеодан алып тастау"
                  : "Убрать из ролика"
                : kk
                  ? "Видеоға қайтару"
                  : "Вернуть в ролик"}
            </Button>
            {([-1, 1] as const).map((direction) => {
              const index = currentIds.indexOf(actionScene.id);
              return (
                <Button
                  key={direction}
                  className="min-h-11 w-full justify-start"
                  disabled={
                    locked ||
                    index + direction < 0 ||
                    index + direction >= scenes.length
                  }
                  onClick={() => {
                    setActionSceneId(null);
                    void commitOrder(
                      moveSceneToIndex(
                        currentIds,
                        actionScene.id,
                        index + direction,
                      ),
                      actionScene.id,
                    );
                  }}
                >
                  <span aria-hidden="true">{direction < 0 ? "←" : "→"}</span>
                  {direction < 0
                    ? kk
                      ? "Солға жылжыту"
                      : "Переместить левее"
                    : kk
                      ? "Оңға жылжыту"
                      : "Переместить правее"}
                </Button>
              );
            })}
            {onDelete && (
              <Button
                variant="danger"
                className="min-h-11 w-full justify-start"
                disabled={locked}
                onClick={() => {
                  setActionSceneId(null);
                  onDelete(actionScene);
                }}
              >
                <Icon name="trash" />
                {kk ? "Көріністі жою" : "Удалить сцену"}
              </Button>
            )}
          </div>
        </Modal>
      )}
    </section>
  );
}
