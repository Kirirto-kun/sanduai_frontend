import Link from "next/link";

export function PlannerVersions({ active, kk }: { active: "classic" | "open"; kk: boolean }) {
  const options = [
    { id: "open", href: "/dashboard/ai/kmzh", label: kk ? "Ашық сабаққа ҚМЖ" : "КСП открытого урока" },
    { id: "classic", href: "/dashboard/ai/kmzh-classic", label: kk ? "Классикалық ҚМЖ" : "Классический КСП" },
  ];
  return <nav aria-label={kk ? "ҚМЖ нұсқалары" : "Версии КСП"} className="mb-6 flex flex-wrap gap-2">
    {options.map((option) => <Link key={option.id} href={option.href} aria-current={active === option.id ? "page" : undefined}
      className={`inline-flex min-h-11 items-center rounded-xl border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${active === option.id ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-slate-300 bg-white text-slate-700 hover:border-[var(--primary)] hover:text-[var(--primary)]"}`}>
      {option.label}
    </Link>)}
  </nav>;
}
