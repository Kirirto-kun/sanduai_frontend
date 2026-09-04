"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getTokenBalance,
  getTokenCosts,
  type TokenBalance,
  type TokenCosts,
  getToken,
} from "../lib/api";
import { decodeJwtPayload, isUsableJwt } from "../lib/auth-token";
import {
  getCachedCosts,
  setCachedCosts,
  isCacheValid,
  getOrCreateFetchPromise,
  getCachedBalance,
  setCachedBalance,
  isBalanceCacheValid,
  getOrCreateBalanceFetchPromise,
  clearCachedBalance,
  getSubscriptionExpiryTimerDelay,
  parseSubscriptionEndTimestamp,
  TOKEN_BALANCE_INVALIDATED_EVENT,
} from "../lib/tokenCache";
import {
  hasAuthLogoutTombstone,
  subscribeToAuthSessionChanges,
} from "../lib/auth-session";

export function currentSessionUserId(): string | null {
  if (hasAuthLogoutTombstone()) return null;
  const token = getToken();
  if (!token || !isUsableJwt(token)) return null;
  const subject = decodeJwtPayload(token)?.sub;
  return typeof subject === "string" && subject.length > 0 ? subject : null;
}

export function useTokens() {
  const [balance, setBalance] = useState<number | null>(null);
  const [costs, setCosts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<"free" | "premium" | null>(null);
  const balanceRequestId = useRef(0);

  const fetchBalance = useCallback(async () => {
    const requestId = ++balanceRequestId.current;
    const token = getToken();
    const sessionUserId = currentSessionUserId();
    if (!token || !sessionUserId) {
      setBalance(null);
      setHasSubscription(null);
      setSubscriptionEnd(null);
      setSubscriptionPlan(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    // Сначала загружаем из кэша для мгновенного отображения
    const cachedBalance = getCachedBalance(sessionUserId);
    if (cachedBalance) {
      setBalance(cachedBalance.balance);
      setHasSubscription(cachedBalance.has_subscription);
      setSubscriptionEnd(cachedBalance.subscription_end);
      setSubscriptionPlan(cachedBalance.subscription_plan);
      
      // Если кэш актуален (не старше TTL), не делаем запрос к серверу
      if (isBalanceCacheValid(sessionUserId)) {
        setLoading(false);
        return;
      }
    }

    // Если кэша нет или он устарел, загружаем с сервера
    // Используем глобальный промис, чтобы избежать множественных одновременных запросов
    try {
      setError(null);
      const balanceData = await getOrCreateBalanceFetchPromise(sessionUserId, async () => {
        const data: TokenBalance = await getTokenBalance();
        if (data.user_id !== sessionUserId) {
          throw new Error("Balance response belongs to a different user.");
        }
        return {
          user_id: data.user_id,
          balance: data.balance,
          has_subscription: data.has_subscription,
          subscription_end: data.subscription_end,
          subscription_plan: data.subscription_plan,
          timestamp: Date.now(),
        };
      });

      if (requestId !== balanceRequestId.current || currentSessionUserId() !== sessionUserId) return;

      const expiresAt = balanceData.subscription_end
        ? parseSubscriptionEndTimestamp(balanceData.subscription_end)
        : Number.NaN;
      const hasEffectiveSubscription = balanceData.has_subscription
        && (!Number.isFinite(expiresAt) || expiresAt > Date.now());

      setBalance(balanceData.balance);
      setHasSubscription(hasEffectiveSubscription);
      setSubscriptionEnd(balanceData.subscription_end);
      setSubscriptionPlan(hasEffectiveSubscription ? balanceData.subscription_plan : "free");
      
      // Сохраняем в кэш для следующего раза
      setCachedBalance(sessionUserId, {
        balance: balanceData.balance,
        has_subscription: hasEffectiveSubscription,
        subscription_end: balanceData.subscription_end,
        subscription_plan: hasEffectiveSubscription ? balanceData.subscription_plan : "free",
      });
    } catch {
      if (requestId !== balanceRequestId.current || currentSessionUserId() !== sessionUserId) return;
      // Consumers only need a retry signal; never retain a raw server/provider message.
      setError("balance_unavailable");
      // Если fetch не удался, используем кэш (если он есть)
      if (cachedBalance) {
        setBalance(cachedBalance.balance);
        setHasSubscription(cachedBalance.has_subscription);
        setSubscriptionEnd(cachedBalance.subscription_end);
        setSubscriptionPlan(cachedBalance.subscription_plan);
      } else {
        setBalance(null);
        setHasSubscription(null);
        setSubscriptionEnd(null);
        setSubscriptionPlan(null);
      }
    } finally {
      if (requestId === balanceRequestId.current && currentSessionUserId() === sessionUserId) {
        setLoading(false);
      }
    }
  }, []);

  const fetchCosts = useCallback(async () => {
    // Сначала загружаем из кэша для мгновенного отображения
    const cachedCosts = getCachedCosts();
    if (cachedCosts && Object.keys(cachedCosts).length > 0) {
      setCosts(cachedCosts);
      
      // Если кэш актуален (не старше TTL), не делаем запрос к серверу
      if (isCacheValid()) {
        return;
      }
    }

    // Если кэша нет или он устарел, загружаем с сервера
    // Используем глобальный промис, чтобы избежать множественных одновременных запросов
    try {
      const costs = await getOrCreateFetchPromise(async () => {
        const data: TokenCosts = await getTokenCosts();
        return data.costs;
      });
      
      setCosts(costs);
      // Сохраняем в кэш для следующего раза
      setCachedCosts(costs);
    } catch (err) {
      // Costs are optional, fail silently
      // Если fetch не удался, используем кэш (если он есть)
      console.error("Failed to fetch token costs:", err);
    }
  }, []);

  useEffect(() => {
    const sessionUserId = currentSessionUserId();
    if (sessionUserId) {
      setLoading(true);
      fetchBalance();
      fetchCosts();
    } else {
      setLoading(false);
      setBalance(null);
      setHasSubscription(null);
      setSubscriptionEnd(null);
      setSubscriptionPlan(null);
      // Даже если пользователь не залогинен, можем загрузить costs из кэша
      // (они публичные и не требуют авторизации)
      const cachedCosts = getCachedCosts();
      if (cachedCosts) {
        setCosts(cachedCosts);
      }
    }
  }, [fetchBalance, fetchCosts]);

  const refreshBalance = useCallback(() => {
    // Очищаем кэш при принудительном обновлении
    clearCachedBalance();
    return fetchBalance();
  }, [fetchBalance]);

  const refreshBalanceIfStale = useCallback(() => fetchBalance(), [fetchBalance]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshBalanceIfStale();
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refreshBalanceIfStale]);

  useEffect(() => subscribeToAuthSessionChanges(() => {
    setBalance(null);
    setHasSubscription(null);
    setSubscriptionEnd(null);
    setSubscriptionPlan(null);
    refreshBalance();
  }), [refreshBalance]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const refreshAfterLedgerChange = () => {
      void fetchBalance();
    };
    window.addEventListener(
      TOKEN_BALANCE_INVALIDATED_EVENT,
      refreshAfterLedgerChange,
    );
    return () => {
      window.removeEventListener(
        TOKEN_BALANCE_INVALIDATED_EVENT,
        refreshAfterLedgerChange,
      );
    };
  }, [fetchBalance]);

  useEffect(() => {
    if (!subscriptionEnd || hasSubscription !== true) return;
    let timer: number | undefined;

    const scheduleExpiryCheck = () => {
      const delay = getSubscriptionExpiryTimerDelay(subscriptionEnd);
      if (delay === null) return;
      if (delay === 0) {
        setHasSubscription(false);
        setSubscriptionPlan("free");
        return;
      }

      timer = window.setTimeout(() => {
        const expiresAt = parseSubscriptionEndTimestamp(subscriptionEnd);
        if (!Number.isFinite(expiresAt)) return;
        if (expiresAt > Date.now()) {
          scheduleExpiryCheck();
          return;
        }
        setHasSubscription(false);
        setSubscriptionPlan("free");
        void refreshBalance();
      }, delay);
    };

    scheduleExpiryCheck();
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [hasSubscription, refreshBalance, subscriptionEnd]);

  const checkBalance = useCallback(
    (operationType: string): boolean => {
      const cost = costs[operationType];
      if (!cost || balance === null) return false;
      return balance >= cost;
    },
    [balance, costs],
  );

  return {
    balance,
    costs,
    loading,
    error,
    refreshBalance,
    refreshBalanceIfStale,
    checkBalance,
    hasSubscription,
    subscriptionEnd,
    subscriptionPlan,
  };
}
