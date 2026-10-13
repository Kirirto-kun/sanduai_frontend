import {
  MASTERCLASS_LANGUAGES,
  type MasterclassAdminTab,
  type MasterclassAudienceOption,
  type MasterclassConfig,
  type MasterclassConfigInput,
  type MasterclassLabels,
  type MasterclassLanguage,
  type MasterclassOption,
} from "./types";

export const LANGUAGE_NAMES: Record<MasterclassLanguage, string> = { kk: "Қазақша", ru: "Русский", en: "English", ky: "Кыргызча" };
export type AdminMessage = { ru: string; kk: string };

export function configInput(config: MasterclassConfig): MasterclassConfigInput {
  const input = { ...config };
  delete (input as Partial<MasterclassConfig>).version;
  delete (input as Partial<MasterclassConfig>).updated_at;
  return input;
}

export function emptyLabels(): MasterclassLabels {
  return { kk: "", ru: "", en: "", ky: "" };
}

export function nextOptionId(prefix: string, options: Array<{ id: string }>): string {
  let index = 1;
  while (options.some(option => option.id === `${prefix}_${index}`)) index += 1;
  return `${prefix}_${index}`;
}

export function moveOption<T>(options: T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  if (target < 0 || target >= options.length) return options;
  const result = [...options];
  [result[index], result[target]] = [result[target], result[index]];
  return result;
}

export function toggleSelection<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter(item => item !== value) : [...values, value];
}

export function nextDuration(config: Pick<MasterclassConfigInput, "duration_options" | "min_duration_minutes" | "max_duration_minutes">): number | null {
  if (config.duration_options.length >= 20) return null;
  for (let minutes = config.min_duration_minutes; minutes <= config.max_duration_minutes; minutes += 5) {
    if (!config.duration_options.includes(minutes)) return minutes;
  }
  for (let minutes = config.min_duration_minutes; minutes <= config.max_duration_minutes; minutes += 1) {
    if (!config.duration_options.includes(minutes)) return minutes;
  }
  return null;
}

export function renameInstitution(config: MasterclassConfigInput, index: number, id: string): Partial<MasterclassConfigInput> {
  const previous = config.institutions[index].id;
  return {
    institutions: config.institutions.map((option, position) => position === index ? { ...option, id } : option),
    audiences: config.audiences.map(option => ({ ...option, institution_types: option.institution_types.map(type => type === previous ? id : type) })),
  };
}

export function audienceMatches(audience: MasterclassAudienceOption, institution: string): boolean {
  return institution === "all" || audience.institution_types.includes(institution);
}

export function replaceVisibleAudiences(all: MasterclassAudienceOption[], visible: MasterclassAudienceOption[], updated: MasterclassAudienceOption[]): MasterclassAudienceOption[] {
  const visibleIds = new Set(visible.map(option => option.id));
  let cursor = 0;
  return all.flatMap(option => {
    if (!visibleIds.has(option.id)) return [option];
    const replacement = updated[cursor++];
    return replacement ? [replacement] : [];
  });
}

export type ConfigIssue = { tab: MasterclassAdminTab; message: AdminMessage; label_language?: MasterclassLanguage; option_id?: string };

