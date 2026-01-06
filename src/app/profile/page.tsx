"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslations } from "../../i18n/LanguageContext";
import { useTokens } from "../../hooks/useTokens";
import { formatSubscriptionDate } from "../../lib/utils";

export default function ProfilePage() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const t = useTranslations();
  const router = useRouter();
  const { balance, hasSubscription, subscriptionEnd, subscriptionPlan } = useTokens();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading, router]);

  const name = user?.fullName || "—";
  const email = user?.email || "—";
  const phone = user?.phone || "—";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fff7ed,_#fdfbf7_40%,_#f5e6d3_80%)]">
      <div className="section-container py-12 sm:py-16">
        <div className="mx-auto max-w-xl">
          <div className="glass-card rounded-3xl border border-white/60 px-6 py-8 shadow-xl sm:px-8">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-slate-900">
                {t.auth.profile.title}
              </h1>
              <p className="text-sm text-slate-600">{t.auth.profile.subtitle}</p>
            </div>

            <div className="mt-6 space-y-4">
              <InfoRow label={t.auth.profile.name} value={name} />
              <InfoRow label={t.auth.profile.email} value={email} />
              <InfoRow label={t.auth.profile.phone} value={phone} />
              <InfoRow
                label={t.tokens?.balance || "Баланс токенов"}
                value={balance !== null ? balance.toString() : "—"}
              />
              
              {/* Subscription Info */}
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">
                    {t.tokens?.subscriptionStatus || "Статус подписки"}:
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      hasSubscription
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {hasSubscription
                      ? t.tokens?.subscriptionActive || "Активна"
                      : t.tokens?.subscriptionInactive || "Неактивна"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">
                    {t.tokens?.subscriptionPlan || "Тип подписки"}:
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {subscriptionPlan === "premium"
                      ? t.tokens?.premium || "Премиум"
                      : t.tokens?.free || "Бесплатная"}
                  </span>
                </div>
                {subscriptionEnd && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">
                      {t.tokens?.subscriptionEnd || "Окончание подписки"}:
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatSubscriptionDate(subscriptionEnd)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="mt-8 w-full rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800"
            >
              {t.auth.profile.logout}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 text-sm shadow-sm ring-1 ring-slate-200">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}






