"use client";

import { useEffect, useRef } from "react";
import { focusTrapTargetIndex } from "@/lib/dialog-focus";

export function useDialog(open: boolean, close: () => void, locked: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const controls = useRef({ close, locked });
  useEffect(() => { controls.current = { close, locked }; }, [close, locked]);
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>("button")?.focus());
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !controls.current.locked) { event.preventDefault(); controls.current.close(); }
      if (event.key !== "Tab" || !ref.current) return;
      const elements = Array.from(ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), [tabindex="0"]'));
      const target = focusTrapTargetIndex(elements.indexOf(document.activeElement as HTMLElement), elements.length, event.shiftKey);
      if (target !== null) { event.preventDefault(); elements[target]?.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("keydown", keydown); document.body.style.overflow = previousOverflow; opener?.focus(); };
  }, [open]);
  return ref;
}
