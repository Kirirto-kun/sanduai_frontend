"use client";

import { useTokens } from "../hooks/useTokens";
import { useTranslations } from "../i18n/LanguageContext";

type TokenBalanceProps = {
  showCost?: string;
  compact?: boolean;
};

export function TokenBalance({ showCost, compact = false }: TokenBalanceProps) {
  const { balance, costs, loading, hasSubscription, subscriptionPlan } = useTokens();
  const t = useTranslations();
  const isColdLoading = loading && balance === null;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {isColdLoading ? (
          <div className="h-5 w-16 animate-pulse rounded-full bg-slate-200"></div>
        ) : (
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs">
              <span className="hidden text-[color:var(--primary)] sm:inline">
                {t.tokens?.balance || "Баланс"}
              </span>
              <span className="font-bold">
                {balance !== null ? balance : "—"}
              </span>
            </div>
            {hasSubscription && subscriptionPlan === "premium" && (
              <span className="rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm sm:px-2 sm:text-[10px]">
                {t.tokens?.premium || "PREMIUM"}
              </span>
            )}
          </div>
        )}
        {showCost && costs[showCost] && (
          <div className="text-xs text-slate-500">
            {t.tokens?.cost || "Стоимость"}: {costs[showCost]}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl border border-white/60 px-4 py-3 shadow-sm">
      {isColdLoading ? (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--primary)] border-r-transparent"></div>
          <span className="text-sm text-slate-600">
            {t.tokens?.loading || "Загрузка..."}
          </span>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">
              {t.tokens?.balance || "Баланс токенов"}
            </span>
            <span className="text-lg font-bold text-[color:var(--primary)]">
              {balance !== null ? balance : "—"}
            </span>
          </div>
          {showCost && costs[showCost] && (
            <div className="flex items-center justify-between border-t border-slate-200/50 pt-1">
              <span className="text-xs text-slate-500">
                {t.tokens?.cost || "Стоимость"}
              </span>
              <span className="text-sm font-semibold text-slate-700">
                {costs[showCost]}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
