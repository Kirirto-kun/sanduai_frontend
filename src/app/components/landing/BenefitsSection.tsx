"use client";

import { useTranslations } from "../../../i18n/LanguageContext";

export function BenefitsSection() {
  const t = useTranslations();
  const { title, subtitle, items } = t.benefitsSection;

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
        <ul className="space-y-3 rounded-2xl bg-[color:var(--beige)]/70 p-5 ring-1 ring-amber-100">
          {items.map((item) => (
            <li key={item} className="flex gap-3 text-xs text-slate-800">
              <span className="mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-emerald-600 shadow-sm">
                ✓
              </span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}






