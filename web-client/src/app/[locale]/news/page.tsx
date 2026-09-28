import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SportsCarousel from "@/components/SportsCarousel";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/card";
import Image from 'next/image';

async function getPosts(page: number) {
  try {
    const res = await apiClient.request(`/posts/paginated?page=${page}&limit=12`, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    });
    if (!res.ok) {
      return { data: [], meta: { totalPages: 1, page: 1 } };
    }
    return res.json();
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return { data: [], meta: { totalPages: 1, page: 1 } };
  }
}

export const metadata = {
  title: "Tin tức",
  description: "Cập nhật tin tức mới nhất về thể thao người khuyết tật.",
};

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const pageParam = resolvedSearchParams.page;
  const currentPage = pageParam && typeof pageParam === 'string' ? Number(pageParam) : 1;
  const { data: posts, meta } = await getPosts(currentPage);

  return (
    <main className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white pb-12 transition-colors duration-300">

      <div className="max-w-6xl mx-auto px-4 mb-8 pt-10">
        <SportsCarousel />
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p>Hiện chưa có bài viết nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12" role="list" aria-label="Danh sách bài viết">
            {posts.map((post: any) => (
              <div key={post.id} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-100 dark:border-slate-800/50 rounded-2xl overflow-hidden flex flex-col group hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
                <Link href={`/news/${post.slug}`} className="flex-1 flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl h-full">
                  <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-950 relative overflow-hidden flex items-center justify-center shrink-0">
                    {post.thumbnail ? (
                      <Image src={post.thumbnail} alt={post.title} fill sizes="(max-width:768px) 100vw,(max-width:1200px) 50vw,33vw" className="object-cover group-hover:scale-105 group-hover:opacity-90 transition duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-400">
                        <span>No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      {post.category && (
                        <div className="mb-2">
                          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider inline-block border border-blue-200 dark:border-blue-500/30">
                            {post.category.name}
                          </span>
                        </div>
                      )}
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {post.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                        {post.excerpt || "Không có tóm tắt."}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/50 flex justify-between items-center text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      <span>{post.author?.fullName || "Quản trị viên"}</span>
                      <time dateTime={post.createdAt}>
                        {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                      </time>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Phân trang (Pagination) */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {currentPage > 1 ? (
              <Link
                href={`/news?page=${currentPage - 1}`}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                aria-label="Trang trước"
              >
                <ChevronLeft size={20} />
              </Link>
            ) : (
              <Button variant="outline" size="icon" disabled aria-label="Trang trước">
                <ChevronLeft size={20} />
              </Button>
            )}

            <div className="flex gap-1">
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((page) => {
                // Hiển thị một số trang nhất định thay vì toàn bộ nếu quá nhiều
                if (
                  page === 1 || 
                  page === meta.totalPages || 
                  (page >= currentPage - 2 && page <= currentPage + 2)
                ) {
                  return (
                    <Link
                      key={page}
                      href={`/news?page=${page}`}
                      className={`min-w-[40px] h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                        page === currentPage
                          ? "bg-blue-600 text-white"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {page}
                    </Link>
                  );
                } else if (
                  page === currentPage - 3 || 
                  page === currentPage + 3
                ) {
                  return <span key={page} className="px-2 flex items-center">...</span>;
                }
                return null;
              })}
            </div>

            {currentPage < meta.totalPages ? (
              <Link
                href={`/news?page=${currentPage + 1}`}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                aria-label="Trang sau"
              >
                <ChevronRight size={20} />
              </Link>
            ) : (
              <Button variant="outline" size="icon" disabled aria-label="Trang sau">
                <ChevronRight size={20} />
              </Button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
