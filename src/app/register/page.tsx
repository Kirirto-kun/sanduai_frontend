"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { AuthLanguageSwitch } from "@/components/AuthLanguageSwitch";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { requestRegistrationCode } from "@/lib/api";
import {
  authCopy,
  authErrorMessage,
  isValidEmail,
  isValidFullName,
  isValidOptionalPhone,
  normalizeEmail,
  normalizeFullName,
  normalizePhone,
  passwordValidationKey,
} from "@/lib/auth-forms";

type RegisterStep = "email" | "details";

const fieldClassName =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[color:var(--primary)] focus:ring-2 focus:ring-orange-200";

export default function RegisterPage() {
  const { register, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const copy = authCopy(language);
  const router = useRouter();

  const [step, setStep] = useState<RegisterStep>("email");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const sendCode = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      setError(copy.validation.email);
      return false;
    }

    setError(null);
    setIsSendingCode(true);
    try {
      const result = await requestRegistrationCode(normalizedEmail);
      setEmail(normalizedEmail);
      setVerificationCode("");
      setResendSeconds(Math.max(0, result.resend_after_seconds));
      setStep("details");
      return true;
    } catch (requestError) {
      setError(authErrorMessage(requestError, language, "registration-code"));
      return false;
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleRequestCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendCode();
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!/^\d{6}$/.test(verificationCode)) {
      setError(copy.validation.code);
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
    if (!isValidFullName(fullName)) {
      setError(copy.validation.fullName);
      return;
    }
    if (!isValidOptionalPhone(phone)) {
      setError(copy.validation.phone);
      return;
    }

    try {
      const normalizedPhone = normalizePhone(phone);
      await register({
        email: normalizeEmail(email),
        password,
        verification_code: verificationCode,
        full_name: normalizeFullName(fullName),
        ...(normalizedPhone ? { phone: normalizedPhone } : {}),
      });
      router.replace("/dashboard");
    } catch (registerError) {
      setError(authErrorMessage(registerError, language, "register"));
    }
  };

  const changeEmail = () => {
    setStep("email");
    setVerificationCode("");
    setError(null);
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
              <h1 className="text-2xl font-semibold text-slate-900">{copy.register.title}</h1>
              <p className="text-sm leading-6 text-slate-600">{copy.register.subtitle}</p>
              <p className="text-xs font-semibold text-[color:var(--primary)]">
                {step === "email" ? copy.register.stepEmail : copy.register.stepDetails}
              </p>
            </div>

            {step === "email" ? (
              <form className="mt-6 space-y-4" onSubmit={handleRequestCode} noValidate>
                <div className="space-y-2">
                  <label htmlFor="registration-email" className="block text-xs font-medium text-slate-700">
                    {copy.common.email}
                  </label>
                  <input
                    id="registration-email"
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

                {error && <p className="text-sm text-red-700" role="alert">{error}</p>}

                <button
                  type="submit"
                  disabled={isSendingCode}
                  className="flex min-h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSendingCode ? copy.common.loading : copy.register.sendCode}
                </button>
              </form>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleRegister} noValidate>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="break-all text-sm font-semibold text-emerald-900">{email}</p>
                  <p className="mt-1 text-xs leading-5 text-emerald-800">
                    {copy.register.codeHint.replace("{email}", email)}
                  </p>
                  <button
                    type="button"
                    onClick={changeEmail}
                    className="mt-2 min-h-11 text-xs font-semibold text-emerald-900 underline underline-offset-2"
                  >
                    {copy.register.changeEmail}
                  </button>
                </div>

                <div className="space-y-2">
                  <label htmlFor="registration-code" className="block text-xs font-medium text-slate-700">
                    {copy.register.code}
                  </label>
                  <input
                    id="registration-code"
                    name="one-time-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    className={`${fieldClassName} text-center font-mono text-lg tracking-[0.35em]`}
                    placeholder="000000"
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="registration-name" className="block text-xs font-medium text-slate-700">
                    {copy.common.fullName}
                  </label>
                  <input
                    id="registration-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    maxLength={100}
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className={fieldClassName}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="registration-phone" className="block text-xs font-medium text-slate-700">
                    {copy.common.phone}
                  </label>
                  <input
                    id="registration-phone"
                    name="tel"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className={fieldClassName}
                    placeholder="+77011234567"
                  />
                  <p className="text-xs leading-5 text-slate-500">{copy.register.phoneHint}</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="registration-password" className="block text-xs font-medium text-slate-700">
                    {copy.common.password}
                  </label>
                  <input
                    id="registration-password"
                    name="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={fieldClassName}
                    required
                  />
                  <p className="text-xs text-slate-500">{copy.register.passwordHint}</p>
                </div>

                {error && <p className="text-sm text-red-700" role="alert">{error}</p>}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="flex min-h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {authLoading ? copy.common.loading : copy.register.submit}
                </button>

                <button
                  type="button"
                  onClick={() => void sendCode()}
                  disabled={isSendingCode || resendSeconds > 0}
                  className="min-h-11 w-full text-sm font-semibold text-[color:var(--primary)] disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {resendSeconds > 0
                    ? copy.register.resendIn.replace("{seconds}", String(resendSeconds))
                    : copy.register.resend}
                </button>

                <p className="text-xs leading-5 text-slate-600">
                  {copy.register.termsPrefix}{" "}
                  <Link
                    href="/terms-of-service"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[color:var(--primary)] underline underline-offset-2"
                  >
                    {copy.register.termsLink}
                  </Link>
                  .
                </p>
              </form>
            )}

            <div className="mt-6 text-center text-xs text-slate-600">
              <Link href="/login" className="inline-flex min-h-11 items-center font-semibold text-[color:var(--primary)]">
                {copy.register.signIn}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
