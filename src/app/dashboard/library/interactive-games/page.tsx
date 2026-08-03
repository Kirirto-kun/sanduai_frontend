"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLanguage } from "../../../../i18n/LanguageContext";
import { WORDWALL_SIMULATIONS, WordwallSubject } from "../../../../lib/wordwall";

export default function InteractiveGamesPage() {
  const t = useTranslations();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<WordwallSubject | "all">("all");

  const categories: { key: WordwallSubject | "all"; label: string }[] = [
    { key: "all", label: t.interactiveGames.categories.all },
    { key: "literacy", label: t.interactiveGames.categories.literacy },
    { key: "math", label: t.interactiveGames.categories.math },
    { key: "logic", label: t.interactiveGames.categories.logic },
    { key: "natural_science", label: t.interactiveGames.categories.natural_science },
    { key: "culture", label: t.interactiveGames.categories.culture },
    { key: "biology", label: t.interactiveGames.categories.biology },
    { key: "social_studies", label: t.interactiveGames.categories.social_studies },
    { key: "art", label: t.interactiveGames.categories.art },
    { key: "general", label: t.interactiveGames.categories.general },
    { key: "other", label: t.interactiveGames.categories.other },
  ];

  const filteredGames =
    activeTab === "all"
      ? WORDWALL_SIMULATIONS
      : WORDWALL_SIMULATIONS.filter((game) => game.subject === activeTab);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fff7ed,_#fdfbf7_40%,_#f5e6d3_80%)]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {t.interactiveGames.title}
          </h1>
          <p className="text-slate-600">{t.interactiveGames.subtitle}</p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveTab(cat.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === cat.key
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30"
                  : "bg-white text-slate-600 hover:bg-slate-50 ring-1 ring-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              className="glass-card rounded-3xl border border-white/60 overflow-hidden shadow-md transition-transform hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="aspect-video relative bg-slate-100">
                {game.thumbnail ? (
                  <Image
                    src={game.thumbnail}
                    alt={game.title[language]}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    No Image
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 bg-white/90 backdrop-blur text-xs font-semibold rounded-lg text-slate-700 uppercase tracking-wide shadow-sm">
                    {t.interactiveGames.categories[game.subject]}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-slate-900 mb-4 line-clamp-2">
                  {game.title[language]}
                </h3>
                <Link
                  href={`/dashboard/library/interactive-games/${game.id}`}
                  className="flex items-center justify-center w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  {t.interactiveGames.open}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredGames.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No games found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
