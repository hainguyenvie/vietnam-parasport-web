"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { Search as SearchIcon, FileText, BookOpen } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams?.get("q") || "";
  const [results, setResults] = useState<{ posts: any[]; courses: any[] }>({ posts: [], courses: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q) {
      setLoading(true);
      apiClient.request(`/search?q=${encodeURIComponent(q)}`)
        .then(res => res.json())
        .then(data => {
          setResults({
            posts: Array.isArray(data.posts) ? data.posts : [],
            courses: Array.isArray(data.courses) ? data.courses : [],
          });
          setLoading(false);
        })
        .catch(e => {
          console.error(e);
          setLoading(false);
        });
    } else {
      setResults({ posts: [], courses: [] });
    }
  }, [q]);

  if (!q) {
    return <div className="text-center py-12 text-slate-500">Vui lòng nhập từ khóa để tìm kiếm.</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <SearchIcon size={24} className="text-blue-500" /> Kết quả tìm kiếm cho: "{q}"
      </h1>

      {loading ? (
        <div className="text-center py-12">Đang tìm kiếm...</div>
      ) : (
        <div className="space-y-8">
          {/* Kết quả Khóa học */}
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <BookOpen size={20} /> Khóa học ({results.courses.length})
            </h2>
            {results.courses.length === 0 ? (
              <p className="text-slate-500 text-sm">Không tìm thấy khóa học nào.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.courses.map((course: any) => (
                  <Link key={course.id} href={`/creator-lab/courses/${course.slug}`} className="block p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:shadow-md transition">
                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2">{course.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{(course.description || "").replace(/<[^>]+>/g, '')}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Kết quả Tin tức */}
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <FileText size={20} /> Tin tức ({results.posts.length})
            </h2>
            {results.posts.length === 0 ? (
              <p className="text-slate-500 text-sm">Không tìm thấy tin tức nào.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.posts.map((post: any) => (
                  <Link key={post.id} href={`/news/${post.slug}`} className="block p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:shadow-md transition">
                    <h3 className="font-bold text-blue-600 dark:text-blue-400 mb-2 line-clamp-1">{post.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{post.excerpt}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl min-h-[calc(100vh-100px)]">
      <Suspense fallback={<div className="text-center p-8">Đang tải...</div>}>
        <SearchContent />
      </Suspense>
    </div>
  );
}
