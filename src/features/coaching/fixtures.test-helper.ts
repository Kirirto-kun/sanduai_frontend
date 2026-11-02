import { STAGE_KINDS } from "./model";
import type { CoachingResult } from "./types";

export function coachingFixture(): CoachingResult {
  let minute = 0;
  const durations = [3, 4, 5, 3, 15, 2, 5, 5, 3];
  return {
    title: "Feedback workshop", topic: "Constructive classroom feedback", audience: "Educators", duration_minutes: 45,
    participant_count: 20, group_count: 4, format: "hybrid", language: "kk", cost_tokens: 30,
    goal: "Design helpful feedback", assumptions: ["Accepted organizer condition"], objectives: ["Compare feedback methods"], outcomes: ["Each group creates a classroom tool"],
    materials: ["Organizer resource"], preparation: ["Prepare the room"],
    concept: { name: "Feedback lab", description: "Transform a teaching dilemma", final_product: "Usable feedback card" },
    grouping: { method: "Case fragments", instructions: "Join matching fragments", groups: Array.from({ length: 4 }, (_, i) => ({ name: `Group ${i + 1}`, task: `Group task ${i + 1}`, expected_result: `Group product ${i + 1}` })) },
    stages: STAGE_KINDS.map((kind, i) => {
      const start = minute; minute += durations[i];
      return { kind, title: `Stage ${i + 1}`, method: `Method ${i + 1}`, purpose: `Purpose ${i + 1}`, host_script: `Exact facilitator speech ${i + 1}`, participant_action: `Participant action ${i + 1}`, transition: `Transition speech ${i + 1}`, expected_result: `Stage product ${i + 1}`, materials: [`Stage material ${i + 1}`], duration_minutes: durations[i], participant_minutes: Math.max(0, durations[i] - 1), start_minute: start, end_minute: minute };
    }),
    practical_tasks: (["analysis", "creation", "presentation"] as const).map((kind, i) => ({ kind, title: `Practical task ${i + 1}`, method: `Practical method ${i + 1}`, purpose: `Practical purpose ${i + 1}`, host_script: `Practical facilitator speech ${i + 1}`, participant_action: `Practical participant action ${i + 1}`, product_example: `Complete product example ${i + 1}`, materials: [`Practical material ${i + 1}`], steps: [`Concrete first step ${i + 1}`, `Concrete second step ${i + 1}`], criteria: [`Practical criterion ${i + 1}`], duration_minutes: 5 })),
    handouts: (["grouping", "task", "case", "reflection", "evaluation"] as const).map((kind, i) => ({ kind, title: `Handout ${i + 1}`, instructions: `Handout instructions ${i + 1}`, content: `Complete printable content ${i + 1}` })),
    slides: Array.from({ length: 5 }, (_, i) => ({ number: i + 1, title: `Slide ${i + 1}`, on_screen: `Screen text ${i + 1}`, speaker_notes: `Slide speaker notes ${i + 1}`, visual: `Suggested visual ${i + 1}`, participant_action: `Slide participant action ${i + 1}` })),
    reflection: { title: "One next action", instructions: "Choose your classroom action", host_script: "Name the change you will try", questions: ["What did you learn?", "Where will you apply it?"] },
    evaluation: [{ criterion: "Applicable classroom tool", evidence: "Each teacher explains one use" }], closing_script: "Full closing speech and next action",
    adaptations: [{ situation: "No internet", instruction: "Use paper case cards" }], national_values: [{ value: "Respect", action: "Offer feedback without judging a colleague" }],
    ai_tools: [{ name: "Optional AI helper", purpose: "Compare anonymous examples", prompt: "Generate two fictional feedback cases", offline_alternative: "Use printed sample cases", critical_check: "Check pedagogical suitability" }],
    quality_checks: [{ code: "timing", passed: true }], participant_activity_percent: 80,
  };
}
