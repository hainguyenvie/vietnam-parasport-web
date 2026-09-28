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
  CheckCircle2,
  X,
  Upload,
  Globe
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { MediaUpload } from "@/components/MediaUpload";
import dynamic from "next/dynamic";
const TiptapEditor = dynamic(() => import('@/components/TiptapEditor').then(m => m.TiptapEditor), { ssr: false, loading: () => <div className="h-40 bg-gray-100 animate-pulse rounded-md border border-gray-200"></div> });
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
interface Organization {
  id: string;
  name: string;
  location: string;
  sport: string;
  schedule: string;
  suitableFor: string;
  contactInfo: string;
  imageUrl?: string;
  description: string;
  isApproved: boolean;
  createdAt: string;
}

const translations: Record<string, Record<string, any>> = {
  vi: {
    title: "Quản lý câu lạc bộ",
    searchPlaceholder: "Tìm tên câu lạc bộ, môn thể thao, địa điểm...",
    statusFilterAll: "Tất cả trạng thái",
    statusFilterApproved: "Đang hoạt động",
    statusFilterPending: "Chờ phê duyệt",
    thSport: "Môn thể thao",
    thName: "Tên câu lạc bộ",
    thLocation: "Địa điểm",
    thSchedule: "Lịch hoạt động",
    thContact: "Liên hệ",
    thStatus: "Trạng thái",
    thActions: "Thao tác",
    colToggle: "Hiển thị cột",
    colChoose: "Chọn cột hiển thị",
    pageSizeLabel: "Hiển thị",
    pageSizeSuffix: "dòng mỗi trang",
    pageDisplay: (start: number, end: number, total: number) => `Hiển thị ${start} - ${end} trên ${total} dòng`,
    noResults: "Không tìm thấy câu lạc bộ nào phù hợp.",
    addOrganization: "Thêm câu lạc bộ",
    editOrganization: "Chỉnh sửa câu lạc bộ",
    newOrganization: "Thêm Câu Lạc Bộ Mới",
    OrganizationNameLabel: "Tên câu lạc bộ",
    sportLabel: "Môn thể thao",
    locationLabel: "Địa điểm tập luyện",
    scheduleLabel: "Lịch tập luyện",
    suitableForLabel: "Đối tượng phù hợp",
    contactInfoLabel: "Thông tin liên hệ",
    imageUrlLabel: "Ảnh câu lạc bộ",
    descriptionLabel: "Giới thiệu câu lạc bộ",
    btnCancel: "Hủy bỏ",
    btnSave: "Lưu lại",
    btnApprove: "Phê duyệt",
    btnReject: "Từ chối",
    alertSaveSuccess: "Đã lưu câu lạc bộ thành công!",
    alertApproveSuccess: "Đã phê duyệt câu lạc bộ!",
    alertDeleteSuccess: "Đã xóa câu lạc bộ!",
    alertError: "Có lỗi xảy ra.",
    alertConnError: "Lỗi kết nối máy chủ.",
    thSTT: "STT",
  },
  en: {
    title: "Organizations Management",
    searchPlaceholder: "Search Organization name, sport, location...",
    statusFilterAll: "All Statuses",
    statusFilterApproved: "Active",
    statusFilterPending: "Pending Approval",
    thSport: "Sport",
    thName: "Organization Name",
    thLocation: "Location",
    thSchedule: "Schedule",
    thContact: "Contact",
    thStatus: "Status",
    thActions: "Actions",
    colToggle: "Show columns",
    colChoose: "Choose columns",
    pageSizeLabel: "Show",
    pageSizeSuffix: "rows per page",
    pageDisplay: (start: number, end: number, total: number) => `Showing ${start} - ${end} of ${total} rows`,
    noResults: "No matching Organizations found.",
    addOrganization: "Add Organization",
    editOrganization: "Edit Organization",
    newOrganization: "Add New Organization",
    OrganizationNameLabel: "Organization Name",
    sportLabel: "Sport",
    locationLabel: "Location",
    scheduleLabel: "Schedule",
    suitableForLabel: "Suitable For",
    contactInfoLabel: "Contact Info",
    imageUrlLabel: "Organization Image",
    descriptionLabel: "Organization Description",
    btnCancel: "Cancel",
    btnSave: "Save",
    btnApprove: "Approve",
    btnReject: "Reject",
    alertSaveSuccess: "Organization saved successfully!",
    alertApproveSuccess: "Organization approved!",
    alertDeleteSuccess: "Organization deleted!",
    alertError: "An error occurred.",
    alertConnError: "Server connection error.",
    thSTT: "No.",
  }
};

