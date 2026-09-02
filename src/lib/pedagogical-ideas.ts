import type { GenerationJob } from "./api";

export type PedagogicalIdeasLanguage = "kk" | "ru";

export type PedagogicalIdeaTask = {
  title: string;
  instruction: string;
  work_format: string;
  duration_minutes: number;
  expected_result: string;
  success_criteria: string[];
  differentiation: {
    support: string;
    challenge: string;
  };
};

export type PedagogicalIdea = {
  title: string;
  hook: string;
  why_it_works: string;
  method: {
    name: string;
    purpose: string;
    teacher_actions: string[];
    student_actions: string[];
    materials: string[];
  };
  tasks: PedagogicalIdeaTask[];
  formative_assessment: string;
  reflection_question: string;
};

export type PedagogicalIdeasResult = {
  title: string;
  lesson_goal: string;
  ideas: PedagogicalIdea[];
  recommended_flow: Array<{
    stage: string;
    duration_minutes: number;
    action: string;
    idea_title: string;
  }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isTask(value: unknown): value is PedagogicalIdeaTask {
  if (!isRecord(value) || !isRecord(value.differentiation)) return false;
  return (
    typeof value.title === "string" &&
    typeof value.instruction === "string" &&
    typeof value.work_format === "string" &&
    typeof value.duration_minutes === "number" &&
    typeof value.expected_result === "string" &&
    isStringArray(value.success_criteria) &&
    typeof value.differentiation.support === "string" &&
    typeof value.differentiation.challenge === "string"
  );
}

function isIdea(value: unknown): value is PedagogicalIdea {
  if (!isRecord(value) || !isRecord(value.method)) return false;
  return (
    typeof value.title === "string" &&
    typeof value.hook === "string" &&
    typeof value.why_it_works === "string" &&
    typeof value.formative_assessment === "string" &&
    typeof value.reflection_question === "string" &&
    typeof value.method.name === "string" &&
    typeof value.method.purpose === "string" &&
    isStringArray(value.method.teacher_actions) &&
    isStringArray(value.method.student_actions) &&
    isStringArray(value.method.materials) &&
    Array.isArray(value.tasks) &&
    value.tasks.every(isTask)
  );
}

export function isPedagogicalIdeasResult(value: unknown): value is PedagogicalIdeasResult {
  if (!isRecord(value) || !Array.isArray(value.ideas) || !Array.isArray(value.recommended_flow)) {
    return false;
  }
  return (
    typeof value.title === "string" &&
    typeof value.lesson_goal === "string" &&
    value.ideas.length > 0 &&
    value.ideas.every(isIdea) &&
    value.recommended_flow.every((step) =>
      isRecord(step) &&
      typeof step.stage === "string" &&
      typeof step.duration_minutes === "number" &&
      typeof step.action === "string" &&
      typeof step.idea_title === "string")
  );
}

export function pedagogicalIdeasResultFromJob(job: GenerationJob | undefined): PedagogicalIdeasResult | null {
  if (!job || job.kind !== "pedagogical_idea.generate") return null;
  return isPedagogicalIdeasResult(job.result) ? job.result : null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function list(items: string[]): string {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

export function pedagogicalIdeasHtml(
  result: PedagogicalIdeasResult,
  language: PedagogicalIdeasLanguage,
): string {
  const copy = language === "kk"
    ? {
        goal: "Сабақ мақсаты",
        hook: "Қызықты бастама",
        why: "Неліктен тиімді",
        method: "Әдіс",
        teacher: "Мұғалім әрекеті",
        students: "Оқушы әрекеті",
        materials: "Қажетті материалдар",
        tasks: "Дайын тапсырмалар",
        expected: "Күтілетін нәтиже",
        criteria: "Бағалау критерийлері",
        support: "Қолдау",
        challenge: "Күрделендіру",
        assessment: "Қалыптастырушы бағалау",
        reflection: "Рефлексия",
        flow: "Ұсынылатын сабақ барысы",
        minutes: "мин",
      }
    : {
        goal: "Цель урока",
        hook: "Яркое начало",
        why: "Почему это работает",
        method: "Метод",
        teacher: "Действия учителя",
        students: "Действия учеников",
        materials: "Материалы",
        tasks: "Готовые задания",
        expected: "Ожидаемый результат",
        criteria: "Критерии успеха",
        support: "Поддержка",
        challenge: "Усложнение",
        assessment: "Формативное оценивание",
        reflection: "Рефлексия",
        flow: "Рекомендуемый ход урока",
        minutes: "мин",
      };

  const ideas = result.ideas.map((idea, index) => `
    <section>
      <h2>${index + 1}. ${escapeHtml(idea.title)}</h2>
      <p><strong>${copy.hook}:</strong> ${escapeHtml(idea.hook)}</p>
      <p><strong>${copy.why}:</strong> ${escapeHtml(idea.why_it_works)}</p>
      <h3>${copy.method}: ${escapeHtml(idea.method.name)}</h3>
      <p>${escapeHtml(idea.method.purpose)}</p>
      <h4>${copy.teacher}</h4>${list(idea.method.teacher_actions)}
      <h4>${copy.students}</h4>${list(idea.method.student_actions)}
      ${idea.method.materials.length ? `<h4>${copy.materials}</h4>${list(idea.method.materials)}` : ""}
      <h3>${copy.tasks}</h3>
      ${idea.tasks.map((task) => `
        <div class="task">
          <h4>${escapeHtml(task.title)} · ${task.duration_minutes} ${copy.minutes}</h4>
          <p>${escapeHtml(task.instruction)}</p>
          <p><strong>${copy.expected}:</strong> ${escapeHtml(task.expected_result)}</p>
          <p><strong>${copy.criteria}:</strong></p>${list(task.success_criteria)}
          <p><strong>${copy.support}:</strong> ${escapeHtml(task.differentiation.support)}</p>
          <p><strong>${copy.challenge}:</strong> ${escapeHtml(task.differentiation.challenge)}</p>
        </div>`).join("")}
      <p><strong>${copy.assessment}:</strong> ${escapeHtml(idea.formative_assessment)}</p>
      <p><strong>${copy.reflection}:</strong> ${escapeHtml(idea.reflection_question)}</p>
    </section>`).join("");

  const flow = result.recommended_flow.map((step) =>
    `<li><strong>${escapeHtml(step.stage)} · ${step.duration_minutes} ${copy.minutes}</strong><br>${escapeHtml(step.action)}</li>`,
  ).join("");

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:Arial,sans-serif;color:#172033;line-height:1.5;margin:32px}h1{color:#4f2bbd}h2{margin-top:28px;color:#26365d}h3{color:#3d4b73}.task{border-left:4px solid #7c5ce5;padding:4px 16px;margin:14px 0}li{margin:6px 0}
  </style></head><body>
    <h1>${escapeHtml(result.title)}</h1>
    <p><strong>${copy.goal}:</strong> ${escapeHtml(result.lesson_goal)}</p>
    ${ideas}
    <h2>${copy.flow}</h2><ol>${flow}</ol>
  </body></html>`;
}

function safeFilename(value: string): string {
  const normalized = value.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim();
  return normalized.slice(0, 80) || "pedagogical-ideas";
}

export function downloadPedagogicalIdeas(
  result: PedagogicalIdeasResult,
  language: PedagogicalIdeasLanguage,
): void {
  const blob = new Blob(["\ufeff", pedagogicalIdeasHtml(result, language)], {
    type: "application/msword;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeFilename(result.title)}.doc`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
