"use client";

import { useEditor } from "@/contexts/PresentationEditorContext";

interface Props {
  onExport: (format: "pptx" | "pdf") => void;
  exporting: boolean;
  t: Record<string, string>;
}

export default function SlideToolbar({ onExport, exporting, t }: Props) {
  const { canUndo, canRedo, dispatch } = useEditor();

  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white/60 px-4 py-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => dispatch({ type: "UNDO" })}
          disabled={!canUndo}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-30"
        >
          {t.undo}
        </button>
        <button
          onClick={() => dispatch({ type: "REDO" })}
          disabled={!canRedo}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-30"
        >
          {t.redo}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onExport("pptx")}
          disabled={exporting}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {exporting ? t.downloading : t.exportPptx}
        </button>
        <button
          onClick={() => onExport("pdf")}
          disabled={exporting}
          className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {t.exportPdf}
        </button>
      </div>
    </div>
  );
}
