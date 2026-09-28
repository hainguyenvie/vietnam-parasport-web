"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from '@/hooks/useTranslation';
import { 
  Loader2, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertCircle,
  X
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Sport {
  id: string;
  nameVi: string;
  nameEn: string;
  slug: string;
}

interface SportClassification {
  id: string;
  sportId: string;
  sport?: Sport;
  code: string;
  description?: string;
  medicalDesc?: string;
  disabilityCriteria?: string;
  requiresAssistant: boolean;
  createdAt: string;
}

const translations: Record<string, Record<string, any>> = {
  vi: {
    searchPlaceholder: "Tìm kiếm mã hạng hoặc mô tả...",
    thCode: "Mã hạng",
    thSport: "Môn thể thao",
    thDesc: "Mô tả chức năng",
    thMedicalDesc: "Mô tả y khoa",
    thAssistant: "Cần hỗ trợ viên",
    thCreatedAt: "Ngày tạo",
    thActions: "Thao tác",
    noResults: "Không tìm thấy hạng thương tật nào.",
    addType: "Thêm Hạng Thương Tật",
    editType: "Chỉnh Sửa Hạng Thương Tật",
    newType: "Thêm Mới Hạng Thương Tật",
    codeLabel: "Mã hạng thương tật (VD: T11, BC1)",
    sportLabel: "Môn thể thao",
    descLabel: "Mô tả chi tiết",
    medicalDescLabel: "Mô tả y khoa (tùy chọn)",
    criteriaLabel: "Tiêu chí khuyết tật tối thiểu (tùy chọn)",
    assistantLabel: "Yêu cầu có người trợ giúp đi kèm khi thi đấu",
    selectSport: "Chọn môn thể thao...",
    btnCancel: "Hủy bỏ",
    btnSave: "Lưu lại",
    yes: "Có",
    no: "Không",
    sportFilterAll: "Tất cả môn thể thao",
    assistantFilterAll: "Tất cả hỗ trợ",
    assistantFilterYes: "Cần hỗ trợ viên",
    assistantFilterNo: "Không cần hỗ trợ",
  },
  en: {
    searchPlaceholder: "Search code or description...",
    thCode: "Class Code",
    thSport: "Sport",
    thDesc: "Description",
    thMedicalDesc: "Medical Desc",
    thAssistant: "Needs Assistant",
    thCreatedAt: "Created At",
    thActions: "Actions",
    noResults: "No disability classes found.",
    addType: "Add Class",
    editType: "Edit Class",
    newType: "Add New Class",
    codeLabel: "Class Code (e.g. T11, BC1)",
    sportLabel: "Sport",
    descLabel: "Functional Description",
    medicalDescLabel: "Medical Description (optional)",
    criteriaLabel: "Minimum Disability Criteria (optional)",
    assistantLabel: "Requires assistant during competition",
    selectSport: "Select sport...",
    btnCancel: "Cancel",
    btnSave: "Save",
    yes: "Yes",
    no: "No",
    sportFilterAll: "All Sports",
    assistantFilterAll: "All Assistance Status",
    assistantFilterYes: "Requires Assistant",
    assistantFilterNo: "No Assistant Required",
  }
};

export function DisabilityClassesTab() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language } = useLanguage();
  const tStr = translations[language] || translations.vi;

  const [classifications, setClassifications] = useState<SportClassification[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [alertInfo, setAlertInfo] = useState<{isOpen: boolean, title: string, message: string, type: "danger" | "warning" | "info"}>({ isOpen: false, title: "", message: "", type: "danger" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClassification, setEditingClassification] = useState<SportClassification | null>(null);
  const [formData, setFormData] = useState({
    sportId: "",
    code: "",
    description: "",
    medicalDesc: "",
    disabilityCriteria: "",
    requiresAssistant: false
  });
  const [formLoading, setFormLoading] = useState(false);

  // Table tools state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSportFilter, setSelectedSportFilter] = useState("");
  const [requiresAssistantFilter, setRequiresAssistantFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({
    key: "",
    direction: null
  });

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSportFilter, requiresAssistantFilter, pageSize]);

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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    } else if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classRes, sportsRes] = await Promise.all([
        apiClient.request("/sport-classifications"),
        apiClient.request("/sports")
      ]);

      if (classRes.ok) {
        const classData = await classRes.json();
        setClassifications(classData);
      }
      if (sportsRes.ok) {
        const sportsData = await sportsRes.json();
        setSports(sportsData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingClassification(null);
    setFormData({
      sportId: sports[0]?.id || "",
      code: "",
      description: "",
      medicalDesc: "",
      disabilityCriteria: "",
      requiresAssistant: false
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: SportClassification) => {
    setEditingClassification(item);
    setFormData({
      sportId: item.sportId,
      code: item.code,
      description: item.description || "",
      medicalDesc: item.medicalDesc || "",
      disabilityCriteria: item.disabilityCriteria || "",
      requiresAssistant: item.requiresAssistant
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClassification(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sportId || !formData.code) {
      return;
    }
    setFormLoading(true);
    try {
      const url = editingClassification 
        ? getApiUrl(`/sport-classifications/${editingClassification.id}`) 
        : getApiUrl("/sport-classifications");
      
      const method = editingClassification ? "PATCH" : "POST";
      const token = (session as any)?.accessToken || "";
      
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        // Refresh classifications
        const refreshRes = await apiClient.request("/sport-classifications");
        if (refreshRes.ok) {
          const classData = await refreshRes.json();
          setClassifications(classData);
        }
        closeModal();
      } else {
        const err = await res.json();
        setAlertInfo({
          isOpen: true,
          title: language === "vi" ? "Lỗi" : "Error",
          message: err.message || "Failed to save classification",
          type: "danger"
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(deleteId);
    try {
      const res = await apiClient.request(`/sport-classifications/${deleteId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setClassifications(classifications.filter(c => c.id !== deleteId));
      } else {
        const err = await res.json();
        setAlertInfo({
          isOpen: true,
          title: language === "vi" ? "Lỗi" : "Error",
          message: err.message || "Failed to delete classification",
          type: "danger"
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
      setDeleteId(null);
    }
  };

  // Filter and sort
  const filteredData = classifications.filter(item => {
    const matchesSearch = 
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.medicalDesc && item.medicalDesc.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSport = 
      !selectedSportFilter || item.sportId === selectedSportFilter;
      
    const matchesAssistant = 
      requiresAssistantFilter === "all" ? true :
      requiresAssistantFilter === "yes" ? item.requiresAssistant :
      !item.requiresAssistant;
      
    return matchesSearch && matchesSport && matchesAssistant;
  });

  if (sortConfig.key && sortConfig.direction) {
    filteredData.sort((a: any, b: any) => {
      let aVal = a[sortConfig.key] || "";
      let bVal = b[sortConfig.key] || "";
      
      if (sortConfig.key === "sport") {
        aVal = a.sport ? (language === "vi" ? a.sport.nameVi : a.sport.nameEn) : "";
        bVal = b.sport ? (language === "vi" ? b.sport.nameVi : b.sport.nameEn) : "";
      }

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns: ColumnDef<SportClassification>[] = [
    {
      key: "code",
      title: tStr.thCode,
      sortable: true,
      render: (item) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          {item.code}
        </span>
      )
    },
    {
      key: "sport",
      title: tStr.thSport,
      sortable: true,
      render: (item) => (
        <span className="font-medium text-slate-800 dark:text-slate-200">
          {item.sport ? (language === "vi" ? item.sport.nameVi : item.sport.nameEn) : "-"}
        </span>
      )
    },
    {
      key: "desc",
      title: tStr.thDesc,
      render: (item) => (
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 max-w-md">
          {item.description || "-"}
        </p>
      )
    },
    {
      key: "medicalDesc",
      title: tStr.thMedicalDesc,
      render: (item) => (
        <p className="text-xs text-slate-500 dark:text-slate-500 line-clamp-2 max-w-sm">
          {item.medicalDesc || "-"}
        </p>
      )
    },
    {
      key: "requiresAssistant",
      title: tStr.thAssistant,
      sortable: true,
      render: (item) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          item.requiresAssistant 
            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
        }`}>
          {item.requiresAssistant ? tStr.yes : tStr.no}
        </span>
      )
    },
    {
      key: "actions",
      title: tStr.thActions,
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(item)}
            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/50"
          >
            <Edit2 size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => confirmDelete(item.id)}
            disabled={actionLoading === item.id}
            className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/50"
          >
            {actionLoading === item.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          </Button>
        </div>
      )
    }
  ];

  if (status === "loading" || (loading && classifications.length === 0)) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Component */}
      {alertInfo.isOpen && (
        <div className={`p-4 rounded-xl flex items-start gap-3 ${
          alertInfo.type === 'danger' ? 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-300' :
          alertInfo.type === 'warning' ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300' :
          'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
        }`}>
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{alertInfo.title}</h3>
            <p className="text-sm mt-1 opacity-90">{alertInfo.message}</p>
          </div>
          <button onClick={() => setAlertInfo({...alertInfo, isOpen: false})} className="opacity-70 hover:opacity-100 transition-opacity">
            <X size={16} />
          </button>
        </div>
      )}

      <DataTable
        data={paginatedData}
        columns={columns}
        totalRecords={filteredData.length}
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
        isLoading={loading}
        onCreate={openAddModal}
        createLabel={tStr.newType}
        filterNodes={
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedSportFilter}
              onChange={(e) => setSelectedSportFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition cursor-pointer text-slate-700 dark:text-slate-305"
            >
              <option value="">{tStr.sportFilterAll}</option>
              {sports.map(sport => (
                <option key={sport.id} value={sport.id}>
                  {language === "vi" ? sport.nameVi : sport.nameEn}
                </option>
              ))}
            </select>
            <select
              value={requiresAssistantFilter}
              onChange={(e) => setRequiresAssistantFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition cursor-pointer text-slate-700 dark:text-slate-305"
            >
              <option value="all">{tStr.assistantFilterAll}</option>
              <option value="yes">{tStr.assistantFilterYes}</option>
              <option value="no">{tStr.assistantFilterNo}</option>
            </select>
          </div>
        }
      />

      {/* Modal Thêm/Sửa */}
      <Dialog open={isModalOpen} onOpenChange={(open: boolean) => !open && closeModal()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingClassification ? tStr.editType : tStr.newType}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold mb-1">{tStr.sportLabel} <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={formData.sportId}
                  onChange={(e) => setFormData({...formData, sportId: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>{tStr.selectSport}</option>
                  {sports.map(sport => (
                    <option key={sport.id} value={sport.id}>
                      {language === "vi" ? sport.nameVi : sport.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">{tStr.codeLabel} <span className="text-rose-500">*</span></label>
                <Input 
                  required 
                  value={formData.code} 
                  onChange={(e) => setFormData({...formData, code: e.target.value})} 
                  placeholder="VD: T11, BC2, SH1..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-1">{tStr.descLabel}</label>
                <textarea 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  placeholder="Nhập mô tả chi tiết chức năng..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">{tStr.medicalDescLabel}</label>
                <textarea 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  value={formData.medicalDesc} 
                  onChange={(e) => setFormData({...formData, medicalDesc: e.target.value})} 
                  placeholder="Mô tả tiêu chí y học..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">{tStr.criteriaLabel}</label>
                <textarea 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  value={formData.disabilityCriteria} 
                  onChange={(e) => setFormData({...formData, disabilityCriteria: e.target.value})} 
                  placeholder="Tiêu chí mức độ khuyết tật tối thiểu..."
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="requiresAssistant"
                  checked={formData.requiresAssistant}
                  onChange={(e) => setFormData({...formData, requiresAssistant: e.target.checked})}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <label htmlFor="requiresAssistant" className="text-sm font-semibold cursor-pointer">
                  {tStr.assistantLabel}
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal} disabled={formLoading}>
                {tStr.btnCancel}
              </Button>
              <Button type="submit" disabled={formLoading} className="gap-2">
                {formLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                {tStr.btnSave}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Xóa */}
      <ConfirmModal
        isOpen={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={language === "vi" ? "Xác nhận xóa" : "Confirm deletion"}
        message={language === "vi" ? "Bạn có chắc chắn muốn xóa hạng thương tật này? Hành động này không thể hoàn tác." : "Are you sure you want to delete this class? This cannot be undone."}
        confirmText={language === "vi" ? "Xóa" : "Delete"}
        cancelText={language === "vi" ? "Hủy" : "Cancel"}
        type="danger"
      />
    </div>
  );
}
