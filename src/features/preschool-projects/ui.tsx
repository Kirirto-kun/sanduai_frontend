import type { ReactNode } from "react";
import s from "./projects.module.css";

const PATHS: Record<string, ReactNode> = {
  flask: <><path d="M9 3h6m-5 0v6l-6 9a2 2 0 0 0 1.7 3h12.6a2 2 0 0 0 1.7-3l-6-9V3M7 15h10" /><path d="M10 18h.01M14 13h.01" /></>,
  leaf: <><path d="M20 4c1 11-3 17-10 15-6-2-7-10 0-12 3-1 6-1 10-3Z" /><path d="M4 21 16 9m-6 6v-4m0 4h4" /></>,
  blocks: <><rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" /><path d="m12 2 5 8H7Z" /></>,
  palette: <><path d="M12 3a9 9 0 1 0 0 18h1.4a2 2 0 0 0 1.6-3.2 1.7 1.7 0 0 1 1.4-2.8H18c2 0 3-2 3-4 0-4-4-8-9-8Z" /><path d="M7 11h.01M10 7h.01M15 7h.01M17 11h.01M7 15h.01" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
  heart: <path d="m12 21-8-8a5.6 5.6 0 0 1 8-8 5.6 5.6 0 0 1 8 8Z" />,
  pattern: <><path d="m12 2 10 10-10 10L2 12Zm0 5 5 5-5 5-5-5Z" /><path d="M12 7V2m5 10h5M12 17v5M7 12H2" /></>,
  people: <><circle cx="9" cy="7" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-17a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v3" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  book: <><path d="M12 5c-3-2-7-2-10-1v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15" /></>,
  award: <><circle cx="12" cy="8" r="5" /><path d="m8 12-2 9 6-3 6 3-2-9" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  file: <><path d="M14 2H5v20h14V7Zm0 0v5h5M8 12h8m-8 4h6" /></>,
  shield: <><path d="m12 2 8 3v6c0 6-8 11-8 11S4 17 4 11V5Z" /><path d="m8 12 3 3 5-6" /></>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" /></>,
  copy: <><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V3H3v13h5" /></>,
};
export function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={`${s.icon} ${className}`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{PATHS[name] ?? PATHS.leaf}</svg>;
}
export function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return <div className={s.field}><label htmlFor={id}>{label}</label>{children}{hint && <p id={`${id}-hint`} className={s.hint}>{hint}</p>}</div>;
}
export function Section({ number, title, hint, children }: { number: string; title: string; hint: string; children: ReactNode }) {
  return <section className={s.section}><header className={s.sectionHead}><span className={s.sectionNumber}>{number}</span><div><h2>{title}</h2><p>{hint}</p></div></header><div className={s.sectionBody}>{children}</div></section>;
}
export function ProjectArtwork() {
  return <div className={s.artwork} aria-hidden="true"><svg viewBox="0 0 320 240" fill="none"><circle cx="170" cy="115" r="92" fill="#EAF0DF" /><circle cx="170" cy="115" r="72" stroke="#D3DEC5" strokeDasharray="3 8" /><path d="M90 183h156" stroke="#C1CEB3" strokeWidth="2" /><path d="M126 137h73l-10 46h-52Z" fill="#DDA47E" /><path d="M126 137h73v12h-73Z" fill="#EBC3A7" /><path d="M163 139V74" stroke="#376651" strokeWidth="4" strokeLinecap="round" /><path d="M164 111c-32 0-44-22-42-36 28 0 44 12 42 36Z" fill="#72906A" /><path d="M163 93c0-30 17-41 39-41 0 28-15 42-39 41Z" fill="#3D6C53" /><path d="M163 127c12-24 32-28 49-22-9 23-27 30-49 22Z" fill="#9BB07E" /><rect x="57" y="76" width="48" height="54" rx="8" transform="rotate(-10 57 76)" fill="#FFFEF9" stroke="#DDDFD3" /><path d="m70 96 7 6 13-14m-18 23 17-3" stroke="#718568" strokeWidth="2" strokeLinecap="round" /><circle cx="248" cy="62" r="18" fill="#F4DFB5" /><path d="M248 50v24m-12-12h24m-20-8 16 16m-16 0 16-16" stroke="#BA8546" strokeWidth="1.5" /><circle cx="72" cy="160" r="4" fill="#C3CFB8" /><circle cx="232" cy="167" r="5" fill="#DDA47E" /><path d="m217 33 3-6 3 6 6 3-6 3-3 6-3-6-6-3Z" fill="#DDA47E" /></svg><span className={s.artworkLabel}>SANDUAI · PRESCHOOL PROJECT PRO</span></div>;
}
