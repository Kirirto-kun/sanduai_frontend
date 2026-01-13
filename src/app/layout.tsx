import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "../i18n/LanguageContext";
import { AuthProvider } from "../contexts/AuthContext";
import { CookieBanner } from "../components/CookieBanner";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

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
      <body className={`${outfit.variable} antialiased`}>
        <AuthProvider>
          <LanguageProvider>
            {children}
            <CookieBanner />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

