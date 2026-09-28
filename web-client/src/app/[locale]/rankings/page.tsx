"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useState, useEffect } from "react";
import { Loader2, Award, Trophy, Medal, Filter, ChevronDown } from "lucide-react";
import { useLanguage } from '@/hooks/useTranslation';
import { DataTable } from "@/components/ui/DataTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/card";

import Link from "next/link";

const weightClasses = [
  { id: "49", nameVi: "Dưới 49 kg", nameEn: "Under 49 kg" },
  { id: "54", nameVi: "49 kg - 54 kg", nameEn: "49 kg - 54 kg" },
  { id: "59", nameVi: "55 kg - 59 kg", nameEn: "55 kg - 59 kg" },
  { id: "65", nameVi: "60 kg - 65 kg", nameEn: "60 kg - 65 kg" },
  { id: "72", nameVi: "66 kg - 72 kg", nameEn: "66 kg - 72 kg" },
  { id: "over_72", nameVi: "Trên 72 kg", nameEn: "Over 72 kg" }
];

export default function PublicRankingsPage() {
  const { language } = useLanguage();
  const [sports, setSports] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);

  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [weightClasses, setWeightClasses] = useState<any[]>([]);

  useEffect(() => {
    if (selectedSports.length > 0) {
      apiClient.request(`/sport-events?sportId=${selectedSports[0]}`)
        .then(res => res.ok ? res.json() : [])
        .then(data => setWeightClasses(Array.isArray(data) ? data : []))
        .catch(() => setWeightClasses([]));
    } else {
      setWeightClasses([]);
    }
  }, [selectedSports[0]]);
  const [isSportDropdownOpen, setIsSportDropdownOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [selectedClassification, setSelectedClassification] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [selectedWeightClass, setSelectedWeightClass] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedOrganization, setSelectedOrganization] = useState<string>("");
  const [athleteSearch, setAthleteSearch] = useState<string>("");

  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [availableEvents, setAvailableEvents] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      apiClient.request("/sports").then(res => res.ok ? res.json() : []),
      apiClient.request("/tournaments").then(res => res.ok ? res.json() : []),
      apiClient.request("/sport-classifications").then(res => res.ok ? res.json() : []),
      apiClient.request("/teams").then(res => res.ok ? res.json() : []).catch(() => []),
      apiClient.request("/organizations").then(res => res.ok ? res.json() : []).catch(() => [])
    ]).then(([sportsData, tourneysData, classData, teamsData, orgsData]) => {
      const s = Array.isArray(sportsData) ? sportsData : sportsData.data || [];
      const c = Array.isArray(classData) ? classData : classData.data || [];
      const tData = Array.isArray(teamsData) ? teamsData : teamsData.data || [];
      const oData = Array.isArray(orgsData) ? orgsData : orgsData.data || [];
      setSports(s);
      setTournaments(tourneysData);
      setClassifications(c);
      setTeams(tData);
      setOrganizations(oData);

      if (s.length > 0) {
        setSelectedSports([s[0].id]);
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedSports.length > 0) {
      setLoading(true);
      const query = new URLSearchParams();
      if (selectedTournament && selectedTournament !== "all") query.append("tournamentId", selectedTournament);
      if (selectedClassification && selectedClassification !== "all") query.append("classificationId", selectedClassification);
      if (selectedEvent && selectedEvent !== "all") query.append("event", selectedEvent);
      if (selectedWeightClass && selectedWeightClass !== "all") query.append("weightClass", selectedWeightClass);
      if (selectedTeam && selectedTeam !== "all") query.append("teamId", selectedTeam);
      if (selectedOrganization && selectedOrganization !== "all") query.append("organizationId", selectedOrganization);
      if (athleteSearch) query.append("athleteName", athleteSearch);

      Promise.all(selectedSports.map(sportId =>
        apiClient.request(`/rankings/sport/${sportId}?${query.toString()}`).then(res => res.json())
      ))
        .then(results => {
          const data = results.flat();
          data.sort((a, b) => {
            if (a.sportId !== b.sportId) {
               return a.sport?.nameVi?.localeCompare(b.sport?.nameVi || "") || 0;
            }
            return a.rank - b.rank;
          });

          setRankings(data);

          const events = new Set<string>();
          data.forEach((r: any) => {
            if (r.event) events.add(r.event.name || r.event);
          });
          setAvailableEvents(Array.from(events));
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setRankings([]);
      setAvailableEvents([]);
    }
  }, [selectedSports, selectedTournament, selectedClassification, selectedEvent, selectedWeightClass, selectedTeam, selectedOrganization, athleteSearch]);

  const handleClearFilters = () => {
    setSelectedTournament("");
    setSelectedClassification("");
    setSelectedEvent("");
    setSelectedWeightClass("");
    setSelectedTeam("");
    setSelectedOrganization("");
    setAthleteSearch("");
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Medal size={24} className="text-yellow-500 fill-yellow-50" />;
    if (rank === 2) return <Medal size={24} className="text-slate-400 fill-slate-100" />;
    if (rank === 3) return <Medal size={24} className="text-amber-600 fill-amber-100" />;
    return <span className="font-bold text-slate-500 w-6 text-center inline-block">{rank}</span>;
  };

  const getRowClass = (rank: number) => {
    if (rank === 1) return "bg-yellow-50/50 dark:bg-yellow-900/10 border-l-4 border-yellow-500";
    if (rank === 2) return "bg-slate-50 dark:bg-slate-800/50 border-l-4 border-slate-400";
    if (rank === 3) return "bg-amber-50/50 dark:bg-amber-900/10 border-l-4 border-amber-600";
    return "border-l-4 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50";
  };

  const hasActiveFilters = !!selectedTournament || !!selectedClassification || !!selectedEvent || !!selectedWeightClass || !!selectedTeam || !!selectedOrganization || !!athleteSearch;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar: Filters */}
          <aside className="w-full lg:w-80 shrink-0 space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-base">
                  <Filter size={18} className="text-blue-600" />
                  {language === "vi" ? "Bộ lọc tìm kiếm" : "Search Filters"}
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-xs font-bold text-destructive hover:text-destructive hover:bg-destructive/10 px-2 py-1 h-auto rounded-lg transition-colors"
                    aria-label={language === "vi" ? "Xóa bộ lọc" : "Clear filters"}
                  >
                    {language === "vi" ? "Xóa bộ lọc" : "Clear"}
                  </Button>
                )}
              </div>

              {/* 1. Vận động viên */}
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground" htmlFor="athlete-search">
                  {language === "vi" ? "Vận động viên" : "Athlete"}
                </label>
                <Input
                  id="athlete-search"
                  type="text"
                  value={athleteSearch}
                  onChange={e => setAthleteSearch(e.target.value)}
                  placeholder={language === "vi" ? "Tìm tên vận động viên..." : "Search athlete name..."}
                  aria-label={language === "vi" ? "Tìm tên vận động viên" : "Search athlete name"}
                />
              </div>

              {/* 2. Bộ môn thi đấu */}
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {language === "vi" ? "Bộ môn thi đấu" : "Sport"}
                </label>
                <div className="relative">
                  <button
                    onClick={() => setIsSportDropdownOpen(!isSportDropdownOpen)}
                    className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                  >
                    <span className="truncate text-left flex-1 mr-2">
                      {selectedSports.length === 0
                        ? (language === "vi" ? "Chọn bộ môn" : "Select sports")
                        : selectedSports.length === sports.length
                          ? (language === "vi" ? "Tất cả bộ môn" : "All sports")
                          : selectedSports.map(id => sports.find(s => s.id === id)?.nameVi).join(", ")
                      }
                    </span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform shrink-0 ${isSportDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isSportDropdownOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        <label className="flex items-center gap-3 px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer text-sm font-semibold border-b border-slate-100 dark:border-slate-700 mb-1 pb-2 transition">
                          <input
                            type="checkbox"
                            checked={selectedSports.length === sports.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSports(sports.map(s => s.id));
                              } else {
                                setSelectedSports([]);
                              }
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                          {language === "vi" ? "Chọn tất cả" : "Select All"}
                        </label>
                        {sports.map(sport => (
                          <label key={sport.id} className="flex items-center gap-3 px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer text-sm transition group">
                            <input
                              type="checkbox"
                              checked={selectedSports.includes(sport.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSports([...selectedSports, sport.id]);
                                } else {
                                  setSelectedSports(selectedSports.filter(id => id !== sport.id));
                                }
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                            />
                            <Trophy size={14} className={selectedSports.includes(sport.id) ? "text-blue-500" : "text-slate-400 group-hover:text-blue-400 transition"} />
                            <span className={selectedSports.includes(sport.id) ? "font-semibold text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"}>{sport.nameVi}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Giải đấu */}
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  {language === "vi" ? "Giải đấu" : "Tournament"}
                </label>
                <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                  <SelectTrigger aria-label={language === "vi" ? "Chọn giải đấu" : "Select tournament"}>
                    <SelectValue placeholder={language === "vi" ? "Tất cả giải đấu" : "All Tournaments"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "vi" ? "Tất cả giải đấu" : "All Tournaments"}</SelectItem>
                    {tournaments.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 4. Hạng cân */}
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  {language === "vi" ? "Hạng cân" : "Weight Class"}
                </label>
                <Select value={selectedWeightClass} onValueChange={setSelectedWeightClass}>
                  <SelectTrigger aria-label={language === "vi" ? "Chọn hạng cân" : "Select weight class"}>
                    <SelectValue placeholder={language === "vi" ? "Tất cả hạng cân" : "All Weight Classes"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "vi" ? "Tất cả hạng cân" : "All Weight Classes"}</SelectItem>
                    {weightClasses.map(wc => (
                      <SelectItem key={wc.id} value={wc.id}>{language === "vi" ? wc.nameVi : wc.nameEn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 5. Hạng thương tật */}
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  {language === "vi" ? "Hạng thương tật" : "Disability Class"}
                </label>
                <Select value={selectedClassification} onValueChange={setSelectedClassification}>
                  <SelectTrigger aria-label={language === "vi" ? "Chọn hạng thương tật" : "Select classification"}>
                    <SelectValue placeholder={language === "vi" ? "Tất cả hạng thương tật" : "All Classifications"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "vi" ? "Tất cả hạng thương tật" : "All Classifications"}</SelectItem>
                    {classifications.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.code} {c.description ? `- ${c.description}` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 6. Đội tuyển */}
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  {language === "vi" ? "Đội tuyển" : "Team"}
                </label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger aria-label={language === "vi" ? "Chọn đội tuyển" : "Select team"}>
                    <SelectValue placeholder={language === "vi" ? "Tất cả đội tuyển" : "All Teams"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "vi" ? "Tất cả đội tuyển" : "All Teams"}</SelectItem>
                    {teams.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 7. Câu lạc bộ */}
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  {language === "vi" ? "Câu lạc bộ" : "Club"}
                </label>
                <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
                  <SelectTrigger aria-label={language === "vi" ? "Chọn câu lạc bộ" : "Select club"}>
                    <SelectValue placeholder={language === "vi" ? "Tất cả câu lạc bộ" : "All Clubs"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "vi" ? "Tất cả câu lạc bộ" : "All Clubs"}</SelectItem>
                    {organizations.map(o => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </aside>

          {/* Main Content: Leaderboard */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-blue-600" size={40} />
              </div>
            ) : rankings.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <Award size={64} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                <h2 className="text-xl font-bold mb-2">{language === "vi" ? "Chưa có dữ liệu" : "No data available"}</h2>
                <p className="text-slate-500">{language === "vi" ? "Chưa có bảng xếp hạng cho bộ môn và bộ lọc này." : "Rankings for this filter are not available yet."}</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <DataTable
                  data={rankings.slice((page - 1) * pageSize, page * pageSize)}
                  columns={[
                    { key: "rank", title: language === "vi" ? "Hạng" : "Rank", sortable: true, render: (r) => (
                      <div className="text-center flex justify-center items-center h-full">
                        {getMedalIcon(r.rank)}
                      </div>
                    )},
                    { key: "athlete", title: language === "vi" ? "Vận động viên" : "Athlete", sortable: true, render: (r) => (
                      <Link href={`/users/${r.athlete?.userId || r.athlete?.user?.id}`} className="flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg -mx-2 px-2 py-1 transition-colors group">
                        {r.athlete?.user?.avatarUrl ? (
                          <img src={r.athlete.user.avatarUrl} alt={r.athlete.user.fullName || "Avatar"} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                            {r.athlete?.user?.fullName?.charAt(0) || "U"}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-800 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {r.athlete?.user?.fullName || "N/A"}
                          </div>
                          {r.athlete?.achievements && (
                            <div className="text-xs text-slate-500 truncate max-w-[200px] md:max-w-md">
                              {r.athlete.achievements}
                            </div>
                          )}
                        </div>
                      </Link>
                    )},
                    { key: "team", title: language === "vi" ? "Đội tuyển" : "Team", sortable: true, render: (r) => (
                      <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                        {r.team?.name || r.athlete?.organization?.name || "—"}
                      </span>
                    )},
                    { key: "points", title: language === "vi" ? "Điểm số" : "Points", sortable: true, render: (r) => (
                      <div className="font-black text-lg text-slate-700 dark:text-slate-300">
                        {r.points.toLocaleString()}
                      </div>
                    )}
                  ]}
                  totalRecords={rankings.length}
                  page={page}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  searchValue=""
                  searchPlaceholder=""
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
