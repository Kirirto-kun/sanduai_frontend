"use client";

import { useState } from "react";
import { useEditor } from "@/contexts/PresentationEditorContext";
import { editSlide } from "@/lib/presenton-api";

interface Props {
  t: Record<string, string>;
}

export default function AiEditPanel({ t }: Props) {
  const { state, selectedSlide, dispatch } = useEditor();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = async () => {
    if (!selectedSlide || !prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await editSlide({
        presentation_id: state.presentationId,
        slide_id: selectedSlide.id,
        prompt: prompt.trim(),
      });
      dispatch({
        type: "UPDATE_SLIDE",
        index: state.selectedIndex,
        slide: updated,
      });
      setPrompt("");
    } catch (e: any) {
      setError(e?.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white/60 p-4">
      <p className="mb-2 text-xs font-semibold text-slate-600">{t.aiEdit}</p>
      <textarea
        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/30"
        rows={3}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={t.aiEditPlaceholder}
      />
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      <button
        onClick={handleEdit}
        disabled={loading || !prompt.trim()}
        className="mt-2 w-full rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? t.generating : t.aiEdit}
      </button>
    </div>
  );
}
