"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

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
  Trophy,
  Upload
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { MediaUpload } from "@/components/MediaUpload";
import dynamic from "next/dynamic";
const TiptapEditor = dynamic(() => import('@/components/TiptapEditor').then(m => m.TiptapEditor), { ssr: false, loading: () => <div className="h-40 bg-gray-100 animate-pulse rounded-md border border-gray-200"></div> });
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { generateSlug } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface Sport {
  id: string;
  nameVi: string;
  nameEn: string;
  slug: string;
  icon: string;
  descVi: string;
  descEn: string;
  detailDescVi: string;
  detailDescEn: string;
}

const translations: Record<string, Record<string, any>> = {
  vi: {
    searchPlaceholder: "Tìm kiếm tên bộ môn hoặc slug...",
    thIcon: "Biểu tượng",
    thNameVi: "Tên (VI)",
    thNameEn: "Tên (EN)",
    thSlug: "Slug",
    thDescVi: "Mô tả ngắn (VI)",
    thDescEn: "Mô tả ngắn (EN)",
    thActions: "Thao tác",
    colToggle: "Hiển thị cột",
    colChoose: "Chọn cột hiển thị",
    pageSizeLabel: "Hiển thị",
    pageSizeSuffix: "dòng mỗi trang",
    pageDisplay: (start: number, end: number, total: number) => `Hiển thị ${start} - ${end} trên ${total} dòng`,
    noResults: "Không tìm thấy bộ môn nào phù hợp.",
    addSport: "Thêm Bộ môn",
    editSport: "Chỉnh Sửa Bộ Môn",
    newSport: "Thêm Bộ Môn Mới",
    nameViLabel: "Tên (Tiếng Việt)",
    nameEnLabel: "Tên (Tiếng Anh)",
    slugLabel: "Slug",
    iconLabel: "Biểu tượng (Emoji hoặc Icon)",
    descViLabel: "Mô tả ngắn (Tiếng Việt)",
    descEnLabel: "Mô tả ngắn (Tiếng Anh)",
    detailDescViLabel: "Chi tiết (Tiếng Việt)",
    detailDescEnLabel: "Chi tiết (Tiếng Anh)",
    btnCancel: "Hủy bỏ",
    btnSave: "Lưu lại",
    thSTT: "STT",
  },
  en: {
    searchPlaceholder: "Search sport name or slug...",
    thIcon: "Icon",
    thNameVi: "Name (VI)",
    thNameEn: "Name (EN)",
    thSlug: "Slug",
    thDescVi: "Short Desc (VI)",
    thDescEn: "Short Desc (EN)",
    thActions: "Actions",
    colToggle: "Show columns",
    colChoose: "Choose columns",
    pageSizeLabel: "Show",
    pageSizeSuffix: "rows per page",
    pageDisplay: (start: number, end: number, total: number) => `Showing ${start} - ${end} of ${total} rows`,
    noResults: "No matching sports found.",
    addSport: "Add Sport",
    editSport: "Edit Sport",
    newSport: "Add New Sport",
    nameViLabel: "Name (Vietnamese)",
    nameEnLabel: "Name (English)",
    slugLabel: "Slug",
    iconLabel: "Icon (Emoji or character)",
    descViLabel: "Short Desc (Vietnamese)",
    descEnLabel: "Short Desc (English)",
    detailDescViLabel: "Detail (Vietnamese)",
    detailDescEnLabel: "Detail (English)",
    btnCancel: "Cancel",
    btnSave: "Save",
    thSTT: "No.",
  }
};

