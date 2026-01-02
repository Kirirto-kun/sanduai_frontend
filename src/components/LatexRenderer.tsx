"use client";

import katex from "katex";
import "katex/dist/katex.min.css";

type LatexRendererProps = {
  text: string;
};

/**
 * LatexRenderer component
 * Finds LaTeX formulas wrapped in $$...$$ and renders them using KaTeX
 * Other text is displayed as-is
 */
export function LatexRenderer({ text }: LatexRendererProps) {
  if (!text) return null;

  // Split text by LaTeX delimiters $$...$$
  const parts: { type: "text" | "latex"; content: string }[] = [];
  let currentIndex = 0;
  const regex = /\$\$(.*?)\$\$/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the formula
    if (match.index > currentIndex) {
      parts.push({
        type: "text",
        content: text.slice(currentIndex, match.index),
      });
    }

    // Add the formula
    parts.push({
      type: "latex",
      content: match[1],
    });

    currentIndex = match.index + match[0].length;
  }

  // Add remaining text after last formula
  if (currentIndex < text.length) {
    parts.push({
      type: "text",
      content: text.slice(currentIndex),
    });
  }

  // If no LaTeX found, return text as-is
  if (parts.length === 0) {
    return <span>{text}</span>;
  }

  return (
    <span>
      {parts.map((part, idx) => {
        if (part.type === "text") {
          return <span key={idx}>{part.content}</span>;
        } else {
          // Render LaTeX
          try {
            const html = katex.renderToString(part.content, {
              throwOnError: false,
              displayMode: false,
            });
            return (
              <span
                key={idx}
                dangerouslySetInnerHTML={{ __html: html }}
                className="inline-block"
              />
            );
          } catch (err) {
            console.error("KaTeX rendering error:", err);
            return <span key={idx}>{`$$${part.content}$$`}</span>;
          }
        }
      })}
    </span>
  );
}





