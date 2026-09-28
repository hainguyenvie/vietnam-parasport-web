"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";
import { toast } from "sonner";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from '@/hooks/useTranslation';
import { 
  Loader2, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  Upload
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { generateSlug } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import dynamic from "next/dynamic";
const TiptapEditor = dynamic(() => import('@/components/TiptapEditor').then(m => m.TiptapEditor), { ssr: false, loading: () => <div className="h-40 bg-gray-100 animate-pulse rounded-md border border-gray-200"></div> });

interface DocumentTopic {
  id: string;
  name: string;
  slug?: string;
}

interface DocumentAttachment {
  id?: string;
  fileUrl: string;
  fileName?: string;
  fileType?: string;
}

interface DocumentArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  topicId: string;
  thumbnailUrl: string;
  isPublic: boolean;
  topic?: DocumentTopic;
  attachments?: DocumentAttachment[];
}

const translations: Record<string, Record<string, any>> = {
  vi: {
    searchPlaceholder: "Tìm kiếm tên bài viết tài liệu...",
    thTitle: "Tiêu đề",
    thTopic: "Chủ đề",
    thPublic: "Trạng thái",
    thActions: "Thao tác",
    colToggle: "Hiển thị cột",
    colChoose: "Chọn cột hiển thị",
    pageSizeLabel: "Hiển thị",
    pageSizeSuffix: "dòng mỗi trang",
    pageDisplay: (start: number, end: number, total: number) => `Hiển thị ${start} - ${end} trên ${total} dòng`,
    noResults: "Không tìm thấy bài viết nào phù hợp.",
    addDocument: "Thêm Bài Viết Tài Liệu",
    editDocument: "Chỉnh Sửa Bài Viết Tài Liệu",
    newDocument: "Thêm Bài Viết Tài Liệu Mới",
    titleLabel: "Tiêu đề bài viết",
    slugLabel: "Slug (đường dẫn)",
    topicLabel: "Chủ đề",
    thumbnailUrlLabel: "Đường dẫn Ảnh bìa (URL)",
    contentLabel: "Nội dung bài viết",
    attachmentsLabel: "Các file đính kèm (URL PDF, Word...)",
    isPublicLabel: "Hiển thị công khai",
    btnCancel: "Hủy bỏ",
    btnSave: "Lưu lại",
    thSTT: "STT",
  },
  en: {
    searchPlaceholder: "Search document article name...",
    thTitle: "Title",
    thTopic: "Topic",
    thPublic: "Status",
    thActions: "Actions",
    colToggle: "Show columns",
    colChoose: "Choose columns",
    pageSizeLabel: "Show",
    pageSizeSuffix: "rows per page",
    pageDisplay: (start: number, end: number, total: number) => `Showing ${start} - ${end} of ${total} rows`,
    noResults: "No matching articles found.",
    addDocument: "Add Document Article",
    editDocument: "Edit Document Article",
    newDocument: "Add New Document Article",
    titleLabel: "Article Title",
    slugLabel: "Slug",
    topicLabel: "Topic",
    thumbnailUrlLabel: "Thumbnail URL",
    contentLabel: "Article Content",
    attachmentsLabel: "Attachments (PDF, Word URLs...)",
    isPublicLabel: "Is Public",
    btnCancel: "Cancel",
    btnSave: "Save",
    thSTT: "No.",
  }
};

