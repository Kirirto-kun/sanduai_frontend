import type { ReactNode } from "react";

export function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const paths: Record<string, ReactNode> = {
    spark: <><path d="m12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2L12 3Z" /><path d="m20 2 .7 2.3L23 5l-2.3.7L20 8l-.7-2.3L17 5l2.3-.7L20 2Z" /></>,
    arrow: <><path d="M4 12h16m-6-6 6 6-6 6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>,
    file: <><path d="M14 2H5v20h14V7l-5-5Z" /><path d="M14 2v6h5M8 12h8m-8 4h8" /></>,
    mic: <><rect x="9" y="2" width="6" height="13" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" /></>,
    book: <><path d="M3 4h6c2 0 3 2 3 2s1-2 3-2h6v16h-6c-2 0-3 2-3 2s-1-2-3-2H3V4Z" /><path d="M12 6v16" /></>,
    video: <><rect x="2" y="5" width="14" height="14" rx="3" /><path d="m16 10 6-4v12l-6-4" /></>,
    slides: <><path d="M2 3h20M4 3v13h16V3M12 16v6m-5 0 5-4 5 4" /><path d="M8 8h8m-8 4h5" /></>,
    search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    plus: <path d="M12 4v16M4 12h16" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    edit: <><path d="m16 3 5 5-12 12-6 1 1-6L16 3Z" /><path d="m13 6 5 5" /></>,
    link: <><path d="M14 3h7v7M21 3l-11 11M10 3H3v18h18v-7" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{paths[name] ?? paths.spark}</svg>;
}

export const inputClass = "min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.02)] outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 disabled:bg-slate-50 disabled:text-slate-500";
export const primaryClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#26264f] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#38386d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50";

export function Field({ label, hint, children, optional }: { label: string; hint?: string; children: ReactNode; optional?: string }) {
  return <div><div className="mb-2 flex items-baseline justify-between gap-2"><span className="text-sm font-semibold text-slate-800">{label}</span>{optional && <span className="text-[11px] text-slate-400">{optional}</span>}</div>{children}{hint && <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p>}</div>;
}

export function IdeaArtwork({ kind }: { kind: "panorama" | "festival" }) {
  return <svg viewBox="0 0 220 120" className="h-28 w-48" fill="none" aria-hidden="true">
    <circle cx="110" cy="60" r="52" fill={kind === "panorama" ? "#eef0ff" : "#fff0e8"} />
    {kind === "panorama" ? <>
      <rect x="54" y="37" width="56" height="68" rx="7" transform="rotate(-12 54 37)" fill="#dce0fc" /><rect x="92" y="17" width="64" height="83" rx="8" fill="white" stroke="#c7cbee" strokeWidth="1.5" /><path d="M105 39h38m-38 9h30m-30 9h38" stroke="#a4addb" strokeWidth="3" strokeLinecap="round" /><rect x="104" y="69" width="15" height="17" rx="3" fill="#b4bde9" /><rect x="124" y="63" width="18" height="23" rx="3" fill="#6d75c6" /><circle cx="167" cy="81" r="20" fill="#5959a4" /><path d="m160 81 5 5 10-12" stroke="white" strokeWidth="3" strokeLinecap="round" /><path d="m58 21 3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Z" fill="#edb087" />
    </> : <>
      <path d="M53 99h115" stroke="#eed0bb" strokeWidth="2" strokeLinecap="round" /><rect x="94" y="17" width="32" height="57" rx="16" fill="#e69a72" /><path d="M80 50v6a30 30 0 0 0 60 0v-6" stroke="#bb7250" strokeWidth="4" strokeLinecap="round" /><path d="M110 86v14m-17 0h34" stroke="#bb7250" strokeWidth="4" strokeLinecap="round" /><path d="M99 33h22m-22 8h22m-22 8h22" stroke="#fff0e8" strokeWidth="2" strokeLinecap="round" /><path d="m153 23 4 10 10 4-10 4-4 10-4-10-10-4 10-4 4-10Z" fill="#dabb8e" /><rect x="45" y="52" width="24" height="30" rx="5" transform="rotate(-14 45 52)" fill="#f4d5c3" /><path d="m56 60 5 5-5 5" stroke="#bd886c" strokeWidth="2" />
    </>}
  </svg>;
}
