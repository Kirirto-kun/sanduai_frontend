import { describe, expect, it } from "vitest";

import type { GenerationJob } from "./api";
import {
  isPedagogicalIdeasResult,
  pedagogicalIdeasHtml,
  pedagogicalIdeasResultFromJob,
  type PedagogicalIdeasResult,
} from "./pedagogical-ideas";

const RESULT: PedagogicalIdeasResult = {
  title: "Бөлшектер зертханасы",
  lesson_goal: "Оқушылар жай бөлшектерді салыстырып, өз шешімін дәлелдейді.",
  ideas: [
    {
      title: "Пицца зертханасы",
      hook: "Сыныпқа бөліктерге бөлінген пицца үлгісі көрсетіледі.",
      why_it_works: "Көрнекі модель абстрактілі бөлшекті түсінуге көмектеседі.",
      method: {
        name: "Зерттеу бекеттері",
        purpose: "Оқушылар бірнеше модель арқылы заңдылықты өздері табады.",
        teacher_actions: ["Үлгілерді дайындайды", "Сұрақ қояды"],
        student_actions: ["Модельдерді салыстырады", "Қорытынды жасайды"],
        materials: ["Қағаз пицца", "Маркерлер"],
      },
      tasks: [
        {
          title: "Үлесті тап",
          instruction: "Берілген пицца бөліктерін салыстырып, үлкен бөлшекті түсіндіріңіз.",
          work_format: "Жұппен",
          duration_minutes: 8,
          expected_result: "Оқушы екі бөлшекті дұрыс салыстырады және себебін айтады.",
          success_criteria: ["Дұрыс салыстырады", "Модельмен дәлелдейді"],
          differentiation: {
            support: "Дайын бөлшек жолақтары беріледі.",
            challenge: "Үш бөлшекті өсу ретімен орналастырады.",
          },
        },
        {
          title: "Өз есебіңді құрастыр",
          instruction: "Бөлшектерді салыстыруға арналған қысқа өмірлік есеп құрастырыңыз.",
          work_format: "Топпен",
          duration_minutes: 10,
          expected_result: "Топ шешімі тексерілетін бір есеп пен жауабын ұсынады.",
          success_criteria: ["Шарты түсінікті", "Жауабы дәлелденген"],
          differentiation: {
            support: "Сөйлем бастамалары ұсынылады.",
            challenge: "Бірнеше шешімі бар есеп құрастырады.",
          },
        },
      ],
      formative_assessment: "Топтар екі критерий бойынша бір-біріне кері байланыс береді.",
      reflection_question: "Қай модель бөлшектерді салыстыруды жеңілдетті?",
    },
  ],
  recommended_flow: [
    {
      stage: "Қызығушылықты ояту",
      duration_minutes: 5,
      action: "Пицца үлгісі арқылы проблемалық сұрақ ұсыну.",
      idea_title: "Пицца зертханасы",
    },
  ],
};

function job(result: unknown, kind = "pedagogical_idea.generate"): GenerationJob {
  return {
    id: "30bdc3b2-41e6-4399-877c-cbab8e93a5d9",
    kind,
    title: "Бөлшектер",
    source_path: "/dashboard/ai/pedagogical-ideas",
    status: "completed",
    progress: { current: 1, total: 1 },
    cost_tokens: 10,
    captured_tokens: 10,
    billing_status: "captured",
    attempt_count: 1,
    cancel_requested: false,
    error_code: null,
    error_message: null,
    created_at: "2026-09-01T08:00:00Z",
    updated_at: "2026-09-01T08:00:05Z",
    started_at: "2026-09-01T08:00:01Z",
    completed_at: "2026-09-01T08:00:05Z",
    expires_at: "2026-09-02T08:00:05Z",
    result: result as GenerationJob["result"],
    artifact_urls: [],
  };
}

describe("pedagogical ideas result", () => {
  it("accepts the complete structured contract and rejects partial provider output", () => {
    expect(isPedagogicalIdeasResult(RESULT)).toBe(true);
    expect(isPedagogicalIdeasResult({ title: RESULT.title, ideas: [] })).toBe(false);
    expect(isPedagogicalIdeasResult({ ...RESULT, ideas: [{ title: "incomplete" }] })).toBe(false);
  });

  it("opens only results created by the pedagogical ideas module", () => {
    expect(pedagogicalIdeasResultFromJob(job(RESULT))).toEqual(RESULT);
    expect(pedagogicalIdeasResultFromJob(job(RESULT, "kmzh.generate"))).toBeNull();
    expect(pedagogicalIdeasResultFromJob(job({ title: "broken" }))).toBeNull();
  });

  it("builds a Word-compatible, escaped teacher document", () => {
    const html = pedagogicalIdeasHtml({ ...RESULT, title: "<Сабақ & идея>" }, "kk");
    expect(html).toContain("Сабақ мақсаты");
    expect(html).toContain("Пицца зертханасы");
    expect(html).toContain("Бағалау критерийлері");
    expect(html).toContain("&lt;Сабақ &amp; идея&gt;");
    expect(html).not.toContain("<Сабақ & идея>");
  });
});
