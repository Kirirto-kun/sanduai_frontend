import type { CompleteProjectResponse, ProjectState } from "./api";


export const SCIENCE_PROJECT_BASE_SECTIONS = [
  "introduction",
  "chapter_1",
  "chapter_2",
  "conclusion",
] as const;


export function hasActiveScienceProject(
  projects: readonly { active_job_id?: string | null }[],
): boolean {
  return projects.some((project) => Boolean(project.active_job_id));
}


export function scienceProjectOpenHref(
  project: Pick<ProjectState, "project_id" | "step"> & {
    sections?: Record<string, string>;
    sections_ready?: number;
    active_job_id?: string | null;
    active_job_kind?: string | null;
  },
): string {
  const base = `/dashboard/ai/scientific-projects/${encodeURIComponent(project.project_id)}`;
  if (project.active_job_id) {
    const page = project.active_job_kind === "science.regenerate"
      || project.active_job_kind === "science.finalize"
      ? "edit"
      : "generate";
    return `${base}/${page}?job=${encodeURIComponent(project.active_job_id)}`;
  }
  if (project.step <= 1) return `${base}/plan`;
  const hasAllSections = project.sections
    ? SCIENCE_PROJECT_BASE_SECTIONS.every(
        (section) => Boolean(project.sections?.[section]),
      )
    : (project.sections_ready ?? 0) >= SCIENCE_PROJECT_BASE_SECTIONS.length;
  return hasAllSections ? `${base}/edit` : `${base}/generate`;
}


export function completeScienceProjectFromState(
  state: ProjectState,
): CompleteProjectResponse | null {
  const finalFields = [
    "title_page",
    "annotation",
    "table_of_contents",
    "references",
    "appendix",
  ] as const;
  if (
    state.step < 6 ||
    !SCIENCE_PROJECT_BASE_SECTIONS.every((section) => Boolean(state.sections[section])) ||
    !finalFields.every((field) => Boolean(state.sections[field]))
  ) {
    return null;
  }

  return {
    project_id: state.project_id,
    language: state.language,
    title_page: state.sections.title_page,
    annotation: state.sections.annotation,
    table_of_contents: state.sections.table_of_contents,
    introduction: state.sections.introduction,
    chapter_1_theory: state.sections.chapter_1,
    chapter_2_research: state.sections.chapter_2,
    conclusion: state.sections.conclusion,
    references: state.sections.references,
    appendix: state.sections.appendix,
  };
}


export function scienceProjectProgressLabel(
  step: number,
  sectionsReady: number,
  language: "ru" | "kk",
  activeJobId: string | null = null,
): string {
  if (activeJobId) {
    return language === "kk" ? "Жоба жасалып жатыр" : "Проект создаётся";
  }
  if (step >= 6) return language === "kk" ? "Жоба дайын" : "Проект готов";
  if (sectionsReady >= SCIENCE_PROJECT_BASE_SECTIONS.length) {
    return language === "kk" ? "Соңғы тексеруге дайын" : "Готов к завершению";
  }
  if (step <= 1) return language === "kk" ? "Жоспар дайын" : "План готов";
  return language === "kk"
    ? `${sectionsReady} / 4 бөлім дайын`
    : `Готово разделов: ${sectionsReady} / 4`;
}
