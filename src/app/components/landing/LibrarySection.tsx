"use client";

import { useTranslations } from "../../../i18n/LanguageContext";

export function LibrarySection() {
  const t = useTranslations();
  const { title, subtitle, items } = t.librarySection;

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
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl bg-[color:var(--accent)]/70 p-4 ring-1 ring-amber-100"
            >
              <h3 className="text-sm font-semibold text-slate-900">
                {item.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-700">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}








