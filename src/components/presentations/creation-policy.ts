import type { CostEstimate, PresentationMode } from "@/types/presentations";

/** New presentation creation is temporarily limited to the creative workflow. */
export const ACTIVE_PRESENTATION_CREATION_MODE = "creative" satisfies PresentationMode;
export const PRESENTATION_CREATE_PATH = "/dashboard/ai/presentations/create";

export function resolvePresentationCreationMode(
  requestedMode: string | null | undefined,
): typeof ACTIVE_PRESENTATION_CREATION_MODE {
  void requestedMode;
  return ACTIVE_PRESENTATION_CREATION_MODE;
}

export function shouldCanonicalizePresentationCreationMode(
  requestedMode: string | null | undefined,
): boolean {
  return requestedMode != null && requestedMode !== ACTIVE_PRESENTATION_CREATION_MODE;
}

/**
 * Teachers only need the final charge in Sandu coins. Provider pricing and
 * per-slide cost limits are operational details and must never reach the UI.
 */
export function teacherVisibleCoinCost(estimate: CostEstimate | undefined): number | null {
  if (!estimate) return null;
  return [estimate.coin_cost, estimate.retail_tokens].find(
    (value): value is number => typeof value === "number",
  ) ?? null;
}
