/**
 * Format subscription end date from ISO format to readable format
 * @param dateString - ISO format date string (e.g., "2026-02-15T00:00:00") or null
 * @returns Formatted date string (e.g., "15.02.2026") or "—" if null
 */
export function formatSubscriptionDate(dateString: string | null): string {
  if (!dateString) return "—";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "—";
    }

    // Format: DD.MM.YYYY
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  } catch (error) {
    console.error("Error formatting subscription date:", error);
    return "—";
  }
}

/**
 * Check if subscription is active based on end date
 * @param subscriptionEnd - ISO format date string or null
 * @returns true if subscription is active (end date is in the future), false otherwise
 */
export function isSubscriptionActive(subscriptionEnd: string | null): boolean {
  if (!subscriptionEnd) return false;

  try {
    const endDate = new Date(subscriptionEnd);
    if (isNaN(endDate.getTime())) {
      return false;
    }

    return endDate > new Date();
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return false;
  }
}

/**
 * Format video duration from seconds to readable format
 * @param seconds - Duration in seconds or null
 * @returns Formatted duration string (e.g., "5:30" or "1:25:10") or "—" if null
 */
export function formatVideoDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return "—";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  } else {
    return `${minutes}:${String(secs).padStart(2, "0")}`;
  }
}

/**
 * Check if video watch token is expired
 * @param expirationTime - Unix timestamp in milliseconds
 * @returns true if token is expired, false otherwise
 */
export function isTokenExpired(expirationTime: number): boolean {
  const now = Date.now();
  return now >= expirationTime;
}

