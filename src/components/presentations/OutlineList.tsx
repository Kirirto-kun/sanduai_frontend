"use client";

import { useState } from "react";
import type { Outline } from "@/types/presenton";

interface Props {
  outlines: Outline[];
  onChange: (outlines: Outline[]) => void;
  t: Record<string, string>;
}

export default function OutlineList({ outlines, onChange, t }: Props) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const update = (idx: number, value: string) => {
    const next = [...outlines];
    next[idx] = { ...next[idx], content: value };
    onChange(next);
  };

  const add = () => {
    onChange([...outlines, { content: "" }]);
    setEditingIdx(outlines.length);
  };

  const remove = (idx: number) => {
    onChange(outlines.filter((_, i) => i !== idx));
    setEditingIdx(null);
  };

  return (
    <div className="space-y-3">
      {outlines.map((outline, idx) => (
        <div
          key={idx}
          className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/60 p-3"
        >
          <span className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
            {idx + 1}
          </span>
          <div className="min-w-0 flex-1">
            {editingIdx === idx ? (
              <textarea
                autoFocus
                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/30"
                rows={3}
                value={outline.content}
                onChange={(e) => update(idx, e.target.value)}
                onBlur={() => setEditingIdx(null)}
              />
            ) : (
              <p
                className="cursor-pointer text-sm text-slate-800"
                onClick={() => setEditingIdx(idx)}
              >
                {outline.content || <span className="italic text-slate-400">({t.editOutline})</span>}
              </p>
            )}
          </div>
          <button
            onClick={() => remove(idx)}
            className="flex-shrink-0 text-xs text-rose-500 hover:text-rose-700"
          >
            {t.removeOutline}
          </button>
        </div>
      ))}

      <button
        onClick={add}
        className="w-full rounded-xl border-2 border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 transition hover:border-indigo-400 hover:text-indigo-600"
      >
        + {t.addOutline}
      </button>
    </div>
  );
}
