"use client";

import { useTranslations } from "../../../i18n/LanguageContext";

export function MediaSection() {
  const t = useTranslations();
  const { title, subtitle, items } = t.mediaSection;

  return (
    <section className="pb-16 pt-4">
      <div className="section-container section-grid items-start">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
            {subtitle}
          </p>
        </div>
        <div className="space-y-3 rounded-2xl bg-slate-900 p-5 text-slate-50">
          {items.map((item) => (
            <article
              key={item.title}
              className="flex items-start gap-3 rounded-xl bg-white/5 p-3"
            >
              <div className="mt-0.5 h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-br from-orange-400 to-emerald-400" />
              <div>
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-200/80">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