export default function AdminOrganizationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language } = useLanguage();
  const tStr = translations[language] || translations.vi;

  const [Organizations, setOrganizations] = useState<Organization[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [alertInfo, setAlertInfo] = useState<{isOpen: boolean, title: string, message: string, type: "danger" | "warning" | "info"}>({ isOpen: false, title: "", message: "", type: "danger" });
  const [deleteOrganization, setDeleteOrganization] = useState<{id: string, name: string} | null>(null);
  const [approveOrganizationId, setApproveOrganizationId] = useState<string | null>(null);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sport: "",
    location: "",
    schedule: "",
    suitableFor: "",
    contactInfo: "",
    imageUrl: "",
    description: ""
  });
  const [formLoading, setFormLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Table tools state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(["sport", "name", "location", "schedule", "contact", "status"]);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({
    key: "",
    direction: null
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchSports = async () => {
    try {
      const res = await apiClient.request("/sports");
      if (res.ok) {
        const data = await res.json();
        setSports(data);
      }
    } catch (err) {
      console.error("Failed to fetch sports:", err);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const role = (session.user as any).role;
      if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
        router.push("/");
      } else {
        fetchOrganizations();
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
  }, [searchQuery, statusFilter, pageSize]);

  const fetchOrganizations = async () => {
    try {
      const res = await apiClient.request("/organizations/admin/all", {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      if (res.ok) {
        // res.json() auto-unwraps {success, data} envelope, returns raw array
        const organizations = await res.json();
        setOrganizations(Array.isArray(organizations) ? organizations : []);
      }
    } catch (err) {
      console.error(err);
      toast.error(tStr.alertConnError);
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
    setEditingOrganization(null);
    setFormData({
      name: "",
      sport: "",
      location: "",
      schedule: "",
      suitableFor: "",
      contactInfo: "",
      imageUrl: "",
      description: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (Organization: Organization) => {
    setEditingOrganization(Organization);
    setFormData({
      name: Organization.name,
      sport: Organization.sport,
      location: Organization.location,
      schedule: Organization.schedule,
      suitableFor: Organization.suitableFor,
      contactInfo: Organization.contactInfo,
      imageUrl: Organization.imageUrl || "",
      description: Organization.description
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
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
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

    const isEdit = !!editingOrganization;
    const url = isEdit 
      ? getApiUrl(`/organizations/${editingOrganization.id}`) 
      : getApiUrl("/organizations/admin");
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const raw = await res.json();
        const savedOrganization = raw?.data ?? raw;
        if (isEdit) {
          setOrganizations(prev => prev.map(c => c.id === savedOrganization.id ? savedOrganization : c));
        } else {
          setOrganizations(prev => [savedOrganization, ...prev]);
        }
        toast.success(tStr.alertSaveSuccess);
        setTimeout(() => setIsModalOpen(false), 800);
      } else {
        const errData = await res.json().catch(() => ({}));
        setAlertInfo({ isOpen: true, title: "Lỗi", message: errData.message || tStr.alertError, type: "danger" });
      }
    } catch (err) {
      console.error(err);
      setAlertInfo({ isOpen: true, title: "Lỗi kết nối", message: tStr.alertConnError, type: "danger" });
    } finally {
      setFormLoading(false);
    }
  };

  const confirmApprove = async () => {
    if (!approveOrganizationId) return;
    setActionLoading(approveOrganizationId);
    try {
      const res = await apiClient.request(`/organizations/${approveOrganizationId}/approve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      if (res.ok) {
        toast.success(tStr.alertApproveSuccess);
        setOrganizations(prev => prev.map(c => c.id === approveOrganizationId ? { ...c, isApproved: true } : c));
      } else {
        setAlertInfo({ isOpen: true, title: "Lỗi", message: tStr.alertError, type: "danger" });
      }
    } catch (err) {
      console.error(err);
      setAlertInfo({ isOpen: true, title: "Lỗi kết nối", message: tStr.alertConnError, type: "danger" });
    } finally {
      setActionLoading(null);
      setApproveOrganizationId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteOrganization) return;
    setActionLoading(deleteOrganization.id);

    try {
      const res = await apiClient.request(`/organizations/${deleteOrganization.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      if (res.ok) {
        toast.success(tStr.alertDeleteSuccess);
        setOrganizations(prev => prev.filter(c => c.id !== deleteOrganization.id));
      } else {
        setAlertInfo({ isOpen: true, title: "Lỗi", message: tStr.alertError, type: "danger" });
      }
    } catch (err) {
      console.error(err);
      setAlertInfo({ isOpen: true, title: "Lỗi kết nối", message: tStr.alertConnError, type: "danger" });
    } finally {
      setActionLoading(null);
      setDeleteOrganization(null);
    }
  };

  const handleRowClick = (e: React.MouseEvent, Organization: Organization) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest("input") || target.closest("select")) {
      return;
    }
    openEditModal(Organization);
  };

  // Filter Organizations
  const filteredOrganizations = Organizations.filter((Organization) => {
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = 
      Organization.name.toLowerCase().includes(searchLower) ||
      Organization.sport.toLowerCase().includes(searchLower) ||
      Organization.location.toLowerCase().includes(searchLower);

    const matchStatus = 
      statusFilter === "all" ? true :
      statusFilter === "approved" ? Organization.isApproved : !Organization.isApproved;

    return matchSearch && matchStatus;
  });

  // Sort Organizations
  const sortedOrganizations = [...filteredOrganizations].sort((a, b) => {
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
  const totalItems = sortedOrganizations.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedOrganizations = sortedOrganizations.slice(startIndex, endIndex);

  const columnsList = [
    { key: "sport", label: tStr.thSport },
    { key: "name", label: tStr.thName },
    { key: "location", label: tStr.thLocation },
    { key: "schedule", label: tStr.thSchedule },
    { key: "contact", label: tStr.thContact },
    { key: "status", label: tStr.thStatus }
  ];

  const columns: ColumnDef<any>[] = [
    {
      key: "sport",
      title: tStr.thSport,
      sortable: true,
      render: (Organization) => (
        <span className="inline-block text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-900/40 px-2.5 py-1 rounded-full uppercase">
          {Organization.sport}
        </span>
      )
    },
    {
      key: "name",
      title: tStr.thName,
      sortable: true,
      render: (Organization) => (
        <span className="font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {Organization.name}
        </span>
      )
    },
    { key: "location", title: tStr.thLocation, sortable: true },
    { key: "schedule", title: tStr.thSchedule, sortable: false },
    { key: "contact", title: tStr.thContact, sortable: false, render: (c) => c.contactInfo },
    {
      key: "status",
      title: tStr.thStatus,
      sortable: true,
      render: (Organization) => (
        Organization.isApproved ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {tStr.statusFilterApproved}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            {tStr.statusFilterPending}
          </span>
        )
      )
    },
    {
      key: "actions",
      title: tStr.thActions,
      render: (Organization) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {!Organization.isApproved && (
            <button
              onClick={() => setApproveOrganizationId(Organization.id)}
              disabled={actionLoading !== null}
              className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-650 dark:text-emerald-400 rounded-lg transition border-none bg-transparent cursor-pointer"
              title={tStr.btnApprove}
            >
              {actionLoading === Organization.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            </button>
          )}
          <button
            onClick={() => openEditModal(Organization)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-400 hover:text-blue-600 rounded-lg transition border-none bg-transparent cursor-pointer"
            title={tStr.editOrganization}
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => setDeleteOrganization({ id: Organization.id, name: Organization.name })}
            disabled={actionLoading === Organization.id}
            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-600 rounded-lg transition disabled:opacity-55 border-none bg-transparent cursor-pointer"
            title={Organization.isApproved ? "Xóa" : tStr.btnReject}
          >
            {actionLoading === Organization.id ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        </div>
      )
    }
  ];

  const filterNodes = (
    <Select
      value={statusFilter}
      onValueChange={(value: string) => setStatusFilter(value)}
    >
      <SelectTrigger className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
        <SelectValue placeholder={tStr.statusFilterAll} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{tStr.statusFilterAll}</SelectItem>
        <SelectItem value="approved">{tStr.statusFilterApproved}</SelectItem>
        <SelectItem value="pending">{tStr.statusFilterPending}</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-6">

      <DataTable
        data={paginatedOrganizations}
        columns={columns}
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
        filterNodes={filterNodes}
        onCreate={openAddModal}
        createLabel={tStr.addOrganization}
        isLoading={status === "loading" || loading}
      />

      {/* Modal Form */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-5 py-4 border-b border-slate-150 dark:border-slate-700 bg-white dark:bg-slate-800">
            <DialogTitle>{editingOrganization ? tStr.editOrganization : tStr.newOrganization}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="cName" className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  {tStr.OrganizationNameLabel} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  id="cName"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="cSport" className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  {tStr.sportLabel} <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.sport}
                  onValueChange={(value: string) => setFormData({ ...formData, sport: value })}
                  required
                >
                  <SelectTrigger id="cSport">
                    <SelectValue placeholder={language === "vi" ? "-- Chọn bộ môn --" : "-- Select Sport --"} />
                  </SelectTrigger>
                  <SelectContent>
                    {sports.map((sp: any) => (
                      <SelectItem key={sp.id} value={sp.nameVi}>
                        {language === "vi" ? sp.nameVi : sp.nameEn}
                      </SelectItem>
                    ))}
                    {formData.sport && !sports.some((sp: any) => sp.nameVi === formData.sport) && (
                      <SelectItem value={formData.sport}>{formData.sport}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="cLocation" className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  {tStr.locationLabel} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  id="cLocation"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="cSchedule" className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  {tStr.scheduleLabel} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  id="cSchedule"
                  required
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  placeholder="VD: T2-T4-T6, 17:00 - 19:00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="cSuitableFor" className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  {tStr.suitableForLabel} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  id="cSuitableFor"
                  required
                  value={formData.suitableFor}
                  onChange={(e) => setFormData({ ...formData, suitableFor: e.target.value })}
                  placeholder="VD: Người khuyết tật vận động..."
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="cContact" className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  {tStr.contactInfoLabel} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  id="cContact"
                  required
                  value={formData.contactInfo}
                  onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                  placeholder="SĐT hoặc Email liên hệ"
                />
              </div>
            </div>

            {/* Organization Image File Upload */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                {tStr.imageUrlLabel}
              </label>
              <MediaUpload 
                value={formData.imageUrl}
                onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                type="image"
                placeholder={language === "vi" ? "Tải lên hình ảnh câu lạc bộ" : "Upload Organization image"}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="cDesc" className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                {tStr.descriptionLabel} <span className="text-red-500">*</span>
              </label>
              <TiptapEditor
                value={formData.description}
                onChange={(val) => setFormData({ ...formData, description: val })}
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
        isOpen={deleteOrganization !== null}
        title={language === "vi" ? "Xác nhận xóa" : "Confirm deletion"}
        message={language === "vi" ? `Bạn có chắc chắn muốn xóa câu lạc bộ "${deleteOrganization?.name}" không?` : `Are you sure you want to delete Organization "${deleteOrganization?.name}"?`}
        confirmText={language === "vi" ? "Xóa" : "Delete"}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOrganization(null)}
        type="danger"
        isLoading={actionLoading === deleteOrganization?.id}
      />

      <ConfirmModal
        isOpen={approveOrganizationId !== null}
        title={language === "vi" ? "Xác nhận phê duyệt" : "Confirm approval"}
        message={language === "vi" ? "Phê duyệt cho câu lạc bộ này hoạt động?" : "Approve this Organization for activity?"}
        confirmText={language === "vi" ? "Phê duyệt" : "Approve"}
        onConfirm={confirmApprove}
        onCancel={() => setApproveOrganizationId(null)}
        type="info"
        isLoading={actionLoading === approveOrganizationId}
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
