"use client";

interface SpeechBubbleProps {
  text: string;
}

export function SpeechBubble({ text }: SpeechBubbleProps) {
  return (
    <div className="relative bg-white rounded-2xl p-4 shadow-lg border border-slate-200 max-w-2xl mx-auto">
      <div className="absolute -top-2 left-8 w-4 h-4 bg-white border-l border-t border-slate-200 transform rotate-45"></div>
      <p className="text-slate-800 text-sm leading-relaxed">{text}</p>
    </div>
  );
}
