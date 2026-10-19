export type VideoModel = {
  id: string;
  adapter_model_id?: string;
  label: string;
  name?: string;
  durations?: number[];
  provider: string;
  available: boolean;
  resolutions: string[];
  aspect_ratios: string[];
  min_duration: number;
  max_duration: number;
  duration_step?: number;
  native_audio?: boolean;
  available_modes?: string[];
  modes?: string[];
  prices?: Record<
    string,
    Record<
      string,
      {
        per_second_usd: string;
        input_image_usd: string;
        verified_at: string;
        valid_until: string;
        source: string;
      }
    >
  >;
  unavailable_reason?: string;
  description?: string;
  quality_notes?: Record<string, string>;
  upscaled_resolutions?: string[];
};

export type VideoSettings = {
  model_id: string;
  resolution: string;
  duration: number;
  aspect_ratio: string;
  generate_audio: boolean;
  speech_language: string;
  speech_text: string;
  voice_description: string;
  music: string;
  sound_effects: string;
  style: string;
  camera: string;
  motion_strength: number | null;
  negative_prompt: string;
};

export type VideoAsset = {
  id: string;
  expires_at: string;
  project_expires_at?: string;
  kind?: string;
  content_type?: string;
  width?: number;
  height?: number;
  duration?: number;
};
export type VideoJob = {
  id: string;
  project_id: string;
  scene_id?: string;
  version_id?: string;
  status: string;
  progress?: number | null;
  error?: string | null;
  error_code?: string | null;
  reserved_tokens?: string | number;
  charged_tokens?: string | number;
  created_at?: string;
  cost_tokens?: string | number;
  captured_tokens?: string | number;
};
export type VideoVersion = {
  id: string;
  status: string;
  asset_id?: string | null;
  asset?: VideoAsset | null;
  prompt?: string;
  settings: Partial<VideoSettings>;
  created_at: string;
  expires_at?: string;
  cost_tokens?: string | number;
  duration?: number;
  draft_fingerprint?: string;
  captured_tokens?: string | number;
  billing_status?: string;
  error_code?: string | null;
  original_prompt?: string;
  enhanced_prompt?: string | null;
  final_prompt?: string;
  asset_expired?: boolean;
  quote_id?: string | null;
  frame_asset_id?: string | null;
  input_asset_id?: string | null;
  input_mode?: "text" | "image";
  input_expired?: boolean;
  dialogue?: string;
};
export type VideoVersionDependencies = {
  version_id: string;
  deleted: boolean;
  selected_by_scenes: Array<{ id: string; title: string }>;
  continuations: Array<{ id: string; title: string }>;
  input_scenes?: Array<{ id: string; title: string }>;
  active_generations: Array<{ id: string; status: string }>;
  exports: Array<{ id: string; status: string }>;
  retained_for_dependencies: boolean;
};
export type VideoScene = {
  id: string;
  project_id: string;
  title: string;
  prompt: string;
  original_prompt?: string;
  enhanced_prompt?: string;
  dialogue?: string;
  settings: VideoSettings;
  position: number;
  included: boolean;
  input_asset_id?: string | null;
  source_scene_id?: string | null;
  source_version_id?: string | null;
  selected_version_id?: string | null;
  trim_in?: number;
  trim_out?: number | null;
  versions: VideoVersion[];
  jobs?: VideoJob[];
  source_stale?: boolean;
  draft_changed?: boolean;
  input_asset?: VideoAsset | null;
  source_timecode?: string | number | null;
  revision?: number;
};
export type VideoExport = {
  id: string;
  status: string;
  asset_id?: string | null;
  asset?: VideoAsset | null;
  resolution: string;
  settings?: { resolution?: string };
  created_at: string;
  expires_at?: string;
  error?: string | null;
  asset_expired?: boolean;
};
export type VideoProject = {
  id: string;
  title: string;
  idea: string;
  script: string;
  language: string;
  aspect_ratio: string;
  characters: string;
  audio_notes: string;
  visual_style: string;
  defaults: VideoSettings;
  created_at: string;
  updated_at: string;
  expires_at: string;
  revision?: number;
  scenes: VideoScene[];
  jobs: VideoJob[];
  exports: VideoExport[];
  total_spent_tokens?: string;
  selected_cost_tokens?: string;
  manual_refunded_tokens?: string;
  estimated_remaining_tokens?: string;
  unquoted_scene_count?: number;
};
export type VideoProjectSummary = Pick<
  VideoProject,
  "id" | "title" | "updated_at" | "expires_at"
> & {
  scene_count?: number;
  kind?: "clip" | "project";
  created_at?: string;
  status?: string;
  ready_scene_count?: number;
  total_duration?: string | number;
  ready_count?: number;
  thumbnail_asset_id?: string | null;
  thumbnail?: VideoAsset | null;
  latest_export?: VideoExport | null;
  clip?: VideoLibraryClip | null;
  aspect_ratio?: string;
  total_spent_tokens?: string;
};
export type VideoLibraryClip = {
  id: string | null;
  scene_id: string;
  title: string;
  prompt_preview: string;
  created_at: string;
  duration: string | number | null;
  requested_duration?: number;
  aspect_ratio: string;
  model_id: string;
  resolution: string;
  status: string;
  cost_tokens: string;
  captured_tokens: string;
  manual_refunded_tokens: string;
  net_cost_tokens: string;
  asset_id: string | null;
  preview_asset_id: string | null;
  expires_at: string | null;
};
export type VideoCatalog = {
  models: VideoModel[];
  default_profiles?: VideoDefaultProfiles;
  default_profile_availability?: { fast: boolean; quality: boolean };
  max_scenes: number;
  max_project_duration: number;
  max_concurrent_jobs: number;
  max_image_mb: number;
  export_available?: boolean;
  retention?: { asset_hours: number; project_inactivity_hours: number };
};
export type VideoDefaultProfiles = {
  fast: VideoSettings;
  quality: VideoSettings;
};
export type VideoQuote = {
  id: string;
  cost_tokens: string;
  cost_kzt: string;
  expires_at: string;
  fingerprint: string;
  settings: VideoSettings;
  exchange_rate?: string;
  rate_date?: string;
  warnings?: Array<{ code: string; message: string }>;
  preset_conflicts?: VideoPresetConflict[];
};
export type VideoPresetConflict = {
  field: "style" | "camera";
  preset: string;
  reason_code: "EXPLICIT_CAMERA" | "EXPLICIT_STYLE";
};
export type ScenePatch = Partial<
  Pick<
    VideoScene,
    | "title"
    | "prompt"
    | "original_prompt"
    | "enhanced_prompt"
    | "dialogue"
    | "settings"
    | "included"
    | "input_asset_id"
    | "source_scene_id"
    | "source_version_id"
  >
> & { expected_revision?: number; trim_in?: number; trim_out?: number | null };
export type VideoPlan = {
  title: string;
  script: string;
  characters: string;
  visual_style: string;
  audio_notes: string;
  scenes: Array<{
    title: string;
    prompt: string;
    duration?: number;
    dialogue?: string;
    settings?: Partial<VideoSettings>;
  }>;
};
