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
  Globe,
  X,
  Upload
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

// next/image available for migration — add unoptimized for dynamic URLs

interface Partner {
  id: string;
  name: string;
  logoUrl: string;
  website?: string;
}

const translations: Record<string, Record<string, any>> = {
  vi: {
    searchPlaceholder: "Tìm kiếm tên đối tác hoặc website...",
    thLogo: "Logo",
    thName: "Tên Đối tác",
    thWebsite: "Website",
    thActions: "Thao tác",
    colToggle: "Hiển thị cột",
    colChoose: "Chọn cột hiển thị",
    pageSizeLabel: "Hiển thị",
    pageSizeSuffix: "dòng mỗi trang",
    pageDisplay: (start: number, end: number, total: number) => `Hiển thị ${start} - ${end} trên ${total} dòng`,
    noResults: "Không tìm thấy đối tác nào phù hợp.",
    addPartner: "Thêm Đối tác",
    editPartner: "Chỉnh Sửa Đối Tác",
    newPartner: "Thêm Đối Tác Mới",
    partnerNameLabel: "Tên Đối tác",
    logoUrlLabel: "Logo của Đối tác",
    websiteLabel: "Website liên kết",
    btnCancel: "Hủy bỏ",
    btnSave: "Lưu lại",
    thSTT: "STT",
  },
  en: {
    searchPlaceholder: "Search partner name or website...",
    thLogo: "Logo",
    thName: "Partner Name",
    thWebsite: "Website",
    thActions: "Actions",
    colToggle: "Show columns",
    colChoose: "Choose columns",
    pageSizeLabel: "Show",
    pageSizeSuffix: "rows per page",
    pageDisplay: (start: number, end: number, total: number) => `Showing ${start} - ${end} of ${total} rows`,
    noResults: "No matching partners found.",
    addPartner: "Add Partner",
    editPartner: "Edit Partner",
    newPartner: "Add New Partner",
    partnerNameLabel: "Partner Name",
    logoUrlLabel: "Partner Logo",
    websiteLabel: "Link Website",
    btnCancel: "Cancel",
    btnSave: "Save",
    thSTT: "No.",
  }
};

