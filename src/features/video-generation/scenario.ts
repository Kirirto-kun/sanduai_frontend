import type { VideoPlan } from "./types";

/** Older assistant responses can place lines outside the visible scene prompt. */
export function scenarioPrompt(scene: VideoPlan["scenes"][number]): string {
  const prompt = scene.prompt.trim();
  const dialogue = scene.dialogue?.trim();
  return dialogue && !prompt.includes(dialogue)
    ? `${prompt}\n\n${dialogue}`.trim()
    : prompt;
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
