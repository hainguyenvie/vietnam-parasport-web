"use client";

import { getApiUrl } from "@/utils/api";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Video, FileText, Play, ArrowRight, Users, PlayCircle, Bot, BookOpenCheck, Wand2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";
import { useApi } from '@/hooks/useApi';
import { Skeleton } from '@/components/ui/Skeleton';

const PdfViewer = dynamic(() => import('@/components/PdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-100 dark:bg-slate-900 rounded-[1.8rem]">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-sm font-medium text-slate-500 animate-pulse">Đang nạp trình đọc PDF...</p>
    </div>
  )
});

interface DocumentItem {
  title: string;
  description?: string;
  slug: string;
  attachments: any[];
}

interface DocGroup {
  category: string;
  items: DocumentItem[];
}

const translations: Record<string, Record<string, string>> = {
  vi: {
    heroTag: "Creator Lab",
    heroTitle: "Phòng Sáng Tạo Nội Dung Số",
    heroDesc: "Hỗ trợ vận động viên người khuyết tật học cách xây dựng hình ảnh cá nhân, phát triển kênh truyền thông và tự kể câu chuyện của mình theo cách tự hào và tôn trọng nhất.",
    tabDocs: "Tài liệu học tập",
    tabDocsDesc: "Tối ưu kênh & viết bài",
    tabVideos: "Khóa học",
    tabVideosDesc: "Học qua video bài giảng",
    tabTemplates: "Mẫu templates",
    tabTemplatesDesc: "Mẫu CapCut chuyên nghiệp",
    tabChatbot: "Trợ lý AI",
    tabChatbotDesc: "Gợi ý kịch bản & caption",
    downloadBtn: "Tải tài liệu PDF",
    viewBtn: "Đọc bài viết",
    youtubeBtn: "Xem khóa học",
    durationLabel: "Thời lượng:",
    purposeLabel: "Mục đích:",
    capcutBtn: "Sử dụng template",
    quickPromptHeading: "💡 Chọn nhanh câu hỏi gợi ý:",
    chatbotInputPlaceholder: "Nhập câu hỏi của bạn tại đây...",
    chatbotSendBtn: "Gửi tin nhắn",
    botGreeting: "Xin chào! Tôi là Trợ lý AI của Creator Lab. Tôi có thể giúp bạn lên ý tưởng, viết kịch bản video, biên soạn caption và kiểm tra xem nội dung của bạn có bị mắc lỗi \"thương hại hóa\" hay không. Hãy chọn câu hỏi gợi ý bên dưới hoặc nhắn trực tiếp cho tôi nhé!",
    botGreetingTime: "Vừa xong",
    botResponseTime: "Vừa xong",
    botTyping: "Trợ lý AI đang soạn câu trả lời...",
    pdfModalTitle: "Đang Xem Tài Liệu PDF",
    pdfError: "Trình duyệt của bạn không hỗ trợ hiển thị PDF trực tiếp. Vui lòng bấm vào nút bên dưới để tải về máy.",
    pdfDownloadBtn: "Tải file PDF xuống",
    sectionJoinPartner: "Đăng ký làm CTV hỗ trợ",
    pdfCloseBtn: "Đóng lại",
    loadingResponse: "Đang gửi..."
  },
  en: {
    heroTag: "Creator Lab",
    heroTitle: "Digital Content Production Lab",
    heroDesc: "Supporting disabled athletes to build personal branding, develop media channels, and tell their stories in the most proud and respectful way.",
    tabDocs: "Learning Documents",
    tabDocsDesc: "Channel optimization & writing",
    tabVideos: "Courses",
    tabVideosDesc: "Learn via video lectures",
    tabTemplates: "Templates",
    tabTemplatesDesc: "Editing templates on CapCut",
    tabChatbot: "AI Assistant",
    tabChatbotDesc: "Script & caption suggestions",
    downloadBtn: "Download PDF",
    viewBtn: "Read article",
    youtubeBtn: "View Course",
    durationLabel: "Duration:",
    purposeLabel: "Purpose:",
    capcutBtn: "Use template",
    quickPromptHeading: "💡 Choose a quick question prompt:",
    chatbotInputPlaceholder: "Type your question here...",
    chatbotSendBtn: "Send Message",
    botGreeting: "Hello! I am your Creator Lab AI Assistant. I can help you brainstorm video ideas, write scripts, draft captions, and review whether your content contains any \"pity-oriented\" tone. Select a prompt below or chat with me directly!",
    botGreetingTime: "Just now",
    botResponseTime: "Just now",
    botTyping: "AI Assistant is typing...",
    pdfModalTitle: "Viewing PDF Document",
    pdfError: "Your browser does not support viewing PDFs directly. Please click the button below to download.",
    pdfDownloadBtn: "Download PDF file",
    sectionJoinPartner: "Register as Collaborator",
    pdfCloseBtn: "Close",
    loadingResponse: "Sending..."
  }
};

