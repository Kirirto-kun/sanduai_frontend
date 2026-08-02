"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "../../../i18n/LanguageContext";
import { SOON_LABELS } from "../../../i18n/navigation";

const TEXT = {
  ru: {
    badge: "Скоро",
    fallback: "Эта функция",
    title: "скоро появится",
    description:
      "Функция уже в разработке. Как только она будет готова, вы увидите её в этом же разделе меню — отдельно сообщать не нужно.",
    availableNow: "А пока доступно:",
    back: "Вернуться на главную",
    links: [
      { href: "/dashboard/ai/kornekilik", label: "Наглядные пособия", icon: "🖼" },
      { href: "/dashboard/ai/infographics", label: "Инфографика", icon: "📊" },
      { href: "/dashboard/ai/comics", label: "Комиксы", icon: "💥" },
      { href: "/dashboard/ai/kmzh", label: "ҚМЖ", icon: "📝" },
    ],
  },
  kk: {
    badge: "Жақында",
    fallback: "Бұл функция",
    title: "жақында қосылады",
    description:
      "Функция әзірленуде. Дайын болған бойда осы мәзір бөлімінде пайда болады — бөлек хабарлаудың қажеті жоқ.",
    availableNow: "Ал әзірге қолжетімді:",
    back: "Басты бетке оралу",
    links: [
      { href: "/dashboard/ai/kornekilik", label: "Көрнекілік жасау", icon: "🖼" },
      { href: "/dashboard/ai/infographics", label: "Инфографика жасау", icon: "📊" },
      { href: "/dashboard/ai/comics", label: "Комикс жасау", icon: "💥" },
      { href: "/dashboard/ai/kmzh", label: "ҚМЖ жазу", icon: "📝" },
    ],
  },
} as const;

function SoonContent() {
  const { language } = useLanguage();
  const t = TEXT[language];
  const params = useSearchParams();

  const featureKey = params.get("f") ?? "";
  const featureName = SOON_LABELS[featureKey]?.[language] ?? t.fallback;

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-14 text-center">
      <span className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--secondary)] text-4xl shadow-lg">
        🚧
      </span>

      <span className="mb-3 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700">
        {t.badge}
      </span>

      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
        «{featureName}» {t.title}
      </h1>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
        {t.description}
      </p>

      <div className="mt-9 w-full">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
          {t.availableNow}
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {t.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/90 px-4 py-3.5 text-left shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-xl">{link.icon}</span>
              <span className="text-sm font-semibold text-slate-700">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <Link
        href="/dashboard"
        className="mt-8 text-sm font-semibold text-[color:var(--primary)] hover:underline"
      >
        ← {t.back}
      </Link>
    </div>
  );
}

export default function SoonPage() {
  // useSearchParams требует Suspense в Next.js App Router.
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-slate-400">…</div>}>
      <SoonContent />
    </Suspense>
  );
}
