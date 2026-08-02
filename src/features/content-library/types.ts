export const CONTENT_SEGMENTS = ["school", "kindergarten", "library"] as const;

export type ContentSegment = (typeof CONTENT_SEGMENTS)[number];

export const MATERIAL_TYPES = [
  "visual_aid",
  "safety_visual_aid",
  "offline_game",
  "grouping",
  "feedback",
  "open_lesson_subject_template",
  "open_lesson",
  "event",
  "interactive_presentation",
] as const;

export type MaterialType = (typeof MATERIAL_TYPES)[number];

export const ASSET_ROLES = [
  "visual",
  "presentation",
  "plan",
  "preview",
  "attachment",
] as const;

export type ContentAssetRole = (typeof ASSET_ROLES)[number];
export type ContentLanguage = "kk" | "ru" | "both";
export type PreviewStatus = "pending" | "processing" | "ready" | "failed" | string;

export type TaxonomyOption = {
  id: string;
  name: string;
  name_kk?: string | null;
  slug: string;
};

export type ContentCategory = TaxonomyOption;
export type ContentSubject = TaxonomyOption;

export type ContentAsset = {
  id: string;
  role: ContentAssetRole;
  original_filename: string;
  mime_type: string;
  file_size: number;
  sort_order: number;
  download_url: string;
  preview_url?: string | null;
  kind?: string;
  status?: string;
  source?: string;
};

export type ContentAssetCounts = Partial<Record<ContentAssetRole, number>>;

export type ContentItem = {
  id: string;
  title: string;
  description?: string | null;
  material_type: MaterialType;
  language: ContentLanguage;
  subject?: string | null;
  subject_option?: ContentSubject | null;
  segments: ContentSegment[];
  grades: number[];
  categories: ContentCategory[];
  preview_url?: string | null;
  preview_status: PreviewStatus;
  formats: string[];
  asset_counts: ContentAssetCounts;
  assets?: ContentAsset[];
  download_all_url?: string | null;
  is_published?: boolean;
  is_archived?: boolean;
  needs_taxonomy?: boolean;
  legacy_source?: "material" | "visual_group" | "visual_material" | null;
  publication_errors?: string[];
  preview_error?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
};

export type ContentListResponse = {
  items: ContentItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export type ContentListParams = {
  q?: string;
  segment?: ContentSegment;
  type?: MaterialType;
  grade?: number;
  subject?: string;
  category?: string;
  page?: number;
  page_size?: number;
  sort?: "newest";
  archived?: boolean;
  published?: boolean;
};

export type ContentMutationInput = {
  title: string;
  materialType: MaterialType;
  language: ContentLanguage;
  description: string;
  subjectId: string | null;
  segments: ContentSegment[];
  grades: number[];
  categoryIds: string[];
  files: Array<{ file: File; role: ContentAssetRole }>;
  removeAssetIds?: string[];
  assetOrder?: string[];
  isPublished: boolean;
  needsTaxonomy?: boolean;
};

export type LegacyBackfillStats = {
  processed: number;
  succeeded: number;
  failed: number;
  failed_ids: string[];
};

export type LegacyBackfillResponse = {
  materials?: LegacyBackfillStats;
  visuals?: LegacyBackfillStats;
};