export default function AdminDocumentsPage() {
  const { language } = useLanguage();
  const tStr = translations[language] || translations.vi;
  const { data: session, status } = useSession();
  const router = useRouter();

  const [documents, setDocuments] = useState<DocumentArticle[]>([]);
  const [topics, setTopics] = useState<DocumentTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentDoc, setCurrentDoc] = useState<Partial<DocumentArticle>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<DocumentArticle | null>(null);

  // Topics Management State
  const [isTopicsModalOpen, setIsTopicsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Partial<DocumentTopic> | null>(null);
  const [isSubmittingTopic, setIsSubmittingTopic] = useState(false);

  // File Upload State
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingAttIdx, setUploadingAttIdx] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      if (['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes((session?.user as any)?.role as string)) {
        fetchData();
      } else {
        router.push("/");
      }
    }
  }, [status, router, session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docsRes, topicsRes] = await Promise.all([
        apiClient.request('/documents'),
        apiClient.request('/document-topics')
      ]);

      if (docsRes.ok && topicsRes.ok) {
        const docsData = await docsRes.json();
        const topicsData = await topicsRes.json();
        setDocuments(docsData);
        setTopics(topicsData);
      } else {
        setError("Failed to fetch data");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    const allowedExtensions = [
      '.pdf', '.png', '.jpg', '.jpeg', '.webp',
      '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'
    ];

    if (!allowedExtensions.includes(ext)) {
      throw new Error(`Định dạng tệp ${ext} không được phép tải lên.`);
    }

    let sizeLimit = 10 * 1024 * 1024; // default 10MB
    let typeLabel = 'Tệp tin';

    const isPdf = file.type === 'application/pdf' || ext === '.pdf';
    const isImage = file.type.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
    const isOffice = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'].includes(ext);

    if (isPdf) {
      sizeLimit = 100 * 1024 * 1024; // 100MB
      typeLabel = 'Tài liệu PDF';
    } else if (isImage) {
      sizeLimit = 10 * 1024 * 1024; // 10MB
      typeLabel = 'Hình ảnh';
    } else if (isOffice) {
      sizeLimit = 20 * 1024 * 1024; // 20MB
      typeLabel = 'Tài liệu văn phòng';
    }

    if (file.size > sizeLimit) {
      const limitMb = sizeLimit / (1024 * 1024);
      let suggestion = '';
      if (isPdf) {
        suggestion = ' Vui lòng nén file PDF hoặc chia nhỏ tài liệu.';
      } else if (isImage) {
        suggestion = ' Vui lòng tối ưu hóa kích thước hình ảnh hoặc chuyển đổi sang định dạng WebP.';
      } else if (isOffice) {
        suggestion = ' Vui lòng nén tệp hoặc chuyển đổi định dạng.';
      }
      throw new Error(`Kích thước ${typeLabel} vượt quá giới hạn cho phép (${limitMb}MB).${suggestion}`);
    }

    const form = new FormData();
    form.append("file", file);
    const res = await apiClient.request("/media/upload?isPublic=true", {
      method: "POST",
      body: form
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Tải lên thất bại");
    }
    return res.json();
  };


  const handleOpenModal = (doc?: DocumentArticle) => {
    if (doc) {
      setIsEditMode(true);
      setCurrentDoc({ ...doc, attachments: doc.attachments?.length ? [...doc.attachments] : [] });
    } else {
      setIsEditMode(false);
      setCurrentDoc({ title: '', slug: '', topicId: '', content: '', thumbnailUrl: '', isPublic: true, attachments: [] });
    }
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    if (!currentDoc.id) {
      setCurrentDoc({ title: '', slug: '', topicId: '', content: '', thumbnailUrl: '', isPublic: true, attachments: [] });
    }
    setIsModalOpen(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setCurrentDoc(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }));
  };

  const addAttachmentRow = () => {
    setCurrentDoc(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), { fileUrl: '', fileName: '', fileType: 'application/pdf' }]
    }));
  };

  const updateAttachment = (index: number, field: keyof DocumentAttachment, value: string) => {
    setCurrentDoc(prev => {
      const att = [...(prev.attachments || [])];
      att[index] = { ...att[index], [field]: value };
      return { ...prev, attachments: att };
    });
  };

  const removeAttachment = (index: number) => {
    setCurrentDoc(prev => {
      const att = [...(prev.attachments || [])];
      att.splice(index, 1);
      return { ...prev, attachments: att };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = isEditMode ? getApiUrl(`/documents/${currentDoc.id}`) : getApiUrl('/documents');
      const method = isEditMode ? 'PUT' : 'POST';

      // Clean attachments before saving
      const payload = {
        title: currentDoc.title,
        slug: generateSlug(currentDoc.slug || currentDoc.title || ''),
        content: currentDoc.content,
        topicId: currentDoc.topicId,
        thumbnailUrl: currentDoc.thumbnailUrl,
        isPublic: currentDoc.isPublic,
        attachments: currentDoc.attachments
          ?.filter(a => a.fileUrl.trim() !== '')
          .map(a => ({ fileUrl: a.fileUrl, fileName: a.fileName, fileType: a.fileType })) || []
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to save document');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.info(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (doc: DocumentArticle) => {
    setDocToDelete(doc);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    try {
      const res = await apiClient.request(`/documents/${docToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`
        }
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchData();
    } catch (err: any) {
      toast.info(err.message);
    } finally {
      setIsConfirmOpen(false);
      setDocToDelete(null);
    }
  };

  const filteredDocs = documents.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase());
    const matchesTopic = selectedTopicId ? d.topicId === selectedTopicId : true;
    return matchesSearch && matchesTopic;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const columns = [
    {
      key: "title",
      title: tStr.thTitle,
      render: (row: DocumentArticle) => <div className="font-medium text-slate-800 dark:text-slate-200">{row.title}</div>,
    },
    {
      key: "topic",
      title: tStr.thTopic,
      render: (row: DocumentArticle) => <div className="text-slate-500">{row.topic?.name || "N/A"}</div>,
    },
    {
      key: "isPublic",
      title: tStr.thPublic,
      render: (row: DocumentArticle) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${row.isPublic ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}>
          {row.isPublic ? "Công khai" : "Riêng tư"}
        </span>
      ),
    },
    {
      key: "actions",
      title: tStr.thActions,
      render: (row: DocumentArticle) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleOpenModal(row)}
            className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
            title={tStr.editDocument}
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => handleDeleteClick(row)}
            className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    }
  ];

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  // Pagination Logic
  const paginatedDocs = filteredDocs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex flex-col h-full">
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      <DataTable 
        data={paginatedDocs}
        columns={columns}
        page={currentPage}
        pageSize={pageSize}
        totalRecords={filteredDocs.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        searchPlaceholder={tStr.searchPlaceholder}
        searchValue={search}
        onSearchChange={setSearch}
        filterNodes={
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-w-[180px] dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            value={selectedTopicId}
            onChange={(e) => {
              setSelectedTopicId(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">-- Tất cả chủ đề --</option>
            {topics.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        }
        onCreate={() => handleOpenModal()}
        createLabel={tStr.addDocument}
      />

      <Dialog open={isModalOpen} onOpenChange={(open: boolean) => !isSubmitting && setIsModalOpen(open)}>
        <DialogContent className="max-w-4xl">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{isEditMode ? tStr.editDocument : tStr.newDocument}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2 my-4">
              <div>
                <label className="block text-sm font-medium mb-1">{tStr.titleLabel}</label>
                <Input 
                  required
                  value={currentDoc.title || ''}
                  onChange={handleTitleChange}
                  placeholder="Ví dụ: Kịch bản quay Tiktok"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{tStr.slugLabel}</label>
                  <Input 
                    required
                    value={currentDoc.slug || ''}
                    onChange={(e) => setCurrentDoc({...currentDoc, slug: e.target.value})}
                    placeholder="kich-ban-quay-tiktok"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium">{tStr.topicLabel}</label>
                    <button type="button" onClick={() => setIsTopicsModalOpen(true)} className="text-xs text-blue-600 hover:underline">
                      Quản lý chủ đề
                    </button>
                  </div>
                  <select
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={currentDoc.topicId || ''}
                    onChange={(e) => setCurrentDoc({...currentDoc, topicId: e.target.value})}
                    required
                  >
                    <option value="">-- Chọn chủ đề --</option>
                    {topics.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{tStr.thumbnailUrlLabel}</label>
                <div className="flex gap-2">
                  <Input 
                    value={currentDoc.thumbnailUrl || ''}
                    onChange={(e) => setCurrentDoc({...currentDoc, thumbnailUrl: e.target.value})}
                    placeholder="https://example.com/image.png"
                    className="flex-1"
                  />
                  <input 
                    type="file"
                    id="thumbnail-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingThumbnail(true);
                      try {
                        const data = await handleFileUpload(file);
                        setCurrentDoc(prev => ({...prev, thumbnailUrl: data.url}));
                      } catch (err: any) {
                        toast.info(err.message || "Lỗi tải ảnh!");
                      } finally {
                        setUploadingThumbnail(false);
                      }
                    }}
                  />
                  <label 
                    htmlFor="thumbnail-upload"
                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer transition border border-slate-200 dark:border-slate-700 whitespace-nowrap"
                  >
                    {uploadingThumbnail ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                    <span className="text-sm font-medium">Tải lên</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{tStr.contentLabel}</label>
                <TiptapEditor 
                  value={currentDoc.content || ""} 
                  onChange={(html) => setCurrentDoc({ ...currentDoc, content: html })} 
                />
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">{tStr.attachmentsLabel}</label>
                  <button type="button" onClick={addAttachmentRow} className="text-sm text-blue-600 flex items-center gap-1 hover:underline">
                    <Plus size={14}/> Thêm file
                  </button>
                </div>
                <div className="space-y-3">
                  {currentDoc.attachments?.map((att, i) => (
                    <div key={i} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="flex-1 grid grid-cols-[1fr_2fr] gap-2">
                        <Input 
                          placeholder="Tên file (VD: Document.pdf)" 
                          value={att.fileName || ''}
                          onChange={(e) => updateAttachment(i, 'fileName', e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Đường dẫn file (URL)" 
                            value={att.fileUrl || ''}
                            onChange={(e) => updateAttachment(i, 'fileUrl', e.target.value)}
                            required
                            className="flex-1"
                          />
                          <input 
                            type="file"
                            id={`attachment-upload-${i}`}
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingAttIdx(i);
                              try {
                                const data = await handleFileUpload(file);
                                setCurrentDoc(prev => {
                                  const newAtt = [...(prev.attachments || [])];
                                  newAtt[i] = { 
                                    ...newAtt[i], 
                                    fileUrl: data.url, 
                                    fileName: newAtt[i].fileName || file.name 
                                  };
                                  return { ...prev, attachments: newAtt };
                                });
                              } catch (err: any) {
                                toast.info(err.message || "Lỗi tải file!");
                              } finally {
                                setUploadingAttIdx(null);
                              }
                            }}
                          />
                          <label 
                            htmlFor={`attachment-upload-${i}`}
                            className="flex items-center justify-center w-10 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer transition border border-slate-200 dark:border-slate-700"
                            title="Tải file lên"
                          >
                            {uploadingAttIdx === i ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                          </label>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeAttachment(i)} className="text-red-500 hover:text-red-700 p-2">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {(!currentDoc.attachments || currentDoc.attachments.length === 0) && (
                    <p className="text-sm text-slate-500 italic">Chưa có file đính kèm nào.</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="isPublic"
                  checked={currentDoc.isPublic !== false}
                  onChange={(e) => setCurrentDoc({...currentDoc, isPublic: e.target.checked})}
                  className="rounded border-slate-300"
                />
                <label htmlFor="isPublic" className="text-sm cursor-pointer">{tStr.isPublicLabel}</label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                {tStr.btnCancel}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin mr-2" size={16} />}
                {tStr.btnSave}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xóa bài viết tài liệu"
        message={`Bạn có chắc chắn muốn xóa bài viết "${docToDelete?.title}"?`}
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />

      {/* Quản lý chủ đề Modal */}
      <Dialog open={isTopicsModalOpen} onOpenChange={(open: boolean) => !isSubmittingTopic && setIsTopicsModalOpen(open)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quản lý chủ đề tài liệu</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-6 py-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="font-medium mb-3">{editingTopic?.id ? "Sửa chủ đề" : "Thêm chủ đề mới"}</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!editingTopic || !editingTopic.name || !editingTopic.slug) return;
                setIsSubmittingTopic(true);
                try {
                  const url = editingTopic.id ? getApiUrl(`/document-topics/${editingTopic.id}`) : getApiUrl('/document-topics');
                  const method = editingTopic.id ? 'PUT' : 'POST';
                  const topicPayload = {
                    name: editingTopic.name,
                    slug: generateSlug(editingTopic.slug || editingTopic.name || ''),
                    description: (editingTopic as any).description
                  };
                  const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(session as any)?.accessToken}` },
                    body: JSON.stringify(topicPayload),
                  });
                  if (!res.ok) throw new Error('Failed to save topic');
                  setEditingTopic(null);
                  const topicsRes = await apiClient.request('/document-topics');
                  if (topicsRes.ok) setTopics(await topicsRes.json());
                } catch (err: any) {
                  toast.info(err.message);
                } finally {
                  setIsSubmittingTopic(false);
                }
              }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Input 
                      placeholder="Tên chủ đề" 
                      value={editingTopic?.name || ''} 
                      onChange={(e) => setEditingTopic(prev => ({...prev, name: e.target.value, slug: prev?.slug || generateSlug(e.target.value)}))}
                      required 
                    />
                  </div>
                  <div>
                    <Input 
                      placeholder="Slug (đường dẫn)" 
                      value={editingTopic?.slug || ''} 
                      onChange={(e) => setEditingTopic(prev => ({...prev, slug: e.target.value}))}
                      required 
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Mô tả ngắn (tùy chọn)" 
                    value={(editingTopic as any)?.description || ''} 
                    onChange={(e) => setEditingTopic(prev => ({...prev, description: e.target.value}))}
                    className="flex-1"
                  />
                  {editingTopic?.id && (
                    <Button type="button" variant="outline" onClick={() => setEditingTopic(null)}>Hủy sửa</Button>
                  )}
                  <Button type="submit" disabled={isSubmittingTopic || !editingTopic?.name}>
                    {isSubmittingTopic ? <Loader2 className="animate-spin" size={16} /> : (editingTopic?.id ? "Cập nhật" : "Thêm mới")}
                  </Button>
                </div>
              </form>
            </div>

            <div>
              <h3 className="font-medium mb-3">Danh sách chủ đề</h3>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="px-4 py-2 font-medium">Tên chủ đề</th>
                      <th className="px-4 py-2 font-medium">Slug</th>
                      <th className="px-4 py-2 font-medium w-24 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {topics.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-2 font-medium">{t.name}</td>
                        <td className="px-4 py-2 text-slate-500">{t.name ? generateSlug(t.name) : ""}</td>
                        <td className="px-4 py-2 flex justify-end gap-2">
                          <button onClick={() => setEditingTopic(t)} className="text-blue-600 hover:text-blue-800"><Edit2 size={16}/></button>
                          <button onClick={async () => {
                            if (!confirm("Bạn có chắc chắn muốn xóa chủ đề này?")) return;
                            try {
                              const res = await apiClient.request(`/document-topics/${t.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${(session as any)?.accessToken}` } });
                              if (!res.ok) throw new Error('Xóa thất bại');
                              const topicsRes = await apiClient.request('/document-topics');
                              if (topicsRes.ok) setTopics(await topicsRes.json());
                            } catch (err: any) { toast.info(err.message); }
                          }} className="text-red-600 hover:text-red-800"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                    {topics.length === 0 && (
                      <tr><td colSpan={3} className="px-4 py-4 text-center text-slate-500">Chưa có chủ đề nào</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTopicsModalOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
