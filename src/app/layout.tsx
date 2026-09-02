import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "../i18n/LanguageContext";
import { AuthProvider } from "../contexts/AuthContext";
import { CookieBanner } from "../components/CookieBanner";
import { ChatWidgetWrapper } from "../components/ChatWidgetWrapper";

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
    <html lang="ru">
      <body className="antialiased">
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
