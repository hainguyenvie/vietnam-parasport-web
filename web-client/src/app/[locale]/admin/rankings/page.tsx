"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, Loader2, Trophy } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/hooks/useTranslation";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface Ranking {
  id: string;
  sportId: string;
  athleteId: string;
  rank: number;
  points: number;
  athlete?: {
    user?: {
      fullName: string;
      email: string;
    }
  }
}

interface Sport {
  id: string;
  nameVi: string;
  nameEn: string;
}

const translations: Record<string, Record<string, any>> = {
  vi: {
    searchPlaceholder: "Tìm kiếm VĐV...",
    thRank: "Hạng",
    thAthlete: "Vận động viên",
    thPoints: "Điểm số",
    thActions: "Thao tác",
    noResults: "Chưa có xếp hạng cho môn thể thao này.",
    addRanking: "Thêm Hạng",
    editRanking: "Sửa Xếp Hạng",
    newRanking: "Thêm Hạng Mới",
    chooseSport: "-- Môn thể thao --",
    selectSportLabel: "Chọn môn thể thao",
    athleteLabel: "Vận động viên",
    athleteNote: "Lưu ý: User phải có Athlete Profile. Ở bản demo này, ID user có thể không khớp với AthleteId nếu chưa tạo Profile.",
    chooseAthlete: "Chọn VĐV (Bạn cần nhập Athlete ID hoặc chọn)",
    rankLabel: "Hạng",
    pointsLabel: "Điểm số",
    btnCancel: "Hủy bỏ",
    btnSave: "Lưu lại"
  },
  en: {
    searchPlaceholder: "Search athlete...",
    thRank: "Rank",
    thAthlete: "Athlete",
    thPoints: "Points",
    thActions: "Actions",
    noResults: "No rankings found for this sport.",
    addRanking: "Add Rank",
    editRanking: "Edit Ranking",
    newRanking: "Add New Rank",
    chooseSport: "-- Sport --",
    selectSportLabel: "Select sport",
    athleteLabel: "Athlete",
    athleteNote: "Note: User must have an Athlete Profile.",
    chooseAthlete: "Choose Athlete",
    rankLabel: "Rank",
    pointsLabel: "Points",
    btnCancel: "Cancel",
    btnSave: "Save"
  }
};

