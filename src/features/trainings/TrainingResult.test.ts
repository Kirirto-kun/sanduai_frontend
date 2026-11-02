import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { GenerationJob } from "@/lib/api";
import TrainingResultView from "./TrainingResult";
import type { Exercise, OutputMode, TrainingResult } from "./types";

function exercise(prefix: string, duration = 15): Exercise {
  return {
    title: `${prefix} title`, purpose: `${prefix} purpose`, duration_minutes: duration,
    materials: [`${prefix} material`], organization: `${prefix} organization`,
    host_script: `${prefix} exact facilitator speech`, instructions: `${prefix} participant instruction`,
    steps: [`${prefix} first step`, `${prefix} second step`], rules: [`${prefix} voluntary participation rule`],
    tasks: [`${prefix} ready case text`], questions: [`${prefix} discussion question`],
    example_answers: [`${prefix} possible answer`], expected_result: `${prefix} observable result`,
    transition: `${prefix} transition speech`, accessibility_alternative: `${prefix} accessible alternative`,
  };
}

function fullPackage(): TrainingResult {
  return {
    title: "Facilitator package", topic: "Respectful team communication", event_type: "psychological_training",
    output_mode: "full_package", audience: "School teachers", participant_count: 20, duration_minutes: 45,
    format: "hybrid", language: "kk", cost_tokens: 30, assumptions: ["Accepted condition"],
    goal: "Practice respectful feedback", objectives: ["Listen", "Compare solutions", "Choose an action"],
    outcomes: ["Observable outcome one", "Observable outcome two", "Observable outcome three"],
    methods: ["Collaborative case analysis"], materials: ["Organizer paper and markers"],
    preparation: ["Prepare the room", "Print the cards", "Check accessible participation"],
    safety_principles: ["Participation and sharing are voluntary", "Participants may choose an observer role"],
    safety_note: "Educational activities do not replace clinical care", grouping: "Four groups of five participants",
    concept: { name: "Feedback laboratory", rationale: "Compare concrete communication choices", final_product: "Shared team agreement" },
    stages: Array.from({ length: 3 }, (_, index) => ({ ...exercise(`Stage ${index + 1}`), id: `stage-${index + 1}`, start_minute: index * 15, end_minute: (index + 1) * 15 })),
    ideas: Array.from({ length: 5 }, (_, index) => ({ title: `Idea ${index + 1}`, goal: `Idea goal ${index + 1}`, mechanic: `Idea mechanism ${index + 1}`, expected_result: `Idea result ${index + 1}` })),
    games: Array.from({ length: 5 }, (_, index) => exercise(`Game ${index + 1}`, 5)),
    handouts: Array.from({ length: 3 }, (_, index) => ({ title: `Card ${index + 1}`, instructions: `Card instruction ${index + 1}`, content: `Complete ready card text ${index + 1}` })),
    slides: Array.from({ length: 5 }, (_, index) => ({ number: index + 1, title: `Slide ${index + 1}`, on_screen: `Slide screen text ${index + 1}`, visual: `Slide visual ${index + 1}`, speaker_notes: `Slide speaker note ${index + 1}`, participant_action: `Slide participant action ${index + 1}` })),
    practical_result: "Written personal action plan", closing_script: "Complete closing words for the facilitator",
    reflection: { title: "One next step", instructions: "Write one action privately", host_script: "You may share or keep the note", questions: ["What will you use tomorrow?", "What support would help?"] },
    evaluation: Array.from({ length: 3 }, (_, index) => ({ criterion: `Criterion ${index + 1}`, evidence: `Evidence ${index + 1}` })),
    feedback_questions: ["What practical tool will you use?"],
    adaptations: [{ situation: "Without internet", instruction: "Use printed cases" }, { situation: "Large group", instruction: "Assign table facilitators" }, { situation: "Seated participation", instruction: "Keep all tasks available at the table" }],
    ai_prompts: [{ title: "Compare anonymous cases", prompt: "Write two fictional classroom cases without personal information", critical_check: "Check age suitability and remove unsupported claims" }],
  };
}

