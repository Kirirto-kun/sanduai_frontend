/**
 * Visual Group Card Component
 * Displays a card for a material group (packet) with ZIP download
 */

import type { VisualItem } from "../lib/api";
import Image from "next/image";

interface VisualGroupCardProps {
  item: VisualItem;
  onClick: () => void;
}

export function VisualGroupCard({ item, onClick }: VisualGroupCardProps) {
  // Use first image for preview; fallback to first material
  const firstImage = item.materials?.find((m) => m.mime_type?.startsWith("image/"));
  const previewMaterial = firstImage ?? item.materials?.[0];
  const previewUrl = previewMaterial?.url;
  const isImage = previewMaterial?.mime_type?.startsWith("image/");

  return (
    <button
      onClick={onClick}
      className="glass-card rounded-2xl border border-white/60 p-4 shadow-sm transition hover:shadow-md text-left w-full"
    >
      {/* Preview */}
      {previewUrl && isImage ? (
        <div className="relative">
          <Image
            src={previewUrl}
            alt={item.title}
            width={640}
            height={360}
            unoptimized
            className="w-full rounded-xl mb-3 aspect-video object-cover bg-slate-100"
          />
          <span className="absolute top-2 right-2 inline-block px-2 py-0.5 text-xs font-medium bg-amber-500/90 text-white rounded-full">
            ZIP
          </span>
        </div>
      ) : (
        <div className="w-full rounded-xl mb-3 aspect-video bg-gradient-to-br from-amber-100 to-amber-200 flex flex-col items-center justify-center">
          <svg
            className="w-16 h-16 text-amber-600 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            />
          </svg>
          <span className="text-xs text-amber-700 font-medium">{item.material_count} файлов</span>
        </div>
      )}

      {/* Title */}
      <h3 className="text-sm font-semibold text-slate-900 mb-2 line-clamp-2">{item.title}</h3>

      {/* Categories */}
      {item.categories.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {item.categories.slice(0, 2).map((category) => (
            <span
              key={category.id}
              className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full"
            >
              {category.name}
            </span>
          ))}
          {item.categories.length > 2 && (
            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
              +{item.categories.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-slate-500">{item.material_count} файлов • Скачать ZIP</div>
    </button>
  );
}
