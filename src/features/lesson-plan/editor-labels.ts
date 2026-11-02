import type { LessonSubBlock } from "@/lib/api";
import type { EditableLessonPlan } from "./model";

const workTypes = {
  whole_class: ["Фронтальная работа", "Сыныппен бірлескен жұмыс"],
  individual: ["Индивидуальная работа", "Жеке жұмыс"],
  pair: ["Работа в парах", "Жұптық жұмыс"],
  group: ["Групповая работа", "Топтық жұмыс"],
  peer_pair: ["Взаимопроверка в парах", "Жұпта өзара тексеру"],
} as const;

const aliases: Record<string, keyof typeof workTypes> = {
  "ұ": "whole_class", "фр": "whole_class", "wc": "whole_class",
  "жж": "individual", "ир": "individual", "iw": "individual",
  "жт": "pair", "пр": "pair", "pw": "pair",
  "тж": "group", "гр": "group", "gw": "group", "өж": "peer_pair",
};

export function canonicalWorkType(value?: string | null): string | undefined {
  const key = value?.trim().toLowerCase();
  if (!key) return undefined;
  if (Object.hasOwn(workTypes, key)) return key;
  const localized = Object.entries(workTypes).find(([, labels]) => labels.some((label) => label.toLowerCase() === key));
  return Object.hasOwn(aliases, key) ? aliases[key] : localized?.[0];
}

export function workTypeOptions(kk: boolean) {
  return Object.entries(workTypes).map(([value, labels]) => ({ value, label: labels[kk ? 1 : 0] }));
}

const internalTaskName = /^(?:task[\w-]*|engage|check|reflect|start|middle|end)$/i;

export function humanTaskLabel(block: LessonSubBlock, index: number, kk: boolean): string {
  for (const candidate of [block.phase_name, block.method_name]) {
    if (candidate?.trim() && !internalTaskName.test(candidate.trim())) return candidate.trim();
  }
  return `${kk ? "Тапсырма" : "Задание"} ${index + 1}`;
}

export function taskReferenceOptions(plan: EditableLessonPlan, reference: string, answerIndex: number, kk: boolean) {
  const options = new Map<string, { value: string; label: string }>();
  plan.flow.flatMap((stage) => stage.sub_blocks).forEach((block, index) => {
    const value = block.task_id || block.phase_name;
    if (value) options.set(value, { value, label: humanTaskLabel(block, index, kk) });
    // Old answer keys sometimes reference a phase title instead of its stable ID.
    if (reference === block.phase_name) options.set(reference, { value: reference, label: humanTaskLabel(block, index, kk) });
  });
  if (!options.has(reference)) options.set(reference, {
    value: reference,
    label: reference.trim() && !/^[a-z][a-z0-9_-]*$/.test(reference) ? reference : `${kk ? "Тапсырма" : "Задание"} ${answerIndex + 1}`,
  });
  return Array.from(options.values());
}
