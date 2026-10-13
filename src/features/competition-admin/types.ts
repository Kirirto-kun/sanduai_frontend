export type LocalizedText = { kk: string; ru: string };
export type CompetitionKind = "panorama" | "festival";
export type VerificationStatus = "verified" | "partial" | "unverified";

export type CompetitionDirection = {
  id: string;
  label: LocalizedText;
  roles: string[];
};

export type CompetitionSection = { id: string; label: LocalizedText };
export type CompetitionCriterion = CompetitionSection & {
  section_ids: string[];
  guidance: LocalizedText;
};

export type CompetitionPresetInput = {
  competition_id: string;
  competition_name: LocalizedText;
  kind: CompetitionKind;
  year: number;
  rule_version: string;
  organizer: string;
  official_source_url: string | null;
  last_verified_at: string | null;
  verification_status: VerificationStatus;
  verification_notes: LocalizedText;
  is_active: boolean;
  directions: CompetitionDirection[];
  structure: CompetitionSection[];
  rubric: CompetitionCriterion[];
  file_formats: Array<"docx" | "pdf">;
  languages: Array<"kk" | "ru">;
  time_limit_minutes: number | null;
  word_limit: number | null;
  deadline: string | null;
  video_requirements: LocalizedText;
  plagiarism_requirements: LocalizedText;
  format_requirements: LocalizedText;
  token_cost: number;
  action_token_cost: number;
  model: string;
};

export type CompetitionPreset = CompetitionPresetInput & { updated_at: string };
export type CompetitionAdminList = {
  items: CompetitionPreset[];
  current_year: number;
  warnings: string[];
};

export type EditorTab = "general" | "directions" | "document" | "criteria";
