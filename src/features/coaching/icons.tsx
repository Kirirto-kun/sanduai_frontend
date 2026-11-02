import type { ReactNode } from "react";
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
