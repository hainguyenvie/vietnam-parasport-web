"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from '@/hooks/useTranslation';
import { 
  Loader2, 
  Trash2, 
  BookOpen, 
  Calendar,
  Plus,
  Edit2,
  X,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Upload,
  HelpCircle,
  MessageSquare
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { MediaUpload } from "@/components/MediaUpload";
import dynamic from "next/dynamic";
const TiptapEditor = dynamic(() => import('@/components/TiptapEditor').then(m => m.TiptapEditor), { ssr: false, loading: () => <div className="h-40 bg-gray-100 animate-pulse rounded-md border border-gray-200"></div> });
import { generateSlug } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LessonQuizModal } from "./LessonQuizModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { CommentsModal } from "@/components/admin/CommentsModal";
import { ManageLessons } from "@/components/admin/ManageLessons";

// next/image available for migration — add unoptimized for dynamic URLs

interface Lesson {
  id: string;
  title: string;
  slug: string;
  order: number;
  videoUrl?: string;
  content?: string;
  duration?: number;
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
  description: string;
  thumbnail?: string;
  learningObjectives?: string;
  requirements?: string;
  chapters?: Chapter[];
  createdAt: string;
}

const translations: Record<string, Record<string, any>> = {
  vi: {
    searchPlaceholder: "Tìm kiếm tên khóa học hoặc slug...",
    thThumbnail: "Ảnh",
    thTitle: "Tên Khóa học",
    thChapters: "Số chương",
    thDate: "Ngày tạo",
    thActions: "Thao tác",
    colToggle: "Hiển thị cột",
    colChoose: "Chọn cột hiển thị",
    pageSizeLabel: "Hiển thị",
    pageSizeSuffix: "dòng mỗi trang",
    pageDisplay: (start: number, end: number, total: number) => `Hiển thị ${start} - ${end} trên ${total} dòng`,
    noResults: "Không tìm thấy khóa học nào phù hợp.",
    addCourse: "Thêm Khóa học",
    editCourse: "Chỉnh Sửa Khóa Học",
    newCourse: "Thêm Khóa Học Mới",
    courseTitleLabel: "Tên Khóa học",
    slugLabel: "Slug (URL)",
    descriptionLabel: "Mô tả khóa học",
    thumbnailLabel: "Đường dẫn Ảnh đại diện",
    tabInfo: "Thông tin",
    tabCurriculum: "Chương trình học",
    addChapter: "Thêm chương mới",
    addLesson: "Thêm bài học",
    editLesson: "Sửa bài học",
    chapterTitlePlaceholder: "Nhập tên chương...",
    lessonTitleLabel: "Tên bài học",
    lessonSlugLabel: "Slug bài học (URL)",
    lessonVideoLabel: "Đường dẫn Video",
    lessonContentLabel: "Nội dung bài học (Văn bản)",
    btnCancel: "Hủy bỏ",
    btnSave: "Lưu lại",
    btnEdit: "Sửa",
    btnDelete: "Xóa",
    alertDeleteSuccess: "Đã xóa khóa học thành công.",
    alertDeleteError: "Có lỗi khi xóa khóa học.",
    alertSaveSuccess: "Đã lưu thành công.",
    alertConnError: "Lỗi kết nối máy chủ.",
    thSTT: "STT"
  },
  en: {
    searchPlaceholder: "Search course title or slug...",
    thThumbnail: "Image",
    thTitle: "Course Title",
    thChapters: "Chapters",
    thDate: "Created Date",
    thActions: "Actions",
    colToggle: "Show columns",
    colChoose: "Choose columns",
    pageSizeLabel: "Show",
    pageSizeSuffix: "rows per page",
    pageDisplay: (start: number, end: number, total: number) => `Showing ${start} - ${end} of ${total} rows`,
    noResults: "No matching courses found.",
    addCourse: "Add Course",
    editCourse: "Edit Course",
    newCourse: "Add New Course",
    courseTitleLabel: "Course Title",
    slugLabel: "Slug (URL)",
    descriptionLabel: "Description",
    thumbnailLabel: "Thumbnail URL",
    tabInfo: "Information",
    tabCurriculum: "Curriculum",
    addChapter: "Add new chapter",
    addLesson: "Add lesson",
    editLesson: "Edit lesson",
    chapterTitlePlaceholder: "Enter chapter title...",
    lessonTitleLabel: "Lesson Title",
    lessonSlugLabel: "Lesson Slug (URL)",
    lessonVideoLabel: "Video URL",
    lessonContentLabel: "Lesson Content (Text)",
    btnCancel: "Cancel",
    btnSave: "Save",
    btnEdit: "Edit",
    btnDelete: "Delete",
    alertDeleteSuccess: "Successfully deleted course.",
    alertDeleteError: "Failed to delete course.",
    alertSaveSuccess: "Successfully saved.",
    alertConnError: "Server connection error.",
    thSTT: "No."
  }
};

