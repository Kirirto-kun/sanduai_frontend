"use client";

import { useTranslations } from "../../../i18n/LanguageContext";

export function FeaturesSection() {
  const t = useTranslations();
  const { title, subtitle, features } = t.featuresSection;

  return (
    <section className="pb-16 pt-4">
      <div className="section-container space-y-8">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
            {subtitle}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group flex flex-col justify-between rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-[color:var(--primary)]/40"
            >
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-xs leading-relaxed text-slate-600">
                  {feature.description}
                </p>
              </div>
              <div className="mt-4 h-1 w-10 rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] opacity-70 group-hover:opacity-100" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


