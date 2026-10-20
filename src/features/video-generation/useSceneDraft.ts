"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiRequestError } from "@/lib/http-client";
import { videoApi } from "./api";
import { mergeVideoDraft } from "./draft-merge";
import { isVideoExpired, promptVideoSettings, utcTimestamp } from "./model";
import type { ScenePatch, VideoScene } from "./types";

type Draft = {
  title: string;
  prompt: string;
  dialogue: string;
  original_prompt: string;
  enhanced_prompt?: string;
  settings: VideoScene["settings"];
  input_asset_id?: string | null;
};
function storedScene(scene: VideoScene): Draft {
  return {
    title: scene.title,
    prompt: scene.prompt,
    dialogue: scene.dialogue ?? "",
    original_prompt: scene.original_prompt ?? scene.prompt,
    enhanced_prompt: scene.enhanced_prompt,
    settings: scene.settings,
    input_asset_id: scene.input_asset_id,
  };
}
function normalizedDraft(draft: Draft): Draft {
  return { ...draft, settings: promptVideoSettings(draft.settings) };
}
function fromScene(scene: VideoScene): Draft {
  return normalizedDraft(storedScene(scene));
}

/** One ordered stream of saves per editor; polling never replaces unsaved work. */
export function useSceneDraft(
  scene: VideoScene,
  ownerId: string,
  expiresAt: string,
  onSaved: () => void,
) {
  const storageKey = `sanduai:video:draft:v1:${ownerId}:${scene.id}`;
  const [draft, setDraft] = useState<Draft>(() => {
    try {
      const saved = JSON.parse(
        window.localStorage.getItem(storageKey) ?? "null",
      );
      if (
        saved?.schema === 1 &&
        !isVideoExpired(saved.expires_at) &&
        saved.scene_id === scene.id
      )
        return {
          ...fromScene(scene),
          ...saved.draft,
          settings: promptVideoSettings(saved.draft.settings ?? scene.settings),
        } as Draft;
      if (saved) window.localStorage.removeItem(storageKey);
    } catch {
      /* Optional cache. */
    }
    return fromScene(scene);
  });
  const current = useRef(draft);
  const persisted = useRef(JSON.stringify(storedScene(scene)));
  const revision = useRef(scene.revision);
  const running = useRef<Promise<void> | null>(null);
  const alive = useRef(true);
  const [state, setState] = useState<"saved" | "dirty" | "saving" | "error">(
    () =>
      JSON.stringify(draft) === JSON.stringify(storedScene(scene))
        ? "saved"
        : "dirty",
  );
  const [saveError, setSaveError] = useState<unknown>(null);
  const callback = useRef(onSaved);
  useEffect(() => {
    callback.current = onSaved;
  }, [onSaved]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (running.current || (scene.revision ?? 0) <= (revision.current ?? 0))
      return;
    const remote = storedScene(scene);
    const next = normalizedDraft(remote);
    const merged = mergeVideoDraft(
      normalizedDraft(JSON.parse(persisted.current) as Draft),
      current.current,
      next,
    );
    if (merged.conflicts.length) return;
    revision.current = scene.revision;
    persisted.current = JSON.stringify(remote);
    current.current = merged.draft;
    queueMicrotask(() => {
      if (alive.current) {
        setDraft(merged.draft);
        setState(
          JSON.stringify(merged.draft) === persisted.current
            ? "saved"
            : "dirty",
        );
      }
    });
  }, [scene]);
  const save = useCallback(async () => {
    if (running.current) return running.current;
    const work = async () => {
      let revisionRetries = 0;
      while (persisted.current !== JSON.stringify(current.current)) {
        if (alive.current) {
          setState("saving");
          setSaveError(null);
        }
        const snapshot = current.current;
        const fingerprint = JSON.stringify(snapshot);
        try {
          const saved = await videoApi.updateScene(scene.id, {
            ...snapshot,
            ...(revision.current
              ? { expected_revision: revision.current }
              : {}),
          } as ScenePatch);
          revision.current = saved.revision;
          persisted.current = fingerprint;
          if (persisted.current === JSON.stringify(current.current)) {
            try {
              window.localStorage.removeItem(storageKey);
            } catch {
              /* Optional cache. */
            }
          }
          callback.current();
        } catch (error) {
          if (
            error instanceof ApiRequestError &&
            error.status === 409 &&
            revisionRetries++ < 2
          ) {
            const project = await videoApi
              .project(scene.project_id)
              .catch(() => null);
            const latest = project?.scenes.find((s) => s.id === scene.id);
            if (latest) {
              const remote = storedScene(latest);
              const merged = mergeVideoDraft(
                normalizedDraft(JSON.parse(persisted.current) as Draft),
                current.current,
                normalizedDraft(remote),
              );
              if (!merged.conflicts.length) {
                revision.current = latest.revision;
                persisted.current = JSON.stringify(remote);
                current.current = merged.draft;
                if (alive.current) setDraft(merged.draft);
                continue;
              }
            }
          }
          if (alive.current) {
            setState("error");
            setSaveError(error);
          }
          throw error;
        }
      }
      if (alive.current) setState("saved");
    };
    const promise = work().finally(() => {
      if (running.current === promise) running.current = null;
    });
    running.current = promise;
    return promise;
  }, [scene.id, scene.project_id, storageKey]);
  useEffect(
    () => () => {
      void save().catch(() => undefined);
    },
    [save],
  );
  const update = useCallback(
    (patch: Partial<Draft>) => {
      const next = {
        ...current.current,
        ...patch,
        ...(patch.settings
          ? { settings: promptVideoSettings(patch.settings) }
          : {}),
      };
      current.current = next;
      setDraft(next);
      setState("dirty");
      setSaveError(null);
      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({
            schema: 1,
            scene_id: scene.id,
            expires_at: expiresAt,
            draft: next,
          }),
        );
      } catch {
        /* The live draft remains available when browser storage is full. */
      }
    },
    [scene.id, storageKey, expiresAt],
  );
  const adopt = useCallback((saved: VideoScene) => {
    const next = fromScene(saved);
    current.current = next;
    persisted.current = JSON.stringify(storedScene(saved));
    revision.current = saved.revision;
    setDraft(next);
    setState(JSON.stringify(next) === persisted.current ? "saved" : "dirty");
    setSaveError(null);
  }, []);
  const saveMyDraft = useCallback(async () => {
    if (running.current) await running.current.catch(() => undefined);
    const fresh = await videoApi.project(scene.project_id);
    const latest = fresh.scenes.find((s) => s.id === scene.id);
    if (!latest) throw new Error("Scene no longer exists");
    revision.current = latest.revision;
    await save();
  }, [scene.id, scene.project_id, save]);
  useEffect(() => {
    if (state !== "dirty") return;
    const timer = window.setTimeout(() => {
      void save().catch(() => undefined);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [draft, save, state]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (persisted.current !== JSON.stringify(current.current)) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        try {
          window.localStorage.removeItem(storageKey);
        } catch {
          /* Optional cache. */
        }
      },
      Math.max(0, utcTimestamp(expiresAt) - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [expiresAt, storageKey]);
  return { draft, update, save, saveMyDraft, adopt, state, saveError };
}