export default function AdminCoursesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language } = useLanguage();
  const tStr = translations[language] || translations.vi;

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [alertInfo, setAlertInfo] = useState<{isOpen: boolean, title: string, message: string, type: "danger" | "warning" | "info"}>({ isOpen: false, title: "", message: "", type: "danger" });
  const [deleteCourse, setDeleteCourse] = useState<{id: string, name: string} | null>(null);
  const [deleteChapterId, setDeleteChapterId] = useState<string | null>(null);
  const [deleteLessonId, setDeleteLessonId] = useState<string | null>(null);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "curriculum">("info");
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedCourseForComments, setSelectedCourseForComments] = useState<any>(null);
  const [courseFormData, setCourseFormData] = useState({
    title: "",
    slug: "",
    thumbnail: "",
    description: "",
    learningObjectives: "",
    requirements: ""
  });
  const [formLoading, setFormLoading] = useState(false);

  // Curriculum states
  const [courseChapters, setCourseChapters] = useState<Chapter[]>([]);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [isAddingChapter, setIsAddingChapter] = useState(false);

  // Lesson sub-modal/form states
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [quizLesson, setQuizLesson] = useState<Lesson | null>(null);
  const [targetChapterId, setTargetChapterId] = useState<string>("");
  const [lessonFormData, setLessonFormData] = useState({
    title: "",
    slug: "",
    videoUrl: "",
    content: ""
  });

  // Table tools state
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(["thumbnail", "title", "chapters", "date"]);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({
    key: "",
    direction: null
  });

  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await apiClient.request("/media/upload?isPublic=true", {
        method: "POST",
        body: form
      });
      if (res.ok) {
        const data = await res.json();
        setCourseFormData(prev => ({ ...prev, thumbnail: data.url }));
      } else {
        const errData = await res.json().catch(() => ({}));
        const defaultMsg = language === "vi" ? "Tải ảnh lên thất bại." : "Failed to upload image.";
        const msg = errData.message || defaultMsg;
        setAlertInfo({ isOpen: true, title: "Lỗi tải ảnh", message: typeof msg === "object" ? msg[0] : msg, type: "danger" });
      }
    } catch (err) {
      console.error("Upload error:", err);
      setAlertInfo({ isOpen: true, title: "Lỗi kết nối", message: language === "vi" ? "Lỗi kết nối khi tải ảnh." : "Connection error when uploading image.", type: "danger" });
    } finally {
      setUploading(false);
    }
  };

  const handleRowClick = (e: React.MouseEvent, course: Course) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest("input") || target.closest("select")) {
      return;
    }
    openEditModal(course);
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const role = (session.user as any).role;
      if (role !== "SUPER_ADMIN" && role !== "ADMIN" && role !== "INSTRUCTOR") {
        router.push("/");
      } else {
        fetchCourses();
      }
    }
  }, [status, session, router]);

  // Click outside for column visibility dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowColumnDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset pagination on filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  const fetchCourses = async () => {
    try {
      const res = await apiClient.request("/courses");
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(tStr.alertConnError);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" | null = "asc";
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else if (sortConfig.direction === "desc") {
        direction = null;
      }
    }
    setSortConfig({ key, direction });
  };

  const openAddModal = () => {
    setEditingCourse(null);
    setCourseFormData({ title: "", slug: "", thumbnail: "", description: "", learningObjectives: "", requirements: "" });
    setCourseChapters([]);
    setActiveTab("info");
    setErrorMsg("");
    setMessage("");
    setIsModalOpen(true);
  };

  const openEditModal = async (course: Course) => {
    setEditingCourse(course);
    setCourseFormData({
      title: course.title,
      slug: generateSlug(course.slug || course.title),
      thumbnail: course.thumbnail || "",
      description: course.description,
      learningObjectives: course.learningObjectives || "",
      requirements: course.requirements || ""
    });
    // Load chapters & lessons
    setCourseChapters(course.chapters || []);
    setActiveTab("info");
    setErrorMsg("");
    setMessage("");
    setIsModalOpen(true);
    
    // Refresh course details to make sure chapters are fresh
    try {
      const res = await apiClient.request(`/courses/${encodeURIComponent(course.slug)}`);
      if (res.ok) {
        const responseData = await res.json();
        const fullCourse = responseData.data || responseData;
        setCourseChapters(fullCourse.chapters || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg("");
    setMessage("");

    const isEdit = !!editingCourse;
    const url = isEdit 
      ? getApiUrl(`/courses/${editingCourse.id}`) 
      : getApiUrl("/courses");
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify({ ...courseFormData, slug: generateSlug(courseFormData.slug) })
      });

      if (res.ok) {
        const savedCourse = (await res.json()).data || (await res.json());
        setMessage(tStr.alertSaveSuccess);
        fetchCourses();
        if (!isEdit) {
          // Open edit curriculum tab directly
          setEditingCourse(savedCourse);
          setCourseChapters([]);
          setActiveTab("curriculum");
        } else {
          setIsModalOpen(false);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.message || tStr.alertSaveError);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(tStr.alertConnError);
    } finally {
      setFormLoading(false);
    }
  };

  // Chapter handlers
  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim() || !editingCourse) return;

    try {
      const res = await apiClient.request("/chapters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify({
          title: newChapterTitle,
          order: courseChapters.length + 1,
          courseId: editingCourse.id
        })
      });

      if (res.ok) {
        const responseData = await res.json();
        const newChap = responseData.data || responseData;
        newChap.lessons = [];
        setCourseChapters(prev => [...prev, newChap]);
        setNewChapterTitle("");
        setIsAddingChapter(false);
        fetchCourses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDeleteChapter = async () => {
    if (!deleteChapterId) return;
    try {
      const res = await apiClient.request(`/chapters/${deleteChapterId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      if (res.ok) {
        setCourseChapters(prev => prev.filter(c => c.id !== deleteChapterId));
        fetchCourses();
      } else {
        setAlertInfo({ isOpen: true, title: "Lỗi", message: "Có lỗi khi xóa chương.", type: "danger" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteChapterId(null);
    }
  };

  // Lesson handlers
  const openAddLessonModal = (chapterId: string) => {
    setTargetChapterId(chapterId);
    setEditingLesson(null);
    setLessonFormData({ title: "", slug: "", videoUrl: "", content: "" });
    setIsLessonModalOpen(true);
  };

  const openEditLessonModal = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setTargetChapterId(lesson.chapterId);
    setLessonFormData({
      title: lesson.title,
      slug: generateSlug(lesson.slug || lesson.title),
      videoUrl: lesson.videoUrl || "",
      content: lesson.content || ""
    });
    setIsLessonModalOpen(true);
  };

  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    const isEdit = !!editingLesson;
    const url = isEdit 
      ? getApiUrl(`/lessons/${editingLesson.id}`) 
      : getApiUrl("/lessons");
    const method = isEdit ? "PUT" : "POST";

        const payload = isEdit 
      ? {
          title: lessonFormData.title,
          slug: generateSlug(lessonFormData.slug),
          videoUrl: lessonFormData.videoUrl,
          content: lessonFormData.content
        }
      : {
          title: lessonFormData.title,
          slug: generateSlug(lessonFormData.slug),
          videoUrl: lessonFormData.videoUrl,
          content: lessonFormData.content,
          chapterId: targetChapterId,
          order: 1,
        };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const responseData = await res.json();
        const savedLesson = responseData.data || responseData;
        setIsLessonModalOpen(false);
        
        // Refresh chapters list
        const refreshedRes = await apiClient.request(`/courses/${encodeURIComponent(editingCourse.slug)}`);
        if (refreshedRes.ok) {
          const refreshedData = await refreshedRes.json();
          const fullCourse = refreshedData.data || refreshedData;
          setCourseChapters(fullCourse.chapters || []);
        }
        fetchCourses();
      } else {
        const err = await res.json();
        setAlertInfo({ isOpen: true, title: "Lỗi", message: err.message || "Error saving lesson.", type: "danger" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDeleteLesson = async () => {
    if (!deleteLessonId) return;
    try {
      const res = await apiClient.request(`/lessons/${deleteLessonId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      if (res.ok) {
        setCourseChapters(prev => prev.map(chap => ({
          ...chap,
          lessons: chap.lessons.filter(l => l.id !== deleteLessonId)
        })));
        fetchCourses();
      } else {
        setAlertInfo({ isOpen: true, title: "Lỗi", message: "Có lỗi khi xóa bài học.", type: "danger" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLessonId(null);
    }
  };

  const confirmDeleteCourse = async () => {
    if (!deleteCourse) return;
    setActionLoading(deleteCourse.id);
    setMessage("");

    try {
      const res = await apiClient.request(`/courses/${deleteCourse.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      if (res.ok) {
        setMessage(tStr.alertDeleteSuccess);
        setCourses(prev => prev.filter(c => c.id !== deleteCourse.id));
      } else {
        setAlertInfo({ isOpen: true, title: "Lỗi", message: tStr.alertDeleteError, type: "danger" });
      }
    } catch (err) {
      console.error(err);
      setAlertInfo({ isOpen: true, title: "Lỗi kết nối", message: tStr.alertConnError, type: "danger" });
    } finally {
      setActionLoading(null);
      setDeleteCourse(null);
    }
  };

  // Filter courses
  const filteredCourses = courses.filter((c) => {
    const searchLower = searchQuery.toLowerCase();
    return c.title.toLowerCase().includes(searchLower) || c.slug.toLowerCase().includes(searchLower);
  });

  // Sort courses
  if (sortConfig.key) {
    filteredCourses.sort((a, b) => {
      let aVal: any = "";
      let bVal: any = "";

      switch (sortConfig.key) {
        case "title":
          aVal = a.title || "";
          bVal = b.title || "";
          break;
        case "chapters":
          aVal = a.chapters?.length || 0;
          bVal = b.chapters?.length || 0;
          break;
        case "date":
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        default:
          aVal = a[sortConfig.key as keyof Course] || "";
          bVal = b[sortConfig.key as keyof Course] || "";
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  // Pagination calculations
  const totalItems = filteredCourses.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

  const COLUMN_LABELS = {
    thumbnail: tStr.thThumbnail,
    title: tStr.thTitle,
    chapters: tStr.thChapters,
    date: tStr.thDate
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm flex items-center gap-2 border border-emerald-200 dark:border-emerald-900/50">
          <BookOpen size={18} className="text-emerald-500" />
          <span>{message}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-xl text-sm flex items-center gap-2 border border-red-200 dark:border-red-900/50">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {totalItems === 0 && courses.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center shadow-sm">
          <p className="text-slate-500 dark:text-slate-400">{tStr.noResults}</p>
        </div>
      ) : (
        <DataTable
          data={paginatedCourses}
          columns={[
            {
              key: "thumbnail",
              title: tStr.thThumbnail,
              sortable: false,
              render: (course) => (
                <div className="w-16 h-10 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-750 flex items-center justify-center overflow-hidden shadow-sm">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen size={16} className="text-slate-400" />
                  )}
                </div>
              )
            },
            {
              key: "title",
              title: tStr.thTitle,
              sortable: true,
              render: (course) => (
                <div>
                  <div className="font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-405 transition-colors">{course.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{course.slug}</div>
                </div>
              )
            },
            {
              key: "chapters",
              title: tStr.thChapters,
              sortable: true,
              render: (course) => (
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {course.chapters?.length || 0}
                </span>
              )
            },
            {
              key: "date",
              title: tStr.thDate,
              sortable: true,
              render: (course) => (
                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {new Date(course.createdAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
                </span>
              )
            },
            {
              key: "actions",
              title: tStr.thActions,
              render: (course) => (
                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setSelectedCourseForComments(course)} disabled={actionLoading !== null} className="p-1.5 hover:bg-orange-50 dark:hover:bg-orange-900/30 text-slate-400 hover:text-orange-600 rounded-lg transition border-none bg-transparent cursor-pointer disabled:opacity-50" title="Bình luận"><MessageSquare size={16} /></button>
                  <button
                    onClick={() => openEditModal(course)}
                    disabled={actionLoading !== null}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-755 text-slate-400 hover:text-blue-600 rounded-lg transition border-none bg-transparent cursor-pointer"
                    title={tStr.editCourse}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteCourse({ id: course.id, name: course.title })}
                    disabled={actionLoading !== null}
                    className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-600 rounded-lg transition border-none bg-transparent cursor-pointer disabled:opacity-50"
                    title={tStr.btnDelete}
                  >
                    {actionLoading === course.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              )
            }
          ]}
          totalRecords={totalItems}
          page={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          sortKey={sortConfig.key}
          sortDirection={sortConfig.direction}
          onSort={handleSort}
          searchPlaceholder={tStr.searchPlaceholder}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onCreate={openAddModal}
          createLabel={tStr.addCourse}
          onRowClick={(e, row) => openEditModal(row)}
        />
      )}

      {/* Main Course Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <DialogTitle>{editingCourse ? tStr.editCourse : tStr.newCourse}</DialogTitle>
          </DialogHeader>

          {/* Tabs (Only if editing, curriculum requires saved course) */}
          {editingCourse && (
            <div className="flex border-b border-slate-100 dark:border-slate-800 px-5">
              <button
                type="button"
                onClick={() => setActiveTab("info")}
                className={`py-3 px-4 text-sm font-bold border-b-2 transition ${
                  activeTab === "info" 
                    ? "border-blue-600 text-blue-600 dark:text-blue-400" 
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tStr.tabInfo}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("curriculum")}
                className={`py-3 px-4 text-sm font-bold border-b-2 transition ${
                  activeTab === "curriculum" 
                    ? "border-blue-600 text-blue-600 dark:text-blue-400" 
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tStr.tabCurriculum}
              </button>
            </div>
          )}

          {/* Modal Body */}
          {activeTab === "info" ? (
            <form onSubmit={handleCourseSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="courseTitle" className="text-xs font-bold text-slate-600 dark:text-slate-300 block">{tStr.courseTitleLabel} <span className="text-red-500">*</span></label>
                  <Input
                    type="text"
                    id="courseTitle"
                    required
                    value={courseFormData.title}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      if (!editingCourse && courseFormData.slug === generateSlug(courseFormData.title)) {
                        setCourseFormData({ ...courseFormData, title: newTitle, slug: generateSlug(newTitle) });
                      } else if (!courseFormData.slug) {
                        setCourseFormData({ ...courseFormData, title: newTitle, slug: generateSlug(newTitle) });
                      } else {
                        setCourseFormData({ ...courseFormData, title: newTitle });
                      }
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="courseSlug" className="text-xs font-bold text-slate-600 dark:text-slate-300 block">{tStr.slugLabel} <span className="text-red-500">*</span></label>
                  <Input
                    type="text"
                    id="courseSlug"
                    required
                    value={courseFormData.slug}
                    onChange={(e) => setCourseFormData({ ...courseFormData, slug: generateSlug(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  {tStr.thumbnailLabel}
                </label>
                <MediaUpload 
                  value={courseFormData.thumbnail}
                  onChange={(url) => setCourseFormData({ ...courseFormData, thumbnail: url })}
                  type="image"
                  placeholder={language === "vi" ? "Tải lên hình ảnh khóa học" : "Upload course image"}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="courseDesc" className="text-xs font-bold text-slate-600 dark:text-slate-300 block">{tStr.descriptionLabel} <span className="text-red-500">*</span></label>
                <TiptapEditor
                  value={courseFormData.description}
                  onChange={(val) => setCourseFormData({ ...courseFormData, description: val })}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="learningObj" className="text-xs font-bold text-slate-600 dark:text-slate-300 block">Bạn sẽ học được gì? (mỗi dòng 1 ý)</label>
                <Textarea
                  id="learningObj"
                  rows={4}
                  value={courseFormData.learningObjectives || ''}
                  onChange={(e) => setCourseFormData({ ...courseFormData, learningObjectives: e.target.value })}
                  placeholder="Nhập mỗi mục tiêu trên 1 dòng..."
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="requirements" className="text-xs font-bold text-slate-600 dark:text-slate-300 block">Yêu cầu (mỗi dòng 1 ý)</label>
                <Textarea
                  id="requirements"
                  rows={4}
                  value={courseFormData.requirements || ''}
                  onChange={(e) => setCourseFormData({ ...courseFormData, requirements: e.target.value })}
                  placeholder="Nhập mỗi yêu cầu trên 1 dòng..."
                />
              </div>

              <DialogFooter className="px-0">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  {tStr.btnCancel}
                </Button>
                <Button type="submit" disabled={formLoading} isLoading={formLoading}>
                  {tStr.btnSave}
                </Button>
              </DialogFooter>
            </form>
          ) : (
              <div className="p-5 overflow-y-auto flex-1 max-h-[70vh]">
                {editingCourse && (
                  <ManageLessons 
                    course={editingCourse} 
                    onRefreshCourses={fetchCourses} 
                  />
                )}
              </div>
            )}
        </DialogContent>
      </Dialog>

      {/* Lesson Sub-Modal Form */}
      <Dialog open={isLessonModalOpen} onOpenChange={setIsLessonModalOpen}>
        <DialogContent className="max-w-md overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <DialogTitle>{editingLesson ? tStr.editLesson : tStr.addLesson}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleLessonSubmit} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="lesTitle" className="text-xs font-bold text-slate-600 dark:text-slate-300 block">{tStr.lessonTitleLabel} <span className="text-red-500">*</span></label>
              <Input
                type="text"
                id="lesTitle"
                required
                value={lessonFormData.title}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  if (!editingLesson && lessonFormData.slug === generateSlug(lessonFormData.title)) {
                    setLessonFormData({ ...lessonFormData, title: newTitle, slug: generateSlug(newTitle) });
                  } else if (!lessonFormData.slug) {
                    setLessonFormData({ ...lessonFormData, title: newTitle, slug: generateSlug(newTitle) });
                  } else {
                    setLessonFormData({ ...lessonFormData, title: newTitle });
                  }
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="lesSlug" className="text-xs font-bold text-slate-600 dark:text-slate-300 block">{tStr.lessonSlugLabel} <span className="text-red-500">*</span></label>
              <Input
                type="text"
                id="lesSlug"
                required
                value={lessonFormData.slug}
                onChange={(e) => setLessonFormData({ ...lessonFormData, slug: generateSlug(e.target.value) })}
                placeholder="VD: bai-1-gioi-thieu"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="lesVideo" className="text-xs font-bold text-slate-600 dark:text-slate-300 block">{tStr.lessonVideoLabel}</label>
              <MediaUpload 
                value={lessonFormData.videoUrl}
                onChange={(url) => setLessonFormData({ ...lessonFormData, videoUrl: url })}
                type="video"
                placeholder="Link YouTube, Vimeo, hoặc upload MP4 (Tối đa 50MB)"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="lesContent" className="text-xs font-bold text-slate-600 dark:text-slate-300 block">{tStr.lessonContentLabel}</label>
              <TiptapEditor
                value={lessonFormData.content}
                onChange={(val) => setLessonFormData({ ...lessonFormData, content: val })}
              />
            </div>

            <DialogFooter className="px-0">
              <Button type="button" variant="outline" onClick={() => setIsLessonModalOpen(false)}>
                {tStr.btnCancel}
              </Button>
              <Button type="submit">
                {tStr.btnSave}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <ConfirmModal
        isOpen={deleteCourse !== null}
        title={language === "vi" ? "Xác nhận xóa khóa học" : "Confirm course deletion"}
        message={language === "vi" ? `Bạn có chắc chắn muốn xóa khóa học "${deleteCourse?.name}" không? Toàn bộ chương và bài học cũng sẽ bị xóa.` : `Are you sure you want to delete course "${deleteCourse?.name}"? All chapters and lessons will also be deleted.`}
        confirmText={language === "vi" ? "Xóa" : "Delete"}
        onConfirm={confirmDeleteCourse}
        onCancel={() => setDeleteCourse(null)}
        type="danger"
        isLoading={actionLoading === deleteCourse?.id}
      />

      <ConfirmModal
        isOpen={deleteChapterId !== null}
        title={language === "vi" ? "Xóa chương" : "Delete chapter"}
        message={language === "vi" ? "Bạn có chắc muốn xóa chương này cùng toàn bộ bài học bên trong?" : "Are you sure you want to delete this chapter and all its lessons?"}
        confirmText={language === "vi" ? "Xóa" : "Delete"}
        onConfirm={confirmDeleteChapter}
        onCancel={() => setDeleteChapterId(null)}
        type="danger"
      />

      <ConfirmModal
        isOpen={deleteLessonId !== null}
        title={tStr.deleteLesson}
        message="Bạn có chắc chắn muốn xóa bài học này không? Hành động này không thể hoàn tác."
        confirmText={language === "vi" ? "Xóa" : "Delete"}
        onConfirm={confirmDeleteLesson}
        onCancel={() => setDeleteLessonId(null)}
        type="danger"
      />

      {/* Lesson Quiz Modal */}
      {quizLesson && (
        <LessonQuizModal 
          lesson={quizLesson} 
          onClose={() => setQuizLesson(null)} 
        />
      )}

      <ConfirmModal
        isOpen={alertInfo.isOpen}
        title={alertInfo.title}
        message={alertInfo.message}
        onConfirm={() => setAlertInfo({ ...alertInfo, isOpen: false })}
        type={alertInfo.type}
        isAlert={true}
      />
    </div>
  );
}
