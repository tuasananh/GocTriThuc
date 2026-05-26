import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton loading card — dùng khi đang tải danh sách.
 *
 * Dùng:
 *   {loading && (
 *     <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 *       {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
 *     </div>
 *   )}
 */
export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loading cho table row — dùng khi đang tải bảng.
 */
export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}
