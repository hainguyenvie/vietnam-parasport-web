import React from "react";

export default function Loading() {
  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Skeleton Header/Title */}
      <div className="h-10 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
      
      {/* Skeleton content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex flex-col gap-3 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50">
            <div className="h-48 w-full bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
            <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mt-2"></div>
            <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
