export type LocalizedLabel = Record<string, string>;
export type CyclogramSection = { id: string; title: LocalizedLabel; kind: string };
export type CyclogramGroup = { id: string; label: LocalizedLabel; default_age: number };
export type CyclogramLanguage = { code: string; label: string };
export type CyclogramWordTemplate = {
  filename: string | null;
  storage_key: string | null;
  sha256: string | null;
  size: number | null;
  uploaded_at: string | null;
};
export type CyclogramConfig = {
  template_version: string;
  regulatory_label: string;
  sections: CyclogramSection[];
  age_groups: CyclogramGroup[];
  languages: CyclogramLanguage[];
  token_cost: number;
  cell_token_cost: number;
  topic_token_cost: number;
  teacher_name: string;
};
export type CyclogramAdminConfig = CyclogramConfig & {
  prompt: string;
  model: string;
  word_template: CyclogramWordTemplate | null;
  updated_at: string | null;
};
export type CyclogramAdminUpdate = Omit<CyclogramAdminConfig, "teacher_name" | "updated_at">;
export type CyclogramInput = {
  organization: string;
  group_id: string;
  age: number;
  group_name: string;
  teacher_name: string;
  week_start: string;
  weekly_theme: string;
  notes: string;
  language: string;
  source_id?: string;
};
export type CyclogramRow = { section_id: string; cells: string[] };
export type CyclogramContent = { rows: CyclogramRow[] };
export type CyclogramDocument = CyclogramInput & {
  id: string;
  week_end: string;
  content: CyclogramContent;
  sections: CyclogramSection[];
  template_version: string;
  regulatory_label: string;
  token_cost: number;
  created_at: string;
  updated_at: string;
  version: number;
};
export type CyclogramSummary = Omit<CyclogramDocument, "content" | "sections" | "regulatory_label">;
export type CellAction = "regenerate" | "shorten" | "expand" | "other_game";
export type CellChange = { section_id: string; day_index: number; text: string };
export type CyclogramTopicsResult = { topics: string[] };
export type CyclogramCellResult = {
  document_id?: string;
  section_id?: string;
  day_index?: number;
  text?: string;
  version?: number;
  document?: CyclogramDocument;
};
export type CyclogramGenerateResult = {
  document_id?: string;
  cyclogram_id?: string;
  document?: CyclogramDocument;
};
