import { describe, expect, it } from "vitest";
import { trainingMarkdown } from "./document";
import type { Exercise, TrainingResult } from "./types";

const exercise: Exercise = {
  title: "Exercise title", purpose: "Exercise purpose", duration_minutes: 15,
  materials: ["Exercise material"], organization: "Exercise organization", host_script: "Exact facilitator words",
  instructions: "Exact participant instruction", steps: ["First concrete step", "Second concrete step"],
  rules: ["Participation is voluntary"], tasks: ["Ready case text"], questions: ["Specific discussion question"],
  example_answers: ["Possible solution"], expected_result: "Observable exercise result", transition: "Words linking the next stage",
  accessibility_alternative: "Seated accessible alternative",
};
const result: TrainingResult = {
  title: "Team workshop", topic: "A specific workshop topic", event_type: "psychological_training", output_mode: "full_package",
  audience: "Teachers", participant_count: 20, duration_minutes: 45, format: "hybrid", language: "kk", cost_tokens: 30,
  assumptions: ["Agreed assumption"], goal: "Overall goal", objectives: ["Precise objective"], outcomes: ["Measurable outcome"],
  methods: ["Workshop method"], materials: ["Organizer material"], preparation: ["Preparation task"],
  safety_principles: ["Observer role is available"], safety_note: "Educational work does not replace clinical care", grouping: "Divide into four groups",
  concept: { name: "Concept name", rationale: "Concept rationale", final_product: "Shared final product" },
  stages: [{ ...exercise, id: "internal-stage-id", start_minute: 0, end_minute: 15 }],
  ideas: [{ title: "Idea title", goal: "Idea goal", mechanic: "Idea mechanic", expected_result: "Idea outcome" }],
  games: [{ ...exercise, title: "Game title" }], handouts: [{ title: "Handout title", instructions: "Handout instruction", content: "Entire printable card text" }],
  slides: [{ number: 1, title: "Slide title", on_screen: "Short slide text", visual: "Slide visual", speaker_notes: "Slide speaker notes", participant_action: "Slide participant action" }],
  practical_result: "Tangible product", closing_script: "Complete closing speech",
  reflection: { title: "Reflection title", instructions: "Reflection instruction", host_script: "Reflection speech", questions: ["Reflection question"] },
  evaluation: [{ criterion: "Evaluation criterion", evidence: "Observable evidence" }], feedback_questions: ["Feedback question"],
  adaptations: [{ situation: "No internet", instruction: "Offline alternative instructions" }],
  ai_prompts: [{ title: "AI activity title", prompt: "Complete ready prompt", critical_check: "Check the answer critically" }],
};

describe("complete training text export", () => {
  it("retains every facilitator instruction, activity, handout and slide field", () => {
    const markdown = trainingMarkdown(result);
    const contentKeys = ["assumptions", "goal", "objectives", "outcomes", "methods", "materials", "preparation", "safety_principles", "safety_note", "grouping", "concept", "stages", "ideas", "games", "handouts", "slides", "practical_result", "closing_script", "reflection", "evaluation", "feedback_questions", "adaptations", "ai_prompts"];
    function checkStrings(value: unknown, key = "") {
      if (key === "id") return;
      if (typeof value === "string") expect(markdown, key).toContain(value);
      else if (Array.isArray(value)) value.forEach(item => checkStrings(item, key));
      else if (value && typeof value === "object") Object.entries(value).forEach(([childKey, item]) => checkStrings(item, childKey));
    }
    for (const key of contentKeys) checkStrings(result[key as keyof TrainingResult], key);
    expect(markdown).toContain("**Басталуы, минут:** 0");
    expect(markdown).not.toContain("internal-stage-id");
    expect(markdown).not.toContain("cost_tokens");
  });

  it.each([
    ["kk", "Психологиялық тренинг", "Толық пакет", "Аралас"],
    ["ru", "Психологический тренинг", "Полный пакет", "Смешанный"],
    ["en", "Psychological training", "Complete package", "Hybrid"],
    ["ky", "Психологиялык тренинг", "Толук топтом", "Аралаш"],
    ["uz", "Psixologik trening", "To‘liq to‘plam", "Aralash"],
  ] as const)("uses readable metadata in the saved material language %s", (language, event, mode, format) => {
    const markdown = trainingMarkdown({ ...result, language });
    for (const label of [event, mode, format]) expect(markdown).toContain(label);
    expect(markdown).not.toContain("psychological_training");
    expect(markdown).not.toContain("full_package");
  });

  it("omits absent optional sections without leaking null or empty lists", () => {
    const markdown = trainingMarkdown({ ...result, reflection: null, ai_prompts: [], games: [] });
    expect(markdown).not.toContain("null");
    expect(markdown).not.toContain("ЖИ тапсырмалары");
    expect(markdown).not.toContain("Креативті интерактивтер");
  });
});
