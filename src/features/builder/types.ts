import type { ContentLanguage } from "@/lib/content-languages";

export type BuilderProjectType =
  | "website"
  | "game"
  | "3d"
  | "hand_tracking"
  | "camera"
  | "education"
  | "webapp"
  | "platform"
  | "dashboard"
  | "custom";

export type BuilderVisibility = "private" | "link" | "public";
export type BuilderContentLanguage = "auto" | ContentLanguage;
export type BuilderDevice = "mobile" | "tablet" | "desktop";
export type BuilderTab = "preview" | "files" | "code" | "console" | "assets" | "versions";

export type BuilderAsset = {
  id: string;
  filename: string;
  mime_type: string;
  type: string;
  storage_url: string;
  size_bytes?: number;
  size?: number;
  created_at?: string;
};

export type BuilderMessage = {
  role: "user" | "assistant" | "system" | string;
  content: string;
  created_at?: string;
};

export type BuilderProject = {
  id: string;
  title: string;
  description: string;
  project_type: BuilderProjectType;
  content_language: BuilderContentLanguage;
  framework: string;
  files: Record<string, string>;
  assets: BuilderAsset[];
  chat_history: BuilderMessage[];
  plan?: string[];
  current_version: number;
  revision?: number;
  visibility: BuilderVisibility;
  deployment_url: string | null;
  published_version: number | null;
  share_url?: string | null;
  token_usage: number;
  allow_duplicate?: boolean;
  created_at: string;
  updated_at: string;
};

export type BuilderProjectSummary = Omit<BuilderProject, "files" | "chat_history" | "plan"> & {
  preview_html?: string | null;
};

export type BuilderVersion = {
  id?: string;
  number?: number;
  version?: number;
  parent_version?: number | null;
  prompt: string;
  summary?: string;
  created_at: string;
  changed_files: string[];
};

export type BuilderConfig = {
  costs: Record<string, number>;
  categories?: BuilderProjectType[];
  content_languages?: BuilderContentLanguage[];
  accepted_asset_types: Record<string, string[]>;
  max_asset_bytes?: number;
  limits?: Record<string, number>;
};

export type BuilderProjectsResponse = {
  items: BuilderProjectSummary[];
  total: number;
  limit?: number;
  offset?: number;
};

export type BuilderBuildMode = "generate" | "edit" | "fix";

export type BuilderBuildRequest = {
  prompt: string;
  expected_version: number;
  expected_revision?: number;
  asset_ids: string[];
  mode: BuilderBuildMode;
  errors?: string[];
  max_cost?: number;
};

export type BuilderEstimate = {
  tokens: number;
  base_tokens: number;
  media_tokens: number;
  complexity: "standard" | "complex";
};

export type BuilderBuildStatus = {
  status: "unknown" | "pending" | "succeeded" | "failed" | "billing_error";
  project: BuilderProject | null;
  job_id: string | null;
};

export type BuilderConsoleEntry = {
  id: string;
  level: "log" | "warn" | "error";
  message: string;
  createdAt: number;
};

export type PendingAsset = {
  id: string;
  file: File;
  previewUrl?: string;
};
