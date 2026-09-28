"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function BookmarkButton({ postId }: { postId: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      checkBookmark();
    } else {
      setLoading(false);
    }
  }, [status, postId]);

  const checkBookmark = async () => {
    try {
      const res = await apiClient.request(`/bookmarks/check/${postId}`, {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsBookmarked(data.bookmarked);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // Optimistic UI update
    setIsBookmarked(!isBookmarked);

    try {
      const res = await apiClient.request("/bookmarks/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
        body: JSON.stringify({ postId }),
      });

      if (!res.ok) {
        // Revert on failure
        setIsBookmarked(!isBookmarked);
      }
    } catch (e) {
      console.error(e);
      // Revert on failure
      setIsBookmarked(!isBookmarked);
    }
  };

  if (loading) return <div className="w-10 h-10 animate-pulse bg-slate-200 dark:bg-slate-800 rounded-full"></div>;

  return (
    <button
      onClick={handleToggle}
      className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors border shadow-sm ${
        isBookmarked 
          ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400" 
          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
      }`}
      aria-label={isBookmarked ? "Bỏ lưu bài viết" : "Lưu bài viết"}
      title={isBookmarked ? "Bỏ lưu bài viết" : "Lưu bài viết"}
    >
      <Bookmark size={20} className={isBookmarked ? "fill-current" : ""} />
    </button>
  );
}
