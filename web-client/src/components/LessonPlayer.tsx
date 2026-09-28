"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar, Menu, X, Play, BookOpen, Lock, Loader2 } from "lucide-react";
import MarkCompleteButton from "@/components/MarkCompleteButton";
import { apiClient } from "@/lib/api-client";
import { useSession } from "next-auth/react";

interface LessonPlayerProps {
  lesson: any;
  course: any;
  slug: string;
}

export default function LessonPlayer({ lesson, course, slug }: LessonPlayerProps) {
  const [showSidebar, setShowSidebar] = useState(true);
  const { data: session } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    async function getProfile() {
      if (!session) {
        setLoadingProfile(false);
        return;
      }
      try {
        const res = await apiClient.get("/users/me");
        if (res.ok) {
          setProfile(await res.json());
        }
      } catch (err) {
        console.error("Failed to load user profile in LessonPlayer:", err);
      } finally {
        setLoadingProfile(false);
      }
    }
    getProfile();
  }, [session]);

  const isGated = (() => {
    if (loadingProfile) return false;
    if (!profile) return false;

    const roleName = profile.role?.name || profile.role;
    if (roleName === "COACH" || roleName === "INSTRUCTOR") {
      return !profile.coachProfile?.isVerified;
    }
    if (roleName === "ASSISTANT") {
      return !profile.assistantProfile?.isVerified;
    }
    return false;
  })();

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-slate-950 text-white min-h-[500px]">
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col border-b lg:border-b-0 border-slate-800">
        
        {/* Header bar of Player */}
        <div className="p-4 bg-slate-900 flex items-center justify-between border-b border-slate-800 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Link 
              href={`/creator-lab/courses/${slug}`} 
              className="text-slate-400 hover:text-white flex items-center gap-1.5 transition text-xs font-bold bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-700/30"
            >
              <span>&larr;</span> Quay lại khóa học
            </Link>
            <h1 className="font-extrabold text-sm text-slate-200 hidden md:block max-w-md truncate">
              {course?.title || lesson.chapter?.course?.title}
            </h1>
          </div>
          
          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-bold cursor-pointer border-none"
            aria-label={showSidebar ? "Ẩn danh sách bài học" : "Hiện danh sách bài học"}
          >
            {showSidebar ? <X size={16} /> : <Menu size={16} />}
            <span className="hidden sm:inline">{showSidebar ? "Ẩn danh mục" : "Hiện danh mục"}</span>
          </button>
        </div>
        
        {/* Video Area */}
        <div className="flex-1 flex flex-col bg-black relative min-h-[300px]">
          {loadingProfile ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="text-xs font-semibold">Đang kiểm tra quyền truy cập...</span>
            </div>
          ) : isGated ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/90 border border-slate-800 rounded-lg m-4 gap-4">
              <div className="p-4 bg-amber-500/10 rounded-full border border-amber-500/20 text-amber-500">
                <Lock size={32} />
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="font-extrabold text-base text-amber-500 uppercase tracking-wider">Nội dung đã bị khóa</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tài khoản chuyên môn của bạn đang ở trạng thái chờ xác minh. 
                  Vui lòng cập nhật đầy đủ chứng chỉ chuyên môn tại <Link href="/profile?tab=profile" className="text-blue-500 font-bold hover:underline">Hồ sơ cá nhân</Link> và chờ Ban quản trị phê duyệt để mở khóa toàn bộ các bài giảng.
                </p>
              </div>
            </div>
          ) : lesson.videoUrl ? (
            <div className="relative w-full h-full flex-1 group aspect-video lg:aspect-auto">
              {(lesson.videoUrl.includes("youtube.com") || lesson.videoUrl.includes("youtu.be") || lesson.videoUrl.includes("vimeo.com")) ? (
                <iframe 
                  src={
                    lesson.videoUrl.includes("youtube.com/watch?v=") 
                      ? lesson.videoUrl.replace("watch?v=", "embed/").split("&")[0]
                      : lesson.videoUrl.includes("youtu.be/")
                        ? lesson.videoUrl.replace("youtu.be/", "youtube.com/embed/").split("?")[0]
                        : lesson.videoUrl
                  } 
                  className="w-full h-full absolute inset-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  title={lesson.title}
                ></iframe>
              ) : (
                <video 
                  controls 
                  className="w-full h-full absolute inset-0 outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={`Video bài giảng: ${lesson.title}`}
                  poster={lesson.thumbnailUrl}
                >
                  <source src={lesson.videoUrl} type="video/mp4" />
                  {/* CC and Audio Description Tracks */}
                  {lesson.subtitlesUrl && (
                    <track kind="captions" src={lesson.subtitlesUrl} srcLang="vi" label="Tiếng Việt" default />
                  )}
                  {lesson.audioDescriptionUrl && (
                    <track kind="descriptions" src={lesson.audioDescriptionUrl} srcLang="vi" label="Mô tả âm thanh" />
                  )}
                  Trình duyệt của bạn không hỗ trợ thẻ video.
                </video>
              )}
              
              {/* Accessibility Controls Overlay (for custom controls) */}
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity z-20">
                <button 
                  className="bg-black/70 hover:bg-black/90 text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-white/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Bật/Tắt Phụ đề"
                  title="Bật/Tắt Phụ đề (CC)"
                >
                  CC
                </button>
                <button 
                  className="bg-black/70 hover:bg-black/90 text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-white/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Bật/Tắt Mô tả âm thanh"
                  title="Bật/Tắt Mô tả âm thanh (AD)"
                >
                  Audio Desc
                </button>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 font-semibold text-sm flex flex-col items-center justify-center h-full gap-2">
              <Play size={32} className="text-slate-600 animate-pulse" />
              <span>Video bài giảng đang được cập nhật</span>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Syllabus */}
      <div 
        className={`bg-slate-900 border-l border-slate-800 flex flex-col transition-all duration-300 overflow-hidden shrink-0 ${
          showSidebar 
            ? "w-full lg:w-96 max-h-[400px] lg:max-h-none" 
            : "w-0 max-h-0 lg:max-h-none opacity-0"
        }`}
      >
        <div className="p-4 font-extrabold text-sm border-b border-slate-800 text-slate-300 tracking-wider uppercase flex items-center gap-2">
          <BookOpen size={16} className="text-blue-500" /> Danh sách bài học
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[350px] lg:max-h-[60vh]">
          {course?.chapters?.map((chapter: any, cIdx: number) => (
            <div key={chapter.id} className="space-y-1.5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {chapter.title}
              </h3>
              <div className="space-y-1">
                {chapter.lessons?.map((les: any, lIdx: number) => {
                  const isCurrent = les.slug === lesson.slug || les.id === lesson.id;
                  return (
                    <Link
                      key={les.id}
                      href={`/creator-lab/courses/${slug}/learn/${les.slug || les.id}`}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl text-xs transition border ${
                        isCurrent
                          ? "bg-blue-600 border-blue-600 text-white font-bold"
                          : "border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white"
                      }`}
                    >
                      <Play size={12} className={`shrink-0 mt-0.5 ${isCurrent ? "text-white" : "text-slate-500"}`} fill={isCurrent ? "white" : "none"} />
                      <span className="line-clamp-2">
                        Bài {lIdx + 1}: {les.title}
                      </span>
                    </Link>
                  );
                })}
                {(!chapter.lessons || chapter.lessons.length === 0) && (
                  <span className="block text-[10px] text-slate-600 p-2 italic">Đang cập nhật bài giảng</span>
                )}
              </div>
            </div>
          ))}
          {(!course?.chapters || course.chapters.length === 0) && (
            <div className="text-center py-8 text-xs text-slate-500">Đang tải danh sách bài học...</div>
          )}
        </div>
      </div>
    </div>
  );
}
