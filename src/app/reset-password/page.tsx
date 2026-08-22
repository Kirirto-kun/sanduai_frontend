import { AuthLanguageSwitch } from "@/components/AuthLanguageSwitch";

import { ResetPasswordForm } from "./ResetPasswordForm";

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const rawToken = Array.isArray(params.token) ? params.token[0] : params.token;
  const token = typeof rawToken === "string" && rawToken.length >= 32 && rawToken.length <= 256
    ? rawToken
    : "";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fff7ed,_#fdfbf7_40%,_#f5e6d3_80%)]">
      <div className="section-container py-12 sm:py-16">
        <div className="mx-auto max-w-md">
          <div className="glass-card rounded-3xl border border-white/60 px-6 py-8 shadow-xl sm:px-8">
            <div className="mb-5 flex justify-end">
              <AuthLanguageSwitch />
            </div>
            <ResetPasswordForm token={token} />
          </div>
        </div>
      </div>
    </main>
  );
}
