/**
 * Skeleton component for video cards while loading
 */
export function VideoCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl border border-white/60 p-4 shadow-sm animate-pulse">
      {/* Thumbnail placeholder */}
      <div className="w-full rounded-xl mb-3 aspect-video bg-slate-200" />
      
      {/* Title placeholder */}
      <div className="space-y-2 mb-3">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
      </div>
      
      {/* Metadata placeholder */}
      <div className="flex items-center gap-2">
        <div className="h-3 bg-slate-200 rounded w-16" />
        <div className="h-3 bg-slate-200 rounded w-1" />
        <div className="h-3 bg-slate-200 rounded w-24" />
      </div>
    </div>
  );
}
