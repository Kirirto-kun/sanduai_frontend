"use client";

import Link from "next/link";
import { useTranslations } from "../../../i18n/LanguageContext";

export function FooterSection() {
  const t = useTranslations();

  return (
    <footer className="border-t border-slate-200/70 bg-white/90 pb-8 pt-10">
      <div className="section-container">
        <div className="flex flex-col justify-between gap-2 text-xs text-slate-500 sm:flex-row sm:items-center">
          <span>{t.footer.rights}</span>
          <Link
            href="/terms-of-service"
            className="font-medium text-[color:var(--primary)] hover:underline"
          >
            {t.footer.termsLink}
          </Link>
        </div>
      </div>
    </footer>
  );
}








