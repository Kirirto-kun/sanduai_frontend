"use client";

import { useEditor } from "@/contexts/PresentationEditorContext";
import SlideContentRenderer from "./SlideContentRenderer";

interface Props {
  t: Record<string, string>;
}

export default function SlideCanvas({ t }: Props) {
  const { selectedSlide } = useEditor();

  if (!selectedSlide) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
        {t.loading}
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-100/50 p-8">
      <div className="aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
        <SlideContentRenderer slide={selectedSlide} />
      </div>
    </div>
  );
}
