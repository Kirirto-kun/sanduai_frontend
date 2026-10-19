export const MASTERCLASS_LANGUAGES = ["kk", "ru", "en", "ky"] as const;
export type MasterclassLanguage = (typeof MASTERCLASS_LANGUAGES)[number];
export type MasterclassLabels = Record<MasterclassLanguage, string>;
export type MasterclassOption = { id: string; label: MasterclassLabels };
export type MasterclassAudienceOption = MasterclassOption & { institution_types: string[] };
export type MasterclassInteractiveKind = "quiz" | "matching" | "wheel" | "quest" | "hand_tracking" | "three_d" | "board" | "timeline";
export type MasterclassInteractiveTemplate = MasterclassOption & { kind: MasterclassInteractiveKind; prompt: string };
export type MasterclassExportTemplate = {
  accent_color: string;
  font_family: "Arial" | "Calibri" | "DejaVu Sans";
  footer: MasterclassLabels;
};

export type MasterclassConfigInput = {
  institutions: MasterclassOption[];
  audiences: MasterclassAudienceOption[];
  formats: MasterclassOption[];
  styles: MasterclassOption[];
  directions: MasterclassOption[];
  difficulties: MasterclassOption[];
  duration_options: number[];
  min_duration_minutes: number;
  max_duration_minutes: number;
  languages: MasterclassLanguage[];
  token_cost: number;
  topics_token_cost: number;
  action_token_cost: number;
  model: string;
  system_prompt: string;
  export_template: MasterclassExportTemplate;
  file_formats: Array<"docx" | "pdf" | "pptx" | "zip">;
  interactive_templates: MasterclassInteractiveTemplate[];
};

export type MasterclassConfig = MasterclassConfigInput & { version: number; updated_at: string };
export type MasterclassConfigUpdate = { expected_version: number; config: MasterclassConfigInput };
export type MasterclassAdminTab = "audiences" | "formats" | "generation" | "prompts" | "materials";
