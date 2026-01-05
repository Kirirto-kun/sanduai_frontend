"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getTokenBalance,
  getTokenCosts,
  type TokenBalance,
  type TokenCosts,
  getToken,
} from "../lib/api";

export function useTokens() {
  const [balance, setBalance] = useState<number | null>(null);
  const [costs, setCosts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setBalance(null);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data: TokenBalance = await getTokenBalance();
      setBalance(data.balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch balance");
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCosts = useCallback(async () => {
    try {
      const data: TokenCosts = await getTokenCosts();
      setCosts(data.costs);
    } catch (err) {
      // Costs are optional, fail silently
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
    }
  }, [fetchBalance, fetchCosts]);

  const refreshBalance = useCallback(() => {
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
  };
}

