import type { ReactNode } from "react";
import s from "./coaching.module.css";
export { Icon } from "./icons";

export function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return <div className={s.field}><label htmlFor={id}>{label}</label>{children}{hint && <p id={`${id}-hint`} className={s.hint}>{hint}</p>}</div>;
}
export function Section({ number, title, hint, children }: { number: string; title: string; hint?: string; children: ReactNode }) {
  return <section className={s.panel}><div className={s.sectionHeading}><span>{number}</span><div><h2>{title}</h2>{hint && <p>{hint}</p>}</div></div>{children}</section>;
}
export function CoachingArtwork() {
  return <svg className={s.artwork} viewBox="0 0 260 195" fill="none" aria-hidden="true">
    <circle cx="130" cy="96" r="87" fill="#E9EEE8" />
    <path d="M36 147c30-39 75-69 175-50" stroke="#94AEA5" strokeDasharray="3 5" />
    <rect x="91" y="24" width="113" height="137" rx="9" transform="rotate(11 91 24)" fill="#D1DFD7" />
    <rect x="64" y="26" width="113" height="137" rx="9" transform="rotate(-7 64 26)" fill="#FFFDF7" stroke="#B9C7BD" />
    <path d="m82 50 61-7m-59 17 41-5" stroke="#537167" strokeWidth="3" strokeLinecap="round" />
    <circle cx="93" cy="93" r="10" fill="#D7B89E" /><circle cx="124" cy="89" r="10" fill="#A97F60" />
    <path d="M78 124v-10c0-15 30-15 30 0v10" fill="#1D6255" /><path d="M110 120v-10c0-15 30-15 30 0v10" fill="#7B9C89" />
    <rect x="155" y="106" width="67" height="46" rx="8" transform="rotate(7 155 106)" fill="#174C43" />
    <path d="m173 127 8 8 17-17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m39 66 4 9 9 3-9 4-4 9-3-9-9-4 9-3 3-9Z" fill="#B6784E" />
    <path d="M43 176h174" stroke="#B2C0B5" strokeLinecap="round" />
  </svg>;
}
