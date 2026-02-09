"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "../i18n/LanguageContext";
import { useTokens } from "../hooks/useTokens";
import { sendSandubotMessage, InsufficientTokensError } from "../lib/api";
import { BotMessageRenderer } from "./BotMessageRenderer";

type Message = {
  role: "user" | "assistant";
  text: string;
  links?: { label: string; href: string }[];
};

type ChatPanelProps = {
  onClose: () => void;
};

export function ChatPanel({ onClose }: ChatPanelProps) {
  const t = useTranslations();
  const { refreshBalance, costs, balance } = useTokens();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const operationType = "sandbot_chat";
  const cost = costs[operationType] ?? 3;
  // Используем fallback для cost, т.к. costs может быть пустым до загрузки или в кэше
  const hasEnoughBalance = balance !== null && balance >= cost;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await sendSandubotMessage(text);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: res.text, links: res.links ?? undefined },
      ]);
      refreshBalance();
    } catch (err) {
      if (err instanceof InsufficientTokensError) {
        setError(
          `${t.tokens?.insufficient || "Недостаточно токенов"}. ${t.tokens?.required || "Требуется"}: ${err.required}, ${t.tokens?.available || "Доступно"}: ${err.available}`
        );
      } else {
        setError(err instanceof Error ? err.message : "Ошибка");
      }
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-6 py-4">
        <h3 className="text-lg font-semibold text-white">
          {t.sandubot?.title || "Sandu Bot"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 text-white/90 hover:bg-white/20 transition"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4"
      >
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-500 py-8">
            {t.sandubot?.placeholder || "Напишите вопрос или попросите помочь с навигацией. Например: «Нужен КМЖ»"}
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} max-w-3xl mx-auto`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                msg.role === "user"
                  ? "bg-[color:var(--primary)] text-white"
                  : "bg-slate-100 text-slate-900"
              }`}
            >
              {msg.role === "user" ? (
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              ) : (
                <div className="space-y-2">
                  <BotMessageRenderer text={msg.text} />
                  {msg.links && msg.links.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {msg.links.map((link, j) => (
                        <Link
                          key={j}
                          href={link.href}
                          className="inline-flex rounded-xl bg-[color:var(--primary)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start max-w-3xl mx-auto">
            <div className="rounded-2xl bg-slate-100 px-4 py-2.5">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 border-t border-slate-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={t.sandubot?.inputPlaceholder || "Введите сообщение..."}
            disabled={loading || !hasEnoughBalance}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)] disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !input.trim() || !hasEnoughBalance}
            className="rounded-xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.sandubot?.send || "Отправить"}
          </button>
        </div>
        {!hasEnoughBalance && balance !== null && (
          <p className="mt-1.5 text-xs text-amber-600">
            {t.sandubot?.insufficientTokens || "Недостаточно токенов"} ({cost} {t.tokens?.cost || "токенов"})
          </p>
        )}
      </div>
    </div>
  );
}
