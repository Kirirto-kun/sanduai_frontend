import type { CellChange, CyclogramContent, CyclogramDocument, CyclogramInput } from "./types";

export type CyclogramView = "create" | "history" | "document";

export function resolveInitialCyclogramLanguage(
  currentLanguage: string,
  interfaceLanguage: string,
  configuredLanguages: readonly string[],
): string {
  const supported = configuredLanguages.map(code => code.trim()).filter(Boolean);
  const current = currentLanguage.trim();
  if (current && supported.includes(current)) return current;

  const preferred = interfaceLanguage.trim();
  if (preferred && supported.includes(preferred)) return preferred;
  return supported[0] ?? (preferred || "kk");
}

export function cyclogramDisplayLanguage(
  view: CyclogramView,
  formLanguage: string,
  documentLanguage?: string,
): string {
  return view === "document" && documentLanguage?.trim()
    ? documentLanguage.trim()
    : formLanguage.trim();
}

const MONTH_LABELS: Record<string, readonly string[]> = {
  kk: ["қаң.", "ақп.", "нау.", "сәу.", "мам.", "мау.", "шіл.", "там.", "қыр.", "қаз.", "қар.", "жел."],
  ru: ["янв.", "февр.", "мар.", "апр.", "мая", "июн.", "июл.", "авг.", "сент.", "окт.", "нояб.", "дек."],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  ky: ["янв.", "фев.", "март", "апр.", "май", "июнь", "июль", "авг.", "сент.", "окт.", "нояб.", "дек."],
  uz: ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"],
};

/** Calendar arithmetic in UTC prevents DST and browser timezone shifts. */
export function weekDates(date: string): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  const start = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== date) return [];
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  return Array.from({ length: 5 }, (_, index) => {
    const day = new Date(start);
    day.setUTCDate(day.getUTCDate() + index);
    return day.toISOString().slice(0, 10);
  });
}

export function nextWeek(date: string): string {
  const days = weekDates(date);
  if (!days.length) return "";
  const start = new Date(`${days[0]}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() + 7);
  return start.toISOString().slice(0, 10);
}

export function formatDate(date: string, language = "ru"): string {
  const value = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(value.getTime())) return date;
  const monthLabels = MONTH_LABELS[language];
  if (monthLabels) return `${value.getUTCDate()} ${monthLabels[value.getUTCMonth()]}`;
  try {
    return value.toLocaleDateString(language || "ru-RU", { day: "numeric", month: "short", timeZone: "UTC" });
  } catch {
    return date;
  }
}

export function normalizeInput(input: CyclogramInput): CyclogramInput {
  const days = weekDates(input.week_start);
  return {
    ...input,
    organization: input.organization.trim(),
    group_id: input.group_id.trim(),
    group_name: input.group_name.trim(),
    teacher_name: input.teacher_name.trim(),
    week_start: days[0] ?? input.week_start,
    weekly_theme: input.weekly_theme.trim(),
    notes: input.notes.trim(),
    language: input.language.trim(),
    source_id: input.source_id?.trim() || undefined,
  };
}

export function hasFiveDayRows(content: CyclogramContent): boolean {
  return content.rows.length > 0 && content.rows.every(row =>
    typeof row.section_id === "string" &&
    row.section_id.length > 0 &&
    row.cells.length === 5 &&
    row.cells.every(cell => typeof cell === "string"),
  );
}

export function isCyclogramDocument(value: unknown): value is CyclogramDocument {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CyclogramDocument>;
  return typeof candidate.id === "string" &&
    typeof candidate.version === "number" &&
    typeof candidate.week_start === "string" &&
    typeof candidate.week_end === "string" &&
    Array.isArray(candidate.sections) &&
    Boolean(candidate.content && hasFiveDayRows(candidate.content));
}

export function replaceCell(content: CyclogramContent, sectionId: string, day: number, text: string): CyclogramContent {
  if (!Number.isInteger(day) || day < 0 || day > 4) throw new Error("Invalid day");
  if (!hasFiveDayRows(content)) throw new Error("Invalid cyclogram content");
  if (!content.rows.some(row => row.section_id === sectionId)) throw new Error("Unknown section");
  return {
    ...content,
    rows: content.rows.map(row => row.section_id !== sectionId ? row : { ...row, cells: row.cells.map((cell, index) => index === day ? text : cell) }),
  };
}

export function changedCells(before: CyclogramContent, after: CyclogramContent): CellChange[] {
  if (!hasFiveDayRows(before) || !hasFiveDayRows(after)) throw new Error("Invalid cyclogram content");
  return after.rows.flatMap(row => {
    const previous = before.rows.find(item => item.section_id === row.section_id);
    return row.cells.flatMap((text, day_index) => previous?.cells[day_index] === text ? [] : [{ section_id: row.section_id, day_index, text }]);
  });
}

export function inputFromDocument(document: CyclogramInput): CyclogramInput {
  return {
    organization: document.organization, group_id: document.group_id, age: document.age,
    group_name: document.group_name, teacher_name: document.teacher_name, week_start: document.week_start,
    weekly_theme: document.weekly_theme, notes: document.notes, language: document.language,
  };
}

export function validateInput(input: CyclogramInput): string | null {
  if (!input.group_id) return "group_id";
  if (!Number.isInteger(input.age) || input.age < 2 || input.age > 6) return "age";
  if (!weekDates(input.week_start).length) return "week_start";
  if (!input.group_name.trim()) return "group_name";
  if (!input.teacher_name.trim()) return "teacher_name";
  if (!input.weekly_theme.trim()) return "weekly_theme";
  if (!input.language) return "language";
  return null;
}

export function draftKey(userId: string, documentId: string): string {
  return `sanduai:cyclogram:${userId}:${documentId}`;
}
