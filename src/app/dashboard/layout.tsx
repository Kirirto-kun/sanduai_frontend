"use client";

import { ReactNode, Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage, useTranslations } from "../../i18n/LanguageContext";
import { TokenBalance } from "../../components/TokenBalance";
import { COMMON_GROUPS, NavGroup, NavItem, SEGMENTS, SegmentKey } from "../../i18n/navigation";
import { useSegment } from "../../hooks/useSegment";

const DESKTOP_MEDIA_QUERY = "(min-width: 768px)";

function subscribeToDesktopMedia(callback: () => void) {
  const query = window.matchMedia(DESKTOP_MEDIA_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getDesktopSnapshot() {
  return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

function getServerDesktopSnapshot() {
  return false;
}

function DashboardLayoutContent({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading, logout, user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDesktop = useSyncExternalStore(
    subscribeToDesktopMedia,
    getDesktopSnapshot,
    getServerDesktopSnapshot,
  );
  const [search, setSearch] = useState("");
  const [segment, changeSegment] = useSegment();
  const syncedQuerySegment = useRef<SegmentKey | null>(null);
  const pendingQuerySegment = useRef<SegmentKey | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (pathname !== "/dashboard/library/catalog") return;
    const requested = searchParams.get("segment") as SegmentKey | null;
    if (!requested || !SEGMENTS.some((entry) => entry.key === requested)) return;
    if (pendingQuerySegment.current) {
      if (requested === pendingQuerySegment.current) {
        syncedQuerySegment.current = requested;
        pendingQuerySegment.current = null;
      }
      return;
    }
    if (syncedQuerySegment.current === requested) return;
    syncedQuerySegment.current = requested;
    if (requested !== segment) changeSegment(requested);
  }, [changeSegment, pathname, searchParams, searchParamsKey, segment]);

  const activeSegment = useMemo(
    () => SEGMENTS.find((s) => s.key === segment) ?? SEGMENTS[0],
    [segment]
  );

  const visibleGroups: NavGroup[] = useMemo(() => {
    const commonGroups = activeSegment.key === "library"
      ? COMMON_GROUPS.map((group) => ({
          ...group,
          items: group.items.filter((item) => item.key !== "lib-presentations"),
        }))
      : COMMON_GROUPS;
    const groups = [...activeSegment.groups, ...commonGroups];
    const query = search.trim().toLowerCase();
    if (!query) return groups;

    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.label[language].toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [activeSegment, search, language]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_#fff7ed,_#fdfbf7_40%,_#f5e6d3_80%)]">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[color:var(--primary)] border-r-transparent" />
          <p className="text-sm font-semibold text-slate-700">{t.dashboard.loading}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const resolveHref = (href: string) => {
    const [hrefPath, hrefQuery = ""] = href.split("?");
    if (hrefPath !== "/dashboard/library/catalog") return href;
    const resolved = new URLSearchParams(hrefQuery);
    if (!resolved.has("segment")) resolved.set("segment", activeSegment.key);
    return `${hrefPath}?${resolved.toString()}`;
  };

  const isActive = (href: string) => {
    const [hrefPath, hrefQuery = ""] = href.split("?");
    if (pathname !== hrefPath) return false;
    if (!hrefQuery) return true;
    const expected = new URLSearchParams(hrefQuery);
    const matches = Array.from(expected.entries()).every(([key, value]) => searchParams.get(key) === value);
    if (!matches) return false;
    if (hrefPath === "/dashboard/library/catalog" && !expected.has("grade") && searchParams.has("grade")) {
      return false;
    }
    return true;
  };

  const handleSegmentChange = (nextSegment: SegmentKey) => {
    syncedQuerySegment.current = nextSegment;
    changeSegment(nextSegment);
    if (pathname === "/dashboard/library/catalog") {
      const nextParams = new URLSearchParams(searchParamsKey);
      pendingQuerySegment.current = nextParams.get("segment") === nextSegment ? null : nextSegment;
      nextParams.set("segment", nextSegment);
      nextParams.delete("page");
      if (nextSegment !== "school") nextParams.delete("grade");
      router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
    }
  };

  const renderItem = (item: NavItem, onNavigate?: () => void) => {
    const href = resolveHref(item.href);
    const active = isActive(href);
    return (
      <Link
        key={item.key}
        href={href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={`group flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition ${
          active
            ? "bg-[color:var(--primary)] text-white shadow-sm"
            : item.soon
              ? "text-slate-400 hover:bg-white/80 hover:text-slate-600"
              : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
        }`}
      >
        <span className="truncate">{item.label[language]}</span>
        {item.soon && (
          <span
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
              active ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
            }`}
          >
            {language === "kk" ? "жақында" : "скоро"}
          </span>
        )}
        {item.isNew && !item.soon && (
          <span
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
              active ? "bg-white/25 text-white" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {language === "kk" ? "жаңа" : "ново"}
          </span>
        )}
      </Link>
    );
  };

  const renderNav = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-1">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
          pathname === "/dashboard"
            ? "bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] text-white shadow"
            : "text-slate-700 hover:bg-white/80 hover:text-slate-900"
        }`}
      >
        <span>🏠</span>
        <span>{t.dashboard.menu.home}</span>
      </Link>

      <Link
        href="/dashboard/sandubot"
        onClick={onNavigate}
        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
          pathname === "/dashboard/sandubot"
            ? "bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] text-white shadow"
            : "text-slate-700 hover:bg-white/80 hover:text-slate-900"
        }`}
      >
        <span>💬</span>
        <span>{t.sandubot?.title || "Sandu Bot"}</span>
      </Link>

      <div className="my-3 border-t border-slate-200" />

      {visibleGroups.map((group) => {
        const isCollapsed = collapsed[group.key] ?? false;
        return (
          <div key={group.key} className="mt-0.5">
            <button
              type="button"
              aria-expanded={!isCollapsed}
              aria-controls={`dashboard-nav-group-${group.key}`}
              onClick={() =>
                setCollapsed((prev) => ({ ...prev, [group.key]: !isCollapsed }))
              }
              className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 transition hover:bg-white/70 hover:text-slate-700"
            >
              <span className="truncate text-left">{group.label[language]}</span>
              <span className="shrink-0 text-[9px]">{isCollapsed ? "▶" : "▼"}</span>
            </button>
            {!isCollapsed && (
              <div id={`dashboard-nav-group-${group.key}`} className="mt-0.5 space-y-0.5">
                {group.items.map((item) => renderItem(item, onNavigate))}
              </div>
            )}
          </div>
        );
      })}

      {visibleGroups.length === 0 && (
        <p className="px-3 py-6 text-center text-xs text-slate-400">
          {language === "kk" ? "Ештеңе табылмады" : "Ничего не найдено"}
        </p>
      )}

      <div className="my-3 border-t border-slate-200" />

      <Link
        href="/dashboard/profile"
        onClick={onNavigate}
        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
          pathname === "/dashboard/profile"
            ? "bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] text-white shadow"
            : "text-slate-700 hover:bg-white/80 hover:text-slate-900"
        }`}
      >
        <span>👤</span>
        <span>{t.dashboard.menu.profile}</span>
      </Link>
      <Link
        href="/dashboard/settings"
        onClick={onNavigate}
        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
          pathname === "/dashboard/settings"
            ? "bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] text-white shadow"
            : "text-slate-700 hover:bg-white/80 hover:text-slate-900"
        }`}
      >
        <span>⚙️</span>
        <span>{t.dashboard.menu.settings}</span>
      </Link>
      {user?.role === "admin" && (
        <Link
          href="/dashboard/admin"
          onClick={onNavigate}
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
            pathname === "/dashboard/admin"
              ? "bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] text-white shadow"
              : "text-slate-700 hover:bg-white/80 hover:text-slate-900"
          }`}
        >
          <span>🛠</span>
          <span>{t.dashboard.menu.admin || "Админ панель"}</span>
        </Link>
      )}
    </nav>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_#fff7ed,_#fdfbf7_40%,_#f5e6d3_80%)]">
        <aside
          id="dashboard-sidebar"
          inert={!isDesktop && !mobileOpen ? true : undefined}
          aria-hidden={!isDesktop && !mobileOpen ? true : undefined}
          className={`${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          } fixed inset-y-0 left-0 z-30 flex w-72 transform flex-col overflow-y-auto bg-white/95 px-4 py-5 shadow-xl ring-1 ring-slate-200 transition-transform md:translate-x-0`}
        >
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <Image
                src="/logo.jpeg"
                alt="Sandu AI"
                width={563}
                height={571}
                sizes="32px"
                style={{ width: "auto", height: "32px" }}
                className="rounded-lg"
              />
              <span className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
                {t.common.brand}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label={language === "kk" ? "Мәзірді жабу" : "Закрыть меню"}
              className="rounded-full p-1 text-slate-500 hover:bg-slate-100 md:hidden"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 inline-flex w-full rounded-full bg-[rgba(255,255,255,0.9)] p-1 shadow-sm ring-1 ring-black/5">
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

          {/* Переключатель сегмента: школа / детсад / библиотека */}
          <div className="mt-5">
            <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {language === "kk" ? "Бөлім" : "Раздел"}
            </p>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100/80 p-1">
              {SEGMENTS.map((s) => {
                const active = s.key === segment;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => handleSegmentChange(s.key)}
                    aria-pressed={active}
                    title={s.hint[language]}
                    className={`flex flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-semibold leading-tight transition ${
                      active
                        ? "bg-white text-[color:var(--primary)] shadow-sm ring-1 ring-black/5"
                        : "text-slate-500 hover:bg-white/60 hover:text-slate-700"
                    }`}
                  >
                    <span className="text-base leading-none">{s.icon}</span>
                    <span className="truncate">{s.label[language]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.dashboard.searchPlaceholder}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
            />
          </div>

          <div className="mt-3 flex-1">{renderNav(() => setMobileOpen(false))}</div>
        </aside>

        {mobileOpen && (
          <div
            aria-hidden="true"
            className="fixed inset-0 z-20 bg-black/30 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <div className="flex flex-col md:ml-72">
          <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-1.5 overflow-x-hidden border-b border-white/60 bg-white/85 px-2 py-2 shadow-sm backdrop-blur-md sm:gap-2 sm:px-4 sm:py-3 md:gap-3 md:py-4">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold text-slate-900 sm:text-xl">
                {t.dashboard.header.title}
              </h1>
              <p className="hidden text-xs text-slate-600 sm:block">
                {activeSegment.icon} {activeSegment.label[language]} —{" "}
                {activeSegment.hint[language]}
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
              <TokenBalance compact />
              <button
                type="button"
                onClick={() => setLanguage(language === "ru" ? "kk" : "ru")}
                className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm transition hover:border-[color:var(--primary)] hover:text-[color:var(--primary)] sm:px-3 sm:py-1.5 sm:text-xs"
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
                aria-controls="dashboard-sidebar"
                aria-expanded={mobileOpen}
                aria-label={language === "kk" ? "Мәзірді ашу" : "Открыть меню"}
                className="rounded-full border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[color:var(--primary)] hover:text-[color:var(--primary)] md:hidden"
              >
                ☰
              </button>
            </div>
          </header>

          <main className="px-2 pb-10 pt-4 sm:px-4 md:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_#fff7ed,_#fdfbf7_40%,_#f5e6d3_80%)]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[color:var(--primary)] border-r-transparent" />
        </div>
      }
    >
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
