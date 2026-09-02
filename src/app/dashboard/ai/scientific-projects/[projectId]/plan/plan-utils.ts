import type { DraftPlanResponse } from "../../../../../../lib/api";

export type SciencePlanEditableField =
  | "hypothesis"
  | "object"
  | "subject_field"
  | "methods"
  | "chapter_1_title"
  | "chapter_1_subsections"
  | "chapter_2_title"
  | "chapter_2_subsections"
  | "scientific_novelty"
  | "practical_significance";

function lines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function applyScienceProjectPlanEdit(
  plan: DraftPlanResponse,
  field: SciencePlanEditableField,
  rawValue: string,
): DraftPlanResponse {
  const value = rawValue.trim();
  const updatedPlan: DraftPlanResponse = {
    ...plan,
    methods: [...plan.methods],
    structure: {
      ...plan.structure,
      chapter_1_subsections: [...plan.structure.chapter_1_subsections],
      chapter_2_subsections: [...plan.structure.chapter_2_subsections],
    },
  };

  switch (field) {
    case "hypothesis":
      updatedPlan.hypothesis = value;
      break;
    case "object":
      updatedPlan.object = value;
      break;
    case "subject_field":
      updatedPlan.subject_field = value;
      break;
    case "methods":
      updatedPlan.methods = lines(rawValue);
      break;
    case "chapter_1_title":
      updatedPlan.structure.chapter_1_title = value;
      break;
    case "chapter_1_subsections":
      updatedPlan.structure.chapter_1_subsections = lines(rawValue);
      break;
    case "chapter_2_title":
      updatedPlan.structure.chapter_2_title = value;
      break;
    case "chapter_2_subsections":
      updatedPlan.structure.chapter_2_subsections = lines(rawValue);
      break;
    case "scientific_novelty":
      updatedPlan.scientific_novelty = value;
      break;
    case "practical_significance":
      updatedPlan.practical_significance = value;
      break;
  }

  return updatedPlan;
}
