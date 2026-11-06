import { splitItems } from "./model";
import type { InterfaceLanguage, MeetingInput } from "./types";

export type MeetingListProblem = { targetId: "meeting-issues" | "meeting-specialists" | "meeting-resources"; message: string };

/** Use the same normalized list that will be sent, while preserving the draft. */
export function meetingListProblems(input: MeetingInput, language: InterfaceLanguage): MeetingListProblem[] {
  const fields = [
    { key: "issues", targetId: "meeting-issues", max: 12, ru: "Вопросы для обсуждения", kk: "Талқыланатын мәселелер" },
    { key: "specialists", targetId: "meeting-specialists", max: 10, ru: "Приглашённые специалисты", kk: "Қатысатын мамандар" },
    { key: "resources", targetId: "meeting-resources", max: 20, ru: "Доступные материалы", kk: "Қолжетімді материалдар" },
  ] as const;
  return fields.flatMap(field => {
    const items = splitItems(input[field.key].join(","));
    const label = field[language];
    let message: string;
    if (items.length > field.max) {
      message = language === "kk"
        ? `${label}: ең көбі ${field.max} тармақ енгізіңіз (қазір ${items.length}).`
        : `${label}: не более ${field.max} пунктов (сейчас ${items.length}).`;
    } else {
      const invalid = items.findIndex(item => item.length < 2 || item.length > 1200);
      if (invalid === -1) return [];
      message = language === "kk"
        ? `${label}: ${invalid + 1}-тармақ 2–1200 таңбадан тұруы керек.`
        : `${label}: пункт ${invalid + 1} должен содержать от 2 до 1200 символов.`;
    }
    return [{ targetId: field.targetId, message }];
  });
}

/** A collapsed optional section must open before its invalid field receives focus. */
export function focusMeetingProblem(targetId: string) {
  const element = document.getElementById(targetId);
  if (!element) return;
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    if (parent instanceof HTMLDetailsElement) parent.open = true;
  }
  element.focus({ preventScroll: true });
  element.scrollIntoView({ block: "center", behavior: "auto" });
}
