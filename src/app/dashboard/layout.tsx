"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage, useTranslations } from "../../i18n/LanguageContext";

type NavItem = {
  label: string;
  href: string;
};

type NavGroup = {
  label: string;
  key: string;
  items: NavItem[];
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({
    aiGeneration: true,
    library: false,
    media: false,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading, router]);

  // Show loader while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_#fff7ed,_#fdfbf7_40%,_#f5e6d3_80%)]">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[color:var(--primary)] border-r-transparent"></div>
          <p className="text-sm font-semibold text-slate-700">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  const toggleGroup = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const navGroups: NavGroup[] = [
    {
      label: t.dashboard.menu.aiGeneration,
      key: "aiGeneration",
      items: [
        { label: t.dashboard.menu.aiGenerationItems.kmzh, href: "/dashboard/ai/kmzh" },
        { label: t.dashboard.menu.aiGenerationItems.essay, href: "/dashboard/ai/essay" },
        { label: t.dashboard.menu.aiGenerationItems.article, href: "/dashboard/ai/article" },
        { label: t.dashboard.menu.aiGenerationItems.bjbTjb, href: "/dashboard/ai/bjb-tjb" },
        {
          label: t.dashboard.menu.aiGenerationItems.scientificProjects,
          href: "/dashboard/ai/scientific-projects",
        },
        { label: t.dashboard.menu.aiGenerationItems.classHours, href: "/dashboard/ai/class-hours" },
        { label: t.dashboard.menu.aiGenerationItems.worksheets, href: "/dashboard/ai/worksheets" },
        { label: t.dashboard.menu.aiGenerationItems.kindergarten, href: "/dashboard/ai/kindergarten" },
        { label: t.dashboard.menu.aiGenerationItems.tests, href: "/dashboard/ai/tests" },
        { label: t.dashboard.menu.aiGenerationItems.games, href: "/dashboard/ai/games" },
        { label: t.dashboard.menu.aiGenerationItems.presentations, href: "/dashboard/ai/presentations" },
      ],
    },
    {
      label: t.dashboard.menu.library,
      key: "library",
      items: [
        { label: t.dashboard.menu.libraryItems.courses, href: "/dashboard/library/courses" },
        { label: t.dashboard.menu.libraryItems.visualAids, href: "/dashboard/library/visual-aids" },
        { label: t.dashboard.menu.libraryItems.presentations, href: "/dashboard/library/presentations" },
        { label: t.dashboard.menu.libraryItems.games, href: "/dashboard/library/games" },
        { label: t.dashboard.menu.libraryItems.sketchHub, href: "/dashboard/library/sketch-hub" },
        { label: t.dashboard.menu.libraryItems.simulations, href: "/dashboard/library/simulations" },
      ],
    },
    {
      label: t.dashboard.menu.media,
      key: "media",
      items: [
        { label: t.dashboard.menu.mediaItems.photo, href: "/dashboard/media/photo" },
        { label: t.dashboard.menu.mediaItems.video, href: "/dashboard/media/video" },
        { label: t.dashboard.menu.mediaItems.avatar, href: "/dashboard/media/avatar" },
        { label: t.dashboard.menu.mediaItems.voiceover, href: "/dashboard/media/voiceover" },
      ],
    },
  ];

  const filterItems = (items: NavItem[]) => {
    if (!search) return items;
    return items.filter((item) =>
      item.label.toLowerCase().includes(search.toLowerCase()),
    );
  };

  const renderNav = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-1">
      {/* Home */}
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition ${
          pathname === "/dashboard"
            ? "bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] text-white shadow"
            : "text-slate-700 hover:bg-white/80 hover:text-slate-900"
        }`}
      >
        <span>{t.dashboard.menu.home}</span>
      </Link>

      {/* Collapsible groups */}
      {navGroups.map((group) => {
        const filteredItems = filterItems(group.items);
        if (search && filteredItems.length === 0) return null;

        const isExpanded = expanded[group.key as keyof typeof expanded];

        return (
          <div key={group.key} className="mt-1">
            <button
              type="button"
              onClick={() => toggleGroup(group.key)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/80"
            >
              <span>{group.label}</span>
              <span className="text-xs">{isExpanded ? "▼" : "▶"}</span>
            </button>
            {isExpanded && (
              <div className="ml-3 mt-1 space-y-1 border-l-2 border-slate-200 pl-2">
                {filteredItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={`block rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        active
                          ? "bg-[color:var(--primary)] text-white shadow-sm"
                          : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Profile and Settings */}
      <Link
        href="/dashboard/profile"
        onClick={onNavigate}
        className={`mt-2 flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition ${
          pathname === "/dashboard/profile"
            ? "bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] text-white shadow"
            : "text-slate-700 hover:bg-white/80 hover:text-slate-900"
        }`}
      >
        <span>{t.dashboard.menu.profile}</span>
      </Link>
      <Link
        href="/dashboard/settings"
        onClick={onNavigate}
        className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition ${
          pathname === "/dashboard/settings"
            ? "bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] text-white shadow"
            : "text-slate-700 hover:bg-white/80 hover:text-slate-900"
        }`}
      >
        <span>{t.dashboard.menu.settings}</span>
      </Link>
    </nav>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fff7ed,_#fdfbf7_40%,_#f5e6d3_80%)]">
      {/* Sidebar */}
      <aside
        className={`${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-30 w-72 transform overflow-y-auto bg-white/95 px-4 py-6 shadow-xl ring-1 ring-slate-200 transition-transform md:translate-x-0`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.jpeg"
              alt="Sandu AI"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
              {t.common.brand}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100 md:hidden"
          >
            ✕
          </button>
        </div>

        {/* Language Switcher */}
        <div className="mt-6 inline-flex w-full rounded-full bg-[rgba(255,255,255,0.9)] p-1 shadow-sm ring-1 ring-black/5">
          <button
            type="button"
            onClick={() => setLanguage("ru")}
            className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              language === "ru"
                ? "bg-[color:var(--primary)] text-white shadow"
                : "text-slate-700 hover:bg-white/80"
            }`}
          >
            {t.common.ru}
          </button>
          <button
            type="button"
            onClick={() => setLanguage("kk")}
            className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              language === "kk"
                ? "bg-[color:var(--secondary)] text-white shadow"
                : "text-slate-700 hover:bg-white/80"
            }`}
          >
            {t.common.kk}
          </button>
        </div>

        {/* Search */}
        <div className="mt-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.dashboard.searchPlaceholder}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
          />
        </div>

        {/* Navigation */}
        <div className="mt-4">{renderNav(() => setMobileOpen(false))}</div>
      </aside>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-col md:ml-72">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/60 bg-white/85 px-4 py-4 shadow-sm backdrop-blur-md">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {t.dashboard.header.title}
            </h1>
            <p className="text-xs text-slate-600">
              {t.dashboard.header.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLanguage(language === "ru" ? "kk" : "ru")}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[color:var(--primary)] hover:text-[color:var(--primary)]"
            >
              {language === "ru" ? "RU / KZ" : "KZ / RU"}
            </button>
            <button
              type="button"
              onClick={logout}
              className="hidden rounded-full bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-slate-800 sm:inline"
            >
              {t.dashboard.header.logout}
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[color:var(--primary)] hover:text-[color:var(--primary)] md:hidden"
            >
              ☰
            </button>
          </div>
        </header>

        <main className="px-4 pb-10 pt-4 md:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
