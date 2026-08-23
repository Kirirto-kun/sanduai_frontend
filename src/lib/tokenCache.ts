/**
 * Утилиты для кэширования стоимости токенов в localStorage
 */

const TOKEN_COSTS_CACHE_KEY = "sanduai_token_costs";
const TOKEN_BALANCE_CACHE_KEY = "sanduai_token_balance";
const CACHE_TTL = 60 * 60 * 1000; // 1 час в миллисекундах для costs
const BALANCE_CACHE_TTL = 30 * 1000; // 30 секунд для баланса (может меняться чаще)

interface CachedCosts {
  costs: Record<string, number>;
  timestamp: number;
}

export interface CachedBalance {
  user_id: string;
  balance: number;
  has_subscription: boolean;
  subscription_end: string | null;
  subscription_plan: "free" | "premium" | null;
  timestamp: number;
}

// Глобальные флаги для предотвращения множественных одновременных запросов
let costsFetchPromise: Promise<Record<string, number>> | null = null;
const balanceFetchPromises = new Map<string, Promise<CachedBalance>>();

/**
 * Получить кэшированные стоимости операций из localStorage
 * @returns Кэшированные costs или null, если кэша нет или он устарел
 */
export function getCachedCosts(): Record<string, number> | null {
  if (typeof window === "undefined") return null;

  try {
    const cached = window.localStorage.getItem(TOKEN_COSTS_CACHE_KEY);
    if (!cached) return null;

    const data: CachedCosts = JSON.parse(cached);
    
    // Проверяем, не устарел ли кэш
    const now = Date.now();
    if (now - data.timestamp > CACHE_TTL) {
      // Кэш устарел, но можем вернуть его как fallback
      return data.costs || null;
    }
    
    return data.costs || null;
  } catch (err) {
    console.error("Failed to parse cached token costs:", err);
    return null;
  }
}

/**
 * Проверить, актуален ли кэш (не старше TTL)
 */
export function isCacheValid(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const cached = window.localStorage.getItem(TOKEN_COSTS_CACHE_KEY);
    if (!cached) return false;

    const data: CachedCosts = JSON.parse(cached);
    const now = Date.now();
    return now - data.timestamp <= CACHE_TTL;
  } catch {
    return false;
  }
}

/**
 * Сохранить стоимости операций в localStorage
 * @param costs Словарь со стоимостями операций
 */
export function setCachedCosts(costs: Record<string, number>): void {
  if (typeof window === "undefined") return;

  try {
    const data: CachedCosts = {
      costs,
      timestamp: Date.now(),
    };
    window.localStorage.setItem(TOKEN_COSTS_CACHE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to cache token costs:", err);
  }
}

/**
 * Очистить кэш стоимостей операций
 */
export function clearCachedCosts(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_COSTS_CACHE_KEY);
  costsFetchPromise = null;
}

// ========== Функции для кэширования баланса ==========

/**
 * Получить кэшированный баланс из localStorage
 * @returns Кэшированный баланс или null, если кэша нет
 */
export function getCachedBalance(userId: string): CachedBalance | null {
  if (typeof window === "undefined") return null;
  if (!userId) return null;

  try {
    const cached = window.localStorage.getItem(TOKEN_BALANCE_CACHE_KEY);
    if (!cached) return null;

    const data: CachedBalance = JSON.parse(cached);
    if (data.user_id !== userId) {
      window.localStorage.removeItem(TOKEN_BALANCE_CACHE_KEY);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Failed to parse cached token balance:", err);
    return null;
  }
}

/**
 * Проверить, актуален ли кэш баланса (не старше TTL)
 */
export function isBalanceCacheValid(userId: string): boolean {
  const data = getCachedBalance(userId);
  return Boolean(data && Date.now() - data.timestamp <= BALANCE_CACHE_TTL);
}

/**
 * Сохранить баланс в localStorage
 */
export function setCachedBalance(userId: string, data: {
  balance: number;
  has_subscription: boolean;
  subscription_end: string | null;
  subscription_plan: "free" | "premium" | null;
}): void {
  if (typeof window === "undefined") return;
  if (!userId) return;

  try {
    const cached: CachedBalance = {
      ...data,
      user_id: userId,
      timestamp: Date.now(),
    };
    window.localStorage.setItem(TOKEN_BALANCE_CACHE_KEY, JSON.stringify(cached));
  } catch (err) {
    console.error("Failed to cache token balance:", err);
  }
}

/**
 * Очистить кэш баланса
 */
export function clearCachedBalance(): void {
  balanceFetchPromises.clear();
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_BALANCE_CACHE_KEY);
}

/**
 * Получить или создать глобальный промис для загрузки баланса
 * Предотвращает множественные одновременные запросы
 */
export function getOrCreateBalanceFetchPromise(
  userId: string,
  fetchFn: () => Promise<CachedBalance>
): Promise<CachedBalance> {
  const existing = balanceFetchPromises.get(userId);
  if (existing) return existing;

  const request = fetchFn().finally(() => {
    if (balanceFetchPromises.get(userId) === request) balanceFetchPromises.delete(userId);
  });
  balanceFetchPromises.set(userId, request);
  return request;
}

/**
 * Получить или создать глобальный промис для загрузки costs
 * Предотвращает множественные одновременные запросы
 */
export function getOrCreateFetchPromise(
  fetchFn: () => Promise<Record<string, number>>
): Promise<Record<string, number>> {
  if (costsFetchPromise) {
    return costsFetchPromise;
  }

  const request = fetchFn().finally(() => {
    if (costsFetchPromise === request) costsFetchPromise = null;
  });
  costsFetchPromise = request;
  return request;
}
