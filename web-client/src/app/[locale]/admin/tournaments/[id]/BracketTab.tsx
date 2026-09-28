"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Loader2, Play, Trophy, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";

import { RenderNode, BracketMatchCard } from "@/components/admin/BracketNode";
import { useModalStore } from "@/store/useModalStore";
export default function BracketTab({ tournamentId, tournament }: { tournamentId: string, tournament?: any }) {
  const [matches, setMatches] = useState<any[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>("SINGLE_ELIMINATION");
  const [editingMatch, setEditingMatch] = useState<any>(null);
  const [savingMatch, setSavingMatch] = useState(false);
  const { openModal } = useModalStore();

  const loadMatches = async () => {
    try {
      const res = await apiClient.request(`/matches`);
      if (res.ok) {
        const mData = await res.json();
        setMatches(mData.filter((m: any) => m.tournamentId === tournamentId));
      }
    } catch (e) { console.error('Failed to load matches:', e); }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sportsRes, matchesRes] = await Promise.all([
          apiClient.request(`/sports`),
          apiClient.request(`/matches`)
        ]);
        if (sportsRes.ok) {
          const sData = await sportsRes.json();
          setSports(sData);
          if (sData.length > 0) setSelectedSport(sData[0].id);
        }
        if (matchesRes.ok) {
          const mData = await matchesRes.json();
          setMatches(mData.filter((m: any) => m.tournamentId === tournamentId));
        }
      } catch (e) {
        console.error("Error fetching bracket data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tournamentId]);

  const handleSetWinner = async (match: any, winnerId: string) => {
    openModal({
      type: "confirm",
      title: "Xác nhận chốt kết quả",
      description: "Bạn có chắc chắn muốn chốt người chiến thắng? Hệ thống sẽ cập nhật trạng thái trận đấu thành Đã kết thúc và tự động đẩy người thắng vào vòng trong.",
      onConfirm: async () => {
        try {
          let pts = [];
          try { pts = typeof match.participants === 'string' ? JSON.parse(match.participants) : match.participants; } catch (e) { console.error('Failed to parse participants:', e); }
          pts = Array.isArray(pts) ? pts : [];
          
          const newPts = pts.map((p: any) => ({ ...p, isWinner: p.id === winnerId }));
          
          const res = await apiClient.request(`/matches/${match.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "COMPLETED", participants: newPts })
          });
          if (res.ok) {
            loadMatches();
          } else {
            toast.error("Có lỗi khi chốt kết quả.");
          }
        } catch (e) {
          console.error(e);
          toast.error("Đã xảy ra lỗi khi chọn người chiến thắng");
        }
      }
    });
  };

  const handleGenerateBracket = async () => {
    if (!selectedSport) return toast.error("Vui lòng chọn môn thi đấu");
    if (!tournament || !tournament.rankings) return toast.error("Chưa có danh sách VĐV tham gia giải");

    const sportRankings = tournament.rankings
      .filter((r: any) => r.status !== 'BANNED' && r.hasCheckedIn && r.sportId === selectedSport);

    if (sportRankings.length < 2) {
      const sportName = sports.find(s => s.id === selectedSport)?.nameVi || 'này';
      return toast.info(`Cần ít nhất 2 VĐV/Đội hợp lệ đã ĐIỂM DANH môn "${sportName}" để tạo sơ đồ. Hiện tại chỉ có ${sportRankings.length} đủ điều kiện.`);
    }

    const teamIds = sportRankings.map((r: any) => r.id);

    openModal({
      type: "confirm",
      title: "Xác nhận tạo sơ đồ",
      description: `Bạn có chắc muốn tự động chia cặp và tạo/làm mới sơ đồ thi đấu cho ${teamIds.length} VĐV/Đội này?\nLưu ý: Các trận đấu CŨ của môn này sẽ bị xóa bỏ và tạo lại từ đầu.`,
      onConfirm: async () => {
        setGenerating(true);
        try {
          const res = await apiClient.request(`/tournaments/${tournamentId}/generate-bracket`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sportId: selectedSport,
              participantIds: teamIds,
              format: selectedFormat
            })
          });
          if (res.ok) {
            toast.success("Tạo / Làm mới sơ đồ thành công!");
            loadMatches();
          } else {
            toast.error("Có lỗi xảy ra khi tạo sơ đồ.");
          }
        } catch (e) {
          toast.error("Có lỗi xảy ra khi tạo sơ đồ.");
        } finally {
          setGenerating(false);
        }
      }
    });
  };

  const handleMatchClick = (match: any) => {
    let pts = [];
    try { pts = typeof match.participants === 'string' ? JSON.parse(match.participants) : match.participants; } catch (e) { console.error('Failed to parse match participants:', e); }
    pts = Array.isArray(pts) ? pts : [];
    setEditingMatch({ match, pts });
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  const sportMatches = matches.filter(m => m.sportId === selectedSport);
  const rootMatches = sportMatches.filter(m => !m.nextMatchId || !sportMatches.find(sm => sm.id === m.nextMatchId));

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Sơ đồ thi đấu</h2>
        <div className="flex items-center gap-4">
          <Select
            value={selectedFormat}
            onValueChange={(value: string) => setSelectedFormat(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn thể thức" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SINGLE_ELIMINATION">Loại trực tiếp</SelectItem>
              <SelectItem value="ROUND_ROBIN">Đấu vòng tròn</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={selectedSport}
            onValueChange={(value: string) => setSelectedSport(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={sports[0]?.nameVi || "Chọn môn"} />
            </SelectTrigger>
            <SelectContent>
              {sports.map(s => <SelectItem key={s.id} value={s.id}>{s.nameVi}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleGenerateBracket} 
            disabled={loading || generating} 
            isLoading={generating}
            variant="outline"
            className="flex items-center gap-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <Play size={16} /> Tạo / Làm mới sơ đồ
          </Button>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
        {sportMatches.length === 0 ? (
          <div className="text-center py-20 text-slate-500 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
            <p>Chưa có dữ liệu sơ đồ cho môn thi đấu này.<br/>(Vui lòng bấm nút "Tạo / Làm mới sơ đồ" ở trên để hệ thống tự chia cặp từ danh sách VĐV)</p>
          </div>
        ) : sportMatches[0]?.matchFormat === 'ROUND_ROBIN' ? (
          <div className="flex gap-8 overflow-x-auto p-4 w-full">
            {Object.keys(
              sportMatches.reduce((acc, m) => {
                if (!acc[m.round]) acc[m.round] = [];
                acc[m.round].push(m);
                return acc;
              }, {} as Record<string, any[]>)
            ).sort((a, b) => {
              const numA = parseInt(a.replace(/\D/g, '')) || 0;
              const numB = parseInt(b.replace(/\D/g, '')) || 0;
              return numA - numB;
            }).map(round => {
              const roundMatches = sportMatches.filter(m => m.round === round);
              return (
                <div key={round} className="flex flex-col gap-4 min-w-[280px]">
                  <h3 className="font-bold text-slate-700 dark:text-slate-300 text-center bg-slate-200/50 dark:bg-slate-800 py-2 rounded-lg">{round}</h3>
                  {roundMatches.map((m: any) => (
                    <BracketMatchCard key={m.id} match={m} onSetWinner={handleSetWinner} onClick={handleMatchClick} />
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-800 p-8 min-h-[600px] flex items-center shadow-inner">
            <div className="min-w-max mx-auto flex flex-col gap-12">
              {rootMatches.map(match => (
                <div key={match.id} className={match.round === 'Tranh hạng 3' ? 'mt-8 border-t-2 border-dashed border-slate-300 dark:border-slate-700 pt-8' : ''}>
                  {match.round === 'Tranh hạng 3' && <h3 className="text-center font-bold text-amber-600 mb-4">Tranh hạng 3</h3>}
                  <RenderNode 
                    match={match} 
                    matches={sportMatches} 
                    selectedSport={selectedSport} 
                    onSetWinner={handleSetWinner}
                    onClick={handleMatchClick}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={editingMatch !== null} onOpenChange={(open: boolean) => !open && setEditingMatch(null)}>
        <DialogContent className="max-w-md overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <DialogTitle>Cập nhật trận đấu</DialogTitle>
          </DialogHeader>
          {editingMatch && (
            <div className="p-5 space-y-4">
              <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                {editingMatch.pts.map((p: any, idx: number) => (
                  <div key={idx} className={`flex flex-col gap-2 p-3 rounded-md shadow-sm border transition-colors ${p.isWinner ? 'border-amber-400 dark:border-amber-500 bg-amber-50/50 dark:bg-amber-900/10' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                        {p.name || 'Chưa xác định'}
                      </span>
                      <Input 
                        type="number" 
                        placeholder="Điểm" 
                        className="w-20 text-center font-bold"
                        value={p.score ?? ""}
                        onChange={(e) => {
                          const newPts = [...editingMatch.pts];
                          newPts[idx].score = Number(e.target.value);
                          setEditingMatch({...editingMatch, pts: newPts});
                        }}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const newPts = [...editingMatch.pts];
                          const wasNoShow = newPts[idx].noShow;
                          newPts[idx].noShow = !wasNoShow;
                          setEditingMatch({...editingMatch, pts: newPts});
                        }}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${p.noShow ? 'bg-red-100 text-red-600 border-red-200' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}
                      >
                        {p.noShow ? 'Hủy Vắng mặt' : 'Đánh dấu Vắng mặt'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newPts = [...editingMatch.pts];
                          const wasWinner = newPts[idx].isWinner;
                          newPts.forEach(pt => pt.isWinner = false);
                          newPts[idx].isWinner = !wasWinner;
                          setEditingMatch({...editingMatch, pts: newPts});
                        }}
                        className={`text-xs px-2 py-1 flex items-center gap-1 rounded border transition-colors ${p.isWinner ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}
                      >
                        <Trophy size={12} className={p.isWinner ? "fill-current" : ""} /> {p.isWinner ? 'Người thắng' : 'Chọn thắng'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <DialogFooter className="px-0">
                <Button variant="outline" onClick={() => setEditingMatch(null)}>Đóng</Button>
                <Button 
                  disabled={savingMatch} 
                  isLoading={savingMatch}
                  onClick={async () => {
                    setSavingMatch(true);
                    try {
                      // Handle walkover implicitly if one is noShow and other is not, and no winner is selected
                      const pts = [...editingMatch.pts];
                      if (pts.length === 2) {
                        if (pts[0].noShow && !pts[1].noShow && !pts[0].isWinner && !pts[1].isWinner) pts[1].isWinner = true;
                        if (pts[1].noShow && !pts[0].noShow && !pts[0].isWinner && !pts[1].isWinner) pts[0].isWinner = true;
                      }
                      
                      const hasWinner = pts.some(p => p.isWinner);
                      const status = hasWinner ? "COMPLETED" : editingMatch.match.status;
                      const hasNoShow = pts.some(p => p.noShow);
                      const result = hasNoShow ? "Vắng mặt (Walkover)" : editingMatch.match.result;

                      const res = await apiClient.request(`/matches/${editingMatch.match.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status, result, participants: pts })
                      });
                      if (res.ok) {
                        await loadMatches();
                        setEditingMatch(null);
                      } else {
                        const err = await res.json().catch(() => ({}));
                        toast.error(err.message || "Lỗi khi cập nhật");
                      }
                    } finally {
                      setSavingMatch(false);
                    }
                  }}
                >Lưu thay đổi</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
