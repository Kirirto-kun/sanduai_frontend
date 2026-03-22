/**
 * TypeScript types for the Presenton presentation integration.
 * Mirrors schemas returned by the SanduAI backend proxy layer.
 */

// ---------------------------------------------------------------------------
// Presentation
// ---------------------------------------------------------------------------

export interface Presentation {
  id: string;
  content: string;
  n_slides: number;
  language: string;
  title?: string | null;
  file_paths?: string[] | null;
  outlines?: Outline[] | null;
  layout?: Record<string, unknown> | null;
  structure?: Record<string, unknown> | null;
  theme?: ThemeData | null;
  instructions?: string | null;
  tone?: string | null;
  verbosity?: string | null;
  include_table_of_contents?: boolean;
  include_title_slide?: boolean;
  web_search?: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface PresentationWithSlides extends Presentation {
  slides: Slide[];
}

export interface PresentationListItem {
  id: string;
  title?: string | null;
  content: string;
  n_slides: number;
  language: string;
  created_at: string;
  updated_at?: string | null;
  first_slide?: Slide | null;
}

// ---------------------------------------------------------------------------
// Slide
// ---------------------------------------------------------------------------

export interface Slide {
  id: string;
  presentation: string;
  layout_group?: string | null;
  layout?: string | null;
  index: number;
  content: SlideContent;
  html_content?: string | null;
  speaker_note?: string | null;
  properties?: Record<string, unknown> | null;
}

export interface SlideContent {
  title?: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  image?: string;
  icon?: string;
  chart?: ChartData;
  [key: string]: unknown;
}

export interface ChartData {
  type: string;
  data: Record<string, unknown>;
  options?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Outline
// ---------------------------------------------------------------------------

export interface Outline {
  content: string;
  layout?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export interface LayoutInfo {
  name: string;
  description?: string;
  slides?: LayoutSlide[];
  [key: string]: unknown;
}

export interface LayoutSlide {
  index: number;
  name: string;
  description?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

export interface ThemeData {
  id?: string;
  name?: string;
  colors?: ThemeColors;
  logo?: string | null;
  company_name?: string | null;
  [key: string]: unknown;
}

export interface ThemeColors {
  primary?: string;
  accent?: string;
  text?: string;
  background?: string;
  [key: string]: string | undefined;
}

// ---------------------------------------------------------------------------
// Image
// ---------------------------------------------------------------------------

export interface ImageAsset {
  id: string;
  path: string;
  is_uploaded: boolean;
  created_at?: string;
}

// ---------------------------------------------------------------------------
// Font
// ---------------------------------------------------------------------------

export interface FontInfo {
  id: string;
  name?: string;
  path?: string;
  font_id?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Icon
// ---------------------------------------------------------------------------

export interface IconResult {
  name: string;
  svg?: string;
  url?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

export interface TemplateGroup {
  templateName: string;
  templateID: string;
  files: string[];
  settings: {
    description?: string;
    ordered?: boolean;
    default?: boolean;
  } | null;
}

// ---------------------------------------------------------------------------
// Request payloads
// ---------------------------------------------------------------------------

export interface CreatePresentationPayload {
  content: string;
  n_slides?: number;
  language?: string;
  instructions?: string | null;
  tone?: string | null;
  verbosity?: string | null;
  include_table_of_contents?: boolean;
  include_title_slide?: boolean;
  web_search?: boolean;
}

export interface PreparePresentationPayload {
  presentation_id: string;
  outlines: Outline[];
  layout?: Record<string, unknown> | null;
  table_of_contents?: string[] | null;
  title_slide?: Record<string, unknown> | null;
}

export interface EditSlidePayload {
  presentation_id: string;
  slide_id: string;
  prompt: string;
}

export interface EditSlideHtmlPayload extends EditSlidePayload {
  html?: string | null;
}

export interface ExportPayload {
  presentation_id: string;
  export_as: "pptx" | "pdf";
}

export interface AsyncGeneratePayload {
  prompt: string;
  n_slides?: number;
  language?: string;
  template?: string;
  export_as?: "pptx" | "pdf";
  instructions?: string | null;
  tone?: string | null;
  verbosity?: string | null;
  web_search?: boolean;
  include_table_of_contents?: boolean;
  include_title_slide?: boolean;
}

export interface CreateThemePayload {
  name: string;
  primary_color: string;
  accent_color?: string | null;
  text_color?: string | null;
  background_color?: string | null;
  logo?: string | null;
  company_name?: string | null;
}

export interface UpdateThemePayload {
  name?: string | null;
  primary_color?: string | null;
  accent_color?: string | null;
  text_color?: string | null;
  background_color?: string | null;
  logo?: string | null;
  company_name?: string | null;
}

export interface GenerateThemePayload {
  primary_color: string;
  accent_color?: string | null;
  text_color?: string | null;
}

export interface GenerateImagePayload {
  prompt: string;
  style?: string | null;
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface AsyncGenerateResponse {
  task_id: string;
}

export interface TaskStatusResponse {
  id: string;
  status: "pending" | "processing" | "completed" | "error" | string;
  message?: string | null;
  error?: Record<string, unknown> | null;
  data?: Record<string, unknown> | null;
}

export interface ExportResult {
  path?: string;
  edit_path?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// SSE event
// ---------------------------------------------------------------------------

export interface SSEEvent {
  event: string;
  data: string;
}