function focusedResult(mode: OutputMode): TrainingResult {
  const full = fullPackage();
  if (["full_scenario", "full_package", "masterclass"].includes(mode)) return { ...full, output_mode: mode };
  if (mode === "express") return {
    ...full, output_mode: mode, duration_minutes: 10,
    stages: [3, 4, 3].map((duration, index, durations) => ({ ...exercise(`Express ${index + 1}`, duration), id: `express-${index + 1}`, start_minute: durations.slice(0, index).reduce((sum, value) => sum + value, 0), end_minute: durations.slice(0, index + 1).reduce((sum, value) => sum + value, 0) })),
  };
  return {
    ...full, output_mode: mode, objectives: [], outcomes: [], methods: [], materials: [], preparation: [], grouping: "",
    stages: [], ideas: mode === "ideas" ? full.ideas : [], games: mode === "games" ? full.games : [],
    handouts: mode === "handouts" ? full.handouts : [], slides: mode === "presentation_plan" ? full.slides : [],
    practical_result: "", reflection: null, closing_script: "", evaluation: [], feedback_questions: [], adaptations: [], ai_prompts: [],
  };
}

function render(result: TrainingResult, language: "ru" | "kk" = "ru"): string {
  const job = { id: "30bdc3b2-41e6-4399-877c-cbab8e93a5d9", kind: "training.generate", status: "completed", result } as unknown as GenerationJob;
  return renderToStaticMarkup(createElement(TrainingResultView, { result, job, language }));
}

describe("training result read view", () => {
  it("renders every nested facilitator, exercise, handout, slide and safety field", () => {
    const result = fullPackage();
    const html = render(result);
    const metadata = new Set(["event_type", "output_mode", "format", "language", "id"]);
    function checkContent(value: unknown, key = "") {
      if (metadata.has(key)) return;
      if (typeof value === "string" && value) expect(html, key).toContain(value);
      else if (Array.isArray(value)) value.forEach(item => checkContent(item, key));
      else if (value && typeof value === "object") Object.entries(value).forEach(([childKey, item]) => checkContent(item, childKey));
    }
    checkContent(result);
    expect(html).toContain("0–15");
    expect(html).toContain("30–45");
    expect(html).toContain("Смешанный");
    expect(html).toContain("Скачать Word");
    expect(html).toContain("Скопировать всё");
    expect(html).toContain("Скачать текст");
    expect(html.match(/<details[^>]*\bopen=""/g)).toHaveLength(2);
    for (const match of html.matchAll(/href="#(training-[^"]+)"/g)) expect(html).toContain(`id="${match[1]}"`);
  });

  it.each(["ideas", "full_scenario", "masterclass", "games", "handouts", "presentation_plan", "full_package", "express"] as const)("renders the %s contract with optional sections absent when appropriate", mode => {
    const html = render(focusedResult(mode), "kk");
    expect(html).toContain('id="training-passport"');
    expect(html).toContain('id="training-concept"');
    expect(html).toContain('id="training-safety"');
    expect(html).not.toContain("undefined");
    expect(html).not.toContain(">null<");
    if (["ideas", "games", "handouts", "presentation_plan"].includes(mode)) {
      expect(html).not.toContain('id="training-timeline"');
      expect(html).not.toContain('id="training-scenario"');
      expect(html).not.toContain('id="training-outcome"');
      expect(html).not.toContain('id="training-ai"');
      const section = mode === "presentation_plan" ? "slides" : mode;
      expect(html).toContain(`id="training-${section}"`);
    } else {
      expect(html).toContain('id="training-timeline"');
      expect(html).toContain('id="training-scenario"');
      expect(html).toContain('id="training-outcome"');
    }
  });

  it("keeps generated HTML-like text inert across titles, speeches, cards and slides", () => {
    const unsafe = '<script>alert("unsafe")</script><img src=x onerror="unsafe"> & text';
    const result = fullPackage();
    result.title = unsafe;
    result.stages[0].host_script = unsafe;
    result.handouts[0].content = unsafe;
    result.slides[0].on_screen = unsafe;
    const html = render(result);
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;alert(&quot;unsafe&quot;)&lt;/script&gt;");
    expect(html).toContain("&lt;img src=x onerror=&quot;unsafe&quot;&gt; &amp; text");
  });
});
