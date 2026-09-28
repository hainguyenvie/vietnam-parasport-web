"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";
import { toast } from "sonner";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertCircle,
  Video,
  Upload,
  ExternalLink
} from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// next/image available for migration — add unoptimized for dynamic URLs

interface CapcutTemplate {
  id: string;
  title: string;
  description?: string;
  capcutLink: string;
  thumbnailUrl?: string;
}

export default function AdminCapcutTemplatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [templates, setTemplates] = useState<CapcutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Partial<CapcutTemplate>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<CapcutTemplate | null>(null);

  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

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
      const res = await apiClient.request('/capcut-templates');
      if (res.ok) {
        setTemplates(await res.json());
      } else {
        setError("Failed to fetch templates");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];

    if (!allowedExtensions.includes(ext)) {
      throw new Error(`Định dạng ảnh ${ext} không được phép tải lên.`);
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error(`Kích thước ảnh vượt quá giới hạn cho phép (10MB).`);
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

  const handleOpenModal = (template?: CapcutTemplate) => {
    if (template) {
      setIsEditMode(true);
      setCurrentTemplate({ ...template });
    } else {
      setIsEditMode(false);
      setCurrentTemplate({ title: '', description: '', capcutLink: '', thumbnailUrl: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = isEditMode ? getApiUrl(`/capcut-templates/${currentTemplate.id}`) : getApiUrl('/capcut-templates');
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify(currentTemplate),
      });

      if (!res.ok) {
        throw new Error('Lỗi khi lưu mẫu CapCut');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.info(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (template: CapcutTemplate) => {
    setTemplateToDelete(template);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;
    try {
      const res = await apiClient.request(`/capcut-templates/${templateToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`
        }
      });
      if (!res.ok) throw new Error('Xóa thất bại');
      fetchData();
    } catch (err: any) {
      toast.info(err.message);
    } finally {
      setIsConfirmOpen(false);
      setTemplateToDelete(null);
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const columns = [
    {
      key: "title",
      title: "Tên mẫu",
      render: (row: CapcutTemplate) => (
        <div className="flex items-center gap-3">
          {row.thumbnailUrl ? (
            <img src={row.thumbnailUrl} alt={row.title} className="w-12 h-12 rounded object-cover border border-slate-200 dark:border-slate-700" />
          ) : (
            <div className="w-12 h-12 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Video size={20} />
            </div>
          )}
          <div className="font-medium text-slate-800 dark:text-slate-200">{row.title}</div>
        </div>
      ),
    },
    {
      key: "capcutLink",
      title: "Link CapCut",
      render: (row: CapcutTemplate) => (
        <a href={row.capcutLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
          Mở link <ExternalLink size={14} />
        </a>
      ),
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (row: CapcutTemplate) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleOpenModal(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition"
            title="Sửa"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => handleDeleteClick(row)}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition"
            title="Xóa"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    }
  ];

  const paginatedTemplates = filteredTemplates.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex flex-col h-full">
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      <DataTable 
        data={paginatedTemplates}
        columns={columns}
        page={currentPage}
        pageSize={pageSize}
        totalRecords={filteredTemplates.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        searchPlaceholder="Tìm kiếm tên mẫu..."
        searchValue={search}
        onSearchChange={setSearch}
        onCreate={() => handleOpenModal()}
        createLabel="Thêm mẫu mới"
      />

      <Dialog open={isModalOpen} onOpenChange={(open: boolean) => !isSubmitting && setIsModalOpen(open)}>
        <DialogContent className="max-w-xl">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{isEditMode ? "Sửa mẫu CapCut" : "Thêm mẫu CapCut mới"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 my-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên mẫu</label>
                <Input 
                  required
                  value={currentTemplate.title || ''}
                  onChange={(e) => setCurrentTemplate({...currentTemplate, title: e.target.value})}
                  placeholder="Ví dụ: Trend nhảy hot Tiktok"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Link CapCut (URL)</label>
                <Input 
                  required
                  value={currentTemplate.capcutLink || ''}
                  onChange={(e) => setCurrentTemplate({...currentTemplate, capcutLink: e.target.value})}
                  placeholder="https://www.capcut.com/t/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ảnh bìa (Thumbnail URL)</label>
                <div className="flex gap-2">
                  <Input 
                    value={currentTemplate.thumbnailUrl || ''}
                    onChange={(e) => setCurrentTemplate({...currentTemplate, thumbnailUrl: e.target.value})}
                    placeholder="https://example.com/image.png"
                    className="flex-1"
                  />
                  <input 
                    type="file"
                    id="template-thumbnail-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingThumbnail(true);
                      try {
                        const data = await handleFileUpload(file);
                        setCurrentTemplate(prev => ({...prev, thumbnailUrl: data.url}));
                      } catch (err: any) {
                        toast.info(err.message || "Lỗi tải ảnh!");
                      } finally {
                        setUploadingThumbnail(false);
                      }
                    }}
                  />
                  <label 
                    htmlFor="template-thumbnail-upload"
                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer transition border border-slate-200 dark:border-slate-700 whitespace-nowrap"
                  >
                    {uploadingThumbnail ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                    <span className="text-sm font-medium">Tải lên</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mô tả (tùy chọn)</label>
                <Input 
                  value={currentTemplate.description || ''}
                  onChange={(e) => setCurrentTemplate({...currentTemplate, description: e.target.value})}
                  placeholder="Mô tả ngắn gọn về mẫu này"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin mr-2" size={16} />}
                {isEditMode ? "Cập nhật" : "Thêm mới"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xóa mẫu CapCut"
        message={`Bạn có chắc chắn muốn xóa mẫu "${templateToDelete?.title}"?`}
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />
    </div>
  );
}
