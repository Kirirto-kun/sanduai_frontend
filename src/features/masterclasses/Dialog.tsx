"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./ui";
export default function Dialog({ title, onClose, locked = false, children }: { title: string; onClose: () => void; locked?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const controls = useRef({ onClose, locked });
  useEffect(() => { controls.current = { onClose, locked }; }, [onClose, locked]);
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow; document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("button")?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !controls.current.locked) { event.preventDefault(); controls.current.onClose(); }
      if (event.key !== "Tab") return;
      const elements = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex="0"]') ?? []);
      const current = elements.indexOf(document.activeElement as HTMLElement);
      if ((event.shiftKey && current <= 0) || (!event.shiftKey && current === elements.length - 1)) { event.preventDefault(); elements[event.shiftKey ? elements.length - 1 : 0]?.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("keydown", keydown); document.body.style.overflow = overflow; opener?.focus(); };
  }, []);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-3 backdrop-blur-sm" onClick={event => { if (event.target === event.currentTarget && !locked) onClose(); }}><div ref={ref} role="dialog" aria-modal="true" aria-label={title} className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-7"><div className="mb-6 flex items-center justify-between gap-4"><h2 className="text-lg font-semibold text-slate-800">{title}</h2><button type="button" aria-label="Закрыть / Жабу" className="rounded-lg p-2 text-slate-400 hover:bg-slate-50" disabled={locked} onClick={onClose}><Icon name="close" className="size-4" /></button></div>{children}</div></div>;
}
