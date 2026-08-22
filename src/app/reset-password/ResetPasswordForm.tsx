"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { useLanguage } from "@/i18n/LanguageContext";
import { clearToken, clearUser, confirmPasswordReset } from "@/lib/api";
import { authCopy, authErrorMessage, passwordValidationKey } from "@/lib/auth-forms";
import { clearCachedBalance } from "@/lib/tokenCache";

export function ResetPasswordForm({ token }: { token: string }) {
  const { language } = useLanguage();
  const copy = authCopy(language);
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError(copy.reset.missingToken);
      return;
    }
    const passwordIssue = passwordValidationKey(password);
    if (passwordIssue === "short") {
      setError(copy.validation.password);
      return;
    }
    if (passwordIssue === "long") {
      setError(copy.validation.passwordTooLong);
      return;
    }
    if (password !== passwordRepeat) {
      setError(copy.validation.passwordsMismatch);
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(token, password);
      clearToken();
      clearUser();
      clearCachedBalance();
      setComplete(true);
      setPassword("");
      setPasswordRepeat("");
    } catch (confirmError) {
      setError(authErrorMessage(confirmError, language, "password-reset-confirm"));
    } finally {
      setLoading(false);
    }
  };

  if (complete) {
    return (
      <div className="text-center" role="status" aria-live="polite">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl" aria-hidden="true">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">{copy.reset.successTitle}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{copy.reset.successMessage}</p>
        <Link
          href="/login"
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
        >
          {copy.reset.login}
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">{copy.reset.title}</h1>
        <p className="text-sm leading-6 text-slate-600">{copy.reset.subtitle}</p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <label htmlFor="new-password" className="block text-xs font-medium text-slate-700">
            {copy.common.newPassword}
          </label>
          <input
            id="new-password"
            name="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[color:var(--primary)] focus:ring-2 focus:ring-orange-200"
            required
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="repeat-password" className="block text-xs font-medium text-slate-700">
            {copy.common.repeatPassword}
          </label>
          <input
            id="repeat-password"
            name="new-password-repeat"
            type="password"
            autoComplete="new-password"
            value={passwordRepeat}
            onChange={(event) => setPasswordRepeat(event.target.value)}
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[color:var(--primary)] focus:ring-2 focus:ring-orange-200"
            required
          />
        </div>

        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}

        <button
          type="submit"
          disabled={loading || !token}
          className="flex min-h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? copy.common.loading : copy.reset.submit}
        </button>
      </form>

      {!token && <p className="mt-4 text-sm text-red-700" role="alert">{copy.reset.missingToken}</p>}

      <div className="mt-6 text-center text-xs text-slate-600">
        <Link href="/forgot-password" className="inline-flex min-h-11 items-center font-semibold text-[color:var(--primary)]">
          {copy.forgot.title}
        </Link>
      </div>
    </>
  );
}
