"use client";

import Link from "next/link";
import type { PresentationListItem } from "@/types/presenton";

interface Props {
  presentation: PresentationListItem;
  onDelete: (id: string) => void;
  deleting?: boolean;
  t: Record<string, string>;
}

export default function PresentationCard({ presentation, onDelete, deleting, t }: Props) {
  const date = new Date(presentation.created_at).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="glass-card group relative overflow-hidden rounded-2xl border border-white/60 shadow-sm transition hover:shadow-md">
      {/* Top color accent */}
      <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

      <div className="p-5">
        {/* Title */}
        <h3 className="truncate text-base font-semibold text-slate-900">
          {presentation.title || presentation.content.slice(0, 50)}
        </h3>

        {/* Meta */}
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <span>{date}</span>
          <span className="text-slate-300">&bull;</span>
          <span>{presentation.n_slides} {t.slides}</span>
          <span className="text-slate-300">&bull;</span>
          <span>{presentation.language}</span>
        </div>

        {/* Preview */}
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {presentation.content.slice(0, 150)}
        </p>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <Link
            href={`/dashboard/ai/presentations/editor/${presentation.id}`}
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-xs font-semibold text-white transition hover:bg-indigo-700"
          >
            {t.editor}
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete(presentation.id);
            }}
            disabled={deleting}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
          >
            {t.delete}
          </button>
        </div>
      </div>
    </div>
  );
}
