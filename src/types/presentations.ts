export type PresentationMode = "classic" | "creative";

export type PresentationStatus =
  | "draft"
  | "planning"
  | "plan_ready"
  | "awaiting_approval"
  | "approved"
  | "queued"
  | "generating"
  | "review_required"
  | "needs_review"
  | "ready"
  | "partial_failed"
  | "legacy_read_only"
  | "failed"
  | "cancelled"
  | string;

export type SlideStatus =
  | "planned"
  | "approved"
  | "queued"
  | "generating"
  | "uploading"
  | "qa"
  | "needs_review"
  | "accepted"
  | "ready"
  | "failed"
  | string;

export interface StyleAnchor {
  visual_language?: string;
  palette?: string[];
  illustration_style?: string;
  typography_mood?: string;
  consistency_rules?: string[];
  [key: string]: unknown;
}

export interface ExactTextItem {
  id?: string;
  text: string;
  importance?: "primary" | "secondary" | "supporting" | string;
}

export interface DiagramIntent {
  kind?: string;
  nodes?: Array<{ id?: string; label: string; [key: string]: unknown }>;
  relations?: Array<{
    from: string;
    to: string;
    label?: string;
    [key: string]: unknown;
  }>;
  description?: string;
  [key: string]: unknown;
}

export interface PlanSlide {
  id?: string;
  slide_key: string;
  order: number;
  order_index?: number;
  role?: string;
  title: string;
  purpose?: string;
  body?: string;
  bullets?: string[];
  exact_text?: Array<string | ExactTextItem>;
  facts?: string[];
  visual_scene?: string;
  diagram_intent?: DiagramIntent | null;
  image_prompt?: string;
  speaker_notes?: string;
  layout?: string;
  content?: Record<string, unknown>;
  visual?: Record<string, unknown>;
  blocks?: Array<Record<string, unknown>>;
  spec?: SlideSpec;
  [key: string]: unknown;
}

