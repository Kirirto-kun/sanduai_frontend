"use client";

import { useEffect, useState } from "react";

interface Props {
  show: boolean;
  status: string | null;
  message?: string | null;
  t: Record<string, string>;
}

const TIPS_KEYS = ["tipMagic", "tipAnalyzing", "tipOrganizing", "tipVisuals", "tipFinishing"] as const;

export default function GenerationOverlay({ show, status, message, t }: Props) {
  const [tipIndex, setTipIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Rotate tips
  useEffect(() => {
    if (!show) return;
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS_KEYS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [show]);

  // Animate progress (caps at 90% while processing)
  useEffect(() => {
    if (!show) {
      setProgress(0);
      return;
    }
    if (status === "completed") {
      setProgress(100);
      return;
    }
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return 90;
        // Slow down as we approach 90%
        const increment = p < 30 ? 3 : p < 60 ? 2 : 1;
        return Math.min(p + increment, 90);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [show, status]);

  if (!show) return null;

  const statusText =
    status === "completed"
      ? t.statusCompleted
      : status === "error"
        ? t.statusError
        : status === "processing"
          ? t.statusProcessing
          : t.statusPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0a0a] p-8 text-center shadow-2xl">
        {/* Animated icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center">
          {status === "completed" ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
              <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : status === "error" ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/20">
              <svg className="h-8 w-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          ) : (
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-500/30 border-t-indigo-400" />
          )}
        </div>

        {/* Status text */}
        <h3 className="text-lg font-semibold text-white">{statusText}</h3>

        {/* Error message detail */}
        {status === "error" && message && (
          <p className="mt-2 text-sm text-rose-300">{message}</p>
        )}

        {/* Processing message */}
        {status !== "completed" && status !== "error" && message && (
          <p className="mt-2 text-sm text-white/70">{message}</p>
        )}

        {/* Rotating tip */}
        {status !== "completed" && status !== "error" && !message && (
          <p className="mt-3 min-h-[24px] text-sm text-white/60 transition-opacity duration-500">
            {t[TIPS_KEYS[tipIndex]]}
          </p>
        )}

        {/* Progress bar */}
        {status !== "error" && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>{t.status}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 transition-all duration-700 ease-out"
                style={{
                  width: `${progress}%`,
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2s ease-in-out infinite",
                }}
              />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
