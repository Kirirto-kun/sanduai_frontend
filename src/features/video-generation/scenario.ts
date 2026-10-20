import { sceneDuration } from "./model";
import type { VideoCatalog, VideoPlan, VideoProject } from "./types";

/** A partial apply can be reflected in the query already, or still be local. */
export function scenarioCapacity(
  project: Pick<VideoProject, "scenes"> | null | undefined,
  proposal: VideoPlan | null,
  applied: string[],
  limits: Pick<VideoCatalog, "max_scenes" | "max_project_duration">,
) {
  const existing = project?.scenes ?? [];
  const existingIds = new Set(existing.map((scene) => scene.id));
  const unreported = applied.flatMap((id, index) =>
    existingIds.has(id) ? [] : [index],
  );
  const remainingScenes = Math.max(
    0,
    limits.max_scenes - existing.length - unreported.length,
  );
  const usedDuration =
    existing
      .filter((scene) => scene.included)
      .reduce((total, scene) => total + sceneDuration(scene), 0) +
    unreported.reduce(
      (total, index) => total + (proposal?.scenes[index]?.duration ?? 0),
      0,
    );
  const remainingDuration = Math.max(
    0,
    limits.max_project_duration - usedDuration,
  );
  const pending = proposal?.scenes.slice(applied.length) ?? [];
  return {
    remainingScenes,
    remainingDuration,
    fits:
      pending.length <= remainingScenes &&
      pending.reduce((total, scene) => total + (scene.duration ?? 5), 0) <=
        remainingDuration,
  };
}

function lineAlreadyInPrompt(line: string, prompt: string): boolean {
  if (prompt.includes(line)) return true;
  // Only a short speaker label plus one complete quoted line is safe to compare.
  // Mixed action directions or unquoted lines must remain visible for review.
  const match = line.match(
    /^(?:([A-Za-zА-Яа-яЁёӘәҒғҚқҰұҮүҺһІіҢңӨө][A-Za-zА-Яа-яЁёӘәҒғҚқҰұҮүҺһІіҢңӨө0-9 _-]{0,49}):\s*)?(?:«([^»]+)»|"([^"\n]+)"|“([^”]+)”)[.!?…]?$/,
  );
  if (!match) return false;
  const words = match.slice(2).find(Boolean);
  if (!words) return false;
  const at = prompt.indexOf(words);
  if (at < 0) return false;
  return (
    !match[1] || prompt.slice(Math.max(0, at - 120), at).includes(match[1])
  );
}

/** Older assistant responses can place lines outside the visible scene prompt. */
export function scenarioPrompt(scene: VideoPlan["scenes"][number]): string {
  const prompt = scene.prompt.trim();
  const dialogue = scene.dialogue?.trim();
  if (!dialogue || prompt.includes(dialogue)) return prompt;
  const lines = dialogue
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.every((line) => lineAlreadyInPrompt(line, prompt))
    ? prompt
    : `${prompt}\n\n${dialogue}`.trim();
}

/** Offer only totals that can actually be made with the model's shot lengths. */
export function scenarioDurationOptions(
  durations: number[],
  count: number,
): number[] {
  if (!Number.isInteger(count) || count < 1 || count > 20) return [];
  let totals = new Set([0]);
  for (let i = 0; i < count; i++) {
    const next = new Set<number>();
    for (const total of totals) {
      for (const duration of durations) {
        if (
          Number.isInteger(duration) &&
          duration > 0 &&
          total + duration <= 300
        )
          next.add(total + duration);
      }
    }
    totals = next;
  }
  return [...totals].filter((total) => total >= 5).sort((a, b) => a - b);
}

export function nearestScenarioDuration(
  totals: number[],
  preferred: number,
): number {
  return totals.reduce(
    (best, total) =>
      Math.abs(total - preferred) < Math.abs(best - preferred) ? total : best,
    totals[0] ?? 5,
  );
}
