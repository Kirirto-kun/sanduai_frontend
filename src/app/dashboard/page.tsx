"use client";

import Link from "next/link";
import { useTranslations } from "../../i18n/LanguageContext";

const cards: { href: string; key: keyof typeof labels }[] = [
  { href: "/dashboard/kmzh", key: "kmzh" },
  { href: "/dashboard/ai-docs", key: "aiDocs" },
  { href: "/dashboard/library", key: "library" },
  { href: "/dashboard/media", key: "media" },
  { href: "/dashboard/profile", key: "profile" },
];

const labels = {
  kmzh: "kmzh",
  aiDocs: "aiDocs",
  library: "library",
  media: "media",
  profile: "profile",
} as const;

export default function DashboardHome() {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
        <h2 className="text-xl font-semibold text-slate-900">
          {t.dashboard.home.title}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {t.dashboard.header.subtitle}
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t.dashboard.home.quickLinks}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-2xl bg-white/90 p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-[color:var(--primary)]/50"
            >
              <h4 className="text-sm font-semibold text-slate-900">
                {t.dashboard.menu[card.key]}
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                {t.dashboard.home.cards[card.key]}
              </p>
              <span className="mt-3 inline-flex items-center gap-2 text-[11px] font-semibold text-[color:var(--primary)]">
                {t.dashboard.menu[card.key]} →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}




