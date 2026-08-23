export type AccessPolicy = "public" | "authenticated" | "subscription" | "admin";

export type AccessDecision = "allow" | "login" | "subscribe" | "pending" | "forbidden";

function matchesSegment(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/**
 * Classify dashboard pages independently from coin balance. AI generation is
 * authenticated and paid with coins; ready/static library content requires a
 * subscription. At Zharys is the deliberate library exception because it is
 * generated for the teacher and debits coins.
 */
export function classifyRouteAccess(pathname: string): AccessPolicy {
  if (matchesSegment(pathname, "/dashboard/admin")) return "admin";
  if (pathname === "/dashboard/library/games" || pathname === "/dashboard/library/games/") {
    return "authenticated";
  }
  if (matchesSegment(pathname, "/dashboard/library/games/at-zharys")) return "authenticated";
  if (matchesSegment(pathname, "/dashboard/library")) return "subscription";
  if (matchesSegment(pathname, "/dashboard")) return "authenticated";
  return "public";
}

export function decideRouteAccess({
  policy,
  isAuthenticated,
  isAdmin,
  hasSubscription,
}: {
  policy: AccessPolicy;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasSubscription: boolean | null;
}): AccessDecision {
  if (policy === "public") return "allow";
  if (!isAuthenticated) return "login";
  if (policy === "admin") return isAdmin ? "allow" : "forbidden";
  if (policy === "authenticated") return "allow";
  if (hasSubscription === null) return "pending";
  return hasSubscription ? "allow" : "subscribe";
}
