"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslations } from "../../i18n/LanguageContext";
import {
  initializeRecaptcha,
  sendVerificationCode,
  verifyCode,
  resetRecaptcha,
  cleanupRecaptcha,
  type ConfirmationResult,
} from "../../lib/phoneVerification";

type RegisterStep = "phone" | "code" | "register";

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const t = useTranslations();
  const router = useRouter();

  const [step, setStep] = useState<RegisterStep>("phone");
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState<string>("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  // Initialize reCAPTCHA on mount
  useEffect(() => {
    // Wait for DOM to be ready
    if (typeof window === "undefined") return;

    const initRecaptcha = async () => {
      // Add a small delay to ensure DOM is ready
      await new Promise((resolve) => setTimeout(resolve, 200));

      try {
        // For invisible reCAPTCHA, we can use the container ID
        // The container must exist in the DOM
        const container = document.getElementById("recaptcha-container");
        if (!container) {
          throw new Error("reCAPTCHA container not found");
        }

        // Use invisible reCAPTCHA with container ID
        await initializeRecaptcha("recaptcha-container", true, () => {
          // Callback when reCAPTCHA is solved
          console.log("reCAPTCHA solved");
        }, () => {
          // Callback when reCAPTCHA expires
          console.log("reCAPTCHA expired");
          setError("reCAPTCHA истек. Пожалуйста, попробуйте снова.");
        });
      } catch (err: any) {
        console.error("Failed to initialize reCAPTCHA:", err);
        
        let errorMessage = "Ошибка инициализации reCAPTCHA. ";
        if (err.code === "auth/network-request-failed") {
          errorMessage += "Проверьте подключение к интернету. Убедитесь, что домен добавлен в настройках Firebase Authentication (Firebase Console > Authentication > Settings > Authorized domains).";
        } else if (err.message) {
          errorMessage += err.message;
        } else {
          errorMessage += "Попробуйте обновить страницу.";
        }
        
        setError(errorMessage);
      }
    };

    if (step === "phone") {
      initRecaptcha();
    }

    return () => {
      if (step === "phone") {
        cleanupRecaptcha();
      }
    };
  }, [step]);

  // Validate phone number format (international format: +7...)
  const validatePhone = (phoneNumber: string): boolean => {
    // Basic validation: should start with + and contain only digits after +
    const phoneRegex = /^\+[1-9]\d{10,14}$/;
    return phoneRegex.test(phoneNumber);
  };

  // Handle sending verification code
  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone.trim()) {
      setError(t.auth.register.phoneRequired);
      return;
    }

    if (!validatePhone(phone.trim())) {
      setError(t.auth.register.invalidPhoneFormat);
      return;
    }

    setIsSendingCode(true);
    try {
      const result = await sendVerificationCode(phone.trim());
      setConfirmationResult(result);
      setIsCodeSent(true);
      setStep("code");
    } catch (err: any) {
      console.error("Error sending verification code:", err);
      resetRecaptcha();
      
      let errorMessage = t.auth.errors.generic;
      if (err.code === "auth/invalid-phone-number") {
        errorMessage = t.auth.register.invalidPhoneFormat;
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Слишком много запросов. Попробуйте позже.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSendingCode(false);
    }
  };

  // Handle code verification
  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!verificationCode.trim() || verificationCode.trim().length !== 6) {
      setError(t.auth.register.invalidCode);
      return;
    }

    if (!confirmationResult) {
      setError("Ошибка: результат верификации не найден. Пожалуйста, начните заново.");
      return;
    }

    setIsVerifying(true);
    try {
      await verifyCode(confirmationResult, verificationCode.trim());
      setVerifiedPhone(phone);
      setStep("register");
    } catch (err: any) {
      console.error("Error verifying code:", err);
      
      let errorMessage = t.auth.register.invalidCode;
      if (err.code === "auth/invalid-verification-code") {
        errorMessage = t.auth.register.invalidCode;
      } else if (err.code === "auth/code-expired") {
        errorMessage = "Код истек. Пожалуйста, запросите новый код.";
        setIsCodeSent(false);
        setStep("phone");
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle final registration
  const handleRegister = async (e: FormEvent) => {
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
    if (!verifiedPhone) {
      setError("Телефон не верифицирован. Пожалуйста, начните заново.");
      return;
    }

    try {
      await register({
        phone: verifiedPhone,
        email,
        password,
        full_name: fullName,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.errors.generic);
    }
  };

  // Handle resend code
  const handleResendCode = async () => {
    setError(null);
    setVerificationCode("");
    setIsCodeSent(false);
    setStep("phone");
    
    // Re-initialize reCAPTCHA
    try {
      await initializeRecaptcha("send-code-button", true);
    } catch (err) {
      console.error("Failed to re-initialize reCAPTCHA:", err);
    }
  };

  const getStepNumber = (): number => {
    switch (step) {
      case "phone":
        return 1;
      case "code":
        return 2;
      case "register":
        return 3;
      default:
        return 1;
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
              {/* Step indicator */}
              <p className="text-xs text-slate-500">
                {t.auth.register.stepIndicator
                  .replace("{current}", String(getStepNumber()))
                  .replace("{total}", "3")}
              </p>
            </div>

            {/* Step 1: Phone verification */}
            {step === "phone" && (
              <form className="mt-6 space-y-4" onSubmit={handleSendCode}>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700">
                    {t.auth.register.phoneLabel} *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    placeholder="+77012345678"
                    required
                  />
                  <p className="text-xs text-slate-500">
                    {t.auth.register.phoneVerification}
                  </p>
                </div>

                {error && (
                  <p className="text-sm text-red-600" role="alert">
                    {error}
                  </p>
                )}

                {/* Invisible reCAPTCHA container - must exist for reCAPTCHA to render */}
                <div id="recaptcha-container" ref={recaptchaContainerRef} className="hidden"></div>

                <button
                  id="send-code-button"
                  type="submit"
                  disabled={isSendingCode}
                  className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:shadow-xl hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSendingCode ? t.auth.loading : t.auth.register.sendCode}
                </button>
              </form>
            )}

            {/* Step 2: Code verification */}
            {step === "code" && (
              <form className="mt-6 space-y-4" onSubmit={handleVerifyCode}>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700">
                    {t.auth.register.enterCode}
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setVerificationCode(value);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-lg font-mono tracking-widest text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    placeholder={t.auth.register.codePlaceholder}
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-slate-500">
                    {t.auth.register.codeSent.replace("{phone}", phone)}
                  </p>
                </div>

                {error && (
                  <p className="text-sm text-red-600" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:shadow-xl hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isVerifying ? t.auth.loading : t.auth.register.verifyCode}
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  className="w-full text-sm text-slate-600 hover:text-[color:var(--primary)]"
                >
                  {t.auth.register.resendCode}
                </button>
              </form>
            )}

            {/* Step 3: Complete registration */}
            {step === "register" && (
              <form className="mt-6 space-y-4" onSubmit={handleRegister}>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700">
                    {t.auth.register.phoneLabel}
                  </label>
                  <input
                    type="tel"
                    value={verifiedPhone}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600 shadow-sm"
                  />
                  <p className="text-xs text-green-600">✓ Телефон верифицирован</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700">
                    {t.auth.register.emailLabel} *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    placeholder="user@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700">
                    {t.auth.register.fullNameLabel} *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700">
                    {t.auth.register.passwordLabel} *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    placeholder="••••••"
                    required
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
            )}

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
