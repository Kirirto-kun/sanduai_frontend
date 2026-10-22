import type { LessonPlanRequest, LessonPlanResponse, LessonSubBlock } from "@/lib/api";

export type EditableLessonPlan = Omit<LessonPlanResponse, "flow"> & {
  flow: (LessonPlanResponse["flow"][number] & { sub_blocks: LessonSubBlock[] })[];
};

export type LessonPlanDraft = LessonPlanRequest & { selected_objective_texts?: string[] };

export const createLessonDraft = (): LessonPlanDraft => ({
  planner_version: "open_lesson_v1", schema_version: "v2",
  subject: "", grade: "", topic: "", school_name: "", teacher_name: "",
  section_name: "", lesson_number: "1", lesson_type: "new_lesson",
  learning_objectives: [""], selected_objective_ids: [], language: "kazakh",
  teaching_language: "kazakh", duration: 45, student_count: null,
  inclusive_support: "", resources: [], additional_requirements: "", date: "",
  textbook_images: [], textbook_text: "", preferred_platform: null,
});

export const lines = (value: string): string[] => value.split("\n").map((line) => line.trim()).filter(Boolean);

// Keep v2 as the only editable source of truth, including when opening old history.
export function editableLessonPlan(plan: LessonPlanResponse): EditableLessonPlan {
  return {
    ...plan,
    flow: plan.flow.map((stage) => {
      const { tasks, ...rest } = stage;
      return {
        ...rest,
        sub_blocks: stage.sub_blocks?.length ? stage.sub_blocks : (tasks ?? []).map((task) => ({
          ...task, time: task.time_marker ?? "", phase_name: task.method_name,
          descriptors: task.descriptors.map((text) => ({ text, points: 0 })),
          resource_urls: [], resource_materials: task.resources ? [task.resources] : [],
        })),
      };
    }),
  };
}

export function lessonExportPayload(plan: EditableLessonPlan): LessonPlanResponse {
  return {
    ...plan,
    flow: plan.flow.map((stage) => {
      // Compatibility tasks may arrive alongside sub_blocks. Never send a stale duplicate.
      const { tasks: _tasks, ...canonical } = stage;
      void _tasks;
      return canonical;
    }),
  };
}

export function updateLessonBlock(plan: EditableLessonPlan, stageIndex: number, blockIndex: number, patch: Partial<LessonSubBlock>): EditableLessonPlan {
  return {
    ...plan,
    flow: plan.flow.map((stage, si) => si !== stageIndex ? stage : {
      ...stage, sub_blocks: stage.sub_blocks.map((block, bi) => bi !== blockIndex ? block : { ...block, ...patch }),
    }),
  };
}

export function cleanLessonRequest(draft: LessonPlanDraft): LessonPlanRequest {
  const { selected_objective_texts = [], ...request } = draft;
  return {
    ...request, planner_version: "open_lesson_v1", schema_version: "v2",
    subject: draft.subject.trim(), grade: draft.grade.trim(), topic: draft.topic.trim(),
    teacher_name: draft.teacher_name.trim(), section_name: draft.section_name.trim(),
    learning_objectives: [...new Set([...draft.learning_objectives, ...selected_objective_texts].map((value) => value.trim()).filter(Boolean))],
    date: draft.date?.trim() || null, textbook_text: draft.textbook_text?.trim() || null,
    resources: (draft.resources ?? []).map((value) => value.trim()).filter(Boolean),
  };
}

export function lessonMinutes(plan: EditableLessonPlan): number | null {
  const blocks = plan.flow.flatMap((stage) => stage.sub_blocks);
  if (!blocks.length || blocks.some((block) => block.minutes == null)) return null;
  return blocks.reduce((sum, block) => sum + (block.minutes ?? 0), 0);
}

export function safeSourceUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : undefined; }
  catch { return undefined; }
}
