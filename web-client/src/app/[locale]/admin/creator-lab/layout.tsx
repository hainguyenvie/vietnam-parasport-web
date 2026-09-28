"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Folder, Video } from "lucide-react";

export default function CreatorLabLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { name: "Khóa học", href: "/admin/creator-lab/courses", icon: <BookOpen size={18} /> },
    { name: "Tài liệu", href: "/admin/creator-lab/documents", icon: <Folder size={18} /> },
    { name: "Mẫu CapCut", href: "/admin/creator-lab/capcut-templates", icon: <Video size={18} /> },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col h-full">
      <div className="mb-2">
        {/* Title removed per request, handled by individual pages' DataTables */}
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => {
          const isActive = pathname?.startsWith(tab.href) ?? false;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              {tab.icon}
              {tab.name}
            </Link>
          );
        })}
      </div>

      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
