"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Search, Loader2, ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, Filter, Trophy } from "lucide-react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useLanguage } from '@/hooks/useTranslation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
export default function MatchesTab({ tournamentId }: { tournamentId: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language } = useLanguage();
  
  const [matches, setMatches] = useState<any[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<any>({
    title: "", sportId: "", tournamentId: tournamentId, startTime: "", location: "", status: "SCHEDULED", result: "", participants: "", round: "", matchFormat: "", group: "", bestOf: ""
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSport, setFilterSport] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({ key: "", direction: null });

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [alertInfo, setAlertInfo] = useState<{isOpen: boolean, title: string, message: string, type: "danger" | "warning" | "info"}>({ isOpen: false, title: "", message: "", type: "danger" });

  useEffect(() => {
    if (status === "authenticated" && session) {
      fetchMatches();
      fetchSports();
      fetchUsers();
    }
  }, [status, session]);

  const fetchMatches = async () => {
    try {
      const res = await apiClient.request(`/matches?tournamentId=${tournamentId}`);
      if (res.ok) {
        const data = await res.json();
        setMatches(Array.isArray(data) ? data.filter((m: any) => m.tournamentId === tournamentId) : []);
      }
    } catch (error) {
      console.error("Failed to fetch matches", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await apiClient.request(`/tournaments/${tournamentId}`);
      if (res.ok) {
        const data = await res.json();
        // Extract athletes from rankings
        if (data.rankings) {
          const tournamentAthletes = data.rankings
            .filter((r: any) => r.athlete && r.status !== 'BANNED')
            .map((r: any) => ({
              id: r.athlete.id,
              fullName: r.athlete.user?.fullName || "VĐV ẩn danh",
              sportId: r.athlete.sportId
            }));
          setUsers(tournamentAthletes);
        }
      }
    } catch (error) {
      console.error("Failed to fetch tournament athletes", error);
    }
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
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("save");

    try {
      let participantsData = null;
      try {
        if (currentMatch.participants) {
          participantsData = typeof currentMatch.participants === 'string' ? JSON.parse(currentMatch.participants) : currentMatch.participants;
        }
      } catch (err) {
        setErrorMsg("Participants phải là JSON hợp lệ");
        setActionLoading(null);
        return;
      }

      let matchTitle = currentMatch.title;
      if (!matchTitle) {
        const sportName = sports.find(s => s.id === currentMatch.sportId)?.nameVi || "";
        matchTitle = [currentMatch.round, currentMatch.matchFormat, sportName].filter(Boolean).join(" - ");
        if (!matchTitle) matchTitle = "Trận đấu";
      }

      const method = isEditing ? "PUT" : "POST";
      const url = isEditing ? getApiUrl(`/matches/${currentMatch.id}`) : getApiUrl("/matches");
      const bodyData = { 
        title: matchTitle,
        sportId: currentMatch.sportId,
        tournamentId: currentMatch.tournamentId,
        location: currentMatch.location,
        status: currentMatch.status,
        result: currentMatch.result,
        round: currentMatch.round || null,
        matchFormat: currentMatch.matchFormat || null,
        group: currentMatch.group || null,
        bestOf: currentMatch.bestOf || null,
        startTime: new Date(currentMatch.startTime).toISOString(),
        participants: participantsData
      };

      const res = await apiClient.request(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (res.ok) {
        await fetchMatches();
        setIsEditing(false);
        setErrorMsg(null);
        setCurrentMatch({ title: "", sportId: "", tournamentId: tournamentId, startTime: "", location: "", status: "SCHEDULED", result: "", participants: "", round: "", matchFormat: "", group: "", bestOf: "" });
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
      const res = await apiClient.request(`/matches/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchMatches();
      } else {
        setAlertInfo({ isOpen: true, title: "Lỗi", message: "Không thể xóa trận đấu", type: "danger" });
      }
    } catch (error) {
      setAlertInfo({ isOpen: true, title: "Lỗi", message: "Không thể kết nối đến server", type: "danger" });
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

  const filteredMatches = matches.filter(m => {
    const matchSearch = m.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       m.sport?.nameVi?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSport = filterSport === "all" || m.sportId === filterSport;
    const matchStatus = filterStatus === "all" || m.status === filterStatus;
    
    let matchDate = true;
    if (filterDate && m.startTime) {
      const mDate = new Date(m.startTime).toISOString().split('T')[0];
      if (mDate !== filterDate) matchDate = false;
    }

    return matchSearch && matchSport && matchStatus && matchDate;
  });

  const getRoundWeight = (round: string) => {
    if (!round) return 99;
    const r = round.toLowerCase();
    if (r.includes("chung kết") && !r.includes("bán")) return 1; // Chung kết
    if (r.includes("bán kết") || r.includes("bán")) return 2; // Bán kết
    if (r.includes("tứ kết") || r.includes("tứ")) return 3; // Tứ kết
    if (r.includes("1/8") || r.includes("16")) return 4; // Vòng 1/8
    if (r.includes("vòng bảng") || r.includes("bảng")) return 5; // Vòng bảng
    if (r.includes("vòng loại") || r.includes("loại")) return 6; // Vòng loại
    return 99;
  };

  const sortedMatches = [...filteredMatches].sort((a, b) => {
    // If no explicit sort, auto sort by closest date first
    if (!sortConfig.key || !sortConfig.direction) {
      if (a.status === 'ONGOING' && b.status !== 'ONGOING') return -1;
      if (b.status === 'ONGOING' && a.status !== 'ONGOING') return 1;

      const tA = a.startTime ? new Date(a.startTime).getTime() : Number.MAX_SAFE_INTEGER;
      const tB = b.startTime ? new Date(b.startTime).getTime() : Number.MAX_SAFE_INTEGER;
      return tA - tB;
    }
    
    const aVal = sortConfig.key === 'sport' ? (a.sport?.nameVi || "") : a[sortConfig.key];
    const bVal = sortConfig.key === 'sport' ? (b.sport?.nameVi || "") : b[sortConfig.key];
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedMatches = sortedMatches.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns: ColumnDef<any>[] = [
    { 
      key: "title", 
      title: "Tên trận đấu", 
      sortable: true,
      render: (m) => <span className="font-semibold text-slate-800 dark:text-white">{m.title}</span>
    },
    { 
      key: "sport", 
      title: "Môn thể thao", 
      sortable: true,
      render: (m) => m.sport?.nameVi || m.sportId
    },
    { 
      key: "round", 
      title: "Vòng đấu", 
      sortable: true,
      render: (m) => m.round || "-"
    },
    { 
      key: "matchFormat", 
      title: "Hình thức", 
      sortable: true,
      render: (m) => m.matchFormat ? `${m.matchFormat}${m.bestOf ? ` (BO${m.bestOf})` : ''}` : "-"
    },
    { 
      key: "startTime", 
      title: "Thời gian", 
      sortable: true,
      render: (m) => m.startTime ? new Date(m.startTime).toLocaleString() : <span className="text-slate-400 italic font-medium">Chưa cập nhật (TBA)</span>
    },
    { 
      key: "status", 
      title: "Trạng thái", 
      sortable: true,
      render: (m) => (
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
          m.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
          m.status === 'ONGOING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
          m.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {m.status}
        </span>
      )
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (m) => (
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => {
              setCurrentMatch({
                ...m,
                startTime: new Date(m.startTime).toISOString().slice(0, 16),
                participants: m.participants ? JSON.stringify(m.participants) : ""
              });
              setIsEditing(true);
            }}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={() => setDeleteId(m.id)}
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
      <DataTable
        data={paginatedMatches}
        columns={columns}
        totalRecords={filteredMatches.length}
        page={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        sortKey={sortConfig.key}
        sortDirection={sortConfig.direction}
        onSort={handleSort}
        searchPlaceholder="Tìm kiếm trận đấu..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filterNodes={
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={filterSport}
              onValueChange={(value: string) => { setFilterSport(value); setCurrentPage(1); }}
            >
              <SelectTrigger className="p-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <SelectValue placeholder="Tất cả môn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả môn</SelectItem>
                {sports.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.nameVi}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              type="date"
              className="p-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={filterDate}
              onChange={e => { setFilterDate(e.target.value); setCurrentPage(1); }}
            />
            <Select
              value={filterStatus}
              onValueChange={(value: string) => { setFilterStatus(value); setCurrentPage(1); }}
            >
              <SelectTrigger className="p-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="SCHEDULED">Sắp diễn ra</SelectItem>
                <SelectItem value="ONGOING">Đang diễn ra</SelectItem>
                <SelectItem value="COMPLETED">Đã kết thúc</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
            {(filterSport !== 'all' || filterStatus !== 'all' || filterDate) && (
              <Button 
                variant="outline" 
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => { setFilterSport('all'); setFilterStatus('all'); setFilterDate(''); setCurrentPage(1); }}
              >
                Xóa lọc
              </Button>
            )}
          </div>
        }
        onCreate={() => {
          setErrorMsg(null);
          setCurrentMatch({ title: "", sportId: "", tournamentId: tournamentId, startTime: "", location: "", status: "SCHEDULED", result: "", participants: "", round: "", matchFormat: "", group: "", bestOf: "" });
          setIsEditing(true);
        }}
        onRowClick={(e, row) => {
          setErrorMsg(null);
          setCurrentMatch({
            ...row,
            // Format datetime-local requires YYYY-MM-DDTHH:mm
            startTime: new Date(row.startTime).toISOString().slice(0, 16)
          });
          setIsEditing(true);
        }}
        createLabel={language === "vi" ? "Thêm mới" : "Add New"}
        isLoading={loading}
      />

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-xl overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <DialogTitle>{currentMatch.id ? "Sửa thông tin trận đấu" : "Thêm mới trận đấu"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="p-5 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium border border-red-200 dark:border-red-800">
                {errorMsg}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Tên trận đấu (Để trống hệ thống sẽ tự tạo)</label>
              <Input type="text" placeholder="Tên trận đấu..." value={currentMatch.title} onChange={(e) => setCurrentMatch({...currentMatch, title: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Môn thể thao</label>
                <Select required value={currentMatch.sportId} onValueChange={(value: string) => setCurrentMatch({...currentMatch, sportId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn môn" />
                  </SelectTrigger>
                  <SelectContent>
                    {sports.map(s => <SelectItem key={s.id} value={s.id}>{s.nameVi}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vòng đấu</label>
                <Select value={currentMatch.round || ""} onValueChange={(value: string) => setCurrentMatch({...currentMatch, round: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Không phân vòng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vòng bảng">Vòng bảng</SelectItem>
                    <SelectItem value="Vòng 16">Vòng 16</SelectItem>
                    <SelectItem value="Tứ kết">Tứ kết</SelectItem>
                    <SelectItem value="Bán kết">Bán kết</SelectItem>
                    <SelectItem value="Chung kết">Chung kết</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Hình thức</label>
                <Input type="text" placeholder="VD: Đơn nam" value={currentMatch.matchFormat || ""} onChange={(e) => setCurrentMatch({...currentMatch, matchFormat: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bảng đấu</label>
                <Input type="text" placeholder="VD: Bảng A" value={currentMatch.group || ""} onChange={(e) => setCurrentMatch({...currentMatch, group: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Số ván / Séc đấu</label>
                <Input type="number" placeholder="VD: 3, 5" value={currentMatch.bestOf || ""} onChange={(e) => setCurrentMatch({...currentMatch, bestOf: e.target.value ? parseInt(e.target.value) : null})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Thời gian</label>
                <Input required type="datetime-local" value={currentMatch.startTime} onChange={(e) => setCurrentMatch({...currentMatch, startTime: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Địa điểm</label>
                <Input type="text" value={currentMatch.location} onChange={(e) => setCurrentMatch({...currentMatch, location: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Trạng thái</label>
                <Select required value={currentMatch.status} onValueChange={(value: string) => setCurrentMatch({...currentMatch, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sắp diễn ra (SCHEDULED)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCHEDULED">Sắp diễn ra (SCHEDULED)</SelectItem>
                    <SelectItem value="ONGOING">Đang diễn ra (ONGOING)</SelectItem>
                    <SelectItem value="COMPLETED">Đã kết thúc (COMPLETED)</SelectItem>
                    <SelectItem value="CANCELLED">Đã hủy (CANCELLED)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Ghi chú kết quả (Tùy chọn)</label>
              <Input type="text" placeholder="VD: Bỏ cuộc, Truất quyền thi đấu..." value={currentMatch.result || ""} onChange={(e) => setCurrentMatch({...currentMatch, result: e.target.value})} />
              <p className="text-xs text-slate-500 mt-1 italic">* Không bắt buộc. Chỉ nhập khi trận đấu có sự cố đặc biệt ngoài việc tính điểm số thông thường.</p>
            </div>

            <div className="col-span-2 space-y-2">
              <label className="block text-sm font-medium mb-1">Vận động viên thi đấu</label>
              {(() => {
                let parsedParticipants: any[] = [];
                try {
                  parsedParticipants = currentMatch.participants ? (typeof currentMatch.participants === 'string' ? JSON.parse(currentMatch.participants) : currentMatch.participants) : [];
                } catch(e) { console.error('Failed to parse participants:', e); }
                if (!Array.isArray(parsedParticipants)) parsedParticipants = [];
                return (
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    {parsedParticipants.map((p, idx) => (
                      <div key={idx} className={`flex gap-2 items-center p-2 rounded-md shadow-sm border transition-colors ${p.isWinner ? 'border-amber-400 dark:border-amber-500 bg-amber-50/50 dark:bg-amber-900/10' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                        <button
                          type="button"
                          onClick={() => {
                            const newP = [...parsedParticipants];
                            const wasWinner = newP[idx].isWinner;
                            newP.forEach(pt => pt.isWinner = false);
                            newP[idx].isWinner = !wasWinner;
                            setCurrentMatch({...currentMatch, participants: JSON.stringify(newP)});
                          }}
                          className={`p-2 rounded-lg transition-colors ${p.isWinner ? 'text-amber-500 bg-amber-100 dark:bg-amber-900/30' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-amber-500'}`}
                          title={p.isWinner ? "Đã chọn là người chiến thắng" : "Đánh dấu là người chiến thắng"}
                        >
                          <Trophy size={18} className={p.isWinner ? "fill-current" : ""} />
                        </button>
                        <Select
                          value={p.id || ""}
                          onValueChange={(value: string) => {
                            const newP = [...parsedParticipants];
                            const selectedAthlete = users.find((u: any) => u.id === value);
                            newP[idx] = { ...p, id: value, name: selectedAthlete ? selectedAthlete.fullName : p.name };
                            setCurrentMatch({...currentMatch, participants: JSON.stringify(newP)});
                          }}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Chọn Vận động viên" />
                          </SelectTrigger>
                          <SelectContent>
                            {users
                              .filter(u => !currentMatch.sportId || u.sportId === currentMatch.sportId)
                              .map((u: any) => <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>)
                            }
                          </SelectContent>
                        </Select>
                        <Input 
                          type="number" 
                          placeholder="Điểm" 
                          className="w-24"
                          value={p.score ?? ""}
                          onChange={(e) => {
                            const newP = [...parsedParticipants];
                            newP[idx].score = Number(e.target.value);
                            setCurrentMatch({...currentMatch, participants: JSON.stringify(newP)});
                          }}
                        />
                        <button type="button" onClick={() => {
                          const newP = parsedParticipants.filter((_, i) => i !== idx);
                          setCurrentMatch({...currentMatch, participants: JSON.stringify(newP)});
                        }} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg" title="Xóa VĐV này"><Trash2 size={16} /></button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                      const newP = [...parsedParticipants, { id: "", name: "", score: 0 }];
                      setCurrentMatch({...currentMatch, participants: JSON.stringify(newP)});
                    }} className="w-full mt-2"><Plus size={16} className="mr-1" /> Thêm Vận động viên</Button>
                  </div>
                );
              })()}
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
        message="Bạn có chắc chắn muốn xóa trận đấu này?"
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
