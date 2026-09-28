"use client";

import { apiClient } from "@/lib/api-client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function MarkCompleteButton({
  courseId,
  lessonIndex,
  totalLessons,
}: {
  courseId: string;
  lessonIndex: number;
  totalLessons: number;
}) {
  const { data: session } = useSession();
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!session) {
      toast.warning("Vui lòng đăng nhập để lưu tiến độ");
      return;
    }
    setLoading(true);
    try {
      const progressPct = Math.min(100, Math.round(((lessonIndex + 1) / Math.max(1, totalLessons)) * 100));
      await apiClient.request("/course-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
        body: JSON.stringify({ courseId, progressPct }),
      });
      setCompleted(true);
    } catch {
      toast.error("Không thể lưu tiến độ");
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <button className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-bold py-3 px-8 rounded-full flex items-center justify-center w-full md:w-auto" disabled>
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Đã hoàn thành
      </button>
    );
  }

  return (
    <button
      onClick={handleComplete}
      disabled={loading}
      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full transition w-full md:w-auto"
    >
      {loading ? "Đang lưu..." : "Đánh dấu hoàn thành"}
    </button>
  );
}
