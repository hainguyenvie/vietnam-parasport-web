"use client";

import { apiClient } from "@/lib/api-client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Calendar, MapPin, Trophy, PlayCircle, Info, BarChart2, GitFork } from "lucide-react";
import { useLanguage } from '@/hooks/useTranslation';
import { useLiveScore } from "@/hooks/useLiveScore";
import { MatchDetailSkeleton } from "./MatchDetailSkeleton";
import Link from "next/link";
import PostInteractions from "@/components/PostInteractions";

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"timeline" | "lineups" | "stats" | "bracket">("timeline");

  useLiveScore({
    matchId: params?.id as string,
    onScoreUpdate: (data) => {
      setMatch((prev: any) => prev ? { ...prev, ...data } : data);
    },
  });

  useEffect(() => {
    apiClient.request(`/matches/${params?.id}`)
      .then(res => {
        if (!res.ok) throw new Error("Match not found");
        return res.json();
      })
      .then(data => setMatch(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) return <MatchDetailSkeleton />;

  if (!match) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-center p-4">
        <Trophy size={64} className="text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Trận đấu không tồn tại</h2>
        <button onClick={() => router.back()} className="text-blue-600 font-bold flex items-center gap-2">
          <ArrowLeft size={16} /> Quay lại
        </button>
      </div>
    );
  }

  const getStatusDisplay = (status: string) => {
    if (status === "SCHEDULED") return language === "vi" ? "Sắp diễn ra" : "Scheduled";
    if (status === "ONGOING") return language === "vi" ? "Đang diễn ra" : "Ongoing";
    if (status === "COMPLETED") return language === "vi" ? "Đã kết thúc" : "Completed";
    return status;
  };

  const isTeamSport = match.title.toLowerCase().includes("bóng") || match.title.toLowerCase().includes("đội");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* HEADER: SCOREBOARD */}
      <div className="bg-gradient-to-b from-blue-900 to-slate-900 text-white pt-8 pb-12 shadow-xl">
        <div className="container mx-auto px-4 max-w-5xl">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-6 text-sm font-bold">
            <ArrowLeft size={16} /> {language === "vi" ? "Lịch thi đấu" : "Matches"}
          </button>

          <div className="text-center mb-6">
            {match.tournament && (
              <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-sm border border-white/10">
                {match.tournament.name} • {match.round || "Vòng loại"}
              </div>
            )}
            <h1 className="text-2xl md:text-3xl font-black mb-2">{match.title}</h1>
            <div className="flex items-center justify-center gap-4 text-blue-200 text-sm font-medium">
              <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(match.startTime).toLocaleString()}</span>
              <span className="flex items-center gap-1"><MapPin size={14} /> {match.location}</span>
            </div>
          </div>

          <div className="glass-card bg-white/5 border border-white/10 p-6 md:p-8 rounded-3xl backdrop-blur-md max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            {match.participants && match.participants.length >= 2 ? (
              <>
                {/* Team 1 */}
                <div className={`flex-1 flex flex-col items-center text-center transition-opacity ${match.status === 'COMPLETED' && match.participants[0].isWinner === false ? 'opacity-40 grayscale' : ''}`}>
                  <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-4xl md:text-5xl shadow-inner mb-4 relative ${match.status === 'COMPLETED' && match.participants[0].isWinner ? 'bg-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.5)] border-2 border-yellow-400' : 'bg-white/10'}`}>
                    {match.participants[0].flag || "👤"}
                    {match.status === 'COMPLETED' && match.participants[0].isWinner && (
                      <div className="absolute -top-3 -right-3 bg-yellow-400 text-yellow-900 p-1.5 rounded-full shadow-lg">
                        <Trophy size={16} />
                      </div>
                    )}
                  </div>
                  <h3 className={`text-lg md:text-xl font-bold ${match.status === 'COMPLETED' && match.participants[0].isWinner ? 'text-yellow-400' : ''}`}>{match.participants[0].name}</h3>
                </div>

                {/* Score / Status */}
                <div className="flex flex-col items-center justify-center shrink-0">
                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase mb-4 flex items-center gap-2 ${match.status === 'ONGOING' ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-blue-500/30 text-blue-100'}`}>
                    {match.status === 'ONGOING' && <PlayCircle size={14} />}
                    {getStatusDisplay(match.status)}
                  </div>
                  
                  {match.result ? (
                    <div className="text-4xl md:text-6xl font-black tracking-tighter">
                      {match.result}
                    </div>
                  ) : match.status === 'SCHEDULED' ? (
                    <div className="text-2xl font-bold text-white/50">VS</div>
                  ) : (
                    <div className="text-3xl md:text-5xl font-black tracking-tighter flex items-center gap-4">
                      <span>{match.participants[0].score || 0}</span>
                      <span className="text-white/30">-</span>
                      <span>{match.participants[1].score || 0}</span>
                    </div>
                  )}
                </div>

                {/* Team 2 */}
                <div className={`flex-1 flex flex-col items-center text-center transition-opacity ${match.status === 'COMPLETED' && match.participants[1].isWinner === false ? 'opacity-40 grayscale' : ''}`}>
                  <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-4xl md:text-5xl shadow-inner mb-4 relative ${match.status === 'COMPLETED' && match.participants[1].isWinner ? 'bg-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.5)] border-2 border-yellow-400' : 'bg-white/10'}`}>
                    {match.participants[1].flag || "👤"}
                    {match.status === 'COMPLETED' && match.participants[1].isWinner && (
                      <div className="absolute -top-3 -right-3 bg-yellow-400 text-yellow-900 p-1.5 rounded-full shadow-lg">
                        <Trophy size={16} />
                      </div>
                    )}
                  </div>
                  <h3 className={`text-lg md:text-xl font-bold ${match.status === 'COMPLETED' && match.participants[1].isWinner ? 'text-yellow-400' : ''}`}>{match.participants[1].name}</h3>
                </div>
              </>
            ) : (
              <div className="w-full text-center py-8">
                <div className="text-4xl font-black mb-2">{match.result || "Đang cập nhật"}</div>
                <div className="text-blue-200">Kết quả</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT TABS */}
      <div className="container mx-auto px-4 max-w-4xl -mt-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-2 flex overflow-x-auto hide-scrollbar relative z-10">
          <button onClick={() => setActiveTab("timeline")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'timeline' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <Info size={18} /> Diễn biến
          </button>
          <button onClick={() => setActiveTab("lineups")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'lineups' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <Trophy size={18} /> {isTeamSport ? "Đội hình" : "Thành phần"}
          </button>
          <button onClick={() => setActiveTab("stats")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'stats' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <BarChart2 size={18} /> Thống kê
          </button>
          <button onClick={() => setActiveTab("bracket")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'bracket' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <GitFork size={18} className="rotate-90" /> Sơ đồ giải
          </button>
        </div>

        <div className="mt-8">
          {/* TIMELINE TAB */}
          {activeTab === "timeline" && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">
              <h2 className="text-xl font-bold mb-8">Dòng thời gian</h2>
              
              {(!match.events || match.events.length === 0) ? (
                <div className="text-center py-12 text-slate-500">Chưa có dữ liệu diễn biến cho trận đấu này.</div>
              ) : (
                <div className="relative border-l-2 border-slate-100 dark:border-slate-700 ml-4 md:ml-20 space-y-8">
                  {match.events.map((event: any, idx: number) => {
                    const isScore = event.type === 'SCORE';
                    const isHighlight = event.type === 'HIGHLIGHT';
                    const isFoul = event.type === 'FOUL' || event.type === 'PENALTY';
                    
                    return (
                      <div key={idx} className="relative pl-6 md:pl-8">
                        {/* Timeline dot */}
                        <div className={`absolute w-6 h-6 rounded-full -left-[13px] top-0 border-4 border-white dark:border-slate-800 flex items-center justify-center
                          ${isScore ? 'bg-green-500' : isHighlight ? 'bg-amber-500' : isFoul ? 'bg-red-500' : 'bg-blue-500'}
                        `}></div>
                        
                        {/* Minute indicator */}
                        <div className="absolute -left-16 top-0 w-12 text-right hidden md:block font-bold text-slate-400">
                          {event.minute}
                        </div>
                        
                        {/* Event Content */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                          <div className="md:hidden text-sm font-bold text-blue-600 mb-1">{event.minute}</div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{event.description}</div>
                          {event.teamOrAthlete && event.teamOrAthlete !== 'Chung' && (
                            <div className="mt-2 text-sm text-slate-500 flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full ${isFoul ? 'bg-red-400' : 'bg-slate-300'}`}></div>
                              {event.teamOrAthlete}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* LINEUPS TAB */}
          {activeTab === "lineups" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {match.participants?.map((p: any, idx: number) => (
                <div key={idx} className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">
                  <div className="flex items-center gap-4 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                    <div className="text-3xl">{p.flag || "👤"}</div>
                    <h2 className="text-xl font-bold">{p.name}</h2>
                  </div>
                  {p.members && p.members.length > 0 ? (
                    <div className="space-y-3">
                      {p.members.map((memberId: string, i: number) => (
                        <div key={memberId} className="flex justify-between items-center py-2 text-slate-600 dark:text-slate-400 border-b border-slate-50 dark:border-slate-800">
                          <span className="font-medium">{i + 1}. Thành viên ID: {memberId.substring(0,6)}...</span>
                        </div>
                      ))}
                      <div className="text-center text-sm text-slate-400 mt-4 italic">Danh sách thành viên thực tế</div>
                    </div>
                  ) : isTeamSport ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 text-slate-600 dark:text-slate-400 border-b border-slate-50 dark:border-slate-800">
                        <span className="font-medium">1. Nguyễn Văn A</span> <span className="text-xs font-bold uppercase">Thủ môn</span>
                      </div>
                      <div className="flex justify-between items-center py-2 text-slate-600 dark:text-slate-400 border-b border-slate-50 dark:border-slate-800">
                        <span className="font-medium">7. Trần Văn B</span> <span className="text-xs font-bold uppercase text-blue-500">Đội trưởng</span>
                      </div>
                      <div className="flex justify-between items-center py-2 text-slate-600 dark:text-slate-400 border-b border-slate-50 dark:border-slate-800">
                        <span className="font-medium">10. Lê Văn C</span> <span className="text-xs font-bold uppercase">Tiền đạo</span>
                      </div>
                      <div className="text-center text-sm text-slate-400 mt-4 italic">Dữ liệu đội hình minh họa</div>
                    </div>
                  ) : (
                    <div className="space-y-4 text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span className="font-medium">Hạng thương tật:</span> <span>S4 / T54</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Thành tích tốt nhất:</span> <span>{match.title?.includes("Cử tạ") ? "183 kg" : "38.00s"}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* STATS TAB */}
          {activeTab === "stats" && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">
              <h2 className="text-xl font-bold mb-8 text-center">{language === "vi" ? "Thống kê trận đấu" : "Match Statistics"}</h2>
              <div className="max-w-2xl mx-auto space-y-6">
                {match.participants?.length >= 2 && (() => {
                  const p1 = match.participants[0];
                  const p2 = match.participants[1];
                  const p1Score = Number(p1.score) || 0;
                  const p2Score = Number(p2.score) || 0;
                  const total = p1Score + p2Score || 1;
                  return (
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-sm font-bold mb-2">
                          <span className="text-slate-700 dark:text-slate-300">{p1Score}</span>
                          <span className="text-slate-500">{language === "vi" ? "Điểm số" : "Score"}</span>
                          <span className="text-slate-700 dark:text-slate-300">{p2Score}</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full flex overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${Math.round((p1Score / total) * 100)}%` }} />
                          <div className="h-full bg-amber-500" style={{ width: `${Math.round((p2Score / total) * 100)}%` }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                          <p className="text-sm font-bold text-slate-500">{p1.name || "Player 1"}</p>
                          {p1.isWinner && <span className="text-xs font-bold text-amber-600">🏆 {language === "vi" ? "Thắng" : "Winner"}</span>}
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                          <p className="text-sm font-bold text-slate-500">{p2.name || "Player 2"}</p>
                          {p2.isWinner && <span className="text-xs font-bold text-amber-600">🏆 {language === "vi" ? "Thắng" : "Winner"}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })()}
                {(!match.participants || match.participants.length < 2) && (
                  <p className="text-center text-slate-400 text-sm py-8">{language === "vi" ? "Chưa có dữ liệu thống kê." : "No statistics available."}</p>
                )}
                <div className="text-center text-xs text-slate-400">
                  <p>{language === "vi" ? "Trạng thái" : "Status"}: {match.status} | {language === "vi" ? "Vòng" : "Round"}: {match.round || "—"}</p>
                  {match.result && <p>{language === "vi" ? "Kết quả" : "Result"}: {match.result}</p>}
                </div>
              </div>
            </div>
          )}

          {/* BRACKET TAB */}
          {activeTab === "bracket" && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8 overflow-x-auto">
              <h2 className="text-xl font-bold mb-8 text-center text-slate-800 dark:text-slate-200">{language === "vi" ? "Sơ đồ thi đấu" : "Tournament Bracket"}</h2>
              {match.tournament ? (
                <div className="text-center space-y-4">
                  <GitFork size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">{language === "vi" ? "Giải đấu" : "Tournament"}: <span className="font-bold">{match.tournament.name}</span></p>
                  <Link href={`/tournaments/${match.tournament.id}?tab=bracket`} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition">
                    <Trophy size={16} /> {language === "vi" ? "Xem sơ đồ đầy đủ" : "View Full Bracket"}
                  </Link>
                  {match.round && (
                    <p className="text-xs text-slate-400">{language === "vi" ? "Vòng hiện tại" : "Current round"}: {match.round}</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <GitFork size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  {language === "vi" ? "Trận đấu này không nằm trong một giải đấu." : "This match is not part of a tournament."}
                </div>
              )}
            </div>
          )}


        </div>

        {/* BÌNH LUẬN TRẬN ĐẤU */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8 mt-8">
          <PostInteractions matchId={match.id} />
        </div>
      </div>
    </div>
  );
}
