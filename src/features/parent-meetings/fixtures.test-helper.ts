import type { MeetingResult } from "./types";
import { STAGE_KINDS } from "./model";

export function meetingFixture(compact = false): MeetingResult {
  const durations = compact ? [3, 3, 4, 8, 4, 3, 3, 2] : [3, 5, 5, 2, 13, 5, 4, 5, 3];
  let minute = 0;
  const kinds = compact ? STAGE_KINDS.filter(x => x !== "grouping") : STAGE_KINDS;
  const tasks: MeetingResult["interactive_tasks"] = (["case", "laboratory"] as const).map((kind, i) => ({
    kind, title: `Task ${i + 1}`, method: `Practical method ${i + 1}`, purpose: `Purpose ${i + 1}`,
    materials: [`Task resource ${i + 1}`], duration_minutes: compact ? 4 : i === 0 ? 6 : 7,
    steps: [`First step ${i + 1}`, `Second step ${i + 1}`], host_script: `Task host speech ${i + 1}`,
    participant_action: `Parent action ${i + 1}`, case_text: kind === "case" ? "A fictional child returns home upset and does not want to describe what happened." : "",
    product_example: `Complete worked example ${i + 1}`, expected_result: `Practical result ${i + 1}`,
  }));
  return {
    schema_version: "parent-meeting.v1", title: "Listening together", topic: "Listening to children without comparisons", organization: "school",
    class_group: "3 A", institution_name: "Example school", duration_minutes: compact ? 30 : 45, participant_count: 20,
    delivery_format: "hybrid", language: "ru", tokens_used: 30, goal: "Practise supportive communication",
    objectives: ["Recognise emotions", "Practise a response"], outcomes: ["Each parent writes a phrase", "Each parent chooses a next action"],
    assumptions: ["Organizer accepted initial conditions"], selected_format: "interactive", format_reason: "Practice and discussion suit this topic",
    concept: { name: "Listening bridge", description: "A concrete conversation connects parent and child", final_product: "A personal conversation plan" },
    preparation: ["Prepare cards", "Arrange seats"], materials: ["Paper and pens"],
    stages: kinds.map((kind, i) => {
      const start = minute; minute += durations[i];
      return { kind, title: `Stage ${i + 1}`, method: `Stage method ${i + 1}`, purpose: `Stage purpose ${i + 1}`,
        materials: [`Stage resource ${i + 1}`], duration_minutes: durations[i], host_script: `Ready host speech ${i + 1}`,
        participant_action: `Stage parent action ${i + 1}`, instructions: `Complete instructions ${i + 1}`,
        expected_result: `Expected stage outcome ${i + 1}`, transition: `Natural spoken transition ${i + 1}`,
        start_minute: start, end_minute: minute };
    }), interactive_tasks: tasks,
    invitation: { title: "Join our parent meeting", text: "We will practise listening together", date: "[Date]", time: "[Time]", venue: "[Venue]" },
    slides: Array.from({ length: 8 }, (_, i) => ({ number: i + 1, title: `Slide ${i + 1}`, on_screen: `Complete screen text ${i + 1}`, visual: `Suggested visual ${i + 1}` })),
    training_cards: [{ title: "Listening card", instructions: "Read privately", content: "Complete first printable card" }, { title: "Response card", instructions: "Choose a supportive phrase", content: "Complete second printable card" }],
    questionnaire: { title: "A short family questionnaire", anonymous: true, instructions: "Do not add names",
      questions: Array.from({ length: 5 }, (_, i) => ({ question: `Parent survey question ${i + 1}`, options: ["Often", "Sometimes", "Not yet"] })) },
    worksheets: tasks.map((x, i) => ({ task_title: x.title, instructions: `Worksheet instructions ${i + 1}`, content: `Ready printable worksheet with blank answer area ${i + 1}`, conclusion_question: `What will you try ${i + 1}?` })),
    reflection: { title: "One small next step", instructions: "Write your private plan", host_script: "Choose one action for tomorrow", questions: ["What did you notice?", "What will you try next?"] },
    reflection_sheet: "My next action: __________", recommendations: Array.from({ length: 5 }, (_, i) => `Specific recommendation ${i + 1}`),
    closing_script: "Thank you for building this partnership; try your chosen step tomorrow", protocol_template: "Minutes template\nDiscussed: __________\nDecisions: __________\nResponsible person: __________",
    national_values: [{ value: "Respect", action: "Listen without comparing children" }],
    digital_tools: [{ name: "Presentation helper", purpose: "Illustrate supportive replies", prompt: "Create a fictional conversation illustration", offline_alternative: "Use printed cards" }],
    safety_notes: ["Voluntary participation", "No family secrets", "Use fictional cases"], references: ["Organizer supplied source"],
    quality_checks: [{ code: "timing", label: "Exact timeline", passed: true }],
  };
}
