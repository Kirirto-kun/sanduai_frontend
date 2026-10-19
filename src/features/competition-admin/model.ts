import type { CompetitionPreset, CompetitionPresetInput, EditorTab, LocalizedText } from "./types";

const blankText = (): LocalizedText => ({ kk: "", ru: "" });

export function presetInput(preset: CompetitionPreset): CompetitionPresetInput {
  const input = { ...preset };
  delete (input as Partial<CompetitionPreset>).updated_at;
  return input;
}

const verificationFields: ReadonlyArray<keyof CompetitionPresetInput> = [
  "competition_name", "kind", "year", "rule_version", "organizer", "official_source_url",
  "directions", "structure", "rubric", "file_formats", "languages", "time_limit_minutes",
  "word_limit", "deadline", "video_requirements", "plagiarism_requirements", "format_requirements",
  "verification_status",
];

export function needsVerification(preset: CompetitionPresetInput, existing?: CompetitionPresetInput): boolean {
  if (!preset.is_active) return false;
  if (!existing || !existing.is_active) return true;
  return verificationFields.some(key => JSON.stringify(preset[key]) !== JSON.stringify(existing[key]));
}

export function createAnnualDraft(source: CompetitionPreset, year: number): CompetitionPresetInput {
  return {
    competition_id: `${source.kind === "panorama" ? "PPI" : "PED_FESTIVAL"}_${year}`,
    competition_name: { ...source.competition_name },
    kind: source.kind,
    year,
    rule_version: `${year}.draft`,
    organizer: source.organizer,
    official_source_url: null,
    last_verified_at: null,
    verification_status: "unverified",
    verification_notes: blankText(),
    is_active: false,
    directions: [],
    structure: [],
    rubric: [],
    file_formats: ["docx", "pdf"],
    languages: ["kk", "ru"],
    time_limit_minutes: null,
    word_limit: null,
    deadline: null,
    video_requirements: blankText(),
    plagiarism_requirements: blankText(),
    format_requirements: blankText(),
    token_cost: source.token_cost,
    action_token_cost: source.action_token_cost,
    model: source.model,
  };
}

export function nextId(prefix: string, ids: string[]): string {
  let index = 1;
  while (ids.includes(`${prefix}_${index}`)) index += 1;
  return `${prefix}_${index}`;
}

export function moveRow<T>(rows: T[], index: number, delta: -1 | 1): T[] {
  const destination = index + delta;
  if (destination < 0 || destination >= rows.length) return rows;
  const result = [...rows];
  [result[index], result[destination]] = [result[destination], result[index]];
  return result;
}

export function toggleValue<T>(items: T[], value: T): T[] {
  return items.includes(value) ? items.filter(item => item !== value) : [...items, value];
}

export function dateTimeInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(date).replace(" ", "T");
}

export function dateTimeIso(value: string): string | null {
  if (!value) return null;
  const timestamp = new Date(`${value}:00+08:00`);
  return Number.isFinite(timestamp.getTime()) ? timestamp.toISOString() : null;
}

type Issue = { tab: EditorTab; message: string };

