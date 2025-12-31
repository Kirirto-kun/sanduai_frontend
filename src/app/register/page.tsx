"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslations } from "../../i18n/LanguageContext";

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const t = useTranslations();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password || !fullName) {
      setError(t.auth.errors.required);
      return;
    }
    if (!email.includes("@")) {
      setError(t.auth.errors.invalidEmail);
      return;
    }
    if (password.length < 6) {
      setError(t.auth.errors.shortPassword);
      return;
    }
    try {
      await register({
        phone: phone || undefined,
        email,
        password,
        full_name: fullName,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.errors.generic);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fff7ed,_#fdfbf7_40%,_#f5e6d3_80%)]">
      <div className="section-container py-12 sm:py-16">
        <div className="mx-auto max-w-md">
          <div className="glass-card rounded-3xl border border-white/60 px-6 py-8 shadow-xl sm:px-8">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-semibold text-slate-900">
                {t.auth.register.title}
              </h1>
              <p className="text-sm text-slate-600">{t.auth.register.subtitle}</p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  {t.auth.register.phoneLabel}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  placeholder="+7701..."
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  {t.auth.register.emailLabel}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  {t.auth.register.fullNameLabel}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  {t.auth.register.passwordLabel}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  placeholder="••••••"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:shadow-xl hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? t.auth.loading : t.auth.register.submit}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-600">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="font-semibold text-[color:var(--primary)] hover:text-orange-600"
              >
                {t.auth.register.switchText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


