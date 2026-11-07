import type { ReactNode } from "react";
import s from "./parent-meetings.module.css";
import { Icon as SharedIcon } from "@/features/pedagogical-competitions/ui";

export function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const paths: Record<string, ReactNode> = {
    team: <><circle cx="9" cy="7" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-17a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 4v3" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
    school: <path d="m2 9 10-6 10 6-10 6L2 9Zm4 3v6l6 3 6-3v-6m4-3v8" />,
    cards: <><rect x="6" y="7" width="14" height="14" rx="2" /><path d="M15 3H4a2 2 0 0 0-2 2v11m8-4h6m-6 4h4" /></>,
  };
  return paths[name] ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{paths[name]}</svg> : <SharedIcon name={name} className={className} />;
}

export function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return <div className={s.field}><label htmlFor={id}>{label}</label>{children}{hint && <p id={`${id}-hint`} className={s.hint}>{hint}</p>}{error && <p id={`${id}-error`} className={s.fieldError}>{error}</p>}</div>;
}
export function Section({ number, title, hint, children }: { number: string; title: string; hint?: string; children: ReactNode }) {
  return <section className={s.panel}><div className={s.sectionHeading}><span>{number}</span><div><h2>{title}</h2>{hint && <p>{hint}</p>}</div></div>{children}</section>;
}
export function MeetingArtwork() {
  return <svg className={s.artwork} viewBox="0 0 250 200" fill="none" aria-hidden="true">
    <circle cx="128" cy="95" r="85" fill="#E9EFE4" />
    <path d="M37 137c14-43 41-66 91-66s77 23 91 66" stroke="#91A891" strokeDasharray="3 5" />
    <rect x="91" y="21" width="101" height="132" rx="8" transform="rotate(10 91 21)" fill="#D5DFCF" />
    <rect x="64" y="27" width="101" height="132" rx="8" transform="rotate(-7 64 27)" fill="#FFFEF8" stroke="#BCCBB6" />
    <path d="m80 50 57-7m-55 17 39-5" stroke="#638066" strokeWidth="3" strokeLinecap="round" />
    <circle cx="95" cy="89" r="10" fill="#DDBA98" /><circle cx="130" cy="85" r="10" fill="#B68A69" /><circle cx="114" cy="107" r="8" fill="#E9CBA8" />
    <path d="M79 124v-17c0-13 31-13 31 0v17" fill="#4F7C60" /><path d="M115 120v-17c0-13 31-13 31 0v17" fill="#AFBFA0" /><path d="M101 133v-12c0-12 26-12 26 0v12" fill="#C68655" />
    <rect x="163" y="102" width="59" height="47" rx="10" transform="rotate(8 163 102)" fill="#255842" />
    <path d="M179 122c0-5 6-7 9-3 4-3 9 0 8 4-1 5-8 9-8 9s-8-5-9-10Z" fill="#F3E7CD" />
    <path d="m40 60 4 9 9 4-9 3-4 9-3-9-9-3 9-4 3-9Z" fill="#C68D55" /><path d="M44 177h170" stroke="#BCCBB6" strokeLinecap="round" />
  </svg>;
}