export function validatePreset(preset: CompetitionPresetInput, kk: boolean, verifiedNow: boolean): Issue | null {
  const issue = (tab: EditorTab, ru: string, kz: string): Issue => ({ tab, message: kk ? kz : ru });
  const hasText = (text: LocalizedText) => Boolean(text.kk.trim() && text.ru.trim());
  if (!preset.competition_id.trim() || !hasText(preset.competition_name) || !preset.rule_version.trim() || !preset.organizer.trim() || !preset.model.trim()) {
    return issue("general", "Заполните название на двух языках, организатора, версию и модель.", "Екі тілдегі атауды, ұйымдастырушыны, нұсқаны және модельді толтырыңыз.");
  }
  if (!Number.isInteger(preset.year) || preset.year < 2020 || preset.year > 2100) {
    return issue("general", "Укажите год от 2020 до 2100.", "2020–2100 аралығындағы жылды көрсетіңіз.");
  }
  if (preset.official_source_url) {
    try {
      const source = new URL(preset.official_source_url);
      if (!["https:", "http:"].includes(source.protocol) || !source.hostname || source.username) throw new Error();
    } catch {
      return issue("general", "Укажите действительную ссылку на официальный источник.", "Ресми дереккөзге дұрыс сілтеме көрсетіңіз.");
    }
  }
  if (!Number.isInteger(preset.token_cost) || preset.token_cost < 1 || preset.token_cost > 10000 || !Number.isInteger(preset.action_token_cost) || preset.action_token_cost < 1 || preset.action_token_cost > 10000) {
    return issue("general", "Стоимость должна быть целым числом от 1 до 10 000.", "Баға 1–10 000 аралығындағы бүтін сан болуы керек.");
  }
  if (preset.time_limit_minutes !== null && (!Number.isInteger(preset.time_limit_minutes) || preset.time_limit_minutes < 1 || preset.time_limit_minutes > 120)) {
    return issue("document", "Регламент должен быть от 1 до 120 минут.", "Уақыт регламенті 1–120 минут аралығында болуы керек.");
  }
  if (preset.word_limit !== null && (!Number.isInteger(preset.word_limit) || preset.word_limit < 100 || preset.word_limit > 50000)) {
    return issue("document", "Объём работы должен быть от 100 до 50 000 слов.", "Жұмыс көлемі 100–50 000 сөз аралығында болуы керек.");
  }
  if (!preset.file_formats.length || !preset.languages.length) {
    return issue("document", "Выберите хотя бы один формат файла и один язык.", "Кемінде бір файл форматын және бір тілді таңдаңыз.");
  }
  for (const [tab, rows] of [["directions", preset.directions], ["document", preset.structure], ["criteria", preset.rubric]] as const) {
    const ids = rows.map(row => row.id.trim());
    if (new Set(ids).size !== ids.length || rows.some(row => !/^[a-z][a-z0-9_]{1,63}$/.test(row.id) || !hasText(row.label))) {
      return issue(tab, "У каждой записи должен быть уникальный код и название на двух языках.", "Әр жазбада бірегей код және екі тілдегі атау болуы керек.");
    }
  }
  if (preset.rubric.some(criterion => !hasText(criterion.guidance))) {
    return issue("criteria", "Заполните инструкции для критериев на двух языках.", "Критерийлердің нұсқауларын екі тілде толтырыңыз.");
  }
  if (preset.is_active) {
    if (preset.verification_status === "unverified" || !preset.official_source_url || (!preset.last_verified_at && !verifiedNow)) {
      return issue("general", "Для активации укажите источник и подтвердите проверку правил этого года.", "Белсендіру үшін дереккөзді көрсетіп, осы жылғы ереженің тексерілгенін растаңыз.");
    }
    if (!preset.directions.length) return issue("directions", "Добавьте хотя бы одно направление.", "Кемінде бір бағыт қосыңыз.");
    if (!preset.structure.length) return issue("document", "Добавьте обязательные разделы документа.", "Құжаттың міндетті бөлімдерін қосыңыз.");
    if (!preset.rubric.length) return issue("criteria", "Добавьте критерии оценки.", "Бағалау критерийлерін қосыңыз.");
    if (preset.verification_status === "partial" && !hasText(preset.verification_notes)) {
      return issue("general", "Укажите на двух языках, какие требования ещё нужно уточнить.", "Әлі нақтылануы тиіс талаптарды екі тілде көрсетіңіз.");
    }
  }
  const sectionIds = new Set(preset.structure.map(section => section.id));
  if (preset.rubric.some(criterion => criterion.section_ids.some(id => !sectionIds.has(id)))) {
    return issue("criteria", "Проверьте связи критериев с разделами документа.", "Критерийлер мен құжат бөлімдерінің байланысын тексеріңіз.");
  }
  return null;
}
