/**
 * React Query hooks for Presenton presentation integration.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/presenton-api";
import type {
  AsyncGeneratePayload,
  CreatePresentationPayload,
  CreateThemePayload,
  EditSlideHtmlPayload,
  EditSlidePayload,
  ExportPayload,
  GenerateThemePayload,
  PreparePresentationPayload,
  UpdateThemePayload,
} from "@/types/presenton";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const keys = {
  presentations: ["presenton", "presentations"] as const,
  presentation: (id: string) => ["presenton", "presentation", id] as const,
  templates: ["presenton", "templates"] as const,
  layouts: ["presenton", "layouts"] as const,
  themes: ["presenton", "themes"] as const,
  fonts: ["presenton", "fonts"] as const,
  generatedImages: ["presenton", "images", "generated"] as const,
  uploadedImages: ["presenton", "images", "uploaded"] as const,
  taskStatus: (id: string) => ["presenton", "task", id] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function usePresentationsList() {
  return useQuery({
    queryKey: keys.presentations,
    queryFn: api.listPresentations,
  });
}

export function usePresentation(id: string | null) {
  return useQuery({
    queryKey: keys.presentation(id || ""),
    queryFn: () => api.getPresentation(id!),
    enabled: !!id,
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: keys.templates,
    queryFn: api.listTemplates,
    staleTime: 30 * 60 * 1000, // 30 min — templates rarely change
  });
}

export function useLayouts() {
  return useQuery({
    queryKey: keys.layouts,
    queryFn: api.listLayouts,
    staleTime: 30 * 60 * 1000,
  });
}

export function useThemes() {
  return useQuery({
    queryKey: keys.themes,
    queryFn: api.listThemes,
  });
}

export function useFonts() {
  return useQuery({
    queryKey: keys.fonts,
    queryFn: api.listFonts,
  });
}

export function useGeneratedImages() {
  return useQuery({
    queryKey: keys.generatedImages,
    queryFn: api.listGeneratedImages,
  });
}

export function useUploadedImages() {
  return useQuery({
    queryKey: keys.uploadedImages,
    queryFn: api.listUploadedImages,
  });
}

export function useTaskStatus(taskId: string | null, enabled = true) {
  return useQuery({
    queryKey: keys.taskStatus(taskId || ""),
    queryFn: () => api.getGenerationStatus(taskId!),
    enabled: !!taskId && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "error") return false;
      return 5000; // poll every 5s while pending/processing
    },
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreatePresentation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePresentationPayload) =>
      api.createPresentation(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.presentations });
    },
  });
}

export function useDeletePresentation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deletePresentation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.presentations });
    },
  });
}

export function usePreparePresentation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PreparePresentationPayload) =>
      api.preparePresentation(payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: keys.presentation(vars.presentation_id),
      });
    },
  });
}

export function useEditSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: EditSlidePayload) => api.editSlide(payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: keys.presentation(vars.presentation_id),
      });
    },
  });
}

export function useEditSlideHtml() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: EditSlideHtmlPayload) => api.editSlideHtml(payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: keys.presentation(vars.presentation_id),
      });
    },
  });
}

export function useStartAsyncGeneration() {
  return useMutation({
    mutationFn: (payload: AsyncGeneratePayload) =>
      api.startAsyncGeneration(payload),
  });
}

export function useExportPresentation() {
  return useMutation({
    mutationFn: (payload: ExportPayload) => api.exportPresentation(payload),
  });
}

export function useDerivePresentation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      presentationId,
      overrides,
    }: {
      presentationId: string;
      overrides?: Partial<CreatePresentationPayload>;
    }) => api.derivePresentation(presentationId, overrides),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.presentations });
    },
  });
}

// Theme mutations

export function useCreateTheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateThemePayload) => api.createTheme(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.themes });
    },
  });
}

export function useUpdateTheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateThemePayload }) =>
      api.updateTheme(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.themes });
    },
  });
}

export function useDeleteTheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTheme(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.themes });
    },
  });
}

export function useGenerateThemeColors() {
  return useMutation({
    mutationFn: (payload: GenerateThemePayload) =>
      api.generateThemeColors(payload),
  });
}

// Image mutations

export function useGenerateImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ prompt, style }: { prompt: string; style?: string }) =>
      api.generateImage(prompt, style),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.generatedImages });
    },
  });
}

export function useUploadImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => api.uploadImage(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.uploadedImages });
    },
  });
}

export function useDeleteImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteImage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.generatedImages });
      qc.invalidateQueries({ queryKey: keys.uploadedImages });
    },
  });
}

// Font mutations

export function useUploadFont() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => api.uploadFont(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.fonts });
    },
  });
}

export function useDeleteFont() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteFont(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.fonts });
    },
  });
}
