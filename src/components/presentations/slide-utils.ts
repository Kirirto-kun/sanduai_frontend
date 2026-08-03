import type { PresentationSlide, SlideSpec, SlideVersion } from "@/types/presentations";

export function activeVersion(slide: PresentationSlide): SlideVersion | undefined {
  const versions = slide.versions ?? [];
  return (
    versions.find((version) => version.id === slide.active_version_id) ??
    versions.find((version) => version.is_active === true) ??
    versions[0]
  );
}

export function slideImageSource(slide: PresentationSlide): string | null {
  const version = activeVersion(slide);
  return (
    version?.artifact_url ??
    version?.asset_url ??
    version?.image_url ??
    version?.preview_url ??
    slide.artifact_url ??
    slide.asset_url ??
    slide.image_url ??
    slide.preview_url ??
    null
  );
}

export function slideTitle(slide: PresentationSlide, fallback: string) {
  const spec = normalizeSlideSpec(slide.spec);
  return slide.title ?? spec.title ?? fallback;
}

export function normalizeSlideSpec(spec: SlideSpec | undefined): SlideSpec {
  if (!spec) return {};
  const content = spec.content;
  if (content && typeof content === "object" && !Array.isArray(content)) {
    return { ...(content as SlideSpec), ...spec };
  }
  return spec;
}

export function qaWarnings(slide: PresentationSlide) {
  const combined = [...(slide.qa_warnings ?? []), ...(activeVersion(slide)?.qa_warnings ?? [])];
  const seen = new Set<string>();
  return combined.filter((warning) => {
    const key = `${warning.code ?? ""}\u0000${warning.severity ?? ""}\u0000${warning.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
