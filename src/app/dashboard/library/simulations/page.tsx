"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLanguage } from "../../../../i18n/LanguageContext";
import { PHET_SIMULATIONS, PhetSubject } from "../../../../lib/phet-simulations";

export default function SimulationsPage() {
  const t = useTranslations();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<PhetSubject | "all">("all");

  const categories: { key: PhetSubject | "all"; label: string }[] = [
    { key: "all", label: t.simulations.categories.all },
    { key: "physics", label: t.simulations.categories.physics },
    { key: "chemistry", label: t.simulations.categories.chemistry },
    { key: "biology", label: t.simulations.categories.biology },
    { key: "math", label: t.simulations.categories.math },
  ];

  const filteredSimulations =
    activeTab === "all"
      ? PHET_SIMULATIONS
      : PHET_SIMULATIONS.filter((sim) => sim.subject === activeTab);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fff7ed,_#fdfbf7_40%,_#f5e6d3_80%)]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {t.simulations.title}
          </h1>
          <p className="text-slate-600">{t.simulations.subtitle}</p>
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

        {/* Simulations Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSimulations.map((sim) => (
            <div
              key={sim.id}
              className="glass-card rounded-3xl border border-white/60 overflow-hidden shadow-md transition-transform hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="aspect-video relative bg-slate-100">
                {sim.thumbnail ? (
                  <Image
                    src={sim.thumbnail}
                    alt={sim.title[language]}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      // Fallback or hide? For now, just let it be or show a placeholder logic if we had one.
                      // Setting src to a placeholder is tricky in SSR.
                      // We'll rely on unoptimized preventing the server crash.
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    No Image
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 bg-white/90 backdrop-blur text-xs font-semibold rounded-lg text-slate-700 uppercase tracking-wide shadow-sm">
                    {t.simulations.categories[sim.subject]}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-slate-900 mb-4 line-clamp-2">
                  {sim.title[language]}
                </h3>
                <Link
                  href={`/dashboard/library/simulations/${sim.id}`}
                  className="flex items-center justify-center w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  {t.simulations.open}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredSimulations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No simulations found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}

