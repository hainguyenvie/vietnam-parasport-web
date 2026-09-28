"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, Play, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface CourseEnrollmentSectionProps {
  courseId: string;
  courseSlug: string;
  firstLessonId?: string;
  firstLessonSlug?: string;
}

export default function CourseEnrollmentSection({
  courseId,
  courseSlug,
  firstLessonId,
  firstLessonSlug,
}: CourseEnrollmentSectionProps) {
  const { data: session, status } = useSession();
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && (session as any)?.accessToken) {
      checkEnrollment();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, session]);

  const checkEnrollment = async () => {
    try {
      const res = await apiClient.request(`/course-progress/${courseId}`, {
        headers: {
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setEnrolled(true);
        }
      }
    } catch (e) {
      console.error("Failed to check enrollment:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCourse = async () => {
    if (!session || !(session as any).accessToken) {
      toast.warning("Vui lòng đăng nhập để tham gia khóa học.");
      return;
    }

    setJoining(true);
    try {
      const res = await apiClient.request("/course-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          courseId,
          progressPct: 0,
        }),
      });

      if (res.ok) {
        setEnrolled(true);
        toast.success("Tham gia khóa học thành công! Chúc bạn học tốt.");
      } else {
        toast.error("Không thể tham gia khóa học. Vui lòng thử lại.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi kết nối máy chủ.");
    } finally {
      setJoining(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="h-12 w-48 bg-slate-200/20 dark:bg-slate-700/20 rounded-full animate-pulse flex items-center justify-center">
        <Loader2 className="animate-spin text-white/50 w-5 h-5" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Link
        href="/login"
        className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-bold text-lg inline-flex items-center gap-2 transition shadow-lg active:scale-95"
      >
        <Play size={18} fill="white" /> Đăng nhập để tham gia
      </Link>
    );
  }

  if (enrolled) {
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        {firstLessonSlug || firstLessonId ? (
          <Link
            href={`/creator-lab/courses/${courseSlug}/learn/${firstLessonSlug || firstLessonId}`}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-bold text-lg inline-flex items-center justify-center gap-2 transition shadow-lg active:scale-95"
          >
            <BookOpen size={18} /> Vào học ngay
          </Link>
        ) : (
          <span className="bg-slate-500 text-white px-6 py-2 rounded-full font-medium inline-block opacity-80">
            Chưa có bài học
          </span>
        )}
        <span className="text-sm text-green-300 flex items-center justify-center gap-1.5 font-semibold bg-green-950/30 px-4 py-2 rounded-full border border-green-900/50">
          <CheckCircle2 size={16} /> Đã tham gia
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={handleJoinCourse}
      disabled={joining}
      className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white px-8 py-3 rounded-full font-bold text-lg inline-flex items-center gap-2 transition shadow-lg active:scale-95 cursor-pointer border-none"
    >
      {joining ? (
        <>
          <Loader2 className="animate-spin w-5 h-5" /> Đang đăng ký...
        </>
      ) : (
        <>Tham gia khóa học</>
      )}
    </button>
  );
}
