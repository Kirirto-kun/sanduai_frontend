/**
 * Visual Material Card Component
 * Displays a card for a visual material with thumbnail and metadata
 */

import type { VisualMaterial } from "../lib/api";
import Image from "next/image";

interface VisualMaterialCardProps {
  material: VisualMaterial;
  onClick: () => void;
}

export function VisualMaterialCard({ material, onClick }: VisualMaterialCardProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Check if it's an image
  const isImage = material.mime_type.startsWith("image/");

  return (
    <button
      onClick={onClick}
      className="glass-card rounded-2xl border border-white/60 p-4 shadow-sm transition hover:shadow-md text-left w-full"
    >
      {/* Preview */}
      {isImage ? (
        <Image
          src={material.url}
          alt={material.title}
          width={640}
          height={360}
          unoptimized
          className="w-full rounded-xl mb-3 aspect-video object-cover bg-slate-100"
        />
      ) : (
        <div className="w-full rounded-xl mb-3 aspect-video bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center">
          <svg
            className="w-16 h-16 text-slate-400 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs text-slate-500 font-medium">
            {material.mime_type.split("/")[1]?.toUpperCase() || "FILE"}
          </span>
        </div>
      )}

      {/* Title */}
      <h3 className="text-sm font-semibold text-slate-900 mb-2 line-clamp-2">
        {material.title}
      </h3>

      {/* Categories */}
      {material.categories.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {material.categories.slice(0, 2).map((category) => (
            <span
              key={category.id}
              className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full"
            >
              {category.name}
            </span>
          ))}
          {material.categories.length > 2 && (
            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
              +{material.categories.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>{formatFileSize(material.file_size)}</span>
        <span>•</span>
        <span>{formatDate(material.created_at)}</span>
      </div>
    </button>
  );
}
