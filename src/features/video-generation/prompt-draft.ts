import { promptVideoSettings } from "./model";
import { scenarioPrompt } from "./scenario";
import type { VideoSettings } from "./types";

function withLegacyLines(
  prompt: string,
  lines: string,
  heading: string,
): string {
  if (!lines.trim()) return prompt;
  const combined = scenarioPrompt({ title: "", prompt, dialogue: lines });
  if (combined === prompt.trim()) return prompt;
  return `${prompt.trim()}\n\n${heading}\n${lines.trim()}`.trim();
}

/** Move older separate speech fields into the text the editor actually shows. */
export function normalizeVideoPromptDraft<
  T extends { prompt: string; dialogue?: string; settings: VideoSettings },
>(draft: T) {
  const prompt = withLegacyLines(
    withLegacyLines(draft.prompt, draft.dialogue ?? "", "Реплики персонажей:"),
    draft.settings.speech_text,
    "Реплики дословно:",
  );
  return {
    ...draft,
    prompt,
    dialogue: "",
    settings: {
      ...promptVideoSettings(draft.settings),
      speech_text: "",
    },
  };
}
