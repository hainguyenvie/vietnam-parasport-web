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
  Calendar
} from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

interface Sport {
  id: string;
  nameVi: string;
  nameEn: string;
}

interface Match {
  id: string;
  title: string;
  sportId: string;
  sport?: Sport;
  startTime: string;
  location: string;
  status: string;
  result: string;
  participants: any;
}

const translations: Record<string, Record<string, any>> = {
  vi: {
    searchPlaceholder: "Tìm kiếm trận đấu/giải đấu...",
    thTitle: "Tên / Giải đấu",
    thSport: "Môn thể thao",
    thStartTime: "Thời gian",
    thStatus: "Trạng thái",
    thLocation: "Địa điểm",
    thActions: "Thao tác",
    noResults: "Không tìm thấy trận đấu nào phù hợp.",
    addMatch: "Thêm Trận Đấu",
    editMatch: "Chỉnh Sửa Trận Đấu",
    newMatch: "Thêm Trận Đấu Mới",
    titleLabel: "Tên / Giải đấu",
    sportLabel: "Môn thể thao",
    startTimeLabel: "Thời gian",
    locationLabel: "Địa điểm",
    statusLabel: "Trạng thái",
    resultLabel: "Kết quả",
    participantsLabel: "Người tham gia (JSON)",
    btnCancel: "Hủy bỏ",
    btnSave: "Lưu lại",
    chooseSport: "Chọn môn",
    statusScheduled: "Sắp diễn ra (SCHEDULED)",
    statusOngoing: "Đang diễn ra (ONGOING)",
    statusCompleted: "Đã kết thúc (COMPLETED)",
    statusCancelled: "Đã hủy (CANCELLED)"
  },
  en: {
    searchPlaceholder: "Search match/tournament...",
    thTitle: "Title / Tournament",
    thSport: "Sport",
    thStartTime: "Start Time",
    thStatus: "Status",
    thLocation: "Location",
    thActions: "Actions",
    noResults: "No matching matches found.",
    addMatch: "Add Match",
    editMatch: "Edit Match",
    newMatch: "Add New Match",
    titleLabel: "Title / Tournament",
    sportLabel: "Sport",
    startTimeLabel: "Start Time",
    locationLabel: "Location",
    statusLabel: "Status",
    resultLabel: "Result",
    participantsLabel: "Participants (JSON)",
    btnCancel: "Cancel",
    btnSave: "Save",
    chooseSport: "Choose sport",
    statusScheduled: "Scheduled",
    statusOngoing: "Ongoing",
    statusCompleted: "Completed",
    statusCancelled: "Cancelled"
  }
};

