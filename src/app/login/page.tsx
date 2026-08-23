"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { AuthLanguageSwitch } from "@/components/AuthLanguageSwitch";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { authCopy, authErrorMessage, isValidEmail, normalizeEmail } from "@/lib/auth-forms";

const fieldClassName =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[color:var(--primary)] focus:ring-2 focus:ring-orange-200";

export default function LoginPage() {
  const { isAuthenticated, login, loading } = useAuth();
  const { language } = useLanguage();
  const copy = authCopy(language);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, loading, router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      setError(copy.validation.email);
      return;
    }
    if (!password) {
      setError(copy.validation.required);
      return;
    }

    try {
      await login({ email: normalizedEmail, password });
      router.replace("/dashboard");
    } catch (loginError) {
      setError(authErrorMessage(loginError, language, "login"));
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
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-semibold text-slate-900">{copy.login.title}</h1>
              <p className="text-sm leading-6 text-slate-600">{copy.login.subtitle}</p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
              <div className="space-y-2">
                <label htmlFor="login-email" className="block text-xs font-medium text-slate-700">
                  {copy.common.email}
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={fieldClassName}
                  placeholder="teacher@example.kz"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="login-password" className="block text-xs font-medium text-slate-700">
                    {copy.common.password}
                  </label>
                  <Link
                    href="/forgot-password"
                    className="inline-flex min-h-11 items-center text-xs font-semibold text-[color:var(--primary)] underline-offset-2 hover:underline"
                  >
                    {copy.login.forgot}
                  </Link>
                </div>
                <input
                  id="login-password"
                  name="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={fieldClassName}
                  required
                />
              </div>

              {error && <p className="text-sm text-red-700" role="alert">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="flex min-h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? copy.common.loading : copy.login.submit}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-600">
              <Link href="/register" className="inline-flex min-h-11 items-center font-semibold text-[color:var(--primary)]">
                {copy.login.register}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
