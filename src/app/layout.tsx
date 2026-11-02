import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "../i18n/LanguageContext";
import { AuthProvider } from "../contexts/AuthContext";
import { CookieBanner } from "../components/CookieBanner";
import { ChatWidgetWrapper } from "../components/ChatWidgetWrapper";
import { BrowserCompatibilityNotice } from "../components/BrowserCompatibilityNotice";

export const metadata: Metadata = {
  title: "Sandu AI - Образовательная платформа с ИИ",
  description: "Автоматизированный сервис для помощи педагогам",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* A native deferred ES5 script works even if Next.js cannot hydrate. */}
        <script src="/browser-compatibility.js" defer />
      </head>
      <body className="antialiased">
        <BrowserCompatibilityNotice />
        <AuthProvider>
          <LanguageProvider>
            {children}
            <CookieBanner />
            <ChatWidgetWrapper />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
