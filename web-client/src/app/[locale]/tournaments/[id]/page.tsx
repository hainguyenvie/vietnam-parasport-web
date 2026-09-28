"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";
import { formatDate } from "@/lib/date-utils";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Calendar, MapPin, Users, Activity, Trophy } from "lucide-react";
import { useLanguage } from '@/hooks/useTranslation';
import Link from "next/link";
import PublicBracketTab from "./PublicBracketTab";
import { MatchCard } from "@/components/shared/MatchCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";

import Image from 'next/image';

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"matches" | "bracket" | "participants">("matches");

  const [matchPage, setMatchPage] = useState(1);
  const [matchPageSize, setMatchPageSize] = useState(10);
  const [matchSearch, setMatchSearch] = useState("");
  
  const [participantPage, setParticipantPage] = useState(1);
  const [participantPageSize, setParticipantPageSize] = useState(10);
  const [participantSearch, setParticipantSearch] = useState("");

  useEffect(() => {
    apiClient.request(`/tournaments/${params?.id}`)
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data) setTournament(data);
      })
      .catch(err => {
        // silently ignore fetch errors
      })
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-center p-4">
        <Trophy size={64} className="text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Giải đấu không tồn tại</h2>
        <button onClick={() => router.back()} className="text-blue-600 font-bold flex items-center gap-2">
          <ArrowLeft size={16} /> Quay lại
        </button>
      </div>
    );
  }

  const getStatusDisplay = (status: string) => {
    if (status === "UPCOMING") return language === "vi" ? "Sắp diễn ra" : "Upcoming";
    if (status === "ONGOING") return language === "vi" ? "Đang diễn ra" : "Ongoing";
    if (status === "COMPLETED") return language === "vi" ? "Đã kết thúc" : "Completed";
    return status;
  };

  // Get unique participants from rankings
  const uniqueParticipants = Array.from(
    new Map((tournament.rankings || []).map((r: any) => [r.athleteId, r.athlete])).values()
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* HEADER */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        <img 
          src={tournament.bannerUrl || "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=1200"} 
          alt={tournament.name} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 text-white">
          <div className="container mx-auto max-w-5xl">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-4 text-sm font-bold">
              <ArrowLeft size={16} /> {language === "vi" ? "Danh sách giải đấu" : "Tournaments"}
            </button>
            <div className="inline-block px-3 py-1 bg-blue-600 rounded-full text-xs font-bold uppercase tracking-wider mb-3 shadow-sm">
              {getStatusDisplay(tournament.status)}
            </div>
            <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">{tournament.name}</h1>
            <div className="flex flex-wrap items-center gap-6 text-white/90 text-sm md:text-base font-medium">
              <span className="flex items-center gap-2"><Calendar size={18} /> {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</span>
              <span className="flex items-center gap-2"><MapPin size={18} /> {tournament.location || "Đang cập nhật"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="container mx-auto px-4 max-w-7xl mt-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-2 flex overflow-x-auto hide-scrollbar mb-8">
          <button 
            onClick={() => setActiveTab("matches")} 
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'matches' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Activity size={18} /> {language === "vi" ? "Danh sách trận" : "Matches"}
          </button>
          <button 
            onClick={() => setActiveTab("bracket")} 
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'bracket' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Trophy size={18} /> {language === "vi" ? "Sơ đồ thi đấu" : "Bracket"}
          </button>
          <button 
            onClick={() => setActiveTab("participants")} 
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'participants' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Users size={18} /> {language === "vi" ? "Vận động viên" : "Participants"}
          </button>
        </div>

        {activeTab === "matches" && (
          <div className="space-y-4">
            {(!tournament.matches || tournament.matches.length === 0) ? (
              <EmptyState 
                title={language === "vi" ? "Chưa có trận đấu nào" : "No matches yet"}
                description={language === "vi" ? "Chưa có trận đấu nào trong giải này." : "No matches in this tournament yet."}
              />
            ) : (
              <DataTable
                data={(tournament.matches || []).filter((m: any) => m.title?.toLowerCase().includes(matchSearch.toLowerCase())).slice((matchPage - 1) * matchPageSize, matchPage * matchPageSize)}
                columns={[
                  { key: "title", title: language === "vi" ? "Tên trận đấu" : "Title", sortable: true, render: (m: any) => <span className="font-semibold text-slate-800 dark:text-white">{m.title}</span> },
                  { key: "sport", title: language === "vi" ? "Môn thể thao" : "Sport", render: (m: any) => m.sport?.nameVi || m.sportId },
                  { key: "round", title: language === "vi" ? "Vòng đấu" : "Round", render: (m: any) => m.round || "-" },
                  { key: "startTime", title: language === "vi" ? "Thời gian" : "Time", sortable: true, render: (m: any) => m.startTime ? new Date(m.startTime).toLocaleString() : "TBA" },
                  { key: "status", title: language === "vi" ? "Trạng thái" : "Status", render: (m: any) => <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${m.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' : m.status === 'ONGOING' ? 'bg-amber-100 text-amber-800' : m.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{getStatusDisplay(m.status)}</span> },
                ]}
                totalRecords={(tournament.matches || []).filter((m: any) => m.title?.toLowerCase().includes(matchSearch.toLowerCase())).length}
                page={matchPage}
                pageSize={matchPageSize}
                onPageChange={setMatchPage}
                onPageSizeChange={setMatchPageSize}
                searchValue={matchSearch}
                onSearchChange={setMatchSearch}
                searchPlaceholder={language === "vi" ? "Tìm kiếm trận đấu..." : "Search matches..."}
              />
            )}
          </div>
        )}

        {activeTab === "bracket" && (
          <PublicBracketTab tournament={tournament} />
        )}

        {activeTab === "participants" && (
          <div className="space-y-4">
            {uniqueParticipants.length === 0 ? (
              <div className="col-span-full">
                <EmptyState 
                  title={language === "vi" ? "Chưa có danh sách" : "No participants"}
                  description={language === "vi" ? "Chưa có danh sách vận động viên." : "No participants listed yet."}
                />
              </div>
            ) : (
              <DataTable
                data={uniqueParticipants.filter((a: any) => a.user?.fullName?.toLowerCase().includes(participantSearch.toLowerCase())).slice((participantPage - 1) * participantPageSize, participantPage * participantPageSize)}
                columns={[
                  { key: "avatar", title: language === "vi" ? "Ảnh" : "Avatar", render: (a: any) => (
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                      <img src={a.user?.avatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(a.user?.fullName || "A") + "&background=random"} alt={a.user?.fullName} className="w-full h-full object-cover" />
                    </div>
                  )},
                  { key: "name", title: language === "vi" ? "Họ tên" : "Full Name", sortable: true, render: (a: any) => <span className="font-semibold">{a.user?.fullName}</span> },
                  { key: "sport", title: language === "vi" ? "Môn thể thao" : "Sport", render: (a: any) => a.sport?.nameVi || "Vận động viên" },
                  { key: "disability", title: language === "vi" ? "Hạng thương tật" : "Disability Class", render: (a: any) => <span className="font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">{a.disabilityClass || "Đang cập nhật"}</span> },
                ]}
                totalRecords={uniqueParticipants.filter((a: any) => a.user?.fullName?.toLowerCase().includes(participantSearch.toLowerCase())).length}
                page={participantPage}
                pageSize={participantPageSize}
                onPageChange={setParticipantPage}
                onPageSizeChange={setParticipantPageSize}
                searchValue={participantSearch}
                onSearchChange={setParticipantSearch}
                searchPlaceholder={language === "vi" ? "Tìm kiếm VĐV..." : "Search athletes..."}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
