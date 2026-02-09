"use client";

import katex from "katex";
import "katex/dist/katex.min.css";

type LatexRendererProps = {
  /** Raw LaTeX content (без $$). Используется из BotMessageRenderer. */
  content?: string;
  /** Текст с формулами $$...$$ или \(...\). Обратная совместимость для bjb-tjb, tests и т.д. */
  text?: string;
  displayMode?: boolean;
};

function renderLatex(content: string, displayMode: boolean) {
  try {
    const html = katex.renderToString(content.trim(), {
      throwOnError: false,
      displayMode,
    });
    return (
      <span
        dangerouslySetInnerHTML={{ __html: html }}
        className={displayMode ? "block my-2 overflow-x-auto" : "inline-block align-middle"}
      />
    );
  } catch (err) {
    console.error("KaTeX rendering error:", err);
    return <span>{`$$${content}$$`}</span>;
  }
}

/**
 * LatexRenderer component
 * Renders LaTeX formula using KaTeX.
 * - content: raw LaTeX (from BotMessageRenderer)
 * - text: parses $$...$$ and \(...\) (backward compat)
 */
export function LatexRenderer({ content, text, displayMode = false }: LatexRendererProps) {
  if (content) {
    return renderLatex(content, displayMode);
  }
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  const regex = /\$\$([\s\S]*?)\$\$|\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g;
  let match;
  let currentIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > currentIndex) {
      parts.push(<span key={`t-${parts.length}`}>{text.slice(currentIndex, match.index)}</span>);
    }
    const latexContent = (match[1] ?? match[2] ?? match[3] ?? "").trim();
    const isDisplay = match[1] !== undefined || match[3] !== undefined;
    parts.push(<span key={`l-${parts.length}`}>{renderLatex(latexContent, isDisplay)}</span>);
    currentIndex = match.index + match[0].length;
  }

  if (currentIndex < text.length) {
    parts.push(<span key={`t-${parts.length}`}>{text.slice(currentIndex)}</span>);
  }

  if (parts.length === 0) return <span>{text}</span>;
  return <span>{parts}</span>;
}