export function validateConfig(config: MasterclassConfigInput): ConfigIssue | null {
  const issue = (tab: MasterclassAdminTab, ru: string, kk: string, label_language?: MasterclassLanguage): ConfigIssue => ({ tab, message: { ru, kk }, label_language });
  const groups: Array<[MasterclassAdminTab, string, string, MasterclassOption[]]> = [
    ["audiences", "сред проведения", "өткізу ортасы", config.institutions],
    ["audiences", "аудиторий", "аудитория", config.audiences],
    ["formats", "форматов", "формат", config.formats],
    ["formats", "стилей", "стиль", config.styles],
    ["formats", "направлений", "бағыт", config.directions],
    ["formats", "уровней сложности", "күрделілік деңгейі", config.difficulties],
    ["materials", "интерактивных шаблонов", "интерактив үлгісі", config.interactive_templates],
  ];
  for (const [tab, ruName, kkName, options] of groups) {
    if (tab === "materials" && !options.length) continue;
    if (!options.length) return issue(tab, `Добавьте хотя бы один элемент в список ${ruName}.`, `${kkName} тізіміне кемінде бір элемент қосыңыз.`);
    if (new Set(options.map(option => option.id)).size !== options.length || options.some(option => !/^[a-z][a-z0-9_]{1,63}$/.test(option.id))) {
      return issue(tab, `У элементов ${ruName} должны быть уникальные коды: латинские буквы, цифры и знак _.`, `${kkName} элементтерінің бірегей кодын көрсетіңіз: латын әріптері, сандар және _ белгісі.`);
    }
    for (const option of options) {
      const missing = MASTERCLASS_LANGUAGES.find(code => !option.label[code].trim());
      if (missing) return { ...issue(tab, `Заполните название «${option.id}» на языке ${LANGUAGE_NAMES[missing]}.`, `«${option.id}» атауын ${LANGUAGE_NAMES[missing]} тілінде толтырыңыз.`, missing), option_id: option.id };
      if (MASTERCLASS_LANGUAGES.some(code => option.label[code].length > 1000)) return issue(tab, `Название «${option.id}» должно быть не длиннее 1000 символов.`, `«${option.id}» атауы 1000 таңбадан аспауы керек.`);
    }
  }
  const oversized = config.institutions.length > 30 || config.audiences.length > 100 || config.formats.length > 40 || config.styles.length > 40 || config.directions.length > 40 || config.difficulties.length > 20 || config.interactive_templates.length > 40;
  if (oversized) return issue("audiences", "В одном из списков превышено допустимое число записей.", "Тізімдердің бірінде жазбалардың рұқсат етілген саны асып кетті.");
  const institutions = new Set(config.institutions.map(option => option.id));
  if (config.audiences.some(option => !option.institution_types.length || option.institution_types.some(type => !institutions.has(type)))) {
    return issue("audiences", "Каждую аудиторию нужно связать с существующей средой проведения.", "Әр аудиторияны қолданыстағы өткізу ортасымен байланыстырыңыз.");
  }
  if (config.institutions.some(option => !config.audiences.some(audience => audience.institution_types.includes(option.id)))) {
    return issue("audiences", "Для каждой среды проведения добавьте хотя бы одну аудиторию.", "Әр өткізу ортасына кемінде бір аудитория қосыңыз.");
  }
  if (!config.languages.length || new Set(config.languages).size !== config.languages.length || config.languages.some(code => !MASTERCLASS_LANGUAGES.includes(code))) {
    return issue("generation", "Выберите хотя бы один из четырёх языков материала.", "Материалдың төрт тілінің кемінде біреуін таңдаңыз.");
  }
  if (!Number.isInteger(config.min_duration_minutes) || !Number.isInteger(config.max_duration_minutes) || config.min_duration_minutes < 10 || config.min_duration_minutes > 120 || config.max_duration_minutes < 15 || config.max_duration_minutes > 480 || config.min_duration_minutes > config.max_duration_minutes) {
    return issue("generation", "Минимум должен быть от 10 до 120 минут, максимум — от 15 до 480. Минимум не должен превышать максимум.", "Ең азы 10–120 минут, ең көбі 15–480 минут аралығында болуы керек. Ең азы ең көбінен аспайды.");
  }
  if (!config.duration_options.length || config.duration_options.length > 20 || new Set(config.duration_options).size !== config.duration_options.length || config.duration_options.some(value => !Number.isInteger(value) || value < config.min_duration_minutes || value > config.max_duration_minutes)) {
    return issue("generation", "Готовые варианты времени должны быть уникальными и попадать в заданные границы.", "Дайын уақыт нұсқалары бірегей және берілген шектер ішінде болуы керек.");
  }
  if ([config.token_cost, config.topics_token_cost, config.action_token_cost].some(value => !Number.isInteger(value) || value < 1 || value > 10000)) {
    return issue("generation", "Стоимость должна быть целым числом от 1 до 10 000 монет.", "Баға 1–10 000 монета аралығындағы бүтін сан болуы керек.");
  }
  if (config.model.trim().length < 3 || config.model.length > 80) return issue("generation", "Укажите модель ИИ: от 3 до 80 символов.", "ЖИ моделін көрсетіңіз: 3–80 таңба.");
  if (config.system_prompt.trim().length < 100 || config.system_prompt.length > 30000) return issue("prompts", "Основная инструкция ИИ должна содержать от 100 до 30 000 символов.", "ЖИ негізгі нұсқаулығы 100–30 000 таңбадан тұруы керек.");
  if (!/^#[0-9a-fA-F]{6}$/.test(config.export_template.accent_color) || !config.export_template.font_family.trim()) {
    return issue("materials", "Укажите цвет в формате #RRGGBB и шрифт экспортного шаблона.", "Экспорт үлгісінің түсін #RRGGBB пішімінде және қарпін көрсетіңіз.");
  }
  const missingFooter = MASTERCLASS_LANGUAGES.find(code => !config.export_template.footer[code].trim());
  if (missingFooter) return issue("materials", `Заполните подпись документа на языке ${LANGUAGE_NAMES[missingFooter]}.`, `Құжаттың төменгі жазуын ${LANGUAGE_NAMES[missingFooter]} тілінде толтырыңыз.`, missingFooter);
  if (!config.file_formats.length || new Set(config.file_formats).size !== config.file_formats.length) return issue("materials", "Выберите хотя бы один формат экспорта без повторений.", "Кемінде бір қайталанбайтын экспорт пішімін таңдаңыз.");
  if (config.interactive_templates.some(template => !template.kind.trim() || template.prompt.trim().length < 10 || template.prompt.length > 10000)) {
    return issue("materials", "У каждого интерактива должны быть вид и инструкция не короче 10 символов.", "Әр интерактивте түрі және кемінде 10 таңбадан тұратын нұсқаулық болуы керек.");
  }
  return null;
}