export default function AdminRankingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language } = useLanguage();
  const tStr = translations[language] || translations.vi;
  
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>("");
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRanking, setEditingRanking] = useState<Ranking | null>(null);
  const [formData, setFormData] = useState({ sportId: "", athleteId: "", rank: 1, points: 0 });
  const [athletes, setAthletes] = useState<any[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [alertInfo, setAlertInfo] = useState<{isOpen: boolean, title: string, message: string, type: "danger" | "warning" | "info"}>({ isOpen: false, title: "", message: "", type: "danger" });

  // Table tools state
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({
    key: "rank",
    direction: "asc"
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
        fetchSports();
      }
    }
  }, [status, session, router]);

  useEffect(() => {
    if (selectedSport) {
      fetchRankings(selectedSport);
    } else {
      setRankings([]);
    }
  }, [selectedSport]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize, selectedSport]);

  const fetchSports = async () => {
    try {
      const res = await apiClient.request("/sports");
      if (res.ok) {
        const data = await res.json();
        setSports(data);
        if (data.length > 0 && !selectedSport) {
          setSelectedSport(data[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch sports", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRankings = async (sportId: string) => {
    try {
      setLoading(true);
      const res = await apiClient.request(`/rankings/sport/${sportId}`);
      if (res.ok) {
        const data = await res.json();
        setRankings(data);
      }
    } catch (error) {
      console.error("Failed to fetch rankings", error);
      toast.error(language === "vi" ? "Lỗi tải bảng xếp hạng" : "Failed to load rankings");
    } finally {
      setLoading(false);
    }
  };

  const fetchAthletes = async () => {
    try {
      const res = await apiClient.request("/users");
      if (res.ok) {
        const data = await res.json();
        setAthletes(data); 
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  const openAddModal = () => {
    fetchAthletes();
    setEditingRanking(null);
    setFormData({ sportId: selectedSport, athleteId: "", rank: rankings.length + 1, points: 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (ranking: Ranking) => {
    fetchAthletes();
    setEditingRanking(ranking);
    setFormData({ 
      sportId: ranking.sportId, 
      athleteId: ranking.athleteId, 
      rank: ranking.rank, 
      points: ranking.points 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      // Create new ranking only, no edit route according to previous API usage
      const res = await apiClient.request("/rankings", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          sportId: selectedSport,
          rank: parseInt(formData.rank.toString(), 10),
          points: parseInt(formData.points.toString(), 10)
        }),
      });

      if (res.ok) {
        toast.success(language === "vi" ? "Lưu thông tin thành công!" : "Saved successfully!");
        await fetchRankings(selectedSport);
        setIsModalOpen(false);
      } else {
        const err = await res.json();
        let msg = err.message;
        if (Array.isArray(msg)) msg = msg.join(", ");
        setAlertInfo({ isOpen: true, title: "Lỗi", message: msg || (language === "vi" ? "Có lỗi xảy ra" : "An error occurred"), type: "danger" });
      }
    } catch (error) {
      setAlertInfo({ isOpen: true, title: "Lỗi", message: language === "vi" ? "Không thể kết nối đến server" : "Cannot connect to server", type: "danger" });
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setActionLoading(deleteId);

    try {
      const res = await apiClient.request(`/rankings/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(language === "vi" ? "Xóa thành công!" : "Deleted successfully!");
        await fetchRankings(selectedSport);
      } else {
        setAlertInfo({ isOpen: true, title: "Lỗi", message: language === "vi" ? "Không thể xóa hạng" : "Cannot delete rank", type: "danger" });
      }
    } catch (error) {
      setAlertInfo({ isOpen: true, title: "Lỗi", message: language === "vi" ? "Không thể kết nối" : "Connection error", type: "danger" });
    } finally {
      setActionLoading(null);
      setDeleteId(null);
    }
  };

  // Filtering and Sorting
  const filteredRankings = rankings.filter(ranking => {
    const query = searchQuery.toLowerCase();
    const athleteName = ranking.athlete?.user?.fullName?.toLowerCase() || "";
    return athleteName.includes(query);
  });

  const sortedRankings = [...filteredRankings].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    
    let aVal: any = a[sortConfig.key as keyof Ranking] || "";
    let bVal: any = b[sortConfig.key as keyof Ranking] || "";

    if (sortConfig.key === "athleteId") {
      aVal = a.athlete?.user?.fullName || "";
      bVal = b.athlete?.user?.fullName || "";
    }

    if (aVal < bVal) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (aVal > bVal) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  const totalRows = sortedRankings.length;
  const currentRankings = sortedRankings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (status === "loading" || (loading && !sports.length)) {
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
      <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
        <label className="text-sm font-medium whitespace-nowrap">{tStr.selectSportLabel}:</label>
        <select 
          value={selectedSport} 
          onChange={(e) => setSelectedSport(e.target.value)} 
          className="flex h-10 w-full md:w-64 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-950 dark:focus-visible:ring-slate-300"
        >
          <option value="" disabled>{tStr.chooseSport}</option>
          {sports.map(s => <option key={s.id} value={s.id}>{language === "en" ? s.nameEn : s.nameVi}</option>)}
        </select>
        {loading && <Loader2 className="animate-spin text-blue-600 ml-2" size={20} />}
      </div>

      <DataTable
        data={currentRankings}
        columns={[
          {
            key: "rank",
            title: tStr.thRank,
            sortable: true,
            render: (ranking) => <span className="font-bold text-lg text-slate-800 dark:text-white">{ranking.rank}</span>
          },
          {
            key: "athleteId",
            title: tStr.thAthlete,
            sortable: true,
            render: (ranking) => <span className="font-medium">{ranking.athlete?.user?.fullName || "N/A"}</span>
          },
          {
            key: "points",
            title: tStr.thPoints,
            sortable: true,
            render: (ranking) => <span>{ranking.points}</span>
          },
          {
            key: "actions",
            title: tStr.thActions,
            render: (ranking) => (
              <div className="flex items-center justify-end gap-2.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => openEditModal(ranking)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition cursor-pointer border-none bg-transparent"
                  title={language === "vi" ? "Chỉnh sửa" : "Edit"}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => setDeleteId(ranking.id)}
                  disabled={actionLoading === ranking.id}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition cursor-pointer border-none bg-transparent disabled:opacity-55"
                  title={language === "vi" ? "Xóa" : "Delete"}
                >
                  {actionLoading === ranking.id ? (
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
        createLabel={tStr.addRanking}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b border-slate-150 dark:border-slate-700 bg-white dark:bg-slate-800">
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="text-blue-600" size={20} />
              <span>{editingRanking ? tStr.editRanking : tStr.newRanking}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                {tStr.athleteLabel} <span className="text-red-500">*</span>
              </label>
              <select 
                required 
                value={formData.athleteId} 
                onChange={(e) => setFormData({...formData, athleteId: e.target.value})} 
                className="w-full flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-950 dark:focus-visible:ring-slate-300"
              >
                <option value="" disabled>{tStr.chooseAthlete}</option>
                {athletes.map(a => <option key={a.id} value={a.id}>{a.fullName} - {a.email}</option>)}
              </select>
              <p className="text-xs text-slate-500 mt-1">{tStr.athleteNote}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  {tStr.rankLabel} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min={1}
                  required
                  value={formData.rank}
                  onChange={(e) => setFormData({ ...formData, rank: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  {tStr.pointsLabel} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min={0}
                  required
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                />
              </div>
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
        isOpen={deleteId !== null}
        title={language === "vi" ? "Xác nhận xóa" : "Confirm delete"}
        message={language === "vi" ? "Bạn có chắc chắn muốn xóa hạng này?" : "Are you sure you want to delete this rank?"}
        confirmText={language === "vi" ? "Xóa" : "Delete"}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        type="danger"
        isLoading={actionLoading === deleteId}
      />
      
      <ConfirmModal
        isOpen={alertInfo.isOpen}
        title={alertInfo.title}
        message={alertInfo.message}
        onConfirm={() => setAlertInfo({...alertInfo, isOpen: false})}
        type={alertInfo.type}
        isAlert={true}
      />
    </div>
  );
}
