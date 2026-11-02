import type { LessonMeta, LessonPlanRequest, LessonPlanResponse, LessonSubBlock } from "@/lib/api";
import { editableLessonPlan, lessonExportPayload, type EditableLessonPlan } from "@/features/lesson-plan/model";

export const CLASSIC_LESSON_KIND = "kmzh.classic.generate";
export const CLASSIC_LESSON_PATH = "/dashboard/ai/kmzh-classic";
export const CLASSIC_LESSON_KINDS = [CLASSIC_LESSON_KIND, "kmzh.generate"] as const;

export type ClassicLessonRequest = Omit<LessonPlanRequest, "planner_version"> & { planner_version: "legacy_v2" };
export type ClassicLessonPlan = EditableLessonPlan & { meta: LessonMeta & { lesson_objectives: string[] } };

export function createClassicLessonDraft(): ClassicLessonRequest {
  return {
    planner_version: "legacy_v2", schema_version: "v2", subject: "", grade: "", topic: "",
    teacher_name: "", section_name: "", lesson_number: "1", learning_objectives: [""],
    lesson_type: "", date: "", language: "kazakh", textbook_images: [], textbook_text: "", preferred_platform: null,
  };
}

/** Historical documents have no planner marker. Current open lessons always do. */
export function isClassicLessonResult(value: unknown): value is LessonPlanResponse {
  if (!value || typeof value !== "object") return false;
  const plan = value as Partial<LessonPlanResponse>;
  return plan.planner_version !== "open_lesson_v1" && Boolean(plan.meta) && Array.isArray(plan.flow);
}

export function editableClassicLesson(plan: LessonPlanResponse): ClassicLessonPlan {
  const canonical = editableLessonPlan(plan);
  const objectives = plan.meta.lesson_objectives;
  return { ...canonical, meta: { ...canonical.meta, lesson_objectives: Array.isArray(objectives) ? objectives : objectives ? [objectives] : [] } };
}

export function updateClassicLessonBlock(plan: ClassicLessonPlan, stageIndex: number, blockIndex: number, patch: Partial<LessonSubBlock>): ClassicLessonPlan {
  return {
    ...plan,
    flow: plan.flow.map((stage, si) => si !== stageIndex ? stage : {
      ...stage, sub_blocks: stage.sub_blocks.map((block, bi) => bi !== blockIndex ? block : { ...block, ...patch }),
    }),
  };
}

/** Word receives the edited canonical blocks; compatibility tasks are never sent. */
export const classicLessonExportPayload = (plan: ClassicLessonPlan) => lessonExportPayload(plan);
