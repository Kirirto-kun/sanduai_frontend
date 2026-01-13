"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "../i18n/LanguageContext";

const COOKIE_CONSENT_KEY = "sanduai_cookie_consent";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const t = useTranslations();

  useEffect(() => {
    // Check if user has already accepted cookies
    if (typeof window !== "undefined") {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!consent) {
        // Show banner after a small delay for better UX
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleAccept = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-slate-200 shadow-lg">
      <div className="section-container py-4">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-700 flex-1">
            {t.cookieBanner.message}{" "}
            <Link
              href="/terms-of-service"
              className="font-semibold text-[color:var(--primary)] hover:underline"
            >
              {t.cookieBanner.learnMore}
            </Link>
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAccept}
              className="rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-6 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
            >
              {t.cookieBanner.accept}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
