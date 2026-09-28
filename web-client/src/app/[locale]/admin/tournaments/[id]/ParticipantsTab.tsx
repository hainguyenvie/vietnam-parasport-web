"use client";

import { apiClient } from "@/lib/api-client";

import { useLanguage } from '@/hooks/useTranslation';
import { toast } from "sonner";
import { useState, useEffect, useMemo } from "react";
import { Loader2, Users, Search, Plus, Ban, Trash2, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { UserHoverCard } from "@/components/UserHoverCard";

// next/image available for migration — add unoptimized for dynamic URLs

export default function ParticipantsTab({ tournamentId }: { tournamentId: string }) {
  const { language } = useLanguage();
  const [tournament, setTournament] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Add Athlete Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [allAthletes, setAllAthletes] = useState<any[]>([]);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const res = await apiClient.request(`/tournaments/${tournamentId}`);
      const data = await res.json();
      setTournament(data);
      if (data.rankings) {
        setParticipants(Array.isArray(data.rankings) ? data.rankings : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAthletes = async () => {
    try {
      const res = await apiClient.request(`/users/athletes/all`);
      const result = await res.json();
      setAllAthletes(Array.isArray(result) ? result : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAllTeams = async () => {
    try {
      const res = await apiClient.request(`/teams`);
      const teams = await res.json();
      setAllTeams(teams);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchParticipants();
    fetchAllAthletes();
    fetchAllTeams();
  }, [tournamentId]);

  const [seed, setSeed] = useState<string>("");

  const handleAddParticipant = async () => {
    setAddLoading(true);
    try {
      let bodyData: any = {};
      if (tournament?.participantType === 'TEAM') {
        if (!selectedTeamId) return toast.error("Vui lòng chọn Đội tuyển");
        bodyData = { teamId: selectedTeamId };
      } else {
        if (!selectedAthleteId) return toast.error("Vui lòng chọn VĐV");
        bodyData = { athleteId: selectedAthleteId };
      }

      if (seed) {
        bodyData.seed = parseInt(seed, 10);
      }

      const res = await apiClient.request(`/tournaments/${tournamentId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setSelectedTeamId("");
        setSelectedAthleteId("");
        setSeed("");
        fetchParticipants();
      } else {
        const error = await res.json();
        toast.error(error.message || "Không thể thêm VĐV/Đội");
      }
    } catch (e) {
      toast.error("Lỗi kết nối");
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdateStatus = async (rankingId: string, status: string) => {
    setActionLoading(rankingId);
    try {
      const res = await apiClient.request(`/tournaments/${tournamentId}/participants/${rankingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchParticipants();
      } else {
        toast.error("Lỗi cập nhật trạng thái");
      }
    } catch (e) {
      toast.error("Lỗi kết nối");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckIn = async (rankingId: string, hasCheckedIn: boolean) => {
    setActionLoading(rankingId);
    try {
      const res = await apiClient.request(`/tournaments/${tournamentId}/participants/${rankingId}/checkin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasCheckedIn })
      });
      if (res.ok) {
        fetchParticipants();
      } else {
        toast.error("Lỗi cập nhật điểm danh");
      }
    } catch (e) {
      toast.error("Lỗi kết nối");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (rankingId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa khỏi giải đấu?")) return;
    setActionLoading(rankingId);
    try {
      const res = await apiClient.request(`/tournaments/${tournamentId}/participants/${rankingId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchParticipants();
      } else {
        toast.error("Lỗi khi xóa");
      }
    } catch (e) {
      toast.error("Lỗi kết nối");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTeamClick = (ranking: any) => {
    setTeamDetails(ranking);
  };

  const [teamDetails, setTeamDetails] = useState<any>(null);

  const filteredParticipants = useMemo(() => {
    return participants.filter(r => {
      if (tournament?.participantType === 'TEAM') {
        return (r.team?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      }
      const athlete = r.athlete;
      return (athlete?.user?.fullName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
             (athlete?.sport?.nameVi?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    });
  }, [participants, searchQuery, tournament?.participantType]);

  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.ceil(filteredParticipants.length / pageSize);
  const paginatedParticipants = filteredParticipants.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const columns: ColumnDef<any>[] = [
    {
      key: "info",
      title: "Thông tin",
      render: (ranking) => {
        const isTeam = tournament?.participantType === 'TEAM';
        const athlete = ranking.athlete;
        const team = ranking.team;
        
        const isBanned = ranking.status === 'BANNED';
        const name = isTeam ? team?.name : athlete?.user?.fullName || 'Vận động viên ẩn danh';
        const avatar = !isTeam && athlete?.user?.avatarUrl ? athlete.user.avatarUrl : null;
        const subtitle = isTeam ? `${team?.members?.length || 0} thành viên` : (athlete?.sport?.nameVi || 'Chưa rõ môn thi đấu');

        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden relative border border-slate-200 dark:border-slate-600">
              {avatar ? (
                <img loading="lazy" src={avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                <Users size={16} className="text-slate-400" />
              )}
              {isBanned && (
                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center backdrop-blur-[1px]">
                  <Ban size={20} className="text-red-600 drop-shadow-md" />
                </div>
              )}
            </div>
            <div>
              <div
                className={`font-semibold ${isTeam ? "cursor-pointer hover:text-blue-600" : ""} flex items-center gap-2`}
                onClick={() => isTeam && handleTeamClick(ranking)}
              >
                {isTeam ? name : (
                  <UserHoverCard userId={ranking.athlete?.userId || ranking.athlete?.user?.id || ranking.athlete?.id} language={language}>
                    {name}
                  </UserHoverCard>
                )}
              </div>
              <div className="text-xs text-slate-500">{subtitle}</div>
            </div>
          </div>
        );
      }
    },
    {
      key: "seed",
      title: "Hạt giống",
      render: (ranking) => {
        if (ranking.seed === null || ranking.seed === undefined) return <span className="text-slate-400">-</span>;
        return (
          <span className="inline-block text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase">
            #{ranking.seed}
          </span>
        );
      }
    },
    {
      key: "status",
      title: "Trạng thái",
      render: (ranking) => {
        const isBanned = ranking.status === 'BANNED';
        return (
          <div className="flex flex-col gap-1 items-start">
            {ranking.hasCheckedIn && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1"><CheckCircle2 size={10} /> Đã điểm danh</span>}
            {isBanned && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase">Bị cấm</span>}
            {!ranking.hasCheckedIn && !isBanned && <span className="text-[10px] text-slate-400">Bình thường</span>}
          </div>
        );
      }
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (ranking) => {
        const isBanned = ranking.status === 'BANNED';
        
        return (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleCheckIn(ranking.id, !ranking.hasCheckedIn)}
              disabled={actionLoading === ranking.id}
              className={`p-2 rounded-lg transition-colors ${ranking.hasCheckedIn ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              title={ranking.hasCheckedIn ? 'Hủy Điểm danh' : 'Điểm danh'}
            >
              {actionLoading === ranking.id ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle2 size={16} />}
            </button>

            {isBanned ? (
              <button 
                onClick={() => handleUpdateStatus(ranking.id, 'ACTIVE')}
                disabled={actionLoading === ranking.id}
                className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                title="Mở khóa"
              >
                {actionLoading === ranking.id ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle2 size={16} />}
              </button>
            ) : (
              <button 
                onClick={() => handleUpdateStatus(ranking.id, 'BANNED')}
                disabled={actionLoading === ranking.id}
                className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                title="Khóa"
              >
                {actionLoading === ranking.id ? <Loader2 size={16} className="animate-spin"/> : <Ban size={16} />}
              </button>
            )}
            
            <button 
              onClick={() => handleRemove(ranking.id)}
              disabled={actionLoading === ranking.id}
              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              title="Xóa khỏi giải"
            >
              {actionLoading === ranking.id ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16} />}
            </button>
          </div>
        );
      }
    }
  ];

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="w-full space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Users size={20} className="text-blue-600" />
          Danh sách {tournament?.participantType === 'TEAM' ? 'Đội' : 'VĐV'} tham gia ({participants.length})
        </h2>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input 
              className="pl-9" 
              placeholder={tournament?.participantType === 'TEAM' ? "Tìm kiếm đội..." : "Tìm kiếm VĐV, Môn..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
            <Plus size={16} /> Thêm {tournament?.participantType === 'TEAM' ? 'Đội' : 'VĐV'}
          </Button>
        </div>
      </div>

      <DataTable
        data={paginatedParticipants}
        columns={columns}
        totalRecords={filteredParticipants.length}
        page={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {/* Add Modal */}
      {isAddModalOpen && (
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{tournament?.participantType === 'TEAM' ? "Thêm Đội thi đấu" : "Thêm Vận động viên"}</DialogTitle>
            </DialogHeader>
            <div className="p-4 space-y-4">
              {tournament?.participantType === 'TEAM' ? (
                <>
                  <p className="text-sm text-slate-500">Vui lòng chọn đội thi đấu từ danh sách. Nếu chưa có đội, hãy vào mục Đội tuyển để tạo.</p>
                  <div>
                    <label className="block text-sm font-medium mb-1">Chọn Đội tuyển</label>
                    <select 
                      className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800"
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                    >
                      <option value="">-- Chọn Đội tuyển --</option>
                      {allTeams.map((team: any) => (
                        <option key={team.id} value={team.id}>
                          {team.name} ({team.members?.length || 0} thành viên)
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-500">Vui lòng chọn VĐV từ danh sách dưới đây để thêm vào giải đấu. Hệ thống sẽ tự động đăng ký họ vào Môn thể thao tương ứng với hồ sơ của họ.</p>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Chọn Vận động viên</label>
                    <select 
                      className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800"
                      value={selectedAthleteId}
                      onChange={(e) => setSelectedAthleteId(e.target.value)}
                    >
                      <option value="">-- Chọn VĐV --</option>
                      {allAthletes.map((athlete: any) => (
                        <option key={athlete.id} value={athlete.id}>
                          {athlete.user?.fullName} ({athlete.sport?.nameVi || 'Chưa rõ môn'})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Hạt giống (Seed) - Tuỳ chọn</label>
                <Input 
                  type="number"
                  placeholder="VD: 1, 2, 3..."
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  min="1"
                />
                <p className="text-xs text-slate-500 mt-1">Sử dụng để thuật toán tự động chia cặp đối đầu khi sinh sơ đồ.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
              <Button onClick={handleAddParticipant} disabled={addLoading}>
                {addLoading ? <Loader2 className="animate-spin" size={16} /> : "Thêm vào giải"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Team Details Modal */}
      {teamDetails && (
        <Dialog open={!!teamDetails} onOpenChange={(open: boolean) => !open && setTeamDetails(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chi tiết Đội thi đấu: {teamDetails.team?.name}</DialogTitle>
            </DialogHeader>
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-sm font-semibold">Danh sách thành viên ({teamDetails.team?.members?.length || 0}):</p>
              <div className="space-y-3">
                {teamDetails.team?.members?.map((memberInfo: any) => {
                  const member = memberInfo.athlete;
                  return (
                    <div key={memberInfo.id} className="flex items-center gap-3 p-2 rounded-lg border border-slate-100 bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200">
                        {member?.user?.avatarUrl ? (
                          <img loading="lazy" src={member.user.avatarUrl} alt={member.user.fullName || "Avatar"} className="w-full h-full object-cover"/>
                        ) : (
                          <Users className="w-full h-full p-2 text-slate-400"/>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{member?.user?.fullName || 'Đang tải...'}</p>
                        <p className="text-xs text-slate-500">{member?.user?.email}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setTeamDetails(null)}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
