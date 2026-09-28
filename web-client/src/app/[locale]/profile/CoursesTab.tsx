"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  courses: any[];
  loading: boolean;
  language: string;
  trainingOverview: string;
  noCoursesOverview: string;
  browseCourses: string;
  completed: string;
  viewAll: (n: number) => string;
  onChangeTab: (tab: string) => void;
  exploreLink: string;
  exploreLabel: string;
}

export default function CoursesTab({
  courses, loading, language, trainingOverview, noCoursesOverview,
  browseCourses, completed, viewAll, onChangeTab, exploreLink, exploreLabel,
}: Props) {
  return (
    <div className="glass-card rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-slate-800/80 shadow-md">
      <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b dark:border-slate-800/80 pb-3 text-slate-800 dark:text-white">
        <BookOpen size={20} className="text-indigo-500" /> {trainingOverview}
      </h2>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.slice(0, 2).map((item) => (
            <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-900/60 border dark:border-slate-800 rounded-2xl">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1 mb-2">{item.course.title}</h3>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${item.progressPct}%` }} />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                <span>{completed}</span>
                <span>{item.progressPct.toFixed(0)}%</span>
              </div>
            </div>
          ))}
          {courses.length > 2 && (
            <div className="md:col-span-2 text-center pt-2">
              <button onClick={() => onChangeTab("courses")} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                {viewAll(courses.length)} &rarr;
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-slate-500 text-sm">
          <p>{noCoursesOverview}</p>
          <Link href={exploreLink} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
            {exploreLabel} &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
