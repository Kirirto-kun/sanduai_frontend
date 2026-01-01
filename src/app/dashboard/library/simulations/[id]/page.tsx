"use client";

import { use, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLanguage } from "../../../../../i18n/LanguageContext";
import { PHET_SIMULATIONS, PhetSimulation } from "../../../../../lib/phet-simulations";

export default function SimulationViewPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations();
  const { language } = useLanguage();
  const router = useRouter();
  const resolvedParams = use(params);
  const [simulation, setSimulation] = useState<PhetSimulation | null>(null);
  const iframeContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const found = PHET_SIMULATIONS.find((s) => s.id === resolvedParams.id);
    if (found) {
      setSimulation(found);
    } else {
      router.push("/dashboard/library/simulations");
    }
  }, [resolvedParams.id, router]);

  const toggleFullscreen = () => {
    if (!iframeContainerRef.current) return;

    if (!document.fullscreenElement) {
      iframeContainerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  if (!simulation) {
    return null; // Or a loader
  }

  // Construct URL based on current language
  // Replaces {{lang}} with "ru" or "kk".
  // Note: PhET typically uses "en" as fallback if a specific lang code isn't found, 
  // but here we trust our config. If "kk" is missing on PhET side, it might 404 
  // or fallback automatically depending on their server.
  // Ideally, we'd check if URL exists, but for now we assume config is correct.
  // Some PhET sims map 'kz' or 'kk', usually 'kk' for Kazakh.
  const langCode = language === "kk" ? "kk" : "ru";
  const simulationUrl = simulation.urlPattern.replace("{{lang}}", langCode);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fff7ed,_#fdfbf7_40%,_#f5e6d3_80%)] flex flex-col">
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/library/simulations"
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              ← {t.simulations.back}
            </Link>
            <h1 className="text-xl font-bold text-slate-900">
              {simulation.title[language]}
            </h1>
          </div>
          <div className="flex items-center gap-3">
             <span className="px-3 py-1 bg-white border border-slate-200 text-xs font-semibold rounded-full text-slate-600 uppercase tracking-wide">
              {t.simulations.categories[simulation.subject]}
            </span>
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
              {t.simulations.fullscreen}
            </button>
          </div>
        </div>

        <div 
          ref={iframeContainerRef}
          className="glass-card overflow-hidden rounded-3xl border border-white/60 shadow-xl bg-white"
        >
          <div className="w-full h-[calc(100vh-200px)] min-h-[600px] relative bg-slate-100">
            <iframe
              src={simulationUrl}
              className="absolute inset-0 w-full h-full border-0"
              allowFullScreen
              title={simulation.title[language]}
            />
          </div>
        </div>
        
        <div className="mt-4 text-center text-xs text-slate-500">
          Simulation by PhET Interactive Simulations, University of Colorado Boulder
        </div>
      </div>
    </div>
  );
}
