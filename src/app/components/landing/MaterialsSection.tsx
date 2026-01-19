"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "../../../i18n/LanguageContext";

export function MaterialsSection() {
  const t = useTranslations();
  const { title, subtitle, items } = t.materialsSection;

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.title}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg hover:ring-[color:var(--primary)]/50"
            >
              <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-xl bg-slate-100">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  unoptimized
                />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">
                {item.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