export default function CreatorLabPage() {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const tStr = translations[language] || translations.vi;
  const isVi = language === "vi";
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("courses");

  // PDF Viewer Modal State
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  // SWR data fetching with cache & revalidation
  const { data: coursesData, isLoading: coursesLoading } = useApi<any[]>("/courses");
  const { data: documentsData, isLoading: docsLoading } = useApi<any[]>("/documents");
  const { data: templatesData, isLoading: templatesLoading } = useApi<any[]>("/capcut-templates");

  // Transform courses data
  const videoLessons = useMemo(() => {
    if (!Array.isArray(coursesData)) return [];
    return coursesData.map((course: any) => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      desc: (course.description || "").replace(/<[^>]+>/g, ''),
      thumbnail: course.thumbnail,
      enrolledCount: course.enrolledCount || 0,
      lessonCount: course.lessonCount || 0,
      totalDuration: course.totalDuration || 0,
    }));
  }, [coursesData]);

  // Transform documents data into grouped structure
  const docGroups = useMemo(() => {
    if (!Array.isArray(documentsData)) return [];
    const groups: Record<string, DocumentItem[]> = {};
    documentsData.filter((d: any) => d.isPublic !== false).forEach((doc: any) => {
      const cat = doc.topic?.name || "Chung";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({
        title: doc.title,
        slug: doc.slug,
        description: (doc.content || "").substring(0, 100).replace(/<[^>]+>/g, '') + '...',
        attachments: doc.attachments || []
      });
    });
    return Object.keys(groups).map(k => ({ category: k, items: groups[k] }));
  }, [documentsData]);

  // Templates come directly from API
  const templates = useMemo(() => {
    return Array.isArray(templatesData) ? templatesData : [];
  }, [templatesData]);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-16 px-4 transition-colors duration-300 relative overflow-hidden">
      
      {/* Background Glow Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-500/20 dark:bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/4 -right-40 w-[600px] h-[600px] bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-[150px]" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-indigo-500/20 dark:bg-indigo-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">

        {/* HERO SECTION */}
        <section className="text-center max-w-3xl mx-auto space-y-6 pt-8 pb-4 animate-in slide-in-from-bottom-6 fade-in duration-700">
          <span className="px-3 py-1 text-xs font-bold tracking-wider uppercase rounded-full bg-primary/10 text-primary">{tStr.heroTag}</span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">{tStr.heroTitle}</h1>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">{tStr.heroDesc}</p>
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start gap-2 bg-transparent h-auto p-1 border-b border-border rounded-none">
            <TabsTrigger value="courses" className="data-[state=active]:bg-accent">{tStr.tabVideos}</TabsTrigger>
            <TabsTrigger value="docs" className="data-[state=active]:bg-accent">{tStr.tabDocs}</TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-accent">{tStr.tabTemplates}</TabsTrigger>
          </TabsList>

          {/* SECTION 1: KHÓA HỌC */}
          <TabsContent value="courses" className="space-y-6 animate-in fade-in duration-300 mt-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <Video size={22} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">{tStr.tabVideos}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{tStr.tabVideosDesc}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {coursesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <Skeleton className="aspect-[16/10] w-full rounded-none" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-8 w-24 mt-2" />
                  </div>
                </div>
              ))
            ) : videoLessons.map((video) => (
              <div
                key={video.id}
                onClick={() => router.push(`/creator-lab/courses/${video.slug}`)}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-100 dark:border-slate-800/50 rounded-2xl overflow-hidden flex flex-col group hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-950 relative overflow-hidden flex items-center justify-center">
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover transition duration-700 group-hover:scale-105 group-hover:opacity-90"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-400">
                      <span>No Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)] transition transform scale-90 group-hover:scale-100">
                      <Play size={20} className="fill-white translate-x-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{video.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{video.desc}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {video.enrolledCount} {isVi ? "học viên" : "students"}
                      </span>
                      <span className="flex items-center gap-1">
                        <PlayCircle size={12} />
                        {video.lessonCount} {isVi ? "bài" : "lessons"}
                      </span>
                      {video.totalDuration > 0 && (
                        <span>
                          {Math.floor(video.totalDuration / 3600) > 0
                            ? `${Math.floor(video.totalDuration / 3600)}${isVi ? "g" : "h"} ${Math.floor((video.totalDuration % 3600) / 60)}${isVi ? "p" : "m"}`
                            : `${Math.floor(video.totalDuration / 60)}${isVi ? " phút" : " min"}`
                          }
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/50 flex justify-end items-center text-xs font-medium">
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      {tStr.youtubeBtn} <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </TabsContent>

        {/* SECTION 2: TÀI LIỆU HỌC TẬP */}
        <TabsContent value="docs" className="space-y-6 animate-in fade-in duration-300 mt-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <BookOpen size={22} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">{tStr.tabDocs}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{tStr.tabDocsDesc}</p>
            </div>
          </div>
          <div className="space-y-10">
            {docsLoading ? (
              Array.from({ length: 2 }).map((_, gi) => (
                <div key={gi} className="space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="flex gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : docGroups.map((group, idx) => (
              <div key={idx} className="space-y-4">
                <h3 className="text-lg font-extrabold text-blue-600 dark:text-blue-400 border-b dark:border-slate-800 pb-2">{group.category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.items.map((doc, docIdx) => (
                    <div
                      key={docIdx}
                      onClick={() => router.push('/creator-lab/documents/' + doc.slug)}
                      className="group flex gap-4 p-4 md:p-5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all hover:-translate-y-1"
                    >
                      <div className="w-12 h-12 shrink-0 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <BookOpen size={24} />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <h4 className="font-bold text-slate-800 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {doc.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {doc.description || "Nội dung bài học..."}
                        </p>
                        {doc.attachments && doc.attachments.length > 0 && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                             <FileText size={14} className="text-slate-400" />
                             <span className="text-[11px] font-medium text-slate-500">{doc.attachments.length} tài liệu đính kèm</span>
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-blue-500">
                        <ArrowRight size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* SECTION 3: MẪU TEMPLATES */}
        <TabsContent value="templates" className="space-y-6 animate-in fade-in duration-300 mt-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <FileText size={22} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">{tStr.tabTemplates}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{tStr.tabTemplatesDesc}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {templatesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <Skeleton className="aspect-[16/10] w-full rounded-none" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-3 w-20 rounded-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-8 w-full mt-2 rounded-xl" />
                  </div>
                </div>
              ))
            ) : templates.map((tpl, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col group hover:shadow-lg hover:-translate-y-1 transition">
                {tpl.thumbnailUrl ? (
                  <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                    <img
                      src={tpl.thumbnailUrl}
                      alt={tpl.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <FileText size={32} />
                  </div>
                )}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider w-fit inline-flex items-center gap-1 border border-amber-200 dark:border-amber-500/30">
                      <FileText size={11} />
                      Mẫu Capcut
                    </span>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{tpl.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {tpl.description}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/50">
                    <a
                      href={tpl.capcutLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl transition-all shadow-sm shadow-amber-500/20"
                    >
                      {tStr.capcutBtn} <ArrowRight size={14} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </TabsContent>
        </Tabs>

      </div>
    </main>
  );
}
