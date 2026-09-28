"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";
import { toast } from "sonner";
import { 
  Loader2, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Upload, 
  Video, 
  FileText, 
  FileCheck, 
  AlertCircle, 
  Link as LinkIcon,
  BookOpen,
  HelpCircle
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import { generateSlug } from "@/lib/utils";
import { LessonQuizModal } from "../../app/[locale]/admin/creator-lab/courses/LessonQuizModal";

const TiptapEditor = dynamic(
  () => import('@/components/TiptapEditor').then(m => m.TiptapEditor),
  { ssr: false, loading: () => <div className="h-40 bg-gray-100 animate-pulse rounded-md border border-gray-200"></div> }
);

const getFileNameFromUrl = (url: string) => {
  if (!url) return "";
  try {
    if (url.includes('?file=')) {
      const urlObj = new URL(url, 'http://localhost');
      const fileParam = urlObj.searchParams?.get('file');
      if (fileParam) {
        const decoded = decodeURIComponent(fileParam);
        const namePart = decoded.split('/').pop() || decoded;
        return namePart.replace(/^\d+-/, '');
      }
    }
    const decodedUrl = decodeURIComponent(url);
    const lastSegment = decodedUrl.split('/').pop() || url;
    return lastSegment.split('?')[0] || lastSegment;
  } catch (e) {
    return url;
  }
};

interface Lesson {
  id: string;
  title: string;
  slug: string;
  order: number;
  videoUrl?: string;
  vttUrl?: string;
  documentUrl?: string;
  documents?: string[];
  content?: string;
  chapterId: string;
}

interface Chapter {
  id: string;
  title: string;
  order: number;
  courseId: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface ManageLessonsProps {
  course: Course;
  onRefreshCourses?: () => void;
}

export function ManageLessons({ course, onRefreshCourses }: ManageLessonsProps) {
  const { data: session } = useSession();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  // Lesson states
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [quizLesson, setQuizLesson] = useState<Lesson | null>(null);
  const [targetChapterId, setTargetChapterId] = useState<string>("");
  const [lessonFormData, setLessonFormData] = useState({
    title: "",
    slug: "",
    videoUrl: "",
    vttUrl: "",
    documentUrl: "",
    documents: [] as string[],
    content: ""
  });

  // Upload progress states
  const [uploadingField, setUploadingField] = useState<"video" | "vtt" | "document" | null>(null);

  // Confirm Delete states
  const [deleteChapterId, setDeleteChapterId] = useState<string | null>(null);
  const [deleteLessonId, setDeleteLessonId] = useState<string | null>(null);

  useEffect(() => {
    fetchChapters();
  }, [course]);

  const fetchChapters = async () => {
    setLoading(true);
    try {
      const res = await apiClient.request(`/courses/${encodeURIComponent(course.slug)}`);
      if (res.ok) {
        const data = await res.json();
        setChapters(data.chapters || []);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách chương:", err);
      toast.error("Không thể tải chương trình học");
    } finally {
      setLoading(false);
    }
  };

  // Safe File Upload Validation & Execution
  const handleFileUpload = async (file: File, type: "video" | "vtt" | "document") => {
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    
    // 1. Validate formats & sizes on frontend
    if (type === "video") {
      const allowed = ['.mp4', '.webm', '.mov'];
      if (!allowed.includes(ext)) {
        throw new Error(`Định dạng video ${ext} không hợp lệ. Chỉ hỗ trợ MP4, WEBM, MOV.`);
      }
      if (file.size > 50 * 1024 * 1024) {
        throw new Error("Dung lượng video vượt quá 50MB. Vui lòng tải video lên YouTube/Vimeo hoặc nền tảng lưu trữ và sử dụng tùy chọn nhúng video thay thế.");
      }
    } else if (type === "vtt") {
      const allowed = ['.vtt', '.srt'];
      if (!allowed.includes(ext)) {
        throw new Error(`Định dạng phụ đề ${ext} không hợp lệ. Chỉ hỗ trợ VTT, SRT.`);
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("Tệp phụ đề vượt quá giới hạn cho phép (10MB). Vui lòng tối ưu hóa hoặc rút ngắn tệp phụ đề.");
      }
    } else if (type === "document") {
      const allowed = [
        '.pdf', '.png', '.jpg', '.jpeg', '.webp',
        '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'
      ];
      if (!allowed.includes(ext)) {
        throw new Error(`Định dạng tài liệu ${ext} không được phép tải lên.`);
      }

      const isPdf = ext === '.pdf';
      const isImage = ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
      const isOffice = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'].includes(ext);

      if (isPdf && file.size > 100 * 1024 * 1024) {
        throw new Error("Tài liệu PDF vượt quá giới hạn cho phép (100MB). Vui lòng nén file PDF hoặc chia nhỏ tài liệu.");
      } else if (isImage && file.size > 10 * 1024 * 1024) {
        throw new Error("Hình ảnh vượt quá giới hạn cho phép (10MB). Vui lòng tối ưu hóa hình ảnh hoặc chuyển sang định dạng WebP.");
      } else if (isOffice && file.size > 20 * 1024 * 1024) {
        throw new Error("Tài liệu văn phòng vượt quá giới hạn cho phép (20MB). Vui lòng nén tệp hoặc chuyển đổi định dạng.");
      }
    }

    const form = new FormData();
    form.append("file", file);
    const res = await apiClient.request("/media/upload", {
      method: "POST",
      body: form
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || "Tải tệp tin lên thất bại");
    }

    const data = await res.json();
    return data.url;
  };

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: "video" | "vtt" | "document") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(type);
    try {
      const url = await handleFileUpload(file, type);
      setLessonFormData(prev => ({ ...prev, [`${type}Url`]: url }));
      toast.success("Tải tệp lên thành công!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải tệp lên");
    } finally {
      setUploadingField(null);
      e.target.value = ""; // reset input
    }
  };

  // Chapter handlers
  const handleChapterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;

    try {
      const url = editingChapter 
        ? `/chapters/${editingChapter.id}`
        : "/chapters";
      const method = editingChapter ? "PUT" : "POST";
          const body = editingChapter 
        ? { title: newChapterTitle }
        : {
            title: newChapterTitle,
            order: chapters.length + 1,
            courseId: course.id
          };

      const res = await apiClient.request(url, {
        method,
        body: JSON.stringify(body)
      });

      if (res.ok) {
        toast.success(editingChapter ? "Đã cập nhật chương học" : "Đã thêm chương mới");
        setNewChapterTitle("");
        setIsAddingChapter(false);
        setEditingChapter(null);
        fetchChapters();
        if (onRefreshCourses) onRefreshCourses();
      } else {
        toast.error("Lỗi khi lưu chương học");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối");
    }
  };

  const confirmDeleteChapter = async () => {
    if (!deleteChapterId) return;

    try {
      const res = await apiClient.request(`/chapters/${deleteChapterId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast.success("Đã xóa chương học thành công");
        fetchChapters();
        if (onRefreshCourses) onRefreshCourses();
      } else {
        toast.error("Lỗi khi xóa chương học");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối");
    } finally {
      setDeleteChapterId(null);
    }
  };

  // Lesson handlers
  const openAddLessonModal = (chapterId: string) => {
    setTargetChapterId(chapterId);
    setEditingLesson(null);
    setLessonFormData({
      title: "",
      slug: "",
      videoUrl: "",
      vttUrl: "",
      documentUrl: "",
      documents: [],
      content: ""
    });
    setIsLessonModalOpen(true);
  };

  const openEditLessonModal = (lesson: Lesson) => {
    setTargetChapterId(lesson.chapterId);
    setEditingLesson(lesson);
    setLessonFormData({
      title: lesson.title,
      slug: lesson.slug || "",
      videoUrl: lesson.videoUrl || "",
      vttUrl: lesson.vttUrl || "",
      documentUrl: lesson.documentUrl || "",
      documents: lesson.documents || [],
      content: lesson.content || ""
    });
    setIsLessonModalOpen(true);
  };

  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonFormData.title.trim()) return;

    const isEdit = !!editingLesson;
    const url = isEdit ? `/lessons/${editingLesson.id}` : "/lessons";
    const method = isEdit ? "PUT" : "POST";

    const payload = isEdit
      ? {
          title: lessonFormData.title,
          slug: lessonFormData.slug,
          videoUrl: lessonFormData.videoUrl,
          vttUrl: lessonFormData.vttUrl,
          documentUrl: lessonFormData.documentUrl,
          documents: lessonFormData.documents,
          content: lessonFormData.content
        }
      : {
          title: lessonFormData.title,
          slug: lessonFormData.slug,
          videoUrl: lessonFormData.videoUrl,
          vttUrl: lessonFormData.vttUrl,
          documentUrl: lessonFormData.documentUrl,
          documents: lessonFormData.documents,
          content: lessonFormData.content,
          order: (chapters.find(c => c.id === targetChapterId)?.lessons.length || 0) + 1,
          chapterId: targetChapterId
        };

    try {
      const res = await apiClient.request(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(isEdit ? "Cập nhật bài học thành công" : "Thêm bài học thành công");
        setIsLessonModalOpen(false);
        fetchChapters();
        if (onRefreshCourses) onRefreshCourses();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Lỗi lưu bài học");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối");
    }
  };

  const confirmDeleteLesson = async () => {
    if (!deleteLessonId) return;

    try {
      const res = await apiClient.request(`/lessons/${deleteLessonId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast.success("Đã xóa bài học thành công");
        fetchChapters();
        if (onRefreshCourses) onRefreshCourses();
      } else {
        toast.error("Có lỗi khi xóa bài học");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối");
    } finally {
      setDeleteLessonId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex py-12 justify-center items-center">
        <Loader2 className="animate-spin text-blue-500 mr-2" size={24} />
        <span className="text-sm text-slate-500 font-medium">Đang tải chương trình học...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800">
        <div>
          <h4 className="font-bold text-slate-800 dark:text-white text-sm">Chương trình học của khóa</h4>
          <p className="text-xs text-slate-500 mt-1">Quản lý và biên tập nội dung bài giảng đa cấp</p>
        </div>
        {!isAddingChapter && !editingChapter && (
          <Button 
            type="button" 
            size="sm"
            onClick={() => {
              setEditingChapter(null);
              setNewChapterTitle("");
              setIsAddingChapter(true);
            }}
          >
            <Plus size={16} className="mr-1" /> Thêm chương
          </Button>
        )}
      </div>

      {/* Add / Edit Chapter Form */}
      {(isAddingChapter || editingChapter) && (
        <form onSubmit={handleChapterSubmit} className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
          <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300">{editingChapter ? "Sửa chương học" : "Thêm chương học mới"}</h4>
          <div className="flex gap-3">
            <input
              type="text"
              required
              placeholder="Ví dụ: Chương 1: Giới thiệu chung"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:border-blue-500 transition"
            />
            <Button type="submit" size="sm" variant="default">Lưu lại</Button>
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setIsAddingChapter(false);
                setEditingChapter(null);
                setNewChapterTitle("");
              }}
            >
              Hủy
            </Button>
          </div>
        </form>
      )}

      {/* Chapters list */}
      <div className="space-y-4">
        {chapters.map((chap, chapIdx) => (
          <div key={chap.id} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-50/70 dark:bg-slate-900/40 px-4 py-3 flex justify-between items-center border-b border-slate-200 dark:border-slate-800">
              <div className="font-bold text-sm text-slate-800 dark:text-white">
                Chương {chapIdx + 1}: {chap.title}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openAddLessonModal(chap.id)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/20 rounded transition"
                  title="Thêm bài học"
                >
                  <Plus size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingChapter(chap);
                    setNewChapterTitle(chap.title);
                    setIsAddingChapter(false);
                  }}
                  className="p-1.5 text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 rounded transition"
                  title="Sửa chương"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteChapterId(chap.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 rounded transition"
                  title="Xóa chương"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Lessons in Chapter */}
            <div className="p-3 space-y-2 bg-white dark:bg-slate-900">
              {chap.lessons && chap.lessons.length > 0 ? (
                chap.lessons.map((lesson, lesIdx) => (
                  <div key={lesson.id} className="flex justify-between items-center p-3 border border-slate-100 dark:border-slate-800/80 rounded-xl hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-xs font-semibold text-slate-500">
                        {lesIdx + 1}
                      </div>
                      <div>
                        <div className="text-sm text-slate-800 dark:text-slate-200 font-bold">{lesson.title}</div>
                        <div className="flex gap-3 mt-1.5 text-xxs text-slate-400 font-medium">
                          {lesson.videoUrl && <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400"><Video size={12} /> Có video</span>}
                          {lesson.documentUrl && <span className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400"><FileText size={12} /> Có tài liệu đính kèm</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setQuizLesson(lesson)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/20 rounded-lg transition"
                        title="Trắc nghiệm & Bài tập"
                      >
                        <HelpCircle size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditLessonModal(lesson)}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition"
                        title="Sửa bài học"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteLessonId(lesson.id)}
                        className="p-1.5 text-red-500 hover:bg-rose-50 dark:text-red-400 dark:hover:bg-rose-950/20 rounded-lg transition"
                        title="Xóa bài học"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 text-center py-3 italic">Chưa có bài học nào trong chương này.</div>
              )}
            </div>
          </div>
        ))}

        {chapters.length === 0 && (
          <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 text-sm">
            Chưa có chương học nào được tạo.
          </div>
        )}
      </div>

      {/* Lesson Edit Modal */}
      <Dialog open={isLessonModalOpen} onOpenChange={setIsLessonModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <DialogTitle>{editingLesson ? "Chỉnh sửa bài học" : "Thêm bài học mới"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleLessonSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">Tên bài học <span className="text-red-500">*</span></label>
                <Input
                  type="text"
                  required
                  value={lessonFormData.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    if (!editingLesson && lessonFormData.slug === generateSlug(lessonFormData.title)) {
                      setLessonFormData(prev => ({ ...prev, title: newTitle, slug: generateSlug(newTitle) }));
                    } else if (!lessonFormData.slug) {
                      setLessonFormData(prev => ({ ...prev, title: newTitle, slug: generateSlug(newTitle) }));
                    } else {
                      setLessonFormData(prev => ({ ...prev, title: newTitle }));
                    }
                  }}
                  placeholder="Ví dụ: Bài 1: Luật phân hạng thương tật"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">Slug (URL) <span className="text-red-500">*</span></label>
                <Input
                  type="text"
                  required
                  value={lessonFormData.slug}
                  onChange={(e) => setLessonFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="luat-phan-hang-thuong-tat"
                />
              </div>
            </div>

            {/* Video Lesson Section */}
            <div className="border border-slate-100 dark:border-slate-800 p-4 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block flex items-center gap-1">
                  <Video size={16} className="text-emerald-500" /> Video bài giảng (Youtube link hoặc tải lên tối đa 50MB)
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-xxs font-semibold text-slate-400 block">Dán liên kết (URL Video)</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={lessonFormData.videoUrl}
                      onChange={(e) => setLessonFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                      placeholder="https://youtube.com/watch?v=... hoặc URL video"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <input
                    type="file"
                    id="lesson-video-upload"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => onFileSelect(e, "video")}
                  />
                  <label
                    htmlFor="lesson-video-upload"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer text-sm font-semibold text-slate-600 dark:text-slate-300"
                  >
                    {uploadingField === "video" ? <Loader2 className="animate-spin text-blue-500" size={18} /> : <Upload size={18} />}
                    <span>Tải video trực tiếp (Max 50MB)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Subtitle & Document Attachment Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Document upload */}
              <div className="border border-slate-100 dark:border-slate-800 p-4 rounded-xl space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block flex items-center gap-1">
                  <FileText size={16} className="text-indigo-500" /> Tài liệu đính kèm (PDF dưới 100MB, Office dưới 20MB)
                </label>
                {lessonFormData.documentUrl ? (
                  <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs border border-slate-200 dark:border-slate-700">
                    <span className="truncate text-slate-600 dark:text-slate-400 flex-1 font-medium" title={lessonFormData.documentUrl}>
                      {getFileNameFromUrl(lessonFormData.documentUrl)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setLessonFormData(prev => ({ ...prev, documentUrl: "" }))}
                      className="shrink-0 p-1 text-slate-400 hover:text-red-500 rounded transition"
                      title="Xóa tài liệu"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <Input
                    type="text"
                    value={lessonFormData.documentUrl || ""}
                    onChange={(e) => setLessonFormData(prev => ({ ...prev, documentUrl: e.target.value }))}
                    placeholder="Nhập link tài liệu hoặc tải lên"
                  />
                )}
                <input
                  type="file"
                  id="lesson-doc-upload"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingField("document");
                    try {
                      const url = await handleFileUpload(file, "document");
                      setLessonFormData(prev => ({ ...prev, documentUrl: url }));
                      toast.success("Tải tài liệu lên thành công!");
                    } catch (err: any) {
                      toast.error(err.message || "Lỗi tải tài liệu");
                    } finally {
                      setUploadingField(null);
                      e.target.value = "";
                    }
                  }}
                />
                <label
                  htmlFor="lesson-doc-upload"
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  {uploadingField === "document" ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                  <span>Tải tài liệu chính</span>
                </label>
              </div>

              {/* Multi-document upload */}
              <div className="border border-slate-100 dark:border-slate-800 p-4 rounded-xl space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block flex items-center gap-1">
                  <FileText size={16} className="text-emerald-500" /> Tài liệu bổ sung ({lessonFormData.documents.length})
                </label>
                {lessonFormData.documents.length > 0 && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {lessonFormData.documents.map((url, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs">
                        <span className="truncate text-slate-600 dark:text-slate-400 flex-1 font-medium" title={url}>
                          {getFileNameFromUrl(url)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setLessonFormData(prev => ({
                            ...prev,
                            documents: prev.documents.filter((_, i) => i !== idx)
                          }))}
                          className="shrink-0 p-1 text-slate-400 hover:text-red-500 rounded transition"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  type="file"
                  id="lesson-docs-upload"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingField("document");
                    try {
                      const url = await handleFileUpload(file, "document");
                      setLessonFormData(prev => ({ ...prev, documents: [...prev.documents, url] }));
                      toast.success("Đã thêm tài liệu bổ sung!");
                    } catch (err: any) {
                      toast.error(err.message || "Lỗi tải tài liệu");
                    } finally {
                      setUploadingField(null);
                      e.target.value = "";
                    }
                  }}
                />
                <label
                  htmlFor="lesson-docs-upload"
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer text-xs font-bold text-emerald-600 dark:text-emerald-400"
                >
                  {uploadingField === "document" ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                  <span>Thêm tài liệu bổ sung</span>
                </label>
              </div>

              {/* Subtitle upload */}
              <div className="border border-slate-100 dark:border-slate-800 p-4 rounded-xl space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block flex items-center gap-1">
                  <FileCheck size={16} className="text-blue-500" /> Phụ đề bài giảng (.VTT, .SRT dưới 10MB)
                </label>
                {lessonFormData.vttUrl ? (
                  <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs border border-slate-200 dark:border-slate-700">
                    <span className="truncate text-slate-600 dark:text-slate-400 flex-1 font-medium" title={lessonFormData.vttUrl}>
                      {getFileNameFromUrl(lessonFormData.vttUrl)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setLessonFormData(prev => ({ ...prev, vttUrl: "" }))}
                      className="shrink-0 p-1 text-slate-400 hover:text-red-500 rounded transition"
                      title="Xóa phụ đề"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <Input
                    type="text"
                    value={lessonFormData.vttUrl || ""}
                    onChange={(e) => setLessonFormData(prev => ({ ...prev, vttUrl: e.target.value }))}
                    placeholder="Nhập link phụ đề hoặc tải lên"
                  />
                )}
                <input
                  type="file"
                  id="lesson-vtt-upload"
                  accept=".vtt,.srt"
                  className="hidden"
                  onChange={(e) => onFileSelect(e, "vtt")}
                />
                <label
                  htmlFor="lesson-vtt-upload"
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  {uploadingField === "vtt" ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                  <span>Tải phụ đề lên</span>
                </label>
              </div>
            </div>

            {/* Lesson Content Tiptap Editor */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">Mô tả / Nội dung chi tiết bài học (văn bản)</label>
              <TiptapEditor
                value={lessonFormData.content}
                onChange={(val) => setLessonFormData(prev => ({ ...prev, content: val }))}
              />
            </div>

            <DialogFooter className="px-0 pb-0">
              <Button type="button" variant="outline" onClick={() => setIsLessonModalOpen(false)}>
                Hủy bỏ
              </Button>
              <Button type="submit">Lưu bài học</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={deleteChapterId !== null}
        title="Xóa chương học"
        message="Bạn có chắc muốn xóa chương này cùng toàn bộ bài học bên trong? Hành động này không thể hoàn tác."
        confirmText="Xóa chương"
        onConfirm={confirmDeleteChapter}
        onCancel={() => setDeleteChapterId(null)}
        type="danger"
      />

      {/* Lesson Quiz Modal */}
      {quizLesson && (
        <LessonQuizModal 
          lesson={quizLesson as any} 
          onClose={() => setQuizLesson(null)} 
        />
      )}

      <ConfirmModal
        isOpen={deleteLessonId !== null}
        title="Xóa bài học"
        message="Bạn có chắc chắn muốn xóa bài học này không? Hành động này không thể hoàn tác."
        confirmText="Xóa bài học"
        onConfirm={confirmDeleteLesson}
        onCancel={() => setDeleteLessonId(null)}
        type="danger"
      />
    </div>
  );
}
