/**
 * Material Card Component
 * Displays a card for a material with preview image and metadata
 */

import Image from "next/image";
import type { MaterialListItem } from "../lib/api";
import { useTranslations } from "../i18n/LanguageContext";

interface MaterialCardProps {
  material: MaterialListItem;
  onClick: () => void;
  isPremiumLocked?: boolean;
}

export function MaterialCard({ material, onClick, isPremiumLocked = false }: MaterialCardProps) {
  const t = useTranslations();
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

  return (
    <button
      onClick={onClick}
      className="glass-card rounded-2xl border border-white/60 p-4 shadow-sm transition hover:shadow-md text-left w-full relative"
    >
      {isPremiumLocked && (
        <div className="absolute top-2 right-2 z-10">
          <span className="inline-block px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">
            PREMIUM
          </span>
        </div>
      )}

      {/* Preview */}
      {material.preview_image ? (
        <div className="relative w-full rounded-xl mb-3 aspect-video overflow-hidden bg-slate-100">
          <Image
            src={material.preview_image}
            alt={material.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized
          />
        </div>
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
            {material.mime_type?.split("/")[1]?.toUpperCase() || "FILE"}
          </span>
        </div>
      )}

      {/* Title */}
      <h3 className="text-sm font-semibold text-slate-900 mb-2 line-clamp-2">
        {material.title}
      </h3>

      {/* Metadata */}
      <div className="flex flex-wrap gap-1 mb-2">
        {material.metadata?.class && (
          <span className="inline-block px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
            {material.metadata.class} {t.presentationsAdmin?.classSuffix || "класс"}
          </span>
        )}
        {material.metadata?.subject && (
          <span className="inline-block px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
            {material.metadata.subject}
          </span>
        )}
      </div>

      {/* Date */}
      <div className="text-xs text-slate-500">{formatDate(material.created_at)}</div>
    </button>
  );
}
