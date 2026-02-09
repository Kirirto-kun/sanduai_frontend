"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "../../../i18n/LanguageContext";
import { useTokens } from "../../../hooks/useTokens";
import {
  getSandubotHistory,
  sendSandubotMessageStream,
  InsufficientTokensError,
} from "../../../lib/api";
import { BotMessageRenderer } from "../../../components/BotMessageRenderer";

type Message = {
  role: "user" | "assistant";
  text: string;
  links?: { label: string; href: string }[];
};

export default function SandubotPage() {
  const t = useTranslations();
  const { refreshBalance, costs, balance } = useTokens();
  const [messages, setMessages] = useState<Message[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamingLinks, setStreamingLinks] = useState<{ label: string; href: string }[] | undefined>();
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const operationType = "sandbot_chat";
  const cost = costs[operationType] ?? 3;
  const hasEnoughBalance = balance !== null && balance >= cost;

  useEffect(() => {
    getSandubotHistory()
      .then((res) => setMessages(res.messages))
      .catch(() => setMessages([]))
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamingText]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);
    setStreamingText("");
    setStreamingLinks(undefined);

    try {
      let fullText = "";
      let links: { label: string; href: string }[] | undefined;

      for await (const event of sendSandubotMessageStream(text)) {
        if (event.type === "thinking") {
          setStreamingText(t.sandubot?.thinking || "Думаю...");
        } else if (event.type === "chunk") {
          fullText += event.content;
          setStreamingText(fullText);
        } else if (event.type === "done") {
          links = event.links;
          setStreamingLinks(links);
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: fullText, links },
      ]);
      setStreamingText("");
      setStreamingLinks(undefined);
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
      setStreamingText("");
      setStreamingLinks(undefined);
    }
  };

  return (
    <div className="fixed inset-0 top-14 flex flex-col overflow-hidden md:left-72 md:top-14">
      {/* Messages — один скролл, без лишнего пространства */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
      >
        {!historyLoading && messages.length === 0 && (
          <p className="text-center text-sm text-slate-500 py-12">
            {t.sandubot?.placeholder || "Напишите вопрос или попросите помочь с навигацией. Например: «Нужен КМЖ»"}
          </p>
        )}
        {historyLoading && (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[color:var(--primary)] border-r-transparent" />
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} max-w-3xl mx-auto`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] text-white"
                  : "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50"
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
            <div className="max-w-[85%] rounded-2xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-slate-200/50">
              {streamingText ? (
                <div className="space-y-2">
                  <BotMessageRenderer
                    text={
                      streamingText === (t.sandubot?.thinking || "Думаю...")
                        ? `*${streamingText}*`
                        : streamingText
                    }
                  />
                  {streamingLinks && streamingLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {streamingLinks.map((link, j) => (
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
              ) : (
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-4 sm:mx-6 mb-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Input — внизу, в потоке (без двойного скролла) */}
      <div className="flex-shrink-0 border-t border-slate-200 bg-white p-4">
        <div className="flex gap-2 max-w-3xl mx-auto">
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
          <p className="mt-1.5 text-xs text-amber-600 max-w-3xl mx-auto">
            {t.sandubot?.insufficientTokens || "Недостаточно токенов"} ({cost} {t.tokens?.cost || "токенов"})
          </p>
        )}
      </div>
    </div>
  );
}
