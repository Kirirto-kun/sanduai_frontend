"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "../../../../i18n/LanguageContext";

export default function LibraryMaterialsPage() {
  const t = useTranslations();
  const { title, subtitle, items } = t.materialsSection;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Link
            key={item.title}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card rounded-3xl border border-white/60 p-4 shadow-md transition hover:shadow-lg hover:-translate-y-1"
          >
            <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-xl bg-slate-100">
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover transition-transform hover:scale-105"
                unoptimized
              />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {item.title}
            </h3>
            <p className="text-sm text-slate-600">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