export default function AdminPartnersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language } = useLanguage();
  const tStr = translations[language] || translations.vi;

  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deletePartnerId, setDeletePartnerId] = useState<string | null>(null);
  const [alertInfo, setAlertInfo] = useState<{isOpen: boolean, title: string, message: string, type: "danger" | "warning" | "info"}>({ isOpen: false, title: "", message: "", type: "danger" });

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    logoUrl: "",
    website: ""
  });
  const [formLoading, setFormLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Table tools state
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(["logo", "name", "website"]);
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
        fetchPartners();
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

  const fetchPartners = async () => {
    try {
      const res = await apiClient.request("/partners");
      if (res.ok) {
        const data = await res.json();
        setPartners(data);
      }
    } catch (err) {
      console.error(err);
      setAlertInfo({ isOpen: true, title: "Lỗi", message: language === "vi" ? "Không thể tải danh sách đối tác." : "Could not load partners.", type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingPartner(null);
    setFormData({ name: "", logoUrl: "", website: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      logoUrl: partner.logoUrl,
      website: partner.website || ""
    });
    setIsModalOpen(true);
  };

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
        setFormData(prev => ({ ...prev, logoUrl: data.url }));
      } else {
        const errData = await res.json().catch(() => ({}));
        const defaultMsg = language === "vi" ? "Tải ảnh lên thất bại." : "Failed to upload image.";
        const msg = errData.message || defaultMsg;
        toast.error(typeof msg === "object" ? msg[0] : msg);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(language === "vi" ? "Lỗi kết nối khi tải ảnh." : "Connection error when uploading image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    if (!formData.logoUrl) {
      toast.error(language === "vi" ? "Vui lòng tải lên Logo của đối tác." : "Please upload partner logo.");
      setFormLoading(false);
      return;
    }

    const isEdit = !!editingPartner;
    const url = isEdit 
      ? getApiUrl(`/partners/${editingPartner.id}`) 
      : getApiUrl("/partners");
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
        toast.success(language === "vi" ? "Lưu đối tác thành công!" : "Saved partner successfully!");
        fetchPartners();
        setTimeout(() => setIsModalOpen(false), 800);
      } else {
        let msg = resData.message;
        if (Array.isArray(msg)) msg = msg.join(", ");
        setAlertInfo({ isOpen: true, title: "Lỗi", message: msg || (language === "vi" ? "Không thể lưu thông tin đối tác." : "Failed to save partner."), type: "danger" });
      }
    } catch (err) {
      console.error(err);
      setAlertInfo({ isOpen: true, title: "Lỗi", message: language === "vi" ? "Lỗi kết nối máy chủ." : "Server connection error.", type: "danger" });
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletePartnerId) return;

    setActionLoading(deletePartnerId);

    try {
      const token = (session as any)?.accessToken;
      const res = await apiClient.request(`/partners/${deletePartnerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        toast.success(language === "vi" ? "Đã xóa đối tác thành công!" : "Deleted partner successfully!");
        fetchPartners();
      } else {
        const resData = await res.json();
        let msg = resData.message;
        if (Array.isArray(msg)) msg = msg.join(", ");
        setAlertInfo({ isOpen: true, title: "Lỗi", message: msg || (language === "vi" ? "Không thể xóa đối tác." : "Failed to delete partner."), type: "danger" });
      }
    } catch (err) {
      console.error(err);
      setAlertInfo({ isOpen: true, title: "Lỗi", message: language === "vi" ? "Lỗi kết nối khi xóa." : "Connection error when deleting.", type: "danger" });
    } finally {
      setActionLoading(null);
      setDeletePartnerId(null);
    }
  };

  const handleRowClick = (e: React.MouseEvent, partner: Partner) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest("input") || target.closest("select")) {
      return;
    }
    openEditModal(partner);
  };

  // Filter and Sort
  const filteredPartners = partners.filter(p => {
    const query = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      (p.website && p.website.toLowerCase().includes(query))
    );
  });

  const sortedPartners = [...filteredPartners].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    const aVal = (a as any)[sortConfig.key] || "";
    const bVal = (b as any)[sortConfig.key] || "";
    if (sortConfig.direction === "asc") {
      return aVal.toString().localeCompare(bVal.toString());
    } else {
      return bVal.toString().localeCompare(aVal.toString());
    }
  });

  // Pagination calculations
  const totalItems = sortedPartners.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedPartners = sortedPartners.slice(startIndex, endIndex);

  if (loading || status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-sm font-medium text-slate-500">
          {language === "vi" ? "Đang tải dữ liệu đối tác..." : "Loading partners..."}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Main Table + Integrated Pagination Container */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden transition-colors flex flex-col">
        
        {/* Control Bar (Moved out since DataTable doesn't have custom create action, we pass it via toolbarRight? Or we can use toolbarActions prop in DataTable. Wait, DataTable has `onCreate` prop!) */}
        <DataTable
          data={paginatedPartners}
          columns={[
            {
              key: "logo",
              title: tStr.thLogo,
              render: (partner) => (
                <div className="w-16 h-10 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-755 flex items-center justify-center overflow-hidden shadow-sm">
                  <img src={partner.logoUrl} alt={partner.name} className="max-h-8 max-w-full object-contain" />
                </div>
              )
            },
            {
              key: "name",
              title: tStr.thName,
              sortable: true,
              render: (partner) => (
                <span className="font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {partner.name}
                </span>
              )
            },
            {
              key: "website",
              title: tStr.thWebsite,
              sortable: true,
              render: (partner) => (
                partner.website ? (
                  <a 
                    href={partner.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Globe size={14} /> {partner.website}
                  </a>
                ) : (
                  <span className="text-slate-400 text-xs">{language === "vi" ? "Không có" : "None"}</span>
                )
              )
            },
            {
              key: "actions",
              title: tStr.thActions,
              render: (partner) => (
                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => openEditModal(partner)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-400 hover:text-blue-600 rounded-lg transition border-none bg-transparent cursor-pointer"
                    title={language === "vi" ? "Chỉnh sửa" : "Edit"}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setDeletePartnerId(partner.id)}
                    disabled={actionLoading === partner.id}
                    className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-600 rounded-lg transition disabled:opacity-55 border-none bg-transparent cursor-pointer"
                    title={language === "vi" ? "Xóa" : "Delete"}
                  >
                    {actionLoading === partner.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
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
          createLabel={tStr.addPartner}
          onRowClick={handleRowClick}
          isLoading={loading}
        />

      </div>

      {/* Modal Form */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-5 py-4 border-b border-slate-150 dark:border-slate-700 bg-white dark:bg-slate-800">
            <DialogTitle>{editingPartner ? tStr.editPartner : tStr.newPartner}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="space-y-1">
              <label htmlFor="pName" className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                {tStr.partnerNameLabel} <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                id="pName"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Tập đoàn Vingroup"
              />
            </div>

            {/* Logo File Upload Component */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                {tStr.logoUrlLabel} <span className="text-red-500">*</span>
              </label>
              {formData.logoUrl ? (
                <div className="relative w-full h-32 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900 flex items-center justify-center group shadow-inner">
                  <img src={formData.logoUrl} alt="Logo preview" className="max-h-24 max-w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, logoUrl: "" })}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition shadow-md hover:bg-rose-700 cursor-pointer border-none"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-200 dark:border-slate-750 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-500 dark:text-slate-400">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                  ) : (
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  )}
                  <span className="text-xs font-bold">{language === "vi" ? "Tải lên logo đối tác" : "Upload partner logo"}</span>
                  <span className="text-[10px] text-slate-400 mt-1">{language === "vi" ? "Click để chọn file ảnh" : "Click to select image file"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="pWebsite" className="text-xs font-bold text-slate-600 dark:text-slate-300 block">{tStr.websiteLabel}</label>
              <Input
                type="text"
                id="pWebsite"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="VD: https://vingroup.net"
              />
            </div>

            <DialogFooter className="px-0">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                {tStr.btnCancel}
              </Button>
              <Button type="submit" disabled={formLoading || uploading} isLoading={formLoading}>
                {tStr.btnSave}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <ConfirmModal
        isOpen={deletePartnerId !== null}
        title={language === "vi" ? "Xác nhận xóa" : "Confirm deletion"}
        message={language === "vi" ? "Bạn có chắc chắn muốn xóa đối tác này không?" : "Are you sure you want to delete this partner?"}
        confirmText={language === "vi" ? "Xóa" : "Delete"}
        onConfirm={confirmDelete}
        onCancel={() => setDeletePartnerId(null)}
        type="danger"
        isLoading={actionLoading === deletePartnerId}
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