export interface PresentationPlan {
  id: string;
  presentation_id?: string;
  version?: number;
  revision: number;
  status?: string;
  title: string;
  style_anchor?: StyleAnchor | null;
  slides: PlanSlide[];
  approved_at?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface QaWarning {
  id?: string;
  code?: string;
  severity?: "info" | "warning" | "critical" | string;
  message: string;
  expected?: string;
  detected?: string;
  [key: string]: unknown;
}

export interface SlideVersion {
  id: string;
  version?: number;
  status?: SlideStatus;
  image_url?: string | null;
  preview_url?: string | null;
  asset_url?: string | null;
  artifact_url?: string | null;
  created_at?: string;
  qa_warnings?: QaWarning[];
  prompt?: string;
  [key: string]: unknown;
}

export interface SlideSpec {
  title?: string;
  role?: string;
  purpose?: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  layout?: string;
  theme?: string;
  speaker_notes?: string;
  review_status?: string;
  blocks?: Array<Record<string, unknown>>;
  content?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface PresentationSlide {
  id?: string;
  slide_key: string;
  order: number;
  status: SlideStatus;
  title?: string;
  role?: string;
  purpose?: string;
  spec?: SlideSpec;
  image_url?: string | null;
  preview_url?: string | null;
  asset_url?: string | null;
  artifact_url?: string | null;
  active_version_id?: string | null;
  versions?: SlideVersion[];
  qa_warnings?: QaWarning[];
  error?: string | null;
  [key: string]: unknown;
}

export interface GenerationSummary {
  id?: string;
  job_id?: string;
  status?: PresentationStatus;
  completed_slides?: number;
  total_slides?: number;
  failed_slides?: number;
  [key: string]: unknown;
}

export interface PresentationLegacyArtifact {
  kind: "pptx" | "pdf" | "thumbnail" | "image" | string;
  mime_type: string;
  size: number;
  sha256: string;
  relative_path: string;
  download_url?: string | null;
}

export interface PresentationProject {
  id: string;
  title: string;
  mode: PresentationMode;
  status: PresentationStatus;
  language: string;
  subject?: string | null;
  grade?: string | null;
  audience?: string | null;
  slide_count?: number;
  created_at: string;
  updated_at?: string | null;
  expires_at?: string | null;
  active_plan?: PresentationPlan | null;
  approved_plan?: PresentationPlan | null;
  active_plan_job_id?: string | null;
  active_generation?: GenerationSummary | null;
  latest_job?: JobState | null;
  slides?: PresentationSlide[];
  style_anchor?: StyleAnchor | null;
  theme_id?: string | null;
  theme?: string | null;
  source_kind?: string | null;
  options?: Record<string, unknown>;
  /** True only for immutable projects imported from the retired service. */
  read_only: boolean;
  /** Compatibility alias accepted while legacy migration payloads roll out. */
  legacy_read_only?: boolean;
  /** True when a legacy bookmark was preserved but its source no longer existed. */
  source_missing: boolean;
  legacy_presenton_id: string | null;
  artifacts: PresentationLegacyArtifact[];
  [key: string]: unknown;
}

export interface PresentationListResponse {
  items: PresentationProject[];
  total?: number;
}

export type PresentationSourceKind =
  | "scratch"
  | "lesson_plan"
  | "scenario"
  | "materials";

/** A completed, owner-scoped KMJ that can be used as presentation context. */
export interface SavedKmzhSource {
  id: string;
  kind: "kmzh.generate";
  title: string;
  status: "completed";
  created_at: string;
  completed_at: string | null;
  expires_at: string;
}

export interface SavedKmzhSourceList {
  items: SavedKmzhSource[];
  total?: number;
  has_more?: boolean;
}

export interface CreatePresentationInput {
  mode: PresentationMode;
  title: string;
  topic: string;
  language: "ru" | "kk" | string;
  subject?: string;
  grade?: string;
  audience?: string;
  slide_count: number;
  source_kind?: PresentationSourceKind;
  source_generation_job_id?: string;
  source_text?: string;
  goals?: string;
  presentation_type?: string;
  text_density?: "visual" | "balanced" | "detailed" | string;
  style?: string | Record<string, unknown>;
  theme_id?: string;
  custom_style?: string;
  instructions?: string;
  [key: string]: unknown;
}

export interface PlanJobInput {
  regenerate?: boolean;
  instructions?: string;
}

export interface JobRef {
  job_id: string;
  plan_id?: string;
  generation_id?: string;
  [key: string]: unknown;
}

export interface JobState {
  id: string;
  job_id?: string;
  project_id?: string;
  generation_id?: string | null;
  kind?: "plan" | "generate" | "regenerate" | "export" | string;
  status: "pending" | "queued" | "running" | "processing" | "completed" | "failed" | "cancelled" | string;
  progress?: number;
  completed?: number;
  total?: number;
  message?: string | null;
  error?: string | Record<string, unknown> | null;
  data?: Record<string, unknown> | null;
  progress_detail?: Record<string, unknown> | null;
  updated_at?: string;
  [key: string]: unknown;
}

export interface UpdatePlanInput {
  revision: number;
  title?: string;
  style_anchor?: StyleAnchor | null;
  slides: PlanSlide[];
}

export interface CostEstimate {
  id?: string;
  currency?: string;
  total?: number;
  total_kzt?: number;
  per_slide?: number;
  per_slide_kzt?: number;
  coin_cost?: number;
  retail_tokens?: number;
  slide_count?: number;
  slides?: number;
  estimated_provider_cost_kzt?: number;
  estimated_provider_cost_kzt_per_slide?: number;
  cost_limit_kzt_per_slide?: number;
  expires_at?: string;
  breakdown?: Record<string, number>;
  [key: string]: unknown;
}

export interface PresentationExport {
  id: string;
  export_id?: string;
  format: "pptx" | "pdf" | string;
  variant?: "editable" | "image" | "legacy_original" | string;
  status: "queued" | "running" | "processing" | "ready" | "completed" | "failed" | string;
  filename?: string;
  size_bytes?: number;
  created_at?: string;
  error?: string | null;
  error_message?: string | null;
  download_url?: string | null;
  [key: string]: unknown;
}

export interface CreateExportInput {
  format: "pptx" | "pdf";
  variant: "editable" | "image";
}

export interface JobEvent {
  id?: string;
  event: string;
  data: unknown;
}
