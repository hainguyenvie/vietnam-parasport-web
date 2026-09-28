"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Edit, Trash2, Loader2, Trophy } from "lucide-react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useLanguage } from '@/hooks/useTranslation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

export default function RankingsTab({ tournamentId }: { tournamentId: string }) {
  const { data: session, status } = useSession();
  const { language } = useLanguage();
  
  const [sports, setSports] = useState<any[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>("");
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentRanking, setCurrentRanking] = useState<any>({ sportId: "", eventId: "", classificationId: "", tournamentId: tournamentId, athleteId: "", rank: 1, points: 0 });
  const [athletes, setAthletes] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<any[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({ key: "", direction: null });

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [alertInfo, setAlertInfo] = useState<{isOpen: boolean, title: string, message: string, type: "danger" | "warning" | "info"}>({ isOpen: false, title: "", message: "", type: "danger" });

  useEffect(() => {
    if (status === "authenticated" && session) {
      fetchSports();
      fetchAthletes(session);
    }
  }, [status, session]);

  useEffect(() => {
    fetchRankings();
  }, []);

  useEffect(() => {
    if (currentRanking.sportId) {
      fetchEvents(currentRanking.sportId);
      fetchClassifications(currentRanking.sportId);
    } else {
      setEvents([]);
      setClassifications([]);
    }
  }, [currentRanking.sportId]);

  const fetchEvents = async (sportId: string) => {
    try {
      const res = await apiClient.request(`/sport-events?sportId=${sportId}`);
      if (res.ok) setEvents(await res.json());
    } catch (error) { console.error('Failed to fetch events:', error); }
  };

  const fetchClassifications = async (sportId: string) => {
    try {
      const res = await apiClient.request(`/sport-classifications?sportId=${sportId}`);
      if (res.ok) setClassifications(await res.json());
    } catch (error) { console.error('Failed to fetch classifications:', error); }
  };

  const fetchSports = async () => {
    try {
      const res = await apiClient.request("/sports");
      if (res.ok) {
        const data = await res.json();
        setSports(data);
      }
    } catch (error) {
      console.error("Failed to fetch sports", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRankings = async () => {
    try {
      const res = await apiClient.request(`/rankings/tournament/${tournamentId}`);
      if (res.ok) {
        const data = await res.json();
        setRankings(data);
      }
    } catch (error) {
      console.error("Failed to fetch rankings", error);
    }
  };

  const fetchAthletes = async (currentSession: any) => {
    try {
      const res = await apiClient.request("/users/athletes/all");
      if (res.ok) {
        const data = await res.json();
        setAthletes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch athletes", error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("save");

    try {
      const res = await apiClient.request("/rankings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...currentRanking,
          sportId: currentRanking.sportId,
          eventId: currentRanking.eventId || null,
          classificationId: currentRanking.classificationId || null,
          tournamentId: tournamentId,
          rank: parseInt(currentRanking.rank, 10),
          points: parseInt(currentRanking.points, 10)
        }),
      });

      if (res.ok) {
        await fetchRankings();
        setIsEditing(false);
        setErrorMsg(null);
        setCurrentRanking({ sportId: sports[0]?.id || "", eventId: "", classificationId: "", tournamentId: tournamentId, athleteId: "", rank: 1, points: 0 });
      } else {
        const err = await res.json();
        setErrorMsg(err.message || "Có lỗi xảy ra khi lưu trữ.");
      }
    } catch (error) {
      setErrorMsg("Không thể kết nối đến server.");
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setActionLoading(deleteId);

    try {
      const res = await apiClient.request(`/rankings/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchRankings();
      } else {
        setAlertInfo({ isOpen: true, title: "Lỗi", message: "Không thể xóa hạng", type: "danger" });
      }
    } catch (error) {
      setAlertInfo({ isOpen: true, title: "Lỗi", message: "Không thể kết nối", type: "danger" });
    } finally {
      setActionLoading(null);
      setDeleteId(null);
    }
  };

  if (status === "loading" || loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;
  }

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" | null = "asc";
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") direction = "desc";
      else if (sortConfig.direction === "desc") direction = null;
    }
    setSortConfig({ key, direction });
  };

  const filteredRankings = rankings.filter(r => 
    r.athlete?.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedRankings = [...filteredRankings].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    const aVal = sortConfig.key === 'athlete' ? (a.athlete?.user?.fullName || "") : a[sortConfig.key];
    const bVal = sortConfig.key === 'athlete' ? (b.athlete?.user?.fullName || "") : b[sortConfig.key];
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedRankings = sortedRankings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns: ColumnDef<any>[] = [
    { 
      key: "sport", 
      title: "Môn thi đấu", 
      sortable: true,
      render: (r) => <span className="font-semibold text-blue-600">{r.sport?.nameVi || "N/A"}</span>
    },
    { 
      key: "rank", 
      title: "Hạng", 
      sortable: true,
      render: (r) => (
        <div className="text-center font-bold text-lg flex items-center justify-center gap-2">
          {r.rank === 1 && <span title="Huy chương Vàng">🥇</span>}
          {r.rank === 2 && <span title="Huy chương Bạc">🥈</span>}
          {r.rank === 3 && <span title="Huy chương Đồng">🥉</span>}
          {r.rank}
        </div>
      )
    },
    { 
      key: "athlete", 
      title: "Vận động viên", 
      sortable: true,
      render: (r) => <span className="font-medium">{r.athlete?.user?.fullName || "N/A"}</span>
    },
    { 
      key: "points", 
      title: "Điểm số", 
      sortable: true,
      render: (r) => r.points
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (r) => (
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => {
              setErrorMsg(null);
              setCurrentRanking({
                id: r.id,
                sportId: r.sportId,
                eventId: r.eventId || "",
                classificationId: r.classificationId || "",
                tournamentId: tournamentId,
                athleteId: r.athleteId,
                rank: r.rank,
                points: r.points
              });
              setIsEditing(true);
            }}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={() => setDeleteId(r.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="w-full space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-4 rounded-lg text-sm">
        <strong>Cách tính điểm:</strong> Điểm số được tính dựa trên thành tích cá nhân của VĐV trong giải. Hạng 1 (🥇), 2 (🥈), 3 (🥉) sẽ nhận được huy chương tương ứng.
      </div>

      <DataTable
        data={paginatedRankings}
        columns={columns}
        totalRecords={filteredRankings.length}
        page={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        sortKey={sortConfig.key}
        sortDirection={sortConfig.direction}
        onSort={handleSort}
        searchPlaceholder="Tìm kiếm VĐV..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onCreate={() => {
          setErrorMsg(null);
          setCurrentRanking({ sportId: sports[0]?.id || "", eventId: "", classificationId: "", tournamentId: tournamentId, athleteId: "", rank: 1, points: 0 });
          setIsEditing(true);
        }}
        createLabel={language === "vi" ? "Thêm mới" : "Add New"}
        isLoading={loading}
      />

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-xl overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <DialogTitle>{currentRanking.id ? "Sửa thành tích" : "Thêm thành tích"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="p-5 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium border border-red-200 dark:border-red-800">
                {errorMsg}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Môn thể thao</label>
              <Select
                required
                value={currentRanking.sportId}
                onValueChange={(value: string) => setCurrentRanking({...currentRanking, sportId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn môn thể thao" />
                </SelectTrigger>
                <SelectContent>
                  {sports.map(s => <SelectItem key={s.id} value={s.id}>{s.nameVi}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vận động viên</label>
              <Select
                required
                value={currentRanking.athleteId}
                onValueChange={(value: string) => setCurrentRanking({...currentRanking, athleteId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn VĐV (Bạn cần nhập Athlete ID hoặc chọn)" />
                </SelectTrigger>
                <SelectContent>
                  {athletes.map(a => <SelectItem key={a.id} value={a.id}>{a.fullName} - {a.email}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">Lưu ý: User phải có Athlete Profile. Ở bản demo này, ID user có thể không khớp với AthleteId nếu chưa tạo Profile.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nội dung thi</label>
                <Select
                  value={currentRanking.eventId}
                  onValueChange={(value: string) => setCurrentRanking({...currentRanking, eventId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="-- Chọn nội dung --" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hạng thương tật</label>
                <Select
                  value={currentRanking.classificationId}
                  onValueChange={(value: string) => setCurrentRanking({...currentRanking, classificationId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="-- Chọn hạng --" />
                  </SelectTrigger>
                  <SelectContent>
                    {classifications.map(c => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Hạng</label>
                <Input required type="number" min={1} value={currentRanking.rank} onChange={(e) => setCurrentRanking({...currentRanking, rank: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Điểm số</label>
                <Input required type="number" min={0} value={currentRanking.points} onChange={(e) => setCurrentRanking({...currentRanking, points: e.target.value})} />
              </div>
            </div>

            <DialogFooter className="px-0">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Hủy</Button>
              <Button type="submit" disabled={actionLoading === "save"} isLoading={actionLoading === "save"}>
                Lưu
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      <ConfirmModal
        isOpen={deleteId !== null}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa hạng này?"
        confirmText="Xóa"
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
