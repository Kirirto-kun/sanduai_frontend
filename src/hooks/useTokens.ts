"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getTokenBalance,
  getTokenCosts,
  type TokenBalance,
  type TokenCosts,
  getToken,
} from "../lib/api";
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
} from "../lib/tokenCache";

export function useTokens(options: { requireFreshSubscription?: boolean } = {}) {
  const requireFreshSubscription = options.requireFreshSubscription === true;
  const [balance, setBalance] = useState<number | null>(null);
  const [costs, setCosts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<"free" | "premium" | null>(null);

  const fetchBalance = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setBalance(null);
      setHasSubscription(null);
      setSubscriptionEnd(null);
      setSubscriptionPlan(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    // Сначала загружаем из кэша для мгновенного отображения
    const cachedBalance = getCachedBalance();
    if (cachedBalance) {
      setBalance(cachedBalance.balance);
      if (!requireFreshSubscription) {
        setHasSubscription(cachedBalance.has_subscription);
        setSubscriptionEnd(cachedBalance.subscription_end);
        setSubscriptionPlan(cachedBalance.subscription_plan);
      } else {
        setHasSubscription(null);
        setSubscriptionEnd(null);
        setSubscriptionPlan(null);
      }
      
      // Если кэш актуален (не старше TTL), не делаем запрос к серверу
      if (isBalanceCacheValid() && !requireFreshSubscription) {
        setLoading(false);
        return;
      }
    }

    // Если кэша нет или он устарел, загружаем с сервера
    // Используем глобальный промис, чтобы избежать множественных одновременных запросов
    try {
      setError(null);
      const balanceData = await getOrCreateBalanceFetchPromise(async () => {
        const data: TokenBalance = await getTokenBalance();
        return {
          balance: data.balance,
          has_subscription: data.has_subscription,
          subscription_end: data.subscription_end,
          subscription_plan: data.subscription_plan,
          timestamp: Date.now(),
        };
      });

      setBalance(balanceData.balance);
      setHasSubscription(balanceData.has_subscription);
      setSubscriptionEnd(balanceData.subscription_end);
      setSubscriptionPlan(balanceData.subscription_plan);
      
      // Сохраняем в кэш для следующего раза
      setCachedBalance({
        balance: balanceData.balance,
        has_subscription: balanceData.has_subscription,
        subscription_end: balanceData.subscription_end,
        subscription_plan: balanceData.subscription_plan,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch balance");
      // Если fetch не удался, используем кэш (если он есть)
      if (cachedBalance) {
        setBalance(cachedBalance.balance);
        if (!requireFreshSubscription) {
          setHasSubscription(cachedBalance.has_subscription);
          setSubscriptionEnd(cachedBalance.subscription_end);
          setSubscriptionPlan(cachedBalance.subscription_plan);
        } else {
          setHasSubscription(null);
          setSubscriptionEnd(null);
          setSubscriptionPlan(null);
        }
      } else {
        setBalance(null);
        setHasSubscription(null);
        setSubscriptionEnd(null);
        setSubscriptionPlan(null);
      }
    } finally {
      setLoading(false);
    }
  }, [requireFreshSubscription]);

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
    const token = getToken();
    if (token) {
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
    fetchBalance();
  }, [fetchBalance]);

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
    checkBalance,
    hasSubscription,
    subscriptionEnd,
    subscriptionPlan,
  };
}
