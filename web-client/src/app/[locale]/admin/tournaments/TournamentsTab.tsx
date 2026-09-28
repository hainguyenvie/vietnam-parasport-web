"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";
import { formatDate } from "@/lib/date-utils";

import { useState, useEffect } from "react";
import { useApi } from "@/hooks/useApi";
import { Trophy, Calendar, MapPin, Eye, Pencil, Trash2, Plus, Search, ChevronLeft, ChevronRight, Loader2, FileSpreadsheet, FileText } from "lucide-react";
import { useModalStore } from "@/store/useModalStore";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import Link from "next/link";
import { TournamentForm } from "@/components/admin/TournamentForm";

// next/image available for migration — add unoptimized for dynamic URLs

export function TournamentsTab() {
  const { data: tournaments = [], isLoading: loading, mutate: fetchTournaments } = useApi("/tournaments");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({ key: "", direction: null });



  
  const handleDelete = async (id: string) => {
    useModalStore.getState().openModal({
      type: "confirm",
      title: "Xác nhận xóa",
      description: "Bạn có chắc chắn muốn xóa giải đấu này?",
      onConfirm: async () => {
        try {
          const res = await apiClient.request(`/tournaments/${id}`, { method: 'DELETE' });
          if (res.ok) {
            toast.success("Xóa giải đấu thành công.");
            fetchTournaments();
          } else {
            toast.error("Không thể xóa giải đấu.");
          }
        } catch (error) {
          console.error(error);
          toast.error("Lỗi kết nối.");
        }
      }
    });
  };

  const handleExport = async (tournamentId: string, format: "excel" | "pdf") => {
    const label = format === "excel" ? "Excel" : "PDF";
    toast.info(`Đang tạo báo cáo ${label}...`);

    try {
      // 1. Queue the export job
      const queueRes = await apiClient.request(`/reports/tournaments/${tournamentId}/${format}`);
      if (!queueRes.ok) {
        toast.error(`Không thể tạo báo cáo ${label}`);
        return;
      }
      const { jobId } = await queueRes.json();

      // 2. Poll until complete
      let attempts = 0;
      while (attempts < 30) {
        await new Promise(r => setTimeout(r, 2000));
        const statusRes = await apiClient.request(`/reports/jobs/${jobId}`);
        if (!statusRes.ok) continue;
        const job = await statusRes.json();

        if (job.status === "completed") {
          // 3. Download
          window.open(`/api/v1/reports/jobs/${jobId}/download`, "_blank");
          toast.success(`Đã tải xuống báo cáo ${label}`);
          return;
        }
        if (job.status === "failed") {
          toast.error(`Tạo báo cáo ${label} thất bại`);
          return;
        }
        attempts++;
      }
      toast.error(`Tạo báo cáo ${label} quá thời gian chờ`);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối khi xuất báo cáo");
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "SCHEDULED" || status === "UPCOMING") return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    if (status === "ONGOING") return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    if (status === "COMPLETED") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400";
  };

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" | null = "asc";
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") direction = "desc";
      else if (sortConfig.direction === "desc") direction = null;
    }
    setSortConfig({ key, direction });
  };

  const filteredTournaments = tournaments.filter((t: any) => 
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedTournaments = [...filteredTournaments].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedTournaments = sortedTournaments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns: ColumnDef<any>[] = [
    { 
      key: "name", 
      title: "Tên Giải đấu", 
      sortable: true,
      render: (t) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200 dark:border-slate-700">
            {t.bannerUrl ? (
              <img src={t.bannerUrl} alt={t.name} className="w-full h-full object-cover" />
            ) : (
              <Trophy size={20} className="mx-auto mt-2.5 text-slate-400" />
            )}
          </div>
          <Link href={`/admin/tournaments/${t.slug || t.id}`} className="font-semibold text-slate-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {t.name}
          </Link>
        </div>
      )
    },
    { 
      key: "startDate", 
      title: "Thời gian", 
      sortable: true,
      render: (t) => (
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400"><Calendar size={14} className="text-slate-400" /> {formatDate(t.startDate)} - {formatDate(t.endDate)}</div>
      )
    },
    { 
      key: "location", 
      title: "Địa điểm", 
      sortable: true,
      render: (t) => (
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400"><MapPin size={14} className="text-slate-400" /> {t.location}</div>
      )
    },
    { 
      key: "status", 
      title: "Trạng thái", 
      sortable: true,
      render: (t) => (
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase ${getStatusColor(t.status)}`}>
          {t.status}
        </span>
      )
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (t) => (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => handleExport(t.id, "pdf")} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors border-none bg-transparent cursor-pointer" title="Xuất PDF">
            <FileText size={16} />
          </button>
          <button onClick={() => handleExport(t.id, "excel")} className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors border-none bg-transparent cursor-pointer" title="Xuất Excel">
            <FileSpreadsheet size={16} />
          </button>
          <Link href={`/admin/tournaments/${t.slug || t.id}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border-none bg-transparent cursor-pointer">
            <Eye size={18} />
          </Link>
          <button onClick={() => handleEditClick(t)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border-none bg-transparent cursor-pointer">
            <Pencil size={18} />
          </button>
          <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors border-none bg-transparent cursor-pointer">
            <Trash2 size={18} />
          </button>
        </div>
      )
    }
  ];

  // ================= Modal State =================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    location: "",
    startDate: "",
    endDate: "",
    status: "UPCOMING",
    participantType: "INDIVIDUAL",
    holdThirdPlaceMatch: false
  });
  const [formLoading, setFormLoading] = useState(false);

  const handleCreateClick = () => {
    setIsEditMode(false);
    setCurrentId(null);
    setFormData({
      name: "",
      slug: "",
      location: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      status: "UPCOMING",
      participantType: "INDIVIDUAL",
      holdThirdPlaceMatch: false
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (t: any) => {
    setIsEditMode(true);
    setCurrentId(t.id);
    setFormData({
      name: t.name || "",
      slug: t.slug || "",
      location: t.location || "",
      startDate: t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : "",
      endDate: t.endDate ? new Date(t.endDate).toISOString().split('T')[0] : "",
      status: t.status || "UPCOMING",
      participantType: t.participantType || "INDIVIDUAL",
      holdThirdPlaceMatch: !!t.holdThirdPlaceMatch
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error("Vui lòng nhập tên và slug giải đấu");
      return;
    }
    setFormLoading(true);
    try {
      const url = isEditMode && currentId ? getApiUrl(`/tournaments/${currentId}`) : getApiUrl(`/tournaments`);
      const method = isEditMode ? 'PATCH' : 'POST';
      const body = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        toast.success(isEditMode ? "Cập nhật thành công!" : "Tạo giải đấu thành công!");
        setIsModalOpen(false);
        fetchTournaments();
      } else {
        const err = await res.json();
        toast.error(err.message || "Đã xảy ra lỗi");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi kết nối");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <DataTable
        data={paginatedTournaments}
        columns={columns}
        totalRecords={filteredTournaments.length}
        page={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        isLoading={loading}
        onPageSizeChange={setPageSize}
        sortKey={sortConfig.key}
        sortDirection={sortConfig.direction}
        onSort={handleSort}
        searchPlaceholder="Tìm kiếm giải đấu, địa điểm..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onCreate={handleCreateClick}
        createLabel="Thêm Giải đấu"
      />

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-xl font-bold mb-4">{isEditMode ? "Sửa Giải đấu" : "Thêm Giải đấu"}</h2>
            <TournamentForm 
              initialData={formData} 
              onSubmit={handleSave} 
              onCancel={() => setIsModalOpen(false)} 
              isSubmitting={formLoading} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
