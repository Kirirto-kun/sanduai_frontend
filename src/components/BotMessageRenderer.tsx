"use client";

import Markdown from "react-markdown";
import { LatexRenderer } from "./LatexRenderer";

type BotMessageRendererProps = {
  text: string;
};

/**
 * Split text by LaTeX delimiters: $$...$$ (block), \(...\) (inline), \[...\] (display).
 * Uses [\s\S] to match across newlines (многострочные формулы).
 */
function splitByLatex(text: string): { type: "text" | "latex"; content: string; displayMode: boolean }[] {
  const parts: { type: "text" | "latex"; content: string; displayMode: boolean }[] = [];
  // $$...$$ (block, multiline), \(...\) (inline), \[...\] (display)
  const regex = /\$\$([\s\S]*?)\$\$|\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g;
  let match;
  let currentIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > currentIndex) {
      parts.push({ type: "text", content: text.slice(currentIndex, match.index), displayMode: false });
    }
    const latexContent = match[1] ?? match[2] ?? match[3] ?? "";
    const displayMode = match[1] !== undefined || match[3] !== undefined; // $$ or \[
    parts.push({ type: "latex", content: latexContent.trim(), displayMode });
    currentIndex = match.index + match[0].length;
  }

  if (currentIndex < text.length) {
    parts.push({ type: "text", content: text.slice(currentIndex), displayMode: false });
  }

  return parts;
}

/**
 * Renders bot message with Markdown and LaTeX support.
 */
export function BotMessageRenderer({ text }: BotMessageRendererProps) {
  if (!text) return null;

  const parts = splitByLatex(text);
  if (parts.length === 0) return null;

  return (
    <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0">
      {parts.map((part, idx) =>
        part.type === "text" ? (
          <Markdown
            key={idx}
            components={{
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[color:var(--primary)] underline hover:no-underline"
                >
                  {children}
                </a>
              ),
            }}
          >
            {part.content}
          </Markdown>
        ) : (
          <LatexRenderer key={idx} content={part.content} displayMode={part.displayMode} />
        )
      )}
    </div>
  );
}
