"use client";

/**
 * Выбранный сегмент дашборда (мектеп / балабақша / кітапхана).
 *
 * Через `useSyncExternalStore`, а не через `useState` + `useEffect`: localStorage —
 * это внешнее хранилище, и React для такого случая даёт отдельный API. Побочный
 * бонус — сегмент синхронизируется между вкладками.
 */

import { useCallback, useSyncExternalStore } from "react";
import { SEGMENT_STORAGE_KEY, SegmentKey } from "../i18n/navigation";

const DEFAULT_SEGMENT: SegmentKey = "school";
const VALID: readonly SegmentKey[] = ["school", "kindergarten", "library"];

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot(): SegmentKey {
  const saved = window.localStorage.getItem(SEGMENT_STORAGE_KEY);
  return VALID.includes(saved as SegmentKey) ? (saved as SegmentKey) : DEFAULT_SEGMENT;
}

/** На сервере localStorage нет — отдаём дефолт, чтобы разметка совпала. */
function getServerSnapshot(): SegmentKey {
  return DEFAULT_SEGMENT;
}

export function useSegment(): [SegmentKey, (segment: SegmentKey) => void] {
  const segment = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setSegment = useCallback((next: SegmentKey) => {
    window.localStorage.setItem(SEGMENT_STORAGE_KEY, next);
    notify();
  }, []);

  return [segment, setSegment];
}