export function SportsTab() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language } = useLanguage();
  const tStr = translations[language] || translations.vi;

  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [alertInfo, setAlertInfo] = useState<{isOpen: boolean, title: string, message: string, type: "danger" | "warning" | "info"}>({ isOpen: false, title: "", message: "", type: "danger" });
  const [deleteSportId, setDeleteSportId] = useState<string | null>(null);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSport, setEditingSport] = useState<Sport | null>(null);
  const [formData, setFormData] = useState({
    nameVi: "",
    nameEn: "",
    slug: "",
    icon: "",
    descVi: "",
    descEn: "",
    detailDescVi: "",
    detailDescEn: ""
  });
  const [formLoading, setFormLoading] = useState(false);

  // Table tools state
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(["icon", "nameVi", "nameEn", "slug", "descVi"]);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({
    key: "",
    direction: null
  });

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

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const role = (session.user as any).role;
      if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
        router.push("/");
      } else {
        fetchSports();
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

  // Auto-generate slug from nameVi
  const handleNameViChange = (val: string) => {
    setFormData(prev => {
      const updated = { ...prev, nameVi: val };
      if (!editingSport) {
        updated.slug = generateSlug(val);
      }
      return updated;
    });
  };

  const fetchSports = async () => {
    try {
      const res = await apiClient.request("/sports");
      if (res.ok) {
        const data = await res.json();
        setSports(data);
      }
    } catch (err) {
      console.error(err);
      setAlertInfo({ isOpen: true, title: "Lỗi", message: language === "vi" ? "Không thể tải danh sách bộ môn." : "Could not load sports.", type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingSport(null);
    setFormData({
      nameVi: "",
      nameEn: "",
      slug: "",
      icon: "",
      descVi: "",
      descEn: "",
      detailDescVi: "",
      detailDescEn: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (sport: Sport) => {
    setEditingSport(sport);
    setFormData({
      nameVi: sport.nameVi,
      nameEn: sport.nameEn,
      slug: sport.slug,
      icon: sport.icon,
      descVi: sport.descVi,
      descEn: sport.descEn,
      detailDescVi: sport.detailDescVi,
      detailDescEn: sport.detailDescEn
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    const isEdit = !!editingSport;
    const url = isEdit 
      ? getApiUrl(`/sports/${editingSport.id}`) 
      : getApiUrl("/sports");
    const method = isEdit ? "PUT" : "POST";

    try {
      const token = (session as any)?.accessToken;
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const resData = await res.json();
      if (res.ok) {
        toast.success(language === "vi" ? "Lưu thông tin thành công!" : "Saved successfully!");
        fetchSports();
        setTimeout(() => setIsModalOpen(false), 800);
      } else {
        let msg = resData.message;
        if (Array.isArray(msg)) msg = msg.join(", ");
        setAlertInfo({ isOpen: true, title: "Lỗi", message: msg || (language === "vi" ? "Lưu thất bại" : "Failed to save"), type: "danger" });
      }
    } catch (err) {
      console.error(err);
      setAlertInfo({ isOpen: true, title: "Lỗi kết nối", message: language === "vi" ? "Lỗi kết nối máy chủ." : "Server connection error.", type: "danger" });
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteSportId) return;
    setActionLoading(deleteSportId);
    try {
      const token = (session as any)?.accessToken;
      const res = await apiClient.request(`/sports/${deleteSportId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        toast.success(language === "vi" ? "Đã xóa bộ môn thành công!" : "Deleted sport successfully!");
        fetchSports();
      } else {
        const resData = await res.json();
        let msg = resData.message;
        if (Array.isArray(msg)) msg = msg.join(", ");
        setAlertInfo({ isOpen: true, title: "Lỗi", message: msg || (language === "vi" ? "Xóa thất bại" : "Failed to delete"), type: "danger" });
      }
    } catch (err) {
      console.error(err);
      setAlertInfo({ isOpen: true, title: "Lỗi kết nối", message: language === "vi" ? "Lỗi kết nối khi xóa." : "Connection error when deleting.", type: "danger" });
    } finally {
      setActionLoading(null);
      setDeleteSportId(null);
    }
  };

  // Row click logic, skipping action buttons
  const handleRowClick = (e: React.MouseEvent, sport: Sport) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest("input") || target.closest("select")) {
      return;
    }
    openEditModal(sport);
  };

  // Filtering and Sorting
  const filteredSports = sports.filter(sport => {
    const query = searchQuery.toLowerCase();
    return (
      sport.nameVi.toLowerCase().includes(query) ||
      sport.nameEn.toLowerCase().includes(query) ||
      sport.slug.toLowerCase().includes(query) ||
      sport.descVi.toLowerCase().includes(query) ||
      sport.descEn.toLowerCase().includes(query)
    );
  });

  const sortedSports = [...filteredSports].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    const aVal = (a as any)[sortConfig.key] || "";
    const bVal = (b as any)[sortConfig.key] || "";
    if (sortConfig.direction === "asc") {
      return aVal.toString().localeCompare(bVal.toString());
    } else {
      return bVal.toString().localeCompare(aVal.toString());
    }
  });

  // Pagination bounds
  const totalRows = sortedSports.length;
  const totalPages = Math.ceil(totalRows / pageSize) || 1;
  const currentSports = sortedSports.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const startRow = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(currentPage * pageSize, totalRows);

  const columnsList = [
    { key: "icon", label: tStr.thIcon },
    { key: "nameVi", label: tStr.thNameVi },
    { key: "nameEn", label: tStr.thNameEn },
    { key: "slug", label: tStr.thSlug },
    { key: "descVi", label: tStr.thDescVi },
  ];

  if (loading || status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-sm font-medium text-slate-500">
          {language === "vi" ? "Đang tải dữ liệu..." : "Loading data..."}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Main Table + Integrated Pagination Container */}
      <DataTable
        data={currentSports}
        columns={[
          {
            key: "icon",
            title: tStr.thIcon,
            sortable: true,
            render: (sport) => <span className="text-2xl" role="img" aria-label={sport.nameVi}>{sport.icon}</span>
          },
          {
            key: "nameVi",
            title: tStr.thNameVi,
            sortable: true,
            render: (sport) => <span className="font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{sport.nameVi}</span>
          },
          {
            key: "nameEn",
            title: tStr.thNameEn,
            sortable: true,
            render: (sport) => <span className="font-medium">{sport.nameEn}</span>
          },
          {
            key: "slug",
            title: tStr.thSlug,
            sortable: true,
            render: (sport) => <span className="font-mono text-xs text-slate-500">{sport.slug}</span>
          },
          {
            key: "descVi",
            title: tStr.thDescVi,
            sortable: false,
            render: (sport) => <span className="max-w-xs truncate text-xs" title={sport.descVi}>{sport.descVi}</span>
          },
          {
            key: "actions",
            title: tStr.thActions,
            render: (sport) => (
              <div className="flex items-center justify-end gap-2.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => openEditModal(sport)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition cursor-pointer border-none bg-transparent"
                  title={language === "vi" ? "Chỉnh sửa" : "Edit"}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => setDeleteSportId(sport.id)}
                  disabled={actionLoading === sport.id}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition cursor-pointer border-none bg-transparent disabled:opacity-55"
                  title={language === "vi" ? "Xóa" : "Delete"}
                >
                  {actionLoading === sport.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            )
          }
        ]}
        totalRecords={totalRows}
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
        createLabel={tStr.addSport}
        onRowClick={(e, row) => router.push(`/${language}/admin/sports/${row.id}`)}
      />

      {/* Edit/Add Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b border-slate-150 dark:border-slate-700 bg-white dark:bg-slate-800">
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="text-blue-600" size={20} />
              <span>{editingSport ? tStr.editSport : tStr.newSport}</span>
            </DialogTitle>
          </DialogHeader>

          {/* Modal Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Name VI */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  {tStr.nameViLabel} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={formData.nameVi}
                  onChange={(e) => handleNameViChange(e.target.value)}
                />
              </div>

              {/* Name EN */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  {tStr.nameEnLabel} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                />
              </div>

              {/* Slug */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  {tStr.slugLabel} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="font-mono"
                />
              </div>

              {/* Icon */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  {tStr.iconLabel} <span className="text-red-500">*</span>
                </label>
                <MediaUpload 
                  value={formData.icon}
                  onChange={(url) => setFormData({ ...formData, icon: url })}
                  type="image"
                  placeholder="Chọn hoặc kéo thả biểu tượng"
                />
              </div>

            </div>

            {/* Desc VI */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                {tStr.descViLabel} <span className="text-red-500">*</span>
              </label>
              <TiptapEditor
                value={formData.descVi}
                onChange={(val) => setFormData({ ...formData, descVi: val })}
              />
            </div>

            {/* Desc EN */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                {tStr.descEnLabel} <span className="text-red-500">*</span>
              </label>
              <TiptapEditor
                value={formData.descEn}
                onChange={(val) => setFormData({ ...formData, descEn: val })}
              />
            </div>

            {/* Detail Desc VI */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                {tStr.detailDescViLabel} <span className="text-red-500">*</span>
              </label>
              <TiptapEditor
                value={formData.detailDescVi}
                onChange={(val) => setFormData({ ...formData, detailDescVi: val })}
              />
            </div>

            {/* Detail Desc EN */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                {tStr.detailDescEnLabel} <span className="text-red-500">*</span>
              </label>
              <TiptapEditor
                value={formData.detailDescEn}
                onChange={(val) => setFormData({ ...formData, detailDescEn: val })}
              />
            </div>


            {/* Modal Actions */}
            <DialogFooter className="px-0">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                {tStr.btnCancel}
              </Button>
              <Button type="submit" disabled={formLoading} isLoading={formLoading}>
                {tStr.btnSave}
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>



      {/* Modals */}
      <ConfirmModal
        isOpen={deleteSportId !== null}
        title={language === "vi" ? "Xác nhận xóa bộ môn" : "Confirm sport deletion"}
        message={language === "vi" ? "Bạn có chắc chắn muốn xóa bộ môn này?" : "Are you sure you want to delete this sport?"}
        confirmText={language === "vi" ? "Xóa" : "Delete"}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteSportId(null)}
        type="danger"
        isLoading={actionLoading === deleteSportId}
      />

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
