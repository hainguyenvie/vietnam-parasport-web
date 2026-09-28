import { Skeleton } from "@/components/ui/Skeleton";

export function MatchDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900" aria-busy="true" aria-label="Đang tải thông tin trận đấu">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="w-64 h-8" />
            <Skeleton className="w-40 h-4" />
          </div>
        </div>

        {/* Scoreboard */}
        <div className="glass-card rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1 text-center space-y-3">
              <Skeleton className="w-20 h-20 rounded-full mx-auto" />
              <Skeleton className="w-32 h-5 mx-auto" />
            </div>
            <div className="text-center space-y-2">
              <Skeleton className="w-24 h-12 mx-auto" />
              <Skeleton className="w-16 h-4 mx-auto" />
            </div>
            <div className="flex-1 text-center space-y-3">
              <Skeleton className="w-20 h-20 rounded-full mx-auto" />
              <Skeleton className="w-32 h-5 mx-auto" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="w-24 h-10 rounded-lg" />
          ))}
        </div>

        {/* Content */}
        <div className="space-y-4">
          <Skeleton className="w-full h-40 rounded-xl" />
          <Skeleton className="w-full h-20 rounded-xl" />
          <Skeleton className="w-3/4 h-16 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
