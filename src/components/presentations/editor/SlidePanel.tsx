"use client";

import { useEditor } from "@/contexts/PresentationEditorContext";

interface Props {
  t: Record<string, string>;
}

export default function SlidePanel({ t }: Props) {
  const { state, dispatch } = useEditor();

  return (
    <div className="flex h-full w-56 flex-col border-r border-slate-200 bg-white/40">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <span className="text-xs font-semibold text-slate-600">{t.slides}</span>
        <span className="text-xs text-slate-400">{state.slides.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          {state.slides.map((slide, idx) => (
            <button
              key={slide.id || idx}
              onClick={() => dispatch({ type: "SELECT", index: idx })}
              className={`group relative w-full rounded-lg border-2 p-2 text-left transition ${
                idx === state.selectedIndex
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-slate-100 text-[10px] font-semibold text-slate-600">
                  {idx + 1}
                </span>
                <span className="truncate text-xs text-slate-700">
                  {slide.content?.title || `Slide ${idx + 1}`}
                </span>
              </div>

              {/* Delete button on hover */}
              {state.slides.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: "DELETE_SLIDE", index: idx });
                  }}
                  className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white group-hover:flex"
                >
                  x
                </button>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
