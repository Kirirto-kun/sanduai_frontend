import { lessonCurriculumAssetUrl, type CurriculumObjective } from "@/lib/api";

export function readableObjectiveText(text: string, kk: boolean): string {
  return text.replace(/\[formula:[^\]]+\]/g, kk ? "[ресми бағдарламадағы формула]" : "[формула из официальной программы]");
}

/** Restore only an unchanged UI projection of a source formula, never edited wording. */
export function restoreObjectiveSourceText(values: string[], originals: string[], kk: boolean): string[] {
  return values.map((value) => originals.find((original) => readableObjectiveText(original, kk).trim() === value.trim()) ?? value);
}

export function ObjectiveContent({ objective, kk }: { objective: CurriculumObjective; kk: boolean }) {
  const fragments = objective.rich_fragments;
  if (!fragments?.length) return <>{readableObjectiveText(objective.text, kk)}</>;
  return <>{fragments.map((fragment, index) => {
    if (fragment.type === "text") return <span key={index}>{fragment.text}</span>;
    const src = lessonCurriculumAssetUrl(fragment.asset_id);
    const alt = kk ? "Ресми бағдарламадағы формула" : "Формула из официальной программы";
    if (!src) return <span key={index}>{`[${alt}]`}</span>;
    // The original official formula is served by our API, without third-party optimization or OCR substitution.
    // eslint-disable-next-line @next/next/no-img-element
    return <img key={index} src={src} alt={fragment.alt || alt} loading="lazy" className="mx-1 inline-block max-h-24 max-w-full align-middle object-contain" />;
  })}</>;
}
