"use client";

import type { ContentLanguage } from "../../lib/content-languages";
import { generatedContentCopy } from "../../lib/generated-content-copy";

interface VictoryModalProps {
  winnerName: string;
  language: ContentLanguage;
  onPlayAgain: () => void;
  onGoToLibrary: () => void;
}

export function VictoryModal({
  winnerName,
  language,
  onPlayAgain,
  onGoToLibrary,
}: VictoryModalProps) {
  const copy = generatedContentCopy(language).race;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="race-victory-title"
        className="glass-card relative max-w-md rounded-3xl border border-white/60 p-8 shadow-2xl"
      >
        {/* Victory decoration */}
        <div className="mb-6 text-center">
          <div className="mb-4 text-6xl">🏆</div>
          <h2 id="race-victory-title" className="text-3xl font-bold text-slate-900">
            {copy.victory}
          </h2>
        </div>

        {/* Winner announcement */}
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-400 p-6 text-center shadow-lg">
          <p className="mb-2 text-sm font-semibold text-slate-700">{copy.winner}</p>
          <p className="text-2xl font-bold text-slate-900">{winnerName}</p>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="w-full rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:opacity-90"
          >
            {copy.playAgain}
          </button>
          <button
            type="button"
            onClick={onGoToLibrary}
            className="w-full rounded-2xl border-2 border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            {copy.backToGames}
          </button>
        </div>
      </div>
    </div>
  );
}

