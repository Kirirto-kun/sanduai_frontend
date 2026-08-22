"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { AuthLanguageSwitch } from "@/components/AuthLanguageSwitch";
import { useLanguage } from "@/i18n/LanguageContext";
import { requestPasswordReset } from "@/lib/api";
import { authCopy, authErrorMessage, isValidEmail, normalizeEmail } from "@/lib/auth-forms";

export default function ForgotPasswordPage() {
  const { language } = useLanguage();
  const copy = authCopy(language);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      setError(copy.validation.email);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await requestPasswordReset(normalizedEmail);
      setSubmitted(true);
    } catch (requestError) {
      setError(authErrorMessage(requestError, language, "password-reset-request"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fff7ed,_#fdfbf7_40%,_#f5e6d3_80%)]">
      <div className="section-container py-12 sm:py-16">
        <div className="mx-auto max-w-md">
          <div className="glass-card rounded-3xl border border-white/60 px-6 py-8 shadow-xl sm:px-8">
            <div className="mb-5 flex justify-end">
              <AuthLanguageSwitch />
            </div>
            {submitted ? (
              <div className="text-center" role="status" aria-live="polite">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl" aria-hidden="true">
                  ✓
                </div>
                <h1 className="mt-4 text-2xl font-semibold text-slate-900">{copy.forgot.sentTitle}</h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">{copy.forgot.sentMessage}</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 text-center">
                  <h1 className="text-2xl font-semibold text-slate-900">{copy.forgot.title}</h1>
                  <p className="text-sm leading-6 text-slate-600">{copy.forgot.subtitle}</p>
                </div>

                <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
                  <div className="space-y-2">
                    <label htmlFor="reset-email" className="block text-xs font-medium text-slate-700">
                      {copy.common.email}
                    </label>
                    <input
                      id="reset-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[color:var(--primary)] focus:ring-2 focus:ring-orange-200"
                      placeholder="teacher@example.kz"
                      required
                      autoFocus
                    />
                  </div>

                  {error && <p className="text-sm text-red-700" role="alert">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex min-h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? copy.common.loading : copy.forgot.submit}
                  </button>
                </form>
              </>
            )}

            <div className="mt-6 text-center text-xs text-slate-600">
              <Link href="/login" className="inline-flex min-h-11 items-center font-semibold text-[color:var(--primary)]">
                {copy.common.backToLogin}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
