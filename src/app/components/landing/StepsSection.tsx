"use client";

import { useTranslations } from "../../../i18n/LanguageContext";

export function StepsSection() {
  const t = useTranslations();
  const { title, subtitle, steps } = t.stepsSection;

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
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.title}
              className="flex h-full flex-col rounded-2xl bg-white/95 p-4 shadow-sm ring-1 ring-slate-200"
            >
              <h3 className="text-sm font-semibold text-slate-900">
                {step.title}
              </h3>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600">
                {step.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[color:var(--secondary)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


