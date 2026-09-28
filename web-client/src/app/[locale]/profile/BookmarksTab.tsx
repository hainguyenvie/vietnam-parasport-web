"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Trash2, BookOpen } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";

interface BookmarkItem {
  id: string;
  post: {
    id: string;
    slug: string;
    title: string;
    excerpt?: string;
    thumbnail?: string;
    category?: { name: string };
  };
  createdAt: string;
}

interface Props {
  bookmarks: BookmarkItem[];
  loading: boolean;
  language: string;
  title: string;
  noTitle: string;
  noDesc: string;
  readNewsBtn: string;
  removeBtn: string;
  savedOn: string;
  onRemove: (postId: string) => void;
}

export default function BookmarksTab({
  bookmarks, loading, language, title, noTitle, noDesc,
  readNewsBtn, removeBtn, savedOn, onRemove,
}: Props) {
  const [page, setPage] = useState(1);
  const perPage = 4;
  const totalPages = Math.ceil(bookmarks.length / perPage);
  const paged = bookmarks.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="glass-card rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-slate-800/80 shadow-md">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b dark:border-slate-800/80 pb-3 text-slate-800 dark:text-white">
          <Bookmark size={20} className="text-indigo-500" /> {title}
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Bookmark size={28} />
            </div>
            <h3 className="text-base font-bold mb-1">{noTitle}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">{noDesc}</p>
            <Link href="/news" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md">
              {readNewsBtn}
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paged.map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between group hover:shadow-lg transition duration-300 shadow-sm">
                  <div className="p-5 flex gap-4">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 border dark:border-slate-800">
                      {item.post.thumbnail ? (
                        <img src={item.post.thumbnail} alt={item.post.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No Image</div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-2 hover:text-blue-600 transition">
                        <Link href={`/news/${item.post.slug}`}>{item.post.title}</Link>
                      </h3>
                      {item.post.excerpt && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{item.post.excerpt}</p>
                      )}
                      {item.post.category && (
                        <span className="inline-block text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-semibold">
                          {item.post.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/40 px-5 py-3 border-t dark:border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {savedOn} {item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : ""}
                    </span>
                    <button
                      onClick={() => onRemove(item.post.id)}
                      className="text-xs font-bold text-red-500 hover:text-red-700 dark:text-red-400 transition cursor-pointer"
                    >
                      <Trash2 size={14} className="inline mr-1" />{removeBtn}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