export function MatchesTab() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language } = useLanguage();
  const tStr = translations[language] || translations.vi;

  const [matches, setMatches] = useState<Match[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [alertInfo, setAlertInfo] = useState<{isOpen: boolean, title: string, message: string, type: "danger" | "warning" | "info"}>({ isOpen: false, title: "", message: "", type: "danger" });
  const [deleteMatchId, setDeleteMatchId] = useState<string | null>(null);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    sportId: "",
    startTime: "",
    location: "",
    status: "SCHEDULED",
    result: "",
    participants: ""
  });
  const [formLoading, setFormLoading] = useState(false);

  // Table tools state
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({
    key: "startTime",
    direction: "desc"
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
        router.push("/");
      } else {
        fetchMatches();
        fetchSports();
      }
    }
  }, [status, session, router]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  const fetchMatches = async () => {
    try {
      const res = await apiClient.request("/matches");
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
      }
    } catch (err) {
      console.error(err);
      toast.error(language === "vi" ? "Không thể tải danh sách trận đấu." : "Could not load matches.");
    } finally {
      setLoading(false);
    }
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
    }
  };

  const openAddModal = () => {
    setEditingMatch(null);
    setFormData({
      title: "",
      sportId: sports.length > 0 ? sports[0].id : "",
      startTime: new Date().toISOString().slice(0, 16),
      location: "",
      status: "SCHEDULED",
      result: "",
      participants: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (match: Match) => {
    setEditingMatch(match);
    setFormData({
      title: match.title,
      sportId: match.sportId,
      startTime: new Date(match.startTime).toISOString().slice(0, 16),
      location: match.location || "",
      status: match.status,
      result: match.result || "",
      participants: match.participants ? JSON.stringify(match.participants) : ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    let participantsData = null;
    if (formData.participants) {
      try {
        participantsData = JSON.parse(formData.participants);
      } catch (err) {
        setAlertInfo({ isOpen: true, title: "Lỗi", message: language === "vi" ? "Participants phải là JSON hợp lệ" : "Participants must be valid JSON", type: "danger" });
        setFormLoading(false);
        return;
      }
    }

    const isEdit = !!editingMatch;
    const url = isEdit 
      ? `/matches/${editingMatch.id}` 
      : `/matches`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await apiClient.request(url, {
        method,
        body: JSON.stringify({
          ...formData,
          startTime: new Date(formData.startTime).toISOString(),
          participants: participantsData
        })
      });

      if (res.ok) {
        toast.success(language === "vi" ? "Lưu thông tin thành công!" : "Saved successfully!");
        fetchMatches();
        setTimeout(() => setIsModalOpen(false), 500);
      } else {
        const resData = await res.json();
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
    if (!deleteMatchId) return;
    setActionLoading(deleteMatchId);
    try {
      const res = await apiClient.request(`/matches/${deleteMatchId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success(language === "vi" ? "Đã xóa trận đấu thành công!" : "Deleted match successfully!");
        fetchMatches();
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
      setDeleteMatchId(null);
    }
  };

  // Filtering and Sorting
  const filteredMatches = matches.filter(match => {
    const query = searchQuery.toLowerCase();
    const sportNameVi = match.sport?.nameVi?.toLowerCase() || "";
    const sportNameEn = match.sport?.nameEn?.toLowerCase() || "";
    return (
      match.title.toLowerCase().includes(query) ||
      sportNameVi.includes(query) ||
      sportNameEn.includes(query) ||
      (match.location && match.location.toLowerCase().includes(query))
    );
  });

  const sortedMatches = [...filteredMatches].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    
    let aVal: any = a[sortConfig.key as keyof Match] || "";
    let bVal: any = b[sortConfig.key as keyof Match] || "";

    if (sortConfig.key === "sportId") {
      aVal = a.sport?.nameVi || a.sportId;
      bVal = b.sport?.nameVi || b.sportId;
    } else if (sortConfig.key === "startTime") {
      aVal = new Date(a.startTime).getTime();
      bVal = new Date(b.startTime).getTime();
    }

    if (aVal < bVal) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (aVal > bVal) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  const totalRows = sortedMatches.length;
  const currentMatches = sortedMatches.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'ONGOING': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return tStr.statusScheduled;
      case 'ONGOING': return tStr.statusOngoing;
      case 'COMPLETED': return tStr.statusCompleted;
      case 'CANCELLED': return tStr.statusCancelled;
      default: return status;
    }
  };

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
      <DataTable
        data={currentMatches}
        columns={[
          {
            key: "title",
            title: tStr.thTitle,
            sortable: true,
            render: (match) => <span className="font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{match.title}</span>
          },
          {
            key: "sportId",
            title: tStr.thSport,
            sortable: true,
            render: (match) => <span>{language === "en" ? match.sport?.nameEn : match.sport?.nameVi}</span>
          },
          {
            key: "startTime",
            title: tStr.thStartTime,
            sortable: true,
            render: (match) => <span className="whitespace-nowrap">{new Date(match.startTime).toLocaleString()}</span>
          },
          {
            key: "location",
            title: tStr.thLocation,
            sortable: true,
            render: (match) => <span>{match.location || "-"}</span>
          },
          {
            key: "status",
            title: tStr.thStatus,
            sortable: true,
            render: (match) => (
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(match.status)}`}>
                {getStatusLabel(match.status)}
              </span>
            )
          },
          {
            key: "actions",
            title: tStr.thActions,
            render: (match) => (
              <div className="flex items-center justify-end gap-2.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => openEditModal(match)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition cursor-pointer border-none bg-transparent"
                  title={language === "vi" ? "Chỉnh sửa" : "Edit"}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => setDeleteMatchId(match.id)}
                  disabled={actionLoading === match.id}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition cursor-pointer border-none bg-transparent disabled:opacity-55"
                  title={language === "vi" ? "Xóa" : "Delete"}
                >
                  {actionLoading === match.id ? (
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
        createLabel={tStr.addMatch}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b border-slate-150 dark:border-slate-700 bg-white dark:bg-slate-800">
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="text-blue-600" size={20} />
              <span>{editingMatch ? tStr.editMatch : tStr.newMatch}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                {tStr.titleLabel} <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  {tStr.sportLabel} <span className="text-red-500">*</span>
                </label>
                <select 
                  required 
                  value={formData.sportId} 
                  onChange={(e) => setFormData({...formData, sportId: e.target.value})} 
                  className="w-full flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                >
                  <option value="" disabled>{tStr.chooseSport}</option>
                  {sports.map(s => <option key={s.id} value={s.id}>{language === "en" ? s.nameEn : s.nameVi}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  {tStr.startTimeLabel} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  {tStr.locationLabel}
                </label>
                <Input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  {tStr.statusLabel} <span className="text-red-500">*</span>
                </label>
                <select 
                  required 
                  value={formData.status} 
                  onChange={(e) => setFormData({...formData, status: e.target.value})} 
                  className="w-full flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                >
                  <option value="SCHEDULED">{tStr.statusScheduled}</option>
                  <option value="ONGOING">{tStr.statusOngoing}</option>
                  <option value="COMPLETED">{tStr.statusCompleted}</option>
                  <option value="CANCELLED">{tStr.statusCancelled}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                {tStr.resultLabel}
              </label>
              <Input
                type="text"
                value={formData.result}
                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                {tStr.participantsLabel}
              </label>
              <textarea 
                rows={3} 
                value={formData.participants} 
                onChange={(e) => setFormData({...formData, participants: e.target.value})} 
                className="w-full flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300" 
                placeholder='["VĐV A", "VĐV B"]'
              />
            </div>

            <DialogFooter className="px-0 pt-4">
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

      <ConfirmModal
        isOpen={deleteMatchId !== null}
        title={language === "vi" ? "Xác nhận xóa" : "Confirm delete"}
        message={language === "vi" ? "Bạn có chắc chắn muốn xóa trận đấu này?" : "Are you sure you want to delete this match?"}
        confirmText={language === "vi" ? "Xóa" : "Delete"}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteMatchId(null)}
        type="danger"
        isLoading={actionLoading === deleteMatchId}
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
