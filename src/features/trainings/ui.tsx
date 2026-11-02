import type { ReactNode } from "react";
import styles from "./trainings.module.css";
import { Icon as SharedIcon } from "@/features/pedagogical-competitions/ui";

export function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const extra: Record<string, ReactNode> = {
    team: <><circle cx="9" cy="7" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-17a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 4v3" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
    school: <><path d="m2 9 10-6 10 6-10 6L2 9Zm4 3v6l6 3 6-3v-6m4-3v8" /></>,
    layers: <><path d="m3 7 9-4 9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4" /></>,
    cards: <><rect x="6" y="7" width="14" height="14" rx="2" /><path d="M15 3H4a2 2 0 0 0-2 2v11m8-4h6m-6 4h4" /></>,
  };
  return extra[name] ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{extra[name]}</svg> : <SharedIcon name={name} className={className} />;
}

export function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return <div className={styles.field}><label htmlFor={id}>{label}</label>{children}{hint && <p id={`${id}-hint`} className={styles.hint}>{hint}</p>}</div>;
}
export function Section({ title, number, children, hint }: { title: string; number: string; children: ReactNode; hint?: string }) {
  return <section className={styles.section}><div className={styles.sectionTitle}><span>{number}</span><div><h2>{title}</h2>{hint && <p>{hint}</p>}</div></div>{children}</section>;
}
export function TrainingArtwork() {
  return <svg viewBox="0 0 240 180" fill="none" className={styles.artwork} aria-hidden="true"><circle cx="119" cy="90" r="78" fill="#f0e7d8"/><path d="M53 142c7-38 24-61 68-66 45 5 66 26 69 66" stroke="#c5b89d" strokeWidth="1.2" strokeDasharray="4 5"/><rect x="76" y="21" width="94" height="116" rx="9" transform="rotate(7 76 21)" fill="#ead4b9"/><rect x="65" y="20" width="94" height="116" rx="9" transform="rotate(-7 65 20)" fill="#fffdf8" stroke="#d2c4ae"/><path d="m80 44 51-6m-49 17 34-4" stroke="#bba48a" strokeWidth="3" strokeLinecap="round"/><circle cx="100" cy="81" r="11" fill="#e6c6a6"/><path d="M81 114v-8c0-23 39-23 39 0v8" fill="#749c8b"/><circle cx="139" cy="90" r="10" fill="#d3aa86"/><path d="M121 119v-7c0-20 36-20 36 0v7" fill="#b9cdb8"/><rect x="158" y="55" width="48" height="43" rx="7" fill="#285c4b" transform="rotate(9 158 55)"/><path d="m174 76 6 7 12-13" stroke="#fffdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="m42 48 3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Z" fill="#c4794d"/><circle cx="185" cy="129" r="11" fill="#d7e3cc"/><path d="M37 148h159" stroke="#c5b89d" strokeWidth="1.2" strokeLinecap="round"/></svg>;
}
